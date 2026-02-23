/**
 * @file __tests__/db/schema-smoke-test.test.ts
 * ─────────────────────────────────────────────────────────────
 * Smoke test de schema: valida que o banco de testes reflete
 * o schema esperado pelo código atual.
 *
 * OBJETIVO:
 *  Detectar rapidamente quando o banco de testes (nr-bps_db_test) diverge
 *  do schema que o código espera — antes que testes de integração falhem
 *  com erros crípticos de "column does not exist".
 *
 * QUANDO RODAR:
 *  npx jest "__tests__/db/schema-smoke-test" --testTimeout=10000
 *
 * ATUALIZAÇÃO:
 *  Ao adicionar ou remover colunas no schema, atualize também as listas
 *  EXPECTED_COLUMNS e REMOVED_COLUMNS neste arquivo.
 *
 * DURAÇÃO ESPERADA: < 1s (apenas queries information_schema)
 */

import { query } from '@/lib/db';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function tableExists(tableName: string): Promise<boolean> {
  const res = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return res.rows[0].cnt > 0;
}

async function columnExists(
  tableName: string,
  columnName: string
): Promise<boolean> {
  const res = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = $1
       AND column_name  = $2`,
    [tableName, columnName]
  );
  return res.rows[0].cnt > 0;
}

async function viewExists(viewName: string): Promise<boolean> {
  const res = await query(
    `SELECT COUNT(*)::int AS cnt
     FROM information_schema.views
     WHERE table_schema = 'public' AND table_name = $1`,
    [viewName]
  );
  return res.rows[0].cnt > 0;
}

// ────────────────────────────────────────────────────────────
// Tabelas que DEVEM existir
// ────────────────────────────────────────────────────────────

const REQUIRED_TABLES = [
  'clinicas',
  'entidades',
  'funcionarios',
  'lotes_avaliacao',
  'avaliacoes',
  'laudos',
  'usuarios',
  'pagamentos',
] as const;

// ────────────────────────────────────────────────────────────
// Colunas NOT NULL críticas — as que já causaram falhas de teste
// ────────────────────────────────────────────────────────────

const EXPECTED_COLUMNS: Array<{ table: string; column: string }> = [
  // clinicas — 12 campos NOT NULL (root cause de falhas históricas)
  { table: 'clinicas', column: 'nome' },
  { table: 'clinicas', column: 'cnpj' },
  { table: 'clinicas', column: 'email' },
  { table: 'clinicas', column: 'telefone' },
  { table: 'clinicas', column: 'endereco' },
  { table: 'clinicas', column: 'cidade' },
  { table: 'clinicas', column: 'estado' },
  { table: 'clinicas', column: 'cep' },
  { table: 'clinicas', column: 'responsavel_nome' },
  { table: 'clinicas', column: 'responsavel_cpf' },
  { table: 'clinicas', column: 'responsavel_email' },
  { table: 'clinicas', column: 'responsavel_celular' },
  { table: 'clinicas', column: 'ativa' },

  // funcionarios — schema atual (sem tomador_id, etc.)
  { table: 'funcionarios', column: 'cpf' },
  { table: 'funcionarios', column: 'nome' },
  { table: 'funcionarios', column: 'email' },
  { table: 'funcionarios', column: 'data_nascimento' },
  { table: 'funcionarios', column: 'senha_hash' },

  // lotes_avaliacao
  { table: 'lotes_avaliacao', column: 'empresa_id' },
  { table: 'lotes_avaliacao', column: 'clinica_id' },
  { table: 'lotes_avaliacao', column: 'numero_ordem' },
  { table: 'lotes_avaliacao', column: 'liberado_por' },
  { table: 'lotes_avaliacao', column: 'tipo' },
  { table: 'lotes_avaliacao', column: 'status' },

  // usuarios — campos usados em autenticação
  { table: 'usuarios', column: 'tipo_usuario' },
  { table: 'usuarios', column: 'clinica_id' },
  { table: 'usuarios', column: 'entidade_id' },
];

// ────────────────────────────────────────────────────────────
// Colunas que FORAM REMOVIDAS e NÃO devem existir
// A presença dessas colunas indica schema desatualizado.
// ────────────────────────────────────────────────────────────

const REMOVED_COLUMNS: Array<{
  table: string;
  column: string;
  reason: string;
}> = [
  {
    table: 'funcionarios',
    column: 'tomador_id',
    reason:
      'Removida em migração — entidades não mais referenciadas por funcionários',
  },
  {
    table: 'funcionarios',
    column: 'usuario_tipo',
    reason:
      'Removida em migração — tipo de usuário migrado para tabela usuarios',
  },
  {
    table: 'funcionarios',
    column: 'empresa_id',
    reason: 'Removida: funcionários não têm vínculo direto com empresa',
  },
  {
    table: 'clinicas',
    column: 'entidade_id',
    reason: 'Removida: clínicas não têm FK para entidades no schema atual',
  },
  {
    table: 'lotes_avaliacao',
    column: 'titulo',
    reason: 'Removida: lotes identificados por numero_ordem, não por título',
  },
];

// ────────────────────────────────────────────────────────────
// Views que NÃO devem existir (foram removidas)
// ────────────────────────────────────────────────────────────

const REMOVED_VIEWS: Array<{ view: string; reason: string }> = [
  {
    view: 'usuarios_resumo',
    reason: 'View removida — consultas diretas em usuarios',
  },
];

// ────────────────────────────────────────────────────────────
// Testes
// ────────────────────────────────────────────────────────────

describe('Schema Smoke Test — banco de testes', () => {
  describe('Tabelas obrigatórias existem', () => {
    REQUIRED_TABLES.forEach((table) => {
      it(`tabela "${table}" existe`, async () => {
        const exists = await tableExists(table);
        expect(exists).toBe(true);
      });
    });
  });

  describe('Colunas críticas existem', () => {
    EXPECTED_COLUMNS.forEach(({ table, column }) => {
      it(`${table}.${column} existe`, async () => {
        const exists = await columnExists(table, column);
        expect(exists).toBe(true);
      });
    });
  });

  describe('Colunas removidas NÃO existem (detecta schema desatualizado)', () => {
    REMOVED_COLUMNS.forEach(({ table, column, reason }) => {
      it(`${table}.${column} foi removida — ${reason}`, async () => {
        const exists = await columnExists(table, column);
        if (exists) {
          // Falha com mensagem clara do que fazer
          throw new Error(
            `SCHEMA DESATUALIZADO: A coluna "${table}.${column}" ainda existe no banco de testes, ` +
              `mas foi removida do código.\n` +
              `Motivo: ${reason}\n` +
              `Ação: Execute as migrations pendentes no banco de testes (nr-bps_db_test).`
          );
        }
        expect(exists).toBe(false);
      });
    });
  });

  describe('Views removidas NÃO existem', () => {
    REMOVED_VIEWS.forEach(({ view, reason }) => {
      it(`view "${view}" foi removida — ${reason}`, async () => {
        const exists = await viewExists(view);
        if (exists) {
          throw new Error(
            `SCHEMA DESATUALIZADO: A view "${view}" ainda existe no banco de testes, ` +
              `mas foi removida.\nMotivo: ${reason}`
          );
        }
        expect(exists).toBe(false);
      });
    });
  });

  describe('Constraints de unicidade críticas', () => {
    it('clinicas.responsavel_cpf tem constraint UNIQUE', async () => {
      const res = await query(
        `SELECT COUNT(*)::int AS cnt
         FROM information_schema.table_constraints tc
         JOIN information_schema.constraint_column_usage ccu
           ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
         WHERE tc.table_name = 'clinicas'
           AND tc.constraint_type = 'UNIQUE'
           AND ccu.column_name = 'responsavel_cpf'`
      );
      expect(res.rows[0].cnt).toBeGreaterThan(0);
    });

    it('funcionarios.cpf é PK ou tem constraint UNIQUE', async () => {
      const res = await query(
        `SELECT COUNT(*)::int AS cnt
         FROM information_schema.table_constraints tc
         JOIN information_schema.constraint_column_usage ccu
           ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
         WHERE tc.table_name = 'funcionarios'
           AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
           AND ccu.column_name = 'cpf'`
      );
      expect(res.rows[0].cnt).toBeGreaterThan(0);
    });
  });
});
