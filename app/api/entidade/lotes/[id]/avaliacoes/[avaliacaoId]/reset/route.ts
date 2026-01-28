import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset
 * Reset (clear) all responses for a single evaluation within a batch
 *
 * Requirements:
 * - User must be gestor_entidade from same contratante
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
    if (!user || user.perfil !== 'gestor_entidade') {
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

    try {
      // Check batch belongs to user's contratante and get status
      // Verificar posse do lote: para gestor_entidade a autoridade vem do lote.contratante_id
      const loteCheck = await query(
        `
        SELECT la.id, la.empresa_id, la.status, la.contratante_id
        FROM lotes_avaliacao la
        WHERE la.id = $1
          AND la.contratante_id = $2
        FOR UPDATE -- Lock para evitar condições de corrida
      `,
        [loteId, user.contratante_id]
      );

      if (loteCheck.rowCount === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Lote não encontrado ou você não tem permissão para acessá-lo',
            success: false,
          },
          { status: 404 }
        );
      }

      const lote = loteCheck.rows[0];

      // Validate batch status - must NOT be concluded or sent to emissor
      const invalidStatuses = [
        'concluded',
        'concluido',
        'enviado_emissor',
        'a_emitir',
        'emitido',
      ];
      if (invalidStatuses.includes(lote.status)) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Não é possível resetar avaliação: lote já foi concluído, enviado ao emissor ou possui laudo',
            success: false,
            loteStatus: lote.status,
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

      // Determine requester_id: prefer funcionario.id when present, otherwise use contratante_id for gestor_entidade
      let requesterId: number | null = null;

      // Try to find a matching funcionario (in case this gestor is also a registered funcionario)
      const requesterQuery = await query(
        'SELECT id FROM funcionarios WHERE cpf = $1',
        [user.cpf]
      );
      if (requesterQuery.rowCount > 0) {
        requesterId = requesterQuery.rows[0].id;
      } else if (user.contratante_id) {
        // Use contratante_id as requester identifier for gestor_entidade (requested_by_role will disambiguate)
        requesterId = user.contratante_id as number;
      }

      if (!requesterId) {
        await query('ROLLBACK');
        return NextResponse.json(
          {
            error:
              'Não foi possível identificar o usuário requisitante para auditoria',
            success: false,
          },
          { status: 500 }
        );
      }

      // Insert immutable audit record
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
        VALUES ($1, $2, $3, 'gestor_entidade', $4, $5)
        RETURNING id, created_at
      `,
        [avaliacaoId, loteId, requesterId, reason.trim(), respostasCount]
      );

      const resetRecord = auditResult.rows[0];

      // Commit transaction
      await query('COMMIT');

      // Log success
      console.log(
        `[RESET-AVALIACAO] Reset successful - resetId: ${resetRecord.id}, avaliacaoId: ${avaliacaoId}, loteId: ${loteId}, user: ${user.cpf}, respostas_deleted: ${respostasCount}`
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
