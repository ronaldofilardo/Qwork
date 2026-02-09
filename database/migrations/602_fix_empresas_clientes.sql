-- Migration: 602_fix_empresas_clientes.sql
-- Descrição: Corrige estrutura de empresas_clientes - remove contratante_id
-- Data: 2026-02-08
-- Depende: 600_create_funcionarios_relationships.sql, 601_migrate_funcionarios_data.sql
-- Razão: Empresas clientes SEMPRE pertencem a clínicas, NUNCA a entidades

-- =============================================================================
-- VALIDAÇÃO PRÉ-ALTERAÇÃO
-- =============================================================================

DO $$
DECLARE
    v_total_empresas INTEGER;
    v_empresas_com_clinica INTEGER;
    v_empresas_com_contratante INTEGER;
    v_empresas_orfas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_empresas FROM empresas_clientes;
    
    SELECT COUNT(*) INTO v_empresas_com_clinica 
    FROM empresas_clientes 
    WHERE clinica_id IS NOT NULL;
    
    SELECT COUNT(*) INTO v_empresas_com_contratante 
    FROM empresas_clientes 
    WHERE contratante_id IS NOT NULL;
    
    SELECT COUNT(*) INTO v_empresas_orfas 
    FROM empresas_clientes 
    WHERE clinica_id IS NULL AND contratante_id IS NULL;
    
    RAISE NOTICE '=== PRÉ-ALTERAÇÃO: ANÁLISE DE empresas_clientes ===';
    RAISE NOTICE 'Total de empresas: %', v_total_empresas;
    RAISE NOTICE 'Empresas com clinica_id: %', v_empresas_com_clinica;
    RAISE NOTICE 'Empresas com contratante_id: %', v_empresas_com_contratante;
    RAISE NOTICE 'Empresas órfãs (sem clinica nem contratante): %', v_empresas_orfas;
    
    IF v_empresas_orfas > 0 THEN
        RAISE EXCEPTION 'Existem % empresas órfãs - impossível prosseguir com segurança', v_empresas_orfas;
    END IF;
    
    IF v_empresas_com_contratante > 0 AND v_empresas_com_clinica = 0 THEN
        RAISE EXCEPTION 'Existem % empresas com contratante_id mas sem clinica_id - dados inconsistentes', v_empresas_com_contratante;
    END IF;
END $$;

-- =============================================================================
-- CORREÇÃO: Empresas com contratante_id precisam ter clinica_id
-- =============================================================================

-- Verificar se há empresas com contratante_id que precisam migrar para clinica_id
DO $$
DECLARE
    v_empresas_com_ambos INTEGER;
    v_empresa RECORD;
BEGIN
    -- Contar empresas que têm AMBOS (violação do XOR constraint)
    SELECT COUNT(*) INTO v_empresas_com_ambos
    FROM empresas_clientes
    WHERE clinica_id IS NOT NULL AND contratante_id IS NOT NULL;
    
    IF v_empresas_com_ambos > 0 THEN
        RAISE NOTICE 'Encontradas % empresas com clinica_id E contratante_id simultaneamente', v_empresas_com_ambos;
        RAISE NOTICE 'Seguindo arquitetura correta: mantendo clinica_id, removendo contratante_id';
    END IF;
    
    -- Log de empresas que serão afetadas pela remoção de contratante_id
    FOR v_empresa IN (
        SELECT 
            id,
            nome,
            clinica_id,
            contratante_id
        FROM empresas_clientes
        WHERE contratante_id IS NOT NULL
        LIMIT 10
    )
    LOOP
        RAISE NOTICE 'Empresa ID=% Nome=% terá contratante_id=% removido (clinica_id=%)',
            v_empresa.id,
            v_empresa.nome,
            v_empresa.contratante_id,
            COALESCE(v_empresa.clinica_id::TEXT, 'NULL');
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 1: Dropar constraint XOR (clinica_id OU contratante_id)
-- =============================================================================

DO $$
BEGIN
    -- Verificar se constraint existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'empresas_clientes_parent_check'
    ) THEN
        ALTER TABLE empresas_clientes 
            DROP CONSTRAINT empresas_clientes_parent_check;
        RAISE NOTICE 'Constraint empresas_clientes_parent_check removida';
    ELSE
        RAISE NOTICE 'Constraint empresas_clientes_parent_check não existe (já removida ou nome diferente)';
    END IF;
END $$;

-- Verificar outras constraints que podem mencionar contratante_id
DO $$
DECLARE
    v_constraint RECORD;
BEGIN
    FOR v_constraint IN (
        SELECT conname 
        FROM pg_constraint pc
        JOIN pg_class pcl ON pc.conrelid = pcl.oid
        WHERE pcl.relname = 'empresas_clientes'
          AND contype = 'c' -- check constraint
          AND pg_get_constraintdef(pc.oid) ILIKE '%contratante_id%'
    )
    LOOP
        EXECUTE format('ALTER TABLE empresas_clientes DROP CONSTRAINT %I', v_constraint.conname);
        RAISE NOTICE 'Constraint % removida', v_constraint.conname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 2: Garantir que todas empresas têm clinica_id antes de torná-lo NOT NULL
-- =============================================================================

-- Se alguma empresa tem contratante_id mas não clinica_id, precisamos tratar isso
-- (Mas pela arquitetura correta, isso NÃO deveria existir)
DO $$
DECLARE
    v_empresas_sem_clinica INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_empresas_sem_clinica
    FROM empresas_clientes
    WHERE clinica_id IS NULL;
    
    IF v_empresas_sem_clinica > 0 THEN
        RAISE EXCEPTION 'Existem % empresas sem clinica_id - dados corrompidos. Arquitetura exige que empresas_clientes sempre pertençam a uma clínica.', v_empresas_sem_clinica;
    END IF;
    
    RAISE NOTICE 'Validação OK: Todas as empresas têm clinica_id';
END $$;

-- =============================================================================
-- PASSO 3: Tornar clinica_id NOT NULL
-- =============================================================================

ALTER TABLE empresas_clientes 
    ALTER COLUMN clinica_id SET NOT NULL;

RAISE NOTICE 'Coluna clinica_id agora é NOT NULL (obrigatória)';

-- =============================================================================
-- PASSO 4: Dropar FK de contratante_id
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'empresas_clientes_contratante_id_fkey'
    ) THEN
        ALTER TABLE empresas_clientes 
            DROP CONSTRAINT empresas_clientes_contratante_id_fkey;
        RAISE NOTICE 'FK empresas_clientes_contratante_id_fkey removida';
    ELSE
        RAISE NOTICE 'FK empresas_clientes_contratante_id_fkey não existe';
    END IF;
END $$;

-- Verificar outras FKs que referenciam contratante_id
DO $$
DECLARE
    v_fk RECORD;
BEGIN
    FOR v_fk IN (
        SELECT conname 
        FROM pg_constraint pc
        JOIN pg_class pcl ON pc.conrelid = pcl.oid
        WHERE pcl.relname = 'empresas_clientes'
          AND contype = 'f' -- foreign key
          AND pg_get_constraintdef(pc.oid) ILIKE '%contratante_id%'
    )
    LOOP
        EXECUTE format('ALTER TABLE empresas_clientes DROP CONSTRAINT %I', v_fk.conname);
        RAISE NOTICE 'FK % removida', v_fk.conname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 5: Remover índices relacionados a contratante_id
-- =============================================================================

DO $$
DECLARE
    v_index RECORD;
BEGIN
    FOR v_index IN (
        SELECT indexname 
        FROM pg_indexes
        WHERE tablename = 'empresas_clientes'
          AND indexdef ILIKE '%contratante_id%'
    )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', v_index.indexname);
        RAISE NOTICE 'Índice % removido', v_index.indexname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 6: Dropar coluna contratante_id
-- =============================================================================

ALTER TABLE empresas_clientes 
    DROP COLUMN IF EXISTS contratante_id;

RAISE NOTICE 'Coluna contratante_id removida de empresas_clientes';

-- =============================================================================
-- PASSO 7: Adicionar comentários explicativos
-- =============================================================================

COMMENT ON TABLE empresas_clientes IS 
'Empresas clientes atendidas por clínicas de medicina ocupacional. 
IMPORTANTE: Empresas SEMPRE pertencem a uma clínica (clinica_id NOT NULL). 
Entidades NÃO têm empresas - têm funcionários diretos via funcionarios_entidades.';

COMMENT ON COLUMN empresas_clientes.clinica_id IS 
'ID da clínica de medicina ocupacional que atende esta empresa (NOT NULL - obrigatório).
Arquitetura segregada: empresas pertencem APENAS a clínicas, NUNCA a entidades.';

-- =============================================================================
-- VALIDAÇÃO PÓS-ALTERAÇÃO
-- =============================================================================

DO $$
DECLARE
    v_total_empresas INTEGER;
    v_empresas_com_clinica INTEGER;
    v_empresas_por_clinica RECORD;
    v_coluna_existe BOOLEAN;
BEGIN
    -- Verificar se contratante_id ainda existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas_clientes' 
          AND column_name = 'contratante_id'
    ) INTO v_coluna_existe;
    
    IF v_coluna_existe THEN
        RAISE EXCEPTION 'ERRO: Coluna contratante_id ainda existe em empresas_clientes';
    END IF;
    
    -- Verificar se clinica_id é NOT NULL
    SELECT COUNT(*) INTO v_total_empresas FROM empresas_clientes;
    SELECT COUNT(*) INTO v_empresas_com_clinica FROM empresas_clientes WHERE clinica_id IS NOT NULL;
    
    IF v_total_empresas != v_empresas_com_clinica THEN
        RAISE EXCEPTION 'ERRO: Existem empresas sem clinica_id (esperado 0)';
    END IF;
    
    RAISE NOTICE '=== PÓS-ALTERAÇÃO: VALIDAÇÃO ===';
    RAISE NOTICE 'Total de empresas: %', v_total_empresas;
    RAISE NOTICE 'Todas têm clinica_id: SIM';
    RAISE NOTICE 'Coluna contratante_id existe: NÃO';
    
    -- Estatísticas por clínica
    RAISE NOTICE '=== EMPRESAS POR CLÍNICA (TOP 5) ===';
    FOR v_empresas_por_clinica IN (
        SELECT 
            c.nome AS clinica_nome,
            COUNT(ec.id) AS total_empresas,
            COUNT(ec.id) FILTER (WHERE ec.ativa = true) AS empresas_ativas
        FROM clinicas c
        LEFT JOIN empresas_clientes ec ON ec.clinica_id = c.id
        GROUP BY c.id, c.nome
        ORDER BY total_empresas DESC
        LIMIT 5
    )
    LOOP
        RAISE NOTICE 'Clínica: % | Empresas: % (ativas: %)',
            v_empresas_por_clinica.clinica_nome,
            v_empresas_por_clinica.total_empresas,
            v_empresas_por_clinica.empresas_ativas;
    END LOOP;
    
    RAISE NOTICE 'Migration 602: Estrutura de empresas_clientes corrigida com sucesso';
END $$;
