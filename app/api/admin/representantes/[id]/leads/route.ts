/**
 * GET /api/admin/representantes/[id]/leads
 * Lista paginada dos leads de um representante específico.
 * Filtros: ?status=pendente|convertido|expirado  &q=texto  &page=N
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin', false);

    const repId = parseInt(params.id, 10);
    if (isNaN(repId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const q = searchParams.get('q') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const wheres: string[] = ['l.representante_id = $1'];
    const baseParams: unknown[] = [repId];
    let i = 2;

    if (status && ['pendente', 'convertido', 'expirado'].includes(status)) {
      wheres.push(`l.status = $${i++}`);
      baseParams.push(status);
    }

    if (q?.trim()) {
      wheres.push(
        `(l.cnpj ILIKE $${i} OR l.razao_social ILIKE $${i} OR l.contato_nome ILIKE $${i})`
      );
      baseParams.push(`%${q.trim()}%`);
      i++;
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    // Contagem total filtrada
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM leads_representante l ${where}`,
      baseParams
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // Contagens por status (sem filtro de status, mas com busca)
    const statsWheres = ['l.representante_id = $1'];
    const statsParams: unknown[] = [repId];
    const si = 2;
    if (q?.trim()) {
      statsWheres.push(
        `(l.cnpj ILIKE $${si} OR l.razao_social ILIKE $${si} OR l.contato_nome ILIKE $${si})`
      );
      statsParams.push(`%${q.trim()}%`);
    }
    const statsW = `WHERE ${statsWheres.join(' AND ')}`;

    const statsResult = await query(
      `SELECT l.status, COUNT(*)::int AS count
       FROM leads_representante l
       ${statsW}
       GROUP BY l.status`,
      statsParams
    );
    const contagens: Record<string, number> = {
      pendente: 0,
      convertido: 0,
      expirado: 0,
    };
    for (const row of statsResult.rows) {
      contagens[row.status] = row.count;
    }

    // Leads paginados
    const pageParams = [...baseParams, limit, offset];
    const rows = await query(
      `SELECT
         l.*,
         e.nome AS entidade_nome,
         CASE
           WHEN l.status = 'pendente'
                AND l.data_expiracao <= NOW() + INTERVAL '7 days'
             THEN true
           ELSE false
         END AS vence_em_breve
       FROM leads_representante l
       LEFT JOIN entidades e ON e.id = l.entidade_id
       ${where}
       ORDER BY
         CASE WHEN l.status = 'pendente' THEN 0 ELSE 1 END,
         l.data_expiracao ASC,
         l.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      pageParams
    );

    return NextResponse.json({
      leads: rows.rows,
      total,
      page,
      limit,
      contagens,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/admin/representantes/[id]/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
