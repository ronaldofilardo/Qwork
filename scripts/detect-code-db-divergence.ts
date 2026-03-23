/**
 * scripts/detect-code-db-divergence.ts
 *
 * Detecção automática de divergências código ↔ DB
 *
 * Escaneia SQL embutido em arquivos .ts/.tsx de app/, lib/, hooks/
 * e valida que tabelas e colunas referenciadas existem no banco real.
 *
 * Modos:
 *   (padrão): imprime divergências e salva JSON, exit 0
 *   --strict : exit 1 se houver qualquer divergência
 *
 * Uso local:
 *   npx tsx scripts/detect-code-db-divergence.ts
 *   npx tsx scripts/detect-code-db-divergence.ts --strict
 *
 * Saída: database/reports/schema-divergence-report.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import {
  SQL_KEYWORDS,
  extractSqlBlocks,
  extractTableRefs,
  extractColumnRefs,
} from '@/lib/db/schema-validation-utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Divergence {
  type: 'UNKNOWN_TABLE' | 'UNKNOWN_COLUMN';
  file: string;
  line: number;
  table: string;
  column?: string;
  context: string;
}

interface DivergenceReport {
  generated_at: string;
  scanned_files: number;
  total_divergences: number;
  unknown_tables: number;
  unknown_columns: number;
  divergences: Divergence[];
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

// ─── Leitura do schema do banco ───────────────────────────────────────────────

type SchemaMap = Map<string, Set<string>>;

async function loadSchemaMap(): Promise<SchemaMap> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`
    );
    const map: SchemaMap = new Map();
    for (const row of res.rows) {
      let cols = map.get(row.table_name);
      if (!cols) {
        cols = new Set();
        map.set(row.table_name, cols);
      }
      cols.add(row.column_name);
    }
    return map;
  } finally {
    client.release();
  }
}

// ─── Walk de arquivos ─────────────────────────────────────────────────────────

const SCAN_DIRS = ['app', 'lib', 'hooks'];
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'coverage',
  '__tests__',
  'cypress',
  'public',
]);

function walkFiles(dir: string, collected: string[] = []): string[] {
  if (!fs.existsSync(dir)) return collected;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkFiles(path.join(dir, entry.name), collected);
      }
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.test\.|\.spec\./.test(entry.name)
    ) {
      collected.push(path.join(dir, entry.name));
    }
  }
  return collected;
}

// ─── Análise principal ────────────────────────────────────────────────────────

function analyzeFile(
  filePath: string,
  schemaMap: SchemaMap,
  relativeBase: string
): Divergence[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const blocks = extractSqlBlocks(content);
  const divergences: Divergence[] = [];
  const relPath = path.relative(relativeBase, filePath).replace(/\\/g, '/');

  for (const block of blocks) {
    const tableRefs = extractTableRefs(block.sql);
    const columnRefs = extractColumnRefs(block.sql);

    // Verificar tabelas
    const unknownTables = new Set<string>();
    for (const tableName of tableRefs) {
      if (!schemaMap.has(tableName)) {
        unknownTables.add(tableName);
        divergences.push({
          type: 'UNKNOWN_TABLE',
          file: relPath,
          line: block.line,
          table: tableName,
          context: block.sql.slice(0, 120).replace(/\s+/g, ' '),
        });
      }
    }

    // Verificar colunas (apenas em tabelas conhecidas)
    for (const ref of columnRefs) {
      const resolvedTable =
        ref.table && schemaMap.has(ref.table) ? ref.table : null;
      if (!resolvedTable) continue; // tabela não resolvida / alias — pular

      const cols = schemaMap.get(resolvedTable);
      if (cols && !cols.has(ref.column) && !SQL_KEYWORDS.has(ref.column)) {
        divergences.push({
          type: 'UNKNOWN_COLUMN',
          file: relPath,
          line: block.line,
          table: resolvedTable,
          column: ref.column,
          context: block.sql.slice(0, 120).replace(/\s+/g, ' '),
        });
      }
    }
  }

  return divergences;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const REPORT_PATH = path.join(
  process.cwd(),
  'database',
  'reports',
  'schema-divergence-report.json'
);

async function main(): Promise<void> {
  const isStrict = process.argv.includes('--strict');
  const cwd = process.cwd();

  console.log('[divergence] Carregando schema do banco...');
  const schemaMap = await loadSchemaMap();
  console.log(`[divergence] ${schemaMap.size} tabelas carregadas do banco`);

  // Coletar arquivos
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    walkFiles(path.join(cwd, dir), files);
  }
  console.log(
    `[divergence] Escaneando ${files.length} arquivos em ${SCAN_DIRS.join(', ')}...`
  );

  const allDivergences: Divergence[] = [];
  for (const file of files) {
    const divs = analyzeFile(file, schemaMap, cwd);
    allDivergences.push(...divs);
  }

  const unknownTables = allDivergences.filter(
    (d) => d.type === 'UNKNOWN_TABLE'
  ).length;
  const unknownColumns = allDivergences.filter(
    (d) => d.type === 'UNKNOWN_COLUMN'
  ).length;

  const report: DivergenceReport = {
    generated_at: new Date().toISOString(),
    scanned_files: files.length,
    total_divergences: allDivergences.length,
    unknown_tables: unknownTables,
    unknown_columns: unknownColumns,
    divergences: allDivergences,
  };

  // Salvar relatório
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // Console summary
  if (allDivergences.length === 0) {
    console.log('[divergence] ✅ Nenhuma divergência código ↔ DB detectada.');
  } else {
    const level = isStrict ? 'error' : 'warn';
    console[level](
      `[divergence] ⚠️  ${allDivergences.length} divergência(s) encontrada(s):`
    );
    console[level](`  UNKNOWN_TABLE: ${unknownTables}`);
    console[level](`  UNKNOWN_COLUMN: ${unknownColumns}`);
    console[level]('');

    // Listar até 20 divergências no console
    const toShow = allDivergences.slice(0, 20);
    for (const d of toShow) {
      if (d.type === 'UNKNOWN_TABLE') {
        console[level](
          `  [TABELA] ${d.file}:${d.line} — tabela '${d.table}' não existe no banco`
        );
      } else {
        console[level](
          `  [COLUNA] ${d.file}:${d.line} — ${d.table}.${d.column} não existe`
        );
      }
    }
    if (allDivergences.length > 20) {
      console[level](
        `  ... e mais ${allDivergences.length - 20} — ver ${REPORT_PATH}`
      );
    }
    console[level]('');
    console[level](`[divergence] Relatório completo: ${REPORT_PATH}`);
  }

  if (isStrict && allDivergences.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error('[divergence] Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
