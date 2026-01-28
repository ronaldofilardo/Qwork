/**
 * Definições de roles e permissões do sistema
 */

export const ROLES = {
  ADMIN: 'admin',
  RH: 'rh',
  GESTOR_ENTIDADE: 'gestor_entidade',
  EMISSOR: 'emissor',
  FUNCIONARIO: 'funcionario',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  emissor: 50,
  gestor_entidade: 40,
  rh: 30,
  funcionario: 10,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function isGestor(role: Role): boolean {
  return role === ROLES.RH || role === ROLES.GESTOR_ENTIDADE;
}
