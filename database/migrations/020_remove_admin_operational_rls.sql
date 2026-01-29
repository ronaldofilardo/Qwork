-- Migration 020: Remover acesso operacional legado do perfil admin
-- Data: 2026-01-29

BEGIN;

-- 1. Remover policies que permitiam admin ver/gerir lotes e laudos
DROP POLICY IF EXISTS policy_lotes_admin ON public.lotes_avaliacao;
DROP POLICY IF EXISTS policy_laudos_admin ON public.laudos;
DROP POLICY IF EXISTS policy_laudos_admin ON laudos;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "laudos_admin_all" ON public.laudos;

-- 2. Remover policies de admin para empresas (se existirem)
DROP POLICY IF EXISTS "empresas_admin_select" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON public.empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON public.empresas_clientes;

-- 3. Remover policies antigas de admin sobre avaliações, caso existam
DROP POLICY IF EXISTS "avaliacoes_admin" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_all" ON public.avaliacoes;

-- 4. Garantir que admin NÃO seja incluído em policies que concedem acesso amplo
-- (ex.: clinicas_own_select deve continuar permitindo admin ver A SUA clínica apenas)
-- Revisar e remover references explícitas a current_user_perfil() = 'admin' em policies operacionais
-- (Essa revisão é manual em migrações históricas; aqui garantimos remoção de policies que contém admin_all)

COMMIT;

-- Notice para auditoria manual
DO $$
BEGIN
  RAISE NOTICE 'Migration 020 executed: removed legacy admin operational RLS policies (lotes, laudos, empresas, avaliacoes if existed)';
END $$;
