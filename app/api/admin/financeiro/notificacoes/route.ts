// API Route para listar notificações
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { getNotificacoesFinanceiras } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissão admin
    await requireRole('suporte', false);

    const { searchParams } = new URL(request.url);
    const contratoId = searchParams.get('contrato_id');
    const apenasNaoLidas = searchParams.get('nao_lidas') !== 'false'; // Default true

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

    return NextResponse.json(
      {
        error: 'Erro ao listar notificações',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
