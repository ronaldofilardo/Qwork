-- =====================================================
-- Migration 1008b: Fix - Add entidade_id segregation
-- =====================================================
-- Description: Corrige problemas de encoding e aplica
--              constraint de segregacao corretamente
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Criar constraint de segregacao  
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_owner_segregation_check'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD CONSTRAINT lotes_avaliacao_owner_segregation_check 
        CHECK (
          (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL) 
          OR
          (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
        );
        
        RAISE NOTICE 'Nova constraint criada: lotes_avaliacao_owner_segregation_check';
    ELSE
        RAISE NOTICE 'Constraint ja existe: lotes_avaliacao_owner_segregation_check';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Limpar lotes com violacao de segregacao
-- =====================================================
-- Para lotes que tem AMBOS clinica_id e entidade_id,
-- manter apenas clinica_id (arquitetura de clinica tem prioridade)
UPDATE lotes_avaliacao 
SET entidade_id = NULL
WHERE entidade_id IS NOT NULL 
  AND clinica_id IS NOT NULL 
  AND empresa_id IS NOT NULL;

-- =====================================================
-- STEP 3: Criar indice composto para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lotes_entidade_clinica
ON public.lotes_avaliacao(entidade_id, clinica_id)
WHERE entidade_id IS NOT NULL OR clinica_id IS NOT NULL;

-- =====================================================
-- STEP 4: Registrar migracao na tabela de migrations
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    dirty BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO schema_migrations (version)
VALUES (1008)
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Mensagem final
SELECT 'Migration 1008b completada com sucesso' as resultado;
