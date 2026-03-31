/**
 * scripts/_rewrite-db-adapter.cjs
 *
 * Reescreve lib/db.ts como adapter puro de re-exports.
 * Toda implementação foi movida para lib/db/connection.ts, lib/db/query.ts e lib/db/transaction.ts.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'lib', 'db.ts');

const content = `/**
 * lib/db.ts — ADAPTER
 *
 * Re-exporta de lib/db/ para retrocompatibilidade.
 * Todos os imports via '@/lib/db' continuam funcionando.
 *
 * ⚠️ NÃO adicionar implementação aqui — manter ≤30L de lógica
 *   para satisfazer validate-domain-boundaries.mjs.
 */

// Infraestrutura (connection, query, transaction)
export {
  // connection
  isDevelopment,
  isTest,
  isProduction,
  environment,
  databaseUrl,
  DEBUG_DB,
  getNeonSql,
  getNeonPool,
  getLocalPool,
  getPool,
  closePool,
  getDatabaseInfo,
  // query
  query,
  type QueryResult,
  type Perfil,
  PERFIS_VALIDOS,
  isValidPerfil,
  assertValidPerfil,
  testConnection,
  // transaction
  transaction,
  type TransactionClient,
} from './db/index';

// Re-export Session de lib/session.ts
export type { Session } from './session';

// Funções de negócio (entidade-helpers, user-creation, admin-queries)
export {
  // entidade-helpers
  type TipoEntidade,
  type StatusAprovacao,
  type Entidade,
  type EntidadeFuncionario,
  getEntidadesByTipo,
  getEntidadeById,
  getEntidadesPendentes,
  createEntidade,
  aprovarEntidade,
  ativarEntidade,
  rejeitarEntidade,
  solicitarReanalise,
  vincularFuncionarioEntidade,
  getEntidadeDeFuncionario,
  getFuncionariosDeEntidade,
  queryMultiTenant,
  contarFuncionariosAtivos,
  // user-creation
  criarContaResponsavel,
  criarSenhaInicialEntidade,
  criarEmissorIndependente,
  // admin-queries
  ensureAdminPassword,
  getNotificacoesFinanceiras,
  marcarNotificacaoComoLida,
  getContratosPlanos,
} from './db/index';

// ====================================================================
// ALIASES DE RETROCOMPATIBILIDADE
// ====================================================================

import {
  getEntidadesByTipo as _getEntidadesByTipo,
  getEntidadesPendentes as _getEntidadesPendentes,
} from './db/index';

/** @deprecated Use getEntidadesByTipo */
export const gettomadorsByTipo = _getEntidadesByTipo;

/** @deprecated Use getEntidadesPendentes */
export const gettomadorsPendentes = _getEntidadesPendentes;
`;

fs.writeFileSync(target, content, 'utf8');
const lines = content.split('\\n').length;
console.log(\`OK: lib/db.ts rewritten as adapter (\${lines} lines)\`);
`;

fs.writeFileSync(target, content, 'utf8');
const lines = content.split('\n').length;
console.log(`OK: lib/db.ts rewritten as adapter (${lines} lines)`);
