import { query } from '../lib/db';

async function forceFix() {
  try {
    console.log('[FORCE-FIX] Verificando estado atual...');

    const maxId = await query('SELECT MAX(id) as max_id FROM lotes_avaliacao');
    const currentMax = maxId.rows[0].max_id;
    console.log(`[FORCE-FIX] MAX(id) atual: ${currentMax}`);

    const seqBefore = await query(
      'SELECT last_value, is_called FROM lotes_avaliacao_id_seq'
    );
    console.log('[FORCE-FIX] Sequence antes:', seqBefore.rows[0]);

    // Forçar sequence para currentMax (com is_called=true)
    // Isso fará o próximo nextval retornar currentMax + 1
    await query(`SELECT setval('lotes_avaliacao_id_seq', $1, true)`, [
      currentMax,
    ]);
    console.log(
      `[FORCE-FIX] Sequence setada para ${currentMax} com is_called=true`
    );

    const seqAfter = await query(
      'SELECT last_value, is_called FROM lotes_avaliacao_id_seq'
    );
    console.log('[FORCE-FIX] Sequence depois:', seqAfter.rows[0]);

    // Testar qual será o próximo valor SEM consumir
    const testNext = await query(
      "SELECT nextval('lotes_avaliacao_id_seq') as next_id"
    );
    console.log(
      '[FORCE-FIX] Próximo valor (teste): ',
      testNext.rows[0].next_id
    );

    // Voltar um passo pois consumimos o valor no teste
    await query(`SELECT setval('lotes_avaliacao_id_seq', $1, true)`, [
      currentMax,
    ]);

    console.log('[FORCE-FIX] ✅ Sequence definitivamente corrigida!');
    console.log(
      `[FORCE-FIX] Próximo INSERT receberá ID: ${parseInt(currentMax) + 1}`
    );
  } catch (error) {
    console.error('[FORCE-FIX] ❌ Erro:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

forceFix();
