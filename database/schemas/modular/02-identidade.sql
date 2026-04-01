-- ============================================================================
-- 02-identidade.sql
-- Clínicas, funcionários, usuários, autenticação, sessões, RBAC
-- Depends on: 01-foundation.sql
-- ============================================================================

--
-- Name: atualizar_notificacao_admin_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_notificacao_admin_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_notificacao_admin_timestamp() OWNER TO postgres;


--
-- Name: fn_audit_clinicas_senhas(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_audit_clinicas_senhas() OWNER TO postgres;


--
-- Name: fn_bloquear_campos_sensiveis_emissor(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_bloquear_campos_sensiveis_emissor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_user_perfil();

    -- Aplicar restrição apenas ao perfil emissor
    IF v_perfil = 'emissor' THEN
        -- Proteger campos de conteúdo gerado pelo sistema de avaliação
        IF (OLD.observacoes IS DISTINCT FROM NEW.observacoes) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar o campo observacoes de um laudo.'
                USING ERRCODE = '42501', HINT = 'O campo observacoes é gerenciado pelo sistema.';
        END IF;

        -- Proteger lote_id (não pode reatribuir laudo a outro lote)
        IF (OLD.lote_id IS DISTINCT FROM NEW.lote_id) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar o lote_id de um laudo.'
                USING ERRCODE = '42501', HINT = 'lote_id é imutável após criação.';
        END IF;

        -- Proteger emissor_cpf após definição (anti-fraude: não pode apropriar laudo alheio)
        IF (OLD.emissor_cpf IS NOT NULL AND OLD.emissor_cpf IS DISTINCT FROM NEW.emissor_cpf) THEN
            RAISE EXCEPTION 'Emissor não tem permissão para alterar emissor_cpf após definição.'
                USING ERRCODE = '42501', HINT = 'emissor_cpf é imutável após atribuição.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_bloquear_campos_sensiveis_emissor() OWNER TO postgres;


--
-- Name: fn_delete_senha_autorizado(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text) OWNER TO postgres;


--
-- Name: FUNCTION fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_delete_senha_autorizado(p_contratante_id integer, p_motivo text) IS 'UNICA forma segura de deletar senhas - requer motivo e registra em auditoria';



--
-- Name: fn_limpar_senhas_teste(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fn_limpar_senhas_teste() OWNER TO postgres;


--
-- Name: FUNCTION fn_limpar_senhas_teste(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_limpar_senhas_teste() IS 'APENAS PARA TESTES: Limpa senhas em ambiente de teste';



--
-- Name: prevent_gestor_being_emissor(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.prevent_gestor_being_emissor() OWNER TO postgres;


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
        -- Obter CPF do usuário atual da sessão
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

COMMENT ON FUNCTION public.registrar_inativacao_funcionario() IS 'Registra automaticamente data e responsável pela inativação de funcionários';



--
-- Name: trg_reject_prohibited_roles_func(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.trg_reject_prohibited_roles_func() OWNER TO postgres;


--
-- Name: FUNCTION trg_reject_prohibited_roles_func(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.trg_reject_prohibited_roles_func() IS 'Trigger function que rejeita inserÃ§Ãµes/updates de roles proibidos em funcionarios.
Fornece mensagem de erro clara direcionando para a tabela usuarios.
Adicionado em Migration 410 (2026-02-05).';



--
-- Name: update_clinicas_senhas_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.update_clinicas_senhas_updated_at() OWNER TO postgres;


--
-- Name: update_funcionarios_clinicas_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_funcionarios_clinicas_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_funcionarios_clinicas_timestamp() OWNER TO postgres;


--
-- Name: update_usuarios_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_usuarios_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_usuarios_updated_at() OWNER TO postgres;


--
-- Name: validate_funcionario_clinica_empresa(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.validate_funcionario_clinica_empresa() OWNER TO postgres;


--
-- Name: validate_funcionario_clinica_tipo(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.validate_funcionario_clinica_tipo() OWNER TO postgres;


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
    data_primeiro_pagamento timestamp without time zone,
    data_liberacao_login timestamp without time zone,
    contrato_aceito boolean DEFAULT false,
    tipo character varying(20) DEFAULT 'clinica'::character varying,
    entidade_id integer,
    cartao_cnpj_arquivo_remoto_provider character varying(50),
    cartao_cnpj_arquivo_remoto_bucket character varying(255),
    cartao_cnpj_arquivo_remoto_key character varying(2048),
    cartao_cnpj_arquivo_remoto_url text,
    contrato_social_arquivo_remoto_provider character varying(50),
    contrato_social_arquivo_remoto_bucket character varying(255),
    contrato_social_arquivo_remoto_key character varying(2048),
    contrato_social_arquivo_remoto_url text,
    doc_identificacao_arquivo_remoto_provider character varying(50),
    doc_identificacao_arquivo_remoto_bucket character varying(255),
    doc_identificacao_arquivo_remoto_key character varying(2048),
    doc_identificacao_arquivo_remoto_url text,
    CONSTRAINT clinicas_estado_check CHECK ((length((estado)::text) = 2)),
    CONSTRAINT clinicas_responsavel_cpf_check CHECK ((length((responsavel_cpf)::text) = 11))
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
-- Name: clinicas_senhas; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.clinicas_senhas OWNER TO postgres;


--
-- Name: TABLE clinicas_senhas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.clinicas_senhas IS 'Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)';



--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinicas_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_senhas_id_seq OWNER TO postgres;


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinicas_senhas_id_seq OWNED BY public.clinicas_senhas.id;



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
    CONSTRAINT funcionarios_nivel_cargo_check CHECK (((((perfil)::text = 'funcionario'::text) AND ((nivel_cargo)::text = ANY (ARRAY[('operacional'::character varying)::text, ('gestao'::character varying)::text]))) OR (((perfil)::text <> 'funcionario'::text) AND (nivel_cargo IS NULL)))),
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['funcionario'::character varying, 'rh'::character varying, 'admin'::character varying, 'emissor'::character varying, 'gestor'::character varying, 'representante'::character varying])::text[]))),
    CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (((perfil)::text <> ALL (ARRAY[('gestor_entidade'::character varying)::text, ('rh'::character varying)::text])))
);

ALTER TABLE ONLY public.funcionarios FORCE ROW LEVEL SECURITY;


ALTER TABLE public.funcionarios OWNER TO postgres;


--
-- Name: TABLE funcionarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.funcionarios IS 'Policies antigas que usavam FKs diretas foram removidas';



--
-- Name: funcionarios_clinicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionarios_clinicas (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    empresa_id integer NOT NULL,
    ativo boolean DEFAULT true,
    data_vinculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo timestamp without time zone,
    clinica_id integer NOT NULL,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    setor character varying(100),
    funcao character varying(100),
    matricula character varying(20),
    nivel_cargo character varying(50),
    turno character varying(50),
    escala character varying(50),
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    data_ultimo_lote timestamp without time zone
);


ALTER TABLE public.funcionarios_clinicas OWNER TO postgres;


--
-- Name: TABLE funcionarios_clinicas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.funcionarios_clinicas IS 'Relacionamento M:N entre funcionÃ¡rios e empresas clientes (via clÃ­nicas de medicina ocupacional). Permite histÃ³rico de vÃ­nculos.';



--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionarios_clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_clinicas_id_seq OWNER TO postgres;


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funcionarios_clinicas_id_seq OWNED BY public.funcionarios_clinicas.id;



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
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT usuarios_tipo_check CHECK ((((tipo_usuario = ANY (ARRAY['admin'::public.usuario_tipo_enum, 'emissor'::public.usuario_tipo_enum])) AND (clinica_id IS NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'rh'::public.usuario_tipo_enum) AND (clinica_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'gestor'::public.usuario_tipo_enum) AND (entidade_id IS NOT NULL) AND (clinica_id IS NULL)) OR ((tipo_usuario = 'suporte'::public.usuario_tipo_enum) AND (clinica_id IS NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'comercial'::public.usuario_tipo_enum) AND (clinica_id IS NULL) AND (entidade_id IS NULL)) OR ((tipo_usuario = 'vendedor'::public.usuario_tipo_enum) AND (clinica_id IS NULL) AND (entidade_id IS NULL))))
);


ALTER TABLE public.usuarios OWNER TO postgres;


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'UsuÃ¡rios do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidades_senhas/clinicas_senhas.';



--
-- Name: gestores; Type: VIEW; Schema: public; Owner: postgres
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


ALTER VIEW public.gestores OWNER TO postgres;


--
-- Name: VIEW gestores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.gestores IS 'View de gestores do sistema (RH e Gestor de Entidade)';



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

COMMENT ON TABLE public.session_logs IS 'Registra todos os acessos (login/logout) de usuários do sistema para auditoria';



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
  WHERE ((sl.perfil)::text = 'rh'::text);


ALTER VIEW public.vw_auditoria_acessos_rh OWNER TO postgres;


--
-- Name: clinica_configuracoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes ALTER COLUMN id SET DEFAULT nextval('public.clinica_configuracoes_id_seq'::regclass);



--
-- Name: clinicas_senhas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_senhas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_senhas_id_seq'::regclass);



--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);



--
-- Name: funcionarios_clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_clinicas ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_clinicas_id_seq'::regclass);



--
-- Name: mfa_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes ALTER COLUMN id SET DEFAULT nextval('public.mfa_codes_id_seq'::regclass);



--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);



--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);



--
-- Name: session_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_logs ALTER COLUMN id SET DEFAULT nextval('public.session_logs_id_seq'::regclass);



--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);



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
-- Name: clinicas clinicas_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_email_key UNIQUE (email);



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
-- Name: clinicas clinicas_responsavel_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_responsavel_cpf_key UNIQUE (responsavel_cpf);



--
-- Name: clinicas_senhas clinicas_senhas_clinica_cpf_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_clinica_cpf_unique UNIQUE (clinica_id, cpf);



--
-- Name: clinicas_senhas clinicas_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_cpf_key UNIQUE (cpf);



--
-- Name: clinicas_senhas clinicas_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_senhas
    ADD CONSTRAINT clinicas_senhas_pkey PRIMARY KEY (id);



--
-- Name: funcionarios_clinicas funcionarios_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_pkey PRIMARY KEY (id);



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
-- Name: mfa_codes mfa_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT mfa_codes_pkey PRIMARY KEY (id);



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
-- Name: clinica_configuracoes unique_clinica_config; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_configuracoes
    ADD CONSTRAINT unique_clinica_config UNIQUE (clinica_id);



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
-- Name: clinicas_cnpj_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clinicas_cnpj_unique ON public.clinicas USING btree (cnpj);



--
-- Name: clinicas_email_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clinicas_email_unique ON public.clinicas USING btree (email);



--
-- Name: clinicas_responsavel_cpf_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clinicas_responsavel_cpf_unique ON public.clinicas USING btree (responsavel_cpf);



--
-- Name: funcionarios_clinicas_unique_func_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX funcionarios_clinicas_unique_func_empresa ON public.funcionarios_clinicas USING btree (funcionario_id, empresa_id);



--
-- Name: idx_clinica_configuracoes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinica_configuracoes_clinica ON public.clinica_configuracoes USING btree (clinica_id);



--
-- Name: idx_clinicas_aprovado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_aprovado_em ON public.clinicas USING btree (aprovado_em) WHERE (aprovado_em IS NOT NULL);



--
-- Name: idx_clinicas_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_ativa ON public.clinicas USING btree (ativa);



--
-- Name: idx_clinicas_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_cnpj ON public.clinicas USING btree (cnpj);



--
-- Name: idx_clinicas_contrato_aceito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_contrato_aceito ON public.clinicas USING btree (contrato_aceito);



--
-- Name: idx_clinicas_data_liberacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_data_liberacao ON public.clinicas USING btree (data_liberacao_login);



--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);



--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);



--
-- Name: idx_clinicas_senhas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_senhas_clinica ON public.clinicas_senhas USING btree (clinica_id);



--
-- Name: idx_clinicas_senhas_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_senhas_clinica_id ON public.clinicas_senhas USING btree (clinica_id);



--
-- Name: idx_clinicas_senhas_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_senhas_cpf ON public.clinicas_senhas USING btree (cpf);



--
-- Name: idx_clinicas_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_status ON public.clinicas USING btree (status);



--
-- Name: idx_clinicas_status_data_cadastro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_status_data_cadastro ON public.clinicas USING btree (status, criado_em DESC);



--
-- Name: idx_func_clinicas_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_ativo ON public.funcionarios_clinicas USING btree (ativo);



--
-- Name: idx_func_clinicas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_clinica ON public.funcionarios_clinicas USING btree (clinica_id);



--
-- Name: idx_func_clinicas_clinica_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_clinica_ativo ON public.funcionarios_clinicas USING btree (clinica_id, ativo) WHERE (ativo = true);



--
-- Name: idx_func_clinicas_clinica_empresa_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_clinica_empresa_ativo ON public.funcionarios_clinicas USING btree (clinica_id, empresa_id, ativo) WHERE (ativo = true);



--
-- Name: idx_func_clinicas_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_empresa ON public.funcionarios_clinicas USING btree (empresa_id);



--
-- Name: idx_func_clinicas_empresa_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_empresa_ativo ON public.funcionarios_clinicas USING btree (empresa_id, ativo) WHERE (ativo = true);



--
-- Name: idx_func_clinicas_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_funcionario ON public.funcionarios_clinicas USING btree (funcionario_id);



--
-- Name: idx_func_clinicas_nivel_cargo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_clinicas_nivel_cargo ON public.funcionarios_clinicas USING btree (nivel_cargo);



--
-- Name: idx_funcionarios_cpf_perfil_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_cpf_perfil_ativo ON public.funcionarios USING btree (cpf, perfil, ativo);



--
-- Name: idx_funcionarios_data_ultimo_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_data_ultimo_lote ON public.funcionarios USING btree (data_ultimo_lote) WHERE (data_ultimo_lote IS NOT NULL);



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
-- Name: idx_funcionarios_nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_nome ON public.funcionarios USING btree (nome);



--
-- Name: idx_funcionarios_perfil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_perfil ON public.funcionarios USING btree (perfil);



--
-- Name: idx_funcionarios_ultima_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_ultima_avaliacao ON public.funcionarios USING btree (ultima_avaliacao_id) WHERE (ultima_avaliacao_id IS NOT NULL);



--
-- Name: idx_funcionarios_ultima_avaliacao_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_ultima_avaliacao_status ON public.funcionarios USING btree (ultima_avaliacao_status) WHERE (ultima_avaliacao_status IS NOT NULL);



--
-- Name: idx_mfa_cpf_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mfa_cpf_active ON public.mfa_codes USING btree (cpf, used, expires_at) WHERE (used = false);



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
-- Name: idx_usuarios_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_ativo ON public.usuarios USING btree (ativo);



--
-- Name: idx_usuarios_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_clinica_id ON public.usuarios USING btree (clinica_id) WHERE (clinica_id IS NOT NULL);



--
-- Name: idx_usuarios_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_cpf ON public.usuarios USING btree (cpf);



--
-- Name: idx_usuarios_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_entidade_id ON public.usuarios USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);



--
-- Name: idx_usuarios_tipo_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_tipo_ativo ON public.usuarios USING btree (tipo_usuario, ativo);



--
-- Name: idx_usuarios_tipo_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_tipo_usuario ON public.usuarios USING btree (tipo_usuario);



--
-- Name: funcionarios audit_funcionarios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_funcionarios AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();



--
-- Name: clinicas trg_clinicas_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_clinicas_criar_usuario_apos_aprovacao AFTER UPDATE ON public.clinicas FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();



--
-- Name: clinicas_senhas trg_clinicas_senhas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_clinicas_senhas_updated_at BEFORE UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.update_clinicas_senhas_updated_at();



--
-- Name: funcionarios trg_prevent_gestor_emissor; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_gestor_emissor BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.prevent_gestor_being_emissor();



--
-- Name: clinicas_senhas trg_protect_senhas; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_senhas BEFORE INSERT OR DELETE OR UPDATE ON public.clinicas_senhas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_clinicas_senhas();



--
-- Name: funcionarios trg_reject_prohibited_roles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reject_prohibited_roles BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.trg_reject_prohibited_roles_func();



--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION public.update_usuarios_updated_at();



--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_empresa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validate_funcionario_clinica_empresa BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_empresa();



--
-- Name: funcionarios_clinicas trg_validate_funcionario_clinica_tipo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validate_funcionario_clinica_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_clinica_tipo();



--
-- Name: clinica_configuracoes trigger_atualizar_timestamp_configuracoes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_atualizar_timestamp_configuracoes BEFORE UPDATE ON public.clinica_configuracoes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp_configuracoes();



--
-- Name: funcionarios trigger_registrar_inativacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_registrar_inativacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((old.ativo IS DISTINCT FROM new.ativo)) EXECUTE FUNCTION public.registrar_inativacao_funcionario();



--
-- Name: funcionarios_clinicas trigger_update_funcionarios_clinicas_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_funcionarios_clinicas_timestamp BEFORE UPDATE ON public.funcionarios_clinicas FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_clinicas_timestamp();



--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
    ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;



--
-- Name: clinicas clinicas_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id);





--
-- Name: funcionarios_clinicas fk_funcionarios_clinicas_clinica; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT fk_funcionarios_clinicas_clinica FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;



--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;



--
-- Name: mfa_codes fk_mfa_funcionarios; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mfa_codes
    ADD CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;



--
-- Name: funcionarios_clinicas funcionarios_clinicas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;



--
-- Name: funcionarios_clinicas funcionarios_clinicas_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_clinicas
    ADD CONSTRAINT funcionarios_clinicas_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;



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
-- Name: clinicas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;


--
-- Name: clinicas clinicas_admin_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY clinicas_admin_all ON public.clinicas USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));



--
-- Name: funcionarios; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;


--
-- Name: funcionarios funcionarios_admin_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_admin_delete ON public.funcionarios FOR DELETE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text, ('admin'::character varying)::text])) AND (ativo = false)));



--
-- Name: funcionarios funcionarios_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_admin_update ON public.funcionarios FOR UPDATE USING (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text, ('admin'::character varying)::text])))) WITH CHECK (((current_setting('app.current_user_perfil'::text, true) = 'admin'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text, ('admin'::character varying)::text]))));



--
-- Name: funcionarios funcionarios_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_block_admin ON public.funcionarios AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: funcionarios_clinicas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionarios_clinicas ENABLE ROW LEVEL SECURITY;


--
-- Name: funcionarios_clinicas funcionarios_clinicas_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_clinicas_block_admin ON public.funcionarios_clinicas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_clinicas_rh_delete ON public.funcionarios_clinicas FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));



--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_clinicas_rh_insert ON public.funcionarios_clinicas FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));



--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_clinicas_rh_select ON public.funcionarios_clinicas FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));



--
-- Name: funcionarios_clinicas funcionarios_clinicas_rh_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_clinicas_rh_update ON public.funcionarios_clinicas FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()))) WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));



--
-- Name: funcionarios funcionarios_delete_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_delete_simple ON public.funcionarios FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: funcionarios funcionarios_emissor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_emissor_select ON public.funcionarios FOR SELECT USING (((current_setting('app.current_user_perfil'::text, true) = 'emissor'::text) AND ((perfil)::text = ANY (ARRAY[('rh'::character varying)::text, ('emissor'::character varying)::text]))));



--
-- Name: funcionarios funcionarios_gestor_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_gestor_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));



--
-- Name: funcionarios funcionarios_gestor_insert_base; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_gestor_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND ((perfil)::text = 'funcionario'::text)));



--
-- Name: funcionarios funcionarios_gestor_select_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_gestor_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true))))));



--
-- Name: funcionarios funcionarios_gestor_update_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_gestor_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (EXISTS ( SELECT 1
   FROM public.funcionarios_entidades fe
  WHERE ((fe.funcionario_id = funcionarios.id) AND (fe.entidade_id = public.current_user_entidade_id()) AND (fe.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));



--
-- Name: funcionarios funcionarios_insert_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_insert_simple ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));



--
-- Name: funcionarios funcionarios_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_own_select ON public.funcionarios FOR SELECT USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));



--
-- Name: funcionarios funcionarios_own_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_own_update ON public.funcionarios FOR UPDATE USING ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text)))) WITH CHECK ((((perfil)::text = 'funcionario'::text) AND ((cpf)::text = NULLIF(current_setting('app.current_user_cpf'::text, true), ''::text))));



--
-- Name: funcionarios funcionarios_rh_delete_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_delete_via_relacionamento ON public.funcionarios FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));



--
-- Name: funcionarios funcionarios_rh_insert_base; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_insert_base ON public.funcionarios FOR INSERT WITH CHECK (((public.current_user_perfil() = 'rh'::text) AND ((perfil)::text = 'funcionario'::text)));



--
-- Name: funcionarios funcionarios_rh_select_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_select_via_relacionamento ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true))))));



--
-- Name: funcionarios funcionarios_rh_update_via_relacionamento; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_rh_update_via_relacionamento ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (EXISTS ( SELECT 1
   FROM public.funcionarios_clinicas fc
  WHERE ((fc.funcionario_id = funcionarios.id) AND (fc.clinica_id = public.current_user_clinica_id_optional()) AND (fc.ativo = true)))))) WITH CHECK (((perfil)::text = 'funcionario'::text));



--
-- Name: funcionarios funcionarios_select_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_select_simple ON public.funcionarios FOR SELECT USING (((public.current_user_perfil() = 'admin'::text) OR ((public.current_user_perfil() = 'funcionario'::text) AND ((cpf)::text = public.current_user_cpf())) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));



--
-- Name: funcionarios funcionarios_update_simple; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_update_simple ON public.funcionarios FOR UPDATE USING (((public.current_user_perfil() = 'admin'::text) OR (public.current_user_perfil() = 'rh'::text) OR (public.current_user_perfil() = 'gestor_entidade'::text)));



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


