/**
 * GET /api/representante/vinculos   — lista vínculos do representante logado
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
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;

    const wheres = [`v.representante_id = $1`];
    const params: unknown[] = [sess.representante_id];
    let i = 2;

    if (
      status &&
      ['ativo', 'inativo', 'suspenso', 'encerrado'].includes(status)
    ) {
      wheres.push(`v.status = $${i++}`);
      params.push(status);
    }

    const where = `WHERE ${wheres.join(' AND ')}`;
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM vinculos_comissao v ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         v.*,
         e.nome                       AS entidade_nome,
         e.cnpj                       AS entidade_cnpj,
         COUNT(c.id)                  AS total_comissoes,
         COALESCE(SUM(CASE WHEN c.status = 'paga' THEN c.valor_comissao ELSE 0 END), 0) AS valor_total_pago,
         COALESCE(SUM(CASE WHEN c.status IN ('aprovada','liberada') THEN c.valor_comissao ELSE 0 END), 0) AS valor_pendente,
         -- Alerta de expiração (dias restantes)
         (v.data_expiracao - CURRENT_DATE) AS dias_para_expirar
       FROM vinculos_comissao v
       JOIN entidades e ON e.id = v.entidade_id
       LEFT JOIN comissoes_laudo c ON c.vinculo_id = v.id
       ${where}
       GROUP BY v.id, e.nome, e.cnpj
       ORDER BY v.data_expiracao ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({ vinculos: rows.rows, total, page, limit });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[GET /api/representante/vinculos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
