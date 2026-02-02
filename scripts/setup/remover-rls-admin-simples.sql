-- Remover politicas RLS permissivas para admin
-- Data: 31/01/2026

BEGIN;

-- Migration 099
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;

-- Migration 055
DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;

-- Migration 007
DROP POLICY IF EXISTS policy_lotes_admin ON lotes_avaliacao;
DROP POLICY IF EXISTS policy_laudos_admin ON laudos;

-- Variacoes
DROP POLICY IF EXISTS "admin_view_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_manage_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_view_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_manage_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_view_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_manage_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_view_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_manage_laudos" ON laudos;

-- Listar politicas restantes com admin
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (policyname ILIKE '%admin%' OR qual ILIKE '%admin%' OR with_check ILIKE '%admin%')
ORDER BY tablename, policyname;

COMMIT;
