/**
 * @file db-mocks.ts
 * ─────────────────────────────────────────────────────────────
 * Helpers centralizados para mocking de banco de dados em testes Jest.
 *
 * PROBLEMA RESOLVIDO:
 *  Antes deste arquivo, cada teste repetia manualmente o mesmo boilerplate:
 *    jest.mock('@/lib/db');
 *    const mockQuery = query as jest.MockedFunction<typeof query>;
 *    mockQuery.mockResolvedValueOnce({ rows: [...], rowCount: 1 } as any);
 *
 *  Além disso, alguns testes mockavam a biblioteca errada (ex: usavam
 *  `@/lib/db` quando a rota consumia `@/lib/db-security`).
 *
 * USO CORRETO:
 *
 *   // 1. Declare os mocks com jest.mock() NO TOPO do arquivo de teste
 *   jest.mock('@/lib/db');
 *   // OU
 *   jest.mock('@/lib/db-security');
 *
 *   // 2. importe os helpers
 *   import { query } from '@/lib/db';
 *   import { asMockQuery, dbRows, dbEmpty, dbError } from '@/__tests__/helpers/db-mocks';
 *
 *   // 3. Obtenha referência tipada
 *   const mockQuery = asMockQuery(query);
 *
 *   // 4. Configure retornos
 *   mockQuery.mockResolvedValueOnce(dbRows([{ id: 1, nome: 'Empresa A' }]));
 *   mockQuery.mockResolvedValueOnce(dbEmpty());
 *
 * NOTA: jest.mock() DEVE ser chamado no nível do módulo (hoisting automático).
 *       Não pode ser feito de dentro de uma função auxiliar.
 *
 * QUAL BIBLIOTECA USAR?
 *   Verifique o import na ROTA que está sendo testada:
 *   - `import { query } from '@/lib/db'`           → jest.mock('@/lib/db')
 *   - `import { queryWithContext } from '@/lib/db-security'` → jest.mock('@/lib/db-security')
 *
 * ─────────────────────────────────────────────────────────────
 */

// ────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────

/** Tipo mínimo compatível com QueryResult do pg */
export interface MockQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: never[];
}

type AnyFn = (...args: unknown[]) => unknown;

// ────────────────────────────────────────────────────────────
// Conversores de tipo
// ────────────────────────────────────────────────────────────

/**
 * Converte a função `query` importada de `@/lib/db` para um mock tipado.
 *
 * @example
 * import { query } from '@/lib/db';
 * const mockQuery = asMockQuery(query);
 * mockQuery.mockResolvedValueOnce(dbRows([{ id: 1 }]));
 */
export function asMockQuery<T extends AnyFn>(fn: T): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

/**
 * Alias para asMockQuery — use com `queryWithContext` de `@/lib/db-security`.
 */
export const asMockQueryWithContext = asMockQuery;

// ────────────────────────────────────────────────────────────
// Builders de resultado
// ────────────────────────────────────────────────────────────

/**
 * Cria um QueryResult simulado com as linhas fornecidas.
 *
 * @param rows Linhas retornadas pela query
 * @returns Objeto compatível com QueryResult do pg
 *
 * @example
 * mockQuery.mockResolvedValueOnce(dbRows([{ id: 1, nome: 'Empresa A' }]));
 */
export function dbRows<T extends Record<string, unknown>>(
  rows: T[]
): MockQueryResult<T> {
  return {
    rows,
    rowCount: rows.length,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
}

/**
 * Cria um QueryResult simulado sem linhas (SELECT vazio, DELETE, UPDATE etc).
 *
 * @example
 * mockQuery.mockResolvedValueOnce(dbEmpty());
 */
export function dbEmpty(): MockQueryResult<never> {
  return {
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
}

/**
 * Cria um QueryResult para INSERT/UPDATE que retorna RETURNING id.
 *
 * @example
 * mockQuery.mockResolvedValueOnce(dbInserted(42));
 */
export function dbInserted(id: number): MockQueryResult<{ id: number }> {
  return {
    rows: [{ id }],
    rowCount: 1,
    command: 'INSERT',
    oid: 0,
    fields: [],
  };
}

/**
 * Cria um QueryResult para operações que afetam N linhas (UPDATE/DELETE).
 *
 * @example
 * mockQuery.mockResolvedValueOnce(dbAffected(3));
 */
export function dbAffected(rowCount: number): MockQueryResult<never> {
  return {
    rows: [],
    rowCount,
    command: 'UPDATE',
    oid: 0,
    fields: [],
  };
}

/**
 * Faz o mock rejeitar com um erro de banco de dados.
 *
 * @example
 * mockQuery.mockRejectedValueOnce(dbError('connection refused'));
 */
export function dbError(message: string): Error {
  const err = new Error(message);
  (err as Error & { code?: string }).code = 'DB_ERROR';
  return err;
}

// ────────────────────────────────────────────────────────────
// Helpers de configuração em sequência
// ────────────────────────────────────────────────────────────

type MockableQuery = jest.MockedFunction<
  (...args: unknown[]) => Promise<unknown>
>;

/**
 * Configura uma sequência de retornos para a função mockada.
 * Útil quando uma rota faz múltiplas queries em sequência.
 *
 * @example
 * mockSequence(mockQuery, [
 *   dbRows([{ id: 1 }]),          // primeira query: busca empresa
 *   dbRows([{ id: 10, ... }]),    // segunda query: busca funcionários
 *   dbEmpty(),                    // terceira query: log de auditoria
 * ]);
 */
export function mockSequence(
  mockFn: MockableQuery,
  results: MockQueryResult[]
): void {
  results.forEach((result) => {
    mockFn.mockResolvedValueOnce(result as unknown);
  });
}

// ────────────────────────────────────────────────────────────
// Padrões de resposta pré-definidos
// ────────────────────────────────────────────────────────────

/**
 * Retornos padrão para cenários comuns.
 * Importe e use diretamente nos testes.
 *
 * @example
 * mockQuery.mockResolvedValueOnce(DB_DEFAULTS.empresaAtiva);
 */
export const DB_DEFAULTS = {
  /** Empresa/entidade ativa genérica */
  empresaAtiva: dbRows([
    {
      id: 1,
      nome: 'Empresa Teste',
      cnpj: '12345678000100',
      email: 'empresa@test.com',
      status: 'aprovado',
      ativa: true,
    },
  ]),

  /** Clínica ativa genérica */
  clinicaAtiva: dbRows([
    {
      id: 1,
      nome: 'Clínica Teste',
      cnpj: '98765432000100',
      email: 'clinica@test.com',
      ativa: true,
    },
  ]),

  /** Lote ativo genérico */
  loteAtivo: dbRows([
    {
      id: 1,
      empresa_id: 1,
      clinica_id: 1,
      numero_ordem: 1,
      tipo: 'completo',
      status: 'ativo',
      liberado_por: '00000000000',
      total_avaliacoes: 0,
      avaliacoes_concluidas: 0,
      avaliacoes_inativadas: 0,
      pode_emitir_laudo: false,
    },
  ]),

  /** Nenhum resultado encontrado */
  vazio: dbEmpty(),

  /** Confirmação de insert genérica */
  inserted: dbInserted(1),
} as const;
