-- ============================================================================
-- SCRIPT DE PREPARAÇÃO - Criar Roles Necessárias
-- ============================================================================
-- Objetivo: Criar roles necessárias para RLS na tabela confirmacao_identidade
-- Data: 2026-02-12
-- ============================================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  CRIAÇÃO DE ROLES NECESSÁRIAS                                  ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

BEGIN;

-- ============================================================================
-- CRIAR ROLES SE NÃO EXISTIREM
-- ============================================================================

\echo 'Criando roles necessárias...'

-- Role: funcionario_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'funcionario_role') THEN
    CREATE ROLE funcionario_role;
    RAISE NOTICE '✓ Role funcionario_role criada';
  ELSE
    RAISE NOTICE '⊘ Role funcionario_role já existe';
  END IF;
END $$;

-- Role: rh_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rh_role') THEN
    CREATE ROLE rh_role;
    RAISE NOTICE '✓ Role rh_role criada';
  ELSE
    RAISE NOTICE '⊘ Role rh_role já existe';
  END IF;
END $$;

-- Role: gestor_entidade_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gestor_entidade_role') THEN
    CREATE ROLE gestor_entidade_role;
    RAISE NOTICE '✓ Role gestor_entidade_role criada';
  ELSE
    RAISE NOTICE '⊘ Role gestor_entidade_role já existe';
  END IF;
END $$;

-- Role: admin_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
    CREATE ROLE admin_role;
    RAISE NOTICE '✓ Role admin_role criada';
  ELSE
    RAISE NOTICE '⊘ Role admin_role já existe';
  END IF;
END $$;

-- Role: emissor_role
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'emissor_role') THEN
    CREATE ROLE emissor_role;
    RAISE NOTICE '✓ Role emissor_role criada';
  ELSE
    RAISE NOTICE '⊘ Role emissor_role já existe';
  END IF;
END $$;

COMMIT;

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║  ROLES CRIADAS COM SUCESSO                                     ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''

-- Listar roles criadas
SELECT 
  'Roles necessárias' as categoria,
  COUNT(*) as total_roles
FROM pg_roles
WHERE rolname IN ('funcionario_role', 'rh_role', 'gestor_entidade_role', 'admin_role', 'emissor_role');

\echo ''
\echo 'Próximo passo: Execute PRODUCAO_sync_confirmacao_identidade.sql'
\echo ''
