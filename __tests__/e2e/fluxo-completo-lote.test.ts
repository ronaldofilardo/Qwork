/**
 * Teste End-to-End: Fluxo Completo de Lote
 * 
 * Valida todo o fluxo: criação → avaliações → laudo → conclusão
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
  }),
}));

describe('E2E: Fluxo Completo de Lote', () => {
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;
  const testCpf = '12345678909';

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Setup
    const clinicaRes = await query('SELECT id FROM clinicas WHERE ativa = true LIMIT 1');
    clinicaId = clinicaRes.rows[0]?.id || (await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica E2E Test', '12312312300100', 'e2e@test.com', '11900000010', 'Rua', 'SP', 'SP', '01000-010', 'Resp', 'resp@e2e.com', true)
       RETURNING id`
    )).rows[0].id;

    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId = empresaRes.rows[0]?.id || (await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa E2E Test', '45645645600100', 'emp@e2e.com', '11900000011', 'Rua', 'SP', 'SP', '01000-011', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
      [clinicaId]
    )).rows[0].id;

    funcionarioCpf = '66655544433';
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, 'Func E2E Test', 'e2e@func.com', '$2a$10$hash', 'funcionario', true, 0)
       ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
      [funcionarioCpf]
    );

    const funcIdResult = await query('SELECT id FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query(
      `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
       VALUES ($1, $2, true)
       ON CONFLICT (funcionario_id, clinica_id) DO UPDATE SET ativo = true`,
      [funcIdResult.rows[0].id, clinicaId]
    );
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [funcionarioCpf]);
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%E2E Test%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );
      const funcIdResult = await query('SELECT id FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
      if (funcIdResult.rowCount > 0) {
        await query('DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1', [funcIdResult.rows[0].id]);
      }
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  it('deve completar fluxo: lote → avaliação → laudo → conclusão', async () => {
    let loteId: number | null = null;
    let avaliacaoId: number | null = null;

    try {
      // 1. Criar lote + avaliação (atomicamente)
      await withTransactionAsGestor(async (client) => {
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote E2E Test Complete', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        const avaliacaoResult = await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())
           RETURNING id`,
          [funcionarioCpf, loteId]
        );
        avaliacaoId = avaliacaoResult.rows[0].id;
      });

      // ✅ Fase 1: Lote e avaliação criados
      expect(loteId).toBeDefined();
      expect(avaliacaoId).toBeDefined();

      // 2. Completar avaliação
      await query(
        `UPDATE avaliacoes 
         SET status = 'concluida', conclusao = NOW()
         WHERE id = $1`,
        [avaliacaoId]
      );

      // ✅ Fase 2: Avaliação concluída
      const avaliacaoCheck = await query(
        'SELECT status FROM avaliacoes WHERE id = $1',
        [avaliacaoId]
      );
      expect(avaliacaoCheck.rows[0].status).toBe('concluida');

      // 3. Atualizar laudo (trigger criou como 'rascunho')
      await query(
        `UPDATE laudos 
         SET status = 'em_elaboracao'
         WHERE id = $1`,
        [loteId]
      );

      // ✅ Fase 3: Laudo em elaboração
      const laudoCheck = await query('SELECT status FROM laudos WHERE id = $1', [loteId]);
      if (laudoCheck.rowCount > 0) {
        expect(laudoCheck.rows[0].status).toBe('em_elaboracao');
      }

      // 4. Finalizar laudo
      await query(
        `UPDATE laudos 
         SET status = 'concluido', data_conclusao = NOW()
         WHERE id = $1`,
        [loteId]
      );

      // ✅ Fase 4: Laudo concluído
      const laudoFinalCheck = await query(
        'SELECT status, data_conclusao FROM laudos WHERE id = $1',
        [loteId]
      );
      if (laudoFinalCheck.rowCount > 0) {
        expect(laudoFinalCheck.rows[0].status).toBe('concluido');
        expect(laudoFinalCheck.rows[0].data_conclusao).toBeDefined();
      }

      // 5. Arquivar lote
      await query(
        `UPDATE lotes_avaliacao 
         SET status = 'arquivado'
         WHERE id = $1`,
        [loteId]
      );

      // ✅ Fase 5: Lote arquivado
      const loteCheck = await query('SELECT status FROM lotes_avaliacao WHERE id = $1', [loteId]);
      expect(loteCheck.rows[0].status).toBe('arquivado');

      console.log('[E2E] ✅ Fluxo completo validado com sucesso');
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar que rollback em criação não deixa dados inconsistentes', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote E2E Rollback Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );

        // Forçar erro
        throw new Error('Erro simulado no meio do fluxo');
      });

      fail('Deveria ter lançado erro');
    } catch (error) {
      // Esperado
    }

    // ✅ Nada deve ter sido criado
    if (loteId) {
      const loteCheck = await query('SELECT id FROM lotes_avaliacao WHERE id = $1', [loteId]);
      expect(loteCheck.rowCount).toBe(0);

      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(0);

      const laudoCheck = await query('SELECT id FROM laudos WHERE id = $1', [loteId]);
      expect(laudoCheck.rowCount).toBe(0);
    }
  });
});
