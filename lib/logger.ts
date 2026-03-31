/**
 * Logger utilitário do QWork.
 *
 * Em produção, suprime mensagens de nível "log" (debug/info) para reduzir
 * ruído nos logs da plataforma. Mensagens de "warn" e "error" sempre saem.
 *
 * Uso: import { logger } from '@/lib/logger';
 *      logger.log('[MODULE] mensagem');   // suprimido em prod
 *      logger.warn('[MODULE] aviso');     // sempre visível
 *      logger.error('[MODULE] erro', e);  // sempre visível
 */

const isDev = process.env.NODE_ENV !== 'production';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArgs = any[];

export const logger = {
  log: isDev ? (...args: LogArgs) => console.log(...args) : () => undefined,
  warn: (...args: LogArgs) => console.warn(...args),
  error: (...args: LogArgs) => console.error(...args),
  info: isDev ? (...args: LogArgs) => console.info(...args) : () => undefined,
};
