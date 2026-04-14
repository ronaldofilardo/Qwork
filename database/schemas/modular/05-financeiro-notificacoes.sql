-- ============================================================================
-- 05-financeiro-notificacoes.sql
-- Pagamentos, recibos, notificações, webhooks, logs admin
-- Depends on: 01 a 04
-- ============================================================================

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
-- Name: audit_status_pagamento_change(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.audit_status_pagamento_change() OWNER TO postgres;


--
-- Name: criar_notificacao_recibo(integer, integer, public.tipo_notificacao); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.criar_notificacao_recibo(p_recibo_id integer, p_contratante_id integer, p_tipo public.tipo_notificacao) OWNER TO postgres;


--
-- Name: criar_notificacao_recibo(integer, character varying, numeric, character varying); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) OWNER TO postgres;


--
-- Name: FUNCTION criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.criar_notificacao_recibo(p_contratante_id integer, p_recibo_numero character varying, p_valor_total numeric, p_destinatario_cpf character varying) IS 'Cria notificação quando um recibo é gerado após confirmação de pagamento';



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

COMMENT ON FUNCTION public.gerar_numero_recibo() IS 'Gera número único de recibo no formato REC-AAAA-NNNNN';



--
-- Name: gerar_token_retomada_pagamento(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) OWNER TO postgres;


--
-- Name: FUNCTION gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_token_retomada_pagamento(p_contratante_id integer, p_contrato_id integer) IS 'Gera token único para permitir retomada de pagamento via link';



--
-- Name: limpar_notificacoes_resolvidas_antigas(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.limpar_notificacoes_resolvidas_antigas() OWNER TO postgres;


--
-- Name: FUNCTION limpar_notificacoes_resolvidas_antigas(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.limpar_notificacoes_resolvidas_antigas() IS 'Arquiva notificações resolvidas há mais de 90 dias';



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

COMMENT ON FUNCTION public.resolver_notificacao(p_notificacao_id integer, p_cpf_resolvedor character varying) IS 'Marca uma notificação como resolvida e registra auditoria';



--
-- Name: resolver_notificacoes_por_contexto(text, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) OWNER TO postgres;


--
-- Name: FUNCTION resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.resolver_notificacoes_por_contexto(p_chave_contexto text, p_valor_contexto text, p_cpf_resolvedor character varying) IS 'Resolve múltiplas notificações com base em critério de contexto (ex: lote_id)';



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
-- Name: validar_token_pagamento(uuid); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.validar_token_pagamento(p_token uuid) OWNER TO postgres;


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


ALTER FUNCTION public.verificar_integridade_recibo(recibo_id integer) OWNER TO postgres;


--
-- Name: FUNCTION verificar_integridade_recibo(recibo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_integridade_recibo(recibo_id integer) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';



--
-- Name: auditoria_recibos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.auditoria_recibos OWNER TO postgres;


--
-- Name: TABLE auditoria_recibos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria_recibos IS 'Registra eventos de auditoria do fluxo de recibos (geracao_pdf, envio, reprocessamento, erro)';



--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_recibos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_recibos_id_seq OWNER TO postgres;


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_recibos_id_seq OWNED BY public.auditoria_recibos.id;



--
-- Name: logs_admin; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.logs_admin OWNER TO postgres;


--
-- Name: TABLE logs_admin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.logs_admin IS 'Auditoria de ações administrativas no sistema';



--
-- Name: logs_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_admin_id_seq OWNER TO postgres;


--
-- Name: logs_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_admin_id_seq OWNED BY public.logs_admin.id;



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


ALTER TABLE public.notificacoes OWNER TO postgres;


--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes IS 'Sistema de notificações em tempo real para admin e gestores';



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


ALTER TABLE public.notificacoes_admin OWNER TO postgres;


--
-- Name: TABLE notificacoes_admin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacoes_admin IS 'Notificações para administradores sobre eventos críticos do sistema';



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
    asaas_payment_id character varying(50),
    asaas_customer_id character varying(50),
    CONSTRAINT check_numero_parcelas CHECK (((numero_parcelas >= 1) AND (numero_parcelas <= 12))),
    CONSTRAINT pagamentos_entidade_or_clinica_check CHECK ((((entidade_id IS NOT NULL) AND (clinica_id IS NULL)) OR ((entidade_id IS NULL) AND (clinica_id IS NOT NULL))))
);


ALTER TABLE public.pagamentos OWNER TO postgres;


--
-- Name: TABLE pagamentos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pagamentos IS 'Registro de pagamentos de contratantes';



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
-- Name: recibos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.recibos OWNER TO postgres;


--
-- Name: TABLE recibos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recibos IS 'Recibos financeiros gerados após confirmação de pagamento, separados do contrato de serviço';



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
-- Name: tokens_retomada_pagamento; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.tokens_retomada_pagamento OWNER TO postgres;


--
-- Name: TABLE tokens_retomada_pagamento; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tokens_retomada_pagamento IS 'Tokens de uso único para retomada de processo de pagamento';



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
-- Name: v_solicitacoes_emissao; Type: VIEW; Schema: public; Owner: postgres
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
    NULL::character varying(100) AS empresa_nome,
    NULL::character varying AS nome_tomador,
    NULL::character varying(200) AS solicitante_nome,
    NULL::character varying(11) AS solicitante_cpf,
    NULL::bigint AS num_avaliacoes_concluidas,
    NULL::numeric AS valor_total_calculado,
    NULL::timestamp without time zone AS lote_criado_em,
    NULL::timestamp without time zone AS lote_liberado_em,
    NULL::character varying(20) AS lote_status,
    NULL::integer AS laudo_id,
    NULL::character varying(20) AS laudo_status,
    NULL::boolean AS laudo_tem_hash,
    NULL::timestamp without time zone AS laudo_emitido_em,
    NULL::timestamp without time zone AS laudo_enviado_em,
    NULL::boolean AS laudo_ja_emitido,
    NULL::text AS tipo_solicitante,
    NULL::integer AS clinica_id,
    NULL::character varying(200) AS clinica_nome,
    NULL::integer AS entidade_id,
    NULL::integer AS empresa_id,
    NULL::integer AS vinculo_id,
    NULL::integer AS representante_id,
    NULL::character varying(150) AS representante_nome,
    NULL::character varying(12) AS representante_codigo,
    NULL::public.tipo_pessoa_representante AS representante_tipo_pessoa,
    NULL::numeric(5,2) AS representante_percentual_comissao,
    NULL::boolean AS comissao_gerada,
    NULL::integer AS comissoes_geradas_count,
    NULL::integer AS comissoes_ativas_count,
    NULL::numeric(12,2) AS lead_valor_negociado,
    NULL::numeric(12,2) AS valor_negociado_vinculo;


ALTER VIEW public.v_solicitacoes_emissao OWNER TO postgres;


--
-- Name: VIEW v_solicitacoes_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_solicitacoes_emissao IS 'View para admin gerenciar solicitaÃ§Ãµes de emissÃ£o. comissoes_geradas_count: total de comissÃµes criadas para o lote (inclui provisionadas futuras). comissoes_ativas_count: comissÃµes com parcela_confirmada_em IS NOT NULL (parcela efetivamente paga). DiferenÃ§a = parcelas futuras provisionadas aguardando pagamento.';



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
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_logs (
    id integer NOT NULL,
    payment_id character varying(50) NOT NULL,
    event character varying(100) NOT NULL,
    payload jsonb,
    processed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.webhook_logs OWNER TO postgres;


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhook_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_logs_id_seq OWNER TO postgres;


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhook_logs_id_seq OWNED BY public.webhook_logs.id;



--
-- Name: auditoria_recibos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_recibos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_recibos_id_seq'::regclass);



--
-- Name: logs_admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_admin ALTER COLUMN id SET DEFAULT nextval('public.logs_admin_id_seq'::regclass);



--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);



--
-- Name: notificacoes_admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_admin_id_seq'::regclass);



--
-- Name: notificacoes_traducoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_traducoes_id_seq'::regclass);



--
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);





--
-- Name: recibos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos ALTER COLUMN id SET DEFAULT nextval('public.recibos_id_seq'::regclass);



--
-- Name: tokens_retomada_pagamento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento ALTER COLUMN id SET DEFAULT nextval('public.tokens_retomada_pagamento_id_seq'::regclass);



--
-- Name: webhook_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs ALTER COLUMN id SET DEFAULT nextval('public.webhook_logs_id_seq'::regclass);



--
-- Name: auditoria_recibos auditoria_recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_pkey PRIMARY KEY (id);



--
-- Name: logs_admin logs_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs_admin
    ADD CONSTRAINT logs_admin_pkey PRIMARY KEY (id);



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
-- Name: notificacoes_traducoes notificacoes_traducoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT notificacoes_traducoes_pkey PRIMARY KEY (id);



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
-- Name: recibos recibos_numero_recibo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_numero_recibo_key UNIQUE (numero_recibo);



--
-- Name: recibos recibos_pagamento_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pagamento_id_unique UNIQUE (pagamento_id);



--
-- Name: recibos recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pkey PRIMARY KEY (id);



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
-- Name: notificacoes_traducoes unique_traducao; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_traducoes
    ADD CONSTRAINT unique_traducao UNIQUE (chave_traducao, idioma);



--
-- Name: webhook_logs webhook_logs_payment_id_event_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_payment_id_event_key UNIQUE (payment_id, event);



--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);



--
-- Name: idx_auditoria_recibos_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_recibos_criado ON public.auditoria_recibos USING btree (criado_em DESC);



--
-- Name: idx_auditoria_recibos_recibo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_recibos_recibo ON public.auditoria_recibos USING btree (recibo_id);



--
-- Name: idx_logs_admin_acao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_admin_acao ON public.logs_admin USING btree (acao);



--
-- Name: idx_logs_admin_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_admin_cpf ON public.logs_admin USING btree (admin_cpf);



--
-- Name: idx_logs_admin_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_admin_criado ON public.logs_admin USING btree (criado_em DESC);



--
-- Name: idx_logs_admin_entidade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_admin_entidade ON public.logs_admin USING btree (entidade_tipo, entidade_id);



--
-- Name: idx_notificacoes_admin_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_clinica_id ON public.notificacoes_admin USING btree (clinica_id);



--
-- Name: idx_notificacoes_admin_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_criado ON public.notificacoes_admin USING btree (criado_em DESC);



--
-- Name: idx_notificacoes_admin_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_criado_em ON public.notificacoes_admin USING btree (criado_em);



--
-- Name: idx_notificacoes_admin_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_entidade_id ON public.notificacoes_admin USING btree (entidade_id);



--
-- Name: idx_notificacoes_admin_lida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_lida ON public.notificacoes_admin USING btree (lida);



--
-- Name: idx_notificacoes_admin_resolvida; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_resolvida ON public.notificacoes_admin USING btree (resolvida);



--
-- Name: idx_notificacoes_admin_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_admin_tipo ON public.notificacoes_admin USING btree (tipo);



--
-- Name: idx_notificacoes_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_clinica_id ON public.notificacoes USING btree (clinica_id);



--
-- Name: idx_notificacoes_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_criado_em ON public.notificacoes USING btree (criado_em DESC);



--
-- Name: idx_notificacoes_destinatario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_destinatario ON public.notificacoes USING btree (destinatario_cpf, destinatario_tipo);



--
-- Name: idx_notificacoes_destinatario_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_destinatario_cpf ON public.notificacoes USING btree (destinatario_cpf);



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
-- Name: idx_pagamentos_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_clinica_id ON public.pagamentos USING btree (clinica_id);



--
-- Name: idx_pagamentos_contrato_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_contrato_id ON public.pagamentos USING btree (contrato_id);



--
-- Name: idx_pagamentos_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_entidade_id ON public.pagamentos USING btree (entidade_id);



--
-- Name: idx_pagamentos_external_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_external_transaction_id ON public.pagamentos USING btree (external_transaction_id);



--
-- Name: idx_pagamentos_idempotency_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_idempotency_key ON public.pagamentos USING btree (idempotency_key);



--
-- Name: idx_pagamentos_parcelas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_parcelas ON public.pagamentos USING btree (numero_parcelas) WHERE (numero_parcelas > 1);



--
-- Name: idx_pagamentos_provider_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_provider_event_id ON public.pagamentos USING btree (provider_event_id);



--
-- Name: idx_pagamentos_recibo_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_recibo_numero ON public.pagamentos USING btree (recibo_numero);



--
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);



--
-- Name: idx_pagamentos_tomador_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagamentos_tomador_id ON public.pagamentos USING btree (tomador_id);





--
-- Name: idx_recibos_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_ativo ON public.recibos USING btree (ativo);



--
-- Name: idx_recibos_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_clinica ON public.recibos USING btree (clinica_id);



--
-- Name: idx_recibos_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_clinica_id ON public.recibos USING btree (clinica_id);



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
-- Name: idx_recibos_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_entidade_id ON public.recibos USING btree (entidade_id);



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
-- Name: idx_recibos_pagamento_parcela; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_pagamento_parcela ON public.recibos USING btree (pagamento_id, parcela_numero);



--
-- Name: idx_recibos_parcela_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_parcela_numero ON public.recibos USING btree (parcela_numero);



--
-- Name: idx_recibos_vigencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_vigencia ON public.recibos USING btree (vigencia_inicio, vigencia_fim);



--
-- Name: idx_tokens_retomada_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_retomada_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);



--
-- Name: idx_tokens_retomada_expiracao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_retomada_expiracao ON public.tokens_retomada_pagamento USING btree (expira_em);



--
-- Name: idx_tokens_retomada_pagamento_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_retomada_pagamento_entidade_id ON public.tokens_retomada_pagamento USING btree (entidade_id);



--
-- Name: idx_tokens_retomada_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_retomada_token ON public.tokens_retomada_pagamento USING btree (token);



--
-- Name: idx_tokens_retomada_usado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tokens_retomada_usado ON public.tokens_retomada_pagamento USING btree (usado);



--
-- Name: v_solicitacoes_emissao _RETURN; Type: RULE; Schema: public; Owner: postgres
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
    e.nome AS empresa_nome,
    COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    count(a.id) AS num_avaliacoes_concluidas,
    (la.valor_por_funcionario * (count(a.id))::numeric) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status,
    l.id AS laudo_id,
    l.status AS laudo_status,
    (l.hash_pdf IS NOT NULL) AS laudo_tem_hash,
    l.emitido_em AS laudo_emitido_em,
    l.enviado_em AS laudo_enviado_em,
        CASE
            WHEN ((l.id IS NOT NULL) AND (((l.status)::text = 'emitido'::text) OR ((l.status)::text = 'enviado'::text))) THEN true
            ELSE false
        END AS laudo_ja_emitido,
        CASE
            WHEN (c.id IS NOT NULL) THEN 'rh'::text
            WHEN (la.entidade_id IS NOT NULL) THEN 'gestor'::text
            ELSE 'desconhecido'::text
        END AS tipo_solicitante,
    c.id AS clinica_id,
    c.nome AS clinica_nome,
    COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
    e.id AS empresa_id,
    vc.id AS vinculo_id,
    r.id AS representante_id,
    r.nome AS representante_nome,
    r.codigo AS representante_codigo,
    r.tipo_pessoa AS representante_tipo_pessoa,
    r.percentual_comissao AS representante_percentual_comissao,
    (EXISTS ( SELECT 1
           FROM public.comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id))) AS comissao_gerada,
    (( SELECT count(*) AS count
           FROM public.comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id)))::integer AS comissoes_geradas_count,
    (( SELECT count(*) AS count
           FROM public.comissoes_laudo cl
          WHERE ((cl.lote_pagamento_id = la.id) AND (cl.parcela_confirmada_em IS NOT NULL))))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado,
    vc.valor_negociado AS valor_negociado_vinculo
   FROM (((((((((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes e ON ((e.id = la.empresa_id)))
     LEFT JOIN public.clinicas c ON ((c.id = la.clinica_id)))
     LEFT JOIN public.entidades ent ON ((ent.id = la.entidade_id)))
     LEFT JOIN public.usuarios u ON (((u.cpf)::bpchar = la.liberado_por)))
     LEFT JOIN public.avaliacoes a ON (((a.lote_id = la.id) AND ((a.status)::text = 'concluida'::text))))
     LEFT JOIN public.laudos l ON ((l.lote_id = la.id)))
     LEFT JOIN public.vinculos_comissao vc ON (((vc.status = ANY (ARRAY['ativo'::public.status_vinculo, 'inativo'::public.status_vinculo])) AND (vc.data_expiracao > CURRENT_DATE) AND (((COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL) AND (vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id))) OR ((COALESCE(la.entidade_id, c.entidade_id) IS NULL) AND (la.clinica_id IS NOT NULL) AND (vc.clinica_id = la.clinica_id))))))
     LEFT JOIN public.representantes r ON ((r.id = vc.representante_id)))
     LEFT JOIN public.leads_representante lr ON ((lr.id = vc.lead_id)))
  WHERE (la.status_pagamento IS NOT NULL)
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao, lr.valor_negociado, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;



--
-- Name: recibos trg_gerar_numero_recibo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_gerar_numero_recibo BEFORE INSERT ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_gerar_numero_recibo();



--
-- Name: notificacoes_admin trg_notificacoes_admin_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_notificacoes_admin_updated BEFORE UPDATE ON public.notificacoes_admin FOR EACH ROW EXECUTE FUNCTION public.atualizar_notificacao_admin_timestamp();



--
-- Name: recibos trg_recibos_atualizar_data; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recibos_atualizar_data BEFORE UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.atualizar_data_modificacao();



--
-- Name: recibos trg_recibos_criar_pdf_job; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recibos_criar_pdf_job AFTER INSERT OR UPDATE ON public.recibos FOR EACH ROW EXECUTE FUNCTION public.trigger_criar_pdf_job();



--
-- Name: auditoria_recibos auditoria_recibos_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_recibos
    ADD CONSTRAINT auditoria_recibos_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;



--
-- Name: notificacoes_admin fk_notificacoes_contrato; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;



--
-- Name: notificacoes_admin fk_notificacoes_pagamento; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT fk_notificacoes_pagamento FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE CASCADE;



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
-- Name: tokens_retomada_pagamento fk_tokens_contrato; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_retomada_pagamento
    ADD CONSTRAINT fk_tokens_contrato FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;



--
-- Name: notificacoes_admin notificacoes_admin_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;



--
-- Name: notificacoes_admin notificacoes_admin_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes_admin
    ADD CONSTRAINT notificacoes_admin_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: pagamentos pagamentos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;



--
-- Name: pagamentos pagamentos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE SET NULL;





--
-- Name: recibos recibos_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;



--
-- Name: notificacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;


--
-- Name: notificacoes notificacoes_clinica_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY notificacoes_clinica_own ON public.notificacoes FOR SELECT USING (((destinatario_tipo = 'clinica'::text) AND (destinatario_cpf = current_setting('app.user_cpf'::text, true))));


