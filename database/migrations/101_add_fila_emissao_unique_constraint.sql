-- Migration: Add unique constraint to fila_emissao for idempotency
-- Description: Ensures INSERT...ON CONFLICT works for idempotent queue insertion
-- Created: 2026-01-27

BEGIN;

-- Add unique constraint on lote_id if it doesn't exist and table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_emissao' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'fila_emissao_lote_id_unique'
    ) THEN
      EXECUTE 'ALTER TABLE public.fila_emissao ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id)';
      RAISE NOTICE 'Unique constraint added to fila_emissao.lote_id';
    ELSE
      RAISE NOTICE 'Unique constraint already exists on fila_emissao.lote_id';
    END IF;
  ELSE
    RAISE NOTICE 'Table fila_emissao does not exist, skipping constraint creation';
  END IF;
END $$;

COMMIT;
