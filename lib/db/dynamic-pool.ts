/**
 * lib/db/dynamic-pool.ts
 *
 * Gerenciamento de pools de conexão dinâmicos por ambiente.
 *
 * Usado pelo emissor local: ao logar, escolhe qual ambiente de banco
 * deseja acessar (development, staging ou production).
 * Cada ambiente mantém seu próprio pool em cache para evitar reconexão
 * a cada query.
 *
 * Outros perfis NÃO passam por aqui — usam o pool padrão (getLocalPool/Neon).
 */

import pg from 'pg';
import type { DbEnvironment } from './environment-guard';

const { Pool } = pg;

// Cache de pools por ambiente
const dynamicPools = new Map<DbEnvironment, pg.Pool>();

/**
 * Retorna a connection string para o ambiente solicitado.
 * Lança erro se a variável de ambiente não estiver configurada.
 */
function getUrlForEnvironment(env: DbEnvironment): string {
  switch (env) {
    case 'development': {
      const url = process.env.LOCAL_DATABASE_URL;
      if (!url)
        throw new Error(
          'LOCAL_DATABASE_URL não configurada para ambiente de desenvolvimento.'
        );
      return url;
    }
    case 'staging': {
      const url = process.env.STAGING_DATABASE_URL;
      if (!url)
        throw new Error(
          'STAGING_DATABASE_URL não configurada para ambiente de homologação.'
        );
      return url;
    }
    case 'production': {
      const url = process.env.DATABASE_URL;
      if (!url)
        throw new Error(
          'DATABASE_URL não configurada para ambiente de produção.'
        );
      return url;
    }
  }
}

/**
 * Retorna (criando se necessário) o pool para o ambiente solicitado.
 * O pool é cacheado em memória durante o ciclo de vida do processo.
 */
export function getDynamicPool(env: DbEnvironment): pg.Pool {
  const cached = dynamicPools.get(env);
  if (cached) return cached;

  const connectionString = getUrlForEnvironment(env);

  const pool = new Pool({
    connectionString,
    max: 5, // pools dinâmicos são menores
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });

  pool.on('error', (err) => {
    console.error(`[dynamic-pool][${env}] Erro inesperado no pool:`, err);
  });

  try {
    const parsed = new URL(connectionString);
    const dbName = parsed.pathname.replace(/^\//, '');
    const host = parsed.hostname;
    console.log(
      `🔌 [dynamic-pool] Pool criado: ${dbName} @ ${host} (ambiente: ${env})`
    );
  } catch {
    // parsing opcional
  }

  dynamicPools.set(env, pool);
  return pool;
}

/**
 * Encerra (e remove do cache) o pool de um determinado ambiente.
 * Chamado no logout do emissor.
 */
export async function destroyDynamicPool(env: DbEnvironment): Promise<void> {
  const pool = dynamicPools.get(env);
  if (pool) {
    await pool.end();
    dynamicPools.delete(env);
  }
}

/**
 * Encerra todos os pools dinâmicos.
 * Usar apenas em shutdown do processo.
 */
export async function destroyAllDynamicPools(): Promise<void> {
  await Promise.all(
    [...dynamicPools.entries()].map(async ([env, pool]) => {
      await pool.end();
      dynamicPools.delete(env);
    })
  );
}
