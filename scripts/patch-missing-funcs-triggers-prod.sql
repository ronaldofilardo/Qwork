-- =============================================================================
-- Patch: Funções e Triggers ausentes em neondb_v2 (PROD)
-- Fonte: neondb_staging
-- Criado em: 2025-04-26
-- =============================================================================
-- Funções faltantes:
--   1. set_updated_at
--   2. current_user_contratante_id (deprecated mas necessária para compatibilidade)
--   3. fn_check_cpf_unico_sistema
--   4. fn_trigger_lead_cpf_unico
--   5. fn_trigger_representante_cpf_unico
--   6. fn_trigger_usuario_cpf_unico
-- Triggers faltantes (migration 1229 — CPF único cross-perfil):
--   7. tg_representante_cpf_unico on representantes
--   8. tg_lead_cpf_unico on representantes_cadastro_leads
--   9. tg_usuario_cpf_unico on usuarios
-- =============================================================================

-- 1. set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      NEW.atualizado_em = NOW();
      RETURN NEW;
    END;
$function$;

-- 2. current_user_contratante_id (DEPRECATED — mantida por compatibilidade)
CREATE OR REPLACE FUNCTION public.current_user_contratante_id()
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
    -- DEPRECATED: Use current_user_entidade_id() para fluxo entidade
    -- ou clinica_id direto na sessão para fluxo clínica.
    -- Esta função será removida em release futura.
    RAISE WARNING '[DEPRECATED] current_user_contratante_id() chamada — use current_user_entidade_id()';
    RETURN NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER;
END;
$function$;

-- 3. fn_check_cpf_unico_sistema
CREATE OR REPLACE FUNCTION public.fn_check_cpf_unico_sistema(
  p_cpf text,
  p_ignorar_rep_id integer DEFAULT NULL::integer,
  p_ignorar_lead_id uuid DEFAULT NULL::uuid,
  p_ignorar_usuario_id integer DEFAULT NULL::integer
)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_tipo_usuario TEXT;
BEGIN
  -- 1. representantes.cpf (representante PF)
  PERFORM id
  FROM representantes
  WHERE cpf = p_cpf
    AND (p_ignorar_rep_id IS NULL OR id <> p_ignorar_rep_id)
  LIMIT 1;
  IF FOUND THEN RETURN 'representante'; END IF;

  -- 2. representantes.cpf_responsavel_pj (responsável representante PJ)
  PERFORM id
  FROM representantes
  WHERE cpf_responsavel_pj = p_cpf
    AND (p_ignorar_rep_id IS NULL OR id <> p_ignorar_rep_id)
  LIMIT 1;
  IF FOUND THEN RETURN 'representante_pj'; END IF;

  -- 3. lead PF em análise (status ativo)
  PERFORM id
  FROM representantes_cadastro_leads
  WHERE cpf = p_cpf
    AND status NOT IN ('rejeitado', 'convertido')
    AND (p_ignorar_lead_id IS NULL OR id <> p_ignorar_lead_id)
  LIMIT 1;
  IF FOUND THEN RETURN 'representante_lead'; END IF;

  -- 4. lead PJ em análise (cpf_responsavel ativo)
  PERFORM id
  FROM representantes_cadastro_leads
  WHERE cpf_responsavel = p_cpf
    AND status NOT IN ('rejeitado', 'convertido')
    AND (p_ignorar_lead_id IS NULL OR id <> p_ignorar_lead_id)
  LIMIT 1;
  IF FOUND THEN RETURN 'representante_lead_pj'; END IF;

  -- 5. usuarios vendedor / gestor / rh ativos
  SELECT tipo_usuario::TEXT INTO v_tipo_usuario
  FROM usuarios
  WHERE cpf = p_cpf
    AND tipo_usuario IN ('vendedor', 'gestor', 'rh')
    AND ativo = true
    AND (p_ignorar_usuario_id IS NULL OR id <> p_ignorar_usuario_id)
  LIMIT 1;
  IF FOUND THEN RETURN v_tipo_usuario; END IF;

  RETURN NULL;
END;
$function$;

-- 4. fn_trigger_lead_cpf_unico
CREATE OR REPLACE FUNCTION public.fn_trigger_lead_cpf_unico()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_conflito TEXT;
BEGIN
  -- Leads rejeitados/convertidos não participam da restrição
  IF NEW.status IN ('rejeitado', 'convertido') THEN
    RETURN NEW;
  END IF;

  -- Verificar cpf do lead PF
  IF NEW.cpf IS NOT NULL THEN
    v_conflito := fn_check_cpf_unico_sistema(NEW.cpf::TEXT, NULL, NEW.id, NULL);
    IF v_conflito IS NOT NULL THEN
      RAISE EXCEPTION
        'CPF do lead já cadastrado no sistema como %. Operação bloqueada por regra de negócio. (cpf=%)',
        v_conflito, NEW.cpf
        USING ERRCODE = '23505',
              CONSTRAINT = 'cpf_unico_sistema';
    END IF;
  END IF;

  -- Verificar cpf_responsavel do lead PJ
  IF NEW.cpf_responsavel IS NOT NULL THEN
    v_conflito := fn_check_cpf_unico_sistema(NEW.cpf_responsavel::TEXT, NULL, NEW.id, NULL);
    IF v_conflito IS NOT NULL THEN
      RAISE EXCEPTION
        'CPF responsável do lead já cadastrado no sistema como %. Operação bloqueada por regra de negócio. (cpf=%)',
        v_conflito, NEW.cpf_responsavel
        USING ERRCODE = '23505',
              CONSTRAINT = 'cpf_unico_sistema';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. fn_trigger_representante_cpf_unico
CREATE OR REPLACE FUNCTION public.fn_trigger_representante_cpf_unico()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_conflito TEXT;
BEGIN
  -- Verificar cpf (representante PF)
  IF NEW.cpf IS NOT NULL THEN
    v_conflito := fn_check_cpf_unico_sistema(NEW.cpf::TEXT, NEW.id, NULL, NULL);
    IF v_conflito IS NOT NULL THEN
      RAISE EXCEPTION
        'CPF já cadastrado no sistema como %. Operação bloqueada por regra de negócio. (cpf=%)',
        v_conflito, NEW.cpf
        USING ERRCODE = '23505',
              CONSTRAINT = 'cpf_unico_sistema';
    END IF;
  END IF;

  -- Verificar cpf_responsavel_pj (representante PJ)
  IF NEW.cpf_responsavel_pj IS NOT NULL THEN
    v_conflito := fn_check_cpf_unico_sistema(NEW.cpf_responsavel_pj::TEXT, NEW.id, NULL, NULL);
    IF v_conflito IS NOT NULL THEN
      RAISE EXCEPTION
        'CPF responsável PJ já cadastrado no sistema como %. Operação bloqueada por regra de negócio. (cpf=%)',
        v_conflito, NEW.cpf_responsavel_pj
        USING ERRCODE = '23505',
              CONSTRAINT = 'cpf_unico_sistema';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. fn_trigger_usuario_cpf_unico
CREATE OR REPLACE FUNCTION public.fn_trigger_usuario_cpf_unico()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_conflito TEXT;
BEGIN
  -- Só verificar para tipos bloqueantes
  IF NEW.tipo_usuario::TEXT NOT IN ('vendedor', 'gestor', 'rh') THEN
    RETURN NEW;
  END IF;

  -- Usuários inativos não participam da restrição
  IF NEW.ativo = false THEN
    RETURN NEW;
  END IF;

  v_conflito := fn_check_cpf_unico_sistema(NEW.cpf::TEXT, NULL, NULL, NEW.id);
  IF v_conflito IS NOT NULL THEN
    RAISE EXCEPTION
      'CPF já cadastrado no sistema como %. Operação bloqueada por regra de negócio. (cpf=%)',
      v_conflito, NEW.cpf
      USING ERRCODE = '23505',
            CONSTRAINT = 'cpf_unico_sistema';
  END IF;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- TRIGGERS (migration 1229 — CPF único cross-perfil)
-- =============================================================================

-- 7. tg_representante_cpf_unico
DROP TRIGGER IF EXISTS tg_representante_cpf_unico ON public.representantes;
CREATE TRIGGER tg_representante_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, cpf_responsavel_pj
  ON public.representantes
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_representante_cpf_unico();

-- 8. tg_lead_cpf_unico
DROP TRIGGER IF EXISTS tg_lead_cpf_unico ON public.representantes_cadastro_leads;
CREATE TRIGGER tg_lead_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, cpf_responsavel, status
  ON public.representantes_cadastro_leads
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_lead_cpf_unico();

-- 9. tg_usuario_cpf_unico
DROP TRIGGER IF EXISTS tg_usuario_cpf_unico ON public.usuarios;
CREATE TRIGGER tg_usuario_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, tipo_usuario, ativo
  ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_trigger_usuario_cpf_unico();

-- =============================================================================
-- Verificação
-- =============================================================================
SELECT
  p.proname AS funcao,
  'OK' AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'set_updated_at',
    'current_user_contratante_id',
    'fn_check_cpf_unico_sistema',
    'fn_trigger_lead_cpf_unico',
    'fn_trigger_representante_cpf_unico',
    'fn_trigger_usuario_cpf_unico'
  )
ORDER BY p.proname;

SELECT
  t.tgname AS trigger_name,
  c.relname AS tabela,
  'OK' AS status
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND t.tgname IN ('tg_representante_cpf_unico','tg_lead_cpf_unico','tg_usuario_cpf_unico')
  AND NOT t.tgisinternal
ORDER BY t.tgname;
