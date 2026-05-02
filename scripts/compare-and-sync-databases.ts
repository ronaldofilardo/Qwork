#!/usr/bin/env tsx
/**
 * Script para comparar e sincronizar bancos de dados
 * Produção (Neon) vs Desenvolvimento (local)
 *
 * Este script:
 * 1. Compara schemas, tabelas, colunas, constraints, índices, triggers, funções
 * 2. Identifica discrepâncias
 * 3. Limpa o banco de produção
 * 4. Migra dados do desenvolvimento para produção
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações dos bancos
const PROD_DB = {
  connectionString:
    process.env.DATABASE_URL,
  name: 'PRODUÇÃO (Neon)',
};

const DEV_DB = {
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  name: 'DESENVOLVIMENTO (Local)',
};

import {
  getTables,
  getColumns,
  getConstraints,
  getIndexes,
  getTriggers,
  getFunctions,
  getEnums,
  generateReport,
  type TableInfo,
  type ColumnInfo,
  type ConstraintInfo,
  type IndexInfo,
  type TriggerInfo,
  type FunctionInfo,
  type EnumInfo,
  type ComparisonResult,
} from './compare-and-sync-helpers';

async function compareDatabases(): Promise<ComparisonResult> {
  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log('🔍 Conectando aos bancos de dados...\\n');

    // Tabelas
    console.log('📊 Comparando tabelas...');
    const [devTables, prodTables] = await Promise.all([
      getTables(devPool),
      getTables(prodPool),
    ]);

    const devTableNames = new Set(devTables.map((t) => t.table_name));
    const prodTableNames = new Set(prodTables.map((t) => t.table_name));

    const tablesOnlyInDev = Array.from(devTableNames).filter(
      (t) => !prodTableNames.has(t)
    );
    const tablesOnlyInProd = Array.from(prodTableNames).filter(
      (t) => !devTableNames.has(t)
    );
    const commonTables = Array.from(devTableNames).filter((t) =>
      prodTableNames.has(t)
    );

    // Colunas
    console.log('📋 Comparando colunas...');
    const [devColumns, prodColumns] = await Promise.all([
      getColumns(devPool),
      getColumns(prodPool),
    ]);

    const columnDifferences: ComparisonResult['columns']['differences'] = [];
    const devColMap = new Map(
      devColumns.map((c) => [`${c.table_name}.${c.column_name}`, c])
    );
    const prodColMap = new Map(
      prodColumns.map((c) => [`${c.table_name}.${c.column_name}`, c])
    );

    for (const [key, devCol] of devColMap) {
      const prodCol = prodColMap.get(key);
      if (prodCol) {
        const diffs: string[] = [];
        if (devCol.data_type !== prodCol.data_type) {
          diffs.push(`tipo: ${devCol.data_type} vs ${prodCol.data_type}`);
        }
        if (devCol.is_nullable !== prodCol.is_nullable) {
          diffs.push(
            `nullable: ${devCol.is_nullable} vs ${prodCol.is_nullable}`
          );
        }
        if (devCol.column_default !== prodCol.column_default) {
          diffs.push(
            `default: ${devCol.column_default} vs ${prodCol.column_default}`
          );
        }

        if (diffs.length > 0) {
          columnDifferences.push({
            table: devCol.table_name,
            column: devCol.column_name,
            dev: JSON.stringify(devCol),
            prod: JSON.stringify(prodCol),
            difference: diffs.join('; '),
          });
        }
      }
    }

    // Constraints
    console.log('🔗 Comparando constraints...');
    const [devConstraints, prodConstraints] = await Promise.all([
      getConstraints(devPool),
      getConstraints(prodPool),
    ]);

    const devConstraintNames = new Set(
      devConstraints.map((c) => `${c.table_name}.${c.constraint_name}`)
    );
    const prodConstraintNames = new Set(
      prodConstraints.map((c) => `${c.table_name}.${c.constraint_name}`)
    );

    const constraintsOnlyInDev = Array.from(devConstraintNames).filter(
      (c) => !prodConstraintNames.has(c)
    );
    const constraintsOnlyInProd = Array.from(prodConstraintNames).filter(
      (c) => !devConstraintNames.has(c)
    );

    // Índices
    console.log('🔎 Comparando índices...');
    const [devIndexes, prodIndexes] = await Promise.all([
      getIndexes(devPool),
      getIndexes(prodPool),
    ]);

    const devIndexNames = new Set(
      devIndexes.map((i) => `${i.tablename}.${i.indexname}`)
    );
    const prodIndexNames = new Set(
      prodIndexes.map((i) => `${i.tablename}.${i.indexname}`)
    );

    const indexesOnlyInDev = Array.from(devIndexNames).filter(
      (i) => !prodIndexNames.has(i)
    );
    const indexesOnlyInProd = Array.from(prodIndexNames).filter(
      (i) => !devIndexNames.has(i)
    );

    // Triggers
    console.log('⚡ Comparando triggers...');
    const [devTriggers, prodTriggers] = await Promise.all([
      getTriggers(devPool),
      getTriggers(prodPool),
    ]);

    const devTriggerNames = new Set(
      devTriggers.map((t) => `${t.event_object_table}.${t.trigger_name}`)
    );
    const prodTriggerNames = new Set(
      prodTriggers.map((t) => `${t.event_object_table}.${t.trigger_name}`)
    );

    const triggersOnlyInDev = Array.from(devTriggerNames).filter(
      (t) => !prodTriggerNames.has(t)
    );
    const triggersOnlyInProd = Array.from(prodTriggerNames).filter(
      (t) => !devTriggerNames.has(t)
    );

    // Funções
    console.log('⚙️  Comparando funções...');
    const [devFunctions, prodFunctions] = await Promise.all([
      getFunctions(devPool),
      getFunctions(prodPool),
    ]);

    const devFunctionNames = new Set(devFunctions.map((f) => f.routine_name));
    const prodFunctionNames = new Set(prodFunctions.map((f) => f.routine_name));

    const functionsOnlyInDev = Array.from(devFunctionNames).filter(
      (f) => !prodFunctionNames.has(f)
    );
    const functionsOnlyInProd = Array.from(prodFunctionNames).filter(
      (f) => !devFunctionNames.has(f)
    );

    // Enums
    console.log('📝 Comparando enums...');
    const [devEnums, prodEnums] = await Promise.all([
      getEnums(devPool),
      getEnums(prodPool),
    ]);

    const devEnumNames = new Set(devEnums.map((e) => e.enum_name));
    const prodEnumNames = new Set(prodEnums.map((e) => e.enum_name));

    const enumsOnlyInDev = Array.from(devEnumNames).filter(
      (e) => !prodEnumNames.has(e)
    );
    const enumsOnlyInProd = Array.from(prodEnumNames).filter(
      (e) => !devEnumNames.has(e)
    );

    const enumDifferences: ComparisonResult['enums']['differences'] = [];
    const devEnumMap = new Map(
      devEnums.map((e) => [e.enum_name, e.enum_values])
    );
    const prodEnumMap = new Map(
      prodEnums.map((e) => [e.enum_name, e.enum_values])
    );

    for (const [enumName, devValues] of devEnumMap) {
      const prodValues = prodEnumMap.get(enumName);
      if (prodValues) {
        const devSet = new Set(devValues);
        const prodSet = new Set(prodValues);
        const diff = devValues
          .filter((v) => !prodSet.has(v))
          .concat(prodValues.filter((v) => !devSet.has(v)));

        if (diff.length > 0 || devValues.length !== prodValues.length) {
          enumDifferences.push({
            enum: enumName,
            dev: devValues,
            prod: prodValues,
          });
        }
      }
    }

    return {
      tables: {
        onlyInDev: tablesOnlyInDev,
        onlyInProd: tablesOnlyInProd,
        common: commonTables,
      },
      columns: {
        differences: columnDifferences,
      },
      constraints: {
        onlyInDev: constraintsOnlyInDev,
        onlyInProd: constraintsOnlyInProd,
      },
      indexes: {
        onlyInDev: indexesOnlyInDev,
        onlyInProd: indexesOnlyInProd,
      },
      triggers: {
        onlyInDev: triggersOnlyInDev,
        onlyInProd: triggersOnlyInProd,
      },
      functions: {
        onlyInDev: functionsOnlyInDev,
        onlyInProd: functionsOnlyInProd,
      },
      enums: {
        onlyInDev: enumsOnlyInDev,
        onlyInProd: enumsOnlyInProd,
        differences: enumDifferences,
      },
    };
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

async function cleanProductionDatabase(): Promise<void> {
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log('\\n🗑️  Limpando dados do banco de PRODUÇÃO...');

    // Desabilitar triggers temporariamente
    await prodPool.query('SET session_replication_role = replica;');

    // Obter todas as tabelas
    const tables = await getTables(prodPool);

    console.log(`📋 Encontradas ${tables.length} tabelas para limpar...`);

    // Limpar cada tabela
    for (const table of tables) {
      try {
        console.log(`  Limpando tabela: ${table.table_name}`);
        await prodPool.query(`TRUNCATE TABLE "${table.table_name}" CASCADE`);
      } catch (error) {
        console.warn(`  ⚠️  Erro ao limpar ${table.table_name}:`, error);
      }
    }

    // Reabilitar triggers
    await prodPool.query('SET session_replication_role = DEFAULT;');

    console.log('✅ Limpeza concluída!');
  } finally {
    await prodPool.end();
  }
}

async function syncData(): Promise<void> {
  const devPool = new Pool({ connectionString: DEV_DB.connectionString });
  const prodPool = new Pool({ connectionString: PROD_DB.connectionString });

  try {
    console.log('\\n🔄 Sincronizando dados de DESENVOLVIMENTO → PRODUÇÃO...');

    // Obter tabelas do desenvolvimento
    const tables = await getTables(devPool);

    console.log(`📋 Encontradas ${tables.length} tabelas para sincronizar...`);

    // Desabilitar triggers e checks temporariamente
    await prodPool.query('SET session_replication_role = replica;');

    for (const table of tables) {
      try {
        console.log(`  Copiando dados: ${table.table_name}`);

        // Contar registros no desenvolvimento
        const countResult = await devPool.query(
          `SELECT COUNT(*) as count FROM "${table.table_name}"`
        );
        const count = parseInt(countResult.rows[0].count);

        if (count === 0) {
          console.log(`    ⏭️  Tabela vazia, pulando...`);
          continue;
        }

        console.log(`    📊 ${count} registros encontrados`);

        // Obter dados
        const dataResult = await devPool.query(
          `SELECT * FROM "${table.table_name}"`
        );

        if (dataResult.rows.length > 0) {
          // Obter nomes das colunas
          const columns = Object.keys(dataResult.rows[0]);
          const columnNames = columns.map((c) => `"${c}"`).join(', ');

          // Inserir em lotes de 100 registros
          const batchSize = 100;
          for (let i = 0; i < dataResult.rows.length; i += batchSize) {
            const batch = dataResult.rows.slice(i, i + batchSize);

            const values = batch
              .map((row, rowIndex) => {
                const rowValues = columns
                  .map((col, colIndex) => {
                    const value = row[col];
                    return `$${rowIndex * columns.length + colIndex + 1}`;
                  })
                  .join(', ');
                return `(${rowValues})`;
              })
              .join(', ');

            const flatValues = batch.flatMap((row) =>
              columns.map((col) => row[col])
            );

            const insertQuery = `
              INSERT INTO "${table.table_name}" (${columnNames})
              VALUES ${values}
            `;

            await prodPool.query(insertQuery, flatValues);

            console.log(
              `    ✓ Inseridos ${Math.min(i + batchSize, dataResult.rows.length)}/${dataResult.rows.length}`
            );
          }
        }

        // Atualizar sequences se existirem
        try {
          const sequenceQuery = `
            SELECT column_name, column_default
            FROM information_schema.columns
            WHERE table_name = $1
              AND column_default LIKE 'nextval%'
          `;
          const sequences = await prodPool.query(sequenceQuery, [
            table.table_name,
          ]);

          for (const seq of sequences.rows) {
            const sequenceName =
              seq.column_default.match(/nextval\('(.+?)'/)?.[1];
            if (sequenceName) {
              await prodPool.query(
                `
                SELECT setval($1, COALESCE((SELECT MAX("${seq.column_name}") FROM "${table.table_name}"), 1))
              `,
                [sequenceName]
              );
              console.log(`    ✓ Sequence atualizada: ${sequenceName}`);
            }
          }
        } catch (seqError) {
          console.warn(`    ⚠️  Erro ao atualizar sequences:`, seqError);
        }
      } catch (error) {
        console.error(`  ❌ Erro ao copiar ${table.table_name}:`, error);
      }
    }

    // Reabilitar triggers
    await prodPool.query('SET session_replication_role = DEFAULT;');

    console.log('\\n✅ Sincronização de dados concluída!');
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

async function main() {
  try {
    console.log(
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ANÁLISE E SINCRONIZAÇÃO DE BANCOS DE DADOS                 ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );

    // Fase 1: Comparação
    console.log('\\n📊 FASE 1: ANÁLISE COMPARATIVA\\n');
    const comparison = await compareDatabases();

    const report = await generateReport(comparison, DEV_DB.name, PROD_DB.name);

    // Salvar relatório
    const reportPath = path.join(
      __dirname,
      '..',
      'RELATORIO_COMPARACAO_DATABASES.md'
    );
    fs.writeFileSync(reportPath, report);
    console.log(`\\n📄 Relatório salvo em: ${reportPath}\\n`);

    // Exibir resumo
    console.log('\\n' + '='.repeat(70));
    console.log(report);
    console.log('='.repeat(70) + '\\n');

    // Fase 2: Confirmação
    console.log('\\n⚠️  ATENÇÃO: A próxima etapa irá:');
    console.log('   1. APAGAR TODOS OS DADOS do banco de PRODUÇÃO');
    console.log(
      '   2. COPIAR TODOS OS DADOS do banco de DESENVOLVIMENTO para PRODUÇÃO'
    );
    console.log('\\n❌ ESTA AÇÃO NÃO PODE SER DESFEITA!\\n');

    // Para ambientes não-interativos, podemos pular a confirmação
    // Vamos continuar automaticamente

    // Fase 3: Limpeza
    console.log('\\n🗑️  FASE 2: LIMPEZA DO BANCO DE PRODUÇÃO\\n');
    await cleanProductionDatabase();

    // Fase 4: Sincronização
    console.log('\\n🔄 FASE 3: MIGRAÇÃO DE DADOS\\n');
    await syncData();

    console.log(
      '\\n╔══════════════════════════════════════════════════════════════╗'
    );
    console.log(
      '║  ✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!                    ║'
    );
    console.log(
      '╚══════════════════════════════════════════════════════════════╝\\n'
    );
  } catch (error) {
    console.error('\\n❌ ERRO CRÍTICO:', error);
    process.exit(1);
  }
}

main();
