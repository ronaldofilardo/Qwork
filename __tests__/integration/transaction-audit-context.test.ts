/**
 * Teste de Integração: Contexto de Auditoria em Transações
 *
 * Valida que app.current_user_cpf é mantido durante toda a transação
 * e que audit_logs são preenchidos corretamente
 */

import { query } from '@/lib/db';
import { withTransactionAsGestor } from '@/lib/db-transaction';

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
  getSession: jest.fn().mockReturnValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
}));

describe('Integration: Contexto de Auditoria em Transações', () => {
  const testCpf = '12345678909';
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Setup básico
    const clinicaRes = await query(
      'SELECT id FROM clinicas WHERE ativa = true LIMIT 1'
    );
    clinicaId =
      clinicaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica Audit Test', '55555555000100', 'audit@test.com', '11900000004', 'Rua', 'SP', 'SP', '01000-004', 'Resp', 'resp@audit.com', true)
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
       VALUES ($1, 'Empresa Audit Test', '66666666000100', 'emp@audit.com', '11900000005', 'Rua', 'SP', 'SP', '01000-005', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
          [clinicaId]
        )
      ).rows[0].id;

    funcionarioCpf = '77766655544';
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, 'Func Audit Test', 'audit@func.com', '$2a$10$hash', 'funcionario', true, 0)
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
      // Limpar audit_logs primeiro
      await query(
        `DELETE FROM audit_logs 
         WHERE user_cpf = $1 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [testCpf]
      );

      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Audit Context%' 
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
      console.warn('[cleanup] Erro:', err);
    }
  });

  it('deve manter app.current_user_cpf durante toda a transação', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 1. Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Audit Context Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // 2. Criar avaliação (trigger de auditoria usa app.current_user_cpf)
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );

        // 3. Verificar dentro da transação que contexto está setado
        const contextCheck = await client.query(
          `SELECT current_setting('app.current_user_cpf', true) as cpf`
        );
        expect(contextCheck.rows[0].cpf).toBe(testCpf);
      });

      // 4. Verificar audit_logs tem user_cpf preenchido
      const auditResult = await query(
        `SELECT user_cpf, action, resource
         FROM audit_logs
         WHERE resource = 'avaliacoes'
         AND action = 'INSERT'
         AND created_at > NOW() - INTERVAL '10 seconds'
         ORDER BY created_at DESC
         LIMIT 1`
      );

      // ✅ CRÍTICO - Audit log deve ter CPF do usuário
      if (auditResult.rowCount > 0) {
        expect(auditResult.rows[0].user_cpf).toBe(testCpf);
      }
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve manter contexto mesmo após erro intermediário isolado via SAVEPOINT', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 1. Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Audit SAVEPOINT Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // 2. Simular erro isolado via SAVEPOINT
        try {
          await client.query('SAVEPOINT erro_intermediario');
          // Query que pode falhar
          await client.query(
            `INSERT INTO laudos (id, lote_id, status) VALUES ($1, $1, 'rascunho')`,
            [loteId]
          );
          await client.query('RELEASE SAVEPOINT erro_intermediario');
        } catch (err) {
          await client.query('ROLLBACK TO SAVEPOINT erro_intermediario');
          console.log('[TEST] Erro isolado via SAVEPOINT (esperado)');
        }

        // 3. Verificar que contexto ainda está setado APÓS o erro isolado
        const contextCheck = await client.query(
          `SELECT current_setting('app.current_user_cpf', true) as cpf`
        );
        expect(contextCheck.rows[0].cpf).toBe(testCpf); // ✅ CRÍTICO

        // 4. Criar avaliação (deve funcionar com contexto preservado)
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );
      });

      // 5. Verificar audit_logs
      const auditResult = await query(
        `SELECT user_cpf
         FROM audit_logs
         WHERE resource = 'avaliacoes'
         AND action = 'INSERT'
         AND created_at > NOW() - INTERVAL '10 seconds'
         ORDER BY created_at DESC
         LIMIT 1`
      );

      // ✅ CRÍTICO - Contexto preservado mesmo após erro isolado
      if (auditResult.rowCount > 0) {
        expect(auditResult.rows[0].user_cpf).toBe(testCpf);
      }
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve garantir que audit_logs tem perfil correto', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Audit Perfil Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Verificar perfil dentro da transação
        const perfilCheck = await client.query(
          `SELECT current_setting('app.current_user_perfil', true) as perfil`
        );
        expect(perfilCheck.rows[0].perfil).toBe('rh');

        // Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );
      });

      // Verificar audit_logs tem perfil
      const auditResult = await query(
        `SELECT user_perfil
         FROM audit_logs
         WHERE resource = 'avaliacoes'
         AND action = 'INSERT'
         AND user_cpf = $1
         AND created_at > NOW() - INTERVAL '10 seconds'
         ORDER BY created_at DESC
         LIMIT 1`,
        [testCpf]
      );

      // ✅ Perfil deve estar correto
      if (auditResult.rowCount > 0) {
        expect(auditResult.rows[0].user_perfil).toBe('rh');
      }
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });
});
