-- ====================================================================
-- Script de Correção de ENUMs - Adicionar valores faltantes no Neon
-- Criado em: 2026-02-02
-- Objetivo: Garantir que todos os valores de ENUM do local existam no Neon
-- ====================================================================

BEGIN;

-- ====================================================================
-- 1. Adicionar valor 'rascunho' ao status_laudo_enum (se não existir)
-- ====================================================================
DO $$
BEGIN
    -- Verificar se o valor já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'status_laudo_enum'::regtype 
        AND enumlabel = 'rascunho'
    ) THEN
        -- Adicionar o valor
        ALTER TYPE status_laudo_enum ADD VALUE 'rascunho';
        RAISE NOTICE 'Valor "rascunho" adicionado ao status_laudo_enum';
    ELSE
        RAISE NOTICE 'Valor "rascunho" já existe no status_laudo_enum';
    END IF;
END $$;

-- ====================================================================
-- 2. Adicionar valor 'rascunho' ao status_lote_enum (se não existir)
-- ====================================================================
DO $$
BEGIN
    -- Verificar se o valor já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'status_lote_enum'::regtype 
        AND enumlabel = 'rascunho'
    ) THEN
        -- Adicionar o valor
        ALTER TYPE status_lote_enum ADD VALUE 'rascunho';
        RAISE NOTICE 'Valor "rascunho" adicionado ao status_lote_enum';
    ELSE
        RAISE NOTICE 'Valor "rascunho" já existe no status_lote_enum';
    END IF;
END $$;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================
DO $$
DECLARE
    v_status_laudo_values TEXT;
    v_status_lote_values TEXT;
BEGIN
    -- Verificar valores de status_laudo_enum
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO v_status_laudo_values
    FROM pg_enum
    WHERE enumtypid = 'status_laudo_enum'::regtype;
    
    -- Verificar valores de status_lote_enum  
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO v_status_lote_values
    FROM pg_enum
    WHERE enumtypid = 'status_lote_enum'::regtype;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL DE ENUMS:';
    RAISE NOTICE '  - status_laudo_enum: %', v_status_laudo_values;
    RAISE NOTICE '  - status_lote_enum: %', v_status_lote_values;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================
