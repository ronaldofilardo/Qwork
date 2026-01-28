-- Migration 200: REMOVE ADMIN FROM CLINIC OPERATIONS (CRITICAL RBAC FIX)
-- Data: 2026-01-19
-- Descrição: Remove completamente Admin de operações de clínicas/empresas/funcionários/lotes
-- 
-- POLÍTICA DE NEGÓCIO:
-- - Admin é APENAS plataforma (financeiro, auditorias, configurações globais)
-- - Admin NÃO tem clinica_id nem contratante_id operacional
-- - Apenas perfil 'rh' (gestor de clínica) pode criar/gerenciar empresas, funcionários, lotes
--
-- Este script remove:
-- 1. Policies 'master_*' legadas que ainda existem
-- 2. Policies 'admin_all_*' que dão acesso operacional ao Admin
-- 3. Recria apenas policies necessárias para Admin (audit logs, gestão de usuários RH/emissor)

BEGIN;

\echo '=== MIGRATION 200: Removendo Admin de operações de clínica ==='

-- =========================================
-- 1. REMOVER POLICIES LEGADAS 'master_*'
-- =========================================

\echo 'Removendo policies master_* legadas...'

DROP POLICY IF EXISTS "master_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "master_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "master_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "master_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "master_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "master_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "master_all_resultados" ON public.resultados;
DROP POLICY IF EXISTS "master_all_clinicas" ON public.clinicas;

DROP POLICY IF EXISTS "legacy_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "legacy_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "legacy_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "legacy_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "legacy_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "legacy_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "legacy_all_resultados" ON public.resultados;
DROP POLICY IF EXISTS "legacy_all_clinicas" ON public.clinicas;

DROP POLICY IF EXISTS "empresas_master_all" ON public.empresas_clientes;

\echo 'Policies master_* removidas'

-- =========================================
-- 2. REMOVER POLICIES 'admin_all_*' OPERACIONAIS
-- =========================================

\echo 'Removendo policies admin_all_* que dão acesso operacional ao Admin...'

-- Admin NÃO deve acessar empresas de clínicas
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;

-- Admin NÃO deve acessar lotes de avaliação (operação de RH)
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;

-- Admin NÃO deve acessar avaliacoes, respostas, resultados (dados clínicos)
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;

-- Admin NÃO deve acessar laudos (operação de emissor)
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;

-- Admin NÃO deve acessar clinicas operacionalmente (apenas via API admin)
DROP POLICY IF EXISTS "admin_all_clinicas" ON public.clinicas;

\echo 'Policies admin_all_* operacionais removidas'

-- =========================================
-- 3. CRIAR POLICIES LIMITADAS PARA ADMIN
-- =========================================

\echo 'Criando policies restritas para Admin (apenas gestão de usuários sistema)...'

-- Admin pode gerenciar apenas usuários RH e Emissor (não funcionários de clínicas)
-- Já existe policy "admin_restricted_funcionarios" criada na migration 099
-- Garantir que está correta:
DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON public.funcionarios;
CREATE POLICY "admin_restricted_funcionarios" ON public.funcionarios FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
    AND perfil IN ('rh', 'emissor')
);

\echo 'Policy admin_restricted_funcionarios garantida'

-- =========================================
-- 4. VERIFICAÇÃO E LIMPEZA
-- =========================================

\echo 'Verificando policies restantes...'

DO $$
DECLARE
  v_policy_count INT;
BEGIN
  -- Contar quantas policies 'admin' ou 'master' ainda existem nas tabelas operacionais
  SELECT COUNT(*)
  INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('empresas_clientes', 'lotes_avaliacao', 'avaliacoes', 'respostas', 'resultados', 'laudos')
    AND (policyname LIKE '%admin%' OR policyname LIKE '%master%');

  IF v_policy_count > 0 THEN
    RAISE WARNING 'ATENÇÃO: Ainda existem % policies com admin/master nas tabelas operacionais!', v_policy_count;
    RAISE WARNING 'Revisar manualmente: SELECT tablename, policyname FROM pg_policies WHERE schemaname=''public'' AND tablename IN (''empresas_clientes'', ''lotes_avaliacao'', ''avaliacoes'', ''respostas'', ''resultados'', ''laudos'') AND (policyname LIKE ''%%admin%%'' OR policyname LIKE ''%%master%%'');';
  ELSE
    RAISE NOTICE '✓ Verificação OK: Nenhuma policy admin/master restante nas tabelas operacionais';
  END IF;
END $$;

COMMIT;

\echo '=== MIGRATION 200 COMPLETA ==='
\echo ''
\echo 'Resumo da mudança:'
\echo '  - Admin removido de empresas_clientes, lotes_avaliacao, avaliacoes, laudos, respostas, resultados'
\echo '  - Admin pode apenas gerenciar usuários RH/emissor via policy admin_restricted_funcionarios'
\echo '  - Apenas perfil "rh" (gestor de clínica) pode operar empresas, funcionários, lotes'
\echo ''
