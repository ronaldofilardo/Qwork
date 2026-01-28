/**
 * Middleware de autenticação
 * Verifica se há sessão válida e injeta no contexto
 */

import { NextRequest, NextResponse } from 'next/server';
import { isPublicRoute } from '@/lib/config/routes';

export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Rotas públicas não precisam de autenticação
  if (isPublicRoute(pathname)) {
    return null; // Continuar
  }

  // Verificar se há cookie de sessão
  const sessionCookie = request.cookies.get('bps-session')?.value;
  let session: unknown = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie);
    } catch (err) {
      console.error('[Auth] Sessão inválida no cookie:', err);
      return new NextResponse('Sessão inválida', { status: 401 });
    }
  } else {
    // Permitir injeção via header em dev/test
    const mockHeader = request.headers.get('x-mock-session');
    if (
      mockHeader &&
      (process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'development')
    ) {
      try {
        session = JSON.parse(mockHeader);
      } catch {
        console.error('[Auth] Invalid x-mock-session header');
        return new NextResponse('Sessão inválida', { status: 401 });
      }
    }
  }

  // Rotas protegidas requerem sessão
  if (!session) {
    const _clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown';
    console.error(
      `[Auth] Tentativa de acesso sem sessão a ${pathname} (IP redacted)`
    );
    return new NextResponse('Autenticação requerida', { status: 401 });
  }

  return null; // Sessão válida, continuar
}
