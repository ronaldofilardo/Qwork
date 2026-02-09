-- Migration 400: Adicionar status aguardando_aceite ao enum status_aprovacao_enum
-- Data: 2026-02-07
-- Descrição: Adiciona os status intermediários para fluxo de aceite de contrato

DO $$
BEGIN
    -- Adicionar 'aguardando_aceite' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_aprovacao_enum' 
        AND e.enumlabel = 'aguardando_aceite'
    ) THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_aceite';
        RAISE NOTICE 'Valor aguardando_aceite adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor aguardando_aceite já existe no enum status_aprovacao_enum';
    END IF;

    -- Adicionar 'aguardando_aceite_contrato' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_aprovacao_enum' 
        AND e.enumlabel = 'aguardando_aceite_contrato'
    ) THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_aceite_contrato';
        RAISE NOTICE 'Valor aguardando_aceite_contrato adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor aguardando_aceite_contrato já existe no enum status_aprovacao_enum';
    END IF;

    -- Adicionar 'ativo' se não existir (para status de entidades/clínicas ativas)
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_aprovacao_enum' 
        AND e.enumlabel = 'ativo'
    ) THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'ativo';
        RAISE NOTICE 'Valor ativo adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor ativo já existe no enum status_aprovacao_enum';
    END IF;

    -- Adicionar 'inativo' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_aprovacao_enum' 
        AND e.enumlabel = 'inativo' 
        AND e.enumlabel != 'inativa'  -- Evitar conflitos com 'inativa'
    ) THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'inativo';
        RAISE NOTICE 'Valor inativo adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor inativo já existe no enum status_aprovacao_enum';
    END IF;

    -- Adicionar 'cancelado' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_aprovacao_enum' 
        AND e.enumlabel = 'cancelado'
    ) THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'cancelado';
        RAISE NOTICE 'Valor cancelado adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor cancelado já existe no enum status_aprovacao_enum';
    END IF;

END$$;

-- Verificar valores atuais do enum
SELECT 'Valores atuais do enum status_aprovacao_enum:' AS status;
SELECT enumlabel::text FROM pg_enum 
WHERE enumtypid = 'status_aprovacao_enum'::regtype
ORDER BY enumsortorder;
