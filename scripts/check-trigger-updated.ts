import { loadEnv } from './load-env';
loadEnv();

import { Client } from 'pg';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const r = await client.query(
      `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'`
    );
    console.log('\n=== FUNCAO TRIGGER ATUALIZADA ===\n');
    console.log(r.rows[0]?.def || 'N/A');
    await client.end();
  } catch (err) {
    console.error('Erro:', err);
    await client.end();
    process.exit(1);
  }
})();
