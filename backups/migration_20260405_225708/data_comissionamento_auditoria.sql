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
-- Data for Name: comissionamento_auditoria; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.comissionamento_auditoria (id, tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf, criado_em) VALUES (7, 'representantes', 1, 'apto_pendente', 'ativo', 'admin_action', 'Mudança de status representante', NULL, '00000000191', '2026-03-03 02:12:41.4885+00');
INSERT INTO public.comissionamento_auditoria (id, tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf, criado_em) VALUES (8, 'representantes', 1, 'ativo', 'apto', 'admin_action', 'Mudança de status representante', NULL, '87545772920', '2026-03-03 03:29:08.061381+00');
INSERT INTO public.comissionamento_auditoria (id, tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf, criado_em) VALUES (9, 'representantes', 1, 'ativo', 'apto', 'admin_action', '', NULL, '87545772920', '2026-03-03 03:29:08.20832+00');


--
-- Name: comissionamento_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comissionamento_auditoria_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--

