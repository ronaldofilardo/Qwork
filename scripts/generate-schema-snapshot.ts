/**
 * scripts/generate-schema-snapshot.ts
 *
 * ESC-4: Gera um snapshot consolidado do schema atual do banco de dados.
 * Itera pelas tabelas, colunas, constraints, índices e funções via information_schema.
 *
 * Uso:
 *   npx tsx scripts/generate-schema-snapshot.ts
 *
 * Saída: database/schemas/schema-snapshot.sql
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

// Carregar .env.local se existir
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://localhost:5432/nr-bps_db';

const pool = new Pool({ connectionString });

async function getTableDDL(client: any, tableName: string): Promise<string> {
  const columnsRes = await client.query(
    `SELECT
       c.column_name,
       c.data_type,
       c.character_maximum_length,
       c.numeric_precision,
       c.numeric_scale,
       c.is_nullable,
       c.column_default,
       c.udt_name
     FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = $1
     ORDER BY c.ordinal_position`,
    [tableName]
  );

  const constraintsRes = await client.query(
    `SELECT
       tc.constraint_name,
       tc.constraint_type,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name,
       rc.update_rule,
       rc.delete_rule
     FROM information_schema.table_constraints tc
     LEFT JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     LEFT JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
     LEFT JOIN information_schema.constraint_column_usage ccu
       ON rc.unique_constraint_name = ccu.constraint_name
       AND rc.unique_constraint_schema = ccu.constraint_schema
     WHERE tc.table_schema = 'public' AND tc.table_name = $1
     ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position`,
    [tableName]
  );

  const indexesRes = await client.query(
    `SELECT indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = $1
     ORDER BY indexname`,
    [tableName]
  );

  // Build column definitions
  const columnDefs = columnsRes.rows.map((col: any) => {
    let type = col.data_type === 'USER-DEFINED' ? col.udt_name : col.data_type;
    if (col.character_maximum_length)
      type += `(${col.character_maximum_length})`;
    else if (col.numeric_precision && col.data_type === 'numeric') {
      type +=
        col.numeric_scale != null
          ? `(${col.numeric_precision},${col.numeric_scale})`
          : `(${col.numeric_precision})`;
    }
    const nullable = col.is_nullable === 'NO' ? ' NOT NULL' : '';
    const defaultVal = col.column_default
      ? ` DEFAULT ${col.column_default}`
      : '';
    return `    ${col.column_name} ${type}${nullable}${defaultVal}`;
  });

  // Build constraint definitions
  const constraintMap: Record<string, string[]> = {};
  for (const c of constraintsRes.rows) {
    if (!c.constraint_name) continue;
    if (!constraintMap[c.constraint_name]) {
      constraintMap[c.constraint_name] = [];
    }
    if (c.column_name) constraintMap[c.constraint_name].push(c.column_name);
  }

  const inlineConstraints: string[] = [];
  const seenConstraints = new Set<string>();
  for (const c of constraintsRes.rows) {
    if (!c.constraint_name || seenConstraints.has(c.constraint_name)) continue;
    seenConstraints.add(c.constraint_name);
    const cols = constraintMap[c.constraint_name] ?? [];

    if (c.constraint_type === 'PRIMARY KEY') {
      inlineConstraints.push(
        `    CONSTRAINT ${c.constraint_name} PRIMARY KEY (${cols.join(', ')})`
      );
    } else if (c.constraint_type === 'UNIQUE') {
      inlineConstraints.push(
        `    CONSTRAINT ${c.constraint_name} UNIQUE (${cols.join(', ')})`
      );
    } else if (c.constraint_type === 'FOREIGN KEY') {
      const onDelete =
        c.delete_rule && c.delete_rule !== 'NO ACTION'
          ? ` ON DELETE ${c.delete_rule}`
          : '';
      const onUpdate =
        c.update_rule && c.update_rule !== 'NO ACTION'
          ? ` ON UPDATE ${c.update_rule}`
          : '';
      inlineConstraints.push(
        `    CONSTRAINT ${c.constraint_name} FOREIGN KEY (${cols.join(', ')}) REFERENCES ${c.foreign_table_name}(${c.foreign_column_name})${onUpdate}${onDelete}`
      );
    }
  }

  const allDefs = [...columnDefs, ...inlineConstraints];
  let ddl = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${allDefs.join(',\n')}\n);\n`;

  // Add non-PK indexes
  const pkIndexPattern = new RegExp(`_pkey$`);
  for (const idx of indexesRes.rows) {
    if (
      !pkIndexPattern.test(idx.indexname) &&
      !idx.indexdef.includes(' UNIQUE ')
    ) {
      ddl += `\n${idx.indexdef};\n`;
    }
  }

  return ddl;
}

async function getEnums(client: any): Promise<string> {
  const res = await client.query(
    `SELECT t.typname, e.enumlabel
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
     ORDER BY t.typname, e.enumsortorder`
  );

  if (res.rows.length === 0) return '';

  const enums: Record<string, string[]> = {};
  for (const row of res.rows) {
    if (!enums[row.typname]) enums[row.typname] = [];
    enums[row.typname].push(`'${row.enumlabel}'`);
  }

  let out = '-- ENUMS\n';
  for (const [name, values] of Object.entries(enums)) {
    out += `CREATE TYPE ${name} AS ENUM (${values.join(', ')});\n`;
  }
  return out + '\n';
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('[schema-snapshot] Conectando ao banco...');

    // Get all user tables ordered by dependency (approximation via FK count)
    const tablesRes = await client.query(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY tablename`
    );

    const tableNames: string[] = tablesRes.rows.map((r: any) => r.tablename);
    console.log(`[schema-snapshot] ${tableNames.length} tabelas encontradas`);

    const timestamp = new Date().toISOString();
    let output = `-- ============================================================
-- QWork - Schema Snapshot
-- Gerado automaticamente em: ${timestamp}
-- Tabelas: ${tableNames.length}
-- ============================================================
-- ATENÇÃO: Este arquivo é gerado automaticamente.
-- Para regenerar: npx tsx scripts/generate-schema-snapshot.ts
-- ============================================================

SET client_encoding = 'UTF8';
SET check_function_bodies = false;
SET client_min_messages = warning;

`;

    // Enums first
    output += await getEnums(client);

    // Tables
    output += '-- TABELAS\n\n';
    for (const tableName of tableNames) {
      try {
        const ddl = await getTableDDL(client, tableName);
        output += `-- Table: ${tableName}\n${ddl}\n`;
      } catch (err: any) {
        output += `-- ERRO ao gerar DDL para ${tableName}: ${err.message}\n\n`;
      }
    }

    // Migration tracking
    const migRes = await client
      .query(
        `SELECT MAX(version) as max_version, COUNT(*) as total
       FROM schema_migrations
       WHERE executed_at IS NOT NULL`
      )
      .catch(() => ({ rows: [{ max_version: 'N/A', total: 'N/A' }] }));

    if (migRes.rows[0]) {
      const { max_version, total } = migRes.rows[0];
      output += `\n-- Última migration aplicada: ${max_version} (total: ${total})\n`;
    }

    const outPath = path.join(
      process.cwd(),
      'database',
      'schemas',
      'schema-snapshot.sql'
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log(`[schema-snapshot] Snapshot salvo em: ${outPath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[schema-snapshot] Erro:', err);
  process.exit(1);
});
