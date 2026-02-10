#!/usr/bin/env node
/**
 * Script para aplicar migration de reset de sequência em PRODUÇÃO
 * Uso: node scripts/apply-sequence-fix-prod.mjs
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function applyFix() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não definida');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Verificar estado ANTES
    console.log('📊 Estado ANTES do fix:');
    const before = await client.query(`
      SELECT 
        last_value AS proximo_id,
        (SELECT MAX(id) FROM usuarios) AS max_id_tabela,
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios
      FROM usuarios_id_seq
    `);
    console.table(before.rows);

    // Aplicar fix
    console.log('\n🔧 Aplicando correção da sequência...');
    await client.query(`
      SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false)
    `);

    // Verificar estado DEPOIS
    console.log('\n📊 Estado DEPOIS do fix:');
    const after = await client.query(`
      SELECT 
        last_value AS proximo_id,
        (SELECT MAX(id) FROM usuarios) AS max_id_tabela,
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios
      FROM usuarios_id_seq
    `);
    console.table(after.rows);

    console.log('\n✅ Sequência resetada com sucesso!');
    console.log('   Próximo INSERT usará ID:', after.rows[0].proximo_id);

  } catch (error) {
    console.error('\n❌ Erro ao aplicar correção:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyFix();
