import { NextResponse } from 'next/server';
import { performHealthCheck, getSystemMetrics } from '@/lib/health-check';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/health — Health check endpoint
 * Retorna status da aplicação, conectividade do banco e versão.
 * Não expõe dados sensíveis (credenciais, IPs internos, etc.)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const health = await performHealthCheck();
    const metrics = getSystemMetrics();

    const response = {
      status: health.status,
      timestamp: health.timestamp,
      version: health.version,
      environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
      checks: {
        database: health.checks.database.status,
        session: health.checks.session.status,
        mfa: health.checks.mfa.status,
      },
      uptime: Math.round(metrics.uptime),
    };

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex',
        },
      }
    );
  }
}
