-- Migration 024: Remove remaining admin policies and keep ONLY administrative ones
-- Admin mantém acesso APENAS a: audit_logs (read), roles/permissions/role_permissions (manage)
-- Admin remove: clinicas_admin_insert (deve usar endpoint específico), funcionarios_admin_delete

BEGIN;

\echo 'Migration 024: Removendo políticas admin restantes e mantendo apenas administrativas...'

-- ========================================
-- REMOVE ADMIN INSERT TO CLINICAS
-- ========================================
-- Admin não insere clinicas diretamente, deve usar endpoint /api/admin/cadastro/clinica
DROP POLICY IF EXISTS "clinicas_admin_insert" ON clinicas;

\echo '  ✓ Removida política clinicas_admin_insert (admin usará endpoint específico)'

-- ========================================
-- REMOVE ADMIN DELETE FROM FUNCIONARIOS
-- ========================================
-- Admin não deleta funcionarios operacionalmente
DROP POLICY IF EXISTS "funcionarios_admin_delete" ON funcionarios;

\echo '  ✓ Removida política funcionarios_admin_delete'

-- ========================================
-- VERIFY FINAL STATE
-- ========================================
DO $$
DECLARE
  policy_count INTEGER;
  allowed_policies TEXT[] := ARRAY[
    'audit_logs_admin_all',
    'permissions_admin_all',
    'permissions_admin_select',
    'role_permissions_admin_all',
    'role_permissions_admin_select',
    'roles_admin_all',
    'roles_admin_select'
  ];
  remaining_policies TEXT;
BEGIN
  -- Check for admin policies NOT in allowed list
  SELECT COUNT(*), STRING_AGG(tablename || '.' || policyname, ', ') 
  INTO policy_count, remaining_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname ILIKE '%admin%'
    AND policyname != ALL(allowed_policies);
  
  IF policy_count > 0 THEN
    RAISE WARNING 'Ainda existem % políticas admin não administrativas: %', policy_count, remaining_policies;
  ELSE
    RAISE NOTICE 'Confirmado: Admin tem apenas políticas administrativas (audit_logs, roles, permissions, role_permissions)';
  END IF;
  
  -- List final admin policies
  RAISE NOTICE 'Políticas admin finais:';
  FOR remaining_policies IN 
    SELECT '  - ' || tablename || '.' || policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND policyname ILIKE '%admin%'
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '%', remaining_policies;
  END LOOP;
END $$;

COMMIT;

\echo '✓ Migration 024 completed: Admin tem apenas políticas administrativas'
