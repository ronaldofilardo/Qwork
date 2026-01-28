-- ==========================================
-- MIGRATION 007: Campos de Inativacao de Avaliacoes
-- Descricao: Adiciona campos para registrar motivo e timestamp da inativacao
-- Data: 2025-12-16
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR COLUNAS DE INATIVACAO
-- ==========================================

-- Adicionar coluna para timestamp da inativacao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avaliacoes' AND column_name = 'inativada_em') THEN
        ALTER TABLE avaliacoes ADD COLUMN inativada_em TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Adicionar coluna para motivo da inativacao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avaliacoes' AND column_name = 'motivo_inativacao') THEN
        ALTER TABLE avaliacoes ADD COLUMN motivo_inativacao TEXT;
    END IF;
END $$;

-- ==========================================
-- 2. ADICIONAR INDICES PARA PERFORMANCE
-- ==========================================

-- Indice para consultas por status de inativacao
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'avaliacoes' AND indexname = 'idx_avaliacoes_inativada_em') THEN
        CREATE INDEX idx_avaliacoes_inativada_em ON avaliacoes (inativada_em) WHERE inativada_em IS NOT NULL;
    END IF;
END $$;

-- ==========================================
-- 3. ADICIONAR COMENTARIOS
-- ==========================================

COMMENT ON COLUMN avaliacoes.inativada_em IS 'Timestamp quando a avaliacao foi inativada pelo RH';

COMMENT ON COLUMN avaliacoes.motivo_inativacao IS 'Motivo informado pelo RH para inativacao da avaliacao';

COMMIT;