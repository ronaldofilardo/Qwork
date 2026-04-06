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
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES (1, 'manage:rh', 'rh', 'manage', 'Gerenciar cadastro de usuários RH', '2026-02-09 20:16:00.131613');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES (2, 'manage:clinicas', 'clinicas', 'manage', 'Gerenciar cadastro de clínicas', '2026-02-09 20:16:00.131613');
INSERT INTO public.permissions (id, name, resource, action, description, created_at) VALUES (3, 'manage:admins', 'admins', 'manage', 'Gerenciar cadastro de outros administradores', '2026-02-09 20:16:00.131613');


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

