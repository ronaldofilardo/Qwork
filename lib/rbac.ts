/**
 * lib/rbac.ts
 * ALTO-1: Runtime RBAC helper — consulta tabelas roles/permissions/role_permissions
 *
 * Uso: rotas podem opt-in chamando hasPermission() ou getPermissions().
 * Nenhum arquivo existente precisa ser alterado para adoção gradual.
 */
import { query } from './db';
import type { PerfilUsuarioType } from './types/enums';

// Cache em memória por perfil (vive durante o lifecycle do request/serverless)
const permissionCache = new Map<string, string[]>();

/**
 * Retorna todas as permissões associadas a um perfil via tabelas RBAC.
 * Resultado cacheado em memória para evitar queries repetidas no mesmo request.
 */
export async function getPermissions(
  perfil: PerfilUsuarioType
): Promise<string[]> {
  const cached = permissionCache.get(perfil);
  if (cached) return cached;

  const result = await query(
    `SELECT p.name
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.name = $1 AND r.active = TRUE`,
    [perfil]
  );

  const permissions = result.rows.map((row: { name: string }) => row.name);
  permissionCache.set(perfil, permissions);
  return permissions;
}

/**
 * Verifica se um perfil possui determinada permissão.
 *
 * @example
 *   if (await hasPermission('rh', 'write:funcionarios:clinica')) { ... }
 */
export async function hasPermission(
  perfil: PerfilUsuarioType,
  permission: string
): Promise<boolean> {
  const perms = await getPermissions(perfil);
  return perms.includes(permission);
}

/**
 * Verifica se um perfil possui QUALQUER uma das permissões listadas.
 */
export async function hasAnyPermission(
  perfil: PerfilUsuarioType,
  permissions: string[]
): Promise<boolean> {
  const perms = await getPermissions(perfil);
  return permissions.some((p) => perms.includes(p));
}

/**
 * Limpa o cache de permissões (útil em testes ou após alteração de roles).
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
}
