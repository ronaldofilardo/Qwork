/**
 * GET /api/representante/equipe/resumo — KPIs da equipe do representante logado
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

    // Métricas da equipe (vendedores + leads via hierarquia)
    const equipeResult = await query<{
      total_vendedores: string;
      leads_ativos: string;
      leads_mes: string;
    }>(
      `SELECT
         COUNT(DISTINCT hc.vendedor_id)                                        AS total_vendedores,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.status NOT IN ('expirado', 'convertido')
         )                                                                     AS leads_ativos,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.criado_em >= date_trunc('month', now())
         )                                                                     AS leads_mes
       FROM public.hierarquia_comercial hc
       LEFT JOIN public.leads_representante lr ON lr.vendedor_id = hc.vendedor_id
       WHERE hc.representante_id = $1 AND hc.ativo = true`,
      [sess.representante_id]
    );

    // Vínculos ativos do próprio representante
    const vinculosResult = await query<{ vinculos_ativos: string }>(
      `SELECT COUNT(*) AS vinculos_ativos
       FROM public.vinculos_comissao
       WHERE representante_id = $1 AND status = 'ativo'`,
      [sess.representante_id]
    );

    const row = equipeResult.rows[0];
    const vinculos = vinculosResult.rows[0];
    return NextResponse.json({
      total_vendedores: parseInt(row?.total_vendedores ?? '0', 10),
      leads_ativos: parseInt(row?.leads_ativos ?? '0', 10),
      leads_mes: parseInt(row?.leads_mes ?? '0', 10),
      vinculos_ativos: parseInt(vinculos?.vinculos_ativos ?? '0', 10),
    });
  } catch (err: unknown) {
    return repAuthErrorResponse(err as Error);
  }
}
