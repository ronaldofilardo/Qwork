-- Migration 084: Ajustes de colunas para contratantes e contratos
-- Data: 2026-01-24

BEGIN;

-- 1. Garantir que contratantes.status usa enum status_aprovacao_enum
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='contratantes' AND column_name='status') IS NOT NULL THEN
        -- Se a coluna existe e não é do tipo enum, tentar converter
        PERFORM 1 FROM pg_type WHERE typname = 'status_aprovacao_enum';
        IF FOUND THEN
            BEGIN
                ALTER TABLE contratantes ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;
                RAISE NOTICE 'Coluna contratantes.status convertida para status_aprovacao_enum';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Falha ao converter contratantes.status para enum (ignorar se já for enum): %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- 2. Garantir que contratos.status usa enum status_aprovacao_enum
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='contratos' AND column_name='status') IS NOT NULL THEN
        PERFORM 1 FROM pg_type WHERE typname = 'status_aprovacao_enum';
        IF FOUND THEN
            BEGIN
                ALTER TABLE contratos ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;
                RAISE NOTICE 'Coluna contratos.status convertida para status_aprovacao_enum';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Falha ao converter contratos.status para enum (ignorar se já for enum): %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- 3. Adicionar responsavel_email em empresas_clientes (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='empresas_clientes' AND column_name='responsavel_email'
    ) THEN
        ALTER TABLE empresas_clientes ADD COLUMN responsavel_email TEXT;
        COMMENT ON COLUMN empresas_clientes.responsavel_email IS 'Email do responsável pela empresa';
        RAISE NOTICE 'Coluna responsavel_email adicionada em empresas_clientes';
    ELSE
        RAISE NOTICE 'Coluna responsavel_email já existe em empresas_clientes';
    END IF;
END $$;

-- 4. Adicionar motivo_rejeicao em contratantes (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='contratantes' AND column_name='motivo_rejeicao'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN motivo_rejeicao TEXT;
        COMMENT ON COLUMN contratantes.motivo_rejeicao IS 'Motivo de rejeição do contratante (fluxo de aprovação)';
        RAISE NOTICE 'Coluna motivo_rejeicao adicionada em contratantes';
    ELSE
        RAISE NOTICE 'Coluna motivo_rejeicao já existe em contratantes';
    END IF;
END $$;

-- 5. Adicionar payment_link_token em contratos (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='contratos' AND column_name='payment_link_token'
    ) THEN
        ALTER TABLE contratos ADD COLUMN payment_link_token VARCHAR(128);
        CREATE UNIQUE INDEX IF NOT EXISTS ux_contratos_payment_link_token ON contratos (payment_link_token) WHERE payment_link_token IS NOT NULL;
        COMMENT ON COLUMN contratos.payment_link_token IS 'Token para link de pagamento (uso único)';
        RAISE NOTICE 'Coluna payment_link_token adicionada em contratos';
    ELSE
        RAISE NOTICE 'Coluna payment_link_token já existe em contratos';
    END IF;
END $$;

COMMIT;
