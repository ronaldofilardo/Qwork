import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('admin', false);

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') ?? 'entidade'; // 'entidade' | 'rh'
    const dias = Math.min(
      Math.max(parseInt(searchParams.get('dias') ?? '30', 10), 7),
      90
    );
    const entidadeIdParam = searchParams.get('entidade_id');
    const entidadeId = entidadeIdParam ? parseInt(entidadeIdParam, 10) : null;

    // Entidade: avaliações de lotes criados diretamente pelo contratante (entidade_id preenchido)
    // RH: avaliações de lotes via clínica (clinica_id preenchido, entidade_id nulo)
    const tipoFilter =
      tipo === 'entidade'
        ? 'la.entidade_id IS NOT NULL'
        : 'la.clinica_id IS NOT NULL AND la.entidade_id IS NULL';

    const entidadeFilter =
      tipo === 'entidade' && entidadeId
        ? `AND la.entidade_id = ${entidadeId}`
        : '';

    // CTE: avaliações liberadas (criado_em) e concluídas (envio) por dia — datas independentes
    const sql = `
      WITH liberadas AS (
        SELECT
          DATE(a.criado_em AT TIME ZONE 'America/Sao_Paulo') AS data,
          COUNT(*)                                            AS total
        FROM avaliacoes a
        INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
        WHERE
          a.criado_em >= NOW() - ($1 * INTERVAL '1 day')
          AND ${tipoFilter}
          ${entidadeFilter}
        GROUP BY 1
      ),
      concluidas AS (
        SELECT
          DATE(a.envio AT TIME ZONE 'America/Sao_Paulo') AS data,
          COUNT(*)                                        AS total
        FROM avaliacoes a
        INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
        WHERE
          a.envio IS NOT NULL
          AND a.status = 'concluida'
          AND a.envio >= NOW() - ($1 * INTERVAL '1 day')
          AND ${tipoFilter}
          ${entidadeFilter}
        GROUP BY 1
      ),
      inativadas AS (
        SELECT
          DATE(a.inativada_em AT TIME ZONE 'America/Sao_Paulo') AS data,
          COUNT(*)                                               AS total
        FROM avaliacoes a
        INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
        WHERE
          a.inativada_em IS NOT NULL
          AND a.status = 'inativada'
          AND a.inativada_em >= NOW() - ($1 * INTERVAL '1 day')
          AND ${tipoFilter}
          ${entidadeFilter}
        GROUP BY 1
      ),
      todas_datas AS (
        SELECT data FROM liberadas
        UNION
        SELECT data FROM concluidas
        UNION
        SELECT data FROM inativadas
      )
      SELECT
        d.data,
        COALESCE(l.total, 0) AS liberadas,
        COALESCE(c.total, 0) AS concluidas,
        COALESCE(i.total, 0) AS inativadas
      FROM todas_datas d
      LEFT JOIN liberadas  l USING (data)
      LEFT JOIN concluidas c USING (data)
      LEFT JOIN inativadas i USING (data)
      ORDER BY d.data DESC
    `;

    const result = await query(sql, [dias], session);

    const dados = result.rows.map((row) => {
      const liberadas = parseInt(String(row.liberadas), 10) || 0;
      const concluidas = parseInt(String(row.concluidas), 10) || 0;
      const inativadas = parseInt(String(row.inativadas), 10) || 0;
      const taxa =
        liberadas > 0 ? Math.round((concluidas / liberadas) * 100) : 0;

      return {
        data:
          row.data instanceof Date
            ? row.data.toISOString().split('T')[0]
            : String(row.data),
        liberadas,
        concluidas,
        inativadas,
        taxa,
      };
    });

    // Lista de entidades com avaliações no período (para o filtro no frontend)
    let entidades: { id: number; nome: string }[] = [];
    if (tipo === 'entidade') {
      const entResult = await query(
        `SELECT DISTINCT t.id, t.nome
         FROM tomadores t
         INNER JOIN lotes_avaliacao la ON la.entidade_id = t.id
         INNER JOIN avaliacoes a ON a.lote_id = la.id
         WHERE a.criado_em >= NOW() - ($1 * INTERVAL '1 day')
         ORDER BY t.nome`,
        [dias],
        session
      );
      entidades = entResult.rows.map((r) => ({
        id: parseInt(String(r.id), 10),
        nome: String(r.nome),
      }));
    }

    return NextResponse.json({
      success: true,
      dados,
      entidades,
      periodo_dias: dias,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('[GET /api/admin/volume]', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
