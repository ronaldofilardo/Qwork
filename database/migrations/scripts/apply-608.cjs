/**
 * Aplica migration 608: adiciona comercial_cpf em representantes_cadastro_leads
 * Uso: node database/migrations/scripts/apply-608.cjs
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar .env.local
const envPath = path.join(__dirname, '../../..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const LOCAL_DB =
  process.env.LOCAL_DATABASE_URL || 'postgresql://localhost:5432/nr-bps_db';

async function run() {
  const client = new Client(LOCAL_DB);
  await client.connect();

  try {
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        '../../migrations/608_representantes_cadastro_leads_comercial_cpf.sql'
      ),
      'utf-8'
    );
    await client.query(sql);
    console.log('✅ Migration 608 aplicada com sucesso!');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('❌ Erro ao aplicar migration:', err.message);
  process.exit(1);
});
