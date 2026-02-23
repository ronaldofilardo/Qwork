import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/monitor/lotes
 * Retorna TODOS os lotes de todas as empresas clientes da clínica do RH logado,
 * independente de status ou data. Usado no Monitor de Lotes e Laudos.
 */
export const GET = async (_req: Request) => {
  const session = await Promise.resolve(getSession());

  if (!session || session.perfil !== 'rh') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const clinicaId = session.clinica_id;

  if (!clinicaId) {
    return NextResponse.json(
      { error: 'Clínica não identificada na sessão' },
      { status: 403 }
    );
  }

  try {
    const result = await query(
      `
      SELECT
        la.id,
        la.descricao,
        la.tipo,
        la.status,
        la.liberado_em,
        ec.id   AS empresa_id,
        ec.nome AS empresa_nome,
        COUNT(a.id)                                               AS total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida')        AS avaliacoes_concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada')        AS avaliacoes_inativadas,
        COUNT(a.id) FILTER (WHERE a.status NOT IN ('concluida','inativada')) AS avaliacoes_pendentes,
        l.id     AS laudo_id,
        l.status AS laudo_status,
        l.emitido_em,
        l.enviado_em,
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END AS emissao_solicitada,
        fe.solicitado_em AS emissao_solicitado_em,
        fe.solicitado_por
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN avaliacoes a    ON a.lote_id = la.id
      LEFT JOIN laudos l        ON l.lote_id = la.id
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      WHERE la.clinica_id = $1
      GROUP BY
        la.id, la.descricao, la.tipo, la.status, la.liberado_em,
        ec.id, ec.nome,
        l.id, l.status, l.emitido_em, l.enviado_em,
        fe.id, fe.solicitado_em, fe.solicitado_por
      ORDER BY la.liberado_em DESC NULLS LAST
      `,
      [clinicaId]
    );

    const lotes = result.rows.map((row) => ({
      id: row.id,
      descricao: row.descricao || `Lote #${String(row.id)}`,
      tipo: row.tipo,
      status: row.status,
      liberado_em: row.liberado_em,
      empresa_id: row.empresa_id,
      empresa_nome: row.empresa_nome,
      total_avaliacoes: parseInt(row.total_avaliacoes ?? '0'),
      avaliacoes_concluidas: parseInt(row.avaliacoes_concluidas ?? '0'),
      avaliacoes_inativadas: parseInt(row.avaliacoes_inativadas ?? '0'),
      avaliacoes_pendentes: parseInt(row.avaliacoes_pendentes ?? '0'),
      laudo_id: row.laudo_id ?? null,
      laudo_status: row.laudo_status ?? null,
      emitido_em: row.emitido_em ?? null,
      enviado_em: row.enviado_em ?? null,
      emissao_solicitada: row.emissao_solicitada === true,
      emissao_solicitado_em: row.emissao_solicitado_em ?? null,
      solicitado_por: row.solicitado_por ?? null,
    }));

    return NextResponse.json({ success: true, lotes });
  } catch (error) {
    console.error('[GET /api/rh/monitor/lotes] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar lotes',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
