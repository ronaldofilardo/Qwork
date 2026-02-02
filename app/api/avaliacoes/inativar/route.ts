import { requireAuth } from '@/lib/session';
import { query, transaction } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API: Inativar Avaliação com Validação de Consecutividade
 * POST /api/avaliacoes/inativar
 *
 * Valida se a avaliação pode ser inativada (impede 2ª consecutiva)
 * Requer justificativa obrigatória
 * Registra log de auditoria
 */
export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Apenas RH, Admin e Gestor Entidade podem inativar
    if (!['rh', 'admin', 'gestor_entidade'].includes(user.perfil)) {
      return NextResponse.json(
        {
          error:
            'Acesso negado. Apenas RH, Admin e Gestores podem inativar avaliações.',
        },
        { status: 403 }
      );
    }

    const { avaliacao_id, motivo, forcar = false } = await req.json();

    // Validar parâmetros
    if (!avaliacao_id) {
      return NextResponse.json(
        { error: 'ID da avaliação é obrigatório' },
        { status: 400 }
      );
    }

    if (!motivo || motivo.trim().length < 10) {
      return NextResponse.json(
        { error: 'Motivo da inativação é obrigatório (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }

    // Buscar dados da avaliação
    const avaliacaoResult = await query(
      `SELECT 
        a.id, 
        a.funcionario_cpf, 
        a.lote_id,
        a.status,
        f.nome AS funcionario_nome,
        la.codigo AS lote_codigo,
        la.numero_ordem AS lote_ordem,
        la.emitido_em
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.id = $1`,
      [avaliacao_id]
    );

    if (avaliacaoResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0];

    // Verificar se já está inativada
    if (avaliacao.status === 'inativada') {
      return NextResponse.json(
        { error: 'Esta avaliação já está inativada' },
        { status: 400 }
      );
    }

    // Bloquear inativação se lote já foi emitido (laudos gerados → imutabilidade)
    if (avaliacao.emitido_em) {
      return NextResponse.json(
        {
          error:
            'Não é possível inativar avaliações de lote já emitido — laudo gerado e avaliações são imutáveis',
        },
        { status: 400 }
      );
    }

    // Verificar se pode inativar (consecutividade)
    let validacao;
    if (avaliacao.lote_id) {
      const validacaoResult = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [avaliacao.funcionario_cpf, avaliacao.lote_id]
      );

      if (validacaoResult.rowCount > 0) {
        validacao = validacaoResult.rows[0];
      }
    }

    // Se não permitido e não está forçando, retornar erro com detalhes
    if (validacao && !validacao.permitido && !forcar) {
      return NextResponse.json(
        {
          error: 'Inativação bloqueada',
          permitido: false,
          motivo: validacao.motivo,
          total_inativacoes_consecutivas:
            validacao.total_inativacoes_consecutivas,
          ultima_inativacao_lote: validacao.ultima_inativacao_lote,
          funcionario: {
            cpf: avaliacao.funcionario_cpf,
            nome: avaliacao.funcionario_nome,
          },
          avaliacao: {
            id: avaliacao.id,
            lote_codigo: avaliacao.lote_codigo,
            lote_ordem: avaliacao.lote_ordem,
          },
          pode_forcar: true,
          mensagem_forcing:
            'Se você realmente precisa inativar esta avaliação por motivo excepcional (ex: licença médica, afastamento), confirme com "forcar: true" e forneça justificativa detalhada.',
        },
        { status: 400 }
      );
    }

    // Se está forçando, exigir justificativa mais detalhada
    if (forcar && motivo.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            'Para forçar inativação consecutiva, o motivo deve ter no mínimo 50 caracteres explicando a situação excepcional.',
        },
        { status: 400 }
      );
    }

    // Verificar se a avaliação ainda pode ser inativada (evitar condições de corrida)
    const verificacaoFinal = await query(
      `SELECT status FROM avaliacoes WHERE id = $1`,
      [avaliacao_id]
    );

    if (verificacaoFinal.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    if (verificacaoFinal.rows[0].status === 'inativada') {
      return NextResponse.json(
        { error: 'Esta avaliação já foi inativada' },
        { status: 400 }
      );
    }

    // Inativar a avaliação com validação adicional
    let result;
    try {
      // Criar objeto de sessão para o contexto da transação
      const _session = {
        cpf: user.cpf,
        perfil: user.perfil,
        clinica_id: user.clinica_id || null,
      };

      // Executar UPDATE dentro de uma transação com contexto de sessão
      result = await transaction(
        async (txClient) => {
          return await txClient.query(
            `UPDATE avaliacoes
           SET status = 'inativada',
               motivo_inativacao = $2,
               inativada_em = NOW(),
               atualizado_em = NOW()
           WHERE id = $1 AND status != 'inativada'`,
            [avaliacao_id, motivo.trim()]
          );
        },
        {
          cpf: user.cpf,
          perfil: user.perfil,
          nome: user.cpf,
          clinica_id: user.clinica_id,
        }
      );
    } catch (dbErr: any) {
      console.error('Erro ao executar UPDATE avaliacoes:', dbErr);
      // Checar erro de constraint que indica problema de integridade (ex: clinica/contratante)
      if (dbErr && dbErr.code === '23514') {
        // Constraint violation - retornar mensagem mais amigável
        return NextResponse.json(
          {
            error:
              'Falha ao inativar avaliação por violação de integridade: possível inconsistência de vínculo do funcionário (clinica/entidade). Contate o suporte.',
            detalhe: dbErr.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Falha ao inativar avaliação (erro de banco de dados)' },
        { status: 500 }
      );
    }

    // Verificar se a atualização realmente ocorreu
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Falha ao inativar avaliação - pode já ter sido processada' },
        { status: 409 }
      );
    }

    // Registrar log de auditoria
    const tipoAcao = forcar ? 'INATIVACAO_FORCADA' : 'INATIVACAO_NORMAL';
    const descricaoAuditoria = forcar
      ? `Inativação FORÇADA de avaliação consecutiva. Funcionário: ${avaliacao.funcionario_nome} (${avaliacao.funcionario_cpf}). Lote: ${avaliacao.lote_codigo}. Motivo: ${motivo}. Validação: ${validacao?.motivo || 'N/A'}`
      : `Inativação de avaliação. Funcionário: ${avaliacao.funcionario_nome} (${avaliacao.funcionario_cpf}). Lote: ${avaliacao.lote_codigo}. Motivo: ${motivo}`;

    await query(
      `INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, details)
       VALUES ($1, $2, $3, 'avaliacoes', $4, $5)`,
      [
        user.cpf,
        user.perfil,
        tipoAcao,
        avaliacao_id.toString(),
        descricaoAuditoria,
      ]
    );

    // Recalcular status do lote (garantir consistência imediata)
    let loteUpdateInfo: { novoStatus?: string; loteFinalizado?: boolean } = {};
    try {
      const { recalcularStatusLotePorId } = await import('@/lib/lotes');
      const recalcResult = await recalcularStatusLotePorId(avaliacao.lote_id);
      loteUpdateInfo = {
        novoStatus: recalcResult.novoStatus,
        loteFinalizado: recalcResult.loteFinalizado,
      };
    } catch (err) {
      console.error(
        '[WARN] Falha ao recalcular status do lote após inativação:',
        err
      );
    }

    // Preparar mensagem de retorno com info sobre lote
    let mensagem = forcar
      ? 'Avaliação inativada com sucesso (FORÇADA). O funcionário deve ser incluído no próximo lote obrigatoriamente.'
      : 'Avaliação inativada com sucesso';

    if (
      loteUpdateInfo.novoStatus === 'concluido' &&
      loteUpdateInfo.loteFinalizado
    ) {
      mensagem =
        'Avaliação inativada com sucesso. Como era a última avaliação não concluída, o lote foi automaticamente concluído e agendado para emissão!';
    } else if (loteUpdateInfo.novoStatus === 'cancelado') {
      mensagem =
        'Avaliação inativada com sucesso. Como todas as avaliações do lote estão inativadas, o lote foi cancelado automaticamente.';
    }

    return NextResponse.json(
      {
        success: true,
        message: mensagem,
        avaliacao_id,
        funcionario: {
          cpf: avaliacao.funcionario_cpf,
          nome: avaliacao.funcionario_nome,
        },
        lote: {
          codigo: avaliacao.lote_codigo,
          ordem: avaliacao.lote_ordem,
          novoStatus: loteUpdateInfo.novoStatus || null,
        },
        forcado: forcar,
        motivo,
        auditoria: {
          tipo: tipoAcao,
          usuario: user.cpf,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao inativar avaliação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar inativação' },
      { status: 500 }
    );
  }
}

/**
 * GET: Verificar se avaliação pode ser inativada (pré-validação)
 * GET /api/avaliacoes/inativar?avaliacao_id=123
 */
export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    if (!['rh', 'admin', 'gestor_entidade'].includes(user.perfil)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const avaliacao_id = searchParams.get('avaliacao_id');

    if (!avaliacao_id) {
      return NextResponse.json(
        { error: 'ID da avaliação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados da avaliação
    const avaliacaoResult = await query(
      `SELECT 
        a.id, 
        a.funcionario_cpf, 
        a.lote_id,
        a.status,
        f.nome AS funcionario_nome,
        f.indice_avaliacao,
        la.codigo AS lote_codigo,
        la.numero_ordem AS lote_ordem,
        la.emitido_em
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      LEFT JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.id = $1`,
      [avaliacao_id]
    );

    if (avaliacaoResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0];

    // Verificar consecutividade se tiver lote
    let validacao: {
      permitido: boolean;
      motivo: string;
      total_inativacoes_consecutivas?: number;
      ultima_inativacao_lote?: string;
    } = { permitido: true, motivo: 'Nenhuma restrição encontrada' };

    if (avaliacao.lote_id) {
      const validacaoResult = await query(
        `SELECT * FROM verificar_inativacao_consecutiva($1, $2)`,
        [avaliacao.funcionario_cpf, avaliacao.lote_id]
      );

      if (validacaoResult.rowCount > 0) {
        validacao = validacaoResult.rows[0];
      }
    }

    // Bloquear definitivamente quando o lote já foi emitido (laudo gerado)
    if (avaliacao.emitido_em) {
      validacao = {
        permitido: false,
        motivo:
          'O laudo deste lote já foi emitido. Após emissão, as avaliações são imutáveis para preservar integridade do laudo.',
        ultima_inativacao_lote: null,
      };
    }

    // Verificar se é prioridade alta (baseado no índice de avaliação)
    let prioridade_alta = false;
    let aviso_prioridade = null;

    if (
      avaliacao.indice_avaliacao !== null &&
      avaliacao.indice_avaliacao !== undefined
    ) {
      // Buscar o lote atual máximo da empresa
      const loteMaxResult = await query(
        `SELECT MAX(numero_ordem) as max_ordem 
         FROM lotes_avaliacao la
         JOIN funcionarios f ON la.empresa_id = f.empresa_id
         WHERE f.cpf = $1`,
        [avaliacao.funcionario_cpf]
      );

      if (loteMaxResult.rowCount > 0 && loteMaxResult.rows[0].max_ordem) {
        const lote_atual_max = loteMaxResult.rows[0].max_ordem;
        const diferenca_lotes = lote_atual_max - avaliacao.indice_avaliacao;

        // Prioridade ALTA se diferença > 5 lotes (mais de 5 lotes sem avaliação)
        prioridade_alta = diferenca_lotes > 5;

        if (prioridade_alta) {
          aviso_prioridade =
            `⚠️ Esta avaliação é de PRIORIDADE ALTA!\n\n` +
            `O funcionário não faz avaliação há ${diferenca_lotes} lotes ` +
            `(último lote: ${avaliacao.indice_avaliacao}, lote atual: ${lote_atual_max}).\n\n` +
            `Isso indica que o funcionário precisa urgentemente fazer esta avaliação. ` +
            `Considere se há impossibilidade real (ex: licença médica, afastamento) ` +
            `antes de prosseguir com a inativação.`;
        }
      }
    }

    return NextResponse.json(
      {
        permitido: validacao.permitido,
        motivo: validacao.motivo,
        total_inativacoes_consecutivas:
          validacao.total_inativacoes_consecutivas ?? 0,
        ultima_inativacao_lote: validacao.ultima_inativacao_lote ?? null,
        pode_forcar: !validacao.permitido,
        aviso: validacao.permitido
          ? null
          : 'Esta inativação requer justificativa especial',
        prioridade_alta: prioridade_alta,
        aviso_prioridade: aviso_prioridade,
        avaliacao: {
          id: avaliacao.id,
          status: avaliacao.status,
          lote_codigo: avaliacao.lote_codigo,
          lote_ordem: avaliacao.lote_ordem,
          lote_emitido: !!avaliacao.emitido_em,
        },
        funcionario: {
          cpf: avaliacao.funcionario_cpf,
          nome: avaliacao.funcionario_nome,
          indice_avaliacao: avaliacao.indice_avaliacao,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao verificar inativação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao verificar inativação' },
      { status: 500 }
    );
  }
}
