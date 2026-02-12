import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string; avaliacaoId: string } }
) {
  try {
    const user = getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado', success: false },
        { status: 401 }
      );
    }

    if (user.perfil !== 'gestor' && user.perfil !== 'rh') {
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

    // Validar acesso do gestor de entidade ao lote
    const loteCheck = await query(
      `
      SELECT la.id, la.entidade_id, la.clinica_id, la.status, la.emitido_em
      FROM lotes_avaliacao la
      WHERE la.id = $1
    `,
      [loteId],
      user
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

    // Verificar se a emissão do laudo foi solicitada (princípio da imutabilidade)
    const emissaoSolicitadaResult = await query(
      `SELECT COUNT(*) as count FROM v_fila_emissao WHERE lote_id = $1`,
      [loteId],
      user
    );
    const emissaoSolicitada =
      parseInt(emissaoSolicitadaResult.rows[0].count) > 0;

    // Bloquear operações quando emissão foi solicitada
    if (emissaoSolicitada) {
      return NextResponse.json(
        {
          error:
            'Não é possível inativar avaliações: emissão do laudo já foi solicitada (princípio da imutabilidade)',
          success: false,
          emissaoSolicitada: true,
        },
        { status: 400 }
      );
    }

    // Verificar se o usuário (gestor ou RH) tem acesso à entidade/clínica do lote
    const hasAccess =
      user.perfil === 'gestor'
        ? user.entidade_id && lote.entidade_id === user.entidade_id
        : user.clinica_id && lote.clinica_id === user.clinica_id;

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Você não tem permissão para inativar avaliações neste lote',
          success: false,
          error_code: 'permission_entidade_mismatch',
          hint: 'Verifique se o lote pertence à sua entidade/clínica. Caso necessário, contate o administrador.',
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

    // Permitir inativação de avaliações em qualquer status (exceto já inativadas)
    // desde que a emissão do laudo ainda não tenha sido solicitada
    // A verificação de emissão já foi feita acima

    // Inativar a avaliação (usando queryAsGestorEntidade para auditoria)
    await queryAsGestorEntidade(
      `
      UPDATE avaliacoes
      SET status = 'inativada',
          inativada_em = NOW(),
          motivo_inativacao = $2
      WHERE id = $1
    `,
      [avaliacaoId, motivo.trim()]
    );

    // Recalcular o status do lote após inativação (inline para evitar validação de funcionário)
    const statsResult = await query(
      `
      SELECT
        COUNT(a.id) as total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status != 'inativada') as ativas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas
      FROM avaliacoes a
      WHERE a.lote_id = $1
    `,
      [loteId],
      user
    );

    const { ativas, concluidas, inativadas, liberadas } = statsResult.rows[0];
    const _ativasNum = parseInt(String(ativas), 10) || 0;
    const concluidasNum = parseInt(String(concluidas), 10) || 0;
    const inativadasNum = parseInt(String(inativadas), 10) || 0;
    const liberadasNum = parseInt(String(liberadas), 10) || 0;

    // Determinar novo status do lote
    let novoStatus = 'ativo';
    let loteFinalizado = false;

    if (
      liberadasNum > 0 &&
      inativadasNum === liberadasNum &&
      concluidasNum === 0
    ) {
      novoStatus = 'cancelado';
    } else if (
      concluidasNum + inativadasNum === liberadasNum &&
      liberadasNum > 0
    ) {
      novoStatus = 'concluido';
      loteFinalizado = true;
    }

    // Atualizar status do lote se mudou
    const statusAtualResult = await query(
      'SELECT status FROM lotes_avaliacao WHERE id = $1',
      [loteId],
      user
    );
    const statusAtual = statusAtualResult.rows[0]?.status;

    if (novoStatus !== statusAtual) {
      await query(
        'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
        [novoStatus, loteId],
        user
      );
    }

    // Log da ação
    console.log(
      `[Gestor Entidade ${user.cpf}] Avaliação ${avaliacaoId} inativada no lote ${loteId} - Funcionário: ${avaliacao.funcionario_cpf} (${avaliacao.funcionario_nome}) - Motivo: ${motivo} - Lote status pós-inativação: ${novoStatus}${loteFinalizado ? ' - LOTE CONCLUÍDO AUTOMATICAMENTE' : ''}`
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
