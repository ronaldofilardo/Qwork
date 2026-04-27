import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import type { Session } from '@/lib/session';
import { StatusAvaliacao } from '@/lib/types/avaliacao-status';
import { StatusLote } from '@/lib/types/lote-status';

export const dynamic = 'force-dynamic';
async function updateLotesStatus(cpf: string, session: Session) {
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
      await query(
        'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
        [novoStatus, lote.id],
        session
      );
      console.log(
        `[INFO] Lote ${lote.id} alterado de '${lote.status}' para '${novoStatus}'`
      );

      if (novoStatus === StatusLote.CONCLUIDO) {
        // REMOVIDO: Emissão automática de laudo
        // pronto para solicitação de emissão manual pelo RH/Entidade
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

    // Verificar se funcionário tem vínculo com esta clínica (e empresa, se fornecida)
    // Não filtrar por ativo=true para permitir tanto ativação quanto inativação
    let funcResult;
    if (empresaId) {
      funcResult = await query(
        `SELECT f.cpf, fc.ativo as vinculo_ativo
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
         WHERE f.cpf = $1 AND fc.empresa_id = $2 AND fc.clinica_id = $3`,
        [cpf, empresaId, clinicaId],
        session
      );
    } else {
      // Buscar qualquer vínculo ativo desta clínica
      funcResult = await query(
        `SELECT f.cpf, fc.ativo as vinculo_ativo
         FROM funcionarios f
         INNER JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
         WHERE f.cpf = $1 AND fc.clinica_id = $2
         LIMIT 1`,
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

    const statusAtual = funcResult.rows[0].vinculo_ativo as boolean;

    // Se já está no status desejado, não fazer nada
    if (statusAtual === ativo) {
      return NextResponse.json({
        success: true,
        message: 'Status já está atualizado',
      });
    }

    // Atualizar funcionarios_clinicas — status segregado por empresa (não altera o registro global)
    if (empresaId) {
      await query(
        `UPDATE funcionarios_clinicas fc
         SET ativo = $1, atualizado_em = NOW()
         FROM funcionarios f
         WHERE fc.funcionario_id = f.id
           AND f.cpf = $2
           AND fc.clinica_id = $3
           AND fc.empresa_id = $4`,
        [ativo, cpf, clinicaId, empresaId],
        session
      );
    } else {
      await query(
        `UPDATE funcionarios_clinicas fc
         SET ativo = $1, atualizado_em = NOW()
         FROM funcionarios f
         WHERE fc.funcionario_id = f.id
           AND f.cpf = $2
           AND fc.clinica_id = $3`,
        [ativo, cpf, clinicaId],
        session
      );
    }

    // Atualizar avaliações escopadas pela empresa (se fornecida) ou pela clínica
    if (!ativo) {
      let updateResult;
      if (empresaId) {
        updateResult = await query(
          `UPDATE avaliacoes a
           SET status = $1
           FROM lotes_avaliacao la
           WHERE a.lote_id = la.id
             AND a.funcionario_cpf = $2
             AND la.empresa_id = $3
             AND a.status NOT IN ('concluida', 'concluido', 'inativada')
           RETURNING a.id, a.status`,
          [StatusAvaliacao.INATIVADA, cpf, empresaId],
          session
        );
      } else {
        updateResult = await query(
          `UPDATE avaliacoes a
           SET status = $1
           FROM lotes_avaliacao la
           INNER JOIN empresas_clientes ec ON la.empresa_id = ec.id
           WHERE a.lote_id = la.id
             AND a.funcionario_cpf = $2
             AND ec.clinica_id = $3
             AND a.status NOT IN ('concluida', 'concluido', 'inativada')
           RETURNING a.id, a.status`,
          [StatusAvaliacao.INATIVADA, cpf, clinicaId],
          session
        );
      }
      console.log(
        `[INFO] Inativadas ${updateResult.rowCount} avaliações do funcionário ${cpf}`
      );
    }

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
