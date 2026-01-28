/**
 * Definições de rotas do sistema
 */

export const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/planos',
  '/api/cadastro',
  '/api/public',
] as const;

export const ADMIN_ROUTES = ['/admin', '/api/admin'] as const;

export const RH_ROUTES = ['/rh', '/api/rh'] as const;

export const ENTIDADE_ROUTES = ['/entidade', '/api/entidade'] as const;

export const EMISSOR_ROUTES = ['/emissor', '/api/emissor'] as const;

export const FUNCIONARIO_ROUTES = [
  '/dashboard',
  '/avaliacao',
  '/api/avaliacao',
] as const;

export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

export function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path.startsWith(route));
}

export function isRhRoute(path: string): boolean {
  return RH_ROUTES.some((route) => path.startsWith(route));
}

export function isEntidadeRoute(path: string): boolean {
  return ENTIDADE_ROUTES.some((route) => path.startsWith(route));
}
