/**
 * @file __tests__/security/authorization-policies.test.ts
 * @description Testes unitários para lib/authorization/policies.ts
 * @coverage
 *   - assertAuth
 *   - assertRoles
 *   - checkRoles
 *   - assertPolicy (lote:owner, funcionario:read)
 *   - isApiError re-export
 */

import type { Session } from '@/lib/session';
import {
  assertAuth,
  assertRoles,
  checkRoles,
  assertPolicy,
  isApiError,
  ROLES,
} from '@/lib/authorization/policies';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeSession(overrides: Partial<Session>): Session {
  return {
    cpf: '12345678901',
    nome: 'Usuário Teste',
    perfil: 'rh',
    clinica_id: 1,
    ...overrides,
  } as Session;
}

function getError(fn: () => void): unknown {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

// ─────────────────────────────────────────────
// assertAuth
// ─────────────────────────────────────────────

describe('assertAuth', () => {
  it('deve lançar erro 401 quando session é null', () => {
    const err = getError(() => assertAuth(null));
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(401);
    expect((err as any).message).toBe('Autenticação requerida');
  });

  it('deve passar sem lançar quando session está presente', () => {
    const session = makeSession({});
    expect(() => assertAuth(session)).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// assertRoles
// ─────────────────────────────────────────────

describe('assertRoles', () => {
  it('deve lançar 401 quando session é null', () => {
    const err = getError(() => assertRoles(null, [ROLES.RH]));
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(401);
  });

  it('deve lançar 403 quando perfil não pertence às roles permitidas', () => {
    const session = makeSession({ perfil: 'funcionario' });
    const err = getError(() => assertRoles(session, [ROLES.RH, ROLES.ADMIN]));
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(403);
    expect((err as any).message).toBe('Acesso negado');
  });

  it('deve passar quando perfil é exatamente uma das roles permitidas', () => {
    const session = makeSession({ perfil: 'rh' });
    expect(() => assertRoles(session, [ROLES.RH, ROLES.GESTOR])).not.toThrow();
  });

  it('deve aceitar admin quando admin está na lista', () => {
    const session = makeSession({ perfil: 'admin' });
    expect(() => assertRoles(session, [ROLES.ADMIN, ROLES.RH])).not.toThrow();
  });

  it('não deve aceitar admin se admin não está na lista de roles', () => {
    const session = makeSession({ perfil: 'admin' });
    const err = getError(() => assertRoles(session, [ROLES.RH, ROLES.GESTOR]));
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(403);
  });

  it('deve aceitar gestor quando gestor está na lista', () => {
    const session = makeSession({ perfil: 'gestor' });
    expect(() =>
      assertRoles(session, [ROLES.RH, ROLES.GESTOR])
    ).not.toThrow();
  });

  it('deve aceitar emissor quando emissor está na lista', () => {
    const session = makeSession({ perfil: 'emissor', clinica_id: undefined });
    expect(() =>
      assertRoles(session, [ROLES.EMISSOR, ROLES.ADMIN])
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// checkRoles
// ─────────────────────────────────────────────

describe('checkRoles', () => {
  it('deve retornar false para session null', () => {
    expect(checkRoles(null, [ROLES.RH])).toBe(false);
  });

  it('deve retornar true quando perfil está na lista', () => {
    const session = makeSession({ perfil: 'rh' });
    expect(checkRoles(session, [ROLES.RH, ROLES.GESTOR])).toBe(true);
  });

  it('deve retornar false quando perfil não está na lista', () => {
    const session = makeSession({ perfil: 'funcionario' });
    expect(checkRoles(session, [ROLES.RH, ROLES.GESTOR])).toBe(false);
  });
});

// ─────────────────────────────────────────────
// assertPolicy: lote:owner
// ─────────────────────────────────────────────

describe("assertPolicy('lote:owner')", () => {
  it('deve permitir admin independente de clinica_id', () => {
    const session = makeSession({ perfil: 'admin', clinica_id: 999 });
    expect(() =>
      assertPolicy('lote:owner', session, { clinica_id: 1 })
    ).not.toThrow();
  });

  it('deve permitir rh com clinica_id correspondente', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 5 });
    expect(() =>
      assertPolicy('lote:owner', session, { clinica_id: 5 })
    ).not.toThrow();
  });

  it('deve rejeitar rh com clinica_id diferente (403)', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 5 });
    const err = getError(() =>
      assertPolicy('lote:owner', session, { clinica_id: 99 })
    );
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(403);
  });

  it('deve permitir gestor com entidade_id correspondente', () => {
    const session = makeSession({
      perfil: 'gestor',
      clinica_id: undefined,
      entidade_id: 10,
    } as any);
    expect(() =>
      assertPolicy('lote:owner', session, { entidade_id: 10 })
    ).not.toThrow();
  });

  it('deve rejeitar gestor com entidade_id diferente (403)', () => {
    const session = makeSession({
      perfil: 'gestor',
      clinica_id: undefined,
      entidade_id: 10,
    } as any);
    const err = getError(() =>
      assertPolicy('lote:owner', session, { entidade_id: 99 })
    );
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(403);
  });

  it('deve lançar 401 se session é null', () => {
    const err = getError(() =>
      assertPolicy('lote:owner', null, { clinica_id: 1 })
    );
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// assertPolicy: funcionario:read
// ─────────────────────────────────────────────

describe("assertPolicy('funcionario:read')", () => {
  it('deve permitir admin', () => {
    const session = makeSession({ perfil: 'admin', clinica_id: 1 });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 1 })
    ).not.toThrow();
  });

  it('deve permitir emissor', () => {
    const session = makeSession({ perfil: 'emissor', clinica_id: undefined });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 1 })
    ).not.toThrow();
  });

  it('deve permitir rh com clinica_id correspondente', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 3 });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 3 })
    ).not.toThrow();
  });

  it('deve rejeitar rh com clinica_id diferente', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 3 });
    const err = getError(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 99 })
    );
    expect(isApiError(err)).toBe(true);
    expect((err as any).status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// isApiError re-export
// ─────────────────────────────────────────────

describe('isApiError', () => {
  it('deve retornar true para erro lançado por assertAuth', () => {
    const err = getError(() => assertAuth(null));
    expect(isApiError(err)).toBe(true);
  });

  it('deve retornar false para erros genéricos', () => {
    expect(isApiError(new Error('generic'))).toBe(false);
    expect(isApiError('string error')).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});
