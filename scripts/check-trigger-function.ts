import { loadEnv } from './load-env';
loadEnv();

import { Client } from 'pg';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('\n=== FUNÇÃO TRIGGER ATUAL NO BANCO ===');
    const r = await client.query(
      `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'fn_reservar_id_laudo_on_lote_insert'`
    );
    console.log(r.rows[0]?.def || 'NÃO ENCONTRADA');
    await client.end();
  } catch (err) {
    console.error('Erro:', err);
    await client.end();
    process.exit(1);
  }
})();
