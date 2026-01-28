/**
 * API: POST /api/notificacoes/marcar-lida
 * Marcar notificação(ões) como lida(s)
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';

interface MarcarLidaBody {
  notificacao_ids: number[];
}

export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }

    const body: MarcarLidaBody = await request.json();

    if (
      !body.notificacao_ids ||
      !Array.isArray(body.notificacao_ids) ||
      body.notificacao_ids.length === 0
    ) {
      return NextResponse.json(
        { erro: 'IDs de notificações inválidos' },
        { status: 400 }
      );
    }

    const totalMarcadas = await NotificationService.marcarComoLida(
      body.notificacao_ids,
      session.cpf
    );

    return NextResponse.json({
      sucesso: true,
      total_marcadas: totalMarcadas,
    });
  } catch (erro) {
    console.error('[API Marcar Lida] Erro:', erro);
    return NextResponse.json(
      { erro: 'Erro ao marcar notificações' },
      { status: 500 }
    );
  }
}
