-- ============================================================================
-- FIX: Adicionar Colunas Faltantes Pós-Reset
-- Data: 2026-01-22
-- Descrição: Adiciona colunas que faltam após reset do banco
-- ============================================================================

BEGIN;

-- 1. Adicionar data_primeiro_pagamento em tomadores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'data_primeiro_pagamento'
    ) THEN
        ALTER TABLE tomadores 
        ADD COLUMN data_primeiro_pagamento TIMESTAMP;
        
        COMMENT ON COLUMN tomadores.data_primeiro_pagamento 
        IS 'Data do primeiro pagamento confirmado do contratante';
        
        RAISE NOTICE 'Coluna data_primeiro_pagamento adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna data_primeiro_pagamento já existe em tomadores';
    END IF;
END $$;

-- 2. Adicionar contratante_id em empresas_clientes (para fluxo de entidades)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas_clientes' 
        AND column_name = 'contratante_id'
    ) THEN
        ALTER TABLE empresas_clientes 
        ADD COLUMN contratante_id INTEGER REFERENCES tomadores(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_empresas_contratante 
        ON empresas_clientes(contratante_id);
        
        COMMENT ON COLUMN empresas_clientes.contratante_id 
        IS 'FK para tomadores - usado no fluxo de entidades (opcional, mutuamente exclusivo com clinica_id)';
        
        RAISE NOTICE 'Coluna contratante_id adicionada em empresas_clientes';
    ELSE
        RAISE NOTICE 'Coluna contratante_id já existe em empresas_clientes';
    END IF;
END $$;

-- 3. Permitir clinica_id NULL em empresas_clientes (para suportar fluxo de entidades)
DO $$
BEGIN
    -- Verificar se clinica_id tem NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas_clientes' 
        AND column_name = 'clinica_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE empresas_clientes 
        ALTER COLUMN clinica_id DROP NOT NULL;
        
        RAISE NOTICE 'Coluna clinica_id agora permite NULL em empresas_clientes';
    ELSE
        RAISE NOTICE 'Coluna clinica_id já permite NULL';
    END IF;
END $$;

-- 4. Adicionar constraint para garantir que empresas tenham clinica_id OU contratante_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'empresas_clientes_parent_check'
    ) THEN
        ALTER TABLE empresas_clientes
        ADD CONSTRAINT empresas_clientes_parent_check
        CHECK (
            (clinica_id IS NOT NULL AND contratante_id IS NULL) OR
            (clinica_id IS NULL AND contratante_id IS NOT NULL)
        );
        
        RAISE NOTICE 'Constraint empresas_clientes_parent_check criada';
    ELSE
        RAISE NOTICE 'Constraint empresas_clientes_parent_check já existe';
    END IF;
END $$;

-- 5. Adicionar índices compostos para performance
CREATE INDEX IF NOT EXISTS idx_empresas_tipo_parent 
ON empresas_clientes(clinica_id, contratante_id);

COMMENT ON INDEX idx_empresas_tipo_parent 
IS 'Índice para consultas por tipo de parent (clínica ou entidade)';

COMMIT;

-- Relatório
DO $$
BEGIN
    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'CORREÇÕES APLICADAS COM SUCESSO';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'Coluna data_primeiro_pagamento: OK';
    RAISE NOTICE 'Coluna contratante_id em empresas_clientes: OK';
    RAISE NOTICE 'Constraint para dual parent: OK';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'Sistema agora suporta DOIS FLUXOS:';
    RAISE NOTICE '1. ENTIDADES: contratante → empresas → funcionários → lotes';
    RAISE NOTICE '2. CLÍNICAS: contratante → clínica → empresas → funcionários → lotes';
    RAISE NOTICE '========================================================================';
END $$;
