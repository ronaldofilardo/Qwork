-- ====================================================================
-- Script de Comparação Completa de Schemas (Local vs Neon)
-- Criado em: 2026-02-02
-- Objetivo: Identificar TODAS as diferenças de estrutura entre os bancos
-- ====================================================================

\echo '=========================================='
\echo 'COMPARAÇÃO DE SCHEMAS: LOCAL vs NEON'
\echo '=========================================='
\echo ''

-- Tabelas que existem em cada banco
\echo '1. TABELAS EXISTENTES:'
\echo '--------------------'
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '2. ENUMS DEFINIDOS:'
\echo '--------------------'
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

\echo ''
\echo '3. ESTRUTURA DA TABELA funcionarios:'
\echo '------------------------------------'
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'funcionarios'
ORDER BY ordinal_position;

\echo ''
\echo '4. ESTRUTURA DA TABELA avaliacoes:'
\echo '----------------------------------'
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'avaliacoes'
ORDER BY ordinal_position;

\echo ''
\echo '5. ESTRUTURA DA TABELA laudos:'
\echo '------------------------------'
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'laudos'
ORDER BY ordinal_position;

\echo ''
\echo '6. ESTRUTURA DA TABELA lotes_avaliacao:'
\echo '---------------------------------------'
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lotes_avaliacao'
ORDER BY ordinal_position;

\echo ''
\echo '7. VIEWS MATERIALIZADAS:'
\echo '------------------------'
SELECT 
    schemaname,
    matviewname
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

\echo ''
\echo '8. FUNCTIONS E TRIGGERS:'
\echo '------------------------'
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_result(p.oid) as result_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

\echo ''
\echo '=========================================='
\echo 'FIM DO RELATÓRIO'
\echo '=========================================='
