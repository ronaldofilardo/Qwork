/**
 * Middleware de RBAC (Role-Based Access Control)
 * Verifica se o perfil do usuário tem acesso à rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRoute, isRhRoute, isEntidadeRoute } from '@/lib/config/routes';
import { ROLES } from '@/lib/config/roles';

export function rbacMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Obter sessão do cookie
  const sessionCookie = request.cookies.get('bps-session')?.value;
  if (!sessionCookie) {
    return null; // Sem sessão, já tratado pelo authMiddleware
  }

  let session: { perfil?: string; cpf?: string } | null = null;
  try {
    session = JSON.parse(sessionCookie);
  } catch {
    return null; // Sessão inválida, já tratado
  }

  if (!session || !session.perfil) {
    return null;
  }

  // Verificar acessos por role
  if (isAdminRoute(pathname)) {
    if (session.perfil !== ROLES.ADMIN) {
      console.error(
        `[RBAC] Usuário ${session.cpf} (${session.perfil}) tentou acessar rota admin ${pathname}`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  if (isRhRoute(pathname)) {
    if (session.perfil !== ROLES.RH && session.perfil !== ROLES.ADMIN) {
      console.error(
        `[RBAC] Usuário ${session.cpf} (${session.perfil}) tentou acessar rota RH ${pathname}`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  if (isEntidadeRoute(pathname)) {
    if (
      session.perfil !== ROLES.GESTOR_ENTIDADE &&
      session.perfil !== ROLES.ADMIN
    ) {
      console.error(
        `[RBAC] Usuário ${session.cpf} (${session.perfil}) tentou acessar rota entidade ${pathname}`
      );
      return new NextResponse('Acesso negado', { status: 403 });
    }
  }

  return null; // Acesso permitido
}
