-- ============================================================================
-- 01-foundation.sql
-- Tipos (ENUMs), funções compartilhadas (RLS/session), tabelas de infra/auditoria
-- ============================================================================

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


--
-- Name: backups; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA backups;


ALTER SCHEMA backups OWNER TO postgres;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';



--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'Funções criptográficas para PostgreSQL (hash, criptografia, geração de salt)';



--
-- Name: idioma_suportado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.idioma_suportado AS ENUM (
    'pt_BR',
    'en_US',
    'es_ES'
);


ALTER TYPE public.idioma_suportado OWNER TO postgres;


--
-- Name: motivo_congelamento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.motivo_congelamento AS ENUM (
    'vinculo_encerrado',
    'rep_suspenso',
    'aguardando_revisao'
);


ALTER TYPE public.motivo_congelamento OWNER TO postgres;


--
-- Name: nivel_cargo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.nivel_cargo_enum AS ENUM (
    'operacional',
    'gestao'
);


ALTER TYPE public.nivel_cargo_enum OWNER TO postgres;


--
-- Name: perfil_usuario_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.perfil_usuario_enum AS ENUM (
    'funcionario',
    'rh',
    'admin',
    'emissor',
    'suporte',
    'comercial',
    'vendedor',
    'gestor'  -- adicionado migration 1220
);


ALTER TYPE public.perfil_usuario_enum OWNER TO postgres;


--
-- Name: TYPE perfil_usuario_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.perfil_usuario_enum IS 'Perfis válidos de usuários no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionários), admin (administração geral), emissor (emite laudos)';



--
-- Name: prioridade_notificacao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.prioridade_notificacao AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
);


ALTER TYPE public.prioridade_notificacao OWNER TO postgres;


--
-- Name: status_aprovacao_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_aprovacao_enum AS ENUM (
    'pendente',
    'aprovado',
    'rejeitado',
    'em_reanalise',
    'aguardando_pagamento',
    'aguardando_contrato',
    'contrato_gerado',
    'pagamento_confirmado',
    'inativa',
    'analise',
    'aguardando_aceite',
    'aguardando_aceite_contrato'
);


ALTER TYPE public.status_aprovacao_enum OWNER TO postgres;


--
-- Name: status_avaliacao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_avaliacao AS ENUM (
    'pendente',
    'em_andamento',
    'concluida',
    'liberada',
    'iniciada'
);


ALTER TYPE public.status_avaliacao OWNER TO postgres;


--
-- Name: TYPE status_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: iniciada, em_andamento, concluida (feminino), inativada. Constraint aceita também concluido (retrocompatibilidade).';



--
-- Name: status_avaliacao_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_avaliacao_enum AS ENUM (
    'iniciada',
    'em_andamento',
    'concluida',
    'inativada'
);


ALTER TYPE public.status_avaliacao_enum OWNER TO postgres;


--
-- Name: TYPE status_avaliacao_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliações: iniciada (criada mas não respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';



--
-- Name: status_comissao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_comissao AS ENUM (
    'retida',
    'aprovada',
    'congelada_rep_suspenso',
    'congelada_aguardando_admin',
    'liberada',
    'paga',
    'cancelada'
);


ALTER TYPE public.status_comissao OWNER TO postgres;


--
-- Name: status_laudo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_laudo AS ENUM (
    'rascunho',
    'emitido',
    'enviado'
);


ALTER TYPE public.status_laudo OWNER TO postgres;


--
-- Name: TYPE status_laudo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_laudo IS 'Status válidos: rascunho (editando), emitido (pronto), enviado (entregue)';



--
-- Name: status_laudo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_laudo_enum AS ENUM (
    'emitido',
    'enviado'
);


ALTER TYPE public.status_laudo_enum OWNER TO postgres;


--
-- Name: TYPE status_laudo_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_laudo_enum IS 'Status de laudos: emitido (gerado automaticamente), enviado (enviado ao cliente)';



--
-- Name: status_lead; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_lead AS ENUM (
    'pendente',
    'convertido',
    'expirado',
    'aprovado',
    'rejeitado'
);


ALTER TYPE public.status_lead OWNER TO postgres;


--
-- Name: status_lote; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_lote AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido',
    'rascunho'
);


ALTER TYPE public.status_lote OWNER TO postgres;


--
-- Name: TYPE status_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_lote IS 'Status válidos: rascunho (criando), ativo (em uso), concluido (fechado)';



--
-- Name: status_lote_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_lote_enum AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido'
);


ALTER TYPE public.status_lote_enum OWNER TO postgres;


--
-- Name: TYPE status_lote_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado)';



--
-- Name: status_pagamento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_pagamento AS ENUM (
    'aguardando_cobranca',
    'aguardando_pagamento',
    'pago',
    'expirado'
);


ALTER TYPE public.status_pagamento OWNER TO postgres;


--
-- Name: status_representante; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_representante AS ENUM (
    'ativo',
    'apto_pendente',
    'apto',
    'apto_bloqueado',
    'suspenso',
    'desativado',
    'rejeitado'
);


ALTER TYPE public.status_representante OWNER TO postgres;


--
-- Name: status_vinculo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_vinculo AS ENUM (
    'ativo',
    'inativo',
    'suspenso',
    'encerrado'
);


ALTER TYPE public.status_vinculo OWNER TO postgres;


--
-- Name: tipo_conversao_lead; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_conversao_lead AS ENUM (
    'link_representante',
    'codigo_representante',
    'verificacao_cnpj'
);


ALTER TYPE public.tipo_conversao_lead OWNER TO postgres;


--
-- Name: tipo_lote_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_lote_enum AS ENUM (
    'completo',
    'operacional',
    'gestao'
);


ALTER TYPE public.tipo_lote_enum OWNER TO postgres;


--
-- Name: TYPE tipo_lote_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.tipo_lote_enum IS 'Tipo de lote: completo (todos funcionários), operacional (apenas operacionais), gestao (apenas gestores)';



--
-- Name: tipo_notificacao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_notificacao AS ENUM (
    'pre_cadastro_criado',
    'valor_definido',
    'contrato_aceito',
    'pagamento_confirmado',
    'contratacao_ativa',
    'rejeicao_admin',
    'cancelamento_gestor',
    'sla_excedido',
    'alerta_geral',
    'emissao_solicitada_sucesso',
    'laudo_emitido_automaticamente',
    'parcela_pendente',
    'parcela_vencendo',
    'quitacao_completa',
    'lote_concluido_aguardando_laudo',
    'laudo_emitido',
    'relatorio_semanal_pendencias',
    'laudo_enviado',
    'recibo_emitido',
    'recibo_gerado_retroativo'
);


ALTER TYPE public.tipo_notificacao OWNER TO postgres;


--
-- Name: TYPE tipo_notificacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.tipo_notificacao IS 'Tipos de notificação suportados no sistema. laudo_enviado é disparado após PDF + hash + status=enviado';



--
-- Name: tipo_pessoa_representante; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_pessoa_representante AS ENUM (
    'pf',
    'pj'
);


ALTER TYPE public.tipo_pessoa_representante OWNER TO postgres;


--
-- Name: usuario_tipo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor',
    'rh',
    'admin',
    'emissor',
    'suporte',
    'comercial',
    'vendedor'
);


ALTER TYPE public.usuario_tipo_enum OWNER TO postgres;


--
-- Name: atualizar_data_modificacao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_data_modificacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_data_modificacao() OWNER TO postgres;


--
-- Name: audit_bypassrls_session(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_bypassrls_session() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Log session start with BYPASSRLS role
  IF current_user IN ('dba_maintenance', 'postgres', 'neondb_owner') THEN
    INSERT INTO audit_logs (
      user_cpf,
      user_perfil,
      action,
      resource,
      details,
      ip_address
    ) VALUES (
      current_user,
      'dba_bypassrls',
      'SESSION_START',
      'BYPASSRLS',
      'Role: ' || current_user || ', Database: ' || current_database(),
      inet_client_addr()
    );
  END IF;
END;
$$;


ALTER FUNCTION public.audit_bypassrls_session() OWNER TO postgres;


--
-- Name: FUNCTION audit_bypassrls_session(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_bypassrls_session() IS 'Audits BYPASSRLS session starts. Call this at beginning of maintenance scripts.';



--
-- Name: audit_log_with_context(character varying, character varying, character varying, text, character, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying DEFAULT NULL::character varying, p_details text DEFAULT NULL::text, p_user_cpf character DEFAULT NULL::bpchar, p_clinica_id integer DEFAULT NULL::integer, p_contratante_id integer DEFAULT NULL::integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_log_id INTEGER;
    v_ip_text TEXT;
    v_ip_inet INET;
BEGIN
    v_ip_text := NULLIF(current_setting('app.current_user_ip', true), '');
    IF v_ip_text IS NOT NULL THEN
        -- Tentativa de conversão segura para inet
        BEGIN
            v_ip_inet := v_ip_text::inet;
        EXCEPTION WHEN OTHERS THEN
            v_ip_inet := NULL;
        END;
    ELSE
        v_ip_inet := NULL;
    END IF;

    INSERT INTO audit_logs (
        resource,
        action,
        resource_id,
        details,
        user_cpf,
        clinica_id,
        contratante_id,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_resource,
        p_action,
        p_resource_id,
        p_details,
        COALESCE(p_user_cpf, NULLIF(current_setting('app.current_user_cpf', true), '')),
        COALESCE(p_clinica_id, NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER),
        COALESCE(p_contratante_id, NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER),
        v_ip_inet,
        NULLIF(current_setting('app.current_user_agent', true), ''),
        NOW()
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;


ALTER FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) OWNER TO postgres;


--
-- Name: FUNCTION audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) IS 'Registra ação no audit_logs incluindo contexto completo (user, clínica, contratante). Faz casting seguro do IP (inet).';



--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_trigger_func() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, old_data, details
        ) VALUES (
            NULLIF(current_user_cpf(), ''),
            NULLIF(current_user_perfil(), ''),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::TEXT,
            row_to_json(OLD),
            'Record deleted'
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, details
        ) VALUES (
            NULLIF(current_user_cpf(), ''),
            NULLIF(current_user_perfil(), ''),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            row_to_json(OLD),
            row_to_json(NEW),
            'Record updated'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, new_data, details
        ) VALUES (
            NULLIF(current_user_cpf(), ''),
            NULLIF(current_user_perfil(), ''),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            row_to_json(NEW),
            'Record created'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.audit_trigger_func() OWNER TO postgres;


--
-- Name: FUNCTION audit_trigger_func(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger de auditoria que permite user_cpf e user_perfil NULL quando contexto não está setado (usa NULLIF para converter string vazia em NULL)';



--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_trigger_function() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_usuario_cpf VARCHAR(11);
    v_usuario_perfil VARCHAR(30);
    v_registro_id VARCHAR(100);
BEGIN
    -- Tentar obter contexto da sessão; se não disponível, usar valores de fallback
    BEGIN
        v_usuario_cpf := current_setting('app.current_user_cpf', true);
        v_usuario_perfil := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_cpf := 'SYSTEM';
        v_usuario_perfil := 'SYSTEM';
    END;

    -- Determinar registro id (OLD/NEW)
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id::TEXT;
    ELSE
        v_registro_id := NEW.id::TEXT;
    END IF;

    -- Inserir no audit_logs com campos compatíveis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, COALESCE(v_usuario_cpf, 'SYSTEM'), COALESCE(v_usuario_perfil, 'SYSTEM'), row_to_json(OLD)::JSONB);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.audit_trigger_function() OWNER TO postgres;


--
-- Name: FUNCTION audit_trigger_function(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com fallback quando contexto da sessão não estiver disponível';



--
-- Name: current_representante_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_representante_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_representante_id', TRUE), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_representante_id() OWNER TO postgres;


--
-- Name: FUNCTION current_representante_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_representante_id() IS 'Contexto de sessão do representante logado. Setado via SET LOCAL antes de queries';



--
-- Name: current_user_clinica_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_clinica_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := NULLIF(current_setting('app.current_user_clinica_id', TRUE), '');
  
  -- SECURITY: For RH perfil, clinica_id is mandatory
  IF v_id IS NULL AND current_user_perfil() = 'rh' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not set for perfil RH.';
  END IF;
  
  RETURN v_id::INTEGER;
EXCEPTION
  WHEN undefined_object THEN
    -- For non-RH users, NULL is acceptable
    IF current_user_perfil() = 'rh' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not configured for RH.';
    END IF;
    RETURN NULL;
  WHEN SQLSTATE '22023' THEN
    IF current_user_perfil() = 'rh' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_clinica_id not configured for RH.';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_clinica_id() OWNER TO postgres;


--
-- Name: FUNCTION current_user_clinica_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_clinica_id() IS 'Returns current user clinica_id from session context.
   RAISES EXCEPTION if not set for perfil RH (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';



--
-- Name: current_user_clinica_id_optional(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_clinica_id_optional() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_clinica_id', TRUE), '')::INTEGER;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_clinica_id_optional() OWNER TO postgres;


--
-- Name: FUNCTION current_user_clinica_id_optional(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_clinica_id_optional() IS 'Retorna o clinica_id do usuÃƒÂ¡rio atual para isolamento de dados por clÃƒÂ­nica';



--
-- Name: current_user_cpf(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_cpf() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $_$
DECLARE
  v_cpf TEXT;
BEGIN
  v_cpf := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
  
  -- SECURITY: CPF is mandatory for RLS operations
  IF v_cpf IS NULL THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not set. Call SET LOCAL app.current_user_cpf before query.';
  END IF;
  
  -- Validate CPF format (11 digits)
  IF LENGTH(v_cpf) != 11 OR v_cpf !~ '^\d{11}$' THEN
    RAISE EXCEPTION 'SECURITY: Invalid CPF format "%". Expected 11 digits.', v_cpf;
  END IF;
  
  RETURN v_cpf;
EXCEPTION
  WHEN undefined_object THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not configured in session.';
  WHEN SQLSTATE '22023' THEN -- invalid parameter value
    RAISE EXCEPTION 'SECURITY: app.current_user_cpf not configured in session.';
END;
$_$;


ALTER FUNCTION public.current_user_cpf() OWNER TO postgres;


--
-- Name: FUNCTION current_user_cpf(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_cpf() IS 'Returns current user CPF from session context. 
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates CPF format (11 digits).';



--
-- Name: current_user_entidade_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_entidade_id() RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_entidade_id() OWNER TO postgres;


--
-- Name: current_user_entidade_id_optional(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_entidade_id_optional() RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_entidade_id', true), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_entidade_id_optional() OWNER TO postgres;


--
-- Name: current_user_is_gestor(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_is_gestor() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_setting('app.current_user_perfil', TRUE);
    RETURN v_perfil IN ('rh', 'gestor_entidade', 'admin');
EXCEPTION 
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION public.current_user_is_gestor() OWNER TO postgres;


--
-- Name: FUNCTION current_user_is_gestor(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_is_gestor() IS 'Retorna TRUE se o usuário atual é gestor (RH, Entidade ou Admin). Gestores não usam RLS.';



--
-- Name: current_user_perfil(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_perfil() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    perfil_usuario TEXT;
BEGIN
    -- Tentar obter perfil da sessão
    BEGIN
        perfil_usuario := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        perfil_usuario := NULL;
    END;
    
    -- Se não houver perfil na sessão, retornar NULL (sem acesso)
    RETURN perfil_usuario;
END;
$$;


ALTER FUNCTION public.current_user_perfil() OWNER TO postgres;


--
-- Name: FUNCTION current_user_perfil(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_perfil() IS 'Returns current user perfil from session context.
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates perfil is in allowed list.';



--
-- Name: execute_maintenance(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.execute_maintenance(p_description text, p_sql text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_rows_affected INTEGER;
BEGIN
  -- Only allow BYPASSRLS roles
  IF current_user NOT IN ('dba_maintenance', 'postgres', 'neondb_owner') THEN
    RAISE EXCEPTION 'SECURITY: execute_maintenance() requires BYPASSRLS role';
  END IF;
  
  v_start_time := clock_timestamp();
  
  -- Audit before
  INSERT INTO audit_logs (
    user_cpf,
    user_perfil,
    action,
    resource,
    details
  ) VALUES (
    current_user,
    'dba_bypassrls',
    'MAINTENANCE_START',
    'SQL',
    'Description: ' || p_description || E'\nSQL: ' || p_sql
  );
  
  -- Execute
  EXECUTE p_sql;
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Audit after
  INSERT INTO audit_logs (
    user_cpf,
    user_perfil,
    action,
    resource,
    details
  ) VALUES (
    current_user,
    'dba_bypassrls',
    'MAINTENANCE_COMPLETE',
    'SQL',
    'Description: ' || p_description || 
    E'\nRows affected: ' || v_rows_affected ||
    E'\nDuration: ' || (clock_timestamp() - v_start_time)
  );
  
  RAISE NOTICE 'Maintenance completed: % (% rows affected)', p_description, v_rows_affected;
END;
$$;


ALTER FUNCTION public.execute_maintenance(p_description text, p_sql text) OWNER TO postgres;


--
-- Name: FUNCTION execute_maintenance(p_description text, p_sql text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.execute_maintenance(p_description text, p_sql text) IS 'Executes maintenance SQL with full audit trail.
   Usage: SELECT execute_maintenance(''Fix data'', ''UPDATE table...'');
   Only accessible to BYPASSRLS roles.';



--
-- Name: fn_cpf_em_uso(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_cpf_em_uso(p_cpf text) RETURNS TABLE(origem text, tipo_usuario text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  (SELECT 'funcionarios'::TEXT AS origem,
          COALESCE(f.perfil, 'funcionario')::TEXT AS tipo_usuario
     FROM funcionarios f WHERE f.cpf = p_cpf LIMIT 1)
  UNION ALL
  (SELECT 'usuarios'::TEXT, u.tipo_usuario::TEXT
     FROM usuarios u WHERE u.cpf = p_cpf LIMIT 1)
  UNION ALL
  (SELECT 'representantes'::TEXT, 'representante'::TEXT
     FROM representantes r WHERE r.cpf = p_cpf LIMIT 1)
  UNION ALL
  (SELECT 'entidades_senhas'::TEXT, 'gestor de entidade'::TEXT
     FROM entidades_senhas es WHERE es.cpf = p_cpf LIMIT 1)
  UNION ALL
  (SELECT 'clinicas_senhas'::TEXT, 'rh'::TEXT
     FROM clinicas_senhas cs WHERE cs.cpf = p_cpf LIMIT 1);
END;
$$;


ALTER FUNCTION public.fn_cpf_em_uso(p_cpf text) OWNER TO postgres;


--
-- Name: FUNCTION fn_cpf_em_uso(p_cpf text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_cpf_em_uso(p_cpf text) IS 'Retorna todas as ocorrÃªncias de um CPF nas tabelas do sistema. Usado para validaÃ§Ã£o cross-table antes de cadastrar novo usuÃ¡rio/funcionÃ¡rio/representante.';



--
-- Name: gerar_hash_auditoria(character varying, integer, character varying, jsonb, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  v_concatenado TEXT;
BEGIN
  -- Concatenar dados para gerar hash
  v_concatenado := p_entidade_tipo || '|' || 
                   COALESCE(p_entidade_id::TEXT, 'NULL') || '|' || 
                   p_acao || '|' || 
                   COALESCE(p_dados::TEXT, '{}') || '|' || 
                   p_timestamp::TEXT;
  
  -- Retornar hash SHA-256
  RETURN encode(digest(v_concatenado, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) OWNER TO postgres;


--
-- Name: FUNCTION gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) IS 'Sobrecarga para aceitar TIMESTAMPTZ - gera hash SHA-256 para verificar integridade de registros de auditoria';



--
-- Name: gerar_senha_padrao_cnpj(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_cnpj_limpo VARCHAR;
    v_senha_6_digitos VARCHAR;
BEGIN
    -- Remover caracteres nao numericos
    v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
    
    -- Pegar ultimos 6 digitos
    v_senha_6_digitos := RIGHT(v_cnpj_limpo, 6);
    
    -- Se CNPJ tiver menos de 6 digitos, completar com zeros a esquerda
    IF LENGTH(v_senha_6_digitos) < 6 THEN
        v_senha_6_digitos := LPAD(v_senha_6_digitos, 6, '0');
    END IF;
    
    RETURN v_senha_6_digitos;
END;
$$;


ALTER FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) OWNER TO postgres;


--
-- Name: FUNCTION gerar_senha_padrao_cnpj(p_cnpj character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) IS 'Gera senha padrao usando os 6 ultimos digitos do CNPJ';



--
-- Name: get_next_contratante_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_next_contratante_id() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN nextval('seq_contratantes_id');
END;
$$;


ALTER FUNCTION public.get_next_contratante_id() OWNER TO postgres;


--
-- Name: is_admin_or_master(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin_or_master() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    -- Após migração, apenas 'admin' confere privilégio total. Esta função mantém compatibilidade histórica
    RETURN current_user_perfil() = 'admin';
END;
$$;


ALTER FUNCTION public.is_admin_or_master() OWNER TO postgres;


--
-- Name: FUNCTION is_admin_or_master(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.is_admin_or_master() IS 'Verifica se o usuário atual tem perfil admin (compatibilidade histórica: perfil legado tratado separadamente)';



--
-- Name: is_valid_perfil(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_valid_perfil(p_perfil text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN p_perfil::perfil_usuario_enum IS NOT NULL;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION public.is_valid_perfil(p_perfil text) OWNER TO postgres;


--
-- Name: FUNCTION is_valid_perfil(p_perfil text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.is_valid_perfil(p_perfil text) IS 'Valida se um texto corresponde a um perfil válido do ENUM';



--
-- Name: log_access_denied(text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Opcional: inserir em tabela de logs se quiser rastrear
  -- INSERT INTO app_access_logs(user_id, action, resource, reason, created_at) VALUES (p_user, p_action, p_resource, p_reason, now());
  RETURN;
END;
$$;


ALTER FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) OWNER TO postgres;


--
-- Name: FUNCTION log_access_denied(p_user text, p_action text, p_resource text, p_reason text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) IS 'Registra tentativas de acesso negadas por políticas RLS';



--
-- Name: obter_traducao(text, public.idioma_suportado); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obter_traducao(p_chave text, p_idioma public.idioma_suportado DEFAULT 'pt_BR'::public.idioma_suportado) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_traducao TEXT;
BEGIN
  SELECT conteudo INTO v_traducao
  FROM notificacoes_traducoes
  WHERE chave_traducao = p_chave AND idioma = p_idioma;
  
  -- Fallback para português se não encontrar tradução
  IF v_traducao IS NULL THEN
    SELECT conteudo INTO v_traducao
    FROM notificacoes_traducoes
    WHERE chave_traducao = p_chave AND idioma = 'pt_BR';
  END IF;
  
  RETURN COALESCE(v_traducao, p_chave);
END;
$$;


ALTER FUNCTION public.obter_traducao(p_chave text, p_idioma public.idioma_suportado) OWNER TO postgres;


--
-- Name: safe_drop_policy(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Validate match first
  IF NOT validate_policy_table_match(p_policy_name, p_table_name) THEN
    RAISE EXCEPTION 'Policy name "%" does not match table "%". Check migration code.',
      p_policy_name, p_table_name;
  END IF;
  
  -- Drop policy
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
  -- Log
  RAISE NOTICE 'Dropped policy "%" from table "%"', p_policy_name, p_table_name;
END;
$$;


ALTER FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) OWNER TO postgres;


--
-- Name: FUNCTION safe_drop_policy(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) IS 'Safely drops a policy after validating name matches table.
   Use this in migrations instead of DROP POLICY directly.
   Example: SELECT safe_drop_policy(''avaliacoes_own_select'', ''avaliacoes'')';



--
-- Name: set_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at_column() OWNER TO postgres;


--
-- Name: user_has_permission(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.user_has_permission(permission_name text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_user_perfil();
    
    IF v_perfil IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN roles r ON r.name = v_perfil AND r.id = rp.role_id
        JOIN permissions p ON p.name = permission_name AND p.id = rp.permission_id
        WHERE r.active = TRUE
    );
END;
$$;


ALTER FUNCTION public.user_has_permission(permission_name text) OWNER TO postgres;


--
-- Name: FUNCTION user_has_permission(permission_name text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.user_has_permission(permission_name text) IS 'Verifica se o usuário atual tem uma permissão específica via RBAC';



--
-- Name: validar_sessao_rls(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_sessao_rls() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
    v_perfil TEXT;
    v_cpf TEXT;
    v_contratante_id TEXT;
    v_clinica_id TEXT;
BEGIN
    -- Obter variáveis de contexto (CORREÇÃO: usar app.current_perfil, não app.current_user_perfil)
    v_perfil := current_setting('app.current_perfil', true);
    v_cpf := current_setting('app.current_user_cpf', true);
    v_contratante_id := current_setting('app.current_contratante_id', true);
    v_clinica_id := current_setting('app.current_clinica_id', true);

    -- Validações
    IF v_perfil IS NULL OR v_perfil = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: Perfil de usuário não definido na sessão';
    END IF;

    IF v_cpf IS NULL OR v_cpf = '' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF de usuário não definido na sessão';
    END IF;

    -- Validar CPF tem 11 dígitos
    IF v_cpf !~ '^\d{11}$' THEN
        RAISE EXCEPTION 'SEGURANÇA: CPF inválido na sessão: %', v_cpf;
    END IF;

    -- Perfis que requerem contratante_id ou clinica_id
    IF v_perfil IN ('gestor_entidade', 'rh', 'entidade') THEN
        IF (v_contratante_id IS NULL OR v_contratante_id = '')
           AND (v_clinica_id IS NULL OR v_clinica_id = '') THEN
            RAISE EXCEPTION 'SEGURANÇA: Perfil % requer contratante_id ou clinica_id', v_perfil;
        END IF;
    END IF;

    RETURN TRUE;
END;
$_$;


ALTER FUNCTION public.validar_sessao_rls() OWNER TO postgres;


--
-- Name: FUNCTION validar_sessao_rls(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida variáveis de sessão para Row Level Security. 
Espera: app.current_perfil, app.current_user_cpf
Opcional: app.current_contratante_id, app.current_clinica_id';



--
-- Name: validate_policy_table_match(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_policy_table TEXT;
BEGIN
  -- Extract table name from policy name
  -- Pattern: <table>_<perfil>_<action>
  -- Example: avaliacoes_own_select -> table should be avaliacoes
  
  v_policy_table := split_part(p_policy_name, '_', 1);
  
  -- Special cases with compound names
  IF p_policy_name LIKE 'lotes_%' THEN
    v_policy_table := 'lotes_avaliacao';
  ELSIF p_policy_name LIKE 'empresas_%' THEN
    v_policy_table := 'empresas_clientes';
  END IF;
  
  -- Validate match
  IF v_policy_table != p_table_name THEN
    RAISE WARNING 'Policy name "%" suggests table "%" but applied to table "%"',
      p_policy_name, v_policy_table, p_table_name;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;


ALTER FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) OWNER TO postgres;


--
-- Name: FUNCTION validate_policy_table_match(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) IS 'Validates that policy name matches target table name.
   Use in migrations before DROP/CREATE POLICY.
   Example: validate_policy_table_match(''avaliacoes_own_select'', ''avaliacoes'')';



--
-- Name: validate_rh_clinica(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_rh_clinica() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
    v_cpf TEXT;
    v_perfil TEXT;
    v_clinica_id INTEGER;
    v_rh_clinica_id INTEGER;
BEGIN
    v_cpf := current_user_cpf();
    v_perfil := current_user_perfil();
    v_clinica_id := current_user_clinica_id();
    
    -- Se não for RH, validação passa
    IF v_perfil != 'rh' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se o RH realmente pertence à clínica especificada
    SELECT clinica_id INTO v_rh_clinica_id
    FROM funcionarios
    WHERE cpf = v_cpf AND perfil = 'rh' AND ativo = TRUE;
    
    -- Se não encontrou ou clínica não corresponde, retornar FALSE
    IF v_rh_clinica_id IS NULL OR v_rh_clinica_id != v_clinica_id THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.validate_rh_clinica() OWNER TO postgres;


--
-- Name: FUNCTION validate_rh_clinica(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validate_rh_clinica() IS 'Valida se o RH atual realmente pertence à clínica configurada na sessão';



--
-- Name: _migration_issues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._migration_issues (
    id integer NOT NULL,
    migration_version integer NOT NULL,
    issue_type character varying(50) NOT NULL,
    description text,
    data jsonb,
    resolved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public._migration_issues OWNER TO postgres;


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._migration_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migration_issues_id_seq OWNER TO postgres;


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._migration_issues_id_seq OWNED BY public._migration_issues.id;



--
-- Name: audit_access_denied; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_access_denied (
    id bigint NOT NULL,
    user_cpf character(11),
    user_perfil character varying(20),
    attempted_action character varying(50) NOT NULL,
    resource character varying(100) NOT NULL,
    resource_id text,
    reason text,
    query_text text,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_access_denied OWNER TO postgres;


--
-- Name: TABLE audit_access_denied; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_access_denied IS 'Logs de tentativas de acesso bloqueadas por RLS';



--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_access_denied_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_access_denied_id_seq OWNER TO postgres;


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_access_denied_id_seq OWNED BY public.audit_access_denied.id;



--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_cpf character(11),
    user_perfil character varying(20),
    action character varying(50) NOT NULL,
    resource character varying(100) NOT NULL,
    resource_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    clinica_id integer,
    entidade_id integer,
    CONSTRAINT chk_audit_logs_user_cpf_format CHECK (((user_cpf IS NULL) OR (length(user_cpf) = 11)))
);


ALTER TABLE public.audit_logs OWNER TO postgres;


--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria - removidos registros de emergÃªncia e codigo/titulo de lote (2026-02-03)';



--
-- Name: COLUMN audit_logs.user_cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.user_cpf IS 'CPF do usuário que executou a ação. NULL indica ação automática do sistema.';



--
-- Name: COLUMN audit_logs.user_perfil; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.user_perfil IS 'Perfil do usuário que executou a ação (pode ser NULL para operações sem contexto de sessão)';



--
-- Name: COLUMN audit_logs.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.clinica_id IS 'ID da clínica relacionada à ação (quando aplicável).';



--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;



--
-- Name: audit_stats_by_user; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.audit_stats_by_user AS
 SELECT user_cpf,
    user_perfil,
    action,
    resource,
    count(*) AS total_actions,
    max(created_at) AS last_action_at
   FROM public.audit_logs
  GROUP BY user_cpf, user_perfil, action, resource
  ORDER BY (count(*)) DESC;


ALTER VIEW public.audit_stats_by_user OWNER TO postgres;


--
-- Name: VIEW audit_stats_by_user; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.audit_stats_by_user IS 'EstatÃƒÂ­sticas de aÃƒÂ§ÃƒÂµes por usuÃƒÂ¡rio para anÃƒÂ¡lise de comportamento';



--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    entidade_tipo character varying(50) NOT NULL,
    entidade_id integer NOT NULL,
    acao character varying(50) NOT NULL,
    status_anterior character varying(100),
    status_novo character varying(100),
    usuario_cpf character varying(11),
    usuario_perfil character varying(50),
    ip_address character varying(45),
    user_agent text,
    dados_alterados jsonb,
    metadados jsonb,
    hash_operacao character varying(64) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.auditoria OWNER TO postgres;


--
-- Name: TABLE auditoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria IS 'Tabela de auditoria para registrar todas as aÃ§Ãµes do sistema';



--
-- Name: COLUMN auditoria.hash_operacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria.hash_operacao IS 'Hash SHA-256 para verificaÃ§Ã£o de integridade da operaÃ§Ã£o';



--
-- Name: auditoria_geral; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_geral (
    id integer NOT NULL,
    tabela_afetada character varying(100) NOT NULL,
    acao character varying(50) NOT NULL,
    cpf_responsavel character varying(11),
    dados_anteriores jsonb,
    dados_novos jsonb,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.auditoria_geral OWNER TO postgres;


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_geral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_geral_id_seq OWNER TO postgres;


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_geral_id_seq OWNED BY public.auditoria_geral.id;



--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_id_seq OWNER TO postgres;


--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;



--
-- Name: COLUMN auditoria_laudos.lote_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.lote_id IS 'Referencia ao lote de avaliacao. FK com ON DELETE CASCADE.';



--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';



--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';



--
-- Name: COLUMN auditoria_laudos.solicitado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.solicitado_por IS 'CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes manuais.';



--
-- Name: COLUMN auditoria_laudos.tipo_solicitante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.tipo_solicitante IS 'Tipo do solicitante: rh, gestor_entidade, admin, emissor. Obrigatório quando solicitado_por preenchido.';



--
-- Name: COLUMN auditoria_laudos.tentativas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.tentativas IS 'Contador de tentativas de processamento para retry logic. Default 0.';



--
-- Name: COLUMN auditoria_laudos.erro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.erro IS 'Mensagem de erro detalhada quando processamento falha. NULL se bem-sucedido.';



--
-- Name: CONSTRAINT chk_solicitation_has_requester ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_solicitation_has_requester ON public.auditoria_laudos IS 'Garante que solicitações manuais sempre tenham o CPF do solicitante registrado.';



--
-- Name: CONSTRAINT chk_status_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_status_valid ON public.auditoria_laudos IS 'Garante que apenas status válidos sejam registrados.';



--
-- Name: CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON public.auditoria_laudos IS 'Valida tipos permitidos de solicitante.';



--
-- Name: COLUMN avaliacao_resets.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.id IS 'Unique identifier for the reset operation';



--
-- Name: COLUMN avaliacao_resets.avaliacao_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.avaliacao_id IS 'ID of the evaluation that was reset';



--
-- Name: COLUMN avaliacao_resets.lote_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.lote_id IS 'ID of the batch/cycle containing the evaluation';



--
-- Name: COLUMN avaliacao_resets.requested_by_user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_user_id IS 'User ID who requested the reset';



--
-- Name: COLUMN avaliacao_resets.requested_by_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor_entidade)';



--
-- Name: COLUMN avaliacao_resets.reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.reason IS 'Mandatory justification for the reset operation';



--
-- Name: COLUMN avaliacao_resets.respostas_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.respostas_count IS 'Number of responses deleted during reset';



--
-- Name: COLUMN avaliacao_resets.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacao_resets.created_at IS 'Timestamp when the reset was performed';



--
-- Name: COLUMN avaliacoes.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.status IS 'Status da avaliaÃ§Ã£o: iniciada, em_andamento, concluida, inativada (nÃ£o incrementa Ã­ndice)';



--
-- Name: COLUMN avaliacoes.inativada_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.inativada_em IS 'Timestamp quando a avaliacao foi inativada pelo RH';



--
-- Name: COLUMN avaliacoes.motivo_inativacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.motivo_inativacao IS 'Motivo informado pelo RH para inativacao da avaliacao';



--
-- Name: seq_contratantes_id; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_contratantes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_contratantes_id OWNER TO postgres;


--
-- Name: COLUMN clinicas_empresas.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_empresas.clinica_id IS 'ID da clinica de medicina ocupacional';



--
-- Name: COLUMN clinicas_empresas.empresa_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_empresas.empresa_id IS 'ID da empresa cliente atendida pela clÃ­nica';



--
-- Name: COLUMN clinicas_senhas.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_senhas.clinica_id IS 'ReferÃªncia para a clÃ­nica';



--
-- Name: COLUMN clinicas_senhas.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_senhas.cpf IS 'CPF do usuÃ¡rio RH';



--
-- Name: COLUMN clinicas_senhas.senha_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_senhas.senha_hash IS 'Hash bcrypt da senha';



--
-- Name: COLUMN clinicas_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_senhas.primeira_senha_alterada IS 'Indica se o usuÃ¡rio jÃ¡ alterou a senha inicial';



--
-- Name: COLUMN comissoes_laudo.percentual_comissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.percentual_comissao IS 'Percentual do representante aplicado sobre a base comissionável (valor_comissionavel). Padrão: 40%.';



--
-- Name: COLUMN comissoes_laudo.valor_comissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.valor_comissao IS 'Valor final da comissão: valor_comissionavel × percentual_comissao / 100. Armazenado para auditabilidade.';



--
-- Name: COLUMN comissoes_laudo.mes_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.mes_emissao IS 'Primeiro dia do mês em que o laudo foi emitido (ex: 2026-03-01 para laudos de março/2026).';



--
-- Name: COLUMN comissoes_laudo.mes_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.mes_pagamento IS 'Primeiro dia do mês em que o Admin deve pagar. Determinado pela regra do corte (dia 5).';



--
-- Name: COLUMN comissoes_laudo.auto_cancelamento_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.auto_cancelamento_em IS 'Se congelada_aguardando_admin por 30 dias sem decisão, comissão é auto-cancelada. Pode ser revertida em 30 dias adicionais.';



--
-- Name: COLUMN comissoes_laudo.parcela_numero; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.parcela_numero IS 'NÃºmero da parcela (1-based). 1 para pagamento Ã  vista.';



--
-- Name: COLUMN comissoes_laudo.total_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.total_parcelas IS 'Total de parcelas do pagamento. 1 para Ã  vista, atÃ© 12 para parcelado.';



--
-- Name: COLUMN comissoes_laudo.percentual_custas_plataforma; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.percentual_custas_plataforma IS 'Percentual de custas da plataforma descontado do valor bruto do laudo antes de calcular a base comissionável. Padrão: 25%.';



--
-- Name: COLUMN comissoes_laudo.valor_comissionavel; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.valor_comissionavel IS 'Base de cálculo da comissão: valor_laudo × (1 - percentual_custas_plataforma/100). Armazenado para auditabilidade.';



--
-- Name: COLUMN comissoes_laudo.lote_pagamento_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.lote_pagamento_id IS 'FK para o lote de avaliação cujo pagamento originou esta comissão. Usado para prevenir duplicatas.';



--
-- Name: COLUMN comissoes_laudo.parcela_confirmada_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.comissoes_laudo.parcela_confirmada_em IS 'Timestamp em que a parcela correspondente foi confirmada como paga (webhook Asaas). NULL = parcela provisionada antecipadamente, ainda nÃ£o paga. NOT NULL = parcela efetivamente paga; comissÃ£o elegÃ­vel para transiÃ§Ã£o retida â†’ pendente_nf.';



--
-- Name: COLUMN contratos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.status IS 'Status extra usado para controle de pagamento (payment_pending, payment_paid, etc.)';



--
-- Name: COLUMN contratos.conteudo_gerado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.conteudo_gerado IS 'Conteúdo completo do contrato gerado para o contratante';



--
-- Name: COLUMN contratos.tipo_tomador; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica';



--
-- Name: COLUMN contratos_planos.valor_pago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos_planos.valor_pago IS 'Valor efetivamente pago pelo contratante';



--
-- Name: COLUMN contratos_planos.tipo_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos_planos.tipo_pagamento IS 'Tipo de pagamento utilizado: boleto, cartao ou pix';



--
-- Name: COLUMN contratos_planos.modalidade_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos_planos.modalidade_pagamento IS 'Modalidade: a_vista ou parcelado';



--
-- Name: COLUMN contratos_planos.data_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos_planos.data_pagamento IS 'Data do primeiro pagamento';



--
-- Name: COLUMN contratos_planos.parcelas_json; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos_planos.parcelas_json IS 'Detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';



--
-- Name: COLUMN empresas_clientes.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.clinica_id IS 'ID da clÃ­nica de medicina ocupacional que atende esta empresa (NOT NULL - obrigatÃ³rio).
Arquitetura segregada: empresas pertencem APENAS a clÃ­nicas, NUNCA a entidades.';



--
-- Name: COLUMN empresas_clientes.representante_nome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.representante_nome IS 'Nome do representante legal da empresa (opcional)';



--
-- Name: COLUMN empresas_clientes.representante_fone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.representante_fone IS 'Telefone do representante (opcional)';



--
-- Name: COLUMN empresas_clientes.representante_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.representante_email IS 'Email do representante (opcional)';



--
-- Name: COLUMN empresas_clientes.responsavel_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.responsavel_email IS 'Email do responsável pela empresa';



--
-- Name: COLUMN empresas_clientes.cartao_cnpj_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.cartao_cnpj_path IS 'Caminho do arquivo Cartão CNPJ enviado no cadastro';



--
-- Name: COLUMN empresas_clientes.contrato_social_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.contrato_social_path IS 'Caminho do arquivo Contrato Social enviado no cadastro';



--
-- Name: COLUMN empresas_clientes.doc_identificacao_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.empresas_clientes.doc_identificacao_path IS 'Caminho do arquivo de identificação do representante enviado no cadastro';



--
-- Name: COLUMN entidades.responsavel_nome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';



--
-- Name: COLUMN entidades.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.status IS 'pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento | ativo | inativo | cancelado';



--
-- Name: COLUMN entidades.aprovado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.aprovado_em IS 'Timestamp em que o contratante foi aprovado por um admin';



--
-- Name: COLUMN entidades.aprovado_por_cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.aprovado_por_cpf IS 'CPF do admin que aprovou o contratante';



--
-- Name: COLUMN entidades.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';



--
-- Name: COLUMN entidades.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';



--
-- Name: COLUMN entidades.plano_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.plano_id IS 'ID do plano associado ao contratante';



--
-- Name: COLUMN entidades.data_liberacao_login; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.data_liberacao_login IS 'Data em que o login foi liberado após confirmação de pagamento';



--
-- Name: COLUMN entidades.contrato_aceito; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.contrato_aceito IS 'Indica se o contratante aceitou o contrato/política (usado para fluxo de pagamento e notificações)';



--
-- Name: COLUMN entidades.cartao_cnpj_arquivo_remoto_provider; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.cartao_cnpj_arquivo_remoto_provider IS 'Provider de armazenamento remoto do arquivo (e.g. "backblaze")';



--
-- Name: COLUMN entidades.cartao_cnpj_arquivo_remoto_bucket; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.cartao_cnpj_arquivo_remoto_bucket IS 'Bucket/container no provider remoto';



--
-- Name: COLUMN entidades.cartao_cnpj_arquivo_remoto_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.cartao_cnpj_arquivo_remoto_key IS 'Chave/caminho do arquivo no provider remoto';



--
-- Name: COLUMN entidades.cartao_cnpj_arquivo_remoto_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades.cartao_cnpj_arquivo_remoto_url IS 'URL pública do arquivo no provider remoto';



--
-- Name: COLUMN fila_emissao.tentativas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.tentativas IS 'Número de tentativas de processamento';



--
-- Name: COLUMN fila_emissao.max_tentativas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';



--
-- Name: COLUMN fila_emissao.proxima_tentativa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';



--
-- Name: COLUMN fila_emissao.erro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.erro IS 'Mensagem do último erro ocorrido';



--
-- Name: fk_migration_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fk_migration_audit (
    id integer NOT NULL,
    tabela character varying(100) NOT NULL,
    coluna_origem character varying(100) NOT NULL,
    tipo_migracao character varying(50) NOT NULL,
    registros_afetados integer DEFAULT 0,
    status character varying(50) DEFAULT 'pendente'::character varying,
    detalhes jsonb,
    erro text,
    iniciado_em timestamp without time zone,
    concluido_em timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fk_migration_audit OWNER TO postgres;


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fk_migration_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fk_migration_audit_id_seq OWNER TO postgres;


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fk_migration_audit_id_seq OWNED BY public.fk_migration_audit.id;



--
-- Name: COLUMN funcionarios.perfil; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.perfil IS 'Perfil do usuario: funcionario (pessoa avaliada), rh (clinica), gestor (entidade), emissor, admin';



--
-- Name: COLUMN funcionarios.ultima_avaliacao_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_id IS 'ID da última avaliação concluída ou inativada (denormalizado para performance)';



--
-- Name: COLUMN funcionarios.ultima_avaliacao_data_conclusao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_data_conclusao IS 'Data de conclusão da última avaliação (denormalizado)';



--
-- Name: COLUMN funcionarios.ultima_avaliacao_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_status IS 'Status da última avaliação: concluida ou inativada (denormalizado)';



--
-- Name: COLUMN funcionarios.ultimo_motivo_inativacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultimo_motivo_inativacao IS 'Motivo de inativação quando ultima_avaliacao_status = inativada';



--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo de 1 ano)';



--
-- Name: COLUMN funcionarios.data_nascimento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.data_nascimento IS 'Data de nascimento do funcionário (YYYY-MM-DD)';



--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunca fez)';



--
-- Name: COLUMN funcionarios.incluido_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.incluido_em IS 'Data e hora em que o funcionário foi incluído no sistema';



--
-- Name: COLUMN funcionarios.inativado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.inativado_em IS 'Data e hora em que o funcionário foi inativado';



--
-- Name: COLUMN funcionarios.inativado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.inativado_por IS 'CPF do usuário que inativou o funcionário';



--
-- Name: COLUMN funcionarios.ultimo_lote_codigo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultimo_lote_codigo IS 'Código do lote da última avaliação (denormalizado)';



--
-- Name: CONSTRAINT no_gestor_entidade_in_funcionarios ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT no_gestor_entidade_in_funcionarios ON public.funcionarios IS 'Gestores (gestor_entidade, rh) devem existir apenas em tabela usuarios. Proibido em funcionarios.';



--
-- Name: COLUMN funcionarios_clinicas.funcionario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.funcionario_id IS 'ID do funcionÃ¡rio (pessoa fÃ­sica avaliada)';



--
-- Name: COLUMN funcionarios_clinicas.empresa_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.empresa_id IS 'ID da empresa cliente (atendida pela clÃ­nica) Ã  qual o funcionÃ¡rio pertence';



--
-- Name: COLUMN funcionarios_clinicas.ativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.ativo IS 'TRUE = vÃ­nculo ativo | FALSE = vÃ­nculo encerrado (mantÃ©m histÃ³rico sem deletar)';



--
-- Name: COLUMN funcionarios_clinicas.data_vinculo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_vinculo IS 'Data em que o funcionÃ¡rio foi vinculado Ã  empresa (via clÃ­nica)';



--
-- Name: COLUMN funcionarios_clinicas.data_desvinculo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_desvinculo IS 'Data em que o vÃ­nculo foi encerrado (NULL = vÃ­nculo ativo)';



--
-- Name: COLUMN funcionarios_clinicas.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.clinica_id IS 'ID da clÃ­nica de medicina ocupacional que gerencia este funcionÃ¡rio (NOT NULL - obrigatÃ³rio).
Esta coluna Ã© essencial para a arquitetura segregada: identifica qual clÃ­nica tem acesso ao funcionÃ¡rio.';



--
-- Name: COLUMN funcionarios_clinicas.setor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.setor IS 'Setor do funcionario nesta empresa (pode diferir entre empresas)';



--
-- Name: COLUMN funcionarios_clinicas.funcao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.funcao IS 'Funcao do funcionario nesta empresa';



--
-- Name: COLUMN funcionarios_clinicas.matricula; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.matricula IS 'Matricula do funcionario nesta empresa';



--
-- Name: COLUMN funcionarios_clinicas.nivel_cargo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.nivel_cargo IS 'Nivel de cargo: operacional ou gestao (pode diferir entre empresas)';



--
-- Name: COLUMN funcionarios_clinicas.turno; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.turno IS 'Turno de trabalho nesta empresa';



--
-- Name: COLUMN funcionarios_clinicas.escala; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.escala IS 'Escala de trabalho nesta empresa';



--
-- Name: COLUMN funcionarios_clinicas.indice_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.indice_avaliacao IS 'Indice sequencial da ultima avaliacao concluida nesta empresa (0 = nunca fez)';



--
-- Name: COLUMN funcionarios_clinicas.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_ultimo_lote IS 'Data/hora da ultima avaliacao valida concluida nesta empresa';



--
-- Name: COLUMN funcionarios_entidades.funcionario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.funcionario_id IS 'ID do funcionÃ¡rio (pessoa fÃ­sica avaliada)';



--
-- Name: COLUMN funcionarios_entidades.entidade_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.entidade_id IS 'ID da entidade (tomador tipo=entidade) - empresa que administra seus prÃ³prios funcionÃ¡rios com um gestor';



--
-- Name: COLUMN funcionarios_entidades.ativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.ativo IS 'TRUE = vÃ­nculo ativo | FALSE = vÃ­nculo encerrado (mantÃ©m histÃ³rico sem deletar)';



--
-- Name: COLUMN funcionarios_entidades.data_vinculo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.data_vinculo IS 'Data em que o funcionÃ¡rio foi vinculado Ã  entidade';



--
-- Name: COLUMN funcionarios_entidades.data_desvinculo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.data_desvinculo IS 'Data em que o vÃ­nculo foi encerrado (NULL = vÃ­nculo ativo)';



--
-- Name: COLUMN funcionarios_entidades.setor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.setor IS 'Setor do funcionario nesta entidade (pode diferir entre entidades)';



--
-- Name: COLUMN funcionarios_entidades.funcao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.funcao IS 'Funcao do funcionario nesta entidade';



--
-- Name: COLUMN funcionarios_entidades.matricula; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.matricula IS 'Matricula do funcionario nesta entidade';



--
-- Name: COLUMN funcionarios_entidades.nivel_cargo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.nivel_cargo IS 'Nivel de cargo: operacional ou gestao (pode diferir entre entidades)';



--
-- Name: COLUMN funcionarios_entidades.turno; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.turno IS 'Turno de trabalho nesta entidade';



--
-- Name: COLUMN funcionarios_entidades.escala; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.escala IS 'Escala de trabalho nesta entidade';



--
-- Name: COLUMN funcionarios_entidades.indice_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.indice_avaliacao IS 'Indice sequencial da ultima avaliacao concluida nesta entidade (0 = nunca fez)';



--
-- Name: COLUMN funcionarios_entidades.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios_entidades.data_ultimo_lote IS 'Data/hora da ultima avaliacao valida concluida nesta entidade';



--
-- Name: COLUMN usuarios.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.cpf IS 'CPF Ãºnico do usuÃ¡rio';



--
-- Name: COLUMN usuarios.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.clinica_id IS 'Para RH: vÃ­nculo com clÃ­nica (senha em clinicas_senhas)';



--
-- Name: COLUMN usuarios.entidade_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.entidade_id IS 'Para Gestor: vÃ­nculo com entidade (senha em entidades_senhas)';



--
-- Name: COLUMN laudo_generation_jobs.max_attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudo_generation_jobs.max_attempts IS 'Número máximo de tentativas antes de mover para DLQ/falha permanente';



--
-- Name: COLUMN laudo_generation_jobs.payload; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudo_generation_jobs.payload IS 'Payload opcional com parâmetros (ex.: options para geração, template overrides)';



--
-- Name: COLUMN laudos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.status IS 'Status do laudo: apenas "enviado" (emissão é automática)';



--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';



--
-- Name: COLUMN laudos.relatorio_individual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.relatorio_individual IS 'Arquivo PDF do relatório individual do funcionário';



--
-- Name: COLUMN laudos.relatorio_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.relatorio_lote IS 'Arquivo PDF do relatório do lote completo';



--
-- Name: COLUMN laudos.relatorio_setor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.relatorio_setor IS 'Arquivo PDF do relatório setorial/estatístico';



--
-- Name: COLUMN laudos.hash_relatorio_individual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_relatorio_individual IS 'Hash SHA-256 do relatório individual para integridade';



--
-- Name: COLUMN laudos.hash_relatorio_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_relatorio_lote IS 'Hash SHA-256 do relatório de lote para integridade';



--
-- Name: COLUMN laudos.hash_relatorio_setor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_relatorio_setor IS 'Hash SHA-256 do relatório setorial para integridade';



--
-- Name: COLUMN laudos.arquivo_remoto_uploaded_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_uploaded_at IS 'Timestamp de quando o laudo foi feito upload para o storage remoto (Backblaze)';



--
-- Name: COLUMN laudos.arquivo_remoto_etag; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_etag IS 'ETag retornado pelo storage remoto para verificação de integridade';



--
-- Name: COLUMN laudos.arquivo_remoto_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_size IS 'Tamanho do arquivo em bytes no storage remoto';



--
-- Name: CONSTRAINT chk_laudos_emitido_antes_enviado ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_laudos_emitido_antes_enviado ON public.laudos IS 'Garante que data de emissão é anterior à data de envio';



--
-- Name: CONSTRAINT chk_laudos_hash_pdf_valid ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_laudos_hash_pdf_valid ON public.laudos IS 'Valida que hash_pdf é um SHA-256 válido (64 caracteres hexadecimais)';



--
-- Name: CONSTRAINT laudos_id_equals_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT laudos_id_equals_lote_id ON public.laudos IS 'Garante que id = lote_id. Relação 1:1 estrita: um lote tem exatamente um laudo com o mesmo ID.';



--
-- Name: COLUMN leads_representante.data_expiracao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads_representante.data_expiracao IS 'data_criacao + INTERVAL 90 days — exato, com hora. Expira no mesmo horário que foi criado.';



--
-- Name: COLUMN leads_representante.entidade_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads_representante.entidade_id IS 'FK para entidades: preenchido quando a clínica/entidade conclui o cadastro';



--
-- Name: COLUMN leads_representante.token_atual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leads_representante.token_atual IS 'Token on-demand gerado quando rep clica "Copiar link". Expira em 90 dias a partir de token_gerado_em';



--
-- Name: COLUMN logs_admin.acao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.logs_admin.acao IS 'Tipo de ação executada pelo administrador';



--
-- Name: COLUMN logs_admin.detalhes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.logs_admin.detalhes IS 'JSON com informações detalhadas da ação';



--
-- Name: COLUMN lotes_avaliacao.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.id IS 'Identificador Ãºnico do lote (igual ao ID do laudo correspondente)';



--
-- Name: COLUMN lotes_avaliacao.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.status IS 'Status do lote: rascunho, ativo, concluido, emissao_solicitada, emissao_em_andamento, laudo_emitido, cancelado, finalizado';



--
-- Name: COLUMN lotes_avaliacao.liberado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clínica';



--
-- Name: COLUMN lotes_avaliacao.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.hash_pdf IS 'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';



--
-- Name: COLUMN lotes_avaliacao.numero_ordem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.numero_ordem IS 'NÃºmero sequencial do lote na empresa (ex: 10 para o 10Âº lote da empresa)';



--
-- Name: COLUMN lotes_avaliacao.emitido_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.emitido_em IS 'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';



--
-- Name: COLUMN lotes_avaliacao.enviado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi marcado como enviado para RH/Entidade';



--
-- Name: COLUMN lotes_avaliacao.setor_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.setor_id IS 'Setor da empresa ao qual o lote pertence (opcional)';



--
-- Name: COLUMN lotes_avaliacao.laudo_enviado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo foi enviado pelo emissor para a clínica';



--
-- Name: COLUMN lotes_avaliacao.status_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.status_pagamento IS 'Status do pagamento: aguardando_cobranca, aguardando_pagamento, pago, expirado';



--
-- Name: COLUMN lotes_avaliacao.solicitacao_emissao_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.solicitacao_emissao_em IS 'Timestamp quando RH/Gestor solicitou a emissão';



--
-- Name: COLUMN lotes_avaliacao.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.valor_por_funcionario IS 'Valor em R$ cobrado por funcionário (definido pelo admin)';



--
-- Name: COLUMN lotes_avaliacao.link_pagamento_token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_token IS 'Token UUID único para acesso público ao link de pagamento';



--
-- Name: COLUMN lotes_avaliacao.link_pagamento_expira_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_expira_em IS 'Data/hora de expiração do link de pagamento (7 dias)';



--
-- Name: COLUMN lotes_avaliacao.link_pagamento_enviado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_enviado_em IS 'Timestamp quando o link foi gerado e enviado';



--
-- Name: COLUMN lotes_avaliacao.pagamento_metodo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.pagamento_metodo IS 'Método de pagamento escolhido: pix, boleto, cartao';



--
-- Name: COLUMN lotes_avaliacao.pagamento_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.pagamento_parcelas IS 'Número de parcelas (1-12) para cartão de crédito';



--
-- Name: COLUMN lotes_avaliacao.pago_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.pago_em IS 'Timestamp de confirmação do pagamento';



--
-- Name: CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON public.lotes_avaliacao IS 'Valida que status do lote está dentro dos valores permitidos pela máquina de estados';



--
-- Name: migration_guidelines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migration_guidelines (
    id integer NOT NULL,
    category text NOT NULL,
    guideline text NOT NULL,
    example text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.migration_guidelines OWNER TO postgres;


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migration_guidelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migration_guidelines_id_seq OWNER TO postgres;


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migration_guidelines_id_seq OWNED BY public.migration_guidelines.id;



--
-- Name: COLUMN notificacoes.destinatario_cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.destinatario_cpf IS 'CPF do destinatário quando aplicável';



--
-- Name: COLUMN notificacoes.titulo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.titulo IS 'Título resumido da notificação';



--
-- Name: COLUMN notificacoes.mensagem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.mensagem IS 'Mensagem detalhada da notificação';



--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais específicos do tipo de notificação';



--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiração da notificação (limpeza automática)';



--
-- Name: COLUMN notificacoes.resolvida; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.resolvida IS 'Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida';



--
-- Name: COLUMN notificacoes.data_resolucao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.data_resolucao IS 'Data/hora em que a notificação foi marcada como resolvida';



--
-- Name: COLUMN notificacoes.resolvido_por_cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.resolvido_por_cpf IS 'CPF do usuário que resolveu a notificação';



--
-- Name: COLUMN notificacoes_admin.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.tipo IS 'Tipo de notificação para categorização e filtros';



--
-- Name: COLUMN notificacoes_admin.mensagem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.mensagem IS 'Mensagem descritiva da notificação';



--
-- Name: COLUMN notificacoes_admin.lote_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.lote_id IS 'Referência ao lote relacionado (opcional)';



--
-- Name: COLUMN notificacoes_admin.dados_contexto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.dados_contexto IS 'JSON com dados adicionais relevantes para a notificação';



--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)';



--
-- Name: COLUMN pagamentos.recibo_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.recibo_url IS 'URL para visualização do recibo gerado';



--
-- Name: COLUMN pagamentos.recibo_numero; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.recibo_numero IS 'Número do recibo gerado após confirmação do pagamento (formato: REC-AAAA-NNNNN)';



--
-- Name: COLUMN pagamentos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.detalhes_parcelas IS 'detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';



--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';



--
-- Name: COLUMN pagamentos.idempotency_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.idempotency_key IS 'Chave de idempotência para evitar duplicação de pagamentos (opcional)';



--
-- Name: COLUMN pagamentos.external_transaction_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.external_transaction_id IS 'ID da transação no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';



--
-- Name: COLUMN pagamentos.provider_event_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.provider_event_id IS 'ID único do evento do provedor de pagamento (para deduplicação de webhooks)';



--
-- Name: COLUMN payment_links.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_links.token IS 'Token público do link (uso único)';



--
-- Name: COLUMN payment_links.expiracao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_links.expiracao IS 'Data/hora de expiração do link (opcional)';



--
-- Name: COLUMN planos.caracteristicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.planos.caracteristicas IS 'Características do plano em JSON: minimo_funcionarios, limite_funcionarios, beneficios, etc.';



--
-- Name: policy_expression_backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_expression_backups (
    id integer NOT NULL,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    policy_name text NOT NULL,
    using_expr text,
    with_check_expr text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.policy_expression_backups OWNER TO postgres;


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.policy_expression_backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policy_expression_backups_id_seq OWNER TO postgres;


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.policy_expression_backups_id_seq OWNED BY public.policy_expression_backups.id;



--
-- Name: COLUMN recibos.numero_recibo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.numero_recibo IS 'Número único do recibo no formato REC-AAAA-NNNNN';



--
-- Name: COLUMN recibos.vigencia_inicio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.vigencia_inicio IS 'Data de início da vigência = data do pagamento';



--
-- Name: COLUMN recibos.vigencia_fim; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.vigencia_fim IS 'Data de fim da vigência = data_pagamento + 364 dias';



--
-- Name: COLUMN recibos.numero_funcionarios_cobertos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionários cobertos pelo plano contratado';



--
-- Name: COLUMN recibos.valor_total_anual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.valor_total_anual IS 'Valor total anual do plano';



--
-- Name: COLUMN recibos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.valor_por_funcionario IS 'Valor cobrado por funcionário (se aplicável)';



--
-- Name: COLUMN recibos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';



--
-- Name: COLUMN recibos.descricao_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.descricao_pagamento IS 'Descrição textual da forma de pagamento para incluir no PDF';



--
-- Name: COLUMN recibos.pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.pdf IS 'PDF binário do recibo (BYTEA)';



--
-- Name: COLUMN recibos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.hash_pdf IS 'Hash SHA-256 do PDF binário em hexadecimal (64 caracteres)';



--
-- Name: COLUMN recibos.ip_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.ip_emissao IS 'Endereço IP de onde o recibo foi emitido';



--
-- Name: COLUMN recibos.emitido_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.emitido_por IS 'CPF do usuário que emitiu o recibo (formato: XXX.XXX.XXX-XX)';



--
-- Name: COLUMN recibos.hash_incluso; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.hash_incluso IS 'Indica se o hash foi incluído no rodapé do PDF';



--
-- Name: COLUMN recibos.backup_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';



--
-- Name: COLUMN recibos.parcela_numero; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.parcela_numero IS 'Número da parcela associada ao recibo (1, 2, 3...)';



--
-- Name: COLUMN recibos.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.clinica_id IS 'ID da clínica associada ao recibo (opcional, para suporte a RH/Clínica)';



--
-- Name: COLUMN representantes.tipo_pessoa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.representantes.tipo_pessoa IS 'Sempre pj (constraint representantes_somente_pj)';



--
-- Name: COLUMN representantes.codigo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.representantes.codigo IS 'Código único público do representante (alfanumérico, ex: K7X2Q9P3), usado no formulário de cadastro de clientes';



--
-- Name: COLUMN representantes.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.representantes.status IS 'ativo=pode indicar; apto_pendente=docs em análise; apto=recebe comissão; suspenso=tudo pausado; desativado=encerrado';



--
-- Name: COLUMN representantes.senha_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.representantes.senha_hash IS 'Hash bcrypt do codigo â€” permite login unificado via CPF + senha';



--
-- Name: COLUMN session_logs.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.cpf IS 'CPF do usuário que fez login';



--
-- Name: COLUMN session_logs.perfil; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.perfil IS 'Perfil do usuário no momento do login (funcionario, rh, emissor, admin)';



--
-- Name: COLUMN session_logs.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.clinica_id IS 'ID da clínica associada ao usuário (para RH e emissores)';



--
-- Name: COLUMN session_logs.empresa_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.empresa_id IS 'ID da empresa associada ao funcionário';



--
-- Name: COLUMN session_logs.session_duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.session_duration IS 'Duração calculada da sessão (logout - login)';



--
-- Name: COLUMN tokens_retomada_pagamento.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.token IS 'Hash MD5 único para identificar a sessão de retomada';



--
-- Name: COLUMN tokens_retomada_pagamento.expira_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.expira_em IS 'Data/hora de expiração do token (72 horas por padrão)';



--
-- Name: COLUMN vinculos_comissao.data_expiracao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.vinculos_comissao.data_expiracao IS 'data_inicio + INTERVAL 1 year. Sistema bloqueia renovação após expiração (23:59 do dia anterior = último minuto válido).';



--
-- Name: COLUMN vinculos_comissao.ultimo_laudo_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.vinculos_comissao.ultimo_laudo_em IS 'Atualizado pelo trigger sempre que um laudo vinculado é emitido. JOB diário verifica: se NOW() - ultimo_laudo_em ≥ 90 dias → vínculo vira inativo.';



--
-- Name: COLUMN vinculos_comissao.valor_negociado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.vinculos_comissao.valor_negociado IS 'Valor negociado por avaliaÃ§Ã£o/funcionÃ¡rio informado pelo admin ao associar manualmente um representante. Nullable â€” NULL quando vem de um lead.';



--
-- Name: _migration_issues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_issues ALTER COLUMN id SET DEFAULT nextval('public._migration_issues_id_seq'::regclass);



--
-- Name: audit_access_denied id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_access_denied ALTER COLUMN id SET DEFAULT nextval('public.audit_access_denied_id_seq'::regclass);



--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);



--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);



--
-- Name: auditoria_geral id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_geral ALTER COLUMN id SET DEFAULT nextval('public.auditoria_geral_id_seq'::regclass);



--
-- Name: fk_migration_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fk_migration_audit ALTER COLUMN id SET DEFAULT nextval('public.fk_migration_audit_id_seq'::regclass);



--
-- Name: migration_guidelines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_guidelines ALTER COLUMN id SET DEFAULT nextval('public.migration_guidelines_id_seq'::regclass);



--
-- Name: policy_expression_backups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_expression_backups ALTER COLUMN id SET DEFAULT nextval('public.policy_expression_backups_id_seq'::regclass);



--
-- Name: _migration_issues _migration_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_issues
    ADD CONSTRAINT _migration_issues_pkey PRIMARY KEY (id);



--
-- Name: audit_access_denied audit_access_denied_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_access_denied
    ADD CONSTRAINT audit_access_denied_pkey PRIMARY KEY (id);



--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);



--
-- Name: auditoria_geral auditoria_geral_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_geral
    ADD CONSTRAINT auditoria_geral_pkey PRIMARY KEY (id);



--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);



--
-- Name: fk_migration_audit fk_migration_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fk_migration_audit
    ADD CONSTRAINT fk_migration_audit_pkey PRIMARY KEY (id);



--
-- Name: migration_guidelines migration_guidelines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_guidelines
    ADD CONSTRAINT migration_guidelines_pkey PRIMARY KEY (id);



--
-- Name: policy_expression_backups policy_expression_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_expression_backups
    ADD CONSTRAINT policy_expression_backups_pkey PRIMARY KEY (id);



--
-- Name: CONSTRAINT recibos_pagamento_id_unique ON recibos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT recibos_pagamento_id_unique ON public.recibos IS 'Garante que cada pagamento tem no máximo um recibo ativo (idempotência)';



--
-- Name: idx_audit_denied_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_denied_created_at ON public.audit_access_denied USING btree (created_at DESC);



--
-- Name: idx_audit_denied_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_denied_resource ON public.audit_access_denied USING btree (resource);



--
-- Name: idx_audit_denied_user_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_denied_user_cpf ON public.audit_access_denied USING btree (user_cpf);



--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);



--
-- Name: idx_audit_logs_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_clinica_id ON public.audit_logs USING btree (clinica_id);



--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);



--
-- Name: idx_audit_logs_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entidade_id ON public.audit_logs USING btree (entidade_id);



--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource);



--
-- Name: idx_audit_logs_system_actions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_system_actions ON public.audit_logs USING btree (created_at DESC) WHERE (user_cpf IS NULL);



--
-- Name: idx_audit_logs_user_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_cpf ON public.audit_logs USING btree (user_cpf);



--
-- Name: idx_auditoria_acao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_acao ON public.auditoria USING btree (acao);



--
-- Name: idx_auditoria_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_criado_em ON public.auditoria USING btree (criado_em);



--
-- Name: idx_auditoria_entidade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_entidade ON public.auditoria USING btree (entidade_tipo, entidade_id);



--
-- Name: idx_auditoria_geral_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_geral_cpf ON public.auditoria_geral USING btree (cpf_responsavel);



--
-- Name: idx_auditoria_geral_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_geral_criado_em ON public.auditoria_geral USING btree (criado_em DESC);



--
-- Name: idx_auditoria_geral_tabela; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_geral_tabela ON public.auditoria_geral USING btree (tabela_afetada);



--
-- Name: INDEX idx_auditoria_laudos_lote_acao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_acao IS 'Índice principal para queries que filtram por lote e ação específica.';



--
-- Name: INDEX idx_auditoria_laudos_lote_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_history IS 'Otimiza busca de histórico completo de auditoria por lote (include para evitar table lookup).';



--
-- Name: INDEX idx_auditoria_laudos_pending_queue; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_pending_queue IS 'Acelera busca de solicitações pendentes/erro na fila de processamento.';



--
-- Name: INDEX idx_auditoria_laudos_unique_solicitation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_unique_solicitation IS 'Previne solicitações duplicadas de emissão no mesmo lote enquanto status estiver pendente/reprocessando.';



--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_cpf);



--
-- Name: idx_fk_migration_audit_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_migration_audit_status ON public.fk_migration_audit USING btree (status);



--
-- Name: idx_fk_migration_audit_tabela; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_migration_audit_tabela ON public.fk_migration_audit USING btree (tabela);



--
-- Name: INDEX idx_laudos_arquivo_remoto_sync; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_laudos_arquivo_remoto_sync IS 'Índice para consultas de laudos sincronizados com storage remoto';



--
-- Name: INDEX idx_lotes_empresa_status_liberado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_lotes_empresa_status_liberado IS 'Otimiza queries de relatório por empresa e status';



--
-- Name: TRIGGER prevent_avaliacao_delete_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_avaliacao_delete_after_emission ON public.avaliacoes IS 'Bloqueia exclusão de avaliação quando laudo já foi emitido';



--
-- Name: TRIGGER prevent_avaliacao_update_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_avaliacao_update_after_emission ON public.avaliacoes IS 'Bloqueia atualização de avaliação quando laudo já foi emitido';



--
-- Name: TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_lote_update_after_emission ON public.lotes_avaliacao IS 'Bloqueia mudanças indevidas no lote após emissão do laudo';



--
-- Name: TRIGGER trg_criar_usuario_apos_aprovacao ON entidades; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_criar_usuario_apos_aprovacao ON public.entidades IS 'Cria automaticamente usuario e senhas quando entidade e aprovada';



--
-- Name: TRIGGER trg_recalc_lote_on_avaliacao_update ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_update ON public.avaliacoes IS 'Atualiza status do lote quando avaliação muda de status.
Sistema é 100% MANUAL - emissor deve gerar laudos explicitamente.';



--
-- Name: TRIGGER trg_validar_laudo_emitido ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_validar_laudo_emitido ON public.laudos IS 'Garante que laudos sÃ³ sejam marcados como emitido quando PDF fÃ­sico foi gerado (hash existe)';



--
-- Name: TRIGGER trg_validar_transicao_status_lote ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_validar_transicao_status_lote ON public.lotes_avaliacao IS 'Trigger que valida transições de status antes de atualizar o registro';



--
-- Name: CONSTRAINT fk_laudos_emissor_cpf ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON public.laudos IS 'Garante que emissor existe na tabela funcionarios. RESTRICT previne deleção de emissor com laudos.';



--
-- Name: CONSTRAINT fk_laudos_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_laudos_lote_id ON public.laudos IS 'Garante integridade referencial: todo laudo deve ter um lote válido';



--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


--
-- Name: audit_logs audit_logs_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_admin_all ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: POLICY audit_logs_admin_all ON audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY audit_logs_admin_all ON public.audit_logs IS 'Administradores podem ver todos os logs de auditoria';



--
-- Name: audit_logs audit_logs_admin_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_admin_select ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: audit_logs audit_logs_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_own_select ON public.audit_logs FOR SELECT USING (((user_cpf)::text = public.current_user_cpf()));



--
-- Name: POLICY audit_logs_own_select ON audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY audit_logs_own_select ON public.audit_logs IS 'Usuários podem ver apenas seus próprios logs';



--
-- Name: audit_logs audit_logs_system_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY audit_logs_system_insert ON public.audit_logs FOR INSERT WITH CHECK (true);



--
-- Name: POLICY audit_logs_system_insert ON audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY audit_logs_system_insert ON public.audit_logs IS 'Apenas sistema pode inserir logs via triggers';



--
-- Name: POLICY avaliacoes_rh_select ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY avaliacoes_rh_select ON public.avaliacoes IS 'RH pode ver avaliações vinculadas a lotes de empresas da sua clínica. Migration 1105.';



--
-- Name: POLICY fila_emissao_admin_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_admin_view ON public.fila_emissao IS 'Admin pode visualizar toda fila para auditoria (SELECT)';



--
-- Name: POLICY fila_emissao_emissor_update ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_update ON public.fila_emissao IS 'Emissor pode atualizar tentativas e erros (UPDATE)';



--
-- Name: POLICY fila_emissao_emissor_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_view ON public.fila_emissao IS 'Emissor pode visualizar fila de trabalho (SELECT)';



--
-- Name: POLICY fila_emissao_system_bypass ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_system_bypass ON public.fila_emissao IS 'Permite acesso total quando app.system_bypass = true (APIs internas)';



--
-- Name: POLICY funcionarios_admin_delete ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_admin_delete ON public.funcionarios IS 'Admin deleta RH, emissores e admins inativos';



--
-- Name: POLICY funcionarios_admin_update ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_admin_update ON public.funcionarios IS 'Admin atualiza RH, emissores e outros admins';



--
-- Name: POLICY funcionarios_clinicas_rh_insert ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas IS 'RH pode criar relacionamentos de funcionarios com empresas da sua clinica';



--
-- Name: POLICY funcionarios_clinicas_rh_select ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas IS 'RH pode visualizar relacionamentos de funcionarios da sua clinica';



--
-- Name: POLICY funcionarios_delete_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_delete_simple ON public.funcionarios IS 'Política DELETE simplificada - Apenas Admin';



--
-- Name: POLICY funcionarios_emissor_select ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_emissor_select ON public.funcionarios IS 'Emissores visualizam RH e outros emissores (acesso global para coordenação de emissão)';



--
-- Name: POLICY funcionarios_entidades_gestor_insert ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades IS 'Gestor pode criar relacionamentos de funcionarios com sua entidade';



--
-- Name: POLICY funcionarios_entidades_gestor_select ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades IS 'Gestor pode visualizar relacionamentos de funcionarios da sua entidade';



--
-- Name: POLICY funcionarios_gestor_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios IS 'Gestor pode visualizar funcionarios vinculados a sua entidade via funcionarios_entidades';



--
-- Name: POLICY funcionarios_insert_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_insert_simple ON public.funcionarios IS 'Política INSERT simplificada - Admin, RH e Gestor podem inserir';



--
-- Name: POLICY funcionarios_own_select ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_own_select ON public.funcionarios IS 'Funcionários comuns visualizam apenas seus próprios dados';



--
-- Name: POLICY funcionarios_own_update ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_own_update ON public.funcionarios IS 'Funcionários comuns atualizam apenas seus próprios dados (sem mudar perfil, clínica ou entidade)';



--
-- Name: POLICY funcionarios_rh_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios IS 'RH pode visualizar funcionarios vinculados a sua clinica via funcionarios_clinicas';



--
-- Name: POLICY funcionarios_select_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_select_simple ON public.funcionarios IS 'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';



--
-- Name: POLICY funcionarios_update_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_update_simple ON public.funcionarios IS 'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';



--
-- Name: POLICY permissions_admin_select ON permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY permissions_admin_select ON public.permissions IS 'Apenas admin pode visualizar permissões';



--
-- Name: POLICY role_permissions_admin_select ON role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY role_permissions_admin_select ON public.role_permissions IS 'Apenas admin pode visualizar atribuições de permissões';



--
-- Name: POLICY roles_admin_select ON roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY roles_admin_select ON public.roles IS 'Apenas admin pode visualizar papéis';


