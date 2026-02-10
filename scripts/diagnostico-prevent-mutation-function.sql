-- Script de Diagnóstico: Verificar Estado da Função prevent_mutation_during_emission em PROD
-- Data: 10/02/2026
-- Objetivo: Diagnosticar se a migration 099 foi aplicada e se a função está correta

\echo '=========================================='
\echo '  DIAGNÓSTICO: prevent_mutation_during_emission'
\echo '=========================================='
\echo ''

-- 1. Verificar se a coluna processamento_em existe na tabela lotes_avaliacao
\echo '1. Verificando se coluna processamento_em existe...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'processamento_em'
    ) THEN '❌ COLUNA AINDA EXISTE (deveria ter sido removida na migration 130)'
    ELSE '✅ COLUNA FOI REMOVIDA (correto)'
  END AS status_coluna;

\echo ''
\echo '2. Verificando definição atual da função...'
-- 2. Buscar definição da função
SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc) AS definicao_funcao;

\echo ''
\echo '3. Verificando se função menciona processamento_em...'
-- 3. Verificar se a função menciona processamento_em
SELECT 
  CASE 
    WHEN pg_get_functiondef('prevent_mutation_during_emission'::regproc) LIKE '%processamento_em%'
    THEN '❌ FUNÇÃO AINDA REFERENCIA processamento_em (ERRO - causa o bug)'
    ELSE '✅ FUNÇÃO NÃO REFERENCIA processamento_em (correto)'
  END AS status_funcao;

\echo ''
\echo '4. Verificando comentário da função...'
-- 4. Ver comentário da função (indica se migration 099 foi aplicada)
SELECT 
  obj_description('prevent_mutation_during_emission'::regproc, 'pg_proc') AS comentario;

\echo ''
\echo '5. Verificando trigger associado...'
-- 5. Verificar se o trigger está ativo
SELECT 
  tgname AS trigger_name,
  tgenabled AS habilitado,
  tgtype AS tipo,
  pg_get_triggerdef(oid) AS definicao
FROM pg_trigger
WHERE tgname = 'trigger_prevent_avaliacao_mutation_during_emission';

\echo ''
\echo '6. Verificando migrações aplicadas (se houver tabela de controle)...'
-- 6. Verificar se existe tabela de controle de migrações
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations')
    THEN 'Tabela migrations existe - verificando...'
    ELSE '⚠️  Não existe tabela de controle de migrações'
  END AS status_migrations_table;

-- Se existir, mostrar as últimas migrações aplicadas
SELECT 
  id,
  name,
  applied_at
FROM migrations
WHERE name LIKE '%099%' OR name LIKE '%prevent_mutation%'
ORDER BY applied_at DESC
LIMIT 5;

\echo ''
\echo '7. Testando query problemática (simulação)...'
-- 7. Simular a query que está falhando (sem executar o trigger)
-- Isto mostraria o erro se processamento_em não existir
EXPLAIN (FORMAT TEXT)
SELECT status, emitido_em
FROM lotes_avaliacao 
WHERE id = 1;

\echo ''
\echo '=========================================='
\echo '  DIAGNÓSTICO COMPLETO'
\echo '=========================================='
\echo ''
\echo 'Se a função AINDA REFERENCIA processamento_em:'
\echo '  → Execute: psql DATABASE_URL -f database/migrations/1009_fix_prevent_mutation_function_prod.sql'
\echo ''
\echo 'Se a função JÁ ESTÁ CORRIGIDA:'
\echo '  → O problema foi resolvido, teste a rota /inativar novamente'
\echo ''
