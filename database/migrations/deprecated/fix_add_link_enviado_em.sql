-- Migration: Adicionar coluna link_enviado_em na tabela contratacao_personalizada
-- Data: 23/01/2026
-- Descrição: Garante que a coluna link_enviado_em exista na tabela contratacao_personalizada

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
        ALTER TABLE contratacao_personalizada 
        ADD COLUMN IF NOT EXISTS link_enviado_em TIMESTAMP;

        COMMENT ON COLUMN contratacao_personalizada.link_enviado_em IS 'Timestamp de quando o link de pagamento foi gerado/enviado ao contratante';

        RAISE NOTICE 'Coluna link_enviado_em adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela contratacao_personalizada não existe - nada a fazer';
    END IF;
END $$;

SELECT '✓ Migration fix_add_link_enviado_em.sql aplicada com sucesso' AS status;
