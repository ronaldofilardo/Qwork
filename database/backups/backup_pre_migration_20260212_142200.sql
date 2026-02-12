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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_cpf_key UNIQUE (cpf);


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
-- Name: avaliacoes audit_avaliacoes; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_avaliacoes AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


--
-- Name: funcionarios audit_funcionarios; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER audit_funcionarios AFTER INSERT OR DELETE OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();


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
-- Name: funcionarios trg_prevent_gestor_emissor; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_gestor_emissor BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.prevent_gestor_being_emissor();


--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();


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
-- Name: funcionarios trg_reject_prohibited_roles; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_reject_prohibited_roles BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.trg_reject_prohibited_roles_func();


--
-- Name: avaliacoes trg_validar_status_avaliacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validar_status_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW WHEN ((((old.status)::text IS DISTINCT FROM (new.status)::text) OR ((new.status)::text <> 'concluida'::text))) EXECUTE FUNCTION public.fn_validar_status_avaliacao();


--
-- Name: avaliacoes trigger_limpar_indice_ao_deletar; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_limpar_indice_ao_deletar BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.limpar_indice_ao_deletar_avaliacao();


--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();


--
-- Name: funcionarios trigger_registrar_inativacao; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_registrar_inativacao BEFORE UPDATE ON public.funcionarios FOR EACH ROW WHEN ((old.ativo IS DISTINCT FROM new.ativo)) EXECUTE FUNCTION public.registrar_inativacao_funcionario();


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
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;


--
-- Name: funcionarios fk_funcionarios_ultima_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT fk_funcionarios_ultima_avaliacao FOREIGN KEY (ultima_avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE SET NULL;


--
-- Name: avaliacoes admin_all_avaliacoes; Type: POLICY; Schema: public; Owner: neondb_owner
--

CREATE POLICY admin_all_avaliacoes ON public.avaliacoes USING ((current_setting('app.current_user_perfil'::text, true) = 'admin'::text));


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
-- PostgreSQL database dump complete
--

