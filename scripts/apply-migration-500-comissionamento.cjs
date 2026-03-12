/**
 * apply-migration-500-comissionamento.cjs
 * Aplica a migration 500_sistema_comissionamento.sql no banco configurado.
 * Exige ALLOW_SEED_PROD=true se o banco for produção (neon.tech).
 */
const { loadEnv } = require('./load-env.cjs');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[migration] DATABASE_URL não definida.');
  process.exit(1);
}

const isProd =
  DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('amazonaws.com');
const allowProd = process.env.ALLOW_SEED_PROD === 'true';

if (isProd && !allowProd) {
  console.error(
    '[migration] ⛔ Banco de produção detectado. Defina ALLOW_SEED_PROD=true para continuar.'
  );
  process.exit(1);
}

const migrationPath = path.resolve(
  __dirname,
  '..',
  'database',
  'migrations',
  '500_sistema_comissionamento.sql'
);
if (!fs.existsSync(migrationPath)) {
  console.error('[migration] Arquivo não encontrado:', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log(
      '[migration] Conectado. Aplicando 500_sistema_comissionamento.sql...'
    );
    await client.query(sql);
    console.log('[migration] ✅ Migration 500 aplicada com sucesso!');

    // Verifica se a tabela foi criada
    const check = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='representantes'"
    );
    console.log(
      '[migration] Tabela "representantes" existe:',
      check.rows[0].count === '1' ? 'SIM' : 'NÃO'
    );
  } catch (err) {
    console.error('[migration] Erro:', err.message);
    if (err.detail) console.error('         Detalhe:', err.detail);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
