/**
 * Script para aplicar migration 164 no banco de testes
 */

require('dotenv').config({ path: '.env.test' });
const fs = require('fs');
const { Pool } = require('pg');

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(
      'database/migrations/164_remove_codigo_titulo_emergencia_definitivo.sql',
      'utf-8'
    );

    console.log('📝 Aplicando migration 164...');
    await pool.query(sql);
    console.log('✅ Migration 164 aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
