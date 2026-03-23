/**
 * GET /api/representante/minhas-vendas/vinculos
 * Lista vínculos originados de leads diretos do representante (leads onde vendedor_id IS NULL).
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

    // Vínculos de leads DIRETOS do representante (sem vendedor intermediário)
    const wheres = [`lr.representante_id = $1`, `lr.vendedor_id IS NULL`];
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
      `SELECT COUNT(DISTINCT v.id) as total
       FROM vinculos_comissao v
       JOIN leads_representante lr ON lr.id = v.lead_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         v.*,
         e.nome                                   AS entidade_nome,
         e.cnpj                                   AS entidade_cnpj,
         (v.data_expiracao - CURRENT_DATE)        AS dias_para_expirar,
         lr.valor_negociado                       AS lead_valor_negociado,
         lr.contato_nome                          AS lead_contato_nome,
         lr.contato_email                         AS lead_contato_email,
         COALESCE(SUM(CASE WHEN c.status = 'paga'            THEN c.valor_comissao ELSE 0 END), 0) AS valor_total_pago,
         COALESCE(SUM(CASE WHEN c.status IN ('aprovada','liberada') THEN c.valor_comissao ELSE 0 END), 0) AS valor_pendente
       FROM vinculos_comissao v
       JOIN entidades e           ON e.id  = v.entidade_id
       JOIN leads_representante lr ON lr.id = v.lead_id
       LEFT JOIN comissoes_laudo c ON c.vinculo_id = v.id
       ${where}
       GROUP BY v.id, e.nome, e.cnpj, lr.valor_negociado, lr.contato_nome, lr.contato_email
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
    console.error('[GET /api/representante/minhas-vendas/vinculos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
