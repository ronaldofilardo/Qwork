import { query } from '../lib/db';

async function checkLotesStatus() {
  try {
    console.log('[CHECK] Verificando lotes existentes...');

    const lotes = await query(
      'SELECT id, codigo, status FROM lotes_avaliacao ORDER BY id DESC LIMIT 10'
    );

    console.log('[CHECK] Lotes encontrados:', lotes.rows.length);
    lotes.rows.forEach((lote) => {
      console.log(`  - ID ${lote.id}: ${lote.codigo} (${lote.status})`);
    });

    console.log('\n[CHECK] Verificando sequence...');
    const seqCheck = await query(
      `SELECT last_value, is_called FROM lotes_avaliacao_id_seq`
    );

    console.log('[CHECK] Sequence:', seqCheck.rows[0]);

    const maxId = await query('SELECT MAX(id) as max_id FROM lotes_avaliacao');
    console.log('[CHECK] MAX(id) na tabela:', maxId.rows[0].max_id);

    const nextVal = await query(
      `SELECT nextval('lotes_avaliacao_id_seq') as next_id`
    );
    console.log('[CHECK] Próximo valor da sequence:', nextVal.rows[0].next_id);

    // Resetar para não consumir o valor
    await query(`SELECT setval('lotes_avaliacao_id_seq', $1, true)`, [
      maxId.rows[0].max_id,
    ]);
    console.log('[CHECK] ✅ Sequence verificada e sincronizada');
  } catch (error) {
    console.error('[CHECK] ❌ Erro:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

checkLotesStatus();
