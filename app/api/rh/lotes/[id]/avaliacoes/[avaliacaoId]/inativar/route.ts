import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { recalcularStatusLotePorId } from '@/lib/lotes';
import { requireRHWithEmpresaAccess } from '@/lib/session';

export const dynamic = 'force-dynamic';

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
    const { motivo } = await request.json();

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Motivo é obrigatório',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validar acesso do RH à empresa do lote
    const loteCheck = await query(
      `
      SELECT la.id, la.empresa_id, la.status, la.emitido_em
      FROM lotes_avaliacao la
      WHERE la.id = $1
    `,
      [loteId]
    );

    // Bloquear operações quando lote já foi emitido
    if (loteCheck.rowCount > 0 && loteCheck.rows[0].emitido_em) {
      return NextResponse.json(
        {
          error:
            'Não é possível inativar avaliações de lote já emitido — laudo gerado e avaliações são imutáveis',
          success: false,
        },
        { status: 400 }
      );
    }

    if (loteCheck.rowCount === 0) {
      return NextResponse.json(
        {
          error: 'Lote não encontrado ou você não tem permissão para acessá-lo',
          success: false,
        },
        { status: 404 }
      );
    }

    const lote = loteCheck.rows[0];

    // Usar requireRHWithEmpresaAccess para validar permissões com mapeamento de clínica
    try {
      await requireRHWithEmpresaAccess(lote.empresa_id);
    } catch (permError) {
      console.log(
        '[DEBUG] requireRHWithEmpresaAccess falhou para inativar:',
        permError
      );
      return NextResponse.json(
        {
          error: 'Você não tem permissão para inativar avaliações neste lote',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    // Verificar se a avaliação existe e pertence ao lote
    const avaliacaoCheck = await query(
      `
      SELECT a.id, a.status, a.funcionario_cpf, f.nome as funcionario_nome
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.id = $1 AND a.lote_id = $2
    `,
      [avaliacaoId, loteId]
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

    const avaliacao = avaliacaoCheck.rows[0];

    // Verificar se a avaliação já está inativada
    if (avaliacao.status === 'inativada') {
      return NextResponse.json(
        {
          error: 'Esta avaliação já está inativada',
          success: false,
        },
        { status: 400 }
      );
    }

    // Verificar se a avaliação já está concluída
    if (avaliacao.status === 'concluida') {
      return NextResponse.json(
        {
          error: 'Não é possível inativar uma avaliação já concluída',
          success: false,
        },
        { status: 400 }
      );
    }

    // Inativar a avaliação
    await query(
      `
      UPDATE avaliacoes
      SET status = 'inativada',
          inativada_em = NOW(),
          motivo_inativacao = $2
      WHERE id = $1
    `,
      [avaliacaoId, motivo.trim()]
    );

    // Recalcular o status do lote após inativação (usando helper centralizado)
    const { novoStatus, loteFinalizado } = await recalcularStatusLotePorId(
      parseInt(loteId)
    );

    // Log da ação
    console.log(
      `[RH ${user.cpf}] Avaliação ${avaliacaoId} inativada no lote ${loteId} - Funcionário: ${avaliacao.funcionario_cpf} (${avaliacao.funcionario_nome}) - Motivo: ${motivo} - Lote status pós-inativação: ${novoStatus}${loteFinalizado ? ' - LOTE CONCLUÍDO AUTOMATICAMENTE' : ''}`
    );

    // Mensagem clara conforme novo status do lote
    let message = 'Avaliação inativada com sucesso';
    if (novoStatus === 'concluido' && loteFinalizado) {
      message =
        'Avaliação inativada com sucesso. Como era a última avaliação não concluída, o lote foi automaticamente concluído e agendado para emissão!';
    } else if (novoStatus === 'cancelado') {
      message =
        'Avaliação inativada com sucesso. Como todas as avaliações liberadas do lote ficaram inativadas, o lote foi cancelado automaticamente.';
    }

    return NextResponse.json({
      success: true,
      message,
      avaliacao: {
        id: avaliacaoId,
        funcionario_cpf: avaliacao.funcionario_cpf,
        funcionario_nome: avaliacao.funcionario_nome,
        status: 'inativada',
      },
      lote_concluido: loteFinalizado,
      lote: {
        novoStatus,
      },
    });
  } catch (error) {
    console.error('Erro ao inativar avaliação:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
}
