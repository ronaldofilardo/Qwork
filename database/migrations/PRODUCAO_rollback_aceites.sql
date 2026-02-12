-- =====================================================
-- SCRIPT DE ROLLBACK - Remover Tabelas de Aceites
-- =====================================================
-- Objetivo: Reverter a migração de aceites em caso de problemas
-- Data: 12/02/2026
-- Banco: neondb (Produção)
-- 
-- ⚠️  ATENÇÃO: 
-- - Este script REMOVE as tabelas de aceites de termos
-- - TODOS os dados de aceite já registrados serão PERDIDOS
-- - Execute apenas em emergência ou com orientação de suporte
-- =====================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  ⚠️  ROLLBACK - Remover Tabelas de Aceites de Termos  ⚠️    ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'ATENÇÃO: Este script removerá as tabelas de aceites de termos!'
\echo 'Pressione CTRL+C para CANCELAR'
\echo 'Ou pressione ENTER para continuar...'
\pause

BEGIN;

-- =====================================================
-- BACKUP DOS DADOS ANTES DO ROLLBACK
-- =====================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────'
\echo 'PASSO 1: Criando backup dos dados existentes'
\echo '──────────────────────────────────────────────────────────────'

DO $$
DECLARE
  v_count_usuario INTEGER;
  v_count_entidade INTEGER;
  v_backup_usuario TEXT := 'aceites_termos_usuario_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  v_backup_entidade TEXT := 'aceites_termos_entidade_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
  -- Verifica e faz backup da tabela aceites_termos_usuario
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'aceites_termos_usuario'
  ) THEN
    EXECUTE format('SELECT COUNT(*) FROM aceites_termos_usuario') INTO v_count_usuario;
    
    IF v_count_usuario > 0 THEN
      RAISE NOTICE 'Fazendo backup de % registros de aceites_termos_usuario...', v_count_usuario;
      EXECUTE format('CREATE TABLE %I AS SELECT * FROM aceites_termos_usuario', v_backup_usuario);
      RAISE NOTICE '✓ Backup criado: %', v_backup_usuario;
    ELSE
      RAISE NOTICE '⊘ Nenhum registro em aceites_termos_usuario (nada para fazer backup)';
    END IF;
  END IF;

  -- Verifica e faz backup da tabela aceites_termos_entidade
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'aceites_termos_entidade'
  ) THEN
    EXECUTE format('SELECT COUNT(*) FROM aceites_termos_entidade') INTO v_count_entidade;
    
    IF v_count_entidade > 0 THEN
      RAISE NOTICE 'Fazendo backup de % registros de aceites_termos_entidade...', v_count_entidade;
      EXECUTE format('CREATE TABLE %I AS SELECT * FROM aceites_termos_entidade', v_backup_entidade);
      RAISE NOTICE '✓ Backup criado: %', v_backup_entidade;
    ELSE
      RAISE NOTICE '⊘ Nenhum registro em aceites_termos_entidade (nada para fazer backup)';
    END IF;
  END IF;
END $$;

-- =====================================================
-- REMOVER ÍNDICES
-- =====================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────'
\echo 'PASSO 2: Removendo índices'
\echo '──────────────────────────────────────────────────────────────'

DROP INDEX IF EXISTS idx_aceites_usuario_cpf CASCADE;
DROP INDEX IF EXISTS idx_aceites_usuario_data CASCADE;
DROP INDEX IF EXISTS idx_aceites_usuario_termo CASCADE;
DROP INDEX IF EXISTS idx_aceites_usuario_entidade CASCADE;

DROP INDEX IF EXISTS idx_aceites_entidade_cnpj CASCADE;
DROP INDEX IF EXISTS idx_aceites_entidade_data CASCADE;
DROP INDEX IF EXISTS idx_aceites_entidade_id CASCADE;
DROP INDEX IF EXISTS idx_aceites_entidade_responsavel CASCADE;

\echo '✓ Índices removidos'

-- =====================================================
-- REMOVER TABELAS
-- =====================================================

\echo ''
\echo '──────────────────────────────────────────────────────────────'
\echo 'PASSO 3: Removendo tabelas'
\echo '──────────────────────────────────────────────────────────────'

DROP TABLE IF EXISTS aceites_termos_usuario CASCADE;
DROP TABLE IF EXISTS aceites_termos_entidade CASCADE;

\echo '✓ Tabelas removidas'

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  -- Verifica se as tabelas foram removidas
  SELECT COUNT(*) INTO v_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('aceites_termos_usuario', 'aceites_termos_entidade');
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Erro: Tabelas ainda existem';
  END IF;
  
  RAISE NOTICE '✓ Rollback concluído com sucesso';
END $$;

-- =====================================================
-- COMMIT
-- =====================================================

COMMIT;

-- =====================================================
-- RESUMO DO ROLLBACK
-- =====================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  ROLLBACK CONCLUÍDO COM SUCESSO!                           ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''
\echo 'O que foi feito:'
\echo '✓ Backup dos dados criado (nas tabelas com sufixo _backup_*)'
\echo '✓ Todas as tabelas de aceites foram removidas'
\echo '✓ Todos os índices foram removidos'
\echo ''
\echo 'IMPORTANTE:'
\echo '- Se precisar dos dados novamente, os backups estão disponíveis'
\echo '- O sistema continuará funcionando sem o sistema de termos'
\echo '- Para reativar, execute novamente: PRODUCAO_criar_tabelas_aceites.sql'
\echo ''
