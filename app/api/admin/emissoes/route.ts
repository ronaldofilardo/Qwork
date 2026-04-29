import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole('suporte', false);

    const result = await query(`
      SELECT
        vs.*,
        pg.detalhes_parcelas,
        COALESCE(cl.isento_pagamento, ent.isento_pagamento, false)::boolean AS isento_pagamento,
        COALESCE(av.num_avaliacoes_cobradas, 0)::int AS num_avaliacoes_cobradas,
        -- Percentuais negociados especificamente para este vínculo/tomador
        vc_ext.percentual_comissao_representante  AS vinculo_percentual_rep,
        -- Snapshot do lead: modelo e valores no momento da negociação
        lr_ext.modelo_comissionamento              AS lead_modelo_comissionamento,
        lr_ext.percentual_comissao_representante   AS lead_percentual_rep,
        lr_ext.valor_custo_fixo_snapshot           AS lead_valor_custo_fixo_snapshot,
        -- Representante: dados globais de fallback
        r_ext.modelo_comissionamento               AS rep_modelo_comissionamento,
        r_ext.valor_custo_fixo_entidade            AS rep_valor_custo_fixo_entidade,
        r_ext.valor_custo_fixo_clinica             AS rep_valor_custo_fixo_clinica
      FROM v_solicitacoes_emissao vs
      LEFT JOIN clinicas cl ON cl.id = vs.clinica_id
      LEFT JOIN entidades ent ON ent.id = vs.entidade_id
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'rascunho')::int AS num_avaliacoes_cobradas
        FROM avaliacoes a
        WHERE a.lote_id = vs.lote_id
      ) av ON true
      LEFT JOIN vinculos_comissao vc_ext
        ON vc_ext.id = vs.vinculo_id
      LEFT JOIN leads_representante lr_ext
        ON lr_ext.id = vc_ext.lead_id
      LEFT JOIN representantes r_ext
        ON r_ext.id = vs.representante_id
      LEFT JOIN LATERAL (
        -- Prioriza o pagamento que referencia explicitamente este lote (dados_adicionais->lote_id).
        -- Fallback: pagamento mais recente da entidade/clínica (pagamentos antigos sem lote_id).
        SELECT detalhes_parcelas FROM pagamentos
        WHERE (
          (dados_adicionais->>'lote_id')::int = vs.lote_id
          OR (vs.clinica_id  IS NOT NULL AND clinica_id  = vs.clinica_id)
          OR (vs.entidade_id IS NOT NULL AND entidade_id = vs.entidade_id)
        )
        ORDER BY
          CASE WHEN (dados_adicionais->>'lote_id')::int = vs.lote_id THEN 0 ELSE 1 END,
          criado_em DESC
        LIMIT 1
      ) pg ON true
      ORDER BY 
        CASE 
          WHEN vs.status_pagamento = 'aguardando_cobranca' THEN 1
          WHEN vs.status_pagamento = 'aguardando_pagamento' THEN 2
          WHEN vs.status_pagamento = 'pago' THEN 3
          ELSE 4
        END,
        vs.solicitacao_emissao_em DESC
    `);

    // Debug logs
    console.log('[API /admin/emissoes] Query executada com sucesso');
    console.log('[API /admin/emissoes] Total de rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('[API /admin/emissoes] Primeira row:', result.rows[0]);
    }

    // Deduplicar por lote_id: a view pode retornar múltiplas linhas por lote
    // quando há mais de um vínculo de comissão (vinculos_comissao) associado.
    // Mantém a primeira ocorrência, que já é a mais relevante pelo ORDER BY da view.
    const seenLotes = new Map<number, (typeof result.rows)[0]>();
    for (const row of result.rows) {
      if (!seenLotes.has(row.lote_id)) {
        seenLotes.set(row.lote_id, row);
      }
    }
    const solicitacoes = Array.from(seenLotes.values()).map((row) => {
      const numAvaliacoesCobradas = Number(
        row.num_avaliacoes_cobradas ?? row.num_avaliacoes_concluidas ?? 0
      );
      const valorUnitario = Number(
        row.valor_por_funcionario ??
          row.lead_valor_negociado ??
          row.valor_negociado_vinculo ??
          0
      );

      const rowNormalizada = {
        ...row,
        // Compatibilidade com consumidores legados da view.
        num_avaliacoes_cobradas: numAvaliacoesCobradas,
        num_avaliacoes_concluidas: numAvaliacoesCobradas,
        valor_total_calculado: valorUnitario * numAvaliacoesCobradas,
      };

      if (row.isento_pagamento === true) {
        return {
          ...rowNormalizada,
          status_pagamento: 'pago',
          pagamento_metodo: row.pagamento_metodo || 'isento',
          pagamento_parcelas: row.pagamento_parcelas || 1,
          pago_em: row.pago_em || row.solicitacao_emissao_em,
        };
      }

      return rowNormalizada;
    });

    console.log(
      '[API /admin/emissoes] Após dedup:',
      solicitacoes.length,
      'lotes únicos de',
      result.rows.length,
      'rows'
    );

    return NextResponse.json({
      solicitacoes,
      total: solicitacoes.length,
    });
  } catch (error: any) {
    console.error('[ERRO] API admin/emissoes:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar solicitações' },
      { status: error.status || 500 }
    );
  }
}
