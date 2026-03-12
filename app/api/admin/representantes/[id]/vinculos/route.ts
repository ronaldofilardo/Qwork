/**
 * GET /api/admin/representantes/[id]/vinculos
 * Lista os vínculos de comissão de um representante específico.
 * Filtros: ?status=ativo|inativo|suspenso|encerrado  &page=N
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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const wheres: string[] = ['v.representante_id = $1'];
    const baseParams: unknown[] = [repId];
    let i = 2;

    if (
      status &&
      ['ativo', 'inativo', 'suspenso', 'encerrado'].includes(status)
    ) {
      wheres.push(`v.status = $${i++}`);
      baseParams.push(status);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;

    // Contagem total
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM vinculos_comissao v ${where}`,
      baseParams
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    // Contagens por status
    const statsResult = await query(
      `SELECT v.status, COUNT(*)::int AS count
       FROM vinculos_comissao v
       WHERE v.representante_id = $1
       GROUP BY v.status`,
      [repId]
    );
    const contagens: Record<string, number> = {
      ativo: 0,
      inativo: 0,
      suspenso: 0,
      encerrado: 0,
    };
    for (const row of statsResult.rows) {
      contagens[row.status] = row.count;
    }

    // Vínculos paginados
    const pageParams = [...baseParams, limit, offset];
    const rows = await query(
      `SELECT
         v.id,
         v.entidade_id,
         v.lead_id,
         v.status,
         v.data_inicio,
         v.data_expiracao,
         v.ultimo_laudo_em,
         v.criado_em,
         v.encerrado_em,
         v.encerrado_motivo,
         e.nome        AS entidade_nome,
         e.cnpj        AS entidade_cnpj,
         l.razao_social AS lead_razao_social,
         l.valor_negociado AS lead_valor_negociado,
         CASE
           WHEN v.status = 'ativo'
                AND v.data_expiracao <= NOW()::DATE + 30
             THEN true
           ELSE false
         END AS vence_em_breve,
         CASE
           WHEN v.status = 'ativo'
                AND v.ultimo_laudo_em IS NOT NULL
                AND v.ultimo_laudo_em < NOW() - INTERVAL '90 days'
             THEN true
           ELSE false
         END AS sem_laudo_recente
       FROM vinculos_comissao v
       LEFT JOIN entidades e ON e.id = v.entidade_id
       LEFT JOIN leads_representante l ON l.id = v.lead_id
       ${where}
       ORDER BY
         CASE WHEN v.status = 'ativo' THEN 0 ELSE 1 END,
         v.data_expiracao ASC,
         v.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      pageParams
    );

    return NextResponse.json({
      vinculos: rows.rows,
      total,
      page,
      limit,
      contagens,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/admin/representantes/[id]/vinculos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
