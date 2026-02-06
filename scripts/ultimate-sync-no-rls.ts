#!/usr/bin/env tsx
/**
 * Script ULTIMATE: Desabilita RLS + Cópia ordenada
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const PROD_DB =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const TABLES_WITH_DATA = [
  'planos',
  'entidades',
  'entidades_senhas',
  'clinicas',
  'clinicas_senhas',
  'empresas_clientes',
  'funcionarios',
  'funcionarios_clinicas',
  'funcionarios_entidades',
  'lotes_avaliacao',
  'avaliacoes',
  'laudos',
  'respostas',
  'resultados',
  'avaliacao_resets',
  'contratos',
  'pagamentos',
  'contratacao_personalizada',
  'auditoria_laudos',
  'notificacoes_admin',
  'usuarios',
];

async function disableRLS(pool: Pool): Promise<void> {
  console.log('\n🔓 Desabilitando RLS em todas as tabelas...');

  const tables = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `);

  for (const { tablename } of tables.rows) {
    try {
      await pool.query(`ALTER TABLE "${tablename}" DISABLE ROW LEVEL SECURITY`);
      console.log(`   ✓ ${tablename}`);
    } catch (error: any) {
      console.warn(`   ⚠️  ${tablename}: ${error.message.substring(0, 50)}`);
    }
  }
}

async function enableRLS(pool: Pool): Promise<void> {
  console.log('\n🔒 Reabilitando RLS...');

  const tables = await pool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `);

  for (const { tablename } of tables.rows) {
    try {
      await pool.query(`ALTER TABLE "${tablename}" ENABLE ROW LEVEL SECURITY`);
    } catch {}
  }

  console.log('   ✅ RLS reabilitado');
}

async function copyTable(
  devPool: Pool,
  prodPool: Pool,
  table: string
): Promise<{ count: number; error?: string }> {
  try {
    const countResult = await devPool.query(`SELECT COUNT(*) FROM "${table}"`);
    const total = parseInt(countResult.rows[0].count);

    if (total === 0) return { count: 0 };

    const dataResult = await devPool.query(
      `SELECT * FROM "${table}" ORDER BY 1`
    );
    if (dataResult.rows.length === 0) return { count: 0 };

    const columns = Object.keys(dataResult.rows[0]);
    const columnNames = columns.map((c) => `"${c}"`).join(', ');

    let inserted = 0;
    const batchSize = 50;

    for (let i = 0; i < dataResult.rows.length; i += batchSize) {
      const batch = dataResult.rows.slice(i, i + batchSize);

      const values = batch
        .map((row, idx) => {
          const vals = columns
            .map((col, colIdx) => `$${idx * columns.length + colIdx + 1}`)
            .join(', ');
          return `(${vals})`;
        })
        .join(', ');

      const flatValues = batch.flatMap((row) => columns.map((col) => row[col]));

      try {
        const result = await prodPool.query(
          `INSERT INTO "${table}" (${columnNames}) VALUES ${values} ON CONFLICT DO NOTHING`,
          flatValues
        );
        inserted += result.rowCount || 0;
      } catch (batchError: any) {
        // Se falhar, tentar registro por registro
        for (const row of batch) {
          try {
            const singleValues = columns
              .map((col, idx) => `$${idx + 1}`)
              .join(', ');
            const singleData = columns.map((col) => row[col]);
            await prodPool.query(
              `INSERT INTO "${table}" (${columnNames}) VALUES (${singleValues}) ON CONFLICT DO NOTHING`,
              singleData
            );
            inserted++;
          } catch {}
        }
      }
    }

    // Atualizar sequences
    try {
      const seqs = await prodPool.query(
        `
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND column_default LIKE 'nextval%'
      `,
        [table]
      );

      for (const seq of seqs.rows) {
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
    } catch {}

    return { count: inserted };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB });
  const prodPool = new Pool({ connectionString: PROD_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  SINCRONIZAÇÃO ULTIMATE: SEM RLS                            ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝'
    );

    await disableRLS(prodPool);

    console.log('\n📦 Copiando dados...\n');

    let totalRecords = 0;
    let successCount = 0;

    for (const table of TABLES_WITH_DATA) {
      process.stdout.write(`   ${table.padEnd(40)} `);

      const result = await copyTable(devPool, prodPool, table);

      if (result.error) {
        console.log(`❌ ${result.error.substring(0, 50)}`);
      } else if (result.count === 0) {
        console.log('⏭️  vazia ou já copiada');
      } else {
        console.log(`✅ ${result.count} registros`);
        totalRecords += result.count;
        successCount++;
      }
    }

    await enableRLS(prodPool);

    console.log(
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );
    console.log(`\n   ✅ Tabelas inseridas: ${successCount}`);
    console.log(`   📊 Total de registros: ${totalRecords}\n`);

    // Verificação final
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.log('VERIFICAÇÃO FINAL\n');

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
        const dev = await devPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const prod = await prodPool.query(`SELECT COUNT(*) FROM "${table}"`);

        const devCount = parseInt(dev.rows[0].count);
        const prodCount = parseInt(prod.rows[0].count);

        const icon =
          devCount === prodCount ? '✅' : prodCount > 0 ? '⚠️' : '❌';
        console.log(
          `   ${icon} ${table.padEnd(25)} DEV: ${devCount.toString().padStart(3)}, PROD: ${prodCount.toString().padStart(3)}`
        );
      } catch {}
    }

    console.log(
      '\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO CONCLUÍDA!                                ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
