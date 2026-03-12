/**
 * lib/db/entidade-helpers.ts — ADAPTER
 *
 * Re-exporta de submódulos para retrocompatibilidade.
 * Implementações movidas para entidade-crud.ts, entidade-status.ts, entidade-funcionarios.ts.
 */

// CRUD (tipos + getters + create)
export {
  type TipoEntidade,
  type StatusAprovacao,
  type Entidade,
  getEntidadesByTipo,
  getEntidadeById,
  getEntidadesPendentes,
  createEntidade,
} from './entidade-crud';

// Status management
export {
  aprovarEntidade,
  ativarEntidade,
  rejeitarEntidade,
  solicitarReanalise,
} from './entidade-status';

// Funcionário bindings + multi-tenant utils
export {
  type EntidadeFuncionario,
  vincularFuncionarioEntidade,
  getEntidadeDeFuncionario,
  getFuncionariosDeEntidade,
  queryMultiTenant,
  contarFuncionariosAtivos,
} from './entidade-funcionarios';
