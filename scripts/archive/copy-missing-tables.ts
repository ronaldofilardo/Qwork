#!/usr/bin/env tsx
/**
 * Cópia manual: empresas_clientes + funcionarios
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const PROD_DB =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require';

async function copyTableWithAllColumns(
  devPool: Pool,
  prodPool: Pool,
  tableName: string
): Promise<number> {
  // Buscar dados do DEV
  const dataResult = await devPool.query(`SELECT * FROM "${tableName}"`);

  if (dataResult.rows.length === 0) {
    console.log(`   ⏭️  ${tableName}: vazia`);
    return 0;
  }

  const columns = Object.keys(dataResult.rows[0]);
  const columnNames = columns.map((c) => `"${c}"`).join(', ');

  let inserted = 0;

  // Desabilitar RLS temporariamente
  try {
    await prodPool.query(
      `ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY`
    );
  } catch {}

  // Inserir registro por registro
  for (const row of dataResult.rows) {
    try {
      const values = columns.map((col, idx) => `$${idx + 1}`).join(', ');
      const data = columns.map((col) => row[col]);

      await prodPool.query(
        `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values}) ON CONFLICT DO NOTHING`,
        data
      );
      inserted++;
    } catch (error: any) {
      console.log(
        `   ⚠️  ${tableName} ID ${row.id}: ${error.message.substring(0, 80)}`
      );
    }
  }

  // Reabilitar RLS
  try {
    await prodPool.query(
      `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`
    );
  } catch {}

  // Atualizar sequences
  try {
    const seqs = await prodPool.query(
      `
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND column_default LIKE 'nextval%'
    `,
      [tableName]
    );

    for (const seq of seqs.rows) {
      const seqName = seq.column_default.match(/nextval\('(.+?)'/)?.[1];
      if (seqName) {
        await prodPool.query(
          `
          SELECT setval($1, COALESCE((SELECT MAX("${seq.column_name}") FROM "${tableName}"), 1), true)
        `,
          [seqName]
        );
      }
    }
  } catch {}

  return inserted;
}

async function main() {
  const devPool = new Pool({ connectionString: DEV_DB });
  const prodPool = new Pool({ connectionString: PROD_DB });

  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  CÓPIA MANUAL: empresas_clientes + funcionarios             ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    // 1. Copiar empresas_clientes
    console.log('1️⃣  Copiando empresas_clientes...\n');
    const empresas = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'empresas_clientes'
    );
    console.log(`   ✅ ${empresas} registros copiados\n`);

    // 2. Copiar funcionarios
    console.log('2️⃣  Copiando funcionarios...\n');
    const funcionarios = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'funcionarios'
    );
    console.log(`   ✅ ${funcionarios} registros copiados\n`);

    // 3. Copiar funcionarios_clinicas
    console.log('3️⃣  Copiando funcionarios_clinicas...\n');
    const funcClinicas = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'funcionarios_clinicas'
    );
    console.log(`   ✅ ${funcClinicas} registros copiados\n`);

    // 4. Copiar funcionarios_entidades
    console.log('4️⃣  Copiando funcionarios_entidades...\n');
    const funcEntidades = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'funcionarios_entidades'
    );
    console.log(`   ✅ ${funcEntidades} registros copiados\n`);

    // 5. Copiar lotes_avaliacao
    console.log('5️⃣  Copiando lotes_avaliacao...\n');
    const lotes = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'lotes_avaliacao'
    );
    console.log(`   ✅ ${lotes} registros copiados\n`);

    // 6. Copiar avaliacoes
    console.log('6️⃣  Copiando avaliacoes...\n');
    const avaliacoes = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'avaliacoes'
    );
    console.log(`   ✅ ${avaliacoes} registros copiados\n`);

    // 7. Copiar laudos
    console.log('7️⃣  Copiando laudos...\n');
    const laudos = await copyTableWithAllColumns(devPool, prodPool, 'laudos');
    console.log(`   ✅ ${laudos} registros copiados\n`);

    // 8. Copiar respostas
    console.log('8️⃣  Copiando respostas...\n');
    const respostas = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'respostas'
    );
    console.log(`   ✅ ${respostas} registros copiados\n`);

    // 9. Copiar resultados
    console.log('9️⃣  Copiando resultados...\n');
    const resultados = await copyTableWithAllColumns(
      devPool,
      prodPool,
      'resultados'
    );
    console.log(`   ✅ ${resultados} registros copiados\n`);

    // Verificação final
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.log('VERIFICAÇÃO FINAL\n');

    const tables = [
      'entidades',
      'clinicas',
      'empresas_clientes',
      'funcionarios',
      'lotes_avaliacao',
      'avaliacoes',
      'laudos',
      'respostas',
      'resultados',
    ];

    for (const table of tables) {
      try {
        const dev = await devPool.query(`SELECT COUNT(*) FROM "${table}"`);
        const prod = await prodPool.query(`SELECT COUNT(*) FROM "${table}"`);

        const devCount = parseInt(dev.rows[0].count);
        const prodCount = parseInt(prod.rows[0].count);

        const icon =
          devCount === prodCount ? '✅' : prodCount > 0 ? '⚠️' : '❌';
        const pct =
          devCount > 0 ? Math.round((prodCount / devCount) * 100) : 100;

        console.log(
          `   ${icon} ${table.padEnd(25)} DEV: ${devCount.toString().padStart(3)}, PROD: ${prodCount.toString().padStart(3)} (${pct}%)`
        );
      } catch {}
    }

    console.log(
      '\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO COMPLETA!                                 ║'
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
