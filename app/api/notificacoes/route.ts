/**
 * API: GET /api/notificacoes
 * Listar notificações do usuário autenticado
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { NotificationService } from '@/lib/notification-service';
import type { DestinatarioTipo } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apenasnaoLidas = searchParams.get('apenasnaoLidas') === 'true';
    const limite = parseInt(searchParams.get('limite') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const destinatarioTipo: DestinatarioTipo =
      session.perfil === 'admin'
        ? 'admin'
        : session.perfil === 'rh'
          ? 'gestor_entidade'
          : 'funcionario';

    const notificacoes = await NotificationService.listar(
      session.cpf,
      destinatarioTipo,
      { apenasnaoLidas, limite, offset }
    );

    return NextResponse.json(notificacoes);
  } catch (erro) {
    console.error('[API Notificacoes] Erro ao listar:', erro);
    return NextResponse.json(
      { erro: 'Erro ao buscar notificações' },
      { status: 500 }
    );
  }
}
