/**
 * @file __tests__/database/perfil-cadastro-super-removed.test.ts
 * ─────────────────────────────────────────────────────────────
 * Valida que os perfis legados 'cadastro' e 'super' foram removidos
 * do banco de dados após migration 308_remove_perfil_cadastro_super_legado.
 *
 * INCON-3: perfil 'cadastro' nunca existiu no banco, mas era referenciado
 *          em policies e constraint check. Garantia de limpeza total.
 * INCON-4: role 'super' deve ser definitivamente inexistente.
 */

import { query } from '@/lib/db';

describe('Perfis legados removidos do banco (INCON-3 / INCON-4)', () => {
  describe('INCON-3 — perfil "cadastro" não persiste', () => {
    it('nenhum funcionário deve ter perfil="cadastro"', async () => {
      // Arrange/Act
      const res = await query(
        `SELECT COUNT(*)::int AS cnt FROM funcionarios WHERE perfil = 'cadastro'`
      );

      // Assert
      expect(res.rows[0].cnt).toBe(0);
    });

    it('constraint funcionarios_perfil_check não deve incluir "cadastro"', async () => {
      // Arrange/Act
      const res = await query(`
        SELECT cc.check_clause
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints  tc
          ON cc.constraint_schema = tc.constraint_schema
         AND cc.constraint_name   = tc.constraint_name
        WHERE tc.table_name       = 'funcionarios'
          AND cc.constraint_name  = 'funcionarios_perfil_check'
      `);

      // Assert — se a constraint existir, 'cadastro' não pode estar no check
      if (res.rows.length > 0) {
        expect(res.rows[0].check_clause).not.toContain('cadastro');
      }
      // Constraint pode ter sido removida totalmente — também OK
    });
  });

  describe('INCON-4 — role "super" não persiste', () => {
    it('tabela roles não deve ter entrada com name="super"', async () => {
      // Arrange — verificar se tabela roles existe
      const tableCheck = await query(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'roles'
      `);

      if (tableCheck.rows.length === 0) {
        // Tabela roles não existe — 'super' definitivamente não existe
        expect(true).toBe(true);
        return;
      }

      // Act
      const res = await query(
        `SELECT COUNT(*)::int AS cnt FROM roles WHERE name = 'super'`
      );

      // Assert
      expect(res.rows[0].cnt).toBe(0);
    });

    it('nenhum funcionário deve ter perfil="super"', async () => {
      // Arrange/Act
      const res = await query(
        `SELECT COUNT(*)::int AS cnt FROM funcionarios WHERE perfil = 'super'`
      );

      // Assert
      expect(res.rows[0].cnt).toBe(0);
    });

    it('nenhum usuário deve ter tipo_usuario="super"', async () => {
      // Arrange — verificar se a coluna tipo_usuario existe
      const colCheck = await query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
      `);

      if (colCheck.rows.length === 0) {
        // Coluna não existe — OK
        expect(true).toBe(true);
        return;
      }

      // Act
      const res = await query(
        `SELECT COUNT(*)::int AS cnt FROM usuarios WHERE tipo_usuario::text = 'super'`
      );

      // Assert
      expect(res.rows[0].cnt).toBe(0);
    });
  });
});
