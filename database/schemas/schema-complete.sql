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

SELECT pg_catalog.set_config ('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analise_estatistica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analise_estatistica (
    id integer NOT NULL,
    avaliacao_id integer,
    grupo integer,
    score_original numeric(5, 2),
    score_ajustado numeric(5, 2),
    anomalia_detectada boolean DEFAULT false,
    tipo_anomalia character varying(100),
    recomendacao text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.analise_estatistica OWNER TO postgres;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analise_estatistica_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.analise_estatistica_id_seq OWNER TO postgres;

--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analise_estatistica_id_seq OWNED BY public.analise_estatistica.id;

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
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY ((ARRAY['iniciada'::character varying, 'em_andamento'::character varying, 'concluida'::character varying, 'inativada'::character varying])::text[])))
);

ALTER TABLE public.avaliacoes OWNER TO postgres;

--
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avaliacoes_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.avaliacoes_id_seq OWNER TO postgres;

--
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;

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
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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

COMMENT ON
TABLE public.clinicas_empresas IS 'Relacionamento entre clÃ­nicas de medicina ocupacional e empresas clientes que elas atendem';

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

CREATE SEQUENCE public.clinicas_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.clinicas_id_seq OWNER TO postgres;

--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;

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
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.empresas_clientes OWNER TO postgres;

--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empresas_clientes_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

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
    CONSTRAINT funcionarios_clinica_check CHECK ((clinica_id IS NOT NULL OR perfil = 'emissor')),
    CONSTRAINT funcionarios_perfil_check CHECK (((perfil)::text = ANY ((ARRAY['funcionario'::character varying, 'rh'::character varying, 'admin'::character varying, 'emissor'::character varying])::text[])))
);

ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionarios_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.funcionarios_id_seq OWNER TO postgres;

--
-- Name: funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funcionarios_id_seq OWNED BY public.funcionarios.id;

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
    CONSTRAINT laudos_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'emitido'::character varying, 'enviado'::character varying])::text[])))
);

ALTER TABLE public.laudos OWNER TO postgres;

--
-- Name: laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudos_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.laudos_id_seq OWNER TO postgres;

--
-- Name: laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudos_id_seq OWNED BY public.laudos.id;

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
    finalizado_em timestamp without time zone,
    numero_ordem integer DEFAULT 1 NOT NULL,
    contratante_id integer,
    processamento_em timestamp without time zone,
    CONSTRAINT lotes_avaliacao_clinica_or_contratante_check CHECK ((((clinica_id IS NOT NULL) AND (contratante_id IS NULL)) OR ((clinica_id IS NULL) AND (contratante_id IS NOT NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'cancelado'::character varying, 'finalizado'::character varying, 'concluido'::character varying, 'rascunho'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['completo'::character varying, 'operacional'::character varying, 'gestao'::character varying])::text[]))),
    CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique UNIQUE (empresa_id, numero_ordem)
);

ALTER TABLE public.lotes_avaliacao OWNER TO postgres;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_avaliacao_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNER TO postgres;

--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNED BY public.lotes_avaliacao.id;

--
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

CREATE SEQUENCE public.questao_condicoes_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

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
    CONSTRAINT relatorio_templates_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['pdf'::character varying, 'excel'::character varying, 'ambos'::character varying])::text[])))
);

ALTER TABLE public.relatorio_templates OWNER TO postgres;

--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relatorio_templates_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

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

CREATE SEQUENCE public.respostas_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

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
    CONSTRAINT resultados_categoria_check CHECK (((categoria)::text = ANY ((ARRAY['baixo'::character varying, 'medio'::character varying, 'alto'::character varying])::text[])))
);

ALTER TABLE public.resultados OWNER TO postgres;

--
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.resultados_id_seq OWNER TO postgres;

--
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;

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
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
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
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
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
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);

--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);

--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);

--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);

--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);

--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);

--
-- Name: lotes_avaliacao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao ALTER COLUMN id SET DEFAULT nextval('public.lotes_avaliacao_id_seq'::regclass);

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
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);

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
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);

--
-- Name: idx_avaliacoes_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote ON public.avaliacoes USING btree (lote_id);

--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);

--
-- Name: idx_clinicas_empresas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_clinica ON public.clinicas_empresas USING btree (clinica_id);

--
-- Name: idx_clinicas_empresas_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_empresas_empresa ON public.clinicas_empresas USING btree (empresa_id);

--
-- Name: idx_empresas_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_ativa ON public.empresas_clientes USING btree (ativa);

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
-- Name: idx_funcionarios_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_empresa ON public.funcionarios USING btree (empresa_id);

--
-- Name: idx_funcionarios_matricula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funcionarios_matricula ON public.funcionarios USING btree (matricula);

--
-- Name: idx_laudos_emissor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor ON public.laudos USING btree (emissor_cpf);

--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);

--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);

--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);

--
-- Name: idx_lotes_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_codigo ON public.lotes_avaliacao USING btree (codigo);

--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);

--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);

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
-- Name: avaliacoes avaliacoes_funcionario_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios (cpf) ON DELETE CASCADE;

--
-- Name: avaliacoes avaliacoes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao (id) ON DELETE SET NULL;

--
-- Name: clinicas_empresas clinicas_empresas_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
ADD CONSTRAINT clinicas_empresas_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.funcionarios (id) ON DELETE CASCADE;

--
-- Name: clinicas_empresas clinicas_empresas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_empresas
ADD CONSTRAINT clinicas_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes (id) ON DELETE CASCADE;

--
-- Name: empresas_clientes empresas_clientes_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
ADD CONSTRAINT empresas_clientes_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas (id) ON DELETE CASCADE;

--
-- Name: funcionarios funcionarios_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
ADD CONSTRAINT funcionarios_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas (id);

--
-- Name: funcionarios funcionarios_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes (id) ON DELETE SET NULL;

--
-- Name: laudos laudos_emissor_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
ADD CONSTRAINT laudos_emissor_cpf_fkey FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios (cpf);

--
-- Name: laudos laudos_emissor_cpf_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
ADD CONSTRAINT laudos_emissor_cpf_fkey1 FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios (cpf);

--
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao (id) ON DELETE CASCADE;

--
-- Name: lotes_avaliacao lotes_avaliacao_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas (id) ON DELETE CASCADE;

--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes (id) ON DELETE CASCADE;

--
-- Name: lotes_avaliacao lotes_avaliacao_liberado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
ADD CONSTRAINT lotes_avaliacao_liberado_por_fkey FOREIGN KEY (liberado_por) REFERENCES public.funcionarios (cpf);

--
-- Name: lotes_avaliacao_funcionarios lotes_avaliacao_funcionarios_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao_funcionarios
ADD CONSTRAINT lotes_avaliacao_funcionarios_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao (id) ON DELETE CASCADE;

--
-- Name: lotes_avaliacao_funcionarios lotes_avaliacao_funcionarios_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao_funcionarios
ADD CONSTRAINT lotes_avaliacao_funcionarios_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios (id) ON DELETE CASCADE;

--
-- Name: lotes_avaliacao_funcionarios lotes_avaliacao_funcionarios_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao_funcionarios
ADD CONSTRAINT lotes_avaliacao_funcionarios_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes (id) ON DELETE SET NULL;

--
-- Name: respostas respostas_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
ADD CONSTRAINT respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes (id) ON DELETE CASCADE;

--
-- Name: resultados resultados_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
ADD CONSTRAINT resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes (id) ON DELETE CASCADE;

--
-- Name: contratos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contratos (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER REFERENCES contratantes(id) ON DELETE CASCADE,
    plano_id INTEGER REFERENCES planos(id),
    numero_funcionarios INTEGER,
    numero_funcionarios_estimado INTEGER,
    valor_total DECIMAL(12,2),
    valor_personalizado DECIMAL(12,2),
    conteudo TEXT,
    conteudo_gerado TEXT,
    aceito BOOLEAN DEFAULT FALSE,
    ip_aceite VARCHAR(45),
    data_aceite TIMESTAMP,
    status VARCHAR(50) DEFAULT 'generated',
    payment_link_token VARCHAR(128),
    payment_link_expiracao TIMESTAMP,
    link_enviado_em TIMESTAMP,
    criado_por_cpf VARCHAR(11),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos (status);
CREATE INDEX IF NOT EXISTS idx_contratos_numero_funcionarios ON public.contratos (numero_funcionarios);
CREATE INDEX IF NOT EXISTS idx_contratos_contratante ON public.contratos (contratante_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_contratos_payment_link_token ON public.contratos (payment_link_token) WHERE payment_link_token IS NOT NULL;

COMMENT ON TABLE public.contratos IS 'Contratos gerados para contratantes. Fluxo simplificado.';
COMMENT ON COLUMN public.contratos.valor_personalizado IS 'Valor negociado por funcionário para contratos personalizados';

--
-- PostgreSQL database dump complete
--