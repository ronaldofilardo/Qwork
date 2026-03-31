/**
 * GET /api/representante/metricas — Dashboard de métricas para o representante
 * Retorna performance da equipe (vendedores) e indicadores globais.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sess = requireRepresentante();

    // 1. Performance por Vendedor (Equipe)
    const vendedoresPerformance = await query(
      `SELECT
         u.id,
         u.nome,
         u.email,
         COUNT(DISTINCT lr.id) as total_leads,
         COUNT(DISTINCT lr.id) FILTER (WHERE lr.status = 'convertido') as leads_convertidos,
         COALESCE(SUM(lr.valor_negociado), 0) as volume_negociado,
         COALESCE(SUM(CASE WHEN lr.status = 'convertido' THEN lr.valor_negociado ELSE 0 END), 0) as volume_convertido
       FROM public.hierarquia_comercial hc
       JOIN public.usuarios u ON u.id = hc.vendedor_id
       LEFT JOIN public.leads_representante lr ON lr.vendedor_id = u.id
       WHERE hc.representante_id = $1 AND hc.ativo = true
       GROUP BY u.id, u.nome, u.email
       ORDER BY volume_convertido DESC`,
      [sess.representante_id]
    );

    // 2. Evolução de Leads (Últimos 6 meses)
    const evolucaoLeads = await query(
      `SELECT
         to_char(criado_em, 'YYYY-MM') as mes,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'convertido') as convertidos
       FROM public.leads_representante
       WHERE representante_id = $1
         AND criado_em >= now() - interval '6 months'
       GROUP BY mes
       ORDER BY mes ASC`,
      [sess.representante_id]
    );

    // 3. Resumo Geral (KPIs)
    const resumoGeral = await query(
      `SELECT
         COUNT(*) as total_leads,
         COUNT(*) FILTER (WHERE status = 'convertido') as total_convertidos,
         COALESCE(SUM(valor_negociado), 0) as valor_total_negociado,
         (SELECT COUNT(*) FROM vinculos_comissao WHERE representante_id = $1 AND status = 'ativo') as vinculos_ativos
       FROM public.leads_representante
       WHERE representante_id = $1`,
      [sess.representante_id]
    );

    return NextResponse.json({
      vendedores: vendedoresPerformance.rows,
      evolucao: evolucaoLeads.rows,
      resumo: resumoGeral.rows[0],
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[GET /api/representante/metricas]', e);
    return repAuthErrorResponse(e);
  }
}
