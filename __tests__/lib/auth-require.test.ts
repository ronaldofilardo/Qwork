/**
 * @file __tests__/lib/auth-require.test.ts
 * Testes unitários para lib/auth-require.ts
 * Cobertura: requireRole (delegação), convenience functions, AccessDeniedError, withAuth
 */

// Mock next/headers e next/server antes de imports
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, opts?: any) => ({
      status: opts?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock session-guards
jest.mock('@/lib/session-guards', () => ({
  requireRHWithEmpresaAccess: jest.fn(),
  requireEntity: jest.fn(),
  requireClinica: jest.fn(),
}));

import {
  AccessDeniedError,
  requireRole,
  requireEmissor,
  requireAdmin,
  requireRH,
  requireGestorEntidade,
  requireGestor,
} from '@/lib/auth-require';
import type { Session } from '@/lib/session';

function makeSession(perfil: string): Session {
  return {
    cpf: '12345678901',
    nome: 'Teste',
    perfil,
    mfaVerified: false,
    lastRotation: Date.now(),
  } as Session;
}

describe('lib/auth-require — AccessDeniedError', () => {
  it('deve ser instância de Error', () => {
    const err = new AccessDeniedError('teste');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AccessDeniedError');
    expect(err.message).toBe('teste');
  });

  it('deve usar mensagem padrão quando não especificada', () => {
    const err = new AccessDeniedError();
    expect(err.message).toBe('Acesso negado');
  });
});

describe('lib/auth-require — requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar sessão quando perfil é permitido', async () => {
    const session = makeSession('rh');
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(session),
    });

    const result = await requireRole(['rh']);
    expect(result.perfil).toBe('rh');
  });

  it('deve lançar AccessDeniedError quando não autenticado', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(requireRole(['rh'])).rejects.toThrow(AccessDeniedError);
    await expect(requireRole(['rh'])).rejects.toThrow(
      'Usuário não autenticado'
    );
  });

  it('deve lançar AccessDeniedError quando perfil não é permitido', async () => {
    const session = makeSession('funcionario');
    mockCookieStore.get.mockReturnValue({
      value: JSON.stringify(session),
    });

    await expect(requireRole(['rh', 'admin'])).rejects.toThrow(
      AccessDeniedError
    );
  });
});

describe('lib/auth-require — convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requireEmissor deve aceitar emissor', async () => {
    const session = makeSession('emissor');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireEmissor();
    expect(result.perfil).toBe('emissor');
  });

  it('requireAdmin deve aceitar admin', async () => {
    const session = makeSession('admin');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireAdmin();
    expect(result.perfil).toBe('admin');
  });

  it('requireRH deve aceitar rh', async () => {
    const session = makeSession('rh');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireRH();
    expect(result.perfil).toBe('rh');
  });

  it('requireGestorEntidade deve aceitar gestor', async () => {
    const session = makeSession('gestor');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireGestorEntidade();
    expect(result.perfil).toBe('gestor');
  });

  it('requireGestor deve aceitar rh', async () => {
    const session = makeSession('rh');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireGestor();
    expect(result.perfil).toBe('rh');
  });

  it('requireGestor deve aceitar gestor', async () => {
    const session = makeSession('gestor');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    const result = await requireGestor();
    expect(result.perfil).toBe('gestor');
  });

  it('requireRH deve rejeitar funcionario', async () => {
    const session = makeSession('funcionario');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    await expect(requireRH()).rejects.toThrow(AccessDeniedError);
  });

  it('requireAdmin deve rejeitar rh', async () => {
    const session = makeSession('rh');
    mockCookieStore.get.mockReturnValue({ value: JSON.stringify(session) });
    await expect(requireAdmin()).rejects.toThrow(AccessDeniedError);
  });
});
