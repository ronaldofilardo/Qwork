/**
 * Funções de execução de queries no banco de dados
 * Suporta PostgreSQL local e Neon cloud
 */

import {
  isProduction,
  isTest,
  DEBUG_DB,
  getNeonSql,
  getLocalPool,
} from './connection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

/**
 * Executa uma query SQL com parâmetros
 * Usa Neon em produção, PostgreSQL local em dev/test
 */
export async function query<T = unknown>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<QueryResult<T>> {
  if (DEBUG_DB) {
    console.log('[DB Query]', { sql: sql.substring(0, 100), params });
  }

  try {
    if (isProduction) {
      const neon = await getNeonSql();
      if (!neon) {
        throw new Error('Neon SQL não disponível em produção');
      }
      const rows = await neon(sql, params);
      return { rows, rowCount: rows.length };
    } else {
      const pool = getLocalPool();
      const result = await pool.query(sql, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
      };
    }
  } catch (error) {
    console.error('[DB Error]', {
      sql: sql.substring(0, 200),
      params,
      error,
    });
    throw error;
  }
}

/**
 * Executa uma query e retorna apenas a primeira linha
 */
export async function queryOne<T = unknown>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] || null;
}

/**
 * Executa uma query e retorna apenas o primeiro campo da primeira linha
 */
export async function queryScalar<T = unknown>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<T | null> {
  const result = await queryOne<Record<string, T>>(sql, params);
  if (!result) return null;
  const keys = Object.keys(result);
  return keys.length > 0 ? result[keys[0]] : null;
}

/**
 * Verifica se uma query retorna algum resultado
 */
export async function exists(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<boolean> {
  const result = await query(sql, params);
  return result.rowCount > 0;
}

/**
 * Conta o número de linhas retornadas por uma query
 */
export async function count(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[] = []
): Promise<number> {
  const result = await queryScalar<number>(
    `SELECT COUNT(*) FROM (${sql}) AS count_query`,
    params
  );
  return result || 0;
}

/**
 * Helper para queries de INSERT que retornam o registro criado
 */
export async function insert<T = unknown>(
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const sql = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  return queryOne<T>(sql, values);
}

/**
 * Helper para queries de UPDATE
 */
export async function update<T = unknown>(
  table: string,
  data: Record<string, unknown>,
  where: { column: string; value: unknown }
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${where.column} = $${keys.length + 1}
    RETURNING *
  `;

  return queryOne<T>(sql, [...values, where.value]);
}

/**
 * Helper para queries de DELETE
 */
export async function deleteRow(
  table: string,
  where: { column: string; value: unknown }
): Promise<number> {
  const sql = `
    DELETE FROM ${table}
    WHERE ${where.column} = $1
  `;

  const result = await query(sql, [where.value]);
  return result.rowCount;
}

/**
 * Limpa o banco de testes (apenas em ambiente de teste)
 */
export async function clearTestDatabase(): Promise<void> {
  if (!isTest) {
    throw new Error(
      'clearTestDatabase só pode ser executado em ambiente de teste'
    );
  }

  const tables = [
    'respostas',
    'resultados',
    'avaliacoes',
    'laudos',
    'lotes_avaliacao',
    'funcionarios',
    'empresas_clientes',
    'clinicas',
  ];

  for (const table of tables) {
    await query(`TRUNCATE TABLE ${table} CASCADE`);
  }
}
