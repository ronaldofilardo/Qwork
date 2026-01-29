import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Client } = pg;

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Fix para __dirname no ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao banco...');
    await client.connect();

    console.log('📝 Lendo migration...');
    const sql = readFileSync(
      join(__dirname, '../database/migrations/allow-hash-backfill.sql'),
      'utf-8'
    );

    console.log('🚀 Executando migration...');
    await client.query(sql);

    console.log('✅ Migration executada com sucesso!');
    console.log('');
    console.log(
      'O trigger foi atualizado para permitir atualização apenas do campo hash_pdf quando NULL.'
    );
    console.log('Agora execute: pnpm laudos:backfill-hash');
  } catch (err) {
    console.error('❌ Erro ao executar migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
