-- Migration 009: Remove obsolete contract-related columns
-- Created: 2025-12-26
-- Description: Removes all columns related to pre-payment contract generation feature

-- Remove columns from tomadores table
ALTER TABLE tomadores
  DROP COLUMN IF EXISTS contrato_gerado CASCADE,
  DROP COLUMN IF EXISTS contrato_aceito CASCADE,
  DROP COLUMN IF EXISTS contrato_id CASCADE;

-- Remove 'contrato_gerado_pendente' from status enum if exists
-- Note: Cannot directly modify enum, would need to recreate. For safety, keeping enum value but not using it.
-- If strict removal needed, must recreate enum and update all references

-- Update any rows still in contrato_gerado_pendente status to aguardando_pagamento
UPDATE tomadores 
SET status = 'aguardando_pagamento'
WHERE status = 'contrato_gerado_pendente';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 009 completed: Removed contrato_gerado, contrato_aceito, contrato_id columns';
END $$;
