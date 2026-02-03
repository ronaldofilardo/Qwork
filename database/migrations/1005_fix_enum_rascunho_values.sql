-- ====================================================================
-- Migration: 1005 - Adicionar valores 'rascunho' aos ENUMs de status
-- Criado em: 2026-02-02
-- Objetivo: Garantir compatibilidade entre banco local e Neon
-- ====================================================================

BEGIN;

-- Adicionar 'rascunho' ao status_laudo_enum (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'status_laudo_enum'::regtype 
        AND enumlabel = 'rascunho'
    ) THEN
        ALTER TYPE status_laudo_enum ADD VALUE 'rascunho';
    END IF;
END $$;

-- Adicionar 'rascunho' ao status_lote_enum (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'status_lote_enum'::regtype 
        AND enumlabel = 'rascunho'
    ) THEN
        ALTER TYPE status_lote_enum ADD VALUE 'rascunho';
    END IF;
END $$;

COMMIT;
