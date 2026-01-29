import { getSession, Session } from './session';
import { NextResponse } from 'next/server';
import { Perfil } from './db';

/**
 * Erro personalizado para acesso negado
 */
export class AccessDeniedError extends Error {
  constructor(message: string = 'Acesso negado') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Requer que o usuário tenha um dos perfis especificados
 * Lança erro se não estiver autenticado ou não tiver permissão
 */
export function requireRole(allowedRoles: Perfil[]): Session {
  const session = getSession();

  if (!session) {
    throw new AccessDeniedError('Usuário não autenticado');
  }

  if (!allowedRoles.includes(session.perfil as Perfil)) {
    throw new AccessDeniedError(
      `Acesso negado. Perfis permitidos: ${allowedRoles.join(', ')}`
    );
  }

  return session;
}

/**
 * Requer perfil de emissor (APENAS emissor)
 */
export function requireEmissor(): Session {
  return requireRole(['emissor']);
}

/**
 * Requer perfil de admin
 */
export function requireAdmin(): Session {
  return requireRole(['admin']);
}

/**
 * Requer perfil de RH ou gestor de entidade
 */
export function requireRH(): Session {
  // RH endpoints devem ser acessíveis apenas por 'rh' ou 'gestor_entidade'
  return requireRole(['rh', 'gestor_entidade']);
}

/**
 * Verifica se a sessão tem acesso a um lote específico
 */
export function sessionHasAccessToLote(
  session: Session,
  loteId: number,
  contratanteId?: number
): boolean {
  // Emissor tem acesso a lotes concluídos/finalizados/ativos (RLS no banco)
  if (session.perfil === 'emissor') {
    return true; // RLS já filtra no banco
  }

  // RH/Entidade só pode acessar lotes do seu contratante
  if (session.perfil === 'rh' || session.perfil === 'gestor_entidade') {
    if (!contratanteId) {
      return false;
    }
    return session.contratante_id === contratanteId;
  }

  // Admin NÃO tem acesso operacional implícito a lotes (não é emissor nem RH)
  return false;
}

/**
 * Helper para retornar resposta de erro de acesso negado em API routes
 */
export function accessDeniedResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: message || 'Acesso negado',
      code: 'ACCESS_DENIED',
    },
    { status: 403 }
  );
}

/**
 * Helper para retornar resposta de não autenticado em API routes
 */
export function unauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: message || 'Não autenticado',
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}

/**
 * Wrapper para API routes que requer autenticação
 * Uso:
 * ```ts
 * export const GET = withAuth(['admin', 'emissor'], async (request, session) => {
 *   // session está garantido aqui
 * });
 * ```
 */
export function withAuth<T extends any[]>(
  allowedRoles: Perfil[],
  handler: (
    request: Request,
    session: Session,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    try {
      const session = requireRole(allowedRoles);
      return await handler(request, session, ...args);
    } catch (error) {
      if (error instanceof AccessDeniedError) {
        if (error.message.includes('não autenticado')) {
          return unauthorizedResponse(error.message);
        }
        return accessDeniedResponse(error.message);
      }
      console.error('Erro inesperado em withAuth:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Configura variáveis de contexto para RLS no PostgreSQL
 */
export function getRLSContext(session: Session): {
  role: string;
  userId: string;
  contratanteId: string;
} {
  return {
    role: session.perfil,
    userId: session.cpf,
    contratanteId: String(session.contratante_id || ''),
  };
}
