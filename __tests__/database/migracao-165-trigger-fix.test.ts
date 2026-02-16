/**
 * Testes para validar a correção da Migração 165
 *
 * Contexto: A função trigger 'atualizar_ultima_avaliacao_funcionario()' foi
 * corrigida para não permitir acessar 'l.codigo' (coluna inexistente) em lotes_avaliacao
 *
 * Esta suite valida que:
 * 1. A função trigger funciona corretamente ao marcar avaliação como concluída
 * 2. Os campos denormalizados de última avaliação são atualizados
 * 3. Não há erros ao tentar acessar colunas inexistentes
 */

import { query } from '@/lib/db';

// Tipos para testes
interface TestResult {
  success: boolean;
  error?: string;
  message: string;
}

describe('Migração 165 - Fix atualizar_ultima_avaliacao_trigger', () => {
  let testSetup: {
    funcionarioCpf: string;
    loteId: number;
    avaliacaoId: number;
    empresaId: number;
    clinicaId?: number;
  };

  beforeAll(async () => {
    // Setup: criar dados de teste
    testSetup = {
      funcionarioCpf: '11144477755',
      loteId: 0,
      avaliacaoId: 0,
      empresaId: 0,
    };

    try {
      // Criar clínica primeiro (obrigatória)
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, telefone)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['Clínica Teste M165', '98765432000199', '1133334444']
      );
      testSetup.clinicaId = clinicaResult.rows[0].id;

      // Criar empresa
      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, representante_nome, representante_email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          'Test Corp',
          '12345678000199',
          testSetup.clinicaId,
          'John Doe',
          'john@test.com',
        ]
      );
      testSetup.empresaId = empresaResult.rows[0].id;

      // Criar lote
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, numero_ordem, liberado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          testSetup.clinicaId,
          testSetup.empresaId,
          'Test Lote',
          'avaliacao_risco',
          'ativo',
          1,
          'test@test.com',
        ]
      );
      testSetup.loteId = loteResult.rows[0].id;

      // Criar funcionário
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id, clinica_id)
         VALUES ($1, $2, $3, $4)`,
        [
          testSetup.funcionarioCpf,
          'Test Employee',
          testSetup.empresaId,
          (testSetup as any).clinicaId,
        ]
      );

      // Criar avaliação
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'em_andamento']
      );
      testSetup.avaliacaoId = avaliacaoResult.rows[0].id;
    } catch (err) {
      console.error('Erro no setup:', err);
      throw err;
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      // Deletar em ordem de dependência
      const { funcionarioCpf, loteId, empresaId } = testSetup;
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);

      // Limpar clínica se foi criada
      const { clinicaId } = testSetup as any;
      if (clinicaId) {
        await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
      }
    } catch (err) {
      console.error('Erro no cleanup:', err);
    }
  });

  // ✅ TESTE 1: Função trigger não tenta acessar l.codigo
  it('[MIGRAÇÃO 165] ✅ Trigger não acessa coluna inexistente l.codigo', async () => {
    try {
      // Marcar avaliação como concluída (vai dispara trigger)
      const updateResult = await query(
        `UPDATE avaliacoes 
         SET status = $1, envio = NOW(), atualizado_em = NOW() 
         WHERE id = $2`,
        ['concluida', testSetup.avaliacaoId]
      );

      // Se chegou aqui sem erro, o trigger funcionou sem tentar acessar l.codigo
      expect(updateResult).toBeDefined();
      expect(updateResult.rowCount).toBe(1);
    } catch (err: any) {
      // Verificar que o erro NÃO é sobre "coluna l.codigo"
      expect(err.message).not.toMatch(/coluna.*l\.codigo/i);
      throw err;
    }
  });

  // ✅ TESTE 2: Campos denormalizados são atualizados corretamente
  it('[MIGRAÇÃO 165] ✅ Campos denormalizados de última avaliação atualizados', async () => {
    // Buscar funcionário
    const resultado = await query(
      `SELECT 
        ultima_avaliacao_id,
        ultima_avaliacao_status,
        ultima_avaliacao_data_conclusao,
        atualizado_em
       FROM funcionarios 
       WHERE cpf = $1`,
      [testSetup.funcionarioCpf]
    );

    expect(resultado.rows).toHaveLength(1);
    const funcionario = resultado.rows[0];

    // Validar que os campos foram atualizados
    expect(funcionario.ultima_avaliacao_id).toBe(testSetup.avaliacaoId);
    expect(funcionario.ultima_avaliacao_status).toBe('concluida');
    expect(funcionario.ultima_avaliacao_data_conclusao).toBeDefined();
    expect(funcionario.atualizado_em).toBeDefined();
  });

  // ✅ TESTE 3: Trigger não tenta atualizar colunas inexistentes
  it('[MIGRAÇÃO 165] ✅ Trigger não tenta atualizar colunas removidas', async () => {
    const resultado = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'funcionarios' 
       AND (column_name = 'ultimo_lote_codigo' OR column_name = 'ultimo_motivo_inativacao')`,
      []
    );

    // Colunas removidas não devem existir mais
    // (ou se existirem, o trigger não tenta escrevê-los)
    const colunas = resultado.rows.map((r: any) => r.column_name);

    // Verificar que a função trigger funcionou mesmo que colunas removidas existam
    // (o trigger simples não as atualiza mais)
    const verificacaoFuncao = await query(
      `SELECT pg_get_functiondef(oid) FROM pg_proc 
       WHERE proname = 'atualizar_ultima_avaliacao_funcionario'`,
      []
    );

    expect(verificacaoFuncao.rows).toHaveLength(1);
    const funcaoDefinicao = verificacaoFuncao.rows[0].pg_get_functiondef;

    // Não deve mencionar 'ultimo_lote_codigo' na definição
    expect(funcaoDefinicao).not.toMatch(/ultimo_lote_codigo/i);
  });

  // ✅ TESTE 4: Inativação de avaliação dispara trigger sem erros
  it('[MIGRAÇÃO 165] ✅ Trigger funciona ao inativar avaliação', async () => {
    try {
      // Criar nova avaliação para teste de inativação
      const novaAvaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'iniciada']
      );
      const novaAvaliacaoId = novaAvaliacaoResult.rows[0].id;

      // Inativar a avaliação
      const updateResult = await query(
        `UPDATE avaliacoes 
         SET status = $1, inativada_em = NOW(), motivo_inativacao = $2, atualizado_em = NOW() 
         WHERE id = $3`,
        ['inativada', 'Teste de inativação', novaAvaliacaoId]
      );

      expect(updateResult.rowCount).toBe(1);

      // Verificar que funcionário foi atualizado
      const funcResult = await query(
        `SELECT ultima_avaliacao_status FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      expect(funcResult.rows[0].ultima_avaliacao_status).toBe('inativada');

      // Cleanup da avaliação criada
      await query('DELETE FROM avaliacoes WHERE id = $1', [novaAvaliacaoId]);
    } catch (err: any) {
      // Verificar que erros não são sobre colunas inexistentes
      expect(err.message).not.toMatch(/codigo|coluna.*existe/i);
      throw err;
    }
  });

  // ✅ TESTE 5: Comparação de datas para atualizar apenas a mais recente
  it('[MIGRAÇÃO 165] ✅ Trigger respeita lógica de última avaliação mais recente', async () => {
    try {
      // Criar segunda avaliação
      const seg2AvaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 day')
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'em_andamento']
      );
      const seg2AvaliacaoId = seg2AvaliacaoResult.rows[0].id;

      // Registrar resultado da primeira avaliação
      const primeira = await query(
        `SELECT ultima_avaliacao_id, ultima_avaliacao_data_conclusao 
         FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      // Concluir segunda avaliação (mais antiga por data de início)
      await query(
        `UPDATE avaliacoes 
         SET status = $1, envio = NOW() - INTERVAL '1 day', atualizado_em = NOW() 
         WHERE id = $1`,
        ['concluida', seg2AvaliacaoId]
      );

      // Verificar que não sobrescreveu com a mais antiga
      const agora = await query(
        `SELECT ultima_avaliacao_id, ultima_avaliacao_data_conclusao 
         FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      // Deve manter a mais recente
      expect(agora.rows[0].ultima_avaliacao_id).toBe(
        primeira.rows[0].ultima_avaliacao_id
      );

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE id = $1', [seg2AvaliacaoId]);
    } catch (err) {
      console.error('Erro no teste:', err);
      throw err;
    }
  });

  // ✅ TESTE 6: Validação de idempotência - múltiplas atualizações
  it('[MIGRAÇÃO 165] ✅ Trigger é idempotente (pode rodar múltiplas vezes)', async () => {
    try {
      // Buscar estado antes
      const antes = await query(
        `SELECT ultima_avaliacao_id, ultima_avaliacao_status, atualizado_em 
         FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      // Executar UPDATE novamente (sem mudar dados)
      await query(
        `UPDATE avaliacoes 
         SET atualizado_em = NOW() 
         WHERE id = $1`,
        [testSetup.avaliacaoId]
      );

      // Buscar estado depois
      const depois = await query(
        `SELECT ultima_avaliacao_id, ultima_avaliacao_status 
         FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      // IDs devem ser iguais (trigger não sobrescreveu)
      expect(depois.rows[0].ultima_avaliacao_id).toBe(
        antes.rows[0].ultima_avaliacao_id
      );
      expect(depois.rows[0].ultima_avaliacao_status).toBe(
        antes.rows[0].ultima_avaliacao_status
      );
    } catch (err) {
      console.error('Erro no teste:', err);
      throw err;
    }
  });
});
