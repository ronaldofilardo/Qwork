/**
 * GET /api/admin/contratos
 * Lista todos os contratos (vínculos/comissões) com dados de entidade,
 * representante, lead e split de comissão incluindo valor QWork.
 * Auth: admin
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('admin', false);

    const rows = await query<{
      contratante_nome: string;
      contratante_cnpj: string;
      contratante_id: number;
      vinculo_id: number | null;
      tipo_contratante: string;
      rep_nome: string | null;
      rep_cpf: string | null;
      lead_data: string | null;
      contrato_data: string | null;
      tempo_dias: string | null;
      tipo_comissionamento: string | null;
      percentual_comissao: string | null;
      valor_custo_fixo: string | null;
      valor_negociado: string | null;
      total_laudos: string;
      total_lotes: string;
      avaliacoes_concluidas: string;
      valor_avaliacao: string | null;
      valor_total: string | null;
      perc_comercial: string | null;
      valor_comercial: string | null;
      perc_rep: string | null;
      valor_rep: string | null;
      valor_qwork: string | null;
      isento_pagamento: boolean;
    }>(
      `WITH tomadores_base AS (
         SELECT
           e.id,
           'entidade'::text AS tipo_contratante,
           e.nome AS contratante_nome,
           e.cnpj AS contratante_cnpj,
           e.criado_em,
           COALESCE(e.isento_pagamento, false)::boolean AS isento_pagamento
         FROM entidades e
         UNION ALL
         SELECT
           cl.id,
           'clinica'::text AS tipo_contratante,
           cl.nome AS contratante_nome,
           cl.cnpj AS contratante_cnpj,
           cl.criado_em,
           COALESCE(cl.isento_pagamento, false)::boolean AS isento_pagamento
         FROM clinicas cl
       ), lotes_stats AS (
         SELECT
           COALESCE(la.clinica_id, la.entidade_id) AS contratante_id,
           CASE
             WHEN la.clinica_id IS NOT NULL THEN 'clinica'
             ELSE 'entidade'
           END::text AS tipo_contratante,
           COUNT(DISTINCT ld.id) AS total_laudos,
           COUNT(DISTINCT la.id) AS total_lotes,
           COUNT(av.id) FILTER (WHERE av.status = 'concluida') AS avaliacoes_concluidas,
           MAX(la.valor_por_funcionario) AS valor_avaliacao
         FROM public.lotes_avaliacao la
         LEFT JOIN public.laudos ld ON ld.lote_id = la.id
         LEFT JOIN public.avaliacoes av ON av.lote_id = la.id
         WHERE la.clinica_id IS NOT NULL OR la.entidade_id IS NOT NULL
         GROUP BY 1, 2
       )
       SELECT
         tb.contratante_nome,
         tb.contratante_cnpj,
         tb.id AS contratante_id,
         vc.id AS vinculo_id,
         tb.tipo_contratante,
         r.nome AS rep_nome,
         COALESCE(r.cpf, r.cpf_responsavel_pj) AS rep_cpf,

         lr.criado_em AS lead_data,
         ct.contrato_data,
         CASE
           WHEN ct.contrato_data IS NOT NULL AND lr.criado_em IS NOT NULL
             THEN (ct.contrato_data::date - lr.criado_em::date)
           ELSE NULL
         END AS tempo_dias,
         r.modelo_comissionamento AS tipo_comissionamento,
         r.percentual_comissao AS percentual_comissao,
         lr.valor_custo_fixo_snapshot AS valor_custo_fixo,
         COALESCE(lr.valor_negociado, vc.valor_negociado) AS valor_negociado,
         COALESCE(ls.total_laudos, 0) AS total_laudos,
         COALESCE(ls.total_lotes, 0) AS total_lotes,
         COALESCE(ls.avaliacoes_concluidas, 0) AS avaliacoes_concluidas,
         ls.valor_avaliacao,
         fin.valor_total,
         COALESCE(lr.percentual_comissao_comercial, r.percentual_comissao_comercial) AS perc_comercial,
         fin.valor_comercial,
         r.percentual_comissao AS perc_rep,
         fin.valor_rep,
         ROUND(
           COALESCE(fin.valor_total, 0)
           - COALESCE(fin.valor_rep, 0)
           - COALESCE(fin.valor_comercial, 0),
           2
         ) AS valor_qwork,
         tb.isento_pagamento
       FROM tomadores_base tb
       LEFT JOIN LATERAL (
         SELECT v.*
         FROM public.vinculos_comissao v
         WHERE (
           tb.tipo_contratante = 'clinica' AND v.clinica_id = tb.id
         ) OR (
           tb.tipo_contratante = 'entidade' AND v.entidade_id = tb.id
         )
         ORDER BY
           CASE WHEN v.status = 'ativo' THEN 0 ELSE 1 END,
           v.criado_em DESC,
           v.id DESC
         LIMIT 1
       ) vc ON true
       LEFT JOIN public.representantes r ON r.id = vc.representante_id
       LEFT JOIN public.leads_representante lr ON lr.id = vc.lead_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(c.data_aceite, c.criado_em) AS contrato_data
         FROM contratos c
         WHERE c.tomador_id = tb.id
           AND c.tipo_tomador = tb.tipo_contratante
         ORDER BY
           CASE WHEN c.aceito IS TRUE THEN 0 ELSE 1 END,
           COALESCE(c.data_aceite, c.criado_em) DESC,
           c.id DESC
         LIMIT 1
       ) ct ON true
       LEFT JOIN lotes_stats ls
         ON ls.contratante_id = tb.id
        AND ls.tipo_contratante = tb.tipo_contratante
       LEFT JOIN LATERAL (
         SELECT
           SUM(cl.valor_laudo) AS valor_total,
           SUM(cl.valor_comissao_comercial) AS valor_comercial,
           SUM(cl.valor_comissao) AS valor_rep
         FROM public.comissoes_laudo cl
         WHERE cl.vinculo_id = vc.id
       ) fin ON true
       ORDER BY
         COALESCE(ct.contrato_data, vc.data_inicio::timestamp, tb.criado_em) DESC,
         tb.contratante_nome ASC`,
      []
    );

    return NextResponse.json({ contratos: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/admin/contratos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
