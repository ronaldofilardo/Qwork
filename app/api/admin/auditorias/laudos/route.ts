import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/laudos
 *
 * Retorna auditoria de laudos com informações de emissão, integridade e tomador
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        ld.id AS laudo_id,
        ld.lote_id,
        la.numero_ordem::text AS numero_lote,
        ld.status,
        ld.hash_pdf,
        ld.criado_em,
        ld.emitido_em,
        ld.enviado_em,
        ld.atualizado_em,
        c.nome AS clinica_nome,
        ec.nome AS empresa_cliente_nome,
        COALESCE(ent.nome, c.nome) AS tomador_nome,
        la.clinica_id,
        la.empresa_id,
        la.entidade_id,
        fe.solicitado_em
      FROM laudos ld
      LEFT JOIN lotes_avaliacao la ON la.id = ld.lote_id
      LEFT JOIN clinicas c ON c.id = la.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN entidades ent ON ent.id = la.entidade_id
      LEFT JOIN LATERAL (
        SELECT fe2.solicitado_em
        FROM v_fila_emissao fe2
        WHERE fe2.lote_id = ld.lote_id
        ORDER BY fe2.solicitado_em DESC NULLS LAST
        LIMIT 1
      ) fe ON true
      ORDER BY ld.lote_id DESC
      LIMIT 1000
    `);

    return NextResponse.json({
      success: true,
      laudos: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de laudos:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
