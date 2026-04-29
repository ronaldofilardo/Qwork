/**
 * GET /api/suporte/comissionamento/leads
 * Lista todos os leads com informações de comissionamento (rep, CNPJ, modelo, valores).
 * Acesso read-only para Suporte e Admin.
 * Paginado: 50 por página.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['suporte', 'admin'], false);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 50;
    const offset = (page - 1) * limit;
    const apenasAprovacaoSuporte =
      searchParams.get('requer_aprovacao_suporte') === 'true';

    const baseWhere = apenasAprovacaoSuporte
      ? `WHERE l.requer_aprovacao_suporte = true AND l.status = 'pendente'`
      : '';

    const [countRes, leadsRes] = await Promise.all([
      query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM leads_representante l ${baseWhere}`,
        []
      ),
      query(
        `SELECT
           l.id,
           l.cnpj,
           l.razao_social,
           l.tipo_cliente,
           l.valor_negociado,
           l.percentual_comissao_representante,
           l.valor_custo_fixo_snapshot,
           l.requer_aprovacao_comercial,
           l.requer_aprovacao_suporte,
           l.status,
           l.criado_em,
           r.nome                    AS representante_nome,

           r.modelo_comissionamento,
           r.percentual_comissao     AS rep_percentual_atual,
           r.valor_custo_fixo_entidade,
           r.valor_custo_fixo_clinica
         FROM leads_representante l
         JOIN representantes r ON r.id = l.representante_id
         ${baseWhere}
         ORDER BY l.criado_em DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

    return NextResponse.json({
      leads: leadsRes.rows,
      total,
      page,
      limit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[GET /api/suporte/comissionamento/leads]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
