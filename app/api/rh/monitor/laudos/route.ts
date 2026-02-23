import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/monitor/laudos
 * Retorna TODOS os laudos de todas as empresas clientes da clínica do RH logado,
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
        l.id          AS laudo_id,
        l.lote_id,
        l.status      AS laudo_status,
        l.criado_em,
        l.emitido_em,
        l.enviado_em,
        l.hash_pdf,
        l.arquivo_remoto_url,
        l.arquivo_remoto_uploaded_at,
        la.descricao  AS lote_descricao,
        la.tipo       AS lote_tipo,
        la.status     AS lote_status,
        la.liberado_em,
        ec.id         AS empresa_id,
        ec.nome       AS empresa_nome,
        f.nome        AS emissor_nome,
        COUNT(a.id)                                               AS total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida')        AS avaliacoes_concluidas
      FROM laudos l
      JOIN lotes_avaliacao la   ON la.id    = l.lote_id
      JOIN empresas_clientes ec ON ec.id    = la.empresa_id
      LEFT JOIN funcionarios f  ON f.cpf    = l.emissor_cpf
      LEFT JOIN avaliacoes a    ON a.lote_id = la.id
      WHERE la.clinica_id = $1
      GROUP BY
        l.id, l.lote_id, l.status, l.criado_em, l.emitido_em, l.enviado_em, l.hash_pdf,
        l.arquivo_remoto_url, l.arquivo_remoto_uploaded_at,
        la.descricao, la.tipo, la.status, la.liberado_em,
        ec.id, ec.nome, f.nome
      HAVING NOT (
        COUNT(a.id) > 0
        AND COUNT(a.id) FILTER (WHERE a.status = 'inativada') = COUNT(a.id)
        AND COUNT(a.id) FILTER (WHERE a.status = 'concluida') = 0
      )
      ORDER BY COALESCE(l.emitido_em, l.criado_em) DESC NULLS LAST
      `,
      [clinicaId]
    );

    const laudos = result.rows.map((row) => ({
      id: row.laudo_id,
      lote_id: row.lote_id,
      lote_descricao: row.lote_descricao || `Lote #${String(row.lote_id)}`,
      lote_tipo: row.lote_tipo,
      lote_status: row.lote_status,
      laudo_status: row.laudo_status,
      empresa_id: row.empresa_id,
      empresa_nome: row.empresa_nome,
      emissor_nome: row.emissor_nome ?? null,
      liberado_em: row.liberado_em,
      criado_em: row.criado_em,
      emitido_em: row.emitido_em ?? null,
      enviado_em: row.enviado_em ?? null,
      hash_pdf: row.hash_pdf ?? null,
      arquivo_remoto_url: row.arquivo_remoto_url ?? null,
      arquivo_remoto_uploaded_at: row.arquivo_remoto_uploaded_at ?? null,
      total_avaliacoes: parseInt(row.total_avaliacoes ?? '0'),
      avaliacoes_concluidas: parseInt(row.avaliacoes_concluidas ?? '0'),
    }));

    return NextResponse.json({ success: true, laudos });
  } catch (error) {
    console.error('[GET /api/rh/monitor/laudos] Erro:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar laudos',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
