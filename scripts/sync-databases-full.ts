#!/usr/bin/env tsx
/**
 * Script para sincronizar banco de desenvolvimento para produção
 * Usando pg_dump e pg_restore para garantir sincronização completa
 *
 * Este script:
 * 1. Faz dump completo do banco de desenvolvimento
 * 2. Limpa o banco de produção
 * 3. Restaura o dump no banco de produção
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Configurações dos bancos
const DEV_DB = {
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  name: 'DESENVOLVIMENTO (Local)',
};

const PROD_DB = {
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  name: 'PRODUÇÃO (Neon)',
};

const DUMP_FILE = path.join(__dirname, '..', 'tmp', 'database_dump.sql');

async function ensureTmpDir() {
  const tmpDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

async function createDatabaseDump(): Promise<void> {
  console.log('\n📦 Criando dump do banco de DESENVOLVIMENTO...');

  try {
    // Usar pg_dump para exportar apenas dados e schema (sem proprietário/privilégios)
    const dumpCommand = `pg_dump "${DEV_DB.connectionString}" --no-owner --no-acl --clean --if-exists --file="${DUMP_FILE}"`;

    console.log('   Executando pg_dump...');
    await execAsync(dumpCommand);

    const stats = fs.statSync(DUMP_FILE);
    console.log(
      `   ✅ Dump criado com sucesso: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
    );
  } catch (error) {
    console.error('   ❌ Erro ao criar dump:', error);
    throw error;
  }
}

async function restoreToDatabaseProduction(): Promise<void> {
  console.log('\n🔄 Restaurando dump no banco de PRODUÇÃO...');

  try {
    // Usar psql para restaurar o dump
    const restoreCommand = `psql "${PROD_DB.connectionString}" --file="${DUMP_FILE}" --quiet`;

    console.log('   Executando psql restore...');
    const { stdout, stderr } = await execAsync(restoreCommand);

    if (stderr) {
      console.warn('   ⚠️  Avisos durante restore:', stderr);
    }

    console.log('   ✅ Restore concluído com sucesso!');
  } catch (error: any) {
    // pg_restore pode retornar avisos que não são erros críticos
    if (error.stderr && !error.stderr.includes('ERROR')) {
      console.warn('   ⚠️  Avisos:', error.stderr);
    } else {
      console.error('   ❌ Erro ao restaurar:', error);
      throw error;
    }
  }
}

async function cleanupDumpFile(): Promise<void> {
  console.log('\n🗑️  Limpando arquivos temporários...');

  try {
    if (fs.existsSync(DUMP_FILE)) {
      fs.unlinkSync(DUMP_FILE);
      console.log('   ✅ Arquivo de dump removido');
    }
  } catch (error) {
    console.warn('   ⚠️  Erro ao remover arquivo de dump:', error);
  }
}

async function verifySync(): Promise<void> {
  console.log('\n🔍 Verificando sincronização...');

  // Podemos importar o Pool do pg para fazer consultas de verificação
  const { Pool } = await import('pg');

  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    // Contar tabelas em cada banco
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

    console.log(`   📊 Tabelas em DEV: ${devCount}`);
    console.log(`   📊 Tabelas em PROD: ${prodCount}`);

    if (devCount === prodCount) {
      console.log('   ✅ Número de tabelas corresponde!');
    } else {
      console.warn(
        `   ⚠️  Diferença no número de tabelas: ${Math.abs(devCount - prodCount)}`
      );
    }

    // Verificar algumas tabelas chave
    const keyTables = [
      'usuarios',
      'tomadors',
      'clinicas',
      'lotes_avaliacao',
      'laudos',
    ];

    console.log('\\n   Verificando contagem de registros em tabelas chave:');
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
          `   ${match} ${table}: DEV=${devTableCount}, PROD=${prodTableCount}`
        );
      } catch (error) {
        console.log(`   ⏭️  ${table}: não encontrada em um dos bancos`);
      }
    }
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

async function main() {
  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  SINCRONIZAÇÃO COMPLETA DE BANCOS DE DADOS                  ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );

    console.log(`   Origem:  ${DEV_DB.name}`);
    console.log(`   Destino: ${PROD_DB.name}\\n`);

    console.log('⚠️  ATENÇÃO:');
    console.log('   Esta operação irá:');
    console.log(
      '   1. Exportar TODOS os dados e estruturas do banco de DESENVOLVIMENTO'
    );
    console.log('   2. LIMPAR E SOBRESCREVER o banco de PRODUÇÃO');
    console.log('   3. Restaurar os dados do DESENVOLVIMENTO na PRODUÇÃO\\n');
    console.log('❌ ESTA AÇÃO NÃO PODE SER DESFEITA!\\n');

    // Garantir que o diretório tmp existe
    await ensureTmpDir();

    // Fase 1: Criar dump
    console.log('\\n📦 FASE 1: EXPORTAÇÃO DO BANCO DE DESENVOLVIMENTO\\n');
    await createDatabaseDump();

    // Fase 2: Restaurar no produção
    console.log('\\n🔄 FASE 2: IMPORTAÇÃO PARA BANCO DE PRODUÇÃO\\n');
    await restoreToDatabaseProduction();

    // Fase 3: Verificação
    console.log('\\n🔍 FASE 3: VERIFICAÇÃO DA SINCRONIZAÇÃO\\n');
    await verifySync();

    // Limpeza
    await cleanupDumpFile();

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

    // Tentar limpar o arquivo de dump em caso de erro
    await cleanupDumpFile();

    process.exit(1);
  }
}

main();
