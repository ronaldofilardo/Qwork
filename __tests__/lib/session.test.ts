/**
 * Testes unitários para lib/session.ts
 * Cobertura: createSession, getSession, destroySession, requireAuth, requireRole,
 *            regenerateSession, persistSession
 */

// Mock next/headers ANTES de importar o módulo
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

// Mock session-guards (re-exports)
jest.mock('@/lib/session-guards', () => ({
  requireRHWithEmpresaAccess: jest.fn(),
  requireEntity: jest.fn(),
  requireClinica: jest.fn(),
}));

import {
  createSession,
  getSession,
  destroySession,
  requireAuth,
  requireRole,
  regenerateSession,
  persistSession,
} from '@/lib/session';
import type { Session } from '@/lib/types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 1,
    cpf: '12345678901',
    nome: 'Teste',
    perfil: 'admin',
    mfaVerified: false,
    lastRotation: Date.now(),
    ...overrides,
  } as Session;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lib/session — cookie management', () => {
  describe('createSession', () => {
    it('deve gravar cookie httpOnly com dados da sessão', () => {
      const session = makeSession();
      createSession(session);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      const [cookieName, cookieValue, options] =
        mockCookieStore.set.mock.calls[0];
      expect(cookieName).toBe('bps-session');
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');

      // Deve conter sessionToken gerado
      const parsed = JSON.parse(cookieValue);
      expect(parsed.sessionToken).toBeDefined();
      expect(typeof parsed.sessionToken).toBe('string');
      expect(parsed.sessionToken.length).toBe(64); // 32 bytes hex
      expect(parsed.lastRotation).toBeDefined();
    });

    it('deve definir secure=true quando NODE_ENV=production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      createSession(makeSession());
      const options = mockCookieStore.set.mock.calls[0][2];
      expect(options.secure).toBe(true);

      process.env.NODE_ENV = origEnv;
    });

    it('deve definir maxAge de 8 horas', () => {
      createSession(makeSession());
      const options = mockCookieStore.set.mock.calls[0][2];
      expect(options.maxAge).toBe(60 * 60 * 8);
    });
  });

  describe('getSession', () => {
    it('deve retornar null quando cookie não existe', () => {
      mockCookieStore.get.mockReturnValue(undefined);
      const result = getSession();
      expect(result).toBeNull();
    });

    it('deve retornar null quando cookie vazio', () => {
      mockCookieStore.get.mockReturnValue({ value: '' });
      const result = getSession();
      expect(result).toBeNull();
    });

    it('deve retornar sessão parseada do cookie', () => {
      const session = makeSession({ nome: 'Maria' });
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(session),
      });

      const result = getSession();
      expect(result).not.toBeNull();
      expect(result!.nome).toBe('Maria');
      expect(result!.cpf).toBe('12345678901');
    });

    it('deve marcar rotationRequired quando lastRotation > 2 horas', () => {
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
      const session = makeSession({ lastRotation: threeHoursAgo });
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(session),
      });

      const result = getSession();
      expect(result!.rotationRequired).toBe(true);
    });

    it('não deve marcar rotationRequired quando lastRotation < 2 horas', () => {
      const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
      const session = makeSession({ lastRotation: oneHourAgo });
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(session),
      });

      const result = getSession();
      expect(result!.rotationRequired).toBeUndefined();
    });

    it('deve retornar null quando JSON inválido', () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-json{' });
      const result = getSession();
      expect(result).toBeNull();
    });
  });

  describe('destroySession', () => {
    it('deve deletar cookie bps-session', () => {
      destroySession();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('bps-session');
    });
  });

  describe('regenerateSession', () => {
    it('deve gerar novo sessionToken', () => {
      const original = makeSession({
        sessionToken: 'old-token',
      } as Partial<Session>);
      const rotated = regenerateSession(original);

      expect(rotated.sessionToken).toBeDefined();
      expect(rotated.sessionToken).not.toBe('old-token');
      expect(typeof rotated.sessionToken).toBe('string');
    });

    it('deve atualizar lastRotation', () => {
      const old = makeSession({ lastRotation: 1000 });
      const rotated = regenerateSession(old);

      expect(rotated.lastRotation).toBeGreaterThan(1000);
    });

    it('deve preservar dados da sessão', () => {
      const original = makeSession({ nome: 'Preserva', cpf: '99999999999' });
      const rotated = regenerateSession(original);

      expect(rotated.nome).toBe('Preserva');
      expect(rotated.cpf).toBe('99999999999');
    });
  });

  describe('persistSession', () => {
    it('deve gravar cookie com sessão recebida', () => {
      const session = makeSession({ nome: 'Persistida' });
      persistSession(session);

      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      const [name, value, options] = mockCookieStore.set.mock.calls[0];
      expect(name).toBe('bps-session');
      expect(JSON.parse(value).nome).toBe('Persistida');
      expect(options.httpOnly).toBe(true);
    });
  });
});

describe('lib/session — auth guards', () => {
  describe('requireAuth', () => {
    it('deve retornar sessão quando autenticado', async () => {
      const session = makeSession();
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(session),
      });

      const result = await requireAuth();
      expect(result.cpf).toBe('12345678901');
    });

    it('deve lançar erro quando não autenticado', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      await expect(requireAuth()).rejects.toThrow('Não autenticado');
    });
  });

  describe('requireRole', () => {
    it('deve retornar sessão quando perfil permitido', async () => {
      const session = makeSession({ perfil: 'admin' });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      const result = await requireRole('admin');
      expect(result.perfil).toBe('admin');
    });

    it('deve aceitar array de perfis', async () => {
      const session = makeSession({ perfil: 'emissor' as any });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      const result = await requireRole(['admin', 'emissor'] as any);
      expect(result.perfil).toBe('emissor');
    });

    it('deve lançar erro quando perfil não permitido', async () => {
      const session = makeSession({ perfil: 'representante' as any });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      await expect(requireRole('admin')).rejects.toThrow('Sem permissão');
    });

    it('deve lançar MFA_REQUIRED para admin sem mfa em production', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const session = makeSession({ perfil: 'admin', mfaVerified: false });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      await expect(requireRole('admin', true)).rejects.toThrow('MFA_REQUIRED');

      process.env.NODE_ENV = origEnv;
    });

    it('não deve exigir MFA quando enforceMfa=false', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const session = makeSession({ perfil: 'admin', mfaVerified: false });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      const result = await requireRole('admin', false);
      expect(result.perfil).toBe('admin');

      process.env.NODE_ENV = origEnv;
    });

    it('não deve exigir MFA em development', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const session = makeSession({ perfil: 'admin', mfaVerified: false });
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });

      const result = await requireRole('admin', true);
      expect(result.perfil).toBe('admin');

      process.env.NODE_ENV = origEnv;
    });
  });
});
