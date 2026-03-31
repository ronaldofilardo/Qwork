/**
 * @file __tests__/database/rls-emissor-granular.test.ts
 * ─────────────────────────────────────────────────────────────
 * Valida que as políticas RLS do emissor em laudos são granulares
 * após migration 309_emissor_granular_rls_laudos.
 *
 * INCON-5: policy permissiva FOR ALL substituída por 3 policies
 * específicas (SELECT, INSERT, UPDATE) + DELETE bloqueado + trigger.
 */

import { query } from '@/lib/db';

describe('RLS Emissor laudos — policies granulares (INCON-5)', () => {
  describe('Policy permissiva FOR ALL removida', () => {
    it('rls_emissor_crud_laudos (FOR ALL) não deve existir', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT 1 FROM pg_policies
        WHERE tablename = 'laudos' AND policyname = 'rls_emissor_crud_laudos'
      `);

      // Assert — policy permissiva da migration 099 deve ter sido removida
      expect(res.rows).toHaveLength(0);
    });
  });

  describe('Policies granulares existem', () => {
    const expectedPolicies = [
      'rls_emissor_select_laudos',
      'rls_emissor_insert_laudos',
      'rls_emissor_update_laudos',
    ];

    expectedPolicies.forEach((policyname) => {
      it(`policy "${policyname}" existe em laudos`, async () => {
        // Arrange/Act
        const res = await query(
          `SELECT policyname FROM pg_policies
           WHERE tablename = 'laudos' AND policyname = $1`,
          [policyname]
        );

        // Assert
        expect(res.rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DELETE bloqueado — sem policy de DELETE para emissor', () => {
    it('não deve existir nenhuma policy de DELETE do emissor em laudos', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT policyname FROM pg_policies
        WHERE tablename = 'laudos'
          AND cmd = 'DELETE'
          AND (policyname LIKE '%emissor%' OR policyname LIKE '%emiss%')
      `);

      // Assert — sem policy de DELETE = negação automática pelo RLS
      expect(res.rows).toHaveLength(0);
    });
  });

  describe('Trigger de proteção de campos sensíveis', () => {
    it('trigger trg_bloquear_campos_emissor existe em laudos', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'trg_bloquear_campos_emissor'
          AND c.relname = 'laudos'
      `);

      // Assert
      expect(res.rows.length).toBeGreaterThan(0);
    });

    it('função fn_bloquear_campos_sensiveis_emissor existe no schema public', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT proname FROM pg_proc
        JOIN pg_namespace ns ON pg_proc.pronamespace = ns.oid
        WHERE proname = 'fn_bloquear_campos_sensiveis_emissor'
          AND ns.nspname = 'public'
      `);

      // Assert
      expect(res.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Policies SELECT e INSERT não filtram por emissor_cpf', () => {
    it('rls_emissor_select_laudos deve ser do tipo PERMISSIVE SELECT', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT permissive, cmd
        FROM pg_policies
        WHERE tablename = 'laudos' AND policyname = 'rls_emissor_select_laudos'
      `);

      // Assert
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].cmd).toBe('SELECT');
      expect(res.rows[0].permissive).toBe('PERMISSIVE');
    });

    it('rls_emissor_update_laudos deve ser do tipo PERMISSIVE UPDATE', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT permissive, cmd
        FROM pg_policies
        WHERE tablename = 'laudos' AND policyname = 'rls_emissor_update_laudos'
      `);

      // Assert
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].cmd).toBe('UPDATE');
      expect(res.rows[0].permissive).toBe('PERMISSIVE');
    });
  });
});
