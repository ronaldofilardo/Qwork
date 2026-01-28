/**
 * Ponto de entrada dos middlewares refatorados
 * Executa middlewares em cadeia
 */

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth';
import { rbacMiddleware } from './rbac';
import { auditMiddleware } from './audit';

export function middleware(request: NextRequest): NextResponse {
  // Executar middlewares em ordem
  const middlewares = [auditMiddleware, authMiddleware, rbacMiddleware];

  for (const mw of middlewares) {
    const response = mw(request);
    if (response) {
      return response; // Middleware bloqueou a requisição
    }
  }

  // Todos os middlewares passaram
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/rh/:path*',
    '/emissor/:path*',
    '/entidade/:path*',
    '/dashboard/:path*',
    '/avaliacao/:path*',
  ],
};
