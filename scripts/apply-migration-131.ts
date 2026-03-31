/**
 * Script: Aplicar Migration 131 no Neon (Produção)
 *
 * Adiciona colunas emitido_em, enviado_em e outras colunas faltantes
 * na tabela lotes_avaliacao do banco de produção (Neon).
 *
 * Uso:
 *   pnpm tsx scripts/apply-migration-131.ts
 */

import { loadEnv } from './load-env';
loadEnv();

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function applyMigration131() {
  console.log('='.repeat(60));
  console.log('APLICAR MIGRATION 131: Adicionar colunas emitido_em/enviado_em');
  console.log('='.repeat(60));
  console.log('');

  // Verificar se estamos usando o banco de produção
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }

  console.log(
    '📊 Banco de dados:',
    dbUrl.includes('neon.tech') ? 'Neon (Produção)' : 'Outro'
  );
  console.log('');

  // Perguntar confirmação se for produção
  if (dbUrl.includes('neon.tech')) {
    console.log(
      '⚠️  ATENÇÃO: Você está prestes a modificar o banco de PRODUÇÃO!'
    );
    console.log('');

    // Em produção real, você pode adicionar um prompt de confirmação aqui
    // Para CI/CD, comentar essa verificação ou usar variável de ambiente
  }

  try {
    // 1. Verificar estado atual
    console.log('1️⃣  Verificando estado atual da tabela lotes_avaliacao...');
    const checkColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao'
      AND column_name IN ('emitido_em', 'enviado_em', 'hash_pdf', 'setor_id')
      ORDER BY column_name
    `);

    console.log(`   Colunas encontradas: ${checkColumns.rows.length}/4`);
    checkColumns.rows.forEach((col: any) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });
    console.log('');

    // 2. Ler arquivo de migration
    console.log('2️⃣  Lendo arquivo de migration...');
    const migrationPath = join(
      process.cwd(),
      'database',
      'migrations',
      '131_add_emitido_enviado_columns_node.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`   ✓ Migration carregada (${migrationSQL.length} caracteres)`);
    console.log('');

    // 3. Executar migration
    console.log('3️⃣  Executando migration...');
    console.log('   (Isso pode levar alguns segundos)');
    console.log('');

    const startTime = Date.now();
    await query(migrationSQL);
    const duration = Date.now() - startTime;

    console.log(`   ✅ Migration executada com sucesso em ${duration}ms`);
    console.log('');

    // 4. Validar resultado
    console.log('4️⃣  Validando resultado...');
    const validateColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao'
      AND column_name IN ('emitido_em', 'enviado_em', 'hash_pdf', 'setor_id')
      ORDER BY column_name
    `);

    console.log(`   Colunas após migration: ${validateColumns.rows.length}/4`);
    console.log('');
    console.log('   Detalhes:');
    validateColumns.rows.forEach((col: any) => {
      console.log(
        `   - ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(25)} | nullable: ${col.is_nullable.padEnd(3)} | default: ${col.column_default || 'NULL'}`
      );
    });
    console.log('');

    // 5. Verificar índices
    console.log('5️⃣  Verificando índices criados...');
    const checkIndexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'lotes_avaliacao'
      AND indexname IN ('idx_lotes_avaliacao_emitido_em', 'idx_lotes_pronto_emissao', 'idx_lotes_avaliacao_enviado_em')
      ORDER BY indexname
    `);

    console.log(`   Índices encontrados: ${checkIndexes.rows.length}/3`);
    checkIndexes.rows.forEach((idx: any) => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log('');

    // 6. Resumo final
    console.log('='.repeat(60));
    console.log('✅ MIGRATION 131 APLICADA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Próximos passos:');
    console.log(
      '1. Testar endpoint: POST /api/lotes/[loteId]/solicitar-emissao'
    );
    console.log('2. Verificar geração de laudos no emissor');
    console.log('3. Validar que emitido_em e enviado_em estão sendo populados');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ ERRO ao aplicar migration:');
    console.error('');
    console.error(error.message);

    if (error.position) {
      console.error(`   Posição do erro: ${error.position}`);
    }

    if (error.hint) {
      console.error(`   Dica: ${error.hint}`);
    }

    console.error('');
    process.exit(1);
  }
}

// Executar
applyMigration131().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
