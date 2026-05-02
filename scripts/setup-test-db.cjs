#!/usr/bin/env node

// Script para configurar banco de dados de teste automaticamente
const { Pool } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const DB_CONFIG = {
  host: 'localhost',
  user: 'postgres',
  password: (process.env.LOCAL_DB_PASSWORD ?? ''),
  port: 5432,
  database: 'postgres', // conectar ao banco padrão para criar o banco de teste
};

async function createTestDatabase() {
  const pool = new Pool(DB_CONFIG);

  try {
    console.log('🔧 Configurando banco de dados de teste...');

    // Verificar se banco de teste já existe
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'nr-bps_db_test'"
    );

    if (result.rows.length > 0) {
      console.log('✅ Banco de teste nr-bps_db_test já existe');
      return;
    }

    // Criar banco de teste
    await pool.query('CREATE DATABASE nr-bps_db_test');
    console.log('✅ Banco de teste nr-bps_db_test criado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao configurar banco de teste:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function syncSchemaFromDev() {
  console.log(
    '🔧 Sincronizando schema do ambiente de desenvolvimento (nr-bps_db) para o banco de teste (nr-bps_db_test)...'
  );

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `database/schema_nr-bps_db_test_backup_${timestamp}.sql`;

    // Backup do schema atual do banco de teste
    await execAsync(
      `pg_dump -U ${DB_CONFIG.user} -s -d nr-bps_db_test -f ${backupFile}`,
      {
        env: { ...process.env, PGPASSWORD: DB_CONFIG.password },
        maxBuffer: 1024 * 1024 * 10,
      }
    );
    console.log(
      `✅ Backup do schema do banco de teste salvo em: ${backupFile}`
    );

    // Exportar schema do banco de desenvolvimento e aplicar no banco de teste
    await execAsync(
      `pg_dump -U ${DB_CONFIG.user} -s nr-bps_db | psql -U ${DB_CONFIG.user} -d nr-bps_db_test`,
      {
        env: { ...process.env, PGPASSWORD: DB_CONFIG.password },
        maxBuffer: 1024 * 1024 * 50,
      }
    );

    console.log('✅ Schema sincronizado com sucesso (dev -> test)');
  } catch (error) {
    console.error('❌ Erro ao sincronizar schema:', error.message);
    throw error;
  }
}

async function runMigrations() {
  console.log(
    '🔧 Executando migrações adicionais no banco de teste (se necessário)...'
  );

  try {
    // Conectar ao banco de teste
    const testPool = new Pool({
      ...DB_CONFIG,
      database: 'nr-bps_db_test',
    });

    // Criar tabelas básicas se não existirem
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        old_data JSONB,
        new_data JSONB,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Migrações adicionais aplicadas (se necessário)');
    await testPool.end();
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error.message);
    throw error;
  }
}

// Aplicar schema a partir dos arquivos modulares (alternativa ao pg_dump sync)
const fsNode = require('fs');
const pathNode = require('path');

const MODULAR_SCHEMA_FILES = [
  '01-foundation.sql',
  '02-identidade.sql',
  '03-entidades-comercial.sql',
  '04-avaliacoes-laudos.sql',
  '05-financeiro-notificacoes.sql',
  'acl.sql',
];

async function applyModularSchema() {
  console.log('🔧 Aplicando schema modular no banco de teste...');
  const testPool = new Pool({ ...DB_CONFIG, database: 'nr-bps_db_test' });

  try {
    const schemaDir = pathNode.join(
      __dirname,
      '..',
      'database',
      'schemas',
      'modular'
    );
    for (const file of MODULAR_SCHEMA_FILES) {
      const filePath = pathNode.join(schemaDir, file);
      const sql = fsNode.readFileSync(filePath, 'utf-8');
      console.log(`  📄 Executando ${file}...`);
      await testPool.query(sql);
      console.log(`  ✅ ${file} aplicado`);
    }
    console.log('✅ Schema modular aplicado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao aplicar schema modular:', error.message);
    throw error;
  } finally {
    await testPool.end();
  }
}

async function main() {
  const useModular = process.argv.includes('--modular');
  try {
    await createTestDatabase();
    if (useModular) {
      // Aplica schema a partir dos arquivos modulares em database/schemas/modular/
      await applyModularSchema();
    } else {
      // 1) Backup + sincronizar schema do dev para o test (fonte da verdade)
      await syncSchemaFromDev();
    }
    // 2) Executar migrações adicionais de compatibilidade
    await runMigrations();

    console.log('🎉 Configuração do banco de teste concluída com sucesso!');
  } catch (error) {
    console.error('💥 Falha na configuração do banco de teste:', error.message);
    process.exit(1);
  }
}

main();
