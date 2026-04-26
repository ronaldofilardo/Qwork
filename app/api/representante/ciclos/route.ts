/**
 * GET /api/representante/ciclos
 * Retorna resumo mensal de comissões do representante, agrupado por mês.
 * O pagamento ocorre no momento em que o tomador paga a cobrança — não há ciclos NF.
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
    const limit = Math.min(48, parseInt(searchParams.get('limit') ?? '24', 10));

    const [ciclosResult, resumoResult] = await Promise.all([
      query(
        `SELECT
           DATE_TRUNC('month', mes_emissao::date)::date          AS mes_referencia,
           COALESCE(SUM(valor_comissao), 0)                      AS valor_total,
           COALESCE(SUM(valor_comissao) FILTER (WHERE status = 'paga'), 0) AS valor_pago,
           COUNT(*)                                              AS qtd_comissoes,
           COUNT(*) FILTER (WHERE status = 'paga')              AS qtd_pagas
         FROM comissoes_laudo
         WHERE representante_id = $1
         GROUP BY DATE_TRUNC('month', mes_emissao::date)
         ORDER BY mes_referencia DESC
         LIMIT $2`,
        [sess.representante_id, limit]
      ),
      query(
        `SELECT
           COALESCE(SUM(valor_comissao), 0)                                       AS valor_total,
           COALESCE(SUM(valor_comissao) FILTER (WHERE status = 'paga'), 0)        AS valor_pago,
           COUNT(DISTINCT DATE_TRUNC('month', mes_emissao::date))                 AS qtd_meses,
           COUNT(*) FILTER (WHERE status = 'paga')                                AS qtd_pagas
         FROM comissoes_laudo
         WHERE representante_id = $1`,
        [sess.representante_id]
      ),
    ]);

    const resumo = resumoResult.rows[0] ?? {};

    return NextResponse.json({
      ciclos: ciclosResult.rows,
      total: ciclosResult.rows.length,
      resumo: {
        valor_total: resumo.valor_total,
        valor_pago: resumo.valor_pago,
        qtd_meses: parseInt(String(resumo.qtd_meses ?? '0'), 10),
        qtd_pagas: parseInt(String(resumo.qtd_pagas ?? '0'), 10),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('REP_')) {
      return repAuthErrorResponse(err);
    }
    console.error('[GET /api/representante/ciclos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
