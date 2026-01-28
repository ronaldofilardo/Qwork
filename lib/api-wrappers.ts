/**
 * Wrapper para rotas de API que automaticamente captura IP e User-Agent
 * Utilizado para auditoria automática
 */

import { NextResponse } from 'next/server';
import { extractRequestInfo } from './request-utils';
import { logAudit, AuditLogEntry } from './audit';

/**
 * Tipo de handler de rota de API
 */
export type APIHandler<T = unknown> = (
  request: Request,
  context?: { ipAddress: string | null; userAgent: string | null }
) => Promise<NextResponse<T>>;

/**
 * Informações extraídas da requisição
 */
export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Wrapper que adiciona contexto de requisição às rotas de API
 * Automaticamente extrai IP e User-Agent
 *
 * @param handler - Função handler da rota de API
 * @returns Handler wrapper com contexto injetado
 *
 * @example
 * export const GET = withRequestContext(async (request, context) => {
 *   // context.ipAddress e context.userAgent estão disponíveis
 *   await logAudit({
 *     ...,
 *     ipAddress: context.ipAddress,
 *     userAgent: context.userAgent
 *   })
 *   return NextResponse.json({ data })
 * })
 */
export function withRequestContext<T = unknown>(
  handler: (
    request: Request,
    context: RequestContext
  ) => Promise<NextResponse<T>>
) {
  return async (request: Request): Promise<NextResponse<T>> => {
    // Extrair informações da requisição
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // Adicionar ao contexto global para acesso posterior se necessário
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).requestContext = { ipAddress, userAgent };

    // Chamar handler original com contexto
    return handler(request, { ipAddress, userAgent });
  };
}

/**
 * Wrapper que adiciona auditoria automática a operações críticas
 * Combina captura de contexto com logging automático
 *
 * @param handler - Função handler da rota de API
 * @param auditConfig - Configuração de auditoria
 * @returns Handler wrapper com auditoria automática
 *
 * @example
 * export const POST = withAutoAudit(
 *   async (request) => {
 *     const data = await request.json()
 *     const result = await createResource(data)
 *     return NextResponse.json(result)
 *   },
 *   {
 *     resource: 'funcionarios',
 *     action: 'INSERT',
 *     extractResourceId: (response) => response.id
 *   }
 * )
 */
export function withAutoAudit<T = unknown>(
  handler: (
    request: Request,
    context: RequestContext
  ) => Promise<NextResponse<T>>,
  auditConfig: {
    resource: string;
    action:
      | 'INSERT'
      | 'UPDATE'
      | 'DELETE'
      | 'SELECT'
      | 'GENERATE_PAYMENT_LINK'
      | 'VALIDATE_TOKEN'
      | 'CORRECT_INCONSISTENCY'
      | 'ACTIVATE'
      | 'DEACTIVATE'
      | 'PAYMENT_CONFIRMED'
      | 'CONTRACT_GENERATED';
    extractResourceId?: (responseData: T) => string | number;
    extractNewData?: (responseData: T) => unknown;
    extractOldData?: (requestData: unknown) => unknown;
    skipAuditOnError?: boolean;
  }
) {
  return withRequestContext(async (request, context) => {
    let requestData: unknown = null;

    // Capturar dados da requisição se necessário
    if (auditConfig.extractOldData) {
      try {
        requestData = await request.clone().json();
      } catch {
        // Ignorar se não for JSON
      }
    }

    // Executar handler
    const response = await handler(request, context);

    // Auditar apenas se bem-sucedido ou se skipAuditOnError for false
    if (response.ok || !auditConfig.skipAuditOnError) {
      try {
        const responseData = await response.clone().json();

        const auditEntry: AuditLogEntry = {
          resource: auditConfig.resource,
          action: auditConfig.action,
          resourceId: auditConfig.extractResourceId
            ? auditConfig.extractResourceId(responseData)
            : 'N/A',
          newData: auditConfig.extractNewData
            ? auditConfig.extractNewData(responseData)
            : responseData,
          oldData: auditConfig.extractOldData
            ? auditConfig.extractOldData(requestData)
            : undefined,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        };

        await logAudit(auditEntry);
      } catch (error) {
        console.error('[withAutoAudit] Erro ao registrar auditoria:', error);
        // Não falhar a requisição por erro de auditoria
      }
    }

    return response;
  });
}

/**
 * Extrai o contexto de requisição de um objeto Request
 * Útil para handlers que não usam os wrappers acima
 *
 * @param request - Request object
 * @returns Contexto de requisição
 */
export function getRequestContext(request: Request): RequestContext {
  // Verificar se já foi extraído anteriormente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((request as any).requestContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (request as any).requestContext;
  }

  // Extrair novamente
  return extractRequestInfo(request);
}
