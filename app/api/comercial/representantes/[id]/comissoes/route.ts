/**
 * GET /api/comercial/representantes/[id]/comissoes
 *
 * Lista comissões pendentes (não pagas/canceladas) do representante.
 * Inclui nome da entidade, valor, status e mês previsto de pagamento.
 * Acesso: comercial, admin, suporte
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireRole(['comercial', 'admin', 'suporte'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const rows = await query(
      `SELECT
         cl.id,
         cl.status,
         cl.valor_comissao,
         cl.percentual_comissao,
         TO_CHAR(cl.mes_emissao,   'YYYY-MM') AS mes_emissao,
         TO_CHAR(cl.mes_pagamento, 'YYYY-MM') AS mes_pagamento,
         cl.data_emissao_laudo,
         e.nome         AS entidade_nome,
         e.cnpj         AS entidade_cnpj
       FROM comissoes_laudo cl
       JOIN entidades e ON e.id = cl.entidade_id
       WHERE cl.representante_id = $1
         AND cl.status NOT IN ('paga', 'cancelada')
       ORDER BY cl.mes_emissao DESC, cl.valor_comissao DESC
       LIMIT 100`,
      [representanteId]
    );

    const total_pendente: number = rows.rows.reduce(
      (acc: number, r: { valor_comissao: string }) =>
        acc + Number(r.valor_comissao),
      0
    );

    return NextResponse.json({ comissoes: rows.rows, total_pendente });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/comercial/representantes/[id]/comissoes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
