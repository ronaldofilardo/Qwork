// Health Checks e Monitoring
// Fase 5: Sistema de verificação de saúde e monitoramento

import { query } from './db';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthStatus;
    session: HealthStatus;
    mfa: HealthStatus;
    planos: HealthStatus;
  };
  version: string;
  environment: string;
}

export interface HealthStatus {
  status: 'ok' | 'warning' | 'error';
  message: string;
  responseTime?: number;
}

/**
 * Verificar saúde do banco de dados
 */
async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();

  try {
    await query('SELECT 1');
    const responseTime = Date.now() - start;

    if (responseTime > 1000) {
      return {
        status: 'warning',
        message: 'Database responde lentamente',
        responseTime,
      };
    }

    return {
      status: 'ok',
      message: 'Database conectado',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown'}`,
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Verificar tabelas de sessão
 */
async function checkSession(): Promise<HealthStatus> {
  try {
    const _result = await query('SELECT COUNT(*) FROM funcionarios LIMIT 1');

    return {
      status: 'ok',
      message: 'Sistema de sessão operacional',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Session check failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Verificar tabela de MFA
 */
async function checkMFA(): Promise<HealthStatus> {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM mfa_codes WHERE expires_at > NOW()'
    );
    const activeCodes = result.rows[0]?.count || 0;

    if (activeCodes > 1000) {
      return {
        status: 'warning',
        message: `Muitos códigos MFA ativos: ${activeCodes}`,
      };
    }

    return {
      status: 'ok',
      message: 'Sistema MFA operacional',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `MFA check failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Verificar sistema de planos
 */
async function checkPlanos(): Promise<HealthStatus> {
  try {
    const result = await query(
      "SELECT COUNT(*) FROM contratos_planos WHERE status = 'ativo'"
    );
    const activeContracts = result.rows[0]?.count || 0;

    return {
      status: 'ok',
      message: `${activeContracts} contratos ativos`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Planos check failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Executar todos os health checks
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const [database, session, mfa, planos] = await Promise.all([
    checkDatabase(),
    checkSession(),
    checkMFA(),
    checkPlanos(),
  ]);

  const checks = { database, session, mfa, planos };

  // Determinar status geral
  const hasError = Object.values(checks).some((c) => c.status === 'error');
  const hasWarning = Object.values(checks).some((c) => c.status === 'warning');

  const status = hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Métricas de sistema
 */
export function getSystemMetrics() {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };

  return metrics;
}
