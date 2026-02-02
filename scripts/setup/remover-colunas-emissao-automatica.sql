-- ==========================================
-- SCRIPT: Remover Colunas de Emissão Automática
-- ==========================================
-- Data: 2026-01-31
-- Descrição: Executa a migration 130 para remover colunas legadas
--
-- ATENÇÃO: Este script remove PERMANENTEMENTE as colunas:
--   - auto_emitir_em
--   - auto_emitir_agendado
--   - processamento_em
--   - cancelado_automaticamente
--   - motivo_cancelamento
--
-- Execute apenas se tiver certeza!
-- ==========================================

\set ON_ERROR_STOP on

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  REMOÇÃO DE COLUNAS DE EMISSÃO AUTOMÁTICA                 ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Aplicar migration 130
\i database/migrations/130_remove_auto_emission_columns.sql

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  ✅ REMOÇÃO CONCLUÍDA COM SUCESSO                         ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Sistema de emissão automática COMPLETAMENTE removido.'
\echo 'Emissão de laudos é agora 100% MANUAL pelo emissor.'
\echo ''
