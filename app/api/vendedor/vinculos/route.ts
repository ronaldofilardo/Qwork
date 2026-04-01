/**
 * GET /api/vendedor/vinculos — lista vínculos (tomadores) de clientes do vendedor logado
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['vendedor', 'admin']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;

    // Buscar ID real do vendedor
    const userRes = await query<{ id: number }>(
      'SELECT id FROM usuarios WHERE cpf = $1',
      [session.cpf]
    );
    if (userRes.rows.length === 0)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    const vendedorId = userRes.rows[0].id;

    // Filtro por vendedor_id no lead de origem
    const wheres = [`lr.vendedor_id = $1`];
    const params: unknown[] = [vendedorId];
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
         e.nome                       AS entidade_nome,
         e.cnpj                       AS entidade_cnpj,
         (v.data_expiracao - CURRENT_DATE) AS dias_para_expirar,
         lr.valor_negociado           AS lead_valor_negociado,
         lr.contato_nome              AS lead_contato_nome,
         lr.contato_email             AS lead_contato_email
       FROM vinculos_comissao v
       JOIN entidades e ON e.id = v.entidade_id
       JOIN leads_representante lr ON lr.id = v.lead_id
       ${where}
       ORDER BY v.data_expiracao ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    return NextResponse.json({ vinculos: rows.rows, total, page, limit });
  } catch (err: unknown) {
    console.error('[GET /api/vendedor/vinculos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
