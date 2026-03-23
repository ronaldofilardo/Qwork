/**
 * scripts/validate-schema-snapshot.ts
 *
 * CI/CD - Schema Snapshot Validation
 *
 * Compara o estado real do banco com um JSON de referência commitado no repo.
 * Qualquer migration que altere o schema sem atualizar o JSON de referência falha no CI.
 *
 * Modos:
 *   --check  (padrão): carrega schema-reference.json, compara com DB real, exit 1 se diferente
 *   --update          : gera e salva schema-reference.json com o estado atual do DB
 *
 * Uso local:
 *   npx tsx scripts/validate-schema-snapshot.ts --update   # após aplicar migrations
 *   npx tsx scripts/validate-schema-snapshot.ts --check    # validar
 *
 * Uso CI (DATABASE_URL apontando para banco pré-populado com modular/*.sql):
 *   DATABASE_URL=postgres://... npx tsx scripts/validate-schema-snapshot.ts --check
 *
 * Saída: database/schemas/schema-reference.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import type {
  ColumnSnapshot,
  ConstraintSnapshot,
  IndexSnapshot,
  TableSnapshot,
  SchemaSnapshot,
} from '@/lib/db/schema-validation-utils';
import { diffSnapshots } from '@/lib/db/schema-validation-utils';

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

// ─── Queries ──────────────────────────────────────────────────────────────────

async function getEnums(
  client: import('pg').PoolClient
): Promise<Record<string, string[]>> {
  const res = await client.query<{ typname: string; enumlabel: string }>(
    `SELECT t.typname, e.enumlabel
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
     ORDER BY t.typname, e.enumsortorder`
  );
  const enums: Record<string, string[]> = {};
  for (const row of res.rows) {
    if (!enums[row.typname]) enums[row.typname] = [];
    enums[row.typname].push(row.enumlabel);
  }
  return enums;
}

async function getTableNames(
  client: import('pg').PoolClient
): Promise<string[]> {
  const res = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename`
  );
  return res.rows.map((r) => r.tablename);
}

async function getTableSnapshot(
  client: import('pg').PoolClient,
  tableName: string
): Promise<TableSnapshot> {
  // Colunas
  const colsRes = await client.query<{
    column_name: string;
    data_type: string;
    udt_name: string;
    character_maximum_length: string | null;
    numeric_precision: string | null;
    numeric_scale: string | null;
    is_nullable: string;
    column_default: string | null;
  }>(
    `SELECT
       column_name, data_type, udt_name,
       character_maximum_length, numeric_precision, numeric_scale,
       is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );

  const columns: ColumnSnapshot[] = colsRes.rows.map((c) => {
    let type = c.data_type === 'USER-DEFINED' ? c.udt_name : c.data_type;
    if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
    else if (c.numeric_precision && c.data_type === 'numeric') {
      type +=
        c.numeric_scale != null
          ? `(${c.numeric_precision},${c.numeric_scale})`
          : `(${c.numeric_precision})`;
    }
    // Normalizar default: remover cast ::tipo para comparação estável
    const normalizedDefault = c.column_default
      ? c.column_default.replace(/::[a-z_ ]+(\([^)]*\))?/gi, '').trim()
      : null;
    return {
      name: c.column_name,
      type,
      nullable: c.is_nullable === 'YES',
      default: normalizedDefault,
    };
  });

  // Constraints
  const constRes = await client.query<{
    constraint_name: string;
    constraint_type: string;
    column_name: string | null;
    foreign_table_name: string | null;
    foreign_column_name: string | null;
    update_rule: string | null;
    delete_rule: string | null;
  }>(
    `SELECT
       tc.constraint_name, tc.constraint_type,
       kcu.column_name,
       ccu.table_name  AS foreign_table_name,
       ccu.column_name AS foreign_column_name,
       rc.update_rule, rc.delete_rule
     FROM information_schema.table_constraints tc
     LEFT JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     LEFT JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name AND tc.table_schema = rc.constraint_schema
     LEFT JOIN information_schema.constraint_column_usage ccu
       ON rc.unique_constraint_name = ccu.constraint_name AND rc.unique_constraint_schema = ccu.constraint_schema
     WHERE tc.table_schema = 'public' AND tc.table_name = $1
     ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position`,
    [tableName]
  );

  const constraintMap: Record<string, ConstraintSnapshot> = {};
  for (const row of constRes.rows) {
    if (!row.constraint_name) continue;
    if (!constraintMap[row.constraint_name]) {
      constraintMap[row.constraint_name] = {
        name: row.constraint_name,
        type: row.constraint_type as ConstraintSnapshot['type'],
        columns: [],
        foreign_table: row.foreign_table_name ?? undefined,
        foreign_column: row.foreign_column_name ?? undefined,
        delete_rule: row.delete_rule ?? undefined,
        update_rule: row.update_rule ?? undefined,
      };
    }
    if (row.column_name) {
      constraintMap[row.constraint_name].columns.push(row.column_name);
    }
  }
  const constraints = Object.values(constraintMap).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Índices (excluindo PK e UNIQUE que já estão como constraints)
  const idxRes = await client.query<{ indexname: string; indexdef: string }>(
    `SELECT indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = $1
       AND indexname NOT LIKE '%_pkey'
     ORDER BY indexname`,
    [tableName]
  );
  // Normaliza a def removendo path qualificado desnecessário
  const indexes: IndexSnapshot[] = idxRes.rows.map((i) => ({
    name: i.indexname,
    definition: i.indexdef.replace(/^CREATE( UNIQUE)? INDEX /, 'INDEX '),
  }));

  return { name: tableName, columns, constraints, indexes };
}

// ─── Geração do snapshot ──────────────────────────────────────────────────────

async function buildSnapshot(): Promise<SchemaSnapshot> {
  const client = await pool.connect();
  try {
    const [enums, tableNames] = await Promise.all([
      getEnums(client),
      getTableNames(client),
    ]);

    const tables: TableSnapshot[] = [];
    for (const name of tableNames) {
      tables.push(await getTableSnapshot(client, name));
    }

    return {
      generated_at: new Date().toISOString(),
      enums,
      tables,
    };
  } finally {
    client.release();
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const REFERENCE_PATH = path.join(
  process.cwd(),
  'database',
  'schemas',
  'schema-reference.json'
);

async function modeUpdate(): Promise<void> {
  console.log('[validate-schema] Modo --update: gerando snapshot do banco...');
  const snapshot = await buildSnapshot();
  fs.mkdirSync(path.dirname(REFERENCE_PATH), { recursive: true });
  fs.writeFileSync(REFERENCE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(
    `[validate-schema] ✅ schema-reference.json salvo em: ${REFERENCE_PATH}`
  );
  console.log(
    `[validate-schema] Tabelas: ${snapshot.tables.length} | ENUMs: ${Object.keys(snapshot.enums).length}`
  );
}

async function modeCheck(): Promise<void> {
  if (!fs.existsSync(REFERENCE_PATH)) {
    console.error(
      '[validate-schema] ❌ ERRO: schema-reference.json não encontrado.'
    );
    console.error(
      '[validate-schema] Execute primeiro: npx tsx scripts/validate-schema-snapshot.ts --update'
    );
    process.exit(1);
  }

  console.log(
    '[validate-schema] Modo --check: comparando DB com referência...'
  );
  const reference = JSON.parse(
    fs.readFileSync(REFERENCE_PATH, 'utf-8')
  ) as SchemaSnapshot;

  const current = await buildSnapshot();
  const diff = diffSnapshots(reference, current);

  if (!diff.hasDiff) {
    console.log(
      '[validate-schema] ✅ Nenhuma divergência encontrada. Schema em sincronia.'
    );
    return;
  }

  console.error(
    '[validate-schema] ❌ DIVERGÊNCIAS DETECTADAS entre schema-reference.json e banco atual:'
  );
  console.error('');
  for (const line of diff.lines) {
    console.error(line);
  }
  console.error('');
  console.error(
    '[validate-schema] Para atualizar a referência após migrations: npx tsx scripts/validate-schema-snapshot.ts --update'
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes('--update') ? 'update' : 'check';

  try {
    if (mode === 'update') {
      await modeUpdate();
    } else {
      await modeCheck();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[validate-schema] Erro fatal:', err);
  process.exit(1);
});
