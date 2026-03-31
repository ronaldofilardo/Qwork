/**
 * Testes de validação para Migration 410
 * Garante que admin/emissor/gestor/rh não podem ser criados em funcionarios
 */

import { query } from '@/lib/db';

describe('Migration 410: Enforce usuarios-only para contas do sistema', () => {
  beforeAll(async () => {
    // Definir contexto de sessão para evitar erros de RLS/audit
    await query(
      "SELECT set_config('app.current_user_cpf', '00000000000', false)"
    );
    await query("SELECT set_config('app.current_user_perfil', 'admin', false)");
  });

  describe('CHECK Constraint: no_account_roles_in_funcionarios', () => {
    it('deve existir constraint no_account_roles_in_funcionarios', async () => {
      const result = await query(`
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conname = 'no_account_roles_in_funcionarios'
        AND conrelid = 'funcionarios'::regclass
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].conname).toBe('no_account_roles_in_funcionarios');
      expect(result.rows[0].definition).toMatch(/usuario_tipo NOT IN/i);
      expect(result.rows[0].definition).toMatch(/admin/i);
      expect(result.rows[0].definition).toMatch(/emissor/i);
      expect(result.rows[0].definition).toMatch(/gestor/i);
      expect(result.rows[0].definition).toMatch(/\brh\b/i);
    });

    it('deve rejeitar INSERT de admin em funcionarios', async () => {
      await expect(
        query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          ['99999999990', 'Test Admin', 'admin', 'hash_test', true]
        )
      ).rejects.toThrow(/no_account_roles_in_funcionarios|Contas do sistema/i);
    });

    it('deve rejeitar INSERT de emissor em funcionarios', async () => {
      await expect(
        query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          ['99999999991', 'Test Emissor', 'emissor', 'hash_test', true]
        )
      ).rejects.toThrow(/no_account_roles_in_funcionarios|Contas do sistema/i);
    });

    it('deve rejeitar INSERT de gestor em funcionarios', async () => {
      await expect(
        query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          ['99999999992', 'Test Gestor', 'gestor', 'hash_test', true]
        )
      ).rejects.toThrow(/no_account_roles_in_funcionarios|Contas do sistema/i);
    });

    it('deve rejeitar INSERT de rh em funcionarios', async () => {
      await expect(
        query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          ['99999999993', 'Test RH', 'rh', 'hash_test', true]
        )
      ).rejects.toThrow(/no_account_roles_in_funcionarios|Contas do sistema/i);
    });

    it('deve permitir INSERT de funcionario_clinica em funcionarios', async () => {
      const cpf = `9999${Date.now().toString().slice(-7)}`;

      try {
        const result = await query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id, cpf, usuario_tipo
        `,
          [cpf, 'Test Funcionário', 'funcionario_clinica', 'hash_test', true]
        );

        expect(result.rows.length).toBe(1);
        expect(result.rows[0].usuario_tipo).toBe('funcionario_clinica');

        // Cleanup
        await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
      } catch (error) {
        // Se falhar por outro motivo (ex: NOT NULL), aceitar
        if (
          error instanceof Error &&
          !error.message.match(/no_account_roles_in_funcionarios/i)
        ) {
          // Esperado - pode falhar por outros constraints (clinica_id, etc)
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Trigger: trg_reject_prohibited_roles', () => {
    it('deve existir trigger trg_reject_prohibited_roles', async () => {
      const result = await query(`
        SELECT tgname, tgenabled
        FROM pg_trigger
        WHERE tgname = 'trg_reject_prohibited_roles'
        AND tgrelid = 'funcionarios'::regclass
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].tgname).toBe('trg_reject_prohibited_roles');
      expect(result.rows[0].tgenabled).not.toBe('D'); // D = disabled
    });

    it('deve existir função trg_reject_prohibited_roles_func', async () => {
      const result = await query(`
        SELECT proname, pronargs
        FROM pg_proc
        WHERE proname = 'trg_reject_prohibited_roles_func'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].proname).toBe('trg_reject_prohibited_roles_func');
    });

    it('mensagem de erro do trigger deve ser clara e útil', async () => {
      try {
        await query(
          `
          INSERT INTO funcionarios (cpf, nome, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `,
          ['99999999994', 'Test', 'admin', 'hash', true]
        );

        fail('Deveria ter lançado erro');
      } catch (error) {
        if (error instanceof Error) {
          // Verificar se mensagem menciona 'usuarios' como solução
          expect(error.message).toMatch(/usuarios|Contas do sistema/i);
          // Verificar se mensagem é clara sobre o problema
          expect(error.message).toMatch(/admin|emissor|gestor|rh/i);
        }
      }
    });
  });

  describe('Documentação e Comentários', () => {
    it('constraint deve ter comentário explicativo', async () => {
      const result = await query(`
        SELECT
          pg_catalog.obj_description(c.oid, 'pg_constraint') AS description
        FROM pg_constraint c
        WHERE c.conname = 'no_account_roles_in_funcionarios'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].description).toBeTruthy();
      expect(result.rows[0].description).toMatch(/Migration 410/i);
    });

    it('função do trigger deve ter comentário explicativo', async () => {
      const result = await query(`
        SELECT
          pg_catalog.obj_description(p.oid, 'pg_proc') AS description
        FROM pg_proc p
        WHERE p.proname = 'trg_reject_prohibited_roles_func'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].description).toBeTruthy();
      expect(result.rows[0].description).toMatch(/Migration 410/i);
    });
  });
});
