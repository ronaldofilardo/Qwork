#!/usr/bin/env tsx
/**
 * Script FINAL: Cópia COM ORDEM CORRETA de dependências
 * Desenvolvimento → Produção
 */

import { Pool } from 'pg';

const DEV_DB = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
const PROD_DB =
  'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require';

// ORDEM CRÍTICA: respeita ALL foreign keys
const ORDERED_TABLES = [
  'planos', // Base (sem dependências)
  'roles', // Base
  'permissions', // Base
  'entidades', // Depende de planos
  'entidades_senhas', // Depende de entidades
  'clinicas', // Depende de entidades
  'clinicas_senhas', // Depende de clinicas
  'empresas_clientes', // Depende de clinicas
  'funcionarios', // Depende de entidades
  'funcionarios_clinicas', // Depende de funcionarios + clinicas
  'funcionarios_entidades', // Depende de funcionarios + entidades
  'lotes_avaliacao', // Depende de clinicas + entidades
  'avaliacoes', // Depende de lotes + funcionarios
  'laudos', // Depende de lotes + funcionarios (emissor)
  'respostas', // Depende de avaliacoes
  'resultados', // Depende de avaliacoes
  'avaliacao_resets', // Depende de avaliacoes
  'contratos', // Depende de entidades
  'pagamentos', // Depende de contratos
  'contratacao_personalizada', // Depende de entidades
  'auditoria_laudos', // Depende de lotes
  'notificacoes_admin', // Depende de lotes
  'usuarios', // Depende de entidades + clinicas
  'role_permissions', // Depende de roles + permissions
  // Outras tabelas
  'audit_logs',
  'auditoria',
  'notificacoes',
  'notificacoes_traducoes',
  'templates_contrato',
  'migration_guidelines',
  'lote_id_allocator',
  'contratantes_senhas_audit',
];

async function copyTable(
  devPool: Pool,
  prodPool: Pool,
  table: string
): Promise<{ count: number; error?: string }> {
  try {
    const countResult = await devPool.query(`SELECT COUNT(*) FROM "${table}"`);
    const total = parseInt(countResult.rows[0].count);

    if (total === 0) return { count: 0 };

    const dataResult = await devPool.query(`SELECT * FROM "${table}"`);
    if (dataResult.rows.length === 0) return { count: 0 };

    const columns = Object.keys(dataResult.rows[0]);
    const columnNames = columns.map((c) => `"${c}"`).join(', ');

    let inserted = 0;
    const batchSize = 100;

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
          `INSERT INTO "${table}" (${columnNames}) VALUES ${values}`,
          flatValues
        );
        inserted += result.rowCount || 0;
      } catch (batchError: any) {
        return { count: inserted, error: batchError.message };
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
      '║  SINCRONIZAÇÃO FINAL COM ORDEM CORRETA                      ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\n'
    );

    let totalRecords = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const table of ORDERED_TABLES) {
      process.stdout.write(`   ${table.padEnd(40)} `);

      const result = await copyTable(devPool, prodPool, table);

      if (result.error) {
        console.log(`❌ ${result.error.substring(0, 60)}`);
        errorCount++;
      } else if (result.count === 0) {
        console.log('⏭️  vazia');
      } else {
        console.log(`✅ ${result.count} registros`);
        totalRecords += result.count;
        successCount++;
      }
    }

    console.log(
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );
    console.log(`\n   ✅ Tabelas copiadas: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📊 Total de registros: ${totalRecords}\n`);

    // Verificação
    console.log(
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    console.log('VERIFICAÇÃO FINAL\n');

    const keyTables = [
      'planos',
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

        const icon = devCount === prodCount ? '✅' : '⚠️';
        console.log(
          `   ${icon} ${table.padEnd(25)} DEV: ${devCount.toString().padStart(3)}, PROD: ${prodCount.toString().padStart(3)}`
        );
      } catch {}
    }

    console.log(
      '\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO CONCLUÍDA!                                 ║'
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
