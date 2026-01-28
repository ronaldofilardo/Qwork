/**
 * Handler padronizado para rotas API
 * Centraliza validação, autenticação, execução e tratamento de erros
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import type { Role } from '@/lib/config/roles';
import type { Session } from '@/lib/session';

export interface ApiHandlerConfig<TInput = unknown, TOutput = unknown> {
  /**
   * Função de autorização (verifica se usuário tem permissão)
   */
  authorize?: (context: ApiContext) => boolean | Promise<boolean>;

  /**
   * Schema Zod para validação do body/query
   * Aceita ZodEffects (transformações) além de ZodObject
   */
  validate?: z.ZodType<TInput, any, any>;

  /**
   * Função opcional para extrair input a partir do objeto Request (útil para GET)
   */
  extractInput?: (request: NextRequest) => TInput;

  /**
   * Se true, exige sessão autenticada (401) antes de executar
   */
  requireAuth?: boolean;

  /**
   * Função que executa a lógica de negócio
   */
  execute: (input: TInput, context: ApiContext) => Promise<TOutput> | TOutput;

  /**
   * Roles permitidas (opcional - usa authorize se definido)
   */
  allowedRoles?: Role[];
}

export interface ApiContext {
  session: Session | null;
  request: NextRequest;
}

// Compatibilidade: RequestContext é um alias de ApiContext (nome antigo)
export type RequestContext = ApiContext;

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

/**
 * Cria um erro de API tipado
 */
export class ApiErrorImpl extends Error implements ApiError {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number = 400) {
    super(message);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, ApiErrorImpl.prototype);
  }
}

export function createApiError(
  message: string,
  code: string,
  status: number = 400
): ApiErrorImpl {
  return new ApiErrorImpl(message, code, status);
}

/**
 * Type guard para ApiError
 */
export function isApiError(error: unknown): error is ApiErrorImpl {
  return (
    error instanceof Error &&
    'code' in (error as any) &&
    'status' in (error as any)
  );
}

/**
 * Cria um handler de API com padrões de validação, auth e erro
 */
export function handleRequest<TInput = unknown, TOutput = unknown>(
  config: ApiHandlerConfig<TInput, TOutput>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Obter sessão
      const session = getSession();
      const context: ApiContext = { session, request };

      // 2. Verificar autorização / autenticação
      if (config.requireAuth && !session) {
        return NextResponse.json(
          { error: 'Autenticação requerida' },
          { status: 401 }
        );
      }

      if (config.authorize) {
        const authorized = await config.authorize(context);
        if (!authorized) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
      } else if (config.allowedRoles && session) {
        const hasRole = config.allowedRoles.includes(
          session.perfil as unknown as Role
        );
        if (!hasRole) {
          return NextResponse.json(
            { error: 'Acesso negado - role inválida' },
            { status: 403 }
          );
        }
      }

      // 3. Validar input
      let input: TInput;

      // Extrair input (ex: GET query params) se fornecer
      if (config.extractInput) {
        input = config.extractInput(request);
      } else {
        input = (await request.json().catch(() => ({}))) as TInput;
      }

      // Se houver um schema Zod, validar (suporta ZodEffects e transforms)
      if (config.validate) {
        const parseResult = config.validate.safeParse(input as any);
        if (!parseResult.success) {
          return NextResponse.json(
            {
              error: 'Validação falhou',
              details: parseResult.error.format(),
            },
            { status: 400 }
          );
        }
        input = parseResult.data as TInput;
      }

      // 4. Executar lógica de negócio
      const output = await config.execute(input, context);

      // 5. Retornar resposta
      return NextResponse.json(output, { status: 200 });
    } catch (error) {
      // Tratamento de erros conhecido
      if (isApiError(error)) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status }
        );
      }

      // Erro desconhecido
      console.error('[API Handler] Erro não tratado:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper para verificar se há sessão ativa
 */
export function requireSession(
  context: ApiContext
): asserts context is ApiContext & {
  session: NonNullable<ApiContext['session']>;
} {
  if (!context.session) {
    throw createApiError('Autenticação requerida', 'UNAUTHORIZED', 401);
  }
}

/**
 * Helper para verificar role específica
 */
export function requireRole(context: ApiContext, role: Role): void {
  requireSession(context);
  if (context.session.perfil !== role) {
    throw createApiError(`Acesso restrito a ${role}`, 'FORBIDDEN', 403);
  }
}
