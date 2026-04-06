/**
 * Testes unitarios para:
 *  - lib/db/dynamic-pool.ts  (getDynamicPool)
 *  - POST /api/auth/emissor/selecionar-ambiente  (rota)
 *
 * Testes do environment-guard estao em db-environment-guard.test.ts
 */

// ============================================================================
// Mock do modulo pg — deve ocorrer antes de qualquer import do dynamic-pool
// import pg from 'pg'; const { Pool } = pg;
// => o default export deve ser { Pool: ... }
// ============================================================================
jest.mock('pg', () => {
  const mockInstance = {
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    query: jest.fn(),
  };
  const PoolMock = jest.fn().mockImplementation(() => mockInstance);
  return { default: { Pool: PoolMock }, Pool: PoolMock };
});

// Mocks para a rota
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  persistSession: jest.fn(),
}));

jest.mock('@/lib/db/environment-guard', () => ({
  validateDbEnvironmentAccess: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue(() => null),
  RATE_LIMIT_CONFIGS: { auth: {} },
}));

import { getSession, persistSession } from '@/lib/session';
import { validateDbEnvironmentAccess } from '@/lib/db/environment-guard';
import { POST } from '@/app/api/auth/emissor/selecionar-ambiente/route';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockPersistSession = persistSession as jest.MockedFunction<
  typeof persistSession
>;
const mockValidate = validateDbEnvironmentAccess as jest.MockedFunction<
  typeof validateDbEnvironmentAccess
>;

// ============================================================================
// SECAO 1 — getDynamicPool
// ============================================================================

describe('getDynamicPool', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deve criar pool para development com LOCAL_DATABASE_URL', async () => {
    process.env.LOCAL_DATABASE_URL = 'postgresql://localhost/nr-bps_db';
    const { getDynamicPool } = await import('@/lib/db/dynamic-pool');
    const pool = getDynamicPool('development');
    expect(pool).toBeDefined();
  });

  it('deve lancar erro quando LOCAL_DATABASE_URL ausente', async () => {
    const original = process.env.LOCAL_DATABASE_URL;
    delete process.env.LOCAL_DATABASE_URL;
    const { getDynamicPool } = await import('@/lib/db/dynamic-pool');
    expect(() => getDynamicPool('development')).toThrow(/LOCAL_DATABASE_URL/);
    process.env.LOCAL_DATABASE_URL = original;
  });

  it('deve lancar erro quando STAGING_DATABASE_URL ausente', async () => {
    const original = process.env.STAGING_DATABASE_URL;
    delete process.env.STAGING_DATABASE_URL;
    const { getDynamicPool } = await import('@/lib/db/dynamic-pool');
    expect(() => getDynamicPool('staging')).toThrow(/STAGING_DATABASE_URL/);
    process.env.STAGING_DATABASE_URL = original;
  });

  it('deve reutilizar o mesmo pool ao chamar duas vezes com mesmo ambiente', async () => {
    process.env.LOCAL_DATABASE_URL = 'postgresql://localhost/nr-bps_db';
    const { getDynamicPool } = await import('@/lib/db/dynamic-pool');
    const pool1 = getDynamicPool('development');
    const pool2 = getDynamicPool('development');
    expect(pool1).toBe(pool2);
  });
});

// ============================================================================
// SECAO 2 — POST /api/auth/emissor/selecionar-ambiente
// ============================================================================

describe('POST /api/auth/emissor/selecionar-ambiente', () => {
  const makeRequest = (body: unknown) =>
    new Request('http://localhost/api/auth/emissor/selecionar-ambiente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 quando nao ha sessao', async () => {
    mockGetSession.mockReturnValue(null);
    const res = await POST(makeRequest({ dbEnvironment: 'development' }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 quando perfil nao e emissor', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh' as any,
    } as any);
    const res = await POST(makeRequest({ dbEnvironment: 'development' }));
    expect(res.status).toBe(403);
  });

  it('deve retornar 403 quando guard nao permite o ambiente', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    } as any);
    mockValidate.mockReturnValue({
      allowed: false,
      reason: 'CPF nao autorizado',
    });
    const res = await POST(makeRequest({ dbEnvironment: 'production' }));
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 e persistir sessao quando tudo valido', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    } as any);
    mockValidate.mockReturnValue({ allowed: true, reason: '' });
    mockPersistSession.mockResolvedValue(undefined as any);

    const res = await POST(makeRequest({ dbEnvironment: 'development' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dbEnvironment).toBe('development');
    expect(mockPersistSession).toHaveBeenCalledWith(
      expect.objectContaining({ dbEnvironment: 'development' })
    );
  });

  it('deve retornar 400 para dbEnvironment invalido', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Emissor',
      perfil: 'emissor',
    } as any);
    const res = await POST(makeRequest({ dbEnvironment: 'invalid_value' }));
    expect(res.status).toBe(400);
  });
});
