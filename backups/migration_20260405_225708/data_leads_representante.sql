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
-- Data for Name: leads_representante; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) VALUES (1, 1, '43723331000162', 'Leads Tests', 'Roanlo', 'ronaldorialdo@dgssapo.com', '419992415220', '2026-03-02 23:10:16.814881+00', '2026-05-31 23:10:16.814881+00', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-02 23:10:16.814881+00');
INSERT INTO public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) VALUES (2, 2, '48395311000123', 'Ledas PJ', 'gsipoi ', 'sdds@fdsfds.com', '88798798798', '2026-03-02 23:11:20.368599+00', '2026-05-31 23:11:20.368599+00', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-02 23:11:20.368599+00');
INSERT INTO public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) VALUES (4, 1, '70772067000120', 'lea 01 pf', 'uiouoiuo', 'dffds@dsfsd.vc', '4654654654', '2026-03-03 02:15:28.758646+00', '2026-06-01 02:15:28.758646+00', 'pendente', NULL, NULL, NULL, 'ccd83e74899ea3ef9565835cb5941584bc2331735e5603ff56af338d27848aec', '2026-03-03 02:19:32.07908+00', '2026-06-01 02:15:28.758646+00', '2026-03-03 02:19:32.07908+00');
INSERT INTO public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) VALUES (3, 2, '34304264000150', 'Lead PJ 01', 'Raqondi', 'sssdsd@sdfsdf.com', '459112456465', '2026-03-03 01:58:52.300266+00', '2026-06-01 01:58:52.300266+00', 'convertido', 'verificacao_cnpj', 124, '2026-03-03 02:58:53.264511+00', '16cb825bc803b62458bf5f94a0223b8e0eb0784ffbee4f478ad65105befade66', '2026-03-03 02:20:30.452998+00', '2026-06-01 01:58:52.300266+00', '2026-03-03 02:58:53.264511+00');
INSERT INTO public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) VALUES (5, 2, '61614511000198', 'Tste PJ lead', 'raoeip', 'ere@sdfsdf.dfe', '4578978978', '2026-03-03 13:50:26.502094+00', '2026-06-01 13:50:26.502094+00', 'convertido', 'codigo_representante', 127, '2026-03-03 14:06:52.076726+00', NULL, NULL, NULL, '2026-03-03 14:06:52.076726+00');


--
-- Name: leads_representante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leads_representante_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

