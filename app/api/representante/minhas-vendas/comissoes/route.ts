/**
 * GET /api/representante/minhas-vendas/comissoes
 * Lista comissões de leads diretos do representante (leads onde vendedor_id IS NULL).
 * Reutiliza a mesma estrutura de /api/representante/comissoes com filtro adicional.
 *
 * Upload de NF/RPA: reutiliza /api/representante/comissoes/[id]/nf (sem duplicação).
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sess = requireRepresentante();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const mes = searchParams.get('mes') ?? undefined; // formato: YYYY-MM
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    // Apenas comissões de leads diretos (vendedor_id IS NULL) OU orfãs (sem lead)
    const wheres = [
      `c.representante_id = $1`,
      `EXISTS (
        SELECT 1 FROM vinculos_comissao vc
        LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
        WHERE vc.id = c.vinculo_id AND (vc.lead_id IS NULL OR lr.vendedor_id IS NULL)
      )`,
    ];
    const params: unknown[] = [sess.representante_id];
    let i = 2;

    const statusValidos = [
      'retida',
      'pendente_consolidacao',
      'congelada_rep_suspenso',
      'congelada_aguardando_admin',
      'liberada',
      'paga',
      'cancelada',
    ];
    if (status && statusValidos.includes(status)) {
      wheres.push(`c.status = $${i++}`);
      params.push(status);
    }

    if (mes) {
      const dataInicio = `${mes}-01`;
      wheres.push(`c.mes_emissao = $${i++}::date`);
      params.push(dataInicio);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    // Resumo dos totais para leads diretos ou orfãos
    const [resumo, countResult] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE c.status::text IN ('pendente_consolidacao','retida'))                               AS pendentes,
           COUNT(*) FILTER (WHERE c.status::text = 'liberada')                                                         AS liberadas,
           COUNT(*) FILTER (WHERE c.status::text = 'paga')                                                             AS pagas,
           COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text IN ('pendente_consolidacao','retida')), 0)       AS valor_pendente,
           COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'liberada'), 0)                               AS valor_liberado,
           COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'paga'), 0)                                   AS valor_pago_total
         FROM comissoes_laudo c
         WHERE c.representante_id = $1
           AND EXISTS (
             SELECT 1 FROM vinculos_comissao vc
             LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
             WHERE vc.id = c.vinculo_id AND (vc.lead_id IS NULL OR lr.vendedor_id IS NULL)
           )`,
        [sess.representante_id]
      ),
      query<{ total: string }>(
        `SELECT COUNT(*) as total FROM comissoes_laudo c ${where}`,
        params
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         c.id,
         c.vinculo_id,
         c.representante_id,
         c.entidade_id,
         c.clinica_id,
         c.laudo_id,
         c.percentual_comissao,
         c.valor_laudo,
         c.valor_comissao,
         c.status,
         c.motivo_congelamento,
         c.mes_emissao,
         c.mes_pagamento,
         c.data_emissao_laudo,
         c.data_aprovacao,
         c.data_liberacao,
         c.data_pagamento,
         c.comprovante_pagamento_path,
         c.criado_em,
         c.atualizado_em,
         c.parcela_numero,
         c.total_parcelas,
         c.lote_pagamento_id,
         c.parcela_confirmada_em,
         COALESCE(e.nome, cl.nome) AS entidade_nome
       FROM comissoes_laudo c
       LEFT JOIN entidades e  ON e.id  = c.entidade_id
       LEFT JOIN clinicas  cl ON cl.id = c.clinica_id
       ${where}
       ORDER BY c.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({
      comissoes: rows.rows,
      total,
      page,
      limit,
      resumo: resumo.rows[0],
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/minhas-vendas/comissoes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
