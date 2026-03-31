/**
 * Definições de roles e permissões do sistema
 *
 * Hierarquia:
 *   admin (100) — acesso total, supera todas as roles
 *   rh / gestor / emissor (50) — roles PARALELAS com contextos distintos
 *   funcionario (10) — acesso básico
 *
 * ATENÇÃO: rh, gestor e emissor NÃO são hierárquicas entre si.
 * hasPermission(userRole, requiredRole) só é válido para verificar se
 * uma role atinge o "nível mínimo" — útil quando admin precisa acessar
 * recursos de roles inferiores. Nunca compare rh vs gestor via hierarquia.
 */

export const ROLES = {
  ADMIN: 'admin',
  RH: 'rh',
  GESTOR: 'gestor',
  EMISSOR: 'emissor',
  FUNCIONARIO: 'funcionario',
  SUPORTE: 'suporte',
  COMERCIAL: 'comercial',
  VENDEDOR: 'vendedor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles que operam em contextos paralelos (sem hierarquia entre si) */
export const PARALLEL_ROLES: readonly Role[] = [
  ROLES.RH,
  ROLES.GESTOR,
  ROLES.EMISSOR,
  ROLES.SUPORTE,
  ROLES.COMERCIAL,
] as const;

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  rh: 50,
  gestor: 50,
  emissor: 50,
  suporte: 50,
  comercial: 50,
  vendedor: 30,
  funcionario: 10,
};

/**
 * Verifica se userRole atinge o nível mínimo de requiredRole.
 * Para roles paralelas (rh/gestor/emissor), use hasRole() em vez disso.
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** Verifica se a role do usuário é exatamente uma das roles permitidas */
export function hasRole(
  userRole: Role,
  allowedRoles: readonly Role[]
): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function isGestor(role: Role): boolean {
  return role === ROLES.RH || role === ROLES.GESTOR;
}
