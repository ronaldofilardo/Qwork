import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/lotes
 *
 * Retorna auditoria de lotes com estatísticas e histórico de status
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        l.id AS lote_id,
        l.numero_ordem::text AS numero_lote,
        l.clinica_id,
        l.empresa_id,
        l.entidade_id,
        l.status,
        l.tipo,
        l.liberado_por AS liberado_por_cpf,
        l.liberado_em,
        l.criado_em,
        l.atualizado_em,
        c.nome AS clinica_nome,
        COALESCE(ec.nome, ent.nome) AS empresa_nome,
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id)::int AS total_avaliacoes,
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id AND status = 'concluida')::int AS avaliacoes_concluidas,
        (
          SELECT COUNT(*)
          FROM audit_logs
          WHERE resource = 'lotes_avaliacao'
            AND resource_id = l.id::TEXT
            AND action = 'UPDATE'
        )::int AS mudancas_status
      FROM lotes_avaliacao l
      LEFT JOIN clinicas c ON c.id = l.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
      LEFT JOIN entidades ent ON ent.id = l.entidade_id
      ORDER BY l.criado_em DESC
      LIMIT 2000
    `);

    return NextResponse.json({
      success: true,
      lotes: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de lotes:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
