/**
 * @deprecated Este endpoint não é mais utilizado.
 * O fluxo de convite agora utiliza o código do representante
 * informado na tela de cadastro (ConfirmacaoStep) em vez de
 * links com token. Mantido temporariamente para compatibilidade.
 *
 * POST /api/representante/leads/[id]/token
 * Gera (ou regenera) o token on-demand do link de convite do lead.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sess = requireRepresentante();
    const leadId = parseInt(params.id, 10);
    if (isNaN(leadId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Verificar se o lead pertence ao representante e está pendente
    const leadResult = await query(
      `SELECT id, representante_id, status, data_expiracao
       FROM leads_representante
       WHERE id = $1 LIMIT 1`,
      [leadId]
    );

    if (leadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      );
    }

    const lead = leadResult.rows[0];

    if (lead.representante_id !== sess.representante_id) {
      return NextResponse.json(
        { error: 'Sem permissão para este lead' },
        { status: 403 }
      );
    }

    if (lead.status !== 'pendente') {
      return NextResponse.json(
        { error: `Lead ${lead.status} — não é possível gerar token` },
        { status: 409 }
      );
    }

    // A expiração do TOKEN é: min(data_expiracao_lead, NOW() + 90 dias)
    // Chamar função PostgreSQL para gerar token único
    const tokenResult = await query(
      `UPDATE leads_representante
       SET token_atual      = public.gerar_token_lead(),
           token_gerado_em  = NOW(),
           token_expiracao  = LEAST(data_expiracao, NOW() + INTERVAL '90 days')
       WHERE id = $1
       RETURNING token_atual, token_expiracao`,
      [leadId]
    );

    const row = tokenResult.rows[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qwork.com.br';
    const linkConvite = `${baseUrl}/cadastro?token=${row.token_atual}`;

    return NextResponse.json({
      token: row.token_atual,
      expira_em: row.token_expiracao,
      link_convite: linkConvite,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[POST /api/representante/leads/[id]/token]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
