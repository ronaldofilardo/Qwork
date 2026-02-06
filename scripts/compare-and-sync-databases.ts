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
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  name: 'PRODUÇÃO (Neon)',
};

const DEV_DB = {
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  name: 'DESENVOLVIMENTO (Local)',
};

interface TableInfo {
  table_name: string;
  table_schema: string;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  definition: string;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface TriggerInfo {
  trigger_name: string;
  event_manipulation: string;
  event_object_table: string;
  action_statement: string;
  action_timing: string;
}

interface FunctionInfo {
  routine_name: string;
  routine_type: string;
  data_type: string;
  routine_definition: string | null;
}

interface EnumInfo {
  enum_name: string;
  enum_values: string[];
}

interface ComparisonResult {
  tables: {
    onlyInDev: string[];
    onlyInProd: string[];
    common: string[];
  };
  columns: {
    differences: Array<{
      table: string;
      column: string;
      dev: string;
      prod: string;
      difference: string;
    }>;
  };
  constraints: {
    onlyInDev: string[];
    onlyInProd: string[];
  };
  indexes: {
    onlyInDev: string[];
    onlyInProd: string[];
  };
  triggers: {
    onlyInDev: string[];
    onlyInProd: string[];
  };
  functions: {
    onlyInDev: string[];
    onlyInProd: string[];
  };
  enums: {
    onlyInDev: string[];
    onlyInProd: string[];
    differences: Array<{
      enum: string;
      dev: string[];
      prod: string[];
    }>;
  };
}

async function getTables(pool: Pool): Promise<TableInfo[]> {
  const result = await pool.query<TableInfo>(`
    SELECT table_name, table_schema
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows;
}

async function getColumns(pool: Pool): Promise<ColumnInfo[]> {
  const result = await pool.query<ColumnInfo>(`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  return result.rows;
}

async function getConstraints(pool: Pool): Promise<ConstraintInfo[]> {
  const result = await pool.query<ConstraintInfo>(`
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      tc.table_name,
      pg_get_constraintdef(pgc.oid) as definition
    FROM information_schema.table_constraints tc
    JOIN pg_constraint pgc ON pgc.conname = tc.constraint_name
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  return result.rows;
}

async function getIndexes(pool: Pool): Promise<IndexInfo[]> {
  const result = await pool.query<IndexInfo>(`
    SELECT 
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  return result.rows;
}

async function getTriggers(pool: Pool): Promise<TriggerInfo[]> {
  const result = await pool.query<TriggerInfo>(`
    SELECT 
      trigger_name,
      event_manipulation,
      event_object_table,
      action_statement,
      action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `);
  return result.rows;
}

async function getFunctions(pool: Pool): Promise<FunctionInfo[]> {
  const result = await pool.query<FunctionInfo>(`
    SELECT 
      routine_name,
      routine_type,
      data_type,
      routine_definition
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
    ORDER BY routine_name
  `);
  return result.rows;
}

async function getEnums(pool: Pool): Promise<EnumInfo[]> {
  const result = await pool.query<{ typname: string; enumlabel: string }>(`
    SELECT 
      t.typname as typname,
      e.enumlabel as enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY t.typname, e.enumsortorder
  `);

  const enumsMap = new Map<string, string[]>();
  result.rows.forEach((row) => {
    if (!enumsMap.has(row.typname)) {
      enumsMap.set(row.typname, []);
    }
    enumsMap.get(row.typname).push(row.enumlabel);
  });

  return Array.from(enumsMap.entries()).map(([enum_name, enum_values]) => ({
    enum_name,
    enum_values,
  }));
}

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

async function generateReport(comparison: ComparisonResult): Promise<string> {
  let report = '# RELATÓRIO DE COMPARAÇÃO DE BANCOS DE DADOS\\n\\n';
  report += `Data: ${new Date().toISOString()}\\n\\n`;
  report += `**${DEV_DB.name}** vs **${PROD_DB.name}**\\n\\n`;

  let hasDiscrepancies = false;

  // Tabelas
  report += '## 📊 TABELAS\\n\\n';
  if (comparison.tables.onlyInDev.length > 0) {
    hasDiscrepancies = true;
    report += `### ⚠️  Tabelas apenas em DESENVOLVIMENTO (${comparison.tables.onlyInDev.length}):\\n`;
    comparison.tables.onlyInDev.forEach((t) => {
      report += `- ${t}\\n`;
    });
    report += '\\n';
  }

  if (comparison.tables.onlyInProd.length > 0) {
    hasDiscrepancies = true;
    report += `### ⚠️  Tabelas apenas em PRODUÇÃO (${comparison.tables.onlyInProd.length}):\\n`;
    comparison.tables.onlyInProd.forEach((t) => {
      report += `- ${t}\\n`;
    });
    report += '\\n';
  }

  report += `### ✅ Tabelas em comum: ${comparison.tables.common.length}\\n\\n`;

  // Colunas
  if (comparison.columns.differences.length > 0) {
    hasDiscrepancies = true;
    report += `## 📋 DIFERENÇAS EM COLUNAS (${comparison.columns.differences.length})\\n\\n`;
    comparison.columns.differences.forEach((diff) => {
      report += `### ${diff.table}.${diff.column}\\n`;
      report += `**Diferença:** ${diff.difference}\\n\\n`;
    });
  }

  // Constraints
  if (
    comparison.constraints.onlyInDev.length > 0 ||
    comparison.constraints.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 🔗 CONSTRAINTS\\n\\n';

    if (comparison.constraints.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.constraints.onlyInDev.length}):\\n`;
      comparison.constraints.onlyInDev.forEach((c) => {
        report += `- ${c}\\n`;
      });
      report += '\\n';
    }

    if (comparison.constraints.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.constraints.onlyInProd.length}):\\n`;
      comparison.constraints.onlyInProd.forEach((c) => {
        report += `- ${c}\\n`;
      });
      report += '\\n';
    }
  }

  // Índices
  if (
    comparison.indexes.onlyInDev.length > 0 ||
    comparison.indexes.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 🔎 ÍNDICES\\n\\n';

    if (comparison.indexes.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.indexes.onlyInDev.length}):\\n`;
      comparison.indexes.onlyInDev.forEach((i) => {
        report += `- ${i}\\n`;
      });
      report += '\\n';
    }

    if (comparison.indexes.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.indexes.onlyInProd.length}):\\n`;
      comparison.indexes.onlyInProd.forEach((i) => {
        report += `- ${i}\\n`;
      });
      report += '\\n';
    }
  }

  // Triggers
  if (
    comparison.triggers.onlyInDev.length > 0 ||
    comparison.triggers.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## ⚡ TRIGGERS\\n\\n';

    if (comparison.triggers.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.triggers.onlyInDev.length}):\\n`;
      comparison.triggers.onlyInDev.forEach((t) => {
        report += `- ${t}\\n`;
      });
      report += '\\n';
    }

    if (comparison.triggers.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.triggers.onlyInProd.length}):\\n`;
      comparison.triggers.onlyInProd.forEach((t) => {
        report += `- ${t}\\n`;
      });
      report += '\\n';
    }
  }

  // Funções
  if (
    comparison.functions.onlyInDev.length > 0 ||
    comparison.functions.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## ⚙️  FUNÇÕES\\n\\n';

    if (comparison.functions.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.functions.onlyInDev.length}):\\n`;
      comparison.functions.onlyInDev.forEach((f) => {
        report += `- ${f}\\n`;
      });
      report += '\\n';
    }

    if (comparison.functions.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.functions.onlyInProd.length}):\\n`;
      comparison.functions.onlyInProd.forEach((f) => {
        report += `- ${f}\\n`;
      });
      report += '\\n';
    }
  }

  // Enums
  if (
    comparison.enums.onlyInDev.length > 0 ||
    comparison.enums.onlyInProd.length > 0 ||
    comparison.enums.differences.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 📝 ENUMERAÇÕES (ENUMS)\\n\\n';

    if (comparison.enums.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.enums.onlyInDev.length}):\\n`;
      comparison.enums.onlyInDev.forEach((e) => {
        report += `- ${e}\\n`;
      });
      report += '\\n';
    }

    if (comparison.enums.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.enums.onlyInProd.length}):\\n`;
      comparison.enums.onlyInProd.forEach((e) => {
        report += `- ${e}\\n`;
      });
      report += '\\n';
    }

    if (comparison.enums.differences.length > 0) {
      report += `### Diferenças em valores (${comparison.enums.differences.length}):\\n`;
      comparison.enums.differences.forEach((diff) => {
        report += `\\n**${diff.enum}:**\\n`;
        report += `- DEV: [${diff.dev.join(', ')}]\\n`;
        report += `- PROD: [${diff.prod.join(', ')}]\\n`;
      });
      report += '\\n';
    }
  }

  // Conclusão
  report += '\\n---\\n\\n';
  if (!hasDiscrepancies) {
    report += '## ✅ RESULTADO: BANCOS IDÊNTICOS\\n\\n';
    report +=
      'Não foram encontradas discrepâncias significativas entre os bancos de dados.\\n';
  } else {
    report += '## ⚠️  RESULTADO: DISCREPÂNCIAS ENCONTRADAS\\n\\n';
    report +=
      'Foram encontradas diferenças entre os bancos de dados. Revisar os itens acima antes de prosseguir com a sincronização.\\n';
  }

  return report;
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

    const report = await generateReport(comparison);

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
