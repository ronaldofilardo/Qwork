import { query } from '../lib/db';

async function ultimateFix() {
  try {
    console.log('[ULTIMATE-FIX] Verificando lote ID=7...');

    const lote7 = await query('SELECT * FROM lotes_avaliacao WHERE id = 7');

    if (lote7.rows.length > 0) {
      console.log('[ULTIMATE-FIX] Lote 7 encontrado:', lote7.rows[0]);
      console.log('[ULTIMATE-FIX] Status:', lote7.rows[0].status);
      console.log('[ULTIMATE-FIX] Código:', lote7.rows[0].codigo);
    }

    console.log(
      '\n[ULTIMATE-FIX] Avançando sequence para valor seguro (10)...'
    );

    // Avançar a sequence para 10, bem além do conflito
    await query(`SELECT setval('lotes_avaliacao_id_seq', 10, true)`);

    const seqCheck = await query(
      'SELECT last_value, is_called FROM lotes_avaliacao_id_seq'
    );
    console.log('[ULTIMATE-FIX] Sequence agora:', seqCheck.rows[0]);

    // Testar próximo valor
    const testNext = await query(
      `SELECT nextval('lotes_avaliacao_id_seq') as next`
    );
    console.log(
      '[ULTIMATE-FIX] Teste: próximo INSERT usará ID:',
      testNext.rows[0].next
    );

    // Voltar para 10
    await query(`SELECT setval('lotes_avaliacao_id_seq', 10, true)`);

    console.log('[ULTIMATE-FIX] ✅ Sequence avançada para 10!');
    console.log('[ULTIMATE-FIX] Próximo lote criado terá ID: 11');
  } catch (error) {
    console.error('[ULTIMATE-FIX] ❌ Erro:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

ultimateFix();
