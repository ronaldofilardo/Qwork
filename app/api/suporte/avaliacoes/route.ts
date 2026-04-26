import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireRole('suporte', false);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      100,
      Math.max(10, parseInt(searchParams.get('limit') || '20'))
    );
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || '';
    const dataInicio = searchParams.get('data_inicio')?.trim() || '';
    const dataFim = searchParams.get('data_fim')?.trim() || '';

    const baseParams: unknown[] = [];
    const conditions: string[] = [
      "la.status != 'rascunho'",
      'la.liberado_em IS NOT NULL',
    ];

    if (search) {
      baseParams.push(`%${search}%`);
      const idx = baseParams.length;
      conditions.push(
        `(cl.nome ILIKE $${idx} OR ent.nome ILIKE $${idx} OR ec.nome ILIKE $${idx})`
      );
    }

    if (statusFilter === 'em_andamento') {
      conditions.push("la.status = 'ativo'");
    } else if (statusFilter === 'aguardando_emissao') {
      conditions.push("la.status = 'concluido' AND la.emitido_em IS NULL");
    } else if (statusFilter === 'laudo_emitido') {
      conditions.push('la.emitido_em IS NOT NULL AND la.enviado_em IS NULL');
    } else if (statusFilter === 'laudo_enviado') {
      conditions.push('la.enviado_em IS NOT NULL');
    } else if (statusFilter === 'cancelado') {
      conditions.push("la.status = 'cancelado'");
    }

    if (dataInicio) {
      baseParams.push(dataInicio);
      conditions.push(`la.liberado_em >= $${baseParams.length}::date`);
    }
    if (dataFim) {
      baseParams.push(dataFim);
      conditions.push(
        `la.liberado_em < ($${baseParams.length}::date + INTERVAL '1 day')`
      );
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const joins = `
      FROM lotes_avaliacao la
      LEFT JOIN clinicas cl ON cl.id = la.clinica_id
      LEFT JOIN entidades ent ON ent.id = la.entidade_id
      LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN laudos ld ON ld.lote_id = la.id
      ${whereClause}
    `;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(DISTINCT la.id) AS total ${joins}`,
      [...baseParams]
    );
    const total = parseInt(countResult.rows[0]?.total || '0');

    const dataParams: unknown[] = [...baseParams, limit, offset];
    const limitIdx = dataParams.length - 1;
    const offsetIdx = dataParams.length;

    const dataResult = await query(
      `SELECT
        la.id AS lote_id,
        la.tipo,
        la.status,
        la.liberado_em,
        la.numero_ordem,
        COALESCE(ld.emitido_em, la.emitido_em) AS emitido_em,
        COALESCE(ld.enviado_em, la.enviado_em) AS enviado_em,
        COALESCE(ld.status, 'rascunho') AS laudo_status,
        la.laudo_enviado_em,
        la.solicitacao_emissao_em,
        la.pago_em,
        la.status_pagamento,
        COALESCE(cl.nome, ent.nome) AS tomador_nome,
        CASE WHEN la.clinica_id IS NOT NULL THEN 'clinica' ELSE 'entidade' END AS tomador_tipo,
        ec.nome AS empresa_nome,
        COUNT(a.id) AS avaliacoes_liberadas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluido') AS avaliacoes_concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') AS avaliacoes_inativadas
      ${joins}
      GROUP BY
        la.id, la.tipo, la.status, la.liberado_em,
        la.numero_ordem, ld.emitido_em, ld.enviado_em, ld.status,
        la.emitido_em, la.enviado_em, la.laudo_enviado_em,
        la.solicitacao_emissao_em, la.pago_em, la.status_pagamento,
        cl.nome, ent.nome, ec.nome
      ORDER BY la.liberado_em DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    const lotes = dataResult.rows.map((row) => ({
      lote_id: Number(row.lote_id),
      tipo: row.tipo as string,
      status: row.status as string,
      laudo_status: (row.laudo_status as string) || 'rascunho',
      liberado_em: row.liberado_em as string,
      emitido_em: (row.emitido_em as string) ?? null,
      enviado_em: (row.enviado_em as string) ?? null,
      laudo_enviado_em: (row.laudo_enviado_em as string) ?? null,
      solicitacao_emissao_em: (row.solicitacao_emissao_em as string) ?? null,
      pago_em: (row.pago_em as string) ?? null,
      status_pagamento: (row.status_pagamento as string) ?? null,
      numero_ordem: Number(row.numero_ordem),
      tomador_nome: (row.tomador_nome as string) || 'Desconhecido',
      tomador_tipo: row.tomador_tipo as string,
      empresa_nome: (row.empresa_nome as string) ?? null,
      avaliacoes_liberadas: Number(row.avaliacoes_liberadas ?? 0),
      avaliacoes_concluidas: Number(row.avaliacoes_concluidas ?? 0),
      avaliacoes_inativadas: Number(row.avaliacoes_inativadas ?? 0),
    }));

    // Debug: Log para diagnosticar dados do banco
    if (lotes.length > 0) {
      console.log('🗄️  Primeiro lote do DB:', {
        id: lotes[0].lote_id,
        status: lotes[0].status,
        laudo_status: lotes[0].laudo_status,
        emitido_em: lotes[0].emitido_em,
        enviado_em: lotes[0].enviado_em,
        laudo_enviado_em: lotes[0].laudo_enviado_em,
        pago_em: lotes[0].pago_em,
        status_pagamento: lotes[0].status_pagamento,
      });
    }

    return NextResponse.json({
      lotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number };
    console.error('[suporte/avaliacoes] Erro:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar avaliações' },
      { status: err.status || 500 }
    );
  }
}
