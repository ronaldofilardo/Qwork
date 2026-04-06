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
-- Data for Name: vinculos_comissao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.vinculos_comissao (id, representante_id, entidade_id, lead_id, data_inicio, data_expiracao, status, ultimo_laudo_em, criado_em, atualizado_em, encerrado_em, encerrado_motivo) VALUES (1, 2, 124, 3, '2026-03-03', '2027-03-03', 'ativo', NULL, '2026-03-03 02:58:53.283324+00', '2026-03-03 02:58:53.283324+00', NULL, NULL);
INSERT INTO public.vinculos_comissao (id, representante_id, entidade_id, lead_id, data_inicio, data_expiracao, status, ultimo_laudo_em, criado_em, atualizado_em, encerrado_em, encerrado_motivo) VALUES (2, 2, 127, 5, '2026-03-03', '2027-03-03', 'ativo', NULL, '2026-03-03 14:06:52.096173+00', '2026-03-03 14:06:52.096173+00', NULL, NULL);


--
-- Name: vinculos_comissao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vinculos_comissao_id_seq', 2, true);


--
-- PostgreSQL database dump complete
--

