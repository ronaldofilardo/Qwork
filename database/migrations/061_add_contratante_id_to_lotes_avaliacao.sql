-- Migration: 061_add_contratante_id_to_lotes_avaliacao.sql
-- Description: Add contratante_id column to lotes_avaliacao table to support entity lots
-- Date: 2026-01-02

-- Add contratante_id column as nullable
ALTER TABLE public.lotes_avaliacao
ADD COLUMN contratante_id INTEGER;

-- Add foreign key constraint to contratantes table
ALTER TABLE public.lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey
FOREIGN KEY (contratante_id) REFERENCES public.contratantes (id) ON DELETE CASCADE;

-- Add check constraint to ensure either clinica_id or contratante_id is set, but not both
ALTER TABLE public.lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_clinica_or_contratante_check
CHECK (
    (clinica_id IS NOT NULL AND contratante_id IS NULL) OR
    (clinica_id IS NULL AND contratante_id IS NOT NULL)
);

-- Update existing records to have clinica_id set (they should already have it)
-- No action needed as existing records are for clinics

-- Make clinica_id and empresa_id nullable now that we have the check constraint
ALTER TABLE public.lotes_avaliacao
ALTER COLUMN clinica_id DROP NOT NULL;

ALTER TABLE public.lotes_avaliacao
ALTER COLUMN empresa_id DROP NOT NULL;