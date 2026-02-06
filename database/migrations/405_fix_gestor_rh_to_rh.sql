-- ==========================================
-- MIGRATION 405: CORRIGIR rh → rh
-- Data: 2026-02-05
-- Descrição: Remove rh do enum e migra tudo para rh
-- NOTA: Dividido em duas transações (enum add + migração)
-- ==========================================

\echo '========================================='
\echo 'MIGRATION 405: CORRIGIR ENUM rh → rh'
\echo 'Iniciando em: ' || CURRENT_TIMESTAMP
\echo '========================================='
\echo ''

-- ====================================================================
-- TRANSAÇÃO 1: ADICIONAR 'rh' AO ENUM
-- ====================================================================

BEGIN;

\echo 'TRANSAÇÃO 1: Adicionando rh ao enum usuario_tipo_enum...'

DO $$
BEGIN
  -- Verificar se 'rh' já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'usuario_tipo_enum'::regtype 
    AND enumlabel = 'rh'
  ) THEN
    -- Adicionar 'rh' ao enum
    ALTER TYPE usuario_tipo_enum ADD VALUE 'rh';
    RAISE NOTICE '✓ Valor rh adicionado ao enum usuario_tipo_enum';
  ELSE
    RAISE NOTICE '⚠ Valor rh já existe no enum';
  END IF;
END $$;

COMMIT;

\echo '✓ Transação 1 concluída - enum atualizado'
\echo ''

-- ====================================================================
-- TRANSAÇÃO 2: MIGRAR DADOS E VALIDAR
-- ====================================================================

BEGIN;

\echo 'TRANSAÇÃO 2: Migrando dados e validando...'
\echo ''

-- ====================================================================
-- PARTE 2: MIGRAR DADOS DE rh PARA rh
-- ====================================================================

\echo 'PARTE 2: Migrando dados rh → rh...'

DO $$
DECLARE
  v_count_usuarios INTEGER := 0;
  v_count_funcionarios INTEGER := 0;
  v_has_usuario_tipo BOOLEAN := FALSE;
BEGIN
  -- Verificar se usuarios tem coluna usuario_tipo (schema novo) ou role (schema antigo)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'usuario_tipo'
  ) INTO v_has_usuario_tipo;
  
  IF v_has_usuario_tipo THEN
    -- Schema novo: migrar em usuarios
    UPDATE usuarios SET usuario_tipo = 'rh' WHERE usuario_tipo = 'rh';
    GET DIAGNOSTICS v_count_usuarios = ROW_COUNT;
    RAISE NOTICE '✓ Migrados % registros em usuarios', v_count_usuarios;
  ELSE
    RAISE NOTICE '⚠ Tabela usuarios tem schema antigo (role TEXT) - não precisa migração';
  END IF;
  
  -- Migrar em funcionarios (sempre tem usuario_tipo)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'funcionarios') THEN
    UPDATE funcionarios SET usuario_tipo = 'rh' WHERE usuario_tipo = 'rh';
    GET DIAGNOSTICS v_count_funcionarios = ROW_COUNT;
    RAISE NOTICE '✓ Migrados % registros em funcionarios', v_count_funcionarios;
  END IF;
  
  IF v_count_usuarios = 0 AND v_count_funcionarios = 0 THEN
    RAISE NOTICE '⚠ Nenhum registro com rh encontrado';
  END IF;
END $$;

\echo ''

-- ====================================================================
-- PARTE 3: VERIFICAR SE rh AINDA ESTÁ EM USO
-- ====================================================================

\echo 'PARTE 3: Verificando uso de rh...'

DO $$
DECLARE
  v_usuarios_count INTEGER := 0;
  v_funcionarios_count INTEGER := 0;
  v_has_usuario_tipo BOOLEAN;
BEGIN
  -- Verificar se usuarios tem coluna usuario_tipo
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'usuario_tipo'
  ) INTO v_has_usuario_tipo;
  
  IF v_has_usuario_tipo THEN
    SELECT COUNT(*) INTO v_usuarios_count 
    FROM usuarios 
    WHERE usuario_tipo = 'rh';
  END IF;
  
  SELECT COUNT(*) INTO v_funcionarios_count 
  FROM funcionarios 
  WHERE usuario_tipo = 'rh';
  
  IF v_usuarios_count > 0 OR v_funcionarios_count > 0 THEN
    RAISE EXCEPTION 'ERRO: Ainda existem registros usando rh (usuarios: %, funcionarios: %)', 
      v_usuarios_count, v_funcionarios_count;
  ELSE
    RAISE NOTICE '✓ Nenhum registro usando rh';
  END IF;
END $$;

\echo ''

-- ====================================================================
-- PARTE 4: REMOVER rh DO ENUM
-- ====================================================================

\echo 'PARTE 4: Removendo rh do enum...'

DO $$
BEGIN
  -- Nota: PostgreSQL não permite remover valores de enum facilmente
  -- Precisaria recriar o enum inteiro, o que é complexo e arriscado
  -- Por segurança, vamos apenas documentar que rh não deve ser usado
  
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'usuario_tipo_enum'::regtype 
    AND enumlabel = 'rh'
  ) THEN
    RAISE NOTICE '⚠ rh ainda existe no enum (não removido por segurança)';
    RAISE NOTICE '⚠ NÃO USE rh - use rh ao invés';
  ELSE
    RAISE NOTICE '✓ rh não existe no enum';
  END IF;
END $$;

\echo ''

-- ====================================================================
-- PARTE 5: VALIDAÇÃO FINAL
-- ====================================================================

\echo 'PARTE 5: Validação final...'

DO $$
DECLARE
  v_has_rh BOOLEAN;
  v_usuarios_rh INTEGER := 0;
  v_funcionarios_rh INTEGER := 0;
  v_has_usuario_tipo BOOLEAN;
BEGIN
  -- Verificar se 'rh' existe no enum
  SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'usuario_tipo_enum'::regtype 
    AND enumlabel = 'rh'
  ) INTO v_has_rh;
  
  IF NOT v_has_rh THEN
    RAISE EXCEPTION 'FALHA: rh não existe no enum usuario_tipo_enum';
  END IF;
  
  -- Verificar se usuarios tem coluna usuario_tipo
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'usuario_tipo'
  ) INTO v_has_usuario_tipo;
  
  -- Contar registros usando 'rh'
  IF v_has_usuario_tipo THEN
    SELECT COUNT(*) INTO v_usuarios_rh FROM usuarios WHERE usuario_tipo = 'rh';
  END IF;
  
  SELECT COUNT(*) INTO v_funcionarios_rh FROM funcionarios WHERE usuario_tipo = 'rh';
  
  RAISE NOTICE '✓ Enum usuario_tipo_enum contém rh';
  RAISE NOTICE '✓ Registros em usuarios usando rh: %', v_usuarios_rh;
  RAISE NOTICE '✓ Registros em funcionarios usando rh: %', v_funcionarios_rh;
END $$;

\echo ''
\echo '========================================='
\echo 'MIGRATION 405: CONCLUÍDA COM SUCESSO'
\echo 'Finalizando em: ' || CURRENT_TIMESTAMP
\echo '========================================='
\echo ''
\echo 'RESUMO:'
\echo '  ✓ rh adicionado ao enum usuario_tipo_enum'
\echo '  ✓ Dados migrados de rh → rh'
\echo '  ✓ Validação concluída'
\echo ''
\echo 'IMPORTANTE: A partir de agora, use apenas rh (não rh)'
\echo ''

COMMIT;
