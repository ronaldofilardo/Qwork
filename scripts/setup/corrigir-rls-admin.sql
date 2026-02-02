-- ============================================================================
-- Script: Corrigir RLS - Remover Acesso Operacional do Admin
-- Data: 31/01/2026
-- Banco: nr-bps_db
-- ============================================================================
-- ATENÇÃO: Admin é ADMINISTRATIVO, não operacional
-- Admin NÃO deve ter acesso a: empresas, funcionários, avaliações, lotes, laudos
-- ============================================================================

BEGIN;

\echo ''
\echo '==================== REMOVENDO POLÍTICAS INCORRETAS DO ADMIN ===================='
\echo ''

-- ============================================================================
-- AVALIACOES - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em avaliacoes...'
DROP POLICY IF EXISTS admin_all_avaliacoes ON avaliacoes;

-- ============================================================================
-- EMPRESAS_CLIENTES - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em empresas_clientes...'
DROP POLICY IF EXISTS admin_all_empresas ON empresas_clientes;

-- ============================================================================
-- LAUDOS - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em laudos...'
DROP POLICY IF EXISTS admin_all_laudos ON laudos;

-- ============================================================================
-- LOTES_AVALIACAO - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em lotes_avaliacao...'
DROP POLICY IF EXISTS admin_all_lotes ON lotes_avaliacao;

-- ============================================================================
-- RESPOSTAS - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em respostas...'
DROP POLICY IF EXISTS admin_all_respostas ON respostas;

-- ============================================================================
-- RESULTADOS - Admin NÃO deve ter acesso
-- ============================================================================
\echo 'Removendo políticas de admin em resultados...'
DROP POLICY IF EXISTS admin_all_resultados ON resultados;

-- ============================================================================
-- FUNCIONARIOS - Admin só deve acessar RH e EMISSORES (administrativo)
-- ============================================================================
\echo 'Política de funcionarios já está correta (admin_restricted_funcionarios)'
-- A política admin_restricted_funcionarios já restringe a apenas rh e emissor
-- Não precisa alterar

\echo ''
\echo '==================== VERIFICAÇÃO FINAL ===================='
\echo ''

\echo 'Políticas restantes com admin:'
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE policyname ILIKE '%admin%'
  AND tablename NOT IN ('audit_logs', 'clinicas', 'contratantes', 'permissions', 'roles', 'role_permissions', 'funcionarios', 'fila_emissao')
ORDER BY tablename, policyname;

\echo ''
\echo 'Políticas BLOCK admin (devem existir para bloquear acesso operacional):'
SELECT 
    tablename,
    policyname,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE policyname ILIKE '%block_admin%'
ORDER BY tablename;

\echo ''
\echo '==================== FINALIZAÇÃO ===================='
\echo ''

COMMIT;

\echo ''
\echo '✅ Políticas RLS corrigidas! Admin agora é APENAS administrativo.'
\echo ''
