-- Migration 043: Adicionar campos de link de pagamento em contratacao_personalizada
-- Data: 26/12/2025
-- Descrição: Garante que a tabela contratacao_personalizada tenha os campos
-- necessários para o fluxo de pagamento (token e expiração do link)

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
        ALTER TABLE contratacao_personalizada
            ADD COLUMN IF NOT EXISTS payment_link_token VARCHAR(100) UNIQUE,
            ADD COLUMN IF NOT EXISTS payment_link_expiracao TIMESTAMP,
            ADD COLUMN IF NOT EXISTS link_enviado_em TIMESTAMP;

        COMMENT ON COLUMN contratacao_personalizada.payment_link_token IS 'Token único para link de pagamento personalizado';
        COMMENT ON COLUMN contratacao_personalizada.payment_link_expiracao IS 'Data/hora de expiração do link (24-48h após geração)';
        COMMENT ON COLUMN contratacao_personalizada.link_enviado_em IS 'Quando o link foi enviado ao contratante';

        RAISE NOTICE 'Migration 043: Campos de pagamento adicionados em contratacao_personalizada';
    ELSE
        RAISE NOTICE 'Migration 043: tabela contratacao_personalizada não existe - nada a fazer';
    END IF;
END $$;
