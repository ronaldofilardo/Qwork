#!/usr/bin/env node
// Script: apply-migration-1140.cjs
// Aplica migration 1140 em dev (nr-bps_db) e test (nr-bps_db_test) e verifica resultado

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const baseUrl =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';
if (!baseUrl) {
  console.error(
    'LOCAL_DATABASE_URL / DATABASE_URL não encontrada no .env.local'
  );
  process.exit(1);
}

const sqlFile = path.join(
  __dirname,
  '../database/migrations/1140b_recalcular_lotes_stuck_70_porcento.sql'
);
const sql = fs.readFileSync(sqlFile, 'utf8');

async function applyToDb(dbName) {
  const dbUrl = baseUrl.includes('nr-bps_db')
    ? baseUrl.replace(/nr-bps_db(_test)?/, dbName)
    : baseUrl;

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('\n=== Aplicando em: ' + dbName + ' ===');
  try {
    await client.query(sql);
    console.log('[OK] Migration aplicada com sucesso');

    // Verificar lotes que foram corrigidos
    const res = await client.query(
      "SELECT id, status FROM lotes_avaliacao WHERE status = 'concluido' ORDER BY id DESC LIMIT 10"
    );
    console.log(
      '[INFO] Lotes com status=concluido (recentes):',
      res.rows.map((r) => '#' + r.id).join(', ') || 'nenhum'
    );

    // Verificar especificamente o lote 46
    const lote46 = await client.query(
      'SELECT id, status FROM lotes_avaliacao WHERE id = 46'
    );
    if (lote46.rows.length > 0) {
      console.log('[INFO] Lote #46 status:', lote46.rows[0].status);
    }
  } catch (e) {
    console.error('[ERRO]', e.message);
  } finally {
    await client.end();
  }
}

(async () => {
  await applyToDb('nr-bps_db');
  await applyToDb('nr-bps_db_test');
  console.log('\n=== Concluído ===');
})();
