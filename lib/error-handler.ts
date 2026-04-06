/**
 * lib/error-handler.ts
 *
 * Wrapper de erro global para API routes.
 * Em produção: retorna mensagem genérica.
 * Em desenvolvimento: retorna stack trace completo.
 *
 * Uso em rotas:
 *   try {
 *     // lógica
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 */

import { NextResponse } from 'next/server';
import { logAudit } from './audit-logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export interface ApiErrorOptions {
  defaultMessage?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  logAudit?: boolean;
}

/**
 * Trata erros de forma segura para respostas API.
 * Em produção: mensagem genérica + status apropriado.
 * Em dev/test: stack trace completo.
 */
export function handleApiError(
  error: unknown,
  options: ApiErrorOptions = {}
): NextResponse {
  const {
    defaultMessage = 'Erro ao processar requisição',
    statusCode = 500,
    context = {},
    logAudit: shouldAudit = false,
  } = options;

  let message = defaultMessage;
  let responseStatus = statusCode;
  let logData = {};

  // Extrair informações do erro
  if (error instanceof Error) {
    // Em desenvolvimento, mostrar mensagem real
    if (isDevelopment || isTest) {
      message = error.message;
    }

    logData = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    };

    // Mapear erros conhecidos para status codes apropriados
    if (
      error.message.includes('not found') ||
      error.message.includes('não encontrado')
    ) {
      responseStatus = 404;
      message = 'Recurso não encontrado';
    } else if (
      error.message.includes('permission') ||
      error.message.includes('sem permissão')
    ) {
      responseStatus = 403;
      message = 'Acesso negado';
    } else if (
      error.message.includes('authentication') ||
      error.message.includes('autenticr')
    ) {
      responseStatus = 401;
      message = 'Autenticação requerida';
    } else if (
      error.message.includes('validation') ||
      error.message.includes('inválid')
    ) {
      responseStatus = 400;
      message = 'Dados inválidos';
    } else if (
      error.message.includes('duplicate') ||
      error.message.includes('único')
    ) {
      responseStatus = 409;
      message = 'Recurso já existe';
    }
  }

  // Log completo no servidor (dev + prod)
  console.error('[API_ERROR]', {
    status: responseStatus,
    message,
    context,
    ...logData,
  });

  // Auditoria se solicitado
  if (shouldAudit) {
    logAudit(null, {
      action: 'API_ERROR',
      resource: 'api_request',
      status: 'failure',
      details: { message, statusCode: responseStatus, ...context },
    }).catch(() => {}); // Ignorar falha de auditoria
  }

  // Resposta segura
  return NextResponse.json(
    {
      error: message,
      code: error instanceof Error ? error.name : 'INTERNAL_ERROR',
      ...(isDevelopment || isTest ? { debug: { stack: logData } } : {}),
    },
    { status: responseStatus }
  );
}

/**
 * Wrapper para função async que precisa de tratamento de erro.
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  _errorOptions?: ApiErrorOptions
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    throw error;
  }
}

/**
 * Cria um NextResponse de erro tipado.
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status: statusCode });
}
