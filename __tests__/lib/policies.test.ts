/**
 * Testes unitários: lib/authorization/policies.ts
 *
 * Cobertura:
 *   - checkRoles (helper sem exceção)
 *   - assertAuth (401 se sem sessão)
 *   - assertRoles (401 sem sessão, 403 role errada, sucesso)
 *   - assertPolicy('lote:owner') — admin, rh, gestor, negado
 *   - assertPolicy('funcionario:read') — admin, emissor, rh, gestor, negado
 */

import {
  checkRoles,
  assertAuth,
  assertRoles,
  assertPolicy,
  ROLES,
  isApiError,
} from '@/lib/authorization/policies';
import type { Session } from '@/lib/session';

// ─────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    cpf: '12345678901',
    nome: 'Teste',
    perfil: 'admin',
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// checkRoles
// ─────────────────────────────────────────────

describe('checkRoles', () => {
  it('deve retornar false quando session é null', () => {
    expect(checkRoles(null, [ROLES.ADMIN])).toBe(false);
  });

  it('deve retornar true quando perfil está na lista', () => {
    const session = makeSession({ perfil: 'rh' });
    expect(checkRoles(session, [ROLES.RH, ROLES.GESTOR])).toBe(true);
  });

  it('deve retornar false quando perfil NÃO está na lista', () => {
    const session = makeSession({ perfil: 'funcionario' });
    expect(checkRoles(session, [ROLES.ADMIN, ROLES.RH])).toBe(false);
  });

  it('deve aceitar lista vazia — sempre false', () => {
    const session = makeSession({ perfil: 'admin' });
    expect(checkRoles(session, [])).toBe(false);
  });
});

// ─────────────────────────────────────────────
// assertAuth
// ─────────────────────────────────────────────

describe('assertAuth', () => {
  it('deve lançar erro 401 quando session é null', () => {
    try {
      assertAuth(null);
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
      }
    }
  });

  it('deve passar sem erro quando sessão existe', () => {
    expect(() => assertAuth(makeSession())).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// assertRoles
// ─────────────────────────────────────────────

describe('assertRoles', () => {
  it('deve lançar 401 quando session é null', () => {
    try {
      assertRoles(null, [ROLES.ADMIN]);
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(401);
      }
    }
  });

  it('deve lançar 403 quando perfil não está na lista', () => {
    const session = makeSession({ perfil: 'funcionario' });
    try {
      assertRoles(session, [ROLES.ADMIN]);
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
      }
    }
  });

  it('deve passar quando perfil é admin e admin está na lista', () => {
    expect(() => assertRoles(makeSession(), [ROLES.ADMIN])).not.toThrow();
  });

  it('deve aceitar múltiplas roles', () => {
    const session = makeSession({ perfil: 'rh' });
    expect(() =>
      assertRoles(session, [ROLES.ADMIN, ROLES.RH, ROLES.GESTOR])
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// assertPolicy — lote:owner
// ─────────────────────────────────────────────

describe('assertPolicy — lote:owner', () => {
  it('deve permitir admin independente de clinica_id', () => {
    const session = makeSession({ perfil: 'admin' });
    expect(() =>
      assertPolicy('lote:owner', session, { clinica_id: 999 })
    ).not.toThrow();
  });

  it('deve permitir rh quando clinica_id coincide', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 10 });
    expect(() =>
      assertPolicy('lote:owner', session, { clinica_id: 10 })
    ).not.toThrow();
  });

  it('deve negar rh quando clinica_id difere', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 10 });
    try {
      assertPolicy('lote:owner', session, { clinica_id: 99 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(403);
    }
  });

  it('deve permitir gestor quando entidade_id coincide', () => {
    const session = makeSession({ perfil: 'gestor', entidade_id: 5 });
    expect(() =>
      assertPolicy('lote:owner', session, { entidade_id: 5 })
    ).not.toThrow();
  });

  it('deve negar gestor quando entidade_id difere', () => {
    const session = makeSession({ perfil: 'gestor', entidade_id: 5 });
    try {
      assertPolicy('lote:owner', session, { entidade_id: 99 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(403);
    }
  });

  it('deve negar vendedor mesmo com clinica_id', () => {
    const session = makeSession({ perfil: 'vendedor' });
    try {
      assertPolicy('lote:owner', session, { clinica_id: 1 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(403);
    }
  });

  it('deve lançar 401 quando session é null', () => {
    try {
      assertPolicy('lote:owner', null, { clinica_id: 1 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(401);
    }
  });
});

// ─────────────────────────────────────────────
// assertPolicy — funcionario:read
// ─────────────────────────────────────────────

describe('assertPolicy — funcionario:read', () => {
  it('deve permitir admin', () => {
    const session = makeSession({ perfil: 'admin' });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 1 })
    ).not.toThrow();
  });

  it('deve permitir emissor (acesso global)', () => {
    const session = makeSession({ perfil: 'emissor' });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 1 })
    ).not.toThrow();
  });

  it('deve permitir rh com clinica_id correto', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 7 });
    expect(() =>
      assertPolicy('funcionario:read', session, { clinica_id: 7 })
    ).not.toThrow();
  });

  it('deve negar rh com clinica_id errado', () => {
    const session = makeSession({ perfil: 'rh', clinica_id: 7 });
    try {
      assertPolicy('funcionario:read', session, { clinica_id: 99 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(403);
    }
  });

  it('deve permitir gestor com entidade_id correto', () => {
    const session = makeSession({ perfil: 'gestor', entidade_id: 3 });
    expect(() =>
      assertPolicy('funcionario:read', session, { entidade_id: 3 })
    ).not.toThrow();
  });

  it('deve negar funcionário comum', () => {
    const session = makeSession({ perfil: 'funcionario' });
    try {
      assertPolicy('funcionario:read', session, { clinica_id: 1 });
      fail('deveria ter lançado');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) expect(err.status).toBe(403);
    }
  });
});
