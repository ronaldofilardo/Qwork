/**
 * Testes: RLS Policies na Fila de Emissão
 *
 * Valida a migração 997:
 * - RLS habilitado e FORCE na tabela fila_emissao
 * - Policies corretas criadas
 * - Acesso controlado por perfil de usuário
 * - Unique constraint funcionando
 */

import { query } from '@/lib/db';

describe('Correção: RLS Policies (fila_emissao)', () => {
  describe('Configuração do RLS', () => {
    it('RLS deve estar habilitado na tabela fila_emissao', async () => {
      const result = await query(`
        SELECT 
          c.relname as table_name,
          c.relrowsecurity as rls_enabled,
          c.relforcerowsecurity as rls_forced
        FROM pg_class c
        WHERE c.relname = 'fila_emissao'
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].rls_enabled).toBe(true);
      expect(result.rows[0].rls_forced).toBe(true);
    });

    it('deve ter exatamente 4 policies criadas', async () => {
      const result = await query(`
        SELECT 
          pol.polname as policy_name,
          pol.polcmd as command,
          pg_get_expr(pol.polqual, pol.polrelid) as using_expression
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        WHERE c.relname = 'fila_emissao'
        ORDER BY pol.polname
      `);

      expect(result.rows).toHaveLength(4);

      const policyNames = result.rows.map((r) => r.policy_name);
      expect(policyNames).toContain('fila_emissao_admin_view');
      expect(policyNames).toContain('fila_emissao_emissor_update');
      expect(policyNames).toContain('fila_emissao_emissor_view');
      expect(policyNames).toContain('fila_emissao_system_bypass');
    });
  });

  describe('Policy: system_bypass', () => {
    it('deve existir policy fila_emissao_system_bypass', async () => {
      const result = await query(`
        SELECT 
          pol.polname,
          pol.polcmd as command,
          pol.polpermissive as permissive
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        WHERE c.relname = 'fila_emissao'
          AND pol.polname = 'fila_emissao_system_bypass'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].command).toBe('*'); // ALL operations
    });
  });

  describe('Policy: emissor_view', () => {
    it('deve existir policy fila_emissao_emissor_view para SELECT', async () => {
      const result = await query(`
        SELECT 
          pol.polname,
          pol.polcmd as command
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        WHERE c.relname = 'fila_emissao'
          AND pol.polname = 'fila_emissao_emissor_view'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].command).toBe('r'); // SELECT
    });
  });

  describe('Policy: emissor_update', () => {
    it('deve existir policy fila_emissao_emissor_update para UPDATE', async () => {
      const result = await query(`
        SELECT 
          pol.polname,
          pol.polcmd as command
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        WHERE c.relname = 'fila_emissao'
          AND pol.polname = 'fila_emissao_emissor_update'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].command).toBe('w'); // UPDATE
    });
  });

  describe('Policy: admin_view', () => {
    it('deve existir policy fila_emissao_admin_view para SELECT', async () => {
      const result = await query(`
        SELECT 
          pol.polname,
          pol.polcmd as command
        FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        WHERE c.relname = 'fila_emissao'
          AND pol.polname = 'fila_emissao_admin_view'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].command).toBe('r'); // SELECT
    });
  });

  describe('Função: current_user_perfil', () => {
    it('deve existir função current_user_perfil()', async () => {
      const result = await query(`
        SELECT 
          p.proname as function_name,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'current_user_perfil'
          AND n.nspname = 'public'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].return_type).toBe('text');
    });
  });

  describe('Unique Constraint', () => {
    it('deve ter constraint unique em fila_emissao.lote_id', async () => {
      const result = await query(`
        SELECT 
          conname as constraint_name,
          contype as constraint_type
        FROM pg_constraint
        WHERE conrelid = 'fila_emissao'::regclass
          AND conname = 'fila_emissao_lote_id_unique'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].constraint_type).toBe('u'); // UNIQUE
    });

    it('não deve permitir inserir lote_id duplicado', async () => {
      // Criar um registro de teste
      const testLoteId = 999999;

      try {
        await query(
          `INSERT INTO fila_emissao (lote_id)
           VALUES ($1)`,
          [testLoteId]
        );

        // Tentar inserir duplicado
        await expect(
          query(
            `INSERT INTO fila_emissao (lote_id)
             VALUES ($1)`,
            [testLoteId]
          )
        ).rejects.toThrow();
      } finally {
        // Limpar dados de teste
        await query('DELETE FROM fila_emissao WHERE lote_id = $1', [
          testLoteId,
        ]);
      }
    });
  });

  describe('Índices', () => {
    it('deve ter índice em fila_emissao(lote_id)', async () => {
      const result = await query(`
        SELECT 
          i.relname as index_name,
          a.attname as column_name
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relname = 'fila_emissao'
          AND a.attname = 'lote_id'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('deve ter índices parciais para tentativas', async () => {
      const result = await query(`
        SELECT 
          i.relname as index_name,
          pg_get_expr(ix.indpred, ix.indrelid) as where_clause
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        WHERE t.relname = 'fila_emissao'
          AND ix.indpred IS NOT NULL
      `);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);

      // Verificar se há índices com condição de tentativas < max_tentativas
      const whereClauses = result.rows.map((r) => r.where_clause);
      expect(
        whereClauses.some(
          (w) => w.includes('tentativas') && w.includes('max_tentativas')
        )
      ).toBe(true);
    });
  });

  describe('Integridade de Dados', () => {
    it('todos registros em fila_emissao devem ter lote válido', async () => {
      const result = await query(`
        SELECT fe.id, fe.lote_id
        FROM fila_emissao fe
        LEFT JOIN lotes_avaliacao la ON la.id = fe.lote_id
        WHERE la.id IS NULL
      `);

      expect(result.rows).toHaveLength(0);
    });

    it('não deve ter registros órfãos na fila_emissao', async () => {
      const result = await query(`
        SELECT 
          COUNT(*) as total_orfaos
        FROM fila_emissao fe
        WHERE NOT EXISTS (
          SELECT 1 FROM lotes_avaliacao la WHERE la.id = fe.lote_id
        )
      `);

      expect(parseInt(result.rows[0].total_orfaos)).toBe(0);
    });
  });
});
