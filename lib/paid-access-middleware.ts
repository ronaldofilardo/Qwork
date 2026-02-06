/**
 * Middleware de Proteção de Acesso Pago
 *
 * Garante que apenas entidades com pagamento confirmado acessem rotas protegidas
 * Uso: Importar e aplicar em rotas que exigem contrato ativo
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from './db';

export interface PaidAccessValidationResult {
  allowed: boolean;
  entidade_id?: number;
  message?: string;
  status_code?: number;
}

/**
 * Valida se entidade tem acesso pago confirmado
 *
 * @param entidade_id ID da entidade a validar
 * @returns Resultado da validação
 */
export async function validatePaidAccess(
  entidade_id: number
): Promise<PaidAccessValidationResult> {
  if (!entidade_id) {
    return {
      allowed: false,
      message: 'ID da entidade não fornecido',
      status_code: 400,
    };
  }

  try {
    const result = await query(
      `SELECT id, nome, ativa, pagamento_confirmado, status 
       FROM entidades 
       WHERE id = $1`,
      [entidade_id]
    );

    if (result.rows.length === 0) {
      return {
        allowed: false,
        message: 'Entidade não encontrada',
        status_code: 404,
      };
    }

    const entidade = result.rows[0];

    // Verificação dupla: ativa E pagamento confirmado
    if (!entidade.ativa || !entidade.pagamento_confirmado) {
      return {
        allowed: false,
        entidade_id,
        message: 'Acesso negado. Pagamento não confirmado ou conta inativa.',
        status_code: 403,
      };
    }

    // Status adicional de validação
    if (entidade.status === 'suspenso' || entidade.status === 'cancelado') {
      return {
        allowed: false,
        entidade_id,
        message: `Conta ${entidade.status}. Entre em contato com o suporte.`,
        status_code: 403,
      };
    }

    return {
      allowed: true,
      entidade_id,
    };
  } catch (error) {
    console.error('Erro ao validar acesso pago:', error);
    return {
      allowed: false,
      message: 'Erro ao validar acesso',
      status_code: 500,
    };
  }
}

/**
 * Middleware Express/Next.js para proteger rotas
 *
 * Exemplo de uso em API Route:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const session = await getSession();
 *   const accessCheck = await requirePaidAccess(session.entidade_id);
 *
 *   if (accessCheck) {
 *     return accessCheck; // Retorna erro se acesso negado
 *   }
 *
 *   // Continue com lógica da rota...
 * }
 * ```
 */
export async function requirePaidAccess(
  entidade_id: number
): Promise<NextResponse | null> {
  const validation = await validatePaidAccess(entidade_id);

  if (!validation.allowed) {
    return NextResponse.json(
      {
        error: validation.message || 'Acesso negado',
        requires_payment: !validation.allowed,
        entidade_id: validation.entidade_id,
      },
      { status: validation.status_code || 403 }
    );
  }

  return null; // Acesso permitido
}

/**
 * HOF para proteger handlers de API
 *
 * Exemplo:
 * ```typescript
 * export const GET = withPaidAccess(async (request, { entidade_id }) => {
 *   // Sua lógica aqui, acesso já validado
 *   return NextResponse.json({ data: 'protegido' });
 * });
 * ```
 */
export function withPaidAccess<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T, getEntidadeId: (request: NextRequest) => Promise<number>): T {
  return (async (request: NextRequest, ...args: any[]) => {
    try {
      const entidade_id = await getEntidadeId(request);
      const accessCheck = await requirePaidAccess(entidade_id);

      if (accessCheck) {
        return accessCheck;
      }

      return handler(request, ...args);
    } catch (error) {
      console.error('Erro no middleware de acesso pago:', error);
      return NextResponse.json(
        { error: 'Erro ao validar acesso' },
        { status: 500 }
      );
    }
  }) as T;
}

/**
 * Valida múltiplos critérios de acesso
 */
export interface AccessCriteria {
  entidade_id: number;
  require_active?: boolean;
  require_paid?: boolean;
  allow_statuses?: string[];
}

export async function validateAccessCriteria(
  criteria: AccessCriteria
): Promise<PaidAccessValidationResult> {
  const {
    entidade_id,
    require_active = true,
    require_paid = true,
    allow_statuses = ['aprovado', 'ativo'],
  } = criteria;

  const result = await query(
    `SELECT id, nome, ativa, pagamento_confirmado, status 
     FROM entidades 
     WHERE id = $1`,
    [entidade_id]
  );

  if (result.rows.length === 0) {
    return {
      allowed: false,
      message: 'Entidade não encontrada',
      status_code: 404,
    };
  }

  const entidade = result.rows[0];

  if (require_active && !entidade.ativa) {
    return {
      allowed: false,
      entidade_id,
      message: 'Conta não está ativa',
      status_code: 403,
    };
  }

  if (require_paid && !entidade.pagamento_confirmado) {
    return {
      allowed: false,
      entidade_id,
      message: 'Pagamento não confirmado',
      status_code: 403,
    };
  }

  if (!allow_statuses.includes(entidade.status)) {
    return {
      allowed: false,
      entidade_id,
      message: `Status "${entidade.status}" não permite acesso`,
      status_code: 403,
    };
  }

  return {
    allowed: true,
    entidade_id,
  };
}
