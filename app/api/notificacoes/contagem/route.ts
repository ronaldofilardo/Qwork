/**
 * API: GET /api/notificacoes/contagem
 * Obter contagem de notificações não lidas
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';
import type { DestinatarioTipo } from '@/lib/notification-service';
import { assertAuth, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    assertAuth(session);

    const destinatarioTipo: DestinatarioTipo =
      session.perfil === 'admin'
        ? 'admin'
        : session.perfil === 'rh'
          ? 'gestor'
          : 'funcionario';

    const contagem = await NotificationService.contarNaoLidas(
      session.cpf,
      destinatarioTipo
    );

    return NextResponse.json(contagem || { total_nao_lidas: 0 });
  } catch (erro) {
    if (isApiError(erro)) {
      return NextResponse.json({ erro: erro.message }, { status: erro.status });
    }
    console.error('[API Notificacoes Contagem] Erro:', erro);
    return NextResponse.json(
      { erro: 'Erro ao buscar contagem' },
      { status: 500 }
    );
  }
}
