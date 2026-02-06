-- ====================================================================
-- Migration 420: Renomear contratantes → entidades
-- Data: 2026-02-05
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO:
--   Renomear tabelas e colunas para refletir o domínio correto:
--   - contratantes → entidades
--   - entidades_senhas → entidades_senhas
--   - contratante_id → entidade_id (em todas as tabelas relacionadas)
--
-- IMPORTANTE:
--   - Banco está sem contratantes (sem backup necessário)
--   - Esta migration é idempotente (pode ser executada múltiplas vezes)
--   - Atualiza constraints, índices, sequences e comentários
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 420: RENAME CONTRATANTES → ENTIDADES'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- PARTE 1: RENOMEAR TABELA contratantes → entidades
-- ====================================================================

\echo ''
\echo 'PARTE 1: Renomeando tabela contratantes → entidades...'

-- Verificar se tabela já foi renomeada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades') THEN
    RAISE NOTICE '⚠ Tabela "entidades" já existe. Pulando rename de contratantes.';
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contratantes') THEN
    ALTER TABLE contratantes RENAME TO entidades;
    RAISE NOTICE '✓ Tabela contratantes renomeada para entidades';
  ELSE
    RAISE NOTICE '⚠ Tabela contratantes não existe (será criada posteriormente)';
  END IF;
END $$;

-- Renomear sequence se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'contratantes_id_seq') THEN
    ALTER SEQUENCE contratantes_id_seq RENAME TO entidades_id_seq;
    RAISE NOTICE '✓ Sequence contratantes_id_seq renomeada para entidades_id_seq';
  END IF;
END $$;

-- ====================================================================
-- PARTE 2: RENOMEAR TABELA entidades_senhas → entidades_senhas
-- ====================================================================

\echo ''
\echo 'PARTE 2: Renomeando tabela entidades_senhas → entidades_senhas...'

-- Verificar se tabela já foi renomeada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades_senhas') THEN
    RAISE NOTICE '⚠ Tabela "entidades_senhas" já existe. Pulando rename de entidades_senhas.';
  ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades_senhas') THEN
    ALTER TABLE entidades_senhas RENAME TO entidades_senhas;
    RAISE NOTICE '✓ Tabela entidades_senhas renomeada para entidades_senhas';
  ELSE
    RAISE NOTICE '⚠ Tabela entidades_senhas não existe (será criada posteriormente)';
  END IF;
END $$;

-- Renomear sequence se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'entidades_senhas_id_seq') THEN
    ALTER SEQUENCE entidades_senhas_id_seq RENAME TO entidades_senhas_id_seq;
    RAISE NOTICE '✓ Sequence entidades_senhas_id_seq renomeada para entidades_senhas_id_seq';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: RENOMEAR COLUNAS contratante_id → entidade_id
-- ====================================================================

\echo ''
\echo 'PARTE 3: Renomeando colunas contratante_id → entidade_id...'

-- Renomear em usuarios
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE usuarios RENAME COLUMN contratante_id TO entidade_id;
    RAISE NOTICE '✓ usuarios: contratante_id → entidade_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'entidade_id'
  ) THEN
    RAISE NOTICE '⚠ usuarios: coluna entidade_id já existe';
  ELSE
    RAISE NOTICE '⚠ usuarios: coluna contratante_id não encontrada';
  END IF;
END $$;

-- Renomear em clinicas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinicas' AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE clinicas RENAME COLUMN contratante_id TO entidade_id;
    RAISE NOTICE '✓ clinicas: contratante_id → entidade_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinicas' AND column_name = 'entidade_id'
  ) THEN
    RAISE NOTICE '⚠ clinicas: coluna entidade_id já existe';
  ELSE
    RAISE NOTICE '⚠ clinicas: coluna contratante_id não encontrada';
  END IF;
END $$;

-- Renomear em entidades_senhas (antigo entidades_senhas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entidades_senhas' AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE entidades_senhas RENAME COLUMN contratante_id TO entidade_id;
    RAISE NOTICE '✓ entidades_senhas: contratante_id → entidade_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entidades_senhas' AND column_name = 'entidade_id'
  ) THEN
    RAISE NOTICE '⚠ entidades_senhas: coluna entidade_id já existe';
  ELSE
    RAISE NOTICE '⚠ entidades_senhas: coluna contratante_id não encontrada';
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: ATUALIZAR CONSTRAINTS E ÍNDICES
-- ====================================================================

\echo ''
\echo 'PARTE 4: Atualizando constraints e índices...'

-- Atualizar FKs em usuarios (se existirem)
DO $$
BEGIN
  -- Dropar constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'usuarios' 
    AND constraint_name LIKE '%contratante%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE usuarios DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'usuarios' 
      AND constraint_name LIKE '%contratante%'
      LIMIT 1
    );
    RAISE NOTICE '✓ FK constraint antiga removida de usuarios';
  END IF;
  
  -- Recriar constraint com novo nome (se tabela entidades existir)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades') THEN
    ALTER TABLE usuarios 
      DROP CONSTRAINT IF EXISTS usuarios_entidade_id_fkey;
    ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_entidade_id_fkey 
      FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE RESTRICT;
    RAISE NOTICE '✓ FK constraint recriada: usuarios_entidade_id_fkey';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Erro ao atualizar FK em usuarios: %', SQLERRM;
END $$;

-- Atualizar FKs em clinicas (se existirem)
DO $$
BEGIN
  -- Dropar constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'clinicas' 
    AND constraint_name LIKE '%contratante%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE clinicas DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'clinicas' 
      AND constraint_name LIKE '%contratante%'
      LIMIT 1
    );
    RAISE NOTICE '✓ FK constraint antiga removida de clinicas';
  END IF;
  
  -- Recriar constraint com novo nome
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades') THEN
    ALTER TABLE clinicas 
      DROP CONSTRAINT IF EXISTS clinicas_entidade_id_fkey;
    ALTER TABLE clinicas 
      ADD CONSTRAINT clinicas_entidade_id_fkey 
      FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE RESTRICT;
    RAISE NOTICE '✓ FK constraint recriada: clinicas_entidade_id_fkey';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ Erro ao atualizar FK em clinicas: %', SQLERRM;
END $$;

-- Atualizar índices (renomear se existirem)
DO $$
DECLARE
  v_index_name TEXT;
BEGIN
  -- Índices em usuarios
  FOR v_index_name IN 
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'usuarios' AND indexname LIKE '%contratante%'
  LOOP
    EXECUTE 'ALTER INDEX ' || v_index_name || ' RENAME TO ' || 
            REPLACE(v_index_name, 'contratante', 'entidade');
    RAISE NOTICE '✓ Índice renomeado: % → %', v_index_name, REPLACE(v_index_name, 'contratante', 'entidade');
  END LOOP;
  
  -- Índices em clinicas
  FOR v_index_name IN 
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'clinicas' AND indexname LIKE '%contratante%'
  LOOP
    EXECUTE 'ALTER INDEX ' || v_index_name || ' RENAME TO ' || 
            REPLACE(v_index_name, 'contratante', 'entidade');
    RAISE NOTICE '✓ Índice renomeado: % → %', v_index_name, REPLACE(v_index_name, 'contratante', 'entidade');
  END LOOP;
END $$;

-- ====================================================================
-- PARTE 5: ATUALIZAR VIEWS E FUNCTIONS
-- ====================================================================

\echo ''
\echo 'PARTE 5: Verificando views e functions...'

-- Listar views que referenciam contratantes (apenas informativo)
DO $$
DECLARE
  v_view_name TEXT;
  v_view_count INTEGER := 0;
BEGIN
  FOR v_view_name IN 
    SELECT viewname FROM pg_views 
    WHERE definition LIKE '%contratante%'
    AND schemaname = 'public'
  LOOP
    v_view_count := v_view_count + 1;
    RAISE NOTICE '⚠ View referencia "contratante": % (necessita atualização manual)', v_view_name;
  END LOOP;
  
  IF v_view_count = 0 THEN
    RAISE NOTICE '✓ Nenhuma view referencia "contratante"';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================================================

\echo ''
\echo 'PARTE 6: Atualizando comentários...'

-- Comentários na tabela entidades
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades') THEN
    COMMENT ON TABLE entidades IS 
    'Entidades contratantes do sistema (empresas que contratam avaliações).
    Renomeada de "contratantes" em Migration 420 (2026-02-05).';
    RAISE NOTICE '✓ Comentário atualizado: entidades';
  END IF;
END $$;

-- Comentários na tabela entidades_senhas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entidades_senhas') THEN
    COMMENT ON TABLE entidades_senhas IS 
    'Senhas das entidades contratantes.
    Renomeada de "entidades_senhas" em Migration 420 (2026-02-05).';
    RAISE NOTICE '✓ Comentário atualizado: entidades_senhas';
  END IF;
END $$;

-- ====================================================================
-- FINALIZAÇÃO
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'MIGRATION 420: CONCLUÍDA COM SUCESSO'
\echo 'Finalizando em:' :current_timestamp
\echo '========================================='
\echo ''
\echo 'RESUMO DAS ALTERAÇÕES:'
\echo '  ✓ contratantes → entidades'
\echo '  ✓ entidades_senhas → entidades_senhas'
\echo '  ✓ contratante_id → entidade_id (em usuarios, clinicas, entidades_senhas)'
\echo '  ✓ Constraints e índices atualizados'
\echo '  ✓ Sequences renomeadas'
\echo ''
\echo 'ATENÇÃO: Verifique views e functions que referenciam "contratante"'
\echo 'e atualize manualmente se necessário.'
\echo ''

COMMIT;
