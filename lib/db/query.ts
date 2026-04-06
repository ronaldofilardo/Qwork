/**
 * lib/db/query.ts
 *
 * Função unificada de query e tipos associados.
 * Extraído de lib/db.ts durante refatoração "Zero Rompidas".
 */

import type { Session } from '../session';
import { getDynamicPool } from './dynamic-pool';
import { buildSetLocalQueries } from '../db-safe';
import {
  getLocalPool,
  isDevelopment,
  isTest,
  isProduction,
  databaseUrl,
  DEBUG_DB,
  getNeonSql,
  getNeonPool,
  environment,
} from './connection';

// ============================================================================
// TIPAGEM FORTE PARA PERFIS
// ============================================================================

export type Perfil =
  | 'admin'
  | 'rh'
  | 'funcionario'
  | 'emissor'
  | 'gestor'
  | 'representante';

export const PERFIS_VALIDOS: readonly Perfil[] = [
  'admin',
  'rh',
  'funcionario',
  'emissor',
  'gestor',
  'representante',
] as const;

export function isValidPerfil(value: unknown): value is Perfil {
  return (
    typeof value === 'string' &&
    (PERFIS_VALIDOS as readonly string[]).includes(value)
  );
}

export function assertValidPerfil(value: unknown): asserts value is Perfil {
  if (!isValidPerfil(value)) {
    throw new Error(
      `Perfil inválido: "${String(value)}". Perfis válidos: ${PERFIS_VALIDOS.join(', ')}`
    );
  }
}

// ============================================================================
// TIPO DE RESULTADO
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

// ============================================================================
// FUNÇÃO UNIFICADA DE QUERY
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session
): Promise<QueryResult<T>> {
  const localPool = getLocalPool();
  const start = Date.now();

  // Validação de isolamento de ambiente - BLOQUEIO CRÍTICO
  const validateDatabaseIsolation = () => {
    if (isTest && databaseUrl) {
      try {
        const parsedDb = new URL(databaseUrl);
        const dbName = parsedDb.pathname.replace(/^\//, '');

        if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
          throw new Error(
            `🚨 ERRO CRÍTICO DE ISOLAMENTO: Tentativa de usar banco de DESENVOLVIMENTO (${dbName}) em ambiente de TESTES!\n` +
              `Os testes DEVEM usar nr-bps_db_test.\n` +
              `Configure TEST_DATABASE_URL corretamente.`
          );
        }
      } catch {
        if (databaseUrl.match(/\/(?:nr-bps_db|nr-bps-db)(?:$|[\/\?])/)) {
          throw new Error(
            `🚨 ERRO CRÍTICO DE ISOLAMENTO: Tentativa de usar banco de DESENVOLVIMENTO em ambiente de TESTES!\n` +
              `Os testes DEVEM usar nr-bps_db_test.\n` +
              `Configure TEST_DATABASE_URL corretamente.`
          );
        }
      }
    }

    if (
      isDevelopment &&
      databaseUrl &&
      databaseUrl.includes('nr-bps_db_test')
    ) {
      throw new Error(
        `🚨 ERRO CRÍTICO: Tentativa de usar banco de TESTES (nr-bps_db_test) em ambiente de DESENVOLVIMENTO!\n` +
          `URL detectada: ${databaseUrl}\n` +
          `Isso viola o isolamento de ambientes. Corrija seu .env: defina LOCAL_DATABASE_URL apontando para "nr-bps_db" e remova/limpe TEST_DATABASE_URL em desenvolvimento.`
      );
    }
  };

  validateDatabaseIsolation();

  // ── Modo emissor com ambiente dinâmico ─────────────────────────────────────
  // Se o emissor selecionou um dbEnvironment explícito no login, usar o pool
  // correspondente em vez do pool padrão do processo.
  if (session?.perfil === 'emissor' && session.dbEnvironment) {
    const dynPool = getDynamicPool(session.dbEnvironment);
    const client = await dynPool.connect();
    try {
      await client.query('BEGIN');
      const setLocalQueries = buildSetLocalQueries({
        cpf: session.cpf,
        perfil: session.perfil,
      });
      for (const q of setLocalQueries) {
        await client.query(q);
      }
      await client.query(`SET LOCAL app.current_user_clinica_id = ''`);
      await client.query(`SET LOCAL app.current_user_entidade_id = ''`);
      const result = await client.query(text, params);
      await client.query('COMMIT');
      const duration = Date.now() - start;
      if (DEBUG_DB) {
        console.log(
          `[db][query] dynamic-${session.dbEnvironment} (${duration}ms): ${text.substring(0, 200)}...`
        );
      }
      return { rows: result.rows as T[], rowCount: result.rowCount || 0 };
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore rollback error */
      }
      throw err;
    } finally {
      client.release();
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    if ((isDevelopment || isTest) && localPool) {
      // PostgreSQL Local (Desenvolvimento e Testes)
      const client = await localPool.connect();
      try {
        if (session) {
          await client.query('BEGIN');
          try {
            const setLocalQueries = buildSetLocalQueries({
              cpf: session.cpf,
              perfil: session.perfil,
              clinica_id: session.clinica_id,
              entidade_id: session.entidade_id,
              representante_id: session.representante_id,
            });
            for (const q of setLocalQueries) {
              await client.query(q);
            }

            // Verificar contexto RLS após SET LOCAL
            const rlsVerify = await client.query(
              `SELECT current_setting('app.current_user_cpf', true) as cpf`
            );
            if (!rlsVerify.rows[0]?.cpf) {
              await client.query('ROLLBACK');
              throw new Error(
                'FALHA DE SEGURANÇA RLS: contexto RLS não propagado após SET LOCAL'
              );
            }

            const result = await client.query(text, params);
            await client.query('COMMIT');

            const duration = Date.now() - start;
            if (DEBUG_DB) {
              console.log(
                `[db][query] local (${duration}ms): ${text.substring(0, 200)}...`
              );
            }

            return {
              rows: result.rows,
              rowCount: result.rowCount || 0,
            };
          } catch (err) {
            try {
              await client.query('ROLLBACK');
            } catch (rollbackErr) {
              console.error('Erro durante ROLLBACK:', rollbackErr);
            }
            throw err;
          }
        }

        // No session: just execute the query normally
        try {
          const result = await client.query(text, params);
          const duration = Date.now() - start;

          if (duration > 500) {
            console.log(
              `[SLOW QUERY] (${duration}ms): ${text.substring(0, 100)}...`
            );
          }

          return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
          };
        } catch (err: any) {
          console.error(
            '[db][query] ERROR executing (no session):',
            text,
            params,
            err?.message || err
          );
          throw err;
        }
      } finally {
        client.release();
      }
    } else if (isProduction) {
      // Neon Database (Produção)
      if (session) {
        const pool = await getNeonPool();
        if (!pool) {
          throw new Error('Neon Pool não disponível');
        }

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const setLocalQueriesNeon = buildSetLocalQueries({
            cpf: session.cpf,
            perfil: session.perfil,
            clinica_id: session.clinica_id,
            entidade_id: session.entidade_id,
            representante_id: session.representante_id,
          });
          for (const q of setLocalQueriesNeon) {
            await client.query(q);
          }

          // Verificar contexto RLS após SET LOCAL
          const rlsVerifyNeon = await client.query(
            `SELECT current_setting('app.current_user_cpf', true) as cpf`
          );
          if (!rlsVerifyNeon.rows[0]?.cpf) {
            await client.query('ROLLBACK');
            throw new Error(
              'FALHA DE SEGURANÇA RLS: contexto RLS não propagado após SET LOCAL'
            );
          }

          const result = await client.query(text, params);
          await client.query('COMMIT');

          const duration = Date.now() - start;
          if (DEBUG_DB) {
            console.log(
              `[db][query] neon (${duration}ms): ${text.substring(0, 200)}...`
            );
          }

          return {
            rows: result.rows as T[],
            rowCount: result.rowCount || 0,
          };
        } catch (err) {
          try {
            await client.query('ROLLBACK');
          } catch (rollbackErr) {
            console.error(
              '[db][query] Erro durante ROLLBACK em Neon:',
              rollbackErr
            );
          }
          throw err;
        } finally {
          client.release();
        }
      }

      // Sem sessão, usar sql() normal
      const sql = await getNeonSql();
      if (!sql) {
        throw new Error('Conexão Neon não disponível');
      }
      if (!text.trim().toLowerCase().startsWith('set search_path')) {
        await sql('SET search_path TO public;');
      }

      const rows = await sql(text, params || []);
      const duration = Date.now() - start;
      if (DEBUG_DB) {
        console.log(
          `[db][query] neon (${duration}ms): ${text.substring(0, 200)}...`
        );
      }
      return {
        rows: rows as T[],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      };
    } else {
      throw new Error(
        `Nenhuma conexão configurada para ambiente: ${environment}`
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `Erro na query do banco (${environment}, ${duration}ms):`,
      error
    );
    throw error;
  }
}

// ============================================================================
// TESTAR CONEXÃO
// ============================================================================

export async function testConnection(): Promise<boolean> {
  try {
    const result = await query(
      'SELECT NOW() as now, current_database() as database'
    );
    console.log(`✅ Conexão OK [${environment}]:`, result.rows[0]);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao conectar [${environment}]:`, error);
    return false;
  }
}
