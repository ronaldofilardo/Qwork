/**
 * GET /api/comercial/leads — Lista leads que requerem aprovação comercial
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['comercial', 'admin'], false);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;
    const repFilter = searchParams.get('representante_id');
    const modo = searchParams.get('modo'); // 'aprovacao' (padrão) | 'todos'

    const wheres: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Por padrão exibe apenas leads que requerem aprovação
    if (modo !== 'todos') {
      wheres.push(`lr.requer_aprovacao_comercial = true`);
      wheres.push(`lr.status = 'pendente'`);
    }

    if (repFilter) {
      wheres.push(`lr.representante_id = $${idx++}`);
      params.push(parseInt(repFilter, 10));
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM public.leads_representante lr ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         lr.id,
         lr.cnpj,
         lr.razao_social,
         lr.contato_nome,
         lr.contato_email,
         lr.tipo_cliente,
         lr.valor_negociado,
         lr.percentual_comissao,
         lr.percentual_comissao_representante,
         lr.percentual_comissao_comercial,
         lr.num_vidas_estimado,
         lr.requer_aprovacao_comercial,
         lr.criado_em,
         lr.status,
         r.id   AS representante_id,
         r.nome AS representante_nome,
         r.id::text AS representante_codigo,
         r.modelo_comissionamento,
         v.id   AS vendedor_id,
         v.nome AS vendedor_nome
       FROM public.leads_representante lr
       JOIN public.representantes r ON r.id = lr.representante_id
       LEFT JOIN public.usuarios v ON v.id = lr.vendedor_id
       ${where}
       ORDER BY lr.criado_em DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return NextResponse.json({ leads: rows.rows, total, page, limit });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[GET /api/comercial/leads]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
