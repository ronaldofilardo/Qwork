-- Migration 044: Adicionar colunas criado_em e atualizado_em (aliases PT-BR)
-- Data: 26/12/2025
-- Descrição: Alguns trechos do código usam colunas em português (criado_em/atualizado_em).
-- Esta migration adiciona essas colunas como 'aliases' compatíveis para contratacao_personalizada.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
        ALTER TABLE contratacao_personalizada
            ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

        RAISE NOTICE 'Migration 044: colunas criado_em/atualizado_em adicionadas em contratacao_personalizada';
    ELSE
        RAISE NOTICE 'Migration 044: tabela contratacao_personalizada não existe - nada a fazer';
    END IF;
END $$;

-- Criar/atualizar função para setar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_contratacao_personalizada_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger caso não exista
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contratacao_personalizada_atualizado_em') THEN
        CREATE TRIGGER trg_contratacao_personalizada_atualizado_em
        BEFORE UPDATE ON contratacao_personalizada
        FOR EACH ROW
        EXECUTE FUNCTION atualizar_contratacao_personalizada_atualizado_em();
    END IF;
END $$;
