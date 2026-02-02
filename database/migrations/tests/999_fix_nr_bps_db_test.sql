-- Migration 999: Fix nr-bps_db_test (banco com estrutura antiga)
-- Created: 2026-01-29
-- Purpose: Aplicar correções críticas em banco de teste

BEGIN;

-- ========================================
-- PARTE 1: Limpar role dba_maintenance problemática
-- ========================================

-- Revogar todas as permissões primeiro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dba_maintenance') THEN
    EXECUTE 'REASSIGN OWNED BY dba_maintenance TO postgres';
    EXECUTE 'DROP OWNED BY dba_maintenance CASCADE';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM dba_maintenance';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM dba_maintenance';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM dba_maintenance';
    EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA public FROM dba_maintenance';
    -- Tentar dropar agora
    BEGIN
      EXECUTE 'DROP ROLE dba_maintenance';
      RAISE NOTICE 'Role dba_maintenance removida';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível remover dba_maintenance: %', SQLERRM;
    END;
  END IF;
END $$;

-- ========================================
-- PARTE 2: Criar funções helper básicas
-- ========================================

CREATE OR REPLACE FUNCTION current_user_cpf()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_perfil()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_perfil', TRUE), '');
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_clinica_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_clinica_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================
-- PARTE 3: Criar policies básicas para admin
-- ========================================

-- Bloquear admin de avaliacoes (se tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'avaliacoes') THEN
    DROP POLICY IF EXISTS "avaliacoes_block_admin" ON avaliacoes;
    EXECUTE 'CREATE POLICY "avaliacoes_block_admin" ON avaliacoes AS RESTRICTIVE FOR ALL TO PUBLIC USING (current_user_perfil() != ''admin'')';
    RAISE NOTICE 'Policy avaliacoes_block_admin criada';
  END IF;
END $$;

-- ========================================
-- PARTE 4: Validação
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 999 (nr-bps_db_test) concluída!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Banco de teste tem estrutura diferente.';
  RAISE NOTICE 'Aplicadas correções parciais.';
  RAISE NOTICE '========================================';
END $$;

COMMIT;
