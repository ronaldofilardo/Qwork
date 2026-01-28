-- Migration 053: Restaurar colunas de token de pagamento em contratacao_personalizada
-- Data: 2026-01-27
-- Descrição: Em alguns ambientes a coluna `payment_link_token` foi removida (migration 052). Reaplicamos as colunas necessárias para o fluxo de pagamento personalizado.

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
        ALTER TABLE contratacao_personalizada
            ADD COLUMN IF NOT EXISTS payment_link_token VARCHAR(128),
            ADD COLUMN IF NOT EXISTS payment_link_expiracao TIMESTAMP,
            ADD COLUMN IF NOT EXISTS link_enviado_em TIMESTAMP;

        -- Garantir índice para busca por token
        CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_token ON contratacao_personalizada (payment_link_token);

        COMMENT ON COLUMN contratacao_personalizada.payment_link_token IS 'Token único para link de pagamento personalizado';
        COMMENT ON COLUMN contratacao_personalizada.payment_link_expiracao IS 'Data/hora de expiração do link';
        COMMENT ON COLUMN contratacao_personalizada.link_enviado_em IS 'Quando o link foi enviado ao contratante';

        RAISE NOTICE 'Migration 053: Campos de pagamento (restauração) aplicados em contratacao_personalizada';
    ELSE
        RAISE NOTICE 'Migration 053: tabela contratacao_personalizada não existe - nada a fazer';
    END IF;
END $$;