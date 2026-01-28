/**
 * Test Database Guard - Proteção contra uso acidental do banco de desenvolvimento
 *
 * Este módulo garante que testes NUNCA usem o banco nr-bps_db (desenvolvimento).
 * Todos os testes DEVEM usar nr-bps_db_test via TEST_DATABASE_URL.
 */

let guardEnabled = false;
let forceEnabled = false; // Para testes unitários

/**
 * Ativar a proteção do banco de testes
 * Deve ser chamado no início de cada teste ou no setup do teste
 */
export function enableTestDatabaseGuard(): void {
  if (guardEnabled) return;

  // Verificar se estamos em ambiente de teste ou forçado
  const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID ||
    forceEnabled;

  if (!isTestEnv) {
    return; // Não ativar fora de testes
  }

  // Validar TEST_DATABASE_URL
  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    throw new Error(
      `🚨 ERRO CRÍTICO: TEST_DATABASE_URL não está definido!\n` +
        `Os testes DEVEM usar o banco de testes (nr-bps_db_test), não o banco de desenvolvimento (nr-bps_db).\n` +
        `Configure a variável de ambiente TEST_DATABASE_URL antes de executar testes.`
    );
  }

  // Validar que não estamos usando o banco de desenvolvimento
  const parsed = new URL(testDbUrl);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
    throw new Error(
      `🚨 ERRO CRÍTICO DE ISOLAMENTO: TEST_DATABASE_URL aponta para o banco de DESENVOLVIMENTO!\n` +
        `URL atual: ${testDbUrl}\n` +
        `Banco detectado: ${dbName}\n` +
        `Os testes NÃO devem usar nr-bps_db. Altere para nr-bps_db_test.`
    );
  }

  if (!dbName.includes('_test')) {
    throw new Error(
      `🚨 AVISO DE ISOLAMENTO: TEST_DATABASE_URL aponta para um banco que não é de testes.\n` +
        `Banco detectado: ${dbName}\n` +
        `Recomendado: Use nr-bps_db_test`
    );
  }

  guardEnabled = true;

  console.log(
    `🛡️ [TestDatabaseGuard] Proteção ativada - usando banco: ${dbName}`
  );
}

/**
 * Forçar ativação do guard (para testes unitários)
 */
export function forceEnableTestDatabaseGuard(): void {
  forceEnabled = true;
  guardEnabled = false;
}

/**
 * Verificar se a proteção está ativa
 */
export function isTestDatabaseGuardEnabled(): boolean {
  return guardEnabled;
}

/**
 * Desativar a proteção (úsar com cautela)
 */
export function disableTestDatabaseGuard(): void {
  guardEnabled = false;
  forceEnabled = false;
}

/**
 * Verificação explícita do banco em uso
 * Pode ser chamada dentro de testes para garantir isolamento
 */
export function assertTestDatabase(): void {
  // Ativar se necessário
  if (
    !guardEnabled &&
    (process.env.NODE_ENV === 'test' ||
      process.env.JEST_WORKER_ID ||
      forceEnabled)
  ) {
    enableTestDatabaseGuard();
  }

  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (testDbUrl) {
    const parsed = new URL(testDbUrl);
    const dbName = parsed.pathname.replace(/^\//, '');

    if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
      throw new Error(
        `🚨 BLOQUEADO: Tentativa de usar banco de desenvolvimento (nr-bps_db) em testes!\n` +
          `Use nr-bps_db_test para testes.`
      );
    }
  }
}

/**
 * Obter informações sobre o banco em uso
 */
export function getDatabaseInfo(): {
  name: string;
  isTest: boolean;
  isDevelopment: boolean;
} {
  const testDbUrl = process.env.TEST_DATABASE_URL;
  const localDbUrl = process.env.LOCAL_DATABASE_URL;

  if ((process.env.JEST_WORKER_ID || forceEnabled) && testDbUrl) {
    const parsed = new URL(testDbUrl);
    const name = parsed.pathname.replace(/^\//, '');
    return {
      name,
      isTest: name.includes('_test'),
      isDevelopment: name === 'nr-bps_db' || name === 'nr-bps-db',
    };
  }

  if (localDbUrl) {
    const parsed = new URL(localDbUrl);
    const name = parsed.pathname.replace(/^\//, '');
    return {
      name,
      isTest: name.includes('_test'),
      isDevelopment: name === 'nr-bps_db' || name === 'nr-bps-db',
    };
  }

  return {
    name: 'unknown',
    isTest: false,
    isDevelopment: false,
  };
}
