import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/reprocessar
 *
 * Adiciona lote à fila de emissão para reprocessamento
 * Só funciona se:
 * - Lote está concluído
 * - Não há laudo enviado
 * - Não está em processamento
 */
export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.EMISSOR, ROLES.ADMIN]);

    const loteId = parseInt(params.loteId, 10);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Verificar estado do lote
    const loteResult = await query(
      `
      SELECT 
        id, status, codigo, tomador_id
      FROM lotes_avaliacao
      WHERE id = $1
    `,
      [loteId],
      session ?? undefined
    );

    if (!loteResult.rows || loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Validar que lote está concluído
    if (lote.status !== 'concluido') {
      return NextResponse.json(
        { error: `Lote não está concluído (status: ${lote.status})` },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo
    const laudoExistenteResult = await query(
      `
      SELECT id FROM laudos 
      WHERE lote_id = $1 AND status = 'enviado'
    `,
      [loteId],
      session ?? undefined
    );

    if (laudoExistenteResult.rows && laudoExistenteResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Laudo já foi enviado para este lote' },
        { status: 400 }
      );
    }

    // Verificar se já foi solicitada emissão (usando auditoria_laudos)
    const filaResult = await query(
      `
      SELECT id, tentativas FROM auditoria_laudos
      WHERE lote_id = $1 AND acao = 'solicitar_emissao' AND status IN ('pendente', 'reprocessando')
      ORDER BY criado_em DESC
      LIMIT 1
    `,
      [loteId],
      session ?? undefined
    );

    if (filaResult.rows && filaResult.rows.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Lote já está na fila de processamento',
          na_fila: true,
        },
        { status: 200 }
      );
    }

    // Adicionar à fila de emissão (usando auditoria_laudos)
    const filaInsertResult = await query(
      `
      INSERT INTO auditoria_laudos (lote_id, acao, status, tentativas, solicitado_por, tipo_solicitante, criado_em)
      VALUES ($1, 'solicitar_emissao', 'reprocessando', 0, $2, 'emissor', NOW())
      RETURNING id
    `,
      [loteId, session.cpf],
      session ?? undefined
    );

    const filaItemId =
      filaInsertResult.rows && filaInsertResult.rows[0]
        ? filaInsertResult.rows[0].id
        : null;

    // Registrar auditoria (seguindo formato esperado pelos testes)
    await query(
      `
      INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data)
      VALUES ('laudo_reprocessamento_solicitado', 'lotes_avaliacao', $1, $2, $3, $4)
    `,
      [
        String(loteId),
        session.cpf,
        session.perfil,
        JSON.stringify({ lote_id: lote.id }),
      ],
      session ?? undefined
    );

    console.log(
      `[REPROCESSAR] Lote ${loteId} adicionado à fila por ${session.cpf} (${session.nome})`
    );

    return NextResponse.json({
      success: true,
      message: 'Reprocessamento solicitado',
      lote: { id: loteId },
      fila_item_id: filaItemId,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[REPROCESSAR] Erro ao adicionar lote à fila:', error);

    return NextResponse.json(
      {
        error: 'Erro ao solicitar reprocessamento',
        detalhes: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
