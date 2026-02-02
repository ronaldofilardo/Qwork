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
  IF current_user IN ('dba_maintenance', 'postgres') THEN
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


ALTER FUNCTION public.check_resposta_immutability() OWNER TO postgres;

--
-- Name: FUNCTION check_resposta_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída';


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
    -- Tentar obter perfil da sessÃ£o
    BEGIN
        perfil_usuario := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        perfil_usuario := NULL;
    END;
    
    -- Se nÃ£o houver perfil na sessÃ£o, retornar NULL (sem acesso)
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
-- Name: current_user_tipo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_tipo() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN current_setting('app.current_user_tipo', true);
END;
$$;


ALTER FUNCTION public.current_user_tipo() OWNER TO postgres;

--
-- Name: FUNCTION current_user_tipo(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_tipo() IS 'Retorna o usuario_tipo da sessão atual (app.current_user_tipo)';


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
  IF current_user NOT IN ('dba_maintenance', 'postgres') THEN
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
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
  v_emissor_cpf char(11);
BEGIN
  -- Only act when status changed
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- If conclusion condition is satisfied, update lote and attempt to emit laudo
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- Try select an active emissor (ignore legacy placeholder)
    SELECT cpf INTO v_emissor_cpf
    FROM funcionarios
    WHERE perfil = 'emissor' AND ativo = true AND cpf <> '00000000000' AND perfil <> 'admin'
    ORDER BY criado_em ASC
    LIMIT 1;

    IF v_emissor_cpf IS NOT NULL THEN
      -- We have a valid emissor; perform idempotent upsert to mark laudo as sent
      PERFORM upsert_laudo(NEW.lote_id, v_emissor_cpf, 'Laudo gerado automaticamente', 'enviado');
    ELSE
      -- No emissor available: leave laudo as rascunho (it will have been reserved at lote creation)
      -- Record an admin notification for manual intervention
      BEGIN
        INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
        VALUES ('sem_emissor', format('Lote %s concluído mas nenhum emissor ativo encontrado — laudo permanece em rascunho', NEW.lote_id), NEW.lote_id, NOW());
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Falha ao registrar notificacao_admin (sem_emissor): %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() OWNER TO postgres;

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
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Reservar o mesmo ID para o laudo (em status rascunho) sem atribuir emissor padrão
  INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_reservar_id_laudo_on_lote_insert() OWNER TO postgres;

--
-- Name: gerar_codigo_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_codigo_lote() RETURNS character varying
    LANGUAGE plpgsql
    AS $$

DECLARE

    data_atual VARCHAR(6);

    sequencial INT;

    codigo VARCHAR(20);

BEGIN

    -- Formato: 001-DDMMYY (ex: 001-291125)

    data_atual := TO_CHAR(CURRENT_DATE, 'DDMMYY');



    -- Buscar prÃ³ximo sequencial para a data

    SELECT COALESCE(MAX(CAST(SPLIT_PART(la.codigo, '-', 1) AS INTEGER)), 0) + 1

    INTO sequencial

    FROM lotes_avaliacao la

    WHERE la.codigo LIKE '%-' || data_atual;



    -- Formatar cÃ³digo com zeros Ã  esquerda

    codigo := LPAD(sequencial::TEXT, 3, '0') || '-' || data_atual;



    RETURN codigo;

END;

$$;


ALTER FUNCTION public.gerar_codigo_lote() OWNER TO postgres;

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

  -- Verificar se jÃ¡ tem laudo enviado
  SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = p_lote_id AND status = 'enviado')
  INTO v_tem_laudo;

  -- Pode processar se estÃ¡ concluÃ­do e nÃ£o tem laudo
  RETURN v_status = 'concluido' AND NOT v_tem_laudo;
END;
$$;


ALTER FUNCTION public.lote_pode_ser_processado(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION lote_pode_ser_processado(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.lote_pode_ser_processado(p_lote_id integer) IS 'Verifica se um lote está apto para emissão de laudo';


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


ALTER FUNCTION public.prevent_lote_mutation_during_emission() OWNER TO postgres;

--
-- Name: prevent_lote_status_change_after_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_lote_status_change_after_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se laudo foi emitido e tentando alterar status
    IF OLD.emitido_em IS NOT NULL AND NEW.status != OLD.status THEN
        -- Permitir apenas transiÃ§Ã£o finalizado -> enviado (fluxo normal)
        IF OLD.status = 'finalizado' AND NEW.status = 'enviado' THEN
            RETURN NEW;
        END IF;
        
        RAISE EXCEPTION 
            'NÃ£o Ã© possÃ­vel alterar status do lote % apÃ³s emissÃ£o do laudo. Status atual: %, tentativa: %',
            OLD.codigo, OLD.status, NEW.status
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Lotes com laudo emitido sÃ£o imutÃ¡veis';
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
    lote_codigo VARCHAR;
BEGIN
    -- Buscar informaÃ§Ãµes do lote
    SELECT emitido_em, codigo INTO lote_emitido_em, lote_codigo
    FROM lotes_avaliacao
    WHERE id = NEW.lote_id;
    
    -- Se o laudo foi emitido, bloquear modificaÃ§Ã£o
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'NÃ£o Ã© possÃ­vel modificar avaliaÃ§Ã£o do lote % (cÃ³digo: %). Laudo foi emitido em %.',
            NEW.lote_id, lote_codigo, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos sÃ£o imutÃ¡veis para garantir integridade';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_modification_after_emission() OWNER TO postgres;

--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificação de avaliações após emissão do laudo (imutabilidade)';


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
  lote_processamento_em TIMESTAMP;
BEGIN
  -- Get lote status and emission timestamp
  SELECT status, emitido_em, processamento_em 
  INTO lote_status, lote_emitido_em, lote_processamento_em
  FROM lotes_avaliacao 
  WHERE id = NEW.lote_id;

  -- Block mutations if lote is 'concluido' but not yet emitted
  IF lote_status = 'concluido' AND lote_emitido_em IS NULL THEN
    RAISE EXCEPTION 'Não é permitido modificar avaliações enquanto o lote está em processo de emissão. Status: %, Lote ID: %', 
      lote_status, NEW.lote_id
    USING ERRCODE = '23503',
          HINT = 'Aguarde a conclusão da emissão do laudo antes de fazer alterações.';
  END IF;

  -- Also block if processamento_em is set (being processed right now)
  IF lote_processamento_em IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido modificar avaliações enquanto o lote está sendo processado. Lote ID: %', 
      NEW.lote_id
    USING ERRCODE = '23503',
          HINT = 'O lote está sendo processado neste momento. Aguarde alguns instantes.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_mutation_during_emission() OWNER TO postgres;

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
-- Name: sync_contratantes_funcionarios(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_contratantes_funcionarios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Ao inserir funcionário, criar vínculo automático
  IF (TG_OP = 'INSERT') THEN
    -- Funcionário de clínica
    IF NEW.usuario_tipo = 'funcionario_clinica' AND NEW.clinica_id IS NOT NULL THEN
      INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
      SELECT NEW.id, c.id, c.tipo, NEW.ativo
      FROM clinicas cl
      JOIN contratantes c ON c.id = cl.contratante_id
      WHERE cl.id = NEW.clinica_id
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Funcionário de entidade
    IF NEW.usuario_tipo = 'funcionario_entidade' AND NEW.contratante_id IS NOT NULL THEN
      INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
      VALUES (NEW.id, NEW.contratante_id, 'entidade', NEW.ativo)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Ao atualizar status ativo, sincronizar vínculo
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.ativo != OLD.ativo THEN
      UPDATE contratantes_funcionarios
      SET vinculo_ativo = NEW.ativo,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE funcionario_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_contratantes_funcionarios() OWNER TO postgres;

--
-- Name: FUNCTION sync_contratantes_funcionarios(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_contratantes_funcionarios() IS 'Sincroniza automaticamente vínculos em contratantes_funcionarios ao criar/atualizar funcionários';


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
    -- Try to insert, if conflict update
    INSERT INTO laudos (lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em)
    VALUES (p_lote_id, p_emissor_cpf, p_observacoes, p_status, NOW(), NOW())
    ON CONFLICT (lote_id) DO UPDATE
    SET 
        observacoes = EXCLUDED.observacoes,
        status = EXCLUDED.status,
        emitido_em = NOW(),
        atualizado_em = NOW()
    RETURNING id INTO v_laudo_id;
    
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


ALTER FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote estÃ¡ pronto para laudo (Ã­ndice completo); retorna alertas e mÃ©tricas (anomalias reportadas como alertas, NÃƒO bloqueantes)';


--
-- Name: validar_sessao_rls(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.validar_sessao_rls() OWNER TO postgres;

--
-- Name: FUNCTION validar_sessao_rls(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida que todas as variáveis de contexto RLS necessárias estão configuradas antes de executar queries sensíveis';


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

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as aÃƒÂ§ÃƒÂµes crÃƒÂ­ticas no sistema';


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
    criado_em timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auditoria_laudos OWNER TO postgres;

--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissÃ£o, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'AÃ§Ã£o executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';


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
    contratante_id integer
);


ALTER TABLE public.clinicas OWNER TO postgres;

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
-- Name: contratantes_funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contratantes_funcionarios (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    contratante_id integer NOT NULL,
    tipo_contratante character varying(10) NOT NULL,
    vinculo_ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contratantes_funcionarios_tipo_contratante_check CHECK (((tipo_contratante)::text = ANY ((ARRAY['clinica'::character varying, 'entidade'::character varying])::text[])))
);


ALTER TABLE public.contratantes_funcionarios OWNER TO postgres;

--
-- Name: contratantes_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratantes_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratantes_funcionarios_id_seq OWNER TO postgres;

--
-- Name: contratantes_funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratantes_funcionarios_id_seq OWNED BY public.contratantes_funcionarios.id;


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
    CONSTRAINT contratos_planos_tipo_contratante_check CHECK (((tipo_contratante)::text = ANY ((ARRAY['clinica'::character varying, 'entidade'::character varying])::text[])))
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
-- Name: fila_emissao; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT fila_emissao_tipo_solicitante_check CHECK ((((tipo_solicitante)::text = ANY ((ARRAY['rh'::character varying, 'gestor_entidade'::character varying, 'admin'::character varying])::text[])) OR (tipo_solicitante IS NULL)))
);

ALTER TABLE ONLY public.fila_emissao FORCE ROW LEVEL SECURITY;


ALTER TABLE public.fila_emissao OWNER TO postgres;

--
-- Name: TABLE fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';


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
-- Name: COLUMN fila_emissao.solicitado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.solicitado_por IS 'CPF do RH ou gestor_entidade que solicitou a emissão manual do laudo';


--
-- Name: COLUMN fila_emissao.solicitado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.solicitado_em IS 'Timestamp exato da solicitação manual de emissão';


--
-- Name: COLUMN fila_emissao.tipo_solicitante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.fila_emissao.tipo_solicitante IS 'Perfil do usuário que solicitou: rh, gestor_entidade ou admin';


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

ALTER SEQUENCE public.fila_emissao_id_seq OWNED BY public.fila_emissao.id;


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
    ultimo_lote_codigo character varying(20),
    ultima_avaliacao_data_conclusao timestamp without time zone,
    ultima_avaliacao_status character varying(20),
    ultimo_motivo_inativacao text,
    data_ultimo_lote timestamp without time zone,
    data_nascimento date,
    contratante_id integer,
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    usuario_tipo public.usuario_tipo_enum NOT NULL,
    CONSTRAINT funcionarios_usuario_tipo_exclusivo CHECK ((((usuario_tipo = 'funcionario_clinica'::public.usuario_tipo_enum) AND (empresa_id IS NOT NULL) AND (clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((usuario_tipo = 'funcionario_entidade'::public.usuario_tipo_enum) AND (contratante_id IS NOT NULL) AND (empresa_id IS NULL) AND (clinica_id IS NULL)) OR ((usuario_tipo = 'gestor_rh'::public.usuario_tipo_enum) AND (clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((usuario_tipo = 'gestor_entidade'::public.usuario_tipo_enum) AND (contratante_id IS NOT NULL) AND (clinica_id IS NULL) AND (empresa_id IS NULL)) OR ((usuario_tipo = ANY (ARRAY['admin'::public.usuario_tipo_enum, 'emissor'::public.usuario_tipo_enum])) AND (clinica_id IS NULL) AND (contratante_id IS NULL) AND (empresa_id IS NULL))))
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
-- Name: COLUMN funcionarios.usuario_tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.usuario_tipo IS 'Tipo de usuário no sistema:
- funcionario_clinica: Funcionário de empresa intermediária (clinica_id + empresa_id)
- funcionario_entidade: Funcionário direto de entidade (contratante_id)
- gestor_rh: Gestor de clínica (clinica_id)
- gestor_entidade: Gestor de entidade (contratante_id)
- admin: Administrador global (sem vínculos)
- emissor: Emissor de laudos (sem vínculos)';


--
-- Name: CONSTRAINT funcionarios_usuario_tipo_exclusivo ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT funcionarios_usuario_tipo_exclusivo ON public.funcionarios IS 'Garante vínculos exclusivos por tipo de usuário:
- Funcionário clínica: DEVE ter empresa_id + clinica_id
- Funcionário entidade: DEVE ter contratante_id
- Gestor RH: DEVE ter clinica_id
- Gestor entidade: DEVE ter contratante_id
- Admin/Emissor: NÃO DEVE ter vínculos';


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
    user_cpf character(11),
    user_perfil character varying(20),
    ip_address inet,
    user_agent text,
    download_method character varying(50),
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
    id integer NOT NULL,
    laudo_id integer NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    prioridade integer DEFAULT 5,
    tentativas integer DEFAULT 0,
    max_tentativas integer DEFAULT 3,
    erro_mensagem text,
    worker_id character varying(100),
    criado_em timestamp without time zone DEFAULT now(),
    iniciado_em timestamp without time zone,
    finalizado_em timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laudo_generation_jobs OWNER TO postgres;

--
-- Name: TABLE laudo_generation_jobs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.laudo_generation_jobs IS 'Jobs para geração de PDFs de laudos; consumidos por worker externo.';


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_generation_jobs_id_seq
    AS integer
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
    emissor_cpf character(11) NOT NULL,
    observacoes text,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emitido_em timestamp without time zone,
    enviado_em timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hash_pdf character varying(64),
    arquivo_remoto_provider character varying(32),
    arquivo_remoto_bucket character varying(255),
    arquivo_remoto_key character varying(1024),
    arquivo_remoto_url text,
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text])))
);


ALTER TABLE public.laudos OWNER TO postgres;

--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do PDF do laudo gerado, usado para integridade e auditoria';


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
    id integer NOT NULL,
    clinica_id integer,
    contratante_id integer,
    ano integer NOT NULL,
    mes integer NOT NULL,
    last_sequence integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lote_id_allocator OWNER TO postgres;

--
-- Name: lote_id_allocator_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lote_id_allocator_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lote_id_allocator_id_seq OWNER TO postgres;

--
-- Name: lote_id_allocator_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lote_id_allocator_id_seq OWNED BY public.lote_id_allocator.id;


--
-- Name: lotes_avaliacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes_avaliacao (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    clinica_id integer,
    empresa_id integer,
    titulo character varying(100) NOT NULL,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'rascunho'::character varying,
    liberado_por character(11),
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contratante_id integer,
    auto_emitir_em timestamp with time zone,
    auto_emitir_agendado boolean DEFAULT false,
    hash_pdf character varying(64),
    numero_ordem integer DEFAULT 1 NOT NULL,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    cancelado_automaticamente boolean DEFAULT false,
    motivo_cancelamento text,
    modo_emergencia boolean DEFAULT false,
    motivo_emergencia text,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('cancelado'::character varying)::text, ('finalizado'::character varying)::text, ('concluido'::character varying)::text, ('rascunho'::character varying)::text]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


ALTER TABLE public.lotes_avaliacao OWNER TO postgres;

--
-- Name: COLUMN lotes_avaliacao.auto_emitir_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.auto_emitir_em IS 'Data/hora programada para emissÃ£o automÃ¡tica do laudo (4h apÃ³s conclusÃ£o)';


--
-- Name: COLUMN lotes_avaliacao.auto_emitir_agendado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.auto_emitir_agendado IS 'Flag indicando se a emissÃ£o automÃ¡tica foi agendada';


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
-- Name: COLUMN lotes_avaliacao.modo_emergencia; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.modo_emergencia IS 'Indica se laudo foi emitido via modo emergÃªncia (flag)';


--
-- Name: COLUMN lotes_avaliacao.motivo_emergencia; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_emergencia IS 'Justificativa para uso do modo emergÃªncia';


--
-- Name: CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON public.lotes_avaliacao IS 'Constraint padronizada: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado), rascunho (em criação)';


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
    table_name character varying(255) NOT NULL,
    policy_name character varying(255) NOT NULL,
    policy_type character varying(50),
    policy_expression text NOT NULL,
    backed_up_at timestamp without time zone DEFAULT now(),
    restored_at timestamp without time zone
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
-- Name: v_auditoria_emissoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_auditoria_emissoes AS
 SELECT l.id AS laudo_id,
    l.lote_id,
    la.codigo AS lote_codigo,
    la.contratante_id,
    la.empresa_id,
    fe.solicitado_por AS solicitante_cpf,
    fe.tipo_solicitante AS solicitante_perfil,
    fe.solicitado_em,
    l.emissor_cpf,
    l.emitido_em,
    l.status AS laudo_status,
    la.status AS lote_status,
    l.hash_pdf
   FROM ((public.laudos l
     JOIN public.lotes_avaliacao la ON ((l.lote_id = la.id)))
     LEFT JOIN public.fila_emissao fe ON ((l.lote_id = fe.lote_id)))
  ORDER BY l.emitido_em DESC NULLS LAST;


ALTER VIEW public.v_auditoria_emissoes OWNER TO postgres;

--
-- Name: VIEW v_auditoria_emissoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View consolidada para auditoria: liga solicitante → emissor → laudo com rastreabilidade completa';


--
-- Name: v_relatorio_emissoes_usuario; Type: VIEW; Schema: public; Owner: postgres
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
    min(fe.solicitado_em) AS primeira_solicitacao,
    max(fe.solicitado_em) AS ultima_solicitacao
   FROM (public.fila_emissao fe
     LEFT JOIN public.laudos l ON ((fe.lote_id = l.lote_id)))
  WHERE (fe.solicitado_por IS NOT NULL)
  GROUP BY fe.solicitado_por, fe.tipo_solicitante
  ORDER BY (count(*)) DESC;


ALTER VIEW public.v_relatorio_emissoes_usuario OWNER TO postgres;

--
-- Name: VIEW v_relatorio_emissoes_usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_relatorio_emissoes_usuario IS 'Relatório estatístico de emissões por usuário (RH ou gestor_entidade) para auditoria e compliance';


--
-- Name: vw_alertas_emissao_laudos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_alertas_emissao_laudos AS
 SELECT la.id,
    la.codigo,
    la.status,
        CASE
            WHEN (((la.status)::text = 'concluido'::text) AND (la.emitido_em IS NULL) AND (la.atualizado_em < (now() - '00:05:00'::interval))) THEN 'CRITICO: Lote concluÃ­do hÃ¡ mais de 5min sem emissÃ£o'::text
            WHEN ((la.emitido_em IS NOT NULL) AND (la.enviado_em IS NULL) AND (la.auto_emitir_em < (now() - '00:05:00'::interval))) THEN 'CRITICO: Lote emitido hÃ¡ mais de 5min sem envio'::text
            WHEN ((la.auto_emitir_agendado = true) AND ((la.status)::text = 'ativo'::text) AND (la.auto_emitir_em < now())) THEN 'AVISO: Lote ativo com auto_emitir_em vencido'::text
            ELSE 'OK'::text
        END AS tipo_alerta,
    la.atualizado_em AS concluido_em,
    la.emitido_em,
    la.enviado_em,
    la.auto_emitir_em,
    (EXTRACT(epoch FROM (now() - (la.atualizado_em)::timestamp with time zone)))::integer AS idade_conclusao_segundos,
    COALESCE(ec.nome, cont.nome) AS entidade_nome
   FROM ((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
  WHERE ((((la.status)::text = 'concluido'::text) AND (la.emitido_em IS NULL)) OR ((la.emitido_em IS NOT NULL) AND (la.enviado_em IS NULL)) OR ((la.auto_emitir_agendado = true) AND ((la.status)::text = 'ativo'::text) AND (la.auto_emitir_em < now())));


ALTER VIEW public.vw_alertas_emissao_laudos OWNER TO postgres;

--
-- Name: VIEW vw_alertas_emissao_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_alertas_emissao_laudos IS 'Alertas de lotes com problemas no fluxo de emissÃ£o automÃ¡tica';


--
-- Name: vw_alertas_lotes_stuck; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_alertas_lotes_stuck AS
 SELECT la.id AS lote_id,
    la.codigo,
    la.status,
    COALESCE(ec.nome, cont.nome) AS empresa_nome,
    COALESCE(c.nome, cont.nome) AS clinica_nome,
        CASE
            WHEN (la.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (la.contratante_id IS NOT NULL) THEN 'entidade'::text
            ELSE 'desconhecido'::text
        END AS tipo_contratante,
    la.liberado_em,
    la.atualizado_em,
    (EXTRACT(epoch FROM (now() - (la.atualizado_em)::timestamp with time zone)) / (3600)::numeric) AS horas_sem_atualizacao,
    count(a.id) AS total_avaliacoes,
    count(
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN 1
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    la.auto_emitir_em,
    la.auto_emitir_agendado
   FROM ((((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     LEFT JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
  WHERE (((la.status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'finalizado'::character varying])::text[])) AND (la.atualizado_em < (now() - '48:00:00'::interval)))
  GROUP BY la.id, la.codigo, la.status, ec.nome, cont.nome, c.nome, la.liberado_em, la.atualizado_em, la.auto_emitir_em, la.auto_emitir_agendado, la.clinica_id, la.contratante_id;


ALTER VIEW public.vw_alertas_lotes_stuck OWNER TO postgres;

--
-- Name: VIEW vw_alertas_lotes_stuck; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_alertas_lotes_stuck IS 'Lotes sem atualizaÃ§Ã£o hÃ¡ mais de 48h, indicando possÃ­vel problema no fluxo';


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
-- Name: vw_auditoria_avaliacoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_auditoria_avaliacoes AS
 SELECT a.id AS avaliacao_id,
    a.funcionario_cpf AS cpf,
    f.clinica_id,
    f.empresa_id,
    l.codigo AS lote,
    l.status AS lote_status,
        CASE
            WHEN ((l.status)::text = 'pendente'::text) THEN true
            ELSE false
        END AS liberado,
    a.status AS avaliacao_status,
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN true
            ELSE false
        END AS concluida,
        CASE
            WHEN ((a.status)::text = 'inativada'::text) THEN true
            ELSE false
        END AS inativada,
    ( SELECT count(*) AS count
           FROM public.audit_logs
          WHERE (((audit_logs.resource)::text = 'avaliacoes'::text) AND (audit_logs.resource_id = (a.id)::text) AND ((audit_logs.action)::text = 'UPDATE'::text) AND ((audit_logs.old_data ->> 'status'::text) <> (audit_logs.new_data ->> 'status'::text)))) AS numero_interrupcoes,
    a.inicio AS iniciada_em,
    a.envio AS concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome
   FROM ((((public.avaliacoes a
     LEFT JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
     LEFT JOIN public.clinicas c ON ((c.id = f.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = f.empresa_id)))
  ORDER BY a.criado_em DESC;


ALTER VIEW public.vw_auditoria_avaliacoes OWNER TO postgres;

--
-- Name: VIEW vw_auditoria_avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_auditoria_avaliacoes IS 'View agregada para auditoria de avaliaÃ§Ãµes com todas as informaÃ§Ãµes necessÃ¡rias';


--
-- Name: vw_auditoria_laudos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_auditoria_laudos AS
 SELECT ld.id AS laudo_id,
    ld.emissor_cpf,
    f.nome AS emissor_nome,
    l.clinica_id,
    l.empresa_id,
    l.id AS lote_id,
    l.codigo AS numero_lote,
    ld.status,
    ld.hash_pdf,
    ld.criado_em,
    ld.emitido_em,
    ld.enviado_em,
    ld.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome,
        CASE
            WHEN (ld.hash_pdf IS NOT NULL) THEN true
            ELSE false
        END AS tem_arquivo_pdf,
    0 AS tamanho_pdf_kb
   FROM ((((public.laudos ld
     LEFT JOIN public.funcionarios f ON ((f.cpf = ld.emissor_cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = ld.lote_id)))
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
  ORDER BY ld.criado_em DESC;


ALTER VIEW public.vw_auditoria_laudos OWNER TO postgres;

--
-- Name: VIEW vw_auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_auditoria_laudos IS 'View agregada para auditoria de laudos com informaÃ§Ãµes de emissÃ£o e hash';


--
-- Name: vw_auditoria_lotes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_auditoria_lotes AS
 SELECT l.id AS lote_id,
    l.codigo AS numero_lote,
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
          WHERE (((audit_logs.resource)::text = 'lotes_avaliacao'::text) AND (audit_logs.resource_id = (l.id)::text) AND ((audit_logs.action)::text = 'lote_status_change'::text))) AS mudancas_status
   FROM (((public.lotes_avaliacao l
     LEFT JOIN public.funcionarios f ON ((f.cpf = l.liberado_por)))
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
  ORDER BY l.criado_em DESC;


ALTER VIEW public.vw_auditoria_lotes OWNER TO postgres;

--
-- Name: VIEW vw_auditoria_lotes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_auditoria_lotes IS 'View agregada para auditoria de lotes com estatÃ­sticas e histÃ³rico';


--
-- Name: vw_comparativo_empresas; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_comparativo_empresas OWNER TO postgres;

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
-- Name: vw_health_check_contratantes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_health_check_contratantes AS
 SELECT COALESCE(la.clinica_id, la.contratante_id) AS contratante_ref_id,
        CASE
            WHEN (la.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (la.contratante_id IS NOT NULL) THEN 'entidade'::text
            ELSE 'desconhecido'::text
        END AS tipo_contratante,
    COALESCE(c.nome, cont.nome) AS nome_contratante,
    count(DISTINCT la.id) AS total_lotes_ativos,
    count(DISTINCT
        CASE
            WHEN ((la.status)::text = 'concluido'::text) THEN la.id
            ELSE NULL::integer
        END) AS lotes_concluidos_pendentes,
    count(DISTINCT
        CASE
            WHEN ((la.auto_emitir_em <= now()) AND ((la.status)::text = 'concluido'::text)) THEN la.id
            ELSE NULL::integer
        END) AS lotes_atrasados_critico,
    COALESCE(c.ativa, cont.ativa, false) AS contratante_ativo,
    max(la.atualizado_em) AS ultima_atividade
   FROM ((public.lotes_avaliacao la
     LEFT JOIN public.clinicas c ON ((la.clinica_id = c.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
  WHERE ((la.status)::text <> 'cancelado'::text)
  GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, c.ativa, cont.ativa;


ALTER VIEW public.vw_health_check_contratantes OWNER TO postgres;

--
-- Name: VIEW vw_health_check_contratantes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_health_check_contratantes IS 'Health check rÃ¡pido de todos os contratantes (clÃ­nicas e entidades) com lotes ativos';


--
-- Name: vw_lotes_por_contratante; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_lotes_por_contratante AS
 SELECT COALESCE(la.clinica_id, NULL::integer) AS clinica_id,
    COALESCE(la.contratante_id, NULL::integer) AS contratante_id,
        CASE
            WHEN (la.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (la.contratante_id IS NOT NULL) THEN 'entidade'::text
            ELSE 'desconhecido'::text
        END AS tipo_contratante,
    COALESCE(c.nome, cont.nome, 'N/A'::character varying) AS nome_contratante,
    la.status,
    count(*) AS total_lotes,
    count(
        CASE
            WHEN (la.auto_emitir_agendado = true) THEN 1
            ELSE NULL::integer
        END) AS lotes_agendados,
    count(
        CASE
            WHEN ((la.auto_emitir_em <= now()) AND ((la.status)::text = 'concluido'::text)) THEN 1
            ELSE NULL::integer
        END) AS lotes_atrasados,
    avg((EXTRACT(epoch FROM (now() - (la.liberado_em)::timestamp with time zone)) / (86400)::numeric)) AS idade_media_dias
   FROM ((public.lotes_avaliacao la
     LEFT JOIN public.clinicas c ON ((la.clinica_id = c.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
  WHERE ((la.status)::text <> 'cancelado'::text)
  GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, la.status;


ALTER VIEW public.vw_lotes_por_contratante OWNER TO postgres;

--
-- Name: VIEW vw_lotes_por_contratante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_lotes_por_contratante IS 'MÃ©tricas agregadas de lotes por contratante (clÃ­nica ou entidade), incluindo lotes atrasados e agendados';


--
-- Name: vw_metricas_emissao_laudos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_metricas_emissao_laudos AS
 SELECT la.id,
    la.codigo,
    la.status,
    la.liberado_em,
    la.atualizado_em AS concluido_em,
    la.emitido_em,
    la.enviado_em,
    (EXTRACT(epoch FROM (la.emitido_em - (la.atualizado_em)::timestamp with time zone)))::integer AS latencia_emissao_segundos,
    (EXTRACT(epoch FROM (la.enviado_em - la.emitido_em)))::integer AS latencia_envio_segundos,
    (EXTRACT(epoch FROM (la.enviado_em - (la.liberado_em)::timestamp with time zone)))::integer AS latencia_total_segundos,
    la.auto_emitir_agendado,
    la.auto_emitir_em,
    la.cancelado_automaticamente,
    la.motivo_cancelamento,
    COALESCE(ec.nome, cont.nome) AS entidade_nome
   FROM ((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     LEFT JOIN public.contratantes cont ON ((la.contratante_id = cont.id)))
  WHERE (((la.status)::text = ANY ((ARRAY['concluido'::character varying, 'cancelado'::character varying])::text[])) OR (la.emitido_em IS NOT NULL));


ALTER VIEW public.vw_metricas_emissao_laudos OWNER TO postgres;

--
-- Name: VIEW vw_metricas_emissao_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_metricas_emissao_laudos IS 'MÃ©tricas de latÃªncia e status para monitoramento de emissÃ£o automÃ¡tica';


--
-- Name: vw_recibos_completos; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_recibos_completos OWNER TO postgres;

--
-- Name: VIEW vw_recibos_completos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_recibos_completos IS 'View com informaÃ§Ãµes completas de recibos incluindo dados de contrato, contratante, plano e pagamento';


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
-- Name: contratantes_funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_funcionarios ALTER COLUMN id SET DEFAULT nextval('public.contratantes_funcionarios_id_seq'::regclass);


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
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq'::regclass);


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
-- Name: lote_id_allocator id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_id_allocator ALTER COLUMN id SET DEFAULT nextval('public.lote_id_allocator_id_seq'::regclass);


--
-- Name: lotes_avaliacao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao ALTER COLUMN id SET DEFAULT nextval('public.lotes_avaliacao_id_seq'::regclass);


--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);


--
-- Name: migration_guidelines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_guidelines ALTER COLUMN id SET DEFAULT nextval('public.migration_guidelines_id_seq'::regclass);


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
-- Data for Name: backup_laudos_contratante_1; Type: TABLE DATA; Schema: backups; Owner: postgres
--

COPY backups.backup_laudos_contratante_1 (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
1	1	00000000000	Laudo gerado automaticamente para lote finalizado	enviado	2026-01-29 02:40:56.797537	2026-01-29 02:42:26.224584	\N	2026-01-29 02:42:26.224584	\N	\N	\N	\N	\N	\N
4	4	00000000000	Laudo gerado automaticamente para lote concluido	enviado	2026-01-29 02:31:23.068827	2026-01-29 02:31:23.068827	\N	2026-01-29 02:31:23.068827	\N	\N	\N	\N	\N	\N
6	6	00000000000	Laudo gerado automaticamente	enviado	2026-01-29 02:51:12.518347	2026-01-29 02:52:37.439763	\N	2026-01-29 02:52:37.439763	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: backup_resultados_contratante_1; Type: TABLE DATA; Schema: backups; Owner: postgres
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
5	00000000000	admin	DELETE	planos	3	{"id": 3, "nome": "Plano Fixo BÃ¡sico", "tipo": "fixo", "preco": "1224.00"}	\N	\N	\N	sfsddssdgsgdd	2026-01-22 22:25:59.003799
6	00000000000	admin	DELETE	planos	2	{"id": 2, "nome": "Plano Fixo Premium", "tipo": "fixo", "preco": "3999.99"}	\N	\N	\N	vvvfgfgsg	2026-01-22 22:26:05.163306
7	00000000000	admin	DELETE	planos	1	{"id": 1, "nome": "Plano Fixo Básico", "tipo": "fixo", "preco": "1224.00"}	\N	\N	\N	g  vbbxbvxbbc	2026-01-22 22:26:11.496418
10	11111111111	admin	INSERT	empresas_clientes	3	\N	{"id": 3, "cep": null, "cnpj": "22222222000199", "nome": "Empresa da Entidade", "ativa": true, "email": "empresa@entidade.com", "cidade": "Sao Paulo", "estado": "SP", "endereco": null, "telefone": "(11) 2222-2222", "criado_em": "2026-01-22T22:36:51.040159", "clinica_id": null, "atualizado_em": "2026-01-22T22:36:51.040159", "contratante_id": 7}	\N	\N	Record created	2026-01-22 22:36:51.040159
12	11111111111	admin	INSERT	empresas_clientes	4	\N	{"id": 4, "cep": null, "cnpj": "22222222000199", "nome": "Empresa da Entidade", "ativa": true, "email": "empresa@entidade.com", "cidade": "Sao Paulo", "estado": "SP", "endereco": null, "telefone": "(11) 2222-2222", "criado_em": "2026-01-22T22:37:39.363117", "clinica_id": null, "atualizado_em": "2026-01-22T22:37:39.363117", "contratante_id": 7}	\N	\N	Record created	2026-01-22 22:37:39.363117
13	00000000000	admin	DELETE	planos	1	{"id": 1, "nome": "Plano Fixo Basico", "tipo": "fixo", "preco": "1224.00"}	\N	\N	\N	wrqrqwqwrrqw	2026-01-22 22:39:01.67798
14	00000000000	admin	DELETE	planos	3	{"id": 3, "nome": "Plano Fixo Enterprise", "tipo": "fixo", "preco": "8999.99"}	\N	\N	\N	dfdfdsffsdsdf	2026-01-22 22:39:10.311579
15	00000000000	admin	DELETE	planos	2	{"id": 2, "nome": "Plano Fixo Premium", "tipo": "fixo", "preco": "3999.99"}	\N	\N	\N	fefdfasdafsfas	2026-01-22 22:39:16.213684
16	00000000000	admin	DELETE	contratante	1	{"id": 1, "nome": "Entidade Teste Sistema", "status": "pendente"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Contratante deletado: Entidade Teste Sistema	2026-01-22 23:28:50.428682
17	00000000000	admin	DELETE	contratante	6	{"id": 6, "nome": "Empresa Teste Fluxo", "status": "pendente"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Contratante deletado: Empresa Teste Fluxo	2026-01-22 23:28:59.938449
18	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 00:48:09.309063
19	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 00:56:40.556931
20	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:07:14.291115
21	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:09:39.608393
22	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:12:52.510423
23	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:14:52.542953
24	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:19:40.17558
25	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:21:56.920534
26	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:25:04.220867
27	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:38:00.754433
49	\N	\N	INSERT	avaliacoes	2	\N	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "iniciada", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "atualizado_em": "2026-01-23T08:53:56.181836", "funcionario_cpf": "93358341062"}	\N	\N	Record created	2026-01-23 08:53:56.181836
28	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:41:18.496
29	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:45:45.618674
30	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:52:03.48214
31	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 01:54:24.257684
33	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 02:29:04.838064
35	00000000000	admin	UPDATE	contratacao_personalizada	9	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1000, "numero_funcionarios": 100, "valor_por_funcionario": 10}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 10/func, Total: R$ 1000	2026-01-23 02:36:49.639326
36	00000000000	admin	UPDATE	contratacao_personalizada	10	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 5000, "numero_funcionarios": 1000, "valor_por_funcionario": 5}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 5/func, Total: R$ 5000	2026-01-23 03:07:49.615349
41	\N	\N	INSERT	funcionarios	16	\N	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "\\\\\\\\\\\\", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 08:32:13.316807
42	\N	\N	INSERT	funcionarios	17	\N	{"id": 17, "cpf": "70847446069", "nome": "rondasklfoi jjiouo", "ativo": true, "email": "oiuoiui@jljlk.com", "setor": "uiuo", "turno": null, "escala": null, "funcao": "ouoiuoi", "perfil": "funcionario", "criado_em": "2026-01-23T08:35:21.626058", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$NF1sRN/r75xZanZwR4uNYuXfq/BVT3QcjZ8PWNsvJ4MXWLOVmrcuW", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T08:35:21.626058", "contratante_id": 9, "data_nascimento": "2000-01-01", "data_ultimo_lote": null, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 08:35:21.626058
43	04703084945	rh	INSERT	empresas_clientes	5	\N	{"id": 5, "cep": "15123489", "cnpj": "23020477000134", "nome": "Empresa teste", "ativa": true, "email": "joppoi@jhhu.com", "cidade": "koiopip", "estado": "OO", "endereco": "rua jdsfaio u, 123", "telefone": "(34) 65465-4566", "criado_em": "2026-01-23T08:36:19.726601", "clinica_id": 3, "atualizado_em": "2026-01-23T08:36:19.726601", "contratante_id": null}	\N	\N	Record created	2026-01-23 08:36:19.726601
44	\N	\N	INSERT	funcionarios	18	\N	{"id": 18, "cpf": "93358341062", "nome": "tewipi ewptipoip", "ativo": true, "email": "yiuyiuyadm@email.com", "setor": "kjkljlk", "turno": null, "escala": null, "funcao": "lkjlkjlkj", "perfil": "funcionario", "criado_em": "2026-01-23T08:37:01.136251", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$fVqyN7P6cYDpGpU2st9zFOuFOPJy0wvddO0ZUz5l.4v5brrjWkqSy", "nivel_cargo": "gestao", "atualizado_em": "2026-01-23T08:37:01.136251", "contratante_id": null, "data_nascimento": "0002-02-01", "data_ultimo_lote": null, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 08:37:01.136251
45	\N	\N	INSERT	lotes_avaliacao	4	\N	{"id": 4, "tipo": "completo", "codigo": "001-230126", "status": "ativo", "titulo": "Lote 1 - 001-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:17.939949", "descricao": "Lote 1 liberado para RLGERE. Inclui 1 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T08:53:17.939949", "liberado_por": null, "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:17.939949", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	\N	\N	Record created	2026-01-23 08:53:17.939949
46	\N	\N	INSERT	avaliacoes	1	\N	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "atualizado_em": "2026-01-23T08:53:17.971736", "funcionario_cpf": "70847446069"}	\N	\N	Record created	2026-01-23 08:53:17.971736
47	87545772920	\N	liberar_lote	lotes_avaliacao	4	\N	\N	::1	\N	{"contratante_id":9,"contratante_nome":"RLGERE","tipo":"completo","titulo":"Lote 1 - 001-230126","descricao":null,"data_filtro":null,"codigo":"001-230126","numero_ordem":1,"avaliacoes_criadas":1,"total_funcionarios":1}	2026-01-23 08:53:17.986081
48	\N	\N	INSERT	lotes_avaliacao	5	\N	{"id": 5, "tipo": "completo", "codigo": "002-230126", "status": "ativo", "titulo": "Lote 1 - 002-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:56.174836", "descricao": "Lote 1 liberado para Empresa teste. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 3, "empresa_id": 5, "liberado_em": "2026-01-23T08:53:56.174836", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:56.174836", "auto_emitir_em": null, "contratante_id": null, "auto_emitir_agendado": false}	\N	\N	Record created	2026-01-23 08:53:56.174836
50	04703084945	\N	liberar_lote	lotes_avaliacao	5	\N	\N	::ffff:127.0.0.1	\N	{"empresa_id":5,"empresa_nome":"Empresa teste","tipo":"completo","titulo":"Lote 1 - 002-230126","descricao":null,"data_filtro":null,"lote_referencia_id":null,"codigo":"002-230126","numero_ordem":1,"avaliacoes_criadas":1,"total_funcionarios":1,"resumo_inclusao":{"novos":1,"atrasados":0,"mais_de_1_ano":0,"regulares":0,"criticas":0,"altas":1}}	2026-01-23 08:53:56.191399
51	\N	\N	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "iniciada", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:56.181836", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:56.181836", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 18:59:11.635983
52	\N	\N	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:56.181836", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "iniciada", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:13:52.695884", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 19:13:52.695884
53	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:17.971736", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:17.971736", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 19:15:02.49215
54	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T08:53:17.971736", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:15:18.723328", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 19:15:18.723328
57	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:15:18.723328", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:15:18.723328", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 19:42:42.87852
58	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "em_andamento", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:15:18.723328", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:42:53.122266", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 19:42:53.122266
59	\N	\N	UPDATE	avaliacoes	1	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "iniciada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:42:53.122266", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 1, "envio": null, "inicio": "2026-01-23T11:53:17.97", "status": "inativada", "lote_id": 4, "criado_em": "2026-01-23T08:53:17.971736", "grupo_atual": 1, "inativada_em": "2026-01-23T19:43:04.910135-03:00", "atualizado_em": "2026-01-23T19:43:04.910135", "funcionario_cpf": "70847446069", "motivo_inativacao": "ddgdgsd gdsdgsgdssd"}	\N	\N	Record updated	2026-01-23 19:43:04.910135
60	87545772920	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	1	\N	\N	\N	\N	Inativação de avaliação. Funcionário: rondasklfoi jjiouo (70847446069). Lote: 001-230126. Motivo: ddgdgsd gdsdgsgdssd	2026-01-23 19:43:04.916653
71	\N	\N	INSERT	avaliacoes	3	\N	{"id": 3, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "iniciada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.210882", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.210882", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:17:24.210882
215	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_update_policy on table avaliacao_resets	2026-01-29 20:40:25.663731
61	\N	\N	UPDATE	lotes_avaliacao	4	{"id": 4, "tipo": "completo", "codigo": "001-230126", "status": "ativo", "titulo": "Lote 1 - 001-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:17.939949", "descricao": "Lote 1 liberado para RLGERE. Inclui 1 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T08:53:17.939949", "liberado_por": null, "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:17.939949", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	{"id": 4, "tipo": "completo", "codigo": "001-230126", "status": "cancelado", "titulo": "Lote 1 - 001-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:17.939949", "descricao": "Lote 1 liberado para RLGERE. Inclui 1 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T08:53:17.939949", "liberado_por": null, "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:17.939949", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	\N	\N	Record updated	2026-01-23 19:43:04.925659
62	\N	\N	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "iniciada", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:13:52.695884", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:13:52.695884", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 20:00:29.434921
63	\N	\N	UPDATE	avaliacoes	2	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "em_andamento", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T19:13:52.695884", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	{"id": 2, "envio": null, "inicio": "2026-01-23T11:53:56.18", "status": "inativada", "lote_id": 5, "criado_em": "2026-01-23T08:53:56.181836", "grupo_atual": 1, "inativada_em": "2026-01-23T20:12:43.905997-03:00", "atualizado_em": "2026-01-23T20:12:43.905997", "funcionario_cpf": "93358341062", "motivo_inativacao": "faffasfasfaasffs"}	\N	\N	Record updated	2026-01-23 20:12:43.905997
64	04703084945	rh	INATIVACAO_NORMAL	avaliacoes	2	\N	\N	\N	\N	Inativação de avaliação. Funcionário: tewipi ewptipoip (93358341062). Lote: 002-230126. Motivo: faffasfasfaasffs	2026-01-23 20:12:43.913307
65	\N	\N	UPDATE	lotes_avaliacao	5	{"id": 5, "tipo": "completo", "codigo": "002-230126", "status": "ativo", "titulo": "Lote 1 - 002-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:56.174836", "descricao": "Lote 1 liberado para Empresa teste. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 3, "empresa_id": 5, "liberado_em": "2026-01-23T08:53:56.174836", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:56.174836", "auto_emitir_em": null, "contratante_id": null, "auto_emitir_agendado": false}	{"id": 5, "tipo": "completo", "codigo": "002-230126", "status": "cancelado", "titulo": "Lote 1 - 002-230126", "hash_pdf": null, "criado_em": "2026-01-23T08:53:56.174836", "descricao": "Lote 1 liberado para Empresa teste. Inclui 1 funcionário(s) elegíveis.", "clinica_id": 3, "empresa_id": 5, "liberado_em": "2026-01-23T08:53:56.174836", "liberado_por": "04703084945", "numero_ordem": 1, "atualizado_em": "2026-01-23T08:53:56.174836", "auto_emitir_em": null, "contratante_id": null, "auto_emitir_agendado": false}	\N	\N	Record updated	2026-01-23 20:12:43.92247
66	\N	\N	INSERT	funcionarios	21	\N	{"id": 21, "cpf": "20340514086", "nome": "Jose do UP01", "ativo": true, "email": "jose.silva@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$9wX17JnD8vbSfdESbZY./uhdcthgdN.P86n8f.FvMRnuzkHaYcZ1S", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T20:14:07.471261", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 20:14:07.471261
67	\N	\N	INSERT	funcionarios	22	\N	{"id": 22, "cpf": "95762000087", "nome": "DIMore Itali", "ativo": true, "email": "mmmm.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$S/jyP62M0mFS/K9./rado.RV7BU7fL56vEfzz818hq.wBGzAKfdu6", "nivel_cargo": "gestao", "atualizado_em": "2026-01-23T20:14:07.471261", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 20:14:07.471261
68	\N	\N	INSERT	funcionarios	23	\N	{"id": 23, "cpf": "21706008090", "nome": "João da Cpuves", "ativo": true, "email": "joao.24@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:53.947429", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Oq7Y8XWqfysm10vFO2E8yu0eYuqD0Ofd0P/OYsPaaE/I/8dFByJWa", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T20:14:53.947429", "contratante_id": 9, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 20:14:53.947429
69	\N	\N	INSERT	funcionarios	24	\N	{"id": 24, "cpf": "80362755035", "nome": "Mariana Maria", "ativo": true, "email": "rolnkl@jijij.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:53.947429", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Q2UlP4/4uTQV0OsOKvHYNu9oqZOUikIl0mAGMDsNv1BdV9mls4U0O", "nivel_cargo": "gestao", "atualizado_em": "2026-01-23T20:14:53.947429", "contratante_id": 9, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-23 20:14:53.947429
70	\N	\N	INSERT	lotes_avaliacao	6	\N	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "ativo", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "empresa_id": 5, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-23T20:17:24.202634", "auto_emitir_em": null, "contratante_id": null, "auto_emitir_agendado": false}	\N	\N	Record created	2026-01-23 20:17:24.202634
72	\N	\N	INSERT	avaliacoes	4	\N	{"id": 4, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "iniciada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.215775", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.215775", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:17:24.215775
73	\N	\N	INSERT	avaliacoes	5	\N	{"id": 5, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "iniciada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.218603", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.218603", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:17:24.218603
74	04703084945	\N	liberar_lote	lotes_avaliacao	6	\N	\N	::1	\N	{"empresa_id":5,"empresa_nome":"Empresa teste","tipo":"completo","titulo":"Lote 2 - 003-230126","descricao":null,"data_filtro":null,"lote_referencia_id":null,"codigo":"003-230126","numero_ordem":2,"avaliacoes_criadas":3,"total_funcionarios":3,"resumo_inclusao":{"novos":3,"atrasados":0,"mais_de_1_ano":0,"regulares":0,"criticas":0,"altas":3}}	2026-01-23 20:17:24.221615
75	\N	\N	UPDATE	avaliacoes	3	{"id": 3, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "iniciada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.210882", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.210882", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	{"id": 3, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.210882", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.210882", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 20:17:56.052362
76	\N	\N	UPDATE	avaliacoes	3	{"id": 3, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "em_andamento", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.210882", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.210882", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	{"id": 3, "envio": "2026-01-23T20:18:09.023925", "inicio": "2026-01-23T23:17:24.206", "status": "concluida", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.210882", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.210882", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 20:18:09.023925
77	\N	\N	UPDATE	funcionarios	22	{"id": 22, "cpf": "95762000087", "nome": "DIMore Itali", "ativo": true, "email": "mmmm.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$S/jyP62M0mFS/K9./rado.RV7BU7fL56vEfzz818hq.wBGzAKfdu6", "nivel_cargo": "gestao", "atualizado_em": "2026-01-23T20:14:07.471261", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 22, "cpf": "95762000087", "nome": "DIMore Itali", "ativo": true, "email": "mmmm.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$S/jyP62M0mFS/K9./rado.RV7BU7fL56vEfzz818hq.wBGzAKfdu6", "nivel_cargo": "gestao", "atualizado_em": "2026-01-23T20:18:09.053275", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-01-23T20:17:24.202", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-23 20:18:09.053275
78	95762000087	funcionario	ATUALIZACAO_INDICE	funcionarios	95762000087	\N	\N	\N	\N	Índice atualizado de 0 para 2 após conclusão da avaliação 3	2026-01-23 20:18:09.057778
79	\N	\N	UPDATE	avaliacoes	4	{"id": 4, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "iniciada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.215775", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:17:24.215775", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	{"id": 4, "envio": null, "inicio": "2026-01-23T23:17:24.206", "status": "inativada", "lote_id": 6, "criado_em": "2026-01-23T20:17:24.215775", "grupo_atual": 1, "inativada_em": "2026-01-23T20:18:25.68015-03:00", "atualizado_em": "2026-01-23T20:18:25.68015", "funcionario_cpf": "20340514086", "motivo_inativacao": "gdsgsgsgsdsds"}	\N	\N	Record updated	2026-01-23 20:18:25.68015
80	04703084945	rh	INATIVACAO_NORMAL	avaliacoes	4	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Jose do UP01 (20340514086). Lote: 003-230126. Motivo: gdsgsgsgsdsds	2026-01-23 20:18:25.690865
81	\N	\N	INSERT	lotes_avaliacao	7	\N	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "ativo", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-23T20:18:55.452256", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	\N	\N	Record created	2026-01-23 20:18:55.452256
82	\N	\N	INSERT	avaliacoes	6	\N	{"id": 6, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.463936", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.463936", "funcionario_cpf": "21706008090", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:18:55.463936
83	\N	\N	INSERT	avaliacoes	7	\N	{"id": 7, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.467961", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.467961", "funcionario_cpf": "80362755035", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:18:55.467961
84	\N	\N	INSERT	avaliacoes	8	\N	{"id": 8, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.470417", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.470417", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	\N	\N	Record created	2026-01-23 20:18:55.470417
85	87545772920	\N	liberar_lote	lotes_avaliacao	7	\N	\N	::1	\N	{"contratante_id":9,"contratante_nome":"RLGERE","tipo":"completo","titulo":"Lote 2 - 004-230126","descricao":null,"data_filtro":null,"codigo":"004-230126","numero_ordem":2,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-01-23 20:18:55.473619
86	\N	\N	UPDATE	avaliacoes	6	{"id": 6, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.463936", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.463936", "funcionario_cpf": "21706008090", "motivo_inativacao": null}	{"id": 6, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "em_andamento", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.463936", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.463936", "funcionario_cpf": "21706008090", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 20:19:12.893524
87	\N	\N	UPDATE	avaliacoes	6	{"id": 6, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "em_andamento", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.463936", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.463936", "funcionario_cpf": "21706008090", "motivo_inativacao": null}	{"id": 6, "envio": "2026-01-23T20:19:25.112218", "inicio": "2026-01-23T23:18:55.462", "status": "concluida", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.463936", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.463936", "funcionario_cpf": "21706008090", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-23 20:19:25.112218
88	\N	\N	UPDATE	funcionarios	23	{"id": 23, "cpf": "21706008090", "nome": "João da Cpuves", "ativo": true, "email": "joao.24@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:53.947429", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Oq7Y8XWqfysm10vFO2E8yu0eYuqD0Ofd0P/OYsPaaE/I/8dFByJWa", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T20:14:53.947429", "contratante_id": 9, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 23, "cpf": "21706008090", "nome": "João da Cpuves", "ativo": true, "email": "joao.24@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:53.947429", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Oq7Y8XWqfysm10vFO2E8yu0eYuqD0Ofd0P/OYsPaaE/I/8dFByJWa", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T20:19:25.141337", "contratante_id": 9, "data_nascimento": "2010-12-12", "data_ultimo_lote": "2026-01-23T20:18:55.452", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-23 20:19:25.141337
89	21706008090	funcionario	ATUALIZACAO_INDICE	funcionarios	21706008090	\N	\N	\N	\N	Índice atualizado de 0 para 2 após conclusão da avaliação 6	2026-01-23 20:19:25.14442
90	00000000000	admin	INSERT	funcionarios	25	\N	{"id": 25, "cpf": "53051173991", "nome": "Sender Test", "ativo": true, "email": "ronado@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-01-24T08:09:09.005114", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$FDl0Gbyl6t60W6hagEm/WeBXBQMR8LVbXm8ksAl.qtz1W/dBupMLS", "nivel_cargo": null, "atualizado_em": "2026-01-24T08:09:09.005114", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-24 08:09:09.005114
91	00000000000	admin	INSERT	funcionarios	53051173991	\N	{"nome": "Sender Test", "email": "ronado@qwork.com", "perfil": "emissor", "clinica_id": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Criação de emissor independente via admin	2026-01-24 08:09:09.055393
92	\N	\N	UPDATE	avaliacoes	7	{"id": 7, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.467961", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.467961", "funcionario_cpf": "80362755035", "motivo_inativacao": null}	{"id": 7, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "inativada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.467961", "grupo_atual": 1, "inativada_em": "2026-01-24T08:10:33.397239-03:00", "atualizado_em": "2026-01-24T08:10:33.397239", "funcionario_cpf": "80362755035", "motivo_inativacao": "iopoiopipo"}	\N	\N	Record updated	2026-01-24 08:10:33.397239
93	87545772920	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	7	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Mariana Maria (80362755035). Lote: 004-230126. Motivo: iopoiopipo	2026-01-24 08:10:33.410597
94	\N	\N	UPDATE	avaliacoes	8	{"id": 8, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "iniciada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.470417", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-23T20:18:55.470417", "funcionario_cpf": "70847446069", "motivo_inativacao": null}	{"id": 8, "envio": null, "inicio": "2026-01-23T23:18:55.462", "status": "inativada", "lote_id": 7, "criado_em": "2026-01-23T20:18:55.470417", "grupo_atual": 1, "inativada_em": "2026-01-24T08:10:47.973264-03:00", "atualizado_em": "2026-01-24T08:10:47.973264", "funcionario_cpf": "70847446069", "motivo_inativacao": "iopiopipoi opiopiop opipoiopipoipo oipoiopipoipoiopiipo"}	\N	\N	Record updated	2026-01-24 08:10:47.973264
95	87545772920	gestor_entidade	INATIVACAO_FORCADA	avaliacoes	8	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: rondasklfoi jjiouo (70847446069). Lote: 004-230126. Motivo: iopiopipoi opiopiop opipoiopipoipo oipoiopipoipoiopiipo. Validação: ATENCAO: Este funcionario ja tem 1 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-01-24 08:10:47.980415
96	\N	\N	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "ativo", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-23T20:18:55.452256", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "empresa_id": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-23T20:18:55.452256", "auto_emitir_em": null, "contratante_id": 9, "auto_emitir_agendado": false}	\N	\N	Record updated	2026-01-24 08:10:47.99142
97	\N	\N	UPDATE	lotes_avaliacao	6	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "ativo", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-23T20:17:24.202634", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:39:09.892835
98	\N	\N	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-23T20:18:55.452256", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:39:09.892835
99	\N	\N	INSERT	laudos	1	\N	{"id": 1, "status": "enviado", "lote_id": 6, "hash_pdf": null, "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": "2026-01-24T08:39:38.00851", "enviado_em": "2026-01-24T08:39:38.00851", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:38.00851"}	\N	\N	Record created	2026-01-24 08:39:38.00851
100	\N	\N	UPDATE	laudos	1	{"id": 1, "status": "enviado", "lote_id": 6, "hash_pdf": null, "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": "2026-01-24T08:39:38.00851", "enviado_em": "2026-01-24T08:39:38.00851", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:38.00851"}	{"id": 1, "status": "enviado", "lote_id": 6, "hash_pdf": "2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d", "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": "2026-01-24T08:39:42.599931", "enviado_em": "2026-01-24T08:39:42.599931", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:42.599931"}	\N	\N	Record updated	2026-01-24 08:39:42.599931
101	\N	\N	UPDATE	lotes_avaliacao	6	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": "2026-01-24T08:39:42.605737-03:00", "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:39:42.605737
102	\N	\N	INSERT	laudos	2	\N	{"id": 2, "status": "enviado", "lote_id": 7, "hash_pdf": null, "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": "2026-01-24T08:39:42.636964", "enviado_em": "2026-01-24T08:39:42.636964", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:42.636964"}	\N	\N	Record created	2026-01-24 08:39:42.636964
103	\N	\N	UPDATE	laudos	2	{"id": 2, "status": "enviado", "lote_id": 7, "hash_pdf": null, "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": "2026-01-24T08:39:42.636964", "enviado_em": "2026-01-24T08:39:42.636964", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:42.636964"}	{"id": 2, "status": "enviado", "lote_id": 7, "hash_pdf": "b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c", "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": "2026-01-24T08:39:46.36985", "enviado_em": "2026-01-24T08:39:46.36985", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:46.36985"}	\N	\N	Record updated	2026-01-24 08:39:46.36985
119	\N	\N	UPDATE	avaliacoes	9	{"id": 9, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "iniciada", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.395868", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.395868", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	{"id": 9, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "em_andamento", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.395868", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.395868", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-24 09:26:36.690391
104	\N	\N	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-24T08:39:46.373305-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:39:46.373305
105	\N	\N	UPDATE	lotes_avaliacao	6	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": "2026-01-24T08:39:42.605737-03:00", "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:58:50.835091
106	\N	\N	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-24T08:39:46.373305-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:39:09.892835", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:58:50.835091
107	\N	\N	UPDATE	laudos	1	{"id": 1, "status": "enviado", "lote_id": 6, "hash_pdf": "2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d", "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": "2026-01-24T08:39:42.599931", "enviado_em": "2026-01-24T08:39:42.599931", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:42.599931"}	{"id": 1, "status": "rascunho", "lote_id": 6, "hash_pdf": null, "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:58:50.835091"}	\N	\N	Record updated	2026-01-24 08:58:50.835091
108	\N	\N	UPDATE	laudos	2	{"id": 2, "status": "enviado", "lote_id": 7, "hash_pdf": "b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c", "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": "2026-01-24T08:39:46.36985", "enviado_em": "2026-01-24T08:39:46.36985", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:39:46.36985"}	{"id": 2, "status": "rascunho", "lote_id": 7, "hash_pdf": null, "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:58:50.835091"}	\N	\N	Record updated	2026-01-24 08:58:50.835091
109	\N	\N	UPDATE	laudos	1	{"id": 1, "status": "rascunho", "lote_id": 6, "hash_pdf": null, "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:58:50.835091"}	{"id": 1, "status": "rascunho", "lote_id": 6, "hash_pdf": "2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d", "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:59:08.900448"}	\N	\N	Record updated	2026-01-24 08:59:08.900448
120	\N	\N	UPDATE	avaliacoes	9	{"id": 9, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "em_andamento", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.395868", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.395868", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	{"id": 9, "envio": "2026-01-24T09:26:48.330167", "inicio": "2026-01-24T12:25:56.395", "status": "concluida", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.395868", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.395868", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-24 09:26:48.330167
110	\N	\N	UPDATE	lotes_avaliacao	6	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 6, "tipo": "completo", "codigo": "003-230126", "status": "concluido", "titulo": "Lote 2 - 003-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:17:24.202634", "descricao": "Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": "2026-01-24T08:59:08.983151-03:00", "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-23T20:17:24.202634", "liberado_por": "04703084945", "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:59:08.983151
111	\N	\N	UPDATE	laudos	2	{"id": 2, "status": "rascunho", "lote_id": 7, "hash_pdf": null, "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:58:50.835091"}	{"id": 2, "status": "rascunho", "lote_id": 7, "hash_pdf": "b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c", "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:59:09.009548"}	\N	\N	Record updated	2026-01-24 08:59:09.009548
112	\N	\N	UPDATE	lotes_avaliacao	7	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 7, "tipo": "completo", "codigo": "004-230126", "status": "concluido", "titulo": "Lote 2 - 004-230126", "hash_pdf": null, "criado_em": "2026-01-23T20:18:55.452256", "descricao": "Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-24T08:59:09.022113-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-23T20:18:55.452256", "liberado_por": null, "numero_ordem": 2, "atualizado_em": "2026-01-24T08:58:50.835091", "auto_emitir_em": null, "contratante_id": 9, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 08:59:09.022113
113	\N	\N	UPDATE	laudos	1	{"id": 1, "status": "rascunho", "lote_id": 6, "hash_pdf": "2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d", "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:59:08.900448"}	{"id": 1, "status": "enviado", "lote_id": 6, "hash_pdf": "2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d", "criado_em": "2026-01-24T08:39:38.00851", "emitido_em": "2026-01-24T09:21:08.815165", "enviado_em": "2026-01-24T09:21:08.815165", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T09:21:08.815165"}	\N	\N	Record updated	2026-01-24 09:21:08.815165
114	\N	\N	UPDATE	laudos	2	{"id": 2, "status": "rascunho", "lote_id": 7, "hash_pdf": "b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c", "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": null, "enviado_em": null, "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T08:59:09.009548"}	{"id": 2, "status": "enviado", "lote_id": 7, "hash_pdf": "b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c", "criado_em": "2026-01-24T08:39:42.636964", "emitido_em": "2026-01-24T09:21:08.815165", "enviado_em": "2026-01-24T09:21:08.815165", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T09:21:08.815165"}	\N	\N	Record updated	2026-01-24 09:21:08.815165
115	\N	\N	INSERT	lotes_avaliacao	8	\N	{"id": 8, "tipo": "completo", "codigo": "001-240126", "status": "ativo", "titulo": "Lote 3 - 001-240126", "hash_pdf": null, "criado_em": "2026-01-24T09:25:56.383686", "descricao": "Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-24T09:25:56.383686", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-01-24T09:25:56.383686", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record created	2026-01-24 09:25:56.383686
116	\N	\N	INSERT	avaliacoes	9	\N	{"id": 9, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "iniciada", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.395868", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.395868", "funcionario_cpf": "20340514086", "motivo_inativacao": null}	\N	\N	Record created	2026-01-24 09:25:56.395868
117	\N	\N	INSERT	avaliacoes	10	\N	{"id": 10, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "iniciada", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.400081", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.400081", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record created	2026-01-24 09:25:56.400081
118	04703084945	\N	liberar_lote	lotes_avaliacao	8	\N	\N	::1	\N	{"empresa_id":5,"empresa_nome":"Empresa teste","tipo":"completo","titulo":"Lote 3 - 001-240126","descricao":null,"data_filtro":null,"lote_referencia_id":null,"codigo":"001-240126","numero_ordem":3,"avaliacoes_criadas":2,"total_funcionarios":2,"resumo_inclusao":{"novos":2,"atrasados":0,"mais_de_1_ano":0,"regulares":0,"criticas":0,"altas":2}}	2026-01-24 09:25:56.402019
187	\N	\N	DELETE	empresas_clientes	4	{"id": 4, "cep": null, "cnpj": "22222222000199", "nome": "Empresa da Entidade", "ativa": true, "email": "empresa@entidade.com", "cidade": "Sao Paulo", "estado": "SP", "endereco": null, "telefone": "(11) 2222-2222", "criado_em": "2026-01-22T22:37:39.363117", "clinica_id": null, "atualizado_em": "2026-01-22T22:37:39.363117", "contratante_id": 7, "representante_fone": null, "representante_nome": null, "representante_email": null}	\N	\N	\N	Record deleted	2026-01-25 20:02:45.077148
121	\N	\N	UPDATE	funcionarios	21	{"id": 21, "cpf": "20340514086", "nome": "Jose do UP01", "ativo": true, "email": "jose.silva@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$9wX17JnD8vbSfdESbZY./uhdcthgdN.P86n8f.FvMRnuzkHaYcZ1S", "nivel_cargo": "operacional", "atualizado_em": "2026-01-23T20:14:07.471261", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 21, "cpf": "20340514086", "nome": "Jose do UP01", "ativo": true, "email": "jose.silva@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-23T20:14:07.471261", "matricula": null, "clinica_id": 3, "empresa_id": 5, "senha_hash": "$2a$10$9wX17JnD8vbSfdESbZY./uhdcthgdN.P86n8f.FvMRnuzkHaYcZ1S", "nivel_cargo": "operacional", "atualizado_em": "2026-01-24T09:26:48.367169", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-01-24T09:25:56.383", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-24 09:26:48.367169
122	20340514086	funcionario	ATUALIZACAO_INDICE	funcionarios	20340514086	\N	\N	\N	\N	Índice atualizado de 0 para 3 após conclusão da avaliação 9	2026-01-24 09:26:48.371114
123	\N	\N	UPDATE	avaliacoes	10	{"id": 10, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "iniciada", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.400081", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-24T09:25:56.400081", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	{"id": 10, "envio": null, "inicio": "2026-01-24T12:25:56.395", "status": "inativada", "lote_id": 8, "criado_em": "2026-01-24T09:25:56.400081", "grupo_atual": 1, "inativada_em": "2026-01-24T09:27:14.964748-03:00", "atualizado_em": "2026-01-24T09:27:14.964748", "funcionario_cpf": "93358341062", "motivo_inativacao": "vbvbxvbbvbvbx hdfhfsfdsfhd hghhshdhgd hggjsgjssjgsjgsj"}	\N	\N	Record updated	2026-01-24 09:27:14.964748
124	04703084945	rh	INATIVACAO_FORCADA	avaliacoes	10	\N	\N	\N	\N	Inativação FORÇADA de avaliação consecutiva. Funcionário: tewipi ewptipoip (93358341062). Lote: 001-240126. Motivo: vbvbxvbbvbvbx hdfhfsfdsfhd hghhshdhgd hggjsgjssjgsjgsj. Validação: ATENCAO: Este funcionario ja tem 1 inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).	2026-01-24 09:27:14.975041
125	\N	\N	UPDATE	lotes_avaliacao	8	{"id": 8, "tipo": "completo", "codigo": "001-240126", "status": "ativo", "titulo": "Lote 3 - 001-240126", "hash_pdf": null, "criado_em": "2026-01-24T09:25:56.383686", "descricao": "Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-24T09:25:56.383686", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-01-24T09:25:56.383686", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 8, "tipo": "completo", "codigo": "001-240126", "status": "concluido", "titulo": "Lote 3 - 001-240126", "hash_pdf": null, "criado_em": "2026-01-24T09:25:56.383686", "descricao": "Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-24T09:25:56.383686", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-01-24T09:25:56.383686", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 09:27:14.983555
126	\N	\N	INSERT	laudos	3	\N	{"id": 3, "status": "enviado", "lote_id": 8, "hash_pdf": null, "criado_em": "2026-01-24T09:27:15.457038", "emitido_em": "2026-01-24T09:27:15.457038", "enviado_em": "2026-01-24T09:27:15.457038", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T09:27:15.457038"}	\N	\N	Record created	2026-01-24 09:27:15.457038
127	\N	\N	UPDATE	laudos	3	{"id": 3, "status": "enviado", "lote_id": 8, "hash_pdf": null, "criado_em": "2026-01-24T09:27:15.457038", "emitido_em": "2026-01-24T09:27:15.457038", "enviado_em": "2026-01-24T09:27:15.457038", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T09:27:15.457038"}	{"id": 3, "status": "enviado", "lote_id": 8, "hash_pdf": "ec81755ce1de29ee9a08fe6dbbbf783a1ad39ae5d6787ac9ff3d5307d83dadea", "criado_em": "2026-01-24T09:27:15.457038", "emitido_em": "2026-01-24T09:27:20.007791", "enviado_em": "2026-01-24T09:27:20.007791", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-24T09:27:20.007791"}	\N	\N	Record updated	2026-01-24 09:27:20.007791
128	\N	\N	UPDATE	lotes_avaliacao	8	{"id": 8, "tipo": "completo", "codigo": "001-240126", "status": "concluido", "titulo": "Lote 3 - 001-240126", "hash_pdf": null, "criado_em": "2026-01-24T09:25:56.383686", "descricao": "Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-24T09:25:56.383686", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-01-24T09:25:56.383686", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 8, "tipo": "completo", "codigo": "001-240126", "status": "concluido", "titulo": "Lote 3 - 001-240126", "hash_pdf": null, "criado_em": "2026-01-24T09:25:56.383686", "descricao": "Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": "2026-01-24T09:27:20.012461-03:00", "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-24T09:25:56.383686", "liberado_por": "04703084945", "numero_ordem": 3, "atualizado_em": "2026-01-24T09:25:56.383686", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-24 09:27:20.012461
129	00000000000	admin	UPDATE	contratacao_personalizada	11	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 1800, "numero_funcionarios": 120, "valor_por_funcionario": 15}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 15/func, Total: R$ 1800	2026-01-24 12:17:01.341943
130	\N	\N	INSERT	funcionarios	27	\N	{"id": 27, "cpf": "44055544049", "nome": "gfçlkaçl poiopipo", "ativo": true, "email": "jfpopiopi@joiuio.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T12:17:34.11565", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000106", "nivel_cargo": null, "atualizado_em": "2026-01-24T12:17:34.11565", "contratante_id": 11, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-24 12:17:34.11565
131	\N	\N	UPDATE	funcionarios	27	{"id": 27, "cpf": "44055544049", "nome": "gfçlkaçl poiopipo", "ativo": true, "email": "jfpopiopi@joiuio.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T12:17:34.11565", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000106", "nivel_cargo": null, "atualizado_em": "2026-01-24T12:17:34.11565", "contratante_id": 11, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 27, "cpf": "44055544049", "nome": "gfçlkaçl poiopipo", "ativo": true, "email": "jfpopiopi@joiuio.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T12:17:34.11565", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$UMYBvnepnz.IX3biekBI4.srI6O13yjkeXPLr9MuAV9pIyut/js4a", "nivel_cargo": null, "atualizado_em": "2026-01-24T12:18:49.880715", "contratante_id": 11, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-24 12:18:49.880715
132	00000000000	admin	UPDATE	contratacao_personalizada	12	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 500, "numero_funcionarios": 25, "valor_por_funcionario": 20}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 20/func, Total: R$ 500	2026-01-24 19:02:49.649703
133	\N	\N	INSERT	funcionarios	28	\N	{"id": 28, "cpf": "32282678060", "nome": "eipoop opipo i o", "ativo": true, "email": "opiopipo@kopoipo.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T19:03:15.390812", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000150", "nivel_cargo": null, "atualizado_em": "2026-01-24T19:03:15.390812", "contratante_id": 12, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-24 19:03:15.390812
134	\N	\N	UPDATE	funcionarios	28	{"id": 28, "cpf": "32282678060", "nome": "eipoop opipo i o", "ativo": true, "email": "opiopipo@kopoipo.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T19:03:15.390812", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000150", "nivel_cargo": null, "atualizado_em": "2026-01-24T19:03:15.390812", "contratante_id": 12, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 28, "cpf": "32282678060", "nome": "eipoop opipo i o", "ativo": true, "email": "opiopipo@kopoipo.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T19:03:15.390812", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$mvLt4YN33pdNkqxHUv2lAO8wnloY1v0/.mmJc9O7v1oaUlbIvwA4i", "nivel_cargo": null, "atualizado_em": "2026-01-24T19:03:58.592011", "contratante_id": 12, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-24 19:03:58.592011
135	\N	\N	INSERT	lotes_avaliacao	9	\N	{"id": 9, "tipo": "completo", "codigo": "001-250126", "status": "ativo", "titulo": "Lote 4 - 001-250126", "hash_pdf": null, "criado_em": "2026-01-25T07:55:22.365434", "descricao": "Lote 4 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 3, "emitido_em": null, "empresa_id": 5, "enviado_em": null, "liberado_em": "2026-01-25T07:55:22.365434", "liberado_por": "04703084945", "numero_ordem": 4, "atualizado_em": "2026-01-25T07:55:22.365434", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record created	2026-01-25 07:55:22.365434
136	\N	\N	INSERT	avaliacoes	11	\N	{"id": 11, "envio": null, "inicio": "2026-01-25T10:55:22.385", "status": "iniciada", "lote_id": 9, "criado_em": "2026-01-25T07:55:22.386792", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T07:55:22.386792", "funcionario_cpf": "93358341062", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 07:55:22.386792
137	\N	\N	INSERT	avaliacoes	12	\N	{"id": 12, "envio": null, "inicio": "2026-01-25T10:55:22.385", "status": "iniciada", "lote_id": 9, "criado_em": "2026-01-25T07:55:22.391291", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T07:55:22.391291", "funcionario_cpf": "95762000087", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 07:55:22.391291
138	04703084945	\N	liberar_lote	lotes_avaliacao	9	\N	\N	::ffff:127.0.0.1	\N	{"empresa_id":5,"empresa_nome":"Empresa teste","tipo":"completo","titulo":"Lote 4 - 001-250126","descricao":null,"data_filtro":null,"lote_referencia_id":null,"codigo":"001-250126","numero_ordem":4,"avaliacoes_criadas":2,"total_funcionarios":2,"resumo_inclusao":{"novos":1,"atrasados":1,"mais_de_1_ano":0,"regulares":0,"criticas":0,"altas":1}}	2026-01-25 07:55:22.396488
139	00000000000	admin	UPDATE	contratacao_personalizada	13	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 700, "numero_funcionarios": 20, "valor_por_funcionario": 35}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 35/func, Total: R$ 700	2026-01-25 09:57:29.626839
209	\N	\N	DELETE	avaliacoes	17	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "concluida", "lote_id": null, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	\N	\N	\N	Record deleted	2026-01-26 22:46:10.140251
140	\N	\N	INSERT	funcionarios	29	\N	{"id": 29, "cpf": "26409186053", "nome": "Ronaldo Fill", "ativo": true, "email": "rnado@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-25T09:57:55.43482", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000186", "nivel_cargo": null, "atualizado_em": "2026-01-25T09:57:55.43482", "contratante_id": 13, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 09:57:55.43482
141	\N	\N	UPDATE	funcionarios	29	{"id": 29, "cpf": "26409186053", "nome": "Ronaldo Fill", "ativo": true, "email": "rnado@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-25T09:57:55.43482", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000186", "nivel_cargo": null, "atualizado_em": "2026-01-25T09:57:55.43482", "contratante_id": 13, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 29, "cpf": "26409186053", "nome": "Ronaldo Fill", "ativo": true, "email": "rnado@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-25T09:57:55.43482", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$HrTCslyfZBKnkC5jNtln..g/boQIyW2/qxSWPp1m/6Buxvq49bm.S", "nivel_cargo": null, "atualizado_em": "2026-01-25T09:59:19.838449", "contratante_id": 13, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 09:59:19.838449
142	00000000000	admin	UPDATE	contratacao_personalizada	14	{"status": "aguardando_valor_admin"}	{"status": "valor_definido", "valor_total": 6250, "numero_funcionarios": 125, "valor_por_funcionario": 50}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	Valores definidos para personalizado: R$ 50/func, Total: R$ 6250	2026-01-25 10:02:15.860535
143	\N	\N	INSERT	funcionarios	30	\N	{"id": 30, "cpf": "95076358075", "nome": "Tania Folaioip", "ativo": true, "email": "taniak@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-25T10:02:44.952522", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000100", "nivel_cargo": null, "atualizado_em": "2026-01-25T10:02:44.952522", "contratante_id": 14, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 10:02:44.952522
144	\N	\N	UPDATE	funcionarios	30	{"id": 30, "cpf": "95076358075", "nome": "Tania Folaioip", "ativo": true, "email": "taniak@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-25T10:02:44.952522", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "000100", "nivel_cargo": null, "atualizado_em": "2026-01-25T10:02:44.952522", "contratante_id": 14, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "95076358075", "nome": "Tania Folaioip", "ativo": true, "email": "taniak@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-25T10:02:44.952522", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$VOx7LVuaPkwF7HHDqk7fKOoKc1mBF46aIGHzHl1ueyXnlYMNBvjPC", "nivel_cargo": null, "atualizado_em": "2026-01-25T10:04:05.769574", "contratante_id": 14, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 10:04:05.769574
145	\N	\N	UPDATE	funcionarios	30	{"id": 30, "cpf": "95076358075", "nome": "Tania Folaioip", "ativo": true, "email": "taniak@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-25T10:02:44.952522", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$VOx7LVuaPkwF7HHDqk7fKOoKc1mBF46aIGHzHl1ueyXnlYMNBvjPC", "nivel_cargo": null, "atualizado_em": "2026-01-25T10:04:05.769574", "contratante_id": 14, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 30, "cpf": "95076358075", "nome": "Tania Folaioip", "ativo": true, "email": "taniak@qwork.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-25T10:02:44.952522", "matricula": null, "clinica_id": 4, "empresa_id": null, "senha_hash": "$2a$10$VOx7LVuaPkwF7HHDqk7fKOoKc1mBF46aIGHzHl1ueyXnlYMNBvjPC", "nivel_cargo": null, "atualizado_em": "2026-01-25T10:04:05.769574", "contratante_id": 14, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 11:35:23.665095
146	95076358075	rh	INSERT	empresas_clientes	6	\N	{"id": 6, "cep": "8456123", "cnpj": "95173239000170", "nome": "Empresa Clinca Fonalq", "ativa": true, "email": "ijouoiu@hihiuhiu.com", "cidade": "uoiuou", "estado": "UU", "endereco": "rua jlkjlkjlk 23432", "telefone": "(46) 46546-6133", "criado_em": "2026-01-25T11:40:10.297209", "clinica_id": 4, "atualizado_em": "2026-01-25T11:40:10.297209", "contratante_id": null}	\N	\N	Record created	2026-01-25 11:40:10.297209
147	\N	\N	INSERT	funcionarios	31	\N	{"id": 31, "cpf": "16841540069", "nome": "Jose do UP01", "ativo": true, "email": "jose.silfsva@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-25T13:50:30.258047", "matricula": null, "clinica_id": 4, "empresa_id": 6, "senha_hash": "$2a$10$u22imbtF1SJK6sBqU5xSLe.6z8le6uvvPwLQfY7BpiE4vDXBQT522", "nivel_cargo": "operacional", "atualizado_em": "2026-01-25T13:50:30.258047", "contratante_id": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 13:50:30.258047
148	\N	\N	INSERT	funcionarios	32	\N	{"id": 32, "cpf": "99388588053", "nome": "DIMore Itali", "ativo": true, "email": "m8099.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:50:30.258047", "matricula": null, "clinica_id": 4, "empresa_id": 6, "senha_hash": "$2a$10$BxINqJjzdb97GKahhnkw.uhm4rWIRi4M3pV01qdiiT7yw.sWoA9XO", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:50:30.258047", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 13:50:30.258047
149	\N	\N	INSERT	lotes_avaliacao	10	\N	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "ativo", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": null, "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record created	2026-01-25 13:50:38.657179
150	\N	\N	INSERT	avaliacoes	13	\N	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.665009", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 13:50:38.665009
151	\N	\N	INSERT	avaliacoes	14	\N	{"id": 14, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.669974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.669974", "funcionario_cpf": "16841540069", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 13:50:38.669974
152	95076358075	\N	liberar_lote	lotes_avaliacao	10	\N	\N	::1	\N	{"empresa_id":6,"empresa_nome":"Empresa Clinca Fonalq","tipo":"completo","titulo":"Lote 1 - 002-250126","descricao":null,"data_filtro":null,"lote_referencia_id":null,"codigo":"002-250126","numero_ordem":1,"avaliacoes_criadas":2,"total_funcionarios":2,"resumo_inclusao":{"novos":2,"atrasados":0,"mais_de_1_ano":0,"regulares":0,"criticas":0,"altas":2}}	2026-01-25 13:50:38.672741
153	\N	\N	UPDATE	avaliacoes	13	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.665009", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "em_andamento", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.665009", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:51:12.429287
154	\N	\N	UPDATE	avaliacoes	13	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "em_andamento", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.665009", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:51:31.440548", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:51:31.440548
155	\N	\N	UPDATE	avaliacoes	13	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:51:31.440548", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "em_andamento", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:51:31.440548", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:51:38.206482
156	\N	\N	UPDATE	avaliacoes	13	{"id": 13, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "em_andamento", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:51:31.440548", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	{"id": 13, "envio": "2026-01-25T13:51:53.920671", "inicio": "2026-01-25T16:50:38.664", "status": "concluida", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.665009", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:51:31.440548", "funcionario_cpf": "99388588053", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:51:53.920671
157	\N	\N	UPDATE	funcionarios	32	{"id": 32, "cpf": "99388588053", "nome": "DIMore Itali", "ativo": true, "email": "m8099.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:50:30.258047", "matricula": null, "clinica_id": 4, "empresa_id": 6, "senha_hash": "$2a$10$BxINqJjzdb97GKahhnkw.uhm4rWIRi4M3pV01qdiiT7yw.sWoA9XO", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:50:30.258047", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 32, "cpf": "99388588053", "nome": "DIMore Itali", "ativo": true, "email": "m8099.santos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:50:30.258047", "matricula": null, "clinica_id": 4, "empresa_id": 6, "senha_hash": "$2a$10$BxINqJjzdb97GKahhnkw.uhm4rWIRi4M3pV01qdiiT7yw.sWoA9XO", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:51:53.955165", "contratante_id": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-01-25T13:50:38.657", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 13:51:53.955165
158	99388588053	funcionario	ATUALIZACAO_INDICE	funcionarios	99388588053	\N	\N	\N	\N	Índice atualizado de 0 para 1 após conclusão da avaliação 13	2026-01-25 13:51:53.95959
159	\N	\N	UPDATE	avaliacoes	14	{"id": 14, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "iniciada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.669974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:50:38.669974", "funcionario_cpf": "16841540069", "motivo_inativacao": null}	{"id": 14, "envio": null, "inicio": "2026-01-25T16:50:38.664", "status": "inativada", "lote_id": 10, "criado_em": "2026-01-25T13:50:38.669974", "grupo_atual": 1, "inativada_em": "2026-01-25T13:53:21.391354-03:00", "atualizado_em": "2026-01-25T13:53:21.391354", "funcionario_cpf": "16841540069", "motivo_inativacao": "dafadfas sasfaffas"}	\N	\N	Record updated	2026-01-25 13:53:21.391354
160	95076358075	rh	INATIVACAO_NORMAL	avaliacoes	14	\N	\N	\N	\N	Inativação de avaliação. Funcionário: Jose do UP01 (16841540069). Lote: 002-250126. Motivo: dafadfas sasfaffas	2026-01-25 13:53:21.402447
161	\N	\N	UPDATE	lotes_avaliacao	10	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "ativo", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": null, "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "concluido", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": null, "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:53:21.412327
162	\N	\N	UPDATE	lotes_avaliacao	10	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "concluido", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": null, "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "concluido", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": "2026-01-25T13:53:27.852968-03:00", "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:53:27.852968
163	\N	\N	INSERT	laudos	4	\N	{"id": 4, "status": "enviado", "lote_id": 10, "hash_pdf": "5a98d2c71d37f4c75cab3075b204d923909e98035d28985393ac0624fabe7a51", "criado_em": "2026-01-25T13:53:27.856798", "emitido_em": "2026-01-25T13:53:27.856798", "enviado_em": "2026-01-25T13:53:27.856798", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:53:27.856798"}	\N	\N	Record created	2026-01-25 13:53:27.856798
164	\N	\N	UPDATE	laudos	4	{"id": 4, "status": "enviado", "lote_id": 10, "hash_pdf": "5a98d2c71d37f4c75cab3075b204d923909e98035d28985393ac0624fabe7a51", "criado_em": "2026-01-25T13:53:27.856798", "emitido_em": "2026-01-25T13:53:27.856798", "enviado_em": "2026-01-25T13:53:27.856798", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:53:27.856798"}	{"id": 4, "status": "enviado", "lote_id": 10, "hash_pdf": "5a98d2c71d37f4c75cab3075b204d923909e98035d28985393ac0624fabe7a51", "criado_em": "2026-01-25T13:53:27.856798", "emitido_em": "2026-01-25T13:53:27.856798", "enviado_em": "2026-01-25T13:53:27.856798", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:53:27.865799"}	\N	\N	Record updated	2026-01-25 13:53:27.865799
165	\N	\N	UPDATE	lotes_avaliacao	10	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "concluido", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": "2026-01-25T13:53:27.852968-03:00", "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 10, "tipo": "completo", "codigo": "002-250126", "status": "concluido", "titulo": "Lote 1 - 002-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:50:38.657179", "descricao": "Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.", "clinica_id": 4, "emitido_em": "2026-01-25T13:53:27.878525-03:00", "empresa_id": 6, "enviado_em": null, "liberado_em": "2026-01-25T13:50:38.657179", "liberado_por": "95076358075", "numero_ordem": 1, "atualizado_em": "2026-01-25T13:50:38.657179", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:53:27.878525
166	\N	\N	INSERT	funcionarios	33	\N	{"id": 33, "cpf": "99404235008", "nome": "jose do papo", "ativo": true, "email": "ilf809sva@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-01-25T13:56:19.188875", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$kPmNYT8ZS8dEL4H9IghYI.DhzQS/oW0yca6FujxhAjVCt/kJZr4zW", "nivel_cargo": "operacional", "atualizado_em": "2026-01-25T13:56:19.188875", "contratante_id": 13, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 13:56:19.188875
167	\N	\N	INSERT	funcionarios	34	\N	{"id": 34, "cpf": "07752435074", "nome": "DIMore Beli", "ativo": true, "email": "m8099.s5443antos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:56:19.188875", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Hd6MXPmCiPaQgKCXGTodbe8aPDJ.GMd.ygn.0kTnyxL4W7wq4tagC", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:56:19.188875", "contratante_id": 13, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-25 13:56:19.188875
168	\N	\N	INSERT	lotes_avaliacao	11	\N	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "ativo", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record created	2026-01-25 13:57:37.300908
169	\N	\N	INSERT	avaliacoes	15	\N	{"id": 15, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "iniciada", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.30911", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.30911", "funcionario_cpf": "07752435074", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 13:57:37.30911
170	\N	\N	INSERT	avaliacoes	16	\N	{"id": 16, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "iniciada", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.31418", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.31418", "funcionario_cpf": "99404235008", "motivo_inativacao": null}	\N	\N	Record created	2026-01-25 13:57:37.31418
171	26409186053	\N	liberar_lote	lotes_avaliacao	11	\N	\N	::1	\N	{"contratante_id":13,"contratante_nome":"Entidade Final","tipo":"completo","titulo":"Lote 3 - 003-250126","descricao":null,"data_filtro":null,"codigo":"003-250126","numero_ordem":3,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-01-25 13:57:37.31652
172	\N	\N	UPDATE	avaliacoes	16	{"id": 16, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "iniciada", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.31418", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.31418", "funcionario_cpf": "99404235008", "motivo_inativacao": null}	{"id": 16, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "inativada", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.31418", "grupo_atual": 1, "inativada_em": "2026-01-25T13:58:59.78599-03:00", "atualizado_em": "2026-01-25T13:58:59.78599", "funcionario_cpf": "99404235008", "motivo_inativacao": "ewtewt tewetwtewtew"}	\N	\N	Record updated	2026-01-25 13:58:59.78599
173	26409186053	gestor_entidade	INATIVACAO_NORMAL	avaliacoes	16	\N	\N	\N	\N	Inativação de avaliação. Funcionário: jose do papo (99404235008). Lote: 003-250126. Motivo: ewtewt tewetwtewtew	2026-01-25 13:58:59.797402
174	\N	\N	UPDATE	avaliacoes	15	{"id": 15, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "iniciada", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.30911", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.30911", "funcionario_cpf": "07752435074", "motivo_inativacao": null}	{"id": 15, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.30911", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.30911", "funcionario_cpf": "07752435074", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:59:20.731338
175	\N	\N	UPDATE	avaliacoes	15	{"id": 15, "envio": null, "inicio": "2026-01-25T16:57:37.308", "status": "em_andamento", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.30911", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.30911", "funcionario_cpf": "07752435074", "motivo_inativacao": null}	{"id": 15, "envio": "2026-01-25T13:59:32.311404", "inicio": "2026-01-25T16:57:37.308", "status": "concluida", "lote_id": 11, "criado_em": "2026-01-25T13:57:37.30911", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-25T13:57:37.30911", "funcionario_cpf": "07752435074", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-25 13:59:32.311404
176	\N	\N	UPDATE	funcionarios	34	{"id": 34, "cpf": "07752435074", "nome": "DIMore Beli", "ativo": true, "email": "m8099.s5443antos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:56:19.188875", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Hd6MXPmCiPaQgKCXGTodbe8aPDJ.GMd.ygn.0kTnyxL4W7wq4tagC", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:56:19.188875", "contratante_id": 13, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 34, "cpf": "07752435074", "nome": "DIMore Beli", "ativo": true, "email": "m8099.s5443antos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-01-25T13:56:19.188875", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$Hd6MXPmCiPaQgKCXGTodbe8aPDJ.GMd.ygn.0kTnyxL4W7wq4tagC", "nivel_cargo": "gestao", "atualizado_em": "2026-01-25T13:59:32.347532", "contratante_id": 13, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-01-25T13:57:37.3", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 13:59:32.347532
177	07752435074	funcionario	ATUALIZACAO_INDICE	funcionarios	07752435074	\N	\N	\N	\N	Índice atualizado de 0 para 3 após conclusão da avaliação 15	2026-01-25 13:59:32.350887
185	\N	\N	DELETE	funcionarios	28	{"id": 28, "cpf": "32282678060", "nome": "eipoop opipo i o", "ativo": true, "email": "opiopipo@kopoipo.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T19:03:15.390812", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$mvLt4YN33pdNkqxHUv2lAO8wnloY1v0/.mmJc9O7v1oaUlbIvwA4i", "nivel_cargo": null, "atualizado_em": "2026-01-24T19:03:58.592011", "contratante_id": 12, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-25 20:02:30.682772
178	\N	\N	UPDATE	lotes_avaliacao	11	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "ativo", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "concluido", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:59:32.358735
179	\N	\N	UPDATE	lotes_avaliacao	11	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "concluido", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": null, "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "concluido", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-25T13:59:36.21146-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:59:36.21146
180	\N	\N	INSERT	laudos	5	\N	{"id": 5, "status": "enviado", "lote_id": 11, "hash_pdf": "d5d1337cc3b1e3bbe23f3cad1d614abcc0845e1b59bf63dea287bbc5a7256c02", "criado_em": "2026-01-25T13:59:36.220728", "emitido_em": "2026-01-25T13:59:36.220728", "enviado_em": "2026-01-25T13:59:36.220728", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:59:36.220728"}	\N	\N	Record created	2026-01-25 13:59:36.220728
181	\N	\N	UPDATE	laudos	5	{"id": 5, "status": "enviado", "lote_id": 11, "hash_pdf": "d5d1337cc3b1e3bbe23f3cad1d614abcc0845e1b59bf63dea287bbc5a7256c02", "criado_em": "2026-01-25T13:59:36.220728", "emitido_em": "2026-01-25T13:59:36.220728", "enviado_em": "2026-01-25T13:59:36.220728", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:59:36.220728"}	{"id": 5, "status": "enviado", "lote_id": 11, "hash_pdf": "d5d1337cc3b1e3bbe23f3cad1d614abcc0845e1b59bf63dea287bbc5a7256c02", "criado_em": "2026-01-25T13:59:36.220728", "emitido_em": "2026-01-25T13:59:36.220728", "enviado_em": "2026-01-25T13:59:36.220728", "emissor_cpf": "53051173991", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-25T13:59:36.228046"}	\N	\N	Record updated	2026-01-25 13:59:36.228046
182	\N	\N	UPDATE	lotes_avaliacao	11	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "concluido", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-25T13:59:36.21146-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 11, "tipo": "completo", "codigo": "003-250126", "status": "concluido", "titulo": "Lote 3 - 003-250126", "hash_pdf": null, "criado_em": "2026-01-25T13:57:37.300908", "descricao": "Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.", "clinica_id": null, "emitido_em": "2026-01-25T13:59:36.241706-03:00", "empresa_id": null, "enviado_em": null, "liberado_em": "2026-01-25T13:57:37.300908", "liberado_por": "26409186053", "numero_ordem": 3, "atualizado_em": "2026-01-25T13:57:37.300908", "auto_emitir_em": null, "contratante_id": 13, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-25 13:59:36.241706
184	\N	\N	DELETE	funcionarios	27	{"id": 27, "cpf": "44055544049", "nome": "gfçlkaçl poiopipo", "ativo": true, "email": "jfpopiopi@joiuio.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "gestor_entidade", "criado_em": "2026-01-24T12:17:34.11565", "matricula": null, "clinica_id": null, "empresa_id": null, "senha_hash": "$2a$10$UMYBvnepnz.IX3biekBI4.srI6O13yjkeXPLr9MuAV9pIyut/js4a", "nivel_cargo": null, "atualizado_em": "2026-01-24T12:18:49.880715", "contratante_id": 11, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-25 20:01:46.134673
186	\N	\N	DELETE	empresas_clientes	3	{"id": 3, "cep": null, "cnpj": "22222222000199", "nome": "Empresa da Entidade", "ativa": true, "email": "empresa@entidade.com", "cidade": "Sao Paulo", "estado": "SP", "endereco": null, "telefone": "(11) 2222-2222", "criado_em": "2026-01-22T22:36:51.040159", "clinica_id": null, "atualizado_em": "2026-01-22T22:36:51.040159", "contratante_id": 7, "representante_fone": null, "representante_nome": null, "representante_email": null}	\N	\N	\N	Record deleted	2026-01-25 20:02:45.077148
188	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "\\\\\\\\\\\\", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$yqVeVC3oy.N0osVBqgor8OrwiZyugkAujYRbavzh2TBbec.yZ6ZYa", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:36:35.719556
189	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$yqVeVC3oy.N0osVBqgor8OrwiZyugkAujYRbavzh2TBbec.yZ6ZYa", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$P5.ZbR9spcJ851fOVObfP.uQo4h6uv0Mf.U5Y8gf7crCeeCwJbtja", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:37:09.662415
190	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$P5.ZbR9spcJ851fOVObfP.uQo4h6uv0Mf.U5Y8gf7crCeeCwJbtja", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$q6pkXII6mYfEN0pymh1JZuvux.zCAdXj7O8x5TVQ1EXT/v1uLhBoW", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:37:27.522608
191	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$q6pkXII6mYfEN0pymh1JZuvux.zCAdXj7O8x5TVQ1EXT/v1uLhBoW", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$CgUNLyzw5QCHMYzENI8LAOritEY/uhUV.u4ik7RjYJGMWpTqiWCWO", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:37:47.309875
192	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$CgUNLyzw5QCHMYzENI8LAOritEY/uhUV.u4ik7RjYJGMWpTqiWCWO", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$4tjv/12sOnm0dZ2Pg7ueMONk6bnKOgNP.RDhCPMWPwesR2AjI4rPm", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:38:09.424028
210	\N	\N	DELETE	empresas_clientes	7	{"id": 7, "cep": null, "cnpj": "44444444362712", "nome": "Empresa B2", "ativa": true, "email": null, "cidade": null, "estado": null, "endereco": null, "telefone": null, "criado_em": "2026-01-26T22:46:02.891207", "clinica_id": 5, "atualizado_em": "2026-01-26T22:46:02.891207", "contratante_id": null, "representante_fone": null, "representante_nome": null, "representante_email": null}	\N	\N	\N	Record deleted	2026-01-26 22:46:10.170657
193	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$4tjv/12sOnm0dZ2Pg7ueMONk6bnKOgNP.RDhCPMWPwesR2AjI4rPm", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$lpej8uOHlHCPyGAdCfuMF.KNBhYc/BR.nRJLr8kpQRPhgwezfw4vG", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:38:29.3729
194	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$lpej8uOHlHCPyGAdCfuMF.KNBhYc/BR.nRJLr8kpQRPhgwezfw4vG", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$FmM/uijYejhMbQqX8XBXVupFf0Tq7jvvvzTZ2YuxnGj1CzkUQXGrC", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:39:08.681337
195	\N	\N	UPDATE	funcionarios	16	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$FmM/uijYejhMbQqX8XBXVupFf0Tq7jvvvzTZ2YuxnGj1CzkUQXGrC", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 16, "cpf": "04703084945", "nome": "Tani K", "ativo": true, "email": "dsoijoi@hihi.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "rh", "criado_em": "2026-01-23T08:32:13.316807", "matricula": null, "clinica_id": 3, "empresa_id": null, "senha_hash": "$2a$10$stS1tYsEyQx8LOtHjI6wZO1w/deDpAXtbn8tVV0lz/qmy8Zq.TgHC", "nivel_cargo": null, "atualizado_em": "2026-01-23T08:32:13.316807", "contratante_id": 10, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-01-25 23:39:29.966626
196	\N	\N	INSERT	empresas_clientes	7	\N	{"id": 7, "cep": null, "cnpj": "44444444362712", "nome": "Empresa B2", "ativa": true, "email": null, "cidade": null, "estado": null, "endereco": null, "telefone": null, "criado_em": "2026-01-26T22:46:02.891207", "clinica_id": 5, "atualizado_em": "2026-01-26T22:46:02.891207", "contratante_id": null, "representante_fone": null, "representante_nome": null, "representante_email": null}	\N	\N	Record created	2026-01-26 22:46:02.891207
197	\N	\N	INSERT	funcionarios	35	\N	{"id": 35, "cpf": "99362712590", "nome": "Emissor B2", "ativo": true, "email": "emissor@b2.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-01-26T22:46:02.9677", "matricula": null, "clinica_id": 5, "empresa_id": null, "senha_hash": "hash", "nivel_cargo": null, "atualizado_em": "2026-01-26T22:46:02.9677", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-01-26 22:46:02.9677
198	\N	\N	INSERT	lotes_avaliacao	12	\N	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "rascunho", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": null, "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record created	2026-01-26 22:46:02.990952
199	\N	\N	INSERT	avaliacoes	17	\N	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "iniciada", "lote_id": 12, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	\N	\N	Record created	2026-01-26 22:46:03.023974
200	\N	\N	UPDATE	avaliacoes	17	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "iniciada", "lote_id": 12, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "concluida", "lote_id": 12, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-26 22:46:03.023974
212	00000000000	system	POLICY_UNEXPECTED	roles	\N	\N	\N	\N	\N	Unexpected policy: roles_admin_select on table roles	2026-01-29 20:40:25.663731
213	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_delete_policy on table avaliacao_resets	2026-01-29 20:40:25.663731
214	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_insert_policy on table avaliacao_resets	2026-01-29 20:40:25.663731
201	\N	\N	UPDATE	lotes_avaliacao	12	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "rascunho", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": null, "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "concluido", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": null, "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-26 22:46:03.023974
202	\N	\N	UPDATE	lotes_avaliacao	12	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "concluido", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": null, "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "concluido", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": "2026-01-26T22:46:10.079143-03:00", "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	Record updated	2026-01-26 22:46:10.079143
203	\N	\N	INSERT	laudos	6	\N	{"id": 6, "status": "enviado", "lote_id": 12, "hash_pdf": "68a9db4a3db144e12695fcc258e09b60fada4c4dd68d02e3978d235e35a4e3d1", "criado_em": "2026-01-26T22:46:10.083323", "emitido_em": "2026-01-26T22:46:10.083323", "enviado_em": "2026-01-26T22:46:10.083323", "emissor_cpf": "99362712590", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-26T22:46:10.083323", "arquivo_remoto_key": "laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_bucket": "laudos-qwork", "arquivo_remoto_provider": "backblaze"}	\N	\N	Record created	2026-01-26 22:46:10.083323
204	\N	\N	UPDATE	laudos	6	{"id": 6, "status": "enviado", "lote_id": 12, "hash_pdf": "68a9db4a3db144e12695fcc258e09b60fada4c4dd68d02e3978d235e35a4e3d1", "criado_em": "2026-01-26T22:46:10.083323", "emitido_em": "2026-01-26T22:46:10.083323", "enviado_em": "2026-01-26T22:46:10.083323", "emissor_cpf": "99362712590", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-26T22:46:10.083323", "arquivo_remoto_key": "laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_bucket": "laudos-qwork", "arquivo_remoto_provider": "backblaze"}	{"id": 6, "status": "enviado", "lote_id": 12, "hash_pdf": "68a9db4a3db144e12695fcc258e09b60fada4c4dd68d02e3978d235e35a4e3d1", "criado_em": "2026-01-26T22:46:10.083323", "emitido_em": "2026-01-26T22:46:10.083323", "enviado_em": "2026-01-26T22:46:10.083323", "emissor_cpf": "99362712590", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-26T22:46:10.09524", "arquivo_remoto_key": "laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_bucket": "laudos-qwork", "arquivo_remoto_provider": "backblaze"}	\N	\N	Record updated	2026-01-26 22:46:10.09524
205	\N	\N	DELETE	lotes_avaliacao	12	{"id": 12, "tipo": "completo", "codigo": "B2-362712-362", "status": "concluido", "titulo": "Lote B2", "hash_pdf": null, "criado_em": "2026-01-26T22:46:02.990952", "descricao": null, "clinica_id": 5, "emitido_em": "2026-01-26T22:46:10.079143-03:00", "empresa_id": 7, "enviado_em": null, "liberado_em": "2026-01-26T22:46:02.990952", "liberado_por": "99362712590", "numero_ordem": 1, "atualizado_em": "2026-01-26T22:46:02.990952", "auto_emitir_em": null, "contratante_id": null, "modo_emergencia": false, "motivo_emergencia": null, "motivo_cancelamento": null, "auto_emitir_agendado": false, "cancelado_automaticamente": false}	\N	\N	\N	Record deleted	2026-01-26 22:46:10.114447
206	\N	\N	UPDATE	avaliacoes	17	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "concluida", "lote_id": 12, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	{"id": 17, "envio": null, "inicio": "2026-01-26T22:46:03.023974", "status": "concluida", "lote_id": null, "criado_em": "2026-01-26T22:46:03.023974", "grupo_atual": 1, "inativada_em": null, "atualizado_em": "2026-01-26T22:46:03.023974", "funcionario_cpf": "99362712590", "motivo_inativacao": null}	\N	\N	Record updated	2026-01-26 22:46:10.114447
207	\N	\N	DELETE	laudos	6	{"id": 6, "status": "enviado", "lote_id": 12, "hash_pdf": "68a9db4a3db144e12695fcc258e09b60fada4c4dd68d02e3978d235e35a4e3d1", "criado_em": "2026-01-26T22:46:10.083323", "emitido_em": "2026-01-26T22:46:10.083323", "enviado_em": "2026-01-26T22:46:10.083323", "emissor_cpf": "99362712590", "observacoes": "Laudo gerado automaticamente pelo sistema", "atualizado_em": "2026-01-26T22:46:10.09524", "arquivo_remoto_key": "laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-12/laudo-1769478368663-1suv2k.pdf", "arquivo_remoto_bucket": "laudos-qwork", "arquivo_remoto_provider": "backblaze"}	\N	\N	\N	Record deleted	2026-01-26 22:46:10.114447
208	\N	\N	DELETE	funcionarios	35	{"id": 35, "cpf": "99362712590", "nome": "Emissor B2", "ativo": true, "email": "emissor@b2.com", "setor": null, "turno": null, "escala": null, "funcao": null, "perfil": "emissor", "criado_em": "2026-01-26T22:46:02.9677", "matricula": null, "clinica_id": 5, "empresa_id": null, "senha_hash": "hash", "nivel_cargo": null, "atualizado_em": "2026-01-26T22:46:02.9677", "contratante_id": null, "data_nascimento": null, "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	\N	Record deleted	2026-01-26 22:46:10.140251
211	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_select_policy on table avaliacao_resets	2026-01-29 20:40:25.663731
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, entidade_tipo, entidade_id, acao, status_anterior, status_novo, usuario_cpf, usuario_perfil, ip_address, user_agent, dados_alterados, metadados, hash_operacao, criado_em) FROM stdin;
1	login	1	login_falha	\N	\N	00000000000	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	d9180571ad40b59d169ce1729fd7977bde4976d3606c7f7471ea69771d5873e8	2026-01-22 22:07:28.430683
2	login	1	login_falha	\N	\N	00000000000	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	8ab906e2b0669aa7d37a0f6e7fea657344b45d0d461714bc5bf800f756a7dc70	2026-01-22 22:07:37.270819
3	login	1	login_falha	\N	\N	00000000000	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	400cfe5cc52a7441987550abd4b79f6ebf0c478b499aa5d386d50cfd567f0a7b	2026-01-22 22:07:56.687245
4	login	1	login_falha	\N	\N	00000000000	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	352f2a5b3ba7a34c605dcde4e9f0332d9eb37dd9a5d5977fc99de8bb80fa9aea	2026-01-22 22:09:22.599922
5	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	17005bc3de472704765f6194aa05c2f567e1bda3322a904827f6ccab6a5ecaac	2026-01-22 22:12:40.841459
6	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	4252626d34b66580430ee251edd32709d408e49d803bbcca58aa84ca303be540	2026-01-22 22:12:56.134476
7	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	850846561c741c4805f2eb647c865e7e3541ebc73ec5cc62fdbe678a5dfdd2b7	2026-01-22 22:13:06.509498
8	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	de4895d5f83dcc6ae88300eddfdc236b6c385917841aa995a912e0788382cb3f	2026-01-22 22:13:49.829675
9	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	7765c5fe653dc3ee68d33cd6def51a5d947ad07e366399711f06234b2acfb2d9	2026-01-22 22:38:07.839265
10	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	78180a192e2b994c0fc079fea42f5ea97abd193cf2573895303c803d3c8444d0	2026-01-22 22:39:26.439976
11	login	1	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	e4434ecea6631cc0294bc8ead4271ac74794bb7c0a4d99106adff29175d63987	2026-01-22 23:03:59.814508
12	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	6c762cefae9be7cdd1ee39d93982c680c60ea66bcf7cb55fb55f4344ff6ac563	2026-01-23 02:37:39.735415
13	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	5db244cd28b0376f709cc397f0c46c9d122e43f7539155ccb43387a0bbb37911	2026-01-23 02:45:56.442506
14	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "clinica"}	a2ce0179affd97239456a64314975208b229be0a1968ef3acc66aca438abdf06	2026-01-23 03:18:23.671166
15	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "clinica"}	18552ab89688fdfc3358fc0f19a56c1767094ad6cae4421dae63fa31d108ac78	2026-01-23 03:18:32.747256
16	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	b91d6c310b702810893480ed7e10654a84dd9c3faf85b1b8ebd1ec5c2e416510	2026-01-23 03:36:51.313583
17	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "clinica"}	d7c99b0d961be2b8f4ce5cc9d5a7d2f2f70aa1ea1584b356b7fd488cf897d837	2026-01-23 03:39:28.212898
18	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	8ecdff215a77959ca4ca9f9bea538ae781f0707c78a76531175172a5863dff13	2026-01-23 08:34:45.610572
19	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	ff827c706937ef47a11239a8a72cb5c71a40c3bbd4a7cd5b5e8e3962317d8edd	2026-01-23 08:35:34.708668
20	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	9e0b86e68d61661471fb875157206ec7804e3627db3c7600be1c4e98eb24b963	2026-01-23 08:42:39.7349
21	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	4014ae235d2f4a9334d3ad3cd65d45961f511cad63170db95a878ac5b1cc1e2f	2026-01-23 08:43:36.013126
22	login	9	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	265d9e81aef4e87ff3e163fbff79387e8b638268fbae8cd2355fa67a906bab1b	2026-01-23 08:48:02.85586
23	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	a79a3f75983a2192170d05866914489e0fb74cd2a2e4d86c3ad46da16a82bc8f	2026-01-23 08:48:16.93371
24	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	0bff0d375a45a2823852a81a74c93973fda9e75ac2982b820127c102737204df	2026-01-23 08:53:31.455744
25	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	4f865ee27954d7c2271632627722473a417d51923b79734bbb6f99f20b0abe0f	2026-01-23 18:58:15.334879
26	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	c8ac5d87db99c59ccbbf389f2f7d4898bde85e5b68e11d415332b079963205e3	2026-01-23 18:58:24.46974
27	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	224b187c0a9ba04aaf4ef57c9cfa49818e78f6ff411b30c5fa56b261e0c66a5a	2026-01-23 19:14:16.412501
28	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	403099010900b3692d92a1d657078bed8c146884e8d7e7667d38c32bb7a61655	2026-01-23 19:19:32.887229
29	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	efd4b13838a48c8e718fab9c83a78f3e5edcacbd52e80870554ebc8daf3067ae	2026-01-23 19:43:22.334618
30	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	42f68ffd4c0758fd609320ffce3e69e62a305ccb5cab01ef7f34f3017d09610c	2026-01-23 20:14:37.089598
31	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	9ff1989feb6b90d1382e6e52c4280f0d79fa548d3b2c6929dd94c3739bcf24d9	2026-01-23 20:18:38.754176
32	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	d33e48c7e130e2ab0467b5bf76290120a6750fbb91300a188885c4097e65c7cb	2026-01-24 08:09:51.947615
33	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	19559b4919e9f364699840d001f1b1ff79b24ef548ef629eb4bae152c845fbb7	2026-01-24 08:33:59.698849
34	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	eea0738c9e925efd82a67ef9c33bec35cea51b7c720c3786543039a1751d446b	2026-01-24 09:05:07.707969
35	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	6d6b0fa964ee42b73c4f764021187c9a773cd81d8cec6bf85012dc1eb6aefb84	2026-01-24 09:24:30.228635
36	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	3520afe0df0a8750b584bff42ab28691c8b7dddca1bd7c5824d24e3c784984f2	2026-01-24 11:36:49.799382
37	login	11	login_sucesso	\N	\N	44055544049	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	14d27a9e326b8e1022c874a87c571ab59983c910d1dc778136fc20fab6026c6f	2026-01-24 12:18:49.709612
38	login	12	login_sucesso	\N	\N	32282678060	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	28ab41b21c20f9500250e1f82b41992d60ec22e3e5f7dfe7adbb446e5430cff4	2026-01-24 19:03:58.421378
39	login	12	login_sucesso	\N	\N	32282678060	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	1b3879f69906f3163fb12139b8dd9bef5819ae1943c2c7f8be62db83462bfb3e	2026-01-24 19:04:27.618138
40	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	f4706c426e4dcfc7ac69beb49b2f7866df7f21e1eae811cc92e638c4a05c7cd2	2026-01-24 19:07:07.629379
41	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	e6954455a68cdef1ffa4ed18434f3a1ec9f6057cddb40c0465dc695841879e3a	2026-01-24 19:17:22.095413
42	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	67ccfc764fa33e0dded67eefea26355c092add809259bbae3371d79dd86f2f9e	2026-01-24 19:24:57.945442
43	login	10	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	f6a6d8863aec31a6bf86167925359542d6e29cc1998a473caee8927035ae68f7	2026-01-24 19:25:32.694584
44	login	9	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	b44a0bea3aaaf9ca0a894bf9f35a31b79f16abe40169a861b50a08e9ea831fca	2026-01-25 00:43:13.649528
45	login	9	login_falha	\N	\N	87545772920	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	9592230c7925aa69d40e4ced63fe4f77704ab26be8c743ee0551303cd0ba1683	2026-01-25 00:43:15.858334
46	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	62475234f2cbd8aeb6ebe0bf34480251ae41648f9f38fc1d201c413776b81008	2026-01-25 00:43:23.782512
47	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	971a982e84d31ee5e1a7f3d00d604fba15b3a42923089442b45d57186d4e621d	2026-01-25 00:44:56.459368
48	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	05029c422d95ecf6de12183ef4dedb2dcba3aa9ea6bd8d83490e33c11636eb25	2026-01-25 00:57:41.744586
49	login	10	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 3, "tipo_contratante": "clinica"}	98ee65b6e92c993d45db0d5a9bff7edf9f6210b784babc3880ddb3766c5c27f5	2026-01-25 00:58:37.17655
50	login	9	login_sucesso	\N	\N	87545772920	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	88649b20a4398b2f50139b627abeea6219c74bfe78692102e593f6db2eb79653	2026-01-25 01:23:49.347168
51	login	13	login_sucesso	\N	\N	26409186053	gestor_entidade	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "entidade"}	b201abf54f039d0946728cbaca4e420d1cd9fdb796419d94382e2c5f8d919d99	2026-01-25 09:59:19.670465
52	login	14	login_sucesso	\N	\N	95076358075	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "clinica"}	9d4fb30da47b5078f868eebee942b88af006c5449d00c9a7b20d1e2675a5100f	2026-01-25 10:04:05.606579
53	login	13	login_sucesso	\N	\N	26409186053	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	b234cbca65f5ba12b23404054153dd0154f93c8cf99356def5e43fc7fe05679a	2026-01-25 11:00:59.597486
54	login	14	login_sucesso	\N	\N	95076358075	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"tipo_contratante": "clinica"}	e7da6f861fbc97063e8b19afd683c2c81a91006b51f5201631ddb1a6d80a673a	2026-01-25 11:01:35.856648
55	login	14	login_sucesso	\N	\N	95076358075	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 4, "tipo_contratante": "clinica"}	e8ac7629cb1c1b4f9f6ac2b69a7b1e6f63ebeb6cbf59c5a7b766b1f6e4b8e845	2026-01-25 11:35:59.31984
56	login	14	login_sucesso	\N	\N	95076358075	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 4, "tipo_contratante": "clinica"}	f9195fe2bb0e372c35b9a4c846225112f9cdeb8ca0202e420cd5dcf58e1d051c	2026-01-25 13:54:31.848886
57	login	13	login_sucesso	\N	\N	26409186053	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	f4c2bb67d6ac9a125196ec4a08f3289ee4c24f6e95c5dc47840734385be243e6	2026-01-25 13:55:55.246532
58	login	13	login_sucesso	\N	\N	26409186053	gestor_entidade	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"tipo_contratante": "entidade"}	851d6dfbe9319e31b24781cb89b126e360ba96e9d42504fad3002190c6a3dcc7	2026-01-25 13:57:24.718603
\.


--
-- Data for Name: auditoria_laudos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria_laudos (id, lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, observacoes, criado_em) FROM stdin;
1	6	1	53051173991	Sender Test	emissao_automatica	emitido	127.0.0.1	\N	2026-01-24 08:59:08.986082
2	7	2	53051173991	Sender Test	emissao_automatica	emitido	127.0.0.1	\N	2026-01-24 08:59:09.024219
3	8	3	53051173991	Sender Test	emissao_automatica	emitido	127.0.0.1	\N	2026-01-24 09:27:20.015128
4	10	4	53051173991	Sender Test	emissao_automatica	emitido	127.0.0.1	\N	2026-01-25 13:53:27.88039
5	11	5	53051173991	Sender Test	emissao_automatica	emitido	127.0.0.1	\N	2026-01-25 13:59:36.244052
\.


--
-- Data for Name: avaliacao_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avaliacao_resets (id, avaliacao_id, lote_id, requested_by_user_id, requested_by_role, reason, respostas_count, created_at) FROM stdin;
fdf87811-88aa-4938-a6ad-c5a9c59e45ae	2	5	16	rh	ttwetew ewtetwetwewte	8	2026-01-23 19:13:52.695884-03
a6411e6e-ee3f-491f-adc1-44e47c6e408d	1	4	9	gestor_entidade	erewttewwettwe	7	2026-01-23 19:42:53.122266-03
6eb82ba1-244b-4c72-8fc9-0aaa2f856cfb	13	10	30	rh	eewewttewwe	21	2026-01-25 13:51:31.440548-03
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avaliacoes (id, funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id, inativada_em, motivo_inativacao) FROM stdin;
1	70847446069	2026-01-23 11:53:17.97	\N	inativada	1	2026-01-23 08:53:17.971736	2026-01-23 19:43:04.910135	4	2026-01-23 19:43:04.910135-03	ddgdgsd gdsdgsgdssd
2	93358341062	2026-01-23 11:53:56.18	\N	inativada	1	2026-01-23 08:53:56.181836	2026-01-23 20:12:43.905997	5	2026-01-23 20:12:43.905997-03	faffasfasfaasffs
5	93358341062	2026-01-23 23:17:24.206	\N	iniciada	1	2026-01-23 20:17:24.218603	2026-01-23 20:17:24.218603	6	\N	\N
3	95762000087	2026-01-23 23:17:24.206	2026-01-23 20:18:09.023925	concluida	1	2026-01-23 20:17:24.210882	2026-01-23 20:17:24.210882	6	\N	\N
4	20340514086	2026-01-23 23:17:24.206	\N	inativada	1	2026-01-23 20:17:24.215775	2026-01-23 20:18:25.68015	6	2026-01-23 20:18:25.68015-03	gdsgsgsgsdsds
6	21706008090	2026-01-23 23:18:55.462	2026-01-23 20:19:25.112218	concluida	1	2026-01-23 20:18:55.463936	2026-01-23 20:18:55.463936	7	\N	\N
7	80362755035	2026-01-23 23:18:55.462	\N	inativada	1	2026-01-23 20:18:55.467961	2026-01-24 08:10:33.397239	7	2026-01-24 08:10:33.397239-03	iopoiopipo
8	70847446069	2026-01-23 23:18:55.462	\N	inativada	1	2026-01-23 20:18:55.470417	2026-01-24 08:10:47.973264	7	2026-01-24 08:10:47.973264-03	iopiopipoi opiopiop opipoiopipoipo oipoiopipoipoiopiipo
9	20340514086	2026-01-24 12:25:56.395	2026-01-24 09:26:48.330167	concluida	1	2026-01-24 09:25:56.395868	2026-01-24 09:25:56.395868	8	\N	\N
10	93358341062	2026-01-24 12:25:56.395	\N	inativada	1	2026-01-24 09:25:56.400081	2026-01-24 09:27:14.964748	8	2026-01-24 09:27:14.964748-03	vbvbxvbbvbvbx hdfhfsfdsfhd hghhshdhgd hggjsgjssjgsjgsj
11	93358341062	2026-01-25 10:55:22.385	\N	iniciada	1	2026-01-25 07:55:22.386792	2026-01-25 07:55:22.386792	9	\N	\N
12	95762000087	2026-01-25 10:55:22.385	\N	iniciada	1	2026-01-25 07:55:22.391291	2026-01-25 07:55:22.391291	9	\N	\N
13	99388588053	2026-01-25 16:50:38.664	2026-01-25 13:51:53.920671	concluida	1	2026-01-25 13:50:38.665009	2026-01-25 13:51:31.440548	10	\N	\N
14	16841540069	2026-01-25 16:50:38.664	\N	inativada	1	2026-01-25 13:50:38.669974	2026-01-25 13:53:21.391354	10	2026-01-25 13:53:21.391354-03	dafadfas sasfaffas
16	99404235008	2026-01-25 16:57:37.308	\N	inativada	1	2026-01-25 13:57:37.31418	2026-01-25 13:58:59.78599	11	2026-01-25 13:58:59.78599-03	ewtewt tewetwtewtew
15	07752435074	2026-01-25 16:57:37.308	2026-01-25 13:59:32.311404	concluida	1	2026-01-25 13:57:37.30911	2026-01-25 13:57:37.30911	11	\N	\N
\.


--
-- Data for Name: backup_lotes_migracao_20260130; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_lotes_migracao_20260130 (id, codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, contratante_id, auto_emitir_em, auto_emitir_agendado, hash_pdf, numero_ordem, emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento, modo_emergencia, motivo_emergencia, processamento_em) FROM stdin;
3	003-290126	\N	\N	Lote 1 - 003-290126	Lote 1 liberado para fapoupou pupoupou. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-29 09:19:39.82596	2026-01-29 09:19:39.82596	2026-01-30 00:55:00.661555	2	\N	f	\N	1	\N	\N	f	\N	f	\N	\N
4	004-290126	\N	\N	id=4	Lote 2 liberado para fapoupou pupoupou. Inclui 1 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-29 09:33:06.985069	2026-01-29 09:33:06.985069	2026-01-30 00:55:00.661555	2	\N	f	\N	2	\N	\N	f	\N	f	\N	\N
5	005-290126	\N	\N	Lote 3 - 005-290126	Lote 3 liberado para fapoupou pupoupou. Inclui 2 funcionário(s) elegíveis.	completo	finalizado	04703084945	2026-01-29 10:07:03.517022	2026-01-29 10:07:03.517022	2026-01-30 00:55:00.661555	2	\N	f	\N	3	2026-01-29 07:18:00.25086-03	\N	f	\N	f	\N	\N
6	006-290126	\N	\N	Lote 4 - 006-290126	Lote 4 liberado para fapoupou pupoupou. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-29 10:29:33.88238	2026-01-29 10:29:33.88238	2026-01-30 00:55:00.661555	2	\N	f	\N	4	\N	\N	f	\N	f	\N	\N
8	007-290126	\N	\N	Lote 5 - 007-290126	Lote 5 liberado para fapoupou pupoupou. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-29 10:46:21.137794	2026-01-29 10:46:21.137794	2026-01-30 00:55:00.661555	2	\N	f	\N	5	\N	\N	f	\N	f	\N	\N
11	010-290126	\N	\N	Lote 6 - 010-290126	Lote 6 liberado para fapoupou pupoupou. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-29 13:31:56.300537	2026-01-29 13:31:56.300537	2026-01-30 00:55:00.661555	2	\N	f	\N	6	\N	\N	f	\N	f	\N	\N
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinicas (id, nome, cnpj, email, telefone, endereco, ativa, criado_em, atualizado_em, contratante_id) FROM stdin;
1	Clinica Test	11111111111111	clinica@local	\N	\N	t	2026-01-23 08:14:24.842364	2026-01-23 08:14:24.842364	1
3	SERVMEDOcip	09110380000191	jiiohoi@hiuhiu.com	(87) 98464-6664	R. Waldemar Kost, 1130 - Curitiba/PR - 81630-180	t	2026-01-23 08:24:54.086349	2026-01-23 08:24:54.086349	10
4	Clinica Final	72737511000100	clinciateifnal@qwork.com	(64) 54564-6513	Rua Antônio Bianchetti, 90	t	2026-01-25 11:34:13.519722	2026-01-25 11:34:13.519722	14
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
1	9	100	10.00	1000.00	d79988dc382cff7992f6ea92c183240df1a7ccff78445b778e2272f0d85b0b29	2026-01-25 02:36:49.63	valor_aceito_pelo_contratante	2026-01-22 23:03:53.35334	2026-01-23 02:37:00.924232	2026-01-23 02:36:49.631536
2	10	1000	5.00	5000.00	8d2e98d4299d0e9e66caa565f92b0eacfe0941cd4e9c678b8c401b0b02e423d7	2026-01-25 03:07:49.605	valor_aceito_pelo_contratante	2026-01-23 03:07:29.488668	2026-01-23 03:08:07.505723	2026-01-23 03:07:49.606922
5	13	20	35.00	700.00	e8f61fc75db4ccef83085e48ef6e5a4bce1afe8b0bf841f6965f3d9c603783aa	2026-01-27 09:57:29.617	valor_aceito_pelo_contratante	2026-01-25 09:57:05.796608	2026-01-25 09:57:42.079955	2026-01-25 09:57:29.618595
6	14	125	50.00	6250.00	1daf1a31055001e77292383691b6e5667a93a12453e171d8e2ccc0251cc92484	2026-01-27 10:02:15.855	valor_aceito_pelo_contratante	2026-01-25 10:01:54.720839	2026-01-25 10:02:26.869455	2026-01-25 10:02:15.856365
\.


--
-- Data for Name: contratantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratantes (id, tipo, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login) FROM stdin;
9	entidade	RLGERE	02494916000170	\N	ouoiu@jiouio.com	(89) 87989-8798	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Ronaldo fo	87545772920	\N	jiooijoi@jiojoi.com	(64) 65498-9988	/uploads/contratantes/02494916000170/cartao_cnpj_1769133833344.jpeg	/uploads/contratantes/02494916000170/contrato_social_1769133833347.jpeg	/uploads/contratantes/02494916000170/doc_identificacao_1769133833349.jpeg	aprovado	\N	\N	t	2026-01-22 23:03:53.35334	2026-01-23 02:37:14.715373	2026-01-23 02:37:14.715373	\N	t	100	4	\N	2026-01-23 02:37:14.715373
10	clinica	SERVMEDOcip	09110380000191	\N	jiiohoi@hiuhiu.com	(87) 98464-6664	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Tani K	04703084945	\N	dsoijoi@hihi.com	(31) 54646-4888	/uploads/contratantes/09110380000191/cartao_cnpj_1769148449478.jpeg	/uploads/contratantes/09110380000191/contrato_social_1769148449481.png	/uploads/contratantes/09110380000191/doc_identificacao_1769148449484.jpeg	aprovado	\N	\N	t	2026-01-23 03:07:29.488668	2026-01-23 03:08:29.420935	2026-01-23 03:08:29.420935	\N	t	1000	4	\N	2026-01-23 03:08:29.420935
13	entidade	Entidade Final	96803484000186	\N	entifinal@qwork.com	(56) 46513-2165	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Ronaldo Fill	26409186053	\N	rnado@qwork.com	(64) 65451-3311	/uploads/contratantes/96803484000186/cartao_cnpj_1769345825788.PDF	/uploads/contratantes/96803484000186/contrato_social_1769345825791.jpeg	/uploads/contratantes/96803484000186/doc_identificacao_1769345825793.PDF	aprovado	\N	\N	t	2026-01-25 09:57:05.796608	2026-01-25 09:57:55.645064	2026-01-25 09:57:55.465545	00000000000	t	20	4	\N	2026-01-25 09:57:55.465545
14	clinica	Clinica Final	72737511000100	\N	clinciateifnal@qwork.com	(64) 54564-6513	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Tania Folaioip	95076358075	\N	taniak@qwork.com	(46) 54561-3154	/uploads/contratantes/72737511000100/cartao_cnpj_1769346114712.PDF	/uploads/contratantes/72737511000100/contrato_social_1769346114714.png	/uploads/contratantes/72737511000100/doc_identificacao_1769346114717.jpeg	aprovado	\N	\N	t	2026-01-25 10:01:54.720839	2026-01-25 10:02:45.128132	2026-01-25 10:02:44.971394	00000000000	t	125	4	\N	2026-01-25 10:02:44.971394
\.


--
-- Data for Name: contratantes_funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratantes_funcionarios (id, funcionario_id, contratante_id, tipo_contratante, vinculo_ativo, criado_em) FROM stdin;
1	21	10	clinica	t	2026-01-29 23:13:54.951689
2	22	10	clinica	t	2026-01-29 23:13:54.951689
3	18	10	clinica	t	2026-01-29 23:13:54.951689
4	32	14	clinica	t	2026-01-29 23:13:54.951689
5	31	14	clinica	t	2026-01-29 23:13:54.951689
6	17	9	entidade	t	2026-01-29 23:13:54.951689
7	24	9	entidade	t	2026-01-29 23:13:54.951689
8	23	9	entidade	t	2026-01-29 23:13:54.951689
9	33	13	entidade	t	2026-01-29 23:13:54.951689
10	34	13	entidade	t	2026-01-29 23:13:54.951689
\.


--
-- Data for Name: contratantes_senhas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratantes_senhas (id, contratante_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at) FROM stdin;
5	9	87545772920	$2a$10$TQm9napY0IOU..dIBM5Z1uy1bZYXUINANf1eKtffUTxRU0mrg/Zk2	f	2026-01-23 02:37:14.532651	2026-01-23 02:37:14.532651
10	14	95076358075	$2a$10$LIUGpAyyGmpKvnCcFn2EH..STULv3RiLGNTUFsupLMO2voVqZ5b/O	f	2026-01-25 10:02:44.787995	2026-01-25 10:02:44.787995
6	10	04703084945	$2a$10$stS1tYsEyQx8LOtHjI6wZO1w/deDpAXtbn8tVV0lz/qmy8Zq.TgHC	f	2026-01-23 03:08:29.223338	2026-01-25 23:39:29.991251
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contratos (id, contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado) FROM stdin;
1	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 00:48:09.298585	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
2	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 00:48:29.368881	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 00:50:51.525175	\N	\N
3	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 00:56:40.54832	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
4	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 00:56:53.760336	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 00:57:00.163887	\N	\N
5	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:07:14.278884	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
6	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:07:26.615929	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:07:34.313628	\N	\N
7	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:09:39.415438	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
8	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:09:55.912913	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:10:02.62889	\N	\N
9	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:12:52.503244	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
10	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:13:03.923092	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:13:10.434838	\N	\N
11	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:14:52.537136	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
13	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:19:40.171353	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
12	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:15:03.429404	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:15:10.031052	\N	\N
14	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:19:51.257871	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:20:07.882717	\N	\N
15	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:21:56.908396	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
16	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:22:11.356622	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:22:19.092397	\N	\N
17	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:25:04.215434	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
18	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:25:15.549213	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:25:21.42281	\N	\N
19	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:38:00.741334	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
20	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:38:14.495529	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:38:24.840918	\N	\N
21	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:41:18.491502	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
22	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:41:35.485119	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:41:45.612128	\N	\N
23	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:45:45.608915	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
24	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:46:03.802875	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:46:11.373685	\N	\N
25	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:52:03.473622	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
26	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:52:14.8469	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:52:21.058343	\N	\N
27	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:54:24.249337	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
28	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 01:54:37.603456	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 01:54:44.659146	\N	\N
29	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 02:29:04.826443	2026-01-23 02:35:49.057218	\N	\N	\N	\N	\N
30	9	4	100	1000.00	pendente	f	f	\N	2026-01-23 02:29:16.617525	2026-01-23 02:35:49.057218	\N	::ffff:127.0.0.1	2026-01-23 02:29:22.829069	\N	\N
31	9	4	100	1000.00	aguardando_pagamento	f	f	\N	2026-01-23 02:36:49.633016	\N	\N	\N	\N	\N	\N
32	9	4	100	1000.00	pendente	t	f	\N	2026-01-23 02:37:00.927688	\N	\N	::ffff:127.0.0.1	2026-01-23 02:37:08.546307	\N	\N
33	10	4	1000	5000.00	aguardando_pagamento	f	f	\N	2026-01-23 03:07:49.609522	\N	\N	\N	\N	\N	\N
34	10	4	1000	5000.00	pendente	t	f	\N	2026-01-23 03:08:07.509129	\N	\N	::ffff:127.0.0.1	2026-01-23 03:08:18.378394	\N	\N
39	13	4	20	700.00	aguardando_pagamento	f	f	\N	2026-01-25 09:57:29.621383	\N	\N	\N	\N	\N	\N
40	13	4	20	700.00	pendente	t	f	\N	2026-01-25 09:57:42.082819	\N	\N	::ffff:127.0.0.1	2026-01-25 09:57:47.86684	\N	\N
41	14	4	125	6250.00	aguardando_pagamento	f	f	\N	2026-01-25 10:02:15.857589	\N	\N	\N	\N	\N	\N
42	14	4	125	6250.00	pendente	t	f	\N	2026-01-25 10:02:26.873727	\N	\N	::ffff:127.0.0.1	2026-01-25 10:02:32.762269	\N	\N
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
5	7	2	Erro na emissão imediata do lote 7: current transaction is aborted, commands ignored until end of transaction block	2026-01-29 03:22:09.406853-03	2026-01-29 03:11:30.476615-03	2026-01-29 03:18:09.406853-03
6	5	1	Erro na emissão imediata do lote 5: current transaction is aborted, commands ignored until end of transaction block	2026-01-29 07:18:06.037271-03	2026-01-29 07:17:06.037271-03	2026-01-29 07:17:06.037271-03
\.


--
-- Data for Name: empresas_clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresas_clientes (id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, contratante_id, representante_nome, representante_fone, representante_email) FROM stdin;
5	Empresa teste	23020477000134	joppoi@jhhu.com	(34) 65465-4566	rua jdsfaio u, 123	koiopip	OO	15123489	t	3	2026-01-23 08:36:19.726601	2026-01-23 08:36:19.726601	\N	\N	\N	\N
6	Empresa Clinca Fonalq	95173239000170	ijouoiu@hihiuhiu.com	(46) 46546-6133	rua jlkjlkjlk 23432	uoiuou	UU	8456123	t	4	2026-01-25 11:40:10.297209	2026-01-25 11:40:10.297209	\N	\N	\N	\N
1	fapoupou pupoupou	53650950000128	jkjlkj@huiiu.co	(45) 46546-5466	rua aodppoi 8098	jkhlkhlkjk	UI	45612456	t	21	2026-01-28 11:27:21.86574	2026-01-28 11:27:21.86574	\N	repre enem	45465465123	yiyiyiu@huhu.com
2	tewteewt te twetew	61211486000100	jlkjkljlk@uiouoi.con	(45) 64654-6566	ru apidfpo 34334	çpoioppiopio	IO	45645456	t	22	2026-01-29 05:26:47.548152	2026-01-29 05:26:47.548152	\N	jpj pjopoipoi	46546546546	iuoiuoi@juhuhc.upo
3	iotewipoeti oewippoewip	69751462000147	dgjjlkj@jdsgiojoi.com	(45) 64654-6544	dfoipo dfpopo i	uiuoiuoi	UI	45466456	t	21	2026-01-29 18:04:52.018912	2026-01-29 18:04:52.018912	\N	dgslkdlskçl lçdagskkçl	87878979878	sdoipdsgo@kjoijoi.com
\.


--
-- Data for Name: fila_emissao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fila_emissao (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em, solicitado_por, solicitado_em, tipo_solicitante) FROM stdin;
17	18	0	1	2026-01-31 00:07:06.989765	\N	2026-01-30 23:56:44.268532	2026-01-30 23:56:44.268532	04703084945	2026-01-30 23:21:34.183177	rh
19	7	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	87545772920	2026-01-29 05:40:35.707715	gestor_entidade
20	2	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	87545772920	2026-01-29 06:07:50.71393	gestor_entidade
21	9	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	87545772920	2026-01-29 11:18:09.691171	gestor_entidade
22	10	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	87545772920	2026-01-29 11:33:54.993981	gestor_entidade
23	13	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	16543102047	2026-01-29 17:26:34.135433	gestor_entidade
24	3	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-29 09:19:39.82596	rh
25	4	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-29 09:33:06.985069	rh
26	6	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-29 10:29:33.88238	rh
27	8	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-29 10:46:21.137794	rh
28	11	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-29 13:31:56.300537	rh
29	16	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	87545772920	2026-01-30 14:40:33.819145	gestor_entidade
30	15	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-30 14:40:14.253146	rh
31	17	0	3	2026-01-31 00:07:06.989765	\N	2026-01-31 00:07:06.989765	2026-01-31 00:07:06.989765	04703084945	2026-01-30 22:33:32.04545	rh
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionarios (id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, clinica_id, empresa_id, matricula, turno, escala, nivel_cargo, ultima_avaliacao_id, ultimo_lote_codigo, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, contratante_id, indice_avaliacao, usuario_tipo) FROM stdin;
17	70847446069	rondasklfoi jjiouo	uiuo	ouoiuoi	oiuoiui@jljlk.com	$2a$10$NF1sRN/r75xZanZwR4uNYuXfq/BVT3QcjZ8PWNsvJ4MXWLOVmrcuW	funcionario	t	2026-01-23 08:35:21.626058	2026-01-23 08:35:21.626058	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	\N	\N	2000-01-01	9	0	funcionario_entidade
18	93358341062	tewipi ewptipoip	kjkljlk	lkjlkjlkj	yiuyiuyadm@email.com	$2a$10$fVqyN7P6cYDpGpU2st9zFOuFOPJy0wvddO0ZUz5l.4v5brrjWkqSy	funcionario	t	2026-01-23 08:37:01.136251	2026-01-23 08:37:01.136251	3	5	\N	\N	\N	gestao	\N	\N	\N	\N	\N	\N	0002-02-01	\N	0	funcionario_clinica
24	80362755035	Mariana Maria	Operacional	Coordenadora	rolnkl@jijij.com	$2a$10$Q2UlP4/4uTQV0OsOKvHYNu9oqZOUikIl0mAGMDsNv1BdV9mls4U0O	funcionario	t	2026-01-23 20:14:53.947429	2026-01-23 20:14:53.947429	\N	\N	\N	\N	\N	gestao	\N	\N	\N	\N	\N	\N	1974-10-24	9	0	funcionario_entidade
22	95762000087	DIMore Itali	Operacional	estagio	mmmm.santos@empresa.com.br	$2a$10$S/jyP62M0mFS/K9./rado.RV7BU7fL56vEfzz818hq.wBGzAKfdu6	funcionario	t	2026-01-23 20:14:07.471261	2026-01-23 20:18:09.053275	3	5	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2026-01-23 20:17:24.202	2011-02-02	\N	2	funcionario_clinica
23	21706008090	João da Cpuves	Administrativo	Analista	joao.24@empresa.com.br	$2a$10$Oq7Y8XWqfysm10vFO2E8yu0eYuqD0Ofd0P/OYsPaaE/I/8dFByJWa	funcionario	t	2026-01-23 20:14:53.947429	2026-01-23 20:19:25.141337	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2026-01-23 20:18:55.452	2010-12-12	9	2	funcionario_entidade
25	53051173991	Sender Test	\N	\N	ronado@qwork.com	$2a$10$FDl0Gbyl6t60W6hagEm/WeBXBQMR8LVbXm8ksAl.qtz1W/dBupMLS	emissor	t	2026-01-24 08:09:09.005114	2026-01-24 08:09:09.005114	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	emissor
21	20340514086	Jose do UP01	Administrativo	Analista	jose.silva@empresa.com.br	$2a$10$9wX17JnD8vbSfdESbZY./uhdcthgdN.P86n8f.FvMRnuzkHaYcZ1S	funcionario	t	2026-01-23 20:14:07.471261	2026-01-24 09:26:48.367169	3	5	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2026-01-24 09:25:56.383	1985-04-15	\N	3	funcionario_clinica
4	00000000000	Admin	\N	\N	admin@qwork.com	$2a$06$ruVt00j9Wu/6w79wCLOb2.Yij1KvFWjIbaXTTu81GiwlrarQsH0R6	admin	t	2026-01-22 22:01:02.940665	2026-01-24 11:33:31.168928	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	admin
29	26409186053	Ronaldo Fill	\N	\N	rnado@qwork.com	$2a$10$HrTCslyfZBKnkC5jNtln..g/boQIyW2/qxSWPp1m/6Buxvq49bm.S	gestor_entidade	t	2026-01-25 09:57:55.43482	2026-01-25 09:59:19.838449	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	13	0	gestor_entidade
31	16841540069	Jose do UP01	Administrativo	Analista	jose.silfsva@empresa.com.br	$2a$10$u22imbtF1SJK6sBqU5xSLe.6z8le6uvvPwLQfY7BpiE4vDXBQT522	funcionario	t	2026-01-25 13:50:30.258047	2026-01-25 13:50:30.258047	4	6	\N	\N	\N	operacional	\N	\N	\N	\N	\N	\N	1985-04-15	\N	0	funcionario_clinica
32	99388588053	DIMore Itali	Operacional	estagio	m8099.santos@empresa.com.br	$2a$10$BxINqJjzdb97GKahhnkw.uhm4rWIRi4M3pV01qdiiT7yw.sWoA9XO	funcionario	t	2026-01-25 13:50:30.258047	2026-01-25 13:51:53.955165	4	6	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2026-01-25 13:50:38.657	2011-02-02	\N	1	funcionario_clinica
33	99404235008	jose do papo	Administrativo	Analista	ilf809sva@empresa.com.br	$2a$10$kPmNYT8ZS8dEL4H9IghYI.DhzQS/oW0yca6FujxhAjVCt/kJZr4zW	funcionario	t	2026-01-25 13:56:19.188875	2026-01-25 13:56:19.188875	\N	\N	\N	\N	\N	operacional	\N	\N	\N	\N	\N	\N	1985-04-15	13	0	funcionario_entidade
34	07752435074	DIMore Beli	Operacional	estagio	m8099.s5443antos@empresa.com.br	$2a$10$Hd6MXPmCiPaQgKCXGTodbe8aPDJ.GMd.ygn.0kTnyxL4W7wq4tagC	funcionario	t	2026-01-25 13:56:19.188875	2026-01-25 13:59:32.347532	\N	\N	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2026-01-25 13:57:37.3	2011-02-02	13	3	funcionario_entidade
30	95076358075	Tania Folaioip	\N	\N	taniak@qwork.com	$2a$10$VOx7LVuaPkwF7HHDqk7fKOoKc1mBF46aIGHzHl1ueyXnlYMNBvjPC	rh	t	2026-01-25 10:02:44.952522	2026-01-25 10:04:05.769574	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	gestor_rh
16	04703084945	Tani K	\N	\N	dsoijoi@hihi.com	$2a$10$stS1tYsEyQx8LOtHjI6wZO1w/deDpAXtbn8tVV0lz/qmy8Zq.TgHC	rh	t	2026-01-23 08:32:13.316807	2026-01-23 08:32:13.316807	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	gestor_rh
\.


--
-- Data for Name: laudo_arquivos_remotos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_arquivos_remotos (id, laudo_id, provider, bucket, key, url, checksum, size_bytes, tipo, criado_por, criado_em) FROM stdin;
\.


--
-- Data for Name: laudo_downloads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_downloads (id, laudo_id, arquivo_remoto_id, user_cpf, user_perfil, ip_address, user_agent, download_method, created_at) FROM stdin;
\.


--
-- Data for Name: laudo_generation_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudo_generation_jobs (id, laudo_id, status, prioridade, tentativas, max_tentativas, erro_mensagem, worker_id, criado_em, iniciado_em, finalizado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: laudos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
1	6	53051173991	Laudo gerado automaticamente pelo sistema	enviado	2026-01-24 08:39:38.00851	2026-01-24 09:21:08.815165	2026-01-24 09:21:08.815165	2026-01-24 09:21:08.815165	2b49cd262fde7d60bf428d1eff2f3f766296d2dd23fa0ee33428bc229c0cf13d	\N	\N	\N	\N
2	7	53051173991	Laudo gerado automaticamente pelo sistema	enviado	2026-01-24 08:39:42.636964	2026-01-24 09:21:08.815165	2026-01-24 09:21:08.815165	2026-01-24 09:21:08.815165	b6adc0925b14c6311a6244bb404fb7f9a10a000b94e2172072b868fb649b9e3c	\N	\N	\N	\N
3	8	53051173991	Laudo gerado automaticamente pelo sistema	enviado	2026-01-24 09:27:15.457038	2026-01-24 09:27:20.007791	2026-01-24 09:27:20.007791	2026-01-24 09:27:20.007791	ec81755ce1de29ee9a08fe6dbbbf783a1ad39ae5d6787ac9ff3d5307d83dadea	\N	\N	\N	\N
4	10	53051173991	Laudo gerado automaticamente pelo sistema	enviado	2026-01-25 13:53:27.856798	2026-01-25 13:53:27.856798	2026-01-25 13:53:27.856798	2026-01-25 13:53:27.865799	5a98d2c71d37f4c75cab3075b204d923909e98035d28985393ac0624fabe7a51	\N	\N	\N	\N
5	11	53051173991	Laudo gerado automaticamente pelo sistema	enviado	2026-01-25 13:59:36.220728	2026-01-25 13:59:36.220728	2026-01-25 13:59:36.220728	2026-01-25 13:59:36.228046	d5d1337cc3b1e3bbe23f3cad1d614abcc0845e1b59bf63dea287bbc5a7256c02	\N	\N	\N	\N
\.


--
-- Data for Name: lote_id_allocator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lote_id_allocator (id, clinica_id, contratante_id, ano, mes, last_sequence, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lotes_avaliacao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lotes_avaliacao (id, codigo, clinica_id, empresa_id, titulo, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, contratante_id, auto_emitir_em, auto_emitir_agendado, hash_pdf, numero_ordem, emitido_em, enviado_em, cancelado_automaticamente, motivo_cancelamento, modo_emergencia, motivo_emergencia) FROM stdin;
4	001-230126	\N	\N	Lote 1 - 001-230126	Lote 1 liberado para RLGERE. Inclui 1 funcionário(s) elegíveis.	completo	cancelado	\N	2026-01-23 08:53:17.939949	2026-01-23 08:53:17.939949	2026-01-23 08:53:17.939949	9	\N	f	\N	1	\N	\N	f	\N	f	\N
5	002-230126	3	5	Lote 1 - 002-230126	Lote 1 liberado para Empresa teste. Inclui 1 funcionário(s) elegíveis.	completo	cancelado	04703084945	2026-01-23 08:53:56.174836	2026-01-23 08:53:56.174836	2026-01-23 08:53:56.174836	\N	\N	f	\N	1	\N	\N	f	\N	f	\N
6	003-230126	3	5	Lote 2 - 003-230126	Lote 2 liberado para Empresa teste. Inclui 3 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-23 20:17:24.202634	2026-01-23 20:17:24.202634	2026-01-24 08:58:50.835091	\N	\N	f	\N	2	2026-01-24 08:59:08.983151-03	\N	f	\N	f	\N
7	004-230126	\N	\N	Lote 2 - 004-230126	Lote 2 liberado para RLGERE. Inclui 3 funcionário(s) elegíveis.	completo	concluido	\N	2026-01-23 20:18:55.452256	2026-01-23 20:18:55.452256	2026-01-24 08:58:50.835091	9	\N	f	\N	2	2026-01-24 08:59:09.022113-03	\N	f	\N	f	\N
8	001-240126	3	5	Lote 3 - 001-240126	Lote 3 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.	completo	concluido	04703084945	2026-01-24 09:25:56.383686	2026-01-24 09:25:56.383686	2026-01-24 09:25:56.383686	\N	\N	f	\N	3	2026-01-24 09:27:20.012461-03	\N	f	\N	f	\N
9	001-250126	3	5	Lote 4 - 001-250126	Lote 4 liberado para Empresa teste. Inclui 2 funcionário(s) elegíveis.	completo	ativo	04703084945	2026-01-25 07:55:22.365434	2026-01-25 07:55:22.365434	2026-01-25 07:55:22.365434	\N	\N	f	\N	4	\N	\N	f	\N	f	\N
10	002-250126	4	6	Lote 1 - 002-250126	Lote 1 liberado para Empresa Clinca Fonalq. Inclui 2 funcionário(s) elegíveis.	completo	concluido	95076358075	2026-01-25 13:50:38.657179	2026-01-25 13:50:38.657179	2026-01-25 13:50:38.657179	\N	\N	f	\N	1	2026-01-25 13:53:27.878525-03	\N	f	\N	f	\N
11	003-250126	\N	\N	Lote 3 - 003-250126	Lote 3 liberado para Entidade Final. Inclui 2 funcionário(s) elegíveis.	completo	concluido	26409186053	2026-01-25 13:57:37.300908	2026-01-25 13:57:37.300908	2026-01-25 13:57:37.300908	13	\N	f	\N	3	2026-01-25 13:59:36.241706-03	\N	f	\N	f	\N
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
1	RLS_POLICY	Always match policy name with table name	-- WRONG:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON funcionarios;\n\n-- CORRECT:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;	2026-01-29 20:40:25.663731
2	RLS_POLICY	Use safe_drop_policy() function in migrations	-- SAFE (validates before dropping):\nSELECT safe_drop_policy('avaliacoes_own_select', 'avaliacoes');\n\n-- This will fail if policy name does not match table:\nSELECT safe_drop_policy('avaliacoes_own_select', 'funcionarios');\n-- ERROR: Policy name does not match table	2026-01-29 20:40:25.663731
3	RLS_POLICY	Policy naming convention: <table>_<perfil>_<action>	avaliacoes_own_select    -- funcionario SELECT on avaliacoes\navaliacoes_rh_clinica    -- RH SELECT on avaliacoes\nlotes_emissor_select     -- emissor SELECT on lotes_avaliacao\nempresas_block_admin     -- RESTRICTIVE blocking admin	2026-01-29 20:40:25.663731
\.


--
-- Data for Name: notificacoes_admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacoes_admin (id, tipo, mensagem, lote_id, visualizada, criado_em) FROM stdin;
1	erro_emissao_auto	Erro na emissão imediata do lote 7: coluna "emitido_em" não existe	7	f	2026-01-24 08:10:48.679894-03
2	falha_emissao_imediata	Falha na emissão imediata do lote 7 (via recalcularStatusLotePorId)	7	f	2026-01-24 08:10:48.695852-03
3	erro_persistencia_pos_emissao	Laudo 1 gerado, mas falha ao persistir marcação/auditoria para lote 6: relação "auditoria_laudos" não existe	6	f	2026-01-24 08:39:42.625163-03
4	erro_persistencia_pos_emissao	Laudo 2 gerado, mas falha ao persistir marcação/auditoria para lote 7: relação "auditoria_laudos" não existe	7	f	2026-01-24 08:39:46.379701-03
17	erro_emissao_auto	Erro na emissão imediata do lote 7: Não é permitido modificar laudos já emitidos. Laudo ID: 7	7	f	2026-01-29 03:11:30.404988-03
18	erro_emissao_auto	Erro na emissão imediata do lote 7: current transaction is aborted, commands ignored until end of transaction block	7	f	2026-01-29 03:18:09.38148-03
19	fix_legacy_emissor_failed	Falha ao atualizar laudos emitidos com emissor 00000000000: Não é permitido modificar laudos já emitidos. Laudo ID: 7	\N	f	2026-01-29 06:54:49.636719-03
20	emissor_legacy_detectado	Laudo 7 (lote 7) possui emissor legado 00000000000 e já foi emitido — intervenção manual necessária	7	f	2026-01-29 06:58:21.190584-03
21	emissor_legacy_detectado	Laudo 2 (lote 2) possui emissor legado 00000000000 e já foi emitido — intervenção manual necessária	2	f	2026-01-29 06:58:21.190584-03
22	emissor_legacy_detectado	Laudo 3 (lote 3) possui emissor legado 00000000000 e já foi emitido — intervenção manual necessária	3	f	2026-01-29 06:58:21.190584-03
23	emissor_legacy_detectado	Laudo 4 (lote 4) possui emissor legado 00000000000 e já foi emitido — intervenção manual necessária	4	f	2026-01-29 06:58:21.190584-03
24	erro_emissao_auto	Erro na emissão imediata do lote 5: current transaction is aborted, commands ignored until end of transaction block	5	f	2026-01-29 07:17:05.997794-03
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagamentos (id, contratante_id, valor, metodo, status, plataforma_id, plataforma_nome, dados_adicionais, data_pagamento, data_confirmacao, comprovante_path, observacoes, criado_em, atualizado_em, numero_parcelas, recibo_url, recibo_numero, detalhes_parcelas, numero_funcionarios, valor_por_funcionario, contrato_id, idempotency_key, external_transaction_id, provider_event_id) FROM stdin;
1	9	1000.00	pix	pago	\N	simulador	\N	2026-01-23 01:15:19.065081	\N	\N	\N	2026-01-23 01:13:16.944546	2026-01-23 01:13:16.944546	1	\N	\N	\N	\N	\N	10	\N	\N	\N
2	10	5000.00	boleto	pago	\N	simulador	\N	2026-01-23 03:08:28.852137	\N	\N	\N	2026-01-23 03:08:28.049228	2026-01-23 03:08:28.049228	5	\N	\N	[{"pago": true, "valor": 1000, "numero": 1, "status": "pago", "data_pagamento": "2026-01-23T06:08:28.862Z", "data_vencimento": "2026-01-23"}, {"pago": false, "valor": 1000, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-02-23"}, {"pago": false, "valor": 1000, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-23"}, {"pago": false, "valor": 1000, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-23"}, {"pago": false, "valor": 1000, "numero": 5, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-05-23"}]	\N	\N	34	\N	\N	\N
5	13	700.00	pix	pago	\N	simulador	\N	2026-01-25 09:57:55.073478	\N	\N	\N	2026-01-25 09:57:54.482853	2026-01-25 09:57:54.482853	1	\N	\N	\N	\N	\N	40	\N	\N	\N
6	14	6250.00	boleto	pago	\N	simulador	\N	2026-01-25 10:02:44.45957	\N	\N	\N	2026-01-25 10:02:43.90459	2026-01-25 10:02:43.90459	5	\N	\N	[{"pago": true, "valor": 1250, "numero": 1, "status": "pago", "data_pagamento": "2026-01-25T13:02:44.465Z", "data_vencimento": "2026-01-25"}, {"pago": false, "valor": 1250, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-02-25"}, {"pago": false, "valor": 1250, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-25"}, {"pago": false, "valor": 1250, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-25"}, {"pago": false, "valor": 1250, "numero": 5, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-05-25"}]	\N	\N	42	\N	\N	\N
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
1	read:avaliacoes:own	avaliacoes	read	Ler prÃƒÂ³prias avaliaÃƒÂ§ÃƒÂµes	2026-01-22 21:28:35.443662
2	write:avaliacoes:own	avaliacoes	write	Responder prÃƒÂ³prias avaliaÃƒÂ§ÃƒÂµes	2026-01-22 21:28:35.443662
3	read:avaliacoes:clinica	avaliacoes	read	Ler avaliaÃƒÂ§ÃƒÂµes da clÃƒÂ­nica	2026-01-22 21:28:35.443662
4	manage:avaliacoes	avaliacoes	manage	Gerenciar todas avaliaÃƒÂ§ÃƒÂµes	2026-01-22 21:28:35.443662
5	read:funcionarios:own	funcionarios	read	Ler prÃƒÂ³prios dados	2026-01-22 21:28:35.443662
6	write:funcionarios:own	funcionarios	write	Editar prÃƒÂ³prios dados	2026-01-22 21:28:35.443662
7	read:funcionarios:clinica	funcionarios	read	Ler funcionÃƒÂ¡rios da clÃƒÂ­nica	2026-01-22 21:28:35.443662
8	write:funcionarios:clinica	funcionarios	write	Editar funcionÃƒÂ¡rios da clÃƒÂ­nica	2026-01-22 21:28:35.443662
9	manage:funcionarios	funcionarios	manage	Gerenciar todos funcionÃƒÂ¡rios	2026-01-22 21:28:35.443662
10	read:empresas:clinica	empresas	read	Ler empresas da clÃƒÂ­nica	2026-01-22 21:28:35.443662
11	write:empresas:clinica	empresas	write	Editar empresas da clÃƒÂ­nica	2026-01-22 21:28:35.443662
12	manage:empresas	empresas	manage	Gerenciar todas empresas	2026-01-22 21:28:35.443662
13	read:lotes:clinica	lotes	read	Ler lotes da clÃƒÂ­nica	2026-01-22 21:28:35.443662
14	write:lotes:clinica	lotes	write	Criar/editar lotes da clÃƒÂ­nica	2026-01-22 21:28:35.443662
15	manage:lotes	lotes	manage	Gerenciar todos lotes	2026-01-22 21:28:35.443662
16	read:laudos	laudos	read	Ler laudos disponÃƒÂ­veis	2026-01-22 21:28:35.443662
17	write:laudos	laudos	write	Emitir e editar laudos	2026-01-22 21:28:35.443662
18	manage:laudos	laudos	manage	Gerenciar todos laudos	2026-01-22 21:28:35.443662
19	manage:clinicas	clinicas	manage	Gerenciar clÃƒÂ­nicas	2026-01-22 21:28:35.443662
63	read:avaliacoes:entidade	avaliacoes	read	Ler avaliacoes de funcionarios da entidade	2026-01-29 18:59:05.857178
64	read:funcionarios:entidade	funcionarios	read	Ler funcionarios da entidade	2026-01-29 18:59:05.857178
65	write:funcionarios:entidade	funcionarios	write	Criar/editar funcionarios da entidade	2026-01-29 18:59:05.857178
66	read:lotes:entidade	lotes	read	Ler lotes de avaliacao da entidade	2026-01-29 18:59:05.857178
67	write:lotes:entidade	lotes	write	Criar/editar lotes de avaliacao da entidade	2026-01-29 18:59:05.857178
68	read:laudos:entidade	laudos	read	Visualizar laudos de funcionarios da entidade	2026-01-29 18:59:05.857178
69	read:contratante:own	contratantes	read	Ler dados da propria entidade	2026-01-29 18:59:05.857178
70	write:contratante:own	contratantes	write	Editar dados da propria entidade	2026-01-29 18:59:05.857178
71	manage:rh	rh	manage	Manage RH settings	2026-01-29 19:12:56.9121
72	manage:admins	admins	manage	Manage admin users	2026-01-29 19:12:56.9121
\.


--
-- Data for Name: planos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.planos (id, tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, created_at, updated_at, caracteristicas) FROM stdin;
4	personalizado	Personalizado	Para todas as empresas	\N	\N	\N	t	2026-01-22 22:26:35.208206	2026-01-22 22:26:35.208206	["Setup incluído","Suporte"]
2	personalizado	Personalizado	Para avaliação de risco psicossocial.	\N	0.00	\N	t	2026-01-27 18:23:18.888412	2026-01-27 18:23:18.888412	["Entre em contato."]
\.


--
-- Data for Name: policy_expression_backups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policy_expression_backups (id, table_name, policy_name, policy_type, policy_expression, backed_up_at, restored_at) FROM stdin;
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
1	1	1	9	REC-2026-00001	2026-01-23	2027-01-22	100	1000.00	\N	pix	1	\N	\N	\N	storage/recibos/REC-2026-00001_parcela_1.txt	RECIBO DE PAGAMENTO\nREC-2026-00001\n\nCONTRATANTE:\nNome: RLGERE\nCNPJ: 02494916000170\nEmail: ouoiu@jiouio.com\n\nCONTRATO:\nData de Contratação: 23/01/2026\nPlano: Personalizado - personalizado\nValor Total: R$ 1.000,00\nFuncionários Cobertos: 100\n\nPAGAMENTO:\nMétodo: pix\nParcela: 1 / 1\nValor da Parcela: R$ 1.000,00\nData de Vencimento: 23/01/2026\nData de Pagamento: 23/01/2026\n\nStatus: PAGO\n\nGerado em: 24/01/2026, 21:49:04	87545772920	t	2026-01-24 21:49:04.086	2026-01-24 21:49:04.089889	\N	\N	\N	\N	t	\N
4	34	2	10	REC-2026-00002	2026-01-23	2027-01-22	1	5000.00	\N	boleto	5	\N	\N	\N	storage/recibos/REC-2026-00002_parcela_1.txt	RECIBO DE PAGAMENTO\nREC-2026-00002\n\nCONTRATANTE:\nNome: SERVMEDOcip\nCNPJ: 09110380000191\nEmail: jiiohoi@hiuhiu.com\n\nCONTRATO:\nData de Contratação: 23/01/2026\nPlano: null - \nValor Total: R$ 5.000,00\nFuncionários Cobertos: 1\n\nPAGAMENTO:\nMétodo: boleto\nParcela: 1 / 5\nValor da Parcela: R$ 1.000,00\nData de Vencimento: 22/01/2026\nData de Pagamento: 23/01/2026\n\nStatus: PAGO\n\nGerado em: 24/01/2026, 23:48:02	04703084945	t	2026-01-24 23:48:02.809	2026-01-24 23:48:02.813316	\N	8de95c6bfc81f4c36c66d92e444791d5a2bde2b0fc24515dc6fd210f7d324a1b	\N	\N	t	\N
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
22	2	1	Q1	50	2026-01-23 20:00:30.056871
23	2	1	Q2	75	2026-01-23 20:00:30.275471
24	2	1	Q3	50	2026-01-23 20:00:30.736039
25	2	1	Q9	50	2026-01-23 20:00:30.925317
26	2	2	Q13	50	2026-01-23 20:00:31.084702
27	2	2	Q17	25	2026-01-23 20:00:31.370246
28	2	2	Q18	25	2026-01-23 20:00:31.541342
29	2	2	Q19	25	2026-01-23 20:00:31.727587
30	3	1	Q1	75	2026-01-23 20:17:56.598241
31	3	1	Q2	50	2026-01-23 20:17:56.922141
32	3	1	Q3	75	2026-01-23 20:17:57.20687
33	3	1	Q9	50	2026-01-23 20:17:57.639329
34	3	2	Q13	25	2026-01-23 20:17:57.850984
35	3	2	Q17	0	2026-01-23 20:17:58.294555
36	3	2	Q18	0	2026-01-23 20:17:58.498759
37	3	2	Q19	25	2026-01-23 20:17:58.730457
38	3	3	Q20	50	2026-01-23 20:17:59.123081
39	3	3	Q21	75	2026-01-23 20:17:59.497966
40	3	3	Q23	75	2026-01-23 20:17:59.666908
41	3	3	Q25	100	2026-01-23 20:17:59.842893
42	3	3	Q26	100	2026-01-23 20:17:59.997753
43	3	3	Q28	75	2026-01-23 20:18:00.190673
44	3	4	Q31	75	2026-01-23 20:18:00.396701
45	3	4	Q32	50	2026-01-23 20:18:00.631231
46	3	4	Q33	50	2026-01-23 20:18:01.006118
47	3	4	Q34	100	2026-01-23 20:18:01.472929
48	3	5	Q35	25	2026-01-23 20:18:01.897229
49	3	5	Q38	25	2026-01-23 20:18:02.093551
50	3	5	Q41	0	2026-01-23 20:18:02.335884
51	3	6	Q43	75	2026-01-23 20:18:02.76183
52	3	6	Q45	25	2026-01-23 20:18:03.182647
53	3	7	Q48	50	2026-01-23 20:18:03.559694
54	3	7	Q52	100	2026-01-23 20:18:04.209076
55	3	7	Q55	50	2026-01-23 20:18:04.789104
56	3	8	Q56	100	2026-01-23 20:18:05.268406
57	3	8	Q57	75	2026-01-23 20:18:05.538671
58	3	8	Q58	25	2026-01-23 20:18:06.217741
59	3	9	Q59	25	2026-01-23 20:18:06.403303
60	3	9	Q61	25	2026-01-23 20:18:06.62795
61	3	9	Q62	0	2026-01-23 20:18:06.880566
62	3	9	Q64	25	2026-01-23 20:18:07.199114
63	3	10	Q65	0	2026-01-23 20:18:07.425908
64	3	10	Q66	50	2026-01-23 20:18:07.666927
65	3	10	Q68	50	2026-01-23 20:18:07.888284
66	3	10	Q70	25	2026-01-23 20:18:08.286475
67	6	1	Q1	50	2026-01-23 20:19:13.102723
68	6	1	Q2	100	2026-01-23 20:19:13.355804
69	6	1	Q3	75	2026-01-23 20:19:13.667454
70	6	1	Q9	75	2026-01-23 20:19:13.851006
71	6	2	Q13	25	2026-01-23 20:19:14.1141
72	6	2	Q17	25	2026-01-23 20:19:14.402269
73	6	2	Q18	0	2026-01-23 20:19:14.781958
74	6	2	Q19	75	2026-01-23 20:19:15.462891
75	6	3	Q20	100	2026-01-23 20:19:15.892823
76	6	3	Q21	75	2026-01-23 20:19:16.134254
77	6	3	Q23	50	2026-01-23 20:19:16.383385
78	6	3	Q25	25	2026-01-23 20:19:16.663562
79	6	3	Q26	25	2026-01-23 20:19:16.851213
80	6	3	Q28	75	2026-01-23 20:19:17.085315
81	6	4	Q31	75	2026-01-23 20:19:17.348446
82	6	4	Q32	50	2026-01-23 20:19:18.958314
83	6	4	Q33	75	2026-01-23 20:19:19.293576
84	6	4	Q34	50	2026-01-23 20:19:19.606973
85	6	5	Q35	50	2026-01-23 20:19:19.795499
86	6	5	Q38	75	2026-01-23 20:19:20.065293
87	6	5	Q41	100	2026-01-23 20:19:20.384252
88	6	6	Q43	75	2026-01-23 20:19:20.643933
89	6	6	Q45	75	2026-01-23 20:19:20.823743
90	6	7	Q48	50	2026-01-23 20:19:21.058431
91	6	7	Q52	50	2026-01-23 20:19:21.27
92	6	7	Q55	0	2026-01-23 20:19:21.93862
93	6	8	Q56	0	2026-01-23 20:19:22.212986
94	6	8	Q57	25	2026-01-23 20:19:22.512745
95	6	8	Q58	50	2026-01-23 20:19:22.809184
96	6	9	Q59	50	2026-01-23 20:19:23.002216
97	6	9	Q61	75	2026-01-23 20:19:23.301433
98	6	9	Q62	100	2026-01-23 20:19:23.612312
99	6	9	Q64	75	2026-01-23 20:19:23.944867
100	6	10	Q65	50	2026-01-23 20:19:24.25225
101	6	10	Q66	50	2026-01-23 20:19:24.444756
102	6	10	Q68	100	2026-01-23 20:19:24.672006
103	6	10	Q70	100	2026-01-23 20:19:25.013432
104	9	1	Q1	100	2026-01-24 09:26:37.317928
105	9	1	Q2	75	2026-01-24 09:26:37.680487
106	9	1	Q3	50	2026-01-24 09:26:37.979239
107	9	1	Q9	50	2026-01-24 09:26:38.195106
108	9	2	Q13	75	2026-01-24 09:26:38.501058
109	9	2	Q17	75	2026-01-24 09:26:38.703333
110	9	2	Q18	100	2026-01-24 09:26:39.03118
111	9	2	Q19	100	2026-01-24 09:26:39.245704
112	9	3	Q20	75	2026-01-24 09:26:39.459933
113	9	3	Q21	50	2026-01-24 09:26:39.792471
114	9	3	Q23	50	2026-01-24 09:26:40.106576
115	9	3	Q25	25	2026-01-24 09:26:40.413497
116	9	3	Q26	25	2026-01-24 09:26:40.719669
117	9	3	Q28	50	2026-01-24 09:26:40.966383
118	9	4	Q31	50	2026-01-24 09:26:41.154336
119	9	4	Q32	75	2026-01-24 09:26:41.407552
120	9	4	Q33	75	2026-01-24 09:26:41.605889
121	9	4	Q34	100	2026-01-24 09:26:41.853105
122	9	5	Q35	75	2026-01-24 09:26:42.254658
123	9	5	Q38	50	2026-01-24 09:26:42.57187
124	9	5	Q41	75	2026-01-24 09:26:42.895345
125	9	6	Q43	100	2026-01-24 09:26:43.170597
126	9	6	Q45	75	2026-01-24 09:26:43.600058
127	9	7	Q48	50	2026-01-24 09:26:43.887262
128	9	7	Q52	25	2026-01-24 09:26:44.192578
129	9	7	Q55	50	2026-01-24 09:26:44.487576
130	9	8	Q56	50	2026-01-24 09:26:44.6743
131	9	8	Q57	75	2026-01-24 09:26:44.945975
132	9	8	Q58	100	2026-01-24 09:26:45.245053
133	9	9	Q59	75	2026-01-24 09:26:45.555382
134	9	9	Q61	50	2026-01-24 09:26:45.849888
135	9	9	Q62	50	2026-01-24 09:26:46.039269
136	9	9	Q64	25	2026-01-24 09:26:46.304352
137	9	10	Q65	0	2026-01-24 09:26:46.595144
138	9	10	Q66	25	2026-01-24 09:26:46.927918
139	9	10	Q68	75	2026-01-24 09:26:47.201538
140	9	10	Q70	75	2026-01-24 09:26:47.563401
162	13	1	Q1	75	2026-01-25 13:51:38.260192
163	13	1	Q2	100	2026-01-25 13:51:38.5298
164	13	1	Q3	75	2026-01-25 13:51:38.867042
165	13	1	Q9	50	2026-01-25 13:51:39.191786
166	13	2	Q13	50	2026-01-25 13:51:39.424606
167	13	2	Q17	25	2026-01-25 13:51:39.722332
168	13	2	Q18	25	2026-01-25 13:51:39.927412
169	13	2	Q19	50	2026-01-25 13:51:40.170326
170	13	3	Q20	50	2026-01-25 13:51:40.375644
171	13	3	Q21	75	2026-01-25 13:51:40.658342
172	13	3	Q23	100	2026-01-25 13:51:41.018048
173	13	3	Q25	75	2026-01-25 13:51:41.315531
174	13	3	Q26	50	2026-01-25 13:51:41.612361
175	13	3	Q28	25	2026-01-25 13:51:41.887212
176	13	4	Q31	25	2026-01-25 13:51:42.086744
177	13	4	Q32	75	2026-01-25 13:51:42.360892
178	13	4	Q33	75	2026-01-25 13:51:42.595412
179	13	4	Q34	25	2026-01-25 13:51:43.749576
180	13	5	Q35	0	2026-01-25 13:51:43.976782
181	13	5	Q38	75	2026-01-25 13:51:44.853106
182	13	5	Q41	100	2026-01-25 13:51:45.247115
183	13	6	Q43	50	2026-01-25 13:51:45.766683
184	13	6	Q45	50	2026-01-25 13:51:45.93631
185	13	7	Q48	25	2026-01-25 13:51:46.267859
186	13	7	Q52	50	2026-01-25 13:51:46.409577
187	13	7	Q55	75	2026-01-25 13:51:46.634088
188	13	8	Q56	100	2026-01-25 13:51:46.965254
189	13	8	Q57	100	2026-01-25 13:51:47.15678
190	13	8	Q58	25	2026-01-25 13:51:47.733757
191	13	9	Q59	0	2026-01-25 13:51:48.294933
192	13	9	Q61	0	2026-01-25 13:51:48.46024
193	13	9	Q62	50	2026-01-25 13:51:51.200385
194	13	9	Q64	100	2026-01-25 13:51:52.186882
195	13	10	Q65	75	2026-01-25 13:51:52.43787
196	13	10	Q66	75	2026-01-25 13:51:52.662277
197	13	10	Q68	50	2026-01-25 13:51:52.927843
198	13	10	Q70	50	2026-01-25 13:51:53.097197
199	15	1	Q1	50	2026-01-25 13:59:21.228818
200	15	1	Q2	75	2026-01-25 13:59:21.414212
201	15	1	Q3	50	2026-01-25 13:59:21.636951
202	15	1	Q9	50	2026-01-25 13:59:21.829354
203	15	2	Q13	75	2026-01-25 13:59:22.162136
204	15	2	Q17	75	2026-01-25 13:59:22.353652
205	15	2	Q18	100	2026-01-25 13:59:22.61245
206	15	2	Q19	100	2026-01-25 13:59:22.792094
207	15	3	Q20	75	2026-01-25 13:59:23.068358
208	15	3	Q21	75	2026-01-25 13:59:23.247618
209	15	3	Q23	50	2026-01-25 13:59:23.466067
210	15	3	Q25	0	2026-01-25 13:59:24.327746
211	15	3	Q26	0	2026-01-25 13:59:24.6079
212	15	3	Q28	25	2026-01-25 13:59:24.849534
213	15	4	Q31	25	2026-01-25 13:59:24.999042
214	15	4	Q32	50	2026-01-25 13:59:25.302864
215	15	4	Q33	75	2026-01-25 13:59:25.840263
216	15	4	Q34	100	2026-01-25 13:59:26.225956
217	15	5	Q35	100	2026-01-25 13:59:26.428661
218	15	5	Q38	75	2026-01-25 13:59:26.65139
219	15	5	Q41	75	2026-01-25 13:59:26.851402
220	15	6	Q43	50	2026-01-25 13:59:27.057278
221	15	6	Q45	25	2026-01-25 13:59:27.441239
222	15	7	Q48	50	2026-01-25 13:59:27.793788
223	15	7	Q52	75	2026-01-25 13:59:28.265084
224	15	7	Q55	75	2026-01-25 13:59:28.428508
225	15	8	Q56	100	2026-01-25 13:59:28.728459
226	15	8	Q57	75	2026-01-25 13:59:29.089846
227	15	8	Q58	50	2026-01-25 13:59:29.452574
228	15	9	Q59	25	2026-01-25 13:59:29.725358
229	15	9	Q61	25	2026-01-25 13:59:29.976536
230	15	9	Q62	25	2026-01-25 13:59:30.158527
231	15	9	Q64	0	2026-01-25 13:59:30.390691
232	15	10	Q65	25	2026-01-25 13:59:30.723327
233	15	10	Q66	50	2026-01-25 13:59:31.027888
234	15	10	Q68	75	2026-01-25 13:59:31.31962
235	15	10	Q70	100	2026-01-25 13:59:31.881124
589	16	1	Q1	25	2026-01-29 05:42:00.479345
590	16	1	Q2	100	2026-01-29 05:42:00.717503
591	16	1	Q3	100	2026-01-29 05:42:00.941956
592	16	1	Q9	75	2026-01-29 05:42:01.251508
593	16	2	Q13	50	2026-01-29 05:42:01.634471
594	16	2	Q17	75	2026-01-29 05:42:01.946058
595	16	2	Q18	75	2026-01-29 05:42:02.250754
596	16	2	Q19	100	2026-01-29 05:42:02.523824
597	16	3	Q20	100	2026-01-29 05:42:02.711618
598	16	3	Q21	75	2026-01-29 05:42:02.991874
599	16	3	Q23	50	2026-01-29 05:42:03.330221
600	16	3	Q25	75	2026-01-29 05:42:03.673989
601	16	3	Q26	75	2026-01-29 05:42:03.898874
602	16	3	Q28	100	2026-01-29 05:42:04.229382
603	16	4	Q31	75	2026-01-29 05:42:04.5389
604	16	4	Q32	75	2026-01-29 05:42:04.726807
605	16	4	Q33	75	2026-01-29 05:42:04.900174
606	16	4	Q34	50	2026-01-29 05:42:05.155921
607	16	5	Q35	50	2026-01-29 05:42:05.35955
608	16	5	Q38	25	2026-01-29 05:42:05.596475
609	16	5	Q41	25	2026-01-29 05:42:05.821741
610	16	6	Q43	0	2026-01-29 05:42:06.396026
611	16	6	Q45	0	2026-01-29 05:42:06.602183
612	16	7	Q48	0	2026-01-29 05:42:06.796376
613	16	7	Q52	25	2026-01-29 05:42:07.030169
614	16	7	Q55	50	2026-01-29 05:42:07.726385
615	16	8	Q56	75	2026-01-29 05:42:08.165198
616	16	8	Q57	75	2026-01-29 05:42:08.381674
617	16	8	Q58	100	2026-01-29 05:42:08.587197
618	16	9	Q59	100	2026-01-29 05:42:08.776169
619	16	9	Q61	75	2026-01-29 05:42:09.05119
620	16	9	Q62	50	2026-01-29 05:42:09.41237
621	16	9	Q64	75	2026-01-29 05:42:09.68783
622	16	10	Q65	75	2026-01-29 05:42:09.965784
623	16	10	Q66	100	2026-01-29 05:42:10.31684
624	16	10	Q68	75	2026-01-29 05:42:11.005269
625	16	10	Q70	75	2026-01-29 05:42:11.974321
626	19	1	Q1	50	2026-01-29 06:40:01.952629
627	19	1	Q2	100	2026-01-29 06:40:02.073992
628	19	1	Q3	75	2026-01-29 06:40:02.383237
629	19	1	Q9	75	2026-01-29 06:40:02.592064
630	19	2	Q13	50	2026-01-29 06:40:02.900288
631	19	2	Q17	50	2026-01-29 06:40:03.101379
632	19	2	Q18	25	2026-01-29 06:40:03.41171
633	19	2	Q19	25	2026-01-29 06:40:03.655406
634	19	3	Q20	50	2026-01-29 06:40:03.986728
635	19	3	Q21	75	2026-01-29 06:40:04.442342
636	19	3	Q23	75	2026-01-29 06:40:04.635714
637	19	3	Q25	100	2026-01-29 06:40:04.887488
638	19	3	Q26	100	2026-01-29 06:40:05.080818
639	19	3	Q28	75	2026-01-29 06:40:05.314862
640	19	4	Q31	75	2026-01-29 06:40:05.527599
641	19	4	Q32	50	2026-01-29 06:40:05.789559
642	19	4	Q33	50	2026-01-29 06:40:06.0005
643	19	4	Q34	25	2026-01-29 06:40:06.311491
644	19	5	Q35	25	2026-01-29 06:40:06.520939
645	19	5	Q38	0	2026-01-29 06:40:06.774126
646	19	5	Q41	0	2026-01-29 06:40:06.987072
647	19	6	Q43	25	2026-01-29 06:40:07.295114
648	19	6	Q45	0	2026-01-29 06:40:07.763518
649	19	7	Q48	25	2026-01-29 06:40:08.041723
650	19	7	Q52	100	2026-01-29 06:40:08.522149
651	19	7	Q55	100	2026-01-29 06:40:08.758188
652	19	8	Q56	0	2026-01-29 06:40:09.228377
653	19	8	Q57	0	2026-01-29 06:40:09.454591
654	19	8	Q58	25	2026-01-29 06:40:09.698811
655	19	9	Q59	75	2026-01-29 06:40:09.914195
656	19	9	Q61	100	2026-01-29 06:40:10.339663
657	19	9	Q62	75	2026-01-29 06:40:10.577864
658	19	9	Q64	25	2026-01-29 06:40:10.993957
659	19	10	Q65	25	2026-01-29 06:40:11.227665
660	19	10	Q66	0	2026-01-29 06:40:11.473205
661	19	10	Q68	50	2026-01-29 06:40:12.130543
662	19	10	Q70	50	2026-01-29 06:40:13.257715
663	24	1	Q1	50	2026-01-29 09:20:44.801369
664	24	1	Q2	75	2026-01-29 09:20:44.972477
665	24	1	Q3	75	2026-01-29 09:20:45.278855
666	24	1	Q9	75	2026-01-29 09:20:45.501497
667	24	2	Q13	50	2026-01-29 09:20:45.776238
668	24	2	Q17	50	2026-01-29 09:20:45.958426
669	24	2	Q18	75	2026-01-29 09:20:46.287844
670	24	2	Q19	50	2026-01-29 09:20:46.561426
671	24	3	Q20	50	2026-01-29 09:20:46.850869
672	24	3	Q21	25	2026-01-29 09:20:47.146562
673	24	3	Q23	25	2026-01-29 09:20:47.345118
674	24	3	Q25	0	2026-01-29 09:20:47.579971
675	24	3	Q26	0	2026-01-29 09:20:47.759639
676	24	3	Q28	0	2026-01-29 09:20:47.980792
677	24	4	Q31	25	2026-01-29 09:20:48.224959
678	24	4	Q32	50	2026-01-29 09:20:48.629231
679	24	4	Q33	50	2026-01-29 09:20:48.808554
680	24	4	Q34	75	2026-01-29 09:20:49.053401
681	24	5	Q35	50	2026-01-29 09:20:49.369231
682	24	5	Q38	75	2026-01-29 09:20:49.671685
683	24	5	Q41	50	2026-01-29 09:20:49.952668
684	24	6	Q43	75	2026-01-29 09:20:50.425877
685	24	6	Q45	75	2026-01-29 09:20:50.610349
686	24	7	Q48	100	2026-01-29 09:20:50.897453
687	24	7	Q52	75	2026-01-29 09:20:51.325431
688	24	7	Q55	50	2026-01-29 09:20:51.643372
689	24	8	Q56	25	2026-01-29 09:20:51.962616
690	24	8	Q57	50	2026-01-29 09:20:52.2904
691	24	8	Q58	75	2026-01-29 09:20:52.602612
692	24	9	Q59	100	2026-01-29 09:20:52.874767
693	24	9	Q61	100	2026-01-29 09:20:53.150581
694	24	9	Q62	100	2026-01-29 09:20:53.40117
695	24	9	Q64	75	2026-01-29 09:20:53.687902
696	24	10	Q65	75	2026-01-29 09:20:53.895663
697	24	10	Q66	100	2026-01-29 09:20:54.521985
698	24	10	Q68	50	2026-01-29 09:20:55.72875
699	24	10	Q70	75	2026-01-29 09:20:56.507164
700	25	1	Q1	50	2026-01-29 09:33:50.351651
701	25	1	Q2	100	2026-01-29 09:33:50.473297
702	25	1	Q3	75	2026-01-29 09:33:50.726699
703	25	1	Q9	75	2026-01-29 09:33:50.914306
704	25	2	Q13	50	2026-01-29 09:33:51.217146
705	25	2	Q17	50	2026-01-29 09:33:51.441785
706	25	2	Q18	25	2026-01-29 09:33:51.733856
707	25	2	Q19	0	2026-01-29 09:33:52.024244
708	25	3	Q20	50	2026-01-29 09:33:53.07786
709	25	3	Q21	25	2026-01-29 09:33:53.3625
710	25	3	Q23	0	2026-01-29 09:33:53.646311
711	25	3	Q25	75	2026-01-29 09:33:53.955216
712	25	3	Q26	100	2026-01-29 09:33:54.222893
713	25	3	Q28	100	2026-01-29 09:33:54.421417
714	25	4	Q31	75	2026-01-29 09:33:54.652191
715	25	4	Q32	50	2026-01-29 09:33:54.901892
716	25	4	Q33	50	2026-01-29 09:33:55.079886
717	25	4	Q34	25	2026-01-29 09:33:55.354903
718	25	5	Q35	50	2026-01-29 09:33:55.640617
719	25	5	Q38	50	2026-01-29 09:33:55.87803
720	25	5	Q41	0	2026-01-29 09:33:56.388357
721	25	6	Q43	100	2026-01-29 09:33:56.667389
722	25	6	Q45	100	2026-01-29 09:33:56.933346
723	25	7	Q48	75	2026-01-29 09:33:57.165047
724	25	7	Q52	50	2026-01-29 09:33:57.419544
725	25	7	Q55	50	2026-01-29 09:33:57.59551
726	25	8	Q56	100	2026-01-29 09:33:57.875766
727	25	8	Q57	100	2026-01-29 09:33:58.308122
728	25	8	Q58	75	2026-01-29 09:33:58.541028
729	25	9	Q59	75	2026-01-29 09:33:58.773841
730	25	9	Q61	50	2026-01-29 09:33:59.078491
731	25	9	Q62	25	2026-01-29 09:33:59.338328
732	25	9	Q64	25	2026-01-29 09:33:59.562986
733	25	10	Q65	0	2026-01-29 09:33:59.8538
734	25	10	Q66	75	2026-01-29 09:34:00.161188
735	25	10	Q68	50	2026-01-29 09:34:00.707972
736	25	10	Q70	75	2026-01-29 09:34:01.014809
737	27	1	Q1	50	2026-01-29 10:07:36.901765
738	27	1	Q2	75	2026-01-29 10:07:36.991476
739	27	1	Q3	75	2026-01-29 10:07:37.17002
740	27	1	Q9	50	2026-01-29 10:07:37.450511
741	27	2	Q13	50	2026-01-29 10:07:37.652866
742	27	2	Q17	25	2026-01-29 10:07:37.932092
743	27	2	Q18	25	2026-01-29 10:07:38.127976
744	27	2	Q19	0	2026-01-29 10:07:38.384091
745	27	3	Q20	50	2026-01-29 10:07:38.888977
746	27	3	Q21	75	2026-01-29 10:07:39.006465
747	27	3	Q23	75	2026-01-29 10:07:39.211002
748	27	3	Q25	100	2026-01-29 10:07:39.515185
749	27	3	Q26	75	2026-01-29 10:07:39.766393
750	27	3	Q28	50	2026-01-29 10:07:40.198946
751	27	4	Q31	50	2026-01-29 10:07:40.384834
752	27	4	Q32	25	2026-01-29 10:07:40.607633
753	27	4	Q33	75	2026-01-29 10:07:40.937842
754	27	4	Q34	75	2026-01-29 10:07:41.188185
755	27	5	Q35	100	2026-01-29 10:07:41.530531
756	27	5	Q38	100	2026-01-29 10:07:41.724758
757	27	5	Q41	75	2026-01-29 10:07:41.99302
758	27	6	Q43	75	2026-01-29 10:07:42.207346
759	27	6	Q45	50	2026-01-29 10:07:42.470153
760	27	7	Q48	50	2026-01-29 10:07:42.692302
761	27	7	Q52	25	2026-01-29 10:07:42.946885
762	27	7	Q55	25	2026-01-29 10:07:43.08945
763	27	8	Q56	50	2026-01-29 10:07:43.361453
764	27	8	Q57	75	2026-01-29 10:07:43.836132
765	27	8	Q58	100	2026-01-29 10:07:44.068625
766	27	9	Q59	100	2026-01-29 10:07:44.285652
767	27	9	Q61	75	2026-01-29 10:07:44.543177
768	27	9	Q62	75	2026-01-29 10:07:44.730605
769	27	9	Q64	50	2026-01-29 10:07:44.972051
770	27	10	Q65	50	2026-01-29 10:07:45.174461
771	27	10	Q66	25	2026-01-29 10:07:45.419105
772	27	10	Q68	0	2026-01-29 10:07:45.892905
773	27	10	Q70	25	2026-01-29 10:07:47.083824
774	28	1	Q1	50	2026-01-29 10:30:30.439723
775	28	1	Q2	75	2026-01-29 10:30:30.630795
776	28	1	Q3	100	2026-01-29 10:30:30.954703
777	28	1	Q9	100	2026-01-29 10:30:31.162827
778	28	2	Q13	25	2026-01-29 10:30:31.504435
779	28	2	Q17	25	2026-01-29 10:30:31.73387
780	28	2	Q18	0	2026-01-29 10:30:32.265647
781	28	2	Q19	0	2026-01-29 10:30:32.497092
782	28	3	Q20	25	2026-01-29 10:30:32.800313
783	28	3	Q21	25	2026-01-29 10:30:33.003007
784	28	3	Q23	0	2026-01-29 10:30:33.252722
785	28	3	Q25	50	2026-01-29 10:30:33.597385
786	28	3	Q26	50	2026-01-29 10:30:33.815125
787	28	3	Q28	25	2026-01-29 10:30:34.050405
788	28	4	Q31	50	2026-01-29 10:30:34.298652
789	28	4	Q32	75	2026-01-29 10:30:34.581101
790	28	4	Q33	100	2026-01-29 10:30:35.036317
791	28	4	Q34	75	2026-01-29 10:30:35.341334
792	28	5	Q35	50	2026-01-29 10:30:35.657373
793	28	5	Q38	100	2026-01-29 10:30:36.143691
794	28	5	Q41	100	2026-01-29 10:30:36.272416
795	28	6	Q43	100	2026-01-29 10:30:36.473551
796	28	6	Q45	75	2026-01-29 10:30:36.836397
797	28	7	Q48	25	2026-01-29 10:30:37.377724
798	28	7	Q52	25	2026-01-29 10:30:37.520408
799	28	7	Q55	25	2026-01-29 10:30:37.72751
800	28	8	Q56	0	2026-01-29 10:30:37.957968
801	28	8	Q57	0	2026-01-29 10:30:38.163835
802	28	8	Q58	50	2026-01-29 10:30:38.474994
803	28	9	Q59	75	2026-01-29 10:30:38.899845
804	28	9	Q61	50	2026-01-29 10:30:39.114373
805	28	9	Q62	75	2026-01-29 10:30:39.405144
806	28	9	Q64	100	2026-01-29 10:30:39.690406
807	28	10	Q65	100	2026-01-29 10:30:39.913689
808	28	10	Q66	25	2026-01-29 10:30:40.198746
809	28	10	Q68	25	2026-01-29 10:30:40.461729
810	28	10	Q70	0	2026-01-29 10:30:40.723341
811	30	1	Q1	50	2026-01-29 10:46:43.016557
812	30	1	Q2	75	2026-01-29 10:46:43.202793
813	30	1	Q3	75	2026-01-29 10:46:43.339278
814	30	1	Q9	50	2026-01-29 10:46:43.618887
815	30	2	Q13	50	2026-01-29 10:46:43.781896
816	30	2	Q17	25	2026-01-29 10:46:44.263912
817	30	2	Q18	50	2026-01-29 10:46:44.607561
818	30	2	Q19	75	2026-01-29 10:46:44.906074
819	30	3	Q20	100	2026-01-29 10:46:45.257162
820	30	3	Q21	100	2026-01-29 10:46:45.396976
821	30	3	Q23	25	2026-01-29 10:46:45.884108
822	30	3	Q25	0	2026-01-29 10:46:46.129588
823	30	3	Q26	100	2026-01-29 10:46:47.013348
824	30	3	Q28	50	2026-01-29 10:46:47.298626
825	30	4	Q31	50	2026-01-29 10:46:47.496347
826	30	4	Q32	75	2026-01-29 10:46:48.023699
827	30	4	Q33	50	2026-01-29 10:46:48.416067
828	30	4	Q34	25	2026-01-29 10:46:48.8222
829	30	5	Q35	50	2026-01-29 10:46:49.181421
830	30	5	Q38	75	2026-01-29 10:46:49.599289
831	30	5	Q41	100	2026-01-29 10:46:49.933949
832	30	6	Q43	75	2026-01-29 10:46:50.180968
833	30	6	Q45	75	2026-01-29 10:46:50.402231
834	30	7	Q48	25	2026-01-29 10:46:50.792387
835	30	7	Q52	25	2026-01-29 10:46:51.019814
836	30	7	Q55	0	2026-01-29 10:46:51.321734
837	30	8	Q56	25	2026-01-29 10:46:51.611215
838	30	8	Q57	50	2026-01-29 10:46:51.95834
839	30	8	Q58	75	2026-01-29 10:46:52.273972
840	30	9	Q59	75	2026-01-29 10:46:52.495307
841	30	9	Q61	100	2026-01-29 10:46:52.760066
842	30	9	Q62	75	2026-01-29 10:46:53.040645
843	30	9	Q64	75	2026-01-29 10:46:53.232675
844	30	10	Q65	50	2026-01-29 10:46:53.476215
845	30	10	Q66	50	2026-01-29 10:46:53.728201
846	30	10	Q68	50	2026-01-29 10:46:53.875494
847	30	10	Q70	25	2026-01-29 10:46:54.114204
848	32	1	Q1	50	2026-01-29 11:19:09.675439
849	32	1	Q2	50	2026-01-29 11:19:10.010371
850	32	1	Q3	50	2026-01-29 11:19:10.213591
851	32	1	Q9	25	2026-01-29 11:19:10.474189
852	32	2	Q13	25	2026-01-29 11:19:10.664982
853	32	2	Q17	0	2026-01-29 11:19:10.906087
854	32	2	Q18	0	2026-01-29 11:19:11.097916
855	32	2	Q19	50	2026-01-29 11:19:11.356785
856	32	3	Q20	100	2026-01-29 11:19:12.276736
857	32	3	Q21	75	2026-01-29 11:19:12.673065
858	32	3	Q23	50	2026-01-29 11:19:13.070427
859	32	3	Q25	75	2026-01-29 11:19:13.301485
860	32	3	Q26	50	2026-01-29 11:19:13.717324
861	32	3	Q28	25	2026-01-29 11:19:13.961967
862	32	4	Q31	100	2026-01-29 11:19:14.437574
863	32	4	Q32	75	2026-01-29 11:19:14.83061
864	32	4	Q33	50	2026-01-29 11:19:15.05983
865	32	4	Q34	25	2026-01-29 11:19:15.451812
866	32	5	Q35	75	2026-01-29 11:19:15.708187
867	32	5	Q38	75	2026-01-29 11:19:15.946898
868	32	5	Q41	50	2026-01-29 11:19:16.171353
869	32	6	Q43	75	2026-01-29 11:19:16.408131
870	32	6	Q45	50	2026-01-29 11:19:16.652311
871	32	7	Q48	25	2026-01-29 11:19:17.013997
872	32	7	Q52	25	2026-01-29 11:19:17.21646
873	32	7	Q55	0	2026-01-29 11:19:17.582125
874	32	8	Q56	25	2026-01-29 11:19:17.909777
875	32	8	Q57	50	2026-01-29 11:19:18.331425
876	32	8	Q58	75	2026-01-29 11:19:18.577892
877	32	9	Q59	100	2026-01-29 11:19:18.866737
878	32	9	Q61	75	2026-01-29 11:19:19.138103
879	32	9	Q62	75	2026-01-29 11:19:19.332245
880	32	9	Q64	50	2026-01-29 11:19:19.570107
881	32	10	Q65	75	2026-01-29 11:19:19.922845
882	32	10	Q66	100	2026-01-29 11:19:20.249765
883	32	10	Q68	100	2026-01-29 11:19:20.516157
884	32	10	Q70	50	2026-01-29 11:19:20.889936
885	40	1	Q1	75	2026-01-29 13:33:12.294904
886	40	1	Q2	25	2026-01-29 13:33:13.289221
887	40	1	Q3	25	2026-01-29 13:33:13.712583
888	40	1	Q9	0	2026-01-29 13:33:14.215069
889	40	2	Q13	50	2026-01-29 13:33:14.691161
890	40	2	Q17	75	2026-01-29 13:33:15.122279
891	40	2	Q18	100	2026-01-29 13:33:15.585775
892	40	2	Q19	75	2026-01-29 13:33:16.025846
893	40	3	Q20	50	2026-01-29 13:33:16.498039
894	40	3	Q21	25	2026-01-29 13:33:17.013614
895	40	3	Q23	50	2026-01-29 13:33:17.455453
896	40	3	Q25	75	2026-01-29 13:33:18.165661
897	40	3	Q26	100	2026-01-29 13:33:18.66155
898	40	3	Q28	75	2026-01-29 13:34:47.203378
899	40	4	Q31	75	2026-01-29 13:34:47.759595
900	40	4	Q32	50	2026-01-29 13:34:48.231627
901	40	4	Q33	0	2026-01-29 13:34:49.12104
902	40	4	Q34	25	2026-01-29 13:34:49.758898
903	40	5	Q35	50	2026-01-29 13:34:50.217589
904	40	5	Q38	100	2026-01-29 13:34:50.873057
905	40	5	Q41	0	2026-01-29 13:34:51.60944
906	40	6	Q43	50	2026-01-29 13:34:52.447346
907	40	6	Q45	75	2026-01-29 13:34:53.096181
908	40	7	Q48	75	2026-01-29 13:34:54.104934
909	40	7	Q52	50	2026-01-29 13:34:54.70115
910	40	7	Q55	25	2026-01-29 13:34:55.524506
911	40	8	Q56	0	2026-01-29 13:34:56.626442
912	40	8	Q57	50	2026-01-29 13:34:57.641399
913	40	8	Q58	75	2026-01-29 13:34:58.243708
914	40	9	Q59	100	2026-01-29 13:34:58.91234
915	40	9	Q61	75	2026-01-29 13:35:00.592713
916	40	9	Q62	50	2026-01-29 13:35:01.441613
917	40	9	Q64	75	2026-01-29 13:35:02.312743
918	40	10	Q65	25	2026-01-29 13:35:03.142442
919	40	10	Q66	25	2026-01-29 13:35:03.818111
920	40	10	Q68	25	2026-01-29 13:35:04.485087
921	40	10	Q70	0	2026-01-29 13:35:06.663205
922	38	1	Q1	50	2026-01-29 14:09:14.03817
923	38	1	Q2	75	2026-01-29 14:09:14.853154
924	38	1	Q3	75	2026-01-29 14:09:15.512211
925	38	1	Q9	50	2026-01-29 14:09:15.960456
926	38	2	Q13	50	2026-01-29 14:09:30.27532
927	38	2	Q17	75	2026-01-29 14:09:30.75365
928	38	2	Q18	100	2026-01-29 14:09:31.284458
929	38	2	Q19	75	2026-01-29 14:09:31.976832
930	38	3	Q20	50	2026-01-29 14:09:32.476793
931	38	3	Q21	25	2026-01-29 14:09:33.079968
932	38	3	Q23	0	2026-01-29 14:09:33.641959
933	38	3	Q25	50	2026-01-29 14:09:46.766991
934	38	3	Q26	50	2026-01-29 14:09:47.537752
935	38	3	Q28	25	2026-01-29 14:09:48.059973
936	38	4	Q31	50	2026-01-29 14:09:48.659525
937	38	4	Q32	75	2026-01-29 14:09:49.131803
938	38	4	Q33	100	2026-01-29 14:09:49.7438
939	38	4	Q34	75	2026-01-29 14:09:50.223864
940	38	5	Q35	25	2026-01-29 14:09:50.997177
941	38	5	Q38	0	2026-01-29 14:09:51.558026
942	38	5	Q41	50	2026-01-29 14:10:07.278432
943	38	6	Q43	100	2026-01-29 14:10:07.937172
944	38	6	Q45	50	2026-01-29 14:10:08.646898
945	38	7	Q48	25	2026-01-29 14:10:09.311813
946	38	7	Q52	0	2026-01-29 14:10:10.037862
947	38	7	Q55	100	2026-01-29 14:10:10.93955
948	38	8	Q56	50	2026-01-29 14:10:11.854628
949	38	8	Q57	0	2026-01-29 14:10:12.360529
950	38	8	Q58	100	2026-01-29 14:10:12.917887
951	38	9	Q59	75	2026-01-29 14:10:13.48042
952	38	9	Q61	25	2026-01-29 14:10:14.258399
953	38	9	Q62	0	2026-01-29 14:10:15.200773
954	38	9	Q64	25	2026-01-29 14:10:15.770232
955	38	10	Q65	50	2026-01-29 14:10:16.673503
956	38	10	Q66	25	2026-01-29 14:10:17.483953
957	38	10	Q68	100	2026-01-29 14:10:18.156421
958	38	10	Q70	100	2026-01-29 14:10:18.797103
959	45	1	Q1	50	2026-01-29 17:35:01.87566
960	45	1	Q2	0	2026-01-29 17:35:02.64998
961	45	1	Q3	75	2026-01-29 17:35:03.44011
962	45	1	Q9	75	2026-01-29 17:35:04.184117
963	45	2	Q13	25	2026-01-29 17:35:04.899829
964	45	2	Q17	75	2026-01-29 17:35:05.423405
965	45	2	Q18	75	2026-01-29 17:35:06.245993
966	45	2	Q19	25	2026-01-29 17:35:06.984539
967	45	3	Q20	50	2026-01-29 17:35:07.745312
968	45	3	Q21	100	2026-01-29 17:35:08.696341
969	45	3	Q23	50	2026-01-29 17:35:09.24463
970	45	3	Q25	0	2026-01-29 17:35:09.959501
971	45	3	Q26	50	2026-01-29 17:35:10.457662
972	45	3	Q28	100	2026-01-29 17:35:11.1918
973	45	4	Q31	50	2026-01-29 17:35:11.751522
974	45	4	Q32	75	2026-01-29 17:35:25.840866
975	45	4	Q33	50	2026-01-29 17:35:26.39145
976	45	4	Q34	0	2026-01-29 17:35:27.219826
977	45	5	Q35	50	2026-01-29 17:35:27.757706
978	45	5	Q38	100	2026-01-29 17:35:28.522348
979	45	5	Q41	50	2026-01-29 17:35:29.456869
980	45	6	Q43	100	2026-01-29 17:35:30.166879
981	45	6	Q45	50	2026-01-29 17:35:31.139029
982	45	7	Q48	25	2026-01-29 17:35:31.599044
983	45	7	Q52	50	2026-01-29 17:35:32.178836
984	45	7	Q55	100	2026-01-29 17:35:33.110035
985	45	8	Q56	75	2026-01-29 17:35:33.970316
986	45	8	Q57	50	2026-01-29 17:35:34.607283
987	45	8	Q58	75	2026-01-29 17:35:37.249014
988	45	9	Q59	100	2026-01-29 17:35:37.790166
989	45	9	Q61	75	2026-01-29 17:35:38.485643
990	45	9	Q62	50	2026-01-29 17:35:39.128861
991	45	9	Q64	25	2026-01-29 17:35:39.912434
992	45	10	Q65	50	2026-01-29 17:35:40.522232
993	45	10	Q66	75	2026-01-29 17:35:41.879392
994	45	10	Q68	100	2026-01-29 17:37:00.918582
995	45	10	Q70	75	2026-01-29 17:37:56.121589
996	51	1	Q1	50	2026-01-30 15:43:21.664812
997	51	1	Q2	75	2026-01-30 15:43:21.824806
998	51	1	Q3	75	2026-01-30 15:43:22.060665
999	51	1	Q9	50	2026-01-30 15:43:22.29709
1000	51	2	Q13	50	2026-01-30 15:43:22.511802
1001	51	2	Q17	50	2026-01-30 15:43:22.710961
1002	51	2	Q18	25	2026-01-30 15:43:22.986307
1003	51	2	Q19	50	2026-01-30 15:43:23.303796
1004	51	3	Q20	75	2026-01-30 15:43:23.595834
1005	51	3	Q21	75	2026-01-30 15:43:23.843526
1006	51	3	Q23	100	2026-01-30 15:43:24.114045
1007	51	3	Q25	75	2026-01-30 15:43:24.506481
1008	51	3	Q26	50	2026-01-30 15:43:24.911762
1009	51	3	Q28	25	2026-01-30 15:43:25.217326
1010	51	4	Q31	0	2026-01-30 15:43:25.506024
1011	51	4	Q32	25	2026-01-30 15:43:25.798113
1012	51	4	Q33	25	2026-01-30 15:43:26.006153
1013	51	4	Q34	50	2026-01-30 15:43:26.317761
1014	51	5	Q35	25	2026-01-30 15:43:26.542121
1015	51	5	Q38	25	2026-01-30 15:43:26.849146
1016	51	5	Q41	0	2026-01-30 15:43:27.018881
1017	51	6	Q43	50	2026-01-30 15:43:27.512618
1018	51	6	Q45	50	2026-01-30 15:43:27.672332
1019	51	7	Q48	25	2026-01-30 15:43:27.908243
1020	51	7	Q52	25	2026-01-30 15:43:28.078612
1021	51	7	Q55	0	2026-01-30 15:43:28.341668
1022	51	8	Q56	0	2026-01-30 15:43:28.530086
1023	51	8	Q57	25	2026-01-30 15:43:28.758255
1024	51	8	Q58	50	2026-01-30 15:43:29.046909
1025	51	9	Q59	75	2026-01-30 15:43:29.351737
1026	51	9	Q61	100	2026-01-30 15:43:29.766335
1027	51	9	Q62	75	2026-01-30 15:43:30.02783
1028	51	9	Q64	50	2026-01-30 15:43:30.569698
1029	51	10	Q65	25	2026-01-30 15:43:30.83269
1030	51	10	Q66	0	2026-01-30 15:43:31.086574
1031	51	10	Q68	0	2026-01-30 15:43:31.27787
1032	51	10	Q70	25	2026-01-30 15:43:31.542959
1033	48	1	Q1	50	2026-01-30 22:17:09.332345
1034	48	1	Q2	75	2026-01-30 22:17:09.585685
1035	48	1	Q3	75	2026-01-30 22:17:09.782237
1036	48	1	Q9	50	2026-01-30 22:17:10.150637
1037	48	2	Q13	50	2026-01-30 22:17:10.352438
1038	48	2	Q17	25	2026-01-30 22:17:10.673067
1039	48	2	Q18	50	2026-01-30 22:17:10.98129
1040	48	2	Q19	75	2026-01-30 22:17:11.242769
1041	48	3	Q20	75	2026-01-30 22:17:11.504649
1042	48	3	Q21	100	2026-01-30 22:17:11.79394
1043	48	3	Q23	75	2026-01-30 22:17:12.039291
1044	48	3	Q25	75	2026-01-30 22:17:12.223831
1045	48	3	Q26	50	2026-01-30 22:17:12.500103
1046	48	3	Q28	25	2026-01-30 22:17:12.800543
1047	48	4	Q31	0	2026-01-30 22:17:13.390669
1048	48	4	Q32	0	2026-01-30 22:17:13.668847
1049	48	4	Q33	25	2026-01-30 22:17:14.007094
1050	48	4	Q34	25	2026-01-30 22:17:14.206067
1051	48	5	Q35	50	2026-01-30 22:17:14.478528
1052	48	5	Q38	50	2026-01-30 22:17:14.674191
1053	48	5	Q41	75	2026-01-30 22:17:14.948168
1054	48	6	Q43	100	2026-01-30 22:17:15.251668
1055	48	6	Q45	75	2026-01-30 22:17:15.509292
1056	48	7	Q48	75	2026-01-30 22:17:15.704431
1057	48	7	Q52	50	2026-01-30 22:17:15.967603
1058	48	7	Q55	50	2026-01-30 22:17:16.165026
1059	48	8	Q56	25	2026-01-30 22:17:16.414309
1060	48	8	Q57	50	2026-01-30 22:17:16.735349
1061	48	8	Q58	50	2026-01-30 22:17:16.966344
1062	48	9	Q59	75	2026-01-30 22:17:17.229366
1063	48	9	Q61	75	2026-01-30 22:17:17.399997
1064	48	9	Q62	100	2026-01-30 22:17:17.657005
1065	48	9	Q64	75	2026-01-30 22:17:17.948554
1066	48	10	Q65	50	2026-01-30 22:17:18.2559
1067	48	10	Q66	50	2026-01-30 22:17:18.518644
1068	48	10	Q68	50	2026-01-30 22:17:18.678858
1069	48	10	Q70	25	2026-01-30 22:17:18.979127
1070	56	1	Q1	50	2026-01-30 22:35:13.656655
1071	56	1	Q2	75	2026-01-30 22:35:13.979983
1072	56	1	Q3	75	2026-01-30 22:35:14.171313
1073	56	1	Q9	50	2026-01-30 22:35:14.44947
1074	56	2	Q13	50	2026-01-30 22:35:14.65604
1075	56	2	Q17	25	2026-01-30 22:35:14.97087
1076	56	2	Q18	50	2026-01-30 22:35:15.28094
1077	56	2	Q19	50	2026-01-30 22:35:15.4898
1078	56	3	Q20	75	2026-01-30 22:35:15.732725
1079	56	3	Q21	75	2026-01-30 22:35:15.927901
1080	56	3	Q23	50	2026-01-30 22:35:16.182217
1081	56	3	Q25	50	2026-01-30 22:35:16.388942
1082	56	3	Q26	25	2026-01-30 22:35:16.687622
1083	56	3	Q28	25	2026-01-30 22:35:16.903287
1084	56	4	Q31	0	2026-01-30 22:35:17.128463
1085	56	4	Q32	0	2026-01-30 22:35:17.310336
1086	56	4	Q33	25	2026-01-30 22:35:17.612912
1087	56	4	Q34	25	2026-01-30 22:35:17.785277
1088	56	5	Q35	50	2026-01-30 22:35:17.999988
1089	56	5	Q38	50	2026-01-30 22:35:18.16311
1090	56	5	Q41	75	2026-01-30 22:35:18.386832
1091	56	6	Q43	100	2026-01-30 22:35:18.714635
1092	56	6	Q45	100	2026-01-30 22:35:18.950483
1093	56	7	Q48	100	2026-01-30 22:35:19.132839
1094	56	7	Q52	75	2026-01-30 22:35:19.347589
1095	56	7	Q55	50	2026-01-30 22:35:19.745655
1096	56	8	Q56	75	2026-01-30 22:35:20.007861
1097	56	8	Q57	100	2026-01-30 22:35:20.29531
1098	56	8	Q58	75	2026-01-30 22:35:20.527358
1099	56	9	Q59	75	2026-01-30 22:35:20.707813
1100	56	9	Q61	25	2026-01-30 22:35:21.234389
1101	56	9	Q62	50	2026-01-30 22:35:21.562862
1102	56	9	Q64	75	2026-01-30 22:35:21.846383
1103	56	10	Q65	100	2026-01-30 22:35:22.265087
1104	56	10	Q66	75	2026-01-30 22:35:22.596267
1105	56	10	Q68	75	2026-01-30 22:35:23.002669
1106	56	10	Q70	100	2026-01-30 22:35:23.308818
1107	59	1	Q1	50	2026-01-30 23:22:18.987689
1108	59	1	Q2	75	2026-01-30 23:22:19.293057
1109	59	1	Q3	75	2026-01-30 23:22:19.470624
1110	59	1	Q9	50	2026-01-30 23:22:19.69053
1111	59	2	Q13	50	2026-01-30 23:22:19.873873
1112	59	2	Q17	25	2026-01-30 23:22:20.236294
1113	59	2	Q18	25	2026-01-30 23:22:20.475191
1114	59	2	Q19	50	2026-01-30 23:22:20.781248
1115	59	3	Q20	50	2026-01-30 23:22:20.968358
1116	59	3	Q21	75	2026-01-30 23:22:21.290132
1117	59	3	Q23	100	2026-01-30 23:22:21.545475
1118	59	3	Q25	75	2026-01-30 23:22:21.794067
1119	59	3	Q26	50	2026-01-30 23:22:22.014797
1120	59	3	Q28	25	2026-01-30 23:22:22.419269
1121	59	4	Q31	0	2026-01-30 23:22:22.601159
1122	59	4	Q32	0	2026-01-30 23:22:22.832885
1123	59	4	Q33	25	2026-01-30 23:22:23.043562
1124	59	4	Q34	50	2026-01-30 23:22:23.243965
1125	59	5	Q35	100	2026-01-30 23:22:23.765601
1126	59	5	Q38	75	2026-01-30 23:22:24.06559
1127	59	5	Q41	50	2026-01-30 23:22:24.360085
1128	59	6	Q43	25	2026-01-30 23:22:24.777827
1129	59	6	Q45	75	2026-01-30 23:22:25.426438
1130	59	7	Q48	100	2026-01-30 23:22:25.835727
1131	59	7	Q52	100	2026-01-30 23:22:26.00497
1132	59	7	Q55	100	2026-01-30 23:22:26.173705
1133	59	8	Q56	75	2026-01-30 23:22:26.397095
1134	59	8	Q57	75	2026-01-30 23:22:26.609361
1135	59	8	Q58	75	2026-01-30 23:22:26.798406
1136	59	9	Q59	100	2026-01-30 23:22:27.121277
1137	59	9	Q61	50	2026-01-30 23:22:27.348035
1138	59	9	Q62	50	2026-01-30 23:22:27.535299
1139	59	9	Q64	50	2026-01-30 23:22:27.721804
1140	59	10	Q65	0	2026-01-30 23:22:27.950545
1141	59	10	Q66	25	2026-01-30 23:22:28.166189
1142	59	10	Q68	25	2026-01-30 23:22:28.460777
1143	59	10	Q70	50	2026-01-30 23:22:29.7362
\.


--
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
1	3	1	Demandas no Trabalho	62.50	medio	2026-01-23 20:18:08.998355
2	3	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-01-23 20:18:09.009818
3	3	3	Relações Sociais e Liderança	79.17	alto	2026-01-23 20:18:09.011476
4	3	4	Interface Trabalho-Indivíduo	68.75	alto	2026-01-23 20:18:09.012748
5	3	5	Valores Organizacionais	16.67	baixo	2026-01-23 20:18:09.013923
6	3	6	Traços de Personalidade	50.00	medio	2026-01-23 20:18:09.015063
7	3	7	Saúde e Bem-Estar	66.67	alto	2026-01-23 20:18:09.0164
8	3	8	Comportamentos Ofensivos	66.67	alto	2026-01-23 20:18:09.018449
9	3	9	Comportamento de Jogo	18.75	baixo	2026-01-23 20:18:09.02013
10	3	10	Endividamento Financeiro	31.25	baixo	2026-01-23 20:18:09.022262
11	6	1	Demandas no Trabalho	75.00	alto	2026-01-23 20:19:25.091052
12	6	2	Organização e Conteúdo do Trabalho	31.25	baixo	2026-01-23 20:19:25.095488
13	6	3	Relações Sociais e Liderança	58.33	medio	2026-01-23 20:19:25.097158
14	6	4	Interface Trabalho-Indivíduo	62.50	medio	2026-01-23 20:19:25.098749
15	6	5	Valores Organizacionais	75.00	alto	2026-01-23 20:19:25.10046
16	6	6	Traços de Personalidade	75.00	alto	2026-01-23 20:19:25.102655
17	6	7	Saúde e Bem-Estar	33.33	medio	2026-01-23 20:19:25.106164
18	6	8	Comportamentos Ofensivos	25.00	baixo	2026-01-23 20:19:25.108067
19	6	9	Comportamento de Jogo	75.00	alto	2026-01-23 20:19:25.109351
20	6	10	Endividamento Financeiro	75.00	alto	2026-01-23 20:19:25.110833
21	9	1	Demandas no Trabalho	68.75	alto	2026-01-24 09:26:48.309098
22	9	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-01-24 09:26:48.31567
23	9	3	Relações Sociais e Liderança	45.83	medio	2026-01-24 09:26:48.317478
24	9	4	Interface Trabalho-Indivíduo	75.00	alto	2026-01-24 09:26:48.318934
25	9	5	Valores Organizacionais	66.67	alto	2026-01-24 09:26:48.320235
26	9	6	Traços de Personalidade	87.50	alto	2026-01-24 09:26:48.321648
27	9	7	Saúde e Bem-Estar	41.67	medio	2026-01-24 09:26:48.323182
28	9	8	Comportamentos Ofensivos	75.00	alto	2026-01-24 09:26:48.324894
29	9	9	Comportamento de Jogo	50.00	medio	2026-01-24 09:26:48.327135
30	9	10	Endividamento Financeiro	43.75	medio	2026-01-24 09:26:48.328692
31	13	1	Demandas no Trabalho	75.00	alto	2026-01-25 13:51:53.896639
32	13	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-01-25 13:51:53.903626
33	13	3	Relações Sociais e Liderança	62.50	medio	2026-01-25 13:51:53.906286
34	13	4	Interface Trabalho-Indivíduo	50.00	medio	2026-01-25 13:51:53.908848
35	13	5	Valores Organizacionais	58.33	medio	2026-01-25 13:51:53.910842
36	13	6	Traços de Personalidade	50.00	medio	2026-01-25 13:51:53.91277
37	13	7	Saúde e Bem-Estar	50.00	medio	2026-01-25 13:51:53.914473
38	13	8	Comportamentos Ofensivos	75.00	alto	2026-01-25 13:51:53.915893
39	13	9	Comportamento de Jogo	37.50	medio	2026-01-25 13:51:53.917266
40	13	10	Endividamento Financeiro	62.50	medio	2026-01-25 13:51:53.918975
41	15	1	Demandas no Trabalho	56.25	medio	2026-01-25 13:59:32.290723
42	15	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-01-25 13:59:32.297084
43	15	3	Relações Sociais e Liderança	37.50	medio	2026-01-25 13:59:32.298943
44	15	4	Interface Trabalho-Indivíduo	62.50	medio	2026-01-25 13:59:32.300439
45	15	5	Valores Organizacionais	83.33	alto	2026-01-25 13:59:32.301813
46	15	6	Traços de Personalidade	37.50	medio	2026-01-25 13:59:32.303312
47	15	7	Saúde e Bem-Estar	66.67	alto	2026-01-25 13:59:32.305032
48	15	8	Comportamentos Ofensivos	75.00	alto	2026-01-25 13:59:32.307128
49	15	9	Comportamento de Jogo	18.75	baixo	2026-01-25 13:59:32.30875
50	15	10	Endividamento Financeiro	62.50	medio	2026-01-25 13:59:32.310063
151	16	1	Demandas no Trabalho	75.00	alto	2026-01-29 05:42:12.43198
152	16	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-01-29 05:42:12.489088
153	16	3	Relações Sociais e Liderança	79.17	alto	2026-01-29 05:42:12.501266
154	16	4	Interface Trabalho-Indivíduo	68.75	alto	2026-01-29 05:42:12.513549
155	16	5	Valores Organizacionais	33.33	medio	2026-01-29 05:42:12.525979
156	16	6	Traços de Personalidade	0.00	baixo	2026-01-29 05:42:12.538351
157	16	7	Saúde e Bem-Estar	25.00	baixo	2026-01-29 05:42:12.550792
158	16	8	Comportamentos Ofensivos	83.33	alto	2026-01-29 05:42:12.563401
159	16	9	Comportamento de Jogo	75.00	alto	2026-01-29 05:42:12.575897
160	16	10	Endividamento Financeiro	81.25	alto	2026-01-29 05:42:12.587657
161	19	1	Demandas no Trabalho	75.00	alto	2026-01-29 06:40:13.714903
162	19	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-01-29 06:40:13.769781
163	19	3	Relações Sociais e Liderança	79.17	alto	2026-01-29 06:40:13.781524
164	19	4	Interface Trabalho-Indivíduo	50.00	medio	2026-01-29 06:40:13.793238
165	19	5	Valores Organizacionais	8.33	baixo	2026-01-29 06:40:13.804596
166	19	6	Traços de Personalidade	12.50	baixo	2026-01-29 06:40:13.815625
167	19	7	Saúde e Bem-Estar	75.00	alto	2026-01-29 06:40:13.826743
168	19	8	Comportamentos Ofensivos	25.00	baixo	2026-01-29 06:40:13.838182
169	19	9	Comportamento de Jogo	68.75	alto	2026-01-29 06:40:13.849812
170	19	10	Endividamento Financeiro	31.25	baixo	2026-01-29 06:40:13.861025
171	24	1	Demandas no Trabalho	68.75	alto	2026-01-29 09:20:57.0075
172	24	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-01-29 09:20:57.034613
173	24	3	Relações Sociais e Liderança	16.67	baixo	2026-01-29 09:20:57.04616
174	24	4	Interface Trabalho-Indivíduo	50.00	medio	2026-01-29 09:20:57.05788
175	24	5	Valores Organizacionais	58.33	medio	2026-01-29 09:20:57.069136
176	24	6	Traços de Personalidade	75.00	alto	2026-01-29 09:20:57.080868
177	24	7	Saúde e Bem-Estar	75.00	alto	2026-01-29 09:20:57.092821
178	24	8	Comportamentos Ofensivos	50.00	medio	2026-01-29 09:20:57.104231
179	24	9	Comportamento de Jogo	93.75	alto	2026-01-29 09:20:57.117431
180	24	10	Endividamento Financeiro	75.00	alto	2026-01-29 09:20:57.128692
181	25	1	Demandas no Trabalho	75.00	alto	2026-01-29 09:34:02.256677
182	25	2	Organização e Conteúdo do Trabalho	31.25	baixo	2026-01-29 09:34:02.271581
183	25	3	Relações Sociais e Liderança	58.33	medio	2026-01-29 09:34:02.286558
184	25	4	Interface Trabalho-Indivíduo	50.00	medio	2026-01-29 09:34:02.301077
185	25	5	Valores Organizacionais	33.33	medio	2026-01-29 09:34:02.315682
186	25	6	Traços de Personalidade	100.00	alto	2026-01-29 09:34:02.330085
187	25	7	Saúde e Bem-Estar	58.33	medio	2026-01-29 09:34:02.345102
188	25	8	Comportamentos Ofensivos	91.67	alto	2026-01-29 09:34:02.359548
189	25	9	Comportamento de Jogo	43.75	medio	2026-01-29 09:34:02.374737
190	25	10	Endividamento Financeiro	50.00	medio	2026-01-29 09:34:02.389637
191	27	1	Demandas no Trabalho	62.50	medio	2026-01-29 10:07:47.53704
192	27	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-01-29 10:07:47.548624
193	27	3	Relações Sociais e Liderança	70.83	alto	2026-01-29 10:07:47.559586
194	27	4	Interface Trabalho-Indivíduo	56.25	medio	2026-01-29 10:07:47.570942
195	27	5	Valores Organizacionais	91.67	alto	2026-01-29 10:07:47.58184
196	27	6	Traços de Personalidade	62.50	medio	2026-01-29 10:07:47.592936
197	27	7	Saúde e Bem-Estar	33.33	medio	2026-01-29 10:07:47.604247
198	27	8	Comportamentos Ofensivos	75.00	alto	2026-01-29 10:07:47.614947
199	27	9	Comportamento de Jogo	75.00	alto	2026-01-29 10:07:47.625518
200	27	10	Endividamento Financeiro	25.00	baixo	2026-01-29 10:07:47.635974
201	28	1	Demandas no Trabalho	81.25	alto	2026-01-29 10:30:41.309621
202	28	2	Organização e Conteúdo do Trabalho	12.50	baixo	2026-01-29 10:30:41.325846
203	28	3	Relações Sociais e Liderança	29.17	baixo	2026-01-29 10:30:41.341409
204	28	4	Interface Trabalho-Indivíduo	75.00	alto	2026-01-29 10:30:41.356134
205	28	5	Valores Organizacionais	83.33	alto	2026-01-29 10:30:41.371787
206	28	6	Traços de Personalidade	87.50	alto	2026-01-29 10:30:41.386399
207	28	7	Saúde e Bem-Estar	25.00	baixo	2026-01-29 10:30:41.401674
208	28	8	Comportamentos Ofensivos	25.00	baixo	2026-01-29 10:30:41.416809
209	28	9	Comportamento de Jogo	75.00	alto	2026-01-29 10:30:41.431859
210	28	10	Endividamento Financeiro	37.50	medio	2026-01-29 10:30:41.448622
211	30	1	Demandas no Trabalho	62.50	medio	2026-01-29 10:46:56.050325
212	30	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-01-29 10:46:56.064816
213	30	3	Relações Sociais e Liderança	62.50	medio	2026-01-29 10:46:56.079284
214	30	4	Interface Trabalho-Indivíduo	50.00	medio	2026-01-29 10:46:56.094119
215	30	5	Valores Organizacionais	75.00	alto	2026-01-29 10:46:56.108467
216	30	6	Traços de Personalidade	75.00	alto	2026-01-29 10:46:56.122364
217	30	7	Saúde e Bem-Estar	16.67	baixo	2026-01-29 10:46:56.136181
218	30	8	Comportamentos Ofensivos	50.00	medio	2026-01-29 10:46:56.150511
219	30	9	Comportamento de Jogo	81.25	alto	2026-01-29 10:46:56.164555
220	30	10	Endividamento Financeiro	43.75	medio	2026-01-29 10:46:56.17895
221	32	1	Demandas no Trabalho	43.75	medio	2026-01-29 11:19:21.460466
222	32	2	Organização e Conteúdo do Trabalho	18.75	baixo	2026-01-29 11:19:21.486802
223	32	3	Relações Sociais e Liderança	62.50	medio	2026-01-29 11:19:21.50049
224	32	4	Interface Trabalho-Indivíduo	62.50	medio	2026-01-29 11:19:21.514308
225	32	5	Valores Organizacionais	66.67	alto	2026-01-29 11:19:21.528125
226	32	6	Traços de Personalidade	62.50	medio	2026-01-29 11:19:21.542217
227	32	7	Saúde e Bem-Estar	16.67	baixo	2026-01-29 11:19:21.556327
228	32	8	Comportamentos Ofensivos	50.00	medio	2026-01-29 11:19:21.570418
229	32	9	Comportamento de Jogo	75.00	alto	2026-01-29 11:19:21.599044
230	32	10	Endividamento Financeiro	81.25	alto	2026-01-29 11:19:21.612677
231	40	1	Demandas no Trabalho	31.25	baixo	2026-01-29 13:35:07.818562
232	40	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-01-29 13:35:08.074073
233	40	3	Relações Sociais e Liderança	62.50	medio	2026-01-29 13:35:08.311775
234	40	4	Interface Trabalho-Indivíduo	37.50	medio	2026-01-29 13:35:08.550191
235	40	5	Valores Organizacionais	50.00	medio	2026-01-29 13:35:08.788202
236	40	6	Traços de Personalidade	62.50	medio	2026-01-29 13:35:09.026209
237	40	7	Saúde e Bem-Estar	50.00	medio	2026-01-29 13:35:09.263904
238	40	8	Comportamentos Ofensivos	41.67	medio	2026-01-29 13:35:09.502398
239	40	9	Comportamento de Jogo	75.00	alto	2026-01-29 13:35:09.740208
240	40	10	Endividamento Financeiro	18.75	baixo	2026-01-29 13:35:09.978028
241	38	1	Demandas no Trabalho	62.50	medio	2026-01-29 14:10:19.856517
242	38	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-01-29 14:10:20.103238
243	38	3	Relações Sociais e Liderança	33.33	medio	2026-01-29 14:10:20.33775
244	38	4	Interface Trabalho-Indivíduo	75.00	alto	2026-01-29 14:10:20.573163
245	38	5	Valores Organizacionais	25.00	baixo	2026-01-29 14:10:20.807913
246	38	6	Traços de Personalidade	75.00	alto	2026-01-29 14:10:21.042646
247	38	7	Saúde e Bem-Estar	41.67	medio	2026-01-29 14:10:21.277451
248	38	8	Comportamentos Ofensivos	50.00	medio	2026-01-29 14:10:21.512588
249	38	9	Comportamento de Jogo	31.25	baixo	2026-01-29 14:10:21.74738
250	38	10	Endividamento Financeiro	68.75	alto	2026-01-29 14:10:21.981699
251	45	1	Demandas no Trabalho	50.00	medio	2026-01-29 17:37:57.379447
252	45	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-01-29 17:37:57.668975
253	45	3	Relações Sociais e Liderança	58.33	medio	2026-01-29 17:37:57.903965
254	45	4	Interface Trabalho-Indivíduo	43.75	medio	2026-01-29 17:37:58.138209
255	45	5	Valores Organizacionais	66.67	alto	2026-01-29 17:37:58.372871
256	45	6	Traços de Personalidade	75.00	alto	2026-01-29 17:37:58.608854
257	45	7	Saúde e Bem-Estar	58.33	medio	2026-01-29 17:37:58.843749
258	45	8	Comportamentos Ofensivos	66.67	alto	2026-01-29 17:37:59.080968
259	45	9	Comportamento de Jogo	62.50	medio	2026-01-29 17:37:59.315401
260	45	10	Endividamento Financeiro	75.00	alto	2026-01-29 17:37:59.550542
261	51	1	Demandas no Trabalho	62.50	medio	2026-01-30 15:43:32.17748
262	51	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-01-30 15:43:32.206628
263	51	3	Relações Sociais e Liderança	66.67	alto	2026-01-30 15:43:32.217928
264	51	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-01-30 15:43:32.230409
265	51	5	Valores Organizacionais	16.67	baixo	2026-01-30 15:43:32.241446
266	51	6	Traços de Personalidade	50.00	medio	2026-01-30 15:43:32.252365
267	51	7	Saúde e Bem-Estar	16.67	baixo	2026-01-30 15:43:32.264947
268	51	8	Comportamentos Ofensivos	25.00	baixo	2026-01-30 15:43:32.276177
269	51	9	Comportamento de Jogo	75.00	alto	2026-01-30 15:43:32.287283
270	51	10	Endividamento Financeiro	12.50	baixo	2026-01-30 15:43:32.298546
271	48	1	Demandas no Trabalho	62.50	medio	2026-01-30 22:17:19.619364
272	48	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-01-30 22:17:19.644228
273	48	3	Relações Sociais e Liderança	66.67	alto	2026-01-30 22:17:19.659377
274	48	4	Interface Trabalho-Indivíduo	12.50	baixo	2026-01-30 22:17:19.675454
275	48	5	Valores Organizacionais	58.33	medio	2026-01-30 22:17:19.691033
276	48	6	Traços de Personalidade	87.50	alto	2026-01-30 22:17:19.707966
277	48	7	Saúde e Bem-Estar	58.33	medio	2026-01-30 22:17:19.723922
278	48	8	Comportamentos Ofensivos	41.67	medio	2026-01-30 22:17:19.73984
279	48	9	Comportamento de Jogo	81.25	alto	2026-01-30 22:17:19.754286
280	48	10	Endividamento Financeiro	43.75	medio	2026-01-30 22:17:19.768881
281	56	1	Demandas no Trabalho	62.50	medio	2026-01-30 22:35:23.855628
282	56	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-01-30 22:35:23.870287
283	56	3	Relações Sociais e Liderança	50.00	medio	2026-01-30 22:35:23.883369
284	56	4	Interface Trabalho-Indivíduo	12.50	baixo	2026-01-30 22:35:23.896508
285	56	5	Valores Organizacionais	58.33	medio	2026-01-30 22:35:23.90976
286	56	6	Traços de Personalidade	100.00	alto	2026-01-30 22:35:23.923013
287	56	7	Saúde e Bem-Estar	75.00	alto	2026-01-30 22:35:23.937643
288	56	8	Comportamentos Ofensivos	83.33	alto	2026-01-30 22:35:23.951446
289	56	9	Comportamento de Jogo	56.25	medio	2026-01-30 22:35:23.964255
290	56	10	Endividamento Financeiro	87.50	alto	2026-01-30 22:35:23.977454
291	59	1	Demandas no Trabalho	62.50	medio	2026-01-30 23:22:30.291182
292	59	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-01-30 23:22:30.317197
293	59	3	Relações Sociais e Liderança	62.50	medio	2026-01-30 23:22:30.329863
294	59	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-01-30 23:22:30.341699
295	59	5	Valores Organizacionais	75.00	alto	2026-01-30 23:22:30.353867
296	59	6	Traços de Personalidade	50.00	medio	2026-01-30 23:22:30.366046
297	59	7	Saúde e Bem-Estar	100.00	alto	2026-01-30 23:22:30.378235
298	59	8	Comportamentos Ofensivos	75.00	alto	2026-01-30 23:22:30.389955
299	59	9	Comportamento de Jogo	62.50	medio	2026-01-30 23:22:30.40305
300	59	10	Endividamento Financeiro	25.00	baixo	2026-01-30 23:22:30.414836
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
1	1	2026-01-22 21:28:35.448067
1	2	2026-01-22 21:28:35.448067
1	5	2026-01-22 21:28:35.448067
1	6	2026-01-22 21:28:35.448067
2	3	2026-01-22 21:28:35.456139
2	7	2026-01-22 21:28:35.456139
2	8	2026-01-22 21:28:35.456139
2	10	2026-01-22 21:28:35.456139
2	11	2026-01-22 21:28:35.456139
2	13	2026-01-22 21:28:35.456139
2	14	2026-01-22 21:28:35.456139
3	13	2026-01-22 21:28:35.458021
3	16	2026-01-22 21:28:35.458021
3	17	2026-01-22 21:28:35.458021
4	4	2026-01-22 21:28:35.45954
4	9	2026-01-22 21:28:35.45954
4	12	2026-01-22 21:28:35.45954
4	15	2026-01-22 21:28:35.45954
5	63	2026-01-29 19:08:36.499636
5	64	2026-01-29 19:08:36.499636
5	65	2026-01-29 19:08:36.499636
5	66	2026-01-29 19:08:36.499636
5	67	2026-01-29 19:08:36.499636
5	68	2026-01-29 19:08:36.499636
5	69	2026-01-29 19:08:36.499636
5	70	2026-01-29 19:08:36.499636
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, display_name, description, hierarchy_level, active, created_at) FROM stdin;
1	funcionario	FuncionÃƒÂ¡rio	UsuÃƒÂ¡rio comum que responde avaliaÃƒÂ§ÃƒÂµes	0	t	2026-01-22 21:28:35.437102
2	rh	Gestor RH/ClÃƒÂ­nica	Gerencia funcionÃƒÂ¡rios e empresas de sua clÃƒÂ­nica	10	t	2026-01-22 21:28:35.437102
3	emissor	Emissor de Laudos	Emite laudos e relatÃƒÂ³rios finais	10	t	2026-01-22 21:28:35.437102
4	admin	Administrador	Administrador do sistema com acesso amplo	50	t	2026-01-22 21:28:35.437102
5	gestor_entidade	Gestor de Entidade	Gerencia funcionarios de sua entidade privada	10	t	2026-01-29 19:08:36.499636
\.


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

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1153, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 139, true);


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_laudos_id_seq', 6, true);


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 59, true);


--
-- Name: clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinicas_id_seq', 22, true);


--
-- Name: contratacao_personalizada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratacao_personalizada_id_seq', 5, true);


--
-- Name: contratantes_funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratantes_funcionarios_id_seq', 10, true);


--
-- Name: contratantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratantes_id_seq', 5, true);


--
-- Name: contratantes_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratantes_senhas_id_seq', 10, true);


--
-- Name: contratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratos_id_seq', 10, true);


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contratos_planos_id_seq', 1, false);


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emissao_queue_id_seq', 6, true);


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresas_clientes_id_seq', 3, true);


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fila_emissao_id_seq', 31, true);


--
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 49, true);


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

SELECT pg_catalog.setval('public.laudos_id_seq', 1, true);


--
-- Name: lote_id_allocator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lote_id_allocator_id_seq', 1, false);


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lotes_avaliacao_funcionarios_id_seq', 1, false);


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lotes_avaliacao_id_seq', 10, true);


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mfa_codes_id_seq', 1, false);


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migration_guidelines_id_seq', 3, true);


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificacoes_admin_id_seq', 24, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 8, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1351, true);


--
-- Name: planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.planos_id_seq', 2, true);


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

SELECT pg_catalog.setval('public.respostas_id_seq', 1143, true);


--
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultados_id_seq', 300, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


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
-- Name: contratantes_funcionarios contratantes_funcionarios_funcionario_id_contratante_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_funcionarios
    ADD CONSTRAINT contratantes_funcionarios_funcionario_id_contratante_id_key UNIQUE (funcionario_id, contratante_id);


--
-- Name: contratantes_funcionarios contratantes_funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_funcionarios
    ADD CONSTRAINT contratantes_funcionarios_pkey PRIMARY KEY (id);


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
-- Name: fila_emissao fila_emissao_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);


--
-- Name: fila_emissao fila_emissao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao
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
-- Name: lote_id_allocator lote_id_allocator_clinica_id_contratante_id_ano_mes_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_id_allocator
    ADD CONSTRAINT lote_id_allocator_clinica_id_contratante_id_ano_mes_key UNIQUE (clinica_id, contratante_id, ano, mes);


--
-- Name: lote_id_allocator lote_id_allocator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lote_id_allocator
    ADD CONSTRAINT lote_id_allocator_pkey PRIMARY KEY (id);


--
-- Name: lotes_avaliacao lotes_avaliacao_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_codigo_key UNIQUE (codigo);


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
-- Name: idx_auditoria_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote ON public.auditoria_laudos USING btree (lote_id);


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

CREATE INDEX idx_fila_emissao_lote_tentativas_pendentes ON public.fila_emissao USING btree (lote_id) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_proxima_tentativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_proxima_tentativa ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_solicitado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitado_em ON public.fila_emissao USING btree (solicitado_em DESC);


--
-- Name: idx_fila_emissao_solicitado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitado_por ON public.fila_emissao USING btree (solicitado_por);


--
-- Name: idx_fila_emissao_solicitante_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_solicitante_data ON public.fila_emissao USING btree (solicitado_por, solicitado_em DESC) WHERE (solicitado_por IS NOT NULL);


--
-- Name: idx_fila_emissao_tipo_solicitante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_emissao_tipo_solicitante ON public.fila_emissao USING btree (tipo_solicitante);


--
-- Name: idx_fila_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_lote ON public.fila_emissao USING btree (lote_id);


--
-- Name: idx_fila_pendente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fila_pendente ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


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

CREATE INDEX idx_laudo_downloads_created_at ON public.laudo_downloads USING btree (created_at DESC);


--
-- Name: idx_laudo_downloads_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_laudo_id ON public.laudo_downloads USING btree (laudo_id);


--
-- Name: idx_laudo_jobs_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_laudo_id ON public.laudo_generation_jobs USING btree (laudo_id);


--
-- Name: idx_laudo_jobs_prioridade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_prioridade ON public.laudo_generation_jobs USING btree (prioridade DESC, criado_em);


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
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);


--
-- Name: idx_laudos_id_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_id_lote_id ON public.laudos USING btree (id, lote_id);


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
-- Name: idx_lote_allocator_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lote_allocator_clinica ON public.lote_id_allocator USING btree (clinica_id, ano, mes);


--
-- Name: idx_lote_allocator_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lote_allocator_contratante ON public.lote_id_allocator USING btree (contratante_id, ano, mes);


--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'finalizado'::character varying])::text[]));


--
-- Name: idx_lotes_auto_emitir_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_auto_emitir_em ON public.lotes_avaliacao USING btree (auto_emitir_em);


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
-- Name: idx_lotes_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_codigo ON public.lotes_avaliacao USING btree (codigo);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);


--
-- Name: idx_lotes_pronto_emissao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_pronto_emissao ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_pronto_envio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_pronto_envio ON public.lotes_avaliacao USING btree (emitido_em, enviado_em, auto_emitir_em) WHERE ((emitido_em IS NOT NULL) AND (enviado_em IS NULL));


--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);


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
-- Name: idx_policy_backups_table; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_policy_backups_table ON public.policy_expression_backups USING btree (table_name);


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

ALTER TABLE public.laudos DISABLE TRIGGER audit_laudos;


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

ALTER TABLE public.lotes_avaliacao DISABLE TRIGGER audit_lotes_avaliacao;


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();

ALTER TABLE public.laudos DISABLE TRIGGER enforce_laudo_immutability;


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

ALTER TABLE public.lotes_avaliacao DISABLE TRIGGER prevent_lote_update_after_emission;


--
-- Name: TRIGGER prevent_lote_update_after_emission ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER prevent_lote_update_after_emission ON public.lotes_avaliacao IS 'Bloqueia mudanças indevidas no lote após emissão do laudo';


--
-- Name: contratantes_senhas trg_contratantes_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contratantes_senhas_updated_at BEFORE UPDATE ON public.contratantes_senhas FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_senhas_updated_at();

ALTER TABLE public.contratantes_senhas DISABLE TRIGGER trg_contratantes_senhas_updated_at;


--
-- Name: contratantes trg_contratantes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contratantes_updated_at BEFORE UPDATE ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_updated_at();


--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();

ALTER TABLE public.laudos DISABLE TRIGGER trg_enforce_laudo_id_equals_lote;


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

ALTER TABLE public.laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change;


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();


--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();

ALTER TABLE public.lotes_avaliacao DISABLE TRIGGER trg_protect_lote_after_emit;


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: lotes_avaliacao trg_reservar_id_laudo_on_lote_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert AFTER INSERT ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_reservar_id_laudo_on_lote_insert();

ALTER TABLE public.lotes_avaliacao DISABLE TRIGGER trg_reservar_id_laudo_on_lote_insert;


--
-- Name: funcionarios trg_sync_contratantes_funcionarios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_contratantes_funcionarios AFTER INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.sync_contratantes_funcionarios();


--
-- Name: avaliacoes trg_verificar_cancelamento_automatico_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_verificar_cancelamento_automatico_lote AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((new.status)::text = 'inativada'::text)) EXECUTE FUNCTION public.verificar_cancelamento_automatico_lote();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();

ALTER TABLE public.lotes_avaliacao DISABLE TRIGGER trigger_prevent_lote_mutation_during_emission;


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();


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
-- Name: contratantes_funcionarios contratantes_funcionarios_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_funcionarios
    ADD CONSTRAINT contratantes_funcionarios_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratantes_funcionarios contratantes_funcionarios_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratantes_funcionarios
    ADD CONSTRAINT contratantes_funcionarios_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


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
-- Name: fila_emissao fila_emissao_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


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
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


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
-- Name: laudo_generation_jobs laudo_generation_jobs_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.funcionarios(cpf);


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


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
-- Name: avaliacoes admin_all_avaliacoes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_avaliacoes ON public.avaliacoes USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: empresas_clientes admin_all_empresas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_empresas ON public.empresas_clientes USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: laudos admin_all_laudos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_laudos ON public.laudos USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: lotes_avaliacao admin_all_lotes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_lotes ON public.lotes_avaliacao USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: respostas admin_all_respostas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_respostas ON public.respostas USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: resultados admin_all_resultados; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_resultados ON public.resultados USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


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

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor_entidade'::text, 'admin'::text]))));


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
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: avaliacoes avaliacoes_own_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_own_insert ON public.avaliacoes FOR INSERT WITH CHECK (((funcionario_cpf)::text = public.current_user_cpf()));


--
-- Name: avaliacoes avaliacoes_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT USING (((funcionario_cpf)::text = public.current_user_cpf()));


--
-- Name: avaliacoes avaliacoes_own_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_own_update ON public.avaliacoes FOR UPDATE USING (((funcionario_cpf)::text = public.current_user_cpf())) WITH CHECK (((funcionario_cpf)::text = public.current_user_cpf()));


--
-- Name: avaliacoes avaliacoes_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_rh_clinica ON public.avaliacoes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios f
  WHERE ((f.cpf = avaliacoes.funcionario_cpf) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: clinicas clinicas_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clinicas_own_select ON public.clinicas FOR SELECT USING (((public.current_user_perfil() = ANY (ARRAY['admin'::text, 'rh'::text])) AND (id = public.current_user_clinica_id_optional())));


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
-- Name: empresas_clientes empresas_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_clinica ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_delete ON public.empresas_clientes FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.funcionarios f
  WHERE ((f.empresa_id = empresas_clientes.id) AND (f.ativo = true)))))));


--
-- Name: empresas_clientes empresas_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_insert ON public.empresas_clientes FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_update ON public.empresas_clientes FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: fila_emissao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.fila_emissao ENABLE ROW LEVEL SECURITY;

--
-- Name: fila_emissao fila_emissao_admin_view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_admin_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY fila_emissao_admin_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_admin_view ON public.fila_emissao IS 'Admin pode visualizar toda fila para auditoria (SELECT)';


--
-- Name: fila_emissao fila_emissao_emissor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_update ON public.fila_emissao FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_update ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_update ON public.fila_emissao IS 'Emissor pode atualizar tentativas e erros (UPDATE)';


--
-- Name: fila_emissao fila_emissao_emissor_view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: POLICY fila_emissao_emissor_view ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_emissor_view ON public.fila_emissao IS 'Emissor pode visualizar fila de trabalho (SELECT)';


--
-- Name: fila_emissao fila_emissao_system_bypass; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_system_bypass ON public.fila_emissao USING ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text)) WITH CHECK ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text));


--
-- Name: POLICY fila_emissao_system_bypass ON fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY fila_emissao_system_bypass ON public.fila_emissao IS 'Permite acesso total quando app.system_bypass = true (APIs internas)';


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
-- Name: funcionarios funcionarios_unified_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_unified_delete ON public.funcionarios FOR DELETE USING ((public.current_user_tipo() = 'admin'::text));


--
-- Name: POLICY funcionarios_unified_delete ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_unified_delete ON public.funcionarios IS 'Política unificada de DELETE: apenas admin pode deletar';


--
-- Name: funcionarios funcionarios_unified_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_unified_insert ON public.funcionarios FOR INSERT WITH CHECK ((((public.current_user_tipo() = 'admin'::text) AND (usuario_tipo <> 'admin'::public.usuario_tipo_enum)) OR ((public.current_user_tipo() = 'gestor_rh'::text) AND (usuario_tipo = 'funcionario_clinica'::public.usuario_tipo_enum) AND (clinica_id = public.current_user_clinica_id())) OR ((public.current_user_tipo() = 'gestor_entidade'::text) AND (usuario_tipo = 'funcionario_entidade'::public.usuario_tipo_enum) AND (contratante_id = public.current_user_contratante_id()))));


--
-- Name: POLICY funcionarios_unified_insert ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_unified_insert ON public.funcionarios IS 'Política unificada de INSERT:
- Admin: cria qualquer tipo (exceto admin)
- Gestor RH: cria apenas funcionario_clinica na sua clínica
- Gestor Entidade: cria apenas funcionario_entidade na sua entidade';


--
-- Name: funcionarios funcionarios_unified_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_unified_select ON public.funcionarios FOR SELECT USING (((public.current_user_tipo() = 'admin'::text) OR ((public.current_user_tipo() = 'gestor_rh'::text) AND (clinica_id = public.current_user_clinica_id())) OR ((public.current_user_tipo() = 'gestor_entidade'::text) AND (contratante_id = public.current_user_contratante_id())) OR ((public.current_user_tipo() = 'emissor'::text) AND (usuario_tipo = ANY (ARRAY['funcionario_clinica'::public.usuario_tipo_enum, 'funcionario_entidade'::public.usuario_tipo_enum]))) OR ((cpf)::text = public.current_user_cpf())));


--
-- Name: POLICY funcionarios_unified_select ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_unified_select ON public.funcionarios IS 'Política unificada de SELECT:
- Admin: vê tudo
- Gestor RH: vê funcionários da clínica (via clinica_id)
- Gestor Entidade: vê funcionários da entidade (via contratante_id)
- Emissor: vê funcionários para emissão de laudos
- Funcionário: vê apenas próprios dados';


--
-- Name: funcionarios funcionarios_unified_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_unified_update ON public.funcionarios FOR UPDATE USING ((((public.current_user_tipo() = 'admin'::text) AND (usuario_tipo <> 'admin'::public.usuario_tipo_enum)) OR ((public.current_user_tipo() = 'gestor_rh'::text) AND (clinica_id = public.current_user_clinica_id())) OR ((public.current_user_tipo() = 'gestor_entidade'::text) AND (contratante_id = public.current_user_contratante_id())) OR ((cpf)::text = public.current_user_cpf()))) WITH CHECK (((usuario_tipo = ( SELECT funcionarios_1.usuario_tipo
   FROM public.funcionarios funcionarios_1
  WHERE ((funcionarios_1.cpf)::text = public.current_user_cpf()))) AND ((clinica_id = ( SELECT funcionarios_1.clinica_id
   FROM public.funcionarios funcionarios_1
  WHERE ((funcionarios_1.cpf)::text = public.current_user_cpf()))) OR ((clinica_id IS NULL) AND (( SELECT funcionarios_1.clinica_id
   FROM public.funcionarios funcionarios_1
  WHERE ((funcionarios_1.cpf)::text = public.current_user_cpf())) IS NULL))) AND ((contratante_id = ( SELECT funcionarios_1.contratante_id
   FROM public.funcionarios funcionarios_1
  WHERE ((funcionarios_1.cpf)::text = public.current_user_cpf()))) OR ((contratante_id IS NULL) AND (( SELECT funcionarios_1.contratante_id
   FROM public.funcionarios funcionarios_1
  WHERE ((funcionarios_1.cpf)::text = public.current_user_cpf())) IS NULL)))));


--
-- Name: POLICY funcionarios_unified_update ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY funcionarios_unified_update ON public.funcionarios IS 'Política unificada de UPDATE:
- Mesmas regras de SELECT
- WITH CHECK impede mudança de usuario_tipo e vínculos';


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
-- Name: laudos laudos_emissor_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_emissor_insert ON public.laudos FOR INSERT WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: laudos laudos_emissor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_emissor_select ON public.laudos FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: laudos laudos_emissor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_emissor_update ON public.laudos FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


--
-- Name: laudos laudos_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_rh_clinica ON public.laudos FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (EXISTS ( SELECT 1
   FROM public.lotes_avaliacao l
  WHERE ((l.id = laudos.lote_id) AND (l.clinica_id = public.current_user_clinica_id_optional()))))));


--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_emissor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_emissor_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'emissor'::text) AND ((status)::text = ANY ((ARRAY['finalizado'::character varying, 'concluido'::character varying])::text[]))));


--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: lotes_avaliacao lotes_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_clinica ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));


--
-- Name: lotes_avaliacao lotes_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_insert ON public.lotes_avaliacao FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_update ON public.lotes_avaliacao FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


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
-- Name: respostas respostas_own_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_own_insert ON public.respostas FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: respostas respostas_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_own_select ON public.respostas FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: respostas respostas_own_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_own_update ON public.respostas FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: respostas respostas_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_rh_clinica ON public.respostas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (EXISTS ( SELECT 1
   FROM (public.avaliacoes a
     JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((a.id = respostas.avaliacao_id) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


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
-- Name: resultados resultados_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_rh_clinica ON public.resultados FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (EXISTS ( SELECT 1
   FROM (public.avaliacoes a
     JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((a.id = resultados.avaliacao_id) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO dba_maintenance;


--
-- Name: TABLE analise_estatistica; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.analise_estatistica TO dba_maintenance;


--
-- Name: SEQUENCE analise_estatistica_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.analise_estatistica_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_access_denied; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_access_denied TO dba_maintenance;


--
-- Name: SEQUENCE audit_access_denied_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.audit_access_denied_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO dba_maintenance;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.audit_logs_id_seq TO dba_maintenance;


--
-- Name: TABLE audit_stats_by_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_stats_by_user TO dba_maintenance;


--
-- Name: TABLE auditoria; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_id_seq TO dba_maintenance;


--
-- Name: TABLE auditoria_laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_laudos TO dba_maintenance;


--
-- Name: SEQUENCE auditoria_laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_laudos_id_seq TO dba_maintenance;


--
-- Name: TABLE avaliacao_resets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacao_resets TO dba_maintenance;


--
-- Name: TABLE avaliacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacoes TO dba_maintenance;


--
-- Name: SEQUENCE avaliacoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.avaliacoes_id_seq TO dba_maintenance;


--
-- Name: TABLE backup_lotes_migracao_20260130; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.backup_lotes_migracao_20260130 TO dba_maintenance;


--
-- Name: TABLE clinicas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas TO dba_maintenance;


--
-- Name: TABLE clinicas_empresas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas_empresas TO dba_maintenance;


--
-- Name: SEQUENCE clinicas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.clinicas_id_seq TO dba_maintenance;


--
-- Name: TABLE contratacao_personalizada; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratacao_personalizada TO dba_maintenance;


--
-- Name: SEQUENCE contratacao_personalizada_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratacao_personalizada_id_seq TO dba_maintenance;


--
-- Name: TABLE contratantes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes TO dba_maintenance;


--
-- Name: TABLE contratantes_funcionarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes_funcionarios TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratantes_funcionarios_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratantes_id_seq TO dba_maintenance;


--
-- Name: TABLE contratantes_senhas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratantes_senhas TO dba_maintenance;


--
-- Name: SEQUENCE contratantes_senhas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratantes_senhas_id_seq TO dba_maintenance;


--
-- Name: TABLE contratos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos TO dba_maintenance;


--
-- Name: SEQUENCE contratos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratos_id_seq TO dba_maintenance;


--
-- Name: TABLE contratos_planos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos_planos TO dba_maintenance;


--
-- Name: SEQUENCE contratos_planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratos_planos_id_seq TO dba_maintenance;


--
-- Name: TABLE emissao_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.emissao_queue TO dba_maintenance;


--
-- Name: SEQUENCE emissao_queue_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.emissao_queue_id_seq TO dba_maintenance;


--
-- Name: TABLE empresas_clientes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.empresas_clientes TO dba_maintenance;


--
-- Name: SEQUENCE empresas_clientes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.empresas_clientes_id_seq TO dba_maintenance;


--
-- Name: TABLE fila_emissao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fila_emissao TO dba_maintenance;


--
-- Name: SEQUENCE fila_emissao_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.fila_emissao_id_seq TO dba_maintenance;


--
-- Name: TABLE funcionarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO dba_maintenance;


--
-- Name: SEQUENCE funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.funcionarios_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_arquivos_remotos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_arquivos_remotos TO dba_maintenance;


--
-- Name: SEQUENCE laudo_arquivos_remotos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_arquivos_remotos_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_downloads; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_downloads TO dba_maintenance;


--
-- Name: SEQUENCE laudo_downloads_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_downloads_id_seq TO dba_maintenance;


--
-- Name: TABLE laudo_generation_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_generation_jobs TO dba_maintenance;


--
-- Name: SEQUENCE laudo_generation_jobs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_generation_jobs_id_seq TO dba_maintenance;


--
-- Name: TABLE laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudos TO dba_maintenance;


--
-- Name: SEQUENCE laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudos_id_seq TO dba_maintenance;


--
-- Name: TABLE lote_id_allocator; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lote_id_allocator TO dba_maintenance;


--
-- Name: SEQUENCE lote_id_allocator_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.lote_id_allocator_id_seq TO dba_maintenance;


--
-- Name: TABLE lotes_avaliacao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lotes_avaliacao TO dba_maintenance;


--
-- Name: SEQUENCE lotes_avaliacao_funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_funcionarios_id_seq TO dba_maintenance;


--
-- Name: SEQUENCE lotes_avaliacao_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_id_seq TO dba_maintenance;


--
-- Name: TABLE mfa_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mfa_codes TO dba_maintenance;


--
-- Name: SEQUENCE mfa_codes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.mfa_codes_id_seq TO dba_maintenance;


--
-- Name: TABLE migration_guidelines; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.migration_guidelines TO dba_maintenance;


--
-- Name: SEQUENCE migration_guidelines_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.migration_guidelines_id_seq TO dba_maintenance;


--
-- Name: TABLE notificacoes_admin; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes_admin TO dba_maintenance;


--
-- Name: SEQUENCE notificacoes_admin_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.notificacoes_admin_id_seq TO dba_maintenance;


--
-- Name: TABLE pagamentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pagamentos TO dba_maintenance;


--
-- Name: SEQUENCE pagamentos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.pagamentos_id_seq TO dba_maintenance;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO dba_maintenance;


--
-- Name: SEQUENCE permissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.permissions_id_seq TO dba_maintenance;


--
-- Name: TABLE planos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planos TO dba_maintenance;


--
-- Name: SEQUENCE planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.planos_id_seq TO dba_maintenance;


--
-- Name: TABLE policy_expression_backups; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.policy_expression_backups TO dba_maintenance;


--
-- Name: SEQUENCE policy_expression_backups_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.policy_expression_backups_id_seq TO dba_maintenance;


--
-- Name: TABLE questao_condicoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.questao_condicoes TO dba_maintenance;


--
-- Name: SEQUENCE questao_condicoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.questao_condicoes_id_seq TO dba_maintenance;


--
-- Name: TABLE recibos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.recibos TO dba_maintenance;


--
-- Name: SEQUENCE recibos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.recibos_id_seq TO dba_maintenance;


--
-- Name: TABLE relatorio_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.relatorio_templates TO dba_maintenance;


--
-- Name: SEQUENCE relatorio_templates_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.relatorio_templates_id_seq TO dba_maintenance;


--
-- Name: TABLE respostas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.respostas TO dba_maintenance;


--
-- Name: SEQUENCE respostas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.respostas_id_seq TO dba_maintenance;


--
-- Name: TABLE resultados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.resultados TO dba_maintenance;


--
-- Name: SEQUENCE resultados_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.resultados_id_seq TO dba_maintenance;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO dba_maintenance;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO dba_maintenance;


--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.roles_id_seq TO dba_maintenance;


--
-- Name: TABLE suspicious_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suspicious_activity TO dba_maintenance;


--
-- Name: TABLE v_auditoria_emissoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_auditoria_emissoes TO dba_maintenance;


--
-- Name: TABLE v_relatorio_emissoes_usuario; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_relatorio_emissoes_usuario TO dba_maintenance;


--
-- Name: TABLE vw_alertas_emissao_laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_alertas_emissao_laudos TO dba_maintenance;


--
-- Name: TABLE vw_alertas_lotes_stuck; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_alertas_lotes_stuck TO dba_maintenance;


--
-- Name: TABLE vw_analise_grupos_negativos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_analise_grupos_negativos TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_avaliacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_avaliacoes TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_laudos TO dba_maintenance;


--
-- Name: TABLE vw_auditoria_lotes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_lotes TO dba_maintenance;


--
-- Name: TABLE vw_comparativo_empresas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_comparativo_empresas TO dba_maintenance;


--
-- Name: TABLE vw_funcionarios_por_lote; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_funcionarios_por_lote TO dba_maintenance;


--
-- Name: TABLE vw_health_check_contratantes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_health_check_contratantes TO dba_maintenance;


--
-- Name: TABLE vw_lotes_por_contratante; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_lotes_por_contratante TO dba_maintenance;


--
-- Name: TABLE vw_metricas_emissao_laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_metricas_emissao_laudos TO dba_maintenance;


--
-- Name: TABLE vw_recibos_completos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_recibos_completos TO dba_maintenance;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO dba_maintenance;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO dba_maintenance;


--
-- PostgreSQL database dump complete
--

