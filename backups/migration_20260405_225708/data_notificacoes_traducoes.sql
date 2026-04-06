--
-- PostgreSQL database dump
--

-- Dumped from database version 17.8 (a48d9ca)
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
-- Data for Name: notificacoes_traducoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (1, 'pre_cadastro_criado_titulo', 'pt_BR', 'Novo Pre-Cadastro: {{contratante_nome}}', 'titulo', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (2, 'pre_cadastro_criado_mensagem', 'pt_BR', 'Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: {{numero_funcionarios}}.', 'mensagem', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (3, 'pre_cadastro_criado_botao', 'pt_BR', 'Definir Valor', 'botao', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (4, 'pre_cadastro_criado_titulo', 'en_US', 'New Pre-Registration: {{contratante_nome}}', 'titulo', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (5, 'pre_cadastro_criado_mensagem', 'en_US', 'A new personalized plan pre-registration has been created and awaits value definition. Estimated employees: {{numero_funcionarios}}.', 'mensagem', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (6, 'pre_cadastro_criado_botao', 'en_US', 'Set Value', 'botao', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (7, 'pre_cadastro_criado_titulo', 'es_ES', 'Nuevo Pre-Registro: {{contratante_nome}}', 'titulo', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (8, 'pre_cadastro_criado_mensagem', 'es_ES', 'Se ha creado un nuevo pre-registro de plan personalizado y espera definicion de valor. Empleados estimados: {{numero_funcionarios}}.', 'mensagem', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');
INSERT INTO public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) VALUES (9, 'pre_cadastro_criado_botao', 'es_ES', 'Definir Valor', 'botao', '2026-02-09 20:16:02.493289', '2026-02-09 20:16:02.493289');


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_traducoes_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--

