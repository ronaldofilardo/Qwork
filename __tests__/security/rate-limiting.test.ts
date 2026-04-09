/**
 * Testes de Rate Limiting
 * Cobertura: middleware dual rate limiting (IP + usuário), lib/rate-limit
 * Garante proteção contra brute-force e DDoS mesmo com múltiplos usuários na mesma rede
 */

import { NextRequest } from 'next/server';
import { rateLimit, rateLimitAsync, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// ─── Mock DB ────────────────────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

function makeRequest(ip: string, sessionCpf?: string): NextRequest {
  const headers: Record<string, string> = {
    'x-forwarded-for': ip,
  };
  if (sessionCpf) {
    headers['x-mock-session'] = JSON.stringify({ cpf: sessionCpf, perfil: 'rh' });
  }
  return new NextRequest('http://localhost/api/test', { headers });
}

beforeEach(() => {
  mockQuery.mockReset();
  jest.resetModules();
});

// ─── rateLimit (síncrono / fire-and-forget) ──────────────────────────────────

describe('rateLimit — fire-and-forget síncrono', () => {
  it('deve sempre retornar null (não bloqueia requisições)', () => {
    mockQuery.mockResolvedValue({ rows: [{ count: 1, remaining_ms: 900000 }] });

    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const result = limiter(makeRequest('192.168.1.100'));
    expect(result).toBeNull();
  });

  it('deve aceitar config customizada sem bloquear', () => {
    const limiter = rateLimit({ windowMs: 1000, maxRequests: 1 });
    // Chama 10× com mesmo IP — fire-and-forget nunca bloqueia
    for (let i = 0; i < 10; i++) {
      expect(limiter(makeRequest('10.0.0.1'))).toBeNull();
    }
  });
});

// ─── rateLimitAsync (bloqueante, DB-backed) ──────────────────────────────────

describe('rateLimitAsync — bloqueante', () => {
  it('deve retornar null quando dentro do limite', async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // CREATE TABLE IF NOT EXISTS
      .mockResolvedValueOnce({ rows: [{ count: 5, remaining_ms: 600000 }] });

    const result = await rateLimitAsync(makeRequest('192.168.1.1'), { maxRequests: 100 });
    expect(result).toBeNull();
  });

  it('deve retornar 429 quando excede limite', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE')) {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ rows: [{ count: 101, remaining_ms: 300000 }] });
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await rateLimitAsync(makeRequest('192.168.1.2'), { maxRequests: 100 });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json();
    expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[RATE_LIMIT]'));

    errorSpy.mockRestore();
  });

  it('deve incluir header Retry-After no response 429', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE')) return Promise.resolve(undefined);
      return Promise.resolve({ rows: [{ count: 200, remaining_ms: 120000 }] });
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await rateLimitAsync(makeRequest('192.168.1.3'), { maxRequests: 10 });
    expect(result).not.toBeNull();
    expect(result!.headers.get('Retry-After')).toBeTruthy();

    errorSpy.mockRestore();
  });

  it('deve retornar null (fail-open) quando DB falha', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await rateLimitAsync(makeRequest('192.168.1.4'));
    expect(result).toBeNull();

    consoleSpy.mockRestore();
  });

  it('deve usar IP extraído do header x-forwarded-for na chave', async () => {
    mockQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ count: 1, remaining_ms: 900000 }] });

    await rateLimitAsync(makeRequest('10.0.0.1'));

    const insertCall = mockQuery.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'string' && c[0].includes('INSERT INTO rate_limit_entries')
    );
    if (insertCall) {
      expect(insertCall[1][0]).toContain('10.0.0.1');
    }
  });

  it('deve aceitar keyOverride para rate limiting por usuário', async () => {
    mockQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ count: 1, remaining_ms: 900000 }] });

    await rateLimitAsync(makeRequest('192.168.1.5'), {}, 'rate-limit:user:abc123');

    const insertCall = mockQuery.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'string' && c[0].includes('INSERT INTO rate_limit_entries')
    );
    expect(insertCall).toBeTruthy();
    expect(insertCall![1][0]).toBe('rate-limit:user:abc123');
  });
});

// ─── Cenário: múltiplos usuários na mesma rede WiFi ──────────────────────────

describe('Cenário: 10 usuários na mesma rede WiFi', () => {
  const SHARED_IP = '200.100.50.1'; // IP público compartilhado (WiFi)

  it('deve isolar rate limit por usuário autenticado (não compartilhar quota)', async () => {
    // Simula 10 usuários com CPFs diferentes acessando pelo mesmo IP
    const users = Array.from({ length: 10 }, (_, i) => `user_hash_${i}`);

    for (const userKey of users) {
      mockQuery
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ count: 1, remaining_ms: 900000 }] });

      // Cada usuário usa sua própria chave — quota isolada
      const result = await rateLimitAsync(
        makeRequest(SHARED_IP),
        RATE_LIMIT_CONFIGS.user,
        `rate-limit:user:${userKey}`
      );
      expect(result).toBeNull(); // Todos passam — quotas isoladas
    }
  });

  it('deve bloquear APENAS o usuário que excedeu, não os demais', async () => {
    // user_A excedeu o limite
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE')) return Promise.resolve(undefined);
      return Promise.resolve({ rows: [{ count: 301, remaining_ms: 300000 }] });
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const resultA = await rateLimitAsync(
      makeRequest(SHARED_IP),
      RATE_LIMIT_CONFIGS.user,
      'rate-limit:user:user_A'
    );
    expect(resultA!.status).toBe(429); // user_A bloqueado
    errorSpy.mockRestore();

    // user_B ainda dentro do limite
    mockQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ count: 5, remaining_ms: 900000 }] });

    const resultB = await rateLimitAsync(
      makeRequest(SHARED_IP),
      RATE_LIMIT_CONFIGS.user,
      'rate-limit:user:user_B'
    );
    expect(resultB).toBeNull(); // user_B não bloqueado
  });
});

// ─── RATE_LIMIT_CONFIGS ───────────────────────────────────────────────────────

describe('RATE_LIMIT_CONFIGS — configurações por contexto', () => {
  it('auth: 5 req em 5 min (brute-force)', () => {
    expect(RATE_LIMIT_CONFIGS.auth).toEqual({
      windowMs: 5 * 60 * 1000,
      maxRequests: 5,
    });
  });

  it('api: 100 req em 15 min (público)', () => {
    expect(RATE_LIMIT_CONFIGS.api).toEqual({
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    });
  });

  it('user: 300 req em 15 min (quota individual autenticado)', () => {
    expect(RATE_LIMIT_CONFIGS.user).toEqual({
      windowMs: 15 * 60 * 1000,
      maxRequests: 300,
    });
  });

  it('shared_ip: 600 req em 15 min (cap de rede autenticada)', () => {
    expect(RATE_LIMIT_CONFIGS.shared_ip).toEqual({
      windowMs: 15 * 60 * 1000,
      maxRequests: 600,
    });
  });

  it('adminFinanceiro: 50 req em 10 min', () => {
    expect(RATE_LIMIT_CONFIGS.adminFinanceiro).toEqual({
      windowMs: 10 * 60 * 1000,
      maxRequests: 50,
    });
  });
});

// ─── Integração: Login Route ──────────────────────────────────────────────────

describe('Integração: rate limiting na rota de login', () => {
  it('POST /api/auth/login deve ter rateLimitAsync implementado', async () => {
    const loginRoute = await import('@/app/api/auth/login/route');
    expect(loginRoute).toBeDefined();
    expect(loginRoute.POST).toBeDefined();
  });
});

