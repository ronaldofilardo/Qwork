/**
 * Aplica migration 608 em todos os 4 ambientes:
 *   DEV   → nr-bps_db       (LOCAL_DATABASE_URL)
 *   TEST  → nr-bps_db_test  (TEST_DATABASE_URL)
 *   STAG  → neondb_staging  (URL hardcoded via argv[2])
 *   PROD  → neondb_v2       (URL hardcoded via argv[2])
 *
 * Uso:
 *   node apply-608-all-envs.cjs dev
 *   node apply-608-all-envs.cjs test
 *   node apply-608-all-envs.cjs staging
 *   node apply-608-all-envs.cjs prod
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar .env.local
const envPath = path.join(__dirname, '../../..', '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const SQL_FILE = path.join(
  __dirname,
  '../../migrations/608_representantes_cadastro_leads_comercial_cpf.sql'
);

const ENVS = {
  dev: () =>
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  test: () =>
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
  staging:
    'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&channel_binding=require',
  prod: 'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&channel_binding=require',
};

async function applyMigration(env) {
  const urlOrFn = ENVS[env];
  if (!urlOrFn) {
    console.error(
      `❌ Ambiente desconhecido: ${env}. Use: dev | test | staging | prod`
    );
    process.exit(1);
  }
  const url = typeof urlOrFn === 'function' ? urlOrFn() : urlOrFn;
  const label = env.toUpperCase();
  console.log(`\n🔄 Aplicando migration 608 em [${label}]...`);

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const sql = fs.readFileSync(SQL_FILE, 'utf-8');
    await client.query(sql);
    console.log(`✅ [${label}] Migration 608 aplicada com sucesso!`);
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log(`ℹ️  [${label}] Coluna/índice já existia — OK.`);
    } else {
      console.error(`❌ [${label}] Erro: ${err.message}`);
      throw err;
    }
  } finally {
    await client.end();
  }
}

const envArg = process.argv[2];
applyMigration(envArg).catch(() => process.exit(1));
