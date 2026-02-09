-- =====================================================
-- Migration 1008: Add entidade_id to lotes_avaliacao
-- =====================================================
-- Description: Adiciona coluna entidade_id e migra dados de contratante_id
--              Mantem contratante_id temporariamente para compatibilidade
--              Implementa arquitetura segregada: clinica_id XOR entidade_id
-- Date: 2026-02-09
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Adicionar coluna entidade_id
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lotes_avaliacao' 
        AND column_name = 'entidade_id'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD COLUMN entidade_id INTEGER;
        
        RAISE NOTICE 'Coluna entidade_id adicionada a lotes_avaliacao';
    ELSE
        RAISE NOTICE 'Coluna entidade_id ja existe';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Adicionar Foreign Key para entidades
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_entidade_id_fkey'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD CONSTRAINT lotes_avaliacao_entidade_id_fkey 
        FOREIGN KEY (entidade_id) 
        REFERENCES public.entidades(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key lotes_avaliacao_entidade_id_fkey criada';
    ELSE
        RAISE NOTICE 'Foreign key lotes_avaliacao_entidade_id_fkey ja existe';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Criar índice para performance
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_lotes_entidade_id'
    ) THEN
        CREATE INDEX idx_lotes_entidade_id 
        ON public.lotes_avaliacao(entidade_id) 
        WHERE entidade_id IS NOT NULL;
        
        RAISE NOTICE 'Indice idx_lotes_entidade_id criado';
    ELSE
        RAISE NOTICE 'Indice idx_lotes_entidade_id ja existe';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Migrar dados existentes (contratante_id para entidade_id)
-- =====================================================
DO $$
DECLARE
    rows_migrated INTEGER;
BEGIN
    -- Copiar todos os lotes que têm contratante_id mas não entidade_id
    UPDATE public.lotes_avaliacao 
    SET entidade_id = contratante_id 
    WHERE contratante_id IS NOT NULL 
      AND clinica_id IS NULL
      AND empresa_id IS NULL
      AND entidade_id IS NULL;
    
    GET DIAGNOSTICS rows_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrados % lotes de contratante_id para entidade_id', rows_migrated;
END $$;

-- =====================================================
-- STEP 5: Criar trigger de sincronização temporário
-- =====================================================
CREATE OR REPLACE FUNCTION sync_entidade_contratante_id()
RETURNS TRIGGER AS $$
BEGIN
  -- APENAS para lotes de entidade (não clínica)
  IF NEW.clinica_id IS NULL THEN
    -- Se entidade_id foi definido, copiar para contratante_id (legado)
    IF NEW.entidade_id IS NOT NULL AND NEW.contratante_id IS NULL THEN
      NEW.contratante_id := NEW.entidade_id;
    END IF;
    
    -- Se contratante_id foi definido (código legado), copiar para entidade_id
    IF NEW.contratante_id IS NOT NULL AND NEW.entidade_id IS NULL THEN
      NEW.entidade_id := NEW.contratante_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_sync_entidade_contratante'
    ) THEN
        CREATE TRIGGER trg_sync_entidade_contratante 
        BEFORE INSERT OR UPDATE ON public.lotes_avaliacao 
        FOR EACH ROW EXECUTE FUNCTION sync_entidade_contratante_id();
        
        RAISE NOTICE 'Trigger trg_sync_entidade_contratante criado';
    ELSE
        RAISE NOTICE 'Trigger trg_sync_entidade_contratante já existe';
    END IF;
END $$;

-- =====================================================
-- STEP 6: Atualizar constraint de segregação
-- =====================================================
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_clinica_or_contratante_check'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
        
        RAISE NOTICE 'Constraint antiga lotes_avaliacao_clinica_or_contratante_check removida';
    END IF;
    
    -- Adicionar nova constraint de segregação (arquitetura correta)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lotes_avaliacao_owner_segregation_check'
    ) THEN
        ALTER TABLE public.lotes_avaliacao 
        ADD CONSTRAINT lotes_avaliacao_owner_segregation_check 
        CHECK (
          -- Lote de CLÍNICA: clinica_id + empresa_id, sem entidade_id
          (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL) 
          OR
          -- Lote de ENTIDADE: entidade_id, sem clinica_id/empresa_id
          (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
        );
        
        RAISE NOTICE 'Nova constraint lotes_avaliacao_owner_segregation_check criada';
    ELSE
        RAISE NOTICE 'Constraint lotes_avaliacao_owner_segregation_check já existe';
    END IF;
END $$;

-- =====================================================
-- STEP 7: Validação final
-- =====================================================
DO $$
DECLARE
    total_entidade INTEGER;
    total_clinica INTEGER;
    total_invalidos INTEGER;
BEGIN
    -- Contar lotes de entidade
    SELECT COUNT(*) INTO total_entidade
    FROM public.lotes_avaliacao 
    WHERE entidade_id IS NOT NULL;
    
    -- Contar lotes de clínica
    SELECT COUNT(*) INTO total_clinica
    FROM public.lotes_avaliacao 
    WHERE clinica_id IS NOT NULL;
    
    -- Contar lotes inválidos (violam segregação)
    SELECT COUNT(*) INTO total_invalidos
    FROM public.lotes_avaliacao 
    WHERE (entidade_id IS NOT NULL AND clinica_id IS NOT NULL)
       OR (entidade_id IS NULL AND clinica_id IS NULL);
    
    RAISE NOTICE '=== VALIDAÇÃO DA MIGRAÇÃO ===';
    RAISE NOTICE 'Lotes de ENTIDADE: %', total_entidade;
    RAISE NOTICE 'Lotes de CLÍNICA: %', total_clinica;
    RAISE NOTICE 'Lotes INVÁLIDOS: %', total_invalidos;
    
    IF total_invalidos > 0 THEN
        RAISE WARNING 'Existem % lotes que violam a arquitetura segregada!', total_invalidos;
    ELSE
        RAISE NOTICE 'Todos os lotes respeitam a arquitetura segregada OK';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- Mensagem final
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRACAO 1008 CONCLUIDA COM SUCESSO ===';
    RAISE NOTICE 'Coluna entidade_id adicionada';
    RAISE NOTICE 'Dados migrados de contratante_id';
    RAISE NOTICE 'Trigger de sincronizacao ativo';
    RAISE NOTICE 'Constraint de segregacao atualizada';
    RAISE NOTICE '';
    RAISE NOTICE 'PROXIMOS PASSOS:';
    RAISE NOTICE '1. Atualizar APIs para usar entidade_id';
    RAISE NOTICE '2. Testar dashboard de entidade';
    RAISE NOTICE '3. Apos validacao, remover contratante_id';
END $$;
