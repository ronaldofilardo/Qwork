/**
 * GET /api/vendedor/relatorios/vendas
 *
 * Relatório de vendas (comissões) por representante vinculado ao vendedor.
 * Agrupa comissões por representante e mês, mostrando desempenho comercial.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const { searchParams } = new URL(request.url);
    const representanteId = searchParams.get('representante_id');
    const periodo = searchParams.get('periodo') ?? 'mes'; // mes | trimestre | ano
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;

    // Buscar ID do vendedor
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

    // Montar filtro de período
    let periodoFilter = '';
    if (periodo === 'mes') {
      periodoFilter = `AND c.mes_emissao = to_char(now(), 'YYYY-MM')`;
    } else if (periodo === 'trimestre') {
      periodoFilter = `AND c.data_emissao_laudo >= now() - interval '3 months'`;
    } else if (periodo === 'ano') {
      periodoFilter = `AND extract(year from c.data_emissao_laudo) = extract(year from now())`;
    }

    const params: unknown[] = [vendedorId];
    let repFilter = '';
    if (representanteId && !isNaN(parseInt(representanteId))) {
      params.push(parseInt(representanteId));
      repFilter = `AND hc.representante_id = $${params.length}`;
    }

    const countParams = [...params];
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total
       FROM comissoes_laudo c
       JOIN hierarquia_comercial hc
         ON hc.representante_id = c.representante_id
         AND hc.vendedor_id = $1
         AND hc.ativo = true
       ${repFilter}
       ${periodoFilter}`,
      countParams
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    params.push(limit, offset);
    const rows = await query(
      `SELECT
         c.id,
         c.representante_id,
         r.nome                    AS representante_nome,
         c.mes_emissao,
         c.valor_laudo,
         c.valor_comissao,
         c.percentual_comissao,
         c.status,
         c.data_emissao_laudo,
         c.data_aprovacao,
         c.data_pagamento,
         c.clinica_id,
         c.criado_em
       FROM comissoes_laudo c
       JOIN hierarquia_comercial hc
         ON hc.representante_id = c.representante_id
         AND hc.vendedor_id = $1
         AND hc.ativo = true
       JOIN representantes r ON r.id = c.representante_id
       ${repFilter}
       ${periodoFilter}
       ORDER BY c.data_emissao_laudo DESC NULLS LAST, c.criado_em DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({
      comissoes: rows.rows,
      total,
      page,
      limit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/vendedor/relatorios/vendas]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
