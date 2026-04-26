/**
 * POST /api/comercial/representantes-leads/[id]/aprovar
 *
 * Comercial aprova documentação de um candidato (lead da LP): status → 'verificado'
 * Só pode aprovar leads atribuídos ao próprio comercial.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole('comercial', false);
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const current = await query<{
      status: string;
      comercial_cpf: string | null;
    }>(
      `SELECT status, comercial_cpf FROM representantes_cadastro_leads WHERE id = $1`,
      [leadId]
    );

    if (current.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    if (current.rows[0].comercial_cpf !== session.cpf) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (current.rows[0].status !== 'pendente_verificacao') {
      return NextResponse.json(
        {
          error: `Lead não pode ser aprovado — status atual: ${current.rows[0].status}`,
        },
        { status: 409 }
      );
    }

    await query(
      `UPDATE representantes_cadastro_leads
       SET status = 'verificado',
           verificado_em = NOW(),
           verificado_por = $2
       WHERE id = $1`,
      [leadId, session.cpf]
    );

    return NextResponse.json({ success: true, status: 'verificado' });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/comercial/representantes-leads/[id]/aprovar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
