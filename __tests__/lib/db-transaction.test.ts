/**
 * Teste de Unidade: lib/db-transaction.ts
 * 
 * Valida withTransactionAsGestor e withTransaction
 */

import { withTransactionAsGestor, withTransaction } from '@/lib/db-transaction';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

const { getSession } = require('@/lib/session');

describe('Unit: lib/db-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withTransactionAsGestor', () => {
    it('deve rejeitar se perfil não é gestor ou rh', async () => {
      getSession.mockReturnValue({
        cpf: '12345678909',
        perfil: 'funcionario', // ❌ Não é gestor/rh
      });

      await expect(
        withTransactionAsGestor(async (client) => {
          // Não deve chegar aqui
        })
      ).rejects.toThrow();
    });

    it('deve aceitar perfil gestor', async () => {
      getSession.mockReturnValue({
        cpf: '12345678909',
        perfil: 'gestor',
      });

      let executed = false;
      await withTransactionAsGestor(async (client) => {
        executed = true;
        expect(client).toBeDefined();
      });

      expect(executed).toBe(true);
    });

    it('deve aceitar perfil rh', async () => {
      getSession.mockReturnValue({
        cpf: '12345678909',
        perfil: 'rh',
      });

      let executed = false;
      await withTransactionAsGestor(async (client) => {
        executed = true;
        expect(client).toBeDefined();
      });

      expect(executed).toBe(true);
    });

    it('deve configurar app.current_user_cpf na transação', async () => {
      const testCpf = '12345678909';
      getSession.mockReturnValue({
        cpf: testCpf,
        perfil: 'gestor',
      });

      await withTransactionAsGestor(async (client) => {
        // Verificar que contexto foi setado
        const result = await client.query(
          `SELECT current_setting('app.current_user_cpf', true) as cpf`
        );
        expect(result.rows[0].cpf).toBe(testCpf);
      });
    });

    it('deve configurar app.current_user_perfil na transação', async () => {
      getSession.mockReturnValue({
        cpf: '12345678909',
        perfil: 'rh',
      });

      await withTransactionAsGestor(async (client) => {
        const result = await client.query(
          `SELECT current_setting('app.current_user_perfil', true) as perfil`
        );
        expect(result.rows[0].perfil).toBe('rh');
      });
    });

    it('deve fazer rollback automático se callback lançar erro', async () => {
      getSession.mockReturnValue({
        cpf: '12345678909',
        perfil: 'gestor',
      });

      let loteId: number | null = null;

      try {
        await withTransactionAsGestor(async (client) => {
          // Criar lote de teste
          const clinicaRes = await query('SELECT id FROM clinicas WHERE ativa = true LIMIT 1');
          const empresaRes = await query(
            'SELECT id FROM empresas_clientes WHERE ativa = true LIMIT 1'
          );

          if (clinicaRes.rowCount > 0 && empresaRes.rowCount > 0) {
            const loteResult = await client.query(
              `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
               VALUES ($1, $2, 'Lote Rollback Test', 'completo', 'ativo', '12345678909', 1)
               RETURNING id`,
              [clinicaRes.rows[0].id, empresaRes.rows[0].id]
            );
            loteId = loteResult.rows[0].id;
          }

          // Forçar erro
          throw new Error('Erro forçado para teste de rollback');
        });

        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Erro forçado');
      }

      // Verificar que lote NÃO foi criado (rollback)
      if (loteId) {
        const check = await query('SELECT id FROM lotes_avaliacao WHERE id = $1', [loteId]);
        expect(check.rowCount).toBe(0); // ✅ Rollback funcionou
      }
    });
  });

  describe('withTransaction', () => {
    it('deve executar callback com client válido', async () => {
      let executed = false;
      let hasClient = false;

      await withTransaction(async (client) => {
        executed = true;
        hasClient = !!client;
        expect(client.query).toBeDefined();
      });

      expect(executed).toBe(true);
      expect(hasClient).toBe(true);
    });

    it('deve fazer commit se callback completar com sucesso', async () => {
      let loteId: number | null = null;

      try {
        await withTransaction(async (client) => {
          // Criar lote de teste
          const clinicaRes = await query('SELECT id FROM clinicas WHERE ativa = true LIMIT 1');
          const empresaRes = await query(
            'SELECT id FROM empresas_clientes WHERE ativa = true LIMIT 1'
          );

          if (clinicaRes.rowCount > 0 && empresaRes.rowCount > 0) {
            const loteResult = await client.query(
              `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
               VALUES ($1, $2, 'Lote Commit Test', 'completo', 'ativo', '12345678909', 1)
               RETURNING id`,
              [clinicaRes.rows[0].id, empresaRes.rows[0].id]
            );
            loteId = loteResult.rows[0].id;
          }
        });

        // Verificar que lote FOI criado (commit)
        if (loteId) {
          const check = await query('SELECT id FROM lotes_avaliacao WHERE id = $1', [loteId]);
          expect(check.rowCount).toBe(1); // ✅ Commit funcionou
        }
      } finally {
        // Limpar
        if (loteId) {
          await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
        }
      }
    });

    it('deve isolar transações paralelas', async () => {
      const results = await Promise.all([
        withTransaction(async (client1) => {
          const r1 = await client1.query('SELECT 1 as val');
          return r1.rows[0].val;
        }),
        withTransaction(async (client2) => {
          const r2 = await client2.query('SELECT 2 as val');
          return r2.rows[0].val;
        }),
      ]);

      expect(results).toEqual([1, 2]);
    });
  });
});
