import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/avaliacoes
 *
 * Retorna auditoria de avaliações com todas as informações
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        a.id                    AS avaliacao_id,
        a.funcionario_cpf       AS cpf,
        (l.id)::text            AS lote,
        l.liberado_em,
        a.status                AS avaliacao_status,
        a.concluida_em,
        a.criado_em,
        ec.nome                 AS empresa_nome,
        CASE
          WHEN l.entidade_id IS NOT NULL THEN ent.nome
          ELSE NULL
        END                     AS entidade_nome,
        c.nome                  AS clinica_nome
      FROM avaliacoes a
      LEFT JOIN lotes_avaliacao l   ON l.id  = a.lote_id
      LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
      LEFT JOIN clinicas c           ON c.id  = l.clinica_id
      LEFT JOIN entidades ent        ON ent.id = l.entidade_id
      ORDER BY a.criado_em DESC
      LIMIT 2000
    `);

    return NextResponse.json({
      success: true,
      avaliacoes: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de avaliações:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
