import pg from 'pg';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function applyMigration002() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
  });

  try {
    console.log('Aplicando migração 002_criar_tabelas_aceites_termos.sql...');

    const migrationSQL = fs.readFileSync(
      'database/migrations/002_criar_tabelas_aceites_termos.sql',
      'utf8'
    );

    await pool.query(migrationSQL);

    console.log('✅ Migração 002 aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration002();
