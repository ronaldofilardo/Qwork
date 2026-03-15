import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole('admin', false);

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

    return NextResponse.json({
      solicitacoes: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('[ERRO] API admin/emissoes:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar solicitações' },
      { status: error.status || 500 }
    );
  }
}
