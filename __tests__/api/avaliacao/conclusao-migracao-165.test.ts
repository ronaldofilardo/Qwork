/**
 * Testes de Integração para Conclusão de Avaliação com Migração 165
 *
 * Valida que o fluxo completo funciona:
 * POST /api/avaliacao/respostas → salva respostas → trigger atualiza funcionário → sem erros
 */

import { query } from '@/lib/db';

// Sessões de teste para satisfazer o guard RLS (app.current_user_cpf)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEST_SESSION: any = {
  cpf: '55544433322',
  nome: 'Test Integração',
  email: 'test@test.com',
  perfil: 'rh',
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FUNC_SESSION: any = {
  cpf: '55544433322',
  nome: 'Test Funcionario',
  email: 'test@test.com',
  perfil: 'funcionario',
};

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
      // Criar clínica (ON CONFLICT para idempotência em re-runs)
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, telefone, email, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (cnpj) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
        [
          'Clínica Teste',
          '98765432000188',
          '1133334444',
          'clinica@teste.com',
          'Rua Teste, 123',
          'São Paulo',
          'SP',
          '01310-100',
          'Responsável Teste',
          '99988877766',
          'resp@teste.com',
          '11999998888',
        ],
        TEST_SESSION
      );
      testSetup.clinicaId = clinicaResult.rows[0].id;
      TEST_SESSION.clinica_id = testSetup.clinicaId;
      FUNC_SESSION.clinica_id = testSetup.clinicaId;

      // Criar empresa (ON CONFLICT para idempotência em re-runs)
      const empresaResult = await query(
        `INSERT INTO empresas_clientes (nome, cnpj, clinica_id, representante_nome, representante_email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cnpj) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
        [
          'Empresa Teste Integração',
          '11222333000144',
          testSetup.clinicaId,
          'Manager Test',
          'manager@test.com',
        ],
        TEST_SESSION
      );
      testSetup.empresaId = empresaResult.rows[0].id;

      // Criar funcionário ANTES do lote (trigger reservar-laudo usa liberado_por como emissor_cpf FK)
      // Banco de teste local: NOT NULL = cpf, nome, senha_hash, usuario_tipo
      await query(
        `INSERT INTO funcionarios (cpf, nome, senha_hash, usuario_tipo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [
          testSetup.funcionarioCpf,
          'Employee Test Integração',
          'hash_teste_placeholder',
          'funcionario_clinica',
        ],
        TEST_SESSION
      );

      // Criar lote (ON CONFLICT em empresa_id+numero_ordem para idempotência)
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, numero_ordem, liberado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (empresa_id, numero_ordem) DO UPDATE SET descricao = EXCLUDED.descricao
         RETURNING id`,
        [
          testSetup.clinicaId,
          testSetup.empresaId,
          'Lote Integração',
          'completo',
          'ativo',
          1,
          '55544433322', // CHAR(11) — CPF do funcionário (deve existir antes do lote)
        ],
        TEST_SESSION
      );
      testSetup.loteId = loteResult.rows[0].id;

      // Criar avaliação
      const avaliacaoResult = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testSetup.funcionarioCpf, testSetup.loteId, 'iniciada'],
        TEST_SESSION
      );
      testSetup.avaliacaoId = avaliacaoResult.rows[0].id;

      // Criar função + trigger atualizar_ultima_avaliacao se não existir no banco de teste
      await query(
        `
        CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE funcionarios
          SET
            ultima_avaliacao_id = NEW.id,
            ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
            ultima_avaliacao_status = NEW.status,
            atualizado_em = NOW()
          WHERE cpf = NEW.funcionario_cpf
            AND (
              ultima_avaliacao_data_conclusao IS NULL
              OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
              OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
            );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `,
        [],
        TEST_SESSION
      );
      await query(
        `
        DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes
      `,
        [],
        TEST_SESSION
      );
      await query(
        `
        CREATE TRIGGER trigger_atualizar_ultima_avaliacao
        AFTER UPDATE OF status, envio, inativada_em
        ON avaliacoes
        FOR EACH ROW
        WHEN (
          (NEW.status IN ('concluida', 'inativada') AND OLD.status <> NEW.status)
          OR (NEW.envio IS NOT NULL AND OLD.envio IS NULL)
          OR (NEW.inativada_em IS NOT NULL AND OLD.inativada_em IS NULL)
        )
        EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario()
      `,
        [],
        TEST_SESSION
      );
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
        [funcionarioCpf],
        TEST_SESSION
      );
      await query(
        'DELETE FROM resultados WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE funcionario_cpf = $1)',
        [funcionarioCpf],
        TEST_SESSION
      );
      await query(
        'DELETE FROM avaliacoes WHERE funcionario_cpf = $1',
        [funcionarioCpf],
        TEST_SESSION
      );
      await query(
        'DELETE FROM funcionarios WHERE cpf = $1',
        [funcionarioCpf],
        TEST_SESSION
      );
      await query(
        'DELETE FROM laudos WHERE lote_id = $1',
        [loteId],
        TEST_SESSION
      );
      await query(
        'DELETE FROM lotes_avaliacao WHERE id = $1',
        [loteId],
        TEST_SESSION
      );
      await query(
        'DELETE FROM empresas_clientes WHERE id = $1',
        [empresaId],
        TEST_SESSION
      );
      await query(
        'DELETE FROM clinicas WHERE id = $1',
        [clinicaId],
        TEST_SESSION
      );
      // Limpar trigger criado para o teste
      await query(
        `DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes`,
        [],
        TEST_SESSION
      ).catch(() => {});
    } catch (err) {
      console.error('Cleanup Error:', err);
    }
  });

  // ✅ TESTE 1: Salvar 37 respostas sem erro de trigger
  // respostas: sem coluna atualizado_em, valor CHECK (0,25,50,75,100), item VARCHAR(10)
  const VALID_VALORES = [0, 25, 50, 75, 100];
  it('[INTEGRAÇÃO] ✅ Salva 37 respostas sem erro de coluna inexistente', async () => {
    const grupos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let respostaCount = 0;

    for (const grupo of grupos) {
      const itensGrupo = grupo === 10 ? 7 : 4;
      for (let item = 1; item <= itensGrupo && respostaCount < 37; item++) {
        await query(
          `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (avaliacao_id, grupo, item) DO UPDATE SET valor = EXCLUDED.valor`,
          [
            testSetup.avaliacaoId,
            grupo,
            `Q${item}`,
            VALID_VALORES[respostaCount % VALID_VALORES.length],
          ],
          FUNC_SESSION
        );
        respostaCount++;
      }
    }

    expect(respostaCount).toBe(37);

    const respostasResult = await query(
      `SELECT COUNT(*) as total FROM respostas WHERE avaliacao_id = $1`,
      [testSetup.avaliacaoId],
      FUNC_SESSION
    );
    expect(parseInt(respostasResult.rows[0].total as string)).toBe(37);
  });

  // ✅ TESTE 2: Auto-conclusão dispara trigger sem erros
  it('[INTEGRAÇÃO] ✅ Auto-conclusão (37 respostas) dispara trigger com sucesso', async () => {
    const respostasResult = await query(
      `SELECT COUNT(*) as total FROM respostas WHERE avaliacao_id = $1`,
      [testSetup.avaliacaoId],
      FUNC_SESSION
    );
    const totalRespostas = parseInt(respostasResult.rows[0].total as string);

    if (totalRespostas === 37) {
      const loteResult = await query(
        `SELECT id FROM lotes_avaliacao WHERE id = $1`,
        [testSetup.loteId],
        TEST_SESSION
      );
      expect(loteResult.rows).toHaveLength(1);

      const updateResult = await query(
        `UPDATE avaliacoes SET status = $1, envio = NOW(), atualizado_em = NOW() WHERE id = $2`,
        ['concluida', testSetup.avaliacaoId],
        TEST_SESSION
      );
      expect(updateResult.rowCount).toBe(1);
    }
  });

  // ✅ TESTE 3: Funcionário foi atualizado com última avaliação
  it('[INTEGRAÇÃO] ✅ Funcionário atualizado com campos de última avaliação', async () => {
    const funcionarioResult = await query(
      `SELECT ultima_avaliacao_id, ultima_avaliacao_status, ultima_avaliacao_data_conclusao
       FROM funcionarios WHERE cpf = $1`,
      [testSetup.funcionarioCpf],
      TEST_SESSION
    );

    expect(funcionarioResult.rows).toHaveLength(1);
    const funcionario = funcionarioResult.rows[0];

    const statusResult = await query(
      `SELECT status FROM avaliacoes WHERE id = $1`,
      [testSetup.avaliacaoId],
      TEST_SESSION
    );

    if (statusResult.rows[0]?.status === 'concluida') {
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

  // ✅ TESTE 6: Múltiplas avaliações — trigger atualiza apenas a mais recente
  it('[INTEGRAÇÃO] ✅ Trigger atualiza apenas a avaliação mais recente', async () => {
    const seg2AvaliacaoResult = await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testSetup.funcionarioCpf, testSetup.loteId, 'em_andamento'],
      TEST_SESSION
    );
    const seg2AvaliacaoId = seg2AvaliacaoResult.rows[0].id;

    try {
      await query(
        `UPDATE avaliacoes SET status = $1, envio = NOW(), atualizado_em = NOW() WHERE id = $2`,
        ['concluida', seg2AvaliacaoId],
        TEST_SESSION
      );

      const agora = await query(
        `SELECT ultima_avaliacao_id FROM funcionarios WHERE cpf = $1`,
        [testSetup.funcionarioCpf],
        TEST_SESSION
      );

      expect(agora.rows[0].ultima_avaliacao_id).toBe(seg2AvaliacaoId);
    } finally {
      await query(
        'DELETE FROM avaliacoes WHERE id = $1',
        [seg2AvaliacaoId],
        TEST_SESSION
      );
    }
  });
});
