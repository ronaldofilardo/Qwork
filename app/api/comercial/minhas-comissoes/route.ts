/**
 * GET /api/comercial/minhas-comissoes
 *
 * Comissões do perfil comercial foram removidas do sistema.
 * Retorna estrutura vazia para compatibilidade com frontend legado.
 *
 * Auth: comercial
 */
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('comercial', false);

    return NextResponse.json({
      success: true,
      comissoes: [],
      resumo: {
        total_laudos: '0',
        total_recebido: '0',
        media_por_laudo: '0',
        valor_pendente: '0',
        valor_liberado: '0',
      },
      total: 0,
      page: 1,
      limit: 30,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[GET /api/comercial/minhas-comissoes]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
