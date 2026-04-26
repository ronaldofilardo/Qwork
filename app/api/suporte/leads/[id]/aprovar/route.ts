/**
 * PATCH /api/suporte/leads/[id]/aprovar
 * Suporte aprova um lead que requer aprovação (requer_aprovacao_suporte = true).
 * Muda status do lead para 'aprovado' e limpa a flag.
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id, status, requer_aprovacao_suporte FROM leads_representante WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const lead = existing.rows[0] as {
      id: number;
      status: string;
      requer_aprovacao_suporte: boolean;
    };

    if (!lead.requer_aprovacao_suporte) {
      return NextResponse.json(
        { error: 'Lead não requer aprovação do Suporte' },
        { status: 409 }
      );
    }

    if (lead.status !== 'pendente') {
      return NextResponse.json(
        {
          error: `Lead está com status '${lead.status}'. Apenas leads pendentes podem ser aprovados.`,
        },
        { status: 409 }
      );
    }

    await query(
      `UPDATE leads_representante
       SET requer_aprovacao_suporte = false,
           status = 'aprovado',
           atualizado_em = NOW()
       WHERE id = $1`,
      [id]
    );

    console.info(
      JSON.stringify({
        event: 'suporte_aprovou_lead',
        lead_id: id,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message: 'Lead aprovado pelo Suporte.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    console.error('[PATCH /api/suporte/leads/[id]/aprovar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
