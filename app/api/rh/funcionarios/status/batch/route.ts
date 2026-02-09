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
    const { cpfs, ativo } = await request.json();

    if (
      !Array.isArray(cpfs) ||
      cpfs.length === 0 ||
      typeof ativo !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Lista de CPFs e status ativo são obrigatórios' },
        { status: 400 }
      );
    }

    // Limite de segurança: máximo 50 funcionários por operação
    if (cpfs.length > 50) {
      return NextResponse.json(
        { error: 'Operação limitada a 50 funcionários por vez' },
        { status: 400 }
      );
    }

    // Verificar se o RH pertence à mesma clínica dos funcionários
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (rhResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário RH não encontrado' },
        { status: 404 }
      );
    }

    const clinicaId = rhResult.rows[0].clinica_id;

    // Verificar se todos os funcionários existem e pertencem à clínica
    const placeholders = cpfs.map((_, i) => `$${i + 1}`).join(',');
    const funcResult = await query(
      `SELECT cpf, ativo FROM funcionarios WHERE cpf IN (${placeholders}) AND clinica_id = $${cpfs.length + 1}`,
      [...cpfs, clinicaId]
    );

    if (funcResult.rows.length !== cpfs.length) {
      return NextResponse.json(
        {
          error:
            'Um ou mais funcionários não foram encontrados ou não pertencem à sua clínica',
        },
        { status: 404 }
      );
    }

    // Filtrar apenas os que precisam ser atualizados
    const funcionariosParaAtualizar = funcResult.rows.filter(
      (func) => func.ativo !== ativo
    );

    if (funcionariosParaAtualizar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos os funcionários já estão no status desejado',
      });
    }

    // Usar transação para garantir atomicidade
    await query('BEGIN');

    try {
      // Atualizar status dos funcionários
      const updatePlaceholders = funcionariosParaAtualizar
        .map((_, i) => `$${i + 1}`)
        .join(',');
      await query(
        `UPDATE funcionarios SET ativo = $${funcionariosParaAtualizar.length + 1} WHERE cpf IN (${updatePlaceholders})`,
        [...funcionariosParaAtualizar.map((f) => f.cpf), ativo]
      );

      // Para cada funcionário desativado, marcar avaliações como inativadas
      if (!ativo) {
        for (const func of funcionariosParaAtualizar) {
          const updateResult = await query(
            'UPDATE avaliacoes SET status = $1 WHERE funcionario_cpf = $2 AND status != $3 RETURNING id',
            [StatusAvaliacao.INATIVADA, func.cpf, StatusAvaliacao.CONCLUIDA]
          );
          console.log(
            `[INFO] Inativadas ${updateResult.rowCount} avaliações do funcionário ${func.cpf}`
          );
        }
      }

      // Atualizar status dos lotes afetados para cada funcionário
      for (const func of funcionariosParaAtualizar) {
        await updateLotesStatus(func.cpf);
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: ativo
          ? `${funcionariosParaAtualizar.length} funcionário(s) reativado(s) com sucesso.`
          : `${funcionariosParaAtualizar.length} funcionário(s) desligado(s) da empresa. Avaliações não concluídas foram marcadas como inativadas, mas dados e histórico foram preservados.`,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro na operação em lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
