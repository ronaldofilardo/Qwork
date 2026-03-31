-- Migration 1105: Corrigir RLS em avaliacoes (adicionar policy RH) e remover policy bugada em lotes_avaliacao
-- Data: 2026-06-03
-- Depende: 1104_update_elegibilidade_per_vinculo.sql
-- Contexto: Auditoria de segurança revelou:
--   (a) avaliacoes NÃO tem policy para perfil RH — isolamento era apenas application-layer
--   (b) rh_lotes_empresas tem clausula "entidade_id IS NOT NULL" que expõe todos lotes de entidades

BEGIN;

-- =============================================
-- 0a. ADICIONAR POLICY RH EM AVALIACOES
-- =============================================
-- Atualmente só existem: admin_all_avaliacoes, avaliacoes_block_admin, avaliacoes_own_select
-- RH precisa ver avaliações dos funcionários dos lotes da sua clínica

DROP POLICY IF EXISTS avaliacoes_rh_select ON public.avaliacoes;

CREATE POLICY avaliacoes_rh_select ON public.avaliacoes
  FOR SELECT
  USING (
    current_setting('app.current_user_perfil', true) = 'rh'
    AND EXISTS (
      SELECT 1 FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.id = avaliacoes.lote_id
        AND ec.clinica_id = NULLIF(current_setting('app.current_clinica_id', true), '')::INTEGER
    )
  );

COMMENT ON POLICY avaliacoes_rh_select ON public.avaliacoes IS
'RH pode ver avaliações vinculadas a lotes de empresas da sua clínica. Migration 1105.';


-- =============================================
-- 0b. REMOVER POLICY BUGADA rh_lotes_empresas
-- =============================================
-- Bug: "USING (perfil='rh' AND (clinica_id = current_user_clinica_id OR entidade_id IS NOT NULL))"
-- Isso permite que QUALQUER RH veja TODOS os lotes de entidades
-- A policy correta (lotes_rh_select) já existe e filtra por clinica_id adequadamente

DROP POLICY IF EXISTS rh_lotes_empresas ON public.lotes_avaliacao;

COMMENT ON TABLE lotes_avaliacao IS
'Policy rh_lotes_empresas removida por bug de segurança (entidade_id IS NOT NULL). '
'RH agora usa apenas lotes_rh_select. Migration 1105.';


-- =============================================
-- VERIFICAÇÃO
-- =============================================
DO $$
DECLARE
  v_rh_policy_exists BOOLEAN;
  v_buggy_policy_exists BOOLEAN;
BEGIN
  -- Verificar que avaliacoes_rh_select foi criada
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'avaliacoes' AND policyname = 'avaliacoes_rh_select'
  ) INTO v_rh_policy_exists;

  -- Verificar que rh_lotes_empresas foi removida
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lotes_avaliacao' AND policyname = 'rh_lotes_empresas'
  ) INTO v_buggy_policy_exists;

  IF v_rh_policy_exists AND NOT v_buggy_policy_exists THEN
    RAISE NOTICE 'Migration 1105: RLS corrigida com sucesso — avaliacoes_rh_select criada, rh_lotes_empresas removida';
  ELSE
    IF NOT v_rh_policy_exists THEN
      RAISE EXCEPTION 'Migration 1105: FALHA — avaliacoes_rh_select não foi criada';
    END IF;
    IF v_buggy_policy_exists THEN
      RAISE EXCEPTION 'Migration 1105: FALHA — rh_lotes_empresas ainda existe';
    END IF;
  END IF;
END;
$$;

COMMIT;
