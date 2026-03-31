/**
 * GET /api/comercial/representantes/[id]/leads
 *
 * Lista leads do representante. ?mes=true filtra apenas o mês corrente.
 * Acesso: comercial, admin, suporte
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireRole(['comercial', 'admin', 'suporte'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const somenteMes = searchParams.get('mes') === 'true';
    const mesAtual = new Date().toISOString().slice(0, 7); // YYYY-MM

    const whereMes = somenteMes
      ? `AND TO_CHAR(lr.criado_em, 'YYYY-MM') = '${mesAtual}'`
      : '';

    const rows = await query(
      `SELECT
         lr.id,
         lr.cnpj,
         lr.razao_social,
         lr.contato_nome,
         lr.contato_email,
         lr.status,
         lr.origem,
         lr.criado_em,
         lr.data_expiracao,
         u.nome AS vendedor_nome,
         u.id   AS vendedor_id
       FROM leads_representante lr
       LEFT JOIN usuarios u ON u.id = lr.vendedor_id
       WHERE lr.representante_id = $1
         ${whereMes}
       ORDER BY lr.criado_em DESC
       LIMIT 100`,
      [representanteId]
    );

    return NextResponse.json({ leads: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/comercial/representantes/[id]/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
