/**
 * Gerenciamento de transações no banco de dados
 */

import { getLocalPool, isProduction } from './connection';
import type { QueryResult } from './queries';

export interface TransactionClient {
  query<T = unknown>(
    sql: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: any[]
  ): Promise<QueryResult<T>>;
}

/**
 * Executa múltiplas queries dentro de uma transação
 * Em caso de erro, faz rollback automático
 */
export async function transaction<T>(
  callback: (client: TransactionClient) => Promise<T>
): Promise<T> {
  if (isProduction) {
    // Neon não suporta transações tradicionais da mesma forma
    // Usar queries sequenciais (limitação conhecida)
    console.warn('[Transaction] Produção: usando queries sequenciais (Neon)');
    const fakeClient: TransactionClient = {
      query: async <R = unknown>(sql: string, params: unknown[] = []) => {
        const { query } = await import('./queries');
        return query<R>(sql, params);
      },
    };
    return callback(fakeClient);
  }

  const pool = getLocalPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const transactionClient: TransactionClient = {
      query: async <R = unknown>(sql: string, params: unknown[] = []) => {
        const result = await client.query(sql, params);
        return {
          rows: result.rows as R[],
          rowCount: result.rowCount || 0,
        };
      },
    };

    const result = await callback(transactionClient);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(
      '[Transaction] Erro durante transação, rollback executado:',
      error
    );
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Executa múltiplas queries em batch (sem garantia de atomicidade em Neon)
 */
export async function batch<T>(
  queries: Array<{ sql: string; params?: unknown[] }>
): Promise<QueryResult<T>[]> {
  return transaction(async (client) => {
    const results: QueryResult<T>[] = [];
    for (const { sql, params = [] } of queries) {
      const result = await client.query<T>(sql, params);
      results.push(result);
    }
    return results;
  });
}
