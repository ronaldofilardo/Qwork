/**
 * API: POST /api/notificacoes/marcar-todas-lidas
 * Marcar todas as notificações do usuário como lidas
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';
import type { DestinatarioTipo } from '@/lib/notification-service';
import { assertAuth, isApiError } from '@/lib/authorization/policies';

export async function POST() {
  try {
    const session = getSession();
    assertAuth(session);

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
    if (isApiError(erro)) {
      return NextResponse.json({ erro: erro.message }, { status: erro.status });
    }
    console.error('[API Marcar Todas Lidas] Erro:', erro);
    return NextResponse.json(
      { erro: 'Erro ao marcar todas como lidas' },
      { status: 500 }
    );
  }
}
