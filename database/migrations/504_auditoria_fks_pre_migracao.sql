-- ====================================================================
-- MIGRATION 504: Auditoria de Foreign Keys Pré-Migração
-- ====================================================================
-- Data: 2026-02-07
-- Descrição: 
--   - Análise completa de tabelas com contratante_id
--   - Mapeamento de relações tomadores_legacy → entidades/clinicas
--   - Criação de tabela de auditoria para rastreamento
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 504: Auditoria FKs Pré-Migração'
\echo '======================================================================'
\echo ''

-- ====================================================================
-- PARTE 1: CRIAR TABELA DE AUDITORIA
-- ====================================================================

\echo 'PARTE 1: Criando tabela de auditoria...'

CREATE TABLE IF NOT EXISTS fk_migration_audit (
  id SERIAL PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  coluna_origem VARCHAR(100) NOT NULL,
  tipo_migracao VARCHAR(50) NOT NULL, -- 'adicionar_colunas', 'migrar_dados', 'remover_coluna'
  registros_afetados INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'em_progresso', 'concluido', 'erro'
  detalhes JSONB,
  erro TEXT,
  iniciado_em TIMESTAMP,
  concluido_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fk_migration_audit_tabela ON fk_migration_audit(tabela);
CREATE INDEX IF NOT EXISTS idx_fk_migration_audit_status ON fk_migration_audit(status);

COMMENT ON TABLE fk_migration_audit IS 'Auditoria da migração de foreign keys de contratante_id para entidade_id/clinica_id';

-- ====================================================================
-- PARTE 2: MAPEAR TOMADORES LEGACY
-- ====================================================================

\echo ''
\echo 'PARTE 2: Mapeando tomadores legacy...'

DO $$
DECLARE
  v_count_entidades INTEGER;
  v_count_clinicas INTEGER;
  v_count_total INTEGER;
BEGIN
  -- Verificar se tabelas existem
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
    SELECT COUNT(*) INTO v_count_entidades FROM entidades;
    RAISE NOTICE '→ Entidades encontradas: %', v_count_entidades;
  ELSE
    RAISE NOTICE '⚠ Tabela entidades não existe';
    v_count_entidades := 0;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinicas') THEN
    SELECT COUNT(*) INTO v_count_clinicas FROM clinicas;
    RAISE NOTICE '→ Clínicas encontradas: %', v_count_clinicas;
  ELSE
    RAISE NOTICE '⚠ Tabela clinicas não existe';
    v_count_clinicas := 0;
  END IF;
  
  -- Verificar tomadores_legacy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores_legacy') THEN
    SELECT COUNT(*) INTO v_count_total FROM tomadores_legacy;
    RAISE NOTICE '→ Tomadores legacy encontrados: %', v_count_total;
  ELSE
    RAISE NOTICE '⚠ Tabela tomadores_legacy não existe';
  END IF;
END $$;

-- ====================================================================
-- PARTE 3: INVENTÁRIO DE TABELAS COM CONTRATANTE_ID
-- ====================================================================

\echo ''
\echo 'PARTE 3: Inventário de tabelas com contratante_id...'

DO $$
DECLARE
  v_table RECORD;
  v_count INTEGER;
BEGIN
  FOR v_table IN 
    SELECT 
      table_name,
      column_name
    FROM information_schema.columns
    WHERE column_name = 'contratante_id'
    AND table_schema = 'public'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE contratante_id IS NOT NULL', v_table.table_name)
    INTO v_count;
    
    RAISE NOTICE '→ % tem % registros com contratante_id', v_table.table_name, v_count;
    
    -- Registrar na auditoria
    INSERT INTO fk_migration_audit (tabela, coluna_origem, tipo_migracao, registros_afetados, detalhes)
    VALUES (
      v_table.table_name,
      'contratante_id',
      'inventario',
      v_count,
      jsonb_build_object('coluna', v_table.column_name, 'registros_nao_nulos', v_count)
    );
  END LOOP;
END $$;

\echo ''
\echo '======================================================================'
\echo 'MIGRATION 504 CONCLUÍDA COM SUCESSO!'
\echo '======================================================================'
\echo ''
\echo 'Resumo da auditoria:'
\echo '  ✓ Tabela fk_migration_audit criada'
\echo '  ✓ Mapeamento de tomadores realizado'
\echo '  ✓ Inventário de tabelas registrado'
\echo ''
\echo 'Próximo passo: Migration 505 (Adicionar colunas)'
\echo ''

COMMIT;
