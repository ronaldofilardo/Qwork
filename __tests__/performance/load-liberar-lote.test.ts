/**
 * Teste de Performance: Carga de Liberação de Lotes
 * 
 * Valida que múltiplos lotes podem ser liberados simultaneamente
 * sem criar lotes órfãos ou corromper dados
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

describe('Performance: Carga - Liberação de Lotes', () => {
  let clinicaId: number;
  let empresaId: number;
  const testCpf = '12345678909';

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Setup
    const clinicaRes = await query('SELECT id FROM clinicas WHERE ativa = true LIMIT 1');
    clinicaId = clinicaRes.rows[0]?.id || (await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica Perf Test', '99999999000100', 'perf@test.com', '11900000008', 'Rua', 'SP', 'SP', '01000-008', 'Resp', 'resp@perf.com', true)
       RETURNING id`
    )).rows[0].id;

    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId = empresaRes.rows[0]?.id || (await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa Perf Test', '00000000000100', 'emp@perf.com', '11900000009', 'Rua', 'SP', 'SP', '01000-009', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
      [clinicaId]
    )).rows[0].id;

    // Criar 10 funcionários de teste
    for (let i = 1; i <= 10; i++) {
      const cpf = `1111111111${i}`.substring(0, 11);
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
         VALUES ($1, $2, $3, '$2a$10$hash', 'funcionario', true, 0)
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [cpf, `Func Perf ${i}`, `perf${i}@test.com`]
      );

      const funcIdResult = await query('SELECT id FROM funcionarios WHERE cpf = $1', [cpf]);
      await query(
        `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
         VALUES ($1, $2, true)
         ON CONFLICT (funcionario_id, clinica_id) DO UPDATE SET ativo = true`,
        [funcIdResult.rows[0].id, clinicaId]
      );
    }
  });

  afterAll(async () => {
    try {
      // Limpar lotes de teste
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Perf Test%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );

      // Limpar funcionários
      for (let i = 1; i <= 10; i++) {
        const cpf = `1111111111${i}`.substring(0, 11);
        await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [cpf]);
        const funcIdResult = await query('SELECT id FROM funcionarios WHERE cpf = $1', [cpf]);
        if (funcIdResult.rowCount > 0) {
          await query('DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1', [funcIdResult.rows[0].id]);
        }
        await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
      }
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  it('deve criar 10 lotes simultaneamente sem lotes órfãos', async () => {
    const promises = [];
    const loteIds: number[] = [];

    try {
      // Criar 10 lotes em paralelo
      for (let i = 1; i <= 10; i++) {
        promises.push(
          withTransactionAsGestor(async (client) => {
            // Criar lote
            const loteResult = await client.query(
              `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
               VALUES ($1, $2, $3, 'completo', 'ativo', $4, $5)
               RETURNING id`,
              [clinicaId, empresaId, `Lote Perf Test ${i}`, testCpf, i]
            );
            const loteId = loteResult.rows[0].id;
            loteIds.push(loteId);

            // Criar avaliação para 1 funcionário
            const cpf = `1111111111${i}`.substring(0, 11);
            await client.query(
              `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
               VALUES ($1, $2, 'iniciada', NOW())`,
              [cpf, loteId]
            );

            return loteId;
          })
        );
      }

      // Aguardar todas completarem
      await Promise.all(promises);

      // ✅ Todos os lotes devem ter avaliações
      const lotesOrfaos = await query(`
        SELECT la.id
        FROM lotes_avaliacao la
        WHERE la.descricao LIKE 'Lote Perf Test%'
          AND NOT EXISTS (SELECT 1 FROM avaliacoes WHERE lote_id = la.id)
      `);

      expect(lotesOrfaos.rowCount).toBe(0); // ✅ Nenhum lote órfão
    } finally {
      // Limpar
      for (const loteId of loteIds) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  }, 30000); // 30s timeout

  it('deve medir tempo de criação de lote com avaliações', async () => {
    let loteId: number | null = null;

    try {
      const inicio = Date.now();

      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Perf Timing Test', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Criar 5 avaliações
        for (let i = 1; i <= 5; i++) {
          const cpf = `1111111111${i}`.substring(0, 11);
          await client.query(
            `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
             VALUES ($1, $2, 'iniciada', NOW())`,
            [cpf, loteId]
          );
        }
      });

      const tempoMs = Date.now() - inicio;
      console.log(`[PERF] Criação de lote + 5 avaliações: ${tempoMs}ms`);

      // ✅ Deve completar em menos de 5 segundos
      expect(tempoMs).toBeLessThan(5000);
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar que rollbacks não impactam outras transações paralelas', async () => {
    const loteIds: number[] = [];

    try {
      // Transaction 1: Success
      const promise1 = withTransactionAsGestor(async (client) => {
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Perf Success', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        const loteId = loteResult.rows[0].id;
        loteIds.push(loteId);

        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          ['11111111111', loteId]
        );
      });

      // Transaction 2: Failure (erro forçado)
      const promise2 = withTransactionAsGestor(async (client) => {
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Perf Failure', 'completo', 'ativo', $3, 2)
           RETURNING id`,
          [clinicaId, empresaId, testCpf]
        );
        const loteId = loteResult.rows[0].id;
        loteIds.push(loteId);

        // Erro forçado
        throw new Error('Erro simulado');
      }).catch(() => {
        // Ignorar erro esperado
      });

      await Promise.all([promise1, promise2]);

      // ✅ Lote 1 deve existir (sucesso)
      const lote1Check = await query(
        'SELECT id FROM lotes_avaliacao WHERE descricao = $1',
        ['Lote Perf Success']
      );
      expect(lote1Check.rowCount).toBe(1);

      // ✅ Lote 2 NÃO deve existir (rollback)
      const lote2Check = await query(
        'SELECT id FROM lotes_avaliacao WHERE descricao = $1',
        ['Lote Perf Failure']
      );
      expect(lote2Check.rowCount).toBe(0);
    } finally {
      // Limpar apenas lotes que foram criados
      for (const loteId of loteIds) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });
});
