#!/usr/bin/env node

/**
 * Análise de Diferenças DEV vs PROD
 *
 * Compara:
 * - Triggers
 * - Funções
 * - Constraints
 * - Defaults de colunas
 * - Índices
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/analyze-dev-prod-diff.cjs
 */

const { Client } = require('pg');

async function analyzeDatabase(connectionString, envName) {
  const client = new Client({ connectionString });
  await client.connect();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANÁLISE: ${envName}`);
  console.log('='.repeat(80));

  try {
    // 1. TRIGGERS
    console.log('\n📌 TRIGGERS:');
    const triggers = await client.query(`
      SELECT 
        t.tgname as trigger_name,
        c.relname as table_name,
        pg_get_triggerdef(t.oid) as definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE NOT t.tgisinternal 
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY c.relname, t.tgname
    `);

    console.log(`   Total: ${triggers.rows.length} triggers`);
    triggers.rows.forEach((row) => {
      console.log(`   - ${row.table_name}.${row.trigger_name}`);
    });

    // 2. FUNÇÕES CUSTOM (excluir funções do sistema)
    console.log('\n🔧 FUNÇÕES CUSTOM:');
    const functions = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname LIKE 'fn_%'
      ORDER BY p.proname
    `);

    console.log(`   Total: ${functions.rows.length} funções`);
    functions.rows.forEach((row) => {
      console.log(`   - ${row.function_name}`);
    });

    // 3. STATUS DEFAULT DA TABELA LAUDOS
    console.log('\n📄 LAUDOS - DEFAULT STATUS:');
    const laudosDefault = await client.query(`
      SELECT 
        column_name,
        column_default,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'laudos'
        AND column_name = 'status'
    `);

    if (laudosDefault.rows.length > 0) {
      const def = laudosDefault.rows[0];
      console.log(`   Column: ${def.column_name}`);
      console.log(`   Type: ${def.data_type}`);
      console.log(`   Default: ${def.column_default || 'NULL'}`);

      if (def.column_default && def.column_default.includes('emitido')) {
        console.log(
          '   ⚠️  ATENÇÃO: DEFAULT usa "emitido" - pode causar problemas!'
        );
      }
    }

    // 4. CONSTRAINTS DA TABELA LAUDOS
    console.log('\n🔒 LAUDOS - CONSTRAINTS:');
    const laudosConstraints = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'laudos'::regclass
        AND contype = 'c'
      ORDER BY conname
    `);

    console.log(`   Total: ${laudosConstraints.rows.length} check constraints`);
    laudosConstraints.rows.forEach((row) => {
      console.log(`   - ${row.constraint_name}`);
      if (row.constraint_name.includes('status')) {
        console.log(`     ${row.definition.substring(0, 100)}...`);
      }
    });

    // 5. MIGRAÇÕES APLICADAS (se houver tabela)
    console.log('\n🔄 MIGRAÇÕES APLICADAS:');
    try {
      const migrations = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename LIKE '%migration%'
      `);

      if (migrations.rows.length > 0) {
        for (const table of migrations.rows) {
          const records = await client.query(
            `SELECT * FROM ${table.tablename} ORDER BY id DESC LIMIT 5`
          );
          console.log(
            `   Tabela: ${table.tablename} (${records.rows.length} registros recentes)`
          );
          records.rows.forEach((r) => {
            console.log(
              `     - ID: ${r.id}, Nome: ${r.name || r.migration || 'N/A'}`
            );
          });
        }
      } else {
        console.log('   ℹ️  Nenhuma tabela de migrações encontrada');
      }
    } catch (err) {
      console.log('   ℹ️  Não foi possível verificar migrações');
    }

    // 6. LOTES RECENTES E SEUS STATUS
    console.log('\n📊 LOTES RECENTES (últimos 10):');
    const lotes = await client.query(`
      SELECT 
        id,
        status,
        tipo,
        criado_em,
        atualizado_em,
        liberado_por
      FROM lotes_avaliacao
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log(`   Total: ${lotes.rows.length} lotes`);
    lotes.rows.forEach((row) => {
      console.log(
        `   - Lote ${row.id}: status=${row.status}, tipo=${row.tipo}, criado=${row.criado_em?.toISOString().split('T')[0]}`
      );
    });

    // 7. LAUDOS RECENTES E SEUS STATUS
    console.log('\n📋 LAUDOS RECENTES (últimos 10):');
    const laudos = await client.query(`
      SELECT 
        id,
        lote_id,
        status,
        hash_pdf,
        emissor_cpf,
        emitido_em,
        criado_em
      FROM laudos
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log(`   Total: ${laudos.rows.length} laudos`);
    laudos.rows.forEach((row) => {
      const hasHash = row.hash_pdf ? '✓' : '✗';
      console.log(
        `   - Laudo ${row.id} (lote ${row.lote_id}): status=${row.status}, hash=${hasHash}, emissor=${row.emissor_cpf || 'NULL'}`
      );
    });

    // 8. JOBS/PROCESSOS EXTERNOS (se houver tabela)
    console.log('\n⚙️  JOBS/PROCESSOS EXTERNOS:');
    try {
      const jobTables = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND (tablename LIKE '%job%' OR tablename LIKE '%queue%')
      `);

      if (jobTables.rows.length > 0) {
        for (const table of jobTables.rows) {
          const count = await client.query(
            `SELECT COUNT(*) as total FROM ${table.tablename}`
          );
          console.log(
            `   - Tabela: ${table.tablename} (${count.rows[0].total} registros)`
          );
        }
      } else {
        console.log('   ℹ️  Nenhuma tabela de jobs encontrada');
      }
    } catch (err) {
      console.log('   ℹ️  Não foi possível verificar jobs');
    }
  } finally {
    await client.end();
  }
}

async function compareEnvironments() {
  console.log('🔍 ANÁLISE DE DIFERENÇAS DEV vs PROD');
  console.log(
    'Objetivo: Identificar diferenças que podem causar comportamento inconsistente\n'
  );

  const prodUrl = process.argv[2] || process.env.DATABASE_URL;
  const devUrl =
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db';

  if (!prodUrl) {
    console.error('❌ DATABASE_URL de produção não fornecido');
    console.error('\nUso:');
    console.error(
      '  DATABASE_URL="postgresql://..." node scripts/analyze-dev-prod-diff.cjs'
    );
    console.error('  OU');
    console.error(
      '  node scripts/analyze-dev-prod-diff.cjs "postgresql://..."'
    );
    process.exit(1);
  }

  try {
    // Analisar DEV
    console.log('\n' + '█'.repeat(80));
    console.log('AMBIENTE: DESENVOLVIMENTO (LOCAL)');
    console.log('█'.repeat(80));
    await analyzeDatabase(devUrl, 'DESENVOLVIMENTO');

    // Analisar PROD
    console.log('\n' + '█'.repeat(80));
    console.log('AMBIENTE: PRODUÇÃO (NEON)');
    console.log('█'.repeat(80));
    await analyzeDatabase(prodUrl, 'PRODUÇÃO');

    // Recomendações
    console.log('\n' + '='.repeat(80));
    console.log('📝 RECOMENDAÇÕES PARA SINCRONIZAÇÃO');
    console.log('='.repeat(80));
    console.log('1. Compare os triggers listados acima');
    console.log(
      '2. Verifique se o DEFAULT de laudos.status é igual nos dois ambientes'
    );
    console.log(
      '3. Confirme que fn_reservar_id_laudo_on_lote_insert está idêntica'
    );
    console.log('4. Execute migrations pendentes em ambos os ambientes');
    console.log(
      "5. Se PROD tem DEFAULT status='emitido', considere alterar para 'rascunho'"
    );
    console.log('\n💡 Para sincronizar PROD com DEV:');
    console.log('   - Aplique Migration 1004 em PROD (se ainda não aplicada)');
    console.log(
      "   - Considere: ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'rascunho';"
    );
  } catch (error) {
    console.error('\n❌ Erro na análise:', error.message);
    process.exit(1);
  }
}

compareEnvironments().catch(console.error);
