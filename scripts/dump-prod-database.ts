#!/usr/bin/env node
/**
 * Script: Exportar Dump Completo do Banco PROD (Neon)
 * Data: 13/03/2026
 * 
 * Este script faz um dump SQL completo do banco de produção (Neon)
 * Uso: npx ts-node scripts/dump-prod-database.ts [--schema-only|--data-only]
 */

import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Credenciais Neon (PROD)
const NEON_CONFIG = {
  host: 'ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech',
  user: 'neondb_owner',
  password: 'REDACTED_NEON_PASSWORD',
  database: 'neondb',
  port: 5432,
};

const DEFAULT_DB_URL = `postgresql://${NEON_CONFIG.user}:${NEON_CONFIG.password}@${NEON_CONFIG.host}:${NEON_CONFIG.port}/${NEON_CONFIG.database}`;

async function ensureBackupDir() {
  const backupDir = join(process.cwd(), 'backups', 'neon');
  await mkdir(backupDir, { recursive: true });
  return backupDir;
}

async function dumpDatabase(dumpType: 'full' | 'schema' | 'data' = 'full') {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 EXPORTAR DUMP DO BANCO DE PRODUÇÃO (NEON)');
    console.log('='.repeat(60) + '\n');

    const backupDir = await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();
    
    console.log(`📦 Configuração:`);
    console.log(`   Host:           ${NEON_CONFIG.host}`);
    console.log(`   Database:       ${NEON_CONFIG.database}`);
    console.log(`   Tipo Dump:      ${dumpType === 'full' ? 'Completo (Schema + Dados)' : dumpType === 'schema' ? 'Apenas Schema' : 'Apenas Dados'}`);
    console.log(`   Diretório:      ${backupDir}`);
    console.log(`   Timestamp:      ${timestamp}\n`);

    // Tentar usar pg_dump se disponível no PATH
    const pg_dumpPath = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
    
    try {
      // Verificar se pg_dump está disponível
      await execAsync(`${pg_dumpPath} --version`);
      console.log(`✅ pg_dump encontrado\n`);
      await dumpWithPgDump(pg_dumpPath, backupDir, timestamp, dumpType);
    } catch (err) {
      console.log(`⚠️  pg_dump não encontrado, usando Node.js pg package\n`);
      await dumpWithNodePg(backupDir, timestamp, dumpType);
    }

  } catch (error) {
    console.error('❌ ERRO:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function dumpWithPgDump(pg_dumpPath: string, backupDir: string, timestamp: string, dumpType: 'full' | 'schema' | 'data') {
  const files: { type: string; path: string; cmd: string }[] = [];
  
  if (dumpType === 'full' || dumpType === 'schema') {
    files.push({
      type: 'schema',
      path: join(backupDir, `neon_schema_${timestamp}.sql`),
      cmd: `--schema-only`,
    });
  }
  
  if (dumpType === 'full' || dumpType === 'data') {
    files.push({
      type: 'data',
      path: join(backupDir, `neon_data_${timestamp}.sql`),
      cmd: `--data-only`,
    });
  }
  
  if (dumpType === 'full') {
    files.push({
      type: 'full',
      path: join(backupDir, `neon_full_${timestamp}.sql`),
      cmd: ``,
    });
  }

  for (const file of files) {
    try {
      console.log(`📥 Exportando ${file.type}...`);
      
      // Usar --file em vez de -f para melhor compatibilidade
      const args = [
        `-h ${NEON_CONFIG.host}`,
        `-U ${NEON_CONFIG.user}`,
        `-d ${NEON_CONFIG.database}`,
        file.cmd,
        `--file="${file.path}"`,
      ].filter(Boolean).join(' ');
      
      const cmd = `${pg_dumpPath} ${args}`;
      
      await execAsync(cmd, {
        env: {
          ...process.env,
          'PGPASSWORD': NEON_CONFIG.password,
        },
      });

      const fs = await import('fs').then(m => m.promises);
      const stats = await fs.stat(file.path);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`   ✅ Arquivo: ${file.path}`);
      console.log(`   📊 Tamanho: ${sizeMB} MB\n`);
    } catch (error) {
      console.error(`   ❌ Erro ao exportar ${file.type}:`, error instanceof Error ? error.message : error);
    }
  }
}

async function dumpWithNodePg(backupDir: string, timestamp: string, dumpType: 'full' | 'schema' | 'data') {
  // Fallback: usar npm package `pg`
  console.log('📝 Resumo usando package pg (sem dump estrutural completo)');
  console.log('   💡 Para dump completo, instale PostgreSQL ou use Neon Console: https://console.neon.tech\n');
  
  const Client = require('pg').Client;
  const client = new Client(DEFAULT_DB_URL);

  try {
    await client.connect();
    console.log('✅ Conectado ao banco Neon\n');

    // Obter lista de tabelas
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tables = tableResult.rows.map((r: any) => r.table_name);
    console.log(`📋 Tabelas encontradas: ${tables.length}`);
    tables.forEach((t: string) => console.log(`   - ${t}`));

    // Salvar meta
    const metaFile = join(backupDir, `neon_meta_${timestamp}.json`);
    const fs = await import('fs').then(m => m.promises);
    await fs.writeFile(metaFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      host: NEON_CONFIG.host,
      database: NEON_CONFIG.database,
      tables: tables,
      note: 'Para dump SQL completo, use pg_dump ou Neon Console',
    }, null, 2));

    console.log(`\n✅ Meta-dados salvos: ${metaFile}\n`);
    console.log('💡 Para fazer um dump SQL completo:');
    console.log(`   1. Instale PostgreSQL: https://www.postgresql.org/download`);
    console.log(`   2. Ou use Neon Console: https://console.neon.tech`);
    console.log(`   3. Ou execute este script novamente após instalar PostgreSQL\n`);

  } finally {
    await client.end();
  }
}

// Main
const dumpType = (process.argv[2] || '--full')
  .replace('--', '') as 'full' | 'schema' | 'data';

if (!['full', 'schema', 'data'].includes(dumpType)) {
  console.error('❌ Tipo inválido. Use: --full, --schema-only, ou --data-only');
  process.exit(1);
}

dumpDatabase(dumpType === 'full' ? 'full' : dumpType === 'schema' ? 'schema' : 'data');
