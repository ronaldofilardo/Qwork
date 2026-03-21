import { query } from '@/lib/db';
// REMOVIDO: import { emitirLaudoImediato } - não mais necessário pois emissão é manual

/**
 * Configurações para conclusão automática de lotes
 */
const CONFIG = {
  PRAZO_EMISSAO_MINUTOS: 1,
  MIN_AVALIACOES_POR_LOTE: 1,
} as const;

/**
 * Status válidos para avaliações consideradas "finalizadas"
 */
const STATUS_AVALIACOES_FINALIZADAS = ['concluida', 'inativada'] as const;

/**
 * Conclui um lote e agenda a emissão automática do laudo
 *
 * @param lote Dados do lote a ser concluído
 * @returns Promise<void>
 */
async function concluirLoteAutomaticamente(lote: {
  id: number;
  // codigo: removido
  empresa_id: number;
  clinica_id: number;
  total_avaliacoes: number;
}): Promise<void> {
  console.log(
    `[AUTO-CONCLUIR] 🔄 Concluindo lote ${lote.id} (ID: ${lote.id}) - ${lote.total_avaliacoes} avaliações`
  );

  try {
    // Verificar novamente se o lote ainda pode ser concluído (evitar condições de corrida)
    const verificacaoFinal = await query(
      `
      SELECT
        COUNT(a.id) as total,
        COUNT(CASE WHEN a.status = ANY($2) THEN 1 END) as finalizadas
      FROM avaliacoes a
      WHERE a.lote_id = $1
    `,
      [lote.id, STATUS_AVALIACOES_FINALIZADAS]
    );

    if (
      parseInt(verificacaoFinal.rows[0].total) !==
      parseInt(verificacaoFinal.rows[0].finalizadas)
    ) {
      console.log(
        `[AUTO-CONCLUIR] ⚠️ Lote ${lote.id} não pode mais ser concluído (condições mudaram)`
      );
      return;
    }

    // Calcular prazo para emissão automática
    const prazoEmissao = new Date();
    prazoEmissao.setMinutes(
      prazoEmissao.getMinutes() + CONFIG.PRAZO_EMISSAO_MINUTOS
    );

    // Concluir o lote (emissão será imediata)
    await query(
      `
      UPDATE lotes_avaliacao
      SET status = 'concluido',
          atualizado_em = NOW()
      WHERE id = $1
    `,
      [lote.id]
    );

    console.log(`[AUTO-CONCLUIR] ✅ Lote ${lote.id} concluído com sucesso`);

    // REMOVIDO: Emissão automática de laudo
    // Agora o laudo só é emitido quando o EMISSOR decidir manualmente
    // O lote fica com status='concluido' e aguarda solicitação de emissão pelo RH/Entidade
    console.log(
      `[AUTO-CONCLUIR] 📋 Lote ${lote.id} está pronto para solicitação de emissão manual pelo RH/Entidade`
    );

    // Registrar no log de auditoria
    await query(
      `
      INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        'SYSTEM',
        'system',
        'conclusao_automatica',
        'lotes_avaliacao',
        lote.id.toString(),
        `Lote ${lote.id} concluído automaticamente (${lote.total_avaliacoes} avaliações). Aguardando solicitação de emissão manual.`,
      ]
    );
  } catch (error) {
    console.error(
      `[AUTO-CONCLUIR] ❌ Erro ao concluir lote ${lote.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Função para verificar e concluir lotes automaticamente
 * quando todas as avaliações foram finalizadas
 *
 * @returns Número de lotes concluídos
 */
export async function verificarEConcluirLotesAutomaticamente(): Promise<number> {
  console.log(
    '[AUTO-CONCLUIR] 🔍 Verificando lotes que podem ser concluídos automaticamente...'
  );

  try {
    // Encontrar lotes ativos onde todas as avaliações foram finalizadas
    const lotesParaConcluir = await query(
      `
      SELECT
        la.id,
        
        la.empresa_id,
        la.clinica_id,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = ANY($2) THEN 1 END) as avaliacoes_finalizadas
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.status = 'ativo'
        AND la.id NOT IN (
          SELECT lote_id FROM laudos WHERE status IN ('emitido', 'enviado')
        )
      GROUP BY la.id,  la.empresa_id, la.clinica_id
      HAVING COUNT(a.id) >= $3
         AND COUNT(a.id) = COUNT(CASE WHEN a.status = ANY($2) THEN 1 END)
      ORDER BY la.criado_em ASC
    `,
      [STATUS_AVALIACOES_FINALIZADAS, CONFIG.MIN_AVALIACOES_POR_LOTE]
    );

    console.log(
      `[AUTO-CONCLUIR] 📊 Encontrados ${lotesParaConcluir.rows.length} lotes prontos para conclusão`
    );

    if (lotesParaConcluir.rows.length === 0) {
      console.log(
        '[AUTO-CONCLUIR] ✅ Nenhum lote precisa ser concluído no momento'
      );
      return 0;
    }

    let concluidosComSucesso = 0;

    for (const lote of lotesParaConcluir.rows) {
      try {
        await concluirLoteAutomaticamente(lote);
        concluidosComSucesso++;
      } catch (error) {
        console.error(
          `[AUTO-CONCLUIR] ❌ Falha ao concluir lote ${lote.id}:`,
          error
        );
        // Continua processando outros lotes mesmo se um falhar
      }
    }

    console.log(
      `[AUTO-CONCLUIR] 🎉 Processo concluído. ${concluidosComSucesso}/${lotesParaConcluir.rows.length} lotes foram concluídos com sucesso.`
    );
    return concluidosComSucesso;
  } catch (error) {
    console.error(
      '[AUTO-CONCLUIR] 💥 Erro crítico ao verificar lotes para conclusão:',
      error
    );
    throw error;
  }
}

/**
 * Script principal para execução via linha de comando
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  verificarEConcluirLotesAutomaticamente()
    .then((concluidos) => {
      console.log(
        `[AUTO-CONCLUIR] Processo concluído. ${concluidos} lotes foram concluídos.`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('[AUTO-CONCLUIR] Erro no processo:', error);
      process.exit(1);
    });
}
