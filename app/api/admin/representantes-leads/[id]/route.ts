/**
 * GET  /api/admin/representantes-leads/[id]  — detalhe de um lead
 * POST /api/admin/representantes-leads/[id]/aprovar  — aprovar lead
 * POST /api/admin/representantes-leads/[id]/rejeitar — rejeitar lead
 *
 * Agrupamos GET e rotas de ação relacionadas num mesmo segmento.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole('admin', false);
    void session;

    const leadId = params.id;
    if (!leadId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const result = await query(
      `SELECT
         l.*
       FROM representantes_cadastro_leads l
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead: result.rows[0] });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/representantes-leads/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
