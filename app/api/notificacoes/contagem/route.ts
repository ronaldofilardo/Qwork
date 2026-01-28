/**
 * API: GET /api/notificacoes/contagem
 * Obter contagem de notificações não lidas
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';
import type { DestinatarioTipo } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }

    const destinatarioTipo: DestinatarioTipo =
      session.perfil === 'admin'
        ? 'admin'
        : session.perfil === 'rh'
          ? 'gestor_entidade'
          : 'funcionario';

    const contagem = await NotificationService.contarNaoLidas(
      session.cpf,
      destinatarioTipo
    );

    return NextResponse.json(contagem || { total_nao_lidas: 0 });
  } catch (erro) {
    console.error('[API Notificacoes Contagem] Erro:', erro);
    return NextResponse.json(
      { erro: 'Erro ao buscar contagem' },
      { status: 500 }
    );
  }
}
