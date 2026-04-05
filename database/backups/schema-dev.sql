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
-- Name: backups; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA backups;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'Funções criptográficas para PostgreSQL (hash, criptografia, geração de salt)';


--
-- Name: idioma_suportado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.idioma_suportado AS ENUM (
    'pt_BR',
    'en_US',
    'es_ES'
);


--
-- Name: nivel_cargo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nivel_cargo_enum AS ENUM (
    'operacional',
    'gestao'
);


--
-- Name: perfil_usuario_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.perfil_usuario_enum AS ENUM (
    'funcionario',
    'rh',
    'admin',
    'emissor'
);


--
-- Name: TYPE perfil_usuario_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.perfil_usuario_enum IS 'Perfis válidos de usuários no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionários), admin (administração geral), emissor (emite laudos)';


--
-- Name: prioridade_notificacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.prioridade_notificacao AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
);


--
-- Name: status_aprovacao_enum; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: status_avaliacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_avaliacao AS ENUM (
    'pendente',
    'em_andamento',
    'concluido',
    'liberada',
    'iniciada'
);


--
-- Name: TYPE status_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: iniciada (criada/não iniciada), em_andamento (respondendo), concluido (finalizada), inativada (cancelada). Nota: liberada é obsoleto.';


--
-- Name: status_avaliacao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_avaliacao_enum AS ENUM (
    'iniciada',
    'em_andamento',
    'concluida',
    'inativada'
);


--
-- Name: TYPE status_avaliacao_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliações: iniciada (criada mas não respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';


--
-- Name: status_laudo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_laudo AS ENUM (
    'rascunho',
    'emitido',
    'enviado'
);


--
-- Name: TYPE status_laudo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_laudo IS 'Status válidos: rascunho (editando), emitido (pronto), enviado (entregue)';


--
-- Name: status_laudo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_laudo_enum AS ENUM (
    'emitido',
    'enviado'
);


--
-- Name: TYPE status_laudo_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_laudo_enum IS 'Status de laudos: emitido (gerado automaticamente), enviado (enviado ao cliente)';


--
-- Name: status_lote; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_lote AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido',
    'rascunho'
);


--
-- Name: TYPE status_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_lote IS 'Status válidos: rascunho (criando), ativo (em uso), concluido (fechado)';


--
-- Name: status_lote_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_lote_enum AS ENUM (
    'ativo',
    'cancelado',
    'finalizado',
    'concluido'
);


--
-- Name: TYPE status_lote_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado)';


--
-- Name: tipo_lote_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_lote_enum AS ENUM (
    'completo',
    'operacional',
    'gestao'
);


--
-- Name: TYPE tipo_lote_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.tipo_lote_enum IS 'Tipo de lote: completo (todos funcionários), operacional (apenas operacionais), gestao (apenas gestores)';


--
-- Name: tipo_notificacao; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: TYPE tipo_notificacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.tipo_notificacao IS 'Tipos de notificação suportados no sistema. laudo_enviado é disparado após PDF + hash + status=enviado';


--
-- Name: tipo_plano; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_plano AS ENUM (
    'personalizado',
    'fixo'
);


--
-- Name: usuario_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor',
    'rh',
    'admin',
    'emissor'
);


--
-- Name: arquivar_notificacoes_antigas(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: atualizar_contratacao_personalizada_atualizado_em(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_contratacao_personalizada_atualizado_em() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_data_modificacao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_data_modificacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: atualizar_notificacao_admin_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_notificacao_admin_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: atualizar_timestamp_configuracoes(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: atualizar_ultima_avaliacao_funcionario(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: audit_bypassrls_session(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_bypassrls_session(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_bypassrls_session() IS 'Audits BYPASSRLS session starts. Call this at beginning of maintenance scripts.';


--
-- Name: audit_laudo_creation(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_laudo_creation(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_laudo_creation() IS 'Audita criação de laudos usando a coluna relatorio_lote para tamanho do PDF';


--
-- Name: audit_log_with_context(character varying, character varying, character varying, text, character, integer, integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) IS 'Registra ação no audit_logs incluindo contexto completo (user, clínica, contratante). Faz casting seguro do IP (inet).';


--
-- Name: audit_lote_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_lote_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_cpf TEXT;
  v_ip_address INET;
BEGIN
  -- Obter valores de contexto
  v_user_cpf := NULLIF(current_setting('app.current_user_cpf', true), '');
  v_ip_address := NULLIF(current_setting('app.client_ip', true), '')::inet;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      v_user_cpf,
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      v_ip_address
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Registrar apenas mudanÃ§as significativas
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
        v_user_cpf,
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
        v_ip_address
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
      v_user_cpf,
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      v_ip_address
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION audit_lote_change(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_lote_change() IS 'Trigger de auditoria para lotes com cast correto do ip_address';


--
-- Name: audit_lote_status_change(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_lote_status_change(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_lote_status_change() IS 'Função de auditoria de mudança de status de lote (defensiva)';


--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_trigger_func(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger de auditoria que permite user_cpf e user_perfil NULL quando contexto não está setado (usa NULLIF para converter string vazia em NULL)';


--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION audit_trigger_function(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.audit_trigger_function() IS 'Robusta: insere logs em audit_logs com fallback quando contexto da sessão não estiver disponível';


--
-- Name: calcular_elegibilidade_lote(integer, integer); Type: FUNCTION; Schema: public; Owner: -
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
      WHEN f.indice_avaliacao <= p_numero_lote_atual - 1 THEN 'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliacao'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE 
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE 
      WHEN f.indice_avaliacao <= p_numero_lote_atual - 2 THEN 'CRITICA'
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN f.indice_avaliacao <= p_numero_lote_atual - 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Criterio 1: Funcionario novo (indice 0)
      f.indice_avaliacao = 0
      OR
      -- Criterio 2: Indice incompleto (faltou lote anterior) - agora inclusive
      f.indice_avaliacao <= p_numero_lote_atual - 1
      OR
      -- Criterio 3: Mais de 1 ano sem avaliacao
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY 
    CASE 
      WHEN f.indice_avaliacao <= p_numero_lote_atual - 2 THEN 1
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 3
      WHEN f.indice_avaliacao <= p_numero_lote_atual - 1 THEN 4
      ELSE 5
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


--
-- Name: FUNCTION calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Ajustada para incluir <= p_numero_lote_atual - 1';


--
-- Name: calcular_hash_pdf(bytea); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_hash_pdf(pdf_data bytea) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$;


--
-- Name: FUNCTION calcular_hash_pdf(pdf_data bytea); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_hash_pdf(pdf_data bytea) IS 'Calcula hash SHA-256 de um PDF em formato BYTEA';


--
-- Name: calcular_vigencia_fim(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_vigencia_fim(data_inicio date) RETURNS date
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Vigência de 364 dias a partir da data de início
    RETURN data_inicio + INTERVAL '364 days';
END;
$$;


--
-- Name: FUNCTION calcular_vigencia_fim(data_inicio date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_vigencia_fim(data_inicio date) IS 'Calcula data fim da vigência (data início + 364 dias)';


--
-- Name: check_laudo_immutability(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION check_laudo_immutability(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_laudo_immutability() IS 'Garante imutabilidade de laudos emitidos, exceto para backfill do hash_pdf quando NULL';


--
-- Name: check_resposta_immutability(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION check_resposta_immutability(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída';


--
-- Name: check_resultado_immutability(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION check_resultado_immutability(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_resultado_immutability() IS 'Bloqueia modificações/inserções em resultados quando avaliação está concluída';


--
-- Name: criar_notificacao_recibo(integer, integer, public.tipo_notificacao); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: criar_notificacao_recibo(integer, character varying, numeric, character varying); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) IS 'Cria notificação quando um recibo é gerado após confirmação de pagamento';


--
-- Name: criar_usuario_responsavel_apos_aprovacao(); Type: FUNCTION; Schema: public; Owner: -
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

        -- Determinar tabela de origem atravÃ©s do TG_TABLE_NAME
        v_tabela_origem := TG_TABLE_NAME;

        -- Determinar tipo de usuario e IDs baseado na tabela de origem
        IF v_tabela_origem = 'clinicas' THEN
            v_tipo_usuario := 'rh';
            
            -- âœ… CORREÃ‡ÃƒO: Usar NEW.id diretamente ao invÃ©s de buscar por CNPJ
            -- Quando o trigger Ã© executado na tabela clinicas, NEW.id jÃ¡ Ã© o clinica_id correto
            v_clinica_id := NEW.id;
            v_entidade_id := NULL;
            
            RAISE NOTICE '[TRIGGER] Criando usuÃ¡rio RH para clinica_id=% (CPF=%)', v_clinica_id, v_cpf;

        ELSIF v_tabela_origem = 'entidades' THEN
            v_tipo_usuario := 'gestor';
            v_clinica_id := NULL;
            
            -- Para entidades, NEW.id jÃ¡ Ã© o entidade_id correto
            v_entidade_id := NEW.id;
            
            RAISE NOTICE '[TRIGGER] Criando usuÃ¡rio Gestor para entidade_id=% (CPF=%)', v_entidade_id, v_cpf;
            
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
            RAISE NOTICE '[TRIGGER] Usuario % jÃ¡ existe, pulando criaÃ§Ã£o', v_cpf;
        END IF;

        -- Criar senha na tabela apropriada
        IF v_tabela_origem = 'clinicas' OR (v_tabela_origem != 'entidades' AND NEW.tipo = 'clinica') THEN
            SELECT EXISTS(SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em clinicas_senhas para RH % (clinica_id=%)', v_cpf, v_clinica_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha jÃ¡ existe em clinicas_senhas para CPF %', v_cpf;
            END IF;
        ELSE
            SELECT EXISTS(SELECT 1 FROM entidades_senhas WHERE cpf = v_cpf AND entidade_id = v_entidade_id) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
                VALUES (v_entidade_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em entidades_senhas para gestor % (entidade_id=%)', v_cpf, v_entidade_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha jÃ¡ existe em entidades_senhas para CPF % e entidade_id=%', v_cpf, v_entidade_id;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION criar_usuario_responsavel_apos_aprovacao(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.criar_usuario_responsavel_apos_aprovacao() IS 'Trigger function que cria automaticamente usuario RH ou Gestor quando entidade/clinica Ã© aprovada.
CORREÃ‡ÃƒO (2026-02-08): Usa NEW.id diretamente ao invÃ©s de buscar por CNPJ, evitando atribuiÃ§Ã£o de ID incorreto.';


--
-- Name: current_user_clinica_id(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION current_user_clinica_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_clinica_id() IS 'Returns current user clinica_id from session context.
   RAISES EXCEPTION if not set for perfil RH (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';


--
-- Name: current_user_clinica_id_optional(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION current_user_clinica_id_optional(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_clinica_id_optional() IS 'Retorna o clinica_id do usuÃƒÂ¡rio atual para isolamento de dados por clÃƒÂ­nica';


--
-- Name: current_user_cpf(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION current_user_cpf(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_cpf() IS 'Returns current user CPF from session context. 
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates CPF format (11 digits).';


--
-- Name: current_user_entidade_id(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: current_user_entidade_id_optional(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: current_user_is_gestor(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION current_user_is_gestor(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_is_gestor() IS 'Retorna TRUE se o usuário atual é gestor (RH, Entidade ou Admin). Gestores não usam RLS.';


--
-- Name: current_user_perfil(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION current_user_perfil(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_perfil() IS 'Returns current user perfil from session context.
   RAISES EXCEPTION if not set (prevents NULL bypass).
   Validates perfil is in allowed list.';


--
-- Name: detectar_anomalia_score(numeric, character varying, integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: detectar_anomalias_indice(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION detectar_anomalias_indice(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) IS 'Detecta padroes suspeitos no historico de avaliacoes (>3 faltas, indice atrasado, >2 anos sem avaliacao)';


--
-- Name: diagnosticar_lote_emissao(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION diagnosticar_lote_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) IS 'FunÃ§Ã£o de diagnÃ³stico para depuraÃ§Ã£o de problemas de emissÃ£o';


--
-- Name: execute_maintenance(text, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION execute_maintenance(p_description text, p_sql text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.execute_maintenance(p_description text, p_sql text) IS 'Executes maintenance SQL with full audit trail.
   Usage: SELECT execute_maintenance(''Fix data'', ''UPDATE table...'');
   Only accessible to BYPASSRLS roles.';


--
-- Name: fn_audit_clinicas_senhas(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: fn_buscar_solicitante_laudo(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_buscar_solicitante_laudo(p_laudo_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) IS 'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';


--
-- Name: fn_delete_senha_autorizado(integer, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text) IS 'UNICA forma segura de deletar senhas - requer motivo e registra em auditoria';


--
-- Name: fn_limpar_senhas_teste(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_limpar_senhas_teste(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_limpar_senhas_teste() IS 'APENAS PARA TESTES: Limpa senhas em ambiente de teste';


--
-- Name: fn_next_lote_id(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: fn_obter_solicitacao_emissao(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_obter_solicitacao_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) IS 'Busca a última solicitação de emissão para um lote específico';


--
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliação que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se não tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- Só processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliações do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO
    v_total_avaliacoes,
    v_avaliacoes_concluidas,
    v_avaliacoes_inativadas,
    v_avaliacoes_pendentes
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se todas as avaliações (exceto as inativadas) foram concluídas:
  --   → Marcar lote como 'concluido'
  --   → NÃO agendar emissão (100% MANUAL)
  IF v_avaliacoes_pendentes = 0 
     AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes 
     AND v_avaliacoes_concluidas > 0 THEN
    
    UPDATE lotes_avaliacao
    SET 
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Evitar update desnecessário
    
    RAISE NOTICE 'Lote % marcado como concluído (MANUAL): % concluídas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliação muda.
APENAS atualiza status para "concluido" quando todas avaliações são concluídas.
NÃO agenda emissão automática - emissor deve processar MANUALMENTE.';


--
-- Name: fn_registrar_solicitacao_emissao(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: fn_relatorio_emissoes_periodo(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) IS 'Gera relatório estatístico de emissões por usuário em um período específico';


--
-- Name: fn_reservar_id_laudo_on_lote_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_reservar_id_laudo_on_lote_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Reservar o mesmo ID para o laudo (em status rascunho)
  -- Usar o emissor_cpf (liberado_por) do lote que estÃ¡ sendo criado
  INSERT INTO laudos (id, lote_id, emissor_cpf, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, NEW.liberado_por, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


--
-- Name: fn_validar_laudo_emitido(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_validar_laudo_emitido(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_validar_laudo_emitido() IS 'Valida o princÃ­pio da imutabilidade de laudos: somente permite status=emitido quando hash_pdf, emitido_em e emissor_cpf existem';


--
-- Name: fn_validar_transicao_status_lote(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_validar_transicao_status_lote(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_validar_transicao_status_lote() IS 'Valida transições de status do lote conforme máquina de estados. Previne transições inválidas e garante integridade.';


--
-- Name: garantir_template_padrao_unico(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: gerar_dados_relatorio(integer, integer, integer, date, date); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: gerar_hash_auditoria(character varying, integer, character varying, jsonb, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) IS 'Sobrecarga para aceitar TIMESTAMPTZ - gera hash SHA-256 para verificar integridade de registros de auditoria';


--
-- Name: gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION gerar_numero_recibo(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_numero_recibo() IS 'Gera número único de recibo no formato REC-AAAA-NNNNN';


--
-- Name: gerar_senha_padrao_cnpj(character varying); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION gerar_senha_padrao_cnpj(p_cnpj character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_senha_padrao_cnpj(p_cnpj character varying) IS 'Gera senha padrao usando os 6 ultimos digitos do CNPJ';


--
-- Name: gerar_token_retomada_pagamento(integer, integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) IS 'Gera token único para permitir retomada de pagamento via link';


--
-- Name: get_next_contratante_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_contratante_id() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN nextval('seq_contratantes_id');
END;
$$;


--
-- Name: get_resultados_por_empresa(integer, integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: is_admin_or_master(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_master() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
    -- Após migração, apenas 'admin' confere privilégio total. Esta função mantém compatibilidade histórica
    RETURN current_user_perfil() = 'admin';
END;
$$;


--
-- Name: FUNCTION is_admin_or_master(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_admin_or_master() IS 'Verifica se o usuário atual tem perfil admin (compatibilidade histórica: perfil legado tratado separadamente)';


--
-- Name: is_valid_perfil(text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION is_valid_perfil(p_perfil text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_valid_perfil(p_perfil text) IS 'Valida se um texto corresponde a um perfil válido do ENUM';


--
-- Name: limpar_auditoria_laudos_antiga(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION limpar_auditoria_laudos_antiga(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.limpar_auditoria_laudos_antiga() IS 'Remove registros de auditoria com mais de 1 ano (exceto erros). Executar mensalmente via cron.';


--
-- Name: limpar_notificacoes_resolvidas_antigas(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION limpar_notificacoes_resolvidas_antigas(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.limpar_notificacoes_resolvidas_antigas() IS 'Arquiva notificações resolvidas há mais de 90 dias';


--
-- Name: log_access_denied(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION log_access_denied(p_user text, p_action text, p_resource text, p_reason text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.log_access_denied(p_user text, p_action text, p_resource text, p_reason text) IS 'Registra tentativas de acesso negadas por políticas RLS';


--
-- Name: lote_pode_ser_processado(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION lote_pode_ser_processado(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.lote_pode_ser_processado(p_lote_id integer) IS 'Verifica se um lote está apto para emissão de laudo';


--
-- Name: marcar_notificacoes_lidas(integer[], integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: marcar_notificacoes_lidas(integer[], text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: notificar_sla_excedido(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: obter_config_clinica(integer, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: obter_proximo_numero_ordem(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION obter_proximo_numero_ordem(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o prÃ³ximo nÃºmero de ordem sequencial para um novo lote da empresa';


--
-- Name: obter_traducao(text, public.idioma_suportado); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: prevent_gestor_being_emissor(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: prevent_laudo_lote_id_change(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: prevent_lote_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_lote_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Previne alterações no lote durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  -- Esta trigger agora apenas previne alterações críticas de campos principais
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar campos críticos
  -- durante o processo de emissão (quando já existe laudo)
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se existe laudo emitido para este lote
    IF EXISTS (
      SELECT 1 FROM laudos 
      WHERE lote_id = OLD.id 
      AND status IN ('emitido', 'enviado')
    ) THEN
      -- Se laudo está emitido, prevenir mudanças em campos críticos
      IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
         OR OLD.setor_id IS DISTINCT FROM NEW.setor_id
         OR OLD.codigo IS DISTINCT FROM NEW.codigo THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de lote com laudo emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_lote_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_lote_mutation_during_emission() IS 'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. Atualizada em migration 098 para remover referência ao campo processamento_em removido.';


--
-- Name: prevent_lote_status_change_after_emission(); Type: FUNCTION; Schema: public; Owner: -
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
            'Não é possível alterar status do lote % após emissão do laudo. Status atual: %, tentativa: %',
            OLD.codigo, OLD.status, NEW.status
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Lotes com laudo emitido são imutáveis';
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_lote_status_change_after_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_lote_status_change_after_emission() IS 'Previne mudança de status do lote após emissão do laudo';


--
-- Name: prevent_modification_after_emission(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificação de avaliações após emissão do laudo (imutabilidade) - versão corrigida sem coluna codigo';


--
-- Name: prevent_modification_avaliacao_when_lote_emitted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
  v_lote INTEGER;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
    SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote
        USING HINT = 'Avaliações pertencentes a lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
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


--
-- Name: FUNCTION prevent_modification_avaliacao_when_lote_emitted(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() IS 'Impede UPDATE/DELETE em avaliações quando o lote já possui laudo emitido';


--
-- Name: prevent_modification_lote_when_laudo_emitted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_modification_lote_when_laudo_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_has_laudo BOOLEAN := FALSE;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- desligar temporariamente row level security para a checagem interna
    PERFORM set_config('row_security', 'off', true);
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO v_has_laudo;
    IF v_has_laudo THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
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


--
-- Name: FUNCTION prevent_modification_lote_when_laudo_emitted(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido para o lote';


--
-- Name: prevent_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alteraÃ§Ãµes nas avaliaÃ§Ãµes durante a emissÃ£o do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  
  -- Se Ã© um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se Ã© UPDATE, verificar se estÃ¡ tentando mudar durante emissÃ£o
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informaÃ§Ãµes do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo jÃ¡ foi emitido, prevenir mudanÃ§as crÃ­ticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se estÃ¡ tentando mudar campos crÃ­ticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'NÃ£o Ã© permitido alterar campos crÃ­ticos de avaliaÃ§Ã£o com laudo jÃ¡ emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_mutation_during_emission() IS 'Previne alteraÃ§Ãµes em campos crÃ­ticos de avaliaÃ§Ãµes quando o laudo do lote jÃ¡ foi emitido. Atualizada em migration 099 para remover referÃªncia ao campo processamento_em removido.';


--
-- Name: prevent_update_finalized_lote(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION prevent_update_finalized_lote(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_update_finalized_lote() IS 'Trigger atualizada para permitir registro de laudo_enviado_em mesmo quando já existe laudo com status=''enviado''';


--
-- Name: prevent_update_laudo_enviado(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: refresh_vw_recibos_completos_mat(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION refresh_vw_recibos_completos_mat(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.refresh_vw_recibos_completos_mat() IS 'Função helper para atualizar materialized view vw_recibos_completos_mat';


--
-- Name: registrar_inativacao_funcionario(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION registrar_inativacao_funcionario(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.registrar_inativacao_funcionario() IS 'Registra automaticamente data e responsável pela inativação de funcionários';


--
-- Name: resolver_notificacao(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) IS 'Marca uma notificação como resolvida e registra auditoria';


--
-- Name: resolver_notificacoes_por_contexto(text, text, character varying); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) IS 'Resolve múltiplas notificações com base em critério de contexto (ex: lote_id)';


--
-- Name: safe_drop_policy(text, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION safe_drop_policy(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.safe_drop_policy(p_policy_name text, p_table_name text) IS 'Safely drops a policy after validating name matches table.
   Use this in migrations instead of DROP POLICY directly.
   Example: SELECT safe_drop_policy(''avaliacoes_own_select'', ''avaliacoes'')';


--
-- Name: set_questao_from_item(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: set_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: sync_personalizado_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_personalizado_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Quando contratacao_personalizada muda para valor_definido, atualizar contratante
    IF NEW.status = 'valor_definido' AND (OLD.status IS NULL OR OLD.status = 'aguardando_valor_admin') THEN
        UPDATE contratantes 
        SET status = 'aguardando_pagamento', atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = NEW.contratante_id;
        
        RAISE NOTICE 'Contratante % atualizado para aguardando_pagamento', NEW.contratante_id;
    END IF;
    
    -- Quando pago, ativar contratante e disparar criação de conta
    IF NEW.status = 'pago' AND OLD.status = 'aguardando_pagamento' THEN
        UPDATE contratantes 
        SET status = 'ativo', 
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


--
-- Name: FUNCTION sync_personalizado_status(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_personalizado_status() IS 'Sincroniza automaticamente status entre contratacao_personalizada e contratantes';


--
-- Name: trg_enforce_laudo_id_equals_lote(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: trg_reject_prohibited_roles_func(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION trg_reject_prohibited_roles_func(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trg_reject_prohibited_roles_func() IS 'Trigger function que rejeita inserÃ§Ãµes/updates de roles proibidos em funcionarios.
Fornece mensagem de erro clara direcionando para a tabela usuarios.
Adicionado em Migration 410 (2026-02-05).';


--
-- Name: trigger_criar_pdf_job(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: trigger_gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: update_clinicas_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: update_funcionarios_clinicas_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_funcionarios_clinicas_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_funcionarios_entidades_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_funcionarios_entidades_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_pdf_jobs_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pdf_jobs_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


--
-- Name: update_usuarios_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_usuarios_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: upsert_laudo(integer, character, text, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) IS 'Atualiza laudo rascunho existente (id já reservado) ou insere se não existir';


--
-- Name: user_has_permission(text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION user_has_permission(permission_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_permission(permission_name text) IS 'Verifica se o usuário atual tem uma permissão específica via RBAC';


--
-- Name: validar_lote_para_laudo(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validar_lote_para_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM validar_lote_pre_laudo(p_lote_id);
END;
$$;


--
-- Name: FUNCTION validar_lote_para_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_lote_para_laudo(p_lote_id integer) IS 'Wrapper for validar_lote_pre_laudo for compatibility';


--
-- Name: validar_lote_pre_laudo(integer); Type: FUNCTION; Schema: public; Owner: -
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
        SELECT empresa_id, numero_ordem INTO v_empresa_id, v_numero_lote
        FROM lotes_avaliacao
        WHERE id = p_lote_id;

        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'concluido') AS concluidas,
          COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas
        INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas
        FROM avaliacoes
        WHERE lote_id = p_lote_id;

        SELECT COUNT(*) INTO v_funcionarios_pendentes
        FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
        WHERE NOT EXISTS (
          SELECT 1 FROM avaliacoes a 
          WHERE a.funcionario_cpf = el.funcionario_cpf 
          AND a.lote_id = p_lote_id
        );

        IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
          v_alertas := array_append(v_alertas, 'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' || v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || '). Verifique se há problemas sistêmicos.');
        END IF;

        IF v_funcionarios_pendentes > 0 THEN
          v_alertas := array_append(v_alertas, 'PENDÊNCIA: ' || v_funcionarios_pendentes || ' funcionário(s) deveriam estar neste lote mas não foram incluídos. Revise a elegibilidade.');
        END IF;

        IF v_avaliacoes_concluidas = 0 THEN
          v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');
        END IF;

        v_detalhes := jsonb_build_object(
          'lote_id', p_lote_id,
          'numero_lote', v_numero_lote,
          'total_avaliacoes', v_total_avaliacoes,
          'avaliacoes_concluidas', v_avaliacoes_concluidas,
          'avaliacoes_inativadas', v_avaliacoes_inativadas,
          'funcionarios_pendentes', v_funcionarios_pendentes,
          'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_total_avaliacoes, 0)) * 100, 2)
        );

        IF v_avaliacoes_concluidas = 0 OR v_funcionarios_pendentes > 0 THEN
          v_bloqueante := TRUE;
        END IF;

        RETURN QUERY SELECT 
          NOT v_bloqueante AS valido,
          v_alertas AS alertas,
          v_funcionarios_pendentes,
          v_detalhes AS detalhes,
          v_bloqueante AS bloqueante;
      END;
      $$;


--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote está pronto para emissão de laudo. Lotes com status concluido e avaliações finalizadas são considerados válidos (Pronto). Apenas lotes em andamento verificam funcionários pendentes.';


--
-- Name: validar_parcelas_json(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: validar_sessao_rls(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION validar_sessao_rls(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida variáveis de sessão para Row Level Security. 
Espera: app.current_perfil, app.current_user_cpf
Opcional: app.current_contratante_id, app.current_clinica_id';


--
-- Name: validar_status_avaliacao(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION validar_status_avaliacao(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_status_avaliacao() IS 'Valida que avaliacoes inativadas nao podem voltar a status iniciada ou em_andamento';


--
-- Name: validate_funcionario_clinica_empresa(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: validate_funcionario_clinica_tipo(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: validate_funcionario_entidade_tipo(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: validate_policy_table_match(text, text); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION validate_policy_table_match(p_policy_name text, p_table_name text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_policy_table_match(p_policy_name text, p_table_name text) IS 'Validates that policy name matches target table name.
   Use in migrations before DROP/CREATE POLICY.
   Example: validate_policy_table_match(''avaliacoes_own_select'', ''avaliacoes'')';


--
-- Name: validate_rh_clinica(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION validate_rh_clinica(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_rh_clinica() IS 'Valida se o RH atual realmente pertence à clínica configurada na sessão';


--
-- Name: verificar_inativacao_consecutiva(character, integer); Type: FUNCTION; Schema: public; Owner: -
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
  SELECT la.numero_ordem, a.statusINTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
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


--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Atualização: primeira avaliação pós importação permitida; sinalização a partir da 2ª inativação';


--
-- Name: verificar_integridade_recibo(integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION verificar_integridade_recibo(recibo_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_integridade_recibo(recibo_id integer) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migration_issues; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._migration_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migration_issues_id_seq OWNED BY public._migration_issues.id;


--
-- Name: analise_estatistica; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analise_estatistica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analise_estatistica_id_seq OWNED BY public.analise_estatistica.id;


--
-- Name: audit_access_denied; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE audit_access_denied; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_access_denied IS 'Logs de tentativas de acesso bloqueadas por RLS';


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_access_denied_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_access_denied_id_seq OWNED BY public.audit_access_denied.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria - registros de emergência removidos em 2026-02-03';


--
-- Name: COLUMN audit_logs.user_cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.user_cpf IS 'CPF do usuário que executou a ação. NULL indica ação automática do sistema.';


--
-- Name: COLUMN audit_logs.user_perfil; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.user_perfil IS 'Perfil do usuário que executou a ação (pode ser NULL para operações sem contexto de sessão)';


--
-- Name: COLUMN audit_logs.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.clinica_id IS 'ID da clínica relacionada à ação (quando aplicável).';


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: audit_stats_by_user; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW audit_stats_by_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.audit_stats_by_user IS 'EstatÃƒÂ­sticas de aÃƒÂ§ÃƒÂµes por usuÃƒÂ¡rio para anÃƒÂ¡lise de comportamento';


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE auditoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auditoria IS 'Tabela de auditoria para registrar todas as aÃ§Ãµes do sistema';


--
-- Name: COLUMN auditoria.hash_operacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria.hash_operacao IS 'Hash SHA-256 para verificaÃ§Ã£o de integridade da operaÃ§Ã£o';


--
-- Name: auditoria_geral; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_geral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_geral_id_seq OWNED BY public.auditoria_geral.id;


--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: auditoria_laudos; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_solicitation_has_requester CHECK ((((acao)::text <> ALL ((ARRAY['solicitar_emissao'::character varying, 'solicitacao_manual'::character varying])::text[])) OR (solicitado_por IS NOT NULL))),
    CONSTRAINT chk_status_valid CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'processando'::character varying, 'emitido'::character varying, 'enviado'::character varying, 'erro'::character varying, 'reprocessando'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT chk_tipo_solicitante_valid CHECK (((tipo_solicitante IS NULL) OR ((tipo_solicitante)::text = ANY ((ARRAY['rh'::character varying, 'gestor_entidade'::character varying, 'admin'::character varying, 'emissor'::character varying])::text[]))))
);


--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.lote_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.lote_id IS 'Referencia ao lote de avaliacao. FK com ON DELETE CASCADE.';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';


--
-- Name: COLUMN auditoria_laudos.solicitado_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.solicitado_por IS 'CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes manuais.';


--
-- Name: COLUMN auditoria_laudos.tipo_solicitante; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.tipo_solicitante IS 'Tipo do solicitante: rh, gestor_entidade, admin, emissor. Obrigatório quando solicitado_por preenchido.';


--
-- Name: COLUMN auditoria_laudos.tentativas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.tentativas IS 'Contador de tentativas de processamento para retry logic. Default 0.';


--
-- Name: COLUMN auditoria_laudos.erro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.erro IS 'Mensagem de erro detalhada quando processamento falha. NULL se bem-sucedido.';


--
-- Name: CONSTRAINT chk_solicitation_has_requester ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_solicitation_has_requester ON public.auditoria_laudos IS 'Garante que solicitações manuais sempre tenham o CPF do solicitante registrado.';


--
-- Name: CONSTRAINT chk_status_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_status_valid ON public.auditoria_laudos IS 'Garante que apenas status válidos sejam registrados.';


--
-- Name: CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON public.auditoria_laudos IS 'Valida tipos permitidos de solicitante.';


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_laudos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_laudos_id_seq OWNED BY public.auditoria_laudos.id;


--
-- Name: auditoria_recibos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE auditoria_recibos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auditoria_recibos IS 'Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocessamento, erro)';


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_recibos_id_seq OWNED BY public.auditoria_recibos.id;


--
-- Name: avaliacao_resets; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE avaliacao_resets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avaliacao_resets IS 'Immutable audit log of evaluation reset operations';


--
-- Name: COLUMN avaliacao_resets.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.id IS 'Unique identifier for the reset operation';


--
-- Name: COLUMN avaliacao_resets.avaliacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.avaliacao_id IS 'ID of the evaluation that was reset';


--
-- Name: COLUMN avaliacao_resets.lote_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.lote_id IS 'ID of the batch/cycle containing the evaluation';


--
-- Name: COLUMN avaliacao_resets.requested_by_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_user_id IS 'User ID who requested the reset';


--
-- Name: COLUMN avaliacao_resets.requested_by_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor_entidade)';


--
-- Name: COLUMN avaliacao_resets.reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.reason IS 'Mandatory justification for the reset operation';


--
-- Name: COLUMN avaliacao_resets.respostas_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.respostas_count IS 'Number of responses deleted during reset';


--
-- Name: COLUMN avaliacao_resets.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacao_resets.created_at IS 'Timestamp when the reset was performed';


--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'iniciada'::character varying, 'em_andamento'::character varying, 'concluido'::character varying, 'inativada'::character varying])::text[])))
);


--
-- Name: TABLE avaliacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.avaliacoes IS 'Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional';


--
-- Name: COLUMN avaliacoes.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacoes.status IS 'Status da avaliaÃ§Ã£o: iniciada, em_andamento, concluida, inativada (nÃ£o incrementa Ã­ndice)';


--
-- Name: COLUMN avaliacoes.inativada_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacoes.inativada_em IS 'Timestamp quando a avaliacao foi inativada pelo RH';


--
-- Name: COLUMN avaliacoes.motivo_inativacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.avaliacoes.motivo_inativacao IS 'Motivo informado pelo RH para inativacao da avaliacao';


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avaliacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;


--
-- Name: clinica_configuracoes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE clinica_configuracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinica_configuracoes IS 'Configuracoes e campos customizaveis por clinica';


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinica_configuracoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinica_configuracoes_id_seq OWNED BY public.clinica_configuracoes.id;


--
-- Name: seq_contratantes_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seq_contratantes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT clinicas_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT clinicas_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
);


--
-- Name: clinicas_empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinicas_empresas (
    clinica_id integer NOT NULL,
    empresa_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE clinicas_empresas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinicas_empresas IS 'Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que elas atendem';


--
-- Name: COLUMN clinicas_empresas.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_empresas.clinica_id IS 'ID da clinica de medicina ocupacional';


--
-- Name: COLUMN clinicas_empresas.empresa_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_empresas.empresa_id IS 'ID da empresa cliente atendida pela clÃ­nica';


--
-- Name: clinicas_senhas; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE clinicas_senhas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinicas_senhas IS 'Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)';


--
-- Name: COLUMN clinicas_senhas.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_senhas.clinica_id IS 'ReferÃªncia para a clÃ­nica';


--
-- Name: COLUMN clinicas_senhas.cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_senhas.cpf IS 'CPF do usuÃ¡rio RH';


--
-- Name: COLUMN clinicas_senhas.senha_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_senhas.senha_hash IS 'Hash bcrypt da senha';


--
-- Name: COLUMN clinicas_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas_senhas.primeira_senha_alterada IS 'Indica se o usuÃ¡rio jÃ¡ alterou a senha inicial';


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinicas_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinicas_senhas_id_seq OWNED BY public.clinicas_senhas.id;


--
-- Name: contratacao_personalizada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratacao_personalizada (
    id integer NOT NULL,
    numero_funcionarios_estimado integer,
    valor_por_funcionario numeric(10,2),
    valor_total_estimado numeric(12,2),
    payment_link_token character varying(128),
    payment_link_expiracao timestamp without time zone,
    link_enviado_em timestamp without time zone,
    status character varying(50) DEFAULT 'aguardando_valor'::character varying,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entidade_id integer
);


--
-- Name: TABLE contratacao_personalizada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contratacao_personalizada IS 'Tabela de compatibilidade para contratacao personalizada (fluxo legacy e testes)';


--
-- Name: COLUMN contratacao_personalizada.payment_link_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.payment_link_token IS 'Token Ãºnico para link de pagamento personalizado';


--
-- Name: COLUMN contratacao_personalizada.payment_link_expiracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.payment_link_expiracao IS 'Data/hora de expiraÃ§Ã£o do link';


--
-- Name: COLUMN contratacao_personalizada.link_enviado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.link_enviado_em IS 'Quando o link foi enviado ao contratante';


--
-- Name: COLUMN contratacao_personalizada.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.status IS 'Estados: aguardando_valor, valor_definido, aguardando_pagamento, pagamento_confirmado, cancelado';


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratacao_personalizada_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratacao_personalizada_id_seq OWNED BY public.contratacao_personalizada.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
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
    payment_link_token character varying(128),
    entidade_id integer,
    tomador_id integer,
    tipo_tomador character varying(50) DEFAULT 'entidade'::character varying
);


--
-- Name: TABLE contratos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contratos IS 'Contratos gerados para contratantes. Fluxo simplificado sem tabelas intermediárias.';


--
-- Name: COLUMN contratos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos.status IS 'Status extra usado para controle de pagamento (payment_pending, payment_paid, etc.)';


--
-- Name: COLUMN contratos.conteudo_gerado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos.conteudo_gerado IS 'Conteúdo completo do contrato gerado para o contratante';


--
-- Name: COLUMN contratos.valor_personalizado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos.valor_personalizado IS 'Valor personalizado por funcionário (para planos personalizados)';


--
-- Name: COLUMN contratos.tipo_tomador; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica';


--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;


--
-- Name: contratos_planos; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT contratos_planos_modalidade_pagamento_check CHECK (((modalidade_pagamento)::text = ANY ((ARRAY['a_vista'::character varying, 'parcelado'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT contratos_planos_tipo_pagamento_check CHECK (((tipo_pagamento)::text = ANY ((ARRAY['boleto'::character varying, 'cartao'::character varying, 'pix'::character varying, NULL::character varying])::text[])))
);


--
-- Name: COLUMN contratos_planos.valor_pago; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos_planos.valor_pago IS 'Valor efetivamente pago pelo contratante';


--
-- Name: COLUMN contratos_planos.tipo_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos_planos.tipo_pagamento IS 'Tipo de pagamento utilizado: boleto, cartao ou pix';


--
-- Name: COLUMN contratos_planos.modalidade_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos_planos.modalidade_pagamento IS 'Modalidade: a_vista ou parcelado';


--
-- Name: COLUMN contratos_planos.data_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos_planos.data_pagamento IS 'Data do primeiro pagamento';


--
-- Name: COLUMN contratos_planos.parcelas_json; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratos_planos.parcelas_json IS 'Detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_planos_id_seq OWNED BY public.contratos_planos.id;


--
-- Name: emissao_queue; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emissao_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emissao_queue_id_seq OWNED BY public.emissao_queue.id;


--
-- Name: empresas_clientes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE empresas_clientes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.empresas_clientes IS 'View vw_comparativo_empresas removida (usava empresa_id direta)';


--
-- Name: COLUMN empresas_clientes.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresas_clientes.clinica_id IS 'ID da clÃ­nica de medicina ocupacional que atende esta empresa (NOT NULL - obrigatÃ³rio).
Arquitetura segregada: empresas pertencem APENAS a clÃ­nicas, NUNCA a entidades.';


--
-- Name: COLUMN empresas_clientes.representante_nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresas_clientes.representante_nome IS 'Nome do representante legal da empresa (opcional)';


--
-- Name: COLUMN empresas_clientes.representante_fone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresas_clientes.representante_fone IS 'Telefone do representante (opcional)';


--
-- Name: COLUMN empresas_clientes.representante_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresas_clientes.representante_email IS 'Email do representante (opcional)';


--
-- Name: COLUMN empresas_clientes.responsavel_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.empresas_clientes.responsavel_email IS 'Email do responsável pela empresa';


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empresas_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empresas_clientes_id_seq OWNED BY public.empresas_clientes.id;


--
-- Name: entidades; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE entidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.entidades IS 'Entidades contratantes do sistema (empresas que contratam avaliações).
    Renomeada de "contratantes" em Migration 420 (2026-02-05).';


--
-- Name: COLUMN entidades.responsavel_nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN entidades.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.status IS 'pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento | ativo | inativo | cancelado';


--
-- Name: COLUMN entidades.aprovado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.aprovado_em IS 'Timestamp em que o contratante foi aprovado por um admin';


--
-- Name: COLUMN entidades.aprovado_por_cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.aprovado_por_cpf IS 'CPF do admin que aprovou o contratante';


--
-- Name: COLUMN entidades.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';


--
-- Name: COLUMN entidades.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';


--
-- Name: COLUMN entidades.plano_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.plano_id IS 'ID do plano associado ao contratante';


--
-- Name: COLUMN entidades.data_liberacao_login; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.data_liberacao_login IS 'Data em que o login foi liberado após confirmação de pagamento';


--
-- Name: COLUMN entidades.contrato_aceito; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades.contrato_aceito IS 'Indica se o contratante aceitou o contrato/política (usado para fluxo de pagamento e notificações)';


--
-- Name: entidades_senhas; Type: TABLE; Schema: public; Owner: -
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
    atualizado_em timestamp with time zone
);


--
-- Name: TABLE entidades_senhas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.entidades_senhas IS 'Tabela de senhas de gestores de entidades';


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entidades_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entidades_senhas_id_seq OWNED BY public.entidades_senhas.id;


--
-- Name: fila_emissao; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';


--
-- Name: COLUMN fila_emissao.tentativas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.tentativas IS 'Número de tentativas de processamento';


--
-- Name: COLUMN fila_emissao.max_tentativas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';


--
-- Name: COLUMN fila_emissao.proxima_tentativa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';


--
-- Name: COLUMN fila_emissao.erro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.erro IS 'Mensagem do último erro ocorrido';


--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fila_emissao_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fila_emissao_id_seq1 OWNED BY public.fila_emissao.id;


--
-- Name: fk_migration_audit; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fk_migration_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fk_migration_audit_id_seq OWNED BY public.fk_migration_audit.id;


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT funcionarios_nivel_cargo_check CHECK (((((perfil)::text = 'funcionario'::text) AND ((nivel_cargo)::text = ANY ((ARRAY['operacional'::character varying, 'gestao'::character varying])::text[]))) OR (((perfil)::text <> 'funcionario'::text) AND (nivel_cargo IS NULL)))),
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['funcionario'::character varying, 'admin'::character varying, 'emissor'::character varying, 'cadastro'::character varying])::text[]))),
    CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (((perfil)::text <> ALL ((ARRAY['gestor_entidade'::character varying, 'rh'::character varying])::text[])))
);

ALTER TABLE ONLY public.funcionarios FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funcionarios IS 'Policies antigas que usavam FKs diretas foram removidas';


--
-- Name: COLUMN funcionarios.perfil; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.perfil IS 'Perfil do usuario: funcionario (pessoa avaliada), rh (clinica), gestor (entidade), emissor, admin';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_id IS 'ID da última avaliação concluída ou inativada (denormalizado para performance)';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_data_conclusao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_data_conclusao IS 'Data de conclusão da última avaliação (denormalizado)';


--
-- Name: COLUMN funcionarios.ultima_avaliacao_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_status IS 'Status da última avaliação: concluida ou inativada (denormalizado)';


--
-- Name: COLUMN funcionarios.ultimo_motivo_inativacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultimo_motivo_inativacao IS 'Motivo de inativação quando ultima_avaliacao_status = inativada';


--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo de 1 ano)';


--
-- Name: COLUMN funcionarios.data_nascimento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.data_nascimento IS 'Data de nascimento do funcionário (YYYY-MM-DD)';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunca fez)';


--
-- Name: COLUMN funcionarios.incluido_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.incluido_em IS 'Data e hora em que o funcionário foi incluído no sistema';


--
-- Name: COLUMN funcionarios.inativado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.inativado_em IS 'Data e hora em que o funcionário foi inativado';


--
-- Name: COLUMN funcionarios.inativado_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.inativado_por IS 'CPF do usuário que inativou o funcionário';


--
-- Name: COLUMN funcionarios.ultimo_lote_codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultimo_lote_codigo IS 'Código do lote da última avaliação (denormalizado)';


--
-- Name: CONSTRAINT funcionarios_perfil_check ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT funcionarios_perfil_check ON public.funcionarios IS 'Perfis permitidos em funcionarios: funcionario, admin, emissor, cadastro. Gestores vÃ£o para usuarios.';


--
-- Name: CONSTRAINT no_gestor_entidade_in_funcionarios ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT no_gestor_entidade_in_funcionarios ON public.funcionarios IS 'Gestores (gestor_entidade, rh) devem existir apenas em tabela usuarios. Proibido em funcionarios.';


--
-- Name: funcionarios_clinicas; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funcionarios_clinicas IS 'Relacionamento M:N entre funcionÃ¡rios e empresas clientes (via clÃ­nicas de medicina ocupacional). Permite histÃ³rico de vÃ­nculos.';


--
-- Name: COLUMN funcionarios_clinicas.funcionario_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.funcionario_id IS 'ID do funcionÃ¡rio (pessoa fÃ­sica avaliada)';


--
-- Name: COLUMN funcionarios_clinicas.empresa_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.empresa_id IS 'ID da empresa cliente (atendida pela clÃ­nica) Ã  qual o funcionÃ¡rio pertence';


--
-- Name: COLUMN funcionarios_clinicas.ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.ativo IS 'TRUE = vÃ­nculo ativo | FALSE = vÃ­nculo encerrado (mantÃ©m histÃ³rico sem deletar)';


--
-- Name: COLUMN funcionarios_clinicas.data_vinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_vinculo IS 'Data em que o funcionÃ¡rio foi vinculado Ã  empresa (via clÃ­nica)';


--
-- Name: COLUMN funcionarios_clinicas.data_desvinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.data_desvinculo IS 'Data em que o vÃ­nculo foi encerrado (NULL = vÃ­nculo ativo)';


--
-- Name: COLUMN funcionarios_clinicas.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_clinicas.clinica_id IS 'ID da clÃ­nica de medicina ocupacional que gerencia este funcionÃ¡rio (NOT NULL - obrigatÃ³rio).
Esta coluna Ã© essencial para a arquitetura segregada: identifica qual clÃ­nica tem acesso ao funcionÃ¡rio.';


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.funcionarios_clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.funcionarios_clinicas_id_seq OWNED BY public.funcionarios_clinicas.id;


--
-- Name: funcionarios_entidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionarios_entidades (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    entidade_id integer NOT NULL,
    ativo boolean DEFAULT true,
    data_vinculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo timestamp without time zone
);


--
-- Name: TABLE funcionarios_entidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.funcionarios_entidades IS 'Relacionamento M:N entre funcionÃ¡rios e entidades (tomadores tipo=entidade). Permite histÃ³rico de vÃ­nculos.';


--
-- Name: COLUMN funcionarios_entidades.funcionario_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_entidades.funcionario_id IS 'ID do funcionÃ¡rio (pessoa fÃ­sica avaliada)';


--
-- Name: COLUMN funcionarios_entidades.entidade_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_entidades.entidade_id IS 'ID da entidade (tomador tipo=entidade) - empresa que administra seus prÃ³prios funcionÃ¡rios com um gestor';


--
-- Name: COLUMN funcionarios_entidades.ativo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_entidades.ativo IS 'TRUE = vÃ­nculo ativo | FALSE = vÃ­nculo encerrado (mantÃ©m histÃ³rico sem deletar)';


--
-- Name: COLUMN funcionarios_entidades.data_vinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_entidades.data_vinculo IS 'Data em que o funcionÃ¡rio foi vinculado Ã  entidade';


--
-- Name: COLUMN funcionarios_entidades.data_desvinculo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios_entidades.data_desvinculo IS 'Data em que o vÃ­nculo foi encerrado (NULL = vÃ­nculo ativo)';


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.funcionarios_entidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.funcionarios_entidades_id_seq OWNED BY public.funcionarios_entidades.id;


--
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.funcionarios_id_seq OWNED BY public.funcionarios.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
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
    senha_hash text,
    CONSTRAINT usuarios_cpf_check CHECK (((cpf)::text ~ '^\d{11}$'::text)),
    CONSTRAINT usuarios_gestor_check CHECK ((((tipo_usuario = 'gestor'::public.usuario_tipo_enum) AND (entidade_id IS NOT NULL) AND (clinica_id IS NULL)) OR (tipo_usuario <> 'gestor'::public.usuario_tipo_enum))),
    CONSTRAINT usuarios_tipo_check CHECK ((((tipo_usuario = ANY (ARRAY['admin'::public.usuario_tipo_enum, 'emissor'::public.usuario_tipo_enum])) AND (clinica_id IS NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'rh'::public.usuario_tipo_enum) AND (clinica_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'gestor'::public.usuario_tipo_enum) AND (entidade_id IS NOT NULL) AND (clinica_id IS NULL))))
);


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuarios IS 'UsuÃ¡rios do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidades_senhas/clinicas_senhas.';


--
-- Name: COLUMN usuarios.cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.cpf IS 'CPF Ãºnico do usuÃ¡rio';


--
-- Name: COLUMN usuarios.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.clinica_id IS 'Para RH: vÃ­nculo com clÃ­nica (senha em clinicas_senhas)';


--
-- Name: COLUMN usuarios.entidade_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.entidade_id IS 'Para Gestor: vÃ­nculo com entidade (senha em entidades_senhas)';


--
-- Name: gestores; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.gestores AS
 SELECT cpf,
    nome,
    email,
    tipo_usuario AS usuario_tipo,
        CASE
            WHEN (tipo_usuario = 'rh'::public.usuario_tipo_enum) THEN 'RH (ClÃ­nica)'::text
            WHEN (tipo_usuario = 'gestor'::public.usuario_tipo_enum) THEN 'Gestor de Entidade'::text
            ELSE 'Outro'::text
        END AS tipo_gestor_descricao,
    clinica_id,
    entidade_id,
    ativo,
    criado_em,
    atualizado_em
   FROM public.usuarios
  WHERE (tipo_usuario = ANY (ARRAY['rh'::public.usuario_tipo_enum, 'gestor'::public.usuario_tipo_enum]));


--
-- Name: VIEW gestores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.gestores IS 'View de gestores do sistema (RH e Gestor de Entidade)';


--
-- Name: laudo_arquivos_remotos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laudo_arquivos_remotos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNED BY public.laudo_arquivos_remotos.id;


--
-- Name: laudo_downloads; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laudo_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laudo_downloads_id_seq OWNED BY public.laudo_downloads.id;


--
-- Name: laudo_generation_jobs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE laudo_generation_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.laudo_generation_jobs IS 'Jobs para geração de PDFs de laudos; consumidos por worker externo.';


--
-- Name: COLUMN laudo_generation_jobs.max_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudo_generation_jobs.max_attempts IS 'Número máximo de tentativas antes de mover para DLQ/falha permanente';


--
-- Name: COLUMN laudo_generation_jobs.payload; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudo_generation_jobs.payload IS 'Payload opcional com parâmetros (ex.: options para geração, template overrides)';


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laudo_generation_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNED BY public.laudo_generation_jobs.id;


--
-- Name: laudos; Type: TABLE; Schema: public; Owner: -
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
    hash_pdf character varying(64),
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
    CONSTRAINT chk_laudos_emissor_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (emissor_cpf IS NOT NULL) AND (emissor_cpf <> ''::bpchar)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_emitido_antes_enviado CHECK (((enviado_em IS NULL) OR (emitido_em IS NULL) OR (emitido_em <= enviado_em))),
    CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (((emitido_em IS NULL) OR (emissor_cpf IS NOT NULL))),
    CONSTRAINT chk_laudos_emitido_em_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (emitido_em IS NOT NULL)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_hash_pdf_valid CHECK (((hash_pdf IS NULL) OR ((hash_pdf)::text ~ '^[a-f0-9]{64}$'::text))),
    CONSTRAINT chk_laudos_hash_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (hash_pdf IS NOT NULL) AND ((hash_pdf)::text <> ''::text)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_status_valid CHECK (((status)::text = ANY ((ARRAY['emitido'::character varying, 'enviado'::character varying, 'rascunho'::character varying])::text[]))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id))
);


--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.laudos IS 'Laudos técnicos - emitidos por Emissor, visíveis por RH/Gestor, admin NAO tem acesso operacional';


--
-- Name: COLUMN laudos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.status IS 'Status do laudo: apenas "enviado" (emissão é automática)';


--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';


--
-- Name: COLUMN laudos.relatorio_individual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.relatorio_individual IS 'Arquivo PDF do relatório individual do funcionário';


--
-- Name: COLUMN laudos.relatorio_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.relatorio_lote IS 'Arquivo PDF do relatório do lote completo';


--
-- Name: COLUMN laudos.relatorio_setor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.relatorio_setor IS 'Arquivo PDF do relatório setorial/estatístico';


--
-- Name: COLUMN laudos.hash_relatorio_individual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.hash_relatorio_individual IS 'Hash SHA-256 do relatório individual para integridade';


--
-- Name: COLUMN laudos.hash_relatorio_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.hash_relatorio_lote IS 'Hash SHA-256 do relatório de lote para integridade';


--
-- Name: COLUMN laudos.hash_relatorio_setor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.hash_relatorio_setor IS 'Hash SHA-256 do relatório setorial para integridade';


--
-- Name: COLUMN laudos.arquivo_remoto_uploaded_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_uploaded_at IS 'Timestamp de quando o laudo foi feito upload para o storage remoto (Backblaze)';


--
-- Name: COLUMN laudos.arquivo_remoto_etag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_etag IS 'ETag retornado pelo storage remoto para verificação de integridade';


--
-- Name: COLUMN laudos.arquivo_remoto_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.arquivo_remoto_size IS 'Tamanho do arquivo em bytes no storage remoto';


--
-- Name: CONSTRAINT chk_laudos_emitido_antes_enviado ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_laudos_emitido_antes_enviado ON public.laudos IS 'Garante que data de emissão é anterior à data de envio';


--
-- Name: CONSTRAINT chk_laudos_hash_pdf_valid ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT chk_laudos_hash_pdf_valid ON public.laudos IS 'Valida que hash_pdf é um SHA-256 válido (64 caracteres hexadecimais)';


--
-- Name: CONSTRAINT laudos_id_equals_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT laudos_id_equals_lote_id ON public.laudos IS 'Garante que id = lote_id. Relação 1:1 estrita: um lote tem exatamente um laudo com o mesmo ID.';


--
-- Name: laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laudos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laudos_id_seq OWNED BY public.laudos.id;


--
-- Name: logs_admin; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE logs_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.logs_admin IS 'Auditoria de ações administrativas no sistema';


--
-- Name: COLUMN logs_admin.acao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.logs_admin.acao IS 'Tipo de ação executada pelo administrador';


--
-- Name: COLUMN logs_admin.detalhes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.logs_admin.detalhes IS 'JSON com informações detalhadas da ação';


--
-- Name: logs_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_admin_id_seq OWNED BY public.logs_admin.id;


--
-- Name: lote_id_allocator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lote_id_allocator (
    last_id bigint NOT NULL
);


--
-- Name: lotes_avaliacao; Type: TABLE; Schema: public; Owner: -
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
    modo_emergencia boolean DEFAULT false,
    motivo_emergencia text,
    entidade_id integer,
    CONSTRAINT lotes_avaliacao_entidade_or_clinica_empresa_check CHECK ((((entidade_id IS NOT NULL) AND (clinica_id IS NULL) AND (empresa_id IS NULL)) OR ((entidade_id IS NULL) AND (clinica_id IS NOT NULL) AND (empresa_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'ativo'::character varying, 'concluido'::character varying, 'emissao_solicitada'::character varying, 'emissao_em_andamento'::character varying, 'laudo_emitido'::character varying, 'cancelado'::character varying, 'finalizado'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


--
-- Name: TABLE lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliações - gerenciados por RH (clínica) ou Gestor (entidade), admin NAO tem acesso operacional';


--
-- Name: COLUMN lotes_avaliacao.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.id IS 'Identificador Ãºnico do lote (igual ao ID do laudo correspondente)';


--
-- Name: COLUMN lotes_avaliacao.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.status IS 'Status do lote: rascunho, ativo, concluido, emissao_solicitada, emissao_em_andamento, laudo_emitido, cancelado, finalizado';


--
-- Name: COLUMN lotes_avaliacao.liberado_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clínica';


--
-- Name: COLUMN lotes_avaliacao.hash_pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.hash_pdf IS 'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';


--
-- Name: COLUMN lotes_avaliacao.numero_ordem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.numero_ordem IS 'NÃºmero sequencial do lote na empresa (ex: 10 para o 10Âº lote da empresa)';


--
-- Name: COLUMN lotes_avaliacao.emitido_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.emitido_em IS 'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';


--
-- Name: COLUMN lotes_avaliacao.enviado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi marcado como enviado para RH/Entidade';


--
-- Name: COLUMN lotes_avaliacao.setor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.setor_id IS 'Setor da empresa ao qual o lote pertence (opcional)';


--
-- Name: COLUMN lotes_avaliacao.laudo_enviado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo foi enviado pelo emissor para a clínica';


--
-- Name: COLUMN lotes_avaliacao.modo_emergencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.modo_emergencia IS 'Flag que indica se o lote está em modo emergência (permite reprocessamento)';


--
-- Name: COLUMN lotes_avaliacao.motivo_emergencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_emergencia IS 'Descrição do motivo pelo qual o lote entrou em modo emergência';


--
-- Name: CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON public.lotes_avaliacao IS 'Valida que status do lote está dentro dos valores permitidos pela máquina de estados';


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lotes_avaliacao_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lotes_avaliacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNED BY public.lotes_avaliacao.id;


--
-- Name: mfa_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mfa_codes (
    id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE mfa_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mfa_codes IS 'CÃ³digos de autenticaÃ§Ã£o multifator (MFA) para funcionÃ¡rios';


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mfa_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mfa_codes_id_seq OWNED BY public.mfa_codes.id;


--
-- Name: migration_guidelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_guidelines (
    id integer NOT NULL,
    category text NOT NULL,
    guideline text NOT NULL,
    example text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migration_guidelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migration_guidelines_id_seq OWNED BY public.migration_guidelines.id;


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor_entidade'::text, 'funcionario'::text, 'contratante'::text, 'clinica'::text])))
);


--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real para admin e gestores';


--
-- Name: COLUMN notificacoes.destinatario_cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.destinatario_cpf IS 'CPF do destinatário quando aplicável';


--
-- Name: COLUMN notificacoes.titulo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.titulo IS 'Título resumido da notificação';


--
-- Name: COLUMN notificacoes.mensagem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.mensagem IS 'Mensagem detalhada da notificação';


--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais específicos do tipo de notificação';


--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiração da notificação (limpeza automática)';


--
-- Name: COLUMN notificacoes.resolvida; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.resolvida IS 'Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida';


--
-- Name: COLUMN notificacoes.data_resolucao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.data_resolucao IS 'Data/hora em que a notificação foi marcada como resolvida';


--
-- Name: COLUMN notificacoes.resolvido_por_cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.resolvido_por_cpf IS 'CPF do usuário que resolveu a notificação';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes_admin IS 'Notificações para administradores sobre eventos críticos do sistema';


--
-- Name: COLUMN notificacoes_admin.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes_admin.tipo IS 'Tipo de notificação para categorização e filtros';


--
-- Name: COLUMN notificacoes_admin.mensagem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes_admin.mensagem IS 'Mensagem descritiva da notificação';


--
-- Name: COLUMN notificacoes_admin.lote_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes_admin.lote_id IS 'Referência ao lote relacionado (opcional)';


--
-- Name: COLUMN notificacoes_admin.dados_contexto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes_admin.dados_contexto IS 'JSON com dados adicionais relevantes para a notificação';


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_admin_id_seq OWNED BY public.notificacoes_admin.id;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: notificacoes_traducoes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE notificacoes_traducoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes_traducoes IS 'Traducoes de notificacoes para multi-idioma';


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_traducoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_traducoes_id_seq OWNED BY public.notificacoes_traducoes.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pagamentos IS 'Registro de pagamentos de contratantes';


--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'Número de parcelas do pagamento (1 = à vista, 2-12 = parcelado)';


--
-- Name: COLUMN pagamentos.recibo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.recibo_url IS 'URL para visualização do recibo gerado';


--
-- Name: COLUMN pagamentos.recibo_numero; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.recibo_numero IS 'Número do recibo gerado após confirmação do pagamento (formato: REC-AAAA-NNNNN)';


--
-- Name: COLUMN pagamentos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.detalhes_parcelas IS 'detalhes das parcelas em JSON: [{numero, valor, data_vencimento, pago, data_pagamento}]';


--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'Referência opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';


--
-- Name: COLUMN pagamentos.idempotency_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.idempotency_key IS 'Chave de idempotência para evitar duplicação de pagamentos (opcional)';


--
-- Name: COLUMN pagamentos.external_transaction_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.external_transaction_id IS 'ID da transação no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';


--
-- Name: COLUMN pagamentos.provider_event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.provider_event_id IS 'ID único do evento do provedor de pagamento (para deduplicação de webhooks)';


--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: payment_links; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE payment_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_links IS 'Links de uso único enviados pelo admin para permitir pagamento de planos personalizados';


--
-- Name: COLUMN payment_links.token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_links.token IS 'Token público do link (uso único)';


--
-- Name: COLUMN payment_links.expiracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_links.expiracao IS 'Data/hora de expiração do link (opcional)';


--
-- Name: payment_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_links_id_seq OWNED BY public.payment_links.id;


--
-- Name: pdf_jobs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pdf_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pdf_jobs_id_seq OWNED BY public.pdf_jobs.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: planos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN planos.caracteristicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.planos.caracteristicas IS 'Características do plano em JSON: minimo_funcionarios, limite_funcionarios, beneficios, etc.';


--
-- Name: planos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planos_id_seq OWNED BY public.planos.id;


--
-- Name: policy_expression_backups; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.policy_expression_backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.policy_expression_backups_id_seq OWNED BY public.policy_expression_backups.id;


--
-- Name: questao_condicoes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questao_condicoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questao_condicoes_id_seq OWNED BY public.questao_condicoes.id;


--
-- Name: recibos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE recibos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.recibos IS 'Recibos financeiros gerados após confirmação de pagamento, separados do contrato de serviço';


--
-- Name: COLUMN recibos.numero_recibo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.numero_recibo IS 'Número único do recibo no formato REC-AAAA-NNNNN';


--
-- Name: COLUMN recibos.vigencia_inicio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.vigencia_inicio IS 'Data de início da vigência = data do pagamento';


--
-- Name: COLUMN recibos.vigencia_fim; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.vigencia_fim IS 'Data de fim da vigência = data_pagamento + 364 dias';


--
-- Name: COLUMN recibos.numero_funcionarios_cobertos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionários cobertos pelo plano contratado';


--
-- Name: COLUMN recibos.valor_total_anual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.valor_total_anual IS 'Valor total anual do plano';


--
-- Name: COLUMN recibos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.valor_por_funcionario IS 'Valor cobrado por funcionário (se aplicável)';


--
-- Name: COLUMN recibos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';


--
-- Name: COLUMN recibos.descricao_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.descricao_pagamento IS 'Descrição textual da forma de pagamento para incluir no PDF';


--
-- Name: COLUMN recibos.pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.pdf IS 'PDF binário do recibo (BYTEA)';


--
-- Name: COLUMN recibos.hash_pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.hash_pdf IS 'Hash SHA-256 do PDF binário em hexadecimal (64 caracteres)';


--
-- Name: COLUMN recibos.ip_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.ip_emissao IS 'Endereço IP de onde o recibo foi emitido';


--
-- Name: COLUMN recibos.emitido_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.emitido_por IS 'CPF do usuário que emitiu o recibo (formato: XXX.XXX.XXX-XX)';


--
-- Name: COLUMN recibos.hash_incluso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.hash_incluso IS 'Indica se o hash foi incluído no rodapé do PDF';


--
-- Name: COLUMN recibos.backup_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';


--
-- Name: COLUMN recibos.parcela_numero; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.parcela_numero IS 'Número da parcela associada ao recibo (1, 2, 3...)';


--
-- Name: COLUMN recibos.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.clinica_id IS 'ID da clínica associada ao recibo (opcional, para suporte a RH/Clínica)';


--
-- Name: recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recibos_id_seq OWNED BY public.recibos.id;


--
-- Name: relatorio_templates; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.relatorio_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.relatorio_templates_id_seq OWNED BY public.relatorio_templates.id;


--
-- Name: respostas; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: respostas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.respostas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: respostas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.respostas_id_seq OWNED BY public.respostas.id;


--
-- Name: resultados; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resultados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.role_permissions IS 'Admin tem apenas permissões de cadastro (RH, clínicas, admins). 
Operações como gerenciar avaliações, lotes, empresas e funcionários são de responsabilidade de RH e entidade_gestor.
Emissão de laudos é exclusiva de emissores.';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: session_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE session_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.session_logs IS 'Registra todos os acessos (login/logout) de usuários do sistema para auditoria';


--
-- Name: COLUMN session_logs.cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.session_logs.cpf IS 'CPF do usuário que fez login';


--
-- Name: COLUMN session_logs.perfil; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.session_logs.perfil IS 'Perfil do usuário no momento do login (funcionario, rh, emissor, admin)';


--
-- Name: COLUMN session_logs.clinica_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.session_logs.clinica_id IS 'ID da clínica associada ao usuário (para RH e emissores)';


--
-- Name: COLUMN session_logs.empresa_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.session_logs.empresa_id IS 'ID da empresa associada ao funcionário';


--
-- Name: COLUMN session_logs.session_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.session_logs.session_duration IS 'Duração calculada da sessão (logout - login)';


--
-- Name: session_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_logs_id_seq OWNED BY public.session_logs.id;


--
-- Name: suspicious_activity; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW suspicious_activity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.suspicious_activity IS 'Detecta atividades suspeitas: usuÃƒÂ¡rios com mais de 100 aÃƒÂ§ÃƒÂµes na ÃƒÂºltima hora';


--
-- Name: templates_contrato; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE templates_contrato; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.templates_contrato IS 'Templates editaveis para geracao de contratos';


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.templates_contrato_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.templates_contrato_id_seq OWNED BY public.templates_contrato.id;


--
-- Name: tokens_retomada_pagamento; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tokens_retomada_pagamento IS 'Tokens de uso único para retomada de processo de pagamento';


--
-- Name: COLUMN tokens_retomada_pagamento.token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.token IS 'Hash MD5 único para identificar a sessão de retomada';


--
-- Name: COLUMN tokens_retomada_pagamento.expira_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.expira_em IS 'Data/hora de expiração do token (72 horas por padrão)';


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tokens_retomada_pagamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tokens_retomada_pagamento_id_seq OWNED BY public.tokens_retomada_pagamento.id;


--
-- Name: tomadores; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_fila_emissao; Type: VIEW; Schema: public; Owner: -
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
  WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY ((ARRAY['pendente'::character varying, 'reprocessando'::character varying])::text[])))
  ORDER BY criado_em;


--
-- Name: VIEW v_fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_fila_emissao IS 'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';


--
-- Name: v_relatorio_emissoes; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW v_relatorio_emissoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_relatorio_emissoes IS 'Relatorio de emissoes de laudos com contexto (clinica ou entidade).
Compativel com arquitetura segregada de tomadores.';


--
-- Name: vw_empresas_stats; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW vw_empresas_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_empresas_stats IS 'Estatisticas de empresas com contadores de funcionarios e avaliacoes.
Usa funcionarios_clinicas para contagem correta em arquitetura segregada.';


--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias.
Inclui source_id e source_type para identificar o contexto (entidade ou clinica).
IMPORTANTE: Funcionarios podem aparecer em ambos contextos se tiverem vinculos historicos.';


--
-- Name: vw_notificacoes_nao_lidas; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: _migration_issues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migration_issues ALTER COLUMN id SET DEFAULT nextval('public._migration_issues_id_seq'::regclass);


--
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);


--
-- Name: audit_access_denied id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_access_denied ALTER COLUMN id SET DEFAULT nextval('public.audit_access_denied_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: auditoria_geral id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_geral ALTER COLUMN id SET DEFAULT nextval('public.auditoria_geral_id_seq'::regclass);


--
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);


--
-- Name: auditoria_recibos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_recibos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_recibos_id_seq'::regclass);


--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: clinica_configuracoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinica_configuracoes ALTER COLUMN id SET DEFAULT nextval('public.clinica_configuracoes_id_seq'::regclass);


--
-- Name: clinicas_senhas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_senhas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_senhas_id_seq'::regclass);


--
-- Name: contratacao_personalizada id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratacao_personalizada ALTER COLUMN id SET DEFAULT nextval('public.contratacao_personalizada_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: contratos_planos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_planos ALTER COLUMN id SET DEFAULT nextval('public.contratos_planos_id_seq'::regclass);


--
-- Name: emissao_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emissao_queue ALTER COLUMN id SET DEFAULT nextval('public.emissao_queue_id_seq'::regclass);


--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);


--
-- Name: entidades_senhas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas ALTER COLUMN id SET DEFAULT nextval('public.entidades_senhas_id_seq'::regclass);


--
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq1'::regclass);


--
-- Name: fk_migration_audit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fk_migration_audit ALTER COLUMN id SET DEFAULT nextval('public.fk_migration_audit_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: funcionarios_clinicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_clinicas ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_clinicas_id_seq'::regclass);


--
-- Name: funcionarios_entidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_entidades ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_entidades_id_seq'::regclass);


--
-- Name: laudo_arquivos_remotos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_arquivos_remotos ALTER COLUMN id SET DEFAULT nextval('public.laudo_arquivos_remotos_id_seq'::regclass);


--
-- Name: laudo_downloads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_downloads ALTER COLUMN id SET DEFAULT nextval('public.laudo_downloads_id_seq'::regclass);


--
-- Name: laudo_generation_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.laudo_generation_jobs_id_seq'::regclass);


--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);


--
-- Name: logs_admin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_admin ALTER COLUMN id SET DEFAULT nextval('public.logs_admin_id_seq'::regclass);


--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);


--
-- Name: migration_guidelines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_guidelines ALTER COLUMN id SET DEFAULT nextval('public.migration_guidelines_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: notificacoes_admin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);


--
-- Name: notificacoes_traducoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_traducoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_traducoes_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: payment_links id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links ALTER COLUMN id SET DEFAULT nextval('public.payment_links_id_seq'::regclass);


--
-- Name: pdf_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_jobs ALTER COLUMN id SET DEFAULT nextval('public.pdf_jobs_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: planos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos ALTER COLUMN id SET DEFAULT nextval('public.planos_id_seq'::regclass);


--
-- Name: policy_expression_backups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_expression_backups ALTER COLUMN id SET DEFAULT nextval('public.policy_expression_backups_id_seq'::regclass);


--
-- Name: questao_condicoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questao_condicoes ALTER COLUMN id SET DEFAULT nextval('public.questao_condicoes_id_seq'::regclass);


--
-- Name: recibos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos ALTER COLUMN id SET DEFAULT nextval('public.recibos_id_seq'::regclass);


--
-- Name: relatorio_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relatorio_templates ALTER COLUMN id SET DEFAULT nextval('public.relatorio_templates_id_seq'::regclass);


--
-- Name: respostas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas ALTER COLUMN id SET DEFAULT nextval('public.respostas_id_seq'::regclass);


--
-- Name: resultados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados ALTER COLUMN id SET DEFAULT nextval('public.resultados_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: session_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs ALTER COLUMN id SET DEFAULT nextval('public.session_logs_id_seq'::regclass);


--
-- Name: templates_contrato id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_contrato ALTER COLUMN id SET DEFAULT nextval('public.templates_contrato_id_seq'::regclass);


--
-- Name: tokens_retomada_pagamento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_retomada_pagamento ALTER COLUMN id SET DEFAULT nextval('public.tokens_retomada_pagamento_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: _migration_issues _migration_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migration_issues
    ADD CONSTRAINT _migration_issues_pkey PRIMARY KEY (id);


--
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);


--
-- Name: audit_access_denied audit_access_denied_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_access_denied
    ADD CONSTRAINT audit_access_denied_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auditoria_geral auditoria_geral_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_geral
    ADD CONSTRAINT auditoria_geral_pkey PRIMARY KEY (id);


--
-- Name: auditoria_laudos auditoria_laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT auditoria_laudos_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: auditoria_recibos auditoria_recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_pkey PRIMARY KEY (id);


--
-- Name: avaliacao_resets avaliacao_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: clinica_configuracoes clinica_configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT clinica_configuracoes_pkey PRIMARY KEY (id);


--
-- Name: clinicas clinicas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_cnpj_key UNIQUE (cnpj);


--
-- Name: clinicas clinicas_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_email_key UNIQUE (email);


--
-- Name: clinicas_empresas clinicas_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_pkey PRIMARY KEY (clinica_id, empresa_id);


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: clinicas clinicas_responsavel_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_responsavel_cpf_key UNIQUE (responsavel_cpf);


--
-- Name: clinicas_senhas clinicas_senhas_clinica_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_clinica_cpf_unique UNIQUE (clinica_id, cpf);


--
-- Name: clinicas_senhas clinicas_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_cpf_key UNIQUE (cpf);


--
-- Name: clinicas_senhas clinicas_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_pkey PRIMARY KEY (id);


--
-- Name: contratacao_personalizada contratacao_personalizada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: contratos_planos contratos_planos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_pkey PRIMARY KEY (id);


--
-- Name: emissao_queue emissao_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_pkey PRIMARY KEY (id);


--
-- Name: empresas_clientes empresas_clientes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);


--
-- Name: entidades entidades_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_cnpj_key UNIQUE (cnpj);


--
-- Name: entidades entidades_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_email_key UNIQUE (email);


--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);


--
-- Name: entidades_senhas entidades_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_cpf_key UNIQUE (cpf);


--
-- Name: entidades_senhas entidades_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_pkey PRIMARY KEY (id);


--
-- Name: fila_emissao fila_emissao_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_pkey1 PRIMARY KEY (id);


--
-- Name: fk_migration_audit fk_migration_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fk_migration_audit
    ADD CONSTRAINT fk_migration_audit_pkey PRIMARY KEY (id);


--
-- Name: funcionarios_clinicas funcionarios_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


--
-- Name: funcionarios_entidades funcionarios_entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_pkey PRIMARY KEY (id);


--
-- Name: funcionarios_entidades funcionarios_entidades_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_unique UNIQUE (funcionario_id, entidade_id);


--
-- Name: funcionarios funcionarios_matricula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_matricula_key UNIQUE (matricula);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_pkey PRIMARY KEY (id);


--
-- Name: laudo_downloads laudo_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_pkey PRIMARY KEY (id);


--
-- Name: laudo_generation_jobs laudo_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: laudos laudos_lote_emissor_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);


--
-- Name: laudos laudos_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);


--
-- Name: laudos laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_pkey PRIMARY KEY (id);


--
-- Name: logs_admin logs_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_admin
    ADD CONSTRAINT logs_admin_pkey PRIMARY KEY (id);


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_numero_ordem_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique UNIQUE (empresa_id, numero_ordem);


--
-- Name: lotes_avaliacao lotes_avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_pkey PRIMARY KEY (id);


--
-- Name: mfa_codes mfa_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT mfa_codes_pkey PRIMARY KEY (id);


--
-- Name: migration_guidelines migration_guidelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_guidelines
    ADD CONSTRAINT migration_guidelines_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_admin notificacoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_traducoes notificacoes_traducoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT notificacoes_traducoes_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_pkey PRIMARY KEY (id);


--
-- Name: payment_links payment_links_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_token_key UNIQUE (token);


--
-- Name: pdf_jobs pdf_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_pkey PRIMARY KEY (id);


--
-- Name: pdf_jobs pdf_jobs_recibo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_key UNIQUE (recibo_id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: planos planos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT planos_pkey PRIMARY KEY (id);


--
-- Name: policy_expression_backups policy_expression_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_expression_backups
    ADD CONSTRAINT policy_expression_backups_pkey PRIMARY KEY (id);


--
-- Name: questao_condicoes questao_condicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questao_condicoes
    ADD CONSTRAINT questao_condicoes_pkey PRIMARY KEY (id);


--
-- Name: recibos recibos_numero_recibo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_numero_recibo_key UNIQUE (numero_recibo);


--
-- Name: recibos recibos_pagamento_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pagamento_id_unique UNIQUE (pagamento_id);


--
-- Name: CONSTRAINT recibos_pagamento_id_unique ON recibos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT recibos_pagamento_id_unique ON public.recibos IS 'Garante que cada pagamento tem no máximo um recibo ativo (idempotência)';


--
-- Name: recibos recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pkey PRIMARY KEY (id);


--
-- Name: relatorio_templates relatorio_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relatorio_templates
    ADD CONSTRAINT relatorio_templates_pkey PRIMARY KEY (id);


--
-- Name: respostas respostas_avaliacao_id_grupo_item_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item);


--
-- Name: respostas respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_pkey PRIMARY KEY (id);


--
-- Name: resultados resultados_avaliacao_id_grupo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo);


--
-- Name: resultados resultados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: session_logs session_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_pkey PRIMARY KEY (id);


--
-- Name: templates_contrato templates_contrato_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_nome_key UNIQUE (nome);


--
-- Name: templates_contrato templates_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_token_key UNIQUE (token);


--
-- Name: clinica_configuracoes unique_clinica_config; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT unique_clinica_config UNIQUE (clinica_id);


--
-- Name: notificacoes_traducoes unique_traducao; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT unique_traducao UNIQUE (chave_traducao, idioma);


--
-- Name: usuarios usuarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cpf_key UNIQUE (cpf);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: clinicas_cnpj_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clinicas_cnpj_unique ON public.clinicas USING btree (cnpj);


--
-- Name: clinicas_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clinicas_email_unique ON public.clinicas USING btree (email);


--
-- Name: clinicas_responsavel_cpf_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clinicas_responsavel_cpf_unique ON public.clinicas USING btree (responsavel_cpf);


--
-- Name: entidades_senhas_entidade_cpf_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX entidades_senhas_entidade_cpf_unique ON public.entidades_senhas USING btree (entidade_id, cpf);


--
-- Name: funcionarios_clinicas_unique_func_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX funcionarios_clinicas_unique_func_empresa ON public.funcionarios_clinicas USING btree (funcionario_id, empresa_id);


--
-- Name: idx_analise_estatistica_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analise_estatistica_avaliacao ON public.analise_estatistica USING btree (avaliacao_id);


--
-- Name: idx_audit_denied_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_denied_created_at ON public.audit_access_denied USING btree (created_at DESC);


--
-- Name: idx_audit_denied_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_denied_resource ON public.audit_access_denied USING btree (resource);


--
-- Name: idx_audit_denied_user_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_denied_user_cpf ON public.audit_access_denied USING btree (user_cpf);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_clinica_id ON public.audit_logs USING btree (clinica_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entidade_id ON public.audit_logs USING btree (entidade_id);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource);


--
-- Name: idx_audit_logs_system_actions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_system_actions ON public.audit_logs USING btree (created_at DESC) WHERE (user_cpf IS NULL);


--
-- Name: idx_audit_logs_user_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_cpf ON public.audit_logs USING btree (user_cpf);


--
-- Name: idx_auditoria_acao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_acao ON public.auditoria USING btree (acao);


--
-- Name: idx_auditoria_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_criado_em ON public.auditoria USING btree (criado_em);


--
-- Name: idx_auditoria_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_entidade ON public.auditoria USING btree (entidade_tipo, entidade_id);


--
-- Name: idx_auditoria_geral_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_geral_cpf ON public.auditoria_geral USING btree (cpf_responsavel);


--
-- Name: idx_auditoria_geral_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_geral_criado_em ON public.auditoria_geral USING btree (criado_em DESC);


--
-- Name: idx_auditoria_geral_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_geral_tabela ON public.auditoria_geral USING btree (tabela_afetada);


--
-- Name: idx_auditoria_laudos_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_criado ON public.auditoria_laudos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_laudos_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_lote ON public.auditoria_laudos USING btree (lote_id);


--
-- Name: idx_auditoria_laudos_lote_acao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_lote_acao ON public.auditoria_laudos USING btree (lote_id, acao, criado_em DESC);


--
-- Name: INDEX idx_auditoria_laudos_lote_acao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_acao IS 'Índice principal para queries que filtram por lote e ação específica.';


--
-- Name: idx_auditoria_laudos_lote_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_lote_history ON public.auditoria_laudos USING btree (lote_id, criado_em DESC) INCLUDE (acao, status, emissor_cpf, observacoes);


--
-- Name: INDEX idx_auditoria_laudos_lote_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_history IS 'Otimiza busca de histórico completo de auditoria por lote (include para evitar table lookup).';


--
-- Name: idx_auditoria_laudos_pending_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_pending_queue ON public.auditoria_laudos USING btree (lote_id, status, acao, criado_em DESC) WHERE ((status)::text = ANY ((ARRAY['pendente'::character varying, 'reprocessando'::character varying, 'erro'::character varying])::text[]));


--
-- Name: INDEX idx_auditoria_laudos_pending_queue; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_auditoria_laudos_pending_queue IS 'Acelera busca de solicitações pendentes/erro na fila de processamento.';


--
-- Name: idx_auditoria_laudos_solicitado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_solicitado_por ON public.auditoria_laudos USING btree (solicitado_por);


--
-- Name: idx_auditoria_laudos_solicitante_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_solicitante_criado ON public.auditoria_laudos USING btree (emissor_cpf, criado_em DESC) WHERE ((acao)::text = 'emissao_solicitada'::text);


--
-- Name: idx_auditoria_laudos_unique_solicitation; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_auditoria_laudos_unique_solicitation ON public.auditoria_laudos USING btree (lote_id, acao, solicitado_por) WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY ((ARRAY['pendente'::character varying, 'reprocessando'::character varying])::text[])));


--
-- Name: INDEX idx_auditoria_laudos_unique_solicitation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_auditoria_laudos_unique_solicitation IS 'Previne solicitações duplicadas de emissão no mesmo lote enquanto status estiver pendente/reprocessando.';


--
-- Name: idx_auditoria_recibos_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_recibos_criado ON public.auditoria_recibos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_recibos_recibo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_recibos_recibo ON public.auditoria_recibos USING btree (recibo_id);


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_cpf);


--
-- Name: idx_avaliacao_resets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacao_resets_created_at ON public.avaliacao_resets USING btree (created_at DESC);


--
-- Name: idx_avaliacao_resets_lote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacao_resets_lote_id ON public.avaliacao_resets USING btree (lote_id);


--
-- Name: idx_avaliacao_resets_requested_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacao_resets_requested_by ON public.avaliacao_resets USING btree (requested_by_user_id);


--
-- Name: idx_avaliacao_resets_unique_per_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_avaliacao_resets_unique_per_lote ON public.avaliacao_resets USING btree (avaliacao_id, lote_id);


--
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_funcionario_cpf ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_funcionario_status ON public.avaliacoes USING btree (funcionario_cpf, status);


--
-- Name: idx_avaliacoes_inativada_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_inativada_em ON public.avaliacoes USING btree (inativada_em) WHERE (inativada_em IS NOT NULL);


--
-- Name: idx_avaliacoes_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_lote ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_lote_id ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_lote_status ON public.avaliacoes USING btree (lote_id, status) WHERE ((status)::text <> 'inativada'::text);


--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);


--
-- Name: idx_clinica_configuracoes_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinica_configuracoes_clinica ON public.clinica_configuracoes USING btree (clinica_id);


--
-- Name: idx_clinicas_aprovado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_aprovado_em ON public.clinicas USING btree (aprovado_em) WHERE (aprovado_em IS NOT NULL);


--
-- Name: idx_clinicas_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_ativa ON public.clinicas USING btree (ativa);


--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_cnpj ON public.clinicas USING btree (cnpj);


--
-- Name: idx_clinicas_contrato_aceito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_contrato_aceito ON public.clinicas USING btree (contrato_aceito);


--
-- Name: idx_clinicas_data_liberacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_data_liberacao ON public.clinicas USING btree (data_liberacao_login);


--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);


--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);


--
-- Name: idx_clinicas_senhas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_senhas_clinica ON public.clinicas_senhas USING btree (clinica_id);


--
-- Name: idx_clinicas_senhas_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_senhas_clinica_id ON public.clinicas_senhas USING btree (clinica_id);


--
-- Name: idx_clinicas_senhas_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_senhas_cpf ON public.clinicas_senhas USING btree (cpf);


--
-- Name: idx_clinicas_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_status ON public.clinicas USING btree (status);


--
-- Name: idx_clinicas_status_data_cadastro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_status_data_cadastro ON public.clinicas USING btree (status, criado_em DESC);


--
-- Name: idx_contratacao_personalizada_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratacao_personalizada_entidade_id ON public.contratacao_personalizada USING btree (entidade_id);


--
-- Name: idx_contratacao_personalizada_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratacao_personalizada_token ON public.contratacao_personalizada USING btree (payment_link_token);


--
-- Name: idx_contratos_data_pagamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_data_pagamento ON public.contratos_planos USING btree (data_pagamento);


--
-- Name: idx_contratos_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_entidade_id ON public.contratos USING btree (entidade_id);


--
-- Name: idx_contratos_modalidade_pagamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_modalidade_pagamento ON public.contratos_planos USING btree (modalidade_pagamento);


--
-- Name: idx_contratos_numero_funcionarios; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_numero_funcionarios ON public.contratos USING btree (numero_funcionarios);


--
-- Name: idx_contratos_planos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_planos_clinica ON public.contratos_planos USING btree (clinica_id);


--
-- Name: idx_contratos_planos_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_planos_entidade_id ON public.contratos_planos USING btree (entidade_id);


--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);


--
-- Name: idx_contratos_tipo_pagamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_tipo_pagamento ON public.contratos_planos USING btree (tipo_pagamento);


--
-- Name: idx_contratos_tipo_tomador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_tipo_tomador ON public.contratos USING btree (tipo_tomador);


--
-- Name: idx_contratos_tomador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_tomador_id ON public.contratos USING btree (tomador_id);


--
-- Name: idx_contratos_valor_personalizado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_valor_personalizado ON public.contratos USING btree (valor_personalizado);


--
-- Name: idx_emissao_queue_proxima_execucao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emissao_queue_proxima_execucao ON public.emissao_queue USING btree (proxima_execucao);


--
-- Name: idx_empresas_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_ativa ON public.empresas_clientes USING btree (ativa);


--
-- Name: idx_empresas_clientes_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_clientes_clinica_id ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_clinica ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_clinica_ativa ON public.empresas_clientes USING btree (clinica_id) WHERE (ativa = true);


--
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_empresas_cnpj ON public.empresas_clientes USING btree (cnpj);


--
-- Name: idx_entidades_senhas_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entidades_senhas_entidade ON public.entidades_senhas USING btree (entidade_id);


--
-- Name: idx_entidades_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entidades_tipo ON public.entidades USING btree (tipo);


--
-- Name: idx_fk_migration_audit_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fk_migration_audit_status ON public.fk_migration_audit USING btree (status);


--
-- Name: idx_fk_migration_audit_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fk_migration_audit_tabela ON public.fk_migration_audit USING btree (tabela);


--
-- Name: idx_func_clinicas_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_ativo ON public.funcionarios_clinicas USING btree (ativo);


--
-- Name: idx_func_clinicas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_clinica ON public.funcionarios_clinicas USING btree (clinica_id);


--
-- Name: idx_func_clinicas_clinica_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_clinica_ativo ON public.funcionarios_clinicas USING btree (clinica_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_clinica_empresa_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_clinica_empresa_ativo ON public.funcionarios_clinicas USING btree (clinica_id, empresa_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_empresa ON public.funcionarios_clinicas USING btree (empresa_id);


--
-- Name: idx_func_clinicas_empresa_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_empresa_ativo ON public.funcionarios_clinicas USING btree (empresa_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_clinicas_funcionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_clinicas_funcionario ON public.funcionarios_clinicas USING btree (funcionario_id);


--
-- Name: idx_func_entidades_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_entidades_ativo ON public.funcionarios_entidades USING btree (ativo);


--
-- Name: idx_func_entidades_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_entidades_entidade ON public.funcionarios_entidades USING btree (entidade_id);


--
-- Name: idx_func_entidades_entidade_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_entidades_entidade_ativo ON public.funcionarios_entidades USING btree (entidade_id, ativo) WHERE (ativo = true);


--
-- Name: idx_func_entidades_funcionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_func_entidades_funcionario ON public.funcionarios_entidades USING btree (funcionario_id);


--
-- Name: idx_funcionarios_cpf_perfil_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_cpf_perfil_ativo ON public.funcionarios USING btree (cpf, perfil, ativo);


--
-- Name: idx_funcionarios_data_ultimo_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_data_ultimo_lote ON public.funcionarios USING btree (data_ultimo_lote) WHERE (data_ultimo_lote IS NOT NULL);


--
-- Name: idx_funcionarios_indice_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_indice_avaliacao ON public.funcionarios USING btree (indice_avaliacao);


--
-- Name: idx_funcionarios_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_matricula ON public.funcionarios USING btree (matricula);


--
-- Name: idx_funcionarios_nivel_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_nivel_cargo ON public.funcionarios USING btree (nivel_cargo);


--
-- Name: idx_funcionarios_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_nome ON public.funcionarios USING btree (nome);


--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);


--
-- Name: idx_funcionarios_ultima_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_ultima_avaliacao ON public.funcionarios USING btree (ultima_avaliacao_id) WHERE (ultima_avaliacao_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_ultima_avaliacao_status ON public.funcionarios USING btree (ultima_avaliacao_status) WHERE (ultima_avaliacao_status IS NOT NULL);


--
-- Name: idx_laudo_arquivos_remotos_laudo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_arquivos_remotos_laudo_id ON public.laudo_arquivos_remotos USING btree (laudo_id);


--
-- Name: idx_laudo_arquivos_remotos_principal_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_laudo_arquivos_remotos_principal_unique ON public.laudo_arquivos_remotos USING btree (laudo_id) WHERE ((tipo)::text = 'principal'::text);


--
-- Name: idx_laudo_arquivos_remotos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_arquivos_remotos_tipo ON public.laudo_arquivos_remotos USING btree (laudo_id, tipo);


--
-- Name: idx_laudo_downloads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_downloads_created_at ON public.laudo_downloads USING btree (created_at);


--
-- Name: idx_laudo_downloads_laudo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_downloads_laudo_id ON public.laudo_downloads USING btree (laudo_id);


--
-- Name: idx_laudo_downloads_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_downloads_usuario ON public.laudo_downloads USING btree (usuario_cpf);


--
-- Name: idx_laudo_jobs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_jobs_created_at ON public.laudo_generation_jobs USING btree (created_at);


--
-- Name: idx_laudo_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudo_jobs_status ON public.laudo_generation_jobs USING btree (status);


--
-- Name: idx_laudos_arquivo_remoto_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_arquivo_remoto_key ON public.laudos USING btree (arquivo_remoto_key);


--
-- Name: idx_laudos_arquivo_remoto_sync; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_arquivo_remoto_sync ON public.laudos USING btree (arquivo_remoto_key, arquivo_remoto_uploaded_at) WHERE (arquivo_remoto_key IS NOT NULL);


--
-- Name: INDEX idx_laudos_arquivo_remoto_sync; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_laudos_arquivo_remoto_sync IS 'Índice para consultas de laudos sincronizados com storage remoto';


--
-- Name: idx_laudos_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_criado_em ON public.laudos USING btree (criado_em DESC);


--
-- Name: idx_laudos_emissor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_emissor ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emissor_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_emissor_cpf ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emissor_cpf_emitido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_emissor_cpf_emitido ON public.laudos USING btree (emissor_cpf, emitido_em DESC);


--
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_laudos_enviado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_enviado_em ON public.laudos USING btree (enviado_em DESC);


--
-- Name: idx_laudos_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_hash ON public.laudos USING btree (hash_pdf);


--
-- Name: idx_laudos_hash_pdf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_hash_pdf ON public.laudos USING btree (hash_pdf) WHERE (hash_pdf IS NOT NULL);


--
-- Name: idx_laudos_id_lote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_id_lote_id ON public.laudos USING btree (id, lote_id);


--
-- Name: idx_laudos_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_job_id ON public.laudos USING btree (job_id);


--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_lote_status ON public.laudos USING btree (lote_id, status);


--
-- Name: idx_laudos_relatorio_individual; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_relatorio_individual ON public.laudos USING btree (relatorio_individual) WHERE (relatorio_individual IS NOT NULL);


--
-- Name: idx_laudos_relatorio_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_relatorio_lote ON public.laudos USING btree (relatorio_lote) WHERE (relatorio_lote IS NOT NULL);


--
-- Name: idx_laudos_relatorio_setor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_relatorio_setor ON public.laudos USING btree (relatorio_setor) WHERE (relatorio_setor IS NOT NULL);


--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);


--
-- Name: idx_logs_admin_acao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_admin_acao ON public.logs_admin USING btree (acao);


--
-- Name: idx_logs_admin_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_admin_cpf ON public.logs_admin USING btree (admin_cpf);


--
-- Name: idx_logs_admin_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_admin_criado ON public.logs_admin USING btree (criado_em DESC);


--
-- Name: idx_logs_admin_entidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_admin_entidade ON public.logs_admin USING btree (entidade_tipo, entidade_id);


--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('finalizado'::character varying)::text]));


--
-- Name: idx_lotes_avaliacao_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_avaliacao_emitido_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_emitido_em ON public.lotes_avaliacao USING btree (id) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_empresa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_avaliacao_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_entidade_id ON public.lotes_avaliacao USING btree (entidade_id);


--
-- Name: idx_lotes_avaliacao_enviado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_enviado_em ON public.lotes_avaliacao USING btree (id) WHERE (enviado_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);


--
-- Name: idx_lotes_avaliacao_status_emitido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_status_emitido ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: idx_lotes_emissao_em_andamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_emissao_em_andamento ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_em_andamento'::text);


--
-- Name: idx_lotes_emissao_solicitada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_emissao_solicitada ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_emissao_solicitada_liberado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_emissao_solicitada_liberado ON public.lotes_avaliacao USING btree (liberado_em DESC) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_empresa_status_liberado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_empresa_status_liberado ON public.lotes_avaliacao USING btree (empresa_id, status, liberado_em DESC);


--
-- Name: INDEX idx_lotes_empresa_status_liberado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_lotes_empresa_status_liberado IS 'Otimiza queries de relatório por empresa e status';


--
-- Name: idx_lotes_finalizado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_finalizado_em ON public.lotes_avaliacao USING btree (finalizado_em DESC);


--
-- Name: idx_lotes_laudo_enviado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_laudo_enviado ON public.lotes_avaliacao USING btree (laudo_enviado_em) WHERE (laudo_enviado_em IS NOT NULL);


--
-- Name: idx_lotes_liberado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_liberado_em ON public.lotes_avaliacao USING btree (liberado_em DESC);


--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);


--
-- Name: idx_lotes_pronto_emissao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_pronto_emissao ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);


--
-- Name: idx_lotes_status_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_status_criado ON public.lotes_avaliacao USING btree (status, criado_em DESC) WHERE ((status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'emissao_solicitada'::character varying])::text[]));


--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);


--
-- Name: idx_notificacoes_admin_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_clinica_id ON public.notificacoes_admin USING btree (clinica_id);


--
-- Name: idx_notificacoes_admin_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_criado ON public.notificacoes_admin USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);


--
-- Name: idx_notificacoes_admin_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_entidade_id ON public.notificacoes_admin USING btree (entidade_id);


--
-- Name: idx_notificacoes_admin_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_lida ON public.notificacoes_admin USING btree (lida);


--
-- Name: idx_notificacoes_admin_resolvida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_resolvida ON public.notificacoes_admin USING btree (resolvida);


--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);


--
-- Name: idx_notificacoes_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_clinica_id ON public.notificacoes USING btree (clinica_id);


--
-- Name: idx_notificacoes_contratacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_contratacao ON public.notificacoes USING btree (contratacao_personalizada_id);


--
-- Name: idx_notificacoes_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_criado_em ON public.notificacoes USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_destinatario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_destinatario ON public.notificacoes USING btree (destinatario_cpf, destinatario_tipo);


--
-- Name: idx_notificacoes_destinatario_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_destinatario_cpf ON public.notificacoes USING btree (destinatario_cpf);


--
-- Name: idx_notificacoes_nao_lidas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_nao_lidas ON public.notificacoes USING btree (destinatario_cpf) WHERE (lida = false);


--
-- Name: idx_notificacoes_resolvida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_resolvida ON public.notificacoes USING btree (resolvida) WHERE (resolvida = false);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_notificacoes_tipo_resolvida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo_resolvida ON public.notificacoes USING btree (tipo, resolvida);


--
-- Name: idx_notificacoes_traducoes_chave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_traducoes_chave ON public.notificacoes_traducoes USING btree (chave_traducao, idioma);


--
-- Name: idx_pagamentos_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_clinica_id ON public.pagamentos USING btree (clinica_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_entidade_id ON public.pagamentos USING btree (entidade_id);


--
-- Name: idx_pagamentos_external_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_external_transaction_id ON public.pagamentos USING btree (external_transaction_id);


--
-- Name: idx_pagamentos_idempotency_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_idempotency_key ON public.pagamentos USING btree (idempotency_key);


--
-- Name: idx_pagamentos_parcelas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_parcelas ON public.pagamentos USING btree (numero_parcelas) WHERE (numero_parcelas > 1);


--
-- Name: idx_pagamentos_provider_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_provider_event_id ON public.pagamentos USING btree (provider_event_id);


--
-- Name: idx_pagamentos_recibo_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_recibo_numero ON public.pagamentos USING btree (recibo_numero);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: idx_pagamentos_tomador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_tomador_id ON public.pagamentos USING btree (tomador_id);


--
-- Name: idx_payment_links_contrato_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_links_contrato_id ON public.payment_links USING btree (contrato_id);


--
-- Name: idx_payment_links_usado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_links_usado ON public.payment_links USING btree (usado) WHERE (usado = false);


--
-- Name: idx_pdf_jobs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pdf_jobs_created ON public.pdf_jobs USING btree (created_at);


--
-- Name: idx_pdf_jobs_recibo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pdf_jobs_recibo ON public.pdf_jobs USING btree (recibo_id);


--
-- Name: idx_pdf_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pdf_jobs_status ON public.pdf_jobs USING btree (status) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying])::text[]));


--
-- Name: idx_questao_condicoes_dependente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questao_condicoes_dependente ON public.questao_condicoes USING btree (questao_dependente);


--
-- Name: idx_questao_condicoes_questao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questao_condicoes_questao ON public.questao_condicoes USING btree (questao_id);


--
-- Name: idx_recibos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_ativo ON public.recibos USING btree (ativo);


--
-- Name: idx_recibos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_clinica ON public.recibos USING btree (clinica_id);


--
-- Name: idx_recibos_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_clinica_id ON public.recibos USING btree (clinica_id);


--
-- Name: idx_recibos_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_contrato ON public.recibos USING btree (contrato_id);


--
-- Name: idx_recibos_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_criado_em ON public.recibos USING btree (criado_em);


--
-- Name: idx_recibos_emitido_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_emitido_por ON public.recibos USING btree (emitido_por);


--
-- Name: idx_recibos_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_entidade_id ON public.recibos USING btree (entidade_id);


--
-- Name: idx_recibos_hash_pdf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_hash_pdf ON public.recibos USING btree (hash_pdf);


--
-- Name: idx_recibos_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_numero ON public.recibos USING btree (numero_recibo);


--
-- Name: idx_recibos_pagamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_pagamento ON public.recibos USING btree (pagamento_id);


--
-- Name: idx_recibos_pagamento_parcela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_pagamento_parcela ON public.recibos USING btree (pagamento_id, parcela_numero);


--
-- Name: idx_recibos_parcela_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_parcela_numero ON public.recibos USING btree (parcela_numero);


--
-- Name: idx_recibos_vigencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_vigencia ON public.recibos USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_respostas_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respostas_avaliacao ON public.respostas USING btree (avaliacao_id);


--
-- Name: idx_resultados_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resultados_avaliacao ON public.resultados USING btree (avaliacao_id);


--
-- Name: idx_resultados_avaliacao_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resultados_avaliacao_grupo ON public.resultados USING btree (avaliacao_id, grupo);


--
-- Name: idx_resultados_grupo_dominio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resultados_grupo_dominio ON public.resultados USING btree (grupo, dominio);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: idx_session_logs_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_clinica ON public.session_logs USING btree (clinica_id);


--
-- Name: idx_session_logs_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_cpf ON public.session_logs USING btree (cpf);


--
-- Name: idx_session_logs_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_empresa ON public.session_logs USING btree (empresa_id);


--
-- Name: idx_session_logs_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_login ON public.session_logs USING btree (login_timestamp DESC);


--
-- Name: idx_session_logs_logout; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_logout ON public.session_logs USING btree (logout_timestamp DESC);


--
-- Name: idx_session_logs_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_perfil ON public.session_logs USING btree (perfil);


--
-- Name: idx_templates_contrato_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_contrato_ativo ON public.templates_contrato USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_templates_contrato_padrao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_contrato_padrao ON public.templates_contrato USING btree (tipo_template, padrao) WHERE (padrao = true);


--
-- Name: idx_templates_contrato_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_contrato_tipo ON public.templates_contrato USING btree (tipo_template);


--
-- Name: idx_tokens_retomada_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_retomada_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);


--
-- Name: idx_tokens_retomada_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_retomada_expiracao ON public.tokens_retomada_pagamento USING btree (expira_em);


--
-- Name: idx_tokens_retomada_pagamento_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_retomada_pagamento_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);


--
-- Name: idx_tokens_retomada_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_retomada_token ON public.tokens_retomada_pagamento USING btree (token);


--
-- Name: idx_tokens_retomada_usado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tokens_retomada_usado ON public.tokens_retomada_pagamento USING btree (usado);


--
-- Name: idx_usuarios_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_ativo ON public.usuarios USING btree (ativo);


--
-- Name: idx_usuarios_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_clinica_id ON public.usuarios USING btree (clinica_id) WHERE (clinica_id IS NOT NULL);


--
-- Name: idx_usuarios_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_cpf ON public.usuarios USING btree (cpf);


--
-- Name: idx_usuarios_entidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_entidade_id ON public.usuarios USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);


--
-- Name: idx_usuarios_tipo_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_tipo_ativo ON public.usuarios USING btree (tipo_usuario, ativo);


--
-- Name: idx_usuarios_tipo_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_tipo_usuario ON public.usuarios USING btree (tipo_usuario);


--
-- Name: avaliacoes audit_avaliacoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_avaliacoes AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: empresas_clientes audit_empresas_clientes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_empresas_clientes AFTER INSERT OR DELETE OR UPDATE ON public.empresas_clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: funcionarios audit_funcionarios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_funcionarios AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: laudos audit_laudos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_laudos AFTER INSERT OR DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.laudos DISABLE TRIGGER audit_laudos;


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_change();


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();

ALTER TABLE public.laudos DISABLE TRIGGER enforce_laudo_immutability;


--
-- Name: avaliacoes prevent_avaliacao_delete_after_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_avaliacao_delete_after_emission BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_delete_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER prevent_avaliacao_delete_after_emission ON public.avaliacoes IS 'Bloqueia exclusão de avaliação quando laudo já foi emitido';


--
-- Name: avaliacoes prevent_avaliacao_update_after_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_avaliacao_update_after_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_update_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER prevent_avaliacao_update_after_emission ON public.avaliacoes IS 'Bloqueia atualização de avaliação quando laudo já foi emitido';


--
-- Name: lotes_avaliacao prevent_lote_update_after_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER prevent_lote_update_after_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_status_change_after_emission();


--
-- Name: TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER prevent_lote_update_after_emission ON public.lotes_avaliacao IS 'Bloqueia mudanças indevidas no lote após emissão do laudo';


--
-- Name: laudos trg_audit_laudo_creation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_laudo_creation AFTER INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_laudo_creation();

ALTER TABLE public.laudos DISABLE TRIGGER trg_audit_laudo_creation;


--
-- Name: lotes_avaliacao trg_audit_lote_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_lote_status AFTER UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_status_change();


--
-- Name: clinicas trg_clinicas_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clinicas_criar_usuario_apos_aprovacao AFTER UPDATE ON public.clinicas FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();


--
-- Name: clinicas_senhas trg_clinicas_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clinicas_senhas_updated_at BEFORE UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.update_clinicas_senhas_updated_at();

ALTER TABLE public.clinicas_senhas DISABLE TRIGGER trg_clinicas_senhas_updated_at;


--
-- Name: entidades trg_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_criar_usuario_apos_aprovacao AFTER UPDATE ON public.entidades FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();


--
-- Name: TRIGGER trg_criar_usuario_apos_aprovacao ON entidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_criar_usuario_apos_aprovacao ON public.entidades IS 'Cria automaticamente usuario e senhas quando entidade e aprovada';


--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();

ALTER TABLE public.laudos DISABLE TRIGGER trg_enforce_laudo_id_equals_lote;


--
-- Name: recibos trg_gerar_numero_recibo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_numero_recibo BEFORE INSERT ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_gerar_numero_recibo();


--
-- Name: laudos trg_immutable_laudo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_immutable_laudo BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_update_laudo_enviado();

ALTER TABLE public.laudos DISABLE TRIGGER trg_immutable_laudo;


--
-- Name: lotes_avaliacao trg_immutable_lote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_immutable_lote BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_update_finalized_lote();


--
-- Name: laudo_generation_jobs trg_laudo_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_laudo_jobs_updated_at BEFORE UPDATE ON public.laudo_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();


--
-- Name: notificacoes_admin trg_notificacoes_admin_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notificacoes_admin_updated BEFORE UPDATE ON public.notificacoes_admin FOR EACH ROW EXECUTE FUNCTION public.atualizar_notificacao_admin_timestamp();


--
-- Name: pdf_jobs trg_pdf_jobs_update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pdf_jobs_update_timestamp BEFORE UPDATE ON public.pdf_jobs FOR EACH ROW EXECUTE FUNCTION public.update_pdf_jobs_timestamp();


--
-- Name: funcionarios trg_prevent_gestor_emissor; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_gestor_emissor BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.prevent_gestor_being_emissor();


--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();

ALTER TABLE public.laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change;


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();


--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();


--
-- Name: clinicas_senhas trg_protect_senhas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_senhas BEFORE INSERT OR DELETE OR UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_clinicas_senhas();

ALTER TABLE public.clinicas_senhas DISABLE TRIGGER trg_protect_senhas;


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: TRIGGER trg_recalc_lote_on_avaliacao_update ON avaliacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_update ON public.avaliacoes IS 'Atualiza status do lote quando avaliação muda de status.
Sistema é 100% MANUAL - emissor deve gerar laudos explicitamente.';


--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: recibos trg_recibos_criar_pdf_job; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recibos_criar_pdf_job AFTER INSERT OR UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_criar_pdf_job();


--
-- Name: lotes_avaliacao trg_registrar_solicitacao_emissao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registrar_solicitacao_emissao AFTER UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_solicitacao_emissao();


--
-- Name: funcionarios trg_reject_prohibited_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reject_prohibited_roles BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.trg_reject_prohibited_roles_func();


--
-- Name: lotes_avaliacao trg_reservar_id_laudo_on_lote_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert AFTER INSERT ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_reservar_id_laudo_on_lote_insert();


--
-- Name: respostas trg_respostas_set_questao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_respostas_set_questao BEFORE INSERT OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.set_questao_from_item();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION public.update_usuarios_updated_at();


--
-- Name: laudos trg_validar_laudo_emitido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_laudo_emitido BEFORE INSERT OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_laudo_emitido();


--
-- Name: TRIGGER trg_validar_laudo_emitido ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_validar_laudo_emitido ON public.laudos IS 'Garante que laudos sÃ³ sejam marcados como emitido quando PDF fÃ­sico foi gerado (hash existe)';


--
-- Name: contratos_planos trg_validar_parcelas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_parcelas BEFORE INSERT OR UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.validar_parcelas_json();


--
-- Name: avaliacoes trg_validar_status_avaliacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_status_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.validar_status_avaliacao();


--
-- Name: lotes_avaliacao trg_validar_transicao_status_lote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validar_transicao_status_lote BEFORE UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_validar_transicao_status_lote();


--
-- Name: TRIGGER trg_validar_transicao_status_lote ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_validar_transicao_status_lote ON public.lotes_avaliacao IS 'Trigger que valida transições de status antes de atualizar o registro';


--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_empresa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_funcionario_clinica_empresa BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_empresa();


--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_tipo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_funcionario_clinica_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_tipo();


--
-- Name: funcionarios_entidades trg_validate_funcionario_entidade_tipo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_funcionario_entidade_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_entidade_tipo();


--
-- Name: clinica_configuracoes trigger_atualizar_timestamp_configuracoes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes BEFORE UPDATE ON public.clinica_configuracoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_configuracoes();


--
-- Name: templates_contrato trigger_garantir_template_padrao_unico; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_garantir_template_padrao_unico BEFORE INSERT OR UPDATE ON public.templates_contrato FOR EACH ROW WHEN ((new.padrao = true)) EXECUTE FUNCTION public.garantir_template_padrao_unico();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();


--
-- Name: funcionarios trigger_registrar_inativacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_registrar_inativacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((old.ativo IS DISTINCT FROM new.ativo)) EXECUTE FUNCTION public.registrar_inativacao_funcionario();


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();


--
-- Name: funcionarios_clinicas trigger_update_funcionarios_clinicas_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_funcionarios_clinicas_timestamp BEFORE UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_clinicas_timestamp();


--
-- Name: funcionarios_entidades trigger_update_funcionarios_entidades_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_funcionarios_entidades_timestamp BEFORE UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_entidades_timestamp();


--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: auditoria_recibos auditoria_recibos_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_funcionario_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE SET NULL;


--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: clinicas clinicas_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos_planos contratos_planos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: emissao_queue emissao_queue_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: fila_emissao fila_emissao_lote_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey1 FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: auditoria_laudos fk_auditoria_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT fk_auditoria_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: entidades_senhas fk_entidades_senhas_entidade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT fk_entidades_senhas_entidade FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas fk_funcionarios_clinicas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT fk_funcionarios_clinicas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: laudos fk_laudos_emissor_cpf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_emissor_cpf FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: CONSTRAINT fk_laudos_emissor_cpf ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON public.laudos IS 'Garante que emissor existe na tabela funcionarios. RESTRICT previne deleção de emissor com laudos.';


--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos fk_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT fk_laudos_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT fk_laudos_lote_id ON public.laudos IS 'Garante integridade referencial: todo laudo deve ter um lote válido';


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: notificacoes_admin fk_notificacoes_contrato; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin fk_notificacoes_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contrato; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE RESTRICT;


--
-- Name: respostas fk_respostas_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT fk_respostas_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados fk_resultados_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT fk_resultados_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: tokens_retomada_pagamento fk_tokens_contrato; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_tokens_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas funcionarios_clinicas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: funcionarios_clinicas funcionarios_clinicas_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: funcionarios_entidades funcionarios_entidades_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_downloads laudo_downloads_arquivo_remoto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_arquivo_remoto_id_fkey FOREIGN KEY (arquivo_remoto_id) REFERENCES public.laudo_arquivos_remotos(id) ON DELETE SET NULL;


--
-- Name: laudo_downloads laudo_downloads_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_generation_jobs laudo_generation_jobs_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos laudos_emissor_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_emissor_cpf_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey1 FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin notificacoes_admin_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;


--
-- Name: payment_links payment_links_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_links
    ADD CONSTRAINT payment_links_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: pdf_jobs pdf_jobs_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;


--
-- Name: recibos recibos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: respostas respostas_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados resultados_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_logs_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_admin_all ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY audit_logs_admin_all ON audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY audit_logs_admin_all ON public.audit_logs IS 'Administradores podem ver todos os logs de auditoria';


--
-- Name: audit_logs audit_logs_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_admin_select ON public.audit_logs FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: audit_logs audit_logs_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_own_select ON public.audit_logs FOR SELECT USING (((user_cpf)::text = public.current_user_cpf()));


--
-- Name: POLICY audit_logs_own_select ON audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY audit_logs_own_select ON public.audit_logs IS 'Usuários podem ver apenas seus próprios logs';


--
-- Name: audit_logs audit_logs_system_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_logs_system_insert ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: POLICY audit_logs_system_insert ON audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY audit_logs_system_insert ON public.audit_logs IS 'Apenas sistema pode inserir logs via triggers';


--
-- Name: avaliacao_resets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avaliacao_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacao_resets avaliacao_resets_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacao_resets_delete_policy ON public.avaliacao_resets FOR DELETE USING (false);


--
-- Name: avaliacao_resets avaliacao_resets_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor_entidade'::text, 'admin'::text]))));


--
-- Name: avaliacao_resets avaliacao_resets_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacao_resets_update_policy ON public.avaliacao_resets FOR UPDATE USING (false);


--
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: avaliacoes avaliacoes_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT USING ((((funcionario_cpf)::text = public.current_user_cpf()) AND (NOT public.current_user_is_gestor())));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_admin_delete ON public.empresas_clientes FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_admin_insert ON public.empresas_clientes FOR INSERT WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_admin_select ON public.empresas_clientes FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_admin_update ON public.empresas_clientes FOR UPDATE USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_block_admin ON public.empresas_clientes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: empresas_clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id())));


--
-- Name: entidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

--
-- Name: fila_emissao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fila_emissao ENABLE ROW LEVEL SECURITY;

--
-- Name: fila_emissao fila_emissao_admin_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fila_emissao_admin_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY fila_emissao_admin_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY fila_emissao_admin_view ON public.fila_emissao IS 'Admin pode visualizar toda fila para auditoria (SELECT)';


--
-- Name: fila_emissao fila_emissao_emissor_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fila_emissao_emissor_update ON public.fila_emissao FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_update ON fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY fila_emissao_emissor_update ON public.fila_emissao IS 'Emissor pode atualizar tentativas e erros (UPDATE)';


--
-- Name: fila_emissao fila_emissao_emissor_view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fila_emissao_emissor_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY fila_emissao_emissor_view ON public.fila_emissao IS 'Emissor pode visualizar fila de trabalho (SELECT)';


--
-- Name: fila_emissao fila_emissao_system_bypass; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fila_emissao_system_bypass ON public.fila_emissao USING ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text)) WITH CHECK ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text));


--
-- Name: POLICY fila_emissao_system_bypass ON fila_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY fila_emissao_system_bypass ON public.fila_emissao IS 'Permite acesso total quando app.system_bypass = true (APIs internas)';


--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios funcionarios_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_admin_delete ON public.funcionarios FOR DELETE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[])) AND (ativo = false)));


--
-- Name: POLICY funcionarios_admin_delete ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_admin_delete ON public.funcionarios IS 'Admin deleta RH, emissores e admins inativos';


--
-- Name: funcionarios funcionarios_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_admin_update ON public.funcionarios FOR UPDATE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[])))) WITH CHECK (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying, 'admin'::character varying])::text[]))));


--
-- Name: POLICY funcionarios_admin_update ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_admin_update ON public.funcionarios IS 'Admin atualiza RH, emissores e outros admins';


--
-- Name: funcionarios funcionarios_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_block_admin ON public.funcionarios AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios_clinicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcionarios_clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios_clinicas funcionarios_clinicas_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_clinicas_block_admin ON public.funcionarios_clinicas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_clinicas_rh_delete ON public.funcionarios_clinicas FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: POLICY funcionarios_clinicas_rh_insert ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas IS 'RH pode criar relacionamentos de funcionarios com empresas da sua clinica';


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: POLICY funcionarios_clinicas_rh_select ON funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas IS 'RH pode visualizar relacionamentos de funcionarios da sua clinica';


--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_clinicas_rh_update ON public.funcionarios_clinicas FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios funcionarios_delete_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_delete_simple ON public.funcionarios FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY funcionarios_delete_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_delete_simple ON public.funcionarios IS 'Política DELETE simplificada - Apenas Admin';


--
-- Name: funcionarios funcionarios_emissor_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_emissor_select ON public.funcionarios FOR SELECT USING (((current_setting('app.current_user_perfil'::text, true) = 'emissor'::text) AND ((perfil)::text = ANY ((ARRAY['rh'::character varying, 'emissor'::character varying])::text[]))));


--
-- Name: POLICY funcionarios_emissor_select ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_emissor_select ON public.funcionarios IS 'Emissores visualizam RH e outros emissores (acesso global para coordenação de emissão)';


--
-- Name: funcionarios_entidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcionarios_entidades ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios_entidades funcionarios_entidades_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_entidades_block_admin ON public.funcionarios_entidades AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_entidades_gestor_delete ON public.funcionarios_entidades FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: POLICY funcionarios_entidades_gestor_insert ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades IS 'Gestor pode criar relacionamentos de funcionarios com sua entidade';


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: POLICY funcionarios_entidades_gestor_select ON funcionarios_entidades; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades IS 'Gestor pode visualizar relacionamentos de funcionarios da sua entidade';


--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_entidades_gestor_update ON public.funcionarios_entidades FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id()))) WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));


--
-- Name: funcionarios funcionarios_gestor_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_gestor_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));


--
-- Name: funcionarios funcionarios_gestor_insert_base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_gestor_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_gestor_select_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));


--
-- Name: POLICY funcionarios_gestor_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios IS 'Gestor pode visualizar funcionarios vinculados a sua entidade via funcionarios_entidades';


--
-- Name: funcionarios funcionarios_gestor_update_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_gestor_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));


--
-- Name: funcionarios funcionarios_insert_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_insert_simple ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_insert_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_insert_simple ON public.funcionarios IS 'Política INSERT simplificada - Admin, RH e Gestor podem inserir';


--
-- Name: funcionarios funcionarios_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_own_select ON public.funcionarios FOR SELECT USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: POLICY funcionarios_own_select ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_own_select ON public.funcionarios IS 'Funcionários comuns visualizam apenas seus próprios dados';


--
-- Name: funcionarios funcionarios_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_own_update ON public.funcionarios FOR UPDATE USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: POLICY funcionarios_own_update ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_own_update ON public.funcionarios IS 'Funcionários comuns atualizam apenas seus próprios dados (sem mudar perfil, clínica ou entidade)';


--
-- Name: funcionarios funcionarios_rh_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));


--
-- Name: funcionarios funcionarios_rh_insert_base; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_select_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));


--
-- Name: POLICY funcionarios_rh_select_via_relacionamento ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios IS 'RH pode visualizar funcionarios vinculados a sua clinica via funcionarios_clinicas';


--
-- Name: funcionarios funcionarios_rh_update_via_relacionamento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));


--
-- Name: funcionarios funcionarios_select_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_select_simple ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'admin'::text) OR ((public.current_user_perfil() = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_select_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_select_simple ON public.funcionarios IS 'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';


--
-- Name: funcionarios funcionarios_update_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_update_simple ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_update_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_update_simple ON public.funcionarios IS 'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';


--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));


--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes notificacoes_clinica_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notificacoes_clinica_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions permissions_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permissions_admin_all ON public.permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: permissions permissions_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY permissions_admin_select ON public.permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY permissions_admin_select ON permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY permissions_admin_select ON public.permissions IS 'Apenas admin pode visualizar permissões';


--
-- Name: laudos policy_laudos_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policy_laudos_admin ON public.laudos FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));


--
-- Name: laudos policy_laudos_emissor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policy_laudos_emissor ON public.laudos FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'emissor'::text));


--
-- Name: lotes_avaliacao policy_lotes_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policy_lotes_admin ON public.lotes_avaliacao FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));


--
-- Name: lotes_avaliacao policy_lotes_emissor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policy_lotes_emissor ON public.lotes_avaliacao FOR SELECT USING (((current_setting('app.current_role'::text, true) = 'emissor'::text) AND ((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_processamento'::character varying, 'concluido'::character varying])::text[]))));


--
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: respostas respostas_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY respostas_block_admin ON public.respostas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: respostas respostas_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY respostas_own_select ON public.respostas FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

--
-- Name: resultados resultados_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resultados_block_admin ON public.resultados AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: resultados resultados_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resultados_own_select ON public.resultados FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = resultados.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));


--
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);


--
-- Name: empresas_clientes rh_empresas_proprias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_empresas_proprias ON public.empresas_clientes USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND ((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true))));


--
-- Name: lotes_avaliacao rh_lotes_empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rh_lotes_empresas ON public.lotes_avaliacao USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)) OR (entidade_id IS NOT NULL))));


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_permissions_admin_all ON public.role_permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: role_permissions role_permissions_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_permissions_admin_select ON public.role_permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY role_permissions_admin_select ON role_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY role_permissions_admin_select ON public.role_permissions IS 'Apenas admin pode visualizar atribuições de permissões';


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_admin_all ON public.roles USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: roles roles_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY roles_admin_select ON public.roles FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY roles_admin_select ON roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY roles_admin_select ON public.roles IS 'Apenas admin pode visualizar papéis';


--
-- PostgreSQL database dump complete
--

