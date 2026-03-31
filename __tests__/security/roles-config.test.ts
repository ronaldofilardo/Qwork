/**
 * @file __tests__/security/roles-config.test.ts
 * @description Testes unitários para lib/config/roles.ts
 *   Foco nas mudanças ESC-2: PARALLEL_ROLES, hasRole, ROLE_HIERARCHY equalizado
 */

import {
  ROLES,
  PARALLEL_ROLES,
  ROLE_HIERARCHY,
  hasPermission,
  hasRole,
  isAdmin,
  isGestor,
} from '@/lib/config/roles';

describe('ROLES constant', () => {
  it('deve conter todas as roles esperadas', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.RH).toBe('rh');
    expect(ROLES.GESTOR).toBe('gestor');
    expect(ROLES.EMISSOR).toBe('emissor');
    expect(ROLES.FUNCIONARIO).toBe('funcionario');
  });
});

describe('ROLE_HIERARCHY (ESC-2: roles paralelas equalizadas)', () => {
  it('admin deve ter nível máximo (100)', () => {
    expect(ROLE_HIERARCHY.admin).toBe(100);
  });

  it('rh, gestor e emissor devem ter o mesmo nível (50 — paralelas)', () => {
    expect(ROLE_HIERARCHY.rh).toBe(ROLE_HIERARCHY.gestor);
    expect(ROLE_HIERARCHY.gestor).toBe(ROLE_HIERARCHY.emissor);
    expect(ROLE_HIERARCHY.rh).toBe(50);
  });

  it('funcionario deve ter nível mínimo (10)', () => {
    expect(ROLE_HIERARCHY.funcionario).toBe(10);
  });
});

describe('PARALLEL_ROLES', () => {
  it('deve conter rh, gestor e emissor', () => {
    expect(PARALLEL_ROLES).toContain('rh');
    expect(PARALLEL_ROLES).toContain('gestor');
    expect(PARALLEL_ROLES).toContain('emissor');
  });

  it('não deve conter admin nem funcionario', () => {
    expect(PARALLEL_ROLES).not.toContain('admin');
    expect(PARALLEL_ROLES).not.toContain('funcionario');
  });
});

describe('hasRole', () => {
  it('deve retornar true quando role está na lista', () => {
    expect(hasRole('rh', ['rh', 'gestor'])).toBe(true);
    expect(hasRole('gestor', ['rh', 'gestor'])).toBe(true);
    expect(hasRole('admin', ['admin'])).toBe(true);
  });

  it('deve retornar false quando role não está na lista', () => {
    expect(hasRole('funcionario', ['rh', 'gestor'])).toBe(false);
    expect(hasRole('emissor', ['rh', 'gestor'])).toBe(false);
    expect(hasRole('admin', ['rh', 'gestor'])).toBe(false);
  });

  it('rh e gestor são paralelas — rh não deve dar acesso a gestor e vice-versa', () => {
    expect(hasRole('rh', ['gestor'])).toBe(false);
    expect(hasRole('gestor', ['rh'])).toBe(false);
  });
});

describe('hasPermission', () => {
  it('admin deve ter permissão para qualquer role', () => {
    expect(hasPermission('admin', 'rh')).toBe(true);
    expect(hasPermission('admin', 'gestor')).toBe(true);
    expect(hasPermission('admin', 'emissor')).toBe(true);
    expect(hasPermission('admin', 'funcionario')).toBe(true);
  });

  it('rh não deve ter permissão sobre admin', () => {
    expect(hasPermission('rh', 'admin')).toBe(false);
  });

  it('roles paralelas devem ter permissão igual entre si (mesmo nível)', () => {
    expect(hasPermission('rh', 'gestor')).toBe(true);
    expect(hasPermission('gestor', 'rh')).toBe(true);
    expect(hasPermission('emissor', 'rh')).toBe(true);
  });

  it('funcionario não deve ter permissão sobre nenhuma role acima', () => {
    expect(hasPermission('funcionario', 'rh')).toBe(false);
    expect(hasPermission('funcionario', 'gestor')).toBe(false);
    expect(hasPermission('funcionario', 'admin')).toBe(false);
  });
});

describe('isAdmin', () => {
  it('deve retornar true apenas para admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('rh')).toBe(false);
    expect(isAdmin('gestor')).toBe(false);
  });
});

describe('isGestor', () => {
  it('deve retornar true para rh e gestor', () => {
    expect(isGestor('rh')).toBe(true);
    expect(isGestor('gestor')).toBe(true);
  });

  it('não deve retornar true para admin ou emissor', () => {
    expect(isGestor('admin')).toBe(false);
    expect(isGestor('emissor')).toBe(false);
    expect(isGestor('funcionario')).toBe(false);
  });
});
