/**
 * GET /api/representante/ciclos
 * Lista os ciclos de comissão (mensal) do representante autenticado.
 * Retorna ciclos existentes + auto-cria ciclos para meses com comissões pagas sem ciclo.
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

    // Auto-upsert: para cada mês com comissão paga sem ciclo associado, cria o ciclo
    await query(
      `INSERT INTO ciclos_comissao (representante_id, mes_referencia, valor_total, qtd_comissoes, status)
       SELECT
         c.representante_id,
         DATE_TRUNC('month', c.mes_emissao::date)::date AS mes_referencia,
         COALESCE(SUM(c.valor_comissao), 0) AS valor_total,
         COUNT(*) AS qtd_comissoes,
         'fechado' AS status
       FROM comissoes_laudo c
       WHERE c.representante_id = $1
         AND c.status = 'paga'
         AND c.ciclo_id IS NULL
       GROUP BY c.representante_id, DATE_TRUNC('month', c.mes_emissao::date)
       ON CONFLICT (representante_id, mes_referencia) DO UPDATE
         SET valor_total   = ciclos_comissao.valor_total + EXCLUDED.valor_total,
             qtd_comissoes = ciclos_comissao.qtd_comissoes + EXCLUDED.qtd_comissoes
       WHERE ciclos_comissao.status NOT IN ('nf_enviada', 'nf_aprovada', 'pago')`,
      [sess.representante_id]
    );

    // Vincular comissões pagas ao ciclo recém-criado/atualizado
    await query(
      `UPDATE comissoes_laudo c
       SET ciclo_id = cc.id
       FROM ciclos_comissao cc
       WHERE c.representante_id = $1
         AND c.status = 'paga'
         AND c.ciclo_id IS NULL
         AND cc.representante_id = $1
         AND cc.mes_referencia = DATE_TRUNC('month', c.mes_emissao::date)::date`,
      [sess.representante_id]
    );

    // Buscar ciclos
    const [ciclosResult, resumoResult] = await Promise.all([
      query(
        `SELECT
           id,
           mes_referencia,
           valor_total,
           qtd_comissoes,
           status,
           nf_path,
           nf_nome_arquivo,
           nf_enviada_em,
           nf_aprovada_em,
           nf_rejeitada_em,
           nf_motivo_rejeicao,
           data_pagamento,
           fechado_em
         FROM ciclos_comissao
         WHERE representante_id = $1
         ORDER BY mes_referencia DESC
         LIMIT $2`,
        [sess.representante_id, limit]
      ),
      query(
        `SELECT
           COALESCE(SUM(valor_total), 0)                               AS valor_total,
           COALESCE(SUM(valor_total) FILTER (WHERE status = 'pago'), 0) AS valor_pago,
           COUNT(*)                                                    AS qtd_ciclos,
           COUNT(*) FILTER (WHERE status = 'pago')                    AS qtd_pagos
         FROM ciclos_comissao
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
        qtd_ciclos: parseInt(String(resumo.qtd_ciclos ?? '0'), 10),
        qtd_pagos: parseInt(String(resumo.qtd_pagos ?? '0'), 10),
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
