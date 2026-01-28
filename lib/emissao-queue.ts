import { query } from './db';

export async function enqueueEmissao(loteId: number, erro?: string) {
  try {
    // Inserir ou atualizar registro na fila
    const exists = await query(
      'SELECT id, tentativas FROM emissao_queue WHERE lote_id = $1',
      [loteId]
    );
    if (exists.rowCount === 0) {
      await query(
        `INSERT INTO emissao_queue (lote_id, tentativas, ultimo_erro, proxima_execucao, criado_em, atualizado_em)
         VALUES ($1, 1, $2, NOW() + INTERVAL '1 minute', NOW(), NOW())`,
        [loteId, erro || null]
      );
    } else {
      const tentativas = exists.rows[0].tentativas + 1;
      const delayMinutes = Math.min(60, Math.pow(2, tentativas));
      await query(
        `UPDATE emissao_queue SET tentativas = $1, ultimo_erro = $2, proxima_execucao = NOW() + COALESCE(NULLIF($3, '')::interval, INTERVAL '0 minute'), atualizado_em = NOW() WHERE lote_id = $4`,
        [tentativas, erro || null, `${delayMinutes} minutes`, loteId]
      );
    }
  } catch (err) {
    console.error('[EMISSAO-QUEUE] Falha ao enfileirar emissao:', err);
  }
}

export async function processEmissionQueue(maxItems = 10) {
  try {
    const rows = await query(
      `SELECT id, lote_id, tentativas FROM emissao_queue WHERE proxima_execucao <= NOW() ORDER BY proxima_execucao ASC LIMIT $1`,
      [maxItems]
    );

    for (const r of rows.rows) {
      try {
        const { emitirLaudoImediato } = await import('./laudo-auto');
        const sucesso = await emitirLaudoImediato(r.lote_id);
        if (sucesso) {
          await query('DELETE FROM emissao_queue WHERE id = $1', [r.id]);
        } else {
          // atualizar tentativas e agendar novamente pela própria função enqueueEmissao
          await enqueueEmissao(r.lote_id, 'Falha ao reemitir (worker)');
        }
      } catch (err) {
        console.error('[EMISSAO-QUEUE] Erro processando item:', err);
        await enqueueEmissao(
          r.lote_id,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  } catch (err) {
    console.error('[EMISSAO-QUEUE] Falha ao processar fila:', err);
  }
}
