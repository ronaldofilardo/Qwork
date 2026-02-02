-- ==========================================
-- REMOVER POLÍTICAS RLS PERMISSIVAS PARA ADMIN
-- Data: 31/01/2026
-- Objetivo: Eliminar TODAS as políticas RLS que concedem acesso operacional ao admin
-- ==========================================

BEGIN;

\echo '================================================'
\echo 'INICIANDO REMOÇÃO DE POLÍTICAS ADMIN PERMISSIVAS'
\echo '================================================'

-- ==========================================
-- 1. REMOVER POLÍTICAS DE MIGRATIONS/099
-- ==========================================

\echo ''
\echo 'Removendo políticas de migration 099 (admin_all_*)...'

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;

\echo '✓ Removidas 6 políticas admin_all_*'

-- ==========================================
-- 2. REMOVER POLÍTICAS DE MIGRATIONS/055
-- ==========================================

\echo ''
\echo 'Removendo políticas de migration 055 (empresas_admin_*)...'

DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_delete" ON empresas_clientes;

\echo '✓ Removidas 4 políticas empresas_admin_*'

-- ==========================================
-- 3. REMOVER POLÍTICAS DE MIGRATIONS/007
-- ==========================================

\echo ''
\echo 'Removendo políticas de migration 007 (policy_*_admin)...'

DROP POLICY IF EXISTS policy_lotes_admin ON lotes_avaliacao;
DROP POLICY IF EXISTS policy_laudos_admin ON laudos;

\echo '✓ Removidas 2 políticas policy_*_admin'

-- ==========================================
-- 4. REMOVER POLÍTICAS DE MIGRATIONS/004
-- ==========================================

\echo ''
\echo 'Removendo políticas antigas de migration 004 se existirem...'

DROP POLICY IF EXISTS "empresas_admin_select" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_insert" ON empresas_clientes;
DROP POLICY IF EXISTS "empresas_admin_update" ON empresas_clientes;

\echo '✓ Verificadas políticas de migration 004'

-- ==========================================
-- 5. REMOVER QUAISQUER OUTRAS VARIAÇÕES
-- ==========================================

\echo ''
\echo 'Removendo variações de nomes de políticas admin...'

-- Avaliacoes
DROP POLICY IF EXISTS "admin_view_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_manage_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_update_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_delete_avaliacoes" ON avaliacoes;

-- Empresas
DROP POLICY IF EXISTS "admin_view_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_manage_empresas" ON empresas_clientes;
DROP POLICY IF EXISTS "admin_update_empresas" ON empresas_clientes;

-- Lotes
DROP POLICY IF EXISTS "admin_view_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_manage_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_update_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_delete_lotes" ON lotes_avaliacao;

-- Laudos
DROP POLICY IF EXISTS "admin_view_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_manage_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_update_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_delete_laudos" ON laudos;

-- Respostas
DROP POLICY IF EXISTS "admin_view_respostas" ON respostas;
DROP POLICY IF EXISTS "admin_manage_respostas" ON respostas;

-- Resultados
DROP POLICY IF EXISTS "admin_view_resultados" ON resultados;
DROP POLICY IF EXISTS "admin_manage_resultados" ON resultados;

\echo '✓ Verificadas todas as variações possíveis'

-- ==========================================
-- 6. VERIFICAR POLÍTICAS RESTRICTIVE EXISTEM
-- ==========================================

\echo ''
\echo 'Verificando políticas RESTRICTIVE block_admin...'

DO $$
DECLARE
    v_count INTEGER;
    v_policy RECORD;
BEGIN
    -- Contar políticas block_admin
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%_block_admin'
    AND permissive = 'RESTRICTIVE';
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'POLÍTICAS RESTRICTIVE ENCONTRADAS: %', v_count;
    RAISE NOTICE '================================================';
    
    -- Listar cada política block_admin
    FOR v_policy IN 
        SELECT tablename, policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname LIKE '%_block_admin'
        AND permissive = 'RESTRICTIVE'
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '✓ %.% (comando: %)', v_policy.tablename, v_policy.policyname, v_policy.cmd;
    END LOOP;
    
    IF v_count < 7 THEN
        RAISE WARNING 'ATENÇÃO: Esperado pelo menos 7 políticas RESTRICTIVE block_admin, encontrado: %', v_count;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✓ Políticas RESTRICTIVE confirmadas!';
    END IF;
END $$;

-- ==========================================
-- 7. LISTAR POLÍTICAS RESTANTES COM 'ADMIN'
-- ==========================================

\echo ''
\echo '================================================'
\echo 'POLÍTICAS RESTANTES QUE MENCIONAM ADMIN:'
\echo '================================================'

SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    cmd,
    CASE 
        WHEN permissive = 'RESTRICTIVE' THEN '✓ OK (block)'
        WHEN policyname LIKE '%admin%' AND policyname LIKE '%rh%' THEN '✓ OK (rh/emissor)'
        WHEN policyname LIKE '%admin%' AND tablename = 'clinicas' THEN '✓ OK (admin vê clínicas)'
        WHEN policyname LIKE '%admin%' AND tablename IN ('roles', 'permissions', 'audit_logs') THEN '✓ OK (admin gerencia RBAC)'
        ELSE '⚠ VERIFICAR'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND (policyname ILIKE '%admin%' OR qual ILIKE '%admin%' OR with_check ILIKE '%admin%')
ORDER BY 
    CASE WHEN permissive = 'RESTRICTIVE' THEN 1 ELSE 2 END,
    tablename, 
    policyname;

-- ==========================================
-- 8. CONTAR POLÍTICAS REMOVIDAS VS RESTANTES
-- ==========================================

\echo ''
\echo '================================================'
\echo 'RESUMO FINAL'
\echo '================================================'

DO $$
DECLARE
    v_total INTEGER;
    v_restrictive INTEGER;
    v_permissive INTEGER;
BEGIN
    -- Contar total de políticas com 'admin'
    SELECT COUNT(*) INTO v_total
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (policyname ILIKE '%admin%' OR qual ILIKE '%admin%' OR with_check ILIKE '%admin%');
    
    -- Contar RESTRICTIVE
    SELECT COUNT(*) INTO v_restrictive
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (policyname ILIKE '%admin%' OR qual ILIKE '%admin%' OR with_check ILIKE '%admin%')
    AND permissive = 'RESTRICTIVE';
    
    -- Contar PERMISSIVE
    v_permissive := v_total - v_restrictive;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total de políticas mencionando admin: %', v_total;
    RAISE NOTICE '  - RESTRICTIVE (bloqueiam admin): %', v_restrictive;
    RAISE NOTICE '  - PERMISSIVE (permitem admin): %', v_permissive;
    RAISE NOTICE '';
    
    IF v_permissive > 15 THEN
        RAISE WARNING 'ATENÇÃO: Mais de 15 políticas PERMISSIVE ainda existem!';
        RAISE WARNING 'Verifique a lista acima para identificar problemas.';
    ELSE
        RAISE NOTICE '✓ Número de políticas PERMISSIVE dentro do esperado';
        RAISE NOTICE '  (funcionarios_admin_* e clinicas_* são legítimas)';
    END IF;
END $$;

COMMIT;

\echo ''
\echo '================================================'
\echo '✓ LIMPEZA CONCLUÍDA COM SUCESSO!'
\echo '================================================'
\echo ''
\echo 'Próximos passos:'
\echo '1. Revisar a lista de políticas restantes acima'
\echo '2. Confirmar que apenas políticas RESTRICTIVE ou legítimas existem'
\echo '3. Testar que admin NÃO consegue acessar dados operacionais'
\echo ''
