#!/usr/bin/env node

/**
 * Verificação Rápida do Status de PROD
 *
 * Verifica especificamente:
 * - Se Migration 1004 foi aplicada
 * - Status da função fn_reservar_id_laudo_on_lote_insert
 * - DEFAULT da coluna laudos.status
 * - Laudos criados recentemente e seus status
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/check-prod-status.cjs
 */

const { Client } = require('pg');

async function checkProdStatus() {
  const prodUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!prodUrl) {
    console.error('❌ DATABASE_URL de produção não fornecido\n');
    console.error('Uso:');
    console.error(
      '  DATABASE_URL="postgresql://..." node scripts/check-prod-status.cjs'
    );
    console.error('  OU');
    console.error('  node scripts/check-prod-status.cjs "postgresql://..."');
    process.exit(1);
  }

  const client = new Client({ connectionString: prodUrl });
  await client.connect();

  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICAÇÃO DO STATUS DE PRODUÇÃO');
  console.log('='.repeat(80));

  try {
    // 1. Verificar função fn_reservar_id_laudo_on_lote_insert
    console.log('\n📌 FUNÇÃO: fn_reservar_id_laudo_on_lote_insert');
    console.log('-'.repeat(80));

    const functionDef = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'fn_reservar_id_laudo_on_lote_insert'
    `);

    if (functionDef.rows.length === 0) {
      console.log('❌ FUNÇÃO NÃO ENCONTRADA!');
    } else {
      const def = functionDef.rows[0].definition;
      console.log('✓ Função encontrada\n');

      // Verificar se usa 'rascunho'
      const usesRascunho = def.includes("'rascunho'");
      const usesDefault =
        def.includes('INSERT INTO laudos') &&
        !def.includes('status') &&
        !usesRascunho;

      if (usesRascunho) {
        console.log("✅ MIGRATION 1004 APLICADA: Função usa status='rascunho'");
        console.log("   Linha encontrada: VALUES (NEW.id, NEW.id, 'rascunho')");
      } else if (usesDefault) {
        console.log(
          '⚠️  MIGRATION 1004 NÃO APLICADA: Função NÃO especifica status'
        );
        console.log('   Função usa: INSERT INTO laudos (id, lote_id)');
        console.log('   Isso significa que o DEFAULT será usado!');
      } else {
        console.log('⚠️  ESTADO DESCONHECIDO: Verificar função manualmente');
      }

      // Mostrar parte relevante da função
      console.log('\n📄 Trecho da INSERT:');
      const lines = def.split('\n');
      const insertLineIndex = lines.findIndex((l) =>
        l.toLowerCase().includes('insert into laudos')
      );
      if (insertLineIndex !== -1) {
        for (
          let i = insertLineIndex;
          i < Math.min(insertLineIndex + 5, lines.length);
          i++
        ) {
          console.log(`   ${lines[i]}`);
        }
      }
    }

    // 2. Verificar DEFAULT da coluna status
    console.log('\n\n📄 COLUNA laudos.status - DEFAULT:');
    console.log('-'.repeat(80));

    const columnDefault = await client.query(`
      SELECT 
        column_name,
        column_default,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'laudos'
        AND column_name = 'status'
    `);

    if (columnDefault.rows.length > 0) {
      const col = columnDefault.rows[0];
      console.log(`   Tipo: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'NULL'}`);

      if (col.column_default && col.column_default.includes('emitido')) {
        console.log("\n⚠️  PERIGO: DEFAULT é 'emitido'!");
        console.log(
          "   Se a função não especificar status, será usado 'emitido'"
        );
        console.log(
          '   Isso causa erro "Laudo não pode ser marcado como emitido sem hash_pdf"'
        );
        console.log('\n💡 Solução:');
        console.log(
          "   1. Aplicar Migration 1004 (função com status='rascunho')"
        );
        console.log(
          "   2. OU alterar DEFAULT: ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'rascunho';"
        );
      } else if (
        col.column_default &&
        col.column_default.includes('rascunho')
      ) {
        console.log("\n✅ DEFAULT é 'rascunho' - Seguro!");
      } else {
        console.log('\n✓ DEFAULT é NULL ou outro valor');
      }
    }

    // 3. Verificar constraints
    console.log('\n\n🔒 CONSTRAINTS da tabela laudos:');
    console.log('-'.repeat(80));

    const constraints = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'laudos'::regclass
        AND contype = 'c'
      ORDER BY conname
    `);

    constraints.rows.forEach((row) => {
      console.log(`\n   ${row.constraint_name}:`);
      console.log(`   ${row.definition}`);

      if (row.constraint_name.includes('hash')) {
        console.log(
          "   ↑ Esta constraint causa o erro se status='emitido' sem hash_pdf"
        );
      }
    });

    // 4. Verificar laudos recentes
    console.log('\n\n📋 LAUDOS CRIADOS RECENTEMENTE:');
    console.log('-'.repeat(80));

    const recentLaudos = await client.query(`
      SELECT 
        id,
        lote_id,
        status,
        hash_pdf IS NOT NULL as tem_hash,
        emissor_cpf,
        criado_em
      FROM laudos
      ORDER BY criado_em DESC
      LIMIT 5
    `);

    if (recentLaudos.rows.length === 0) {
      console.log('   ℹ️  Nenhum laudo encontrado');
    } else {
      console.log(
        `   Total: ${recentLaudos.rows.length} laudos mais recentes:\n`
      );
      recentLaudos.rows.forEach((row) => {
        const statusIcon =
          row.status === 'rascunho'
            ? '✓'
            : row.status === 'emitido' && !row.tem_hash
              ? '⚠️'
              : '•';
        const hashInfo = row.tem_hash ? 'COM hash' : 'SEM hash';
        console.log(`   ${statusIcon} Laudo ${row.id} (lote ${row.lote_id})`);
        console.log(`      Status: ${row.status}, ${hashInfo}`);
        console.log(`      Criado: ${row.criado_em?.toISOString()}`);

        if (row.status === 'emitido' && !row.tem_hash) {
          console.log(
            '      ⚠️  INCONSISTENTE: Status emitido mas sem hash_pdf!'
          );
        }
      });
    }

    // 5. Verificar se há laudos problemáticos
    console.log('\n\n🔍 VERIFICANDO LAUDOS INCONSISTENTES:');
    console.log('-'.repeat(80));

    const problematicLaudos = await client.query(`
      SELECT COUNT(*) as total
      FROM laudos
      WHERE status = 'emitido'
        AND hash_pdf IS NULL
    `);

    const count = parseInt(problematicLaudos.rows[0].total);
    if (count > 0) {
      console.log(
        `   ⚠️  ENCONTRADOS ${count} laudos com status='emitido' mas sem hash_pdf`
      );
      console.log('   Estes laudos são inconsistentes e precisam correção');
    } else {
      console.log('   ✅ Nenhum laudo inconsistente encontrado');
    }

    // RESUMO E RECOMENDAÇÕES
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ANÁLISE');
    console.log('='.repeat(80));

    const funcionUsaRascunho =
      functionDef.rows[0] &&
      functionDef.rows[0].definition.includes("'rascunho'");
    const defaultEEmitido =
      columnDefault.rows[0] &&
      columnDefault.rows[0].column_default &&
      columnDefault.rows[0].column_default.includes('emitido');

    if (funcionUsaRascunho) {
      console.log("✅ Função atualizada: usa status='rascunho'");
    } else {
      console.log('❌ Função desatualizada: NÃO especifica status');
    }

    if (defaultEEmitido) {
      console.log("⚠️  DEFAULT da coluna: 'emitido' (problemático)");
    } else {
      console.log("✓ DEFAULT da coluna: não é 'emitido'");
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 AÇÕES RECOMENDADAS');
    console.log('='.repeat(80));

    if (!funcionUsaRascunho) {
      console.log('\n1. URGENTE: Aplicar Migration 1004 em PRODUÇÃO');
      console.log('   Arquivo: APLICAR_MIGRATION_1004_PRODUCAO.sql');
      console.log('   Local: console.neon.tech → SQL Editor');
    }

    if (defaultEEmitido && funcionUsaRascunho) {
      console.log(
        '\n2. OPCIONAL: Alterar DEFAULT da coluna (camada de segurança extra)'
      );
      console.log(
        "   SQL: ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'rascunho';"
      );
      console.log('   Nota: Não é obrigatório se Migration 1004 foi aplicada');
    }

    if (count > 0) {
      console.log(`\n3. CORRIGIR ${count} laudos inconsistentes`);
      console.log(
        "   Opção A: UPDATE laudos SET status='rascunho' WHERE status='emitido' AND hash_pdf IS NULL;"
      );
      console.log('   Opção B: Analisar caso a caso e decidir ação apropriada');
    }

    if (funcionUsaRascunho && !defaultEEmitido && count === 0) {
      console.log('\n✅ AMBIENTE SAUDÁVEL: Nenhuma ação necessária!');
    }
  } catch (error) {
    console.error('\n❌ Erro na verificação:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkProdStatus().catch((err) => {
  console.error('\n💥 Erro fatal:', err);
  process.exit(1);
});
