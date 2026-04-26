-- =============================================================================
-- Migration 1219: Corrigir policies RLS quebradas + adicionar policies ausentes
-- Data: 2026-04-18
-- Contexto: Auditoria RBAC/RLS revelou:
--   1. policy_lotes_admin e policy_lotes_emissor usam app.current_role (never set)
--      → devem usar app.current_user_perfil
--   2. policy_laudos_admin deve ser removida (admin bloqueado de laudos é intencional)
--   3. avaliacoes_rh_select usa app.current_clinica_id (wrong) 
--      → deve usar current_user_clinica_id_optional()
--   4. Gestor sem policies em lotes_avaliacao, avaliacoes e laudos
--   5. RH sem policy em laudos
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Corrigir avaliacoes_rh_select: app.current_clinica_id → função correta
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS avaliacoes_rh_select ON public.avaliacoes;

CREATE POLICY avaliacoes_rh_select ON public.avaliacoes
  FOR SELECT
  USING (
    public.current_user_perfil() = 'rh'
    AND public.validate_rh_clinica()
    AND lote_id IN (
      SELECT la.id
      FROM public.lotes_avaliacao la
      WHERE la.clinica_id = public.current_user_clinica_id_optional()
    )
  );

COMMENT ON POLICY avaliacoes_rh_select ON public.avaliacoes
  IS 'RH vê apenas avaliações de lotes da sua clínica';

-- ---------------------------------------------------------------------------
-- 2. Corrigir policy_lotes_admin: app.current_role → app.current_user_perfil
--    Admin vê metadados de lotes (sem conteúdo de respostas/resultados)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_lotes_admin ON public.lotes_avaliacao;

CREATE POLICY policy_lotes_admin ON public.lotes_avaliacao
  FOR SELECT
  USING (
    current_setting('app.current_user_perfil', true) = 'admin'
  );

COMMENT ON POLICY policy_lotes_admin ON public.lotes_avaliacao
  IS 'Admin vê metadados de todos os lotes (RBAC admin)';

-- ---------------------------------------------------------------------------
-- 3. Corrigir policy_lotes_emissor: app.current_role → current_user_perfil()
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_lotes_emissor ON public.lotes_avaliacao;

CREATE POLICY policy_lotes_emissor ON public.lotes_avaliacao
  FOR SELECT
  USING (
    public.current_user_perfil() = 'emissor'
    AND status IN ('pendente', 'em_processamento', 'concluido')
  );

COMMENT ON POLICY policy_lotes_emissor ON public.lotes_avaliacao
  IS 'Emissor acessa lotes prontos para emissão/já emitidos';

-- ---------------------------------------------------------------------------
-- 4. Remover policy_laudos_admin
--    Admin é intencionalmente bloqueado de laudos (laudos_block_admin RESTRICTIVE).
--    A policy incorreta usava app.current_role (never set) e se tornaria perigosa
--    se o setting fosse adicionado no futuro.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_laudos_admin ON public.laudos;

-- ---------------------------------------------------------------------------
-- 5. Criar lotes_gestor_select: gestor vê lotes da sua entidade
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS lotes_gestor_select ON public.lotes_avaliacao;

CREATE POLICY lotes_gestor_select ON public.lotes_avaliacao
  FOR SELECT
  USING (
    current_setting('app.current_user_perfil', true) = 'gestor'
    AND entidade_id IS NOT NULL
    AND entidade_id = public.current_user_entidade_id_optional()
  );

COMMENT ON POLICY lotes_gestor_select ON public.lotes_avaliacao
  IS 'Gestor de entidade vê apenas lotes da sua entidade';

-- ---------------------------------------------------------------------------
-- 6. Criar avaliacoes_gestor_select: gestor vê avaliações da sua entidade
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS avaliacoes_gestor_select ON public.avaliacoes;

CREATE POLICY avaliacoes_gestor_select ON public.avaliacoes
  FOR SELECT
  USING (
    current_setting('app.current_user_perfil', true) = 'gestor'
    AND lote_id IN (
      SELECT id
      FROM public.lotes_avaliacao
      WHERE entidade_id IS NOT NULL
        AND entidade_id = public.current_user_entidade_id_optional()
    )
  );

COMMENT ON POLICY avaliacoes_gestor_select ON public.avaliacoes
  IS 'Gestor de entidade vê apenas avaliações de lotes da sua entidade';

-- ---------------------------------------------------------------------------
-- 7. Criar laudos_rh_select: RH vê laudos emitidos para lotes da sua clínica
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS laudos_rh_select ON public.laudos;

CREATE POLICY laudos_rh_select ON public.laudos
  FOR SELECT
  USING (
    public.current_user_perfil() = 'rh'
    AND public.validate_rh_clinica()
    AND lote_id IN (
      SELECT id
      FROM public.lotes_avaliacao
      WHERE clinica_id = public.current_user_clinica_id_optional()
    )
  );

COMMENT ON POLICY laudos_rh_select ON public.laudos
  IS 'RH vê laudos de lotes da sua clínica';

-- ---------------------------------------------------------------------------
-- 8. Criar laudos_gestor_select: gestor vê laudos emitidos para sua entidade
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS laudos_gestor_select ON public.laudos;

CREATE POLICY laudos_gestor_select ON public.laudos
  FOR SELECT
  USING (
    current_setting('app.current_user_perfil', true) = 'gestor'
    AND lote_id IN (
      SELECT id
      FROM public.lotes_avaliacao
      WHERE entidade_id IS NOT NULL
        AND entidade_id = public.current_user_entidade_id_optional()
    )
  );

COMMENT ON POLICY laudos_gestor_select ON public.laudos
  IS 'Gestor de entidade vê laudos de lotes da sua entidade';

COMMIT;
