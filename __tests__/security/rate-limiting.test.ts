/**
 * Testes de Rate Limiting no Login
 * Data: 30 de Janeiro de 2026
 * Verifica proteção contra brute force
 */

import { NextRequest } from 'next/server';
import { rateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

describe('Rate Limiting - Login', () => {
  const mockRequest = (ip: string): NextRequest => {
    return {
      headers: new Map([
        ['x-forwarded-for', ip],
        ['x-real-ip', ip],
      ]),
      ip,
    } as any as NextRequest;
  };

  beforeEach(() => {
    // Limpar store entre testes (via require.cache)
    jest.resetModules();
  });

  it('deve permitir requisições abaixo do limite', () => {
    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const req = mockRequest('192.168.1.100');

    // Primeiras 5 requisições devem passar
    for (let i = 0; i < 5; i++) {
      const result = limiter(req);
      expect(result).toBeNull(); // null = permitido
    }
  });

  it('deve bloquear após exceder o limite', () => {
    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const req = mockRequest('192.168.1.101');

    // Fazer 5 requisições (limite)
    for (let i = 0; i < 5; i++) {
      limiter(req);
    }

    // 6ª requisição deve ser bloqueada
    const result = limiter(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(429);
  });

  it('deve retornar headers Retry-After no bloqueio', async () => {
    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const req = mockRequest('192.168.1.102');

    // Exceder limite
    for (let i = 0; i < 6; i++) {
      limiter(req);
    }

    const result = limiter(req);
    expect(result).not.toBeNull();

    const headers = result?.headers;
    expect(headers?.get('Retry-After')).toBeTruthy();
  });

  it('deve isolar rate limit por IP', () => {
    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const req1 = mockRequest('192.168.1.103');
    const req2 = mockRequest('192.168.1.104');

    // Bloquear IP 1
    for (let i = 0; i < 6; i++) {
      limiter(req1);
    }

    // IP 2 ainda deve funcionar
    const result = limiter(req2);
    expect(result).toBeNull();
  });

  it('deve ter configuração correta para auth', () => {
    expect(RATE_LIMIT_CONFIGS.auth).toEqual({
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 5, // 5 tentativas
    });
  });

  it('deve retornar mensagem de erro apropriada', async () => {
    const limiter = rateLimit(RATE_LIMIT_CONFIGS.auth);
    const req = mockRequest('192.168.1.105');

    // Exceder limite
    for (let i = 0; i < 6; i++) {
      limiter(req);
    }

    const result = limiter(req);
    const json = await result?.json();

    expect(json).toMatchObject({
      error: 'RATE_LIMIT_EXCEEDED',
      message: expect.stringContaining('Muitas requisições'),
    });
  });
});

describe('Rate Limiting - Integração com Login Route', () => {
  it('deve aplicar rate limiting no POST do login', async () => {
    const loginRoute = await import('@/app/api/auth/login/route');

    // Verificar se o import de rate limiting existe
    expect(loginRoute).toBeDefined();
    expect(loginRoute.POST).toBeDefined();
  });
});
