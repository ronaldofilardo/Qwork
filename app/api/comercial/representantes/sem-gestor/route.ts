/**
 * GET /api/comercial/representantes/sem-gestor
 *
 * Lista representantes ativos que ainda não possuem gestor comercial atribuído
 * (gestor_comercial_cpf IS NULL). Usado pelo Comercial para identificar quem
 * ele pode assumir como seu representante.
 *
 * Acesso: comercial, admin
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole(['comercial', 'admin'], false);

    const rows = await query<{
      id: number;
      nome: string;
      email: string;
      status: string;
      tipo_pessoa: string;
      criado_em: string;
      leads_ativos: string;
      vinculos_ativos: string;
    }>(
      `SELECT
         r.id,
         r.nome,
         r.email,
         r.status,
         r.tipo_pessoa,
         r.criado_em,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.status NOT IN ('expirado', 'convertido')
         ) AS leads_ativos,
         COUNT(DISTINCT vc.id) FILTER (
           WHERE vc.status = 'ativo'
         ) AS vinculos_ativos
       FROM public.representantes r
       LEFT JOIN public.leads_representante lr ON lr.representante_id = r.id
       LEFT JOIN public.vinculos_comissao vc ON vc.representante_id = r.id
       WHERE r.gestor_comercial_cpf IS NULL
         AND r.ativo = true
         AND r.status NOT IN ('desativado', 'rejeitado')
       GROUP BY r.id
       ORDER BY r.criado_em DESC`
    );

    return NextResponse.json({
      representantes: rows.rows.map((r) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        status: r.status,
        tipo_pessoa: r.tipo_pessoa,
        criado_em: r.criado_em,
        leads_ativos: parseInt(r.leads_ativos ?? '0', 10),
        vinculos_ativos: parseInt(r.vinculos_ativos ?? '0', 10),
      })),
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/comercial/representantes/sem-gestor]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
