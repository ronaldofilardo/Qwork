#!/usr/bin/env node
// Script: apply-migration-1149.cjs
// Aplica migration 1149 em dev (nr-bps_db) e test (nr-bps_db_test) e verifica resultado

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const baseUrl =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || '';
if (!baseUrl) {
  console.error(
    'LOCAL_DATABASE_URL / DATABASE_URL não encontrada no .env.local'
  );
  process.exit(1);
}

const sqlFile = path.join(
  __dirname,
  '../database/migrations/1149_importacao_templates.sql'
);
const sql = fs.readFileSync(sqlFile, 'utf8');

async function applyToDb(dbName) {
  const dbUrl = baseUrl.includes('nr-bps_db')
    ? baseUrl.replace(/nr-bps_db(_test)?/, dbName)
    : baseUrl;

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('\n=== Aplicando em: ' + dbName + ' ===');
  try {
    await client.query(sql);
    console.log('[OK] Migration 1149 aplicada com sucesso');

    // Verificar se a tabela foi criada
    const res = await client.query(`
      SELECT 
        c.relname AS tabela,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'importacao_templates' AND table_schema = 'public') AS colunas
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'importacao_templates' AND n.nspname = 'public'
    `);
    if (res.rows.length > 0) {
      console.log(
        '[INFO] Tabela importacao_templates: OK (' +
          res.rows[0].colunas +
          ' colunas)'
      );
    } else {
      console.log(
        '[AVISO] Tabela importacao_templates não encontrada após migration'
      );
    }

    // Verificar índices
    const idx = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'importacao_templates'
      ORDER BY indexname
    `);
    console.log(
      '[INFO] Índices:',
      idx.rows.map((r) => r.indexname).join(', ') || 'nenhum'
    );
  } catch (e) {
    console.error('[ERRO]', e.message);
  } finally {
    await client.end();
  }
}

(async () => {
  await applyToDb('nr-bps_db');
  await applyToDb('nr-bps_db_test');
  console.log('\n=== Concluído ===');
})();
