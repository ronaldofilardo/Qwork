-- ============================================================================
-- Migration 9003: Remover Mecanismo de 'Anomalia Detectada' em Avaliações
-- ============================================================================
-- Data: 2026-04-16
-- Contexto: O sistema de detecção de anomalias em scores de avaliação e no
--           histórico de índice de avaliações foi descontinuado. Esta migration:
--           1. Remove as funções PostgreSQL de detecção de anomalias
--           2. Remove colunas de anomalia da tabela analise_estatistica
--           3. Remove campos de anomalia de tabelas de auditoria, se existirem
--
-- IMPORTANTE: IF EXISTS em todos os comandos — seguro para staging e produção.
-- ============================================================================

BEGIN;

-- 1. Remover funções PostgreSQL de detecção de anomalias
DROP FUNCTION IF EXISTS detectar_anomalias_indice(integer) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalias_indice(bigint) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalia_score(numeric, text, integer) CASCADE;
DROP FUNCTION IF EXISTS detectar_anomalia_score(numeric, varchar, integer) CASCADE;

-- 2. Remover colunas de anomalia da tabela analise_estatistica
ALTER TABLE analise_estatistica DROP COLUMN IF EXISTS anomalia_detectada;
ALTER TABLE analise_estatistica DROP COLUMN IF EXISTS tipo_anomalia;

-- 3. Remover colunas de anomalia de tabelas de auditoria (se existirem)
ALTER TABLE auditoria_laudos DROP COLUMN IF EXISTS possui_anomalia;
ALTER TABLE auditoria_laudos DROP COLUMN IF EXISTS anomalia_tipo;

-- Nota: A tabela analise_estatistica permanece intacta (score_original,
--       score_ajustado, recomendacao etc.) — apenas os campos de anomalia
--       são removidos.

COMMIT;
