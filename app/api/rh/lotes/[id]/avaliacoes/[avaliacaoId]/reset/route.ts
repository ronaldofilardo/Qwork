import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset
 * Reset (clear) all responses for a single evaluation within a batch
 *
 * Requirements:
 * - User must be rh from same tenant
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
    if (!user || user.perfil !== 'rh') {
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

    // Start transaction - passing user session to ensure context is set correctly
    // This prevents "app.current_user_cpf not set" errors in production with connection pooling
    try {
      // Buscar informações do lote primeiro
      const loteCheck = await query(
        `
        SELECT la.id, la.empresa_id, la.status
        FROM lotes_avaliacao la
        WHERE la.id = $1
        FOR UPDATE -- Lock to prevent concurrent operations
      `,
        [loteId],
        user
      );

      if (loteCheck.rowCount === 0) {
        return NextResponse.json(
          {
            error: 'Lote não encontrado',
            success: false,
          },
          { status: 404 }
        );
      }

      const lote = loteCheck.rows[0];

      // Usar requireRHWithEmpresaAccess para validar permissões com mapeamento de clínica
      try {
        await requireRHWithEmpresaAccess(lote.empresa_id);
      } catch {
        return NextResponse.json(
          {
            error: 'Você não tem permissão para resetar avaliações neste lote',
            success: false,
            error_code: 'permission_clinic_mismatch',
            hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
          },
          { status: 403 }
        );
      }

      // Validate batch status - must NOT have emission requested or laudo emitted
      // Permitir reset enquanto emissão não foi solicitada, independentemente do status

      // Verificar se a emissão do laudo foi solicitada
      const emissaoSolicitadaResult = await query(
        `SELECT COUNT(*) as count FROM v_fila_emissao WHERE lote_id = $1`,
        [loteId],
        user
      );

      const emissaoSolicitada =
        parseInt(emissaoSolicitadaResult.rows[0].count) > 0;

      // Verificar se o lote já foi emitido
      const loteEmitidoResult = await query(
        `SELECT emitido_em FROM lotes_avaliacao WHERE id = $1`,
        [loteId],
        user
      );

      const loteEmitido = !!loteEmitidoResult.rows[0].emitido_em;

      // Bloquear apenas se emissão foi solicitada OU lote foi emitido (princípio da imutabilidade)
      if (emissaoSolicitada || loteEmitido) {
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
        [avaliacaoId, loteId],
        user
      );

      if (avaliacaoCheck.rowCount === 0) {
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
        [avaliacaoId, loteId],
        user
      );

      if (resetCheck.rowCount > 0) {
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
        [avaliacaoId],
        user
      );

      const respostasCount = parseInt(countResult.rows[0].count);

      // Delete all responses (hard delete as per requirement)
      await query(
        `
        DELETE FROM respostas
        WHERE avaliacao_id = $1
      `,
        [avaliacaoId],
        user
      );

      // Update evaluation status to iniciada (available for employee)
      await query(
        `
        UPDATE avaliacoes
        SET status = 'iniciada',
            atualizado_em = NOW()
        WHERE id = $1
      `,
        [avaliacaoId],
        user
      );

      // Insert immutable audit record
      // Note: We temporarily disable RLS insert policy by using a function or direct INSERT with superuser context
      // For now, direct insert (assuming API has appropriate DB permissions)
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
          COALESCE(f.id, -1),  -- Use -1 if RH user is not in funcionarios table
          'rh',
          $3,
          $4
        FROM (SELECT $5::VARCHAR AS cpf) u
        LEFT JOIN funcionarios f ON f.cpf = u.cpf
        RETURNING id, created_at
      `,
        [avaliacaoId, loteId, reason.trim(), respostasCount, user.cpf],
        user
      );

      const resetRecord = auditResult.rows[0];

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
      throw innerError;
    }
  } catch (error: any) {
    console.error('[RESET-AVALIACAO] Error:', error);
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
