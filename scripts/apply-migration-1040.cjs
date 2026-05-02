'use strict';

/**
 * Aplica migration 1040 (reset_senha_tokens) em DEV e TEST.
 * 
 * Uso:
 *   node scripts/apply-migration-1040.cjs
 *
 * Para staging/prod, usar o script .ps1 correspondente com DATABASE_URL das Neon envs.
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
    connectionString: (process.env.TEST_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db_test'),
  },
];

const SQL_FILE = path.join(
  __dirname,
  '../database/migrations/1040_reset_senha_tokens.sql'
);

async function applyMigration(db) {
  console.log(`\n=== Aplicando migration 1040 em ${db.name} ===`);
  const client = new Client({ connectionString: db.connectionString });
  await client.connect();
  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    await client.query(sql);
    console.log(`✅ ${db.name}: migration 1040 aplicada com sucesso.`);
  } catch (err) {
    console.error(`❌ ${db.name}: ERRO:`, err.message);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('=== Migration 1040: reset_senha_tokens ===');
  for (const db of DATABASES) {
    await applyMigration(db);
  }
  console.log('\n✅ Migration 1040 aplicada em DEV e TEST.');
  console.log('⚠️  Para Staging e PROD, execute o script PowerShell:');
  console.log('   .\\scripts\\apply-migration-1040-prod.ps1');
}

main().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
