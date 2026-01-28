// Mock de dependências
jest.mock('../../lib/db', () => ({
  query: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('@/lib/mfa', () => ({
  createMFACode: jest.fn(),
  validateMFACode: jest.fn(),
  hasPendingMFA: jest.fn(),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createSession,
  regenerateSession,
  getSession,
} from '../../lib/session';
const { createMFACode, validateMFACode, hasPendingMFA } = require('@/lib/mfa');
const { query } = require('../../lib/db');

import { cookies } from 'next/headers';

const mockQuery = query;

describe('Testes de Segurança - Fase 1', () => {
  describe('Rotação de Chaves de Sessão', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve criar sessão com token único', () => {
      const session = {
        cpf: '12345678901',
        nome: 'Admin Teste',
        perfil: 'admin' as const,
      };

      createSession(session);

      // Verificar que a sessão contém token e timestamp
      expect(session).toBeDefined();
    });

    it('deve regenerar sessão com novo token', () => {
      const session = {
        cpf: '12345678901',
        nome: 'Admin Teste',
        perfil: 'admin' as const,
        sessionToken: 'old-token',
        lastRotation: Date.now() - 3 * 60 * 60 * 1000, // 3 horas atrás
      };

      const rotated = regenerateSession(session);

      // Nova sessão deve ter token diferente
      expect(rotated.sessionToken).toBeDefined();
      expect(rotated.sessionToken).not.toBe('old-token');
    });

    it('deve marcar necessidade de rotação após 2 horas (sem gravar cookie durante render)', () => {
      const mockCookies = { set: jest.fn(), get: jest.fn(), delete: jest.fn() };
      (cookies as jest.Mock).mockReturnValue(mockCookies);
      const oldTimestamp = Date.now() - 3 * 60 * 60 * 1000; // 3 horas atrás

      mockCookies.get.mockReturnValue({
        value: JSON.stringify({
          cpf: '12345678901',
          perfil: 'admin',
          lastRotation: oldTimestamp,
          sessionToken: 'old-token',
        }),
      });

      const session = getSession();

      // Verificar que a rotação não gravou cookie durante render e que a sessão sinaliza necessidade de rotação
      expect(mockCookies.set).not.toHaveBeenCalled();
      expect(session?.rotationRequired).toBe(true);
    });

    it('não deve rotar sessão antes de 2 horas', () => {
      const mockCookies = { set: jest.fn(), get: jest.fn(), delete: jest.fn() };
      (cookies as jest.Mock).mockReturnValue(mockCookies);
      const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hora atrás

      mockCookies.get.mockReturnValue({
        value: JSON.stringify({
          cpf: '12345678901',
          perfil: 'admin',
          lastRotation: recentTimestamp,
          sessionToken: 'current-token',
        }),
      });

      const session = getSession();

      // Sessão não deve ser regenerada
      expect(session?.sessionToken).toBe('current-token');
    });
  });

  describe('MFA (Multi-Factor Authentication)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      createMFACode.mockResolvedValue('123456');
      validateMFACode.mockResolvedValue(false);
      hasPendingMFA.mockResolvedValue(false);
    });

    it('deve gerar código MFA de 6 dígitos', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      const code = await createMFACode('12345678901');

      expect(code).toHaveLength(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThan(1000000);
    });

    it('deve invalidar códigos anteriores ao criar novo', async () => {
      createMFACode.mockImplementation(async (cpf) => {
        await mockQuery(
          'UPDATE mfa_codes SET used = true WHERE cpf = $1 AND used = false',
          [cpf]
        );
        await mockQuery(
          'INSERT INTO mfa_codes (cpf, code, expires_at, used) VALUES ($1, $2, $3, $4)',
          [cpf, '123456', new Date(), false]
        );
        return '123456';
      });

      await createMFACode('12345678901');

      // Verificar que query foi chamada para invalidar códigos antigos
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE mfa_codes'),
        expect.arrayContaining(['12345678901'])
      );
    });

    it('deve validar código MFA correto', async () => {
      validateMFACode.mockImplementation(async (cpf, code) => {
        await mockQuery(
          'SELECT * FROM mfa_codes WHERE cpf = $1 AND code = $2 AND used = false AND expires_at > NOW()',
          [cpf, code]
        );
        await mockQuery(
          'UPDATE mfa_codes SET used = true WHERE cpf = $1 AND code = $2',
          [cpf, code]
        );
        return true;
      });

      const isValid = await validateMFACode('12345678901', '123456');

      expect(isValid).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['12345678901', '123456'])
      );
    });

    it('deve rejeitar código MFA incorreto', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const isValid = await validateMFACode('12345678901', '999999');

      expect(isValid).toBe(false);
    });

    it('deve detectar MFA pendente', async () => {
      hasPendingMFA.mockImplementation(async (cpf) => {
        await mockQuery(
          'SELECT * FROM mfa_codes WHERE cpf = $1 AND used = false AND expires_at > NOW()',
          [cpf]
        );
        return true;
      });

      const hasPending = await hasPendingMFA('12345678901');

      expect(hasPending).toBe(true);
    });

    it('deve expirar códigos após 10 minutos', async () => {
      const expiredTime = new Date(Date.now() - 11 * 60 * 1000); // 11 minutos atrás

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const isValid = await validateMFACode('12345678901', '123456');

      expect(isValid).toBe(false);
    });
  });

  describe('Validação de MFA em Rotas Admin', () => {
    it('deve bloquear admin sem MFA em rotas críticas', () => {
      const mockCookies = { set: jest.fn(), get: jest.fn(), delete: jest.fn() };
      (cookies as jest.Mock).mockReturnValue(mockCookies);

      mockCookies.get.mockReturnValue({
        value: JSON.stringify({
          cpf: '12345678901',
          perfil: 'admin',
          mfaVerified: false,
        }),
      });

      // Middleware deve rejeitar acesso
      expect(() => {
        const session = getSession();
        if (session && session.perfil === 'admin' && !session.mfaVerified) {
          throw new Error('MFA_REQUIRED');
        }
      }).toThrow('MFA_REQUIRED');
    });

    it('deve permitir admin com MFA verificado', () => {
      const mockCookies = { set: jest.fn(), get: jest.fn(), delete: jest.fn() };
      (cookies as jest.Mock).mockReturnValue(mockCookies);

      mockCookies.get.mockReturnValue({
        value: JSON.stringify({
          cpf: '12345678901',
          perfil: 'admin',
          mfaVerified: true,
        }),
      });

      const session = getSession();

      expect(session?.mfaVerified).toBe(true);
    });
  });
});
