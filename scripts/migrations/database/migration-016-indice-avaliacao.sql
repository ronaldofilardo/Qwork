-- Migration 016: Campos de índice de avaliação (idempotente)
-- Adiciona campos necessários para o sistema de índices de avaliação.

ALTER TABLE IF EXISTS lotes_avaliacao ADD COLUMN IF NOT EXISTS numero_ordem INTEGER;

ALTER TABLE IF EXISTS funcionarios ADD COLUMN IF NOT EXISTS indice_avaliacao INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS funcionarios ADD COLUMN IF NOT EXISTS data_ultimo_lote TIMESTAMP;

-- Observação: A função `detectar_anomalias_indice` e `verificar_inativacao_consecutiva` serão atualizadas pelas FUNCTIONS 016 subsequentes.
