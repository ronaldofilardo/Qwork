/**
 * Middleware de auditoria e logging
 * Registra acessos e ações para fins de segurança
 */

import { NextRequest, NextResponse } from 'next/server';

const SENSITIVE_ROUTES = [
  '/api/admin',
  '/api/rh',
  '/api/emissor',
  '/api/entidade',
];

export function auditMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Apenas auditar rotas sensíveis
  const isSensitive = SENSITIVE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isSensitive) {
    return null;
  }

  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  const sessionCookie = request.cookies.get('bps-session')?.value;
  let sessionInfo = 'no-session';

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie);
      sessionInfo = session?.cpf || 'unknown';
    } catch {
      sessionInfo = 'invalid-session';
    }
  }

  console.log(
    `[Audit] ${request.method} ${pathname} | IP: ${clientIP} | Session: ${sessionInfo}`
  );

  return null; // Continuar
}
