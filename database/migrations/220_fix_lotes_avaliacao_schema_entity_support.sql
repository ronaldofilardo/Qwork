-- =====================================================
-- Migration 220: Fix lotes_avaliacao Schema for Entity Support
-- =====================================================
-- Description: Adds contratante_id field and makes clinica_id/empresa_id nullable
--              to support entity batch flow (direct to contratante without clinic/company)
-- Related: CRITICAL Fix #1 from batch liberation flow analysis
-- Date: 2025
-- =====================================================

BEGIN;

-- Step 1: Add contratante_id field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'contratante_id'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN contratante_id integer;
        
        RAISE NOTICE 'Added contratante_id column to lotes_avaliacao';
    END IF;
END $$;

-- Step 2: Add processamento_em field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'processamento_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN processamento_em timestamp without time zone;
        
        RAISE NOTICE 'Added processamento_em column to lotes_avaliacao';
    END IF;
END $$;

-- Step 3: Add numero_ordem field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'numero_ordem'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN numero_ordem integer DEFAULT 1 NOT NULL;
        
        RAISE NOTICE 'Added numero_ordem column to lotes_avaliacao';
    END IF;
END $$;

-- Step 4: Add laudo_enviado_em field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'laudo_enviado_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN laudo_enviado_em timestamp without time zone;
        
        RAISE NOTICE 'Added laudo_enviado_em column to lotes_avaliacao';
    END IF;
END $$;

-- Step 5: Add finalizado_em field if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'finalizado_em'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN finalizado_em timestamp without time zone;
        
        RAISE NOTICE 'Added finalizado_em column to lotes_avaliacao';
    END IF;
END $$;

-- Step 6: Make clinica_id nullable (if currently NOT NULL)
DO $$
BEGIN
    ALTER TABLE public.lotes_avaliacao 
    ALTER COLUMN clinica_id DROP NOT NULL;
    
    RAISE NOTICE 'Made clinica_id nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'clinica_id is already nullable or error occurred: %', SQLERRM;
END $$;

-- Step 7: Make empresa_id nullable (if currently NOT NULL)
DO $$
BEGIN
    ALTER TABLE public.lotes_avaliacao 
    ALTER COLUMN empresa_id DROP NOT NULL;
    
    RAISE NOTICE 'Made empresa_id nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'empresa_id is already nullable or error occurred: %', SQLERRM;
END $$;

-- Step 8: Add XOR constraint (clinica_id OR contratante_id, not both)
DO $$
BEGIN
    -- Drop constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_clinica_or_contratante_check'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
    END IF;
    
    -- Add constraint
    ALTER TABLE public.lotes_avaliacao 
    ADD CONSTRAINT lotes_avaliacao_clinica_or_contratante_check 
    CHECK (
        ((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) 
        OR 
        ((clinica_id IS NULL) AND (contratante_id IS NOT NULL))
    );
    
    RAISE NOTICE 'Added XOR constraint: clinica_id OR contratante_id (not both)';
END $$;

-- Step 9: Add foreign key constraint for contratante_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_contratante_id_fkey'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey 
        FOREIGN KEY (contratante_id) 
        REFERENCES public.contratantes(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for contratante_id';
    END IF;
END $$;

-- Step 10: Add index on contratante_id for performance
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_contratante_id 
ON public.lotes_avaliacao(contratante_id);

RAISE NOTICE 'Added index on contratante_id';

-- Step 11: Add index on numero_ordem for performance
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_numero_ordem 
ON public.lotes_avaliacao(empresa_id, numero_ordem);

RAISE NOTICE 'Added composite index on (empresa_id, numero_ordem)';

COMMIT;

-- Verification
SELECT 
    'Migration 220 completed successfully' as status,
    COUNT(*) as total_lotes,
    COUNT(contratante_id) as lotes_with_contratante,
    COUNT(clinica_id) as lotes_with_clinica
FROM public.lotes_avaliacao;
