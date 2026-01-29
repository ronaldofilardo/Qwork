import { query } from '../lib/db';

async function fixLotesSequence() {
  try {
    console.log('[FIX-SEQUENCE] Verificando último ID em lotes_avaliacao...');

    const maxIdResult = await query(
      'SELECT MAX(id) as max_id FROM lotes_avaliacao'
    );

    const maxId = maxIdResult.rows[0]?.max_id || 0;
    console.log(`[FIX-SEQUENCE] Último ID encontrado: ${maxId}`);

    // Resincronizar a sequence para o próximo valor disponível
    const nextVal = maxId + 1;
    await query(`SELECT setval('lotes_avaliacao_id_seq', $1, false)`, [
      nextVal,
    ]);

    console.log(
      `[FIX-SEQUENCE] Sequence atualizada para próximo valor: ${nextVal}`
    );

    // Verificar a sequence atual
    const seqCheck = await query(
      `SELECT last_value FROM lotes_avaliacao_id_seq`
    );

    console.log(
      `[FIX-SEQUENCE] Valor atual da sequence: ${seqCheck.rows[0].last_value}`
    );
    console.log('[FIX-SEQUENCE] ✅ Sequence corrigida com sucesso!');
  } catch (error) {
    console.error('[FIX-SEQUENCE] ❌ Erro:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

fixLotesSequence();
