import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.development') });

const isTest =
  process.env.NODE_ENV === 'test' || !!process.env.TEST_DATABASE_URL;
const databaseUrl = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'test') {
  if (!process.env.TEST_DATABASE_URL) {
    console.error(
      '❌ ERRO: NODE_ENV=test definido mas TEST_DATABASE_URL não está configurado. Abortando.'
    );
    process.exit(2);
  }
  try {
    const parsed = new URL(process.env.TEST_DATABASE_URL);
    const dbName = parsed.pathname.replace(/\//g, '');
    if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
      console.error(
        '❌ ERRO: TEST_DATABASE_URL aponta para o banco de desenvolvimento (nr-bps_db). Ajuste TEST_DATABASE_URL para o banco de testes.'
      );
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ ERRO ao analisar TEST_DATABASE_URL:', err.message || err);
    process.exit(2);
  }
}

let config;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  config = {
    host: url.hostname,
    port: parseInt(url.port),
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
  };
} else {
  config = {
    host: 'localhost',
    port: 5432,
    database: isTest ? 'nr-bps_db_test' : 'nr-bps_db',
    user: 'postgres',
    password: '123456',
  };
}

const { Client } = pg;

async function run() {
  const client = new Client(config);
  try {
    console.log('🔌 Conectando ao banco (destino):', config.database);
    await client.connect();
    console.log('✅ Conectado. Executando migration 024...');

    const migrationSQL = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'database',
        'migrations',
        '024_add_tipo_notificacao_laudo_emitido_automaticamente.sql'
      ),
      'utf8'
    );
    await client.query(migrationSQL);

    console.log('✅ Migration 024 aplicada com sucesso (se necessário).');
  } catch (err) {
    console.error('❌ Erro ao aplicar migration 024:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
