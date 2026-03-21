/**
 * GET /api/vendedor/relatorios/pagamentos
 *
 * Relatório de pagamentos (comissões pagas) dos representantes vinculados ao vendedor.
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
    const status = searchParams.get('status'); // paga | liberada | pendente_nf | etc.
    const periodo = searchParams.get('periodo') ?? 'ano';
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

    const params: unknown[] = [vendedorId];
    const wheres: string[] = [];

    // Filtro de status
    const statusValidos = [
      'paga',
      'liberada',
      'pendente_nf',
      'nf_enviada',
      'nf_aprovada',
      'congelada',
      'cancelada',
    ];
    if (status && statusValidos.includes(status)) {
      params.push(status);
      wheres.push(`c.status = $${params.length}`);
    }

    // Filtro de representante
    if (representanteId && !isNaN(parseInt(representanteId))) {
      params.push(parseInt(representanteId));
      wheres.push(`hc.representante_id = $${params.length}`);
    }

    // Filtro de período
    if (periodo === 'mes') {
      wheres.push(`c.mes_pagamento = to_char(now(), 'YYYY-MM')`);
    } else if (periodo === 'trimestre') {
      wheres.push(`c.data_pagamento >= now() - interval '3 months'`);
    } else if (periodo === 'ano') {
      wheres.push(`extract(year from c.criado_em) = extract(year from now())`);
    }

    const whereClause = wheres.length ? `AND ${wheres.join(' AND ')}` : '';

    const countParams = [...params];
    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total
       FROM comissoes_laudo c
       JOIN hierarquia_comercial hc
         ON hc.representante_id = c.representante_id
         AND hc.vendedor_id = $1
         AND hc.ativo = true
       ${whereClause}`,
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
         c.mes_pagamento,
         c.valor_laudo,
         c.valor_comissao,
         c.percentual_comissao,
         c.status,
         c.data_emissao_laudo,
         c.data_pagamento,
         c.comprovante_pagamento_path,
         c.clinica_id,
         c.criado_em
       FROM comissoes_laudo c
       JOIN hierarquia_comercial hc
         ON hc.representante_id = c.representante_id
         AND hc.vendedor_id = $1
         AND hc.ativo = true
       JOIN representantes r ON r.id = c.representante_id
       ${whereClause}
       ORDER BY c.data_pagamento DESC NULLS LAST, c.criado_em DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Totalizador
    const totaisResult = await query<{
      total_pago: string;
      total_pendente: string;
    }>(
      `SELECT
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'paga'), 0)              AS total_pago,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status IN ('pendente_nf','nf_enviada','nf_aprovada','liberada')), 0) AS total_pendente
       FROM comissoes_laudo c
       JOIN hierarquia_comercial hc
         ON hc.representante_id = c.representante_id
         AND hc.vendedor_id = $1
         AND hc.ativo = true`,
      [vendedorId]
    );
    const totais = totaisResult.rows[0];

    return NextResponse.json({
      pagamentos: rows.rows,
      total,
      page,
      limit,
      totais: {
        total_pago: parseFloat(totais?.total_pago ?? '0'),
        total_pendente: parseFloat(totais?.total_pendente ?? '0'),
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/vendedor/relatorios/pagamentos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
