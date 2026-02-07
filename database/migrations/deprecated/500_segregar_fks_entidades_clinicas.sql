-- ====================================================================
-- Migration 500: Segregação de Foreign Keys - Entidades vs Clínicas
-- Data: 2026-02-06
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO:
--   Implementar arquitetura segregada de foreign keys:
--   - Tabelas que servem ENTIDADES: adicionar entidade_id
--   - Tabelas que servem CLÍNICAS: adicionar clinica_id  
--   - Tabelas que servem AMBOS: adicionar entidade_id E clinica_id
--   - Remover todas as referências a contratante_id (legacy)
--
-- CONTEXTO:
--   - NÃO há migração de dados (banco vazio)
--   - Identificação de tipo é feita no cadastro
--   - Empresa é cliente de clínica (≠ entidade)
--   - Esta migração é COMPLETA (inclui Fase 3)
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 500: SEGREGAÇÃO FKs ENTIDADES/CLÍNICAS'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- PARTE 1: REMOVER contratante_id de clinicas
-- ====================================================================

\echo ''
\echo 'PARTE 1: Removendo contratante_id de clinicas...'

DO $$
BEGIN
  -- Drop FK constraint se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clinicas_contratante_id_fkey'
    AND table_name = 'clinicas'
  ) THEN
    ALTER TABLE clinicas DROP CONSTRAINT clinicas_contratante_id_fkey;
    RAISE NOTICE '✓ FK clinicas_contratante_id_fkey removida';
  END IF;

  -- Drop coluna contratante_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinicas' 
    AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE clinicas DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna clinicas.contratante_id removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 1.5: DROPAR POLICIES QUE DEPENDEM DE contratante_id
-- ====================================================================

\echo ''
\echo 'PARTE 1.5: Dropando RLS policies que dependem de contratante_id...'

DO $$
BEGIN
  -- Dropar policies de lotes_avaliacao
  DROP POLICY IF EXISTS lotes_entidade_select ON lotes_avaliacao;
  DROP POLICY IF EXISTS lotes_entidade_insert ON lotes_avaliacao;
  DROP POLICY IF EXISTS lotes_entidade_update ON lotes_avaliacao;
  DROP POLICY IF EXISTS policy_lotes_entidade ON lotes_avaliacao;
  RAISE NOTICE '✓ Policies de lotes_avaliacao dropadas';

  -- Dropar policies de laudos que dependem de lotes_avaliacao.contratante_id
  DROP POLICY IF EXISTS laudos_entidade_select ON laudos;
  DROP POLICY IF EXISTS policy_laudos_entidade ON laudos;
  RAISE NOTICE '✓ Policies de laudos dropadas';

  -- Dropar policies de avaliacao_resets se existir
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'avaliacao_resets') THEN
    DROP POLICY IF EXISTS avaliacao_resets_select_policy ON avaliacao_resets;
    RAISE NOTICE '✓ Policies de avaliacao_resets dropadas';
  END IF;

  -- Dropar policies de funcionarios
  DROP POLICY IF EXISTS funcionarios_entidade_select ON funcionarios;
  DROP POLICY IF EXISTS funcionarios_entidade_insert ON funcionarios;
  DROP POLICY IF EXISTS funcionarios_entidade_update ON funcionarios;
  RAISE NOTICE '✓ Policies de funcionarios dropadas';

  -- Dropar policies de avaliacoes
  DROP POLICY IF EXISTS avaliacoes_entidade_select ON avaliacoes;
  RAISE NOTICE '✓ Policies de avaliacoes dropadas';

  -- Dropar policies de contratos
  DROP POLICY IF EXISTS contratos_entidade_select ON contratos;
  DROP POLICY IF EXISTS contratos_entidade_insert ON contratos;
  DROP POLICY IF EXISTS contratos_entidade_update ON contratos;
  RAISE NOTICE '✓ Policies de contratos dropadas';

  -- Dropar policies de pagamentos
  DROP POLICY IF EXISTS pagamentos_entidade_select ON pagamentos;
  DROP POLICY IF EXISTS pagamentos_entidade_insert ON pagamentos;
  DROP POLICY IF EXISTS pagamentos_entidade_update ON pagamentos;
  RAISE NOTICE '✓ Policies de pagamentos dropadas';

  RAISE NOTICE '✓ Todas as policies dependentes de contratante_id foram dropadas';
END $$;

-- ====================================================================
-- PARTE 2: ATUALIZAR lotes_avaliacao (tem contratante_id + clinica_id)
-- ====================================================================

\echo ''
\echo 'PARTE 2: Atualizando lotes_avaliacao...'

DO $$
BEGIN
  -- Adicionar entidade_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'entidade_id'
  ) THEN
    ALTER TABLE lotes_avaliacao ADD COLUMN entidade_id INTEGER;
    RAISE NOTICE '✓ Coluna lotes_avaliacao.entidade_id adicionada';
  END IF;

  -- Drop FK constraint contratante_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_contratante_id_fkey'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_contratante_id_fkey;
    RAISE NOTICE '✓ FK lotes_avaliacao_contratante_id_fkey removida';
  END IF;

  -- Drop check constraint legacy se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_clinica_or_contratante_check'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
    RAISE NOTICE '✓ Check constraint legacy removida';
  END IF;

  -- Drop coluna contratante_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE lotes_avaliacao DROP COLUMN contratante_id CASCADE;
    RAISE NOTICE '✓ Coluna lotes_avaliacao.contratante_id removida';
  END IF;

  -- Criar FK para entidade_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_entidade_id_fkey'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao 
      ADD CONSTRAINT lotes_avaliacao_entidade_id_fkey 
      FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ FK lotes_avaliacao_entidade_id_fkey criada';
  END IF;

  -- Criar novo check constraint: clinica_id XOR entidade_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lotes_avaliacao_clinica_or_entidade_check'
    AND table_name = 'lotes_avaliacao'
  ) THEN
    ALTER TABLE lotes_avaliacao 
      ADD CONSTRAINT lotes_avaliacao_clinica_or_entidade_check 
      CHECK (
        (clinica_id IS NOT NULL AND entidade_id IS NULL) OR
        (clinica_id IS NULL AND entidade_id IS NOT NULL)
      );
    RAISE NOTICE '✓ Check constraint lotes_avaliacao_clinica_or_entidade_check criada';
  END IF;

  -- Criar index para performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_lotes_avaliacao_entidade_id'
  ) THEN
    CREATE INDEX idx_lotes_avaliacao_entidade_id ON lotes_avaliacao(entidade_id);
    RAISE NOTICE '✓ Index idx_lotes_avaliacao_entidade_id criado';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: ATUALIZAR funcionarios
-- ====================================================================

\echo ''
\echo 'PARTE 3: Atualizando funcionarios...'

DO $$
BEGIN
  -- Adicionar entidade_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios' 
    AND column_name = 'entidade_id'
  ) THEN
    ALTER TABLE funcionarios ADD COLUMN entidade_id INTEGER;
    RAISE NOTICE '✓ Coluna funcionarios.entidade_id adicionada';
  END IF;

  -- Drop FK constraint contratante_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_contratante_id_fkey'
    AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_contratante_id_fkey;
    RAISE NOTICE '✓ FK funcionarios_contratante_id_fkey removida';
  END IF;

  -- Drop coluna contratante_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'funcionarios' 
    AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE funcionarios DROP COLUMN contratante_id CASCADE;
    RAISE NOTICE '✓ Coluna funcionarios.contratante_id removida';
  END IF;

  -- Criar FK para entidade_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_entidade_id_fkey'
    AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios 
      ADD CONSTRAINT funcionarios_entidade_id_fkey 
      FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
    RAISE NOTICE '✓ FK funcionarios_entidade_id_fkey criada';
  END IF;

  -- Criar index para performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_funcionarios_entidade_id'
  ) THEN
    CREATE INDEX idx_funcionarios_entidade_id ON funcionarios(entidade_id);
    RAISE NOTICE '✓ Index idx_funcionarios_entidade_id criado';
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: ATUALIZAR contratacao_personalizada
-- ====================================================================

\echo ''
\echo 'PARTE 4: Atualizando contratacao_personalizada...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratacao_personalizada' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE contratacao_personalizada ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna contratacao_personalizada.entidade_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratacao_personalizada_contratante_id_fkey'
      AND table_name = 'contratacao_personalizada'
    ) THEN
      ALTER TABLE contratacao_personalizada DROP CONSTRAINT contratacao_personalizada_contratante_id_fkey;
      RAISE NOTICE '✓ FK contratacao_personalizada_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratacao_personalizada' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE contratacao_personalizada DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna contratacao_personalizada.contratante_id removida';
    END IF;

    -- Criar FK para entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratacao_personalizada_entidade_id_fkey'
      AND table_name = 'contratacao_personalizada'
    ) THEN
      ALTER TABLE contratacao_personalizada 
        ADD CONSTRAINT contratacao_personalizada_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK contratacao_personalizada_entidade_id_fkey criada';
    END IF;

    -- Criar index para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_contratacao_personalizada_entidade_id'
    ) THEN
      CREATE INDEX idx_contratacao_personalizada_entidade_id ON contratacao_personalizada(entidade_id);
      RAISE NOTICE '✓ Index idx_contratacao_personalizada_entidade_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela contratacao_personalizada não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 5: ATUALIZAR contratos
-- ====================================================================

\echo ''
\echo 'PARTE 5: Atualizando contratos...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratos' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE contratos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna contratos.entidade_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratos_contratante_id_fkey'
      AND table_name = 'contratos'
    ) THEN
      ALTER TABLE contratos DROP CONSTRAINT contratos_contratante_id_fkey;
      RAISE NOTICE '✓ FK contratos_contratante_id_fkey removida';
    END IF;

    -- Drop index legacy se existir
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_contratos_contratante'
    ) THEN
      DROP INDEX idx_contratos_contratante;
      RAISE NOTICE '✓ Index idx_contratos_contratante removido';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratos' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE contratos DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna contratos.contratante_id removida';
    END IF;

    -- Criar FK para entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratos_entidade_id_fkey'
      AND table_name = 'contratos'
    ) THEN
      ALTER TABLE contratos 
        ADD CONSTRAINT contratos_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK contratos_entidade_id_fkey criada';
    END IF;

    -- Criar index para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_contratos_entidade_id'
    ) THEN
      CREATE INDEX idx_contratos_entidade_id ON contratos(entidade_id);
      RAISE NOTICE '✓ Index idx_contratos_entidade_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela contratos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: ATUALIZAR contratos_planos
-- ====================================================================

\echo ''
\echo 'PARTE 6: Atualizando contratos_planos...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos_planos') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratos_planos' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE contratos_planos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna contratos_planos.entidade_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratos_planos_contratante_id_fkey'
      AND table_name = 'contratos_planos'
    ) THEN
      ALTER TABLE contratos_planos DROP CONSTRAINT contratos_planos_contratante_id_fkey;
      RAISE NOTICE '✓ FK contratos_planos_contratante_id_fkey removida';
    END IF;

    -- Drop index legacy se existir
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_contratos_contratante'
    ) THEN
      DROP INDEX IF EXISTS idx_contratos_contratante;
      RAISE NOTICE '✓ Index idx_contratos_contratante removido';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratos_planos' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE contratos_planos DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna contratos_planos.contratante_id removida';
    END IF;

    -- Criar FK para entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'contratos_planos_entidade_id_fkey'
      AND table_name = 'contratos_planos'
    ) THEN
      ALTER TABLE contratos_planos 
        ADD CONSTRAINT contratos_planos_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK contratos_planos_entidade_id_fkey criada';
    END IF;

    -- Criar index para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_contratos_planos_entidade_id'
    ) THEN
      CREATE INDEX idx_contratos_planos_entidade_id ON contratos_planos(entidade_id);
      RAISE NOTICE '✓ Index idx_contratos_planos_entidade_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela contratos_planos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 7: ATUALIZAR entidades_senhas (renomear contratante_id → entidade_id)
-- ====================================================================

\echo ''
\echo 'PARTE 7: Atualizando entidades_senhas...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
    
    -- Verificar se ainda usa contratante_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'entidades_senhas' 
      AND column_name = 'contratante_id'
    ) THEN
      -- Drop FK constraint contratante_id se existir
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'entidades_senhas_contratante_id_fkey'
        AND table_name = 'entidades_senhas'
      ) THEN
        ALTER TABLE entidades_senhas DROP CONSTRAINT entidades_senhas_contratante_id_fkey;
        RAISE NOTICE '✓ FK entidades_senhas_contratante_id_fkey removida';
      END IF;

      -- Renomear coluna contratante_id → entidade_id
      ALTER TABLE entidades_senhas RENAME COLUMN contratante_id TO entidade_id;
      RAISE NOTICE '✓ Coluna entidades_senhas.contratante_id renomeada para entidade_id';

      -- Criar FK para entidade_id
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'entidades_senhas_entidade_id_fkey'
        AND table_name = 'entidades_senhas'
      ) THEN
        ALTER TABLE entidades_senhas 
          ADD CONSTRAINT entidades_senhas_entidade_id_fkey 
          FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ FK entidades_senhas_entidade_id_fkey criada';
      END IF;
    ELSE
      RAISE NOTICE '✓ entidades_senhas já usa entidade_id';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela entidades_senhas não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 7.5: DROPAR VIEWS QUE DEPENDEM DE recibos.contratante_id
-- ====================================================================

\echo ''
\echo 'PARTE 7.5: Dropando views que dependem de recibos.contratante_id...'

DO $$
BEGIN
  -- Dropar materialized view primeiro
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_recibos_completos_mat') THEN
    DROP MATERIALIZED VIEW vw_recibos_completos_mat CASCADE;
    RAISE NOTICE '✓ Materialized view vw_recibos_completos_mat dropada';
  END IF;

  -- Dropar view
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_recibos_completos') THEN
    DROP VIEW vw_recibos_completos CASCADE;
    RAISE NOTICE '✓ View vw_recibos_completos dropada';
  END IF;

  RAISE NOTICE '✓ Views de recibos dropadas';
END $$;

-- ==================================================================== 
-- PARTE 8: ATUALIZAR recibos (pode servir entidade OU clínica)
-- ====================================================================

\echo ''
\echo 'PARTE 8: Atualizando recibos...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recibos' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE recibos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna recibos.entidade_id adicionada';
    END IF;

    -- Adicionar clinica_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recibos' 
      AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE recibos ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna recibos.clinica_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'recibos_contratante_id_fkey'
      AND table_name = 'recibos'
    ) THEN
      ALTER TABLE recibos DROP CONSTRAINT recibos_contratante_id_fkey;
      RAISE NOTICE '✓ FK recibos_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recibos' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE recibos DROP COLUMN contratante_id CASCADE;
      RAISE NOTICE '✓ Coluna recibos.contratante_id removida';
    END IF;

    -- Criar FKs para entidade_id e clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'recibos_entidade_id_fkey'
      AND table_name = 'recibos'
    ) THEN
      ALTER TABLE recibos 
        ADD CONSTRAINT recibos_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK recibos_entidade_id_fkey criada';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'recibos_clinica_id_fkey'
      AND table_name = 'recibos'
    ) THEN
      ALTER TABLE recibos 
        ADD CONSTRAINT recibos_clinica_id_fkey 
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK recibos_clinica_id_fkey criada';
    END IF;

    -- Criar check constraint: entidade_id XOR clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'recibos_entidade_or_clinica_check'
      AND table_name = 'recibos'
    ) THEN
      ALTER TABLE recibos 
        ADD CONSTRAINT recibos_entidade_or_clinica_check 
        CHECK (
          (entidade_id IS NOT NULL AND clinica_id IS NULL) OR
          (entidade_id IS NULL AND clinica_id IS NOT NULL)
        );
      RAISE NOTICE '✓ Check constraint recibos_entidade_or_clinica_check criada';
    END IF;

    -- Criar indexes para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_recibos_entidade_id'
    ) THEN
      CREATE INDEX idx_recibos_entidade_id ON recibos(entidade_id);
      RAISE NOTICE '✓ Index idx_recibos_entidade_id criado';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_recibos_clinica_id'
    ) THEN
      CREATE INDEX idx_recibos_clinica_id ON recibos(clinica_id);
      RAISE NOTICE '✓ Index idx_recibos_clinica_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela recibos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 9: ATUALIZAR empresas_clientes (sempre vinculada a clínica)
-- ====================================================================

\echo ''
\echo 'PARTE 9: Atualizando empresas_clientes...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas_clientes') THEN
    
    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'empresas_clientes_contratante_id_fkey'
      AND table_name = 'empresas_clientes'
    ) THEN
      ALTER TABLE empresas_clientes DROP CONSTRAINT empresas_clientes_contratante_id_fkey;
      RAISE NOTICE '✓ FK empresas_clientes_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'empresas_clientes' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE empresas_clientes DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna empresas_clientes.contratante_id removida';
    END IF;

    -- Garantir que clinica_id existe e é NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'empresas_clientes' 
      AND column_name = 'clinica_id'
      AND is_nullable = 'YES'
    ) THEN
      ALTER TABLE empresas_clientes ALTER COLUMN clinica_id SET NOT NULL;
      RAISE NOTICE '✓ Coluna empresas_clientes.clinica_id definida como NOT NULL';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela empresas_clientes não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 9.5: DROPAR views que dependem de notificacoes_admin.contratante_id
-- ====================================================================

\echo ''
\echo 'PARTE 9.5: Dropando views que dependem de notificacoes_admin.contratante_id...'

DO $$
BEGIN
  -- Dropar vw_notificacoes_admin_pendentes se existir
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_notificacoes_admin_pendentes') THEN
    DROP VIEW IF EXISTS vw_notificacoes_admin_pendentes CASCADE;
    RAISE NOTICE '✓ View vw_notificacoes_admin_pendentes dropada';
  END IF;
  
  RAISE NOTICE '✓ Views de notificacoes_admin dropadas';
END $$;

-- ====================================================================
-- PARTE 10: ATUALIZAR notificacoes_admin (pode servir entidade OU clínica)
-- ====================================================================

\echo ''
\echo 'PARTE 10: Atualizando notificacoes_admin...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacoes_admin') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes_admin' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE notificacoes_admin ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna notificacoes_admin.entidade_id adicionada';
    END IF;

    -- Adicionar clinica_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes_admin' 
      AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE notificacoes_admin ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna notificacoes_admin.clinica_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'notificacoes_admin_contratante_id_fkey'
      AND table_name = 'notificacoes_admin'
    ) THEN
      ALTER TABLE notificacoes_admin DROP CONSTRAINT notificacoes_admin_contratante_id_fkey;
      RAISE NOTICE '✓ FK notificacoes_admin_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes_admin' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE notificacoes_admin DROP COLUMN contratante_id CASCADE;
      RAISE NOTICE '✓ Coluna notificacoes_admin.contratante_id removida';
    END IF;

    -- Criar FKs para entidade_id e clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'notificacoes_admin_entidade_id_fkey'
      AND table_name = 'notificacoes_admin'
    ) THEN
      ALTER TABLE notificacoes_admin 
        ADD CONSTRAINT notificacoes_admin_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK notificacoes_admin_entidade_id_fkey criada';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'notificacoes_admin_clinica_id_fkey'
      AND table_name = 'notificacoes_admin'
    ) THEN
      ALTER TABLE notificacoes_admin 
        ADD CONSTRAINT notificacoes_admin_clinica_id_fkey 
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK notificacoes_admin_clinica_id_fkey criada';
    END IF;

    -- Criar indexes para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_notificacoes_admin_entidade_id'
    ) THEN
      CREATE INDEX idx_notificacoes_admin_entidade_id ON notificacoes_admin(entidade_id);
      RAISE NOTICE '✓ Index idx_notificacoes_admin_entidade_id criado';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_notificacoes_admin_clinica_id'
    ) THEN
      CREATE INDEX idx_notificacoes_admin_clinica_id ON notificacoes_admin(clinica_id);
      RAISE NOTICE '✓ Index idx_notificacoes_admin_clinica_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela notificacoes_admin não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 11: ATUALIZAR tokens_retomada_pagamento (sempre entidade)
-- ====================================================================

\echo ''
\echo 'PARTE 11: Atualizando tokens_retomada_pagamento...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tokens_retomada_pagamento') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tokens_retomada_pagamento' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE tokens_retomada_pagamento ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna tokens_retomada_pagamento.entidade_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'tokens_retomada_pagamento_contratante_id_fkey'
      AND table_name = 'tokens_retomada_pagamento'
    ) THEN
      ALTER TABLE tokens_retomada_pagamento DROP CONSTRAINT tokens_retomada_pagamento_contratante_id_fkey;
      RAISE NOTICE '✓ FK tokens_retomada_pagamento_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tokens_retomada_pagamento' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE tokens_retomada_pagamento DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna tokens_retomada_pagamento.contratante_id removida';
    END IF;

    -- Criar FK para entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'tokens_retomada_pagamento_entidade_id_fkey'
      AND table_name = 'tokens_retomada_pagamento'
    ) THEN
      ALTER TABLE tokens_retomada_pagamento 
        ADD CONSTRAINT tokens_retomada_pagamento_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK tokens_retomada_pagamento_entidade_id_fkey criada';
    END IF;

    -- Criar index para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_tokens_retomada_pagamento_entidade_id'
    ) THEN
      CREATE INDEX idx_tokens_retomada_pagamento_entidade_id ON tokens_retomada_pagamento(entidade_id);
      RAISE NOTICE '✓ Index idx_tokens_retomada_pagamento_entidade_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela tokens_retomada_pagamento não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 12: ATUALIZAR audit_logs (pode auditar entidade OU clínica)
-- ====================================================================

\echo ''
\echo 'PARTE 12: Atualizando audit_logs...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE audit_logs ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna audit_logs.entidade_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'audit_logs_contratante_id_fkey'
      AND table_name = 'audit_logs'
    ) THEN
      ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_contratante_id_fkey;
      RAISE NOTICE '✓ FK audit_logs_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE audit_logs DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna audit_logs.contratante_id removida';
    END IF;

    -- Criar FK para entidade_id (já tem clinica_id)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'audit_logs_entidade_id_fkey'
      AND table_name = 'audit_logs'
    ) THEN
      ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK audit_logs_entidade_id_fkey criada';
    END IF;

    -- Criar index para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_audit_logs_entidade_id'
    ) THEN
      CREATE INDEX idx_audit_logs_entidade_id ON audit_logs(entidade_id);
      RAISE NOTICE '✓ Index idx_audit_logs_entidade_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela audit_logs não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 12.5: DROPAR policies que dependem de pagamentos.contratante_id
-- ====================================================================

\echo ''
\echo 'PARTE 12.5: Dropando policies que dependem de pagamentos.contratante_id...'

DO $$
BEGIN
  -- Dropar policy pagamentos_responsavel_select se existir
  DROP POLICY IF EXISTS pagamentos_responsavel_select ON pagamentos;
  RAISE NOTICE '✓ Policy pagamentos_responsavel_select dropada';
  
  -- Dropar outras policies de pagamentos que possam depender de contratante_id
  DROP POLICY IF EXISTS pagamentos_contratante_select ON pagamentos;
  DROP POLICY IF EXISTS pagamentos_contratante_insert ON pagamentos;
  DROP POLICY IF EXISTS pagamentos_contratante_update ON pagamentos;
  
  RAISE NOTICE '✓ Policies de pagamentos dropadas';
END $$;

-- ====================================================================
-- PARTE 13: ATUALIZAR pagamentos (pode ser entidade OU clínica)
-- ====================================================================

\echo ''
\echo 'PARTE 13: Atualizando pagamentos...'

DO $$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
    
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pagamentos' 
      AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE pagamentos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna pagamentos.entidade_id adicionada';
    END IF;

    -- Adicionar clinica_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pagamentos' 
      AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE pagamentos ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna pagamentos.clinica_id adicionada';
    END IF;

    -- Drop FK constraint contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pagamentos_contratante_id_fkey'
      AND table_name = 'pagamentos'
    ) THEN
      ALTER TABLE pagamentos DROP CONSTRAINT pagamentos_contratante_id_fkey;
      RAISE NOTICE '✓ FK pagamentos_contratante_id_fkey removida';
    END IF;

    -- Drop coluna contratante_id se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pagamentos' 
      AND column_name = 'contratante_id'
    ) THEN
      ALTER TABLE pagamentos DROP COLUMN contratante_id CASCADE;
      RAISE NOTICE '✓ Coluna pagamentos.contratante_id removida';
    END IF;

    -- Criar FKs para entidade_id e clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pagamentos_entidade_id_fkey'
      AND table_name = 'pagamentos'
    ) THEN
      ALTER TABLE pagamentos 
        ADD CONSTRAINT pagamentos_entidade_id_fkey 
        FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK pagamentos_entidade_id_fkey criada';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pagamentos_clinica_id_fkey'
      AND table_name = 'pagamentos'
    ) THEN
      ALTER TABLE pagamentos 
        ADD CONSTRAINT pagamentos_clinica_id_fkey 
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;
      RAISE NOTICE '✓ FK pagamentos_clinica_id_fkey criada';
    END IF;

    -- Criar check constraint: entidade_id XOR clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'pagamentos_entidade_or_clinica_check'
      AND table_name = 'pagamentos'
    ) THEN
      ALTER TABLE pagamentos 
        ADD CONSTRAINT pagamentos_entidade_or_clinica_check 
        CHECK (
          (entidade_id IS NOT NULL AND clinica_id IS NULL) OR
          (entidade_id IS NULL AND clinica_id IS NOT NULL)
        );
      RAISE NOTICE '✓ Check constraint pagamentos_entidade_or_clinica_check criada';
    END IF;

    -- Criar indexes para performance
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_pagamentos_entidade_id'
    ) THEN
      CREATE INDEX idx_pagamentos_entidade_id ON pagamentos(entidade_id);
      RAISE NOTICE '✓ Index idx_pagamentos_entidade_id criado';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_pagamentos_clinica_id'
    ) THEN
      CREATE INDEX idx_pagamentos_clinica_id ON pagamentos(clinica_id);
      RAISE NOTICE '✓ Index idx_pagamentos_clinica_id criado';
    END IF;

  ELSE
    RAISE NOTICE '⚠ Tabela pagamentos não existe';
  END IF;
END $$;

-- ====================================================================
-- RESUMO DA MIGRAÇÃO
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'RESUMO DA MIGRATION 500'
\echo '========================================='
\echo '✓ Todas as foreign keys segregadas'
\echo '✓ Coluna contratante_id removida de todas as tabelas'
\echo '✓ Indexes criados para performance'
\echo '✓ Check constraints implementados'
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Atualizar código-fonte (APIs, TypeScript)'
\echo '2. Atualizar views e funções SQL'
\echo '3. Executar testes'
\echo '4. Validar build'
\echo '========================================='

COMMIT;
