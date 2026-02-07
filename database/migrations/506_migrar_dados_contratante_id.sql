-- ====================================================================
-- MIGRATION 506: Migrar Dados contratante_id → entidade_id/clinica_id
-- ====================================================================
-- Data: 2026-02-07
-- Descrição: 
--   - Migra dados de contratante_id para entidade_id/clinica_id
--   - Determina tipo de tomador (entidade vs clínica)
--   - Registra progresso na tabela de auditoria
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 506: Migrar Dados'
\echo '======================================================================'
\echo ''

-- ====================================================================
-- PARTE 1: MIGRAR FUNCIONARIOS
-- ====================================================================

\echo 'PARTE 1: Migrando funcionarios.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'contratante_id') THEN
    -- Migrar para entidade_id se contratante existe em entidades
    UPDATE funcionarios f
    SET entidade_id = f.contratante_id
    WHERE f.contratante_id IS NOT NULL
      AND f.entidade_id IS NULL
      AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = f.contratante_id);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✓ % funcionários migrados para entidade_id', v_count;
    
    -- Registrar na auditoria
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
    VALUES ('funcionarios', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ funcionarios.contratante_id não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 2: MIGRAR LOTES_AVALIACAO
-- ====================================================================

\echo ''
\echo 'PARTE 2: Migrando lotes_avaliacao.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lotes_avaliacao' AND column_name = 'contratante_id') THEN
    -- Migrar para entidade_id se contratante existe em entidades
    UPDATE lotes_avaliacao la
    SET entidade_id = la.contratante_id
    WHERE la.contratante_id IS NOT NULL
      AND la.entidade_id IS NULL
      AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = la.contratante_id);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✓ % lotes migrados para entidade_id', v_count;
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
    VALUES ('lotes_avaliacao', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ lotes_avaliacao.contratante_id não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: MIGRAR CONTRATACAO_PERSONALIZADA
-- ====================================================================

\echo ''
\echo 'PARTE 3: Migrando contratacao_personalizada.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratacao_personalizada' AND column_name = 'contratante_id') THEN
      -- Sempre migrar para entidade_id (contratação personalizada é para entidades)
      UPDATE contratacao_personalizada cp
      SET entidade_id = cp.contratante_id
      WHERE cp.contratante_id IS NOT NULL
        AND cp.entidade_id IS NULL;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '✓ % contrataçoes personalizadas migradas para entidade_id', v_count;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('contratacao_personalizada', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ contratacao_personalizada não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 4: MIGRAR CONTRATOS
-- ====================================================================

\echo ''
\echo 'PARTE 4: Migrando contratos.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'contratante_id') THEN
    -- Sempre migrar para entidade_id (contratos são para entidades)
    UPDATE contratos c
    SET entidade_id = c.contratante_id
    WHERE c.contratante_id IS NOT NULL
      AND c.entidade_id IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✓ % contratos migrados para entidade_id', v_count;
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
    VALUES ('contratos', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ contratos.contratante_id não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 5: MIGRAR ENTIDADES_SENHAS
-- ====================================================================

\echo ''
\echo 'PARTE 5: Migrando entidades_senhas.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_senhas' AND column_name = 'contratante_id') THEN
    -- Sempre migrar para entidade_id (senhas são para entidades)
    UPDATE entidades_senhas es
    SET entidade_id = es.contratante_id
    WHERE es.contratante_id IS NOT NULL
      AND es.entidade_id IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✓ % senhas migradas para entidade_id', v_count;
    
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
    VALUES ('entidades_senhas', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
  ELSE
    RAISE NOTICE '→ entidades_senhas.contratante_id não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 6: MIGRAR RECIBOS
-- ====================================================================

\echo ''
\echo 'PARTE 6: Migrando recibos.contratante_id...'

DO $$
DECLARE
  v_count_entidade INTEGER := 0;
  v_count_clinica INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos' AND column_name = 'contratante_id') THEN
      -- Migrar para entidade_id se existe em entidades
      UPDATE recibos r
      SET entidade_id = r.contratante_id
      WHERE r.contratante_id IS NOT NULL
        AND r.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = r.contratante_id);
      
      GET DIAGNOSTICS v_count_entidade = ROW_COUNT;
      
      -- Migrar para clinica_id se existe em clinicas
      UPDATE recibos r
      SET clinica_id = r.contratante_id
      WHERE r.contratante_id IS NOT NULL
        AND r.clinica_id IS NULL
        AND r.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM clinicas c WHERE c.id = r.contratante_id);
      
      GET DIAGNOSTICS v_count_clinica = ROW_COUNT;
      
      RAISE NOTICE '✓ % recibos migrados para entidade_id', v_count_entidade;
      RAISE NOTICE '✓ % recibos migrados para clinica_id', v_count_clinica;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('recibos', 'contratante_id', 'migrar_dados', v_count_entidade + v_count_clinica, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ recibos não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 7: MIGRAR NOTIFICACOES_ADMIN
-- ====================================================================

\echo ''
\echo 'PARTE 7: Migrando notificacoes_admin.contratante_id...'

DO $$
DECLARE
  v_count_entidade INTEGER := 0;
  v_count_clinica INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacoes_admin') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificacoes_admin' AND column_name = 'contratante_id') THEN
      -- Migrar para entidade_id se existe em entidades
      UPDATE notificacoes_admin n
      SET entidade_id = n.contratante_id
      WHERE n.contratante_id IS NOT NULL
        AND n.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = n.contratante_id);
      
      GET DIAGNOSTICS v_count_entidade = ROW_COUNT;
      
      -- Migrar para clinica_id se existe em clinicas
      UPDATE notificacoes_admin n
      SET clinica_id = n.contratante_id
      WHERE n.contratante_id IS NOT NULL
        AND n.clinica_id IS NULL
        AND n.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM clinicas c WHERE c.id = n.contratante_id);
      
      GET DIAGNOSTICS v_count_clinica = ROW_COUNT;
      
      RAISE NOTICE '✓ % notificações migradas para entidade_id', v_count_entidade;
      RAISE NOTICE '✓ % notificações migradas para clinica_id', v_count_clinica;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('notificacoes_admin', 'contratante_id', 'migrar_dados', v_count_entidade + v_count_clinica, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ notificacoes_admin não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 8: MIGRAR TOKENS_RETOMADA_PAGAMENTO
-- ====================================================================

\echo ''
\echo 'PARTE 8: Migrando tokens_retomada_pagamento.contratante_id...'

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tokens_retomada_pagamento') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tokens_retomada_pagamento' AND column_name = 'contratante_id') THEN
      -- Sempre migrar para entidade_id (tokens são para entidades)
      UPDATE tokens_retomada_pagamento t
      SET entidade_id = t.contratante_id
      WHERE t.contratante_id IS NOT NULL
        AND t.entidade_id IS NULL;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '✓ % tokens migrados para entidade_id', v_count;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('tokens_retomada_pagamento', 'contratante_id', 'migrar_dados', v_count, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ tokens_retomada_pagamento não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 9: MIGRAR AUDIT_LOGS
-- ====================================================================

\echo ''
\echo 'PARTE 9: Migrando audit_logs.contratante_id...'

DO $$
DECLARE
  v_count_entidade INTEGER := 0;
  v_count_clinica INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'contratante_id') THEN
      -- Migrar para entidade_id se existe em entidades
      UPDATE audit_logs a
      SET entidade_id = a.contratante_id
      WHERE a.contratante_id IS NOT NULL
        AND a.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = a.contratante_id);
      
      GET DIAGNOSTICS v_count_entidade = ROW_COUNT;
      
      -- Migrar para clinica_id se existe em clinicas (via clinica_id já existente)
      -- audit_logs já tem clinica_id, então não precisa migrar
      
      RAISE NOTICE '✓ % audit logs migrados para entidade_id', v_count_entidade;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('audit_logs', 'contratante_id', 'migrar_dados', v_count_entidade, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ audit_logs não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 10: MIGRAR PAGAMENTOS
-- ====================================================================

\echo ''
\echo 'PARTE 10: Migrando pagamentos.contratante_id...'

DO $$
DECLARE
  v_count_entidade INTEGER := 0;
  v_count_clinica INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagamentos' AND column_name = 'contratante_id') THEN
      -- Migrar para entidade_id se existe em entidades
      UPDATE pagamentos p
      SET entidade_id = p.contratante_id
      WHERE p.contratante_id IS NOT NULL
        AND p.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM entidades e WHERE e.id = p.contratante_id);
      
      GET DIAGNOSTICS v_count_entidade = ROW_COUNT;
      
      -- Migrar para clinica_id se existe em clinicas
      UPDATE pagamentos p
      SET clinica_id = p.contratante_id
      WHERE p.contratante_id IS NOT NULL
        AND p.clinica_id IS NULL
        AND p.entidade_id IS NULL
        AND EXISTS (SELECT 1 FROM clinicas c WHERE c.id = p.contratante_id);
      
      GET DIAGNOSTICS v_count_clinica = ROW_COUNT;
      
      RAISE NOTICE '✓ % pagamentos migrados para entidade_id', v_count_entidade;
      RAISE NOTICE '✓ % pagamentos migrados para clinica_id', v_count_clinica;
      
      INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, status, concluido_em)
      VALUES ('pagamentos', 'contratante_id', 'migrar_dados', v_count_entidade + v_count_clinica, 'concluido', NOW());
    END IF;
  ELSE
    RAISE NOTICE '→ pagamentos não existe';
  END IF;
END $$;

\echo ''
\echo '======================================================================'
\echo 'MIGRATION 506 CONCLUÍDA COM SUCESSO!'
\echo '======================================================================'
\echo ''
\echo 'Resumo da migração:'
\echo '  ✓ Dados migrados de contratante_id para entidade_id/clinica_id'
\echo '  ✓ Registros de auditoria criados'
\echo '  ✓ Todas as tabelas processadas'
\echo ''
\echo 'Consultar auditoria: SELECT * FROM fk_migration_audit ORDER BY concluido_em;'
\echo ''
\echo 'Próximo passo: Migration 507 (Remover colunas legacy)'
\echo ''

COMMIT;
