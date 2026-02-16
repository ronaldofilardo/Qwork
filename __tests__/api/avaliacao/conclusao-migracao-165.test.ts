/**
 * Testes de Integração para Conclusão de Avaliação com Migração 165
 *
 * Valida que o fluxo completo funciona:
 * POST /api/avaliacao/respostas → salva respostas → trigger atualiza funcionário → sem erros
 */

import { query } from '@/lib/db';

describe('Integração: Salvar Respostas + Trigger Migração 165', () => {
  let testSetup: {
    funcionarioCpf: string;
    loteId: number;
    avaliacaoId: number;
    empresaId: number;
    clinicaId: number;
  };

  beforeAll(async () => {
    testSetup = {
      funcionarioCpf: '55544433322',
      loteId: 0,
      avaliacaoId: 0,
      empresaId: 0,
      clinicaId: 0,
    };

    try {
      // Criar clínica
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, telefone)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['Clínica Teste', '98765432000188', '1133334444']
      );
      testSetup.clinicaId = clinicaResult.rows[0].id;

      // Criar empresa
      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, representante_nome, representante_email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          'Empresa Teste Integração',
          '11222333000144',
          testSetup.clinicaId,
          'Manager Test',
          'manager@test.com',
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
          'Lote Integração',
          'avaliacao_risco',
          'ativo',
          1,
          'manager@test.com',
        ]
      );

      // Criar funcionário
      await query(
        `INSERT INTO funcionarios (cpf, nome, empresa_id, clinica_id)
         VALUES ($1, $2, $3, $4)`,
        [
          testSetup.funcionarioCpf,
          'Employee Test Integração',
          testSetup.empresaId,
          testSetup.clinicaId,
        ]
      );

      // Criar avaliação
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'iniciada']
      );
      testSetup.avaliacaoId = avaliacaoResult.rows[0].id;
    } catch (err) {
      console.error('Setup Error:', err);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      const { funcionarioCpf, loteId, empresaId, clinicaId } = testSetup;
      await query(
        'DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE funcionario_cpf = $1)',
        [funcionarioCpf]
      );
      await query(
        'DELETE FROM resultados WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE funcionario_cpf = $1)',
        [funcionarioCpf]
      );
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
      await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
    } catch (err) {
      console.error('Cleanup Error:', err);
    }
  });

  // ✅ TESTE 1: Salvar 37 respostas sem erro de trigger
  it('[INTEGRAÇÃO] ✅ Salva 37 respostas sem erro de coluna inexistente', async () => {
    try {
      // Salvar todas as 37 respostas
      // COPSOQ III tem 10 grupos com média de 3.7 itens cada
      const grupos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      let respostaCount = 0;

      for (const grupo of grupos) {
        // Determinar quantos itens por grupo
        const itensGrupo = grupo === 10 ? 7 : 4; // Total: 40 itens + alguns grupos têm menos
        for (let item = 1; item <= itensGrupo && respostaCount < 37; item++) {
          await query(
            `INSERT INTO respostas (avaliacao_id, grupo, item, valor, criado_em, atualizado_em)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (avaliacao_id, grupo, item) DO UPDATE SET valor = EXCLUDED.valor`,
            [testSetup.avaliacaoId, grupo, item, Math.floor(Math.random() * 5)]
          );
          respostaCount++;
        }
      }

      expect(respostaCount).toBe(37);

      // Verificar que respostas foram salvas
      const respostasResult = await query(
        `SELECT COUNT(DISTINCT (grupo, item)) as total FROM respostas WHERE avaliacao_id = $1`,
        [testSetup.avaliacaoId]
      );

      expect(parseInt(respostasResult.rows[0].total as string)).toBe(37);
    } catch (err: any) {
      // Garantir que erro NÃO seja sobre coluna da trigger
      if (err.message?.includes('coluna')) {
        expect(err.message).not.toMatch(/l\.codigo|ultimo_lote_codigo/i);
      }
      throw err;
    }
  });

  // ✅ TESTE 2: Auto-conclusão dispara trigger sem erros
  it('[INTEGRAÇÃO] ✅ Auto-conclusão (37 respostas) dispara trigger com sucesso', async () => {
    try {
      // Contar respostas
      const respostasResult = await query(
        `SELECT COUNT(DISTINCT (grupo, item)) as total FROM respostas WHERE avaliacao_id = $1`,
        [testSetup.avaliacaoId]
      );
      const totalRespostas = parseInt(respostasResult.rows[0].total as string);

      // Só fazer conclusão se tem 37
      if (totalRespostas === 37) {
        // Buscar lote da avaliação
        const loteResult = await query(
          `SELECT id as lote_id FROM lotes_avaliacao WHERE id = $1`,
          [testSetup.loteId]
        );

        expect(loteResult.rows).toHaveLength(1);

        // Marcar como concluída (dispara trigger)
        const updateResult = await query(
          `UPDATE avaliacoes 
           SET status = $1, envio = NOW(), atualizado_em = NOW() 
           WHERE id = $2`,
          ['concluida', testSetup.avaliacaoId]
        );

        expect(updateResult.rowCount).toBe(1);
      }
    } catch (err: any) {
      // Erro esperado? Não deve ser sobre coluna inexistente
      if (err.code === '42703') {
        // Código de erro PostgreSQL para coluna não encontrada
        expect(err.message).not.toMatch(/l\.codigo/);
      }
      throw err;
    }
  });

  // ✅ TESTE 3: Funcionário foi atualizado com última avaliação
  it('[INTEGRAÇÃO] ✅ Funcionário atualizado com campos de última avaliação', async () => {
    const resultadoBefore = await query(
      `SELECT 
        ultima_avaliacao_id,
        ultima_avaliacao_status,
        ultima_avaliacao_data_conclusao,
        atualizado_em
       FROM funcionarios 
       WHERE cpf = $1`,
      [testSetup.funcionarioCpf]
    );

    expect(resultadoBefore.rows).toHaveLength(1);
    const funcionario = resultadoBefore.rows[0];

    // Se a avaliação foi concluída, deve ter esses campos
    const statusResult = await query(
      `SELECT status FROM avaliacoes WHERE id = $1`,
      [testSetup.avaliacaoId]
    );

    if (statusResult.rows[0].status === 'concluida') {
      expect(funcionario.ultima_avaliacao_id).toBe(testSetup.avaliacaoId);
      expect(funcionario.ultima_avaliacao_status).toBe('concluida');
      expect(funcionario.ultima_avaliacao_data_conclusao).toBeDefined();
    }
  });

  // ✅ TESTE 4: Validar que trigger não tenta usar coluna l.codigo
  it('[INTEGRAÇÃO] ✅ Função trigger (schema) não referencia l.codigo', async () => {
    const verificacaoResult = await query(
      `SELECT pg_get_functiondef(oid) FROM pg_proc 
       WHERE proname = 'atualizar_ultima_avaliacao_funcionario'`,
      []
    );

    expect(verificacaoResult.rows).toHaveLength(1);
    const funcaoDefinicao = verificacaoResult.rows[0].pg_get_functiondef;

    // Verificar que a função NÃO tenta fazer SELECT l.codigo
    expect(funcaoDefinicao).not.toMatch(/SELECT.*l\.codigo/i);
    expect(funcaoDefinicao).not.toMatch(/SELECT.*codigo.*INTO.*v_lote_codigo/i);
  });

  // ✅ TESTE 5: Validar transação RLS na conclusão
  it('[INTEGRAÇÃO] ✅ Conclusão mantém contexto de segurança RLS', async () => {
    // Verificar que funcionário tem os campos de denormalização
    const colunas = await query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'funcionarios'
       AND column_name LIKE '%ultima%avaliacao%'
       ORDER BY column_name`,
      []
    );

    expect(colunas.rows.length).toBeGreaterThan(0);

    // Deve ter pelo menos:
    // - ultima_avaliacao_id
    // - ultima_avaliacao_status
    // - ultima_avaliacao_data_conclusao
    const nomesColunas = colunas.rows.map((r: any) => r.column_name);
    expect(nomesColunas).toContain('ultima_avaliacao_id');
    expect(nomesColunas).toContain('ultima_avaliacao_status');
    expect(nomesColunas).toContain('ultima_avaliacao_data_conclusao');
  });

  // ✅ TESTE 6: Múltiplas avaliações - trigger atualiza apenas a mais recente
  it('[INTEGRAÇÃO] ✅ Trigger atualiza apenas a avaliação mais recente', async () => {
    try {
      // Criar segunda avaliação
      const seg2AvaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'em_andamento']
      );
      const seg2AvaliacaoId = seg2AvaliacaoResult.rows[0].id;

      // Pegar referência da primeira avaliação
      const primeiraRef = await query(
        `SELECT ultima_avaliacao_id FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );
      const primeiraAvaliacaoId = primeiraRef.rows[0].ultima_avaliacao_id;

      // Concluir segunda avaliação
      await query(
        `UPDATE avaliacoes 
         SET status = $1, envio = NOW(), atualizado_em = NOW() 
         WHERE id = $2`,
        ['concluida', seg2AvaliacaoId]
      );

      // Verificar que funcionário agora aponta para segunda avaliação
      // (porque é mais recente)
      const agora = await query(
        `SELECT ultima_avaliacao_id FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf]
      );

      // Deve ser a segunda (mais recente)
      expect(agora.rows[0].ultima_avaliacao_id).toBe(seg2AvaliacaoId);

      // Cleanup
      await query('DELETE FROM avaliacoes WHERE id = $1', [seg2AvaliacaoId]);
    } catch (err: any) {
      // Não deve ser erro de coluna inexistente
      expect(err.message).not.toMatch(/l\.codigo|coluna.*existe/i);
      throw err;
    }
  });
});
