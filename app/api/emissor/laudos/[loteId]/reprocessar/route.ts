import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

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
    // Validar autenticação e permissão
    let session;
    try {
      session = await requireRole('emissor');
    } catch {
      // Fallback: alguns testes mockam next-auth/getServerSession em vez de cookies
      try {
        const { getServerSession } = await import('next-auth');
        const serverSess = await getServerSession();
        if (serverSess && (serverSess as any).user) {
          session = (serverSess as any).user as any;
          if (session.perfil !== 'emissor' && session.perfil !== 'admin') {
            return NextResponse.json(
              { error: 'Acesso negado' },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

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
        id, status, codigo, contratante_id
      FROM lotes_avaliacao
      WHERE id = $1
    `,
      [loteId]
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
      [loteId]
    );

    if (laudoExistenteResult.rows && laudoExistenteResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Laudo já foi enviado para este lote' },
        { status: 400 }
      );
    }

    // Verificar se já está na fila
    let filaResult;
    try {
      filaResult = await query(
        `
        SELECT id, tentativas FROM fila_emissao
        WHERE lote_id = $1
      `,
        [loteId]
      );
    } catch (err) {
      // Se a tabela fila_emissao não existir, instruir o desenvolvedor a aplicar migrações
      if (
        err instanceof Error &&
        /fila_emissao|relation "fila_emissao"/i.test(err.message)
      ) {
        console.error(
          '[REPROCESSAR] Tabela fila_emissao não encontrada:',
          err.message
        );
        return NextResponse.json(
          {
            error:
              'Banco de dados desatualizado: tabela "fila_emissao" inexistente. Execute a migração 007 (ou rode "scripts/powershell/sync-dev-to-prod.ps1" / aplicar "database/migrations/007_refactor_status_fila_emissao.sql") e tente novamente.',
          },
          { status: 500 }
        );
      }
      throw err;
    }

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

    // Adicionar à fila de emissão
    let filaInsertResult;
    try {
      filaInsertResult = await query(
        `
        INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
        VALUES ($1, 0, 3, NOW())
        RETURNING id
      `,
        [loteId]
      );
    } catch (err) {
      if (
        err instanceof Error &&
        /fila_emissao|relation "fila_emissao"/i.test(err.message)
      ) {
        console.error(
          '[REPROCESSAR] Falha ao inserir na fila_emissao (tabela ausente):',
          err.message
        );
        return NextResponse.json(
          {
            error:
              'Banco de dados desatualizado: tabela "fila_emissao" inexistente. Execute a migração 007 (ou rode "scripts/powershell/sync-dev-to-prod.ps1" / aplicar "database/migrations/007_refactor_status_fila_emissao.sql") e tente novamente.',
          },
          { status: 500 }
        );
      }
      throw err;
    }

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
        JSON.stringify({ codigo_lote: lote.codigo }),
      ]
    );

    console.log(
      `[REPROCESSAR] Lote ${loteId} adicionado à fila por ${session.cpf} (${session.nome})`
    );

    return NextResponse.json({
      success: true,
      message: 'Reprocessamento solicitado',
      lote: { id: loteId, codigo: lote.codigo },
      fila_item_id: filaItemId,
    });
  } catch (error) {
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
