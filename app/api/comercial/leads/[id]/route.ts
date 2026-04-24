/**
 * PATCH /api/comercial/leads/[id] — Aprovar ou rejeitar lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const acaoSchema = z.object({
  acao: z.enum(['aprovar', 'rejeitar', 'remover']),
  obs: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);
    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = acaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const { acao, obs } = parsed.data;

    // Verificar se o lead existe e está pendente com flag de aprovação
    const existing = await query(
      `SELECT id, status, requer_aprovacao_comercial
       FROM public.leads_representante
       WHERE id = $1`,
      [leadId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const lead = existing.rows[0];
    if (lead.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Este lead não está pendente' },
        { status: 409 }
      );
    }

    if (acao !== 'remover' && !lead.requer_aprovacao_comercial) {
      return NextResponse.json(
        { error: 'Este lead não está pendente de aprovação comercial' },
        { status: 409 }
      );
    }

    if (acao === 'aprovar') {
      await query(
        `UPDATE public.leads_representante
         SET requer_aprovacao_comercial = false,
             aprovado_por = $2,
             aprovacao_obs = $3,
             aprovacao_em = NOW()
         WHERE id = $1`,
        [leadId, session.cpf, obs ?? null]
      );
    } else {
      // rejeitar ou remover
      await query(
        `UPDATE public.leads_representante
         SET status = 'rejeitado',
             aprovado_por = $2,
             aprovacao_obs = $3,
             aprovacao_em = NOW()
         WHERE id = $1`,
        [leadId, session.cpf, obs ?? null]
      );
    }

    return NextResponse.json({
      success: true,
      acao,
      message:
        acao === 'aprovar'
          ? 'Lead aprovado com sucesso.'
          : acao === 'remover'
            ? 'Lead removido com sucesso.'
            : 'Lead rejeitado.',
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[PATCH /api/comercial/leads/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
