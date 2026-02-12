import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { StatusAvaliacao } from '@/lib/types/avaliacao-status';
import { StatusLote } from '@/lib/types/lote-status';

export const dynamic = 'force-dynamic';
async function updateLotesStatus(cpf: string, session: any) {
  // Buscar lotes que têm avaliações deste funcionário
  const lotesResult = await query(
    `
    SELECT DISTINCT la.id, la.status
    FROM lotes_avaliacao la
    JOIN avaliacoes a ON la.id = a.lote_id
    WHERE a.funcionario_cpf = $1
  `,
    [cpf],
    session
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
      [StatusAvaliacao.INATIVADA, StatusAvaliacao.CONCLUIDA, lote.id],
      session
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
      ], session);
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

async function handleStatusUpdate(request: NextRequest) {
  try {
    const session = await requireRole('rh');
    const body = await request.json();
    const { cpf, ativo, empresa_id: empresaId } = body;

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

    // Se empresa_id não foi fornecida, buscar pela clínica apenas
    let funcResult;
    if (empresaId) {
      // Verificar se funcionário existe e pertence à empresa/clínica específica
      funcResult = await query(
        `SELECT f.cpf, f.ativo 
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
         WHERE f.cpf = $1 AND fc.empresa_id = $2 AND fc.clinica_id = $3 AND fc.ativo = true`,
        [cpf, empresaId, clinicaId],
        session
      );
    } else {
      // Buscar funcionário pela clínica apenas (qualquer empresa da clínica)
      funcResult = await query(
        `SELECT f.cpf, f.ativo 
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
         WHERE f.cpf = $1 AND fc.clinica_id = $2 AND fc.ativo = true`,
        [cpf, clinicaId],
        session
      );
    }

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

    // Atualizar status do funcionário (com session para auditoria)
    await query('UPDATE funcionarios SET ativo = $1 WHERE cpf = $2', [
      ativo,
      cpf,
    ], session);

    // Atualizar status das avaliações baseado no status do funcionário
    if (!ativo) {
      // Desligando da empresa: marcar avaliações não concluídas como 'inativada' (concluídas permanecem)
      // Nota: verifica both 'concluida' e 'concluido' para retrocompatibilidade
      const updateResult = await query(
        "UPDATE avaliacoes SET status = $1 WHERE funcionario_cpf = $2 AND status != 'concluida' AND status != 'concluido' RETURNING id, status",
        [StatusAvaliacao.INATIVADA, cpf],
        session
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
    await updateLotesStatus(cpf, session);

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

export async function PUT(request: NextRequest) {
  return handleStatusUpdate(request);
}

export async function PATCH(request: NextRequest) {
  return handleStatusUpdate(request);
}
