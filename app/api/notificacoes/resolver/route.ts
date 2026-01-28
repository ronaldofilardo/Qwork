import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  resolverNotificacao,
  resolverNotificacoesPorContexto,
} from '@/lib/notifications/create-notification';

/**
 * PATCH /api/notificacoes/resolver
 *
 * Resolve uma ou múltiplas notificações com base em:
 * - notificacao_id: Resolver uma notificação específica
 * - contexto: Resolver todas as notificações com critério de contexto (ex: lote_id)
 *
 * Requer autenticação via sessão
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json(
        { error: 'Não autorizado - sessão inválida' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificacao_id, contexto } = body;

    // Validar: deve ter notificacao_id OU contexto, mas não ambos
    if (!notificacao_id && !contexto) {
      return NextResponse.json(
        {
          error:
            'Requisição inválida: informe notificacao_id ou contexto para resolver',
        },
        { status: 400 }
      );
    }

    if (notificacao_id && contexto) {
      return NextResponse.json(
        {
          error:
            'Requisição inválida: informe apenas notificacao_id OU contexto, não ambos',
        },
        { status: 400 }
      );
    }

    // Caso 1: Resolver notificação específica
    if (notificacao_id) {
      const resolvida = await resolverNotificacao({
        notificacao_id,
        cpf_resolvedor: session.cpf,
      });

      if (!resolvida) {
        return NextResponse.json(
          { error: 'Notificação não encontrada ou já estava resolvida' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notificação resolvida com sucesso',
        notificacao_id,
      });
    }

    // Caso 2: Resolver por contexto
    if (contexto) {
      const { chave, valor } = contexto;

      if (!chave || !valor) {
        return NextResponse.json(
          {
            error:
              'Contexto inválido: informe chave e valor (ex: { chave: "lote_id", valor: "123" })',
          },
          { status: 400 }
        );
      }

      const count = await resolverNotificacoesPorContexto({
        chave_contexto: chave,
        valor_contexto: String(valor),
        cpf_resolvedor: session.cpf,
      });

      return NextResponse.json({
        success: true,
        message: `${count} notificação(ões) resolvida(s) com sucesso`,
        count,
        contexto: { chave, valor },
      });
    }

    // Não deveria chegar aqui
    return NextResponse.json(
      { error: 'Erro inesperado na resolução' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[API] Erro ao resolver notificação:', error);
    return NextResponse.json(
      {
        error: 'Erro ao resolver notificação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notificacoes/resolver
 *
 * Retorna informações de uso da API (não implementado para segurança)
 */
export function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/notificacoes/resolver',
      method: 'PATCH',
      description: 'Resolve notificações individuais ou em massa',
      usage: {
        individual: {
          body: { notificacao_id: 123 },
          example: 'PATCH /api/notificacoes/resolver { "notificacao_id": 123 }',
        },
        contexto: {
          body: { contexto: { chave: 'lote_id', valor: '456' } },
          example:
            'PATCH /api/notificacoes/resolver { "contexto": { "chave": "lote_id", "valor": "456" } }',
        },
      },
      authentication: 'Requer sessão válida (cookie)',
    },
    { status: 200 }
  );
}
