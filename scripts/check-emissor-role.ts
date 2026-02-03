import { loadEnv } from './load-env';
loadEnv();

import { query } from '../lib/db';

async function checkEmissor() {
  try {
    const res = await query(`SELECT id, name, display_name, description, hierarchy_level, active, created_at FROM roles WHERE name = 'emissor'`);
    console.log('Encontrados', res.rowCount, 'registros para role "emissor"');
    console.table(res.rows);
  } catch (err: any) {
    console.error('Erro ao consultar roles:', err.message || err);
    process.exit(1);
  }
}

checkEmissor().catch((e) => {
  console.error(e);
  process.exit(1);
});
