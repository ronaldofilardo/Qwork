/**
 * GET /api/suporte/comissoes/por-representante
 *
 * Lista comissões agrupadas por representante.
 * Filtro por mês (query ?mes=YYYY-MM).
 *
 * Acesso: suporte, admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['suporte', 'admin'], false);

    const mes = request.nextUrl.searchParams.get('mes');
    const mesRef = mes ? `${mes}-01` : null;

    const params: unknown[] = [];
    let mesFilter = '';
    if (mesRef) {
      params.push(mesRef);
      mesFilter = `AND c.mes_emissao = $1::date`;
    }

    const result = await query(
      `SELECT
         r.id AS representante_id,
         r.nome AS representante_nome,
         r.email AS representante_email,
         r.cnpj AS representante_cnpj,
         r.asaas_wallet_id,
         COUNT(c.id) AS total_comissoes,
         COALESCE(SUM(c.valor_comissao), 0) AS valor_total,
         COUNT(c.id) FILTER (WHERE c.status = 'retida') AS qtd_retidas,
         COUNT(c.id) FILTER (WHERE c.status = 'paga') AS qtd_pagas,
         COUNT(c.id) FILTER (WHERE c.status = 'liberada') AS qtd_liberadas,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'paga'), 0) AS valor_pago,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'retida' AND c.parcela_confirmada_em IS NOT NULL), 0) AS valor_pendente,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status = 'retida' AND c.parcela_confirmada_em IS NULL), 0) AS valor_provisionado
       FROM comissoes_laudo c
       JOIN representantes r ON r.id = c.representante_id
       WHERE 1=1 ${mesFilter}
       GROUP BY r.id, r.nome, r.email, r.cnpj, r.asaas_wallet_id
       ORDER BY r.nome`,
      params
    );

    return NextResponse.json({
      representantes: result.rows,
      total: result.rows.length,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message?.includes('não autorizado') || e.message?.includes('Acesso negado')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[API suporte/comissoes/por-representante] Erro:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
