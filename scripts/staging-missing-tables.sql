--
-- PostgreSQL database dump
--

-- Dumped from database version 17.8 (130b160)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria_sociedade_pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria_sociedade_pagamentos (
    id integer NOT NULL,
    pagamento_id integer,
    asaas_payment_id character varying(80),
    tomador_id integer,
    lote_id integer,
    modo_operacao character varying(20) DEFAULT 'simulacao'::character varying NOT NULL,
    status character varying(30) DEFAULT 'calculado'::character varying NOT NULL,
    valor_bruto numeric(12,2) DEFAULT 0 NOT NULL,
    valor_impostos numeric(12,2) DEFAULT 0 NOT NULL,
    valor_representante numeric(12,2) DEFAULT 0 NOT NULL,
    valor_comercial numeric(12,2) DEFAULT 0 NOT NULL,
    valor_socio_ronaldo numeric(12,2) DEFAULT 0 NOT NULL,
    valor_socio_antonio numeric(12,2) DEFAULT 0 NOT NULL,
    detalhes jsonb DEFAULT '{}'::jsonb NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria_sociedade_pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_sociedade_pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_sociedade_pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_sociedade_pagamentos_id_seq OWNED BY public.auditoria_sociedade_pagamentos.id;


--
-- Name: beneficiarios_sociedade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.beneficiarios_sociedade (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nome character varying(150) NOT NULL,
    nome_empresarial character varying(200),
    documento_fiscal character varying(30),
    asaas_wallet_id character varying(100),
    percentual_participacao numeric(5,2) DEFAULT 50 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE beneficiarios_sociedade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.beneficiarios_sociedade IS 'Beneficiários societários do QWork/Nexus para distribuição de resultados via split e auditoria.';


--
-- Name: COLUMN beneficiarios_sociedade.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.beneficiarios_sociedade.codigo IS 'Código estável do beneficiário societário (ex.: ronaldo, antonio).';


--
-- Name: beneficiarios_sociedade_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.beneficiarios_sociedade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: beneficiarios_sociedade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.beneficiarios_sociedade_id_seq OWNED BY public.beneficiarios_sociedade.id;


--
-- Name: configuracoes_gateway; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes_gateway (
    codigo character varying(40) NOT NULL,
    descricao character varying(100),
    tipo character varying(20) NOT NULL,
    valor numeric(10,4) DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT configuracoes_gateway_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('taxa_fixa'::character varying)::text, ('percentual'::character varying)::text])))
);


--
-- Name: TABLE configuracoes_gateway; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.configuracoes_gateway IS 'Taxas do gateway de pagamento por mÃ©todo. tipo=taxa_fixaâ†’R$; tipo=percentualâ†’%.';


--
-- Name: importacao_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.importacao_templates (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    clinica_id integer,
    entidade_id integer,
    criado_por_cpf character varying(11) NOT NULL,
    mapeamentos jsonb NOT NULL,
    nivel_cargo_map jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_importacao_template_tenant CHECK ((((clinica_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((clinica_id IS NULL) AND (entidade_id IS NOT NULL))))
);


--
-- Name: TABLE importacao_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.importacao_templates IS 'Templates de mapeamento de colunas para importação em massa. Cada template é privado do usuário (criado_por_cpf) dentro do tenant (clinica_id XOR entidade_id).';


--
-- Name: importacao_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.importacao_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: importacao_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.importacao_templates_id_seq OWNED BY public.importacao_templates.id;


--
-- Name: auditoria_sociedade_pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_sociedade_pagamentos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_sociedade_pagamentos_id_seq'::regclass);


--
-- Name: beneficiarios_sociedade id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiarios_sociedade ALTER COLUMN id SET DEFAULT nextval('public.beneficiarios_sociedade_id_seq'::regclass);


--
-- Name: importacao_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacao_templates ALTER COLUMN id SET DEFAULT nextval('public.importacao_templates_id_seq'::regclass);


--
-- Name: auditoria_sociedade_pagamentos auditoria_sociedade_pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_sociedade_pagamentos
    ADD CONSTRAINT auditoria_sociedade_pagamentos_pkey PRIMARY KEY (id);


--
-- Name: beneficiarios_sociedade beneficiarios_sociedade_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiarios_sociedade
    ADD CONSTRAINT beneficiarios_sociedade_codigo_key UNIQUE (codigo);


--
-- Name: beneficiarios_sociedade beneficiarios_sociedade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiarios_sociedade
    ADD CONSTRAINT beneficiarios_sociedade_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_gateway configuracoes_gateway_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_gateway
    ADD CONSTRAINT configuracoes_gateway_pkey PRIMARY KEY (codigo);


--
-- Name: importacao_templates importacao_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacao_templates
    ADD CONSTRAINT importacao_templates_pkey PRIMARY KEY (id);


--
-- Name: idx_auditoria_sociedade_pagamentos_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_sociedade_pagamentos_criado_em ON public.auditoria_sociedade_pagamentos USING btree (criado_em DESC);


--
-- Name: idx_auditoria_sociedade_pagamentos_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditoria_sociedade_pagamentos_payment ON public.auditoria_sociedade_pagamentos USING btree (asaas_payment_id);


--
-- Name: idx_beneficiarios_sociedade_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_beneficiarios_sociedade_codigo ON public.beneficiarios_sociedade USING btree (codigo);


--
-- Name: idx_importacao_templates_clinica_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_importacao_templates_clinica_cpf ON public.importacao_templates USING btree (clinica_id, criado_por_cpf) WHERE (clinica_id IS NOT NULL);


--
-- Name: idx_importacao_templates_entidade_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_importacao_templates_entidade_cpf ON public.importacao_templates USING btree (entidade_id, criado_por_cpf) WHERE (entidade_id IS NOT NULL);


--
-- Name: auditoria_sociedade_pagamentos auditoria_sociedade_pagamentos_pagamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria_sociedade_pagamentos
    ADD CONSTRAINT auditoria_sociedade_pagamentos_pagamento_id_fkey FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id) ON DELETE SET NULL;


--
-- Name: importacao_templates importacao_templates_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacao_templates
    ADD CONSTRAINT importacao_templates_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE CASCADE;


--
-- Name: importacao_templates importacao_templates_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importacao_templates
    ADD CONSTRAINT importacao_templates_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

