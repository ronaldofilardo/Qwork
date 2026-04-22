-- ============================================================================
-- MIGRATION 1229: CPF único no sistema — trigger de banco de dados
-- Data: 2026-04-22
--
-- Requisito de sistema: Um CPF não pode ser registrado simultaneamente como
-- representante (PF ou responsável PJ), lead ativo, vendedor, gestor ou rh.
-- A tabela `funcionarios` é EXPLICITAMENTE excluída desta regra.
-- Os perfis admin, emissor, suporte e comercial também são excluídos.
--
-- Tabelas protegidas por triggers:
--   representantes              → cpf, cpf_responsavel_pj
--   representantes_cadastro_leads → cpf, cpf_responsavel (status ativo)
--   usuarios                    → cpf (tipo vendedor / gestor / rh, ativo=true)
--
-- Esta migration complementa a verificação em lib/validators/cpf-unico.ts.
-- O DB é a última linha de defesa; a app deve checar ANTES para dar erros amigáveis.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FUNÇÃO HELPER: fn_check_cpf_unico_sistema
-- Verifica se o CPF já existe em algum perfil bloqueante.
-- Retorna: nome do conflito (TEXT) ou NULL se disponível.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_check_cpf_unico_sistema(
  p_cpf               TEXT,
  p_ignorar_rep_id    INTEGER DEFAULT NULL,
  p_ignorar_lead_id   UUID    DEFAULT NULL,
  p_ignorar_usuario_id INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
$$;

COMMENT ON FUNCTION fn_check_cpf_unico_sistema(TEXT, INTEGER, UUID, INTEGER) IS
  'Requisito de sistema: verifica unicidade cross-table de CPF.
   Retorna o tipo de conflito encontrado ou NULL se disponível.
   Usada pelos triggers tg_representante_cpf_unico, tg_lead_cpf_unico e tg_usuario_cpf_unico.';

-- ============================================================================
-- 2. TRIGGER FUNCTION: representantes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trigger_representante_cpf_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- ============================================================================
-- 3. TRIGGER FUNCTION: representantes_cadastro_leads
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trigger_lead_cpf_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- ============================================================================
-- 4. TRIGGER FUNCTION: usuarios (vendedor / gestor / rh)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_trigger_usuario_cpf_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- ============================================================================
-- 5. INSTALAR TRIGGERS (DROP IF EXISTS para idempotência)
-- ============================================================================

-- representantes
DROP TRIGGER IF EXISTS tg_representante_cpf_unico ON representantes;
CREATE TRIGGER tg_representante_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, cpf_responsavel_pj
  ON representantes
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_representante_cpf_unico();

-- representantes_cadastro_leads
DROP TRIGGER IF EXISTS tg_lead_cpf_unico ON representantes_cadastro_leads;
CREATE TRIGGER tg_lead_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, cpf_responsavel, status
  ON representantes_cadastro_leads
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_lead_cpf_unico();

-- usuarios
DROP TRIGGER IF EXISTS tg_usuario_cpf_unico ON usuarios;
CREATE TRIGGER tg_usuario_cpf_unico
  BEFORE INSERT OR UPDATE OF cpf, tipo_usuario, ativo
  ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_usuario_cpf_unico();

COMMIT;
