/**
 * GET /api/suporte/comissionamento/ciclos
 *
 * Lista ciclos mensais de comissão, com filtros opcionais.
 *
 * Query params:
 *   status   — filtra por status (aberto|aguardando_nf_rpa|nf_rpa_enviada|validado|vencido)
 *   mes_ano  — filtra por mês/ano no formato YYYY-MM
 *   page     — página (default 1)
 *   limit    — itens por página (default 20, max 100)
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['suporte', 'admin'], false);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const mesAno = searchParams.get('mes_ano');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`c.status = $${idx++}`);
      values.push(status);
    }
    if (mesAno) {
      conditions.push(`c.mes_ano = $${idx++}`);
      values.push(mesAno);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(
        `SELECT c.*,
                r.nome AS representante_nome,
                r.email AS representante_email,
                r.codigo AS representante_codigo,
                r.tipo_pessoa AS representante_tipo_pessoa
         FROM ciclos_comissao_mensal c
         JOIN representantes r ON r.id = c.representante_id
         ${where}
         ORDER BY c.mes_ano DESC, c.criado_em DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM ciclos_comissao_mensal c ${where}`, values),
    ]);

    return NextResponse.json({
      ciclos: dataRes.rows,
      total: parseInt(countRes.rows[0].count as string, 10),
      page,
      limit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/suporte/comissionamento/ciclos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
