import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset
 * Reset (clear) all responses for a single evaluation within a batch
 *
 * Requirements:
 * - User must be gestor from same entidade
 * - Batch must NOT be concluded, sent to emissor, or have laudo
 * - Evaluation must belong to the batch
 * - Only ONE reset per evaluation per batch allowed
 * - Mandatory reason required
 *
 * Response: After reset, evaluation becomes immediately available for employee to answer again
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string; avaliacaoId: string } }
) {
  try {
    const user = await requireAuth();
    if (!user || user.perfil !== 'gestor') {
      return NextResponse.json(
        { error: 'Acesso negado', success: false },
        { status: 403 }
      );
    }

    const loteId = params.id;
    const avaliacaoId = params.avaliacaoId;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body inválido', success: false },
        { status: 422 }
      );
    }

    const { reason } = body;

    // Validate mandatory reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        {
          error: 'Motivo é obrigatório e deve ter pelo menos 5 caracteres',
          success: false,
        },
        { status: 422 }
      );
    }

    // Start transaction
    await query('BEGIN');

    // Configurar contexto de segurança para auditoria
    await query(`SET LOCAL app.current_user_cpf = '${user.cpf}'`);
    await query(`SET LOCAL app.current_user_perfil = '${user.perfil}'`);

    try {
      // Buscar informações do lote primeiro
      const loteCheck = await query(
        `
        SELECT la.id, la.entidade_id, la.status
        FROM lotes_avaliacao la
        WHERE la.id = $1
        FOR UPDATE -- Lock to prevent concurrent operations
      `,
        [loteId]
      );

      if (loteCheck.rowCount === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'Lote não encontrado',
            success: false,
          },
          { status: 404 }
        );
      }

      const lote = loteCheck.rows[0];

      // Verificar se o gestor de entidade tem acesso à entidade do lote
      if (!user.entidade_id || lote.entidade_id !== user.entidade_id) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'Você não tem permissão para resetar avaliações neste lote',
            success: false,
            error_code: 'permission_entidade_mismatch',
            hint: 'Verifique se o lote pertence à sua entidade. Caso necessário, contate o administrador.',
          },
          { status: 403 }
        );
      }

      // Validate batch status - must NOT have emission requested or laudo emitted
      // Permitir reset enquanto emissão não foi solicitada, independentemente do status

      // Verificar se a emissão do laudo foi solicitada
      const emissaoSolicitadaResult = await query(
        `SELECT COUNT(*) as count FROM v_fila_emissao WHERE lote_id = $1`,
        [loteId]
      );

      const emissaoSolicitada =
        parseInt(emissaoSolicitadaResult.rows[0].count) > 0;

      // Verificar se o lote já foi emitido
      const loteEmitidoResult = await query(
        `SELECT emitido_em FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      const loteEmitido = !!loteEmitidoResult.rows[0].emitido_em;

      // Bloquear apenas se emissão foi solicitada OU lote foi emitido (princípio da imutabilidade)
      if (emissaoSolicitada || loteEmitido) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Não é possível resetar avaliação: emissão do laudo já foi solicitada ou laudo já foi emitido (princípio da imutabilidade)',
            success: false,
            loteStatus: lote.status,
            emissaoSolicitada,
            loteEmitido,
          },
          { status: 409 }
        );
      }

      // Check if evaluation exists and belongs to batch
      const avaliacaoCheck = await query(
        `
        SELECT a.id, a.status, a.funcionario_cpf, f.nome as funcionario_nome
        FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE a.id = $1 AND a.lote_id = $2
        FOR UPDATE
      `,
        [avaliacaoId, loteId]
      );

      if (avaliacaoCheck.rowCount === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'Avaliação não encontrada neste lote',
            success: false,
          },
          { status: 404 }
        );
      }

      const _avaliacao = avaliacaoCheck.rows[0];

      // Check if evaluation was already reset (unique constraint)
      const resetCheck = await query(
        `
        SELECT id FROM avaliacao_resets
        WHERE avaliacao_id = $1 AND lote_id = $2
      `,
        [avaliacaoId, loteId]
      );

      if (resetCheck.rowCount > 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error: 'Esta avaliação já foi resetada anteriormente neste lote',
            success: false,
            resetId: resetCheck.rows[0].id,
          },
          { status: 409 }
        );
      }

      // Count responses before delete
      const countResult = await query(
        `
        SELECT COUNT(*) as count FROM respostas
        WHERE avaliacao_id = $1
      `,
        [avaliacaoId]
      );

      const respostasCount = parseInt(countResult.rows[0].count);

      // Autorizar reset (flag para trigger de imutabilidade)
      await query(`SET LOCAL app.allow_reset = true`);

      // Delete all responses (hard delete as per requirement)
      await query(
        `
        DELETE FROM respostas
        WHERE avaliacao_id = $1
      `,
        [avaliacaoId]
      );

      // Update evaluation status to iniciada (available for employee)
      await query(
        `
        UPDATE avaliacoes
        SET status = 'iniciada',
            atualizado_em = NOW()
        WHERE id = $1
      `,
        [avaliacaoId]
      );

      // Insert immutable audit record
      // Use COALESCE to handle cases where gestor is not in funcionarios table
      const auditResult = await query(
        `
        INSERT INTO avaliacao_resets (
          avaliacao_id,
          lote_id,
          requested_by_user_id,
          requested_by_role,
          reason,
          respostas_count
        )
        SELECT 
          $1,
          $2,
          COALESCE(f.id, $6),  -- Use funcionario.id if exists, otherwise use entidade_id
          'gestor',
          $3,
          $4
        FROM (SELECT $5::VARCHAR AS cpf) u
        LEFT JOIN funcionarios f ON f.cpf = u.cpf
        RETURNING id, created_at
      `,
        [
          avaliacaoId,
          loteId,
          reason.trim(),
          respostasCount,
          user.cpf,
          user.entidade_id || -1,
        ]
      );

      const resetRecord = auditResult.rows[0];

      // Commit transaction
      await query('COMMIT');

      // Log success
      console.log(
        `[RESET-AVALIACAO-ENTIDADE] Reset successful - resetId: ${resetRecord.id}, avaliacaoId: ${avaliacaoId}, loteId: ${loteId}, user: ${user.cpf}, respostas_deleted: ${respostasCount}`
      );

      return NextResponse.json({
        success: true,
        message:
          'Avaliação resetada com sucesso. O funcionário pode responder novamente.',
        resetId: resetRecord.id,
        avaliacaoId: parseInt(avaliacaoId),
        requestedBy: user.nome,
        requestedAt: resetRecord.created_at,
        respostasDeleted: respostasCount,
      });
    } catch (innerError: any) {
      await query('ROLLBACK');
      throw innerError;
    }
  } catch (error: any) {
    console.error('[RESET-AVALIACAO-ENTIDADE] Error:', error);
    return NextResponse.json(
      {
        error: 'Erro ao resetar avaliação',
        success: false,
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
