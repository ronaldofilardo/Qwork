/**
 * Módulo de database refatorado
 * Exporta todas as funções de forma organizada
 * Mantém compatibilidade com código legado
 */

// Re-exportar conexões
export {
  isDevelopment,
  isTest,
  isProduction,
  DEBUG_DB,
  getNeonSql,
  getLocalPool,
  closeLocalPool,
  getDatabaseUrl,
} from './connection';

// Re-exportar queries
export {
  query,
  queryOne,
  queryScalar,
  exists,
  count,
  insert,
  update,
  deleteRow,
  clearTestDatabase,
  type QueryResult,
} from './queries';

// Re-exportar transações
export { transaction, batch, type TransactionClient } from './transactions';

// Re-exportar helpers do db (compatibilidade)
export { criarContaResponsavel, criarSenhaInicialEntidade } from '@/lib/db';
