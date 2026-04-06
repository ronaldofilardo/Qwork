/**
 * __tests__/security/tenant-validation.test.ts
 *
 * Testes para multi-tenant validation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateTenantAccess,
  extractTenantParams,
} from '@/lib/middleware-tenant-validation';
import type { Session } from '@/lib/session';

describe('Multi-Tenant Validation', () => {
  const mockSession = (overrides: Partial<Session> = {}): Session => ({
    cpf: '12345678901',
    nome: 'Usuario Teste',
    perfil: 'rh',
    ...overrides,
  });

  describe('validateTenantAccess', () => {
    it('retorna null para admin acessando qualquer clinica_id', () => {
      const session = mockSession({ perfil: 'admin' });
      const result = validateTenantAccess(session, { clinica_id: 999 });
      expect(result).toBeNull();
    });

    it('bloqueia RH acessando clinica_id diferente', () => {
      const session = mockSession({ perfil: 'rh', clinica_id: 1 });
      const result = validateTenantAccess(session, { clinica_id: 2 });
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('permite RH acessar clinica_id próprio', () => {
      const session = mockSession({ perfil: 'rh', clinica_id: 1 });
      const result = validateTenantAccess(session, { clinica_id: 1 });
      expect(result).toBeNull();
    });

    it('bloqueia Gestor acessando entidade_id diferente', () => {
      const session = mockSession({
        perfil: 'gestor',
        entidade_id: 100,
      });
      const result = validateTenantAccess(session, { entidade_id: 200 });
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it('permite Gestor acessar entidade_id próprio', () => {
      const session = mockSession({ perfil: 'gestor', entidade_id: 100 });
      const result = validateTenantAccess(session, { entidade_id: 100 });
      expect(result).toBeNull();
    });

    it('retorna null para emissor (sem validação tenant)', () => {
      const session = mockSession({ perfil: 'emissor' });
      const result = validateTenantAccess(session, { clinica_id: 999 });
      expect(result).toBeNull();
    });

    it('bloqueia vendedor acessando tenant_id', () => {
      const session = mockSession({ perfil: 'vendedor' });
      const result = validateTenantAccess(session, { clinica_id: 1 });
      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });
  });

  describe('extractTenantParams', () => {
    it('extrai parâmetros de SearchParams', () => {
      const params = new URLSearchParams(
        'clinica_id=1&entidade_id=2&empresa_id=3'
      );
      const result = extractTenantParams(params);
      expect(result).toEqual({
        clinica_id: '1',
        entidade_id: '2',
        empresa_id: '3',
      });
    });

    it('retorna null para parâmetros ausentes', () => {
      const params = new URLSearchParams('other=value');
      const result = extractTenantParams(params);
      expect(result.clinica_id).toBeNull();
      expect(result.entidade_id).toBeNull();
    });
  });
});
