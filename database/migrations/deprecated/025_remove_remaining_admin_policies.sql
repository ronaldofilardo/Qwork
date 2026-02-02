-- Migration 025: Remove remaining admin operational policies (empresas_clientes, funcionarios, notificacoes)

BEGIN;

\echo 'Migration 025: Dropping remaining admin operational policies...'

DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "notificacoes_admin_full_access" ON notificacoes;

DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM pg_policies WHERE schemaname = 'public' AND policyname ILIKE '%admin%';
  RAISE NOTICE 'Remaining admin policies (total): %', cnt;
END $$;

COMMIT;

\echo '✓ Migration 025 applied'
