/**
 * GET /api/suporte/contratos
 * Lista todos os contratos (vínculos/comissões) para perfil suporte.
 * Mesma estrutura do endpoint admin, sem o campo valor_qwork (interno da plataforma).
 * Auth: suporte
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('suporte', false);

    const rows = await query<{
      contratante_nome: string;
      contratante_cnpj: string;
      tipo_contratante: string;
      rep_nome: string;
      rep_cpf: string;
      lead_data: string | null;
      contrato_data: string | null;
      tempo_dias: string | null;
      tipo_comissionamento: string | null;
      percentual_comissao: string | null;
      valor_custo_fixo: string | null;
      laudo_id: number;
      lote_id: number;
      avaliacoes_concluidas: string;
      valor_avaliacao: string | null;
      valor_total: string;
      perc_comercial: string | null;
      valor_comercial: string;
      perc_rep: string;
      valor_rep: string;
    }>(
      `SELECT
         COALESCE(clin.nome, ent.nome)                        AS contratante_nome,
         COALESCE(clin.cnpj, ent.cnpj)                        AS contratante_cnpj,
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
         lr.valor_custo_fixo_snapshot                         AS valor_custo_fixo,
         cl.laudo_id                                          AS laudo_id,
         laudo.lote_id                                        AS lote_id,
         COUNT(av.id) FILTER (WHERE av.status = 'concluida') AS avaliacoes_concluidas,
         la.valor_por_funcionario                             AS valor_avaliacao,
         cl.valor_laudo                                       AS valor_total,
         lr.percentual_comissao_comercial                     AS perc_comercial,
         COALESCE(cl.valor_comissao_comercial, 0)             AS valor_comercial,
         cl.percentual_comissao                               AS perc_rep,
         cl.valor_comissao                                    AS valor_rep
       FROM public.comissoes_laudo cl
       JOIN public.vinculos_comissao vc     ON vc.id = cl.vinculo_id
       JOIN public.representantes r         ON r.id = cl.representante_id
       LEFT JOIN public.leads_representante lr ON lr.id = vc.lead_id
       LEFT JOIN public.entidades ent       ON ent.id = vc.entidade_id
       LEFT JOIN public.clinicas clin       ON clin.id = vc.clinica_id
       JOIN public.laudos laudo             ON laudo.id = cl.laudo_id
       JOIN public.lotes_avaliacao la       ON la.id = laudo.lote_id
       LEFT JOIN public.avaliacoes av       ON av.lote_id = la.id
       GROUP BY
         clin.nome, clin.cnpj,
         ent.nome, ent.cnpj,
         vc.clinica_id,
         r.nome, r.cpf,
         lr.criado_em,
         vc.data_inicio,
         r.modelo_comissionamento,
         r.percentual_comissao,
         lr.valor_custo_fixo_snapshot,
         cl.laudo_id,
         laudo.lote_id,
         la.valor_por_funcionario,
         cl.valor_laudo,
         lr.percentual_comissao_comercial,
         cl.valor_comissao_comercial,
         cl.percentual_comissao,
         cl.valor_comissao
       ORDER BY cl.laudo_id DESC
       LIMIT 500`,
      []
    );

    return NextResponse.json({ contratos: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[suporte/contratos] erro:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
