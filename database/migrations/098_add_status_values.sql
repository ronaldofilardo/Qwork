-- Migration: Adicionar valores de status faltantes no enum status_aprovacao_enum
-- Data: 2026-01-23
-- Descrição: Adiciona valores usados pela máquina de estado que não existiam no ENUM

DO $$
BEGIN
    -- Adicionar 'aguardando_contrato' se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum' AND e.enumlabel = 'aguardando_contrato') THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_contrato';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum' AND e.enumlabel = 'contrato_gerado') THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'contrato_gerado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum' AND e.enumlabel = 'pagamento_confirmado') THEN
        ALTER TYPE status_aprovacao_enum ADD VALUE 'pagamento_confirmado';
    END IF;
END$$;

-- Verificar valores (casting correto)
SELECT enumlabel::text FROM pg_enum WHERE enumtypid = 'status_aprovacao_enum'::regtype;
