-- Migration 022: Remover policies RLS que permitem admin acessar/gerir funcionarios
-- Data: 2026-01-29

BEGIN;

-- Remover policies antigas que dão poderes administrativos operacionais ao perfil admin
DROP POLICY IF EXISTS "funcionarios_admin_select" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_insert" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_update" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_select" ON funcionarios;

-- Garantir que não existam outras policies com nome contendo 'admin' que afetem funcionarios
-- Observe: isto apenas remove policies conhecidas; revisões manuais podem ser necessárias

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Migration 022 executed: removed funcionarios admin policies (select/insert/update)';
END $$;
