-- ====================================================================
-- MIGRATION 505: Adicionar Colunas entidade_id e clinica_id
-- ====================================================================
-- Data: 2026-02-07
-- Descrição: 
--   - Adiciona colunas entidade_id e clinica_id nas tabelas pendentes
--   - Cria indexes para performance
--   - Prepara estrutura para migração de dados
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 505: Adicionar Colunas Novas'
\echo '======================================================================'
\echo ''

-- ====================================================================
-- PARTE 1: CONTRATACAO_PERSONALIZADA
-- ====================================================================

\echo 'PARTE 1: Adicionando entidade_id em contratacao_personalizada...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratacao_personalizada' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE contratacao_personalizada ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em contratacao_personalizada';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em contratacao_personalizada';
    END IF;
    
    -- Criar index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contratacao_personalizada_entidade_id'
    ) THEN
      CREATE INDEX idx_contratacao_personalizada_entidade_id ON contratacao_personalizada(entidade_id);
      RAISE NOTICE '✓ Index idx_contratacao_personalizada_entidade_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela contratacao_personalizada não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 2: CONTRATOS
-- ====================================================================

\echo ''
\echo 'PARTE 2: Adicionando entidade_id em contratos...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratos') THEN
    -- Adicionar entidade_id (se a tabela ainda usa contratante_id)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contratos' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE contratos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em contratos';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em contratos';
    END IF;
    
    -- Criar index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contratos_entidade_id'
    ) THEN
      CREATE INDEX idx_contratos_entidade_id ON contratos(entidade_id);
      RAISE NOTICE '✓ Index idx_contratos_entidade_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela contratos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: ENTIDADES_SENHAS
-- ====================================================================

\echo ''
\echo 'PARTE 3: Preparando entidades_senhas...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades_senhas') THEN
    -- Adicionar entidade_id (para manter ambos durante transição)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'entidades_senhas' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE entidades_senhas ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em entidades_senhas';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em entidades_senhas';
    END IF;
    
    -- Criar index
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_entidades_senhas_entidade_id'
    ) THEN
      CREATE INDEX idx_entidades_senhas_entidade_id ON entidades_senhas(entidade_id);
      RAISE NOTICE '✓ Index idx_entidades_senhas_entidade_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela entidades_senhas não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: RECIBOS
-- ====================================================================

\echo ''
\echo 'PARTE 4: Adicionando entidade_id e clinica_id em recibos...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recibos' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE recibos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em recibos';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em recibos';
    END IF;
    
    -- Adicionar clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recibos' AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE recibos ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna clinica_id adicionada em recibos';
    ELSE
      RAISE NOTICE '→ Coluna clinica_id já existe em recibos';
    END IF;
    
    -- Criar indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recibos_entidade_id') THEN
      CREATE INDEX idx_recibos_entidade_id ON recibos(entidade_id);
      RAISE NOTICE '✓ Index idx_recibos_entidade_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recibos_clinica_id') THEN
      CREATE INDEX idx_recibos_clinica_id ON recibos(clinica_id);
      RAISE NOTICE '✓ Index idx_recibos_clinica_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela recibos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 5: NOTIFICACOES_ADMIN
-- ====================================================================

\echo ''
\echo 'PARTE 5: Adicionando entidade_id e clinica_id em notificacoes_admin...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacoes_admin') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes_admin' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE notificacoes_admin ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em notificacoes_admin';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em notificacoes_admin';
    END IF;
    
    -- Adicionar clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notificacoes_admin' AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE notificacoes_admin ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna clinica_id adicionada em notificacoes_admin';
    ELSE
      RAISE NOTICE '→ Coluna clinica_id já existe em notificacoes_admin';
    END IF;
    
    -- Criar indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notificacoes_admin_entidade_id') THEN
      CREATE INDEX idx_notificacoes_admin_entidade_id ON notificacoes_admin(entidade_id);
      RAISE NOTICE '✓ Index idx_notificacoes_admin_entidade_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notificacoes_admin_clinica_id') THEN
      CREATE INDEX idx_notificacoes_admin_clinica_id ON notificacoes_admin(clinica_id);
      RAISE NOTICE '✓ Index idx_notificacoes_admin_clinica_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela notificacoes_admin não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: TOKENS_RETOMADA_PAGAMENTO
-- ====================================================================

\echo ''
\echo 'PARTE 6: Adicionando entidade_id em tokens_retomada_pagamento...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tokens_retomada_pagamento') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tokens_retomada_pagamento' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE tokens_retomada_pagamento ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em tokens_retomada_pagamento';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em tokens_retomada_pagamento';
    END IF;
    
    -- Criar index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tokens_retomada_entidade_id') THEN
      CREATE INDEX idx_tokens_retomada_entidade_id ON tokens_retomada_pagamento(entidade_id);
      RAISE NOTICE '✓ Index idx_tokens_retomada_entidade_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela tokens_retomada_pagamento não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 7: AUDIT_LOGS
-- ====================================================================

\echo ''
\echo 'PARTE 7: Adicionando entidade_id e clinica_id em audit_logs...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE audit_logs ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em audit_logs';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em audit_logs';
    END IF;
    
    -- Criar index (clinica_id já existe pela Migration 077)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_entidade_id') THEN
      CREATE INDEX idx_audit_logs_entidade_id ON audit_logs(entidade_id);
      RAISE NOTICE '✓ Index idx_audit_logs_entidade_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela audit_logs não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 8: PAGAMENTOS
-- ====================================================================

\echo ''
\echo 'PARTE 8: Adicionando entidade_id e clinica_id em pagamentos...'

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
    -- Adicionar entidade_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pagamentos' AND column_name = 'entidade_id'
    ) THEN
      ALTER TABLE pagamentos ADD COLUMN entidade_id INTEGER;
      RAISE NOTICE '✓ Coluna entidade_id adicionada em pagamentos';
    ELSE
      RAISE NOTICE '→ Coluna entidade_id já existe em pagamentos';
    END IF;
    
    -- Adicionar clinica_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pagamentos' AND column_name = 'clinica_id'
    ) THEN
      ALTER TABLE pagamentos ADD COLUMN clinica_id INTEGER;
      RAISE NOTICE '✓ Coluna clinica_id adicionada em pagamentos';
    ELSE
      RAISE NOTICE '→ Coluna clinica_id já existe em pagamentos';
    END IF;
    
    -- Criar indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pagamentos_entidade_id') THEN
      CREATE INDEX idx_pagamentos_entidade_id ON pagamentos(entidade_id);
      RAISE NOTICE '✓ Index idx_pagamentos_entidade_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pagamentos_clinica_id') THEN
      CREATE INDEX idx_pagamentos_clinica_id ON pagamentos(clinica_id);
      RAISE NOTICE '✓ Index idx_pagamentos_clinica_id criado';
    END IF;
  ELSE
    RAISE NOTICE '⚠ Tabela pagamentos não existe';
  END IF;
END $$;

\echo ''
\echo '======================================================================'
\echo 'MIGRATION 505 CONCLUÍDA COM SUCESSO!'
\echo '======================================================================'
\echo ''
\echo 'Resumo das alterações:'
\echo '  ✓ entidade_id adicionado em 8 tabelas'
\echo '  ✓ clinica_id adicionado em 4 tabelas'
\echo '  ✓ Indexes criados para performance'
\echo ''
\echo 'Próximo passo: Migration 506 (Migrar dados)'
\echo ''

COMMIT;
