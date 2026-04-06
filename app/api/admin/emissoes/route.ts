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
        pg.detalhes_parcelas
      FROM v_solicitacoes_emissao vs
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
    const solicitacoes = Array.from(seenLotes.values());

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
