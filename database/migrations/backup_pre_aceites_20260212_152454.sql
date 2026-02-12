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
    'analise',
    'aguardando_aceite',
    'aguardando_aceite_contrato',
    'ativo',
    'inativo',
    'cancelado'
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

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: iniciada, em_andamento, concluida (feminino), inativada. Constraint aceita também concluido (retrocompatibilidade).';


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
-- Name: status_laudo_enum_old; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_laudo_enum_old AS ENUM (
    'emitido',
    'enviado'
);


ALTER TYPE public.status_laudo_enum_old OWNER TO neondb_owner;

--
-- Name: TYPE status_laudo_enum_old; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_laudo_enum_old IS 'Status de laudos: rascunho (em edição), emitido (finalizado), enviado (enviado ao cliente)';


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
-- Name: status_lote_enum_old; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_lote_enum_old AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido'
);


ALTER TYPE public.status_lote_enum_old OWNER TO neondb_owner;

--
-- Name: TYPE status_lote_enum_old; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TYPE public.status_lote_enum_old IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo), rascunho (em criação)';


--
-- Name: status_pagamento; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.status_pagamento AS ENUM (
    'aguardando_cobranca',
    'aguardando_pagamento',
    'pago',
    'expirado'
);


ALTER TYPE public.status_pagamento OWNER TO neondb_owner;

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
    'gestor',
    'rh',
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
    -- Registrar apenas mudanças significativas (SEM processamento_em)
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em THEN
      
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

COMMENT ON FUNCTION public.audit_lote_change() IS 'Trigger de auditoria para lotes. Migration 1011: Corrigida para remover campo obsoleto.';


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
-- Name: audit_status_pagamento_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.audit_status_pagamento_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento THEN
        INSERT INTO auditoria_logs (
            tabela,
            registro_id,
            acao,
            dados_antigos,
            dados_novos,
            usuario_cpf,
            sessao_id
        ) VALUES (
            'lotes_avaliacao',
            NEW.id,
            'UPDATE',
            jsonb_build_object('status_pagamento', OLD.status_pagamento),
            jsonb_build_object('status_pagamento', NEW.status_pagamento),
            current_setting('app.current_user_cpf', true),
            current_setting('app.session_id', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_status_pagamento_change() OWNER TO neondb_owner;

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


ALTER FUNCTION public.audit_trigger_function() OWNER TO neondb_owner;

--
-- Name: FUNCTION audit_trigger_function(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com fallback quando contexto da sessão não estiver disponível';


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
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
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
  INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
  WHERE
    fc.empresa_id = p_empresa_id
    AND fc.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado
      f.indice_avaliacao = 0
      OR
      -- Indice esta atrasado MAS nao tem avaliacao concluida recente
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao foi concluida ha mais de 1 ano
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao (apenas inativadas)
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

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionarios devem ser incluidos no proximo lote de avaliacao para uma empresa.
ARQUITETURA SEGREGADA: Usa funcionarios_clinicas em vez de empresa_id direto.
Versao atualizada em Migration 607 (DROP + CREATE para forcar atualizacao).';


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
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
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
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  WHERE
    fe.contratante_id = p_contratante_id
    AND fe.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado
      f.indice_avaliacao = 0
      OR
      -- Indice esta atrasado MAS nao tem avaliacao concluida recente
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao foi concluida ha mais de 1 ano
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao (apenas inativadas)
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

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionarios devem ser incluidos no proximo lote de avaliacao para um contratante (entidade).
ARQUITETURA SEGREGADA: Usa funcionarios_entidades em vez de contratante_id direto.
Versao atualizada em Migration 607 (DROP + CREATE para forcar atualizacao).';


--
-- Name: calcular_elegibilidade_lote_tomador(integer, integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    (CASE
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
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
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  WHERE
    fe.entidade_id = p_tomador_id
    AND fe.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado
      f.indice_avaliacao = 0
      OR
      -- Indice esta atrasado MAS nao tem avaliacao concluida recente
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao foi concluida ha mais de 1 ano
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao (apenas inativadas)
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


ALTER FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionarios devem ser incluidos no proximo lote de avaliacao para uma entidade (tomador).
ARQUITETURA SEGREGADA: Usa funcionarios_entidades em vez de tomador_id direto.
NOMENCLATURA: Substituiu calcular_elegibilidade_lote_contratante (legada).';


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
-- Name: calcular_valor_total_lote(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.calcular_valor_total_lote(p_lote_id integer) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_valor_por_funcionario DECIMAL(10,2);
    v_num_avaliacoes INTEGER;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Buscar valor por funcionÃ¡rio e contar avaliaÃ§Ãµes concluÃ­das
    SELECT 
        la.valor_por_funcionario,
        COUNT(a.id)
    INTO v_valor_por_funcionario, v_num_avaliacoes
    FROM lotes_avaliacao la
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    WHERE la.id = p_lote_id
    GROUP BY la.id, la.valor_por_funcionario;
    
    -- Se nÃ£o encontrou o lote ou nÃ£o hÃ¡ valor definido, retornar NULL
    IF v_valor_por_funcionario IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calcular valor total
    v_valor_total := v_valor_por_funcionario * v_num_avaliacoes;
    
    RETURN v_valor_total;
END;
$$;


ALTER FUNCTION public.calcular_valor_total_lote(p_lote_id integer) OWNER TO neondb_owner;

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
  v_allow_reset BOOLEAN;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    
    -- Verificar se reset está autorizado via contexto de sessão
    BEGIN
      v_allow_reset := COALESCE(current_setting('app.allow_reset', true)::BOOLEAN, false);
    EXCEPTION WHEN OTHERS THEN
      v_allow_reset := false;
    END;
    
    -- Se avaliação concluída e reset NÃO autorizado, bloquear
    IF v_status = 'concluida' AND NOT v_allow_reset THEN
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

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída, exceto se app.allow_reset=true';


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
    FROM tomadores 
    WHERE id = p_contratante_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contratante ID % não encontrado', p_contratante_id;
    END IF;
    
    -- Verificar se conta já existe
    SELECT EXISTS(
        SELECT 1 FROM entidades_senhas 
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
    
    -- Inserir senha na tabela entidades_senhas
    INSERT INTO entidades_senhas (
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
            'entidades_senhas', 
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
  FROM tomadores c
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
    'gestor',
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
  FROM tomadores
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
-- Name: criar_usuario_responsavel_apos_aprovacao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.criar_usuario_responsavel_apos_aprovacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cpf VARCHAR(11);
    v_nome VARCHAR(200);
    v_senha_padrao VARCHAR(6);
    v_senha_hash TEXT;
    v_tipo_usuario VARCHAR(50);
    v_clinica_id INTEGER;
    v_entidade_id INTEGER;
    v_usuario_existe BOOLEAN;
    v_senha_existe BOOLEAN;
    v_tabela_origem TEXT;
BEGIN
    -- Apenas processar quando status muda para 'aprovado'
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN

        v_cpf := NEW.responsavel_cpf;
        v_nome := NEW.responsavel_nome;

        -- Gerar senha padrao (6 ultimos digitos do CNPJ)
        v_senha_padrao := RIGHT(REPLACE(NEW.cnpj, '-', ''), 6);
        v_senha_hash := crypt(v_senha_padrao, gen_salt('bf'));

        -- Determinar tabela de origem através do TG_TABLE_NAME
        v_tabela_origem := TG_TABLE_NAME;

        -- Determinar tipo de usuario e IDs baseado na tabela de origem
        IF v_tabela_origem = 'clinicas' THEN
            v_tipo_usuario := 'rh';
            
            -- ✅ CORREÇÃO: Usar NEW.id diretamente ao invés de buscar por CNPJ
            -- Quando o trigger é executado na tabela clinicas, NEW.id já é o clinica_id correto
            v_clinica_id := NEW.id;
            v_entidade_id := NULL;
            
            RAISE NOTICE '[TRIGGER] Criando usuário RH para clinica_id=% (CPF=%)', v_clinica_id, v_cpf;

        ELSIF v_tabela_origem = 'entidades' THEN
            v_tipo_usuario := 'gestor';
            v_clinica_id := NULL;
            
            -- Para entidades, NEW.id já é o entidade_id correto
            v_entidade_id := NEW.id;
            
            RAISE NOTICE '[TRIGGER] Criando usuário Gestor para entidade_id=% (CPF=%)', v_entidade_id, v_cpf;
            
        ELSE
            -- Fallback para compatibilidade com NEW.tipo (caso tabela tenha campo tipo)
            IF NEW.tipo = 'clinica' THEN
                v_tipo_usuario := 'rh';
                v_clinica_id := NEW.id;  -- Usar NEW.id diretamente
                v_entidade_id := NULL;
            ELSE
                v_tipo_usuario := 'gestor';
                v_clinica_id := NULL;
                v_entidade_id := NEW.id;
            END IF;
        END IF;

        -- Verificar se usuario ja existe
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = v_cpf) INTO v_usuario_existe;

        -- Criar usuario se nao existir
        IF NOT v_usuario_existe THEN
            INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
            VALUES (v_cpf, v_nome, v_tipo_usuario, v_clinica_id, v_entidade_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            RAISE NOTICE '[TRIGGER] Usuario % criado com tipo_usuario=% clinica_id=% entidade_id=%', 
                         v_cpf, v_tipo_usuario, v_clinica_id, v_entidade_id;
        ELSE
            RAISE NOTICE '[TRIGGER] Usuario % já existe, pulando criação', v_cpf;
        END IF;

        -- Criar senha na tabela apropriada
        IF v_tabela_origem = 'clinicas' OR (v_tabela_origem != 'entidades' AND NEW.tipo = 'clinica') THEN
            SELECT EXISTS(SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em clinicas_senhas para RH % (clinica_id=%)', v_cpf, v_clinica_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha já existe em clinicas_senhas para CPF %', v_cpf;
            END IF;
        ELSE
            SELECT EXISTS(SELECT 1 FROM entidades_senhas WHERE cpf = v_cpf AND entidade_id = v_entidade_id) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
                VALUES (v_entidade_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em entidades_senhas para gestor % (entidade_id=%)', v_cpf, v_entidade_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha já existe em entidades_senhas para CPF % e entidade_id=%', v_cpf, v_entidade_id;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.criar_usuario_responsavel_apos_aprovacao() OWNER TO neondb_owner;

--
-- Name: FUNCTION criar_usuario_responsavel_apos_aprovacao(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.criar_usuario_responsavel_apos_aprovacao() IS 'Trigger function que cria automaticamente usuario RH ou Gestor quando entidade/clinica é aprovada.
CORREÇÃO (2026-02-08): Usa NEW.id diretamente ao invés de buscar por CNPJ, evitando atribuição de ID incorreto.';


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
-- Name: current_user_cpf(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_cpf() OWNER TO neondb_owner;

--
-- Name: FUNCTION current_user_cpf(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.current_user_cpf() IS 'Returns current user CPF from session context. 
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates CPF format (11 digits).';


--
-- Name: current_user_entidade_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_entidade_id() OWNER TO neondb_owner;

--
-- Name: current_user_entidade_id_optional(); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.current_user_entidade_id_optional() OWNER TO neondb_owner;

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
    RETURN v_perfil IN ('rh', 'gestor', 'admin');
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
-- Name: fn_audit_clinicas_senhas(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_audit_clinicas_senhas() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE 'Nova senha criada para CPF % na clÃ­nica %', NEW.cpf, NEW.clinica_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.senha_hash != NEW.senha_hash THEN
            RAISE NOTICE 'Senha alterada para CPF % na clÃ­nica %', NEW.cpf, NEW.clinica_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE NOTICE 'Senha removida para CPF % na clÃ­nica %', OLD.cpf, OLD.clinica_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_audit_clinicas_senhas() OWNER TO neondb_owner;

--
-- Name: fn_audit_entidades_senhas(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_audit_entidades_senhas() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Registrar INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'INSERT',
            NEW.entidade_id,  -- CORRIGIDO: era contratante_id
            NEW.cpf,
            NULL,
            NEW.senha_hash,
            current_user,
            'Nova senha criada'
        );
        RETURN NEW;
    
    -- Registrar UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'UPDATE',
            NEW.entidade_id,  -- CORRIGIDO: era contratante_id
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
        -- PROTECAO CRITICA: Verificar se a delecao esta autorizada
        IF current_setting('app.allow_senha_delete', true) IS NULL 
           OR current_setting('app.allow_senha_delete', true) != 'true' THEN
            
            -- Registrar tentativa bloqueada
            INSERT INTO entidades_senhas_audit (
                operacao,
                contratante_id,
                cpf,
                senha_hash_anterior,
                senha_hash_nova,
                executado_por,
                motivo
            ) VALUES (
                'DELETE',
                OLD.entidade_id,  -- CORRIGIDO: era contratante_id
                OLD.cpf,
                OLD.senha_hash,
                NULL,
                current_user,
                'TENTATIVA BLOQUEADA: Delete nao autorizado'
            );
            
            RAISE EXCEPTION 'OPERACAO BLOQUEADA: Delete de senhas requer autorizacao explicita. Use fn_delete_senha_autorizado() para deletar senhas com seguranca.';
        END IF;
        
        -- Se chegou aqui, está autorizado - registrar
        INSERT INTO entidades_senhas_audit (
            operacao,
            contratante_id,
            cpf,
            senha_hash_anterior,
            senha_hash_nova,
            executado_por,
            motivo
        ) VALUES (
            'DELETE',
            OLD.entidade_id,  -- CORRIGIDO: era contratante_id
            OLD.cpf,
            OLD.senha_hash,
            NULL,
            current_user,
            'Delete autorizado via funcao segura'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.fn_audit_entidades_senhas() OWNER TO neondb_owner;

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
-- Name: fn_obter_solicitacao_emissao(integer); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) RETURNS TABLE(lote_id integer, solicitado_por character varying, tipo_solicitante character varying, solicitado_em timestamp without time zone, tentativas integer, erro text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.lote_id,
    al.solicitado_por,
    al.tipo_solicitante,
    al.criado_em as solicitado_em,
    al.tentativas,
    al.erro
  FROM auditoria_laudos al
  WHERE al.lote_id = p_lote_id
    AND al.acao = 'solicitar_emissao'
  ORDER BY al.criado_em DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_obter_solicitacao_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) IS 'Busca a última solicitação de emissão para um lote específico';


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
  v_lote_id int;
BEGIN
  -- Determinar lote_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    v_lote_id := OLD.lote_id;
  ELSE
    v_lote_id := NEW.lote_id;
  END IF;

  -- Para UPDATE, só agir quando houve alteração de status
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatísticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  -- Se condição de conclusão for satisfeita, atualizar lote
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = v_lote_id AND status IS DISTINCT FROM 'concluido';
  ELSIF v_liberadas > 0 AND v_concluidas > 0 THEN
    -- Se tem liberadas e concluídas, mas ainda não todas: em_andamento
    UPDATE lotes_avaliacao
    SET status = 'em_andamento', atualizado_em = NOW()
    WHERE id = v_lote_id AND status = 'liberado';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliação muda. Marca lote como concluído quando todas avaliações liberadas estão finalizadas (concluídas ou inativadas). Emissão de laudo é manual.';


--
-- Name: fn_registrar_solicitacao_emissao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_registrar_solicitacao_emissao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Quando lote muda para 'emissao_solicitada', registrar na auditoria
  IF OLD.status != 'emissao_solicitada' AND NEW.status = 'emissao_solicitada' THEN
    -- Verificar se já existe registro recente (últimos 5 minutos)
    IF NOT EXISTS (
      SELECT 1 FROM auditoria_laudos
      WHERE lote_id = NEW.id
        AND acao = 'solicitar_emissao'
        AND criado_em > NOW() - INTERVAL '5 minutes'
    ) THEN
      INSERT INTO auditoria_laudos (
        lote_id,
        acao,
        status,
        criado_em
      ) VALUES (
        NEW.id,
        'solicitar_emissao',
        'pendente',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_registrar_solicitacao_emissao() OWNER TO neondb_owner;

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
-- Name: fn_reservar_id_laudo_on_lote_insert(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_reservar_id_laudo_on_lote_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        -- Reservar o ID do laudo (id = lote_id) em status 'rascunho'
        -- Status 'rascunho' permite criar laudo sem hash_pdf/emissor_cpf/emitido_em
        -- Isso evita disparar a trigger de validação fn_validar_laudo_emitido
        INSERT INTO laudos (id, lote_id, status)
        VALUES (NEW.id, NEW.id, 'rascunho')
        ON CONFLICT (id) DO NOTHING;

        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.fn_reservar_id_laudo_on_lote_insert() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_reservar_id_laudo_on_lote_insert(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_reservar_id_laudo_on_lote_insert() IS 'Reserva ID do laudo (igual ao lote) em status rascunho ao criar lote. Status rascunho permite criar sem hash_pdf, evitando erro de validação.';


--
-- Name: fn_validar_laudo_emitido(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_validar_laudo_emitido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Validar que hash_pdf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.hash_pdf IS NULL OR NEW.hash_pdf = '') THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem hash_pdf (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emitido_em existe quando status='emitido'
  IF NEW.status = 'emitido' AND NEW.emitido_em IS NULL THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem emitido_em (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emissor_cpf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.emissor_cpf IS NULL OR NEW.emissor_cpf = '') THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem emissor_cpf (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudanÃ§a de hash_pdf se laudo jÃ¡ foi emitido (imutabilidade)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido - hash_pdf nÃ£o pode ser alterado (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudanÃ§a de emitido_em se laudo jÃ¡ foi emitido
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.emitido_em IS DISTINCT FROM NEW.emitido_em THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido - emitido_em nÃ£o pode ser alterado (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir reversÃ£o de status 'emitido' para 'rascunho' (exceto em caso de erro - permitir se hash_pdf NULL)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND NEW.status = 'rascunho' AND OLD.hash_pdf IS NOT NULL THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido e nÃ£o pode voltar para rascunho (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_laudo_emitido() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_validar_laudo_emitido(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_validar_laudo_emitido() IS 'Valida o princÃ­pio da imutabilidade de laudos: somente permite status=emitido quando hash_pdf, emitido_em e emissor_cpf existem';


--
-- Name: fn_validar_status_avaliacao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_validar_status_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_respostas INT;
BEGIN
    -- Contar respostas únicas da avaliação
    SELECT COUNT(DISTINCT (grupo, item))
    INTO v_total_respostas
    FROM respostas
    WHERE avaliacao_id = NEW.id;
    
    -- Se tem 37+ respostas mas status não é 'concluida', corrigir
    IF v_total_respostas >= 37 AND NEW.status NOT IN ('concluida', 'inativada') THEN
        RAISE WARNING 'Avaliação % tem % respostas mas status é %. Ajustando para concluida.',
            NEW.id, v_total_respostas, NEW.status;
        
        NEW.status := 'concluida';
        NEW.envio := COALESCE(NEW.envio, NOW());
        NEW.atualizado_em := NOW();
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_status_avaliacao() OWNER TO neondb_owner;

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
-- Name: fn_validar_transicao_status_lote(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.fn_validar_transicao_status_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  transicoes_validas TEXT[];
BEGIN
  -- Se status não mudou, permitir
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Definir transições válidas para cada status
  CASE OLD.status
    WHEN 'rascunho' THEN
      transicoes_validas := ARRAY['ativo', 'cancelado'];
    WHEN 'ativo' THEN
      transicoes_validas := ARRAY['concluido', 'cancelado'];
    WHEN 'concluido' THEN
      transicoes_validas := ARRAY['emissao_solicitada', 'cancelado'];
    WHEN 'emissao_solicitada' THEN
      transicoes_validas := ARRAY['emissao_em_andamento', 'concluido', 'cancelado'];
    WHEN 'emissao_em_andamento' THEN
      transicoes_validas := ARRAY['laudo_emitido', 'emissao_solicitada', 'cancelado'];
    WHEN 'laudo_emitido' THEN
      transicoes_validas := ARRAY['finalizado'];
    WHEN 'cancelado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote cancelado não pode ter status alterado';
    WHEN 'finalizado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote finalizado não pode ter status alterado';
    ELSE
      RAISE EXCEPTION 'Status desconhecido: %', OLD.status;
  END CASE;

  -- Verificar se transição é válida
  IF NOT (NEW.status = ANY(transicoes_validas)) THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %. Transições permitidas: %',
      OLD.status, NEW.status, array_to_string(transicoes_validas, ', ');
  END IF;

  -- Atualizar timestamp
  NEW.atualizado_em := NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_transicao_status_lote() OWNER TO neondb_owner;

--
-- Name: FUNCTION fn_validar_transicao_status_lote(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.fn_validar_transicao_status_lote() IS 'Valida transições de status do lote conforme máquina de estados. Previne transições inválidas e garante integridade.';


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
-- Name: gerar_senha_padrao_cnpj(character varying); Type: FUNCTION; Schema: public; Owner: neondb_owner
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


ALTER FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) OWNER TO neondb_owner;

--
-- Name: FUNCTION gerar_senha_padrao_cnpj(p_cnpj character varying); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) IS 'Gera senha padrao usando os 6 ultimos digitos do CNPJ';


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
-- Name: get_next_contratante_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.get_next_contratante_id() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN nextval('seq_contratantes_id');
END;
$$;


ALTER FUNCTION public.get_next_contratante_id() OWNER TO neondb_owner;

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
-- Name: limpar_auditoria_laudos_antiga(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.limpar_auditoria_laudos_antiga() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM auditoria_laudos
  WHERE criado_em < NOW() - INTERVAL '1 year'
    AND status NOT IN ('erro', 'cancelado'); -- Manter erros para analise

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Limpeza de auditoria: % registros removidos', rows_deleted;
  
  RETURN rows_deleted;
END;
$$;


ALTER FUNCTION public.limpar_auditoria_laudos_antiga() OWNER TO neondb_owner;

--
-- Name: FUNCTION limpar_auditoria_laudos_antiga(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.limpar_auditoria_laudos_antiga() IS 'Remove registros de auditoria com mais de 1 ano (exceto erros). Executar mensalmente via cron.';


--
-- Name: limpar_indice_ao_deletar_avaliacao(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.limpar_indice_ao_deletar_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se a avaliação deletada era concluída, recalcular indice do funcionário
  IF OLD.status = 'concluida' THEN
    -- Buscar a última avaliação concluída restante
    WITH ultima_restante AS (
      SELECT 
        MAX(la.numero_ordem) as ultimo_numero,
        MAX(a.envio) as data_conclusao
      FROM avaliacoes a
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.funcionario_cpf = OLD.funcionario_cpf
      AND a.status = 'concluida'
      AND a.id <> OLD.id  -- Excluir a que está sendo deletada
    )
    UPDATE funcionarios
    SET 
      indice_avaliacao = COALESCE((SELECT ultimo_numero FROM ultima_restante), 0),
      data_ultimo_lote = (SELECT data_conclusao FROM ultima_restante),
      atualizado_em = NOW()
    WHERE cpf = OLD.funcionario_cpf;
  END IF;
  
  RETURN OLD;
END;
$$;


ALTER FUNCTION public.limpar_indice_ao_deletar_avaliacao() OWNER TO neondb_owner;

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
  FROM tomadores
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
  FROM tomadores c
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
    'gestor',
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
    -- Buscar o maior nÃºmero de ordem para a empresa e incrementar
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

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o prÃ³ximo nÃºmero de ordem sequencial para um novo lote da empresa';


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
  -- Previne alterações em lotes após emissão do laudo
  -- NOTA: Campo processamento_em foi DEFINITIVAMENTE removido (migration 130)
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar campos críticos
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se existe laudo emitido para este lote
    IF EXISTS (
      SELECT 1 FROM laudos 
      WHERE lote_id = OLD.id 
      AND status IN ('emitido', 'enviado')
    ) THEN
      -- Se laudo está emitido, prevenir mudanças em campos críticos
      -- MAS permitir atualização de datas de controle
      IF OLD.contratante_id IS DISTINCT FROM NEW.contratante_id
         OR OLD.numero_ordem IS DISTINCT FROM NEW.numero_ordem THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de lote com laudo emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_lote_mutation_during_emission() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_lote_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_lote_mutation_during_emission() IS 'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. 
Corrigida em migration 1010 (consolidação) - remove DEFINITIVAMENTE referência a processamento_em.
Substitui correção da migration 098 que pode ter sido sobrescrita pela migration 100.';


--
-- Name: prevent_lote_status_change_after_emission(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_lote_status_change_after_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se laudo foi emitido e tentando alterar status
    IF OLD.emitido_em IS NOT NULL AND NEW.status != OLD.status THEN
        -- Permitir apenas transição finalizado -> enviado (fluxo normal)
        IF OLD.status = 'finalizado' AND NEW.status = 'enviado' THEN
            RETURN NEW;
        END IF;
        
        RAISE EXCEPTION 
            'Não é possível alterar status do lote % (ID: %) após emissão do laudo. Status atual: %, tentativa: %',
            OLD.id, OLD.id, OLD.status, NEW.status
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Lotes com laudo emitido são imutáveis';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_lote_status_change_after_emission() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_lote_status_change_after_emission(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_lote_status_change_after_emission() IS 'Previne mudança de status do lote após emissão do laudo';


--
-- Name: prevent_modification_after_emission(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_modification_after_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    lote_emitido_em TIMESTAMP;
    lote_id_val INT;
BEGIN
    -- Determinar o lote_id (usar NEW para INSERT/UPDATE, OLD para DELETE)
    IF TG_OP = 'DELETE' THEN
        lote_id_val := OLD.lote_id;
    ELSE
        lote_id_val := NEW.lote_id;
    END IF;

    -- Buscar informações do lote
    SELECT emitido_em INTO lote_emitido_em
    FROM lotes_avaliacao
    WHERE id = lote_id_val;
    
    -- Se o laudo foi emitido, bloquear modificação
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'Não é possível modificar avaliação do lote % (emitido em %). Laudo foi emitido em %.',
            lote_id_val, lote_emitido_em, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos são imutáveis para garantir integridade';
    END IF;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.prevent_modification_after_emission() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificação de avaliações após emissão do laudo (imutabilidade) - versão corrigida sem coluna codigo';


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
-- Name: prevent_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações após emissão do laudo
  -- NOTA: Campo processamento_em foi DEFINITIVAMENTE removido (migration 130)
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante/após emissão
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informações do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo já foi emitido, prevenir mudanças críticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se está tentando mudar campos críticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de avaliação com laudo já emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_mutation_during_emission() OWNER TO neondb_owner;

--
-- Name: FUNCTION prevent_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.prevent_mutation_during_emission() IS 'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. 
Corrigida em migration 1010 (consolidação) - remove DEFINITIVAMENTE referência a processamento_em.
Substitui correções parciais das migrations 099 e 1009.';


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
-- Name: sync_entidade_contratante_id(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.sync_entidade_contratante_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- APENAS para lotes de entidade (não clínica)
  IF NEW.clinica_id IS NULL THEN
    -- Se entidade_id foi definido, copiar para contratante_id (legado)
    IF NEW.entidade_id IS NOT NULL AND NEW.contratante_id IS NULL THEN
      NEW.contratante_id := NEW.entidade_id;
    END IF;
    
    -- Se contratante_id foi definido (código legado), copiar para entidade_id
    IF NEW.contratante_id IS NOT NULL AND NEW.entidade_id IS NULL THEN
      NEW.entidade_id := NEW.contratante_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_entidade_contratante_id() OWNER TO neondb_owner;

--
-- Name: sync_personalizado_status(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.sync_personalizado_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando contratacao_personalizada muda para valor_definido, atualizar contratante
    IF NEW.status::text = 'valor_definido' AND (OLD.status IS NULL OR OLD.status::text = 'aguardando_valor_admin') THEN
        UPDATE tomadores 
        SET status = 'aguardando_pagamento', atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        RAISE NOTICE 'Contratante % atualizado para aguardando_pagamento', NEW.contratante_id;
    END IF;
    
    -- Quando pago, ativar contratante e disparar criação de conta
    IF NEW.status::text = 'pago' AND OLD.status::text = 'aguardando_pagamento' THEN
        UPDATE tomadores 
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

COMMENT ON FUNCTION public.sync_personalizado_status() IS 'Sincroniza status de contratacao_personalizada para tomadores. Cast ::text para evitar erros de comparação de enum.';


--
-- Name: tomadores_sync_status_ativa(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.tomadores_sync_status_ativa() RETURNS trigger
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


ALTER FUNCTION public.tomadores_sync_status_ativa() OWNER TO neondb_owner;

--
-- Name: FUNCTION tomadores_sync_status_ativa(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.tomadores_sync_status_ativa() IS 'Garante que ativa só é true quando pagamento_confirmado é true. Remove lógica antiga que forçava ativa=true para aguardando_pagamento.';


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
-- Name: trg_recalc_lote_on_avaliacao_change(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trg_recalc_lote_on_avaliacao_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Recalcular status do lote sempre que uma avaliação for modificada
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM fn_recalcular_status_lote_on_avaliacao_update(NEW.lote_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalcular_status_lote_on_avaliacao_update(OLD.lote_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.trg_recalc_lote_on_avaliacao_change() OWNER TO neondb_owner;

--
-- Name: FUNCTION trg_recalc_lote_on_avaliacao_change(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.trg_recalc_lote_on_avaliacao_change() IS 'Recalcula automaticamente o status do lote quando avaliação é inserida/atualizada/deletada';


--
-- Name: trg_reject_prohibited_roles_func(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.trg_reject_prohibited_roles_func() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Proibir criaÃ§Ã£o de contas de sistemas (devem ser criadas em `usuarios`)
  IF NEW.perfil IS NOT NULL AND NEW.perfil = ANY(ARRAY['admin','emissor','gestor_entidade','rh']) THEN
    RAISE EXCEPTION 'ERRO: Perfis de contas (admin/emissor/gestor/rh) nÃ£o permitidos em funcionarios. Use a tabela usuarios.'
      USING HINT = 'Migration: crie gestores em usuarios, nÃ£o em funcionarios.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_reject_prohibited_roles_func() OWNER TO neondb_owner;

--
-- Name: FUNCTION trg_reject_prohibited_roles_func(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.trg_reject_prohibited_roles_func() IS 'Trigger function que rejeita inserÃ§Ãµes/updates de roles proibidos em funcionarios.
Fornece mensagem de erro clara direcionando para a tabela usuarios.
Adicionado em Migration 410 (2026-02-05).';


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
-- Name: update_clinicas_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_clinicas_senhas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_clinicas_senhas_updated_at() OWNER TO neondb_owner;

--
-- Name: update_funcionarios_clinicas_timestamp(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_funcionarios_clinicas_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_funcionarios_clinicas_timestamp() OWNER TO neondb_owner;

--
-- Name: update_funcionarios_entidades_timestamp(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_funcionarios_entidades_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_funcionarios_entidades_timestamp() OWNER TO neondb_owner;

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
-- Name: update_usuarios_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_usuarios_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_usuarios_updated_at() OWNER TO neondb_owner;

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
  v_lote_status TEXT;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_ativas INTEGER;
  v_funcionarios_pendentes INTEGER;
  v_alertas TEXT[] := '{}';
  v_detalhes JSONB;
  v_bloqueante BOOLEAN := FALSE;
BEGIN
  -- Buscar dados do lote incluindo status
  SELECT empresa_id, numero_ordem, status 
  INTO v_empresa_id, v_numero_lote, v_lote_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;
  
  -- Contar avaliações do lote
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento', 'concluida')) AS ativas
  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_ativas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;
  
  -- Se o lote está concluído, NÃO verificar funcionários pendentes
  -- pois o lote já foi fechado e está aguardando apenas solicitação de emissão
  IF v_lote_status = 'concluido' THEN
    v_funcionarios_pendentes := 0;
  ELSE
    -- Verificar funcionários que deveriam estar no lote mas não estão
    -- (apenas para lotes ainda em andamento)
    SELECT COUNT(*) INTO v_funcionarios_pendentes
    FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
    WHERE NOT EXISTS (
      SELECT 1 FROM avaliacoes a 
      WHERE a.funcionario_cpf = el.funcionario_cpf 
      AND a.lote_id = p_lote_id
    );
  END IF;
  
  -- Gerar alertas informativos (não bloqueantes)
  IF v_avaliacoes_inativadas > 0 AND v_avaliacoes_concluidas > 0 THEN
    IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
      v_alertas := array_append(v_alertas, 
        'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' || 
        v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || 
        '). Verifique se há problemas sistêmicos.');
    END IF;
  END IF;
  
  IF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    v_alertas := array_append(v_alertas, 
      'PENDÊNCIA: ' || v_funcionarios_pendentes || 
      ' funcionário(s) deveriam estar neste lote mas não foram incluídos. Revise a elegibilidade.');
  END IF;
  
  -- Determinar se há bloqueios severos (erro definitivo)
  -- Um lote está pronto para emissão quando:
  -- 1. Tem status 'concluido' E
  -- 2. Tem pelo menos uma avaliação concluída E
  -- 3. Todas as avaliações ativas foram concluídas (concluidas = ativas)
  IF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas, 
      'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');
    v_bloqueante := TRUE;
  ELSIF v_lote_status = 'concluido' AND v_avaliacoes_concluidas > 0 THEN
    -- Lote concluído com avaliações finalizadas = PRONTO (não bloqueante)
    v_bloqueante := FALSE;
  ELSIF v_avaliacoes_ativas > 0 AND v_avaliacoes_concluidas < v_avaliacoes_ativas THEN
    -- Ainda há avaliações ativas não concluídas
    v_alertas := array_append(v_alertas,
      'PENDENTE: ' || (v_avaliacoes_ativas - v_avaliacoes_concluidas) || 
      ' avaliação(ões) ativa(s) ainda não concluída(s).');
    v_bloqueante := TRUE;
  ELSIF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    -- Há funcionários que deveriam estar no lote (apenas se lote não concluído)
    v_bloqueante := TRUE;
  END IF;

  -- Montar detalhes JSON
  v_detalhes := jsonb_build_object(
    'lote_id', p_lote_id,
    'numero_lote', v_numero_lote,
    'lote_status', v_lote_status,
    'total_avaliacoes', v_total_avaliacoes,
    'avaliacoes_concluidas', v_avaliacoes_concluidas,
    'avaliacoes_inativadas', v_avaliacoes_inativadas,
    'avaliacoes_ativas', v_avaliacoes_ativas,
    'funcionarios_pendentes', v_funcionarios_pendentes,
    'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_avaliacoes_ativas, 0)) * 100, 2)
  );

  -- Retornar resultado
  -- valido = TRUE quando NÃO há bloqueantes
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

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote está pronto para emissão de laudo. Lotes com status concluido e avaliações finalizadas são considerados válidos (Pronto). Apenas lotes em andamento verificam funcionários pendentes.';


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
    IF v_perfil IN ('gestor', 'rh', 'entidade') THEN
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

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida variáveis de sessão para Row Level Security. 
Espera: app.current_perfil, app.current_user_cpf
Opcional: app.current_contratante_id, app.current_clinica_id';


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
-- Name: validar_token_pagamento(uuid); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validar_token_pagamento(p_token uuid) RETURNS TABLE(lote_id integer, valido boolean, expirado boolean, status_atual public.status_pagamento, valor_por_funcionario numeric, num_avaliacoes integer, valor_total numeric, empresa_nome character varying, nome_tomador character varying, expira_em timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id AS lote_id,
        (la.link_pagamento_token = p_token 
         AND la.link_pagamento_expira_em > NOW() 
         AND la.status_pagamento = 'aguardando_pagamento') AS valido,
        (la.link_pagamento_expira_em <= NOW()) AS expirado,
        la.status_pagamento AS status_atual,
        la.valor_por_funcionario,
        COUNT(a.id)::INTEGER AS num_avaliacoes,
        (la.valor_por_funcionario * COUNT(a.id)) AS valor_total,
        e.nome AS empresa_nome,
        COALESCE(c.nome, e.nome) AS nome_tomador,
        la.link_pagamento_expira_em AS expira_em
    FROM lotes_avaliacao la
    JOIN empresas_clientes e ON e.id = la.empresa_id
    LEFT JOIN clinicas c ON c.id = la.clinica_id
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    WHERE la.link_pagamento_token = p_token
    GROUP BY la.id, e.nome, c.nome;
END;
$$;


ALTER FUNCTION public.validar_token_pagamento(p_token uuid) OWNER TO neondb_owner;

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
-- Name: validate_funcionario_clinica_empresa(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validate_funcionario_clinica_empresa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validar apenas que a empresa existe e pertence a alguma clÃ­nica registrada
    IF NOT EXISTS (SELECT 1 FROM empresas_clientes WHERE id = NEW.empresa_id) THEN
        RAISE EXCEPTION 'empresa_id % nÃ£o existe', NEW.empresa_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_funcionario_clinica_empresa() OWNER TO neondb_owner;

--
-- Name: validate_funcionario_clinica_tipo(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validate_funcionario_clinica_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validar que clinica_id existe em clinicas
    IF NOT EXISTS (
        SELECT 1 FROM clinicas 
        WHERE id = NEW.clinica_id
    ) THEN
        RAISE EXCEPTION 'clinica_id % nÃ£o existe em clinicas', NEW.clinica_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_funcionario_clinica_tipo() OWNER TO neondb_owner;

--
-- Name: validate_funcionario_entidade_tipo(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validate_funcionario_entidade_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validar que entidade_id existe e Ã© do tipo 'entidade'
    IF NOT EXISTS (
        SELECT 1 FROM entidades 
        WHERE id = NEW.entidade_id AND tipo = 'entidade'
    ) THEN
        RAISE EXCEPTION 'entidade_id % nÃ£o Ã© do tipo entidade ou nÃ£o existe', NEW.entidade_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_funcionario_entidade_tipo() OWNER TO neondb_owner;

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
  v_contratante_id INTEGER;
  v_total_avaliacoes_anteriores INTEGER := 0;
BEGIN
  -- Buscar empresa_id e contratante_id do lote (suporte a empresas e entidades)
  SELECT empresa_id, contratante_id INTO v_empresa_id, v_contratante_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRITICA'
    ) INTO v_tem_anomalia_critica;
  ELSE
    -- Para tomadores ainda nao aplicamos detecção de anomalias; não bloquear por anomalia
    v_tem_anomalia_critica := false;
  END IF;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e contar avaliacoes anteriores
  SELECT la.numero_ordem, a.statusINTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativacoes anteriores (qualquer lote anterior), respeitando contexto (empresa ou contratante)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada'
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Contar numero de avaliacoes anteriores (independente de status), respeitando contexto
  SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Se tem anomalia critica, permitir inativacao consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nao ha avaliacoes anteriores (funcionario recem-importado/inscrito), permitir sem sinalizar como forcada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores. Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2a inativacao (ja existe pelo menos 1 inativacao anterior), sinalizar como restricao
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. A partir da segunda inativacao o sistema exige justificativa detalhada.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT
      true AS permitido,
      'Inativacao permitida. Registre o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$;


ALTER FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) OWNER TO neondb_owner;

--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Atualizacao: primeira avaliacao apos importacao permitida; sinalizacao a partir da 2a inativacao';


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
-- Name: _migration_issues; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public._migration_issues OWNER TO neondb_owner;

--
-- Name: _migration_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public._migration_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migration_issues_id_seq OWNER TO neondb_owner;

--
-- Name: _migration_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public._migration_issues_id_seq OWNED BY public._migration_issues.id;


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
    clinica_id integer,
    entidade_id integer,
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
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    solicitado_por character varying(11),
    tipo_solicitante character varying(20),
    tentativas integer DEFAULT 0,
    erro text,
    CONSTRAINT chk_solicitation_has_requester CHECK ((((acao)::text <> ALL (ARRAY[('solicitar_emissao'::character varying)::text, ('solicitacao_manual'::character varying)::text])) OR (solicitado_por IS NOT NULL))),
    CONSTRAINT chk_status_valid CHECK (((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('processando'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text, ('erro'::character varying)::text, ('reprocessando'::character varying)::text, ('cancelado'::character varying)::text]))),
    CONSTRAINT chk_tipo_solicitante_valid CHECK (((tipo_solicitante IS NULL) OR ((tipo_solicitante)::text = ANY ((ARRAY['rh'::character varying, 'gestor'::character varying, 'admin'::character varying, 'emissor'::character varying])::text[]))))
);


ALTER TABLE public.auditoria_laudos OWNER TO neondb_owner;

--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.lote_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.lote_id IS 'Referencia ao lote de avaliacao. FK com ON DELETE CASCADE.';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Acao executada: emissao_automatica, envio_automatico, solicitacao_manual, solicitar_emissao, reprocessamento_manual, etc.';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status do evento: pendente, processando, emitido, enviado, erro, reprocessando, cancelado.';


--
-- Name: COLUMN auditoria_laudos.solicitado_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.solicitado_por IS 'CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes manuais.';


--
-- Name: COLUMN auditoria_laudos.tipo_solicitante; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.tipo_solicitante IS 'Tipo do solicitante: rh, gestor, admin, emissor. Obrigatório quando solicitado_por preenchido.';


--
-- Name: COLUMN auditoria_laudos.tentativas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.tentativas IS 'Contador de tentativas de processamento para retry logic. Default 0.';


--
-- Name: COLUMN auditoria_laudos.erro; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.auditoria_laudos.erro IS 'Mensagem de erro detalhada quando processamento falha. NULL se bem-sucedido.';


--
-- Name: CONSTRAINT chk_solicitation_has_requester ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT chk_solicitation_has_requester ON public.auditoria_laudos IS 'Garante que solicitações manuais sempre tenham o CPF do solicitante registrado.';


--
-- Name: CONSTRAINT chk_status_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT chk_status_valid ON public.auditoria_laudos IS 'Garante que apenas status válidos sejam registrados.';


--
-- Name: CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON public.auditoria_laudos IS 'Valida tipos permitidos de solicitante: rh, gestor, admin, emissor.';


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

COMMENT ON COLUMN public.avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor)';


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
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'iniciada'::character varying, 'em_andamento'::character varying, 'concluida'::character varying, 'concluido'::character varying, 'inativada'::character varying])::text[])))
);


ALTER TABLE public.avaliacoes OWNER TO neondb_owner;

--
-- Name: TABLE avaliacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.avaliacoes IS 'Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional';


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
-- Name: seq_contratantes_id; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.seq_contratantes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_contratantes_id OWNER TO neondb_owner;

--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinicas (
    id integer DEFAULT nextval('public.seq_contratantes_id'::regclass) NOT NULL,
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
    ativa boolean DEFAULT true,
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
    tipo character varying(20) DEFAULT 'clinica'::character varying,
    razao_social character varying(200),
    idioma_preferencial public.idioma_suportado DEFAULT 'pt_BR'::public.idioma_suportado,
    nome_fantasia text,
    CONSTRAINT clinicas_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT clinicas_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
);


ALTER TABLE public.clinicas OWNER TO neondb_owner;

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
-- Name: COLUMN clinicas.razao_social; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas.razao_social IS 'Razão social da clínica (diferente do nome fantasia)';


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
-- Name: clinicas_senhas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clinicas_senhas (
    id integer NOT NULL,
    clinica_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash text NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp with time zone,
    CONSTRAINT clinicas_senhas_cpf_check CHECK (((cpf)::text ~ '^\d{11}$'::text))
);


ALTER TABLE public.clinicas_senhas OWNER TO neondb_owner;

--
-- Name: TABLE clinicas_senhas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.clinicas_senhas IS 'Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)';


--
-- Name: COLUMN clinicas_senhas.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_senhas.clinica_id IS 'ReferÃªncia para a clÃ­nica';


--
-- Name: COLUMN clinicas_senhas.cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_senhas.cpf IS 'CPF do usuÃ¡rio RH';


--
-- Name: COLUMN clinicas_senhas.senha_hash; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_senhas.senha_hash IS 'Hash bcrypt da senha';


--
-- Name: COLUMN clinicas_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.clinicas_senhas.primeira_senha_alterada IS 'Indica se o usuÃ¡rio jÃ¡ alterou a senha inicial';


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clinicas_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_senhas_id_seq OWNER TO neondb_owner;

--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clinicas_senhas_id_seq OWNED BY public.clinicas_senhas.id;


--
-- Name: confirmacao_identidade; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.confirmacao_identidade (
    id integer NOT NULL,
    avaliacao_id integer,
    funcionario_cpf character(11) NOT NULL,
    nome_confirmado character varying(100) NOT NULL,
    cpf_confirmado character(11) NOT NULL,
    data_nascimento date NOT NULL,
    confirmado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address inet,
    user_agent text,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cpf_confirmado_match CHECK ((cpf_confirmado = funcionario_cpf))
);


ALTER TABLE public.confirmacao_identidade OWNER TO neondb_owner;

--
-- Name: TABLE confirmacao_identidade; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.confirmacao_identidade IS 'Registros de confirmação de identidade para fins de auditoria jurídica';


--
-- Name: COLUMN confirmacao_identidade.avaliacao_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.avaliacao_id IS 'ID da avaliação confirmada. Pode ser NULL para confirmações de identidade feitas no contexto de login.';


--
-- Name: COLUMN confirmacao_identidade.funcionario_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.funcionario_cpf IS 'CPF do funcionário que confirmou';


--
-- Name: COLUMN confirmacao_identidade.nome_confirmado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.nome_confirmado IS 'Nome exibido na confirmação';


--
-- Name: COLUMN confirmacao_identidade.cpf_confirmado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.cpf_confirmado IS 'CPF exibido na confirmação (deve ser igual ao funcionario_cpf)';


--
-- Name: COLUMN confirmacao_identidade.data_nascimento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.data_nascimento IS 'Data de nascimento exibida na confirmação';


--
-- Name: COLUMN confirmacao_identidade.confirmado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.confirmado_em IS 'Data/hora em que a confirmação foi realizada';


--
-- Name: COLUMN confirmacao_identidade.ip_address; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.ip_address IS 'Endereço IP de origem da confirmação';


--
-- Name: COLUMN confirmacao_identidade.user_agent; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.confirmacao_identidade.user_agent IS 'User-Agent do navegador usado na confirmação';


--
-- Name: confirmacao_identidade_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.confirmacao_identidade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.confirmacao_identidade_id_seq OWNER TO neondb_owner;

--
-- Name: confirmacao_identidade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.confirmacao_identidade_id_seq OWNED BY public.confirmacao_identidade.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
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
    entidade_id integer,
    tomador_id integer,
    tipo_tomador character varying(50) DEFAULT 'entidade'::character varying
);


ALTER TABLE public.contratos OWNER TO neondb_owner;

--
-- Name: TABLE contratos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.contratos IS 'Contratos gerados para tomadores. Fluxo simplificado sem tabelas intermediárias.';


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

COMMENT ON COLUMN public.contratos.valor_personalizado IS 'Valor personalizado por funcionário (para planos personalizados)';


--
-- Name: COLUMN contratos.tipo_tomador; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica - usado para buscar na tabela correta';


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
    entidade_id integer,
    CONSTRAINT contratos_planos_modalidade_pagamento_check CHECK (((modalidade_pagamento)::text = ANY (ARRAY[('a_vista'::character varying)::text, ('parcelado'::character varying)::text, (NULL::character varying)::text]))),
    CONSTRAINT contratos_planos_tipo_pagamento_check CHECK (((tipo_pagamento)::text = ANY (ARRAY[('boleto'::character varying)::text, ('cartao'::character varying)::text, ('pix'::character varying)::text, (NULL::character varying)::text])))
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
    representante_fone character varying(30),
    representante_email character varying(100),
    responsavel_email text
);


ALTER TABLE public.empresas_clientes OWNER TO neondb_owner;

--
-- Name: TABLE empresas_clientes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.empresas_clientes IS 'View vw_comparativo_empresas removida (usava empresa_id direta)';


--
-- Name: COLUMN empresas_clientes.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.empresas_clientes.clinica_id IS 'ID da clínica de medicina ocupacional que atende esta empresa (NOT NULL - obrigatório).
Arquitetura segregada: empresas pertencem APENAS a clínicas, NUNCA a entidades.';


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
-- Name: entidades; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.entidades (
    id integer DEFAULT nextval('public.seq_contratantes_id'::regclass) NOT NULL,
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
    ativa boolean DEFAULT true,
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
    tipo character varying(50) DEFAULT 'entidade'::character varying
);


ALTER TABLE public.entidades OWNER TO neondb_owner;

--
-- Name: TABLE entidades; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.entidades IS 'Entidades contratantes do sistema (empresas que contratam avaliações).
    Renomeada de "contratantes" em Migration 420 (2026-02-05).';


--
-- Name: COLUMN entidades.responsavel_nome; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN entidades.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.status IS 'pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento | ativo | inativo | cancelado';


--
-- Name: COLUMN entidades.aprovado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.aprovado_em IS 'Timestamp em que o contratante foi aprovado por um admin';


--
-- Name: COLUMN entidades.aprovado_por_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.aprovado_por_cpf IS 'CPF do admin que aprovou o contratante';


--
-- Name: COLUMN entidades.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';


--
-- Name: COLUMN entidades.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';


--
-- Name: COLUMN entidades.plano_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.plano_id IS 'ID do plano associado ao contratante';


--
-- Name: COLUMN entidades.data_liberacao_login; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.data_liberacao_login IS 'Data em que o login foi liberado após confirmação de pagamento';


--
-- Name: COLUMN entidades.contrato_aceito; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.entidades.contrato_aceito IS 'Indica se o contratante aceitou o contrato/política (usado para fluxo de pagamento e notificações)';


--
-- Name: entidades_senhas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.entidades_senhas (
    id integer NOT NULL,
    entidade_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash text NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp with time zone,
    contratante_id integer
);


ALTER TABLE public.entidades_senhas OWNER TO neondb_owner;

--
-- Name: TABLE entidades_senhas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.entidades_senhas IS 'Tabela de senhas de gestores de entidades';


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.entidades_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entidades_senhas_id_seq OWNER TO neondb_owner;

--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.entidades_senhas_id_seq OWNED BY public.entidades_senhas.id;


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
    atualizado_em timestamp without time zone DEFAULT now()
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
-- Name: fila_emissao_id_seq1; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.fila_emissao_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fila_emissao_id_seq1 OWNER TO neondb_owner;

--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.fila_emissao_id_seq1 OWNED BY public.fila_emissao.id;


--
-- Name: fk_migration_audit; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.fk_migration_audit OWNER TO neondb_owner;

--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.fk_migration_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fk_migration_audit_id_seq OWNER TO neondb_owner;

--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.fk_migration_audit_id_seq OWNED BY public.fk_migration_audit.id;


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
    matricula character varying(20),
    turno character varying(50),
    escala character varying(50),
    nivel_cargo character varying(50),
    ultima_avaliacao_id integer,
    ultima_avaliacao_data_conclusao timestamp without time zone,
    ultima_avaliacao_status character varying(20),
    ultimo_motivo_inativacao text,
    data_ultimo_lote timestamp without time zone,
    data_nascimento date,
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    incluido_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    inativado_em timestamp without time zone,
    inativado_por character varying(11),
    ultimo_lote_codigo character varying(20),
    data_admissao date,
    CONSTRAINT funcionarios_nivel_cargo_check CHECK ((((perfil)::text = ANY ((ARRAY['admin'::character varying, 'rh'::character varying, 'emissor'::character varying, 'gestor'::character varying])::text[])) OR (((perfil)::text = 'funcionario'::text) AND (nivel_cargo IS NOT NULL)))),
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['funcionario'::character varying, 'rh'::character varying, 'admin'::character varying, 'emissor'::character varying, 'gestor'::character varying])::text[]))),
    CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (((perfil)::text <> ALL (ARRAY[('gestor_entidade'::character varying)::text, ('rh'::character varying)::text]))),
    CONSTRAINT no_gestor_in_funcionarios CHECK (((perfil)::text <> 'gestor'::text))
);

ALTER TABLE ONLY public.funcionarios FORCE ROW LEVEL SECURITY;


ALTER TABLE public.funcionarios OWNER TO neondb_owner;

--
-- Name: TABLE funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.funcionarios IS 'Funcionarios do sistema (pessoas fisicas avaliadas).
ARQUITETURA SEGREGADA: Relacionamentos com entidades/clinicas sao gerenciados via:
- funcionarios_entidades: para entidades (gestores)
- funcionarios_clinicas: para clinicas (RH) e empresas clientes
IMPORTANTE: Esta tabela NAO tem mais FKs diretas para clinica_id, empresa_id ou entidade_id.';


--
-- Name: COLUMN funcionarios.perfil; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.perfil IS 'Perfil do usuario: funcionario (pessoa avaliada), rh (clinica), gestor (entidade), emissor, admin';


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
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo de 1 ano)';


--
-- Name: COLUMN funcionarios.data_nascimento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_nascimento IS 'Data de nascimento do funcionário (YYYY-MM-DD)';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunca fez)';


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
-- Name: COLUMN funcionarios.ultimo_lote_codigo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.ultimo_lote_codigo IS 'Código do lote da última avaliação (denormalizado)';


--
-- Name: COLUMN funcionarios.data_admissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios.data_admissao IS 'Data de admissão do funcionário na empresa';


--
-- Name: CONSTRAINT no_gestor_entidade_in_funcionarios ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT no_gestor_entidade_in_funcionarios ON public.funcionarios IS 'Gestores (gestor_entidade, rh) devem existir apenas em tabela usuarios. Proibido em funcionarios.';


--
-- Name: funcionarios_clinicas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funcionarios_clinicas (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    empresa_id integer NOT NULL,
    ativo boolean DEFAULT true,
    data_vinculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo timestamp without time zone,
    clinica_id integer NOT NULL
);


ALTER TABLE public.funcionarios_clinicas OWNER TO neondb_owner;

--
-- Name: TABLE funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.funcionarios_clinicas IS 'Relacionamento M:N entre funcionários e empresas clientes (via clínicas de medicina ocupacional). Permite histórico de vínculos.';


--
-- Name: COLUMN funcionarios_clinicas.funcionario_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.funcionario_id IS 'ID do funcionário (pessoa física avaliada)';


--
-- Name: COLUMN funcionarios_clinicas.empresa_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.empresa_id IS 'ID da empresa cliente (atendida pela clínica) à qual o funcionário pertence';


--
-- Name: COLUMN funcionarios_clinicas.ativo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.ativo IS 'TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)';


--
-- Name: COLUMN funcionarios_clinicas.data_vinculo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_vinculo IS 'Data em que o funcionário foi vinculado à empresa (via clínica)';


--
-- Name: COLUMN funcionarios_clinicas.data_desvinculo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_desvinculo IS 'Data em que o vínculo foi encerrado (NULL = vínculo ativo)';


--
-- Name: COLUMN funcionarios_clinicas.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_clinicas.clinica_id IS 'ID da clínica de medicina ocupacional que gerencia este funcionário';


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funcionarios_clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_clinicas_id_seq OWNER TO neondb_owner;

--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funcionarios_clinicas_id_seq OWNED BY public.funcionarios_clinicas.id;


--
-- Name: funcionarios_entidades; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.funcionarios_entidades (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    entidade_id integer NOT NULL,
    ativo boolean DEFAULT true,
    data_vinculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo timestamp without time zone
);


ALTER TABLE public.funcionarios_entidades OWNER TO neondb_owner;

--
-- Name: TABLE funcionarios_entidades; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.funcionarios_entidades IS 'Relacionamento M:N entre funcionários e entidades (tomadores tipo=entidade). Permite histórico de vínculos.';


--
-- Name: COLUMN funcionarios_entidades.funcionario_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_entidades.funcionario_id IS 'ID do funcionário (pessoa física avaliada)';


--
-- Name: COLUMN funcionarios_entidades.entidade_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_entidades.entidade_id IS 'ID da entidade (tomador tipo=entidade) - empresa que administra seus próprios funcionários com um gestor';


--
-- Name: COLUMN funcionarios_entidades.ativo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_entidades.ativo IS 'TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)';


--
-- Name: COLUMN funcionarios_entidades.data_vinculo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_entidades.data_vinculo IS 'Data em que o funcionário foi vinculado à entidade';


--
-- Name: COLUMN funcionarios_entidades.data_desvinculo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.funcionarios_entidades.data_desvinculo IS 'Data em que o vínculo foi encerrado (NULL = vínculo ativo)';


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.funcionarios_entidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_entidades_id_seq OWNER TO neondb_owner;

--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.funcionarios_entidades_id_seq OWNED BY public.funcionarios_entidades.id;


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
    job_id bigint,
    arquivo_remoto_provider character varying(32),
    arquivo_remoto_bucket character varying(255),
    arquivo_remoto_key character varying(1024),
    arquivo_remoto_url text,
    relatorio_individual bytea,
    relatorio_lote bytea,
    relatorio_setor bytea,
    hash_relatorio_individual character varying(64),
    hash_relatorio_lote character varying(64),
    hash_relatorio_setor character varying(64),
    arquivo_remoto_uploaded_at timestamp without time zone,
    arquivo_remoto_etag character varying(255),
    arquivo_remoto_size bigint,
    hash_pdf character varying(64),
    CONSTRAINT chk_laudos_emitido_antes_enviado CHECK (((enviado_em IS NULL) OR (emitido_em IS NULL) OR (emitido_em <= enviado_em))),
    CONSTRAINT chk_laudos_emitido_em_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (emitido_em IS NOT NULL)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_status_valid CHECK (((status)::text = ANY (ARRAY[('emitido'::character varying)::text, ('enviado'::character varying)::text, ('rascunho'::character varying)::text]))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id)),
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY['rascunho'::text, 'emitido'::text, 'enviado'::text])))
);


ALTER TABLE public.laudos OWNER TO neondb_owner;

--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.laudos IS 'RLS desabilitado - acesso restrito a emissores/gestores via validação manual';


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
-- Name: COLUMN laudos.arquivo_remoto_uploaded_at; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_uploaded_at IS 'Timestamp de quando o laudo foi feito upload para o storage remoto (Backblaze)';


--
-- Name: COLUMN laudos.arquivo_remoto_etag; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_etag IS 'ETag retornado pelo storage remoto para verificação de integridade';


--
-- Name: COLUMN laudos.arquivo_remoto_size; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_size IS 'Tamanho do arquivo em bytes no storage remoto';


--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';


--
-- Name: CONSTRAINT chk_laudos_emitido_antes_enviado ON laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT chk_laudos_emitido_antes_enviado ON public.laudos IS 'Garante que data de emissão é anterior à data de envio';


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
    id integer DEFAULT public.fn_next_lote_id() NOT NULL,
    clinica_id integer,
    empresa_id integer,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'ativo'::public.status_lote_enum,
    liberado_por character(11),
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hash_pdf character varying(64),
    numero_ordem integer DEFAULT 1 NOT NULL,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    setor_id integer,
    laudo_enviado_em timestamp without time zone,
    finalizado_em timestamp without time zone,
    entidade_id integer,
    contratante_id integer,
    status_pagamento public.status_pagamento,
    solicitacao_emissao_em timestamp with time zone,
    valor_por_funcionario numeric(10,2),
    link_pagamento_token uuid,
    link_pagamento_expira_em timestamp with time zone,
    link_pagamento_enviado_em timestamp with time zone,
    pagamento_metodo character varying(20),
    pagamento_parcelas integer,
    pago_em timestamp with time zone,
    CONSTRAINT expiracao_requer_token_check CHECK ((((link_pagamento_expira_em IS NOT NULL) AND (link_pagamento_token IS NOT NULL)) OR (link_pagamento_expira_em IS NULL))),
    CONSTRAINT lotes_avaliacao_entidade_or_clinica_empresa_check CHECK ((((entidade_id IS NOT NULL) AND (clinica_id IS NULL) AND (empresa_id IS NULL)) OR ((entidade_id IS NULL) AND (clinica_id IS NOT NULL) AND (empresa_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_owner_segregation_check CHECK ((((clinica_id IS NOT NULL) AND (empresa_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((entidade_id IS NOT NULL) AND (clinica_id IS NULL) AND (empresa_id IS NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'cancelado'::character varying, 'finalizado'::character varying, 'concluido'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text]))),
    CONSTRAINT pagamento_completo_check CHECK ((((status_pagamento = 'pago'::public.status_pagamento) AND (pagamento_metodo IS NOT NULL) AND (pagamento_parcelas IS NOT NULL) AND (pago_em IS NOT NULL)) OR ((status_pagamento <> 'pago'::public.status_pagamento) OR (status_pagamento IS NULL)))),
    CONSTRAINT pagamento_parcelas_range_check CHECK ((((pagamento_parcelas >= 1) AND (pagamento_parcelas <= 12)) OR (pagamento_parcelas IS NULL))),
    CONSTRAINT valor_funcionario_positivo_check CHECK (((valor_por_funcionario > (0)::numeric) OR (valor_por_funcionario IS NULL)))
);


ALTER TABLE public.lotes_avaliacao OWNER TO neondb_owner;

--
-- Name: TABLE lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliação - identificação apenas por ID (alinhado com laudos.id)';


--
-- Name: COLUMN lotes_avaliacao.id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.id IS 'Identificador Ãºnico do lote (igual ao ID do laudo correspondente)';


--
-- Name: COLUMN lotes_avaliacao.status; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.status IS 'Status do lote: rascunho, ativo, concluido, emissao_solicitada, emissao_em_andamento, laudo_emitido, cancelado, finalizado';


--
-- Name: COLUMN lotes_avaliacao.liberado_por; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clínica';


--
-- Name: COLUMN lotes_avaliacao.hash_pdf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.hash_pdf IS 'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';


--
-- Name: COLUMN lotes_avaliacao.numero_ordem; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.numero_ordem IS 'NÃºmero sequencial do lote na empresa (ex: 10 para o 10Âº lote da empresa)';


--
-- Name: COLUMN lotes_avaliacao.emitido_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.emitido_em IS 'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';


--
-- Name: COLUMN lotes_avaliacao.enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi marcado como enviado para RH/Entidade';


--
-- Name: COLUMN lotes_avaliacao.setor_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.setor_id IS 'Setor da empresa ao qual o lote pertence (opcional)';


--
-- Name: COLUMN lotes_avaliacao.laudo_enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo foi enviado pelo emissor para a clínica';


--
-- Name: COLUMN lotes_avaliacao.status_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.status_pagamento IS 'Status do pagamento: aguardando_cobranca, aguardando_pagamento, pago, expirado';


--
-- Name: COLUMN lotes_avaliacao.solicitacao_emissao_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.solicitacao_emissao_em IS 'Timestamp quando RH/Gestor solicitou a emissÃ£o';


--
-- Name: COLUMN lotes_avaliacao.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.valor_por_funcionario IS 'Valor em R$ cobrado por funcionÃ¡rio (definido pelo admin)';


--
-- Name: COLUMN lotes_avaliacao.link_pagamento_token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_token IS 'Token UUID Ãºnico para acesso pÃºblico ao link de pagamento';


--
-- Name: COLUMN lotes_avaliacao.link_pagamento_expira_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_expira_em IS 'Data/hora de expiraÃ§Ã£o do link de pagamento (7 dias)';


--
-- Name: COLUMN lotes_avaliacao.link_pagamento_enviado_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.link_pagamento_enviado_em IS 'Timestamp quando o link foi gerado e enviado';


--
-- Name: COLUMN lotes_avaliacao.pagamento_metodo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.pagamento_metodo IS 'MÃ©todo de pagamento escolhido: pix, boleto, cartao';


--
-- Name: COLUMN lotes_avaliacao.pagamento_parcelas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.pagamento_parcelas IS 'NÃºmero de parcelas (1-12) para cartÃ£o de crÃ©dito';


--
-- Name: COLUMN lotes_avaliacao.pago_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.lotes_avaliacao.pago_em IS 'Timestamp de confirmaÃ§Ã£o do pagamento';


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
    clinica_id integer,
    data_evento timestamp without time zone,
    tomador_tipo character varying(20),
    CONSTRAINT notificacao_destinatario_valido CHECK ((length(destinatario_cpf) > 0)),
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor'::text, 'funcionario'::text, 'contratante'::text, 'clinica'::text])))
);


ALTER TABLE public.notificacoes OWNER TO neondb_owner;

--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificacoes em tempo real para admin e gestores';


--
-- Name: COLUMN notificacoes.destinatario_cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.destinatario_cpf IS 'CPF do destinatário quando aplicável';


--
-- Name: COLUMN notificacoes.titulo; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.titulo IS 'Título resumido da notificação';


--
-- Name: COLUMN notificacoes.mensagem; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.mensagem IS 'Mensagem detalhada da notificação';


--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais especificos do tipo de notificacao';


--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiracao da notificacao (limpeza automatica)';


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
    contrato_id integer,
    pagamento_id integer,
    dados_contexto jsonb,
    lida boolean DEFAULT false,
    resolvida boolean DEFAULT false,
    data_leitura timestamp without time zone,
    data_resolucao timestamp without time zone,
    resolvido_por_cpf character varying(11),
    observacoes_resolucao text,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidade_id integer,
    clinica_id integer
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
-- Name: COLUMN notificacoes_admin.dados_contexto; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.notificacoes_admin.dados_contexto IS 'JSON com dados adicionais relevantes para a notificação';


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
    entidade_id integer,
    clinica_id integer,
    tomador_id integer,
    CONSTRAINT check_numero_parcelas CHECK (((numero_parcelas >= 1) AND (numero_parcelas <= 12))),
    CONSTRAINT pagamentos_entidade_or_clinica_check CHECK ((((entidade_id IS NOT NULL) AND (clinica_id IS NULL)) OR ((entidade_id IS NULL) AND (clinica_id IS NOT NULL))))
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
    CONSTRAINT pdf_jobs_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text])))
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
    entidade_id integer,
    CONSTRAINT recibos_entidade_or_clinica_check CHECK ((((entidade_id IS NOT NULL) AND (clinica_id IS NULL)) OR ((entidade_id IS NULL) AND (clinica_id IS NOT NULL)))),
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
    contrato_id integer NOT NULL,
    usado boolean DEFAULT false,
    usado_em timestamp without time zone,
    expira_em timestamp without time zone NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidade_id integer,
    CONSTRAINT chk_token_expiracao CHECK ((expira_em > criado_em))
);


ALTER TABLE public.tokens_retomada_pagamento OWNER TO neondb_owner;

--
-- Name: TABLE tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.tokens_retomada_pagamento IS 'Tokens de uso único para retomada de processo de pagamento';


--
-- Name: COLUMN tokens_retomada_pagamento.token; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.token IS 'Hash MD5 único para identificar a sessão de retomada';


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
-- Name: tomadores; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.tomadores AS
 SELECT entidades.id,
    entidades.nome,
    entidades.cnpj,
    'entidade'::character varying(20) AS tipo,
    entidades.email,
    entidades.responsavel_nome,
    entidades.responsavel_cpf,
    entidades.responsavel_email,
    entidades.responsavel_celular,
    entidades.plano_id,
    entidades.ativa,
    entidades.pagamento_confirmado,
    entidades.status,
    entidades.numero_funcionarios_estimado,
    entidades.criado_em,
    entidades.atualizado_em
   FROM public.entidades
  WHERE (entidades.id IS NOT NULL)
UNION ALL
 SELECT clinicas.id,
    clinicas.nome,
    clinicas.cnpj,
    'clinica'::character varying(20) AS tipo,
    clinicas.email,
    clinicas.responsavel_nome,
    clinicas.responsavel_cpf,
    clinicas.responsavel_email,
    clinicas.responsavel_celular,
    clinicas.plano_id,
    clinicas.ativa,
    clinicas.pagamento_confirmado,
    clinicas.status,
    clinicas.numero_funcionarios_estimado,
    clinicas.criado_em,
    clinicas.atualizado_em
   FROM public.clinicas
  WHERE (clinicas.id IS NOT NULL);


ALTER VIEW public.tomadores OWNER TO neondb_owner;

--
-- Name: COLUMN tomadores.ativa; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tomadores.ativa IS 'Indica se o contratante está ativo no sistema. DEFAULT false - ativação ocorre APENAS após confirmação de pagamento.';


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    nome character varying(200) NOT NULL,
    email character varying(100),
    clinica_id integer,
    entidade_id integer,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_usuario public.usuario_tipo_enum NOT NULL,
    CONSTRAINT usuarios_cpf_check CHECK (((cpf)::text ~ '^\d{11}$'::text)),
    CONSTRAINT usuarios_tipo_check CHECK ((((tipo_usuario = ANY (ARRAY['admin'::public.usuario_tipo_enum, 'emissor'::public.usuario_tipo_enum])) AND (clinica_id IS NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'rh'::public.usuario_tipo_enum) AND (clinica_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'gestor'::public.usuario_tipo_enum) AND (entidade_id IS NOT NULL) AND (clinica_id IS NULL))))
);


ALTER TABLE public.usuarios OWNER TO neondb_owner;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.usuarios IS 'Usuários do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidades_senhas/clinicas_senhas.';


--
-- Name: COLUMN usuarios.cpf; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.usuarios.cpf IS 'CPF único do usuário';


--
-- Name: COLUMN usuarios.clinica_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.usuarios.clinica_id IS 'Para RH: vínculo com clínica (senha em clinicas_senhas)';


--
-- Name: COLUMN usuarios.entidade_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.usuarios.entidade_id IS 'Para Gestor: vínculo com entidade (senha em entidades_senhas)';


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
-- Name: v_auditoria_emissoes; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_auditoria_emissoes AS
 SELECT la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.criado_em AS lote_criado_em,
    ec.nome AS empresa_nome,
    ec.cnpj AS empresa_cnpj,
    c.nome AS clinica_nome,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    l.hash_pdf,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
   FROM ((((public.lotes_avaliacao la
     JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.lote_id)))
  GROUP BY la.id, la.empresa_id, la.numero_ordem, la.status, la.emitido_em, la.enviado_em, la.criado_em, ec.nome, ec.cnpj, c.nome, l.hash_pdf, l.enviado_em, l.emitido_em;


ALTER VIEW public.v_auditoria_emissoes OWNER TO neondb_owner;

--
-- Name: VIEW v_auditoria_emissoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View de auditoria de emissões de laudos - ID-only (sem codigo/titulo/emergencia)';


--
-- Name: v_fila_emissao; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_fila_emissao AS
 SELECT id,
    lote_id,
    tentativas,
    3 AS max_tentativas,
    criado_em AS proxima_tentativa,
    erro,
    criado_em,
    criado_em AS atualizado_em,
    solicitado_por,
    tipo_solicitante,
    criado_em AS solicitado_em
   FROM public.auditoria_laudos al
  WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text])))
  ORDER BY criado_em;


ALTER VIEW public.v_fila_emissao OWNER TO neondb_owner;

--
-- Name: VIEW v_fila_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.v_fila_emissao IS 'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';


--
-- Name: v_relatorio_emissoes; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_relatorio_emissoes AS
 SELECT l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
        CASE
            WHEN (l.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (l.entidade_id IS NOT NULL) THEN 'entidade'::text
            ELSE NULL::text
        END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome,
    l.empresa_id,
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS avaliacoes_concluidas
   FROM (((((public.lotes_avaliacao l
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.tomadores t ON ((t.id = l.entidade_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
     LEFT JOIN public.laudos ld ON ((ld.lote_id = l.id)))
     LEFT JOIN public.avaliacoes a ON ((a.lote_id = l.id)))
  GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id, c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;


ALTER VIEW public.v_relatorio_emissoes OWNER TO neondb_owner;

--
-- Name: VIEW v_relatorio_emissoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.v_relatorio_emissoes IS 'Relatorio de emissoes de laudos com contexto (clinica ou entidade).
Compativel com arquitetura segregada de tomadores.';


--
-- Name: v_solicitacoes_emissao; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.v_solicitacoes_emissao AS
SELECT
    NULL::integer AS lote_id,
    NULL::public.status_pagamento AS status_pagamento,
    NULL::timestamp with time zone AS solicitacao_emissao_em,
    NULL::numeric(10,2) AS valor_por_funcionario,
    NULL::uuid AS link_pagamento_token,
    NULL::timestamp with time zone AS link_pagamento_enviado_em,
    NULL::character varying(20) AS pagamento_metodo,
    NULL::integer AS pagamento_parcelas,
    NULL::timestamp with time zone AS pago_em,
    NULL::character varying(200) AS empresa_nome,
    NULL::character varying(200) AS nome_tomador,
    NULL::character varying(200) AS solicitante_nome,
    NULL::character varying(11) AS solicitante_cpf,
    NULL::bigint AS num_avaliacoes_concluidas,
    NULL::numeric AS valor_total_calculado,
    NULL::timestamp without time zone AS lote_criado_em,
    NULL::timestamp without time zone AS lote_liberado_em,
    NULL::character varying(20) AS lote_status;


ALTER VIEW public.v_solicitacoes_emissao OWNER TO neondb_owner;

--
-- Name: VIEW v_solicitacoes_emissao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.v_solicitacoes_emissao IS 'View consolidada de solicitações de emissão de laudos com informações de pagamento. Usa entidades/clinicas (gestores/RH) ao invés das antigas tabelas empresas_clientes/tomadors.';


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
-- Name: vw_empresas_stats; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_empresas_stats AS
 SELECT ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.ativa,
    c.nome AS clinica_nome,
    count(fc.id) FILTER (WHERE (fc.ativo = true)) AS total_funcionarios,
    count(a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS total_avaliacoes_concluidas,
    count(DISTINCT l.id) AS total_lotes
   FROM (((((public.empresas_clientes ec
     JOIN public.clinicas c ON ((c.id = ec.clinica_id)))
     LEFT JOIN public.funcionarios_clinicas fc ON ((fc.empresa_id = ec.id)))
     LEFT JOIN public.funcionarios f ON (((f.id = fc.funcionario_id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  GROUP BY ec.id, ec.nome, ec.cnpj, ec.clinica_id, ec.ativa, c.nome;


ALTER VIEW public.vw_empresas_stats OWNER TO neondb_owner;

--
-- Name: VIEW vw_empresas_stats; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_empresas_stats IS 'Estatisticas de empresas com contadores de funcionarios e avaliacoes.
Usa funcionarios_clinicas para contagem correta em arquitetura segregada.';


--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: neondb_owner
--

CREATE VIEW public.vw_funcionarios_por_lote AS
 SELECT f.id AS funcionario_id,
    f.cpf,
    f.nome,
    f.email,
    f.matricula,
    f.setor,
    f.funcao,
    f.turno,
    f.escala,
    f.nivel_cargo,
    f.ativo,
    COALESCE(fe.entidade_id, fc.clinica_id) AS source_id,
        CASE
            WHEN (fe.id IS NOT NULL) THEN 'entidade'::text
            WHEN (fc.id IS NOT NULL) THEN 'clinica'::text
            ELSE NULL::text
        END AS source_type,
    fc.clinica_id,
    fc.empresa_id,
    a.id AS avaliacao_id,
    a.status AS status_avaliacao,
    a.inicio AS data_inicio,
    a.envio AS data_conclusao,
    a.lote_id,
    l.status AS lote_status,
    l.tipo AS lote_tipo
   FROM ((((public.funcionarios f
     LEFT JOIN public.funcionarios_entidades fe ON (((fe.funcionario_id = f.id) AND (fe.ativo = true))))
     LEFT JOIN public.funcionarios_clinicas fc ON (((fc.funcionario_id = f.id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  WHERE ((f.perfil)::text = 'funcionario'::text);


ALTER VIEW public.vw_funcionarios_por_lote OWNER TO neondb_owner;

--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias.
Inclui source_id e source_type para identificar o contexto (entidade ou clinica).
IMPORTANTE: Funcionarios podem aparecer em ambos contextos se tiverem vinculos historicos.';


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
-- Name: _migration_issues id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._migration_issues ALTER COLUMN id SET DEFAULT nextval('public._migration_issues_id_seq'::regclass);


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
-- Name: clinicas_senhas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_senhas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_senhas_id_seq'::regclass);


--
-- Name: confirmacao_identidade id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.confirmacao_identidade ALTER COLUMN id SET DEFAULT nextval('public.confirmacao_identidade_id_seq'::regclass);


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
-- Name: entidades_senhas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades_senhas ALTER COLUMN id SET DEFAULT nextval('public.entidades_senhas_id_seq'::regclass);


--
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq1'::regclass);


--
-- Name: fk_migration_audit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fk_migration_audit ALTER COLUMN id SET DEFAULT nextval('public.fk_migration_audit_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: funcionarios_clinicas id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_clinicas ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_clinicas_id_seq'::regclass);


--
-- Name: funcionarios_entidades id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_entidades ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_entidades_id_seq'::regclass);


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
-- Name: tomadores ativa; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tomadores ALTER COLUMN ativa SET DEFAULT false;


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: backup_laudos_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_laudos_contratante_1 (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
\.


--
-- Data for Name: backup_resultados_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_resultados_contratante_1 (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
\.


--
-- Data for Name: _migration_issues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._migration_issues (id, migration_version, issue_type, description, data, resolved, created_at) FROM stdin;
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

COPY public.audit_logs (id, user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, ip_address, user_agent, details, created_at, clinica_id, entidade_id) FROM stdin;
1	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_view on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
2	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_insert_base on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
3	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_system_insert on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
4	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_select_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
5	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_select on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
6	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_admin on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
7	00000000000	system	POLICY_UNEXPECTED	avaliacoes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_avaliacoes on table avaliacoes	2026-02-09 20:16:44.890059	\N	\N
8	00000000000	system	POLICY_UNEXPECTED	roles	\N	\N	\N	\N	\N	Unexpected policy: roles_admin_select on table roles	2026-02-09 20:16:44.890059	\N	\N
9	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_update on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
10	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_empresas on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
11	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_update on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
12	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_select on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
13	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_delete on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
14	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_delete on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
15	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_own on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
16	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: admin_all_laudos on table laudos	2026-02-09 20:16:44.890059	\N	\N
17	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_insert on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
18	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_delete on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
19	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_select_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
20	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_select on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
21	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_emissor on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
22	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_block_admin on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
23	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_admin_view on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
24	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_select_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
25	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_update_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
26	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: admin_all_lotes on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
27	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_delete_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
28	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_insert_base on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
29	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_delete_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
30	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_update on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
31	00000000000	system	POLICY_UNEXPECTED	permissions	\N	\N	\N	\N	\N	Unexpected policy: permissions_admin_select on table permissions	2026-02-09 20:16:44.890059	\N	\N
32	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_delete on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
33	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_insert on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
34	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_update on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
35	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_update on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
36	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_update on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
37	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: rh_lotes_empresas on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
38	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_own_select on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
39	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_delete_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
40	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_update_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
41	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: rh_empresas_proprias on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
42	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_delete on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
43	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: resultados_system_insert on table resultados	2026-02-09 20:16:44.890059	\N	\N
44	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_block_admin on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
45	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_update_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
46	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: admin_all_resultados on table resultados	2026-02-09 20:16:44.890059	\N	\N
47	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_insert_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
48	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_update_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
49	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_insert on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
50	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_rh_select on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
51	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_insert_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
52	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_admin on table laudos	2026-02-09 20:16:44.890059	\N	\N
53	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_select_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
54	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_own on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
55	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_delete_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
56	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_select on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
57	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_emissor on table laudos	2026-02-09 20:16:44.890059	\N	\N
58	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_update on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
59	00000000000	system	POLICY_UNEXPECTED	role_permissions	\N	\N	\N	\N	\N	Unexpected policy: role_permissions_admin_select on table role_permissions	2026-02-09 20:16:44.890059	\N	\N
60	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_admin_all on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
61	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_emissor_select on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
62	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_select on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
63	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_system_bypass on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
64	00000000000	system	POLICY_UNEXPECTED	respostas	\N	\N	\N	\N	\N	Unexpected policy: admin_all_respostas on table respostas	2026-02-09 20:16:44.890059	\N	\N
73	29930511059	gestor	INSERT	funcionarios	1008	\N	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 03:34:31.346394	\N	\N
74	29930511059	gestor	INSERT	funcionarios	1009	\N	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 03:34:31.346394	\N	\N
79	04703084945	rh	INSERT	empresas_clientes	5	\N	{"id": 5, "cep": "45612456", "cnpj": "22902898000126", "nome": "Empresa CM onlinwe", "ativa": true, "email": "55asds@dsdssdf.com", "cidade": "ipiopipo", "estado": "IO", "endereco": "rua lkj lk 89089", "telefone": "(46) 54654-6566", "criado_em": "2026-02-10T09:40:21.970549", "clinica_id": 104, "atualizado_em": "2026-02-10T09:40:21.970549", "responsavel_email": null, "representante_fone": "46465456456", "representante_nome": "dsdsd dfssfdf", "representante_email": "fssafsf@fasasf.com"}	\N	\N	Record created	2026-02-10 09:40:21.970549	\N	\N
83	04703084945	rh	INSERT	funcionarios	1014	\N	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 10:29:30.334004	\N	\N
84	04703084945	rh	INSERT	funcionarios	1015	\N	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 10:29:30.334004	\N	\N
90	\N	\N	lote_criado	lotes_avaliacao	1002	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1002, "empresa_id": null, "numero_ordem": 1}	2026-02-10 11:29:28.439742	\N	\N
91	\N	\N	laudo_criado	laudos	1002	\N	{"status": "rascunho", "lote_id": 1002, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 11:29:28.439742	\N	\N
94	29930511059	\N	liberar_lote	lotes_avaliacao	1002	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1002,"descricao":null,"data_filtro":null,"numero_ordem":1,"avaliacoes_criadas":0,"total_funcionarios":2}	2026-02-10 11:29:31.438192	\N	\N
95	\N	\N	lote_criado	lotes_avaliacao	1003	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1003, "empresa_id": 5, "numero_ordem": 1}	2026-02-10 11:30:56.337043	\N	\N
96	\N	\N	laudo_criado	laudos	1003	\N	{"status": "rascunho", "lote_id": 1003, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 11:30:56.337043	\N	\N
102	29930511059	\N	lote_criado	lotes_avaliacao	1004	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1004, "empresa_id": null, "numero_ordem": 2}	2026-02-10 12:10:36.722222	\N	\N
103	\N	\N	laudo_criado	laudos	1004	\N	{"status": "rascunho", "lote_id": 1004, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:10:36.722222	\N	\N
104	29930511059	gestor	INSERT	avaliacoes	10004	\N	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:10:36.722222	\N	\N
105	29930511059	gestor	INSERT	avaliacoes	10005	\N	{"id": 10005, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:10:36.722222	\N	\N
106	29930511059	\N	liberar_lote	lotes_avaliacao	1004	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1004,"descricao":null,"data_filtro":null,"numero_ordem":2,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 12:10:38.760206	\N	\N
109	04703084945	\N	lote_criado	lotes_avaliacao	1005	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1005, "empresa_id": 5, "numero_ordem": 2}	2026-02-10 12:21:47.979581	\N	\N
110	\N	\N	laudo_criado	laudos	1005	\N	{"status": "rascunho", "lote_id": 1005, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:21:47.979581	\N	\N
111	04703084945	rh	INSERT	avaliacoes	10006	\N	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:21:47.979581	\N	\N
112	04703084945	rh	INSERT	avaliacoes	10007	\N	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:21:47.979581	\N	\N
113	24626149073	gestor	INSERT	funcionarios	1016	\N	{"id": 1016, "cpf": "17285659010", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.com", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T12:33:30.10471", "matricula": null, "senha_hash": "$2a$10$CCEgsiac9DHv2LCEhDp54.WmpwHI6xW.x.R97M9LhjTdznOKPP9SO", "incluido_em": "2026-02-10T12:33:30.10471", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T12:33:30.10471", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 12:33:30.10471	\N	\N
114	24626149073	gestor	INSERT	funcionarios	1017	\N	{"id": 1017, "cpf": "77109022005", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.dot", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T12:33:30.10471", "matricula": null, "senha_hash": "$2a$10$c2WQE9ZQq9phaEeJ6ddxueJRLFsM9GVIhwuNrBAWfcnH8SfB24kje", "incluido_em": "2026-02-10T12:33:30.10471", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T12:33:30.10471", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 12:33:30.10471	\N	\N
115	24626149073	\N	lote_criado	lotes_avaliacao	1006	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1006, "empresa_id": null, "numero_ordem": 3}	2026-02-10 12:33:46.635319	\N	\N
116	\N	\N	laudo_criado	laudos	1006	\N	{"status": "rascunho", "lote_id": 1006, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:33:46.635319	\N	\N
117	24626149073	gestor	INSERT	avaliacoes	10008	\N	{"id": 10008, "envio": null, "inicio": "2026-02-10T12:33:47.269", "status": "iniciada", "lote_id": 1006, "criado_em": "2026-02-10T12:33:46.635319", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:33:46.635319", "funcionario_cpf": "77109022005", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:33:46.635319	\N	\N
118	24626149073	gestor	INSERT	avaliacoes	10009	\N	{"id": 10009, "envio": null, "inicio": "2026-02-10T12:33:47.269", "status": "iniciada", "lote_id": 1006, "criado_em": "2026-02-10T12:33:46.635319", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:33:46.635319", "funcionario_cpf": "17285659010", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:33:46.635319	\N	\N
119	24626149073	\N	liberar_lote	lotes_avaliacao	1006	\N	\N	177.146.166.16	\N	{"entidade_id":105,"entidade_nome":"DDSDSAGADSGGSD","tipo":"completo","lote_id":1006,"descricao":null,"data_filtro":null,"numero_ordem":3,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 12:33:48.496843	\N	\N
203	29930511059	\N	lote_criado	lotes_avaliacao	1007	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1007, "empresa_id": null, "numero_ordem": 4}	2026-02-10 14:13:18.784349	\N	\N
204	\N	\N	laudo_criado	laudos	1007	\N	{"status": "rascunho", "lote_id": 1007, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 14:13:18.784349	\N	\N
205	29930511059	gestor	INSERT	avaliacoes	10010	\N	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 14:13:18.784349	\N	\N
206	29930511059	gestor	INSERT	avaliacoes	10011	\N	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 14:13:18.784349	\N	\N
207	29930511059	\N	liberar_lote	lotes_avaliacao	1007	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1007,"descricao":null,"data_filtro":null,"numero_ordem":4,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 14:13:20.671377	\N	\N
215	49651696036	funcionario	UPDATE	avaliacoes	10010	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T15:56:23.013576", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 15:56:23.013576	\N	\N
217	49651696036	funcionario	UPDATE	avaliacoes	10010	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T15:56:23.013576", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10010, "envio": "2026-02-10T16:07:57.010649", "inicio": "2026-02-10T14:13:19.435", "status": "concluida", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:07:57.010649", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:07:57.010649	\N	\N
218	49651696036	funcionario	UPDATE	funcionarios	1009	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-10T16:07:57.010649", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:07:57.010649	\N	\N
219	36381045086	funcionario	UPDATE	avaliacoes	10011	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:09:09.982827	\N	\N
221	\N	system	MIGRATION_APPLIED	audit_lote_change	\N	\N	\N	\N	\N	{"descricao": "Removida referência a campo obsoleto do trigger de auditoria", "migration": "1011", "data_aplicacao": "2026-02-10T16:24:57.447608+00:00"}	2026-02-10 16:24:57.447608	\N	\N
222	36381045086	funcionario	UPDATE	avaliacoes	10011	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	{"id": 10011, "envio": "2026-02-10T16:29:35.288036", "inicio": "2026-02-10T14:13:19.435", "status": "concluida", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:29:35.288036", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:29:35.288036	\N	\N
223	36381045086	\N	lote_atualizado	lotes_avaliacao	1007	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1007, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-10 16:29:35.288036	\N	\N
224	\N	\N	lote_status_change	lotes_avaliacao	1007	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-10 16:29:35.288036	\N	\N
225	36381045086	funcionario	UPDATE	funcionarios	1008	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-10T16:29:35.288036", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:29:35.288036	\N	\N
226	03175612008	funcionario	UPDATE	avaliacoes	10006	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:31:24.644575	\N	\N
227	03175612008	funcionario	UPDATE	avaliacoes	10006	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10006, "envio": "2026-02-10T16:39:11.716723", "inicio": "2026-02-10T12:21:49.087", "status": "concluida", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:39:11.716723", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:39:11.716723	\N	\N
228	03175612008	funcionario	UPDATE	funcionarios	1015	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-10T16:39:11.716723", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:39:11.716723	\N	\N
229	73922219063	funcionario	UPDATE	avaliacoes	10007	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:40:30.138217	\N	\N
230	73922219063	funcionario	UPDATE	avaliacoes	10007	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10007, "envio": "2026-02-10T16:53:16.783516", "inicio": "2026-02-10T12:21:49.087", "status": "concluida", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:53:16.783516", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:53:16.783516	\N	\N
231	73922219063	\N	lote_atualizado	lotes_avaliacao	1005	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1005, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-10 16:53:16.783516	\N	\N
232	\N	\N	lote_status_change	lotes_avaliacao	1005	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-10 16:53:16.783516	\N	\N
245	65648556055	funcionario	UPDATE	avaliacoes	10012	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:06:39.418917	\N	\N
233	73922219063	funcionario	UPDATE	funcionarios	1014	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-10T16:53:16.783516", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:53:16.783516	\N	\N
234	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1005	\N	{"lote_id": 1005, "file_size": 641281, "duration_ms": 2169, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1005/laudo-1770756960778-42nlgb.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1005/laudo-1770756960778-42nlgb.pdf"}	\N	\N	\N	2026-02-10 20:55:24.576836	\N	\N
235	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1007	\N	{"lote_id": 1007, "file_size": 577310, "duration_ms": 2425, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf"}	\N	\N	\N	2026-02-10 22:33:33.789723	\N	\N
236	29930511059	gestor	INSERT	funcionarios	1018	\N	{"id": 1018, "cpf": "19778990050", "nome": "Jaiemx o1", "ativo": true, "email": "jorwerwero.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 00:59:46.425929	\N	\N
237	29930511059	gestor	INSERT	funcionarios	1019	\N	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 00:59:46.425929	\N	\N
238	35051737030	gestor	INSERT	funcionarios	1020	\N	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:04:34.424847	\N	\N
239	35051737030	gestor	INSERT	funcionarios	1021	\N	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:04:34.424847	\N	\N
240	35051737030	\N	lote_criado	lotes_avaliacao	1008	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1008, "empresa_id": null, "numero_ordem": 5}	2026-02-11 01:05:34.180476	\N	\N
241	35051737030	gestor	INSERT	avaliacoes	10012	\N	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:05:34.180476	\N	\N
242	35051737030	gestor	INSERT	avaliacoes	10013	\N	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:05:34.180476	\N	\N
243	35051737030	\N	liberar_lote	lotes_avaliacao	1008	\N	\N	177.146.166.16	\N	{"entidade_id":106,"entidade_nome":"Empresa Privada Final","tipo":"completo","lote_id":1008,"descricao":null,"data_filtro":null,"numero_ordem":5,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-11 01:05:36.123922	\N	\N
267	32911756037	\N	lote_atualizado	lotes_avaliacao	1009	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1009, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-11 02:01:46.606336	\N	\N
268	\N	\N	lote_status_change	lotes_avaliacao	1009	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-11 02:01:46.606336	\N	\N
246	18597536047	funcionario	UPDATE	avaliacoes	10013	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:09:15.233281	\N	\N
247	18597536047	funcionario	UPDATE	avaliacoes	10013	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	{"id": 10013, "envio": "2026-02-11T01:12:17.053789", "inicio": "2026-02-11T01:05:34.866", "status": "concluida", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:12:17.053789", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:12:17.053789	\N	\N
248	18597536047	funcionario	UPDATE	funcionarios	1020	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-11T01:12:17.053789", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:12:17.053789	\N	\N
249	65648556055	funcionario	UPDATE	avaliacoes	10012	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	{"id": 10012, "envio": "2026-02-11T01:14:43.757296", "inicio": "2026-02-11T01:05:34.866", "status": "concluida", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:14:43.757296", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:14:43.757296	\N	\N
250	65648556055	\N	lote_atualizado	lotes_avaliacao	1008	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1008, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-11 01:14:43.757296	\N	\N
251	\N	\N	lote_status_change	lotes_avaliacao	1008	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-11 01:14:43.757296	\N	\N
252	65648556055	funcionario	UPDATE	funcionarios	1021	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-11T01:14:43.757296", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:14:43.757296	\N	\N
253	\N	\N	laudo_criado	laudos	1008	\N	{"status": "rascunho", "lote_id": 1008, "tamanho_pdf": null}	\N	\N	\N	2026-02-11 01:17:41.164409	\N	\N
254	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1008	\N	{"lote_id": 1008, "file_size": 640751, "duration_ms": 1865, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1008/laudo-1770772751916-8j47zr.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1008/laudo-1770772751916-8j47zr.pdf"}	\N	\N	\N	2026-02-11 01:18:34.496114	\N	\N
255	64411953056	rh	INSERT	empresas_clientes	6	\N	{"id": 6, "cep": "83065-370", "cnpj": "82429448000190", "nome": "Empresa clin fina 001", "ativa": true, "email": "sdfsdf@assa.com", "cidade": "São José dos Pinhais", "estado": "FE", "endereco": "Rua Antônio Bianchetti, 90", "telefone": "(45) 64546-6545", "criado_em": "2026-02-11T01:52:11.752978", "clinica_id": 107, "atualizado_em": "2026-02-11T01:52:11.752978", "responsavel_email": null, "representante_fone": "89798798799", "representante_nome": "GEstor CLun fianl", "representante_email": "rerewewr@fdsfds.com"}	\N	\N	Record created	2026-02-11 01:52:11.752978	\N	\N
256	64411953056	rh	INSERT	funcionarios	1022	\N	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:52:46.462014	\N	\N
257	64411953056	rh	INSERT	funcionarios	1023	\N	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:52:46.462014	\N	\N
258	64411953056	\N	lote_criado	lotes_avaliacao	1009	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1009, "empresa_id": 6, "numero_ordem": 1}	2026-02-11 01:53:04.39101	\N	\N
259	\N	\N	laudo_criado	laudos	1009	\N	{"status": "rascunho", "lote_id": 1009, "tamanho_pdf": null}	\N	\N	\N	2026-02-11 01:53:04.39101	\N	\N
260	64411953056	rh	INSERT	avaliacoes	10014	\N	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:53:04.39101	\N	\N
261	64411953056	rh	INSERT	avaliacoes	10015	\N	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:53:04.39101	\N	\N
262	85804194097	funcionario	UPDATE	avaliacoes	10014	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:55:04.736853	\N	\N
263	85804194097	funcionario	UPDATE	avaliacoes	10014	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	{"id": 10014, "envio": "2026-02-11T01:57:55.987926", "inicio": "2026-02-11T01:53:05.501", "status": "concluida", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:57:55.987926", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:57:55.987926	\N	\N
264	85804194097	funcionario	UPDATE	funcionarios	1022	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": "2026-02-11T01:57:55.987926", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:57:55.987926	\N	\N
265	32911756037	funcionario	UPDATE	avaliacoes	10015	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:58:59.950795	\N	\N
266	32911756037	funcionario	UPDATE	avaliacoes	10015	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	{"id": 10015, "envio": "2026-02-11T02:01:46.606336", "inicio": "2026-02-11T01:53:05.501", "status": "concluida", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T02:01:46.606336", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 02:01:46.606336	\N	\N
269	32911756037	funcionario	UPDATE	funcionarios	1023	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-11T02:01:46.606336", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 02:01:46.606336	\N	\N
270	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1009	\N	{"lote_id": 1009, "file_size": 639837, "duration_ms": 1874, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1009/laudo-1770775613063-d02f0l.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1009/laudo-1770775613063-d02f0l.pdf"}	\N	\N	\N	2026-02-11 02:06:15.653063	\N	\N
273	29930511059	gestor	UPDATE	avaliacoes	10004	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T23:59:11.353752", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 23:59:11.353752	\N	\N
274	87748070997	rh	INSERT	empresas_clientes	7	\N	{"id": 7, "cep": "80020-180", "cnpj": "05073619000140", "nome": "TESTE EMPRESA", "ativa": true, "email": "DFFJKJHDKLGDF@GMAIL.COM", "cidade": "3946", "estado": "PR", "endereco": "Barão do Serro Azul, 198 - Centro", "telefone": "(06) 84680-4804", "criado_em": "2026-02-12T12:15:27.394911", "clinica_id": 108, "atualizado_em": "2026-02-12T12:15:27.394911", "responsavel_email": null, "representante_fone": "50465046504", "representante_nome": "TESTE GESTOR EMPRESA", "representante_email": "506068FGFD@GMAIL.COM"}	\N	\N	Record created	2026-02-12 12:15:27.394911	\N	\N
278	04703084945	\N	lote_criado	lotes_avaliacao	1010	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1010, "empresa_id": 5, "numero_ordem": 3}	2026-02-12 12:24:06.406657	\N	\N
279	\N	\N	laudo_criado	laudos	1010	\N	{"status": "rascunho", "lote_id": 1010, "tamanho_pdf": null}	\N	\N	\N	2026-02-12 12:24:06.406657	\N	\N
280	04703084945	rh	INSERT	avaliacoes	10016	\N	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 12:24:06.406657	\N	\N
281	04703084945	rh	INSERT	avaliacoes	10017	\N	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 12:24:06.406657	\N	\N
282	73922219063	funcionario	UPDATE	avaliacoes	10017	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:28:13.629063	\N	\N
283	03175612008	funcionario	UPDATE	avaliacoes	10016	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:28:19.769824	\N	\N
284	73922219063	funcionario	UPDATE	avaliacoes	10017	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10017, "envio": "2026-02-12T12:30:53.219351", "inicio": "2026-02-12T12:24:07.632", "status": "concluida", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:30:53.219351", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:30:53.219351	\N	\N
285	73922219063	funcionario	UPDATE	funcionarios	1014	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-10T16:53:16.783516", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-12T12:30:53.219351", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 12:30:53.219351	\N	\N
286	03175612008	funcionario	UPDATE	avaliacoes	10016	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10016, "envio": "2026-02-12T12:31:15.029557", "inicio": "2026-02-12T12:24:07.632", "status": "concluida", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:31:15.029557", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:31:15.029557	\N	\N
287	03175612008	\N	lote_atualizado	lotes_avaliacao	1010	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1010, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-12 12:31:15.029557	\N	\N
288	\N	\N	lote_status_change	lotes_avaliacao	1010	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-12 12:31:15.029557	\N	\N
289	03175612008	funcionario	UPDATE	funcionarios	1015	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-10T16:39:11.716723", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-12T12:31:15.029557", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 12:31:15.029557	\N	\N
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria (id, entidade_tipo, entidade_id, acao, status_anterior, status_novo, usuario_cpf, usuario_perfil, ip_address, user_agent, dados_alterados, metadados, hash_operacao, criado_em) FROM stdin;
1	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	af22c7c87dff85038a0669cb37de18fc1c3c9b2a659c4629786fd259d835770e	2026-02-09 20:54:10.05976
2	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	ecf78fb29ffdec916b43cb612a1bfb4d6bc001d8a324dfe5e84a39d812964c35	2026-02-09 20:57:31.511215
3	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	6139eb596e22577e39d9cdab88867488029d3f769e4d526e2da40dc46006c637	2026-02-09 21:03:58.921289
4	login	100	login_falha	\N	\N	29930511059	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "pagamento_nao_confirmado"}	5db9436b27358182e3168d95f4fc943c8edf87e78f6e32178ecb61fb086d4097	2026-02-09 21:42:30.880999
5	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8b441cf70169a328e011182a7c8f2310e1cebf5c4457ce43960b588683a300c9	2026-02-09 22:03:56.646132
6	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	1d4dfa5238dc0c32ba2d281ffc7f582844add3ac6a1bb5f71235310b9ebb1ebc	2026-02-10 02:26:07.657706
7	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f707e83cdc660fae3a1647766b5b53451f967055c4829cf9f0dd33fde1765145	2026-02-10 02:56:29.886146
8	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	27f9d84d594b54ffc7214542db4fc19b11a7cd9430c5f36e782b0a6b0030d15e	2026-02-10 03:03:46.618512
9	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a11a2f4932f0d63fb19c6bccb193ef4d90dba6aa60429b8c6e4d3a1091ffd33e	2026-02-10 04:21:42.157373
10	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	d307a770ffdccdca77de43648b0eec2eefc791a0f8dfe7870e96b7b941c050ea	2026-02-10 09:44:03.25496
11	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	2128cebb53e031cb661eee83a3bfcd28643d0574a42aece20006011b90e8849b	2026-02-10 10:05:53.031865
12	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	374dd9e3a2281002b303061cbd85bad8c3a321f27bcdff9f285a9e5f1ee6b7ed	2026-02-10 10:40:32.46895
13	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	433adca1bca7399c3fd1b8711fb584eb97e9402b6d731ec8e2ceec6adfe4ca0d	2026-02-10 10:41:01.039575
14	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	6d1a06a8108781d52b73b3737d793b4b98b95d81248da2a11383506ec572327e	2026-02-10 10:42:11.900431
15	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	223f7bd6ce6b4b0764804f7d0dc2cd0f317a539fbc063676e952bcc4aecef02b	2026-02-10 10:43:39.771891
16	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	365fd8d71d8d6bd71f8fe8ab630df1e849120f7b5e435245eeb401ffd30fc4f2	2026-02-10 10:56:00.829494
17	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	52bdf10ef913525288272cfa21118f1e742fecf13938577e09b84bfda11f2fad	2026-02-10 11:29:08.573928
18	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	804a58356d6030ff02ad609e2d57abe3b37af3e02f122f8e2ba3a556ddfd466d	2026-02-10 11:30:00.60518
19	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	54b6fdfeca7ddc683c6263c7e895ea5b729f640d824d6a9574670faed5abdebc	2026-02-10 11:30:33.240225
20	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	adbc750d3d3c3725e9819bb1879589578579de8b07bff80d9d8020ec00596f5a	2026-02-10 11:39:39.813885
21	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8ef20e4674154fa74527dad94b5b3de1d8ebeef716bf6490f5157a7d2ee5772f	2026-02-10 11:40:15.056814
22	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	31f9b1c0d6c26822a7e34f20a8dec938125c59f7d9bd73a961eff26f44123d72	2026-02-10 11:40:57.414637
23	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c0cbfc02afe9db388ac0c4cc334e01b74a516e2d61d0d1c5b37d588feda982aa	2026-02-10 11:41:36.9066
24	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	da4da6092800fdf3b2ace446373bdb48f1acf0c127501c7d522b2d6d60d89ab9	2026-02-10 12:11:02.530022
25	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	486c33837ad4928bc37ad1aa926164213fd37bc7ae4c2d94fe03b83fb774ac33	2026-02-10 12:21:14.442204
26	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8b2aed4c2b84898032a1641c546cc8a37934827f8ccc48df4b4107a0b5b0ec7d	2026-02-10 12:22:37.002966
27	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	8cfb355ad02cfb7e0d6dfe440b3e03afd6677ed7c3b8184b497e31ad4797b248	2026-02-10 12:25:03.842268
28	login	105	login_sucesso	\N	\N	24626149073	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": 105, "tipo_usuario": "gestor"}	daa6f519947ff19e5da85bb53e9a623dc6cf494ad6d08a55d287dcc5b1a9cff6	2026-02-10 12:33:03.067126
29	login	0	login_falha	\N	\N	49651696036	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	20b511e9dc0ffc52e23640dd7a6095064697ba8c8ec2e18ce9bc83e784b41b71	2026-02-10 12:35:08.199239
30	login	0	login_falha	\N	\N	49651696036	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	32cd400bf76c04fa8728376fddd70800d65fdb4405e0814bacafe3e03edabb0a	2026-02-10 12:35:18.333654
31	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	2de2efcf12623629d1b1aa53033eedb27e9b1416070cfc89e4a200a0afac95ff	2026-02-10 12:36:07.710969
32	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	e48005507e45d751dc584a572ae2c01a9c7b543f5f458cbaec0fdbf19ded7cad	2026-02-10 12:49:07.751544
33	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	19fdbdcb765b9a44158d7ac4c96885be7453957e10db1e83123c6858421c0d9e	2026-02-10 12:51:42.24205
34	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	58c489650b819c8d0df79c7aa21470b332177d5fe0311580199459f4200d060f	2026-02-10 13:37:22.422179
35	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f4d6c5eae38f724a1bb25715063d75dabdc74ca024c258ec40f51e0d35e00bce	2026-02-10 13:58:51.98084
36	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c972b71fbea0a7b50d603d3273e0f4fffb8ab6978f6746e8de3083a0b862ca1b	2026-02-10 13:59:24.080515
37	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	6b3584c6fc4d36007c40f24a7f8b455c8f978431d298f453edab7475ec8dd7a2	2026-02-10 14:13:39.918046
38	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	5e3b1d036a24ab87378f7767e5074d3135389a72ac1bb60f323f70543ccaaab5	2026-02-10 15:15:40.425324
39	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c66c4ed34d8f6958e81e684a2f5221a6a928cd1dcb8d20795977fd5a37173c7f	2026-02-10 15:17:42.764906
40	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7d7186b61bb8992f8813c1a1ff01737db0df19b471a5ea52ba0af83bc7599fb1	2026-02-10 15:18:23.124184
41	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	df325d17e12171d7ea423e7db27b81959a10f0253fa3ecfe2efc7d130c7453cb	2026-02-10 15:27:26.430478
42	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	40c9b2784c507f0ec81e4b40105b621b5873ebe92bb5323d34c1056f157ed758	2026-02-10 15:28:58.317883
43	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	aeb9296ffc57caaa4d04d8ab0dbc0796b47dfe7fa78a53699a38fa672e517252	2026-02-10 15:42:45.471099
44	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	35b4635c4adfc6b334220fc5133d4bfcd6d059d7249c84c3db76c26d6df4e284	2026-02-10 15:43:02.312013
45	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7f84b45825d7a2e2f614a84f98a28324e65bcba644a32a8f80e9d1ac0a74e323	2026-02-10 15:55:54.251117
46	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	9588f65e4d73cd17726bf92f974de7ec9ed33f2cb3013d2f3bfbb3cd71d76555	2026-02-10 16:07:38.216811
47	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c49b099c670e87b5a6aaefafceb5b15dbebc9db1d0c9523343cdc8b38dc1ae6e	2026-02-10 16:08:48.713052
48	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	fc713583fe80feab12bee33b6abfa605a52d0ada93ac44489acb81a6dbf66e6c	2026-02-10 16:30:10.028109
49	login	0	login_falha	\N	\N	03175612008	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	3e7820b61d4e396dbee6fa7fdde58b907af20750078f1ebd44ebe3a40bb8a5c0	2026-02-10 16:30:37.820494
50	login	0	login_sucesso	\N	\N	03175612008	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7a9a6dd26091c33a64a881b84a9a3012423c68d6f6fbae1206266e49d66a36b7	2026-02-10 16:31:10.480598
51	login	0	login_sucesso	\N	\N	73922219063	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	a32047579b47850406865e32c15f2513fe79e146a6ca9a5dd237cff310f054bc	2026-02-10 16:40:11.815207
52	login	0	login_falha	\N	\N	03175612008	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	93d963df35e6a8aeaa213fffb44d9e7f1b460f0a14770d49c9cecafdf0a10c78	2026-02-10 17:19:13.161261
53	login	0	login_sucesso	\N	\N	73922219063	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	43a6eac833f706dbfb97e0001a6a83df60ad231a82d6ff3dfb18a15a0cf4b766	2026-02-10 17:19:24.46998
54	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	552421e7bff84113cd383580268e8b129ef63811d331ce34f31db64c2a1f1bae	2026-02-10 17:23:44.278
55	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	2beefc484064cb31121192929741a49e7c95f083e9f3c08cedd3f6b010dfd1f5	2026-02-10 17:24:24.838743
56	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	4a6c74537630dd5f88945412c82b5603b257c292e53976fd223211eff4bd1bc1	2026-02-10 18:14:47.042796
57	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	021bc95897d3081d24d2c46b7ee9a97a728fe96d8d2947d15587554aed60b873	2026-02-10 18:17:08.055818
58	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	08cf7f70fa755edc9aac1849ae13069472572254b8ce318169546d3d6daf3a44	2026-02-10 18:24:00.638593
59	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	b67ff27bdf34f638b23b61ad6c97219e73332c684202d2e9866c0a70e07dbf1c	2026-02-10 18:25:05.077356
60	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	e0265086b5d0d83c6f8bdce24f8c675e68a5f94a41daf8a11324baa16dbd6911	2026-02-10 19:06:39.601403
61	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	4962688b6691aad885ff48c46279cdd1cc7c4c24a6732b7dbdbcd28c47f31b49	2026-02-10 19:07:10.339009
62	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	4ad1e382c8dc38567d4bff178d03dd7e45971c59c4fbae64a003839a291f400f	2026-02-10 19:47:00.263739
63	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	5fa64588abeb2347ed71fc2c5a3720ac570933220dfb3d7ba64ad3f3ab124f5f	2026-02-10 19:49:51.295325
64	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	210901797a2b62c2fc7e631911b4d67384aaffc12bc8208dcee8e6a1eed325cd	2026-02-10 19:50:45.098484
65	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	dfafc45bb6407dab22b3e1f30aa0d9fa2c3fc73c62534654840dc62e41cceac8	2026-02-10 19:51:19.425094
66	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	1fa76da827f1ad0b0177425ee2719c79affa87627583692839d8337ed96c8416	2026-02-10 19:52:09.753627
67	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	88a2bfca590b96305860dcacf017b195bd622e0dc573db93d061b2302a02f0e7	2026-02-10 20:23:33.311462
68	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	19c817fff675cfa3e6af0c556b6733c02b9e9646b6de53c928d06771dff8c781	2026-02-10 20:29:03.813661
69	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	88842a754392db380c836820a770fd315cb006d39fc8b93c83e5fe248376ece7	2026-02-10 20:29:35.761542
70	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	a7925caf5f98fa0f50a31f26675663fb48c29db937f401e3ccae826717907910	2026-02-10 20:30:22.753261
71	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	165b978af9c295054222fdc0eb63f391d22ae62cead9830a784f135a81a10b65	2026-02-10 20:54:07.183585
72	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	cc7816bf623184d8de1beaaebaf01787f831f7bc6f981d67b65e8caef2132ea9	2026-02-10 20:54:20.933741
73	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	bebc4eb63ef250e24c8fba9b03e95e1d580c9e677011c385f66942a084266ecf	2026-02-10 21:56:40.979343
74	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	6ea382a969fc61035e043d7fc2664fe9246f9cf1d7d1140a98d920a64871e7b1	2026-02-10 23:14:23.2145
75	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	fbda01dfc14e049f1aa0109d0c0d203bbf95c8f9351a9a2de6fecaebce15f84e	2026-02-10 23:17:46.500401
76	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	91e0193736ce4b7a22835ae28a5dc8daab6959b83c590809e90bf91538b2806a	2026-02-10 23:52:41.095296
77	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f4965561a4988d374f8764c48203e2a42f7dac604ccf5fc41ef27180a006781c	2026-02-10 23:59:41.006842
78	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	ffe77457bcbe13c3de5fb9335d86afb9c313989d4e934b7480c4f30bcbb031b5	2026-02-11 00:30:52.78449
79	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a51d56f0e2c93baf700876a51ced9a14593b0547af27eb3b0eb5b6455e71a542	2026-02-11 00:31:53.020386
80	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	62fd804a84bf68c51db8fa7f44f3568184197d2da0a036de60354a783dbca40a	2026-02-11 00:57:30.82492
81	login	106	login_sucesso	\N	\N	35051737030	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 106, "tipo_usuario": "gestor"}	f866c2edbf5373dd8a617c8ebfcd1d1dd805f1c64788c35dbb7d171d64a99f17	2026-02-11 01:03:19.238659
82	login	0	login_sucesso	\N	\N	65648556055	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	54ec7f39240842867ef6a979a2b68dbf821f2e20723fdfa3a256c316311d4778	2026-02-11 01:06:24.270035
83	login	0	login_sucesso	\N	\N	18597536047	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	66513bcff59065a4a40f2f7dbdc403de65e7c5874425c076ee478207636c56ae	2026-02-11 01:08:44.650378
84	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	76dadef11f334cefbeb403aaab0543b435c5b93bff2ddb5b7d1a69584d873a5f	2026-02-11 01:15:37.569536
85	login	106	login_sucesso	\N	\N	35051737030	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 106, "tipo_usuario": "gestor"}	7f94ba1219d7ee76fc344014f813082e6d95ab49aa4a830a136bea8fb3c53848	2026-02-11 01:16:51.606887
86	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	63f6219b9af1e0b6b5d4a16ff01a56460350eaf5fc3af854111b58d6f0664592	2026-02-11 01:17:19.302528
87	login	107	login_sucesso	\N	\N	64411953056	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 107, "entidade_id": null, "tipo_usuario": "rh"}	79e4a5fb74bb01ee826fb2bda48944c5439264b443f7622052377b8744a49cd8	2026-02-11 01:51:15.756561
88	login	0	login_falha	\N	\N	85804194097	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	cecece6efa076afc287db8646f01ee5dab8179c70c6c27b822cbd7f108a8a99b	2026-02-11 01:53:56.88325
89	login	0	login_falha	\N	\N	85804194097	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	bcea7b08f74810a21bda70e93f40f54fd3fc74bcc6f6618e1bfc659a27703745	2026-02-11 01:54:26.543469
90	login	0	login_sucesso	\N	\N	85804194097	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	73864502f8fce11c929106f40431ef4a7c192c7fbdc0a5287434a8664053bbcf	2026-02-11 01:54:49.309626
91	login	0	login_sucesso	\N	\N	32911756037	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	a375428d78c31c95560364a40426489c122d0caaee881d8b1430e7fc4b2f8932	2026-02-11 01:58:44.802532
92	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	04a09ddec45c666af217c84fd1e6954381a0cc67e65af3542b2db34f702668c8	2026-02-11 02:02:26.096607
93	login	107	login_sucesso	\N	\N	64411953056	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 107, "entidade_id": null, "tipo_usuario": "rh"}	0ea3188df901975967c357e67216e8633e7bf16cec69287a598d220602e6a385	2026-02-11 02:03:37.526362
94	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	47aa326919c32bf9aff15d09052c47012c012ca15abbe1c8d5a5947e2a3c52ed	2026-02-11 02:05:04.538652
95	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	11d62c05f5838d8883106a71d94355149defef4f4c9dc724f062e24c52c2774c	2026-02-11 02:05:42.228432
96	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	364b6eb1c111fbfe14e6aaa2b023b3c6b24f5cf118d87b0aab9f7ae4da39534e	2026-02-11 03:14:31.82798
97	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	e88e45a0b9762d44f4bbdc06d8f71e42140bc07cced78918fe8f1963bb1f9cb1	2026-02-11 03:14:53.346427
98	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	7f461ed5d5fad45b13878fb6e68f1f1123be1e13391b0d033b4a9f3efdd3275a	2026-02-11 03:19:57.331262
99	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	76d6d55733d58717158a2bb0e6650eca83a9c01e7f93b0a860ebb2a008c71736	2026-02-11 10:34:33.729768
100	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	252685370465b7f893f3c8af17c64d2c4cce4ee1a467d9c00dacd7935a2e0a4a	2026-02-11 23:36:44.217001
101	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	3da9bd47c13fe9fa77329f6e1dc6efa31a5589a7126c8406859a4ebcb66dbea6	2026-02-11 23:37:22.182262
102	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	406cd0344e35571d976a65626aaee711f2ac39397ba212c3da4cc4d45dce3626	2026-02-12 05:29:16.329255
103	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	f8b8e8f59d827c2d2930531be8de302e661835284a6a222da76756cc778ba641	2026-02-12 05:29:38.87107
104	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c639988e93ec5963d2c78d968a55ec0cf54b3711ca4e1265513add37ffb003f2	2026-02-12 05:30:12.396339
105	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	1a73b1021d350afda3c40cbdc5a72e11a860fb63e8d10dbd3178f6e1d444f170	2026-02-12 05:30:46.190601
106	login	108	login_sucesso	\N	\N	87748070997	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 108, "entidade_id": null, "tipo_usuario": "rh"}	6a294b266708fe25a921e17d07018606c2aa86f361a72cfff18f0a08b9d847af	2026-02-12 12:13:52.452376
107	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	ff6f9471188ba064fc21abbeffdc14b27edb7dc73b704ed9964b2bdbb9db04d4	2026-02-12 12:23:21.769014
108	login	0	login_falha	\N	\N	73922219063	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	58cceeca016d50e7f8067b1f992753ff384a61a049133da5f547ee9cc68bd2fc	2026-02-12 12:27:15.351431
109	login	0	login_sucesso	\N	\N	73922219063	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f1929366d79683b007956461d4b03d7f9c512eb5188a03316b39104941b5f024	2026-02-12 12:27:46.637736
110	login	0	login_sucesso	\N	\N	03175612008	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	eff8323b79a0a0a253041b8ded954be531b17f4a720492d41a878831a032f3c1	2026-02-12 12:28:00.358685
111	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	c7b96f679c55279d5747e9dcbbc2a7f41aabcae9e3c720a772768dd0a2e204ef	2026-02-12 12:32:32.812674
112	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	c9db7e0f98c14c1fe51a988ad0f43f1a1ed302a4a8cc5c448c9f5ac6173169e0	2026-02-12 12:32:38.496212
113	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	7247967c6212b0798b107f1502f1b76d4480a252b5e32b0ceb6810890e4d8c5a	2026-02-12 12:32:46.297589
114	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	d13731d32d0ad30d1cda75730550cfb1022525e3f0fa1c58b6c95b240802ac65	2026-02-12 12:32:50.099155
115	login	0	login_sucesso	\N	\N	00000000000	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	6738ca08533f85a90cf0cd5675dcc3ca598f2a268e2a3fb2886fa985068cbe10	2026-02-12 12:32:53.11883
116	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	3229712c3442891a23582d55766947d0a1d9bc64d11961b2dca853f493156f07	2026-02-12 12:38:38.313851
117	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	bf4a1ab7dd2ef475a13e274ff79d30a3b609e148788833c5c709ac453393d836	2026-02-12 12:39:29.541818
118	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	7cfe01bf5efa221bc1c637e083458521a3b615af0c12aa5619af841f02ab539f	2026-02-12 14:22:37.581201
119	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	4e41c5637312827ed85347a0e60ad5f515b1ec11c58bd1d0dcbd4fcef1dce044	2026-02-12 14:23:04.533655
120	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ddfcf4cfee0028d2e6bf5a4d3e859ccdaf98fd4a6261140dd0a80b64635eb8a0	2026-02-12 14:23:48.368653
121	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	77bbd36194d63408c924eb3968a3b6f1624821dc67b5fb911a0d19b643e10476	2026-02-12 14:24:45.714828
122	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	3012e7cc5c061fe7a5f87bb098fc4a7b7532ab3dd7aa1a08f7187f17f40fcae0	2026-02-12 14:25:27.375586
123	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c3ca04657ab12d5218b31f8a14cd817188f90093abb2f4d9dfc2eae77ce27147	2026-02-12 14:27:22.791254
124	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	6617a00677b3d25b81909f2edf4d7a8734c4b355b2e9b9f45e30244eca8fbb27	2026-02-12 14:28:43.908852
125	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ad0fa2f29c4b4eebb94fc3fe5ec06e12dac9fd32f217b79ea4b9868db698c8b8	2026-02-12 17:46:21.257189
126	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	dbb49843d49ea6fcbb12c864fabec63c66e1ba67b0240b5fa80832507211347b	2026-02-12 18:01:04.215072
127	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	daa70ed6bd152fe83edbe13d51e7e76163c9ccad85d8cd93cc2f0f4b905f929a	2026-02-12 18:21:06.307062
\.


--
-- Data for Name: auditoria_geral; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_geral (id, tabela_afetada, acao, cpf_responsavel, dados_anteriores, dados_novos, criado_em) FROM stdin;
1	notificacoes	migration_025_tipo_laudo	\N	\N	{"descricao": "Migração de laudo_emitido para laudo_enviado", "data_migracao": "2026-02-09T20:16:02.833497+00:00", "total_atualizadas": 0}	2026-02-09 20:16:02.833497
\.


--
-- Data for Name: auditoria_laudos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_laudos (id, lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, observacoes, criado_em, solicitado_por, tipo_solicitante, tentativas, erro) FROM stdin;
1	1005	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-10 17:22:32.563262	04703084945	rh	0	\N
2	1007	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-10 19:50:59.68606	29930511059	gestor	0	\N
3	1008	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-11 01:15:05.619261	35051737030	gestor	0	\N
4	1009	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-11 02:02:12.619227	64411953056	rh	0	\N
5	1010	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-12 12:32:17.869141	04703084945	rh	0	\N
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
64502096-66b2-48df-9bb5-31ba06176177	10004	1004	100	gestor	\\zcczzc\\c\\zz\\c\\z\\z	37	2026-02-11 23:59:11.353752+00
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.avaliacoes (id, funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id, inativada_em, motivo_inativacao, concluida_em) FROM stdin;
10014	85804194097	2026-02-11 01:53:05.501	2026-02-11 01:57:55.987926	concluida	1	2026-02-11 01:53:04.39101	2026-02-11 01:57:55.987926	1009	\N	\N	\N
10005	36381045086	2026-02-10 12:10:37.509	\N	iniciada	1	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	1004	\N	\N	\N
10015	32911756037	2026-02-11 01:53:05.501	2026-02-11 02:01:46.606336	concluida	1	2026-02-11 01:53:04.39101	2026-02-11 02:01:46.606336	1009	\N	\N	\N
10008	77109022005	2026-02-10 12:33:47.269	\N	iniciada	1	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	1006	\N	\N	\N
10009	17285659010	2026-02-10 12:33:47.269	\N	iniciada	1	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	1006	\N	\N	\N
10004	49651696036	2026-02-10 12:10:37.509	\N	iniciada	1	2026-02-10 12:10:36.722222	2026-02-11 23:59:11.353752	1004	\N	\N	\N
10017	73922219063	2026-02-12 12:24:07.632	2026-02-12 12:30:53.219351	concluida	1	2026-02-12 12:24:06.406657	2026-02-12 12:30:53.219351	1010	\N	\N	\N
10016	03175612008	2026-02-12 12:24:07.632	2026-02-12 12:31:15.029557	concluida	1	2026-02-12 12:24:06.406657	2026-02-12 12:31:15.029557	1010	\N	\N	\N
10010	49651696036	2026-02-10 14:13:19.435	2026-02-10 16:07:57.010649	concluida	1	2026-02-10 14:13:18.784349	2026-02-10 16:07:57.010649	1007	\N	\N	\N
10011	36381045086	2026-02-10 14:13:19.435	2026-02-10 16:29:35.288036	concluida	1	2026-02-10 14:13:18.784349	2026-02-10 16:29:35.288036	1007	\N	\N	\N
10006	03175612008	2026-02-10 12:21:49.087	2026-02-10 16:39:11.716723	concluida	1	2026-02-10 12:21:47.979581	2026-02-10 16:39:11.716723	1005	\N	\N	\N
10007	73922219063	2026-02-10 12:21:49.087	2026-02-10 16:53:16.783516	concluida	1	2026-02-10 12:21:47.979581	2026-02-10 16:53:16.783516	1005	\N	\N	\N
10013	18597536047	2026-02-11 01:05:34.866	2026-02-11 01:12:17.053789	concluida	1	2026-02-11 01:05:34.180476	2026-02-11 01:12:17.053789	1008	\N	\N	\N
10012	65648556055	2026-02-11 01:05:34.866	2026-02-11 01:14:43.757296	concluida	1	2026-02-11 01:05:34.180476	2026-02-11 01:14:43.757296	1008	\N	\N	\N
\.


--
-- Data for Name: clinica_configuracoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinica_configuracoes (id, clinica_id, campos_customizados, logo_url, cor_primaria, cor_secundaria, template_relatorio_id, incluir_logo_relatorios, formato_data_preferencial, criado_em, atualizado_em, atualizado_por_cpf) FROM stdin;
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login, contrato_aceito, tipo, razao_social, idioma_preferencial, nome_fantasia) FROM stdin;
104	RLJ COMERCIAL EXPORTADORA LTDA	09110380000191	\N	ewrwer@fafa.com	(45) 64897-9888	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	tani akk	04703084945	\N	4dffadf@dsfdf.com	(45) 64487-9889	\N	\N	\N	pendente	\N	\N	t	2026-02-10 04:21:11.359503	2026-02-10 04:21:11.359503	\N	\N	f	\N	\N	\N	2026-02-10 04:21:23.526732	f	clinica	\N	pt_BR	\N
107	Clinica Final Test	97841843000152	\N	clinfintest@sdfsdf.com	(45) 46556-4654	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Gestor Clin Final test	64411953056	\N	gesges@dsgds.com	(45) 46546-5456	\N	\N	\N	pendente	\N	\N	t	2026-02-11 01:47:49.407701	2026-02-11 01:47:49.407701	\N	\N	f	\N	\N	\N	2026-02-11 01:48:15.247079	f	clinica	\N	pt_BR	\N
108	teste Gabriela e Arthur Adega Ltda	27706384000119	\N	posvenda@gabrielaearthuradegaltda.com.br	(41) 99540-1309	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	TESTE	87748070997	\N	DFKGHDFJKHG@GMAIL.COM	(67) 98411-1846	\N	\N	\N	pendente	\N	\N	t	2026-02-12 12:10:50.155945	2026-02-12 12:10:50.155945	\N	\N	f	\N	\N	\N	2026-02-12 12:12:45.410064	f	clinica	\N	pt_BR	\N
109	Pos Correc Dep 1202	26698929000120	\N	ffaaf@afsa.coj	(45) 46546-5465	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	amdna Nexus	03178539026	\N	fafa@safsf.com	(66) 46546-5465	\N	\N	\N	pendente	\N	\N	t	2026-02-12 18:00:29.646875	2026-02-12 18:00:29.646875	\N	\N	f	\N	\N	\N	2026-02-12 18:00:41.323951	f	clinica	\N	pt_BR	\N
\.


--
-- Data for Name: clinicas_empresas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas_empresas (clinica_id, empresa_id, criado_em) FROM stdin;
\.


--
-- Data for Name: clinicas_senhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas_senhas (id, clinica_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em) FROM stdin;
1	99	04703084948	$2a$10$4Cx15gbCmwOcOILFTeA1..aG1/dX6DRrIedgY0/ryJ4j0PorNZNIO	f	2026-02-10 03:58:05.710118	2026-02-10 04:20:07.099385	2026-02-10 03:58:05.710118+00	2026-02-10 04:20:07.099385+00
2	104	04703084945	$2a$10$n3CdxDGTS7E2RYBK8QwqtuDClE6cWzzTFvOrwWaEeG9xJ8QD78Lgm	f	2026-02-10 04:21:22.938132	2026-02-10 04:21:22.938132	2026-02-10 04:21:22.938132+00	2026-02-10 04:21:22.938132+00
3	107	64411953056	$2a$10$YBSpGCzIQ9RJnB/H34NVeuPO3jmg3.MU1bOezbLzWYnx2/ijAFIRC	f	2026-02-11 01:48:14.115011	2026-02-11 01:48:14.115011	2026-02-11 01:48:14.115011+00	2026-02-11 01:48:14.115011+00
4	108	87748070997	$2a$10$QwsQsYMcXRJ7TiB1g.NEdeiNTjG6Ra62wDOPAS/ykD49G9LH6ZU8C	f	2026-02-12 12:12:44.189688	2026-02-12 12:12:44.189688	2026-02-12 12:12:44.189688+00	2026-02-12 12:12:44.189688+00
5	109	03178539026	$2a$10$nZ44stciCuPHTpAVH8GakejC.jTGQk6RNK5pTeyiJQj.ywXa86kpS	f	2026-02-12 18:00:40.213057	2026-02-12 18:00:40.213057	2026-02-12 18:00:40.213057+00	2026-02-12 18:00:40.213057+00
\.


--
-- Data for Name: confirmacao_identidade; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.confirmacao_identidade (id, avaliacao_id, funcionario_cpf, nome_confirmado, cpf_confirmado, data_nascimento, confirmado_em, ip_address, user_agent, criado_em) FROM stdin;
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos (id, plano_id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, valor_personalizado, payment_link_expiracao, link_enviado_em, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador) FROM stdin;
1	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-09 21:03:01.339161	\N	\N	177.146.166.16	2026-02-09 21:03:12.604239	\N	\N	\N	\N	\N	\N	\N	\N	100	entidade
2	\N	\N	\N	aguardando_aceite	f	f	\N	2026-02-10 03:42:52.038122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	102	clinica
4	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-10 04:21:11.359503	\N	\N	177.146.166.16	2026-02-10 04:21:22.590102	\N	\N	\N	\N	\N	\N	\N	\N	104	clinica
5	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-10 12:30:34.697287	\N	\N	177.146.166.16	2026-02-10 12:30:58.982764	\N	\N	\N	\N	\N	\N	\N	\N	105	entidade
6	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-11 01:02:47.812895	\N	\N	177.146.166.16	2026-02-11 01:02:57.813307	\N	\N	\N	\N	\N	\N	\N	\N	106	entidade
7	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-11 01:47:49.407701	\N	\N	177.146.166.16	2026-02-11 01:48:13.493208	\N	\N	\N	\N	\N	\N	\N	\N	107	clinica
8	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-12 12:10:50.155945	\N	\N	189.112.122.137	2026-02-12 12:12:43.594485	\N	\N	\N	\N	\N	\N	\N	\N	108	clinica
9	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-12 18:00:29.646875	\N	\N	177.146.166.16	2026-02-12 18:00:39.591561	\N	\N	\N	\N	\N	\N	\N	\N	109	clinica
\.


--
-- Data for Name: contratos_planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos_planos (id, plano_id, clinica_id, valor_personalizado_por_funcionario, inicio_vigencia, fim_vigencia, ativo, created_at, updated_at, valor_pago, tipo_pagamento, modalidade_pagamento, data_pagamento, parcelas_json, entidade_id) FROM stdin;
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
5	Empresa CM onlinwe	22902898000126	55asds@dsdssdf.com	(46) 54654-6566	rua lkj lk 89089	ipiopipo	IO	45612456	t	104	2026-02-10 09:40:21.970549	2026-02-10 09:40:21.970549	dsdsd dfssfdf	46465456456	fssafsf@fasasf.com	\N
6	Empresa clin fina 001	82429448000190	sdfsdf@assa.com	(45) 64546-6545	Rua Antônio Bianchetti, 90	São José dos Pinhais	FE	83065-370	t	107	2026-02-11 01:52:11.752978	2026-02-11 01:52:11.752978	GEstor CLun fianl	89798798799	rerewewr@fdsfds.com	\N
7	TESTE EMPRESA	05073619000140	DFFJKJHDKLGDF@GMAIL.COM	(06) 84680-4804	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	t	108	2026-02-12 12:15:27.394911	2026-02-12 12:15:27.394911	TESTE GESTOR EMPRESA	50465046504	506068FGFD@GMAIL.COM	\N
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.entidades (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login, contrato_aceito, tipo) FROM stdin;
100	RELEGERE - ASSESSORIA E CONSULTORIA LTDA	02494916000170	\N	rlrlg@rlrlr.com	(46) 54897-8978	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Gestor RLGR	29930511059	Recurso Humano	rhrlge@kdke.com	(46) 79879-8799	\N	\N	\N	pendente	\N	\N	t	2026-02-09 21:03:01.083207	2026-02-09 21:41:02.172557	\N	\N	f	\N	\N	\N	2026-02-09 21:41:02.172557	f	entidade
105	DDSDSAGADSGGSD	96104413000195	\N	dsfsfdsfd@fddsf.com	(46) 54654-6546	rua jlk 3234	lçlçjçlj	OI	45654-656	zdvdzd dzvvzvz	24626149073	\N	dsfsdfsfd@fdfd.com	(65) 45646-5465	\N	\N	\N	pendente	\N	\N	t	2026-02-10 12:30:34.697287	2026-02-10 12:30:34.697287	\N	\N	f	\N	\N	\N	2026-02-10 12:31:00.622395	f	entidade
106	Empresa Privada Final	63424269000115	\N	empprivfinal@sfdsfsd.com	(45) 67987-9879	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Gestor Empresa Priv Fin	35051737030	\N	gestorempprivfin@ffdffsd.ci	(45) 46546-5466	\N	\N	\N	pendente	\N	\N	t	2026-02-11 01:02:47.812895	2026-02-11 01:02:47.812895	\N	\N	f	\N	\N	\N	2026-02-11 01:02:59.472266	f	entidade
\.


--
-- Data for Name: entidades_senhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.entidades_senhas (id, entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em, contratante_id) FROM stdin;
2	100	29930511059	$2a$10$aLYeDmWcuSkamyX5qsq0leqlPW2PcvUXNkw3xOAKHyzC.YVaUcueC	f	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557+00	2026-02-09 21:41:02.172557+00	\N
3	105	24626149073	$2a$10$jlXMPJhN2gO2ObE4vSsid.6YU6m9bgEjjapeMyHfYniU5I7OKiZF6	f	2026-02-10 12:30:59.566007	2026-02-10 12:30:59.566007	2026-02-10 12:30:59.566007+00	2026-02-10 12:30:59.566007+00	\N
4	106	35051737030	$2a$10$6uDPCkB8pFxM/LmYgnFMaefyvRYT0Y8qt58CNlB3CdB43/Sm0aLaW	f	2026-02-11 01:02:58.401725	2026-02-11 01:02:58.401725	2026-02-11 01:02:58.401725+00	2026-02-11 01:02:58.401725+00	\N
\.


--
-- Data for Name: fila_emissao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fila_emissao (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: fk_migration_audit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fk_migration_audit (id, tabela, coluna_origem, tipo_migracao, registros_afetados, status, detalhes, erro, iniciado_em, concluido_em, criado_em) FROM stdin;
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios (id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, matricula, turno, escala, nivel_cargo, ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, indice_avaliacao, incluido_em, inativado_em, inativado_por, ultimo_lote_codigo, data_admissao) FROM stdin;
1	00000000000	Admin Sistema	\N	\N	admin@qwork.com	$2a$06$Z3xMbe4Kq6d2bfrWYmYWO.5FqCSwlGrHGlrih69xNj95SbKqDMqoG	admin	t	2026-02-09 19:32:10.783012	2026-02-09 19:32:10.783012	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	2026-02-09 19:32:10.783012	\N	\N	\N	\N
1016	17285659010	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.com	$2a$10$CCEgsiac9DHv2LCEhDp54.WmpwHI6xW.x.R97M9LhjTdznOKPP9SO	funcionario	t	2026-02-10 12:33:30.10471	2026-02-10 12:33:30.10471	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1985-04-15	0	2026-02-10 12:33:30.10471	\N	\N	\N	\N
1017	77109022005	DIMore Itali Emp02 online	Operacional	estagio	r123132erweantos@empresa.dot	$2a$10$c2WQE9ZQq9phaEeJ6ddxueJRLFsM9GVIhwuNrBAWfcnH8SfB24kje	funcionario	t	2026-02-10 12:33:30.10471	2026-02-10 12:33:30.10471	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2011-02-02	0	2026-02-10 12:33:30.10471	\N	\N	\N	\N
1009	49651696036	DIMore Itali	Operacional	estagio	reewrrwerweantos@empresa.com.br	$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq	funcionario	t	2026-02-10 03:34:31.346394	2026-02-10 03:34:31.346394	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-10 16:07:57.010649	2011-02-02	4	2026-02-10 03:34:31.346394	\N	\N	\N	\N
1008	36381045086	Jose do UP01	Administrativo	Analista	jose53va@empresa.com.br	$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa	funcionario	t	2026-02-10 03:34:31.346394	2026-02-10 03:34:31.346394	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-10 16:29:35.288036	1985-04-15	4	2026-02-10 03:34:31.346394	\N	\N	\N	\N
1018	19778990050	Jaiemx o1	Administrativo	Analista	jorwerwero.24@empalux.com.br	$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS	funcionario	t	2026-02-11 00:59:46.425929	2026-02-11 00:59:46.425929	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2010-12-12	0	2026-02-11 00:59:46.425929	\N	\N	\N	\N
1019	34624832000	Jaiminho uoiuoiu	Operacional	Coordenadora	rolnk2l@huhuhuj.com	$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW	funcionario	t	2026-02-11 00:59:46.425929	2026-02-11 00:59:46.425929	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1974-10-24	0	2026-02-11 00:59:46.425929	\N	\N	\N	\N
1020	18597536047	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.uio	$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q	funcionario	t	2026-02-11 01:04:34.424847	2026-02-11 01:04:34.424847	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-11 01:12:17.053789	1985-04-15	5	2026-02-11 01:04:34.424847	\N	\N	\N	\N
1021	65648556055	DIMore Itali Emp02 online	Operacional	estagio	2erweantos@empresa.com.br	$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK	funcionario	t	2026-02-11 01:04:34.424847	2026-02-11 01:04:34.424847	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-11 01:14:43.757296	2011-02-02	5	2026-02-11 01:04:34.424847	\N	\N	\N	\N
1022	85804194097	gdssd sddssd	Administrativo	Analista	jose53va@empresa.cot	$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW	funcionario	t	2026-02-11 01:52:46.462014	2026-02-11 01:52:46.462014	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-11 01:57:55.987926	2011-11-11	1	2026-02-11 01:52:46.462014	\N	\N	\N	\N
1023	32911756037	vzfdf dffddgssdg	Operacional	estagio	reewr90rweantos@empresa.com.br	$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W	funcionario	t	2026-02-11 01:52:46.462014	2026-02-11 01:52:46.462014	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-11 02:01:46.606336	2002-02-02	1	2026-02-11 01:52:46.462014	\N	\N	\N	\N
1014	73922219063	Jose do Emp02  online	Administrativo	Analista	rdfs432432233va@eesa.uio	$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.	funcionario	t	2026-02-10 10:29:30.334004	2026-02-10 10:29:30.334004	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-12 12:30:53.219351	1974-10-24	3	2026-02-10 10:29:30.334004	\N	\N	\N	\N
1015	03175612008	DIMore Itali Emp02 online	Operacional	estagio	mjdfantos@empresa.cj	$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu	funcionario	t	2026-02-10 10:29:30.334004	2026-02-10 10:29:30.334004	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-12 12:31:15.029557	1971-09-27	3	2026-02-10 10:29:30.334004	\N	\N	\N	\N
\.


--
-- Data for Name: funcionarios_clinicas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios_clinicas (id, funcionario_id, empresa_id, ativo, data_vinculo, data_desvinculo, clinica_id) FROM stdin;
1	1014	5	t	2026-02-10 10:29:30.334004	\N	104
2	1015	5	t	2026-02-10 10:29:30.334004	\N	104
3	1022	6	t	2026-02-11 01:52:46.462014	\N	107
4	1023	6	t	2026-02-11 01:52:46.462014	\N	107
\.


--
-- Data for Name: funcionarios_entidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios_entidades (id, funcionario_id, entidade_id, ativo, data_vinculo, data_desvinculo) FROM stdin;
1	1008	100	t	2026-02-10 03:34:31.346394	\N
2	1009	100	t	2026-02-10 03:34:31.346394	\N
3	1016	105	t	2026-02-10 12:33:30.10471	\N
4	1017	105	t	2026-02-10 12:33:30.10471	\N
5	1018	100	t	2026-02-11 00:59:46.425929	\N
6	1019	100	t	2026-02-11 00:59:46.425929	\N
7	1020	106	t	2026-02-11 01:04:34.424847	\N
8	1021	106	t	2026-02-11 01:04:34.424847	\N
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

COPY public.laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url, relatorio_individual, relatorio_lote, relatorio_setor, hash_relatorio_individual, hash_relatorio_lote, hash_relatorio_setor, arquivo_remoto_uploaded_at, arquivo_remoto_etag, arquivo_remoto_size, hash_pdf) FROM stdin;
1002	1002	\N	\N	rascunho	2026-02-10 11:29:28.439742	\N	\N	2026-02-10 11:29:28.439742	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1003	1003	\N	\N	rascunho	2026-02-10 11:30:56.337043	\N	\N	2026-02-10 11:30:56.337043	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1004	1004	\N	\N	rascunho	2026-02-10 12:10:36.722222	\N	\N	2026-02-10 12:10:36.722222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1006	1006	\N	\N	rascunho	2026-02-10 12:33:46.635319	\N	\N	2026-02-10 12:33:46.635319	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1005	1005	53051173991	\N	emitido	2026-02-10 12:21:47.979581	2026-02-10 20:53:23.011417	\N	2026-02-10 22:38:56.401957	\N	backblaze	laudos-qwork	laudos/lote-1005/laudo-1770756960778-42nlgb.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1005/laudo-1770756960778-42nlgb.pdf	\N	\N	\N	\N	\N	\N	2026-02-10 22:38:56.401957	"35a6e9f8ecfdb88d4d53f2fcc57a4518"	\N	0014e8529251d7093cef87d99e52c79bad641db94ab9381984eb023579e2b684
1007	1007	53051173991	\N	emitido	2026-02-10 14:13:18.784349	2026-02-10 21:57:09.352366	\N	2026-02-10 22:38:56.417801	\N	backblaze	laudos-qwork	laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf	\N	\N	\N	\N	\N	\N	2026-02-10 22:38:56.417801	"d1ebe1fe7546928487aa5b32270c0b27"	577310	e843e534ff0a6beb94817e0d94d48e640b37e421666a0313970813f5453638c1
1008	1008	53051173991	\N	emitido	2026-02-11 01:17:41.164409	2026-02-11 01:18:16.24153	\N	2026-02-11 01:18:34.481805	\N	backblaze	laudos-qwork	laudos/lote-1008/laudo-1770772751916-8j47zr.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1008/laudo-1770772751916-8j47zr.pdf	\N	\N	\N	\N	\N	\N	2026-02-11 01:18:34.481805	"7ce2e35be5258189daa574e045af106d"	640751	7b05ed01ab03ae05d6a346f30888ede8746c9c54d223ae41b066441c16483633
1009	1009	53051173991	\N	emitido	2026-02-11 01:53:04.39101	2026-02-11 02:06:00.908827	\N	2026-02-11 02:06:15.641617	\N	backblaze	laudos-qwork	laudos/lote-1009/laudo-1770775613063-d02f0l.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1009/laudo-1770775613063-d02f0l.pdf	\N	\N	\N	\N	\N	\N	2026-02-11 02:06:15.641617	"f19fb51fd6b9108757b358e9417f463b"	639837	ef5f33ca349c8b1399c7d7f0723ecf1d490c62509bbe49d7f279adc7b51eb3c6
1010	1010	\N	\N	rascunho	2026-02-12 12:24:06.406657	\N	\N	2026-02-12 12:24:06.406657	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
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
1010
\.


--
-- Data for Name: lotes_avaliacao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, contratante_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em) FROM stdin;
1002	\N	\N	Lote 1 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-10 11:29:28.439742	2026-02-10 11:29:28.439742	2026-02-10 11:29:28.439742	\N	1	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N
1003	104	5	Lote 1 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-10 11:30:56.337043	2026-02-10 11:30:56.337043	2026-02-10 11:30:56.337043	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1004	\N	\N	Lote 2 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	\N	2	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N
1006	\N	\N	Lote 3 liberado para DDSDSAGADSGGSD. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	24626149073	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	\N	3	\N	\N	\N	\N	\N	105	105	\N	\N	\N	\N	\N	\N	\N	\N	\N
1005	104	5	Lote 2 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-10 12:21:47.979581	2026-02-10 12:21:47.979581	2026-02-10 19:46:39.971473	\N	2	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-10 17:22:32.905537+00	25.00	c37df516-0283-4077-8207-43a5291f6777	\N	2026-02-10 19:46:22.317626+00	pix	1	2026-02-10 19:46:39.971473+00
1007	\N	\N	Lote 4 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-10 14:13:18.784349	2026-02-10 14:13:18.784349	2026-02-10 19:51:55.641195	\N	4	\N	\N	\N	\N	\N	100	100	pago	2026-02-10 19:50:59.93632+00	100.00	3351da28-10bb-4d66-8b85-ba934f57f24a	\N	2026-02-10 19:51:40.174121+00	boleto	4	2026-02-10 19:51:55.641195+00
1008	\N	\N	Lote 5 liberado para Empresa Privada Final. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	35051737030	2026-02-11 01:05:34.180476	2026-02-11 01:05:34.180476	2026-02-11 01:16:19.911755	\N	5	\N	\N	\N	\N	\N	106	106	pago	2026-02-11 01:15:05.870431+00	23.33	e22cbf01-6a25-49da-bd67-437ccdad074c	\N	2026-02-11 01:15:59.845042+00	boleto	1	2026-02-11 01:16:19.911755+00
1009	107	6	Lote 1 liberado para Empresa clin fina 001. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-11 01:53:04.39101	2026-02-11 01:53:04.39101	2026-02-11 02:03:15.828649	\N	1	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-11 02:02:12.860741+00	55.00	49ac333d-0884-4530-8bd6-0749566bd0c6	\N	2026-02-11 02:02:48.098336+00	transferencia	1	2026-02-11 02:03:15.828649+00
1010	104	5	Lote 3 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-12 12:24:06.406657	2026-02-12 12:24:06.406657	2026-02-12 12:34:04.859771	\N	3	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-12 12:32:18.127816+00	25.00	fe86cdf5-4356-4fee-b272-2df43286428f	\N	2026-02-12 12:33:32.859493+00	pix	1	2026-02-12 12:34:04.859771+00
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
1	RLS_POLICY	Always match policy name with table name	-- WRONG:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON funcionarios;\n\n-- CORRECT:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;	2026-02-09 20:16:44.890059
2	RLS_POLICY	Use safe_drop_policy() function in migrations	-- SAFE (validates before dropping):\nSELECT safe_drop_policy('avaliacoes_own_select', 'avaliacoes');\n\n-- This will fail if policy name does not match table:\nSELECT safe_drop_policy('avaliacoes_own_select', 'funcionarios');\n-- ERROR: Policy name does not match table	2026-02-09 20:16:44.890059
3	RLS_POLICY	Policy naming convention: <table>_<perfil>_<action>	avaliacoes_own_select    -- funcionario SELECT on avaliacoes\navaliacoes_rh_clinica    -- RH SELECT on avaliacoes\nlotes_emissor_select     -- emissor SELECT on lotes_avaliacao\nempresas_block_admin     -- RESTRICTIVE blocking admin	2026-02-09 20:16:44.890059
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes (id, tipo, prioridade, destinatario_cpf, destinatario_tipo, titulo, mensagem, dados_contexto, link_acao, botao_texto, lida, data_leitura, arquivada, contratacao_personalizada_id, criado_em, expira_em, resolvida, data_resolucao, resolvido_por_cpf, clinica_id, data_evento, tomador_tipo) FROM stdin;
1	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1005. Aguarde o link de pagamento.	{"lote_id": 1005}	\N	\N	f	\N	f	\N	2026-02-10 17:22:33.287457	\N	f	\N	\N	\N	\N	\N
2	emissao_solicitada_sucesso	media	29930511059	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1007. Aguarde o link de pagamento.	{"lote_id": 1007}	\N	\N	f	\N	f	\N	2026-02-10 19:51:00.173562	\N	f	\N	\N	\N	\N	\N
3	emissao_solicitada_sucesso	media	35051737030	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1008. Aguarde o link de pagamento.	{"lote_id": 1008}	\N	\N	f	\N	f	\N	2026-02-11 01:15:06.109694	\N	f	\N	\N	\N	\N	\N
4	emissao_solicitada_sucesso	media	64411953056	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1009. Aguarde o link de pagamento.	{"lote_id": 1009}	\N	\N	f	\N	f	\N	2026-02-11 02:02:13.099044	\N	f	\N	\N	\N	\N	\N
5	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1010. Aguarde o link de pagamento.	{"lote_id": 1010}	\N	\N	f	\N	f	\N	2026-02-12 12:32:18.367231	\N	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: notificacoes_admin; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_admin (id, tipo, mensagem, lote_id, visualizada, criado_em, titulo, contrato_id, pagamento_id, dados_contexto, lida, resolvida, data_leitura, data_resolucao, resolvido_por_cpf, observacoes_resolucao, atualizado_em, entidade_id, clinica_id) FROM stdin;
\.


--
-- Data for Name: notificacoes_traducoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) FROM stdin;
1	pre_cadastro_criado_titulo	pt_BR	Novo Pre-Cadastro: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
2	pre_cadastro_criado_mensagem	pt_BR	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
3	pre_cadastro_criado_botao	pt_BR	Definir Valor	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
4	pre_cadastro_criado_titulo	en_US	New Pre-Registration: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
5	pre_cadastro_criado_mensagem	en_US	A new personalized plan pre-registration has been created and awaits value definition. Estimated employees: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
6	pre_cadastro_criado_botao	en_US	Set Value	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
7	pre_cadastro_criado_titulo	es_ES	Nuevo Pre-Registro: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
8	pre_cadastro_criado_mensagem	es_ES	Se ha creado un nuevo pre-registro de plan personalizado y espera definicion de valor. Empleados estimados: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
9	pre_cadastro_criado_botao	es_ES	Definir Valor	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pagamentos (id, valor, metodo, status, plataforma_id, plataforma_nome, dados_adicionais, data_pagamento, data_confirmacao, comprovante_path, observacoes, criado_em, atualizado_em, numero_parcelas, recibo_url, recibo_numero, detalhes_parcelas, numero_funcionarios, valor_por_funcionario, contrato_id, idempotency_key, external_transaction_id, provider_event_id, entidade_id, clinica_id, tomador_id) FROM stdin;
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
1	manage:rh	rh	manage	Gerenciar cadastro de usuários RH	2026-02-09 20:16:00.131613
2	manage:clinicas	clinicas	manage	Gerenciar cadastro de clínicas	2026-02-09 20:16:00.131613
3	manage:admins	admins	manage	Gerenciar cadastro de outros administradores	2026-02-09 20:16:00.131613
\.


--
-- Data for Name: planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.planos (id, tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, created_at, updated_at, caracteristicas) FROM stdin;
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

COPY public.recibos (id, contrato_id, pagamento_id, numero_recibo, vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento, numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, conteudo_pdf_path, conteudo_texto, emitido_por_cpf, ativo, criado_em, atualizado_em, pdf, hash_pdf, ip_emissao, emitido_por, hash_incluso, backup_path, parcela_numero, clinica_id, entidade_id) FROM stdin;
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
38	10005	1	Q1	50	2026-02-10 13:59:33.074922	1
39	10005	1	Q2	75	2026-02-10 13:59:37.227878	2
40	10005	1	Q3	75	2026-02-10 13:59:44.455314	3
41	10005	1	Q9	75	2026-02-10 13:59:51.147307	9
42	10005	2	Q13	75	2026-02-10 13:59:54.087948	13
43	10005	2	Q17	100	2026-02-10 13:59:57.212524	17
44	10005	2	Q18	75	2026-02-10 14:00:02.669088	18
45	10005	2	Q19	75	2026-02-10 14:00:05.918539	19
46	10005	3	Q20	25	2026-02-10 14:00:09.663329	20
47	10005	3	Q21	75	2026-02-10 14:00:14.160337	21
48	10005	3	Q23	75	2026-02-10 14:00:17.91649	23
49	10005	3	Q25	50	2026-02-10 14:00:21.06307	25
50	10005	3	Q26	100	2026-02-10 14:00:24.155451	26
51	10005	3	Q28	25	2026-02-10 14:00:27.660011	28
52	10005	4	Q31	0	2026-02-10 14:00:31.61412	31
53	10005	4	Q32	0	2026-02-10 14:00:34.448679	32
54	10005	4	Q33	25	2026-02-10 14:01:16.559797	33
55	10005	4	Q34	50	2026-02-10 14:01:21.556927	34
56	10005	5	Q35	50	2026-02-10 14:01:25.999272	35
57	10005	5	Q38	50	2026-02-10 14:01:33.075611	38
58	10005	5	Q41	50	2026-02-10 14:01:59.285944	41
59	10005	6	Q43	50	2026-02-10 14:02:03.193399	43
60	10005	6	Q45	50	2026-02-10 14:02:06.823225	45
61	10005	7	Q48	50	2026-02-10 14:02:10.006696	48
62	10005	7	Q52	50	2026-02-10 14:02:27.016982	52
63	10005	7	Q55	50	2026-02-10 14:02:30.373196	55
64	10005	8	Q56	50	2026-02-10 14:02:38.304935	56
65	10005	8	Q57	50	2026-02-10 14:02:41.710134	57
66	10005	8	Q58	50	2026-02-10 14:02:44.891071	58
67	10005	9	Q59	25	2026-02-10 14:03:01.883215	59
68	10005	9	Q61	0	2026-02-10 14:03:05.312177	61
69	10005	9	Q62	0	2026-02-10 14:03:09.984875	62
70	10005	9	Q64	0	2026-02-10 14:03:13.438805	64
71	10005	10	Q65	25	2026-02-10 14:03:30.041919	65
72	10005	10	Q66	75	2026-02-10 14:03:33.580706	66
73	10005	10	Q68	75	2026-02-10 14:03:36.651537	68
74	10005	10	Q70	50	2026-02-10 14:05:43.735929	70
76	10010	1	Q1	50	2026-02-10 15:56:20.480361	1
77	10010	1	Q2	100	2026-02-10 15:56:25.683132	2
78	10010	1	Q3	75	2026-02-10 15:56:29.595141	3
79	10010	1	Q9	75	2026-02-10 15:56:36.08997	9
81	10010	2	Q17	100	2026-02-10 15:56:49.474841	17
82	10010	2	Q18	100	2026-02-10 15:56:55.394664	18
83	10010	2	Q19	75	2026-02-10 15:57:02.504177	19
84	10010	3	Q20	75	2026-02-10 15:57:05.938749	20
85	10010	3	Q21	75	2026-02-10 15:57:12.007244	21
86	10010	3	Q23	75	2026-02-10 15:57:15.81719	23
87	10010	3	Q25	50	2026-02-10 15:57:18.800396	25
88	10010	3	Q26	25	2026-02-10 15:57:26.572553	26
89	10010	3	Q28	75	2026-02-10 15:57:31.048682	28
90	10010	4	Q31	100	2026-02-10 15:57:35.232166	31
91	10010	4	Q32	75	2026-02-10 15:57:38.973934	32
92	10010	4	Q33	50	2026-02-10 15:57:42.445803	33
93	10010	4	Q34	75	2026-02-10 15:57:45.840461	34
94	10010	5	Q35	100	2026-02-10 15:57:49.227015	35
95	10010	5	Q38	75	2026-02-10 15:57:52.620364	38
96	10010	5	Q41	50	2026-02-10 15:57:56.17581	41
97	10010	6	Q43	50	2026-02-10 15:58:01.888002	43
98	10010	6	Q45	100	2026-02-10 15:58:07.612734	45
99	10010	7	Q48	100	2026-02-10 15:58:13.113112	48
100	10010	7	Q52	75	2026-02-10 15:58:17.297903	52
101	10010	7	Q55	100	2026-02-10 15:58:21.693878	55
102	10010	8	Q56	50	2026-02-10 15:58:25.843917	56
103	10010	8	Q57	50	2026-02-10 15:58:28.934621	57
104	10010	8	Q58	50	2026-02-10 15:58:32.049878	58
105	10010	9	Q59	75	2026-02-10 15:58:36.845101	59
106	10010	9	Q61	75	2026-02-10 15:58:41.286532	61
107	10010	9	Q62	75	2026-02-10 15:58:45.032785	62
108	10010	9	Q64	75	2026-02-10 15:58:47.964875	64
109	10010	10	Q65	75	2026-02-10 15:58:51.881687	65
110	10010	10	Q66	75	2026-02-10 15:58:55.621073	66
111	10010	10	Q68	100	2026-02-10 15:59:00.204789	68
112	10010	10	Q70	75	2026-02-10 15:59:05.184533	70
80	10010	2	Q13	75	2026-02-10 16:07:53.988231	13
114	10011	1	Q1	75	2026-02-10 16:09:11.472944	1
115	10011	1	Q2	75	2026-02-10 16:09:16.79585	2
116	10011	1	Q3	75	2026-02-10 16:09:22.572503	3
117	10011	1	Q9	75	2026-02-10 16:09:26.606898	9
118	10011	2	Q13	25	2026-02-10 16:09:45.493072	13
119	10011	2	Q17	25	2026-02-10 16:09:52.340917	17
120	10011	2	Q18	25	2026-02-10 16:09:58.855393	18
121	10011	2	Q19	25	2026-02-10 16:10:02.700107	19
122	10011	3	Q20	25	2026-02-10 16:10:06.392966	20
123	10011	3	Q21	50	2026-02-10 16:10:14.51995	21
124	10011	3	Q23	25	2026-02-10 16:10:33.984992	23
125	10011	3	Q25	25	2026-02-10 16:10:39.516106	25
126	10011	3	Q26	25	2026-02-10 16:10:44.295938	26
127	10011	3	Q28	50	2026-02-10 16:11:12.603774	28
128	10011	4	Q31	50	2026-02-10 16:11:17.274968	31
129	10011	4	Q32	25	2026-02-10 16:11:39.640024	32
130	10011	4	Q33	50	2026-02-10 16:11:50.419815	33
131	10011	4	Q34	50	2026-02-10 16:11:58.774659	34
132	10011	5	Q35	50	2026-02-10 16:12:02.924736	35
133	10011	5	Q38	50	2026-02-10 16:12:09.65613	38
134	10011	5	Q41	50	2026-02-10 16:12:30.649373	41
135	10011	6	Q43	50	2026-02-10 16:12:36.494594	43
136	10011	6	Q45	50	2026-02-10 16:12:42.295584	45
137	10011	7	Q48	50	2026-02-10 16:12:50.99884	48
138	10011	7	Q52	50	2026-02-10 16:12:55.826776	52
139	10011	7	Q55	25	2026-02-10 16:13:28.25	55
140	10011	8	Q56	25	2026-02-10 16:13:33.323843	56
141	10011	8	Q57	50	2026-02-10 16:13:40.672495	57
142	10011	8	Q58	50	2026-02-10 16:14:19.185915	58
143	10011	9	Q59	50	2026-02-10 16:14:23.819227	59
144	10011	9	Q61	50	2026-02-10 16:14:30.469186	61
145	10011	9	Q62	50	2026-02-10 16:14:36.211701	62
146	10011	9	Q64	50	2026-02-10 16:14:39.813095	64
147	10011	10	Q65	50	2026-02-10 16:17:13.797576	65
148	10011	10	Q66	75	2026-02-10 16:17:17.973119	66
149	10011	10	Q68	50	2026-02-10 16:17:22.898575	68
150	10011	10	Q70	75	2026-02-10 16:29:31.825739	70
152	10006	1	Q1	50	2026-02-10 16:31:26.135309	1
153	10006	1	Q2	75	2026-02-10 16:31:31.139792	2
154	10006	1	Q3	75	2026-02-10 16:31:35.500706	3
155	10006	1	Q9	50	2026-02-10 16:31:49.121508	9
156	10006	2	Q13	75	2026-02-10 16:31:52.851357	13
157	10006	2	Q17	75	2026-02-10 16:31:58.211086	17
158	10006	2	Q18	75	2026-02-10 16:32:02.356868	18
159	10006	2	Q19	50	2026-02-10 16:33:31.93558	19
160	10006	3	Q20	50	2026-02-10 16:33:55.048006	20
161	10006	3	Q21	50	2026-02-10 16:33:59.541398	21
162	10006	3	Q23	50	2026-02-10 16:34:07.790169	23
163	10006	3	Q25	50	2026-02-10 16:34:24.206618	25
164	10006	3	Q26	50	2026-02-10 16:34:38.379734	26
165	10006	3	Q28	0	2026-02-10 16:35:10.534291	28
166	10006	4	Q31	0	2026-02-10 16:35:15.640904	31
167	10006	4	Q32	0	2026-02-10 16:35:26.159933	32
168	10006	4	Q33	0	2026-02-10 16:35:32.084246	33
169	10006	4	Q34	0	2026-02-10 16:35:41.595259	34
170	10006	5	Q35	50	2026-02-10 16:36:18.445811	35
171	10006	5	Q38	50	2026-02-10 16:36:24.837684	38
172	10006	5	Q41	25	2026-02-10 16:36:35.450928	41
173	10006	6	Q43	25	2026-02-10 16:36:40.61554	43
174	10006	6	Q45	25	2026-02-10 16:36:46.240787	45
175	10006	7	Q48	25	2026-02-10 16:37:08.30334	48
176	10006	7	Q52	25	2026-02-10 16:37:12.502367	52
177	10006	7	Q55	25	2026-02-10 16:37:19.206265	55
178	10006	8	Q56	25	2026-02-10 16:37:24.150145	56
179	10006	8	Q57	25	2026-02-10 16:37:27.638514	57
180	10006	8	Q58	25	2026-02-10 16:37:32.954094	58
181	10006	9	Q59	25	2026-02-10 16:37:36.70875	59
182	10006	9	Q61	25	2026-02-10 16:37:59.591722	61
183	10006	9	Q62	50	2026-02-10 16:38:04.084354	62
184	10006	9	Q64	0	2026-02-10 16:38:47.144493	64
185	10006	10	Q65	25	2026-02-10 16:38:51.390467	65
186	10006	10	Q66	25	2026-02-10 16:38:56.935974	66
187	10006	10	Q68	25	2026-02-10 16:39:02.965874	68
188	10006	10	Q70	25	2026-02-10 16:39:08.222252	70
189	10007	1	Q1	25	2026-02-10 16:40:31.595478	1
190	10007	1	Q2	25	2026-02-10 16:40:35.857867	2
191	10007	1	Q3	25	2026-02-10 16:41:42.066713	3
192	10007	1	Q9	50	2026-02-10 16:41:46.329433	9
193	10007	2	Q13	50	2026-02-10 16:41:57.348558	13
194	10007	2	Q17	50	2026-02-10 16:42:04.659846	17
195	10007	2	Q18	50	2026-02-10 16:42:10.604031	18
196	10007	2	Q19	50	2026-02-10 16:42:20.340466	19
197	10007	3	Q20	75	2026-02-10 16:42:31.416947	20
198	10007	3	Q21	75	2026-02-10 16:47:23.448181	21
199	10007	3	Q23	25	2026-02-10 16:47:27.388212	23
200	10007	3	Q25	50	2026-02-10 16:47:34.64335	25
201	10007	3	Q26	50	2026-02-10 16:47:46.470273	26
202	10007	3	Q28	50	2026-02-10 16:48:07.0429	28
203	10007	4	Q31	50	2026-02-10 16:48:12.209767	31
204	10007	4	Q32	50	2026-02-10 16:48:16.13863	32
205	10007	4	Q33	50	2026-02-10 16:48:20.537639	33
206	10007	4	Q34	25	2026-02-10 16:48:32.110013	34
207	10007	5	Q35	25	2026-02-10 16:49:28.695268	35
208	10007	5	Q38	50	2026-02-10 16:49:33.698846	38
209	10007	5	Q41	50	2026-02-10 16:49:37.871391	41
210	10007	6	Q43	25	2026-02-10 16:50:36.820946	43
211	10007	6	Q45	25	2026-02-10 16:50:40.871629	45
212	10007	7	Q48	25	2026-02-10 16:50:46.5294	48
213	10007	7	Q52	50	2026-02-10 16:50:50.560707	52
214	10007	7	Q55	25	2026-02-10 16:50:53.933018	55
215	10007	8	Q56	50	2026-02-10 16:51:09.003957	56
216	10007	8	Q57	50	2026-02-10 16:51:13.707233	57
217	10007	8	Q58	75	2026-02-10 16:51:17.295745	58
218	10007	9	Q59	75	2026-02-10 16:51:22.708434	59
219	10007	9	Q61	75	2026-02-10 16:52:42.894121	61
220	10007	9	Q62	75	2026-02-10 16:52:47.027134	62
221	10007	9	Q64	75	2026-02-10 16:52:53.504114	64
222	10007	10	Q65	50	2026-02-10 16:52:58.658339	65
223	10007	10	Q66	50	2026-02-10 16:53:04.632409	66
224	10007	10	Q68	75	2026-02-10 16:53:08.685925	68
225	10007	10	Q70	50	2026-02-10 16:53:12.860273	70
226	10012	1	Q1	50	2026-02-11 01:06:41.321608	1
227	10012	1	Q2	50	2026-02-11 01:06:49.446946	2
228	10012	1	Q3	100	2026-02-11 01:06:57.526775	3
229	10012	1	Q9	75	2026-02-11 01:07:01.257662	9
230	10013	1	Q1	75	2026-02-11 01:09:16.744224	1
231	10013	1	Q2	75	2026-02-11 01:09:21.795566	2
232	10013	1	Q3	50	2026-02-11 01:09:31.371567	3
233	10013	1	Q9	0	2026-02-11 01:09:36.795024	9
234	10013	2	Q13	75	2026-02-11 01:09:42.97181	13
235	10013	2	Q17	25	2026-02-11 01:09:49.208309	17
236	10013	2	Q18	100	2026-02-11 01:09:53.703465	18
237	10012	2	Q13	75	2026-02-11 01:09:55.922028	13
238	10013	2	Q19	100	2026-02-11 01:09:58.054907	19
239	10012	2	Q17	75	2026-02-11 01:10:00.717159	17
240	10013	3	Q20	75	2026-02-11 01:10:01.965989	20
241	10013	3	Q21	50	2026-02-11 01:10:06.106867	21
242	10012	2	Q18	75	2026-02-11 01:10:09.064967	18
243	10013	3	Q23	75	2026-02-11 01:10:10.65306	23
244	10013	3	Q25	75	2026-02-11 01:10:15.035311	25
245	10013	3	Q26	100	2026-02-11 01:10:19.299016	26
246	10012	2	Q19	50	2026-02-11 01:10:21.143579	19
247	10013	3	Q28	75	2026-02-11 01:10:24.04991	28
248	10013	4	Q31	75	2026-02-11 01:10:29.364754	31
249	10013	4	Q32	50	2026-02-11 01:10:34.898303	32
250	10013	4	Q33	100	2026-02-11 01:10:39.604891	33
251	10013	4	Q34	50	2026-02-11 01:10:44.693715	34
252	10013	5	Q35	25	2026-02-11 01:10:49.193571	35
253	10013	5	Q38	0	2026-02-11 01:10:55.023173	38
254	10013	5	Q41	75	2026-02-11 01:10:59.509231	41
255	10013	6	Q43	100	2026-02-11 01:11:08.041099	43
256	10013	6	Q45	50	2026-02-11 01:11:13.146588	45
257	10013	7	Q48	25	2026-02-11 01:11:17.704004	48
258	10013	7	Q52	75	2026-02-11 01:11:21.684798	52
259	10013	7	Q55	100	2026-02-11 01:11:26.283882	55
260	10012	3	Q20	75	2026-02-11 01:11:30.297468	20
261	10013	8	Q56	50	2026-02-11 01:11:31.367221	56
262	10013	8	Q57	25	2026-02-11 01:11:35.512424	57
263	10013	8	Q58	75	2026-02-11 01:11:39.474921	58
264	10012	3	Q21	75	2026-02-11 01:11:40.659154	21
265	10013	9	Q59	50	2026-02-11 01:11:43.530166	59
266	10012	3	Q23	100	2026-02-11 01:11:44.353682	23
267	10013	9	Q61	100	2026-02-11 01:11:47.521565	61
268	10012	3	Q25	75	2026-02-11 01:11:47.951812	25
269	10013	9	Q62	75	2026-02-11 01:11:51.426823	62
270	10013	9	Q64	50	2026-02-11 01:11:57.314212	64
271	10012	3	Q26	50	2026-02-11 01:12:00.12709	26
272	10013	10	Q65	25	2026-02-11 01:12:01.807143	65
273	10012	3	Q28	100	2026-02-11 01:12:05.670101	28
274	10013	10	Q66	0	2026-02-11 01:12:05.887423	66
275	10012	4	Q31	75	2026-02-11 01:12:09.62471	31
276	10013	10	Q68	75	2026-02-11 01:12:09.835745	68
277	10012	4	Q32	50	2026-02-11 01:12:13.205952	32
278	10013	10	Q70	0	2026-02-11 01:12:14.031421	70
279	10012	4	Q33	75	2026-02-11 01:12:16.451158	33
280	10012	4	Q34	100	2026-02-11 01:12:21.297367	34
281	10012	5	Q35	50	2026-02-11 01:13:16.65595	35
282	10012	5	Q38	75	2026-02-11 01:13:21.719955	38
283	10012	5	Q41	25	2026-02-11 01:13:28.626182	41
284	10012	6	Q43	50	2026-02-11 01:13:32.757964	43
285	10012	6	Q45	25	2026-02-11 01:13:37.345311	45
286	10012	7	Q48	75	2026-02-11 01:13:43.095307	48
287	10012	7	Q52	75	2026-02-11 01:13:47.220379	52
288	10012	7	Q55	25	2026-02-11 01:13:51.36264	55
289	10012	8	Q56	25	2026-02-11 01:13:55.761381	56
290	10012	8	Q57	50	2026-02-11 01:13:59.156512	57
291	10012	8	Q58	75	2026-02-11 01:14:03.169838	58
292	10012	9	Q59	75	2026-02-11 01:14:07.659842	59
293	10012	9	Q61	75	2026-02-11 01:14:11.988845	61
294	10012	9	Q62	50	2026-02-11 01:14:16.124821	62
295	10012	9	Q64	50	2026-02-11 01:14:20.467238	64
296	10012	10	Q65	50	2026-02-11 01:14:25.350214	65
297	10012	10	Q66	75	2026-02-11 01:14:30.11596	66
298	10012	10	Q68	100	2026-02-11 01:14:35.187298	68
299	10012	10	Q70	50	2026-02-11 01:14:39.82709	70
300	10014	1	Q1	50	2026-02-11 01:55:06.512359	1
301	10014	1	Q2	50	2026-02-11 01:55:11.73246	2
302	10014	1	Q3	100	2026-02-11 01:55:16.964395	3
303	10014	1	Q9	25	2026-02-11 01:55:21.275027	9
304	10014	2	Q13	50	2026-02-11 01:55:25.909054	13
305	10014	2	Q17	100	2026-02-11 01:55:30.302315	17
306	10014	2	Q18	25	2026-02-11 01:55:34.73826	18
307	10014	2	Q19	25	2026-02-11 01:55:38.931342	19
308	10014	3	Q20	75	2026-02-11 01:55:42.932187	20
309	10014	3	Q21	25	2026-02-11 01:55:46.935963	21
310	10014	3	Q23	100	2026-02-11 01:55:51.480321	23
311	10014	3	Q25	75	2026-02-11 01:55:56.006453	25
312	10014	3	Q26	25	2026-02-11 01:55:59.811832	26
313	10014	3	Q28	100	2026-02-11 01:56:04.922572	28
314	10014	4	Q31	75	2026-02-11 01:56:09.410573	31
315	10014	4	Q32	75	2026-02-11 01:56:13.587317	32
316	10014	4	Q33	50	2026-02-11 01:56:24.233713	33
317	10014	4	Q34	100	2026-02-11 01:56:27.900026	34
318	10014	5	Q35	50	2026-02-11 01:56:31.328808	35
319	10014	5	Q38	75	2026-02-11 01:56:35.642792	38
320	10014	5	Q41	100	2026-02-11 01:56:39.971553	41
321	10014	6	Q43	100	2026-02-11 01:56:44.313316	43
322	10014	6	Q45	75	2026-02-11 01:56:48.526989	45
323	10014	7	Q48	50	2026-02-11 01:56:53.121704	48
324	10014	7	Q52	50	2026-02-11 01:56:57.298732	52
325	10014	7	Q55	50	2026-02-11 01:57:01.227462	55
326	10014	8	Q56	50	2026-02-11 01:57:04.837072	56
327	10014	8	Q57	50	2026-02-11 01:57:08.371527	57
328	10014	8	Q58	50	2026-02-11 01:57:12.817349	58
329	10014	9	Q59	100	2026-02-11 01:57:16.558245	59
330	10014	9	Q61	50	2026-02-11 01:57:20.055312	61
331	10014	9	Q62	50	2026-02-11 01:57:23.922183	62
332	10014	9	Q64	100	2026-02-11 01:57:27.7918	64
333	10014	10	Q65	50	2026-02-11 01:57:31.250285	65
334	10014	10	Q66	50	2026-02-11 01:57:35.306775	66
335	10014	10	Q68	50	2026-02-11 01:57:46.550704	68
336	10014	10	Q70	75	2026-02-11 01:57:52.292204	70
337	10015	1	Q1	25	2026-02-11 01:59:01.440257	1
338	10015	1	Q2	75	2026-02-11 01:59:06.717157	2
339	10015	1	Q3	75	2026-02-11 01:59:11.000665	3
340	10015	1	Q9	25	2026-02-11 01:59:15.533047	9
341	10015	2	Q13	25	2026-02-11 01:59:20.456826	13
342	10015	2	Q17	75	2026-02-11 01:59:24.690627	17
343	10015	2	Q18	75	2026-02-11 01:59:28.79853	18
344	10015	2	Q19	75	2026-02-11 01:59:32.419383	19
345	10015	3	Q20	75	2026-02-11 01:59:36.390389	20
346	10015	3	Q21	25	2026-02-11 01:59:41.756898	21
347	10015	3	Q23	25	2026-02-11 01:59:49.876523	23
348	10015	3	Q25	75	2026-02-11 01:59:54.175429	25
349	10015	3	Q26	75	2026-02-11 01:59:59.432685	26
350	10015	3	Q28	75	2026-02-11 02:00:03.609462	28
351	10015	4	Q31	25	2026-02-11 02:00:07.55693	31
352	10015	4	Q32	75	2026-02-11 02:00:11.696528	32
353	10015	4	Q33	75	2026-02-11 02:00:15.796565	33
354	10015	4	Q34	25	2026-02-11 02:00:22.651937	34
355	10015	5	Q35	75	2026-02-11 02:00:26.738654	35
356	10015	5	Q38	75	2026-02-11 02:00:30.857899	38
357	10015	5	Q41	75	2026-02-11 02:00:35.092183	41
358	10015	6	Q43	75	2026-02-11 02:00:39.547125	43
359	10015	6	Q45	50	2026-02-11 02:00:43.115373	45
360	10015	7	Q48	100	2026-02-11 02:00:46.222117	48
361	10015	7	Q52	50	2026-02-11 02:00:49.647863	52
362	10015	7	Q55	50	2026-02-11 02:00:53.512868	55
363	10015	8	Q56	100	2026-02-11 02:00:57.1363	56
364	10015	8	Q57	50	2026-02-11 02:01:00.910268	57
365	10015	8	Q58	75	2026-02-11 02:01:05.355739	58
366	10015	9	Q59	75	2026-02-11 02:01:10.737808	59
367	10015	9	Q61	50	2026-02-11 02:01:15.193487	61
368	10015	9	Q62	75	2026-02-11 02:01:19.366199	62
369	10015	9	Q64	50	2026-02-11 02:01:24.180442	64
370	10015	10	Q65	50	2026-02-11 02:01:28.743209	65
371	10015	10	Q66	100	2026-02-11 02:01:32.859857	66
372	10015	10	Q68	75	2026-02-11 02:01:38.026951	68
373	10015	10	Q70	50	2026-02-11 02:01:42.635354	70
374	10017	1	Q1	50	2026-02-12 12:28:15.17167	1
375	10017	1	Q2	50	2026-02-12 12:28:19.755796	2
376	10016	1	Q1	75	2026-02-12 12:28:21.419223	1
377	10017	1	Q3	75	2026-02-12 12:28:24.446548	3
378	10017	1	Q9	50	2026-02-12 12:28:29.52008	9
379	10017	2	Q13	50	2026-02-12 12:28:33.734579	13
380	10016	1	Q2	75	2026-02-12 12:28:36.279463	2
381	10016	1	Q3	100	2026-02-12 12:28:40.353233	3
382	10017	2	Q17	50	2026-02-12 12:28:41.976773	17
383	10016	1	Q9	75	2026-02-12 12:28:44.367572	9
384	10016	2	Q13	75	2026-02-12 12:28:49.500989	13
385	10017	2	Q18	25	2026-02-12 12:28:50.022699	18
386	10016	2	Q17	75	2026-02-12 12:28:54.330812	17
387	10017	2	Q19	25	2026-02-12 12:28:59.208215	19
388	10016	2	Q18	75	2026-02-12 12:29:00.806959	18
389	10017	3	Q20	50	2026-02-12 12:29:03.455372	20
390	10016	2	Q19	75	2026-02-12 12:29:04.894941	19
391	10017	3	Q21	50	2026-02-12 12:29:07.42726	21
392	10016	3	Q20	75	2026-02-12 12:29:10.140945	20
393	10017	3	Q23	100	2026-02-12 12:29:10.783697	23
394	10017	3	Q25	0	2026-02-12 12:29:14.516597	25
395	10016	3	Q21	75	2026-02-12 12:29:15.859416	21
396	10017	3	Q26	75	2026-02-12 12:29:19.533347	26
397	10016	3	Q23	100	2026-02-12 12:29:19.733977	23
398	10017	3	Q28	75	2026-02-12 12:29:24.023185	28
399	10016	3	Q25	75	2026-02-12 12:29:24.123993	25
400	10017	4	Q31	50	2026-02-12 12:29:27.979006	31
401	10016	3	Q26	100	2026-02-12 12:29:28.30429	26
402	10017	4	Q32	75	2026-02-12 12:29:31.345254	32
403	10016	3	Q28	75	2026-02-12 12:29:31.869022	28
404	10017	4	Q33	50	2026-02-12 12:29:34.503837	33
405	10016	4	Q31	100	2026-02-12 12:29:34.968647	31
406	10017	4	Q34	50	2026-02-12 12:29:37.918363	34
407	10016	4	Q32	100	2026-02-12 12:29:40.189917	32
408	10017	5	Q35	100	2026-02-12 12:29:41.310598	35
409	10016	4	Q33	75	2026-02-12 12:29:43.175927	33
410	10017	5	Q38	100	2026-02-12 12:29:44.797648	38
411	10016	4	Q34	100	2026-02-12 12:29:46.945589	34
412	10017	5	Q41	100	2026-02-12 12:29:48.302159	41
413	10016	5	Q35	75	2026-02-12 12:29:50.358839	35
414	10017	6	Q43	100	2026-02-12 12:29:52.255958	43
415	10016	5	Q38	100	2026-02-12 12:29:53.757086	38
416	10017	6	Q45	50	2026-02-12 12:29:56.15629	45
417	10016	5	Q41	100	2026-02-12 12:29:58.252927	41
418	10017	7	Q48	50	2026-02-12 12:29:59.261093	48
419	10017	7	Q52	0	2026-02-12 12:30:02.495435	52
420	10016	6	Q43	75	2026-02-12 12:30:04.507952	43
421	10017	7	Q55	0	2026-02-12 12:30:05.770507	55
422	10016	6	Q45	75	2026-02-12 12:30:07.8728	45
423	10017	8	Q56	0	2026-02-12 12:30:09.38321	56
424	10016	7	Q48	100	2026-02-12 12:30:11.637822	48
425	10017	8	Q57	0	2026-02-12 12:30:12.813891	57
426	10017	8	Q58	50	2026-02-12 12:30:16.208399	58
427	10016	7	Q52	100	2026-02-12 12:30:17.675174	52
428	10016	7	Q55	100	2026-02-12 12:30:22.297451	55
429	10017	9	Q59	50	2026-02-12 12:30:24.489084	59
430	10016	8	Q56	100	2026-02-12 12:30:26.713026	56
431	10017	9	Q61	50	2026-02-12 12:30:28.097163	61
432	10016	8	Q57	100	2026-02-12 12:30:30.35419	57
433	10017	9	Q62	50	2026-02-12 12:30:31.957037	62
434	10016	8	Q58	75	2026-02-12 12:30:34.073881	58
435	10017	9	Q64	50	2026-02-12 12:30:35.50145	64
436	10016	9	Q59	100	2026-02-12 12:30:38.068874	59
437	10017	10	Q65	75	2026-02-12 12:30:39.010176	65
438	10016	9	Q61	100	2026-02-12 12:30:41.499544	61
439	10017	10	Q66	25	2026-02-12 12:30:42.504657	66
440	10016	9	Q62	75	2026-02-12 12:30:45.131045	62
441	10017	10	Q68	50	2026-02-12 12:30:46.35452	68
442	10017	10	Q70	50	2026-02-12 12:30:49.959059	70
443	10016	9	Q64	100	2026-02-12 12:30:50.032667	64
444	10016	10	Q65	75	2026-02-12 12:30:54.042834	65
445	10016	10	Q66	100	2026-02-12 12:30:58.704091	66
446	10016	10	Q68	100	2026-02-12 12:31:03.864231	68
447	10016	10	Q70	75	2026-02-12 12:31:11.529476	70
\.


--
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resultados (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
1	10004	1	Demandas no Trabalho	68.75	alto	2026-02-10 12:39:16.476283
2	10004	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-10 12:39:16.728563
3	10004	3	Relações Sociais e Liderança	70.83	alto	2026-02-10 12:39:16.962587
4	10004	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-10 12:39:17.197026
5	10004	5	Valores Organizacionais	66.67	alto	2026-02-10 12:39:17.431558
6	10004	6	Traços de Personalidade	75.00	alto	2026-02-10 12:39:17.666156
7	10004	7	Saúde e Bem-Estar	66.67	alto	2026-02-10 12:39:17.899844
8	10004	8	Comportamentos Ofensivos	83.33	alto	2026-02-10 12:39:18.134272
9	10004	9	Comportamento de Jogo	87.50	alto	2026-02-10 12:39:18.368264
10	10004	10	Endividamento Financeiro	93.75	alto	2026-02-10 12:39:18.60169
11	10005	1	Demandas no Trabalho	68.75	alto	2026-02-10 14:03:43.243954
12	10005	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-10 14:03:43.488917
13	10005	3	Relações Sociais e Liderança	58.33	medio	2026-02-10 14:03:43.747922
14	10005	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-02-10 14:03:44.005986
15	10005	5	Valores Organizacionais	50.00	medio	2026-02-10 14:03:44.256209
16	10005	6	Traços de Personalidade	50.00	medio	2026-02-10 14:03:44.499191
17	10005	7	Saúde e Bem-Estar	50.00	medio	2026-02-10 14:03:44.74271
18	10005	8	Comportamentos Ofensivos	50.00	medio	2026-02-10 14:03:44.991605
19	10005	9	Comportamento de Jogo	6.25	baixo	2026-02-10 14:03:45.237957
20	10005	10	Endividamento Financeiro	56.25	medio	2026-02-10 14:03:45.490208
31	10010	1	Demandas no Trabalho	75.00	alto	2026-02-10 15:59:09.685745
32	10010	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-02-10 15:59:09.952456
33	10010	3	Relações Sociais e Liderança	62.50	medio	2026-02-10 15:59:10.188316
34	10010	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-10 15:59:10.424043
35	10010	5	Valores Organizacionais	75.00	alto	2026-02-10 15:59:10.659029
36	10010	6	Traços de Personalidade	75.00	alto	2026-02-10 15:59:10.895579
37	10010	7	Saúde e Bem-Estar	91.67	alto	2026-02-10 15:59:11.13178
38	10010	8	Comportamentos Ofensivos	50.00	medio	2026-02-10 15:59:11.366763
39	10010	9	Comportamento de Jogo	75.00	alto	2026-02-10 15:59:11.603479
40	10010	10	Endividamento Financeiro	81.25	alto	2026-02-10 15:59:11.837868
61	10011	1	Demandas no Trabalho	75.00	alto	2026-02-10 16:29:35.288036
62	10011	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-10 16:29:35.288036
63	10011	3	Relações Sociais e Liderança	33.33	medio	2026-02-10 16:29:35.288036
64	10011	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-10 16:29:35.288036
65	10011	5	Valores Organizacionais	50.00	medio	2026-02-10 16:29:35.288036
66	10011	6	Traços de Personalidade	50.00	medio	2026-02-10 16:29:35.288036
67	10011	7	Saúde e Bem-Estar	41.67	medio	2026-02-10 16:29:35.288036
68	10011	8	Comportamentos Ofensivos	41.67	medio	2026-02-10 16:29:35.288036
69	10011	9	Comportamento de Jogo	50.00	medio	2026-02-10 16:29:35.288036
70	10011	10	Endividamento Financeiro	62.50	medio	2026-02-10 16:29:35.288036
71	10006	1	Demandas no Trabalho	62.50	medio	2026-02-10 16:39:11.716723
72	10006	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-10 16:39:11.716723
73	10006	3	Relações Sociais e Liderança	41.67	medio	2026-02-10 16:39:11.716723
74	10006	4	Interface Trabalho-Indivíduo	0.00	baixo	2026-02-10 16:39:11.716723
75	10006	5	Valores Organizacionais	41.67	medio	2026-02-10 16:39:11.716723
76	10006	6	Traços de Personalidade	25.00	baixo	2026-02-10 16:39:11.716723
77	10006	7	Saúde e Bem-Estar	25.00	baixo	2026-02-10 16:39:11.716723
78	10006	8	Comportamentos Ofensivos	25.00	baixo	2026-02-10 16:39:11.716723
79	10006	9	Comportamento de Jogo	25.00	baixo	2026-02-10 16:39:11.716723
80	10006	10	Endividamento Financeiro	25.00	baixo	2026-02-10 16:39:11.716723
81	10007	1	Demandas no Trabalho	31.25	baixo	2026-02-10 16:53:16.783516
82	10007	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-10 16:53:16.783516
83	10007	3	Relações Sociais e Liderança	54.17	medio	2026-02-10 16:53:16.783516
84	10007	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-10 16:53:16.783516
85	10007	5	Valores Organizacionais	41.67	medio	2026-02-10 16:53:16.783516
86	10007	6	Traços de Personalidade	25.00	baixo	2026-02-10 16:53:16.783516
87	10007	7	Saúde e Bem-Estar	33.33	medio	2026-02-10 16:53:16.783516
88	10007	8	Comportamentos Ofensivos	58.33	medio	2026-02-10 16:53:16.783516
89	10007	9	Comportamento de Jogo	75.00	alto	2026-02-10 16:53:16.783516
90	10007	10	Endividamento Financeiro	56.25	medio	2026-02-10 16:53:16.783516
91	10013	1	Demandas no Trabalho	50.00	medio	2026-02-11 01:12:17.053789
92	10013	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-11 01:12:17.053789
93	10013	3	Relações Sociais e Liderança	75.00	alto	2026-02-11 01:12:17.053789
94	10013	4	Interface Trabalho-Indivíduo	68.75	alto	2026-02-11 01:12:17.053789
95	10013	5	Valores Organizacionais	33.33	medio	2026-02-11 01:12:17.053789
96	10013	6	Traços de Personalidade	75.00	alto	2026-02-11 01:12:17.053789
97	10013	7	Saúde e Bem-Estar	66.67	alto	2026-02-11 01:12:17.053789
98	10013	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:12:17.053789
99	10013	9	Comportamento de Jogo	68.75	alto	2026-02-11 01:12:17.053789
100	10013	10	Endividamento Financeiro	25.00	baixo	2026-02-11 01:12:17.053789
101	10012	1	Demandas no Trabalho	68.75	alto	2026-02-11 01:14:43.757296
102	10012	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-11 01:14:43.757296
103	10012	3	Relações Sociais e Liderança	79.17	alto	2026-02-11 01:14:43.757296
104	10012	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-11 01:14:43.757296
105	10012	5	Valores Organizacionais	50.00	medio	2026-02-11 01:14:43.757296
106	10012	6	Traços de Personalidade	37.50	medio	2026-02-11 01:14:43.757296
107	10012	7	Saúde e Bem-Estar	58.33	medio	2026-02-11 01:14:43.757296
108	10012	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:14:43.757296
109	10012	9	Comportamento de Jogo	62.50	medio	2026-02-11 01:14:43.757296
110	10012	10	Endividamento Financeiro	68.75	alto	2026-02-11 01:14:43.757296
111	10014	1	Demandas no Trabalho	56.25	medio	2026-02-11 01:57:55.987926
112	10014	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-11 01:57:55.987926
113	10014	3	Relações Sociais e Liderança	66.67	alto	2026-02-11 01:57:55.987926
114	10014	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-11 01:57:55.987926
115	10014	5	Valores Organizacionais	75.00	alto	2026-02-11 01:57:55.987926
116	10014	6	Traços de Personalidade	87.50	alto	2026-02-11 01:57:55.987926
117	10014	7	Saúde e Bem-Estar	50.00	medio	2026-02-11 01:57:55.987926
118	10014	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:57:55.987926
119	10014	9	Comportamento de Jogo	75.00	alto	2026-02-11 01:57:55.987926
120	10014	10	Endividamento Financeiro	56.25	medio	2026-02-11 01:57:55.987926
121	10015	1	Demandas no Trabalho	50.00	medio	2026-02-11 02:01:46.606336
122	10015	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-11 02:01:46.606336
123	10015	3	Relações Sociais e Liderança	58.33	medio	2026-02-11 02:01:46.606336
124	10015	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-11 02:01:46.606336
125	10015	5	Valores Organizacionais	75.00	alto	2026-02-11 02:01:46.606336
126	10015	6	Traços de Personalidade	62.50	medio	2026-02-11 02:01:46.606336
127	10015	7	Saúde e Bem-Estar	66.67	alto	2026-02-11 02:01:46.606336
128	10015	8	Comportamentos Ofensivos	75.00	alto	2026-02-11 02:01:46.606336
129	10015	9	Comportamento de Jogo	62.50	medio	2026-02-11 02:01:46.606336
130	10015	10	Endividamento Financeiro	68.75	alto	2026-02-11 02:01:46.606336
131	10017	1	Demandas no Trabalho	56.25	medio	2026-02-12 12:30:53.219351
132	10017	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-12 12:30:53.219351
133	10017	3	Relações Sociais e Liderança	58.33	medio	2026-02-12 12:30:53.219351
134	10017	4	Interface Trabalho-Indivíduo	56.25	medio	2026-02-12 12:30:53.219351
135	10017	5	Valores Organizacionais	100.00	alto	2026-02-12 12:30:53.219351
136	10017	6	Traços de Personalidade	75.00	alto	2026-02-12 12:30:53.219351
137	10017	7	Saúde e Bem-Estar	16.67	baixo	2026-02-12 12:30:53.219351
138	10017	8	Comportamentos Ofensivos	25.00	baixo	2026-02-12 12:30:53.219351
139	10017	9	Comportamento de Jogo	50.00	medio	2026-02-12 12:30:53.219351
140	10017	10	Endividamento Financeiro	50.00	medio	2026-02-12 12:30:53.219351
141	10016	1	Demandas no Trabalho	81.25	alto	2026-02-12 12:31:15.029557
142	10016	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-12 12:31:15.029557
143	10016	3	Relações Sociais e Liderança	83.33	alto	2026-02-12 12:31:15.029557
144	10016	4	Interface Trabalho-Indivíduo	93.75	alto	2026-02-12 12:31:15.029557
145	10016	5	Valores Organizacionais	91.67	alto	2026-02-12 12:31:15.029557
146	10016	6	Traços de Personalidade	75.00	alto	2026-02-12 12:31:15.029557
147	10016	7	Saúde e Bem-Estar	100.00	alto	2026-02-12 12:31:15.029557
148	10016	8	Comportamentos Ofensivos	91.67	alto	2026-02-12 12:31:15.029557
149	10016	9	Comportamento de Jogo	93.75	alto	2026-02-12 12:31:15.029557
150	10016	10	Endividamento Financeiro	87.50	alto	2026-02-12 12:31:15.029557
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, display_name, description, hierarchy_level, active, created_at) FROM stdin;
1	admin	Administrador	Administrador do sistema	0	t	2026-02-09 20:16:27.147271
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
1	Contrato Plano Personalizado - Padrao	Template padrao para contratos de plano personalizado de Medicina do Trabalho	plano_personalizado	<h1>CONTRATO DE PRESTACAO DE SERVICOS - MEDICINA DO TRABALHO</h1>\r\n<p><strong>CONTRATANTE:</strong> {{contratante_nome}} - CNPJ: {{contratante_cnpj}}</p>\r\n<p><strong>CONTRATADA:</strong> QWork Medicina Ocupacional</p>\r\n\r\n<h2>CLAUSULA PRIMEIRA - DO OBJETO</h2>\r\n<p>O presente contrato tem por objeto a prestacao de servicos de medicina do trabalho na modalidade de Plano Personalizado, abrangendo {{numero_funcionarios}} funcionarios estimados.</p>\r\n\r\n<h2>CLAUSULA SEGUNDA - DO VALOR</h2>\r\n<p>O valor mensal dos servicos e de R$ {{valor_total}} ({{valor_total_extenso}}), correspondendo a R$ {{valor_por_funcionario}} por funcionario.</p>\r\n\r\n<h2>CLAUSULA TERCEIRA - DO PRAZO</h2>\r\n<p>O presente contrato tem validade de {{prazo_meses}} meses a partir de {{data_inicio}}, podendo ser renovado mediante acordo entre as partes.</p>\r\n\r\n<h2>CLAUSULA QUARTA - DOS SERVICOS INCLUSOS</h2>\r\n<ul>\r\n  <li>Avaliacao psicossocial completa (COPSOQ III)</li>\r\n  <li>Modulo de Jogo Patologico (JZ)</li>\r\n  <li>Modulo de Endividamento Financeiro (EF)</li>\r\n  <li>Relatorios personalizados</li>\r\n  <li>Suporte tecnico dedicado</li>\r\n</ul>\r\n\r\n<p><strong>Data do Contrato:</strong> {{data_contrato}}</p>\r\n<p><strong>Assinaturas:</strong></p>\r\n<p>_______________________________<br/>CONTRATANTE</p>\r\n<p>_______________________________<br/>CONTRATADA</p>	t	t	1	2026-02-09 20:16:02.42177	SISTEMA	2026-02-09 20:16:02.42177	\N	\N	{}
\.


--
-- Data for Name: tokens_retomada_pagamento; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tokens_retomada_pagamento (id, token, contrato_id, usado, usado_em, expira_em, criado_em, entidade_id) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) FROM stdin;
1	87545772920	Administrador QWork	admin@qwork.com.br	\N	\N	t	2026-02-09 20:56:58.100826	2026-02-09 20:56:58.100826	admin
3	53051173991	Emissor Teste QWork	emissor@qwork.com.br	\N	\N	t	2026-02-09 21:00:16.715145	2026-02-09 21:00:16.715145	emissor
4	29930511059	Gestor RLGR	rhrlge@kdke.com	\N	100	t	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557	gestor
5	04703084945	tani akk	4dffadf@dsfdf.com	104	\N	t	2026-02-10 04:21:23.389567	2026-02-10 04:21:23.389567	rh
6	24626149073	zdvdzd dzvvzvz	dsfsdfsfd@fdfd.com	\N	105	t	2026-02-10 12:31:00.37258	2026-02-10 12:31:00.37258	gestor
7	35051737030	Gestor Empresa Priv Fin	gestorempprivfin@ffdffsd.ci	\N	106	t	2026-02-11 01:02:59.219163	2026-02-11 01:02:59.219163	gestor
8	64411953056	Gestor Clin Final test	gesges@dsgds.com	107	\N	t	2026-02-11 01:48:14.9874	2026-02-11 01:48:14.9874	rh
9	87748070997	TESTE	DFKGHDFJKHG@GMAIL.COM	108	\N	t	2026-02-12 12:12:45.145804	2026-02-12 12:12:45.145804	rh
10	03178539026	amdna Nexus	fafa@safsf.com	109	\N	t	2026-02-12 18:00:41.074283	2026-02-12 18:00:41.074283	rh
\.


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public._migration_issues_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.audit_logs_id_seq', 289, true);


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_geral_id_seq', 1, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 127, true);


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_laudos_id_seq', 5, true);


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_recibos_id_seq', 1, false);


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 10017, true);


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinica_configuracoes_id_seq', 1, false);


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinicas_senhas_id_seq', 5, true);


--
-- Name: confirmacao_identidade_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.confirmacao_identidade_id_seq', 1, false);


--
-- Name: contratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratos_id_seq', 9, true);


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

SELECT pg_catalog.setval('public.empresas_clientes_id_seq', 7, true);


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.entidades_senhas_id_seq', 4, true);


--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fila_emissao_id_seq1', 1, false);


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fk_migration_audit_id_seq', 1, false);


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_clinicas_id_seq', 4, true);


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_entidades_id_seq', 8, true);


--
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 1026, true);


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

SELECT pg_catalog.setval('public.laudos_id_seq', 5000, false);


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

SELECT pg_catalog.setval('public.lotes_avaliacao_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.notificacoes_admin_id_seq', 1, false);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 5, true);


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_traducoes_id_seq', 9, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.permissions_id_seq', 3, true);


--
-- Name: planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.planos_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.respostas_id_seq', 447, true);


--
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resultados_id_seq', 150, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: seq_contratantes_id; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.seq_contratantes_id', 109, true);


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

SELECT pg_catalog.setval('public.usuarios_id_seq', 10, true);


--
-- Name: _migration_issues _migration_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._migration_issues
    ADD CONSTRAINT _migration_issues_pkey PRIMARY KEY (id);


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
-- Name: clinicas clinicas_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_email_key UNIQUE (email);


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
-- Name: clinicas clinicas_responsavel_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_responsavel_cpf_key UNIQUE (responsavel_cpf);


--
-- Name: clinicas_senhas clinicas_senhas_clinica_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_clinica_cpf_unique UNIQUE (clinica_id, cpf);


--
-- Name: clinicas_senhas clinicas_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_cpf_key UNIQUE (cpf);


--
-- Name: clinicas_senhas clinicas_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_pkey PRIMARY KEY (id);


--
-- Name: confirmacao_identidade confirmacao_identidade_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.confirmacao_identidade
    ADD CONSTRAINT confirmacao_identidade_pkey PRIMARY KEY (id);


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
-- Name: entidades entidades_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_cnpj_key UNIQUE (cnpj);


--
-- Name: entidades entidades_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_email_key UNIQUE (email);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: entidades_senhas entidades_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_cpf_key UNIQUE (cpf);


--
-- Name: entidades_senhas entidades_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_pkey PRIMARY KEY (id);


--
-- Name: fila_emissao fila_emissao_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);


--
-- Name: fila_emissao fila_emissao_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_pkey1 PRIMARY KEY (id);


--
-- Name: fk_migration_audit fk_migration_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fk_migration_audit
    ADD CONSTRAINT fk_migration_audit_pkey PRIMARY KEY (id);


--
-- Name: funcionarios_clinicas funcionarios_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


--
-- Name: funcionarios_entidades funcionarios_entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_pkey PRIMARY KEY (id);


--
-- Name: funcionarios_entidades funcionarios_entidades_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_unique UNIQUE (funcionario_id, entidade_id);


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
-- Name: lotes_avaliacao link_pagamento_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT link_pagamento_token_unique UNIQUE (link_pagamento_token);


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
-- Name: clinicas_cnpj_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX clinicas_cnpj_unique ON public.clinicas USING btree (cnpj);


--
-- Name: clinicas_email_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX clinicas_email_unique ON public.clinicas USING btree (email);


--
-- Name: clinicas_responsavel_cpf_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX clinicas_responsavel_cpf_unique ON public.clinicas USING btree (responsavel_cpf);


--
-- Name: entidades_senhas_entidade_cpf_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX entidades_senhas_entidade_cpf_unique ON public.entidades_senhas USING btree (entidade_id, cpf);


--
-- Name: funcionarios_clinicas_unique_func_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX funcionarios_clinicas_unique_func_empresa ON public.funcionarios_clinicas USING btree (funcionario_id, empresa_id);


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
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_entidade_id ON public.audit_logs USING btree (entidade_id);


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
-- Name: idx_auditoria_laudos_lote_acao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_lote_acao ON public.auditoria_laudos USING btree (lote_id, acao, criado_em DESC);


--
-- Name: INDEX idx_auditoria_laudos_lote_acao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_acao IS 'Índice principal para queries que filtram por lote e ação específica.';


--
-- Name: idx_auditoria_laudos_lote_history; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_lote_history ON public.auditoria_laudos USING btree (lote_id, criado_em DESC) INCLUDE (acao, status, emissor_cpf, observacoes);


--
-- Name: INDEX idx_auditoria_laudos_lote_history; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_history IS 'Otimiza busca de histórico completo de auditoria por lote (include para evitar table lookup).';


--
-- Name: idx_auditoria_laudos_pending_queue; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_pending_queue ON public.auditoria_laudos USING btree (lote_id, status, acao, criado_em DESC) WHERE ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text, ('erro'::character varying)::text]));


--
-- Name: INDEX idx_auditoria_laudos_pending_queue; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_auditoria_laudos_pending_queue IS 'Acelera busca de solicitações pendentes/erro na fila de processamento.';


--
-- Name: idx_auditoria_laudos_solicitado_por; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_solicitado_por ON public.auditoria_laudos USING btree (solicitado_por);


--
-- Name: idx_auditoria_laudos_solicitante_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_auditoria_laudos_solicitante_criado ON public.auditoria_laudos USING btree (emissor_cpf, criado_em DESC) WHERE ((acao)::text = 'emissao_solicitada'::text);


--
-- Name: idx_auditoria_laudos_unique_solicitation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_auditoria_laudos_unique_solicitation ON public.auditoria_laudos USING btree (lote_id, acao, solicitado_por) WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text])));


--
-- Name: INDEX idx_auditoria_laudos_unique_solicitation; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_auditoria_laudos_unique_solicitation IS 'Previne solicitações duplicadas de emissão no mesmo lote enquanto status estiver pendente/reprocessando.';


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

CREATE INDEX idx_avaliacoes_lote_status ON public.avaliacoes USING btree (lote_id, status) WHERE ((status)::text <> 'inativada'::text);


--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);


--
-- Name: idx_clinica_configuracoes_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinica_configuracoes_clinica ON public.clinica_configuracoes USING btree (clinica_id);


--
-- Name: idx_clinicas_aprovado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_aprovado_em ON public.clinicas USING btree (aprovado_em) WHERE (aprovado_em IS NOT NULL);


--
-- Name: idx_clinicas_ativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_ativa ON public.clinicas USING btree (ativa);


--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_cnpj ON public.clinicas USING btree (cnpj);


--
-- Name: idx_clinicas_contrato_aceito; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_contrato_aceito ON public.clinicas USING btree (contrato_aceito);


--
-- Name: idx_clinicas_data_liberacao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_data_liberacao ON public.clinicas USING btree (data_liberacao_login);


--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);


--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);


--
-- Name: idx_clinicas_senhas_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_senhas_clinica ON public.clinicas_senhas USING btree (clinica_id);


--
-- Name: idx_clinicas_senhas_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_senhas_clinica_id ON public.clinicas_senhas USING btree (clinica_id);


--
-- Name: idx_clinicas_senhas_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_senhas_cpf ON public.clinicas_senhas USING btree (cpf);


--
-- Name: idx_clinicas_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_status ON public.clinicas USING btree (status);


--
-- Name: idx_clinicas_status_data_cadastro; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_clinicas_status_data_cadastro ON public.clinicas USING btree (status, criado_em DESC);


--
-- Name: idx_confirmacao_avaliacao_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_confirmacao_avaliacao_id ON public.confirmacao_identidade USING btree (avaliacao_id) WHERE (avaliacao_id IS NOT NULL);


--
-- Name: idx_confirmacao_data; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_confirmacao_data ON public.confirmacao_identidade USING btree (confirmado_em DESC);


--
-- Name: idx_confirmacao_funcionario_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_confirmacao_funcionario_cpf ON public.confirmacao_identidade USING btree (funcionario_cpf);


--
-- Name: idx_contratos_data_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_data_pagamento ON public.contratos_planos USING btree (data_pagamento);


--
-- Name: idx_contratos_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_entidade_id ON public.contratos USING btree (entidade_id);


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
-- Name: idx_contratos_planos_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_planos_entidade_id ON public.contratos_planos USING btree (entidade_id);


--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);


--
-- Name: idx_contratos_tipo_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_tipo_pagamento ON public.contratos_planos USING btree (tipo_pagamento);


--
-- Name: idx_contratos_tipo_tomador; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_tipo_tomador ON public.contratos USING btree (tipo_tomador);


--
-- Name: idx_contratos_tomador_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_contratos_tomador_id ON public.contratos USING btree (tomador_id);


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
-- Name: idx_entidades_senhas_entidade; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_entidades_senhas_entidade ON public.entidades_senhas USING btree (entidade_id);


--
-- Name: idx_entidades_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_entidades_tipo ON public.entidades USING btree (tipo);


--
-- Name: idx_fila_emissao_lote_tentativas_pendentes; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_lote_tentativas_pendentes ON public.fila_emissao USING btree (lote_id) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_proxima_tentativa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_emissao_proxima_tentativa ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_lote ON public.fila_emissao USING btree (lote_id);


--
-- Name: idx_fila_pendente; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fila_pendente ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fk_migration_audit_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fk_migration_audit_status ON public.fk_migration_audit USING btree (status);


--
-- Name: idx_fk_migration_audit_tabela; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_fk_migration_audit_tabela ON public.fk_migration_audit USING btree (tabela);


--
-- Name: idx_func_clinicas_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_ativo ON public.funcionarios_clinicas USING btree (ativo);


--
-- Name: idx_func_clinicas_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_clinica ON public.funcionarios_clinicas USING btree (clinica_id);


--
-- Name: idx_func_clinicas_clinica_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_clinica_ativo ON public.funcionarios_clinicas USING btree (clinica_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_clinica_empresa_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_clinica_empresa_ativo ON public.funcionarios_clinicas USING btree (clinica_id, empresa_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_empresa ON public.funcionarios_clinicas USING btree (empresa_id);


--
-- Name: idx_func_clinicas_empresa_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_empresa_ativo ON public.funcionarios_clinicas USING btree (empresa_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_funcionario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_clinicas_funcionario ON public.funcionarios_clinicas USING btree (funcionario_id);


--
-- Name: idx_func_entidades_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_entidades_ativo ON public.funcionarios_entidades USING btree (ativo);


--
-- Name: idx_func_entidades_entidade; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_entidades_entidade ON public.funcionarios_entidades USING btree (entidade_id);


--
-- Name: idx_func_entidades_entidade_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_entidades_entidade_ativo ON public.funcionarios_entidades USING btree (entidade_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_entidades_funcionario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_func_entidades_funcionario ON public.funcionarios_entidades USING btree (funcionario_id);


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
-- Name: idx_laudos_arquivo_remoto_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_arquivo_remoto_key ON public.laudos USING btree (arquivo_remoto_key);


--
-- Name: idx_laudos_arquivo_remoto_sync; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_arquivo_remoto_sync ON public.laudos USING btree (arquivo_remoto_key, arquivo_remoto_uploaded_at) WHERE (arquivo_remoto_key IS NOT NULL);


--
-- Name: INDEX idx_laudos_arquivo_remoto_sync; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_laudos_arquivo_remoto_sync IS 'Índice para consultas de laudos sincronizados com storage remoto';


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
-- Name: idx_laudos_emissor_cpf_emitido; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_emissor_cpf_emitido ON public.laudos USING btree (emissor_cpf, emitido_em DESC);


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
-- Name: idx_laudos_job_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_job_id ON public.laudos USING btree (job_id);


--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_laudos_lote_id_status ON public.laudos USING btree (lote_id, status);


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
-- Name: idx_lotes_avaliacao_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_entidade_id ON public.lotes_avaliacao USING btree (entidade_id);


--
-- Name: idx_lotes_avaliacao_enviado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_enviado_em ON public.lotes_avaliacao USING btree (id) WHERE (enviado_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_expiracao_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_expiracao_pagamento ON public.lotes_avaliacao USING btree (link_pagamento_expira_em) WHERE (status_pagamento = 'aguardando_pagamento'::public.status_pagamento);


--
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);


--
-- Name: idx_lotes_avaliacao_solicitacao_emissao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_solicitacao_emissao ON public.lotes_avaliacao USING btree (solicitacao_emissao_em) WHERE (status_pagamento IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_status_emitido; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_status_emitido ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_avaliacao_status_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_status_pagamento ON public.lotes_avaliacao USING btree (status_pagamento);


--
-- Name: idx_lotes_avaliacao_token_pagamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_avaliacao_token_pagamento ON public.lotes_avaliacao USING btree (link_pagamento_token) WHERE (link_pagamento_token IS NOT NULL);


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: idx_lotes_emissao_em_andamento; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_emissao_em_andamento ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_em_andamento'::text);


--
-- Name: idx_lotes_emissao_solicitada; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_emissao_solicitada ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_emissao_solicitada_liberado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_emissao_solicitada_liberado ON public.lotes_avaliacao USING btree (liberado_em DESC) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_empresa_status_liberado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_empresa_status_liberado ON public.lotes_avaliacao USING btree (empresa_id, status, liberado_em DESC);


--
-- Name: INDEX idx_lotes_empresa_status_liberado; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON INDEX public.idx_lotes_empresa_status_liberado IS 'Otimiza queries de relatório por empresa e status';


--
-- Name: idx_lotes_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_entidade_id ON public.lotes_avaliacao USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);


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
-- Name: idx_lotes_status_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_lotes_status_criado ON public.lotes_avaliacao USING btree (status, criado_em DESC) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('emissao_solicitada'::character varying)::text]));


--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);


--
-- Name: idx_notificacoes_admin_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_clinica_id ON public.notificacoes_admin USING btree (clinica_id);


--
-- Name: idx_notificacoes_admin_criado; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_criado ON public.notificacoes_admin USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);


--
-- Name: idx_notificacoes_admin_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_entidade_id ON public.notificacoes_admin USING btree (entidade_id);


--
-- Name: idx_notificacoes_admin_lida; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_lida ON public.notificacoes_admin USING btree (lida);


--
-- Name: idx_notificacoes_admin_resolvida; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_resolvida ON public.notificacoes_admin USING btree (resolvida);


--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);


--
-- Name: idx_notificacoes_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_clinica_id ON public.notificacoes USING btree (clinica_id);


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
-- Name: idx_notificacoes_destinatario_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notificacoes_destinatario_cpf ON public.notificacoes USING btree (destinatario_cpf);


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
-- Name: idx_pagamentos_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_clinica_id ON public.pagamentos USING btree (clinica_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_entidade_id ON public.pagamentos USING btree (entidade_id);


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
-- Name: idx_pagamentos_tomador_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pagamentos_tomador_id ON public.pagamentos USING btree (tomador_id);


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

CREATE INDEX idx_pdf_jobs_status ON public.pdf_jobs USING btree (status) WHERE ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text]));


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
-- Name: idx_recibos_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_clinica_id ON public.recibos USING btree (clinica_id);


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
-- Name: idx_recibos_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recibos_entidade_id ON public.recibos USING btree (entidade_id);


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
-- Name: idx_tokens_retomada_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);


--
-- Name: idx_tokens_retomada_expiracao; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_expiracao ON public.tokens_retomada_pagamento USING btree (expira_em);


--
-- Name: idx_tokens_retomada_pagamento_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tokens_retomada_pagamento_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);


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
-- Name: idx_usuarios_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_ativo ON public.usuarios USING btree (ativo);


--
-- Name: idx_usuarios_clinica_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_clinica_id ON public.usuarios USING btree (clinica_id) WHERE (clinica_id IS NOT NULL);


--
-- Name: idx_usuarios_cpf; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_cpf ON public.usuarios USING btree (cpf);


--
-- Name: idx_usuarios_entidade_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_entidade_id ON public.usuarios USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);


--
-- Name: idx_usuarios_tipo_ativo; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_tipo_ativo ON public.usuarios USING btree (tipo_usuario, ativo);


--
-- Name: idx_usuarios_tipo_usuario; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_usuarios_tipo_usuario ON public.usuarios USING btree (tipo_usuario);


--
-- Name: v_solicitacoes_emissao _RETURN; Type: RULE; Schema: public; Owner: neondb_owner
--

CREATE OR REPLACE VIEW public.v_solicitacoes_emissao AS
 SELECT la.id AS lote_id,
    la.status_pagamento,
    la.solicitacao_emissao_em,
    la.valor_por_funcionario,
    la.link_pagamento_token,
    la.link_pagamento_enviado_em,
    la.pagamento_metodo,
    la.pagamento_parcelas,
    la.pago_em,
    COALESCE(e.nome, c.nome) AS empresa_nome,
    COALESCE(e.nome, c.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    count(a.id) AS num_avaliacoes_concluidas,
    (la.valor_por_funcionario * (count(a.id))::numeric) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status
   FROM ((((public.lotes_avaliacao la
     LEFT JOIN public.entidades e ON ((e.id = la.entidade_id)))
     LEFT JOIN public.clinicas c ON ((c.id = la.clinica_id)))
     LEFT JOIN public.usuarios u ON (((u.cpf)::bpchar = la.liberado_por)))
     LEFT JOIN public.avaliacoes a ON (((a.lote_id = la.id) AND ((a.status)::text = 'concluida'::text))))
  WHERE (la.status_pagamento IS NOT NULL)
  GROUP BY la.id, e.nome, c.nome, u.nome, u.cpf
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;


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

ALTER TABLE public.laudos DISABLE TRIGGER audit_laudos;


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_change();


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();

ALTER TABLE public.laudos DISABLE TRIGGER enforce_laudo_immutability;


--
-- Name: avaliacoes prevent_avaliacao_delete_after_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER prevent_avaliacao_delete_after_emission BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_delete_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER prevent_avaliacao_delete_after_emission ON public.avaliacoes IS 'Bloqueia exclusão de avaliação quando laudo já foi emitido';


--
-- Name: avaliacoes prevent_avaliacao_update_after_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER prevent_avaliacao_update_after_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_update_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER prevent_avaliacao_update_after_emission ON public.avaliacoes IS 'Bloqueia atualização de avaliação quando laudo já foi emitido';


--
-- Name: lotes_avaliacao prevent_lote_update_after_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER prevent_lote_update_after_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_status_change_after_emission();


--
-- Name: TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER prevent_lote_update_after_emission ON public.lotes_avaliacao IS 'Bloqueia mudanças indevidas no lote após emissão do laudo';


--
-- Name: laudos trg_audit_laudo_creation; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_audit_laudo_creation AFTER INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_laudo_creation();


--
-- Name: lotes_avaliacao trg_audit_lote_status; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_audit_lote_status AFTER UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_status_change();


--
-- Name: clinicas trg_clinicas_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_clinicas_criar_usuario_apos_aprovacao AFTER UPDATE ON public.clinicas FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();


--
-- Name: clinicas_senhas trg_clinicas_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_clinicas_senhas_updated_at BEFORE UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.update_clinicas_senhas_updated_at();


--
-- Name: entidades trg_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_criar_usuario_apos_aprovacao AFTER UPDATE ON public.entidades FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();


--
-- Name: TRIGGER trg_criar_usuario_apos_aprovacao ON entidades; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_criar_usuario_apos_aprovacao ON public.entidades IS 'Cria automaticamente usuario e senhas quando entidade e aprovada';


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
-- Name: lotes_avaliacao trg_immutable_lote; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_immutable_lote BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_update_finalized_lote();


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
-- Name: funcionarios trg_prevent_gestor_emissor; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_gestor_emissor BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.prevent_gestor_being_emissor();


--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();

ALTER TABLE public.laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change;


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();


--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();


--
-- Name: clinicas_senhas trg_protect_senhas; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_senhas BEFORE INSERT OR DELETE OR UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_clinicas_senhas();


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_change; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_change AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: TRIGGER trg_recalc_lote_on_avaliacao_change ON avaliacoes; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_change ON public.avaliacoes IS 'Recalcula automaticamente status do lote quando avaliação muda';


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
-- Name: lotes_avaliacao trg_registrar_solicitacao_emissao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_registrar_solicitacao_emissao AFTER UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_solicitacao_emissao();


--
-- Name: funcionarios trg_reject_prohibited_roles; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_reject_prohibited_roles BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.trg_reject_prohibited_roles_func();


--
-- Name: respostas trg_respostas_set_questao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_respostas_set_questao BEFORE INSERT OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.set_questao_from_item();


--
-- Name: lotes_avaliacao trg_sync_entidade_contratante; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_sync_entidade_contratante BEFORE INSERT OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.sync_entidade_contratante_id();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION public.update_usuarios_updated_at();


--
-- Name: laudos trg_validar_laudo_emitido; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_laudo_emitido BEFORE INSERT OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_laudo_emitido();


--
-- Name: TRIGGER trg_validar_laudo_emitido ON laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_validar_laudo_emitido ON public.laudos IS 'Garante que laudos sÃ³ sejam marcados como emitido quando PDF fÃ­sico foi gerado (hash existe)';


--
-- Name: contratos_planos trg_validar_parcelas; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_parcelas BEFORE INSERT OR UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.validar_parcelas_json();


--
-- Name: avaliacoes trg_validar_status_avaliacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_status_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW WHEN ((((old.status)::text IS DISTINCT FROM (new.status)::text) OR ((new.status)::text <> 'concluida'::text))) EXECUTE FUNCTION public.fn_validar_status_avaliacao();


--
-- Name: lotes_avaliacao trg_validar_transicao_status_lote; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_transicao_status_lote BEFORE UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_validar_transicao_status_lote();


--
-- Name: TRIGGER trg_validar_transicao_status_lote ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TRIGGER trg_validar_transicao_status_lote ON public.lotes_avaliacao IS 'Trigger que valida transições de status antes de atualizar o registro';


--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_empresa; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validate_funcionario_clinica_empresa BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_empresa();


--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_tipo; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validate_funcionario_clinica_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_tipo();


--
-- Name: funcionarios_entidades trg_validate_funcionario_entidade_tipo; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validate_funcionario_entidade_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_entidade_tipo();


--
-- Name: clinica_configuracoes trigger_atualizar_timestamp_configuracoes; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes BEFORE UPDATE ON public.clinica_configuracoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_configuracoes();


--
-- Name: templates_contrato trigger_garantir_template_padrao_unico; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_garantir_template_padrao_unico BEFORE INSERT OR UPDATE ON public.templates_contrato FOR EACH ROW WHEN ((new.padrao = true)) EXECUTE FUNCTION public.garantir_template_padrao_unico();


--
-- Name: avaliacoes trigger_limpar_indice_ao_deletar; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_limpar_indice_ao_deletar BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.limpar_indice_ao_deletar_avaliacao();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();


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
-- Name: funcionarios_clinicas trigger_update_funcionarios_clinicas_timestamp; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_update_funcionarios_clinicas_timestamp BEFORE UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_clinicas_timestamp();


--
-- Name: funcionarios_entidades trigger_update_funcionarios_entidades_timestamp; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_update_funcionarios_entidades_timestamp BEFORE UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_entidades_timestamp();


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
-- Name: clinicas clinicas_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


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
-- Name: fila_emissao fila_emissao_lote_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey1 FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: auditoria_laudos fk_auditoria_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT fk_auditoria_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: confirmacao_identidade fk_confirmacao_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.confirmacao_identidade
    ADD CONSTRAINT fk_confirmacao_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: confirmacao_identidade fk_confirmacao_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.confirmacao_identidade
    ADD CONSTRAINT fk_confirmacao_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: entidades_senhas fk_entidades_senhas_entidade; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT fk_entidades_senhas_entidade FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas fk_funcionarios_clinicas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT fk_funcionarios_clinicas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: laudos fk_laudos_emissor_cpf; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_emissor_cpf FOREIGN KEY (emissor_cpf) REFERENCES public.usuarios(cpf) ON DELETE RESTRICT;


--
-- Name: CONSTRAINT fk_laudos_emissor_cpf ON laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON public.laudos IS 'Garante que emissor existe na tabela usuarios. RESTRICT previne deleção de emissor com laudos.';


--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos fk_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT fk_laudos_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON CONSTRAINT fk_laudos_lote_id ON public.laudos IS 'Garante integridade referencial: todo laudo deve ter um lote válido';


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


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
-- Name: tokens_retomada_pagamento fk_tokens_contrato; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_tokens_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas funcionarios_clinicas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas funcionarios_clinicas_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: funcionarios_entidades funcionarios_entidades_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


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
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.entidades_senhas(cpf);


--
-- Name: notificacoes_admin notificacoes_admin_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


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
-- Name: recibos recibos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


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
-- Name: usuarios usuarios_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: usuarios usuarios_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id);


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
-- Name: confirmacao_identidade admin_emissor_full_access; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_emissor_full_access ON public.confirmacao_identidade TO admin_role, emissor_role USING (true) WITH CHECK (true);


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

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor'::text, 'admin'::text]))));


--
-- Name: avaliacao_resets avaliacao_resets_select_policy; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY avaliacao_resets_select_policy ON public.avaliacao_resets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.avaliacoes av
     JOIN public.lotes_avaliacao lot ON ((av.lote_id = lot.id)))
  WHERE ((av.id = avaliacao_resets.avaliacao_id) AND (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (lot.clinica_id = (current_setting('app.current_user_clinica_id'::text, true))::integer)) OR ((current_setting('app.current_user_perfil'::text, true) = 'gestor'::text) AND (lot.contratante_id = (current_setting('app.current_user_contratante_id'::text, true))::integer)))))));


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
-- Name: confirmacao_identidade; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.confirmacao_identidade ENABLE ROW LEVEL SECURITY;

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
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id())));


--
-- Name: entidades; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

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
-- Name: confirmacao_identidade funcionario_view_own_confirmations; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionario_view_own_confirmations ON public.confirmacao_identidade FOR SELECT TO funcionario_role USING (((funcionario_cpf)::text = current_setting('app.current_user_cpf'::text, true)));


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
-- Name: funcionarios_clinicas; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.funcionarios_clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios_clinicas funcionarios_clinicas_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_clinicas_block_admin ON public.funcionarios_clinicas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_clinicas_rh_delete ON public.funcionarios_clinicas FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: POLICY funcionarios_clinicas_rh_insert ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas IS 'RH pode criar relacionamentos de funcionarios com empresas da sua clinica';


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: POLICY funcionarios_clinicas_rh_select ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas IS 'RH pode visualizar relacionamentos de funcionarios da sua clinica';


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_clinicas_rh_update ON public.funcionarios_clinicas FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


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
-- Name: funcionarios_entidades; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.funcionarios_entidades ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios_entidades funcionarios_entidades_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_entidades_block_admin ON public.funcionarios_entidades AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_delete; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_entidades_gestor_delete ON public.funcionarios_entidades FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: POLICY funcionarios_entidades_gestor_insert ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades IS 'Gestor pode criar relacionamentos de funcionarios com sua entidade';


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_select; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: POLICY funcionarios_entidades_gestor_select ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades IS 'Gestor pode visualizar relacionamentos de funcionarios da sua entidade';


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_update; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_entidades_gestor_update ON public.funcionarios_entidades FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id()))) WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: funcionarios funcionarios_gestor_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_gestor_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));


--
-- Name: funcionarios funcionarios_gestor_insert_base; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_gestor_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_gestor_select_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));


--
-- Name: POLICY funcionarios_gestor_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios IS 'Gestor pode visualizar funcionarios vinculados a sua entidade via funcionarios_entidades';


--
-- Name: funcionarios funcionarios_gestor_update_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_gestor_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));


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
-- Name: funcionarios funcionarios_rh_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_rh_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));


--
-- Name: funcionarios funcionarios_rh_insert_base; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_rh_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_select_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));


--
-- Name: POLICY funcionarios_rh_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios IS 'RH pode visualizar funcionarios vinculados a sua clinica via funcionarios_clinicas';


--
-- Name: funcionarios funcionarios_rh_update_via_relacionamento; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY funcionarios_rh_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));


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
-- Name: confirmacao_identidade gestor_view_entity_confirmations; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY gestor_view_entity_confirmations ON public.confirmacao_identidade FOR SELECT TO gestor_entidade_role USING ((EXISTS ( SELECT 1
   FROM (public.funcionarios f
     JOIN public.funcionarios_entidades fe ON ((f.id = fe.funcionario_id)))
  WHERE ((f.cpf = confirmacao_identidade.funcionario_cpf) AND (fe.ativo = true)))));


--
-- Name: laudos; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


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
-- Name: lotes_avaliacao policy_lotes_admin; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_lotes_admin ON public.lotes_avaliacao FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));


--
-- Name: lotes_avaliacao policy_lotes_emissor; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY policy_lotes_emissor ON public.lotes_avaliacao FOR SELECT USING (((current_setting('app.current_role'::text, true) = 'emissor'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('em_processamento'::character varying)::text, ('concluido'::character varying)::text]))));


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
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);


--
-- Name: empresas_clientes rh_empresas_proprias; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY rh_empresas_proprias ON public.empresas_clientes USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND ((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true))));


--
-- Name: lotes_avaliacao rh_lotes_empresas; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY rh_lotes_empresas ON public.lotes_avaliacao USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)) OR (entidade_id IS NOT NULL))));


--
-- Name: confirmacao_identidade rh_view_clinic_confirmations; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY rh_view_clinic_confirmations ON public.confirmacao_identidade FOR SELECT TO rh_role USING (true);


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
-- Name: confirmacao_identidade system_insert_confirmations; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY system_insert_confirmations ON public.confirmacao_identidade FOR INSERT WITH CHECK (true);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

