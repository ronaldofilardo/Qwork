/**
 * Teste de validação: Migration 1206
 * Valida que a função trg_reject_prohibited_roles_func usa NEW.perfil
 * ao invés de NEW.usuario_tipo
 */

import { query } from '@/lib/db';

describe('Migration 1206: Correção trg_reject_prohibited_roles_func', () => {
  it('deve usar NEW.perfil em vez de NEW.usuario_tipo', async () => {
    const result = await query(
      "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trg_reject_prohibited_roles_func'"
    );

    const functionDef = result.rows[0].pg_get_functiondef as string;

    // Validar que usa NEW.perfil
    expect(functionDef).toContain('NEW.perfil');

    // Validar que NÃO usa NEW.usuario_tipo (evitar o erro original)
    expect(functionDef).not.toContain('NEW.usuario_tipo');

    // Validar que check é para 'gestor_entidade' (o único perfil que deve ser rejeitado em funcionarios)
    expect(functionDef).toContain("'gestor_entidade'");
  });

  it('trigger deve estar attachado à tabela funcionarios', async () => {
    const result = await query(
      "SELECT tgname FROM pg_trigger WHERE tgname = 'trg_reject_prohibited_roles' AND tgrelid = 'funcionarios'::regclass"
    );

    expect(result.rows.length).toBeGreaterThan(0);
  });
});
