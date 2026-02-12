-- ============================================================================
-- SCRIPT DE ROLLBACK DE EMERGÊNCIA
-- ============================================================================
-- Objetivo: Reverter a migração confirmacao_identidade em caso de problemas
-- Data: 2026-02-12
-- 
-- ⚠️  ATENÇÃO: 
-- - Execute apenas se houver problemas críticos após a migração
-- - Isso removerá a tabela e TODOS os dados de confirmação registrados
-- - Faça backup antes de executar este script
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ⚠️  ROLLBACK DE EMERGÊNCIA - confirmacao_identidade  ⚠️        ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'Este script irá REMOVER a tabela confirmacao_identidade e todos os seus dados!'
\echo ''
\echo 'Pressione CTRL+C para CANCELAR'
\echo 'Ou pressione ENTER para continuar...'
\pause

-- ============================================================================
-- BACKUP DOS DADOS ANTES DO ROLLBACK
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 1: Criando backup dos dados existentes'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_count INTEGER;
  v_backup_table TEXT := 'confirmacao_identidade_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
  -- Verifica se a tabela existe
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) THEN
    -- Conta registros
    EXECUTE format('SELECT COUNT(*) FROM confirmacao_identidade') INTO v_count;
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Fazendo backup de % registros...', v_count;
      
      -- Cria tabela de backup
      EXECUTE format('CREATE TABLE %I AS SELECT * FROM confirmacao_identidade', v_backup_table);
      
      RAISE NOTICE '✓ Backup criado: %', v_backup_table;
      RAISE NOTICE '  Para recuperar: INSERT INTO confirmacao_identidade SELECT * FROM %', v_backup_table;
    ELSE
      RAISE NOTICE 'Tabela vazia - backup não necessário';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela não existe - nada para fazer backup';
  END IF;
END $$;

\echo ''

-- ============================================================================
-- CONFIRMAÇÃO FINAL
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo '⚠️  CONFIRMAÇÃO FINAL'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''
\echo 'Você está prestes a:'
\echo '  1. Remover TODAS as políticas RLS'
\echo '  2. Remover TODOS os índices'
\echo '  3. DELETAR a tabela confirmacao_identidade'
\echo '  4. Perder TODOS os dados (a menos que estejam no backup)'
\echo ''
\echo 'Digite "CONFIRMAR ROLLBACK" para continuar:'
\prompt 'Confirmação: ' confirmacao

\if :{?confirmacao}
  \echo 'Confirmação recebida, prosseguindo com rollback...'
\else
  \echo 'Rollback CANCELADO - confirmação não recebida'
  \quit
\endif

-- ============================================================================
-- INÍCIO DA TRANSAÇÃO DE ROLLBACK
-- ============================================================================

BEGIN;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 2: Removendo políticas RLS'
\echo '──────────────────────────────────────────────────────────────────'

DROP POLICY IF EXISTS funcionario_view_own_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS rh_view_clinic_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS gestor_view_entity_confirmations ON confirmacao_identidade;
DROP POLICY IF EXISTS admin_emissor_full_access ON confirmacao_identidade;
DROP POLICY IF EXISTS system_insert_confirmations ON confirmacao_identidade;

\echo '✓ Políticas RLS removidas'

-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 3: Removendo triggers (se existirem)'
\echo '──────────────────────────────────────────────────────────────────'

DROP TRIGGER IF EXISTS trigger_auditoria_confirmacao_identidade ON confirmacao_identidade;

\echo '✓ Triggers removidos'

-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 4: Removendo funções (se existirem)'
\echo '──────────────────────────────────────────────────────────────────'

DROP FUNCTION IF EXISTS registrar_auditoria_confirmacao_identidade();

\echo '✓ Funções removidas'

-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 5: Removendo tabela'
\echo '──────────────────────────────────────────────────────────────────'

DROP TABLE IF EXISTS confirmacao_identidade CASCADE;

\echo '✓ Tabela confirmacao_identidade removida'

-- ============================================================================
-- VALIDAÇÃO DO ROLLBACK
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PASSO 6: Validando rollback'
\echo '──────────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_existe BOOLEAN;
  v_politicas INTEGER;
  v_indices INTEGER;
BEGIN
  -- Verifica se a tabela foi removida
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'confirmacao_identidade'
  ) INTO v_existe;
  
  IF v_existe THEN
    RAISE EXCEPTION 'ERRO: Tabela confirmacao_identidade ainda existe!';
  ELSE
    RAISE NOTICE '✓ Tabela confirmacao_identidade removida com sucesso';
  END IF;
  
  -- Verifica se policies foram removidas
  SELECT COUNT(*) INTO v_politicas
  FROM pg_policies
  WHERE tablename = 'confirmacao_identidade';
  
  IF v_politicas > 0 THEN
    RAISE WARNING 'AVISO: Ainda existem % políticas RLS', v_politicas;
  ELSE
    RAISE NOTICE '✓ Todas as políticas RLS removidas';
  END IF;
  
  -- Verifica se índices foram removidos
  SELECT COUNT(*) INTO v_indices
  FROM pg_indexes
  WHERE tablename = 'confirmacao_identidade';
  
  IF v_indices > 0 THEN
    RAISE WARNING 'AVISO: Ainda existem % índices', v_indices;
  ELSE
    RAISE NOTICE '✓ Todos os índices removidos';
  END IF;
END $$;

-- ============================================================================
-- COMMIT DO ROLLBACK
-- ============================================================================

COMMIT;

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ✓ ROLLBACK CONCLUÍDO COM SUCESSO                              ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- ============================================================================
-- INFORMAÇÕES PÓS-ROLLBACK
-- ============================================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'INFORMAÇÕES DO BACKUP'
\echo '──────────────────────────────────────────────────────────────────'

SELECT 
  tablename as tabela_backup,
  n_live_tup as registros,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamanho
FROM pg_stat_user_tables
WHERE tablename LIKE 'confirmacao_identidade_backup_%'
ORDER BY tablename DESC
LIMIT 1;

\echo ''
\echo '──────────────────────────────────────────────────────────────────'
\echo 'PRÓXIMOS PASSOS'
\echo '──────────────────────────────────────────────────────────────────'
\echo ''
\echo '1. Identifique e corrija o problema que causou a necessidade do rollback'
\echo '2. Revise o script de migração se necessário'
\echo '3. Execute novamente a migração quando pronto'
\echo '4. Se necessário, restaure os dados do backup:'
\echo ''
\echo '   -- Recriar a tabela (execute migração novamente)'
\echo '   \i database/migrations/PRODUCAO_sync_confirmacao_identidade.sql'
\echo ''
\echo '   -- Restaurar dados do backup'
\echo '   INSERT INTO confirmacao_identidade'
\echo '   SELECT * FROM confirmacao_identidade_backup_YYYYMMDD_HHMMSS;'
\echo ''
\echo '5. Quando não precisar mais do backup:'
\echo '   DROP TABLE confirmacao_identidade_backup_YYYYMMDD_HHMMSS;'
\echo ''

\echo ''
\echo '════════════════════════════════════════════════════════════════'
\echo 'Data/Hora: ' 
SELECT now();
\echo 'Banco: '
SELECT current_database();
\echo '════════════════════════════════════════════════════════════════'
\echo ''
