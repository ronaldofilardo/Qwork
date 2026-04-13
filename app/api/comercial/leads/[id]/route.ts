/**
 * PATCH /api/comercial/leads/[id] — Aprovar ou rejeitar lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  calcularValoresComissao,
  MAX_PERCENTUAL_COMISSAO,
} from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';

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
    const existing = await query<{
      id: number;
      status: string;
      requer_aprovacao_comercial: boolean;
      valor_negociado: string | null;
      percentual_comissao_representante: string | null;
      percentual_comissao_comercial: string | null;
      tipo_cliente: TipoCliente;
      modelo_comissionamento: string | null;
    }>(
      `SELECT lr.id, lr.status, lr.requer_aprovacao_comercial,
              lr.valor_negociado, lr.percentual_comissao_representante,
              lr.percentual_comissao_comercial, lr.tipo_cliente,
              r.modelo_comissionamento
       FROM public.leads_representante lr
       JOIN public.representantes r ON r.id = lr.representante_id
       WHERE lr.id = $1`,
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

      // Verificar se o valor QWork ficou abaixo do custo mínimo e notificar suporte
      const leadRow = existing.rows[0];
      const valorNegociado = Number(leadRow.valor_negociado ?? 0);
      const percRep = Number(leadRow.percentual_comissao_representante ?? 0);
      const percComercial =
        leadRow.modelo_comissionamento === 'percentual'
          ? MAX_PERCENTUAL_COMISSAO - percRep
          : Number(leadRow.percentual_comissao_comercial ?? 0);

      const bd = calcularValoresComissao(
        valorNegociado,
        percRep,
        percComercial,
        leadRow.tipo_cliente
      );

      if (bd.abaixoCusto) {
        const tipoLabel =
          leadRow.tipo_cliente === 'entidade' ? 'Entidade' : 'Clínica';
        await query(
          `INSERT INTO notificacoes_admin
             (tipo, titulo, mensagem, dados_contexto, criado_em)
           VALUES
             ($1, $2, $3, $4::jsonb, NOW())`,
          [
            'comissao_abaixo_custo_aprovada',
            `Comissão aprovada abaixo do custo mínimo (${tipoLabel})`,
            `Lead #${leadId} aprovado pelo comercial com valor QWork de R$ ${bd.valorQWork.toFixed(2)}, abaixo do custo mínimo por avaliação para ${tipoLabel}.`,
            JSON.stringify({
              lead_id: leadId,
              tipo_cliente: leadRow.tipo_cliente,
              valor_negociado: valorNegociado,
              perc_rep: percRep,
              perc_comercial: percComercial,
              valor_qwork: bd.valorQWork,
              aprovado_por: session.cpf,
            }),
          ]
        );
      }
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
