/**
 * Middleware de Proteção de Acesso Pago
 *
 * Garante que apenas contratantes com pagamento confirmado acessem rotas protegidas
 * Uso: Importar e aplicar em rotas que exigem contrato ativo
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from './db';

export interface PaidAccessValidationResult {
  allowed: boolean;
  contratante_id?: number;
  message?: string;
  status_code?: number;
}

/**
 * Valida se contratante tem acesso pago confirmado
 *
 * @param contratante_id ID do contratante a validar
 * @returns Resultado da validação
 */
export async function validatePaidAccess(
  contratante_id: number
): Promise<PaidAccessValidationResult> {
  if (!contratante_id) {
    return {
      allowed: false,
      message: 'ID do contratante não fornecido',
      status_code: 400,
    };
  }

  try {
    const result = await query(
      `SELECT id, nome, ativa, pagamento_confirmado, status 
       FROM contratantes 
       WHERE id = $1`,
      [contratante_id]
    );

    if (result.rows.length === 0) {
      return {
        allowed: false,
        message: 'Contratante não encontrado',
        status_code: 404,
      };
    }

    const contratante = result.rows[0];

    // Verificação dupla: ativa E pagamento confirmado
    if (!contratante.ativa || !contratante.pagamento_confirmado) {
      return {
        allowed: false,
        contratante_id,
        message: 'Acesso negado. Pagamento não confirmado ou conta inativa.',
        status_code: 403,
      };
    }

    // Status adicional de validação
    if (
      contratante.status === 'suspenso' ||
      contratante.status === 'cancelado'
    ) {
      return {
        allowed: false,
        contratante_id,
        message: `Conta ${contratante.status}. Entre em contato com o suporte.`,
        status_code: 403,
      };
    }

    return {
      allowed: true,
      contratante_id,
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
 *   const accessCheck = await requirePaidAccess(session.contratante_id);
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
  contratante_id: number
): Promise<NextResponse | null> {
  const validation = await validatePaidAccess(contratante_id);

  if (!validation.allowed) {
    return NextResponse.json(
      {
        error: validation.message || 'Acesso negado',
        requires_payment: !validation.allowed,
        contratante_id: validation.contratante_id,
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
 * export const GET = withPaidAccess(async (request, { contratante_id }) => {
 *   // Sua lógica aqui, acesso já validado
 *   return NextResponse.json({ data: 'protegido' });
 * });
 * ```
 */
export function withPaidAccess<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T, getContratanteId: (request: NextRequest) => Promise<number>): T {
  return (async (request: NextRequest, ...args: any[]) => {
    try {
      const contratante_id = await getContratanteId(request);
      const accessCheck = await requirePaidAccess(contratante_id);

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
  contratante_id: number;
  require_active?: boolean;
  require_paid?: boolean;
  allow_statuses?: string[];
}

export async function validateAccessCriteria(
  criteria: AccessCriteria
): Promise<PaidAccessValidationResult> {
  const {
    contratante_id,
    require_active = true,
    require_paid = true,
    allow_statuses = ['aprovado', 'ativo'],
  } = criteria;

  const result = await query(
    `SELECT id, nome, ativa, pagamento_confirmado, status 
     FROM contratantes 
     WHERE id = $1`,
    [contratante_id]
  );

  if (result.rows.length === 0) {
    return {
      allowed: false,
      message: 'Contratante não encontrado',
      status_code: 404,
    };
  }

  const contratante = result.rows[0];

  if (require_active && !contratante.ativa) {
    return {
      allowed: false,
      contratante_id,
      message: 'Conta não está ativa',
      status_code: 403,
    };
  }

  if (require_paid && !contratante.pagamento_confirmado) {
    return {
      allowed: false,
      contratante_id,
      message: 'Pagamento não confirmado',
      status_code: 403,
    };
  }

  if (!allow_statuses.includes(contratante.status)) {
    return {
      allowed: false,
      contratante_id,
      message: `Status "${contratante.status}" não permite acesso`,
      status_code: 403,
    };
  }

  return {
    allowed: true,
    contratante_id,
  };
}
