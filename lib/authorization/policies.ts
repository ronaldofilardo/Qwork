/**
 * lib/authorization/policies.ts
 *
 * Camada de autorização centralizada (ESC-1).
 * Todas as verificações de perfil/role devem passar por aqui.
 *
 * Uso em rotas:
 *   import { assertRoles } from '@/lib/authorization/policies';
 *   assertRoles(session, [ROLES.ADMIN]);
 *
 * Uso com contexto de recurso:
 *   import { assertPolicy } from '@/lib/authorization/policies';
 *   assertPolicy('lote:owner', session, { clinica_id: lote.clinica_id });
 */

import type { Session } from '@/lib/session';
import { ROLES, type Role } from '@/lib/config/roles';
import {
  createApiError,
  isApiError,
} from '@/lib/application/handlers/api-handler';

// ─────────────────────────────────────────────
// Helpers de checagem (não lançam exceção)
// ─────────────────────────────────────────────

/** Verifica se a session tem uma das roles permitidas */
export function checkRoles(
  session: Session | null,
  allowedRoles: readonly Role[]
): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.perfil as Role);
}

// ─────────────────────────────────────────────
// Assertions (lançam erro 401/403)
// ─────────────────────────────────────────────

/** Exige sessão autenticada — lança 401 se ausente */
export function assertAuth(
  session: Session | null
): asserts session is Session {
  if (!session) {
    throw createApiError('Autenticação requerida', 'UNAUTHORIZED', 401);
  }
}

/** Exige sessão + role — lança 401 (sem sessão) ou 403 (role errada) */
export function assertRoles(
  session: Session | null,
  allowedRoles: readonly Role[]
): asserts session is Session {
  assertAuth(session);
  if (!allowedRoles.includes(session.perfil as Role)) {
    throw createApiError('Acesso negado', 'FORBIDDEN', 403);
  }
}

// ─────────────────────────────────────────────
// Policies contextuais (verificações com recurso)
// ─────────────────────────────────────────────

interface LoteContext {
  clinica_id?: number | null;
  entidade_id?: number | null;
}

interface FuncionarioContext {
  clinica_id?: number | null;
  entidade_id?: number | null;
}

type PolicyFn<TCtx = undefined> = TCtx extends undefined
  ? (session: Session) => boolean
  : (session: Session, ctx: TCtx) => boolean;

const contextPolicies = {
  /** Gestor ou RH que possui o lote via clinica_id ou entidade_id */
  'lote:owner': ((session: Session, ctx: LoteContext) => {
    if (session.perfil === 'admin') return true;
    if (session.perfil === 'rh' && ctx.clinica_id === session.clinica_id)
      return true;
    if (session.perfil === 'gestor' && ctx.entidade_id === session.entidade_id)
      return true;
    return false;
  }) as PolicyFn<LoteContext>,

  /** Verifica se o usuário pode acessar dados de um funcionário */
  'funcionario:read': ((session: Session, ctx: FuncionarioContext) => {
    if (session.perfil === 'admin') return true;
    if (session.perfil === 'emissor') return true;
    if (session.perfil === 'rh' && ctx.clinica_id === session.clinica_id)
      return true;
    if (session.perfil === 'gestor' && ctx.entidade_id === session.entidade_id)
      return true;
    return false;
  }) as PolicyFn<FuncionarioContext>,
} satisfies Record<string, PolicyFn<any>>;

export type PolicyName = keyof typeof contextPolicies;

/** Executa uma policy nomeada — lança 403 se negada */
export function assertPolicy<K extends PolicyName>(
  policy: K,
  session: Session | null,
  ctx: Parameters<(typeof contextPolicies)[K]>[1]
): asserts session is Session {
  assertAuth(session);
  const fn = contextPolicies[policy];
  if (!fn(session, ctx)) {
    throw createApiError(`Policy ${policy} negada`, 'FORBIDDEN', 403);
  }
}

// Re-export para conveniência
export { ROLES, type Role, isApiError };
