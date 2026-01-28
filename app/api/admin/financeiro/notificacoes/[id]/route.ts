// API Route para notificações financeiras
// GET: Listar notificações
// PATCH: Marcar como lida

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import {
  getNotificacoesFinanceiras,
  marcarNotificacaoComoLida,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão admin
    await requireRole('admin');

    const { searchParams } = new URL(request.url);
    const contratoId = searchParams.get('contrato_id');
    const apenasNaoLidas = searchParams.get('nao_lidas') === 'true';

    // Buscar notificações
    const notificacoes = await getNotificacoesFinanceiras(
      contratoId ? parseInt(contratoId) : undefined,
      apenasNaoLidas
    );

    return NextResponse.json({
      success: true,
      notificacoes,
    });
  } catch (error) {
    console.error('[API] Erro ao listar notificações:', error);

    if (error instanceof Error && error.message === 'MFA_REQUIRED') {
      return NextResponse.json(
        {
          error: 'MFA_REQUIRED',
          message: 'Autenticação de dois fatores requerida',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao listar notificações',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissão admin
    await requireRole('admin');

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Marcar como lida
    const notificacao = await marcarNotificacaoComoLida(id);

    if (!notificacao) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notificacao,
    });
  } catch (error) {
    console.error('[API] Erro ao atualizar notificação:', error);

    return NextResponse.json(
      {
        error: 'Erro ao atualizar notificação',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
