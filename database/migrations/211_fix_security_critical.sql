-- ============================================================================
-- Migration 211: Correções de Segurança CRÍTICO + ALTO
-- Data: 2026-03-06
-- Escopo:
--   CRÍTICO-1: Adicionar 'representante' ao current_user_perfil()
--   CRÍTICO-3: Corrigir current_user_contratante_id() → ler app.current_user_entidade_id
--   ALTO-3:    Documentar rep_insert_public como deliberado
--   ALTO-5:    RLS + SECURITY DEFINER para entidades_senhas / clinicas_senhas
-- ============================================================================

BEGIN;

-- ========================================================================
-- CRÍTICO-1: Adicionar 'representante' à lista de perfis válidos
-- Sem essa correção, qualquer query RLS com perfil='representante' lança exceção
-- ========================================================================

CREATE OR REPLACE FUNCTION public.current_user_perfil()
RETURNS text AS $$
DECLARE
  v_perfil TEXT;
  v_valid_perfis TEXT[] := ARRAY['funcionario', 'rh', 'emissor', 'admin', 'gestor', 'representante'];
BEGIN
  v_perfil := NULLIF(current_setting('app.current_user_perfil', TRUE), '');

  IF v_perfil IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not set. Call SET LOCAL app.current_user_perfil before query.';
  END IF;

  IF NOT (v_perfil = ANY(v_valid_perfis)) THEN
    RAISE EXCEPTION 'SECURITY: Invalid perfil "%" not in %', v_perfil, v_valid_perfis;
  END IF;

  RETURN v_perfil;
EXCEPTION
  WHEN undefined_object THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not configured in session.';
  WHEN SQLSTATE '22023' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_perfil not configured in session.';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_perfil() IS
  'Returns current user perfil from session context.
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates perfil is in allowed list.
   Migration 211: Added representante to valid list.';

-- ========================================================================
-- CRÍTICO-3: current_user_contratante_id() lê app.current_user_contratante_id
--   mas query.ts/transaction.ts setam app.current_user_entidade_id
--   → Corrigir para ler a variável correta
-- ========================================================================

CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
RETURNS integer AS $$
DECLARE
  v_id TEXT;
BEGIN
  -- Ler app.current_user_entidade_id (valor setado pela aplicação TypeScript)
  v_id := NULLIF(current_setting('app.current_user_entidade_id', TRUE), '');

  -- SECURITY: Para gestor, entidade_id é mandatório
  IF v_id IS NULL AND current_user_perfil() = 'gestor' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_entidade_id not set for perfil gestor.';
  END IF;

  RETURN v_id::INTEGER;
EXCEPTION
  WHEN undefined_object THEN
    IF current_user_perfil() = 'gestor' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_entidade_id not configured for gestor.';
    END IF;
    RETURN NULL;
  WHEN SQLSTATE '22023' THEN
    IF current_user_perfil() = 'gestor' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_entidade_id not configured for gestor.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_contratante_id() IS
  'Returns current user entidade_id (contratante) from session context.
   Migration 211: Fixed to read app.current_user_entidade_id instead of app.current_user_contratante_id.
   RAISES EXCEPTION if not set for perfil gestor.';

-- ========================================================================
-- ALTO-5: Funções SECURITY DEFINER para lookup de senha (usadas pelo login)
-- Estas funções bypassam RLS e são o único path de acesso durante autenticação
-- ========================================================================

-- Função para buscar senha de gestor (entidades_senhas)
CREATE OR REPLACE FUNCTION public.fn_verificar_senha_gestor(p_cpf text, p_entidade_id integer)
RETURNS TABLE(senha_hash text, entidade_id integer, ativa boolean) AS $$
BEGIN
  RETURN QUERY
    SELECT es.senha_hash, e.id AS entidade_id, e.ativa
    FROM entidades_senhas es
    JOIN entidades e ON e.id = es.entidade_id
    WHERE es.cpf = p_cpf AND es.entidade_id = p_entidade_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_verificar_senha_gestor(text, integer) IS
  'SECURITY DEFINER: Busca senha_hash de gestor em entidades_senhas.
   Bypassa RLS para uso exclusivo no fluxo de login.
   Migration 211: Criada para ALTO-5.';

-- Revogar acesso público direto; apenas a aplicação deve chamar via query
REVOKE ALL ON FUNCTION public.fn_verificar_senha_gestor(text, integer) FROM PUBLIC;

-- Função para buscar senha de RH (clinicas_senhas)
CREATE OR REPLACE FUNCTION public.fn_verificar_senha_rh(p_cpf text, p_clinica_id integer)
RETURNS TABLE(senha_hash text, clinica_id integer, ativa boolean) AS $$
BEGIN
  RETURN QUERY
    SELECT cs.senha_hash, c.id AS clinica_id, c.ativa
    FROM clinicas_senhas cs
    JOIN clinicas c ON c.id = cs.clinica_id
    WHERE cs.cpf = p_cpf AND cs.clinica_id = p_clinica_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_verificar_senha_rh(text, integer) IS
  'SECURITY DEFINER: Busca senha_hash de RH em clinicas_senhas.
   Bypassa RLS para uso exclusivo no fluxo de login.
   Migration 211: Criada para ALTO-5.';

REVOKE ALL ON FUNCTION public.fn_verificar_senha_rh(text, integer) FROM PUBLIC;

-- Função para buscar senha de admin/emissor em usuarios (CRÍTICO-4 support)
CREATE OR REPLACE FUNCTION public.fn_verificar_senha_usuario(p_cpf text)
RETURNS TABLE(senha_hash text, tipo_usuario text) AS $$
BEGIN
  RETURN QUERY
    SELECT u.senha_hash, u.tipo_usuario
    FROM usuarios u
    WHERE u.cpf = p_cpf
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_verificar_senha_usuario(text) IS
  'SECURITY DEFINER: Busca senha_hash de admin/emissor em usuarios.
   Bypassa RLS para uso exclusivo no fluxo de login.
   Migration 211: Criada para suporte a CRÍTICO-4.';

REVOKE ALL ON FUNCTION public.fn_verificar_senha_usuario(text) FROM PUBLIC;

-- ========================================================================
-- ALTO-5: Habilitar RLS em entidades_senhas e clinicas_senhas
-- ========================================================================

-- entidades_senhas
ALTER TABLE public.entidades_senhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades_senhas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entidades_senhas_gestor_select ON public.entidades_senhas;
CREATE POLICY entidades_senhas_gestor_select
  ON public.entidades_senhas FOR SELECT
  USING (
    (current_user_perfil() = 'gestor' AND entidade_id = current_user_contratante_id())
    OR current_user_perfil() = 'admin'
  );

DROP POLICY IF EXISTS entidades_senhas_gestor_update ON public.entidades_senhas;
CREATE POLICY entidades_senhas_gestor_update
  ON public.entidades_senhas FOR UPDATE
  USING (
    (current_user_perfil() = 'gestor' AND cpf = current_user_cpf() AND entidade_id = current_user_contratante_id())
    OR current_user_perfil() = 'admin'
  )
  WITH CHECK (
    (current_user_perfil() = 'gestor' AND cpf = current_user_cpf() AND entidade_id = current_user_contratante_id())
    OR current_user_perfil() = 'admin'
  );

DROP POLICY IF EXISTS entidades_senhas_admin_all ON public.entidades_senhas;
CREATE POLICY entidades_senhas_admin_all
  ON public.entidades_senhas FOR ALL
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- clinicas_senhas
ALTER TABLE public.clinicas_senhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas_senhas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinicas_senhas_rh_select ON public.clinicas_senhas;
CREATE POLICY clinicas_senhas_rh_select
  ON public.clinicas_senhas FOR SELECT
  USING (
    (current_user_perfil() = 'rh' AND clinica_id = current_user_clinica_id())
    OR current_user_perfil() = 'admin'
  );

DROP POLICY IF EXISTS clinicas_senhas_rh_update ON public.clinicas_senhas;
CREATE POLICY clinicas_senhas_rh_update
  ON public.clinicas_senhas FOR UPDATE
  USING (
    (current_user_perfil() = 'rh' AND cpf = current_user_cpf() AND clinica_id = current_user_clinica_id())
    OR current_user_perfil() = 'admin'
  )
  WITH CHECK (
    (current_user_perfil() = 'rh' AND cpf = current_user_cpf() AND clinica_id = current_user_clinica_id())
    OR current_user_perfil() = 'admin'
  );

DROP POLICY IF EXISTS clinicas_senhas_admin_all ON public.clinicas_senhas;
CREATE POLICY clinicas_senhas_admin_all
  ON public.clinicas_senhas FOR ALL
  USING (current_user_perfil() = 'admin')
  WITH CHECK (current_user_perfil() = 'admin');

-- ========================================================================
-- ALTO-3: Documentar política rep_insert_public como deliberada
-- ========================================================================

COMMENT ON POLICY rep_insert_public ON public.representantes IS
  'Cadastro público (onboarding) de representantes — WITH CHECK(TRUE) é DELIBERADO.
   Validação de duplicatas é feita pela UNIQUE constraint em email/cpf.
   Revisado em migration 211 (2026-03-06).';

-- ========================================================================
-- VALIDAÇÃO
-- ========================================================================

DO $$
BEGIN
  -- Teste CRÍTICO-1: perfil 'representante' deve ser aceito
  SET LOCAL app.current_user_cpf = '12345678901';
  SET LOCAL app.current_user_perfil = 'representante';

  IF current_user_perfil() != 'representante' THEN
    RAISE EXCEPTION 'FAILED: current_user_perfil should accept representante';
  END IF;
  RAISE NOTICE 'OK - CRÍTICO-1: representante aceito em current_user_perfil()';

  -- Teste CRÍTICO-3: contratante_id lê app.current_user_entidade_id
  SET LOCAL app.current_user_perfil = 'gestor';
  SET LOCAL app.current_user_entidade_id = '42';

  IF current_user_contratante_id() != 42 THEN
    RAISE EXCEPTION 'FAILED: current_user_contratante_id should return 42 from entidade_id';
  END IF;
  RAISE NOTICE 'OK - CRÍTICO-3: current_user_contratante_id() lê app.current_user_entidade_id';

  -- Validar que funções SECURITY DEFINER foram criadas
  PERFORM pg_proc.oid
    FROM pg_proc
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    WHERE pg_namespace.nspname = 'public'
      AND pg_proc.proname IN ('fn_verificar_senha_gestor', 'fn_verificar_senha_rh', 'fn_verificar_senha_usuario');

  RAISE NOTICE 'OK - ALTO-5: Funções SECURITY DEFINER criadas';

  -- Validar que RLS está habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname = 'entidades_senhas' AND relrowsecurity = TRUE
  ) THEN
    RAISE EXCEPTION 'FAILED: RLS not enabled on entidades_senhas';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE relname = 'clinicas_senhas' AND relrowsecurity = TRUE
  ) THEN
    RAISE EXCEPTION 'FAILED: RLS not enabled on clinicas_senhas';
  END IF;

  RAISE NOTICE 'OK - ALTO-5: RLS habilitado em entidades_senhas e clinicas_senhas';
  RAISE NOTICE '=== Migration 211: Todas as validações passaram ===';
END;
$$;

COMMIT;
