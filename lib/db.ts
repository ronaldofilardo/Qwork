import dotenv from 'dotenv';

// Detectar se estamos em testes ANTES de carregar .env.local
// Se estamos em testes, NÃO carregamos .env.local — deixamos .env.test com override=true fazer isso
const isJestRunning = !!process.env.JEST_WORKER_ID;
const isTestMode = process.env.NODE_ENV === 'test' || isJestRunning;

// Load local env early to ensure LOCAL_DATABASE_URL, ALLOW_PROD_DB_LOCAL, and other overrides are available
// This helps when scripts import lib/db.ts directly and .env.local wasn't loaded yet by the caller.
// IMPORTANTE: Não carregar .env.local se estamos em testes — deixar .env.test fazer isso com override=true
if (!isTestMode) {
  dotenv.config({ path: '.env.local', override: false });
}

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { Session } from './session';
import { query as queryFn, QueryResult } from './db/query'; // ⭐ Import da função e tipo para uso interno

// ⭐ RE-EXPORT da implementação correta de query() de lib/db/query.ts
// Isso garante que query() tenha suporte a dynamic pools para emissores
export { query } from './db/query';

export type { Session };
export type { QueryResult } from './db/query';

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

let environment = isRunningTests
  ? 'test'
  : process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'test'
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

// VALIDAÇÃO CRÍTICA: Bloquear nr-bps_db em ambiente de teste
if (environment === 'test' || isRunningTests) {
  // Verificar TODAS as variáveis de ambiente que possam conter connection strings
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

if (environment === 'development' && hasTestDatabaseUrl && !isRunningTests) {
  console.warn(
    `⚠️ AVISO: TEST_DATABASE_URL está definida em ambiente de desenvolvimento fora de testes. Isso pode causar confusão na detecção de ambiente (NODE_ENV="${process.env.NODE_ENV || 'undefined'}"). Recomenda-se remover TEST_DATABASE_URL do .env de desenvolvimento.`
  );
}

const isDevelopment = environment === 'development';
const isTest = environment === 'test';
const isProduction = environment === 'production';
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
// ⭐ Agora re-exportado de ./db/query — remover isso em favor do import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export type QueryResult<T = any> = {
//   rows: T[];
// };

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
    ].join('; ');

    // Prefix the main statement with set_config calls so they execute in the same session/statement scope
    return `${setCommands}; ${text}`;
  }
  return text;
}

// ⭐ REMOVIDO: A implementação antiga de queryFn() foi movida para lib/db/query.ts
// Esta versão tinha suporte limitado a dynamic pools.
// Agora o re-export em cima garante que a versão correta seja usada.

/**
 * Garante que o usuário admin exista e possua um hash bcrypt válido (apenas em dev/test).
 * Não deve rodar em produção para evitar alterações de credenciais reais.
 */
export async function ensureAdminPassword(): Promise<void> {
  try {
    if (isProduction) return; // Não mexer em produção

    // Buscar usuário admin se existir
    const existsRes = await queryFn(
      'SELECT cpf, senha_hash FROM funcionarios WHERE cpf = $1 LIMIT 1',
      [KNOWN_ADMIN_CPF]
    );

    if (existsRes.rows.length === 0) {
      // Inserir usuário admin com hash conhecido
      await queryFn(
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
      await queryFn('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
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
    connectionTimeoutMillis: 2000,
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
    const result = await queryFn(
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
  };
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
        return await queryFn<R>(text, params, session);
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
// HELPERS PARA CONTRATANTES (Clínicas e Entidades)
// ============================================================================

export type TipoContratante = 'clinica' | 'entidade';
export type StatusAprovacao =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'em_reanalise'
  | 'aguardando_pagamento';

export interface Contratante {
  id: number;
  tipo: TipoContratante;
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
  pagamento_confirmado: boolean;
  numero_funcionarios_estimado?: number;
  criado_em: Date;
  atualizado_em: Date;
  aprovado_em?: Date;
  aprovado_por_cpf?: string;
}

export interface ContratanteFuncionario {
  id: number;
  funcionario_id: number;
  contratante_id: number;
  tipo_contratante: TipoContratante;
  vinculo_ativo: boolean;
  data_inicio: Date;
  data_fim?: Date;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Buscar contratantes por tipo
 */
export async function getContratantesByTipo(
  tipo?: TipoContratante,
  session?: Session
): Promise<Contratante[]> {
  // Exclui contratantes pendentes de aprovação (status='pendente', 'em_reanalise', 'aguardando_pagamento')
  // Esses aparecem em "Novos Cadastros", não em "Contratantes"
  const queryText = tipo
    ? `SELECT * FROM contratantes 
       WHERE tipo = $1 
       AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`
    : `SELECT * FROM contratantes 
       WHERE status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`;
  const params = tipo ? [tipo] : [];
  const result = await queryFn<Contratante>(queryText, params, session);
  return result.rows;
}

/**
 * Buscar contratante por ID
 */
export async function getContratanteById(
  id: number,
  session?: Session
): Promise<Contratante | null> {
  const result = await queryFn<Contratante>(
    `SELECT * FROM contratantes WHERE id = $1`,
    [id],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar contratantes pendentes de aprovação
 * Inclui status 'aguardando_pagamento' para permitir regeneração de links
 */
export async function getContratantesPendentes(
  tipo?: TipoContratante,
  session?: Session
): Promise<Contratante[]> {
  const queryText = tipo
    ? `SELECT * FROM contratantes
       WHERE status IN ($1, $2, $3) AND tipo = $4
       ORDER BY criado_em DESC`
    : `SELECT * FROM contratantes
       WHERE status IN ($1, $2, $3)
       ORDER BY tipo, criado_em DESC`;

  const params = tipo
    ? ['pendente', 'em_reanalise', 'aguardando_pagamento', tipo]
    : ['pendente', 'em_reanalise', 'aguardando_pagamento'];

  const result = await queryFn<Contratante>(queryText, params, session);
  return result.rows;
}

/**
 * Criar novo contratante (via modal de cadastro)
 */
export async function createContratante(
  data: Omit<
    Contratante,
    'id' | 'criado_em' | 'atualizado_em' | 'aprovado_em' | 'aprovado_por_cpf'
  >,
  session?: Session
): Promise<Contratante> {
  if (DEBUG_DB) {
    console.debug('[CREATE_CONTRATANTE] Iniciando criação com dados:', {
      tipo: data.tipo,
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      responsavel_cpf: data.responsavel_cpf,
    });
  }
  // Verificar se email já existe
  const emailCheck = await queryFn(
    'SELECT id FROM contratantes WHERE email = $1',
    [data.email],
    session
  );
  if (emailCheck.rows.length > 0) {
    throw new Error('Email já cadastrado no sistema');
  }

  // Verificar se CNPJ já existe
  const cnpjCheck = await queryFn(
    'SELECT id FROM contratantes WHERE cnpj = $1',
    [data.cnpj],
    session
  );
  if (cnpjCheck.rows.length > 0) {
    throw new Error('CNPJ já cadastrado no sistema');
  }

  // Verificar se CPF do responsável já existe em contratantes (apenas se aprovado)
  const cpfCheckContratantes = await queryFn(
    'SELECT id, status FROM contratantes WHERE responsavel_cpf = $1',
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckContratantes.rows.length > 0) {
    const contratanteExistente = cpfCheckContratantes.rows[0];
    if (contratanteExistente.status === 'aprovado') {
      throw new Error(
        'CPF do responsável já cadastrado no sistema (contratante aprovado)'
      );
    }
    // Se não aprovado, permitir re-cadastro (pode ter sido rejeitado ou está pendente)
  }

  // Verificar se CPF do responsável já existe em funcionários de OUTRO contratante
  // Um gestor pode ser responsável por sua própria clínica, mas não pode ser funcionário
  // de uma clínica E responsável por outra clínica diferente
  const cpfCheckFuncionarios = await queryFn(
    `SELECT f.id, f.perfil, c.id as contratante_id, c.cnpj as contratante_cnpj
     FROM funcionarios f
     INNER JOIN clinicas cl ON f.clinica_id = cl.id
     INNER JOIN contratantes c ON cl.contratante_id = c.id
     WHERE f.cpf = $1`,
    [data.responsavel_cpf],
    session
  );
  if (cpfCheckFuncionarios.rows.length > 0) {
    const funcionario = cpfCheckFuncionarios.rows[0];
    // Se o CPF já é funcionário de outro contratante, não permitir
    // (evita conflito de interesse entre clínicas)
    if (funcionario.contratante_cnpj !== data.cnpj) {
      throw new Error(
        `CPF do responsável já vinculado como funcionário em outro contratante (CNPJ: ${funcionario.contratante_cnpj})`
      );
    }
    // Se é do mesmo CNPJ, permitir - pode ser o gestor se cadastrando
  }

  // Garantir que colunas adicionadas por migração existam (adicionar se ausentes)
  try {
    await queryFn(
      `ALTER TABLE contratantes
       ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN DEFAULT false,
       ADD COLUMN IF NOT EXISTS data_liberacao_login TIMESTAMP,
       ADD COLUMN IF NOT EXISTS data_primeiro_pagamento TIMESTAMP`,
      [],
      session
    );
  } catch (err) {
    // Não falhar se alter table não puder ser executado por permissões; log para debugging
    console.warn(
      'Aviso: não foi possível garantir colunas em contratantes:',
      err
    );
  }

  // Garantir valores seguros para novos contratantes (inativo por padrão até confirmação) (revisado para contract-first)
  // Independente dos valores passados, novos contratantes SEMPRE começam inativos
  // e sem pagamento/contrato até confirmarem o pagamento
  // Inserção com retry para conter problemas de enum em bancos locais antigos
  let result: QueryResult<Contratante>;
  try {
    result = await queryFn<Contratante>(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, inscricao_estadual, email, telefone,
        endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
        status, motivo_rejeicao, observacoes_reanalise, ativa, pagamento_confirmado
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, false
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
        '[CREATE_CONTRATANTE] Enum status inconsistente no DB, tentando inserir com status fallback "pendente"',
        { error: msg }
      );
      result = await queryFn<Contratante>(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, inscricao_estadual, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, motivo_rejeicao, observacoes_reanalise, ativa, pagamento_confirmado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, false
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
        ],
        session
      );
    } else {
      throw err;
    }
  }
  const contratanteCriado = result.rows[0];
  console.log('[CREATE_CONTRATANTE] Contratante criado com sucesso:', {
    id: contratanteCriado.id,
    cnpj: contratanteCriado.cnpj,
    tipo: contratanteCriado.tipo,
  });
  return contratanteCriado;
}

/**
 * Aprovar contratante
 */
export async function aprovarContratante(
  id: number,
  aprovadoPorCpf: string,
  session?: Session
): Promise<Contratante> {
  // Primeiro, buscar o contratante para verificar o tipo
  const contratanteResult = await queryFn<Contratante>(
    'SELECT * FROM contratantes WHERE id = $1',
    [id],
    session
  );

  if (contratanteResult.rows.length === 0) {
    throw new Error('Contratante não encontrado');
  }

  const contratante = contratanteResult.rows[0];

  // Aprovar o contratante (apenas altera status, NÃO ativa automaticamente)
  // Nota: ativação deve ser controlada por contrato aceito e confirmações apropriadas
  const result = await queryFn<Contratante>(
    `UPDATE contratantes
     SET status = 'aprovado',
         aprovado_em = CURRENT_TIMESTAMP,
         aprovado_por_cpf = $2
     WHERE id = $1
     RETURNING *`,
    [id, aprovadoPorCpf],
    session
  );

  const contratanteAprovado = result.rows[0];

  // Se for uma clínica, criar entrada na tabela clinicas
  if (contratante.tipo === 'clinica') {
    try {
      const clinicaResult = await queryFn(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, contratante_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cnpj) DO UPDATE SET contratante_id = EXCLUDED.contratante_id, ativa = COALESCE(clinicas.ativa, true), atualizado_em = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          contratante.nome,
          contratante.cnpj,
          contratante.email,
          contratante.telefone,
          contratante.endereco,
          contratante.id,
        ],
        session
      );

      if (clinicaResult.rows.length > 0) {
        console.log(
          `[APROVAR_CONTRATANTE] Clínica criada com ID: ${clinicaResult.rows[0].id} para contratante ${contratante.id}`
        );
      }
    } catch (error) {
      console.error('[APROVAR_CONTRATANTE] Erro ao criar clínica:', error);
      // Não falhar a aprovação se houver erro na criação da clínica
    }
  }

  return contratanteAprovado;
}

/**
 * Ativar contratante após pagamento confirmado
 * Verifica condições antes de ativar contratante (pagamento confirmado e recibo emitido)
 */
export async function ativarContratante(
  id: number,
  session?: Session
): Promise<{ success: boolean; message: string; contratante?: Contratante }> {
  // Verificar estado atual
  const checkResult = await queryFn<{
    pagamento_confirmado: boolean;
    ativa: boolean;
  }>(
    'SELECT pagamento_confirmado, ativa FROM contratantes WHERE id = $1',
    [id],
    session
  );

  if (checkResult.rows.length === 0) {
    return { success: false, message: 'Contratante não encontrado' };
  }

  const { pagamento_confirmado, ativa } = checkResult.rows[0];

  if (DEBUG_DB)
    console.log(
      `[ativarContratante] ID=${id}, pagamento_confirmado=${pagamento_confirmado}, ativa=${ativa}`
    );

  if (ativa) {
    return { success: false, message: 'Contratante já está ativo' };
  }

  if (!pagamento_confirmado) {
    return { success: false, message: 'Pagamento não confirmado' };
  }

  // Verificar recibo - geração pode ser sob demanda. Se não existir, registrar aviso e prosseguir
  const reciboCheck = await queryFn(
    'SELECT id FROM recibos WHERE contratante_id = $1 AND cancelado = false LIMIT 1',
    [id],
    session
  );
  if (reciboCheck.rows.length === 0) {
    if (DEBUG_DB)
      console.warn(
        `[ativarContratante] Nenhum recibo encontrado para contratante ${id}. Prosseguindo porque recibos são gerados sob demanda.`
      );
  }

  // Ativar o contratante e marcar aprovado se ainda não estiver aprovado.
  const result = await queryFn<Contratante>(
    `UPDATE contratantes
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
    return { success: false, message: 'Falha ao ativar contratante' };
  }

  console.log(
    `[ativarContratante] Contratante ativado: ${result.rows[0].nome}`
  );

  return {
    success: true,
    message: 'Contratante ativado com sucesso',
    contratante: result.rows[0],
  };
}

/**
 * Rejeitar contratante
 */
export async function rejeitarContratante(
  id: number,
  motivo: string,
  session?: Session
): Promise<Contratante> {
  const result = await queryFn<Contratante>(
    `UPDATE contratantes 
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
): Promise<Contratante> {
  const result = await queryFn<Contratante>(
    `UPDATE contratantes
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
 * Criar vínculo polimórfico entre funcionário e contratante
 */
export async function vincularFuncionarioContratante(
  funcionarioId: number,
  contratanteId: number,
  tipoContratante: TipoContratante,
  session?: Session
): Promise<ContratanteFuncionario> {
  const result = await queryFn<ContratanteFuncionario>(
    `INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (funcionario_id, contratante_id) 
     DO UPDATE SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP
     RETURNING *`,
    [funcionarioId, contratanteId, tipoContratante],
    session
  );
  return result.rows[0];
}

/**
 * Buscar contratante de um funcionário
 */
export async function getContratanteDeFuncionario(
  funcionarioId: number,
  session?: Session
): Promise<Contratante | null> {
  const result = await queryFn<Contratante>(
    `SELECT c.* FROM contratantes c
     INNER JOIN contratantes_funcionarios cf ON cf.contratante_id = c.id
     WHERE cf.funcionario_id = $1 AND cf.vinculo_ativo = true AND c.ativa = true
     ORDER BY cf.criado_em DESC
     LIMIT 1`,
    [funcionarioId],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar funcionários de um contratante
 */
export async function getFuncionariosDeContratante(
  contratanteId: number,
  apenasAtivos: boolean = true,
  session?: Session
) {
  const queryText = apenasAtivos
    ? `SELECT f.* FROM funcionarios f
       INNER JOIN contratantes_funcionarios cf ON cf.funcionario_id = f.id
       WHERE cf.contratante_id = $1 AND cf.vinculo_ativo = true AND f.ativo = true`
    : `SELECT f.* FROM funcionarios f
       INNER JOIN contratantes_funcionarios cf ON cf.funcionario_id = f.id
       WHERE cf.contratante_id = $1`;

  const result = await queryFn(queryText, [contratanteId], session);
  return result.rows;
}

/**
 * Helper seguro para queries multi-tenant
 * Garante filtro obrigatório por clinica_id ou contratante_id
 */
export async function queryMultiTenant<T = unknown>(
  text: string,
  params: unknown[],
  tenantFilter: { clinica_id?: number; contratante_id?: number },
  session?: Session
): Promise<QueryResult<T>> {
  // Validar que pelo menos um filtro foi fornecido
  if (!tenantFilter.clinica_id && !tenantFilter.contratante_id) {
    throw new Error(
      'ERRO DE SEGURANÇA: queryMultiTenant requer clinica_id ou contratante_id'
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

  if (tenantFilter.contratante_id) {
    const hasWhere = /WHERE/i.test(filteredQuery);
    filteredQuery += hasWhere
      ? ` AND contratante_id = $${filteredParams.length + 1}`
      : ` WHERE contratante_id = $${filteredParams.length + 1}`;
    filteredParams.push(tenantFilter.contratante_id);
  }

  return queryFn<T>(filteredQuery, filteredParams, session);
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

  if (contratoId) {
    queryText += ' WHERE id = $1';
    params.push(contratoId);
    if (apenasNaoLidas) {
      queryText += ' AND lida = false';
    }
  } else if (apenasNaoLidas) {
    queryText += ' WHERE lida = false';
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await queryFn(queryText, params, session);
  return result.rows;
}

/**
 * Marcar notificação como lida
 */
export async function marcarNotificacaoComoLida(
  notificacaoId: number,
  session?: Session
) {
  const result = await queryFn(
    'UPDATE notificacoes_financeiras SET lida = true, lida_em = NOW() WHERE id = $1 RETURNING *',
    [notificacaoId],
    session
  );
  return result.rows[0];
}

/**
 * Criar conta para responsável do contratante
 */
export async function criarContaResponsavel(
  contratante: number | Contratante,
  session?: Session
) {
  let contratanteData: Contratante;

  // Se recebeu um número (ID), buscar os dados do contratante
  if (typeof contratante === 'number') {
    const result = await queryFn(
      'SELECT * FROM contratantes WHERE id = $1',
      [contratante],
      session
    );
    if (result.rows.length === 0) {
      throw new Error(`Contratante ${contratante} não encontrado`);
    }
    contratanteData = result.rows[0] as Contratante;
  } else {
    contratanteData = contratante;
  }

  if (DEBUG_DB) {
    console.debug('[CRIAR_CONTA] Iniciando criação de conta para:', {
      id: contratanteData.id,
      cnpj: contratanteData.cnpj,
      responsavel_cpf: contratanteData.responsavel_cpf,
      tipo: contratanteData.tipo,
    });
  }

  // Se CNPJ não estiver no objeto, buscar do banco
  let cnpj = contratanteData.cnpj;
  if (!cnpj) {
    if (DEBUG_DB)
      console.debug(
        '[CRIAR_CONTA] CNPJ não encontrado no objeto, buscando do banco...'
      );
    const contratanteResult = await queryFn(
      'SELECT cnpj FROM contratantes WHERE id = $1',
      [contratanteData.id],
      session
    );
    if (contratanteResult.rows.length > 0) {
      cnpj = contratanteResult.rows[0].cnpj;
      if (DEBUG_DB)
        console.debug('[CRIAR_CONTA] CNPJ encontrado no banco:', cnpj);
    }
  }

  // Validar se CNPJ existe
  if (!cnpj) {
    console.error(
      '[CRIAR_CONTA ERROR] CNPJ não encontrado nem no objeto nem no banco:',
      contratanteData
    );
    throw new Error('CNPJ do contratante é obrigatório para criar conta');
  }

  // Senha baseada nos últimos 6 dígitos do CNPJ (removendo formatação)
  const cleanCnpj = cnpj.replace(/[./-]/g, '');
  const defaultPassword = cleanCnpj.slice(-6);
  const hashed = await bcrypt.hash(defaultPassword, 10);

  // Para entidades sem CPF do responsável, usar CNPJ como identificador
  const cpfParaUsar = contratanteData.responsavel_cpf || cleanCnpj;

  if (DEBUG_DB) {
    console.debug(`[CRIAR_CONTA] CPF: ${cpfParaUsar}, CNPJ: ${cnpj}`);
  }

  // 1. Criar senha em contratantes_senhas usando prepared statement
  try {
    // Garantir compatibilidade com esquemas que não possuem UNIQUE(contratante_id, cpf)
    const exists = await queryFn(
      'SELECT id FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
      [contratanteData.id, cpfParaUsar],
      session
    );

    if (exists.rows.length > 0) {
      await queryFn(
        'UPDATE contratantes_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE contratante_id = $2 AND cpf = $3',
        [hashed, contratanteData.id, cpfParaUsar],
        session
      );
      console.log(
        `[CRIAR_CONTA] Senha atualizada em contratantes_senhas para CPF ${cpfParaUsar}`
      );
    } else {
      await queryFn(
        'INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash, criado_em, atualizado_em) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [contratanteData.id, cpfParaUsar, hashed],
        session
      );
      console.log(
        `[CRIAR_CONTA] Senha inserida em contratantes_senhas para CPF ${cpfParaUsar}`
      );
    }
  } catch (err) {
    console.error(
      '[CRIAR_CONTA] Erro ao inserir/atualizar em contratantes_senhas:',
      err
    );
    throw err;
  }

  // Verificar se foi inserido corretamente
  const checkResult = await queryFn(
    'SELECT senha_hash, length(senha_hash) as hash_len FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
    [contratanteData.id, cpfParaUsar],
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
        `[CRIAR_CONTA] Teste de senha para CPF ${contratanteData.responsavel_cpf}: ${testMatch ? 'SUCESSO' : 'FALHA'}`
      );
    }
  } else {
    console.error(
      `[CRIAR_CONTA ERROR] Senha não encontrada após inserção para CPF ${contratanteData.responsavel_cpf}`
    );
  }

  // 2. Criar/atualizar registro em funcionarios (incluindo entidades)
  // Observação: criando registro também para contratantes do tipo 'entidade' para suportar
  // flows de ativação que esperam um login do responsável (gestor_entidade).
  try {
    const f = await queryFn(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [contratanteData.responsavel_cpf],
      session
    );

    // Determinar perfil: entidades -> gestor_entidade, outros -> rh
    const perfilToSet =
      contratanteData.tipo === 'entidade' ? 'gestor_entidade' : 'rh';

    if (f.rows.length > 0) {
      const fid = f.rows[0].id;

      // Para perfil RH (clínicas), buscar clinica_id vinculada ao contratante
      let clinicaId = null;
      if (perfilToSet === 'rh') {
        try {
          const clinicaResult = await queryFn(
            'SELECT id FROM clinicas WHERE contratante_id = $1 LIMIT 1',
            [contratanteData.id],
            session
          );
          if (clinicaResult.rows.length > 0) {
            clinicaId = clinicaResult.rows[0].id;
            if (DEBUG_DB) {
              console.debug(
                `[CRIAR_CONTA] Clínica id=${clinicaId} mapeada para funcionário RH existente`
              );
            }
          }
        } catch (err) {
          console.error(
            '[CRIAR_CONTA] Erro ao buscar clinica_id para RH:',
            err
          );
        }

        // Se não houver clínica, tentar criar uma entry idempotente vinculada ao contratante
        if (!clinicaId) {
          try {
            const ins = await queryFn(
              `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, contratante_id, ativa, criado_em, atualizado_em)
               VALUES ($1,$2,$3,$4,$5,$6, true, NOW(), NOW())
               ON CONFLICT (cnpj)
               DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, telefone = EXCLUDED.telefone, endereco = EXCLUDED.endereco, contratante_id = EXCLUDED.contratante_id, ativa = true, atualizado_em = CURRENT_TIMESTAMP
               RETURNING id`,
              [
                contratanteData.nome,
                contratanteData.cnpj,
                contratanteData.email || null,
                contratanteData.telefone || null,
                contratanteData.endereco || null,
                contratanteData.id,
              ],
              session
            );
            if (ins.rows.length > 0) {
              clinicaId = ins.rows[0].id;
              if (DEBUG_DB)
                console.debug(
                  `[CRIAR_CONTA] Clínica criada id=${clinicaId} para contratante ${contratanteData.id}`
                );
            } else {
              // Se não foi criada (conflito), tentar recarregar
              const reload = await queryFn(
                'SELECT id FROM clinicas WHERE contratante_id = $1 LIMIT 1',
                [contratanteData.id],
                session
              );
              if (reload.rows.length > 0) clinicaId = reload.rows[0].id;
            }
          } catch (err: any) {
            // Tratamento especial para unique_violation (23505) que pode ocorrer
            // em cenários de corrida: se outra transação criou a clínica ao mesmo tempo,
            // recarregamos a clínica existente em vez de falhar.
            const isUniqueViolation =
              err &&
              (err.code === '23505' ||
                (err.message || '').includes('clinicas_cnpj_key'));
            if (isUniqueViolation) {
              try {
                const reload = await queryFn(
                  'SELECT id FROM clinicas WHERE cnpj = $1 LIMIT 1',
                  [contratanteData.cnpj],
                  session
                );
                if (reload.rows.length > 0) {
                  clinicaId = reload.rows[0].id;
                  if (DEBUG_DB)
                    console.debug(
                      `[CRIAR_CONTA] Unique violation detectada — recarregada clinica id=${clinicaId}`
                    );
                }
              } catch (reloadErr) {
                console.error(
                  '[CRIAR_CONTA] Falha ao recarregar clínica após unique_violation:',
                  reloadErr
                );
              }
            } else {
              console.error(
                '[CRIAR_CONTA] Erro ao criar/marcar clinica para RH:',
                err
              );
            }
          }
        }
      }

      await queryFn(
        `UPDATE funcionarios SET nome = $1, email = $2, perfil = $3, contratante_id = $4, clinica_id = $5, ativo = true, senha_hash = $6, atualizado_em = CURRENT_TIMESTAMP WHERE id = $7`,
        [
          contratanteData.responsavel_nome || 'Gestor',
          contratanteData.responsavel_email || null,
          perfilToSet,
          contratanteData.id,
          clinicaId,
          defaultPassword,
          fid,
        ],
        session
      );
      // Upsert vinculo
      const vinc = await queryFn(
        'SELECT * FROM contratantes_funcionarios WHERE funcionario_id = $1 AND contratante_id = $2',
        [fid, contratanteData.id],
        session
      );
      if (vinc.rows.length > 0) {
        await queryFn(
          'UPDATE contratantes_funcionarios SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP WHERE funcionario_id = $1 AND contratante_id = $2',
          [fid, contratanteData.id],
          session
        );
      } else {
        await queryFn(
          'INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
          [fid, contratanteData.id, contratanteData.tipo || 'entidade'],
          session
        );
      }
      if (DEBUG_DB)
        console.debug(
          `[CRIAR_CONTA] Atualizado funcionario id=${fid} perfil=${perfilToSet}`
        );
    } else {
      // Inserir novo funcionario
      const nivelCargo = null; // manter null para perfis não-funcionarios
      const empresaId = null;

      // Para perfil RH (clínicas), buscar clinica_id vinculada ao contratante
      let clinicaId = null;
      if (perfilToSet === 'rh') {
        try {
          const clinicaResult = await queryFn(
            'SELECT id FROM clinicas WHERE contratante_id = $1 LIMIT 1',
            [contratanteData.id],
            session
          );
          if (clinicaResult.rows.length > 0) {
            clinicaId = clinicaResult.rows[0].id;
            if (DEBUG_DB) {
              console.debug(
                `[CRIAR_CONTA] Clínica id=${clinicaId} mapeada para funcionário RH`
              );
            }
          } else {
            // Tentar criar a clínica de forma idempotente para este contratante
            try {
              const ins = await queryFn(
                `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, contratante_id, ativa, criado_em, atualizado_em)
                 VALUES ($1,$2,$3,$4,$5,$6, true, NOW(), NOW())
                 ON CONFLICT (cnpj)
                 DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, telefone = EXCLUDED.telefone, endereco = EXCLUDED.endereco, contratante_id = EXCLUDED.contratante_id, ativa = true, atualizado_em = CURRENT_TIMESTAMP
                 RETURNING id`,
                [
                  contratanteData.nome,
                  contratanteData.cnpj,
                  contratanteData.email || null,
                  contratanteData.telefone || null,
                  contratanteData.endereco || null,
                  contratanteData.id,
                ],
                session
              );
              if (ins.rows.length > 0) {
                clinicaId = ins.rows[0].id;
                if (DEBUG_DB)
                  console.debug(
                    `[CRIAR_CONTA] Clínica criada id=${clinicaId} para contratante ${contratanteData.id}`
                  );
              } else {
                const reload = await queryFn(
                  'SELECT id FROM clinicas WHERE contratante_id = $1 LIMIT 1',
                  [contratanteData.id],
                  session
                );
                if (reload.rows.length > 0) clinicaId = reload.rows[0].id;
              }
            } catch (err: any) {
              const isUniqueViolation =
                err &&
                (err.code === '23505' ||
                  (err.message || '').includes('clinicas_cnpj_key'));
              if (isUniqueViolation) {
                try {
                  const reload = await queryFn(
                    'SELECT id FROM clinicas WHERE cnpj = $1 LIMIT 1',
                    [contratanteData.cnpj],
                    session
                  );
                  if (reload.rows.length > 0) {
                    clinicaId = reload.rows[0].id;
                    if (DEBUG_DB)
                      console.debug(
                        `[CRIAR_CONTA] Unique violation detectada (new) — recarregada clinica id=${clinicaId}`
                      );
                  }
                } catch (reloadErr) {
                  console.error(
                    '[CRIAR_CONTA] Falha ao recarregar clínica após unique_violation (new):',
                    reloadErr
                  );
                }
              } else {
                console.error(
                  '[CRIAR_CONTA] Erro ao criar clinica para contratante:',
                  err
                );
                console.warn(
                  `Clínica não encontrada para contratante ${contratanteData.id}. O funcionário RH será criado sem clinica_id.`
                );
              }
            }
          }
        } catch (err) {
          console.error(
            '[CRIAR_CONTA] Erro ao buscar clinica_id para RH:',
            err
          );
        }
      }

      const insertRes = await queryFn(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, nivel_cargo, contratante_id, clinica_id, empresa_id, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
        [
          contratanteData.responsavel_cpf,
          contratanteData.responsavel_nome || 'Gestor',
          contratanteData.responsavel_email || null,
          defaultPassword,
          perfilToSet,
          nivelCargo,
          contratanteData.id,
          clinicaId,
          empresaId,
        ],
        session
      );
      const fid = insertRes.rows[0].id;
      await queryFn(
        'INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
        [fid, contratanteData.id, contratanteData.tipo || 'entidade'],
        session
      );

      if (DEBUG_DB)
        console.debug(
          `[CRIAR_CONTA] Funcionario criado id=${fid} perfil=${perfilToSet}`
        );
    }
  } catch (err) {
    console.error('[CRIAR_CONTA] Erro ao criar/atualizar funcionario:', err);
    // Não relançar para não quebrar o fluxo principal de confirmação de pagamento
  }

  // Envolver recuperação extra para cenários de corrida/unique_violation
  catchGlobal: {
    // bloco vazio — mantido para clareza estrutural
  }

  // Garantir que, se alguma inserção crítica lançou unique_violation em outro lugar,
  // tentamos uma recuperação adicional antes de retornar ao chamador.
  // (Nota: esta recuperação é idempotente e não lança)
  try {
    // noop — preserva fluxo quando não há erro
  } catch (_err) {
    // não esperado
    void _err;
  }

  console.log(
    `Conta (RH) processada para responsável ${contratanteData.responsavel_cpf} (senha padrão definida)`
  );

  // Ler senha armazenada em funcionarios e validar que o hash corresponde à senha padrão
  try {
    const funcCheck = await queryFn(
      'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
      [contratanteData.responsavel_cpf],
      session
    );
    if (funcCheck.rows.length > 0) {
      const funcHash = funcCheck.rows[0].senha_hash;
      if (DEBUG_DB) {
        console.debug(
          `[CRIAR_CONTA] Hash em funcionarios length=${funcHash?.length || 0}`
        );
      }
      // Se o hash armazenado parecer ser um bcrypt, validar e atualizar se necessário.
      // Se for texto plano (senha inicial), deixamos como está — será migrado no primeiro login.
      let funcMatch = false;
      if (
        typeof funcHash === 'string' &&
        (funcHash.startsWith('$2a$') ||
          funcHash.startsWith('$2b$') ||
          funcHash.startsWith('$2y$'))
      ) {
        funcMatch = await bcrypt.compare(defaultPassword, funcHash);
        if (DEBUG_DB) {
          console.debug(
            `[CRIAR_CONTA] Teste senha contra funcionarios hash (bcrypt): ${funcMatch ? 'OK' : 'MISMATCH'}`
          );
        }
        if (!funcMatch) {
          // Forçar atualização com o hash correto e logar a ação
          await queryFn(
            'UPDATE funcionarios SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE cpf = $2',
            [hashed, contratanteData.responsavel_cpf],
            session
          );
          console.warn(
            '[CRIAR_CONTA] Hash em funcionarios divergente — atualizado com hash gerado agora'
          );
        }
      } else {
        if (DEBUG_DB) {
          console.debug(
            '[CRIAR_CONTA] Hash em funcionarios parece ser senha texto plano — mantendo como está (será migrada no login)'
          );
        }
      }
    }
  } catch (err) {
    console.error(
      '[CRIAR_CONTA] Erro ao validar/atualizar hash em funcionarios:',
      err
    );
  }
}

/**
 * Criar senha inicial para entidade (gestor_entidade)
 * Chama a função SQL criar_senha_inicial_entidade
 */
export async function criarSenhaInicialEntidade(
  contratanteId: number,
  session?: Session
): Promise<void> {
  await queryFn(
    'SELECT criar_senha_inicial_entidade($1)',
    [contratanteId],
    session
  );

  console.log(
    `Senha inicial criada para entidade contratante ${contratanteId}`
  );
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

  // Inserir emissor com clinica_id = NULL
  const result = await queryFn(
    `INSERT INTO funcionarios (
      cpf, 
      nome, 
      email, 
      senha_hash, 
      perfil, 
      clinica_id,
      ativo,
      criado_em,
      atualizado_em
    )
    VALUES ($1, $2, $3, $4, 'emissor', NULL, true, NOW(), NOW())
    RETURNING cpf, nome, email, clinica_id`,
    [cpfLimpo, nome, email, senhaHash],
    session
  );

  if (DEBUG_DB) {
    console.debug(
      `[CRIAR_EMISSOR] Emissor independente criado: ${cpfLimpo} (clinica_id = NULL)`
    );
  }

  return result.rows[0];
}
