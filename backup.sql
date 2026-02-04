--
-- PostgreSQL database dump
--

-- Dumped from database version 17.7 (bdd1736)
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
-- Name: backups; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA backups;


ALTER SCHEMA backups OWNER TO neondb_owner;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
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
-- Name: idioma_suportado; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.idioma_suportado AS ENUM (
    'pt_BR',
    'en_US',
    'es_ES'
);


ALTER TYPE public.idioma_suportado OWNER TO neondb_owner;

--
-- Name: nivel_cargo_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.nivel_cargo_enum AS ENUM (
    'operacional',
    'gestao'
);


ALTER TYPE public.nivel_cargo_enum OWNER TO neondb_owner;

--
-- Name: perfil_usuario_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.perfil_usuario_enum AS ENUM (
    'funcionario',
    'rh',
    'admin',
    'emissor'
);


ALTER TYPE public.perfil_usuario_enum OWNER TO neondb_owner;

--
-- Name: TYPE perfil_usuario_enum; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.perfil_usuario_enum IS 'Perfis válidos de usuários no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionários), admin (administração geral), emissor (emite laudos)';


--
-- Name: prioridade_notificacao; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.prioridade_notificacao AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
);


ALTER TYPE public.prioridade_notificacao OWNER TO neondb_owner;

--
-- Name: status_aprovacao_enum; Type: TYPE; Schema: public; Owner: neondb_owner
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
    'analise'
);


ALTER TYPE public.status_aprovacao_enum OWNER TO neondb_owner;

--
-- Name: status_avaliacao; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_avaliacao AS ENUM (
    'pendente',
    'em_andamento',
    'concluida',
    'liberada',
    'iniciada'
);


ALTER TYPE public.status_avaliacao OWNER TO neondb_owner;

--
-- Name: TYPE status_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: iniciada (criada/não iniciada), em_andamento (respondendo), concluida (finalizada), inativada (cancelada). Nota: liberada é obsoleto.';


--
-- Name: status_avaliacao_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_avaliacao_enum AS ENUM (
    'iniciada',
    'em_andamento',
    'concluida',
    'inativada'
);


ALTER TYPE public.status_avaliacao_enum OWNER TO neondb_owner;

--
-- Name: TYPE status_avaliacao_enum; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliações: iniciada (criada mas não respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';


--
-- Name: status_laudo; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_laudo AS ENUM (
    'rascunho',
    'emitido',
    'enviado'
);


ALTER TYPE public.status_laudo OWNER TO neondb_owner;

--
-- Name: TYPE status_laudo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_laudo IS 'Status válidos: rascunho (editando), emitido (pronto), enviado (entregue)';


--
-- Name: status_laudo_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_laudo_enum AS ENUM (
    'emitido',
    'enviado',
    'rascunho'
);


ALTER TYPE public.status_laudo_enum OWNER TO neondb_owner;

--
-- Name: TYPE status_laudo_enum; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_laudo_enum IS 'Status de laudos: emitido (gerado automaticamente), enviado (enviado ao cliente)';


--
-- Name: status_lote; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_lote AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido',
    'rascunho'
);


ALTER TYPE public.status_lote OWNER TO neondb_owner;

--
-- Name: TYPE status_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_lote IS 'Status válidos: rascunho (criando), ativo (em uso), concluido (fechado)';


--
-- Name: status_lote_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_lote_enum AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido',
    'rascunho'
);


ALTER TYPE public.status_lote_enum OWNER TO neondb_owner;

--
-- Name: TYPE status_lote_enum; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado)';


--
-- Name: tipo_contratante_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.tipo_contratante_enum AS ENUM (
    'clinica',
    'entidade'
);


ALTER TYPE public.tipo_contratante_enum OWNER TO neondb_owner;

--
-- Name: tipo_lote_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.tipo_lote_enum AS ENUM (
    'completo',
    'operacional',
    'gestao'
);


ALTER TYPE public.tipo_lote_enum OWNER TO neondb_owner;

--
-- Name: TYPE tipo_lote_enum; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.tipo_lote_enum IS 'Tipo de lote: completo (todos funcionários), operacional (apenas operacionais), gestao (apenas gestores)';


--
-- Name: tipo_notificacao; Type: TYPE; Schema: public; Owner: neondb_owner
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
    'laudo_emitido_automaticamente',
    'parcela_pendente',
    'parcela_vencendo',
    'quitacao_completa',
    'lote_concluido_aguardando_laudo',
    'laudo_emitido',
    'relatorio_semanal_pendencias',
    'laudo_enviado',
    'recibo_emitido',
    'recibo_gerado_retroativo',
    'emissao_solicitada_sucesso'
);


ALTER TYPE public.tipo_notificacao OWNER TO neondb_owner;

--
-- Name: TYPE tipo_notificacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.tipo_notificacao IS 'Tipos de notificação suportados no sistema. laudo_enviado é disparado após PDF + hash + status=enviado';


--
-- Name: tipo_plano; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.tipo_plano AS ENUM (
    'personalizado',
    'fixo'
);


ALTER TYPE public.tipo_plano OWNER TO neondb_owner;

--
-- Name: usuario_tipo_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor_rh',
    'gestor_entidade',
    'admin',
    'emissor'
);


ALTER TYPE public.usuario_tipo_enum OWNER TO neondb_owner;

--
-- Name: arquivar_notificacoes_antigas(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.arquivar_notificacoes_antigas() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET arquivada = TRUE
  WHERE lida = TRUE
    AND criado_em < NOW() - INTERVAL '30 days'
    AND arquivada = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.arquivar_notificacoes_antigas() OWNER TO neondb_owner;

--
-- Name: atualizar_contratacao_personalizada_atualizado_em(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_contratacao_personalizada_atualizado_em() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_contratacao_personalizada_atualizado_em() OWNER TO neondb_owner;

--
-- Name: atualizar_data_modificacao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_data_modificacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_data_modificacao() OWNER TO neondb_owner;

--
-- Name: atualizar_notificacao_admin_timestamp(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_notificacao_admin_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_notificacao_admin_timestamp() OWNER TO neondb_owner;

--
-- Name: atualizar_timestamp_configuracoes(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_timestamp_configuracoes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em = NOW();
  NEW.atualizado_por_cpf = COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), NEW.atualizado_por_cpf);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_timestamp_configuracoes() OWNER TO neondb_owner;

--
-- Name: atualizar_ultima_avaliacao_funcionario(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.atualizar_ultima_avaliacao_funcionario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote_codigo VARCHAR(20);
  v_motivo_inativacao TEXT;
BEGIN
  -- Get batch code
  SELECT l.codigo INTO v_lote_codigo
  FROM lotes_avaliacao l
  WHERE l.id = NEW.lote_id;

  -- Get inactivation reason (if applicable)
  IF NEW.status = 'inativada' THEN
    v_motivo_inativacao := NEW.motivo_inativacao;
  ELSE
    v_motivo_inativacao := NULL;
  END IF;

  -- Update employee only if this evaluation is more recent
  -- IMPORTANT: ultima_avaliacao_data_conclusao is only updated for COMPLETED evaluations
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultimo_lote_codigo = v_lote_codigo,
    ultima_avaliacao_data_conclusao = CASE 
      WHEN NEW.status = 'concluida' THEN NEW.envio
      ELSE ultima_avaliacao_data_conclusao  -- Keep previous value if not completed
    END,
    ultima_avaliacao_status = NEW.status,
    ultimo_motivo_inativacao = v_motivo_inativacao,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_ultima_avaliacao_funcionario() OWNER TO neondb_owner;

--
-- Name: audit_bypassrls_session(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.audit_bypassrls_session() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_bypassrls_session(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_bypassrls_session() IS 'Audits BYPASSRLS session starts. Call this at beginning of maintenance scripts.';


--
-- Name: audit_laudo_creation(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.audit_laudo_creation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO audit_logs (action, resource, resource_id, new_data)
  VALUES (
    'laudo_criado',
    'laudos',
    NEW.id::TEXT,
    jsonb_build_object(
      'lote_id', NEW.lote_id,
      'status', NEW.status,
      'tamanho_pdf', LENGTH(NEW.relatorio_lote)
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_laudo_creation() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_laudo_creation(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_laudo_creation() IS 'Audita criação de laudos usando a coluna relatorio_lote para tamanho do PDF';


--
-- Name: audit_log_with_context(character varying, character varying, character varying, text, character, integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) IS 'Registra ação no audit_logs incluindo contexto completo (user, clínica, contratante). Faz casting seguro do IP (inet).';


--
-- Name: audit_lote_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.audit_lote_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudanças significativas
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em OR
       OLD.processamento_em IS DISTINCT FROM NEW.processamento_em THEN
      
      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        COALESCE(current_setting('app.current_user_cpf', true), 'system'),
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
          'processamento_em', NEW.processamento_em,
          'mudancas', jsonb_build_object(
            'status_anterior', OLD.status,
            'status_novo', NEW.status
          )
        ),
        NULLIF(current_setting('app.client_ip', true), '')::inet
      );
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.audit_lote_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_lote_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_lote_change() IS 'Trigger de auditoria para lotes com cast correto do ip_address';


--
-- Name: audit_lote_status_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.audit_lote_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_data, new_data)
    VALUES (
      'lote_status_change',
      'lotes_avaliacao',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'modo_emergencia', (to_jsonb(NEW) ->> 'modo_emergencia')::boolean,
        'motivo_emergencia', (to_jsonb(NEW) ->> 'motivo_emergencia')::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_lote_status_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_lote_status_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_lote_status_change() IS 'Função de auditoria de mudança de status de lote (defensiva)';


--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.audit_trigger_func() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_trigger_func(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger de auditoria que permite user_cpf e user_perfil NULL quando contexto não está setado (usa NULLIF para converter string vazia em NULL)';


--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.audit_trigger_function() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_usuario_cpf VARCHAR(11);
    v_usuario_perfil VARCHAR(30);
    v_registro_id TEXT;
BEGIN
    -- Tentar obter contexto da sessão; se não disponível, usar valores de fallback
    BEGIN
      v_usuario_cpf := current_setting('app.current_user_cpf', true);
      v_usuario_perfil := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
      v_usuario_cpf := NULL; -- allow NULLs; audit_logs.user_cpf can be null in some cases
      v_usuario_perfil := NULL;
    END;

    -- Determinar registro id (OLD/NEW)
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id::TEXT;
    ELSE
        v_registro_id := NEW.id::TEXT;
    END IF;

    -- Inserir no audit_logs com campos compatíveis
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (resource, action, resource_id, user_cpf, user_perfil, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(OLD)::JSONB);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.audit_trigger_function() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_trigger_function(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com mapeamento correto de colunas e fallback quando contexto da sessão não estiver disponível.';


--
-- Name: calcular_elegibilidade_lote(integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    (CASE
      WHEN f.indice_avaliacao = 0 THEN 'New employee (never evaluated)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Delayed index (missed ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' batch(es))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Never completed evaluation'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Over 1 year without completed evaluation'
      ELSE 'Regular renewal'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.ultima_avaliacao_data_conclusao IS NOT NULL AND f.ultima_avaliacao_status = 'concluida' 
        THEN EXTRACT(DAY FROM NOW() - f.ultima_avaliacao_data_conclusao)::INTEGER
      WHEN f.data_ultimo_lote IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Never evaluated
      f.indice_avaliacao = 0
      OR
      -- Index is delayed BUT no recent completed evaluation
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Last evaluation was completed over 1 year ago
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Never completed any evaluation (only inactivated)
      (f.ultima_avaliacao_data_conclusao IS NULL AND f.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 1
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Ajustada para incluir <= p_numero_lote_atual - 1';


--
-- Name: calcular_elegibilidade_lote_contratante(integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    (CASE
      WHEN f.indice_avaliacao = 0 THEN 'New employee (never evaluated)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Delayed index (missed ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' batch(es))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Never completed evaluation'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Over 1 year without completed evaluation'
      ELSE 'Regular renewal'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.ultima_avaliacao_data_conclusao IS NOT NULL AND f.ultima_avaliacao_status = 'concluida' 
        THEN EXTRACT(DAY FROM NOW() - f.ultima_avaliacao_data_conclusao)::INTEGER
      WHEN f.data_ultimo_lote IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE
    f.contratante_id = p_contratante_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Never evaluated
      f.indice_avaliacao = 0
      OR
      -- Index is delayed BUT no recent completed evaluation
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Last evaluation was completed over 1 year ago
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Never completed any evaluation (only inactivated)
      (f.ultima_avaliacao_data_conclusao IS NULL AND f.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 1
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionarios devem ser incluidos no proximo lote de entidade com base em indice, data (>1 ano) e novos funcionarios';


--
-- Name: calcular_hash_pdf(bytea); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_hash_pdf(pdf_data bytea) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION public.calcular_hash_pdf(pdf_data bytea) OWNER TO neondb_owner;

--
-- Name: FUNCTION calcular_hash_pdf(pdf_data bytea); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.calcular_hash_pdf(pdf_data bytea) IS 'Calcula hash SHA-256 de um PDF em formato BYTEA';


--
-- Name: calcular_vigencia_fim(date); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_vigencia_fim(data_inicio date) RETURNS date
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Vigência de 364 dias a partir da data de início
    RETURN data_inicio + INTERVAL '364 days';
END;
$$;


ALTER FUNCTION public.calcular_vigencia_fim(data_inicio date) OWNER TO neondb_owner;

--
-- Name: FUNCTION calcular_vigencia_fim(data_inicio date); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.calcular_vigencia_fim(data_inicio date) IS 'Calcula data fim da vigência (data início + 364 dias)';


--
-- Name: check_laudo_immutability(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.check_laudo_immutability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Permitir INSERT sempre
  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  END IF;

  -- Para UPDATE, verificar se o laudo foi emitido
  IF (TG_OP = 'UPDATE' AND OLD.emitido_em IS NOT NULL) THEN
    -- Permitir atualização APENAS do hash_pdf quando está NULL ou vazio
    -- E apenas se nenhum outro campo foi alterado
    IF (OLD.hash_pdf IS NULL OR OLD.hash_pdf = '') AND
       (NEW.hash_pdf IS NOT NULL AND NEW.hash_pdf != '') AND
       -- Verificar que NENHUM outro campo mudou
       OLD.lote_id = NEW.lote_id AND
       OLD.emissor_cpf = NEW.emissor_cpf AND
       OLD.status = NEW.status AND
       OLD.observacoes = NEW.observacoes AND
       (OLD.emitido_em = NEW.emitido_em OR (OLD.emitido_em IS NULL AND NEW.emitido_em IS NULL)) AND
       (OLD.enviado_em = NEW.enviado_em OR (OLD.enviado_em IS NULL AND NEW.enviado_em IS NULL)) THEN
      -- Permitir apenas esta atualização específica
      RETURN NEW;
    END IF;

    -- Qualquer outra tentativa de modificação é bloqueada
    RAISE EXCEPTION 'Não é permitido modificar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  -- DELETE não é permitido para laudos emitidos
  IF (TG_OP = 'DELETE' AND OLD.emitido_em IS NOT NULL) THEN
    RAISE EXCEPTION 'Não é permitido deletar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_laudo_immutability() OWNER TO neondb_owner;

--
-- Name: FUNCTION check_laudo_immutability(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.check_laudo_immutability() IS 'Garante imutabilidade de laudos emitidos, exceto para backfill do hash_pdf quando NULL';


--
-- Name: check_resposta_immutability(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.check_resposta_immutability() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Respostas de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_resposta_immutability() OWNER TO neondb_owner;

--
-- Name: FUNCTION check_resposta_immutability(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída';


--
-- Name: check_resultado_immutability(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.check_resultado_immutability() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Resultados de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = NEW.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido adicionar resultados a avaliações já concluídas. Avaliação ID: %', NEW.avaliacao_id
        USING HINT = 'Finalize a avaliação antes de tentar adicionar resultados novamente.', ERRCODE = '23506';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_resultado_immutability() OWNER TO neondb_owner;

--
-- Name: FUNCTION check_resultado_immutability(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.check_resultado_immutability() IS 'Bloqueia modificações/inserções em resultados quando avaliação está concluída';


--
-- Name: contratante_pode_logar(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.contratante_pode_logar(p_contratante_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_pagamento_confirmado BOOLEAN;
    v_data_liberacao TIMESTAMP;
    v_status status_aprovacao_enum;
    v_ativa BOOLEAN;
BEGIN
    SELECT pagamento_confirmado, data_liberacao_login, status, ativa
    INTO v_pagamento_confirmado, v_data_liberacao, v_status, v_ativa
    FROM public.contratantes
    WHERE id = p_contratante_id;

    -- Regra: precisa ter pagamento confirmado, data de liberação definida, status aprovado e estar ativa
    RETURN COALESCE(v_pagamento_confirmado, false)
        AND v_data_liberacao IS NOT NULL
        AND v_status = 'aprovado'
        AND COALESCE(v_ativa, false);
END;
$$;


ALTER FUNCTION public.contratante_pode_logar(p_contratante_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION contratante_pode_logar(p_contratante_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.contratante_pode_logar(p_contratante_id integer) IS 'Verifica se um contratante pode fazer login baseado em regras de negócio';


--
-- Name: contratantes_sync_status_ativa(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.contratantes_sync_status_ativa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Ativa NUNCA pode ser true sem pagamento confirmado
  -- A constraint chk_ativa_exige_pagamento já protege isso, mas este trigger
  -- garante consistência preventiva
  
  IF NEW.ativa = true AND NEW.pagamento_confirmado = false THEN
    RAISE EXCEPTION 'Não é possível ativar contratante sem pagamento confirmado';
  END IF;
  
  -- Se pagamento foi confirmado mas contratante não está ativo, ativar
  IF NEW.pagamento_confirmado = true AND NEW.ativa = false THEN
    NEW.ativa := true;
    RAISE NOTICE 'Contratante %: Pagamento confirmado, ativando automaticamente', NEW.id;
  END IF;
  
  -- Se pagamento foi removido/cancelado, desativar
  IF NEW.pagamento_confirmado = false AND OLD.pagamento_confirmado = true THEN
    NEW.ativa := false;
    RAISE NOTICE 'Contratante %: Pagamento cancelado, desativando', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.contratantes_sync_status_ativa() OWNER TO neondb_owner;

--
-- Name: FUNCTION contratantes_sync_status_ativa(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.contratantes_sync_status_ativa() IS 'Garante que ativa só é true quando pagamento_confirmado é true. Remove lógica antiga que forçava ativa=true para aguardando_pagamento.';


--
-- Name: contratantes_sync_status_ativa_personalizado(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.contratantes_sync_status_ativa_personalizado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_status_ativo status_aprovacao_enum[] := ARRAY['aprovado'::status_aprovacao_enum];
    v_status_inativo status_aprovacao_enum[] := ARRAY['rejeitado'::status_aprovacao_enum];
    v_plano_tipo VARCHAR(50);
    v_pagamento_confirmado BOOLEAN;
BEGIN
  -- Para inserts e updates
  IF TG_OP IN ('INSERT', 'UPDATE') THEN

    -- Buscar informações do plano e pagamento
    SELECT p.tipo, c2.pagamento_confirmado INTO v_plano_tipo, v_pagamento_confirmado
    FROM contratantes c2
    LEFT JOIN planos p ON c2.plano_id = p.id
    WHERE c2.id = NEW.id;

    -- Regra 1: Status aprovado → ativa deve ser true, MAS apenas se:
    -- - Não é plano personalizado, OU
    -- - É personalizado E pagamento confirmado
    IF NEW.status = ANY(v_status_ativo) AND NEW.ativa IS NOT TRUE THEN
      IF v_plano_tipo != 'personalizado' OR (v_plano_tipo = 'personalizado' AND v_pagamento_confirmado = true) THEN
        NEW.ativa := true;
        RAISE NOTICE 'Contratante %: Status % requer ativa=true, corrigindo', NEW.id, NEW.status;
      END IF;
    END IF;

    -- Regra 2: Status rejeitado/inativa → ativa deve ser false
    IF NEW.status = ANY(v_status_inativo) AND NEW.ativa IS NOT FALSE THEN
      NEW.ativa := false;
      RAISE NOTICE 'Contratante %: Status % requer ativa=false, corrigindo', NEW.id, NEW.status;
    END IF;

    -- Regra 3: Se ativa=true mas status não é aprovado → corrigir para 'aprovado'
    IF NEW.ativa = true AND NOT (NEW.status = ANY(v_status_ativo)) THEN
      NEW.status := 'aprovado'::status_aprovacao_enum;
      RAISE NOTICE 'Contratante %: ativa=true requer status aprovado, definindo status=aprovado', NEW.id;
    END IF;

    -- Regra 4: Se ativa=false mas status é aprovado → corrigir para 'rejeitado' APENAS se não é personalizado ou pagamento não confirmado
    IF NEW.ativa = false AND NEW.status = ANY(v_status_ativo) THEN
      IF v_plano_tipo != 'personalizado' OR (v_plano_tipo = 'personalizado' AND v_pagamento_confirmado = false) THEN
        NEW.status := 'rejeitado'::status_aprovacao_enum;
        RAISE NOTICE 'Contratante %: ativa=false com status aprovado, definindo status=rejeitado', NEW.id;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.contratantes_sync_status_ativa_personalizado() OWNER TO neondb_owner;

--
-- Name: criar_conta_responsavel_personalizado(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.criar_conta_responsavel_personalizado(p_contratante_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_contratante RECORD;
    v_senha_temporaria VARCHAR(50);
    v_senha_hash VARCHAR(255);
    v_existe_conta BOOLEAN;
BEGIN
    -- Buscar dados do contratante
    SELECT * INTO v_contratante 
    FROM contratantes 
    WHERE id = p_contratante_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contratante ID % não encontrado', p_contratante_id;
    END IF;
    
    -- Verificar se conta já existe
    SELECT EXISTS(
        SELECT 1 FROM contratantes_senhas 
        WHERE contratante_id = p_contratante_id 
        AND cpf = v_contratante.responsavel_cpf
    ) INTO v_existe_conta;
    
    IF v_existe_conta THEN
        RAISE NOTICE 'Conta já existe para contratante %', p_contratante_id;
        RETURN;
    END IF;
    
    -- Gerar senha temporária (padrão: TEMP_ + CPF)
    v_senha_temporaria := 'TEMP_' || v_contratante.responsavel_cpf;
    
    -- Criar hash bcrypt da senha
    v_senha_hash := crypt(v_senha_temporaria, gen_salt('bf'));
    
    -- Inserir senha na tabela contratantes_senhas
    INSERT INTO contratantes_senhas (
        contratante_id, 
        cpf, 
        senha_hash, 
        criado_em,
        atualizado_em
    ) VALUES (
        p_contratante_id, 
        v_contratante.responsavel_cpf, 
        v_senha_hash, 
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Log de auditoria (se tabela audit_log existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (
            resource, 
            action, 
            resource_id, 
            details, 
            ip_address, 
            created_at
        ) VALUES (
            'contratantes_senhas', 
            'CREATE', 
            p_contratante_id, 
            'Conta responsável criada automaticamente via fluxo personalizado', 
            'system', 
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RAISE NOTICE 'Conta criada para responsável CPF % do contratante %', v_contratante.responsavel_cpf, p_contratante_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar conta para contratante %: %', p_contratante_id, SQLERRM;
        -- Não falhar a transação principal, apenas logar o erro
END;
$$;


ALTER FUNCTION public.criar_conta_responsavel_personalizado(p_contratante_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION criar_conta_responsavel_personalizado(p_contratante_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.criar_conta_responsavel_personalizado(p_contratante_id integer) IS 'Cria conta de acesso para responsável do contratante após ativação (fluxo personalizado)';


--
-- Name: criar_notificacao_recibo(integer, integer, public.tipo_notificacao); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.criar_notificacao_recibo(p_recibo_id integer, p_contratante_id integer, p_tipo public.tipo_notificacao DEFAULT 'recibo_emitido'::public.tipo_notificacao) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_notificacao_id INTEGER;
  v_responsavel_cpf VARCHAR(14);
  v_numero_recibo VARCHAR(50);
BEGIN
  -- Buscar CPF do responsável e número do recibo
  SELECT c.responsavel_cpf, r.numero_recibo
  INTO v_responsavel_cpf, v_numero_recibo
  FROM contratantes c
  CROSS JOIN recibos r
  WHERE c.id = p_contratante_id
    AND r.id = p_recibo_id;

  IF v_responsavel_cpf IS NULL THEN
    RAISE NOTICE 'Responsável não encontrado para contratante %', p_contratante_id;
    RETURN NULL;
  END IF;

  -- Criar notificação
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_id,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto
  ) VALUES (
    p_tipo,
    'media',
    p_contratante_id,
    'gestor_entidade',
    CASE 
      WHEN p_tipo = 'recibo_gerado_retroativo' 
      THEN 'Recibo Retroativo Disponível'
      ELSE 'Recibo de Pagamento Gerado'
    END,
    CASE 
      WHEN p_tipo = 'recibo_gerado_retroativo'
      THEN 'Recibo retroativo ' || v_numero_recibo || ' foi gerado para seu pagamento de 2025. Disponível para download.'
      ELSE 'Seu recibo de pagamento ' || v_numero_recibo || ' foi gerado com sucesso. Clique para visualizar ou baixar.'
    END,
    jsonb_build_object(
      'recibo_id', p_recibo_id,
      'numero_recibo', v_numero_recibo,
      'tipo_geracao', CASE WHEN p_tipo = 'recibo_gerado_retroativo' THEN 'retroativo' ELSE 'imediato' END
    ),
    '/recibo/' || p_recibo_id,
    'Ver Recibo'
  ) RETURNING id INTO v_notificacao_id;

  RETURN v_notificacao_id;
END;
$$;


ALTER FUNCTION public.criar_notificacao_recibo(p_recibo_id integer, p_contratante_id integer, p_tipo public.tipo_notificacao) OWNER TO neondb_owner;

--
-- Name: criar_notificacao_recibo(integer, character varying, numeric, character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_notificacao_id INTEGER;
  v_contratante_nome VARCHAR(200);
BEGIN
  -- Buscar nome do contratante
  SELECT nome INTO v_contratante_nome
  FROM contratantes
  WHERE id = p_contratante_id;

  -- Criar notificação
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_cpf,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto,
    criado_em
  ) VALUES (
    'pagamento_confirmado',
    'alta',
    p_destinatario_cpf,
    'contratante',
    'Recibo de Pagamento Gerado',
    format('Seu recibo %s no valor de R$ %s foi gerado com sucesso para %s.', 
           p_recibo_numero, 
           p_valor_total::TEXT, 
           v_contratante_nome),
    jsonb_build_object(
      'contratante_id', p_contratante_id,
      'recibo_numero', p_recibo_numero,
      'valor_total', p_valor_total
    ),
    '/recibos/' || p_recibo_numero,
    'Ver Recibo',
    NOW()
  ) RETURNING id INTO v_notificacao_id;

  RETURN v_notificacao_id;
END;
$_$;


ALTER FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) IS 'Cria notificação quando um recibo é gerado após confirmação de pagamento';


--
-- Name: current_user_clinica_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_clinica_id() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_clinica_id(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_clinica_id() IS 'Returns current user clinica_id from session context.
   RAISES EXCEPTION if not set for perfil RH (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';


--
-- Name: current_user_clinica_id_optional(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_clinica_id_optional() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_clinica_id_optional(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_clinica_id_optional() IS 'Retorna o clinica_id do usuÃƒÂ¡rio atual para isolamento de dados por clÃƒÂ­nica';


--
-- Name: current_user_contratante_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.current_user_contratante_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_contratante_id() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_contratante_id(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_contratante_id() IS 'Returns current user contratante_id from session context.
   RAISES EXCEPTION if not set for perfil gestor_entidade (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';


--
-- Name: current_user_contratante_id_optional(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.current_user_contratante_id_optional() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_contratante_id_optional() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_contratante_id_optional(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_contratante_id_optional() IS 'Retorna o contratante_id do contexto da sessÃ£o para RLS de entidades';


--
-- Name: current_user_cpf(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.current_user_cpf() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_cpf() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_cpf(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_cpf() IS 'Returns current user CPF from session context. 
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates CPF format (11 digits).';


--
-- Name: current_user_is_gestor(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_is_gestor() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_is_gestor(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_is_gestor() IS 'Retorna TRUE se o usuário atual é gestor (RH, Entidade ou Admin). Gestores não usam RLS.';


--
-- Name: current_user_perfil(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.current_user_perfil() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_perfil', TRUE), '');
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_perfil() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_perfil(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_perfil() IS 'Returns current user perfil from session context.
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates perfil is in allowed list.';


--
-- Name: detectar_anomalia_score(numeric, character varying, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.detectar_anomalia_score(p_score numeric, p_tipo character varying, p_grupo integer) RETURNS TABLE(is_anomalous boolean, reason text, adjusted_score numeric)
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Scores fora do range válido (0-100)

    IF p_score < 0 OR p_score > 100 THEN

        RETURN QUERY SELECT true, 'Score fora do intervalo válido', GREATEST(0, LEAST(100, p_score));

        RETURN;

    END IF;

    

    -- Scores negativos em escalas positivas

    IF p_score < 0 AND p_tipo = 'positiva' THEN

        RETURN QUERY SELECT true, 'Score negativo em escala positiva', 0::DECIMAL;

        RETURN;

    END IF;

    

    -- Padrões suspeitos (todas respostas iguais)

    IF p_score IN (0, 25, 50, 75, 100) THEN

        RETURN QUERY SELECT true, 'Possível padrão de resposta uniforme', p_score;

        RETURN;

    END IF;

    

    -- Grupos específicos

    IF p_grupo = 8 AND p_score > 0 THEN

        RETURN QUERY SELECT true, 'Comportamentos ofensivos detectados', GREATEST(p_score, 25);

        RETURN;

    END IF;

    

    -- Score normal

    RETURN QUERY SELECT false, 'Score normal'::TEXT, p_score;

END;

$$;


ALTER FUNCTION public.detectar_anomalia_score(p_score numeric, p_tipo character varying, p_grupo integer) OWNER TO neondb_owner;

--
-- Name: detectar_anomalias_indice(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, tipo_anomalia character varying, detalhes text, severidade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Anomalia 1: Mais de 3 inativacoes consecutivas (padrao suspeito)
    SELECT 
      f.cpf,
      f.nome,
    'INATIVACOES CONSECUTIVAS'::varchar(50) AS tipo_anomalia,
    ('Funcionario tem ' || COUNT(a.id) || ' inativacoes consecutivas nos ultimos lotes. ' ||
    'Possivel padrao de desistencia ou problemas sistemicos.')::text AS detalhes,
    'CRITICA'::varchar(20) AS severidade
    FROM funcionarios f
    JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
    JOIN lotes_avaliacao la ON a.lote_id = la.id
    WHERE 
      f.empresa_id = p_empresa_id
      AND a.status = 'inativada'
      AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
    GROUP BY f.cpf, f.nome
    HAVING COUNT(a.id) >= 3
    
    UNION ALL
    
    -- Anomalia 2: Indice muito atrasado (>5 lotes de diferenca)
    SELECT 
      f.cpf,
      f.nome,
      'INDICE ATRASADO'::varchar(50) AS tipo_anomalia,
      ('Funcionario tem indice ' || f.indice_avaliacao || ' mas o lote atual e ' || 
      (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) || '. ' ||
      'Diferenca de ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) || ' lotes.')::text AS detalhes,
      (CASE 
        WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10 THEN 'CRITICA'
        WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5 THEN 'ALTA'
        ELSE 'MEDIA'
      END)::varchar(20) AS severidade
    FROM funcionarios f
    WHERE 
      f.empresa_id = p_empresa_id
      AND f.ativo = true
      AND f.indice_avaliacao > 0
      AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5
    
    UNION ALL
    
    -- Anomalia 3: Mais de 2 anos sem avaliacao (violacao critica)
    SELECT 
      f.cpf,
      f.nome,
      'PRAZO EXCEDIDO'::varchar(50) AS tipo_anomalia,
      ('Funcionario esta ha ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliacao valida. ' ||
      'Violacao critica da obrigatoriedade de renovacao anual.')::text AS detalhes,
      'CRITICA'::varchar(20) AS severidade
    FROM funcionarios f
    WHERE 
      f.empresa_id = p_empresa_id
      AND f.ativo = true
      AND f.data_ultimo_lote IS NOT NULL
      AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'
    
    UNION ALL
    
    -- Anomalia 4: Funcionario ativo com indice 0 por muito tempo (>6 meses)
    SELECT 
      f.cpf,
      f.nome,
    'NUNCA AVALIADO'::varchar(50) AS tipo_anomalia,
    ('Funcionario esta ha ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliacao. ' ||
    'Pode indicar erro no processo de liberacao de lotes.')::text AS detalhes,
    'ALTA'::varchar(20) AS severidade
    FROM funcionarios f
    WHERE 
      f.empresa_id = p_empresa_id
      AND f.ativo = true
      AND f.indice_avaliacao = 0
      AND f.criado_em < NOW() - INTERVAL '6 months'
  ) AS anom
  ORDER BY 
    CASE 
      WHEN anom.severidade = 'CRITICA' THEN 1
      WHEN anom.severidade = 'ALTA' THEN 2
      WHEN anom.severidade = 'MEDIA' THEN 3
      ELSE 4
    END,
    anom.nome;
END;
$$;


ALTER FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION detectar_anomalias_indice(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) IS 'Detecta padroes suspeitos no historico de avaliacoes (>3 faltas, indice atrasado, >2 anos sem avaliacao)';


--
-- Name: diagnosticar_lote_emissao(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) RETURNS TABLE(campo text, valor text, status_ok boolean, mensagem text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote RECORD;
  v_avaliacoes RECORD;
BEGIN
  -- Buscar dados do lote
  SELECT * INTO v_lote FROM lotes_avaliacao WHERE id = p_lote_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'lote'::TEXT, 'NOT_FOUND'::TEXT, false, 'Lote nÃ£o encontrado'::TEXT;
    RETURN;
  END IF;

  -- Buscar estatÃ­sticas de avaliaÃ§Ãµes
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO v_avaliacoes
  FROM avaliacoes WHERE lote_id = p_lote_id;

  -- Retornar diagnÃ³stico
  RETURN QUERY SELECT 'status'::TEXT, v_lote.status::TEXT, true, 'Status do lote'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_total'::TEXT, v_avaliacoes.total::TEXT, v_avaliacoes.total > 0, 'Total de avaliaÃ§Ãµes'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_concluidas'::TEXT, v_avaliacoes.concluidas::TEXT, v_avaliacoes.concluidas > 0, 'AvaliaÃ§Ãµes concluÃ­das'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_pendentes'::TEXT, v_avaliacoes.pendentes::TEXT, v_avaliacoes.pendentes = 0, 'AvaliaÃ§Ãµes pendentes'::TEXT;
  RETURN QUERY SELECT 'emitido_em'::TEXT, COALESCE(v_lote.emitido_em::TEXT, 'NULL'), v_lote.emitido_em IS NOT NULL, 'Data de emissÃ£o'::TEXT;
  RETURN QUERY SELECT 'enviado_em'::TEXT, COALESCE(v_lote.enviado_em::TEXT, 'NULL'), v_lote.enviado_em IS NOT NULL, 'Data de envio'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_agendado'::TEXT, v_lote.auto_emitir_agendado::TEXT, v_lote.auto_emitir_agendado, 'Flag de agendamento'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_em'::TEXT, COALESCE(v_lote.auto_emitir_em::TEXT, 'NULL'), v_lote.auto_emitir_em IS NOT NULL, 'Data agendada'::TEXT;
  RETURN QUERY SELECT 'cancelado_auto'::TEXT, COALESCE(v_lote.cancelado_automaticamente::TEXT, 'false'), NOT COALESCE(v_lote.cancelado_automaticamente, false), 'Cancelamento automÃ¡tico'::TEXT;
  
  RETURN;
END;
$$;


ALTER FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION diagnosticar_lote_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) IS 'FunÃ§Ã£o de diagnÃ³stico para depuraÃ§Ã£o de problemas de emissÃ£o';


--
-- Name: execute_maintenance(text, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.execute_maintenance(p_description text, p_sql text) OWNER TO neondb_owner;

--
-- Name: FUNCTION execute_maintenance(p_description text, p_sql text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.execute_maintenance(p_description text, p_sql text) IS 'Executes maintenance SQL with full audit trail.
   Usage: SELECT execute_maintenance(''Fix data'', ''UPDATE table...'');
   Only accessible to BYPASSRLS roles.';


--
-- Name: fn_audit_contratantes_senhas(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_audit_contratantes_senhas() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Registrar INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO contratantes_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'INSERT',
            NEW.contratante_id,
            NEW.cpf,
            NULL,
            NEW.senha_hash,
            current_user,
            'Nova senha criada'
        );
        RETURN NEW;
    
    -- Registrar UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO contratantes_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'UPDATE',
            NEW.contratante_id,
            NEW.cpf,
            OLD.senha_hash,
            NEW.senha_hash,
            current_user,
            CASE 
                WHEN OLD.senha_hash != NEW.senha_hash THEN 'Senha alterada'
                ELSE 'Dados atualizados'
            END
        );
        RETURN NEW;
    
    -- Registrar DELETE (e BLOQUEAR!)
    ELSIF TG_OP = 'DELETE' THEN
        -- PROTEÇÃO CRÍTICA: Verificar se a deleção está autorizada
        IF current_setting('app.allow_senha_delete', true) IS NULL 
           OR current_setting('app.allow_senha_delete', true) != 'true' THEN
            
            -- Registrar tentativa bloqueada
            INSERT INTO contratantes_senhas_audit (
                operacao,
                contratante_id,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                'DELETE',
                OLD.contratante_id,
                OLD.cpf,
                OLD.senha_hash,
                NULL,
                current_user,
                'TENTATIVA BLOQUEADA: Delete não autorizado'
            );
            
            RAISE EXCEPTION 'OPERAÇÃO BLOQUEADA: Delete de senhas requer autorização explícita. Use fn_delete_senha_autorizado() para deletar senhas com segurança.';
        END IF;
        
        -- Se chegou aqui, está autorizado - registrar
        INSERT INTO contratantes_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'DELETE',
            OLD.contratante_id,
            OLD.cpf,
            OLD.senha_hash,
            NULL,
            current_user,
            'Delete autorizado via função segura'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.fn_audit_contratantes_senhas() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_audit_contratantes_senhas(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_audit_contratantes_senhas() IS 'Audita e BLOQUEIA operacoes nao autorizadas em contratantes_senhas';


--
-- Name: fn_buscar_solicitante_laudo(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) RETURNS TABLE(cpf character varying, nome character varying, perfil character varying, solicitado_em timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fe.solicitado_por,
        COALESCE(
            f.nome, 
            cs.nome, 
            'Usuário Desconhecido'
        ) AS nome,
        fe.tipo_solicitante,
        fe.solicitado_em
    FROM laudos l
    INNER JOIN fila_emissao fe ON l.lote_id = fe.lote_id
    LEFT JOIN funcionarios f ON fe.solicitado_por = f.cpf
    LEFT JOIN contratantes_senhas cs ON fe.solicitado_por = cs.cpf
    WHERE l.id = p_laudo_id
    AND fe.solicitado_por IS NOT NULL;
END;
$$;


ALTER FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_buscar_solicitante_laudo(p_laudo_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) IS 'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';


--
-- Name: fn_create_funcionario_autorizado(character varying, text, text, text, character varying, boolean, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_create_funcionario_autorizado(p_cpf character varying, p_nome text, p_email text, p_senha_hash text, p_perfil character varying, p_ativo boolean DEFAULT true, p_contratante_id integer DEFAULT NULL::integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RAISE NOTICE 'fn_create_funcionario_autorizado called: cpf=% perfil=% contratante_id=%', p_cpf, p_perfil, p_contratante_id;
  INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, contratante_id, criado_em, atualizado_em)
  VALUES (p_cpf, p_nome, p_email, p_senha_hash, p_perfil, p_ativo, p_contratante_id, NOW(), NOW())
  ON CONFLICT (cpf) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, funcionarios.nome),
    email = COALESCE(EXCLUDED.email, funcionarios.email),
    senha_hash = EXCLUDED.senha_hash,
    perfil = COALESCE(EXCLUDED.perfil, funcionarios.perfil),
    ativo = COALESCE(EXCLUDED.ativo, funcionarios.ativo),
    contratante_id = COALESCE(EXCLUDED.contratante_id, funcionarios.contratante_id),
    atualizado_em = NOW();
  RAISE NOTICE 'fn_create_funcionario_autorizado completed for cpf=%', p_cpf;
END;
$$;


ALTER FUNCTION public.fn_create_funcionario_autorizado(p_cpf character varying, p_nome text, p_email text, p_senha_hash text, p_perfil character varying, p_ativo boolean, p_contratante_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_create_funcionario_autorizado(p_cpf character varying, p_nome text, p_email text, p_senha_hash text, p_perfil character varying, p_ativo boolean, p_contratante_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_create_funcionario_autorizado(p_cpf character varying, p_nome text, p_email text, p_senha_hash text, p_perfil character varying, p_ativo boolean, p_contratante_id integer) IS 'Cria ou atualiza um funcionario em nome do sistema (Security Definer)';


--
-- Name: fn_delete_senha_autorizado(integer, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text DEFAULT 'Não especificado'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Validar motivo
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RAISE EXCEPTION 'Motivo da deleção é obrigatório';
    END IF;
    
    -- Log de segurança
    RAISE NOTICE 'ATENÇÃO: Deletando senha do contratante % com motivo: %', p_contratante_id, p_motivo;
    
    -- Habilitar deleção temporariamente
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Executar delete
    DELETE FROM contratantes_senhas WHERE contratante_id = p_contratante_id;
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senha deletada com sucesso. Operação registrada em contratantes_senhas_audit';
END;
$$;


ALTER FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text) IS 'UNICA forma segura de deletar senhas - requer motivo e registra em auditoria';


--
-- Name: fn_limpar_senhas_teste(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_limpar_senhas_teste() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Esta função pode ser usada apenas em ambiente de desenvolvimento
    IF current_database() = 'nr-bps_db' THEN
        RAISE EXCEPTION 'BLOQUEADO: Esta função não pode ser executada no banco de produção!';
    END IF;
    
    -- Habilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'true', true);
    
    -- Contar senhas que serão deletadas
    SELECT COUNT(*) INTO v_count FROM contratantes_senhas;
    
    RAISE NOTICE 'Limpando % senhas de teste...', v_count;
    
    -- Deletar todas as senhas
    DELETE FROM contratantes_senhas;
    
    -- Desabilitar deleção
    PERFORM set_config('app.allow_senha_delete', 'false', true);
    
    RAISE NOTICE 'Senhas de teste deletadas. Todas as operações foram auditadas.';
END;
$$;


ALTER FUNCTION public.fn_limpar_senhas_teste() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_limpar_senhas_teste(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_limpar_senhas_teste() IS 'APENAS PARA TESTES: Limpa senhas em ambiente de teste';


--
-- Name: fn_limpar_tokens_expirados(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_limpar_tokens_expirados() RETURNS TABLE(tokens_removidos integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_removidos INTEGER;
BEGIN
  DELETE FROM tokens_retomada_pagamento
  WHERE expiracao < NOW() - INTERVAL '7 days'; -- Mantém histórico de 7 dias
  
  GET DIAGNOSTICS total_removidos = ROW_COUNT;
  
  RETURN QUERY SELECT total_removidos;
END;
$$;


ALTER FUNCTION public.fn_limpar_tokens_expirados() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_limpar_tokens_expirados(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_limpar_tokens_expirados() IS 'Remove tokens expirados há mais de 7 dias. Deve ser executado via cron diariamente.';


--
-- Name: fn_marcar_token_usado(character varying, character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_marcar_token_usado(p_token character varying, p_ip character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE tokens_retomada_pagamento
  SET usado = true,
      usado_em = NOW(),
      ip_uso = p_ip
  WHERE token = p_token
    AND usado = false
    AND expiracao > NOW();
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.fn_marcar_token_usado(p_token character varying, p_ip character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_marcar_token_usado(p_token character varying, p_ip character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_marcar_token_usado(p_token character varying, p_ip character varying) IS 'Marca token como usado após pagamento bem-sucedido. Previne reutilização.';


--
-- Name: fn_next_lote_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_next_lote_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_next bigint;
BEGIN
  UPDATE lote_id_allocator
  SET last_id = last_id + 1
  RETURNING last_id INTO v_next;

  RETURN v_next;
END;
$$;


ALTER FUNCTION public.fn_next_lote_id() OWNER TO neondb_owner;

--
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
BEGIN
  -- Só agir quando houve alteração de status
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatísticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- Se condição de conclusão for satisfeita, atualizar lote APENAS
  -- NOTA: Emissão de laudo é 100% MANUAL - não inserir em fila_emissao
  -- O RH/Entidade deve solicitar emissão via botão "Solicitar Emissão"
  -- O emissor então emite o laudo manualmente no dashboard
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessários
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- REMOVIDO: Inserção automática em fila_emissao
    -- Motivo: Emissão de laudo deve ser 100% MANUAL pelo emissor
    -- Fluxo correto:
    --   1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
    --   2. Lote aparece no dashboard do emissor
    --   3. Emissor revisa e clica "Gerar Laudo" manualmente
    --   4. Sistema gera PDF e hash
    --   5. Emissor revisa e envia
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliação muda de status. Marca lote como concluído quando todas avaliações liberadas estão finalizadas (concluídas ou inativadas). Emissão de laudo é 100% MANUAL.';


--
-- Name: fn_reconcluir_lote_for_emergencia(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_reconcluir_lote_for_emergencia(p_lote_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
  v_updated int;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;

  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = p_lote_id AND status IS DISTINCT FROM 'concluido'
    RETURNING 1 INTO v_updated;

    IF FOUND THEN
      INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
      VALUES (p_lote_id, 0, 3, NOW())
      ON CONFLICT (lote_id) DO NOTHING;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION public.fn_reconcluir_lote_for_emergencia(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: fn_relatorio_emissoes_periodo(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) RETURNS TABLE(solicitante_cpf character varying, solicitante_perfil character varying, total_solicitacoes bigint, total_sucessos bigint, total_erros bigint, taxa_sucesso numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fe.solicitado_por,
        fe.tipo_solicitante,
        COUNT(*) AS total_solicitacoes,
        COUNT(CASE WHEN l.status IN ('emitido', 'enviado') THEN 1 END) AS total_sucessos,
        COUNT(CASE WHEN fe.erro IS NOT NULL OR fe.tentativas >= fe.max_tentativas THEN 1 END) AS total_erros,
        ROUND(
            (COUNT(CASE WHEN l.status IN ('emitido', 'enviado') THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
            2
        ) AS taxa_sucesso
    FROM fila_emissao fe
    LEFT JOIN laudos l ON fe.lote_id = l.lote_id
    WHERE fe.solicitado_em BETWEEN p_data_inicio AND p_data_fim
    AND fe.solicitado_por IS NOT NULL
    GROUP BY fe.solicitado_por, fe.tipo_solicitante
    ORDER BY total_solicitacoes DESC;
END;
$$;


ALTER FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) IS 'Gera relatório estatístico de emissões por usuário em um período específico';


--
-- Name: fn_validar_token_pagamento(character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_validar_token_pagamento(p_token character varying) RETURNS TABLE(valido boolean, contratante_id integer, contrato_id integer, plano_id integer, tipo_plano character varying, numero_funcionarios integer, valor_total numeric, erro character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN t.id IS NULL THEN false
      WHEN t.usado = true THEN false
      WHEN t.expiracao < NOW() THEN false
      ELSE true
    END AS valido,
    t.contratante_id,
    t.contrato_id,
    t.plano_id,
    t.tipo_plano,
    t.numero_funcionarios,
    t.valor_total,
    CASE 
      WHEN t.id IS NULL THEN 'Token não encontrado'
      WHEN t.usado = true THEN 'Token já foi utilizado'
      WHEN t.expiracao < NOW() THEN 'Token expirado'
      ELSE NULL
    END AS erro
  FROM tokens_retomada_pagamento t
  WHERE t.token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, 
                        NULL::VARCHAR, NULL::INTEGER, NULL::DECIMAL, 
                        'Token não encontrado'::VARCHAR;
  END IF;
END;
$$;


ALTER FUNCTION public.fn_validar_token_pagamento(p_token character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_validar_token_pagamento(p_token character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_validar_token_pagamento(p_token character varying) IS 'Valida token de retomada de pagamento. Retorna dados se válido ou erro específico se inválido.';


--
-- Name: garantir_template_padrao_unico(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.garantir_template_padrao_unico() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.padrao = TRUE THEN
    UPDATE templates_contrato
    SET padrao = FALSE
    WHERE tipo_template = NEW.tipo_template
      AND id != NEW.id
      AND padrao = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.garantir_template_padrao_unico() OWNER TO neondb_owner;

--
-- Name: gerar_dados_relatorio(integer, integer, integer, date, date); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer DEFAULT 1, p_empresa_id integer DEFAULT NULL::integer, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS TABLE(secao character varying, tipo_dados character varying, dados jsonb, metadados jsonb)
    LANGUAGE plpgsql
    AS $$

DECLARE

    template_config RECORD;

BEGIN

    -- Buscar configuração do template

    SELECT * INTO template_config FROM relatorio_templates WHERE id = p_template_id;

    

    -- Seção: Resumo Executivo

    RETURN QUERY

    SELECT 

        'resumo_executivo'::VARCHAR as secao,

        'estatisticas_gerais'::VARCHAR as tipo_dados,

        jsonb_build_object(

            'total_funcionarios', COUNT(DISTINCT f.cpf),

            'total_avaliacoes', COUNT(a.id),

            'avaliacoes_concluidas', COUNT(CASE WHEN a.status = 'concluida' THEN 1 END),

            'taxa_conclusao', ROUND((COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2)

        ) as dados,

        jsonb_build_object(

            'periodo', COALESCE(p_data_inicio::TEXT, '2024-01-01') || ' a ' || COALESCE(p_data_fim::TEXT, CURRENT_DATE::TEXT),

            'clinica_id', p_clinica_id,

            'empresa_filtro', CASE WHEN p_empresa_id IS NOT NULL THEN 'específica' ELSE 'todas' END

        ) as metadados

    FROM funcionarios f

    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf

    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id 

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND (p_data_inicio IS NULL OR a.created_at >= p_data_inicio)

        AND (p_data_fim IS NULL OR a.created_at <= p_data_fim);

    

    -- Seção: Análise por Domínios

    RETURN QUERY

    SELECT 

        'analise_dominios'::VARCHAR as secao,

        'scores_por_grupo'::VARCHAR as tipo_dados,

        jsonb_agg(

            jsonb_build_object(

                'grupo', grupo_num,

                'dominio', dominio_nome,

                'score_medio', score_medio,

                'categoria', categoria,

                'total_respostas', total_respostas

            )

        ) as dados,

        jsonb_build_object(

            'metodologia', 'COPSOQ-III',

            'escala', '0-100',

            'interpretacao', 'alto=75+, medio=50-74, baixo=0-49'

        ) as metadados

    FROM (

        SELECT 

            r.grupo as grupo_num,

            CASE r.grupo

                WHEN 1 THEN 'Demandas no Trabalho'

                WHEN 2 THEN 'Organização e Conteúdo'

                WHEN 3 THEN 'Relações Sociais'

                WHEN 4 THEN 'Liderança'

                WHEN 5 THEN 'Valores Organizacionais'

                WHEN 6 THEN 'Saúde e Bem-estar'

                WHEN 7 THEN 'Comportamentos Ofensivos'

                WHEN 8 THEN 'Jogos de Apostas'

                WHEN 9 THEN 'Endividamento'

                ELSE 'Outros'

            END as dominio_nome,

            ROUND(AVG(r.valor), 2) as score_medio,

            CASE 

                WHEN AVG(r.valor) >= 75 THEN 'Alto'

                WHEN AVG(r.valor) >= 50 THEN 'Médio'

                ELSE 'Baixo'

            END as categoria,

            COUNT(r.valor) as total_respostas

        FROM respostas r

        JOIN avaliacoes a ON r.avaliacao_id = a.id

        JOIN funcionarios f ON a.funcionario_cpf = f.cpf

        LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

        WHERE f.clinica_id = p_clinica_id 

            AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

            AND a.status = 'concluida'

        GROUP BY r.grupo

        ORDER BY r.grupo

    ) dados_grupos;

    

    -- Seção: Alertas e Recomendações

    RETURN QUERY

    SELECT 

        'alertas_recomendacoes'::VARCHAR as secao,

        'analise_critica'::VARCHAR as tipo_dados,

        jsonb_build_object(

            'alertas_criticos', ARRAY[

                'Comportamentos ofensivos detectados em ' || COUNT(CASE WHEN r.grupo = 8 AND r.valor > 0 THEN 1 END) || ' respostas',

                'Alto risco de Jogos de Apostas em ' || COUNT(CASE WHEN r.grupo = 9 AND r.valor > 50 THEN 1 END) || ' casos',

                'Problemas de endividamento em ' || COUNT(CASE WHEN r.grupo = 10 AND r.valor > 75 THEN 1 END) || ' funcionários'

            ],

            'recomendacoes_prioritarias', ARRAY[

                'Implementar programa de prevenção ao assédio e violência',

                'Oferecer orientação financeira e sobre jogos responsáveis',

                'Revisar carga de trabalho e organização das demandas',

                'Fortalecer canais de comunicação e feedback'

            ]

        ) as dados,

        jsonb_build_object(

            'base_analise', 'Respostas com pontuação de risco',

            'criterios', 'Grupos 8,9,10 com scores > limites críticos',

            'urgencia', 'Alta para comportamentos ofensivos'

        ) as metadados

    FROM respostas r

    JOIN avaliacoes a ON r.avaliacao_id = a.id

    JOIN funcionarios f ON a.funcionario_cpf = f.cpf

    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id 

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND a.status = 'concluida'

        AND r.grupo IN (8, 9, 10);

        

END;

$$;


ALTER FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer, p_empresa_id integer, p_data_inicio date, p_data_fim date) OWNER TO neondb_owner;

--
-- Name: gerar_hash_auditoria(character varying, integer, character varying, jsonb, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) OWNER TO neondb_owner;

--
-- Name: FUNCTION gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) IS 'Sobrecarga para aceitar TIMESTAMPTZ - gera hash SHA-256 para verificar integridade de registros de auditoria';


--
-- Name: gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.gerar_numero_recibo() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    ano INTEGER;
    sequencia INTEGER;
    numero_recibo TEXT;
BEGIN
    ano := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Conta quantos recibos existem no ano atual
    SELECT COUNT(*) + 1 INTO sequencia
    FROM recibos
    WHERE EXTRACT(YEAR FROM criado_em) = ano;
    
    -- Formato: REC-AAAA-NNNNN (ex: REC-2025-00001)
    numero_recibo := 'REC-' || ano || '-' || LPAD(sequencia::TEXT, 5, '0');
    
    RETURN numero_recibo;
END;
$$;


ALTER FUNCTION public.gerar_numero_recibo() OWNER TO neondb_owner;

--
-- Name: FUNCTION gerar_numero_recibo(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.gerar_numero_recibo() IS 'Gera número único de recibo no formato REC-AAAA-NNNNN';


--
-- Name: gerar_token_retomada_pagamento(integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_token TEXT;
    v_expiracao TIMESTAMP;
BEGIN
    -- Gerar token único (hash baseado em timestamp + IDs)
    v_token := md5(
        p_contratante_id::TEXT || 
        p_contrato_id::TEXT || 
        extract(epoch from now())::TEXT ||
        random()::TEXT
    );
    
    -- Expiração: 72 horas (3 dias)
    v_expiracao := CURRENT_TIMESTAMP + INTERVAL '72 hours';
    
    -- Criar ou atualizar registro na tabela de tokens
    INSERT INTO tokens_retomada_pagamento (
        token,
        contratante_id,
        contrato_id,
        expira_em,
        usado
    ) VALUES (
        v_token,
        p_contratante_id,
        p_contrato_id,
        v_expiracao,
        false
    );
    
    RETURN v_token;
END;
$$;


ALTER FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) IS 'Gera token único para permitir retomada de pagamento via link';


--
-- Name: get_contratante_funcionario(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.get_contratante_funcionario(p_funcionario_id integer) RETURNS TABLE(contratante_id integer, contratante_nome character varying, contratante_tipo public.tipo_contratante_enum, contratante_ativo boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        c.tipo,
        c.ativa
    FROM contratantes c
    INNER JOIN contratantes_funcionarios cf ON cf.contratante_id = c.id
    WHERE cf.funcionario_id = p_funcionario_id
      AND cf.vinculo_ativo = true
      AND c.ativa = true
    ORDER BY cf.criado_em DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.get_contratante_funcionario(p_funcionario_id integer) OWNER TO neondb_owner;

--
-- Name: get_resultados_por_empresa(integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer DEFAULT NULL::integer) RETURNS TABLE(empresa_id integer, empresa_nome character varying, grupo integer, dominio character varying, media_score numeric, categoria character varying, total_respostas bigint)
    LANGUAGE plpgsql
    AS $$

BEGIN

    RETURN QUERY

    SELECT 

        ec.id as empresa_id,

        ec.nome as empresa_nome,

        r.grupo,

        CASE r.grupo

            WHEN 1 THEN 'Demandas no Trabalho'

            WHEN 2 THEN 'Organização e Conteúdo'

            WHEN 3 THEN 'Relações Sociais'

            WHEN 4 THEN 'Liderança'

            WHEN 5 THEN 'Valores Organizacionais'

            WHEN 6 THEN 'Saúde e Bem-estar'

            WHEN 7 THEN 'Comportamentos Ofensivos'

            WHEN 8 THEN 'Jogos de Apostas'

            WHEN 9 THEN 'Endividamento'

            ELSE 'Outros'

        END as dominio,

        AVG(r.valor) as media_score,

        CASE 

            WHEN AVG(r.valor) >= 75 THEN 'alto'

            WHEN AVG(r.valor) >= 50 THEN 'medio'

            ELSE 'baixo'

        END as categoria,

        COUNT(r.valor) as total_respostas

    FROM respostas r

    JOIN avaliacoes a ON r.avaliacao_id = a.id

    JOIN funcionarios f ON a.funcionario_cpf = f.cpf

    JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND a.status = 'concluida'

    GROUP BY ec.id, ec.nome, r.grupo

    ORDER BY ec.nome, r.grupo;

END;

$$;


ALTER FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer) OWNER TO neondb_owner;

--
-- Name: is_admin_or_master(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.is_admin_or_master() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    -- Após migração, apenas 'admin' confere privilégio total. Esta função mantém compatibilidade histórica
    RETURN current_user_perfil() = 'admin';
END;
$$;


ALTER FUNCTION public.is_admin_or_master() OWNER TO neondb_owner;

--
-- Name: FUNCTION is_admin_or_master(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.is_admin_or_master() IS 'Verifica se o usuário atual tem perfil admin (compatibilidade histórica: perfil legado tratado separadamente)';


--
-- Name: is_valid_perfil(text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.is_valid_perfil(p_perfil text) OWNER TO neondb_owner;

--
-- Name: FUNCTION is_valid_perfil(p_perfil text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.is_valid_perfil(p_perfil text) IS 'Valida se um texto corresponde a um perfil válido do ENUM';


--
-- Name: limpar_notificacoes_resolvidas_antigas(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.limpar_notificacoes_resolvidas_antigas() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Arquivar notificações resolvidas há mais de 90 dias
  UPDATE notificacoes
  SET arquivada = TRUE
  WHERE resolvida = TRUE
    AND data_resolucao < NOW() - INTERVAL '90 days'
    AND arquivada = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.limpar_notificacoes_resolvidas_antigas() OWNER TO neondb_owner;

--
-- Name: FUNCTION limpar_notificacoes_resolvidas_antigas(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.limpar_notificacoes_resolvidas_antigas() IS 'Arquiva notificações resolvidas há mais de 90 dias';


--
-- Name: log_access_denied(text, text, text, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) OWNER TO neondb_owner;

--
-- Name: FUNCTION log_access_denied(p_user text, p_action text, p_resource text, p_reason text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) IS 'Registra tentativas de acesso negadas por políticas RLS';


--
-- Name: lote_pode_ser_processado(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.lote_pode_ser_processado(p_lote_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_status status_lote;
  v_tem_laudo BOOLEAN;
BEGIN
  -- Buscar status do lote
  SELECT status INTO v_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar se já tem laudo enviado
  SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = p_lote_id AND status = 'enviado')
  INTO v_tem_laudo;

  -- Pode processar se está concluído e não tem laudo
  RETURN v_status = 'concluido' AND NOT v_tem_laudo;
END;
$$;


ALTER FUNCTION public.lote_pode_ser_processado(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION lote_pode_ser_processado(p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.lote_pode_ser_processado(p_lote_id integer) IS 'Verifica se um lote está apto para emissão de laudo';


--
-- Name: marcar_notificacoes_lidas(integer[], integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET lida = TRUE,
      data_leitura = NOW()
  WHERE id = ANY(p_notificacao_ids)
    AND destinatario_id = p_usuario_id
    AND lida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_id integer) OWNER TO neondb_owner;

--
-- Name: marcar_notificacoes_lidas(integer[], text); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_cpf text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacoes
  SET lida = TRUE,
      data_leitura = NOW()
  WHERE id = ANY(p_notificacao_ids)
    AND destinatario_cpf = p_usuario_cpf
    AND lida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_cpf text) OWNER TO neondb_owner;

--
-- Name: notificar_pre_cadastro_criado(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notificar_pre_cadastro_criado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_contratante_nome TEXT;
BEGIN
  -- Buscar nome do contratante
  SELECT nome INTO v_contratante_nome
  FROM contratantes
  WHERE id = NEW.contratante_id;

  -- Inserir notificação para todos os admins
  INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_id,
    destinatario_tipo,
    titulo,
    mensagem,
    dados_contexto,
    link_acao,
    botao_texto,
    contratacao_personalizada_id
  )
  SELECT 
    'pre_cadastro_criado',
    'alta',
    u.id,
    'admin',
    'Novo Pré-Cadastro: ' || v_contratante_nome,
    'Um novo pré-cadastro de plano personalizado foi criado e aguarda definição de valor. Funcionários estimados: ' || COALESCE(NEW.numero_funcionarios_estimado::TEXT, 'Não informado') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'contratante_nome', v_contratante_nome,
      'numero_funcionarios', NEW.numero_funcionarios_estimado
    ),
    '/admin/contratacao/pendentes',
    'Definir Valor',
    NEW.id
  FROM usuarios u
  WHERE u.role = 'admin' AND u.ativo = TRUE;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notificar_pre_cadastro_criado() OWNER TO neondb_owner;

--
-- Name: FUNCTION notificar_pre_cadastro_criado(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notificar_pre_cadastro_criado() IS 'Notifica admins quando novo pré-cadastro personalizado é criado (colunas corrigidas)';


--
-- Name: notificar_sla_excedido(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notificar_sla_excedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_contratante_nome TEXT;
  v_horas_decorridas NUMERIC;
BEGIN
  -- Calcular horas desde criação
  v_horas_decorridas := EXTRACT(EPOCH FROM (NOW() - NEW.criado_em)) / 3600;

  IF v_horas_decorridas > 48 AND NEW.status = 'aguardando_valor_admin' THEN
    -- Buscar nome do contratante
    SELECT nome_fantasia INTO v_contratante_nome
    FROM clinicas
    WHERE id = NEW.contratante_id;

    -- Notificar admins sobre SLA excedido
    INSERT INTO notificacoes (
      tipo, prioridade, destinatario_id, destinatario_tipo,
      titulo, mensagem, dados_contexto, link_acao, botao_texto,
      contratacao_personalizada_id
    )
    SELECT 
      'sla_excedido',
      'critica',
      u.id,
      'admin',
      '🚨 SLA Excedido: ' || v_contratante_nome,
      'Pré-cadastro aguardando definição de valor há mais de 48 horas. Ação urgente necessária.',
      jsonb_build_object(
        'contratacao_id', NEW.id,
        'horas_decorridas', ROUND(v_horas_decorridas, 1),
        'contratante_nome', v_contratante_nome
      ),
      '/admin/contratacao/pendentes',
      'Definir Valor Agora',
      NEW.id
    FROM usuarios u
    WHERE u.role = 'admin' AND u.ativo = TRUE;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notificar_sla_excedido() OWNER TO neondb_owner;

--
-- Name: notificar_valor_definido(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.notificar_valor_definido() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_contratante_id INT;
  v_contratante_nome TEXT;
  v_gestor_cpf TEXT;
BEGIN
  -- Buscar ID, nome do contratante e CPF do gestor responsável
  SELECT c.id, c.nome, c.responsavel_cpf
  INTO v_contratante_id, v_contratante_nome, v_gestor_cpf
  FROM contratantes c
  WHERE c.id = NEW.contratante_id;

  -- Notificar gestor do contratante (preenchendo tanto id quanto CPF)
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_id, destinatario_cpf, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  )
  VALUES (
    'valor_definido',
    'media',
    v_contratante_id,
    v_gestor_cpf,
    'gestor_entidade',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionário: R$ ' || 
      TO_CHAR(NEW.valor_por_funcionario, 'FM999G999G990D00') || 
      '. Total estimado: R$ ' || TO_CHAR(NEW.valor_total_estimado, 'FM999G999G990D00') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'valor_por_funcionario', NEW.valor_por_funcionario,
      'valor_total_estimado', NEW.valor_total_estimado,
      'numero_funcionarios', NEW.numero_funcionarios_estimado
    ),
    '/entidade/contratacao/' || NEW.id,
    'Ver Contrato',
    NEW.id
  );

  RETURN NEW;
END;
$_$;


ALTER FUNCTION public.notificar_valor_definido() OWNER TO neondb_owner;

--
-- Name: FUNCTION notificar_valor_definido(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.notificar_valor_definido() IS 'Trigger para notificar gestor quando valor do plano personalizado é definido pelo admin. Atualizado em 2026-01-20 para remover campo observacoes_admin inexistente.';


--
-- Name: obter_config_clinica(integer, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.obter_config_clinica(p_clinica_id integer, p_chave text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_valor JSONB;
BEGIN
  SELECT campos_customizados->p_chave INTO v_valor
  FROM clinica_configuracoes
  WHERE clinica_id = p_clinica_id;
  
  RETURN COALESCE(v_valor, '{}'::JSONB);
END;
$$;


ALTER FUNCTION public.obter_config_clinica(p_clinica_id integer, p_chave text) OWNER TO neondb_owner;

--
-- Name: obter_proximo_numero_ordem(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_proximo INTEGER;
BEGIN
    -- Buscar o maior número de ordem para a empresa e incrementar
    SELECT COALESCE(MAX(numero_ordem), 0) + 1
    INTO v_proximo
    FROM lotes_avaliacao
    WHERE empresa_id = p_empresa_id;
    
    RETURN v_proximo;
END;
$$;


ALTER FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION obter_proximo_numero_ordem(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o próximo número de ordem sequencial para um novo lote da empresa';


--
-- Name: obter_traducao(text, public.idioma_suportado); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.obter_traducao(p_chave text, p_idioma public.idioma_suportado) OWNER TO neondb_owner;

--
-- Name: prevent_contratante_for_emissor(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_contratante_for_emissor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF EXISTS(SELECT 1 FROM funcionarios f WHERE f.cpf = NEW.cpf AND f.perfil = 'emissor') THEN
      RAISE EXCEPTION 'CPF pertence a emissor; não pode ser gestor de entidade';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_contratante_for_emissor() OWNER TO neondb_owner;

--
-- Name: prevent_gestor_being_emissor(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_gestor_being_emissor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se estamos inserindo/atualizando para perfil 'emissor', garantir que o CPF NÃO pertença a um gestor
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.perfil = 'emissor') THEN
      -- Se CPF existe em contratantes_senhas ligado a uma contratante do tipo 'entidade', bloquear
      IF EXISTS(
        SELECT 1 FROM contratantes_senhas cs
        JOIN contratantes c ON c.id = cs.contratante_id
        WHERE cs.cpf = NEW.cpf AND c.tipo = 'entidade' AND c.ativa = true
      ) THEN
        RAISE EXCEPTION 'CPF pertence a gestor de entidade; não pode ser emissor';
      END IF;

      -- Se CPF já estiver associado a um gestor RH (perfil='rh') em funcionarios, bloquear
      IF EXISTS(
        SELECT 1 FROM funcionarios f
        WHERE f.cpf = NEW.cpf AND f.perfil = 'rh' AND (TG_OP = 'INSERT' OR f.id <> NEW.id)
      ) THEN
        RAISE EXCEPTION 'CPF pertence a gestor RH; não pode ser emissor';
      END IF;
    END IF;

    -- Se estamos tornando alguém em gestor (rh/gestor_entidade), garantir que CPF não seja emissor
    IF (NEW.perfil IN ('rh','gestor_entidade')) THEN
      IF EXISTS(
        SELECT 1 FROM funcionarios f
        WHERE f.cpf = NEW.cpf AND f.perfil = 'emissor' AND (TG_OP = 'INSERT' OR f.id <> NEW.id)
      ) THEN
        RAISE EXCEPTION 'CPF pertence a emissor; não pode tornar-se gestor';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_gestor_being_emissor() OWNER TO neondb_owner;

--
-- Name: prevent_laudo_lote_id_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_laudo_lote_id_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.lote_id != NEW.lote_id THEN
        RAISE EXCEPTION 'NÃ£o Ã© permitido alterar lote_id de um laudo jÃ¡ criado';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_laudo_lote_id_change() OWNER TO neondb_owner;

--
-- Name: prevent_lote_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_lote_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Block mutations if lote is 'concluido' but not yet emitted
  IF OLD.status = 'concluido' AND OLD.emitido_em IS NULL THEN
    -- Allow setting emitido_em (emission process completion)
    IF NEW.emitido_em IS NOT NULL AND OLD.emitido_em IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Allow setting processamento_em (start of processing)
    IF NEW.processamento_em IS NOT NULL AND OLD.processamento_em IS NULL THEN
      RETURN NEW;
    END IF;

    -- Allow clearing processamento_em (end of processing)
    IF NEW.processamento_em IS NULL AND OLD.processamento_em IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Block any other modifications
    RAISE EXCEPTION 'Não é permitido modificar o lote enquanto está em processo de emissão. Status: concluido, emitido_em: NULL'
    USING ERRCODE = '23503',
          HINT = 'Aguarde a conclusão da emissão do laudo antes de fazer alterações.';
  END IF;

  -- Block if processamento_em is set (except for clearing it or setting emitido_em)
  IF OLD.processamento_em IS NOT NULL THEN
    -- Allow completing emission (setting emitido_em)
    IF NEW.emitido_em IS NOT NULL AND OLD.emitido_em IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Allow clearing processamento_em
    IF NEW.processamento_em IS NULL AND OLD.processamento_em IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Block any other modifications
    RAISE EXCEPTION 'Não é permitido modificar o lote enquanto está sendo processado.'
    USING ERRCODE = '23503',
          HINT = 'O lote está sendo processado neste momento. Aguarde alguns instantes.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_lote_mutation_during_emission() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_lote_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_lote_mutation_during_emission() IS 'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. Atualizada em migration 098 para remover referência ao campo processamento_em removido.';


--
-- Name: prevent_modification_avaliacao_when_lote_emitted(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
  v_lote INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
    SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_modification_avaliacao_when_lote_emitted(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() IS 'Impede UPDATE/DELETE em avaliações quando o lote já possui laudo emitido';


--
-- Name: prevent_modification_lote_when_laudo_emitted(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_modification_lote_when_laudo_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  has_laudo_emitted BOOLEAN := FALSE;
  only_date_fields_changed BOOLEAN := TRUE;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- Check if there's an emitted laudo for this lote
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO has_laudo_emitted;

    IF has_laudo_emitted THEN
      -- If laudo is emitted, check what fields are being changed
      IF TG_OP = 'UPDATE' THEN
        -- Check if only date/timestamp fields are being updated from NULL to a value
        IF (OLD.emitido_em IS NULL AND NEW.emitido_em IS NOT NULL) OR
           (OLD.enviado_em IS NULL AND NEW.enviado_em IS NOT NULL) OR
           (OLD.processamento_em IS NOT NULL AND NEW.processamento_em IS NULL) OR
           (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finalizado') THEN
          -- Allow updates to date fields or status to 'finalizado'
          RETURN NEW;
        END IF;

        -- Check if any other fields are being changed
        IF OLD.titulo IS DISTINCT FROM NEW.titulo OR
           OLD.descricao IS DISTINCT FROM NEW.descricao OR
           OLD.tipo IS DISTINCT FROM NEW.tipo OR
           OLD.liberado_por IS DISTINCT FROM NEW.liberado_por OR
           OLD.liberado_em IS DISTINCT FROM NEW.liberado_em OR
           OLD.criado_em IS DISTINCT FROM NEW.criado_em OR
           OLD.contratante_id IS DISTINCT FROM NEW.contratante_id OR
           OLD.auto_emitir_em IS DISTINCT FROM NEW.auto_emitir_em OR
           OLD.auto_emitir_agendado IS DISTINCT FROM NEW.auto_emitir_agendado OR
           OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf OR
           OLD.numero_ordem IS DISTINCT FROM NEW.numero_ordem OR
           OLD.cancelado_automaticamente IS DISTINCT FROM NEW.cancelado_automaticamente OR
           OLD.motivo_cancelamento IS DISTINCT FROM NEW.motivo_cancelamento OR
           OLD.modo_emergencia IS DISTINCT FROM NEW.modo_emergencia OR
           OLD.motivo_emergencia IS DISTINCT FROM NEW.motivo_emergencia THEN
          RAISE EXCEPTION 'Não é permitido alterar lote %: laudo já emitido. Apenas campos de data podem ser atualizados.', OLD.id;
        END IF;

        -- Allow the update if only allowed fields changed
        RETURN NEW;
      END IF;

      -- For DELETE operations, always prevent
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Não é permitido deletar lote %: laudo já emitido.', OLD.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_modification_lote_when_laudo_emitted() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_modification_lote_when_laudo_emitted(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido, mas permite atualizações de campos de data';


--
-- Name: prevent_update_finalized_lote(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_update_finalized_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Impedir modificação de lotes em estados terminais
  IF OLD.status IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Lote com status "%" não pode ser modificado', OLD.status;
  END IF;

  -- Se já existe um laudo com status 'enviado', bloquear alterações EXCETO quando
  -- a atualização tiver como objetivo registrar o envio (laudo_enviado_em) pela
  -- primeira vez. Isto permite que o processo de envio atualize o lote com
  -- timestamps de envio/finalização sem ser impedido pelo trigger.
  IF EXISTS (
    SELECT 1 FROM laudos WHERE lote_id = OLD.id AND status = 'enviado'
  ) THEN
    -- Permitir apenas a atualização que define pela PRIMEIRA vez laudo_enviado_em
    IF NOT (NEW.laudo_enviado_em IS NOT NULL AND OLD.laudo_enviado_em IS NULL) THEN
      RAISE EXCEPTION 'Lote possui laudo enviado. Modificações bloqueadas.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_update_finalized_lote() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_update_finalized_lote(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_update_finalized_lote() IS 'Trigger atualizada para permitir registro de laudo_enviado_em mesmo quando já existe laudo com status=''enviado''';


--
-- Name: prevent_update_laudo_enviado(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_update_laudo_enviado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status = 'enviado' THEN
    RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_update_laudo_enviado() OWNER TO neondb_owner;

--
-- Name: refresh_vw_recibos_completos_mat(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.refresh_vw_recibos_completos_mat() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE NOTICE 'Refreshing materialized view vw_recibos_completos_mat';
  PERFORM 1; -- placeholder
  EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY vw_recibos_completos_mat';
EXCEPTION WHEN undefined_function THEN
  -- Some PostgreSQL versions / configs might not support CONCURRENTLY in certain contexts; fallback
  REFRESH MATERIALIZED VIEW vw_recibos_completos_mat;
END;
$$;


ALTER FUNCTION public.refresh_vw_recibos_completos_mat() OWNER TO neondb_owner;

--
-- Name: FUNCTION refresh_vw_recibos_completos_mat(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.refresh_vw_recibos_completos_mat() IS 'Função helper para atualizar materialized view vw_recibos_completos_mat';


--
-- Name: registrar_inativacao_funcionario(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.registrar_inativacao_funcionario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_user_cpf_val TEXT;
BEGIN
    -- Se mudou de ativo para inativo
    IF OLD.ativo = true AND NEW.ativo = false THEN
        -- Obter CPF do usuário atual da sessão
        current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
        
        NEW.inativado_em := CURRENT_TIMESTAMP;
        NEW.inativado_por := current_user_cpf_val;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.registrar_inativacao_funcionario() OWNER TO neondb_owner;

--
-- Name: FUNCTION registrar_inativacao_funcionario(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.registrar_inativacao_funcionario() IS 'Registra automaticamente data e responsável pela inativação de funcionários';


--
-- Name: resolver_notificacao(integer, character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_row_count INTEGER;
  v_updated BOOLEAN;
BEGIN
  UPDATE notificacoes
  SET resolvida = TRUE,
      data_resolucao = NOW(),
      resolvido_por_cpf = p_cpf_resolvedor
  WHERE id = p_notificacao_id
    AND resolvida = FALSE;
  
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_updated := (v_row_count > 0);
  
  -- Registrar auditoria
  IF v_updated THEN
    INSERT INTO auditoria_geral (
      tabela_afetada, acao, cpf_responsavel, 
      dados_anteriores, dados_novos, criado_em
    ) VALUES (
      'notificacoes', 
      'RESOLVE', 
      p_cpf_resolvedor,
      jsonb_build_object('notificacao_id', p_notificacao_id, 'resolvida', false),
      jsonb_build_object('notificacao_id', p_notificacao_id, 'resolvida', true),
      NOW()
    );
  END IF;
  
  RETURN v_updated;
END;
$$;


ALTER FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) IS 'Marca uma notificação como resolvida e registra auditoria';


--
-- Name: resolver_notificacoes_por_contexto(text, text, character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Resolver todas as notificações com chave/valor específico no contexto
  UPDATE notificacoes
  SET resolvida = TRUE,
      data_resolucao = NOW(),
      resolvido_por_cpf = p_cpf_resolvedor
  WHERE dados_contexto->>p_chave_contexto = p_valor_contexto
    AND resolvida = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Registrar auditoria
  IF v_count > 0 THEN
    INSERT INTO auditoria_geral (
      tabela_afetada, acao, cpf_responsavel, 
      dados_anteriores, dados_novos, criado_em
    ) VALUES (
      'notificacoes', 
      'RESOLVE_BULK', 
      p_cpf_resolvedor,
      jsonb_build_object('criterio', p_chave_contexto, 'valor', p_valor_contexto),
      jsonb_build_object('notificacoes_resolvidas', v_count),
      NOW()
    );
  END IF;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) IS 'Resolve múltiplas notificações com base em critério de contexto (ex: lote_id)';


--
-- Name: safe_drop_policy(text, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) OWNER TO neondb_owner;

--
-- Name: FUNCTION safe_drop_policy(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) IS 'Safely drops a policy after validating name matches table.
   Use this in migrations instead of DROP POLICY directly.
   Example: SELECT safe_drop_policy(''avaliacoes_own_select'', ''avaliacoes'')';


--
-- Name: set_questao_from_item(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.set_questao_from_item() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (NEW.questao IS NULL OR NEW.questao = 0) AND NEW.item IS NOT NULL THEN
    -- Extrair dígitos de 'item' e converter para inteiro (ex.: 'q1' -> 1, '1' -> 1)
    IF NEW.item ~ '\d' THEN
      NEW.questao := (regexp_replace(NEW.item, '\D', '', 'g'))::integer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_questao_from_item() OWNER TO neondb_owner;

--
-- Name: set_updated_at_column(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.set_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at_column() OWNER TO neondb_owner;

--
-- Name: sync_contratacao_status_to_contratante(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.sync_contratacao_status_to_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- TODO: Implementar sync correto quando necessário
  -- Por ora, desabilitado para evitar erros de enum
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_contratacao_status_to_contratante() OWNER TO neondb_owner;

--
-- Name: FUNCTION sync_contratacao_status_to_contratante(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.sync_contratacao_status_to_contratante() IS 'Desabilitado temporariamente - valor_definido não está no enum status_aprovacao_enum';


--
-- Name: sync_personalizado_status(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.sync_personalizado_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando contratacao_personalizada muda para valor_definido, atualizar contratante
    IF NEW.status::text = 'valor_definido' AND (OLD.status IS NULL OR OLD.status::text = 'aguardando_valor_admin') THEN
        UPDATE contratantes 
        SET status = 'aguardando_pagamento', atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        RAISE NOTICE 'Contratante % atualizado para aguardando_pagamento', NEW.contratante_id;
    END IF;
    
    -- Quando pago, ativar contratante e disparar criação de conta
    IF NEW.status::text = 'pago' AND OLD.status::text = 'aguardando_pagamento' THEN
        UPDATE contratantes 
        SET status = 'aprovado', -- Usar 'aprovado' em vez de 'ativo' (não existe no enum)
            data_liberacao_login = CURRENT_TIMESTAMP, 
            ativa = true,
            atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        -- Chamar função para criar conta responsável
        PERFORM criar_conta_responsavel_personalizado(NEW.contratante_id);
        
        RAISE NOTICE 'Contratante % ativado e conta criada', NEW.contratante_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_personalizado_status() OWNER TO neondb_owner;

--
-- Name: FUNCTION sync_personalizado_status(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.sync_personalizado_status() IS 'Sincroniza status de contratacao_personalizada para contratantes. Cast ::text para evitar erros de comparação de enum.';


--
-- Name: trg_enforce_laudo_id_equals_lote(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trg_enforce_laudo_id_equals_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If insert doesn't specify id or id differs, set id to lote_id
  IF NEW.id IS NULL OR NEW.id IS DISTINCT FROM NEW.lote_id THEN
    NEW.id := NEW.lote_id;
  END IF;

  -- Prevent creating a laudo when another laudo with same id exists (should be same as lote)
  IF EXISTS (SELECT 1 FROM laudos WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Laudo with id % already exists', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_enforce_laudo_id_equals_lote() OWNER TO neondb_owner;

--
-- Name: trigger_criar_pdf_job(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trigger_criar_pdf_job() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se recibo foi criado/atualizado e não tem PDF, enfileirar job
  IF NEW.pdf IS NULL AND NEW.ativo = true THEN
    INSERT INTO pdf_jobs (recibo_id, status, attempts)
    VALUES (NEW.id, 'pending', 0)
    ON CONFLICT (recibo_id) DO NOTHING; -- Evitar duplicatas
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_criar_pdf_job() OWNER TO neondb_owner;

--
-- Name: trigger_gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trigger_gerar_numero_recibo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.numero_recibo IS NULL OR NEW.numero_recibo = '' THEN
        NEW.numero_recibo := gerar_numero_recibo();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_gerar_numero_recibo() OWNER TO neondb_owner;

--
-- Name: update_contratantes_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_contratantes_senhas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contratantes_senhas_updated_at() OWNER TO neondb_owner;

--
-- Name: update_contratantes_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_contratantes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contratantes_updated_at() OWNER TO neondb_owner;

--
-- Name: update_pdf_jobs_timestamp(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_pdf_jobs_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pdf_jobs_timestamp() OWNER TO neondb_owner;

--
-- Name: upsert_laudo(integer, character, text, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text DEFAULT 'enviado'::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_laudo_id INTEGER;
BEGIN
    -- Como o laudo já foi criado em rascunho ao criar o lote, apenas atualizamos
    UPDATE laudos
    SET 
        emissor_cpf = p_emissor_cpf,
        observacoes = p_observacoes,
        status = p_status,
        emitido_em = NOW(),
        atualizado_em = NOW()
    WHERE id = p_lote_id
    RETURNING id INTO v_laudo_id;

    -- Se não existir (caso de lotes antigos), inserir
    IF v_laudo_id IS NULL THEN
        INSERT INTO laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, atualizado_em)
        VALUES (p_lote_id, p_lote_id, p_emissor_cpf, p_observacoes, p_status, NOW(), NOW(), NOW())
        RETURNING id INTO v_laudo_id;
    END IF;

    RETURN v_laudo_id;
END;
$$;


ALTER FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) OWNER TO neondb_owner;

--
-- Name: FUNCTION upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) IS 'Atualiza laudo rascunho existente (id já reservado) ou insere se não existir';


--
-- Name: user_has_permission(text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.user_has_permission(permission_name text) OWNER TO neondb_owner;

--
-- Name: FUNCTION user_has_permission(permission_name text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.user_has_permission(permission_name text) IS 'Verifica se o usuário atual tem uma permissão específica via RBAC';


--
-- Name: validar_lote_para_laudo(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_lote_para_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM validar_lote_pre_laudo(p_lote_id);
END;
$$;


ALTER FUNCTION public.validar_lote_para_laudo(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION validar_lote_para_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validar_lote_para_laudo(p_lote_id integer) IS 'Wrapper for validar_lote_pre_laudo for compatibility';


--
-- Name: validar_lote_pre_laudo(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb, bloqueante boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_empresa_id INTEGER;
  v_numero_lote INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_funcionarios_pendentes INTEGER;
  v_alertas TEXT[] := '{}';
  v_detalhes JSONB;
  v_bloqueante BOOLEAN := FALSE;
BEGIN
  -- Buscar dados do lote
  SELECT empresa_id, numero_ordem INTO v_empresa_id, v_numero_lote
  FROM lotes_avaliacao
  WHERE id = p_lote_id;
  
  -- Contar avaliaÃ§Ãµes do lote
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas
  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;
  
  -- Verificar funcionÃ¡rios que deveriam estar no lote mas nÃ£o estÃ£o
  SELECT COUNT(*) INTO v_funcionarios_pendentes
  FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
  WHERE NOT EXISTS (
    SELECT 1 FROM avaliacoes a 
    WHERE a.funcionario_cpf = el.funcionario_cpf 
    AND a.lote_id = p_lote_id
  );
  
  -- Gerar alertas
  IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
    v_alertas := array_append(v_alertas, 'ATENÃ‡ÃƒO: Mais de 30% das avaliaÃ§Ãµes foram inativadas (' || v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || '). Verifique se hÃ¡ problemas sistÃªmicos.');
  END IF;
  
  IF v_funcionarios_pendentes > 0 THEN
    v_alertas := array_append(v_alertas, 'PENDÃŠNCIA: ' || v_funcionarios_pendentes || ' funcionÃ¡rio(s) deveriam estar neste lote mas nÃ£o foram incluÃ­dos. Revise a elegibilidade.');
  END IF;
  
  IF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliaÃ§Ã£o concluÃ­da neste lote. NÃ£o Ã© possÃ­vel gerar laudo.');
  END IF;
  
  -- Montar detalhes JSON
  v_detalhes := jsonb_build_object(
    'lote_id', p_lote_id,
    'numero_lote', v_numero_lote,
    'total_avaliacoes', v_total_avaliacoes,
    'avaliacoes_concluidas', v_avaliacoes_concluidas,
    'avaliacoes_inativadas', v_avaliacoes_inativadas,
    'funcionarios_pendentes', v_funcionarios_pendentes,
    'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_total_avaliacoes, 0)) * 100, 2)
  );
  
  -- Determinar se hÃ¡ bloqueios severos (erro definitivo)
  IF v_avaliacoes_concluidas = 0 OR v_funcionarios_pendentes > 0 THEN
    v_bloqueante := TRUE;
  END IF;

  -- Retornar resultado (bloqueante = errors que impedem emissÃ£o)
  RETURN QUERY SELECT 
    NOT v_bloqueante AS valido,
    v_alertas AS alertas,
    v_funcionarios_pendentes,
    v_detalhes AS detalhes,
    v_bloqueante AS bloqueante;
END;
$$;


ALTER FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote estÃ¡ pronto para laudo (Ã­ndice completo); retorna alertas e mÃ©tricas (anomalias reportadas como alertas, NÃƒO bloqueantes)';


--
-- Name: validar_parcelas_json(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_parcelas_json() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se há parcelas_json, validar estrutura
    IF NEW.parcelas_json IS NOT NULL THEN
        -- Verificar se é um array
        IF jsonb_typeof(NEW.parcelas_json) != 'array' THEN
            RAISE EXCEPTION 'parcelas_json deve ser um array';
        END IF;
        
        -- Se parcelado, deve ter parcelas
        IF NEW.modalidade_pagamento = 'parcelado' AND jsonb_array_length(NEW.parcelas_json) < 2 THEN
            RAISE EXCEPTION 'Pagamento parcelado deve ter pelo menos 2 parcelas';
        END IF;
        
        -- Validar que numero_parcelas coincide com tamanho do array
        IF NEW.numero_parcelas IS NOT NULL AND NEW.numero_parcelas != jsonb_array_length(NEW.parcelas_json) THEN
            RAISE EXCEPTION 'numero_parcelas deve coincidir com quantidade de parcelas em parcelas_json';
        END IF;
    END IF;
    
    -- Se modalidade é parcelado, deve ter parcelas_json
    IF NEW.modalidade_pagamento = 'parcelado' AND NEW.parcelas_json IS NULL THEN
        RAISE EXCEPTION 'Pagamento parcelado deve conter detalhes das parcelas em parcelas_json';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_parcelas_json() OWNER TO neondb_owner;

--
-- Name: validar_sessao_rls(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_sessao_rls() RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_perfil TEXT;
    v_cpf TEXT;
    v_contratante_id TEXT;
    v_clinica_id TEXT;
BEGIN
    -- Obter variáveis de contexto
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


ALTER FUNCTION public.validar_sessao_rls() OWNER TO neondb_owner;

--
-- Name: FUNCTION validar_sessao_rls(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida que todas as variáveis de contexto RLS necessárias estão configuradas antes de executar queries sensíveis';


--
-- Name: validar_status_avaliacao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_status_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se o status esta sendo alterado para 'inativada', aceitar
  IF NEW.status = 'inativada' THEN
    RETURN NEW;
  END IF;
  
  -- Se a avaliacao JA estava inativada, nao permitir mudar para iniciada/em_andamento
  IF OLD.status = 'inativada' AND NEW.status IN ('iniciada', 'em_andamento') THEN
    RAISE EXCEPTION 'Nao e possivel reativar uma avaliacao inativada. Status atual: %, Status tentado: %', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_status_avaliacao() OWNER TO neondb_owner;

--
-- Name: FUNCTION validar_status_avaliacao(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validar_status_avaliacao() IS 'Valida que avaliacoes inativadas nao podem voltar a status iniciada ou em_andamento';


--
-- Name: validar_transicao_status_contratante(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_transicao_status_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.status::text = 'rejeitado' AND NEW.status::text != 'rejeitado' THEN
          RAISE EXCEPTION 'Contratante rejeitado não pode ter status alterado';
        END IF;

        IF OLD.status::text = 'aprovado' AND NEW.status::text NOT IN ('aprovado', 'cancelado') THEN
          RAISE EXCEPTION 'Contratante aprovado só pode ser cancelado';
        END IF;

        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.validar_transicao_status_contratante() OWNER TO neondb_owner;

--
-- Name: FUNCTION validar_transicao_status_contratante(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validar_transicao_status_contratante() IS 'Valida transições de status. Cast ::text para comparar enums corretamente.';


--
-- Name: validate_policy_table_match(text, text); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) OWNER TO neondb_owner;

--
-- Name: FUNCTION validate_policy_table_match(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) IS 'Validates that policy name matches target table name.
   Use in migrations before DROP/CREATE POLICY.
   Example: validate_policy_table_match(''avaliacoes_own_select'', ''avaliacoes'')';


--
-- Name: validate_rh_clinica(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.validate_rh_clinica() OWNER TO neondb_owner;

--
-- Name: FUNCTION validate_rh_clinica(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.validate_rh_clinica() IS 'Valida se o RH atual realmente pertence à clínica configurada na sessão';


--
-- Name: verificar_inativacao_consecutiva(character, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) RETURNS TABLE(permitido boolean, motivo text, total_inativacoes_consecutivas integer, ultima_inativacao_lote character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote_atual_ordem INTEGER;
  v_lote_anterior_ordem INTEGER;
  v_avaliacao_anterior_status VARCHAR(20);
  v_ultima_inativacao_codigo VARCHAR(20);
  v_total_consecutivas INTEGER := 0;
  v_tem_anomalia_critica BOOLEAN := false;
  v_empresa_id INTEGER;
BEGIN
  -- Buscar empresa_id do lote
  SELECT empresa_id INTO v_empresa_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas
  SELECT EXISTS(
    SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
    WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRÍTICA'
  ) INTO v_tem_anomalia_critica;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e contar avaliações anteriores
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativações anteriores (qualquer lote anterior)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.empresa_id = v_empresa_id
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada';

  -- Contar número de avaliações anteriores (independente de status)
  DECLARE v_total_avaliacoes_anteriores INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON a.lote_id = la.id
    WHERE a.funcionario_cpf = p_funcionario_cpf
      AND la.empresa_id = v_empresa_id
      AND la.numero_ordem < v_lote_atual_ordem;
  EXCEPTION WHEN OTHERS THEN
    v_total_avaliacoes_anteriores := 0;
  END;

  -- Se tem anomalia critica, permitir inativacao consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. ' ||
      'Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nao ha avaliacoes anteriores (funcionario recem-importado/inscrito), permitir sem sinalizar como forcada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores (possivel recem-importado/inscrito). Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2a inativacao (ou seja, ja existe pelo menos 1 inativacao anterior), sinalizar como restricao (pode ser forcada)
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. ' ||
      'A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT
      true AS permitido,
      'Inativação permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$;


ALTER FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Atualização: primeira avaliação pós importação permitida; sinalização a partir da 2ª inativação';


--
-- Name: verificar_integridade_recibo(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.verificar_integridade_recibo(recibo_id integer) RETURNS TABLE(id integer, hash_armazenado character, hash_calculado character, integro boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_pdf BYTEA;
  v_hash_armazenado CHAR(64);
  v_hash_calculado CHAR(64);
BEGIN
  -- Buscar PDF e hash armazenado
  SELECT r.pdf, r.hash_pdf
  INTO v_pdf, v_hash_armazenado
  FROM recibos r
  WHERE r.id = recibo_id;

  -- Se não encontrar, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calcular hash do PDF atual
  v_hash_calculado := calcular_hash_pdf(v_pdf);

  -- Retornar resultado da verificação
  RETURN QUERY SELECT
    recibo_id,
    v_hash_armazenado,
    v_hash_calculado,
    (v_hash_armazenado = v_hash_calculado) AS integro;
END;
$$;


ALTER FUNCTION public.verificar_integridade_recibo(recibo_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION verificar_integridade_recibo(recibo_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.verificar_integridade_recibo(recibo_id integer) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backup_laudos_contratante_1; Type: TABLE; Schema: backups; Owner: neondb_owner
--

CREATE TABLE backups.backup_laudos_contratante_1 (
    id integer,
    lote_id integer,
    emissor_cpf character(11),
    observacoes text,
    status character varying(20),
    criado_em timestamp without time zone,
    emitido_em timestamp without time zone,
    enviado_em timestamp without time zone,
    atualizado_em timestamp without time zone,
    hash_pdf character varying(64),
    job_id bigint,
    arquivo_remoto_provider character varying(32),
    arquivo_remoto_bucket character varying(255),
    arquivo_remoto_key character varying(1024),
    arquivo_remoto_url text
);


ALTER TABLE backups.backup_laudos_contratante_1 OWNER TO neondb_owner;

--
-- Name: backup_resultados_contratante_1; Type: TABLE; Schema: backups; Owner: neondb_owner
--

CREATE TABLE backups.backup_resultados_contratante_1 (
    id integer,
    avaliacao_id integer,
    grupo integer,
    dominio character varying(100),
    score numeric(5,2),
    categoria character varying(20),
    criado_em timestamp without time zone
);


ALTER TABLE backups.backup_resultados_contratante_1 OWNER TO neondb_owner;

--
-- Name: analise_estatistica; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analise_estatistica (
    id integer NOT NULL,
    avaliacao_id integer,
    grupo integer,
    score_original numeric(5,2),
    score_ajustado numeric(5,2),
    anomalia_detectada boolean DEFAULT false,
    tipo_anomalia character varying(100),
    recomendacao text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.analise_estatistica OWNER TO neondb_owner;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analise_estatistica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analise_estatistica_id_seq OWNER TO neondb_owner;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analise_estatistica_id_seq OWNED BY public.analise_estatistica.id;


--
-- Name: audit_access_denied; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.audit_access_denied OWNER TO neondb_owner;

--
-- Name: TABLE audit_access_denied; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.audit_access_denied IS 'Logs de tentativas de acesso bloqueadas por RLS';


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_access_denied_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_access_denied_id_seq OWNER TO neondb_owner;

--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_access_denied_id_seq OWNED BY public.audit_access_denied.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
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
    contratante_id integer,
    clinica_id integer,
    CONSTRAINT chk_audit_logs_user_cpf_format CHECK (((user_cpf IS NULL) OR (length(user_cpf) = 11)))
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as ações críticas no sistema';


--
-- Name: COLUMN audit_logs.user_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.audit_logs.user_cpf IS 'CPF do usuário que executou a ação. NULL indica ação automática do sistema.';


--
-- Name: COLUMN audit_logs.user_perfil; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.audit_logs.user_perfil IS 'Perfil do usuário que executou a ação (pode ser NULL para operações sem contexto de sessão)';


--
-- Name: COLUMN audit_logs.contratante_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.audit_logs.contratante_id IS 'ID do contratante (entidade) responsável pela ação. NULL para clínicas ou ações administrativas.';


--
-- Name: COLUMN audit_logs.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.audit_logs.clinica_id IS 'ID da clínica relacionada à ação (quando aplicável).';


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: audit_stats_by_user; Type: VIEW; Schema: public; Owner: neondb_owner
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


ALTER VIEW public.audit_stats_by_user OWNER TO neondb_owner;

--
-- Name: VIEW audit_stats_by_user; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.audit_stats_by_user IS 'EstatÃƒÂ­sticas de aÃƒÂ§ÃƒÂµes por usuÃƒÂ¡rio para anÃƒÂ¡lise de comportamento';


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.auditoria OWNER TO neondb_owner;

--
-- Name: TABLE auditoria; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.auditoria IS 'Tabela de auditoria para registrar todas as aÃ§Ãµes do sistema';


--
-- Name: COLUMN auditoria.hash_operacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria.hash_operacao IS 'Hash SHA-256 para verificaÃ§Ã£o de integridade da operaÃ§Ã£o';


--
-- Name: auditoria_geral; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.auditoria_geral OWNER TO neondb_owner;

--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.auditoria_geral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_geral_id_seq OWNER TO neondb_owner;

--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.auditoria_geral_id_seq OWNED BY public.auditoria_geral.id;


--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_id_seq OWNER TO neondb_owner;

--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: auditoria_laudos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.auditoria_laudos (
    id bigint NOT NULL,
    lote_id integer NOT NULL,
    laudo_id integer,
    emissor_cpf character varying(11),
    emissor_nome character varying(200),
    acao character varying(64) NOT NULL,
    status character varying(32) NOT NULL,
    ip_address inet,
    observacoes text,
    criado_em timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auditoria_laudos OWNER TO neondb_owner;

--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.auditoria_laudos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_laudos_id_seq OWNER TO neondb_owner;

--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.auditoria_laudos_id_seq OWNED BY public.auditoria_laudos.id;


--
-- Name: auditoria_recibos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.auditoria_recibos (
    id integer NOT NULL,
    recibo_id integer NOT NULL,
    acao character varying(80) NOT NULL,
    status character varying(40) NOT NULL,
    ip_address character varying(50),
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auditoria_recibos OWNER TO neondb_owner;

--
-- Name: TABLE auditoria_recibos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.auditoria_recibos IS 'Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocessamento, erro)';


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.auditoria_recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_recibos_id_seq OWNER TO neondb_owner;

--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.auditoria_recibos_id_seq OWNED BY public.auditoria_recibos.id;


--
-- Name: avaliacao_resets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.avaliacao_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    avaliacao_id integer NOT NULL,
    lote_id integer NOT NULL,
    requested_by_user_id integer NOT NULL,
    requested_by_role character varying(50) NOT NULL,
    reason text NOT NULL,
    respostas_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.avaliacao_resets OWNER TO neondb_owner;

--
-- Name: TABLE avaliacao_resets; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.avaliacao_resets IS 'Immutable audit log of evaluation reset operations';


--
-- Name: COLUMN avaliacao_resets.id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.id IS 'Unique identifier for the reset operation';


--
-- Name: COLUMN avaliacao_resets.avaliacao_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.avaliacao_id IS 'ID of the evaluation that was reset';


--
-- Name: COLUMN avaliacao_resets.lote_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.lote_id IS 'ID of the batch/cycle containing the evaluation';


--
-- Name: COLUMN avaliacao_resets.requested_by_user_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_user_id IS 'User ID who requested the reset';


--
-- Name: COLUMN avaliacao_resets.requested_by_role; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor_entidade)';


--
-- Name: COLUMN avaliacao_resets.reason; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.reason IS 'Mandatory justification for the reset operation';


--
-- Name: COLUMN avaliacao_resets.respostas_count; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.respostas_count IS 'Number of responses deleted during reset';


--
-- Name: COLUMN avaliacao_resets.created_at; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacao_resets.created_at IS 'Timestamp when the reset was performed';


--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.avaliacoes (
    id integer NOT NULL,
    funcionario_cpf character(11) NOT NULL,
    inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    envio timestamp without time zone,
    status character varying(20) DEFAULT 'iniciada'::character varying,
    grupo_atual integer DEFAULT 1,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lote_id integer,
    inativada_em timestamp with time zone,
    motivo_inativacao text,
    concluida_em timestamp without time zone,
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY (ARRAY[('iniciada'::character varying)::text, ('em_andamento'::character varying)::text, ('concluida'::character varying)::text, ('inativada'::character varying)::text])))
);


ALTER TABLE public.avaliacoes OWNER TO neondb_owner;

--
-- Name: COLUMN avaliacoes.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacoes.status IS 'Status da avaliaÃ§Ã£o: iniciada, em_andamento, concluida, inativada (nÃ£o incrementa Ã­ndice)';


--
-- Name: COLUMN avaliacoes.inativada_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacoes.inativada_em IS 'Timestamp quando a avaliacao foi inativada pelo RH';


--
-- Name: COLUMN avaliacoes.motivo_inativacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.avaliacoes.motivo_inativacao IS 'Motivo informado pelo RH para inativacao da avaliacao';


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.avaliacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_id_seq OWNER TO neondb_owner;

--
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;


--
-- Name: backup_lotes_migracao_20260130; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.backup_lotes_migracao_20260130 (
    id integer,
    codigo character varying(20),
    clinica_id integer,
    empresa_id integer,
    titulo character varying(100),
    descricao text,
    tipo character varying(20),
    status character varying(20),
    liberado_por character(11),
    liberado_em timestamp without time zone,
    criado_em timestamp without time zone,
    atualizado_em timestamp without time zone,
    contratante_id integer,
    auto_emitir_em timestamp with time zone,
    auto_emitir_agendado boolean,
    hash_pdf character varying(64),
    numero_ordem integer,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    cancelado_automaticamente boolean,
    motivo_cancelamento text,
    modo_emergencia boolean,
    motivo_emergencia text,
    processamento_em timestamp without time zone
);


ALTER TABLE public.backup_lotes_migracao_20260130 OWNER TO neondb_owner;

--
-- Name: clinica_configuracoes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinica_configuracoes (
    id integer NOT NULL,
    clinica_id integer NOT NULL,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    cor_primaria text,
    cor_secundaria text,
    template_relatorio_id integer,
    incluir_logo_relatorios boolean DEFAULT true,
    formato_data_preferencial text DEFAULT 'dd/MM/yyyy'::text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    atualizado_por_cpf text,
    CONSTRAINT clinica_configuracoes_cor_primaria_check CHECK ((cor_primaria ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT clinica_configuracoes_cor_secundaria_check CHECK ((cor_secundaria ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT clinica_configuracoes_formato_data_preferencial_check CHECK ((formato_data_preferencial = ANY (ARRAY['dd/MM/yyyy'::text, 'MM/dd/yyyy'::text, 'yyyy-MM-dd'::text])))
);


ALTER TABLE public.clinica_configuracoes OWNER TO neondb_owner;

--
-- Name: TABLE clinica_configuracoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.clinica_configuracoes IS 'Configuracoes e campos customizaveis por clinica';


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clinica_configuracoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinica_configuracoes_id_seq OWNER TO neondb_owner;

--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clinica_configuracoes_id_seq OWNED BY public.clinica_configuracoes.id;


--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinicas (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    cnpj character(14),
    email character varying(100),
    telefone character varying(20),
    endereco text,
    ativa boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    razao_social character varying(200),
    inscricao_estadual character varying(20),
    cidade character varying(100),
    estado character varying(2),
    idioma_preferencial public.idioma_suportado DEFAULT 'pt_BR'::public.idioma_suportado,
    contratante_id integer,
    nome_fantasia text
);


ALTER TABLE public.clinicas OWNER TO neondb_owner;

--
-- Name: COLUMN clinicas.razao_social; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.razao_social IS 'Razão social da clínica (diferente do nome fantasia)';


--
-- Name: COLUMN clinicas.inscricao_estadual; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.inscricao_estadual IS 'Inscrição estadual da clínica';


--
-- Name: COLUMN clinicas.cidade; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.cidade IS 'Cidade onde a clínica está localizada';


--
-- Name: COLUMN clinicas.estado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.estado IS 'Sigla do estado (UF) onde a clínica está localizada';


--
-- Name: COLUMN clinicas.contratante_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.contratante_id IS 'ID do contratante associado a esta clinica';


--
-- Name: COLUMN clinicas.nome_fantasia; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.nome_fantasia IS 'Nome fantasia/razão exibida para pessoas jurídicas (sinônimo de nome)';


--
-- Name: clinicas_empresas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinicas_empresas (
    clinica_id integer NOT NULL,
    empresa_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clinicas_empresas OWNER TO neondb_owner;

--
-- Name: TABLE clinicas_empresas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.clinicas_empresas IS 'Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que elas atendem';


--
-- Name: COLUMN clinicas_empresas.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_empresas.clinica_id IS 'ID da clinica de medicina ocupacional';


--
-- Name: COLUMN clinicas_empresas.empresa_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_empresas.empresa_id IS 'ID da empresa cliente atendida pela clÃ­nica';


--
-- Name: clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_id_seq OWNER TO neondb_owner;

--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;


--
-- Name: contratacao_personalizada; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratacao_personalizada (
    id integer NOT NULL,
    contratante_id integer,
    numero_funcionarios_estimado integer,
    valor_por_funcionario numeric(10,2),
    valor_total_estimado numeric(12,2),
    payment_link_expiracao timestamp without time zone,
    link_enviado_em timestamp without time zone,
    status character varying(50) DEFAULT 'aguardando_valor'::character varying,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_link_token character varying(128)
);


ALTER TABLE public.contratacao_personalizada OWNER TO neondb_owner;

--
-- Name: TABLE contratacao_personalizada; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratacao_personalizada IS 'Fluxo exclusivo para planos personalizados: aguardando_valor_admin → valor_definido → aguardando_pagamento → pago → ativo';


--
-- Name: COLUMN contratacao_personalizada.payment_link_expiracao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratacao_personalizada.payment_link_expiracao IS 'Data/hora de expiração do link';


--
-- Name: COLUMN contratacao_personalizada.link_enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratacao_personalizada.link_enviado_em IS 'Quando o link foi enviado ao contratante';


--
-- Name: COLUMN contratacao_personalizada.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratacao_personalizada.status IS 'aguardando_valor_admin | valor_definido | aguardando_aceite_contrato | aguardando_pagamento | pago | cancelado';


--
-- Name: COLUMN contratacao_personalizada.payment_link_token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratacao_personalizada.payment_link_token IS 'Token único para link de pagamento personalizado';


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratacao_personalizada_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratacao_personalizada_id_seq OWNER TO neondb_owner;

--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratacao_personalizada_id_seq OWNED BY public.contratacao_personalizada.id;


--
-- Name: contratantes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratantes (
    id integer NOT NULL,
    tipo public.tipo_contratante_enum NOT NULL,
    nome character varying(200) NOT NULL,
    cnpj character varying(18) NOT NULL,
    inscricao_estadual character varying(50),
    email character varying(100) NOT NULL,
    telefone character varying(20) NOT NULL,
    endereco text NOT NULL,
    cidade character varying(100) NOT NULL,
    estado character varying(2) NOT NULL,
    cep character varying(10) NOT NULL,
    responsavel_nome character varying(100) NOT NULL,
    responsavel_cpf character varying(11) NOT NULL,
    responsavel_cargo character varying(100),
    responsavel_email character varying(100) NOT NULL,
    responsavel_celular character varying(20) NOT NULL,
    cartao_cnpj_path character varying(500),
    contrato_social_path character varying(500),
    doc_identificacao_path character varying(500),
    status public.status_aprovacao_enum DEFAULT 'pendente'::public.status_aprovacao_enum,
    motivo_rejeicao text,
    observacoes_reanalise text,
    ativa boolean DEFAULT false,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    aprovado_em timestamp without time zone,
    aprovado_por_cpf character varying(11),
    pagamento_confirmado boolean DEFAULT false,
    numero_funcionarios_estimado integer,
    plano_id integer,
    data_primeiro_pagamento timestamp without time zone,
    data_liberacao_login timestamp without time zone,
    contrato_aceito boolean DEFAULT false,
    CONSTRAINT chk_contratantes_tipo_valido CHECK ((tipo = ANY (ARRAY['clinica'::public.tipo_contratante_enum, 'entidade'::public.tipo_contratante_enum]))),
    CONSTRAINT contratantes_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT contratantes_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
);


ALTER TABLE public.contratantes OWNER TO neondb_owner;

--
-- Name: TABLE contratantes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratantes IS 'Tabela unificada para clÃ­nicas e entidades privadas';


--
-- Name: COLUMN contratantes.tipo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.tipo IS 'clinica: medicina ocupacional com empresas intermediÃ¡rias | entidade: empresa privada com vÃ­nculo direto';


--
-- Name: COLUMN contratantes.responsavel_nome; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN contratantes.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.status IS 'pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento | ativo | inativo | cancelado';


--
-- Name: COLUMN contratantes.ativa; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.ativa IS 'Indica se o contratante está ativo no sistema. DEFAULT false - ativação ocorre APENAS após confirmação de pagamento.';


--
-- Name: COLUMN contratantes.aprovado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.aprovado_em IS 'Timestamp em que o contratante foi aprovado por um admin';


--
-- Name: COLUMN contratantes.aprovado_por_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.aprovado_por_cpf IS 'CPF do admin que aprovou o contratante';


--
-- Name: COLUMN contratantes.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';


--
-- Name: COLUMN contratantes.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';


--
-- Name: COLUMN contratantes.plano_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.plano_id IS 'ID do plano associado ao contratante';


--
-- Name: COLUMN contratantes.data_liberacao_login; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.data_liberacao_login IS 'Data em que o login foi liberado após confirmação de pagamento';


--
-- Name: COLUMN contratantes.contrato_aceito; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes.contrato_aceito IS 'Indica se o contratante aceitou o contrato/política (usado para fluxo de pagamento e notificações)';


--
-- Name: contratantes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_id_seq OWNER TO neondb_owner;

--
-- Name: contratantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratantes_id_seq OWNED BY public.contratantes.id;


--
-- Name: contratantes_senhas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratantes_senhas (
    id integer NOT NULL,
    contratante_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash text NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp with time zone,
    CONSTRAINT contratantes_senhas_cpf_check CHECK (((cpf)::text ~ '^\d{11}$'::text))
);


ALTER TABLE public.contratantes_senhas OWNER TO neondb_owner;

--
-- Name: TABLE contratantes_senhas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratantes_senhas IS 'Senhas hash para gestores de entidades fazerem login';


--
-- Name: COLUMN contratantes_senhas.cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes_senhas.cpf IS 'CPF do responsavel_cpf em contratantes - usado para login';


--
-- Name: COLUMN contratantes_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes_senhas.primeira_senha_alterada IS 'Flag para forÃ§ar alteraÃ§Ã£o de senha no primeiro acesso';


--
-- Name: contratantes_senhas_audit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratantes_senhas_audit (
    audit_id integer NOT NULL,
    operacao character varying(10) NOT NULL,
    contratante_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash_anterior character varying(255),
    senha_hash_nova character varying(255),
    executado_por character varying(100),
    executado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_origem character varying(50),
    motivo text,
    CONSTRAINT chk_operacao CHECK (((operacao)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.contratantes_senhas_audit OWNER TO neondb_owner;

--
-- Name: TABLE contratantes_senhas_audit; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratantes_senhas_audit IS 'Auditoria completa de todas as operações na tabela contratantes_senhas - NUNCA DELETE DESTA TABELA';


--
-- Name: COLUMN contratantes_senhas_audit.operacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes_senhas_audit.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';


--
-- Name: COLUMN contratantes_senhas_audit.senha_hash_anterior; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes_senhas_audit.senha_hash_anterior IS 'Hash da senha antes da operação (NULL para INSERT)';


--
-- Name: COLUMN contratantes_senhas_audit.senha_hash_nova; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratantes_senhas_audit.senha_hash_nova IS 'Hash da senha após a operação (NULL para DELETE)';


--
-- Name: contratantes_senhas_audit_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratantes_senhas_audit_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_senhas_audit_audit_id_seq OWNER TO neondb_owner;

--
-- Name: contratantes_senhas_audit_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratantes_senhas_audit_audit_id_seq OWNED BY public.contratantes_senhas_audit.audit_id;


--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratantes_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_senhas_id_seq OWNER TO neondb_owner;

--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratantes_senhas_id_seq OWNED BY public.contratantes_senhas.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    contratante_id integer NOT NULL,
    plano_id integer,
    numero_funcionarios integer,
    valor_total numeric(12,2),
    status public.status_aprovacao_enum DEFAULT 'pendente'::public.status_aprovacao_enum NOT NULL,
    aceito boolean DEFAULT false NOT NULL,
    pagamento_confirmado boolean DEFAULT false NOT NULL,
    conteudo text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone,
    aceito_em timestamp without time zone,
    ip_aceite character varying(64),
    data_aceite timestamp without time zone,
    hash_contrato character varying(128),
    conteudo_gerado text,
    valor_personalizado numeric(10,2),
    payment_link_expiracao timestamp without time zone,
    link_enviado_em timestamp without time zone,
    data_pagamento timestamp without time zone,
    criado_por_cpf character varying(11),
    payment_link_token character varying(128)
);


ALTER TABLE public.contratos OWNER TO neondb_owner;

--
-- Name: TABLE contratos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratos IS 'Contratos gerados para contratantes. Fluxo simplificado.';


--
-- Name: COLUMN contratos.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos.status IS 'Status extra usado para controle de pagamento (payment_pending, payment_paid, etc.)';


--
-- Name: COLUMN contratos.conteudo_gerado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos.conteudo_gerado IS 'Conteúdo completo do contrato gerado para o contratante';


--
-- Name: COLUMN contratos.valor_personalizado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos.valor_personalizado IS 'Valor negociado por funcionário para contratos personalizados';


--
-- Name: COLUMN contratos.payment_link_token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos.payment_link_token IS 'Token para link de pagamento (uso único)';


--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratos_id_seq OWNER TO neondb_owner;

--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;


--
-- Name: contratos_planos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratos_planos (
    id integer NOT NULL,
    plano_id integer,
    clinica_id integer,
    contratante_id integer,
    tipo_contratante character varying(20) NOT NULL,
    valor_personalizado_por_funcionario numeric(10,2),
    inicio_vigencia date NOT NULL,
    fim_vigencia date,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valor_pago numeric(10,2),
    tipo_pagamento character varying(20),
    modalidade_pagamento character varying(20),
    data_pagamento timestamp without time zone,
    parcelas_json jsonb,
    CONSTRAINT chk_contratos_planos_tipo_contratante_valido CHECK (((tipo_contratante)::text = ANY ((ARRAY['clinica'::character varying, 'entidade'::character varying])::text[]))),
    CONSTRAINT contratos_planos_clinica_or_contratante CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT contratos_planos_modalidade_pagamento_check CHECK (((modalidade_pagamento)::text = ANY ((ARRAY['a_vista'::character varying, 'parcelado'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT contratos_planos_tipo_contratante_check CHECK (((tipo_contratante)::text = ANY (ARRAY[('clinica'::character varying)::text, ('entidade'::character varying)::text]))),
    CONSTRAINT contratos_planos_tipo_pagamento_check CHECK (((tipo_pagamento)::text = ANY ((ARRAY['boleto'::character varying, 'cartao'::character varying, 'pix'::character varying, NULL::character varying])::text[])))
);


ALTER TABLE public.contratos_planos OWNER TO neondb_owner;

--
-- Name: COLUMN contratos_planos.valor_pago; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos_planos.valor_pago IS 'Valor efetivamente pago pelo contratante';


--
-- Name: COLUMN contratos_planos.tipo_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos_planos.tipo_pagamento IS 'Tipo de pagamento utilizado: boleto, cartao ou pix';


--
-- Name: COLUMN contratos_planos.modalidade_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos_planos.modalidade_pagamento IS 'Modalidade: a_vista ou parcelado';


--
-- Name: COLUMN contratos_planos.data_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos_planos.data_pagamento IS 'Data do primeiro pagamento';


--
-- Name: COLUMN contratos_planos.parcelas_json; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos_planos.parcelas_json IS 'Detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contratos_planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratos_planos_id_seq OWNER TO neondb_owner;

--
-- Name: contratos_planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contratos_planos_id_seq OWNED BY public.contratos_planos.id;


--
-- Name: emissao_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.emissao_queue (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    tentativas integer DEFAULT 0 NOT NULL,
    ultimo_erro text,
    proxima_execucao timestamp with time zone DEFAULT now() NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.emissao_queue OWNER TO neondb_owner;

--
-- Name: emissao_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.emissao_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emissao_queue_id_seq OWNER TO neondb_owner;

--
-- Name: emissao_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.emissao_queue_id_seq OWNED BY public.emissao_queue.id;


--
-- Name: empresas_clientes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.empresas_clientes (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    cnpj character varying(18) NOT NULL,
    email character varying(100),
    telefone character varying(20),
    endereco text,
    cidade character varying(50),
    estado character varying(2),
    cep character varying(10),
    ativa boolean DEFAULT true,
    clinica_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    representante_nome text,
    representante_fone text,
    representante_email text,
    responsavel_email text
);


ALTER TABLE public.empresas_clientes OWNER TO neondb_owner;

--
-- Name: TABLE empresas_clientes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.empresas_clientes IS 'RLS desabilitado - acesso restrito a gestores via validação manual';


--
-- Name: COLUMN empresas_clientes.representante_nome; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.empresas_clientes.representante_nome IS 'Nome do representante legal da empresa (opcional)';


--
-- Name: COLUMN empresas_clientes.representante_fone; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.empresas_clientes.representante_fone IS 'Telefone do representante (opcional)';


--
-- Name: COLUMN empresas_clientes.representante_email; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.empresas_clientes.representante_email IS 'Email do representante (opcional)';


--
-- Name: COLUMN empresas_clientes.responsavel_email; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.empresas_clientes.responsavel_email IS 'Email do responsável pela empresa';


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.empresas_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empresas_clientes_id_seq OWNER TO neondb_owner;

--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.empresas_clientes_id_seq OWNED BY public.empresas_clientes.id;


--
-- Name: fila_emissao; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.fila_emissao (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    tentativas integer DEFAULT 0,
    max_tentativas integer DEFAULT 3,
    proxima_tentativa timestamp without time zone DEFAULT now(),
    erro text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    solicitado_por character varying(11),
    solicitado_em timestamp without time zone DEFAULT now(),
    tipo_solicitante character varying(20),
    CONSTRAINT chk_fila_emissao_solicitante CHECK (((solicitado_por IS NULL) OR ((solicitado_por IS NOT NULL) AND (tipo_solicitante IS NOT NULL)))),
    CONSTRAINT fila_emissao_tipo_solicitante_check CHECK ((((tipo_solicitante)::text = ANY (ARRAY[('rh'::character varying)::text, ('gestor_entidade'::character varying)::text, ('admin'::character varying)::text])) OR (tipo_solicitante IS NULL)))
);

ALTER TABLE ONLY public.fila_emissao FORCE ROW LEVEL SECURITY;


ALTER TABLE public.fila_emissao OWNER TO neondb_owner;

--
-- Name: TABLE fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';


--
-- Name: COLUMN fila_emissao.tentativas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.tentativas IS 'Número de tentativas de processamento';


--
-- Name: COLUMN fila_emissao.max_tentativas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';


--
-- Name: COLUMN fila_emissao.proxima_tentativa; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';


--
-- Name: COLUMN fila_emissao.erro; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.erro IS 'Mensagem do último erro ocorrido';


--
-- Name: COLUMN fila_emissao.solicitado_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.solicitado_por IS 'CPF do RH ou gestor_entidade que solicitou a emissão manual do laudo';


--
-- Name: COLUMN fila_emissao.solicitado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.solicitado_em IS 'Timestamp exato da solicitação manual de emissão';


--
-- Name: COLUMN fila_emissao.tipo_solicitante; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.fila_emissao.tipo_solicitante IS 'Perfil do usuário que solicitou: rh, gestor_entidade ou admin';


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.fila_emissao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fila_emissao_id_seq OWNER TO neondb_owner;

--
-- Name: fila_emissao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.fila_emissao_id_seq OWNED BY public.fila_emissao.id;


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funcionarios (
    id integer NOT NULL,
    cpf character(11) NOT NULL,
    nome character varying(100) NOT NULL,
    setor character varying(50),
    funcao character varying(50),
    email character varying(100),
    senha_hash text NOT NULL,
    perfil character varying(20) DEFAULT 'funcionario'::character varying,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clinica_id integer,
    empresa_id integer,
    matricula character varying(20),
    turno character varying(50),
    escala character varying(50),
    nivel_cargo public.nivel_cargo_enum,
    data_nascimento date,
    incluido_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    inativado_em timestamp without time zone,
    inativado_por character varying(11),
    data_admissao date,
    ultima_avaliacao_id integer,
    ultima_avaliacao_data_conclusao timestamp without time zone,
    ultima_avaliacao_status character varying(20),
    ultimo_motivo_inativacao text,
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    data_ultimo_lote timestamp without time zone,
    contratante_id integer,
    usuario_tipo public.usuario_tipo_enum NOT NULL,
    CONSTRAINT funcionarios_nivel_cargo_check CHECK (((((perfil)::text = 'funcionario'::text) AND (nivel_cargo = ANY (ARRAY['operacional'::public.nivel_cargo_enum, 'gestao'::public.nivel_cargo_enum]))) OR (((perfil)::text <> 'funcionario'::text) AND (nivel_cargo IS NULL)))),
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['funcionario'::character varying, 'rh'::character varying, 'admin'::character varying, 'emissor'::character varying, 'gestor_entidade'::character varying, 'cadastro'::character varying])::text[]))),
    CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (((perfil)::text <> 'gestor_entidade'::text))
);

ALTER TABLE ONLY public.funcionarios FORCE ROW LEVEL SECURITY;


ALTER TABLE public.funcionarios OWNER TO neondb_owner;

--
-- Name: COLUMN funcionarios.data_nascimento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_nascimento IS 'Data de nascimento do funcionário (YYYY-MM-DD)';


--
-- Name: COLUMN funcionarios.incluido_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.incluido_em IS 'Data e hora em que o funcionário foi incluído no sistema';


--
-- Name: COLUMN funcionarios.inativado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.inativado_em IS 'Data e hora em que o funcionário foi inativado';


--
-- Name: COLUMN funcionarios.inativado_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.inativado_por IS 'CPF do usuário que inativou o funcionário';


--
-- Name: COLUMN funcionarios.data_admissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_admissao IS 'Data de admissão do funcionário na empresa';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_id IS 'ID da última avaliação concluída ou inativada (denormalizado para performance)';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_data_conclusao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_data_conclusao IS 'Data de conclusão da última avaliação (denormalizado)';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_status IS 'Status da última avaliação: concluida ou inativada (denormalizado)';


--
-- Name: COLUMN funcionarios.ultimo_motivo_inativacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.ultimo_motivo_inativacao IS 'Motivo de inativação quando ultima_avaliacao_status = inativada';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'Número sequencial da última avaliação concluída pelo funcionário (0 = nunca fez)';


--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da última avaliação válida concluída (usado para verificar prazo de 1 ano)';


--
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_id_seq OWNER TO neondb_owner;

--
-- Name: funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funcionarios_id_seq OWNED BY public.funcionarios.id;


--
-- Name: laudo_arquivos_remotos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.laudo_arquivos_remotos (
    id integer NOT NULL,
    laudo_id integer NOT NULL,
    provider character varying(32) NOT NULL,
    bucket character varying(255) NOT NULL,
    key character varying(1024) NOT NULL,
    url text NOT NULL,
    checksum character varying(128),
    size_bytes bigint,
    tipo character varying(32) DEFAULT 'principal'::character varying,
    criado_por character varying(255),
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laudo_arquivos_remotos OWNER TO neondb_owner;

--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.laudo_arquivos_remotos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNER TO neondb_owner;

--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNED BY public.laudo_arquivos_remotos.id;


--
-- Name: laudo_downloads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.laudo_downloads (
    id integer NOT NULL,
    laudo_id integer NOT NULL,
    arquivo_remoto_id integer,
    usuario_cpf character varying(14),
    ip character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laudo_downloads OWNER TO neondb_owner;

--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.laudo_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_downloads_id_seq OWNER TO neondb_owner;

--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.laudo_downloads_id_seq OWNED BY public.laudo_downloads.id;


--
-- Name: laudo_generation_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.laudo_generation_jobs (
    id bigint NOT NULL,
    lote_id integer NOT NULL,
    laudo_id integer,
    status character varying(20) DEFAULT 'queued'::character varying NOT NULL,
    attempts smallint DEFAULT 0 NOT NULL,
    max_attempts smallint DEFAULT 5 NOT NULL,
    last_error text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    finished_at timestamp with time zone
);


ALTER TABLE public.laudo_generation_jobs OWNER TO neondb_owner;

--
-- Name: TABLE laudo_generation_jobs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.laudo_generation_jobs IS 'Jobs para geração de PDFs de laudos; consumidos por worker externo.';


--
-- Name: COLUMN laudo_generation_jobs.max_attempts; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudo_generation_jobs.max_attempts IS 'Número máximo de tentativas antes de mover para DLQ/falha permanente';


--
-- Name: COLUMN laudo_generation_jobs.payload; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudo_generation_jobs.payload IS 'Payload opcional com parâmetros (ex.: options para geração, template overrides)';


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.laudo_generation_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNER TO neondb_owner;

--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNED BY public.laudo_generation_jobs.id;


--
-- Name: laudos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.laudos (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    emissor_cpf character(11),
    observacoes text,
    status character varying(20) DEFAULT 'emitido'::public.status_laudo_enum,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emitido_em timestamp without time zone,
    enviado_em timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    relatorio_individual bytea,
    relatorio_lote bytea,
    relatorio_setor bytea,
    hash_relatorio_individual character varying(64),
    hash_relatorio_lote character varying(64),
    hash_relatorio_setor character varying(64),
    hash_pdf character varying(64),
    CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (((emitido_em IS NULL) OR (emissor_cpf IS NOT NULL))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id)),
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY['rascunho'::text, 'emitido'::text, 'enviado'::text])))
);


ALTER TABLE public.laudos OWNER TO neondb_owner;

--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.laudos IS 'Laudos psicológicos emitidos por emissores. 
IMPORTANTE: Laudos são criados APENAS pelo emissor no momento da emissão.
NÃO devem ser criados antecipadamente em status rascunho.
Fluxo correto:
1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
2. Lote aparece no dashboard do emissor
3. Emissor clica "Gerar Laudo" (POST /api/emissor/laudos/[loteId])
4. Sistema cria registro em laudos E gera PDF+hash
5. Emissor revisa e envia';


--
-- Name: COLUMN laudos.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.status IS 'Status do laudo: apenas "enviado" (emissão é automática)';


--
-- Name: COLUMN laudos.relatorio_individual; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.relatorio_individual IS 'Arquivo PDF do relatório individual do funcionário';


--
-- Name: COLUMN laudos.relatorio_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.relatorio_lote IS 'Arquivo PDF do relatório do lote completo';


--
-- Name: COLUMN laudos.relatorio_setor; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.relatorio_setor IS 'Arquivo PDF do relatório setorial/estatístico';


--
-- Name: COLUMN laudos.hash_relatorio_individual; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.hash_relatorio_individual IS 'Hash SHA-256 do relatório individual para integridade';


--
-- Name: COLUMN laudos.hash_relatorio_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.hash_relatorio_lote IS 'Hash SHA-256 do relatório de lote para integridade';


--
-- Name: COLUMN laudos.hash_relatorio_setor; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.hash_relatorio_setor IS 'Hash SHA-256 do relatório setorial para integridade';


--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';


--
-- Name: CONSTRAINT laudos_id_equals_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT laudos_id_equals_lote_id ON public.laudos IS 'Garante que id = lote_id. Relação 1:1 estrita: um lote tem exatamente um laudo com o mesmo ID.';


--
-- Name: laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.laudos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudos_id_seq OWNER TO neondb_owner;

--
-- Name: laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.laudos_id_seq OWNED BY public.laudos.id;


--
-- Name: logs_admin; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.logs_admin (
    id integer NOT NULL,
    admin_cpf character varying(11) NOT NULL,
    acao character varying(100) NOT NULL,
    entidade_tipo character varying(50),
    entidade_id integer,
    detalhes jsonb,
    ip_origem character varying(45),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logs_admin OWNER TO neondb_owner;

--
-- Name: TABLE logs_admin; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.logs_admin IS 'Auditoria de ações administrativas no sistema';


--
-- Name: COLUMN logs_admin.acao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.logs_admin.acao IS 'Tipo de ação executada pelo administrador';


--
-- Name: COLUMN logs_admin.detalhes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.logs_admin.detalhes IS 'JSON com informações detalhadas da ação';


--
-- Name: logs_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.logs_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_admin_id_seq OWNER TO neondb_owner;

--
-- Name: logs_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.logs_admin_id_seq OWNED BY public.logs_admin.id;


--
-- Name: lote_id_allocator; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lote_id_allocator (
    last_id bigint NOT NULL
);


ALTER TABLE public.lote_id_allocator OWNER TO neondb_owner;

--
-- Name: lotes_avaliacao; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lotes_avaliacao (
    id integer NOT NULL,
    clinica_id integer,
    empresa_id integer,
    titulo character varying(100) NOT NULL,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'ativo'::public.status_lote_enum,
    liberado_por character(11),
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    laudo_enviado_em timestamp without time zone,
    finalizado_em timestamp without time zone,
    numero_ordem integer DEFAULT 1 NOT NULL,
    contratante_id integer,
    modo_emergencia boolean DEFAULT false,
    motivo_emergencia text,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    hash_pdf character varying(64),
    setor_id integer,
    processamento_em timestamp without time zone,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'cancelado'::character varying, 'finalizado'::character varying, 'concluido'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


ALTER TABLE public.lotes_avaliacao OWNER TO neondb_owner;

--
-- Name: TABLE lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliação - identificados apenas por ID (lote.id === laudo.id)';


--
-- Name: COLUMN lotes_avaliacao.id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.id IS 'Identificador único do lote (igual ao ID do laudo correspondente)';


--
-- Name: COLUMN lotes_avaliacao.liberado_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clínica';


--
-- Name: COLUMN lotes_avaliacao.laudo_enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo foi enviado pelo emissor para a clínica';


--
-- Name: COLUMN lotes_avaliacao.numero_ordem; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.numero_ordem IS 'Número sequencial do lote na empresa (ex: 10 para o 10º lote da empresa)';


--
-- Name: COLUMN lotes_avaliacao.modo_emergencia; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.modo_emergencia IS 'Flag que indica se o lote está em modo emergência (permite reprocessamento)';


--
-- Name: COLUMN lotes_avaliacao.motivo_emergencia; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_emergencia IS 'Descrição do motivo pelo qual o lote entrou em modo emergência';


--
-- Name: COLUMN lotes_avaliacao.emitido_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.emitido_em IS 'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';


--
-- Name: COLUMN lotes_avaliacao.enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi marcado como enviado para RH/Entidade';


--
-- Name: COLUMN lotes_avaliacao.hash_pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.hash_pdf IS 'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';


--
-- Name: COLUMN lotes_avaliacao.setor_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.setor_id IS 'Setor da empresa ao qual o lote pertence (opcional)';


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lotes_avaliacao_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_funcionarios_id_seq OWNER TO neondb_owner;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lotes_avaliacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNER TO neondb_owner;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNED BY public.lotes_avaliacao.id;


--
-- Name: mfa_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mfa_codes (
    id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mfa_codes OWNER TO neondb_owner;

--
-- Name: TABLE mfa_codes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.mfa_codes IS 'CÃ³digos de autenticaÃ§Ã£o multifator (MFA) para funcionÃ¡rios';


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.mfa_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mfa_codes_id_seq OWNER TO neondb_owner;

--
-- Name: mfa_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.mfa_codes_id_seq OWNED BY public.mfa_codes.id;


--
-- Name: migration_guidelines; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.migration_guidelines (
    id integer NOT NULL,
    category text NOT NULL,
    guideline text NOT NULL,
    example text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.migration_guidelines OWNER TO neondb_owner;

--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.migration_guidelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migration_guidelines_id_seq OWNER TO neondb_owner;

--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.migration_guidelines_id_seq OWNED BY public.migration_guidelines.id;


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    tipo public.tipo_notificacao NOT NULL,
    prioridade public.prioridade_notificacao DEFAULT 'media'::public.prioridade_notificacao,
    destinatario_cpf text NOT NULL,
    destinatario_tipo text NOT NULL,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    dados_contexto jsonb,
    link_acao text,
    botao_texto text,
    lida boolean DEFAULT false,
    data_leitura timestamp without time zone,
    arquivada boolean DEFAULT false,
    contratacao_personalizada_id integer,
    criado_em timestamp without time zone DEFAULT now(),
    expira_em timestamp without time zone,
    resolvida boolean DEFAULT false NOT NULL,
    data_resolucao timestamp without time zone,
    resolvido_por_cpf character varying(11),
    CONSTRAINT notificacao_destinatario_valido CHECK ((length(destinatario_cpf) > 0)),
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor_entidade'::text, 'funcionario'::text, 'contratante'::text, 'clinica'::text])))
);


ALTER TABLE public.notificacoes OWNER TO neondb_owner;

--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real para admin e gestores';


--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais específicos do tipo de notificação';


--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiração da notificação (limpeza automática)';


--
-- Name: COLUMN notificacoes.resolvida; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.resolvida IS 'Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida';


--
-- Name: COLUMN notificacoes.data_resolucao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.data_resolucao IS 'Data/hora em que a notificação foi marcada como resolvida';


--
-- Name: COLUMN notificacoes.resolvido_por_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.resolvido_por_cpf IS 'CPF do usuário que resolveu a notificação';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notificacoes_admin (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    lote_id integer,
    visualizada boolean DEFAULT false,
    criado_em timestamp with time zone DEFAULT now(),
    titulo character varying(200) NOT NULL,
    contratante_id integer,
    contrato_id integer,
    pagamento_id integer,
    dados_contexto jsonb,
    lida boolean DEFAULT false,
    resolvida boolean DEFAULT false,
    data_leitura timestamp without time zone,
    data_resolucao timestamp without time zone,
    resolvido_por_cpf character varying(11),
    observacoes_resolucao text,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notificacoes_admin OWNER TO neondb_owner;

--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.notificacoes_admin IS 'Notificações críticas para administradores do sistema';


--
-- Name: COLUMN notificacoes_admin.tipo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes_admin.tipo IS 'Tipo da notificação (sem_emissor, erro_critico, etc)';


--
-- Name: COLUMN notificacoes_admin.mensagem; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes_admin.mensagem IS 'Mensagem descritiva da notificação';


--
-- Name: COLUMN notificacoes_admin.lote_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes_admin.lote_id IS 'Referência ao lote relacionado (opcional)';


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notificacoes_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_admin_id_seq OWNER TO neondb_owner;

--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notificacoes_admin_id_seq OWNED BY public.notificacoes_admin.id;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_id_seq OWNER TO neondb_owner;

--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: notificacoes_traducoes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notificacoes_traducoes (
    id integer NOT NULL,
    chave_traducao text NOT NULL,
    idioma public.idioma_suportado NOT NULL,
    conteudo text NOT NULL,
    categoria text NOT NULL,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT notificacoes_traducoes_categoria_check CHECK ((categoria = ANY (ARRAY['titulo'::text, 'mensagem'::text, 'botao'::text, 'geral'::text])))
);


ALTER TABLE public.notificacoes_traducoes OWNER TO neondb_owner;

--
-- Name: TABLE notificacoes_traducoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.notificacoes_traducoes IS 'Traducoes de notificacoes para multi-idioma';


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notificacoes_traducoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_traducoes_id_seq OWNER TO neondb_owner;

--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notificacoes_traducoes_id_seq OWNED BY public.notificacoes_traducoes.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    contratante_id integer NOT NULL,
    valor numeric(10,2) NOT NULL,
    metodo character varying(50),
    status character varying(50) DEFAULT 'pendente'::character varying,
    plataforma_id character varying(255),
    plataforma_nome character varying(100),
    dados_adicionais jsonb,
    data_pagamento timestamp without time zone,
    data_confirmacao timestamp without time zone,
    comprovante_path character varying(500),
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    numero_parcelas integer DEFAULT 1,
    recibo_url text,
    recibo_numero character varying(50),
    detalhes_parcelas jsonb,
    numero_funcionarios integer,
    valor_por_funcionario numeric(10,2),
    contrato_id integer,
    idempotency_key character varying(255),
    external_transaction_id character varying(255),
    provider_event_id character varying(255),
    CONSTRAINT check_numero_parcelas CHECK (((numero_parcelas >= 1) AND (numero_parcelas <= 12)))
);


ALTER TABLE public.pagamentos OWNER TO neondb_owner;

--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.pagamentos IS 'Tabela de pagamentos com suporte a planos fixos e personalizados';


--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)';


--
-- Name: COLUMN pagamentos.recibo_url; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.recibo_url IS 'URL para visualização do recibo gerado';


--
-- Name: COLUMN pagamentos.recibo_numero; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.recibo_numero IS 'Número do recibo gerado após confirmação do pagamento (formato: REC-AAAA-NNNNN)';


--
-- Name: COLUMN pagamentos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.detalhes_parcelas IS 'detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';


--
-- Name: COLUMN pagamentos.numero_funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.numero_funcionarios IS 'Número de funcionários no momento da contratação (para planos fixos)';


--
-- Name: COLUMN pagamentos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.valor_por_funcionario IS 'Valor cobrado por funcionário (R$20,00 para plano fixo)';


--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';


--
-- Name: COLUMN pagamentos.idempotency_key; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.idempotency_key IS 'Chave de idempotência para evitar duplicação de pagamentos (opcional)';


--
-- Name: COLUMN pagamentos.external_transaction_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.external_transaction_id IS 'ID da transação no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';


--
-- Name: COLUMN pagamentos.provider_event_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.pagamentos.provider_event_id IS 'ID único do evento do provedor de pagamento (para deduplicação de webhooks)';


--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagamentos_id_seq OWNER TO neondb_owner;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: payment_links; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payment_links (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    contrato_id integer NOT NULL,
    criado_por_cpf character varying(11),
    usado boolean DEFAULT false NOT NULL,
    usado_em timestamp without time zone,
    expiracao timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_links OWNER TO neondb_owner;

--
-- Name: TABLE payment_links; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.payment_links IS 'Links de uso único enviados pelo admin para permitir pagamento de planos personalizados';


--
-- Name: COLUMN payment_links.token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.payment_links.token IS 'Token público do link (uso único)';


--
-- Name: COLUMN payment_links.expiracao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.payment_links.expiracao IS 'Data/hora de expiração do link (opcional)';


--
-- Name: payment_links_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payment_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_links_id_seq OWNER TO neondb_owner;

--
-- Name: payment_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payment_links_id_seq OWNED BY public.payment_links.id;


--
-- Name: pdf_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pdf_jobs (
    id integer NOT NULL,
    recibo_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp without time zone,
    CONSTRAINT pdf_jobs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.pdf_jobs OWNER TO neondb_owner;

--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pdf_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_jobs_id_seq OWNER TO neondb_owner;

--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pdf_jobs_id_seq OWNED BY public.pdf_jobs.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO neondb_owner;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: planos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.planos (
    id integer NOT NULL,
    tipo public.tipo_plano NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    valor_por_funcionario numeric(10,2),
    preco numeric(10,2),
    limite_funcionarios integer,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    caracteristicas text
);


ALTER TABLE public.planos OWNER TO neondb_owner;

--
-- Name: COLUMN planos.caracteristicas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.planos.caracteristicas IS 'Características do plano em JSON: minimo_funcionarios, limite_funcionarios, beneficios, etc.';


--
-- Name: planos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planos_id_seq OWNER TO neondb_owner;

--
-- Name: planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.planos_id_seq OWNED BY public.planos.id;


--
-- Name: policy_expression_backups; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.policy_expression_backups OWNER TO neondb_owner;

--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.policy_expression_backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policy_expression_backups_id_seq OWNER TO neondb_owner;

--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.policy_expression_backups_id_seq OWNED BY public.policy_expression_backups.id;


--
-- Name: questao_condicoes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.questao_condicoes (
    id integer NOT NULL,
    questao_id integer NOT NULL,
    questao_dependente integer,
    operador character varying(10),
    valor_condicao integer,
    categoria character varying(20) DEFAULT 'core'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.questao_condicoes OWNER TO neondb_owner;

--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.questao_condicoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questao_condicoes_id_seq OWNER TO neondb_owner;

--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.questao_condicoes_id_seq OWNED BY public.questao_condicoes.id;


--
-- Name: recibos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recibos (
    id integer NOT NULL,
    contrato_id integer NOT NULL,
    pagamento_id integer NOT NULL,
    contratante_id integer,
    numero_recibo character varying(50) NOT NULL,
    vigencia_inicio date NOT NULL,
    vigencia_fim date NOT NULL,
    numero_funcionarios_cobertos integer NOT NULL,
    valor_total_anual numeric(10,2) NOT NULL,
    valor_por_funcionario numeric(10,2),
    forma_pagamento character varying(50) NOT NULL,
    numero_parcelas integer DEFAULT 1,
    valor_parcela numeric(10,2),
    detalhes_parcelas jsonb,
    descricao_pagamento text,
    conteudo_pdf_path text,
    conteudo_texto text,
    emitido_por_cpf character varying(11),
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pdf bytea,
    hash_pdf character(64),
    ip_emissao inet,
    emitido_por character varying(14),
    hash_incluso boolean DEFAULT true NOT NULL,
    backup_path character varying(255),
    parcela_numero integer,
    clinica_id integer,
    CONSTRAINT recibos_contratante_ou_clinica_check CHECK (((contratante_id IS NOT NULL) OR (clinica_id IS NOT NULL))),
    CONSTRAINT recibos_numero_funcionarios_check CHECK ((numero_funcionarios_cobertos > 0)),
    CONSTRAINT recibos_numero_parcelas_check CHECK ((numero_parcelas >= 1)),
    CONSTRAINT recibos_valor_funcionario_check CHECK (((valor_por_funcionario IS NULL) OR (valor_por_funcionario >= (0)::numeric))),
    CONSTRAINT recibos_valor_total_check CHECK ((valor_total_anual >= (0)::numeric)),
    CONSTRAINT recibos_vigencia_check CHECK ((vigencia_fim > vigencia_inicio))
);


ALTER TABLE public.recibos OWNER TO neondb_owner;

--
-- Name: TABLE recibos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.recibos IS 'Recibos financeiros gerados após confirmação de pagamento, separados do contrato de serviço';


--
-- Name: COLUMN recibos.numero_recibo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.numero_recibo IS 'Número único do recibo no formato REC-AAAA-NNNNN';


--
-- Name: COLUMN recibos.vigencia_inicio; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.vigencia_inicio IS 'Data de início da vigência = data do pagamento';


--
-- Name: COLUMN recibos.vigencia_fim; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.vigencia_fim IS 'Data de fim da vigência = data_pagamento + 364 dias';


--
-- Name: COLUMN recibos.numero_funcionarios_cobertos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionários cobertos pelo plano contratado';


--
-- Name: COLUMN recibos.valor_total_anual; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.valor_total_anual IS 'Valor total anual do plano';


--
-- Name: COLUMN recibos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.valor_por_funcionario IS 'Valor cobrado por funcionário (se aplicável)';


--
-- Name: COLUMN recibos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';


--
-- Name: COLUMN recibos.descricao_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.descricao_pagamento IS 'Descrição textual da forma de pagamento para incluir no PDF';


--
-- Name: COLUMN recibos.pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.pdf IS 'PDF binário do recibo (BYTEA)';


--
-- Name: COLUMN recibos.hash_pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.hash_pdf IS 'Hash SHA-256 do PDF binário em hexadecimal (64 caracteres)';


--
-- Name: COLUMN recibos.ip_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.ip_emissao IS 'Endereço IP de onde o recibo foi emitido';


--
-- Name: COLUMN recibos.emitido_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.emitido_por IS 'CPF do usuário que emitiu o recibo (formato: XXX.XXX.XXX-XX)';


--
-- Name: COLUMN recibos.hash_incluso; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.hash_incluso IS 'Indica se o hash foi incluído no rodapé do PDF';


--
-- Name: COLUMN recibos.backup_path; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';


--
-- Name: COLUMN recibos.parcela_numero; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.parcela_numero IS 'Número da parcela associada ao recibo (1, 2, 3...)';


--
-- Name: COLUMN recibos.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.recibos.clinica_id IS 'ID da clínica associada ao recibo (opcional, para suporte a RH/Clínica)';


--
-- Name: recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recibos_id_seq OWNER TO neondb_owner;

--
-- Name: recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.recibos_id_seq OWNED BY public.recibos.id;


--
-- Name: relatorio_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.relatorio_templates (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    tipo character varying(20) NOT NULL,
    descricao text,
    campos_incluidos jsonb,
    filtros_padrao jsonb,
    formato_saida character varying(20) DEFAULT 'A4'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT relatorio_templates_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('pdf'::character varying)::text, ('excel'::character varying)::text, ('ambos'::character varying)::text])))
);


ALTER TABLE public.relatorio_templates OWNER TO neondb_owner;

--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.relatorio_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relatorio_templates_id_seq OWNER TO neondb_owner;

--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.relatorio_templates_id_seq OWNED BY public.relatorio_templates.id;


--
-- Name: respostas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.respostas (
    id integer NOT NULL,
    avaliacao_id integer NOT NULL,
    grupo integer NOT NULL,
    item character varying(10) NOT NULL,
    valor integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    questao integer,
    CONSTRAINT respostas_valor_check CHECK ((valor = ANY (ARRAY[0, 25, 50, 75, 100])))
);


ALTER TABLE public.respostas OWNER TO neondb_owner;

--
-- Name: respostas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.respostas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respostas_id_seq OWNER TO neondb_owner;

--
-- Name: respostas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.respostas_id_seq OWNED BY public.respostas.id;


--
-- Name: resultados; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.resultados (
    id integer NOT NULL,
    avaliacao_id integer NOT NULL,
    grupo integer NOT NULL,
    dominio character varying(100) NOT NULL,
    score numeric(5,2) NOT NULL,
    categoria character varying(20),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resultados_categoria_check CHECK (((categoria)::text = ANY (ARRAY[('baixo'::character varying)::text, ('medio'::character varying)::text, ('alto'::character varying)::text])))
);


ALTER TABLE public.resultados OWNER TO neondb_owner;

--
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.resultados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultados_id_seq OWNER TO neondb_owner;

--
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.role_permissions IS 'Admin tem apenas permissões de cadastro (RH, clínicas, admins). 
Operações como gerenciar avaliações, lotes, empresas e funcionários são de responsabilidade de RH e entidade_gestor.
Emissão de laudos é exclusiva de emissores.';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    hierarchy_level integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: session_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_logs (
    id bigint NOT NULL,
    cpf character varying(11) NOT NULL,
    perfil character varying(20) NOT NULL,
    clinica_id integer,
    empresa_id integer,
    login_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logout_timestamp timestamp without time zone,
    ip_address inet,
    user_agent text,
    session_duration interval GENERATED ALWAYS AS ((logout_timestamp - login_timestamp)) STORED,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.session_logs OWNER TO neondb_owner;

--
-- Name: TABLE session_logs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.session_logs IS 'Registra todos os acessos (login/logout) de usuários do sistema para auditoria';


--
-- Name: COLUMN session_logs.cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_logs.cpf IS 'CPF do usuário que fez login';


--
-- Name: COLUMN session_logs.perfil; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_logs.perfil IS 'Perfil do usuário no momento do login (funcionario, rh, emissor, admin)';


--
-- Name: COLUMN session_logs.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_logs.clinica_id IS 'ID da clínica associada ao usuário (para RH e emissores)';


--
-- Name: COLUMN session_logs.empresa_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_logs.empresa_id IS 'ID da empresa associada ao funcionário';


--
-- Name: COLUMN session_logs.session_duration; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_logs.session_duration IS 'Duração calculada da sessão (logout - login)';


--
-- Name: session_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.session_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_logs_id_seq OWNER TO neondb_owner;

--
-- Name: session_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.session_logs_id_seq OWNED BY public.session_logs.id;


--
-- Name: suspicious_activity; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.suspicious_activity AS
 SELECT user_cpf,
    user_perfil,
    resource,
    count(*) AS action_count,
    max(created_at) AS last_action,
    min(created_at) AS first_action,
    EXTRACT(epoch FROM (max(created_at) - min(created_at))) AS seconds_elapsed
   FROM public.audit_logs
  WHERE (created_at >= (now() - '01:00:00'::interval))
  GROUP BY user_cpf, user_perfil, resource
 HAVING (count(*) > 100)
  ORDER BY (count(*)) DESC;


ALTER VIEW public.suspicious_activity OWNER TO neondb_owner;

--
-- Name: VIEW suspicious_activity; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.suspicious_activity IS 'Detecta atividades suspeitas: usuÃƒÂ¡rios com mais de 100 aÃƒÂ§ÃƒÂµes na ÃƒÂºltima hora';


--
-- Name: templates_contrato; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.templates_contrato (
    id integer NOT NULL,
    nome text NOT NULL,
    descricao text,
    tipo_template text NOT NULL,
    conteudo text NOT NULL,
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    versao integer DEFAULT 1,
    criado_em timestamp without time zone DEFAULT now(),
    criado_por_cpf text,
    atualizado_em timestamp without time zone DEFAULT now(),
    atualizado_por_cpf text,
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT templates_contrato_tipo_template_check CHECK ((tipo_template = ANY (ARRAY['plano_fixo'::text, 'plano_personalizado'::text, 'padrao'::text])))
);


ALTER TABLE public.templates_contrato OWNER TO neondb_owner;

--
-- Name: TABLE templates_contrato; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.templates_contrato IS 'Templates editaveis para geracao de contratos';


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.templates_contrato_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_contrato_id_seq OWNER TO neondb_owner;

--
-- Name: templates_contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.templates_contrato_id_seq OWNED BY public.templates_contrato.id;


--
-- Name: tokens_retomada_pagamento; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tokens_retomada_pagamento (
    id integer NOT NULL,
    token character varying(32) NOT NULL,
    contratante_id integer NOT NULL,
    contrato_id integer NOT NULL,
    usado boolean DEFAULT false,
    usado_em timestamp without time zone,
    expira_em timestamp without time zone NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_token_expiracao CHECK ((expira_em > criado_em))
);


ALTER TABLE public.tokens_retomada_pagamento OWNER TO neondb_owner;

--
-- Name: TABLE tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.tokens_retomada_pagamento IS 'Armazena tokens seguros para permitir que contratantes retomem pagamentos pendentes sem refazer cadastro.';


--
-- Name: COLUMN tokens_retomada_pagamento.token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.token IS 'Token único gerado para autenticar link de pagamento. Tem TTL de 48h por padrão.';


--
-- Name: COLUMN tokens_retomada_pagamento.usado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.usado IS 'Indica se token já foi utilizado. Tokens usados não podem ser reutilizados.';


--
-- Name: COLUMN tokens_retomada_pagamento.expira_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.expira_em IS 'Data/hora de expiração do token (72 horas por padrão)';


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tokens_retomada_pagamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_retomada_pagamento_id_seq OWNER TO neondb_owner;

--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tokens_retomada_pagamento_id_seq OWNED BY public.tokens_retomada_pagamento.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    cpf text NOT NULL,
    nome text,
    role text DEFAULT 'admin'::text NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.usuarios OWNER TO neondb_owner;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.usuarios IS 'Tabela de usuários do sistema (mínima para compatibilidade em DEV)';


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO neondb_owner;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_relatorio_emissoes_usuario; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_relatorio_emissoes_usuario AS
 SELECT fe.solicitado_por AS cpf,
    fe.tipo_solicitante AS perfil,
    count(*) AS total_solicitacoes,
    count(
        CASE
            WHEN ((l.status)::text = 'emitido'::text) THEN 1
            ELSE NULL::integer
        END) AS emissoes_sucesso,
    count(
        CASE
            WHEN ((l.status)::text = 'enviado'::text) THEN 1
            ELSE NULL::integer
        END) AS emissoes_enviadas,
    count(
        CASE
            WHEN (fe.erro IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS emissoes_erro,
    count(
        CASE
            WHEN ((l.id IS NULL) AND (fe.tentativas >= fe.max_tentativas)) THEN 1
            ELSE NULL::integer
        END) AS emissoes_falhou,
    min(fe.solicitado_em) AS primeira_solicitacao,
    max(fe.solicitado_em) AS ultima_solicitacao,
    avg(EXTRACT(epoch FROM (l.emitido_em - fe.solicitado_em))) AS tempo_medio_emissao_segundos
   FROM (public.fila_emissao fe
     LEFT JOIN public.laudos l ON ((fe.lote_id = l.lote_id)))
  WHERE (fe.solicitado_por IS NOT NULL)
  GROUP BY fe.solicitado_por, fe.tipo_solicitante
  ORDER BY (count(*)) DESC;


ALTER VIEW public.v_relatorio_emissoes_usuario OWNER TO neondb_owner;

--
-- Name: VIEW v_relatorio_emissoes_usuario; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.v_relatorio_emissoes_usuario IS 'Relatório estatístico de emissões por usuário (RH ou gestor_entidade) para auditoria e compliance';


--
-- Name: vw_analise_grupos_negativos; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_analise_grupos_negativos AS
 SELECT grupo,
    count(*) AS total_avaliacoes,
    avg(score_original) AS media_original,
    avg(score_ajustado) AS media_ajustada,
    stddev(score_original) AS desvio_padrao,
    count(
        CASE
            WHEN anomalia_detectada THEN 1
            ELSE NULL::integer
        END) AS anomalias_detectadas,
    count(
        CASE
            WHEN (score_original < (0)::numeric) THEN 1
            ELSE NULL::integer
        END) AS scores_negativos,
    count(
        CASE
            WHEN (score_original > (100)::numeric) THEN 1
            ELSE NULL::integer
        END) AS scores_acima_limite,
    string_agg(DISTINCT (tipo_anomalia)::text, ', '::text) AS tipos_anomalias
   FROM public.analise_estatistica
  GROUP BY grupo
  ORDER BY grupo;


ALTER VIEW public.vw_analise_grupos_negativos OWNER TO neondb_owner;

--
-- Name: vw_audit_trail_por_contratante; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_audit_trail_por_contratante AS
 SELECT al.id,
    al.resource,
    al.action,
    al.resource_id,
    al.details,
    al.user_cpf,
    f.nome AS user_nome,
    f.clinica_id,
    c.nome AS clinica_nome,
    al.contratante_id,
    cont.nome AS contratante_nome,
    cont.tipo AS tipo_contratante,
    al.created_at,
    al.ip_address
   FROM (((public.audit_logs al
     LEFT JOIN public.funcionarios f ON ((al.user_cpf = f.cpf)))
     LEFT JOIN public.clinicas c ON ((f.clinica_id = c.id)))
     LEFT JOIN public.contratantes cont ON ((al.contratante_id = cont.id)))
  WHERE (al.created_at >= (now() - '90 days'::interval))
  ORDER BY al.created_at DESC;


ALTER VIEW public.vw_audit_trail_por_contratante OWNER TO neondb_owner;

--
-- Name: VIEW vw_audit_trail_por_contratante; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_audit_trail_por_contratante IS 'Trilha de auditoria completa incluindo informações de contratante (clínica ou entidade) - últimos 90 dias';


--
-- Name: vw_auditoria_acessos_funcionarios; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_auditoria_acessos_funcionarios AS
 SELECT sl.id,
    sl.cpf AS cpf_anonimizado,
    sl.clinica_id,
    c.nome AS clinica_nome,
    sl.empresa_id,
    ec.nome AS empresa_nome,
    f.incluido_em AS inclusao,
    f.inativado_em AS inativacao,
    sl.login_timestamp,
    sl.logout_timestamp,
    sl.session_duration,
    sl.ip_address
   FROM (((public.session_logs sl
     LEFT JOIN public.funcionarios f ON ((f.cpf = (sl.cpf)::bpchar)))
     LEFT JOIN public.clinicas c ON ((c.id = sl.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = sl.empresa_id)))
  WHERE ((sl.perfil)::text = 'funcionario'::text)
  ORDER BY sl.login_timestamp DESC;


ALTER VIEW public.vw_auditoria_acessos_funcionarios OWNER TO neondb_owner;

--
-- Name: VIEW vw_auditoria_acessos_funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_auditoria_acessos_funcionarios IS 'View para auditoria de acessos de funcionários com CPF anonimizado';


--
-- Name: vw_auditoria_acessos_rh; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_auditoria_acessos_rh AS
 SELECT sl.id,
    sl.cpf,
    f.nome,
    sl.clinica_id,
    c.nome AS clinica_nome,
    sl.login_timestamp,
    sl.logout_timestamp,
    sl.session_duration,
    sl.ip_address,
    sl.user_agent
   FROM ((public.session_logs sl
     LEFT JOIN public.funcionarios f ON ((f.cpf = (sl.cpf)::bpchar)))
     LEFT JOIN public.clinicas c ON ((c.id = sl.clinica_id)))
  WHERE ((sl.perfil)::text = 'rh'::text)
  ORDER BY sl.login_timestamp DESC;


ALTER VIEW public.vw_auditoria_acessos_rh OWNER TO neondb_owner;

--
-- Name: VIEW vw_auditoria_acessos_rh; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_auditoria_acessos_rh IS 'View para auditoria de acessos de gestores RH';


--
-- Name: vw_auditoria_lotes; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_auditoria_lotes AS
 SELECT l.id AS lote_id,
    l.clinica_id,
    l.empresa_id,
    l.status,
    l.tipo,
    l.titulo,
    l.liberado_por AS liberado_por_cpf,
    f.nome AS liberado_por_nome,
    l.liberado_em,
    l.criado_em,
    l.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome,
    ( SELECT count(*) AS count
           FROM public.avaliacoes
          WHERE (avaliacoes.lote_id = l.id)) AS total_avaliacoes,
    ( SELECT count(*) AS count
           FROM public.avaliacoes
          WHERE ((avaliacoes.lote_id = l.id) AND ((avaliacoes.status)::text = 'concluida'::text))) AS avaliacoes_concluidas,
    ( SELECT count(*) AS count
           FROM public.audit_logs
          WHERE (((audit_logs.resource)::text = 'lotes_avaliacao'::text) AND (audit_logs.resource_id = (l.id)::text) AND ((audit_logs.action)::text = 'UPDATE'::text) AND ((audit_logs.old_data ->> 'status'::text) <> (audit_logs.new_data ->> 'status'::text)))) AS mudancas_status
   FROM (((public.lotes_avaliacao l
     LEFT JOIN public.funcionarios f ON ((f.cpf = l.liberado_por)))
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
  ORDER BY l.criado_em DESC;


ALTER VIEW public.vw_auditoria_lotes OWNER TO neondb_owner;

--
-- Name: vw_auditoria_senhas; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_auditoria_senhas AS
 SELECT a.audit_id,
    a.operacao,
    c.nome AS contratante_nome,
    c.cnpj,
    a.cpf,
    (a.senha_hash_anterior IS NOT NULL) AS tinha_senha_anterior,
    (a.senha_hash_nova IS NOT NULL) AS tem_senha_nova,
    a.executado_por,
    a.executado_em,
    a.motivo,
        CASE
            WHEN (a.motivo ~~ '%BLOQUEADA%'::text) THEN 'TENTATIVA_BLOQUEADA'::text
            WHEN ((a.operacao)::text = 'DELETE'::text) THEN 'DELETE_AUTORIZADO'::text
            ELSE 'NORMAL'::text
        END AS tipo_operacao
   FROM (public.contratantes_senhas_audit a
     LEFT JOIN public.contratantes c ON ((c.id = a.contratante_id)))
  ORDER BY a.executado_em DESC;


ALTER VIEW public.vw_auditoria_senhas OWNER TO neondb_owner;

--
-- Name: VIEW vw_auditoria_senhas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_auditoria_senhas IS 'View simplificada para análise de auditoria de senhas';


--
-- Name: vw_comparativo_empresas; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_comparativo_empresas AS
 SELECT ec.clinica_id,
    ec.id AS empresa_id,
    ec.nome AS empresa_nome,
    avg(
        CASE
            WHEN (r.grupo = 1) THEN r.valor
            ELSE NULL::integer
        END) AS demandas_trabalho,
    avg(
        CASE
            WHEN (r.grupo = 2) THEN r.valor
            ELSE NULL::integer
        END) AS organizacao_conteudo,
    avg(
        CASE
            WHEN (r.grupo = 3) THEN r.valor
            ELSE NULL::integer
        END) AS relacoes_sociais,
    avg(
        CASE
            WHEN (r.grupo = 4) THEN r.valor
            ELSE NULL::integer
        END) AS lideranca,
    avg(
        CASE
            WHEN (r.grupo = 5) THEN r.valor
            ELSE NULL::integer
        END) AS valores_organizacionais,
    avg(
        CASE
            WHEN (r.grupo = 6) THEN r.valor
            ELSE NULL::integer
        END) AS saude_bem_estar,
    avg(r.valor) AS score_geral,
    count(DISTINCT f.cpf) AS funcionarios_responderam,
    count(r.valor) AS total_respostas
   FROM (((public.empresas_clientes ec
     JOIN public.funcionarios f ON ((ec.id = f.empresa_id)))
     JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
     JOIN public.respostas r ON ((a.id = r.avaliacao_id)))
  WHERE (((a.status)::text = 'concluida'::text) AND (r.grupo <= 6))
  GROUP BY ec.clinica_id, ec.id, ec.nome
  ORDER BY ec.clinica_id, ec.nome;


ALTER VIEW public.vw_comparativo_empresas OWNER TO neondb_owner;

--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_funcionarios_por_lote AS
 SELECT f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.turno,
    f.escala,
    f.empresa_id,
    f.clinica_id,
    a.id AS avaliacao_id,
    a.status AS status_avaliacao,
    a.envio AS data_conclusao,
    a.inicio AS data_inicio,
    a.lote_id
   FROM (public.funcionarios f
     LEFT JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
  WHERE (((f.perfil)::text = 'funcionario'::text) AND (f.ativo = true));


ALTER VIEW public.vw_funcionarios_por_lote OWNER TO neondb_owner;

--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes';


--
-- Name: vw_lotes_detalhados; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_lotes_detalhados AS
 SELECT la.id AS lote_id,
    la.titulo AS lote_titulo,
    la.status AS lote_status,
    la.tipo AS lote_tipo,
    la.liberado_em,
    la.liberado_por,
    c.nome AS clinica_nome,
    e.nome AS empresa_nome,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'inativada'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_inativadas,
    l.id AS laudo_id,
    l.status AS laudo_status
   FROM ((((public.lotes_avaliacao la
     LEFT JOIN public.clinicas c ON ((la.clinica_id = c.id)))
     LEFT JOIN public.empresas_clientes e ON ((la.empresa_id = e.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.id)))
  GROUP BY la.id, la.titulo, la.status, la.tipo, la.liberado_em, la.liberado_por, c.nome, e.nome, l.id, l.status;


ALTER VIEW public.vw_lotes_detalhados OWNER TO neondb_owner;

--
-- Name: vw_notificacoes_admin_pendentes; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_notificacoes_admin_pendentes AS
 SELECT n.id,
    n.tipo,
    n.titulo,
    n.mensagem,
    c.nome AS contratante_nome,
    c.tipo AS contratante_tipo,
    c.email AS contratante_email,
    cont.id AS numero_contrato,
    n.criado_em,
    EXTRACT(day FROM (CURRENT_TIMESTAMP - n.criado_em)) AS dias_pendente,
    n.dados_contexto
   FROM ((public.notificacoes_admin n
     LEFT JOIN public.contratantes c ON ((n.contratante_id = c.id)))
     LEFT JOIN public.contratos cont ON ((n.contrato_id = cont.id)))
  WHERE (n.resolvida = false)
  ORDER BY n.criado_em DESC;


ALTER VIEW public.vw_notificacoes_admin_pendentes OWNER TO neondb_owner;

--
-- Name: VIEW vw_notificacoes_admin_pendentes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_notificacoes_admin_pendentes IS 'Notificações pendentes de resolução com dados contextuais';


--
-- Name: vw_notificacoes_nao_lidas; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_notificacoes_nao_lidas AS
 SELECT destinatario_cpf,
    destinatario_tipo,
    count(*) AS total_nao_lidas,
    count(*) FILTER (WHERE (prioridade = 'critica'::public.prioridade_notificacao)) AS criticas,
    count(*) FILTER (WHERE (prioridade = 'alta'::public.prioridade_notificacao)) AS altas,
    max(criado_em) AS ultima_notificacao
   FROM public.notificacoes
  WHERE ((lida = false) AND (arquivada = false))
  GROUP BY destinatario_cpf, destinatario_tipo;


ALTER VIEW public.vw_notificacoes_nao_lidas OWNER TO neondb_owner;

--
-- Name: vw_recibos_completos; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_recibos_completos AS
 SELECT r.id,
    r.numero_recibo,
    r.vigencia_inicio,
    r.vigencia_fim,
    r.numero_funcionarios_cobertos,
    r.valor_total_anual,
    r.valor_por_funcionario,
    r.forma_pagamento,
    r.numero_parcelas,
    COALESCE(r.valor_parcela,
        CASE
            WHEN ((r.numero_parcelas IS NOT NULL) AND (r.numero_parcelas > 0)) THEN round(((r.valor_total_anual)::numeric / (r.numero_parcelas)::numeric), 2)
            ELSE r.valor_total_anual
        END) AS valor_parcela,
    r.descricao_pagamento,
    r.criado_em,
    c.id AS contrato_id,
    c.conteudo_gerado AS contrato_conteudo,
    c.data_aceite AS contrato_data_aceite,
    ct.nome AS contratante_nome,
    ct.cnpj AS contratante_cnpj,
    ct.email AS contratante_email,
    ct.tipo AS contratante_tipo,
    p.nome AS plano_nome,
    p.tipo AS plano_tipo,
    pg.metodo AS pagamento_metodo,
    pg.data_pagamento,
    pg.status AS pagamento_status
   FROM ((((public.recibos r
     JOIN public.contratos c ON ((r.contrato_id = c.id)))
     JOIN public.contratantes ct ON ((r.contratante_id = ct.id)))
     JOIN public.pagamentos pg ON ((r.pagamento_id = pg.id)))
     JOIN public.planos p ON ((c.plano_id = p.id)))
  WHERE (r.ativo = true)
  ORDER BY r.criado_em DESC;


ALTER VIEW public.vw_recibos_completos OWNER TO neondb_owner;

--
-- Name: VIEW vw_recibos_completos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_recibos_completos IS 'View com informações completas de recibos incluindo dados de contrato, contratante, plano, pagamento e valor_parcela calculado quando necessário';


--
-- Name: vw_recibos_completos_mat; Type: MATERIALIZED VIEW; Schema: public; Owner: neondb_owner
--

CREATE MATERIALIZED VIEW public.vw_recibos_completos_mat AS
 SELECT id,
    numero_recibo,
    vigencia_inicio,
    vigencia_fim,
    numero_funcionarios_cobertos,
    valor_total_anual,
    valor_por_funcionario,
    forma_pagamento,
    numero_parcelas,
    valor_parcela,
    descricao_pagamento,
    criado_em,
    contrato_id,
    contrato_conteudo,
    contrato_data_aceite,
    contratante_nome,
    contratante_cnpj,
    contratante_email,
    contratante_tipo,
    plano_nome,
    plano_tipo,
    pagamento_metodo,
    data_pagamento,
    pagamento_status
   FROM public.vw_recibos_completos
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.vw_recibos_completos_mat OWNER TO neondb_owner;

--
-- Name: MATERIALIZED VIEW vw_recibos_completos_mat; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON MATERIALIZED VIEW public.vw_recibos_completos_mat IS 'Materialized view para consultas de recibos com cópia dos dados de vw_recibos_completos (incluir passo de refresh periódico)';


--
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);


--
-- Name: audit_access_denied id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_access_denied ALTER COLUMN id SET DEFAULT nextval('public.audit_access_denied_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: auditoria_geral id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_geral ALTER COLUMN id SET DEFAULT nextval('public.auditoria_geral_id_seq'::regclass);


--
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);


--
-- Name: auditoria_recibos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_recibos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_recibos_id_seq'::regclass);


--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: clinica_configuracoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinica_configuracoes ALTER COLUMN id SET DEFAULT nextval('public.clinica_configuracoes_id_seq'::regclass);


--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: contratacao_personalizada id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratacao_personalizada ALTER COLUMN id SET DEFAULT nextval('public.contratacao_personalizada_id_seq'::regclass);


--
-- Name: contratantes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes ALTER COLUMN id SET DEFAULT nextval('public.contratantes_id_seq'::regclass);


--
-- Name: contratantes_senhas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas ALTER COLUMN id SET DEFAULT nextval('public.contratantes_senhas_id_seq'::regclass);


--
-- Name: contratantes_senhas_audit audit_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas_audit ALTER COLUMN audit_id SET DEFAULT nextval('public.contratantes_senhas_audit_audit_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: contratos_planos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos_planos ALTER COLUMN id SET DEFAULT nextval('public.contratos_planos_id_seq'::regclass);


--
-- Name: emissao_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emissao_queue ALTER COLUMN id SET DEFAULT nextval('public.emissao_queue_id_seq'::regclass);


--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);


--
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: laudo_arquivos_remotos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_arquivos_remotos ALTER COLUMN id SET DEFAULT nextval('public.laudo_arquivos_remotos_id_seq'::regclass);


--
-- Name: laudo_downloads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_downloads ALTER COLUMN id SET DEFAULT nextval('public.laudo_downloads_id_seq'::regclass);


--
-- Name: laudo_generation_jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.laudo_generation_jobs_id_seq'::regclass);


--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);


--
-- Name: logs_admin id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.logs_admin ALTER COLUMN id SET DEFAULT nextval('public.logs_admin_id_seq'::regclass);


--
-- Name: lotes_avaliacao id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao ALTER COLUMN id SET DEFAULT nextval('public.lotes_avaliacao_id_seq'::regclass);


--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);


--
-- Name: migration_guidelines id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migration_guidelines ALTER COLUMN id SET DEFAULT nextval('public.migration_guidelines_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: notificacoes_admin id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);


--
-- Name: notificacoes_traducoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_traducoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_traducoes_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: payment_links id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_links ALTER COLUMN id SET DEFAULT nextval('public.payment_links_id_seq'::regclass);


--
-- Name: pdf_jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pdf_jobs ALTER COLUMN id SET DEFAULT nextval('public.pdf_jobs_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: planos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.planos ALTER COLUMN id SET DEFAULT nextval('public.planos_id_seq'::regclass);


--
-- Name: policy_expression_backups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.policy_expression_backups ALTER COLUMN id SET DEFAULT nextval('public.policy_expression_backups_id_seq'::regclass);


--
-- Name: questao_condicoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.questao_condicoes ALTER COLUMN id SET DEFAULT nextval('public.questao_condicoes_id_seq'::regclass);


--
-- Name: recibos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos ALTER COLUMN id SET DEFAULT nextval('public.recibos_id_seq'::regclass);


--
-- Name: relatorio_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relatorio_templates ALTER COLUMN id SET DEFAULT nextval('public.relatorio_templates_id_seq'::regclass);


--
-- Name: respostas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.respostas ALTER COLUMN id SET DEFAULT nextval('public.respostas_id_seq'::regclass);


--
-- Name: resultados id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resultados ALTER COLUMN id SET DEFAULT nextval('public.resultados_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: session_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_logs ALTER COLUMN id SET DEFAULT nextval('public.session_logs_id_seq'::regclass);


--
-- Name: templates_contrato id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.templates_contrato ALTER COLUMN id SET DEFAULT nextval('public.templates_contrato_id_seq'::regclass);


--
-- Name: tokens_retomada_pagamento id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento ALTER COLUMN id SET DEFAULT nextval('public.tokens_retomada_pagamento_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: backup_laudos_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_laudos_contratante_1 (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
1	1	00000000000	Laudo gerado automaticamente para lote finalizado	enviado	2026-01-29 02:40:56.797537	2026-01-29 02:42:26.224584	\N	2026-01-29 02:42:26.224584	\N	\N	\N	\N	\N	\N
4	4	00000000000	Laudo gerado automaticamente para lote concluido	enviado	2026-01-29 02:31:23.068827	2026-01-29 02:31:23.068827	\N	2026-01-29 02:31:23.068827	\N	\N	\N	\N	\N	\N
6	6	00000000000	Laudo gerado automaticamente	enviado	2026-01-29 02:51:12.518347	2026-01-29 02:52:37.439763	\N	2026-01-29 02:52:37.439763	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: backup_resultados_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_resultados_contratante_1 (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
121	3	1	Demandas no Trabalho	50.00	medio	2026-01-29 01:16:22.105403
122	3	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-01-29 01:16:22.364008
123	3	3	Relações Sociais e Liderança	50.00	medio	2026-01-29 01:16:22.595931
124	3	4	Interface Trabalho-Indivíduo	75.00	alto	2026-01-29 01:16:22.827626
125	3	5	Valores Organizacionais	33.33	medio	2026-01-29 01:16:23.059931
126	3	6	Traços de Personalidade	75.00	alto	2026-01-29 01:16:23.29317
127	3	7	Saúde e Bem-Estar	50.00	medio	2026-01-29 01:16:23.525585
128	3	8	Comportamentos Ofensivos	66.67	alto	2026-01-29 01:16:23.757703
129	3	9	Comportamento de Jogo	68.75	alto	2026-01-29 01:16:23.989867
130	3	10	Endividamento Financeiro	37.50	medio	2026-01-29 01:16:24.222314
131	7	1	Demandas no Trabalho	62.50	medio	2026-01-29 02:12:18.24932
132	7	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-01-29 02:12:18.307527
133	7	3	Relações Sociais e Liderança	54.17	medio	2026-01-29 02:12:18.32409
134	7	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-01-29 02:12:18.335323
135	7	5	Valores Organizacionais	66.67	alto	2026-01-29 02:12:18.347298
136	7	6	Traços de Personalidade	37.50	medio	2026-01-29 02:12:18.358332
137	7	7	Saúde e Bem-Estar	25.00	baixo	2026-01-29 02:12:18.369416
138	7	8	Comportamentos Ofensivos	58.33	medio	2026-01-29 02:12:18.381275
139	7	9	Comportamento de Jogo	68.75	alto	2026-01-29 02:12:18.392373
140	7	10	Endividamento Financeiro	37.50	medio	2026-01-29 02:12:18.403731
141	14	1	Demandas no Trabalho	75.00	alto	2026-01-29 02:52:06.152279
142	14	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-01-29 02:52:06.190539
143	14	3	Relações Sociais e Liderança	37.50	medio	2026-01-29 02:52:06.205255
144	14	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-01-29 02:52:06.219707
145	14	5	Valores Organizacionais	83.33	alto	2026-01-29 02:52:06.235908
146	14	6	Traços de Personalidade	37.50	medio	2026-01-29 02:52:06.249841
147	14	7	Saúde e Bem-Estar	41.67	medio	2026-01-29 02:52:06.263742
148	14	8	Comportamentos Ofensivos	75.00	alto	2026-01-29 02:52:06.277933
149	14	9	Comportamento de Jogo	31.25	baixo	2026-01-29 02:52:06.291804
150	14	10	Endividamento Financeiro	81.25	alto	2026-01-29 02:52:06.306519
\.


--
-- Data for Name: analise_estatistica; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analise_estatistica (id, avaliacao_id, grupo, score_original, score_ajustado, anomalia_detectada, tipo_anomalia, recomendacao, created_at) FROM stdin;
\.


--
-- Data for Name: audit_access_denied; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_access_denied (id, user_cpf, user_perfil, attempted_action, resource, resource_id, reason, query_text, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, ip_address, user_agent, details, created_at, contratante_id, clinica_id) FROM stdin;
1	00000000000	admin	UPDATE	contratacao_personalizada	1	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 50, "valor_por_funcionario": 20}	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 20/func, Total: R$ 1000	2026-02-02 21:36:56.781734	\N	\N
2	\N	\N	055_admin_empresas_fix	migrations	\N	\N	\N	\N	\N	Corrigido permissões admin para empresas_clientes - admin agora tem full access	2026-02-02 21:55:15.568034	\N	\N
3	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_view on table fila_emissao	2026-02-02 21:55:58.266037	\N	\N
4	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_system_insert on table audit_logs	2026-02-02 21:55:58.266037	\N	\N
5	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_select_policy on table avaliacao_resets	2026-02-02 21:55:58.266037	\N	\N
6	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_select on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
7	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_admin on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
8	00000000000	system	POLICY_UNEXPECTED	avaliacoes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_avaliacoes on table avaliacoes	2026-02-02 21:55:58.266037	\N	\N
9	00000000000	system	POLICY_UNEXPECTED	roles	\N	\N	\N	\N	\N	Unexpected policy: roles_admin_select on table roles	2026-02-02 21:55:58.266037	\N	\N
10	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_update on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
11	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_empresas on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
12	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_entidade_insert on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
13	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_update on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
14	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_delete on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
15	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_own on table notificacoes	2026-02-02 21:55:58.266037	\N	\N
16	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: admin_all_laudos on table laudos	2026-02-02 21:55:58.266037	\N	\N
17	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_delete on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
18	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_emissor on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
19	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_admin_view on table fila_emissao	2026-02-02 21:55:58.266037	\N	\N
20	00000000000	system	POLICY_UNEXPECTED	clinicas	\N	\N	\N	\N	\N	Unexpected policy: clinicas_rh_select on table clinicas	2026-02-02 21:55:58.266037	\N	\N
21	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_select_simple on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
22	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: admin_all_lotes on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
23	00000000000	system	POLICY_UNEXPECTED	permissions	\N	\N	\N	\N	\N	Unexpected policy: permissions_admin_select on table permissions	2026-02-02 21:55:58.266037	\N	\N
24	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_insert on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
25	00000000000	system	POLICY_UNEXPECTED	pagamentos	\N	\N	\N	\N	\N	Unexpected policy: pagamentos_responsavel_select on table pagamentos	2026-02-02 21:55:58.266037	\N	\N
26	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_update on table fila_emissao	2026-02-02 21:55:58.266037	\N	\N
27	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_update on table notificacoes	2026-02-02 21:55:58.266037	\N	\N
28	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_update on table notificacoes	2026-02-02 21:55:58.266037	\N	\N
29	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_own_select on table audit_logs	2026-02-02 21:55:58.266037	\N	\N
30	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_delete_policy on table avaliacao_resets	2026-02-02 21:55:58.266037	\N	\N
31	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_entidade_update on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
32	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_update_simple on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
33	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_entidade_select on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
34	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_delete on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
35	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: resultados_system_insert on table resultados	2026-02-02 21:55:58.266037	\N	\N
36	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_entidade on table laudos	2026-02-02 21:55:58.266037	\N	\N
37	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_insert_policy on table avaliacao_resets	2026-02-02 21:55:58.266037	\N	\N
38	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: admin_all_resultados on table resultados	2026-02-02 21:55:58.266037	\N	\N
39	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_update_policy on table avaliacao_resets	2026-02-02 21:55:58.266037	\N	\N
40	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: laudos_entidade_select on table laudos	2026-02-02 21:55:58.266037	\N	\N
41	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_rh_select on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
42	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: resultados_rh_select on table resultados	2026-02-02 21:55:58.266037	\N	\N
43	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_insert_simple on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
44	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_admin on table laudos	2026-02-02 21:55:58.266037	\N	\N
45	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_own on table notificacoes	2026-02-02 21:55:58.266037	\N	\N
46	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_delete_simple on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
47	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_select on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
48	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_emissor on table laudos	2026-02-02 21:55:58.266037	\N	\N
49	00000000000	system	POLICY_UNEXPECTED	role_permissions	\N	\N	\N	\N	\N	Unexpected policy: role_permissions_admin_select on table role_permissions	2026-02-02 21:55:58.266037	\N	\N
50	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_admin_all on table audit_logs	2026-02-02 21:55:58.266037	\N	\N
51	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_emissor_select on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
52	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_select on table funcionarios	2026-02-02 21:55:58.266037	\N	\N
53	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_rh_delete on table empresas_clientes	2026-02-02 21:55:58.266037	\N	\N
54	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_system_bypass on table fila_emissao	2026-02-02 21:55:58.266037	\N	\N
55	00000000000	system	POLICY_UNEXPECTED	respostas	\N	\N	\N	\N	\N	Unexpected policy: admin_all_respostas on table respostas	2026-02-02 21:55:58.266037	\N	\N
56	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_entidade on table lotes_avaliacao	2026-02-02 21:55:58.266037	\N	\N
59	\N	\N	INSERT	funcionarios	17	\N	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T00:27:49.422434", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 00:27:49.422434	\N	\N
60	\N	\N	INSERT	funcionarios	18	\N	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T00:27:50.453228", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 00:27:50.453228	\N	\N
106	\N	\N	INSERT	avaliacoes	7	\N	{"id": 7, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-03T12:46:37.623572", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:37.623572", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 12:46:37.623572	\N	\N
65	\N	\N	INSERT	lotes_avaliacao	3	\N	{"id": 3, "tipo": "completo", "codigo": "001-030226", "status": "ativo", "titulo": "Lote 1 - 001-030226", "criado_em": "2026-02-03T00:34:34.069447", "descricao": "Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-02-03T00:34:34.069447", "liberado_por": "87545772920", "numero_ordem": 1, "atualizado_em": "2026-02-03T00:34:34.069447", "finalizado_em": null, "contratante_id": 1, "modo_emergencia": false, "laudo_enviado_em": null, "motivo_emergencia": null}	\N	\N	Record created	2026-02-03 00:34:34.069447	\N	\N
66	\N	\N	INSERT	laudos	3	\N	{"id": 3, "status": "rascunho", "lote_id": 3, "hash_pdf": null, "criado_em": "2026-02-03T00:34:34.069447", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T00:34:34.069447", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 00:34:34.069447	\N	\N
67	\N	\N	laudo_criado	laudos	3	\N	{"status": "rascunho", "lote_id": 3, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 00:34:34.069447	\N	\N
68	\N	\N	INSERT	avaliacoes	1	\N	{"id": 1, "envio": null, "inicio": "2026-02-03T00:34:34.133", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.00866", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.00866", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 00:34:35.00866	\N	\N
69	\N	\N	INSERT	avaliacoes	2	\N	{"id": 2, "envio": null, "inicio": "2026-02-03T00:34:34.133", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.963148", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.963148", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 00:34:35.963148	\N	\N
70	87545772920	\N	liberar_lote	lotes_avaliacao	3	\N	\N	177.146.165.115	\N	{"contratante_id":1,"contratante_nome":"RELEGERE","tipo":"completo","titulo":"Lote 1 - 001-030226","descricao":null,"data_filtro":null,"codigo":"001-030226","numero_ordem":1,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-03 00:34:36.90116	\N	\N
71	\N	\N	INSERT	lotes_avaliacao	4	\N	{"id": 4, "tipo": "completo", "codigo": "002-030226", "status": "ativo", "titulo": "Lote 2 - 002-030226", "criado_em": "2026-02-03T01:48:59.773615", "descricao": "Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-02-03T01:48:59.773615", "liberado_por": "87545772920", "numero_ordem": 2, "atualizado_em": "2026-02-03T01:48:59.773615", "finalizado_em": null, "contratante_id": 1, "modo_emergencia": false, "laudo_enviado_em": null, "motivo_emergencia": null}	\N	\N	Record created	2026-02-03 01:48:59.773615	\N	\N
72	\N	\N	INSERT	laudos	4	\N	{"id": 4, "status": "rascunho", "lote_id": 4, "hash_pdf": null, "criado_em": "2026-02-03T01:48:59.773615", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T01:48:59.773615", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 01:48:59.773615	\N	\N
73	\N	\N	laudo_criado	laudos	4	\N	{"status": "rascunho", "lote_id": 4, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 01:48:59.773615	\N	\N
74	\N	\N	INSERT	avaliacoes	3	\N	{"id": 3, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:00.908694", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T01:49:00.908694", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 01:49:00.908694	\N	\N
75	\N	\N	INSERT	avaliacoes	4	\N	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T01:49:01.934635", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 01:49:01.934635	\N	\N
76	87545772920	\N	liberar_lote	lotes_avaliacao	4	\N	\N	177.146.165.115	\N	{"contratante_id":1,"contratante_nome":"RELEGERE","tipo":"completo","titulo":"Lote 2 - 002-030226","descricao":null,"data_filtro":null,"codigo":"002-030226","numero_ordem":2,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-03 01:49:02.948249	\N	\N
77	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-02-03T00:34:34.133", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.00866", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.00866", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 1, "envio": "2026-02-03T02:54:41.23253", "inicio": "2026-02-03T00:34:34.133", "status": "concluida", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.00866", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.00866", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 02:54:41.23253	\N	\N
78	\N	\N	UPDATE	funcionarios	18	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T00:27:50.453228", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.23253", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 1, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.23253"}	\N	\N	Record updated	2026-02-03 02:54:41.23253	\N	\N
79	\N	\N	UPDATE	funcionarios	18	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.23253", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 1, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.23253"}	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.23253", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 1, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.23253"}	\N	\N	Record updated	2026-02-03 02:54:41.23253	\N	\N
81	\N	\N	UPDATE	avaliacoes	3	{"id": 3, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:00.908694", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T01:49:00.908694", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 3, "envio": "2026-02-03T02:54:41.557322", "inicio": "2026-02-03T01:48:59.963", "status": "concluida", "lote_id": 4, "criado_em": "2026-02-03T01:49:00.908694", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T01:49:00.908694", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 02:54:41.557322	\N	\N
82	\N	\N	UPDATE	funcionarios	18	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.23253", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 1, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.23253"}	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.557322", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 3, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.557322"}	\N	\N	Record updated	2026-02-03 02:54:41.557322	\N	\N
83	\N	\N	UPDATE	funcionarios	18	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.557322", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 3, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.557322"}	{"id": 18, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:50.453228", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq", "incluido_em": "2026-02-03T00:27:50.453228", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:54:41.557322", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 2, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 3, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:54:41.557322"}	\N	\N	Record updated	2026-02-03 02:54:41.557322	\N	\N
128	\N	\N	INSERT	avaliacoes	12	\N	{"id": 12, "envio": null, "inicio": "2026-02-03T13:19:58.077", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-03T13:19:59.886053", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:19:59.886053", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:19:59.886053	\N	\N
84	\N	\N	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-02-03T00:34:34.133", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.963148", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.963148", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 2, "envio": "2026-02-03T02:55:23.250202", "inicio": "2026-02-03T00:34:34.133", "status": "concluida", "lote_id": 3, "criado_em": "2026-02-03T00:34:35.963148", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T00:34:35.963148", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 02:55:23.250202	\N	\N
85	\N	\N	UPDATE	funcionarios	17	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T00:27:49.422434", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:55:23.250202", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 2, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:55:23.250202"}	\N	\N	Record updated	2026-02-03 02:55:23.250202	\N	\N
86	\N	\N	UPDATE	funcionarios	17	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:55:23.250202", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 2, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:55:23.250202"}	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:55:23.250202", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 2, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:55:23.250202"}	\N	\N	Record updated	2026-02-03 02:55:23.250202	\N	\N
87	\N	\N	UPDATE	avaliacoes	4	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T01:49:01.934635", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:11:56.642072", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:11:56.642072	\N	\N
88	\N	\N	UPDATE	avaliacoes	4	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:11:56.642072", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:11:56.642072", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:12:42.053644	\N	\N
89	\N	\N	UPDATE	avaliacoes	4	{"id": 4, "envio": null, "inicio": "2026-02-03T01:48:59.963", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:11:56.642072", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 4, "envio": "2026-02-03T12:13:26.499065", "inicio": "2026-02-03T01:48:59.963", "status": "concluida", "lote_id": 4, "criado_em": "2026-02-03T01:49:01.934635", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:13:26.499065", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:13:26.499065	\N	\N
107	\N	\N	UPDATE	avaliacoes	6	{"id": 6, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-03T12:46:36.672952", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:36.672952", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	{"id": 6, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-02-03T12:46:36.672952", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:36.672952", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:47:35.79712	\N	\N
90	\N	\N	UPDATE	funcionarios	17	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T02:55:23.250202", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "001-030226", "ultima_avaliacao_id": 2, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T02:55:23.250202"}	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:13:26.499065", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 4, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:13:26.499065"}	\N	\N	Record updated	2026-02-03 12:13:26.499065	\N	\N
91	\N	\N	UPDATE	funcionarios	17	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:13:26.499065", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 1, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 4, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:13:26.499065"}	{"id": 17, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T00:27:49.422434", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq", "incluido_em": "2026-02-03T00:27:49.422434", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:13:26.499065", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-03T12:13:27.075029", "indice_avaliacao": 2, "ultimo_lote_codigo": "002-030226", "ultima_avaliacao_id": 4, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:13:26.499065"}	\N	\N	Record updated	2026-02-03 12:13:27.075029	\N	\N
92	\N	\N	INSERT	funcionarios	19	\N	{"id": 19, "cpf": "90867952008", "nome": "ronaldo dododo", "ativo": true, "email": "uoiuoi@hihi.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-03T12:31:01.675213", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu", "incluido_em": "2026-02-03T12:31:01.675213", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:31:01.675213", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1988-03-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 12:31:01.675213	\N	\N
93	\N	\N	INSERT	avaliacoes	5	\N	{"id": 5, "envio": null, "inicio": "2026-02-03T12:31:17.687", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-03T12:31:18.559289", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:31:18.559289", "funcionario_cpf": "90867952008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 12:31:18.559289	\N	\N
94	87545772920	\N	liberar_lote	lotes_avaliacao	5	\N	\N	177.146.165.115	\N	{"contratante_id":1,"contratante_nome":"RELEGERE","tipo":"completo","titulo":"Lote 3 - 003-030226","descricao":null,"data_filtro":null,"codigo":"003-030226","numero_ordem":3,"avaliacoes_criadas":1,"total_funcionarios":1}	2026-02-03 12:31:19.500627	\N	\N
95	\N	\N	UPDATE	avaliacoes	5	{"id": 5, "envio": null, "inicio": "2026-02-03T12:31:17.687", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-03T12:31:18.559289", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:31:18.559289", "funcionario_cpf": "90867952008", "motivo_inativacao": null}	{"id": 5, "envio": null, "inicio": "2026-02-03T12:31:17.687", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-02-03T12:31:18.559289", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:31:18.559289", "funcionario_cpf": "90867952008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:31:44.801487	\N	\N
96	\N	\N	UPDATE	avaliacoes	5	{"id": 5, "envio": null, "inicio": "2026-02-03T12:31:17.687", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-02-03T12:31:18.559289", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:31:18.559289", "funcionario_cpf": "90867952008", "motivo_inativacao": null}	{"id": 5, "envio": "2026-02-03T12:32:29.681589", "inicio": "2026-02-03T12:31:17.687", "status": "concluida", "lote_id": 5, "criado_em": "2026-02-03T12:31:18.559289", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:32:29.681589", "funcionario_cpf": "90867952008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:32:29.681589	\N	\N
108	\N	\N	UPDATE	avaliacoes	6	{"id": 6, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-02-03T12:46:36.672952", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:36.672952", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	{"id": 6, "envio": "2026-02-03T12:48:09.668236", "inicio": "2026-02-03T12:46:35.798", "status": "concluida", "lote_id": 6, "criado_em": "2026-02-03T12:46:36.672952", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:48:09.668236", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:48:09.668236	\N	\N
97	\N	\N	UPDATE	funcionarios	19	{"id": 19, "cpf": "90867952008", "nome": "ronaldo dododo", "ativo": true, "email": "uoiuoi@hihi.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-03T12:31:01.675213", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu", "incluido_em": "2026-02-03T12:31:01.675213", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:31:01.675213", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1988-03-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "90867952008", "nome": "ronaldo dododo", "ativo": true, "email": "uoiuoi@hihi.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-03T12:31:01.675213", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu", "incluido_em": "2026-02-03T12:31:01.675213", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:32:29.681589", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1988-03-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "003-030226", "ultima_avaliacao_id": 5, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:32:29.681589"}	\N	\N	Record updated	2026-02-03 12:32:29.681589	\N	\N
98	\N	\N	UPDATE	funcionarios	19	{"id": 19, "cpf": "90867952008", "nome": "ronaldo dododo", "ativo": true, "email": "uoiuoi@hihi.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-03T12:31:01.675213", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu", "incluido_em": "2026-02-03T12:31:01.675213", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:32:29.681589", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1988-03-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "003-030226", "ultima_avaliacao_id": 5, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:32:29.681589"}	{"id": 19, "cpf": "90867952008", "nome": "ronaldo dododo", "ativo": true, "email": "uoiuoi@hihi.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-03T12:31:01.675213", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu", "incluido_em": "2026-02-03T12:31:01.675213", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T12:32:29.681589", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "1988-03-01", "data_ultimo_lote": "2026-02-03T12:32:30.157949", "indice_avaliacao": 3, "ultimo_lote_codigo": "003-030226", "ultima_avaliacao_id": 5, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:32:29.681589"}	\N	\N	Record updated	2026-02-03 12:32:30.157949	\N	\N
99	00000000000	admin	UPDATE	contratacao_personalizada	2	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 31250, "numero_funcionarios": 250, "valor_por_funcionario": 125}	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 125/func, Total: R$ 31250	2026-02-03 12:44:04.550533	\N	\N
100	\N	\N	INSERT	empresas_clientes	1	\N	{"id": 1, "cep": "45678786", "cnpj": "46493500000103", "nome": "Empresa CM01", "ativa": true, "email": "dfdsf@ffass.com", "cidade": "uoiuouio", "estado": "UI", "endereco": "Rua jdfj lk2342", "telefone": "(64) 87897-9876", "criado_em": "2026-02-03T12:45:54.683638", "clinica_id": 1, "atualizado_em": "2026-02-03T12:45:54.683638", "responsavel_email": null, "representante_fone": "78464654656", "representante_nome": "dsjpjp pipoippi", "representante_email": "dfdfdf@dsgdsgs.com"}	\N	\N	Record created	2026-02-03 12:45:54.683638	\N	\N
101	\N	\N	INSERT	funcionarios	23	\N	{"id": 23, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.135053", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G", "incluido_em": "2026-02-03T12:46:22.135053", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:46:22.135053", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 12:46:22.135053	\N	\N
102	\N	\N	INSERT	funcionarios	24	\N	{"id": 24, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.9663", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u", "incluido_em": "2026-02-03T12:46:22.9663", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:46:22.9663", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 12:46:22.9663	\N	\N
103	\N	\N	INSERT	laudos	6	\N	{"id": 6, "status": "rascunho", "lote_id": 6, "hash_pdf": null, "criado_em": "2026-02-03T12:46:35.705728", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T12:46:35.705728", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 12:46:35.705728	\N	\N
104	\N	\N	laudo_criado	laudos	6	\N	{"status": "rascunho", "lote_id": 6, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 12:46:35.705728	\N	\N
105	\N	\N	INSERT	avaliacoes	6	\N	{"id": 6, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-03T12:46:36.672952", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:36.672952", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 12:46:36.672952	\N	\N
109	\N	\N	UPDATE	funcionarios	24	{"id": 24, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.9663", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u", "incluido_em": "2026-02-03T12:46:22.9663", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:46:22.9663", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 24, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.9663", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u", "incluido_em": "2026-02-03T12:46:22.9663", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:48:09.668236", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 6, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:48:09.668236"}	\N	\N	Record updated	2026-02-03 12:48:09.668236	\N	\N
110	\N	\N	UPDATE	funcionarios	24	{"id": 24, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.9663", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u", "incluido_em": "2026-02-03T12:46:22.9663", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:48:09.668236", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 6, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:48:09.668236"}	{"id": 24, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.9663", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u", "incluido_em": "2026-02-03T12:46:22.9663", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:48:09.668236", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-03T12:48:10.13935", "indice_avaliacao": 1, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 6, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:48:09.668236"}	\N	\N	Record updated	2026-02-03 12:48:10.13935	\N	\N
111	\N	\N	UPDATE	avaliacoes	7	{"id": 7, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-03T12:46:37.623572", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:37.623572", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	{"id": 7, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-02-03T12:46:37.623572", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:37.623572", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:48:43.500649	\N	\N
112	\N	\N	UPDATE	avaliacoes	7	{"id": 7, "envio": null, "inicio": "2026-02-03T12:46:35.798", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-02-03T12:46:37.623572", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:46:37.623572", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	{"id": 7, "envio": "2026-02-03T12:50:41.326184", "inicio": "2026-02-03T12:46:35.798", "status": "concluida", "lote_id": 6, "criado_em": "2026-02-03T12:46:37.623572", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T12:50:41.326184", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 12:50:41.326184	\N	\N
113	\N	\N	UPDATE	funcionarios	23	{"id": 23, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.135053", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G", "incluido_em": "2026-02-03T12:46:22.135053", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:46:22.135053", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 23, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.135053", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G", "incluido_em": "2026-02-03T12:46:22.135053", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:50:41.326184", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 7, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:50:41.326184"}	\N	\N	Record updated	2026-02-03 12:50:41.326184	\N	\N
126	\N	\N	laudo_criado	laudos	9	\N	{"status": "rascunho", "lote_id": 9, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 13:19:57.941205	\N	\N
127	\N	\N	INSERT	avaliacoes	11	\N	{"id": 11, "envio": null, "inicio": "2026-02-03T13:19:58.077", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-03T13:19:58.946781", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:19:58.946781", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:19:58.946781	\N	\N
114	\N	\N	UPDATE	funcionarios	23	{"id": 23, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.135053", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G", "incluido_em": "2026-02-03T12:46:22.135053", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:50:41.326184", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 7, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:50:41.326184"}	{"id": 23, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T12:46:22.135053", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G", "incluido_em": "2026-02-03T12:46:22.135053", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T12:50:41.326184", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-03T12:50:41.792344", "indice_avaliacao": 1, "ultimo_lote_codigo": "004-030226", "ultima_avaliacao_id": 7, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T12:50:41.326184"}	\N	\N	Record updated	2026-02-03 12:50:41.792344	\N	\N
115	\N	\N	INSERT	funcionarios	25	\N	{"id": 25, "cpf": "52821297017", "nome": "dfsiopi adpipoipo", "ativo": true, "email": "oiuoiu@uiuooiu.com", "setor": "uoiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoiu", "perfil": "funcionario", "criado_em": "2026-02-03T13:03:58.168595", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$PCXs6rTNkmAs7QKP/86XROJS2rnnc.Ma9guuHIYVl7KBomtA5RQ1m", "incluido_em": "2026-02-03T13:03:58.168595", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T13:03:58.168595", "data_admissao": null, "inativado_por": null, "contratante_id": 1, "data_nascimento": "2000-02-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 13:03:58.168595	\N	\N
116	\N	\N	INSERT	avaliacoes	8	\N	{"id": 8, "envio": null, "inicio": "2026-02-03T13:04:20.547", "status": "iniciada", "lote_id": 7, "criado_em": "2026-02-03T13:04:21.412592", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:04:21.412592", "funcionario_cpf": "52821297017", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:04:21.412592	\N	\N
117	87545772920	\N	liberar_lote	lotes_avaliacao	7	\N	\N	177.146.165.115	\N	{"contratante_id":1,"contratante_nome":"RELEGERE","tipo":"completo","titulo":"Lote 4 - 005-030226","descricao":null,"data_filtro":null,"codigo":"005-030226","numero_ordem":4,"avaliacoes_criadas":1,"total_funcionarios":1}	2026-02-03 13:04:22.361983	\N	\N
118	\N	\N	INSERT	empresas_clientes	2	\N	{"id": 2, "cep": "46578789", "cnpj": "82232812000127", "nome": "empresa cm 02", "ativa": true, "email": "dffdsfds@dfsdsf.com", "cidade": "uouioui", "estado": "PU", "endereco": "rua ldjfaslk oio 8809", "telefone": "(67) 89454-6546", "criado_em": "2026-02-03T13:05:32.722329", "clinica_id": 1, "atualizado_em": "2026-02-03T13:05:32.722329", "responsavel_email": null, "representante_fone": "79465432455", "representante_nome": "cleid dpaupoip", "representante_email": "dffddf@dffdfds.com"}	\N	\N	Record created	2026-02-03 13:05:32.722329	\N	\N
119	\N	\N	INSERT	funcionarios	26	\N	{"id": 26, "cpf": "47097293012", "nome": "João da Cpuves", "ativo": true, "email": "joao.24@empa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T13:05:56.499273", "matricula": null, "clinica_id": 1, "empresa_id": 2, "senha_hash": "$2a$10$cOs/I8QhDOWnl4QB5Bu/jOubYVBoEcR0Z63NtaV2f.5/a.ohWG8d2", "incluido_em": "2026-02-03T13:05:56.499273", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T13:05:56.499273", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 13:05:56.499273	\N	\N
120	\N	\N	INSERT	funcionarios	27	\N	{"id": 27, "cpf": "16985430007", "nome": "Mariana Maria", "ativo": true, "email": "rolnk123132l@jijij.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T13:05:57.327759", "matricula": null, "clinica_id": 1, "empresa_id": 2, "senha_hash": "$2a$10$xz2b0qOa4fISFBN1wvLwwOJVTqzFWzwV6UBCzLV14hI1gCRU4s5JK", "incluido_em": "2026-02-03T13:05:57.327759", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T13:05:57.327759", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 13:05:57.327759	\N	\N
121	\N	\N	INSERT	laudos	8	\N	{"id": 8, "status": "rascunho", "lote_id": 8, "hash_pdf": null, "criado_em": "2026-02-03T13:06:10.778477", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T13:06:10.778477", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 13:06:10.778477	\N	\N
122	\N	\N	laudo_criado	laudos	8	\N	{"status": "rascunho", "lote_id": 8, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 13:06:10.778477	\N	\N
123	\N	\N	INSERT	avaliacoes	9	\N	{"id": 9, "envio": null, "inicio": "2026-02-03T13:06:10.877", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-03T13:06:11.761882", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:06:11.761882", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:06:11.761882	\N	\N
124	\N	\N	INSERT	avaliacoes	10	\N	{"id": 10, "envio": null, "inicio": "2026-02-03T13:06:10.877", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-03T13:06:12.705121", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:06:12.705121", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:06:12.705121	\N	\N
125	\N	\N	INSERT	laudos	9	\N	{"id": 9, "status": "rascunho", "lote_id": 9, "hash_pdf": null, "criado_em": "2026-02-03T13:19:57.941205", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T13:19:57.941205", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 13:19:57.941205	\N	\N
129	\N	\N	INSERT	funcionarios	28	\N	{"id": 28, "cpf": "37845006092", "nome": "joa do suco", "ativo": true, "email": "ipopioio@ipipo.com", "setor": "iopipo", "turno": null, "escala": null, "funcao": "poiipo", "perfil": "funcionario", "criado_em": "2026-02-03T13:37:01.86638", "matricula": null, "clinica_id": 1, "empresa_id": 1, "senha_hash": "$2a$10$OH2J9OlXrhBIzgrix.Af3eFhiN4Wtrx8zKTU5PK8bAoUHAIyp8uNa", "incluido_em": "2026-02-03T13:37:01.86638", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-03T13:37:01.86638", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": "1966-02-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 13:37:01.86638	\N	\N
130	\N	\N	INSERT	laudos	10	\N	{"id": 10, "status": "rascunho", "lote_id": 10, "hash_pdf": null, "criado_em": "2026-02-03T13:37:18.014664", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-03T13:37:18.014664", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 13:37:18.014664	\N	\N
131	\N	\N	laudo_criado	laudos	10	\N	{"status": "rascunho", "lote_id": 10, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 13:37:18.014664	\N	\N
132	\N	\N	INSERT	avaliacoes	13	\N	{"id": 13, "envio": null, "inicio": "2026-02-03T13:37:18.101", "status": "iniciada", "lote_id": 10, "criado_em": "2026-02-03T13:37:18.978955", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T13:37:18.978955", "funcionario_cpf": "37845006092", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 13:37:18.978955	\N	\N
133	\N	\N	INSERT	funcionarios	29	\N	{"id": 29, "cpf": "53051173991", "nome": "Emissor Teste QWork", "ativo": true, "email": "emissor@qwork.com.br", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-02-03T15:09:53.311683", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$ez.cvULSRPa0CE3QugnWQeMFL2qMy9OF.lz2EW/s.cJ0Hv.2LGr7G", "incluido_em": "2026-02-03T15:09:53.311683", "nivel_cargo": null, "inativado_em": null, "usuario_tipo": "emissor", "atualizado_em": "2026-02-03T15:09:53.311683", "data_admissao": null, "inativado_por": null, "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 15:09:53.311683	\N	\N
134	00000000000	admin	UPDATE	contratacao_personalizada	3	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1350, "numero_funcionarios": 100, "valor_por_funcionario": 13.5}	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 13.5/func, Total: R$ 1350	2026-02-03 17:32:04.924237	\N	\N
135	\N	\N	INSERT	funcionarios	33	\N	{"id": 33, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:29.450464", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.", "incluido_em": "2026-02-03T17:36:29.450464", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:36:29.450464", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 17:36:29.450464	\N	\N
136	\N	\N	INSERT	funcionarios	34	\N	{"id": 34, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:30.548672", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq", "incluido_em": "2026-02-03T17:36:30.548672", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:36:30.548672", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 17:36:30.548672	\N	\N
137	\N	\N	INSERT	avaliacoes	14	\N	{"id": 14, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-03T17:37:22.973854", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:22.973854", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 17:37:22.973854	\N	\N
138	\N	\N	INSERT	avaliacoes	15	\N	{"id": 15, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-03T17:37:23.926551", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:23.926551", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	\N	\N	Record created	2026-02-03 17:37:23.926551	\N	\N
139	08453792917	\N	liberar_lote	lotes_avaliacao	11	\N	\N	201.1.72.76	\N	{"contratante_id":3,"contratante_nome":"Staneley company ","tipo":"completo","titulo":"Lote 5 - 009-030226","descricao":null,"data_filtro":null,"codigo":"009-030226","numero_ordem":5,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-03 17:37:24.853297	\N	\N
140	\N	\N	UPDATE	avaliacoes	15	{"id": 15, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-03T17:37:23.926551", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:23.926551", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	{"id": 15, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-02-03T17:37:23.926551", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:23.926551", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 17:40:17.327697	\N	\N
141	\N	\N	UPDATE	avaliacoes	14	{"id": 14, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-03T17:37:22.973854", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:22.973854", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	{"id": 14, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-02-03T17:37:22.973854", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:22.973854", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 17:40:25.119655	\N	\N
142	\N	\N	UPDATE	avaliacoes	15	{"id": 15, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-02-03T17:37:23.926551", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:23.926551", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	{"id": 15, "envio": "2026-02-03T17:40:52.968392", "inicio": "2026-02-03T17:37:22.103", "status": "concluida", "lote_id": 11, "criado_em": "2026-02-03T17:37:23.926551", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:40:52.968392", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 17:40:52.968392	\N	\N
143	\N	\N	UPDATE	funcionarios	34	{"id": 34, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:30.548672", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq", "incluido_em": "2026-02-03T17:36:30.548672", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:36:30.548672", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 34, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:30.548672", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq", "incluido_em": "2026-02-03T17:36:30.548672", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:40:52.968392", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 15, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:40:52.968392"}	\N	\N	Record updated	2026-02-03 17:40:52.968392	\N	\N
144	\N	\N	UPDATE	funcionarios	34	{"id": 34, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:30.548672", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq", "incluido_em": "2026-02-03T17:36:30.548672", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:40:52.968392", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 15, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:40:52.968392"}	{"id": 34, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:30.548672", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq", "incluido_em": "2026-02-03T17:36:30.548672", "nivel_cargo": "gestao", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:40:52.968392", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-03T17:40:53.451452", "indice_avaliacao": 5, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 15, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:40:52.968392"}	\N	\N	Record updated	2026-02-03 17:40:53.451452	\N	\N
145	\N	\N	UPDATE	avaliacoes	14	{"id": 14, "envio": null, "inicio": "2026-02-03T17:37:22.103", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-02-03T17:37:22.973854", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:37:22.973854", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	{"id": 14, "envio": "2026-02-03T17:41:34.774696", "inicio": "2026-02-03T17:37:22.103", "status": "concluida", "lote_id": 11, "criado_em": "2026-02-03T17:37:22.973854", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-03T17:41:34.774696", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 17:41:34.774696	\N	\N
146	\N	\N	UPDATE	funcionarios	33	{"id": 33, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:29.450464", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.", "incluido_em": "2026-02-03T17:36:29.450464", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:36:29.450464", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 33, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:29.450464", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.", "incluido_em": "2026-02-03T17:36:29.450464", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:41:34.774696", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 14, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:41:34.774696"}	\N	\N	Record updated	2026-02-03 17:41:34.774696	\N	\N
147	\N	\N	UPDATE	funcionarios	33	{"id": 33, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:29.450464", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.", "incluido_em": "2026-02-03T17:36:29.450464", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:41:34.774696", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 14, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:41:34.774696"}	{"id": 33, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-03T17:36:29.450464", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.", "incluido_em": "2026-02-03T17:36:29.450464", "nivel_cargo": "operacional", "inativado_em": null, "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-03T17:41:34.774696", "data_admissao": null, "inativado_por": null, "contratante_id": 3, "data_nascimento": "2010-12-12", "data_ultimo_lote": "2026-02-03T17:41:35.261523", "indice_avaliacao": 5, "ultimo_lote_codigo": "009-030226", "ultima_avaliacao_id": 14, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-03T17:41:34.774696"}	\N	\N	Record updated	2026-02-03 17:41:35.261523	\N	\N
148	53051173991	emissor	INSERT	laudos	11	\N	{"id": 11, "status": "emitido", "lote_id": 11, "hash_pdf": "f22fa1021dcf819feb5ab8a9b9357daa6f26c79e80234897e77d9e96436f5321", "criado_em": "2026-02-03T17:48:30.403256", "emitido_em": "2026-02-03T17:48:30.403256", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-03T17:48:30.403256", "relatorio_lote": null, "relatorio_setor": null, "hash_relatorio_lote": null, "hash_relatorio_setor": null, "relatorio_individual": null, "hash_relatorio_individual": null}	\N	\N	Record created	2026-02-03 17:48:30.403256	\N	\N
149	\N	\N	laudo_criado	laudos	11	\N	{"status": "emitido", "lote_id": 11, "tamanho_pdf": null}	\N	\N	\N	2026-02-03 17:48:30.403256	\N	\N
150	00000000000	admin	UPDATE	contratacao_personalizada	4	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 2250, "numero_funcionarios": 150, "valor_por_funcionario": 15}	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 15/func, Total: R$ 2250	2026-02-03 18:01:28.855231	\N	\N
151	\N	\N	INSERT	empresas_clientes	3	\N	{"id": 3, "cep": "81110-070", "cnpj": "03790617000146", "nome": "XUZ", "ativa": true, "email": "XUZ@gmail.com", "cidade": "Curitiba", "estado": null, "endereco": "Rua Francisco Raitani, 10, 6482", "telefone": "(10) 10101-0100", "criado_em": "2026-02-03T18:03:47.929798", "clinica_id": 2, "atualizado_em": "2026-02-03T18:03:47.929798", "responsavel_email": null, "representante_fone": "41988138181", "representante_nome": "empresa 1", "representante_email": "chimarraobrasileiro@gmail.com"}	\N	\N	Record created	2026-02-03 18:03:47.929798	\N	\N
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria (id, entidade_tipo, entidade_id, acao, status_anterior, status_novo, usuario_cpf, usuario_perfil, ip_address, user_agent, dados_alterados, metadados, hash_operacao, criado_em) FROM stdin;
1	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	fa5578e4b00bc7559eabafbf1c9c3da7533e67094db68e72f3d653a2af36eca4	2026-02-02 21:37:57.711706
2	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	a75274531436b6828b600968d3cc216236110b892be73a9941593fd59ddcff68	2026-02-02 23:53:57.499583
3	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	177ec8a4ef7d3ce699d85e47e7eb29ac9b3a443d62355cfa2a2f3dc286471ac6	2026-02-03 02:46:28.357939
4	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	1ba12ee8937e7012ec837149c752254ae2059d813227e99df672e1fbf1b7d7c9	2026-02-03 12:07:27.797376
5	login	2	login_sucesso	\N	\N	04703084945	rh	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 1, "tipo_contratante": "clinica"}	ce516d68eb31606082168ae2605233403d4c551d33af2ef1ef152e86d9371478	2026-02-03 12:44:59.410402
6	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	5eaf355dcf4696e76c3b2350ff9bdb9c15781656e0842929d2b01668d37e4416	2026-02-03 13:02:53.111923
7	login	2	login_sucesso	\N	\N	04703084945	rh	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 1, "tipo_contratante": "clinica"}	655862cf5e32784ececfd82b2768a78a337de0fdeeaa21119834d2118e7cf571	2026-02-03 13:04:33.384735
8	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	ac5ac300a7902bb24b377aa9046e1eef3b9e29d911e5ec2b5b0a9e6b7500523e	2026-02-03 15:54:05.025194
9	login	3	login_sucesso	\N	\N	08453792917	gestor_entidade	201.1.72.76	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	88c901c5d2f040d91c8832d09acbb0e0952aa13e9fc37ab45a872de5687f814f	2026-02-03 17:34:28.045325
10	login	3	login_sucesso	\N	\N	08453792917	gestor_entidade	201.1.72.76	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	e1105b9a89dbd6ca1d364e2ddbb460863b5756bf64729b7bd5a8d6fb5985ef2c	2026-02-03 17:42:30.621553
11	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	fb780141797c31bcedf5308e17bf54e97f966a778b6675bed3fde2823ad94a09	2026-02-03 17:48:46.378055
12	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	4cbf5cd0612f013c3cad575f795528a9abb5c355e1949f5f6649e9ef52157826	2026-02-03 17:50:19.610723
13	login	4	login_sucesso	\N	\N	66500469062	rh	201.1.72.76	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	5de0447415b24cf7f48c4f9d895584644d87808bd23fa0ad67f62a50f4846f1c	2026-02-03 18:02:43.593159
14	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	177.146.165.115	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	2907a556a387e164e461953d4c787a5fde36e888c72f171a85a77178def21813	2026-02-03 18:15:03.977148
15	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	39bce0bf72b4a4e0436c445eee07ff9a8f7a5438edf7ea99ba7c3e3828a32613	2026-02-03 18:55:24.040782
16	login	2	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 1, "tipo_contratante": "clinica"}	2ca090d2660abb4b6e27343e2671d1e4ddf4927fc93632508f63c3694f7081ba	2026-02-03 19:09:24.648807
17	login	2	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 1, "tipo_contratante": "clinica"}	7a616f3c00060e8b9a58ecff15d47370a5d117a01a6045b95e55d669686eef92	2026-02-03 19:27:39.228134
18	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	160556619a05c35ce80e7efe9b0899c429a8b05963f38be6c2d444ca9e4c230a	2026-02-03 22:07:05.082341
19	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	c999338435a8013e29f660d696a3b91477f3eba99cdcefc9006c63cbe814ec0c	2026-02-03 22:15:57.807141
20	login	2	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 1, "tipo_contratante": "clinica"}	959f56a3cc0322a8c877a2c19e3e8aff0d69a95ef9699a8143ce3ed94dd8e712	2026-02-03 22:18:55.728678
\.


--
-- Data for Name: auditoria_geral; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_geral (id, tabela_afetada, acao, cpf_responsavel, dados_anteriores, dados_novos, criado_em) FROM stdin;
1	notificacoes	migration_025_tipo_laudo	\N	\N	{"descricao": "Migração de laudo_emitido para laudo_enviado", "data_migracao": "2026-02-02T21:55:00.70695+00:00", "total_atualizadas": 0}	2026-02-02 21:55:00.70695
\.


--
-- Data for Name: auditoria_laudos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_laudos (id, lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, observacoes, criado_em) FROM stdin;
1	3	\N	87545772920	Ronaldo Fjkljlk	solicitacao_manual	pendente	177.146.165.115	Solicitação manual de emissão por gestor_entidade - Lote 001-030226	2026-02-03 16:55:40.976521
2	11	\N	08453792917	jaime tavares	solicitacao_manual	pendente	201.1.72.76	Solicitação manual de emissão por gestor_entidade - Lote 009-030226	2026-02-03 17:43:59.813909
\.


--
-- Data for Name: auditoria_recibos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_recibos (id, recibo_id, acao, status, ip_address, observacoes, criado_em) FROM stdin;
\.


--
-- Data for Name: avaliacao_resets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.avaliacao_resets (id, avaliacao_id, lote_id, requested_by_user_id, requested_by_role, reason, respostas_count, created_at) FROM stdin;
e46836e1-ae18-4958-ba9b-d67460eba86f	4	4	1	gestor_entidade	ddddgsdsggssdg	28	2026-02-03 12:11:57.200459+00
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.avaliacoes (id, funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id, inativada_em, motivo_inativacao, concluida_em) FROM stdin;
1	49510559024	2026-02-03 00:34:34.133	2026-02-03 02:54:41.23253	concluida	1	2026-02-03 00:34:35.00866	2026-02-03 00:34:35.00866	3	\N	\N	\N
3	49510559024	2026-02-03 01:48:59.963	2026-02-03 02:54:41.557322	concluida	1	2026-02-03 01:49:00.908694	2026-02-03 01:49:00.908694	4	\N	\N	\N
2	67136101026	2026-02-03 00:34:34.133	2026-02-03 02:55:23.250202	concluida	1	2026-02-03 00:34:35.963148	2026-02-03 00:34:35.963148	3	\N	\N	\N
4	67136101026	2026-02-03 01:48:59.963	2026-02-03 12:13:26.499065	concluida	1	2026-02-03 01:49:01.934635	2026-02-03 12:13:26.499065	4	\N	\N	\N
5	90867952008	2026-02-03 12:31:17.687	2026-02-03 12:32:29.681589	concluida	1	2026-02-03 12:31:18.559289	2026-02-03 12:32:29.681589	5	\N	\N	\N
6	06021796020	2026-02-03 12:46:35.798	2026-02-03 12:48:09.668236	concluida	1	2026-02-03 12:46:36.672952	2026-02-03 12:48:09.668236	6	\N	\N	\N
7	48090382037	2026-02-03 12:46:35.798	2026-02-03 12:50:41.326184	concluida	1	2026-02-03 12:46:37.623572	2026-02-03 12:50:41.326184	6	\N	\N	\N
8	52821297017	2026-02-03 13:04:20.547	\N	iniciada	1	2026-02-03 13:04:21.412592	2026-02-03 13:04:21.412592	7	\N	\N	\N
9	47097293012	2026-02-03 13:06:10.877	\N	iniciada	1	2026-02-03 13:06:11.761882	2026-02-03 13:06:11.761882	8	\N	\N	\N
10	16985430007	2026-02-03 13:06:10.877	\N	iniciada	1	2026-02-03 13:06:12.705121	2026-02-03 13:06:12.705121	8	\N	\N	\N
11	47097293012	2026-02-03 13:19:58.077	\N	iniciada	1	2026-02-03 13:19:58.946781	2026-02-03 13:19:58.946781	9	\N	\N	\N
12	16985430007	2026-02-03 13:19:58.077	\N	iniciada	1	2026-02-03 13:19:59.886053	2026-02-03 13:19:59.886053	9	\N	\N	\N
13	37845006092	2026-02-03 13:37:18.101	\N	iniciada	1	2026-02-03 13:37:18.978955	2026-02-03 13:37:18.978955	10	\N	\N	\N
15	01617198056	2026-02-03 17:37:22.103	2026-02-03 17:40:52.968392	concluida	1	2026-02-03 17:37:23.926551	2026-02-03 17:40:52.968392	11	\N	\N	\N
14	59127761070	2026-02-03 17:37:22.103	2026-02-03 17:41:34.774696	concluida	1	2026-02-03 17:37:22.973854	2026-02-03 17:41:34.774696	11	\N	\N	\N
\.


--
-- Data for Name: backup_lotes_migracao_20260130; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.backup_lotes_migracao_20260130 (id, codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, contratante_id, auto_emitir_em, auto_emitir_agendado, hash_pdf, numero_ordem, emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento, modo_emergencia, motivo_emergencia, processamento_em) FROM stdin;
\.


--
-- Data for Name: clinica_configuracoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinica_configuracoes (id, clinica_id, campos_customizados, logo_url, cor_primaria, cor_secundaria, template_relatorio_id, incluir_logo_relatorios, formato_data_preferencial, criado_em, atualizado_em, atualizado_por_cpf) FROM stdin;
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas (id, nome, cnpj, email, telefone, endereco, ativa, criado_em, atualizado_em, razao_social, inscricao_estadual, cidade, estado, idioma_preferencial, contratante_id, nome_fantasia) FROM stdin;
1	RLJ COMERCIAL EXPORTADORA	09110380000191	rlhajdjad@hiu.com	(53) 45456-4642	Rua Antônio Bianchetti, 90	t	2026-02-03 12:44:43.411813	2026-02-03 12:44:43.411813	\N	\N	\N	\N	pt_BR	2	\N
2	bis	59881318000171	help@betteruseblockchain.com	(41) 98813-8181	Francisco Raitani	t	2026-02-03 18:02:07.748076	2026-02-03 18:02:07.748076	\N	\N	\N	\N	pt_BR	4	\N
\.


--
-- Data for Name: clinicas_empresas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas_empresas (clinica_id, empresa_id, criado_em) FROM stdin;
\.


--
-- Data for Name: contratacao_personalizada; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratacao_personalizada (id, contratante_id, numero_funcionarios_estimado, valor_por_funcionario, valor_total_estimado, payment_link_expiracao, link_enviado_em, status, criado_em, atualizado_em, payment_link_token) FROM stdin;
1	2	250	125.00	31250.00	2026-02-05 12:44:03.656	2026-02-03 12:44:03.714857	valor_aceito_pelo_contratante	2026-02-03 12:34:59.318579	2026-02-03 12:44:28.607499	2636fc5ce6988ce64a8248f2d81e799a3373f90b3e6507e12794327c531fa871
2	3	100	13.50	1350.00	2026-02-05 17:32:04.019	2026-02-03 17:32:04.078268	valor_aceito_pelo_contratante	2026-02-03 17:30:48.379813	2026-02-03 17:33:21.909362	1333e73f2c751cb1cc1f8a702cffedabaec6f63a3d367008d4e95cfb202be954
3	4	150	15.00	2250.00	2026-02-05 18:01:27.948	2026-02-03 18:01:28.009602	valor_aceito_pelo_contratante	2026-02-03 18:00:54.048018	2026-02-03 18:01:47.954533	6eaea06267f6d3e1b136bb8836e73152c5fb17b7c8dd7e58e13b889bb98fed49
\.


--
-- Data for Name: contratantes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratantes (id, tipo, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login, contrato_aceito) FROM stdin;
1	entidade	RELEGERE	02494916000170	\N	rlrlg!lrlrgr@comcczxv.com	(41) 56465-4653	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Ronaldo Fjkljlk	87545772920	\N	ronaldofilardo@yahoo.com.br	(41) 56498-3124	\N	\N	\N	aprovado	\N	\N	t	2026-02-02 21:36:25.435864	2026-02-02 21:37:47.784211	2026-02-02 21:37:45.499784	00000000000	t	50	1	\N	2026-02-02 21:37:45.499784	f
2	clinica	RLJ COMERCIAL EXPORTADORA	09110380000191	\N	rlhajdjad@hiu.com	(53) 45456-4642	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Tani aKa	04703084945	\N	rewewr@sdsd.com	(54) 66543-1555	\N	\N	\N	aprovado	\N	\N	t	2026-02-03 12:34:58.547964	2026-02-03 12:44:47.127734	2026-02-03 12:44:44.595814	00000000000	t	250	1	\N	2026-02-03 12:44:44.595814	f
3	entidade	Staneley company 	74819457000169	\N	jaime.tavares.dias@gmail.com	(41) 98813-8181	Francisco Raitani	Curitiba	PR	81110-070	jaime tavares	08453792917	\N	jaime.tavares.dias@gmail.com	(41) 99999-5699	\N	\N	\N	aprovado	\N	\N	t	2026-02-03 17:30:47.597086	2026-02-03 17:34:03.482272	2026-02-03 17:34:01.162806	00000000000	t	100	1	\N	2026-02-03 17:34:01.162806	f
4	clinica	bis	59881318000171	\N	help@betteruseblockchain.com	(41) 98813-8181	Francisco Raitani	Curitiba	PR	81110-070	joao	66500469062	\N	help@betteruseblockchain.com	(41) 99999-5699	\N	\N	\N	aprovado	\N	\N	t	2026-02-03 18:00:53.218927	2026-02-03 18:02:11.603986	2026-02-03 18:02:08.981944	00000000000	t	100	1	\N	2026-02-03 18:02:08.981944	f
\.


--
-- Data for Name: contratantes_senhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratantes_senhas (id, contratante_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em) FROM stdin;
1	1	87545772920	$2a$10$hYgSn9lSh8dfqtQVXexnjeiElpLobW03mi8X3RwgaSLjMPwZzot16	f	2026-02-02 21:37:43.760845	2026-02-02 21:55:54.049139	2026-02-02 21:37:43.760845+00	2026-02-02 21:37:46.288813+00
5	2	04703084945	$2a$10$zQ1F24nYuUpR9pgSw.EY0.5lFpAPBCDVRuceHnWNscZ/6FtI/1jBa	f	2026-02-03 12:44:42.322921	2026-02-03 12:44:45.386677	2026-02-03 12:44:42.322921+00	2026-02-03 12:44:45.386677+00
6	3	08453792917	$2a$10$HEQ2d/VxouiVggJvD3YRSOn87kMEnykeqh5mQNt8f9MMUe4kuAXR2	f	2026-02-03 17:33:59.339311	2026-02-03 17:34:01.971504	2026-02-03 17:33:59.339311+00	2026-02-03 17:34:01.971504+00
7	4	66500469062	$2a$10$5JQo9iOkSolmk5djx.9VrehKKa9n9Oku7v7aE9zf6xFyAzyYUzjRa	f	2026-02-03 18:02:06.612884	2026-02-03 18:02:09.805916	2026-02-03 18:02:06.612884+00	2026-02-03 18:02:09.805916+00
\.


--
-- Data for Name: contratantes_senhas_audit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratantes_senhas_audit (audit_id, operacao, contratante_id, cpf, senha_hash_anterior, senha_hash_nova, executado_por, executado_em, ip_origem, motivo) FROM stdin;
1	INSERT	1	87545772920	\N	$2a$10$cn/aem5fEgJKyFjQJn6TFOn5zirRu8vxkyGD31QwTvwqjnuL89qYK	neondb_owner	2026-02-02 21:55:39.893882	\N	Nova senha criada
4	UPDATE	1	87545772920	$2a$10$hYgSn9lSh8dfqtQVXexnjeiElpLobW03mi8X3RwgaSLjMPwZzot16	$2a$10$hYgSn9lSh8dfqtQVXexnjeiElpLobW03mi8X3RwgaSLjMPwZzot16	neondb_owner	2026-02-02 21:55:54.049139	\N	Dados atualizados
5	INSERT	2	04703084945	\N	$2a$10$xAiOX4r64JgQ4.xlBYKjr.wZjnrxSZZh7vNjXXjv.OgkDg/DfCMci	neondb_owner	2026-02-03 12:44:42.322921	\N	Nova senha criada
6	UPDATE	2	04703084945	$2a$10$xAiOX4r64JgQ4.xlBYKjr.wZjnrxSZZh7vNjXXjv.OgkDg/DfCMci	$2a$10$zQ1F24nYuUpR9pgSw.EY0.5lFpAPBCDVRuceHnWNscZ/6FtI/1jBa	neondb_owner	2026-02-03 12:44:45.386677	\N	Senha alterada
7	INSERT	3	08453792917	\N	$2a$10$HhyO3x5Wx0qTQMTkIYEfAeWGXMeJSviy667GGVaZwhQ2yGGm51crG	neondb_owner	2026-02-03 17:33:59.339311	\N	Nova senha criada
8	UPDATE	3	08453792917	$2a$10$HhyO3x5Wx0qTQMTkIYEfAeWGXMeJSviy667GGVaZwhQ2yGGm51crG	$2a$10$HEQ2d/VxouiVggJvD3YRSOn87kMEnykeqh5mQNt8f9MMUe4kuAXR2	neondb_owner	2026-02-03 17:34:01.971504	\N	Senha alterada
9	INSERT	4	66500469062	\N	$2a$10$V2pBGUV8d4Z7pkXMjWfkQuzS85vZy8q.dGxkuE4dKn4E8A/btgBva	neondb_owner	2026-02-03 18:02:06.612884	\N	Nova senha criada
10	UPDATE	4	66500469062	$2a$10$V2pBGUV8d4Z7pkXMjWfkQuzS85vZy8q.dGxkuE4dKn4E8A/btgBva	$2a$10$5JQo9iOkSolmk5djx.9VrehKKa9n9Oku7v7aE9zf6xFyAzyYUzjRa	neondb_owner	2026-02-03 18:02:09.805916	\N	Senha alterada
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos (id, contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, valor_personalizado, payment_link_expiracao, link_enviado_em, data_pagamento, criado_por_cpf, payment_link_token) FROM stdin;
1	1	1	50	1000.00	aguardando_pagamento	f	f	\N	2026-02-02 21:36:56.070503	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	1	1	50	1000.00	pendente	t	f	\N	2026-02-02 21:37:22.578733	\N	\N	177.146.165.115	2026-02-02 21:37:29.496373	\N	\N	\N	\N	\N	\N	\N	\N
3	2	1	250	31250.00	aguardando_pagamento	f	f	\N	2026-02-03 12:44:03.832786	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	2	1	250	31250.00	pendente	t	f	\N	2026-02-03 12:44:28.841979	\N	\N	177.146.165.115	2026-02-03 12:44:35.382714	\N	\N	\N	\N	\N	\N	\N	\N
5	3	1	100	1350.00	aguardando_pagamento	f	f	\N	2026-02-03 17:32:04.19654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	3	1	100	1350.00	pendente	t	f	\N	2026-02-03 17:33:22.149113	\N	\N	177.146.165.115	2026-02-03 17:33:39.001663	\N	\N	\N	\N	\N	\N	\N	\N
7	4	1	150	2250.00	aguardando_pagamento	f	f	\N	2026-02-03 18:01:28.129843	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	4	1	150	2250.00	pendente	t	f	\N	2026-02-03 18:01:48.192327	\N	\N	177.146.165.115	2026-02-03 18:01:59.511041	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: contratos_planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos_planos (id, plano_id, clinica_id, contratante_id, tipo_contratante, valor_personalizado_por_funcionario, inicio_vigencia, fim_vigencia, ativo, created_at, updated_at, valor_pago, tipo_pagamento, modalidade_pagamento, data_pagamento, parcelas_json) FROM stdin;
\.


--
-- Data for Name: emissao_queue; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.emissao_queue (id, lote_id, tentativas, ultimo_erro, proxima_execucao, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: empresas_clientes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.empresas_clientes (id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, representante_nome, representante_fone, representante_email, responsavel_email) FROM stdin;
1	Empresa CM01	46493500000103	dfdsf@ffass.com	(64) 87897-9876	Rua jdfj lk2342	uoiuouio	UI	45678786	t	1	2026-02-03 12:45:54.683638	2026-02-03 12:45:54.683638	dsjpjp pipoippi	78464654656	dfdfdf@dsgdsgs.com	\N
2	empresa cm 02	82232812000127	dffdsfds@dfsdsf.com	(67) 89454-6546	rua ldjfaslk oio 8809	uouioui	PU	46578789	t	1	2026-02-03 13:05:32.722329	2026-02-03 13:05:32.722329	cleid dpaupoip	79465432455	dffddf@dffdfds.com	\N
3	XUZ	03790617000146	XUZ@gmail.com	(10) 10101-0100	Rua Francisco Raitani, 10, 6482	Curitiba	\N	81110-070	t	2	2026-02-03 18:03:47.929798	2026-02-03 18:03:47.929798	empresa 1	41988138181	chimarraobrasileiro@gmail.com	\N
\.


--
-- Data for Name: fila_emissao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fila_emissao (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em, solicitado_por, solicitado_em, tipo_solicitante) FROM stdin;
1	3	0	3	2026-02-03 16:55:41.249185	\N	2026-02-03 16:55:41.249185	2026-02-03 16:55:41.249185	87545772920	2026-02-03 16:55:41.249185	gestor_entidade
2	11	0	3	2026-02-03 17:44:00.065878	\N	2026-02-03 17:44:00.065878	2026-02-03 17:44:00.065878	08453792917	2026-02-03 17:44:00.065878	gestor_entidade
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios (id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, clinica_id, empresa_id, matricula, turno, escala, nivel_cargo, data_nascimento, incluido_em, inativado_em, inativado_por, data_admissao, ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, indice_avaliacao, data_ultimo_lote, contratante_id, usuario_tipo) FROM stdin;
13	00000000000	Admin Sistema	\N	\N	admin@qwork.com	$2a$10$Jw7ZrRCFDkjXrfM2/U86ZeHFL6dCksUqRAxBfcL1hOKYV1e//Jz4W	admin	t	2026-02-02 19:27:25.561299	2026-02-02 19:27:31.077604	\N	\N	\N	\N	\N	\N	\N	2026-02-02 21:54:39.157392	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	funcionario_entidade
18	49510559024	DIMore Itali	Operacional	estagio	m8094322439.santos@empresa.com.br	$2a$10$n3upVrPn7zI3gLgU65ka3ObnS0rFbjPY.mhV4m6R0Vkt6vTvTyctq	funcionario	t	2026-02-03 00:27:50.453228	2026-02-03 02:54:41.557322	\N	\N	\N	\N	\N	gestao	2011-02-02	2026-02-03 00:27:50.453228	\N	\N	\N	3	2026-02-03 02:54:41.557322	concluida	\N	2	\N	1	funcionario_entidade
17	67136101026	Jose do UP01	Administrativo	Analista	jose.silfs553va@empresa.com.br	$2a$10$YR/Ge6fcR7k/PTMFZGtcseRBq9G4N.DWYXXJmBkIfODDU4WWSJdjq	funcionario	t	2026-02-03 00:27:49.422434	2026-02-03 12:13:26.499065	\N	\N	\N	\N	\N	operacional	1985-04-15	2026-02-03 00:27:49.422434	\N	\N	\N	4	2026-02-03 12:13:26.499065	concluida	\N	2	2026-02-03 12:13:27.075029	1	funcionario_entidade
19	90867952008	ronaldo dododo	uoiuoi	uoiuoi	uoiuoi@hihi.com	$2a$10$vKjnYkVFm7coX7C2y0.3XOW0oyjiV7Rw24fZJ4YJ6anVCnBI0K6Xu	funcionario	t	2026-02-03 12:31:01.675213	2026-02-03 12:32:29.681589	\N	\N	\N	\N	\N	operacional	1988-03-01	2026-02-03 12:31:01.675213	\N	\N	\N	5	2026-02-03 12:32:29.681589	concluida	\N	3	2026-02-03 12:32:30.157949	1	funcionario_entidade
24	06021796020	DIMore Itali Emp02 online	Operacional	estagio	r123132erweantos@empresa.com	$2a$10$L5ZlUdXb0jhl.Lnam20biOuonPAkn7UlOmQttnPuNrFwUS86Yo92u	funcionario	t	2026-02-03 12:46:22.9663	2026-02-03 12:48:09.668236	1	1	\N	\N	\N	gestao	2011-02-02	2026-02-03 12:46:22.9663	\N	\N	\N	6	2026-02-03 12:48:09.668236	concluida	\N	1	2026-02-03 12:48:10.13935	\N	funcionario_clinica
23	48090382037	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.co	$2a$10$th1p0Xqs47Sd0P/yvjP5feZlfMW1EvDJKvKAlVK.lq7TxbJvJ9m1G	funcionario	t	2026-02-03 12:46:22.135053	2026-02-03 12:50:41.326184	1	1	\N	\N	\N	operacional	1985-04-15	2026-02-03 12:46:22.135053	\N	\N	\N	7	2026-02-03 12:50:41.326184	concluida	\N	1	2026-02-03 12:50:41.792344	\N	funcionario_clinica
25	52821297017	dfsiopi adpipoipo	uoiuoiu	oiuoiuoiu	oiuoiu@uiuooiu.com	$2a$10$PCXs6rTNkmAs7QKP/86XROJS2rnnc.Ma9guuHIYVl7KBomtA5RQ1m	funcionario	t	2026-02-03 13:03:58.168595	2026-02-03 13:03:58.168595	\N	\N	\N	\N	\N	operacional	2000-02-01	2026-02-03 13:03:58.168595	\N	\N	\N	\N	\N	\N	\N	0	\N	1	funcionario_entidade
26	47097293012	João da Cpuves	Administrativo	Analista	joao.24@empa.com.br	$2a$10$cOs/I8QhDOWnl4QB5Bu/jOubYVBoEcR0Z63NtaV2f.5/a.ohWG8d2	funcionario	t	2026-02-03 13:05:56.499273	2026-02-03 13:05:56.499273	1	2	\N	\N	\N	operacional	2010-12-12	2026-02-03 13:05:56.499273	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	funcionario_clinica
27	16985430007	Mariana Maria	Operacional	Coordenadora	rolnk123132l@jijij.com	$2a$10$xz2b0qOa4fISFBN1wvLwwOJVTqzFWzwV6UBCzLV14hI1gCRU4s5JK	funcionario	t	2026-02-03 13:05:57.327759	2026-02-03 13:05:57.327759	1	2	\N	\N	\N	gestao	1974-10-24	2026-02-03 13:05:57.327759	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	funcionario_clinica
28	37845006092	joa do suco	iopipo	poiipo	ipopioio@ipipo.com	$2a$10$OH2J9OlXrhBIzgrix.Af3eFhiN4Wtrx8zKTU5PK8bAoUHAIyp8uNa	funcionario	t	2026-02-03 13:37:01.86638	2026-02-03 13:37:01.86638	1	1	\N	\N	\N	gestao	1966-02-01	2026-02-03 13:37:01.86638	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	funcionario_clinica
29	53051173991	Emissor Teste QWork	\N	\N	emissor@qwork.com.br	$2a$10$ez.cvULSRPa0CE3QugnWQeMFL2qMy9OF.lz2EW/s.cJ0Hv.2LGr7G	emissor	t	2026-02-03 15:09:53.311683	2026-02-03 15:09:53.311683	\N	\N	\N	\N	\N	\N	\N	2026-02-03 15:09:53.311683	\N	\N	\N	\N	\N	\N	\N	0	\N	\N	emissor
34	01617198056	Jaiminho uoiuoiu	Operacional	Coordenadora	rolnk123132l@huhuhuj.com	$2a$10$b4NAqYhigjSU6qgsQV1gDuG1nnczw4N1hFFY5QxxLXt4p9Z7f0GTq	funcionario	t	2026-02-03 17:36:30.548672	2026-02-03 17:40:52.968392	\N	\N	\N	\N	\N	gestao	1974-10-24	2026-02-03 17:36:30.548672	\N	\N	\N	15	2026-02-03 17:40:52.968392	concluida	\N	5	2026-02-03 17:40:53.451452	3	funcionario_entidade
33	59127761070	Jaiemx o1	Administrativo	Analista	joao.24@empalux.com.br	$2a$10$5MnxF0O64hhDKqA3j.rpeOCcGTTRoksEY860vwqqkjBg1qnfH6uH.	funcionario	t	2026-02-03 17:36:29.450464	2026-02-03 17:41:34.774696	\N	\N	\N	\N	\N	operacional	2010-12-12	2026-02-03 17:36:29.450464	\N	\N	\N	14	2026-02-03 17:41:34.774696	concluida	\N	5	2026-02-03 17:41:35.261523	3	funcionario_entidade
\.


--
-- Data for Name: laudo_arquivos_remotos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_arquivos_remotos (id, laudo_id, provider, bucket, key, url, checksum, size_bytes, tipo, criado_por, criado_em) FROM stdin;
\.


--
-- Data for Name: laudo_downloads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_downloads (id, laudo_id, arquivo_remoto_id, usuario_cpf, ip, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: laudo_generation_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_generation_jobs (id, lote_id, laudo_id, status, attempts, max_attempts, last_error, payload, created_at, updated_at, processed_at, finished_at) FROM stdin;
\.


--
-- Data for Name: laudos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, relatorio_individual, relatorio_lote, relatorio_setor, hash_relatorio_individual, hash_relatorio_lote, hash_relatorio_setor, hash_pdf) FROM stdin;
3	3	\N	\N	rascunho	2026-02-03 00:34:34.069447	\N	\N	2026-02-03 00:34:34.069447	\N	\N	\N	\N	\N	\N	\N
4	4	\N	\N	rascunho	2026-02-03 01:48:59.773615	\N	\N	2026-02-03 01:48:59.773615	\N	\N	\N	\N	\N	\N	\N
6	6	\N	\N	rascunho	2026-02-03 12:46:35.705728	\N	\N	2026-02-03 12:46:35.705728	\N	\N	\N	\N	\N	\N	\N
8	8	\N	\N	rascunho	2026-02-03 13:06:10.778477	\N	\N	2026-02-03 13:06:10.778477	\N	\N	\N	\N	\N	\N	\N
9	9	\N	\N	rascunho	2026-02-03 13:19:57.941205	\N	\N	2026-02-03 13:19:57.941205	\N	\N	\N	\N	\N	\N	\N
10	10	\N	\N	rascunho	2026-02-03 13:37:18.014664	\N	\N	2026-02-03 13:37:18.014664	\N	\N	\N	\N	\N	\N	\N
11	11	53051173991	\N	emitido	2026-02-03 17:48:30.403256	2026-02-03 17:48:30.403256	\N	2026-02-03 17:48:30.403256	\N	\N	\N	\N	\N	\N	f22fa1021dcf819feb5ab8a9b9357daa6f26c79e80234897e77d9e96436f5321
\.


--
-- Data for Name: logs_admin; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.logs_admin (id, admin_cpf, acao, entidade_tipo, entidade_id, detalhes, ip_origem, criado_em) FROM stdin;
\.


--
-- Data for Name: lote_id_allocator; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lote_id_allocator (last_id) FROM stdin;
0
\.


--
-- Data for Name: lotes_avaliacao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lotes_avaliacao (id, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, laudo_enviado_em, finalizado_em, numero_ordem, contratante_id, modo_emergencia, motivo_emergencia, emitido_em, enviado_em, hash_pdf, setor_id, processamento_em) FROM stdin;
3	\N	\N	Lote 1 - 001-030226	Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-03 00:34:34.069447	2026-02-03 00:34:34.069447	2026-02-03 02:55:23.250202	\N	\N	1	1	f	\N	\N	\N	\N	\N	\N
4	\N	\N	Lote 2 - 002-030226	Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-03 01:48:59.773615	2026-02-03 01:48:59.773615	2026-02-03 12:13:26.499065	\N	\N	2	1	f	\N	\N	\N	\N	\N	\N
5	\N	\N	Lote 3 - 003-030226	Lote 3 liberado para RELEGERE. Inclui 1 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-03 12:31:17.621704	2026-02-03 12:31:17.621704	2026-02-03 12:32:29.681589	\N	\N	3	1	f	\N	\N	\N	\N	\N	\N
6	1	1	Lote 1 - 004-030226	Lote 1 liberado para Empresa CM01. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-02-03 12:46:34.745225	2026-02-03 12:46:34.745225	2026-02-03 12:50:41.326184	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N
7	\N	\N	Lote 4 - 005-030226	Lote 4 liberado para RELEGERE. Inclui 1 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	87545772920	2026-02-03 13:04:20.446494	2026-02-03 13:04:20.446494	2026-02-03 13:04:20.446494	\N	\N	4	1	f	\N	\N	\N	\N	\N	\N
8	1	2	Lote 1 - 006-030226	Lote 1 liberado para empresa cm 02. Inclui 2 funcionário(s) elegíveis.	completo	ativo	04703084945	2026-02-03 13:06:09.834137	2026-02-03 13:06:09.834137	2026-02-03 13:06:09.834137	\N	\N	1	\N	f	\N	\N	\N	\N	\N	\N
9	1	2	Lote 2 - 007-030226	Lote 2 liberado para empresa cm 02. Inclui 2 funcionário(s) elegíveis.	completo	ativo	04703084945	2026-02-03 13:19:56.981956	2026-02-03 13:19:56.981956	2026-02-03 13:19:56.981956	\N	\N	2	\N	f	\N	\N	\N	\N	\N	\N
10	1	1	Lote 2 - 008-030226	Lote 2 liberado para Empresa CM01. Inclui 1 funcionário(s) elegíveis.	completo	ativo	04703084945	2026-02-03 13:37:17.056032	2026-02-03 13:37:17.056032	2026-02-03 13:37:17.056032	\N	\N	2	\N	f	\N	\N	\N	\N	\N	\N
11	\N	\N	Lote 5 - 009-030226	Lote 5 liberado para Staneley company . Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	08453792917	2026-02-03 17:37:21.99167	2026-02-03 17:37:21.99167	2026-02-03 17:48:30.403256	\N	\N	5	3	f	\N	2026-02-03 17:48:30.403256+00	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mfa_codes (id, cpf, code, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: migration_guidelines; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.migration_guidelines (id, category, guideline, example, created_at) FROM stdin;
1	RLS_POLICY	Always match policy name with table name	-- WRONG:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON funcionarios;\n\n-- CORRECT:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;	2026-02-02 21:55:58.266037
2	RLS_POLICY	Use safe_drop_policy() function in migrations	-- SAFE (validates before dropping):\nSELECT safe_drop_policy('avaliacoes_own_select', 'avaliacoes');\n\n-- This will fail if policy name does not match table:\nSELECT safe_drop_policy('avaliacoes_own_select', 'funcionarios');\n-- ERROR: Policy name does not match table	2026-02-02 21:55:58.266037
3	RLS_POLICY	Policy naming convention: <table>_<perfil>_<action>	avaliacoes_own_select    -- funcionario SELECT on avaliacoes\navaliacoes_rh_clinica    -- RH SELECT on avaliacoes\nlotes_emissor_select     -- emissor SELECT on lotes_avaliacao\nempresas_block_admin     -- RESTRICTIVE blocking admin	2026-02-02 21:55:58.266037
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes (id, tipo, prioridade, destinatario_cpf, destinatario_tipo, titulo, mensagem, dados_contexto, link_acao, botao_texto, lida, data_leitura, arquivada, contratacao_personalizada_id, criado_em, expira_em, resolvida, data_resolucao, resolvido_por_cpf) FROM stdin;
1	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 001-030226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 3, "lote_codigo": "001-030226"}	\N	\N	f	\N	f	\N	2026-02-03 16:55:41.751046	\N	f	\N	\N
2	emissao_solicitada_sucesso	media	08453792917	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 009-030226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 11, "lote_codigo": "009-030226"}	\N	\N	f	\N	f	\N	2026-02-03 17:44:00.565166	\N	f	\N	\N
\.


--
-- Data for Name: notificacoes_admin; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_admin (id, tipo, mensagem, lote_id, visualizada, criado_em, titulo, contratante_id, contrato_id, pagamento_id, dados_contexto, lida, resolvida, data_leitura, data_resolucao, resolvido_por_cpf, observacoes_resolucao, atualizado_em) FROM stdin;
\.


--
-- Data for Name: notificacoes_traducoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) FROM stdin;
1	pre_cadastro_criado_titulo	pt_BR	Novo Pre-Cadastro: {{contratante_nome}}	titulo	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
2	pre_cadastro_criado_mensagem	pt_BR	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: {{numero_funcionarios}}.	mensagem	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
3	pre_cadastro_criado_botao	pt_BR	Definir Valor	botao	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
4	pre_cadastro_criado_titulo	en_US	New Pre-Registration: {{contratante_nome}}	titulo	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
5	pre_cadastro_criado_mensagem	en_US	A new personalized plan pre-registration has been created and awaits value definition. Estimated employees: {{numero_funcionarios}}.	mensagem	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
6	pre_cadastro_criado_botao	en_US	Set Value	botao	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
7	pre_cadastro_criado_titulo	es_ES	Nuevo Pre-Registro: {{contratante_nome}}	titulo	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
8	pre_cadastro_criado_mensagem	es_ES	Se ha creado un nuevo pre-registro de plan personalizado y espera definicion de valor. Empleados estimados: {{numero_funcionarios}}.	mensagem	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
9	pre_cadastro_criado_botao	es_ES	Definir Valor	botao	2026-02-02 21:55:00.368258	2026-02-02 21:55:00.368258
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pagamentos (id, contratante_id, valor, metodo, status, plataforma_id, plataforma_nome, dados_adicionais, data_pagamento, data_confirmacao, comprovante_path, observacoes, criado_em, atualizado_em, numero_parcelas, recibo_url, recibo_numero, detalhes_parcelas, numero_funcionarios, valor_por_funcionario, contrato_id, idempotency_key, external_transaction_id, provider_event_id) FROM stdin;
1	1	1000.00	boleto	pago	\N	simulador	\N	2026-02-02 21:37:40.089974	\N	\N	\N	2026-02-02 21:37:39.212776	2026-02-02 21:37:39.212776	4	\N	\N	[{"pago": true, "valor": 250, "numero": 1, "status": "pago", "data_pagamento": "2026-02-02T21:37:40.381Z", "data_vencimento": "2026-02-02"}, {"pago": false, "valor": 250, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-02"}, {"pago": false, "valor": 250, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-02"}, {"pago": false, "valor": 250, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-05-02"}]	\N	\N	2	\N	\N	\N
2	2	31250.00	pix	pago	\N	simulador	\N	2026-02-03 12:44:41.061166	\N	\N	\N	2026-02-03 12:44:40.160141	2026-02-03 12:44:40.160141	1	\N	\N	\N	\N	\N	4	\N	\N	\N
3	3	1350.00	pix	pago	\N	simulador	\N	2026-02-03 17:33:58.047441	\N	\N	\N	2026-02-03 17:33:57.139715	2026-02-03 17:33:57.139715	1	\N	\N	\N	\N	\N	6	\N	\N	\N
4	4	2250.00	boleto	pago	\N	simulador	\N	2026-02-03 18:02:05.299601	\N	\N	\N	2026-02-03 18:02:04.596872	2026-02-03 18:02:04.596872	1	\N	\N	\N	\N	\N	8	\N	\N	\N
\.


--
-- Data for Name: payment_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_links (id, token, contrato_id, criado_por_cpf, usado, usado_em, expiracao, criado_em) FROM stdin;
\.


--
-- Data for Name: pdf_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pdf_jobs (id, recibo_id, status, attempts, max_attempts, error_message, created_at, updated_at, processed_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
1	manage:rh	rh	manage	Gerenciar cadastro de usuários RH	2026-02-02 21:54:57.525744
2	manage:clinicas	clinicas	manage	Gerenciar cadastro de clínicas	2026-02-02 21:54:57.525744
3	manage:admins	admins	manage	Gerenciar cadastro de outros administradores	2026-02-02 21:54:57.525744
4	read:avaliacoes:entidade	avaliacoes	read	Ler avaliacoes de funcionarios da entidade	2026-02-02 21:55:55.100973
5	read:funcionarios:entidade	funcionarios	read	Ler funcionarios da entidade	2026-02-02 21:55:55.100973
6	write:funcionarios:entidade	funcionarios	write	Criar/editar funcionarios da entidade	2026-02-02 21:55:55.100973
7	read:lotes:entidade	lotes	read	Ler lotes de avaliacao da entidade	2026-02-02 21:55:55.100973
8	write:lotes:entidade	lotes	write	Criar/editar lotes de avaliacao da entidade	2026-02-02 21:55:55.100973
9	read:laudos:entidade	laudos	read	Visualizar laudos de funcionarios da entidade	2026-02-02 21:55:55.100973
10	read:contratante:own	contratantes	read	Ler dados da propria entidade	2026-02-02 21:55:55.100973
11	write:contratante:own	contratantes	write	Editar dados da propria entidade	2026-02-02 21:55:55.100973
14	read:laudos	laudos	read	Permissão para visualizar laudos	2026-02-03 15:09:53.311683
15	write:laudos	laudos	write	Permissão para criar e atualizar laudos	2026-02-03 15:09:53.311683
16	read:lotes:clinica	lotes	read	Permissão para visualizar lotes finalizados de todas as clínicas	2026-02-03 15:09:53.311683
\.


--
-- Data for Name: planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.planos (id, tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, created_at, updated_at, caracteristicas) FROM stdin;
1	personalizado	Personalizado	Atende a todos os interessados nos nossos serviços	\N	\N	\N	t	2026-01-31 20:10:43.938649	2026-01-31 20:10:43.938649	["Setup incluído.","Sem limite de uso."]
\.


--
-- Data for Name: policy_expression_backups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.policy_expression_backups (id, schema_name, table_name, policy_name, using_expr, with_check_expr, created_at) FROM stdin;
\.


--
-- Data for Name: questao_condicoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.questao_condicoes (id, questao_id, questao_dependente, operador, valor_condicao, categoria, ativo, created_at) FROM stdin;
\.


--
-- Data for Name: recibos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recibos (id, contrato_id, pagamento_id, contratante_id, numero_recibo, vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento, numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, conteudo_pdf_path, conteudo_texto, emitido_por_cpf, ativo, criado_em, atualizado_em, pdf, hash_pdf, ip_emissao, emitido_por, hash_incluso, backup_path, parcela_numero, clinica_id) FROM stdin;
\.


--
-- Data for Name: relatorio_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relatorio_templates (id, nome, tipo, descricao, campos_incluidos, filtros_padrao, formato_saida, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: respostas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.respostas (id, avaliacao_id, grupo, item, valor, criado_em, questao) FROM stdin;
1	1	1	Q1	25	2026-02-03 00:46:06.591516	1
2	1	1	Q2	50	2026-02-03 00:46:07.322304	2
3	1	1	Q3	75	2026-02-03 00:46:13.583913	3
4	1	1	Q9	100	2026-02-03 00:46:15.221667	9
5	1	2	Q13	0	2026-02-03 00:46:16.307649	13
6	1	2	Q17	25	2026-02-03 00:46:17.373052	17
7	1	2	Q18	50	2026-02-03 00:46:18.483965	18
8	1	2	Q19	75	2026-02-03 00:46:19.31323	19
9	1	3	Q20	100	2026-02-03 00:46:20.098122	20
10	1	3	Q21	75	2026-02-03 00:46:20.80337	21
11	1	3	Q23	50	2026-02-03 00:46:21.712383	23
12	1	3	Q25	75	2026-02-03 00:46:22.460718	25
13	1	3	Q26	50	2026-02-03 00:46:23.900326	26
14	1	3	Q28	50	2026-02-03 00:46:24.592187	28
15	1	4	Q31	25	2026-02-03 00:46:25.30583	31
16	1	4	Q32	50	2026-02-03 00:46:26.060375	32
17	1	4	Q33	0	2026-02-03 00:46:27.34854	33
18	1	4	Q34	25	2026-02-03 00:46:28.148056	34
19	1	5	Q35	100	2026-02-03 00:46:29.69051	35
20	1	5	Q38	75	2026-02-03 00:46:30.850968	38
21	1	5	Q41	25	2026-02-03 00:46:32.053792	41
22	1	6	Q43	75	2026-02-03 00:46:32.823302	43
23	1	6	Q45	25	2026-02-03 00:46:34.419315	45
24	1	7	Q48	25	2026-02-03 00:46:36.043235	48
25	1	7	Q52	50	2026-02-03 00:46:36.961294	52
26	1	7	Q55	75	2026-02-03 00:46:37.670442	55
27	1	8	Q56	100	2026-02-03 00:46:38.393211	56
28	1	8	Q57	75	2026-02-03 00:46:39.169255	57
29	1	8	Q58	100	2026-02-03 00:46:39.871904	58
30	1	9	Q59	50	2026-02-03 00:46:41.202137	59
31	1	9	Q61	25	2026-02-03 00:46:42.151718	61
32	1	9	Q62	0	2026-02-03 00:46:43.310564	62
33	1	9	Q64	25	2026-02-03 00:46:44.130904	64
34	1	10	Q65	100	2026-02-03 00:46:45.802299	65
35	1	10	Q66	75	2026-02-03 00:46:46.688463	66
36	1	10	Q68	100	2026-02-03 00:46:47.521773	68
37	1	10	Q70	50	2026-02-03 00:46:48.531944	70
38	2	1	Q1	50	2026-02-03 01:34:18.932312	1
39	2	1	Q2	100	2026-02-03 01:34:19.936999	2
40	2	1	Q3	50	2026-02-03 01:34:21.180115	3
41	2	1	Q9	50	2026-02-03 01:34:22.406354	9
42	2	2	Q13	100	2026-02-03 01:34:23.622112	13
43	2	2	Q17	0	2026-02-03 01:34:24.347225	17
44	2	2	Q18	0	2026-02-03 01:34:25.60082	18
45	2	2	Q19	50	2026-02-03 01:34:26.958565	19
46	2	3	Q20	100	2026-02-03 01:34:28.093911	20
47	2	3	Q21	75	2026-02-03 01:34:29.164137	21
48	2	3	Q23	0	2026-02-03 01:34:30.315329	23
49	2	3	Q25	25	2026-02-03 01:34:30.997752	25
50	2	3	Q26	75	2026-02-03 01:34:32.105275	26
51	2	3	Q28	50	2026-02-03 01:34:33.444306	28
52	2	4	Q31	25	2026-02-03 01:34:34.159498	31
53	2	4	Q32	0	2026-02-03 01:34:34.869783	32
54	2	4	Q33	50	2026-02-03 01:34:35.57524	33
55	2	4	Q34	75	2026-02-03 01:34:36.708827	34
56	2	5	Q35	75	2026-02-03 01:34:37.911824	35
57	2	5	Q38	50	2026-02-03 01:34:38.966222	38
58	2	5	Q41	50	2026-02-03 01:34:40.096261	41
59	2	6	Q43	100	2026-02-03 01:34:41.146801	43
60	2	6	Q45	0	2026-02-03 01:34:42.022883	45
61	2	7	Q48	50	2026-02-03 01:34:43.134138	48
62	2	7	Q52	100	2026-02-03 01:34:44.42736	52
63	2	7	Q55	50	2026-02-03 01:34:45.48581	55
64	2	8	Q56	25	2026-02-03 01:34:46.576364	56
65	2	8	Q57	75	2026-02-03 01:34:47.533576	57
66	2	8	Q58	100	2026-02-03 01:34:48.536285	58
67	2	9	Q59	50	2026-02-03 01:34:49.574664	59
68	2	9	Q61	50	2026-02-03 01:34:50.827729	61
69	2	9	Q62	50	2026-02-03 01:34:51.71093	62
70	2	9	Q64	100	2026-02-03 01:34:52.648504	64
71	2	10	Q65	50	2026-02-03 01:34:53.571096	65
72	2	10	Q66	25	2026-02-03 01:34:54.654185	66
73	2	10	Q68	0	2026-02-03 01:34:55.677943	68
74	2	10	Q70	75	2026-02-03 01:34:56.687803	70
76	3	1	Q1	50	2026-02-03 01:50:05.346448	1
77	3	1	Q2	100	2026-02-03 01:50:06.698864	2
78	3	1	Q3	50	2026-02-03 01:50:07.650944	3
79	3	1	Q9	50	2026-02-03 01:50:08.696745	9
80	3	2	Q13	25	2026-02-03 01:50:09.81042	13
81	3	2	Q17	25	2026-02-03 01:50:10.780486	17
82	3	2	Q18	0	2026-02-03 01:50:11.446143	18
83	3	2	Q19	50	2026-02-03 01:50:12.735575	19
84	3	3	Q20	100	2026-02-03 01:50:13.865973	20
85	3	3	Q21	100	2026-02-03 01:50:14.98586	21
86	3	3	Q23	75	2026-02-03 01:50:15.68774	23
87	3	3	Q25	75	2026-02-03 01:50:16.770476	25
88	3	3	Q26	100	2026-02-03 01:50:17.46622	26
89	3	3	Q28	75	2026-02-03 01:50:19.535268	28
90	3	4	Q31	75	2026-02-03 01:50:20.932883	31
91	3	4	Q32	50	2026-02-03 01:50:21.584283	32
92	3	4	Q33	0	2026-02-03 01:50:22.975881	33
93	3	4	Q34	25	2026-02-03 01:50:23.821637	34
94	3	5	Q35	75	2026-02-03 01:50:24.992903	35
95	3	5	Q38	100	2026-02-03 01:50:25.737482	38
96	3	5	Q41	100	2026-02-03 01:50:26.576425	41
97	3	6	Q43	0	2026-02-03 01:50:28.659179	43
98	3	6	Q45	50	2026-02-03 01:50:29.74496	45
99	3	7	Q48	75	2026-02-03 01:50:30.429061	48
100	3	7	Q52	50	2026-02-03 01:50:31.298844	52
101	3	7	Q55	75	2026-02-03 01:50:32.685557	55
102	3	8	Q56	100	2026-02-03 01:50:33.353618	56
103	3	8	Q57	75	2026-02-03 01:50:34.099727	57
104	3	8	Q58	75	2026-02-03 01:50:35.237175	58
105	3	9	Q59	25	2026-02-03 01:50:36.399094	59
106	3	9	Q61	75	2026-02-03 01:50:37.706196	61
107	3	9	Q62	50	2026-02-03 01:50:38.630347	62
108	3	9	Q64	50	2026-02-03 01:50:39.869485	64
109	3	10	Q65	0	2026-02-03 01:50:40.947352	65
110	3	10	Q66	0	2026-02-03 01:50:42.554026	66
111	3	10	Q68	25	2026-02-03 01:50:43.307368	68
112	3	10	Q70	75	2026-02-03 01:50:44.293268	70
142	4	1	Q1	75	2026-02-03 12:12:42.650054	1
143	4	1	Q2	75	2026-02-03 12:12:43.728527	2
144	4	1	Q3	75	2026-02-03 12:12:44.871137	3
145	4	1	Q9	25	2026-02-03 12:12:45.776807	9
146	4	2	Q13	25	2026-02-03 12:12:46.699111	13
147	4	2	Q17	100	2026-02-03 12:12:47.542485	17
148	4	2	Q18	75	2026-02-03 12:12:48.575474	18
149	4	2	Q19	75	2026-02-03 12:12:49.771269	19
150	4	3	Q20	50	2026-02-03 12:12:50.48183	20
151	4	3	Q21	25	2026-02-03 12:12:51.722668	21
152	4	3	Q23	75	2026-02-03 12:12:52.71764	23
153	4	3	Q25	0	2026-02-03 12:12:53.905465	25
154	4	3	Q26	25	2026-02-03 12:12:54.948135	26
155	4	3	Q28	75	2026-02-03 12:12:56.107079	28
156	4	4	Q31	75	2026-02-03 12:12:57.156849	31
157	4	4	Q32	25	2026-02-03 12:12:58.377205	32
158	4	4	Q33	50	2026-02-03 12:12:59.486069	33
159	4	4	Q34	75	2026-02-03 12:13:00.511877	34
160	4	5	Q35	100	2026-02-03 12:13:01.522377	35
161	4	5	Q38	75	2026-02-03 12:13:02.592516	38
162	4	5	Q41	100	2026-02-03 12:13:03.724057	41
163	4	6	Q43	50	2026-02-03 12:13:04.7916	43
164	4	6	Q45	0	2026-02-03 12:13:05.838563	45
165	4	7	Q48	50	2026-02-03 12:13:06.957809	48
166	4	7	Q52	50	2026-02-03 12:13:07.968251	52
167	4	7	Q55	75	2026-02-03 12:13:09.07906	55
168	4	8	Q56	25	2026-02-03 12:13:10.177311	56
169	4	8	Q57	25	2026-02-03 12:13:11.31122	57
170	4	8	Q58	75	2026-02-03 12:13:12.305093	58
171	4	9	Q59	75	2026-02-03 12:13:13.388426	59
172	4	9	Q61	50	2026-02-03 12:13:14.538858	61
173	4	9	Q62	25	2026-02-03 12:13:15.602868	62
174	4	9	Q64	0	2026-02-03 12:13:17.253266	64
175	4	10	Q65	25	2026-02-03 12:13:18.36616	65
176	4	10	Q66	25	2026-02-03 12:13:19.514702	66
177	4	10	Q68	75	2026-02-03 12:13:21.068721	68
178	4	10	Q70	75	2026-02-03 12:13:22.181834	70
179	5	1	Q1	50	2026-02-03 12:31:45.419825	1
180	5	1	Q2	75	2026-02-03 12:31:46.548287	2
181	5	1	Q3	25	2026-02-03 12:31:47.703731	3
182	5	1	Q9	25	2026-02-03 12:31:48.932297	9
183	5	2	Q13	50	2026-02-03 12:31:50.478298	13
184	5	2	Q17	25	2026-02-03 12:31:51.632203	17
185	5	2	Q18	25	2026-02-03 12:31:52.692105	18
186	5	2	Q19	75	2026-02-03 12:31:53.697598	19
187	5	3	Q20	100	2026-02-03 12:31:54.782823	20
188	5	3	Q21	75	2026-02-03 12:31:55.86848	21
189	5	3	Q23	75	2026-02-03 12:31:56.972864	23
190	5	3	Q25	100	2026-02-03 12:31:58.00208	25
191	5	3	Q26	100	2026-02-03 12:31:59.008874	26
192	5	3	Q28	50	2026-02-03 12:31:59.706702	28
193	5	4	Q31	0	2026-02-03 12:32:00.852365	31
194	5	4	Q32	50	2026-02-03 12:32:01.869473	32
195	5	4	Q33	100	2026-02-03 12:32:02.88626	33
196	5	4	Q34	50	2026-02-03 12:32:03.820377	34
197	5	5	Q35	50	2026-02-03 12:32:04.92056	35
198	5	5	Q38	50	2026-02-03 12:32:05.929863	38
199	5	5	Q41	0	2026-02-03 12:32:06.975723	41
200	5	6	Q43	50	2026-02-03 12:32:08.185709	43
201	5	6	Q45	50	2026-02-03 12:32:09.232382	45
202	5	7	Q48	50	2026-02-03 12:32:10.203439	48
203	5	7	Q52	100	2026-02-03 12:32:11.216192	52
204	5	7	Q55	0	2026-02-03 12:32:12.28904	55
205	5	8	Q56	100	2026-02-03 12:32:13.079246	56
206	5	8	Q57	25	2026-02-03 12:32:14.122749	57
207	5	8	Q58	75	2026-02-03 12:32:15.135592	58
208	5	9	Q59	100	2026-02-03 12:32:16.212428	59
209	5	9	Q61	25	2026-02-03 12:32:17.161567	61
210	5	9	Q62	25	2026-02-03 12:32:18.281594	62
211	5	9	Q64	75	2026-02-03 12:32:19.278845	64
212	5	10	Q65	25	2026-02-03 12:32:20.394638	65
213	5	10	Q66	25	2026-02-03 12:32:21.486795	66
214	5	10	Q68	50	2026-02-03 12:32:23.202174	68
215	5	10	Q70	100	2026-02-03 12:32:25.404932	70
216	6	1	Q1	50	2026-02-03 12:47:36.219933	1
217	6	1	Q2	50	2026-02-03 12:47:37.126341	2
218	6	1	Q3	100	2026-02-03 12:47:37.868664	3
219	6	1	Q9	50	2026-02-03 12:47:38.636223	9
220	6	2	Q13	100	2026-02-03 12:47:39.389984	13
221	6	2	Q17	50	2026-02-03 12:47:40.14037	17
222	6	2	Q18	50	2026-02-03 12:47:40.88341	18
223	6	2	Q19	100	2026-02-03 12:47:41.611004	19
224	6	3	Q20	50	2026-02-03 12:47:42.36963	20
225	6	3	Q21	0	2026-02-03 12:47:43.222868	21
226	6	3	Q23	50	2026-02-03 12:47:44.024708	23
227	6	3	Q25	100	2026-02-03 12:47:44.828303	25
228	6	3	Q26	50	2026-02-03 12:47:45.536455	26
229	6	3	Q28	50	2026-02-03 12:47:46.326333	28
230	6	4	Q31	50	2026-02-03 12:47:47.091506	31
231	6	4	Q32	0	2026-02-03 12:47:47.806722	32
232	6	4	Q33	50	2026-02-03 12:47:48.589208	33
233	6	4	Q34	100	2026-02-03 12:47:49.404311	34
234	6	5	Q35	100	2026-02-03 12:47:50.284058	35
235	6	5	Q38	75	2026-02-03 12:47:51.0505	38
236	6	5	Q41	50	2026-02-03 12:47:51.826341	41
237	6	6	Q43	25	2026-02-03 12:47:52.741372	43
238	6	6	Q45	25	2026-02-03 12:47:53.567684	45
239	6	7	Q48	0	2026-02-03 12:47:54.428828	48
240	6	7	Q52	50	2026-02-03 12:47:55.251947	52
241	6	7	Q55	100	2026-02-03 12:47:56.100731	55
242	6	8	Q56	50	2026-02-03 12:47:56.961743	56
243	6	8	Q57	0	2026-02-03 12:47:57.763703	57
244	6	8	Q58	50	2026-02-03 12:47:58.619018	58
245	6	9	Q59	100	2026-02-03 12:47:59.437827	59
246	6	9	Q61	50	2026-02-03 12:48:00.169435	61
247	6	9	Q62	100	2026-02-03 12:48:00.945744	62
248	6	9	Q64	0	2026-02-03 12:48:01.980407	64
249	6	10	Q65	50	2026-02-03 12:48:02.706662	65
250	6	10	Q66	100	2026-02-03 12:48:03.557149	66
251	6	10	Q68	50	2026-02-03 12:48:04.412237	68
252	6	10	Q70	25	2026-02-03 12:48:05.260421	70
253	7	1	Q1	25	2026-02-03 12:48:43.918819	1
254	7	1	Q2	75	2026-02-03 12:48:44.782119	2
255	7	1	Q3	75	2026-02-03 12:48:45.725176	3
256	7	1	Q9	50	2026-02-03 12:49:57.981398	9
257	7	2	Q13	100	2026-02-03 12:49:59.424572	13
258	7	2	Q17	50	2026-02-03 12:50:00.907228	17
259	7	2	Q18	25	2026-02-03 12:50:01.638782	18
260	7	2	Q19	0	2026-02-03 12:50:02.473106	19
261	7	3	Q20	50	2026-02-03 12:50:03.302726	20
262	7	3	Q21	75	2026-02-03 12:50:04.231991	21
263	7	3	Q23	100	2026-02-03 12:50:05.040015	23
264	7	3	Q25	50	2026-02-03 12:50:05.94845	25
265	7	3	Q26	25	2026-02-03 12:50:06.928565	26
266	7	3	Q28	50	2026-02-03 12:50:08.595285	28
267	7	4	Q31	25	2026-02-03 12:50:09.440131	31
268	7	4	Q32	100	2026-02-03 12:50:16.437753	32
269	7	4	Q33	50	2026-02-03 12:50:17.412385	33
270	7	4	Q34	25	2026-02-03 12:50:18.222008	34
271	7	5	Q35	100	2026-02-03 12:50:18.970675	35
272	7	5	Q38	75	2026-02-03 12:50:19.844945	38
273	7	5	Q41	25	2026-02-03 12:50:21.557724	41
274	7	6	Q43	0	2026-02-03 12:50:22.678735	43
275	7	6	Q45	50	2026-02-03 12:50:23.513834	45
276	7	7	Q48	100	2026-02-03 12:50:24.425799	48
277	7	7	Q52	75	2026-02-03 12:50:25.456028	52
278	7	7	Q55	50	2026-02-03 12:50:26.441415	55
279	7	8	Q56	25	2026-02-03 12:50:27.256127	56
280	7	8	Q57	75	2026-02-03 12:50:28.056244	57
281	7	8	Q58	100	2026-02-03 12:50:28.853558	58
282	7	9	Q59	0	2026-02-03 12:50:29.656504	59
283	7	9	Q61	50	2026-02-03 12:50:31.098201	61
284	7	9	Q62	100	2026-02-03 12:50:32.455263	62
285	7	9	Q64	75	2026-02-03 12:50:33.205874	64
286	7	10	Q65	100	2026-02-03 12:50:34.122028	65
287	7	10	Q66	75	2026-02-03 12:50:35.061852	66
288	7	10	Q68	50	2026-02-03 12:50:35.817557	68
289	7	10	Q70	75	2026-02-03 12:50:36.930419	70
290	15	1	Q1	50	2026-02-03 17:40:17.949806	1
291	15	1	Q2	75	2026-02-03 17:40:18.769575	2
292	15	1	Q3	0	2026-02-03 17:40:19.933156	3
293	15	1	Q9	75	2026-02-03 17:40:20.921683	9
294	15	2	Q13	75	2026-02-03 17:40:21.640518	13
295	15	2	Q17	75	2026-02-03 17:40:22.357925	17
296	15	2	Q18	75	2026-02-03 17:40:23.066121	18
297	15	2	Q19	75	2026-02-03 17:40:23.871824	19
298	15	3	Q20	75	2026-02-03 17:40:24.651829	20
299	14	1	Q1	100	2026-02-03 17:40:25.534589	1
300	15	3	Q21	100	2026-02-03 17:40:25.72768	21
301	15	3	Q23	50	2026-02-03 17:40:26.487888	23
302	15	3	Q25	100	2026-02-03 17:40:27.239474	25
303	15	3	Q26	50	2026-02-03 17:40:27.939394	26
304	15	3	Q28	100	2026-02-03 17:40:28.624743	28
305	15	4	Q31	50	2026-02-03 17:40:29.371981	31
306	15	4	Q32	0	2026-02-03 17:40:30.133377	32
307	15	4	Q33	50	2026-02-03 17:40:30.883064	33
308	14	1	Q2	100	2026-02-03 17:40:31.294758	2
309	15	4	Q34	100	2026-02-03 17:40:31.615528	34
310	15	5	Q35	100	2026-02-03 17:40:32.395684	35
311	15	5	Q38	50	2026-02-03 17:40:33.275255	38
312	15	5	Q41	100	2026-02-03 17:40:34.042996	41
313	15	6	Q43	50	2026-02-03 17:40:34.762659	43
314	14	1	Q3	100	2026-02-03 17:40:34.898339	3
315	15	6	Q45	100	2026-02-03 17:40:35.571836	45
316	14	1	Q9	100	2026-02-03 17:40:35.744164	9
317	15	7	Q48	50	2026-02-03 17:40:36.351569	48
318	14	2	Q13	100	2026-02-03 17:40:36.793987	13
319	15	7	Q52	0	2026-02-03 17:40:37.328425	52
320	14	2	Q17	100	2026-02-03 17:40:37.906794	17
321	15	7	Q55	25	2026-02-03 17:40:38.099584	55
322	14	2	Q18	100	2026-02-03 17:40:38.665174	18
323	15	8	Q56	75	2026-02-03 17:40:38.760807	56
324	14	2	Q19	100	2026-02-03 17:40:39.321148	19
325	15	8	Q57	75	2026-02-03 17:40:39.540151	57
326	14	3	Q20	100	2026-02-03 17:40:39.991237	20
327	15	8	Q58	75	2026-02-03 17:40:40.264219	58
328	14	3	Q21	100	2026-02-03 17:40:40.664497	21
329	15	9	Q59	25	2026-02-03 17:40:41.01403	59
330	14	3	Q23	100	2026-02-03 17:40:41.527781	23
331	15	9	Q61	75	2026-02-03 17:40:41.697508	61
332	15	9	Q62	75	2026-02-03 17:40:42.448467	62
333	14	3	Q25	100	2026-02-03 17:40:42.9771	25
334	15	9	Q64	75	2026-02-03 17:40:43.688674	64
335	14	3	Q26	100	2026-02-03 17:40:44.322851	26
336	15	10	Q65	50	2026-02-03 17:40:44.59922	65
337	14	3	Q28	100	2026-02-03 17:40:45.286672	28
338	15	10	Q66	100	2026-02-03 17:40:45.557081	66
339	14	4	Q31	100	2026-02-03 17:40:46.49565	31
340	15	10	Q68	50	2026-02-03 17:40:46.536607	68
341	14	4	Q32	100	2026-02-03 17:40:47.689515	32
342	15	10	Q70	100	2026-02-03 17:40:48.6616	70
343	14	4	Q33	100	2026-02-03 17:40:48.851975	33
344	14	4	Q34	100	2026-02-03 17:40:50.195419	34
345	14	5	Q35	100	2026-02-03 17:40:51.858539	35
346	14	5	Q38	100	2026-02-03 17:40:52.94672	38
347	14	5	Q41	100	2026-02-03 17:40:54.364455	41
348	14	6	Q43	100	2026-02-03 17:40:55.68902	43
349	14	6	Q45	100	2026-02-03 17:40:56.921649	45
350	14	7	Q48	100	2026-02-03 17:40:58.945387	48
351	14	7	Q52	100	2026-02-03 17:41:00.222435	52
352	14	7	Q55	100	2026-02-03 17:41:01.684596	55
353	14	8	Q56	0	2026-02-03 17:41:04.65704	56
354	14	8	Q57	100	2026-02-03 17:41:07.770185	57
355	14	8	Q58	100	2026-02-03 17:41:10.185067	58
356	14	9	Q59	100	2026-02-03 17:41:12.563472	59
357	14	9	Q61	100	2026-02-03 17:41:15.757188	61
358	14	9	Q62	100	2026-02-03 17:41:18.245105	62
359	14	9	Q64	100	2026-02-03 17:41:19.897998	64
360	14	10	Q65	100	2026-02-03 17:41:21.770613	65
361	14	10	Q66	100	2026-02-03 17:41:23.642006	66
362	14	10	Q68	0	2026-02-03 17:41:26.536225	68
363	14	10	Q70	0	2026-02-03 17:41:30.455614	70
\.


--
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resultados (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
1	1	1	Demandas no Trabalho	62.50	medio	2026-02-03 00:46:49.283263
2	1	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-03 00:46:49.57151
3	1	3	Relações Sociais e Liderança	66.67	alto	2026-02-03 00:46:49.82265
4	1	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-02-03 00:46:50.07282
5	1	5	Valores Organizacionais	66.67	alto	2026-02-03 00:46:50.323063
6	1	6	Traços de Personalidade	50.00	medio	2026-02-03 00:46:50.573276
7	1	7	Saúde e Bem-Estar	50.00	medio	2026-02-03 00:46:50.823805
8	1	8	Comportamentos Ofensivos	91.67	alto	2026-02-03 00:46:51.073968
9	1	9	Comportamento de Jogo	25.00	baixo	2026-02-03 00:46:51.324188
10	1	10	Endividamento Financeiro	81.25	alto	2026-02-03 00:46:51.573889
11	2	1	Demandas no Trabalho	62.50	medio	2026-02-03 01:34:57.391128
12	2	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-03 01:34:57.658035
13	2	3	Relações Sociais e Liderança	54.17	medio	2026-02-03 01:34:57.892755
14	2	4	Interface Trabalho-Indivíduo	37.50	medio	2026-02-03 01:34:58.126547
15	2	5	Valores Organizacionais	58.33	medio	2026-02-03 01:34:58.360409
16	2	6	Traços de Personalidade	50.00	medio	2026-02-03 01:34:58.594602
17	2	7	Saúde e Bem-Estar	66.67	alto	2026-02-03 01:34:58.828873
18	2	8	Comportamentos Ofensivos	66.67	alto	2026-02-03 01:34:59.063871
19	2	9	Comportamento de Jogo	62.50	medio	2026-02-03 01:34:59.297489
20	2	10	Endividamento Financeiro	25.00	baixo	2026-02-03 01:34:59.531564
21	4	1	Demandas no Trabalho	62.50	medio	2026-02-03 12:13:24.072513
22	4	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-03 12:13:24.355566
23	4	3	Relações Sociais e Liderança	41.67	medio	2026-02-03 12:13:24.593269
24	4	4	Interface Trabalho-Indivíduo	56.25	medio	2026-02-03 12:13:24.830823
25	4	5	Valores Organizacionais	91.67	alto	2026-02-03 12:13:25.069212
26	4	6	Traços de Personalidade	25.00	baixo	2026-02-03 12:13:25.306817
27	4	7	Saúde e Bem-Estar	58.33	medio	2026-02-03 12:13:25.545231
28	4	8	Comportamentos Ofensivos	41.67	medio	2026-02-03 12:13:25.784451
29	4	9	Comportamento de Jogo	37.50	medio	2026-02-03 12:13:26.023218
30	4	10	Endividamento Financeiro	50.00	medio	2026-02-03 12:13:26.261536
31	5	1	Demandas no Trabalho	43.75	medio	2026-02-03 12:32:27.29517
32	5	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-02-03 12:32:27.549642
33	5	3	Relações Sociais e Liderança	83.33	alto	2026-02-03 12:32:27.78637
34	5	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-03 12:32:28.023506
35	5	5	Valores Organizacionais	33.33	medio	2026-02-03 12:32:28.260856
36	5	6	Traços de Personalidade	50.00	medio	2026-02-03 12:32:28.497756
37	5	7	Saúde e Bem-Estar	50.00	medio	2026-02-03 12:32:28.735029
38	5	8	Comportamentos Ofensivos	66.67	alto	2026-02-03 12:32:28.971572
39	5	9	Comportamento de Jogo	56.25	medio	2026-02-03 12:32:29.207758
40	5	10	Endividamento Financeiro	50.00	medio	2026-02-03 12:32:29.444488
41	6	1	Demandas no Trabalho	62.50	medio	2026-02-03 12:48:07.334127
42	6	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-03 12:48:07.580819
43	6	3	Relações Sociais e Liderança	50.00	medio	2026-02-03 12:48:07.812762
44	6	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-03 12:48:08.044634
45	6	5	Valores Organizacionais	75.00	alto	2026-02-03 12:48:08.277564
46	6	6	Traços de Personalidade	25.00	baixo	2026-02-03 12:48:08.511062
47	6	7	Saúde e Bem-Estar	50.00	medio	2026-02-03 12:48:08.741868
48	6	8	Comportamentos Ofensivos	33.33	medio	2026-02-03 12:48:08.972606
49	6	9	Comportamento de Jogo	62.50	medio	2026-02-03 12:48:09.204483
50	6	10	Endividamento Financeiro	56.25	medio	2026-02-03 12:48:09.4364
51	7	1	Demandas no Trabalho	56.25	medio	2026-02-03 12:50:39.00794
52	7	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-02-03 12:50:39.240052
53	7	3	Relações Sociais e Liderança	58.33	medio	2026-02-03 12:50:39.472141
54	7	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-03 12:50:39.704087
55	7	5	Valores Organizacionais	66.67	alto	2026-02-03 12:50:39.936013
56	7	6	Traços de Personalidade	25.00	baixo	2026-02-03 12:50:40.167339
57	7	7	Saúde e Bem-Estar	75.00	alto	2026-02-03 12:50:40.398922
58	7	8	Comportamentos Ofensivos	66.67	alto	2026-02-03 12:50:40.631792
59	7	9	Comportamento de Jogo	56.25	medio	2026-02-03 12:50:40.862857
60	7	10	Endividamento Financeiro	75.00	alto	2026-02-03 12:50:41.09452
61	15	1	Demandas no Trabalho	50.00	medio	2026-02-03 17:40:50.542091
62	15	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-03 17:40:50.84096
63	15	3	Relações Sociais e Liderança	79.17	alto	2026-02-03 17:40:51.076498
64	15	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-03 17:40:51.312431
65	15	5	Valores Organizacionais	83.33	alto	2026-02-03 17:40:51.548901
66	15	6	Traços de Personalidade	75.00	alto	2026-02-03 17:40:51.790219
67	15	7	Saúde e Bem-Estar	25.00	baixo	2026-02-03 17:40:52.023407
68	15	8	Comportamentos Ofensivos	75.00	alto	2026-02-03 17:40:52.260962
69	15	9	Comportamento de Jogo	62.50	medio	2026-02-03 17:40:52.497761
70	15	10	Endividamento Financeiro	75.00	alto	2026-02-03 17:40:52.732819
71	14	1	Demandas no Trabalho	100.00	alto	2026-02-03 17:41:32.372423
72	14	2	Organização e Conteúdo do Trabalho	100.00	alto	2026-02-03 17:41:32.612092
73	14	3	Relações Sociais e Liderança	100.00	alto	2026-02-03 17:41:32.852831
74	14	4	Interface Trabalho-Indivíduo	100.00	alto	2026-02-03 17:41:33.092978
75	14	5	Valores Organizacionais	100.00	alto	2026-02-03 17:41:33.333461
76	14	6	Traços de Personalidade	100.00	alto	2026-02-03 17:41:33.573135
77	14	7	Saúde e Bem-Estar	100.00	alto	2026-02-03 17:41:33.814219
78	14	8	Comportamentos Ofensivos	66.67	alto	2026-02-03 17:41:34.053552
79	14	9	Comportamento de Jogo	100.00	alto	2026-02-03 17:41:34.293541
80	14	10	Endividamento Financeiro	50.00	medio	2026-02-03 17:41:34.53461
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
3	4	2026-02-02 21:55:55.100973
3	5	2026-02-02 21:55:55.100973
3	6	2026-02-02 21:55:55.100973
3	7	2026-02-02 21:55:55.100973
3	8	2026-02-02 21:55:55.100973
3	9	2026-02-02 21:55:55.100973
3	10	2026-02-02 21:55:55.100973
3	11	2026-02-02 21:55:55.100973
4	14	2026-02-03 15:09:53.311683
4	15	2026-02-03 15:09:53.311683
4	16	2026-02-03 15:09:53.311683
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, display_name, description, hierarchy_level, active, created_at) FROM stdin;
2	admin	Administrador	Administrador do sistema	0	t	2026-02-02 21:55:43.620152
3	gestor_entidade	Gestor de Entidade	Gerencia funcionarios de sua entidade privada	10	t	2026-02-02 21:55:55.100973
4	emissor	Emissor de Laudos	Profissional responsável pela emissão e assinatura de laudos médicos - papel independente	80	t	2026-02-03 15:09:53.311683
\.


--
-- Data for Name: session_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_logs (id, cpf, perfil, clinica_id, empresa_id, login_timestamp, logout_timestamp, ip_address, user_agent, criado_em) FROM stdin;
\.


--
-- Data for Name: templates_contrato; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.templates_contrato (id, nome, descricao, tipo_template, conteudo, ativo, padrao, versao, criado_em, criado_por_cpf, atualizado_em, atualizado_por_cpf, tags, metadata) FROM stdin;
1	Contrato Plano Personalizado - Padrao	Template padrao para contratos de plano personalizado de Medicina do Trabalho	plano_personalizado	<h1>CONTRATO DE PRESTACAO DE SERVICOS - MEDICINA DO TRABALHO</h1>\r\n<p><strong>CONTRATANTE:</strong> {{contratante_nome}} - CNPJ: {{contratante_cnpj}}</p>\r\n<p><strong>CONTRATADA:</strong> QWork Medicina Ocupacional</p>\r\n\r\n<h2>CLAUSULA PRIMEIRA - DO OBJETO</h2>\r\n<p>O presente contrato tem por objeto a prestacao de servicos de medicina do trabalho na modalidade de Plano Personalizado, abrangendo {{numero_funcionarios}} funcionarios estimados.</p>\r\n\r\n<h2>CLAUSULA SEGUNDA - DO VALOR</h2>\r\n<p>O valor mensal dos servicos e de R$ {{valor_total}} ({{valor_total_extenso}}), correspondendo a R$ {{valor_por_funcionario}} por funcionario.</p>\r\n\r\n<h2>CLAUSULA TERCEIRA - DO PRAZO</h2>\r\n<p>O presente contrato tem validade de {{prazo_meses}} meses a partir de {{data_inicio}}, podendo ser renovado mediante acordo entre as partes.</p>\r\n\r\n<h2>CLAUSULA QUARTA - DOS SERVICOS INCLUSOS</h2>\r\n<ul>\r\n  <li>Avaliacao psicossocial completa (COPSOQ III)</li>\r\n  <li>Modulo de Jogo Patologico (JZ)</li>\r\n  <li>Modulo de Endividamento Financeiro (EF)</li>\r\n  <li>Relatorios personalizados</li>\r\n  <li>Suporte tecnico dedicado</li>\r\n</ul>\r\n\r\n<p><strong>Data do Contrato:</strong> {{data_contrato}}</p>\r\n<p><strong>Assinaturas:</strong></p>\r\n<p>_______________________________<br/>CONTRATANTE</p>\r\n<p>_______________________________<br/>CONTRATADA</p>	t	t	1	2026-02-02 21:55:00.296684	SISTEMA	2026-02-02 21:55:00.296684	\N	\N	{}
\.


--
-- Data for Name: tokens_retomada_pagamento; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tokens_retomada_pagamento (id, token, contratante_id, contrato_id, usado, usado_em, expira_em, criado_em) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.usuarios (id, cpf, nome, role, ativo, criado_em) FROM stdin;
1	00000000000	Admin Dev	admin	t	2026-02-02 21:55:16.035689
\.


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analise_estatistica_id_seq', 1, false);


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_access_denied_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 151, true);


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_geral_id_seq', 1, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 20, true);


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_laudos_id_seq', 2, true);


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_recibos_id_seq', 1, false);


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 15, true);


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinica_configuracoes_id_seq', 1, false);


--
-- Name: clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinicas_id_seq', 2, true);


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratacao_personalizada_id_seq', 3, true);


--
-- Name: contratantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratantes_id_seq', 4, true);


--
-- Name: contratantes_senhas_audit_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratantes_senhas_audit_audit_id_seq', 10, true);


--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratantes_senhas_id_seq', 7, true);


--
-- Name: contratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratos_id_seq', 8, true);


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratos_planos_id_seq', 1, false);


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.emissao_queue_id_seq', 1, false);


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.empresas_clientes_id_seq', 3, true);


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fila_emissao_id_seq', 2, true);


--
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 37, true);


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_arquivos_remotos_id_seq', 1, false);


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_downloads_id_seq', 1, false);


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_generation_jobs_id_seq', 1, false);


--
-- Name: laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudos_id_seq', 1, true);


--
-- Name: logs_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.logs_admin_id_seq', 1, false);


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.lotes_avaliacao_funcionarios_id_seq', 1, false);


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.lotes_avaliacao_id_seq', 11, true);


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mfa_codes_id_seq', 1, false);


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.migration_guidelines_id_seq', 3, true);


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_admin_id_seq', 1, true);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 2, true);


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_traducoes_id_seq', 9, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 4, true);


--
-- Name: payment_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payment_links_id_seq', 1, false);


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pdf_jobs_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 16, true);


--
-- Name: planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.planos_id_seq', 1, true);


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.policy_expression_backups_id_seq', 1, false);


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.questao_condicoes_id_seq', 1, false);


--
-- Name: recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.recibos_id_seq', 1, false);


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.relatorio_templates_id_seq', 1, false);


--
-- Name: respostas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.respostas_id_seq', 363, true);


--
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resultados_id_seq', 80, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: session_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.session_logs_id_seq', 1, false);


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.templates_contrato_id_seq', 1, true);


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tokens_retomada_pagamento_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);


--
-- Name: audit_access_denied audit_access_denied_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_access_denied
    ADD CONSTRAINT audit_access_denied_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auditoria_geral auditoria_geral_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_geral
    ADD CONSTRAINT auditoria_geral_pkey PRIMARY KEY (id);


--
-- Name: auditoria_laudos auditoria_laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT auditoria_laudos_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: auditoria_recibos auditoria_recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_pkey PRIMARY KEY (id);


--
-- Name: avaliacao_resets avaliacao_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: clinica_configuracoes clinica_configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT clinica_configuracoes_pkey PRIMARY KEY (id);


--
-- Name: clinicas clinicas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_cnpj_key UNIQUE (cnpj);


--
-- Name: clinicas_empresas clinicas_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_pkey PRIMARY KEY (clinica_id, empresa_id);


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: contratacao_personalizada contratacao_personalizada_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_pkey PRIMARY KEY (id);


--
-- Name: contratantes contratantes_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_cnpj_unique UNIQUE (cnpj);


--
-- Name: contratantes contratantes_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_email_unique UNIQUE (email);


--
-- Name: contratantes contratantes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_pkey PRIMARY KEY (id);


--
-- Name: contratantes contratantes_responsavel_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_responsavel_cpf_unique UNIQUE (responsavel_cpf);


--
-- Name: contratantes_senhas_audit contratantes_senhas_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas_audit
    ADD CONSTRAINT contratantes_senhas_audit_pkey PRIMARY KEY (audit_id);


--
-- Name: contratantes_senhas contratantes_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT contratantes_senhas_cpf_key UNIQUE (cpf);


--
-- Name: contratantes_senhas contratantes_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT contratantes_senhas_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: contratos_planos contratos_planos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_pkey PRIMARY KEY (id);


--
-- Name: emissao_queue emissao_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_pkey PRIMARY KEY (id);


--
-- Name: empresas_clientes empresas_clientes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);


--
-- Name: fila_emissao fila_emissao_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);


--
-- Name: fila_emissao fila_emissao_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_clinica_check; Type: CHECK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.funcionarios
    ADD CONSTRAINT funcionarios_clinica_check CHECK (((clinica_id IS NOT NULL) OR (contratante_id IS NOT NULL) OR ((perfil)::text = ANY ((ARRAY['emissor'::character varying, 'admin'::character varying, 'gestao'::character varying])::text[])))) NOT VALID;


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


--
-- Name: funcionarios funcionarios_matricula_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_matricula_key UNIQUE (matricula);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_pkey PRIMARY KEY (id);


--
-- Name: laudo_downloads laudo_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_pkey PRIMARY KEY (id);


--
-- Name: laudo_generation_jobs laudo_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: laudos laudos_lote_emissor_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);


--
-- Name: laudos laudos_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);


--
-- Name: laudos laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_pkey PRIMARY KEY (id);


--
-- Name: logs_admin logs_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.logs_admin
    ADD CONSTRAINT logs_admin_pkey PRIMARY KEY (id);


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_numero_ordem_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique UNIQUE (empresa_id, numero_ordem);


--
-- Name: lotes_avaliacao lotes_avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_pkey PRIMARY KEY (id);


--
-- Name: mfa_codes mfa_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT mfa_codes_pkey PRIMARY KEY (id);


--
-- Name: migration_guidelines migration_guidelines_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migration_guidelines
    ADD CONSTRAINT migration_guidelines_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_admin notificacoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_traducoes notificacoes_traducoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT notificacoes_traducoes_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_token_key UNIQUE (token);


--
-- Name: pdf_jobs pdf_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_pkey PRIMARY KEY (id);


--
-- Name: pdf_jobs pdf_jobs_recibo_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_key UNIQUE (recibo_id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: planos planos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT planos_pkey PRIMARY KEY (id);


--
-- Name: policy_expression_backups policy_expression_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.policy_expression_backups
    ADD CONSTRAINT policy_expression_backups_pkey PRIMARY KEY (id);


--
-- Name: questao_condicoes questao_condicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.questao_condicoes
    ADD CONSTRAINT questao_condicoes_pkey PRIMARY KEY (id);


--
-- Name: recibos recibos_numero_recibo_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_numero_recibo_key UNIQUE (numero_recibo);


--
-- Name: recibos recibos_pagamento_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pagamento_id_unique UNIQUE (pagamento_id);


--
-- Name: CONSTRAINT recibos_pagamento_id_unique ON recibos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT recibos_pagamento_id_unique ON public.recibos IS 'Garante que cada pagamento tem no máximo um recibo ativo (idempotência)';


--
-- Name: recibos recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pkey PRIMARY KEY (id);


--
-- Name: relatorio_templates relatorio_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.relatorio_templates
    ADD CONSTRAINT relatorio_templates_pkey PRIMARY KEY (id);


--
-- Name: respostas respostas_avaliacao_id_grupo_item_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item);


--
-- Name: respostas respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_pkey PRIMARY KEY (id);


--
-- Name: resultados resultados_avaliacao_id_grupo_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo);


--
-- Name: resultados resultados_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: session_logs session_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_pkey PRIMARY KEY (id);


--
-- Name: templates_contrato templates_contrato_nome_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_nome_key UNIQUE (nome);


--
-- Name: templates_contrato templates_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_token_key UNIQUE (token);


--
-- Name: clinica_configuracoes unique_clinica_config; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT unique_clinica_config UNIQUE (clinica_id);


--
-- Name: clinicas unique_clinica_contratante; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT unique_clinica_contratante UNIQUE (contratante_id);


--
-- Name: notificacoes_traducoes unique_traducao; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT unique_traducao UNIQUE (chave_traducao, idioma);


--
-- Name: usuarios usuarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cpf_key UNIQUE (cpf);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: contratantes_senhas_contratante_cpf_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX contratantes_senhas_contratante_cpf_unique ON public.contratantes_senhas USING btree (contratante_id, cpf);


--
-- Name: idx_analise_estatistica_avaliacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_analise_estatistica_avaliacao ON public.analise_estatistica USING btree (avaliacao_id);


--
-- Name: idx_audit_denied_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_denied_created_at ON public.audit_access_denied USING btree (created_at DESC);


--
-- Name: idx_audit_denied_resource; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_denied_resource ON public.audit_access_denied USING btree (resource);


--
-- Name: idx_audit_denied_user_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_denied_user_cpf ON public.audit_access_denied USING btree (user_cpf);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_clinica_id ON public.audit_logs USING btree (clinica_id);


--
-- Name: idx_audit_logs_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_contratante_id ON public.audit_logs USING btree (contratante_id, created_at DESC);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource);


--
-- Name: idx_audit_logs_system_actions; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_system_actions ON public.audit_logs USING btree (created_at DESC) WHERE (user_cpf IS NULL);


--
-- Name: idx_audit_logs_user_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_user_cpf ON public.audit_logs USING btree (user_cpf);


--
-- Name: idx_auditoria_acao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_acao ON public.auditoria USING btree (acao);


--
-- Name: idx_auditoria_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_criado_em ON public.auditoria USING btree (criado_em);


--
-- Name: idx_auditoria_entidade; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_entidade ON public.auditoria USING btree (entidade_tipo, entidade_id);


--
-- Name: idx_auditoria_geral_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_geral_cpf ON public.auditoria_geral USING btree (cpf_responsavel);


--
-- Name: idx_auditoria_geral_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_geral_criado_em ON public.auditoria_geral USING btree (criado_em DESC);


--
-- Name: idx_auditoria_geral_tabela; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_geral_tabela ON public.auditoria_geral USING btree (tabela_afetada);


--
-- Name: idx_auditoria_laudos_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_criado ON public.auditoria_laudos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_laudos_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_lote ON public.auditoria_laudos USING btree (lote_id);


--
-- Name: idx_auditoria_recibos_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_recibos_criado ON public.auditoria_recibos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_recibos_recibo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_recibos_recibo ON public.auditoria_recibos USING btree (recibo_id);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_cpf);


--
-- Name: idx_avaliacao_resets_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacao_resets_created_at ON public.avaliacao_resets USING btree (created_at DESC);


--
-- Name: idx_avaliacao_resets_lote_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacao_resets_lote_id ON public.avaliacao_resets USING btree (lote_id);


--
-- Name: idx_avaliacao_resets_requested_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacao_resets_requested_by ON public.avaliacao_resets USING btree (requested_by_user_id);


--
-- Name: idx_avaliacao_resets_unique_per_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_avaliacao_resets_unique_per_lote ON public.avaliacao_resets USING btree (avaliacao_id, lote_id);


--
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_funcionario_cpf ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_funcionario_status ON public.avaliacoes USING btree (funcionario_cpf, status);


--
-- Name: idx_avaliacoes_inativada_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_inativada_em ON public.avaliacoes USING btree (inativada_em) WHERE (inativada_em IS NOT NULL);


--
-- Name: idx_avaliacoes_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_lote ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_lote_id ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_lote_status ON public.avaliacoes USING btree (lote_id, status);


--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);


--
-- Name: idx_clinica_configuracoes_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinica_configuracoes_clinica ON public.clinica_configuracoes USING btree (clinica_id);


--
-- Name: idx_clinicas_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_ativa ON public.clinicas USING btree (ativa);


--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_cnpj ON public.clinicas USING btree (cnpj);


--
-- Name: idx_clinicas_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_contratante_id ON public.clinicas USING btree (contratante_id);


--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);


--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);


--
-- Name: idx_contratacao_personalizada_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratacao_personalizada_contratante ON public.contratacao_personalizada USING btree (contratante_id);


--
-- Name: idx_contratacao_personalizada_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratacao_personalizada_criado_em ON public.contratacao_personalizada USING btree (criado_em DESC);


--
-- Name: idx_contratacao_personalizada_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratacao_personalizada_status ON public.contratacao_personalizada USING btree (status);


--
-- Name: idx_contratacao_personalizada_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratacao_personalizada_token ON public.contratacao_personalizada USING btree (payment_link_token);


--
-- Name: idx_contratantes_aprovado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_aprovado_em ON public.contratantes USING btree (aprovado_em) WHERE (aprovado_em IS NOT NULL);


--
-- Name: idx_contratantes_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_ativa ON public.contratantes USING btree (ativa);


--
-- Name: idx_contratantes_cnpj; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_cnpj ON public.contratantes USING btree (cnpj);


--
-- Name: idx_contratantes_contrato_aceito; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_contrato_aceito ON public.contratantes USING btree (contrato_aceito);


--
-- Name: idx_contratantes_data_liberacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_data_liberacao ON public.contratantes USING btree (data_liberacao_login);


--
-- Name: idx_contratantes_senhas_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_senhas_contratante ON public.contratantes_senhas USING btree (contratante_id);


--
-- Name: idx_contratantes_senhas_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_senhas_contratante_id ON public.contratantes_senhas USING btree (contratante_id);


--
-- Name: idx_contratantes_senhas_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_senhas_cpf ON public.contratantes_senhas USING btree (cpf);


--
-- Name: idx_contratantes_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_status ON public.contratantes USING btree (status);


--
-- Name: idx_contratantes_status_data_cadastro; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_status_data_cadastro ON public.contratantes USING btree (status, criado_em DESC);


--
-- Name: INDEX idx_contratantes_status_data_cadastro; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_contratantes_status_data_cadastro IS 'Otimiza listagem de contratantes por status e data';


--
-- Name: idx_contratantes_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_tipo ON public.contratantes USING btree (tipo);


--
-- Name: idx_contratantes_tipo_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_tipo_ativa ON public.contratantes USING btree (tipo, ativa);


--
-- Name: idx_contratantes_tipo_status_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratantes_tipo_status_ativa ON public.contratantes USING btree (tipo, status, ativa);


--
-- Name: INDEX idx_contratantes_tipo_status_ativa; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_contratantes_tipo_status_ativa IS 'Otimiza consultas por tipo, status e atividade';


--
-- Name: idx_contratos_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_contratante ON public.contratos USING btree (contratante_id);


--
-- Name: idx_contratos_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_contratante_id ON public.contratos USING btree (contratante_id);


--
-- Name: idx_contratos_data_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_data_pagamento ON public.contratos_planos USING btree (data_pagamento);


--
-- Name: idx_contratos_modalidade_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_modalidade_pagamento ON public.contratos_planos USING btree (modalidade_pagamento);


--
-- Name: idx_contratos_numero_funcionarios; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_numero_funcionarios ON public.contratos USING btree (numero_funcionarios);


--
-- Name: idx_contratos_planos_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_planos_clinica ON public.contratos_planos USING btree (clinica_id);


--
-- Name: idx_contratos_planos_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_planos_contratante ON public.contratos_planos USING btree (contratante_id);


--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);


--
-- Name: idx_contratos_tipo_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_tipo_pagamento ON public.contratos_planos USING btree (tipo_pagamento);


--
-- Name: idx_contratos_valor_personalizado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_valor_personalizado ON public.contratos USING btree (valor_personalizado);


--
-- Name: idx_emissao_queue_proxima_execucao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_emissao_queue_proxima_execucao ON public.emissao_queue USING btree (proxima_execucao);


--
-- Name: idx_empresas_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_empresas_ativa ON public.empresas_clientes USING btree (ativa);


--
-- Name: idx_empresas_clientes_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_empresas_clientes_clinica_id ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_empresas_clinica ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_empresas_clinica_ativa ON public.empresas_clientes USING btree (clinica_id) WHERE (ativa = true);


--
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_empresas_cnpj ON public.empresas_clientes USING btree (cnpj);


--
-- Name: idx_fila_emissao_lote_tentativas_pendentes; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_lote_tentativas_pendentes ON public.fila_emissao USING btree (lote_id) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_proxima_tentativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_proxima_tentativa ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_solicitado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_solicitado_em ON public.fila_emissao USING btree (solicitado_em DESC);


--
-- Name: idx_fila_emissao_solicitado_por; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_solicitado_por ON public.fila_emissao USING btree (solicitado_por);


--
-- Name: idx_fila_emissao_solicitante_data; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_solicitante_data ON public.fila_emissao USING btree (solicitado_por, solicitado_em DESC) WHERE (solicitado_por IS NOT NULL);


--
-- Name: idx_fila_emissao_tipo_solicitante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_tipo_solicitante ON public.fila_emissao USING btree (tipo_solicitante);


--
-- Name: idx_fila_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_lote ON public.fila_emissao USING btree (lote_id);


--
-- Name: idx_fila_pendente; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_pendente ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_funcionarios_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_clinica ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_clinica_empresa ON public.funcionarios USING btree (clinica_id, empresa_id);


--
-- Name: idx_funcionarios_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_clinica_id ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_perfil_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_clinica_perfil_ativo ON public.funcionarios USING btree (clinica_id, perfil, ativo);


--
-- Name: idx_funcionarios_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_contratante_id ON public.funcionarios USING btree (contratante_id) WHERE (contratante_id IS NOT NULL);


--
-- Name: idx_funcionarios_contratante_usuario_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_contratante_usuario_tipo ON public.funcionarios USING btree (contratante_id, usuario_tipo);


--
-- Name: idx_funcionarios_cpf_clinica_perfil; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_cpf_clinica_perfil ON public.funcionarios USING btree (cpf, clinica_id, perfil) WHERE (((perfil)::text = 'rh'::text) AND (ativo = true));


--
-- Name: idx_funcionarios_cpf_perfil_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_cpf_perfil_ativo ON public.funcionarios USING btree (cpf, perfil, ativo);


--
-- Name: idx_funcionarios_data_admissao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_data_admissao ON public.funcionarios USING btree (data_admissao);


--
-- Name: idx_funcionarios_data_ultimo_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_data_ultimo_lote ON public.funcionarios USING btree (data_ultimo_lote) WHERE (data_ultimo_lote IS NOT NULL);


--
-- Name: idx_funcionarios_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_empresa ON public.funcionarios USING btree (empresa_id);


--
-- Name: idx_funcionarios_indice_avaliacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_indice_avaliacao ON public.funcionarios USING btree (indice_avaliacao);


--
-- Name: idx_funcionarios_matricula; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_matricula ON public.funcionarios USING btree (matricula);


--
-- Name: idx_funcionarios_nivel_cargo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_nivel_cargo ON public.funcionarios USING btree (nivel_cargo);


--
-- Name: idx_funcionarios_nome; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_nome ON public.funcionarios USING btree (nome);


--
-- Name: idx_funcionarios_pendencias; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_pendencias ON public.funcionarios USING btree (empresa_id, ativo, indice_avaliacao, data_ultimo_lote) WHERE (ativo = true);


--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);


--
-- Name: idx_funcionarios_ultima_avaliacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_ultima_avaliacao ON public.funcionarios USING btree (ultima_avaliacao_id) WHERE (ultima_avaliacao_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_ultima_avaliacao_status ON public.funcionarios USING btree (ultima_avaliacao_status) WHERE (ultima_avaliacao_status IS NOT NULL);


--
-- Name: idx_funcionarios_usuario_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_funcionarios_usuario_tipo ON public.funcionarios USING btree (usuario_tipo);


--
-- Name: idx_laudo_arquivos_remotos_laudo_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_arquivos_remotos_laudo_id ON public.laudo_arquivos_remotos USING btree (laudo_id);


--
-- Name: idx_laudo_arquivos_remotos_principal_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_laudo_arquivos_remotos_principal_unique ON public.laudo_arquivos_remotos USING btree (laudo_id) WHERE ((tipo)::text = 'principal'::text);


--
-- Name: idx_laudo_arquivos_remotos_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_arquivos_remotos_tipo ON public.laudo_arquivos_remotos USING btree (laudo_id, tipo);


--
-- Name: idx_laudo_downloads_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_downloads_created_at ON public.laudo_downloads USING btree (created_at);


--
-- Name: idx_laudo_downloads_laudo_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_downloads_laudo_id ON public.laudo_downloads USING btree (laudo_id);


--
-- Name: idx_laudo_downloads_usuario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_downloads_usuario ON public.laudo_downloads USING btree (usuario_cpf);


--
-- Name: idx_laudo_jobs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_jobs_created_at ON public.laudo_generation_jobs USING btree (created_at);


--
-- Name: idx_laudo_jobs_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudo_jobs_status ON public.laudo_generation_jobs USING btree (status);


--
-- Name: idx_laudos_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_criado_em ON public.laudos USING btree (criado_em DESC);


--
-- Name: idx_laudos_emissor; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_emissor ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emissor_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_emissor_cpf ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_laudos_enviado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_enviado_em ON public.laudos USING btree (enviado_em DESC);


--
-- Name: idx_laudos_hash; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_hash ON public.laudos USING btree (hash_pdf);


--
-- Name: idx_laudos_id_lote_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_id_lote_id ON public.laudos USING btree (id, lote_id);


--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote_status ON public.laudos USING btree (lote_id, status);


--
-- Name: idx_laudos_relatorio_individual; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_relatorio_individual ON public.laudos USING btree (relatorio_individual) WHERE (relatorio_individual IS NOT NULL);


--
-- Name: idx_laudos_relatorio_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_relatorio_lote ON public.laudos USING btree (relatorio_lote) WHERE (relatorio_lote IS NOT NULL);


--
-- Name: idx_laudos_relatorio_setor; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_relatorio_setor ON public.laudos USING btree (relatorio_setor) WHERE (relatorio_setor IS NOT NULL);


--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);


--
-- Name: idx_laudos_unico_enviado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_laudos_unico_enviado ON public.laudos USING btree (lote_id) WHERE ((status)::text = 'enviado'::text);


--
-- Name: INDEX idx_laudos_unico_enviado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_laudos_unico_enviado IS 'Previne duplicação: apenas um laudo enviado por lote';


--
-- Name: idx_logs_admin_acao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_logs_admin_acao ON public.logs_admin USING btree (acao);


--
-- Name: idx_logs_admin_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_logs_admin_cpf ON public.logs_admin USING btree (admin_cpf);


--
-- Name: idx_logs_admin_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_logs_admin_criado ON public.logs_admin USING btree (criado_em DESC);


--
-- Name: idx_logs_admin_entidade; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_logs_admin_entidade ON public.logs_admin USING btree (entidade_tipo, entidade_id);


--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('finalizado'::character varying)::text]));


--
-- Name: idx_lotes_avaliacao_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_avaliacao_emitido_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_emitido_em ON public.lotes_avaliacao USING btree (id) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_empresa_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_avaliacao_enviado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_enviado_em ON public.lotes_avaliacao USING btree (id) WHERE (enviado_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_finalizado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_finalizado_em ON public.lotes_avaliacao USING btree (finalizado_em DESC);


--
-- Name: idx_lotes_laudo_enviado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_laudo_enviado ON public.lotes_avaliacao USING btree (laudo_enviado_em) WHERE (laudo_enviado_em IS NOT NULL);


--
-- Name: idx_lotes_liberado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_liberado_em ON public.lotes_avaliacao USING btree (liberado_em DESC);


--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);


--
-- Name: idx_lotes_pronto_emissao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_pronto_emissao ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);


--
-- Name: idx_lotes_tipo_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_tipo_contratante ON public.lotes_avaliacao USING btree (clinica_id, contratante_id, status);


--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);


--
-- Name: idx_notificacoes_admin_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_criado ON public.notificacoes_admin USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);


--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);


--
-- Name: idx_notificacoes_contratacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_contratacao ON public.notificacoes USING btree (contratacao_personalizada_id);


--
-- Name: idx_notificacoes_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_criado_em ON public.notificacoes USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_destinatario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_destinatario ON public.notificacoes USING btree (destinatario_cpf, destinatario_tipo);


--
-- Name: idx_notificacoes_nao_lidas; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_nao_lidas ON public.notificacoes USING btree (destinatario_cpf) WHERE (lida = false);


--
-- Name: idx_notificacoes_resolvida; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_resolvida ON public.notificacoes USING btree (resolvida) WHERE (resolvida = false);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_notificacoes_tipo_resolvida; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_tipo_resolvida ON public.notificacoes USING btree (tipo, resolvida);


--
-- Name: idx_notificacoes_traducoes_chave; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_traducoes_chave ON public.notificacoes_traducoes USING btree (chave_traducao, idioma);


--
-- Name: idx_pagamentos_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_contratante ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contratante_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_contratante_id ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_external_transaction_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_external_transaction_id ON public.pagamentos USING btree (external_transaction_id);


--
-- Name: idx_pagamentos_idempotency_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_idempotency_key ON public.pagamentos USING btree (idempotency_key);


--
-- Name: idx_pagamentos_num_funcionarios; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_num_funcionarios ON public.pagamentos USING btree (numero_funcionarios) WHERE (numero_funcionarios IS NOT NULL);


--
-- Name: idx_pagamentos_parcelas; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_parcelas ON public.pagamentos USING btree (numero_parcelas) WHERE (numero_parcelas > 1);


--
-- Name: idx_pagamentos_provider_event_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_provider_event_id ON public.pagamentos USING btree (provider_event_id);


--
-- Name: idx_pagamentos_recibo_numero; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_recibo_numero ON public.pagamentos USING btree (recibo_numero);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: idx_payment_links_contrato_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_links_contrato_id ON public.payment_links USING btree (contrato_id);


--
-- Name: idx_payment_links_usado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payment_links_usado ON public.payment_links USING btree (usado) WHERE (usado = false);


--
-- Name: idx_pdf_jobs_created; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pdf_jobs_created ON public.pdf_jobs USING btree (created_at);


--
-- Name: idx_pdf_jobs_recibo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pdf_jobs_recibo ON public.pdf_jobs USING btree (recibo_id);


--
-- Name: idx_pdf_jobs_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pdf_jobs_status ON public.pdf_jobs USING btree (status) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying])::text[]));


--
-- Name: idx_questao_condicoes_dependente; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_questao_condicoes_dependente ON public.questao_condicoes USING btree (questao_dependente);


--
-- Name: idx_questao_condicoes_questao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_questao_condicoes_questao ON public.questao_condicoes USING btree (questao_id);


--
-- Name: idx_recibos_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_ativo ON public.recibos USING btree (ativo);


--
-- Name: idx_recibos_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_clinica ON public.recibos USING btree (clinica_id);


--
-- Name: idx_recibos_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_contratante ON public.recibos USING btree (contratante_id);


--
-- Name: idx_recibos_contrato; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_contrato ON public.recibos USING btree (contrato_id);


--
-- Name: idx_recibos_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_criado_em ON public.recibos USING btree (criado_em);


--
-- Name: idx_recibos_emitido_por; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_emitido_por ON public.recibos USING btree (emitido_por);


--
-- Name: idx_recibos_hash_pdf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_hash_pdf ON public.recibos USING btree (hash_pdf);


--
-- Name: idx_recibos_numero; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_numero ON public.recibos USING btree (numero_recibo);


--
-- Name: idx_recibos_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_pagamento ON public.recibos USING btree (pagamento_id);


--
-- Name: idx_recibos_pagamento_parcela; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_pagamento_parcela ON public.recibos USING btree (pagamento_id, parcela_numero);


--
-- Name: idx_recibos_parcela_numero; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_parcela_numero ON public.recibos USING btree (parcela_numero);


--
-- Name: idx_recibos_vigencia; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_vigencia ON public.recibos USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_respostas_avaliacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_respostas_avaliacao ON public.respostas USING btree (avaliacao_id);


--
-- Name: idx_resultados_avaliacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_resultados_avaliacao ON public.resultados USING btree (avaliacao_id);


--
-- Name: idx_resultados_avaliacao_grupo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_resultados_avaliacao_grupo ON public.resultados USING btree (avaliacao_id, grupo);


--
-- Name: idx_resultados_grupo_dominio; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_resultados_grupo_dominio ON public.resultados USING btree (grupo, dominio);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: idx_senhas_audit_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_senhas_audit_contratante ON public.contratantes_senhas_audit USING btree (contratante_id);


--
-- Name: idx_senhas_audit_data; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_senhas_audit_data ON public.contratantes_senhas_audit USING btree (executado_em);


--
-- Name: idx_senhas_audit_operacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_senhas_audit_operacao ON public.contratantes_senhas_audit USING btree (operacao);


--
-- Name: idx_session_logs_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_clinica ON public.session_logs USING btree (clinica_id);


--
-- Name: idx_session_logs_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_cpf ON public.session_logs USING btree (cpf);


--
-- Name: idx_session_logs_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_empresa ON public.session_logs USING btree (empresa_id);


--
-- Name: idx_session_logs_login; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_login ON public.session_logs USING btree (login_timestamp DESC);


--
-- Name: idx_session_logs_logout; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_logout ON public.session_logs USING btree (logout_timestamp DESC);


--
-- Name: idx_session_logs_perfil; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_logs_perfil ON public.session_logs USING btree (perfil);


--
-- Name: idx_templates_contrato_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_templates_contrato_ativo ON public.templates_contrato USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_templates_contrato_padrao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_templates_contrato_padrao ON public.templates_contrato USING btree (tipo_template, padrao) WHERE (padrao = true);


--
-- Name: idx_templates_contrato_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_templates_contrato_tipo ON public.templates_contrato USING btree (tipo_template);


--
-- Name: idx_tokens_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_contratante ON public.tokens_retomada_pagamento USING btree (contratante_id);


--
-- Name: idx_tokens_retomada_contratante; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_contratante ON public.tokens_retomada_pagamento USING btree (contratante_id);


--
-- Name: idx_tokens_retomada_expiracao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_expiracao ON public.tokens_retomada_pagamento USING btree (expira_em);


--
-- Name: idx_tokens_retomada_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_token ON public.tokens_retomada_pagamento USING btree (token);


--
-- Name: idx_tokens_retomada_usado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_usado ON public.tokens_retomada_pagamento USING btree (usado);


--
-- Name: idx_tokens_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_token ON public.tokens_retomada_pagamento USING btree (token) WHERE (usado = false);


--
-- Name: idx_vw_recibos_completos_mat_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_vw_recibos_completos_mat_criado ON public.vw_recibos_completos_mat USING btree (criado_em DESC);


--
-- Name: idx_vw_recibos_completos_mat_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_vw_recibos_completos_mat_id ON public.vw_recibos_completos_mat USING btree (id);


--
-- Name: idx_vw_recibos_completos_mat_numero; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_vw_recibos_completos_mat_numero ON public.vw_recibos_completos_mat USING btree (numero_recibo);


--
-- Name: ux_contratos_payment_link_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX ux_contratos_payment_link_token ON public.contratos USING btree (payment_link_token) WHERE (payment_link_token IS NOT NULL);


--
-- Name: avaliacoes audit_avaliacoes; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_avaliacoes AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: empresas_clientes audit_empresas_clientes; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_empresas_clientes AFTER INSERT OR DELETE OR UPDATE ON public.empresas_clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: funcionarios audit_funcionarios; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_funcionarios AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: laudos audit_laudos; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_laudos AFTER INSERT OR DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();


--
-- Name: contratantes tr_contratantes_sync_status_ativa; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER tr_contratantes_sync_status_ativa BEFORE INSERT OR UPDATE ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.contratantes_sync_status_ativa();


--
-- Name: contratantes tr_contratantes_sync_status_ativa_personalizado; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER tr_contratantes_sync_status_ativa_personalizado BEFORE INSERT OR UPDATE ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.contratantes_sync_status_ativa_personalizado();


--
-- Name: laudos trg_audit_laudo_creation; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_audit_laudo_creation AFTER INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_laudo_creation();


--
-- Name: contratantes_senhas trg_contratantes_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_contratantes_senhas_updated_at BEFORE UPDATE ON public.contratantes_senhas FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_senhas_updated_at();


--
-- Name: contratantes trg_contratantes_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_contratantes_updated_at BEFORE UPDATE ON public.contratantes FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION public.update_contratantes_updated_at();


--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();


--
-- Name: recibos trg_gerar_numero_recibo; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_gerar_numero_recibo BEFORE INSERT ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_gerar_numero_recibo();


--
-- Name: laudos trg_immutable_laudo; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_immutable_laudo BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_update_laudo_enviado();


--
-- Name: laudo_generation_jobs trg_laudo_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_laudo_jobs_updated_at BEFORE UPDATE ON public.laudo_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();


--
-- Name: notificacoes_admin trg_notificacoes_admin_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_notificacoes_admin_updated BEFORE UPDATE ON public.notificacoes_admin FOR EACH ROW EXECUTE FUNCTION public.atualizar_notificacao_admin_timestamp();


--
-- Name: pdf_jobs trg_pdf_jobs_update_timestamp; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_pdf_jobs_update_timestamp BEFORE UPDATE ON public.pdf_jobs FOR EACH ROW EXECUTE FUNCTION public.update_pdf_jobs_timestamp();


--
-- Name: contratantes_senhas trg_prevent_contratante_emissor; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_contratante_emissor BEFORE INSERT OR UPDATE ON public.contratantes_senhas FOR EACH ROW EXECUTE FUNCTION public.prevent_contratante_for_emissor();


--
-- Name: funcionarios trg_prevent_gestor_emissor; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_gestor_emissor BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.prevent_gestor_being_emissor();


--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();


--
-- Name: contratantes_senhas trg_protect_senhas; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_senhas BEFORE INSERT OR DELETE OR UPDATE ON public.contratantes_senhas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_contratantes_senhas();


--
-- Name: TRIGGER trg_protect_senhas ON contratantes_senhas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_protect_senhas ON public.contratantes_senhas IS 'CRITICO: Protege contra delecao acidental de senhas e audita todas as operacoes';


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: TRIGGER trg_recalc_lote_on_avaliacao_update ON avaliacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_update ON public.avaliacoes IS 'Atualiza status do lote quando avaliação muda de status.
Sistema é 100% MANUAL - emissor deve gerar laudos explicitamente.';


--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: recibos trg_recibos_criar_pdf_job; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_recibos_criar_pdf_job AFTER INSERT OR UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_criar_pdf_job();


--
-- Name: respostas trg_respostas_set_questao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_respostas_set_questao BEFORE INSERT OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.set_questao_from_item();


--
-- Name: contratacao_personalizada trg_sync_personalizado_status; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_sync_personalizado_status AFTER UPDATE ON public.contratacao_personalizada FOR EACH ROW WHEN (((new.status)::text IS DISTINCT FROM (old.status)::text)) EXECUTE FUNCTION public.sync_personalizado_status();


--
-- Name: contratos_planos trg_validar_parcelas; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_parcelas BEFORE INSERT OR UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.validar_parcelas_json();


--
-- Name: avaliacoes trg_validar_status_avaliacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_status_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.validar_status_avaliacao();


--
-- Name: contratantes trg_validar_transicao_status; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_transicao_status BEFORE UPDATE OF status ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.validar_transicao_status_contratante();


--
-- Name: clinica_configuracoes trigger_atualizar_timestamp_configuracoes; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes BEFORE UPDATE ON public.clinica_configuracoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_configuracoes();


--
-- Name: avaliacoes trigger_atualizar_ultima_avaliacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_atualizar_ultima_avaliacao AFTER UPDATE OF status, envio, inativada_em ON public.avaliacoes FOR EACH ROW WHEN (((((new.status)::text = ANY ((ARRAY['concluida'::character varying, 'inativada'::character varying])::text[])) AND ((old.status)::text <> (new.status)::text)) OR ((new.envio IS NOT NULL) AND (old.envio IS NULL)) OR ((new.inativada_em IS NOT NULL) AND (old.inativada_em IS NULL)))) EXECUTE FUNCTION public.atualizar_ultima_avaliacao_funcionario();


--
-- Name: templates_contrato trigger_garantir_template_padrao_unico; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_garantir_template_padrao_unico BEFORE INSERT OR UPDATE ON public.templates_contrato FOR EACH ROW WHEN ((new.padrao = true)) EXECUTE FUNCTION public.garantir_template_padrao_unico();


--
-- Name: funcionarios trigger_registrar_inativacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_registrar_inativacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((old.ativo IS DISTINCT FROM new.ativo)) EXECUTE FUNCTION public.registrar_inativacao_funcionario();


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();


--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE SET NULL;


--
-- Name: auditoria_recibos auditoria_recibos_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_funcionario_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE SET NULL;


--
-- Name: clinica_configuracoes clinica_configuracoes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT clinica_configuracoes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: clinicas_empresas clinicas_empresas_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: contratacao_personalizada contratacao_personalizada_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratantes contratantes_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos_planos contratos_planos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: contratos_planos contratos_planos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id);


--
-- Name: contratos_planos contratos_planos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: emissao_queue emissao_queue_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes empresas_clientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: fila_emissao fila_emissao_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: clinicas fk_clinicas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT fk_clinicas_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratantes_senhas fk_contratantes_senhas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT fk_contratantes_senhas_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes fk_empresas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT fk_empresas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_clinica; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao fk_lotes_clinica; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT fk_lotes_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: notificacoes_admin fk_notificacoes_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin fk_notificacoes_contrato; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin fk_notificacoes_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_clinica; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contrato; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE RESTRICT;


--
-- Name: respostas fk_respostas_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT fk_respostas_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados fk_resultados_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT fk_resultados_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: tokens_retomada_pagamento fk_tokens_contratante; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_tokens_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: tokens_retomada_pagamento fk_tokens_contrato; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_tokens_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: funcionarios funcionarios_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: funcionarios funcionarios_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE SET NULL;


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_downloads laudo_downloads_arquivo_remoto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_arquivo_remoto_id_fkey FOREIGN KEY (arquivo_remoto_id) REFERENCES public.laudo_arquivos_remotos(id) ON DELETE SET NULL;


--
-- Name: laudo_downloads laudo_downloads_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_generation_jobs laudo_generation_jobs_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos laudos_emissor_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_emissor_cpf_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey1 FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.contratantes_senhas(cpf);


--
-- Name: CONSTRAINT lotes_avaliacao_liberado_por_fkey ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT lotes_avaliacao_liberado_por_fkey ON public.lotes_avaliacao IS 'FK para contratantes_senhas - gestores não estão em funcionarios após refatoração';


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;


--
-- Name: payment_links payment_links_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: pdf_jobs pdf_jobs_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;


--
-- Name: respostas respostas_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados resultados_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: avaliacoes admin_all_avaliacoes; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_avaliacoes ON public.avaliacoes USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: empresas_clientes admin_all_empresas; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_empresas ON public.empresas_clientes USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: laudos admin_all_laudos; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_laudos ON public.laudos USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: lotes_avaliacao admin_all_lotes; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_lotes ON public.lotes_avaliacao USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: respostas admin_all_respostas; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_respostas ON public.respostas USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: resultados admin_all_resultados; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_resultados ON public.resultados USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY audit_logs_admin_all ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY audit_logs_admin_all ON audit_logs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY audit_logs_admin_all ON public.audit_logs IS 'Administradores podem ver todos os logs de auditoria';


--
-- Name: audit_logs audit_logs_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY audit_logs_admin_select ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: audit_logs audit_logs_own_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY audit_logs_own_select ON public.audit_logs FOR SELECT USING (((user_cpf)::text = public.current_user_cpf()));


--
-- Name: POLICY audit_logs_own_select ON audit_logs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY audit_logs_own_select ON public.audit_logs IS 'Usuários podem ver apenas seus próprios logs';


--
-- Name: audit_logs audit_logs_system_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY audit_logs_system_insert ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: POLICY audit_logs_system_insert ON audit_logs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY audit_logs_system_insert ON public.audit_logs IS 'Apenas sistema pode inserir logs via triggers';


--
-- Name: avaliacao_resets; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.avaliacao_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacao_resets avaliacao_resets_delete_policy; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacao_resets_delete_policy ON public.avaliacao_resets FOR DELETE USING (false);


--
-- Name: avaliacao_resets avaliacao_resets_insert_policy; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor_entidade'::text, 'admin'::text]))));


--
-- Name: avaliacao_resets avaliacao_resets_select_policy; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacao_resets_select_policy ON public.avaliacao_resets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.avaliacoes av
     JOIN public.lotes_avaliacao lot ON ((av.lote_id = lot.id)))
  WHERE ((av.id = avaliacao_resets.avaliacao_id) AND (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (lot.clinica_id = (current_setting('app.current_user_clinica_id'::text, true))::integer)) OR ((current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) AND (lot.contratante_id = (current_setting('app.current_user_contratante_id'::text, true))::integer)))))));


--
-- Name: avaliacao_resets avaliacao_resets_update_policy; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacao_resets_update_policy ON public.avaliacao_resets FOR UPDATE USING (false);


--
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: avaliacoes avaliacoes_own_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT USING ((((funcionario_cpf)::text = public.current_user_cpf()) AND (NOT public.current_user_is_gestor())));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: clinicas clinicas_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY clinicas_rh_select ON public.clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (id = public.current_user_clinica_id_optional())));


--
-- Name: contratantes contratantes_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY contratantes_admin_all ON public.contratantes USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_admin_delete ON public.empresas_clientes FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_admin_insert ON public.empresas_clientes FOR INSERT WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_admin_select ON public.empresas_clientes FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_admin_update ON public.empresas_clientes FOR UPDATE USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_block_admin ON public.empresas_clientes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: empresas_clientes empresas_rh_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_rh_delete ON public.empresas_clientes FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id()) AND (NOT (EXISTS ( SELECT 1
   FROM public.funcionarios f
  WHERE ((f.empresa_id = empresas_clientes.id) AND (f.ativo = true)))))));


--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id())));


--
-- Name: fila_emissao; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.fila_emissao ENABLE ROW LEVEL SECURITY;

--
-- Name: fila_emissao fila_emissao_admin_view; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY fila_emissao_admin_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY fila_emissao_admin_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY fila_emissao_admin_view ON public.fila_emissao IS 'Admin pode visualizar toda fila para auditoria (SELECT)';


--
-- Name: fila_emissao fila_emissao_emissor_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY fila_emissao_emissor_update ON public.fila_emissao FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_update ON fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY fila_emissao_emissor_update ON public.fila_emissao IS 'Emissor pode atualizar tentativas e erros (UPDATE)';


--
-- Name: fila_emissao fila_emissao_emissor_view; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY fila_emissao_emissor_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY fila_emissao_emissor_view ON public.fila_emissao IS 'Emissor pode visualizar fila de trabalho (SELECT)';


--
-- Name: fila_emissao fila_emissao_system_bypass; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY fila_emissao_system_bypass ON public.fila_emissao USING ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text)) WITH CHECK ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text));


--
-- Name: POLICY fila_emissao_system_bypass ON fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY fila_emissao_system_bypass ON public.fila_emissao IS 'Permite acesso total quando app.system_bypass = true (APIs internas)';


--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios funcionarios_admin_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_admin_delete ON public.funcionarios FOR DELETE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[])) AND (ativo = false)));


--
-- Name: POLICY funcionarios_admin_delete ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_admin_delete ON public.funcionarios IS 'Admin deleta RH, emissores e admins inativos';


--
-- Name: funcionarios funcionarios_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_admin_select ON public.funcionarios FOR SELECT USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[]))));


--
-- Name: POLICY funcionarios_admin_select ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_admin_select ON public.funcionarios IS 'Admin visualiza RH, emissores e outros admins (gestão de usuários do sistema)';


--
-- Name: funcionarios funcionarios_admin_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_admin_update ON public.funcionarios FOR UPDATE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[])))) WITH CHECK (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[]))));


--
-- Name: POLICY funcionarios_admin_update ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_admin_update ON public.funcionarios IS 'Admin atualiza RH, emissores e outros admins';


--
-- Name: funcionarios funcionarios_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_block_admin ON public.funcionarios AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios funcionarios_delete_simple; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_delete_simple ON public.funcionarios FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY funcionarios_delete_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_delete_simple ON public.funcionarios IS 'Política DELETE simplificada - Apenas Admin';


--
-- Name: funcionarios funcionarios_emissor_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_emissor_select ON public.funcionarios FOR SELECT USING (((current_setting('app.current_user_perfil'::text, true) = 'emissor'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying])::text[]))));


--
-- Name: POLICY funcionarios_emissor_select ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_emissor_select ON public.funcionarios IS 'Emissores visualizam RH e outros emissores (acesso global para coordenação de emissão)';


--
-- Name: funcionarios funcionarios_insert_simple; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_insert_simple ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_insert_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_insert_simple ON public.funcionarios IS 'Política INSERT simplificada - Admin, RH e Gestor podem inserir';


--
-- Name: funcionarios funcionarios_own_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_own_select ON public.funcionarios FOR SELECT USING ((((cpf)::text = public.current_user_cpf()) AND (NOT public.current_user_is_gestor())));


--
-- Name: POLICY funcionarios_own_select ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_own_select ON public.funcionarios IS 'Funcionários comuns veem apenas seus próprios dados. Gestores usam queries diretas sem RLS.';


--
-- Name: funcionarios funcionarios_own_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_own_update ON public.funcionarios FOR UPDATE USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: POLICY funcionarios_own_update ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_own_update ON public.funcionarios IS 'Funcionários comuns atualizam apenas seus próprios dados (sem mudar perfil, clínica ou entidade)';


--
-- Name: funcionarios funcionarios_select_simple; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_select_simple ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'admin'::text) OR ((public.current_user_perfil() = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_select_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_select_simple ON public.funcionarios IS 'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';


--
-- Name: funcionarios funcionarios_update_simple; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_update_simple ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_update_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_update_simple ON public.funcionarios IS 'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';


--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: laudos laudos_entidade_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY laudos_entidade_select ON public.laudos FOR SELECT USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor_entidade'::text])) AND (EXISTS ( SELECT 1
   FROM public.lotes_avaliacao
  WHERE ((lotes_avaliacao.id = laudos.lote_id) AND (lotes_avaliacao.contratante_id = public.current_user_contratante_id()))))));


--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_entidade_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_entidade_insert ON public.lotes_avaliacao FOR INSERT WITH CHECK (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor_entidade'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: lotes_avaliacao lotes_entidade_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_entidade_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor_entidade'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: POLICY lotes_entidade_select ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY lotes_entidade_select ON public.lotes_avaliacao IS 'Permite acesso de gestores de entidade (perfil gestor_entidade ou entidade) aos lotes da sua entidade';


--
-- Name: lotes_avaliacao lotes_entidade_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_entidade_update ON public.lotes_avaliacao FOR UPDATE USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor_entidade'::text])) AND (contratante_id = public.current_user_contratante_id()))) WITH CHECK (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor_entidade'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));


--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes notificacoes_clinica_own; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY notificacoes_clinica_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_clinica_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY notificacoes_clinica_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true)))) WITH CHECK (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_contratante_own; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY notificacoes_contratante_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_contratante_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY notificacoes_contratante_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true)))) WITH CHECK (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: pagamentos pagamentos_responsavel_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY pagamentos_responsavel_select ON public.pagamentos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.contratantes c
  WHERE ((c.id = pagamentos.contratante_id) AND ((c.responsavel_cpf)::text = public.current_user_cpf()) AND (c.status = 'aprovado'::public.status_aprovacao_enum)))));


--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions permissions_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY permissions_admin_all ON public.permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: permissions permissions_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY permissions_admin_select ON public.permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY permissions_admin_select ON permissions; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY permissions_admin_select ON public.permissions IS 'Apenas admin pode visualizar permissões';


--
-- Name: laudos policy_laudos_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_laudos_admin ON public.laudos FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));


--
-- Name: laudos policy_laudos_emissor; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_laudos_emissor ON public.laudos FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'emissor'::text));


--
-- Name: laudos policy_laudos_entidade; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_laudos_entidade ON public.laudos FOR SELECT USING (((current_setting('app.current_role'::text, true) = ANY (ARRAY['rh'::text, 'entidade'::text])) AND (EXISTS ( SELECT 1
   FROM public.lotes_avaliacao
  WHERE ((lotes_avaliacao.id = laudos.lote_id) AND (lotes_avaliacao.contratante_id = (NULLIF(current_setting('app.current_contratante_id'::text, true), ''::text))::integer))))));


--
-- Name: lotes_avaliacao policy_lotes_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_lotes_admin ON public.lotes_avaliacao FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));


--
-- Name: lotes_avaliacao policy_lotes_emissor; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_lotes_emissor ON public.lotes_avaliacao FOR SELECT USING (((current_setting('app.current_role'::text, true) = 'emissor'::text) AND ((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_processamento'::character varying, 'concluido'::character varying])::text[]))));


--
-- Name: lotes_avaliacao policy_lotes_entidade; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_lotes_entidade ON public.lotes_avaliacao FOR SELECT USING (((current_setting('app.current_role'::text, true) = ANY (ARRAY['rh'::text, 'entidade'::text])) AND (contratante_id = (NULLIF(current_setting('app.current_contratante_id'::text, true), ''::text))::integer)));


--
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: respostas respostas_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY respostas_block_admin ON public.respostas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: respostas respostas_own_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY respostas_own_select ON public.respostas FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

--
-- Name: resultados resultados_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY resultados_block_admin ON public.resultados AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: resultados resultados_own_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY resultados_own_select ON public.resultados FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = resultados.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: resultados resultados_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY resultados_rh_select ON public.resultados FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM (public.avaliacoes a
     JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((a.id = resultados.avaliacao_id) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


--
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY role_permissions_admin_all ON public.role_permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: role_permissions role_permissions_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY role_permissions_admin_select ON public.role_permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY role_permissions_admin_select ON role_permissions; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY role_permissions_admin_select ON public.role_permissions IS 'Apenas admin pode visualizar atribuições de permissões';


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_admin_all; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY roles_admin_all ON public.roles USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: roles roles_admin_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY roles_admin_select ON public.roles FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY roles_admin_select ON roles; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY roles_admin_select ON public.roles IS 'Apenas admin pode visualizar papéis';


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO dba_maintenance;


--
-- Name: TABLE analise_estatistica; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.analise_estatistica TO dba_maintenance;


--
-- Name: SEQUENCE analise_estatistica_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.analise_estatistica_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_access_denied; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_access_denied TO dba_maintenance;


--
-- Name: SEQUENCE audit_access_denied_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.audit_access_denied_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO dba_maintenance;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.audit_logs_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_stats_by_user; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_stats_by_user TO dba_maintenance;


--
-- Name: TABLE auditoria; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria TO dba_maintenance;


--
-- Name: TABLE auditoria_geral; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_geral TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_geral_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.auditoria_geral_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.auditoria_id_seq TO dba_maintenance;


--
-- Name: TABLE auditoria_laudos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_laudos TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_laudos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.auditoria_laudos_id_seq TO dba_maintenance;


--
-- Name: TABLE auditoria_recibos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_recibos TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_recibos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.auditoria_recibos_id_seq TO dba_maintenance;


--
-- Name: TABLE avaliacao_resets; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacao_resets TO dba_maintenance;


--
-- Name: TABLE avaliacoes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacoes TO dba_maintenance;


--
-- Name: SEQUENCE avaliacoes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.avaliacoes_id_seq TO dba_maintenance;


--
-- Name: TABLE backup_lotes_migracao_20260130; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.backup_lotes_migracao_20260130 TO dba_maintenance;


--
-- Name: TABLE clinica_configuracoes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinica_configuracoes TO dba_maintenance;


--
-- Name: SEQUENCE clinica_configuracoes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.clinica_configuracoes_id_seq TO dba_maintenance;


--
-- Name: TABLE clinicas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas TO dba_maintenance;


--
-- Name: TABLE clinicas_empresas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas_empresas TO dba_maintenance;


--
-- Name: SEQUENCE clinicas_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.clinicas_id_seq TO dba_maintenance;


--
-- Name: TABLE contratacao_personalizada; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratacao_personalizada TO dba_maintenance;


--
-- Name: SEQUENCE contratacao_personalizada_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratacao_personalizada_id_seq TO dba_maintenance;


--
-- Name: TABLE contratantes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratantes_id_seq TO dba_maintenance;


--
-- Name: TABLE contratantes_senhas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes_senhas TO dba_maintenance;


--
-- Name: TABLE contratantes_senhas_audit; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT ON TABLE public.contratantes_senhas_audit TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes_senhas_audit TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_senhas_audit_audit_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratantes_senhas_audit_audit_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_senhas_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratantes_senhas_id_seq TO dba_maintenance;


--
-- Name: TABLE contratos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos TO dba_maintenance;


--
-- Name: SEQUENCE contratos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratos_id_seq TO dba_maintenance;


--
-- Name: TABLE contratos_planos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos_planos TO dba_maintenance;


--
-- Name: SEQUENCE contratos_planos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.contratos_planos_id_seq TO dba_maintenance;


--
-- Name: TABLE emissao_queue; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.emissao_queue TO dba_maintenance;


--
-- Name: SEQUENCE emissao_queue_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.emissao_queue_id_seq TO dba_maintenance;


--
-- Name: TABLE empresas_clientes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.empresas_clientes TO dba_maintenance;


--
-- Name: SEQUENCE empresas_clientes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.empresas_clientes_id_seq TO dba_maintenance;


--
-- Name: TABLE fila_emissao; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fila_emissao TO dba_maintenance;


--
-- Name: SEQUENCE fila_emissao_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.fila_emissao_id_seq TO dba_maintenance;


--
-- Name: TABLE funcionarios; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO dba_maintenance;


--
-- Name: SEQUENCE funcionarios_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.funcionarios_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_arquivos_remotos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_arquivos_remotos TO dba_maintenance;


--
-- Name: SEQUENCE laudo_arquivos_remotos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.laudo_arquivos_remotos_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_downloads; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_downloads TO dba_maintenance;


--
-- Name: SEQUENCE laudo_downloads_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.laudo_downloads_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_generation_jobs; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_generation_jobs TO dba_maintenance;


--
-- Name: SEQUENCE laudo_generation_jobs_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.laudo_generation_jobs_id_seq TO dba_maintenance;


--
-- Name: TABLE laudos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudos TO dba_maintenance;


--
-- Name: SEQUENCE laudos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.laudos_id_seq TO dba_maintenance;


--
-- Name: TABLE logs_admin; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.logs_admin TO dba_maintenance;


--
-- Name: SEQUENCE logs_admin_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.logs_admin_id_seq TO dba_maintenance;


--
-- Name: TABLE lote_id_allocator; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lote_id_allocator TO dba_maintenance;


--
-- Name: TABLE lotes_avaliacao; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lotes_avaliacao TO dba_maintenance;


--
-- Name: SEQUENCE lotes_avaliacao_funcionarios_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_funcionarios_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE lotes_avaliacao_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_id_seq TO dba_maintenance;


--
-- Name: TABLE mfa_codes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mfa_codes TO dba_maintenance;


--
-- Name: SEQUENCE mfa_codes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.mfa_codes_id_seq TO dba_maintenance;


--
-- Name: TABLE migration_guidelines; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.migration_guidelines TO dba_maintenance;


--
-- Name: SEQUENCE migration_guidelines_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.migration_guidelines_id_seq TO dba_maintenance;


--
-- Name: TABLE notificacoes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes TO dba_maintenance;


--
-- Name: TABLE notificacoes_admin; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes_admin TO dba_maintenance;


--
-- Name: SEQUENCE notificacoes_admin_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.notificacoes_admin_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE notificacoes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.notificacoes_id_seq TO dba_maintenance;


--
-- Name: TABLE notificacoes_traducoes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes_traducoes TO dba_maintenance;


--
-- Name: SEQUENCE notificacoes_traducoes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.notificacoes_traducoes_id_seq TO dba_maintenance;


--
-- Name: TABLE pagamentos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pagamentos TO dba_maintenance;


--
-- Name: SEQUENCE pagamentos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.pagamentos_id_seq TO dba_maintenance;


--
-- Name: TABLE payment_links; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payment_links TO dba_maintenance;


--
-- Name: SEQUENCE payment_links_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.payment_links_id_seq TO dba_maintenance;


--
-- Name: TABLE pdf_jobs; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pdf_jobs TO dba_maintenance;


--
-- Name: SEQUENCE pdf_jobs_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.pdf_jobs_id_seq TO dba_maintenance;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO dba_maintenance;


--
-- Name: SEQUENCE permissions_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.permissions_id_seq TO dba_maintenance;


--
-- Name: TABLE planos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planos TO dba_maintenance;


--
-- Name: SEQUENCE planos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.planos_id_seq TO dba_maintenance;


--
-- Name: TABLE policy_expression_backups; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.policy_expression_backups TO dba_maintenance;


--
-- Name: SEQUENCE policy_expression_backups_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.policy_expression_backups_id_seq TO dba_maintenance;


--
-- Name: TABLE questao_condicoes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.questao_condicoes TO dba_maintenance;


--
-- Name: SEQUENCE questao_condicoes_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.questao_condicoes_id_seq TO dba_maintenance;


--
-- Name: TABLE recibos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.recibos TO dba_maintenance;


--
-- Name: SEQUENCE recibos_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.recibos_id_seq TO dba_maintenance;


--
-- Name: TABLE relatorio_templates; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.relatorio_templates TO dba_maintenance;


--
-- Name: SEQUENCE relatorio_templates_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.relatorio_templates_id_seq TO dba_maintenance;


--
-- Name: TABLE respostas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.respostas TO dba_maintenance;


--
-- Name: SEQUENCE respostas_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.respostas_id_seq TO dba_maintenance;


--
-- Name: TABLE resultados; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.resultados TO dba_maintenance;


--
-- Name: SEQUENCE resultados_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.resultados_id_seq TO dba_maintenance;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO dba_maintenance;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO dba_maintenance;


--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.roles_id_seq TO dba_maintenance;


--
-- Name: TABLE session_logs; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.session_logs TO dba_maintenance;


--
-- Name: SEQUENCE session_logs_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.session_logs_id_seq TO dba_maintenance;


--
-- Name: TABLE suspicious_activity; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suspicious_activity TO dba_maintenance;


--
-- Name: TABLE templates_contrato; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.templates_contrato TO dba_maintenance;


--
-- Name: SEQUENCE templates_contrato_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.templates_contrato_id_seq TO dba_maintenance;


--
-- Name: TABLE tokens_retomada_pagamento; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tokens_retomada_pagamento TO dba_maintenance;


--
-- Name: SEQUENCE tokens_retomada_pagamento_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.tokens_retomada_pagamento_id_seq TO dba_maintenance;


--
-- Name: TABLE usuarios; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios TO dba_maintenance;


--
-- Name: SEQUENCE usuarios_id_seq; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT USAGE ON SEQUENCE public.usuarios_id_seq TO dba_maintenance;


--
-- Name: TABLE v_relatorio_emissoes_usuario; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_relatorio_emissoes_usuario TO dba_maintenance;


--
-- Name: TABLE vw_analise_grupos_negativos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_analise_grupos_negativos TO dba_maintenance;


--
-- Name: TABLE vw_audit_trail_por_contratante; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_audit_trail_por_contratante TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_acessos_funcionarios; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_acessos_funcionarios TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_acessos_rh; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_acessos_rh TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_lotes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_lotes TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_senhas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT ON TABLE public.vw_auditoria_senhas TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_senhas TO dba_maintenance;


--
-- Name: TABLE vw_comparativo_empresas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_comparativo_empresas TO dba_maintenance;


--
-- Name: TABLE vw_funcionarios_por_lote; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_funcionarios_por_lote TO dba_maintenance;


--
-- Name: TABLE vw_lotes_detalhados; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_lotes_detalhados TO dba_maintenance;


--
-- Name: TABLE vw_notificacoes_admin_pendentes; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_notificacoes_admin_pendentes TO dba_maintenance;


--
-- Name: TABLE vw_notificacoes_nao_lidas; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_notificacoes_nao_lidas TO dba_maintenance;


--
-- Name: TABLE vw_recibos_completos; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_recibos_completos TO dba_maintenance;


--
-- Name: TABLE vw_recibos_completos_mat; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_recibos_completos_mat TO dba_maintenance;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO dba_maintenance;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO dba_maintenance;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- Name: vw_recibos_completos_mat; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: neondb_owner
--

REFRESH MATERIALIZED VIEW public.vw_recibos_completos_mat;


--
-- PostgreSQL database dump complete
--

