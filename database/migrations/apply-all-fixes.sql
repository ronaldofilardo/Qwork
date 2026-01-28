-- Script de aplicação sequencial das migrations de correção
-- Execute este arquivo para aplicar todas as correções de integridade
-- Data: 2025-12-20

\echo '=========================================='
\echo 'INICIANDO APLICAÇÃO DE MIGRATIONS'
\echo 'Correções de Integridade - Issues Críticos'
\echo '=========================================='
\echo ''

-- Migration 011: Corrigir FK clinicas_empresas
\echo '>>> Migration 011: Corrigindo FK clinicas_empresas...'
\i 'database/migrations/011_fix_clinicas_empresas_fk.sql'
\echo '✅ Migration 011 concluída'
\echo ''

-- Migration 012: Remover tabela redundante
\echo '>>> Migration 012: Removendo tabela redundante lotes_avaliacao_funcionarios...'
\i 'database/migrations/012_remove_redundant_table.sql'
\echo '✅ Migration 012 concluída'
\echo ''

-- Migration 013: Validação nivel_cargo
\echo '>>> Migration 013: Adicionando validação nivel_cargo...'
\i 'database/migrations/013_nivel_cargo_not_null.sql'
\echo '✅ Migration 013 concluída'
\echo ''

-- Migration 014: FK analise_estatistica
\echo '>>> Migration 014: Adicionando FK em analise_estatistica...'
\i 'database/migrations/014_add_fk_analise_estatistica.sql'
\echo '✅ Migration 014 concluída'
\echo ''

-- Migration 072: Corrigir constraint funcionarios_clinica_check para contratante
\echo '>>> Migration 072: Ajustando funcionarios_clinica_check para permitir contratante_id...'
\i 'database/migrations/072_fix_funcionarios_clinica_check_include_contratante.sql'
\echo '✅ Migration 072 concluída'
\echo ''

-- Verificação final de integridade
\echo '=========================================='
\echo 'VERIFICAÇÃO FINAL DE INTEGRIDADE'
\echo '=========================================='

-- Verificar todas as FKs criadas
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    (tc.table_name = 'clinicas_empresas' AND kcu.column_name = 'clinica_id')
    OR (tc.table_name = 'analise_estatistica' AND kcu.column_name = 'avaliacao_id')
  )
ORDER BY tc.table_name, kcu.column_name;

-- Verificar constraints CHECK criadas
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'funcionarios'
  AND tc.constraint_name IN ('funcionarios_nivel_cargo_check', 'funcionarios_clinica_check')
ORDER BY tc.constraint_name;

-- Verificar tabelas removidas
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'lotes_avaliacao_funcionarios'
        ) THEN '❌ ERRO: Tabela lotes_avaliacao_funcionarios ainda existe'
        ELSE '✅ OK: Tabela lotes_avaliacao_funcionarios foi removida'
    END as status_remocao;

\echo ''
\echo '=========================================='
\echo 'TODAS AS MIGRATIONS APLICADAS COM SUCESSO'
\echo '=========================================='
\echo ''
\echo 'Próximos passos:'
\echo '1. Executar testes: pnpm test'
\echo '2. Verificar testes de integridade específicos:'
\echo '   pnpm test migrations-integrity'
\echo '   pnpm test lote-status-sync'
\echo '3. Revisar e atualizar schema-complete.sql se necessário'
\echo '4. Fazer backup do banco antes de deploy em produção'
