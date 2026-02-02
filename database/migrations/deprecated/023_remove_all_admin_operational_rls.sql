-- Migration 023: Remove ALL remaining admin operational RLS policies
-- Admin deve ter ZERO acesso operacional a recursos (funcionarios, avaliacoes, lotes, laudos, empresas, clinicas operacionalmente)
-- Exceção: políticas específicas para cadastro inicial via endpoints administrativos

BEGIN;

\echo 'Migration 023: Removendo TODAS as políticas RLS operacionais de admin...'

-- ========================================
-- REMOVE ADMIN ACCESS TO LOTES
-- ========================================
DROP POLICY IF EXISTS "policy_lotes_admin" ON lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_admin_select" ON lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_admin_insert" ON lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_admin_update" ON lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_admin_delete" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_all_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_view_lotes" ON lotes_avaliacao;
DROP POLICY IF EXISTS "admin_manage_lotes" ON lotes_avaliacao;

\echo '  ✓ Removidas políticas admin para lotes_avaliacao'

-- ========================================
-- REMOVE ADMIN ACCESS TO LAUDOS
-- ========================================
DROP POLICY IF EXISTS "policy_laudos_admin" ON laudos;
DROP POLICY IF EXISTS "laudos_admin_select" ON laudos;
DROP POLICY IF EXISTS "laudos_admin_insert" ON laudos;
DROP POLICY IF EXISTS "laudos_admin_update" ON laudos;
DROP POLICY IF EXISTS "laudos_admin_delete" ON laudos;
DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_view_laudos" ON laudos;
DROP POLICY IF EXISTS "admin_manage_laudos" ON laudos;

\echo '  ✓ Removidas políticas admin para laudos'

-- ========================================
-- REMOVE ADMIN ACCESS TO AVALIACOES
-- ========================================
DROP POLICY IF EXISTS "avaliacoes_admin_select" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_insert" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_update" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_admin_delete" ON avaliacoes;
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_view_avaliacoes" ON avaliacoes;
DROP POLICY IF EXISTS "admin_manage_avaliacoes" ON avaliacoes;

\echo '  ✓ Removidas políticas admin para avaliacoes'

-- ========================================
-- REMOVE ADMIN ACCESS TO RESPOSTAS
-- ========================================
DROP POLICY IF EXISTS "respostas_admin_select" ON respostas_avaliacao;
DROP POLICY IF EXISTS "respostas_admin_insert" ON respostas_avaliacao;
DROP POLICY IF EXISTS "respostas_admin_update" ON respostas_avaliacao;
DROP POLICY IF EXISTS "respostas_admin_delete" ON respostas_avaliacao;
DROP POLICY IF EXISTS "admin_all_respostas" ON respostas_avaliacao;
DROP POLICY IF EXISTS "admin_view_respostas" ON respostas_avaliacao;
DROP POLICY IF EXISTS "admin_manage_respostas" ON respostas_avaliacao;

\echo '  ✓ Removidas políticas admin para respostas_avaliacao'

-- ========================================
-- REMOVE ADMIN ACCESS TO RESULTADOS
-- ========================================
DROP POLICY IF EXISTS "resultados_admin_select" ON resultados_lote;
DROP POLICY IF EXISTS "resultados_admin_insert" ON resultados_lote;
DROP POLICY IF EXISTS "resultados_admin_update" ON resultados_lote;
DROP POLICY IF EXISTS "resultados_admin_delete" ON resultados_lote;
DROP POLICY IF EXISTS "admin_all_resultados" ON resultados_lote;
DROP POLICY IF EXISTS "admin_view_resultados" ON resultados_lote;
DROP POLICY IF EXISTS "admin_manage_resultados" ON resultados_lote;

\echo '  ✓ Removidas políticas admin para resultados_lote'

-- ========================================
-- REMOVE ADMIN OPERATIONAL ACCESS TO CLINICAS
-- ========================================
-- Admin só pode INSERT clinicas via endpoints administrativos de cadastro
-- Remove SELECT/UPDATE/DELETE operacional
DROP POLICY IF EXISTS "clinicas_admin_select" ON clinicas;
DROP POLICY IF EXISTS "clinicas_admin_update" ON clinicas;
DROP POLICY IF EXISTS "clinicas_admin_delete" ON clinicas;
DROP POLICY IF EXISTS "admin_view_clinicas" ON clinicas;
DROP POLICY IF EXISTS "admin_manage_clinicas" ON clinicas;
DROP POLICY IF EXISTS "admin_all_clinicas" ON clinicas;

\echo '  ✓ Removidas políticas admin operacionais para clinicas'

-- ========================================
-- VERIFY NO ADMIN OPERATIONAL POLICIES REMAIN
-- ========================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Check for any remaining admin policies (excluding audit_logs which admin should keep)
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname ILIKE '%admin%'
    AND tablename != 'audit_logs';
  
  IF policy_count > 0 THEN
    RAISE WARNING 'Ainda existem % políticas admin em tabelas operacionais', policy_count;
  ELSE
    RAISE NOTICE 'Confirmado: Nenhuma política admin operacional restante (exceto audit_logs)';
  END IF;
END $$;

COMMIT;

\echo '✓ Migration 023 completed: Admin operational RLS policies removed'
