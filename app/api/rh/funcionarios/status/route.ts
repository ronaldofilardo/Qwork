import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { StatusAvaliacao } from '@/lib/types/avaliacao-status';
import { StatusLote } from '@/lib/types/lote-status';

export const dynamic = 'force-dynamic';
async function updateLotesStatus(cpf: string) {
  // Buscar lotes que têm avaliações deste funcionário
  const lotesResult = await query(
    `
    SELECT DISTINCT la.id, la.status
    FROM lotes_avaliacao la
    JOIN avaliacoes a ON la.id = a.lote_id
    WHERE a.funcionario_cpf = $1
  `,
    [cpf]
  );

  console.log(
    `[INFO] Atualizando ${lotesResult.rowCount} lotes afetados pelo funcionário ${cpf}`
  );

  for (const lote of lotesResult.rows) {
    // Recalcular status do lote baseado nas avaliações ativas (não inativadas)
    const statsResult = await query(
      `
      SELECT
        COUNT(*) FILTER (WHERE a.status != $1) as ativas,
        COUNT(*) FILTER (WHERE a.status = $2) as concluidas
      FROM avaliacoes a
      WHERE a.lote_id = $3
    `,
      [StatusAvaliacao.INATIVADA, StatusAvaliacao.CONCLUIDA, lote.id]
    );

    const { ativas, concluidas } = statsResult.rows[0];
    const ativasNum = parseInt(ativas) || 0;
    const concluidasNum = parseInt(concluidas) || 0;

    console.log(
      `[DEBUG] Lote ${lote.id}: ${ativasNum} ativas, ${concluidasNum} concluídas, status atual: ${lote.status}`
    );

    // Não alterar status manuais (cancelado, finalizado)
    if ([StatusLote.CANCELADO, StatusLote.FINALIZADO].includes(lote.status)) {
      console.log(
        `[INFO] Lote ${lote.id} possui status manual '${lote.status}', não será alterado`
      );
      continue;
    }

    // Calcular novo status baseado nas avaliações
    let novoStatus = StatusLote.ATIVO;
    if (ativasNum === 0) {
      novoStatus = StatusLote.RASCUNHO; // Nenhuma avaliação ativa
    } else if (concluidasNum === ativasNum) {
      novoStatus = StatusLote.CONCLUIDO; // Todas concluídas
    }

    if (novoStatus !== lote.status) {
      // Atualizar status do lote
      await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
        novoStatus,
        lote.id,
      ]);
      console.log(
        `[INFO] Lote ${lote.id} alterado de '${lote.status}' para '${novoStatus}'`
      );

      if (novoStatus === StatusLote.CONCLUIDO) {
        console.log(
          `[INFO] Lote ${lote.id} está concluído e pronto para solicitação de emissão manual`
        );
      }
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole('rh');
    const { cpf, ativo } = await request.json();

    if (!cpf || typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'CPF e status ativo são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter clínica do RH da sessão
    const clinicaId = session.clinica_id;
    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 500 }
      );
    }

    // Verificar se funcionário existe e pertence à clínica
    const funcResult = await query(
      'SELECT cpf, ativo FROM funcionarios WHERE cpf = $1 AND clinica_id = $2',
      [cpf, clinicaId]
    );

    if (funcResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou não pertence à sua clínica' },
        { status: 404 }
      );
    }

    const statusAtual = funcResult.rows[0].ativo;

    // Se já está no status desejado, não fazer nada
    if (statusAtual === ativo) {
      return NextResponse.json({
        success: true,
        message: 'Status já está atualizado',
      });
    }

    // Atualizar status do funcionário
    await query('UPDATE funcionarios SET ativo = $1 WHERE cpf = $2', [
      ativo,
      cpf,
    ]);

    // Atualizar status das avaliações baseado no status do funcionário
    if (!ativo) {
      // Desligando da empresa: marcar avaliações não concluídas como 'inativada' (concluídas permanecem)
      // Nota: verifica both 'concluida' e 'concluido' para retrocompatibilidade
      const updateResult = await query(
        "UPDATE avaliacoes SET status = $1 WHERE funcionario_cpf = $2 AND status != 'concluida' AND status != 'concluido' RETURNING id, status",
        [StatusAvaliacao.INATIVADA, cpf]
      );
      console.log(
        `[INFO] Inativadas ${updateResult.rowCount} avaliações do funcionário ${cpf}`
      );
      if (updateResult.rowCount > 0) {
        console.log('[DEBUG] Avaliações inativadas:', updateResult.rows);
      }
    }
    // Reativando: não há necessidade de alterar, pois concluídas já estão corretas e outras permanecem inativadas

    // Atualizar status dos lotes afetados
    await updateLotesStatus(cpf);

    return NextResponse.json({
      success: true,
      message: ativo
        ? 'Funcionário reativado com sucesso. Ele voltará a receber novos lotes de avaliação.'
        : 'Funcionário desligado da empresa. Avaliações não concluídas foram marcadas como inativadas, mas seus dados e histórico foram preservados.',
    });
  } catch (error) {
    console.error('Erro ao atualizar status do funcionário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
