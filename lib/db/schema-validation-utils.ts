/**
 * lib/db/schema-validation-utils.ts
 *
 * Funções puras utilitárias compartilhadas entre os scripts de validação de schema,
 * detecção de divergências código ↔ DB e geração de ERD.
 *
 * Exportado para uso em:
 *   - scripts/validate-schema-snapshot.ts
 *   - scripts/detect-code-db-divergence.ts
 *   - scripts/generate-erd.ts
 *   - __tests__/lib/schema-validation-utils.test.ts
 */

// ─── Tipos: Schema Snapshot ───────────────────────────────────────────────────

export interface ColumnSnapshot {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

export interface ConstraintSnapshot {
  name: string;
  type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY' | 'CHECK';
  columns: string[];
  foreign_table?: string;
  foreign_column?: string;
  delete_rule?: string;
  update_rule?: string;
}

export interface IndexSnapshot {
  name: string;
  definition: string;
}

export interface TableSnapshot {
  name: string;
  columns: ColumnSnapshot[];
  constraints: ConstraintSnapshot[];
  indexes: IndexSnapshot[];
}

export interface SchemaSnapshot {
  generated_at: string;
  enums: Record<string, string[]>;
  tables: TableSnapshot[];
}

export interface DiffResult {
  hasDiff: boolean;
  lines: string[];
}

// ─── Tipos: Divergência Código ↔ DB ──────────────────────────────────────────

export interface SqlBlock {
  /** Conteúdo SQL extraído */
  sql: string;
  /** Linha aproximada no arquivo (1-based) */
  line: number;
}

// ─── Feature 1: diffSnapshots ─────────────────────────────────────────────────

/**
 * Compara dois snapshots de schema (referência vs atual) e retorna
 * as diferenças encontradas em formato legível.
 *
 * É uma função pura — nenhuma I/O.
 */
export function diffSnapshots(
  reference: SchemaSnapshot,
  current: SchemaSnapshot
): DiffResult {
  const lines: string[] = [];

  // Enums
  const refEnumNames = new Set(Object.keys(reference.enums));
  const curEnumNames = new Set(Object.keys(current.enums));

  for (const name of curEnumNames) {
    if (!refEnumNames.has(name)) {
      lines.push(
        `  [+] ENUM adicionado: ${name} (${current.enums[name].join(', ')})`
      );
    }
  }
  for (const name of refEnumNames) {
    if (!curEnumNames.has(name)) {
      lines.push(`  [-] ENUM removido: ${name}`);
    }
  }
  for (const name of refEnumNames) {
    if (!curEnumNames.has(name)) continue;
    const refVals = reference.enums[name].join(',');
    const curVals = current.enums[name].join(',');
    if (refVals !== curVals) {
      lines.push(`  [~] ENUM alterado: ${name}`);
      lines.push(`      ref: ${refVals}`);
      lines.push(`      cur: ${curVals}`);
    }
  }

  // Tabelas
  const refTableMap = new Map(reference.tables.map((t) => [t.name, t]));
  const curTableMap = new Map(current.tables.map((t) => [t.name, t]));

  for (const [name] of curTableMap) {
    if (!refTableMap.has(name)) {
      lines.push(`  [+] TABELA adicionada: ${name}`);
    }
  }
  for (const [name] of refTableMap) {
    if (!curTableMap.has(name)) {
      lines.push(`  [-] TABELA removida: ${name}`);
    }
  }

  for (const [name, refTable] of refTableMap) {
    const curTable = curTableMap.get(name);
    if (!curTable) continue;

    const refColMap = new Map(refTable.columns.map((c) => [c.name, c]));
    const curColMap = new Map(curTable.columns.map((c) => [c.name, c]));

    for (const [cname] of curColMap) {
      if (!refColMap.has(cname)) {
        lines.push(`  [+] ${name}.${cname} — coluna adicionada`);
      }
    }
    for (const [cname, refCol] of refColMap) {
      const curCol = curColMap.get(cname);
      if (!curCol) {
        lines.push(`  [-] ${name}.${cname} — coluna removida`);
        continue;
      }
      if (refCol.type !== curCol.type) {
        lines.push(
          `  [~] ${name}.${cname} — tipo: ${refCol.type} → ${curCol.type}`
        );
      }
      if (refCol.nullable !== curCol.nullable) {
        lines.push(
          `  [~] ${name}.${cname} — nullable: ${refCol.nullable} → ${curCol.nullable}`
        );
      }
      if (refCol.default !== curCol.default) {
        lines.push(
          `  [~] ${name}.${cname} — default: ${String(refCol.default)} → ${String(curCol.default)}`
        );
      }
    }

    // Constraints
    const refConstNames = new Set(refTable.constraints.map((c) => c.name));
    const curConstNames = new Set(curTable.constraints.map((c) => c.name));
    for (const cname of curConstNames) {
      if (!refConstNames.has(cname)) {
        lines.push(`  [+] ${name} — constraint adicionada: ${cname}`);
      }
    }
    for (const cname of refConstNames) {
      if (!curConstNames.has(cname)) {
        lines.push(`  [-] ${name} — constraint removida: ${cname}`);
      }
    }

    // Índices
    const refIdxNames = new Set(refTable.indexes.map((i) => i.name));
    const curIdxNames = new Set(curTable.indexes.map((i) => i.name));
    for (const iname of curIdxNames) {
      if (!refIdxNames.has(iname)) {
        lines.push(`  [+] ${name} — índice adicionado: ${iname}`);
      }
    }
    for (const iname of refIdxNames) {
      if (!curIdxNames.has(iname)) {
        lines.push(`  [-] ${name} — índice removido: ${iname}`);
      }
    }
  }

  return { hasDiff: lines.length > 0, lines };
}

// ─── Feature 2: SQL parsing ───────────────────────────────────────────────────

/** Palavras-chave SQL que não são nomes de tabelas/colunas */
export const SQL_KEYWORDS = new Set([
  'select',
  'from',
  'where',
  'join',
  'left',
  'right',
  'inner',
  'outer',
  'full',
  'cross',
  'on',
  'and',
  'or',
  'not',
  'in',
  'is',
  'null',
  'like',
  'between',
  'exists',
  'case',
  'when',
  'then',
  'else',
  'end',
  'as',
  'by',
  'order',
  'group',
  'having',
  'limit',
  'offset',
  'insert',
  'into',
  'values',
  'update',
  'set',
  'delete',
  'create',
  'alter',
  'drop',
  'table',
  'index',
  'unique',
  'primary',
  'key',
  'foreign',
  'references',
  'constraint',
  'default',
  'true',
  'false',
  'with',
  'returning',
  'distinct',
  'all',
  'union',
  'except',
  'intersect',
  'coalesce',
  'nullif',
  'cast',
  'extract',
  'date',
  'time',
  'timestamp',
  'interval',
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'now',
  'current_timestamp',
  'public',
  'pg_catalog',
  'information_schema',
  'asc',
  'desc',
  'nulls',
  'first',
  'last',
  'any',
  'some',
  'do',
  'row',
  'rows',
  'only',
  'fetch',
  'next',
  'using',
  'ilike',
  'similar',
]);

/** Retorna true se o texto parece SQL manipulador de dados */
export function looksLikeSQL(text: string): boolean {
  return /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|FROM|JOIN)\b/i.test(
    text
  );
}

/**
 * Extrai blocos de SQL de um arquivo TypeScript.
 * Detecta:
 *   - Template literals:  query(`SELECT ...`)
 *   - Strings simples:    query('SELECT ...')  /  query("SELECT ...")
 *   - Variáveis nomeadas: const SQL_XXX = `SELECT ...`
 */
export function extractSqlBlocks(content: string): SqlBlock[] {
  const blocks: SqlBlock[] = [];

  // Mapa linha → caractere de início (para calcular número de linha)
  const lineStarts: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineStarts.push(i + 1);
  }

  function charToLine(charIdx: number): number {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (lineStarts[mid] <= charIdx) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }

  const templateRegex = /query\s*\(\s*`([\s\S]*?)`/g;
  let m: RegExpExecArray | null;

  while ((m = templateRegex.exec(content)) !== null) {
    const sql = m[1].replace(/\$\{[^}]*\}/g, '?').trim();
    if (looksLikeSQL(sql)) {
      blocks.push({ sql, line: charToLine(m.index) });
    }
  }

  const stringRegex = /query\s*\(\s*(['"])([\s\S]*?)\1/g;
  while ((m = stringRegex.exec(content)) !== null) {
    const sql = m[2].trim();
    if (looksLikeSQL(sql)) {
      blocks.push({ sql, line: charToLine(m.index) });
    }
  }

  const constSqlRegex =
    /(?:const|let|var)\s+[A-Z_][A-Z0-9_]*\s*=\s*`([\s\S]*?)`/g;
  while ((m = constSqlRegex.exec(content)) !== null) {
    const sql = m[1].replace(/\$\{[^}]*\}/g, '?').trim();
    if (looksLikeSQL(sql)) {
      blocks.push({ sql, line: charToLine(m.index) });
    }
  }

  // Deduplica por conteúdo + linha
  const seen = new Set<string>();
  return blocks.filter((b) => {
    const key = `${b.line}:${b.sql.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extrai referências de tabelas de um bloco SQL.
 * Suporta: FROM t, JOIN t, UPDATE t, INSERT INTO t, DELETE FROM t
 */
export function extractTableRefs(sql: string): string[] {
  const tables: string[] = [];
  const clean = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const patterns = [
    /\bFROM\s+([a-z_][a-z0-9_]*)/gi,
    /\bJOIN\s+([a-z_][a-z0-9_]*)/gi,
    /\bUPDATE\s+([a-z_][a-z0-9_]*)/gi,
    /\bINSERT\s+INTO\s+([a-z_][a-z0-9_]*)/gi,
    /\bDELETE\s+FROM\s+([a-z_][a-z0-9_]*)/gi,
  ];

  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(clean)) !== null) {
      const name = m[1].toLowerCase();
      if (!SQL_KEYWORDS.has(name)) tables.push(name);
    }
  }

  return [...new Set(tables)];
}

/**
 * Extrai referências qualificadas de colunas (tabela.coluna) de um bloco SQL.
 */
export function extractColumnRefs(
  sql: string
): Array<{ table: string | null; column: string }> {
  const refs: Array<{ table: string | null; column: string }> = [];
  const clean = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const qualifiedRegex = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = qualifiedRegex.exec(clean)) !== null) {
    const qualifier = m[1].toLowerCase();
    const column = m[2].toLowerCase();
    if (
      !SQL_KEYWORDS.has(qualifier) &&
      !SQL_KEYWORDS.has(column) &&
      column.length > 1
    ) {
      refs.push({ table: qualifier, column });
    }
  }

  return refs;
}

// ─── Feature 3: ERD helpers ───────────────────────────────────────────────────

/** Simplifica tipo PostgreSQL para notação compacta usada no Mermaid */
export function simplifyType(type: string, maxLen: string | null): string {
  const baseMap: Record<string, string> = {
    integer: 'int',
    bigint: 'bigint',
    smallint: 'int',
    boolean: 'bool',
    text: 'text',
    'character varying': 'varchar',
    character: 'char',
    numeric: 'decimal',
    'double precision': 'float',
    real: 'float',
    'timestamp without time zone': 'timestamp',
    'timestamp with time zone': 'timestamptz',
    date: 'date',
    'time without time zone': 'time',
    json: 'json',
    jsonb: 'jsonb',
    uuid: 'uuid',
    bytea: 'bytea',
  };
  const mapped = baseMap[type] ?? type;
  if (maxLen && (mapped === 'varchar' || mapped === 'char'))
    return `${mapped}(${maxLen})`;
  return mapped;
}

/** Sanitiza string para uso em Mermaid (escapa aspas simples, remove < >) */
export function sanitizeMermaid(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/[<>]/g, '')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 80);
}

/** Grupos de domínio para agrupamento no ERD */
export const DOMAIN_RULES: Array<{
  domain: string;
  emoji: string;
  prefixes: RegExp;
}> = [
  {
    domain: 'Foundation',
    emoji: '🏗️',
    prefixes:
      /^(audit_|schema_migrations|configuracoes|notificacoes_admin|tokens_retomada)/,
  },
  {
    domain: 'Identidade',
    emoji: '👤',
    prefixes:
      /^(clinicas|funcionarios|usuarios|sessoes|tokens_auth|senhas|perfis|rbac|permissoes|clinica_)/,
  },
  {
    domain: 'Entidades & Comercial',
    emoji: '🏢',
    prefixes:
      /^(entidades|empresas|representantes|planos|contratos|contratacoes|aceites|configuracoes_plano|vinculos)/,
  },
  {
    domain: 'Avaliações & Laudos',
    emoji: '📋',
    prefixes:
      /^(avaliacoes|laudos|lotes|relatorios|resultados|criterios|elegibilidade)/,
  },
  {
    domain: 'Financeiro & Notificações',
    emoji: '💰',
    prefixes:
      /^(pagamentos|comissoes|notificacoes|faturas|recibos|nf_|rpa_|saldo)/,
  },
];

/** Atribui domínio a uma tabela com base no nome */
export function assignDomain(tableName: string): string {
  for (const rule of DOMAIN_RULES) {
    if (rule.prefixes.test(tableName)) return rule.domain;
  }
  return 'Outros';
}
