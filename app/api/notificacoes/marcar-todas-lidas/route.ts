/**
 * API: POST /api/notificacoes/marcar-todas-lidas
 * Marcar todas as notificações do usuário como lidas
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';
import type { DestinatarioTipo } from '@/lib/notification-service';

export async function POST() {
  try {
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }

    const destinatarioTipo: DestinatarioTipo =
      session.perfil === 'admin'
        ? 'admin'
        : session.perfil === 'rh'
          ? 'gestor'
          : 'funcionario';

    const totalMarcadas = await NotificationService.marcarTodasComoLidas(
      session.cpf,
      destinatarioTipo
    );

    return NextResponse.json({
      sucesso: true,
      total_marcadas: totalMarcadas,
    });
  } catch (erro) {
    console.error('[API Marcar Todas Lidas] Erro:', erro);
    return NextResponse.json(
      { erro: 'Erro ao marcar todas como lidas' },
      { status: 500 }
    );
  }
}
