/**
 * PATCH /api/representante/equipe/leads/[id]
 *
 * Representante aprova ou define comissão de um lead submetido por vendedor.
 *
 * Ações:
 *   - definir_comissao: Rep define seu percentual (percentual_comissao_representante).
 *     Se total (rep + vendedor) > custo mínimo → lead aprovado.
 *     Se abaixo do custo → requer_aprovacao_comercial = true.
 *
 * O vendedor_id = id do vendedor que criou o lead (via leads_representante.vendedor_id).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import {
  MAX_PERCENTUAL_COMISSAO,
  calcularRequerAprovacao,
} from '@/lib/leads-config';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  percentual_comissao_representante: z
    .number()
    .min(0)
    .max(MAX_PERCENTUAL_COMISSAO),
  percentual_comissao_vendedor: z
    .number()
    .min(0)
    .max(MAX_PERCENTUAL_COMISSAO)
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();
    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const { percentual_comissao_representante } = parsed.data;

    // Verificar que o lead pertence ao representante e foi criado por um vendedor
    const leadResult = await query(
      `SELECT id, status, vendedor_id, percentual_comissao_vendedor,
              valor_negociado, tipo_cliente
       FROM leads_representante
       WHERE id = $1 AND representante_id = $2 AND vendedor_id IS NOT NULL
       LIMIT 1`,
      [leadId, sess.representante_id]
    );

    if (leadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lead não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const lead = leadResult.rows[0];
    if (lead.status !== 'pendente') {
      return NextResponse.json(
        {
          error: `Lead não está pendente (status atual: ${lead.status as string})`,
        },
        { status: 409 }
      );
    }

    const percVendedor =
      parsed.data.percentual_comissao_vendedor !== undefined
        ? parsed.data.percentual_comissao_vendedor
        : parseFloat(lead.percentual_comissao_vendedor ?? '0');
    const totalPerc = percentual_comissao_representante + percVendedor;

    // Validar total ≤ MAX_PERCENTUAL_COMISSAO
    if (totalPerc > MAX_PERCENTUAL_COMISSAO) {
      return NextResponse.json(
        {
          error: `Comissão total (${totalPerc.toFixed(1)}%) excede o máximo permitido de ${MAX_PERCENTUAL_COMISSAO}%.`,
        },
        { status: 422 }
      );
    }

    const requerAprovacao = calcularRequerAprovacao(
      parseFloat(lead.valor_negociado ?? '0'),
      percentual_comissao_representante,
      lead.tipo_cliente as 'entidade' | 'clinica',
      percVendedor
    );

    await query(
      `UPDATE leads_representante
       SET percentual_comissao_representante = $2::numeric,
           percentual_comissao_vendedor = $3::numeric,
           percentual_comissao = $2::numeric + $3::numeric,
           requer_aprovacao_comercial = $4,
           atualizado_em = NOW()
       WHERE id = $1`,
      [leadId, percentual_comissao_representante, percVendedor, requerAprovacao]
    );

    const updated = await query(
      `SELECT * FROM leads_representante WHERE id = $1 LIMIT 1`,
      [leadId]
    );

    return NextResponse.json({
      lead: updated.rows[0],
      requer_aprovacao_comercial: requerAprovacao,
      message: requerAprovacao
        ? 'Comissão definida. Lead encaminhado para aprovação comercial (abaixo do custo mínimo).'
        : 'Comissão definida com sucesso.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[PATCH /api/representante/equipe/leads/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
