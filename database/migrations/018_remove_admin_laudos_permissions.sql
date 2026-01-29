-- ==========================================
-- MIGRATION 018: Remover permissões de admin para laudos
-- Data: 29/01/2026
-- ==========================================

BEGIN;

\echo '=== MIGRATION 018: Removendo permissões de admin para laudos ==='

-- 1. Remover permissão 'manage:laudos' do role admin
DELETE FROM public.role_permissions
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin')
  AND permission_id = (SELECT id FROM public.permissions WHERE name = 'manage:laudos');

\echo '1. Removida permissão manage:laudos do role admin'

-- 2. Remover política RLS que permite admin acessar laudos
DROP POLICY IF EXISTS "policy_laudos_admin" ON laudos;
DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;

\echo '2. Removidas políticas RLS de admin para laudos'

-- 3. Verificar se não há outras políticas de admin para laudos
-- (Isso será feito manualmente se necessário)

COMMIT;

\echo '=== MIGRATION 018: Concluída com sucesso ==='