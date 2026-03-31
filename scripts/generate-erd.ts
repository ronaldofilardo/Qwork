/**
 * scripts/generate-erd.ts
 *
 * ERD gerado de COMMENT ON TABLE / COMMENT ON COLUMN do banco PostgreSQL
 *
 * Gera docs/erd.md com diagrama Mermaid erDiagram organizado por domínio.
 * Inclui comentários de tabelas e colunas como documentação inline.
 *
 * Uso local:
 *   npx tsx scripts/generate-erd.ts
 *
 * Saída: docs/erd.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import {
  simplifyType,
  sanitizeMermaid,
  assignDomain,
  DOMAIN_RULES,
} from '@/lib/db/schema-validation-utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPK: boolean;
  isFK: boolean;
  comment: string | null;
}

interface FKInfo {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  constraint_name: string;
}

interface TableInfo {
  name: string;
  comment: string | null;
  columns: ColumnInfo[];
  domain: string;
}

// ─── Conexão ──────────────────────────────────────────────────────────────────

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.LOCAL_DATABASE_URL ||
  'postgresql://localhost:5432/nr-bps_db';

const pool = new Pool({ connectionString });

// ─── Helpers ──────────────────────────────────────────────────────────────────────

/** Gera key type para campo Mermaid: PK, FK, UK */
function fieldKey(col: ColumnInfo): string {
  if (col.isPK && col.isFK) return ' PK,FK';
  if (col.isPK) return ' PK';
  if (col.isFK) return ' FK';
  return '';
}

// ─── Domínios ──────────────────────────────────────────────────────────────────

async function loadTableComments(
  client: import('pg').PoolClient
): Promise<Map<string, string>> {
  const res = await client.query<{ relname: string; description: string }>(
    `SELECT c.relname, d.description
     FROM pg_catalog.pg_class c
     JOIN pg_catalog.pg_description d
       ON d.objoid = c.oid AND d.objsubid = 0
     WHERE c.relkind = 'r'
       AND c.relnamespace = (
         SELECT oid FROM pg_namespace WHERE nspname = 'public'
       )`
  );
  return new Map(res.rows.map((r) => [r.relname, r.description]));
}

async function loadColumnComments(
  client: import('pg').PoolClient
): Promise<Map<string, string>> {
  // key: "tablename.columnname"
  const res = await client.query<{
    relname: string;
    attname: string;
    description: string;
  }>(
    `SELECT c.relname, a.attname, d.description
     FROM pg_catalog.pg_class c
     JOIN pg_catalog.pg_attribute a
       ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     JOIN pg_catalog.pg_description d
       ON d.objoid = c.oid AND d.objsubid = a.attnum
     WHERE c.relkind = 'r'
       AND c.relnamespace = (
         SELECT oid FROM pg_namespace WHERE nspname = 'public'
       )`
  );
  return new Map(
    res.rows.map((r) => [`${r.relname}.${r.attname}`, r.description])
  );
}

async function loadColumns(
  client: import('pg').PoolClient,
  pkMap: Map<string, Set<string>>,
  fkColumns: Map<string, Set<string>>,
  columnComments: Map<string, string>
): Promise<Map<string, ColumnInfo[]>> {
  const res = await client.query<{
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    character_maximum_length: string | null;
    is_nullable: string;
  }>(
    `SELECT table_name, column_name, data_type, udt_name,
            character_maximum_length, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`
  );

  const map = new Map<string, ColumnInfo[]>();
  for (const row of res.rows) {
    if (!map.has(row.table_name)) map.set(row.table_name, []);
    let type = row.data_type === 'USER-DEFINED' ? row.udt_name : row.data_type;
    // Simplificar tipo para Mermaid
    type = simplifyType(type, row.character_maximum_length);
    const pkCols = pkMap.get(row.table_name) ?? new Set();
    const fkCols = fkColumns.get(row.table_name) ?? new Set();

    const colList = map.get(row.table_name) ?? [];
    map.set(row.table_name, colList);
    colList.push({
      name: row.column_name,
      type,
      nullable: row.is_nullable === 'YES',
      isPK: pkCols.has(row.column_name),
      isFK: fkCols.has(row.column_name),
      comment:
        columnComments.get(`${row.table_name}.${row.column_name}`) ?? null,
    });
  }
  return map;
}

async function loadPKs(
  client: import('pg').PoolClient
): Promise<Map<string, Set<string>>> {
  const res = await client.query<{ table_name: string; column_name: string }>(
    `SELECT tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'PRIMARY KEY'
       AND tc.table_schema = 'public'`
  );
  const map = new Map<string, Set<string>>();
  for (const row of res.rows) {
    let s = map.get(row.table_name);
    if (!s) {
      s = new Set();
      map.set(row.table_name, s);
    }
    s.add(row.column_name);
  }
  return map;
}

async function loadFKs(client: import('pg').PoolClient): Promise<FKInfo[]> {
  const res = await client.query<{
    from_table: string;
    from_column: string;
    to_table: string;
    to_column: string;
    constraint_name: string;
  }>(
    `SELECT
       tc.table_name        AS from_table,
       kcu.column_name      AS from_column,
       ccu.table_name       AS to_table,
       ccu.column_name      AS to_column,
       tc.constraint_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
     JOIN information_schema.constraint_column_usage ccu
       ON rc.unique_constraint_name = ccu.constraint_name
       AND rc.unique_constraint_schema = ccu.constraint_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
     ORDER BY tc.table_name, kcu.column_name`
  );
  return res.rows;
}

// ─── Geração Mermaid ──────────────────────────────────────────────────────────

function renderEntityBlock(table: TableInfo): string {
  const lines: string[] = [];
  const tableComment = table.comment
    ? ` %% ${sanitizeMermaid(table.comment)}`
    : '';
  lines.push(`  ${table.name} {${tableComment}`);

  for (const col of table.columns) {
    const key = fieldKey(col);
    const comment = col.comment ? ` "${sanitizeMermaid(col.comment)}"` : '';
    lines.push(`    ${col.type} ${col.name}${key}${comment}`);
  }

  lines.push('  }');
  return lines.join('\n');
}

function cardinalityForFK(_fk: FKInfo): string {
  // Assume N:1 (many-to-one) padrão — a coluna FK pode ser NOT NULL (||) ou NULL (o|)
  // Sem analisar nullable aqui para manter simples — use }o--||
  return '}o--||';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const OUTPUT_PATH = path.join(process.cwd(), 'docs', 'erd.md');

async function main(): Promise<void> {
  console.log('[generate-erd] Conectando ao banco...');
  const client = await pool.connect();

  try {
    // Carregar tudo em paralelo
    const [tableComments, columnComments, pkMap, fks] = await Promise.all([
      loadTableComments(client),
      loadColumnComments(client),
      loadPKs(client),
      loadFKs(client),
    ]);

    // Colunas FK por tabela (para marcar isFK)
    const fkColumns = new Map<string, Set<string>>();
    for (const fk of fks) {
      let fkSet = fkColumns.get(fk.from_table);
      if (!fkSet) {
        fkSet = new Set();
        fkColumns.set(fk.from_table, fkSet);
      }
      fkSet.add(fk.from_column);
    }

    const columnMap = await loadColumns(
      client,
      pkMap,
      fkColumns,
      columnComments
    );

    // Listar todas as tabelas
    const tablesRes = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    const tableNames = tablesRes.rows.map((r) => r.tablename);

    // Montar TableInfo
    const tables: TableInfo[] = tableNames.map((name) => ({
      name,
      comment: tableComments.get(name) ?? null,
      columns: columnMap.get(name) ?? [],
      domain: assignDomain(name),
    }));

    // Agrupar por domínio
    const domainMap = new Map<string, TableInfo[]>();
    for (const table of tables) {
      let domList = domainMap.get(table.domain);
      if (!domList) {
        domList = [];
        domainMap.set(table.domain, domList);
      }
      domList.push(table);
    }

    // Ordem dos domínios
    const DOMAIN_ORDER = [
      'Foundation',
      'Identidade',
      'Entidades & Comercial',
      'Avaliações & Laudos',
      'Financeiro & Notificações',
      'Outros',
    ];

    const timestamp = new Date().toISOString();
    const lines: string[] = [
      '# ERD — QWork Database',
      '',
      `> Gerado automaticamente em: ${timestamp}`,
      '> Para regenerar: `pnpm db:erd`',
      '',
      '## Índice de Domínios',
      '',
    ];

    // Índice
    for (const domainName of DOMAIN_ORDER) {
      const rule = DOMAIN_RULES.find((r) => r.domain === domainName);
      const emoji = rule?.emoji ?? '📦';
      const count = domainMap.get(domainName)?.length ?? 0;
      if (count > 0) {
        const anchor = domainName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+$/, '');
        lines.push(
          `- [${emoji} ${domainName}](#${anchor}) — ${count} tabela(s)`
        );
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // Seções por domínio
    for (const domainName of DOMAIN_ORDER) {
      const domainTables = domainMap.get(domainName);
      if (!domainTables || domainTables.length === 0) continue;

      const rule = DOMAIN_RULES.find((r) => r.domain === domainName);
      const emoji = rule?.emoji ?? '📦';

      lines.push(`## ${emoji} ${domainName}`);
      lines.push('');

      // Comentários de tabelas como legenda
      const withComments = domainTables.filter((t) => t.comment);
      if (withComments.length > 0) {
        lines.push('**Tabelas:**');
        lines.push('');
        for (const t of withComments) {
          lines.push(`- \`${t.name}\` — ${t.comment}`);
        }
        lines.push('');
      }

      lines.push('```mermaid');
      lines.push('erDiagram');

      // Entidades
      for (const table of domainTables) {
        lines.push(renderEntityBlock(table));
      }

      // Relações FK dentro do domínio + cross-domain
      const domainTableNames = new Set(domainTables.map((t) => t.name));
      // FKs onde from_table está neste domínio
      const relevantFKs = fks.filter((fk) =>
        domainTableNames.has(fk.from_table)
      );

      // Deduplicar por from_table + to_table (múltiplas FKs entre mesmo par)
      const seen = new Set<string>();
      for (const fk of relevantFKs) {
        const key = `${fk.from_table}--${fk.to_table}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const card = cardinalityForFK(fk);
        lines.push(
          `  ${fk.from_table} ${card} ${fk.to_table} : "${fk.from_column}"`
        );
      }

      lines.push('```');
      lines.push('');
    }

    // Estatísticas finais
    lines.push('---');
    lines.push('');
    lines.push('## 📊 Estatísticas');
    lines.push('');
    lines.push(`| Metrica | Valor |`);
    lines.push(`|---------|-------|`);
    lines.push(`| Total de tabelas | ${tables.length} |`);
    lines.push(`| Total de FKs | ${fks.length} |`);
    lines.push(`| Tabelas com COMMENT | ${[...tableComments.keys()].length} |`);
    lines.push(
      `| Colunas com COMMENT | ${[...columnComments.keys()].length} |`
    );
    for (const domainName of DOMAIN_ORDER) {
      const count = domainMap.get(domainName)?.length ?? 0;
      if (count > 0) {
        const rule = DOMAIN_RULES.find((r) => r.domain === domainName);
        const emoji = rule?.emoji ?? '📦';
        lines.push(`| ${emoji} ${domainName} | ${count} tabelas |`);
      }
    }
    lines.push('');

    const output = lines.join('\n');
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log(`[generate-erd] ✅ ERD salvo em: ${OUTPUT_PATH}`);
    console.log(
      `[generate-erd] Tabelas: ${tables.length} | FKs: ${fks.length}`
    );
    console.log(
      `[generate-erd] Tabelas com COMMENT: ${tableComments.size} | Colunas com COMMENT: ${columnComments.size}`
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[generate-erd] Erro fatal:', err);
  process.exit(1);
});
