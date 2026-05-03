/**
 * GET /api/admin/comissoes  — lista todas as comissões (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['comercial', 'suporte'], false);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const mesRaw = searchParams.get('mes') ?? undefined; // YYYY-MM ou número 1-12
    const anoRaw = searchParams.get('ano') ?? undefined;
    // Normaliza: se mes=3 e ano=2026 → "2026-03"; se mes=2026-03 → usa direto
    const mes = mesRaw
      ? /^\d{4}-\d{2}$/.test(mesRaw)
        ? mesRaw
        : anoRaw
          ? `${anoRaw}-${String(parseInt(mesRaw)).padStart(2, '0')}`
          : undefined
      : undefined;
    const repId = searchParams.get('rep_id') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;

    const wheres: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    const statusValidos = [
      'retida',
      'congelada_rep_suspenso',
      'congelada_aguardando_admin',
      'liberada',
      'paga',
      'cancelada',
    ];
    if (status && statusValidos.includes(status)) {
      wheres.push(`c.status::text = $${i++}`);
      params.push(status);
    }

    if (mes) {
      wheres.push(`c.mes_emissao = $${i++}::date`);
      params.push(`${mes}-01`);
    }

    if (repId && !isNaN(parseInt(repId))) {
      wheres.push(`c.representante_id = $${i++}`);
      params.push(parseInt(repId));
    }

    // provisionadas=1: comissões retidas com parcela futura não confirmada
    const provisionadas = searchParams.get('provisionadas') === '1';
    if (provisionadas && status === 'retida') {
      wheres.push(`c.parcela_confirmada_em IS NULL`);
    }

    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    // Resumo geral para o painel admin
    const resumo = await query(
      `SELECT
         COUNT(*) AS total_comissoes,
         COUNT(*) FILTER (WHERE c.status::text = 'retida') AS pendentes_consolidacao,
         COUNT(*) FILTER (WHERE c.status::text = 'liberada') AS liberadas,
         COUNT(*) FILTER (WHERE c.status::text = 'paga') AS pagas,
         COUNT(*) FILTER (WHERE c.status::text LIKE 'congelada%') AS congeladas,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'retida'),0) AS valor_a_pagar,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'paga'),0) AS valor_pago_total,
         COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'liberada'),0) AS valor_liberado
       FROM comissoes_laudo c
       ${where}`,
      params
    );

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM comissoes_laudo c ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const listParams = [...params, limit, offset];
    const rows = await query(
      `SELECT
         c.*,
         r.nome                        AS representante_nome,
         r.email                       AS representante_email,
         COALESCE(e.nome, cl.nome) AS entidade_nome,
         c.lote_pagamento_id,
         (c.valor_laudo / c.total_parcelas) AS valor_parcela,
         la.pagamento_metodo           AS lote_pagamento_metodo,
         la.pagamento_parcelas         AS lote_pagamento_parcelas,
         r.percentual_comissao         AS representante_percentual
       FROM comissoes_laudo c
       JOIN  representantes r  ON r.id  = c.representante_id
       LEFT JOIN entidades e   ON e.id  = c.entidade_id
       LEFT JOIN clinicas  cl  ON cl.id = c.clinica_id
       LEFT JOIN lotes_avaliacao la ON la.id = c.lote_pagamento_id
       LEFT JOIN vinculos_comissao vc ON vc.id = c.vinculo_id
       ${where}
       ORDER BY c.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      listParams
    );

    return NextResponse.json({
      comissoes: rows.rows,
      total,
      page,
      limit,
      resumo: resumo.rows[0],
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/admin/comissoes]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
