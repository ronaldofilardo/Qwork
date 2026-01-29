-- Migration 021: Cleanup - garantir que admin não tenha permissões operacionais
-- Data: 2026-01-29

BEGIN;

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'admin'
  AND p.name IN (
    'manage:avaliacoes',
    'manage:funcionarios',
    'manage:empresas',
    'manage:lotes',
    'manage:laudos'
  );

COMMIT;

DO $$
DECLARE
  count_admin_perms INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_admin_perms
  FROM role_permissions rp
  JOIN roles r ON r.id = rp.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.name = 'admin'
    AND p.name IN ('manage:avaliacoes', 'manage:funcionarios', 'manage:empresas', 'manage:lotes', 'manage:laudos');

  IF count_admin_perms > 0 THEN
    RAISE WARNING 'Cleanup incomplete: admin still has % operational permissions', count_admin_perms;
  ELSE
    RAISE NOTICE 'Cleanup complete: admin has no operational permissions';
  END IF;
END $$;
