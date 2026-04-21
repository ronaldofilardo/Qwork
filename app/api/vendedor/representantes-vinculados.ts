/**
 * GET /api/vendedor/vinculos — lista representantes vinculados ao vendedor logado
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const userResult = await query<{ id: number }>(
      `SELECT id FROM usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const vendedorId = userResult.rows[0].id;

    const rows = await query(
      `SELECT
         hc.id              AS vinculo_id,
         hc.ativo,
         hc.criado_em       AS vinculado_em,
         r.id               AS representante_id,
         r.nome             AS representante_nome,
         r.email            AS representante_email,
         r.id::text         AS representante_codigo,
         r.status           AS representante_status,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.status NOT IN ('expirado','convertido')
         )                 AS leads_ativos_representante
       FROM public.hierarquia_comercial hc
       JOIN public.representantes r ON r.id = hc.representante_id
       LEFT JOIN public.leads_representante lr ON lr.representante_id = r.id
       WHERE hc.vendedor_id = $1 AND hc.ativo = true
       GROUP BY hc.id, r.id
       ORDER BY r.nome`,
      [vendedorId]
    );

    return NextResponse.json({ vinculos: rows.rows, total: rows.rows.length });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('/api/vendedor/vinculos GET error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
