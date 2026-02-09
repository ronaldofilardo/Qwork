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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
-- Name: metodo_pagamento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.metodo_pagamento_enum AS ENUM (
    'avista',
    'prazo',
    'pix',
    'cartao',
    'boleto',
    'transferencia'
);


ALTER TYPE public.metodo_pagamento_enum OWNER TO postgres;

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
    'pago',
    'pagamento_confirmado',
    'contrato_gerado_pendente',
    'inativa',
    'pendente_pagamento',
    'analise',
    'cancelado'
);


ALTER TYPE public.status_aprovacao_enum OWNER TO postgres;

--
-- Name: TYPE status_aprovacao_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_aprovacao_enum IS 'Status de aprovaÃ§Ã£o: pendente (inicial) â†’ contrato_gerado_pendente (para personalizado) â†’ aguardando_pagamento (apÃ³s aceite) â†’ aprovado (final apÃ³s pagamento)';


--
-- Name: status_avaliacao_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_avaliacao_enum AS ENUM (
    'iniciada',
    'em_andamento',
    'concluido',
    'inativada'
);


ALTER TYPE public.status_avaliacao_enum OWNER TO postgres;

--
-- Name: TYPE status_avaliacao_enum; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.status_avaliacao_enum IS 'Status de avaliaÃ§Ãµes: iniciada (criada mas nÃ£o respondida), em_andamento (respondendo), concluida (finalizada), inativada (cancelada)';


--
-- Name: status_contratacao_personalizada; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_contratacao_personalizada AS ENUM (
    'pre_cadastro',
    'aguardando_valor_admin',
    'valor_definido',
    'contrato_gerado',
    'contrato_aceito',
    'aguardando_pagamento',
    'pagamento_confirmado',
    'ativo',
    'rejeitado',
    'cancelado'
);


ALTER TYPE public.status_contratacao_personalizada OWNER TO postgres;

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
-- Name: status_pagamento_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_pagamento_enum AS ENUM (
    'pendente',
    'processando',
    'pago',
    'cancelado',
    'reembolsado'
);


ALTER TYPE public.status_pagamento_enum OWNER TO postgres;

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
    'laudo_emitido_automaticamente',
    'parcela_pendente',
    'parcela_vencendo',
    'quitacao_completa',
    'lote_concluido_aguardando_laudo',
    'laudo_emitido',
    'relatorio_semanal_pendencias'
);


ALTER TYPE public.tipo_notificacao OWNER TO postgres;

--
-- Name: tipo_plano; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_plano AS ENUM (
    'fixo',
    'personalizado'
);


ALTER TYPE public.tipo_plano OWNER TO postgres;

--
-- Name: anonimizar_avaliacao(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.anonimizar_avaliacao(avaliacao_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_cpf CHAR(11);

    v_dados JSONB;

BEGIN

    -- Buscar dados antes da anonimizaÃ§Ã£o

    SELECT f.cpf INTO v_cpf

    FROM avaliacoes a

    JOIN funcionarios f ON a.funcionario_id = f.id

    WHERE a.id = avaliacao_id;

    

    -- Criar snapshot anonimizado para estatÃ­sticas

    SELECT jsonb_build_object(

        'data_avaliacao', a.criado_em,

        'grupo_avaliacao', a.grupo_avaliacao_id,

        'status', a.status,

        'pontuacao_total', r.pontuacao_total

    ) INTO v_dados

    FROM avaliacoes a

    LEFT JOIN resultados r ON a.id = r.avaliacao_id

    WHERE a.id = avaliacao_id;

    

    -- Registrar no histÃ³rico

    INSERT INTO historico_exclusoes (

        tipo_registro, 

        registro_id, 

        cpf_anonimizado, 

        motivo, 

        dados_anonimizados

    ) VALUES (

        'avaliacao',

        avaliacao_id,

        '***-***-' || RIGHT(v_cpf, 4),

        'RetenÃ§Ã£o expirada (36 meses)',

        v_dados

    );

    

    -- Marcar como anonimizada

    UPDATE avaliacoes 

    SET anonimizada = true,

        data_anonimizacao = NOW()

    WHERE id = avaliacao_id;

    

    RETURN true;

END;

$$;


ALTER FUNCTION public.anonimizar_avaliacao(avaliacao_id integer) OWNER TO postgres;

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

    NEW.atualizado_em = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.atualizar_data_modificacao() OWNER TO postgres;

--
-- Name: atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.atualizado_em = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.atualizar_timestamp() OWNER TO postgres;

--
-- Name: atualizar_timestamp_configuracoes(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.atualizar_timestamp_configuracoes() OWNER TO postgres;

--
-- Name: audit_log_with_context(character varying, character varying, character varying, text, character, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying DEFAULT NULL::character varying, p_details text DEFAULT NULL::text, p_user_cpf character DEFAULT NULL::bpchar, p_clinica_id integer DEFAULT NULL::integer, p_contratante_id integer DEFAULT NULL::integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
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
        NULLIF(current_setting('app.current_user_ip', true), ''),
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

COMMENT ON FUNCTION public.audit_log_with_context(p_resource character varying, p_action character varying, p_resource_id character varying, p_details text, p_user_cpf character, p_clinica_id integer, p_contratante_id integer) IS 'Registra aÃ§Ã£o no audit_logs incluindo contexto completo (user, clÃ­nica, contratante). Usa current_setting como fallback.';


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

            current_user_cpf(),

            current_user_perfil(),

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

            current_user_cpf(),

            current_user_perfil(),

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

            current_user_cpf(),

            current_user_perfil(),

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

COMMENT ON FUNCTION public.audit_trigger_func() IS 'FunÃ§Ã£o de trigger genÃ©rica para auditoria automÃ¡tica de INSERT/UPDATE/DELETE';


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
-- Name: bloquear_alteracao_contrato_vigente(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.bloquear_alteracao_contrato_vigente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Permitir alteraÃ§Ãµes apenas em status e numero_funcionarios_atual

    IF OLD.bloqueado = TRUE AND OLD.data_fim_vigencia > CURRENT_DATE THEN

        IF (OLD.plano_id IS DISTINCT FROM NEW.plano_id) OR

           (OLD.valor_personalizado_por_funcionario IS DISTINCT FROM NEW.valor_personalizado_por_funcionario) THEN

            RAISE EXCEPTION 'NÃ£o Ã© permitido alterar plano ou valores durante a vigÃªncia do contrato (364 dias). VigÃªncia atÃ©: %', OLD.data_fim_vigencia;

        END IF;

    END IF;

    

    -- Atualizar timestamp

    NEW.updated_at = CURRENT_TIMESTAMP;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.bloquear_alteracao_contrato_vigente() OWNER TO postgres;

--
-- Name: calcular_custo_contrato(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_custo_contrato(p_contrato_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_contrato RECORD;

    v_plano RECORD;

    v_custo DECIMAL;

BEGIN

    SELECT * INTO v_contrato FROM contratos_planos WHERE id = p_contrato_id;

    SELECT * INTO v_plano FROM planos WHERE id = v_contrato.plano_id;

    

    IF v_plano.tipo = 'personalizado' THEN

        -- Custo = valor por funcionÃ¡rio Ã— funcionÃ¡rios ativos

        v_custo := v_contrato.valor_personalizado_por_funcionario * v_contrato.numero_funcionarios_atual;

    ELSE

        -- Custo fixo dividido pelas parcelas

        v_custo := v_plano.valor_fixo_anual / v_contrato.numero_parcelas;

    END IF;

    

    RETURN v_custo;

END;

$$;


ALTER FUNCTION public.calcular_custo_contrato(p_contrato_id integer) OWNER TO postgres;

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

      WHEN f.indice_avaliacao = 0 THEN 'Funcionário novo (nunca avaliado)'::VARCHAR(100)

      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN ('Índice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))')::VARCHAR(100)

      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliação'::VARCHAR(100)

      ELSE 'Renovação regular'::VARCHAR(100)

    END AS motivo_inclusao,

    f.indice_avaliacao AS indice_atual,

    f.data_ultimo_lote,

    CASE

      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER

      ELSE NULL

    END AS dias_sem_avaliacao,

    CASE

      WHEN f.indice_avaliacao = 0 THEN 'ALTA'::VARCHAR(20)

      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRÍTICA'::VARCHAR(20)

      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'::VARCHAR(20)

      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MÉDIA'::VARCHAR(20)

      ELSE 'NORMAL'::VARCHAR(20)

    END AS prioridade

  FROM funcionarios f

  WHERE

    f.empresa_id = p_empresa_id

    AND f.ativo = true

    AND (

      -- Critério 1: Funcionário novo (índice 0)

      f.indice_avaliacao = 0

      OR

      -- Critério 2: Índice incompleto (faltou lote anterior)

      f.indice_avaliacao < p_numero_lote_atual - 1

      OR

      -- Critério 3: Mais de 1 ano sem avaliação

      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')

    )

  ORDER BY

    -- Ordenar por prioridade: CRÍTICA > ALTA > MÉDIA > NORMAL

    CASE prioridade

      WHEN 'CRÍTICA' THEN 1

      WHEN 'ALTA' THEN 2

      WHEN 'MÉDIA' THEN 3

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

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Calcula quais funcionários devem ser incluídos no próximo lote com base em índice, data (>1 ano) e novos funcionários';


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
    CASE
      WHEN f.indice_avaliacao = 0 THEN 'Funcionrio novo (nunca avaliado)'::VARCHAR(100)
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN ('ndice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))')::VARCHAR(100)
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliao'::VARCHAR(100)
      ELSE 'Renovao regular'::VARCHAR(100)
    END AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    CASE
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'::VARCHAR(20)
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRTICA'::VARCHAR(20)
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'::VARCHAR(20)
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MDIA'::VARCHAR(20)
      ELSE 'NORMAL'::VARCHAR(20)
    END AS prioridade
  FROM funcionarios f
  WHERE
    f.contratante_id = p_contratante_id
    AND f.empresa_id IS NULL
    AND f.ativo = true
    AND (
      f.indice_avaliacao = 0
      OR
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY
    CASE prioridade
      WHEN 'CRTICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MDIA' THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote_contratante(p_contratante_id integer, p_numero_lote_atual integer) OWNER TO postgres;

--
-- Name: check_resposta_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_resposta_immutability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_status TEXT;

    v_perfil TEXT;

BEGIN

    -- Obter perfil do usuÃ¡rio atual

    v_perfil := current_setting('app.current_user_perfil', true);

    

    -- Para UPDATE ou DELETE, verificar se avaliaÃ§Ã£o estÃ¡ concluÃ­da

    IF TG_OP IN ('UPDATE', 'DELETE') THEN

        SELECT status INTO v_status

        FROM avaliacoes

        WHERE id = OLD.avaliacao_id;

        

        -- Se avaliaÃ§Ã£o estÃ¡ concluÃ­da, bloquear modificaÃ§Ã£o

        IF v_status = 'concluido' THEN

            RAISE EXCEPTION 'NÃ£o Ã© permitido modificar respostas de avaliaÃ§Ãµes concluÃ­das. AvaliaÃ§Ã£o ID: %', OLD.avaliacao_id

                USING HINT = 'Respostas de avaliaÃ§Ãµes concluÃ­das sÃ£o imutÃ¡veis para garantir integridade dos dados.',

                      ERRCODE = '23506';

        END IF;

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.check_resposta_immutability() OWNER TO postgres;

--
-- Name: check_resultado_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_resultado_immutability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_status TEXT;

    v_perfil TEXT;

BEGIN

    -- Obter perfil do usuÃ¡rio atual

    v_perfil := current_setting('app.current_user_perfil', true);

    



    -- Para UPDATE ou DELETE, verificar se avaliaÃ§Ã£o estÃ¡ concluÃ­da

    IF TG_OP IN ('UPDATE', 'DELETE') THEN

        SELECT status INTO v_status

        FROM avaliacoes

        WHERE id = OLD.avaliacao_id;

        

        -- Se avaliaÃ§Ã£o estÃ¡ concluÃ­da, bloquear modificaÃ§Ã£o

        IF v_status = 'concluido' THEN

            RAISE EXCEPTION 'NÃ£o Ã© permitido modificar resultados de avaliaÃ§Ãµes concluÃ­das. AvaliaÃ§Ã£o ID: %', OLD.avaliacao_id

                USING HINT = 'Resultados de avaliaÃ§Ãµes concluÃ­das sÃ£o imutÃ¡veis para garantir integridade dos dados.',

                      ERRCODE = '23506';

        END IF;

    END IF;

    

    -- Para INSERT, verificar se avaliaÃ§Ã£o jÃ¡ nÃ£o estÃ¡ concluÃ­da

    IF TG_OP = 'INSERT' THEN

        SELECT status INTO v_status

        FROM avaliacoes

        WHERE id = NEW.avaliacao_id;

        

        IF v_status = 'concluido' THEN

            RAISE EXCEPTION 'NÃ£o Ã© permitido adicionar resultados a avaliaÃ§Ãµes jÃ¡ concluÃ­das. AvaliaÃ§Ã£o ID: %', NEW.avaliacao_id

                USING HINT = 'Finalize a avaliaÃ§Ã£o antes de tentar adicionar resultados novamente.',

                      ERRCODE = '23506';

        END IF;

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.check_resultado_immutability() OWNER TO postgres;

--
-- Name: contratante_pode_logar(integer); Type: FUNCTION; Schema: public; Owner: postgres
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

    FROM public.tomadores

    WHERE id = p_contratante_id;

    

    -- Regra: precisa ter pagamento confirmado, data de liberaÃ§Ã£o definida, status aprovado e estar ativa

    RETURN COALESCE(v_pagamento_confirmado, false) 

        AND v_data_liberacao IS NOT NULL 

        AND v_status = 'aprovado'

        AND COALESCE(v_ativa, false);

END;

$$;


ALTER FUNCTION public.contratante_pode_logar(p_contratante_id integer) OWNER TO postgres;

--
-- Name: tomadores_sync_status_ativa(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.tomadores_sync_status_ativa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.ativa IS NOT NULL AND NEW.ativa = false THEN
          NEW.status := 'inativa';
        END IF;
        RETURN NEW;
      END IF;

      IF TG_OP = 'UPDATE' THEN
        IF (OLD.ativa IS DISTINCT FROM NEW.ativa) AND NEW.ativa = false THEN
          NEW.status := 'inativa';
        END IF;
        RETURN NEW;
      END IF;

      RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.tomadores_sync_status_ativa() OWNER TO postgres;

--
-- Name: FUNCTION tomadores_sync_status_ativa(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.tomadores_sync_status_ativa() IS 'LEGACY: originalmente garantia que ativa só poderia ser true apenas se pagamento_confirmado fosse true; mantido por compatibilidade após migração para contract-first.'; 


--
-- Name: criar_senha_inicial_entidade(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.criar_senha_inicial_entidade(p_contratante_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_contratante RECORD;

    v_senha_hash VARCHAR(255);

    v_funcionario_exists BOOLEAN;

BEGIN

    -- Buscar dados do contratante

    SELECT 

        responsavel_nome,

        responsavel_cpf,

        responsavel_email,

        responsavel_celular,

        nome as empresa_nome

    INTO v_contratante

    FROM tomadores

    WHERE id = p_contratante_id AND tipo = 'entidade';

    

    IF NOT FOUND THEN

        RAISE EXCEPTION 'Contratante não encontrado ou não é do tipo entidade (ID: %)', p_contratante_id;

    END IF;

    

    -- Gerar hash da senha padrão "123"

    v_senha_hash := crypt('123', gen_salt('bf'));

    

    -- Verificar se funcionário já existe

    SELECT EXISTS(

        SELECT 1 FROM funcionarios WHERE cpf = v_contratante.responsavel_cpf

    ) INTO v_funcionario_exists;

    

    IF v_funcionario_exists THEN

        -- Atualizar funcionário existente

        UPDATE funcionarios 

        SET 

            nome = v_contratante.responsavel_nome,

            email = v_contratante.responsavel_email,

            celular = v_contratante.responsavel_celular,

            perfil = 'gestor',

            contratante_id = p_contratante_id,

            ativo = true,

            atualizado_em = CURRENT_TIMESTAMP

        WHERE cpf = v_contratante.responsavel_cpf;

    ELSE

        -- Inserir novo funcionário com perfil gestor

        INSERT INTO funcionarios (

            cpf,

            nome,

            email,

            celular,

            perfil,

            contratante_id,

            ativo,

            empresa_cliente_id,

            setor,

            funcao,

            nivel_cargo

        ) VALUES (

            v_contratante.responsavel_cpf,

            v_contratante.responsavel_nome,

            v_contratante.responsavel_email,

            v_contratante.responsavel_celular,

            'gestor',

            p_contratante_id,

            true,

            NULL,

            'Gestão',

            'Gestor da Entidade',

            'Gerencial'

        );

    END IF;

    

    -- Inserir ou atualizar senha

    INSERT INTO senhas_funcionarios (

        cpf,

        senha_hash

    ) VALUES (

        v_contratante.responsavel_cpf,

        v_senha_hash

    ) 

    ON CONFLICT (cpf) 

    DO UPDATE SET 

        senha_hash = EXCLUDED.senha_hash,

        atualizado_em = CURRENT_TIMESTAMP;

    

    RAISE NOTICE 'Senha inicial criada para gestor da entidade (CPF: %)', v_contratante.responsavel_cpf;

END;

$$;


ALTER FUNCTION public.criar_senha_inicial_entidade(p_contratante_id integer) OWNER TO postgres;

--
-- Name: FUNCTION criar_senha_inicial_entidade(p_contratante_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.criar_senha_inicial_entidade(p_contratante_id integer) IS 'Cria ou atualiza funcionário com perfil gestor e senha padrão "123" para o responsável do contratante';


--
-- Name: criar_snapshot_contrato(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.criar_snapshot_contrato() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    IF TG_OP = 'UPDATE' THEN

        INSERT INTO historico_contratos_planos (

            contrato_id, 

            plano_id, 

            valor_snapshot,

            numero_funcionarios_snapshot,

            motivo

        ) VALUES (

            OLD.id,

            OLD.plano_id,

            COALESCE(OLD.valor_personalizado_por_funcionario, 

                     (SELECT valor_fixo_anual FROM planos WHERE id = OLD.plano_id)),

            OLD.numero_funcionarios_atual,

            'AlteraÃ§Ã£o de contrato'

        );

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.criar_snapshot_contrato() OWNER TO postgres;

--
-- Name: current_user_clinica_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_clinica_id() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$

BEGIN

    RETURN NULLIF(current_setting('app.current_user_clinica_id', TRUE), '')::INTEGER;

EXCEPTION 

    WHEN OTHERS THEN 

        RETURN NULL;

END;

$$;


ALTER FUNCTION public.current_user_clinica_id() OWNER TO postgres;

--
-- Name: FUNCTION current_user_clinica_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_clinica_id() IS 'Retorna o clinica_id do usuÃ¡rio atual para isolamento de dados por clÃ­nica';


--
-- Name: current_user_contratante_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_contratante_id() RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    contratante_id_str VARCHAR(50);
    contratante_id_int INTEGER;
BEGIN
    contratante_id_str := nullif(current_setting('app.current_user_contratante_id', true), '');
    IF contratante_id_str IS NOT NULL THEN
        contratante_id_int := contratante_id_str::INTEGER;
        RETURN contratante_id_int;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.current_user_contratante_id() OWNER TO postgres;

--
-- Name: FUNCTION current_user_contratante_id(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_contratante_id() IS 'Retorna o contratante_id do contexto da sessÃ£o para RLS de entidades';


--
-- Name: current_user_cpf(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_cpf() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$

BEGIN

    RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');

EXCEPTION 

    WHEN OTHERS THEN 

        RETURN NULL;

END;

$$;


ALTER FUNCTION public.current_user_cpf() OWNER TO postgres;

--
-- Name: FUNCTION current_user_cpf(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_cpf() IS 'Retorna o CPF do usuÃ¡rio atual armazenado no contexto da sessÃ£o via current_setting';


--
-- Name: current_user_perfil(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_perfil() RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$

BEGIN

    RETURN NULLIF(current_setting('app.current_user_perfil', TRUE), '');

EXCEPTION 

    WHEN OTHERS THEN 

        RETURN NULL;

END;

$$;


ALTER FUNCTION public.current_user_perfil() OWNER TO postgres;

--
-- Name: FUNCTION current_user_perfil(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.current_user_perfil() IS 'Retorna o perfil (role) do usuÃ¡rio atual: funcionario, rh, admin, master ou emissor';


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

CREATE FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) RETURNS TABLE(cpf character, nome character varying, setor character varying, indice_avaliacao integer, data_ultimo_lote timestamp without time zone, dias_desde_ultima_avaliacao integer, prioridade character varying, categoria_anomalia character varying, mensagem text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH anomalias_com_prioridade AS (
    SELECT
      anomalias.*,
      -- Atribuir peso para ordenação por prioridade (menor número = mais crítico)
      CASE anomalias.categoria_anomalia
        WHEN 'NUNCA_AVALIADO' THEN 1
        WHEN 'MUITAS_INATIVACOES' THEN 2
        WHEN 'MAIS_DE_2_ANOS_SEM_AVALIACAO' THEN 3
        WHEN 'MAIS_DE_1_ANO_SEM_AVALIACAO' THEN 4
        WHEN 'INDICE_MUITO_ATRASADO' THEN 5
        ELSE 6
      END AS peso_prioridade
    FROM (
-- Anomalia 1: Nunca avaliado (>6 meses) OU teve avaliações liberadas mas nunca concluiu nenhuma
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        CASE
          WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER
        END AS dias_desde_ultima_avaliacao,
        'ALTA'::VARCHAR(20) AS prioridade,
        'NUNCA_AVALIADO'::VARCHAR(50) AS categoria_anomalia,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN
            'Funcionário teve ' || (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) || ' avaliações liberadas mas nunca concluiu nenhuma. Todas foram inativadas.'
          ELSE
            'Funcionário ativo há ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliação.'
        END AS mensagem
      FROM funcionarios f
      WHERE
        f.empresa_id = p_empresa_id
        AND f.ativo = true
        AND (
          -- Nunca teve avaliações liberadas E foi criado há mais de 6 meses
          (f.criado_em < NOW() - INTERVAL '6 months' AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf))
          OR
          -- Teve avaliações liberadas mas nunca concluiu nenhuma
          (EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluido'))
        )

        UNION ALL

        -- Anomalia 2: Mais de 1 ano sem avaliação
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
          'ALTA'::VARCHAR(20) AS prioridade,
          'MAIS_DE_1_ANO_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida.' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '1 year'
          AND f.data_ultimo_lote >= NOW() - INTERVAL '2 years'

        UNION ALL

        -- Anomalia 3: Mais de 2 anos sem avaliação
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
          'CRÍTICA'::VARCHAR(20) AS prioridade,
          'MAIS_DE_2_ANOS_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida. Violação crítica!' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'

        UNION ALL

        -- Anomalia 4: Índice muito atrasado (>5 lotes)
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          CASE
            WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
            ELSE NULL
          END AS dias_desde_ultima_avaliacao,
          CASE
            WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10 THEN 'CRÍTICA'::VARCHAR(20)
            WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5 THEN 'ALTA'::VARCHAR(20)
            ELSE 'MÉDIA'::VARCHAR(20)
          END AS prioridade,
          'INDICE_MUITO_ATRASADO'::VARCHAR(50) AS categoria_anomalia,
          'Índice atual: ' || f.indice_avaliacao || ', Lote atual: ' || (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) ||
          ' (Diferença: ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) || ' lotes)' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.indice_avaliacao > 0
          AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5

        UNION ALL

        -- Anomalia 5: Muitas inativações (>3 nos últimos lotes)
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          CASE
            WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
            ELSE NULL
          END AS dias_desde_ultima_avaliacao,
          'CRÍTICA'::VARCHAR(20) AS prioridade,
          'MUITAS_INATIVACOES'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário tem ' || COUNT(a.id) || ' inativações nos últimos lotes. Possível padrão suspeito.' AS mensagem
        FROM funcionarios f
        JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
        JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE
          f.empresa_id = p_empresa_id
          AND a.status = 'inativada'
          AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
        GROUP BY f.cpf, f.nome, f.setor, f.indice_avaliacao, f.data_ultimo_lote
        HAVING COUNT(a.id) >= 3
    ) anomalias
  ),
  -- Selecionar apenas a anomalia mais crítica por funcionário
  anomalias_deduplicadas AS (
    SELECT DISTINCT ON (anomalias_com_prioridade.cpf)
      anomalias_com_prioridade.cpf,
      anomalias_com_prioridade.nome,
      anomalias_com_prioridade.setor,
      anomalias_com_prioridade.indice_avaliacao,
      anomalias_com_prioridade.data_ultimo_lote,
      anomalias_com_prioridade.dias_desde_ultima_avaliacao,
      anomalias_com_prioridade.prioridade,
      anomalias_com_prioridade.categoria_anomalia,
      anomalias_com_prioridade.mensagem
    FROM anomalias_com_prioridade
    ORDER BY anomalias_com_prioridade.cpf, anomalias_com_prioridade.peso_prioridade ASC -- Menor peso = mais crítico primeiro
  )
  SELECT
    ad.cpf,
    ad.nome,
    ad.setor,
    ad.indice_avaliacao,
    ad.data_ultimo_lote,
    ad.dias_desde_ultima_avaliacao,
    ad.prioridade,
    ad.categoria_anomalia,
    ad.mensagem
  FROM anomalias_deduplicadas ad
  ORDER BY
    CASE ad.prioridade
      WHEN 'CRÍTICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MÉDIA' THEN 3
      ELSE 4
    END,
    ad.dias_desde_ultima_avaliacao DESC NULLS FIRST,
    ad.nome ASC;
END;
$$;


ALTER FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) OWNER TO postgres;

--
-- Name: FUNCTION detectar_anomalias_indice(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) IS 'Detecta anomalias no sistema de avaliação, removendo duplicatas e priorizando anomalias mais críticas';


--
-- Name: executar_politica_retencao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.executar_politica_retencao() RETURNS TABLE(total_anonimizadas integer, total_excluidas integer)
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_anonimizadas INTEGER := 0;

    v_excluidas INTEGER := 0;

    v_avaliacao_id INTEGER;

BEGIN

    -- 1. Anonimizar avaliaÃ§Ãµes vencidas (nÃ£o excluir imediatamente)

    FOR v_avaliacao_id IN 

        SELECT id 

        FROM avaliacoes 

        WHERE data_validade < NOW() 

        AND anonimizada = false

        AND status IN ('concluido', 'inativada')

    LOOP

        PERFORM anonimizar_avaliacao(v_avaliacao_id);

        v_anonimizadas := v_anonimizadas + 1;

    END LOOP;

    

    -- 2. Excluir respostas de avaliaÃ§Ãµes anonimizadas hÃ¡ mais de 6 meses

    DELETE FROM respostas

    WHERE avaliacao_id IN (

        SELECT id 

        FROM avaliacoes 

        WHERE anonimizada = true 

        AND data_anonimizacao < NOW() - INTERVAL '6 months'

    );

    

    GET DIAGNOSTICS v_excluidas = ROW_COUNT;

    

    -- 3. Excluir resultados detalhados (manter apenas snapshot no histÃ³rico)

    DELETE FROM resultados

    WHERE avaliacao_id IN (

        SELECT id 

        FROM avaliacoes 

        WHERE anonimizada = true 

        AND data_anonimizacao < NOW() - INTERVAL '6 months'

    );

    

    RETURN QUERY SELECT v_anonimizadas, v_excluidas;

END;

$$;


ALTER FUNCTION public.executar_politica_retencao() OWNER TO postgres;

--
-- Name: FUNCTION executar_politica_retencao(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.executar_politica_retencao() IS 'Executa polÃ­tica de retenÃ§Ã£o: anonimiza dados vencidos e exclui apÃ³s 6 meses';


--
-- Name: fn_corrigir_inconsistencias_tomadores(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_corrigir_inconsistencias_tomadores() RETURNS TABLE(contratante_id integer, nome_contratante character varying, acao_realizada character varying, detalhes text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH inconsistentes AS (
    SELECT id, nome, ativa, pagamento_confirmado, status, contrato_gerado
    FROM tomadores
    WHERE (ativa = true AND pagamento_confirmado = false)
       OR (contrato_gerado = true AND pagamento_confirmado = false)
  ),
  corrigidos AS (
    UPDATE tomadores c
    SET 
      ativa = false,
      status = CASE
        WHEN c.status = 'aprovado' THEN 'em_reanalise'
        ELSE c.status
      END,
      contrato_gerado = false
    WHERE c.id IN (SELECT id FROM inconsistentes)
    RETURNING c.id, c.nome
  ),
  alertas AS (
    INSERT INTO alertas_integridade (
      tipo,
      severidade,
      recurso,
      recurso_id,
      descricao,
      dados_contexto
    )
    SELECT 
      'correcao_automatica_inconsistencia',
      'high',
      'tomadores',
      i.id,
      format('Contratante %s foi automaticamente desativado por inconsistÃªncia (ativo sem pagamento)', i.nome),
      jsonb_build_object(
        'ativa_anterior', i.ativa,
        'pagamento_confirmado', i.pagamento_confirmado,
        'status_anterior', i.status,
        'contrato_gerado_anterior', i.contrato_gerado,
        'corrigido_em', NOW()
      )
    FROM inconsistentes i
    RETURNING recurso_id
  )
  SELECT 
    c.id,
    c.nome,
    'desativado_e_marcado_em_reanalise'::VARCHAR(100),
    format('Contratante %s foi desativado e marcado como em reanÃ¡lise. Alerta criado.', c.nome)
  FROM corrigidos c;
END;
$$;


ALTER FUNCTION public.fn_corrigir_inconsistencias_tomadores() OWNER TO postgres;

--
-- Name: FUNCTION fn_corrigir_inconsistencias_tomadores(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_corrigir_inconsistencias_tomadores() IS 'Corrige automaticamente tomadores com estados inconsistentes. Desativa e marca como inconsistente qualquer contratante ativo sem pagamento confirmado.';


--
-- Name: fn_delete_senha_autorizado(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_delete_senha_autorizado(integer, text) RETURNS void
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN; END; $$;


ALTER FUNCTION public.fn_delete_senha_autorizado(integer, text) OWNER TO postgres;

--
-- Name: fn_limpar_tokens_expirados(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_limpar_tokens_expirados() RETURNS TABLE(tokens_removidos integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_removidos INTEGER;
BEGIN
  DELETE FROM tokens_retomada_pagamento
  WHERE expiracao < NOW() - INTERVAL '7 days'; -- MantÃ©m histÃ³rico de 7 dias
  
  GET DIAGNOSTICS total_removidos = ROW_COUNT;
  
  RETURN QUERY SELECT total_removidos;
END;
$$;


ALTER FUNCTION public.fn_limpar_tokens_expirados() OWNER TO postgres;

--
-- Name: FUNCTION fn_limpar_tokens_expirados(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_limpar_tokens_expirados() IS 'Remove tokens expirados hÃ¡ mais de 7 dias. Deve ser executado via cron diariamente.';


--
-- Name: fn_marcar_token_usado(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_marcar_token_usado(p_token character varying, p_ip character varying) OWNER TO postgres;

--
-- Name: FUNCTION fn_marcar_token_usado(p_token character varying, p_ip character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_marcar_token_usado(p_token character varying, p_ip character varying) IS 'Marca token como usado apÃ³s pagamento bem-sucedido. Previne reutilizaÃ§Ã£o.';


--
-- Name: fn_validar_ativacao_contratante(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar_ativacao_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se estÃ¡ tentando ativar sem pagamento confirmado
  IF NEW.ativa = true AND NEW.pagamento_confirmado = false THEN
    -- Registrar alerta crÃ­tico
    INSERT INTO alertas_integridade (
      tipo,
      severidade,
      recurso,
      recurso_id,
      descricao,
      dados_contexto
    ) VALUES (
      'tentativa_ativacao_sem_pagamento',
      'critical',
      'tomadores',
      NEW.id,
      format('Tentativa de ativar contratante %s (ID: %s) sem pagamento confirmado', NEW.nome, NEW.id),
      jsonb_build_object(
        'contratante_id', NEW.id,
        'contratante_nome', NEW.nome,
        'ativa_novo', NEW.ativa,
        'pagamento_confirmado', NEW.pagamento_confirmado,
        'status', NEW.status,
        'timestamp', NOW()
      )
    );
    
    -- A constraint vai rejeitar, mas registramos antes
    -- Nota: Este trigger dispara ANTES da constraint
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_ativacao_contratante() OWNER TO postgres;

--
-- Name: FUNCTION fn_validar_ativacao_contratante(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_ativacao_contratante() IS 'Registra tentativas de ativar tomadores sem pagamento confirmado em alertas_integridade antes da constraint rejeitar.';


--
-- Name: fn_validar_token_pagamento(character varying); Type: FUNCTION; Schema: public; Owner: postgres
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
      WHEN t.id IS NULL THEN 'Token nÃ£o encontrado'::VARCHAR
      WHEN t.usado = true THEN 'Token jÃ¡ foi utilizado'::VARCHAR
      WHEN t.expiracao < NOW() THEN 'Token expirado'::VARCHAR
      ELSE NULL
    END AS erro
  FROM tokens_retomada_pagamento t
  WHERE t.token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER,
                        NULL::VARCHAR, NULL::INTEGER, NULL::DECIMAL,
                        'Token nÃ£o encontrado'::VARCHAR;
  END IF;
END;
$$;


ALTER FUNCTION public.fn_validar_token_pagamento(p_token character varying) OWNER TO postgres;

--
-- Name: FUNCTION fn_validar_token_pagamento(p_token character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_token_pagamento(p_token character varying) IS 'Valida token de retomada de pagamento. Retorna dados se vÃ¡lido ou erro especÃ­fico se invÃ¡lido.';


--
-- Name: garantir_template_padrao_unico(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.garantir_template_padrao_unico() OWNER TO postgres;

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

    SELECT COALESCE(MAX(CAST(SPLIT_PART( '-', 1) AS INTEGER)), 0) + 1

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

            'avaliacoes_concluidas', COUNT(CASE WHEN a.status = 'concluido' THEN 1 END),

            'taxa_conclusao', ROUND((COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2),

            'funcionarios_operacionais', COUNT(DISTINCT CASE WHEN f.nivel_cargo = 'operacional' THEN f.cpf END),

            'funcionarios_gestao', COUNT(DISTINCT CASE WHEN f.nivel_cargo = 'gestao' THEN f.cpf END)

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

                WHEN 8 THEN 'Jogos de Azar'

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

            AND a.status = 'concluido'

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

                'Alto risco de jogos de azar em ' || COUNT(CASE WHEN r.grupo = 9 AND r.valor > 50 THEN 1 END) || ' casos',

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

        AND a.status = 'concluido'

        AND r.grupo IN (8, 9, 10);

        

END;

$$;


ALTER FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer, p_empresa_id integer, p_data_inicio date, p_data_fim date) OWNER TO postgres;

--
-- Name: gerar_hash_contrato(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_hash_contrato(p_conteudo text) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$

BEGIN

    RETURN encode(digest(p_conteudo, 'sha256'), 'hex');

END;

$$;


ALTER FUNCTION public.gerar_hash_contrato(p_conteudo text) OWNER TO postgres;

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

    FROM tomadores c

    INNER JOIN tomadores_funcionarios cf ON cf.contratante_id = c.id

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

            WHEN 8 THEN 'Jogos de Azar'

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

        AND a.status = 'concluido'

    GROUP BY ec.id, ec.nome, r.grupo

    ORDER BY ec.nome, r.grupo;

END;

$$;


ALTER FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer) OWNER TO postgres;

--
-- Name: impedir_alteracao_campos_criticos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.impedir_alteracao_campos_criticos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.status = 'aprovado' THEN
          IF OLD.cnpj != NEW.cnpj
            OR OLD.responsavel_cpf != NEW.responsavel_cpf
            OR OLD.email != NEW.email THEN
            RAISE EXCEPTION 'Não é possível alterar dados críticos após aprovação';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.impedir_alteracao_campos_criticos() OWNER TO postgres;

--
-- Name: is_admin_or_master(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin_or_master() RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$

BEGIN

    RETURN current_user_perfil() IN ('admin');

END;

$$;


ALTER FUNCTION public.is_admin_or_master() OWNER TO postgres;

--
-- Name: FUNCTION is_admin_or_master(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.is_admin_or_master() IS 'Verifica se o usuÃ¡rio atual tem perfil admin (acesso total)';


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
-- Name: limpar_notificacoes_resolvidas_antigas(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.limpar_notificacoes_resolvidas_antigas() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Arquivar notificaÃ§Ãµes resolvidas hÃ¡ mais de 90 dias
  UPDATE notificacoes
  SET arquivada = TRUE
  WHERE resolvida = TRUE
    AND data_resolucao < NOW() - INTERVAL '90 days'
    AND arquivada = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.limpar_notificacoes_resolvidas_antigas() OWNER TO postgres;

--
-- Name: FUNCTION limpar_notificacoes_resolvidas_antigas(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.limpar_notificacoes_resolvidas_antigas() IS 'Arquiva notificaÃ§Ãµes resolvidas hÃ¡ mais de 90 dias';


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
-- Name: notificar_renovacoes_proximas(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notificar_renovacoes_proximas() RETURNS integer
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_count INTEGER := 0;

    v_contrato RECORD;

BEGIN

    FOR v_contrato IN 

        SELECT * FROM contratos_planos 

        WHERE status = 'ativo' 

          AND data_fim_vigencia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

    LOOP

        INSERT INTO notificacoes_financeiras (contrato_id, tipo, titulo, mensagem, prioridade)

        VALUES (

            v_contrato.id,

            'renovacao_proxima',

            'RenovaÃ§Ã£o de contrato prÃ³xima',

            format('O contrato vence em %s. Prepare-se para renovaÃ§Ã£o ou upgrade.', v_contrato.data_fim_vigencia),

            'normal'

        )

        ON CONFLICT DO NOTHING;

        

        v_count := v_count + 1;

    END LOOP;

    

    RETURN v_count;

END;

$$;


ALTER FUNCTION public.notificar_renovacoes_proximas() OWNER TO postgres;

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
-- Name: obter_config_clinica(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.obter_config_clinica(p_clinica_id integer, p_chave text) OWNER TO postgres;

--
-- Name: obter_proximo_numero_ordem(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) OWNER TO postgres;

--
-- Name: FUNCTION obter_proximo_numero_ordem(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o próximo número de ordem sequencial para um novo lote da empresa';


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

  

  -- Fallback para portuguÃªs se nÃ£o encontrar traduÃ§Ã£o

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
-- Name: pode_acessar_contratante(integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.pode_acessar_contratante(p_contratante_id integer, p_cpf character varying DEFAULT NULL::character varying, p_perfil character varying DEFAULT NULL::character varying) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

    v_cpf VARCHAR(11);

    v_perfil VARCHAR(20);

BEGIN

    -- Usar parâmetros ou configurações da sessão

    v_cpf := COALESCE(p_cpf, current_setting('app.cpf', TRUE));

    v_perfil := COALESCE(p_perfil, current_setting('app.perfil', TRUE));

    

    -- Admin pode acessar tudo

    IF v_perfil = 'admin' THEN

        RETURN TRUE;

    END IF;

    

    -- Gestor de entidade pode acessar apenas sua entidade

    IF v_perfil = 'gestor' THEN

        RETURN p_contratante_id::TEXT = current_setting('app.contratante_id', TRUE);

    END IF;

    

    -- RH pode acessar sua clínica

    IF v_perfil = 'rh' THEN

        RETURN EXISTS (

            SELECT 1 FROM funcionarios

            WHERE cpf = v_cpf

            AND perfil = 'rh'

            AND contratante_id = p_contratante_id

        );

    END IF;

    

    RETURN FALSE;

END;

$$;


ALTER FUNCTION public.pode_acessar_contratante(p_contratante_id integer, p_cpf character varying, p_perfil character varying) OWNER TO postgres;

--
-- Name: FUNCTION pode_acessar_contratante(p_contratante_id integer, p_cpf character varying, p_perfil character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.pode_acessar_contratante(p_contratante_id integer, p_cpf character varying, p_perfil character varying) IS 'Verifica se um usuário tem permissão para acessar um contratante específico';


--
-- Name: protect_concluded_avaliacao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_concluded_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_perfil TEXT;

BEGIN

    -- Obter perfil do usuÃ¡rio atual

    v_perfil := current_setting('app.current_user_perfil', true);

    

    -- Se avaliaÃ§Ã£o estava concluÃ­da, nÃ£o permitir mudanÃ§a de status

    IF OLD.status = 'concluido' AND NEW.status != 'concluido' THEN

        RAISE EXCEPTION 'NÃ£o Ã© permitido alterar o status de uma avaliaÃ§Ã£o concluÃ­da. AvaliaÃ§Ã£o ID: %', OLD.id

            USING HINT = 'AvaliaÃ§Ãµes concluÃ­das nÃ£o podem ter seu status alterado.',

                  ERRCODE = '23506';

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.protect_concluded_avaliacao() OWNER TO postgres;

--
-- Name: refresh_funcionarios_por_contrato(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_funcionarios_por_contrato() RETURNS void
    LANGUAGE plpgsql
    AS $$

BEGIN

    REFRESH MATERIALIZED VIEW CONCURRENTLY view_funcionarios_por_contrato;

END;

$$;


ALTER FUNCTION public.refresh_funcionarios_por_contrato() OWNER TO postgres;

--
-- Name: registrar_inativacao_funcionario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_inativacao_funcionario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    current_user_cpf_val TEXT;

BEGIN

    -- Se mudou de ativo para inativo

    IF OLD.ativo = true AND NEW.ativo = false THEN

        -- Obter CPF do usuÃ¡rio atual da sessÃ£o

        current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');

        

        NEW.inativado_em := CURRENT_TIMESTAMP;

        NEW.inativado_por := current_user_cpf_val;

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.registrar_inativacao_funcionario() OWNER TO postgres;

--
-- Name: FUNCTION registrar_inativacao_funcionario(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.registrar_inativacao_funcionario() IS 'Registra automaticamente data e responsÃ¡vel pela inativaÃ§Ã£o de funcionÃ¡rios';


--
-- Name: registrar_log_exclusao_clinica(integer, character varying, character, character varying, character, character varying, character varying, text, integer, integer, integer, integer, character varying, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_log_exclusao_clinica(p_clinica_id integer, p_clinica_nome character varying, p_clinica_cnpj character, p_tipo_entidade character varying, p_admin_cpf character, p_admin_nome character varying, p_status character varying, p_motivo_falha text DEFAULT NULL::text, p_total_gestores integer DEFAULT 0, p_total_empresas integer DEFAULT 0, p_total_funcionarios integer DEFAULT 0, p_total_avaliacoes integer DEFAULT 0, p_ip_origem character varying DEFAULT NULL::character varying, p_user_agent text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO logs_exclusao_clinicas (
        clinica_id,
        clinica_nome,
        clinica_cnpj,
        tipo_entidade,
        admin_cpf,
        admin_nome,
        status,
        motivo_falha,
        total_gestores,
        total_empresas,
        total_funcionarios,
        total_avaliacoes,
        ip_origem,
        user_agent
    ) VALUES (
        p_clinica_id,
        p_clinica_nome,
        p_clinica_cnpj,
        p_tipo_entidade,
        p_admin_cpf,
        p_admin_nome,
        p_status,
        p_motivo_falha,
        p_total_gestores,
        p_total_empresas,
        p_total_funcionarios,
        p_total_avaliacoes,
        p_ip_origem,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;


ALTER FUNCTION public.registrar_log_exclusao_clinica(p_clinica_id integer, p_clinica_nome character varying, p_clinica_cnpj character, p_tipo_entidade character varying, p_admin_cpf character, p_admin_nome character varying, p_status character varying, p_motivo_falha text, p_total_gestores integer, p_total_empresas integer, p_total_funcionarios integer, p_total_avaliacoes integer, p_ip_origem character varying, p_user_agent text) OWNER TO postgres;

--
-- Name: resolver_notificacao(integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) OWNER TO postgres;

--
-- Name: FUNCTION resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) IS 'Marca uma notificaÃ§Ã£o como resolvida e registra auditoria';


--
-- Name: resolver_notificacoes_por_contexto(text, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Resolver todas as notificaÃ§Ãµes com chave/valor especÃ­fico no contexto
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


ALTER FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) OWNER TO postgres;

--
-- Name: FUNCTION resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) IS 'Resolve mÃºltiplas notificaÃ§Ãµes com base em critÃ©rio de contexto (ex: lote_id)';


--
-- Name: sync_contratante_plano_tipo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_contratante_plano_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    IF NEW.plano_id IS NOT NULL AND (OLD.plano_id IS NULL OR NEW.plano_id != OLD.plano_id) THEN

        -- Atualizar plano_tipo baseado no plano_id

        SELECT tipo INTO NEW.plano_tipo

        FROM planos

        WHERE id = NEW.plano_id;

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.sync_contratante_plano_tipo() OWNER TO postgres;

--
-- Name: sync_funcionario_clinica(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_funcionario_clinica() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Atualizar clinica_id dos funcionÃ¡rios desta empresa

    UPDATE funcionarios

    SET clinica_id = NEW.clinica_id

    WHERE empresa_id = NEW.id;



    RETURN NEW;

END;

$$;


ALTER FUNCTION public.sync_funcionario_clinica() OWNER TO postgres;

--
-- Name: update_entidades_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_entidades_senhas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.atualizado_em = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.update_entidades_senhas_updated_at() OWNER TO postgres;

--
-- Name: update_tomadores_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tomadores_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.atualizado_em = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.update_tomadores_updated_at() OWNER TO postgres;

--
-- Name: validar_cpf_completo(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_cpf_completo(cpf_input character varying) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$

DECLARE

    cpf CHAR(11);

    digito1 INTEGER;

    digito2 INTEGER;

    soma INTEGER;

    i INTEGER;

BEGIN

    -- Remover formataÃ§Ã£o

    cpf := REGEXP_REPLACE(cpf_input, '[^0-9]', '', 'g');

    

    -- Verificar tamanho

    IF LENGTH(cpf) != 11 THEN

        RETURN false;

    END IF;

    

    -- CPFs invÃ¡lidos conhecidos

    IF cpf IN ('00000000000', '11111111111', '22222222222', '33333333333', 

               '44444444444', '55555555555', '66666666666', '77777777777',

               '88888888888', '99999999999') THEN

        RETURN false;

    END IF;

    

    -- Calcular primeiro dÃ­gito verificador

    soma := 0;

    FOR i IN 1..9 LOOP

        soma := soma + (SUBSTRING(cpf, i, 1)::INTEGER * (11 - i));

    END LOOP;

    digito1 := 11 - (soma % 11);

    IF digito1 >= 10 THEN

        digito1 := 0;

    END IF;

    

    -- Verificar primeiro dÃ­gito

    IF digito1 != SUBSTRING(cpf, 10, 1)::INTEGER THEN

        RETURN false;

    END IF;

    

    -- Calcular segundo dÃ­gito verificador

    soma := 0;

    FOR i IN 1..10 LOOP

        soma := soma + (SUBSTRING(cpf, i, 1)::INTEGER * (12 - i));

    END LOOP;

    digito2 := 11 - (soma % 11);

    IF digito2 >= 10 THEN

        digito2 := 0;

    END IF;

    

    -- Verificar segundo dÃ­gito

    IF digito2 != SUBSTRING(cpf, 11, 1)::INTEGER THEN

        RETURN false;

    END IF;

    

    RETURN true;

END;

$$;


ALTER FUNCTION public.validar_cpf_completo(cpf_input character varying) OWNER TO postgres;

--
-- Name: validar_limite_funcionarios(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_limite_funcionarios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_contrato RECORD;

    v_plano RECORD;

    v_total_ativos INTEGER;

BEGIN

    -- Buscar contratos ativos relacionados ao funcionÃ¡rio

    FOR v_contrato IN 

        SELECT cp.*, p.limite_funcionarios

        FROM contratos_planos cp

        JOIN planos p ON cp.plano_id = p.id

        WHERE cp.status = 'ativo'

          AND ((cp.tipo_contratante = 'clinica' AND cp.clinica_id = NEW.clinica_id)

               OR (cp.tipo_contratante = 'entidade' AND cp.contratante_id = NEW.contratante_id))

          AND p.limite_funcionarios IS NOT NULL

    LOOP

        -- Contar funcionÃ¡rios ativos

        SELECT COUNT(*) INTO v_total_ativos

        FROM funcionarios f

        WHERE f.status = 'ativo'

          AND ((v_contrato.tipo_contratante = 'clinica' AND f.clinica_id = v_contrato.clinica_id)

               OR (v_contrato.tipo_contratante = 'entidade' AND f.contratante_id = v_contrato.contratante_id));

        

        -- Se exceder limite, criar notificaÃ§Ã£o

        IF v_total_ativos > v_contrato.limite_funcionarios THEN

            INSERT INTO notificacoes_financeiras (contrato_id, tipo, titulo, mensagem, prioridade)

            VALUES (

                v_contrato.id,

                'limite_excedido',

                'Limite de funcionÃ¡rios excedido',

                format('O plano atual suporta atÃ© %s funcionÃ¡rios, mas hÃ¡ %s ativos. Considere upgrade do plano.', 

                       v_contrato.limite_funcionarios, v_total_ativos),

                'alta'

            );

        END IF;

        

        -- Atualizar contador atual

        UPDATE contratos_planos 

        SET numero_funcionarios_atual = v_total_ativos 

        WHERE id = v_contrato.id;

    END LOOP;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.validar_limite_funcionarios() OWNER TO postgres;

--
-- Name: validar_lote_pre_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb)
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

BEGIN

  -- Buscar dados do lote

  SELECT empresa_id, numero_ordem INTO v_empresa_id, v_numero_lote

  FROM lotes_avaliacao

  WHERE id = p_lote_id;

  

  -- Contar avaliações do lote

  SELECT 

    COUNT(*) AS total,

    COUNT(*) FILTER (WHERE status = 'concluido') AS concluidas,

    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas

  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas

  FROM avaliacoes

  WHERE lote_id = p_lote_id;

  

  -- Verificar funcionários que deveriam estar no lote mas não estão

  SELECT COUNT(*) INTO v_funcionarios_pendentes

  FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el

  WHERE NOT EXISTS (

    SELECT 1 FROM avaliacoes a 

    WHERE a.funcionario_cpf = el.funcionario_cpf 

    AND a.lote_id = p_lote_id

  );

  

  -- Gerar alertas

  IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN

    v_alertas := array_append(v_alertas, 'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' || v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || '). Verifique se há problemas sistêmicos.');

  END IF;

  

  IF v_funcionarios_pendentes > 0 THEN

    v_alertas := array_append(v_alertas, 'PENDÊNCIA: ' || v_funcionarios_pendentes || ' funcionário(s) deveriam estar neste lote mas não foram incluídos. Revise a elegibilidade.');

  END IF;

  

  IF v_avaliacoes_concluidas = 0 THEN

    v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');

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

  

  -- Retornar resultado

  RETURN QUERY SELECT 

    (array_length(v_alertas, 1) IS NULL OR array_length(v_alertas, 1) = 0) AND v_avaliacoes_concluidas > 0 AS valido,

    v_alertas AS alertas,

    v_funcionarios_pendentes,

    v_detalhes AS detalhes;

END;

$$;


ALTER FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote está pronto para laudo (índice completo); retorna alertas e métricas (anomalias reportadas como alertas, NÃO bloqueantes)';


--
-- Name: validar_parcelas_json(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_parcelas_json() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Se hÃ¡ parcelas_json, validar estrutura

    IF NEW.parcelas_json IS NOT NULL THEN

        -- Verificar se Ã© um array

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

    

    -- Se modalidade Ã© parcelado, deve ter parcelas_json

    IF NEW.modalidade_pagamento = 'parcelado' AND NEW.parcelas_json IS NULL THEN

        RAISE EXCEPTION 'Pagamento parcelado deve conter detalhes das parcelas em parcelas_json';

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.validar_parcelas_json() OWNER TO postgres;

--
-- Name: validar_rh_obrigatorio(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_rh_obrigatorio() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

DECLARE

    v_count INTEGER;

BEGIN

    -- Se estiver desativando um RH, verificar se existe outro ativo

    IF NEW.perfil = 'rh' AND NEW.ativo = false THEN

        SELECT COUNT(*) INTO v_count

        FROM funcionarios

        WHERE clinica_id = NEW.clinica_id

          AND perfil = 'rh'

          AND ativo = true

          AND cpf != NEW.cpf;

        

        -- Se nÃ£o hÃ¡ outro RH ativo, bloquear

        IF v_count = 0 THEN

            RAISE EXCEPTION 'NÃ£o Ã© possÃ­vel desativar o Ãºnico gestor RH ativo da clÃ­nica. Crie ou ative outro gestor antes.';

        END IF;

    END IF;

    

    RETURN NEW;

END;

$$;


ALTER FUNCTION public.validar_rh_obrigatorio() OWNER TO postgres;

--
-- Name: FUNCTION validar_rh_obrigatorio(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_rh_obrigatorio() IS 'Impede desativaÃ§Ã£o do Ãºltimo RH ativo de uma clÃ­nica';


--
-- Name: validar_transicao_status_contratante(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_transicao_status_contratante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF OLD.status = 'rejeitado' AND NEW.status != 'rejeitado' THEN
          RAISE EXCEPTION 'Contratante rejeitado não pode ter status alterado';
        END IF;

        IF OLD.status = 'aprovado' AND NEW.status NOT IN ('aprovado', 'cancelado') THEN
          RAISE EXCEPTION 'Contratante aprovado só pode ser cancelado';
        END IF;

        RETURN NEW;
      END;
      $$;


ALTER FUNCTION public.validar_transicao_status_contratante() OWNER TO postgres;

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

BEGIN

  -- Buscar empresa_id do lote

  SELECT empresa_id INTO v_empresa_id

  FROM lotes_avaliacao

  WHERE id = p_lote_id;

  

  -- Verificar se funcionário tem anomalias críticas

  SELECT EXISTS(

    SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias

    WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRÍTICA'

  ) INTO v_tem_anomalia_critica;

  

  -- Buscar ordem do lote atual

  SELECT numero_ordem INTO v_lote_atual_ordem

  FROM lotes_avaliacao

  WHERE id = p_lote_id;

  

  -- Buscar lote anterior (ordem - 1)

  SELECT la.numero_ordem, a.statusINTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo

  FROM lotes_avaliacao la

  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf

  WHERE la.empresa_id = v_empresa_id

    AND la.numero_ordem = v_lote_atual_ordem - 1

  LIMIT 1;

  

  -- Contar inativações consecutivas (últimos 3 lotes)

  SELECT COUNT(*) INTO v_total_consecutivas

  FROM avaliacoes a

  JOIN lotes_avaliacao la ON a.lote_id = la.id

  WHERE a.funcionario_cpf = p_funcionario_cpf

    AND a.status = 'inativada'

    AND la.empresa_id = v_empresa_id

    AND la.numero_ordem >= v_lote_atual_ordem - 3

    AND la.numero_ordem < v_lote_atual_ordem;

  

  -- Se tem anomalia crítica, permitir inativação consecutiva

  IF v_tem_anomalia_critica THEN

    RETURN QUERY SELECT 

      true AS permitido,

      '✅ PERMITIDO: Funcionário tem anomalias críticas detectadas. Inativação consecutiva autorizada automaticamente. ' ||

      'Motivo: Anomalias críticas justificam flexibilização do processo de avaliação.' AS motivo,

      v_total_consecutivas AS total_inativacoes_consecutivas,

      v_ultima_inativacao_codigo AS ultima_inativacao_lote;

  -- Verificar se avaliação anterior foi inativada

  ELSIF v_avaliacao_anterior_status = 'inativada' THEN

    -- Permitir forçar se não há muitas inativações consecutivas (até 3 permitidas)

    IF v_total_consecutivas < 3 THEN

      RETURN QUERY SELECT 

        false AS permitido,

        '⚠️ NÃO É POSSÍVEL INATIVAR ESTA AVALIAÇÃO! O funcionário ' || 

        (SELECT nome FROM funcionarios WHERE cpf = p_funcionario_cpf) ||

        ' já teve a avaliação anterior (Lote ' || v_ultima_inativacao_codigo || ') inativada. ' ||

        'Inativar consecutivamente viola a obrigatoriedade de renovação anual. ' ||

        'O funcionário DEVE completar esta avaliação ou ser excluído temporariamente por motivo justificado (ex: licença médica, afastamento). ' ||

        'Se precisar inativar mesmo assim, o sistema solicitará justificativa detalhada e registro de auditoria.' AS motivo,

        v_total_consecutivas AS total_inativacoes_consecutivas,

        v_ultima_inativacao_codigo AS ultima_inativacao_lote;

    ELSE

      RETURN QUERY SELECT 

        true AS permitido,

        '⚠️ ATENÇÃO: Este funcionário já teve ' || v_total_consecutivas || ' avaliações consecutivas inativadas. ' ||

        'Por necessidade crítica, a inativação é permitida, mas será registrada como excepcional. ' ||

        'Certifique-se de que há justificativa adequada (ex: afastamento prolongado, situação médica grave).' AS motivo,

        v_total_consecutivas AS total_inativacoes_consecutivas,

        v_ultima_inativacao_codigo AS ultima_inativacao_lote;

    END IF;

  ELSIF v_total_consecutivas >= 2 THEN

    RETURN QUERY SELECT 

      false AS permitido,

      '⚠️ ATENÇÃO: Este funcionário tem ' || v_total_consecutivas || ' inativações nos últimos lotes. ' ||

      'Inativar novamente pode indicar padrão suspeito. Verifique o histórico antes de prosseguir.' AS motivo,

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


ALTER FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) OWNER TO postgres;

--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Verifica se funcionário pode ter avaliação inativada (impede 2ª consecutiva)';


--
-- Name: verificar_permissao_mudanca_status(integer, character varying, public.status_contratacao_personalizada, public.status_contratacao_personalizada); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_permissao_mudanca_status(p_contratacao_id integer, p_user_perfil character varying, p_status_atual public.status_contratacao_personalizada, p_status_novo public.status_contratacao_personalizada) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

    -- Admin pode fazer qualquer mudanÃ§a

    IF p_user_perfil = 'admin' THEN

        RETURN TRUE;

    END IF;

    

    -- Gestor de entidade sÃ³ pode cancelar ou aceitar contrato

    IF p_user_perfil = 'gestor' THEN

        IF p_status_novo = 'cancelado' THEN

            RETURN TRUE;

        END IF;

        

        IF p_status_atual = 'contrato_gerado' AND p_status_novo = 'contrato_aceito' THEN

            RETURN TRUE;

        END IF;

    END IF;

    

    RETURN FALSE;

END;

$$;


ALTER FUNCTION public.verificar_permissao_mudanca_status(p_contratacao_id integer, p_user_perfil character varying, p_status_atual public.status_contratacao_personalizada, p_status_novo public.status_contratacao_personalizada) OWNER TO postgres;

--
-- Name: FUNCTION verificar_permissao_mudanca_status(p_contratacao_id integer, p_user_perfil character varying, p_status_atual public.status_contratacao_personalizada, p_status_novo public.status_contratacao_personalizada); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_permissao_mudanca_status(p_contratacao_id integer, p_user_perfil character varying, p_status_atual public.status_contratacao_personalizada, p_status_novo public.status_contratacao_personalizada) IS 'Verifica se um usuÃ¡rio tem permissÃ£o para mudar o status de uma contrataÃ§Ã£o';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administradores (
    id integer NOT NULL,
    cpf character(11) NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash text NOT NULL,
    clinica_id integer,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    criado_por character varying(11),
    data_consentimento timestamp without time zone,
    ip_consentimento inet,
    base_legal character varying(20) DEFAULT 'contrato'::character varying,
    CONSTRAINT administradores_base_legal_check CHECK (((base_legal)::text = ANY (ARRAY[('contrato'::character varying)::text, ('obrigacao_legal'::character varying)::text, ('consentimento'::character varying)::text, ('interesse_legitimo'::character varying)::text]))),
    CONSTRAINT cpf_valido_admin CHECK (((length(cpf) = 11) AND (cpf ~ '^[0-9]+$'::text)))
);


ALTER TABLE public.administradores OWNER TO postgres;

--
-- Name: TABLE administradores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.administradores IS 'Perfis administrativos do sistema - nÃ£o sÃ£o funcionÃ¡rios de empresas';


--
-- Name: administradores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.administradores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administradores_id_seq OWNER TO postgres;

--
-- Name: administradores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.administradores_id_seq OWNED BY public.administradores.id;


--
-- Name: alertas_integridade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertas_integridade (
    id integer NOT NULL,
    tipo character varying(100) NOT NULL,
    severidade character varying(20) NOT NULL,
    recurso character varying(100) NOT NULL,
    recurso_id integer,
    descricao text NOT NULL,
    dados_contexto jsonb,
    resolvido boolean DEFAULT false,
    resolvido_em timestamp without time zone,
    resolvido_por character varying(14),
    criado_em timestamp without time zone DEFAULT now(),
    CONSTRAINT alertas_integridade_severidade_check CHECK (((severidade)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))
);


ALTER TABLE public.alertas_integridade OWNER TO postgres;

--
-- Name: TABLE alertas_integridade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.alertas_integridade IS 'Armazena alertas de violaÃ§Ãµes de integridade detectadas pelo sistema. Usado para auditoria e correÃ§Ã£o automÃ¡tica.';


--
-- Name: alertas_integridade_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertas_integridade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alertas_integridade_id_seq OWNER TO postgres;

--
-- Name: alertas_integridade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertas_integridade_id_seq OWNED BY public.alertas_integridade.id;


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
-- Name: audit_access_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_access_log (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    perfil text,
    cpf text,
    tabela text,
    operacao text,
    motivo text
);


ALTER TABLE public.audit_access_log OWNER TO postgres;

--
-- Name: audit_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_access_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_access_log_id_seq OWNER TO postgres;

--
-- Name: audit_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_access_log_id_seq OWNED BY public.audit_access_log.id;


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
    contratante_id integer
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as aÃ§Ãµes crÃ­ticas no sistema';


--
-- Name: COLUMN audit_logs.contratante_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.contratante_id IS 'ID do contratante (entidade) responsÃ¡vel pela aÃ§Ã£o. NULL para clÃ­nicas ou aÃ§Ãµes administrativas.';


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

COMMENT ON VIEW public.audit_stats_by_user IS 'EstatÃ­sticas de aÃ§Ãµes por usuÃ¡rio para anÃ¡lise de comportamento';


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
-- Name: auditoria_planos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_planos (
    id integer NOT NULL,
    contrato_id integer,
    plano_id integer,
    acao character varying(50) NOT NULL,
    dados_anteriores jsonb,
    dados_novos jsonb,
    motivo text,
    usuario_cpf character varying(11) NOT NULL,
    ip_origem character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT auditoria_planos_acao_check CHECK (((acao)::text = ANY (ARRAY[('criacao'::character varying)::text, ('alteracao_tentada'::character varying)::text, ('alteracao_sucesso'::character varying)::text, ('renovacao'::character varying)::text, ('cancelamento'::character varying)::text])))
);


ALTER TABLE public.auditoria_planos OWNER TO postgres;

--
-- Name: auditoria_planos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_planos_id_seq OWNER TO postgres;

--
-- Name: auditoria_planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_planos_id_seq OWNED BY public.auditoria_planos.id;


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
    base_legal character varying(20) DEFAULT 'obrigacao_legal'::character varying,
    data_consentimento timestamp without time zone,
    ip_consentimento inet,
    consentimento_documento text,
    data_validade timestamp without time zone,
    anonimizada boolean DEFAULT false,
    data_anonimizacao timestamp without time zone,
    CONSTRAINT avaliacoes_base_legal_check CHECK (((base_legal)::text = ANY (ARRAY[('contrato'::character varying)::text, ('obrigacao_legal'::character varying)::text, ('consentimento'::character varying)::text, ('interesse_legitimo'::character varying)::text]))),
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY (ARRAY[('iniciada'::character varying)::text, ('em_andamento'::character varying)::text, ('concluido'::character varying)::text, ('inativada'::character varying)::text])))
);


ALTER TABLE public.avaliacoes OWNER TO postgres;

--
-- Name: COLUMN avaliacoes.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.status IS 'Status da avaliação: iniciada, em_andamento, concluida, inativada (não incrementa índice)';


--
-- Name: COLUMN avaliacoes.inativada_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.inativada_em IS 'Timestamp quando a avaliacao foi inativada pelo RH';


--
-- Name: COLUMN avaliacoes.motivo_inativacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.motivo_inativacao IS 'Motivo informado pelo RH para inativacao da avaliacao';


--
-- Name: COLUMN avaliacoes.base_legal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.base_legal IS 'Base legal LGPD: contrato, obrigacao_legal, consentimento, interesse_legitimo';


--
-- Name: COLUMN avaliacoes.data_validade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.avaliacoes.data_validade IS 'Data apÃ³s a qual os dados devem ser anonimizados (36 meses)';


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
-- Name: clinica_configuracoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.clinica_configuracoes OWNER TO postgres;

--
-- Name: TABLE clinica_configuracoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.clinica_configuracoes IS 'Configuracoes e campos customizaveis por clinica';


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinica_configuracoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinica_configuracoes_id_seq OWNER TO postgres;

--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinica_configuracoes_id_seq OWNED BY public.clinica_configuracoes.id;


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
    razao_social character varying(200),
    inscricao_estadual character varying(20),
    cidade character varying(100),
    estado character varying(2),
    idioma_preferencial public.idioma_suportado DEFAULT 'pt_BR'::public.idioma_suportado,
    contratante_id integer
);


ALTER TABLE public.clinicas OWNER TO postgres;

--
-- Name: COLUMN clinicas.razao_social; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.razao_social IS 'RazÃ£o social da clÃ­nica (diferente do nome fantasia)';


--
-- Name: COLUMN clinicas.inscricao_estadual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.inscricao_estadual IS 'InscriÃ§Ã£o estadual da clÃ­nica';


--
-- Name: COLUMN clinicas.cidade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.cidade IS 'Cidade onde a clÃ­nica estÃ¡ localizada';


--
-- Name: COLUMN clinicas.estado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.estado IS 'Sigla do estado (UF) onde a clÃ­nica estÃ¡ localizada';


--
-- Name: COLUMN clinicas.contratante_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.clinicas.contratante_id IS 'ID do contratante associado a esta clinica';


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

COMMENT ON COLUMN public.clinicas_empresas.clinica_id IS 'ID do funcionÃ¡rio RH que representa a clÃ­nica';


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
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: tomadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tomadores (
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
    plano_id integer,
    pagamento_confirmado boolean DEFAULT false,
    data_liberacao_login timestamp without time zone,
    data_primeiro_pagamento timestamp without time zone,
    numero_funcionarios_estimado integer,
    plano_tipo public.tipo_plano,
    contrato_aceito boolean DEFAULT false,
    CONSTRAINT chk_ativa_exige_pagamento CHECK (((ativa = false) OR (pagamento_confirmado = true))),
    CONSTRAINT tomadores_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT tomadores_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
);


ALTER TABLE public.tomadores OWNER TO postgres;

--
-- Name: TABLE tomadores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tomadores IS 'Tabela unificada para clÃ­nicas e entidades privadas';


--
-- Name: COLUMN tomadores.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.tipo IS 'clinica: medicina ocupacional com empresas intermediÃ¡rias | entidade: empresa privada com vÃ­nculo direto';


--
-- Name: COLUMN tomadores.responsavel_nome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.responsavel_nome IS 'Para clÃ­nicas: gestor RH | Para entidades: responsÃ¡vel pelo cadastro';


--
-- Name: COLUMN tomadores.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.status IS 'Status do cadastro: pendente, aguardando_pagamento, aprovado, cancelado, suspenso, inconsistente. TransiÃ§Ãµes vÃ¡lidas sÃ£o auditadas.';


--
-- Name: COLUMN tomadores.ativa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.ativa IS 'Indica se o contratante está ativo no sistema. DEFAULT false - ativação ocorre APENAS após confirmação de pagamento (LEGACY: fluxo arquivado).';


--
-- Name: COLUMN tomadores.plano_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.plano_id IS 'Plano selecionado pelo contratante';


--
-- Name: COLUMN tomadores.pagamento_confirmado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.pagamento_confirmado IS 'Indica se pagamento foi confirmado. Requisito obrigatÃ³rio para ativar contratante (ativa=true).';


--
-- Name: COLUMN tomadores.data_liberacao_login; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.data_liberacao_login IS 'Data em que o login foi liberado apÃ³s pagamento';


--
-- Name: COLUMN tomadores.numero_funcionarios_estimado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.numero_funcionarios_estimado IS 'NÃºmero estimado de funcionÃ¡rios informado no cadastro - usado para calcular valor total em planos personalizados';


--
-- Name: COLUMN tomadores.plano_tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.plano_tipo IS 'Tipo do plano (desnormalizado para evitar JOINs constantes)';


--
-- Name: COLUMN tomadores.contrato_aceito; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores.contrato_aceito IS 'Indica se o contratante aceitou o contrato/polÃ­tica (usado para fluxo de pagamento e notificaÃ§Ãµes)';


--
-- Name: tomadores_funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tomadores_funcionarios (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    contratante_id integer NOT NULL,
    tipo_contratante public.tipo_contratante_enum NOT NULL,
    vinculo_ativo boolean DEFAULT true,
    data_inicio date DEFAULT CURRENT_DATE,
    data_fim date,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tomadores_funcionarios_datas_check CHECK (((data_fim IS NULL) OR (data_fim >= data_inicio)))
);


ALTER TABLE public.tomadores_funcionarios OWNER TO postgres;

--
-- Name: TABLE tomadores_funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tomadores_funcionarios IS 'Relacionamento polimÃ³rfico entre funcionÃ¡rios e tomadores (clÃ­nicas/entidades)';


--
-- Name: COLUMN tomadores_funcionarios.tipo_contratante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tomadores_funcionarios.tipo_contratante IS 'Redundante mas facilita queries sem join adicional';


--
-- Name: tomadores_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tomadores_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tomadores_funcionarios_id_seq OWNER TO postgres;

--
-- Name: tomadores_funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tomadores_funcionarios_id_seq OWNED BY public.tomadores_funcionarios.id;


--
-- Name: tomadores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tomadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tomadores_id_seq OWNER TO postgres;

--
-- Name: tomadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tomadores_id_seq OWNED BY public.tomadores.id;


--
-- Name: entidades_senhas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidades_senhas (
    id integer NOT NULL,
    contratante_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entidades_senhas_cpf_check CHECK ((length((cpf)::text) = 11))
);


ALTER TABLE public.entidades_senhas OWNER TO postgres;

--
-- Name: TABLE entidades_senhas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.entidades_senhas IS 'Senhas hash para gestores de entidades fazerem login';


--
-- Name: COLUMN entidades_senhas.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades_senhas.cpf IS 'CPF do responsavel_cpf em tomadores - usado para login';


--
-- Name: COLUMN entidades_senhas.primeira_senha_alterada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.entidades_senhas.primeira_senha_alterada IS 'Flag para forÃ§ar alteraÃ§Ã£o de senha no primeiro acesso';


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entidades_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entidades_senhas_id_seq OWNER TO postgres;

--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entidades_senhas_id_seq OWNED BY public.entidades_senhas.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    contratante_id integer,
    plano_id integer,
    numero_funcionarios integer,
    numero_funcionarios_estimado integer,
    valor_total numeric(12,2),
    valor_personalizado numeric(12,2),
    conteudo text,
    conteudo_gerado text,
    aceito boolean DEFAULT false,
    ip_aceite character varying(45),
    data_aceite timestamp without time zone,
    status character varying(50) DEFAULT 'generated'::character varying,
    payment_link_token character varying(128),
    payment_link_expiracao timestamp without time zone,
    link_enviado_em timestamp without time zone,
    criado_por_cpf character varying(11),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contratos OWNER TO postgres;

--
-- Name: TABLE contratos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contratos IS 'Contratos gerados para tomadores. Fluxo simplificado sem tabelas intermediÃ¡rias.';


--
-- Name: COLUMN contratos.valor_personalizado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.valor_personalizado IS 'Valor personalizado por funcionÃ¡rio (para planos personalizados)';


--
-- Name: COLUMN contratos.conteudo_gerado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.conteudo_gerado IS 'ConteÃºdo completo do contrato gerado para o contratante';


--
-- Name: COLUMN contratos.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contratos.status IS 'Status extra usado para controle de pagamento (LEGACY: anteriormente parte do fluxo arquivado)';


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
    data_contratacao date DEFAULT CURRENT_DATE NOT NULL,
    data_fim_vigencia date NOT NULL,
    numero_funcionarios_estimado integer NOT NULL,
    numero_funcionarios_atual integer DEFAULT 0,
    forma_pagamento character varying(20) DEFAULT 'anual'::character varying,
    numero_parcelas integer DEFAULT 1,
    status character varying(20) DEFAULT 'ativo'::character varying,
    bloqueado boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valor_pago numeric(10,2),
    tipo_pagamento character varying(20),
    modalidade_pagamento character varying(20),
    data_pagamento timestamp without time zone,
    parcelas_json jsonb,
    CONSTRAINT check_tipo_contratante CHECK (((((tipo_contratante)::text = 'clinica'::text) AND (clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR (((tipo_contratante)::text = 'entidade'::text) AND (contratante_id IS NOT NULL) AND (clinica_id IS NULL)))),
    CONSTRAINT contratos_planos_forma_pagamento_check CHECK (((forma_pagamento)::text = ANY (ARRAY[('anual'::character varying)::text, ('mensal'::character varying)::text]))),
    CONSTRAINT contratos_planos_modalidade_pagamento_check CHECK (((modalidade_pagamento)::text = ANY (ARRAY[('a_vista'::character varying)::text, ('parcelado'::character varying)::text, (NULL::character varying)::text]))),
    CONSTRAINT contratos_planos_numero_parcelas_check CHECK (((numero_parcelas >= 1) AND (numero_parcelas <= 12))),
    CONSTRAINT contratos_planos_status_check CHECK (((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('vencido'::character varying)::text, ('cancelado'::character varying)::text, ('renovacao_pendente'::character varying)::text]))),
    CONSTRAINT contratos_planos_tipo_contratante_check CHECK (((tipo_contratante)::text = ANY (ARRAY[('clinica'::character varying)::text, ('entidade'::character varying)::text]))),
    CONSTRAINT contratos_planos_tipo_pagamento_check CHECK (((tipo_pagamento)::text = ANY (ARRAY[('boleto'::character varying)::text, ('cartao'::character varying)::text, ('pix'::character varying)::text, (NULL::character varying)::text])))
);


ALTER TABLE public.contratos_planos OWNER TO postgres;

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
-- Name: emissores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emissores (
    id integer NOT NULL,
    cpf character(11) NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash text NOT NULL,
    clinica_id integer,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now(),
    criado_por character varying(11),
    data_consentimento timestamp without time zone,
    ip_consentimento inet,
    base_legal character varying(20) DEFAULT 'contrato'::character varying,
    registro_profissional character varying(50),
    conselho_classe character varying(20),
    CONSTRAINT cpf_valido_emissor CHECK (((length(cpf) = 11) AND (cpf ~ '^[0-9]+$'::text))),
    CONSTRAINT emissores_base_legal_check CHECK (((base_legal)::text = ANY (ARRAY[('contrato'::character varying)::text, ('obrigacao_legal'::character varying)::text, ('consentimento'::character varying)::text, ('interesse_legitimo'::character varying)::text])))
);


ALTER TABLE public.emissores OWNER TO postgres;

--
-- Name: TABLE emissores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.emissores IS 'Profissionais tÃ©cnicos responsÃ¡veis por emissÃ£o de laudos - nÃ£o sÃ£o funcionÃ¡rios de empresas';


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
    nivel_cargo public.nivel_cargo_enum,
    turno character varying(50),
    escala character varying(50),
    data_inclusao date,
    incluido_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    inativado_em timestamp without time zone,
    inativado_por character varying(11),
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    data_ultimo_lote timestamp without time zone,
    contratante_id integer,
    CONSTRAINT funcionarios_clinica_check CHECK (((clinica_id IS NOT NULL) OR ((perfil)::text = ANY (ARRAY['emissor'::text, 'admin'::text])))),
    CONSTRAINT funcionarios_nivel_cargo_check CHECK ((((perfil)::text = ANY (ARRAY[('admin'::character varying)::text, ('rh'::character varying)::text, ('emissor'::character varying)::text])) OR (((perfil)::text = 'funcionario'::text) AND (nivel_cargo IS NOT NULL)))), 
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY (ARRAY[('funcionario'::character varying)::text, ('rh'::character varying)::text, ('admin'::character varying)::text, ('emissor'::character varying)::text, ('gestor'::character varying)::text])))
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: COLUMN funcionarios.incluido_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.incluido_em IS 'Data e hora em que o funcionÃ¡rio foi incluÃ­do no sistema';


--
-- Name: COLUMN funcionarios.inativado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.inativado_em IS 'Data e hora em que o funcionÃ¡rio foi inativado';


--
-- Name: COLUMN funcionarios.inativado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.inativado_por IS 'CPF do usuÃ¡rio que inativou o funcionÃ¡rio';


--
-- Name: COLUMN funcionarios.indice_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.indice_avaliacao IS 'Número sequencial da última avaliação concluída pelo funcionário (0 = nunca fez)';


--
-- Name: COLUMN funcionarios.data_ultimo_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.funcionarios.data_ultimo_lote IS 'Data/hora da última avaliação válida concluída (usado para verificar prazo de 1 ano)';


--
-- Name: cpfs_invalidos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.cpfs_invalidos AS
 SELECT 'funcionarios'::text AS tabela,
    funcionarios.id,
    funcionarios.cpf,
    funcionarios.nome,
    funcionarios.email,
    funcionarios.ativo
   FROM public.funcionarios
  WHERE (NOT public.validar_cpf_completo((funcionarios.cpf)::character varying))
UNION ALL
 SELECT 'administradores'::text AS tabela,
    administradores.id,
    administradores.cpf,
    administradores.nome,
    administradores.email,
    administradores.ativo
   FROM public.administradores
  WHERE (NOT public.validar_cpf_completo((administradores.cpf)::character varying))
UNION ALL
 SELECT 'emissores'::text AS tabela,
    emissores.id,
    emissores.cpf,
    emissores.nome,
    emissores.email,
    emissores.ativo
   FROM public.emissores
  WHERE (NOT public.validar_cpf_completo((emissores.cpf)::character varying));


ALTER VIEW public.cpfs_invalidos OWNER TO postgres;

--
-- Name: emissores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emissores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emissores_id_seq OWNER TO postgres;

--
-- Name: emissores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emissores_id_seq OWNED BY public.emissores.id;


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
    clinica_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    representante_nome text,
    representante_fone text,
    representante_email text
);


ALTER TABLE public.empresas_clientes OWNER TO postgres;

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
-- Name: historico_contratos_planos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historico_contratos_planos (
    id integer NOT NULL,
    contrato_id integer,
    plano_id integer,
    valor_snapshot numeric(10,2),
    numero_funcionarios_snapshot integer,
    data_snapshot timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    motivo character varying(100),
    alterado_por character varying(11)
);


ALTER TABLE public.historico_contratos_planos OWNER TO postgres;

--
-- Name: historico_contratos_planos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historico_contratos_planos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historico_contratos_planos_id_seq OWNER TO postgres;

--
-- Name: historico_contratos_planos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historico_contratos_planos_id_seq OWNED BY public.historico_contratos_planos.id;


--
-- Name: historico_exclusoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historico_exclusoes (
    id integer NOT NULL,
    tipo_registro character varying(50) NOT NULL,
    registro_id integer NOT NULL,
    cpf_anonimizado character varying(20),
    motivo character varying(100) NOT NULL,
    data_exclusao timestamp without time zone DEFAULT now(),
    executado_por character varying(11),
    dados_anonimizados jsonb
);


ALTER TABLE public.historico_exclusoes OWNER TO postgres;

--
-- Name: TABLE historico_exclusoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.historico_exclusoes IS 'Registro de auditoria para exclusÃµes e anonimizaÃ§Ãµes realizadas';


--
-- Name: historico_exclusoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historico_exclusoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historico_exclusoes_id_seq OWNER TO postgres;

--
-- Name: historico_exclusoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historico_exclusoes_id_seq OWNED BY public.historico_exclusoes.id;


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
    arquivo_pdf bytea,
    hash_pdf character varying(64),
    relatorio_individual bytea,
    relatorio_lote bytea,
    relatorio_setor bytea,
    hash_relatorio_individual character varying(64),
    hash_relatorio_lote character varying(64),
    hash_relatorio_setor character varying(64),
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text])))
);


ALTER TABLE public.laudos OWNER TO postgres;

--
-- Name: COLUMN laudos.arquivo_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.arquivo_pdf IS 'Arquivo PDF do Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO) gerado pelo emissor, armazenado como binário';


--
-- Name: COLUMN laudos.hash_pdf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificaÃ§Ã£o de integridade';


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
-- Name: logs_exclusao_clinicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs_exclusao_clinicas (
    id integer NOT NULL,
    clinica_id integer,
    clinica_nome character varying(100),
    clinica_cnpj character(14),
    tipo_entidade character varying(20),
    admin_cpf character(11) NOT NULL,
    admin_nome character varying(100) NOT NULL,
    status character varying(20) NOT NULL,
    motivo_falha text,
    total_gestores integer DEFAULT 0,
    total_empresas integer DEFAULT 0,
    total_funcionarios integer DEFAULT 0,
    total_avaliacoes integer DEFAULT 0,
    ip_origem character varying(45),
    user_agent text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT logs_exclusao_clinicas_status_check CHECK (((status)::text = ANY ((ARRAY['sucesso'::character varying, 'falha'::character varying, 'negado'::character varying])::text[]))),
    CONSTRAINT logs_exclusao_clinicas_tipo_entidade_check CHECK (((tipo_entidade)::text = ANY ((ARRAY['clinica'::character varying, 'entidade'::character varying])::text[])))
);


ALTER TABLE public.logs_exclusao_clinicas OWNER TO postgres;

--
-- Name: TABLE logs_exclusao_clinicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.logs_exclusao_clinicas IS 'Registra tentativas de exclusÃ£o de clÃ­nicas e entidades para auditoria';


--
-- Name: COLUMN logs_exclusao_clinicas.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.logs_exclusao_clinicas.status IS 'sucesso: excluÃ­do com sucesso | falha: erro tÃ©cnico | negado: senha incorreta';


--
-- Name: COLUMN logs_exclusao_clinicas.motivo_falha; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.logs_exclusao_clinicas.motivo_falha IS 'Detalhe do erro quando status != sucesso';


--
-- Name: logs_exclusao_clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_exclusao_clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_exclusao_clinicas_id_seq OWNER TO postgres;

--
-- Name: logs_exclusao_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_exclusao_clinicas_id_seq OWNED BY public.logs_exclusao_clinicas.id;


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
    liberado_por character(11) NOT NULL,
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    laudo_enviado_em timestamp without time zone,
    auto_emitir_em timestamp with time zone,
    auto_emitir_agendado boolean DEFAULT false,
    finalizado_em timestamp without time zone,
    numero_ordem integer DEFAULT 1 NOT NULL,
    contratante_id integer,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('cancelado'::character varying)::text, ('finalizado'::character varying)::text, ('concluido'::character varying)::text, ('rascunho'::character varying)::text]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text])))
);


ALTER TABLE public.lotes_avaliacao OWNER TO postgres;

--
-- Name: COLUMN lotes_avaliacao.laudo_enviado_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.laudo_enviado_em IS 'Data e hora em que o laudo do lote foi enviado para a clínica';


--
-- Name: COLUMN lotes_avaliacao.auto_emitir_em; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.auto_emitir_em IS 'Data/hora programada para emissão automática do laudo (4h após conclusão)';


--
-- Name: COLUMN lotes_avaliacao.auto_emitir_agendado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.auto_emitir_agendado IS 'Flag indicando se a emissão automática foi agendada';


--
-- Name: COLUMN lotes_avaliacao.numero_ordem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.lotes_avaliacao.numero_ordem IS 'Número sequencial do lote na empresa (ex: 10 para o 10º lote da empresa)';


--
-- Name: lotes_avaliacao_funcionarios_backup_20251220; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes_avaliacao_funcionarios_backup_20251220 (
    id integer,
    lote_id integer,
    funcionario_id integer,
    avaliacao_id integer,
    criado_em timestamp without time zone
);


ALTER TABLE public.lotes_avaliacao_funcionarios_backup_20251220 OWNER TO postgres;

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
    resolvida boolean DEFAULT false NOT NULL,
    data_resolucao timestamp without time zone,
    resolvido_por_cpf character varying(11),
    CONSTRAINT notificacao_destinatario_valido CHECK ((length(destinatario_cpf) > 0)),
    CONSTRAINT notificacoes_destinatario_tipo_check CHECK ((destinatario_tipo = ANY (ARRAY['admin'::text, 'gestor'::text, 'funcionario'::text, 'contratante'::text, 'clinica'::text])))
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
-- Name: COLUMN notificacoes.resolvida; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.resolvida IS 'Indica se a notificaÃ§Ã£o foi resolvida (aÃ§Ã£o tomada), diferente de apenas lida';


--
-- Name: COLUMN notificacoes.data_resolucao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.data_resolucao IS 'Data/hora em que a notificaÃ§Ã£o foi marcada como resolvida';


--
-- Name: COLUMN notificacoes.resolvido_por_cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes.resolvido_por_cpf IS 'CPF do usuÃ¡rio que resolveu a notificaÃ§Ã£o';


--
-- Name: notificacoes_admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacoes_admin (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    mensagem text NOT NULL,
    lote_id integer,
    visualizada boolean DEFAULT false,
    criado_em timestamp with time zone DEFAULT now(),
    visualizado_em timestamp with time zone
);


ALTER TABLE public.notificacoes_admin OWNER TO postgres;

--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes_admin IS 'Notificações críticas para administradores do sistema';


--
-- Name: COLUMN notificacoes_admin.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.tipo IS 'Tipo da notificaÃ§Ã£o (sem_emissor, erro_critico, etc)';


--
-- Name: COLUMN notificacoes_admin.mensagem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.mensagem IS 'Mensagem descritiva da notificaÃ§Ã£o';


--
-- Name: COLUMN notificacoes_admin.lote_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacoes_admin.lote_id IS 'ReferÃªncia ao lote relacionado (opcional)';


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
-- Name: notificacoes_financeiras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacoes_financeiras (
    id integer NOT NULL,
    contrato_id integer,
    tipo character varying(50) NOT NULL,
    titulo character varying(200) NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false,
    prioridade character varying(20) DEFAULT 'normal'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lida_em timestamp without time zone,
    CONSTRAINT notificacoes_financeiras_prioridade_check CHECK (((prioridade)::text = ANY (ARRAY[('baixa'::character varying)::text, ('normal'::character varying)::text, ('alta'::character varying)::text, ('critica'::character varying)::text]))),
    CONSTRAINT notificacoes_financeiras_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('limite_excedido'::character varying)::text, ('renovacao_proxima'::character varying)::text, ('pagamento_vencido'::character varying)::text, ('alerta_geral'::character varying)::text])))
);


ALTER TABLE public.notificacoes_financeiras OWNER TO postgres;

--
-- Name: notificacoes_financeiras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacoes_financeiras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_financeiras_id_seq OWNER TO postgres;

--
-- Name: notificacoes_financeiras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacoes_financeiras_id_seq OWNED BY public.notificacoes_financeiras.id;


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
-- Name: notificacoes_traducoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.notificacoes_traducoes OWNER TO postgres;

--
-- Name: TABLE notificacoes_traducoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes_traducoes IS 'Traducoes de notificacoes para multi-idioma';


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacoes_traducoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacoes_traducoes_id_seq OWNER TO postgres;

--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacoes_traducoes_id_seq OWNED BY public.notificacoes_traducoes.id;


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
    contrato_id integer,
    detalhes_parcelas jsonb,
    CONSTRAINT check_numero_parcelas CHECK (((numero_parcelas >= 1) AND (numero_parcelas <= 12))),
    CONSTRAINT pagamentos_metodo_check CHECK (((metodo)::text = ANY (ARRAY[('avista'::character varying)::text, ('parcelado'::character varying)::text, ('boleto'::character varying)::text, ('pix'::character varying)::text, ('cartao'::character varying)::text]))),
    CONSTRAINT pagamentos_status_check CHECK (((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('processando'::character varying)::text, ('pago'::character varying)::text, ('cancelado'::character varying)::text, ('estornado'::character varying)::text])))
);


ALTER TABLE public.pagamentos OWNER TO postgres;

--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pagamentos IS 'Registro de pagamentos de tomadores';


--
-- Name: COLUMN pagamentos.numero_parcelas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.numero_parcelas IS 'NÃºmero de parcelas do pagamento (1 = Ã  vista, 2-12 = parcelado)';


--
-- Name: COLUMN pagamentos.contrato_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pagamentos.contrato_id IS 'ReferÃªncia opcional ao contrato associado ao pagamento (pode ser NULL para pagamentos independentes)';


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
    nome character varying(100) NOT NULL,
    descricao text,
    preco numeric(10,2) NOT NULL,
    tipo public.tipo_plano NOT NULL,
    caracteristicas jsonb,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT planos_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('fixo'::character varying)::text, ('personalizado'::character varying)::text])))
);


ALTER TABLE public.planos OWNER TO postgres;

--
-- Name: TABLE planos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.planos IS 'Planos disponÃ­veis para contrataÃ§Ã£o';


--
-- Name: COLUMN planos.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.planos.tipo IS 'fixo: valor fixo por perÃ­odo | personalizado: valor baseado em quantidade de funcionÃ¡rios';


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
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    hierarchy_level integer DEFAULT 0 NOT NULL,
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
-- Name: session_logs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.session_logs OWNER TO postgres;

--
-- Name: TABLE session_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.session_logs IS 'Registra todos os acessos (login/logout) de usuÃ¡rios do sistema para auditoria';


--
-- Name: COLUMN session_logs.cpf; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.cpf IS 'CPF do usuÃ¡rio que fez login';


--
-- Name: COLUMN session_logs.perfil; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.perfil IS 'Perfil do usuÃ¡rio no momento do login (funcionario, rh, emissor, admin)';


--
-- Name: COLUMN session_logs.clinica_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.clinica_id IS 'ID da clÃ­nica associada ao usuÃ¡rio (para RH e emissores)';


--
-- Name: COLUMN session_logs.empresa_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.empresa_id IS 'ID da empresa associada ao funcionÃ¡rio';


--
-- Name: COLUMN session_logs.session_duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.session_logs.session_duration IS 'DuraÃ§Ã£o calculada da sessÃ£o (logout - login)';


--
-- Name: session_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.session_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.session_logs_id_seq OWNER TO postgres;

--
-- Name: session_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.session_logs_id_seq OWNED BY public.session_logs.id;


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

COMMENT ON VIEW public.suspicious_activity IS 'Detecta atividades suspeitas: usuÃ¡rios com mais de 100 aÃ§Ãµes na Ãºltima hora';


--
-- Name: templates_contrato; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.templates_contrato OWNER TO postgres;

--
-- Name: TABLE templates_contrato; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.templates_contrato IS 'Templates editaveis para geracao de contratos';


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.templates_contrato_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_contrato_id_seq OWNER TO postgres;

--
-- Name: templates_contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.templates_contrato_id_seq OWNED BY public.templates_contrato.id;


--
-- Name: tokens_retomada_pagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens_retomada_pagamento (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    contratante_id integer NOT NULL,
    contrato_id integer,
    plano_id integer,
    tipo_plano character varying(20),
    numero_funcionarios integer,
    valor_total numeric(10,2),
    expiracao timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    usado_em timestamp without time zone,
    ip_uso character varying(50),
    gerado_por character varying(14),
    gerado_em timestamp without time zone DEFAULT now(),
    metadata jsonb,
    CONSTRAINT tokens_retomada_pagamento_tipo_plano_check CHECK (((tipo_plano)::text = ANY ((ARRAY['fixo'::character varying, 'personalizado'::character varying])::text[])))
);


ALTER TABLE public.tokens_retomada_pagamento OWNER TO postgres;

--
-- Name: TABLE tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tokens_retomada_pagamento IS 'Armazena tokens seguros para permitir que tomadores retomem pagamentos pendentes sem refazer cadastro.';


--
-- Name: COLUMN tokens_retomada_pagamento.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.token IS 'Token Ãºnico gerado para autenticar link de pagamento. Tem TTL de 48h por padrÃ£o.';


--
-- Name: COLUMN tokens_retomada_pagamento.usado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.usado IS 'Indica se token jÃ¡ foi utilizado. Tokens usados nÃ£o podem ser reutilizados.';


--
-- Name: COLUMN tokens_retomada_pagamento.gerado_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tokens_retomada_pagamento.gerado_por IS 'CPF do admin que gerou o link. ObrigatÃ³rio para auditoria.';


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_retomada_pagamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_retomada_pagamento_id_seq OWNER TO postgres;

--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_retomada_pagamento_id_seq OWNED BY public.tokens_retomada_pagamento.id;


--
-- Name: v_tomadores_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_tomadores_stats AS
 SELECT c.id,
    c.tipo,
    c.nome,
    c.cnpj,
    c.status,
    c.ativa,
    c.responsavel_nome,
    c.responsavel_email,
    count(DISTINCT cf.funcionario_id) AS total_funcionarios,
    count(DISTINCT
        CASE
            WHEN (cf.vinculo_ativo = true) THEN cf.funcionario_id
            ELSE NULL::integer
        END) AS funcionarios_ativos,
    c.criado_em,
    c.aprovado_em
   FROM (public.tomadores c
     LEFT JOIN public.tomadores_funcionarios cf ON ((cf.contratante_id = c.id)))
  GROUP BY c.id, c.tipo, c.nome, c.cnpj, c.status, c.ativa, c.responsavel_nome, c.responsavel_email, c.criado_em, c.aprovado_em;


ALTER VIEW public.v_tomadores_stats OWNER TO postgres;

--
-- Name: VIEW v_tomadores_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_tomadores_stats IS 'View com estatÃ­sticas agregadas de tomadores';


--
-- Name: vw_alertas_lotes_stuck; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_alertas_lotes_stuck AS
 SELECT la.id AS lote_id,
    
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
            WHEN ((a.status)::text = 'concluido'::text) THEN 1
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    la.auto_emitir_em,
    la.auto_emitir_agendado
   FROM ((((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     LEFT JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.tomadores cont ON ((la.contratante_id = cont.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
  WHERE (((la.status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'finalizado'::character varying])::text[])) AND (la.atualizado_em < (now() - '48:00:00'::interval)))
  GROUP BY la.id,  la.status, ec.nome, cont.nome, c.nome, la.liberado_em, la.atualizado_em, la.auto_emitir_em, la.auto_emitir_agendado, la.clinica_id, la.contratante_id;


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
-- Name: vw_audit_trail_por_contratante; Type: VIEW; Schema: public; Owner: postgres
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
     LEFT JOIN public.tomadores cont ON ((al.contratante_id = cont.id)))
  WHERE (al.created_at >= (now() - '90 days'::interval))
  ORDER BY al.created_at DESC;


ALTER VIEW public.vw_audit_trail_por_contratante OWNER TO postgres;

--
-- Name: VIEW vw_audit_trail_por_contratante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_audit_trail_por_contratante IS 'Trilha de auditoria completa incluindo informaÃ§Ãµes de contratante (clÃ­nica ou entidade) - Ãºltimos 90 dias';


--
-- Name: vw_auditoria_acessos_funcionarios; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_auditoria_acessos_funcionarios OWNER TO postgres;

--
-- Name: vw_auditoria_acessos_rh; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.vw_auditoria_acessos_rh OWNER TO postgres;

--
-- Name: VIEW vw_auditoria_acessos_rh; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_auditoria_acessos_rh IS 'View para auditoria de acessos de gestores RH';


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
            WHEN ((l.status)::text = 'ativo'::text) THEN true
            ELSE false
        END AS liberado,
    a.status AS avaliacao_status,
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN true
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
-- Name: vw_auditoria_exclusoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_auditoria_exclusoes AS
 SELECT id,
    clinica_id,
    clinica_nome,
    tipo_entidade,
    admin_cpf,
    admin_nome,
    status,
    motivo_falha,
    (((total_gestores + total_empresas) + total_funcionarios) + total_avaliacoes) AS total_registros_afetados,
    criado_em,
    to_char(criado_em, 'DD/MM/YYYY HH24:MI:SS'::text) AS data_formatada
   FROM public.logs_exclusao_clinicas l
  ORDER BY criado_em DESC;


ALTER VIEW public.vw_auditoria_exclusoes OWNER TO postgres;

--
-- Name: VIEW vw_auditoria_exclusoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_auditoria_exclusoes IS 'View simplificada para consultas de auditoria de exclusÃµes';


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
            WHEN (ld.arquivo_pdf IS NOT NULL) THEN true
            ELSE false
        END AS tem_arquivo_pdf,
        CASE
            WHEN (ld.arquivo_pdf IS NOT NULL) THEN (pg_column_size(ld.arquivo_pdf) / 1024)
            ELSE 0
        END AS tamanho_pdf_kb
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
          WHERE ((avaliacoes.lote_id = l.id) AND ((avaliacoes.status)::text = 'concluido'::text))) AS avaliacoes_concluidas,
    ( SELECT count(*) AS count
           FROM public.audit_logs
          WHERE (((audit_logs.resource)::text = 'lotes_avaliacao'::text) AND (audit_logs.resource_id = (l.id)::text) AND ((audit_logs.action)::text = 'UPDATE'::text) AND ((audit_logs.old_data ->> 'status'::text) <> (audit_logs.new_data ->> 'status'::text)))) AS mudancas_status
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
  WHERE (((a.status)::text = 'concluido'::text) AND (r.grupo <= 6))
  GROUP BY ec.clinica_id, ec.id, ec.nome
  ORDER BY ec.clinica_id, ec.nome;


ALTER VIEW public.vw_comparativo_empresas OWNER TO postgres;

--
-- Name: vw_tomadores_inconsistentes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_tomadores_inconsistentes AS
 SELECT id,
    nome,
    cnpj,
    responsavel_nome,
    responsavel_email,
    ativa,
    pagamento_confirmado,
    status,
    data_liberacao_login,
    criado_em
   FROM public.tomadores c
  WHERE ((ativa = true) AND (pagamento_confirmado = false));


ALTER VIEW public.vw_tomadores_inconsistentes OWNER TO postgres;

--
-- Name: vw_dashboard_por_empresa; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_dashboard_por_empresa AS
 SELECT f.clinica_id,
    ec.id AS empresa_id,
    ec.nome AS empresa_nome,
    count(DISTINCT f.cpf) AS total_funcionarios,
    count(DISTINCT
        CASE
            WHEN (f.nivel_cargo = 'operacional'::public.nivel_cargo_enum) THEN f.cpf
            ELSE NULL::bpchar
        END) AS funcionarios_operacionais,
    count(DISTINCT
        CASE
            WHEN (f.nivel_cargo = 'gestao'::public.nivel_cargo_enum) THEN f.cpf
            ELSE NULL::bpchar
        END) AS funcionarios_gestao,
    count(a.id) AS total_avaliacoes,
    count(
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    count(
        CASE
            WHEN ((a.status)::text = 'em_andamento'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_andamento,
    count(
        CASE
            WHEN ((a.status)::text = 'iniciada'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_iniciadas,
    round((((count(
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN a.id
            ELSE NULL::integer
        END))::numeric * 100.0) / (NULLIF(count(a.id), 0))::numeric), 2) AS percentual_conclusao
   FROM ((public.funcionarios f
     LEFT JOIN public.empresas_clientes ec ON ((f.empresa_id = ec.id)))
     LEFT JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
  WHERE ((f.perfil)::text = 'funcionario'::text)
  GROUP BY f.clinica_id, ec.id, ec.nome
  ORDER BY f.clinica_id, ec.nome;


ALTER VIEW public.vw_dashboard_por_empresa OWNER TO postgres;

--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_funcionarios_por_lote AS
 SELECT f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.nivel_cargo,
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
-- Name: vw_health_check_tomadores; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_health_check_tomadores AS
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
     LEFT JOIN public.tomadores cont ON ((la.contratante_id = cont.id)))
  WHERE ((la.status)::text <> 'cancelado'::text)
  GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, c.ativa, cont.ativa;


ALTER VIEW public.vw_health_check_tomadores OWNER TO postgres;

--
-- Name: VIEW vw_health_check_tomadores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_health_check_tomadores IS 'Health check rÃ¡pido de todos os tomadores (clÃ­nicas e entidades) com lotes ativos';


--
-- Name: vw_lotes_info; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_lotes_info AS
 SELECT la.id,
    
    la.clinica_id,
    c.nome AS clinica_nome,
    c.cnpj AS clinica_cnpj,
    la.empresa_id,
    ec.nome AS empresa_nome,
    la.titulo,
    la.descricao,
    la.tipo,
    la.status,
    la.liberado_por AS rh_cpf,
    f.nome AS rh_nome,
    f.ativo AS rh_ativo,
    la.liberado_em,
    la.criado_em,
    la.atualizado_em,
    ( SELECT count(*) AS count
           FROM public.avaliacoes a
          WHERE (a.lote_id = la.id)) AS total_avaliacoes,
    ( SELECT count(*) AS count
           FROM public.avaliacoes a
          WHERE ((a.lote_id = la.id) AND ((a.status)::text = 'concluido'::text))) AS avaliacoes_concluidas
   FROM (((public.lotes_avaliacao la
     JOIN public.clinicas c ON ((c.id = la.clinica_id)))
     JOIN public.empresas_clientes ec ON ((ec.id = la.empresa_id)))
     LEFT JOIN public.funcionarios f ON ((f.cpf = la.liberado_por)));


ALTER VIEW public.vw_lotes_info OWNER TO postgres;

--
-- Name: VIEW vw_lotes_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_lotes_info IS 'View completa de lotes com informaÃ§Ãµes de clÃ­nica, empresa e RH';


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
     LEFT JOIN public.tomadores cont ON ((la.contratante_id = cont.id)))
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
 SELECT COALESCE(la.clinica_id, la.contratante_id) AS contratante_ref_id,
        CASE
            WHEN (la.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (la.contratante_id IS NOT NULL) THEN 'entidade'::text
            ELSE 'desconhecido'::text
        END AS tipo_contratante,
    COALESCE(c.nome, cont.nome) AS nome_contratante,
    date_trunc('day'::text, l.criado_em) AS data_emissao,
    count(*) AS laudos_emitidos,
    count(
        CASE
            WHEN ((l.status)::text = 'enviado'::text) THEN 1
            ELSE NULL::integer
        END) AS laudos_enviados,
    avg((EXTRACT(epoch FROM (l.emitido_em - la.liberado_em)) / (3600)::numeric)) AS tempo_medio_emissao_horas,
    min((EXTRACT(epoch FROM (l.emitido_em - la.liberado_em)) / (3600)::numeric)) AS tempo_minimo_horas,
    max((EXTRACT(epoch FROM (l.emitido_em - la.liberado_em)) / (3600)::numeric)) AS tempo_maximo_horas
   FROM (((public.laudos l
     JOIN public.lotes_avaliacao la ON ((l.lote_id = la.id)))
     LEFT JOIN public.clinicas c ON ((la.clinica_id = c.id)))
     LEFT JOIN public.tomadores cont ON ((la.contratante_id = cont.id)))
  WHERE (l.criado_em >= (now() - '30 days'::interval))
  GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, (date_trunc('day'::text, l.criado_em))
  ORDER BY (date_trunc('day'::text, l.criado_em)) DESC;


ALTER VIEW public.vw_metricas_emissao_laudos OWNER TO postgres;

--
-- Name: VIEW vw_metricas_emissao_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_metricas_emissao_laudos IS 'MÃ©tricas de velocidade de emissÃ£o de laudos nos Ãºltimos 30 dias (clÃ­nica + entidade)';


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
-- Name: vw_tokens_auditoria; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_tokens_auditoria AS
 SELECT t.id,
    t.token,
    c.nome AS contratante_nome,
    c.cnpj,
    p.nome AS plano_nome,
    t.tipo_plano,
    t.numero_funcionarios,
    t.valor_total,
    t.usado,
    t.usado_em,
    t.expiracao,
        CASE
            WHEN (t.usado = true) THEN 'usado'::text
            WHEN (t.expiracao < now()) THEN 'expirado'::text
            ELSE 'valido'::text
        END AS status,
    g.nome AS gerado_por_nome,
    t.gerado_por AS gerado_por_cpf,
    t.gerado_em,
    t.ip_uso
   FROM (((public.tokens_retomada_pagamento t
     JOIN public.tomadores c ON ((t.contratante_id = c.id)))
     LEFT JOIN public.planos p ON ((t.plano_id = p.id)))
     LEFT JOIN public.funcionarios g ON (((t.gerado_por)::bpchar = g.cpf)))
  ORDER BY t.gerado_em DESC;


ALTER VIEW public.vw_tokens_auditoria OWNER TO postgres;

--
-- Name: VIEW vw_tokens_auditoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_tokens_auditoria IS 'View para facilitar auditoria de tokens gerados. Mostra status atual e quem gerou.';


--
-- Name: administradores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores ALTER COLUMN id SET DEFAULT nextval('public.administradores_id_seq'::regclass);


--
-- Name: alertas_integridade id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_integridade ALTER COLUMN id SET DEFAULT nextval('public.alertas_integridade_id_seq'::regclass);


--
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);


--
-- Name: audit_access_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_access_log ALTER COLUMN id SET DEFAULT nextval('public.audit_access_log_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: auditoria_geral id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_geral ALTER COLUMN id SET DEFAULT nextval('public.auditoria_geral_id_seq'::regclass);


--
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);


--
-- Name: auditoria_planos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_planos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_planos_id_seq'::regclass);


--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: clinica_configuracoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes ALTER COLUMN id SET DEFAULT nextval('public.clinica_configuracoes_id_seq'::regclass);


--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: contratacao_personalizada id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratacao_personalizada ALTER COLUMN id SET DEFAULT nextval('public.contratacao_personalizada_id_seq'::regclass);


--
-- Name: tomadores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores ALTER COLUMN id SET DEFAULT nextval('public.tomadores_id_seq'::regclass);


--
-- Name: tomadores_funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores_funcionarios ALTER COLUMN id SET DEFAULT nextval('public.tomadores_funcionarios_id_seq'::regclass);


--
-- Name: entidades_senhas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas ALTER COLUMN id SET DEFAULT nextval('public.entidades_senhas_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: contratos_planos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos ALTER COLUMN id SET DEFAULT nextval('public.contratos_planos_id_seq'::regclass);


--
-- Name: emissores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissores ALTER COLUMN id SET DEFAULT nextval('public.emissores_id_seq'::regclass);


--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: historico_contratos_planos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_contratos_planos ALTER COLUMN id SET DEFAULT nextval('public.historico_contratos_planos_id_seq'::regclass);


--
-- Name: historico_exclusoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_exclusoes ALTER COLUMN id SET DEFAULT nextval('public.historico_exclusoes_id_seq'::regclass);


--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);


--
-- Name: logs_exclusao_clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_exclusao_clinicas ALTER COLUMN id SET DEFAULT nextval('public.logs_exclusao_clinicas_id_seq'::regclass);


--
-- Name: lotes_avaliacao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao ALTER COLUMN id SET DEFAULT nextval('public.lotes_avaliacao_id_seq'::regclass);


--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: notificacoes_admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);


--
-- Name: notificacoes_financeiras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_financeiras ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_financeiras_id_seq'::regclass);


--
-- Name: notificacoes_traducoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_traducoes_id_seq'::regclass);


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
-- Name: questao_condicoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes ALTER COLUMN id SET DEFAULT nextval('public.questao_condicoes_id_seq'::regclass);


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
-- Name: session_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_logs ALTER COLUMN id SET DEFAULT nextval('public.session_logs_id_seq'::regclass);


--
-- Name: templates_contrato id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato ALTER COLUMN id SET DEFAULT nextval('public.templates_contrato_id_seq'::regclass);


--
-- Name: tokens_retomada_pagamento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento ALTER COLUMN id SET DEFAULT nextval('public.tokens_retomada_pagamento_id_seq'::regclass);


--
-- Name: administradores administradores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_cpf_key UNIQUE (cpf);


--
-- Name: administradores administradores_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_email_key UNIQUE (email);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: alertas_integridade alertas_integridade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_integridade
    ADD CONSTRAINT alertas_integridade_pkey PRIMARY KEY (id);


--
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);


--
-- Name: audit_access_log audit_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_access_log
    ADD CONSTRAINT audit_access_log_pkey PRIMARY KEY (id);


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
-- Name: auditoria_laudos auditoria_laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT auditoria_laudos_pkey PRIMARY KEY (id);


--
-- Name: auditoria_planos auditoria_planos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_planos
    ADD CONSTRAINT auditoria_planos_pkey PRIMARY KEY (id);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: clinica_configuracoes clinica_configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT clinica_configuracoes_pkey PRIMARY KEY (id);


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
-- Name: tomadores tomadores_cnpj_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores
    ADD CONSTRAINT tomadores_cnpj_unique UNIQUE (cnpj);


--
-- Name: tomadores tomadores_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores
    ADD CONSTRAINT tomadores_email_unique UNIQUE (email);


--
-- Name: tomadores_funcionarios tomadores_funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores_funcionarios
    ADD CONSTRAINT tomadores_funcionarios_pkey PRIMARY KEY (id);


--
-- Name: tomadores_funcionarios tomadores_funcionarios_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores_funcionarios
    ADD CONSTRAINT tomadores_funcionarios_unique UNIQUE (funcionario_id, contratante_id);


--
-- Name: tomadores tomadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores
    ADD CONSTRAINT tomadores_pkey PRIMARY KEY (id);


--
-- Name: tomadores tomadores_responsavel_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores
    ADD CONSTRAINT tomadores_responsavel_cpf_unique UNIQUE (responsavel_cpf);


--
-- Name: entidades_senhas entidades_senhas_contratante_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_contratante_id_key UNIQUE (contratante_id);


--
-- Name: entidades_senhas entidades_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_pkey PRIMARY KEY (id);


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
-- Name: emissores emissores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissores
    ADD CONSTRAINT emissores_cpf_key UNIQUE (cpf);


--
-- Name: emissores emissores_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissores
    ADD CONSTRAINT emissores_email_key UNIQUE (email);


--
-- Name: emissores emissores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissores
    ADD CONSTRAINT emissores_pkey PRIMARY KEY (id);


--
-- Name: empresas_clientes empresas_clientes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_key UNIQUE (cnpj);


--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);


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
-- Name: historico_contratos_planos historico_contratos_planos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_contratos_planos
    ADD CONSTRAINT historico_contratos_planos_pkey PRIMARY KEY (id);


--
-- Name: historico_exclusoes historico_exclusoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_exclusoes
    ADD CONSTRAINT historico_exclusoes_pkey PRIMARY KEY (id);


--
-- Name: laudos laudos_lote_emissor_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);


--
-- Name: laudos laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_pkey PRIMARY KEY (id);


--
-- Name: logs_exclusao_clinicas logs_exclusao_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_exclusao_clinicas
    ADD CONSTRAINT logs_exclusao_clinicas_pkey PRIMARY KEY (id);


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
-- Name: notificacoes_admin notificacoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_financeiras notificacoes_financeiras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_financeiras
    ADD CONSTRAINT notificacoes_financeiras_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: notificacoes_traducoes notificacoes_traducoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT notificacoes_traducoes_pkey PRIMARY KEY (id);


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
-- Name: planos planos_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT planos_nome_key UNIQUE (nome);


--
-- Name: planos planos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planos
    ADD CONSTRAINT planos_pkey PRIMARY KEY (id);


--
-- Name: questao_condicoes questao_condicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes
    ADD CONSTRAINT questao_condicoes_pkey PRIMARY KEY (id);


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
-- Name: session_logs session_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_pkey PRIMARY KEY (id);


--
-- Name: templates_contrato templates_contrato_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_nome_key UNIQUE (nome);


--
-- Name: templates_contrato templates_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_pkey PRIMARY KEY (id);


--
-- Name: tokens_retomada_pagamento tokens_retomada_pagamento_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT tokens_retomada_pagamento_token_key UNIQUE (token);


--
-- Name: clinica_configuracoes unique_clinica_config; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT unique_clinica_config UNIQUE (clinica_id);


--
-- Name: clinicas unique_clinica_contratante; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT unique_clinica_contratante UNIQUE (contratante_id);


--
-- Name: notificacoes_traducoes unique_traducao; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT unique_traducao UNIQUE (chave_traducao, idioma);


--
-- Name: idx_administradores_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_administradores_clinica ON public.administradores USING btree (clinica_id);


--
-- Name: idx_administradores_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_administradores_cpf ON public.administradores USING btree (cpf);


--
-- Name: idx_administradores_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_administradores_email ON public.administradores USING btree (email);


--
-- Name: idx_alertas_nao_resolvidos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_nao_resolvidos ON public.alertas_integridade USING btree (resolvido, criado_em) WHERE (resolvido = false);


--
-- Name: idx_analise_estatistica_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analise_estatistica_avaliacao ON public.analise_estatistica USING btree (avaliacao_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_contratante_id ON public.audit_logs USING btree (contratante_id, created_at DESC);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource);


--
-- Name: idx_audit_logs_user_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_cpf ON public.audit_logs USING btree (user_cpf);


--
-- Name: idx_auditoria_contrato; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_contrato ON public.auditoria_planos USING btree (contrato_id, created_at);


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

CREATE INDEX idx_auditoria_usuario ON public.auditoria_planos USING btree (usuario_cpf, created_at);


--
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);


--
-- Name: idx_avaliacoes_funcionario_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario_cpf ON public.avaliacoes USING btree (funcionario_cpf);


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
-- Name: idx_clinica_configuracoes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinica_configuracoes_clinica ON public.clinica_configuracoes USING btree (clinica_id);


--
-- Name: idx_clinicas_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_ativa ON public.clinicas USING btree (ativa);


--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_cnpj ON public.clinicas USING btree (cnpj);


--
-- Name: idx_clinicas_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_contratante_id ON public.clinicas USING btree (contratante_id);


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
-- Name: idx_tomadores_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_ativa ON public.tomadores USING btree (ativa);


--
-- Name: idx_tomadores_ativa_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_ativa_pagamento ON public.tomadores USING btree (ativa, pagamento_confirmado) WHERE (ativa = true);


--
-- Name: idx_tomadores_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_cnpj ON public.tomadores USING btree (cnpj);


--
-- Name: idx_tomadores_contrato_aceito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_contrato_aceito ON public.tomadores USING btree (contrato_aceito);


--
-- Name: idx_tomadores_data_liberacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_data_liberacao ON public.tomadores USING btree (data_liberacao_login);


--
-- Name: idx_tomadores_funcionarios_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_funcionarios_ativo ON public.tomadores_funcionarios USING btree (vinculo_ativo);


--
-- Name: idx_tomadores_funcionarios_composite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_funcionarios_composite ON public.tomadores_funcionarios USING btree (contratante_id, tipo_contratante, vinculo_ativo);


--
-- Name: idx_tomadores_funcionarios_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_funcionarios_contratante ON public.tomadores_funcionarios USING btree (contratante_id);


--
-- Name: idx_tomadores_funcionarios_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_funcionarios_funcionario ON public.tomadores_funcionarios USING btree (funcionario_id);


--
-- Name: idx_tomadores_funcionarios_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_funcionarios_tipo ON public.tomadores_funcionarios USING btree (tipo_contratante);


--
-- Name: idx_tomadores_liberacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_liberacao ON public.tomadores USING btree (data_liberacao_login);


--
-- Name: idx_tomadores_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_pagamento ON public.tomadores USING btree (pagamento_confirmado);


--
-- Name: idx_tomadores_pagamento_confirmado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_pagamento_confirmado ON public.tomadores USING btree (pagamento_confirmado);


--
-- Name: idx_tomadores_plano; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_plano ON public.tomadores USING btree (plano_id);


--
-- Name: idx_tomadores_plano_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_plano_tipo ON public.tomadores USING btree (plano_tipo);


--
-- Name: idx_entidades_senhas_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidades_senhas_contratante ON public.entidades_senhas USING btree (contratante_id);


--
-- Name: idx_entidades_senhas_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidades_senhas_cpf ON public.entidades_senhas USING btree (cpf);


--
-- Name: idx_tomadores_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_status ON public.tomadores USING btree (status);


--
-- Name: idx_tomadores_status_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_status_pagamento ON public.tomadores USING btree (status, pagamento_confirmado);


--
-- Name: idx_tomadores_status_plano_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_status_plano_tipo ON public.tomadores USING btree (status, plano_tipo);


--
-- Name: idx_tomadores_status_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_status_tipo ON public.tomadores USING btree (status, tipo);


--
-- Name: idx_tomadores_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_tipo ON public.tomadores USING btree (tipo);


--
-- Name: idx_tomadores_tipo_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tomadores_tipo_ativa ON public.tomadores USING btree (tipo, ativa);


--
-- Name: idx_contratos_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_clinica ON public.contratos_planos USING btree (clinica_id);


--
-- Name: idx_contratos_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_contratante ON public.contratos USING btree (contratante_id);


--
-- Name: idx_contratos_data_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_data_pagamento ON public.contratos_planos USING btree (data_pagamento);


--
-- Name: idx_contratos_modalidade_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_modalidade_pagamento ON public.contratos_planos USING btree (modalidade_pagamento);


--
-- Name: idx_contratos_numero_funcionarios; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_numero_funcionarios ON public.contratos USING btree (numero_funcionarios);


--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);


--
-- Name: idx_contratos_tipo_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_tipo_pagamento ON public.contratos_planos USING btree (tipo_pagamento);


--
-- Name: idx_contratos_valor_personalizado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_valor_personalizado ON public.contratos USING btree (valor_personalizado);


--
-- Name: idx_contratos_vigencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_vigencia ON public.contratos_planos USING btree (data_fim_vigencia, status);


--
-- Name: idx_emissores_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emissores_clinica ON public.emissores USING btree (clinica_id);


--
-- Name: idx_emissores_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emissores_cpf ON public.emissores USING btree (cpf);


--
-- Name: idx_emissores_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emissores_email ON public.emissores USING btree (email);


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
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_cnpj ON public.empresas_clientes USING btree (cnpj);


--
-- Name: idx_funcionarios_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_clinica ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_clinica_id ON public.funcionarios USING btree (clinica_id);


--
-- Name: idx_funcionarios_clinica_rh_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_funcionarios_clinica_rh_ativo ON public.funcionarios USING btree (clinica_id) WHERE (((perfil)::text = 'rh'::text) AND (ativo = true));


--
-- Name: INDEX idx_funcionarios_clinica_rh_ativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_funcionarios_clinica_rh_ativo IS 'Garante que apenas 1 gestor RH ativo por clÃ­nica';


--
-- Name: idx_funcionarios_contratante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_contratante_id ON public.funcionarios USING btree (contratante_id);


--
-- Name: idx_funcionarios_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_cpf ON public.funcionarios USING btree (cpf);


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
-- Name: idx_funcionarios_nivel_cargo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_nivel_cargo ON public.funcionarios USING btree (nivel_cargo);


--
-- Name: idx_funcionarios_pendencias; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_pendencias ON public.funcionarios USING btree (empresa_id, ativo, indice_avaliacao, data_ultimo_lote) WHERE (ativo = true);


--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);


--
-- Name: idx_funcionarios_perfil_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_perfil_ativo ON public.funcionarios USING btree (perfil, ativo) WHERE ((perfil)::text = 'rh'::text);


--
-- Name: INDEX idx_funcionarios_perfil_ativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_funcionarios_perfil_ativo IS 'Otimiza queries de listagem de gestores RH';


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
-- Name: idx_laudos_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_hash ON public.laudos USING btree (hash_pdf);


--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);


--
-- Name: idx_laudos_relatorio_individual; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_individual ON public.laudos USING btree (relatorio_individual) WHERE (relatorio_individual IS NOT NULL);


--
-- Name: idx_laudos_relatorio_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_lote ON public.laudos USING btree (relatorio_lote) WHERE (relatorio_lote IS NOT NULL);


--
-- Name: idx_laudos_relatorio_setor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_setor ON public.laudos USING btree (relatorio_setor) WHERE (relatorio_setor IS NOT NULL);


--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);


--
-- Name: idx_logs_exclusao_admin_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_exclusao_admin_cpf ON public.logs_exclusao_clinicas USING btree (admin_cpf);


--
-- Name: idx_logs_exclusao_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_exclusao_clinica_id ON public.logs_exclusao_clinicas USING btree (clinica_id);


--
-- Name: idx_logs_exclusao_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_exclusao_criado_em ON public.logs_exclusao_clinicas USING btree (criado_em DESC);


--
-- Name: idx_logs_exclusao_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_exclusao_status ON public.logs_exclusao_clinicas USING btree (status);


--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY ((ARRAY['ativo'::character varying, 'concluido'::character varying, 'finalizado'::character varying])::text[]));


--
-- Name: idx_lotes_auto_emitir; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_auto_emitir ON public.lotes_avaliacao USING btree (auto_emitir_em, status) WHERE ((auto_emitir_em IS NOT NULL) AND ((status)::text = 'concluido'::text));


--
-- Name: idx_lotes_auto_emitir_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_auto_emitir_em ON public.lotes_avaliacao USING btree (auto_emitir_em);


--
-- Name: idx_lotes_avaliacao_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_avaliacao_empresa_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);


--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);


--
-- Name: INDEX idx_lotes_clinica_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_lotes_clinica_status IS 'Otimiza queries de lotes por clÃ­nica e status';


--
-- Name: idx_lotes_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_codigo ON public.lotes_avaliacao USING btree (codigo);


--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);


--
-- Name: idx_lotes_finalizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_finalizado_em ON public.lotes_avaliacao USING btree (finalizado_em DESC);


--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);


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

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo, criado_em DESC);


--
-- Name: idx_notificacoes_admin_visualizada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_visualizada ON public.notificacoes_admin USING btree (visualizada, criado_em DESC);


--
-- Name: idx_notificacoes_contratacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_contratacao ON public.notificacoes USING btree (contratacao_personalizada_id);


--
-- Name: idx_notificacoes_contrato; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_contrato ON public.notificacoes_financeiras USING btree (contrato_id, lida);


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
-- Name: idx_notificacoes_resolvida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_resolvida ON public.notificacoes USING btree (resolvida) WHERE (resolvida = false);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_notificacoes_tipo_resolvida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_tipo_resolvida ON public.notificacoes USING btree (tipo, resolvida);


--
-- Name: idx_notificacoes_traducoes_chave; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_traducoes_chave ON public.notificacoes_traducoes USING btree (chave_traducao, idioma);


--
-- Name: idx_pagamentos_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contratante ON public.pagamentos USING btree (contratante_id);


--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);


--
-- Name: idx_pagamentos_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_data ON public.pagamentos USING btree (data_pagamento);


--
-- Name: idx_pagamentos_metodo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_metodo ON public.pagamentos USING btree (metodo);


--
-- Name: idx_pagamentos_parcelas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_parcelas ON public.pagamentos USING btree (numero_parcelas) WHERE (numero_parcelas > 1);


--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- Name: idx_planos_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_planos_ativo ON public.planos USING btree (ativo);


--
-- Name: idx_planos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_planos_tipo ON public.planos USING btree (tipo);


--
-- Name: idx_questao_condicoes_dependente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_dependente ON public.questao_condicoes USING btree (questao_dependente);


--
-- Name: idx_questao_condicoes_questao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_questao ON public.questao_condicoes USING btree (questao_id);


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
-- Name: idx_session_logs_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_clinica ON public.session_logs USING btree (clinica_id);


--
-- Name: idx_session_logs_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_cpf ON public.session_logs USING btree (cpf);


--
-- Name: idx_session_logs_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_empresa ON public.session_logs USING btree (empresa_id);


--
-- Name: idx_session_logs_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_login ON public.session_logs USING btree (login_timestamp DESC);


--
-- Name: idx_session_logs_logout; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_logout ON public.session_logs USING btree (logout_timestamp DESC);


--
-- Name: idx_session_logs_perfil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_logs_perfil ON public.session_logs USING btree (perfil);


--
-- Name: idx_templates_contrato_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_ativo ON public.templates_contrato USING btree (ativo) WHERE (ativo = true);


--
-- Name: idx_templates_contrato_padrao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_padrao ON public.templates_contrato USING btree (tipo_template, padrao) WHERE (padrao = true);


--
-- Name: idx_templates_contrato_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_tipo ON public.templates_contrato USING btree (tipo_template);


--
-- Name: idx_tokens_contratante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_contratante ON public.tokens_retomada_pagamento USING btree (contratante_id);


--
-- Name: idx_tokens_expiracao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_expiracao ON public.tokens_retomada_pagamento USING btree (expiracao) WHERE (usado = false);


--
-- Name: idx_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_token ON public.tokens_retomada_pagamento USING btree (token) WHERE (usado = false);


--
-- Name: idx_tokens_usado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_usado ON public.tokens_retomada_pagamento USING btree (usado, expiracao);


--
-- Name: ux_contratos_payment_link_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_contratos_payment_link_token ON public.contratos USING btree (payment_link_token) WHERE (payment_link_token IS NOT NULL);


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
-- Name: funcionarios audit_funcionarios_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_funcionarios_trigger AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();


--
-- Name: laudos audit_laudos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_laudos AFTER INSERT OR DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: tomadores tr_tomadores_sync_status_ativa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_tomadores_sync_status_ativa BEFORE INSERT OR UPDATE ON public.tomadores FOR EACH ROW EXECUTE FUNCTION public.tomadores_sync_status_ativa();


--
-- Name: tomadores_funcionarios trg_tomadores_funcionarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tomadores_funcionarios_updated_at BEFORE UPDATE ON public.tomadores_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_tomadores_updated_at();


--
-- Name: entidades_senhas trg_entidades_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_entidades_senhas_updated_at BEFORE UPDATE ON public.entidades_senhas FOR EACH ROW EXECUTE FUNCTION public.update_entidades_senhas_updated_at();


--
-- Name: tomadores trg_tomadores_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tomadores_updated_at BEFORE UPDATE ON public.tomadores FOR EACH ROW EXECUTE FUNCTION public.update_tomadores_updated_at();


--
-- Name: tomadores trg_impedir_alteracao_critica; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_impedir_alteracao_critica BEFORE UPDATE ON public.tomadores FOR EACH ROW EXECUTE FUNCTION public.impedir_alteracao_campos_criticos();


--
-- Name: pagamentos trg_pagamentos_atualizar_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pagamentos_atualizar_data BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: planos trg_planos_atualizar_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_planos_atualizar_data BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();


--
-- Name: tomadores trg_sync_contratante_plano_tipo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_contratante_plano_tipo BEFORE INSERT OR UPDATE OF plano_id ON public.tomadores FOR EACH ROW EXECUTE FUNCTION public.sync_contratante_plano_tipo();


--
-- Name: tomadores trg_validar_ativacao_contratante; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_ativacao_contratante BEFORE UPDATE OF ativa ON public.tomadores FOR EACH ROW WHEN ((new.ativa IS DISTINCT FROM old.ativa)) EXECUTE FUNCTION public.fn_validar_ativacao_contratante();

ALTER TABLE public.tomadores DISABLE TRIGGER trg_validar_ativacao_contratante;


--
-- Name: contratos_planos trg_validar_parcelas; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_parcelas BEFORE INSERT OR UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.validar_parcelas_json();


--
-- Name: tomadores trg_validar_transicao_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_transicao_status BEFORE UPDATE OF status ON public.tomadores FOR EACH ROW EXECUTE FUNCTION public.validar_transicao_status_contratante();


--
-- Name: administradores trigger_atualizar_administradores; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_atualizar_administradores BEFORE UPDATE ON public.administradores FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: emissores trigger_atualizar_emissores; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_atualizar_emissores BEFORE UPDATE ON public.emissores FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: clinica_configuracoes trigger_atualizar_timestamp_configuracoes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes BEFORE UPDATE ON public.clinica_configuracoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_configuracoes();


--
-- Name: contratos_planos trigger_bloquear_alteracao_contrato; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_bloquear_alteracao_contrato BEFORE UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_contrato_vigente();


--
-- Name: templates_contrato trigger_garantir_template_padrao_unico; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_garantir_template_padrao_unico BEFORE INSERT OR UPDATE ON public.templates_contrato FOR EACH ROW WHEN ((new.padrao = true)) EXECUTE FUNCTION public.garantir_template_padrao_unico();


--
-- Name: pagamentos trigger_pagamentos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_pagamentos_updated BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: planos trigger_planos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_planos_updated BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- Name: avaliacoes trigger_protect_concluded_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_protect_concluded_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.protect_concluded_avaliacao();


--
-- Name: funcionarios trigger_registrar_inativacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_registrar_inativacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((old.ativo IS DISTINCT FROM new.ativo)) EXECUTE FUNCTION public.registrar_inativacao_funcionario();


--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();


--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();


--
-- Name: contratos_planos trigger_snapshot_contrato; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_snapshot_contrato BEFORE UPDATE ON public.contratos_planos FOR EACH ROW EXECUTE FUNCTION public.criar_snapshot_contrato();


--
-- Name: empresas_clientes trigger_sync_funcionario_clinica; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_sync_funcionario_clinica AFTER UPDATE OF clinica_id ON public.empresas_clientes FOR EACH ROW EXECUTE FUNCTION public.sync_funcionario_clinica();


--
-- Name: funcionarios trigger_validar_rh_obrigatorio; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_rh_obrigatorio BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((((old.perfil)::text = 'rh'::text) AND (new.ativo = false) AND (old.ativo = true))) EXECUTE FUNCTION public.validar_rh_obrigatorio();


--
-- Name: TRIGGER trigger_validar_rh_obrigatorio ON funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TRIGGER trigger_validar_rh_obrigatorio ON public.funcionarios IS 'Valida que clÃ­nica sempre tenha ao menos 1 RH ativo';


--
-- Name: administradores administradores_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE SET NULL;


--
-- Name: auditoria_planos auditoria_planos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_planos
    ADD CONSTRAINT auditoria_planos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos_planos(id);


--
-- Name: auditoria_planos auditoria_planos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_planos
    ADD CONSTRAINT auditoria_planos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


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
-- Name: clinica_configuracoes clinica_configuracoes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT clinica_configuracoes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT contratacao_personalizada_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


--
-- Name: tomadores tomadores_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores
    ADD CONSTRAINT tomadores_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: contratos contratos_contratante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


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
    ADD CONSTRAINT contratos_planos_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id);


--
-- Name: contratos_planos contratos_planos_plano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos_planos
    ADD CONSTRAINT contratos_planos_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id);


--
-- Name: emissores emissores_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissores
    ADD CONSTRAINT emissores_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: empresas_clientes empresas_clientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: clinicas fk_clinicas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT fk_clinicas_contratante FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


--
-- Name: tomadores_funcionarios fk_tomadores_funcionarios_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores_funcionarios
    ADD CONSTRAINT fk_tomadores_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


--
-- Name: tomadores_funcionarios fk_tomadores_funcionarios_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tomadores_funcionarios
    ADD CONSTRAINT fk_tomadores_funcionarios_funcionario FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: entidades_senhas fk_entidades_senhas_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT fk_entidades_senhas_contratante FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


--
-- Name: funcionarios fk_funcionarios_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE SET NULL;


--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;


--
-- Name: alertas_integridade fk_resolvido_por; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_integridade
    ADD CONSTRAINT fk_resolvido_por FOREIGN KEY (resolvido_por) REFERENCES public.funcionarios(cpf) ON DELETE SET NULL;


--
-- Name: tokens_retomada_pagamento fk_token_contratante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_token_contratante FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


--
-- Name: CONSTRAINT fk_token_contratante ON tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_token_contratante ON public.tokens_retomada_pagamento IS 'Garante que token estÃ¡ sempre vinculado a um contratante vÃ¡lido.';


--
-- Name: tokens_retomada_pagamento fk_token_gerado_por; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_token_gerado_por FOREIGN KEY (gerado_por) REFERENCES public.funcionarios(cpf) ON DELETE SET NULL;


--
-- Name: tokens_retomada_pagamento fk_token_plano; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_token_plano FOREIGN KEY (plano_id) REFERENCES public.planos(id) ON DELETE RESTRICT;


--
-- Name: CONSTRAINT fk_token_plano ON tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT fk_token_plano ON public.tokens_retomada_pagamento IS 'Garante que token referencia plano vÃ¡lido. RESTRICT previne deleÃ§Ã£o de planos com tokens ativos.';


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
-- Name: historico_contratos_planos historico_contratos_planos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historico_contratos_planos
    ADD CONSTRAINT historico_contratos_planos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos_planos(id);


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
    ADD CONSTRAINT lotes_avaliacao_contratante_id_fkey FOREIGN KEY (contratante_id) REFERENCES public.tomadores(id) ON DELETE CASCADE;


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
-- Name: notificacoes_financeiras notificacoes_financeiras_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_financeiras
    ADD CONSTRAINT notificacoes_financeiras_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos_planos(id);


--
-- Name: pagamentos pagamentos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;


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
-- Name: tomadores admin_all_tomadores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_tomadores ON public.tomadores USING ((current_setting('app.perfil'::text, true) = 'admin'::text)) WITH CHECK ((current_setting('app.perfil'::text, true) = 'admin'::text));


--
-- Name: entidades_senhas admin_all_entidades_senhas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_entidades_senhas ON public.entidades_senhas USING ((current_setting('app.perfil'::text, true) = 'admin'::text)) WITH CHECK ((current_setting('app.perfil'::text, true) = 'admin'::text));


--
-- Name: contratos_planos admin_all_contratos_planos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_all_contratos_planos ON public.contratos_planos USING ((current_setting('app.perfil'::text, true) = 'admin'::text)) WITH CHECK ((current_setting('app.perfil'::text, true) = 'admin'::text));


--
-- Name: clinicas admin_manage_clinicas; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_manage_clinicas ON public.clinicas USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


--
-- Name: funcionarios admin_restricted_funcionarios; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY admin_restricted_funcionarios ON public.funcionarios USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = 'rh'::text) AND (empresa_id IS NULL)));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: avaliacoes avaliacoes_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_rh_clinica ON public.avaliacoes FOR SELECT USING ((funcionario_cpf IN ( SELECT funcionarios.cpf
   FROM public.funcionarios
  WHERE (funcionarios.empresa_id IN ( SELECT empresas_clientes.id
           FROM public.empresas_clientes
          WHERE ((empresas_clientes.clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)))))));


--
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: tomadores; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tomadores ENABLE ROW LEVEL SECURITY;

--
-- Name: tomadores tomadores_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_admin_all ON public.tomadores USING ((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'admin'::text)) WITH CHECK ((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'admin'::text));


--
-- Name: tomadores tomadores_gestor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_gestor_select ON public.tomadores FOR SELECT USING (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'gestor'::text) AND ((responsavel_cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: tomadores tomadores_gestor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_gestor_update ON public.tomadores FOR UPDATE USING (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'gestor'::text) AND ((responsavel_cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'gestor'::text) AND ((responsavel_cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));


--
-- Name: tomadores tomadores_public_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_public_insert ON public.tomadores FOR INSERT WITH CHECK (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) IS NULL) OR (NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'cadastro'::text)));


--
-- Name: tomadores tomadores_responsavel_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_responsavel_select ON public.tomadores FOR SELECT USING (((responsavel_cpf)::text = public.current_user_cpf()));


--
-- Name: tomadores tomadores_responsavel_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tomadores_responsavel_update ON public.tomadores FOR UPDATE USING ((((responsavel_cpf)::text = public.current_user_cpf()) AND (status = ANY (ARRAY['pendente'::public.status_aprovacao_enum, 'em_reanalise'::public.status_aprovacao_enum]))));


--
-- Name: entidades_senhas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entidades_senhas ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos_planos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contratos_planos ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos_planos contratos_planos_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contratos_planos_admin_all ON public.contratos_planos USING ((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'admin'::text)) WITH CHECK ((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'admin'::text));


--
-- Name: contratos_planos contratos_planos_gestor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contratos_planos_gestor_select ON public.contratos_planos FOR SELECT USING (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = 'gestor'::text) AND ((tipo_contratante)::text = 'entidade'::text) AND (contratante_id IN ( SELECT tomadores.id
   FROM public.tomadores
  WHERE ((tomadores.responsavel_cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))))));


--
-- Name: contratos_planos contratos_planos_rh_clinica_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY contratos_planos_rh_clinica_select ON public.contratos_planos FOR SELECT USING (((NULLIF(current_setting('app.current_user_perfil'::text, true), ''::text) = ANY (ARRAY['rh'::text, 'emissor'::text])) AND ((tipo_contratante)::text = 'clinica'::text) AND (clinica_id = (NULLIF(current_setting('app.current_user_clinica_id'::text, true), ''::text))::integer)));


--
-- Name: empresas_clientes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas_clientes empresas_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_clinica ON public.empresas_clientes FOR SELECT USING (((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)));


--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

--
-- Name: funcionarios funcionarios_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_clinica ON public.funcionarios FOR SELECT USING ((empresa_id IN ( SELECT empresas_clientes.id
   FROM public.empresas_clientes
  WHERE ((empresas_clientes.clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)))));


--
-- Name: tomadores gestor_own_contratante; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY gestor_own_contratante ON public.tomadores FOR SELECT USING (((current_setting('app.perfil'::text, true) = 'gestor'::text) AND (tipo = 'entidade'::public.tipo_contratante_enum) AND ((id)::text = current_setting('app.contratante_id'::text, true))));


--
-- Name: contratos_planos gestor_own_contratos_planos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY gestor_own_contratos_planos ON public.contratos_planos FOR SELECT USING (((current_setting('app.perfil'::text, true) = 'gestor'::text) AND ((tipo_contratante)::text = 'entidade'::text) AND ((contratante_id)::text = current_setting('app.contratante_id'::text, true))));


--
-- Name: laudos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

--
-- Name: laudos laudos_entidade_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_entidade_select ON public.laudos FOR SELECT USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor'::text])) AND (EXISTS ( SELECT 1
   FROM public.lotes_avaliacao
  WHERE ((lotes_avaliacao.id = laudos.lote_id) AND (lotes_avaliacao.contratante_id = public.current_user_contratante_id()))))));


--
-- Name: laudos laudos_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_rh_clinica ON public.laudos FOR SELECT USING ((lote_id IN ( SELECT lotes_avaliacao.id
   FROM public.lotes_avaliacao
  WHERE (lotes_avaliacao.empresa_id IN ( SELECT empresas_clientes.id
           FROM public.empresas_clientes
          WHERE ((empresas_clientes.clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)))))));


--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

--
-- Name: lotes_avaliacao lotes_entidade_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_entidade_insert ON public.lotes_avaliacao FOR INSERT WITH CHECK (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: lotes_avaliacao lotes_entidade_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_entidade_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: POLICY lotes_entidade_select ON lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON POLICY lotes_entidade_select ON public.lotes_avaliacao IS 'Permite acesso de gestores de entidade (perfil gestor ou entidade) aos lotes da sua entidade';


--
-- Name: lotes_avaliacao lotes_entidade_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_entidade_update ON public.lotes_avaliacao FOR UPDATE USING (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor'::text])) AND (contratante_id = public.current_user_contratante_id()))) WITH CHECK (((public.current_user_perfil() = ANY (ARRAY['entidade'::text, 'gestor'::text])) AND (contratante_id = public.current_user_contratante_id())));


--
-- Name: lotes_avaliacao lotes_rh_clinica; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_clinica ON public.lotes_avaliacao FOR SELECT USING ((empresa_id IN ( SELECT empresas_clientes.id
   FROM public.empresas_clientes
  WHERE ((empresas_clientes.clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true)))));


--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: notificacoes notificacoes_clinica_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_clinica_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_clinica_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_clinica_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true)))) WITH CHECK (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_contratante_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_contratante_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: notificacoes notificacoes_contratante_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_contratante_update ON public.notificacoes FOR UPDATE USING (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true)))) WITH CHECK (((destinatario_tipo = 'contratante'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


--
-- Name: entidades_senhas own_contratante_senha; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY own_contratante_senha ON public.entidades_senhas FOR SELECT USING (((cpf)::text = current_setting('app.cpf'::text, true)));


--
-- Name: pagamentos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: pagamentos pagamentos_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pagamentos_admin_all ON public.pagamentos USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: pagamentos pagamentos_responsavel_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pagamentos_responsavel_select ON public.pagamentos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tomadores c
  WHERE ((c.id = pagamentos.contratante_id) AND ((c.responsavel_cpf)::text = public.current_user_cpf())))));


--
-- Name: planos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

--
-- Name: planos planos_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY planos_admin_all ON public.planos USING ((public.current_user_perfil() = 'admin'::text));


--
-- Name: planos planos_publico_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY planos_publico_select ON public.planos FOR SELECT USING ((ativo = true));


--
-- Name: tomadores public_insert_tomadores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_insert_tomadores ON public.tomadores FOR INSERT WITH CHECK (((status = 'pendente'::public.status_aprovacao_enum) OR (status = 'aguardando_pagamento'::public.status_aprovacao_enum)));


--
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

--
-- Name: tomadores rh_own_clinica_contratante; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rh_own_clinica_contratante ON public.tomadores FOR SELECT USING (((current_setting('app.perfil'::text, true) = 'rh'::text) AND (tipo = 'clinica'::public.tipo_contratante_enum) AND (id IN ( SELECT funcionarios.contratante_id
   FROM public.funcionarios
  WHERE (((funcionarios.cpf)::text = current_setting('app.cpf'::text, true)) AND ((funcionarios.perfil)::text = 'rh'::text))))));


--
-- Name: contratos_planos rh_own_contratos_planos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rh_own_contratos_planos ON public.contratos_planos FOR SELECT USING (((current_setting('app.perfil'::text, true) = 'rh'::text) AND ((tipo_contratante)::text = 'clinica'::text) AND (clinica_id IN ( SELECT funcionarios.clinica_id
   FROM public.funcionarios
  WHERE (((funcionarios.cpf)::text = current_setting('app.cpf'::text, true)) AND ((funcionarios.perfil)::text = 'rh'::text))))));


--
-- Name: entidades_senhas update_own_senha; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY update_own_senha ON public.entidades_senhas FOR UPDATE USING (((cpf)::text = current_setting('app.cpf'::text, true))) WITH CHECK (((cpf)::text = current_setting('app.cpf'::text, true)));


--
-- Name: FUNCTION current_user_cpf(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.current_user_cpf() TO test_user;


--
-- Name: FUNCTION current_user_perfil(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.current_user_perfil() TO test_user;


--
-- Name: FUNCTION is_admin_or_master(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_admin_or_master() TO test_user;


--
-- Name: SEQUENCE administradores_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.administradores_id_seq TO PUBLIC;


--
-- Name: TABLE analise_estatistica; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.analise_estatistica TO test_admin;
GRANT SELECT ON TABLE public.analise_estatistica TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.analise_estatistica TO test_rh;


--
-- Name: SEQUENCE analise_estatistica_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.analise_estatistica_id_seq TO PUBLIC;


--
-- Name: TABLE audit_access_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.audit_access_log TO test_admin;
GRANT SELECT ON TABLE public.audit_access_log TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_access_log TO test_rh;


--
-- Name: SEQUENCE audit_access_log_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.audit_access_log_id_seq TO PUBLIC;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.audit_logs TO test_admin;
GRANT SELECT ON TABLE public.audit_logs TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO test_rh;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.audit_logs_id_seq TO PUBLIC;


--
-- Name: TABLE audit_stats_by_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.audit_stats_by_user TO test_admin;
GRANT SELECT ON TABLE public.audit_stats_by_user TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_stats_by_user TO test_rh;


--
-- Name: SEQUENCE auditoria_laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.auditoria_laudos_id_seq TO PUBLIC;


--
-- Name: SEQUENCE auditoria_planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.auditoria_planos_id_seq TO PUBLIC;


--
-- Name: TABLE avaliacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.avaliacoes TO test_admin;
GRANT SELECT ON TABLE public.avaliacoes TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacoes TO test_rh;


--
-- Name: SEQUENCE avaliacoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.avaliacoes_id_seq TO PUBLIC;


--
-- Name: SEQUENCE clinica_configuracoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.clinica_configuracoes_id_seq TO PUBLIC;


--
-- Name: TABLE clinicas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.clinicas TO test_admin;
GRANT SELECT ON TABLE public.clinicas TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas TO test_rh;


--
-- Name: TABLE clinicas_empresas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.clinicas_empresas TO test_admin;
GRANT SELECT ON TABLE public.clinicas_empresas TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas_empresas TO test_rh;


--
-- Name: SEQUENCE clinicas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.clinicas_id_seq TO PUBLIC;


--
-- Name: TABLE tomadores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.tomadores TO PUBLIC;


--
-- Name: SEQUENCE tomadores_funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.tomadores_funcionarios_id_seq TO PUBLIC;


--
-- Name: SEQUENCE tomadores_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.tomadores_id_seq TO PUBLIC;


--
-- Name: SEQUENCE entidades_senhas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.entidades_senhas_id_seq TO PUBLIC;


--
-- Name: SEQUENCE contratos_planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.contratos_planos_id_seq TO PUBLIC;


--
-- Name: TABLE funcionarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.funcionarios TO test_user;
GRANT SELECT ON TABLE public.funcionarios TO test_admin;
GRANT SELECT ON TABLE public.funcionarios TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO test_rh;


--
-- Name: SEQUENCE emissores_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.emissores_id_seq TO PUBLIC;


--
-- Name: TABLE empresas_clientes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.empresas_clientes TO test_admin;
GRANT SELECT ON TABLE public.empresas_clientes TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.empresas_clientes TO test_rh;


--
-- Name: SEQUENCE empresas_clientes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.empresas_clientes_id_seq TO PUBLIC;


--
-- Name: SEQUENCE funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.funcionarios_id_seq TO PUBLIC;


--
-- Name: SEQUENCE historico_contratos_planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.historico_contratos_planos_id_seq TO PUBLIC;


--
-- Name: SEQUENCE historico_exclusoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.historico_exclusoes_id_seq TO PUBLIC;


--
-- Name: TABLE laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.laudos TO test_admin;
GRANT SELECT ON TABLE public.laudos TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudos TO test_rh;


--
-- Name: SEQUENCE laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.laudos_id_seq TO PUBLIC;


--
-- Name: TABLE lotes_avaliacao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.lotes_avaliacao TO test_admin;
GRANT SELECT ON TABLE public.lotes_avaliacao TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lotes_avaliacao TO test_rh;


--
-- Name: SEQUENCE lotes_avaliacao_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.lotes_avaliacao_id_seq TO PUBLIC;


--
-- Name: SEQUENCE mfa_codes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.mfa_codes_id_seq TO PUBLIC;


--
-- Name: SEQUENCE notificacoes_admin_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.notificacoes_admin_id_seq TO PUBLIC;


--
-- Name: SEQUENCE notificacoes_financeiras_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.notificacoes_financeiras_id_seq TO PUBLIC;


--
-- Name: SEQUENCE notificacoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.notificacoes_id_seq TO PUBLIC;


--
-- Name: SEQUENCE notificacoes_traducoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.notificacoes_traducoes_id_seq TO PUBLIC;


--
-- Name: TABLE pagamentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.pagamentos TO PUBLIC;


--
-- Name: SEQUENCE pagamentos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.pagamentos_id_seq TO PUBLIC;


--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.permissions TO test_admin;
GRANT SELECT ON TABLE public.permissions TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO test_rh;


--
-- Name: SEQUENCE permissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.permissions_id_seq TO PUBLIC;


--
-- Name: TABLE planos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.planos TO PUBLIC;


--
-- Name: SEQUENCE planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.planos_id_seq TO PUBLIC;


--
-- Name: TABLE questao_condicoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.questao_condicoes TO test_admin;
GRANT SELECT ON TABLE public.questao_condicoes TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.questao_condicoes TO test_rh;


--
-- Name: SEQUENCE questao_condicoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.questao_condicoes_id_seq TO PUBLIC;


--
-- Name: TABLE relatorio_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.relatorio_templates TO test_admin;
GRANT SELECT ON TABLE public.relatorio_templates TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.relatorio_templates TO test_rh;


--
-- Name: SEQUENCE relatorio_templates_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.relatorio_templates_id_seq TO PUBLIC;


--
-- Name: TABLE respostas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.respostas TO test_admin;
GRANT SELECT ON TABLE public.respostas TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.respostas TO test_rh;


--
-- Name: SEQUENCE respostas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.respostas_id_seq TO PUBLIC;


--
-- Name: TABLE resultados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.resultados TO test_admin;
GRANT SELECT ON TABLE public.resultados TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.resultados TO test_rh;


--
-- Name: SEQUENCE resultados_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.resultados_id_seq TO PUBLIC;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.role_permissions TO test_admin;
GRANT SELECT ON TABLE public.role_permissions TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO test_rh;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.roles TO test_admin;
GRANT SELECT ON TABLE public.roles TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO test_rh;


--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.roles_id_seq TO PUBLIC;


--
-- Name: SEQUENCE session_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.session_logs_id_seq TO PUBLIC;


--
-- Name: TABLE suspicious_activity; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.suspicious_activity TO test_admin;
GRANT SELECT ON TABLE public.suspicious_activity TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suspicious_activity TO test_rh;


--
-- Name: SEQUENCE templates_contrato_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.templates_contrato_id_seq TO PUBLIC;


--
-- Name: TABLE vw_analise_grupos_negativos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.vw_analise_grupos_negativos TO test_admin;
GRANT SELECT ON TABLE public.vw_analise_grupos_negativos TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_analise_grupos_negativos TO test_rh;


--
-- Name: TABLE vw_comparativo_empresas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.vw_comparativo_empresas TO test_admin;
GRANT SELECT ON TABLE public.vw_comparativo_empresas TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_comparativo_empresas TO test_rh;


--
-- Name: TABLE vw_dashboard_por_empresa; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.vw_dashboard_por_empresa TO test_admin;
GRANT SELECT ON TABLE public.vw_dashboard_por_empresa TO test_master;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_dashboard_por_empresa TO test_rh;


--
-- PostgreSQL database dump complete
--


