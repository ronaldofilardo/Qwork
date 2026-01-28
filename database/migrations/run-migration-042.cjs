const fs = require('fs');
const pg = require('pg');

// Configuração do banco (usando as mesmas configurações do projeto)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nr-bps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: false,
};

async function runMigration() {
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    const migrationSQL = fs.readFileSync(
      'database/migrations/042_add_contratante_id_to_clinicas.sql',
      'utf8'
    );
    console.log('Executando migração...');

    await client.query(migrationSQL);

    console.log('✅ Migração executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await client.end();
  }
}

runMigration();
