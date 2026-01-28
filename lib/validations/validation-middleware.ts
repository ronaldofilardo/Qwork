/**
 * Middleware de Validação Zod
 * Função helper para validar requisições com Zod schemas
 */

import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export interface ValidationResult<T> {
  sucesso: boolean;
  dados?: T;
  erros?: Array<{
    campo: string;
    mensagem: string;
  }>;
}

/**
 * Valida dados usando Zod schema
 */
export function validarComZod<T>(
  schema: z.ZodSchema<T>,
  dados: unknown
): ValidationResult<T> {
  try {
    const dadosValidados = schema.parse(dados);
    return {
      sucesso: true,
      dados: dadosValidados,
    };
  } catch (erro) {
    if (erro instanceof ZodError) {
      return {
        sucesso: false,
        erros: erro.errors.map((e) => ({
          campo: e.path.join('.'),
          mensagem: e.message,
        })),
      };
    }

    return {
      sucesso: false,
      erros: [{ campo: 'geral', mensagem: 'Erro de validação desconhecido' }],
    };
  }
}

/**
 * Wrapper para API routes com validação automática
 * Exemplo de uso:
 *
 * export const POST = comValidacao(
 *   MeuSchema,
 *   async (dados, request) => {
 *     // dados já está validado e tipado
 *     return NextResponse.json({ sucesso: true });
 *   }
 * );
 */
export function comValidacao<T>(
  schema: z.ZodSchema<T>,
  handler: (
    dados: T,
    request: Request,
    context?: any
  ) => Promise<Response> | Response
) {
  return async (request: Request, context?: any) => {
    try {
      let dadosBrutos: unknown;

      // Tentar parsear JSON
      try {
        dadosBrutos = await request.json();
      } catch {
        return NextResponse.json(
          {
            erro: 'Corpo da requisição inválido',
            detalhes: 'JSON malformado',
          },
          { status: 400 }
        );
      }

      // Validar com Zod
      const validacao = validarComZod(schema, dadosBrutos);

      if (!validacao.sucesso) {
        return NextResponse.json(
          {
            erro: 'Dados de entrada inválidos',
            validacao: validacao.erros,
          },
          { status: 400 }
        );
      }

      // Chamar handler com dados validados
      return await handler(validacao.dados!, request, context);
    } catch (erro) {
      console.error('[Validação Middleware] Erro:', erro);
      return NextResponse.json(
        { erro: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validação para query parameters
 */
export function validarQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((valor, chave) => {
    paramsObj[chave] = valor;
  });

  return validarComZod(schema, paramsObj);
}

/**
 * Helper para formatar erros de validação em mensagem legível
 */
export function formatarErrosValidacao(
  erros: Array<{ campo: string; mensagem: string }>
): string {
  return erros.map((e) => `${e.campo}: ${e.mensagem}`).join('; ');
}
