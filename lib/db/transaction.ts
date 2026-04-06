/**
 * lib/db/transaction.ts
 *
 * Função de transação com rollback automático.
 * Extraído de lib/db.ts durante refatoração "Zero Rompidas".
 */

import type { Session } from '../session';
import { getDynamicPool } from './dynamic-pool';
import {
  getLocalPool,
  isDevelopment,
  isTest,
  isProduction,
  DEBUG_DB,
  getNeonPool,
  environment,
} from './connection';
import type { QueryResult } from './query';

// ============================================================================
// INTERFACE DE CLIENTE DE TRANSAÇÃO
// ============================================================================

export interface TransactionClient {
  query: <T = any>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
}

// ============================================================================
// FUNÇÃO DE TRANSAÇÃO
// ============================================================================

/**
 * Executa operações dentro de uma transação.
 * Faz rollback automático em caso de erro.
 */
export async function transaction<T>(
  callback: (client: TransactionClient) => Promise<T>,
  session?: Session
): Promise<T> {
  const localPool = getLocalPool();

  // ── Emissor com ambiente dinâmico ───────────────────────────────────────────
  if (session?.perfil === 'emissor' && session.dbEnvironment) {
    const dynPool = getDynamicPool(session.dbEnvironment);
    const client = await dynPool.connect();
    try {
      await client.query('BEGIN');
      const escapeString = (str: string) => str.replace(/'/g, "''");
      await client.query(
        `SET LOCAL app.current_user_cpf = '${escapeString(session.cpf)}'`
      );
      await client.query(
        `SET LOCAL app.current_user_perfil = '${escapeString(session.perfil)}'`
      );
      await client.query(`SET LOCAL app.current_user_clinica_id = ''`);
      await client.query(`SET LOCAL app.current_user_entidade_id = ''`);
      const txClient: TransactionClient = {
        query: async <R = any>(text: string, params?: unknown[]) => {
          const r = await client.query(text, params);
          return { rows: r.rows as R[], rowCount: r.rowCount || 0 };
        },
      };
      const result = await callback(txClient);
      await client.query('COMMIT');
      if (DEBUG_DB) {
        console.log(
          `[db][transaction] dynamic-${session.dbEnvironment}: comitada`
        );
      }
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (DEBUG_DB)
        console.error(
          `[db][transaction] dynamic-${session.dbEnvironment}: revertida`,
          error
        );
      throw error;
    } finally {
      client.release();
    }
  }
  // ────────────────────────────────────────────────────────────────────

  if ((isDevelopment || isTest) && localPool) {
    const client = await localPool.connect();
    try {
      await client.query('BEGIN');

      // Configurar contexto RLS se houver sessão
      if (session) {
        const escapeString = (str: string) => str.replace(/'/g, "''");
        await client.query(
          `SET LOCAL app.current_user_cpf = '${escapeString(session.cpf)}'`
        );
        await client.query(
          `SET LOCAL app.current_user_perfil = '${escapeString(session.perfil)}'`
        );
        await client.query(
          `SET LOCAL app.current_user_clinica_id = '${escapeString(String(session.clinica_id || ''))}'`
        );
        await client.query(
          `SET LOCAL app.current_user_entidade_id = '${escapeString(String(session.entidade_id || ''))}'`
        );

        if (session.representante_id) {
          await client.query(
            `SET LOCAL app.current_representante_id = '${escapeString(String(session.representante_id))}'`
          );
        }
      }

      // Criar objeto TransactionClient
      const txClient: TransactionClient = {
        query: async <R = any>(text: string, params?: unknown[]) => {
          const result = await client.query(text, params);
          return {
            rows: result.rows as R[],
            rowCount: result.rowCount || 0,
          };
        },
      };

      const result = await callback(txClient);
      await client.query('COMMIT');

      if (DEBUG_DB) {
        console.log('[db][transaction] Transação comitada com sucesso');
      }

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (DEBUG_DB) {
        console.error(
          '[db][transaction] Transação revertida devido a erro:',
          error
        );
      }
      throw error;
    } finally {
      client.release();
    }
  } else if (isProduction) {
    // Para Neon em produção: usar Pool com transação real
    const pool = await getNeonPool();
    if (!pool) {
      throw new Error('Neon Pool não disponível');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Configurar contexto de auditoria dentro da transação
      if (session) {
        const escapeString = (str: string) => str.replace(/'/g, "''");
        await client.query(
          `SET LOCAL app.current_user_cpf = '${escapeString(session.cpf)}'`
        );
        await client.query(
          `SET LOCAL app.current_user_perfil = '${escapeString(session.perfil)}'`
        );
        await client.query(
          `SET LOCAL app.current_user_clinica_id = '${escapeString(String(session.clinica_id || ''))}'`
        );
        await client.query(
          `SET LOCAL app.current_user_entidade_id = '${escapeString(String(session.entidade_id || ''))}'`
        );

        if (session.representante_id) {
          await client.query(
            `SET LOCAL app.current_representante_id = '${escapeString(String(session.representante_id))}'`
          );
        }

        if (DEBUG_DB) {
          console.log(
            `[db][transaction] Neon: Variáveis de auditoria configuradas para ${session.perfil}`
          );
        }
      }

      // Criar TransactionClient usando a mesma conexão
      const txClient: TransactionClient = {
        query: async <R = any>(text: string, params?: unknown[]) => {
          const result = await client.query(text, params);
          return {
            rows: result.rows as R[],
            rowCount: result.rowCount || 0,
          };
        },
      };

      const result = await callback(txClient);
      await client.query('COMMIT');

      if (DEBUG_DB) {
        console.log('[db][transaction] Neon: Transação comitada');
      }

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[db][transaction] Neon: Transação revertida:', error);
      throw error;
    } finally {
      client.release();
    }
  } else {
    throw new Error(
      `Nenhuma conexão configurada para ambiente: ${environment}`
    );
  }
}
