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

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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

COMMENT ON TYPE public.perfil_usuario_enum IS 'Perfis vÃ¡lidos de usuÃ¡rios no sistema: funcionario (usa o sistema), rh (gerencia empresas/funcionÃ¡rios), admin (administraÃ§Ã£o geral), emissor (emite laudos)';


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
    'pagamento_confirmado'
);


--
-- Name: status_avaliacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_avaliacao AS ENUM (
    'pendente',
    'em_andamento',
    'concluida',
    'liberada',
    'iniciada'
);


--
-- Name: TYPE status_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_avaliacao IS 'Status de avaliações: liberada (criada mas não acessada), iniciada (primeiro acesso), em_andamento (progresso), concluida (finalizada), inativada (cancelada)';


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

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliaÃ§Ãµes: iniciada (criada mas nÃ£o respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';


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
    'rascunho',
    'emitido',
    'enviado'
);


--
-- Name: TYPE status_laudo_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_laudo_enum IS 'Status de laudos: rascunho (em ediÃ§Ã£o), emitido (finalizado), enviado (enviado ao cliente)';


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
    'concluido',
    'rascunho'
);


--
-- Name: TYPE status_lote_enum; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliaÃ§Ãµes concluÃ­das), concluido (sinÃ´nimo), rascunho (em criaÃ§Ã£o)';


--
-- Name: tipo_contratante_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_contratante_enum AS ENUM (
    'clinica',
    'entidade'
);


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

COMMENT ON TYPE public.tipo_lote_enum IS 'Tipo de lote: completo (todos funcionÃ¡rios), operacional (apenas operacionais), gestao (apenas gestores)';


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
    'emissao_solicitada_sucesso'
);


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
    'rh',
    'gestor',
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

COMMENT ON FUNCTION public.audit_trigger_func() IS 'Trigger de auditoria que permite user_cpf e user_perfil NULL quando contexto nÃ£o estÃ¡ setado (usa NULLIF para converter string vazia em NULL)';


--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionÃ¡rios devem ser incluÃ­dos no prÃ³ximo lote com base em Ã­ndice, data (>1 ano) e novos funcionÃ¡rios';


--
-- Name: calcular_elegibilidade_lote_contratante(integer, integer); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) IS 'Ajustada para incluir <= p_numero_lote_atual - 1';


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

COMMENT ON FUNCTION public.calcular_hash_pdf(pdf_data bytea) IS 'Calcula hash SHA-256 de um PDF para validação de integridade';


--
-- Name: calcular_vigencia_fim(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_vigencia_fim(data_inicio date) RETURNS date
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- VigÃªncia de 364 dias a partir da data de inÃ­cio

    RETURN data_inicio + INTERVAL '364 days';

END;

$$;


--
-- Name: FUNCTION calcular_vigencia_fim(data_inicio date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calcular_vigencia_fim(data_inicio date) IS 'Calcula data fim da vigÃªncia (data inÃ­cio + 364 dias)';


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
-- Name: current_user_contratante_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_contratante_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$

DECLARE

  v_id TEXT;

BEGIN

  v_id := NULLIF(current_setting('app.current_user_contratante_id', TRUE), '');

  

  -- SECURITY: For gestor perfil, contratante_id is mandatory

  IF v_id IS NULL AND current_user_perfil() = 'gestor' THEN

    RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not set for perfil gestor.';

  END IF;

  

  RETURN v_id::INTEGER;

EXCEPTION

  WHEN undefined_object THEN

    -- For non-gestor users, NULL is acceptable

    IF current_user_perfil() = 'gestor' THEN

      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor.';

    END IF;

    RETURN NULL;

  WHEN SQLSTATE '22023' THEN

    IF current_user_perfil() = 'gestor' THEN

      RAISE EXCEPTION 'SECURITY: app.current_user_contratante_id not configured for gestor.';

    END IF;

    RETURN NULL;

END;

$$;


--
-- Name: FUNCTION current_user_contratante_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_contratante_id() IS 'Returns current user contratante_id from session context.

   RAISES EXCEPTION if not set for perfil gestor (prevents NULL bypass).

   Returns NULL for other perfis (acceptable).';


--
-- Name: current_user_contratante_id_optional(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_contratante_id_optional() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_contratante_id', TRUE), '')::INTEGER;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;


--
-- Name: FUNCTION current_user_contratante_id_optional(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.current_user_contratante_id_optional() IS 'Retorna o contratante_id do contexto da sessÃ£o para RLS de entidades';


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

    LEFT JOIN entidades_senhas cs ON fe.solicitado_por = cs.cpf

    WHERE l.id = p_laudo_id

    AND fe.solicitado_por IS NOT NULL;

END;

$$;


--
-- Name: FUNCTION fn_buscar_solicitante_laudo(p_laudo_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) IS 'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';


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
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliaÃ§Ã£o muda de status. Marca lote como concluÃ­do quando todas avaliaÃ§Ãµes liberadas estÃ£o finalizadas (concluÃ­das ou inativadas). EmissÃ£o de laudo Ã© 100% MANUAL.';


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


--
-- Name: FUNCTION fn_reservar_id_laudo_on_lote_insert(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_reservar_id_laudo_on_lote_insert() IS 'Reserva ID do laudo (igual ao ID do lote) quando lote Ã© criado.

Laudo fica em status=rascunho atÃ© emissor gerar o PDF.

Garante que laudo.id === lote.id sempre.';


--
-- Name: gerar_codigo_lote(); Type: FUNCTION; Schema: public; Owner: -
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



    SELECT COALESCE(MAX(CAST(SPLIT_PART( '-', 1) AS INTEGER)), 0) + 1



    INTO sequencial



    FROM lotes_avaliacao la



    WHERE la.codigo LIKE '%-' || data_atual;







    -- Formatar cÃ³digo com zeros Ã  esquerda



    codigo := LPAD(sequencial::TEXT, 3, '0') || '-' || data_atual;







    RETURN codigo;



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
  v_concatenado := p_entidade_tipo || '|' || COALESCE(p_entidade_id::TEXT, 'NULL') || '|' || p_acao || '|' || COALESCE(p_dados::TEXT, '{}') || '|' || p_timestamp::TEXT;
  RETURN encode(digest(v_concatenado, 'sha256'), 'hex');
END;
$$;


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

COMMENT ON FUNCTION public.gerar_numero_recibo() IS 'Gera nÃºmero Ãºnico de recibo no formato REC-AAAA-NNNNN';


--
-- Name: get_contratante_funcionario(integer); Type: FUNCTION; Schema: public; Owner: -
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

COMMENT ON FUNCTION public.is_valid_perfil(p_perfil text) IS 'Valida se um texto corresponde a um perfil vÃ¡lido do ENUM';


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
-- Name: notificar_pre_cadastro_criado(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: notificar_valor_definido(); Type: FUNCTION; Schema: public; Owner: -
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

    'gestor',

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

    lote_codigo VARCHAR;

BEGIN

    -- Buscar informações do lote

    SELECT emitido_em, codigo INTO lote_emitido_em, lote_codigo

    FROM lotes_avaliacao

    WHERE id = NEW.lote_id;

    

    -- Se o laudo foi emitido, bloquear modificação

    IF lote_emitido_em IS NOT NULL THEN

        RAISE EXCEPTION 

            'Não é possível modificar avaliação do lote % (código: %). Laudo foi emitido em %.',

            NEW.lote_id, lote_codigo, lote_emitido_em

        USING 

            ERRCODE = 'integrity_constraint_violation',

            HINT = 'Laudos emitidos são imutáveis para garantir integridade';

    END IF;

    

    RETURN NEW;

END;

$$;


--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificação de avaliações após emissão do laudo (imutabilidade)';


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


--
-- Name: FUNCTION prevent_modification_lote_when_laudo_emitted(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido, mas permite atualizações de campos de data';


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


--
-- Name: FUNCTION prevent_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_mutation_during_emission() IS 'Previne alterações em campos críticos de avaliações quando o laudo do lote já foi emitido. Atualizada em migration 099 para remover referência ao campo processamento_em removido.';


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
-- Name: update_entidades_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_entidades_senhas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


--
-- Name: update_contratantes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_contratantes_updated_at() RETURNS trigger
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


--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote estÃ¡ pronto para laudo (Ã­ndice completo); retorna alertas e mÃ©tricas (anomalias reportadas como alertas, NÃƒO bloqueantes)';


--
-- Name: validar_sessao_rls(); Type: FUNCTION; Schema: public; Owner: -
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

    IF v_perfil IN ('gestor', 'rh', 'entidade') THEN

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

COMMENT ON FUNCTION public.validar_sessao_rls() IS 'Valida que todas as variáveis de contexto RLS necessárias estão configuradas antes de executar queries sensíveis';


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
-- Name: verificar_cancelamento_automatico_lote(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION verificar_cancelamento_automatico_lote(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_cancelamento_automatico_lote() IS 'Cancela automaticamente o lote quando todas as avaliaÃ§Ãµes sÃ£o inativadas';


--
-- Name: verificar_conclusao_lote(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION verificar_conclusao_lote(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_conclusao_lote() IS 'Atualiza lote para concluÃ­do e agenda envio (emissÃ£o Ã© imediata)';


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

  SELECT la.numero_ordem, a.statusINTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo

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


--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Verifica se funcionÃ¡rio pode ter avaliaÃ§Ã£o inativada (impede 2Âª consecutiva)';


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


--
-- Name: FUNCTION verificar_integridade_recibo(recibo_id integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verificar_integridade_recibo(recibo_id integer) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';


SET default_table_access_method = heap;

--
-- Name: backup_laudos_contratante_1; Type: TABLE; Schema: backups; Owner: -
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


--
-- Name: backup_resultados_contratante_1; Type: TABLE; Schema: backups; Owner: -
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
    CONSTRAINT chk_audit_logs_user_cpf_format CHECK (((user_cpf IS NULL) OR (length(user_cpf) = 11)))
);


--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as aÃƒÂ§ÃƒÂµes crÃƒÂ­ticas no sistema';


--
-- Name: COLUMN audit_logs.user_cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.user_cpf IS 'CPF do usuÃ¡rio que executou a aÃ§Ã£o. NULL indica aÃ§Ã£o automÃ¡tica do sistema.';


--
-- Name: COLUMN audit_logs.user_perfil; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.audit_logs.user_perfil IS 'Perfil do usuÃ¡rio que executou a aÃ§Ã£o (pode ser NULL para operaÃ§Ãµes sem contexto de sessÃ£o)';


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
    criado_em timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissÃ£o, envio, reprocessamentos)';


--
-- Name: COLUMN auditoria_laudos.acao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.acao IS 'AÃ§Ã£o executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';


--
-- Name: COLUMN auditoria_laudos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';


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

COMMENT ON COLUMN public.avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor)';


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
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY (ARRAY[('iniciada'::character varying)::text, ('em_andamento'::character varying)::text, ('concluida'::character varying)::text, ('inativada'::character varying)::text])))
);


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
-- Name: backup_lotes_migracao_20260130; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN clinicas.nome_fantasia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinicas.nome_fantasia IS 'Nome fantasia/razÃ£o exibida para pessoas jurÃ­dicas (sinÃ´nimo de nome)';


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
-- Name: clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;


--
-- Name: contratacao_personalizada; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE contratacao_personalizada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contratacao_personalizada IS 'Tabela de compatibilidade para contratacao personalizada (fluxo legacy e testes)';


--
-- Name: COLUMN contratacao_personalizada.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.status IS 'Estados: aguardando_valor, valor_definido, aguardando_pagamento, pagamento_confirmado, cancelado';


--
-- Name: COLUMN contratacao_personalizada.link_enviado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratacao_personalizada.link_enviado_em IS 'Timestamp de quando o link de pagamento foi gerado/enviado ao contratante';


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
-- Name: contratantes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE contratantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contratantes IS 'Tabela unificada para clÃ­nicas e entidades privadas';


--
-- Name: COLUMN contratantes.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.tipo IS 'clinica: medicina ocupacional com empresas intermediÃ¡rias | entidade: empresa privada com vÃ­nculo direto';


--
-- Name: COLUMN contratantes.responsavel_nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN contratantes.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.status IS 'Status de aprovaÃ§Ã£o para novos cadastros';


--
-- Name: COLUMN contratantes.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';


--
-- Name: COLUMN contratantes.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios para o contratante';


--
-- Name: COLUMN contratantes.plano_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.plano_id IS 'ID do plano associado ao contratante';


--
-- Name: COLUMN contratantes.data_liberacao_login; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contratantes.data_liberacao_login IS 'Data em que o login foi liberado apÃ³s confirmaÃ§Ã£o de pagamento';


--
-- Name: contratantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratantes_id_seq OWNED BY public.contratantes.id;


--
-- Name: entidades_senhas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entidades_senhas (
    id integer NOT NULL,
    contratante_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash text NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp with time zone,
    CONSTRAINT entidades_senhas_cpf_check CHECK (((cpf)::text ~ '^\d{11}$'::text))
);


--
-- Name: TABLE entidades_senhas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.entidades_senhas IS 'Senhas hash para gestores de entidades fazerem login';


--
-- Name: COLUMN entidades_senhas.cpf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades_senhas.cpf IS 'CPF do responsavel_cpf em contratantes - usado para login';


--
-- Name: COLUMN entidades_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.entidades_senhas.primeira_senha_alterada IS 'Flag para forÃ§ar alteraÃ§Ã£o de senha no primeiro acesso';


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
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
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
    clinica_id integer,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contratante_id integer,
    representante_nome text,
    representante_fone character varying(30),
    representante_email character varying(100),
    CONSTRAINT empresas_clientes_parent_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL))))
);


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
    CONSTRAINT funcionarios_nivel_cargo_check CHECK (((((perfil)::text = 'funcionario'::text) AND ((nivel_cargo)::text = ANY (ARRAY[('operacional'::character varying)::text, ('gestao'::character varying)::text]))) OR (((perfil)::text <> 'funcionario'::text) AND (nivel_cargo IS NULL))))
);


--
-- Name: COLUMN funcionarios.ultima_avaliacao_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.ultima_avaliacao_id IS 'ID da Ãºltima avaliaÃ§Ã£o concluÃ­da ou inativada (denormalizado para performance)';


--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da Ãºltima avaliaÃ§Ã£o vÃ¡lida concluÃ­da (usado para verificar prazo de 1 ano)';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'NÃºmero sequencial da Ãºltima avaliaÃ§Ã£o concluÃ­da pelo funcionÃ¡rio (0 = nunca fez)';


--
-- Name: equipe_administrativa; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW equipe_administrativa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.equipe_administrativa IS 'View semÃ¢ntica para equipe administrativa da plataforma.

Inclui administradores do sistema e emissores de laudos.

Facilita auditoria e gestÃ£o de acessos especiais.';


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
    atualizado_em timestamp without time zone DEFAULT now(),
    solicitado_por character varying(11),
    solicitado_em timestamp without time zone DEFAULT now(),
    tipo_solicitante character varying(20),
    CONSTRAINT chk_fila_emissao_solicitante CHECK (((solicitado_por IS NULL) OR ((solicitado_por IS NOT NULL) AND (tipo_solicitante IS NOT NULL)))),
    CONSTRAINT fila_emissao_tipo_solicitante_check CHECK ((((tipo_solicitante)::text = ANY (ARRAY[('rh'::character varying)::text, ('gestor'::character varying)::text, ('admin'::character varying)::text])) OR (tipo_solicitante IS NULL)))
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
-- Name: COLUMN fila_emissao.solicitado_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.solicitado_por IS 'CPF do RH ou gestor que solicitou a emissão manual do laudo';


--
-- Name: COLUMN fila_emissao.solicitado_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.solicitado_em IS 'Timestamp exato da solicitação manual de emissão';


--
-- Name: COLUMN fila_emissao.tipo_solicitante; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fila_emissao.tipo_solicitante IS 'Perfil do usuário que solicitou: rh, gestor ou admin';


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fila_emissao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fila_emissao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fila_emissao_id_seq OWNED BY public.fila_emissao.id;


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
-- Name: funcionarios_operacionais; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW funcionarios_operacionais; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.funcionarios_operacionais IS 'View semÃ¢ntica para funcionÃ¡rios operacionais que realizam avaliaÃ§Ãµes.

Exclui gestores, admins e emissores.

Facilita queries de RH e relatÃ³rios de funcionÃ¡rios.';


--
-- Name: gestores; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.gestores AS
 SELECT id,
    cpf,
    nome,
    email,
    usuario_tipo,
    perfil,
        CASE
            WHEN (usuario_tipo = 'rh'::public.usuario_tipo_enum) THEN 'RH (ClÃ­nica)'::text
            WHEN (usuario_tipo = 'gestor'::public.usuario_tipo_enum) THEN 'Entidade'::text
            ELSE 'Outro'::text
        END AS tipo_gestor_descricao,
    clinica_id,
    contratante_id,
    ativo,
    criado_em,
    atualizado_em
   FROM public.funcionarios
  WHERE (usuario_tipo = ANY (ARRAY['rh'::public.usuario_tipo_enum, 'gestor'::public.usuario_tipo_enum]));


--
-- Name: VIEW gestores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.gestores IS 'View semÃ¢ntica para todos os gestores do sistema.

Inclui gestores de RH (clÃ­nicas) e gestores de entidades.

Facilita queries que precisam apenas de gestores administrativos.';


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
    CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (((emitido_em IS NULL) OR (emissor_cpf IS NOT NULL))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id)),
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text])))
);


--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: -
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
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do PDF do laudo gerado, usado para integridade e auditoria';


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
    hash_pdf character varying(64),
    numero_ordem integer DEFAULT 1 NOT NULL,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    cancelado_automaticamente boolean DEFAULT false,
    motivo_cancelamento text,
    modo_emergencia boolean DEFAULT false,
    motivo_emergencia text,
    processamento_em timestamp without time zone,
    setor_id integer,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('cancelado'::character varying)::text, ('finalizado'::character varying)::text, ('concluido'::character varying)::text, ('rascunho'::character varying)::text]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


--
-- Name: COLUMN lotes_avaliacao.liberado_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.liberado_por IS 'CPF do gestor que liberou o lote. Referencia entidades_senhas(cpf) para gestores de entidade ou RH de clÃ­nica';


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

COMMENT ON COLUMN public.lotes_avaliacao.enviado_em IS 'Data/hora em que o laudo foi enviado (notificaÃ§Ã£o disparada)';


--
-- Name: COLUMN lotes_avaliacao.cancelado_automaticamente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.cancelado_automaticamente IS 'Indica se o lote foi cancelado automaticamente pelo sistema';


--
-- Name: COLUMN lotes_avaliacao.motivo_cancelamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_cancelamento IS 'Motivo do cancelamento automÃ¡tico';


--
-- Name: COLUMN lotes_avaliacao.modo_emergencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.modo_emergencia IS 'Indica se laudo foi emitido via modo emergÃªncia (flag)';


--
-- Name: COLUMN lotes_avaliacao.motivo_emergencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lotes_avaliacao.motivo_emergencia IS 'Justificativa para uso do modo emergÃªncia';


--
-- Name: CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON public.lotes_avaliacao IS 'Constraint padronizada: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado), rascunho (em criação)';


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
    CONSTRAINT notificacao_destinatario_valido CHECK ((length(destinatario_cpf) > 0)),
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor'::text, 'funcionario'::text])))
);


--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificacoes em tempo real para admin e gestores';


--
-- Name: COLUMN notificacoes.dados_contexto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.dados_contexto IS 'JSONB com dados adicionais especificos do tipo de notificacao';


--
-- Name: COLUMN notificacoes.expira_em; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.expira_em IS 'Data de expiracao da notificacao (limpeza automatica)';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes_admin (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    lote_id integer,
    visualizada boolean DEFAULT false,
    criado_em timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes_admin IS 'NotificaÃ§Ãµes crÃ­ticas para administradores do sistema';


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
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pagamentos IS 'Registro de pagamentos de contratantes';


--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'NÃºmero de parcelas do pagamento (1 = Ã  vista, 2-12 = parcelado)';


--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'ReferÃªncia opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';


--
-- Name: COLUMN pagamentos.idempotency_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.idempotency_key IS 'Chave de idempotÃªncia para evitar duplicaÃ§Ã£o de pagamentos (opcional)';


--
-- Name: COLUMN pagamentos.external_transaction_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.external_transaction_id IS 'ID da transaÃ§Ã£o no gateway de pagamento (Stripe, Mercado Pago, etc) para rastreamento';


--
-- Name: COLUMN pagamentos.provider_event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pagamentos.provider_event_id IS 'ID Ãºnico do evento do provedor de pagamento (para deduplicaÃ§Ã£o de webhooks)';


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

COMMENT ON COLUMN public.planos.caracteristicas IS 'CaracterÃ­sticas e benefÃ­cios do plano';


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


--
-- Name: TABLE recibos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.recibos IS 'Recibos financeiros gerados apÃ³s confirmaÃ§Ã£o de pagamento, separados do contrato de serviÃ§o';


--
-- Name: COLUMN recibos.numero_recibo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.numero_recibo IS 'NÃºmero Ãºnico do recibo no formato REC-AAAA-NNNNN';


--
-- Name: COLUMN recibos.vigencia_inicio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.vigencia_inicio IS 'Data de inÃ­cio da vigÃªncia = data do pagamento';


--
-- Name: COLUMN recibos.vigencia_fim; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.vigencia_fim IS 'Data de fim da vigÃªncia = data_pagamento + 364 dias';


--
-- Name: COLUMN recibos.numero_funcionarios_cobertos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.numero_funcionarios_cobertos IS 'Quantidade de funcionÃ¡rios cobertos pelo plano contratado';


--
-- Name: COLUMN recibos.valor_total_anual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.valor_total_anual IS 'Valor total anual do plano';


--
-- Name: COLUMN recibos.valor_por_funcionario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.valor_por_funcionario IS 'Valor cobrado por funcionÃ¡rio (se aplicÃ¡vel)';


--
-- Name: COLUMN recibos.detalhes_parcelas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.detalhes_parcelas IS 'JSON com detalhamento de cada parcela e vencimento';


--
-- Name: COLUMN recibos.descricao_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.descricao_pagamento IS 'DescriÃ§Ã£o textual da forma de pagamento para incluir no PDF';


--
-- Name: COLUMN recibos.pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.pdf IS 'PDF binÃ¡rio do recibo (BYTEA)';


--
-- Name: COLUMN recibos.hash_pdf; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.hash_pdf IS 'Hash SHA-256 do PDF binÃ¡rio em hexadecimal (64 caracteres)';


--
-- Name: COLUMN recibos.ip_emissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.ip_emissao IS 'EndereÃ§o IP de onde o recibo foi emitido';


--
-- Name: COLUMN recibos.emitido_por; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.emitido_por IS 'CPF do usuÃ¡rio que emitiu o recibo (formato: XXX.XXX.XXX-XX)';


--
-- Name: COLUMN recibos.hash_incluso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.hash_incluso IS 'Indica se o hash foi incluÃ­do no rodapÃ© do PDF';


--
-- Name: COLUMN recibos.backup_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';


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
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    cpf text NOT NULL,
    nome text,
    role text DEFAULT 'admin'::text NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuarios IS 'Tabela de usuÃ¡rios do sistema (mÃ­nima para compatibilidade em DEV)';


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
-- Name: usuarios_resumo; Type: VIEW; Schema: public; Owner: -
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
            WHEN 'rh'::public.usuario_tipo_enum THEN 3
            WHEN 'gestor'::public.usuario_tipo_enum THEN 4
            WHEN 'funcionario_clinica'::public.usuario_tipo_enum THEN 5
            WHEN 'funcionario_entidade'::public.usuario_tipo_enum THEN 6
            ELSE NULL::integer
        END;


--
-- Name: VIEW usuarios_resumo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.usuarios_resumo IS 'View analÃ­tica com resumo estatÃ­stico de usuÃ¡rios por tipo.

Ãštil para dashboards administrativos e relatÃ³rios gerenciais.';


--
-- Name: v_auditoria_emissoes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_auditoria_emissoes AS
 SELECT l.id AS laudo_id,
    l.lote_id,
    
    la.contratante_id,
    la.empresa_id,
    fe.solicitado_por AS solicitante_cpf,
    fe.tipo_solicitante AS solicitante_perfil,
    fe.solicitado_em,
    l.emissor_cpf,
    l.emitido_em,
    l.status AS laudo_status,
    la.status AS lote_status,
    l.hash_pdf,
    al.acao AS ultima_acao,
    al.criado_em AS auditoria_em
   FROM (((public.laudos l
     JOIN public.lotes_avaliacao la ON ((l.lote_id = la.id)))
     LEFT JOIN public.fila_emissao fe ON ((l.lote_id = fe.lote_id)))
     LEFT JOIN LATERAL ( SELECT auditoria_laudos.acao,
            auditoria_laudos.criado_em
           FROM public.auditoria_laudos
          WHERE (auditoria_laudos.lote_id = l.lote_id)
          ORDER BY auditoria_laudos.criado_em DESC
         LIMIT 1) al ON (true))
  ORDER BY l.emitido_em DESC NULLS LAST;


--
-- Name: VIEW v_auditoria_emissoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View consolidada para auditoria: liga solicitante → emissor → laudo com rastreabilidade completa';


--
-- Name: v_relatorio_emissoes_usuario; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW v_relatorio_emissoes_usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_relatorio_emissoes_usuario IS 'Relatório estatístico de emissões por usuário (RH ou gestor) para auditoria e compliance';


--
-- Name: vw_analise_grupos_negativos; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';


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
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);


--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: contratacao_personalizada id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratacao_personalizada ALTER COLUMN id SET DEFAULT nextval('public.contratacao_personalizada_id_seq'::regclass);


--
-- Name: contratantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratantes ALTER COLUMN id SET DEFAULT nextval('public.contratantes_id_seq'::regclass);


--
-- Name: entidades_senhas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas ALTER COLUMN id SET DEFAULT nextval('public.entidades_senhas_id_seq'::regclass);


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
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


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
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


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
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


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
-- Name: clinicas clinicas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_cnpj_key UNIQUE (cnpj);


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
-- Name: contratacao_personalizada contratacao_personalizada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_pkey PRIMARY KEY (id);


--
-- Name: contratantes contratantes_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_cnpj_unique UNIQUE (cnpj);


--
-- Name: contratantes contratantes_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_email_unique UNIQUE (email);


--
-- Name: contratantes contratantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_pkey PRIMARY KEY (id);


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
-- Name: empresas_clientes empresas_clientes_cnpj_clinica_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_clinica_key UNIQUE (clinica_id, cnpj);


--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);


--
-- Name: fila_emissao fila_emissao_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_unique UNIQUE (lote_id);


--
-- Name: fila_emissao fila_emissao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


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
-- Name: lotes_avaliacao lotes_avaliacao_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_codigo_key UNIQUE (codigo);


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
-- Name: entidades_senhas_contratante_cpf_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX entidades_senhas_contratante_cpf_unique ON public.entidades_senhas USING btree (contratante_id, cpf);


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
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


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
-- Name: idx_auditoria_laudos_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_criado ON public.auditoria_laudos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_laudos_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_laudos_lote ON public.auditoria_laudos USING btree (lote_id);


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
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);


--
-- Name: idx_clinicas_contratante_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clinicas_contratante_id_unique ON public.clinicas USING btree (contratante_id);


--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);


--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);


--
-- Name: idx_contratacao_personalizada_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratacao_personalizada_contratante ON public.contratacao_personalizada USING btree (contratante_id);


--
-- Name: idx_contratacao_personalizada_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratacao_personalizada_token ON public.contratacao_personalizada USING btree (payment_link_token);


--
-- Name: idx_contratantes_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_ativa ON public.contratantes USING btree (ativa);


--
-- Name: idx_contratantes_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_cnpj ON public.contratantes USING btree (cnpj);


--
-- Name: idx_contratantes_data_liberacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_data_liberacao ON public.contratantes USING btree (data_liberacao_login);


--
-- Name: idx_entidades_senhas_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entidades_senhas_contratante ON public.entidades_senhas USING btree (contratante_id);


--
-- Name: idx_entidades_senhas_contratante_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entidades_senhas_contratante_id ON public.entidades_senhas USING btree (contratante_id);


--
-- Name: idx_entidades_senhas_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entidades_senhas_cpf ON public.entidades_senhas USING btree (cpf);


--
-- Name: idx_contratantes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_status ON public.contratantes USING btree (status);


--
-- Name: idx_contratantes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_tipo ON public.contratantes USING btree (tipo);


--
-- Name: idx_contratantes_tipo_ativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratantes_tipo_ativa ON public.contratantes USING btree (tipo, ativa);


--
-- Name: idx_contratos_contratante_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_contratante_id ON public.contratos USING btree (contratante_id);


--
-- Name: idx_contratos_planos_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_planos_clinica ON public.contratos_planos USING btree (clinica_id);


--
-- Name: idx_contratos_planos_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_planos_contratante ON public.contratos_planos USING btree (contratante_id);


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
-- Name: idx_fila_emissao_lote_tentativas_pendentes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_lote_tentativas_pendentes ON public.fila_emissao USING btree (lote_id) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_proxima_tentativa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_proxima_tentativa ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_fila_emissao_solicitado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_solicitado_em ON public.fila_emissao USING btree (solicitado_em DESC);


--
-- Name: idx_fila_emissao_solicitado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_solicitado_por ON public.fila_emissao USING btree (solicitado_por);


--
-- Name: idx_fila_emissao_solicitante_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_solicitante_data ON public.fila_emissao USING btree (solicitado_por, solicitado_em DESC) WHERE (solicitado_por IS NOT NULL);


--
-- Name: idx_fila_emissao_tipo_solicitante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_emissao_tipo_solicitante ON public.fila_emissao USING btree (tipo_solicitante);


--
-- Name: idx_fila_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_lote ON public.fila_emissao USING btree (lote_id);


--
-- Name: idx_fila_pendente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fila_pendente ON public.fila_emissao USING btree (proxima_tentativa) WHERE (tentativas < max_tentativas);


--
-- Name: idx_funcionarios_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_clinica ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_clinica_id ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_perfil_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_clinica_perfil_ativo ON public.funcionarios USING btree (clinica_id, perfil, ativo);


--
-- Name: idx_funcionarios_contratante_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_contratante_id ON public.funcionarios USING btree (contratante_id);


--
-- Name: idx_funcionarios_cpf_clinica_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_cpf_clinica_perfil ON public.funcionarios USING btree (cpf, clinica_id, perfil) WHERE (((perfil)::text = 'rh'::text) AND (ativo = true));


--
-- Name: idx_funcionarios_cpf_perfil_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_cpf_perfil_ativo ON public.funcionarios USING btree (cpf, perfil, ativo);


--
-- Name: idx_funcionarios_data_ultimo_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_data_ultimo_lote ON public.funcionarios USING btree (data_ultimo_lote) WHERE (data_ultimo_lote IS NOT NULL);


--
-- Name: idx_funcionarios_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_empresa ON public.funcionarios USING btree (empresa_id);


--
-- Name: idx_funcionarios_indice_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_indice_avaliacao ON public.funcionarios USING btree (indice_avaliacao);


--
-- Name: idx_funcionarios_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_matricula ON public.funcionarios USING btree (matricula);


--
-- Name: idx_funcionarios_pendencias; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_pendencias ON public.funcionarios USING btree (empresa_id, ativo, indice_avaliacao, data_ultimo_lote) WHERE (ativo = true);


--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);


--
-- Name: idx_funcionarios_perfil_entities; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_perfil_entities ON public.funcionarios USING btree (perfil, clinica_id, contratante_id);


--
-- Name: idx_funcionarios_tipo_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_tipo_clinica ON public.funcionarios USING btree (usuario_tipo, clinica_id) WHERE (clinica_id IS NOT NULL);


--
-- Name: idx_funcionarios_tipo_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_tipo_contratante ON public.funcionarios USING btree (usuario_tipo, contratante_id) WHERE (contratante_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_ultima_avaliacao ON public.funcionarios USING btree (ultima_avaliacao_id) WHERE (ultima_avaliacao_id IS NOT NULL);


--
-- Name: idx_funcionarios_ultima_avaliacao_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_ultima_avaliacao_status ON public.funcionarios USING btree (ultima_avaliacao_status) WHERE (ultima_avaliacao_status IS NOT NULL);


--
-- Name: idx_funcionarios_usuario_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_usuario_tipo ON public.funcionarios USING btree (usuario_tipo);


--
-- Name: idx_funcionarios_usuario_tipo_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_funcionarios_usuario_tipo_ativo ON public.funcionarios USING btree (usuario_tipo, ativo);


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
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);


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
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);


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
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);


--
-- Name: idx_lotes_avaliacao_status_emitido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_avaliacao_status_emitido ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));


--
-- Name: idx_lotes_cancelados_auto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_cancelados_auto ON public.lotes_avaliacao USING btree (cancelado_automaticamente, status) WHERE (cancelado_automaticamente = true);


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: idx_lotes_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_codigo ON public.lotes_avaliacao USING btree (codigo);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


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
-- Name: idx_lotes_tipo_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotes_tipo_contratante ON public.lotes_avaliacao USING btree (clinica_id, contratante_id, status);


--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);


--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);


--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);


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
-- Name: idx_notificacoes_nao_lidas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_nao_lidas ON public.notificacoes USING btree (destinatario_cpf) WHERE (lida = false);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_pagamentos_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_contratante ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contratante_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_contratante_id ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_external_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_external_transaction_id ON public.pagamentos USING btree (external_transaction_id);


--
-- Name: idx_pagamentos_idempotency_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_idempotency_key ON public.pagamentos USING btree (idempotency_key);


--
-- Name: idx_pagamentos_provider_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_provider_event_id ON public.pagamentos USING btree (provider_event_id);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


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
-- Name: idx_recibos_contratante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recibos_contratante ON public.recibos USING btree (contratante_id);


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
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


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


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();


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
-- Name: entidades_senhas trg_entidades_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_entidades_senhas_updated_at BEFORE UPDATE ON public.entidades_senhas FOR EACH ROW EXECUTE FUNCTION public.update_entidades_senhas_updated_at();


--
-- Name: contratantes trg_contratantes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contratantes_updated_at BEFORE UPDATE ON public.contratantes FOR EACH ROW EXECUTE FUNCTION public.update_contratantes_updated_at();


--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();


--
-- Name: recibos trg_gerar_numero_recibo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gerar_numero_recibo BEFORE INSERT ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_gerar_numero_recibo();


--
-- Name: laudo_generation_jobs trg_laudo_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_laudo_jobs_updated_at BEFORE UPDATE ON public.laudo_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();


--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();

ALTER TABLE public.avaliacoes DISABLE TRIGGER trg_protect_avaliacao_after_emit;


--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();


--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();


--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: lotes_avaliacao trg_reservar_id_laudo_on_lote_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert AFTER INSERT ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_reservar_id_laudo_on_lote_insert();


--
-- Name: TRIGGER trg_reservar_id_laudo_on_lote_insert ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trg_reservar_id_laudo_on_lote_insert ON public.lotes_avaliacao IS 'Reserva automaticamente ID do laudo quando lote Ã© criado.

Laudo fica em status=rascunho atÃ© emissor processar.';


--
-- Name: contratacao_personalizada trigger_notificar_pre_cadastro; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notificar_pre_cadastro AFTER INSERT ON public.contratacao_personalizada FOR EACH ROW WHEN (((new.status)::text = 'aguardando_valor_admin'::text)) EXECUTE FUNCTION public.notificar_pre_cadastro_criado();


--
-- Name: contratacao_personalizada trigger_notificar_valor_definido; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notificar_valor_definido AFTER UPDATE ON public.contratacao_personalizada FOR EACH ROW WHEN ((((old.status)::text = 'aguardando_valor_admin'::text) AND ((new.status)::text = 'valor_definido'::text))) EXECUTE FUNCTION public.notificar_valor_definido();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();

ALTER TABLE public.resultados DISABLE TRIGGER trigger_resultado_immutability;


--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


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
-- Name: clinicas_empresas clinicas_empresas_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: contratacao_personalizada contratacao_personalizada_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratacao_personalizada
    ADD CONSTRAINT contratacao_personalizada_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratantes contratantes_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratantes
    ADD CONSTRAINT contratantes_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos_planos contratos_planos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: contratos_planos contratos_planos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id);


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
-- Name: empresas_clientes empresas_clientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes empresas_clientes_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: fila_emissao fila_emissao_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: entidades_senhas fk_entidades_senhas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT fk_entidades_senhas_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes fk_empresas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT fk_empresas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_contratante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE SET NULL;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao fk_lotes_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT fk_lotes_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: recibos fk_recibos_contratante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT fk_recibos_contratante FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


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
-- Name: funcionarios funcionarios_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);


--
-- Name: funcionarios funcionarios_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE SET NULL;


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
-- Name: lotes_avaliacao lotes_avaliacao_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.contratantes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;


--
-- Name: lotes_avaliacao lotes_avaliacao_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.entidades_senhas(cpf);


--
-- Name: CONSTRAINT lotes_avaliacao_liberado_por_fkey ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT lotes_avaliacao_liberado_por_fkey ON public.lotes_avaliacao IS 'FK para entidades_senhas - gestores nÃ£o estÃ£o em funcionarios apÃ³s refatoraÃ§Ã£o';


--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_contratacao_personalizada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_contratacao_personalizada_id_fkey FOREIGN KEY (contratacao_personalizada_id) REFERENCES public.contratacao_personalizada(id) ON DELETE CASCADE;


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
-- Name: funcionarios admin_restricted_funcionarios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_restricted_funcionarios ON public.funcionarios USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text]))));


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

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor'::text]))));


--
-- Name: avaliacao_resets avaliacao_resets_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacao_resets_select_policy ON public.avaliacao_resets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.avaliacoes av
     JOIN public.lotes_avaliacao lot ON ((av.lote_id = lot.id)))
  WHERE ((av.id = avaliacao_resets.avaliacao_id) AND (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (lot.clinica_id = (current_setting('app.current_user_clinica_id'::text, true))::integer)) OR ((current_setting('app.current_user_perfil'::text, true) = 'gestor'::text) AND (lot.contratante_id = (current_setting('app.current_user_contratante_id'::text, true))::integer)))))));


--
-- Name: avaliacao_resets avaliacao_resets_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacao_resets_update_policy ON public.avaliacao_resets FOR UPDATE USING (false);


--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: avaliacoes avaliacoes_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY avaliacoes_own_update ON public.avaliacoes FOR UPDATE USING (((funcionario_cpf)::text = public.current_user_cpf())) WITH CHECK (((funcionario_cpf)::text = public.current_user_cpf()));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: clinicas clinicas_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinicas_rh_select ON public.clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (id = public.current_user_clinica_id_optional())));


--
-- Name: contratantes contratantes_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY contratantes_admin_all ON public.contratantes USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));


--
-- Name: empresas_clientes empresas_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_block_admin ON public.empresas_clientes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: empresas_clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas_clientes empresas_rh_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_rh_delete ON public.empresas_clientes FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.funcionarios f
  WHERE ((f.empresa_id = empresas_clientes.id) AND (f.ativo = true)))))));


--
-- Name: empresas_clientes empresas_rh_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_rh_insert ON public.empresas_clientes FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: empresas_clientes empresas_rh_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY empresas_rh_update ON public.empresas_clientes FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: fila_emissao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fila_emissao ENABLE ROW LEVEL SECURITY;

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
-- Name: funcionarios funcionarios_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_block_admin ON public.funcionarios AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: funcionarios funcionarios_delete_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_delete_simple ON public.funcionarios FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: POLICY funcionarios_delete_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_delete_simple ON public.funcionarios IS 'Política DELETE simplificada - Apenas Admin';


--
-- Name: funcionarios funcionarios_insert_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_insert_simple ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor'::text)));


--
-- Name: POLICY funcionarios_insert_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_insert_simple ON public.funcionarios IS 'Política INSERT simplificada - Admin, RH e Gestor podem inserir';


--
-- Name: funcionarios funcionarios_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_own_select ON public.funcionarios FOR SELECT USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())));


--
-- Name: funcionarios funcionarios_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_own_update ON public.funcionarios FOR UPDATE USING (((cpf)::text = public.current_user_cpf())) WITH CHECK (((cpf)::text = public.current_user_cpf()));


--
-- Name: funcionarios funcionarios_rh_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_delete ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_insert ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND ((perfil)::text = 'funcionario'::text)));


--
-- Name: funcionarios funcionarios_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_select ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios funcionarios_rh_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_rh_update ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: funcionarios funcionarios_select_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_select_simple ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'admin'::text) OR ((public.current_user_perfil() = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor'::text)));


--
-- Name: POLICY funcionarios_select_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_select_simple ON public.funcionarios IS 'Política SELECT simplificada - Admin (tudo), Funcionário (próprio), RH/Gestor (amplo)';


--
-- Name: funcionarios funcionarios_update_simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcionarios_update_simple ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor'::text)));


--
-- Name: POLICY funcionarios_update_simple ON funcionarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY funcionarios_update_simple ON public.funcionarios IS 'Política UPDATE simplificada - Admin, RH e Gestor podem atualizar';


--
-- Name: laudos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));


--
-- Name: lotes_avaliacao lotes_rh_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_insert ON public.lotes_avaliacao FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));


--
-- Name: lotes_avaliacao lotes_rh_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lotes_rh_update ON public.lotes_avaliacao FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id()) AND ((status)::text <> ALL (ARRAY[('finalizado'::character varying)::text, ('cancelado'::character varying)::text]))));


--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes notificacoes_gestor_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notificacoes_gestor_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'gestor'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: notificacoes notificacoes_gestor_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notificacoes_gestor_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'gestor'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK (((destinatario_tipo = 'gestor'::text) AND (destinatario_cpf = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


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
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: respostas respostas_block_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY respostas_block_admin ON public.respostas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));


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

CREATE POLICY resultados_own_select ON public.resultados FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = resultados.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf())))));


--
-- Name: resultados resultados_rh_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resultados_rh_select ON public.resultados FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM (public.avaliacoes a
     JOIN public.funcionarios f ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((a.id = resultados.avaliacao_id) AND (f.clinica_id = public.current_user_clinica_id_optional()))))));


--
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);


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

