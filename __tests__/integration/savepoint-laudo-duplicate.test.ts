/**
 * Teste de Integração: SAVEPOINT para Laudos Duplicados
 *
 * Valida que erro de laudo duplicado é isolado via SAVEPOINT
 * e não aborta a transação inteira
 */

import { query } from '@/lib/db';
import { withTransactionAsGestor } from '@/lib/db-transaction';

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
  requireRHWithEmpresaAccess: jest.fn().mockResolvedValue({}),
  getSession: jest.fn().mockReturnValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
}));

describe('Integration: SAVEPOINT - Laudo Duplicado', () => {
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;
  const testCpf = '12345678909';

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_cpf',
      testCpf,
    ]);
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_perfil',
      'rh',
    ]);

    // Setup clínica, empresa, funcionário (similar ao outro teste)
    const clinicaRes = await query(
      'SELECT id FROM clinicas WHERE ativa = true LIMIT 1'
    );
    clinicaId =
      clinicaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica SAVEPOINT Test', '33333333000100', 'savepoint@test.com', '11900000002', 'Rua', 'São Paulo', 'SP', '01000-002', 'Resp', 'resp@savepoint.com', true)
       RETURNING id`
        )
      ).rows[0].id;

    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId =
      empresaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa SAVEPOINT Test', '44444444000100', 'emp@savepoint.com', '11900000003', 'Rua', 'São Paulo', 'SP', '01000-003', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
          [clinicaId]
        )
      ).rows[0].id;

    funcionarioCpf = '88877766655';
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, 'Func SAVEPOINT Test', 'savepoint@func.com', '$2a$10$hash', 'funcionario', true, 0)
       ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
      [funcionarioCpf]
    );

    const funcIdResult = await query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [funcionarioCpf]
    );
    const funcId = funcIdResult.rows[0].id;
    await query(
      `DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1 AND clinica_id = $2`,
      [funcId, clinicaId]
    );
    await query(
      `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
       VALUES ($1, $2, true)`,
      [funcId, clinicaId]
    );
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%SAVEPOINT%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );
      const funcIdResult = await query(
        'SELECT id FROM funcionarios WHERE cpf = $1',
        [funcionarioCpf]
      );
      if (funcIdResult.rowCount > 0) {
        await query(
          'DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1',
          [funcIdResult.rows[0].id]
        );
      }
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    } catch (err) {
      console.warn('[cleanup] Erro durante cleanup:', err);
    }
  });

  it('deve continuar transação após erro de laudo duplicado via SAVEPOINT', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 1. Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote SAVEPOINT Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // 2. Simular tentativa de criar laudo duplicado com SAVEPOINT
        try {
          await client.query('SAVEPOINT laudo_reserva');
          // Tentar criar laudo (pode falhar se já existe)
          await client.query(
            `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
             VALUES ($1, $1, 'rascunho', NOW(), NOW())`,
            [loteId]
          );
          await client.query('RELEASE SAVEPOINT laudo_reserva');
        } catch (laudoErr) {
          // Rollback apenas do SAVEPOINT
          await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
          console.log('[TEST] Laudo falhou (esperado), continuando transação');
        }

        // 3. Criar avaliação (deve funcionar MESMO se laudo falhou)
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );
      });

      // ✅ CRÍTICO - Transação completou com sucesso
      expect(loteId).toBeDefined();

      // Verificar lote foi criado
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(1);

      // ✅ CRÍTICO - Avaliação foi criada MESMO com erro de laudo
      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(1);
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve criar múltiplas avaliações após erro de laudo isolado', async () => {
    let loteId: number | null = null;

    try {
      const numAvaliacoes = 3;
      const cpfs = ['11111111111', '22222222222', '33333333333'];

      // Criar funcionários de teste
      for (const cpf of cpfs) {
        await query(
          `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
           VALUES ($1, $2, $3, '$2a$10$hash', 'funcionario', true, 0)
           ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
          [cpf, `Func ${cpf}`, `${cpf}@test.com`]
        );

        const funcIdResult = await query(
          'SELECT id FROM funcionarios WHERE cpf = $1',
          [cpf]
        );
        await query(
          `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
           VALUES ($1, $2, true)
           ON CONFLICT (funcionario_id, clinica_id) DO UPDATE SET ativo = true`,
          [funcIdResult.rows[0].id, clinicaId]
        );
      }

      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote SAVEPOINT Multi', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Simular erro de laudo
        try {
          await client.query('SAVEPOINT laudo_reserva');
          await client.query(
            `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
             VALUES ($1, $1, 'rascunho', NOW(), NOW())`,
            [loteId]
          );
          await client.query('RELEASE SAVEPOINT laudo_reserva');
        } catch (err) {
          await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
        }

        // Criar múltiplas avaliações
        for (const cpf of cpfs) {
          await client.query(
            `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
             VALUES ($1, $2, 'iniciada', NOW())`,
            [cpf, loteId]
          );
        }
      });

      // ✅ Todas as avaliações devem ter sido criadas
      const avaliacaoCheck = await query(
        'SELECT COUNT(*) as total FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(parseInt(avaliacaoCheck.rows[0].total)).toBe(numAvaliacoes);

      // Limpar
      for (const cpf of cpfs) {
        await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [cpf]);
        const funcIdResult = await query(
          'SELECT id FROM funcionarios WHERE cpf = $1',
          [cpf]
        );
        if (funcIdResult.rowCount > 0) {
          await query(
            'DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1',
            [funcIdResult.rows[0].id]
          );
        }
        await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
      }
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar que SAVEPOINT não afeta rollback de transação inteira', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote SAVEPOINT Rollback Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Usar SAVEPOINT para laudo
        try {
          await client.query('SAVEPOINT laudo_reserva');
          await client.query(
            `INSERT INTO laudos (id, lote_id, status) VALUES ($1, $1, 'rascunho')`,
            [loteId]
          );
          await client.query('RELEASE SAVEPOINT laudo_reserva');
        } catch (err) {
          await client.query('ROLLBACK TO SAVEPOINT laudo_reserva');
        }

        // Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );

        // Forçar erro fatal que deve abortar TODA a transação
        throw new Error('Erro fatal simulado - deve fazer rollback completo');
      });

      fail('Transação deveria ter falhado');
    } catch (error) {
      // Esperado
      expect(error).toBeDefined();
    }

    // ✅ CRÍTICO - Lote NÃO deve existir (rollback completo)
    if (loteId) {
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(0);

      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(0);

      const laudoCheck = await query('SELECT id FROM laudos WHERE id = $1', [
        loteId,
      ]);
      expect(laudoCheck.rowCount).toBe(0);
    }
  });
});
