-- =====================================================
-- Migration 221: Remove Obsolete Auto-Emission Fields
-- =====================================================
-- Description: Removes auto_emitir_em, auto_emitir_agendado fields from lotes_avaliacao
--              and drops obsolete fila_emissao table
-- Related: CRITICAL Fix #2 from batch liberation flow analysis
-- Date: 2025
-- =====================================================

BEGIN;

-- Step 1: Drop fila_emissao table if exists
DROP TABLE IF EXISTS public.fila_emissao CASCADE;

RAISE NOTICE 'Dropped fila_emissao table (obsolete)';

-- Step 2: Drop lotes_avaliacao_funcionarios table if exists (also obsolete)
DROP TABLE IF EXISTS public.lotes_avaliacao_funcionarios CASCADE;

RAISE NOTICE 'Dropped lotes_avaliacao_funcionarios table (obsolete)';

-- Step 3: Remove auto_emitir_agendado column if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_agendado'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP COLUMN auto_emitir_agendado;
        
        RAISE NOTICE 'Dropped auto_emitir_agendado column';
    END IF;
END $$;

-- Step 4: Remove auto_emitir_em column if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP COLUMN auto_emitir_em;
        
        RAISE NOTICE 'Dropped auto_emitir_em column';
    END IF;
END $$;

-- Step 5: Remove emitido_em column if exists (keep only in laudos table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'emitido_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP COLUMN emitido_em;
        
        RAISE NOTICE 'Dropped emitido_em column (exists in laudos table)';
    END IF;
END $$;

-- Step 6: Remove enviado_em column if exists (keep only in laudos table)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'enviado_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP COLUMN enviado_em;
        
        RAISE NOTICE 'Dropped enviado_em column (exists in laudos table)';
    END IF;
END $$;

COMMIT;

-- Verification
SELECT 
    'Migration 221 completed successfully' as status,
    NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_emissao') as fila_emissao_removed,
    NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lotes_avaliacao_funcionarios') as lotes_func_removed,
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_avaliacao' AND column_name = 'auto_emitir_em') as auto_emitir_em_removed,
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_avaliacao' AND column_name = 'auto_emitir_agendado') as auto_emitir_agendado_removed;
