#!/usr/bin/env node

/**
 * Aplica Migration 1004 - Corrige fn_reservar_id_laudo_on_lote_insert
 * 
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/apply-migration-1004.cjs
 *   OU
 *   node scripts/apply-migration-1004.cjs "postgresql://..."
 * 
 * Ambiente:
 *   Usa DATABASE_URL da variável de ambiente ou primeiro argumento
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não fornecido');
    console.error('');
    console.error('Uso:');
    console.error('  DATABASE_URL="postgresql://..." node scripts/apply-migration-1004.cjs');
    console.error('  OU');
    console.error('  node scripts/apply-migration-1004.cjs "postgresql://..."');
    process.exit(1);
  }

  console.log('🔌 Conectando ao banco de produção...');
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de produção');

    // Ler migration
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '1004_fix_fn_reservar_laudo_status_rascunho.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Lendo migration 1004...');
    console.log('   Path:', migrationPath);

    // Aplicar migration
    console.log('🚀 Aplicando migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration 1004 aplicada com sucesso!');

    // Verificar resultado
    console.log('🔍 Verificando função atualizada...');
    const result = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'fn_reservar_id_laudo_on_lote_insert'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Função encontrada e atualizada:');
      console.log(result.rows[0].definition.substring(0, 200) + '...');
      
      // Verificar se contém 'rascunho'
      if (result.rows[0].definition.includes('rascunho')) {
        console.log('✅ Função agora especifica status=\'rascunho\'');
      } else {
        console.log('⚠️  Aviso: Função não contém \'rascunho\' explícito');
      }
    } else {
      console.log('⚠️  Função não encontrada após aplicação');
    }

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Conexão fechada');
  }
}

applyMigration().catch(console.error);
