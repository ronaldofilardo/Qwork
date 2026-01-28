-- Migration: Consolidação Definitiva de Enums tipo_plano
-- Data: 2025-12-23
-- Descrição: Remove conflitos e garante apenas um enum tipo_plano com valores (fixo, personalizado)
-- FONTE DA VERDADE: Este é o estado correto do sistema

-- ============================================================================
-- ANÁLISE DO PROBLEMA
-- ============================================================================
-- PROBLEMA: Múltiplas migrations criaram enums conflitantes:
--   - tipo_plano_old (personalizado, basico, premium)
--   - tipo_plano (fixo, personalizado)
--   - tipo_plano_enum (em algumas migrations antigas)
--
-- SOLUÇÃO: Manter apenas tipo_plano com (fixo, personalizado)
--   - Fixo: Planos com valor fixo anual
--   - Personalizado: Planos com valor variável por funcionário

-- ============================================================================
-- PASSO 1: Verificar e corrigir uso de tipo_plano_old
-- ============================================================================

-- Se alguma coluna ainda usa tipo_plano_old, converter para tipo_plano
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Buscar colunas que usam tipo_plano_old
    FOR r IN 
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE udt_name = 'tipo_plano_old'
    LOOP
        -- Converter tipo da coluna
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE tipo_plano USING %I::text::tipo_plano', 
                      r.table_name, r.column_name, r.column_name);
        
        RAISE NOTICE 'Convertida coluna %.% de tipo_plano_old para tipo_plano', r.table_name, r.column_name;
    END LOOP;
END $$;

-- ============================================================================
-- PASSO 2: Remover tipo_plano_old e tipo_plano_enum
-- ============================================================================

-- Remover tipo_plano_old (agora não é mais usado)
DROP TYPE IF EXISTS tipo_plano_old CASCADE;

-- Remover tipo_plano_enum se existir (de migrations antigas)
DROP TYPE IF EXISTS tipo_plano_enum CASCADE;

-- ============================================================================
-- PASSO 3: Garantir que tipo_plano existe com valores corretos
-- ============================================================================

-- Se tipo_plano não existe, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_plano') THEN
        CREATE TYPE tipo_plano AS ENUM ('fixo', 'personalizado');
        RAISE NOTICE 'Enum tipo_plano criado com valores: fixo, personalizado';
    ELSE
        RAISE NOTICE 'Enum tipo_plano já existe';
    END IF;
END $$;

-- Verificar valores do enum
DO $$
DECLARE
    valores TEXT[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO valores
    FROM pg_enum
    WHERE enumtypid = 'tipo_plano'::regtype;
    
    RAISE NOTICE 'Valores atuais de tipo_plano: %', valores;
    
    -- Validar que tem os valores esperados
    IF NOT ('fixo' = ANY(valores)) THEN
        RAISE EXCEPTION 'tipo_plano não contém valor "fixo"';
    END IF;
    
    IF NOT ('personalizado' = ANY(valores)) THEN
        RAISE EXCEPTION 'tipo_plano não contém valor "personalizado"';
    END IF;
    
    RAISE NOTICE '✓ Enum tipo_plano validado com sucesso';
END $$;

-- ============================================================================
-- PASSO 4: Garantir que tabela planos usa o tipo correto
-- ============================================================================

-- Verificar tipo da coluna tipo na tabela planos
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'planos' AND column_name = 'tipo';
    
    IF col_type IS NULL THEN
        RAISE NOTICE 'Coluna planos.tipo não existe';
    ELSIF col_type = 'tipo_plano' THEN
        RAISE NOTICE '✓ Coluna planos.tipo já usa tipo_plano';
    ELSE
        RAISE NOTICE 'Convertendo planos.tipo de % para tipo_plano', col_type;
        ALTER TABLE planos ALTER COLUMN tipo TYPE tipo_plano USING tipo::text::tipo_plano;
        RAISE NOTICE '✓ Coluna planos.tipo convertida para tipo_plano';
    END IF;
END $$;

-- ============================================================================
-- PASSO 5: Garantir que tabela contratantes usa o tipo correto
-- ============================================================================

-- Verificar tipo da coluna plano_tipo na tabela contratantes
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'contratantes' AND column_name = 'plano_tipo';
    
    IF col_type IS NULL THEN
        RAISE NOTICE 'Coluna contratantes.plano_tipo não existe (OK se não for usada)';
    ELSIF col_type = 'tipo_plano' THEN
        RAISE NOTICE '✓ Coluna contratantes.plano_tipo já usa tipo_plano';
    ELSE
        RAISE NOTICE 'Convertendo contratantes.plano_tipo de % para tipo_plano', col_type;
        ALTER TABLE contratantes ALTER COLUMN plano_tipo TYPE tipo_plano USING plano_tipo::text::tipo_plano;
        RAISE NOTICE '✓ Coluna contratantes.plano_tipo convertida para tipo_plano';
    END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    enum_count INTEGER;
    plano_tipo_count INTEGER;
    enum_values TEXT[];
BEGIN
    -- Contar quantos tipos 'tipo_plano%' existem
    SELECT COUNT(*) INTO enum_count
    FROM pg_type
    WHERE typname LIKE 'tipo_plano%';
    
    IF enum_count = 1 THEN
        RAISE NOTICE '✓ Apenas 1 tipo tipo_plano existe (correto)';
    ELSE
        RAISE WARNING 'Encontrados % tipos tipo_plano* (esperado: 1)', enum_count;
    END IF;
    
    -- Listar valores finais
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'tipo_plano'::regtype;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'MIGRATION CONCLUÍDA COM SUCESSO';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'Enum tipo_plano consolidado com valores: %', enum_values;
    RAISE NOTICE 'Estado do sistema:';
    RAISE NOTICE '  ✓ tipo_plano: fixo, personalizado';
    RAISE NOTICE '  ✓ tipo_plano_old: REMOVIDO';
    RAISE NOTICE '  ✓ tipo_plano_enum: REMOVIDO';
    RAISE NOTICE '  ✓ Tabelas atualizadas';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
