import { NextRequest } from 'next/server';
import { getSession, Session } from './session';

// Requer autenticação - retorna sessão ou lança erro
export function requireAuth(_request: NextRequest): Session {
  const session = getSession();
  if (!session) {
    throw new Error('Autenticação requerida');
  }
  return session;
}

// Requer role específico
export function requireRole(session: Session, allowedRoles: string[]): void {
  if (!allowedRoles.includes(session.perfil)) {
    throw new Error(
      `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`
    );
  }
}
