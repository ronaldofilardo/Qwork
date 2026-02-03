import { query } from '../lib/db';

interface EnumValue {
  enumlabel: string;
  enumsortorder: number;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  udt_name: string;
}

interface ConstraintInfo {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  definition: string;
}

async function compareEnums(env: string) {
  console.log(`\n📊 Analisando ENUMS em ${env}...`);
  const result = await query(`
    SELECT 
      t.typname as enum_name,
      e.enumlabel,
      e.enumsortorder
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    ORDER BY t.typname, e.enumsortorder
  `);

  const enums = new Map<string, EnumValue[]>();
  result.rows.forEach((row: any) => {
    if (!enums.has(row.enum_name)) {
      enums.set(row.enum_name, []);
    }
    enums.get(row.enum_name)!.push({
      enumlabel: row.enumlabel,
      enumsortorder: row.enumsortorder,
    });
  });

  return enums;
}

async function compareTables(env: string) {
  console.log(`\n📋 Analisando TABELAS em ${env}...`);
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  return new Set(result.rows.map((r: any) => r.table_name));
}

async function compareColumns(env: string) {
  console.log(`\n🔍 Analisando COLUNAS em ${env}...`);
  const result = await query(`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const columns = new Map<string, ColumnInfo[]>();
  result.rows.forEach((row: any) => {
    const tableName = row.table_name;
    if (!columns.has(tableName)) {
      columns.set(tableName, []);
    }
    columns.get(tableName)!.push(row);
  });

  return columns;
}

async function compareConstraints(env: string) {
  console.log(`\n🔒 Analisando CONSTRAINTS em ${env}...`);
  const result = await query(`
    SELECT 
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      COALESCE(cc.check_clause, '') as definition
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.check_constraints cc 
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('CHECK', 'UNIQUE', 'PRIMARY KEY')
    ORDER BY tc.table_name, tc.constraint_name
  `);

  return result.rows as ConstraintInfo[];
}

async function compareIndexes(env: string) {
  console.log(`\n📑 Analisando ÍNDICES em ${env}...`);
  const result = await query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  return result.rows;
}

async function main() {
  console.log('🔍 COMPARAÇÃO COMPLETA: Desenvolvimento vs Produção\n');
  console.log('='.repeat(80));

  // Conectar ao desenvolvimento
  process.env.DATABASE_URL =
    'postgresql://postgres:postgres@localhost:5432/qwork_dev?sslmode=disable';

  console.log('\n🏠 DESENVOLVIMENTO (Local)');
  console.log('='.repeat(80));
  const devEnums = await compareEnums('DESENVOLVIMENTO');
  const devTables = await compareTables('DESENVOLVIMENTO');
  const devColumns = await compareColumns('DESENVOLVIMENTO');
  const devConstraints = await compareConstraints('DESENVOLVIMENTO');
  const devIndexes = await compareIndexes('DESENVOLVIMENTO');

  // Conectar à produção
  delete process.env.DATABASE_URL;

  console.log('\n\n🌐 PRODUÇÃO (Neon)');
  console.log('='.repeat(80));
  const prodEnums = await compareEnums('PRODUÇÃO');
  const prodTables = await compareTables('PRODUÇÃO');
  const prodColumns = await compareColumns('PRODUÇÃO');
  const prodConstraints = await compareConstraints('PRODUÇÃO');
  const prodIndexes = await compareIndexes('PRODUÇÃO');

  // COMPARAR ENUMS
  console.log('\n\n🔴 DIFERENÇAS ENCONTRADAS');
  console.log('='.repeat(80));
  console.log('\n📊 ENUMS:');

  let hasEnumDiff = false;
  const allEnumNames = new Set([...devEnums.keys(), ...prodEnums.keys()]);

  for (const enumName of allEnumNames) {
    const devValues = devEnums.get(enumName);
    const prodValues = prodEnums.get(enumName);

    if (!devValues) {
      console.log(`\n❌ ENUM "${enumName}" existe em PRODUÇÃO mas NÃO em DEV`);
      hasEnumDiff = true;
    } else if (!prodValues) {
      console.log(`\n❌ ENUM "${enumName}" existe em DEV mas NÃO em PRODUÇÃO`);
      console.log(
        `   Valores: ${devValues.map((v) => v.enumlabel).join(', ')}`
      );
      hasEnumDiff = true;
    } else {
      const devLabels = devValues.map((v) => v.enumlabel).sort();
      const prodLabels = prodValues.map((v) => v.enumlabel).sort();

      if (JSON.stringify(devLabels) !== JSON.stringify(prodLabels)) {
        console.log(`\n⚠️  ENUM "${enumName}" tem valores DIFERENTES:`);
        console.log(`   DEV:  [${devLabels.join(', ')}]`);
        console.log(`   PROD: [${prodLabels.join(', ')}]`);

        const missingInProd = devLabels.filter((l) => !prodLabels.includes(l));
        const missingInDev = prodLabels.filter((l) => !devLabels.includes(l));

        if (missingInProd.length > 0) {
          console.log(`   ➕ Adicionar em PROD: ${missingInProd.join(', ')}`);
        }
        if (missingInDev.length > 0) {
          console.log(`   ➖ Remover de PROD: ${missingInDev.join(', ')}`);
        }
        hasEnumDiff = true;
      }
    }
  }

  if (!hasEnumDiff) {
    console.log('✅ Todos os enums estão sincronizados');
  }

  // COMPARAR TABELAS
  console.log('\n\n📋 TABELAS:');
  let hasTableDiff = false;

  const missingInProd = [...devTables].filter((t) => !prodTables.has(t));
  const missingInDev = [...prodTables].filter((t) => !devTables.has(t));

  if (missingInProd.length > 0) {
    console.log(`\n❌ Tabelas em DEV mas NÃO em PROD:`);
    missingInProd.forEach((t) => console.log(`   - ${t}`));
    hasTableDiff = true;
  }

  if (missingInDev.length > 0) {
    console.log(`\n❌ Tabelas em PROD mas NÃO em DEV:`);
    missingInDev.forEach((t) => console.log(`   - ${t}`));
    hasTableDiff = true;
  }

  if (!hasTableDiff) {
    console.log('✅ Todas as tabelas estão sincronizadas');
  }

  // COMPARAR COLUNAS
  console.log('\n\n🔍 COLUNAS (apenas tabelas comuns):');
  let hasColumnDiff = false;

  const commonTables = [...devTables].filter((t) => prodTables.has(t));

  for (const tableName of commonTables.sort()) {
    const devCols = devColumns.get(tableName) || [];
    const prodCols = prodColumns.get(tableName) || [];

    const devColMap = new Map(devCols.map((c) => [c.column_name, c]));
    const prodColMap = new Map(prodCols.map((c) => [c.column_name, c]));

    const devColNames = new Set(devCols.map((c) => c.column_name));
    const prodColNames = new Set(prodCols.map((c) => c.column_name));

    const missingInProdCols = [...devColNames].filter(
      (c) => !prodColNames.has(c)
    );
    const missingInDevCols = [...prodColNames].filter(
      (c) => !devColNames.has(c)
    );

    let tableDiff = false;

    if (missingInProdCols.length > 0) {
      if (!tableDiff) {
        console.log(`\n⚠️  Tabela "${tableName}":`);
        tableDiff = true;
      }
      console.log(
        `   ❌ Colunas em DEV mas NÃO em PROD: ${missingInProdCols.join(', ')}`
      );
      hasColumnDiff = true;
    }

    if (missingInDevCols.length > 0) {
      if (!tableDiff) {
        console.log(`\n⚠️  Tabela "${tableName}":`);
        tableDiff = true;
      }
      console.log(
        `   ❌ Colunas em PROD mas NÃO em DEV: ${missingInDevCols.join(', ')}`
      );
      hasColumnDiff = true;
    }

    // Comparar tipos de colunas comuns
    const commonCols = [...devColNames].filter((c) => prodColNames.has(c));
    for (const colName of commonCols) {
      const devCol = devColMap.get(colName)!;
      const prodCol = prodColMap.get(colName)!;

      if (devCol.udt_name !== prodCol.udt_name) {
        if (!tableDiff) {
          console.log(`\n⚠️  Tabela "${tableName}":`);
          tableDiff = true;
        }
        console.log(`   ⚠️  Coluna "${colName}" com TIPO diferente:`);
        console.log(`      DEV:  ${devCol.udt_name}`);
        console.log(`      PROD: ${prodCol.udt_name}`);
        hasColumnDiff = true;
      }

      if (devCol.is_nullable !== prodCol.is_nullable) {
        if (!tableDiff) {
          console.log(`\n⚠️  Tabela "${tableName}":`);
          tableDiff = true;
        }
        console.log(`   ⚠️  Coluna "${colName}" NULLABLE diferente:`);
        console.log(`      DEV:  ${devCol.is_nullable}`);
        console.log(`      PROD: ${prodCol.is_nullable}`);
        hasColumnDiff = true;
      }
    }
  }

  if (!hasColumnDiff) {
    console.log('✅ Todas as colunas estão sincronizadas');
  }

  // COMPARAR CONSTRAINTS
  console.log('\n\n🔒 CONSTRAINTS:');
  let hasConstraintDiff = false;

  const devConstraintMap = new Map(
    devConstraints.map((c) => [`${c.table_name}.${c.constraint_name}`, c])
  );
  const prodConstraintMap = new Map(
    prodConstraints.map((c) => [`${c.table_name}.${c.constraint_name}`, c])
  );

  const allConstraintKeys = new Set([
    ...devConstraintMap.keys(),
    ...prodConstraintMap.keys(),
  ]);

  for (const key of [...allConstraintKeys].sort()) {
    const devConstraint = devConstraintMap.get(key);
    const prodConstraint = prodConstraintMap.get(key);

    if (!devConstraint) {
      console.log(`\n❌ Constraint "${key}" existe em PROD mas NÃO em DEV`);
      hasConstraintDiff = true;
    } else if (!prodConstraint) {
      console.log(`\n❌ Constraint "${key}" existe em DEV mas NÃO em PROD`);
      console.log(`   Tipo: ${devConstraint.constraint_type}`);
      if (devConstraint.definition) {
        console.log(`   Definição: ${devConstraint.definition}`);
      }
      hasConstraintDiff = true;
    } else if (devConstraint.definition !== prodConstraint.definition) {
      console.log(`\n⚠️  Constraint "${key}" tem DEFINIÇÃO diferente:`);
      console.log(`   DEV:  ${devConstraint.definition}`);
      console.log(`   PROD: ${prodConstraint.definition}`);
      hasConstraintDiff = true;
    }
  }

  if (!hasConstraintDiff) {
    console.log('✅ Todas as constraints estão sincronizadas');
  }

  // RESUMO
  console.log('\n\n📊 RESUMO DA COMPARAÇÃO');
  console.log('='.repeat(80));
  console.log(`Enums diferentes: ${hasEnumDiff ? '❌ SIM' : '✅ NÃO'}`);
  console.log(`Tabelas diferentes: ${hasTableDiff ? '❌ SIM' : '✅ NÃO'}`);
  console.log(`Colunas diferentes: ${hasColumnDiff ? '❌ SIM' : '✅ NÃO'}`);
  console.log(
    `Constraints diferentes: ${hasConstraintDiff ? '❌ SIM' : '✅ NÃO'}`
  );

  if (!hasEnumDiff && !hasTableDiff && !hasColumnDiff && !hasConstraintDiff) {
    console.log('\n✅ ✅ ✅ BANCOS TOTALMENTE SINCRONIZADOS! ✅ ✅ ✅');
  } else {
    console.log(
      '\n⚠️  ⚠️  ⚠️  BANCOS DESSINCRONIZADOS - AÇÃO NECESSÁRIA ⚠️  ⚠️  ⚠️'
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erro na comparação:', err);
  process.exit(1);
});
