-- Migrations para correção de fluxo entidade/clinica
-- Executar manualmente: psql -U postgres -d nr-bps_db_test -h localhost -f database/migrations/_execute_all_fixes.sql

-- Migration 400: Adicionar status aguardando_aceite ao enum status_aprovacao_enum
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
        AND e.enumlabel != 'inativa'
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

-- Migration 401: Adicionar rastreamento de tipo_tomador em contratos
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS tipo_tomador VARCHAR(50) DEFAULT 'entidade';

CREATE INDEX IF NOT EXISTS idx_contratos_tipo_tomador ON contratos(tipo_tomador);

COMMENT ON COLUMN contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica - usado para buscar na tabela correta';

-- Validação
SELECT '✓ Todas as migrations executadas com sucesso!' AS status;
SELECT COUNT(*) as total_contratos_com_tipo FROM contratos WHERE tipo_tomador IS NOT NULL;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'status_aprovacao_enum'::regtype ORDER BY enumsortorder;
