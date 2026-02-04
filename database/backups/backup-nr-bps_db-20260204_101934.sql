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

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: perfil_usuario_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.perfil_usuario_enum AS ENUM (
    'funcionario',
    'rh',
    'admin',
    'emissor'
);


ALTER TYPE public.perfil_usuario_enum OWNER TO postgres;

--
-- Name: TYPE perfil_usuario_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.perfil_usuario_enum IS 'Perfis vÃ¡lidos de usuÃ¡rios no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionÃ¡rios), admin (administraÃ§Ã£o geral), emissor (emite laudos)';


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
    'pagamento_confirmado'
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

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: liberada (criada mas não acessada), iniciada (primeiro acesso), em_andamento (progresso), concluida (finalizada), inativada (cancelada)';


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

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliaÃ§Ãµes: iniciada (criada mas nÃ£o respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';


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
    'rascunho',
    'emitido',
    'enviado'
);


ALTER TYPE public.status_laudo_enum OWNER TO postgres;

--
-- Name: TYPE status_laudo_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_laudo_enum IS 'Status de laudos: rascunho (em ediÃ§Ã£o), emitido (finalizado), enviado (enviado ao cliente)';


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
    'concluido',
    'rascunho'
);


ALTER TYPE public.status_lote_enum OWNER TO postgres;

--
-- Name: TYPE status_lote_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliaÃ§Ãµes concluÃ­das), concluido (sinÃ´nimo), rascunho (em criaÃ§Ã£o)';


--
-- Name: tipo_contratante_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_contratante_enum AS ENUM (
    'clinica',
    'entidade'
);


ALTER TYPE public.tipo_contratante_enum OWNER TO postgres;

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

COMMENT ON TYPE public.tipo_lote_enum IS 'Tipo de lote: completo (todos funcionÃ¡rios), operacional (apenas operacionais), gestao (apenas gestores)';


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
    'emissao_solicitada_sucesso'
);


ALTER TYPE public.tipo_notificacao OWNER TO postgres;

--
-- Name: tipo_plano; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_plano AS ENUM (
    'personalizado',
    'fixo'
);


ALTER TYPE public.tipo_plano OWNER TO postgres;

--
-- Name: usuario_tipo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor_rh',
    'gestor_entidade',
    'admin',
    'emissor'
);


ALTER TYPE public.usuario_tipo_enum OWNER TO postgres;

--
-- Name: arquivar_notificacoes_antigas(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.arquivar_notificacoes_antigas() OWNER TO postgres;

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
-- Name: audit_lote_change(); Type: FUNCTION; Schema: public; Owner: postgres
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
    -- Registrar apenas mudanÃ§as significativas
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


ALTER FUNCTION public.audit_lote_change() OWNER TO postgres;

--
-- Name: FUNCTION audit_lote_change(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_lote_change() IS 'Trigger de auditoria para lotes com cast correto do ip_address';


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

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger de auditoria que permite user_cpf e user_perfil NULL quando contexto nÃ£o estÃ¡ setado (usa NULLIF para converter string vazia em NULL)';


--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_trigger_function() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_user_cpf_val TEXT;
    current_user_perfil_val TEXT;
    record_id TEXT;
BEGIN
    -- Obter valores do contexto da sessÃ£o
    current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
    current_user_perfil_val := NULLIF(current_setting('app.current_user_perfil', TRUE), '');

    -- Se nÃ£o houver CPF no contexto, marcar como sistema
    IF current_user_cpf_val IS NULL THEN
        current_user_cpf_val := '00000000000';
    END IF;

    IF current_user_perfil_val IS NULL THEN
        current_user_perfil_val := 'system';
    END IF;

    -- Determinar o ID do registro baseado na operaÃ§Ã£o
    IF TG_OP = 'DELETE' THEN
        -- Para DELETE, usar o ID da linha OLD
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := OLD.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := OLD.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := OLD.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := OLD.id::TEXT;
            WHEN 'laudos' THEN record_id := OLD.id::TEXT;
            WHEN 'respostas' THEN record_id := OLD.id::TEXT;
            WHEN 'resultados' THEN record_id := OLD.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    ELSE
        -- Para INSERT/UPDATE, usar o ID da linha NEW
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := NEW.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := NEW.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := NEW.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := NEW.id::TEXT;
            WHEN 'laudos' THEN record_id := NEW.id::TEXT;
            WHEN 'respostas' THEN record_id := NEW.id::TEXT;
            WHEN 'resultados' THEN record_id := NEW.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    END IF;

    -- Registrar a operaÃ§Ã£o
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'INSERT', TG_TABLE_NAME, record_id, row_to_json(NEW));

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'UPDATE', TG_TABLE_NAME, record_id, row_to_json(OLD), row_to_json(NEW));

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'DELETE', TG_TABLE_NAME, record_id, row_to_json(OLD));
    END IF;

    -- Retornar a linha apropriada
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.audit_trigger_function() OWNER TO postgres;

--
-- Name: calcular_elegibilidade_lote(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliacao'
      ELSE 'RenovaÃ§Ã£o regular'
    END::varchar(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE 
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRITICA'
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END::varchar(20) AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND (
      -- CritÃ©rio 1: FuncionÃ¡rio novo (Ã­ndice 0)
      f.indice_avaliacao = 0
      OR
      -- CritÃ©rio 2: ï¿½ndice incompleto (faltou lote anterior)
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      -- CritÃ©rio 3: Mais de 1 ano sem avaliaÃ§Ã£o
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY 
    -- Ordenar por prioridade: CRITICA > ALTA > MEDIA > NORMAL
    CASE prioridade
      WHEN 'CRITICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MEDIA' THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC, -- Mais atrasados primeiro
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) OWNER TO postgres;

--
-- Name: FUNCTION calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionÃ¡rios devem ser incluÃ­dos no prÃ³ximo lote com base em Ã­ndice, data (>1 ano) e novos funcionÃ¡rios';


--
-- Name: calcular_elegibilidade_lote_contratante(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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
    f.contratante_id = p_contratante_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      f.indice_avaliacao = 0
      OR
      f.indice_avaliacao <= p_numero_lote_atual - 1
      OR
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


ALTER FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) OWNER TO postgres;

--
-- Name: FUNCTION calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) IS 'Ajustada para incluir <= p_numero_lote_atual - 1';


--
-- Name: calcular_hash_pdf(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_hash_pdf(pdf_data bytea) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION public.calcular_hash_pdf(pdf_data bytea) OWNER TO postgres;

--
-- Name: FUNCTION calcular_hash_pdf(pdf_data bytea); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_hash_pdf(pdf_data bytea) IS 'Calcula hash SHA-256 de um PDF para validação de integridade';


--
-- Name: calcular_vigencia_fim(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_vigencia_fim(data_inicio date) RETURNS date
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- VigÃªncia de 364 dias a partir da data de inÃ­cio
    RETURN data_inicio + INTERVAL '364 days';
END;
$$;


ALTER FUNCTION public.calcular_vigencia_fim(data_inicio date) OWNER TO postgres;

--
-- Name: FUNCTION calcular_vigencia_fim(data_inicio date); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_vigencia_fim(data_inicio date) IS 'Calcula data fim da vigÃªncia (data inÃ­cio + 364 dias)';


--
-- Name: check_laudo_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.check_laudo_immutability() OWNER TO postgres;

--
-- Name: FUNCTION check_laudo_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_laudo_immutability() IS 'Garante imutabilidade de laudos emitidos, exceto para backfill do hash_pdf quando NULL';


--
-- Name: check_resposta_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
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
    
    -- Verificar se reset estÃ¡ autorizado via contexto de sessÃ£o
    BEGIN
      v_allow_reset := COALESCE(current_setting('app.allow_reset', true)::BOOLEAN, false);
    EXCEPTION WHEN OTHERS THEN
      v_allow_reset := false;
    END;
    
    -- Se avaliaÃ§Ã£o concluÃ­da e reset NÃƒO autorizado, bloquear
    IF v_status = 'concluida' AND NOT v_allow_reset THEN
      RAISE EXCEPTION 'NÃ£o Ã© permitido modificar respostas de avaliaÃ§Ãµes concluÃ­das. AvaliaÃ§Ã£o ID: %', OLD.avaliacao_id
        USING HINT = 'Respostas de avaliaÃ§Ãµes concluÃ­das sÃ£o imutÃ¡veis para garantir integridade dos dados.', ERRCODE = '23506';
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


ALTER FUNCTION public.check_resposta_immutability() OWNER TO postgres;

--
-- Name: FUNCTION check_resposta_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliaÃ§Ã£o estÃ¡ concluÃ­da, exceto se app.allow_reset=true';


--
-- Name: check_resultado_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.check_resultado_immutability() OWNER TO postgres;

--
-- Name: FUNCTION check_resultado_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_resultado_immutability() IS 'Bloqueia modificações/inserções em resultados quando avaliação está concluída';


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
-- Name: current_user_contratante_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_contratante_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_id TEXT;
BEGIN
  v_id := NULLIF(current_setting('app.current_user_contratante_id', TRUE), '');
  
  -- SECURITY: For gestor_entidade perfil, contratante_id is mandatory
  IF v_id IS NULL AND current_user_perfil() = 'gestor_entidade' THEN
    RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not set for perfil gestor_entidade.';
  END IF;
  
  RETURN v_id::INTEGER;
EXCEPTION
  WHEN undefined_object THEN
    -- For non-gestor users, NULL is acceptable
    IF current_user_perfil() = 'gestor_entidade' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor_entidade.';
    END IF;
    RETURN NULL;
  WHEN SQLSTATE '22023' THEN
    IF current_user_perfil() = 'gestor_entidade' THEN
      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor_entidade.';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_contratante_id() OWNER TO postgres;

--
-- Name: FUNCTION current_user_contratante_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_contratante_id() IS 'Returns current user contratante_id from session context.
   RAISES EXCEPTION if not set for perfil gestor_entidade (prevents NULL bypass).
   Returns NULL for other perfis (acceptable).';


--
-- Name: current_user_contratante_id_optional(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_contratante_id_optional() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_contratante_id_optional() OWNER TO postgres;

--
-- Name: FUNCTION current_user_contratante_id_optional(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_contratante_id_optional() IS 'Retorna o contratante_id do contexto da sessÃ£o para RLS de entidades';


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
-- Name: detectar_anomalia_score(numeric, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.detectar_anomalia_score(p_score numeric, p_tipo character varying, p_grupo integer) OWNER TO postgres;

--
-- Name: detectar_anomalias_indice(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) OWNER TO postgres;

--
-- Name: FUNCTION detectar_anomalias_indice(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) IS 'Detecta padroes suspeitos no historico de avaliacoes (>3 faltas, indice atrasado, >2 anos sem avaliacao)';


--
-- Name: diagnosticar_lote_emissao(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION diagnosticar_lote_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) IS 'FunÃ§Ã£o de diagnÃ³stico para depuraÃ§Ã£o de problemas de emissÃ£o';


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
-- Name: fn_buscar_solicitante_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_buscar_solicitante_laudo(p_laudo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) IS 'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';


--
-- Name: fn_next_lote_id(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_next_lote_id() OWNER TO postgres;

--
-- Name: fn_obter_solicitacao_emissao(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION fn_obter_solicitacao_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) IS 'Busca a última solicitação de emissão para um lote específico';


--
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
BEGIN
  -- SÃ³ agir quando houve alteraÃ§Ã£o de status
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatÃ­sticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- Se condiÃ§Ã£o de conclusÃ£o for satisfeita, atualizar lote APENAS
  -- NOTA: EmissÃ£o de laudo Ã© 100% MANUAL - nÃ£o inserir em fila_emissao
  -- O RH/Entidade deve solicitar emissÃ£o via botÃ£o "Solicitar EmissÃ£o"
  -- O emissor entÃ£o emite o laudo manualmente no dashboard
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessÃ¡rios
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- REMOVIDO: InserÃ§Ã£o automÃ¡tica em fila_emissao
    -- Motivo: EmissÃ£o de laudo deve ser 100% MANUAL pelo emissor
    -- Fluxo correto:
    --   1. RH/Entidade solicita emissÃ£o (POST /api/lotes/[loteId]/solicitar-emissao)
    --   2. Lote aparece no dashboard do emissor
    --   3. Emissor revisa e clica "Gerar Laudo" manualmente
    --   4. Sistema gera PDF e hash
    --   5. Emissor revisa e envia
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() OWNER TO postgres;

--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliaÃ§Ã£o muda de status. Marca lote como concluÃ­do quando todas avaliaÃ§Ãµes liberadas estÃ£o finalizadas (concluÃ­das ou inativadas). EmissÃ£o de laudo Ã© 100% MANUAL.';


--
-- Name: fn_registrar_solicitacao_emissao(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_registrar_solicitacao_emissao() OWNER TO postgres;

--
-- Name: fn_relatorio_emissoes_periodo(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) OWNER TO postgres;

--
-- Name: FUNCTION fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) IS 'Gera relatório estatístico de emissões por usuário em um período específico';


--
-- Name: fn_reservar_id_laudo_on_lote_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_reservar_id_laudo_on_lote_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Inserir laudo com mesmo ID do lote (apenas reserva)
  INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_reservar_id_laudo_on_lote_insert() OWNER TO postgres;

--
-- Name: FUNCTION fn_reservar_id_laudo_on_lote_insert(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_reservar_id_laudo_on_lote_insert() IS 'Reserva ID do laudo (igual ao ID do lote) quando lote Ã© criado.
Laudo fica em status=rascunho atÃ© emissor gerar o PDF.
Garante que laudo.id === lote.id sempre.';


--
-- Name: fn_validar_transicao_status_lote(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_validar_transicao_status_lote() OWNER TO postgres;

--
-- Name: FUNCTION fn_validar_transicao_status_lote(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_transicao_status_lote() IS 'Valida transições de status do lote conforme máquina de estados. Previne transições inválidas e garante integridade.';


--
-- Name: gerar_dados_relatorio(integer, integer, integer, date, date); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer, p_empresa_id integer, p_data_inicio date, p_data_fim date) OWNER TO postgres;

--
-- Name: gerar_hash_auditoria(character varying, integer, character varying, jsonb, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  v_concatenado TEXT;
BEGIN
  v_concatenado := p_entidade_tipo || '|' || COALESCE(p_entidade_id::TEXT, 'NULL') || '|' || p_acao || '|' || COALESCE(p_dados::TEXT, '{}') || '|' || p_timestamp::TEXT;
  RETURN encode(digest(v_concatenado, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION public.gerar_hash_auditoria(p_entidade_tipo character varying, p_entidade_id integer, p_acao character varying, p_dados jsonb, p_timestamp timestamp with time zone) OWNER TO postgres;

--
-- Name: gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.gerar_numero_recibo() OWNER TO postgres;

--
-- Name: FUNCTION gerar_numero_recibo(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_numero_recibo() IS 'Gera nÃºmero Ãºnico de recibo no formato REC-AAAA-NNNNN';


--
-- Name: get_contratante_funcionario(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.get_contratante_funcionario(p_funcionario_id integer) OWNER TO postgres;

--
-- Name: get_resultados_por_empresa(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer) OWNER TO postgres;

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

COMMENT ON FUNCTION public.is_valid_perfil(p_perfil text) IS 'Valida se um texto corresponde a um perfil vÃ¡lido do ENUM';


--
-- Name: limpar_auditoria_laudos_antiga(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.limpar_auditoria_laudos_antiga() OWNER TO postgres;

--
-- Name: FUNCTION limpar_auditoria_laudos_antiga(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.limpar_auditoria_laudos_antiga() IS 'Remove registros de auditoria com mais de 1 ano (exceto erros). Executar mensalmente via cron.';


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
-- Name: lote_pode_ser_processado(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.lote_pode_ser_processado(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION lote_pode_ser_processado(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.lote_pode_ser_processado(p_lote_id integer) IS 'Verifica se um lote está apto para emissão de laudo';


--
-- Name: marcar_notificacoes_lidas(integer[], integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_id integer) OWNER TO postgres;

--
-- Name: marcar_notificacoes_lidas(integer[], text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.marcar_notificacoes_lidas(p_notificacao_ids integer[], p_usuario_cpf text) OWNER TO postgres;

--
-- Name: notificar_pre_cadastro_criado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notificar_pre_cadastro_criado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_contratante_nome TEXT;
  v_admin_record RECORD;
BEGIN
  -- Buscar nome do contratante (corrigido de clinicas para contratantes)
  SELECT nome INTO v_contratante_nome
  FROM contratantes
  WHERE id = NEW.contratante_id;

  -- Notificar todos os admins
  FOR v_admin_record IN
    SELECT cpf FROM usuarios WHERE role = 'admin' AND ativo = TRUE
  LOOP
    INSERT INTO notificacoes (
      tipo, prioridade, destinatario_cpf, destinatario_tipo,
      titulo, mensagem, dados_contexto, link_acao, botao_texto,
      contratacao_personalizada_id
    ) VALUES (
      'pre_cadastro_criado',
      'alta',
      v_admin_record.cpf,
      'admin',
      'Novo Pre-Cadastro: ' || v_contratante_nome,
      'Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: ' || COALESCE(NEW.numero_funcionarios_estimado::TEXT, 'Nao informado') || '.',
      jsonb_build_object(
        'contratacao_id', NEW.id,
        'contratante_nome', v_contratante_nome,
        'numero_funcionarios', NEW.numero_funcionarios_estimado
      ),
      '/admin/contratacao/pendentes',
      'Definir Valor',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notificar_pre_cadastro_criado() OWNER TO postgres;

--
-- Name: notificar_sla_excedido(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notificar_sla_excedido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_contratante_nome TEXT;
  v_horas_decorridas NUMERIC;
BEGIN
  -- Calcular horas desde criaÃ§Ã£o
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
      'ðŸš¨ SLA Excedido: ' || v_contratante_nome,
      'PrÃ©-cadastro aguardando definiÃ§Ã£o de valor hÃ¡ mais de 48 horas. AÃ§Ã£o urgente necessÃ¡ria.',
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


ALTER FUNCTION public.notificar_sla_excedido() OWNER TO postgres;

--
-- Name: notificar_valor_definido(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notificar_valor_definido() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_contratante_nome TEXT;
  v_gestor_cpf TEXT;
BEGIN
  -- Buscar dados do contratante (corrigido de clinicas para contratantes)
  SELECT nome, responsavel_cpf INTO v_contratante_nome, v_gestor_cpf
  FROM contratantes
  WHERE id = NEW.contratante_id;

  -- Notificar gestor do contratante
  INSERT INTO notificacoes (
    tipo, prioridade, destinatario_cpf, destinatario_tipo,
    titulo, mensagem, dados_contexto, link_acao, botao_texto,
    contratacao_personalizada_id
  ) VALUES (
    'valor_definido',
    'media',
    v_gestor_cpf,
    'gestor_entidade',
    'Valor Definido para Plano Personalizado',
    'O valor do seu plano personalizado foi definido. Valor por funcionario: R$ ' ||
      TO_CHAR(NEW.valor_por_funcionario, 'FM999G999G990D00') ||
      '. Total estimado: R$ ' || TO_CHAR(NEW.valor_total_estimado, 'FM999G999G990D00') || '.',
    jsonb_build_object(
      'contratacao_id', NEW.id,
      'valor_por_funcionario', NEW.valor_por_funcionario,
      'valor_total_estimado', NEW.valor_total_estimado
    ),
    '/entidade/contratacao/' || NEW.id,
    'Ver Contrato',
    NEW.id
  );

  RETURN NEW;
END;
$_$;


ALTER FUNCTION public.notificar_valor_definido() OWNER TO postgres;

--
-- Name: obter_proximo_numero_ordem(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) OWNER TO postgres;

--
-- Name: FUNCTION obter_proximo_numero_ordem(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o prÃ³ximo nÃºmero de ordem sequencial para um novo lote da empresa';


--
-- Name: prevent_laudo_lote_id_change(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_laudo_lote_id_change() OWNER TO postgres;

--
-- Name: prevent_lote_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_lote_mutation_during_emission() OWNER TO postgres;

--
-- Name: FUNCTION prevent_lote_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_lote_mutation_during_emission() IS 'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. Atualizada em migration 098 para remover referência ao campo processamento_em removido.';


--
-- Name: prevent_lote_status_change_after_emission(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_lote_status_change_after_emission() OWNER TO postgres;

--
-- Name: FUNCTION prevent_lote_status_change_after_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_lote_status_change_after_emission() IS 'Previne mudança de status do lote após emissão do laudo';


--
-- Name: prevent_modification_after_emission(); Type: FUNCTION; Schema: public; Owner: postgres
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

    -- Buscar informaÃ§Ãµes do lote
    SELECT emitido_em INTO lote_emitido_em
    FROM lotes_avaliacao
    WHERE id = lote_id_val;
    
    -- Se o laudo foi emitido, bloquear modificaÃ§Ã£o
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'NÃ£o Ã© possÃ­vel modificar avaliaÃ§Ã£o do lote % (emitido em %). Laudo foi emitido em %.',
            lote_id_val, lote_emitido_em, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos sÃ£o imutÃ¡veis para garantir integridade';
    END IF;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.prevent_modification_after_emission() OWNER TO postgres;

--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificaÃ§Ã£o de avaliaÃ§Ãµes apÃ³s emissÃ£o do laudo (imutabilidade) - versÃ£o corrigida sem coluna codigo';


--
-- Name: prevent_modification_avaliacao_when_lote_emitted(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() OWNER TO postgres;

--
-- Name: FUNCTION prevent_modification_avaliacao_when_lote_emitted(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() IS 'Impede UPDATE/DELETE em avaliações quando o lote já possui laudo emitido';


--
-- Name: prevent_modification_lote_when_laudo_emitted(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_modification_lote_when_laudo_emitted() OWNER TO postgres;

--
-- Name: FUNCTION prevent_modification_lote_when_laudo_emitted(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido, mas permite atualizações de campos de data';


--
-- Name: prevent_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alterações nas avaliações durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar durante emissão
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


ALTER FUNCTION public.prevent_mutation_during_emission() OWNER TO postgres;

--
-- Name: FUNCTION prevent_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_mutation_during_emission() IS 'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. Atualizada em migration 099 para remover referência ao campo processamento_em removido.';


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
-- Name: trg_enforce_laudo_id_equals_lote(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.trg_enforce_laudo_id_equals_lote() OWNER TO postgres;

--
-- Name: trigger_gerar_numero_recibo(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.trigger_gerar_numero_recibo() OWNER TO postgres;

--
-- Name: update_contratantes_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_contratantes_senhas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contratantes_senhas_updated_at() OWNER TO postgres;

--
-- Name: update_contratantes_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_contratantes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_contratantes_updated_at() OWNER TO postgres;

--
-- Name: upsert_laudo(integer, character, text, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) OWNER TO postgres;

--
-- Name: FUNCTION upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) IS 'Atualiza laudo rascunho existente (id já reservado) ou insere se não existir';


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
-- Name: validar_lote_pre_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
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
  
  -- Contar avaliaÃ§Ãµes do lote
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento', 'concluida')) AS ativas
  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_ativas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;
  
  -- Se o lote estÃ¡ concluÃ­do, NÃƒO verificar funcionÃ¡rios pendentes
  -- pois o lote jÃ¡ foi fechado e estÃ¡ aguardando apenas solicitaÃ§Ã£o de emissÃ£o
  IF v_lote_status = 'concluido' THEN
    v_funcionarios_pendentes := 0;
  ELSE
    -- Verificar funcionÃ¡rios que deveriam estar no lote mas nÃ£o estÃ£o
    -- (apenas para lotes ainda em andamento)
    SELECT COUNT(*) INTO v_funcionarios_pendentes
    FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
    WHERE NOT EXISTS (
      SELECT 1 FROM avaliacoes a 
      WHERE a.funcionario_cpf = el.funcionario_cpf 
      AND a.lote_id = p_lote_id
    );
  END IF;
  
  -- Gerar alertas informativos (nÃ£o bloqueantes)
  IF v_avaliacoes_inativadas > 0 AND v_avaliacoes_concluidas > 0 THEN
    IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
      v_alertas := array_append(v_alertas, 
        'ATENÃ‡ÃƒO: Mais de 30% das avaliaÃ§Ãµes foram inativadas (' || 
        v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || 
        '). Verifique se hÃ¡ problemas sistÃªmicos.');
    END IF;
  END IF;
  
  IF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    v_alertas := array_append(v_alertas, 
      'PENDÃŠNCIA: ' || v_funcionarios_pendentes || 
      ' funcionÃ¡rio(s) deveriam estar neste lote mas nÃ£o foram incluÃ­dos. Revise a elegibilidade.');
  END IF;
  
  -- Determinar se hÃ¡ bloqueios severos (erro definitivo)
  -- Um lote estÃ¡ pronto para emissÃ£o quando:
  -- 1. Tem status 'concluido' E
  -- 2. Tem pelo menos uma avaliaÃ§Ã£o concluÃ­da E
  -- 3. Todas as avaliaÃ§Ãµes ativas foram concluÃ­das (concluidas = ativas)
  IF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas, 
      'ERRO: Nenhuma avaliaÃ§Ã£o concluÃ­da neste lote. NÃ£o Ã© possÃ­vel gerar laudo.');
    v_bloqueante := TRUE;
  ELSIF v_lote_status = 'concluido' AND v_avaliacoes_concluidas > 0 THEN
    -- Lote concluÃ­do com avaliaÃ§Ãµes finalizadas = PRONTO (nÃ£o bloqueante)
    v_bloqueante := FALSE;
  ELSIF v_avaliacoes_ativas > 0 AND v_avaliacoes_concluidas < v_avaliacoes_ativas THEN
    -- Ainda hÃ¡ avaliaÃ§Ãµes ativas nÃ£o concluÃ­das
    v_alertas := array_append(v_alertas,
      'PENDENTE: ' || (v_avaliacoes_ativas - v_avaliacoes_concluidas) || 
      ' avaliaÃ§Ã£o(Ãµes) ativa(s) ainda nÃ£o concluÃ­da(s).');
    v_bloqueante := TRUE;
  ELSIF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    -- HÃ¡ funcionÃ¡rios que deveriam estar no lote (apenas se lote nÃ£o concluÃ­do)
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
  -- valido = TRUE quando NÃƒO hÃ¡ bloqueantes
  RETURN QUERY SELECT 
    NOT v_bloqueante AS valido,
    v_alertas AS alertas,
    v_funcionarios_pendentes,
    v_detalhes AS detalhes,
    v_bloqueante AS bloqueante;
END;
$$;


ALTER FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote estÃ¡ pronto para emissÃ£o de laudo. Lotes com status concluido e avaliaÃ§Ãµes finalizadas sÃ£o considerados vÃ¡lidos (Pronto). Apenas lotes em andamento verificam funcionÃ¡rios pendentes.';


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
-- Name: verificar_cancelamento_automatico_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_cancelamento_automatico_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_ativas INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliaÃ§Ã£o que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se nÃ£o tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- SÃ³ processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliaÃ§Ãµes do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status != 'inativada') as ativas
  INTO
    v_total_avaliacoes,
    v_avaliacoes_inativadas,
    v_avaliacoes_ativas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se TODAS as avaliaÃ§Ãµes foram inativadas, cancelar lote automaticamente
  IF v_avaliacoes_ativas = 0 AND v_avaliacoes_inativadas > 0 THEN
    UPDATE lotes_avaliacao
    SET 
      status = 'cancelado'::status_lote,
      cancelado_automaticamente = true,
      motivo_cancelamento = 'Todas as avaliaÃ§Ãµes foram inativadas',
      auto_emitir_agendado = false,
      auto_emitir_em = NULL,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Garantir que sÃ³ cancela se ainda estiver ativo
    
    RAISE NOTICE 'Lote % cancelado automaticamente: todas as % avaliaÃ§Ãµes foram inativadas', 
      v_lote_id, v_avaliacoes_inativadas;
      
    -- Registrar notificaÃ§Ã£o para admin
    INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
    VALUES (
      'lote_cancelado_auto',
      'Lote ' || v_lote_id || ' foi cancelado automaticamente porque todas as avaliaÃ§Ãµes foram inativadas',
      v_lote_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_cancelamento_automatico_lote() OWNER TO postgres;

--
-- Name: FUNCTION verificar_cancelamento_automatico_lote(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_cancelamento_automatico_lote() IS 'Cancela automaticamente o lote quando todas as avaliaÃ§Ãµes sÃ£o inativadas';


--
-- Name: verificar_conclusao_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_conclusao_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliaÃ§Ã£o que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se nÃ£o tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- SÃ³ processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliaÃ§Ãµes do lote
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
  
  -- Se todas as avaliaÃ§Ãµes (exceto as inativadas) foram concluÃ­das, marcar lote como concluÃ­do
  -- E agendar envio para 10 minutos depois (emissÃ£o serÃ¡ imediata via cron)
  IF v_avaliacoes_pendentes = 0 AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes AND v_avaliacoes_concluidas > 0 THEN
    UPDATE lotes_avaliacao
    SET 
      status = 'concluido'::status_lote,
      auto_emitir_agendado = true,
      auto_emitir_em = NOW() + INTERVAL '10 minutes',  -- Apenas para o ENVIO (emissÃ£o Ã© imediata)
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Evitar update desnecessÃ¡rio
    
    RAISE NOTICE 'Lote % marcado como concluÃ­do e agendado para envio em 10 minutos: % concluÃ­das, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_conclusao_lote() OWNER TO postgres;

--
-- Name: FUNCTION verificar_conclusao_lote(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_conclusao_lote() IS 'Atualiza lote para concluÃ­do e agenda envio (emissÃ£o Ã© imediata)';


--
-- Name: verificar_inativacao_consecutiva(character, integer); Type: FUNCTION; Schema: public; Owner: postgres
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
  -- Buscar empresa_id e contratante_id do lote
  SELECT empresa_id, contratante_id INTO v_empresa_id, v_contratante_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionÃ¡rio tem anomalias crÃ­ticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRITICA'
    ) INTO v_tem_anomalia_critica;
  ELSE
    -- Para contratantes ainda nÃ£o aplicamos detecÃ§Ã£o de anomalias; nÃ£o bloquear por anomalia
    v_tem_anomalia_critica := false;
  END IF;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e status da avaliacao correspondente (se existir) no mesmo contexto
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.numero_ordem = v_lote_atual_ordem - 1
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    )
  LIMIT 1;

  -- Contar inativaÃ§Ãµes anteriores (qualquer lote anterior no contexto)
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

  -- Contar nÃºmero de avaliaÃ§Ãµes anteriores (independente de status) no contexto
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
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. ' ||
      'Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nÃ£o hÃ¡ avaliaÃ§Ãµes anteriores (funcionÃ¡rio recÃ©m-importado/inscrito), permitir sem sinalizar como forÃ§ada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT 
      true AS permitido,
      'PERMITIDO: FuncionÃ¡rio sem avaliaÃ§Ãµes anteriores (possivelmente recÃ©m-importado/inscrito). InativaÃ§Ã£o do primeiro lote Ã© permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2Âª inativaÃ§Ã£o (ou seja, jÃ¡ existe pelo menos 1 inativaÃ§Ã£o anterior), sinalizar como restriÃ§Ã£o (pode ser forÃ§ada)
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
      'InativaÃ§Ã£o permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$;


ALTER FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Verifica se funcionÃ¡rio pode ter avaliaÃ§Ã£o inativada (impede 2Âª consecutiva)';


--
-- Name: verificar_integridade_recibo(integer); Type: FUNCTION; Schema: public; Owner: postgres
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

  -- Se nÃ£o encontrar, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calcular hash do PDF atual
  v_hash_calculado := calcular_hash_pdf(v_pdf);

  -- Retornar resultado da verificaÃ§Ã£o
  RETURN QUERY SELECT
    recibo_id,
    v_hash_armazenado,
    v_hash_calculado,
    (v_hash_armazenado = v_hash_calculado) AS integro;
END;
$$;


ALTER FUNCTION public.verificar_integridade_recibo(recibo_id integer) OWNER TO postgres;

--
-- Name: FUNCTION verificar_integridade_recibo(recibo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_integridade_recibo(recibo_id integer) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: backup_laudos_contratante_1; Type: TABLE; Schema: backups; Owner: postgres
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


ALTER TABLE backups.backup_laudos_contratante_1 OWNER TO postgres;

--
-- Name: backup_resultados_contratante_1; Type: TABLE; Schema: backups; Owner: postgres
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


ALTER TABLE backups.backup_resultados_contratante_1 OWNER TO postgres;

--
-- Name: _backup_fila_emissao_20260204; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._backup_fila_emissao_20260204 (
    id integer,
    lote_id integer,
    tentativas integer,
    max_tentativas integer,
    proxima_tentativa timestamp without time zone,
    erro text,
    criado_em timestamp without time zone,
    atualizado_em timestamp without time zone,
    solicitado_por character varying(11),
    solicitado_em timestamp without time zone,
    tipo_solicitante character varying(20)
);


ALTER TABLE public._backup_fila_emissao_20260204 OWNER TO postgres;

--
-- Name: TABLE _backup_fila_emissao_20260204; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public._backup_fila_emissao_20260204 IS 'Backup da tabela fila_emissao antes da migration 201 - Pode ser removido após validação';


--
-- Name: _deprecated_fila_emissao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._deprecated_fila_emissao (
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

ALTER TABLE ONLY public._deprecated_fila_emissao FORCE ROW LEVEL SECURITY;


ALTER TABLE public._deprecated_fila_emissao OWNER TO postgres;

--
-- Name: TABLE _deprecated_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public._deprecated_fila_emissao IS 'DEPRECATED - Use auditoria_laudos ou v_fila_emissao. Esta tabela será removida em migration futura.';


--
-- Name: COLUMN _deprecated_fila_emissao.tentativas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.tentativas IS 'Número de tentativas de processamento';


--
-- Name: COLUMN _deprecated_fila_emissao.max_tentativas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';


--
-- Name: COLUMN _deprecated_fila_emissao.proxima_tentativa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';


--
-- Name: COLUMN _deprecated_fila_emissao.erro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.erro IS 'Mensagem do último erro ocorrido';


--
-- Name: COLUMN _deprecated_fila_emissao.solicitado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.solicitado_por IS 'CPF do RH ou gestor_entidade que solicitou a emissão manual do laudo';


--
-- Name: COLUMN _deprecated_fila_emissao.solicitado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.solicitado_em IS 'Timestamp exato da solicitação manual de emissão';


--
-- Name: COLUMN _deprecated_fila_emissao.tipo_solicitante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public._deprecated_fila_emissao.tipo_solicitante IS 'Perfil do usuário que solicitou: rh, gestor_entidade ou admin';


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
-- Name: analise_estatistica; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.analise_estatistica OWNER TO postgres;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analise_estatistica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analise_estatistica_id_seq OWNER TO postgres;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analise_estatistica_id_seq OWNED BY public.analise_estatistica.id;


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

COMMENT ON COLUMN public.audit_logs.user_cpf IS 'CPF do usuÃ¡rio que executou a aÃ§Ã£o. NULL indica aÃ§Ã£o automÃ¡tica do sistema.';


--
-- Name: COLUMN audit_logs.user_perfil; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.user_perfil IS 'Perfil do usuÃ¡rio que executou a aÃ§Ã£o (pode ser NULL para operaÃ§Ãµes sem contexto de sessÃ£o)';


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
-- Name: auditoria_laudos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.auditoria_laudos OWNER TO postgres;

--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissÃ£o, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.lote_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.lote_id IS 'Referencia ao lote de avaliacao. FK com ON DELETE CASCADE.';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'Acao executada: emissao_automatica, envio_automatico, solicitacao_manual, solicitar_emissao, reprocessamento_manual, etc.';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status do evento: pendente, processando, emitido, enviado, erro, reprocessando, cancelado.';


--
-- Name: COLUMN auditoria_laudos.solicitado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.solicitado_por IS 'CPF do usuario que solicitou a acao (RH ou Entidade). Obrigatorio para acoes manuais.';


--
-- Name: COLUMN auditoria_laudos.tipo_solicitante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.tipo_solicitante IS 'Tipo do solicitante: rh, gestor_entidade, admin, emissor. ObrigatÃ³rio quando solicitado_por preenchido.';


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

COMMENT ON CONSTRAINT chk_solicitation_has_requester ON public.auditoria_laudos IS 'Garante que solicitaÃ§Ãµes manuais sempre tenham o CPF do solicitante registrado.';


--
-- Name: CONSTRAINT chk_status_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_status_valid ON public.auditoria_laudos IS 'Garante que apenas status vÃ¡lidos sejam registrados.';


--
-- Name: CONSTRAINT chk_tipo_solicitante_valid ON auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT chk_tipo_solicitante_valid ON public.auditoria_laudos IS 'Valida tipos permitidos de solicitante.';


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_laudos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_laudos_id_seq OWNER TO postgres;

--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_laudos_id_seq OWNED BY public.auditoria_laudos.id;


--
-- Name: avaliacao_resets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.avaliacao_resets OWNER TO postgres;

--
-- Name: TABLE avaliacao_resets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.avaliacao_resets IS 'Immutable audit log of evaluation reset operations';


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
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY (ARRAY[('iniciada'::character varying)::text, ('em_andamento'::character varying)::text, ('concluida'::character varying)::text, ('inativada'::character varying)::text])))
);


ALTER TABLE public.avaliacoes OWNER TO postgres;

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
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avaliacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_id_seq OWNER TO postgres;

--
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;


--
-- Name: backup_lotes_migracao_20260130; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.backup_lotes_migracao_20260130 OWNER TO postgres;

--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: postgres
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
    contratante_id integer,
    nome_fantasia text
);


ALTER TABLE public.clinicas OWNER TO postgres;

--
-- Name: COLUMN clinicas.nome_fantasia; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.nome_fantasia IS 'Nome fantasia/razÃ£o exibida para pessoas jurÃ­dicas (sinÃ´nimo de nome)';


--
-- Name: clinicas_empresas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinicas_empresas (
    clinica_id integer NOT NULL,
    empresa_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clinicas_empresas OWNER TO postgres;

--
-- Name: TABLE clinicas_empresas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.clinicas_empresas IS 'Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que elas atendem';


--
-- Name: COLUMN clinicas_empresas.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_empresas.clinica_id IS 'ID da clinica de medicina ocupacional';


--
-- Name: COLUMN clinicas_empresas.empresa_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas_empresas.empresa_id IS 'ID da empresa cliente atendida pela clÃ­nica';


--
-- Name: clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_id_seq OWNER TO postgres;

--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;


--
-- Name: contratacao_personalizada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contratacao_personalizada (
    id integer NOT NULL,
    contratante_id integer,
    numero_funcionarios_estimado integer,
    valor_por_funcionario numeric(10,2),
    valor_total_estimado numeric(12,2),
    payment_link_token character varying(128),
    payment_link_expiracao timestamp without time zone,
    status character varying(50) DEFAULT 'aguardando_valor'::character varying,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    link_enviado_em timestamp without time zone
);


ALTER TABLE public.contratacao_personalizada OWNER TO postgres;

--
-- Name: TABLE contratacao_personalizada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contratacao_personalizada IS 'Tabela de compatibilidade para contratacao personalizada (fluxo legacy e testes)';


--
-- Name: COLUMN contratacao_personalizada.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratacao_personalizada.status IS 'Estados: aguardando_valor, valor_definido, aguardando_pagamento, pagamento_confirmado, cancelado';


--
-- Name: COLUMN contratacao_personalizada.link_enviado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratacao_personalizada.link_enviado_em IS 'Timestamp de quando o link de pagamento foi gerado/enviado ao contratante';


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratacao_personalizada_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratacao_personalizada_id_seq OWNER TO postgres;

--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratacao_personalizada_id_seq OWNED BY public.contratacao_personalizada.id;


--
-- Name: contratantes; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT contratantes_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT contratantes_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
);


ALTER TABLE public.contratantes OWNER TO postgres;

--
-- Name: TABLE contratantes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contratantes IS 'Tabela unificada para clÃ­nicas e entidades privadas';


--
-- Name: COLUMN contratantes.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.tipo IS 'clinica: medicina ocupacional com empresas intermediÃ¡rias | entidade: empresa privada com vÃ­nculo direto';


--
-- Name: COLUMN contratantes.responsavel_nome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN contratantes.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.status IS 'Status de aprovaÃ§Ã£o para novos cadastros';


--
-- Name: COLUMN contratantes.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';


--
-- Name: COLUMN contratantes.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';


--
-- Name: COLUMN contratantes.plano_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.plano_id IS 'ID do plano associado ao contratante';


--
-- Name: COLUMN contratantes.data_liberacao_login; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes.data_liberacao_login IS 'Data em que o login foi liberado apÃ³s confirmaÃ§Ã£o de pagamento';


--
-- Name: contratantes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_id_seq OWNER TO postgres;

--
-- Name: contratantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratantes_id_seq OWNED BY public.contratantes.id;


--
-- Name: contratantes_senhas; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.contratantes_senhas OWNER TO postgres;

--
-- Name: TABLE contratantes_senhas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contratantes_senhas IS 'Senhas hash para gestores de entidades fazerem login';


--
-- Name: COLUMN contratantes_senhas.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes_senhas.cpf IS 'CPF do responsavel_cpf em contratantes - usado para login';


--
-- Name: COLUMN contratantes_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratantes_senhas.primeira_senha_alterada IS 'Flag para forÃ§ar alteraÃ§Ã£o de senha no primeiro acesso';


--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratantes_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_senhas_id_seq OWNER TO postgres;

--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratantes_senhas_id_seq OWNED BY public.contratantes_senhas.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: postgres
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
    conteudo_gerado text
);


ALTER TABLE public.contratos OWNER TO postgres;

--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratos_id_seq OWNER TO postgres;

--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;


--
-- Name: contratos_planos; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT contratos_planos_clinica_or_contratante CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT contratos_planos_tipo_contratante_check CHECK (((tipo_contratante)::text = ANY (ARRAY[('clinica'::character varying)::text, ('entidade'::character varying)::text])))
);


ALTER TABLE public.contratos_planos OWNER TO postgres;

--
-- Name: contratos_planos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratos_planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratos_planos_id_seq OWNER TO postgres;

--
-- Name: contratos_planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratos_planos_id_seq OWNED BY public.contratos_planos.id;


--
-- Name: emissao_queue; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.emissao_queue OWNER TO postgres;

--
-- Name: emissao_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emissao_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emissao_queue_id_seq OWNER TO postgres;

--
-- Name: emissao_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emissao_queue_id_seq OWNED BY public.emissao_queue.id;


--
-- Name: empresas_clientes; Type: TABLE; Schema: public; Owner: postgres
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
    clinica_id integer,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contratante_id integer,
    representante_nome text,
    representante_fone character varying(30),
    representante_email character varying(100),
    CONSTRAINT empresas_clientes_parent_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL))))
);


ALTER TABLE public.empresas_clientes OWNER TO postgres;

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
-- Name: empresas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empresas_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empresas_clientes_id_seq OWNER TO postgres;

--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empresas_clientes_id_seq OWNED BY public.empresas_clientes.id;


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: postgres
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
    nivel_cargo character varying(50),
    ultima_avaliacao_id integer,
    ultima_avaliacao_data_conclusao timestamp without time zone,
    ultima_avaliacao_status character varying(20),
    ultimo_motivo_inativacao text,
    data_ultimo_lote timestamp without time zone,
    data_nascimento date,
    contratante_id integer,
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    usuario_tipo public.usuario_tipo_enum NOT NULL,
    CONSTRAINT funcionarios_nivel_cargo_check CHECK (((((perfil)::text = 'funcionario'::text) AND ((nivel_cargo)::text = ANY (ARRAY[('operacional'::character varying)::text, ('gestao'::character varying)::text]))) OR (((perfil)::text <> 'funcionario'::text) AND (nivel_cargo IS NULL))))
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: COLUMN funcionarios.ultima_avaliacao_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_id IS 'ID da Ãºltima avaliaÃ§Ã£o concluÃ­da ou inativada (denormalizado para performance)';


--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo de 1 ano)';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunca fez)';


--
-- Name: equipe_administrativa; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.equipe_administrativa AS
 SELECT id,
    cpf,
    nome,
    email,
    usuario_tipo,
    perfil,
        CASE
            WHEN (usuario_tipo = 'admin'::public.usuario_tipo_enum) THEN 'Administrador do Sistema'::text
            WHEN (usuario_tipo = 'emissor'::public.usuario_tipo_enum) THEN 'Emissor de Laudos'::text
            ELSE 'Outro'::text
        END AS papel_descricao,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
   FROM public.funcionarios
  WHERE (usuario_tipo = ANY (ARRAY['admin'::public.usuario_tipo_enum, 'emissor'::public.usuario_tipo_enum]));


ALTER VIEW public.equipe_administrativa OWNER TO postgres;

--
-- Name: VIEW equipe_administrativa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.equipe_administrativa IS 'View semÃ¢ntica para equipe administrativa da plataforma.
Inclui administradores do sistema e emissores de laudos.
Facilita auditoria e gestÃ£o de acessos especiais.';


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fila_emissao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fila_emissao_id_seq OWNER TO postgres;

--
-- Name: fila_emissao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fila_emissao_id_seq OWNED BY public._deprecated_fila_emissao.id;


--
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_id_seq OWNER TO postgres;

--
-- Name: funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funcionarios_id_seq OWNED BY public.funcionarios.id;


--
-- Name: funcionarios_operacionais; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.funcionarios_operacionais AS
 SELECT id,
    cpf,
    nome,
    email,
    usuario_tipo,
    perfil,
        CASE
            WHEN (usuario_tipo = 'funcionario_clinica'::public.usuario_tipo_enum) THEN 'ClÃ­nica (Empresa IntermediÃ¡ria)'::text
            WHEN (usuario_tipo = 'funcionario_entidade'::public.usuario_tipo_enum) THEN 'Entidade (Direto)'::text
            ELSE 'Outro'::text
        END AS tipo_funcionario_descricao,
    empresa_id,
    clinica_id,
    contratante_id,
    setor,
    funcao,
    nivel_cargo,
    data_nascimento,
    matricula,
    turno,
    escala,
    ativo,
    criado_em,
    atualizado_em
   FROM public.funcionarios
  WHERE (usuario_tipo = ANY (ARRAY['funcionario_clinica'::public.usuario_tipo_enum, 'funcionario_entidade'::public.usuario_tipo_enum]));


ALTER VIEW public.funcionarios_operacionais OWNER TO postgres;

--
-- Name: VIEW funcionarios_operacionais; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.funcionarios_operacionais IS 'View semÃ¢ntica para funcionÃ¡rios operacionais que realizam avaliaÃ§Ãµes.
Exclui gestores, admins e emissores.
Facilita queries de RH e relatÃ³rios de funcionÃ¡rios.';


--
-- Name: gestores; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.gestores AS
 SELECT id,
    cpf,
    nome,
    email,
    usuario_tipo,
    perfil,
        CASE
            WHEN (usuario_tipo = 'gestor_rh'::public.usuario_tipo_enum) THEN 'RH (ClÃ­nica)'::text
            WHEN (usuario_tipo = 'gestor_entidade'::public.usuario_tipo_enum) THEN 'Entidade'::text
            ELSE 'Outro'::text
        END AS tipo_gestor_descricao,
    clinica_id,
    contratante_id,
    ativo,
    criado_em,
    atualizado_em
   FROM public.funcionarios
  WHERE (usuario_tipo = ANY (ARRAY['gestor_rh'::public.usuario_tipo_enum, 'gestor_entidade'::public.usuario_tipo_enum]));


ALTER VIEW public.gestores OWNER TO postgres;

--
-- Name: VIEW gestores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.gestores IS 'View semÃ¢ntica para todos os gestores do sistema.
Inclui gestores de RH (clÃ­nicas) e gestores de entidades.
Facilita queries que precisam apenas de gestores administrativos.';


--
-- Name: laudo_arquivos_remotos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.laudo_arquivos_remotos OWNER TO postgres;

--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_arquivos_remotos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNER TO postgres;

--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNED BY public.laudo_arquivos_remotos.id;


--
-- Name: laudo_downloads; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.laudo_downloads OWNER TO postgres;

--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_downloads_id_seq OWNER TO postgres;

--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_downloads_id_seq OWNED BY public.laudo_downloads.id;


--
-- Name: laudo_generation_jobs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.laudo_generation_jobs OWNER TO postgres;

--
-- Name: TABLE laudo_generation_jobs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.laudo_generation_jobs IS 'Jobs para geração de PDFs de laudos; consumidos por worker externo.';


--
-- Name: COLUMN laudo_generation_jobs.max_attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudo_generation_jobs.max_attempts IS 'Número máximo de tentativas antes de mover para DLQ/falha permanente';


--
-- Name: COLUMN laudo_generation_jobs.payload; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudo_generation_jobs.payload IS 'Payload opcional com parâmetros (ex.: options para geração, template overrides)';


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_generation_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNER TO postgres;

--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNED BY public.laudo_generation_jobs.id;


--
-- Name: laudos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laudos (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    emissor_cpf character(11),
    observacoes text,
    status character varying(20) DEFAULT 'rascunho'::character varying,
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
    CONSTRAINT chk_laudos_emitido_antes_enviado CHECK (((enviado_em IS NULL) OR (emitido_em IS NULL) OR (emitido_em <= enviado_em))),
    CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (((emitido_em IS NULL) OR (emissor_cpf IS NOT NULL))),
    CONSTRAINT chk_laudos_hash_pdf_valid CHECK (((hash_pdf IS NULL) OR ((hash_pdf)::text ~ '^[a-f0-9]{64}$'::text))),
    CONSTRAINT chk_laudos_status_valid CHECK (((status)::text = ANY ((ARRAY['emitido'::character varying, 'enviado'::character varying, 'rascunho'::character varying])::text[]))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id)),
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text])))
);


ALTER TABLE public.laudos OWNER TO postgres;

--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.laudos IS 'Laudos psicolÃ³gicos emitidos por emissores. 
IMPORTANTE: Laudos sÃ£o criados APENAS pelo emissor no momento da emissÃ£o.
NÃƒO devem ser criados antecipadamente em status rascunho.
Fluxo correto:
1. RH/Entidade solicita emissÃ£o (POST /api/lotes/[loteId]/solicitar-emissao)
2. Lote aparece no dashboard do emissor
3. Emissor clica "Gerar Laudo" (POST /api/emissor/laudos/[loteId])
4. Sistema cria registro em laudos E gera PDF+hash
5. Emissor revisa e envia';


--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do PDF do laudo gerado, usado para integridade e auditoria';


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
-- Name: laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudos_id_seq OWNER TO postgres;

--
-- Name: laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudos_id_seq OWNED BY public.laudos.id;


--
-- Name: lote_id_allocator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lote_id_allocator (
    last_id bigint NOT NULL
);


ALTER TABLE public.lote_id_allocator OWNER TO postgres;

--
-- Name: lotes_avaliacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes_avaliacao (
    id integer DEFAULT public.fn_next_lote_id() NOT NULL,
    clinica_id integer,
    empresa_id integer,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    liberado_por character(11),
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contratante_id integer,
    hash_pdf character varying(64),
    numero_ordem integer DEFAULT 1 NOT NULL,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    cancelado_automaticamente boolean DEFAULT false,
    motivo_cancelamento text,
    processamento_em timestamp without time zone,
    setor_id integer,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'ativo'::character varying, 'concluido'::character varying, 'emissao_solicitada'::character varying, 'emissao_em_andamento'::character varying, 'laudo_emitido'::character varying, 'cancelado'::character varying, 'finalizado'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


ALTER TABLE public.lotes_avaliacao OWNER TO postgres;

--
-- Name: TABLE lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliaÃ§Ã£o - identificaÃ§Ã£o apenas por ID (alinhado com laudos.id)';


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

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clÃ­nica';


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

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi enviado (notificaÃ§Ã£o disparada)';


--
-- Name: COLUMN lotes_avaliacao.cancelado_automaticamente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.cancelado_automaticamente IS 'Indica se o lote foi cancelado automaticamente pelo sistema';


--
-- Name: COLUMN lotes_avaliacao.motivo_cancelamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_cancelamento IS 'Motivo do cancelamento automÃ¡tico';


--
-- Name: CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON public.lotes_avaliacao IS 'Valida que status do lote está dentro dos valores permitidos pela máquina de estados';


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_avaliacao_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_funcionarios_id_seq OWNER TO postgres;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_avaliacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNER TO postgres;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNED BY public.lotes_avaliacao.id;


--
-- Name: mfa_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mfa_codes (
    id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.mfa_codes OWNER TO postgres;

--
-- Name: TABLE mfa_codes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.mfa_codes IS 'CÃ³digos de autenticaÃ§Ã£o multifator (MFA) para funcionÃ¡rios';


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mfa_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mfa_codes_id_seq OWNER TO postgres;

--
-- Name: mfa_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mfa_codes_id_seq OWNED BY public.mfa_codes.id;


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
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT notificacao_destinatario_valido CHECK ((length(destinatario_cpf) > 0)),
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor_entidade'::text, 'funcionario'::text])))
);


ALTER TABLE public.notificacoes OWNER TO postgres;

--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificacoes em tempo real para admin e gestores';


--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais especificos do tipo de notificacao';


--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiracao da notificacao (limpeza automatica)';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacoes_admin (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    lote_id integer,
    visualizada boolean DEFAULT false,
    criado_em timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notificacoes_admin OWNER TO postgres;

--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes_admin IS 'NotificaÃ§Ãµes crÃ­ticas para administradores do sistema';


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacoes_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_admin_id_seq OWNER TO postgres;

--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacoes_admin_id_seq OWNED BY public.notificacoes_admin.id;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_id_seq OWNER TO postgres;

--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: postgres
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
    provider_event_id character varying(255)
);


ALTER TABLE public.pagamentos OWNER TO postgres;

--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pagamentos IS 'Registro de pagamentos de contratantes';


--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'NÃºmero de parcelas do pagamento (1 = Ã  vista, 2-12 = parcelado)';


--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'ReferÃªncia opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';


--
-- Name: COLUMN pagamentos.idempotency_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.idempotency_key IS 'Chave de idempotÃªncia para evitar duplicaÃ§Ã£o de pagamentos (opcional)';


--
-- Name: COLUMN pagamentos.external_transaction_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.external_transaction_id IS 'ID da transaÃ§Ã£o no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';


--
-- Name: COLUMN pagamentos.provider_event_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.provider_event_id IS 'ID Ãºnico do evento do provedor de pagamento (para deduplicaÃ§Ã£o de webhooks)';


--
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagamentos_id_seq OWNER TO postgres;

--
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: planos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.planos OWNER TO postgres;

--
-- Name: COLUMN planos.caracteristicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.planos.caracteristicas IS 'CaracterÃ­sticas e benefÃ­cios do plano';


--
-- Name: planos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planos_id_seq OWNER TO postgres;

--
-- Name: planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planos_id_seq OWNED BY public.planos.id;


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
-- Name: questao_condicoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.questao_condicoes OWNER TO postgres;

--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questao_condicoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questao_condicoes_id_seq OWNER TO postgres;

--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questao_condicoes_id_seq OWNED BY public.questao_condicoes.id;


--
-- Name: recibos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recibos (
    id integer NOT NULL,
    contrato_id integer NOT NULL,
    pagamento_id integer NOT NULL,
    contratante_id integer NOT NULL,
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
    CONSTRAINT recibos_numero_funcionarios_check CHECK ((numero_funcionarios_cobertos > 0)),
    CONSTRAINT recibos_numero_parcelas_check CHECK ((numero_parcelas >= 1)),
    CONSTRAINT recibos_valor_funcionario_check CHECK (((valor_por_funcionario IS NULL) OR (valor_por_funcionario >= (0)::numeric))),
    CONSTRAINT recibos_valor_total_check CHECK ((valor_total_anual >= (0)::numeric)),
    CONSTRAINT recibos_vigencia_check CHECK ((vigencia_fim > vigencia_inicio))
);


ALTER TABLE public.recibos OWNER TO postgres;

--
-- Name: TABLE recibos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recibos IS 'Recibos financeiros gerados apÃ³s confirmaÃ§Ã£o de pagamento, separados do contrato de serviÃ§o';


--
-- Name: COLUMN recibos.numero_recibo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.numero_recibo IS 'NÃºmero Ãºnico do recibo no formato REC-AAAA-NNNNN';


--
-- Name: COLUMN recibos.vigencia_inicio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.vigencia_inicio IS 'Data de inÃ­cio da vigÃªncia = data do pagamento';


--
-- Name: COLUMN recibos.vigencia_fim; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.vigencia_fim IS 'Data de fim da vigÃªncia = data_pagamento + 364 dias';


--
-- Name: COLUMN recibos.numero_funcionarios_cobertos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionÃ¡rios cobertos pelo plano contratado';


--
-- Name: COLUMN recibos.valor_total_anual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.valor_total_anual IS 'Valor total anual do plano';


--
-- Name: COLUMN recibos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.valor_por_funcionario IS 'Valor cobrado por funcionÃ¡rio (se aplicÃ¡vel)';


--
-- Name: COLUMN recibos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';


--
-- Name: COLUMN recibos.descricao_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.descricao_pagamento IS 'DescriÃ§Ã£o textual da forma de pagamento para incluir no PDF';


--
-- Name: COLUMN recibos.pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.pdf IS 'PDF binÃ¡rio do recibo (BYTEA)';


--
-- Name: COLUMN recibos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.hash_pdf IS 'Hash SHA-256 do PDF binÃ¡rio em hexadecimal (64 caracteres)';


--
-- Name: COLUMN recibos.ip_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.ip_emissao IS 'EndereÃ§o IP de onde o recibo foi emitido';


--
-- Name: COLUMN recibos.emitido_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.emitido_por IS 'CPF do usuÃ¡rio que emitiu o recibo (formato: XXX.XXX.XXX-XX)';


--
-- Name: COLUMN recibos.hash_incluso; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.hash_incluso IS 'Indica se o hash foi incluÃ­do no rodapÃ© do PDF';


--
-- Name: COLUMN recibos.backup_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';


--
-- Name: recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recibos_id_seq OWNER TO postgres;

--
-- Name: recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recibos_id_seq OWNED BY public.recibos.id;


--
-- Name: relatorio_templates; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.relatorio_templates OWNER TO postgres;

--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relatorio_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relatorio_templates_id_seq OWNER TO postgres;

--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.relatorio_templates_id_seq OWNED BY public.relatorio_templates.id;


--
-- Name: respostas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respostas (
    id integer NOT NULL,
    avaliacao_id integer NOT NULL,
    grupo integer NOT NULL,
    item character varying(10) NOT NULL,
    valor integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT respostas_valor_check CHECK ((valor = ANY (ARRAY[0, 25, 50, 75, 100])))
);


ALTER TABLE public.respostas OWNER TO postgres;

--
-- Name: respostas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.respostas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respostas_id_seq OWNER TO postgres;

--
-- Name: respostas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.respostas_id_seq OWNED BY public.respostas.id;


--
-- Name: resultados; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.resultados OWNER TO postgres;

--
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultados_id_seq OWNER TO postgres;

--
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.role_permissions IS 'Admin tem apenas permissões de cadastro (RH, clínicas, admins). 
Operações como gerenciar avaliações, lotes, empresas e funcionários são de responsabilidade de RH e entidade_gestor.
Emissão de laudos é exclusiva de emissores.';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: suspicious_activity; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.suspicious_activity OWNER TO postgres;

--
-- Name: VIEW suspicious_activity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.suspicious_activity IS 'Detecta atividades suspeitas: usuÃƒÂ¡rios com mais de 100 aÃƒÂ§ÃƒÂµes na ÃƒÂºltima hora';


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    cpf text NOT NULL,
    nome text,
    role text DEFAULT 'admin'::text NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'Tabela de usuÃ¡rios do sistema (mÃ­nima para compatibilidade em DEV)';


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: usuarios_resumo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.usuarios_resumo AS
 SELECT usuario_tipo,
    count(*) AS total,
    count(*) FILTER (WHERE (ativo = true)) AS ativos,
    count(*) FILTER (WHERE (ativo = false)) AS inativos,
    count(DISTINCT clinica_id) FILTER (WHERE (clinica_id IS NOT NULL)) AS clinicas_vinculadas,
    count(DISTINCT contratante_id) FILTER (WHERE (contratante_id IS NOT NULL)) AS contratantes_vinculados,
    count(DISTINCT empresa_id) FILTER (WHERE (empresa_id IS NOT NULL)) AS empresas_vinculadas
   FROM public.funcionarios
  WHERE (usuario_tipo IS NOT NULL)
  GROUP BY usuario_tipo
  ORDER BY
        CASE usuario_tipo
            WHEN 'admin'::public.usuario_tipo_enum THEN 1
            WHEN 'emissor'::public.usuario_tipo_enum THEN 2
            WHEN 'gestor_rh'::public.usuario_tipo_enum THEN 3
            WHEN 'gestor_entidade'::public.usuario_tipo_enum THEN 4
            WHEN 'funcionario_clinica'::public.usuario_tipo_enum THEN 5
            WHEN 'funcionario_entidade'::public.usuario_tipo_enum THEN 6
            ELSE NULL::integer
        END;


ALTER VIEW public.usuarios_resumo OWNER TO postgres;

--
-- Name: VIEW usuarios_resumo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.usuarios_resumo IS 'View analÃ­tica com resumo estatÃ­stico de usuÃ¡rios por tipo.
Ãštil para dashboards administrativos e relatÃ³rios gerenciais.';


--
-- Name: v_auditoria_emissoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_auditoria_emissoes AS
 SELECT la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.processamento_em,
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
    l.arquivo_remoto_url,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
   FROM ((((public.lotes_avaliacao la
     JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.lote_id)))
  GROUP BY la.id, la.empresa_id, la.numero_ordem, la.status, la.emitido_em, la.enviado_em, la.processamento_em, la.criado_em, ec.nome, ec.cnpj, c.nome, l.hash_pdf, l.arquivo_remoto_url, l.enviado_em, l.emitido_em;


ALTER VIEW public.v_auditoria_emissoes OWNER TO postgres;

--
-- Name: VIEW v_auditoria_emissoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View de auditoria de emissÃµes de laudos - ID-only (sem codigo/titulo/emergencia)';


--
-- Name: v_dashboard_emissor; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dashboard_emissor AS
 SELECT la.id AS lote_id,
    la.descricao,
    la.tipo,
    la.status,
    la.liberado_em,
    la.liberado_por,
    COALESCE(ec.nome, cont.nome) AS empresa_nome,
    count(a.id) FILTER (WHERE ((a.status)::text <> 'inativada'::text)) AS total_avaliacoes,
    count(a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS avaliacoes_concluidas,
    l.id AS laudo_id,
    l.status AS laudo_status,
    l.hash_pdf,
    l.emitido_em,
    l.enviado_em,
    al.emissor_cpf AS solicitado_por,
    al.criado_em AS solicitado_em
   FROM (((((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.lote_id)))
     LEFT JOIN LATERAL ( SELECT auditoria_laudos.emissor_cpf,
            auditoria_laudos.criado_em
           FROM public.auditoria_laudos
          WHERE ((auditoria_laudos.lote_id = la.id) AND ((auditoria_laudos.acao)::text = 'emissao_solicitada'::text))
          ORDER BY auditoria_laudos.criado_em DESC
         LIMIT 1) al ON (true))
  WHERE (((la.status)::text = ANY ((ARRAY['emissao_solicitada'::character varying, 'emissao_em_andamento'::character varying])::text[])) AND (la.cancelado_automaticamente = false))
  GROUP BY la.id, la.descricao, la.tipo, la.status, la.liberado_em, la.liberado_por, ec.nome, cont.nome, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, al.emissor_cpf, al.criado_em
  ORDER BY la.liberado_em DESC;


ALTER VIEW public.v_dashboard_emissor OWNER TO postgres;

--
-- Name: VIEW v_dashboard_emissor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_dashboard_emissor IS 'View otimizada para dashboard do emissor - lista lotes prontos para emissão com informações consolidadas';


--
-- Name: v_fila_emissao; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.v_fila_emissao OWNER TO postgres;

--
-- Name: VIEW v_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_fila_emissao IS 'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';


--
-- Name: vw_analise_grupos_negativos; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_analise_grupos_negativos OWNER TO postgres;

--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: postgres
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
    a.inativada_em AS data_inativacao,
    a.motivo_inativacao,
    a.lote_id
   FROM (public.funcionarios f
     LEFT JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
  WHERE (((f.perfil)::text = 'funcionario'::text) AND (f.ativo = true));


ALTER VIEW public.vw_funcionarios_por_lote OWNER TO postgres;

--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';


--
-- Name: vw_notificacoes_nao_lidas; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_notificacoes_nao_lidas OWNER TO postgres;

--
-- Name: _deprecated_fila_emissao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._deprecated_fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq'::regclass);


--
-- Name: _migration_issues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_issues ALTER COLUMN id SET DEFAULT nextval('public._migration_issues_id_seq'::regclass);


--
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);


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
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);


--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: contratacao_personalizada id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratacao_personalizada ALTER COLUMN id SET DEFAULT nextval('public.contratacao_personalizada_id_seq'::regclass);


--
-- Name: contratantes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes ALTER COLUMN id SET DEFAULT nextval('public.contratantes_id_seq'::regclass);


--
-- Name: contratantes_senhas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_senhas ALTER COLUMN id SET DEFAULT nextval('public.contratantes_senhas_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: contratos_planos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos ALTER COLUMN id SET DEFAULT nextval('public.contratos_planos_id_seq'::regclass);


--
-- Name: emissao_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue ALTER COLUMN id SET DEFAULT nextval('public.emissao_queue_id_seq'::regclass);


--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: laudo_arquivos_remotos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos ALTER COLUMN id SET DEFAULT nextval('public.laudo_arquivos_remotos_id_seq'::regclass);


--
-- Name: laudo_downloads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads ALTER COLUMN id SET DEFAULT nextval('public.laudo_downloads_id_seq'::regclass);


--
-- Name: laudo_generation_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.laudo_generation_jobs_id_seq'::regclass);


--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);


--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);


--
-- Name: migration_guidelines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_guidelines ALTER COLUMN id SET DEFAULT nextval('public.migration_guidelines_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: notificacoes_admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);


--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: planos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planos ALTER COLUMN id SET DEFAULT nextval('public.planos_id_seq'::regclass);


--
-- Name: policy_expression_backups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_expression_backups ALTER COLUMN id SET DEFAULT nextval('public.policy_expression_backups_id_seq'::regclass);


--
-- Name: questao_condicoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes ALTER COLUMN id SET DEFAULT nextval('public.questao_condicoes_id_seq'::regclass);


--
-- Name: recibos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos ALTER COLUMN id SET DEFAULT nextval('public.recibos_id_seq'::regclass);


--
-- Name: relatorio_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relatorio_templates ALTER COLUMN id SET DEFAULT nextval('public.relatorio_templates_id_seq'::regclass);


--
-- Name: respostas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas ALTER COLUMN id SET DEFAULT nextval('public.respostas_id_seq'::regclass);


--
-- Name: resultados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados ALTER COLUMN id SET DEFAULT nextval('public.resultados_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: backup_laudos_contratante_1; Type: TABLE DATA; Schema: backups; Owner: postgres
--

COPY backups.backup_laudos_contratante_1 (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
\.


--
-- Data for Name: backup_resultados_contratante_1; Type: TABLE DATA; Schema: backups; Owner: postgres
--

COPY backups.backup_resultados_contratante_1 (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
\.


--
-- Data for Name: _backup_fila_emissao_20260204; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._backup_fila_emissao_20260204 (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em, solicitado_por, solicitado_em, tipo_solicitante) FROM stdin;
1	1	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 01:54:05.906277	gestor_entidade
2	2	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 02:01:33.202352	gestor_entidade
3	4	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 02:23:34.845089	gestor_entidade
4	6	0	3	2026-02-01 17:21:36.738616	\N	2026-02-01 17:21:36.738616	2026-02-01 17:21:36.738616	04703084945	2026-02-01 17:21:36.738616	rh
5	8	0	3	2026-02-02 07:15:53.66158	\N	2026-02-02 07:15:53.66158	2026-02-02 07:15:53.66158	87545772920	2026-02-02 07:15:53.66158	gestor_entidade
6	9	0	3	2026-02-02 07:20:14.406143	\N	2026-02-02 07:20:14.406143	2026-02-02 07:20:14.406143	87545772920	2026-02-02 07:20:14.406143	gestor_entidade
7	10	0	3	2026-02-02 07:52:51.433757	\N	2026-02-02 07:52:51.433757	2026-02-02 07:52:51.433757	87545772920	2026-02-02 07:52:51.433757	gestor_entidade
8	11	0	3	2026-02-02 08:10:12.162017	\N	2026-02-02 08:10:12.162017	2026-02-02 08:10:12.162017	87545772920	2026-02-02 08:10:12.162017	gestor_entidade
9	12	0	3	2026-02-02 09:57:10.529966	\N	2026-02-02 09:57:10.529966	2026-02-02 09:57:10.529966	15917295050	2026-02-02 09:57:10.529966	gestor_entidade
10	14	0	3	2026-02-02 10:54:02.977509	\N	2026-02-02 10:54:02.977509	2026-02-02 10:54:02.977509	13785514000	2026-02-02 10:54:02.977509	rh
11	15	0	3	2026-02-02 14:35:58.099256	\N	2026-02-02 14:35:58.099256	2026-02-02 14:35:58.099256	87545772920	2026-02-02 14:35:58.099256	gestor_entidade
12	16	0	3	2026-02-02 15:14:44.008158	\N	2026-02-02 15:14:44.008158	2026-02-02 15:14:44.008158	04703084945	2026-02-02 15:14:44.008158	rh
\.


--
-- Data for Name: _deprecated_fila_emissao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._deprecated_fila_emissao (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em, solicitado_por, solicitado_em, tipo_solicitante) FROM stdin;
1	1	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 01:54:05.906277	gestor_entidade
2	2	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 02:01:33.202352	gestor_entidade
3	4	0	3	2026-02-01 02:40:21.969439	\N	2026-02-01 02:40:21.969439	2026-02-01 02:40:21.969439	87545772920	2026-02-01 02:23:34.845089	gestor_entidade
4	6	0	3	2026-02-01 17:21:36.738616	\N	2026-02-01 17:21:36.738616	2026-02-01 17:21:36.738616	04703084945	2026-02-01 17:21:36.738616	rh
5	8	0	3	2026-02-02 07:15:53.66158	\N	2026-02-02 07:15:53.66158	2026-02-02 07:15:53.66158	87545772920	2026-02-02 07:15:53.66158	gestor_entidade
6	9	0	3	2026-02-02 07:20:14.406143	\N	2026-02-02 07:20:14.406143	2026-02-02 07:20:14.406143	87545772920	2026-02-02 07:20:14.406143	gestor_entidade
7	10	0	3	2026-02-02 07:52:51.433757	\N	2026-02-02 07:52:51.433757	2026-02-02 07:52:51.433757	87545772920	2026-02-02 07:52:51.433757	gestor_entidade
8	11	0	3	2026-02-02 08:10:12.162017	\N	2026-02-02 08:10:12.162017	2026-02-02 08:10:12.162017	87545772920	2026-02-02 08:10:12.162017	gestor_entidade
9	12	0	3	2026-02-02 09:57:10.529966	\N	2026-02-02 09:57:10.529966	2026-02-02 09:57:10.529966	15917295050	2026-02-02 09:57:10.529966	gestor_entidade
10	14	0	3	2026-02-02 10:54:02.977509	\N	2026-02-02 10:54:02.977509	2026-02-02 10:54:02.977509	13785514000	2026-02-02 10:54:02.977509	rh
11	15	0	3	2026-02-02 14:35:58.099256	\N	2026-02-02 14:35:58.099256	2026-02-02 14:35:58.099256	87545772920	2026-02-02 14:35:58.099256	gestor_entidade
12	16	0	3	2026-02-02 15:14:44.008158	\N	2026-02-02 15:14:44.008158	2026-02-02 15:14:44.008158	04703084945	2026-02-02 15:14:44.008158	rh
\.


--
-- Data for Name: _migration_issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._migration_issues (id, migration_version, issue_type, description, data, resolved, created_at) FROM stdin;
\.


--
-- Data for Name: analise_estatistica; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analise_estatistica (id, avaliacao_id, grupo, score_original, score_ajustado, anomalia_detectada, tipo_anomalia, recomendacao, created_at) FROM stdin;
\.


--
-- Data for Name: audit_access_denied; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_access_denied (id, user_cpf, user_perfil, attempted_action, resource, resource_id, reason, query_text, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, ip_address, user_agent, details, created_at) FROM stdin;
4	00000000000	admin	INSERT	funcionarios	6	\N	{"id": 6, "cpf": "53051173991", "nome": "Sender Test", "ativo": true, "email": "sender@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-01-31T20:13:35.88078", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$v5gAPZU6DxKp4u4PUmgd3eg3XNTTRlv4a7ZAOZOakm5mNOEIwLUVq", "nivel_cargo": null, "usuario_tipo": "emissor", "atualizado_em": "2026-01-31T20:13:35.88078", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-31 20:13:35.88078
5	00000000000	admin	INSERT	funcionarios	53051173991	\N	{"nome": "Sender Test", "email": "sender@qwork.com", "perfil": "emissor", "clinica_id": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Criação de emissor independente via admin	2026-01-31 20:13:35.909398
6	00000000000	admin	UPDATE	contratacao_personalizada	1	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 10, "valor_por_funcionario": 100}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 100/func, Total: R$ 1000	2026-01-31 20:15:26.641472
9	87545772920	gestor_entidade	INSERT	funcionarios	10	\N	{"id": 10, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-31T20:21:40.247782", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$11KUhmxT28suebn03BMIU.tW730MN1mORhD8jpzm1ceLbzGrfMuz6", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-01-31T20:21:40.247782", "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-31 20:21:40.247782
10	87545772920	gestor_entidade	INSERT	funcionarios	11	\N	{"id": 11, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-31T20:21:40.545779", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$3Z2g5pWXNroCIJY46lsE2eYMR1VD1Yipgd8z8RD.J8bp3aYsND1e.", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-01-31T20:21:40.545779", "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-31 20:21:40.545779
25	00000000000	admin	DELETE	funcionarios	11	{"id": 11, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-31T20:21:40.545779", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$3Z2g5pWXNroCIJY46lsE2eYMR1VD1Yipgd8z8RD.J8bp3aYsND1e.", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-01-31T20:21:40.545779", "contratante_id": 1, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-31 22:04:26.80798
41	87545772920	gestor_entidade	INSERT	avaliacoes	2	\N	{"id": 2, "envio": null, "inicio": "2026-02-01T04:34:48.847", "status": "iniciada", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.870977", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:34:48.870977", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 01:34:48.870977
26	00000000000	admin	DELETE	funcionarios	10	{"id": 10, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-31T20:21:40.247782", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$11KUhmxT28suebn03BMIU.tW730MN1mORhD8jpzm1ceLbzGrfMuz6", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-01-31T20:21:40.247782", "contratante_id": 1, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-31 22:04:26.80798
27	00000000000	admin	DELETE	funcionarios	6	{"id": 6, "cpf": "53051173991", "nome": "Sender Test", "ativo": true, "email": "sender@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-01-31T20:13:35.88078", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$v5gAPZU6DxKp4u4PUmgd3eg3XNTTRlv4a7ZAOZOakm5mNOEIwLUVq", "nivel_cargo": null, "usuario_tipo": "emissor", "atualizado_em": "2026-01-31T20:13:35.88078", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-31 22:12:06.050975
28	00000000000	admin	DELETE	funcionarios	4	{"id": 4, "cpf": "00000000000", "nome": "Administrador", "ativo": true, "email": "admin@qwork.com.br", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "admin", "criado_em": "2026-01-31T20:07:35.519694", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$yq904n8g6rPYTsWWymBKpu6sTrXCcei/e8YhAU.8bZ1pj1G8NWAry", "nivel_cargo": null, "usuario_tipo": "admin", "atualizado_em": "2026-01-31T20:07:35.519694", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-31 22:12:06.050975
29	00000000000	admin	INSERT	funcionarios	14	\N	{"id": 14, "cpf": "53051173991", "nome": "Sender Test", "ativo": true, "email": "sender@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-02-01T00:00:17.95762", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$tguLV0m0yt/vc6Co8yo6su5Wj9vdS0Pk4qRbJ025IEQ08lVG4x.hi", "nivel_cargo": null, "usuario_tipo": "emissor", "atualizado_em": "2026-02-01T00:00:17.95762", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-01 00:00:17.95762
30	00000000000	admin	INSERT	funcionarios	53051173991	\N	{"nome": "Sender Test", "email": "sender@qwork.com", "perfil": "emissor", "clinica_id": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Criação de emissor independente via admin	2026-02-01 00:00:17.990353
31	00000000000	admin	UPDATE	contratacao_personalizada	2	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-02-01 00:02:28.965639
34	87545772920	gestor_entidade	INSERT	funcionarios	18	\N	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-01 00:03:41.556705
35	87545772920	gestor_entidade	INSERT	funcionarios	19	\N	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-01 00:03:41.856846
38	87545772920	gestor_entidade	INSERT	lotes_avaliacao	1	\N	{"id": 1, "tipo": "completo", "codigo": "001-010226", "status": "ativo", "titulo": "Lote 1 - 001-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:34:48.820046", "descricao": "Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:34:48.820046", "liberado_por": "87545772920", "numero_ordem": 1, "atualizado_em": "2026-02-01T01:34:48.820046", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 01:34:48.820046
39	87545772920	gestor_entidade	INSERT	laudos	1	\N	{"id": 1, "job_id": null, "status": "rascunho", "lote_id": 1, "hash_pdf": null, "criado_em": "2026-02-01T01:34:48.820046", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-01T01:34:48.820046", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-01 01:34:48.820046
40	87545772920	gestor_entidade	INSERT	avaliacoes	1	\N	{"id": 1, "envio": null, "inicio": "2026-02-01T04:34:48.847", "status": "iniciada", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.85341", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:34:48.85341", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 01:34:48.85341
43	87545772920	gestor_entidade	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-02-01T04:34:48.847", "status": "iniciada", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.85341", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:34:48.85341", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-02-01T04:34:48.847", "status": "inativada", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.85341", "grupo_atual": 1, "inativada_em": "2026-02-01T01:35:27.863616-03:00", "atualizado_em": "2026-02-01T01:35:27.863616", "funcionario_cpf": "49510559024", "motivo_inativacao": "sfsf dfafdafadfad"}	\N	\N	Record updated	2026-02-01 01:35:27.863616
44	87545772920	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	1	\N	\N	\N	\N	Inativação de avaliação. Funcionário: DIMore Itali (49510559024). Lote: 001-010226. Motivo: sfsf dfafdafadfad	2026-02-01 01:35:27.883952
46	67136101026	funcionario	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-02-01T04:34:48.847", "status": "iniciada", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.870977", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:34:48.870977", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 2, "envio": "2026-02-01T01:36:13.9894", "inicio": "2026-02-01T04:34:48.847", "status": "concluida", "lote_id": 1, "criado_em": "2026-02-01T01:34:48.870977", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:36:13.9894", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-01 01:36:13.9894
47	67136101026	funcionario	UPDATE	lotes_avaliacao	1	{"id": 1, "tipo": "completo", "codigo": "001-010226", "status": "ativo", "titulo": "Lote 1 - 001-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:34:48.820046", "descricao": "Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:34:48.820046", "liberado_por": "87545772920", "numero_ordem": 1, "atualizado_em": "2026-02-01T01:34:48.820046", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 1, "tipo": "completo", "codigo": "001-010226", "status": "concluido", "titulo": "Lote 1 - 001-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:34:48.820046", "descricao": "Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:34:48.820046", "liberado_por": "87545772920", "numero_ordem": 1, "atualizado_em": "2026-02-01T01:36:13.9894", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-01 01:36:13.9894
48	67136101026	funcionario	UPDATE	funcionarios	18	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-01T01:36:14.024429", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-01 01:36:14.024429
49	87545772920	gestor_entidade	INSERT	lotes_avaliacao	2	\N	{"id": 2, "tipo": "completo", "codigo": "002-010226", "status": "ativo", "titulo": "Lote 2 - 002-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:57:53.66512", "descricao": "Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:57:53.66512", "liberado_por": "87545772920", "numero_ordem": 2, "atualizado_em": "2026-02-01T01:57:53.66512", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 01:57:53.66512
50	87545772920	gestor_entidade	INSERT	laudos	2	\N	{"id": 2, "job_id": null, "status": "rascunho", "lote_id": 2, "hash_pdf": null, "criado_em": "2026-02-01T01:57:53.66512", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-01T01:57:53.66512", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-01 01:57:53.66512
51	87545772920	gestor_entidade	INSERT	avaliacoes	3	\N	{"id": 3, "envio": null, "inicio": "2026-02-01T04:57:53.689", "status": "iniciada", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.697152", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:57:53.697152", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 01:57:53.697152
52	87545772920	gestor_entidade	INSERT	avaliacoes	4	\N	{"id": 4, "envio": null, "inicio": "2026-02-01T04:57:53.689", "status": "iniciada", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.70721", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:57:53.70721", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 01:57:53.70721
65	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	5	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 003-010226. Motivo: Agora gere q5 do arquivo *A1.pdf,\ngere q10 do arquivo *A2.pdf,\ngere q14 e q15 do arquivo *A3.pdf,. Validação: ATENCAO: Este funcionario ja tem 1 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-01 02:11:55.400514
54	87545772920	gestor_entidade	UPDATE	avaliacoes	4	{"id": 4, "envio": null, "inicio": "2026-02-01T04:57:53.689", "status": "iniciada", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.70721", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:57:53.70721", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 4, "envio": null, "inicio": "2026-02-01T04:57:53.689", "status": "inativada", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.70721", "grupo_atual": 1, "inativada_em": "2026-02-01T01:58:14.758566-03:00", "atualizado_em": "2026-02-01T01:58:14.758566", "funcionario_cpf": "67136101026", "motivo_inativacao": "dddsf gdssdggds gsgsdsd"}	\N	\N	Record updated	2026-02-01 01:58:14.758566
55	87545772920	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	4	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Jose do UP01 (67136101026). Lote: 002-010226. Motivo: dddsf gdssdggds gsgsdsd	2026-02-01 01:58:14.770169
57	49510559024	funcionario	UPDATE	avaliacoes	3	{"id": 3, "envio": null, "inicio": "2026-02-01T04:57:53.689", "status": "iniciada", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.697152", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:57:53.697152", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 3, "envio": "2026-02-01T01:58:51.550114", "inicio": "2026-02-01T04:57:53.689", "status": "concluida", "lote_id": 2, "criado_em": "2026-02-01T01:57:53.697152", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T01:58:51.550114", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-01 01:58:51.550114
58	49510559024	funcionario	UPDATE	lotes_avaliacao	2	{"id": 2, "tipo": "completo", "codigo": "002-010226", "status": "ativo", "titulo": "Lote 2 - 002-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:57:53.66512", "descricao": "Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:57:53.66512", "liberado_por": "87545772920", "numero_ordem": 2, "atualizado_em": "2026-02-01T01:57:53.66512", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 2, "tipo": "completo", "codigo": "002-010226", "status": "concluido", "titulo": "Lote 2 - 002-010226", "hash_pdf": null, "criado_em": "2026-02-01T01:57:53.66512", "descricao": "Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T01:57:53.66512", "liberado_por": "87545772920", "numero_ordem": 2, "atualizado_em": "2026-02-01T01:58:51.550114", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-01 01:58:51.550114
59	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T01:58:51.591012", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-01 01:58:51.591012
60	87545772920	gestor_entidade	INSERT	lotes_avaliacao	3	\N	{"id": 3, "tipo": "completo", "codigo": "003-010226", "status": "ativo", "titulo": "Lote 3 - 003-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:11:36.803161", "descricao": "Lote 3 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:11:36.803161", "liberado_por": "87545772920", "numero_ordem": 3, "atualizado_em": "2026-02-01T02:11:36.803161", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 02:11:36.803161
61	87545772920	gestor_entidade	INSERT	avaliacoes	5	\N	{"id": 5, "envio": null, "inicio": "2026-02-01T05:11:36.813", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.821323", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:11:36.821323", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 02:11:36.821323
62	87545772920	gestor_entidade	INSERT	avaliacoes	6	\N	{"id": 6, "envio": null, "inicio": "2026-02-01T05:11:36.813", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.828804", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:11:36.828804", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 02:11:36.828804
64	87545772920	gestor_entidade	UPDATE	avaliacoes	5	{"id": 5, "envio": null, "inicio": "2026-02-01T05:11:36.813", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.821323", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:11:36.821323", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 5, "envio": null, "inicio": "2026-02-01T05:11:36.813", "status": "inativada", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.821323", "grupo_atual": 1, "inativada_em": "2026-02-01T02:11:55.390599-03:00", "atualizado_em": "2026-02-01T02:11:55.390599", "funcionario_cpf": "67136101026", "motivo_inativacao": "Agora gere q5 do arquivo *A1.pdf,\\ngere q10 do arquivo *A2.pdf,\\ngere q14 e q15 do arquivo *A3.pdf,"}	\N	\N	Record updated	2026-02-01 02:11:55.390599
67	49510559024	funcionario	UPDATE	avaliacoes	6	{"id": 6, "envio": null, "inicio": "2026-02-01T05:11:36.813", "status": "iniciada", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.828804", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:11:36.828804", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 6, "envio": "2026-02-01T02:12:26.60542", "inicio": "2026-02-01T05:11:36.813", "status": "concluida", "lote_id": 3, "criado_em": "2026-02-01T02:11:36.828804", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:12:26.60542", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-01 02:12:26.60542
68	49510559024	funcionario	UPDATE	lotes_avaliacao	3	{"id": 3, "tipo": "completo", "codigo": "003-010226", "status": "ativo", "titulo": "Lote 3 - 003-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:11:36.803161", "descricao": "Lote 3 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:11:36.803161", "liberado_por": "87545772920", "numero_ordem": 3, "atualizado_em": "2026-02-01T02:11:36.803161", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 3, "tipo": "completo", "codigo": "003-010226", "status": "concluido", "titulo": "Lote 3 - 003-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:11:36.803161", "descricao": "Lote 3 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:11:36.803161", "liberado_por": "87545772920", "numero_ordem": 3, "atualizado_em": "2026-02-01T02:12:26.60542", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-01 02:12:26.60542
69	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T01:58:51.591012", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T02:12:26.642067", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-01 02:12:26.642067
70	53051173991	emissor	INSERT	laudos	3	\N	{"id": 3, "job_id": null, "status": "emitido", "lote_id": 3, "hash_pdf": "190a0ef5fc73d2fa5923cc8062ae620b0e7748eed8064b38a5a7b10a3c1e2fbd", "criado_em": "2026-02-01T02:14:02.874098", "emitido_em": "2026-02-01T02:14:02.874098", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado pelo emissor", "atualizado_em": "2026-02-01T02:14:02.874098", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-01 02:14:02.874098
71	87545772920	gestor_entidade	INSERT	lotes_avaliacao	4	\N	{"id": 4, "tipo": "completo", "codigo": "004-010226", "status": "ativo", "titulo": "Lote 4 - 004-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:22:13.055503", "descricao": "Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:22:13.055503", "liberado_por": "87545772920", "numero_ordem": 4, "atualizado_em": "2026-02-01T02:22:13.055503", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 02:22:13.055503
72	87545772920	gestor_entidade	INSERT	avaliacoes	7	\N	{"id": 7, "envio": null, "inicio": "2026-02-01T05:22:13.073", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.078853", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:22:13.078853", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 02:22:13.078853
73	87545772920	gestor_entidade	INSERT	avaliacoes	8	\N	{"id": 8, "envio": null, "inicio": "2026-02-01T05:22:13.073", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.086818", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:22:13.086818", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 02:22:13.086818
76	49510559024	funcionario	UPDATE	avaliacoes	8	{"id": 8, "envio": null, "inicio": "2026-02-01T05:22:13.073", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.086818", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:22:13.086818", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 8, "envio": "2026-02-01T02:22:58.849582", "inicio": "2026-02-01T05:22:13.073", "status": "concluida", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.086818", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:22:58.849582", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-01 02:22:58.849582
77	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T02:12:26.642067", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T02:22:58.874322", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-01 02:22:58.874322
78	87545772920	gestor_entidade	UPDATE	avaliacoes	7	{"id": 7, "envio": null, "inicio": "2026-02-01T05:22:13.073", "status": "iniciada", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.078853", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T02:22:13.078853", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 7, "envio": null, "inicio": "2026-02-01T05:22:13.073", "status": "inativada", "lote_id": 4, "criado_em": "2026-02-01T02:22:13.078853", "grupo_atual": 1, "inativada_em": "2026-02-01T02:23:23.236891-03:00", "atualizado_em": "2026-02-01T02:23:23.236891", "funcionario_cpf": "67136101026", "motivo_inativacao": "Remova tentativa de usar o banco de produção (NEON) de qquer código/teste/API, trigger, migração que seja diferente de produção… ou seja, para"}	\N	\N	Record updated	2026-02-01 02:23:23.236891
79	87545772920	gestor_entidade	UPDATE	lotes_avaliacao	4	{"id": 4, "tipo": "completo", "codigo": "004-010226", "status": "ativo", "titulo": "Lote 4 - 004-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:22:13.055503", "descricao": "Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:22:13.055503", "liberado_por": "87545772920", "numero_ordem": 4, "atualizado_em": "2026-02-01T02:22:13.055503", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 4, "tipo": "completo", "codigo": "004-010226", "status": "concluido", "titulo": "Lote 4 - 004-010226", "hash_pdf": null, "criado_em": "2026-02-01T02:22:13.055503", "descricao": "Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:22:13.055503", "liberado_por": "87545772920", "numero_ordem": 4, "atualizado_em": "2026-02-01T02:23:23.236891", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-01 02:23:23.236891
80	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	7	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 004-010226. Motivo: Remova tentativa de usar o banco de produção (NEON) de qquer código/teste/API, trigger, migração que seja diferente de produção… ou seja, para. Validação: ATENCAO: Este funcionario ja tem 2 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-01 02:23:23.269508
81	00000000000	admin	UPDATE	contratacao_personalizada	17	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1200, "numero_funcionarios": 120, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1200	2026-02-01 16:53:50.697401
84	00000000000	admin	UPDATE	contratacao_personalizada	18	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1440, "numero_funcionarios": 120, "valor_por_funcionario": 12}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 12/func, Total: R$ 1440	2026-02-01 16:56:51.751342
87	00000000000	admin	UPDATE	contratacao_personalizada	19	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1800, "numero_funcionarios": 120, "valor_por_funcionario": 15}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 15/func, Total: R$ 1800	2026-02-01 16:59:15.203685
90	04703084945	rh	INSERT	empresas_clientes	1	\N	{"id": 1, "cep": "46543123", "cnpj": "29489367000100", "nome": "Empresa Clin MedCO", "ativa": true, "email": "dffaaf@sffasasf.com", "cidade": "uipoiopi", "estado": "IO", "endereco": "ru aldsafjkjlk 32423", "telefone": "(34) 65465-4665", "criado_em": "2026-02-01T17:07:54.730307", "clinica_id": 2, "atualizado_em": "2026-02-01T17:07:54.730307", "contratante_id": null, "representante_fone": "64654878788", "representante_nome": "Rona dfsapipo", "representante_email": "eiopiope@hihuc.om"}	\N	\N	Record created	2026-02-01 17:07:54.730307
91	04703084945	rh	INSERT	funcionarios	29	\N	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-01 17:08:34.392935
430	87545772920	gestor_entidade	INSERT	avaliacoes	32	\N	{"id": 32, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "iniciada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.428591", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:01.428591", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:35:01.428591
92	04703084945	rh	INSERT	funcionarios	30	\N	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-01 17:08:34.827409
94	87545772920	gestor_entidade	INSERT	lotes_avaliacao	5	\N	{"id": 5, "tipo": "completo", "codigo": "005-010226", "status": "ativo", "titulo": "Lote 5 - 005-010226", "hash_pdf": null, "criado_em": "2026-02-01T17:10:16.832495", "descricao": "Lote 5 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T17:10:16.832495", "liberado_por": "87545772920", "numero_ordem": 5, "atualizado_em": "2026-02-01T17:10:16.832495", "contratante_id": 2, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 17:10:16.832495
95	87545772920	gestor_entidade	INSERT	avaliacoes	9	\N	{"id": 9, "envio": null, "inicio": "2026-02-01T20:10:16.845", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.849602", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:10:16.849602", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 17:10:16.849602
96	87545772920	gestor_entidade	INSERT	avaliacoes	10	\N	{"id": 10, "envio": null, "inicio": "2026-02-01T20:10:16.845", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.858091", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:10:16.858091", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 17:10:16.858091
98	04703084945	rh	INSERT	lotes_avaliacao	6	\N	{"id": 6, "tipo": "completo", "codigo": "006-010226", "status": "ativo", "titulo": "Lote 1 - 006-010226", "hash_pdf": null, "criado_em": "2026-02-01T17:16:51.417456", "descricao": "Lote 1 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-01T17:16:51.417456", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-02-01T17:16:51.417456", "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-01 17:16:51.417456
99	04703084945	rh	INSERT	avaliacoes	11	\N	{"id": 11, "envio": null, "inicio": "2026-02-01T20:16:51.419", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:16:51.417456", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 17:16:51.417456
100	04703084945	rh	INSERT	avaliacoes	12	\N	{"id": 12, "envio": null, "inicio": "2026-02-01T20:16:51.419", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:16:51.417456", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record created	2026-02-01 17:16:51.417456
102	04703084945	rh	UPDATE	avaliacoes	11	{"id": 11, "envio": null, "inicio": "2026-02-01T20:16:51.419", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:16:51.417456", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 11, "envio": null, "inicio": "2026-02-01T20:16:51.419", "status": "inativada", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": "2026-02-01T17:17:04.505985-03:00", "atualizado_em": "2026-02-01T17:17:04.505985", "funcionario_cpf": "04591894096", "motivo_inativacao": "ddsdsggsddgdgdgdg"}	\N	\N	Record updated	2026-02-01 17:17:04.505985
103	04703084945	rh	INATIVACAO_NORMAL	avaliacoes	11	\N	\N	\N	\N	Inativação de avaliação. Funcionário: DIMore Itali (04591894096). Lote: 006-010226. Motivo: ddsdsggsddgdgdgdg	2026-02-01 17:17:04.518619
105	04370683076	funcionario	UPDATE	avaliacoes	12	{"id": 12, "envio": null, "inicio": "2026-02-01T20:16:51.419", "status": "iniciada", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:16:51.417456", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 12, "envio": "2026-02-01T17:21:11.43397", "inicio": "2026-02-01T20:16:51.419", "status": "concluida", "lote_id": 6, "criado_em": "2026-02-01T17:16:51.417456", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:21:11.43397", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-01 17:21:11.43397
106	04370683076	funcionario	UPDATE	lotes_avaliacao	6	{"id": 6, "tipo": "completo", "codigo": "006-010226", "status": "ativo", "titulo": "Lote 1 - 006-010226", "hash_pdf": null, "criado_em": "2026-02-01T17:16:51.417456", "descricao": "Lote 1 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-01T17:16:51.417456", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-02-01T17:16:51.417456", "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 6, "tipo": "completo", "codigo": "006-010226", "status": "concluido", "titulo": "Lote 1 - 006-010226", "hash_pdf": null, "criado_em": "2026-02-01T17:16:51.417456", "descricao": "Lote 1 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-01T17:16:51.417456", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-02-01T17:21:11.43397", "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-01 17:21:11.43397
107	04370683076	funcionario	UPDATE	funcionarios	29	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-01T17:21:11.471034", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-01 17:21:11.471034
116	87545772920	gestor_entidade	INSERT	laudos	6	\N	{"id": 6, "job_id": null, "status": "emitido", "lote_id": 6, "hash_pdf": "b39b1b0b40960a28f2ee2693571e59bdcb11112dbc0cd1b7cf31fbb162e2605a", "criado_em": "2026-02-01T22:58:52.447057", "emitido_em": "2026-02-01T22:58:52.447057", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-01T22:58:52.447057", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-01 22:58:52.447057
431	87545772920	gestor_entidade	INSERT	avaliacoes	33	\N	{"id": 33, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "iniciada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.441855", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:01.441855", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:35:01.441855
432	87545772920	\N	liberar_lote	lotes_avaliacao	18	\N	\N	::1	\N	{"contratante_id":2,"contratante_nome":"RELEGERE","tipo":"completo","lote_id":18,"descricao":null,"data_filtro":null,"numero_ordem":13,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-04 00:35:01.449447
190	53051173991	emissor	INSERT	laudos	4	\N	{"id": 4, "job_id": null, "status": "emitido", "lote_id": 4, "hash_pdf": "25fb723936bcda7cfb988070e8e9be276bb6863383a6af81bcb395c4a3584162", "criado_em": "2026-02-02T06:25:06.184203", "emitido_em": "2026-02-02T06:25:06.184203", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T06:25:06.184203", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 06:25:06.184203
191	53051173991	emissor	UPDATE	lotes_avaliacao	4	{"id": 4, "tipo": "completo", "codigo": "004-010226", "status": "concluido", "titulo": "Lote 4 - 004-010226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-01T02:22:13.055503", "descricao": "Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:22:13.055503", "liberado_por": "87545772920", "numero_ordem": 4, "atualizado_em": "2026-02-01T02:23:23.236891", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 4, "tipo": "completo", "codigo": "004-010226", "status": "concluido", "titulo": "Lote 4 - 004-010226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-01T02:22:13.055503", "descricao": "Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": "2026-02-02T06:25:06.184203-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T02:22:13.055503", "liberado_por": "87545772920", "numero_ordem": 4, "atualizado_em": "2026-02-02T06:25:06.184203", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 06:25:06.184203
192	87545772920	gestor_entidade	UPDATE	avaliacoes	10	{"id": 10, "envio": null, "inicio": "2026-02-01T20:10:16.845", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.858091", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:10:16.858091", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 10, "envio": null, "inicio": "2026-02-01T20:10:16.845", "status": "inativada", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.858091", "grupo_atual": 1, "inativada_em": "2026-02-02T06:26:43.242134-03:00", "atualizado_em": "2026-02-02T06:26:43.242134", "funcionario_cpf": "49510559024", "motivo_inativacao": "2. Implementar políticas RLS para novas tabelas cxbcbx"}	\N	\N	Record updated	2026-02-02 06:26:43.242134
193	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	10	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: DIMore Itali (49510559024). Lote: 005-010226. Motivo: 2. Implementar políticas RLS para novas tabelas cxbcbx. Validação: ATENCAO: Este funcionario ja tem 1 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 06:26:43.264847
433	04703084945	\N	lote_criado	lotes_avaliacao	19	\N	\N	\N	\N	{"status": "ativo", "lote_id": 19, "empresa_id": 1, "numero_ordem": 4}	2026-02-04 00:35:44.892208
195	67136101026	funcionario	UPDATE	avaliacoes	9	{"id": 9, "envio": null, "inicio": "2026-02-01T20:10:16.845", "status": "iniciada", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.849602", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-01T17:10:16.849602", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 9, "envio": "2026-02-02T06:27:32.100939", "inicio": "2026-02-01T20:10:16.845", "status": "concluida", "lote_id": 5, "criado_em": "2026-02-01T17:10:16.849602", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:27:32.100939", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 06:27:32.100939
196	67136101026	funcionario	UPDATE	lotes_avaliacao	5	{"id": 5, "tipo": "completo", "codigo": "005-010226", "status": "ativo", "titulo": "Lote 5 - 005-010226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-01T17:10:16.832495", "descricao": "Lote 5 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T17:10:16.832495", "liberado_por": "87545772920", "numero_ordem": 5, "atualizado_em": "2026-02-01T17:10:16.832495", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 5, "tipo": "completo", "codigo": "005-010226", "status": "concluido", "titulo": "Lote 5 - 005-010226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-01T17:10:16.832495", "descricao": "Lote 5 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-01T17:10:16.832495", "liberado_por": "87545772920", "numero_ordem": 5, "atualizado_em": "2026-02-02T06:27:32.100939", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 06:27:32.100939
197	67136101026	funcionario	UPDATE	funcionarios	18	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-01T01:36:14.024429", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T06:27:32.139745", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 06:27:32.139745
198	87545772920	gestor_entidade	INSERT	lotes_avaliacao	7	\N	{"id": 7, "tipo": "completo", "codigo": "001-020226", "status": "ativo", "titulo": "Lote 6 - 001-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:31:00.282673", "descricao": "Lote 6 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:31:00.282673", "liberado_por": "87545772920", "numero_ordem": 6, "atualizado_em": "2026-02-02T06:31:00.282673", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 06:31:00.282673
199	87545772920	gestor_entidade	INSERT	avaliacoes	13	\N	{"id": 13, "envio": null, "inicio": "2026-02-02T09:31:00.293", "status": "iniciada", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.296917", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:31:00.296917", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 06:31:00.296917
200	87545772920	gestor_entidade	INSERT	avaliacoes	14	\N	{"id": 14, "envio": null, "inicio": "2026-02-02T09:31:00.293", "status": "iniciada", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.303718", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:31:00.303718", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 06:31:00.303718
202	87545772920	gestor_entidade	UPDATE	avaliacoes	13	{"id": 13, "envio": null, "inicio": "2026-02-02T09:31:00.293", "status": "iniciada", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.296917", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:31:00.296917", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 13, "envio": null, "inicio": "2026-02-02T09:31:00.293", "status": "inativada", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.296917", "grupo_atual": 1, "inativada_em": "2026-02-02T06:32:45.576008-03:00", "atualizado_em": "2026-02-02T06:32:45.576008", "funcionario_cpf": "49510559024", "motivo_inativacao": "| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |"}	\N	\N	Record updated	2026-02-02 06:32:45.576008
203	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	13	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: DIMore Itali (49510559024). Lote: 001-020226. Motivo: | [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |. Validação: ATENCAO: Este funcionario ja tem 2 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 06:32:45.586524
434	04703084945	rh	INSERT	laudos	19	\N	{"id": 19, "job_id": null, "status": "rascunho", "lote_id": 19, "hash_pdf": null, "criado_em": "2026-02-04T00:35:44.892208", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T00:35:44.892208", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 00:35:44.892208
205	67136101026	funcionario	UPDATE	avaliacoes	14	{"id": 14, "envio": null, "inicio": "2026-02-02T09:31:00.293", "status": "iniciada", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.303718", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:31:00.303718", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 14, "envio": "2026-02-02T06:33:16.087192", "inicio": "2026-02-02T09:31:00.293", "status": "concluida", "lote_id": 7, "criado_em": "2026-02-02T06:31:00.303718", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:33:16.087192", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 06:33:16.087192
206	67136101026	funcionario	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "001-020226", "status": "ativo", "titulo": "Lote 6 - 001-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:31:00.282673", "descricao": "Lote 6 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:31:00.282673", "liberado_por": "87545772920", "numero_ordem": 6, "atualizado_em": "2026-02-02T06:31:00.282673", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 7, "tipo": "completo", "codigo": "001-020226", "status": "concluido", "titulo": "Lote 6 - 001-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:31:00.282673", "descricao": "Lote 6 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:31:00.282673", "liberado_por": "87545772920", "numero_ordem": 6, "atualizado_em": "2026-02-02T06:33:16.087192", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 06:33:16.087192
207	67136101026	funcionario	UPDATE	funcionarios	18	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T06:27:32.139745", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T06:33:16.121342", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 06:33:16.121342
208	87545772920	gestor_entidade	INSERT	lotes_avaliacao	8	\N	{"id": 8, "tipo": "completo", "codigo": "002-020226", "status": "ativo", "titulo": "Lote 7 - 002-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:58:54.574932", "descricao": "Lote 7 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:58:54.574932", "liberado_por": "87545772920", "numero_ordem": 7, "atualizado_em": "2026-02-02T06:58:54.574932", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 06:58:54.574932
209	87545772920	gestor_entidade	INSERT	avaliacoes	15	\N	{"id": 15, "envio": null, "inicio": "2026-02-02T09:58:54.597", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.602504", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:58:54.602504", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 06:58:54.602504
210	87545772920	gestor_entidade	INSERT	avaliacoes	16	\N	{"id": 16, "envio": null, "inicio": "2026-02-02T09:58:54.597", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.610925", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:58:54.610925", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 06:58:54.610925
213	49510559024	funcionario	UPDATE	avaliacoes	15	{"id": 15, "envio": null, "inicio": "2026-02-02T09:58:54.597", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.602504", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:58:54.602504", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 15, "envio": "2026-02-02T06:59:33.767172", "inicio": "2026-02-02T09:58:54.597", "status": "concluida", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.602504", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:59:33.767172", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 06:59:33.767172
225	87545772920	gestor_entidade	UPDATE	avaliacoes	17	{"id": 17, "envio": null, "inicio": "2026-02-02T10:18:42.76", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.763083", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:18:42.763083", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 17, "envio": null, "inicio": "2026-02-02T10:18:42.76", "status": "inativada", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.763083", "grupo_atual": 1, "inativada_em": "2026-02-02T07:19:32.125337-03:00", "atualizado_em": "2026-02-02T07:19:32.125337", "funcionario_cpf": "67136101026", "motivo_inativacao": "| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |"}	\N	\N	Record updated	2026-02-02 07:19:32.125337
214	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-01T02:22:58.874322", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T06:59:33.788386", "indice_avaliacao": 7, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 06:59:33.788386
215	87545772920	gestor_entidade	UPDATE	avaliacoes	16	{"id": 16, "envio": null, "inicio": "2026-02-02T09:58:54.597", "status": "iniciada", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.610925", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T06:58:54.610925", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 16, "envio": null, "inicio": "2026-02-02T09:58:54.597", "status": "inativada", "lote_id": 8, "criado_em": "2026-02-02T06:58:54.610925", "grupo_atual": 1, "inativada_em": "2026-02-02T07:00:09.387487-03:00", "atualizado_em": "2026-02-02T07:00:09.387487", "funcionario_cpf": "67136101026", "motivo_inativacao": "| Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |"}	\N	\N	Record updated	2026-02-02 07:00:09.387487
216	87545772920	gestor_entidade	UPDATE	lotes_avaliacao	8	{"id": 8, "tipo": "completo", "codigo": "002-020226", "status": "ativo", "titulo": "Lote 7 - 002-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:58:54.574932", "descricao": "Lote 7 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:58:54.574932", "liberado_por": "87545772920", "numero_ordem": 7, "atualizado_em": "2026-02-02T06:58:54.574932", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 8, "tipo": "completo", "codigo": "002-020226", "status": "concluido", "titulo": "Lote 7 - 002-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T06:58:54.574932", "descricao": "Lote 7 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T06:58:54.574932", "liberado_por": "87545772920", "numero_ordem": 7, "atualizado_em": "2026-02-02T07:00:09.387487", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 07:00:09.387487
217	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	16	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 002-020226. Motivo: | Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |. Validação: ATENCAO: Este funcionario ja tem 3 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 07:00:09.408958
220	87545772920	gestor_entidade	INSERT	lotes_avaliacao	9	\N	{"id": 9, "tipo": "completo", "codigo": "003-020226", "status": "ativo", "titulo": "Lote 8 - 003-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:18:42.732589", "descricao": "Lote 8 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:18:42.732589", "liberado_por": "87545772920", "numero_ordem": 8, "atualizado_em": "2026-02-02T07:18:42.732589", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 07:18:42.732589
221	87545772920	gestor_entidade	INSERT	laudos	9	\N	{"id": 9, "job_id": null, "status": "rascunho", "lote_id": 9, "hash_pdf": null, "criado_em": "2026-02-02T07:18:42.732589", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T07:18:42.732589", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 07:18:42.732589
222	87545772920	gestor_entidade	INSERT	avaliacoes	17	\N	{"id": 17, "envio": null, "inicio": "2026-02-02T10:18:42.76", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.763083", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:18:42.763083", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 07:18:42.763083
223	87545772920	gestor_entidade	INSERT	avaliacoes	18	\N	{"id": 18, "envio": null, "inicio": "2026-02-02T10:18:42.76", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.770472", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:18:42.770472", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 07:18:42.770472
226	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	17	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 003-020226. Motivo: | [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |. Validação: ATENCAO: Este funcionario ja tem 4 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 07:19:32.139038
228	49510559024	funcionario	UPDATE	avaliacoes	18	{"id": 18, "envio": null, "inicio": "2026-02-02T10:18:42.76", "status": "iniciada", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.770472", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:18:42.770472", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 18, "envio": "2026-02-02T07:19:45.638541", "inicio": "2026-02-02T10:18:42.76", "status": "concluida", "lote_id": 9, "criado_em": "2026-02-02T07:18:42.770472", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:19:45.638541", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 07:19:45.638541
229	49510559024	funcionario	UPDATE	lotes_avaliacao	9	{"id": 9, "tipo": "completo", "codigo": "003-020226", "status": "ativo", "titulo": "Lote 8 - 003-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:18:42.732589", "descricao": "Lote 8 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:18:42.732589", "liberado_por": "87545772920", "numero_ordem": 8, "atualizado_em": "2026-02-02T07:18:42.732589", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 9, "tipo": "completo", "codigo": "003-020226", "status": "concluido", "titulo": "Lote 8 - 003-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:18:42.732589", "descricao": "Lote 8 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:18:42.732589", "liberado_por": "87545772920", "numero_ordem": 8, "atualizado_em": "2026-02-02T07:19:45.638541", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 07:19:45.638541
230	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T06:59:33.788386", "indice_avaliacao": 7, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T07:19:45.6759", "indice_avaliacao": 8, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 07:19:45.6759
232	87545772920	gestor_entidade	INSERT	lotes_avaliacao	10	\N	{"id": 10, "tipo": "completo", "codigo": "004-020226", "status": "ativo", "titulo": "Lote 9 - 004-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:50:59.105511", "descricao": "Lote 9 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:50:59.105511", "liberado_por": "87545772920", "numero_ordem": 9, "atualizado_em": "2026-02-02T07:50:59.105511", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 07:50:59.105511
233	87545772920	gestor_entidade	INSERT	laudos	10	\N	{"id": 10, "job_id": null, "status": "rascunho", "lote_id": 10, "hash_pdf": null, "criado_em": "2026-02-02T07:50:59.105511", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T07:50:59.105511", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 07:50:59.105511
234	87545772920	gestor_entidade	INSERT	avaliacoes	19	\N	{"id": 19, "envio": null, "inicio": "2026-02-02T10:50:59.132", "status": "iniciada", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.135924", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:50:59.135924", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 07:50:59.135924
235	87545772920	gestor_entidade	INSERT	avaliacoes	20	\N	{"id": 20, "envio": null, "inicio": "2026-02-02T10:50:59.132", "status": "iniciada", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.144002", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:50:59.144002", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 07:50:59.144002
237	87545772920	gestor_entidade	UPDATE	avaliacoes	20	{"id": 20, "envio": null, "inicio": "2026-02-02T10:50:59.132", "status": "iniciada", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.144002", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:50:59.144002", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 20, "envio": null, "inicio": "2026-02-02T10:50:59.132", "status": "inativada", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.144002", "grupo_atual": 1, "inativada_em": "2026-02-02T07:51:22.565902-03:00", "atualizado_em": "2026-02-02T07:51:22.565902", "funcionario_cpf": "49510559024", "motivo_inativacao": "| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |"}	\N	\N	Record updated	2026-02-02 07:51:22.565902
238	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	20	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: DIMore Itali (49510559024). Lote: 004-020226. Motivo: | [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |. Validação: ATENCAO: Este funcionario ja tem 3 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 07:51:22.577826
240	67136101026	funcionario	UPDATE	avaliacoes	19	{"id": 19, "envio": null, "inicio": "2026-02-02T10:50:59.132", "status": "iniciada", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.135924", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:50:59.135924", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 19, "envio": "2026-02-02T07:52:14.041671", "inicio": "2026-02-02T10:50:59.132", "status": "concluida", "lote_id": 10, "criado_em": "2026-02-02T07:50:59.135924", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T07:52:14.041671", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 07:52:14.041671
241	67136101026	funcionario	UPDATE	lotes_avaliacao	10	{"id": 10, "tipo": "completo", "codigo": "004-020226", "status": "ativo", "titulo": "Lote 9 - 004-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:50:59.105511", "descricao": "Lote 9 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:50:59.105511", "liberado_por": "87545772920", "numero_ordem": 9, "atualizado_em": "2026-02-02T07:50:59.105511", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 10, "tipo": "completo", "codigo": "004-020226", "status": "concluido", "titulo": "Lote 9 - 004-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T07:50:59.105511", "descricao": "Lote 9 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T07:50:59.105511", "liberado_por": "87545772920", "numero_ordem": 9, "atualizado_em": "2026-02-02T07:52:14.041671", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 07:52:14.041671
242	67136101026	funcionario	UPDATE	funcionarios	18	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T06:33:16.121342", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T07:52:14.07563", "indice_avaliacao": 9, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 07:52:14.07563
244	87545772920	gestor_entidade	INSERT	lotes_avaliacao	11	\N	{"id": 11, "tipo": "completo", "codigo": "005-020226", "status": "ativo", "titulo": "Lote 10 - 005-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T08:06:08.955264", "descricao": "Lote 10 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T08:06:08.955264", "liberado_por": "87545772920", "numero_ordem": 10, "atualizado_em": "2026-02-02T08:06:08.955264", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 08:06:08.955264
245	87545772920	gestor_entidade	INSERT	laudos	11	\N	{"id": 11, "job_id": null, "status": "rascunho", "lote_id": 11, "hash_pdf": null, "criado_em": "2026-02-02T08:06:08.955264", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T08:06:08.955264", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 08:06:08.955264
246	87545772920	gestor_entidade	INSERT	avaliacoes	21	\N	{"id": 21, "envio": null, "inicio": "2026-02-02T11:06:08.986", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-02T08:06:08.994458", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T08:06:08.994458", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 08:06:08.994458
247	87545772920	gestor_entidade	INSERT	avaliacoes	22	\N	{"id": 22, "envio": null, "inicio": "2026-02-02T11:06:08.986", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-02T08:06:09.001622", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T08:06:09.001622", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 08:06:09.001622
250	49510559024	funcionario	UPDATE	avaliacoes	21	{"id": 21, "envio": null, "inicio": "2026-02-02T11:06:08.986", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-02T08:06:08.994458", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T08:06:08.994458", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 21, "envio": "2026-02-02T08:09:30.05351", "inicio": "2026-02-02T11:06:08.986", "status": "concluida", "lote_id": 11, "criado_em": "2026-02-02T08:06:08.994458", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T08:09:30.05351", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 08:09:30.05351
307	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	27	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 008-020226. Motivo: "Anexe o PDF do laudo gerado localmente (máx. 1 MB). O sistema fará verificação de integridade e segurança e exibirá uma pré-visualização e o. Validação: ATENCAO: Este funcionario ja tem 6 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 14:34:05.563436
435	04703084945	rh	INSERT	avaliacoes	34	\N	{"id": 34, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "iniciada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.941824", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:44.941824", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:35:44.941824
251	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T07:19:45.6759", "indice_avaliacao": 8, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T08:09:30.075778", "indice_avaliacao": 10, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 08:09:30.075778
252	87545772920	gestor_entidade	UPDATE	avaliacoes	22	{"id": 22, "envio": null, "inicio": "2026-02-02T11:06:08.986", "status": "iniciada", "lote_id": 11, "criado_em": "2026-02-02T08:06:09.001622", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T08:06:09.001622", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 22, "envio": null, "inicio": "2026-02-02T11:06:08.986", "status": "inativada", "lote_id": 11, "criado_em": "2026-02-02T08:06:09.001622", "grupo_atual": 1, "inativada_em": "2026-02-02T08:10:01.448622-03:00", "atualizado_em": "2026-02-02T08:10:01.448622", "funcionario_cpf": "67136101026", "motivo_inativacao": "| Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |"}	\N	\N	Record updated	2026-02-02 08:10:01.448622
253	87545772920	gestor_entidade	UPDATE	lotes_avaliacao	11	{"id": 11, "tipo": "completo", "codigo": "005-020226", "status": "ativo", "titulo": "Lote 10 - 005-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T08:06:08.955264", "descricao": "Lote 10 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T08:06:08.955264", "liberado_por": "87545772920", "numero_ordem": 10, "atualizado_em": "2026-02-02T08:06:08.955264", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 11, "tipo": "completo", "codigo": "005-020226", "status": "concluido", "titulo": "Lote 10 - 005-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T08:06:08.955264", "descricao": "Lote 10 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T08:06:08.955264", "liberado_por": "87545772920", "numero_ordem": 10, "atualizado_em": "2026-02-02T08:10:01.448622", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 08:10:01.448622
254	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	22	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: Jose do UP01 (67136101026). Lote: 005-020226. Motivo: | Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |. Validação: ATENCAO: Este funcionario ja tem 5 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-02-02 08:10:01.472475
255	53051173991	emissor	UPDATE	laudos	11	{"id": 11, "job_id": null, "status": "rascunho", "lote_id": 11, "hash_pdf": null, "criado_em": "2026-02-02T08:06:08.955264", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T08:06:08.955264", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 11, "job_id": null, "status": "emitido", "lote_id": 11, "hash_pdf": "f22fa1021dcf819feb5ab8a9b9357daa6f26c79e80234897e77d9e96436f5321", "criado_em": "2026-02-02T08:06:08.955264", "emitido_em": "2026-02-02T08:10:36.064426", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T08:10:36.064426", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-02 08:10:36.064426
256	00000000000	admin	UPDATE	contratacao_personalizada	21	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1500, "numero_funcionarios": 100, "valor_por_funcionario": 15}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 15/func, Total: R$ 1500	2026-02-02 09:51:46.98054
259	15917295050	gestor_entidade	INSERT	funcionarios	34	\N	{"id": 34, "cpf": "40547513003", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-02T09:54:58.451457", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$4B1GzwgZr8auwLwuosMYJ.t5xMVPSZaJ.Ejg0vNwMz8RCxHg79NNO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-02T09:54:58.451457", "contratante_id": 21, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-02 09:54:58.451457
260	15917295050	gestor_entidade	INSERT	funcionarios	35	\N	{"id": 35, "cpf": "20533211050", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T09:54:58.451457", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$pXmyC4UwdMr.icT1XEDtteYWF9aR0NOIZIDtcdPEiLXuwWdibG0ye", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-02T09:54:58.451457", "contratante_id": 21, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-02 09:54:58.451457
261	15917295050	gestor_entidade	INSERT	lotes_avaliacao	12	\N	{"id": 12, "tipo": "completo", "codigo": "006-020226", "status": "ativo", "titulo": "Lote 11 - 006-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T09:55:08.685731", "descricao": "Lote 11 liberado para Teste fina entidade. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T09:55:08.685731", "liberado_por": "15917295050", "numero_ordem": 11, "atualizado_em": "2026-02-02T09:55:08.685731", "contratante_id": 21, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 09:55:08.685731
262	15917295050	gestor_entidade	INSERT	laudos	12	\N	{"id": 12, "job_id": null, "status": "rascunho", "lote_id": 12, "hash_pdf": null, "criado_em": "2026-02-02T09:55:08.685731", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T09:55:08.685731", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 09:55:08.685731
263	15917295050	gestor_entidade	INSERT	avaliacoes	23	\N	{"id": 23, "envio": null, "inicio": "2026-02-02T12:55:08.713", "status": "iniciada", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.717051", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T09:55:08.717051", "funcionario_cpf": "20533211050", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 09:55:08.717051
264	15917295050	gestor_entidade	INSERT	avaliacoes	24	\N	{"id": 24, "envio": null, "inicio": "2026-02-02T12:55:08.713", "status": "iniciada", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.725992", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T09:55:08.725992", "funcionario_cpf": "40547513003", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 09:55:08.725992
267	20533211050	funcionario	UPDATE	avaliacoes	23	{"id": 23, "envio": null, "inicio": "2026-02-02T12:55:08.713", "status": "iniciada", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.717051", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T09:55:08.717051", "funcionario_cpf": "20533211050", "motivo_inativacao": null}	{"id": 23, "envio": "2026-02-02T09:56:34.769039", "inicio": "2026-02-02T12:55:08.713", "status": "concluida", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.717051", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T09:56:34.769039", "funcionario_cpf": "20533211050", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 09:56:34.769039
268	20533211050	funcionario	UPDATE	funcionarios	35	{"id": 35, "cpf": "20533211050", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T09:54:58.451457", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$pXmyC4UwdMr.icT1XEDtteYWF9aR0NOIZIDtcdPEiLXuwWdibG0ye", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-02T09:54:58.451457", "contratante_id": 21, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 35, "cpf": "20533211050", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T09:54:58.451457", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$pXmyC4UwdMr.icT1XEDtteYWF9aR0NOIZIDtcdPEiLXuwWdibG0ye", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-02T09:54:58.451457", "contratante_id": 21, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T09:56:34.792268", "indice_avaliacao": 11, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 09:56:34.792268
269	15917295050	gestor_entidade	UPDATE	avaliacoes	24	{"id": 24, "envio": null, "inicio": "2026-02-02T12:55:08.713", "status": "iniciada", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.725992", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T09:55:08.725992", "funcionario_cpf": "40547513003", "motivo_inativacao": null}	{"id": 24, "envio": null, "inicio": "2026-02-02T12:55:08.713", "status": "inativada", "lote_id": 12, "criado_em": "2026-02-02T09:55:08.725992", "grupo_atual": 1, "inativada_em": "2026-02-02T09:57:01.585636-03:00", "atualizado_em": "2026-02-02T09:57:01.585636", "funcionario_cpf": "40547513003", "motivo_inativacao": "teste fial de inativação"}	\N	\N	Record updated	2026-02-02 09:57:01.585636
270	15917295050	gestor_entidade	UPDATE	lotes_avaliacao	12	{"id": 12, "tipo": "completo", "codigo": "006-020226", "status": "ativo", "titulo": "Lote 11 - 006-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T09:55:08.685731", "descricao": "Lote 11 liberado para Teste fina entidade. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T09:55:08.685731", "liberado_por": "15917295050", "numero_ordem": 11, "atualizado_em": "2026-02-02T09:55:08.685731", "contratante_id": 21, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 12, "tipo": "completo", "codigo": "006-020226", "status": "concluido", "titulo": "Lote 11 - 006-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T09:55:08.685731", "descricao": "Lote 11 liberado para Teste fina entidade. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T09:55:08.685731", "liberado_por": "15917295050", "numero_ordem": 11, "atualizado_em": "2026-02-02T09:57:01.585636", "contratante_id": 21, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 09:57:01.585636
271	15917295050	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	24	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Jose do Emp02  online (40547513003). Lote: 006-020226. Motivo: teste fial de inativação	2026-02-02 09:57:01.609292
272	53051173991	emissor	UPDATE	laudos	12	{"id": 12, "job_id": null, "status": "rascunho", "lote_id": 12, "hash_pdf": null, "criado_em": "2026-02-02T09:55:08.685731", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T09:55:08.685731", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 12, "job_id": null, "status": "emitido", "lote_id": 12, "hash_pdf": "42ef18971b7864f6d825beb3ac9afe1c5263e7d45f23a579aab2145813e1d33b", "criado_em": "2026-02-02T09:55:08.685731", "emitido_em": "2026-02-02T09:58:08.560009", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T09:58:08.560009", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-02 09:58:08.560009
273	00000000000	admin	UPDATE	contratacao_personalizada	22	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 4000, "numero_funcionarios": 200, "valor_por_funcionario": 20}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 20/func, Total: R$ 4000	2026-02-02 10:01:20.566884
276	13785514000	rh	INSERT	empresas_clientes	2	\N	{"id": 2, "cep": "15612156", "cnpj": "48218473000196", "nome": "Empresa CLciaj ipoipoi", "ativa": true, "email": "jklljk@hjkkh.com", "cidade": "jkljkljlkj", "estado": "OP", "endereco": "rua dsljdkalsl poiiop", "telefone": "(46) 54894-6564", "criado_em": "2026-02-02T10:05:08.64711", "clinica_id": 3, "atualizado_em": "2026-02-02T10:05:08.64711", "contratante_id": null, "representante_fone": "35546546554", "representante_nome": "Roaldo dsaoaipoi", "representante_email": "sdgioip@jhuhuc.omo"}	\N	\N	Record created	2026-02-02 10:05:08.64711
277	13785514000	rh	INSERT	funcionarios	39	\N	{"id": 39, "cpf": "48090382037", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.co", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-02T10:05:39.326451", "matricula": null, "clinica_id": 3, "empresa_id": 2, "senha_hash": "$2a$10$7kKODuWjgdehfotrADcyMe.QJqFadCGChdV1MMRUJlz/wWD0lGqVK", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-02T10:05:39.326451", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-02 10:05:39.326451
278	13785514000	rh	INSERT	funcionarios	40	\N	{"id": 40, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T10:05:39.616896", "matricula": null, "clinica_id": 3, "empresa_id": 2, "senha_hash": "$2a$10$x6h4/dlbHJK1iK9YnW1ap.DYUIWPffZRFWBrcjOqOSQsjqDnAWSBy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-02T10:05:39.616896", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-02 10:05:39.616896
285	13785514000	rh	INSERT	lotes_avaliacao	14	\N	{"id": 14, "tipo": "completo", "codigo": "007-020226", "status": "ativo", "titulo": "Lote 1 - 007-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T10:45:27.17818", "descricao": "Lote 1 liberado para Empresa CLciaj ipoipoi. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 2, "enviado_em": null, "liberado_em": "2026-02-02T10:45:27.17818", "liberado_por": "13785514000", "numero_ordem": 1, "atualizado_em": "2026-02-02T10:45:27.17818", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 10:45:27.17818
286	13785514000	rh	INSERT	laudos	14	\N	{"id": 14, "job_id": null, "status": "rascunho", "lote_id": 14, "hash_pdf": null, "criado_em": "2026-02-02T10:45:27.17818", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T10:45:27.17818", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 10:45:27.17818
287	13785514000	rh	INSERT	avaliacoes	25	\N	{"id": 25, "envio": null, "inicio": "2026-02-02T13:45:27.215", "status": "iniciada", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.230835", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T10:45:27.230835", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 10:45:27.230835
288	13785514000	rh	INSERT	avaliacoes	26	\N	{"id": 26, "envio": null, "inicio": "2026-02-02T13:45:27.215", "status": "iniciada", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.237743", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T10:45:27.237743", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 10:45:27.237743
290	06021796020	funcionario	UPDATE	avaliacoes	25	{"id": 25, "envio": null, "inicio": "2026-02-02T13:45:27.215", "status": "iniciada", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.230835", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T10:45:27.230835", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	{"id": 25, "envio": "2026-02-02T10:51:45.952865", "inicio": "2026-02-02T13:45:27.215", "status": "concluida", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.230835", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T10:51:45.952865", "funcionario_cpf": "06021796020", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 10:51:45.952865
291	06021796020	funcionario	UPDATE	funcionarios	40	{"id": 40, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T10:05:39.616896", "matricula": null, "clinica_id": 3, "empresa_id": 2, "senha_hash": "$2a$10$x6h4/dlbHJK1iK9YnW1ap.DYUIWPffZRFWBrcjOqOSQsjqDnAWSBy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-02T10:05:39.616896", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 40, "cpf": "06021796020", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-02T10:05:39.616896", "matricula": null, "clinica_id": 3, "empresa_id": 2, "senha_hash": "$2a$10$x6h4/dlbHJK1iK9YnW1ap.DYUIWPffZRFWBrcjOqOSQsjqDnAWSBy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-02T10:05:39.616896", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T10:51:45.977194", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 10:51:45.977194
293	13785514000	rh	UPDATE	avaliacoes	26	{"id": 26, "envio": null, "inicio": "2026-02-02T13:45:27.215", "status": "iniciada", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.237743", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T10:45:27.237743", "funcionario_cpf": "48090382037", "motivo_inativacao": null}	{"id": 26, "envio": null, "inicio": "2026-02-02T13:45:27.215", "status": "inativada", "lote_id": 14, "criado_em": "2026-02-02T10:45:27.237743", "grupo_atual": 1, "inativada_em": "2026-02-02T10:53:35.521408-03:00", "atualizado_em": "2026-02-02T10:53:35.521408", "funcionario_cpf": "48090382037", "motivo_inativacao": "dsggsd gsdgdsgsd"}	\N	\N	Record updated	2026-02-02 10:53:35.521408
294	13785514000	rh	UPDATE	lotes_avaliacao	14	{"id": 14, "tipo": "completo", "codigo": "007-020226", "status": "ativo", "titulo": "Lote 1 - 007-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T10:45:27.17818", "descricao": "Lote 1 liberado para Empresa CLciaj ipoipoi. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 2, "enviado_em": null, "liberado_em": "2026-02-02T10:45:27.17818", "liberado_por": "13785514000", "numero_ordem": 1, "atualizado_em": "2026-02-02T10:45:27.17818", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 14, "tipo": "completo", "codigo": "007-020226", "status": "concluido", "titulo": "Lote 1 - 007-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T10:45:27.17818", "descricao": "Lote 1 liberado para Empresa CLciaj ipoipoi. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 2, "enviado_em": null, "liberado_em": "2026-02-02T10:45:27.17818", "liberado_por": "13785514000", "numero_ordem": 1, "atualizado_em": "2026-02-02T10:53:35.521408", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 10:53:35.521408
295	13785514000	rh	INATIVACAO_NORMAL	avaliacoes	26	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Jose do Emp02  online (48090382037). Lote: 007-020226. Motivo: dsggsd gsdgdsgsd	2026-02-02 10:53:35.534638
296	53051173991	emissor	UPDATE	laudos	14	{"id": 14, "job_id": null, "status": "rascunho", "lote_id": 14, "hash_pdf": null, "criado_em": "2026-02-02T10:45:27.17818", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T10:45:27.17818", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 14, "job_id": null, "status": "emitido", "lote_id": 14, "hash_pdf": "fa7bf2946f97c9b5f3ea0fc9083906ca585eb43695b0e39c47ac3b037bc38ef5", "criado_em": "2026-02-02T10:45:27.17818", "emitido_em": "2026-02-02T10:54:23.814618", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T10:54:23.814618", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-02 10:54:23.814618
297	87545772920	gestor_entidade	INSERT	lotes_avaliacao	15	\N	{"id": 15, "tipo": "completo", "codigo": "008-020226", "status": "ativo", "titulo": "Lote 12 - 008-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T14:32:53.062068", "descricao": "Lote 12 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T14:32:53.062068", "liberado_por": "87545772920", "numero_ordem": 12, "atualizado_em": "2026-02-02T14:32:53.062068", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 14:32:53.062068
298	87545772920	gestor_entidade	INSERT	laudos	15	\N	{"id": 15, "job_id": null, "status": "rascunho", "lote_id": 15, "hash_pdf": null, "criado_em": "2026-02-02T14:32:53.062068", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T14:32:53.062068", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 14:32:53.062068
299	87545772920	gestor_entidade	INSERT	avaliacoes	27	\N	{"id": 27, "envio": null, "inicio": "2026-02-02T17:32:53.107", "status": "iniciada", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.117384", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T14:32:53.117384", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 14:32:53.117384
300	87545772920	gestor_entidade	INSERT	avaliacoes	28	\N	{"id": 28, "envio": null, "inicio": "2026-02-02T17:32:53.107", "status": "iniciada", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.127523", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T14:32:53.127523", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 14:32:53.127523
303	49510559024	funcionario	UPDATE	avaliacoes	28	{"id": 28, "envio": null, "inicio": "2026-02-02T17:32:53.107", "status": "iniciada", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.127523", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T14:32:53.127523", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 28, "envio": "2026-02-02T14:33:39.337378", "inicio": "2026-02-02T17:32:53.107", "status": "concluida", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.127523", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T14:33:39.337378", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 14:33:39.337378
304	49510559024	funcionario	UPDATE	funcionarios	19	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T08:09:30.075778", "indice_avaliacao": 10, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 19, "cpf": "49510559024", "nome": "DIMore Itali", "ativo": true, "email": "m8094322439.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.856846", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.856846", "contratante_id": 2, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T14:33:39.36412", "indice_avaliacao": 12, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 14:33:39.36412
305	87545772920	gestor_entidade	UPDATE	avaliacoes	27	{"id": 27, "envio": null, "inicio": "2026-02-02T17:32:53.107", "status": "iniciada", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.117384", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T14:32:53.117384", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 27, "envio": null, "inicio": "2026-02-02T17:32:53.107", "status": "inativada", "lote_id": 15, "criado_em": "2026-02-02T14:32:53.117384", "grupo_atual": 1, "inativada_em": "2026-02-02T14:34:05.533783-03:00", "atualizado_em": "2026-02-02T14:34:05.533783", "funcionario_cpf": "67136101026", "motivo_inativacao": "\\"Anexe o PDF do laudo gerado localmente (máx. 1 MB). O sistema fará verificação de integridade e segurança e exibirá uma pré-visualização e o"}	\N	\N	Record updated	2026-02-02 14:34:05.533783
306	87545772920	gestor_entidade	UPDATE	lotes_avaliacao	15	{"id": 15, "tipo": "completo", "codigo": "008-020226", "status": "ativo", "titulo": "Lote 12 - 008-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T14:32:53.062068", "descricao": "Lote 12 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T14:32:53.062068", "liberado_por": "87545772920", "numero_ordem": 12, "atualizado_em": "2026-02-02T14:32:53.062068", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 15, "tipo": "completo", "codigo": "008-020226", "status": "concluido", "titulo": "Lote 12 - 008-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T14:32:53.062068", "descricao": "Lote 12 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-02-02T14:32:53.062068", "liberado_por": "87545772920", "numero_ordem": 12, "atualizado_em": "2026-02-02T14:34:05.533783", "contratante_id": 2, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 14:34:05.533783
436	04703084945	rh	INSERT	avaliacoes	35	\N	{"id": 35, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "iniciada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.949009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:44.949009", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:35:44.949009
497	84943566073	rh	INSERT	avaliacoes	44	\N	{"id": 44, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "iniciada", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.558508", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:25:55.558508", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 06:25:55.558508
308	53051173991	emissor	UPDATE	laudos	15	{"id": 15, "job_id": null, "status": "rascunho", "lote_id": 15, "hash_pdf": null, "criado_em": "2026-02-02T14:32:53.062068", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T14:32:53.062068", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 15, "job_id": null, "status": "emitido", "lote_id": 15, "hash_pdf": "346a5226ea3cb841c28b27979c719620276e5957449093c7bcece81dec3ef6cd", "criado_em": "2026-02-02T14:32:53.062068", "emitido_em": "2026-02-02T14:36:37.059207", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T14:36:37.059207", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-02 14:36:37.059207
309	04703084945	rh	INSERT	lotes_avaliacao	16	\N	{"id": 16, "tipo": "completo", "codigo": "009-020226", "status": "ativo", "titulo": "Lote 2 - 009-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T15:03:20.926368", "descricao": "Lote 2 liberado para Empresa Clin MedCO. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-02T15:03:20.926368", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-02-02T15:03:20.926368", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 15:03:20.926368
310	04703084945	rh	INSERT	laudos	16	\N	{"id": 16, "job_id": null, "status": "rascunho", "lote_id": 16, "hash_pdf": null, "criado_em": "2026-02-02T15:03:20.926368", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T15:03:20.926368", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 15:03:20.926368
311	04703084945	rh	INSERT	avaliacoes	29	\N	{"id": 29, "envio": null, "inicio": "2026-02-02T18:03:21.018", "status": "iniciada", "lote_id": 16, "criado_em": "2026-02-02T15:03:21.026245", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:21.026245", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 15:03:21.026245
312	04703084945	rh	INSERT	lotes_avaliacao	17	\N	{"id": 17, "tipo": "completo", "codigo": "010-020226", "status": "ativo", "titulo": "Lote 3 - 010-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T15:03:26.264267", "descricao": "Lote 3 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-02T15:03:26.264267", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-02-02T15:03:26.264267", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record created	2026-02-02 15:03:26.264267
313	04703084945	rh	INSERT	laudos	17	\N	{"id": 17, "job_id": null, "status": "rascunho", "lote_id": 17, "hash_pdf": null, "criado_em": "2026-02-02T15:03:26.264267", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T15:03:26.264267", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-02 15:03:26.264267
314	04703084945	rh	INSERT	avaliacoes	30	\N	{"id": 30, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:26.296628", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 15:03:26.296628
315	04703084945	rh	INSERT	avaliacoes	31	\N	{"id": 31, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:26.301416", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record created	2026-02-02 15:03:26.301416
317	04591894096	funcionario	UPDATE	avaliacoes	29	{"id": 29, "envio": null, "inicio": "2026-02-02T18:03:21.018", "status": "iniciada", "lote_id": 16, "criado_em": "2026-02-02T15:03:21.026245", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:21.026245", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 29, "envio": "2026-02-02T15:13:49.503452", "inicio": "2026-02-02T18:03:21.018", "status": "concluida", "lote_id": 16, "criado_em": "2026-02-02T15:03:21.026245", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:13:49.503452", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-02 15:13:49.503452
318	04591894096	funcionario	UPDATE	lotes_avaliacao	16	{"id": 16, "tipo": "completo", "codigo": "009-020226", "status": "ativo", "titulo": "Lote 2 - 009-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T15:03:20.926368", "descricao": "Lote 2 liberado para Empresa Clin MedCO. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-02T15:03:20.926368", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-02-02T15:03:20.926368", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	{"id": 16, "tipo": "completo", "codigo": "009-020226", "status": "concluido", "titulo": "Lote 2 - 009-020226", "hash_pdf": null, "setor_id": null, "criado_em": "2026-02-02T15:03:20.926368", "descricao": "Lote 2 liberado para Empresa Clin MedCO. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 2, "emitido_em": null, "empresa_id": 1, "enviado_em": null, "liberado_em": "2026-02-02T15:03:20.926368", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-02-02T15:13:49.503452", "contratante_id": null, "modo_emergencia": false, "processamento_em": null, "motivo_emergencia": null, "motivo_cancelamento": null, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-02-02 15:13:49.503452
332	04703084945	rh	UPDATE	avaliacoes	31	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:08:19.039769", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:22:28.217983", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:22:28.217983
319	04591894096	funcionario	UPDATE	funcionarios	30	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T15:13:49.546919", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-02 15:13:49.546919
320	53051173991	emissor	UPDATE	laudos	16	{"id": 16, "job_id": null, "status": "rascunho", "lote_id": 16, "hash_pdf": null, "criado_em": "2026-02-02T15:03:20.926368", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-02T15:03:20.926368", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 16, "job_id": null, "status": "emitido", "lote_id": 16, "hash_pdf": "b2f9a8e7ff5b3befb4c47fe8795990baf9539fed4cf2e6431ffe3b151c0cd542", "criado_em": "2026-02-02T15:03:20.926368", "emitido_em": "2026-02-02T15:15:03.813074", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-02T15:15:03.813074", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-02 15:15:03.813074
321	00000000000	admin	INSERT	funcionarios	41	\N	{"id": 41, "cpf": "46011955002", "nome": "testse sdfpoopi", "ativo": true, "email": "fddsfsdf@dsfds.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-02-03T11:04:30.252267", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$1F7h9f8pXCXld0oL1qCdt.EMOxF7DEjD7NvcE9jpBv8RjLVKyS0Oy", "nivel_cargo": null, "usuario_tipo": "emissor", "atualizado_em": "2026-02-03T11:04:30.252267", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-03 11:04:30.252267
322	00000000000	admin	INSERT	funcionarios	46011955002	\N	{"nome": "testse sdfpoopi", "email": "fddsfsdf@dsfds.com", "perfil": "emissor", "clinica_id": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Criação de emissor independente via admin	2026-02-03 11:04:30.317428
327	00000000000	sistema	UPDATE	avaliacoes	31	{"id": 31, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:26.301416", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:05:09.865755", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:05:09.865755
328	00000000000	sistema	UPDATE	avaliacoes	30	{"id": 30, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-02T15:03:26.296628", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 30, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:05:09.890875", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:05:09.890875
329	04370683076	funcionario	UPDATE	avaliacoes	31	{"id": 31, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:05:09.865755", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:08:19.039769", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:08:19.039769
330	04370683076	funcionario	UPDATE	funcionarios	29	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-01T17:21:11.471034", "indice_avaliacao": 1, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-03T23:08:19.039769", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-03 23:08:19.039769
333	04591894096	funcionario	UPDATE	avaliacoes	30	{"id": 30, "envio": null, "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:05:09.890875", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 30, "envio": "2026-02-03T23:26:30.006689", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:26:30.006689", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:26:30.006689
334	04591894096	funcionario	UPDATE	funcionarios	30	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-02T15:13:49.546919", "indice_avaliacao": 2, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-03T23:26:30.006689", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-03 23:26:30.006689
335	04703084945	rh	UPDATE	avaliacoes	30	{"id": 30, "envio": "2026-02-03T23:26:30.006689", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:26:30.006689", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 30, "envio": "2026-02-03T23:26:30.006689", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:26:43.943072", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:26:43.943072
374	04591894096	funcionario	UPDATE	avaliacoes	30	{"id": 30, "envio": "2026-02-03T23:26:30.006689", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:26:43.943072", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 30, "envio": "2026-02-03T23:53:46.829823", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.296628", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:53:46.829823", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:53:46.829823
375	04591894096	funcionario	UPDATE	funcionarios	30	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-03T23:26:30.006689", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-03T23:53:46.829823", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-03 23:53:46.829823
376	04703084945	rh	UPDATE	avaliacoes	31	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:22:28.217983", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:59:28.938612", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-03 23:59:28.938612
429	87545772920	gestor_entidade	INSERT	laudos	18	\N	{"id": 18, "job_id": null, "status": "rascunho", "lote_id": 18, "hash_pdf": null, "criado_em": "2026-02-04T00:35:01.391754", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T00:35:01.391754", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 00:35:01.391754
420	04370683076	funcionario	UPDATE	avaliacoes	31	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "iniciada", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-03T23:59:28.938612", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:05:59.815865", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 00:05:59.815865
423	04703084945	rh	INSERT	funcionarios	42	\N	{"id": 42, "cpf": "47097293012", "nome": "João da Cpuves", "ativo": true, "email": "joao.24@empa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-04T00:22:07.995765", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mz8ZuYMLip1TPJzGfcOYquBbiCEqV5loJimCl6Q9xLxpAH8se/EAC", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T00:22:07.995765", "contratante_id": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 00:22:07.995765
424	04703084945	rh	INSERT	funcionarios	43	\N	{"id": 43, "cpf": "16985430007", "nome": "Mariana Maria", "ativo": true, "email": "rolnk123132l@jijij.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-04T00:22:08.291047", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$lg4/aLHxI8H3LE2xBjRfRutkTljTQ6DLJlEPCmdgKJCzdcGgmKsIK", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T00:22:08.291047", "contratante_id": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 00:22:08.291047
425	04370683076	funcionario	UPDATE	avaliacoes	31	{"id": 31, "envio": "2026-02-03T23:08:19.039769", "inicio": "2026-02-02T18:03:26.29", "status": "em_andamento", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:05:59.815865", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 31, "envio": "2026-02-04T00:34:22.770499", "inicio": "2026-02-02T18:03:26.29", "status": "concluida", "lote_id": 17, "criado_em": "2026-02-02T15:03:26.301416", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:34:22.770499", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 00:34:22.770499
426	04370683076	\N	lote_atualizado	lotes_avaliacao	17	\N	\N	\N	\N	{"status": "concluido", "lote_id": 17, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 00:34:22.770499
427	04370683076	funcionario	UPDATE	funcionarios	29	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-03T23:08:19.039769", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 29, "cpf": "04370683076", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.392935", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.392935", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-04T00:34:22.770499", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-04 00:34:22.770499
428	87545772920	\N	lote_criado	lotes_avaliacao	18	\N	\N	\N	\N	{"status": "ativo", "lote_id": 18, "empresa_id": null, "numero_ordem": 13}	2026-02-04 00:35:01.391754
439	04703084945	rh	UPDATE	avaliacoes	35	{"id": 35, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "iniciada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.949009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:44.949009", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	{"id": 35, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "inativada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.949009", "grupo_atual": 1, "inativada_em": "2026-02-04T00:54:00.502635-03:00", "atualizado_em": "2026-02-04T00:35:44.949009", "funcionario_cpf": "16985430007", "motivo_inativacao": "dadfaf afssafasas"}	\N	\N	Record updated	2026-02-04 00:54:00.502635
440	87545772920	gestor_entidade	UPDATE	avaliacoes	32	{"id": 32, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "iniciada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.428591", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:01.428591", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 32, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "inativada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.428591", "grupo_atual": 1, "inativada_em": "2026-02-04T00:54:38.481853-03:00", "atualizado_em": "2026-02-04T00:35:01.428591", "funcionario_cpf": "67136101026", "motivo_inativacao": "dd\\\\vcczzcx xzcbxcbxzzxb"}	\N	\N	Record updated	2026-02-04 00:54:38.481853
441	87545772920	gestor_entidade	UPDATE	avaliacoes	33	{"id": 33, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "iniciada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.441855", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:01.441855", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 33, "envio": null, "inicio": "2026-02-04T03:35:01.424", "status": "inativada", "lote_id": 18, "criado_em": "2026-02-04T00:35:01.441855", "grupo_atual": 1, "inativada_em": "2026-02-04T00:59:09.425557-03:00", "atualizado_em": "2026-02-04T00:35:01.441855", "funcionario_cpf": "49510559024", "motivo_inativacao": "dddsdsggdsgdsgds"}	\N	\N	Record updated	2026-02-04 00:59:09.425557
442	87545772920	\N	lote_atualizado	lotes_avaliacao	18	\N	\N	\N	\N	{"status": "cancelado", "lote_id": 18, "mudancas": {"status_novo": "cancelado", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 00:59:09.442716
443	87545772920	\N	lote_criado	lotes_avaliacao	20	\N	\N	\N	\N	{"status": "ativo", "lote_id": 20, "empresa_id": null, "numero_ordem": 14}	2026-02-04 00:59:34.585166
444	87545772920	gestor_entidade	INSERT	laudos	20	\N	{"id": 20, "job_id": null, "status": "rascunho", "lote_id": 20, "hash_pdf": null, "criado_em": "2026-02-04T00:59:34.585166", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T00:59:34.585166", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 00:59:34.585166
445	87545772920	gestor_entidade	INSERT	avaliacoes	36	\N	{"id": 36, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "iniciada", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.613877", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:59:34.613877", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:59:34.613877
446	87545772920	gestor_entidade	INSERT	avaliacoes	37	\N	{"id": 37, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "iniciada", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.625451", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:59:34.625451", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 00:59:34.625451
447	87545772920	\N	liberar_lote	lotes_avaliacao	20	\N	\N	::ffff:127.0.0.1	\N	{"contratante_id":2,"contratante_nome":"RELEGERE","tipo":"completo","lote_id":20,"descricao":null,"data_filtro":null,"numero_ordem":14,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-04 00:59:34.629454
448	04703084945	rh	UPDATE	avaliacoes	34	{"id": 34, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "iniciada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.941824", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:35:44.941824", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	{"id": 34, "envio": null, "inicio": "2026-02-04T03:35:44.937", "status": "inativada", "lote_id": 19, "criado_em": "2026-02-04T00:35:44.941824", "grupo_atual": 1, "inativada_em": "2026-02-04T00:59:52.033301-03:00", "atualizado_em": "2026-02-04T00:35:44.941824", "funcionario_cpf": "47097293012", "motivo_inativacao": "sgsdgdgdsgsdgs"}	\N	\N	Record updated	2026-02-04 00:59:52.033301
449	04703084945	\N	lote_atualizado	lotes_avaliacao	19	\N	\N	\N	\N	{"status": "cancelado", "lote_id": 19, "mudancas": {"status_novo": "cancelado", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 00:59:52.047852
450	04703084945	\N	lote_criado	lotes_avaliacao	21	\N	\N	\N	\N	{"status": "ativo", "lote_id": 21, "empresa_id": 1, "numero_ordem": 5}	2026-02-04 01:00:22.354935
451	04703084945	rh	INSERT	laudos	21	\N	{"id": 21, "job_id": null, "status": "rascunho", "lote_id": 21, "hash_pdf": null, "criado_em": "2026-02-04T01:00:22.354935", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T01:00:22.354935", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 01:00:22.354935
452	04703084945	rh	INSERT	avaliacoes	38	\N	{"id": 38, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.402282", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.402282", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 01:00:22.402282
453	04703084945	rh	INSERT	avaliacoes	39	\N	{"id": 39, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.409764", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.409764", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 01:00:22.409764
454	04703084945	rh	INSERT	avaliacoes	40	\N	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.414536", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 01:00:22.414536
455	04703084945	rh	INSERT	avaliacoes	41	\N	{"id": 41, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.421074", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.421074", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 01:00:22.421074
456	04703084945	rh	UPDATE	avaliacoes	39	{"id": 39, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.409764", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.409764", "funcionario_cpf": "16985430007", "motivo_inativacao": null}	{"id": 39, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "inativada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.409764", "grupo_atual": 1, "inativada_em": "2026-02-04T01:00:30.391141-03:00", "atualizado_em": "2026-02-04T01:00:22.409764", "funcionario_cpf": "16985430007", "motivo_inativacao": "sgsdggdsgds"}	\N	\N	Record updated	2026-02-04 01:00:30.391141
457	04703084945	rh	UPDATE	avaliacoes	41	{"id": 41, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.421074", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.421074", "funcionario_cpf": "04370683076", "motivo_inativacao": null}	{"id": 41, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "inativada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.421074", "grupo_atual": 1, "inativada_em": "2026-02-04T01:00:38.004578-03:00", "atualizado_em": "2026-02-04T01:00:22.421074", "funcionario_cpf": "04370683076", "motivo_inativacao": "dgssdsddsgdds"}	\N	\N	Record updated	2026-02-04 01:00:38.004578
458	04703084945	rh	UPDATE	avaliacoes	38	{"id": 38, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.402282", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.402282", "funcionario_cpf": "47097293012", "motivo_inativacao": null}	{"id": 38, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "inativada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.402282", "grupo_atual": 1, "inativada_em": "2026-02-04T01:00:46.089546-03:00", "atualizado_em": "2026-02-04T01:00:22.402282", "funcionario_cpf": "47097293012", "motivo_inativacao": "gdsdsgsdsdgsdgdsgdsdggds"}	\N	\N	Record updated	2026-02-04 01:00:46.089546
459	87545772920	gestor_entidade	UPDATE	avaliacoes	37	{"id": 37, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "iniciada", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.625451", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:59:34.625451", "funcionario_cpf": "49510559024", "motivo_inativacao": null}	{"id": 37, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "inativada", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.625451", "grupo_atual": 1, "inativada_em": "2026-02-04T01:01:03.804085-03:00", "atualizado_em": "2026-02-04T00:59:34.625451", "funcionario_cpf": "49510559024", "motivo_inativacao": "dgsdggsdgsdgsdgsd"}	\N	\N	Record updated	2026-02-04 01:01:03.804085
461	67136101026	funcionario	UPDATE	avaliacoes	36	{"id": 36, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "iniciada", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.613877", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T00:59:34.613877", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 36, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "em_andamento", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.613877", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:02:04.186519", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:02:04.186519
462	67136101026	funcionario	UPDATE	avaliacoes	36	{"id": 36, "envio": null, "inicio": "2026-02-04T03:59:34.609", "status": "em_andamento", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.613877", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:02:04.186519", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	{"id": 36, "envio": "2026-02-04T01:02:14.001815", "inicio": "2026-02-04T03:59:34.609", "status": "concluida", "lote_id": 20, "criado_em": "2026-02-04T00:59:34.613877", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:02:14.001815", "funcionario_cpf": "67136101026", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:02:14.001815
463	67136101026	\N	lote_atualizado	lotes_avaliacao	20	\N	\N	\N	\N	{"status": "concluido", "lote_id": 20, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 01:02:14.001815
464	67136101026	funcionario	UPDATE	funcionarios	18	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-02T07:52:14.07563", "indice_avaliacao": 9, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 18, "cpf": "67136101026", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfs553va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-01T00:03:41.556705", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-01T00:03:41.556705", "contratante_id": 2, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-04T01:02:14.001815", "indice_avaliacao": 14, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-04 01:02:14.001815
466	04591894096	funcionario	UPDATE	avaliacoes	40	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:00:22.414536", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "em_andamento", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:00.417607", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:03:00.417607
482	41384263020	\N	liberar_lote	lotes_avaliacao	22	\N	\N	::1	\N	{"contratante_id":23,"contratante_nome":"Final Entity","tipo":"completo","lote_id":22,"descricao":null,"data_filtro":null,"numero_ordem":15,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-04 06:19:53.083209
467	04703084945	rh	UPDATE	avaliacoes	40	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "em_andamento", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:00.417607", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:12.801375", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:03:12.801375
469	04591894096	funcionario	UPDATE	avaliacoes	40	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "iniciada", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:12.801375", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "em_andamento", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:27.731982", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:03:27.731982
470	04591894096	funcionario	UPDATE	avaliacoes	40	{"id": 40, "envio": null, "inicio": "2026-02-04T04:00:22.396", "status": "em_andamento", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:27.731982", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	{"id": 40, "envio": "2026-02-04T01:03:37.374758", "inicio": "2026-02-04T04:00:22.396", "status": "concluida", "lote_id": 21, "criado_em": "2026-02-04T01:00:22.414536", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T01:03:37.374758", "funcionario_cpf": "04591894096", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 01:03:37.374758
471	04591894096	\N	lote_atualizado	lotes_avaliacao	21	\N	\N	\N	\N	{"status": "concluido", "lote_id": 21, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 01:03:37.374758
472	04591894096	funcionario	UPDATE	funcionarios	30	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-03T23:53:46.829823", "indice_avaliacao": 3, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "04591894096", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-01T17:08:34.827409", "matricula": null, "clinica_id": 2, "empresa_id": 1, "senha_hash": "$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-01T17:08:34.827409", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-04T01:03:37.374758", "indice_avaliacao": 5, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-04 01:03:37.374758
473	00000000000	admin	UPDATE	contratacao_personalizada	23	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 750, "numero_funcionarios": 50, "valor_por_funcionario": 15}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 15/func, Total: R$ 750	2026-02-04 06:18:15.94844
476	41384263020	gestor_entidade	INSERT	funcionarios	47	\N	{"id": 47, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-04T06:19:46.483516", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$4ylVqkeYitzuO30ZPk2EgeupUbPqPFMKNbe6GveZa8ekgehV2.2OO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-04T06:19:46.483516", "contratante_id": 23, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 06:19:46.483516
477	41384263020	gestor_entidade	INSERT	funcionarios	48	\N	{"id": 48, "cpf": "01617198056", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk123132l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-04T06:19:46.483516", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$xqf.142WfyPVtoarpfxMCODI6suKT6M1kBAQADY9lyGtqGyFIyk3W", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-04T06:19:46.483516", "contratante_id": 23, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 06:19:46.483516
478	41384263020	\N	lote_criado	lotes_avaliacao	22	\N	\N	\N	\N	{"status": "ativo", "lote_id": 22, "empresa_id": null, "numero_ordem": 15}	2026-02-04 06:19:53.016799
479	41384263020	gestor_entidade	INSERT	laudos	22	\N	{"id": 22, "job_id": null, "status": "rascunho", "lote_id": 22, "hash_pdf": null, "criado_em": "2026-02-04T06:19:53.016799", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T06:19:53.016799", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 06:19:53.016799
480	41384263020	gestor_entidade	INSERT	avaliacoes	42	\N	{"id": 42, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "iniciada", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.069342", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:19:53.069342", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 06:19:53.069342
481	41384263020	gestor_entidade	INSERT	avaliacoes	43	\N	{"id": 43, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "iniciada", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.079053", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:19:53.079053", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 06:19:53.079053
484	59127761070	funcionario	UPDATE	avaliacoes	42	{"id": 42, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "iniciada", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.069342", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:19:53.069342", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	{"id": 42, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "em_andamento", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.069342", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:20:20.871909", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 06:20:20.871909
485	59127761070	funcionario	UPDATE	avaliacoes	42	{"id": 42, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "em_andamento", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.069342", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:20:20.871909", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	{"id": 42, "envio": "2026-02-04T06:20:45.365865", "inicio": "2026-02-04T09:19:53.057", "status": "concluida", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.069342", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:20:45.365865", "funcionario_cpf": "59127761070", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 06:20:45.365865
486	59127761070	funcionario	UPDATE	funcionarios	47	{"id": 47, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-04T06:19:46.483516", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$4ylVqkeYitzuO30ZPk2EgeupUbPqPFMKNbe6GveZa8ekgehV2.2OO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-04T06:19:46.483516", "contratante_id": 23, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 47, "cpf": "59127761070", "nome": "Jaiemx o1", "ativo": true, "email": "joao.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-04T06:19:46.483516", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$4ylVqkeYitzuO30ZPk2EgeupUbPqPFMKNbe6GveZa8ekgehV2.2OO", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_entidade", "atualizado_em": "2026-02-04T06:19:46.483516", "contratante_id": 23, "data_nascimento": "2010-12-12", "data_ultimo_lote": "2026-02-04T06:20:45.365865", "indice_avaliacao": 15, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-04 06:20:45.365865
487	41384263020	gestor_entidade	UPDATE	avaliacoes	43	{"id": 43, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "iniciada", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.079053", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:19:53.079053", "funcionario_cpf": "01617198056", "motivo_inativacao": null}	{"id": 43, "envio": null, "inicio": "2026-02-04T09:19:53.057", "status": "inativada", "lote_id": 22, "criado_em": "2026-02-04T06:19:53.079053", "grupo_atual": 1, "inativada_em": "2026-02-04T06:21:03.953942-03:00", "atualizado_em": "2026-02-04T06:19:53.079053", "funcionario_cpf": "01617198056", "motivo_inativacao": "dfddffddssf daffdfdfda"}	\N	\N	Record updated	2026-02-04 06:21:03.953942
488	41384263020	\N	lote_atualizado	lotes_avaliacao	22	\N	\N	\N	\N	{"status": "concluido", "lote_id": 22, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 06:21:03.953942
489	00000000000	admin	UPDATE	contratacao_personalizada	24	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1562.5, "numero_funcionarios": 125, "valor_por_funcionario": 12.5}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 12.5/func, Total: R$ 1562.5	2026-02-04 06:23:06.878346
492	84943566073	rh	INSERT	empresas_clientes	3	\N	{"id": 3, "cep": "45612456", "cnpj": "77713547000169", "nome": "empresa clinic afianl", "ativa": true, "email": "fadfad@sdgd.com", "cidade": "puioui", "estado": "UI", "endereco": "ru fdskçl 234", "telefone": "(64) 65489-7989", "criado_em": "2026-02-04T06:24:42.692106", "clinica_id": 4, "atualizado_em": "2026-02-04T06:24:42.692106", "contratante_id": null, "representante_fone": "46897897987", "representante_nome": "respo cliniemp 01", "representante_email": "45jlkjlk@jhi.cio"}	\N	\N	Record created	2026-02-04 06:24:42.692106
493	84943566073	rh	INSERT	funcionarios	52	\N	{"id": 52, "cpf": "19778990050", "nome": "Jaiemx o1", "ativo": true, "email": "jorwerwero.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-04T06:25:50.328038", "matricula": null, "clinica_id": 4, "empresa_id": 3, "senha_hash": "$2a$10$rK.MUWh3EK5AKTq8wqc7GOBFtZynKxu.BkcS8nmd1tsDJOxPVqyqC", "nivel_cargo": "operacional", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T06:25:50.328038", "contratante_id": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 06:25:50.328038
494	84943566073	rh	INSERT	funcionarios	53	\N	{"id": 53, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-04T06:25:50.656205", "matricula": null, "clinica_id": 4, "empresa_id": 3, "senha_hash": "$2a$10$qX3mPBvmWfdZim0LBY2zrOy6EG15sbzupXzvJXcZHNz4P7LLuU3FG", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T06:25:50.656205", "contratante_id": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-04 06:25:50.656205
495	84943566073	\N	lote_criado	lotes_avaliacao	23	\N	\N	\N	\N	{"status": "ativo", "lote_id": 23, "empresa_id": 3, "numero_ordem": 1}	2026-02-04 06:25:55.520552
496	84943566073	rh	INSERT	laudos	23	\N	{"id": 23, "job_id": null, "status": "rascunho", "lote_id": 23, "hash_pdf": null, "criado_em": "2026-02-04T06:25:55.520552", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T06:25:55.520552", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-04 06:25:55.520552
498	84943566073	rh	INSERT	avaliacoes	45	\N	{"id": 45, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "iniciada", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.568715", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:25:55.568715", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-04 06:25:55.568715
499	84943566073	rh	UPDATE	avaliacoes	44	{"id": 44, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "iniciada", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.558508", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:25:55.558508", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	{"id": 44, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "inativada", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.558508", "grupo_atual": 1, "inativada_em": "2026-02-04T06:26:08.723842-03:00", "atualizado_em": "2026-02-04T06:25:55.558508", "funcionario_cpf": "19778990050", "motivo_inativacao": "zvvzvz zvvzxvzxxvx"}	\N	\N	Record updated	2026-02-04 06:26:08.723842
501	34624832000	funcionario	UPDATE	avaliacoes	45	{"id": 45, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "iniciada", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.568715", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:25:55.568715", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 45, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "em_andamento", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.568715", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:26:26.714532", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 06:26:26.714532
502	34624832000	funcionario	UPDATE	avaliacoes	45	{"id": 45, "envio": null, "inicio": "2026-02-04T09:25:55.555", "status": "em_andamento", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.568715", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:26:26.714532", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 45, "envio": "2026-02-04T06:26:40.768236", "inicio": "2026-02-04T09:25:55.555", "status": "concluida", "lote_id": 23, "criado_em": "2026-02-04T06:25:55.568715", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-02-04T06:26:40.768236", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-04 06:26:40.768236
503	34624832000	\N	lote_atualizado	lotes_avaliacao	23	\N	\N	\N	\N	{"status": "concluido", "lote_id": 23, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null, "processamento_em": null}	2026-02-04 06:26:40.768236
504	34624832000	funcionario	UPDATE	funcionarios	53	{"id": 53, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-04T06:25:50.656205", "matricula": null, "clinica_id": 4, "empresa_id": 3, "senha_hash": "$2a$10$qX3mPBvmWfdZim0LBY2zrOy6EG15sbzupXzvJXcZHNz4P7LLuU3FG", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T06:25:50.656205", "contratante_id": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 53, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-04T06:25:50.656205", "matricula": null, "clinica_id": 4, "empresa_id": 3, "senha_hash": "$2a$10$qX3mPBvmWfdZim0LBY2zrOy6EG15sbzupXzvJXcZHNz4P7LLuU3FG", "nivel_cargo": "gestao", "usuario_tipo": "funcionario_clinica", "atualizado_em": "2026-02-04T06:25:50.656205", "contratante_id": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-04T06:26:40.768236", "indice_avaliacao": 1, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-04 06:26:40.768236
506	53051173991	emissor	UPDATE	laudos	21	{"id": 21, "job_id": null, "status": "rascunho", "lote_id": 21, "hash_pdf": null, "criado_em": "2026-02-04T01:00:22.354935", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T01:00:22.354935", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 21, "job_id": null, "status": "emitido", "lote_id": 21, "hash_pdf": "10535d9c2f45255f8256fdd326c4bbad568a010711dff8c92491acbfc822684d", "criado_em": "2026-02-04T01:00:22.354935", "emitido_em": "2026-02-04T08:57:58.044569", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-04T08:57:58.044569", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-04 08:57:58.044569
507	53051173991	emissor	UPDATE	laudos	20	{"id": 20, "job_id": null, "status": "rascunho", "lote_id": 20, "hash_pdf": null, "criado_em": "2026-02-04T00:59:34.585166", "emitido_em": null, "enviado_em": null, "emissor_cpf": null, "observacoes": null, "atualizado_em": "2026-02-04T00:59:34.585166", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	{"id": 20, "job_id": null, "status": "emitido", "lote_id": 20, "hash_pdf": "9a79f654a6585158ee43ad25ed3bfc446b14f906f098e8f1c25ef1ac4fc08c49", "criado_em": "2026-02-04T00:59:34.585166", "emitido_em": "2026-02-04T09:03:27.145605", "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": null, "atualizado_em": "2026-02-04T09:03:27.145605", "arquivo_remoto_key": null, "arquivo_remoto_url": null, "arquivo_remoto_bucket": null, "arquivo_remoto_provider": null}	\N	\N	Record updated	2026-02-04 09:03:27.145605
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, entidade_tipo, entidade_id, acao, status_anterior, status_novo, usuario_cpf, usuario_perfil, ip_address, user_agent, dados_alterados, metadados, hash_operacao, criado_em) FROM stdin;
1	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	f68dd8735ca939a034d5f9f67404cab97cad62accd28e4d6bc8f214c78ad02a1	2026-01-31 20:16:33.513347
2	login	1	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	ec1147f8af154f0e13fc65e3c02306e06404a5d5cb18b7934ed8898a8e8e65f6	2026-01-31 20:20:51.538737
3	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	117c3497d02f69dfd31a9072dc5a9be453b5b0fa99bceffb7f0c88f6db38d60e	2026-02-01 00:03:11.932569
4	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	2dac320db5630f9032b9ac682843c194a32d2512194363ed363966d4ddef5332	2026-02-01 00:21:10.86551
5	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	655e66664ad52d40f8209d82496c62f62e10e01fc61798c7ace7b37fb0494d00	2026-02-01 01:18:37.789558
6	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	b69139e60530f280d92e335da3bdaff90230dcc229b14fb0f7f528d4441f2f67	2026-02-01 02:30:42.787919
7	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	5595a5475a0d001f3fdede7c6cf50f6e7263f60bb2172a1c6036d9405462ab4a	2026-02-01 02:32:10.971333
8	login	20	login_falha	\N	\N	04703084945	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "contratante_inativo"}	2cda4abd1f99176a4831d98f65ee9a729832af80a7f187b260b25e1d784167a5	2026-02-01 17:00:06.304049
9	login	20	login_falha	\N	\N	04703084945	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "contratante_inativo"}	e5bce7a358e99ef7ee9317972e6ea7264366f12649e019d6faa2e0b18f7a642f	2026-02-01 17:01:04.635682
10	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	00ab80d51e3ac3bf209c5f75d53b787b8e10017acdbed5f295186925f119581d	2026-02-01 17:06:48.786132
11	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	4f7eca2bbc8c93cc1d9ac647d9fb95cbf7390948a6a2d6f3f0321358c432d60e	2026-02-01 17:06:54.821618
12	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	06d5ae9f6fe5bf20baded7d340c212c8d7209f19750c8023df7d1cb76c56cfb7	2026-02-01 17:10:08.623154
13	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	6e86be77190630a8f1f20de9fcbc60061c6b9a0b0698c57cbe7503a8224ce21b	2026-02-01 18:14:23.526314
14	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	6bb27e0b738425c794e8f5f9e3ffafd25309dda6d5c62c2de225903159e2814e	2026-02-01 18:42:26.118987
15	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	d72319af28878e3da1da57aa44c7b5d13253ec230eb5faf5c4bab20fc859c956	2026-02-01 22:57:26.890934
16	login	2	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	1e50ade6e50df9c8ae140aa49a70b2f187fbf8b3bd6d3a09bc25e5789197dea3	2026-02-02 07:55:11.822582
17	login	2	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	823c93e0911c2adcb6d42223bb8fa1d4b099e96f5d2490454d32dd9bb961817e	2026-02-02 07:55:13.732691
18	login	2	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	7eccbec3ff88ec58932311355c5447dcf4b6a4d5943a04ce3f0481bd55c09b5e	2026-02-02 07:55:19.563759
19	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	7e16f2ed4672006c4772c5c6207e909fa793605b6a0be5fee85eb8914c50d3af	2026-02-02 07:55:25.213614
20	login	21	login_falha	\N	\N	15917295050	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	3f5a90f8ece4d4a247fa9c161c6e3311da002407f9773987426e06832d4fb8c9	2026-02-02 09:53:22.157521
21	login	21	login_sucesso	\N	\N	15917295050	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	4e7e645a97a500a1c07d8ce1a20b9fb13ac3a76c7d0b6580bdb1e1e077d32a07	2026-02-02 09:53:43.121964
22	login	21	login_sucesso	\N	\N	15917295050	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	09ca64e5fed938c41b78977463a3005751af68b1c70b6f8ae75779dca248b8aa	2026-02-02 09:55:46.060553
23	login	22	login_sucesso	\N	\N	13785514000	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	014ce38eb631f821931c6c5c0b33194d8a05cf9ddf834ca56522833fca1274f9	2026-02-02 10:03:46.926698
24	login	22	login_sucesso	\N	\N	13785514000	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	fcc4ea7bf6d5dd6d83df34c47665eb43633e32787232caddc1e3e9f5a389008a	2026-02-02 10:32:27.866761
25	login	21	login_sucesso	\N	\N	15917295050	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	4416ccca921b6d1f6b689c879ef7fd8247f25f18b599abb2cdbc1862a171b567	2026-02-02 10:55:34.790576
26	login	22	login_sucesso	\N	\N	13785514000	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	db3e142d4d69b98bf24973d5c0b19eb69a897d3e512cbdf07526f00ea172e9fa	2026-02-02 10:57:36.442772
27	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	69f0627ad8b93552a0ff1b4ad4cf826bf170530ae151020baf0272e2408ece40	2026-02-02 14:32:44.010024
28	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	00a091d9c443f08ac805097bfc4992b174763f625d7862b8b16119de15a01396	2026-02-02 15:02:57.595646
29	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	5e0ab82e154a07a41dfc152d5a1116b741d28cc91e5c7fb83e816b18c95181cb	2026-02-03 07:21:14.483119
30	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	3d9757c990c426a80d0cb7a2dba19453b4beab83350df775f8207ebfc1c9cfae	2026-02-03 08:42:53.366542
31	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	a869c3d5f632daafe3e0f4371efae9c733bbc764f57e4aac2ea1c1c13e0af65b	2026-02-03 19:32:15.891589
32	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	bcbda060c1ff5dd55007695509061548a090e24e3d41d85c3784a9cdb841bea7	2026-02-03 19:32:37.402886
33	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	0533e769b5e7dbf1e6bb336949ab2eee93b033e95967fcb6c457fda68f0b3758	2026-02-03 20:15:24.607832
34	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	c91c4050250fd986aa7e0a4b7cd2d7591d881777c2c97878c3940d948d66c936	2026-02-03 20:15:33.431498
35	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	e7ec3302682a0d6406f71e3c0280133f7176d273e845b22e5d77631a90704e42	2026-02-03 21:09:35.396816
36	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	418e20c166d793a2713b0c66ba9a9437044e9742ec1a99f832caf3023c0dacab	2026-02-03 21:49:36.937557
37	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	9830bc8bb45bb6f66df9fee372309e1f43fa46a4e3f69c766ed116c1b752fee6	2026-02-03 21:53:09.331244
38	login	2	login_falha	\N	\N	87545772920	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	e04c9c467866d5fd28a9222e014435aa62493f5ffd0f60fe5788ca37f81c1b21	2026-02-03 23:24:55.788418
39	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	cd66ba27b53682b7ce1d27021b7abc4d85002f360be5a75eae691d7a4531e109	2026-02-03 23:25:00.585104
40	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	be8b749f43acc1b9ffa95e9a1a0a5eef2f98f61aa56c76d2b3300f5d5bc14638	2026-02-03 23:27:20.667928
41	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	41e34f1ee60f1454e79d6c9ddcee2bbc310ec9df3ebf939af34fc499eb057069	2026-02-04 00:06:12.371792
42	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	11e0ce0622b2737b3df675288624bee979182ff9f432e984acc24aebce4293fb	2026-02-04 00:21:04.245003
43	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	33b3604e79622510510b22dfb00f771b4a8e0a663283b1b89f15dc02b4805798	2026-02-04 00:34:43.110816
44	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	39584c7124b3a3e045d8192fd7a5455c18af2c631160aa1d259b88b5aeb2fb73	2026-02-04 00:35:34.896084
45	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	56398870a485cd135e8a53e2a565dedcdc8546703b99424d1ac76d9f1a5e1821	2026-02-04 00:52:01.495181
46	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	71e8de11d98de9f525f9bf6015bfdd8c4497287e423a850da0570400608a0cc1	2026-02-04 01:01:36.583505
47	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	a85c0512273dd559309c0556554d794b9d33eba6171f4b79b6ec2b18d44765bc	2026-02-04 01:02:34.347281
48	login	23	login_sucesso	\N	\N	41384263020	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	7464759d110a736cd545b30ebbe793d88d6fda8cee2005e9fc5e0e86104fcc37	2026-02-04 06:19:00.690854
49	login	24	login_sucesso	\N	\N	84943566073	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 4, "tipo_contratante": "clinica"}	94a73bebf474ea366cbcb55f11633b094e98eb26e52e2142b99cceea09cafdd4	2026-02-04 06:23:47.02501
50	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	41f5a80353204f18205ab8458771135dff5a3fe503af5372a009ef57668cce16	2026-02-04 07:59:33.099772
51	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	2cb3af8826e984a6459dd181057d27822e6a0d77a573e43fa6403df63d1839e5	2026-02-04 07:59:39.618029
52	login	19	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	319c3e4c5788fd0d67c3699a400d213a956fbe20c15c0ebfc2b44a64af620b24	2026-02-04 08:03:02.146544
53	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	c840bd84f49fef6d2da00420e9565a387ac5e50135b33dcf345b56f4be9db7f7	2026-02-04 08:28:19.167187
54	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	192022f17b134d0a8631d9a52aea82b1714de47cf892dcb0f53b094f508223fe	2026-02-04 08:59:08.88759
55	login	2	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	8554b5f6f054511cafe176614d791c15b27860e269ac4366965d641c67473eff	2026-02-04 09:04:59.006248
56	login	19	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 2, "tipo_contratante": "clinica"}	df138bebda8faf84292bcf1c06294a12754825ff44d37d3a659a9d7de196a04c	2026-02-04 09:05:27.992683
\.


--
-- Data for Name: auditoria_laudos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria_laudos (id, lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, observacoes, criado_em, solicitado_por, tipo_solicitante, tentativas, erro) FROM stdin;
27	1	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-01 02:40:21.969439	87545772920	gestor_entidade	0	\N
28	2	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-01 02:40:21.969439	87545772920	gestor_entidade	0	\N
29	4	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-01 02:40:21.969439	87545772920	gestor_entidade	0	\N
30	6	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-01 17:21:36.738616	04703084945	rh	0	\N
31	8	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 07:15:53.66158	87545772920	gestor_entidade	0	\N
32	9	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 07:20:14.406143	87545772920	gestor_entidade	0	\N
33	10	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 07:52:51.433757	87545772920	gestor_entidade	0	\N
34	11	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 08:10:12.162017	87545772920	gestor_entidade	0	\N
35	12	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 09:57:10.529966	15917295050	gestor_entidade	0	\N
36	14	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 10:54:02.977509	13785514000	rh	0	\N
37	15	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 14:35:58.099256	87545772920	gestor_entidade	0	\N
38	16	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-02 15:14:44.008158	04703084945	rh	0	\N
41	21	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-04 08:38:15.664039	04703084945	rh	0	\N
1	1	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 001-010226	2026-02-01 01:54:05.906277	87545772920	\N	0	\N
2	2	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 002-010226	2026-02-01 01:59:07.638009	87545772920	\N	0	\N
3	2	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 002-010226	2026-02-01 02:01:33.202352	87545772920	\N	0	\N
4	3	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 003-010226	2026-02-01 02:12:40.462963	87545772920	\N	0	\N
5	4	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 004-010226	2026-02-01 02:23:34.845089	87545772920	\N	0	\N
6	6	\N	04703084945	Tani aKa	solicitacao_manual	pendente	::1	Solicitação manual de emissão por rh - Lote 006-010226	2026-02-01 17:21:36.738616	04703084945	\N	0	\N
7	8	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 002-020226	2026-02-02 07:15:53.66158	87545772920	\N	0	\N
8	9	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 003-020226	2026-02-02 07:20:14.406143	87545772920	\N	0	\N
9	10	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 004-020226	2026-02-02 07:52:51.433757	87545772920	\N	0	\N
10	11	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 005-020226	2026-02-02 08:10:12.162017	87545772920	\N	0	\N
11	12	\N	15917295050	Ronaldo	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 006-020226	2026-02-02 09:57:10.529966	15917295050	\N	0	\N
12	14	\N	13785514000	Joao tes func ent	solicitacao_manual	pendente	::1	Solicitação manual de emissão por rh - Lote 007-020226	2026-02-02 10:54:02.977509	13785514000	\N	0	\N
13	15	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 008-020226	2026-02-02 14:35:58.099256	87545772920	\N	0	\N
14	16	\N	04703084945	Tani aKa	solicitacao_manual	pendente	::1	Solicitação manual de emissão por rh - Lote 009-020226	2026-02-02 15:14:44.008158	04703084945	\N	0	\N
40	21	\N	04703084945	Tani aKa	solicitacao_manual	pendente	::1	Solicitação manual de emissão por rh - Lote 21	2026-02-04 08:38:15.664039	04703084945	\N	0	\N
43	20	\N	87545772920	Ronaldo Fill	solicitacao_manual	pendente	::1	Solicitação manual de emissão por gestor_entidade - Lote 20	2026-02-04 09:03:01.7203	87545772920	gestor_entidade	0	\N
44	20	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-04 09:03:01.7203	87545772920	gestor_entidade	0	\N
\.


--
-- Data for Name: avaliacao_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avaliacao_resets (id, avaliacao_id, lote_id, requested_by_user_id, requested_by_role, reason, respostas_count, created_at) FROM stdin;
e9f40b5f-0a86-4507-8118-b09c9c796aff	30	17	-1	rh	dgdsggdssgdd	37	2026-02-03 23:26:43.943072-03
8c4c7af4-6889-4fd7-9e67-ee00b69a55f0	31	17	-1	rh	dfdfdfdfs	0	2026-02-03 23:59:28.938612-03
24840ede-74f2-4a72-8b41-e263d9c2cc85	40	21	-1	rh	sddsdsasdaasdasd	3	2026-02-04 01:03:12.801375-03
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avaliacoes (id, funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id, inativada_em, motivo_inativacao) FROM stdin;
1	49510559024	2026-02-01 04:34:48.847	\N	inativada	1	2026-02-01 01:34:48.85341	2026-02-01 01:35:27.863616	1	2026-02-01 01:35:27.863616-03	sfsf dfafdafadfad
2	67136101026	2026-02-01 04:34:48.847	2026-02-01 01:36:13.9894	concluida	1	2026-02-01 01:34:48.870977	2026-02-01 01:36:13.9894	1	\N	\N
4	67136101026	2026-02-01 04:57:53.689	\N	inativada	1	2026-02-01 01:57:53.70721	2026-02-01 01:58:14.758566	2	2026-02-01 01:58:14.758566-03	dddsf gdssdggds gsgsdsd
3	49510559024	2026-02-01 04:57:53.689	2026-02-01 01:58:51.550114	concluida	1	2026-02-01 01:57:53.697152	2026-02-01 01:58:51.550114	2	\N	\N
31	04370683076	2026-02-02 18:03:26.29	2026-02-04 00:34:22.770499	concluida	1	2026-02-02 15:03:26.301416	2026-02-04 00:34:22.770499	17	\N	\N
5	67136101026	2026-02-01 05:11:36.813	\N	inativada	1	2026-02-01 02:11:36.821323	2026-02-01 02:11:55.390599	3	2026-02-01 02:11:55.390599-03	Agora gere q5 do arquivo *A1.pdf,\ngere q10 do arquivo *A2.pdf,\ngere q14 e q15 do arquivo *A3.pdf,
6	49510559024	2026-02-01 05:11:36.813	2026-02-01 02:12:26.60542	concluida	1	2026-02-01 02:11:36.828804	2026-02-01 02:12:26.60542	3	\N	\N
8	49510559024	2026-02-01 05:22:13.073	2026-02-01 02:22:58.849582	concluida	1	2026-02-01 02:22:13.086818	2026-02-01 02:22:58.849582	4	\N	\N
7	67136101026	2026-02-01 05:22:13.073	\N	inativada	1	2026-02-01 02:22:13.078853	2026-02-01 02:23:23.236891	4	2026-02-01 02:23:23.236891-03	Remova tentativa de usar o banco de produção (NEON) de qquer código/teste/API, trigger, migração que seja diferente de produção… ou seja, para
35	16985430007	2026-02-04 03:35:44.937	\N	inativada	1	2026-02-04 00:35:44.949009	2026-02-04 00:35:44.949009	19	2026-02-04 00:54:00.502635-03	dadfaf afssafasas
32	67136101026	2026-02-04 03:35:01.424	\N	inativada	1	2026-02-04 00:35:01.428591	2026-02-04 00:35:01.428591	18	2026-02-04 00:54:38.481853-03	dd\\vcczzcx xzcbxcbxzzxb
11	04591894096	2026-02-01 20:16:51.419	\N	inativada	1	2026-02-01 17:16:51.417456	2026-02-01 17:17:04.505985	6	2026-02-01 17:17:04.505985-03	ddsdsggsddgdgdgdg
33	49510559024	2026-02-04 03:35:01.424	\N	inativada	1	2026-02-04 00:35:01.441855	2026-02-04 00:35:01.441855	18	2026-02-04 00:59:09.425557-03	dddsdsggdsgdsgds
12	04370683076	2026-02-01 20:16:51.419	2026-02-01 17:21:11.43397	concluida	1	2026-02-01 17:16:51.417456	2026-02-01 17:21:11.43397	6	\N	\N
10	49510559024	2026-02-01 20:10:16.845	\N	inativada	1	2026-02-01 17:10:16.858091	2026-02-02 06:26:43.242134	5	2026-02-02 06:26:43.242134-03	2. Implementar políticas RLS para novas tabelas cxbcbx
9	67136101026	2026-02-01 20:10:16.845	2026-02-02 06:27:32.100939	concluida	1	2026-02-01 17:10:16.849602	2026-02-02 06:27:32.100939	5	\N	\N
34	47097293012	2026-02-04 03:35:44.937	\N	inativada	1	2026-02-04 00:35:44.941824	2026-02-04 00:35:44.941824	19	2026-02-04 00:59:52.033301-03	sgsdgdgdsgsdgs
13	49510559024	2026-02-02 09:31:00.293	\N	inativada	1	2026-02-02 06:31:00.296917	2026-02-02 06:32:45.576008	7	2026-02-02 06:32:45.576008-03	| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |
14	67136101026	2026-02-02 09:31:00.293	2026-02-02 06:33:16.087192	concluida	1	2026-02-02 06:31:00.303718	2026-02-02 06:33:16.087192	7	\N	\N
15	49510559024	2026-02-02 09:58:54.597	2026-02-02 06:59:33.767172	concluida	1	2026-02-02 06:58:54.602504	2026-02-02 06:59:33.767172	8	\N	\N
16	67136101026	2026-02-02 09:58:54.597	\N	inativada	1	2026-02-02 06:58:54.610925	2026-02-02 07:00:09.387487	8	2026-02-02 07:00:09.387487-03	| Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |
39	16985430007	2026-02-04 04:00:22.396	\N	inativada	1	2026-02-04 01:00:22.409764	2026-02-04 01:00:22.409764	21	2026-02-04 01:00:30.391141-03	sgsdggdsgds
41	04370683076	2026-02-04 04:00:22.396	\N	inativada	1	2026-02-04 01:00:22.421074	2026-02-04 01:00:22.421074	21	2026-02-04 01:00:38.004578-03	dgssdsddsgdds
17	67136101026	2026-02-02 10:18:42.76	\N	inativada	1	2026-02-02 07:18:42.763083	2026-02-02 07:19:32.125337	9	2026-02-02 07:19:32.125337-03	| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |
38	47097293012	2026-02-04 04:00:22.396	\N	inativada	1	2026-02-04 01:00:22.402282	2026-02-04 01:00:22.402282	21	2026-02-04 01:00:46.089546-03	gdsdsgsdsdgsdgdsgdsdggds
18	49510559024	2026-02-02 10:18:42.76	2026-02-02 07:19:45.638541	concluida	1	2026-02-02 07:18:42.770472	2026-02-02 07:19:45.638541	9	\N	\N
37	49510559024	2026-02-04 03:59:34.609	\N	inativada	1	2026-02-04 00:59:34.625451	2026-02-04 00:59:34.625451	20	2026-02-04 01:01:03.804085-03	dgsdggsdgsdgsdgsd
20	49510559024	2026-02-02 10:50:59.132	\N	inativada	1	2026-02-02 07:50:59.144002	2026-02-02 07:51:22.565902	10	2026-02-02 07:51:22.565902-03	| [`app/api/admin/templates-contrato/route.ts`](app/api/admin/templates-contrato/route.ts:18) | Linha 18 | `as any` | Tipo de query string |
19	67136101026	2026-02-02 10:50:59.132	2026-02-02 07:52:14.041671	concluida	1	2026-02-02 07:50:59.135924	2026-02-02 07:52:14.041671	10	\N	\N
36	67136101026	2026-02-04 03:59:34.609	2026-02-04 01:02:14.001815	concluida	1	2026-02-04 00:59:34.613877	2026-02-04 01:02:14.001815	20	\N	\N
21	49510559024	2026-02-02 11:06:08.986	2026-02-02 08:09:30.05351	concluida	1	2026-02-02 08:06:08.994458	2026-02-02 08:09:30.05351	11	\N	\N
22	67136101026	2026-02-02 11:06:08.986	\N	inativada	1	2026-02-02 08:06:09.001622	2026-02-02 08:10:01.448622	11	2026-02-02 08:10:01.448622-03	| Validação RBAC em rotas | 🟢 Boas práticas | Adicionar middleware `requirePermission()` |
23	20533211050	2026-02-02 12:55:08.713	2026-02-02 09:56:34.769039	concluida	1	2026-02-02 09:55:08.717051	2026-02-02 09:56:34.769039	12	\N	\N
24	40547513003	2026-02-02 12:55:08.713	\N	inativada	1	2026-02-02 09:55:08.725992	2026-02-02 09:57:01.585636	12	2026-02-02 09:57:01.585636-03	teste fial de inativação
40	04591894096	2026-02-04 04:00:22.396	2026-02-04 01:03:37.374758	concluida	1	2026-02-04 01:00:22.414536	2026-02-04 01:03:37.374758	21	\N	\N
30	04591894096	2026-02-02 18:03:26.29	2026-02-03 23:53:46.829823	concluida	1	2026-02-02 15:03:26.296628	2026-02-03 23:53:46.829823	17	\N	\N
25	06021796020	2026-02-02 13:45:27.215	2026-02-02 10:51:45.952865	concluida	1	2026-02-02 10:45:27.230835	2026-02-02 10:51:45.952865	14	\N	\N
26	48090382037	2026-02-02 13:45:27.215	\N	inativada	1	2026-02-02 10:45:27.237743	2026-02-02 10:53:35.521408	14	2026-02-02 10:53:35.521408-03	dsggsd gsdgdsgsd
42	59127761070	2026-02-04 09:19:53.057	2026-02-04 06:20:45.365865	concluida	1	2026-02-04 06:19:53.069342	2026-02-04 06:20:45.365865	22	\N	\N
28	49510559024	2026-02-02 17:32:53.107	2026-02-02 14:33:39.337378	concluida	1	2026-02-02 14:32:53.127523	2026-02-02 14:33:39.337378	15	\N	\N
27	67136101026	2026-02-02 17:32:53.107	\N	inativada	1	2026-02-02 14:32:53.117384	2026-02-02 14:34:05.533783	15	2026-02-02 14:34:05.533783-03	"Anexe o PDF do laudo gerado localmente (máx. 1 MB). O sistema fará verificação de integridade e segurança e exibirá uma pré-visualização e o
43	01617198056	2026-02-04 09:19:53.057	\N	inativada	1	2026-02-04 06:19:53.079053	2026-02-04 06:19:53.079053	22	2026-02-04 06:21:03.953942-03	dfddffddssf daffdfdfda
44	19778990050	2026-02-04 09:25:55.555	\N	inativada	1	2026-02-04 06:25:55.558508	2026-02-04 06:25:55.558508	23	2026-02-04 06:26:08.723842-03	zvvzvz zvvzxvzxxvx
29	04591894096	2026-02-02 18:03:21.018	2026-02-02 15:13:49.503452	concluida	1	2026-02-02 15:03:21.026245	2026-02-02 15:13:49.503452	16	\N	\N
45	34624832000	2026-02-04 09:25:55.555	2026-02-04 06:26:40.768236	concluida	1	2026-02-04 06:25:55.568715	2026-02-04 06:26:40.768236	23	\N	\N
\.


--
-- Data for Name: backup_lotes_migracao_20260130; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_lotes_migracao_20260130 (id, codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, contratante_id, auto_emitir_em, auto_emitir_agendado, hash_pdf, numero_ordem, emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento, modo_emergencia, motivo_emergencia, processamento_em) FROM stdin;
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinicas (id, nome, cnpj, email, telefone, endereco, ativa, criado_em, atualizado_em, contratante_id, nome_fantasia) FROM stdin;
1	Clinica Victoria	11222333000181	victoria@clinic.success	11955556666	Success Ave 5000	t	2026-02-01 16:54:26.96809	2026-02-01 16:54:26.96809	17	\N
2	RLJ Importa	09110380000191	rrere@kfddf.com	(64) 54654-6545	Rua Antônio Bianchetti, 90	t	2026-02-01 16:59:39.23968	2026-02-01 16:59:39.23968	19	\N
3	Clincia final test	77863946000106	ddfsdfsfds@fdfdsfsd.com	(34) 54654-6546	Rua Antônio Bianchetti, 90	t	2026-02-02 10:03:31.054376	2026-02-02 10:03:31.054376	22	\N
4	Finla clinical	33999234000143	afdafd@iuiouoi.com	(48) 79875-4564	R. Waldemar Kost, 1130	t	2026-02-04 06:23:34.03757	2026-02-04 06:23:34.03757	24	\N
\.


--
-- Data for Name: clinicas_empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinicas_empresas (clinica_id, empresa_id, criado_em) FROM stdin;
\.


--
-- Data for Name: contratacao_personalizada; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratacao_personalizada (id, contratante_id, numero_funcionarios_estimado, valor_por_funcionario, valor_total_estimado, payment_link_token, payment_link_expiracao, status, criado_em, atualizado_em, link_enviado_em) FROM stdin;
2	2	100	10.00	1000.00	ccd6b7aa42f0e91b9f53300fa3b4b6d0d2448ebcd6a693c3f7efea0abc2c1442	2026-02-03 00:02:28.877	valor_aceito_pelo_contratante	2026-02-01 00:01:40.038328	2026-02-01 00:02:46.978726	2026-02-01 00:02:28.878554
20	19	120	15.00	1800.00	a611c46a3ced374872c678298c8f8111f947e7152d2d0b47a61e5815cae42e04	2026-02-03 16:59:15.2	valor_aceito_pelo_contratante	2026-02-01 16:56:32.862901	2026-02-01 16:59:25.430304	2026-02-01 16:59:15.201091
22	21	100	15.00	1500.00	ef474a5702c7f50add6e2f36258f119a301b21e9badb51490df12607a98354c8	2026-02-04 09:51:46.945	valor_aceito_pelo_contratante	2026-02-02 09:51:25.349483	2026-02-02 09:52:21.208024	2026-02-02 09:51:46.946894
23	22	200	20.00	4000.00	0718e500c44bda5af1aa1eaa936a40508f7e23ffc55d690fc80f50d4569bcae6	2026-02-04 10:01:20.562	valor_aceito_pelo_contratante	2026-02-02 10:00:56.615729	2026-02-02 10:01:36.252035	2026-02-02 10:01:20.563231
24	23	50	15.00	750.00	b9db75014ec74bb4c8a6d1c5ed9bbc2996e44e1a459ac063c1b19038dd2aab99	2026-02-06 06:18:15.93	valor_aceito_pelo_contratante	2026-02-04 06:17:52.490366	2026-02-04 06:18:29.430309	2026-02-04 06:18:15.937497
25	24	125	12.50	1562.50	db42afb649309c932bd5db9e7c60da4e054d10ec77c5cc3c758cad0633953848	2026-02-06 06:23:06.872	valor_aceito_pelo_contratante	2026-02-04 06:22:48.630511	2026-02-04 06:23:16.523347	2026-02-04 06:23:06.873682
\.


--
-- Data for Name: contratantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratantes (id, tipo, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login) FROM stdin;
21	entidade	Teste fina entidade	73423797000103	\N	tstes@jiji.com	(34) 54654-6545	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Ronaldo	15917295050	\N	fjposdjop@huhu.com	(48) 46546-5465	\N	\N	\N	aprovado	\N	\N	t	2026-02-02 09:51:25.349483	2026-02-02 09:52:43.973486	2026-02-02 09:52:43.6797	00000000000	t	100	1	\N	2026-02-02 09:52:43.6797
2	entidade	RELEGERE	02494916000170	\N	zxcxzxds@hih.com	(45) 64564-6554	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Ronaldo Fill	87545772920	\N	eoip@huhu.com	(74) 65465-4655	\N	\N	\N	aprovado	\N	\N	t	2026-02-01 00:01:40.038328	2026-02-01 00:03:01.060879	2026-02-01 00:03:00.775354	00000000000	t	100	1	\N	2026-02-01 00:03:00.775354
22	clinica	Clincia final test	77863946000106	\N	ddfsdfsfds@fdfdsfsd.com	(34) 54654-6546	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Joao tes func ent	13785514000	\N	ffdsfsd@jiji.com	(24) 54564-6454	\N	\N	\N	aprovado	\N	\N	t	2026-02-02 10:00:56.615729	2026-02-02 10:03:31.355011	2026-02-02 10:03:31.075997	00000000000	t	200	1	\N	2026-02-02 10:03:31.075997
19	clinica	RLJ Importa	09110380000191	\N	rrere@kfddf.com	(64) 54654-6545	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Tani aKa	04703084945	\N	qerqqw!@sdgsd.vcom	(64) 54654-3133	\N	\N	\N	aprovado	\N	\N	t	2026-02-01 16:56:32.862901	2026-02-01 16:59:39.545452	2026-02-01 16:59:39.25753	00000000000	t	123	1	\N	2026-02-01 16:59:39.25753
23	entidade	Final Entity	62825456000148	\N	final@cvcv.omm	(34) 56465-4664	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	GEstor entity	41384263020	\N	safasf@dfd.coj	(34) 65465-4654	\N	\N	\N	aprovado	\N	\N	t	2026-02-04 06:17:52.490366	2026-02-04 06:18:43.517864	2026-02-04 06:18:43.23519	00000000000	t	50	1	\N	2026-02-04 06:18:43.23519
24	clinica	Finla clinical	33999234000143	\N	afdafd@iuiouoi.com	(48) 79875-4564	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Finla Clinicana	84943566073	\N	afasf@afaf.com	(48) 78798-7989	\N	\N	\N	aprovado	\N	\N	t	2026-02-04 06:22:48.630511	2026-02-04 06:23:34.352554	2026-02-04 06:23:34.058558	00000000000	t	125	1	\N	2026-02-04 06:23:34.058558
\.


--
-- Data for Name: contratantes_senhas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratantes_senhas (id, contratante_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em) FROM stdin;
2	2	87545772920	$2a$10$8qS7pflZQ4YiIgYKBJt7L.ZU/GPopkx40iYPBz0s1.sSf2xWC/2f2	f	2026-02-01 00:03:00.578051	2026-02-01 00:03:00.915389	2026-02-01 00:03:00.578051-03	2026-02-01 00:03:00.915389-03
5	19	04703084945	$2a$10$pJsyTsXb4.9/qqZo3.X0WOsaC.xn/FNt3foXVjhXRkKhnthW7sdD6	f	2026-02-01 16:59:39.076906	2026-02-01 16:59:39.396635	2026-02-01 16:59:39.076906-03	2026-02-01 16:59:39.396635-03
6	21	15917295050	$2a$10$gZ2.BrziHDqOCd.1Ush9vuSkT3D8ViCO97zltlQsxhZpufWw3DedS	f	2026-02-02 09:52:43.492901	2026-02-02 09:52:43.826051	2026-02-02 09:52:43.492901-03	2026-02-02 09:52:43.826051-03
7	22	13785514000	$2a$10$xByicevpdkph2gd0fWu0OOr35C.ZwUQqY3sZaxIVVj6KDJYHMpjiy	f	2026-02-02 10:03:30.892686	2026-02-02 10:03:31.211792	2026-02-02 10:03:30.892686-03	2026-02-02 10:03:31.211792-03
8	23	41384263020	$2a$10$F/FMm5rjLZmDPGRHJzMkm.bGKyLFa.YGu31.RR9ST.DzC1nkuefZi	f	2026-02-04 06:18:43.04043	2026-02-04 06:18:43.37253	2026-02-04 06:18:43.04043-03	2026-02-04 06:18:43.37253-03
9	24	84943566073	$2a$10$sS8Izuf/nsnYOCSpiyqqj.GdzQHMMJSmiJ.vRSrj/4imTPLbqvLL6	f	2026-02-04 06:23:33.874797	2026-02-04 06:23:34.204165	2026-02-04 06:23:33.874797-03	2026-02-04 06:23:34.204165-03
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratos (id, contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado) FROM stdin;
3	2	1	100	1000.00	aguardando_pagamento	f	f	\N	2026-02-01 00:02:28.881068	\N	\N	\N	\N	\N	\N
4	2	1	100	1000.00	pendente	t	f	\N	2026-02-01 00:02:46.982245	\N	\N	::ffff:127.0.0.1	2026-02-01 00:02:53.941025	\N	\N
9	19	1	120	1800.00	aguardando_pagamento	f	f	\N	2026-02-01 16:59:15.201967	\N	\N	\N	\N	\N	\N
10	19	1	120	1800.00	pendente	t	f	\N	2026-02-01 16:59:25.469625	\N	\N	::ffff:127.0.0.1	2026-02-01 16:59:31.009882	\N	\N
11	21	1	100	1500.00	aguardando_pagamento	f	f	\N	2026-02-02 09:51:46.977754	\N	\N	\N	\N	\N	\N
12	21	1	100	1500.00	pendente	t	f	\N	2026-02-02 09:52:21.210131	\N	\N	::ffff:127.0.0.1	2026-02-02 09:52:31.999409	\N	\N
13	22	1	200	4000.00	aguardando_pagamento	f	f	\N	2026-02-02 10:01:20.564982	\N	\N	\N	\N	\N	\N
14	22	1	200	4000.00	pendente	t	f	\N	2026-02-02 10:01:36.255402	\N	\N	::ffff:127.0.0.1	2026-02-02 10:03:19.948729	\N	\N
15	23	1	50	750.00	aguardando_pagamento	f	f	\N	2026-02-04 06:18:15.939799	\N	\N	\N	\N	\N	\N
16	23	1	50	750.00	pendente	t	f	\N	2026-02-04 06:18:29.435021	\N	\N	::1	2026-02-04 06:18:37.612457	\N	\N
17	24	1	125	1562.50	aguardando_pagamento	f	f	\N	2026-02-04 06:23:06.875666	\N	\N	\N	\N	\N	\N
18	24	1	125	1562.50	pendente	t	f	\N	2026-02-04 06:23:16.52855	\N	\N	::1	2026-02-04 06:23:21.286821	\N	\N
\.


--
-- Data for Name: contratos_planos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratos_planos (id, plano_id, clinica_id, contratante_id, tipo_contratante, valor_personalizado_por_funcionario, inicio_vigencia, fim_vigencia, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: emissao_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.emissao_queue (id, lote_id, tentativas, ultimo_erro, proxima_execucao, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: empresas_clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresas_clientes (id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, contratante_id, representante_nome, representante_fone, representante_email) FROM stdin;
1	Empresa Clin MedCO	29489367000100	dffaaf@sffasasf.com	(34) 65465-4665	ru aldsafjkjlk 32423	uipoiopi	IO	46543123	t	2	2026-02-01 17:07:54.730307	2026-02-01 17:07:54.730307	\N	Rona dfsapipo	64654878788	eiopiope@hihuc.om
2	Empresa CLciaj ipoipoi	48218473000196	jklljk@hjkkh.com	(46) 54894-6564	rua dsljdkalsl poiiop	jkljkljlkj	OP	15612156	t	3	2026-02-02 10:05:08.64711	2026-02-02 10:05:08.64711	\N	Roaldo dsaoaipoi	35546546554	sdgioip@jhuhuc.omo
3	empresa clinic afianl	77713547000169	fadfad@sdgd.com	(64) 65489-7989	ru fdskçl 234	puioui	UI	45612456	t	4	2026-02-04 06:24:42.692106	2026-02-04 06:24:42.692106	\N	respo cliniemp 01	46897897987	45jlkjlk@jhi.cio
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionarios (id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, clinica_id, empresa_id, matricula, turno, escala, nivel_cargo, ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, contratante_id, indice_avaliacao, usuario_tipo) FROM stdin;
13	00000000000	Admin Sistema	\N	\N	admin@qwork.com	$2a$10$NNUkJ.nfWUrrDlUtqFypKeurSQBavEjD.7GumEzEh8WaLCD8Rf9Ie	admin	t	2026-01-31 23:54:59.125647	2026-01-31 23:54:59.125647	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	admin
14	53051173991	Sender Test	\N	\N	sender@qwork.com	$2a$10$tguLV0m0yt/vc6Co8yo6su5Wj9vdS0Pk4qRbJ025IEQ08lVG4x.hi	emissor	t	2026-02-01 00:00:17.95762	2026-02-01 00:00:17.95762	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	emissor
34	40547513003	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.com.br	$2a$10$4B1GzwgZr8auwLwuosMYJ.t5xMVPSZaJ.Ejg0vNwMz8RCxHg79NNO	funcionario	t	2026-02-02 09:54:58.451457	2026-02-02 09:54:58.451457	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1985-04-15	21	0	funcionario_entidade
35	20533211050	DIMore Itali Emp02 online	Operacional	estagio	r123132erweantos@empresa.com.br	$2a$10$pXmyC4UwdMr.icT1XEDtteYWF9aR0NOIZIDtcdPEiLXuwWdibG0ye	funcionario	t	2026-02-02 09:54:58.451457	2026-02-02 09:54:58.451457	\N	\N	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-02 09:56:34.792268	2011-02-02	21	11	funcionario_entidade
39	48090382037	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.co	$2a$10$7kKODuWjgdehfotrADcyMe.QJqFadCGChdV1MMRUJlz/wWD0lGqVK	funcionario	t	2026-02-02 10:05:39.326451	2026-02-02 10:05:39.326451	3	2	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1985-04-15	\N	0	funcionario_clinica
40	06021796020	DIMore Itali Emp02 online	Operacional	estagio	r123132erweantos@empresa.com	$2a$10$x6h4/dlbHJK1iK9YnW1ap.DYUIWPffZRFWBrcjOqOSQsjqDnAWSBy	funcionario	t	2026-02-02 10:05:39.616896	2026-02-02 10:05:39.616896	3	2	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-02 10:51:45.977194	2011-02-02	\N	1	funcionario_clinica
19	49510559024	DIMore Itali	Operacional	estagio	m8094322439.santos@empresa.com.br	$2a$10$AHkmr/xe3q5NB8pMlUujKe2Jm60JrTzCJ6IwDNkxuDQM5tynUCRRK	funcionario	t	2026-02-01 00:03:41.856846	2026-02-01 00:03:41.856846	\N	\N	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-02 14:33:39.36412	2011-02-02	2	12	funcionario_entidade
41	46011955002	testse sdfpoopi	\N	\N	fddsfsdf@dsfds.com	$2a$10$1F7h9f8pXCXld0oL1qCdt.EMOxF7DEjD7NvcE9jpBv8RjLVKyS0Oy	emissor	t	2026-02-03 11:04:30.252267	2026-02-03 11:04:30.252267	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	emissor
42	47097293012	João da Cpuves	Administrativo	Analista	joao.24@empa.com.br	$2a$10$mz8ZuYMLip1TPJzGfcOYquBbiCEqV5loJimCl6Q9xLxpAH8se/EAC	funcionario	t	2026-02-04 00:22:07.995765	2026-02-04 00:22:07.995765	2	1	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2010-12-12	\N	0	funcionario_clinica
43	16985430007	Mariana Maria	Operacional	Coordenadora	rolnk123132l@jijij.com	$2a$10$lg4/aLHxI8H3LE2xBjRfRutkTljTQ6DLJlEPCmdgKJCzdcGgmKsIK	funcionario	t	2026-02-04 00:22:08.291047	2026-02-04 00:22:08.291047	2	1	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1974-10-24	\N	0	funcionario_clinica
29	04370683076	Jose do UP01	Administrativo	Analista	jose53va@empresa.com.br	$2a$10$qdcpidOe.xiuhyijHIQFdeVQEHRvOxwhqU9bKc/kvhi4pv2fceg6i	funcionario	t	2026-02-01 17:08:34.392935	2026-02-01 17:08:34.392935	2	1	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-04 00:34:22.770499	1985-04-15	\N	3	funcionario_clinica
18	67136101026	Jose do UP01	Administrativo	Analista	jose.silfs553va@empresa.com.br	$2a$10$LEVKD6NvKWn5e9.KsQ1t8u7vgwRI284P8HR2RpLBlLJvr1hUDdulO	funcionario	t	2026-02-01 00:03:41.556705	2026-02-01 00:03:41.556705	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-04 01:02:14.001815	1985-04-15	2	14	funcionario_entidade
30	04591894096	DIMore Itali	Operacional	estagio	reewrrwerweantos@empresa.com.br	$2a$10$mUUx7mTs87TYOCIY70K90.SL6VSD6qgbnTcAweUGmuFy.z9v9SeOy	funcionario	t	2026-02-01 17:08:34.827409	2026-02-01 17:08:34.827409	2	1	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-04 01:03:37.374758	2011-02-02	\N	5	funcionario_clinica
48	01617198056	Jaiminho uoiuoiu	Operacional	Coordenadora	rolnk123132l@huhuhuj.com	$2a$10$xqf.142WfyPVtoarpfxMCODI6suKT6M1kBAQADY9lyGtqGyFIyk3W	funcionario	t	2026-02-04 06:19:46.483516	2026-02-04 06:19:46.483516	\N	\N	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1974-10-24	23	0	funcionario_entidade
47	59127761070	Jaiemx o1	Administrativo	Analista	joao.24@empalux.com.br	$2a$10$4ylVqkeYitzuO30ZPk2EgeupUbPqPFMKNbe6GveZa8ekgehV2.2OO	funcionario	t	2026-02-04 06:19:46.483516	2026-02-04 06:19:46.483516	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-04 06:20:45.365865	2010-12-12	23	15	funcionario_entidade
52	19778990050	Jaiemx o1	Administrativo	Analista	jorwerwero.24@empalux.com.br	$2a$10$rK.MUWh3EK5AKTq8wqc7GOBFtZynKxu.BkcS8nmd1tsDJOxPVqyqC	funcionario	t	2026-02-04 06:25:50.328038	2026-02-04 06:25:50.328038	4	3	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2010-12-12	\N	0	funcionario_clinica
53	34624832000	Jaiminho uoiuoiu	Operacional	Coordenadora	rolnk2l@huhuhuj.com	$2a$10$qX3mPBvmWfdZim0LBY2zrOy6EG15sbzupXzvJXcZHNz4P7LLuU3FG	funcionario	t	2026-02-04 06:25:50.656205	2026-02-04 06:25:50.656205	4	3	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-04 06:26:40.768236	1974-10-24	\N	1	funcionario_clinica
\.


--
-- Data for Name: laudo_arquivos_remotos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_arquivos_remotos (id, laudo_id, provider, bucket, key, url, checksum, size_bytes, tipo, criado_por, criado_em) FROM stdin;
\.


--
-- Data for Name: laudo_downloads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_downloads (id, laudo_id, arquivo_remoto_id, usuario_cpf, ip, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: laudo_generation_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_generation_jobs (id, lote_id, laudo_id, status, attempts, max_attempts, last_error, payload, created_at, updated_at, processed_at, finished_at) FROM stdin;
\.


--
-- Data for Name: laudos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
1	1	\N	\N	rascunho	2026-02-01 01:34:48.820046	\N	\N	2026-02-01 01:34:48.820046	\N	\N	\N	\N	\N	\N
2	2	\N	\N	rascunho	2026-02-01 01:57:53.66512	\N	\N	2026-02-01 01:57:53.66512	\N	\N	\N	\N	\N	\N
3	3	53051173991	Laudo gerado pelo emissor	emitido	2026-02-01 02:14:02.874098	2026-02-01 02:14:02.874098	\N	2026-02-01 02:14:02.874098	190a0ef5fc73d2fa5923cc8062ae620b0e7748eed8064b38a5a7b10a3c1e2fbd	\N	\N	\N	\N	\N
6	6	53051173991	\N	emitido	2026-02-01 22:58:52.447057	2026-02-01 22:58:52.447057	\N	2026-02-01 22:58:52.447057	b39b1b0b40960a28f2ee2693571e59bdcb11112dbc0cd1b7cf31fbb162e2605a	\N	\N	\N	\N	\N
4	4	53051173991	\N	emitido	2026-02-02 06:25:06.184203	2026-02-02 06:25:06.184203	\N	2026-02-02 06:25:06.184203	25fb723936bcda7cfb988070e8e9be276bb6863383a6af81bcb395c4a3584162	\N	\N	\N	\N	\N
5	5	\N	\N	rascunho	2026-02-02 07:10:13.452526	\N	\N	2026-02-02 07:10:13.452526	\N	\N	\N	\N	\N	\N
7	7	\N	\N	rascunho	2026-02-02 07:10:13.452526	\N	\N	2026-02-02 07:10:13.452526	\N	\N	\N	\N	\N	\N
8	8	\N	\N	rascunho	2026-02-02 07:10:13.452526	\N	\N	2026-02-02 07:10:13.452526	\N	\N	\N	\N	\N	\N
9	9	\N	\N	rascunho	2026-02-02 07:18:42.732589	\N	\N	2026-02-02 07:18:42.732589	\N	\N	\N	\N	\N	\N
10	10	\N	\N	rascunho	2026-02-02 07:50:59.105511	\N	\N	2026-02-02 07:50:59.105511	\N	\N	\N	\N	\N	\N
11	11	53051173991	\N	emitido	2026-02-02 08:06:08.955264	2026-02-02 08:10:36.064426	\N	2026-02-02 08:10:36.064426	f22fa1021dcf819feb5ab8a9b9357daa6f26c79e80234897e77d9e96436f5321	\N	\N	\N	\N	\N
12	12	53051173991	\N	emitido	2026-02-02 09:55:08.685731	2026-02-02 09:58:08.560009	\N	2026-02-02 09:58:08.560009	42ef18971b7864f6d825beb3ac9afe1c5263e7d45f23a579aab2145813e1d33b	\N	\N	\N	\N	\N
14	14	53051173991	\N	emitido	2026-02-02 10:45:27.17818	2026-02-02 10:54:23.814618	\N	2026-02-02 10:54:23.814618	fa7bf2946f97c9b5f3ea0fc9083906ca585eb43695b0e39c47ac3b037bc38ef5	\N	\N	\N	\N	\N
15	15	53051173991	\N	emitido	2026-02-02 14:32:53.062068	2026-02-02 14:36:37.059207	\N	2026-02-02 14:36:37.059207	346a5226ea3cb841c28b27979c719620276e5957449093c7bcece81dec3ef6cd	\N	\N	\N	\N	\N
17	17	\N	\N	rascunho	2026-02-02 15:03:26.264267	\N	\N	2026-02-02 15:03:26.264267	\N	\N	\N	\N	\N	\N
16	16	53051173991	\N	emitido	2026-02-02 15:03:20.926368	2026-02-02 15:15:03.813074	\N	2026-02-02 15:15:03.813074	b2f9a8e7ff5b3befb4c47fe8795990baf9539fed4cf2e6431ffe3b151c0cd542	\N	\N	\N	\N	\N
18	18	\N	\N	rascunho	2026-02-04 00:35:01.391754	\N	\N	2026-02-04 00:35:01.391754	\N	\N	\N	\N	\N	\N
19	19	\N	\N	rascunho	2026-02-04 00:35:44.892208	\N	\N	2026-02-04 00:35:44.892208	\N	\N	\N	\N	\N	\N
22	22	\N	\N	rascunho	2026-02-04 06:19:53.016799	\N	\N	2026-02-04 06:19:53.016799	\N	\N	\N	\N	\N	\N
23	23	\N	\N	rascunho	2026-02-04 06:25:55.520552	\N	\N	2026-02-04 06:25:55.520552	\N	\N	\N	\N	\N	\N
21	21	53051173991	\N	emitido	2026-02-04 01:00:22.354935	2026-02-04 08:57:58.044569	\N	2026-02-04 08:57:58.044569	10535d9c2f45255f8256fdd326c4bbad568a010711dff8c92491acbfc822684d	\N	\N	\N	\N	\N
20	20	53051173991	\N	emitido	2026-02-04 00:59:34.585166	2026-02-04 09:03:27.145605	\N	2026-02-04 09:03:27.145605	9a79f654a6585158ee43ad25ed3bfc446b14f906f098e8f1c25ef1ac4fc08c49	\N	\N	\N	\N	\N
\.


--
-- Data for Name: lote_id_allocator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lote_id_allocator (last_id) FROM stdin;
23
\.


--
-- Data for Name: lotes_avaliacao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, contratante_id, hash_pdf, numero_ordem, emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento, processamento_em, setor_id) FROM stdin;
1	\N	\N	Lote 1 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-01 01:34:48.820046	2026-02-01 01:34:48.820046	2026-02-01 01:36:13.9894	2	\N	1	\N	\N	f	\N	\N	\N
2	\N	\N	Lote 2 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-01 01:57:53.66512	2026-02-01 01:57:53.66512	2026-02-01 01:58:51.550114	2	\N	2	\N	\N	f	\N	\N	\N
5	\N	\N	Lote 5 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-01 17:10:16.832495	2026-02-01 17:10:16.832495	2026-02-02 06:27:32.100939	2	\N	5	\N	\N	f	\N	\N	\N
7	\N	\N	Lote 6 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-02 06:31:00.282673	2026-02-02 06:31:00.282673	2026-02-02 06:33:16.087192	2	\N	6	\N	\N	f	\N	\N	\N
8	\N	\N	Lote 7 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-02 06:58:54.574932	2026-02-02 06:58:54.574932	2026-02-02 07:00:09.387487	2	\N	7	\N	\N	f	\N	\N	\N
9	\N	\N	Lote 8 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-02 07:18:42.732589	2026-02-02 07:18:42.732589	2026-02-02 07:19:45.638541	2	\N	8	\N	\N	f	\N	\N	\N
10	\N	\N	Lote 9 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-02 07:50:59.105511	2026-02-02 07:50:59.105511	2026-02-02 07:52:14.041671	2	\N	9	\N	\N	f	\N	\N	\N
17	2	1	Lote 3 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-02-02 15:03:26.264267	2026-02-02 15:03:26.264267	2026-02-04 00:34:22.770499	\N	\N	3	\N	\N	f	\N	\N	\N
18	\N	\N	Lote 13 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	cancelado	87545772920	2026-02-04 00:35:01.391754	2026-02-04 00:35:01.391754	2026-02-04 00:35:01.391754	2	\N	13	\N	\N	f	\N	\N	\N
19	2	1	Lote 4 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.	completo	cancelado	04703084945	2026-02-04 00:35:44.892208	2026-02-04 00:35:44.892208	2026-02-04 00:35:44.892208	\N	\N	4	\N	\N	f	\N	\N	\N
20	\N	\N	Lote 14 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	87545772920	2026-02-04 00:59:34.585166	2026-02-04 00:59:34.585166	2026-02-04 01:02:14.001815	2	\N	14	\N	\N	f	\N	\N	\N
21	2	1	Lote 5 liberado para Empresa Clin MedCO. Inclui 4 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-02-04 01:00:22.354935	2026-02-04 01:00:22.354935	2026-02-04 01:03:37.374758	\N	\N	5	\N	\N	f	\N	\N	\N
22	\N	\N	Lote 15 liberado para Final Entity. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	41384263020	2026-02-04 06:19:53.016799	2026-02-04 06:19:53.016799	2026-02-04 06:21:03.953942	23	\N	15	\N	\N	f	\N	\N	\N
23	4	3	Lote 1 liberado para empresa clinic afianl. Inclui 2 funcionário(s) elegíveis.	completo	concluido	84943566073	2026-02-04 06:25:55.520552	2026-02-04 06:25:55.520552	2026-02-04 06:26:40.768236	\N	\N	1	\N	\N	f	\N	\N	\N
3	\N	\N	Lote 3 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	laudo_emitido	87545772920	2026-02-01 02:11:36.803161	2026-02-01 02:11:36.803161	2026-02-04 07:42:51.004123	2	\N	3	\N	\N	f	\N	\N	\N
6	2	1	Lote 1 liberado para Empresa Clin MedCO. Inclui 2 funcionário(s) elegíveis.	completo	laudo_emitido	04703084945	2026-02-01 17:16:51.417456	2026-02-01 17:16:51.417456	2026-02-04 07:42:51.004123	\N	\N	1	\N	\N	f	\N	\N	\N
4	\N	\N	Lote 4 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	laudo_emitido	87545772920	2026-02-01 02:22:13.055503	2026-02-01 02:22:13.055503	2026-02-04 07:42:51.004123	2	\N	4	2026-02-02 06:25:06.184203-03	\N	f	\N	\N	\N
11	\N	\N	Lote 10 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	laudo_emitido	87545772920	2026-02-02 08:06:08.955264	2026-02-02 08:06:08.955264	2026-02-04 07:42:51.004123	2	\N	10	\N	\N	f	\N	\N	\N
14	3	2	Lote 1 liberado para Empresa CLciaj ipoipoi. Inclui 2 funcionário(s) elegíveis.	completo	laudo_emitido	13785514000	2026-02-02 10:45:27.17818	2026-02-02 10:45:27.17818	2026-02-04 07:42:51.004123	\N	\N	1	\N	\N	f	\N	\N	\N
12	\N	\N	Lote 11 liberado para Teste fina entidade. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	laudo_emitido	15917295050	2026-02-02 09:55:08.685731	2026-02-02 09:55:08.685731	2026-02-04 07:42:51.004123	21	\N	11	\N	\N	f	\N	\N	\N
15	\N	\N	Lote 12 liberado para RELEGERE. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	laudo_emitido	87545772920	2026-02-02 14:32:53.062068	2026-02-02 14:32:53.062068	2026-02-04 07:42:51.004123	2	\N	12	\N	\N	f	\N	\N	\N
16	2	1	Lote 2 liberado para Empresa Clin MedCO. Inclui 1 funcionário(s) elegíveis.	completo	laudo_emitido	04703084945	2026-02-02 15:03:20.926368	2026-02-02 15:03:20.926368	2026-02-04 07:42:51.004123	\N	\N	2	\N	\N	f	\N	\N	\N
\.


--
-- Data for Name: mfa_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mfa_codes (id, cpf, code, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: migration_guidelines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migration_guidelines (id, category, guideline, example, created_at) FROM stdin;
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacoes (id, tipo, prioridade, destinatario_cpf, destinatario_tipo, titulo, mensagem, dados_contexto, link_acao, botao_texto, lida, data_leitura, arquivada, contratacao_personalizada_id, criado_em, expira_em) FROM stdin;
1	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 003-010226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 3, "lote_codigo": "003-010226"}	\N	\N	f	\N	f	\N	2026-02-01 02:19:44.366299	\N
2	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 004-010226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 4, "lote_codigo": "004-010226"}	\N	\N	f	\N	f	\N	2026-02-01 02:23:34.851206	\N
7	pre_cadastro_criado	alta	00000000000	admin	Novo Pre-Cadastro: RLJ Importa	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: 123.	{"contratacao_id": 20, "contratante_nome": "RLJ Importa", "numero_funcionarios": 123}	/admin/contratacao/pendentes	Definir Valor	f	\N	f	20	2026-02-01 16:56:32.862901	\N
10	valor_definido	media	04703084945	gestor_entidade	Valor Definido para Plano Personalizado	O valor do seu plano personalizado foi definido. Valor por funcionario: R$ 15,00. Total estimado: R$ 1.800,00.	{"contratacao_id": 20, "valor_total_estimado": 1800.00, "valor_por_funcionario": 15.00}	/entidade/contratacao/20	Ver Contrato	f	\N	f	20	2026-02-01 16:59:15.189267	\N
12	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 002-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 8, "lote_codigo": "002-020226"}	\N	\N	f	\N	f	\N	2026-02-02 07:15:53.682542	\N
13	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 003-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 9, "lote_codigo": "003-020226"}	\N	\N	f	\N	f	\N	2026-02-02 07:20:14.414939	\N
14	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 004-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 10, "lote_codigo": "004-020226"}	\N	\N	f	\N	f	\N	2026-02-02 07:52:51.44609	\N
15	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 005-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 11, "lote_codigo": "005-020226"}	\N	\N	f	\N	f	\N	2026-02-02 08:10:12.173679	\N
16	pre_cadastro_criado	alta	00000000000	admin	Novo Pre-Cadastro: Teste fina entidade	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: 100.	{"contratacao_id": 22, "contratante_nome": "Teste fina entidade", "numero_funcionarios": 100}	/admin/contratacao/pendentes	Definir Valor	f	\N	f	22	2026-02-02 09:51:25.349483	\N
17	valor_definido	media	15917295050	gestor_entidade	Valor Definido para Plano Personalizado	O valor do seu plano personalizado foi definido. Valor por funcionario: R$ 15,00. Total estimado: R$ 1.500,00.	{"contratacao_id": 22, "valor_total_estimado": 1500.00, "valor_por_funcionario": 15.00}	/entidade/contratacao/22	Ver Contrato	f	\N	f	22	2026-02-02 09:51:46.929772	\N
18	emissao_solicitada_sucesso	media	15917295050	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 006-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 12, "lote_codigo": "006-020226"}	\N	\N	f	\N	f	\N	2026-02-02 09:57:10.541058	\N
19	pre_cadastro_criado	alta	00000000000	admin	Novo Pre-Cadastro: Clincia final test	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: 200.	{"contratacao_id": 23, "contratante_nome": "Clincia final test", "numero_funcionarios": 200}	/admin/contratacao/pendentes	Definir Valor	f	\N	f	23	2026-02-02 10:00:56.615729	\N
20	valor_definido	media	13785514000	gestor_entidade	Valor Definido para Plano Personalizado	O valor do seu plano personalizado foi definido. Valor por funcionario: R$ 20,00. Total estimado: R$ 4.000,00.	{"contratacao_id": 23, "valor_total_estimado": 4000.00, "valor_por_funcionario": 20.00}	/entidade/contratacao/23	Ver Contrato	f	\N	f	23	2026-02-02 10:01:20.548471	\N
21	emissao_solicitada_sucesso	media	13785514000	funcionario	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 007-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 14, "lote_codigo": "007-020226"}	\N	\N	f	\N	f	\N	2026-02-02 10:54:02.992309	\N
22	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 008-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 15, "lote_codigo": "008-020226"}	\N	\N	f	\N	f	\N	2026-02-02 14:35:58.117731	\N
23	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão registrada	Solicitação de emissão registrada para lote 009-020226. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 16, "lote_codigo": "009-020226"}	\N	\N	f	\N	f	\N	2026-02-02 15:14:44.023585	\N
24	pre_cadastro_criado	alta	00000000000	admin	Novo Pre-Cadastro: Final Entity	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: 50.	{"contratacao_id": 24, "contratante_nome": "Final Entity", "numero_funcionarios": 50}	/admin/contratacao/pendentes	Definir Valor	f	\N	f	24	2026-02-04 06:17:52.490366	\N
25	valor_definido	media	41384263020	gestor_entidade	Valor Definido para Plano Personalizado	O valor do seu plano personalizado foi definido. Valor por funcionario: R$ 15,00. Total estimado: R$ 750,00.	{"contratacao_id": 24, "valor_total_estimado": 750.00, "valor_por_funcionario": 15.00}	/entidade/contratacao/24	Ver Contrato	f	\N	f	24	2026-02-04 06:18:15.917911	\N
26	pre_cadastro_criado	alta	00000000000	admin	Novo Pre-Cadastro: Finla clinical	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: 125.	{"contratacao_id": 25, "contratante_nome": "Finla clinical", "numero_funcionarios": 125}	/admin/contratacao/pendentes	Definir Valor	f	\N	f	25	2026-02-04 06:22:48.630511	\N
27	valor_definido	media	84943566073	gestor_entidade	Valor Definido para Plano Personalizado	O valor do seu plano personalizado foi definido. Valor por funcionario: R$ 12,50. Total estimado: R$ 1.562,50.	{"contratacao_id": 25, "valor_total_estimado": 1562.50, "valor_por_funcionario": 12.50}	/entidade/contratacao/25	Ver Contrato	f	\N	f	25	2026-02-04 06:23:06.855052	\N
28	emissao_solicitada_sucesso	media	87545772920	gestor_entidade	Solicitação de emissão registrada	Solicitação de emissão registrada para lote #20. O laudo será gerado pelo emissor quando disponível.	{"lote_id": 20}	\N	\N	f	\N	f	\N	2026-02-04 09:03:01.742099	\N
\.


--
-- Data for Name: notificacoes_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacoes_admin (id, tipo, mensagem, lote_id, visualizada, criado_em) FROM stdin;
1	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 1: relação "notificacoes" não existe	1	f	2026-02-01 01:54:05.957545-03
2	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 2: relação "notificacoes" não existe	2	f	2026-02-01 01:59:07.653819-03
3	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 2: valor de entrada é inválido para enum tipo_notificacao: "emissao_solicitada_sucesso"	2	f	2026-02-01 02:01:33.223228-03
4	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 3: valor de entrada é inválido para enum tipo_notificacao: "emissao_solicitada_sucesso"	3	f	2026-02-01 02:12:40.485109-03
5	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 6: a nova linha da relação "notificacoes" viola a restrição de verificação "notificacoes_destinatario_tipo_check"	6	f	2026-02-01 17:21:36.7656-03
6	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 21: não há nenhuma restrição de unicidade ou de exclusão que corresponda à especificação ON CONFLICT	21	f	2026-02-04 08:36:53.566921-03
7	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 21: não foi possível determinar o tipo de dados do parâmetro $3	21	f	2026-02-04 08:38:15.699137-03
8	erro_critico_solicitacao_emissao	Erro ao registrar solicitação de emissão do lote 20: a nova linha da relação "auditoria_laudos" viola a restrição de verificação "chk_solicitation_has_requester"	20	f	2026-02-04 08:59:23.045186-03
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagamentos (id, contratante_id, valor, metodo, status, plataforma_id, plataforma_nome, dados_adicionais, data_pagamento, data_confirmacao, comprovante_path, observacoes, criado_em, atualizado_em, numero_parcelas, recibo_url, recibo_numero, detalhes_parcelas, numero_funcionarios, valor_por_funcionario, contrato_id, idempotency_key, external_transaction_id, provider_event_id) FROM stdin;
2	2	1000.00	pix	pago	\N	simulador	\N	2026-02-01 00:03:00.403057	\N	\N	\N	2026-02-01 00:02:59.885291	2026-02-01 00:02:59.885291	1	\N	\N	\N	\N	\N	4	\N	\N	\N
5	19	1800.00	cartao	pago	\N	simulador	\N	2026-02-01 16:59:38.881488	\N	\N	\N	2026-02-01 16:59:38.438017	2026-02-01 16:59:38.438017	3	\N	\N	[{"pago": true, "valor": 600, "numero": 1, "status": "pago", "data_pagamento": "2026-02-01T19:59:38.886Z", "data_vencimento": "2026-02-01"}, {"pago": false, "valor": 600, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-01"}, {"pago": false, "valor": 600, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-01"}]	\N	\N	10	\N	\N	\N
6	21	1500.00	boleto	pago	\N	simulador	\N	2026-02-02 09:52:43.168317	\N	\N	\N	2026-02-02 09:52:42.676597	2026-02-02 09:52:42.676597	5	\N	\N	[{"pago": true, "valor": 300, "numero": 1, "status": "pago", "data_pagamento": "2026-02-02T12:52:43.173Z", "data_vencimento": "2026-02-02"}, {"pago": false, "valor": 300, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-02"}, {"pago": false, "valor": 300, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-02"}, {"pago": false, "valor": 300, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-05-02"}, {"pago": false, "valor": 300, "numero": 5, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-06-02"}]	\N	\N	12	\N	\N	\N
7	22	4000.00	boleto	pago	\N	simulador	\N	2026-02-02 10:03:30.688091	\N	\N	\N	2026-02-02 10:03:30.159533	2026-02-02 10:03:30.159533	4	\N	\N	[{"pago": true, "valor": 1000, "numero": 1, "status": "pago", "data_pagamento": "2026-02-02T13:03:30.692Z", "data_vencimento": "2026-02-02"}, {"pago": false, "valor": 1000, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-02"}, {"pago": false, "valor": 1000, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-02"}, {"pago": false, "valor": 1000, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-05-02"}]	\N	\N	14	\N	\N	\N
8	23	750.00	pix	pago	\N	simulador	\N	2026-02-04 06:18:42.867873	\N	\N	\N	2026-02-04 06:18:42.383336	2026-02-04 06:18:42.383336	1	\N	\N	\N	\N	\N	16	\N	\N	\N
9	24	1562.50	boleto	pago	\N	simulador	\N	2026-02-04 06:23:33.597468	\N	\N	\N	2026-02-04 06:23:33.165085	2026-02-04 06:23:33.165085	2	\N	\N	[{"pago": true, "valor": 781.25, "numero": 1, "status": "pago", "data_pagamento": "2026-02-04T09:23:33.604Z", "data_vencimento": "2026-02-04"}, {"pago": false, "valor": 781.25, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-04"}]	\N	\N	18	\N	\N	\N
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
1	clinicas:manage	clinicas	manage	Gerenciar clÃ­nicas (CRUD completo)	2026-01-31 22:23:22.610313
2	clinicas:read	clinicas	read	Visualizar clÃ­nicas	2026-01-31 22:23:22.610313
3	clinicas:approve	clinicas	approve	Aprovar cadastros de clÃ­nicas	2026-01-31 22:23:22.610313
4	contratantes:manage	contratantes	manage	Gerenciar contratantes/entidades (CRUD completo)	2026-01-31 22:23:22.610313
5	contratantes:read	contratantes	read	Visualizar contratantes	2026-01-31 22:23:22.610313
6	contratantes:approve	contratantes	approve	Aprovar cadastros de contratantes	2026-01-31 22:23:22.610313
7	contratantes:own	contratantes	own	Gerenciar prÃ³prio contratante (gestor_entidade)	2026-01-31 22:23:22.610313
8	empresas:manage	empresas	manage	Gerenciar empresas clientes da clÃ­nica	2026-01-31 22:23:22.610313
9	empresas:read	empresas	read	Visualizar empresas clientes	2026-01-31 22:23:22.610313
10	funcionarios:manage	funcionarios	manage	Gerenciar funcionÃ¡rios (CRUD completo)	2026-01-31 22:23:22.610313
11	funcionarios:read	funcionarios	read	Visualizar funcionÃ¡rios	2026-01-31 22:23:22.610313
12	funcionarios:create	funcionarios	create	Criar funcionÃ¡rios	2026-01-31 22:23:22.610313
13	funcionarios:update	funcionarios	update	Atualizar funcionÃ¡rios	2026-01-31 22:23:22.610313
14	funcionarios:delete	funcionarios	delete	Deletar funcionÃ¡rios	2026-01-31 22:23:22.610313
15	funcionarios:own	funcionarios	own	Gerenciar prÃ³prios dados	2026-01-31 22:23:22.610313
16	avaliacoes:manage	avaliacoes	manage	Gerenciar avaliaÃ§Ãµes (CRUD completo)	2026-01-31 22:23:22.610313
17	avaliacoes:read	avaliacoes	read	Visualizar avaliaÃ§Ãµes	2026-01-31 22:23:22.610313
18	avaliacoes:create	avaliacoes	create	Criar avaliaÃ§Ãµes	2026-01-31 22:23:22.610313
19	avaliacoes:execute	avaliacoes	execute	Executar/responder avaliaÃ§Ãµes	2026-01-31 22:23:22.610313
20	avaliacoes:inactivate	avaliacoes	inactivate	Inativar avaliaÃ§Ãµes	2026-01-31 22:23:22.610313
21	avaliacoes:reset	avaliacoes	reset	Resetar avaliaÃ§Ãµes	2026-01-31 22:23:22.610313
22	lotes:manage	lotes	manage	Gerenciar lotes (CRUD completo)	2026-01-31 22:23:22.610313
23	lotes:read	lotes	read	Visualizar lotes	2026-01-31 22:23:22.610313
24	lotes:create	lotes	create	Criar lotes	2026-01-31 22:23:22.610313
25	lotes:liberar	lotes	liberar	Liberar lotes para avaliaÃ§Ã£o	2026-01-31 22:23:22.610313
26	lotes:solicitar_emissao	lotes	solicitar_emissao	Solicitar emissÃ£o de laudos	2026-01-31 22:23:22.610313
27	laudos:manage	laudos	manage	Gerenciar laudos (CRUD completo)	2026-01-31 22:23:22.610313
28	laudos:read	laudos	read	Visualizar laudos	2026-01-31 22:23:22.610313
29	laudos:emit	laudos	emit	Emitir e assinar laudos	2026-01-31 22:23:22.610313
30	laudos:download	laudos	download	Baixar laudos	2026-01-31 22:23:22.610313
31	planos:manage	planos	manage	Gerenciar planos (CRUD completo)	2026-01-31 22:23:22.610313
32	planos:read	planos	read	Visualizar planos	2026-01-31 22:23:22.610313
33	emissores:manage	emissores	manage	Gerenciar emissores (CRUD completo)	2026-01-31 22:23:22.610313
34	emissores:read	emissores	read	Visualizar emissores	2026-01-31 22:23:22.610313
35	relatorios:read	relatorios	read	Visualizar relatÃ³rios	2026-01-31 22:23:22.610313
36	relatorios:export	relatorios	export	Exportar relatÃ³rios	2026-01-31 22:23:22.610313
\.


--
-- Data for Name: planos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.planos (id, tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, created_at, updated_at, caracteristicas) FROM stdin;
1	personalizado	Personalizado	Atende a todos os interessados nos nossos servições	\N	\N	\N	t	2026-01-31 20:10:43.938649	2026-01-31 20:10:43.938649	["Setup incluído.","Sem limite de uso."]
\.


--
-- Data for Name: policy_expression_backups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policy_expression_backups (id, schema_name, table_name, policy_name, using_expr, with_check_expr, created_at) FROM stdin;
\.


--
-- Data for Name: questao_condicoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.questao_condicoes (id, questao_id, questao_dependente, operador, valor_condicao, categoria, ativo, created_at) FROM stdin;
\.


--
-- Data for Name: recibos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recibos (id, contrato_id, pagamento_id, contratante_id, numero_recibo, vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento, numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, conteudo_pdf_path, conteudo_texto, emitido_por_cpf, ativo, criado_em, atualizado_em, pdf, hash_pdf, ip_emissao, emitido_por, hash_incluso, backup_path) FROM stdin;
\.


--
-- Data for Name: relatorio_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.relatorio_templates (id, nome, tipo, descricao, campos_incluidos, filtros_padrao, formato_saida, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: respostas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.respostas (id, avaliacao_id, grupo, item, valor, criado_em) FROM stdin;
1	2	1	Q1	50	2026-02-01 01:36:01.587908
2	2	1	Q2	100	2026-02-01 01:36:01.874511
3	2	1	Q3	75	2026-02-01 01:36:02.139886
4	2	1	Q9	75	2026-02-01 01:36:02.297721
5	2	2	Q13	75	2026-02-01 01:36:02.487186
6	2	2	Q17	75	2026-02-01 01:36:02.736432
7	2	2	Q18	50	2026-02-01 01:36:03.05531
8	2	2	Q19	50	2026-02-01 01:36:03.388806
9	2	3	Q20	50	2026-02-01 01:36:03.588184
10	2	3	Q21	75	2026-02-01 01:36:04.012145
11	2	3	Q23	75	2026-02-01 01:36:04.204563
12	2	3	Q25	75	2026-02-01 01:36:04.379642
13	2	3	Q26	50	2026-02-01 01:36:04.646549
14	2	3	Q28	50	2026-02-01 01:36:04.826418
15	2	4	Q31	25	2026-02-01 01:36:05.091229
16	2	4	Q32	25	2026-02-01 01:36:05.418919
17	2	4	Q33	25	2026-02-01 01:36:05.61556
18	2	4	Q34	0	2026-02-01 01:36:06.022254
19	2	5	Q35	0	2026-02-01 01:36:06.221594
20	2	5	Q38	25	2026-02-01 01:36:06.782633
21	2	5	Q41	50	2026-02-01 01:36:06.980558
22	2	6	Q43	75	2026-02-01 01:36:07.390445
23	2	6	Q45	100	2026-02-01 01:36:07.597465
24	2	7	Q48	100	2026-02-01 01:36:07.775622
25	2	7	Q52	75	2026-02-01 01:36:08.125494
26	2	7	Q55	50	2026-02-01 01:36:08.705743
27	2	8	Q56	25	2026-02-01 01:36:08.97686
28	2	8	Q57	50	2026-02-01 01:36:09.374012
29	2	8	Q58	100	2026-02-01 01:36:10.033036
30	2	9	Q59	75	2026-02-01 01:36:10.266318
31	2	9	Q61	75	2026-02-01 01:36:10.509968
32	2	9	Q62	75	2026-02-01 01:36:11.41087
33	2	9	Q64	100	2026-02-01 01:36:11.874716
34	2	10	Q65	50	2026-02-01 01:36:12.160276
35	2	10	Q66	50	2026-02-01 01:36:12.383012
36	2	10	Q68	25	2026-02-01 01:36:12.70561
37	2	10	Q70	50	2026-02-01 01:36:13.932126
38	3	1	Q1	50	2026-02-01 01:58:36.745605
39	3	1	Q2	100	2026-02-01 01:58:36.851762
40	3	1	Q3	100	2026-02-01 01:58:37.058586
41	3	1	Q9	25	2026-02-01 01:58:38.104767
42	3	2	Q13	0	2026-02-01 01:58:38.338792
43	3	2	Q17	0	2026-02-01 01:58:38.465298
44	3	2	Q18	25	2026-02-01 01:58:38.703937
45	3	2	Q19	25	2026-02-01 01:58:38.881884
46	3	3	Q20	25	2026-02-01 01:58:39.075419
47	3	3	Q21	50	2026-02-01 01:58:39.287964
48	3	3	Q23	25	2026-02-01 01:58:39.685467
49	3	3	Q25	0	2026-02-01 01:58:39.923174
50	3	3	Q26	0	2026-02-01 01:58:40.08311
51	3	3	Q28	50	2026-02-01 01:58:40.333803
52	3	4	Q31	100	2026-02-01 01:58:41.116481
53	3	4	Q32	50	2026-02-01 01:58:41.528975
54	3	4	Q33	50	2026-02-01 01:58:41.741352
55	3	4	Q34	0	2026-02-01 01:58:42.251129
56	3	5	Q35	0	2026-02-01 01:58:42.423269
57	3	5	Q38	25	2026-02-01 01:58:42.655868
58	3	5	Q41	50	2026-02-01 01:58:43.022711
59	3	6	Q43	75	2026-02-01 01:58:43.408545
60	3	6	Q45	100	2026-02-01 01:58:43.638265
61	3	7	Q48	100	2026-02-01 01:58:43.81741
62	3	7	Q52	75	2026-02-01 01:58:44.278534
63	3	7	Q55	50	2026-02-01 01:58:44.699262
64	3	8	Q56	75	2026-02-01 01:58:44.981991
65	3	8	Q57	75	2026-02-01 01:58:45.150798
66	3	8	Q58	100	2026-02-01 01:58:45.378241
67	3	9	Q59	0	2026-02-01 01:58:45.753765
68	3	9	Q61	0	2026-02-01 01:58:46.053562
69	3	9	Q62	25	2026-02-01 01:58:46.296715
70	3	9	Q64	25	2026-02-01 01:58:46.533659
71	3	10	Q65	50	2026-02-01 01:58:47.704251
72	3	10	Q66	25	2026-02-01 01:58:48.932848
73	3	10	Q68	0	2026-02-01 01:58:49.847926
74	3	10	Q70	50	2026-02-01 01:58:51.501059
75	6	1	Q1	50	2026-02-01 02:12:15.414382
76	6	1	Q2	75	2026-02-01 02:12:15.541147
77	6	1	Q3	75	2026-02-01 02:12:15.692112
78	6	1	Q9	50	2026-02-01 02:12:16.114225
79	6	2	Q13	50	2026-02-01 02:12:16.291507
80	6	2	Q17	75	2026-02-01 02:12:16.552904
81	6	2	Q18	75	2026-02-01 02:12:16.739482
82	6	2	Q19	50	2026-02-01 02:12:16.964108
83	6	3	Q20	25	2026-02-01 02:12:17.507467
84	6	3	Q21	25	2026-02-01 02:12:17.681791
85	6	3	Q23	0	2026-02-01 02:12:17.915173
86	6	3	Q25	0	2026-02-01 02:12:18.109297
87	6	3	Q26	0	2026-02-01 02:12:18.305784
88	6	3	Q28	25	2026-02-01 02:12:18.508102
89	6	4	Q31	50	2026-02-01 02:12:18.762439
90	6	4	Q32	100	2026-02-01 02:12:19.330712
91	6	4	Q33	75	2026-02-01 02:12:19.696702
92	6	4	Q34	75	2026-02-01 02:12:19.903082
93	6	5	Q35	50	2026-02-01 02:12:20.120621
94	6	5	Q38	50	2026-02-01 02:12:20.286112
95	6	5	Q41	75	2026-02-01 02:12:20.520248
96	6	6	Q43	75	2026-02-01 02:12:20.712655
97	6	6	Q45	100	2026-02-01 02:12:20.913932
98	6	7	Q48	0	2026-02-01 02:12:21.342064
99	6	7	Q52	25	2026-02-01 02:12:21.58473
100	6	7	Q55	25	2026-02-01 02:12:21.990171
101	6	8	Q56	50	2026-02-01 02:12:22.246364
102	6	8	Q57	50	2026-02-01 02:12:22.978494
103	6	8	Q58	50	2026-02-01 02:12:23.185499
104	6	9	Q59	25	2026-02-01 02:12:23.447279
105	6	9	Q61	100	2026-02-01 02:12:23.887818
106	6	9	Q62	100	2026-02-01 02:12:24.115653
107	6	9	Q64	75	2026-02-01 02:12:24.359074
108	6	10	Q65	50	2026-02-01 02:12:24.801257
109	6	10	Q66	50	2026-02-01 02:12:25.284075
110	6	10	Q68	50	2026-02-01 02:12:25.784134
111	6	10	Q70	50	2026-02-01 02:12:26.553769
112	8	1	Q1	25	2026-02-01 02:22:45.017397
113	8	1	Q2	50	2026-02-01 02:22:45.130062
114	8	1	Q3	50	2026-02-01 02:22:45.34289
115	8	1	Q9	25	2026-02-01 02:22:45.559811
116	8	2	Q13	25	2026-02-01 02:22:45.777008
117	8	2	Q17	0	2026-02-01 02:22:46.091604
118	8	2	Q18	0	2026-02-01 02:22:46.299129
119	8	2	Q19	50	2026-02-01 02:22:46.64111
120	8	3	Q20	50	2026-02-01 02:22:46.860505
121	8	3	Q21	100	2026-02-01 02:22:47.546393
122	8	3	Q23	100	2026-02-01 02:22:47.70029
123	8	3	Q25	75	2026-02-01 02:22:47.948753
124	8	3	Q26	75	2026-02-01 02:22:48.121485
125	8	3	Q28	50	2026-02-01 02:22:48.568394
126	8	4	Q31	25	2026-02-01 02:22:49.223793
127	8	4	Q32	25	2026-02-01 02:22:49.433218
128	8	4	Q33	50	2026-02-01 02:22:49.657234
129	8	4	Q34	100	2026-02-01 02:22:50.480153
130	8	5	Q35	100	2026-02-01 02:22:50.695112
131	8	5	Q38	75	2026-02-01 02:22:50.957003
132	8	5	Q41	75	2026-02-01 02:22:51.176441
133	8	6	Q43	25	2026-02-01 02:22:51.992422
134	8	6	Q45	0	2026-02-01 02:22:52.588305
135	8	7	Q48	0	2026-02-01 02:22:52.757841
136	8	7	Q52	25	2026-02-01 02:22:53.388338
137	8	7	Q55	0	2026-02-01 02:22:53.646647
138	8	8	Q56	100	2026-02-01 02:22:55.012412
139	8	8	Q57	100	2026-02-01 02:22:55.225444
140	8	8	Q58	75	2026-02-01 02:22:55.465294
141	8	9	Q59	75	2026-02-01 02:22:56.053797
142	8	9	Q61	100	2026-02-01 02:22:56.347265
143	8	9	Q62	100	2026-02-01 02:22:56.55723
144	8	9	Q64	75	2026-02-01 02:22:56.771968
145	8	10	Q65	75	2026-02-01 02:22:57.016538
146	8	10	Q66	50	2026-02-01 02:22:57.264683
147	8	10	Q68	25	2026-02-01 02:22:57.769986
148	8	10	Q70	50	2026-02-01 02:22:58.800359
149	12	1	Q1	50	2026-02-01 17:17:41.083381
150	12	1	Q2	75	2026-02-01 17:17:41.382954
151	12	1	Q3	75	2026-02-01 17:17:41.595283
152	12	1	Q9	75	2026-02-01 17:17:41.74301
153	12	2	Q13	75	2026-02-01 17:17:42.035862
154	12	2	Q17	50	2026-02-01 17:17:42.294186
155	12	2	Q18	50	2026-02-01 17:17:42.627627
156	12	2	Q19	50	2026-02-01 17:17:42.808893
157	12	3	Q20	75	2026-02-01 17:17:43.29855
158	12	3	Q21	25	2026-02-01 17:17:43.833444
159	12	3	Q23	0	2026-02-01 17:17:44.762793
160	12	3	Q25	0	2026-02-01 17:17:44.962399
161	12	3	Q26	25	2026-02-01 17:17:45.245098
162	12	3	Q28	25	2026-02-01 17:17:45.423395
163	12	4	Q31	50	2026-02-01 17:17:45.644056
164	12	4	Q32	50	2026-02-01 17:17:45.839101
165	12	4	Q33	75	2026-02-01 17:17:46.067493
166	12	4	Q34	75	2026-02-01 17:17:46.248956
167	12	5	Q35	100	2026-02-01 17:17:46.633604
168	12	5	Q38	100	2026-02-01 17:17:46.809372
169	12	5	Q41	75	2026-02-01 17:17:47.025916
170	12	6	Q43	75	2026-02-01 17:17:47.219874
171	12	6	Q45	50	2026-02-01 17:17:47.411442
172	12	7	Q48	75	2026-02-01 17:17:47.791489
173	12	7	Q52	75	2026-02-01 17:17:47.999998
174	12	7	Q55	100	2026-02-01 17:17:48.269723
175	12	8	Q56	100	2026-02-01 17:17:48.433426
176	12	8	Q57	75	2026-02-01 17:17:48.656783
177	12	8	Q58	75	2026-02-01 17:17:48.863425
178	12	9	Q59	50	2026-02-01 17:17:49.170192
179	12	9	Q61	50	2026-02-01 17:17:49.367957
180	12	9	Q62	75	2026-02-01 17:17:49.679412
181	12	9	Q64	100	2026-02-01 17:17:49.960691
182	12	10	Q65	100	2026-02-01 17:17:50.195873
183	12	10	Q66	75	2026-02-01 17:21:09.607621
184	12	10	Q68	100	2026-02-01 17:21:10.243903
185	12	10	Q70	75	2026-02-01 17:21:11.371062
186	9	1	Q1	25	2026-02-02 06:27:21.660841
187	9	1	Q2	75	2026-02-02 06:27:22.142714
188	9	1	Q3	50	2026-02-02 06:27:22.368258
189	9	1	Q9	50	2026-02-02 06:27:22.503032
190	9	2	Q13	50	2026-02-02 06:27:22.713895
191	9	2	Q17	25	2026-02-02 06:27:23.044514
192	9	2	Q18	25	2026-02-02 06:27:23.193932
193	9	2	Q19	25	2026-02-02 06:27:23.561584
194	9	3	Q20	0	2026-02-02 06:27:24.015333
195	9	3	Q21	0	2026-02-02 06:27:24.16449
196	9	3	Q23	25	2026-02-02 06:27:24.462227
197	9	3	Q25	25	2026-02-02 06:27:24.66834
198	9	3	Q26	50	2026-02-02 06:27:24.95675
199	9	3	Q28	50	2026-02-02 06:27:25.146578
200	9	4	Q31	75	2026-02-02 06:27:25.721187
201	9	4	Q32	75	2026-02-02 06:27:25.899395
202	9	4	Q33	100	2026-02-02 06:27:26.154032
203	9	4	Q34	100	2026-02-02 06:27:26.358031
204	9	5	Q35	100	2026-02-02 06:27:26.510098
205	9	5	Q38	75	2026-02-02 06:27:26.743471
206	9	5	Q41	75	2026-02-02 06:27:26.937155
207	9	6	Q43	50	2026-02-02 06:27:27.75965
208	9	6	Q45	50	2026-02-02 06:27:27.982176
209	9	7	Q48	75	2026-02-02 06:27:28.390525
210	9	7	Q52	75	2026-02-02 06:27:28.558118
211	9	7	Q55	100	2026-02-02 06:27:28.811256
212	9	8	Q56	100	2026-02-02 06:27:28.983462
213	9	8	Q57	75	2026-02-02 06:27:29.659083
214	9	8	Q58	75	2026-02-02 06:27:29.870325
215	9	9	Q59	100	2026-02-02 06:27:30.426961
216	9	9	Q61	100	2026-02-02 06:27:30.640875
217	9	9	Q62	100	2026-02-02 06:27:30.80444
218	9	9	Q64	75	2026-02-02 06:27:31.044578
219	9	10	Q65	75	2026-02-02 06:27:31.237345
220	9	10	Q66	50	2026-02-02 06:27:31.563845
221	9	10	Q68	50	2026-02-02 06:27:31.757619
222	9	10	Q70	100	2026-02-02 06:27:32.051229
223	14	1	Q1	75	2026-02-02 06:33:05.237218
224	14	1	Q2	50	2026-02-02 06:33:05.588321
225	14	1	Q3	50	2026-02-02 06:33:05.869969
226	14	1	Q9	50	2026-02-02 06:33:06.118414
227	14	2	Q13	25	2026-02-02 06:33:06.506304
228	14	2	Q17	25	2026-02-02 06:33:06.67736
229	14	2	Q18	0	2026-02-02 06:33:06.886066
230	14	2	Q19	0	2026-02-02 06:33:07.067416
231	14	3	Q20	0	2026-02-02 06:33:07.217093
232	14	3	Q21	25	2026-02-02 06:33:07.456129
233	14	3	Q23	50	2026-02-02 06:33:07.664926
234	14	3	Q25	75	2026-02-02 06:33:08.046464
235	14	3	Q26	75	2026-02-02 06:33:08.231223
236	14	3	Q28	100	2026-02-02 06:33:08.440129
237	14	4	Q31	100	2026-02-02 06:33:08.630944
238	14	4	Q32	100	2026-02-02 06:33:08.811743
239	14	4	Q33	75	2026-02-02 06:33:09.308255
240	14	4	Q34	50	2026-02-02 06:33:09.747477
241	14	5	Q35	25	2026-02-02 06:33:10.261779
242	14	5	Q38	25	2026-02-02 06:33:10.476686
243	14	5	Q41	0	2026-02-02 06:33:10.888442
244	14	6	Q43	75	2026-02-02 06:33:12.177264
245	14	6	Q45	75	2026-02-02 06:33:12.373542
246	14	7	Q48	100	2026-02-02 06:33:12.593473
247	14	7	Q52	100	2026-02-02 06:33:12.780849
248	14	7	Q55	75	2026-02-02 06:33:13.015438
249	14	8	Q56	75	2026-02-02 06:33:13.226458
250	14	8	Q57	50	2026-02-02 06:33:13.594156
251	14	8	Q58	50	2026-02-02 06:33:13.791136
252	14	9	Q59	75	2026-02-02 06:33:14.130875
253	14	9	Q61	75	2026-02-02 06:33:14.348246
254	14	9	Q62	100	2026-02-02 06:33:14.591658
255	14	9	Q64	100	2026-02-02 06:33:14.760359
256	14	10	Q65	75	2026-02-02 06:33:14.988416
257	14	10	Q66	50	2026-02-02 06:33:15.462767
258	14	10	Q68	50	2026-02-02 06:33:15.664868
259	14	10	Q70	75	2026-02-02 06:33:16.043424
260	15	1	Q1	25	2026-02-02 06:59:24.658834
261	15	1	Q2	100	2026-02-02 06:59:24.790485
262	15	1	Q3	75	2026-02-02 06:59:24.999064
263	15	1	Q9	50	2026-02-02 06:59:25.300925
264	15	2	Q13	50	2026-02-02 06:59:25.48918
265	15	2	Q17	25	2026-02-02 06:59:25.735412
266	15	2	Q18	25	2026-02-02 06:59:25.905439
267	15	2	Q19	0	2026-02-02 06:59:26.164657
268	15	3	Q20	0	2026-02-02 06:59:26.381401
269	15	3	Q21	25	2026-02-02 06:59:26.635964
270	15	3	Q23	50	2026-02-02 06:59:26.983584
271	15	3	Q25	75	2026-02-02 06:59:27.221784
272	15	3	Q26	75	2026-02-02 06:59:27.38677
273	15	3	Q28	100	2026-02-02 06:59:27.695043
274	15	4	Q31	100	2026-02-02 06:59:27.933599
275	15	4	Q32	75	2026-02-02 06:59:28.219398
276	15	4	Q33	75	2026-02-02 06:59:28.463658
277	15	4	Q34	50	2026-02-02 06:59:28.713903
278	15	5	Q35	50	2026-02-02 06:59:28.931612
279	15	5	Q38	50	2026-02-02 06:59:29.06204
280	15	5	Q41	75	2026-02-02 06:59:29.309612
281	15	6	Q43	75	2026-02-02 06:59:29.51704
282	15	6	Q45	100	2026-02-02 06:59:29.720962
283	15	7	Q48	75	2026-02-02 06:59:30.140237
284	15	7	Q52	50	2026-02-02 06:59:30.399947
285	15	7	Q55	25	2026-02-02 06:59:30.93981
286	15	8	Q56	25	2026-02-02 06:59:31.105059
287	15	8	Q57	0	2026-02-02 06:59:31.435155
288	15	8	Q58	0	2026-02-02 06:59:31.710281
289	15	9	Q59	25	2026-02-02 06:59:32.006665
290	15	9	Q61	50	2026-02-02 06:59:32.236982
291	15	9	Q62	50	2026-02-02 06:59:32.483134
292	15	9	Q64	75	2026-02-02 06:59:32.717441
293	15	10	Q65	75	2026-02-02 06:59:32.939118
294	15	10	Q66	75	2026-02-02 06:59:33.20631
295	15	10	Q68	50	2026-02-02 06:59:33.495851
296	15	10	Q70	50	2026-02-02 06:59:33.720681
297	18	1	Q1	75	2026-02-02 07:19:34.70784
298	18	1	Q2	75	2026-02-02 07:19:35.042014
299	18	1	Q3	50	2026-02-02 07:19:35.366749
300	18	1	Q9	50	2026-02-02 07:19:35.575137
301	18	2	Q13	25	2026-02-02 07:19:35.902346
302	18	2	Q17	25	2026-02-02 07:19:36.088041
303	18	2	Q18	0	2026-02-02 07:19:36.368216
304	18	2	Q19	0	2026-02-02 07:19:36.564072
305	18	3	Q20	25	2026-02-02 07:19:36.830057
306	18	3	Q21	50	2026-02-02 07:19:37.239407
307	18	3	Q23	50	2026-02-02 07:19:37.4396
308	18	3	Q25	75	2026-02-02 07:19:37.631499
309	18	3	Q26	75	2026-02-02 07:19:37.843331
310	18	3	Q28	100	2026-02-02 07:19:38.29212
311	18	4	Q31	100	2026-02-02 07:19:38.491273
312	18	4	Q32	75	2026-02-02 07:19:38.719725
313	18	4	Q33	75	2026-02-02 07:19:38.954188
314	18	4	Q34	75	2026-02-02 07:19:39.226361
315	18	5	Q35	50	2026-02-02 07:19:39.622572
316	18	5	Q38	50	2026-02-02 07:19:39.824043
317	18	5	Q41	50	2026-02-02 07:19:40.038586
318	18	6	Q43	25	2026-02-02 07:19:40.298631
319	18	6	Q45	25	2026-02-02 07:19:40.486966
320	18	7	Q48	50	2026-02-02 07:19:40.847084
321	18	7	Q52	50	2026-02-02 07:19:41.062645
322	18	7	Q55	75	2026-02-02 07:19:41.330509
323	18	8	Q56	75	2026-02-02 07:19:41.539235
324	18	8	Q57	75	2026-02-02 07:19:41.7205
325	18	8	Q58	100	2026-02-02 07:19:42.027334
326	18	9	Q59	100	2026-02-02 07:19:42.2298
327	18	9	Q61	75	2026-02-02 07:19:42.547809
328	18	9	Q62	75	2026-02-02 07:19:42.771862
329	18	9	Q64	75	2026-02-02 07:19:42.951451
330	18	10	Q65	75	2026-02-02 07:19:43.126898
331	18	10	Q66	75	2026-02-02 07:19:44.306615
332	18	10	Q68	100	2026-02-02 07:19:44.703454
333	18	10	Q70	75	2026-02-02 07:19:45.59395
334	19	1	Q1	75	2026-02-02 07:52:04.59436
335	19	1	Q2	50	2026-02-02 07:52:04.710846
336	19	1	Q3	50	2026-02-02 07:52:04.914653
337	19	1	Q9	25	2026-02-02 07:52:05.21328
338	19	2	Q13	25	2026-02-02 07:52:05.410758
339	19	2	Q17	0	2026-02-02 07:52:05.792845
340	19	2	Q18	0	2026-02-02 07:52:05.988736
341	19	2	Q19	25	2026-02-02 07:52:06.344623
342	19	3	Q20	25	2026-02-02 07:52:06.555195
343	19	3	Q21	50	2026-02-02 07:52:06.797206
344	19	3	Q23	50	2026-02-02 07:52:06.993076
345	19	3	Q25	75	2026-02-02 07:52:07.249827
346	19	3	Q26	75	2026-02-02 07:52:07.460467
347	19	3	Q28	100	2026-02-02 07:52:07.727052
348	19	4	Q31	100	2026-02-02 07:52:07.901191
349	19	4	Q32	75	2026-02-02 07:52:08.159863
350	19	4	Q33	75	2026-02-02 07:52:08.374413
351	19	4	Q34	50	2026-02-02 07:52:08.62804
352	19	5	Q35	50	2026-02-02 07:52:08.836408
353	19	5	Q38	75	2026-02-02 07:52:09.042495
354	19	5	Q41	100	2026-02-02 07:52:09.258828
355	19	6	Q43	100	2026-02-02 07:52:09.396414
356	19	6	Q45	100	2026-02-02 07:52:09.602276
357	19	7	Q48	50	2026-02-02 07:52:09.826847
358	19	7	Q52	25	2026-02-02 07:52:10.226401
359	19	7	Q55	25	2026-02-02 07:52:10.428154
360	19	8	Q56	0	2026-02-02 07:52:10.648653
361	19	8	Q57	0	2026-02-02 07:52:10.843867
362	19	8	Q58	50	2026-02-02 07:52:11.113821
363	19	9	Q59	50	2026-02-02 07:52:11.32131
364	19	9	Q61	75	2026-02-02 07:52:11.617813
365	19	9	Q62	75	2026-02-02 07:52:11.837332
366	19	9	Q64	100	2026-02-02 07:52:12.168807
367	19	10	Q65	100	2026-02-02 07:52:12.380033
368	19	10	Q66	75	2026-02-02 07:52:12.650739
369	19	10	Q68	75	2026-02-02 07:52:12.813449
370	19	10	Q70	50	2026-02-02 07:52:13.989347
371	21	1	Q1	50	2026-02-02 08:09:19.812642
372	21	1	Q2	75	2026-02-02 08:09:20.185725
373	21	1	Q3	75	2026-02-02 08:09:20.408101
374	21	1	Q9	50	2026-02-02 08:09:20.677068
375	21	2	Q13	50	2026-02-02 08:09:20.864215
376	21	2	Q17	25	2026-02-02 08:09:21.178748
377	21	2	Q18	50	2026-02-02 08:09:21.480549
378	21	2	Q19	25	2026-02-02 08:09:21.738558
379	21	3	Q20	0	2026-02-02 08:09:22.002189
380	21	3	Q21	0	2026-02-02 08:09:22.321246
381	21	3	Q23	0	2026-02-02 08:09:22.559654
382	21	3	Q25	25	2026-02-02 08:09:22.77399
383	21	3	Q26	50	2026-02-02 08:09:22.964585
384	21	3	Q28	50	2026-02-02 08:09:23.150497
385	21	4	Q31	75	2026-02-02 08:09:23.394092
386	21	4	Q32	100	2026-02-02 08:09:23.727222
387	21	4	Q33	75	2026-02-02 08:09:23.97629
388	21	4	Q34	75	2026-02-02 08:09:24.172242
389	21	5	Q35	50	2026-02-02 08:09:24.419712
390	21	5	Q38	75	2026-02-02 08:09:24.796499
391	21	5	Q41	75	2026-02-02 08:09:25.032537
392	21	6	Q43	25	2026-02-02 08:09:25.266175
393	21	6	Q45	25	2026-02-02 08:09:25.698477
394	21	7	Q48	25	2026-02-02 08:09:25.9322
395	21	7	Q52	0	2026-02-02 08:09:26.315969
396	21	7	Q55	0	2026-02-02 08:09:26.514485
397	21	8	Q56	75	2026-02-02 08:09:26.751149
398	21	8	Q57	75	2026-02-02 08:09:26.958945
399	21	8	Q58	75	2026-02-02 08:09:27.157497
400	21	9	Q59	100	2026-02-02 08:09:27.425504
401	21	9	Q61	75	2026-02-02 08:09:27.649227
402	21	9	Q62	50	2026-02-02 08:09:27.98482
403	21	9	Q64	75	2026-02-02 08:09:28.389417
404	21	10	Q65	100	2026-02-02 08:09:28.669473
405	21	10	Q66	100	2026-02-02 08:09:28.867637
406	21	10	Q68	75	2026-02-02 08:09:29.359974
407	21	10	Q70	50	2026-02-02 08:09:29.997453
408	23	1	Q1	50	2026-02-02 09:56:24.468143
409	23	1	Q2	75	2026-02-02 09:56:24.822685
410	23	1	Q3	75	2026-02-02 09:56:25.004783
411	23	1	Q9	50	2026-02-02 09:56:25.311606
412	23	2	Q13	50	2026-02-02 09:56:25.491488
413	23	2	Q17	25	2026-02-02 09:56:25.846681
414	23	2	Q18	25	2026-02-02 09:56:25.998259
415	23	2	Q19	0	2026-02-02 09:56:26.264444
416	23	3	Q20	25	2026-02-02 09:56:26.529642
417	23	3	Q21	25	2026-02-02 09:56:26.811438
418	23	3	Q23	25	2026-02-02 09:56:27.011773
419	23	3	Q25	50	2026-02-02 09:56:27.328369
420	23	3	Q26	50	2026-02-02 09:56:27.526249
421	23	3	Q28	75	2026-02-02 09:56:27.798888
422	23	4	Q31	75	2026-02-02 09:56:28.021465
423	23	4	Q32	100	2026-02-02 09:56:28.308104
424	23	4	Q33	100	2026-02-02 09:56:28.48784
425	23	4	Q34	75	2026-02-02 09:56:28.757084
426	23	5	Q35	75	2026-02-02 09:56:28.940774
427	23	5	Q38	50	2026-02-02 09:56:29.193135
428	23	5	Q41	50	2026-02-02 09:56:29.381483
429	23	6	Q43	75	2026-02-02 09:56:29.647573
430	23	6	Q45	75	2026-02-02 09:56:29.819803
431	23	7	Q48	50	2026-02-02 09:56:30.086275
432	23	7	Q52	75	2026-02-02 09:56:30.478565
433	23	7	Q55	75	2026-02-02 09:56:30.661911
434	23	8	Q56	50	2026-02-02 09:56:30.92292
435	23	8	Q57	50	2026-02-02 09:56:31.083059
436	23	8	Q58	25	2026-02-02 09:56:31.348259
437	23	9	Q59	25	2026-02-02 09:56:31.542808
438	23	9	Q61	50	2026-02-02 09:56:31.840132
439	23	9	Q62	50	2026-02-02 09:56:32.045612
440	23	9	Q64	75	2026-02-02 09:56:32.292402
441	23	10	Q65	100	2026-02-02 09:56:32.612037
442	23	10	Q66	75	2026-02-02 09:56:33.031876
443	23	10	Q68	50	2026-02-02 09:56:33.585636
444	23	10	Q70	50	2026-02-02 09:56:34.717
445	25	1	Q1	50	2026-02-02 10:51:36.019326
446	25	1	Q2	75	2026-02-02 10:51:36.456011
447	25	1	Q3	75	2026-02-02 10:51:36.634769
448	25	1	Q9	100	2026-02-02 10:51:36.918625
449	25	2	Q13	100	2026-02-02 10:51:37.139747
450	25	2	Q17	75	2026-02-02 10:51:37.416743
451	25	2	Q18	75	2026-02-02 10:51:37.59649
452	25	2	Q19	50	2026-02-02 10:51:37.854992
453	25	3	Q20	25	2026-02-02 10:51:38.197564
454	25	3	Q21	0	2026-02-02 10:51:38.65437
455	25	3	Q23	50	2026-02-02 10:51:39.253588
456	25	3	Q25	50	2026-02-02 10:51:39.47876
457	25	3	Q26	75	2026-02-02 10:51:39.78006
458	25	3	Q28	75	2026-02-02 10:51:39.949721
459	25	4	Q31	100	2026-02-02 10:51:40.202648
460	25	4	Q32	75	2026-02-02 10:51:40.509129
461	25	4	Q33	75	2026-02-02 10:51:40.710583
462	25	4	Q34	50	2026-02-02 10:51:41.007835
463	25	5	Q35	50	2026-02-02 10:51:41.20078
464	25	5	Q38	25	2026-02-02 10:51:41.448138
465	25	5	Q41	25	2026-02-02 10:51:41.625709
466	25	6	Q43	50	2026-02-02 10:51:41.921377
467	25	6	Q45	75	2026-02-02 10:51:42.324343
468	25	7	Q48	75	2026-02-02 10:51:42.468265
469	25	7	Q52	100	2026-02-02 10:51:42.760475
470	25	7	Q55	75	2026-02-02 10:51:43.028614
471	25	8	Q56	75	2026-02-02 10:51:43.208534
472	25	8	Q57	50	2026-02-02 10:51:43.471407
473	25	8	Q58	50	2026-02-02 10:51:43.665531
474	25	9	Q59	25	2026-02-02 10:51:43.924516
475	25	9	Q61	50	2026-02-02 10:51:44.202042
476	25	9	Q62	75	2026-02-02 10:51:44.511463
477	25	9	Q64	100	2026-02-02 10:51:44.822759
478	25	10	Q65	75	2026-02-02 10:51:45.12783
479	25	10	Q66	75	2026-02-02 10:51:45.333027
480	25	10	Q68	50	2026-02-02 10:51:45.612129
481	25	10	Q70	25	2026-02-02 10:51:45.902043
482	26	1	Q1	75	2026-02-02 10:52:12.076909
483	26	1	Q2	100	2026-02-02 10:52:12.300914
484	26	1	Q3	100	2026-02-02 10:52:12.511017
485	26	1	Q9	75	2026-02-02 10:52:12.734692
486	26	2	Q13	75	2026-02-02 10:52:12.927557
487	26	2	Q17	50	2026-02-02 10:52:13.184287
488	26	2	Q18	75	2026-02-02 10:52:13.45346
489	26	2	Q19	75	2026-02-02 10:52:13.636659
490	26	3	Q20	75	2026-02-02 10:52:13.81053
491	26	3	Q21	100	2026-02-02 10:52:14.434728
492	26	3	Q23	75	2026-02-02 10:53:07.848779
493	26	3	Q25	100	2026-02-02 10:53:08.236243
494	26	3	Q26	75	2026-02-02 10:53:08.529039
495	26	3	Q28	75	2026-02-02 10:53:08.703753
496	26	4	Q31	50	2026-02-02 10:53:08.969479
497	26	4	Q32	50	2026-02-02 10:53:09.14736
498	26	4	Q33	75	2026-02-02 10:53:09.406178
499	26	4	Q34	100	2026-02-02 10:53:09.675281
500	26	5	Q35	100	2026-02-02 10:53:09.91808
501	26	5	Q38	75	2026-02-02 10:53:10.212495
502	26	5	Q41	75	2026-02-02 10:53:10.398854
503	28	1	Q1	75	2026-02-02 14:33:30.100969
504	28	1	Q2	75	2026-02-02 14:33:30.236436
505	28	1	Q3	50	2026-02-02 14:33:30.472561
506	28	1	Q9	50	2026-02-02 14:33:30.642885
507	28	2	Q13	50	2026-02-02 14:33:30.814973
508	28	2	Q17	75	2026-02-02 14:33:31.067395
509	28	2	Q18	75	2026-02-02 14:33:31.248303
510	28	2	Q19	100	2026-02-02 14:33:31.506165
511	28	3	Q20	25	2026-02-02 14:33:31.927997
512	28	3	Q21	25	2026-02-02 14:33:32.119811
513	28	3	Q23	25	2026-02-02 14:33:32.323979
514	28	3	Q25	0	2026-02-02 14:33:32.613866
515	28	3	Q26	0	2026-02-02 14:33:32.829747
516	28	3	Q28	25	2026-02-02 14:33:33.096595
517	28	4	Q31	25	2026-02-02 14:33:33.312288
518	28	4	Q32	50	2026-02-02 14:33:33.538238
519	28	4	Q33	75	2026-02-02 14:33:33.935543
520	28	4	Q34	100	2026-02-02 14:33:34.214937
521	28	5	Q35	50	2026-02-02 14:33:34.512298
522	28	5	Q38	50	2026-02-02 14:33:34.868111
523	28	5	Q41	50	2026-02-02 14:33:35.055816
524	28	6	Q43	25	2026-02-02 14:33:35.262418
525	28	6	Q45	25	2026-02-02 14:33:35.422453
526	28	7	Q48	50	2026-02-02 14:33:35.69449
527	28	7	Q52	50	2026-02-02 14:33:35.877122
528	28	7	Q55	75	2026-02-02 14:33:36.127165
529	28	8	Q56	75	2026-02-02 14:33:36.283298
530	28	8	Q57	100	2026-02-02 14:33:36.551109
531	28	8	Q58	100	2026-02-02 14:33:36.757278
532	28	9	Q59	75	2026-02-02 14:33:37.020849
533	28	9	Q61	50	2026-02-02 14:33:37.368443
534	28	9	Q62	75	2026-02-02 14:33:37.641786
535	28	9	Q64	75	2026-02-02 14:33:37.836131
536	28	10	Q65	75	2026-02-02 14:33:37.964516
537	28	10	Q66	100	2026-02-02 14:33:38.263354
538	28	10	Q68	75	2026-02-02 14:33:38.590593
539	28	10	Q70	100	2026-02-02 14:33:39.280378
540	29	1	Q1	50	2026-02-02 15:12:53.952903
541	29	1	Q2	75	2026-02-02 15:12:54.070583
542	29	1	Q3	75	2026-02-02 15:12:54.272883
543	29	1	Q9	50	2026-02-02 15:12:54.539672
544	29	2	Q13	50	2026-02-02 15:12:54.764673
545	29	2	Q17	50	2026-02-02 15:12:54.966608
546	29	2	Q18	25	2026-02-02 15:12:55.248269
547	29	2	Q19	25	2026-02-02 15:12:55.454553
548	29	3	Q20	50	2026-02-02 15:12:55.759104
549	29	3	Q21	50	2026-02-02 15:12:55.96818
550	29	3	Q23	75	2026-02-02 15:12:56.203832
551	29	3	Q25	75	2026-02-02 15:12:56.398177
552	29	3	Q26	100	2026-02-02 15:12:56.651004
553	29	3	Q28	100	2026-02-02 15:12:56.86807
554	29	4	Q31	50	2026-02-02 15:13:43.082849
555	29	4	Q32	75	2026-02-02 15:13:43.452629
556	29	4	Q33	100	2026-02-02 15:13:43.776554
557	29	4	Q34	100	2026-02-02 15:13:43.964256
558	29	5	Q35	75	2026-02-02 15:13:44.239989
559	29	5	Q38	75	2026-02-02 15:13:44.44432
560	29	5	Q41	50	2026-02-02 15:13:44.749168
561	29	6	Q43	50	2026-02-02 15:13:44.933981
562	29	6	Q45	75	2026-02-02 15:13:45.199521
563	29	7	Q48	100	2026-02-02 15:13:45.647923
564	29	7	Q52	50	2026-02-02 15:13:46.037459
565	29	7	Q55	50	2026-02-02 15:13:46.248764
566	29	8	Q56	25	2026-02-02 15:13:46.453586
567	29	8	Q57	25	2026-02-02 15:13:46.644494
568	29	8	Q58	0	2026-02-02 15:13:46.858269
569	29	9	Q59	0	2026-02-02 15:13:47.061363
570	29	9	Q61	25	2026-02-02 15:13:47.264777
571	29	9	Q62	25	2026-02-02 15:13:47.466863
572	29	9	Q64	50	2026-02-02 15:13:47.659861
573	29	10	Q65	75	2026-02-02 15:13:48.126471
574	29	10	Q66	100	2026-02-02 15:13:48.524895
575	29	10	Q68	75	2026-02-02 15:13:48.869968
576	29	10	Q70	50	2026-02-02 15:13:49.445226
670	30	1	Q1	75	2026-02-03 23:53:38.404616
671	30	1	Q2	100	2026-02-03 23:53:38.669765
672	30	1	Q3	75	2026-02-03 23:53:39.075229
673	30	1	Q9	75	2026-02-03 23:53:39.283184
674	30	2	Q13	75	2026-02-03 23:53:39.45519
675	30	2	Q17	75	2026-02-03 23:53:39.605717
676	30	2	Q18	75	2026-02-03 23:53:39.750167
677	30	2	Q19	100	2026-02-03 23:53:40.042996
678	30	3	Q20	100	2026-02-03 23:53:40.226633
679	30	3	Q21	100	2026-02-03 23:53:40.531286
680	30	3	Q23	75	2026-02-03 23:53:40.769183
721	31	4	Q31	50	2026-02-04 00:01:38.003638
722	31	4	Q32	50	2026-02-04 00:01:38.194041
723	31	4	Q33	75	2026-02-04 00:01:38.571164
724	31	4	Q34	75	2026-02-04 00:01:38.763588
725	31	5	Q35	75	2026-02-04 00:01:38.937587
726	31	5	Q38	100	2026-02-04 00:01:39.15761
681	30	3	Q25	75	2026-02-03 23:53:40.958263
682	30	3	Q26	50	2026-02-03 23:53:41.216109
683	30	3	Q28	50	2026-02-03 23:53:41.424156
684	30	4	Q31	50	2026-02-03 23:53:41.627665
685	30	4	Q32	25	2026-02-03 23:53:41.874503
686	30	4	Q33	25	2026-02-03 23:53:42.201496
687	30	4	Q34	25	2026-02-03 23:53:42.396545
688	30	5	Q35	25	2026-02-03 23:53:42.564
689	30	5	Q38	0	2026-02-03 23:53:42.890149
690	30	5	Q41	0	2026-02-03 23:53:43.081443
691	30	6	Q43	0	2026-02-03 23:53:43.395752
692	30	6	Q45	25	2026-02-03 23:53:43.707524
693	30	7	Q48	25	2026-02-03 23:53:43.908365
694	30	7	Q52	25	2026-02-03 23:53:44.058821
695	30	7	Q55	25	2026-02-03 23:53:44.267028
696	30	8	Q56	50	2026-02-03 23:53:44.490038
697	30	8	Q57	50	2026-02-03 23:53:44.698305
698	30	8	Q58	75	2026-02-03 23:53:45.101313
699	30	9	Q59	75	2026-02-03 23:53:45.281535
700	30	9	Q61	75	2026-02-03 23:53:45.486416
701	30	9	Q62	75	2026-02-03 23:53:45.670332
702	30	9	Q64	75	2026-02-03 23:53:45.850652
703	30	10	Q65	75	2026-02-03 23:53:46.104715
704	30	10	Q66	100	2026-02-03 23:53:46.457474
705	30	10	Q68	100	2026-02-03 23:53:46.654218
706	30	10	Q70	100	2026-02-03 23:53:46.82296
707	31	1	Q1	50	2026-02-04 00:01:34.721515
708	31	1	Q2	75	2026-02-04 00:01:34.949682
709	31	1	Q3	75	2026-02-04 00:01:35.13267
710	31	1	Q9	50	2026-02-04 00:01:35.415074
711	31	2	Q13	50	2026-02-04 00:01:35.600424
712	31	2	Q17	50	2026-02-04 00:01:35.756908
713	31	2	Q18	25	2026-02-04 00:01:36.021635
714	31	2	Q19	25	2026-02-04 00:01:36.188516
717	31	3	Q23	0	2026-02-04 00:01:36.959936
718	31	3	Q25	25	2026-02-04 00:01:37.191953
719	31	3	Q26	25	2026-02-04 00:01:37.396523
720	31	3	Q28	50	2026-02-04 00:01:37.794761
727	31	5	Q41	100	2026-02-04 00:01:39.338378
728	31	6	Q43	100	2026-02-04 00:01:39.524725
729	31	6	Q45	75	2026-02-04 00:01:39.741984
730	31	7	Q48	75	2026-02-04 00:01:39.994866
731	31	7	Q52	100	2026-02-04 00:01:40.271097
732	31	7	Q55	75	2026-02-04 00:01:40.518813
733	31	8	Q56	50	2026-02-04 00:01:40.785312
734	31	8	Q57	50	2026-02-04 00:01:40.988071
735	31	8	Q58	50	2026-02-04 00:01:41.183875
736	31	9	Q59	25	2026-02-04 00:01:41.713734
737	31	9	Q61	25	2026-02-04 00:01:41.928701
738	31	9	Q62	50	2026-02-04 00:01:42.437388
739	31	9	Q64	25	2026-02-04 00:01:43.459206
740	31	10	Q65	50	2026-02-04 00:01:43.851733
741	31	10	Q66	0	2026-02-04 00:01:44.272033
742	31	10	Q68	0	2026-02-04 00:01:44.647245
743	31	10	Q70	50	2026-02-04 00:01:45.295013
756	36	3	Q20	25	2026-02-04 01:02:06.868042
715	31	3	Q20	75	2026-02-04 00:01:36.544265
716	31	3	Q21	25	2026-02-04 00:01:36.77059
748	36	1	Q1	50	2026-02-04 01:02:04.171106
749	36	1	Q2	75	2026-02-04 01:02:04.570745
750	36	1	Q3	50	2026-02-04 01:02:04.998146
751	36	1	Q9	50	2026-02-04 01:02:05.358434
752	36	2	Q13	50	2026-02-04 01:02:05.745303
753	36	2	Q17	50	2026-02-04 01:02:05.983022
754	36	2	Q18	50	2026-02-04 01:02:06.207317
755	36	2	Q19	50	2026-02-04 01:02:06.425267
757	36	3	Q21	25	2026-02-04 01:02:07.088464
758	36	3	Q23	25	2026-02-04 01:02:07.257465
759	36	3	Q25	25	2026-02-04 01:02:07.446975
760	36	3	Q26	25	2026-02-04 01:02:07.656822
761	36	3	Q28	50	2026-02-04 01:02:07.96676
762	36	4	Q31	50	2026-02-04 01:02:08.353998
763	36	4	Q32	50	2026-02-04 01:02:08.550114
764	36	4	Q33	50	2026-02-04 01:02:08.779601
765	36	4	Q34	75	2026-02-04 01:02:09.144195
766	36	5	Q35	100	2026-02-04 01:02:09.74646
767	36	5	Q38	100	2026-02-04 01:02:10.04064
768	36	5	Q41	100	2026-02-04 01:02:10.159754
769	36	6	Q43	100	2026-02-04 01:02:10.311421
770	36	6	Q45	100	2026-02-04 01:02:10.511475
771	36	7	Q48	75	2026-02-04 01:02:10.829704
772	36	7	Q52	75	2026-02-04 01:02:11.046228
773	36	7	Q55	75	2026-02-04 01:02:11.238436
774	36	8	Q56	75	2026-02-04 01:02:11.427248
775	36	8	Q57	75	2026-02-04 01:02:11.630453
776	36	8	Q58	50	2026-02-04 01:02:11.978407
777	36	9	Q59	50	2026-02-04 01:02:12.191444
778	36	9	Q61	50	2026-02-04 01:02:12.400567
779	36	9	Q62	50	2026-02-04 01:02:12.644346
780	36	9	Q64	25	2026-02-04 01:02:12.98542
781	36	10	Q65	25	2026-02-04 01:02:13.205494
782	36	10	Q66	25	2026-02-04 01:02:13.383358
783	36	10	Q68	25	2026-02-04 01:02:13.592394
784	36	10	Q70	50	2026-02-04 01:02:13.997882
788	40	1	Q1	50	2026-02-04 01:03:27.727751
789	40	1	Q2	50	2026-02-04 01:03:27.969328
790	40	1	Q3	50	2026-02-04 01:03:28.178743
791	40	1	Q9	50	2026-02-04 01:03:28.341925
792	40	2	Q13	25	2026-02-04 01:03:28.68543
793	40	2	Q17	25	2026-02-04 01:03:28.90106
794	40	2	Q18	25	2026-02-04 01:03:29.05559
795	40	2	Q19	25	2026-02-04 01:03:29.231679
796	40	3	Q20	25	2026-02-04 01:03:29.478017
797	40	3	Q21	75	2026-02-04 01:03:29.988798
798	40	3	Q23	75	2026-02-04 01:03:30.173461
799	40	3	Q25	75	2026-02-04 01:03:30.339348
800	40	3	Q26	75	2026-02-04 01:03:30.53847
801	40	3	Q28	100	2026-02-04 01:03:30.902913
802	40	4	Q31	100	2026-02-04 01:03:31.232948
803	40	4	Q32	100	2026-02-04 01:03:31.409117
804	40	4	Q33	100	2026-02-04 01:03:31.606374
805	40	4	Q34	75	2026-02-04 01:03:31.890504
806	40	5	Q35	75	2026-02-04 01:03:32.08923
807	40	5	Q38	75	2026-02-04 01:03:32.263569
808	40	5	Q41	50	2026-02-04 01:03:32.574528
809	40	6	Q43	50	2026-02-04 01:03:32.755148
810	40	6	Q45	50	2026-02-04 01:03:32.986797
811	40	7	Q48	25	2026-02-04 01:03:33.309687
812	40	7	Q52	25	2026-02-04 01:03:33.500863
813	40	7	Q55	25	2026-02-04 01:03:33.722689
814	40	8	Q56	0	2026-02-04 01:03:34.011953
815	40	8	Q57	0	2026-02-04 01:03:34.220189
816	40	8	Q58	0	2026-02-04 01:03:34.521386
817	40	9	Q59	25	2026-02-04 01:03:34.853231
818	40	9	Q61	25	2026-02-04 01:03:35.041979
819	40	9	Q62	25	2026-02-04 01:03:35.246065
820	40	9	Q64	50	2026-02-04 01:03:35.552383
821	40	10	Q65	50	2026-02-04 01:03:35.769181
822	40	10	Q66	75	2026-02-04 01:03:36.063685
823	40	10	Q68	100	2026-02-04 01:03:36.647174
824	40	10	Q70	75	2026-02-04 01:03:37.371838
825	42	1	Q1	100	2026-02-04 06:20:20.856312
826	42	1	Q2	100	2026-02-04 06:20:21.341365
827	42	1	Q3	75	2026-02-04 06:20:21.691572
828	42	1	Q9	50	2026-02-04 06:20:22.016934
829	42	2	Q13	25	2026-02-04 06:20:22.357917
830	42	2	Q17	50	2026-02-04 06:20:22.791407
831	42	2	Q18	75	2026-02-04 06:20:23.097773
832	42	2	Q19	100	2026-02-04 06:20:23.421912
833	42	3	Q20	50	2026-02-04 06:20:36.509844
834	42	3	Q21	75	2026-02-04 06:20:36.927861
835	42	3	Q23	100	2026-02-04 06:20:37.290347
836	42	3	Q25	100	2026-02-04 06:20:37.486127
837	42	3	Q26	100	2026-02-04 06:20:37.614734
838	42	3	Q28	100	2026-02-04 06:20:37.797506
839	42	4	Q31	100	2026-02-04 06:20:38.030457
840	42	4	Q32	75	2026-02-04 06:20:38.357296
841	42	4	Q33	75	2026-02-04 06:20:38.657681
842	42	4	Q34	75	2026-02-04 06:20:38.842844
843	42	5	Q35	50	2026-02-04 06:20:39.552315
844	42	5	Q38	50	2026-02-04 06:20:39.70205
845	42	5	Q41	50	2026-02-04 06:20:39.897189
846	42	6	Q43	25	2026-02-04 06:20:40.242422
847	42	6	Q45	25	2026-02-04 06:20:40.446337
848	42	7	Q48	25	2026-02-04 06:20:40.559164
849	42	7	Q52	50	2026-02-04 06:20:40.901523
850	42	7	Q55	50	2026-02-04 06:20:41.081986
851	42	8	Q56	50	2026-02-04 06:20:41.235293
852	42	8	Q57	50	2026-02-04 06:20:41.384514
853	42	8	Q58	0	2026-02-04 06:20:42.052466
854	42	9	Q59	0	2026-02-04 06:20:42.288429
855	42	9	Q61	0	2026-02-04 06:20:42.494304
856	42	9	Q62	0	2026-02-04 06:20:42.693357
857	42	9	Q64	25	2026-02-04 06:20:42.935869
858	42	10	Q65	25	2026-02-04 06:20:43.122675
859	42	10	Q66	25	2026-02-04 06:20:43.404204
860	42	10	Q68	50	2026-02-04 06:20:44.227533
861	42	10	Q70	75	2026-02-04 06:20:45.362453
862	45	1	Q1	50	2026-02-04 06:26:26.699977
863	45	1	Q2	50	2026-02-04 06:26:27.142755
864	45	1	Q3	50	2026-02-04 06:26:27.338865
865	45	1	Q9	50	2026-02-04 06:26:27.509479
866	45	2	Q13	50	2026-02-04 06:26:27.672852
867	45	2	Q17	50	2026-02-04 06:26:27.846681
868	45	2	Q18	25	2026-02-04 06:26:28.14885
869	45	2	Q19	25	2026-02-04 06:26:28.339681
870	45	3	Q20	25	2026-02-04 06:26:28.491741
871	45	3	Q21	25	2026-02-04 06:26:28.657068
872	45	3	Q23	50	2026-02-04 06:26:28.95712
873	45	3	Q25	50	2026-02-04 06:26:29.262077
874	45	3	Q26	0	2026-02-04 06:26:29.630099
875	45	3	Q28	0	2026-02-04 06:26:29.853598
876	45	4	Q31	25	2026-02-04 06:26:30.333713
877	45	4	Q32	25	2026-02-04 06:26:30.669921
878	45	4	Q33	25	2026-02-04 06:26:30.851314
879	45	4	Q34	25	2026-02-04 06:26:30.999036
880	45	5	Q35	0	2026-02-04 06:26:31.252444
881	45	5	Q38	0	2026-02-04 06:26:31.455569
882	45	5	Q41	0	2026-02-04 06:26:31.621999
883	45	6	Q43	75	2026-02-04 06:26:32.331736
884	45	6	Q45	75	2026-02-04 06:26:32.612467
885	45	7	Q48	75	2026-02-04 06:26:32.83016
886	45	7	Q52	75	2026-02-04 06:26:33.013409
887	45	7	Q55	50	2026-02-04 06:26:33.230135
888	45	8	Q56	50	2026-02-04 06:26:33.412897
889	45	8	Q57	50	2026-02-04 06:26:33.627337
890	45	8	Q58	75	2026-02-04 06:26:38.65989
891	45	9	Q59	75	2026-02-04 06:26:38.834586
892	45	9	Q61	75	2026-02-04 06:26:38.975761
893	45	9	Q62	75	2026-02-04 06:26:39.147779
894	45	9	Q64	75	2026-02-04 06:26:39.29694
895	45	10	Q65	50	2026-02-04 06:26:39.635924
896	45	10	Q66	50	2026-02-04 06:26:39.900538
897	45	10	Q68	50	2026-02-04 06:26:40.139163
898	45	10	Q70	100	2026-02-04 06:26:40.765259
\.


--
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
1	2	1	Demandas no Trabalho	75.00	alto	2026-02-01 01:36:13.93776
2	2	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-01 01:36:13.949233
3	2	3	Relações Sociais e Liderança	62.50	medio	2026-02-01 01:36:13.951165
4	2	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-02-01 01:36:13.952342
5	2	5	Valores Organizacionais	25.00	baixo	2026-02-01 01:36:13.953539
6	2	6	Traços de Personalidade	87.50	alto	2026-02-01 01:36:13.954675
7	2	7	Saúde e Bem-Estar	75.00	alto	2026-02-01 01:36:13.95583
8	2	8	Comportamentos Ofensivos	58.33	medio	2026-02-01 01:36:13.956687
9	2	9	Comportamento de Jogo	81.25	alto	2026-02-01 01:36:13.957582
10	2	10	Endividamento Financeiro	43.75	medio	2026-02-01 01:36:13.958394
11	3	1	Demandas no Trabalho	68.75	alto	2026-02-01 01:58:51.506102
12	3	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-02-01 01:58:51.51214
13	3	3	Relações Sociais e Liderança	25.00	baixo	2026-02-01 01:58:51.513003
14	3	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-01 01:58:51.513747
15	3	5	Valores Organizacionais	25.00	baixo	2026-02-01 01:58:51.514471
16	3	6	Traços de Personalidade	87.50	alto	2026-02-01 01:58:51.5152
17	3	7	Saúde e Bem-Estar	75.00	alto	2026-02-01 01:58:51.516012
18	3	8	Comportamentos Ofensivos	83.33	alto	2026-02-01 01:58:51.51701
19	3	9	Comportamento de Jogo	12.50	baixo	2026-02-01 01:58:51.518007
20	3	10	Endividamento Financeiro	31.25	baixo	2026-02-01 01:58:51.518908
21	6	1	Demandas no Trabalho	62.50	medio	2026-02-01 02:12:26.560078
22	6	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-01 02:12:26.565511
23	6	3	Relações Sociais e Liderança	12.50	baixo	2026-02-01 02:12:26.56669
24	6	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-01 02:12:26.567657
25	6	5	Valores Organizacionais	58.33	medio	2026-02-01 02:12:26.568554
26	6	6	Traços de Personalidade	87.50	alto	2026-02-01 02:12:26.569435
27	6	7	Saúde e Bem-Estar	16.67	baixo	2026-02-01 02:12:26.570309
28	6	8	Comportamentos Ofensivos	50.00	medio	2026-02-01 02:12:26.57112
29	6	9	Comportamento de Jogo	75.00	alto	2026-02-01 02:12:26.572157
30	6	10	Endividamento Financeiro	50.00	medio	2026-02-01 02:12:26.573021
31	8	1	Demandas no Trabalho	37.50	medio	2026-02-01 02:22:58.805387
32	8	2	Organização e Conteúdo do Trabalho	18.75	baixo	2026-02-01 02:22:58.810228
33	8	3	Relações Sociais e Liderança	75.00	alto	2026-02-01 02:22:58.811097
34	8	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-01 02:22:58.811861
35	8	5	Valores Organizacionais	83.33	alto	2026-02-01 02:22:58.812724
36	8	6	Traços de Personalidade	12.50	baixo	2026-02-01 02:22:58.813705
37	8	7	Saúde e Bem-Estar	8.33	baixo	2026-02-01 02:22:58.814633
38	8	8	Comportamentos Ofensivos	91.67	alto	2026-02-01 02:22:58.815466
39	8	9	Comportamento de Jogo	87.50	alto	2026-02-01 02:22:58.816108
40	8	10	Endividamento Financeiro	50.00	medio	2026-02-01 02:22:58.816699
41	12	1	Demandas no Trabalho	68.75	alto	2026-02-01 17:21:11.379982
42	12	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-02-01 17:21:11.385066
43	12	3	Relações Sociais e Liderança	25.00	baixo	2026-02-01 17:21:11.387428
44	12	4	Interface Trabalho-Indivíduo	62.50	medio	2026-02-01 17:21:11.388756
45	12	5	Valores Organizacionais	91.67	alto	2026-02-01 17:21:11.390168
46	12	6	Traços de Personalidade	62.50	medio	2026-02-01 17:21:11.39166
47	12	7	Saúde e Bem-Estar	83.33	alto	2026-02-01 17:21:11.393595
48	12	8	Comportamentos Ofensivos	83.33	alto	2026-02-01 17:21:11.398163
49	12	9	Comportamento de Jogo	68.75	alto	2026-02-01 17:21:11.399208
50	12	10	Endividamento Financeiro	87.50	alto	2026-02-01 17:21:11.400191
51	9	1	Demandas no Trabalho	50.00	medio	2026-02-02 06:27:32.058522
52	9	2	Organização e Conteúdo do Trabalho	31.25	baixo	2026-02-02 06:27:32.06406
53	9	3	Relações Sociais e Liderança	25.00	baixo	2026-02-02 06:27:32.065032
54	9	4	Interface Trabalho-Indivíduo	87.50	alto	2026-02-02 06:27:32.065868
55	9	5	Valores Organizacionais	83.33	alto	2026-02-02 06:27:32.066769
56	9	6	Traços de Personalidade	50.00	medio	2026-02-02 06:27:32.067612
57	9	7	Saúde e Bem-Estar	83.33	alto	2026-02-02 06:27:32.068367
58	9	8	Comportamentos Ofensivos	83.33	alto	2026-02-02 06:27:32.068966
59	9	9	Comportamento de Jogo	93.75	alto	2026-02-02 06:27:32.069799
60	9	10	Endividamento Financeiro	68.75	alto	2026-02-02 06:27:32.071075
61	14	1	Demandas no Trabalho	56.25	medio	2026-02-02 06:33:16.049667
62	14	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-02-02 06:33:16.053164
63	14	3	Relações Sociais e Liderança	54.17	medio	2026-02-02 06:33:16.05442
64	14	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-02 06:33:16.055298
65	14	5	Valores Organizacionais	16.67	baixo	2026-02-02 06:33:16.056212
66	14	6	Traços de Personalidade	75.00	alto	2026-02-02 06:33:16.057154
67	14	7	Saúde e Bem-Estar	91.67	alto	2026-02-02 06:33:16.058128
68	14	8	Comportamentos Ofensivos	58.33	medio	2026-02-02 06:33:16.058842
69	14	9	Comportamento de Jogo	87.50	alto	2026-02-02 06:33:16.059431
70	14	10	Endividamento Financeiro	62.50	medio	2026-02-02 06:33:16.059979
71	15	1	Demandas no Trabalho	62.50	medio	2026-02-02 06:59:33.727652
72	15	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-02 06:59:33.732335
73	15	3	Relações Sociais e Liderança	54.17	medio	2026-02-02 06:59:33.733339
74	15	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-02 06:59:33.734282
75	15	5	Valores Organizacionais	58.33	medio	2026-02-02 06:59:33.735165
76	15	6	Traços de Personalidade	87.50	alto	2026-02-02 06:59:33.736126
77	15	7	Saúde e Bem-Estar	50.00	medio	2026-02-02 06:59:33.73715
78	15	8	Comportamentos Ofensivos	25.00	baixo	2026-02-02 06:59:33.738004
79	15	9	Comportamento de Jogo	50.00	medio	2026-02-02 06:59:33.738606
80	15	10	Endividamento Financeiro	62.50	medio	2026-02-02 06:59:33.739162
81	18	1	Demandas no Trabalho	62.50	medio	2026-02-02 07:19:45.599277
82	18	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-02-02 07:19:45.604778
83	18	3	Relações Sociais e Liderança	62.50	medio	2026-02-02 07:19:45.605957
84	18	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-02 07:19:45.606848
85	18	5	Valores Organizacionais	50.00	medio	2026-02-02 07:19:45.607686
86	18	6	Traços de Personalidade	25.00	baixo	2026-02-02 07:19:45.608464
87	18	7	Saúde e Bem-Estar	58.33	medio	2026-02-02 07:19:45.609198
88	18	8	Comportamentos Ofensivos	83.33	alto	2026-02-02 07:19:45.609772
89	18	9	Comportamento de Jogo	81.25	alto	2026-02-02 07:19:45.610345
90	18	10	Endividamento Financeiro	81.25	alto	2026-02-02 07:19:45.610928
91	19	1	Demandas no Trabalho	50.00	medio	2026-02-02 07:52:13.999432
92	19	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-02-02 07:52:14.004249
93	19	3	Relações Sociais e Liderança	62.50	medio	2026-02-02 07:52:14.00756
94	19	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-02 07:52:14.008598
95	19	5	Valores Organizacionais	75.00	alto	2026-02-02 07:52:14.009582
96	19	6	Traços de Personalidade	100.00	alto	2026-02-02 07:52:14.010359
97	19	7	Saúde e Bem-Estar	33.33	medio	2026-02-02 07:52:14.011072
98	19	8	Comportamentos Ofensivos	25.00	baixo	2026-02-02 07:52:14.011649
99	19	9	Comportamento de Jogo	75.00	alto	2026-02-02 07:52:14.012213
100	19	10	Endividamento Financeiro	75.00	alto	2026-02-02 07:52:14.012795
101	21	1	Demandas no Trabalho	62.50	medio	2026-02-02 08:09:30.003501
102	21	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-02 08:09:30.016045
103	21	3	Relações Sociais e Liderança	20.83	baixo	2026-02-02 08:09:30.0172
104	21	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-02 08:09:30.01825
105	21	5	Valores Organizacionais	66.67	alto	2026-02-02 08:09:30.019264
106	21	6	Traços de Personalidade	25.00	baixo	2026-02-02 08:09:30.020378
107	21	7	Saúde e Bem-Estar	8.33	baixo	2026-02-02 08:09:30.021566
108	21	8	Comportamentos Ofensivos	75.00	alto	2026-02-02 08:09:30.022262
109	21	9	Comportamento de Jogo	75.00	alto	2026-02-02 08:09:30.022872
110	21	10	Endividamento Financeiro	81.25	alto	2026-02-02 08:09:30.023443
111	23	1	Demandas no Trabalho	62.50	medio	2026-02-02 09:56:34.723211
112	23	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-02 09:56:34.729516
113	23	3	Relações Sociais e Liderança	41.67	medio	2026-02-02 09:56:34.730886
114	23	4	Interface Trabalho-Indivíduo	87.50	alto	2026-02-02 09:56:34.731995
115	23	5	Valores Organizacionais	58.33	medio	2026-02-02 09:56:34.733299
116	23	6	Traços de Personalidade	75.00	alto	2026-02-02 09:56:34.735485
117	23	7	Saúde e Bem-Estar	66.67	alto	2026-02-02 09:56:34.737039
118	23	8	Comportamentos Ofensivos	41.67	medio	2026-02-02 09:56:34.737883
119	23	9	Comportamento de Jogo	50.00	medio	2026-02-02 09:56:34.738561
120	23	10	Endividamento Financeiro	68.75	alto	2026-02-02 09:56:34.739332
121	25	1	Demandas no Trabalho	75.00	alto	2026-02-02 10:51:45.908462
122	25	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-02 10:51:45.913346
123	25	3	Relações Sociais e Liderança	45.83	medio	2026-02-02 10:51:45.914366
124	25	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-02 10:51:45.916542
125	25	5	Valores Organizacionais	33.33	medio	2026-02-02 10:51:45.917744
126	25	6	Traços de Personalidade	62.50	medio	2026-02-02 10:51:45.918827
127	25	7	Saúde e Bem-Estar	83.33	alto	2026-02-02 10:51:45.919824
128	25	8	Comportamentos Ofensivos	58.33	medio	2026-02-02 10:51:45.920626
129	25	9	Comportamento de Jogo	62.50	medio	2026-02-02 10:51:45.921786
130	25	10	Endividamento Financeiro	56.25	medio	2026-02-02 10:51:45.922723
131	28	1	Demandas no Trabalho	62.50	medio	2026-02-02 14:33:39.286751
132	28	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-02 14:33:39.295884
133	28	3	Relações Sociais e Liderança	16.67	baixo	2026-02-02 14:33:39.297303
134	28	4	Interface Trabalho-Indivíduo	62.50	medio	2026-02-02 14:33:39.298596
135	28	5	Valores Organizacionais	50.00	medio	2026-02-02 14:33:39.299586
136	28	6	Traços de Personalidade	25.00	baixo	2026-02-02 14:33:39.300445
137	28	7	Saúde e Bem-Estar	58.33	medio	2026-02-02 14:33:39.301395
138	28	8	Comportamentos Ofensivos	91.67	alto	2026-02-02 14:33:39.302296
139	28	9	Comportamento de Jogo	68.75	alto	2026-02-02 14:33:39.303048
140	28	10	Endividamento Financeiro	87.50	alto	2026-02-02 14:33:39.303779
141	29	1	Demandas no Trabalho	62.50	medio	2026-02-02 15:13:49.451933
142	29	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-02 15:13:49.458214
143	29	3	Relações Sociais e Liderança	75.00	alto	2026-02-02 15:13:49.45996
144	29	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-02 15:13:49.461514
145	29	5	Valores Organizacionais	66.67	alto	2026-02-02 15:13:49.462576
146	29	6	Traços de Personalidade	62.50	medio	2026-02-02 15:13:49.463486
147	29	7	Saúde e Bem-Estar	66.67	alto	2026-02-02 15:13:49.464536
148	29	8	Comportamentos Ofensivos	25.00	baixo	2026-02-02 15:13:49.465537
149	29	9	Comportamento de Jogo	25.00	baixo	2026-02-02 15:13:49.466491
150	29	10	Endividamento Financeiro	75.00	alto	2026-02-02 15:13:49.467431
161	30	1	Demandas no Trabalho	81.25	alto	2026-02-03 23:26:30.006689
162	30	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-03 23:26:30.006689
163	30	3	Relações Sociais e Liderança	75.00	alto	2026-02-03 23:26:30.006689
164	30	4	Interface Trabalho-Indivíduo	31.25	baixo	2026-02-03 23:26:30.006689
165	30	5	Valores Organizacionais	8.33	baixo	2026-02-03 23:26:30.006689
166	30	6	Traços de Personalidade	12.50	baixo	2026-02-03 23:26:30.006689
167	30	7	Saúde e Bem-Estar	25.00	baixo	2026-02-03 23:26:30.006689
168	30	8	Comportamentos Ofensivos	58.33	medio	2026-02-03 23:26:30.006689
169	30	9	Comportamento de Jogo	75.00	alto	2026-02-03 23:26:30.006689
170	30	10	Endividamento Financeiro	93.75	alto	2026-02-03 23:26:30.006689
151	31	1	Demandas no Trabalho	62.50	medio	2026-02-03 23:08:19.039769
152	31	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-03 23:08:19.039769
153	31	3	Relações Sociais e Liderança	33.33	medio	2026-02-03 23:08:19.039769
154	31	4	Interface Trabalho-Indivíduo	62.50	medio	2026-02-03 23:08:19.039769
155	31	5	Valores Organizacionais	91.67	alto	2026-02-03 23:08:19.039769
156	31	6	Traços de Personalidade	87.50	alto	2026-02-03 23:08:19.039769
157	31	7	Saúde e Bem-Estar	83.33	alto	2026-02-03 23:08:19.039769
158	31	8	Comportamentos Ofensivos	50.00	medio	2026-02-03 23:08:19.039769
159	31	9	Comportamento de Jogo	31.25	baixo	2026-02-03 23:08:19.039769
160	31	10	Endividamento Financeiro	25.00	baixo	2026-02-03 23:08:19.039769
231	36	1	Demandas no Trabalho	56.25	medio	2026-02-04 01:02:14.001815
232	36	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-04 01:02:14.001815
233	36	3	Relações Sociais e Liderança	29.17	baixo	2026-02-04 01:02:14.001815
234	36	4	Interface Trabalho-Indivíduo	56.25	medio	2026-02-04 01:02:14.001815
235	36	5	Valores Organizacionais	100.00	alto	2026-02-04 01:02:14.001815
236	36	6	Traços de Personalidade	100.00	alto	2026-02-04 01:02:14.001815
237	36	7	Saúde e Bem-Estar	75.00	alto	2026-02-04 01:02:14.001815
238	36	8	Comportamentos Ofensivos	66.67	alto	2026-02-04 01:02:14.001815
239	36	9	Comportamento de Jogo	43.75	medio	2026-02-04 01:02:14.001815
240	36	10	Endividamento Financeiro	31.25	baixo	2026-02-04 01:02:14.001815
241	40	1	Demandas no Trabalho	50.00	medio	2026-02-04 01:03:37.374758
242	40	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-04 01:03:37.374758
243	40	3	Relações Sociais e Liderança	70.83	alto	2026-02-04 01:03:37.374758
244	40	4	Interface Trabalho-Indivíduo	93.75	alto	2026-02-04 01:03:37.374758
245	40	5	Valores Organizacionais	66.67	alto	2026-02-04 01:03:37.374758
246	40	6	Traços de Personalidade	50.00	medio	2026-02-04 01:03:37.374758
247	40	7	Saúde e Bem-Estar	25.00	baixo	2026-02-04 01:03:37.374758
248	40	8	Comportamentos Ofensivos	0.00	baixo	2026-02-04 01:03:37.374758
249	40	9	Comportamento de Jogo	31.25	baixo	2026-02-04 01:03:37.374758
250	40	10	Endividamento Financeiro	75.00	alto	2026-02-04 01:03:37.374758
251	42	1	Demandas no Trabalho	81.25	alto	2026-02-04 06:20:45.365865
252	42	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-04 06:20:45.365865
253	42	3	Relações Sociais e Liderança	87.50	alto	2026-02-04 06:20:45.365865
254	42	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-04 06:20:45.365865
255	42	5	Valores Organizacionais	50.00	medio	2026-02-04 06:20:45.365865
256	42	6	Traços de Personalidade	25.00	baixo	2026-02-04 06:20:45.365865
257	42	7	Saúde e Bem-Estar	41.67	medio	2026-02-04 06:20:45.365865
258	42	8	Comportamentos Ofensivos	33.33	medio	2026-02-04 06:20:45.365865
259	42	9	Comportamento de Jogo	6.25	baixo	2026-02-04 06:20:45.365865
260	42	10	Endividamento Financeiro	43.75	medio	2026-02-04 06:20:45.365865
261	45	1	Demandas no Trabalho	50.00	medio	2026-02-04 06:26:40.768236
262	45	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-04 06:26:40.768236
263	45	3	Relações Sociais e Liderança	25.00	baixo	2026-02-04 06:26:40.768236
264	45	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-02-04 06:26:40.768236
265	45	5	Valores Organizacionais	0.00	baixo	2026-02-04 06:26:40.768236
266	45	6	Traços de Personalidade	75.00	alto	2026-02-04 06:26:40.768236
267	45	7	Saúde e Bem-Estar	66.67	alto	2026-02-04 06:26:40.768236
268	45	8	Comportamentos Ofensivos	58.33	medio	2026-02-04 06:26:40.768236
269	45	9	Comportamento de Jogo	75.00	alto	2026-02-04 06:26:40.768236
270	45	10	Endividamento Financeiro	62.50	medio	2026-02-04 06:26:40.768236
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
1	1	2026-01-31 22:23:22.610313
1	2	2026-01-31 22:23:22.610313
1	3	2026-01-31 22:23:22.610313
1	4	2026-01-31 22:23:22.610313
1	5	2026-01-31 22:23:22.610313
1	6	2026-01-31 22:23:22.610313
1	31	2026-01-31 22:23:22.610313
1	32	2026-01-31 22:23:22.610313
1	33	2026-01-31 22:23:22.610313
1	34	2026-01-31 22:23:22.610313
2	11	2026-01-31 22:23:22.610313
2	17	2026-01-31 22:23:22.610313
2	23	2026-01-31 22:23:22.610313
2	27	2026-01-31 22:23:22.610313
2	28	2026-01-31 22:23:22.610313
2	29	2026-01-31 22:23:22.610313
2	35	2026-01-31 22:23:22.610313
3	8	2026-01-31 22:23:22.610313
3	9	2026-01-31 22:23:22.610313
3	10	2026-01-31 22:23:22.610313
3	11	2026-01-31 22:23:22.610313
3	12	2026-01-31 22:23:22.610313
3	13	2026-01-31 22:23:22.610313
3	14	2026-01-31 22:23:22.610313
3	17	2026-01-31 22:23:22.610313
3	18	2026-01-31 22:23:22.610313
3	20	2026-01-31 22:23:22.610313
3	21	2026-01-31 22:23:22.610313
3	23	2026-01-31 22:23:22.610313
3	24	2026-01-31 22:23:22.610313
3	25	2026-01-31 22:23:22.610313
3	26	2026-01-31 22:23:22.610313
3	28	2026-01-31 22:23:22.610313
3	30	2026-01-31 22:23:22.610313
3	35	2026-01-31 22:23:22.610313
3	36	2026-01-31 22:23:22.610313
4	5	2026-01-31 22:23:22.610313
4	7	2026-01-31 22:23:22.610313
4	10	2026-01-31 22:23:22.610313
4	11	2026-01-31 22:23:22.610313
4	12	2026-01-31 22:23:22.610313
4	13	2026-01-31 22:23:22.610313
4	14	2026-01-31 22:23:22.610313
4	17	2026-01-31 22:23:22.610313
4	18	2026-01-31 22:23:22.610313
4	20	2026-01-31 22:23:22.610313
4	21	2026-01-31 22:23:22.610313
4	23	2026-01-31 22:23:22.610313
4	24	2026-01-31 22:23:22.610313
4	25	2026-01-31 22:23:22.610313
4	26	2026-01-31 22:23:22.610313
4	28	2026-01-31 22:23:22.610313
4	30	2026-01-31 22:23:22.610313
4	35	2026-01-31 22:23:22.610313
4	36	2026-01-31 22:23:22.610313
5	15	2026-01-31 22:23:22.610313
5	17	2026-01-31 22:23:22.610313
5	19	2026-01-31 22:23:22.610313
5	28	2026-01-31 22:23:22.610313
5	30	2026-01-31 22:23:22.610313
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, display_name, description, hierarchy_level, active, created_at) FROM stdin;
1	admin	Administrador	Administrador do sistema - gerencia APENAS aspectos administrativos: clÃ­nicas, contratantes, planos e emissores. NÃƒO tem acesso operacional (empresas, funcionÃ¡rios, avaliaÃ§Ãµes, lotes, laudos)	100	t	2026-01-31 22:23:22.610313
2	emissor	Emissor de Laudos	Profissional responsÃ¡vel pela emissÃ£o e assinatura de laudos mÃ©dicos - papel independente	80	t	2026-01-31 22:23:22.610313
3	rh	Gestor de ClÃ­nica (RH)	Gestor de clÃ­nica responsÃ¡vel por gerenciar empresas clientes e seus funcionÃ¡rios	60	t	2026-01-31 22:23:22.610313
4	gestor_entidade	Gestor de Entidade	Gestor de empresa contratante responsÃ¡vel por gerenciar funcionÃ¡rios da prÃ³pria empresa	40	t	2026-01-31 22:23:22.610313
5	funcionario	FuncionÃ¡rio	FuncionÃ¡rio que realiza avaliaÃ§Ãµes	20	t	2026-01-31 22:23:22.610313
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, cpf, nome, role, ativo, criado_em) FROM stdin;
1	00000000000	Admin Dev	admin	t	2026-02-01 16:27:16.370509
\.


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public._migration_issues_id_seq', 1, false);


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analise_estatistica_id_seq', 1, false);


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_access_denied_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 507, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 56, true);


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_laudos_id_seq', 44, true);


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 45, true);


--
-- Name: clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinicas_id_seq', 4, true);


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratacao_personalizada_id_seq', 25, true);


--
-- Name: contratantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratantes_id_seq', 24, true);


--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratantes_senhas_id_seq', 9, true);


--
-- Name: contratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratos_id_seq', 18, true);


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratos_planos_id_seq', 1, false);


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emissao_queue_id_seq', 1, false);


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresas_clientes_id_seq', 3, true);


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fila_emissao_id_seq', 12, true);


--
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 53, true);


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laudo_arquivos_remotos_id_seq', 1, false);


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laudo_downloads_id_seq', 1, false);


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laudo_generation_jobs_id_seq', 1, false);


--
-- Name: laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.laudos_id_seq', 1, false);


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lotes_avaliacao_funcionarios_id_seq', 1, false);


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lotes_avaliacao_id_seq', 1, false);


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mfa_codes_id_seq', 1, false);


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migration_guidelines_id_seq', 1, false);


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificacoes_admin_id_seq', 8, true);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 28, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 9, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 36, true);


--
-- Name: planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.planos_id_seq', 1, true);


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.policy_expression_backups_id_seq', 1, false);


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questao_condicoes_id_seq', 1, false);


--
-- Name: recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recibos_id_seq', 1, false);


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.relatorio_templates_id_seq', 1, false);


--
-- Name: respostas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.respostas_id_seq', 898, true);


--
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultados_id_seq', 270, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: _migration_issues _migration_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_issues
    ADD CONSTRAINT _migration_issues_pkey PRIMARY KEY (id);


--
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);


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
-- Name: auditoria_laudos auditoria_laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT auditoria_laudos_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: avaliacao_resets avaliacao_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: clinicas clinicas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_cnpj_key UNIQUE (cnpj);


--
-- Name: clinicas_empresas clinicas_empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_pkey PRIMARY KEY (clinica_id, empresa_id);


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: contratacao_personalizada contratacao_personalizada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_pkey PRIMARY KEY (id);


--
-- Name: contratantes contratantes_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_cnpj_unique UNIQUE (cnpj);


--
-- Name: contratantes contratantes_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_email_unique UNIQUE (email);


--
-- Name: contratantes contratantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_pkey PRIMARY KEY (id);


--
-- Name: contratantes_senhas contratantes_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT contratantes_senhas_cpf_key UNIQUE (cpf);


--
-- Name: contratantes_senhas contratantes_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT contratantes_senhas_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: contratos_planos contratos_planos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_pkey PRIMARY KEY (id);


--
-- Name: emissao_queue emissao_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_pkey PRIMARY KEY (id);


--
-- Name: empresas_clientes empresas_clientes_cnpj_clinica_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_clinica_key UNIQUE (clinica_id, cnpj);


--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);


--
-- Name: _deprecated_fila_emissao fila_emissao_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._deprecated_fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);


--
-- Name: _deprecated_fila_emissao fila_emissao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._deprecated_fila_emissao
    ADD CONSTRAINT fila_emissao_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


--
-- Name: funcionarios funcionarios_matricula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_matricula_key UNIQUE (matricula);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_pkey PRIMARY KEY (id);


--
-- Name: laudo_downloads laudo_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_pkey PRIMARY KEY (id);


--
-- Name: laudo_generation_jobs laudo_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: laudos laudos_lote_emissor_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);


--
-- Name: laudos laudos_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);


--
-- Name: laudos laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_pkey PRIMARY KEY (id);


--
-- Name: lotes_avaliacao lotes_avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_pkey PRIMARY KEY (id);


--
-- Name: mfa_codes mfa_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT mfa_codes_pkey PRIMARY KEY (id);


--
-- Name: migration_guidelines migration_guidelines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_guidelines
    ADD CONSTRAINT migration_guidelines_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_admin notificacoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: planos planos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT planos_pkey PRIMARY KEY (id);


--
-- Name: policy_expression_backups policy_expression_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_expression_backups
    ADD CONSTRAINT policy_expression_backups_pkey PRIMARY KEY (id);


--
-- Name: questao_condicoes questao_condicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes
    ADD CONSTRAINT questao_condicoes_pkey PRIMARY KEY (id);


--
-- Name: recibos recibos_numero_recibo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_numero_recibo_key UNIQUE (numero_recibo);


--
-- Name: recibos recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pkey PRIMARY KEY (id);


--
-- Name: relatorio_templates relatorio_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relatorio_templates
    ADD CONSTRAINT relatorio_templates_pkey PRIMARY KEY (id);


--
-- Name: respostas respostas_avaliacao_id_grupo_item_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item);


--
-- Name: respostas respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_pkey PRIMARY KEY (id);


--
-- Name: resultados resultados_avaliacao_id_grupo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo);


--
-- Name: resultados resultados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cpf_key UNIQUE (cpf);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: contratantes_senhas_contratante_cpf_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX contratantes_senhas_contratante_cpf_unique ON public.contratantes_senhas USING btree (contratante_id, cpf);


--
-- Name: idx_analise_estatistica_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analise_estatistica_avaliacao ON public.analise_estatistica USING btree (avaliacao_id);


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
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


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
-- Name: idx_auditoria_laudos_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_criado ON public.auditoria_laudos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_laudos_lote_acao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote_acao ON public.auditoria_laudos USING btree (lote_id, acao, criado_em DESC);


--
-- Name: idx_auditoria_laudos_lote_history; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote_history ON public.auditoria_laudos USING btree (lote_id, criado_em DESC) INCLUDE (acao, status, emissor_cpf, observacoes);


--
-- Name: INDEX idx_auditoria_laudos_lote_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_lote_history IS 'Otimiza busca de histÃ³rico completo de auditoria por lote (include para evitar table lookup).';


--
-- Name: idx_auditoria_laudos_pending_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_pending_queue ON public.auditoria_laudos USING btree (lote_id, status, acao, criado_em DESC) WHERE ((status)::text = ANY ((ARRAY['pendente'::character varying, 'reprocessando'::character varying, 'erro'::character varying])::text[]));


--
-- Name: INDEX idx_auditoria_laudos_pending_queue; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_pending_queue IS 'Acelera busca de solicitaÃ§Ãµes pendentes/erro na fila de processamento.';


--
-- Name: idx_auditoria_laudos_solicitado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_solicitado_por ON public.auditoria_laudos USING btree (solicitado_por);


--
-- Name: idx_auditoria_laudos_solicitante_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_solicitante_criado ON public.auditoria_laudos USING btree (emissor_cpf, criado_em DESC) WHERE ((acao)::text = 'emissao_solicitada'::text);


--
-- Name: idx_auditoria_laudos_unique_solicitation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_auditoria_laudos_unique_solicitation ON public.auditoria_laudos USING btree (lote_id, acao, solicitado_por) WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY ((ARRAY['pendente'::character varying, 'reprocessando'::character varying])::text[])));


--
-- Name: INDEX idx_auditoria_laudos_unique_solicitation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_auditoria_laudos_unique_solicitation IS 'Previne solicitaÃ§Ãµes duplicadas de emissÃ£o no mesmo lote enquanto status estiver pendente/reprocessando.';


--
-- Name: idx_auditoria_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario ON public.auditoria USING btree (usuario_cpf);


--
-- Name: idx_avaliacao_resets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_created_at ON public.avaliacao_resets USING btree (created_at DESC);


--
-- Name: idx_avaliacao_resets_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_lote_id ON public.avaliacao_resets USING btree (lote_id);


--
-- Name: idx_avaliacao_resets_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_requested_by ON public.avaliacao_resets USING btree (requested_by_user_id);


--
-- Name: idx_avaliacao_resets_unique_per_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_avaliacao_resets_unique_per_lote ON public.avaliacao_resets USING btree (avaliacao_id, lote_id);


--
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario_cpf ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario_status ON public.avaliacoes USING btree (funcionario_cpf, status);


--
-- Name: idx_avaliacoes_inativada_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_inativada_em ON public.avaliacoes USING btree (inativada_em) WHERE (inativada_em IS NOT NULL);


--
-- Name: idx_avaliacoes_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote_id ON public.avaliacoes USING btree (lote_id);


--
-- Name: idx_avaliacoes_lote_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote_status ON public.avaliacoes USING btree (lote_id, status) WHERE ((status)::text <> 'inativada'::text);


--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);


--
-- Name: idx_clinicas_contratante_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_clinicas_contratante_id_unique ON public.clinicas USING btree (contratante_id);


--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);


--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);


--
-- Name: idx_contratacao_personalizada_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratacao_personalizada_contratante ON public.contratacao_personalizada USING btree (contratante_id);


--
-- Name: idx_contratacao_personalizada_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratacao_personalizada_token ON public.contratacao_personalizada USING btree (payment_link_token);


--
-- Name: idx_contratantes_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_ativa ON public.contratantes USING btree (ativa);


--
-- Name: idx_contratantes_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_cnpj ON public.contratantes USING btree (cnpj);


--
-- Name: idx_contratantes_data_liberacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_data_liberacao ON public.contratantes USING btree (data_liberacao_login);


--
-- Name: idx_contratantes_senhas_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_senhas_contratante ON public.contratantes_senhas USING btree (contratante_id);


--
-- Name: idx_contratantes_senhas_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_senhas_contratante_id ON public.contratantes_senhas USING btree (contratante_id);


--
-- Name: idx_contratantes_senhas_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_senhas_cpf ON public.contratantes_senhas USING btree (cpf);


--
-- Name: idx_contratantes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_status ON public.contratantes USING btree (status);


--
-- Name: idx_contratantes_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_tipo ON public.contratantes USING btree (tipo);


--
-- Name: idx_contratantes_tipo_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratantes_tipo_ativa ON public.contratantes USING btree (tipo, ativa);


--
-- Name: idx_contratos_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_contratante_id ON public.contratos USING btree (contratante_id);


--
-- Name: idx_contratos_planos_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_planos_clinica ON public.contratos_planos USING btree (clinica_id);


--
-- Name: idx_contratos_planos_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_planos_contratante ON public.contratos_planos USING btree (contratante_id);


--
-- Name: idx_dashboard_emissor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dashboard_emissor ON public.lotes_avaliacao USING btree (status, liberado_em DESC) WHERE (((status)::text = ANY ((ARRAY['emissao_solicitada'::character varying, 'emissao_em_andamento'::character varying])::text[])) AND (cancelado_automaticamente = false));


--
-- Name: INDEX idx_dashboard_emissor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_dashboard_emissor IS 'Otimiza query do dashboard do emissor para listar lotes prontos para emissão';


--
-- Name: idx_emissao_queue_proxima_execucao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emissao_queue_proxima_execucao ON public.emissao_queue USING btree (proxima_execucao);


--
-- Name: idx_empresas_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_ativa ON public.empresas_clientes USING btree (ativa);


--
-- Name: idx_empresas_clientes_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clientes_clinica_id ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clinica ON public.empresas_clientes USING btree (clinica_id);


--
-- Name: idx_empresas_clinica_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clinica_ativa ON public.empresas_clientes USING btree (clinica_id) WHERE (ativa = true);


--
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_cnpj ON public.empresas_clientes USING btree (cnpj);


--
-- Name: idx_fila_emissao_lote_tentativas_pendentes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_lote_tentativas_pendentes ON public._deprecated_fila_emissao USING btree (lote_id) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_proxima_tentativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_proxima_tentativa ON public._deprecated_fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_solicitado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitado_em ON public._deprecated_fila_emissao USING btree (solicitado_em DESC);


--
-- Name: idx_fila_emissao_solicitado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitado_por ON public._deprecated_fila_emissao USING btree (solicitado_por);


--
-- Name: idx_fila_emissao_solicitante_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitante_data ON public._deprecated_fila_emissao USING btree (solicitado_por, solicitado_em DESC) WHERE (solicitado_por IS NOT NULL);


--
-- Name: idx_fila_emissao_tipo_solicitante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_tipo_solicitante ON public._deprecated_fila_emissao USING btree (tipo_solicitante);


--
-- Name: idx_fila_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_lote ON public._deprecated_fila_emissao USING btree (lote_id);


--
-- Name: idx_fila_pendente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_pendente ON public._deprecated_fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_funcionarios_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_clinica ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_clinica_id ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_perfil_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_clinica_perfil_ativo ON public.funcionarios USING btree (clinica_id, perfil, ativo);


--
-- Name: idx_funcionarios_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_contratante_id ON public.funcionarios USING btree (contratante_id);


--
-- Name: idx_funcionarios_cpf_clinica_perfil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_cpf_clinica_perfil ON public.funcionarios USING btree (cpf, clinica_id, perfil) WHERE (((perfil)::text = 'rh'::text) AND (ativo = true));


--
-- Name: idx_funcionarios_cpf_perfil_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_cpf_perfil_ativo ON public.funcionarios USING btree (cpf, perfil, ativo);


--
-- Name: idx_funcionarios_data_ultimo_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_data_ultimo_lote ON public.funcionarios USING btree (data_ultimo_lote) WHERE (data_ultimo_lote IS NOT NULL);


--
-- Name: idx_funcionarios_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_empresa ON public.funcionarios USING btree (empresa_id);


--
-- Name: idx_funcionarios_indice_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_indice_avaliacao ON public.funcionarios USING btree (indice_avaliacao);


--
-- Name: idx_funcionarios_matricula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_matricula ON public.funcionarios USING btree (matricula);


--
-- Name: idx_funcionarios_pendencias; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_pendencias ON public.funcionarios USING btree (empresa_id, ativo, indice_avaliacao, data_ultimo_lote) WHERE (ativo = true);


--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);


--
-- Name: idx_funcionarios_perfil_entities; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_perfil_entities ON public.funcionarios USING btree (perfil, clinica_id, contratante_id);


--
-- Name: idx_funcionarios_tipo_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_tipo_clinica ON public.funcionarios USING btree (usuario_tipo, clinica_id) WHERE (clinica_id IS NOT NULL);


--
-- Name: idx_funcionarios_tipo_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_tipo_contratante ON public.funcionarios USING btree (usuario_tipo, contratante_id) WHERE (contratante_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_ultima_avaliacao ON public.funcionarios USING btree (ultima_avaliacao_id) WHERE (ultima_avaliacao_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_ultima_avaliacao_status ON public.funcionarios USING btree (ultima_avaliacao_status) WHERE (ultima_avaliacao_status IS NOT NULL);


--
-- Name: idx_funcionarios_usuario_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_usuario_tipo ON public.funcionarios USING btree (usuario_tipo);


--
-- Name: idx_funcionarios_usuario_tipo_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_usuario_tipo_ativo ON public.funcionarios USING btree (usuario_tipo, ativo);


--
-- Name: idx_laudo_arquivos_remotos_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_arquivos_remotos_laudo_id ON public.laudo_arquivos_remotos USING btree (laudo_id);


--
-- Name: idx_laudo_arquivos_remotos_principal_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_laudo_arquivos_remotos_principal_unique ON public.laudo_arquivos_remotos USING btree (laudo_id) WHERE ((tipo)::text = 'principal'::text);


--
-- Name: idx_laudo_arquivos_remotos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_arquivos_remotos_tipo ON public.laudo_arquivos_remotos USING btree (laudo_id, tipo);


--
-- Name: idx_laudo_downloads_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_created_at ON public.laudo_downloads USING btree (created_at);


--
-- Name: idx_laudo_downloads_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_laudo_id ON public.laudo_downloads USING btree (laudo_id);


--
-- Name: idx_laudo_downloads_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_usuario ON public.laudo_downloads USING btree (usuario_cpf);


--
-- Name: idx_laudo_jobs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_created_at ON public.laudo_generation_jobs USING btree (created_at);


--
-- Name: idx_laudo_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_status ON public.laudo_generation_jobs USING btree (status);


--
-- Name: idx_laudos_arquivo_remoto_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_arquivo_remoto_key ON public.laudos USING btree (arquivo_remoto_key);


--
-- Name: idx_laudos_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_criado_em ON public.laudos USING btree (criado_em DESC);


--
-- Name: idx_laudos_emissor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emissor_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor_cpf ON public.laudos USING btree (emissor_cpf);


--
-- Name: idx_laudos_emissor_cpf_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor_cpf_emitido ON public.laudos USING btree (emissor_cpf, emitido_em DESC);


--
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_laudos_hash_pdf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_hash_pdf ON public.laudos USING btree (hash_pdf) WHERE (hash_pdf IS NOT NULL);


--
-- Name: idx_laudos_id_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_id_lote_id ON public.laudos USING btree (id, lote_id);


--
-- Name: idx_laudos_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_job_id ON public.laudos USING btree (job_id);


--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote_status ON public.laudos USING btree (lote_id, status);


--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);


--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('finalizado'::character varying)::text]));


--
-- Name: idx_lotes_avaliacao_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_avaliacao_emitido_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_emitido_em ON public.lotes_avaliacao USING btree (id) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_lotes_avaliacao_empresa_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);


--
-- Name: idx_lotes_avaliacao_status_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_status_emitido ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_cancelados_auto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_cancelados_auto ON public.lotes_avaliacao USING btree (cancelado_automaticamente, status) WHERE (cancelado_automaticamente = true);


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: idx_lotes_emissao_em_andamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_em_andamento ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_em_andamento'::text);


--
-- Name: idx_lotes_emissao_solicitada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_solicitada ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_emissao_solicitada_liberado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_solicitada_liberado ON public.lotes_avaliacao USING btree (liberado_em DESC) WHERE ((status)::text = 'emissao_solicitada'::text);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_empresa_status_liberado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa_status_liberado ON public.lotes_avaliacao USING btree (empresa_id, status, liberado_em DESC);


--
-- Name: INDEX idx_lotes_empresa_status_liberado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_lotes_empresa_status_liberado IS 'Otimiza queries de relatório por empresa e status';


--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);


--
-- Name: idx_lotes_pronto_emissao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_pronto_emissao ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);


--
-- Name: idx_lotes_status_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status_criado ON public.lotes_avaliacao USING btree (status, criado_em DESC) WHERE ((status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'emissao_solicitada'::character varying])::text[]));


--
-- Name: idx_lotes_tipo_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_tipo_contratante ON public.lotes_avaliacao USING btree (clinica_id, contratante_id, status);


--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);


--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);


--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);


--
-- Name: idx_notificacoes_contratacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_contratacao ON public.notificacoes USING btree (contratacao_personalizada_id);


--
-- Name: idx_notificacoes_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_criado_em ON public.notificacoes USING btree (criado_em DESC);


--
-- Name: idx_notificacoes_destinatario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_destinatario ON public.notificacoes USING btree (destinatario_cpf, destinatario_tipo);


--
-- Name: idx_notificacoes_nao_lidas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_nao_lidas ON public.notificacoes USING btree (destinatario_cpf) WHERE (lida = false);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_pagamentos_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contratante ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contratante_id ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_external_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_external_transaction_id ON public.pagamentos USING btree (external_transaction_id);


--
-- Name: idx_pagamentos_idempotency_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_idempotency_key ON public.pagamentos USING btree (idempotency_key);


--
-- Name: idx_pagamentos_provider_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_provider_event_id ON public.pagamentos USING btree (provider_event_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: idx_questao_condicoes_dependente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_dependente ON public.questao_condicoes USING btree (questao_dependente);


--
-- Name: idx_questao_condicoes_questao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_questao ON public.questao_condicoes USING btree (questao_id);


--
-- Name: idx_recibos_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_ativo ON public.recibos USING btree (ativo);


--
-- Name: idx_recibos_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_contratante ON public.recibos USING btree (contratante_id);


--
-- Name: idx_recibos_contrato; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_contrato ON public.recibos USING btree (contrato_id);


--
-- Name: idx_recibos_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_criado_em ON public.recibos USING btree (criado_em);


--
-- Name: idx_recibos_emitido_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_emitido_por ON public.recibos USING btree (emitido_por);


--
-- Name: idx_recibos_hash_pdf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_hash_pdf ON public.recibos USING btree (hash_pdf);


--
-- Name: idx_recibos_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_numero ON public.recibos USING btree (numero_recibo);


--
-- Name: idx_recibos_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_pagamento ON public.recibos USING btree (pagamento_id);


--
-- Name: idx_recibos_vigencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_vigencia ON public.recibos USING btree (vigencia_inicio, vigencia_fim);


--
-- Name: idx_respostas_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respostas_avaliacao ON public.respostas USING btree (avaliacao_id);


--
-- Name: idx_resultados_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resultados_avaliacao ON public.resultados USING btree (avaliacao_id);


--
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- Name: avaliacoes audit_avaliacoes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_avaliacoes AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: empresas_clientes audit_empresas_clientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_empresas_clientes AFTER INSERT OR DELETE OR UPDATE ON public.empresas_clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: funcionarios audit_funcionarios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_funcionarios AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: laudos audit_laudos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_laudos AFTER INSERT OR DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_change();


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();


--
-- Name: avaliacoes prevent_avaliacao_delete_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_avaliacao_delete_after_emission BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_delete_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_avaliacao_delete_after_emission ON public.avaliacoes IS 'Bloqueia exclusão de avaliação quando laudo já foi emitido';


--
-- Name: avaliacoes prevent_avaliacao_update_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_avaliacao_update_after_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();


--
-- Name: TRIGGER prevent_avaliacao_update_after_emission ON avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_avaliacao_update_after_emission ON public.avaliacoes IS 'Bloqueia atualização de avaliação quando laudo já foi emitido';


--
-- Name: lotes_avaliacao prevent_lote_update_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_lote_update_after_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_status_change_after_emission();


--
-- Name: TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_lote_update_after_emission ON public.lotes_avaliacao IS 'Bloqueia mudanças indevidas no lote após emissão do laudo';


--
-- Name: contratantes_senhas trg_contratantes_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contratantes_senhas_updated_at BEFORE UPDATE ON public.contratantes_senhas FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_senhas_updated_at();


--
-- Name: contratantes trg_contratantes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contratantes_updated_at BEFORE UPDATE ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_updated_at();


--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();


--
-- Name: recibos trg_gerar_numero_recibo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_gerar_numero_recibo BEFORE INSERT ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_gerar_numero_recibo();


--
-- Name: laudo_generation_jobs trg_laudo_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_laudo_jobs_updated_at BEFORE UPDATE ON public.laudo_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();


--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();

ALTER TABLE public.avaliacoes DISABLE TRIGGER trg_protect_avaliacao_after_emit;


--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: lotes_avaliacao trg_registrar_solicitacao_emissao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_registrar_solicitacao_emissao AFTER UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_solicitacao_emissao();


--
-- Name: lotes_avaliacao trg_reservar_id_laudo_on_lote_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert AFTER INSERT ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_reservar_id_laudo_on_lote_insert();


--
-- Name: TRIGGER trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_reservar_id_laudo_on_lote_insert ON public.lotes_avaliacao IS 'Reserva automaticamente ID do laudo quando lote Ã© criado.
Laudo fica em status=rascunho atÃ© emissor processar.';


--
-- Name: lotes_avaliacao trg_validar_transicao_status_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_transicao_status_lote BEFORE UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_validar_transicao_status_lote();


--
-- Name: TRIGGER trg_validar_transicao_status_lote ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trg_validar_transicao_status_lote ON public.lotes_avaliacao IS 'Trigger que valida transições de status antes de atualizar o registro';


--
-- Name: contratacao_personalizada trigger_notificar_pre_cadastro; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notificar_pre_cadastro AFTER INSERT ON public.contratacao_personalizada FOR EACH ROW WHEN (((new.status)::text = 'aguardando_valor_admin'::text)) EXECUTE FUNCTION public.notificar_pre_cadastro_criado();


--
-- Name: contratacao_personalizada trigger_notificar_valor_definido; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notificar_valor_definido AFTER UPDATE ON public.contratacao_personalizada FOR EACH ROW WHEN ((((old.status)::text = 'aguardando_valor_admin'::text) AND ((new.status)::text = 'valor_definido'::text))) EXECUTE FUNCTION public.notificar_valor_definido();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();

ALTER TABLE public.resultados DISABLE TRIGGER trigger_resultado_immutability;


--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: avaliacao_resets avaliacao_resets_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_funcionario_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE SET NULL;


--
-- Name: clinicas_empresas clinicas_empresas_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: contratacao_personalizada contratacao_personalizada_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratantes contratantes_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos_planos contratos_planos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: contratos_planos contratos_planos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id);


--
-- Name: contratos_planos contratos_planos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: emissao_queue emissao_queue_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes empresas_clientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes empresas_clientes_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: _deprecated_fila_emissao fila_emissao_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._deprecated_fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: auditoria_laudos fk_auditoria_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT fk_auditoria_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: contratantes_senhas fk_contratantes_senhas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_senhas
    ADD CONSTRAINT fk_contratantes_senhas_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes fk_empresas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT fk_empresas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_clinica; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE SET NULL;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: laudos fk_laudos_emissor_cpf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_emissor_cpf FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: CONSTRAINT fk_laudos_emissor_cpf ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON public.laudos IS 'Garante que emissor existe na tabela funcionarios. RESTRICT previne deleção de emissor com laudos.';


--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos fk_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT fk_laudos_lote_id ON laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_laudos_lote_id ON public.laudos IS 'Garante integridade referencial: todo laudo deve ter um lote válido';


--
-- Name: lotes_avaliacao fk_lotes_clinica; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT fk_lotes_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contrato; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE RESTRICT;


--
-- Name: respostas fk_respostas_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT fk_respostas_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados fk_resultados_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT fk_resultados_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: funcionarios funcionarios_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: funcionarios funcionarios_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE SET NULL;


--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_downloads laudo_downloads_arquivo_remoto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_arquivo_remoto_id_fkey FOREIGN KEY (arquivo_remoto_id) REFERENCES public.laudo_arquivos_remotos(id) ON DELETE SET NULL;


--
-- Name: laudo_downloads laudo_downloads_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


--
-- Name: laudo_generation_jobs laudo_generation_jobs_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: laudos laudos_emissor_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_emissor_cpf_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey1 FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);


--
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.contratantes_senhas(cpf);


--
-- Name: CONSTRAINT lotes_avaliacao_liberado_por_fkey ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT lotes_avaliacao_liberado_por_fkey ON public.lotes_avaliacao IS 'FK para contratantes_senhas - gestores nÃ£o estÃ£o em funcionarios apÃ³s refatoraÃ§Ã£o';


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_contratacao_personalizada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_contratacao_personalizada_id_fkey FOREIGN KEY (contratacao_personalizada_id) REFERENCES public.contratacao_personalizada(id) ON DELETE CASCADE;


--
-- Name: respostas respostas_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: resultados resultados_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: _deprecated_fila_emissao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._deprecated_fila_emissao ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios admin_restricted_funcionarios; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_restricted_funcionarios ON public.funcionarios USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text]))));


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
-- Name: avaliacao_resets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.avaliacao_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacao_resets avaliacao_resets_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_delete_policy ON public.avaliacao_resets FOR DELETE USING (false);


--
-- Name: avaliacao_resets avaliacao_resets_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor_entidade'::text]))));


--
-- Name: avaliacao_resets avaliacao_resets_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_select_policy ON public.avaliacao_resets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.avaliacoes av
     JOIN public.lotes_avaliacao lot ON ((av.lote_id = lot.id)))
  WHERE ((av.id = avaliacao_resets.avaliacao_id) AND (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (lot.clinica_id = (current_setting('app.current_user_clinica_id'::text, true))::integer)) OR ((current_setting('app.current_user_perfil'::text, true) = 'gestor_entidade'::text) AND (lot.contratante_id = (current_setting('app.current_user_contratante_id'::text, true))::integer)))))));


--
-- Name: avaliacao_resets avaliacao_resets_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_update_policy ON public.avaliacao_resets FOR UPDATE USING (false);


--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: avaliacoes avaliacoes_own_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_own_update ON public.avaliacoes FOR UPDATE USING (((funcionario_cpf)::text = public.current_user_cpf())) WITH CHECK (((funcionario_cpf)::text = public.current_user_cpf()));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: clinicas clinicas_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clinicas_rh_select ON public.clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (id = public.current_user_clinica_id_optional())));


--
-- Name: contratantes contratantes_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contratantes_admin_all ON public.contratantes USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_block_admin ON public.empresas_clientes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: empresas_clientes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas_clientes empresas_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_delete ON public.empresas_clientes FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.funcionarios f
  WHERE ((f.empresa_id = empresas_clientes.id) AND (f.ativo = true)))))));


--
-- Name: empresas_clientes empresas_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_insert ON public.empresas_clientes FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_update ON public.empresas_clientes FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: _deprecated_fila_emissao fila_emissao_emissor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_update ON public._deprecated_fila_emissao FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_update ON _deprecated_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_update ON public._deprecated_fila_emissao IS 'Emissor pode atualizar tentativas e erros (UPDATE)';


--
-- Name: _deprecated_fila_emissao fila_emissao_emissor_view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_view ON public._deprecated_fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_view ON _deprecated_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_view ON public._deprecated_fila_emissao IS 'Emissor pode visualizar fila de trabalho (SELECT)';


--
-- Name: _deprecated_fila_emissao fila_emissao_system_bypass; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_system_bypass ON public._deprecated_fila_emissao USING ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text)) WITH CHECK ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text));


--
-- Name: POLICY fila_emissao_system_bypass ON _deprecated_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_system_bypass ON public._deprecated_fila_emissao IS 'Permite acesso total quando app.system_bypass = true (APIs internas)';


--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios funcionarios_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_block_admin ON public.funcionarios AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios funcionarios_delete_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_delete_simple ON public.funcionarios FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY funcionarios_delete_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_delete_simple ON public.funcionarios IS 'Política DELETE simplificada - Apenas Admin';


--
-- Name: funcionarios funcionarios_insert_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_insert_simple ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_insert_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_insert_simple ON public.funcionarios IS 'Política INSERT simplificada - Admin, RH e Gestor podem inserir';


--
-- Name: funcionarios funcionarios_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_own_select ON public.funcionarios FOR SELECT USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())));


--
-- Name: funcionarios funcionarios_own_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_own_update ON public.funcionarios FOR UPDATE USING (((cpf)::text = public.current_user_cpf())) WITH CHECK (((cpf)::text = public.current_user_cpf()));


--
-- Name: funcionarios funcionarios_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_delete ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_insert ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_select ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios funcionarios_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_update ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios funcionarios_select_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_select_simple ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'admin'::text) OR ((public.current_user_perfil() = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_select_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_select_simple ON public.funcionarios IS 'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';


--
-- Name: funcionarios funcionarios_update_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_update_simple ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));


--
-- Name: POLICY funcionarios_update_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_update_simple ON public.funcionarios IS 'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';


--
-- Name: laudos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));


--
-- Name: lotes_avaliacao lotes_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_insert ON public.lotes_avaliacao FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_update ON public.lotes_avaliacao FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id()) AND ((status)::text <> ALL (ARRAY[('finalizado'::character varying)::text, ('cancelado'::character varying)::text]))));


--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes notificacoes_gestor_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_gestor_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'gestor_entidade'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: notificacoes notificacoes_gestor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_gestor_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'gestor_entidade'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK (((destinatario_tipo = 'gestor_entidade'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions permissions_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY permissions_admin_all ON public.permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: permissions permissions_admin_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY permissions_admin_select ON public.permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY permissions_admin_select ON permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY permissions_admin_select ON public.permissions IS 'Apenas admin pode visualizar permissões';


--
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: respostas respostas_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_block_admin ON public.respostas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

--
-- Name: resultados resultados_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_block_admin ON public.resultados AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: resultados resultados_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_own_select ON public.resultados FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = resultados.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: resultados resultados_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_rh_select ON public.resultados FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM (public.avaliacoes a
     JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((a.id = resultados.avaliacao_id) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


--
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);


--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions role_permissions_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY role_permissions_admin_all ON public.role_permissions USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: role_permissions role_permissions_admin_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY role_permissions_admin_select ON public.role_permissions FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY role_permissions_admin_select ON role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY role_permissions_admin_select ON public.role_permissions IS 'Apenas admin pode visualizar atribuições de permissões';


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_admin_all ON public.roles USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: roles roles_admin_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_admin_select ON public.roles FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY roles_admin_select ON roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY roles_admin_select ON public.roles IS 'Apenas admin pode visualizar papéis';


--
-- PostgreSQL database dump complete
--

