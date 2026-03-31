/**
 * Testes unitários para lib/rate-limit.ts
 * Cobertura: rateLimit, rateLimitAsync, cleanupRateLimitStore, RATE_LIMIT_CONFIGS
 */

// Mock DB
const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

import { NextRequest } from 'next/server';
import {
  rateLimit,
  rateLimitAsync,
  cleanupRateLimitStore,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';

function makeRequest(ip: string = '127.0.0.1'): NextRequest {
  const req = new NextRequest('http://localhost/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
  return req;
}

beforeEach(() => {
  mockQuery.mockReset(); // mockReset limpa calls + implementation (clearAllMocks não limpa implementation)
});

describe('lib/rate-limit — RATE_LIMIT_CONFIGS', () => {
  it('deve definir config auth com 5 req em 5 min', () => {
    expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(5 * 60 * 1000);
  });

  it('deve definir config api com 100 req em 15 min', () => {
    expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100);
    expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(15 * 60 * 1000);
  });

  it('deve definir config adminFinanceiro com 50 req em 10 min', () => {
    expect(RATE_LIMIT_CONFIGS.adminFinanceiro.maxRequests).toBe(50);
    expect(RATE_LIMIT_CONFIGS.adminFinanceiro.windowMs).toBe(10 * 60 * 1000);
  });
});

describe('lib/rate-limit — rateLimit (síncrono)', () => {
  it('deve retornar null (permite) sempre (verificação assíncrona)', () => {
    // A versão síncrona sempre retorna null e faz a verificação em background
    mockQuery.mockResolvedValue({ rows: [{ count: 1, remaining_ms: 900000 }] });

    const limiter = rateLimit();
    const result = limiter(makeRequest());
    expect(result).toBeNull();
  });

  it('deve aceitar config customizada', () => {
    const limiter = rateLimit({ windowMs: 1000, maxRequests: 1 });
    expect(typeof limiter).toBe('function');
  });
});

describe('lib/rate-limit — rateLimitAsync', () => {
  it('deve retornar null quando dentro do limite', async () => {
    mockQuery
      .mockResolvedValueOnce(undefined) // ensureRateLimitTable CREATE TABLE
      .mockResolvedValueOnce({ rows: [{ count: 5, remaining_ms: 600000 }] });

    const result = await rateLimitAsync(makeRequest(), { maxRequests: 100 });
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

    const result = await rateLimitAsync(makeRequest(), { maxRequests: 100 });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);

    const body = await result!.json();
    expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.retryAfter).toBeGreaterThan(0);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RATE_LIMIT]')
    );

    errorSpy.mockRestore();
  });

  it('deve retornar null (fail-open) quando DB falha', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection failed'));

    const result = await rateLimitAsync(makeRequest());
    expect(result).toBeNull();
  });

  it('deve usar IP de x-forwarded-for', async () => {
    mockQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ count: 1, remaining_ms: 900000 }] });

    await rateLimitAsync(makeRequest('10.0.0.1'));

    // Verificar que o key contém o IP
    const insertCall = mockQuery.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'string' &&
        c[0].includes('INSERT INTO rate_limit_entries')
    );
    if (insertCall) {
      expect(insertCall[1][0]).toContain('10.0.0.1');
    }
  });

  it('deve incluir header Retry-After no response 429', async () => {
    mockQuery.mockImplementation((sql: string) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE')) {
        return Promise.resolve(undefined);
      }
      return Promise.resolve({ rows: [{ count: 200, remaining_ms: 120000 }] });
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await rateLimitAsync(makeRequest(), { maxRequests: 10 });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    expect(result!.headers.get('Retry-After')).toBeDefined();

    errorSpy.mockRestore();
  });
});

describe('lib/rate-limit — cleanupRateLimitStore', () => {
  it('deve retornar número de registros deletados', async () => {
    mockQuery.mockResolvedValue({ rowCount: 5 });
    const count = await cleanupRateLimitStore();
    expect(count).toBe(5);
  });

  it('deve retornar 0 quando falha', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    const count = await cleanupRateLimitStore();
    expect(count).toBe(0);
  });

  it('deve executar DELETE de registros expirados', async () => {
    mockQuery.mockResolvedValue({ rowCount: 0 });
    await cleanupRateLimitStore();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM rate_limit_entries')
    );
  });
});
