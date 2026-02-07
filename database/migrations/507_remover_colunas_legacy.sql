-- ====================================================================
-- MIGRATION 507: Remover Colunas Legacy contratante_id
-- ====================================================================
-- Data: 2026-02-07
-- Descrição: 
--   - Remove foreign keys antigas de contratante_id
--   - Cria novas foreign keys para entidade_id/clinica_id
--   - Remove colunas contratante_id das tabelas
--   - Atualiza check constraints
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 507: Remover Colunas Legacy'
\echo '======================================================================'
\echo ''
\echo '⚠️  ATENÇÃO: Esta migration remove colunas contratante_id'
\echo '   Certifique-se de que a Migration 506 foi executada com sucesso!'
\echo ''

-- ====================================================================
-- PARTE 1: FUNCIONARIOS
-- ====================================================================

\echo 'PARTE 1: Removendo funcionarios.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'contratante_id') THEN
    -- Drop FK antiga se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'funcionarios_contratante_id_fkey'
      AND table_name = 'funcionarios'
    ) THEN
      ALTER TABLE funcionarios DROP CONSTRAINT funcionarios_contratante_id_fkey;
      RAISE NOTICE '✓ FK funcionarios_contratante_id_fkey removida';
    END IF;
    
    -- Drop coluna
    ALTER TABLE funcionarios DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna funcionarios.contratante_id removida';
    
    -- Criar FK para entidade_id se ainda não existe
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
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
    VALUES ('funcionarios', 'contratante_id', 'remover_coluna', 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ funcionarios.contratante_id já foi removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 2: LOTES_AVALIACAO
-- ====================================================================

\echo ''
\echo 'PARTE 2: Removendo lotes_avaliacao.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_avaliacao' AND column_name = 'contratante_id') THEN
    -- Drop FK antiga se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'lotes_avaliacao_contratante_id_fkey'
      AND table_name = 'lotes_avaliacao'
    ) THEN
      ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_contratante_id_fkey;
      RAISE NOTICE '✓ FK lotes_avaliacao_contratante_id_fkey removida';
    END IF;
    
    -- Drop check constraints antigos
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'lotes_avaliacao_clinica_or_contratante_check'
      AND table_name = 'lotes_avaliacao'
    ) THEN
      ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
      RAISE NOTICE '✓ Check constraint antigo removido';
    END IF;
    
    -- Drop coluna
    ALTER TABLE lotes_avaliacao DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna lotes_avaliacao.contratante_id removida';
    
    -- Criar FK para entidade_id se ainda não existe
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
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
    VALUES ('lotes_avaliacao', 'contratante_id', 'remover_coluna', 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ lotes_avaliacao.contratante_id já foi removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: CONTRATACAO_PERSONALIZADA
-- ====================================================================

\echo ''
\echo 'PARTE 3: Removendo contratacao_personalizada.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratacao_personalizada' AND column_name = 'contratante_id') THEN
      -- Drop FK antiga
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%contratacao_personalizada%contratante%'
        AND table_name = 'contratacao_personalizada'
      ) THEN
        EXECUTE (
          SELECT 'ALTER TABLE contratacao_personalizada DROP CONSTRAINT ' || constraint_name
          FROM information_schema.table_constraints
          WHERE constraint_name LIKE '%contratacao_personalizada%contratante%'
          AND table_name = 'contratacao_personalizada'
          LIMIT 1
        );
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      ALTER TABLE contratacao_personalizada DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna contratacao_personalizada.contratante_id removida';
      
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('contratacao_personalizada', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: CONTRATOS
-- ====================================================================

\echo ''
\echo 'PARTE 4: Removendo contratos.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'contratante_id') THEN
    -- Drop FK antiga
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%contratos%contratante%'
      AND table_name = 'contratos'
    ) THEN
      EXECUTE (
        SELECT 'ALTER TABLE contratos DROP CONSTRAINT ' || constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%contratos%contratante%'
        AND table_name = 'contratos'
        AND constraint_type = 'FOREIGN KEY'
        LIMIT 1
      );
      RAISE NOTICE '✓ FK antiga removida';
    END IF;
    
    ALTER TABLE contratos DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna contratos.contratante_id removida';
    
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
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
    VALUES ('contratos', 'contratante_id', 'remover_coluna', 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ contratos.contratante_id já foi removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 5: ENTIDADES_SENHAS
-- ====================================================================

\echo ''
\echo 'PARTE 5: Removendo entidades_senhas.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_senhas' AND column_name = 'contratante_id') THEN
    -- Drop FK antiga
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%entidades_senhas%contratante%'
      AND table_name = 'entidades_senhas'
    ) THEN
      EXECUTE (
        SELECT 'ALTER TABLE entidades_senhas DROP CONSTRAINT ' || constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%entidades_senhas%contratante%'
        AND table_name = 'entidades_senhas'
        AND constraint_type = 'FOREIGN KEY'
        LIMIT 1
      );
      RAISE NOTICE '✓ FK antiga removida';
    END IF;
    
    -- Drop unique constraint se existir
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'entidades_senhas_contratante_cpf_unique'
    ) THEN
      DROP INDEX entidades_senhas_contratante_cpf_unique;
      RAISE NOTICE '✓ Index único removido';
    END IF;
    
    ALTER TABLE entidades_senhas DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna entidades_senhas.contratante_id removida';
    
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
    
    -- Criar novo unique constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'entidades_senhas_entidade_cpf_unique'
    ) THEN
      CREATE UNIQUE INDEX entidades_senhas_entidade_cpf_unique ON entidades_senhas(entidade_id, cpf);
      RAISE NOTICE '✓ Novo index único criado';
    END IF;
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
    VALUES ('entidades_senhas', 'contratante_id', 'remover_coluna', 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ entidades_senhas.contratante_id já foi removida';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: RECIBOS
-- ====================================================================

\echo ''
\echo 'PARTE 6: Removendo recibos.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos' AND column_name = 'contratante_id') THEN
      -- Drop FK antiga
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%recibos%contratante%'
        AND table_name = 'recibos'
      ) THEN
        EXECUTE (
          SELECT 'ALTER TABLE recibos DROP CONSTRAINT ' || constraint_name
          FROM information_schema.table_constraints
          WHERE constraint_name LIKE '%recibos%contratante%'
          AND table_name = 'recibos'
          AND constraint_type = 'FOREIGN KEY'
          LIMIT 1
        );
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      ALTER TABLE recibos DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna recibos.contratante_id removida';
      
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('recibos', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 7: NOTIFICACOES_ADMIN
-- ====================================================================

\echo ''
\echo 'PARTE 7: Removendo notificacoes_admin.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacoes_admin') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificacoes_admin' AND column_name = 'contratante_id') THEN
      -- Drop FK antiga
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%notificacoes%contratante%'
        AND table_name = 'notificacoes_admin'
      ) THEN
        EXECUTE (
          SELECT 'ALTER TABLE notificacoes_admin DROP CONSTRAINT ' || constraint_name
          FROM information_schema.table_constraints
          WHERE constraint_name LIKE '%notificacoes%contratante%'
          AND table_name = 'notificacoes_admin'
          AND constraint_type = 'FOREIGN KEY'
          LIMIT 1
        );
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      ALTER TABLE notificacoes_admin DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna notificacoes_admin.contratante_id removida';
      
      -- Criar FKs
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('notificacoes_admin', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 8: TOKENS_RETOMADA_PAGAMENTO
-- ====================================================================

\echo ''
\echo 'PARTE 8: Removendo tokens_retomada_pagamento.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tokens_retomada_pagamento') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens_retomada_pagamento' AND column_name = 'contratante_id') THEN
      -- Drop FK antiga
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%token%contratante%'
        AND table_name = 'tokens_retomada_pagamento'
      ) THEN
        EXECUTE (
          SELECT 'ALTER TABLE tokens_retomada_pagamento DROP CONSTRAINT ' || constraint_name
          FROM information_schema.table_constraints
          WHERE constraint_name LIKE '%token%contratante%'
          AND table_name = 'tokens_retomada_pagamento'
          AND constraint_type = 'FOREIGN KEY'
          LIMIT 1
        );
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      ALTER TABLE tokens_retomada_pagamento DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna tokens_retomada_pagamento.contratante_id removida';
      
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('tokens_retomada_pagamento', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 9: AUDIT_LOGS
-- ====================================================================

\echo ''
\echo 'PARTE 9: Removendo audit_logs.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'contratante_id') THEN
      -- Drop FK e index antigos
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'audit_logs_contratante_id_fkey'
        AND table_name = 'audit_logs'
      ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_contratante_id_fkey;
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_contratante_id') THEN
        DROP INDEX idx_audit_logs_contratante_id;
        RAISE NOTICE '✓ Index antigo removido';
      END IF;
      
      ALTER TABLE audit_logs DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna audit_logs.contratante_id removida';
      
      -- Criar FK para entidade_id
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('audit_logs', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 10: PAGAMENTOS
-- ====================================================================

\echo ''
\echo 'PARTE 10: Removendo pagamentos.contratante_id...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'contratante_id') THEN
      -- Drop FK antiga
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%pagamentos%contratante%'
        AND table_name = 'pagamentos'
      ) THEN
        EXECUTE (
          SELECT 'ALTER TABLE pagamentos DROP CONSTRAINT ' || constraint_name
          FROM information_schema.table_constraints
          WHERE constraint_name LIKE '%pagamentos%contratante%'
          AND table_name = 'pagamentos'
          AND constraint_type = 'FOREIGN KEY'
          LIMIT 1
        );
        RAISE NOTICE '✓ FK antiga removida';
      END IF;
      
      -- Drop indexes antigos
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pagamentos_contratante_id') THEN
        DROP INDEX idx_pagamentos_contratante_id;
        RAISE NOTICE '✓ Index antigo removido';
      END IF;
      
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pagamentos_contratante_id_rls') THEN
        DROP INDEX idx_pagamentos_contratante_id_rls;
        RAISE NOTICE '✓ Index RLS antigo removido';
      END IF;
      
      ALTER TABLE pagamentos DROP COLUMN contratante_id;
      RAISE NOTICE '✓ Coluna pagamentos.contratante_id removida';
      
      -- Criar FKs
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
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
      VALUES ('pagamentos', 'contratante_id', 'remover_coluna', 'concluido', NOW());
    END IF;
  END IF;
END $$;

-- ====================================================================
-- PARTE 11: CLINICAS (Remover contratante_id)
-- ====================================================================

\echo ''
\echo 'PARTE 11: Removendo clinicas.contratante_id (não deveria existir)...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinicas' AND column_name = 'contratante_id') THEN
    -- Drop FK se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%clinicas%contratante%'
      AND table_name = 'clinicas'
    ) THEN
      EXECUTE (
        SELECT 'ALTER TABLE clinicas DROP CONSTRAINT ' || constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%clinicas%contratante%'
        AND table_name = 'clinicas'
        AND constraint_type = 'FOREIGN KEY'
        LIMIT 1
      );
      RAISE NOTICE '✓ FK antiga removida';
    END IF;
    
    -- Drop unique constraint se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%clinicas%contratante%unique%'
      AND table_name = 'clinicas'
    ) THEN
      EXECUTE (
        SELECT 'ALTER TABLE clinicas DROP CONSTRAINT ' || constraint_name
        FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%clinicas%contratante%unique%'
        AND table_name = 'clinicas'
        LIMIT 1
      );
      RAISE NOTICE '✓ Constraint único removido';
    END IF;
    
    -- Drop index se existir
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clinicas_contratante_id') THEN
      DROP INDEX idx_clinicas_contratante_id;
      RAISE NOTICE '✓ Index removido';
    END IF;
    
    ALTER TABLE clinicas DROP COLUMN contratante_id;
    RAISE NOTICE '✓ Coluna clinicas.contratante_id removida (relacionamento incorreto)';
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, status, concluido_em)
    VALUES ('clinicas', 'contratante_id', 'remover_coluna', 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ clinicas.contratante_id já foi removida';
  END IF;
END $$;

\echo ''
\echo '======================================================================'
\echo 'MIGRATION 507 CONCLUÍDA COM SUCESSO!'
\echo '======================================================================'
\echo ''
\echo 'Resumo das alterações:'
\echo '  ✓ Colunas contratante_id removidas de 11 tabelas'
\echo '  ✓ Foreign keys antigas removidas'
\echo '  ✓ Novas foreign keys para entidade_id/clinica_id criadas'
\echo '  ✓ Indexes atualizados'
\echo ''
\echo 'Consultar auditoria completa:'
\echo '  SELECT * FROM fk_migration_audit ORDER BY concluido_em;'
\echo ''
\echo '✅ MIGRAÇÃO COMPLETA - Arquitetura segregada implementada!'
\echo ''

COMMIT;
