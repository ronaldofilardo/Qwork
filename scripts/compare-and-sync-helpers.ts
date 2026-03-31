import { Pool } from 'pg';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TableInfo {
  table_name: string;
  table_schema: string;
}

export interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

export interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  definition: string;
}

export interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

export interface TriggerInfo {
  trigger_name: string;
  event_manipulation: string;
  event_object_table: string;
  action_statement: string;
  action_timing: string;
}

export interface FunctionInfo {
  routine_name: string;
  routine_type: string;
  data_type: string;
  routine_definition: string | null;
}

export interface EnumInfo {
  enum_name: string;
  enum_values: string[];
}

export interface ComparisonResult {
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

// ---------------------------------------------------------------------------
// Funções de consulta ao banco
// ---------------------------------------------------------------------------

export async function getTables(pool: Pool): Promise<TableInfo[]> {
  const result = await pool.query<TableInfo>(`
    SELECT table_name, table_schema
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows;
}

export async function getColumns(pool: Pool): Promise<ColumnInfo[]> {
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

export async function getConstraints(pool: Pool): Promise<ConstraintInfo[]> {
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

export async function getIndexes(pool: Pool): Promise<IndexInfo[]> {
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

export async function getTriggers(pool: Pool): Promise<TriggerInfo[]> {
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

export async function getFunctions(pool: Pool): Promise<FunctionInfo[]> {
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

export async function getEnums(pool: Pool): Promise<EnumInfo[]> {
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

// ---------------------------------------------------------------------------
// Geração de relatório
// ---------------------------------------------------------------------------

export async function generateReport(
  comparison: ComparisonResult,
  devDbName: string,
  prodDbName: string
): Promise<string> {
  let report = '# RELATÓRIO DE COMPARAÇÃO DE BANCOS DE DADOS\n\n';
  report += `Data: ${new Date().toISOString()}\n\n`;
  report += `**${devDbName}** vs **${prodDbName}**\n\n`;

  let hasDiscrepancies = false;

  // Tabelas
  report += '## 📊 TABELAS\n\n';
  if (comparison.tables.onlyInDev.length > 0) {
    hasDiscrepancies = true;
    report += `### ⚠️  Tabelas apenas em DESENVOLVIMENTO (${comparison.tables.onlyInDev.length}):\n`;
    comparison.tables.onlyInDev.forEach((t) => {
      report += `- ${t}\n`;
    });
    report += '\n';
  }

  if (comparison.tables.onlyInProd.length > 0) {
    hasDiscrepancies = true;
    report += `### ⚠️  Tabelas apenas em PRODUÇÃO (${comparison.tables.onlyInProd.length}):\n`;
    comparison.tables.onlyInProd.forEach((t) => {
      report += `- ${t}\n`;
    });
    report += '\n';
  }

  report += `### ✅ Tabelas em comum: ${comparison.tables.common.length}\n\n`;

  // Colunas
  if (comparison.columns.differences.length > 0) {
    hasDiscrepancies = true;
    report += `## 📋 DIFERENÇAS EM COLUNAS (${comparison.columns.differences.length})\n\n`;
    comparison.columns.differences.forEach((diff) => {
      report += `### ${diff.table}.${diff.column}\n`;
      report += `**Diferença:** ${diff.difference}\n\n`;
    });
  }

  // Constraints
  if (
    comparison.constraints.onlyInDev.length > 0 ||
    comparison.constraints.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 🔗 CONSTRAINTS\n\n';

    if (comparison.constraints.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.constraints.onlyInDev.length}):\n`;
      comparison.constraints.onlyInDev.forEach((c) => {
        report += `- ${c}\n`;
      });
      report += '\n';
    }

    if (comparison.constraints.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.constraints.onlyInProd.length}):\n`;
      comparison.constraints.onlyInProd.forEach((c) => {
        report += `- ${c}\n`;
      });
      report += '\n';
    }
  }

  // Índices
  if (
    comparison.indexes.onlyInDev.length > 0 ||
    comparison.indexes.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 🔎 ÍNDICES\n\n';

    if (comparison.indexes.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.indexes.onlyInDev.length}):\n`;
      comparison.indexes.onlyInDev.forEach((i) => {
        report += `- ${i}\n`;
      });
      report += '\n';
    }

    if (comparison.indexes.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.indexes.onlyInProd.length}):\n`;
      comparison.indexes.onlyInProd.forEach((i) => {
        report += `- ${i}\n`;
      });
      report += '\n';
    }
  }

  // Triggers
  if (
    comparison.triggers.onlyInDev.length > 0 ||
    comparison.triggers.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## ⚡ TRIGGERS\n\n';

    if (comparison.triggers.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.triggers.onlyInDev.length}):\n`;
      comparison.triggers.onlyInDev.forEach((t) => {
        report += `- ${t}\n`;
      });
      report += '\n';
    }

    if (comparison.triggers.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.triggers.onlyInProd.length}):\n`;
      comparison.triggers.onlyInProd.forEach((t) => {
        report += `- ${t}\n`;
      });
      report += '\n';
    }
  }

  // Funções
  if (
    comparison.functions.onlyInDev.length > 0 ||
    comparison.functions.onlyInProd.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## ⚙️  FUNÇÕES\n\n';

    if (comparison.functions.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.functions.onlyInDev.length}):\n`;
      comparison.functions.onlyInDev.forEach((f) => {
        report += `- ${f}\n`;
      });
      report += '\n';
    }

    if (comparison.functions.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.functions.onlyInProd.length}):\n`;
      comparison.functions.onlyInProd.forEach((f) => {
        report += `- ${f}\n`;
      });
      report += '\n';
    }
  }

  // Enums
  if (
    comparison.enums.onlyInDev.length > 0 ||
    comparison.enums.onlyInProd.length > 0 ||
    comparison.enums.differences.length > 0
  ) {
    hasDiscrepancies = true;
    report += '## 📝 ENUMERAÇÕES (ENUMS)\n\n';

    if (comparison.enums.onlyInDev.length > 0) {
      report += `### Apenas em DESENVOLVIMENTO (${comparison.enums.onlyInDev.length}):\n`;
      comparison.enums.onlyInDev.forEach((e) => {
        report += `- ${e}\n`;
      });
      report += '\n';
    }

    if (comparison.enums.onlyInProd.length > 0) {
      report += `### Apenas em PRODUÇÃO (${comparison.enums.onlyInProd.length}):\n`;
      comparison.enums.onlyInProd.forEach((e) => {
        report += `- ${e}\n`;
      });
      report += '\n';
    }

    if (comparison.enums.differences.length > 0) {
      report += `### Diferenças em valores (${comparison.enums.differences.length}):\n`;
      comparison.enums.differences.forEach((diff) => {
        report += `\n**${diff.enum}:**\n`;
        report += `- DEV: [${diff.dev.join(', ')}]\n`;
        report += `- PROD: [${diff.prod.join(', ')}]\n`;
      });
      report += '\n';
    }
  }

  // Conclusão
  report += '\n---\n\n';
  if (!hasDiscrepancies) {
    report += '## ✅ RESULTADO: BANCOS IDÊNTICOS\n\n';
    report +=
      'Não foram encontradas discrepâncias significativas entre os bancos de dados.\n';
  } else {
    report += '## ⚠️  RESULTADO: DISCREPÂNCIAS ENCONTRADAS\n\n';
    report +=
      'Foram encontradas diferenças entre os bancos de dados. Revisar os itens acima antes de prosseguir com a sincronização.\n';
  }

  return report;
}
