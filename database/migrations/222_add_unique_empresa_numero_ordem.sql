-- =====================================================
-- Migration 222: Add UNIQUE Constraint on (empresa_id, numero_ordem)
-- =====================================================
-- Description: Adds UNIQUE constraint to prevent duplicate batch numbers for same company
-- Related: FIX #5 from batch liberation flow analysis
-- Date: 2025
-- =====================================================

BEGIN;

-- Add UNIQUE constraint on (empresa_id, numero_ordem)
-- This ensures each batch has a unique sequential number within its company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_empresa_numero_ordem_unique'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique 
        UNIQUE (empresa_id, numero_ordem);
        
        RAISE NOTICE 'Added UNIQUE constraint on (empresa_id, numero_ordem)';
    ELSE
        RAISE NOTICE 'UNIQUE constraint already exists';
    END IF;
END $$;

COMMIT;

-- Verification
SELECT 
    'Migration 222 completed successfully' as status,
    EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_empresa_numero_ordem_unique'
    ) as constraint_exists;
