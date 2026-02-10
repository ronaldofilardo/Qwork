import dotenv from 'dotenv';

// Load local env early to ensure LOCAL_DATABASE_URL, ALLOW_PROD_DB_LOCAL, and other overrides are available
// This helps when scripts import lib/db.ts directly and .env.local wasn't loaded yet by the caller.
dotenv.config({ path: '.env.local', override: false });

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Session } from './session';

export type { Session };

// ============================================================================
// TIPAGEM FORTE PARA PERFIS
// ============================================================================

/**
 * Perfis disponíveis no sistema
 */
export type Perfil = 'admin' | 'rh' | 'funcionario' | 'emissor' | 'gestor';

/**
 * Lista de perfis válidos (para validação em runtime)
 */
export const PERFIS_VALIDOS: readonly Perfil[] = [
  'admin',
  'rh',
  'funcionario',
  'emissor',
  'gestor',
] as const;

/**
 * Validação de perfil em runtime
 */
export function isValidPerfil(value: unknown): value is Perfil {
  return (
    typeof value === 'string' &&
    (PERFIS_VALIDOS as readonly string[]).includes(value)
  );
}

/**
 * Validação com throw de erro
 */
export function assertValidPerfil(value: unknown): asserts value is Perfil {
  if (!isValidPerfil(value)) {
    throw new Error(
      `Perfil inválido: "${String(value)}". Perfis válidos: ${PERFIS_VALIDOS.join(', ')}`
    );
  }
}

// ============================================================================
// TIPOS DE CONTRATAÇÃO
// ============================================================================

const { Pool } = pg;

// Detecta o ambiente com validação rigorosa
// Prioriza JEST_WORKER_ID para identificar testes reais
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

// Detectar banco de teste com regras mais seguras
// - Se TEST_DATABASE_URL estiver explicitamente definida, só considerar se realmente estamos em ambiente de testes (NODE_ENV==='test' ou Jest)
// - Se DATABASE_URL ou LOCAL_DATABASE_URL contém '_test', só forçar ambiente test quando NODE_ENV==='test' ou estamos em Jest
if (process.env.TEST_DATABASE_URL) {
  if (
    (process.env.NODE_ENV === 'test' || isRunningTests) &&
    process.env.TEST_DATABASE_URL.includes('_test')
  ) {
    environment = 'test';
  } else if (process.env.NODE_ENV === 'production') {
    // Em produção, aceitar que TEST_DATABASE_URL possa existir (por exemplo em CI ou arquivos .env não-ideais)
    // Ignorar silenciosamente para não poluir o log de build e evitar falha de build por aviso
    // Não alteramos `environment` aqui — produção deve usar `DATABASE_URL`.
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
// Durante build, desabilitar validações estritas
const isNextBuild =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.npm_lifecycle_script?.includes('next build') ||
  (NODE_ENV === 'production' && !isRunningTests); // Assumir build se NODE_ENV=production e não é Jest

if ((environment === 'test' || isRunningTests) && !isNextBuild) {
  // Verificar TODAS as variáveis de ambiente que possam conter connection strings
  const suspectVars = [
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_URL,
    process.env.TEST_DATABASE_URL,
  ].filter(Boolean);

  for (const url of suspectVars) {
    // Se estamos em testes e TEST_DATABASE_URL está definida, preferimos o banco de testes
    // e ignoramos a presença de DATABASE_URL/LOCAL_DATABASE_URL no .env.local para evitar
    // erros quando desenvolvedores têm o DATABASE_URL de produção localmente.
    if (
      (environment === 'test' || isRunningTests) &&
      hasTestDatabaseUrl &&
      (url === process.env.DATABASE_URL ||
        url === process.env.LOCAL_DATABASE_URL)
    ) {
      // Pulando checagem desse valor específico pois TEST_DATABASE_URL será usada para conexões em testes
      continue;
    }

    // Bloquear uso de banco Neon Cloud (produção) em testes
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

// Validações de isolamento de ambiente
// Durante build do Next.js, NÃO validar ambiente de teste
// isNextBuild já definido acima

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

const isDevelopment = environment === 'development';
const isTest = environment === 'test';
const isProduction = environment === 'production';

// Exportar constantes de ambiente para uso em outros módulos
export { isDevelopment, isTest, isProduction };

const DEBUG_DB = !!process.env.DEBUG_DB || isTest;

// Selecionar URL do banco baseado no ambiente
const getDatabaseUrl = () => {
  // Validação rigorosa para ambiente de testes
  if (isTest) {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        'TEST_DATABASE_URL não está definido. Configure TEST_DATABASE_URL apontando para o banco de testes "nr-bps_db_test" para evitar uso acidental do banco de desenvolvimento (nr-bps_db).'
      );
    }

    // Garantir que a URL de teste não aponte para o banco de desenvolvimento
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
      // Se parsing falhar por outro motivo, não bloquear aqui
    }

    // Ensure the TEST_DATABASE_URL includes credentials when running tests on localhost
    try {
      const parsed = new URL(process.env.TEST_DATABASE_URL);
      // If username or password is missing, try common env vars or fallbacks
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

  // Ambiente de desenvolvimento
  if (isDevelopment) {
    // Opt-in: permitir usar DATABASE_URL (produção) localmente quando explicitamente solicitado
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
      // Fallback para desenvolvimento
      return 'postgresql://postgres:123456@localhost:5432/nr-bps_db';
    }

    // Garantir que desenvolvimento não use o banco de testes
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

  // Ambiente de produção
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

const databaseUrl = getDatabaseUrl();

// Valor conhecido do hash para o usuário admin (senha 123456) — usado para garantir consistência em dev/test
const KNOWN_ADMIN_CPF = '00000000000';
const KNOWN_ADMIN_HASH =
  '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW';

// Tipo para as queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T = any> = {
  rows: T[];
  rowCount: number;
};

// Conexão Neon (Produção) - Será importada dinamicamente quando necessário
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let neonSql: any = null;
let neonImported = false;

async function getNeonSql() {
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

// Função para gerar SQL com contexto RLS
function _generateRLSQuery(text: string, session?: Session): string {
  if (session) {
    // Escapar aspas simples nos valores
    const escapeString = (str: string) => str.replace(/'/g, "''");

    const setCommands = [
      `SELECT set_config('app.current_user_cpf', '${escapeString(session.cpf)}', true)`,
      `SELECT set_config('app.current_user_perfil', '${escapeString(session.perfil)}', true)`,
      `SELECT set_config('app.current_user_clinica_id', '${escapeString(String(session.clinica_id || ''))}', true)`,
      `SELECT set_config('app.current_user_entidade_id', '${escapeString(String(session.entidade_id || ''))}', true)`,
      // Manter antigo para retrocompatibilidade com migrations antigas
      `SELECT set_config('app.current_user_entidade_id', '${escapeString(String(session.entidade_id || ''))}', true)`,
    ].join('; ');

    // Prefix the main statement with set_config calls so they execute in the same session/statement scope
    return `${setCommands}; ${text}`;
  }
  return text;
}

// Função unificada de query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(
  text: string,
  params?: unknown[],
  session?: Session
): Promise<QueryResult<T>> {
  const start = Date.now();

  // Validação de isolamento de ambiente - BLOQUEIO CRÍTICO
  // Esta validação impede qualquer acesso ao banco de desenvolvimento em ambiente de testes
  const validateDatabaseIsolation = () => {
    // Verificar em ambiente de testes
    if (isTest && databaseUrl) {
      try {
        const parsedDb = new URL(databaseUrl);
        const dbName = parsedDb.pathname.replace(/^\//, '');

        // Bloquear acesso ao banco de desenvolvimento em testes
        if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
          throw new Error(
            `🚨 ERRO CRÍTICO DE ISOLAMENTO: Tentativa de usar banco de DESENVOLVIMENTO (${dbName}) em ambiente de TESTES!\n` +
              `Os testes DEVEM usar nr-bps_db_test.\n` +
              `Configure TEST_DATABASE_URL corretamente.`
          );
        }
      } catch {
        // Fallback: se não for uma URL válida, ainda verificamos por segmentos exatos
        if (databaseUrl.match(/\/(?:nr-bps_db|nr-bps-db)(?:$|[\/\?])/)) {
          throw new Error(
            `🚨 ERRO CRÍTICO DE ISOLAMENTO: Tentativa de usar banco de DESENVOLVIMENTO em ambiente de TESTES!\n` +
              `Os testes DEVEM usar nr-bps_db_test.\n` +
              `Configure TEST_DATABASE_URL corretamente.`
          );
        }
      }
    }

    // Verificar em ambiente de desenvolvimento
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

  try {
    if ((isDevelopment || isTest) && localPool) {
      // PostgreSQL Local (Desenvolvimento e Testes)
      const client = await localPool.connect();
      try {
        // If we have a session, run the query inside a transaction and set LOCAL params
        if (session) {
          await client.query('BEGIN');
          try {
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

          // Log apenas queries lentas (>500ms)
          if (duration > 500) {
            console.log(
              `[SLOW QUERY] (${duration}ms): ${text.substring(0, 100)}...`
            );
          }

          return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
          };
        } catch (err) {
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
      const sql = await getNeonSql();
      if (!sql) {
        throw new Error('Conexão Neon não disponível');
      }

      // Para Neon: se houver sessão, envolver em transação para usar SET LOCAL
      if (session) {
        const escapeString = (str: string) => String(str).replace(/'/g, "''");

        // Construir bloco de transação com SET LOCAL + query
        // SET LOCAL só funciona dentro de BEGIN...COMMIT
        const transactionBlock = `
BEGIN;
SET LOCAL app.current_user_cpf = '${escapeString(session.cpf)}';
SET LOCAL app.current_user_perfil = '${escapeString(session.perfil)}';
SET LOCAL app.current_user_clinica_id = '${escapeString(String(session.clinica_id || ''))}';
SET LOCAL app.current_user_entidade_id = '${escapeString(String(session.entidade_id || ''))}';
${text};
COMMIT;
        `.trim();

        try {
          // Executar tudo em um único bloco de transação
          const rows = await sql(transactionBlock, params || []);
          const duration = Date.now() - start;
          if (DEBUG_DB) {
            console.log(
              `[db][query] neon+session (${duration}ms): ${text.substring(0, 200)}...`
            );
          }
          return {
            rows: rows as T[],
            rowCount: Array.isArray(rows) ? rows.length : 0,
          };
        } catch (err) {
          const duration = Date.now() - start;
          console.error(
            `Erro na query do banco (production, ${duration}ms):`,
            err
          );
          throw err;
        }
      }

      // Sem sessão, executar diretamente
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

/**
 * Garante que o usuário admin exista e possua um hash bcrypt válido (apenas em dev/test).
 * Não deve rodar em produção para evitar alterações de credenciais reais.
 */
export async function ensureAdminPassword(): Promise<void> {
  try {
    if (isProduction) return; // Não mexer em produção

    // Buscar usuário admin se existir
    const existsRes = await query(
      'SELECT cpf, senha_hash FROM funcionarios WHERE cpf = $1 LIMIT 1',
      [KNOWN_ADMIN_CPF]
    );

    if (existsRes.rows.length === 0) {
      // Inserir usuário admin com hash conhecido
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4, 'admin', true) ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash`,
        [KNOWN_ADMIN_CPF, 'Admin', 'admin@bps.com.br', KNOWN_ADMIN_HASH]
      );
      console.info(
        '[INIT] Usuário admin criado/atualizado com hash conhecido (dev/test)'
      );
      return;
    }

    const row = existsRes.rows[0];
    const currentHash = row.senha_hash;

    // Se já é o hash esperado, ok
    if (currentHash === KNOWN_ADMIN_HASH) return;

    // Se hash atual for inválido ou não corresponde à senha 123456, substituímos
    const senhaValida = await bcrypt
      .compare('123456', currentHash)
      .catch(() => false);
    if (!senhaValida) {
      await query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
        KNOWN_ADMIN_HASH,
        KNOWN_ADMIN_CPF,
      ]);
      console.info(
        '[INIT] Hash admin inconsistente detectado e substituído pelo hash padrão (dev/test)'
      );
    }
  } catch (err) {
    console.warn('[INIT] Falha ao garantir hash do admin:', err);
  }
}

if ((isDevelopment || isTest) && databaseUrl) {
  localPool = new Pool({
    connectionString: databaseUrl,
    max: isTest ? 5 : 10, // Menos conexões para testes
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Aumentado de 2000 para 10000ms
  });

  // Log claro do banco sendo usado (apenas em desenvolvimento e testes)
  if (DEBUG_DB) {
    try {
      const parsed = new URL(databaseUrl);
      const dbName = parsed.pathname.replace(/^\//, '');
      const host = parsed.hostname;
      console.log(
        `🔌 [lib/db.ts] Conectado ao banco: ${dbName} @ ${host} (ambiente: ${environment})`
      );
    } catch {
      // Se parsing falhar, não bloquear
    }
  }
}

// Função para testar conexão
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

// Função para obter informações do ambiente atual
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

/**
 * Retorna o pool de conexões PostgreSQL local (dev/test)
 * Usado por helpers de transação que precisam de PoolClient dedicado
 */
export function getPool(): pg.Pool {
  if (!localPool) {
    throw new Error(
      'Pool de conexões não disponível. getPool() só funciona em ambiente local (dev/test).'
    );
  }
  return localPool;
}

// Fechar pool local (útil para testes)
export async function closePool() {
  if (localPool) {
    await localPool.end();
    localPool = null;
  }
}

/**
 * Executa operações dentro de uma transação
 * Faz rollback automático em caso de erro
 */
export async function transaction<T>(
  callback: (client: TransactionClient) => Promise<T>,
  session?: Session
): Promise<T> {
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
    // Para Neon, não temos suporte a transações no mesmo nível
    // Por enquanto, executamos as queries sequencialmente
    console.warn(
      '[db][transaction] Transações nativas não suportadas em Neon - executando queries sequencialmente'
    );

    const txClient: TransactionClient = {
      query: async <R = any>(text: string, params?: unknown[]) => {
        return await query<R>(text, params, session);
      },
    };

    return await callback(txClient);
  } else {
    throw new Error(
      `Nenhuma conexão configurada para ambiente: ${environment}`
    );
  }
}

/**
 * Interface para cliente de transação
 */
export interface TransactionClient {
  query: <T = any>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;
}

// ============================================================================
// ====================================================================
// HELPERS PARA ENTIDADES (Clínicas e Entidades tomadors)
// Anteriormente "HELPERS PARA tomadorS" - renomeado na Migration 420
// ============================================================================

export type TipoEntidade = 'clinica' | 'entidade';
export type StatusAprovacao =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'em_reanalise'
  | 'aguardando_pagamento';

export interface Entidade {
  id: number;
  tipo: TipoEntidade;
  nome: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo?: string;
  responsavel_email: string;
  responsavel_celular: string;
  cartao_cnpj_path?: string;
  contrato_social_path?: string;
  doc_identificacao_path?: string;
  status: StatusAprovacao;
  motivo_rejeicao?: string;
  observacoes_reanalise?: string;
  ativa: boolean;
  plano_id?: number;
  plano_tipo?: string;
  plano_nome?: string;
  pagamento_confirmado: boolean;
  numero_funcionarios_estimado?: number;
  criado_em: Date;
  atualizado_em: Date;
  aprovado_em?: Date;
  aprovado_por_cpf?: string;
}

export interface EntidadeFuncionario {
  id: number;
  funcionario_id: number;
  entidade_id: number;
  tipo_tomador: TipoEntidade;
  vinculo_ativo: boolean;
  data_inicio: Date;
  data_fim?: Date;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Buscar entidades por tipo
 */
export async function getEntidadesByTipo(
  tipo?: TipoEntidade,
  session?: Session
): Promise<Entidade[]> {
  // Exclui entidades pendentes de aprovação (status='pendente', 'em_reanalise', 'aguardando_pagamento')
  // Esses aparecem em "Novos Cadastros", não em "Entidades"
  const queryText = tipo
    ? `SELECT * FROM entidades 
       WHERE tipo = $1 
       AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`
    : `SELECT * FROM entidades 
       WHERE status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`;
  const params = tipo ? [tipo] : [];
  const result = await query<Entidade>(queryText, params, session);
  return result.rows;
}

/**
 * Buscar entidade por ID
 */
export async function getEntidadeById(
  id: number,
  session?: Session
): Promise<Entidade | null> {
  const result = await query<Entidade>(
    `SELECT c.*, p.tipo as plano_tipo, p.nome as plano_nome
     FROM entidades c
     LEFT JOIN planos p ON c.plano_id = p.id
     WHERE c.id = $1`,
    [id],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar entidades pendentes de aprovação
 * Inclui status 'aguardando_pagamento' para permitir regeneração de links
 */
export async function getEntidadesPendentes(
  tipo?: TipoEntidade,
  session?: Session
): Promise<Entidade[]> {
  const queryText = tipo
    ? `SELECT c.*, p.tipo as plano_tipo, p.nome as plano_nome
       FROM entidades c
       LEFT JOIN planos p ON c.plano_id = p.id
       WHERE c.status IN ($1, $2, $3) AND c.tipo = $4
       ORDER BY c.criado_em DESC`
    : `SELECT c.*, p.tipo as plano_tipo, p.nome as plano_nome
       FROM entidades c
       LEFT JOIN planos p ON c.plano_id = p.id
       WHERE c.status IN ($1, $2, $3)
       ORDER BY c.tipo, c.criado_em DESC`;

  const params = tipo
    ? ['pendente', 'em_reanalise', 'aguardando_pagamento', tipo]
    : ['pendente', 'em_reanalise', 'aguardando_pagamento'];

  const result = await query<Entidade>(queryText, params, session);
  return result.rows;
}

/**
 * Criar novo tomador (via modal de cadastro)
 */
export async function createEntidade(
  data: Omit<
    Entidade,
    'id' | 'criado_em' | 'atualizado_em' | 'aprovado_em' | 'aprovado_por_cpf'
  >,
  session?: Session
): Promise<Entidade> {
  if (DEBUG_DB) {
    console.debug('[CREATE_tomador] Iniciando criação com dados:', {
      tipo: data.tipo,
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      responsavel_cpf: data.responsavel_cpf,
    });
  }
  // Verificar se email já existe
  const emailCheck = await query(
    'SELECT id FROM entidades WHERE email = $1',
    [data.email],
    session
  );
  if (emailCheck.rows.length > 0) {
    throw new Error('Email já cadastrado no sistema');
  }

  // Verificar se CNPJ já existe
  const cnpjCheck = await query(
    'SELECT id FROM entidades WHERE cnpj = $1',
    [data.cnpj],
    session
  );
  if (cnpjCheck.rows.length > 0) {
    throw new Error('CNPJ já cadastrado no sistema');
  }

  // Verificar se CPF do responsável já existe em entidades (apenas se aprovado)
  const cpfCheckEntidades = await query(
    'SELECT id, status FROM entidades WHERE responsavel_cpf = $1',
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckEntidades.rows.length > 0) {
    const entidadeExistente = cpfCheckEntidades.rows[0];
    if (entidadeExistente.status === 'aprovado') {
      throw new Error(
        'CPF do responsável já cadastrado no sistema (entidade aprovada)'
      );
    }
    // Se não aprovado, permitir re-cadastro (pode ter sido rejeitado ou está pendente)
  }

  // Verificar se CPF do responsável já existe em funcionários de OUTRA entidade
  // Um gestor pode ser responsável por sua própria clínica, mas não pode ser funcionário
  // de uma clínica E responsável por outra clínica diferente
  const cpfCheckFuncionarios = await query(
    `SELECT f.id, f.perfil, c.id as entidade_id, c.cnpj as entidade_cnpj
     FROM funcionarios f
     INNER JOIN clinicas cl ON f.clinica_id = cl.id
     INNER JOIN entidades c ON cl.entidade_id = c.id
     WHERE f.cpf = $1`,
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckFuncionarios.rows.length > 0) {
    const funcionario = cpfCheckFuncionarios.rows[0];
    // Se o CPF já é funcionário de outra entidade, não permitir
    // (evita conflito de interesse entre clínicas)
    if (funcionario.entidade_cnpj !== data.cnpj) {
      throw new Error(
        `CPF do responsável já vinculado como funcionário em outra entidade (CNPJ: ${funcionario.entidade_cnpj})`
      );
    }
    // Se é do mesmo CNPJ, permitir - pode ser o gestor se cadastrando
  }

  // Garantir que colunas adicionadas por migração existam (adicionar se ausentes)
  try {
    await query(
      `ALTER TABLE entidades
       ADD COLUMN IF NOT EXISTS plano_id INTEGER,
       ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN DEFAULT false,
       ADD COLUMN IF NOT EXISTS data_liberacao_login TIMESTAMP,
       ADD COLUMN IF NOT EXISTS data_primeiro_pagamento TIMESTAMP`,
      [],
      session
    );
  } catch (err) {
    // Não falhar se alter table não puder ser executado por permissões; log para debugging
    console.warn('Aviso: não foi possível garantir colunas em entidades:', err);
  }

  // Garantir valores seguros para novas entidades (inativo por padrão até confirmação) (revisado para contract-first)
  // Independente dos valores passados, novas entidades SEMPRE começam inativas
  // e sem pagamento/contrato até confirmarem o pagamento
  // Inserção com retry para conter problemas de enum em bancos locais antigos
  let result: QueryResult<Entidade>;
  try {
    result = await query<Entidade>(
      `INSERT INTO entidades (
        tipo, nome, cnpj, inscricao_estadual, email, telefone,
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
        status, motivo_rejeicao, observacoes_reanalise, ativa, plano_id, pagamento_confirmado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, $22, false
      ) RETURNING *`,
      [
        data.tipo,
        data.nome,
        data.cnpj,
        data.inscricao_estadual,
        data.email,
        data.telefone,
        data.endereco,
        data.cidade,
        data.estado,
        data.cep,
        data.responsavel_nome,
        data.responsavel_cpf,
        data.responsavel_cargo,
        data.responsavel_email,
        data.responsavel_celular,
        data.cartao_cnpj_path,
        data.contrato_social_path,
        data.doc_identificacao_path,
        data.status,
        data.motivo_rejeicao,
        data.observacoes_reanalise,
        // $22 - ativa: sempre false (hardcoded no SQL)
        data.plano_id,
        // $23 - pagamento_confirmado: sempre false (hardcoded no SQL)
      ],
      session
    );
  } catch (err: any) {
    // Se o erro indicar valor inválido para enum (p.ex. banco local não atualizado), tentar com status 'pendente'
    const msg = String(err?.message || err);
    if (
      msg.includes('invalid input value for enum') ||
      msg.includes('valor de entrada é inválido para enum') ||
      msg.includes('status_aprovacao_enum')
    ) {
      console.warn(
        '[CREATE_ENTIDADE] Enum status inconsistente no DB, tentando inserir com status fallback "pendente"',
        { error: msg }
      );
      result = await query<Entidade>(
        `INSERT INTO entidades (
          tipo, nome, cnpj, inscricao_estadual, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, motivo_rejeicao, observacoes_reanalise, ativa, plano_id, pagamento_confirmado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, $22, false
        ) RETURNING *`,
        [
          data.tipo,
          data.nome,
          data.cnpj,
          data.inscricao_estadual,
          data.email,
          data.telefone,
          data.endereco,
          data.cidade,
          data.estado,
          data.cep,
          data.responsavel_nome,
          data.responsavel_cpf,
          data.responsavel_cargo,
          data.responsavel_email,
          data.responsavel_celular,
          data.cartao_cnpj_path,
          data.contrato_social_path,
          data.doc_identificacao_path,
          'pendente',
          data.motivo_rejeicao,
          data.observacoes_reanalise,
          data.plano_id,
        ],
        session
      );
    } else {
      throw err;
    }
  }
  const tomadorCriado = result.rows[0];
  console.log('[CREATE_tomador] Entidade criado com sucesso:', {
    id: tomadorCriado.id,
    cnpj: tomadorCriado.cnpj,
    tipo: tomadorCriado.tipo,
  });
  return tomadorCriado;
}

/**
 * Aprovar entidade
 */
export async function aprovarEntidade(
  id: number,
  aprovadoPorCpf: string,
  session?: Session
): Promise<Entidade> {
  // Primeiro, buscar a entidade para verificar o tipo
  const entidadeResult = await query<Entidade>(
    'SELECT * FROM entidades WHERE id = $1',
    [id],
    session
  );

  if (entidadeResult.rows.length === 0) {
    throw new Error('Entidade não encontrada');
  }

  const entidade = entidadeResult.rows[0];

  // Aprovar a entidade (apenas altera status, NÃO ativa automaticamente)
  // Nota: ativação deve ser controlada por contrato aceito e confirmações apropriadas
  const result = await query<Entidade>(
    `UPDATE entidades
     SET status = 'aprovado',
         aprovado_em = CURRENT_TIMESTAMP,
         aprovado_por_cpf = $2
     WHERE id = $1
     RETURNING *`,
    [id, aprovadoPorCpf],
    session
  );

  const entidadeAprovada = result.rows[0];

  // Se for uma clínica, criar entrada na tabela clinicas
  if (entidade.tipo === 'clinica') {
    try {
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, entidade_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cnpj) DO UPDATE SET entidade_id = EXCLUDED.entidade_id, ativa = COALESCE(clinicas.ativa, true), atualizado_em = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          entidade.nome,
          entidade.cnpj,
          entidade.email,
          entidade.telefone,
          entidade.endereco,
          entidade.id,
        ],
        session
      );

      if (clinicaResult.rows.length > 0) {
        console.log(
          `[APROVAR_ENTIDADE] Clínica criada com ID: ${clinicaResult.rows[0].id} para entidade ${entidade.id}`
        );
      }
    } catch (error) {
      console.error('[APROVAR_ENTIDADE] Erro ao criar clínica:', error);
      // Não falhar a aprovação se houver erro na criação da clínica
    }
  }

  return entidadeAprovada;
}

/**
 * Ativar entidade após pagamento confirmado
 * Verifica condições antes de ativar entidade (pagamento confirmado e recibo emitido)
 */
export async function ativarEntidade(
  id: number,
  session?: Session
): Promise<{ success: boolean; message: string; tomador?: Entidade }> {
  // Verificar estado atual
  const checkResult = await query<{
    pagamento_confirmado: boolean;
    ativa: boolean;
  }>(
    'SELECT pagamento_confirmado, ativa FROM entidades WHERE id = $1',
    [id],
    session
  );

  if (checkResult.rows.length === 0) {
    return { success: false, message: 'Entidade não encontrada' };
  }

  const { pagamento_confirmado, ativa } = checkResult.rows[0];

  if (DEBUG_DB)
    console.log(
      `[ativarEntidade] ID=${id}, pagamento_confirmado=${pagamento_confirmado}, ativa=${ativa}`
    );

  if (ativa) {
    return { success: false, message: 'Entidade já está ativo' };
  }

  if (!pagamento_confirmado) {
    return { success: false, message: 'Pagamento não confirmado' };
  }

  // Verificar recibo - geração pode ser sob demanda. Se não existir, registrar aviso e prosseguir
  const reciboCheck = await query(
    'SELECT id FROM recibos WHERE entidade_id = $1 AND cancelado = false LIMIT 1',
    [id],
    session
  );
  if (reciboCheck.rows.length === 0) {
    if (DEBUG_DB)
      console.warn(
        `[ativarEntidade] Nenhum recibo encontrado para entidade ${id}. Prosseguindo porque recibos são gerados sob demanda.`
      );
  }

  // Ativar a entidade e marcar aprovado se ainda não estiver aprovado.
  const result = await query<Entidade>(
    `UPDATE entidades
     SET ativa = true,
         data_liberacao_login = CURRENT_TIMESTAMP,
         status = CASE WHEN status <> 'aprovado' THEN 'aprovado' ELSE status END,
         aprovado_em = COALESCE(aprovado_em, CURRENT_TIMESTAMP),
         aprovado_por_cpf = COALESCE(aprovado_por_cpf, '00000000000')
     WHERE id = $1
     RETURNING *`,
    [id],
    session
  );

  if (result.rows.length === 0) {
    return { success: false, message: 'Falha ao ativar tomador' };
  }

  console.log(`[ativarEntidade] Entidade ativado: ${result.rows[0].nome}`);

  return {
    success: true,
    message: 'Entidade ativado com sucesso',
    tomador: result.rows[0],
  };
}

/**
 * Rejeitar entidade
 */
export async function rejeitarEntidade(
  id: number,
  motivo: string,
  session?: Session
): Promise<Entidade> {
  const result = await query<Entidade>(
    `UPDATE entidades 
     SET status = 'rejeitado', motivo_rejeicao = $2
     WHERE id = $1 
     RETURNING *`,
    [id, motivo],
    session
  );
  return result.rows[0];
}

/**
 * Solicitar reanálise
 */
export async function solicitarReanalise(
  id: number,
  observacoes: string,
  session?: Session
): Promise<Entidade> {
  const result = await query<Entidade>(
    `UPDATE entidades
     SET status = 'em_reanalise',
         observacoes_reanalise = $2,
         -- Resetar flags de pagamento para permitir novo fluxo
         ativa = false,
         pagamento_confirmado = false,
         data_liberacao_login = NULL,
         data_primeiro_pagamento = NULL
     WHERE id = $1
     RETURNING *`,
    [id, observacoes],
    session
  );
  return result.rows[0];
}

/**
 * Criar vínculo polimórfico entre funcionário e tomador
 */
export async function vincularFuncionarioEntidade(
  funcionarioId: number,
  entidadeId: number,
  tipoEntidade: TipoEntidade,
  session?: Session
): Promise<EntidadeFuncionario> {
  const result = await query<EntidadeFuncionario>(
    `INSERT INTO entidades_funcionarios (funcionario_id, entidade_id, tipo_tomador, vinculo_ativo)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (funcionario_id, entidade_id) 
     DO UPDATE SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP
     RETURNING *`,
    [funcionarioId, entidadeId, tipoEntidade],
    session
  );
  return result.rows[0];
}

/**
 * Buscar entidade de um funcionário
 */
export async function getEntidadeDeFuncionario(
  funcionarioId: number,
  session?: Session
): Promise<Entidade | null> {
  const result = await query<Entidade>(
    `SELECT c.* FROM entidades c
     INNER JOIN entidades_funcionarios cf ON cf.entidade_id = c.id
     WHERE cf.funcionario_id = $1 AND cf.vinculo_ativo = true AND c.ativa = true
     ORDER BY cf.criado_em DESC
     LIMIT 1`,
    [funcionarioId],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar funcionários de um tomador
 */
export async function getFuncionariosDeEntidade(
  entidadeId: number,
  apenasAtivos: boolean = true,
  session?: Session
) {
  const queryText = apenasAtivos
    ? `SELECT f.* FROM funcionarios f
       INNER JOIN entidades_funcionarios cf ON cf.funcionario_id = f.id
       WHERE cf.entidade_id = $1 AND cf.vinculo_ativo = true AND f.ativo = true`
    : `SELECT f.* FROM funcionarios f
       INNER JOIN entidades_funcionarios cf ON cf.funcionario_id = f.id
       WHERE cf.entidade_id = $1`;

  const result = await query(queryText, [entidadeId], session);
  return result.rows;
}

/**
 * Helper seguro para queries multi-tenant
 * Garante filtro obrigatório por clinica_id ou entidade_id
 */
export async function queryMultiTenant<T = unknown>(
  text: string,
  params: unknown[],
  tenantFilter: { clinica_id?: number; entidade_id?: number },
  session?: Session
): Promise<QueryResult<T>> {
  // Validar que pelo menos um filtro foi fornecido
  if (!tenantFilter.clinica_id && !tenantFilter.entidade_id) {
    throw new Error(
      'ERRO DE SEGURANÇA: queryMultiTenant requer clinica_id ou entidade_id'
    );
  }

  // Adicionar filtro de tenant à query
  let filteredQuery = text;
  const filteredParams = [...params];

  if (tenantFilter.clinica_id) {
    // Verificar se a query já contém WHERE
    const hasWhere = /WHERE/i.test(filteredQuery);
    filteredQuery += hasWhere
      ? ` AND clinica_id = $${filteredParams.length + 1}`
      : ` WHERE clinica_id = $${filteredParams.length + 1}`;
    filteredParams.push(tenantFilter.clinica_id);
  }

  if (tenantFilter.entidade_id) {
    const hasWhere = /WHERE/i.test(filteredQuery);
    filteredQuery += hasWhere
      ? ` AND entidade_id = $${filteredParams.length + 1}`
      : ` WHERE entidade_id = $${filteredParams.length + 1}`;
    filteredParams.push(tenantFilter.entidade_id);
  }

  return query<T>(filteredQuery, filteredParams, session);
}

/**
 * Contar funcionários ativos para um contrato de plano
 */
export async function contarFuncionariosAtivos(
  contratoId: number,
  session?: Session
): Promise<number> {
  const result = await query<{ total: number }>(
    `SELECT COUNT(DISTINCT f.cpf) as total
     FROM contratos_planos cp
     LEFT JOIN funcionarios f ON (
       (cp.tipo_tomador = 'clinica' AND f.clinica_id = cp.clinica_id AND f.status = 'ativo')
       OR 
       (cp.tipo_tomador = 'entidade' AND f.entidade_id = cp.entidade_id AND f.status = 'ativo')
     )
     WHERE cp.id = $1`,
    [contratoId],
    session
  );

  return result.rows[0]?.total || 0;
}

/**
 * Obter notificações financeiras não lidas
 */
export async function getNotificacoesFinanceiras(
  contratoId?: number,
  apenasNaoLidas: boolean = true,
  session?: Session
) {
  let queryText = 'SELECT * FROM notificacoes_financeiras';
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  // Excluir notificações de pendência de pagamento (desabilitadas)
  whereClauses.push('tipo != $1');
  params.push('parcela_pendente');

  if (contratoId) {
    whereClauses.push(`id = $${params.length + 1}`);
    params.push(contratoId);
  }

  if (apenasNaoLidas) {
    whereClauses.push(`lida = false`);
  }

  if (whereClauses.length > 0) {
    queryText += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params, session);
  return result.rows;
}

/**
 * Marcar notificação como lida
 */
export async function marcarNotificacaoComoLida(
  notificacaoId: number,
  session?: Session
) {
  const result = await query(
    'UPDATE notificacoes_financeiras SET lida = true, lida_em = NOW() WHERE id = $1 RETURNING *',
    [notificacaoId],
    session
  );
  return result.rows[0];
}

/**
 * Obter contratos de planos para uma clínica ou entidade
 */
export async function getContratosPlanos(
  filter: {
    clinica_id?: number;
    entidade_id?: number;
  },
  session?: Session
) {
  if (!filter.clinica_id && !filter.entidade_id) {
    throw new Error('Filtro de clinica_id ou entidade_id é obrigatório');
  }

  let queryText = `
    SELECT cp.*, p.nome as plano_nome, p.tipo as plano_tipo
    FROM contratos_planos cp
    JOIN planos p ON cp.plano_id = p.id
    WHERE cp.status = 'ativo'
  `;
  const params: unknown[] = [];

  if (filter.clinica_id) {
    params.push(filter.clinica_id);
    queryText += ` AND cp.clinica_id = $${params.length}`;
  }

  if (filter.entidade_id) {
    params.push(filter.entidade_id);
    queryText += ` AND cp.entidade_id = $${params.length}`;
  }

  queryText += ' ORDER BY cp.created_at DESC';

  const result = await query(queryText, params, session);
  return result.rows;
}

/**
 * Criar conta para responsável do tomador
 * @param tomador - ID or object of tomador (entidade ou clinica)
 */
export async function criarContaResponsavel(
  tomador: number | Entidade,
  session?: Session
) {
  let tomadorData: Entidade;
  let tabelaTomadorOrigem = 'entidades'; // rastreia em qual tabela foi encontrado

  // Se recebeu um número (ID), buscar os dados da entidade OU clinica
  if (typeof tomador === 'number') {
    // IMPORTANTE: Buscar em CLINICAS primeiro (pois são inseridas direto lá)
    let result = await query(
      'SELECT * FROM clinicas WHERE id = $1',
      [tomador],
      session
    );

    if (result.rows.length > 0) {
      tomadorData = result.rows[0];
      tabelaTomadorOrigem = 'clinicas';
    } else {
      // Se não encontrou em clinicas, buscar em entidades
      result = await query(
        'SELECT * FROM entidades WHERE id = $1',
        [tomador],
        session
      );
      if (result.rows.length === 0) {
        throw new Error(
          `Tomador ${tomador} não encontrado em entidades ou clinicas`
        );
      }
      tomadorData = result.rows[0] as Entidade;
      tabelaTomadorOrigem = 'entidades';
    }
  } else {
    tomadorData = tomador;
  }

  // Se estamos usando uma clínica e não temos responsavel_cpf, buscar da entidade associada
  // Nota: clinicas não têm relação direta com entidades no banco, então essa verificação não é necessária
  // if (
  //   tabelaTomadorOrigem === 'clinicas' &&
  //   !tomadorData.responsavel_cpf &&
  //   (tomadorData as any).entidade_id
  // ) {
  //   const entidadeResult = await query(
  //     'SELECT responsavel_cpf FROM entidades WHERE id = $1',
  //     [(tomadorData as any).entidade_id],
  //     session
  //   );
  //   if (entidadeResult.rows.length > 0) {
  //     tomadorData.responsavel_cpf = entidadeResult.rows[0].responsavel_cpf;
  //   }
  // }

  if (DEBUG_DB) {
    console.debug('[CRIAR_CONTA] Iniciando criação de conta para:', {
      id: tomadorData.id,
      cnpj: tomadorData.cnpj,
      responsavel_cpf: tomadorData.responsavel_cpf,
      tipo: tomadorData.tipo,
      origem: tabelaTomadorOrigem,
    });
  }

  // Se CNPJ não estiver no objeto, buscar do banco
  let cnpj = tomadorData.cnpj;
  if (!cnpj) {
    if (DEBUG_DB)
      console.debug(
        '[CRIAR_CONTA] CNPJ não encontrado no objeto, buscando do banco...'
      );
    // Buscar na tabela original onde foi encontrado
    const tomadorResult = await query(
      `SELECT cnpj FROM ${tabelaTomadorOrigem} WHERE id = $1`,
      [tomadorData.id],
      session
    );
    if (tomadorResult.rows.length > 0) {
      cnpj = tomadorResult.rows[0].cnpj;
      if (DEBUG_DB)
        console.debug('[CRIAR_CONTA] CNPJ encontrado no banco:', cnpj);
    }
  }

  // Validar se CNPJ existe
  if (!cnpj) {
    console.error(
      '[CRIAR_CONTA ERROR] CNPJ não encontrado nem no objeto nem no banco:',
      tomadorData
    );
    throw new Error('CNPJ do tomador é obrigatório para criar conta');
  }

  // Senha baseada nos últimos 6 dígitos do CNPJ (removendo formatação)
  const cleanCnpj = cnpj.replace(/[./-]/g, '');
  const defaultPassword = cleanCnpj.slice(-6);
  const hashed = await bcrypt.hash(defaultPassword, 10);

  // Para entidades sem CPF do responsável, usar últimos 11 dígitos do CNPJ como identificador
  // (campo cpf em clinicas_senhas é character varying(11), não suporta 14 dígitos)
  const cpfParaUsar = tomadorData.responsavel_cpf || cleanCnpj.slice(-11);

  if (DEBUG_DB) {
    console.debug(`[CRIAR_CONTA] CPF: ${cpfParaUsar}, CNPJ: ${cnpj}`);
  }

  // 1. Determinar tipo de usuário e tabela de senha baseado na origem ou no campo tipo
  let tipoUsuario: 'gestor' | 'rh' = 'gestor';
  let tabelaSenha = 'entidades_senhas';
  let campoId = 'entidade_id';

  // Se tipo está definido no objeto, usar isso
  if (tomadorData.tipo === 'clinica') {
    tipoUsuario = 'rh';
    tabelaSenha = 'clinicas_senhas';
    campoId = 'clinica_id';
  } else if (tomadorData.tipo === 'entidade') {
    tipoUsuario = 'gestor';
    tabelaSenha = 'entidades_senhas';
    campoId = 'entidade_id';
  } else {
    // Se tipo não está definido, usar a tabela de origem
    if (tabelaTomadorOrigem === 'clinicas') {
      tipoUsuario = 'rh';
      tabelaSenha = 'clinicas_senhas';
      campoId = 'clinica_id';
      tomadorData.tipo = 'clinica'; // garantir que tipo esteja definido
    } else {
      tipoUsuario = 'gestor';
      tabelaSenha = 'entidades_senhas';
      campoId = 'entidade_id';
      tomadorData.tipo = 'entidade'; // garantir que tipo esteja definido
    }
  }

  // 2. referenceId é sempre tomadorData.id (já é o clinica_id ou entidade_id correto)
  const referenceId: number = tomadorData.id;

  if (DEBUG_DB) {
    console.debug(
      `[CRIAR_CONTA] tipo=${tomadorData.tipo}, tipoUsuario=${tipoUsuario}, referenceId=${referenceId}, tabelaSenha=${tabelaSenha}, origem=${tabelaTomadorOrigem}`
    );
  }

  // 3. Criar senha na tabela apropriada (entidades_senhas ou clinicas_senhas)
  // UPSERT para garantir atomicidade e evitar erros de duplicação de chave
  try {
    // SQL UPSERT com ON CONFLICT - mais robusto que CHECK manual
    const upsertQuery = `
      INSERT INTO ${tabelaSenha} (${campoId}, cpf, senha_hash, criado_em, atualizado_em)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (cpf) DO UPDATE
      SET senha_hash = EXCLUDED.senha_hash, atualizado_em = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await query(
      upsertQuery,
      [referenceId, cpfParaUsar, hashed],
      session
    );

    if (result.rows.length > 0) {
      console.log(
        `[CRIAR_CONTA] Senha criada/atualizada em ${tabelaSenha} para CPF ${cpfParaUsar}, campo=${campoId}, id=${referenceId}`
      );
    } else {
      throw new Error('UPSERT retornou sem resultado');
    }
  } catch (err) {
    console.error(
      `[CRIAR_CONTA] Erro ao inserir/atualizar em ${tabelaSenha}:`,
      err
    );
    throw err;
  }

  // Verificar se foi inserido corretamente
  const checkResult = await query(
    `SELECT senha_hash, length(senha_hash) as hash_len FROM ${tabelaSenha} WHERE ${campoId} = $1 AND cpf = $2`,
    [referenceId, cpfParaUsar],
    session
  );

  if (checkResult.rows.length > 0) {
    const stored = checkResult.rows[0];
    if (stored.hash_len !== hashed.length) {
      console.error(
        `[CRIAR_CONTA ERROR] Hash truncado: armazenado ${stored.hash_len} chars (esperado ${hashed.length})`
      );
    }

    // Testar se o hash armazenado funciona com a senha
    const testMatch = await bcrypt.compare(defaultPassword, stored.senha_hash);
    if (DEBUG_DB) {
      console.debug(
        `[CRIAR_CONTA] Teste de senha para CPF ${cpfParaUsar}: ${testMatch ? 'SUCESSO' : 'FALHA'}`
      );
    }
  } else {
    console.error(
      `[CRIAR_CONTA ERROR] Senha não encontrada após inserção para CPF ${cpfParaUsar}`
    );
  }

  // 4. Criar/atualizar registro em USUARIOS (sem senha_hash, só referência)
  try {
    // Determinar clinica_id ou entidade_id
    let clinicaId = null;
    let usuarioEntidadeId = null;

    if (tipoUsuario === 'rh') {
      clinicaId = referenceId;
    } else {
      usuarioEntidadeId = tomadorData.id;
    }

    // Verificar se usuário já existe
    const usuarioExistente = await query(
      'SELECT id FROM usuarios WHERE cpf = $1',
      [cpfParaUsar],
      session
    );

    if (usuarioExistente.rows.length > 0) {
      // Atualizar usuário existente
      await query(
        `UPDATE usuarios 
         SET nome = $1, email = $2, tipo_usuario = $3, 
             clinica_id = $4, entidade_id = $5, ativo = true, atualizado_em = CURRENT_TIMESTAMP 
         WHERE cpf = $6`,
        [
          tomadorData.responsavel_nome || 'Gestor',
          tomadorData.responsavel_email || null,
          tipoUsuario,
          clinicaId,
          usuarioEntidadeId,
          cpfParaUsar,
        ],
        session
      );
      if (DEBUG_DB) {
        console.debug(
          `[CRIAR_CONTA] Usuário atualizado: CPF=${cpfParaUsar}, tipo=${tipoUsuario}`
        );
      }
    } else {
      // Inserir novo usuário
      await query(
        `INSERT INTO usuarios (cpf, nome, email, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          cpfParaUsar,
          tomadorData.responsavel_nome || 'Gestor',
          tomadorData.responsavel_email || null,
          tipoUsuario,
          clinicaId,
          usuarioEntidadeId,
        ],
        session
      );
      if (DEBUG_DB) {
        console.debug(
          `[CRIAR_CONTA] Usuário criado: CPF=${cpfParaUsar}, tipo=${tipoUsuario}`
        );
      }
    }

    console.log(
      `[CRIAR_CONTA] ✅ Conta criada em 'usuarios' para ${tipoUsuario} (CPF: ${cpfParaUsar}), senha em ${tabelaSenha}`
    );
  } catch (err) {
    console.error('[CRIAR_CONTA] ❌ Erro ao criar/atualizar usuário:', err);
    throw err;
  }

  console.log(
    `Conta processada para responsável ${cpfParaUsar} do tomador ${tomadorData.id} (senha padrão definida)`
  );
}

/**
 * Criar senha inicial para entidade (gestor)
 * Chama a função SQL criar_senha_inicial_entidade
 */
export async function criarSenhaInicialEntidade(
  entidadeId: number,
  session?: Session
): Promise<void> {
  await query('SELECT criar_senha_inicial_entidade($1)', [entidadeId], session);

  console.log(`Senha inicial criada para entidade tomador ${entidadeId}`);
}

/**
 * Criar emissor independente (sem vinculo a clinica_id)
 * Usado por admins para criar emissores globais
 */
export async function criarEmissorIndependente(
  cpf: string,
  nome: string,
  email: string,
  senha?: string,
  session?: Session
): Promise<{ cpf: string; nome: string; email: string; clinica_id: null }> {
  // Validar que usuário é admin
  if (session && session.perfil !== 'admin') {
    throw new Error(
      'Apenas administradores podem criar emissores independentes'
    );
  }

  // Limpar CPF (remover formatação)
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Hash da senha (padrão 123456 se não fornecida)
  const senhaHash = await bcrypt.hash(senha || '123456', 10);

  // Inserir emissor em `usuarios` (contas do sistema devem existir em `usuarios`)
  const result = await query(
    `INSERT INTO usuarios (
      cpf,
      nome,
      email,
      tipo_usuario,
      senha_hash,
      ativo,
      criado_em,
      atualizado_em
    )
    VALUES ($1, $2, $3, 'emissor', $4, true, NOW(), NOW())
    ON CONFLICT (cpf) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      tipo_usuario = EXCLUDED.tipo_usuario,
      senha_hash = EXCLUDED.senha_hash,
      ativo = EXCLUDED.ativo,
      atualizado_em = CURRENT_TIMESTAMP
    RETURNING cpf, nome, email`,
    [cpfLimpo, nome, email, senhaHash],
    session
  );

  if (DEBUG_DB) {
    console.debug(
      `[CRIAR_EMISSOR] Emissor independente criado: ${cpfLimpo} (clinica_id = NULL)`
    );
  }

  // Compatibilidade: alguns esquemas mais antigos usam a coluna `role` em vez de `tipo_usuario`.
  // Tentamos atualizar `role = 'emissor'` quando a coluna existir; se não existir, ignoramos o erro.
  try {
    await query(
      `UPDATE usuarios SET role = 'emissor' WHERE cpf = $1`,
      [cpfLimpo],
      session
    );
  } catch (err: any) {
    // Código 42703 = undefined_column (coluna não existe) — podemos ignorar
    if (err && err.code && err.code === '42703') {
      if (DEBUG_DB) {
        console.debug(
          '[CRIAR_EMISSOR] Coluna `role` não existe no schema local — ignorando.'
        );
      }
    } else {
      // Para outros erros, apenas logamos (não interromper a criação)
      console.warn(
        '[CRIAR_EMISSOR] Falha ao atualizar coluna `role` (não bloqueante):',
        err
      );
    }
  }

  return {
    cpf: result.rows[0].cpf,
    nome: result.rows[0].nome,
    email: result.rows[0].email,
    clinica_id: null,
  };
}

// ====================================================================
// ALIASES DE RETROCOMPATIBILIDADE
// TODO: Remover após atualizar todos os arquivos que referenciam funções antigas
// ====================================================================

/**
 * @deprecated Use getEntidadesByTipo ao invés. Será removido após refatoração completa.
 */
export const gettomadorsByTipo = getEntidadesByTipo;

/**
 * @deprecated Use getEntidadesPendentes ao invés. Será removido após refatoração completa.
 */
export const gettomadorsPendentes = getEntidadesPendentes;
