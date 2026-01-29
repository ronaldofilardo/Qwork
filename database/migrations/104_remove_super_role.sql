-- Migration 104: Remover role 'super' e migrar usuários/permissões para 'admin'
-- Data: 2026-01-29
-- Objetivo: Garantir que o role/perfil legados 'super' sejam convertidos para 'admin' e removidos do sistema

BEGIN;

-- 1) Atualizar perfis de funcionários 'super' para 'admin' (safety)
UPDATE public.funcionarios SET perfil = 'admin' WHERE perfil = 'super';

-- 2) Transferir permissões do role 'super' para 'admin' (se existir tabela de roles)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
    -- Garantir a role admin
    INSERT INTO public.roles (name, display_name, description, active)
    VALUES ('admin', 'Administrador', 'Administrador do sistema', true)
    ON CONFLICT (name) DO NOTHING;

    WITH super_role AS (
      SELECT id as super_id FROM public.roles WHERE name = 'super'
    ), admin_role AS (
      SELECT id as admin_id FROM public.roles WHERE name = 'admin'
    )
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role.admin_id, rp.permission_id
    FROM public.role_permissions rp
    JOIN super_role sr ON rp.role_id = sr.super_id
    CROSS JOIN admin_role
    ON CONFLICT DO NOTHING;

    -- Remover associações e role legado (se existir)
    DELETE FROM public.role_permissions WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'super');
    DELETE FROM public.roles WHERE name = 'super';
  END IF;
END $$;

-- 3) Atualizar quaisquer policies que mencionem o literal 'super' (buscar e substituir em strings)
-- Nota: Operação conservadora — apenas identifica occurrences do literal 'super' dentro de USING / WITH CHECK expressions e emite NOTICE para revisão manual
DO $$
DECLARE
  rec RECORD;
  v_using TEXT;
  v_with_check TEXT;
BEGIN
  FOR rec IN
    SELECT n.nspname as schema_name, c.relname as table_name, pol.polname as policy_name,
           pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE (pg_get_expr(pol.polqual, pol.polrelid) IS NOT NULL AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%super%')
       OR (pg_get_expr(pol.polwithcheck, pol.polrelid) IS NOT NULL AND pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%super%')
  LOOP
    RAISE NOTICE 'Policy contains "super" literal and requires review: % on %.%', rec.policy_name, rec.schema_name, rec.table_name;
  END LOOP;
END $$;

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 104_remove_super_role applied: users converted to admin and role super removed if present.'; END $$;
