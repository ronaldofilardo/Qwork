'use strict';

/**
 * Aplica migration 1023 (hierarquia_comercial) em DEV e TEST.
 * Segue o padrão do apply-migration-1022.cjs.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASES = [
  {
    name: 'DEV',
    connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  },
  {
    name: 'TEST',
    connectionString:
      (process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db_test'),
  },
];

const SQL_FILE = path.join(
  __dirname,
  '../database/migrations/1023_hierarquia_comercial.sql'
);

async function applyMigration(db) {
  console.log(`\n=== Aplicando migration 1023 em ${db.name} ===`);
  const client = new Client({ connectionString: db.connectionString });
  await client.connect();
  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    await client.query(sql);
    console.log(`✅ ${db.name}: migration 1023 aplicada com sucesso.`);
  } catch (err) {
    console.error(`❌ ${db.name}: ERRO:`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('=== Migration 1023: hierarquia_comercial ===');
  for (const db of DATABASES) {
    await applyMigration(db);
  }
  console.log('\n✅ Migration 1023 aplicada em todos os bancos.');
}

main().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
