-- Migration 085: Remover campos legados de código e título de lotes
-- Date: 2026-02-03

BEGIN;

-- 1. Remover índice para o campo codigo (se existir)
DROP INDEX IF EXISTS idx_lotes_codigo;

-- 2. Remover constraint de unicidade para o campo codigo (se existir)
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_codigo_key;

-- 3. Remover colunas codigo e titulo da tabela lotes_avaliacao
ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS codigo;
ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS titulo;

-- 4. Remover função gerar_codigo_lote() (se existir)
DROP FUNCTION IF EXISTS gerar_codigo_lote();

COMMIT;

-- Rollback manual (if necessary):
-- BEGIN;
-- CREATE FUNCTION public.gerar_codigo_lote() RETURNS character varying
--     LANGUAGE plpgsql
--     AS $$
-- 
-- DECLARE
-- 
--     data_atual VARCHAR(6);
-- 
--     sequencial INT;
-- 
--     codigo VARCHAR(20);
-- 
-- BEGIN
-- 
--     -- Formato: 001-DDMMYY (ex: 001-291125)
-- 
--     data_atual := TO_CHAR(CURRENT_DATE, 'DDMMYY');
-- 
-- 
-- 
--     -- Buscar prÃ³ximo sequencial para a data
-- 
--     SELECT COALESCE(MAX(CAST(SPLIT_PART( '-', 1) AS INTEGER)), 0) + 1
-- 
--     INTO sequencial
-- 
--     FROM lotes_avaliacao la
-- 
--     WHERE la.codigo LIKE '%-' || data_atual;
-- 
-- 
-- 
--     -- Formatar cÃ³digo com zeros Ã  esquerda
-- 
--     codigo := LPAD(sequencial::TEXT, 3, '0') || '-' || data_atual;
-- 
-- 
-- 
--     RETURN codigo;
-- 
-- END;
-- $$;
-- ALTER TABLE lotes_avaliacao ADD COLUMN IF EXISTS codigo character varying(20) NOT NULL UNIQUE;
-- ALTER TABLE lotes_avaliacao ADD COLUMN IF EXISTS titulo character varying(100) NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_lotes_codigo ON lotes_avaliacao USING btree (codigo);
-- COMMIT;
