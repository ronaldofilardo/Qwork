// Rate Limiting Middleware
// Fase 4: Implementar rate limiting para APIs críticas

import { NextRequest, NextResponse } from 'next/server';

// Armazenamento em memória para rate limiting (produção deve usar Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições por janela
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // 100 requisições por 15 minutos
};

/**
 * Rate limiter baseado em IP
 * TODO: Integrar com Redis para ambientes distribuídos
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (request: NextRequest): NextResponse | null => {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown';

    const now = Date.now();
    const key = `rate-limit:${ip}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Nova janela de tempo
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      });
      return null; // Permite requisição
    }

    if (record.count >= finalConfig.maxRequests) {
      // Limite excedido
      console.error(
        `[RATE_LIMIT] IP ${ip} excedeu limite: ${record.count}/${finalConfig.maxRequests}`
      );
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          },
        }
      );
    }

    // Incrementar contador
    record.count++;
    rateLimitStore.set(key, record);

    return null; // Permite requisição
  };
}

/**
 * Limpar registros expirados (job periódico)
 * TODO: Implementar como cron job
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Configurações específicas por endpoint
 */
export const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 tentativas em 5 minutos
  api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requisições em 15 minutos
  adminFinanceiro: { windowMs: 10 * 60 * 1000, maxRequests: 50 }, // 50 requisições em 10 minutos
};
