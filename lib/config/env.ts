/**
 * Configurações de ambiente e validação
 */

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SESSION_SECRET: process.env.SESSION_SECRET || '',
  AUTHORIZED_ADMIN_IPS: process.env.AUTHORIZED_ADMIN_IPS?.split(',') || [],
} as const;

export function isDevelopment(): boolean {
  return ENV.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return ENV.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return ENV.NODE_ENV === 'test';
}

export function validateEnv(): void {
  if (!ENV.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada');
  }
  if (isProduction() && !ENV.SESSION_SECRET) {
    throw new Error('SESSION_SECRET não configurada em produção');
  }
}
