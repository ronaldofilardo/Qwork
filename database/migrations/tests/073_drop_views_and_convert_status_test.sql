-- Migration 073: Dropar views que dependem de lotes_avaliacao.status e converter status para enum no banco de teste
-- Data: 2026-01-05

BEGIN;

-- Dropar views dependentes (se existirem)
DROP VIEW IF EXISTS vw_lotes_por_contratante CASCADE;
DROP VIEW IF EXISTS vw_alertas_lotes_stuck CASCADE;
DROP VIEW IF EXISTS vw_metricas_emissao_laudos CASCADE;
DROP VIEW IF EXISTS vw_health_check_contratantes CASCADE;

-- Converter tipo de coluna status para status_lote
ALTER TABLE IF EXISTS lotes_avaliacao ALTER COLUMN status TYPE status_lote USING status::status_lote;
ALTER TABLE IF EXISTS lotes_avaliacao ALTER COLUMN status SET DEFAULT 'rascunho'::status_lote;

SELECT '073.1 Views dropadas e status convertido' as status;

COMMIT;
