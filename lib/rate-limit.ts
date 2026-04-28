// Rate Limiting — camada dupla: IP-based (middleware/Edge) + DB-based (API routes/Node.js)
//
// Arquitetura:
//  - rateLimit()       → fire-and-forget síncrono (sempre retorna null).
//                        Dispara verificação assíncrona em background para fins de log.
//  - rateLimitAsync()  → verificação bloqueante no banco de dados.
//                        Suporta chave de IP ou de usuário autenticado (dual-key).
//  - cleanupRateLimitStore() → remove registros expirados da tabela rate_limit_entries.
//
// Ver migration: database/migrations/1147_create_rate_limit_entries.sql

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições por janela
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
};

/**
 * Garante que a tabela rate_limit_entries existe.
 * Roda apenas uma vez por instância (cacheada via flag).
 */
let tableEnsured = false;
async function ensureRateLimitTable(): Promise<void> {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS rate_limit_entries (
      key        VARCHAR(255) NOT NULL PRIMARY KEY,
      count      INTEGER      NOT NULL DEFAULT 1,
      expires_at TIMESTAMPTZ  NOT NULL
    )
  `);
  tableEnsured = true;
}

/**
 * Extrai o IP da requisição de forma padronizada.
 */
function extractIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

// ─── rateLimitAsync — bloqueante, DB-backed ──────────────────────────────────

/**
 * Verificação de rate limit baseada em banco de dados.
 * Suporta chave customizada (IP ou hash do usuário autenticado).
 *
 * Falha-aberta (fail-open): se o DB estiver indisponível, permite a requisição.
 *
 * @param request  - NextRequest
 * @param config   - Configuração de janela/limite (default: 100 req/15min)
 * @param keyOverride - Chave customizada (default: rate-limit:<ip>)
 * @returns NextResponse com status 429 se excedido, null caso contrário
 */
export async function rateLimitAsync(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {},
  keyOverride?: string
): Promise<NextResponse | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const ip = extractIp(request);
  const key = keyOverride ?? `rate-limit:${ip}`;

  try {
    await ensureRateLimitTable();

    const result = await query<{ count: number; remaining_ms: number }>(
      `INSERT INTO rate_limit_entries (key, count, expires_at)
       VALUES ($1, 1, NOW() + ($2 * INTERVAL '1 millisecond'))
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN rate_limit_entries.expires_at < NOW() THEN 1
           ELSE rate_limit_entries.count + 1
         END,
         expires_at = CASE
           WHEN rate_limit_entries.expires_at < NOW()
             THEN NOW() + ($2 * INTERVAL '1 millisecond')
           ELSE rate_limit_entries.expires_at
         END
       RETURNING
         count,
         EXTRACT(EPOCH FROM (expires_at - NOW())) * 1000 AS remaining_ms`,
      [key, finalConfig.windowMs]
    );

    const { count, remaining_ms } = result.rows[0];

    if (count > finalConfig.maxRequests) {
      const retryAfter = Math.ceil(remaining_ms / 1000);
      const retryAfterMinutes = Math.ceil(retryAfter / 60);
      console.error(
        `[RATE_LIMIT] Chave "${key}" excedeu limite: ${count}/${finalConfig.maxRequests}`
      );
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Muitas tentativas de login. Acesso bloqueado por ${retryAfterMinutes} minuto(s) por segurança. Tente novamente mais tarde.`,
          retryAfter,
          retryAfterMinutes,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    return null;
  } catch (err) {
    // Fail-open: não bloqueia o usuário se o DB estiver indisponível
    console.error(
      '[RATE_LIMIT] Falha ao verificar rate limit (fail-open):',
      err
    );
    return null;
  }
}

// ─── cleanupRateLimitStore — manutenção da tabela ────────────────────────────

/**
 * Remove registros expirados da tabela rate_limit_entries.
 * Deve ser chamado periodicamente (ex: cron job ou via API admin).
 *
 * @returns Número de registros deletados (0 em caso de falha)
 */
export async function cleanupRateLimitStore(): Promise<number> {
  try {
    const result = await query(
      'DELETE FROM rate_limit_entries WHERE expires_at < NOW()'
    );
    return result.rowCount ?? 0;
  } catch (err) {
    console.error('[RATE_LIMIT] Falha ao limpar rate limit store:', err);
    return 0;
  }
}

// ─── rateLimit — síncrono, fire-and-forget ───────────────────────────────────

/**
 * Versão síncrona de rate limiting.
 * Sempre retorna null (não bloqueia o request).
 * Dispara verificação assíncrona via rateLimitAsync em background para logging.
 *
 * Uso: em contextos onde a latência é crítica e o middleware já bloqueia abusos.
 * Para bloqueio real em rotas críticas, use rateLimitAsync() diretamente.
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (request: NextRequest): NextResponse | null => {
    const ip = extractIp(request);
    const key = `rate-limit:${ip}`;

    // Dispara contagem assíncrona em background (não aguarda)
    rateLimitAsync(request, finalConfig, key).catch(() => {
      // Erro silenciado — rateLimit síncrono nunca deve bloquear
    });

    return null; // Sempre permite (bloqueio real é feito via rateLimitAsync nas rotas)
  };
}

// ─── Configurações por tipo de endpoint ──────────────────────────────────────

/**
 * Configurações predefinidas de rate limiting por contexto.
 *
 * Dual-key strategy no middleware:
 *   - user:  por usuário autenticado (quota individual)
 *   - shared_ip: por IP quando múltiplos usuários autenticados compartilham rede
 *   - auth:  por IP na rota de login (prevenção de brute-force)
 *   - api:   por IP para rotas públicas não autenticadas
 */
export const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 tentativas / 5 min (brute-force)
  api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 req / 15 min (público)
  adminFinanceiro: { windowMs: 10 * 60 * 1000, maxRequests: 50 }, // 50 req / 10 min
  user: { windowMs: 15 * 60 * 1000, maxRequests: 300 }, // 300 req / 15 min por usuário
  shared_ip: { windowMs: 15 * 60 * 1000, maxRequests: 600 }, // 600 req / 15 min por IP (autenticado)
} as const;
