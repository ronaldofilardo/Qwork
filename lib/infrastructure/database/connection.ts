/**
 * Gerenciamento de conexões com banco de dados
 * Suporta PostgreSQL local (dev/test) e Neon (production)
 */

import pg from 'pg';

const { Pool } = pg;

// Detecta o ambiente com validação rigorosa
const isRunningTests = !!process.env.JEST_WORKER_ID;
const hasTestDatabaseUrl = !!process.env.TEST_DATABASE_URL;

let environment = isRunningTests
  ? 'test'
  : process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'development';

// Se a URL do banco contém '_test', forçar ambiente de teste
const databaseUrlCheck =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.LOCAL_DATABASE_URL;
if (databaseUrlCheck && databaseUrlCheck.includes('_test')) {
  environment = 'test';
}

// VALIDAÇÃO CRÍTICA: Bloquear nr-bps_db em ambiente de teste
// Mas permitir durante build (NODE_ENV=production sem JEST_WORKER_ID)
const isReallyTest =
  (environment === 'test' || isRunningTests) &&
  process.env.NODE_ENV !== 'production';

if (isReallyTest) {
  const suspectVars = [
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  ].filter(Boolean);

  for (const url of suspectVars) {
    if (
      url &&
      (url.includes('/nr-bps_db') || url.includes('/nr-bps-db')) &&
      !url.includes('_test')
    ) {
      throw new Error(
        `🚨 ERRO CRÍTICO DE SEGURANÇA: Detectada tentativa de usar banco de DESENVOLVIMENTO em ambiente de TESTES!\n` +
          `URL suspeita: ${url}\n` +
          `Ambiente: ${environment}\n` +
          `JEST_WORKER_ID: ${process.env.JEST_WORKER_ID}\n` +
          `\nTestes DEVEM usar exclusivamente nr-bps_db_test via TEST_DATABASE_URL.\n` +
          `Consulte TESTING-POLICY.md para mais informações.`
      );
    }
  }
}

// Validações de isolamento de ambiente
if (environment === 'test' && !hasTestDatabaseUrl) {
  throw new Error(
    'ERRO DE CONFIGURAÇÃO: Ambiente detectado como "test" mas TEST_DATABASE_URL não está definida. ' +
      'Isso pode causar testes rodando no banco de desenvolvimento!'
  );
}

export const isDevelopment = environment === 'development';
export const isTest = environment === 'test';
export const isProduction = environment === 'production';
export const DEBUG_DB = !!process.env.DEBUG_DB || isTest;

// Conexão Neon (Produção)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let neonSql: any = null;
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

// Conexão PostgreSQL Local (Desenvolvimento e Testes)
let localPool: pg.Pool | null = null;

export const getDatabaseUrl = () => {
  if (isTest) {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        'TEST_DATABASE_URL não está definido. Configure TEST_DATABASE_URL apontando para o banco de testes "nr-bps_db_test".'
      );
    }

    try {
      const parsed = new URL(process.env.TEST_DATABASE_URL);
      const dbName = parsed.pathname.replace(/^\//, '');
      if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
        throw new Error(
          'TEST_DATABASE_URL aponta para o banco de desenvolvimento "nr-bps_db". Testes NÃO devem usar esse banco.'
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

    return process.env.TEST_DATABASE_URL;
  }

  if (isDevelopment) {
    if (!process.env.LOCAL_DATABASE_URL) {
      console.warn(
        '⚠️ LOCAL_DATABASE_URL não está definido. Usando configuração padrão: nr-bps_db.'
      );
      return 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
    }
    return process.env.LOCAL_DATABASE_URL;
  }

  // Produção
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definida em produção');
  }
  return process.env.DATABASE_URL;
};

export function getLocalPool(): pg.Pool {
  if (!localPool) {
    const connectionString = getDatabaseUrl();
    localPool = new Pool({
      connectionString,
      max: isTest ? 5 : 20,
      idleTimeoutMillis: isTest ? 100 : 30000,
      connectionTimeoutMillis: isTest ? 2000 : 10000,
    });

    localPool.on('error', (err) => {
      console.error('Erro inesperado no pool de conexões:', err);
    });
  }
  return localPool;
}

export async function closeLocalPool(): Promise<void> {
  if (localPool) {
    await localPool.end();
    localPool = null;
  }
}
