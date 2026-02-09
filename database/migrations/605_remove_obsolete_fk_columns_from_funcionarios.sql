-- Migration: 605_remove_obsolete_fk_columns_from_funcionarios.sql
-- Descricao: Remove colunas obsoletas de FKs diretas da tabela funcionarios
-- Data: 2026-02-08
-- Depende: 604_create_relationships_rls_policies.sql
-- CRITICO: Esta migration remove as colunas antigas apos migrar para arquitetura segregada

-- =============================================================================
-- VALIDACAO PRE-REMOCAO
-- =============================================================================

DO $$
DECLARE
    v_total_funcionarios INTEGER;
    v_funcionarios_sem_vinculo INTEGER;
    v_col_exists RECORD;
BEGIN
    -- Contar funcionarios
    SELECT COUNT(*) INTO v_total_funcionarios 
    FROM funcionarios 
    WHERE perfil = 'funcionario';
    
    -- Verificar funcionarios sem vinculo nas tabelas intermediarias
    SELECT COUNT(*) INTO v_funcionarios_sem_vinculo
    FROM funcionarios f
    WHERE f.perfil = 'funcionario'
      AND f.id NOT IN (
          SELECT funcionario_id FROM funcionarios_entidades WHERE ativo = true
          UNION
          SELECT funcionario_id FROM funcionarios_clinicas WHERE ativo = true
      );
    
    RAISE NOTICE 'PRE-REMOCAO: Total de funcionarios: %', v_total_funcionarios;
    RAISE NOTICE 'PRE-REMOCAO: Funcionarios SEM vinculo: %', v_funcionarios_sem_vinculo;
    
    IF v_funcionarios_sem_vinculo > 0 AND v_total_funcionarios > 0 THEN
        RAISE WARNING 'ATENCAO: % funcionarios nao tem vinculo nas tabelas intermediarias', v_funcionarios_sem_vinculo;
        RAISE WARNING 'Isso pode ser esperado se nao havia dados antes da migracao';
    END IF;
    
    -- Listar colunas que serao removidas
    FOR v_col_exists IN (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
          AND column_name IN ('clinica_id', 'empresa_id', 'contratante_id', 'tomador_id', 'entidade_id')
        ORDER BY column_name
    )
    LOOP
        RAISE NOTICE 'Coluna a ser removida: funcionarios.%', v_col_exists.column_name;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 1: Remover constraints que dependem das colunas
-- =============================================================================

-- Dropar constraint de check funcionarios_owner_check (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'funcionarios_owner_check'
    ) THEN
        ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_owner_check;
        RAISE NOTICE 'Constraint funcionarios_owner_check removida';
    END IF;
END $$;

-- Dropar outras constraints que mencionem as colunas obsoletas
DO $$
DECLARE
    v_constraint RECORD;
BEGIN
    FOR v_constraint IN (
        SELECT conname 
        FROM pg_constraint pc
        JOIN pg_class pcl ON pc.conrelid = pcl.oid
        WHERE pcl.relname = 'funcionarios'
          AND contype = 'c'
          AND (
              pg_get_constraintdef(pc.oid) ILIKE '%clinica_id%'
              OR pg_get_constraintdef(pc.oid) ILIKE '%empresa_id%'
              OR pg_get_constraintdef(pc.oid) ILIKE '%contratante_id%'
              OR pg_get_constraintdef(pc.oid) ILIKE '%tomador_id%'
              OR pg_get_constraintdef(pc.oid) ILIKE '%entidade_id%'
          )
    )
    LOOP
        EXECUTE format('ALTER TABLE funcionarios DROP CONSTRAINT %I', v_constraint.conname);
        RAISE NOTICE 'Constraint % removida', v_constraint.conname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 2: Remover Foreign Keys
-- =============================================================================

DO $$
DECLARE
    v_fk RECORD;
BEGIN
    FOR v_fk IN (
        SELECT conname 
        FROM pg_constraint pc
        JOIN pg_class pcl ON pc.conrelid = pcl.oid
        WHERE pcl.relname = 'funcionarios'
          AND contype = 'f'
          AND (
              conname ILIKE '%clinica_id%'
              OR conname ILIKE '%empresa_id%'
              OR conname ILIKE '%contratante_id%'
              OR conname ILIKE '%tomador_id%'
              OR conname ILIKE '%entidade_id%'
          )
    )
    LOOP
        EXECUTE format('ALTER TABLE funcionarios DROP CONSTRAINT %I', v_fk.conname);
        RAISE NOTICE 'FK % removida', v_fk.conname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 3: Remover indices
-- =============================================================================

DO $$
DECLARE
    v_index RECORD;
BEGIN
    FOR v_index IN (
        SELECT indexname 
        FROM pg_indexes
        WHERE tablename = 'funcionarios'
          AND (
              indexdef ILIKE '%clinica_id%'
              OR indexdef ILIKE '%empresa_id%'
              OR indexdef ILIKE '%contratante_id%'
              OR indexdef ILIKE '%tomador_id%'
              OR indexdef ILIKE '%entidade_id%'
          )
    )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', v_index.indexname);
        RAISE NOTICE 'Indice % removido', v_index.indexname;
    END LOOP;
END $$;

-- =============================================================================
-- PASSO 4: Remover as colunas
-- =============================================================================

-- Remover clinica_id
ALTER TABLE funcionarios DROP COLUMN IF EXISTS clinica_id;
RAISE NOTICE 'Coluna funcionarios.clinica_id removida';

-- Remover empresa_id
ALTER TABLE funcionarios DROP COLUMN IF EXISTS empresa_id;
RAISE NOTICE 'Coluna funcionarios.empresa_id removida';

-- Remover contratante_id
ALTER TABLE funcionarios DROP COLUMN IF EXISTS contratante_id;
RAISE NOTICE 'Coluna funcionarios.contratante_id removida';

-- Remover tomador_id (se existir)
ALTER TABLE funcionarios DROP COLUMN IF EXISTS tomador_id;
RAISE NOTICE 'Coluna funcionarios.tomador_id removida (se existia)';

-- Remover entidade_id (se existir)
ALTER TABLE funcionarios DROP COLUMN IF EXISTS entidade_id;
RAISE NOTICE 'Coluna funcionarios.entidade_id removida (se existia)';

-- =============================================================================
-- PASSO 5: Adicionar comentario explicativo na tabela
-- =============================================================================

COMMENT ON TABLE funcionarios IS 
'Funcionarios do sistema (pessoas fisicas avaliadas).
ARQUITETURA SEGREGADA: Relacionamentos com entidades/clinicas sao gerenciados via:
- funcionarios_entidades: para entidades (gestores)
- funcionarios_clinicas: para clinicas (RH) e empresas clientes
IMPORTANTE: Esta tabela NAO tem mais FKs diretas para clinica_id, empresa_id ou entidade_id.';

COMMENT ON COLUMN funcionarios.perfil IS 
'Perfil do usuario: funcionario (pessoa avaliada), rh (clinica), gestor (entidade), emissor, admin';

-- =============================================================================
-- VALIDACAO POS-REMOCAO
-- =============================================================================

DO $$
DECLARE
    v_col_exists BOOLEAN;
    v_cols_removidas TEXT[] := ARRAY['clinica_id', 'empresa_id', 'contratante_id', 'tomador_id', 'entidade_id'];
    v_col TEXT;
    v_total_funcionarios INTEGER;
    v_total_vinculos_entidades INTEGER;
    v_total_vinculos_clinicas INTEGER;
BEGIN
    -- Verificar se as colunas foram removidas
    FOREACH v_col IN ARRAY v_cols_removidas
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'funcionarios' 
              AND column_name = v_col
        ) INTO v_col_exists;
        
        IF v_col_exists THEN
            RAISE EXCEPTION 'ERRO: Coluna funcionarios.% ainda existe', v_col;
        END IF;
    END LOOP;
    
    -- Contar registros
    SELECT COUNT(*) INTO v_total_funcionarios 
    FROM funcionarios 
    WHERE perfil = 'funcionario';
    
    SELECT COUNT(DISTINCT funcionario_id) INTO v_total_vinculos_entidades
    FROM funcionarios_entidades 
    WHERE ativo = true;
    
    SELECT COUNT(DISTINCT funcionario_id) INTO v_total_vinculos_clinicas
    FROM funcionarios_clinicas 
    WHERE ativo = true;
    
    RAISE NOTICE 'POS-REMOCAO: Validacao';
    RAISE NOTICE 'Todas as colunas obsoletas foram removidas: SIM';
    RAISE NOTICE 'Total de funcionarios: %', v_total_funcionarios;
    RAISE NOTICE 'Funcionarios vinculados a entidades: %', v_total_vinculos_entidades;
    RAISE NOTICE 'Funcionarios vinculados a clinicas: %', v_total_vinculos_clinicas;
    
    -- Verificar integridade: todos funcionarios devem ter pelo menos um vinculo
    IF v_total_funcionarios > 0 THEN
        DECLARE
            v_sem_vinculo INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_sem_vinculo
            FROM funcionarios f
            WHERE f.perfil = 'funcionario'
              AND f.id NOT IN (
                  SELECT funcionario_id FROM funcionarios_entidades WHERE ativo = true
                  UNION
                  SELECT funcionario_id FROM funcionarios_clinicas WHERE ativo = true
              );
            
            IF v_sem_vinculo > 0 THEN
                RAISE WARNING 'ATENCAO: % funcionarios sem vinculo nas tabelas intermediarias', v_sem_vinculo;
            ELSE
                RAISE NOTICE 'Integridade OK: Todos os funcionarios tem vinculos';
            END IF;
        END;
    END IF;
    
    RAISE NOTICE 'Migration 605: Colunas obsoletas removidas com sucesso';
    RAISE NOTICE 'Arquitetura segregada implementada completamente';
END $$;
