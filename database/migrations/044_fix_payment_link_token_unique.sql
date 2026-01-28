-- Migration 044: Garantir unicidade de payment_link_token
-- Data: 26/12/2025
-- Descricao: Adiciona indice unico em payment_link_token e limpa tokens duplicados

DO $$
BEGIN
    -- Limpar tokens duplicados (manter o mais recente)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
        -- Deletar duplicatas mantendo o registro mais recente
        DELETE FROM contratacao_personalizada
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM contratacao_personalizada
            WHERE payment_link_token IS NOT NULL
            GROUP BY payment_link_token
        ) AND payment_link_token IS NOT NULL;

        -- Criar indice unico se nao existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'contratacao_personalizada'
            AND indexname = 'idx_contratacao_personalizada_token_unique'
        ) THEN
            CREATE UNIQUE INDEX idx_contratacao_personalizada_token_unique
            ON contratacao_personalizada(payment_link_token)
            WHERE payment_link_token IS NOT NULL;

            RAISE NOTICE 'Migration 044: Indice unico criado em payment_link_token';
        ELSE
            RAISE NOTICE 'Migration 044: Indice unico ja existe';
        END IF;
    ELSE
        RAISE NOTICE 'Migration 044: Tabela contratacao_personalizada nao existe';
    END IF;
END $$;
