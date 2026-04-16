/**
 * GET /api/comercial/contratos
 * Lista contratos (vínculos/comissões) para perfil comercial.
 * Mesma estrutura do endpoint admin, sem o campo valor_qwork (interno da plataforma).
 * Auth: comercial
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('comercial', false);

    const rows = await query<{
      contratante_nome: string;
      contratante_cnpj: string;
      contratante_id: number;
      vinculo_id: number;
      tipo_contratante: string;
      rep_nome: string | null;
      rep_cpf: string | null;
      lead_data: string | null;
      contrato_data: string | null;
      tempo_dias: string | null;
      tipo_comissionamento: string | null;
      percentual_comissao: string | null;
      valor_custo_fixo: string | null;
      laudo_id: number | null;
      lote_id: number | null;
      avaliacoes_concluidas: string;
      valor_avaliacao: string | null;
      valor_total: string | null;
      perc_comercial: string | null;
      valor_comercial: string | null;
      perc_rep: string | null;
      valor_rep: string | null;
    }>(
      `SELECT
         COALESCE(clin.nome, ent.nome)                        AS contratante_nome,
         COALESCE(clin.cnpj, ent.cnpj)                        AS contratante_cnpj,
         COALESCE(vc.clinica_id, vc.entidade_id)              AS contratante_id,
         vc.id                                                AS vinculo_id,
         CASE
           WHEN vc.clinica_id IS NOT NULL THEN 'clinica'
           ELSE 'entidade'
         END                                                  AS tipo_contratante,
         r.nome                                               AS rep_nome,
         r.cpf                                                AS rep_cpf,
         lr.criado_em                                         AS lead_data,
         vc.data_inicio                                       AS contrato_data,
         (vc.data_inicio - lr.criado_em::date)                AS tempo_dias,
         r.modelo_comissionamento                              AS tipo_comissionamento,
         r.percentual_comissao                                AS percentual_comissao,
         NULL                                                 AS valor_custo_fixo,
         cl.laudo_id                                          AS laudo_id,
         laudo.lote_id                                        AS lote_id,
         COUNT(av.id) FILTER (WHERE av.status = 'concluida') AS avaliacoes_concluidas,
         la.valor_por_funcionario                             AS valor_avaliacao,
         cl.valor_laudo                                       AS valor_total,
         COALESCE(cl.percentual_comissao_comercial, r.percentual_comissao_comercial) AS perc_comercial,
         cl.valor_comissao_comercial                          AS valor_comercial,
         cl.percentual_comissao                               AS perc_rep,
         cl.valor_comissao                                    AS valor_rep
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
         r.nome, r.cpf,
         r.modelo_comissionamento,
         r.percentual_comissao,
         r.percentual_comissao_comercial,
         lr.criado_em,
         vc.data_inicio,
         cl.laudo_id,
         laudo.lote_id,
         la.valor_por_funcionario,
         cl.valor_laudo,
         cl.percentual_comissao,
         cl.valor_comissao,
         cl.percentual_comissao_comercial,
         cl.valor_comissao_comercial
       ORDER BY vc.id DESC, cl.laudo_id DESC NULLS LAST
       LIMIT 500`,
      []
    );

    return NextResponse.json({ contratos: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/comercial/contratos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
