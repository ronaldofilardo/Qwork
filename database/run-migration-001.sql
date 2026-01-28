-- Script de execução da migration 001
-- Aplica as mudanças do schema para suportar contratantes unificados

\echo '========================================='
\echo 'Iniciando Migration 001: Contratantes'
\echo '========================================='

-- Executar migration

\i migration-001-contratantes.sql

\echo '========================================='
\echo 'Migration 001 concluída com sucesso!'
\echo '========================================='
\echo ''
\echo 'Próximos passos:'
\echo '1. Executar seed para dados de teste'
\echo '2. Atualizar APIs para usar novas tabelas'
\echo '3. Atualizar frontend para novos fluxos'