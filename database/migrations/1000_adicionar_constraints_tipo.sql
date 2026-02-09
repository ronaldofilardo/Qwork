-- Migration 1000: Adicionar constraints de validação para tipo_contratante
-- Data: 30 de Janeiro de 2026
-- Autor: GitHub Copilot
-- Descrição: Garantir integridade referencial para campos tipo/tipo_contratante

-- ============================================================================
-- PARTE 1: Validação de tipo em tomadores
-- ============================================================================

-- Adicionar constraint para validar valores permitidos
DO $$ 
BEGIN
    -- Verificar se constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_tomadores_tipo_valido'
    ) THEN
        ALTER TABLE tomadores 
            ADD CONSTRAINT chk_tomadores_tipo_valido 
            CHECK (tipo IN ('clinica', 'entidade'));
        
        RAISE NOTICE '[OK] Constraint chk_tomadores_tipo_valido criada';
    ELSE
        RAISE NOTICE '[SKIP] Constraint chk_tomadores_tipo_valido já existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: Validação de tipo_contratante em contratos_planos
-- ============================================================================

-- Verificar se tabela contratos_planos existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contratos_planos'
    ) THEN
        -- Verificar se coluna tipo_contratante existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contratos_planos' 
            AND column_name = 'tipo_contratante'
        ) THEN
            -- Adicionar constraint se não existe
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'chk_contratos_planos_tipo_contratante_valido'
            ) THEN
                ALTER TABLE contratos_planos 
                    ADD CONSTRAINT chk_contratos_planos_tipo_contratante_valido 
                    CHECK (tipo_contratante IN ('clinica', 'entidade'));
                
                RAISE NOTICE '[OK] Constraint chk_contratos_planos_tipo_contratante_valido criada';
            ELSE
                RAISE NOTICE '[SKIP] Constraint chk_contratos_planos_tipo_contratante_valido já existe';
            END IF;
        ELSE
            RAISE NOTICE '[SKIP] Coluna tipo_contratante não existe em contratos_planos';
        END IF;
    ELSE
        RAISE NOTICE '[SKIP] Tabela contratos_planos não existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 3: Verificar dados existentes
-- ============================================================================

-- Verificar se há valores inválidos em tomadores
DO $$ 
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM tomadores
    WHERE tipo NOT IN ('clinica', 'entidade');
    
    IF v_invalid_count > 0 THEN
        RAISE WARNING '[AVISO] Encontrados % registros com tipo inválido em tomadores', v_invalid_count;
        RAISE WARNING 'Execute: SELECT id, nome, tipo FROM tomadores WHERE tipo NOT IN (''clinica'', ''entidade'')';
    ELSE
        RAISE NOTICE '[OK] Todos os registros em tomadores têm tipo válido';
    END IF;
END $$;

-- Verificar se há valores inválidos em contratos_planos (se existir)
DO $$ 
DECLARE
    v_invalid_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contratos_planos'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_planos' 
        AND column_name = 'tipo_contratante'
    ) THEN
        EXECUTE 'SELECT COUNT(*) FROM contratos_planos WHERE tipo_contratante NOT IN (''clinica'', ''entidade'')' 
        INTO v_invalid_count;
        
        IF v_invalid_count > 0 THEN
            RAISE WARNING '[AVISO] Encontrados % registros com tipo_contratante inválido', v_invalid_count;
        ELSE
            RAISE NOTICE '[OK] Todos os registros em contratos_planos têm tipo_contratante válido';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Criar índices para melhorar performance
-- ============================================================================

-- Índice para consultas por tipo
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_tomadores_tipo'
    ) THEN
        CREATE INDEX idx_tomadores_tipo ON tomadores(tipo);
        RAISE NOTICE '[OK] Índice idx_tomadores_tipo criado';
    ELSE
        RAISE NOTICE '[SKIP] Índice idx_tomadores_tipo já existe';
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: Relatório Final
-- ============================================================================

\echo ''
\echo '==============================================================================='
\echo 'MIGRATION 1000: CONSTRAINTS DE VALIDAÇÃO - CONCLUÍDA'
\echo '==============================================================================='
\echo ''
\echo 'Constraints criadas:'
\echo '  - chk_tomadores_tipo_valido'
\echo '  - chk_contratos_planos_tipo_contratante_valido (se tabela existir)'
\echo ''
\echo 'Índices criados:'
\echo '  - idx_tomadores_tipo'
\echo ''
\echo 'Valores permitidos: ''clinica'', ''entidade'''
\echo ''
\echo 'Próximos passos:'
\echo '  1. Verificar dados inválidos (se houver warnings acima)'
\echo '  2. Corrigir registros inválidos antes de aplicar em produção'
\echo '  3. Testar inserções/atualizações com valores inválidos (devem falhar)'
\echo ''
\echo '==============================================================================='
