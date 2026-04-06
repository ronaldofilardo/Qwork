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
-- Data for Name: session_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.session_logs (id, cpf, perfil, clinica_id, empresa_id, login_timestamp, logout_timestamp, ip_address, user_agent, criado_em) VALUES (1, '00000000000', 'admin', NULL, NULL, '2026-03-31 10:45:08.449676', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-31 10:45:08.449676');


--
-- Name: session_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.session_logs_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

