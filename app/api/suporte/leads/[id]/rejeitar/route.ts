/**
 * PATCH /api/suporte/leads/[id]/rejeitar
 * Suporte rejeita um lead que requer aprovação (requer_aprovacao_suporte = true).
 * Muda status do lead para 'rejeitado'.
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  motivo: z.string().max(500).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const bodyRaw = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(bodyRaw);
    const motivo = parsed.success ? (parsed.data.motivo ?? null) : null;

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
          error: `Lead está com status '${lead.status}'. Apenas leads pendentes podem ser rejeitados.`,
        },
        { status: 409 }
      );
    }

    await query(
      `UPDATE leads_representante
       SET status = 'rejeitado',
           observacoes = CASE
             WHEN $2::text IS NOT NULL THEN COALESCE(observacoes || E'\n', '') || 'Rejeitado pelo Suporte: ' || $2
             ELSE observacoes
           END,
           atualizado_em = NOW()
       WHERE id = $1`,
      [id, motivo]
    );

    console.info(
      JSON.stringify({
        event: 'suporte_rejeitou_lead',
        lead_id: id,
        motivo,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      ok: true,
      message: 'Lead rejeitado pelo Suporte.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    console.error('[PATCH /api/suporte/leads/[id]/rejeitar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
