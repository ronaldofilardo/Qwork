/**
 * GET /api/comercial/representantes/metricas
 * Lista todos os representantes com métricas de leads, vínculos e comissões.
 * Auth: comercial | admin
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);
    void session;

    const { searchParams } = new URL(request.url);
    const soDesativados = searchParams.get('status') === 'desativado';

    const rows = await query<{
      id: number;
      nome: string;
      email: string;
      status: string;
      codigo: string;
      leads_ativos: string;
      leads_mes: string;
      vinculos_ativos: string;
      comissoes_pendentes: string;
      valor_pendente: string;
    }>(
      `SELECT
         r.id,
         r.nome,
         r.email,
         r.status,
         r.codigo,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.status NOT IN ('expirado', 'convertido')
         )                                                          AS leads_ativos,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.criado_em >= date_trunc('month', now())
         )                                                          AS leads_mes,
         COUNT(DISTINCT vc.id) FILTER (
           WHERE vc.status = 'ativo'
         )                                                          AS vinculos_ativos,
         COUNT(DISTINCT cl.id) FILTER (
           WHERE cl.status NOT IN ('paga', 'cancelada', 'congelada_rep_suspenso', 'congelada_aguardando_admin')
         )                                                          AS comissoes_pendentes,
         COALESCE(
           SUM(cl.valor_comissao) FILTER (
             WHERE cl.status NOT IN ('paga', 'cancelada', 'congelada_rep_suspenso', 'congelada_aguardando_admin')
           ), 0
         )                                                          AS valor_pendente
       FROM public.representantes r
       LEFT JOIN public.leads_representante lr ON lr.representante_id = r.id
       LEFT JOIN public.vinculos_comissao vc ON vc.representante_id = r.id
       LEFT JOIN public.comissoes_laudo cl ON cl.vinculo_id = vc.id
       WHERE r.status ${soDesativados ? "= 'desativado'" : "NOT IN ('desativado')"}
       GROUP BY r.id
       ORDER BY leads_ativos DESC, r.nome`
    );

    return NextResponse.json({
      representantes: rows.rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        status: r.status,
        codigo: r.codigo,
        leads_ativos: parseInt(r.leads_ativos ?? '0', 10),
        leads_mes: parseInt(r.leads_mes ?? '0', 10),
        vinculos_ativos: parseInt(r.vinculos_ativos ?? '0', 10),
        comissoes_pendentes: parseInt(r.comissoes_pendentes ?? '0', 10),
        valor_pendente: parseFloat(r.valor_pendente ?? '0'),
      })),
      total: rows.rows.length,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[GET /api/comercial/representantes/metricas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
