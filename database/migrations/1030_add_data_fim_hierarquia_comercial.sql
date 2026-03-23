-- ====================================================================
-- Migration 1030: Adiciona coluna data_fim à hierarquia_comercial
-- Data: 2026-03-22
-- Objetivo: Registrar a data de encerramento do vínculo vendedor ↔ representante
-- ====================================================================

BEGIN;

ALTER TABLE public.hierarquia_comercial
  ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ;

COMMENT ON COLUMN public.hierarquia_comercial.data_fim
  IS 'Data em que o vínculo foi encerrado (inativação). NULL = vínculo ativo.';

COMMIT;
