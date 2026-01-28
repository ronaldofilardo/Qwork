-- Migration 103: Adicionar colunas denormalizadas faltantes para última avaliação
-- Data: 2026-01-23
-- Descrição: Garante que as colunas usadas por queries de consulta de funcionários existam

BEGIN;

ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS ultimo_lote_codigo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_data_conclusao TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ultimo_motivo_inativacao TEXT,
  ADD COLUMN IF NOT EXISTS data_ultimo_lote TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_funcionarios_ultima_avaliacao_status
  ON funcionarios(ultima_avaliacao_status) WHERE ultima_avaliacao_status IS NOT NULL;

-- Não adicionar foreign key aqui para evitar conflito com migrações anteriores; será revisado em QA

COMMIT;