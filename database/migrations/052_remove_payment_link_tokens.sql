-- Migration 052: Remover colunas e índices relacionados a payment_link_token (remoção de fluxo por token)
-- Data: 2026-01-13

BEGIN;

-- Remover coluna de token de contratacao_personalizada
ALTER TABLE IF EXISTS contratacao_personalizada DROP COLUMN IF EXISTS payment_link_token;

-- Remover coluna de token de contratos
ALTER TABLE IF EXISTS contratos DROP COLUMN IF EXISTS payment_link_token;

-- Remover índices relacionados
DROP INDEX IF EXISTS idx_contratacao_personalizada_token;
DROP INDEX IF EXISTS idx_contratacao_personalizada_token_unique;
DROP INDEX IF EXISTS ux_contratos_payment_link_token;

-- Remover constraints associadas (se existirem)
ALTER TABLE IF EXISTS contratacao_personalizada DROP CONSTRAINT IF EXISTS contratacao_personalizada_payment_link_token_key;

COMMIT;

SELECT 'Migration 052 concluída: payment_link_token removido do esquema' AS status;
