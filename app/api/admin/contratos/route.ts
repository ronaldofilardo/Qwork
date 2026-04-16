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
      vinculo_id: number;
      tipo_contratante: string;
      rep_nome: string | null;
      rep_cpf: string | null;
      rep_codigo: string | null;
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
    }>(
      `SELECT
         COALESCE(clin.nome, ent.nome)                             AS contratante_nome,
         COALESCE(clin.cnpj, ent.cnpj)                             AS contratante_cnpj,
         COALESCE(vc.clinica_id, vc.entidade_id)                   AS contratante_id,
         vc.id                                                     AS vinculo_id,
         CASE
           WHEN vc.clinica_id IS NOT NULL THEN 'clinica'
           ELSE 'entidade'
         END                                                       AS tipo_contratante,
         r.nome                                                    AS rep_nome,
         COALESCE(r.cpf, r.cpf_responsavel_pj)                     AS rep_cpf,
         r.codigo                                                  AS rep_codigo,
         lr.criado_em                                              AS lead_data,
         vc.data_inicio                                            AS contrato_data,
         (vc.data_inicio - lr.criado_em::date)                     AS tempo_dias,
         r.modelo_comissionamento                                  AS tipo_comissionamento,
         r.percentual_comissao                                     AS percentual_comissao,
         lr.valor_custo_fixo_snapshot                              AS valor_custo_fixo,
         COALESCE(lr.valor_negociado, vc.valor_negociado)          AS valor_negociado,
         COUNT(DISTINCT cl.laudo_id)                               AS total_laudos,
         COUNT(DISTINCT laudo.lote_id)                             AS total_lotes,
         COUNT(av.id) FILTER (WHERE av.status = 'concluida')       AS avaliacoes_concluidas,
         MAX(la.valor_por_funcionario)                             AS valor_avaliacao,
         SUM(cl.valor_laudo)                                       AS valor_total,
         lr.percentual_comissao_comercial                          AS perc_comercial,
         SUM(cl.valor_comissao_comercial)                          AS valor_comercial,
         r.percentual_comissao                                     AS perc_rep,
         SUM(cl.valor_comissao)                                    AS valor_rep,
         ROUND(
           SUM(cl.valor_laudo)
           - COALESCE(SUM(cl.valor_comissao), 0)
           - COALESCE(SUM(cl.valor_comissao_comercial), 0),
           2
         )                                                         AS valor_qwork
       FROM public.vinculos_comissao vc
       LEFT JOIN public.comissoes_laudo cl   ON cl.vinculo_id = vc.id
       LEFT JOIN public.representantes r     ON r.id = vc.representante_id
       LEFT JOIN public.leads_representante lr ON lr.id = vc.lead_id
       LEFT JOIN public.entidades ent        ON ent.id = vc.entidade_id
       LEFT JOIN public.clinicas clin        ON clin.id = vc.clinica_id
       LEFT JOIN public.laudos laudo         ON laudo.id = cl.laudo_id
       LEFT JOIN public.lotes_avaliacao la   ON la.id = laudo.lote_id
       LEFT JOIN public.avaliacoes av        ON av.lote_id = la.id
       GROUP BY
         clin.nome, clin.cnpj,
         ent.nome, ent.cnpj,
         vc.clinica_id, vc.entidade_id,
         vc.id,
         vc.data_inicio,
         vc.valor_negociado,
         r.nome, r.cpf, r.cpf_responsavel_pj, r.codigo,
         r.modelo_comissionamento,
         r.percentual_comissao,
         lr.criado_em,
         lr.valor_custo_fixo_snapshot,
         lr.valor_negociado,
         lr.percentual_comissao_comercial
       ORDER BY vc.id DESC
       LIMIT 500`,
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
