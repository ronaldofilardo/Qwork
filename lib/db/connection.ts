/**
 * lib/db/connection.ts
 *
 * Gerenciamento de conexão com banco de dados: detecção de ambiente,
 * seleção de URL, criação de pool (local PostgreSQL + Neon produção),
 * e funções de ciclo de vida.
 *
 * Extraído de lib/db.ts durante refatoração "Zero Rompidas".
 */

import dotenv from 'dotenv';

// Load local env early to ensure LOCAL_DATABASE_URL, ALLOW_PROD_DB_LOCAL, and other overrides are available
// ⚠️ SEGURANÇA DE ISOLAMENTO DE TESTES: NÃO chamar dotenv.config em ambiente Jest.
if (!process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: '.env.local', override: true });
}

import pg from 'pg';

const { Pool } = pg;

// ============================================================================
// DETECÇÃO DE AMBIENTE
// ============================================================================

const isRunningTests = !!process.env.JEST_WORKER_ID;
const hasTestDatabaseUrl = !!process.env.TEST_DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

let environment = isRunningTests
  ? 'test'
  : NODE_ENV === 'production'
    ? 'production'
    : NODE_ENV === 'test'
      ? 'test'
      : 'development';

if (process.env.TEST_DATABASE_URL) {
  if (
    (process.env.NODE_ENV === 'test' || isRunningTests) &&
    process.env.TEST_DATABASE_URL.includes('_test')
  ) {
    environment = 'test';
  } else if (process.env.NODE_ENV === 'production') {
    // Em produção, ignorar silenciosamente
  } else if (!(process.env.NODE_ENV === 'test' || isRunningTests)) {
    console.warn(
      `⚠️ TEST_DATABASE_URL está definida mas não estamos em ambiente de teste (NODE_ENV !== "test", atual: "${process.env.NODE_ENV || 'undefined'}"). Ignorando TEST_DATABASE_URL para evitar uso do banco de testes durante desenvolvimento. Para resolver: remova TEST_DATABASE_URL do seu .env de desenvolvimento ou defina NODE_ENV=test ao executar os testes.`
    );
  } else if (!process.env.TEST_DATABASE_URL.includes('_test')) {
    console.warn(
      `⚠️ TEST_DATABASE_URL está definida, mas não aponta para um banco com sufixo "_test". Verifique a configuração de TEST_DATABASE_URL (atual: "${process.env.TEST_DATABASE_URL || 'undefined'}").`
    );
  }
} else {
  const otherDbIndicatesTest =
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('_test')) ||
    (process.env.LOCAL_DATABASE_URL &&
      process.env.LOCAL_DATABASE_URL.includes('_test'));

  if (otherDbIndicatesTest) {
    if (process.env.NODE_ENV === 'test' || isRunningTests) {
      environment = 'test';
    } else {
      console.warn(
        '⚠️ Variável de conexão aponta para um banco de teste, mas NODE_ENV != "test" e não estamos em Jest. Ignorando mudança para ambiente de teste para evitar uso acidental do banco de testes durante desenvolvimento.'
      );
    }
  }
}

// VALIDAÇÃO CRÍTICA: Bloquear acesso ao banco de produção em testes
const isNextBuild =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.npm_lifecycle_script?.includes('next build') ||
  (NODE_ENV === 'production' && !isRunningTests);

if ((environment === 'test' || isRunningTests) && !isNextBuild) {
  const suspectVars = [
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  ].filter(Boolean);

  for (const url of suspectVars) {
    if (
      (environment === 'test' || isRunningTests) &&
      hasTestDatabaseUrl &&
      (url === process.env.DATABASE_URL ||
        url === process.env.LOCAL_DATABASE_URL)
    ) {
      continue;
    }

    if (url && url.includes('neon.tech') && !url.includes('_test')) {
      throw new Error(
        `🚨 ERRO CRÍTICO DE SEGURANÇA: Detectada tentativa de usar banco de PRODUÇÃO (Neon Cloud) em TESTES!\n` +
          `URL suspeita: ${url.substring(0, 50)}...\n` +
          `Ambiente: ${environment}\n` +
          `JEST_WORKER_ID: ${process.env.JEST_WORKER_ID}\n` +
          `\nTestes DEVEM usar exclusivamente banco local de testes via TEST_DATABASE_URL.\n` +
          `Consulte TESTING-POLICY.md para mais informações.`
      );
    }
  }
}

if (environment === 'test' && !hasTestDatabaseUrl && !isNextBuild) {
  throw new Error(
    'ERRO DE CONFIGURAÇÃO: Ambiente detectado como "test" mas TEST_DATABASE_URL não está definida. ' +
      'Isso pode causar testes rodando no banco de desenvolvimento!'
  );
}

if (environment === 'development' && hasTestDatabaseUrl && !isRunningTests) {
  console.warn(
    `⚠️ AVISO: TEST_DATABASE_URL está definida em ambiente de desenvolvimento fora de testes. Isso pode causar confusão na detecção de ambiente (NODE_ENV="${process.env.NODE_ENV || 'undefined'}"). Recomenda-se remover TEST_DATABASE_URL do .env de desenvolvimento.`
  );
}

export { environment };
export const isDevelopment = environment === 'development';
export const isTest = environment === 'test';
export const isProduction = environment === 'production';
export const DEBUG_DB = !!process.env.DEBUG_DB || isTest;

// ============================================================================
// SELEÇÃO DE URL DO BANCO
// ============================================================================

const getDatabaseUrl = (): string | null => {
  if (isTest) {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        'TEST_DATABASE_URL não está definido. Configure TEST_DATABASE_URL apontando para o banco de testes "nr-bps_db_test" para evitar uso acidental do banco de desenvolvimento (nr-bps_db).'
      );
    }

    try {
      const parsed = new URL(process.env.TEST_DATABASE_URL);
      const dbName = parsed.pathname.replace(/^\//, '');
      if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
        throw new Error(
          'TEST_DATABASE_URL aponta para o banco de desenvolvimento "nr-bps_db". Testes NÃO devem usar ou alterar esse banco. Configure para usar "nr-bps_db_test".'
        );
      }
      if (dbName !== 'nr-bps_db_test') {
        console.warn(
          `⚠️ AVISO: TEST_DATABASE_URL aponta para "${dbName}". O banco padrão para testes é "nr-bps_db_test".`
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('banco de desenvolvimento')
      ) {
        throw error;
      }
    }

    try {
      const parsed = new URL(process.env.TEST_DATABASE_URL);
      if (!parsed.username || !parsed.password) {
        const user =
          process.env.TEST_DB_USER ||
          process.env.PGUSER ||
          parsed.username ||
          'postgres';
        const pass =
          process.env.TEST_DB_PASSWORD ||
          process.env.PGPASSWORD ||
          parsed.password ||
          '123456';
        parsed.username = user;
        parsed.password = pass;
        const patched = parsed.toString();
        console.warn(
          `[WARN] TEST_DATABASE_URL did not contain full credentials; using user/password from env or defaults. Using connection: ${patched.replace(/password=[^&\s]+/, 'password=***')}`
        );
        return patched;
      }
    } catch (err) {
      console.warn(
        '[WARN] Falha ao parsear TEST_DATABASE_URL para injetar credenciais automaticamente:',
        err
      );
    }

    return process.env.TEST_DATABASE_URL;
  }

  if (isDevelopment) {
    if (
      process.env.ALLOW_PROD_DB_LOCAL === 'true' &&
      process.env.DATABASE_URL
    ) {
      const masked = process.env.DATABASE_URL.replace(
        /(postgresql:\/\/.+?:).+?(@)/,
        '$1***$2'
      );
      console.warn(
        `⚠️ ALLOW_PROD_DB_LOCAL=true: usando DATABASE_URL (produção) localmente por escolha do desenvolvedor. Conectando a: ${masked}`
      );
      return process.env.DATABASE_URL;
    }

    if (!process.env.LOCAL_DATABASE_URL) {
      console.warn(
        '⚠️ LOCAL_DATABASE_URL não está definido. Se pretende usar o banco Neon em desenvolvimento, defina LOCAL_DATABASE_URL no seu .env.local apontando para a URL do Neon. Alternativamente defina ALLOW_PROD_DB_LOCAL=true (usa DATABASE_URL diretamente). Exemplo: LOCAL_DATABASE_URL=postgresql://neondb_owner:***@host/neondb?sslmode=require'
      );
      return 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
    }

    try {
      const parsed = new URL(process.env.LOCAL_DATABASE_URL);
      const dbName = parsed.pathname.replace(/^\//, '');
      if (dbName === 'nr-bps_db_test') {
        console.warn(
          `⚠️ LOCAL_DATABASE_URL aponta para o banco de testes "${dbName}". Desenvolvimento deve usar "nr-bps_db". Verifique seu .env (LOCAL_DATABASE_URL) e corrija para: postgresql://postgres:123456@localhost:5432/nr-bps_db`
        );
      }
    } catch {
      // Se parsing falhar, não bloquear
    }

    return process.env.LOCAL_DATABASE_URL;
  }

  if (isProduction) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL não está definido para ambiente de produção.'
      );
    }
    return process.env.DATABASE_URL;
  }

  return null;
};

export const databaseUrl = getDatabaseUrl();

// ============================================================================
// CONEXÕES NEON (PRODUÇÃO)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let neonSql: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let neonPool: any = null;
let neonImported = false;

export async function getNeonSql() {
  if (!neonImported && isProduction && process.env.DATABASE_URL) {
    try {
      const { neon } = await import('@neondatabase/serverless');
      neonSql = neon(process.env.DATABASE_URL);
      neonImported = true;
    } catch (_err) {
      console.error('Erro ao importar Neon:', _err);
      throw _err;
    }
  }
  return neonSql;
}

export async function getNeonPool() {
  if (!neonPool && isProduction && process.env.DATABASE_URL) {
    try {
      const { Pool: NeonPool } = await import('@neondatabase/serverless');
      neonPool = new NeonPool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 10000,
      });
      console.log('[db] Neon Pool criado para transações');
    } catch (_err) {
      console.error('Erro ao criar Neon Pool:', _err);
      throw _err;
    }
  }
  return neonPool;
}

// ============================================================================
// POOL LOCAL (DESENVOLVIMENTO E TESTES)
// ============================================================================

let localPool: pg.Pool | null = null;

if ((isDevelopment || isTest) && databaseUrl) {
  localPool = new Pool({
    connectionString: databaseUrl,
    max: isTest ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  if (DEBUG_DB) {
    try {
      const parsed = new URL(databaseUrl);
      const dbName = parsed.pathname.replace(/^\//, '');
      const host = parsed.hostname;
      console.log(
        `🔌 [lib/db/connection] Conectado ao banco: ${dbName} @ ${host} (ambiente: ${environment})`
      );
    } catch {
      // Se parsing falhar, não bloquear
    }
  }
}

/** Obtém o pool local (pode ser null se não inicializado) */
export function getLocalPool(): pg.Pool | null {
  return localPool;
}

/** Obtém o pool local garantido (throws se produção ou não inicializado) */
export function getPool(): pg.Pool {
  if (isProduction) {
    throw new Error('getPool() não deve ser usado em produção (usa Neon)');
  }
  if (!localPool) {
    throw new Error(
      'Pool local não inicializado. Verifique se está em desenvolvimento/teste.'
    );
  }
  return localPool;
}

/** Fecha pool local (útil para testes) */
export async function closePool() {
  if (localPool) {
    await localPool.end();
    localPool = null;
  }
}

/** Informações do ambiente atual */
export function getDatabaseInfo() {
  return {
    environment,
    isDevelopment,
    isTest,
    isProduction,
    databaseUrl: databaseUrl
      ? databaseUrl.replace(/password=[^&\s]+/g, 'password=***')
      : 'N/A',
    hasLocalPool: !!localPool,
    hasNeonSql: !!neonSql,
  };
}
