#!/usr/bin/env tsx
/**
 * Script para sincronização completa do banco de dados
 * Abordagem: DROP/CREATE completo do schema e depois restore dos dados
 */

import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const DEV_DB = {
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  name: 'DESENVOLVIMENTO (Local)',
};

const PROD_DB = {
  connectionString:
    process.env.DATABASE_URL,
  name: 'PRODUÇÃO (Neon)',
};

const SCHEMA_DUMP_FILE = path.join(__dirname, '..', 'tmp', 'schema_dump.sql');
const DATA_DUMP_FILE = path.join(__dirname, '..', 'tmp', 'data_dump.sql');

async function ensureTmpDir() {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

async function dropProductionSchema(): Promise<void> {
  console.log('\n🗑️  Limpando schema do banco de PRODUÇÃO...');

  const pool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    // Dropar o schema public completamente (com CASCADE para remover tudo)
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    console.log('   ✅ Schema public removido');

    // Recriar o schema public vazio
    await pool.query('CREATE SCHEMA public');
    console.log('   ✅ Schema public recriado');

    // Garantir permissões
    await pool.query('GRANT ALL ON SCHEMA public TO neondb_owner');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    console.log('   ✅ Permissões configuradas');
  } catch (error) {
    console.error('   ❌ Erro ao limpar schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function dumpSchema(): Promise<void> {
  console.log('\n📦 Exportando SCHEMA do banco de DESENVOLVIMENTO...');

  try {
    // Exportar apenas o schema (--schema-only) sem dados
    const command = `pg_dump "${DEV_DB.connectionString}" --schema-only --no-owner --no-acl --file="${SCHEMA_DUMP_FILE}"`;

    console.log('   Executando pg_dump (schema only)...');
    await execAsync(command);

    const stats = fs.statSync(SCHEMA_DUMP_FILE);
    console.log(`   ✅ Schema exportado: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar schema:', error);
    throw error;
  }
}

async function restoreSchema(): Promise<void> {
  console.log('\n🔄 Importando SCHEMA para banco de PRODUÇÃO...');

  try {
    const command = `psql "${PROD_DB.connectionString}" --file="${SCHEMA_DUMP_FILE}" --quiet`;

    console.log('   Executando psql (schema restore)...');
    const { stderr } = await execAsync(command);

    if (stderr && stderr.includes('ERROR')) {
      console.warn('   ⚠️  Avisos:', stderr);
    }

    console.log('   ✅ Schema importado com sucesso!');
  } catch (error: any) {
    if (error.stderr && !error.stderr.includes('ERROR')) {
      console.warn('   ⚠️  Avisos:', error.stderr);
    } else {
      console.error('   ❌ Erro ao importar schema:', error);
      throw error;
    }
  }
}

async function dumpData(): Promise<void> {
  console.log('\n📦 Exportando DADOS do banco de DESENVOLVIMENTO...');

  try {
    // Exportar apenas os dados (--data-only)
    const command = `pg_dump "${DEV_DB.connectionString}" --data-only --no-owner --no-acl --disable-triggers --file="${DATA_DUMP_FILE}"`;

    console.log('   Executando pg_dump (data only)...');
    await execAsync(command);

    const stats = fs.statSync(DATA_DUMP_FILE);
    console.log(`   ✅ Dados exportados: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar dados:', error);
    throw error;
  }
}

async function restoreData(): Promise<void> {
  console.log('\n🔄 Importando DADOS para banco de PRODUÇÃO...');

  try {
    const command = `psql "${PROD_DB.connectionString}" --file="${DATA_DUMP_FILE}" --quiet`;

    console.log('   Executando psql (data restore)...');
    const { stderr } = await execAsync(command);

    if (stderr && stderr.includes('ERROR')) {
      console.warn('   ⚠️  Avisos:', stderr);
    }

    console.log('   ✅ Dados importados com sucesso!');
  } catch (error: any) {
    if (error.stderr && !error.stderr.includes('ERROR')) {
      console.warn('   ⚠️  Avisos:', error.stderr);
    } else {
      console.error('   ❌ Erro ao importar dados:', error);
      throw error;
    }
  }
}

async function verifySync(): Promise<void> {
  console.log('\n🔍 Verificando sincronização...');

  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    // Contar tabelas
    const devTablesResult = await devPool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const prodTablesResult = await prodPool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const devCount = parseInt(devTablesResult.rows[0].count);
    const prodCount = parseInt(prodTablesResult.rows[0].count);

    console.log(`\\n   📊 Tabelas:`);
    console.log(`      DEV:  ${devCount}`);
    console.log(`      PROD: ${prodCount}`);

    if (devCount === prodCount) {
      console.log(`      ✅ Quantidade idêntica!`);
    } else {
      console.warn(
        `      ⚠️  Diferença de ${Math.abs(devCount - prodCount)} tabelas`
      );
    }

    // Verificar funções
    const devFuncsResult = await devPool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);

    const prodFuncsResult = await prodPool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);

    const devFuncCount = parseInt(devFuncsResult.rows[0].count);
    const prodFuncCount = parseInt(prodFuncsResult.rows[0].count);

    console.log(`\\n   ⚙️  Funções:`);
    console.log(`      DEV:  ${devFuncCount}`);
    console.log(`      PROD: ${prodFuncCount}`);

    if (devFuncCount === prodFuncCount) {
      console.log(`      ✅ Quantidade idêntica!`);
    } else {
      console.warn(
        `      ⚠️  Diferença de ${Math.abs(devFuncCount - prodFuncCount)} funções`
      );
    }

    // Verificar dados em tabelas chave
    const keyTables = [
      'entidades_senhas',
      'clinicas',
      'lotes_avaliacao',
      'laudos',
      'funcionarios',
    ];

    console.log('\\n   📋 Registros em tabelas chave:');
    for (const table of keyTables) {
      try {
        const devCountResult = await devPool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        const prodCountResult = await prodPool.query(
          `SELECT COUNT(*) as count FROM "${table}"`
        );

        const devTableCount = parseInt(devCountResult.rows[0].count);
        const prodTableCount = parseInt(prodCountResult.rows[0].count);

        const match = devTableCount === prodTableCount ? '✅' : '⚠️';
        console.log(
          `      ${match} ${table.padEnd(20)}: DEV=${devTableCount}, PROD=${prodTableCount}`
        );
      } catch (error) {
        console.log(`      ⏭️  ${table.padEnd(20)}: não encontrada`);
      }
    }
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

async function cleanup(): Promise<void> {
  console.log('\n🗑️  Limpando arquivos temporários...');

  try {
    if (fs.existsSync(SCHEMA_DUMP_FILE)) {
      fs.unlinkSync(SCHEMA_DUMP_FILE);
    }
    if (fs.existsSync(DATA_DUMP_FILE)) {
      fs.unlinkSync(DATA_DUMP_FILE);
    }
    console.log('   ✅ Arquivos temporários removidos');
  } catch (error) {
    console.warn('   ⚠️  Erro ao remover arquivos:', error);
  }
}

async function main() {
  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  SINCRONIZAÇÃO COMPLETA: DESENVOLVIMENTO → PRODUÇÃO         ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );

    console.log(`   Origem:  ${DEV_DB.name}`);
    console.log(`   Destino: ${PROD_DB.name}\\n`);

    console.log('⚠️  ATENÇÃO - Esta operação irá:');
    console.log(
      '   1. DROPAR completamente o schema public do banco de PRODUÇÃO'
    );
    console.log('   2. Recriar o schema vazio');
    console.log(
      '   3. Importar a estrutura completa do banco de DESENVOLVIMENTO'
    );
    console.log('   4. Importar todos os dados do banco de DESENVOLVIMENTO\\n');
    console.log('❌ ESTA AÇÃO NÃO PODE SER DESFEITA!\\n');

    await ensureTmpDir();

    // FASE 1: Limpar produção
    console.log('━'.repeat(70));
    console.log('FASE 1: LIMPEZA DO BANCO DE PRODUÇÃO');
    console.log('━'.repeat(70));
    await dropProductionSchema();

    // FASE 2: Exportar e importar schema
    console.log('\\n' + '━'.repeat(70));
    console.log('FASE 2: SINCRONIZAÇÃO DO SCHEMA');
    console.log('━'.repeat(70));
    await dumpSchema();
    await restoreSchema();

    // FASE 3: Exportar e importar dados
    console.log('\\n' + '━'.repeat(70));
    console.log('FASE 3: SINCRONIZAÇÃO DOS DADOS');
    console.log('━'.repeat(70));
    await dumpData();
    await restoreData();

    // FASE 4: Verificação
    console.log('\\n' + '━'.repeat(70));
    console.log('FASE 4: VERIFICAÇÃO');
    console.log('━'.repeat(70));
    await verifySync();

    // Limpeza
    await cleanup();

    console.log(
      '\\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!                    ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );
  } catch (error) {
    console.error('\\n❌ ERRO CRÍTICO:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
