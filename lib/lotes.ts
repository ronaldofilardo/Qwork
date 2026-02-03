/**
 * Biblioteca para gerenciamento de lotes de avaliação
 * Centraliza a lógica de recálculo de status para evitar duplicação
 */

import { query } from '@/lib/db';
import { transactionWithContext } from '@/lib/db-security';

/**
 * Recalcula o status de um lote diretamente pelo loteId (sem avaliacaoId)
 * Útil para operações que não têm contexto de uma avaliação específica
 *
 * Regras importantes (claras e imutáveis para a máquina de estados):
 * 1) Se todas as avaliações *liberadas* do lote estão inativadas => novoStatus = 'cancelado'
 * 2) Se todas as avaliações liberadas estão concluídas (ou concluidas + inativadas == liberadas) => novoStatus = 'concluido' (dispara emissão)
 * 3) Caso contrário => 'ativo'
 *
 * NÃO criar novos estados na máquina de estados; use apenas 'cancelado', 'concluido', 'ativo' (e 'emitido' quando aplicável via emissão).
 *
 * @param loteId ID do lote a ser recalculado
 * @returns Promise<{novoStatus: string, loteFinalizado: boolean}>
 */
export async function recalcularStatusLotePorId(
  loteId: number
): Promise<{ novoStatus: string; loteFinalizado: boolean }> {
  console.log(
    `[DEBUG] recalcularStatusLotePorId chamado para loteId: ${loteId}`
  );

  // Executar todo o recálculo dentro de uma transação que garante contexto RLS
  return await transactionWithContext(async (q) => {
    // Acquire advisory lock to prevent concurrent processing (transaction-scoped)
    await q('SELECT pg_advisory_xact_lock($1)', [loteId]);
    console.log(`[DEBUG] Advisory lock acquired for lote ${loteId}`);

    // Log SKIP flag for observability (helps debugging local vs prod behavior)
    console.log(
      `[INFO] SKIP_IMMEDIATE_EMISSION=${process.env.SKIP_IMMEDIATE_EMISSION || 'false'}`
    );

    // IMPORTANTE: 'iniciadas' inclui 'iniciada' E 'em_andamento' para evitar encerramento prematuro
    const statsResult = await q(
      `
      SELECT
        COUNT(a.id) as total_avaliacoes,
        COUNT(a.id) FILTER (WHERE a.status != 'inativada') as ativas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
        COUNT(a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento')) as iniciadas,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas
      FROM avaliacoes a
      WHERE a.lote_id = $1
    `,
      [loteId]
    );

    const {
      total_avaliacoes,
      ativas,
      concluidas,
      inativadas,
      iniciadas,
      liberadas,
    } = statsResult.rows[0];
    const totalAvaliacoes = parseInt(String(total_avaliacoes), 10) || 0;
    const ativasNum = parseInt(String(ativas), 10) || 0;
    const concluidasNum = parseInt(String(concluidas), 10) || 0;
    const inativadasNum = parseInt(String(inativadas), 10) || 0;
    const iniciadasNum = parseInt(String(iniciadas), 10) || 0;
    const liberadasNum = parseInt(String(liberadas), 10) || 0;

    console.log(
      `[DEBUG] Recalculando lote ${String(loteId)}: ${String(totalAvaliacoes)} total, ${String(liberadasNum)} liberadas, ${String(ativasNum)} ativas, ${String(concluidasNum)} concluídas, ${String(inativadasNum)} inativadas, ${String(iniciadasNum)} iniciadas`
    );

    // Lógica de status (precisão e precedência):
    // 1) Se todas as avaliações do lote estiverem inativadas (total) => 'cancelado'
    // 2) Se todas as avaliações *liberadas* estão inativadas e NÃO há concluídas => 'cancelado'
    // 3) Se há avaliações concluídas e (concluídas + inativadas) == liberadas => 'concluido'
    // 4) Se há concluidas > 0 ou iniciadas > 0 => 'ativo'
    // 5) Caso contrário => 'ativo'
    let novoStatus = 'ativo';

    // 1) Todas avaliações inativadas (base total)
    if (totalAvaliacoes > 0 && inativadasNum === totalAvaliacoes) {
      novoStatus = 'cancelado';
    }
    // 2) Todas as avaliações liberadas estão inativadas e não há concluídas
    else if (
      liberadasNum > 0 &&
      inativadasNum === liberadasNum &&
      concluidasNum === 0
    ) {
      novoStatus = 'cancelado';
    }
    // 3) Concluir quando existe pelo menos UMA concluida e (concluidas + inativadas == liberadas)
    else if (
      liberadasNum > 0 &&
      concluidasNum > 0 &&
      concluidasNum + inativadasNum === liberadasNum
    ) {
      novoStatus = 'concluido';
    }
    // 4) Caso padrão: ativo se há qualquer concluída ou iniciada
    else if (concluidasNum > 0 || iniciadasNum > 0) {
      novoStatus = 'ativo';
    }

    // Verificar status atual do lote
    const loteAtual = await q(
      'SELECT status FROM lotes_avaliacao WHERE id = $1',
      [loteId]
    );

    if (!loteAtual || loteAtual.rowCount === 0 || !loteAtual.rows[0]) {
      console.warn(
        `[WARN] Lote ${loteId} não encontrado na tabela lotes_avaliacao`
      );
      // Se o lote não existir, não tentamos atualizar nada
      return { novoStatus, loteFinalizado: false };
    }

    const statusAtual = loteAtual.rows[0].status;

    let loteFinalizado = false;

    // Lote já concluído - verificar se precisa notificar
    if (statusAtual === 'concluido' && novoStatus === 'concluido') {
      console.log(
        `[INFO] Lote ${loteId} já está em status 'concluido' - mantendo status`
      );
      loteFinalizado = true;
    }

    if (novoStatus !== statusAtual) {
      if (novoStatus === 'concluido') {
        // ✅ Atualizar status do lote para 'concluido'
        await q('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
          novoStatus,
          loteId,
        ]);
        console.log(
          `[INFO] Lote ${loteId} alterado para '${novoStatus}' - pronto para solicitação de emissão`
        );

        // ✅ CRIAR NOTIFICAÇÃO: Avisar RH/Entidade que lote está pronto para solicitar emissão
        try {
          // Buscar dados do lote para criar notificação contextualizada
          const loteInfo = await q(
            `SELECT la.codigo, la.liberado_por, f.perfil, la.clinica_id, la.contratante_id,
                    COUNT(a.id) as total_avaliacoes
             FROM lotes_avaliacao la
             LEFT JOIN funcionarios f ON f.cpf = la.liberado_por
             LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
             WHERE la.id = $1
             GROUP BY la.codigo, la.liberado_por, f.perfil, la.clinica_id, la.contratante_id`,
            [loteId]
          );

          if (loteInfo.rows.length > 0) {
            const lote = loteInfo.rows[0];
            const destinatarioTipo =
              lote.perfil === 'rh' ? 'gestor_entidade' : 'gestor_entidade';

            await q(
              `INSERT INTO notificacoes (
                 tipo, prioridade, destinatario_cpf, destinatario_tipo,
                 titulo, mensagem, lote_id, criado_em
               ) VALUES (
                 'lote_aguardando_solicitacao_emissao', 'alta', $1, $2,
                 'Lote Concluído - Pronto para Emissão',
                 'O lote ' || $3 || ' foi concluído com ' || $4 || ' avaliações finalizadas. Você pode solicitar a emissão do laudo.',
                 $5, NOW()
               )`,
              [
                lote.liberado_por,
                destinatarioTipo,
                lote.id,
                lote.total_avaliacoes,
                loteId,
              ]
            );

            console.log(
              `[INFO] Notificação criada para ${String(lote.liberado_por)} (${String(destinatarioTipo)}) - Lote #${String(lote.id)} concluído com ${String(lote.total_avaliacoes)} avaliações`
            );
          }
        } catch (notifErr) {
          console.error(
            `[ERROR] Erro ao criar notificação para lote ${loteId}:`,
            notifErr
          );
          // Não bloquear o fluxo principal
        }
        loteFinalizado = true;
      } else {
        await q('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
          novoStatus,
          loteId,
        ]);
        console.log(
          `[INFO] Lote ${String(loteId)} alterado de '${String(statusAtual)}' para '${String(novoStatus)}'`
        );
      }
    }

    return { novoStatus, loteFinalizado };
  });
}

/**
 * Recalcula o status de um lote baseado no estado de suas avaliações ativas
 *
 * Lógica de status:
 * - 'concluido': Quando (número de avaliações concluídas + inativadas) é igual ao total de avaliações liberadas no lote
 * - 'ativo': Há avaliações concluídas ou iniciadas/em andamento (concluidasNum > 0 || iniciadasNum > 0)
 *
 * Nota: Avaliações com status 'inativada' são contabilizadas como concluídas para efeito de finalização do lote
 * Nota: Iniciadas inclui tanto 'iniciada' quanto 'em_andamento' para evitar encerramento prematuro
 *
 * @param avaliacaoId ID da avaliação que disparou o recálculo (para log)
 * @returns Promise<void>
 */
export async function recalcularStatusLote(
  avaliacaoId: number
): Promise<{ novoStatus: string; loteFinalizado: boolean }> {
  console.log(
    `[DEBUG] recalcularStatusLote chamado para avaliacaoId: ${avaliacaoId}`
  );

  // Buscar o lote da avaliação
  const loteResult = await query(
    'SELECT lote_id FROM avaliacoes WHERE id = $1',
    [avaliacaoId]
  );
  if (loteResult.rows.length === 0) {
    console.log(`[DEBUG] Avaliação ${avaliacaoId} não encontrada`);
    return { novoStatus: 'ativo', loteFinalizado: false };
  }

  const loteId = loteResult.rows[0].lote_id;
  console.log(`[DEBUG] Lote encontrado: ${loteId}`);

  // Delegar para a versão por Id (centraliza lógica e usa advisory lock)
  return await recalcularStatusLotePorId(loteId);
}
