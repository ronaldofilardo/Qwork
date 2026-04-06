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
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (1, '87545772920', 'Administrador QWork', 'admin@qwork.com.br', NULL, NULL, true, '2026-02-09 20:56:58.100826', '2026-02-09 20:56:58.100826', 'admin');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (3, '53051173991', 'Emissor Teste QWork', 'emissor@qwork.com.br', NULL, NULL, true, '2026-02-09 21:00:16.715145', '2026-02-09 21:00:16.715145', 'emissor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (4, '29930511059', 'Gestor RLGR', 'rhrlge@kdke.com', NULL, 100, true, '2026-02-09 21:41:02.172557', '2026-02-09 21:41:02.172557', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (5, '04703084945', 'tani akk', '4dffadf@dsfdf.com', 104, NULL, true, '2026-02-10 04:21:23.389567', '2026-02-10 04:21:23.389567', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (6, '24626149073', 'zdvdzd dzvvzvz', 'dsfsdfsfd@fdfd.com', NULL, 105, true, '2026-02-10 12:31:00.37258', '2026-02-10 12:31:00.37258', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (7, '35051737030', 'Gestor Empresa Priv Fin', 'gestorempprivfin@ffdffsd.ci', NULL, 106, true, '2026-02-11 01:02:59.219163', '2026-02-11 01:02:59.219163', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (8, '64411953056', 'Gestor Clin Final test', 'gesges@dsgds.com', 107, NULL, true, '2026-02-11 01:48:14.9874', '2026-02-11 01:48:14.9874', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (10, '03178539026', 'amdna Nexus', 'fafa@safsf.com', 109, NULL, true, '2026-02-12 18:00:41.074283', '2026-02-12 18:00:41.074283', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (11, '07432266077', 'Ronaldo Entidade Final', 'ronaldofilardo@yahoo.com.br', NULL, 110, true, '2026-02-13 02:25:43.101457', '2026-02-13 02:25:43.101457', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (12, '58455720026', 'Tania Krina', 'gercli@dffd.com', 111, NULL, true, '2026-02-13 02:50:05.038676', '2026-02-13 02:50:05.038676', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (13, '70873742060', 'TESTE 16.02', 'DFHJKGHJDFJH@GMAIL.COM', 112, NULL, true, '2026-02-16 14:27:17.151252', '2026-02-16 14:27:17.151252', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (14, '62985815029', 'Amanda Clinex', 'fdfds@aas.com', 113, NULL, true, '2026-02-16 18:25:34.266543', '2026-02-16 18:25:34.266543', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (15, '48538520008', 'Ronlado Foçç', 'ffda@dasffd.co', NULL, 114, true, '2026-02-17 12:57:46.633749', '2026-02-17 12:57:46.633749', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (16, '31777317053', 'Aagpo pdaiopi', 'ffdfsd@kokol.com', 115, NULL, true, '2026-02-17 16:14:06.304648', '2026-02-17 16:14:06.304648', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (17, '92019863006', 'Entidade Final', 'fsfd@oojo.cd', NULL, 116, true, '2026-02-23 04:05:36.530364', '2026-02-23 04:05:36.530364', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (18, '16911251052', 'Rona Filar', 'rewwer@vvxcvc.dsf', NULL, 117, true, '2026-02-23 20:49:18.679465', '2026-02-23 20:49:18.679465', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (19, '99328531004', 'Tania kC Fila', 'sfdsf@dd.pom', 118, NULL, true, '2026-02-23 22:44:40.35939', '2026-02-23 22:44:40.35939', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (20, '87251739011', 'fasfasasf fasfaf', 'fdfdsf@sdffds.com', 119, NULL, true, '2026-02-25 16:00:19.903527', '2026-02-25 16:00:19.903527', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (21, '79432901009', 'TESTESTESTES TESTESTESTSETS', 'FDKHKLAFJG@GMAIL.COM', 120, NULL, true, '2026-02-25 17:58:12.954158', '2026-02-25 17:58:12.954158', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (22, '05248635047', 'Gestor pos clean', 'asaf@vcvcx.co', NULL, 121, true, '2026-02-27 11:45:21.401705', '2026-02-27 11:45:21.401705', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (23, '25070037072', 'gestor clin pioso cleln', 'sdfsdf@dsfdsf.co', 122, NULL, true, '2026-02-27 13:13:29.718153', '2026-02-27 13:13:29.718153', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (24, '38908580077', 'eaopi adsfpipoi po ', 'dsfsfd@faas.coj', 123, NULL, true, '2026-02-27 13:16:55.952313', '2026-02-27 13:16:55.952313', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (25, '49602738014', 'Lead Gestor PJ', 'faaf@oijoic.om', NULL, 124, true, '2026-03-03 02:59:08.181247', '2026-03-03 02:59:08.181247', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (26, '09777228996', 'TESTE teste', 'GHADJGHF@GMAIL.COM', NULL, 125, true, '2026-03-03 13:11:39.663435', '2026-03-03 13:11:39.663435', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (27, '52052819010', 'Gestor dash admin', 'dffds@sdffds.co', NULL, 126, true, '2026-03-03 13:47:03.906502', '2026-03-03 13:47:03.906502', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (28, '91510815040', 'geste test lead com acont', 'eerrwe@dsffds.ce', NULL, 127, true, '2026-03-03 14:07:02.696235', '2026-03-03 14:07:02.696235', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (29, '35962136063', 'gestor clini pos refa', 'fafds@dffds.con', 128, NULL, true, '2026-03-08 01:10:16.048524', '2026-03-08 01:10:16.048524', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (30, '69558061069', 'Leo JJ MedCwb', 'leobjj@med.com', 129, NULL, true, '2026-03-09 01:53:13.658037', '2026-03-09 01:53:13.658037', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (9, '87748070997', 'Cristine Dittmann Brasil', 'alessandra.gatti@acessosaude.com.br', NULL, 130, true, '2026-02-12 12:12:45.145804', '2026-03-10 11:53:57.830663', 'gestor');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (31, '22223287050', 'Gestor Sindicato', 'sindc@sin.com.br', 131, NULL, true, '2026-03-16 13:09:25.591974', '2026-03-16 13:09:25.591974', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (32, '45033323920', 'Gilson Dantas Damasceno', 'diretoria@policlinicacuritiba.com.br', 132, NULL, true, '2026-03-30 16:33:37.080827', '2026-03-30 16:33:37.080827', 'rh');
INSERT INTO public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) VALUES (33, '20192669702', 'Cesar Viana', 'cesar.viana@fiveinc.com.br', NULL, 133, true, '2026-03-31 19:42:32.230557', '2026-03-31 19:42:32.230557', 'gestor');


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 33, true);


--
-- PostgreSQL database dump complete
--

