/**
 * GET /api/admin/representantes/leads — lista todos os leads de todos os representantes (admin)
 * Filtros: ?status=pendente|convertido|expirado  &representante_id=N  &q=texto  &page=N
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['comercial', 'suporte'], false);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const representante_id = searchParams.get('representante_id') ?? undefined;
    const q = searchParams.get('q') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (status && ['pendente', 'convertido', 'expirado'].includes(status)) {
      wheres.push(`l.status = $${i++}`);
      params.push(status);
    }

    if (representante_id && !isNaN(Number(representante_id))) {
      wheres.push(`l.representante_id = $${i++}`);
      params.push(Number(representante_id));
    }

    if (q?.trim()) {
      wheres.push(
        `(l.cnpj ILIKE $${i} OR l.razao_social ILIKE $${i} OR l.contato_nome ILIKE $${i} OR r.nome ILIKE $${i})`
      );
      params.push(`%${q.trim()}%`);
      i++;
    }

    const where = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';

    // Contagem total
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total
       FROM leads_representante l
       JOIN representantes r ON r.id = l.representante_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // Contagens por status (sem filtro de status, respeitando representante_id e busca)
    const statsWheres: string[] = [];
    let sIdx = 1;
    if (representante_id && !isNaN(Number(representante_id))) {
      statsWheres.push(`l.representante_id = $${sIdx++}`);
    }
    if (q?.trim()) {
      statsWheres.push(
        `(l.cnpj ILIKE $${sIdx} OR l.razao_social ILIKE $${sIdx} OR l.contato_nome ILIKE $${sIdx} OR r.nome ILIKE $${sIdx})`
      );
      sIdx++;
    }
    const statsW = statsWheres.length
      ? `WHERE ${statsWheres.join(' AND ')}`
      : '';
    const statsP: unknown[] = [];
    if (representante_id && !isNaN(Number(representante_id)))
      statsP.push(Number(representante_id));
    if (q?.trim()) statsP.push(`%${q.trim()}%`);

    const statsResult = await query(
      `SELECT l.status, COUNT(*)::int as count
       FROM leads_representante l
       JOIN representantes r ON r.id = l.representante_id
       ${statsW}
       GROUP BY l.status`,
      statsP
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
    params.push(limit, offset);
    const rows = await query(
      `SELECT l.*,
              r.nome AS representante_nome,
              r.email AS representante_email,
              r.id::text AS representante_codigo,
              e.nome AS entidade_nome
       FROM leads_representante l
       JOIN representantes r ON r.id = l.representante_id
       LEFT JOIN entidades e ON e.id = l.entidade_id
       ${where}
       ORDER BY l.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
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
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão') {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    console.error('[GET /api/admin/representantes/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
