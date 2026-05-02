#!/usr/bin/env tsx
/**
 * Script para FORÇAR cópia de TODOS os dados
 * Desenvolvimento → Produção
 *
 * Este script:
 * 1. APAGA todos os dados da produção
 * 2. DESABILITA todas as constraints
 * 3. COPIA todos os dados (mesmo com inconsistências)
 * 4. REABILITA as constraints
 */

import { Pool } from 'pg';

const DEV_DB = {
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  name: 'DESENVOLVIMENTO',
};

const PROD_DB = {
  connectionString:
    process.env.DATABASE_URL,
  name: 'PRODUÇÃO',
};

async function getAllTables(pool: Pool): Promise<string[]> {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map((r) => r.table_name);
}

async function truncateAllTables(pool: Pool): Promise<void> {
  console.log('\n🗑️  Apagando TODOS os dados do banco de PRODUÇÃO...');

  const tables = await getAllTables(pool);
  console.log(`   📋 Encontradas ${tables.length} tabelas`);

  // Desabilitar triggers
  console.log('   ⏹️  Desabilitando triggers...');
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE "${table}" DISABLE TRIGGER ALL`);
    } catch (error: any) {
      console.warn(`      ⚠️  ${table}: ${error.message}`);
    }
  }

  // Truncar todas as tabelas
  console.log('   🗑️  Truncando tabelas...');
  for (const table of tables) {
    try {
      await pool.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`      ✓ ${table}`);
    } catch (error: any) {
      console.warn(`      ⚠️  ${table}: ${error.message}`);
    }
  }

  console.log('   ✅ Todos os dados foram apagados!');
}

async function copyAllData(devPool: Pool, prodPool: Pool): Promise<void> {
  console.log('\n📦 Copiando TODOS os dados: DESENVOLVIMENTO → PRODUÇÃO...');

  const tables = await getAllTables(devPool);
  console.log(`   📋 ${tables.length} tabelas para copiar\n`);

  let totalRecords = 0;
  let successfulTables = 0;
  let emptyTables = 0;
  let errorTables = 0;

  for (const table of tables) {
    try {
      process.stdout.write(`   ${table.padEnd(40)} `);

      // Contar registros
      const countResult = await devPool.query(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        console.log('⏭️  vazia');
        emptyTables++;
        continue;
      }

      // Obter dados
      const dataResult = await devPool.query(`SELECT * FROM "${table}"`);

      if (dataResult.rows.length === 0) {
        console.log('⏭️  sem dados');
        emptyTables++;
        continue;
      }

      // Preparar inserção
      const columns = Object.keys(dataResult.rows[0]);
      const columnNames = columns.map((c) => `"${c}"`).join(', ');

      // Inserir em lotes
      const batchSize = 500;
      let inserted = 0;

      for (let i = 0; i < dataResult.rows.length; i += batchSize) {
        const batch = dataResult.rows.slice(i, i + batchSize);

        const values = batch
          .map((row, rowIndex) => {
            const rowValues = columns
              .map((col, colIndex) => {
                return `$${rowIndex * columns.length + colIndex + 1}`;
              })
              .join(', ');
            return `(${rowValues})`;
          })
          .join(', ');

        const flatValues = batch.flatMap((row) =>
          columns.map((col) => row[col])
        );

        const insertQuery = `INSERT INTO "${table}" (${columnNames}) VALUES ${values}`;

        try {
          const result = await prodPool.query(insertQuery, flatValues);
          inserted += result.rowCount || 0;
        } catch (insertError: any) {
          // Mostrar erro mas continuar
          if (i === 0) {
            // Mostrar apenas o primeiro erro
            console.log(
              `\n      ⚠️  Erro: ${insertError.message.substring(0, 100)}`
            );
            process.stdout.write(`   ${table.padEnd(40)} `);
          }
        }
      }

      // Atualizar sequences
      try {
        const seqResult = await prodPool.query(
          `
          SELECT column_name, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND column_default LIKE 'nextval%'
        `,
          [table]
        );

        for (const seq of seqResult.rows) {
          const seqName = seq.column_default.match(/nextval\('(.+?)'/)?.[1];
          if (seqName) {
            await prodPool.query(
              `
              SELECT setval($1, COALESCE((SELECT MAX("${seq.column_name}") FROM "${table}"), 1), true)
            `,
              [seqName]
            );
          }
        }
      } catch (seqError) {
        // Ignorar
      }

      console.log(`✅ ${inserted} registros`);
      totalRecords += inserted;
      successfulTables++;
    } catch (error: any) {
      console.log(`❌ ${error.message.substring(0, 50)}...`);
      errorTables++;
    }
  }

  console.log(`\n   📊 Resumo:`);
  console.log(`      ✅ Tabelas copiadas: ${successfulTables}`);
  console.log(`      ⏭️  Tabelas vazias: ${emptyTables}`);
  console.log(`      ❌ Tabelas com erro: ${errorTables}`);
  console.log(`      📈 Total de registros: ${totalRecords}`);
}

async function enableAllTriggers(pool: Pool): Promise<void> {
  console.log('\n⚡ Reabilitando triggers...');

  const tables = await getAllTables(pool);

  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE "${table}" ENABLE TRIGGER ALL`);
    } catch (error: any) {
      console.warn(`   ⚠️  ${table}: ${error.message}`);
    }
  }

  console.log('   ✅ Triggers reabilitados');
}

async function verifyFinal(devPool: Pool, prodPool: Pool): Promise<void> {
  console.log('\n🔍 Verificação Final...\n');

  const keyTables = [
    'entidades',
    'entidades_senhas',
    'clinicas',
    'funcionarios',
    'lotes_avaliacao',
    'laudos',
  ];

  for (const table of keyTables) {
    try {
      const devCount = await devPool.query(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      const prodCount = await prodPool.query(
        `SELECT COUNT(*) as count FROM "${table}"`
      );

      const devNum = parseInt(devCount.rows[0].count);
      const prodNum = parseInt(prodCount.rows[0].count);

      const status = devNum === prodNum ? '✅' : '⚠️';
      console.log(
        `   ${status} ${table.padEnd(25)} DEV: ${devNum.toString().padStart(4)}, PROD: ${prodNum.toString().padStart(4)}`
      );
    } catch (error) {
      console.log(`   ⏭️  ${table.padEnd(25)} não encontrada`);
    }
  }
}

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CÓPIA FORÇADA: DESENVOLVIMENTO → PRODUÇÃO                  ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝'
    );

    console.log(`\n   Origem:  ${DEV_DB.name} (FONTE DA VERDADE)`);
    console.log(`   Destino: ${PROD_DB.name} (SERÁ SOBRESCRITO)`);

    console.log('\n⚠️  Esta operação irá:');
    console.log('   1. APAGAR todos os dados do banco de PRODUÇÃO');
    console.log('   2. COPIAR todos os dados do DESENVOLVIMENTO');
    console.log('   3. Ignorar erros de foreign key (desabilita constraints)');
    console.log('\n❌ AÇÃO IRREVERSÍVEL!\n');

    // Fase 1: Limpar produção
    console.log('━'.repeat(70));
    console.log('FASE 1: LIMPEZA COMPLETA');
    console.log('━'.repeat(70));
    await truncateAllTables(prodPool);

    // Fase 2: Copiar dados
    console.log('\n' + '━'.repeat(70));
    console.log('FASE 2: CÓPIA DE DADOS');
    console.log('━'.repeat(70));
    await copyAllData(devPool, prodPool);

    // Fase 3: Reabilitar triggers
    console.log('\n' + '━'.repeat(70));
    console.log('FASE 3: FINALIZAÇÃO');
    console.log('━'.repeat(70));
    await enableAllTriggers(prodPool);

    // Fase 4: Verificação
    console.log('\n' + '━'.repeat(70));
    console.log('FASE 4: VERIFICAÇÃO');
    console.log('━'.repeat(70));
    await verifyFinal(devPool, prodPool);

    console.log(
      '\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO COMPLETA CONCLUÍDA!                       ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
