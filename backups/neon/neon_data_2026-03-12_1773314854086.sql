--
-- PostgreSQL database dump
--

-- Dumped from database version 17.8 (6108b59)
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
-- Data for Name: backup_laudos_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_laudos_contratante_1 (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, hash_pdf, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url) FROM stdin;
\.


--
-- Data for Name: backup_resultados_contratante_1; Type: TABLE DATA; Schema: backups; Owner: neondb_owner
--

COPY backups.backup_resultados_contratante_1 (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
\.


--
-- Data for Name: _migration_issues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._migration_issues (id, migration_version, issue_type, description, data, resolved, created_at) FROM stdin;
\.


--
-- Data for Name: aceites_termos_entidade; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.aceites_termos_entidade (id, entidade_cnpj, entidade_tipo, entidade_id, entidade_nome, responsavel_cpf, responsavel_nome, responsavel_tipo, termo_tipo, versao_termo, aceito_em, ip_address, responsavel_removido_em, responsavel_remover_motivo) FROM stdin;
1	26698929000120	clinica	109	Pos Correc Dep 1202	03178539026	amdna Nexus	rh	termos_uso	1	2026-02-12 18:30:31.448362+00	177.146.166.16	\N	\N
2	26698929000120	clinica	109	Pos Correc Dep 1202	03178539026	amdna Nexus	rh	politica_privacidade	1	2026-02-12 18:30:38.684521+00	177.146.166.16	\N	\N
3	09110380000191	clinica	104	RLJ COMERCIAL EXPORTADORA LTDA	04703084945	tani akk	rh	termos_uso	1	2026-02-12 20:17:37.379964+00	177.146.166.16	\N	\N
4	09110380000191	clinica	104	RLJ COMERCIAL EXPORTADORA LTDA	04703084945	tani akk	rh	politica_privacidade	1	2026-02-12 20:17:42.295161+00	177.146.166.16	\N	\N
5	02494916000170	entidade	100	RELEGERE - ASSESSORIA E CONSULTORIA LTDA	29930511059	Gestor RLGR	gestor	termos_uso	1	2026-02-12 21:08:41.359738+00	177.146.166.16	\N	\N
6	02494916000170	entidade	100	RELEGERE - ASSESSORIA E CONSULTORIA LTDA	29930511059	Gestor RLGR	gestor	politica_privacidade	1	2026-02-12 21:08:55.094631+00	177.146.166.16	\N	\N
7	24067473000174	entidade	110	Empresa Final	07432266077	Ronaldo Entidade Final	gestor	termos_uso	1	2026-02-13 02:26:15.679364+00	177.146.166.16	\N	\N
8	24067473000174	entidade	110	Empresa Final	07432266077	Ronaldo Entidade Final	gestor	politica_privacidade	1	2026-02-13 02:26:21.969186+00	177.146.166.16	\N	\N
9	79831824000163	clinica	111	Clinica Final	58455720026	Tania Krina	rh	termos_uso	1	2026-02-13 02:50:46.829651+00	177.146.166.16	\N	\N
10	79831824000163	clinica	111	Clinica Final	58455720026	Tania Krina	rh	politica_privacidade	1	2026-02-13 02:50:51.365086+00	177.146.166.16	\N	\N
11	41677495000175	clinica	112	TESTE 16.02	70873742060	TESTE 16.02	rh	termos_uso	1	2026-02-16 14:28:25.76285+00	189.112.122.137	\N	\N
12	41677495000175	clinica	112	TESTE 16.02	70873742060	TESTE 16.02	rh	politica_privacidade	1	2026-02-16 14:28:29.998824+00	189.112.122.137	\N	\N
13	04228123000135	clinica	113	Clinex MedOCup	62985815029	Amanda Clinex	rh	termos_uso	1	2026-02-16 18:25:59.393102+00	177.146.166.16	\N	\N
14	04228123000135	clinica	113	Clinex MedOCup	62985815029	Amanda Clinex	rh	politica_privacidade	1	2026-02-16 18:26:05.367925+00	177.146.166.16	\N	\N
15	56853041000185	entidade	114	Entidade 00	48538520008	Ronlado Foçç	gestor	termos_uso	1	2026-02-17 12:58:14.37076+00	177.146.164.76	\N	\N
16	56853041000185	entidade	114	Entidade 00	48538520008	Ronlado Foçç	gestor	politica_privacidade	1	2026-02-17 12:58:18.780214+00	177.146.164.76	\N	\N
17	60772535000102	clinica	115	Clinica End	31777317053	Aagpo pdaiopi	rh	termos_uso	1	2026-02-17 16:14:37.898729+00	177.146.164.76	\N	\N
18	60772535000102	clinica	115	Clinica End	31777317053	Aagpo pdaiopi	rh	politica_privacidade	1	2026-02-17 16:14:47.891932+00	177.146.164.76	\N	\N
19	91408159000103	entidade	116	empersa ioipoipo	92019863006	Entidade Final	gestor	termos_uso	1	2026-02-23 04:06:31.19496+00	::1	\N	\N
20	91408159000103	entidade	116	empersa ioipoipo	92019863006	Entidade Final	gestor	politica_privacidade	1	2026-02-23 04:06:34.038165+00	::1	\N	\N
21	73357308000162	entidade	117	TKCF Siderurguaca	16911251052	Rona Filar	gestor	termos_uso	1	2026-02-23 20:50:22.043114+00	201.159.185.249	\N	\N
22	73357308000162	entidade	117	TKCF Siderurguaca	16911251052	Rona Filar	gestor	politica_privacidade	1	2026-02-23 20:50:26.840486+00	201.159.185.249	\N	\N
23	91280455000163	clinica	118	clinex 2026 ltda	99328531004	Tania kC Fila	rh	termos_uso	1	2026-02-23 22:45:04.628221+00	201.159.185.223	\N	\N
24	91280455000163	clinica	118	clinex 2026 ltda	99328531004	Tania kC Fila	rh	politica_privacidade	1	2026-02-23 22:45:09.005889+00	201.159.185.223	\N	\N
25	99179883000106	clinica	119	oipo poi po	87251739011	fasfasasf fasfaf	rh	termos_uso	1	2026-02-25 16:02:07.700439+00	201.159.185.187	\N	\N
26	99179883000106	clinica	119	oipo poi po	87251739011	fasfasasf fasfaf	rh	politica_privacidade	1	2026-02-25 16:02:12.172399+00	201.159.185.187	\N	\N
27	29060003000100	clinica	120	SDFSDFSDFSDFSD	79432901009	TESTESTESTES TESTESTESTSETS	rh	termos_uso	1	2026-02-25 17:59:19.132343+00	189.112.122.137	\N	\N
28	29060003000100	clinica	120	SDFSDFSDFSDFSD	79432901009	TESTESTESTES TESTESTESTSETS	rh	politica_privacidade	1	2026-02-25 17:59:22.763543+00	189.112.122.137	\N	\N
29	38854941000165	entidade	121	Tsete apos clean	05248635047	Gestor pos clean	gestor	termos_uso	1	2026-02-27 11:45:46.808119+00	::1	\N	\N
30	38854941000165	entidade	121	Tsete apos clean	05248635047	Gestor pos clean	gestor	politica_privacidade	1	2026-02-27 11:45:49.950052+00	::1	\N	\N
31	43315703000111	clinica	123	clinai pos clena	38908580077	eaopi adsfpipoi po 	rh	termos_uso	1	2026-02-27 13:17:18.304186+00	::1	\N	\N
32	43315703000111	clinica	123	clinai pos clena	38908580077	eaopi adsfpipoi po 	rh	politica_privacidade	1	2026-02-27 13:17:21.54454+00	::1	\N	\N
33	34304264000150	entidade	124	Teste lead PJ	49602738014	Lead Gestor PJ	gestor	termos_uso	1	2026-03-03 02:59:29.387714+00	::1	\N	\N
34	34304264000150	entidade	124	Teste lead PJ	49602738014	Lead Gestor PJ	gestor	politica_privacidade	1	2026-03-03 02:59:31.651171+00	::1	\N	\N
35	99154114000153	entidade	125	fdfgadfgaadffg	09777228996	TESTE teste	gestor	termos_uso	1	2026-03-03 13:12:59.757509+00	189.112.122.137	\N	\N
36	99154114000153	entidade	125	fdfgadfgaadffg	09777228996	TESTE teste	gestor	politica_privacidade	1	2026-03-03 13:13:33.248339+00	189.112.122.137	\N	\N
37	89178670000106	entidade	126	Teste dash admin	52052819010	Gestor dash admin	gestor	termos_uso	1	2026-03-03 13:47:24.88158+00	::1	\N	\N
38	89178670000106	entidade	126	Teste dash admin	52052819010	Gestor dash admin	gestor	politica_privacidade	1	2026-03-03 13:47:27.474781+00	::1	\N	\N
39	61614511000198	entidade	127	teste lead comiss e contrat	91510815040	geste test lead com acont	gestor	termos_uso	1	2026-03-03 14:07:24.111004+00	::1	\N	\N
40	61614511000198	entidade	127	teste lead comiss e contrat	91510815040	geste test lead com acont	gestor	politica_privacidade	1	2026-03-03 14:07:26.742813+00	::1	\N	\N
41	95520984000148	clinica	128	tste por refact	35962136063	gestor clini pos refa	rh	termos_uso	1	2026-03-08 01:10:39.815026+00	152.250.78.77	\N	\N
42	95520984000148	clinica	128	tste por refact	35962136063	gestor clini pos refa	rh	politica_privacidade	1	2026-03-08 01:10:43.747923+00	152.250.78.77	\N	\N
43	22765627000176	clinica	129	MedCtba	69558061069	Leo JJ MedCwb	rh	termos_uso	1	2026-03-09 01:53:39.265356+00	152.250.78.77	\N	\N
44	22765627000176	clinica	129	MedCtba	69558061069	Leo JJ MedCwb	rh	politica_privacidade	1	2026-03-09 01:53:43.328946+00	152.250.78.77	\N	\N
45	25013531000140	entidade	130	Acesso Saúde Franchisig e Gestão de Ativos Ltda	87748070997	Cristine Dittmann Brasil	gestor	termos_uso	1	2026-03-10 11:54:55.816505+00	189.112.122.137	\N	\N
46	25013531000140	entidade	130	Acesso Saúde Franchisig e Gestão de Ativos Ltda	87748070997	Cristine Dittmann Brasil	gestor	politica_privacidade	1	2026-03-10 11:55:00.300492+00	189.112.122.137	\N	\N
\.


--
-- Data for Name: aceites_termos_usuario; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.aceites_termos_usuario (id, usuario_cpf, usuario_tipo, usuario_entidade_id, termo_tipo, versao_termo, aceito_em, ip_address, user_agent, sessao_id, revogado_em, motivo_revogacao, revogado_por) FROM stdin;
1	03178539026	rh	109	termos_uso	1	2026-02-12 18:30:31.184806+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	820ba6130f7c8b1e750242eaf04b46c5a53b536ed74b28115de5a569888633c8	\N	\N	\N
2	03178539026	rh	109	politica_privacidade	1	2026-02-12 18:30:38.439522+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	820ba6130f7c8b1e750242eaf04b46c5a53b536ed74b28115de5a569888633c8	\N	\N	\N
3	04703084945	rh	104	termos_uso	1	2026-02-12 20:17:37.130363+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	4e86a27d6d34b34f01a782f76cd17a20a40235ab394b8fe06e29f4dc6518bc6a	\N	\N	\N
4	04703084945	rh	104	politica_privacidade	1	2026-02-12 20:17:42.059962+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	4e86a27d6d34b34f01a782f76cd17a20a40235ab394b8fe06e29f4dc6518bc6a	\N	\N	\N
5	29930511059	gestor	100	termos_uso	1	2026-02-12 21:08:41.111629+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	febf04b400297f4935754fafa6facdef650afb22288921df12828c9b6a3cdd58	\N	\N	\N
6	29930511059	gestor	100	politica_privacidade	1	2026-02-12 21:08:54.861009+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	febf04b400297f4935754fafa6facdef650afb22288921df12828c9b6a3cdd58	\N	\N	\N
7	07432266077	gestor	110	termos_uso	1	2026-02-13 02:26:15.429985+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	16341b6b6b93cd7b3544fb2cf3a638ad96c4ce88d2e5c1466d0f3f62ccf8816c	\N	\N	\N
8	07432266077	gestor	110	politica_privacidade	1	2026-02-13 02:26:21.726196+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	16341b6b6b93cd7b3544fb2cf3a638ad96c4ce88d2e5c1466d0f3f62ccf8816c	\N	\N	\N
9	58455720026	rh	111	termos_uso	1	2026-02-13 02:50:46.583549+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2e5a8e9452079bec02e01052d3d71e34e201b9ef8150f5e39af05eefc30860da	\N	\N	\N
10	58455720026	rh	111	politica_privacidade	1	2026-02-13 02:50:51.120385+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2e5a8e9452079bec02e01052d3d71e34e201b9ef8150f5e39af05eefc30860da	\N	\N	\N
11	70873742060	rh	112	termos_uso	1	2026-02-16 14:28:25.515639+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	954f8a5d1c84dde456e16321c064205b406c9bd9d61a8e91188b2477b0060a1a	\N	\N	\N
12	70873742060	rh	112	politica_privacidade	1	2026-02-16 14:28:29.764472+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	954f8a5d1c84dde456e16321c064205b406c9bd9d61a8e91188b2477b0060a1a	\N	\N	\N
13	62985815029	rh	113	termos_uso	1	2026-02-16 18:25:59.147318+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	4a00a3bb1ba62b5046fa96e50ef31e4404c8dc96cf7c8c7e94453d29819dc3bc	\N	\N	\N
14	62985815029	rh	113	politica_privacidade	1	2026-02-16 18:26:05.13005+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	4a00a3bb1ba62b5046fa96e50ef31e4404c8dc96cf7c8c7e94453d29819dc3bc	\N	\N	\N
15	48538520008	gestor	114	termos_uso	1	2026-02-17 12:58:14.119083+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	ada23b64dea76cf115ce4d39e15a522c58fffe20bc3aa6c78028ebf943be9fec	\N	\N	\N
16	48538520008	gestor	114	politica_privacidade	1	2026-02-17 12:58:18.544096+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	ada23b64dea76cf115ce4d39e15a522c58fffe20bc3aa6c78028ebf943be9fec	\N	\N	\N
17	31777317053	rh	115	termos_uso	1	2026-02-17 16:14:37.649368+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	3ea857f8dbccba71a9484403b34a36c7f17f4ccb739cc89121ed86285b6728b5	\N	\N	\N
18	31777317053	rh	115	politica_privacidade	1	2026-02-17 16:14:47.656493+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	3ea857f8dbccba71a9484403b34a36c7f17f4ccb739cc89121ed86285b6728b5	\N	\N	\N
19	92019863006	gestor	116	termos_uso	1	2026-02-23 04:06:31.173771+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	8af7c76333cfc5e36dadcb2b3ed708ca8a115854ac649b3692655e8d7f3aec14	\N	\N	\N
20	92019863006	gestor	116	politica_privacidade	1	2026-02-23 04:06:34.020673+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	8af7c76333cfc5e36dadcb2b3ed708ca8a115854ac649b3692655e8d7f3aec14	\N	\N	\N
21	16911251052	gestor	117	termos_uso	1	2026-02-23 20:50:21.800739+00	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	5972bdb992c1ad021dfecd865b4bf6ccf7d1f9de06bbb682ebded21608a1c72b	\N	\N	\N
22	16911251052	gestor	117	politica_privacidade	1	2026-02-23 20:50:26.602737+00	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	5972bdb992c1ad021dfecd865b4bf6ccf7d1f9de06bbb682ebded21608a1c72b	\N	\N	\N
23	99328531004	rh	118	termos_uso	1	2026-02-23 22:45:04.386757+00	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	4e3228865ac9aae09456b7a32c12872716da58f82bc57b32a4a99704dcb73263	\N	\N	\N
24	99328531004	rh	118	politica_privacidade	1	2026-02-23 22:45:08.764421+00	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	4e3228865ac9aae09456b7a32c12872716da58f82bc57b32a4a99704dcb73263	\N	\N	\N
25	87251739011	rh	119	termos_uso	1	2026-02-25 16:02:07.462738+00	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	9ee0bf09a570554d1c2dda18fb91dbe0924623648eb2d5554d293971d8053923	\N	\N	\N
26	87251739011	rh	119	politica_privacidade	1	2026-02-25 16:02:11.936762+00	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	9ee0bf09a570554d1c2dda18fb91dbe0924623648eb2d5554d293971d8053923	\N	\N	\N
27	79432901009	rh	120	termos_uso	1	2026-02-25 17:59:18.890644+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	822de554d76e4039f7062dbdb3808fecea7435aa7d893a34050c8e9c7a583639	\N	\N	\N
28	79432901009	rh	120	politica_privacidade	1	2026-02-25 17:59:22.526524+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	822de554d76e4039f7062dbdb3808fecea7435aa7d893a34050c8e9c7a583639	\N	\N	\N
29	05248635047	gestor	121	termos_uso	1	2026-02-27 11:45:46.790949+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1417a18908a53f2d6e670705017fea1d324539749aa744f241361d6b31971b23	\N	\N	\N
30	05248635047	gestor	121	politica_privacidade	1	2026-02-27 11:45:49.938487+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	1417a18908a53f2d6e670705017fea1d324539749aa744f241361d6b31971b23	\N	\N	\N
31	38908580077	rh	123	termos_uso	1	2026-02-27 13:17:18.282786+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	02fe0d34cfa328d8b1a7c1eb861b1132ec81321a2e5793b76581dcffc307255a	\N	\N	\N
32	38908580077	rh	123	politica_privacidade	1	2026-02-27 13:17:21.534033+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	02fe0d34cfa328d8b1a7c1eb861b1132ec81321a2e5793b76581dcffc307255a	\N	\N	\N
33	49602738014	gestor	124	termos_uso	1	2026-03-03 02:59:29.369101+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	732ea13855dbdc76e90a88f578d6ca9133e217eda0033fc619e8c83fc6f14302	\N	\N	\N
34	49602738014	gestor	124	politica_privacidade	1	2026-03-03 02:59:31.635763+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	732ea13855dbdc76e90a88f578d6ca9133e217eda0033fc619e8c83fc6f14302	\N	\N	\N
35	09777228996	gestor	125	termos_uso	1	2026-03-03 13:12:59.519017+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	ce60020f65fd5f6a0a543602429ef599a224555c7d724be1d12cd4b2519bf1fa	\N	\N	\N
36	09777228996	gestor	125	politica_privacidade	1	2026-03-03 13:13:33.00905+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	ce60020f65fd5f6a0a543602429ef599a224555c7d724be1d12cd4b2519bf1fa	\N	\N	\N
37	52052819010	gestor	126	termos_uso	1	2026-03-03 13:47:24.866976+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	23676b6853ccdb0e43dc4ab130d1579f2b71f4928dea46b2016086c9121daf6a	\N	\N	\N
38	52052819010	gestor	126	politica_privacidade	1	2026-03-03 13:47:27.464257+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	23676b6853ccdb0e43dc4ab130d1579f2b71f4928dea46b2016086c9121daf6a	\N	\N	\N
39	91510815040	gestor	127	termos_uso	1	2026-03-03 14:07:24.096344+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	224dc62861fc708b2e8dab2adbac653053e400e0f2be9abde4430df74156821c	\N	\N	\N
40	91510815040	gestor	127	politica_privacidade	1	2026-03-03 14:07:26.730782+00	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	224dc62861fc708b2e8dab2adbac653053e400e0f2be9abde4430df74156821c	\N	\N	\N
41	35962136063	rh	128	termos_uso	1	2026-03-08 01:10:39.575982+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	e56abe3f444a23f7c2bdf3977e106448ce6cf49237a5a326714ba0a8b557fc50	\N	\N	\N
42	35962136063	rh	128	politica_privacidade	1	2026-03-08 01:10:43.514193+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	e56abe3f444a23f7c2bdf3977e106448ce6cf49237a5a326714ba0a8b557fc50	\N	\N	\N
43	69558061069	rh	129	termos_uso	1	2026-03-09 01:53:39.027035+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	3c67e6957d04b7c64d31211bf4eaecb6e7c66d0479dbb1062c31a48e3c387fd8	\N	\N	\N
44	69558061069	rh	129	politica_privacidade	1	2026-03-09 01:53:43.091381+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	3c67e6957d04b7c64d31211bf4eaecb6e7c66d0479dbb1062c31a48e3c387fd8	\N	\N	\N
45	87748070997	gestor	130	termos_uso	1	2026-03-10 11:54:55.583579+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	360094c512af7ecfbf32168e9179247c3504eb0e284067f890c08cd99c055676	\N	\N	\N
46	87748070997	gestor	130	politica_privacidade	1	2026-03-10 11:55:00.070923+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	360094c512af7ecfbf32168e9179247c3504eb0e284067f890c08cd99c055676	\N	\N	\N
\.


--
-- Data for Name: empresas_clientes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.empresas_clientes (id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, representante_nome, representante_fone, representante_email, responsavel_email, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM stdin;
5	Empresa CM onlinwe	22902898000126	55asds@dsdssdf.com	(46) 54654-6566	rua lkj lk 89089	ipiopipo	IO	45612456	t	104	2026-02-10 09:40:21.970549	2026-02-10 09:40:21.970549	dsdsd dfssfdf	46465456456	fssafsf@fasasf.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	Empresa clin fina 001	82429448000190	sdfsdf@assa.com	(45) 64546-6545	Rua Antônio Bianchetti, 90	São José dos Pinhais	FE	83065-370	t	107	2026-02-11 01:52:11.752978	2026-02-11 01:52:11.752978	GEstor CLun fianl	89798798799	rerewewr@fdsfds.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	TESTE EMPRESA	05073619000140	DFFJKJHDKLGDF@GMAIL.COM	(06) 84680-4804	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	t	108	2026-02-12 12:15:27.394911	2026-02-12 12:15:27.394911	TESTE GESTOR EMPRESA	50465046504	506068FGFD@GMAIL.COM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	Empasa Amada Aeso	16122856000170	dffds@afaf.com	(46) 54897-9879	rrpoiop poipo  123	uiou iioi	IO	45678456	t	109	2026-02-12 18:32:10.507968	2026-02-12 18:32:10.507968	Amanda Acesso	45646546546	dfdsf@dsffds.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	Empresa RH da clini	91105132000133	sdsds@dfdf.com	(45) 46545-6465	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	t	111	2026-02-13 02:51:46.972587	2026-02-13 02:51:46.972587	GEsto RH final	45478878877	sds@xcxcx.om	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	TESTE TESTE	43627564000161	\N	\N	\N	\N	\N	\N	t	112	2026-02-16 14:31:27.053862	2026-02-16 14:31:27.053862	TESTE TESTE	60884086400	FGKDFGHDF@GMAIL.COM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	Empresa Clin Amanda Ltda	54223491000169	dfdsf@afa.com	(46) 54564-6546	rua opoipo 234	iopiopipi	IO	45678456	t	112	2026-02-16 17:43:31.4948	2026-02-16 17:43:31.4948	Tste 1602 clin	98465465465	fddfs@sdfsdf.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	GEsor Clinex	32375691000102	sdfsdf@sadsad.com	(54) 65465-4656	rua pipoi o3553	sfaasf	OP	454612456	t	113	2026-02-16 18:27:01.456567	2026-02-16 18:27:01.456567	Amnada Gestora	46546546546	dfdsf@dsfsdf.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	Empresa Clinica End	00790746000146	dsfsdf@sadffas.com	(46) 45646-5466	rua ljlko 908098	fdsdd	OP	45612789	t	115	2026-02-17 16:15:34.199728	2026-02-17 16:15:34.199728	Romalo fdoipoipo	77464654666	dsfdsf@dsfdsf.co	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	Empres clin 02	40337270000107	cffas@sfddsf.oj	(65) 46545-6465	rua ljijio 890	ddsfd	PO	45612456	t	104	2026-02-17 19:30:08.900293	2026-02-17 19:30:08.900293	Robero pipoipoi	64546546546	46545@dfsfd.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	Emp cline 2026 fev	16285851000168	fdsdsfsdf@dsfdsf.com	(79) 79798-7746	rua idsfpoi 2345	eewefdssdfsdf	OP	78945456	t	118	2026-02-23 22:46:28.302503	2026-02-23 22:46:28.302503	Rona Fialrdo	49879879879	ronsadlf@fdfd.com	\N	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/cartao_cnpj-1771886783385-3y7mu4.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/contrato_social-1771886787397-9iogcq.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/doc_identificacao-1771886787566-jpzqs5.pdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16	fdfds sdfdfssfd	79973255000190	dsdsfsf@fdssd.com	(78) 97987-9879	rua podsipo 23423	uiouoiuoi	UI	45678456	t	119	2026-02-25 16:02:54.251984	2026-02-25 16:02:54.251984	rnapdop dfiop po	54465465466	fddsf@fdsdsf.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
17	dfsgsG SDFsfes	33671387000167	\N	\N	\N	\N	\N	\N	t	120	2026-02-25 18:04:58.534983	2026-02-25 18:04:58.534983	sjkdfhkjsd hjkfdsh fjk hsdkj	80740840684	sdfDFDBKA@GMAIL.COM	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18	emeoa ruao io	88804016000106	ewewwe@aaf.scom	(48) 64546-4654	rua ouiou 342	uiouoiuoi	UI	45678456	t	123	2026-02-27 13:18:11.481166	2026-02-27 13:18:11.481166	rei po p	47777795645	fdfds@sddsfa.ciu	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19	empre pos revad 01	67394465000145	fdsdf@fafas.com	(46) 57987-9879	rua pipoi rew 890	lopipoi	IO	45645456	t	128	2026-03-08 01:12:48.260373	2026-03-08 01:12:48.260373	rh 01 por refacr	41998798897	iyi@guuyu.cou	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
20	Farma Mori	33447623000166	farmamori@mori.com	(41) 99984-6465	rua cur4iiba 456	ctba	PR	45678465	t	129	2026-03-09 01:55:13.380677	2026-03-09 01:55:13.380677	Gestor MedCtba	41321321323	medctba@med.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.entidades (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM stdin;
100	RELEGERE - ASSESSORIA E CONSULTORIA LTDA	02494916000170	\N	rlrlg@rlrlr.com	(46) 54897-8978	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Gestor RLGR	29930511059	Recurso Humano	rhrlge@kdke.com	(46) 79879-8799	\N	\N	\N	pendente	\N	\N	t	2026-02-09 21:03:01.083207	2026-02-09 21:41:02.172557	\N	\N	f	\N	\N	\N	2026-02-09 21:41:02.172557	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
105	DDSDSAGADSGGSD	96104413000195	\N	dsfsfdsfd@fddsf.com	(46) 54654-6546	rua jlk 3234	lçlçjçlj	OI	45654-656	zdvdzd dzvvzvz	24626149073	\N	dsfsdfsfd@fdfd.com	(65) 45646-5465	\N	\N	\N	pendente	\N	\N	t	2026-02-10 12:30:34.697287	2026-02-10 12:30:34.697287	\N	\N	f	\N	\N	\N	2026-02-10 12:31:00.622395	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
106	Empresa Privada Final	63424269000115	\N	empprivfinal@sfdsfsd.com	(45) 67987-9879	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Gestor Empresa Priv Fin	35051737030	\N	gestorempprivfin@ffdffsd.ci	(45) 46546-5466	\N	\N	\N	pendente	\N	\N	t	2026-02-11 01:02:47.812895	2026-02-11 01:02:47.812895	\N	\N	f	\N	\N	\N	2026-02-11 01:02:59.472266	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
110	Empresa Final	24067473000174	\N	emprefinal@dodo.com	(46) 46545-6466	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Ronaldo Entidade Final	07432266077	\N	ronaldofilardo@yahoo.com.br	(46) 57984-6546	\N	\N	\N	pendente	\N	\N	t	2026-02-13 02:25:16.382278	2026-02-13 02:25:16.382278	\N	\N	f	\N	\N	\N	2026-02-13 02:25:43.358775	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
114	Entidade 00	56853041000185	\N	ffas@fsaafs.com	(79) 84654-5566	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Ronlado Foçç	48538520008	\N	ffda@dasffd.co	(54) 65313-2332	\N	\N	\N	pendente	\N	\N	t	2026-02-17 12:57:34.69226	2026-02-17 12:57:34.69226	\N	\N	f	\N	\N	\N	2026-02-17 12:57:46.888761	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
116	empersa ioipoipo	91408159000103	\N	fdfds@dffd.co	(45) 64654-6546	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Entidade Final	92019863006	\N	fsfd@oojo.cd	(45) 46465-4646	/uploads/entidades/91408159000103/cartao_cnpj_1771819533011.pdf	/uploads/entidades/91408159000103/contrato_social_1771819533013.png	/uploads/entidades/91408159000103/doc_identificacao_1771819533015.pdf	pendente	\N	\N	t	2026-02-23 04:05:23.806693	2026-02-23 04:05:23.806693	\N	\N	f	\N	\N	\N	2026-02-23 04:05:36.551839	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
117	TKCF Siderurguaca	73357308000162	\N	erwer@dsfsf.com	(46) 57897-9879	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Rona Filar	16911251052	\N	rewwer@vvxcvc.dsf	(46) 54654-6546	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/cad-qwork/73357308000162/cartao_cnpj-1771879678879-emrucx.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/cad-qwork/73357308000162/contrato_social-1771879679233-tohj9t.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/cad-qwork/73357308000162/doc_identificacao-1771879679271-sluog9.pdf	pendente	\N	\N	t	2026-02-23 20:47:59.738044	2026-02-23 20:47:59.738044	\N	\N	f	\N	\N	\N	2026-02-23 20:49:18.932911	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
121	Tsete apos clean	38854941000165	\N	fdffa@dfdfs.com	(46) 87764-6665	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Gestor pos clean	05248635047	\N	asaf@vcvcx.co	(79) 87987-9879	/uploads/cadastros/38854941000165/cartao_cnpj_1772192713850.pdf	/uploads/cadastros/38854941000165/contrato_social_1772192713858.pdf	/uploads/cadastros/38854941000165/doc_identificacao_1772192713866.pdf	pendente	\N	\N	t	2026-02-27 11:44:56.621321	2026-02-27 11:44:56.621321	\N	\N	f	\N	\N	\N	2026-02-27 11:45:21.420996	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
124	Teste lead PJ	34304264000150	\N	sssdsd@sdfsdf.com	(45) 46546-4656	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Lead Gestor PJ	49602738014	\N	faaf@oijoic.om	(98) 78979-8798	/uploads/cadastros/34304264000150/cartao_cnpj_1772506759221.pdf	/uploads/cadastros/34304264000150/contrato_social_1772506759226.pdf	/uploads/cadastros/34304264000150/doc_identificacao_1772506759229.pdf	pendente	\N	\N	t	2026-03-03 02:58:53.093874	2026-03-03 02:58:53.093874	\N	\N	f	\N	\N	\N	2026-03-03 02:59:08.195895	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
125	fdfgadfgaadffg	99154114000153	\N	dffgdfgdfhg@gail.com	(41) 99540-1309	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	TESTE teste	09777228996	\N	GHADJGHF@GMAIL.COM	(50) 48084-68008	https://s3.us-east-005.backblazeb2.com/cad-qwork/99154114000153/cartao_cnpj-1772543466365-ydpmvi.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/99154114000153/contrato_social-1772543466624-b3dwlo.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/99154114000153/doc_identificacao-1772543466839-kycdhd.pdf	pendente	\N	\N	t	2026-03-03 13:11:08.559559	2026-03-03 13:11:08.559559	\N	\N	f	\N	\N	\N	2026-03-03 13:11:39.901702	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
126	Teste dash admin	89178670000106	5465465465465	roeoroe@dsd.com	(48) 96545-6465	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Gestor dash admin	52052819010	YI	dffds@sdffds.co	(49) 87987-9879	/uploads/cadastros/89178670000106/cartao_cnpj_1772545638207.pdf	/uploads/cadastros/89178670000106/contrato_social_1772545638210.pdf	/uploads/cadastros/89178670000106/doc_identificacao_1772545638212.pdf	pendente	\N	\N	t	2026-03-03 13:46:50.855233	2026-03-03 13:46:50.855233	\N	\N	f	\N	\N	\N	2026-03-03 13:47:03.920363	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
127	teste lead comiss e contrat	61614511000198	\N	errew@dssdf.com	(48) 79879-8988	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	geste test lead com acont	91510815040	\N	eerrwe@dsffds.ce	(87) 98798-7989	/uploads/cadastros/61614511000198/cartao_cnpj_1772546839305.pdf	/uploads/cadastros/61614511000198/contrato_social_1772546839308.pdf	/uploads/cadastros/61614511000198/doc_identificacao_1772546839311.pdf	pendente	\N	\N	t	2026-03-03 14:06:51.937147	2026-03-03 14:06:51.937147	\N	\N	f	\N	\N	\N	2026-03-03 14:07:02.712395	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
130	Acesso Saúde Franchisig e Gestão de Ativos Ltda	25013531000140	Isento	alessandra.gatti@acessosaude.com.br	(41) 99704-0187	Rua João Negrão, 731	Curitiba	PR	80010-200	Cristine Dittmann Brasil	87748070997	Diretora	alessandra.gatti@acessosaude.com.br	(41) 98495-0721	https://s3.us-east-005.backblazeb2.com/cad-qwork/25013531000140/cartao_cnpj-1773143572202-devym2.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/25013531000140/contrato_social-1773143572578-pd6ztc.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/25013531000140/doc_identificacao-1773143573144-am0fbm.pdf	pendente	\N	\N	t	2026-03-10 11:52:53.659539	2026-03-10 11:52:53.659539	\N	\N	f	\N	\N	\N	2026-03-10 11:53:58.07222	f	entidade	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: entidades_senhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.entidades_senhas (id, entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em, contratante_id) FROM stdin;
2	100	29930511059	$2a$10$aLYeDmWcuSkamyX5qsq0leqlPW2PcvUXNkw3xOAKHyzC.YVaUcueC	f	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557+00	2026-02-09 21:41:02.172557+00	\N
3	105	24626149073	$2a$10$jlXMPJhN2gO2ObE4vSsid.6YU6m9bgEjjapeMyHfYniU5I7OKiZF6	f	2026-02-10 12:30:59.566007	2026-02-10 12:30:59.566007	2026-02-10 12:30:59.566007+00	2026-02-10 12:30:59.566007+00	\N
4	106	35051737030	$2a$10$6uDPCkB8pFxM/LmYgnFMaefyvRYT0Y8qt58CNlB3CdB43/Sm0aLaW	f	2026-02-11 01:02:58.401725	2026-02-11 01:02:58.401725	2026-02-11 01:02:58.401725+00	2026-02-11 01:02:58.401725+00	\N
5	110	07432266077	$2a$10$Uc.nBlzCFHou9I8v9wmc8OcgxKGgd3X77YfYeRvhyYhohqZcfoYSK	f	2026-02-13 02:25:42.249994	2026-02-13 02:25:42.249994	2026-02-13 02:25:42.249994+00	2026-02-13 02:25:42.249994+00	\N
6	114	48538520008	$2a$10$mNAqTwjtCo1CXRtCO2GXReqkQIdFEK3txi9OXPwVtZ58CktEttrfe	f	2026-02-17 12:57:45.733896	2026-02-17 12:57:45.733896	2026-02-17 12:57:45.733896+00	2026-02-17 12:57:45.733896+00	\N
7	116	92019863006	$2a$10$R2/M92fJwnTJXIAK69t3jeYGnq5vEEuTnXB6uHNDlMdlwli.m32Lu	f	2026-02-23 04:05:36.327101	2026-02-23 04:05:36.327101	2026-02-23 04:05:36.327101+00	2026-02-23 04:05:36.327101+00	\N
8	117	16911251052	$2a$10$qYW4ISS37INl6NeoByktlup.PabkzqXmRCLgikNVHoQYc6B71Duoi	f	2026-02-23 20:49:17.826927	2026-02-23 20:49:17.826927	2026-02-23 20:49:17.826927+00	2026-02-23 20:49:17.826927+00	\N
9	121	05248635047	$2a$10$.sK/OcuwvRlL775wQ8GRiObkIv6aJ9hbBBy4OWx892IVIVnl3sDje	f	2026-02-27 11:45:21.206884	2026-02-27 11:45:21.206884	2026-02-27 11:45:21.206884+00	2026-02-27 11:45:21.206884+00	\N
10	124	49602738014	$2a$10$WOtyu7DEeUGpFZKaYz6eBezxsfHMYfN2PU4jHkIaWMWT3ixxud3rW	f	2026-03-03 02:59:08.005989	2026-03-03 02:59:08.005989	2026-03-03 02:59:08.005989+00	2026-03-03 02:59:08.005989+00	\N
11	125	09777228996	$2a$10$.Lwsf6Aep1AP0ThVLYM3EucniLWJhXG63CxWcLXaQpAkiQGchgsua	f	2026-03-03 13:11:38.848509	2026-03-03 13:11:38.848509	2026-03-03 13:11:38.848509+00	2026-03-03 13:11:38.848509+00	\N
12	126	52052819010	$2a$10$yRjS9hKRcGJSUDh7pTuO4etxZxSQFmuCaZBW9qwII7V7L1SJllGm6	f	2026-03-03 13:47:03.736544	2026-03-03 13:47:03.736544	2026-03-03 13:47:03.736544+00	2026-03-03 13:47:03.736544+00	\N
13	127	91510815040	$2a$10$b5HGcoEzwZTdkcgmoLp1ju4gtCSsmisAqElVXq59lBlQPE8P82/l6	f	2026-03-03 14:07:02.492068	2026-03-03 14:07:02.492068	2026-03-03 14:07:02.492068+00	2026-03-03 14:07:02.492068+00	\N
14	130	87748070997	$2a$10$.hUo7ccE./FK/zWtWBVchugKNtjIJxeENsBs5e5v7wTodmFZAqkT6	f	2026-03-10 11:53:57.002414	2026-03-10 11:53:57.002414	2026-03-10 11:53:57.002414+00	2026-03-10 11:53:57.002414+00	\N
\.


--
-- Data for Name: lotes_avaliacao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, contratante_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico) FROM stdin;
1027	115	13	Lote 1 liberado para Empresa Clinica End. Inclui 3 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-17 16:17:22.406893	2026-02-17 16:17:22.406893	2026-02-17 16:28:26.445818	\N	1	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-17 16:27:57.800068+00	33.00	ca6ee321-2dbd-49ea-a578-b732cad6508b	\N	2026-02-17 16:28:26.445818+00	credit_card	1	2026-02-17 16:29:22.79328+00	\N
1002	\N	\N	Lote 1 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-10 11:29:28.439742	2026-02-10 11:29:28.439742	2026-02-10 11:29:28.439742	\N	1	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1003	104	5	Lote 1 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-10 11:30:56.337043	2026-02-10 11:30:56.337043	2026-02-10 11:30:56.337043	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1004	\N	\N	Lote 2 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	\N	2	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1006	\N	\N	Lote 3 liberado para DDSDSAGADSGGSD. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	24626149073	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	\N	3	\N	\N	\N	\N	\N	105	105	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1029	\N	\N	Lote 12 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-17 19:34:09.774335	2026-02-17 19:34:09.774335	2026-02-17 23:15:14.462273	\N	12	\N	\N	\N	\N	\N	100	100	pago	2026-02-17 21:35:14.838208+00	150.00	8bc01387-6f1c-4fe7-b3b4-356c76f35945	\N	2026-02-17 23:15:14.462273+00	credit_card	1	2026-02-17 23:55:18.867426+00	\N
1025	\N	\N	Lote 10 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-17 00:20:09.341759	2026-02-17 00:20:09.341759	2026-02-18 00:01:16.315871	\N	10	\N	\N	\N	\N	\N	100	100	pago	2026-02-17 23:59:37.428059+00	10.00	a3b74d47-3419-4231-af49-1a5918e97639	\N	2026-02-18 00:01:16.315871+00	credit_card	1	2026-02-18 00:03:00.81661+00	\N
1005	104	5	Lote 2 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-10 12:21:47.979581	2026-02-10 12:21:47.979581	2026-02-10 19:46:39.971473	\N	2	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-10 17:22:32.905537+00	25.00	c37df516-0283-4077-8207-43a5291f6777	\N	2026-02-10 19:46:22.317626+00	pix	1	2026-02-10 19:46:39.971473+00	\N
1007	\N	\N	Lote 4 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-10 14:13:18.784349	2026-02-10 14:13:18.784349	2026-02-10 19:51:55.641195	\N	4	\N	\N	\N	\N	\N	100	100	pago	2026-02-10 19:50:59.93632+00	100.00	3351da28-10bb-4d66-8b85-ba934f57f24a	\N	2026-02-10 19:51:40.174121+00	boleto	4	2026-02-10 19:51:55.641195+00	\N
1030	\N	\N	Lote 13 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-18 02:19:37.269912	2026-02-18 02:19:37.269912	2026-02-18 02:22:06.352576	\N	13	\N	\N	\N	\N	\N	100	100	pago	2026-02-18 02:21:21.221813+00	12.00	2310f4d6-4014-44ae-a715-0ab5ef0dc10d	\N	2026-02-18 02:22:06.352576+00	boleto	1	2026-02-18 02:36:02.383377+00	\N
1008	\N	\N	Lote 5 liberado para Empresa Privada Final. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	35051737030	2026-02-11 01:05:34.180476	2026-02-11 01:05:34.180476	2026-02-11 01:16:19.911755	\N	5	\N	\N	\N	\N	\N	106	106	pago	2026-02-11 01:15:05.870431+00	23.33	e22cbf01-6a25-49da-bd67-437ccdad074c	\N	2026-02-11 01:15:59.845042+00	boleto	1	2026-02-11 01:16:19.911755+00	\N
1009	107	6	Lote 1 liberado para Empresa clin fina 001. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-11 01:53:04.39101	2026-02-11 01:53:04.39101	2026-02-11 02:03:15.828649	\N	1	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-11 02:02:12.860741+00	55.00	49ac333d-0884-4530-8bd6-0749566bd0c6	\N	2026-02-11 02:02:48.098336+00	transferencia	1	2026-02-11 02:03:15.828649+00	\N
1032	104	14	Lote 3 liberado para Empres clin 02. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-18 03:04:23.317314	2026-02-18 03:04:23.317314	2026-02-18 03:06:40.240047	\N	3	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-18 03:05:53.947524+00	123.00	dbc29d61-5b35-405e-b758-5c0e6d0a7811	\N	2026-02-18 03:06:40.240047+00	boleto	1	2026-02-18 03:20:43.245433+00	\N
1010	104	5	Lote 3 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-12 12:24:06.406657	2026-02-12 12:24:06.406657	2026-02-12 12:34:04.859771	\N	3	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-12 12:32:18.127816+00	25.00	fe86cdf5-4356-4fee-b272-2df43286428f	\N	2026-02-12 12:33:32.859493+00	pix	1	2026-02-12 12:34:04.859771+00	\N
1011	109	8	Lote 1 liberado para Empasa Amada Aeso. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-12 19:55:58.791717	2026-02-12 19:55:58.791717	2026-02-12 19:55:58.791717	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1012	104	5	Lote 4 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-12 20:18:17.914788	2026-02-12 20:18:17.914788	2026-02-12 20:18:17.914788	\N	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1013	\N	\N	Lote 6 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 4 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-12 21:09:12.071042	2026-02-12 21:09:12.071042	2026-02-12 21:09:12.071042	\N	6	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1031	104	14	Lote 2 liberado para Empres clin 02. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-18 02:38:58.852216	2026-02-18 02:38:58.852216	2026-02-18 02:41:15.563308	\N	2	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-18 02:40:40.065771+00	24.00	1b5b047f-d29d-4754-8e56-b66811ba7fc3	\N	2026-02-18 02:41:15.563308+00	boleto	1	2026-02-18 03:20:49.925074+00	\N
1014	\N	\N	Lote 7 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	29930511059	2026-02-12 22:05:59.608885	2026-02-12 22:05:59.608885	2026-02-12 23:52:18.708343	\N	7	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1015	\N	\N	Lote 8 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 1 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-12 23:56:29.222814	2026-02-12 23:56:29.222814	2026-02-12 23:56:29.222814	\N	8	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1016	\N	\N	Lote 9 liberado para Empresa Final. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	07432266077	2026-02-13 02:29:32.907947	2026-02-13 02:29:32.907947	2026-02-13 02:29:32.907947	\N	9	\N	\N	\N	\N	\N	110	110	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1017	111	9	Lote 1 liberado para Empresa RH da clini. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-13 02:53:27.28168	2026-02-13 02:53:27.28168	2026-02-13 02:53:27.28168	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1019	104	5	Lote 6 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-16 14:23:17.887271	2026-02-16 14:23:17.887271	2026-02-18 01:30:15.3016	\N	6	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-18 01:27:36.591513+00	19.00	9b1da50d-26bc-4301-882e-c833d19cc54c	\N	2026-02-18 01:30:15.3016+00	boleto	1	2026-02-18 03:27:49.178956+00	\N
1020	112	10	Lote 1 liberado para TESTE TESTE. Inclui 1 funcionário(s) elegíveis.	completo	cancelado	\N	2026-02-16 14:41:07.474115	2026-02-16 14:41:07.474115	2026-02-16 14:43:34.744744	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1021	112	10	Lote 2 liberado para TESTE TESTE. Inclui 1 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-16 14:43:59.088439	2026-02-16 14:43:59.088439	2026-02-16 14:43:59.088439	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1022	112	10	Lote 3 liberado para TESTE TESTE. Inclui 2 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-16 14:54:08.66088	2026-02-16 14:54:08.66088	2026-02-16 14:54:08.66088	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1023	112	10	Lote 4 liberado para TESTE TESTE. Inclui 4 funcionário(s) elegíveis.	completo	ativo	\N	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	\N	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1024	113	12	Lote 1 liberado para GEsor Clinex. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-16 18:28:42.879711	2026-02-16 18:28:42.879711	2026-02-16 18:38:20.790429	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1033	104	14	Lote 4 liberado para Empres clin 02. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-18 11:07:07.504048	2026-02-18 11:07:07.504048	2026-02-18 11:11:26.885306	\N	4	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-18 11:08:59.166885+00	18.50	02512aad-79ae-45f4-bd09-15328aa3444d	\N	2026-02-18 11:11:26.885306+00	boleto	1	2026-02-18 11:12:38.538267+00	\N
1026	\N	\N	Lote 11 liberado para Entidade 00. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	48538520008	2026-02-17 13:00:20.583082	2026-02-17 13:00:20.583082	2026-02-17 13:54:36.214778	\N	11	\N	\N	\N	\N	\N	114	114	pago	2026-02-17 13:09:14.294596+00	43.50	7a5a3eca-1a50-4b2d-8c68-9e6aa8f11825	\N	2026-02-17 13:54:36.214778+00	credit_card	1	2026-02-17 14:08:32.581613+00	\N
1035	118	15	Lote 1 liberado para Emp cline 2026 fev. Inclui 3 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-23 23:08:34.460644	2026-02-23 23:08:34.460644	2026-02-23 23:17:14.424353	\N	1	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-23 23:16:38.107263+00	20.00	be50e8fc-1728-4f2b-99bb-9ff6598bf778	\N	2026-02-23 23:17:14.424353+00	boleto	1	2026-02-23 23:20:51.676171+00	\N
1018	104	5	Lote 5 liberado para Empresa CM onlinwe. Inclui 3 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-13 12:52:21.512364	2026-02-13 12:52:21.512364	2026-02-17 00:24:15.071124	\N	5	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-17 00:23:27.974976+00	15.55	95c6333e-b6fc-4170-b26e-47277984707c	\N	2026-02-17 00:24:15.071124+00	credit_card	1	2026-02-17 16:25:07.446918+00	\N
1028	104	14	Lote 1 liberado para Empres clin 02. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-17 19:31:13.767633	2026-02-17 19:31:13.767633	2026-02-26 17:23:59.171385	\N	1	\N	\N	\N	\N	\N	\N	\N	aguardando_pagamento	2026-02-20 00:08:49.131665+00	13.55	765983cf-fb28-4e15-a175-2c941bacf196	\N	2026-02-26 17:23:59.171385+00	\N	\N	\N	\N
1043	129	20	Lote 1 liberado para Farma Mori. Inclui 4 funcionário(s) elegíveis.	completo	cancelado	\N	2026-03-09 02:03:14.828254	2026-03-09 02:03:14.828254	2026-03-09 20:58:15.079946	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1034	\N	\N	Lote 14 liberado para TKCF Siderurguaca. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	16911251052	2026-02-23 20:52:11.754618	2026-02-23 20:52:11.754618	2026-02-23 21:25:06.783733	\N	14	\N	\N	\N	\N	\N	117	117	pago	2026-02-23 21:23:56.968954+00	152.00	dd11cf37-cf03-4d05-81cf-ea05cd8b4f73	\N	2026-02-23 21:25:06.783733+00	credit_card	1	2026-02-23 21:27:37.531089+00	\N
1036	\N	\N	Lote 15 liberado para RELEGERE - ASSESSORIA E CONSULTORIA LTDA. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	29930511059	2026-02-24 00:32:15.181034	2026-02-24 00:32:15.181034	2026-02-24 00:32:15.181034	\N	15	\N	\N	\N	\N	\N	100	100	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1042	\N	\N	Lote 18 liberado para teste lead comiss e contrat. Inclui 2 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	91510815040	2026-03-03 14:37:15.306303	2026-03-03 14:37:15.306303	2026-03-03 14:47:14.606391	\N	18	\N	\N	\N	\N	\N	127	127	pago	2026-03-03 14:38:37.116556+00	55.00	d08a1243-6124-4d39-be34-cc1a2943364a	\N	2026-03-03 14:47:14.606391+00	boleto	1	2026-03-03 14:48:28.029142+00	\N
1038	104	5	Lote 7 liberado para Empresa CM onlinwe. Inclui 2 funcionário(s) elegíveis.	completo	cancelado	\N	2026-02-27 05:43:16.178477	2026-02-27 05:43:16.178477	2026-03-09 22:38:21.733618	\N	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1037	120	17	Lote 1 liberado para dfsgsG SDFsfes. Inclui 1 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-25 18:25:07.383889	2026-02-25 18:25:07.383889	2026-02-25 20:08:22.576715	\N	1	\N	\N	\N	\N	\N	\N	\N	pago	2026-02-25 18:39:25.667141+00	12.50	44cde3ce-0f4f-4c38-9f1a-adb4ded1ac99	\N	2026-02-25 20:08:22.576715+00	boleto	1	2026-02-25 20:10:38.629986+00	\N
1044	104	5	Lote 8 liberado para Empresa CM onlinwe. Inclui 3 funcionário(s) elegíveis.	completo	ativo	\N	2026-03-10 22:58:55.770127	2026-03-10 22:58:55.770127	2026-03-10 22:58:55.770127	\N	8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1039	\N	\N	Lote 16 liberado para Tsete apos clean. Inclui 3 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	concluido	05248635047	2026-02-27 12:33:19.898178	2026-02-27 12:33:19.898178	2026-02-27 13:12:16.205921	\N	16	\N	\N	\N	\N	\N	121	121	aguardando_cobranca	2026-02-27 13:12:16.205921+00	\N	\N	\N	\N	\N	\N	\N	\N
1040	123	18	Lote 1 liberado para emeoa ruao io. Inclui 3 funcionário(s) elegíveis.	completo	concluido	\N	2026-02-27 13:23:43.884143	2026-02-27 13:23:43.884143	2026-02-27 13:27:27.358696	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1041	\N	\N	Lote 17 liberado para fdfgadfgaadffg. Inclui 1 funcionário(s) elegíveis vinculados diretamente à entidade.	completo	ativo	09777228996	2026-03-03 13:22:21.92372	2026-03-03 13:22:21.92372	2026-03-03 13:22:21.92372	\N	17	\N	\N	\N	\N	\N	125	125	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.avaliacoes (id, funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id, inativada_em, motivo_inativacao, concluida_em) FROM stdin;
10083	09777228996	2026-03-03 13:22:22.569	\N	iniciada	1	2026-03-03 13:22:21.92372	2026-03-03 13:22:21.92372	1041	\N	\N	\N
10048	26064999055	2026-02-16 18:28:44.087	2026-02-16 18:38:20.790429	concluida	1	2026-02-16 18:28:42.879711	2026-02-16 18:38:20.790429	1024	\N	\N	\N
10014	85804194097	2026-02-11 01:53:05.501	2026-02-11 01:57:55.987926	concluida	1	2026-02-11 01:53:04.39101	2026-02-11 01:57:55.987926	1009	\N	\N	\N
10005	36381045086	2026-02-10 12:10:37.509	\N	iniciada	1	2026-02-10 12:10:36.722222	2026-02-10 12:10:36.722222	1004	\N	\N	\N
10053	38409635089	2026-02-17 13:00:21.275	\N	inativada	1	2026-02-17 13:00:20.583082	2026-02-17 13:06:24.563064	1026	2026-02-17 13:07:13.971328+00	dgdsgdgdgdgdgdgd	\N
10015	32911756037	2026-02-11 01:53:05.501	2026-02-11 02:01:46.606336	concluida	1	2026-02-11 01:53:04.39101	2026-02-11 02:01:46.606336	1009	\N	\N	\N
10008	77109022005	2026-02-10 12:33:47.269	\N	iniciada	1	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	1006	\N	\N	\N
10009	17285659010	2026-02-10 12:33:47.269	\N	iniciada	1	2026-02-10 12:33:46.635319	2026-02-10 12:33:46.635319	1006	\N	\N	\N
10052	82773181034	2026-02-17 13:00:21.275	2026-02-17 13:08:36.231	concluida	1	2026-02-17 13:00:20.583082	2026-02-17 13:08:36.231	1026	\N	\N	2026-02-17 13:08:36.231
10029	34624832000	2026-02-12 23:56:29.87	\N	inativada	1	2026-02-12 23:56:29.222814	2026-02-12 23:56:29.222814	1015	2026-02-17 00:15:23.712643+00	sdgdsdsgdsdsggds	\N
10004	49651696036	2026-02-10 12:10:37.509	\N	iniciada	1	2026-02-10 12:10:36.722222	2026-02-11 23:59:11.353752	1004	\N	\N	\N
10050	03757372000	2026-02-17 00:20:09.981	\N	inativada	1	2026-02-17 00:20:09.341759	2026-02-17 00:20:09.341759	1025	2026-02-17 00:21:25.166916+00	dgdgsdgsdggsdsgd	\N
10017	73922219063	2026-02-12 12:24:07.632	2026-02-12 12:30:53.219351	concluida	1	2026-02-12 12:24:06.406657	2026-02-12 12:30:53.219351	1010	\N	\N	\N
10016	03175612008	2026-02-12 12:24:07.632	2026-02-12 12:31:15.029557	concluida	1	2026-02-12 12:24:06.406657	2026-02-12 12:31:15.029557	1010	\N	\N	\N
10051	34624832000	2026-02-17 00:20:09.981	\N	inativada	1	2026-02-17 00:20:09.341759	2026-02-17 00:20:09.341759	1025	2026-02-17 00:21:47.762539+00	asfdfadfasasfas	\N
10049	60463729099	2026-02-17 00:20:09.981	2026-02-17 00:44:15.513	concluida	1	2026-02-17 00:20:09.341759	2026-02-17 00:44:15.513	1025	\N	\N	2026-02-17 00:44:15.513
10018	42447121008	2026-02-12 19:56:00.062	\N	inativada	1	2026-02-12 19:55:58.791717	2026-02-12 19:55:58.791717	1011	2026-02-12 20:13:24.870893+00	dsdsfsdffdfdfd	\N
10019	89487826068	2026-02-12 19:56:00.062	\N	em_andamento	1	2026-02-12 19:55:58.791717	2026-02-12 19:55:58.791717	1011	\N	\N	\N
10054	22703336080	2026-02-17 13:00:21.275	\N	inativada	1	2026-02-17 13:00:20.583082	2026-02-17 13:00:20.583082	1026	2026-02-17 13:01:54.904018+00	tewet dsdssdgds	\N
10023	34624832000	2026-02-12 21:09:12.789	\N	iniciada	1	2026-02-12 21:09:12.071042	2026-02-12 21:09:12.071042	1013	\N	\N	\N
10025	36381045086	2026-02-12 21:09:12.789	\N	iniciada	1	2026-02-12 21:09:12.071042	2026-02-12 21:09:12.071042	1013	\N	\N	\N
10024	49651696036	2026-02-12 21:09:12.789	\N	inativada	1	2026-02-12 21:09:12.071042	2026-02-12 21:09:12.071042	1013	2026-02-12 21:09:33.696108+00	sddfsdd fdfdsdfsd	\N
10057	91275973000	2026-02-17 16:17:23.523	\N	inativada	1	2026-02-17 16:17:22.406893	2026-02-17 16:17:22.406893	1027	2026-02-17 16:18:45.713926+00	ljlkjlklklkjlk	\N
10022	19778990050	2026-02-12 21:09:12.789	\N	inativada	1	2026-02-12 21:09:12.071042	2026-02-12 21:33:13.087921	1013	2026-02-12 21:44:15.677809+00	Funcionário inativado pela entidade	\N
10056	59557041080	2026-02-17 16:17:23.523	\N	inativada	1	2026-02-17 16:17:22.406893	2026-02-17 16:20:12.905632	1027	2026-02-17 16:21:39.699496+00	uiouiouoi oiuoiuoiuio	\N
10055	28917134009	2026-02-17 16:17:23.523	2026-02-17 16:23:23.636	concluida	1	2026-02-17 16:17:22.406893	2026-02-17 16:23:23.636	1027	\N	\N	2026-02-17 16:23:23.636
10010	49651696036	2026-02-10 14:13:19.435	2026-02-10 16:07:57.010649	concluida	1	2026-02-10 14:13:18.784349	2026-02-10 16:07:57.010649	1007	\N	\N	\N
10026	34624832000	2026-02-12 22:06:00.291	\N	inativada	1	2026-02-12 22:05:59.608885	2026-02-12 22:05:59.608885	1014	2026-02-12 23:46:44.657541+00	safsafasafaf	\N
10028	36381045086	2026-02-12 22:06:00.291	\N	inativada	1	2026-02-12 22:05:59.608885	2026-02-12 22:05:59.608885	1014	2026-02-12 23:46:59.346141+00	ssfasafafsasfasafs	\N
10011	36381045086	2026-02-10 14:13:19.435	2026-02-10 16:29:35.288036	concluida	1	2026-02-10 14:13:18.784349	2026-02-10 16:29:35.288036	1007	\N	\N	\N
10006	03175612008	2026-02-10 12:21:49.087	2026-02-10 16:39:11.716723	concluida	1	2026-02-10 12:21:47.979581	2026-02-10 16:39:11.716723	1005	\N	\N	\N
10007	73922219063	2026-02-10 12:21:49.087	2026-02-10 16:53:16.783516	concluida	1	2026-02-10 12:21:47.979581	2026-02-10 16:53:16.783516	1005	\N	\N	\N
10058	66844689004	2026-02-17 19:31:19.93	2026-02-17 16:32:34.205	concluida	1	2026-02-17 19:31:13.767633	2026-02-17 16:32:34.205	1028	\N	\N	2026-02-17 16:32:34.205
10027	40473159074	2026-02-12 22:06:00.291	2026-02-12 23:52:18.708343	inativada	1	2026-02-12 22:05:59.608885	2026-02-12 23:52:18.708343	1014	2026-02-12 23:53:25.797376+00	Funcionário inativado pela entidade	\N
10013	18597536047	2026-02-11 01:05:34.866	2026-02-11 01:12:17.053789	concluida	1	2026-02-11 01:05:34.180476	2026-02-11 01:12:17.053789	1008	\N	\N	\N
10012	65648556055	2026-02-11 01:05:34.866	2026-02-11 01:14:43.757296	concluida	1	2026-02-11 01:05:34.180476	2026-02-11 01:14:43.757296	1008	\N	\N	\N
10031	98823740002	2026-02-13 02:29:33.593	\N	iniciada	1	2026-02-13 02:29:32.907947	2026-02-13 02:29:32.907947	1016	\N	\N	\N
10061	88931335040	2026-02-17 19:34:15.778	2026-02-17 16:35:22.123	concluida	1	2026-02-17 19:34:09.774335	2026-02-17 16:35:22.123	1029	\N	\N	2026-02-17 16:35:22.123
10060	34624832000	2026-02-17 19:34:15.778	\N	inativada	1	2026-02-17 19:34:09.774335	2026-02-17 19:34:09.774335	1029	2026-02-17 21:34:54.134093+00	gdsdgdsgdsdsgg	\N
10030	05153743004	2026-02-13 02:29:33.593	2026-02-13 02:39:45.154975	concluida	1	2026-02-13 02:29:32.907947	2026-02-13 02:39:45.154975	1016	\N	\N	\N
10032	62745664069	2026-02-13 02:29:33.593	2026-02-13 02:46:44.678623	concluida	1	2026-02-13 02:29:32.907947	2026-02-13 02:46:44.678623	1016	\N	\N	\N
10033	68889393084	2026-02-13 02:53:28.407	\N	iniciada	1	2026-02-13 02:53:27.28168	2026-02-13 02:53:27.28168	1017	\N	\N	\N
10034	41172398054	2026-02-13 02:53:28.407	\N	iniciada	1	2026-02-13 02:53:27.28168	2026-02-13 02:53:27.28168	1017	\N	\N	\N
10059	03757372000	2026-02-17 19:34:15.778	\N	inativada	1	2026-02-17 19:34:09.774335	2026-02-17 19:34:09.774335	1029	2026-02-17 21:35:03.243449+00	gdsdgsgsgdssdgds	\N
10062	03757372000	2026-02-18 02:19:43.494	2026-02-17 23:20:56.205	concluida	1	2026-02-18 02:19:37.269912	2026-02-17 23:20:56.205	1030	\N	\N	2026-02-17 23:20:56.205
10035	77093511074	2026-02-13 12:52:22.751	2026-02-13 13:01:13.834939	concluida	1	2026-02-13 12:52:21.512364	2026-02-13 13:01:13.834939	1018	\N	\N	\N
10020	03175612008	2026-02-12 20:18:19.131	\N	inativada	1	2026-02-12 20:18:17.914788	2026-02-12 20:18:17.914788	1012	2026-02-12 20:18:46.331071+00	ddfsdsfsdffsdfds	\N
10036	03175612008	2026-02-13 12:52:22.751	\N	inativada	1	2026-02-13 12:52:21.512364	2026-02-13 12:52:21.512364	1018	\N	\N	\N
10021	73922219063	2026-02-12 20:18:19.131	\N	inativada	1	2026-02-12 20:18:17.914788	2026-02-13 12:49:32.813495	1012	\N	\N	\N
10037	73922219063	2026-02-13 12:52:22.751	\N	inativada	1	2026-02-13 12:52:21.512364	2026-02-13 12:52:21.512364	1018	\N	\N	\N
10063	34624832000	2026-02-18 02:19:43.494	\N	inativada	1	2026-02-18 02:19:37.269912	2026-02-18 02:19:37.269912	1030	2026-02-18 02:21:14.537931+00	fasfsaafsafsa	\N
10038	29371145048	2026-02-16 14:23:19.034	2026-02-16 14:36:28.133277	concluida	1	2026-02-16 14:23:17.887271	2026-02-16 14:36:28.133277	1019	\N	\N	\N
10064	17503742003	2026-02-18 02:39:05.176	2026-02-17 23:40:26.189	concluida	1	2026-02-18 02:38:58.852216	2026-02-17 23:40:26.189	1031	\N	\N	2026-02-17 23:40:26.189
10040	79466202090	2026-02-16 14:41:08.603	\N	inativada	1	2026-02-16 14:41:07.474115	2026-02-16 14:41:07.474115	1020	2026-02-16 14:43:32.278429+00	ssdsdsdsdsdsdsdsdsdsdsdsd	\N
10041	79466202090	2026-02-16 14:44:00.177	\N	iniciada	1	2026-02-16 14:43:59.088439	2026-02-16 14:43:59.088439	1021	\N	\N	\N
10042	79466202090	2026-02-16 14:54:09.751	\N	iniciada	1	2026-02-16 14:54:08.66088	2026-02-16 14:54:08.66088	1022	\N	\N	\N
10045	74984014016	2026-02-16 15:53:21.903	\N	iniciada	1	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	1023	\N	\N	\N
10065	90119869039	2026-02-18 03:04:29.615	2026-02-18 00:05:39.882	concluida	1	2026-02-18 03:04:23.317314	2026-02-18 00:05:39.882	1032	\N	\N	2026-02-18 00:05:39.882
10044	79466202090	2026-02-16 15:53:21.903	\N	inativada	1	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	1023	2026-02-16 15:54:03.490552+00	vfasffasfasfas	\N
10046	86230028069	2026-02-16 15:53:21.903	\N	inativada	1	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	1023	2026-02-16 15:54:21.469199+00	safsfasafsafasfasf	\N
10043	96309540017	2026-02-16 14:54:09.751	\N	inativada	1	2026-02-16 14:54:08.66088	2026-02-16 14:54:08.66088	1022	\N	\N	\N
10047	96309540017	2026-02-16 15:53:21.903	\N	inativada	1	2026-02-16 15:53:20.61145	2026-02-16 15:53:20.61145	1023	2026-02-16 15:54:38.699959+00	safsafsafsasf	\N
10066	18237959000	2026-02-18 11:07:16.998	2026-02-18 08:08:36.588	concluida	1	2026-02-18 11:07:07.504048	2026-02-18 08:08:36.588	1033	\N	\N	2026-02-18 08:08:36.588
10067	31745655026	2026-02-23 20:52:12.417	\N	inativada	1	2026-02-23 20:52:11.754618	2026-02-23 20:52:11.754618	1034	2026-02-23 20:56:59.696394+00	dgdgsdsgsdgd	\N
10068	34232299009	2026-02-23 20:52:12.417	2026-02-23 21:10:05.249	concluida	1	2026-02-23 20:52:11.754618	2026-02-23 21:10:05.249	1034	\N	\N	2026-02-23 21:10:05.249
10070	66930813044	2026-02-23 23:08:35.566	\N	inativada	1	2026-02-23 23:08:34.460644	2026-02-23 23:08:34.460644	1035	2026-02-23 23:11:02.215988+00	xvcvxcxvcvcvc	\N
10069	35923473062	2026-02-23 23:08:35.566	2026-02-23 23:15:04.326	concluida	1	2026-02-23 23:08:34.460644	2026-02-23 23:15:04.326	1035	\N	\N	2026-02-23 23:15:04.326
10071	29054003073	2026-02-23 23:08:35.566	2026-02-23 23:16:03.236	concluida	1	2026-02-23 23:08:34.460644	2026-02-23 23:16:03.236	1035	\N	\N	2026-02-23 23:16:03.236
10073	75415228055	2026-02-24 00:32:15.828	\N	em_andamento	1	2026-02-24 00:32:15.181034	2026-02-24 00:32:15.181034	1036	\N	\N	\N
10074	98970247009	2026-02-25 18:25:08.494	2026-02-25 18:34:26.444	concluida	1	2026-02-25 18:25:07.383889	2026-02-25 18:34:26.444	1037	\N	\N	2026-02-25 18:34:26.444
10084	92544157070	2026-03-03 14:37:42.929	2026-03-03 11:38:10.54	concluida	1	2026-03-03 14:37:15.306303	2026-03-03 11:38:10.54	1042	\N	\N	2026-03-03 11:38:10.54
10085	83171190095	2026-03-03 14:37:42.929	\N	inativada	1	2026-03-03 14:37:15.306303	2026-03-03 14:37:15.306303	1042	2026-03-03 14:38:20.886828+00	ggssdds sgddgsdg	\N
10077	78639856095	2026-02-27 12:33:38.48	2026-02-27 10:01:25.154	concluida	1	2026-02-27 12:33:19.898178	2026-02-27 10:01:25.154	1039	\N	\N	2026-02-27 10:01:25.154
10079	39034263002	2026-02-27 12:33:38.48	\N	inativada	1	2026-02-27 12:33:19.898178	2026-02-27 12:33:19.898178	1039	2026-02-27 13:11:25.534164+00	bfffbbxcbsgdsd	\N
10078	94617882073	2026-02-27 12:33:38.48	2026-02-27 10:12:13.218	concluida	1	2026-02-27 12:33:19.898178	2026-02-27 10:12:13.218	1039	\N	\N	2026-02-27 10:12:13.218
10080	99977387052	2026-02-27 13:24:02.514	2026-02-27 10:24:56.167	concluida	1	2026-02-27 13:23:43.884143	2026-02-27 10:24:56.167	1040	\N	\N	2026-02-27 10:24:56.167
10086	75377605004	2026-03-09 02:03:15.962	\N	inativada	1	2026-03-09 02:03:14.828254	2026-03-09 02:03:14.828254	1043	2026-03-09 20:57:19.726435+00	gdsgdsgdsgdsdg	\N
10087	11110827075	2026-03-09 02:03:15.962	\N	inativada	1	2026-03-09 02:03:14.828254	2026-03-09 02:03:14.828254	1043	2026-03-09 20:57:36.013224+00	dsdgsgdsdgdgdggd	\N
10088	19275874093	2026-03-09 02:03:15.962	\N	inativada	1	2026-03-09 02:03:14.828254	2026-03-09 02:03:14.828254	1043	2026-03-09 20:57:54.996159+00	gdsdgssddsgd	\N
10082	41119471079	2026-02-27 13:24:02.514	2026-02-27 10:27:24.799	concluida	1	2026-02-27 13:23:43.884143	2026-02-27 10:27:24.799	1040	\N	\N	2026-02-27 10:27:24.799
10081	45102493060	2026-02-27 13:24:02.514	\N	inativada	1	2026-02-27 13:23:43.884143	2026-02-27 13:23:43.884143	1040	2026-02-27 13:27:27.358696+00	ssaasffsafasfasafsfas	\N
10089	32586030060	2026-03-09 02:03:15.962	\N	inativada	1	2026-03-09 02:03:14.828254	2026-03-09 02:03:14.828254	1043	2026-03-09 20:58:12.609503+00	gdsdgsdsggdsdsgdsg	\N
10072	34624832000	2026-02-24 00:32:15.828	2026-02-27 12:33:31.802	concluida	1	2026-02-24 00:32:15.181034	2026-02-27 12:33:31.802	1036	\N	\N	2026-02-27 12:33:31.802
10076	29371145048	2026-02-27 05:43:34.678	\N	inativada	1	2026-02-27 05:43:16.178477	2026-02-27 05:43:16.178477	1038	2026-03-09 22:37:59.302547+00	dsgdssdsdsdgsdgdg	\N
10039	97687700074	2026-02-16 14:23:19.034	\N	inativada	1	2026-02-16 14:23:17.887271	2026-02-16 14:23:17.887271	1019	2026-02-16 14:24:21.718138+00	tdgsdgsgdssdgdg	\N
10075	97687700074	2026-02-27 05:43:34.678	\N	inativada	1	2026-02-27 05:43:16.178477	2026-02-27 05:43:16.178477	1038	2026-03-09 22:38:19.167449+00	ddsgsdgdgdgdg	\N
10090	80943363071	2026-03-10 22:58:56.941	\N	iniciada	1	2026-03-10 22:58:55.770127	2026-03-10 22:58:55.770127	1044	\N	\N	\N
10091	17129287080	2026-03-10 22:58:56.941	\N	iniciada	1	2026-03-10 22:58:55.770127	2026-03-10 22:58:55.770127	1044	\N	\N	\N
10092	42212215002	2026-03-10 22:58:56.941	\N	iniciada	1	2026-03-10 22:58:55.770127	2026-03-10 22:58:55.770127	1044	\N	\N	\N
\.


--
-- Data for Name: analise_estatistica; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analise_estatistica (id, avaliacao_id, grupo, score_original, score_ajustado, anomalia_detectada, tipo_anomalia, recomendacao, created_at) FROM stdin;
\.


--
-- Data for Name: planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.planos (id, tipo, nome, descricao, valor_por_funcionario, preco, limite_funcionarios, ativo, created_at, updated_at, caracteristicas) FROM stdin;
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, pagamento_confirmado, numero_funcionarios_estimado, plano_id, data_primeiro_pagamento, data_liberacao_login, contrato_aceito, tipo, razao_social, idioma_preferencial, nome_fantasia, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM stdin;
104	RLJ COMERCIAL EXPORTADORA LTDA	09110380000191	\N	ewrwer@fafa.com	(45) 64897-9888	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	tani akk	04703084945	\N	4dffadf@dsfdf.com	(45) 64487-9889	\N	\N	\N	pendente	\N	\N	t	2026-02-10 04:21:11.359503	2026-02-10 04:21:11.359503	\N	\N	f	\N	\N	\N	2026-02-10 04:21:23.526732	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
107	Clinica Final Test	97841843000152	\N	clinfintest@sdfsdf.com	(45) 46556-4654	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Gestor Clin Final test	64411953056	\N	gesges@dsgds.com	(45) 46546-5456	\N	\N	\N	pendente	\N	\N	t	2026-02-11 01:47:49.407701	2026-02-11 01:47:49.407701	\N	\N	f	\N	\N	\N	2026-02-11 01:48:15.247079	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
108	teste Gabriela e Arthur Adega Ltda	27706384000119	\N	posvenda@gabrielaearthuradegaltda.com.br	(41) 99540-1309	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	TESTE	87748070997	\N	DFKGHDFJKHG@GMAIL.COM	(67) 98411-1846	\N	\N	\N	pendente	\N	\N	t	2026-02-12 12:10:50.155945	2026-02-12 12:10:50.155945	\N	\N	f	\N	\N	\N	2026-02-12 12:12:45.410064	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
109	Pos Correc Dep 1202	26698929000120	\N	ffaaf@afsa.coj	(45) 46546-5465	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	amdna Nexus	03178539026	\N	fafa@safsf.com	(66) 46546-5465	\N	\N	\N	pendente	\N	\N	t	2026-02-12 18:00:29.646875	2026-02-12 18:00:29.646875	\N	\N	f	\N	\N	\N	2026-02-12 18:00:41.323951	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
111	Clinica Final	79831824000163	\N	ckicniafinal@fddf.com	(97) 89798-9899	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Tania Krina	58455720026	\N	gercli@dffd.com	(65) 46545-6465	\N	\N	\N	pendente	\N	\N	t	2026-02-13 02:49:52.706347	2026-02-13 02:49:52.706347	\N	\N	f	\N	\N	\N	2026-02-13 02:50:05.287153	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
112	TESTE 16.02	41677495000175	\N	ADFJGHJDKFHSG@GMAIL.COM	(16) 02684-06840	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	TESTE 16.02	70873742060	\N	DFHJKGHJDFJH@GMAIL.COM	(40) 86046-0468	\N	\N	\N	pendente	\N	\N	t	2026-02-16 14:26:34.960724	2026-02-16 14:26:34.960724	\N	\N	f	\N	\N	\N	2026-02-16 14:27:17.424215	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
113	Clinex MedOCup	04228123000135	\N	saff@affas.com	(65) 46665-4654	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	Amanda Clinex	62985815029	\N	fdfds@aas.com	(44) 54646-5466	\N	\N	\N	pendente	\N	\N	t	2026-02-16 18:25:14.814272	2026-02-16 18:25:14.814272	\N	\N	f	\N	\N	\N	2026-02-16 18:25:34.525733	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
115	Clinica End	60772535000102	\N	fasasf@fafa.com	(48) 97987-9879	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	Aagpo pdaiopi	31777317053	\N	ffdfsd@kokol.com	(48) 79844-6466	\N	\N	\N	pendente	\N	\N	t	2026-02-17 16:13:52.657543	2026-02-17 16:13:52.657543	\N	\N	f	\N	\N	\N	2026-02-17 16:14:06.554149	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
118	clinex 2026 ltda	91280455000163	\N	rwrwe@sdfdsf.cop	(97) 97987-9745	Rua Antônio Bianchetti, 90	Curitiba	PR	81630-180	Tania kC Fila	99328531004	\N	sfdsf@dd.pom	(87) 98446-4646	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/91280455000163/cartao_cnpj-1771886664587-c7ohkw.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/91280455000163/contrato_social-1771886664933-a7lavo.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/91280455000163/doc_identificacao-1771886666687-z9vezj.pdf	pendente	\N	\N	t	2026-02-23 22:44:27.196558	2026-02-23 22:44:27.196558	\N	\N	f	\N	\N	\N	2026-02-23 22:44:40.601816	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
120	SDFSDFSDFSDFSD	29060003000100	\N	sdfSFGDFGH@GMAIL.COM	(41) 00002-2666	Barão do Serro Azul, 198 - Centro	3946	PR	80020-180	TESTESTESTES TESTESTESTSETS	79432901009	\N	FDKHKLAFJG@GMAIL.COM	(41) 44444-44444	https://s3.us-east-005.backblazeb2.com/cad-qwork/29060003000100/cartao_cnpj-1772042275667-ayd1dp.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/29060003000100/contrato_social-1772042276095-l730bd.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/29060003000100/doc_identificacao-1772042276237-4805qr.pdf	pendente	\N	\N	t	2026-02-25 17:57:56.945775	2026-02-25 17:57:56.945775	\N	\N	f	\N	\N	\N	2026-02-25 17:58:13.19339	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
122	clinica medo cpu pos clean	83975727000111	\N	dsfsdf@fa.com	(78) 46546-4666	R. Waldemar Kost, 1130	Curitiba	PR	81630-180	gestor clin pioso cleln	25070037072	\N	sdfsdf@dsfdsf.co	(56) 78798-7999	/uploads/cadastros/83975727000111/cartao_cnpj_1772198019393.pdf	/uploads/cadastros/83975727000111/contrato_social_1772198019396.pdf	/uploads/cadastros/83975727000111/doc_identificacao_1772198019398.pdf	pendente	\N	\N	t	2026-02-27 13:13:20.969504	2026-02-27 13:13:20.969504	\N	\N	f	\N	\N	\N	2026-02-27 13:13:29.761373	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
123	clinai pos clena	43315703000111	\N	fafa@dsffsd.cd	(87) 97464-6546	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	eaopi adsfpipoi po 	38908580077	\N	dsfsfd@faas.coj	(49) 87984-6549	/uploads/cadastros/43315703000111/cartao_cnpj_1772198225135.pdf	/uploads/cadastros/43315703000111/contrato_social_1772198225139.pdf	/uploads/cadastros/43315703000111/doc_identificacao_1772198225142.pdf	pendente	\N	\N	t	2026-02-27 13:16:46.724486	2026-02-27 13:16:46.724486	\N	\N	f	\N	\N	\N	2026-02-27 13:16:55.964246	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
119	oipo poi po	99179883000106	\N	dfssdf@ffdsds.co	(45) 46546-4666	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	fasfasasf fasfaf	87251739011	\N	fdfdsf@sdffds.com	(56) 46546-5465	https://s3.us-east-005.backblazeb2.com/cad-qwork/99179883000106/cartao_cnpj-1772035205966-17v53g.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/99179883000106/contrato_social-1772035206450-nvj0ng.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/99179883000106/doc_identificacao-1772035206495-95kjbf.pdf	pendente	\N	\N	t	2026-02-25 16:00:07.203612	2026-03-03 12:29:26.082974	\N	\N	f	\N	\N	\N	2026-02-25 16:00:20.147	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
128	tste por refact	95520984000148	\N	sdfsfd@dfdfs.cou	(89) 79879-8798	Rua Antônio Bianchetti, 90	São José dos Pinhais	PR	83065-370	gestor clini pos refa	35962136063	\N	fafds@dffds.con	(46) 79879-8798	https://s3.us-east-005.backblazeb2.com/cad-qwork/95520984000148/cartao_cnpj-1772932195628-mtqev1.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/95520984000148/contrato_social-1772932196173-borzar.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/95520984000148/doc_identificacao-1772932196458-y0zhlh.pdf	pendente	\N	\N	t	2026-03-08 01:09:57.261103	2026-03-08 01:09:57.261103	\N	\N	f	\N	\N	\N	2026-03-08 01:10:16.295277	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
129	MedCtba	22765627000176	\N	medctba@med.com	(45) 99241-5225	Rua Nariamo Torres 74	Ctba	PR	80000-000	Leo JJ MedCwb	69558061069	Gestor	leobjj@med.com	(41) 99526-8852	https://s3.us-east-005.backblazeb2.com/cad-qwork/22765627000176/cartao_cnpj-1773021148655-px1yad.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/22765627000176/contrato_social-1773021149135-26q8wh.pdf	https://s3.us-east-005.backblazeb2.com/cad-qwork/22765627000176/doc_identificacao-1773021149349-8ilyot.pdf	pendente	\N	\N	t	2026-03-09 01:52:29.863499	2026-03-09 01:52:29.863499	\N	\N	f	\N	\N	\N	2026-03-09 01:53:13.908009	f	clinica	\N	pt_BR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos (id, plano_id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, valor_personalizado, payment_link_expiracao, link_enviado_em, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador) FROM stdin;
1	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-09 21:03:01.339161	\N	\N	177.146.166.16	2026-02-09 21:03:12.604239	\N	\N	\N	\N	\N	\N	\N	\N	100	entidade
2	\N	\N	\N	aguardando_aceite	f	f	\N	2026-02-10 03:42:52.038122	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	102	clinica
4	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-10 04:21:11.359503	\N	\N	177.146.166.16	2026-02-10 04:21:22.590102	\N	\N	\N	\N	\N	\N	\N	\N	104	clinica
5	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-10 12:30:34.697287	\N	\N	177.146.166.16	2026-02-10 12:30:58.982764	\N	\N	\N	\N	\N	\N	\N	\N	105	entidade
6	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-11 01:02:47.812895	\N	\N	177.146.166.16	2026-02-11 01:02:57.813307	\N	\N	\N	\N	\N	\N	\N	\N	106	entidade
7	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-11 01:47:49.407701	\N	\N	177.146.166.16	2026-02-11 01:48:13.493208	\N	\N	\N	\N	\N	\N	\N	\N	107	clinica
8	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-12 12:10:50.155945	\N	\N	189.112.122.137	2026-02-12 12:12:43.594485	\N	\N	\N	\N	\N	\N	\N	\N	108	clinica
9	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-12 18:00:29.646875	\N	\N	177.146.166.16	2026-02-12 18:00:39.591561	\N	\N	\N	\N	\N	\N	\N	\N	109	clinica
10	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-13 02:25:16.382278	\N	\N	177.146.166.16	2026-02-13 02:25:41.643379	\N	\N	\N	\N	\N	\N	\N	\N	110	entidade
11	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-13 02:49:52.706347	\N	\N	177.146.166.16	2026-02-13 02:50:03.513543	\N	\N	\N	\N	\N	\N	\N	\N	111	clinica
12	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-16 14:26:34.960724	\N	\N	189.112.122.137	2026-02-16 14:27:15.716292	\N	\N	\N	\N	\N	\N	\N	\N	112	clinica
13	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-16 18:25:14.814272	\N	\N	177.146.166.16	2026-02-16 18:25:32.798843	\N	\N	\N	\N	\N	\N	\N	\N	113	clinica
14	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-17 12:57:34.69226	\N	\N	177.146.164.76	2026-02-17 12:57:45.106264	\N	\N	\N	\N	\N	\N	\N	\N	114	entidade
15	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-17 16:13:52.657543	\N	\N	177.146.164.76	2026-02-17 16:14:04.840697	\N	\N	\N	\N	\N	\N	\N	\N	115	clinica
16	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-23 04:05:23.806693	\N	\N	::1	2026-02-23 04:05:36.133596	\N	\N	\N	\N	\N	\N	\N	\N	116	entidade
17	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-23 20:47:59.738044	\N	\N	201.159.185.249	2026-02-23 20:49:17.209284	\N	\N	\N	\N	\N	\N	\N	\N	117	entidade
18	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-23 22:44:27.196558	\N	\N	201.159.185.223	2026-02-23 22:44:38.954518	\N	\N	\N	\N	\N	\N	\N	\N	118	clinica
19	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-25 16:00:07.203612	\N	\N	201.159.185.187	2026-02-25 16:00:18.483649	\N	\N	\N	\N	\N	\N	\N	\N	119	clinica
20	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-25 17:57:56.945775	\N	\N	189.112.122.137	2026-02-25 17:58:11.549911	\N	\N	\N	\N	\N	\N	\N	\N	120	clinica
21	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-27 11:44:56.621321	\N	\N	::1	2026-02-27 11:45:21.008407	\N	\N	\N	\N	\N	\N	\N	\N	121	entidade
22	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-27 13:13:20.969504	\N	\N	::1	2026-02-27 13:13:29.361564	\N	\N	\N	\N	\N	\N	\N	\N	122	clinica
23	\N	\N	\N	aguardando_aceite	t	f	\N	2026-02-27 13:16:46.724486	\N	\N	::1	2026-02-27 13:16:55.610772	\N	\N	\N	\N	\N	\N	\N	\N	123	clinica
24	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-03 02:58:53.093874	\N	\N	::1	2026-03-03 02:59:07.833919	\N	\N	\N	\N	\N	\N	\N	\N	124	entidade
25	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-03 13:11:08.559559	\N	\N	189.112.122.137	2026-03-03 13:11:38.272832	\N	\N	\N	\N	\N	\N	\N	\N	125	entidade
26	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-03 13:46:50.855233	\N	\N	::1	2026-03-03 13:47:03.567491	\N	\N	\N	\N	\N	\N	\N	\N	126	entidade
27	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-03 14:06:51.937147	\N	\N	::1	2026-03-03 14:07:02.296262	\N	\N	\N	\N	\N	\N	\N	\N	127	entidade
28	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-08 01:09:57.261103	\N	\N	152.250.78.77	2026-03-08 01:10:14.60792	\N	\N	\N	\N	\N	\N	\N	\N	128	clinica
29	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-09 01:52:29.863499	\N	\N	152.250.78.77	2026-03-09 01:53:12.208434	\N	\N	\N	\N	\N	\N	\N	\N	129	clinica
30	\N	\N	\N	aguardando_aceite	t	f	\N	2026-03-10 11:52:53.659539	\N	\N	189.112.122.137	2026-03-10 11:53:56.389917	\N	\N	\N	\N	\N	\N	\N	\N	130	entidade
\.


--
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pagamentos (id, valor, metodo, status, plataforma_id, plataforma_nome, dados_adicionais, data_pagamento, data_confirmacao, comprovante_path, observacoes, criado_em, atualizado_em, numero_parcelas, recibo_url, recibo_numero, detalhes_parcelas, numero_funcionarios, valor_por_funcionario, contrato_id, idempotency_key, external_transaction_id, provider_event_id, entidade_id, clinica_id, tomador_id, origem_pagamento, asaas_payment_id, asaas_customer_id, asaas_payment_url, asaas_boleto_url, asaas_invoice_url, asaas_pix_qrcode, asaas_pix_qrcode_image, asaas_net_value, asaas_due_date) FROM stdin;
1	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 00:25:02.867821	2026-02-17 00:25:02.867821	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	15.55	pix	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:06:27.531907	2026-02-17 01:06:27.531907	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	15.55	pix	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:06:38.026259	2026-02-17 01:06:38.026259	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:06:49.009749	2026-02-17 01:06:49.009749	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	15.55	pix	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:07:19.940954	2026-02-17 01:07:19.940954	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:07:27.542895	2026-02-17 01:07:27.542895	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:10:02.840536	2026-02-17 01:10:02.840536	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
8	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:10:26.072789	2026-02-17 01:10:26.072789	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 01:16:15.842129	2026-02-17 01:16:15.842129	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
10	15.55	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 02:57:36.112062	2026-02-17 02:57:36.112062	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
11	43.50	credit_card	erro	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 13:55:18.003297	2026-02-17 13:55:18.003297	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	114	\N	\N	asaas	\N	\N	\N	\N	\N	\N	\N	\N	\N
12	43.50	credit_card	pago	\N	Asaas	{"netValue": 42.15, "invoiceUrl": "https://sandbox.asaas.com/i/7jq6wxnea8s5mdwv", "asaasStatus": "PENDING", "bankSlipUrl": null, "billingType": "CREDIT_CARD", "paymentDate": null, "confirmedDate": null, "lastWebhookAt": "2026-02-17T14:08:32.522Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-17 14:07:28.721581	2026-02-17 14:08:32.581613	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	114	\N	\N	asaas	pay_7jq6wxnea8s5mdwv	cus_000007570564	https://sandbox.asaas.com/i/7jq6wxnea8s5mdwv	\N	https://sandbox.asaas.com/i/7jq6wxnea8s5mdwv	\N	\N	\N	2026-02-20
16	150.00	pix	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 23:16:31.801882	2026-02-17 23:16:31.801882	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_50b1stwa9e7amh4b	cus_000007571956	https://sandbox.asaas.com/i/50b1stwa9e7amh4b	\N	https://sandbox.asaas.com/i/50b1stwa9e7amh4b	00020101021226820014br.gov.bcb.pix2560pix-h.asaas.com/qr/cobv/8a6f8642-4324-4db6-8f6b-db4fbac1d7ff5204000053039865802BR5913BE SMART LTDA6009Joinville61088922300562070503***6304469E	iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADFklEQVR4Xu2UQY7jQAwDffP/f7TP6ls2LEpt7wALD+YyCkA5ttUUizl0J8frh/Xn+Kp8t0I+VcinCvlUIZ8q5FP9GrkO6uzuXGfP17lYLo21aGfIwSTGrRfdjedMK5JnyMFkqcubLuPe+NNT2boP+RkkSoF9GAq7okN+DElT58EwVUtiQ34E+bLqITY53CjNxOUMOZrcO/54lTPkf68B5Jda/nFzJHQMSqlj0BVyLMn+apflp6nf8j4enrsnMuRkEooIb7uroxDL4EMScjhpn0+Dx72++TvDaMi5ZC3MayqftGoU4gB3qpBjSazSPLgImfTQuA6CY0NOJk1ZBpUFNwpZLkewCjmabFiTOhRu2s+ERAeFHEuatfJ2+bIPo3AWN1/IueRiya0JT4H40B1EBNkhR5PbowzvuZJwFqnO0WUIOZiUwVV2Xn52SjHiJYYcSzKyxliXx+49JXVnhxxNSrS7QlAuovP4lpDDSU34mMWyOkhkqxUrJuRksspubCXYLqy18oQcS6KcfmO0JuXkhPSNJ+R40oMe21yKTG1A4Qo5m/T2l18GLbZiuBWDIeeSlm262qJIQWwFKeRg8sUA5OSHi/Uu2N63KuRgUhaqMfkPbb1ebRBnMeRk0m4aXRpblEcL64TRyxtyLPnymE2mubb9X5DTUV8TciwprcbldJi9SpFy84QcTvLx5h9st1+MylC480KOJm01V+btMaKY+gKPQ84l3zZciEs/ZcVsj96lLh8TDUKOJSU35q1mzu3mPqq8kGPJlzZYcz1vDR6OiHUGnRRyLvmSIhO3vLsRVms3noacTDLZu+01XhndMC6BccjBJIBPg1p12ncn7VNSMSGHkw3aqKH7zSGUSBtyMtnlA6AhQX6UscZ+qEKOJeXegGER+n9Gu4n8VwOHnEuqY7z3XUbl8MKqGYrDQk4mBfSTiKNKpsVIU5QKDzmfFPV+iK2HMnjTQ+MI+Qnk5eqYEvSu3lzI0WSZvc9viz8gzYISZ3/IueRBSb8C9AEDcG+Dw0KOJX9UIZ8q5FOFfKqQTxXyqT6M/AtjESkEvMY1lwAAAABJRU5ErkJggg==	\N	2026-02-20
13	15.55	credit_card	pago	\N	Asaas	{"netValue": 14.76, "invoiceUrl": "https://sandbox.asaas.com/i/43idyefdc7zy8dvj", "asaasStatus": "PENDING", "bankSlipUrl": null, "billingType": "CREDIT_CARD", "paymentDate": null, "confirmedDate": null, "lastWebhookAt": "2026-02-17T16:25:07.386Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-17 16:23:53.687671	2026-02-17 16:25:07.446918	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_43idyefdc7zy8dvj	cus_000007570739	https://sandbox.asaas.com/i/43idyefdc7zy8dvj	\N	https://sandbox.asaas.com/i/43idyefdc7zy8dvj	\N	\N	\N	2026-02-20
14	33.00	credit_card	pago	\N	Asaas	{"netValue": 31.86, "invoiceUrl": "https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt", "asaasStatus": "PENDING", "bankSlipUrl": null, "billingType": "CREDIT_CARD", "paymentDate": null, "confirmedDate": null, "lastWebhookAt": "2026-02-17T16:29:22.509Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-17 16:28:39.597176	2026-02-17 16:29:22.79328	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	115	\N	asaas	pay_8mi9jc5r2oekjjjt	cus_000007570746	https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt	\N	https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt	\N	\N	\N	2026-02-20
15	150.00	boleto	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 23:15:40.23267	2026-02-17 23:15:40.23267	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_arns27muushdbyim	cus_000007571954	https://sandbox.asaas.com/i/arns27muushdbyim	https://sandbox.asaas.com/b/pdf/arns27muushdbyim	https://sandbox.asaas.com/i/arns27muushdbyim	\N	\N	\N	2026-02-20
17	150.00	credit_card	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 23:18:06.823973	2026-02-17 23:18:06.823973	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_cf6xpvbgsaekkaw8	cus_000007571959	https://sandbox.asaas.com/i/cf6xpvbgsaekkaw8	\N	https://sandbox.asaas.com/i/cf6xpvbgsaekkaw8	\N	\N	\N	2026-02-20
19	150.00	credit_card	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-17 23:40:19.524014	2026-02-17 23:40:19.524014	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_66yy2uf9ompzamwl	cus_000007572005	https://sandbox.asaas.com/i/66yy2uf9ompzamwl	\N	https://sandbox.asaas.com/i/66yy2uf9ompzamwl	\N	\N	\N	2026-02-20
18	150.00	credit_card	pago	\N	Asaas	{"asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-17 23:26:40.128273	2026-02-17 23:55:18.867426	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_yomtqoacm21jveay	cus_000007571986	https://sandbox.asaas.com/i/yomtqoacm21jveay	\N	https://sandbox.asaas.com/i/yomtqoacm21jveay	\N	\N	\N	2026-02-20
20	10.00	credit_card	pago	\N	Asaas	{"asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-18 00:01:35.84403	2026-02-18 00:03:00.81661	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_tfl16khx6fvc964t	cus_000007572047	https://sandbox.asaas.com/i/tfl16khx6fvc964t	\N	https://sandbox.asaas.com/i/tfl16khx6fvc964t	\N	\N	\N	2026-02-21
21	19.00	pix	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-18 01:31:11.617944	2026-02-18 01:31:11.617944	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_98uspnekj06m3loy	cus_000007572178	https://sandbox.asaas.com/i/98uspnekj06m3loy	\N	https://sandbox.asaas.com/i/98uspnekj06m3loy	00020101021226820014br.gov.bcb.pix2560pix-h.asaas.com/qr/cobv/01ceae1c-4c2c-43ce-9cda-3d46ff4a20a35204000053039865802BR5913BE SMART LTDA6009Joinville61088922300562070503***6304F4D1	iVBORw0KGgoAAAANSUhEUgAAAcIAAAHCAQAAAABUY/ToAAADIklEQVR4Xu2UQY7cMBADffP/f5Rn+TbZIil5NkDgYC/pAdgeyxKbRR8kz/H6Yf06/lT+tUo+VcmnKvlUJZ+q5FP9N/I6VOfrOjU/v57IJ/el5eX2dpacTMboNqRu+4Sv7h1ZcjIZVT/pFxlCzyRKe+NLjidFwbxAjoDCdnTJzyHV13LBqiyxl/wM8hV1HwQ5PEE2cTtLjib3jj9ecZb86zWA3EVTG23fOh1WcgxWlRxLan+9yzT9JWfX95QMBzqh5HDS258Zvcuc4jyuQ1JyNnmyyxCrr0nE7V8ZRkuOJReBao9WzjAiRtF2lhxNpk3BInguv5Y5CDaXnE0e/lxzcyDsVk9ZLkdoVXIweSJhQc9wcBtWSBiSEUuOJVnIg+G7zz0DrNanX3IwaTPHwQkMORwcB6zuE8Gi5GhSnu/9xDBzRxqZWHhbybnkkS2Xa4OOwqVWGHjEkmNJ0PO2MWUmjy6FKTyvKDmfFM2cwcubcIKTj5KzSXwStfMefA7kS6JajsVaciwJwjd7f7ZkZS072NKcWHIuKeXEr1/sVlgpMKEMJWeTgvdea1CWOHUXmRNRcjRJn5Xa2+19J8HwUgyWnEvGIZdklj4QiQTbiqSSc8mtqAssa5z5kpPwyrLkdNKCsFAMzL+Fr6SSY0nZ5ZEfdJ0EPSXoWs2So0lYnCYZYAy9gzbxopKDSWa6sSvEiL0Ks8N4yeGk3Pu6mQQaCu5eycmkdntJAoiKYASVBz+nlRxMYjLhjNA4/LzDHVFyMnnGpEeGSwkenGlkvaPkWNIKrpwELxxHrNQ0WJacTWKQJLtb8SwR9a1bcjJpp3af7dbaqFvicziilZxMyi9Cv4tv+EwYESvMk5KzSYO2atO97zengxAxh6XkXHLVBbY/Z6Vto16wZKrkWDL7DhOLNnzlEGlPcgWXnEuKsCYgvmTYetFCOe0vOZj8cmTfUcW58Egm00pOR8lPINMQT58UPTUXbbDkJ5AxSIK/gvHMPKaSk0lLNsOx/VL3QaCnQ+Bfycnk+g9m8JIzsJdfgOfvYSXHkj+qkk9V8qlKPlXJpyr5VB9G/gbB74ikanGyDgAAAABJRU5ErkJggg==	\N	2026-02-21
22	19.00	boleto	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-18 01:37:05.176996	2026-02-18 01:37:05.176996	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_xflds84jc9qj0nib	cus_000007572189	https://sandbox.asaas.com/i/xflds84jc9qj0nib	https://sandbox.asaas.com/b/pdf/xflds84jc9qj0nib	https://sandbox.asaas.com/i/xflds84jc9qj0nib	\N	\N	\N	2026-02-21
23	19.00	boleto	pendente	\N	Asaas	\N	\N	\N	\N	\N	2026-02-18 01:40:37.845125	2026-02-18 01:40:37.845125	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_8kcl2pzcj4buc7na	cus_000007572193	https://sandbox.asaas.com/i/8kcl2pzcj4buc7na	https://sandbox.asaas.com/b/pdf/8kcl2pzcj4buc7na	https://sandbox.asaas.com/i/8kcl2pzcj4buc7na	\N	\N	\N	2026-02-21
25	12.00	boleto	pago	\N	Asaas	{"asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-18 02:22:18.458471	2026-02-18 02:36:02.383377	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	\N	\N	asaas	pay_8935hi8ek84pnrjc	cus_000007572257	https://sandbox.asaas.com/i/8935hi8ek84pnrjc	https://sandbox.asaas.com/b/pdf/8935hi8ek84pnrjc	https://sandbox.asaas.com/i/8935hi8ek84pnrjc	\N	\N	\N	2026-02-21
27	123.00	boleto	pago	\N	Asaas	{"lote_id": 1032, "asaasConfirmedDate": "2026-02-18"}	2026-02-18 00:00:00	\N	\N	\N	2026-02-18 03:06:51.657207	2026-02-18 03:20:43.245433	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_wt5bd42yqzenv2yk	cus_000007572328	https://sandbox.asaas.com/i/wt5bd42yqzenv2yk	https://sandbox.asaas.com/b/pdf/wt5bd42yqzenv2yk	https://sandbox.asaas.com/i/wt5bd42yqzenv2yk	\N	\N	\N	2026-02-21
26	24.00	boleto	pago	\N	Asaas	{"asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-18 02:41:31.886274	2026-02-18 03:20:49.925074	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_otiieosmg70ll16f	cus_000007572281	https://sandbox.asaas.com/i/otiieosmg70ll16f	https://sandbox.asaas.com/b/pdf/otiieosmg70ll16f	https://sandbox.asaas.com/i/otiieosmg70ll16f	\N	\N	\N	2026-02-21
24	19.00	boleto	pago	\N	Asaas	{"asaasConfirmedDate": "2026-02-17"}	2026-02-17 00:00:00	\N	\N	\N	2026-02-18 02:17:44.090008	2026-02-18 03:27:49.178956	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_vzzebo2hjosrrule	cus_000007572249	https://sandbox.asaas.com/i/vzzebo2hjosrrule	https://sandbox.asaas.com/b/pdf/vzzebo2hjosrrule	https://sandbox.asaas.com/i/vzzebo2hjosrrule	\N	\N	\N	2026-02-21
28	18.50	boleto	pago	\N	Asaas	{"lote_id": 1033, "asaasConfirmedDate": "2026-02-18"}	2026-02-18 00:00:00	\N	\N	\N	2026-02-18 11:12:01.740981	2026-02-18 11:12:38.538267	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	104	\N	asaas	pay_r7fhqaqf2wih48u8	cus_000007572766	https://sandbox.asaas.com/i/r7fhqaqf2wih48u8	https://sandbox.asaas.com/b/pdf/r7fhqaqf2wih48u8	https://sandbox.asaas.com/i/r7fhqaqf2wih48u8	\N	\N	\N	2026-02-21
30	40.00	boleto	pago	\N	Asaas	{"lote_id": 1035, "netValue": 39.01, "invoiceUrl": "https://sandbox.asaas.com/i/96s9n4c5krsxpdwy", "asaasStatus": "PENDING", "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/96s9n4c5krsxpdwy", "billingType": "BOLETO", "paymentDate": null, "lastWebhookAt": "2026-02-23T23:17:46.024Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-23"}	2026-02-23 00:00:00	\N	\N	\N	2026-02-23 23:17:37.537346	2026-02-23 23:20:52.79753	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	118	\N	asaas	pay_96s9n4c5krsxpdwy	cus_000007590024	https://sandbox.asaas.com/i/96s9n4c5krsxpdwy	https://sandbox.asaas.com/b/pdf/96s9n4c5krsxpdwy	https://sandbox.asaas.com/i/96s9n4c5krsxpdwy	\N	\N	\N	2026-02-26
29	152.00	credit_card	pago	\N	Asaas	{"lote_id": 1034, "netValue": 148.49, "invoiceUrl": "https://sandbox.asaas.com/i/1wli49798jkwmnmu", "asaasStatus": "PENDING", "bankSlipUrl": null, "billingType": "CREDIT_CARD", "paymentDate": null, "confirmedDate": null, "lastWebhookAt": "2026-02-23T21:25:51.191Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-23"}	2026-02-23 00:00:00	\N	\N	\N	2026-02-23 21:25:42.815883	2026-02-23 21:27:38.487145	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	117	\N	\N	asaas	pay_1wli49798jkwmnmu	cus_000007589649	https://sandbox.asaas.com/i/1wli49798jkwmnmu	\N	https://sandbox.asaas.com/i/1wli49798jkwmnmu	\N	\N	\N	2026-02-26
32	55.00	boleto	pago	\N	Asaas	{"lote_id": 1042, "asaasConfirmedDate": "2026-03-03"}	2026-03-03 00:00:00	\N	\N	\N	2026-03-03 14:47:30.956581	2026-03-03 14:48:28.029142	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	127	\N	\N	asaas	pay_yctm1msbpw58lfgz	cus_000007628390	https://sandbox.asaas.com/i/yctm1msbpw58lfgz	https://sandbox.asaas.com/b/pdf/yctm1msbpw58lfgz	https://sandbox.asaas.com/i/yctm1msbpw58lfgz	\N	\N	\N	2026-03-06
31	12.50	boleto	pago	\N	Asaas	{"lote_id": 1037, "netValue": 11.51, "invoiceUrl": "https://sandbox.asaas.com/i/mz0zctgw526011bp", "asaasStatus": "PENDING", "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/mz0zctgw526011bp", "billingType": "BOLETO", "paymentDate": null, "lastWebhookAt": "2026-02-25T20:09:42.924Z", "lastWebhookEvent": "CREATED", "asaasConfirmedDate": "2026-02-25"}	2026-02-25 00:00:00	\N	\N	\N	2026-02-25 20:09:34.217344	2026-02-25 20:10:38.705298	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	120	\N	asaas	pay_mz0zctgw526011bp	cus_000007602746	https://sandbox.asaas.com/i/mz0zctgw526011bp	https://sandbox.asaas.com/b/pdf/mz0zctgw526011bp	https://sandbox.asaas.com/i/mz0zctgw526011bp	\N	\N	\N	2026-02-28
\.


--
-- Data for Name: asaas_pagamentos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.asaas_pagamentos (id, pagamento_id, asaas_subscription_id, asaas_customer_id, asaas_invoice_id, asaas_status, valor_original, taxa_asaas, valor_liquido, pix_qr_code, pix_copy_paste, pix_expiration, boleto_numero, boleto_link_pdf, boleto_vencimento, metadados, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: audit_access_denied; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_access_denied (id, user_cpf, user_perfil, attempted_action, resource, resource_id, reason, query_text, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, ip_address, user_agent, details, created_at, clinica_id, entidade_id) FROM stdin;
1	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_view on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
2	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_insert_base on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
3	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_system_insert on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
4	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_select_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
5	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_select on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
6	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_admin on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
7	00000000000	system	POLICY_UNEXPECTED	avaliacoes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_avaliacoes on table avaliacoes	2026-02-09 20:16:44.890059	\N	\N
8	00000000000	system	POLICY_UNEXPECTED	roles	\N	\N	\N	\N	\N	Unexpected policy: roles_admin_select on table roles	2026-02-09 20:16:44.890059	\N	\N
9	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_update on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
10	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: admin_all_empresas on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
11	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_update on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
12	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_select on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
13	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_delete on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
14	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_delete on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
15	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_own on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
16	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: admin_all_laudos on table laudos	2026-02-09 20:16:44.890059	\N	\N
17	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_insert on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
18	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_delete on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
19	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_select_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
20	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_select on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
21	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: policy_lotes_emissor on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
22	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_block_admin on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
23	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_admin_view on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
24	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_select_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
25	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_update_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
26	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: admin_all_lotes on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
27	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_delete_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
28	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_insert_base on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
29	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_rh_delete_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
30	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_gestor_update on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
31	00000000000	system	POLICY_UNEXPECTED	permissions	\N	\N	\N	\N	\N	Unexpected policy: permissions_admin_select on table permissions	2026-02-09 20:16:44.890059	\N	\N
32	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_delete on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
33	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_insert on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
34	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_emissor_update on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
35	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_update on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
36	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_clinica_update on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
37	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: rh_lotes_empresas on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
38	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_own_select on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
39	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_delete_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
40	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_update_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
41	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: rh_empresas_proprias on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
42	00000000000	system	POLICY_UNEXPECTED	lotes_avaliacao	\N	\N	\N	\N	\N	Unexpected policy: lotes_rh_delete on table lotes_avaliacao	2026-02-09 20:16:44.890059	\N	\N
43	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: resultados_system_insert on table resultados	2026-02-09 20:16:44.890059	\N	\N
44	00000000000	system	POLICY_UNEXPECTED	funcionarios_entidades	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_entidades_block_admin on table funcionarios_entidades	2026-02-09 20:16:44.890059	\N	\N
45	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_update_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
46	00000000000	system	POLICY_UNEXPECTED	resultados	\N	\N	\N	\N	\N	Unexpected policy: admin_all_resultados on table resultados	2026-02-09 20:16:44.890059	\N	\N
47	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_insert_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
48	00000000000	system	POLICY_UNEXPECTED	avaliacao_resets	\N	\N	\N	\N	\N	Unexpected policy: avaliacao_resets_update_policy on table avaliacao_resets	2026-02-09 20:16:44.890059	\N	\N
49	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_insert on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
50	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_rh_select on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
51	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_insert_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
52	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_admin on table laudos	2026-02-09 20:16:44.890059	\N	\N
53	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_gestor_select_via_relacionamento on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
54	00000000000	system	POLICY_UNEXPECTED	notificacoes	\N	\N	\N	\N	\N	Unexpected policy: notificacoes_contratante_own on table notificacoes	2026-02-09 20:16:44.890059	\N	\N
55	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_delete_simple on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
56	00000000000	system	POLICY_UNEXPECTED	empresas_clientes	\N	\N	\N	\N	\N	Unexpected policy: empresas_admin_select on table empresas_clientes	2026-02-09 20:16:44.890059	\N	\N
57	00000000000	system	POLICY_UNEXPECTED	laudos	\N	\N	\N	\N	\N	Unexpected policy: policy_laudos_emissor on table laudos	2026-02-09 20:16:44.890059	\N	\N
58	00000000000	system	POLICY_UNEXPECTED	funcionarios_clinicas	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_clinicas_rh_update on table funcionarios_clinicas	2026-02-09 20:16:44.890059	\N	\N
59	00000000000	system	POLICY_UNEXPECTED	role_permissions	\N	\N	\N	\N	\N	Unexpected policy: role_permissions_admin_select on table role_permissions	2026-02-09 20:16:44.890059	\N	\N
60	00000000000	system	POLICY_UNEXPECTED	audit_logs	\N	\N	\N	\N	\N	Unexpected policy: audit_logs_admin_all on table audit_logs	2026-02-09 20:16:44.890059	\N	\N
61	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_emissor_select on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
62	00000000000	system	POLICY_UNEXPECTED	funcionarios	\N	\N	\N	\N	\N	Unexpected policy: funcionarios_admin_select on table funcionarios	2026-02-09 20:16:44.890059	\N	\N
63	00000000000	system	POLICY_UNEXPECTED	fila_emissao	\N	\N	\N	\N	\N	Unexpected policy: fila_emissao_system_bypass on table fila_emissao	2026-02-09 20:16:44.890059	\N	\N
64	00000000000	system	POLICY_UNEXPECTED	respostas	\N	\N	\N	\N	\N	Unexpected policy: admin_all_respostas on table respostas	2026-02-09 20:16:44.890059	\N	\N
73	29930511059	gestor	INSERT	funcionarios	1008	\N	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 03:34:31.346394	\N	\N
74	29930511059	gestor	INSERT	funcionarios	1009	\N	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 03:34:31.346394	\N	\N
79	04703084945	rh	INSERT	empresas_clientes	5	\N	{"id": 5, "cep": "45612456", "cnpj": "22902898000126", "nome": "Empresa CM onlinwe", "ativa": true, "email": "55asds@dsdssdf.com", "cidade": "ipiopipo", "estado": "IO", "endereco": "rua lkj lk 89089", "telefone": "(46) 54654-6566", "criado_em": "2026-02-10T09:40:21.970549", "clinica_id": 104, "atualizado_em": "2026-02-10T09:40:21.970549", "responsavel_email": null, "representante_fone": "46465456456", "representante_nome": "dsdsd dfssfdf", "representante_email": "fssafsf@fasasf.com"}	\N	\N	Record created	2026-02-10 09:40:21.970549	\N	\N
83	04703084945	rh	INSERT	funcionarios	1014	\N	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 10:29:30.334004	\N	\N
84	04703084945	rh	INSERT	funcionarios	1015	\N	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 10:29:30.334004	\N	\N
90	\N	\N	lote_criado	lotes_avaliacao	1002	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1002, "empresa_id": null, "numero_ordem": 1}	2026-02-10 11:29:28.439742	\N	\N
91	\N	\N	laudo_criado	laudos	1002	\N	{"status": "rascunho", "lote_id": 1002, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 11:29:28.439742	\N	\N
94	29930511059	\N	liberar_lote	lotes_avaliacao	1002	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1002,"descricao":null,"data_filtro":null,"numero_ordem":1,"avaliacoes_criadas":0,"total_funcionarios":2}	2026-02-10 11:29:31.438192	\N	\N
95	\N	\N	lote_criado	lotes_avaliacao	1003	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1003, "empresa_id": 5, "numero_ordem": 1}	2026-02-10 11:30:56.337043	\N	\N
96	\N	\N	laudo_criado	laudos	1003	\N	{"status": "rascunho", "lote_id": 1003, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 11:30:56.337043	\N	\N
102	29930511059	\N	lote_criado	lotes_avaliacao	1004	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1004, "empresa_id": null, "numero_ordem": 2}	2026-02-10 12:10:36.722222	\N	\N
103	\N	\N	laudo_criado	laudos	1004	\N	{"status": "rascunho", "lote_id": 1004, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:10:36.722222	\N	\N
104	29930511059	gestor	INSERT	avaliacoes	10004	\N	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:10:36.722222	\N	\N
105	29930511059	gestor	INSERT	avaliacoes	10005	\N	{"id": 10005, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:10:36.722222	\N	\N
106	29930511059	\N	liberar_lote	lotes_avaliacao	1004	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1004,"descricao":null,"data_filtro":null,"numero_ordem":2,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 12:10:38.760206	\N	\N
109	04703084945	\N	lote_criado	lotes_avaliacao	1005	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1005, "empresa_id": 5, "numero_ordem": 2}	2026-02-10 12:21:47.979581	\N	\N
110	\N	\N	laudo_criado	laudos	1005	\N	{"status": "rascunho", "lote_id": 1005, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:21:47.979581	\N	\N
111	04703084945	rh	INSERT	avaliacoes	10006	\N	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:21:47.979581	\N	\N
112	04703084945	rh	INSERT	avaliacoes	10007	\N	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:21:47.979581	\N	\N
113	24626149073	gestor	INSERT	funcionarios	1016	\N	{"id": 1016, "cpf": "17285659010", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.com", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T12:33:30.10471", "matricula": null, "senha_hash": "$2a$10$CCEgsiac9DHv2LCEhDp54.WmpwHI6xW.x.R97M9LhjTdznOKPP9SO", "incluido_em": "2026-02-10T12:33:30.10471", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T12:33:30.10471", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 12:33:30.10471	\N	\N
114	24626149073	gestor	INSERT	funcionarios	1017	\N	{"id": 1017, "cpf": "77109022005", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "r123132erweantos@empresa.dot", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T12:33:30.10471", "matricula": null, "senha_hash": "$2a$10$c2WQE9ZQq9phaEeJ6ddxueJRLFsM9GVIhwuNrBAWfcnH8SfB24kje", "incluido_em": "2026-02-10T12:33:30.10471", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T12:33:30.10471", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-10 12:33:30.10471	\N	\N
115	24626149073	\N	lote_criado	lotes_avaliacao	1006	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1006, "empresa_id": null, "numero_ordem": 3}	2026-02-10 12:33:46.635319	\N	\N
116	\N	\N	laudo_criado	laudos	1006	\N	{"status": "rascunho", "lote_id": 1006, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 12:33:46.635319	\N	\N
117	24626149073	gestor	INSERT	avaliacoes	10008	\N	{"id": 10008, "envio": null, "inicio": "2026-02-10T12:33:47.269", "status": "iniciada", "lote_id": 1006, "criado_em": "2026-02-10T12:33:46.635319", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:33:46.635319", "funcionario_cpf": "77109022005", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:33:46.635319	\N	\N
118	24626149073	gestor	INSERT	avaliacoes	10009	\N	{"id": 10009, "envio": null, "inicio": "2026-02-10T12:33:47.269", "status": "iniciada", "lote_id": 1006, "criado_em": "2026-02-10T12:33:46.635319", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:33:46.635319", "funcionario_cpf": "17285659010", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 12:33:46.635319	\N	\N
119	24626149073	\N	liberar_lote	lotes_avaliacao	1006	\N	\N	177.146.166.16	\N	{"entidade_id":105,"entidade_nome":"DDSDSAGADSGGSD","tipo":"completo","lote_id":1006,"descricao":null,"data_filtro":null,"numero_ordem":3,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 12:33:48.496843	\N	\N
203	29930511059	\N	lote_criado	lotes_avaliacao	1007	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1007, "empresa_id": null, "numero_ordem": 4}	2026-02-10 14:13:18.784349	\N	\N
204	\N	\N	laudo_criado	laudos	1007	\N	{"status": "rascunho", "lote_id": 1007, "tamanho_pdf": null}	\N	\N	\N	2026-02-10 14:13:18.784349	\N	\N
205	29930511059	gestor	INSERT	avaliacoes	10010	\N	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 14:13:18.784349	\N	\N
206	29930511059	gestor	INSERT	avaliacoes	10011	\N	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-10 14:13:18.784349	\N	\N
207	29930511059	\N	liberar_lote	lotes_avaliacao	1007	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1007,"descricao":null,"data_filtro":null,"numero_ordem":4,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-10 14:13:20.671377	\N	\N
215	49651696036	funcionario	UPDATE	avaliacoes	10010	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T15:56:23.013576", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 15:56:23.013576	\N	\N
217	49651696036	funcionario	UPDATE	avaliacoes	10010	{"id": 10010, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T15:56:23.013576", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10010, "envio": "2026-02-10T16:07:57.010649", "inicio": "2026-02-10T14:13:19.435", "status": "concluida", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:07:57.010649", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:07:57.010649	\N	\N
218	49651696036	funcionario	UPDATE	funcionarios	1009	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-10T16:07:57.010649", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:07:57.010649	\N	\N
219	36381045086	funcionario	UPDATE	avaliacoes	10011	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "iniciada", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:09:09.982827	\N	\N
221	\N	system	MIGRATION_APPLIED	audit_lote_change	\N	\N	\N	\N	\N	{"descricao": "Removida referência a campo obsoleto do trigger de auditoria", "migration": "1011", "data_aplicacao": "2026-02-10T16:24:57.447608+00:00"}	2026-02-10 16:24:57.447608	\N	\N
222	36381045086	funcionario	UPDATE	avaliacoes	10011	{"id": 10011, "envio": null, "inicio": "2026-02-10T14:13:19.435", "status": "em_andamento", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T14:13:18.784349", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	{"id": 10011, "envio": "2026-02-10T16:29:35.288036", "inicio": "2026-02-10T14:13:19.435", "status": "concluida", "lote_id": 1007, "criado_em": "2026-02-10T14:13:18.784349", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:29:35.288036", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:29:35.288036	\N	\N
223	36381045086	\N	lote_atualizado	lotes_avaliacao	1007	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1007, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-10 16:29:35.288036	\N	\N
224	\N	\N	lote_status_change	lotes_avaliacao	1007	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-10 16:29:35.288036	\N	\N
342	\N	\N	lote_status_change	lotes_avaliacao	1014	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-12 23:52:18.708343	\N	\N
225	36381045086	funcionario	UPDATE	funcionarios	1008	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-10T16:29:35.288036", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:29:35.288036	\N	\N
226	03175612008	funcionario	UPDATE	avaliacoes	10006	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:31:24.644575	\N	\N
227	03175612008	funcionario	UPDATE	avaliacoes	10006	{"id": 10006, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10006, "envio": "2026-02-10T16:39:11.716723", "inicio": "2026-02-10T12:21:49.087", "status": "concluida", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:39:11.716723", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:39:11.716723	\N	\N
228	03175612008	funcionario	UPDATE	funcionarios	1015	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-10T16:39:11.716723", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:39:11.716723	\N	\N
229	73922219063	funcionario	UPDATE	avaliacoes	10007	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "iniciada", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:40:30.138217	\N	\N
230	73922219063	funcionario	UPDATE	avaliacoes	10007	{"id": 10007, "envio": null, "inicio": "2026-02-10T12:21:49.087", "status": "em_andamento", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:21:47.979581", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10007, "envio": "2026-02-10T16:53:16.783516", "inicio": "2026-02-10T12:21:49.087", "status": "concluida", "lote_id": 1005, "criado_em": "2026-02-10T12:21:47.979581", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T16:53:16.783516", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-10 16:53:16.783516	\N	\N
231	73922219063	\N	lote_atualizado	lotes_avaliacao	1005	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1005, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-10 16:53:16.783516	\N	\N
232	\N	\N	lote_status_change	lotes_avaliacao	1005	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-10 16:53:16.783516	\N	\N
245	65648556055	funcionario	UPDATE	avaliacoes	10012	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:06:39.418917	\N	\N
233	73922219063	funcionario	UPDATE	funcionarios	1014	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-10T16:53:16.783516", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-10 16:53:16.783516	\N	\N
234	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1005	\N	{"lote_id": 1005, "file_size": 641281, "duration_ms": 2169, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1005/laudo-1770756960778-42nlgb.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1005/laudo-1770756960778-42nlgb.pdf"}	\N	\N	\N	2026-02-10 20:55:24.576836	\N	\N
235	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1007	\N	{"lote_id": 1007, "file_size": 577310, "duration_ms": 2425, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf"}	\N	\N	\N	2026-02-10 22:33:33.789723	\N	\N
236	29930511059	gestor	INSERT	funcionarios	1018	\N	{"id": 1018, "cpf": "19778990050", "nome": "Jaiemx o1", "ativo": true, "email": "jorwerwero.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 00:59:46.425929	\N	\N
237	29930511059	gestor	INSERT	funcionarios	1019	\N	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 00:59:46.425929	\N	\N
238	35051737030	gestor	INSERT	funcionarios	1020	\N	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:04:34.424847	\N	\N
239	35051737030	gestor	INSERT	funcionarios	1021	\N	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:04:34.424847	\N	\N
240	35051737030	\N	lote_criado	lotes_avaliacao	1008	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1008, "empresa_id": null, "numero_ordem": 5}	2026-02-11 01:05:34.180476	\N	\N
241	35051737030	gestor	INSERT	avaliacoes	10012	\N	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:05:34.180476	\N	\N
242	35051737030	gestor	INSERT	avaliacoes	10013	\N	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:05:34.180476	\N	\N
243	35051737030	\N	liberar_lote	lotes_avaliacao	1008	\N	\N	177.146.166.16	\N	{"entidade_id":106,"entidade_nome":"Empresa Privada Final","tipo":"completo","lote_id":1008,"descricao":null,"data_filtro":null,"numero_ordem":5,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-11 01:05:36.123922	\N	\N
267	32911756037	\N	lote_atualizado	lotes_avaliacao	1009	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1009, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-11 02:01:46.606336	\N	\N
268	\N	\N	lote_status_change	lotes_avaliacao	1009	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-11 02:01:46.606336	\N	\N
246	18597536047	funcionario	UPDATE	avaliacoes	10013	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "iniciada", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:09:15.233281	\N	\N
247	18597536047	funcionario	UPDATE	avaliacoes	10013	{"id": 10013, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	{"id": 10013, "envio": "2026-02-11T01:12:17.053789", "inicio": "2026-02-11T01:05:34.866", "status": "concluida", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:12:17.053789", "funcionario_cpf": "18597536047", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:12:17.053789	\N	\N
248	18597536047	funcionario	UPDATE	funcionarios	1020	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1020, "cpf": "18597536047", "nome": "Jose do Emp02  online", "ativo": true, "email": "jos432432233va@empresa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-11T01:12:17.053789", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:12:17.053789	\N	\N
249	65648556055	funcionario	UPDATE	avaliacoes	10012	{"id": 10012, "envio": null, "inicio": "2026-02-11T01:05:34.866", "status": "em_andamento", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:05:34.180476", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	{"id": 10012, "envio": "2026-02-11T01:14:43.757296", "inicio": "2026-02-11T01:05:34.866", "status": "concluida", "lote_id": 1008, "criado_em": "2026-02-11T01:05:34.180476", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:14:43.757296", "funcionario_cpf": "65648556055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:14:43.757296	\N	\N
250	65648556055	\N	lote_atualizado	lotes_avaliacao	1008	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1008, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-11 01:14:43.757296	\N	\N
251	\N	\N	lote_status_change	lotes_avaliacao	1008	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-11 01:14:43.757296	\N	\N
252	65648556055	funcionario	UPDATE	funcionarios	1021	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1021, "cpf": "65648556055", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "2erweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:04:34.424847", "matricula": null, "senha_hash": "$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK", "incluido_em": "2026-02-11T01:04:34.424847", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:04:34.424847", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-11T01:14:43.757296", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:14:43.757296	\N	\N
253	\N	\N	laudo_criado	laudos	1008	\N	{"status": "rascunho", "lote_id": 1008, "tamanho_pdf": null}	\N	\N	\N	2026-02-11 01:17:41.164409	\N	\N
254	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1008	\N	{"lote_id": 1008, "file_size": 640751, "duration_ms": 1865, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1008/laudo-1770772751916-8j47zr.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1008/laudo-1770772751916-8j47zr.pdf"}	\N	\N	\N	2026-02-11 01:18:34.496114	\N	\N
255	64411953056	rh	INSERT	empresas_clientes	6	\N	{"id": 6, "cep": "83065-370", "cnpj": "82429448000190", "nome": "Empresa clin fina 001", "ativa": true, "email": "sdfsdf@assa.com", "cidade": "São José dos Pinhais", "estado": "FE", "endereco": "Rua Antônio Bianchetti, 90", "telefone": "(45) 64546-6545", "criado_em": "2026-02-11T01:52:11.752978", "clinica_id": 107, "atualizado_em": "2026-02-11T01:52:11.752978", "responsavel_email": null, "representante_fone": "89798798799", "representante_nome": "GEstor CLun fianl", "representante_email": "rerewewr@fdsfds.com"}	\N	\N	Record created	2026-02-11 01:52:11.752978	\N	\N
318	29930511059	gestor	INSERT	avaliacoes	10023	\N	{"id": 10023, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 21:09:12.071042	\N	\N
256	64411953056	rh	INSERT	funcionarios	1022	\N	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:52:46.462014	\N	\N
257	64411953056	rh	INSERT	funcionarios	1023	\N	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-11 01:52:46.462014	\N	\N
258	64411953056	\N	lote_criado	lotes_avaliacao	1009	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1009, "empresa_id": 6, "numero_ordem": 1}	2026-02-11 01:53:04.39101	\N	\N
259	\N	\N	laudo_criado	laudos	1009	\N	{"status": "rascunho", "lote_id": 1009, "tamanho_pdf": null}	\N	\N	\N	2026-02-11 01:53:04.39101	\N	\N
260	64411953056	rh	INSERT	avaliacoes	10014	\N	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:53:04.39101	\N	\N
261	64411953056	rh	INSERT	avaliacoes	10015	\N	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record created	2026-02-11 01:53:04.39101	\N	\N
262	85804194097	funcionario	UPDATE	avaliacoes	10014	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:55:04.736853	\N	\N
263	85804194097	funcionario	UPDATE	avaliacoes	10014	{"id": 10014, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	{"id": 10014, "envio": "2026-02-11T01:57:55.987926", "inicio": "2026-02-11T01:53:05.501", "status": "concluida", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:57:55.987926", "funcionario_cpf": "85804194097", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:57:55.987926	\N	\N
264	85804194097	funcionario	UPDATE	funcionarios	1022	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1022, "cpf": "85804194097", "nome": "gdssd sddssd", "ativo": true, "email": "jose53va@empresa.cot", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": "2026-02-11T01:57:55.987926", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 01:57:55.987926	\N	\N
265	32911756037	funcionario	UPDATE	avaliacoes	10015	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "iniciada", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 01:58:59.950795	\N	\N
266	32911756037	funcionario	UPDATE	avaliacoes	10015	{"id": 10015, "envio": null, "inicio": "2026-02-11T01:53:05.501", "status": "em_andamento", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T01:53:04.39101", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	{"id": 10015, "envio": "2026-02-11T02:01:46.606336", "inicio": "2026-02-11T01:53:05.501", "status": "concluida", "lote_id": 1009, "criado_em": "2026-02-11T01:53:04.39101", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T02:01:46.606336", "funcionario_cpf": "32911756037", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 02:01:46.606336	\N	\N
269	32911756037	funcionario	UPDATE	funcionarios	1023	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1023, "cpf": "32911756037", "nome": "vzfdf dffddgssdg", "ativo": true, "email": "reewr90rweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-11T01:52:46.462014", "matricula": null, "senha_hash": "$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W", "incluido_em": "2026-02-11T01:52:46.462014", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T01:52:46.462014", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-11T02:01:46.606336", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-11 02:01:46.606336	\N	\N
270	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1009	\N	{"lote_id": 1009, "file_size": 639837, "duration_ms": 1874, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1009/laudo-1770775613063-d02f0l.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1009/laudo-1770775613063-d02f0l.pdf"}	\N	\N	\N	2026-02-11 02:06:15.653063	\N	\N
273	29930511059	gestor	UPDATE	avaliacoes	10004	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-10T12:10:36.722222", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10004, "envio": null, "inicio": "2026-02-10T12:10:37.509", "status": "iniciada", "lote_id": 1004, "criado_em": "2026-02-10T12:10:36.722222", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-11T23:59:11.353752", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-11 23:59:11.353752	\N	\N
274	87748070997	rh	INSERT	empresas_clientes	7	\N	{"id": 7, "cep": "80020-180", "cnpj": "05073619000140", "nome": "TESTE EMPRESA", "ativa": true, "email": "DFFJKJHDKLGDF@GMAIL.COM", "cidade": "3946", "estado": "PR", "endereco": "Barão do Serro Azul, 198 - Centro", "telefone": "(06) 84680-4804", "criado_em": "2026-02-12T12:15:27.394911", "clinica_id": 108, "atualizado_em": "2026-02-12T12:15:27.394911", "responsavel_email": null, "representante_fone": "50465046504", "representante_nome": "TESTE GESTOR EMPRESA", "representante_email": "506068FGFD@GMAIL.COM"}	\N	\N	Record created	2026-02-12 12:15:27.394911	\N	\N
278	04703084945	\N	lote_criado	lotes_avaliacao	1010	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1010, "empresa_id": 5, "numero_ordem": 3}	2026-02-12 12:24:06.406657	\N	\N
279	\N	\N	laudo_criado	laudos	1010	\N	{"status": "rascunho", "lote_id": 1010, "tamanho_pdf": null}	\N	\N	\N	2026-02-12 12:24:06.406657	\N	\N
280	04703084945	rh	INSERT	avaliacoes	10016	\N	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 12:24:06.406657	\N	\N
281	04703084945	rh	INSERT	avaliacoes	10017	\N	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 12:24:06.406657	\N	\N
282	73922219063	funcionario	UPDATE	avaliacoes	10017	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:28:13.629063	\N	\N
283	03175612008	funcionario	UPDATE	avaliacoes	10016	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "iniciada", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:28:19.769824	\N	\N
284	73922219063	funcionario	UPDATE	avaliacoes	10017	{"id": 10017, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10017, "envio": "2026-02-12T12:30:53.219351", "inicio": "2026-02-12T12:24:07.632", "status": "concluida", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:30:53.219351", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:30:53.219351	\N	\N
313	73922219063	funcionario	UPDATE	avaliacoes	10021	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "em_andamento", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 20:19:42.946152	\N	\N
285	73922219063	funcionario	UPDATE	funcionarios	1014	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-10T16:53:16.783516", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-12T12:30:53.219351", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 12:30:53.219351	\N	\N
286	03175612008	funcionario	UPDATE	avaliacoes	10016	{"id": 10016, "envio": null, "inicio": "2026-02-12T12:24:07.632", "status": "em_andamento", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:24:06.406657", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10016, "envio": "2026-02-12T12:31:15.029557", "inicio": "2026-02-12T12:24:07.632", "status": "concluida", "lote_id": 1010, "criado_em": "2026-02-12T12:24:06.406657", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T12:31:15.029557", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 12:31:15.029557	\N	\N
287	03175612008	\N	lote_atualizado	lotes_avaliacao	1010	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1010, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-12 12:31:15.029557	\N	\N
288	\N	\N	lote_status_change	lotes_avaliacao	1010	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-12 12:31:15.029557	\N	\N
289	03175612008	funcionario	UPDATE	funcionarios	1015	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-10T16:39:11.716723", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-12T12:31:15.029557", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 12:31:15.029557	\N	\N
290	03178539026	rh	INSERT	empresas_clientes	8	\N	{"id": 8, "cep": "45678456", "cnpj": "16122856000170", "nome": "Empasa Amada Aeso", "ativa": true, "email": "dffds@afaf.com", "cidade": "uiou iioi", "estado": "IO", "endereco": "rrpoiop poipo  123", "telefone": "(46) 54897-9879", "criado_em": "2026-02-12T18:32:10.507968", "clinica_id": 109, "atualizado_em": "2026-02-12T18:32:10.507968", "responsavel_email": null, "representante_fone": "45646546546", "representante_nome": "Amanda Acesso", "representante_email": "dfdsf@dsffds.com"}	\N	\N	Record created	2026-02-12 18:32:10.507968	\N	\N
292	03178539026	rh	INSERT	funcionarios	1028	\N	{"id": 1028, "cpf": "98142073064", "nome": "ffa ssafafs", "ativo": true, "email": "poipoipo@ji.co", "setor": "ipoiop", "turno": null, "escala": null, "funcao": "poiopipo", "perfil": "funcionario", "criado_em": "2026-02-12T19:02:41.408304", "matricula": null, "senha_hash": "$2a$10$GHlP0WN/q1Y8kqEc9kp6hO315uNVBKNH5zuzyd7znjN3gVv4jBQaa", "incluido_em": "2026-02-12T19:02:41.408304", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T19:02:41.408304", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-12 19:02:41.408304	\N	\N
293	03178539026	rh	INSERT	funcionarios	1029	\N	{"id": 1029, "cpf": "89487826068", "nome": "tstes 05", "ativo": true, "email": "rdfs432432233va@fdsfdsa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-12T19:03:11.085611", "matricula": null, "senha_hash": "$2a$10$MGr3mbK3ijiSOmaYH1oPZuN7k2X98xPIx5sLhT4ZydbX8kZsBZ5XG", "incluido_em": "2026-02-12T19:03:11.085611", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T19:03:11.085611", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-12 19:03:11.085611	\N	\N
294	03178539026	rh	INSERT	funcionarios	1030	\N	{"id": 1030, "cpf": "42447121008", "nome": "tewtew ewewwe", "ativo": true, "email": "mjdfantos@eesa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-12T19:03:11.085611", "matricula": null, "senha_hash": "$2a$10$TmQ1k7O5O4HeEmMa2se8VumVMhu8NbdKaRnhzRSlYq3p2118QKIee", "incluido_em": "2026-02-12T19:03:11.085611", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-12T19:03:11.085611", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-12 19:03:11.085611	\N	\N
296	03178539026	rh	UPDATE	funcionarios	1028	{"id": 1028, "cpf": "98142073064", "nome": "ffa ssafafs", "ativo": true, "email": "poipoipo@ji.co", "setor": "ipoiop", "turno": null, "escala": null, "funcao": "poiopipo", "perfil": "funcionario", "criado_em": "2026-02-12T19:02:41.408304", "matricula": null, "senha_hash": "$2a$10$GHlP0WN/q1Y8kqEc9kp6hO315uNVBKNH5zuzyd7znjN3gVv4jBQaa", "incluido_em": "2026-02-12T19:02:41.408304", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T19:02:41.408304", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1028, "cpf": "98142073064", "nome": "ffa ssafafs", "ativo": false, "email": "poipoipo@ji.co", "setor": "ipoiop", "turno": null, "escala": null, "funcao": "poiopipo", "perfil": "funcionario", "criado_em": "2026-02-12T19:02:41.408304", "matricula": null, "senha_hash": "$2a$10$GHlP0WN/q1Y8kqEc9kp6hO315uNVBKNH5zuzyd7znjN3gVv4jBQaa", "incluido_em": "2026-02-12T19:02:41.408304", "nivel_cargo": "operacional", "inativado_em": "2026-02-12T19:55:27.422077", "atualizado_em": "2026-02-12T19:02:41.408304", "data_admissao": null, "inativado_por": "03178539026", "data_nascimento": "2011-11-11", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 19:55:27.422077	\N	\N
297	03178539026	\N	lote_criado	lotes_avaliacao	1011	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1011, "empresa_id": 8, "numero_ordem": 1}	2026-02-12 19:55:58.791717	\N	\N
298	\N	\N	laudo_criado	laudos	1011	\N	{"status": "rascunho", "lote_id": 1011, "tamanho_pdf": null}	\N	\N	\N	2026-02-12 19:55:58.791717	\N	\N
299	03178539026	rh	INSERT	avaliacoes	10018	\N	{"id": 10018, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "iniciada", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "42447121008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 19:55:58.791717	\N	\N
300	03178539026	rh	INSERT	avaliacoes	10019	\N	{"id": 10019, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "iniciada", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "89487826068", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 19:55:58.791717	\N	\N
301	42447121008	funcionario	UPDATE	avaliacoes	10018	{"id": 10018, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "iniciada", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "42447121008", "motivo_inativacao": null}	{"id": 10018, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "em_andamento", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "42447121008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 19:56:49.727594	\N	\N
304	03178539026	rh	UPDATE	avaliacoes	10018	{"id": 10018, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "em_andamento", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "42447121008", "motivo_inativacao": null}	{"id": 10018, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "inativada", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T20:13:24.870893+00:00", "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "42447121008", "motivo_inativacao": "dsdsfsdffdfdfd"}	\N	\N	Record updated	2026-02-12 20:13:24.870893	\N	\N
306	89487826068	funcionario	UPDATE	avaliacoes	10019	{"id": 10019, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "iniciada", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "89487826068", "motivo_inativacao": null}	{"id": 10019, "envio": null, "inicio": "2026-02-12T19:56:00.062", "status": "em_andamento", "lote_id": 1011, "criado_em": "2026-02-12T19:55:58.791717", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T19:55:58.791717", "funcionario_cpf": "89487826068", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 20:16:07.241005	\N	\N
308	04703084945	\N	lote_criado	lotes_avaliacao	1012	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1012, "empresa_id": 5, "numero_ordem": 4}	2026-02-12 20:18:17.914788	\N	\N
309	\N	\N	laudo_criado	laudos	1012	\N	{"status": "rascunho", "lote_id": 1012, "tamanho_pdf": null}	\N	\N	\N	2026-02-12 20:18:17.914788	\N	\N
310	04703084945	rh	INSERT	avaliacoes	10020	\N	{"id": 10020, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 20:18:17.914788	\N	\N
311	04703084945	rh	INSERT	avaliacoes	10021	\N	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 20:18:17.914788	\N	\N
312	04703084945	rh	UPDATE	avaliacoes	10020	{"id": 10020, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10020, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "inativada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T20:18:46.331071+00:00", "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "03175612008", "motivo_inativacao": "ddfsdsfsdffsdfds"}	\N	\N	Record updated	2026-02-12 20:18:46.331071	\N	\N
316	29930511059	\N	lote_criado	lotes_avaliacao	1013	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1013, "empresa_id": null, "numero_ordem": 6}	2026-02-12 21:09:12.071042	\N	\N
317	29930511059	gestor	INSERT	avaliacoes	10022	\N	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 21:09:12.071042	\N	\N
319	29930511059	gestor	INSERT	avaliacoes	10024	\N	{"id": 10024, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 21:09:12.071042	\N	\N
320	29930511059	gestor	INSERT	avaliacoes	10025	\N	{"id": 10025, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 21:09:12.071042	\N	\N
321	29930511059	\N	liberar_lote	lotes_avaliacao	1013	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1013,"descricao":null,"data_filtro":null,"numero_ordem":6,"avaliacoes_criadas":4,"total_funcionarios":4}	2026-02-12 21:09:13.68445	\N	\N
322	29930511059	gestor	UPDATE	avaliacoes	10024	{"id": 10024, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "49651696036", "motivo_inativacao": null}	{"id": 10024, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "inativada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T21:09:33.696108+00:00", "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "49651696036", "motivo_inativacao": "sddfsdd fdfdsdfsd"}	\N	\N	Record updated	2026-02-12 21:09:33.696108	\N	\N
323	19778990050	funcionario	UPDATE	avaliacoes	10022	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "em_andamento", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 21:12:37.84046	\N	\N
325	29930511059	gestor	UPDATE	avaliacoes	10022	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "em_andamento", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:09:12.071042", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:33:13.087921", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 21:33:13.087921	\N	\N
326	29930511059	gestor	UPDATE	funcionarios	1009	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": true, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-10T16:07:57.010649", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1009, "cpf": "49651696036", "nome": "DIMore Itali", "ativo": false, "email": "reewrrwerweantos@empresa.com.br", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "gestao", "inativado_em": "2026-02-12T21:44:04.669115", "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": "29930511059", "data_nascimento": "2011-02-02", "data_ultimo_lote": "2026-02-10T16:07:57.010649", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 21:44:04.669115	\N	\N
327	29930511059	gestor	UPDATE	funcionarios	1018	{"id": 1018, "cpf": "19778990050", "nome": "Jaiemx o1", "ativo": true, "email": "jorwerwero.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1018, "cpf": "19778990050", "nome": "Jaiemx o1", "ativo": false, "email": "jorwerwero.24@empalux.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "operacional", "inativado_em": "2026-02-12T21:44:14.636421", "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": "29930511059", "data_nascimento": "2010-12-12", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 21:44:14.636421	\N	\N
328	29930511059	gestor	UPDATE	avaliacoes	10022	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "iniciada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T21:33:13.087921", "funcionario_cpf": "19778990050", "motivo_inativacao": null}	{"id": 10022, "envio": null, "inicio": "2026-02-12T21:09:12.789", "status": "inativada", "lote_id": 1013, "criado_em": "2026-02-12T21:09:12.071042", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T21:44:15.677809+00:00", "atualizado_em": "2026-02-12T21:33:13.087921", "funcionario_cpf": "19778990050", "motivo_inativacao": "Funcionário inativado pela entidade"}	\N	\N	Record updated	2026-02-12 21:44:15.677809	\N	\N
329	29930511059	gestor	INSERT	funcionarios	1031	\N	{"id": 1031, "cpf": "40473159074", "nome": "Tse senha", "ativo": true, "email": "dfdf@dffd.om", "setor": "io", "turno": null, "escala": null, "funcao": "ioioi", "perfil": "funcionario", "criado_em": "2026-02-12T22:05:44.643602", "matricula": null, "senha_hash": "$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76", "incluido_em": "2026-02-12T22:05:44.643602", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T22:05:44.643602", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-12 22:05:44.643602	\N	\N
330	29930511059	\N	lote_criado	lotes_avaliacao	1014	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1014, "empresa_id": null, "numero_ordem": 7}	2026-02-12 22:05:59.608885	\N	\N
331	29930511059	gestor	INSERT	avaliacoes	10026	\N	{"id": 10026, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 22:05:59.608885	\N	\N
332	29930511059	gestor	INSERT	avaliacoes	10027	\N	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 22:05:59.608885	\N	\N
333	29930511059	gestor	INSERT	avaliacoes	10028	\N	{"id": 10028, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 22:05:59.608885	\N	\N
334	29930511059	\N	liberar_lote	lotes_avaliacao	1014	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1014,"descricao":null,"data_filtro":null,"numero_ordem":7,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-12 22:06:01.077197	\N	\N
335	29930511059	gestor	UPDATE	avaliacoes	10026	{"id": 10026, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10026, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "inativada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T23:46:44.657541+00:00", "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "34624832000", "motivo_inativacao": "safsafasafaf"}	\N	\N	Record updated	2026-02-12 23:46:44.657541	\N	\N
336	29930511059	gestor	UPDATE	avaliacoes	10028	{"id": 10028, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "36381045086", "motivo_inativacao": null}	{"id": 10028, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "inativada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T23:46:59.346141+00:00", "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "36381045086", "motivo_inativacao": "ssfasafafsasfasafs"}	\N	\N	Record updated	2026-02-12 23:46:59.346141	\N	\N
337	40473159074	funcionario	UPDATE	avaliacoes	10027	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "em_andamento", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 23:47:04.614661	\N	\N
338	29930511059	gestor	UPDATE	avaliacoes	10027	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "em_andamento", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T22:05:59.608885", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:47:32.967608", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 23:47:32.967608	\N	\N
339	40473159074	funcionario	UPDATE	avaliacoes	10027	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "iniciada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:47:32.967608", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "em_andamento", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:47:32.967608", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 23:47:54.314709	\N	\N
340	40473159074	funcionario	UPDATE	avaliacoes	10027	{"id": 10027, "envio": null, "inicio": "2026-02-12T22:06:00.291", "status": "em_andamento", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:47:32.967608", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	{"id": 10027, "envio": "2026-02-12T23:52:18.708343", "inicio": "2026-02-12T22:06:00.291", "status": "concluida", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:52:18.708343", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-12 23:52:18.708343	\N	\N
341	40473159074	\N	lote_atualizado	lotes_avaliacao	1014	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1014, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-12 23:52:18.708343	\N	\N
343	40473159074	funcionario	UPDATE	funcionarios	1031	{"id": 1031, "cpf": "40473159074", "nome": "Tse senha", "ativo": true, "email": "dfdf@dffd.om", "setor": "io", "turno": null, "escala": null, "funcao": "ioioi", "perfil": "funcionario", "criado_em": "2026-02-12T22:05:44.643602", "matricula": null, "senha_hash": "$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76", "incluido_em": "2026-02-12T22:05:44.643602", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T22:05:44.643602", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1031, "cpf": "40473159074", "nome": "Tse senha", "ativo": true, "email": "dfdf@dffd.om", "setor": "io", "turno": null, "escala": null, "funcao": "ioioi", "perfil": "funcionario", "criado_em": "2026-02-12T22:05:44.643602", "matricula": null, "senha_hash": "$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76", "incluido_em": "2026-02-12T22:05:44.643602", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T22:05:44.643602", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-12T23:52:18.708343", "indice_avaliacao": 7, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 23:52:18.708343	\N	\N
344	29930511059	gestor	UPDATE	funcionarios	1031	{"id": 1031, "cpf": "40473159074", "nome": "Tse senha", "ativo": true, "email": "dfdf@dffd.om", "setor": "io", "turno": null, "escala": null, "funcao": "ioioi", "perfil": "funcionario", "criado_em": "2026-02-12T22:05:44.643602", "matricula": null, "senha_hash": "$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76", "incluido_em": "2026-02-12T22:05:44.643602", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-12T22:05:44.643602", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-12T23:52:18.708343", "indice_avaliacao": 7, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1031, "cpf": "40473159074", "nome": "Tse senha", "ativo": false, "email": "dfdf@dffd.om", "setor": "io", "turno": null, "escala": null, "funcao": "ioioi", "perfil": "funcionario", "criado_em": "2026-02-12T22:05:44.643602", "matricula": null, "senha_hash": "$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76", "incluido_em": "2026-02-12T22:05:44.643602", "nivel_cargo": "operacional", "inativado_em": "2026-02-12T23:53:24.681971", "atualizado_em": "2026-02-12T22:05:44.643602", "data_admissao": null, "inativado_por": "29930511059", "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-12T23:52:18.708343", "indice_avaliacao": 7, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 23:53:24.681971	\N	\N
345	29930511059	gestor	UPDATE	avaliacoes	10027	{"id": 10027, "envio": "2026-02-12T23:52:18.708343", "inicio": "2026-02-12T22:06:00.291", "status": "concluida", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:52:18.708343", "funcionario_cpf": "40473159074", "motivo_inativacao": null}	{"id": 10027, "envio": "2026-02-12T23:52:18.708343", "inicio": "2026-02-12T22:06:00.291", "status": "inativada", "lote_id": 1014, "criado_em": "2026-02-12T22:05:59.608885", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T23:53:25.797376+00:00", "atualizado_em": "2026-02-12T23:52:18.708343", "funcionario_cpf": "40473159074", "motivo_inativacao": "Funcionário inativado pela entidade"}	\N	\N	Record updated	2026-02-12 23:53:25.797376	\N	\N
346	29930511059	gestor	UPDATE	funcionarios	1008	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": true, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-10T16:29:35.288036", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1008, "cpf": "36381045086", "nome": "Jose do UP01", "ativo": false, "email": "jose53va@empresa.com.br", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T03:34:31.346394", "matricula": null, "senha_hash": "$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa", "incluido_em": "2026-02-10T03:34:31.346394", "nivel_cargo": "operacional", "inativado_em": "2026-02-12T23:53:32.296006", "atualizado_em": "2026-02-10T03:34:31.346394", "data_admissao": null, "inativado_por": "29930511059", "data_nascimento": "1985-04-15", "data_ultimo_lote": "2026-02-10T16:29:35.288036", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-12 23:53:32.296006	\N	\N
347	29930511059	\N	lote_criado	lotes_avaliacao	1015	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1015, "empresa_id": null, "numero_ordem": 8}	2026-02-12 23:56:29.222814	\N	\N
348	29930511059	gestor	INSERT	avaliacoes	10029	\N	{"id": 10029, "envio": null, "inicio": "2026-02-12T23:56:29.87", "status": "iniciada", "lote_id": 1015, "criado_em": "2026-02-12T23:56:29.222814", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:56:29.222814", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-12 23:56:29.222814	\N	\N
349	29930511059	\N	liberar_lote	lotes_avaliacao	1015	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1015,"descricao":null,"data_filtro":null,"numero_ordem":8,"avaliacoes_criadas":1,"total_funcionarios":1}	2026-02-12 23:56:30.412197	\N	\N
350	07432266077	gestor	INSERT	funcionarios	1032	\N	{"id": 1032, "cpf": "62745664069", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.col", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-13T02:28:36.182785", "matricula": null, "senha_hash": "$2a$10$t0wXXT4G6HnaXF38k1CThOdv2UXsLDfnA82wHNPQIBN1IG2tpB5R2", "incluido_em": "2026-02-13T02:28:36.182785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:28:36.182785", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:28:36.182785	\N	\N
351	07432266077	gestor	INSERT	funcionarios	1033	\N	{"id": 1033, "cpf": "98823740002", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.coo", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-13T02:28:36.182785", "matricula": null, "senha_hash": "$2a$10$MZGKJVLcSg74m5ijLpORPORNQZeHlz2NN8htBko56ehsbR2vPyEjm", "incluido_em": "2026-02-13T02:28:36.182785", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-13T02:28:36.182785", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:28:36.182785	\N	\N
352	07432266077	gestor	INSERT	funcionarios	1034	\N	{"id": 1034, "cpf": "05153743004", "nome": "Entidade Final", "ativo": true, "email": "poipo@uiouoi.di", "setor": "opoipo", "turno": null, "escala": null, "funcao": "poipoi", "perfil": "funcionario", "criado_em": "2026-02-13T02:29:12.970338", "matricula": null, "senha_hash": "$2a$10$tKfPJ7ewfl06WQlr82BgweQzjLCo9/6PZJsgvV5CtpfkCh0Srpmju", "incluido_em": "2026-02-13T02:29:12.970338", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:29:12.970338", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:29:12.970338	\N	\N
353	07432266077	\N	lote_criado	lotes_avaliacao	1016	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1016, "empresa_id": null, "numero_ordem": 9}	2026-02-13 02:29:32.907947	\N	\N
354	07432266077	gestor	INSERT	avaliacoes	10030	\N	{"id": 10030, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "iniciada", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "05153743004", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 02:29:32.907947	\N	\N
355	07432266077	gestor	INSERT	avaliacoes	10031	\N	{"id": 10031, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "iniciada", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "98823740002", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 02:29:32.907947	\N	\N
356	07432266077	gestor	INSERT	avaliacoes	10032	\N	{"id": 10032, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "iniciada", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "62745664069", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 02:29:32.907947	\N	\N
357	07432266077	\N	liberar_lote	lotes_avaliacao	1016	\N	\N	177.146.166.16	\N	{"entidade_id":110,"entidade_nome":"Empresa Final","tipo":"completo","lote_id":1016,"descricao":null,"data_filtro":null,"numero_ordem":9,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-13 02:29:34.374704	\N	\N
358	05153743004	funcionario	UPDATE	avaliacoes	10030	{"id": 10030, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "iniciada", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "05153743004", "motivo_inativacao": null}	{"id": 10030, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "em_andamento", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "05153743004", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 02:31:48.700234	\N	\N
359	05153743004	funcionario	UPDATE	avaliacoes	10030	{"id": 10030, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "em_andamento", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "05153743004", "motivo_inativacao": null}	{"id": 10030, "envio": "2026-02-13T02:39:45.154975", "inicio": "2026-02-13T02:29:33.593", "status": "concluida", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:39:45.154975", "funcionario_cpf": "05153743004", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 02:39:45.154975	\N	\N
360	05153743004	funcionario	UPDATE	funcionarios	1034	{"id": 1034, "cpf": "05153743004", "nome": "Entidade Final", "ativo": true, "email": "poipo@uiouoi.di", "setor": "opoipo", "turno": null, "escala": null, "funcao": "poipoi", "perfil": "funcionario", "criado_em": "2026-02-13T02:29:12.970338", "matricula": null, "senha_hash": "$2a$10$tKfPJ7ewfl06WQlr82BgweQzjLCo9/6PZJsgvV5CtpfkCh0Srpmju", "incluido_em": "2026-02-13T02:29:12.970338", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:29:12.970338", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1034, "cpf": "05153743004", "nome": "Entidade Final", "ativo": true, "email": "poipo@uiouoi.di", "setor": "opoipo", "turno": null, "escala": null, "funcao": "poipoi", "perfil": "funcionario", "criado_em": "2026-02-13T02:29:12.970338", "matricula": null, "senha_hash": "$2a$10$tKfPJ7ewfl06WQlr82BgweQzjLCo9/6PZJsgvV5CtpfkCh0Srpmju", "incluido_em": "2026-02-13T02:29:12.970338", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:29:12.970338", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": "2026-02-13T02:39:45.154975", "indice_avaliacao": 9, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-13 02:39:45.154975	\N	\N
361	62745664069	funcionario	UPDATE	avaliacoes	10032	{"id": 10032, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "iniciada", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "62745664069", "motivo_inativacao": null}	{"id": 10032, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "em_andamento", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "62745664069", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 02:41:12.282252	\N	\N
453	26064999055	\N	lote_atualizado	lotes_avaliacao	1024	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1024, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-16 18:38:20.790429	\N	\N
362	62745664069	funcionario	UPDATE	avaliacoes	10032	{"id": 10032, "envio": null, "inicio": "2026-02-13T02:29:33.593", "status": "em_andamento", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:29:32.907947", "funcionario_cpf": "62745664069", "motivo_inativacao": null}	{"id": 10032, "envio": "2026-02-13T02:46:44.678623", "inicio": "2026-02-13T02:29:33.593", "status": "concluida", "lote_id": 1016, "criado_em": "2026-02-13T02:29:32.907947", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:46:44.678623", "funcionario_cpf": "62745664069", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 02:46:44.678623	\N	\N
363	62745664069	funcionario	UPDATE	funcionarios	1032	{"id": 1032, "cpf": "62745664069", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.col", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-13T02:28:36.182785", "matricula": null, "senha_hash": "$2a$10$t0wXXT4G6HnaXF38k1CThOdv2UXsLDfnA82wHNPQIBN1IG2tpB5R2", "incluido_em": "2026-02-13T02:28:36.182785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:28:36.182785", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1032, "cpf": "62745664069", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.col", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-13T02:28:36.182785", "matricula": null, "senha_hash": "$2a$10$t0wXXT4G6HnaXF38k1CThOdv2UXsLDfnA82wHNPQIBN1IG2tpB5R2", "incluido_em": "2026-02-13T02:28:36.182785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:28:36.182785", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-13T02:46:44.678623", "indice_avaliacao": 9, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-13 02:46:44.678623	\N	\N
364	58455720026	rh	INSERT	empresas_clientes	9	\N	{"id": 9, "cep": "83065-370", "cnpj": "91105132000133", "nome": "Empresa RH da clini", "ativa": true, "email": "sdsds@dfdf.com", "cidade": "São José dos Pinhais", "estado": "PR", "endereco": "Rua Antônio Bianchetti, 90", "telefone": "(45) 46545-6465", "criado_em": "2026-02-13T02:51:46.972587", "clinica_id": 111, "atualizado_em": "2026-02-13T02:51:46.972587", "responsavel_email": null, "representante_fone": "45478878877", "representante_nome": "GEsto RH final", "representante_email": "sds@xcxcx.om"}	\N	\N	Record created	2026-02-13 02:51:46.972587	\N	\N
365	58455720026	rh	INSERT	funcionarios	1035	\N	{"id": 1035, "cpf": "41172398054", "nome": "Clinica masc", "ativo": true, "email": "jose53va@empresa.gre", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-13T02:52:24.570994", "matricula": null, "senha_hash": "$2a$10$v7f9/R5Ui7xMV8z76b9NauDgmmj8j0abBkoslByRcEUcOPn00LsW2", "incluido_em": "2026-02-13T02:52:24.570994", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:52:24.570994", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:52:24.570994	\N	\N
366	58455720026	rh	INSERT	funcionarios	1036	\N	{"id": 1036, "cpf": "68889393084", "nome": "Clinica fem", "ativo": true, "email": "reewrrwerweantos@empresa.ytr", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-13T02:52:24.570994", "matricula": null, "senha_hash": "$2a$10$l66p3b9DkmGwzXFnomNs6.drOHoI3UaepT602InJNkbPW8zPclz4.", "incluido_em": "2026-02-13T02:52:24.570994", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-13T02:52:24.570994", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:52:24.570994	\N	\N
367	58455720026	rh	INSERT	funcionarios	1037	\N	{"id": 1037, "cpf": "16871758020", "nome": "Clinica final", "ativo": true, "email": "fdfd@sffs.om", "setor": "kjklj", "turno": null, "escala": null, "funcao": "ljlkjlkj", "perfil": "funcionario", "criado_em": "2026-02-13T02:52:55.250929", "matricula": null, "senha_hash": "$2a$10$1txfoeSgtbTxs8QjaEoz4O9NYLndHI0MqLenzmnLoEoW1IyqkvXD.", "incluido_em": "2026-02-13T02:52:55.250929", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:52:55.250929", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 02:52:55.250929	\N	\N
368	58455720026	rh	UPDATE	funcionarios	1037	{"id": 1037, "cpf": "16871758020", "nome": "Clinica final", "ativo": true, "email": "fdfd@sffs.om", "setor": "kjklj", "turno": null, "escala": null, "funcao": "ljlkjlkj", "perfil": "funcionario", "criado_em": "2026-02-13T02:52:55.250929", "matricula": null, "senha_hash": "$2a$10$1txfoeSgtbTxs8QjaEoz4O9NYLndHI0MqLenzmnLoEoW1IyqkvXD.", "incluido_em": "2026-02-13T02:52:55.250929", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T02:52:55.250929", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1037, "cpf": "16871758020", "nome": "Clinica final", "ativo": false, "email": "fdfd@sffs.om", "setor": "kjklj", "turno": null, "escala": null, "funcao": "ljlkjlkj", "perfil": "funcionario", "criado_em": "2026-02-13T02:52:55.250929", "matricula": null, "senha_hash": "$2a$10$1txfoeSgtbTxs8QjaEoz4O9NYLndHI0MqLenzmnLoEoW1IyqkvXD.", "incluido_em": "2026-02-13T02:52:55.250929", "nivel_cargo": "operacional", "inativado_em": "2026-02-13T02:53:12.816088", "atualizado_em": "2026-02-13T02:52:55.250929", "data_admissao": null, "inativado_por": "58455720026", "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-13 02:53:12.816088	\N	\N
369	58455720026	\N	lote_criado	lotes_avaliacao	1017	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1017, "empresa_id": 9, "numero_ordem": 1}	2026-02-13 02:53:27.28168	\N	\N
370	\N	\N	laudo_criado	laudos	1017	\N	{"status": "rascunho", "lote_id": 1017, "tamanho_pdf": null}	\N	\N	\N	2026-02-13 02:53:27.28168	\N	\N
454	\N	\N	lote_status_change	lotes_avaliacao	1024	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-16 18:38:20.790429	\N	\N
371	58455720026	rh	INSERT	avaliacoes	10033	\N	{"id": 10033, "envio": null, "inicio": "2026-02-13T02:53:28.407", "status": "iniciada", "lote_id": 1017, "criado_em": "2026-02-13T02:53:27.28168", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:53:27.28168", "funcionario_cpf": "68889393084", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 02:53:27.28168	\N	\N
372	58455720026	rh	INSERT	avaliacoes	10034	\N	{"id": 10034, "envio": null, "inicio": "2026-02-13T02:53:28.407", "status": "iniciada", "lote_id": 1017, "criado_em": "2026-02-13T02:53:27.28168", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T02:53:27.28168", "funcionario_cpf": "41172398054", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 02:53:27.28168	\N	\N
373	04703084945	rh	UPDATE	avaliacoes	10021	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "em_andamento", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:49:32.813495", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 12:49:32.813495	\N	\N
374	04703084945	rh	INSERT	funcionarios	1038	\N	{"id": 1038, "cpf": "77093511074", "nome": "teste clicnia", "ativo": true, "email": "uoiuio@dsds.coj", "setor": "ssa", "turno": null, "escala": null, "funcao": "uouoi", "perfil": "funcionario", "criado_em": "2026-02-13T12:50:36.270198", "matricula": null, "senha_hash": "$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze", "incluido_em": "2026-02-13T12:50:36.270198", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T12:50:36.270198", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-13 12:50:36.270198	\N	\N
375	04703084945	\N	lote_criado	lotes_avaliacao	1018	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1018, "empresa_id": 5, "numero_ordem": 5}	2026-02-13 12:52:21.512364	\N	\N
376	\N	\N	laudo_criado	laudos	1018	\N	{"status": "rascunho", "lote_id": 1018, "tamanho_pdf": null}	\N	\N	\N	2026-02-13 12:52:21.512364	\N	\N
377	04703084945	rh	INSERT	avaliacoes	10035	\N	{"id": 10035, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "77093511074", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 12:52:21.512364	\N	\N
378	04703084945	rh	INSERT	avaliacoes	10036	\N	{"id": 10036, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 12:52:21.512364	\N	\N
379	04703084945	rh	INSERT	avaliacoes	10037	\N	{"id": 10037, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record created	2026-02-13 12:52:21.512364	\N	\N
380	77093511074	funcionario	UPDATE	avaliacoes	10035	{"id": 10035, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "77093511074", "motivo_inativacao": null}	{"id": 10035, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "em_andamento", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "77093511074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 12:53:08.839652	\N	\N
381	77093511074	funcionario	UPDATE	avaliacoes	10035	{"id": 10035, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "em_andamento", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "77093511074", "motivo_inativacao": null}	{"id": 10035, "envio": "2026-02-13T13:01:13.834939", "inicio": "2026-02-13T12:52:22.751", "status": "concluida", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T13:01:13.834939", "funcionario_cpf": "77093511074", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-13 13:01:13.834939	\N	\N
382	77093511074	funcionario	UPDATE	funcionarios	1038	{"id": 1038, "cpf": "77093511074", "nome": "teste clicnia", "ativo": true, "email": "uoiuio@dsds.coj", "setor": "ssa", "turno": null, "escala": null, "funcao": "uouoi", "perfil": "funcionario", "criado_em": "2026-02-13T12:50:36.270198", "matricula": null, "senha_hash": "$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze", "incluido_em": "2026-02-13T12:50:36.270198", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T12:50:36.270198", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1038, "cpf": "77093511074", "nome": "teste clicnia", "ativo": true, "email": "uoiuio@dsds.coj", "setor": "ssa", "turno": null, "escala": null, "funcao": "uouoi", "perfil": "funcionario", "criado_em": "2026-02-13T12:50:36.270198", "matricula": null, "senha_hash": "$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze", "incluido_em": "2026-02-13T12:50:36.270198", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T12:50:36.270198", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-13T13:01:13.834939", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-13 13:01:13.834939	\N	\N
468	29930511059	gestor	INSERT	avaliacoes	10049	\N	{"id": 10049, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "60463729099", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 00:20:09.341759	\N	\N
383	04703084945	rh	UPDATE	funcionarios	1015	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": true, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-12T12:31:15.029557", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1015, "cpf": "03175612008", "nome": "DIMore Itali Emp02 online", "ativo": false, "email": "mjdfantos@empresa.cj", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "gestao", "inativado_em": "2026-02-14T12:04:13.698774", "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": "04703084945", "data_nascimento": "1971-09-27", "data_ultimo_lote": "2026-02-12T12:31:15.029557", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-14 12:04:13.698774	\N	\N
384	04703084945	rh	UPDATE	avaliacoes	10020	{"id": 10020, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "inativada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T20:18:46.331071+00:00", "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "03175612008", "motivo_inativacao": "ddfsdsfsdffsdfds"}	{"id": 10020, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "inativada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-12T20:18:46.331071+00:00", "atualizado_em": "2026-02-12T20:18:17.914788", "funcionario_cpf": "03175612008", "motivo_inativacao": "ddfsdsfsdffsdfds"}	\N	\N	Record updated	2026-02-14 12:04:14.668852	\N	\N
385	04703084945	rh	UPDATE	avaliacoes	10036	{"id": 10036, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	{"id": 10036, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "inativada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "03175612008", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-14 12:04:14.668852	\N	\N
386	04703084945	rh	INSERT	funcionarios	1039	\N	{"id": 1039, "cpf": "97687700074", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.coy", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:21:52.758386	\N	\N
387	04703084945	rh	INSERT	funcionarios	1040	\N	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:21:52.758386	\N	\N
388	04703084945	rh	UPDATE	funcionarios	1014	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": true, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-12T12:30:53.219351", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1014, "cpf": "73922219063", "nome": "Jose do Emp02  online", "ativo": false, "email": "rdfs432432233va@eesa.uio", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-10T10:29:30.334004", "matricula": null, "senha_hash": "$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.", "incluido_em": "2026-02-10T10:29:30.334004", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:22:02.0573", "atualizado_em": "2026-02-10T10:29:30.334004", "data_admissao": null, "inativado_por": "04703084945", "data_nascimento": "1974-10-24", "data_ultimo_lote": "2026-02-12T12:30:53.219351", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:22:02.0573	\N	\N
389	04703084945	rh	UPDATE	avaliacoes	10021	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "iniciada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:49:32.813495", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10021, "envio": null, "inicio": "2026-02-12T20:18:19.131", "status": "inativada", "lote_id": 1012, "criado_em": "2026-02-12T20:18:17.914788", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:49:32.813495", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 14:22:02.883381	\N	\N
585	90119869039	\N	lote_atualizado	lotes_avaliacao	1032	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1032, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-18 03:05:33.556727	\N	\N
390	04703084945	rh	UPDATE	avaliacoes	10037	{"id": 10037, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "iniciada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	{"id": 10037, "envio": null, "inicio": "2026-02-13T12:52:22.751", "status": "inativada", "lote_id": 1018, "criado_em": "2026-02-13T12:52:21.512364", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-13T12:52:21.512364", "funcionario_cpf": "73922219063", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 14:22:02.883381	\N	\N
391	04703084945	\N	lote_atualizado	lotes_avaliacao	1018	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1018, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-16 14:22:02.883381	\N	\N
392	\N	\N	lote_status_change	lotes_avaliacao	1018	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-16 14:22:02.883381	\N	\N
393	04703084945	rh	UPDATE	funcionarios	1038	{"id": 1038, "cpf": "77093511074", "nome": "teste clicnia", "ativo": true, "email": "uoiuio@dsds.coj", "setor": "ssa", "turno": null, "escala": null, "funcao": "uouoi", "perfil": "funcionario", "criado_em": "2026-02-13T12:50:36.270198", "matricula": null, "senha_hash": "$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze", "incluido_em": "2026-02-13T12:50:36.270198", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-13T12:50:36.270198", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-13T13:01:13.834939", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1038, "cpf": "77093511074", "nome": "teste clicnia", "ativo": false, "email": "uoiuio@dsds.coj", "setor": "ssa", "turno": null, "escala": null, "funcao": "uouoi", "perfil": "funcionario", "criado_em": "2026-02-13T12:50:36.270198", "matricula": null, "senha_hash": "$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze", "incluido_em": "2026-02-13T12:50:36.270198", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:22:09.590017", "atualizado_em": "2026-02-13T12:50:36.270198", "data_admissao": null, "inativado_por": "04703084945", "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-13T13:01:13.834939", "indice_avaliacao": 5, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:22:09.590017	\N	\N
394	04703084945	\N	lote_criado	lotes_avaliacao	1019	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1019, "empresa_id": 5, "numero_ordem": 6}	2026-02-16 14:23:17.887271	\N	\N
395	\N	\N	laudo_criado	laudos	1019	\N	{"status": "rascunho", "lote_id": 1019, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 14:23:17.887271	\N	\N
396	04703084945	rh	INSERT	avaliacoes	10038	\N	{"id": 10038, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "iniciada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:23:17.887271	\N	\N
397	04703084945	rh	INSERT	avaliacoes	10039	\N	{"id": 10039, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "iniciada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "97687700074", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:23:17.887271	\N	\N
398	04703084945	rh	UPDATE	avaliacoes	10039	{"id": 10039, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "iniciada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "97687700074", "motivo_inativacao": null}	{"id": 10039, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "inativada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T14:24:21.718138+00:00", "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "97687700074", "motivo_inativacao": "tdgsdgsgdssdgdg"}	\N	\N	Record updated	2026-02-16 14:24:21.718138	\N	\N
399	29371145048	funcionario	UPDATE	avaliacoes	10038	{"id": 10038, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "iniciada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	{"id": 10038, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "em_andamento", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 14:24:38.815668	\N	\N
400	70873742060	rh	INSERT	empresas_clientes	10	\N	{"id": 10, "cep": null, "cnpj": "43627564000161", "nome": "TESTE TESTE", "ativa": true, "email": null, "cidade": null, "estado": null, "endereco": null, "telefone": null, "criado_em": "2026-02-16T14:31:27.053862", "clinica_id": 112, "atualizado_em": "2026-02-16T14:31:27.053862", "responsavel_email": null, "representante_fone": "60884086400", "representante_nome": "TESTE TESTE", "representante_email": "FGKDFGHDF@GMAIL.COM"}	\N	\N	Record created	2026-02-16 14:31:27.053862	\N	\N
401	70873742060	rh	INSERT	funcionarios	1041	\N	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": true, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:33:39.207958	\N	\N
469	29930511059	gestor	INSERT	avaliacoes	10050	\N	{"id": 10050, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 00:20:09.341759	\N	\N
471	29930511059	\N	liberar_lote	lotes_avaliacao	1025	\N	\N	177.146.166.16	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1025,"descricao":null,"data_filtro":null,"numero_ordem":10,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-17 00:20:10.765669	\N	\N
402	70873742060	rh	INSERT	funcionarios	1042	\N	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1990-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:33:39.207958	\N	\N
404	70873742060	rh	UPDATE	funcionarios	1041	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": false, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:35:57.994659", "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": true, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:35:57.994659", "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:36:24.805062	\N	\N
422	70873742060	rh	UPDATE	funcionarios	1042	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:47:16.457152	\N	\N
423	70873742060	rh	INSERT	funcionarios	1045	\N	{"id": 1045, "cpf": "96309540017", "nome": "testestestestes", "ativo": true, "email": "sfesdjhjkaffg@gmail.com", "setor": "sefsefse", "turno": null, "escala": null, "funcao": "sfefse", "perfil": "funcionario", "criado_em": "2026-02-16T14:53:34.393186", "matricula": null, "senha_hash": "$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm", "incluido_em": "2026-02-16T14:53:34.393186", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:53:34.393186", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:53:34.393186	\N	\N
424	70873742060	\N	lote_criado	lotes_avaliacao	1022	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1022, "empresa_id": 10, "numero_ordem": 3}	2026-02-16 14:54:08.66088	\N	\N
425	\N	\N	laudo_criado	laudos	1022	\N	{"status": "rascunho", "lote_id": 1022, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 14:54:08.66088	\N	\N
426	70873742060	rh	INSERT	avaliacoes	10042	\N	{"id": 10042, "envio": null, "inicio": "2026-02-16T14:54:09.751", "status": "iniciada", "lote_id": 1022, "criado_em": "2026-02-16T14:54:08.66088", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:54:08.66088", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:54:08.66088	\N	\N
427	70873742060	rh	INSERT	avaliacoes	10043	\N	{"id": 10043, "envio": null, "inicio": "2026-02-16T14:54:09.751", "status": "iniciada", "lote_id": 1022, "criado_em": "2026-02-16T14:54:08.66088", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:54:08.66088", "funcionario_cpf": "96309540017", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:54:08.66088	\N	\N
428	70873742060	rh	INSERT	funcionarios	1046	\N	{"id": 1046, "cpf": "86230028069", "nome": "funcionario pos avaliação", "ativo": true, "email": "SsdfSSDFSDFJKH@GMAIL.COM", "setor": "sdfsdfsdf", "turno": null, "escala": null, "funcao": "sdfSFSDSD", "perfil": "funcionario", "criado_em": "2026-02-16T15:05:08.94392", "matricula": null, "senha_hash": "$2a$10$x5.PLtfIHsrszGcehu189.8oY8IJVWFTTI4.wnhTAhRKwZBSp0ZO.", "incluido_em": "2026-02-16T15:05:08.94392", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T15:05:08.94392", "data_admissao": null, "inativado_por": null, "data_nascimento": "2000-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 15:05:08.94392	\N	\N
403	70873742060	rh	UPDATE	funcionarios	1041	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": true, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": false, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:35:57.994659", "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:35:57.994659	\N	\N
405	29371145048	funcionario	UPDATE	avaliacoes	10038	{"id": 10038, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "em_andamento", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	{"id": 10038, "envio": "2026-02-16T14:36:28.133277", "inicio": "2026-02-16T14:23:19.034", "status": "concluida", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:36:28.133277", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 14:36:28.133277	\N	\N
406	29371145048	\N	lote_atualizado	lotes_avaliacao	1019	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1019, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-16 14:36:28.133277	\N	\N
407	\N	\N	lote_status_change	lotes_avaliacao	1019	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-16 14:36:28.133277	\N	\N
408	29371145048	funcionario	UPDATE	funcionarios	1040	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-16T14:36:28.133277", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:36:28.133277	\N	\N
409	70873742060	rh	UPDATE	funcionarios	1041	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": true, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:35:57.994659", "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1041, "cpf": "97150516009", "nome": "João da Silva", "ativo": false, "email": "joao45.silva@empresa.com.br", "setor": "Administrativo", "turno": "Diurno", "escala": "5x2", "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT001", "senha_hash": "$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:36:42.0676", "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1985-04-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:36:42.0676	\N	\N
410	70873742060	rh	INSERT	funcionarios	1044	\N	{"id": 1044, "cpf": "72255548089", "nome": "testestestes 1", "ativo": true, "email": "fcgdsdfgdfdgdf@gmail.com", "setor": "blabla", "turno": null, "escala": null, "funcao": "teste", "perfil": "funcionario", "criado_em": "2026-02-16T14:37:45.041795", "matricula": null, "senha_hash": "$2a$10$wAlpHj0WXmvrIE91pp/1nuyxrUtnteOREppRgKCUwKgKiP8FT28Ma", "incluido_em": "2026-02-16T14:37:45.041795", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:37:45.041795", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 14:37:45.041795	\N	\N
470	29930511059	gestor	INSERT	avaliacoes	10051	\N	{"id": 10051, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 00:20:09.341759	\N	\N
586	\N	\N	lote_status_change	lotes_avaliacao	1032	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-18 03:05:33.556727	\N	\N
411	70873742060	rh	UPDATE	funcionarios	1044	{"id": 1044, "cpf": "72255548089", "nome": "testestestes 1", "ativo": true, "email": "fcgdsdfgdfdgdf@gmail.com", "setor": "blabla", "turno": null, "escala": null, "funcao": "teste", "perfil": "funcionario", "criado_em": "2026-02-16T14:37:45.041795", "matricula": null, "senha_hash": "$2a$10$wAlpHj0WXmvrIE91pp/1nuyxrUtnteOREppRgKCUwKgKiP8FT28Ma", "incluido_em": "2026-02-16T14:37:45.041795", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:37:45.041795", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1044, "cpf": "72255548089", "nome": "testestestes 1", "ativo": false, "email": "fcgdsdfgdfdgdf@gmail.com", "setor": "blabla", "turno": null, "escala": null, "funcao": "teste", "perfil": "funcionario", "criado_em": "2026-02-16T14:37:45.041795", "matricula": null, "senha_hash": "$2a$10$wAlpHj0WXmvrIE91pp/1nuyxrUtnteOREppRgKCUwKgKiP8FT28Ma", "incluido_em": "2026-02-16T14:37:45.041795", "nivel_cargo": "operacional", "inativado_em": "2026-02-16T14:39:32.171892", "atualizado_em": "2026-02-16T14:37:45.041795", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:39:32.171892	\N	\N
412	70873742060	rh	UPDATE	funcionarios	1042	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1990-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 14:40:06.598927	\N	\N
413	70873742060	\N	lote_criado	lotes_avaliacao	1020	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1020, "empresa_id": 10, "numero_ordem": 1}	2026-02-16 14:41:07.474115	\N	\N
414	\N	\N	laudo_criado	laudos	1020	\N	{"status": "rascunho", "lote_id": 1020, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 14:41:07.474115	\N	\N
415	70873742060	rh	INSERT	avaliacoes	10040	\N	{"id": 10040, "envio": null, "inicio": "2026-02-16T14:41:08.603", "status": "iniciada", "lote_id": 1020, "criado_em": "2026-02-16T14:41:07.474115", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:41:07.474115", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:41:07.474115	\N	\N
416	70873742060	rh	UPDATE	avaliacoes	10040	{"id": 10040, "envio": null, "inicio": "2026-02-16T14:41:08.603", "status": "iniciada", "lote_id": 1020, "criado_em": "2026-02-16T14:41:07.474115", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:41:07.474115", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	{"id": 10040, "envio": null, "inicio": "2026-02-16T14:41:08.603", "status": "inativada", "lote_id": 1020, "criado_em": "2026-02-16T14:41:07.474115", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T14:43:32.278429+00:00", "atualizado_em": "2026-02-16T14:41:07.474115", "funcionario_cpf": "79466202090", "motivo_inativacao": "ssdsdsdsdsdsdsdsdsdsdsdsd"}	\N	\N	Record updated	2026-02-16 14:43:32.278429	\N	\N
417	70873742060	\N	lote_atualizado	lotes_avaliacao	1020	\N	\N	\N	\N	{"status": "cancelado", "lote_id": 1020, "mudancas": {"status_novo": "cancelado", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-16 14:43:34.744744	\N	\N
418	\N	\N	lote_status_change	lotes_avaliacao	1020	{"status": "ativo"}	{"status": "cancelado", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-16 14:43:34.744744	\N	\N
419	70873742060	\N	lote_criado	lotes_avaliacao	1021	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1021, "empresa_id": 10, "numero_ordem": 2}	2026-02-16 14:43:59.088439	\N	\N
420	\N	\N	laudo_criado	laudos	1021	\N	{"status": "rascunho", "lote_id": 1021, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 14:43:59.088439	\N	\N
421	70873742060	rh	INSERT	avaliacoes	10041	\N	{"id": 10041, "envio": null, "inicio": "2026-02-16T14:44:00.177", "status": "iniciada", "lote_id": 1021, "criado_em": "2026-02-16T14:43:59.088439", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:43:59.088439", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 14:43:59.088439	\N	\N
429	70873742060	rh	UPDATE	funcionarios	1045	{"id": 1045, "cpf": "96309540017", "nome": "testestestestes", "ativo": true, "email": "sfesdjhjkaffg@gmail.com", "setor": "sefsefse", "turno": null, "escala": null, "funcao": "sfefse", "perfil": "funcionario", "criado_em": "2026-02-16T14:53:34.393186", "matricula": null, "senha_hash": "$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm", "incluido_em": "2026-02-16T14:53:34.393186", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:53:34.393186", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1045, "cpf": "96309540017", "nome": "testestestestes", "ativo": true, "email": "sfesdjhjkaffg@gmail.com", "setor": "sefsefse", "turno": null, "escala": null, "funcao": "sfefse", "perfil": "funcionario", "criado_em": "2026-02-16T14:53:34.393186", "matricula": null, "senha_hash": "$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm", "incluido_em": "2026-02-16T14:53:34.393186", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:53:34.393186", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 15:42:38.654584	\N	\N
430	70873742060	rh	INSERT	funcionarios	1047	\N	{"id": 1047, "cpf": "74984014016", "nome": "Tste cpf correc", "ativo": true, "email": "oiuoiu@hkjhk.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoiu", "perfil": "funcionario", "criado_em": "2026-02-16T15:53:08.632162", "matricula": null, "senha_hash": "$2a$10$qFy9R7lgXHgBVO2fUB8nl.orriTUMIircFlS2Pje7wvM.cDlz7g/u", "incluido_em": "2026-02-16T15:53:08.632162", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T15:53:08.632162", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 15:53:08.632162	\N	\N
431	70873742060	\N	lote_criado	lotes_avaliacao	1023	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1023, "empresa_id": 10, "numero_ordem": 4}	2026-02-16 15:53:20.61145	\N	\N
432	\N	\N	laudo_criado	laudos	1023	\N	{"status": "rascunho", "lote_id": 1023, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 15:53:20.61145	\N	\N
433	70873742060	rh	INSERT	avaliacoes	10044	\N	{"id": 10044, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 15:53:20.61145	\N	\N
434	70873742060	rh	INSERT	avaliacoes	10045	\N	{"id": 10045, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "74984014016", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 15:53:20.61145	\N	\N
435	70873742060	rh	INSERT	avaliacoes	10046	\N	{"id": 10046, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "86230028069", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 15:53:20.61145	\N	\N
436	70873742060	rh	INSERT	avaliacoes	10047	\N	{"id": 10047, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "96309540017", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 15:53:20.61145	\N	\N
437	70873742060	rh	UPDATE	avaliacoes	10044	{"id": 10044, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "79466202090", "motivo_inativacao": null}	{"id": 10044, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "inativada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T15:54:03.490552+00:00", "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "79466202090", "motivo_inativacao": "vfasffasfasfas"}	\N	\N	Record updated	2026-02-16 15:54:03.490552	\N	\N
438	70873742060	rh	UPDATE	avaliacoes	10046	{"id": 10046, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "86230028069", "motivo_inativacao": null}	{"id": 10046, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "inativada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T15:54:21.469199+00:00", "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "86230028069", "motivo_inativacao": "safsfasafsafasfasf"}	\N	\N	Record updated	2026-02-16 15:54:21.469199	\N	\N
439	70873742060	rh	UPDATE	avaliacoes	10047	{"id": 10047, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "iniciada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "96309540017", "motivo_inativacao": null}	{"id": 10047, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "inativada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T15:54:38.699959+00:00", "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "96309540017", "motivo_inativacao": "safsafsafsasf"}	\N	\N	Record updated	2026-02-16 15:54:38.699959	\N	\N
440	70873742060	rh	UPDATE	funcionarios	1045	{"id": 1045, "cpf": "96309540017", "nome": "testestestestes", "ativo": true, "email": "sfesdjhjkaffg@gmail.com", "setor": "sefsefse", "turno": null, "escala": null, "funcao": "sfefse", "perfil": "funcionario", "criado_em": "2026-02-16T14:53:34.393186", "matricula": null, "senha_hash": "$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm", "incluido_em": "2026-02-16T14:53:34.393186", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:53:34.393186", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1045, "cpf": "96309540017", "nome": "testestestestes", "ativo": false, "email": "sfesdjhjkaffg@gmail.com", "setor": "sefsefse", "turno": null, "escala": null, "funcao": "sfefse", "perfil": "funcionario", "criado_em": "2026-02-16T14:53:34.393186", "matricula": null, "senha_hash": "$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm", "incluido_em": "2026-02-16T14:53:34.393186", "nivel_cargo": "gestao", "inativado_em": "2026-02-16T16:46:11.186586", "atualizado_em": "2026-02-16T14:53:34.393186", "data_admissao": null, "inativado_por": "70873742060", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 16:46:11.186586	\N	\N
441	70873742060	rh	UPDATE	avaliacoes	10043	{"id": 10043, "envio": null, "inicio": "2026-02-16T14:54:09.751", "status": "iniciada", "lote_id": 1022, "criado_em": "2026-02-16T14:54:08.66088", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:54:08.66088", "funcionario_cpf": "96309540017", "motivo_inativacao": null}	{"id": 10043, "envio": null, "inicio": "2026-02-16T14:54:09.751", "status": "inativada", "lote_id": 1022, "criado_em": "2026-02-16T14:54:08.66088", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T14:54:08.66088", "funcionario_cpf": "96309540017", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 16:46:12.149942	\N	\N
442	70873742060	rh	UPDATE	avaliacoes	10047	{"id": 10047, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "inativada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T15:54:38.699959+00:00", "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "96309540017", "motivo_inativacao": "safsafsafsasf"}	{"id": 10047, "envio": null, "inicio": "2026-02-16T15:53:21.903", "status": "inativada", "lote_id": 1023, "criado_em": "2026-02-16T15:53:20.61145", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T15:54:38.699959+00:00", "atualizado_em": "2026-02-16T15:53:20.61145", "funcionario_cpf": "96309540017", "motivo_inativacao": "safsafsafsasf"}	\N	\N	Record updated	2026-02-16 16:46:12.149942	\N	\N
443	70873742060	rh	UPDATE	funcionarios	1047	{"id": 1047, "cpf": "74984014016", "nome": "Tste cpf correc", "ativo": true, "email": "oiuoiu@hkjhk.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoiu", "perfil": "funcionario", "criado_em": "2026-02-16T15:53:08.632162", "matricula": null, "senha_hash": "$2a$10$qFy9R7lgXHgBVO2fUB8nl.orriTUMIircFlS2Pje7wvM.cDlz7g/u", "incluido_em": "2026-02-16T15:53:08.632162", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T15:53:08.632162", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1047, "cpf": "74984014016", "nome": "Tste cpf correc", "ativo": true, "email": "oiuoiu@hkjhk.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiuoiu", "perfil": "funcionario", "criado_em": "2026-02-16T15:53:08.632162", "matricula": null, "senha_hash": "$2a$10$qFy9R7lgXHgBVO2fUB8nl.orriTUMIircFlS2Pje7wvM.cDlz7g/u", "incluido_em": "2026-02-16T15:53:08.632162", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T15:53:08.632162", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 16:54:46.209441	\N	\N
444	70873742060	rh	INSERT	empresas_clientes	11	\N	{"id": 11, "cep": "45678456", "cnpj": "54223491000169", "nome": "Empresa Clin Amanda Ltda", "ativa": true, "email": "dfdsf@afa.com", "cidade": "iopiopipi", "estado": "IO", "endereco": "rua opoipo 234", "telefone": "(46) 54564-6546", "criado_em": "2026-02-16T17:43:31.4948", "clinica_id": 112, "atualizado_em": "2026-02-16T17:43:31.4948", "responsavel_email": null, "representante_fone": "98465465465", "representante_nome": "Tste 1602 clin", "representante_email": "fddfs@sdfsdf.com"}	\N	\N	Record created	2026-02-16 17:43:31.4948	\N	\N
445	70873742060	rh	INSERT	funcionarios	1048	\N	{"id": 1048, "cpf": "75376021076", "nome": "TEstes dfiopip", "ativo": true, "email": "ljkjklkj@dffds.com", "setor": "fdfd", "turno": null, "escala": null, "funcao": "jjlk", "perfil": "funcionario", "criado_em": "2026-02-16T17:45:08.589271", "matricula": null, "senha_hash": "$2a$10$0YTQLU9b5diE3/VCL.KFmeEKyOSFo97dJWG6FUsLXhN3Fs7KChqlS", "incluido_em": "2026-02-16T17:45:08.589271", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T17:45:08.589271", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 17:45:08.589271	\N	\N
446	62985815029	rh	INSERT	empresas_clientes	12	\N	{"id": 12, "cep": "454612456", "cnpj": "32375691000102", "nome": "GEsor Clinex", "ativa": true, "email": "sdfsdf@sadsad.com", "cidade": "sfaasf", "estado": "OP", "endereco": "rua pipoi o3553", "telefone": "(54) 65465-4656", "criado_em": "2026-02-16T18:27:01.456567", "clinica_id": 113, "atualizado_em": "2026-02-16T18:27:01.456567", "responsavel_email": null, "representante_fone": "46546546546", "representante_nome": "Amnada Gestora", "representante_email": "dfdsf@dsfsdf.com"}	\N	\N	Record created	2026-02-16 18:27:01.456567	\N	\N
447	62985815029	rh	INSERT	funcionarios	1049	\N	{"id": 1049, "cpf": "26064999055", "nome": "Joao 02021999", "ativo": true, "email": "oiuuoiuo@dfsdfs.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiiouoi", "perfil": "funcionario", "criado_em": "2026-02-16T18:27:52.933335", "matricula": null, "senha_hash": "$2a$10$7qsnvfoBa89z6tC/iETs.OkBoaE35aHrKqGRSt.FgKGmW/zSFQ8J6", "incluido_em": "2026-02-16T18:27:52.933335", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T18:27:52.933335", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 18:27:52.933335	\N	\N
448	62985815029	\N	lote_criado	lotes_avaliacao	1024	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1024, "empresa_id": 12, "numero_ordem": 1}	2026-02-16 18:28:42.879711	\N	\N
449	\N	\N	laudo_criado	laudos	1024	\N	{"status": "rascunho", "lote_id": 1024, "tamanho_pdf": null}	\N	\N	\N	2026-02-16 18:28:42.879711	\N	\N
450	62985815029	rh	INSERT	avaliacoes	10048	\N	{"id": 10048, "envio": null, "inicio": "2026-02-16T18:28:44.087", "status": "iniciada", "lote_id": 1024, "criado_em": "2026-02-16T18:28:42.879711", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T18:28:42.879711", "funcionario_cpf": "26064999055", "motivo_inativacao": null}	\N	\N	Record created	2026-02-16 18:28:42.879711	\N	\N
451	26064999055	funcionario	UPDATE	avaliacoes	10048	{"id": 10048, "envio": null, "inicio": "2026-02-16T18:28:44.087", "status": "iniciada", "lote_id": 1024, "criado_em": "2026-02-16T18:28:42.879711", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T18:28:42.879711", "funcionario_cpf": "26064999055", "motivo_inativacao": null}	{"id": 10048, "envio": null, "inicio": "2026-02-16T18:28:44.087", "status": "em_andamento", "lote_id": 1024, "criado_em": "2026-02-16T18:28:42.879711", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T18:28:42.879711", "funcionario_cpf": "26064999055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 18:30:20.425342	\N	\N
452	26064999055	funcionario	UPDATE	avaliacoes	10048	{"id": 10048, "envio": null, "inicio": "2026-02-16T18:28:44.087", "status": "em_andamento", "lote_id": 1024, "criado_em": "2026-02-16T18:28:42.879711", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T18:28:42.879711", "funcionario_cpf": "26064999055", "motivo_inativacao": null}	{"id": 10048, "envio": "2026-02-16T18:38:20.790429", "inicio": "2026-02-16T18:28:44.087", "status": "concluida", "lote_id": 1024, "criado_em": "2026-02-16T18:28:42.879711", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-16T18:38:20.790429", "funcionario_cpf": "26064999055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-16 18:38:20.790429	\N	\N
455	26064999055	funcionario	UPDATE	funcionarios	1049	{"id": 1049, "cpf": "26064999055", "nome": "Joao 02021999", "ativo": true, "email": "oiuuoiuo@dfsdfs.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiiouoi", "perfil": "funcionario", "criado_em": "2026-02-16T18:27:52.933335", "matricula": null, "senha_hash": "$2a$10$7qsnvfoBa89z6tC/iETs.OkBoaE35aHrKqGRSt.FgKGmW/zSFQ8J6", "incluido_em": "2026-02-16T18:27:52.933335", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T18:27:52.933335", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1049, "cpf": "26064999055", "nome": "Joao 02021999", "ativo": true, "email": "oiuuoiuo@dfsdfs.com", "setor": "uoiuoi", "turno": null, "escala": null, "funcao": "uoiiouoi", "perfil": "funcionario", "criado_em": "2026-02-16T18:27:52.933335", "matricula": null, "senha_hash": "$2a$10$7qsnvfoBa89z6tC/iETs.OkBoaE35aHrKqGRSt.FgKGmW/zSFQ8J6", "incluido_em": "2026-02-16T18:27:52.933335", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T18:27:52.933335", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-02", "data_ultimo_lote": "2026-02-16T18:38:20.790429", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 18:38:20.790429	\N	\N
456	62985815029	rh	INSERT	funcionarios	1050	\N	{"id": 1050, "cpf": "67758302033", "nome": "Ronaldo 24101974", "ativo": true, "email": "uiouoiuo@jiji.com", "setor": "dsdsa", "turno": null, "escala": null, "funcao": "uoiuoiOUIUOIU", "perfil": "funcionario", "criado_em": "2026-02-16T19:31:57.739081", "matricula": null, "senha_hash": "$2a$10$p9u1C3zzqMhnbIxVMfHMEe8fZ/z650lGocGOQHq.LFuOpQlZAySrK", "incluido_em": "2026-02-16T19:31:57.739081", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T19:31:57.739081", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-16 19:31:57.739081	\N	\N
459	00000000000	\N	UPDATE	funcionarios	1042	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$xNwTAwMQfFveTQgFPM3bMOnU3atvBUfv8ql60UV87Z/H2tr/BZxMS", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1042, "cpf": "79466202090", "nome": "Maria Santos", "ativo": true, "email": "maria45.santos@empresa.com.br", "setor": "Operacional", "turno": "Integral", "escala": "6x1", "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-16T14:33:39.207958", "matricula": "MAT002", "senha_hash": "$2a$10$uWwd3Y6/Ku8L.GsnQTUpg.mjTqlfB1akdJNa.AlnflSeOOjl1v/lq", "incluido_em": "2026-02-16T14:33:39.207958", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:33:39.207958", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-16 21:09:27.991901	\N	\N
460	29930511059	gestor	INSERT	funcionarios	1051	\N	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T00:03:01.059106", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 00:03:01.059106	\N	\N
461	29930511059	gestor	INSERT	funcionarios	1052	\N	{"id": 1052, "cpf": "60463729099", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@empresa.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:03:01.059106", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 00:03:01.059106	\N	\N
464	29930511059	gestor	UPDATE	avaliacoes	10029	{"id": 10029, "envio": null, "inicio": "2026-02-12T23:56:29.87", "status": "iniciada", "lote_id": 1015, "criado_em": "2026-02-12T23:56:29.222814", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-12T23:56:29.222814", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10029, "envio": null, "inicio": "2026-02-12T23:56:29.87", "status": "inativada", "lote_id": 1015, "criado_em": "2026-02-12T23:56:29.222814", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T00:15:23.712643+00:00", "atualizado_em": "2026-02-12T23:56:29.222814", "funcionario_cpf": "34624832000", "motivo_inativacao": "sdgdsdsgdsdsggds"}	\N	\N	Record updated	2026-02-17 00:15:23.712643	\N	\N
467	29930511059	\N	lote_criado	lotes_avaliacao	1025	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1025, "empresa_id": null, "numero_ordem": 10}	2026-02-17 00:20:09.341759	\N	\N
472	29930511059	gestor	UPDATE	avaliacoes	10050	{"id": 10050, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	{"id": 10050, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "inativada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T00:21:25.166916+00:00", "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "03757372000", "motivo_inativacao": "dgdgsdgsdggsdsgd"}	\N	\N	Record updated	2026-02-17 00:21:25.166916	\N	\N
473	29930511059	gestor	UPDATE	funcionarios	1051	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T00:03:01.059106", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T00:21:25.166916", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10050, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:21:25.166916"}	\N	\N	Record updated	2026-02-17 00:21:25.166916	\N	\N
474	60463729099	funcionario	UPDATE	avaliacoes	10049	{"id": 10049, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "60463729099", "motivo_inativacao": null}	{"id": 10049, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "em_andamento", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "60463729099", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 00:21:37.866772	\N	\N
475	29930511059	gestor	UPDATE	avaliacoes	10051	{"id": 10051, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "iniciada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10051, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "inativada", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T00:21:47.762539+00:00", "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "34624832000", "motivo_inativacao": "asfdfadfasasfas"}	\N	\N	Record updated	2026-02-17 00:21:47.762539	\N	\N
476	29930511059	gestor	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-11T00:59:46.425929", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:21:47.762539", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10051, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:21:47.762539"}	\N	\N	Record updated	2026-02-17 00:21:47.762539	\N	\N
477	60463729099	funcionario	UPDATE	avaliacoes	10049	{"id": 10049, "envio": null, "inicio": "2026-02-17T00:20:09.981", "status": "em_andamento", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T00:20:09.341759", "funcionario_cpf": "60463729099", "motivo_inativacao": null}	{"id": 10049, "envio": "2026-02-17T00:44:15.513", "inicio": "2026-02-17T00:20:09.981", "status": "concluida", "lote_id": 1025, "criado_em": "2026-02-17T00:20:09.341759", "grupo_atual": 1, "concluida_em": "2026-02-17T00:44:15.513", "inativada_em": null, "atualizado_em": "2026-02-17T00:44:15.513", "funcionario_cpf": "60463729099", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 00:44:13.186804	\N	\N
478	60463729099	\N	lote_atualizado	lotes_avaliacao	1025	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1025, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-17 00:44:13.186804	\N	\N
479	\N	\N	lote_status_change	lotes_avaliacao	1025	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-17 00:44:13.186804	\N	\N
490	82773181034	funcionario	UPDATE	avaliacoes	10052	{"id": 10052, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "82773181034", "motivo_inativacao": null}	{"id": 10052, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "82773181034", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 13:01:37.252745	\N	\N
480	60463729099	funcionario	UPDATE	funcionarios	1052	{"id": 1052, "cpf": "60463729099", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@empresa.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:03:01.059106", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1052, "cpf": "60463729099", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@empresa.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:44:13.186804", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10049, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:44:15.513"}	\N	\N	Record updated	2026-02-17 00:44:13.186804	\N	\N
481	60463729099	funcionario	UPDATE	funcionarios	1052	{"id": 1052, "cpf": "60463729099", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@empresa.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:44:13.186804", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10049, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:44:15.513"}	{"id": 1052, "cpf": "60463729099", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@empresa.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:44:13.186804", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-17T00:44:13.186804", "indice_avaliacao": 10, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10049, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:44:15.513"}	\N	\N	Record updated	2026-02-17 00:44:13.186804	\N	\N
482	48538520008	gestor	INSERT	funcionarios	1053	\N	{"id": 1053, "cpf": "38409635089", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$XGVHRHoxyBwL8LCHkuppmeL5c7bfHyzcSW9EzkD.I4U3QpZGmQmF2", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T12:59:35.284556", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 12:59:35.284556	\N	\N
483	48538520008	gestor	INSERT	funcionarios	1054	\N	{"id": 1054, "cpf": "82773181034", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T12:59:35.284556", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 12:59:35.284556	\N	\N
484	48538520008	gestor	INSERT	funcionarios	1055	\N	{"id": 1055, "cpf": "22703336080", "nome": "Ronlado 03032003", "ativo": true, "email": "ipoipio@iouuio.com", "setor": "oopioi", "turno": null, "escala": null, "funcao": "opipoipo", "perfil": "funcionario", "criado_em": "2026-02-17T13:00:01.790576", "matricula": null, "senha_hash": "$2a$10$DwxEGxyy1Ir1vtoBQJ07gu9jzv.YVtoHFGVX.nY8cDQszUEJ3oawG", "incluido_em": "2026-02-17T13:00:01.790576", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T13:00:01.790576", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 13:00:01.790576	\N	\N
485	48538520008	\N	lote_criado	lotes_avaliacao	1026	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1026, "empresa_id": null, "numero_ordem": 11}	2026-02-17 13:00:20.583082	\N	\N
486	48538520008	gestor	INSERT	avaliacoes	10052	\N	{"id": 10052, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "82773181034", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 13:00:20.583082	\N	\N
487	48538520008	gestor	INSERT	avaliacoes	10053	\N	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 13:00:20.583082	\N	\N
488	48538520008	gestor	INSERT	avaliacoes	10054	\N	{"id": 10054, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "22703336080", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 13:00:20.583082	\N	\N
489	48538520008	\N	liberar_lote	lotes_avaliacao	1026	\N	\N	177.146.164.76	\N	{"entidade_id":114,"entidade_nome":"Entidade 00","tipo":"completo","lote_id":1026,"descricao":null,"data_filtro":null,"numero_ordem":11,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-17 13:00:22.158542	\N	\N
491	48538520008	gestor	UPDATE	avaliacoes	10054	{"id": 10054, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "22703336080", "motivo_inativacao": null}	{"id": 10054, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "inativada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T13:01:54.904018+00:00", "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "22703336080", "motivo_inativacao": "tewet dsdssdgds"}	\N	\N	Record updated	2026-02-17 13:01:54.904018	\N	\N
492	48538520008	gestor	UPDATE	funcionarios	1055	{"id": 1055, "cpf": "22703336080", "nome": "Ronlado 03032003", "ativo": true, "email": "ipoipio@iouuio.com", "setor": "oopioi", "turno": null, "escala": null, "funcao": "opipoipo", "perfil": "funcionario", "criado_em": "2026-02-17T13:00:01.790576", "matricula": null, "senha_hash": "$2a$10$DwxEGxyy1Ir1vtoBQJ07gu9jzv.YVtoHFGVX.nY8cDQszUEJ3oawG", "incluido_em": "2026-02-17T13:00:01.790576", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T13:00:01.790576", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1055, "cpf": "22703336080", "nome": "Ronlado 03032003", "ativo": true, "email": "ipoipio@iouuio.com", "setor": "oopioi", "turno": null, "escala": null, "funcao": "opipoipo", "perfil": "funcionario", "criado_em": "2026-02-17T13:00:01.790576", "matricula": null, "senha_hash": "$2a$10$DwxEGxyy1Ir1vtoBQJ07gu9jzv.YVtoHFGVX.nY8cDQszUEJ3oawG", "incluido_em": "2026-02-17T13:00:01.790576", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T13:01:54.904018", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10054, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T13:01:54.904018"}	\N	\N	Record updated	2026-02-17 13:01:54.904018	\N	\N
493	38409635089	funcionario	UPDATE	avaliacoes	10053	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 13:05:48.355011	\N	\N
494	48538520008	gestor	UPDATE	avaliacoes	10053	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:06:13.377078", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 13:06:13.377078	\N	\N
495	38409635089	funcionario	UPDATE	avaliacoes	10053	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "iniciada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:06:13.377078", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:06:24.563064", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 13:06:24.563064	\N	\N
496	48538520008	gestor	UPDATE	avaliacoes	10053	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:06:24.563064", "funcionario_cpf": "38409635089", "motivo_inativacao": null}	{"id": 10053, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "inativada", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T13:07:13.971328+00:00", "atualizado_em": "2026-02-17T13:06:24.563064", "funcionario_cpf": "38409635089", "motivo_inativacao": "dgdsgdgdgdgdgdgd"}	\N	\N	Record updated	2026-02-17 13:07:13.971328	\N	\N
497	48538520008	gestor	UPDATE	funcionarios	1053	{"id": 1053, "cpf": "38409635089", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$XGVHRHoxyBwL8LCHkuppmeL5c7bfHyzcSW9EzkD.I4U3QpZGmQmF2", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T12:59:35.284556", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1053, "cpf": "38409635089", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$XGVHRHoxyBwL8LCHkuppmeL5c7bfHyzcSW9EzkD.I4U3QpZGmQmF2", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T13:07:13.971328", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10053, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T13:07:13.971328"}	\N	\N	Record updated	2026-02-17 13:07:13.971328	\N	\N
540	29930511059	\N	lote_criado	lotes_avaliacao	1029	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1029, "empresa_id": null, "numero_ordem": 12}	2026-02-17 19:34:09.774335	\N	\N
498	82773181034	funcionario	UPDATE	avaliacoes	10052	{"id": 10052, "envio": null, "inicio": "2026-02-17T13:00:21.275", "status": "em_andamento", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T13:00:20.583082", "funcionario_cpf": "82773181034", "motivo_inativacao": null}	{"id": 10052, "envio": "2026-02-17T13:08:36.231", "inicio": "2026-02-17T13:00:21.275", "status": "concluida", "lote_id": 1026, "criado_em": "2026-02-17T13:00:20.583082", "grupo_atual": 1, "concluida_em": "2026-02-17T13:08:36.231", "inativada_em": null, "atualizado_em": "2026-02-17T13:08:36.231", "funcionario_cpf": "82773181034", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 13:08:33.920096	\N	\N
499	82773181034	\N	lote_atualizado	lotes_avaliacao	1026	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1026, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-17 13:08:33.920096	\N	\N
500	\N	\N	lote_status_change	lotes_avaliacao	1026	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-17 13:08:33.920096	\N	\N
501	82773181034	funcionario	UPDATE	funcionarios	1054	{"id": 1054, "cpf": "82773181034", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T12:59:35.284556", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1054, "cpf": "82773181034", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T13:08:33.920096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10052, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T13:08:36.231"}	\N	\N	Record updated	2026-02-17 13:08:33.920096	\N	\N
502	82773181034	funcionario	UPDATE	funcionarios	1054	{"id": 1054, "cpf": "82773181034", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T13:08:33.920096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10052, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T13:08:36.231"}	{"id": 1054, "cpf": "82773181034", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.re", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T12:59:35.284556", "matricula": null, "senha_hash": "$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC", "incluido_em": "2026-02-17T12:59:35.284556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T13:08:33.920096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-17T13:08:33.920096", "indice_avaliacao": 11, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10052, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T13:08:36.231"}	\N	\N	Record updated	2026-02-17 13:08:33.920096	\N	\N
503	\N	\N	laudo_criado	laudos	1026	\N	{"status": "rascunho", "lote_id": 1026, "tamanho_pdf": null}	\N	\N	\N	2026-02-17 14:09:56.862043	\N	\N
504	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1026	\N	{"lote_id": 1026, "file_size": 579348, "duration_ms": 2401, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1026/laudo-1771339091272-j6fndo.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1026/laudo-1771339091272-j6fndo.pdf"}	\N	\N	\N	2026-02-17 14:38:07.702024	\N	\N
505	31777317053	rh	INSERT	empresas_clientes	13	\N	{"id": 13, "cep": "45612789", "cnpj": "00790746000146", "nome": "Empresa Clinica End", "ativa": true, "email": "dsfsdf@sadffas.com", "cidade": "fdsdd", "estado": "OP", "endereco": "rua ljlko 908098", "telefone": "(46) 45646-5466", "criado_em": "2026-02-17T16:15:34.199728", "clinica_id": 115, "atualizado_em": "2026-02-17T16:15:34.199728", "responsavel_email": null, "representante_fone": "77464654666", "representante_nome": "Romalo fdoipoipo", "representante_email": "dsfdsf@dsfdsf.co"}	\N	\N	Record created	2026-02-17 16:15:34.199728	\N	\N
506	31777317053	rh	INSERT	funcionarios	1056	\N	{"id": 1056, "cpf": "28917134009", "nome": "Clinia 03032003", "ativo": true, "email": "effs@dsds.co", "setor": "sfasf", "turno": null, "escala": null, "funcao": "sdfsd", "perfil": "funcionario", "criado_em": "2026-02-17T16:16:53.13207", "matricula": null, "senha_hash": "$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq", "incluido_em": "2026-02-17T16:16:53.13207", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:16:53.13207", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 16:16:53.13207	\N	\N
507	31777317053	rh	INSERT	funcionarios	1057	\N	{"id": 1057, "cpf": "91275973000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$PEbTaQTj7y7nzli.V8LT6O4rJ8qmit9FR.low0i1OjK4KYfP9FIA.", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:17:09.123499", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 16:17:09.123499	\N	\N
508	31777317053	rh	INSERT	funcionarios	1058	\N	{"id": 1058, "cpf": "59557041080", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$5kd0VwN0oPlAYC1ru/J.dOFslqRfbUcdadWTaTS3R9oP7XmkX5EEu", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T16:17:09.123499", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 16:17:09.123499	\N	\N
509	31777317053	\N	lote_criado	lotes_avaliacao	1027	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1027, "empresa_id": 13, "numero_ordem": 1}	2026-02-17 16:17:22.406893	\N	\N
510	\N	\N	laudo_criado	laudos	1027	\N	{"status": "rascunho", "lote_id": 1027, "tamanho_pdf": null}	\N	\N	\N	2026-02-17 16:17:22.406893	\N	\N
511	31777317053	rh	INSERT	avaliacoes	10055	\N	{"id": 10055, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "28917134009", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 16:17:22.406893	\N	\N
512	31777317053	rh	INSERT	avaliacoes	10056	\N	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 16:17:22.406893	\N	\N
513	31777317053	rh	INSERT	avaliacoes	10057	\N	{"id": 10057, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "91275973000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 16:17:22.406893	\N	\N
514	28917134009	funcionario	UPDATE	avaliacoes	10055	{"id": 10055, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "28917134009", "motivo_inativacao": null}	{"id": 10055, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "28917134009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 16:18:40.747159	\N	\N
515	31777317053	rh	UPDATE	avaliacoes	10057	{"id": 10057, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "91275973000", "motivo_inativacao": null}	{"id": 10057, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "inativada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T16:18:45.713926+00:00", "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "91275973000", "motivo_inativacao": "ljlkjlklklkjlk"}	\N	\N	Record updated	2026-02-17 16:18:45.713926	\N	\N
516	31777317053	rh	UPDATE	funcionarios	1057	{"id": 1057, "cpf": "91275973000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$PEbTaQTj7y7nzli.V8LT6O4rJ8qmit9FR.low0i1OjK4KYfP9FIA.", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:17:09.123499", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1057, "cpf": "91275973000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$PEbTaQTj7y7nzli.V8LT6O4rJ8qmit9FR.low0i1OjK4KYfP9FIA.", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:18:45.713926", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10057, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:18:45.713926"}	\N	\N	Record updated	2026-02-17 16:18:45.713926	\N	\N
517	59557041080	funcionario	UPDATE	avaliacoes	10056	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 16:19:40.012002	\N	\N
518	31777317053	rh	UPDATE	avaliacoes	10056	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:20:12.905632", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 16:20:12.905632	\N	\N
541	29930511059	gestor	INSERT	avaliacoes	10059	\N	{"id": 10059, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 19:34:09.774335	\N	\N
519	59557041080	funcionario	UPDATE	avaliacoes	10056	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "iniciada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:20:12.905632", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:20:12.905632", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 16:20:47.29271	\N	\N
527	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1027	\N	{"lote_id": 1027, "file_size": 640776, "duration_ms": 2597, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1027/laudo-1771345848652-x2oidr.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1027/laudo-1771345848652-x2oidr.pdf"}	\N	\N	\N	2026-02-17 16:30:45.244437	\N	\N
520	31777317053	rh	UPDATE	avaliacoes	10056	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:20:12.905632", "funcionario_cpf": "59557041080", "motivo_inativacao": null}	{"id": 10056, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "inativada", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T16:21:39.699496+00:00", "atualizado_em": "2026-02-17T16:20:12.905632", "funcionario_cpf": "59557041080", "motivo_inativacao": "uiouiouoi oiuoiuoiuio"}	\N	\N	Record updated	2026-02-17 16:21:39.699496	\N	\N
521	31777317053	rh	UPDATE	funcionarios	1058	{"id": 1058, "cpf": "59557041080", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$5kd0VwN0oPlAYC1ru/J.dOFslqRfbUcdadWTaTS3R9oP7XmkX5EEu", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T16:17:09.123499", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1058, "cpf": "59557041080", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-17T16:17:09.123499", "matricula": null, "senha_hash": "$2a$10$5kd0VwN0oPlAYC1ru/J.dOFslqRfbUcdadWTaTS3R9oP7XmkX5EEu", "incluido_em": "2026-02-17T16:17:09.123499", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T16:21:39.699496", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10056, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:21:39.699496"}	\N	\N	Record updated	2026-02-17 16:21:39.699496	\N	\N
522	28917134009	funcionario	UPDATE	avaliacoes	10055	{"id": 10055, "envio": null, "inicio": "2026-02-17T16:17:23.523", "status": "em_andamento", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T16:17:22.406893", "funcionario_cpf": "28917134009", "motivo_inativacao": null}	{"id": 10055, "envio": "2026-02-17T16:23:23.636", "inicio": "2026-02-17T16:17:23.523", "status": "concluida", "lote_id": 1027, "criado_em": "2026-02-17T16:17:22.406893", "grupo_atual": 1, "concluida_em": "2026-02-17T16:23:23.636", "inativada_em": null, "atualizado_em": "2026-02-17T16:23:23.636", "funcionario_cpf": "28917134009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 16:23:21.273647	\N	\N
523	28917134009	\N	lote_atualizado	lotes_avaliacao	1027	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1027, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-17 16:23:21.273647	\N	\N
524	\N	\N	lote_status_change	lotes_avaliacao	1027	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-17 16:23:21.273647	\N	\N
525	28917134009	funcionario	UPDATE	funcionarios	1056	{"id": 1056, "cpf": "28917134009", "nome": "Clinia 03032003", "ativo": true, "email": "effs@dsds.co", "setor": "sfasf", "turno": null, "escala": null, "funcao": "sdfsd", "perfil": "funcionario", "criado_em": "2026-02-17T16:16:53.13207", "matricula": null, "senha_hash": "$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq", "incluido_em": "2026-02-17T16:16:53.13207", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:16:53.13207", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1056, "cpf": "28917134009", "nome": "Clinia 03032003", "ativo": true, "email": "effs@dsds.co", "setor": "sfasf", "turno": null, "escala": null, "funcao": "sdfsd", "perfil": "funcionario", "criado_em": "2026-02-17T16:16:53.13207", "matricula": null, "senha_hash": "$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq", "incluido_em": "2026-02-17T16:16:53.13207", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:23:21.273647", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10055, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:23:23.636"}	\N	\N	Record updated	2026-02-17 16:23:21.273647	\N	\N
526	28917134009	funcionario	UPDATE	funcionarios	1056	{"id": 1056, "cpf": "28917134009", "nome": "Clinia 03032003", "ativo": true, "email": "effs@dsds.co", "setor": "sfasf", "turno": null, "escala": null, "funcao": "sdfsd", "perfil": "funcionario", "criado_em": "2026-02-17T16:16:53.13207", "matricula": null, "senha_hash": "$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq", "incluido_em": "2026-02-17T16:16:53.13207", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:23:21.273647", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10055, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:23:23.636"}	{"id": 1056, "cpf": "28917134009", "nome": "Clinia 03032003", "ativo": true, "email": "effs@dsds.co", "setor": "sfasf", "turno": null, "escala": null, "funcao": "sdfsd", "perfil": "funcionario", "criado_em": "2026-02-17T16:16:53.13207", "matricula": null, "senha_hash": "$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq", "incluido_em": "2026-02-17T16:16:53.13207", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T16:23:21.273647", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": "2026-02-17T16:23:21.273647", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10055, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:23:23.636"}	\N	\N	Record updated	2026-02-17 16:23:21.273647	\N	\N
528	04703084945	rh	INSERT	empresas_clientes	14	\N	{"id": 14, "cep": "45612456", "cnpj": "40337270000107", "nome": "Empres clin 02", "ativa": true, "email": "cffas@sfddsf.oj", "cidade": "ddsfd", "estado": "PO", "endereco": "rua ljijio 890", "telefone": "(65) 46545-6465", "criado_em": "2026-02-17T19:30:08.900293", "clinica_id": 104, "atualizado_em": "2026-02-17T19:30:08.900293", "responsavel_email": null, "representante_fone": "64546546546", "representante_nome": "Robero pipoipoi", "representante_email": "46545@dfsfd.com"}	\N	\N	Record created	2026-02-17 19:30:08.900293	\N	\N
529	04703084945	rh	INSERT	funcionarios	1059	\N	{"id": 1059, "cpf": "66844689004", "nome": "reipo 04042004", "ativo": true, "email": "sdsdf@kovo.com", "setor": "fdsfd", "turno": null, "escala": null, "funcao": "fsfd", "perfil": "funcionario", "criado_em": "2026-02-17T19:31:06.056481", "matricula": null, "senha_hash": "$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq", "incluido_em": "2026-02-17T19:31:06.056481", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:31:06.056481", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 19:31:06.056481	\N	\N
530	04703084945	\N	lote_criado	lotes_avaliacao	1028	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1028, "empresa_id": 14, "numero_ordem": 1}	2026-02-17 19:31:13.767633	\N	\N
531	\N	\N	laudo_criado	laudos	1028	\N	{"status": "rascunho", "lote_id": 1028, "tamanho_pdf": null}	\N	\N	\N	2026-02-17 19:31:13.767633	\N	\N
532	04703084945	rh	INSERT	avaliacoes	10058	\N	{"id": 10058, "envio": null, "inicio": "2026-02-17T19:31:19.93", "status": "iniciada", "lote_id": 1028, "criado_em": "2026-02-17T19:31:13.767633", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:31:13.767633", "funcionario_cpf": "66844689004", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 19:31:13.767633	\N	\N
533	66844689004	funcionario	UPDATE	avaliacoes	10058	{"id": 10058, "envio": null, "inicio": "2026-02-17T19:31:19.93", "status": "iniciada", "lote_id": 1028, "criado_em": "2026-02-17T19:31:13.767633", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:31:13.767633", "funcionario_cpf": "66844689004", "motivo_inativacao": null}	{"id": 10058, "envio": null, "inicio": "2026-02-17T19:31:19.93", "status": "em_andamento", "lote_id": 1028, "criado_em": "2026-02-17T19:31:13.767633", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:31:13.767633", "funcionario_cpf": "66844689004", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 19:32:01.552463	\N	\N
534	66844689004	funcionario	UPDATE	avaliacoes	10058	{"id": 10058, "envio": null, "inicio": "2026-02-17T19:31:19.93", "status": "em_andamento", "lote_id": 1028, "criado_em": "2026-02-17T19:31:13.767633", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:31:13.767633", "funcionario_cpf": "66844689004", "motivo_inativacao": null}	{"id": 10058, "envio": "2026-02-17T16:32:34.205", "inicio": "2026-02-17T19:31:19.93", "status": "concluida", "lote_id": 1028, "criado_em": "2026-02-17T19:31:13.767633", "grupo_atual": 1, "concluida_em": "2026-02-17T16:32:34.205", "inativada_em": null, "atualizado_em": "2026-02-17T16:32:34.205", "funcionario_cpf": "66844689004", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 19:32:27.978558	\N	\N
535	66844689004	\N	lote_atualizado	lotes_avaliacao	1028	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1028, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-17 19:32:27.978558	\N	\N
536	\N	\N	lote_status_change	lotes_avaliacao	1028	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-17 19:32:27.978558	\N	\N
537	66844689004	funcionario	UPDATE	funcionarios	1059	{"id": 1059, "cpf": "66844689004", "nome": "reipo 04042004", "ativo": true, "email": "sdsdf@kovo.com", "setor": "fdsfd", "turno": null, "escala": null, "funcao": "fsfd", "perfil": "funcionario", "criado_em": "2026-02-17T19:31:06.056481", "matricula": null, "senha_hash": "$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq", "incluido_em": "2026-02-17T19:31:06.056481", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:31:06.056481", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1059, "cpf": "66844689004", "nome": "reipo 04042004", "ativo": true, "email": "sdsdf@kovo.com", "setor": "fdsfd", "turno": null, "escala": null, "funcao": "fsfd", "perfil": "funcionario", "criado_em": "2026-02-17T19:31:06.056481", "matricula": null, "senha_hash": "$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq", "incluido_em": "2026-02-17T19:31:06.056481", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:32:27.978558", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10058, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:32:34.205"}	\N	\N	Record updated	2026-02-17 19:32:27.978558	\N	\N
538	66844689004	funcionario	UPDATE	funcionarios	1059	{"id": 1059, "cpf": "66844689004", "nome": "reipo 04042004", "ativo": true, "email": "sdsdf@kovo.com", "setor": "fdsfd", "turno": null, "escala": null, "funcao": "fsfd", "perfil": "funcionario", "criado_em": "2026-02-17T19:31:06.056481", "matricula": null, "senha_hash": "$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq", "incluido_em": "2026-02-17T19:31:06.056481", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:32:27.978558", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10058, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:32:34.205"}	{"id": 1059, "cpf": "66844689004", "nome": "reipo 04042004", "ativo": true, "email": "sdsdf@kovo.com", "setor": "fdsfd", "turno": null, "escala": null, "funcao": "fsfd", "perfil": "funcionario", "criado_em": "2026-02-17T19:31:06.056481", "matricula": null, "senha_hash": "$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq", "incluido_em": "2026-02-17T19:31:06.056481", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:32:27.978558", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": "2026-02-17T19:32:27.978558", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10058, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:32:34.205"}	\N	\N	Record updated	2026-02-17 19:32:27.978558	\N	\N
539	29930511059	gestor	INSERT	funcionarios	1060	\N	{"id": 1060, "cpf": "88931335040", "nome": "jpo 05052005", "ativo": true, "email": "fadfa@dsffds.cd", "setor": "sffas", "turno": null, "escala": null, "funcao": "afaf", "perfil": "funcionario", "criado_em": "2026-02-17T19:34:03.253818", "matricula": null, "senha_hash": "$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.", "incluido_em": "2026-02-17T19:34:03.253818", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:34:03.253818", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-17 19:34:03.253818	\N	\N
542	29930511059	gestor	INSERT	avaliacoes	10060	\N	{"id": 10060, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 19:34:09.774335	\N	\N
543	29930511059	gestor	INSERT	avaliacoes	10061	\N	{"id": 10061, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "88931335040", "motivo_inativacao": null}	\N	\N	Record created	2026-02-17 19:34:09.774335	\N	\N
544	29930511059	\N	liberar_lote	lotes_avaliacao	1029	\N	\N	::1	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1029,"descricao":null,"data_filtro":null,"numero_ordem":12,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-17 19:34:09.882616	\N	\N
545	88931335040	funcionario	UPDATE	avaliacoes	10061	{"id": 10061, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "88931335040", "motivo_inativacao": null}	{"id": 10061, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "em_andamento", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "88931335040", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 19:34:54.467604	\N	\N
546	88931335040	funcionario	UPDATE	avaliacoes	10061	{"id": 10061, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "em_andamento", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "88931335040", "motivo_inativacao": null}	{"id": 10061, "envio": "2026-02-17T16:35:22.123", "inicio": "2026-02-17T19:34:15.778", "status": "concluida", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": "2026-02-17T16:35:22.123", "inativada_em": null, "atualizado_em": "2026-02-17T16:35:22.123", "funcionario_cpf": "88931335040", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-17 19:35:15.907672	\N	\N
547	88931335040	funcionario	UPDATE	funcionarios	1060	{"id": 1060, "cpf": "88931335040", "nome": "jpo 05052005", "ativo": true, "email": "fadfa@dsffds.cd", "setor": "sffas", "turno": null, "escala": null, "funcao": "afaf", "perfil": "funcionario", "criado_em": "2026-02-17T19:34:03.253818", "matricula": null, "senha_hash": "$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.", "incluido_em": "2026-02-17T19:34:03.253818", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:34:03.253818", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1060, "cpf": "88931335040", "nome": "jpo 05052005", "ativo": true, "email": "fadfa@dsffds.cd", "setor": "sffas", "turno": null, "escala": null, "funcao": "afaf", "perfil": "funcionario", "criado_em": "2026-02-17T19:34:03.253818", "matricula": null, "senha_hash": "$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.", "incluido_em": "2026-02-17T19:34:03.253818", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:35:15.907672", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10061, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:35:22.123"}	\N	\N	Record updated	2026-02-17 19:35:15.907672	\N	\N
548	88931335040	funcionario	UPDATE	funcionarios	1060	{"id": 1060, "cpf": "88931335040", "nome": "jpo 05052005", "ativo": true, "email": "fadfa@dsffds.cd", "setor": "sffas", "turno": null, "escala": null, "funcao": "afaf", "perfil": "funcionario", "criado_em": "2026-02-17T19:34:03.253818", "matricula": null, "senha_hash": "$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.", "incluido_em": "2026-02-17T19:34:03.253818", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:35:15.907672", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10061, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:35:22.123"}	{"id": 1060, "cpf": "88931335040", "nome": "jpo 05052005", "ativo": true, "email": "fadfa@dsffds.cd", "setor": "sffas", "turno": null, "escala": null, "funcao": "afaf", "perfil": "funcionario", "criado_em": "2026-02-17T19:34:03.253818", "matricula": null, "senha_hash": "$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.", "incluido_em": "2026-02-17T19:34:03.253818", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T19:35:15.907672", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": "2026-02-17T19:35:15.907672", "indice_avaliacao": 12, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10061, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T16:35:22.123"}	\N	\N	Record updated	2026-02-17 19:35:15.907672	\N	\N
549	29930511059	gestor	UPDATE	avaliacoes	10060	{"id": 10060, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10060, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "inativada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T21:34:54.134093+00:00", "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "34624832000", "motivo_inativacao": "gdsdgdsgdsdsgg"}	\N	\N	Record updated	2026-02-17 21:34:54.134093	\N	\N
550	29930511059	gestor	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T00:21:47.762539", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10051, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:21:47.762539"}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T21:34:54.134093", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10060, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T21:34:54.134093"}	\N	\N	Record updated	2026-02-17 21:34:54.134093	\N	\N
551	29930511059	gestor	UPDATE	avaliacoes	10059	{"id": 10059, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "iniciada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	{"id": 10059, "envio": null, "inicio": "2026-02-17T19:34:15.778", "status": "inativada", "lote_id": 1029, "criado_em": "2026-02-17T19:34:09.774335", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-17T21:35:03.243449+00:00", "atualizado_em": "2026-02-17T19:34:09.774335", "funcionario_cpf": "03757372000", "motivo_inativacao": "gdsdgsgsgdssdgds"}	\N	\N	Record updated	2026-02-17 21:35:03.243449	\N	\N
552	29930511059	\N	lote_atualizado	lotes_avaliacao	1029	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1029, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-17 21:35:03.243449	\N	\N
553	\N	\N	lote_status_change	lotes_avaliacao	1029	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-17 21:35:03.243449	\N	\N
554	29930511059	gestor	UPDATE	funcionarios	1051	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T00:21:25.166916", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10050, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T00:21:25.166916"}	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T21:35:03.243449", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10059, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T21:35:03.243449"}	\N	\N	Record updated	2026-02-17 21:35:03.243449	\N	\N
555	\N	\N	laudo_criado	laudos	1029	\N	{"status": "rascunho", "lote_id": 1029, "tamanho_pdf": null}	\N	\N	\N	2026-02-18 01:35:12.075479	\N	\N
556	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1029	\N	{"lote_id": 1029, "file_size": 627632, "duration_ms": 2829, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1029/laudo-1771378547237-kvkkbs.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1029/laudo-1771378547237-kvkkbs.pdf"}	\N	\N	\N	2026-02-18 01:35:43.969403	\N	\N
557	29930511059	\N	lote_criado	lotes_avaliacao	1030	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1030, "empresa_id": null, "numero_ordem": 13}	2026-02-18 02:19:37.269912	\N	\N
558	29930511059	gestor	INSERT	avaliacoes	10062	\N	{"id": 10062, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "iniciada", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-18 02:19:37.269912	\N	\N
559	29930511059	gestor	INSERT	avaliacoes	10063	\N	{"id": 10063, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "iniciada", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-18 02:19:37.269912	\N	\N
560	29930511059	\N	liberar_lote	lotes_avaliacao	1030	\N	\N	::1	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1030,"descricao":null,"data_filtro":null,"numero_ordem":13,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-18 02:19:37.500939	\N	\N
561	03757372000	funcionario	UPDATE	avaliacoes	10062	{"id": 10062, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "iniciada", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	{"id": 10062, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "em_andamento", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 02:20:27.006183	\N	\N
562	03757372000	funcionario	UPDATE	avaliacoes	10062	{"id": 10062, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "em_andamento", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	{"id": 10062, "envio": "2026-02-17T23:20:56.205", "inicio": "2026-02-18T02:19:43.494", "status": "concluida", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": "2026-02-17T23:20:56.205", "inativada_em": null, "atualizado_em": "2026-02-17T23:20:56.205", "funcionario_cpf": "03757372000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 02:20:49.848543	\N	\N
572	04703084945	rh	INSERT	avaliacoes	10064	\N	{"id": 10064, "envio": null, "inicio": "2026-02-18T02:39:05.176", "status": "iniciada", "lote_id": 1031, "criado_em": "2026-02-18T02:38:58.852216", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:38:58.852216", "funcionario_cpf": "17503742003", "motivo_inativacao": null}	\N	\N	Record created	2026-02-18 02:38:58.852216	\N	\N
573	17503742003	funcionario	UPDATE	avaliacoes	10064	{"id": 10064, "envio": null, "inicio": "2026-02-18T02:39:05.176", "status": "iniciada", "lote_id": 1031, "criado_em": "2026-02-18T02:38:58.852216", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:38:58.852216", "funcionario_cpf": "17503742003", "motivo_inativacao": null}	{"id": 10064, "envio": null, "inicio": "2026-02-18T02:39:05.176", "status": "em_andamento", "lote_id": 1031, "criado_em": "2026-02-18T02:38:58.852216", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:38:58.852216", "funcionario_cpf": "17503742003", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 02:39:56.372477	\N	\N
563	03757372000	funcionario	UPDATE	funcionarios	1051	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-17T21:35:03.243449", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10059, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T21:35:03.243449"}	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:20:49.848543", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10062, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:20:56.205"}	\N	\N	Record updated	2026-02-18 02:20:49.848543	\N	\N
564	03757372000	funcionario	UPDATE	funcionarios	1051	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:20:49.848543", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10062, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:20:56.205"}	{"id": 1051, "cpf": "03757372000", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empresa.qwe", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-17T00:03:01.059106", "matricula": null, "senha_hash": "$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.", "incluido_em": "2026-02-17T00:03:01.059106", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:20:49.848543", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-18T02:20:49.848543", "indice_avaliacao": 13, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10062, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:20:56.205"}	\N	\N	Record updated	2026-02-18 02:20:49.848543	\N	\N
565	29930511059	gestor	UPDATE	avaliacoes	10063	{"id": 10063, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "iniciada", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10063, "envio": null, "inicio": "2026-02-18T02:19:43.494", "status": "inativada", "lote_id": 1030, "criado_em": "2026-02-18T02:19:37.269912", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-18T02:21:14.537931+00:00", "atualizado_em": "2026-02-18T02:19:37.269912", "funcionario_cpf": "34624832000", "motivo_inativacao": "fasfsaafsafsa"}	\N	\N	Record updated	2026-02-18 02:21:14.537931	\N	\N
566	29930511059	\N	lote_atualizado	lotes_avaliacao	1030	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1030, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-18 02:21:14.537931	\N	\N
567	\N	\N	lote_status_change	lotes_avaliacao	1030	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-18 02:21:14.537931	\N	\N
568	29930511059	gestor	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-17T21:34:54.134093", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10060, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T21:34:54.134093"}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-18T02:21:14.537931", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10063, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T02:21:14.537931"}	\N	\N	Record updated	2026-02-18 02:21:14.537931	\N	\N
569	04703084945	rh	INSERT	funcionarios	1061	\N	{"id": 1061, "cpf": "17503742003", "nome": "Ale 05052005", "ativo": true, "email": "oiuoiuio@sssf.cv", "setor": "uiouiou", "turno": null, "escala": null, "funcao": "ouoiu", "perfil": "funcionario", "criado_em": "2026-02-18T02:38:51.259447", "matricula": null, "senha_hash": "$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO", "incluido_em": "2026-02-18T02:38:51.259447", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:38:51.259447", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-18 02:38:51.259447	\N	\N
570	04703084945	\N	lote_criado	lotes_avaliacao	1031	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1031, "empresa_id": 14, "numero_ordem": 2}	2026-02-18 02:38:58.852216	\N	\N
571	\N	\N	laudo_criado	laudos	1031	\N	{"status": "rascunho", "lote_id": 1031, "tamanho_pdf": null}	\N	\N	\N	2026-02-18 02:38:58.852216	\N	\N
574	17503742003	funcionario	UPDATE	avaliacoes	10064	{"id": 10064, "envio": null, "inicio": "2026-02-18T02:39:05.176", "status": "em_andamento", "lote_id": 1031, "criado_em": "2026-02-18T02:38:58.852216", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T02:38:58.852216", "funcionario_cpf": "17503742003", "motivo_inativacao": null}	{"id": 10064, "envio": "2026-02-17T23:40:26.189", "inicio": "2026-02-18T02:39:05.176", "status": "concluida", "lote_id": 1031, "criado_em": "2026-02-18T02:38:58.852216", "grupo_atual": 1, "concluida_em": "2026-02-17T23:40:26.189", "inativada_em": null, "atualizado_em": "2026-02-17T23:40:26.189", "funcionario_cpf": "17503742003", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 02:40:19.824763	\N	\N
575	17503742003	\N	lote_atualizado	lotes_avaliacao	1031	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1031, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-18 02:40:19.824763	\N	\N
576	\N	\N	lote_status_change	lotes_avaliacao	1031	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-18 02:40:19.824763	\N	\N
577	17503742003	funcionario	UPDATE	funcionarios	1061	{"id": 1061, "cpf": "17503742003", "nome": "Ale 05052005", "ativo": true, "email": "oiuoiuio@sssf.cv", "setor": "uiouiou", "turno": null, "escala": null, "funcao": "ouoiu", "perfil": "funcionario", "criado_em": "2026-02-18T02:38:51.259447", "matricula": null, "senha_hash": "$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO", "incluido_em": "2026-02-18T02:38:51.259447", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:38:51.259447", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1061, "cpf": "17503742003", "nome": "Ale 05052005", "ativo": true, "email": "oiuoiuio@sssf.cv", "setor": "uiouiou", "turno": null, "escala": null, "funcao": "ouoiu", "perfil": "funcionario", "criado_em": "2026-02-18T02:38:51.259447", "matricula": null, "senha_hash": "$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO", "incluido_em": "2026-02-18T02:38:51.259447", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:40:19.824763", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10064, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:40:26.189"}	\N	\N	Record updated	2026-02-18 02:40:19.824763	\N	\N
578	17503742003	funcionario	UPDATE	funcionarios	1061	{"id": 1061, "cpf": "17503742003", "nome": "Ale 05052005", "ativo": true, "email": "oiuoiuio@sssf.cv", "setor": "uiouiou", "turno": null, "escala": null, "funcao": "ouoiu", "perfil": "funcionario", "criado_em": "2026-02-18T02:38:51.259447", "matricula": null, "senha_hash": "$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO", "incluido_em": "2026-02-18T02:38:51.259447", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:40:19.824763", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10064, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:40:26.189"}	{"id": 1061, "cpf": "17503742003", "nome": "Ale 05052005", "ativo": true, "email": "oiuoiuio@sssf.cv", "setor": "uiouiou", "turno": null, "escala": null, "funcao": "ouoiu", "perfil": "funcionario", "criado_em": "2026-02-18T02:38:51.259447", "matricula": null, "senha_hash": "$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO", "incluido_em": "2026-02-18T02:38:51.259447", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T02:40:19.824763", "data_admissao": null, "inativado_por": null, "data_nascimento": "2005-05-05", "data_ultimo_lote": "2026-02-18T02:40:19.824763", "indice_avaliacao": 2, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10064, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-17T23:40:26.189"}	\N	\N	Record updated	2026-02-18 02:40:19.824763	\N	\N
579	04703084945	rh	INSERT	funcionarios	1062	\N	{"id": 1062, "cpf": "90119869039", "nome": "Peter 06062006", "ativo": true, "email": "uoiuoi@ffsd.cou", "setor": "iuoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-18T03:04:14.652312", "matricula": null, "senha_hash": "$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG", "incluido_em": "2026-02-18T03:04:14.652312", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T03:04:14.652312", "data_admissao": null, "inativado_por": null, "data_nascimento": "2006-06-06", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-18 03:04:14.652312	\N	\N
580	04703084945	\N	lote_criado	lotes_avaliacao	1032	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1032, "empresa_id": 14, "numero_ordem": 3}	2026-02-18 03:04:23.317314	\N	\N
581	\N	\N	laudo_criado	laudos	1032	\N	{"status": "rascunho", "lote_id": 1032, "tamanho_pdf": null}	\N	\N	\N	2026-02-18 03:04:23.317314	\N	\N
582	04703084945	rh	INSERT	avaliacoes	10065	\N	{"id": 10065, "envio": null, "inicio": "2026-02-18T03:04:29.615", "status": "iniciada", "lote_id": 1032, "criado_em": "2026-02-18T03:04:23.317314", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T03:04:23.317314", "funcionario_cpf": "90119869039", "motivo_inativacao": null}	\N	\N	Record created	2026-02-18 03:04:23.317314	\N	\N
583	90119869039	funcionario	UPDATE	avaliacoes	10065	{"id": 10065, "envio": null, "inicio": "2026-02-18T03:04:29.615", "status": "iniciada", "lote_id": 1032, "criado_em": "2026-02-18T03:04:23.317314", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T03:04:23.317314", "funcionario_cpf": "90119869039", "motivo_inativacao": null}	{"id": 10065, "envio": null, "inicio": "2026-02-18T03:04:29.615", "status": "em_andamento", "lote_id": 1032, "criado_em": "2026-02-18T03:04:23.317314", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T03:04:23.317314", "funcionario_cpf": "90119869039", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 03:05:12.197965	\N	\N
584	90119869039	funcionario	UPDATE	avaliacoes	10065	{"id": 10065, "envio": null, "inicio": "2026-02-18T03:04:29.615", "status": "em_andamento", "lote_id": 1032, "criado_em": "2026-02-18T03:04:23.317314", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T03:04:23.317314", "funcionario_cpf": "90119869039", "motivo_inativacao": null}	{"id": 10065, "envio": "2026-02-18T00:05:39.882", "inicio": "2026-02-18T03:04:29.615", "status": "concluida", "lote_id": 1032, "criado_em": "2026-02-18T03:04:23.317314", "grupo_atual": 1, "concluida_em": "2026-02-18T00:05:39.882", "inativada_em": null, "atualizado_em": "2026-02-18T00:05:39.882", "funcionario_cpf": "90119869039", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 03:05:33.556727	\N	\N
587	90119869039	funcionario	UPDATE	funcionarios	1062	{"id": 1062, "cpf": "90119869039", "nome": "Peter 06062006", "ativo": true, "email": "uoiuoi@ffsd.cou", "setor": "iuoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-18T03:04:14.652312", "matricula": null, "senha_hash": "$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG", "incluido_em": "2026-02-18T03:04:14.652312", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T03:04:14.652312", "data_admissao": null, "inativado_por": null, "data_nascimento": "2006-06-06", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1062, "cpf": "90119869039", "nome": "Peter 06062006", "ativo": true, "email": "uoiuoi@ffsd.cou", "setor": "iuoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-18T03:04:14.652312", "matricula": null, "senha_hash": "$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG", "incluido_em": "2026-02-18T03:04:14.652312", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T03:05:33.556727", "data_admissao": null, "inativado_por": null, "data_nascimento": "2006-06-06", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10065, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T00:05:39.882"}	\N	\N	Record updated	2026-02-18 03:05:33.556727	\N	\N
588	90119869039	funcionario	UPDATE	funcionarios	1062	{"id": 1062, "cpf": "90119869039", "nome": "Peter 06062006", "ativo": true, "email": "uoiuoi@ffsd.cou", "setor": "iuoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-18T03:04:14.652312", "matricula": null, "senha_hash": "$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG", "incluido_em": "2026-02-18T03:04:14.652312", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T03:05:33.556727", "data_admissao": null, "inativado_por": null, "data_nascimento": "2006-06-06", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10065, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T00:05:39.882"}	{"id": 1062, "cpf": "90119869039", "nome": "Peter 06062006", "ativo": true, "email": "uoiuoi@ffsd.cou", "setor": "iuoiuoi", "turno": null, "escala": null, "funcao": "uoiuoi", "perfil": "funcionario", "criado_em": "2026-02-18T03:04:14.652312", "matricula": null, "senha_hash": "$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG", "incluido_em": "2026-02-18T03:04:14.652312", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T03:05:33.556727", "data_admissao": null, "inativado_por": null, "data_nascimento": "2006-06-06", "data_ultimo_lote": "2026-02-18T03:05:33.556727", "indice_avaliacao": 3, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10065, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T00:05:39.882"}	\N	\N	Record updated	2026-02-18 03:05:33.556727	\N	\N
589	04703084945	rh	INSERT	funcionarios	1063	\N	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:06:58.760787", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-18 11:06:58.760787	\N	\N
590	04703084945	\N	lote_criado	lotes_avaliacao	1033	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1033, "empresa_id": 14, "numero_ordem": 4}	2026-02-18 11:07:07.504048	\N	\N
591	\N	\N	laudo_criado	laudos	1033	\N	{"status": "rascunho", "lote_id": 1033, "tamanho_pdf": null}	\N	\N	\N	2026-02-18 11:07:07.504048	\N	\N
592	04703084945	rh	INSERT	avaliacoes	10066	\N	{"id": 10066, "envio": null, "inicio": "2026-02-18T11:07:16.998", "status": "iniciada", "lote_id": 1033, "criado_em": "2026-02-18T11:07:07.504048", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T11:07:07.504048", "funcionario_cpf": "18237959000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-18 11:07:07.504048	\N	\N
593	18237959000	funcionario	UPDATE	avaliacoes	10066	{"id": 10066, "envio": null, "inicio": "2026-02-18T11:07:16.998", "status": "iniciada", "lote_id": 1033, "criado_em": "2026-02-18T11:07:07.504048", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T11:07:07.504048", "funcionario_cpf": "18237959000", "motivo_inativacao": null}	{"id": 10066, "envio": null, "inicio": "2026-02-18T11:07:16.998", "status": "em_andamento", "lote_id": 1033, "criado_em": "2026-02-18T11:07:07.504048", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T11:07:07.504048", "funcionario_cpf": "18237959000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 11:08:04.977437	\N	\N
594	18237959000	funcionario	UPDATE	avaliacoes	10066	{"id": 10066, "envio": null, "inicio": "2026-02-18T11:07:16.998", "status": "em_andamento", "lote_id": 1033, "criado_em": "2026-02-18T11:07:07.504048", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-18T11:07:07.504048", "funcionario_cpf": "18237959000", "motivo_inativacao": null}	{"id": 10066, "envio": "2026-02-18T08:08:36.588", "inicio": "2026-02-18T11:07:16.998", "status": "concluida", "lote_id": 1033, "criado_em": "2026-02-18T11:07:07.504048", "grupo_atual": 1, "concluida_em": "2026-02-18T08:08:36.588", "inativada_em": null, "atualizado_em": "2026-02-18T08:08:36.588", "funcionario_cpf": "18237959000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-18 11:08:27.153951	\N	\N
595	18237959000	\N	lote_atualizado	lotes_avaliacao	1033	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1033, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-18 11:08:27.153951	\N	\N
596	\N	\N	lote_status_change	lotes_avaliacao	1033	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-18 11:08:27.153951	\N	\N
626	35923473062	funcionario	UPDATE	avaliacoes	10069	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:10:37.450342", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:10:37.450342", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:10:52.587401	\N	\N
597	18237959000	funcionario	UPDATE	funcionarios	1063	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:06:58.760787", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	\N	\N	Record updated	2026-02-18 11:08:27.153951	\N	\N
598	18237959000	funcionario	UPDATE	funcionarios	1063	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": "2026-02-18T11:08:27.153951", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	\N	\N	Record updated	2026-02-18 11:08:27.153951	\N	\N
599	16911251052	gestor	INSERT	funcionarios	1064	\N	{"id": 1064, "cpf": "34232299009", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T20:51:55.832321", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-23 20:51:55.832321	\N	\N
600	16911251052	gestor	INSERT	funcionarios	1065	\N	{"id": 1065, "cpf": "31745655026", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reu", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yi4Q5fP0U6k4agzVpK2q8uDvtyOgZTlJtRoewKykikJkW41Y7G61i", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T20:51:55.832321", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-23 20:51:55.832321	\N	\N
601	16911251052	\N	lote_criado	lotes_avaliacao	1034	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1034, "empresa_id": null, "numero_ordem": 14}	2026-02-23 20:52:11.754618	\N	\N
602	16911251052	gestor	INSERT	avaliacoes	10067	\N	{"id": 10067, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "iniciada", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "31745655026", "motivo_inativacao": null}	\N	\N	Record created	2026-02-23 20:52:11.754618	\N	\N
603	16911251052	gestor	INSERT	avaliacoes	10068	\N	{"id": 10068, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "iniciada", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "34232299009", "motivo_inativacao": null}	\N	\N	Record created	2026-02-23 20:52:11.754618	\N	\N
604	16911251052	\N	liberar_lote	lotes_avaliacao	1034	\N	\N	201.159.185.249	\N	{"entidade_id":117,"entidade_nome":"TKCF Siderurguaca","tipo":"completo","lote_id":1034,"descricao":null,"data_filtro":null,"numero_ordem":14,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-23 20:52:13.08247	\N	\N
605	16911251052	gestor	UPDATE	avaliacoes	10067	{"id": 10067, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "iniciada", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "31745655026", "motivo_inativacao": null}	{"id": 10067, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "inativada", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-23T20:56:59.696394+00:00", "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "31745655026", "motivo_inativacao": "dgdgsdsgsdgd"}	\N	\N	Record updated	2026-02-23 20:56:59.696394	\N	\N
635	\N	\N	lote_status_change	lotes_avaliacao	1035	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-23 23:16:00.87096	\N	\N
606	16911251052	gestor	UPDATE	funcionarios	1065	{"id": 1065, "cpf": "31745655026", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reu", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yi4Q5fP0U6k4agzVpK2q8uDvtyOgZTlJtRoewKykikJkW41Y7G61i", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T20:51:55.832321", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1065, "cpf": "31745655026", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@ema.reu", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yi4Q5fP0U6k4agzVpK2q8uDvtyOgZTlJtRoewKykikJkW41Y7G61i", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T20:56:59.696394", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10067, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T20:56:59.696394"}	\N	\N	Record updated	2026-02-23 20:56:59.696394	\N	\N
607	34232299009	funcionario	UPDATE	avaliacoes	10068	{"id": 10068, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "iniciada", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "34232299009", "motivo_inativacao": null}	{"id": 10068, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "em_andamento", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "34232299009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 21:00:30.967943	\N	\N
608	34232299009	funcionario	UPDATE	avaliacoes	10068	{"id": 10068, "envio": null, "inicio": "2026-02-23T20:52:12.417", "status": "em_andamento", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T20:52:11.754618", "funcionario_cpf": "34232299009", "motivo_inativacao": null}	{"id": 10068, "envio": "2026-02-23T21:10:05.249", "inicio": "2026-02-23T20:52:12.417", "status": "concluida", "lote_id": 1034, "criado_em": "2026-02-23T20:52:11.754618", "grupo_atual": 1, "concluida_em": "2026-02-23T21:10:05.249", "inativada_em": null, "atualizado_em": "2026-02-23T21:10:05.249", "funcionario_cpf": "34232299009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 21:10:02.883383	\N	\N
609	34232299009	\N	lote_atualizado	lotes_avaliacao	1034	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1034, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-23 21:10:02.883383	\N	\N
610	\N	\N	lote_status_change	lotes_avaliacao	1034	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-23 21:10:02.883383	\N	\N
611	34232299009	funcionario	UPDATE	funcionarios	1064	{"id": 1064, "cpf": "34232299009", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T20:51:55.832321", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1064, "cpf": "34232299009", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T21:10:02.883383", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10068, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T21:10:05.249"}	\N	\N	Record updated	2026-02-23 21:10:02.883383	\N	\N
612	34232299009	funcionario	UPDATE	funcionarios	1064	{"id": 1064, "cpf": "34232299009", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T21:10:02.883383", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10068, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T21:10:05.249"}	{"id": 1064, "cpf": "34232299009", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.qwq", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T20:51:55.832321", "matricula": null, "senha_hash": "$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy", "incluido_em": "2026-02-23T20:51:55.832321", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T21:10:02.883383", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-23T21:10:02.883383", "indice_avaliacao": 14, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10068, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T21:10:05.249"}	\N	\N	Record updated	2026-02-23 21:10:02.883383	\N	\N
613	\N	\N	laudo_criado	laudos	1034	\N	{"status": "rascunho", "lote_id": 1034, "tamanho_pdf": null}	\N	\N	\N	2026-02-23 21:28:43.051591	\N	\N
614	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1034	\N	{"lote_id": 1034, "file_size": 626011, "duration_ms": 9898, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1034/laudo-1771884852195-j4l6i0.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1034/laudo-1771884852195-j4l6i0.pdf"}	\N	\N	\N	2026-02-23 22:14:10.419425	\N	\N
615	99328531004	rh	INSERT	empresas_clientes	15	\N	{"id": 15, "cep": "78945456", "cnpj": "16285851000168", "nome": "Emp cline 2026 fev", "ativa": true, "email": "fdsdsfsdf@dsfdsf.com", "cidade": "eewefdssdfsdf", "estado": "OP", "endereco": "rua idsfpoi 2345", "telefone": "(79) 79798-7746", "criado_em": "2026-02-23T22:46:28.302503", "clinica_id": 118, "atualizado_em": "2026-02-23T22:46:28.302503", "cartao_cnpj_path": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/cartao_cnpj-1771886783385-3y7mu4.pdf", "responsavel_email": null, "representante_fone": "49879879879", "representante_nome": "Rona Fialrdo", "representante_email": "ronsadlf@fdfd.com", "contrato_social_path": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/contrato_social-1771886787397-9iogcq.pdf", "doc_identificacao_path": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/cad-qwork/16285851000168/doc_identificacao-1771886787566-jpzqs5.pdf", "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-23 22:46:28.302503	\N	\N
616	99328531004	rh	INSERT	funcionarios	1066	\N	{"id": 1066, "cpf": "66930813044", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.yr", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$CwI4Q.wWXMBriX5D97zH..RbR5mC50ds/2C1pyx2tT.OndXwueyra", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:07:07.097429", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-23 23:07:07.097429	\N	\N
617	99328531004	rh	INSERT	funcionarios	1067	\N	{"id": 1067, "cpf": "35923473062", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@emaee.fg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T23:07:07.097429", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-23 23:07:07.097429	\N	\N
618	99328531004	rh	INSERT	funcionarios	1068	\N	{"id": 1068, "cpf": "29054003073", "nome": "teste 02022002", "ativo": true, "email": "twew@dfsfd.co", "setor": "ewtew", "turno": null, "escala": null, "funcao": "tewtwe", "perfil": "funcionario", "criado_em": "2026-02-23T23:08:21.025233", "matricula": null, "senha_hash": "$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou", "incluido_em": "2026-02-23T23:08:21.025233", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:08:21.025233", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-23 23:08:21.025233	\N	\N
619	99328531004	\N	lote_criado	lotes_avaliacao	1035	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1035, "empresa_id": 15, "numero_ordem": 1}	2026-02-23 23:08:34.460644	\N	\N
620	\N	\N	laudo_criado	laudos	1035	\N	{"status": "rascunho", "lote_id": 1035, "tamanho_pdf": null}	\N	\N	\N	2026-02-23 23:08:34.460644	\N	\N
621	99328531004	rh	INSERT	avaliacoes	10069	\N	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	\N	\N	Record created	2026-02-23 23:08:34.460644	\N	\N
622	99328531004	rh	INSERT	avaliacoes	10070	\N	{"id": 10070, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "66930813044", "motivo_inativacao": null}	\N	\N	Record created	2026-02-23 23:08:34.460644	\N	\N
623	99328531004	rh	INSERT	avaliacoes	10071	\N	{"id": 10071, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "29054003073", "motivo_inativacao": null}	\N	\N	Record created	2026-02-23 23:08:34.460644	\N	\N
624	35923473062	funcionario	UPDATE	avaliacoes	10069	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:10:03.383037	\N	\N
625	99328531004	rh	UPDATE	avaliacoes	10069	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:10:37.450342", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:10:37.450342	\N	\N
627	99328531004	rh	UPDATE	avaliacoes	10070	{"id": 10070, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "66930813044", "motivo_inativacao": null}	{"id": 10070, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "inativada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-23T23:11:02.215988+00:00", "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "66930813044", "motivo_inativacao": "xvcvxcxvcvcvc"}	\N	\N	Record updated	2026-02-23 23:11:02.215988	\N	\N
628	99328531004	rh	UPDATE	funcionarios	1066	{"id": 1066, "cpf": "66930813044", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.yr", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$CwI4Q.wWXMBriX5D97zH..RbR5mC50ds/2C1pyx2tT.OndXwueyra", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:07:07.097429", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1066, "cpf": "66930813044", "nome": "Entidade masc 01012001", "ativo": true, "email": "jose53va@empa.yr", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$CwI4Q.wWXMBriX5D97zH..RbR5mC50ds/2C1pyx2tT.OndXwueyra", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:11:02.215988", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10070, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:11:02.215988"}	\N	\N	Record updated	2026-02-23 23:11:02.215988	\N	\N
630	35923473062	funcionario	UPDATE	avaliacoes	10069	{"id": 10069, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:10:37.450342", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	{"id": 10069, "envio": "2026-02-23T23:15:04.326", "inicio": "2026-02-23T23:08:35.566", "status": "concluida", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": "2026-02-23T23:15:04.326", "inativada_em": null, "atualizado_em": "2026-02-23T23:15:04.326", "funcionario_cpf": "35923473062", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:15:01.867821	\N	\N
631	35923473062	funcionario	UPDATE	funcionarios	1067	{"id": 1067, "cpf": "35923473062", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@emaee.fg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T23:07:07.097429", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1067, "cpf": "35923473062", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@emaee.fg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T23:15:01.867821", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10069, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:15:04.326"}	\N	\N	Record updated	2026-02-23 23:15:01.867821	\N	\N
632	35923473062	funcionario	UPDATE	funcionarios	1067	{"id": 1067, "cpf": "35923473062", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@emaee.fg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T23:15:01.867821", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10069, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:15:04.326"}	{"id": 1067, "cpf": "35923473062", "nome": "Entidade fem 02022002''", "ativo": true, "email": "reewrrwerweantos@emaee.fg", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-23T23:07:07.097429", "matricula": null, "senha_hash": "$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu", "incluido_em": "2026-02-23T23:07:07.097429", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-23T23:15:01.867821", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-23T23:15:01.867821", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10069, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:15:04.326"}	\N	\N	Record updated	2026-02-23 23:15:01.867821	\N	\N
633	29054003073	funcionario	UPDATE	avaliacoes	10071	{"id": 10071, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "29054003073", "motivo_inativacao": null}	{"id": 10071, "envio": "2026-02-23T23:16:03.236", "inicio": "2026-02-23T23:08:35.566", "status": "concluida", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": "2026-02-23T23:16:03.236", "inativada_em": null, "atualizado_em": "2026-02-23T23:16:03.236", "funcionario_cpf": "29054003073", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:16:00.87096	\N	\N
634	29054003073	\N	lote_atualizado	lotes_avaliacao	1035	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1035, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-23 23:16:00.87096	\N	\N
629	29054003073	funcionario	UPDATE	avaliacoes	10071	{"id": 10071, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "iniciada", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "29054003073", "motivo_inativacao": null}	{"id": 10071, "envio": null, "inicio": "2026-02-23T23:08:35.566", "status": "em_andamento", "lote_id": 1035, "criado_em": "2026-02-23T23:08:34.460644", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-23T23:08:34.460644", "funcionario_cpf": "29054003073", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-23 23:12:26.447136	\N	\N
636	29054003073	funcionario	UPDATE	funcionarios	1068	{"id": 1068, "cpf": "29054003073", "nome": "teste 02022002", "ativo": true, "email": "twew@dfsfd.co", "setor": "ewtew", "turno": null, "escala": null, "funcao": "tewtwe", "perfil": "funcionario", "criado_em": "2026-02-23T23:08:21.025233", "matricula": null, "senha_hash": "$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou", "incluido_em": "2026-02-23T23:08:21.025233", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:08:21.025233", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1068, "cpf": "29054003073", "nome": "teste 02022002", "ativo": true, "email": "twew@dfsfd.co", "setor": "ewtew", "turno": null, "escala": null, "funcao": "tewtwe", "perfil": "funcionario", "criado_em": "2026-02-23T23:08:21.025233", "matricula": null, "senha_hash": "$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou", "incluido_em": "2026-02-23T23:08:21.025233", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:16:00.87096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10071, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:16:03.236"}	\N	\N	Record updated	2026-02-23 23:16:00.87096	\N	\N
637	29054003073	funcionario	UPDATE	funcionarios	1068	{"id": 1068, "cpf": "29054003073", "nome": "teste 02022002", "ativo": true, "email": "twew@dfsfd.co", "setor": "ewtew", "turno": null, "escala": null, "funcao": "tewtwe", "perfil": "funcionario", "criado_em": "2026-02-23T23:08:21.025233", "matricula": null, "senha_hash": "$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou", "incluido_em": "2026-02-23T23:08:21.025233", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:16:00.87096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10071, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:16:03.236"}	{"id": 1068, "cpf": "29054003073", "nome": "teste 02022002", "ativo": true, "email": "twew@dfsfd.co", "setor": "ewtew", "turno": null, "escala": null, "funcao": "tewtwe", "perfil": "funcionario", "criado_em": "2026-02-23T23:08:21.025233", "matricula": null, "senha_hash": "$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou", "incluido_em": "2026-02-23T23:08:21.025233", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-23T23:16:00.87096", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-23T23:16:00.87096", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10071, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-23T23:16:03.236"}	\N	\N	Record updated	2026-02-23 23:16:00.87096	\N	\N
638	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1035	\N	{"lote_id": 1035, "file_size": 584889, "duration_ms": 7970, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1035/laudo-1771889082468-7maq40.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1035/laudo-1771889082468-7maq40.pdf"}	\N	\N	\N	2026-02-23 23:24:38.735167	\N	\N
639	29930511059	gestor	INSERT	funcionarios	1069	\N	{"id": 1069, "cpf": "75415228055", "nome": "teste 04042004", "ativo": true, "email": "ffafa@dffd.com", "setor": "ffds", "turno": null, "escala": null, "funcao": "fdffa", "perfil": "funcionario", "criado_em": "2026-02-24T00:31:52.593927", "matricula": null, "senha_hash": "$2a$10$frZjKznbCAcbAeXO19CJQO6QpVjVY/9T0M/9x8vWCmWUobAf5oxje", "incluido_em": "2026-02-24T00:31:52.593927", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-24T00:31:52.593927", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-24 00:31:52.593927	\N	\N
640	29930511059	\N	lote_criado	lotes_avaliacao	1036	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1036, "empresa_id": null, "numero_ordem": 15}	2026-02-24 00:32:15.181034	\N	\N
641	29930511059	gestor	INSERT	avaliacoes	10072	\N	{"id": 10072, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "iniciada", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record created	2026-02-24 00:32:15.181034	\N	\N
642	29930511059	gestor	INSERT	avaliacoes	10073	\N	{"id": 10073, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "iniciada", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "75415228055", "motivo_inativacao": null}	\N	\N	Record created	2026-02-24 00:32:15.181034	\N	\N
643	29930511059	\N	liberar_lote	lotes_avaliacao	1036	\N	\N	201.159.185.223	\N	{"entidade_id":100,"entidade_nome":"RELEGERE - ASSESSORIA E CONSULTORIA LTDA","tipo":"completo","lote_id":1036,"descricao":null,"data_filtro":null,"numero_ordem":15,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-02-24 00:32:16.476528	\N	\N
644	75415228055	funcionario	UPDATE	avaliacoes	10073	{"id": 10073, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "iniciada", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "75415228055", "motivo_inativacao": null}	{"id": 10073, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "em_andamento", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "75415228055", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-24 00:33:50.832571	\N	\N
653	98970247009	funcionario	UPDATE	avaliacoes	10074	{"id": 10074, "envio": null, "inicio": "2026-02-25T18:25:08.494", "status": "iniciada", "lote_id": 1037, "criado_em": "2026-02-25T18:25:07.383889", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-25T18:25:07.383889", "funcionario_cpf": "98970247009", "motivo_inativacao": null}	{"id": 10074, "envio": null, "inicio": "2026-02-25T18:25:08.494", "status": "em_andamento", "lote_id": 1037, "criado_em": "2026-02-25T18:25:07.383889", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-25T18:25:07.383889", "funcionario_cpf": "98970247009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-25 18:30:52.27141	\N	\N
645	87251739011	rh	INSERT	empresas_clientes	16	\N	{"id": 16, "cep": "45678456", "cnpj": "79973255000190", "nome": "fdfds sdfdfssfd", "ativa": true, "email": "dsdsfsf@fdssd.com", "cidade": "uiouoiuoi", "estado": "UI", "endereco": "rua podsipo 23423", "telefone": "(78) 97987-9879", "criado_em": "2026-02-25T16:02:54.251984", "clinica_id": 119, "atualizado_em": "2026-02-25T16:02:54.251984", "cartao_cnpj_path": null, "responsavel_email": null, "representante_fone": "54465465466", "representante_nome": "rnapdop dfiop po", "representante_email": "fddsf@fdsdsf.com", "contrato_social_path": null, "doc_identificacao_path": null, "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-25 16:02:54.251984	\N	\N
646	79432901009	rh	INSERT	empresas_clientes	17	\N	{"id": 17, "cep": null, "cnpj": "33671387000167", "nome": "dfsgsG SDFsfes", "ativa": true, "email": null, "cidade": null, "estado": null, "endereco": null, "telefone": null, "criado_em": "2026-02-25T18:04:58.534983", "clinica_id": 120, "atualizado_em": "2026-02-25T18:04:58.534983", "cartao_cnpj_path": null, "responsavel_email": null, "representante_fone": "80740840684", "representante_nome": "sjkdfhkjsd hjkfdsh fjk hsdkj", "representante_email": "sdfDFDBKA@GMAIL.COM", "contrato_social_path": null, "doc_identificacao_path": null, "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-25 18:04:58.534983	\N	\N
647	79432901009	rh	INSERT	funcionarios	1070	\N	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-25 18:22:35.720269	\N	\N
648	79432901009	rh	UPDATE	funcionarios	1070	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": false, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-25 18:23:44.537852	\N	\N
649	79432901009	rh	UPDATE	funcionarios	1070	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": false, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-25 18:24:34.618278	\N	\N
650	79432901009	\N	lote_criado	lotes_avaliacao	1037	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1037, "empresa_id": 17, "numero_ordem": 1}	2026-02-25 18:25:07.383889	\N	\N
651	\N	\N	laudo_criado	laudos	1037	\N	{"status": "rascunho", "lote_id": 1037, "tamanho_pdf": null}	\N	\N	\N	2026-02-25 18:25:07.383889	\N	\N
652	79432901009	rh	INSERT	avaliacoes	10074	\N	{"id": 10074, "envio": null, "inicio": "2026-02-25T18:25:08.494", "status": "iniciada", "lote_id": 1037, "criado_em": "2026-02-25T18:25:07.383889", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-25T18:25:07.383889", "funcionario_cpf": "98970247009", "motivo_inativacao": null}	\N	\N	Record created	2026-02-25 18:25:07.383889	\N	\N
724	09777228996	gestor	INSERT	avaliacoes	10083	\N	{"id": 10083, "envio": null, "inicio": "2026-03-03T13:22:22.569", "status": "iniciada", "lote_id": 1041, "criado_em": "2026-03-03T13:22:21.92372", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T13:22:21.92372", "funcionario_cpf": "09777228996", "motivo_inativacao": null}	\N	\N	Record created	2026-03-03 13:22:21.92372	\N	\N
654	98970247009	funcionario	UPDATE	avaliacoes	10074	{"id": 10074, "envio": null, "inicio": "2026-02-25T18:25:08.494", "status": "em_andamento", "lote_id": 1037, "criado_em": "2026-02-25T18:25:07.383889", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-25T18:25:07.383889", "funcionario_cpf": "98970247009", "motivo_inativacao": null}	{"id": 10074, "envio": "2026-02-25T18:34:26.444", "inicio": "2026-02-25T18:25:08.494", "status": "concluida", "lote_id": 1037, "criado_em": "2026-02-25T18:25:07.383889", "grupo_atual": 1, "concluida_em": "2026-02-25T18:34:26.444", "inativada_em": null, "atualizado_em": "2026-02-25T18:34:26.444", "funcionario_cpf": "98970247009", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-25 18:34:24.218014	\N	\N
655	98970247009	\N	lote_atualizado	lotes_avaliacao	1037	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1037, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-25 18:34:24.218014	\N	\N
656	\N	\N	lote_status_change	lotes_avaliacao	1037	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-25 18:34:24.218014	\N	\N
657	98970247009	funcionario	UPDATE	funcionarios	1070	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:22:35.720269", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:34:24.218014", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10074, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-25T18:34:26.444"}	\N	\N	Record updated	2026-02-25 18:34:24.218014	\N	\N
658	98970247009	funcionario	UPDATE	funcionarios	1070	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:34:24.218014", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10074, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-25T18:34:26.444"}	{"id": 1070, "cpf": "98970247009", "nome": "test etstes teste", "ativo": true, "email": "cotoxel298@dolofan.com", "setor": "produção", "turno": null, "escala": null, "funcao": "operador", "perfil": "funcionario", "criado_em": "2026-02-25T18:22:35.720269", "matricula": null, "senha_hash": "$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe", "incluido_em": "2026-02-25T18:22:35.720269", "nivel_cargo": "operacional", "inativado_em": "2026-02-25T18:23:44.537852", "atualizado_em": "2026-02-25T18:34:24.218014", "data_admissao": null, "inativado_por": "79432901009", "data_nascimento": "1999-02-20", "data_ultimo_lote": "2026-02-25T18:34:24.218014", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10074, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-25T18:34:26.444"}	\N	\N	Record updated	2026-02-25 18:34:24.218014	\N	\N
659	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1037	\N	{"lote_id": 1037, "file_size": 521426, "duration_ms": 1699, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1037/laudo-1772050534060-djstsp.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1037/laudo-1772050534060-djstsp.pdf"}	\N	\N	\N	2026-02-25 20:15:21.006442	\N	\N
660	29930511059	gestor	INSERT	funcionarios	1071	\N	{"id": 1071, "cpf": "03800369087", "nome": "rona 24101974", "ativo": true, "email": "uoiuoiu@uoi.con", "setor": "uiouoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-25T22:33:00.810219", "matricula": null, "senha_hash": "$2a$10$967V3lCsVjeNfOwsX0fOiuTT3UYVug04FHYkRuKnHn0VR7hUHogHm", "incluido_em": "2026-02-25T22:33:00.810219", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-25T22:33:00.810219", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-25 22:33:00.810219	\N	\N
661	29930511059	gestor	UPDATE	funcionarios	1071	{"id": 1071, "cpf": "03800369087", "nome": "rona 24101974", "ativo": true, "email": "uoiuoiu@uoi.con", "setor": "uiouoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-25T22:33:00.810219", "matricula": null, "senha_hash": "$2a$10$967V3lCsVjeNfOwsX0fOiuTT3UYVug04FHYkRuKnHn0VR7hUHogHm", "incluido_em": "2026-02-25T22:33:00.810219", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-25T22:33:00.810219", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1071, "cpf": "03800369087", "nome": "rona 02022002", "ativo": true, "email": "uoiuoiu@uoi.con", "setor": "uiouoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-25T22:33:00.810219", "matricula": null, "senha_hash": "$2a$10$NlfQ6mRouueeviQycxoHzOf7e8CLoGtQKxKWGCHLa3bdU7x6mWOTi", "incluido_em": "2026-02-25T22:33:00.810219", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-25T22:48:55.849674", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-25 22:48:55.849674	\N	\N
662	04703084945	rh	UPDATE	funcionarios	1063	{"id": 1063, "cpf": "18237959000", "nome": "TEst 09091999", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$JeCiEuIGhS0cOTLPRfsBtOyVBRb45440NdObIJ0Ck.dsBeNZRqIUG", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-09-09", "data_ultimo_lote": "2026-02-18T11:08:27.153951", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	{"id": 1063, "cpf": "18237959000", "nome": "TEst 03032003", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$dBRlP8gPwXskWqlO9fmhvOn1AK3eK3ihxgy2DmcIJ7kvuTElv/aC.", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": "2026-02-18T11:08:27.153951", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	\N	\N	Record updated	2026-02-26 10:23:36.601327	\N	\N
663	04703084945	rh	UPDATE	funcionarios	1063	{"id": 1063, "cpf": "18237959000", "nome": "TEst 03032003", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$dBRlP8gPwXskWqlO9fmhvOn1AK3eK3ihxgy2DmcIJ7kvuTElv/aC.", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "2003-03-03", "data_ultimo_lote": "2026-02-18T11:08:27.153951", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	{"id": 1063, "cpf": "18237959000", "nome": "TEst 03032003", "ativo": true, "email": "afsasf@fdfas.com", "setor": "fafa", "turno": null, "escala": null, "funcao": "faaf", "perfil": "funcionario", "criado_em": "2026-02-18T11:06:58.760787", "matricula": null, "senha_hash": "$2a$10$naMUDznKPId6mtch3o8t.u1gVrRy5hg01RTYsWPAWqqruss0ckzSu", "incluido_em": "2026-02-18T11:06:58.760787", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-18T11:08:27.153951", "data_admissao": null, "inativado_por": null, "data_nascimento": "2004-04-04", "data_ultimo_lote": "2026-02-18T11:08:27.153951", "indice_avaliacao": 4, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10066, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T08:08:36.588"}	\N	\N	Record updated	2026-02-26 17:19:45.044402	\N	\N
664	04703084945	rh	INSERT	funcionarios	1072	\N	{"id": 1072, "cpf": "76572828000", "nome": "Poslotes 01012001", "ativo": true, "email": "oiuoiuo@dff.com", "setor": "uuoi", "turno": null, "escala": null, "funcao": "oiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T04:10:13.319242", "matricula": null, "senha_hash": "$2a$10$YNJNaWnkmU2diwJvixo4v.zb8THrzqyUu3iqeBTxnnp4OSQc9MRe2", "incluido_em": "2026-02-27T04:10:13.319242", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T04:10:13.319242", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 04:10:13.319242	\N	\N
665	04703084945	\N	lote_criado	lotes_avaliacao	1038	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1038, "empresa_id": 5, "numero_ordem": 7}	2026-02-27 05:43:16.178477	\N	\N
666	\N	\N	laudo_criado	laudos	1038	\N	{"status": "rascunho", "lote_id": 1038, "tamanho_pdf": null}	\N	\N	\N	2026-02-27 05:43:16.178477	\N	\N
667	04703084945	rh	INSERT	avaliacoes	10075	\N	{"id": 10075, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "iniciada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "97687700074", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 05:43:16.178477	\N	\N
668	04703084945	rh	INSERT	avaliacoes	10076	\N	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "iniciada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 05:43:16.178477	\N	\N
669	29371145048	funcionario	UPDATE	avaliacoes	10076	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "iniciada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "em_andamento", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 05:45:32.14482	\N	\N
670	05248635047	gestor	INSERT	funcionarios	1073	\N	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 12:32:02.988964	\N	\N
725	09777228996	\N	liberar_lote	lotes_avaliacao	1041	\N	\N	189.112.122.137	\N	{"entidade_id":125,"entidade_nome":"fdfgadfgaadffg","tipo":"completo","lote_id":1041,"descricao":null,"data_filtro":null,"numero_ordem":17,"avaliacoes_criadas":1,"total_funcionarios":1}	2026-03-03 13:22:23.101364	\N	\N
671	05248635047	gestor	INSERT	funcionarios	1074	\N	{"id": 1074, "cpf": "94617882073", "nome": "Bruno Costa 22071958", "ativo": true, "email": "bruno.costa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Técnico", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-07-22", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 12:32:02.988964	\N	\N
672	05248635047	gestor	INSERT	funcionarios	1075	\N	{"id": 1075, "cpf": "39034263002", "nome": "Carla Oliveira 10111992", "ativo": true, "email": "carla.oliveira@empresa-teste.local", "setor": "RH", "turno": null, "escala": null, "funcao": "Assistente", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$Q6VlJhXPsvSG4ZVmIhl9o.07of9AFHwozXegnLu0VgVVyEoAebw..", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1992-11-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 12:32:02.988964	\N	\N
673	05248635047	gestor	UPDATE	funcionarios	1073	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": false, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-27 12:32:53.46363	\N	\N
674	05248635047	gestor	UPDATE	funcionarios	1073	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": false, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-27 12:32:56.638112	\N	\N
675	05248635047	\N	lote_criado	lotes_avaliacao	1039	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1039, "empresa_id": null, "numero_ordem": 16}	2026-02-27 12:33:19.898178	\N	\N
676	05248635047	gestor	INSERT	avaliacoes	10077	\N	{"id": 10077, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "78639856095", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 12:33:19.898178	\N	\N
677	05248635047	gestor	INSERT	avaliacoes	10078	\N	{"id": 10078, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "94617882073", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 12:33:19.898178	\N	\N
678	05248635047	gestor	INSERT	avaliacoes	10079	\N	{"id": 10079, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "39034263002", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 12:33:19.898178	\N	\N
679	05248635047	\N	liberar_lote	lotes_avaliacao	1039	\N	\N	::1	\N	{"entidade_id":121,"entidade_nome":"Tsete apos clean","tipo":"completo","lote_id":1039,"descricao":null,"data_filtro":null,"numero_ordem":16,"avaliacoes_criadas":3,"total_funcionarios":3}	2026-02-27 12:33:20.046475	\N	\N
680	78639856095	funcionario	UPDATE	avaliacoes	10077	{"id": 10077, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "78639856095", "motivo_inativacao": null}	{"id": 10077, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "em_andamento", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "78639856095", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:00:36.847099	\N	\N
681	78639856095	funcionario	UPDATE	avaliacoes	10077	{"id": 10077, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "em_andamento", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "78639856095", "motivo_inativacao": null}	{"id": 10077, "envio": "2026-02-27T10:01:25.154", "inicio": "2026-02-27T12:33:38.48", "status": "concluida", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": "2026-02-27T10:01:25.154", "inativada_em": null, "atualizado_em": "2026-02-27T10:01:25.154", "funcionario_cpf": "78639856095", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:01:06.374884	\N	\N
682	78639856095	funcionario	UPDATE	funcionarios	1073	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T13:01:06.374884", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10077, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:01:25.154"}	\N	\N	Record updated	2026-02-27 13:01:06.374884	\N	\N
683	78639856095	funcionario	UPDATE	funcionarios	1073	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T13:01:06.374884", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10077, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:01:25.154"}	{"id": 1073, "cpf": "78639856095", "nome": "Ana Silva 15031990", "ativo": true, "email": "ana.silva@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": "2026-02-27T12:32:53.46363", "atualizado_em": "2026-02-27T13:01:06.374884", "data_admissao": null, "inativado_por": "05248635047", "data_nascimento": "1990-03-15", "data_ultimo_lote": "2026-02-27T13:01:06.374884", "indice_avaliacao": 16, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10077, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:01:25.154"}	\N	\N	Record updated	2026-02-27 13:01:06.374884	\N	\N
684	05248635047	gestor	UPDATE	avaliacoes	10079	{"id": 10079, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "39034263002", "motivo_inativacao": null}	{"id": 10079, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "inativada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-27T13:11:25.534164+00:00", "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "39034263002", "motivo_inativacao": "bfffbbxcbsgdsd"}	\N	\N	Record updated	2026-02-27 13:11:25.534164	\N	\N
685	05248635047	gestor	UPDATE	funcionarios	1075	{"id": 1075, "cpf": "39034263002", "nome": "Carla Oliveira 10111992", "ativo": true, "email": "carla.oliveira@empresa-teste.local", "setor": "RH", "turno": null, "escala": null, "funcao": "Assistente", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$Q6VlJhXPsvSG4ZVmIhl9o.07of9AFHwozXegnLu0VgVVyEoAebw..", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1992-11-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1075, "cpf": "39034263002", "nome": "Carla Oliveira 10111992", "ativo": true, "email": "carla.oliveira@empresa-teste.local", "setor": "RH", "turno": null, "escala": null, "funcao": "Assistente", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$Q6VlJhXPsvSG4ZVmIhl9o.07of9AFHwozXegnLu0VgVVyEoAebw..", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:11:25.534164", "data_admissao": null, "inativado_por": null, "data_nascimento": "1992-11-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10079, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T13:11:25.534164"}	\N	\N	Record updated	2026-02-27 13:11:25.534164	\N	\N
686	94617882073	funcionario	UPDATE	avaliacoes	10078	{"id": 10078, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "iniciada", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "94617882073", "motivo_inativacao": null}	{"id": 10078, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "em_andamento", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "94617882073", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:11:35.456812	\N	\N
687	94617882073	funcionario	UPDATE	avaliacoes	10078	{"id": 10078, "envio": null, "inicio": "2026-02-27T12:33:38.48", "status": "em_andamento", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T12:33:19.898178", "funcionario_cpf": "94617882073", "motivo_inativacao": null}	{"id": 10078, "envio": "2026-02-27T10:12:13.218", "inicio": "2026-02-27T12:33:38.48", "status": "concluida", "lote_id": 1039, "criado_em": "2026-02-27T12:33:19.898178", "grupo_atual": 1, "concluida_em": "2026-02-27T10:12:13.218", "inativada_em": null, "atualizado_em": "2026-02-27T10:12:13.218", "funcionario_cpf": "94617882073", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:11:54.487937	\N	\N
688	94617882073	\N	lote_atualizado	lotes_avaliacao	1039	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1039, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-27 13:11:54.487937	\N	\N
689	\N	\N	lote_status_change	lotes_avaliacao	1039	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-27 13:11:54.487937	\N	\N
690	94617882073	funcionario	UPDATE	funcionarios	1074	{"id": 1074, "cpf": "94617882073", "nome": "Bruno Costa 22071958", "ativo": true, "email": "bruno.costa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Técnico", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T12:32:02.988964", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-07-22", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1074, "cpf": "94617882073", "nome": "Bruno Costa 22071958", "ativo": true, "email": "bruno.costa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Técnico", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:11:54.487937", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-07-22", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10078, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:12:13.218"}	\N	\N	Record updated	2026-02-27 13:11:54.487937	\N	\N
691	94617882073	funcionario	UPDATE	funcionarios	1074	{"id": 1074, "cpf": "94617882073", "nome": "Bruno Costa 22071958", "ativo": true, "email": "bruno.costa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Técnico", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:11:54.487937", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-07-22", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10078, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:12:13.218"}	{"id": 1074, "cpf": "94617882073", "nome": "Bruno Costa 22071958", "ativo": true, "email": "bruno.costa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Técnico", "perfil": "funcionario", "criado_em": "2026-02-27T12:32:02.988964", "matricula": null, "senha_hash": "$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6", "incluido_em": "2026-02-27T12:32:02.988964", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:11:54.487937", "data_admissao": null, "inativado_por": null, "data_nascimento": "1985-07-22", "data_ultimo_lote": "2026-02-27T13:11:54.487937", "indice_avaliacao": 16, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10078, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:12:13.218"}	\N	\N	Record updated	2026-02-27 13:11:54.487937	\N	\N
692	38908580077	rh	INSERT	empresas_clientes	18	\N	{"id": 18, "cep": "45678456", "cnpj": "88804016000106", "nome": "emeoa ruao io", "ativa": true, "email": "ewewwe@aaf.scom", "cidade": "uiouoiuoi", "estado": "UI", "endereco": "rua ouiou 342", "telefone": "(48) 64546-4654", "criado_em": "2026-02-27T13:18:11.481166", "clinica_id": 123, "atualizado_em": "2026-02-27T13:18:11.481166", "cartao_cnpj_path": null, "responsavel_email": null, "representante_fone": "47777795645", "representante_nome": "rei po p", "representante_email": "fdfds@sddsfa.ciu", "contrato_social_path": null, "doc_identificacao_path": null, "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-02-27 13:18:11.481166	\N	\N
693	38908580077	rh	INSERT	funcionarios	1076	\N	{"id": 1076, "cpf": "15419161079", "nome": "Diego Santos 05091988", "ativo": true, "email": "diego.santos@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Desenvolvedor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$b5oHK.Q8C9ySs4eZkTT1cet7oi2niSpqta1oY5XIbVbVnnCFym70O", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1988-09-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 13:22:57.738886	\N	\N
694	38908580077	rh	INSERT	funcionarios	1077	\N	{"id": 1077, "cpf": "99977387052", "nome": "Eliana Ferreira 30011995", "ativo": true, "email": "eliana.ferreira@empresa-teste.local", "setor": "Financeiro", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-01-30", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 13:22:57.738886	\N	\N
695	38908580077	rh	INSERT	funcionarios	1078	\N	{"id": 1078, "cpf": "45102493060", "nome": "Felipe Almeida 18061983", "ativo": true, "email": "felipe.almeida@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Supervisor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$TEK018x48O8vJvns1tj7W./645T8LhVyHy24S/ri3XbJzgNjVvzeK", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1983-06-18", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 13:22:57.738886	\N	\N
696	38908580077	rh	INSERT	funcionarios	1079	\N	{"id": 1079, "cpf": "41119471079", "nome": "Pedro 01012001", "ativo": true, "email": "oiuuoiu@sdffs.com", "setor": "uiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T13:23:23.839568", "matricula": null, "senha_hash": "$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve", "incluido_em": "2026-02-27T13:23:23.839568", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:23:23.839568", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-02-27 13:23:23.839568	\N	\N
697	38908580077	rh	UPDATE	funcionarios	1076	{"id": 1076, "cpf": "15419161079", "nome": "Diego Santos 05091988", "ativo": true, "email": "diego.santos@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Desenvolvedor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$b5oHK.Q8C9ySs4eZkTT1cet7oi2niSpqta1oY5XIbVbVnnCFym70O", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1988-09-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1076, "cpf": "15419161079", "nome": "Diego Santos 05091988", "ativo": false, "email": "diego.santos@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Desenvolvedor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$b5oHK.Q8C9ySs4eZkTT1cet7oi2niSpqta1oY5XIbVbVnnCFym70O", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": "2026-02-27T13:23:37.864634", "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": "38908580077", "data_nascimento": "1988-09-05", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record updated	2026-02-27 13:23:37.864634	\N	\N
698	38908580077	\N	lote_criado	lotes_avaliacao	1040	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1040, "empresa_id": 18, "numero_ordem": 1}	2026-02-27 13:23:43.884143	\N	\N
699	\N	\N	laudo_criado	laudos	1040	\N	{"status": "rascunho", "lote_id": 1040, "tamanho_pdf": null}	\N	\N	\N	2026-02-27 13:23:43.884143	\N	\N
700	38908580077	rh	INSERT	avaliacoes	10080	\N	{"id": 10080, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "99977387052", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 13:23:43.884143	\N	\N
701	38908580077	rh	INSERT	avaliacoes	10081	\N	{"id": 10081, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "45102493060", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 13:23:43.884143	\N	\N
702	38908580077	rh	INSERT	avaliacoes	10082	\N	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	\N	\N	Record created	2026-02-27 13:23:43.884143	\N	\N
703	99977387052	funcionario	UPDATE	avaliacoes	10080	{"id": 10080, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "99977387052", "motivo_inativacao": null}	{"id": 10080, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "99977387052", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:24:13.454392	\N	\N
704	99977387052	funcionario	UPDATE	avaliacoes	10080	{"id": 10080, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "99977387052", "motivo_inativacao": null}	{"id": 10080, "envio": "2026-02-27T10:24:56.167", "inicio": "2026-02-27T13:24:02.514", "status": "concluida", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": "2026-02-27T10:24:56.167", "inativada_em": null, "atualizado_em": "2026-02-27T10:24:56.167", "funcionario_cpf": "99977387052", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:24:37.393496	\N	\N
726	91510815040	gestor	INSERT	funcionarios	1083	\N	{"id": 1083, "cpf": "92544157070", "nome": "Walter Silva", "ativo": true, "email": "walter.silva@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Coordenador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:10:22.340406", "data_admissao": null, "inativado_por": null, "data_nascimento": "1981-09-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-03 14:10:22.340406	\N	\N
705	99977387052	funcionario	UPDATE	funcionarios	1077	{"id": 1077, "cpf": "99977387052", "nome": "Eliana Ferreira 30011995", "ativo": true, "email": "eliana.ferreira@empresa-teste.local", "setor": "Financeiro", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-01-30", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1077, "cpf": "99977387052", "nome": "Eliana Ferreira 30011995", "ativo": true, "email": "eliana.ferreira@empresa-teste.local", "setor": "Financeiro", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:24:37.393496", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-01-30", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10080, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:24:56.167"}	\N	\N	Record updated	2026-02-27 13:24:37.393496	\N	\N
706	99977387052	funcionario	UPDATE	funcionarios	1077	{"id": 1077, "cpf": "99977387052", "nome": "Eliana Ferreira 30011995", "ativo": true, "email": "eliana.ferreira@empresa-teste.local", "setor": "Financeiro", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:24:37.393496", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-01-30", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10080, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:24:56.167"}	{"id": 1077, "cpf": "99977387052", "nome": "Eliana Ferreira 30011995", "ativo": true, "email": "eliana.ferreira@empresa-teste.local", "setor": "Financeiro", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-27T13:24:37.393496", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-01-30", "data_ultimo_lote": "2026-02-27T13:24:37.393496", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10080, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:24:56.167"}	\N	\N	Record updated	2026-02-27 13:24:37.393496	\N	\N
707	41119471079	funcionario	UPDATE	avaliacoes	10082	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:26:20.147822	\N	\N
708	38908580077	rh	UPDATE	avaliacoes	10082	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:26:32.450969", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:26:32.450969	\N	\N
709	41119471079	funcionario	UPDATE	avaliacoes	10082	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:26:32.450969", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:26:32.450969", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:26:40.761099	\N	\N
710	41119471079	funcionario	UPDATE	avaliacoes	10082	{"id": 10082, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "em_andamento", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:26:32.450969", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	{"id": 10082, "envio": "2026-02-27T10:27:24.799", "inicio": "2026-02-27T13:24:02.514", "status": "concluida", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": "2026-02-27T10:27:24.799", "inativada_em": null, "atualizado_em": "2026-02-27T10:27:24.799", "funcionario_cpf": "41119471079", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 13:27:06.024845	\N	\N
727	91510815040	gestor	INSERT	funcionarios	1084	\N	{"id": 1084, "cpf": "83171190095", "nome": "Yolanda Pereira", "ativo": true, "email": "yolanda.pereira@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Operador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$lyDdC5TsenDkvJfFs.AOseqWbpBf.WEbbFdT.i2dgQ1ghSX/fqsIK", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:10:22.340406", "data_admissao": null, "inativado_por": null, "data_nascimento": "1993-12-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-03 14:10:22.340406	\N	\N
711	41119471079	funcionario	UPDATE	funcionarios	1079	{"id": 1079, "cpf": "41119471079", "nome": "Pedro 01012001", "ativo": true, "email": "oiuuoiu@sdffs.com", "setor": "uiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T13:23:23.839568", "matricula": null, "senha_hash": "$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve", "incluido_em": "2026-02-27T13:23:23.839568", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:23:23.839568", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1079, "cpf": "41119471079", "nome": "Pedro 01012001", "ativo": true, "email": "oiuuoiu@sdffs.com", "setor": "uiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T13:23:23.839568", "matricula": null, "senha_hash": "$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve", "incluido_em": "2026-02-27T13:23:23.839568", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:27:06.024845", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10082, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:27:24.799"}	\N	\N	Record updated	2026-02-27 13:27:06.024845	\N	\N
712	41119471079	funcionario	UPDATE	funcionarios	1079	{"id": 1079, "cpf": "41119471079", "nome": "Pedro 01012001", "ativo": true, "email": "oiuuoiu@sdffs.com", "setor": "uiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T13:23:23.839568", "matricula": null, "senha_hash": "$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve", "incluido_em": "2026-02-27T13:23:23.839568", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:27:06.024845", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10082, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:27:24.799"}	{"id": 1079, "cpf": "41119471079", "nome": "Pedro 01012001", "ativo": true, "email": "oiuuoiu@sdffs.com", "setor": "uiuoiu", "turno": null, "escala": null, "funcao": "oiuoiuoi", "perfil": "funcionario", "criado_em": "2026-02-27T13:23:23.839568", "matricula": null, "senha_hash": "$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve", "incluido_em": "2026-02-27T13:23:23.839568", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:27:06.024845", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-27T13:27:06.024845", "indice_avaliacao": 1, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10082, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T10:27:24.799"}	\N	\N	Record updated	2026-02-27 13:27:06.024845	\N	\N
713	38908580077	rh	UPDATE	avaliacoes	10081	{"id": 10081, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "iniciada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "45102493060", "motivo_inativacao": null}	{"id": 10081, "envio": null, "inicio": "2026-02-27T13:24:02.514", "status": "inativada", "lote_id": 1040, "criado_em": "2026-02-27T13:23:43.884143", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-27T13:27:27.358696+00:00", "atualizado_em": "2026-02-27T13:23:43.884143", "funcionario_cpf": "45102493060", "motivo_inativacao": "ssaasffsafasfasafsfas"}	\N	\N	Record updated	2026-02-27 13:27:27.358696	\N	\N
714	38908580077	\N	lote_atualizado	lotes_avaliacao	1040	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1040, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-02-27 13:27:27.358696	\N	\N
715	\N	\N	lote_status_change	lotes_avaliacao	1040	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-02-27 13:27:27.358696	\N	\N
716	38908580077	rh	UPDATE	funcionarios	1078	{"id": 1078, "cpf": "45102493060", "nome": "Felipe Almeida 18061983", "ativo": true, "email": "felipe.almeida@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Supervisor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$TEK018x48O8vJvns1tj7W./645T8LhVyHy24S/ri3XbJzgNjVvzeK", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:22:57.738886", "data_admissao": null, "inativado_por": null, "data_nascimento": "1983-06-18", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1078, "cpf": "45102493060", "nome": "Felipe Almeida 18061983", "ativo": true, "email": "felipe.almeida@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Supervisor", "perfil": "funcionario", "criado_em": "2026-02-27T13:22:57.738886", "matricula": null, "senha_hash": "$2a$10$TEK018x48O8vJvns1tj7W./645T8LhVyHy24S/ri3XbJzgNjVvzeK", "incluido_em": "2026-02-27T13:22:57.738886", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T13:27:27.358696", "data_admissao": null, "inativado_por": null, "data_nascimento": "1983-06-18", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10081, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T13:27:27.358696"}	\N	\N	Record updated	2026-02-27 13:27:27.358696	\N	\N
728	91510815040	\N	lote_criado	lotes_avaliacao	1042	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1042, "empresa_id": null, "numero_ordem": 18}	2026-03-03 14:37:15.306303	\N	\N
729	91510815040	gestor	INSERT	avaliacoes	10084	\N	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "iniciada", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:15.306303", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	\N	\N	Record created	2026-03-03 14:37:15.306303	\N	\N
730	91510815040	gestor	INSERT	avaliacoes	10085	\N	{"id": 10085, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "iniciada", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:15.306303", "funcionario_cpf": "83171190095", "motivo_inativacao": null}	\N	\N	Record created	2026-03-03 14:37:15.306303	\N	\N
731	91510815040	\N	liberar_lote	lotes_avaliacao	1042	\N	\N	::1	\N	{"entidade_id":127,"entidade_nome":"teste lead comiss e contrat","tipo":"completo","lote_id":1042,"descricao":null,"data_filtro":null,"numero_ordem":18,"avaliacoes_criadas":2,"total_funcionarios":2}	2026-03-03 14:37:15.421216	\N	\N
717	29930511059	gestor	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$4rl15AQc1WPZy1NglASb5edyKkGcjcrOJGzf6n2I01yZ9xUCfT0AW", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-18T02:21:14.537931", "data_admissao": null, "inativado_por": null, "data_nascimento": "1974-10-24", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10063, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T02:21:14.537931"}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T15:14:00.492115", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10063, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T02:21:14.537931"}	\N	\N	Record updated	2026-02-27 15:14:00.492115	\N	\N
718	34624832000	funcionario	UPDATE	avaliacoes	10072	{"id": 10072, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "iniciada", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10072, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "em_andamento", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 15:14:36.53767	\N	\N
719	34624832000	funcionario	UPDATE	avaliacoes	10072	{"id": 10072, "envio": null, "inicio": "2026-02-24T00:32:15.828", "status": "em_andamento", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-24T00:32:15.181034", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	{"id": 10072, "envio": "2026-02-27T12:33:31.802", "inicio": "2026-02-24T00:32:15.828", "status": "concluida", "lote_id": 1036, "criado_em": "2026-02-24T00:32:15.181034", "grupo_atual": 1, "concluida_em": "2026-02-27T12:33:31.802", "inativada_em": null, "atualizado_em": "2026-02-27T12:33:31.802", "funcionario_cpf": "34624832000", "motivo_inativacao": null}	\N	\N	Record updated	2026-02-27 15:33:12.980456	\N	\N
720	34624832000	funcionario	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T15:14:00.492115", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10063, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-18T02:21:14.537931"}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T15:33:12.980456", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10072, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T12:33:31.802"}	\N	\N	Record updated	2026-02-27 15:33:12.980456	\N	\N
721	34624832000	funcionario	UPDATE	funcionarios	1019	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T15:33:12.980456", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10072, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T12:33:31.802"}	{"id": 1019, "cpf": "34624832000", "nome": "Jaiminho uoiuoiu", "ativo": true, "email": "rolnk2l@huhuhuj.com", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Coordenadora", "perfil": "funcionario", "criado_em": "2026-02-11T00:59:46.425929", "matricula": null, "senha_hash": "$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu", "incluido_em": "2026-02-11T00:59:46.425929", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-27T15:33:12.980456", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": "2026-02-27T15:33:12.980456", "indice_avaliacao": 15, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10072, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-02-27T12:33:31.802"}	\N	\N	Record updated	2026-02-27 15:33:12.980456	\N	\N
722	09777228996	gestor	INSERT	funcionarios	1082	\N	{"id": 1082, "cpf": "09777228996", "nome": "TESTE FAMIL", "ativo": true, "email": "sdfsdf@gmail.com", "setor": "dsfdsfsdfsdfsdf", "turno": null, "escala": null, "funcao": "dffgadfg", "perfil": "funcionario", "criado_em": "2026-03-03T13:21:53.366924", "matricula": null, "senha_hash": "$2a$10$0X2lSIpIM7j5TeCbmA1H5e72Lh.gfMI1Dtx77DYY39DebTcBvVyqy", "incluido_em": "2026-03-03T13:21:53.366924", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T13:21:53.366924", "data_admissao": null, "inativado_por": null, "data_nascimento": "1999-02-20", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-03 13:21:53.366924	\N	\N
723	09777228996	\N	lote_criado	lotes_avaliacao	1041	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1041, "empresa_id": null, "numero_ordem": 17}	2026-03-03 13:22:21.92372	\N	\N
732	92544157070	funcionario	UPDATE	avaliacoes	10084	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "iniciada", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:15.306303", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "em_andamento", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:26.924333", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-03 14:37:26.924333	\N	\N
733	92544157070	funcionario	UPDATE	avaliacoes	10084	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "em_andamento", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:26.924333", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "em_andamento", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:26.924333", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-03 14:37:26.918099	\N	\N
734	92544157070	funcionario	UPDATE	avaliacoes	10084	{"id": 10084, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "em_andamento", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:26.924333", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	{"id": 10084, "envio": "2026-03-03T11:38:10.54", "inicio": "2026-03-03T14:37:42.929", "status": "concluida", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": "2026-03-03T11:38:10.54", "inativada_em": null, "atualizado_em": "2026-03-03T11:38:10.54", "funcionario_cpf": "92544157070", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-03 14:37:42.792604	\N	\N
735	92544157070	funcionario	UPDATE	funcionarios	1083	{"id": 1083, "cpf": "92544157070", "nome": "Walter Silva", "ativo": true, "email": "walter.silva@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Coordenador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:10:22.340406", "data_admissao": null, "inativado_por": null, "data_nascimento": "1981-09-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1083, "cpf": "92544157070", "nome": "Walter Silva", "ativo": true, "email": "walter.silva@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Coordenador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:37:42.792604", "data_admissao": null, "inativado_por": null, "data_nascimento": "1981-09-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10084, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-03T11:38:10.54"}	\N	\N	Record updated	2026-03-03 14:37:42.792604	\N	\N
736	92544157070	funcionario	UPDATE	funcionarios	1083	{"id": 1083, "cpf": "92544157070", "nome": "Walter Silva", "ativo": true, "email": "walter.silva@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Coordenador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:37:42.792604", "data_admissao": null, "inativado_por": null, "data_nascimento": "1981-09-10", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10084, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-03T11:38:10.54"}	{"id": 1083, "cpf": "92544157070", "nome": "Walter Silva", "ativo": true, "email": "walter.silva@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Coordenador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:37:42.792604", "data_admissao": null, "inativado_por": null, "data_nascimento": "1981-09-10", "data_ultimo_lote": "2026-03-03T14:37:42.792604", "indice_avaliacao": 18, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10084, "ultima_avaliacao_status": "concluida", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-03T11:38:10.54"}	\N	\N	Record updated	2026-03-03 14:37:42.792604	\N	\N
737	91510815040	gestor	UPDATE	avaliacoes	10085	{"id": 10085, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "iniciada", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-03T14:37:15.306303", "funcionario_cpf": "83171190095", "motivo_inativacao": null}	{"id": 10085, "envio": null, "inicio": "2026-03-03T14:37:42.929", "status": "inativada", "lote_id": 1042, "criado_em": "2026-03-03T14:37:15.306303", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-03T14:38:20.886828+00:00", "atualizado_em": "2026-03-03T14:37:15.306303", "funcionario_cpf": "83171190095", "motivo_inativacao": "ggssdds sgddgsdg"}	\N	\N	Record updated	2026-03-03 14:38:20.886828	\N	\N
738	91510815040	\N	lote_atualizado	lotes_avaliacao	1042	\N	\N	\N	\N	{"status": "concluido", "lote_id": 1042, "mudancas": {"status_novo": "concluido", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-03-03 14:38:20.886828	\N	\N
739	\N	\N	lote_status_change	lotes_avaliacao	1042	{"status": "ativo"}	{"status": "concluido", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-03-03 14:38:20.886828	\N	\N
740	91510815040	gestor	UPDATE	funcionarios	1084	{"id": 1084, "cpf": "83171190095", "nome": "Yolanda Pereira", "ativo": true, "email": "yolanda.pereira@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Operador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$lyDdC5TsenDkvJfFs.AOseqWbpBf.WEbbFdT.i2dgQ1ghSX/fqsIK", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:10:22.340406", "data_admissao": null, "inativado_por": null, "data_nascimento": "1993-12-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1084, "cpf": "83171190095", "nome": "Yolanda Pereira", "ativo": true, "email": "yolanda.pereira@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Operador", "perfil": "funcionario", "criado_em": "2026-03-03T14:10:22.340406", "matricula": null, "senha_hash": "$2a$10$lyDdC5TsenDkvJfFs.AOseqWbpBf.WEbbFdT.i2dgQ1ghSX/fqsIK", "incluido_em": "2026-03-03T14:10:22.340406", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-03T14:38:20.886828", "data_admissao": null, "inativado_por": null, "data_nascimento": "1993-12-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10085, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-03T14:38:20.886828"}	\N	\N	Record updated	2026-03-03 14:38:20.886828	\N	\N
741	\N	\N	laudo_criado	laudos	1042	\N	{"status": "rascunho", "lote_id": 1042, "tamanho_pdf": null}	\N	\N	\N	2026-03-03 14:49:52.089476	\N	\N
742	53051173991	emissor	laudo_upload_backblaze_sucesso	laudos	1042	\N	{"lote_id": 1042, "file_size": 372180, "duration_ms": 1890, "emissor_cpf": "53051173991", "arquivo_remoto_key": "laudos/lote-1042/laudo-1772550058047-72ymoa.pdf", "arquivo_remoto_url": "https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1042/laudo-1772550058047-72ymoa.pdf"}	\N	\N	\N	2026-03-03 15:00:32.219789	\N	\N
743	35962136063	rh	INSERT	empresas_clientes	19	\N	{"id": 19, "cep": "45645456", "cnpj": "67394465000145", "nome": "empre pos revad 01", "ativa": true, "email": "fdsdf@fafas.com", "cidade": "lopipoi", "estado": "IO", "endereco": "rua pipoi rew 890", "telefone": "(46) 57987-9879", "criado_em": "2026-03-08T01:12:48.260373", "clinica_id": 128, "atualizado_em": "2026-03-08T01:12:48.260373", "cartao_cnpj_path": null, "responsavel_email": null, "representante_fone": "41998798897", "representante_nome": "rh 01 por refacr", "representante_email": "iyi@guuyu.cou", "contrato_social_path": null, "doc_identificacao_path": null, "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-03-08 01:12:48.260373	\N	\N
744	35962136063	rh	INSERT	funcionarios	1085	\N	{"id": 1085, "cpf": "25212642027", "nome": "Felipe Almeida 18061983", "ativo": true, "email": "felipe.almeida@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Supervisor", "perfil": "funcionario", "criado_em": "2026-03-08T01:13:57.234892", "matricula": null, "senha_hash": "$2a$10$G4NGcKCN2CDO0j8E2vZl0OGtbdfpXb6jm9crPqcP8R7vofDd78vHm", "incluido_em": "2026-03-08T01:13:57.234892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-08T01:13:57.234892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1983-06-18", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-08 01:13:57.234892	\N	\N
745	35962136063	rh	INSERT	funcionarios	1086	\N	{"id": 1086, "cpf": "35649372004", "nome": "Gabriela Lima 25121991", "ativo": true, "email": "gabriela.lima@empresa-teste.local", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Recepcionista", "perfil": "funcionario", "criado_em": "2026-03-08T01:13:57.234892", "matricula": null, "senha_hash": "$2a$10$wu8j0F/4E4jHolEgt84FdeT43ng1X5miF86NACOmO5t.K4nVxj456", "incluido_em": "2026-03-08T01:13:57.234892", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-08T01:13:57.234892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1991-12-25", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-08 01:13:57.234892	\N	\N
746	69558061069	rh	INSERT	empresas_clientes	20	\N	{"id": 20, "cep": "45678465", "cnpj": "33447623000166", "nome": "Farma Mori", "ativa": true, "email": "farmamori@mori.com", "cidade": "ctba", "estado": "PR", "endereco": "rua cur4iiba 456", "telefone": "(41) 99984-6465", "criado_em": "2026-03-09T01:55:13.380677", "clinica_id": 129, "atualizado_em": "2026-03-09T01:55:13.380677", "cartao_cnpj_path": null, "responsavel_email": null, "representante_fone": "41321321323", "representante_nome": "Gestor MedCtba", "representante_email": "medctba@med.com", "contrato_social_path": null, "doc_identificacao_path": null, "cartao_cnpj_arquivo_remoto_key": null, "cartao_cnpj_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_key": null, "contrato_social_arquivo_remoto_url": null, "cartao_cnpj_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_key": null, "doc_identificacao_arquivo_remoto_url": null, "contrato_social_arquivo_remoto_bucket": null, "contrato_social_arquivo_remoto_provider": null, "doc_identificacao_arquivo_remoto_bucket": null, "doc_identificacao_arquivo_remoto_provider": null}	\N	\N	Record created	2026-03-09 01:55:13.380677	\N	\N
747	69558061069	rh	INSERT	funcionarios	1087	\N	{"id": 1087, "cpf": "32586030060", "nome": "Olivia Fernandes 01121984", "ativo": true, "email": "dfsfd@dsffds.com", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Balconista", "perfil": "funcionario", "criado_em": "2026-03-09T02:01:06.381785", "matricula": null, "senha_hash": "$2a$10$m/DRkFshsPsBqOUh6qY3auRs.HUWjGLpXkhbxtg3ZFxjaX1BTryyO", "incluido_em": "2026-03-09T02:01:06.381785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T02:01:06.381785", "data_admissao": null, "inativado_por": null, "data_nascimento": "1984-12-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 02:01:06.381785	\N	\N
748	69558061069	rh	INSERT	funcionarios	1088	\N	{"id": 1088, "cpf": "75377605004", "nome": "Lucas Martins 07041994", "ativo": true, "email": "lucas.martins@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Suporte", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$nE47u92rqYAuP.feXbiiOusqpJwsyiuPwo3UbPyjE7BasRFnWqVQ.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1994-04-07", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 02:02:01.697892	\N	\N
749	69558061069	rh	INSERT	funcionarios	1089	\N	{"id": 1089, "cpf": "11110827075", "nome": "Mariana Costa 28061986", "ativo": true, "email": "mariana.costa@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Gerente", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$PaysZcY.wk85eRno5CLrQelrYiLvprzKP4zjPEiEYL4Mr.o8jGrga", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1986-06-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 02:02:01.697892	\N	\N
750	69558061069	rh	INSERT	funcionarios	1090	\N	{"id": 1090, "cpf": "19275874093", "nome": "Nicolas Alves 19091991", "ativo": true, "email": "nicolas.alves@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Farmaceutico", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$WAqqn1MCy5bOilZboiBynOh.757U0nSWyN.AoUDUT0I/l.XIEMnY.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1991-09-19", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 02:02:01.697892	\N	\N
751	69558061069	\N	lote_criado	lotes_avaliacao	1043	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1043, "empresa_id": 20, "numero_ordem": 1}	2026-03-09 02:03:14.828254	\N	\N
752	\N	\N	laudo_criado	laudos	1043	\N	{"status": "rascunho", "lote_id": 1043, "tamanho_pdf": null}	\N	\N	\N	2026-03-09 02:03:14.828254	\N	\N
753	69558061069	rh	INSERT	avaliacoes	10086	\N	{"id": 10086, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "75377605004", "motivo_inativacao": null}	\N	\N	Record created	2026-03-09 02:03:14.828254	\N	\N
754	69558061069	rh	INSERT	avaliacoes	10087	\N	{"id": 10087, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "11110827075", "motivo_inativacao": null}	\N	\N	Record created	2026-03-09 02:03:14.828254	\N	\N
755	69558061069	rh	INSERT	avaliacoes	10088	\N	{"id": 10088, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "19275874093", "motivo_inativacao": null}	\N	\N	Record created	2026-03-09 02:03:14.828254	\N	\N
756	69558061069	rh	INSERT	avaliacoes	10089	\N	{"id": 10089, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "32586030060", "motivo_inativacao": null}	\N	\N	Record created	2026-03-09 02:03:14.828254	\N	\N
757	75377605004	funcionario	UPDATE	avaliacoes	10086	{"id": 10086, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "75377605004", "motivo_inativacao": null}	{"id": 10086, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "75377605004", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-09 02:03:39.017698	\N	\N
758	11110827075	funcionario	UPDATE	avaliacoes	10087	{"id": 10087, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "11110827075", "motivo_inativacao": null}	{"id": 10087, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "11110827075", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-09 02:05:02.512098	\N	\N
759	32586030060	funcionario	UPDATE	avaliacoes	10089	{"id": 10089, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "32586030060", "motivo_inativacao": null}	{"id": 10089, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "32586030060", "motivo_inativacao": null}	\N	\N	Record updated	2026-03-09 02:11:37.965527	\N	\N
760	69558061069	rh	UPDATE	avaliacoes	10086	{"id": 10086, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "75377605004", "motivo_inativacao": null}	{"id": 10086, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "inativada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T20:57:19.726435+00:00", "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "75377605004", "motivo_inativacao": "gdsgdsgdsgdsdg"}	\N	\N	Record updated	2026-03-09 20:57:19.726435	\N	\N
761	69558061069	rh	UPDATE	funcionarios	1088	{"id": 1088, "cpf": "75377605004", "nome": "Lucas Martins 07041994", "ativo": true, "email": "lucas.martins@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Suporte", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$nE47u92rqYAuP.feXbiiOusqpJwsyiuPwo3UbPyjE7BasRFnWqVQ.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1994-04-07", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1088, "cpf": "75377605004", "nome": "Lucas Martins 07041994", "ativo": true, "email": "lucas.martins@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Suporte", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$nE47u92rqYAuP.feXbiiOusqpJwsyiuPwo3UbPyjE7BasRFnWqVQ.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T20:57:19.726435", "data_admissao": null, "inativado_por": null, "data_nascimento": "1994-04-07", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10086, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T20:57:19.726435"}	\N	\N	Record updated	2026-03-09 20:57:19.726435	\N	\N
762	69558061069	rh	UPDATE	avaliacoes	10087	{"id": 10087, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "11110827075", "motivo_inativacao": null}	{"id": 10087, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "inativada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T20:57:36.013224+00:00", "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "11110827075", "motivo_inativacao": "dsdgsgdsdgdgdggd"}	\N	\N	Record updated	2026-03-09 20:57:36.013224	\N	\N
763	69558061069	rh	UPDATE	funcionarios	1089	{"id": 1089, "cpf": "11110827075", "nome": "Mariana Costa 28061986", "ativo": true, "email": "mariana.costa@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Gerente", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$PaysZcY.wk85eRno5CLrQelrYiLvprzKP4zjPEiEYL4Mr.o8jGrga", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1986-06-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1089, "cpf": "11110827075", "nome": "Mariana Costa 28061986", "ativo": true, "email": "mariana.costa@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Gerente", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$PaysZcY.wk85eRno5CLrQelrYiLvprzKP4zjPEiEYL4Mr.o8jGrga", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T20:57:36.013224", "data_admissao": null, "inativado_por": null, "data_nascimento": "1986-06-28", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10087, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T20:57:36.013224"}	\N	\N	Record updated	2026-03-09 20:57:36.013224	\N	\N
764	69558061069	rh	UPDATE	avaliacoes	10088	{"id": 10088, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "iniciada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "19275874093", "motivo_inativacao": null}	{"id": 10088, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "inativada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T20:57:54.996159+00:00", "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "19275874093", "motivo_inativacao": "gdsdgssddsgd"}	\N	\N	Record updated	2026-03-09 20:57:54.996159	\N	\N
765	69558061069	rh	UPDATE	funcionarios	1090	{"id": 1090, "cpf": "19275874093", "nome": "Nicolas Alves 19091991", "ativo": true, "email": "nicolas.alves@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Farmaceutico", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$WAqqn1MCy5bOilZboiBynOh.757U0nSWyN.AoUDUT0I/l.XIEMnY.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T02:02:01.697892", "data_admissao": null, "inativado_por": null, "data_nascimento": "1991-09-19", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1090, "cpf": "19275874093", "nome": "Nicolas Alves 19091991", "ativo": true, "email": "nicolas.alves@empresa-teste.local", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Farmaceutico", "perfil": "funcionario", "criado_em": "2026-03-09T02:02:01.697892", "matricula": null, "senha_hash": "$2a$10$WAqqn1MCy5bOilZboiBynOh.757U0nSWyN.AoUDUT0I/l.XIEMnY.", "incluido_em": "2026-03-09T02:02:01.697892", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T20:57:54.996159", "data_admissao": null, "inativado_por": null, "data_nascimento": "1991-09-19", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10088, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T20:57:54.996159"}	\N	\N	Record updated	2026-03-09 20:57:54.996159	\N	\N
766	69558061069	rh	UPDATE	avaliacoes	10089	{"id": 10089, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "em_andamento", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "32586030060", "motivo_inativacao": null}	{"id": 10089, "envio": null, "inicio": "2026-03-09T02:03:15.962", "status": "inativada", "lote_id": 1043, "criado_em": "2026-03-09T02:03:14.828254", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T20:58:12.609503+00:00", "atualizado_em": "2026-03-09T02:03:14.828254", "funcionario_cpf": "32586030060", "motivo_inativacao": "gdsdgsdsggdsdsgdsg"}	\N	\N	Record updated	2026-03-09 20:58:12.609503	\N	\N
767	69558061069	rh	UPDATE	funcionarios	1087	{"id": 1087, "cpf": "32586030060", "nome": "Olivia Fernandes 01121984", "ativo": true, "email": "dfsfd@dsffds.com", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Balconista", "perfil": "funcionario", "criado_em": "2026-03-09T02:01:06.381785", "matricula": null, "senha_hash": "$2a$10$m/DRkFshsPsBqOUh6qY3auRs.HUWjGLpXkhbxtg3ZFxjaX1BTryyO", "incluido_em": "2026-03-09T02:01:06.381785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T02:01:06.381785", "data_admissao": null, "inativado_por": null, "data_nascimento": "1984-12-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1087, "cpf": "32586030060", "nome": "Olivia Fernandes 01121984", "ativo": true, "email": "dfsfd@dsffds.com", "setor": "Atendimento", "turno": null, "escala": null, "funcao": "Balconista", "perfil": "funcionario", "criado_em": "2026-03-09T02:01:06.381785", "matricula": null, "senha_hash": "$2a$10$m/DRkFshsPsBqOUh6qY3auRs.HUWjGLpXkhbxtg3ZFxjaX1BTryyO", "incluido_em": "2026-03-09T02:01:06.381785", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T20:58:12.609503", "data_admissao": null, "inativado_por": null, "data_nascimento": "1984-12-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10089, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T20:58:12.609503"}	\N	\N	Record updated	2026-03-09 20:58:12.609503	\N	\N
768	69558061069	\N	lote_atualizado	lotes_avaliacao	1043	\N	\N	\N	\N	{"status": "cancelado", "lote_id": 1043, "mudancas": {"status_novo": "cancelado", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-03-09 20:58:15.079946	\N	\N
769	\N	\N	lote_status_change	lotes_avaliacao	1043	{"status": "ativo"}	{"status": "cancelado", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-03-09 20:58:15.079946	\N	\N
770	69558061069	rh	INSERT	funcionarios	1091	\N	{"id": 1091, "cpf": "60478456069", "nome": "Yasmin Araujo 08091995", "ativo": true, "email": "yasmin.araujo@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Estagiário", "perfil": "funcionario", "criado_em": "2026-03-09T21:03:11.410881", "matricula": null, "senha_hash": "$2a$10$mzvsT5yZrqVlErhPTN7lK.f/PsqqvZH.9OFFG0AMXGhF4oHW6hj6u", "incluido_em": "2026-03-09T21:03:11.410881", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T21:03:11.410881", "data_admissao": null, "inativado_por": null, "data_nascimento": "1995-09-08", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 21:03:11.410881	\N	\N
771	69558061069	rh	INSERT	funcionarios	1092	\N	{"id": 1092, "cpf": "08427814046", "nome": "Zeca Barbosa 16121983", "ativo": true, "email": "zeca.barbosa@empresa-teste.local", "setor": "Operacional", "turno": null, "escala": null, "funcao": "Operador", "perfil": "funcionario", "criado_em": "2026-03-09T21:03:11.410881", "matricula": null, "senha_hash": "$2a$10$NzvGSBG18hzaiL8Dq49Sye2kRmeVcnHTnzlKxOCWUAT4w402ZXTsy", "incluido_em": "2026-03-09T21:03:11.410881", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T21:03:11.410881", "data_admissao": null, "inativado_por": null, "data_nascimento": "1983-12-16", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 21:03:11.410881	\N	\N
772	04703084945	rh	UPDATE	avaliacoes	10076	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "em_andamento", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": null}	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:37:59.302547+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": "dsgdssdsdsdgsdgdg"}	\N	\N	Record updated	2026-03-09 22:37:59.302547	\N	\N
773	04703084945	rh	UPDATE	funcionarios	1040	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-16T14:36:28.133277", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T22:37:59.302547", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-16T14:36:28.133277", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10076, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:37:59.302547"}	\N	\N	Record updated	2026-03-09 22:37:59.302547	\N	\N
774	04703084945	rh	UPDATE	avaliacoes	10075	{"id": 10075, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "iniciada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "97687700074", "motivo_inativacao": null}	{"id": 10075, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:38:19.167449+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "97687700074", "motivo_inativacao": "ddsgsdgdgdgdg"}	\N	\N	Record updated	2026-03-09 22:38:19.167449	\N	\N
775	04703084945	rh	UPDATE	funcionarios	1039	{"id": 1039, "cpf": "97687700074", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.coy", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-02-16T14:21:52.758386", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	{"id": 1039, "cpf": "97687700074", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.coy", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T22:38:19.167449", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10075, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:38:19.167449"}	\N	\N	Record updated	2026-03-09 22:38:19.167449	\N	\N
776	04703084945	\N	lote_atualizado	lotes_avaliacao	1038	\N	\N	\N	\N	{"status": "cancelado", "lote_id": 1038, "mudancas": {"status_novo": "cancelado", "status_anterior": "ativo"}, "emitido_em": null, "enviado_em": null}	2026-03-09 22:38:21.733618	\N	\N
777	\N	\N	lote_status_change	lotes_avaliacao	1038	{"status": "ativo"}	{"status": "cancelado", "modo_emergencia": null, "motivo_emergencia": null}	\N	\N	\N	2026-03-09 22:38:21.733618	\N	\N
778	04703084945	rh	INSERT	funcionarios	1093	\N	{"id": 1093, "cpf": "17129287080", "nome": "Hugo Mendes 14081987", "ativo": true, "email": "hugo.mendes@empresa-teste.local", "setor": "TI", "turno": null, "escala": null, "funcao": "Analista de Sistemas", "perfil": "funcionario", "criado_em": "2026-03-09T22:39:06.167757", "matricula": null, "senha_hash": "$2a$10$zK9geg1dIAg8xaHSPlSJU./VsG83EVK9wm2TN2IBLraLx6VKYJ89W", "incluido_em": "2026-03-09T22:39:06.167757", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T22:39:06.167757", "data_admissao": null, "inativado_por": null, "data_nascimento": "1987-08-14", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 22:39:06.167757	\N	\N
779	04703084945	rh	INSERT	funcionarios	1094	\N	{"id": 1094, "cpf": "42212215002", "nome": "Isabela Rocha 03051993", "ativo": true, "email": "isabela.rocha@empresa-teste.local", "setor": "Marketing", "turno": null, "escala": null, "funcao": "Estagiário", "perfil": "funcionario", "criado_em": "2026-03-09T22:39:06.167757", "matricula": null, "senha_hash": "$2a$10$crEmq1NYkJDPs73LAfpJBeNlZHt6Hr61AM9kzKCtnSuCo8ZkEhxqC", "incluido_em": "2026-03-09T22:39:06.167757", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T22:39:06.167757", "data_admissao": null, "inativado_por": null, "data_nascimento": "1993-05-03", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-09 22:39:06.167757	\N	\N
780	04703084945	rh	UPDATE	funcionarios	1040	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": true, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-09T22:37:59.302547", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-16T14:36:28.133277", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10076, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:37:59.302547"}	{"id": 1040, "cpf": "29371145048", "nome": "Entidade fem", "ativo": false, "email": "reewrrwerweantos@empresa.cyy", "setor": "Operacional", "turno": null, "escala": null, "funcao": "estagio", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "gestao", "inativado_em": "2026-03-09T22:39:17.851569", "atualizado_em": "2026-03-09T22:37:59.302547", "data_admissao": null, "inativado_por": "04703084945", "data_nascimento": "2002-02-02", "data_ultimo_lote": "2026-02-16T14:36:28.133277", "indice_avaliacao": 6, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10076, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:37:59.302547"}	\N	\N	Record updated	2026-03-09 22:39:17.851569	\N	\N
781	04703084945	rh	UPDATE	avaliacoes	10076	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:37:59.302547+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": "dsgdssdsdsdgsdgdg"}	{"id": 10076, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:37:59.302547+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "29371145048", "motivo_inativacao": "dsgdssdsdsdgsdgdg"}	\N	\N	Record updated	2026-03-09 22:39:18.669262	\N	\N
782	04703084945	rh	UPDATE	funcionarios	1039	{"id": 1039, "cpf": "97687700074", "nome": "Entidade masc", "ativo": true, "email": "jose53va@empresa.coy", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "operacional", "inativado_em": null, "atualizado_em": "2026-03-09T22:38:19.167449", "data_admissao": null, "inativado_por": null, "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10075, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:38:19.167449"}	{"id": 1039, "cpf": "97687700074", "nome": "Entidade masc", "ativo": false, "email": "jose53va@empresa.coy", "setor": "Administrativo", "turno": null, "escala": null, "funcao": "Analista", "perfil": "funcionario", "criado_em": "2026-02-16T14:21:52.758386", "matricula": null, "senha_hash": "$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW", "incluido_em": "2026-02-16T14:21:52.758386", "nivel_cargo": "operacional", "inativado_em": "2026-03-09T22:39:27.465146", "atualizado_em": "2026-03-09T22:38:19.167449", "data_admissao": null, "inativado_por": "04703084945", "data_nascimento": "2001-01-01", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": 10075, "ultima_avaliacao_status": "inativada", "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": "2026-03-09T22:38:19.167449"}	\N	\N	Record updated	2026-03-09 22:39:27.465146	\N	\N
783	04703084945	rh	UPDATE	avaliacoes	10039	{"id": 10039, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "inativada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T14:24:21.718138+00:00", "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "97687700074", "motivo_inativacao": "tdgsdgsgdssdgdg"}	{"id": 10039, "envio": null, "inicio": "2026-02-16T14:23:19.034", "status": "inativada", "lote_id": 1019, "criado_em": "2026-02-16T14:23:17.887271", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-02-16T14:24:21.718138+00:00", "atualizado_em": "2026-02-16T14:23:17.887271", "funcionario_cpf": "97687700074", "motivo_inativacao": "tdgsdgsgdssdgdg"}	\N	\N	Record updated	2026-03-09 22:39:28.282069	\N	\N
784	04703084945	rh	UPDATE	avaliacoes	10075	{"id": 10075, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:38:19.167449+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "97687700074", "motivo_inativacao": "ddsgsdgdgdgdg"}	{"id": 10075, "envio": null, "inicio": "2026-02-27T05:43:34.678", "status": "inativada", "lote_id": 1038, "criado_em": "2026-02-27T05:43:16.178477", "grupo_atual": 1, "concluida_em": null, "inativada_em": "2026-03-09T22:38:19.167449+00:00", "atualizado_em": "2026-02-27T05:43:16.178477", "funcionario_cpf": "97687700074", "motivo_inativacao": "ddsgsdgdgdgdg"}	\N	\N	Record updated	2026-03-09 22:39:28.282069	\N	\N
785	04703084945	rh	INSERT	funcionarios	1095	\N	{"id": 1095, "cpf": "80943363071", "nome": "Edna 02022002", "ativo": true, "email": "dffsd@saffas.com", "setor": "RH", "turno": null, "escala": null, "funcao": "Gestora", "perfil": "funcionario", "criado_em": "2026-03-10T22:58:32.934556", "matricula": null, "senha_hash": "$2a$10$OqXbSFwlZqclhIfc5dJ8D.58IEpycbl6pHNIqd4Y1sQcegjZaG1L2", "incluido_em": "2026-03-10T22:58:32.934556", "nivel_cargo": "gestao", "inativado_em": null, "atualizado_em": "2026-03-10T22:58:32.934556", "data_admissao": null, "inativado_por": null, "data_nascimento": "2002-02-02", "data_ultimo_lote": null, "indice_avaliacao": 0, "ultimo_lote_codigo": null, "ultima_avaliacao_id": null, "ultima_avaliacao_status": null, "ultimo_motivo_inativacao": null, "ultima_avaliacao_data_conclusao": null}	\N	\N	Record created	2026-03-10 22:58:32.934556	\N	\N
786	04703084945	\N	lote_criado	lotes_avaliacao	1044	\N	\N	\N	\N	{"status": "ativo", "lote_id": 1044, "empresa_id": 5, "numero_ordem": 8}	2026-03-10 22:58:55.770127	\N	\N
787	\N	\N	laudo_criado	laudos	1044	\N	{"status": "rascunho", "lote_id": 1044, "tamanho_pdf": null}	\N	\N	\N	2026-03-10 22:58:55.770127	\N	\N
788	04703084945	rh	INSERT	avaliacoes	10090	\N	{"id": 10090, "envio": null, "inicio": "2026-03-10T22:58:56.941", "status": "iniciada", "lote_id": 1044, "criado_em": "2026-03-10T22:58:55.770127", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-10T22:58:55.770127", "funcionario_cpf": "80943363071", "motivo_inativacao": null}	\N	\N	Record created	2026-03-10 22:58:55.770127	\N	\N
789	04703084945	rh	INSERT	avaliacoes	10091	\N	{"id": 10091, "envio": null, "inicio": "2026-03-10T22:58:56.941", "status": "iniciada", "lote_id": 1044, "criado_em": "2026-03-10T22:58:55.770127", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-10T22:58:55.770127", "funcionario_cpf": "17129287080", "motivo_inativacao": null}	\N	\N	Record created	2026-03-10 22:58:55.770127	\N	\N
790	04703084945	rh	INSERT	avaliacoes	10092	\N	{"id": 10092, "envio": null, "inicio": "2026-03-10T22:58:56.941", "status": "iniciada", "lote_id": 1044, "criado_em": "2026-03-10T22:58:55.770127", "grupo_atual": 1, "concluida_em": null, "inativada_em": null, "atualizado_em": "2026-03-10T22:58:55.770127", "funcionario_cpf": "42212215002", "motivo_inativacao": null}	\N	\N	Record created	2026-03-10 22:58:55.770127	\N	\N
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria (id, entidade_tipo, entidade_id, acao, status_anterior, status_novo, usuario_cpf, usuario_perfil, ip_address, user_agent, dados_alterados, metadados, hash_operacao, criado_em) FROM stdin;
1	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	af22c7c87dff85038a0669cb37de18fc1c3c9b2a659c4629786fd259d835770e	2026-02-09 20:54:10.05976
2	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	ecf78fb29ffdec916b43cb612a1bfb4d6bc001d8a324dfe5e84a39d812964c35	2026-02-09 20:57:31.511215
3	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	6139eb596e22577e39d9cdab88867488029d3f769e4d526e2da40dc46006c637	2026-02-09 21:03:58.921289
4	login	100	login_falha	\N	\N	29930511059	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "pagamento_nao_confirmado"}	5db9436b27358182e3168d95f4fc943c8edf87e78f6e32178ecb61fb086d4097	2026-02-09 21:42:30.880999
5	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8b441cf70169a328e011182a7c8f2310e1cebf5c4457ce43960b588683a300c9	2026-02-09 22:03:56.646132
6	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	1d4dfa5238dc0c32ba2d281ffc7f582844add3ac6a1bb5f71235310b9ebb1ebc	2026-02-10 02:26:07.657706
7	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f707e83cdc660fae3a1647766b5b53451f967055c4829cf9f0dd33fde1765145	2026-02-10 02:56:29.886146
8	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	27f9d84d594b54ffc7214542db4fc19b11a7cd9430c5f36e782b0a6b0030d15e	2026-02-10 03:03:46.618512
9	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a11a2f4932f0d63fb19c6bccb193ef4d90dba6aa60429b8c6e4d3a1091ffd33e	2026-02-10 04:21:42.157373
10	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	d307a770ffdccdca77de43648b0eec2eefc791a0f8dfe7870e96b7b941c050ea	2026-02-10 09:44:03.25496
11	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	2128cebb53e031cb661eee83a3bfcd28643d0574a42aece20006011b90e8849b	2026-02-10 10:05:53.031865
12	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	374dd9e3a2281002b303061cbd85bad8c3a321f27bcdff9f285a9e5f1ee6b7ed	2026-02-10 10:40:32.46895
13	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	433adca1bca7399c3fd1b8711fb584eb97e9402b6d731ec8e2ceec6adfe4ca0d	2026-02-10 10:41:01.039575
14	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	6d1a06a8108781d52b73b3737d793b4b98b95d81248da2a11383506ec572327e	2026-02-10 10:42:11.900431
15	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	223f7bd6ce6b4b0764804f7d0dc2cd0f317a539fbc063676e952bcc4aecef02b	2026-02-10 10:43:39.771891
16	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	365fd8d71d8d6bd71f8fe8ab630df1e849120f7b5e435245eeb401ffd30fc4f2	2026-02-10 10:56:00.829494
17	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	52bdf10ef913525288272cfa21118f1e742fecf13938577e09b84bfda11f2fad	2026-02-10 11:29:08.573928
18	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	804a58356d6030ff02ad609e2d57abe3b37af3e02f122f8e2ba3a556ddfd466d	2026-02-10 11:30:00.60518
19	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	54b6fdfeca7ddc683c6263c7e895ea5b729f640d824d6a9574670faed5abdebc	2026-02-10 11:30:33.240225
20	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	adbc750d3d3c3725e9819bb1879589578579de8b07bff80d9d8020ec00596f5a	2026-02-10 11:39:39.813885
21	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8ef20e4674154fa74527dad94b5b3de1d8ebeef716bf6490f5157a7d2ee5772f	2026-02-10 11:40:15.056814
22	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	31f9b1c0d6c26822a7e34f20a8dec938125c59f7d9bd73a961eff26f44123d72	2026-02-10 11:40:57.414637
23	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c0cbfc02afe9db388ac0c4cc334e01b74a516e2d61d0d1c5b37d588feda982aa	2026-02-10 11:41:36.9066
24	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	da4da6092800fdf3b2ace446373bdb48f1acf0c127501c7d522b2d6d60d89ab9	2026-02-10 12:11:02.530022
25	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	486c33837ad4928bc37ad1aa926164213fd37bc7ae4c2d94fe03b83fb774ac33	2026-02-10 12:21:14.442204
26	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8b2aed4c2b84898032a1641c546cc8a37934827f8ccc48df4b4107a0b5b0ec7d	2026-02-10 12:22:37.002966
27	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	8cfb355ad02cfb7e0d6dfe440b3e03afd6677ed7c3b8184b497e31ad4797b248	2026-02-10 12:25:03.842268
28	login	105	login_sucesso	\N	\N	24626149073	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": 105, "tipo_usuario": "gestor"}	daa6f519947ff19e5da85bb53e9a623dc6cf494ad6d08a55d287dcc5b1a9cff6	2026-02-10 12:33:03.067126
29	login	0	login_falha	\N	\N	49651696036	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	20b511e9dc0ffc52e23640dd7a6095064697ba8c8ec2e18ce9bc83e784b41b71	2026-02-10 12:35:08.199239
30	login	0	login_falha	\N	\N	49651696036	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	32cd400bf76c04fa8728376fddd70800d65fdb4405e0814bacafe3e03edabb0a	2026-02-10 12:35:18.333654
31	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	2de2efcf12623629d1b1aa53033eedb27e9b1416070cfc89e4a200a0afac95ff	2026-02-10 12:36:07.710969
32	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	e48005507e45d751dc584a572ae2c01a9c7b543f5f458cbaec0fdbf19ded7cad	2026-02-10 12:49:07.751544
33	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	19fdbdcb765b9a44158d7ac4c96885be7453957e10db1e83123c6858421c0d9e	2026-02-10 12:51:42.24205
34	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	58c489650b819c8d0df79c7aa21470b332177d5fe0311580199459f4200d060f	2026-02-10 13:37:22.422179
35	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f4d6c5eae38f724a1bb25715063d75dabdc74ca024c258ec40f51e0d35e00bce	2026-02-10 13:58:51.98084
36	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c972b71fbea0a7b50d603d3273e0f4fffb8ab6978f6746e8de3083a0b862ca1b	2026-02-10 13:59:24.080515
37	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	6b3584c6fc4d36007c40f24a7f8b455c8f978431d298f453edab7475ec8dd7a2	2026-02-10 14:13:39.918046
38	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	5e3b1d036a24ab87378f7767e5074d3135389a72ac1bb60f323f70543ccaaab5	2026-02-10 15:15:40.425324
39	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c66c4ed34d8f6958e81e684a2f5221a6a928cd1dcb8d20795977fd5a37173c7f	2026-02-10 15:17:42.764906
40	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7d7186b61bb8992f8813c1a1ff01737db0df19b471a5ea52ba0af83bc7599fb1	2026-02-10 15:18:23.124184
41	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	df325d17e12171d7ea423e7db27b81959a10f0253fa3ecfe2efc7d130c7453cb	2026-02-10 15:27:26.430478
42	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	40c9b2784c507f0ec81e4b40105b621b5873ebe92bb5323d34c1056f157ed758	2026-02-10 15:28:58.317883
43	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	aeb9296ffc57caaa4d04d8ab0dbc0796b47dfe7fa78a53699a38fa672e517252	2026-02-10 15:42:45.471099
44	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	35b4635c4adfc6b334220fc5133d4bfcd6d059d7249c84c3db76c26d6df4e284	2026-02-10 15:43:02.312013
45	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7f84b45825d7a2e2f614a84f98a28324e65bcba644a32a8f80e9d1ac0a74e323	2026-02-10 15:55:54.251117
46	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	9588f65e4d73cd17726bf92f974de7ec9ed33f2cb3013d2f3bfbb3cd71d76555	2026-02-10 16:07:38.216811
47	login	0	login_sucesso	\N	\N	36381045086	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c49b099c670e87b5a6aaefafceb5b15dbebc9db1d0c9523343cdc8b38dc1ae6e	2026-02-10 16:08:48.713052
167	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	1a27d37fb478b81bb8e2c9565ff97527650364c59e564d28d55fa7b2342ab9cd	2026-02-13 00:00:29.219082
48	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	fc713583fe80feab12bee33b6abfa605a52d0ada93ac44489acb81a6dbf66e6c	2026-02-10 16:30:10.028109
49	login	0	login_falha	\N	\N	03175612008	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	3e7820b61d4e396dbee6fa7fdde58b907af20750078f1ebd44ebe3a40bb8a5c0	2026-02-10 16:30:37.820494
50	login	0	login_sucesso	\N	\N	03175612008	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7a9a6dd26091c33a64a881b84a9a3012423c68d6f6fbae1206266e49d66a36b7	2026-02-10 16:31:10.480598
51	login	0	login_sucesso	\N	\N	73922219063	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	a32047579b47850406865e32c15f2513fe79e146a6ca9a5dd237cff310f054bc	2026-02-10 16:40:11.815207
52	login	0	login_falha	\N	\N	03175612008	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	93d963df35e6a8aeaa213fffb44d9e7f1b460f0a14770d49c9cecafdf0a10c78	2026-02-10 17:19:13.161261
53	login	0	login_sucesso	\N	\N	73922219063	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	43a6eac833f706dbfb97e0001a6a83df60ad231a82d6ff3dfb18a15a0cf4b766	2026-02-10 17:19:24.46998
54	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	552421e7bff84113cd383580268e8b129ef63811d331ce34f31db64c2a1f1bae	2026-02-10 17:23:44.278
55	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	2beefc484064cb31121192929741a49e7c95f083e9f3c08cedd3f6b010dfd1f5	2026-02-10 17:24:24.838743
56	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	4a6c74537630dd5f88945412c82b5603b257c292e53976fd223211eff4bd1bc1	2026-02-10 18:14:47.042796
57	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	021bc95897d3081d24d2c46b7ee9a97a728fe96d8d2947d15587554aed60b873	2026-02-10 18:17:08.055818
58	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	08cf7f70fa755edc9aac1849ae13069472572254b8ce318169546d3d6daf3a44	2026-02-10 18:24:00.638593
59	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	b67ff27bdf34f638b23b61ad6c97219e73332c684202d2e9866c0a70e07dbf1c	2026-02-10 18:25:05.077356
60	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	e0265086b5d0d83c6f8bdce24f8c675e68a5f94a41daf8a11324baa16dbd6911	2026-02-10 19:06:39.601403
61	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	4962688b6691aad885ff48c46279cdd1cc7c4c24a6732b7dbdbcd28c47f31b49	2026-02-10 19:07:10.339009
62	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	4ad1e382c8dc38567d4bff178d03dd7e45971c59c4fbae64a003839a291f400f	2026-02-10 19:47:00.263739
63	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	5fa64588abeb2347ed71fc2c5a3720ac570933220dfb3d7ba64ad3f3ab124f5f	2026-02-10 19:49:51.295325
64	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	210901797a2b62c2fc7e631911b4d67384aaffc12bc8208dcee8e6a1eed325cd	2026-02-10 19:50:45.098484
65	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	dfafc45bb6407dab22b3e1f30aa0d9fa2c3fc73c62534654840dc62e41cceac8	2026-02-10 19:51:19.425094
66	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	1fa76da827f1ad0b0177425ee2719c79affa87627583692839d8337ed96c8416	2026-02-10 19:52:09.753627
67	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	88a2bfca590b96305860dcacf017b195bd622e0dc573db93d061b2302a02f0e7	2026-02-10 20:23:33.311462
68	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	19c817fff675cfa3e6af0c556b6733c02b9e9646b6de53c928d06771dff8c781	2026-02-10 20:29:03.813661
69	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	88842a754392db380c836820a770fd315cb006d39fc8b93c83e5fe248376ece7	2026-02-10 20:29:35.761542
70	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	a7925caf5f98fa0f50a31f26675663fb48c29db937f401e3ccae826717907910	2026-02-10 20:30:22.753261
71	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	165b978af9c295054222fdc0eb63f391d22ae62cead9830a784f135a81a10b65	2026-02-10 20:54:07.183585
72	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	cc7816bf623184d8de1beaaebaf01787f831f7bc6f981d67b65e8caef2132ea9	2026-02-10 20:54:20.933741
73	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	bebc4eb63ef250e24c8fba9b03e95e1d580c9e677011c385f66942a084266ecf	2026-02-10 21:56:40.979343
74	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	6ea382a969fc61035e043d7fc2664fe9246f9cf1d7d1140a98d920a64871e7b1	2026-02-10 23:14:23.2145
75	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	fbda01dfc14e049f1aa0109d0c0d203bbf95c8f9351a9a2de6fecaebce15f84e	2026-02-10 23:17:46.500401
76	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	91e0193736ce4b7a22835ae28a5dc8daab6959b83c590809e90bf91538b2806a	2026-02-10 23:52:41.095296
77	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	f4965561a4988d374f8764c48203e2a42f7dac604ccf5fc41ef27180a006781c	2026-02-10 23:59:41.006842
78	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	ffe77457bcbe13c3de5fb9335d86afb9c313989d4e934b7480c4f30bcbb031b5	2026-02-11 00:30:52.78449
79	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a51d56f0e2c93baf700876a51ced9a14593b0547af27eb3b0eb5b6455e71a542	2026-02-11 00:31:53.020386
80	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	62fd804a84bf68c51db8fa7f44f3568184197d2da0a036de60354a783dbca40a	2026-02-11 00:57:30.82492
81	login	106	login_sucesso	\N	\N	35051737030	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 106, "tipo_usuario": "gestor"}	f866c2edbf5373dd8a617c8ebfcd1d1dd805f1c64788c35dbb7d171d64a99f17	2026-02-11 01:03:19.238659
82	login	0	login_sucesso	\N	\N	65648556055	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	54ec7f39240842867ef6a979a2b68dbf821f2e20723fdfa3a256c316311d4778	2026-02-11 01:06:24.270035
83	login	0	login_sucesso	\N	\N	18597536047	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	66513bcff59065a4a40f2f7dbdc403de65e7c5874425c076ee478207636c56ae	2026-02-11 01:08:44.650378
84	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	76dadef11f334cefbeb403aaab0543b435c5b93bff2ddb5b7d1a69584d873a5f	2026-02-11 01:15:37.569536
85	login	106	login_sucesso	\N	\N	35051737030	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 106, "tipo_usuario": "gestor"}	7f94ba1219d7ee76fc344014f813082e6d95ab49aa4a830a136bea8fb3c53848	2026-02-11 01:16:51.606887
86	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	63f6219b9af1e0b6b5d4a16ff01a56460350eaf5fc3af854111b58d6f0664592	2026-02-11 01:17:19.302528
87	login	107	login_sucesso	\N	\N	64411953056	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 107, "entidade_id": null, "tipo_usuario": "rh"}	79e4a5fb74bb01ee826fb2bda48944c5439264b443f7622052377b8744a49cd8	2026-02-11 01:51:15.756561
88	login	0	login_falha	\N	\N	85804194097	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	cecece6efa076afc287db8646f01ee5dab8179c70c6c27b822cbd7f108a8a99b	2026-02-11 01:53:56.88325
89	login	0	login_falha	\N	\N	85804194097	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	bcea7b08f74810a21bda70e93f40f54fd3fc74bcc6f6618e1bfc659a27703745	2026-02-11 01:54:26.543469
90	login	0	login_sucesso	\N	\N	85804194097	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	73864502f8fce11c929106f40431ef4a7c192c7fbdc0a5287434a8664053bbcf	2026-02-11 01:54:49.309626
91	login	0	login_sucesso	\N	\N	32911756037	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	a375428d78c31c95560364a40426489c122d0caaee881d8b1430e7fc4b2f8932	2026-02-11 01:58:44.802532
92	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	04a09ddec45c666af217c84fd1e6954381a0cc67e65af3542b2db34f702668c8	2026-02-11 02:02:26.096607
93	login	107	login_sucesso	\N	\N	64411953056	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 107, "entidade_id": null, "tipo_usuario": "rh"}	0ea3188df901975967c357e67216e8633e7bf16cec69287a598d220602e6a385	2026-02-11 02:03:37.526362
94	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	47aa326919c32bf9aff15d09052c47012c012ca15abbe1c8d5a5947e2a3c52ed	2026-02-11 02:05:04.538652
95	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	11d62c05f5838d8883106a71d94355149defef4f4c9dc724f062e24c52c2774c	2026-02-11 02:05:42.228432
96	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	364b6eb1c111fbfe14e6aaa2b023b3c6b24f5cf118d87b0aab9f7ae4da39534e	2026-02-11 03:14:31.82798
97	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	e88e45a0b9762d44f4bbdc06d8f71e42140bc07cced78918fe8f1963bb1f9cb1	2026-02-11 03:14:53.346427
431	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	\N	5aee32193da0e5a74e94f326d7889d99f2971478970b8db8d684e36f1b31442c	2026-02-27 12:41:32.949183
98	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	7f461ed5d5fad45b13878fb6e68f1f1123be1e13391b0d033b4a9f3efdd3275a	2026-02-11 03:19:57.331262
99	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	76d6d55733d58717158a2bb0e6650eca83a9c01e7f93b0a860ebb2a008c71736	2026-02-11 10:34:33.729768
100	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	252685370465b7f893f3c8af17c64d2c4cce4ee1a467d9c00dacd7935a2e0a4a	2026-02-11 23:36:44.217001
101	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	3da9bd47c13fe9fa77329f6e1dc6efa31a5589a7126c8406859a4ebcb66dbea6	2026-02-11 23:37:22.182262
102	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	406cd0344e35571d976a65626aaee711f2ac39397ba212c3da4cc4d45dce3626	2026-02-12 05:29:16.329255
103	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	f8b8e8f59d827c2d2930531be8de302e661835284a6a222da76756cc778ba641	2026-02-12 05:29:38.87107
104	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c639988e93ec5963d2c78d968a55ec0cf54b3711ca4e1265513add37ffb003f2	2026-02-12 05:30:12.396339
105	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	1a73b1021d350afda3c40cbdc5a72e11a860fb63e8d10dbd3178f6e1d444f170	2026-02-12 05:30:46.190601
106	login	108	login_sucesso	\N	\N	87748070997	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 108, "entidade_id": null, "tipo_usuario": "rh"}	6a294b266708fe25a921e17d07018606c2aa86f361a72cfff18f0a08b9d847af	2026-02-12 12:13:52.452376
107	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	ff6f9471188ba064fc21abbeffdc14b27edb7dc73b704ed9964b2bdbb9db04d4	2026-02-12 12:23:21.769014
108	login	0	login_falha	\N	\N	73922219063	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	58cceeca016d50e7f8067b1f992753ff384a61a049133da5f547ee9cc68bd2fc	2026-02-12 12:27:15.351431
109	login	0	login_sucesso	\N	\N	73922219063	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f1929366d79683b007956461d4b03d7f9c512eb5188a03316b39104941b5f024	2026-02-12 12:27:46.637736
110	login	0	login_sucesso	\N	\N	03175612008	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	eff8323b79a0a0a253041b8ded954be531b17f4a720492d41a878831a032f3c1	2026-02-12 12:28:00.358685
111	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	c7b96f679c55279d5747e9dcbbc2a7f41aabcae9e3c720a772768dd0a2e204ef	2026-02-12 12:32:32.812674
112	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	c9db7e0f98c14c1fe51a988ad0f43f1a1ed302a4a8cc5c448c9f5ac6173169e0	2026-02-12 12:32:38.496212
113	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	7247967c6212b0798b107f1502f1b76d4480a252b5e32b0ceb6810890e4d8c5a	2026-02-12 12:32:46.297589
114	login	0	login_falha	\N	\N	00000000000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	d13731d32d0ad30d1cda75730550cfb1022525e3f0fa1c58b6c95b240802ac65	2026-02-12 12:32:50.099155
115	login	0	login_sucesso	\N	\N	00000000000	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	6738ca08533f85a90cf0cd5675dcc3ca598f2a268e2a3fb2886fa985068cbe10	2026-02-12 12:32:53.11883
116	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	3229712c3442891a23582d55766947d0a1d9bc64d11961b2dca853f493156f07	2026-02-12 12:38:38.313851
117	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	bf4a1ab7dd2ef475a13e274ff79d30a3b609e148788833c5c709ac453393d836	2026-02-12 12:39:29.541818
118	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	7cfe01bf5efa221bc1c637e083458521a3b615af0c12aa5619af841f02ab539f	2026-02-12 14:22:37.581201
119	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	4e41c5637312827ed85347a0e60ad5f515b1ec11c58bd1d0dcbd4fcef1dce044	2026-02-12 14:23:04.533655
120	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ddfcf4cfee0028d2e6bf5a4d3e859ccdaf98fd4a6261140dd0a80b64635eb8a0	2026-02-12 14:23:48.368653
121	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	77bbd36194d63408c924eb3968a3b6f1624821dc67b5fb911a0d19b643e10476	2026-02-12 14:24:45.714828
168	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	3b3e1256d40334edfb292f2ba1f17f3b2383e92a5c18630cb01a84a9604ee35d	2026-02-13 00:00:38.658721
122	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	3012e7cc5c061fe7a5f87bb098fc4a7b7532ab3dd7aa1a08f7187f17f40fcae0	2026-02-12 14:25:27.375586
123	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c3ca04657ab12d5218b31f8a14cd817188f90093abb2f4d9dfc2eae77ce27147	2026-02-12 14:27:22.791254
124	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	6617a00677b3d25b81909f2edf4d7a8734c4b355b2e9b9f45e30244eca8fbb27	2026-02-12 14:28:43.908852
125	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ad0fa2f29c4b4eebb94fc3fe5ec06e12dac9fd32f217b79ea4b9868db698c8b8	2026-02-12 17:46:21.257189
126	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	dbb49843d49ea6fcbb12c864fabec63c66e1ba67b0240b5fa80832507211347b	2026-02-12 18:01:04.215072
127	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	daa70ed6bd152fe83edbe13d51e7e76163c9ccad85d8cd93cc2f0f4b905f929a	2026-02-12 18:21:06.307062
128	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	cea8086416cb88a8f34ff9ca95804bded2f3c302a04876ab0723fa7f458304d8	2026-02-12 18:30:25.413298
129	usuario	109	aceitar_termos_privacidade	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "820ba6130f7c8b1e750242eaf04b46c5a53b536ed74b28115de5a569888633c8", "termo_tipo": "termos_uso", "entidade_cnpj": "26698929000120"}	ec89786b8d7344ce038ddb7230ba3de9a44aad29489fa9f5c72a8abc0dc03943	2026-02-12 18:30:31.712659
130	usuario	109	aceitar_termos_privacidade	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "820ba6130f7c8b1e750242eaf04b46c5a53b536ed74b28115de5a569888633c8", "termo_tipo": "politica_privacidade", "entidade_cnpj": "26698929000120"}	60d2b27b1a4a46bcac9e67617a6dad71529be4ac1becdf1499cfef21503d0a63	2026-02-12 18:30:38.92794
131	login	109	login_sucesso	\N	\N	03178539026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 109, "entidade_id": null, "tipo_usuario": "rh"}	b7906deb55965987ac7579b5624ce4e2172382ea1aea3982c52d70a997c1e31f	2026-02-12 19:55:03.135756
132	login	0	login_sucesso	\N	\N	42447121008	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	56e5e56b4968e8098fbf116083697284524e6a5c6c135bd453c878b6d1df0ceb	2026-02-12 19:56:22.088102
133	login	0	login_sucesso	\N	\N	89487826068	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	06b42c473b686323f4bef1bf3a9c3a483ca37143d2397738ca682b098bc0c098	2026-02-12 20:15:40.779964
134	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	c986190422d919e6c8676dfc56a9f9dd082b25238a58400cebed639e46e0eee2	2026-02-12 20:17:28.589988
135	usuario	104	aceitar_termos_privacidade	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4e86a27d6d34b34f01a782f76cd17a20a40235ab394b8fe06e29f4dc6518bc6a", "termo_tipo": "termos_uso", "entidade_cnpj": "09110380000191"}	e566589c5a73ba093a3de69fef82d36eb8f06831a460e2dac7673b7a423603f5	2026-02-12 20:17:37.644116
136	usuario	104	aceitar_termos_privacidade	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4e86a27d6d34b34f01a782f76cd17a20a40235ab394b8fe06e29f4dc6518bc6a", "termo_tipo": "politica_privacidade", "entidade_cnpj": "09110380000191"}	0758fb4e8105c8766c98a255a3a95e1c2c31bf8fc2cc39513193c7cc7f52a956	2026-02-12 20:17:42.53066
137	login	0	login_sucesso	\N	\N	73922219063	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	28c64f22709adcffddead0cffbe6f9e67e80b9537007bcccb7689edc02766e62	2026-02-12 20:19:21.536184
138	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ae74c5d0681b0e9857dc17a6618f486353d930188e2297eb448d1bfe0cff5b63	2026-02-12 21:08:36.796232
139	usuario	100	aceitar_termos_privacidade	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "febf04b400297f4935754fafa6facdef650afb22288921df12828c9b6a3cdd58", "termo_tipo": "termos_uso", "entidade_cnpj": "02494916000170"}	47156930c5bf3f705eb6a900ddc61651d37610f02cf031494fa7273a4f0931a5	2026-02-12 21:08:41.62462
140	usuario	100	aceitar_termos_privacidade	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "febf04b400297f4935754fafa6facdef650afb22288921df12828c9b6a3cdd58", "termo_tipo": "politica_privacidade", "entidade_cnpj": "02494916000170"}	353ab4ec72b06b213d616132b4eb3e5cb8fae48c6281b6193d0fd2abba4fface	2026-02-12 21:08:55.327357
141	login	0	login_sucesso	\N	\N	49651696036	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	5ca067879037de5a9edcc1dd5b9ad69b209c1166f8143e81a6bc10e64159f4d5	2026-02-12 21:10:08.815755
142	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	321aa69b48c4ad3db514666dd3370f878d36e20d0e226ed5c4263d4bcd8e52b6	2026-02-12 21:10:47.387836
143	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	67a707bce85981eb38778003051bdbce97872d94235a2ba74b4d9160dbdeddc3	2026-02-12 21:11:12.501668
144	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	5a8066a598797cb01e6255477e17f91e185edcfd497ced7bf330d2fc3ccc0623	2026-02-12 21:11:33.235747
145	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	aec1e89529c0bab621dea49312623abde2f3973172cfd2b1f512bf3b60564df5	2026-02-12 21:11:45.102527
146	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	fd8ca12e6b62c2fc218471f52aae947bfd26c1a2c622bbb65c3dbc792659bc74	2026-02-12 21:12:04.713108
147	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	89ce76967b1644b8c140d710530a93082835189f296382df3de4ccd27517f580	2026-02-12 21:15:20.180743
148	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	ebe5098cd220d2411c58abdf0ac5c0bda980ea4dd96a46f5e1209dd24ed09d1c	2026-02-12 21:17:17.481448
149	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	8cc473423a8aa232425c0bace2028b9d240bcc6dc312cb18953f3cd85601239a	2026-02-12 21:17:26.925355
150	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	657f8334c21157f1fe9ca84ebf1dc936be50272661c337421de8504beb00338c	2026-02-12 21:41:03.60776
151	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7ad0a1478fde95299f111c8a05dc848e9e9e75f54a47140617aaa6fd52e8d52b	2026-02-12 21:41:45.438873
152	login	0	login_sucesso	\N	\N	19778990050	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	ec96d80d13bef2496a85ecb3fd4198a26b9fbc9a404b5011950277ca1e620f39	2026-02-12 21:41:57.78571
153	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	199df3a53c8bec953d9132f83ddfa9792f24a4ac28ddb737239238f10b1cf936	2026-02-12 21:42:14.923136
154	login	0	login_sucesso	\N	\N	34624832000	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	4fed682c5e021b5a135532c14e44b536ed8796d945e23a9057ce24cc4bb32671	2026-02-12 21:45:37.002716
155	login	0	login_sucesso	\N	\N	34624832000	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7fa04d0223486a41a2149cc0431c7d3654df80c8c973deb4f39b21fa1812e1fc	2026-02-12 21:45:52.227739
156	login	0	login_sucesso	\N	\N	40473159074	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c29e7b84208cbd5e179c9fff3f4935b26310d34382e756dfdf8421a45a2c094a	2026-02-12 22:06:23.328725
157	login	0	login_sucesso	\N	\N	40473159074	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	412e979176d8fd1680efbf86355b102a1a2ef6da7ad2f5683196166359895173	2026-02-12 23:25:18.433934
158	login	0	login_falha	\N	\N	40473159074	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	a64ee12c809a7f107ec17287d7c24f09d89dde0a6dcb807d2853d5e84afc827f	2026-02-12 23:45:48.925203
159	login	0	login_falha	\N	\N	40473159074	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	267324417558755de4c25b53a85e40657063846fab625b7957ffc68e57af616a	2026-02-12 23:45:50.169546
160	login	0	login_sucesso	\N	\N	40473159074	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	3ada85566bedd9d222e5dd5c2214067f456890ffedc0dbd8aae2d974f9159ea7	2026-02-12 23:45:55.422199
161	login	0	login_falha	\N	\N	40473159074	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	b1ec694855d9f7c40367727c8b50aace42c00a70915610db227b5e4e627e9e75	2026-02-12 23:46:14.443701
162	login	0	login_sucesso	\N	\N	40473159074	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	de4753bd36ddf31ab63ecc98ae0f998c13c1008093b30535f36f4ef8da928fe4	2026-02-12 23:46:18.358612
163	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	beeb39bc6d18a867a59c2799c90adc06a7289a16ac9564c077c72fe63469536a	2026-02-12 23:58:08.849844
164	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	29015ed62126ffe88d43f0612d0bc1985d7b079b1cf3c9329c8ad37543cdd86d	2026-02-12 23:58:52.834007
165	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	992d37676a7a9817c632489a42fcd948c38fa46d296134e7618c6c9e01708cd5	2026-02-13 00:00:05.929533
166	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	23390049fb427d349d1fe1b23b82f0777c61511dc8b23a38122dba6f8390d93a	2026-02-13 00:00:21.662935
169	login	0	login_falha	\N	\N	36381045086	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "usuario_inativo"}	498c2ab4b972ea6455bded82624ea414745a1fdd9598b6eb90a3fb5d670e23f9	2026-02-13 00:03:27.07773
170	login	0	login_falha	\N	\N	36381045086	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "usuario_inativo"}	1eb6f6cc4da967f5fbd6da618d86f9ac6faecd1d951aa81f9d900a433281add1	2026-02-13 00:03:46.548335
171	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	156d22dd4e8c70552b6c9c625a9a00e4b122f5ae4be7ae179d474cba4977aef4	2026-02-13 00:43:52.040066
172	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	3465fb98b105f1adbc9a90cfb99225d4e0a63ae0dd17df81b7b260b815d07d12	2026-02-13 01:40:45.260846
173	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	fbe63c2d7f1893c4febd76a8c784d32f77a23258fe8ab08553eb903d71e4d542	2026-02-13 01:41:25.862466
174	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	be610c094aa5727932994ac913a4c4d4174837d6e484575671403393e5cb847a	2026-02-13 01:57:55.403888
175	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	497f445f9f8e5b843c4fd98bd32bc9f47cdc40520f80a9734aafbf64de74d4dc	2026-02-13 02:23:19.77737
176	login	110	login_sucesso	\N	\N	07432266077	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 110, "tipo_usuario": "gestor"}	bbb0340ed8965dd8fa546cc638bd85c214ab92a3f6fdb91992d75f4feb9dc394	2026-02-13 02:26:08.793368
177	usuario	110	aceitar_termos_privacidade	\N	\N	07432266077	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "16341b6b6b93cd7b3544fb2cf3a638ad96c4ce88d2e5c1466d0f3f62ccf8816c", "termo_tipo": "termos_uso", "entidade_cnpj": "24067473000174"}	6cd792bff12a5f91982f07a91b9cb6d313197f0559e04640c3cdca6c65800310	2026-02-13 02:26:15.94028
178	usuario	110	aceitar_termos_privacidade	\N	\N	07432266077	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "16341b6b6b93cd7b3544fb2cf3a638ad96c4ce88d2e5c1466d0f3f62ccf8816c", "termo_tipo": "politica_privacidade", "entidade_cnpj": "24067473000174"}	a3cf8b6f026a5904372fc2a1fe3fbbfc51c1c4fa3bce29ca55cff54276dc0ddf	2026-02-13 02:26:22.213665
179	login	0	login_falha	\N	\N	05153743004	\N	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	9e908bb1ffd26dd02adb0d80c76acde4b6b3f67fb217e17e6c8b245ddadfa479	2026-02-13 02:30:32.433568
180	login	0	login_sucesso	\N	\N	05153743004	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	04d335dad68686927bc5ba55ec19be521ed47af4b80cd815dd99240a700a6932	2026-02-13 02:30:38.35751
181	login	0	login_falha	\N	\N	62745664069	\N	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	bf55b0a4b6272f5b7cbfea3aca8d9da28f33c3cf864e11e0cba510aeb8bb8818	2026-02-13 02:40:47.330397
182	login	0	login_sucesso	\N	\N	62745664069	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	bc2d4ad13cb98268f377db123ed85b3542bb9017e22121d68864940d2b26eaeb	2026-02-13 02:40:53.18315
183	login	111	login_falha	\N	\N	58455720026	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	5b8179d8faad1d10fe224eeb749e950c7263853f452aaa17ac7fa4bd275b02c8	2026-02-13 02:50:35.286352
184	login	111	login_sucesso	\N	\N	58455720026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 111, "entidade_id": null, "tipo_usuario": "rh"}	0d030068a6642251dd9ae9b2f9f3b150680563d45e8fc436533a260a4714c61f	2026-02-13 02:50:39.858992
185	usuario	111	aceitar_termos_privacidade	\N	\N	58455720026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "2e5a8e9452079bec02e01052d3d71e34e201b9ef8150f5e39af05eefc30860da", "termo_tipo": "termos_uso", "entidade_cnpj": "79831824000163"}	f0f80031551f599d979bea8b3917d5bc7e983f15f8d51834019d9ac519b775f7	2026-02-13 02:50:47.074567
186	usuario	111	aceitar_termos_privacidade	\N	\N	58455720026	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "2e5a8e9452079bec02e01052d3d71e34e201b9ef8150f5e39af05eefc30860da", "termo_tipo": "politica_privacidade", "entidade_cnpj": "79831824000163"}	893cbd4393f18728d64ffdd3888bc1adeaecbf94ec63d6f746417d49ab2ac8ba	2026-02-13 02:50:51.609616
187	login	0	login_falha	\N	\N	68889393084	\N	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	1b4fdbb95e1db01852825acf71d0c2fd967ac6c63cdad4e79f1d32635879b79b	2026-02-13 02:54:33.87934
188	login	0	login_sucesso	\N	\N	68889393084	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	e2bd04cfc4e64de2a3e4f2ef53ab7ef37838e6eb8628fd0b5326a8da4b0946bc	2026-02-13 02:54:40.79657
189	login	0	login_sucesso	\N	\N	68889393084	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	a605e5c64c7ba487693641e84b2b76fdcb45850c8a7d24fde5bac50a3519ded2	2026-02-13 02:55:58.108603
190	login	0	login_falha	\N	\N	68889393084	\N	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	9617fdece5b0794c916985a82d65a7c0fd116bb6d297d6600c58242a43fc2a62	2026-02-13 02:56:37.783686
191	login	0	login_sucesso	\N	\N	68889393084	funcionario	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	73c460af204c9bcabc3e110653156f9a8f830c23047dee95a9668af62fc497a8	2026-02-13 02:56:54.171903
192	login	108	login_sucesso	\N	\N	87748070997	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 108, "entidade_id": null, "tipo_usuario": "rh"}	8d548e7f6193eb5128b7dc010fa941f02738aa9f83abab154938be3e53cb5bb5	2026-02-13 12:47:44.074159
193	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a7780972971b4e2cf5f01e5aa910337f3660c306c1338371d3c92275403bcb77	2026-02-13 12:48:13.366977
194	login	0	login_falha	\N	\N	77093511074	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	db2bc14f90cba52f3d68db089c9bbe1d0a79d701ce1ecb95e292043bd924554a	2026-02-13 12:52:47.238694
195	login	0	login_sucesso	\N	\N	77093511074	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	19e8bc0a7906c8a09f28fa67bbee9f9222396ac316ea995f4eca23f3ce0bc2f7	2026-02-13 12:52:50.135485
196	login	108	login_sucesso	\N	\N	87748070997	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 108, "entidade_id": null, "tipo_usuario": "rh"}	92aa3a34c98fa4e6bdf74f507ebe538ae932071e95b8b0934faf8e1025057b97	2026-02-13 13:03:07.970357
197	login	0	login_sucesso	\N	\N	87545772920	admin	191.177.174.175	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	ae1cfc65c924dd4d942fb30ab11ef8ffb44491d51d386adc4f209bf2c518b4b1	2026-02-13 21:07:25.885725
198	login	104	login_sucesso	\N	\N	04703084945	rh	191.177.174.175	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	883ab91ed2a2ff435e7fff1b71b0c6e48cbd2f5fc85f0bc840345a6b6cf0e725	2026-02-13 21:08:02.198166
199	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	51217aa11f7a45e0c7e197a126afc8d4d87b2b0f55bb72a08861664c3089fc17	2026-02-14 10:55:11.285902
200	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	ac4891a618ea60183d62f74ee7afd5b2cda4eadc3958e8905375cbf9c948ee56	2026-02-14 11:57:50.222627
201	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	a54def3f2d5475cc367ebe50cda4991e89c583d2aa0649b8eef9280afb44306c	2026-02-16 13:57:32.072768
202	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	0557234268c0515b8ee5ce19bea83c1a04f4d294635c9b52d5dac0191dd74012	2026-02-16 14:06:08.414219
203	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	a05da4315045421fa992ea12e6400fed914bea9d7d8e47f046d1171fd7348ac8	2026-02-16 14:06:20.173608
204	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	337dc00d46584b24b153a2f52a4f1a411bad5ab7f1416d7362ef956a1923c18e	2026-02-16 14:06:28.278303
205	login	0	login_falha	\N	\N	34624832000	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	a2cd381c0b0d5d54db395e1aecbd5f3f47d9923028ff51f50546e50b245de78e	2026-02-16 14:06:35.549123
206	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	1bed7ecc1f7d1a4ebe7a11495040fbb94584d848c9abc3317c474739e0a0f1c3	2026-02-16 14:08:16.66714
207	login	0	login_sucesso	\N	\N	29371145048	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	79e4de9226a7b097dbb278d2674f616a68199e95facb0ba5af1b29d4a224db6e	2026-02-16 14:24:06.134922
208	login	0	login_falha	\N	\N	73922219063	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "usuario_inativo"}	4dac7501d3d4d880ab186835dc523cfb395f8bbd545daaadfa3e3ea9de2b253b	2026-02-16 14:24:46.886841
209	login	112	login_sucesso	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	229a012a458fee49384162a54da7aa488f5e213a0f915ae72e37bf07af4ca9ec	2026-02-16 14:28:15.406424
210	usuario	112	aceitar_termos_privacidade	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "954f8a5d1c84dde456e16321c064205b406c9bd9d61a8e91188b2477b0060a1a", "termo_tipo": "termos_uso", "entidade_cnpj": "41677495000175"}	584422f94b9e66e4d926ef5da1b5b13b7a848f3a55499b86814277aaa0a3946a	2026-02-16 14:28:26.022528
211	usuario	112	aceitar_termos_privacidade	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "954f8a5d1c84dde456e16321c064205b406c9bd9d61a8e91188b2477b0060a1a", "termo_tipo": "politica_privacidade", "entidade_cnpj": "41677495000175"}	7d808787f321e6a094f3d1764101d13d91552d35de060ec047a32c8991be89c5	2026-02-16 14:28:30.232382
212	login	0	login_falha	\N	\N	79466202090	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	956a2527b2f658a7e67174a1e8024f5f69e924725eae9f5ba3dcfd4c3dd43cbb	2026-02-16 14:45:12.113688
213	login	112	login_falha	\N	\N	70873742060	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	1f91ca94e36c053c31224501e10a2a6ac90cebc486e95166925577004608ff45	2026-02-16 14:45:42.745986
214	login	112	login_sucesso	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	d48db2bc83248037b329d2441cee0a33748719e6c47341815b7cb19aee2f0300	2026-02-16 14:46:02.646412
215	login	0	login_falha	\N	\N	79466202090	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	b395f3932b8171842cec6a509ef6827cbf8be912f1d13e4598c10c39de16a4df	2026-02-16 14:48:21.063691
216	login	0	login_falha	\N	\N	79466202090	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	5ccb6423606c2dc2398cd4687c5582d4dc0dbe3ef819d4a17d88ac9b471947c3	2026-02-16 14:48:53.476846
217	login	0	login_falha	\N	\N	79466202090	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	eb095afbd2e0f31e9c799b99c82860809b2a61f9551f94ae51983bb979935938	2026-02-16 14:50:18.678214
218	login	112	login_sucesso	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	1d5ee26a3eb959f8749cc6825c31b42f825dab72caa367ab76babee386711116	2026-02-16 14:50:58.030412
219	login	0	login_falha	\N	\N	96309540017	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	758bd22e5b3da2ab7c4066df82d6f3c0d2a78bf32661d9fbeb4c2864b58de44b	2026-02-16 14:54:28.188767
220	login	112	login_sucesso	\N	\N	70873742060	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	90c1904cbdd62005ddd65dc37d2aebf7a8747db16244c3dbca73ac2d3e230e1c	2026-02-16 14:58:31.199796
221	login	112	login_sucesso	\N	\N	70873742060	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	cd6d6332732dbfb2c016275dec28d8e7a6c4c423fa985e476d5030872047cd95	2026-02-16 15:36:51.680056
222	login	112	login_sucesso	\N	\N	70873742060	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	0b262c620278458ee39a608346a9680131dfd8a6c301afcdad00153024e2d083	2026-02-16 15:37:20.543514
223	login	112	login_sucesso	\N	\N	70873742060	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	7adcca3a51c91603620d314aae7a4c3865e986d787112fdf021cac268ed70120	2026-02-16 15:38:11.507428
224	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	b26dcaeb2f28c6e5ad4bd4fa90e726c2829975ad2bfbd131b93be705fe0e8579	2026-02-16 15:39:48.004148
225	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	12916ddc1186a8d7bfd2cfa46092be2d1f1715f13e2598fbe209d114b6c27e6e	2026-02-16 15:40:06.945018
226	login	0	login_falha	\N	\N	96309540017	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	9810478534858c45bde9bfbbee8d366c35b83dd46d8140b035e92b68a0a56bc1	2026-02-16 15:43:04.237437
227	login	0	login_falha	\N	\N	96309540017	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	b032a1929d2e90206e2ac0657f4e47b4cb0e85a6206770d9322dc403fc79f4a3	2026-02-16 15:51:01.107298
228	login	0	login_falha	\N	\N	96309540017	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	52007a75a14fa6b700fc07595b0a32c2b7c6d1b828601f4c906c5528da724bf1	2026-02-16 15:51:30.303739
229	login	0	login_sucesso	\N	\N	74984014016	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	e14eaf9b17177e32406e67e822093033b0abff27743432b0d900acc265851cfb	2026-02-16 15:53:44.178084
230	login	0	login_sucesso	\N	\N	74984014016	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	0652d98961bd12cbca95213f085641b2f7a4b953c86c4f1e150a95d6e6c8337a	2026-02-16 16:10:06.400471
231	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	c78752f4e37829a23104ef154ddd023b593b318ac0ed110d0bd1fd66b01d284d	2026-02-16 16:11:18.307659
232	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	26ab61b0944dad82beb556e2d80663b327d06fde780147ddcdcfae57fbf8ed0d	2026-02-16 16:20:58.253348
233	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	3a3726572b2ea3d28aba4e3d2e167e080e78b7c1bf77c76a9a8aa2500c062dbe	2026-02-16 16:22:30.689563
234	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	71f35fe8340af54da76012eb41a9b408f9d6dbc3d533f6c3185d586814733110	2026-02-16 16:23:13.743305
235	login	112	login_sucesso	\N	\N	70873742060	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 112, "entidade_id": null, "tipo_usuario": "rh"}	ec392748f80a4bdd8e55300a13ddfa0a2a2125666e846a4a32d1ba9c5b300ea8	2026-02-16 16:44:17.41867
236	login	0	login_sucesso	\N	\N	74984014016	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	0ddf3ff93f2134da51b4209b5105fc47bb95a13324031040a1cffe93227dc33b	2026-02-16 16:53:47.999809
237	login	0	login_falha	\N	\N	74984014016	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	f2d78f345db12d62e420fca91bc5346384a98734544e834c0bc49d43ec751926	2026-02-16 16:54:28.246068
238	login	0	login_falha	\N	\N	74984014016	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	9a3434f260815541d72f1c14be315c296884c5af74b0f30a40f31a10c54fc4a5	2026-02-16 16:55:05.239158
239	login	0	login_sucesso	\N	\N	74984014016	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	20c0cde4f1a6ed6f6fedd74af7eeab8d702c503dea0c9306be1d4728c4184541	2026-02-16 16:55:13.052141
240	login	113	login_sucesso	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 113, "entidade_id": null, "tipo_usuario": "rh"}	9330d51efee999c9498fd9f43bc32d1299b4727358470d54775b57683c0ebba3	2026-02-16 18:25:50.938358
241	usuario	113	aceitar_termos_privacidade	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4a00a3bb1ba62b5046fa96e50ef31e4404c8dc96cf7c8c7e94453d29819dc3bc", "termo_tipo": "termos_uso", "entidade_cnpj": "04228123000135"}	d07373f6d24e9bfe031af3691aaaa6127f762c3d1d3a75f5af44646bbf344f28	2026-02-16 18:25:59.655217
242	usuario	113	aceitar_termos_privacidade	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4a00a3bb1ba62b5046fa96e50ef31e4404c8dc96cf7c8c7e94453d29819dc3bc", "termo_tipo": "politica_privacidade", "entidade_cnpj": "04228123000135"}	882d237db9b1b89cc7ea4f074112761246140bf27b0393ee502c4cfc710ca430	2026-02-16 18:26:05.60592
243	login	0	login_sucesso	\N	\N	26064999055	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	3a4bfc0a1b6e6799e9ad92be56b87b73c82cb0a24d874983142a04d100e06d65	2026-02-16 18:29:20.79639
244	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	a42394d0ebb72091e5fadc0e5ace0f73eadebb0e6c6ea270e86e4eb317986816	2026-02-16 18:32:22.206574
245	login	113	login_sucesso	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 113, "entidade_id": null, "tipo_usuario": "rh"}	ffb9adb6d71b9e29cb837105f6dbcf4a04079137d1a0972e3449fb5a849b51d7	2026-02-16 18:33:00.134269
246	login	113	login_sucesso	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 113, "entidade_id": null, "tipo_usuario": "rh"}	3d0d5e783e2d06cac1e9f1e5f5e2c0dd629a5fce503541498874a7993cfed99a	2026-02-16 19:16:10.824728
247	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	14bc1409ebc0ba4f1e0e5decef5e8ffbb5487aa4c8d0e61fe67d90105dae5b71	2026-02-16 19:20:40.729701
248	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	bde0082d8f83aeb7f687cd4766ea8ec1efa05a1630cfc3b3ab5334ab6382d121	2026-02-16 19:21:05.80637
249	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	15d5ebfe7f85cafa654346f8753718f36136c435e4c83131a2e3d8dcc3372fd3	2026-02-16 19:21:15.475144
250	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	283384196aa382e5c79026191f249f3bafdd7c25db01a8feeb49a3e503916ee1	2026-02-16 19:21:52.061327
251	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	d3ac8faabd3ce80a6435f41d1d1fcd8b74c39c1cd950d26615f01f3a09d46e6a	2026-02-16 19:22:05.494093
252	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	f3f4113f360b2872dcb8958f556e861dc1e9128c7720f3c7a10d72b906113a5d	2026-02-16 19:23:23.47189
253	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	d5e021c31cc018a2039aa36c621a469378340dc9959f48de62ee25b6b0fd607e	2026-02-16 19:23:30.120693
254	login	113	login_sucesso	\N	\N	62985815029	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 113, "entidade_id": null, "tipo_usuario": "rh"}	881eef72a0fcc07155e9e5545b06db5e8d94c324e010e709e057ac77a405fecf	2026-02-16 19:30:08.27556
255	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	43c6ec6c7b52c4de12e5e5e276a83522f3fd4d387768a2cf04d4790faf3d0a10	2026-02-16 19:34:12.74539
256	login	0	login_falha	\N	\N	79466202090	\N	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "data_nascimento_invalida", "tipo_usuario": "funcionario"}	a9def1eeccf5d290fdce878b45418a6f6f9b1f04d65bfa5d0661743fe2b542c4	2026-02-16 21:08:59.242094
257	login	0	login_sucesso	\N	\N	79466202090	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	25b8d863fe7c6f5af45a2fbdfc8f578592783fb050af74b70c64cdad327e34a6	2026-02-16 21:09:35.056518
258	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	00b17c652a559c2092691e7bb3db5d36624379d10b45db221e2e751327ee1409	2026-02-16 22:18:43.342096
259	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	fcf7c9fcd5b1ad5dfd1eba7e99b2210b52cef2a2a53772d51c599565e906bbfc	2026-02-17 00:00:57.709117
260	login	0	login_sucesso	\N	\N	60463729099	funcionario	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	e77f8377cc19ba20b617b41e6cc0da7a6c8cc88c6e51e0e2b201a38dbedb41b3	2026-02-17 00:21:01.588709
261	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a6b6e66897e14859d7872307c3771f8275057dba57a72a584c511570e4f58c12	2026-02-17 00:23:03.683875
262	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	18a1aaf4ff306db34a5d96b32b7aee16868525e5dd6e86ebbdb3e1ba938f80a6	2026-02-17 00:23:49.010621
263	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	8f6b8a6155652306ba3a81482ce3714b556e25ef573cad8bd6a64402613de735	2026-02-17 01:17:49.569424
264	login	114	login_sucesso	\N	\N	48538520008	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 114, "tipo_usuario": "gestor"}	283504acd0939b952f07c16daab2bbde4fb5484f6f8b9c7b165960cebc9ed63e	2026-02-17 12:58:07.96581
265	usuario	114	aceitar_termos_privacidade	\N	\N	48538520008	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "ada23b64dea76cf115ce4d39e15a522c58fffe20bc3aa6c78028ebf943be9fec", "termo_tipo": "termos_uso", "entidade_cnpj": "56853041000185"}	6d4eb729c83dda35138739020fb5e0aa98bbea04615a79ff597e95364a50c581	2026-02-17 12:58:14.634424
266	usuario	114	aceitar_termos_privacidade	\N	\N	48538520008	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "ada23b64dea76cf115ce4d39e15a522c58fffe20bc3aa6c78028ebf943be9fec", "termo_tipo": "politica_privacidade", "entidade_cnpj": "56853041000185"}	456ca6b2beb697e4366336b810caf6e601cfa3d815ce2e42d1c6ef3f727826bb	2026-02-17 12:58:19.017109
267	login	0	login_sucesso	\N	\N	82773181034	funcionario	177.146.164.76	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f4032226ee07c31ec80facecf6593dbaf75fbd9899af4d75bcd6a1f7e1e72125	2026-02-17 13:00:57.366302
268	login	0	login_sucesso	\N	\N	38409635089	funcionario	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	42107d3e95c529e4ad8b573d6155fab9b12cceeea683d0b4e20ad25a2b379781	2026-02-17 13:05:25.806417
269	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	1d3df4deb9937ff5ab09ef7ecad7b43960d6751306e03f2c14d4d4021dfc38c4	2026-02-17 13:54:12.098409
270	login	114	login_sucesso	\N	\N	48538520008	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 114, "tipo_usuario": "gestor"}	a001e00a2accda090e3a88ce45f5baf12a0f0713f377169c6311d665b803e27e	2026-02-17 14:09:02.253657
271	login	0	login_sucesso	\N	\N	53051173991	emissor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	97ecd2e827f41b0f96f5192946cb99eb89ecbbe95102183206065960d9b9b2ec	2026-02-17 14:09:44.647355
272	login	115	login_sucesso	\N	\N	31777317053	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 115, "entidade_id": null, "tipo_usuario": "rh"}	130a56274adb2e5201fd63bc01ce604765a37a9575bbb5706519ace3d5dddd18	2026-02-17 16:14:26.53409
273	usuario	115	aceitar_termos_privacidade	\N	\N	31777317053	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "3ea857f8dbccba71a9484403b34a36c7f17f4ccb739cc89121ed86285b6728b5", "termo_tipo": "termos_uso", "entidade_cnpj": "60772535000102"}	ac762db89e63942e082815fa466ad4ee64be360fb87df93c2aaec44fb54c8d07	2026-02-17 16:14:38.161267
274	usuario	115	aceitar_termos_privacidade	\N	\N	31777317053	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "3ea857f8dbccba71a9484403b34a36c7f17f4ccb739cc89121ed86285b6728b5", "termo_tipo": "politica_privacidade", "entidade_cnpj": "60772535000102"}	1eda24e0b76cdd09fc1bc39a13f0d15cbf913ca095bcb765dcc4954f49c1e132	2026-02-17 16:14:48.126211
275	login	0	login_sucesso	\N	\N	28917134009	funcionario	177.146.164.76	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	da9d48d262d0299b2cfa3b1e70b14428cc9a94f5a668e2b111c295370ad14c7a	2026-02-17 16:18:17.873187
276	login	0	login_sucesso	\N	\N	59557041080	funcionario	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	af20edcc209cd64c8ec3ab6fdaf1eda577d9cfc8be0f9b130fc0830c811c0e39	2026-02-17 16:19:18.464144
277	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	25766f30f25baa66a38960f5fa25fde294c128daca71cb1b5bf5e455c8d54928	2026-02-17 16:22:29.901901
278	login	115	login_sucesso	\N	\N	31777317053	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 115, "entidade_id": null, "tipo_usuario": "rh"}	d0b7815dee60a2b9933c23e9c0e98286b73e0d2847ae2bd38b9145f8c3c2ef53	2026-02-17 16:25:25.957215
279	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	69cfea74331aad7eb45cd779cbfbd8641e3ae14b94cec84b903ad5001a52b9f9	2026-02-17 16:26:08.767195
280	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	d10529a14f367b353bad3cb197590300828e68f1eb314a77da3461ddc4dbcc6d	2026-02-17 16:27:01.471051
281	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	ff6f769d09851eed42738418584ce180c66955059d72ae2130956ce62acfddd8	2026-02-17 16:27:30.025738
282	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	507a54eba6ba9c416dc6abd7ea60e7a18a0108686fa6aa4a176a94edc3e9d0f9	2026-02-17 16:30:01.345377
283	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	a9f46bfad71e2e768477043133b7f9a321f1407980f0efe0328f14555e363e3d	2026-02-17 19:29:06.278384
284	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	7b6221101ef28032fa369a339f265cdabcbc0ab4bc35207be16fd19f2a111d77	2026-02-17 19:29:22.887212
285	login	0	login_falha	\N	\N	66844689004	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	50039ef21c1accd738a38cac36631d55409dbb7c6c10049071ac390e8f9c3f79	2026-02-17 19:31:39.1053
286	login	0	login_sucesso	\N	\N	66844689004	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	915ef90981369eb314d5bb773737c97bdc927cdda0c746d86002f6ffa5da61ad	2026-02-17 19:31:47.669002
287	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	eddbe99348984ee678482d3cc5d1ebe8be7b50f405444fe1c160d577f2471e92	2026-02-17 19:32:49.282234
289	login	0	login_sucesso	\N	\N	88931335040	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	20e2f09312c623c44a2063fa53ac31b94aa904d810815072b4d44fc3a78d7472	2026-02-17 19:34:44.330734
288	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	349241022cca956b023ebc5bf40610ccbcbb2570d659be568732eb0f0cde7d62	2026-02-17 19:33:08.938885
290	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	7c70c264d747eb0eb1cc99dcbef8e514bfe5868bc290bf9a71e3c9c18f47e079	2026-02-17 21:18:31.209283
291	login	0	login_sucesso	\N	\N	00000000000	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	a2b7ded71aacd5eea10fc7ced060bc54caa5517f7319bbbe47824dcc76d03f3d	2026-02-17 21:38:31.368382
292	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	93d08187f12d89fea16ad92f2c70269068a3a198fd93a554719999779e7163ca	2026-02-17 21:43:30.462881
293	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	85d69bff69f88305b8bb172fc469707f3497a02e5d2f41bf3d603fafa25d1a41	2026-02-17 23:14:48.174144
294	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	dc5b7e5830a9185c814577934404365a6b0b132be94c5d07c426d656eb32af9e	2026-02-17 23:57:10.318045
295	login	100	login_sucesso	\N	\N	29930511059	gestor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	a5999787236a86749658a6ac1a95eee341f71b92719cefc21eeebcb26489c9f8	2026-02-17 23:57:44.024913
296	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	488f608e01d673f3f45a0e60e4a67422f5c4819f668eba84ff3bef095120ff68	2026-02-18 00:03:42.137836
297	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	408375df408144be555a49a6b445baf8077de2904643a9d7f924b3bfcb22e4b4	2026-02-18 00:04:07.309502
298	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	84de13d9946912042e1843e7b21180fc422dfe5a20972e4ef112c4cd124bf330	2026-02-18 01:07:29.490728
299	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	c7ca962949473d4d25e82ab6507a024ff37eb5b3641cdb69afc64b148c361dee	2026-02-18 01:08:14.908754
300	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	8558223af16ecae94a747fde6c5f97aa4929a282223666b53eee2ec30c5df929	2026-02-18 01:08:56.642319
301	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	649fe4b73e7933e12550a1b2cebbf67e34d76faf39c578ae70dead2b063536e3	2026-02-18 01:27:48.854016
302	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	69f262982f55b379afd9e53403e147ac7eeb181f07d7974dce26b01d6097e5ba	2026-02-18 01:33:53.750444
303	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	a96edbc183ac703c0fc8b77798f452f835fb0b37b5bec91a7159803826fd8e56	2026-02-18 01:34:52.944133
304	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	705d41490ee7ce17e90efdc7c8b25468abf25b55ba3b56edce8b5197fb9f7450	2026-02-18 01:36:22.822707
305	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	3e3fd937d568d3b8bc3ef589f96a77ff83fba502746b760a14f35b076c3d7eca	2026-02-18 02:18:38.595975
306	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ae1f9422088709cf29fb2397cf3af4fc57b64b980071b2619ed386dada45c3de	2026-02-18 02:19:04.126041
307	login	0	login_sucesso	\N	\N	03757372000	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	607181d794bc286df9eaba34ec855d1a660e95e917034f649f57457f019e59f2	2026-02-18 02:20:12.354109
308	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	4cf6d1deedfb55b3b257615cd83a56c6670a6e171255856f9232c50604717789	2026-02-18 02:21:37.273513
309	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	a24237467b52e009721a7442aba8aafd565de91c3f6ebc25cf5ef42857d48bd5	2026-02-18 02:37:25.701112
310	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	c8bb1098fffae6e81c99c0433af42d574d41bbf86ba93eee162aa1126b8e6742	2026-02-18 02:37:44.030303
311	login	0	login_sucesso	\N	\N	17503742003	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	15c76904b7e700437abb1b12174268bacb2ba66dab031b9a969bca95c1a4f09d	2026-02-18 02:39:42.469071
312	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	91e288df579c4e084c9fdc9ffc9fce97c17e8acc30f78c8e0811a29f0fb5f100	2026-02-18 02:40:51.726484
338	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.93	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	fdacc8a923e33bbe7a74efc38dffbc9a3c87d6ae9d971d03f867b605c62fd413	2026-02-21 17:35:26.427022
313	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	270282ec1aeea32f0b3f602210b58394295772c25c237f6bed5dc05b35a6a81c	2026-02-18 03:03:38.15671
314	login	0	login_sucesso	\N	\N	90119869039	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	89db3ddb7dcd36b9e583e3dfc2a1202eed857fbe46612515a90d36e0989d0eee	2026-02-18 03:04:59.386863
315	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	b9280ceb469a441ca48998f6bf05263baae4b6475fefe6c406ae2058fc1666bd	2026-02-18 03:06:11.267783
316	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	dc82bd541263ad71b8c4e50e29ed191e6ff0d9697c85acee590a662d96245182	2026-02-18 10:58:07.832099
317	login	0	login_sucesso	\N	\N	53051173991	emissor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	\N	72971e120317eb1d84ee9dba9cf2a14586c941ddccc4a1872e458ada7c594922	2026-02-18 10:58:42.993115
318	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	09ab343d042dab83ab40780c1eeb6ad1d20729533024a3c3fd9a1e7086fc10a6	2026-02-18 11:04:11.775591
319	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	836f6f49b16dee866576076cac177b470ceb258238de9dc07497959c88c50684	2026-02-18 11:05:34.292306
320	login	0	login_sucesso	\N	\N	18237959000	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	7197cd57289fdb126e3ae5e01ef731ffe7a47f036bd276503c18cd289ebc616a	2026-02-18 11:07:46.256462
321	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	bb2051d364eb0a629403432e73bb413c5250bd634601bd30d59413e4faffa840	2026-02-18 11:10:57.234933
322	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	f8c69a6094450c37211af19d3863654b2c7e4d5dc9570e815d469396e921e56e	2026-02-18 11:13:42.545145
323	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	ad76b19688f72ec184777ab460f43d7b9933da67938ae24dcbeef38f2534f606	2026-02-19 02:50:29.467568
324	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	31ea9ed6ba385073e0b9abcadbf3f32e34d37d8d53b9a2976d316a6ebdf9833e	2026-02-19 02:53:01.151011
325	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	90c5c02b6ad9a4e35596936d46b123f53549311046c605f110297ca0dd619679	2026-02-19 02:54:31.897031
326	login	0	login_sucesso	\N	\N	00000000000	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "admin"}	1a6fc9aff5e2ce5ec4dd168e07ec12bd5f9600356284891daa0b8f8b0f6ae70b	2026-02-19 02:57:22.112323
327	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	a6c918ff1ff12cde9b4b0989ec87d3ab3a7037c15191b7efa395b9337884bf9d	2026-02-19 03:04:41.472229
328	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	bfa1cbf492bd4ba42df763c99576a14d713b82b5d3a32d6eb12f1541e688d2b8	2026-02-19 23:30:51.711422
329	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	b11465e42db8a2ee58c4f6854f205a237bef6ec92c1b127cf9b6b6b4107e4416	2026-02-19 23:37:52.759566
330	login	0	login_sucesso	\N	\N	53051173991	emissor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	726f683452b67d4d49f3d56eab57a6d34c25243d73aaad5390589f7c1780435c	2026-02-20 00:03:31.411826
331	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	aeba9a6022eeb71b5d4b7fd3febfdf313a56aaec6cfb900d6b676431839a2c5c	2026-02-20 01:06:13.828951
332	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	814a109716b585ecfc550fec7d68f3a3e96a89871ca2e0a3d0bdb3098869cf28	2026-02-20 01:08:02.783972
333	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	7463ea81ede40df63728b08996987111285dd20f46e404162a79abb9fe8e45f4	2026-02-20 10:40:38.614061
334	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	96bda75956224df7d0322311df2f0dc29b44a7d1a76577341fe9aff38d6ea114	2026-02-20 12:25:00.487437
335	login	100	login_falha	\N	\N	29930511059	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"motivo": "senha_invalida"}	44ff15167a8aa0ea26766f7c607889c48da9137af6b0889db1f57886ef4d146d	2026-02-20 13:05:41.022057
336	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	7eb01e0f7adbe58fe32702404488f00eaea291a56269a49a00e39c4e1de20e7d	2026-02-20 13:05:52.39346
337	login	100	login_sucesso	\N	\N	29930511059	gestor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	7b682f8e260919ab2a82dab64cfd6be9e91b8f9af28ac7ca39965ccb5cd72860	2026-02-20 13:06:10.255166
339	login	116	login_sucesso	\N	\N	92019863006	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 116, "tipo_usuario": "gestor"}	b12b18a4b2690004bb4dd68b9dba3de3b7b73e4b8fe05902ecbf4491d3a0717a	2026-02-23 04:06:26.512047
340	usuario	116	aceitar_termos_privacidade	\N	\N	92019863006	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "8af7c76333cfc5e36dadcb2b3ed708ca8a115854ac649b3692655e8d7f3aec14", "termo_tipo": "termos_uso", "entidade_cnpj": "91408159000103"}	6858a97c5bce6bc367c118b37c8057a87ab0c6a65d43d90a5848dc7b7a88641b	2026-02-23 04:06:31.218053
341	usuario	116	aceitar_termos_privacidade	\N	\N	92019863006	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "8af7c76333cfc5e36dadcb2b3ed708ca8a115854ac649b3692655e8d7f3aec14", "termo_tipo": "politica_privacidade", "entidade_cnpj": "91408159000103"}	99b2414879d4b1d02da286baf856cb72b7f3438082dfd5a69e89df3f14fe25a3	2026-02-23 04:06:34.055113
342	login	117	login_sucesso	\N	\N	16911251052	gestor	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 117, "tipo_usuario": "gestor"}	29a8bd2779a306c8ba45e0a030f0ac03cd44901b56cececf328d59030f817ff7	2026-02-23 20:50:14.97921
343	usuario	117	aceitar_termos_privacidade	\N	\N	16911251052	gestor	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "5972bdb992c1ad021dfecd865b4bf6ccf7d1f9de06bbb682ebded21608a1c72b", "termo_tipo": "termos_uso", "entidade_cnpj": "73357308000162"}	cea32cf568e6e1b51e44bc7b22f9ad02694f7262fa37a80b8f4e66713f273fce	2026-02-23 20:50:22.28767
344	usuario	117	aceitar_termos_privacidade	\N	\N	16911251052	gestor	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "5972bdb992c1ad021dfecd865b4bf6ccf7d1f9de06bbb682ebded21608a1c72b", "termo_tipo": "politica_privacidade", "entidade_cnpj": "73357308000162"}	482681d21a90072f8a63edaeccfd448dbac91c254841d05a1b243a977bbbe491	2026-02-23 20:50:27.078549
345	login	0	login_sucesso	\N	\N	34232299009	funcionario	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	de762b8ffa4f66ea534e48e4dedc835e89b9d6429082f73b14c47ddbee3c6f74	2026-02-23 20:58:01.096261
346	login	0	login_sucesso	\N	\N	53051173991	emissor	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	cde8d945cdb2aed58a3d1b8af6f5380fb35c1b9eb31fe504d898ad9e6f62fe08	2026-02-23 21:19:13.487549
347	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	9f8aee6817d6ddf168126f66ae81e00136f7fdbdfb985d183289250b6ed2f0ea	2026-02-23 21:24:28.235498
348	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	1de1e9ae47876b4fdacaa936cf73c2958edf3db5429a45baf2add396d2043ad8	2026-02-23 21:28:00.184948
349	login	0	login_sucesso	\N	\N	53051173991	emissor	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	0d85e4acc0f3078d19bdf2794849dadc4b6f480e6555bb58cf03724f7b3f9a19	2026-02-23 21:28:30.434927
350	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	f6bbd3d19de3caae968dde6993d1a30aff552bfdb9d4a7c14774616e9f6c1dcc	2026-02-23 22:12:58.759902
351	login	118	login_sucesso	\N	\N	99328531004	rh	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 118, "entidade_id": null, "tipo_usuario": "rh"}	7ff118868e32572eb45b91b8dd5a25b2b26cecf297da52bf231c8d219fef4b73	2026-02-23 22:44:58.671011
352	usuario	118	aceitar_termos_privacidade	\N	\N	99328531004	rh	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4e3228865ac9aae09456b7a32c12872716da58f82bc57b32a4a99704dcb73263", "termo_tipo": "termos_uso", "entidade_cnpj": "91280455000163"}	a4719a838a5137e40f45bda594f979e77b7e67799cb6b466a1f099d7ad3fa5d0	2026-02-23 22:45:04.872829
353	usuario	118	aceitar_termos_privacidade	\N	\N	99328531004	rh	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "4e3228865ac9aae09456b7a32c12872716da58f82bc57b32a4a99704dcb73263", "termo_tipo": "politica_privacidade", "entidade_cnpj": "91280455000163"}	dff8628bd639cd7a91b897ccaab3fcd9474e45b7fcac6764a15aa0d0bed7b7e1	2026-02-23 22:45:09.244163
354	login	0	login_sucesso	\N	\N	35923473062	funcionario	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f72bc42074a24b9f57bb3991d4fa61439a33672eee25e851b9d2d7b8e81dc42e	2026-02-23 23:09:42.746561
355	login	0	login_sucesso	\N	\N	29054003073	funcionario	201.159.185.223	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	429ea04e10c4198a4b8720cf4dbd3b37b7c6788e01be893a1b481b4d712f744e	2026-02-23 23:12:04.956853
356	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	d848ce3d5ab41c470d5af02dcca9ad9a39034f78bfa0d28b24e4f36a5e47c7cc	2026-02-23 23:16:52.277085
357	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	42ee528a441a537661ec594044cce1cf0c49919e278ae8a4fdf22ed85aaf3ce5	2026-02-23 23:18:04.343685
358	login	0	login_sucesso	\N	\N	53051173991	emissor	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	8accaa4f879c847017f95aeda2d45b6a774bc6330de81f77939d7d8c0c3ba778	2026-02-23 23:21:32.542406
359	login	0	login_sucesso	\N	\N	53051173991	emissor	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	3fbaccab8f177d5ffa65b40dcf8fa53d457a892ad65bcb471ba924bf97c10545	2026-02-23 23:22:33.207658
360	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	\N	6c9cefe7fcdf0ba9be415a3edd0bc09f960b0fa3090e16e443ff06f07361c26a	2026-02-23 23:23:15.723445
361	login	100	login_sucesso	\N	\N	29930511059	gestor	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8923afce6997413744881f55d8ba62a7524f3f22e697c06b5dcc039aa43f43ee	2026-02-23 23:45:56.193003
362	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a5ce73a46de7c1db36b0b06f7273a23c5dcb0001939735f6a49b48fb39fed88b	2026-02-24 00:25:30.598199
363	login	0	login_sucesso	\N	\N	75415228055	funcionario	201.159.185.223	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	082650ec4a8cff4d93819c4a63c4e00ed86047732f3db929fd64a79b7ee81437	2026-02-24 00:33:02.198004
364	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	46d69391299f79830e757aec4d266673fc2b8154cfa292f85feac744a756c6de	2026-02-25 11:09:38.517897
365	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	838c3d86a51a47f3cc1505ecc14a67f271c1d5e32f51e3a8a1f6478b17991e8b	2026-02-25 11:40:21.928718
366	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	746968c2fa6856e2a352c55713101185c4f3e7cab400361f59261dae00d3d81c	2026-02-25 11:42:33.277673
367	login	119	login_sucesso	\N	\N	87251739011	rh	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 119, "entidade_id": null, "tipo_usuario": "rh"}	70c5bb26822a4a3b935bbb30942310fd49e2f987cce9eb7665a130f98c2bfed9	2026-02-25 16:00:38.415331
368	usuario	119	aceitar_termos_privacidade	\N	\N	87251739011	rh	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "9ee0bf09a570554d1c2dda18fb91dbe0924623648eb2d5554d293971d8053923", "termo_tipo": "termos_uso", "entidade_cnpj": "99179883000106"}	17fda4a97ecaf186ca398022d1a01ee1000fcfce87a9573011260871941984d3	2026-02-25 16:02:07.941113
369	usuario	119	aceitar_termos_privacidade	\N	\N	87251739011	rh	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "9ee0bf09a570554d1c2dda18fb91dbe0924623648eb2d5554d293971d8053923", "termo_tipo": "politica_privacidade", "entidade_cnpj": "99179883000106"}	9aeae1dd4bd1c4ae932d8b66d8400c77348865a8047991cb07327576413de37e	2026-02-25 16:02:12.406757
370	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	887e5f29d5ce0f4571e52d92fc52643c998e1d840aaf5380f7b97539641a1177	2026-02-25 16:03:22.676749
371	login	0	login_sucesso	\N	\N	87545772920	admin	201.159.185.187	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	2499f3b6de7e0dba65ecdccf4c4f76bfe3e3d97764ca55717fa61ae44d6d1467	2026-02-25 16:41:18.277923
372	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	a8d18080d33e00a075160f30daab66de422ffc8ec4f0ebb0d1b600902f2db309	2026-02-25 17:59:10.83207
373	usuario	120	aceitar_termos_privacidade	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "822de554d76e4039f7062dbdb3808fecea7435aa7d893a34050c8e9c7a583639", "termo_tipo": "termos_uso", "entidade_cnpj": "29060003000100"}	dfbcbf9787755f37e212487d085c077a35e6784fd34a659cb3ea501d0750f5e8	2026-02-25 17:59:19.377415
374	usuario	120	aceitar_termos_privacidade	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "822de554d76e4039f7062dbdb3808fecea7435aa7d893a34050c8e9c7a583639", "termo_tipo": "politica_privacidade", "entidade_cnpj": "29060003000100"}	b16124c48ab4037dd3ddf39a319754a584c1cb2c3c1b3de31beb39eee3638302	2026-02-25 17:59:23.001029
375	login	0	login_falha	\N	\N	98970247009	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	c415e4b31fb358b2763ca472a771e3a29530475da2d7b69fa224d1e68f2dd784	2026-02-25 18:26:58.47907
376	login	0	login_falha	\N	\N	98970247009	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	2af2e22d57726833317efa53744f370f7d96e00daa25fa8819ab4a6535a649ff	2026-02-25 18:27:18.301606
377	login	0	login_sucesso	\N	\N	98970247009	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	421d5a3e0e6f1bb62431bc4adda13810ec2de0671f87b0828c08a56a1822c9d5	2026-02-25 18:27:24.833739
378	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	41a7ff057a3a0e5b6fd417a952f35c39ffeb9c7b653260753342a82713441d68	2026-02-25 18:35:06.288853
379	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	647d617e35e6f90982c5eaf5efa1586ad6d86478ca0b361a28f10f9749f29899	2026-02-25 19:08:42.91097
380	login	104	login_sucesso	\N	\N	04703084945	rh	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	2a8d7de4782b1edbf7fa3812293a76bcdcbd7cd6b4304e36e6dbe3ad049e5e65	2026-02-25 20:02:51.852633
381	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	3cd0d34c8c73951df375f576f79321caa822b25d5d43402305e97a874168523b	2026-02-25 20:07:42.767426
382	login	0	login_sucesso	\N	\N	53051173991	emissor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	fad2c2605be9e75cfd354d0284bc4570a3d93242a2b56082dbaea2486f259792	2026-02-25 20:14:26.834175
383	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	086a1fa8fb11a66c9886e4b437b34ea89ba44c54518fcf7b522b06ee903cf0f8	2026-02-25 20:16:09.150553
384	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8c88f91c543707063d41376a0ea63abdd2697872b816e9c6b4b921ab5227541a	2026-02-25 20:43:33.585822
385	login	100	login_falha	\N	\N	29930511059	\N	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	278a556b4c4460b8c6a715300bad180d6e4ce73c6ce074ee6ee2892a3d8da16b	2026-02-25 20:45:09.085238
386	login	100	login_falha	\N	\N	29930511059	\N	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	4a9ccaf23834ee756c96e9b2f40fdcb1b60ff616829fc7e88bd444fd38b2509f	2026-02-25 20:45:16.686701
387	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8ba658b977ea55f2c23beb8a40ef57abca41a700671ab9635feaaaaf62baf7fd	2026-02-25 20:45:19.883767
388	login	0	login_sucesso	\N	\N	03800369087	funcionario	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	589f3054b764558fa5f8c81fa92c4487d3056f788118e8f8c7019c23d38814cc	2026-02-25 22:33:23.169555
389	login	0	login_sucesso	\N	\N	87545772920	admin	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	796cd7e5a0cbed4d1750360b09debf907f0fc795ed6bfc3f88002234e6db06c1	2026-02-25 22:35:29.06093
390	login	100	login_falha	\N	\N	29930511059	\N	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	0ca2473afaa8dad85a98eb0a9c63c49d75439d3a06665ab0cfa133213262e08e	2026-02-25 22:35:45.520763
391	login	100	login_sucesso	\N	\N	29930511059	gestor	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	89d2d199ac1ee05809475a71840aff6e4dd611850b78d1f9e2655a2955691c72	2026-02-25 22:35:52.919913
392	login	0	login_sucesso	\N	\N	03800369087	funcionario	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f077b6afdb4ca43c8577bfba52ea9346925fc8558f37c85d20b754ee2bf71906	2026-02-25 22:49:12.880115
393	login	0	login_sucesso	\N	\N	87545772920	admin	152.250.78.77	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	\N	3b58834cbe18b67ef14b273d7897dd0603ad4366cb77a61a34c285726e3cadc9	2026-02-26 02:49:24.807748
394	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	616ff58f4048fd74cbea2cdf7fdf0b93b2ce12c0d4a3b3399fb6f8180f997f25	2026-02-26 10:22:16.450525
395	login	0	login_sucesso	\N	\N	18237959000	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	e16b01b25434554235f39ff9af39034a0d5119ede014e303c30277e41af00b9b	2026-02-26 10:24:00.300177
396	login	0	login_sucesso	\N	\N	18237959000	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f6537d2cf852b844f80522f9ca4cd97375e31f1717c9c91c3510d800ece5fe27	2026-02-26 11:18:11.139978
397	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	aea6609eabc24872bf9ff4ff913f5330a54be40b3d5a356052571a9b17c1f68b	2026-02-26 11:18:12.681575
398	login	0	login_sucesso	\N	\N	18237959000	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	fc5bfe9ea2089db09f730fec83140d6a005ab96d956d5d7d4179dd5fda8e4952	2026-02-26 11:18:25.706114
399	login	0	login_falha	\N	\N	98970247009	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	a62df7b5562fdbdcb7d34369ff546406b296283e3a2070b1ba5b72af7b20ef51	2026-02-26 17:03:09.389894
400	login	0	login_sucesso	\N	\N	98970247009	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	62602d5eb34531c173d2d55f3cc74d3aa46f7ea52a5ba9aedd82b5bcf2a5afda	2026-02-26 17:03:21.337277
401	login	104	login_sucesso	\N	\N	04703084945	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	6f794cfb9cb6ca225639fecc814c0d7d4474b755851415c9d8bab3ba1577b81f	2026-02-26 17:15:13.75972
402	login	0	login_sucesso	\N	\N	18237959000	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	ffba30e1a86ed7b0c45fbda3847f699c4f03f6f77a618612be16280eded5c746	2026-02-26 17:16:24.972132
403	login	0	login_sucesso	\N	\N	18237959000	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	91bfb7427878339fa08861fae4a9960f3bcc9dc008c8f411c0d8621ce857724a	2026-02-26 17:16:57.736293
404	login	0	login_sucesso	\N	\N	18237959000	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c8d1b16c00624dd65eaa5d2c35754f82b54a0a970e8dd172307ab988a7a029a8	2026-02-26 17:17:35.267564
405	login	0	login_sucesso	\N	\N	18237959000	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	017f773986d5cbd10fe07ca650814e460cd64e2ee6c3b8f8fca8c9c199b52e8e	2026-02-26 17:17:47.91483
406	login	0	login_sucesso	\N	\N	87545772920	admin	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	e3965b27a445dde9314cc9b72add5e4ba1f9fc3efbbfbc5cdc6030f1e7f96797	2026-02-26 17:22:52.27906
407	login	104	login_sucesso	\N	\N	04703084945	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	e717441bba2aeaf0369519b262e17fd9caa715083bc2b92b469f04ba09c7824e	2026-02-26 17:27:26.196727
408	login	0	login_sucesso	\N	\N	18237959000	funcionario	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	ee8fde5d1955314052b52eaee130fa4b20d2d97e8b09971dc8069770a4310b74	2026-02-26 17:31:45.117725
409	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	10c65085b28e466ccaccc41465f3b5ba193d46818575377533ed3901a853145f	2026-02-26 17:36:21.87958
410	login	0	login_sucesso	\N	\N	18237959000	funcionario	177.173.219.246	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	4c31e0c93afdc1af541ac13bf2b1c703c9a98149e9bb3d31d86fb14487474a39	2026-02-26 17:37:51.004679
411	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a7153d8fab9f4959659fddc19fea3ff97903b8361c13a8e6559a1f6e7c190691	2026-02-27 03:11:34.630891
412	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	5d765fb1a041d3bb7615997bd9723579099c910020eb077366bb607ed2835c75	2026-02-27 03:12:20.478875
413	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	434ac37fb751180f11e514b76882f62d3c27a12196068e6b5f0a322885ca3131	2026-02-27 03:52:46.121098
414	login	100	login_sucesso	\N	\N	29930511059	gestor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	5b272a8303fd20ff776ce32d521e3c3711f41472db663213043ad6ec5a5b55e8	2026-02-27 04:08:51.681205
415	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	20c65da13ac5c0005d4d4ee97894c15396e252c8f52e3b9fc1ec1a55b24dda8a	2026-02-27 05:42:48.456607
416	login	0	login_falha	\N	\N	29371145048	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"motivo": "senha_invalida"}	d2c1f96ccc7a2c4badf349d3603f20e24ae805ca7b20a0a1b249065a494018cf	2026-02-27 05:45:09.486379
417	login	0	login_sucesso	\N	\N	29371145048	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	da1145a8e03a219d7531d38db70c898439929cdf97a982e03b60c9b4b336bf36	2026-02-27 05:45:14.892753
418	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	7e6833fc2e9426f1b39922c2035b81ace93f6c46e56d92788b396e3065039d4e	2026-02-27 06:08:34.116343
419	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	bfc4e3ad641fd8f62b0aed32500cc9573a210e352da9944782fa203ae6711de5	2026-02-27 06:17:14.699735
420	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	58437c740a87548edfa6abb7084af2bc39235bf6ffccf63bc4f88aa1aeb6376f	2026-02-27 06:19:59.63242
421	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	858bab92f0fd2b7418c9ea58c86be21b8465223fa5ca3f97cc31a5f4291578ec	2026-02-27 06:20:18.870575
422	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8d1d8a77e55cf1958d68bd4638cda84eb384efc484610eed369a521e6d560fb8	2026-02-27 06:21:03.862405
423	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	3fe5e23d6b395b217447c4a41021ce913fd806aff6500953c3f3fb8ad7a23894	2026-02-27 06:27:04.095264
424	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	8bf46bb90c181d98076ee32384962f7d6d1b85fb93d14fd0a1415a54e5ca97a8	2026-02-27 06:54:04.315703
425	login	100	login_sucesso	\N	\N	29930511059	gestor	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8afff0efe595e0b46c969708453709e9c378621a531710c1ef93fcaabe7e38a5	2026-02-27 08:23:16.287536
426	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	efcc8a14d75c1a6b2cbc7007ca3f9fcb02e7052c02a10f04aa0dcefe170fa447	2026-02-27 08:27:23.406798
427	login	121	login_sucesso	\N	\N	05248635047	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 121, "tipo_usuario": "gestor"}	09d7253d210cfc6ebf4978b6c2f8c32814644880bc999fd8e5790b0d12f0d2d1	2026-02-27 11:45:42.278402
428	usuario	121	aceitar_termos_privacidade	\N	\N	05248635047	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "1417a18908a53f2d6e670705017fea1d324539749aa744f241361d6b31971b23", "termo_tipo": "termos_uso", "entidade_cnpj": "38854941000165"}	24f7de25056af95dbc0c14b4863706d36da746f308a60debe6fe05ed88a00d9b	2026-02-27 11:45:46.825345
429	usuario	121	aceitar_termos_privacidade	\N	\N	05248635047	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "1417a18908a53f2d6e670705017fea1d324539749aa744f241361d6b31971b23", "termo_tipo": "politica_privacidade", "entidade_cnpj": "38854941000165"}	c0983397ced61f3eb79ebfe18ddf59169693987e950acc86a4104fed7d4bd341	2026-02-27 11:45:49.960537
430	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	\N	7ae32eefe58e9666ab4a7d32a6e797525df330711f169600c3b28ee22698b17f	2026-02-27 12:41:24.01118
432	login	0	login_sucesso	\N	\N	78639856095	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	2d8e9b3464c4338cf8ce710bfec0068c628952843b17d1ee1ff268a17eafe4ed	2026-02-27 13:00:19.836821
433	login	0	login_falha	\N	\N	94617882073	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"motivo": "senha_invalida"}	3dfcb6d4315882ab1173b9ad5e916ff95d24455ff6a69637171f83a2246a12c3	2026-02-27 13:11:12.654919
434	login	0	login_sucesso	\N	\N	94617882073	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	4d6735dce9be4c0a106df802d4fc3d7861d72ae9de19192caf044030f3621a77	2026-02-27 13:11:15.28281
435	login	123	login_sucesso	\N	\N	38908580077	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 123, "entidade_id": null, "tipo_usuario": "rh"}	40567c4c5c593da41fcd8534724db4cee27b3d7a8d30e5f7f771bbc60da88c8f	2026-02-27 13:17:14.622827
436	usuario	123	aceitar_termos_privacidade	\N	\N	38908580077	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "02fe0d34cfa328d8b1a7c1eb861b1132ec81321a2e5793b76581dcffc307255a", "termo_tipo": "termos_uso", "entidade_cnpj": "43315703000111"}	afc11d41c48b2bef9300c92a1d043851f1adeeaa280cce45c565aaea89c8d628	2026-02-27 13:17:18.321734
437	usuario	123	aceitar_termos_privacidade	\N	\N	38908580077	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "02fe0d34cfa328d8b1a7c1eb861b1132ec81321a2e5793b76581dcffc307255a", "termo_tipo": "politica_privacidade", "entidade_cnpj": "43315703000111"}	68eda224063689a30e74d34aedaad1538c14c43a834c22500613d19d2c544c4a	2026-02-27 13:17:21.555117
438	login	0	login_sucesso	\N	\N	99977387052	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	9004791b13e2c8639ab6717b78d772a15aa0d9888beb8ea80ecb63f3d56caf3f	2026-02-27 13:24:02.398219
439	login	0	login_sucesso	\N	\N	41119471079	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	af065dccf523fef467898d840d84e27597ff15981d7b567fb875e48e8bb54f74	2026-02-27 13:26:11.77603
440	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	1152c971abe3bf94f8931adb4d1f313905a1acf6d68a577d46f389c533f18722	2026-02-27 13:52:17.632018
441	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	c890188d93e259f676ccab74abde5709c3148922c6ef8a99576c50f8eba71b82	2026-02-27 13:53:01.596813
442	login	100	login_sucesso	\N	\N	29930511059	gestor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	8faab5ffeb09342d7bd1cea4d5db9511890d5feaaff5714bf3ebed0355d72aca	2026-02-27 14:12:44.380924
443	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	f4fd58be7bc3e8d5fc60b1dc342d0f3231aec675565e416a36196d3899a77d14	2026-02-27 14:13:01.179848
444	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	5fb02d850dce25bb7f9a3adba26c78cd36eec5a1969dc01f2d0ca6050fd2f07c	2026-02-27 15:11:27.129933
445	login	0	login_sucesso	\N	\N	34624832000	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	8352754059a25baf1a86e4139623706c444d7b83fdb80c04cea0832997464646	2026-02-27 15:14:20.332583
446	login	0	login_sucesso	\N	\N	34624832000	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	fb2f09d5b02e5a1f2e7d3bbb306d6997206e3fc42f307c5072b43390b8887fca	2026-02-27 15:19:17.586835
447	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	b2589b4e91cc7f9908bf1ee06ab47774a6b43e6571545116920f425e16f45ea1	2026-02-27 15:34:35.63183
448	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	151f9504c977e11e363bb06c126e1ca8585f9a95afdb65888f622ca7f6c8dbd3	2026-02-27 15:35:18.072005
449	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	204c9154f1812d97cbfc4680c62f8ef4c31dc3956a035d81c41fcb834cc9a66a	2026-02-27 15:55:40.218443
450	login	100	login_sucesso	\N	\N	29930511059	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 100, "tipo_usuario": "gestor"}	0aae745150842187fef6b5e78af49a05911790245b7e01752587c52634c6e02e	2026-02-27 15:56:01.890837
451	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	adc731207151e37ecc18eb0ee6bb8c94c34a45009f17e14e5b8ff1cb8099411f	2026-02-27 16:20:35.175754
452	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	a636e5035310aa980fc8e4355233afebdc25d8645e4227273de42fde2e8e1c5b	2026-02-28 12:43:19.122382
453	login	104	login_sucesso	\N	\N	04703084945	rh	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	74702dee7e01d54bccd0927cf4c4bdca55ff84cfa9f21eabce764a6dab775a0e	2026-02-28 12:43:39.070607
454	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	c013dfba59b1fbb666d7771cbb203ef33ff8a61b60293c281deb2501486a7c9d	2026-02-28 18:53:22.118188
455	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	8c1ae7acfc5724723d706c0d8adfe1caa61c2e6382fbec0d73060fd77053acd5	2026-03-02 18:21:27.094474
456	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	db4f6ba268a973b3875400dbc4fec0bfc9d1616ba8f735d5b8832725da85f1ac	2026-03-02 19:29:56.192443
457	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	\N	c9c4999f9edbc2d8a05f139b5299d61449399ddcf3df1d63fab0c1ab73b38ea8	2026-03-02 23:11:53.704397
458	login	0	login_sucesso	\N	\N	11122233344	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pf", "representante_id": 1}	bbd707e1faf0eabf615387d7aa16e35912507b1189f01d89be7723d56f3d31e2	2026-03-03 01:57:32.063887
459	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	1948cbed964994de10bd9784ad29d3b8d87dd20a6550e92093cea39c6b137445	2026-03-03 01:58:07.688428
460	login	0	login_sucesso	\N	\N	11122233344	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pf", "representante_id": 1}	df549a01262574be18dc528365809974eea64c45eccd1e5aa91ec51afdece5bd	2026-03-03 02:14:56.598297
461	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	22baf7dc2aca7c0316b74b8fe9c901058c4f0b409b7af47e03bf791912ac2d85	2026-03-03 02:20:16.94188
462	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	b4b4e5527ce4d369d6843505396733b83dc347c8f28852d88f7d77711f9fed8d	2026-03-03 02:43:17.89713
463	login	0	login_sucesso	\N	\N	55566677788	representante	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"tipo_pessoa": "pj", "representante_id": 2}	bc746efc05e0aeffa4c97565df6907facc2ec6d8f2218d2b94829628118180b1	2026-03-03 02:56:20.269695
464	login	0	login_sucesso	\N	\N	55566677788	representante	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"tipo_pessoa": "pj", "representante_id": 2}	857bc1d153fc074367ef35238b06a4b77ddb7f5b1aca0af39ae4d1f385a17a1c	2026-03-03 02:56:45.500064
465	login	124	login_sucesso	\N	\N	49602738014	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 124, "tipo_usuario": "gestor"}	e7ee9981470a550436cb00bae49f3d69a5e66b26f24ea432449cd8559c96f357	2026-03-03 02:59:26.049325
466	usuario	124	aceitar_termos_privacidade	\N	\N	49602738014	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "732ea13855dbdc76e90a88f578d6ca9133e217eda0033fc619e8c83fc6f14302", "termo_tipo": "termos_uso", "entidade_cnpj": "34304264000150"}	ac4aac6961886bfb9bd07ff69ca78b14ee3e1bb719684a43348a40edd22f711d	2026-03-03 02:59:29.410064
467	usuario	124	aceitar_termos_privacidade	\N	\N	49602738014	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "732ea13855dbdc76e90a88f578d6ca9133e217eda0033fc619e8c83fc6f14302", "termo_tipo": "politica_privacidade", "entidade_cnpj": "34304264000150"}	de8321e497eb890eb1b9b576c85d7ec7fe3a7e1d6d24e1ba9537b719fe7b3ac5	2026-03-03 02:59:31.666298
468	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	cb54cb52f7b990122bba471ad78627714f903d7d5d812e687a0f7a77ce509418	2026-03-03 03:00:25.556658
469	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	cb0632a9215c50014c52ada06eb0172af772d061b3f11ffbd5893fea0b9d6be4	2026-03-03 03:31:01.11267
470	login	0	login_sucesso	\N	\N	11122233344	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pf", "representante_id": 1}	b7b246eedfd0ad544adbd59b6acb321856c041d2bbafd7367cc03aa76fb727bc	2026-03-03 03:31:31.425216
471	login	0	login_sucesso	\N	\N	11122233344	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pf", "representante_id": 1}	9c5d48a8865a3da24343c82792e8ba0bec06ed08953033e7345de40fa317855f	2026-03-03 03:47:42.478172
472	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	043bb0922e0941684331bb96ebdc9e628cdafc465cb9242f8530c2a0e7cb0347	2026-03-03 03:49:27.203267
473	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	d1c01220fb7b8492f925b49d60df2c77350857461e01f2bd0855f9873b45ca06	2026-03-03 03:49:55.253401
474	login	0	login_sucesso	\N	\N	11122233344	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pf", "representante_id": 1}	7ec3ce77f54c5a82818f803fa43d6f0d32828cefe015ca7f7d87407f50ed0f92	2026-03-03 04:05:39.918019
475	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	b44444dfb19afee92415d034f2ef781c98121d672525c679084c0d13977b7072	2026-03-03 04:06:40.307159
476	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	2abf5ec94985cd1c9ee7560a1394d9653f0d2f0f7aed76928d9a3beb3df77748	2026-03-03 11:42:18.807972
477	login	104	login_sucesso	\N	\N	04703084945	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	3b4dbb4949c34d6b86302cdb5bc20e4912df45ed9dac947d4f7a0d4cc357b335	2026-03-03 11:46:04.798392
478	login	119	login_sucesso	\N	\N	87251739011	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 119, "entidade_id": null, "tipo_usuario": "rh"}	51ddf285bcae01e37b578244a637f2d5e1a00d8cf47f518d6dc574fa3e4fd993	2026-03-03 12:28:12.868666
479	login	119	login_sucesso	\N	\N	87251739011	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 119, "entidade_id": null, "tipo_usuario": "rh"}	3666addf30b19c85b23093dc51580bb9d58fca8c94c8134caca1ee5126630efc	2026-03-03 12:28:30.206878
480	login	119	login_falha	\N	\N	87251739011	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"motivo": "tomador_inativo"}	0f8990c9285124d3d1d64ed54403746e2d77a3d02b3c35a0b64420fa98933ff0	2026-03-03 12:29:12.83887
481	login	119	login_sucesso	\N	\N	87251739011	rh	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": 119, "entidade_id": null, "tipo_usuario": "rh"}	2bd17ba90f7a2c35594a0477d7758844ba1ad613f6740f337b2a4d7ea1c9e235	2026-03-03 12:29:30.839775
482	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	016e08a42b45694526854e11a5917200e468cec6751a821c230b049e35a71995	2026-03-03 12:58:28.179644
483	login	0	login_sucesso	\N	\N	87545772920	admin	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	\N	46121653836ac70cd6ecbd21b36a9d4a877a8aa9fb81daa8cd32fbd7d42ed662	2026-03-03 13:04:00.845619
484	login	125	login_sucesso	\N	\N	09777228996	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 125, "tipo_usuario": "gestor"}	10dcdf99074a9de05e93056282106d4c49706614a39d93a0e5c83d833a7286ec	2026-03-03 13:12:44.251694
485	usuario	125	aceitar_termos_privacidade	\N	\N	09777228996	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "ce60020f65fd5f6a0a543602429ef599a224555c7d724be1d12cd4b2519bf1fa", "termo_tipo": "termos_uso", "entidade_cnpj": "99154114000153"}	b7279784a6399be58c4ab9022980d698f46a5206add8513396fb8eb2adf80bb4	2026-03-03 13:12:59.998394
486	usuario	125	aceitar_termos_privacidade	\N	\N	09777228996	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "ce60020f65fd5f6a0a543602429ef599a224555c7d724be1d12cd4b2519bf1fa", "termo_tipo": "politica_privacidade", "entidade_cnpj": "99154114000153"}	e36a3a53edafed0109c9900d4f77d1f01eef27a993c340b7a63f421e2671142f	2026-03-03 13:13:33.48792
487	login	0	login_falha	\N	\N	09777228996	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "data_nascimento_formato_invalido", "tipo_usuario": "funcionario"}	c30ab456aae98302b803e7b99e69263dadfc981adff834535a23e6febf6aff39	2026-03-03 13:23:15.773733
488	login	0	login_falha	\N	\N	73922219063	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "usuario_inativo"}	30aab256a6de0cde060138d240baffe3212c0bd70e08de71bcc2214a3be5e8ac	2026-03-03 13:24:06.619483
489	login	0	login_falha	\N	\N	09777228996	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	85bd69ec11762efc9adf94cc55399cfe09b08d69d175cbd9ce00c5053742b4d6	2026-03-03 13:24:16.015406
490	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	9d236c448b4843c47f85b375fe724e821d1a9e4b4577dc04ec9fa5e000206a2a	2026-03-03 13:24:20.374977
491	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	6c0ff751f7d390d4e6dc55eea9f1d39497b2e57c1e5a847bdbb7d3ed8d61a47c	2026-03-03 13:42:24.100997
492	login	126	login_sucesso	\N	\N	52052819010	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 126, "tipo_usuario": "gestor"}	3e3cad60c6c055470634fd2db1ce5f7733909028a8cabc998d7c88ff2cb9469f	2026-03-03 13:47:21.161773
493	usuario	126	aceitar_termos_privacidade	\N	\N	52052819010	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "23676b6853ccdb0e43dc4ab130d1579f2b71f4928dea46b2016086c9121daf6a", "termo_tipo": "termos_uso", "entidade_cnpj": "89178670000106"}	74bb8a2a5c920200f16f20d3b24108ff7be755ad29b7ce2265e65072debe41b7	2026-03-03 13:47:24.900055
494	usuario	126	aceitar_termos_privacidade	\N	\N	52052819010	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "23676b6853ccdb0e43dc4ab130d1579f2b71f4928dea46b2016086c9121daf6a", "termo_tipo": "politica_privacidade", "entidade_cnpj": "89178670000106"}	a2d575d1584006be562b94e74d9a5a31ddc8996b8ed45e5c241f00cb642eb89e	2026-03-03 13:47:27.485391
495	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	9e4a556d96380111a50704547c0feecaa669b079f2adb88cc244989241220817	2026-03-03 13:47:38.245194
496	login	0	login_sucesso	\N	\N	55566677788	representante	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"tipo_pessoa": "pj", "representante_id": 2}	0ab7c700c74d9e1b8dbc539f2a314d928f5b7736bb79ba7d7559386d0410316e	2026-03-03 13:48:57.013281
497	login	127	login_sucesso	\N	\N	91510815040	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 127, "tipo_usuario": "gestor"}	7a42e6b7b6273a89fa884ffc26d0736f82cac85e55f15f73096a0626320e3b01	2026-03-03 14:07:20.232794
498	usuario	127	aceitar_termos_privacidade	\N	\N	91510815040	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "224dc62861fc708b2e8dab2adbac653053e400e0f2be9abde4430df74156821c", "termo_tipo": "termos_uso", "entidade_cnpj": "61614511000198"}	c964e4394a4c523e21f380a41719160804ddf731db18bb1c4036e374d5193d18	2026-03-03 14:07:24.128634
499	usuario	127	aceitar_termos_privacidade	\N	\N	91510815040	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "224dc62861fc708b2e8dab2adbac653053e400e0f2be9abde4430df74156821c", "termo_tipo": "politica_privacidade", "entidade_cnpj": "61614511000198"}	4d522569291ef66030d0818da41e012e13a55d6baebaf724259964fd858e7208	2026-03-03 14:07:26.754402
500	login	0	login_sucesso	\N	\N	92544157070	funcionario	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	c99e73af66af56feed063918645d430dd6d95698d5e1eb5dac142dfa6089f6b9	2026-03-03 14:36:44.708674
501	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	df1564f29f3ff30f95200d1ae0a768b8a5532058ecaddbd1f95ae32fc645eb23	2026-03-03 14:46:44.02741
502	login	0	login_sucesso	\N	\N	53051173991	emissor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	\N	9d9ac45b21fb27a9404ac8031badc3ad757379184ee6173b349fc5c54a99699b	2026-03-03 14:48:54.736035
503	login	127	login_sucesso	\N	\N	91510815040	gestor	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 127, "tipo_usuario": "gestor"}	de0790df9b1269b72512bb3c2f66a31da66b1144b143e3a8fdb2611d248d8408	2026-03-03 15:01:08.18942
504	login	127	login_sucesso	\N	\N	91510815040	gestor	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": 127, "tipo_usuario": "gestor"}	cc457832dea8c8946b0dcbd7c3577b33aa3531f74e08146351d002a1a306e5d6	2026-03-03 15:14:22.737561
505	login	0	login_sucesso	\N	\N	55566677788	representante	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"tipo_pessoa": "pj", "representante_id": 2}	a9fab48cd672e551317fb82d0bdb0379ac56ffec64618727549f477d3b4eef73	2026-03-03 18:09:57.636969
506	login	0	login_sucesso	\N	\N	55566677788	representante	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"tipo_pessoa": "pj", "representante_id": 2}	adfd749539e21afb1aee91d6155e59c1c05a01e95c839bab083094d79f808d08	2026-03-03 18:13:45.705017
507	login	0	login_sucesso	\N	\N	87545772920	admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	ab327ed0ee1982c88d289ea127827f686f022cf10d71ea0fcddfeb9fa45a7ae4	2026-03-03 18:14:02.202022
508	login	0	login_sucesso	\N	\N	87545772920	admin	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	\N	03e14ebc3c532fcd8f6dfc0f248d1286b4f119418123f1a0645c7d459f38cde2	2026-03-04 02:40:19.845976
509	login	128	login_sucesso	\N	\N	35962136063	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 128, "entidade_id": null, "tipo_usuario": "rh"}	c6a1b8974873d37d48a8e9409cd1005131627886be9c6d6868885412bba52f15	2026-03-08 01:10:34.927507
510	usuario	128	aceitar_termos_privacidade	\N	\N	35962136063	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "e56abe3f444a23f7c2bdf3977e106448ce6cf49237a5a326714ba0a8b557fc50", "termo_tipo": "termos_uso", "entidade_cnpj": "95520984000148"}	a55f26b846169b3c76175fe31bdbb20c94a084fd1af1a256a87cc69ed471d903	2026-03-08 01:10:40.055732
511	usuario	128	aceitar_termos_privacidade	\N	\N	35962136063	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "e56abe3f444a23f7c2bdf3977e106448ce6cf49237a5a326714ba0a8b557fc50", "termo_tipo": "politica_privacidade", "entidade_cnpj": "95520984000148"}	198ee1e8d21b6796c382234ca57438f26b8b6e903ff7ff2dd76443bfe7e8bf8c	2026-03-08 01:10:43.981317
512	login	129	login_sucesso	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 129, "entidade_id": null, "tipo_usuario": "rh"}	438d9f719c4eac2e1cbc43bdb91e848518d2dee2fcb600da8a3a0c25506842b0	2026-03-09 01:53:34.3897
513	usuario	129	aceitar_termos_privacidade	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "3c67e6957d04b7c64d31211bf4eaecb6e7c66d0479dbb1062c31a48e3c387fd8", "termo_tipo": "termos_uso", "entidade_cnpj": "22765627000176"}	75d96f8604a5123cb95bc92506b1c8bafc4a36d399c7701a8ee094e9a07f86f2	2026-03-09 01:53:39.507428
514	usuario	129	aceitar_termos_privacidade	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "3c67e6957d04b7c64d31211bf4eaecb6e7c66d0479dbb1062c31a48e3c387fd8", "termo_tipo": "politica_privacidade", "entidade_cnpj": "22765627000176"}	71304e89f5270910231b769f98ed6af2bba2c5dc3125293ad8d21eab16874b2b	2026-03-09 01:53:43.562947
515	login	0	login_sucesso	\N	\N	75377605004	funcionario	152.250.78.77	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	937cfc824148c43d793048b1f88b6964eff3bc585ff4fa3a5306671ceefa10a9	2026-03-09 02:02:55.745183
516	login	0	login_sucesso	\N	\N	11110827075	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	f83896df8d94b316e69f40ca848c22b9a7861d40b5e5fb24ea650c1122268651	2026-03-09 02:04:44.128567
517	login	0	login_sucesso	\N	\N	32586030060	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	9185cdf43d9c7422fdd637070fea33326eae300e853387b6549b33a3faa21747	2026-03-09 02:11:15.055032
518	login	129	login_sucesso	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 129, "entidade_id": null, "tipo_usuario": "rh"}	b9d6c133d01f65f6782eeff7f9e5064782e952c4386692550feb617c512b0fbd	2026-03-09 20:55:30.044067
519	login	129	login_sucesso	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 129, "entidade_id": null, "tipo_usuario": "rh"}	7fc1892ed3a9251982b1417509296361730093158abe1da32e894c05f7e81f9b	2026-03-09 21:05:16.294295
520	login	0	login_sucesso	\N	\N	75377605004	funcionario	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": null, "tipo_usuario": "funcionario"}	b158098c60e66ad79a14af03bd0651f75ecf9c7e355719c4af988b2b207eb0ef	2026-03-09 21:14:57.738212
521	login	129	login_sucesso	\N	\N	69558061069	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 129, "entidade_id": null, "tipo_usuario": "rh"}	e50e3e466b6059e4511aadd978299981ffef8e4adc80458d6d9eb06a270d0427	2026-03-09 21:15:55.434358
522	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	5e889cf64485a0453a1c37f3a099ef0329c37577fe7b0cccaea64c50a57a7115	2026-03-09 22:36:19.183071
523	login	130	login_sucesso	\N	\N	87748070997	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": null, "entidade_id": 130, "tipo_usuario": "gestor"}	4712ae61d097040b48cbdce2b81c91e7c9d42804ee67931fe957ec80a7a15ca4	2026-03-10 11:54:27.437877
524	usuario	130	aceitar_termos_privacidade	\N	\N	87748070997	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "360094c512af7ecfbf32168e9179247c3504eb0e284067f890c08cd99c055676", "termo_tipo": "termos_uso", "entidade_cnpj": "25013531000140"}	1839a14dbd057f7635186fd32104a326939cd83133fb22a9437ee1914834549a	2026-03-10 11:54:56.052979
525	usuario	130	aceitar_termos_privacidade	\N	\N	87748070997	gestor	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"versao": 1, "sessao_id": "360094c512af7ecfbf32168e9179247c3504eb0e284067f890c08cd99c055676", "termo_tipo": "politica_privacidade", "entidade_cnpj": "25013531000140"}	7b77e7d5a99cb1409ccf6694a5fd187990c573a02a08add104a2080fe87a5469	2026-03-10 11:55:00.52999
526	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	a50e3401689e2b673484b2adea28e574e3e23eb6138d5c42fa43126087af95f6	2026-03-10 22:53:56.874186
527	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	f097c85b1a74551856ac7f45b880629e59cbd6f61244c809055448cfd6bfc64a	2026-03-10 22:56:40.003416
528	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	6f77509dbdf3c0dc5337075ac8ec46c48880494ac7b73077eba41570c65f1365	2026-03-10 23:34:00.719474
529	login	104	login_sucesso	\N	\N	04703084945	rh	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 104, "entidade_id": null, "tipo_usuario": "rh"}	383e4f1821cafdf7ced31d14723f5f67b934eb0bec4b07ac02045a6b76270328	2026-03-10 23:52:35.768079
530	login	0	login_falha	\N	\N	09777228996	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "senha_invalida"}	3941967565b53f0a1be9546029a987a0b4a1a7866cafa4d800d5dc4cd5f6c83e	2026-03-11 13:33:36.515401
531	login	0	login_falha	\N	\N	73922219063	\N	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"motivo": "usuario_inativo"}	dd1ad66c5539bc7abb1ca8109b6dba341214a43927de3bdc2b4834db54268881	2026-03-11 13:33:40.408678
532	login	120	login_sucesso	\N	\N	79432901009	rh	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	\N	{"clinica_id": 120, "entidade_id": null, "tipo_usuario": "rh"}	d68b137633c8dfea17c2e29c37698a7d0dc2006c4f1dc099a02c2a34555e2450	2026-03-11 13:33:44.657959
\.


--
-- Data for Name: auditoria_geral; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_geral (id, tabela_afetada, acao, cpf_responsavel, dados_anteriores, dados_novos, criado_em) FROM stdin;
1	notificacoes	migration_025_tipo_laudo	\N	\N	{"descricao": "Migração de laudo_emitido para laudo_enviado", "data_migracao": "2026-02-09T20:16:02.833497+00:00", "total_atualizadas": 0}	2026-02-09 20:16:02.833497
\.


--
-- Data for Name: auditoria_laudos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_laudos (id, lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, observacoes, criado_em, solicitado_por, tipo_solicitante, tentativas, erro) FROM stdin;
1	1005	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-10 17:22:32.563262	04703084945	rh	0	\N
2	1007	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-10 19:50:59.68606	29930511059	gestor	0	\N
3	1008	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-11 01:15:05.619261	35051737030	gestor	0	\N
4	1009	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-11 02:02:12.619227	64411953056	rh	0	\N
5	1010	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-12 12:32:17.869141	04703084945	rh	0	\N
6	1018	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-17 00:23:27.715698	04703084945	rh	0	\N
7	1026	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-17 13:09:14.044698	48538520008	gestor	0	\N
8	1027	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-17 16:27:57.531341	31777317053	rh	0	\N
9	1029	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-17 21:35:14.838208	29930511059	gestor	0	\N
10	1025	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-17 23:59:37.428059	29930511059	gestor	0	\N
11	1019	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-18 01:27:36.591513	04703084945	rh	0	\N
12	1030	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-18 02:21:21.221813	29930511059	gestor	0	\N
13	1031	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-18 02:40:40.065771	04703084945	rh	0	\N
14	1032	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-18 03:05:53.947524	04703084945	rh	0	\N
15	1033	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-18 11:08:59.166885	04703084945	rh	0	\N
16	1028	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-20 00:08:49.131665	04703084945	rh	0	\N
17	1034	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-23 21:23:56.716926	16911251052	gestor	0	\N
18	1035	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-23 23:16:37.868751	99328531004	rh	0	\N
19	1037	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-25 18:39:25.417877	79432901009	rh	0	\N
20	1039	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-02-27 13:12:16.205921	05248635047	gestor	0	\N
21	1042	\N	\N	\N	solicitar_emissao	pendente	\N	\N	2026-03-03 14:38:37.116556	91510815040	gestor	0	\N
\.


--
-- Data for Name: recibos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recibos (id, contrato_id, pagamento_id, numero_recibo, vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento, numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, conteudo_pdf_path, conteudo_texto, emitido_por_cpf, ativo, criado_em, atualizado_em, pdf, hash_pdf, ip_emissao, emitido_por, hash_incluso, backup_path, parcela_numero, clinica_id, entidade_id) FROM stdin;
\.


--
-- Data for Name: auditoria_recibos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auditoria_recibos (id, recibo_id, acao, status, ip_address, observacoes, criado_em) FROM stdin;
\.


--
-- Data for Name: avaliacao_resets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.avaliacao_resets (id, avaliacao_id, lote_id, requested_by_user_id, requested_by_role, reason, respostas_count, created_at) FROM stdin;
64502096-66b2-48df-9bb5-31ba06176177	10004	1004	100	gestor	\\zcczzc\\c\\zz\\c\\z\\z	37	2026-02-11 23:59:11.353752+00
fded5139-4c2c-4c3a-a4e6-7cb7aaa9df8b	10022	1013	100	gestor	dsdgdgsdgdg	0	2026-02-12 21:33:13.897585+00
7de193a1-7557-4a60-b44f-2d4069de41ff	10027	1014	100	gestor	dfhfdhfdhh	3	2026-02-12 23:47:33.768794+00
c32717bf-d91f-4de6-a5ca-27e9bf0e711a	10021	1012	-1	rh	errrrrq	0	2026-02-13 12:49:33.746615+00
cb06bbef-c1bb-4856-9d6d-0d188c6a575c	10053	1026	114	gestor	sfsfasfasfsf	2	2026-02-17 13:06:14.202157+00
a9314d5d-9b9f-45ea-b542-f021eec799d6	10056	1027	-1	rh	iopiopiopipo	2	2026-02-17 16:20:13.70858+00
10a39a68-b596-4f73-92d6-2dbe6e7187fe	10069	1035	-1	rh	wtwewer	3	2026-02-23 23:10:38.266045+00
446bc2ad-b002-447f-874c-21ed7d33cafe	10082	1040	-1	rh	vxvxzvxzzvxvzx	3	2026-02-27 13:26:32.533949+00
\.


--
-- Data for Name: clinica_configuracoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinica_configuracoes (id, clinica_id, campos_customizados, logo_url, cor_primaria, cor_secundaria, template_relatorio_id, incluir_logo_relatorios, formato_data_preferencial, criado_em, atualizado_em, atualizado_por_cpf) FROM stdin;
\.


--
-- Data for Name: clinicas_empresas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas_empresas (clinica_id, empresa_id, criado_em) FROM stdin;
\.


--
-- Data for Name: clinicas_senhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clinicas_senhas (id, clinica_id, cpf, senha_hash, primeira_senha_alterada, created_at, updated_at, criado_em, atualizado_em) FROM stdin;
1	99	04703084948	$2a$10$4Cx15gbCmwOcOILFTeA1..aG1/dX6DRrIedgY0/ryJ4j0PorNZNIO	f	2026-02-10 03:58:05.710118	2026-02-10 04:20:07.099385	2026-02-10 03:58:05.710118+00	2026-02-10 04:20:07.099385+00
2	104	04703084945	$2a$10$n3CdxDGTS7E2RYBK8QwqtuDClE6cWzzTFvOrwWaEeG9xJ8QD78Lgm	f	2026-02-10 04:21:22.938132	2026-02-10 04:21:22.938132	2026-02-10 04:21:22.938132+00	2026-02-10 04:21:22.938132+00
3	107	64411953056	$2a$10$YBSpGCzIQ9RJnB/H34NVeuPO3jmg3.MU1bOezbLzWYnx2/ijAFIRC	f	2026-02-11 01:48:14.115011	2026-02-11 01:48:14.115011	2026-02-11 01:48:14.115011+00	2026-02-11 01:48:14.115011+00
4	108	87748070997	$2a$10$QwsQsYMcXRJ7TiB1g.NEdeiNTjG6Ra62wDOPAS/ykD49G9LH6ZU8C	f	2026-02-12 12:12:44.189688	2026-02-12 12:12:44.189688	2026-02-12 12:12:44.189688+00	2026-02-12 12:12:44.189688+00
5	109	03178539026	$2a$10$nZ44stciCuPHTpAVH8GakejC.jTGQk6RNK5pTeyiJQj.ywXa86kpS	f	2026-02-12 18:00:40.213057	2026-02-12 18:00:40.213057	2026-02-12 18:00:40.213057+00	2026-02-12 18:00:40.213057+00
6	111	58455720026	$2a$10$Od9d0ErBmytbqJQUfy0pfefyb/wKlh5j3MzHaaCh.dLDNS.2qCt42	f	2026-02-13 02:50:04.155004	2026-02-13 02:50:04.155004	2026-02-13 02:50:04.155004+00	2026-02-13 02:50:04.155004+00
7	112	70873742060	$2a$10$IZi8N.z7sfFi2ni88Fw2aegl/lrWi.WDvo1VTD9z0rrp3TRmU3ILy	f	2026-02-16 14:27:16.297082	2026-02-16 14:27:16.297082	2026-02-16 14:27:16.297082+00	2026-02-16 14:27:16.297082+00
8	113	62985815029	$2a$10$ASZr0MXS8d1EOyK4boFCnOVtes8/xeR.Go30rDWymMu34ZC9hLOQ6	f	2026-02-16 18:25:33.384376	2026-02-16 18:25:33.384376	2026-02-16 18:25:33.384376+00	2026-02-16 18:25:33.384376+00
9	115	31777317053	$2a$10$lZN3UfUimg9VU5v.T2KtTuKEVwLZchidAJMEXH6tCoTLdhSOKiwaW	f	2026-02-17 16:14:05.439776	2026-02-17 16:14:05.439776	2026-02-17 16:14:05.439776+00	2026-02-17 16:14:05.439776+00
10	118	99328531004	$2a$10$NjStiBjnUI6FaLjQ5i7STupAR5rlaLO3tgRo6Z7L4s6AjGl4tOW6a	f	2026-02-23 22:44:39.541361	2026-02-23 22:44:39.541361	2026-02-23 22:44:39.541361+00	2026-02-23 22:44:39.541361+00
11	119	87251739011	$2a$10$N5TEW.GDHhfa1VIvaJdpgeQoTw/OSf7za1rKbl3P5iVhtycEzx7Yi	f	2026-02-25 16:00:19.07193	2026-02-25 16:00:19.07193	2026-02-25 16:00:19.07193+00	2026-02-25 16:00:19.07193+00
12	120	79432901009	$2a$10$K4s.xTMLVTcjK32Wm7DE3eu1c1k9HV.okMIGvIEGQV9pt9xNiIIJW	f	2026-02-25 17:58:12.137668	2026-02-25 17:58:12.137668	2026-02-25 17:58:12.137668+00	2026-02-25 17:58:12.137668+00
13	122	25070037072	$2a$10$1WLAXEr2hFzXEv9JB4y06euleRwVJmityw7AAZeIKcORvAXWxcVkS	f	2026-02-27 13:13:29.538619	2026-02-27 13:13:29.538619	2026-02-27 13:13:29.538619+00	2026-02-27 13:13:29.538619+00
14	123	38908580077	$2a$10$RYbkacgm1LrWVdQLsJ5er.ATu0JQGKewtQZvQc9Rm7OFgKWEQIVn2	f	2026-02-27 13:16:55.784168	2026-02-27 13:16:55.784168	2026-02-27 13:16:55.784168+00	2026-02-27 13:16:55.784168+00
15	128	35962136063	$2a$10$4rPyPtAfGKO/4RgYJ.9YAeiaYvGIsD23nLoEmVhs9ltardjKwvd5O	f	2026-03-08 01:10:15.207825	2026-03-08 01:10:15.207825	2026-03-08 01:10:15.207825+00	2026-03-08 01:10:15.207825+00
16	129	69558061069	$2a$10$NIiSb/o1IH7NI0CbVfJ1Q.MqE2MmXH5mQpkeFlqgOWdRG2vyVTlxS	f	2026-03-09 01:53:12.805251	2026-03-09 01:53:12.805251	2026-03-09 01:53:12.805251+00	2026-03-09 01:53:12.805251+00
\.


--
-- Data for Name: comissionamento_auditoria; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comissionamento_auditoria (id, tabela, registro_id, status_anterior, status_novo, triggador, motivo, dados_extras, criado_por_cpf, criado_em) FROM stdin;
7	representantes	1	apto_pendente	ativo	admin_action	Mudança de status representante	\N	00000000191	2026-03-03 02:12:41.4885+00
8	representantes	1	ativo	apto	admin_action	Mudança de status representante	\N	87545772920	2026-03-03 03:29:08.061381+00
9	representantes	1	ativo	apto	admin_action		\N	87545772920	2026-03-03 03:29:08.20832+00
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.usuarios (id, cpf, nome, email, clinica_id, entidade_id, ativo, criado_em, atualizado_em, tipo_usuario) FROM stdin;
1	87545772920	Administrador QWork	admin@qwork.com.br	\N	\N	t	2026-02-09 20:56:58.100826	2026-02-09 20:56:58.100826	admin
3	53051173991	Emissor Teste QWork	emissor@qwork.com.br	\N	\N	t	2026-02-09 21:00:16.715145	2026-02-09 21:00:16.715145	emissor
4	29930511059	Gestor RLGR	rhrlge@kdke.com	\N	100	t	2026-02-09 21:41:02.172557	2026-02-09 21:41:02.172557	gestor
5	04703084945	tani akk	4dffadf@dsfdf.com	104	\N	t	2026-02-10 04:21:23.389567	2026-02-10 04:21:23.389567	rh
6	24626149073	zdvdzd dzvvzvz	dsfsdfsfd@fdfd.com	\N	105	t	2026-02-10 12:31:00.37258	2026-02-10 12:31:00.37258	gestor
7	35051737030	Gestor Empresa Priv Fin	gestorempprivfin@ffdffsd.ci	\N	106	t	2026-02-11 01:02:59.219163	2026-02-11 01:02:59.219163	gestor
8	64411953056	Gestor Clin Final test	gesges@dsgds.com	107	\N	t	2026-02-11 01:48:14.9874	2026-02-11 01:48:14.9874	rh
10	03178539026	amdna Nexus	fafa@safsf.com	109	\N	t	2026-02-12 18:00:41.074283	2026-02-12 18:00:41.074283	rh
11	07432266077	Ronaldo Entidade Final	ronaldofilardo@yahoo.com.br	\N	110	t	2026-02-13 02:25:43.101457	2026-02-13 02:25:43.101457	gestor
12	58455720026	Tania Krina	gercli@dffd.com	111	\N	t	2026-02-13 02:50:05.038676	2026-02-13 02:50:05.038676	rh
13	70873742060	TESTE 16.02	DFHJKGHJDFJH@GMAIL.COM	112	\N	t	2026-02-16 14:27:17.151252	2026-02-16 14:27:17.151252	rh
14	62985815029	Amanda Clinex	fdfds@aas.com	113	\N	t	2026-02-16 18:25:34.266543	2026-02-16 18:25:34.266543	rh
15	48538520008	Ronlado Foçç	ffda@dasffd.co	\N	114	t	2026-02-17 12:57:46.633749	2026-02-17 12:57:46.633749	gestor
16	31777317053	Aagpo pdaiopi	ffdfsd@kokol.com	115	\N	t	2026-02-17 16:14:06.304648	2026-02-17 16:14:06.304648	rh
17	92019863006	Entidade Final	fsfd@oojo.cd	\N	116	t	2026-02-23 04:05:36.530364	2026-02-23 04:05:36.530364	gestor
18	16911251052	Rona Filar	rewwer@vvxcvc.dsf	\N	117	t	2026-02-23 20:49:18.679465	2026-02-23 20:49:18.679465	gestor
19	99328531004	Tania kC Fila	sfdsf@dd.pom	118	\N	t	2026-02-23 22:44:40.35939	2026-02-23 22:44:40.35939	rh
20	87251739011	fasfasasf fasfaf	fdfdsf@sdffds.com	119	\N	t	2026-02-25 16:00:19.903527	2026-02-25 16:00:19.903527	rh
21	79432901009	TESTESTESTES TESTESTESTSETS	FDKHKLAFJG@GMAIL.COM	120	\N	t	2026-02-25 17:58:12.954158	2026-02-25 17:58:12.954158	rh
22	05248635047	Gestor pos clean	asaf@vcvcx.co	\N	121	t	2026-02-27 11:45:21.401705	2026-02-27 11:45:21.401705	gestor
23	25070037072	gestor clin pioso cleln	sdfsdf@dsfdsf.co	122	\N	t	2026-02-27 13:13:29.718153	2026-02-27 13:13:29.718153	rh
24	38908580077	eaopi adsfpipoi po 	dsfsfd@faas.coj	123	\N	t	2026-02-27 13:16:55.952313	2026-02-27 13:16:55.952313	rh
25	49602738014	Lead Gestor PJ	faaf@oijoic.om	\N	124	t	2026-03-03 02:59:08.181247	2026-03-03 02:59:08.181247	gestor
26	09777228996	TESTE teste	GHADJGHF@GMAIL.COM	\N	125	t	2026-03-03 13:11:39.663435	2026-03-03 13:11:39.663435	gestor
27	52052819010	Gestor dash admin	dffds@sdffds.co	\N	126	t	2026-03-03 13:47:03.906502	2026-03-03 13:47:03.906502	gestor
28	91510815040	geste test lead com acont	eerrwe@dsffds.ce	\N	127	t	2026-03-03 14:07:02.696235	2026-03-03 14:07:02.696235	gestor
29	35962136063	gestor clini pos refa	fafds@dffds.con	128	\N	t	2026-03-08 01:10:16.048524	2026-03-08 01:10:16.048524	rh
30	69558061069	Leo JJ MedCwb	leobjj@med.com	129	\N	t	2026-03-09 01:53:13.658037	2026-03-09 01:53:13.658037	rh
9	87748070997	Cristine Dittmann Brasil	alessandra.gatti@acessosaude.com.br	\N	130	t	2026-02-12 12:12:45.145804	2026-03-10 11:53:57.830663	gestor
\.


--
-- Data for Name: laudos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, enviado_em, atualizado_em, job_id, arquivo_remoto_provider, arquivo_remoto_bucket, arquivo_remoto_key, arquivo_remoto_url, relatorio_individual, relatorio_lote, hash_relatorio_individual, hash_relatorio_lote, arquivo_remoto_uploaded_at, arquivo_remoto_etag, arquivo_remoto_size, hash_pdf) FROM stdin;
1002	1002	\N	\N	rascunho	2026-02-10 11:29:28.439742	\N	\N	2026-02-10 11:29:28.439742	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1003	1003	\N	\N	rascunho	2026-02-10 11:30:56.337043	\N	\N	2026-02-10 11:30:56.337043	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1004	1004	\N	\N	rascunho	2026-02-10 12:10:36.722222	\N	\N	2026-02-10 12:10:36.722222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1006	1006	\N	\N	rascunho	2026-02-10 12:33:46.635319	\N	\N	2026-02-10 12:33:46.635319	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1005	1005	53051173991	\N	emitido	2026-02-10 12:21:47.979581	2026-02-10 20:53:23.011417	\N	2026-02-10 22:38:56.401957	\N	backblaze	laudos-qwork	laudos/lote-1005/laudo-1770756960778-42nlgb.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1005/laudo-1770756960778-42nlgb.pdf	\N	\N	\N	\N	2026-02-10 22:38:56.401957	"35a6e9f8ecfdb88d4d53f2fcc57a4518"	\N	0014e8529251d7093cef87d99e52c79bad641db94ab9381984eb023579e2b684
1007	1007	53051173991	\N	emitido	2026-02-10 14:13:18.784349	2026-02-10 21:57:09.352366	\N	2026-02-10 22:38:56.417801	\N	backblaze	laudos-qwork	laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1007/laudo-1770762849769-ua5zu0.pdf	\N	\N	\N	\N	2026-02-10 22:38:56.417801	"d1ebe1fe7546928487aa5b32270c0b27"	577310	e843e534ff0a6beb94817e0d94d48e640b37e421666a0313970813f5453638c1
1027	1027	53051173991	\N	emitido	2026-02-17 16:17:22.406893	2026-02-17 16:30:20.202337	\N	2026-02-17 16:30:45.231108	\N	backblaze	laudos-qwork	laudos/lote-1027/laudo-1771345848652-x2oidr.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1027/laudo-1771345848652-x2oidr.pdf	\N	\N	\N	\N	2026-02-17 16:30:45.231108	"ecc89a98be21f730c39be246f425c3b3"	640776	074d25c544009f0f63477353815dcbae3c4a1d88008d175f599ab8975418d216
1008	1008	53051173991	\N	emitido	2026-02-11 01:17:41.164409	2026-02-11 01:18:16.24153	\N	2026-02-11 01:18:34.481805	\N	backblaze	laudos-qwork	laudos/lote-1008/laudo-1770772751916-8j47zr.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1008/laudo-1770772751916-8j47zr.pdf	\N	\N	\N	\N	2026-02-11 01:18:34.481805	"7ce2e35be5258189daa574e045af106d"	640751	7b05ed01ab03ae05d6a346f30888ede8746c9c54d223ae41b066441c16483633
1028	1028	\N	\N	rascunho	2026-02-17 19:31:13.767633	\N	\N	2026-02-17 19:31:13.767633	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1009	1009	53051173991	\N	emitido	2026-02-11 01:53:04.39101	2026-02-11 02:06:00.908827	\N	2026-02-11 02:06:15.641617	\N	backblaze	laudos-qwork	laudos/lote-1009/laudo-1770775613063-d02f0l.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1009/laudo-1770775613063-d02f0l.pdf	\N	\N	\N	\N	2026-02-11 02:06:15.641617	"f19fb51fd6b9108757b358e9417f463b"	639837	ef5f33ca349c8b1399c7d7f0723ecf1d490c62509bbe49d7f279adc7b51eb3c6
1010	1010	\N	\N	rascunho	2026-02-12 12:24:06.406657	\N	\N	2026-02-12 12:24:06.406657	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1011	1011	\N	\N	rascunho	2026-02-12 19:55:58.791717	\N	\N	2026-02-12 19:55:58.791717	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1012	1012	\N	\N	rascunho	2026-02-12 20:18:17.914788	\N	\N	2026-02-12 20:18:17.914788	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1017	1017	\N	\N	rascunho	2026-02-13 02:53:27.28168	\N	\N	2026-02-13 02:53:27.28168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1018	1018	\N	\N	rascunho	2026-02-13 12:52:21.512364	\N	\N	2026-02-13 12:52:21.512364	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1019	1019	\N	\N	rascunho	2026-02-16 14:23:17.887271	\N	\N	2026-02-16 14:23:17.887271	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1020	1020	\N	\N	rascunho	2026-02-16 14:41:07.474115	\N	\N	2026-02-16 14:41:07.474115	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1021	1021	\N	\N	rascunho	2026-02-16 14:43:59.088439	\N	\N	2026-02-16 14:43:59.088439	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1022	1022	\N	\N	rascunho	2026-02-16 14:54:08.66088	\N	\N	2026-02-16 14:54:08.66088	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1023	1023	\N	\N	rascunho	2026-02-16 15:53:20.61145	\N	\N	2026-02-16 15:53:20.61145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1024	1024	\N	\N	rascunho	2026-02-16 18:28:42.879711	\N	\N	2026-02-16 18:28:42.879711	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1029	1029	53051173991	\N	emitido	2026-02-18 01:35:12.075479	2026-02-18 01:35:21.375374	\N	2026-02-18 01:35:43.951386	\N	backblaze	laudos-qwork	laudos/lote-1029/laudo-1771378547237-kvkkbs.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1029/laudo-1771378547237-kvkkbs.pdf	\N	\N	\N	\N	2026-02-18 01:35:43.951386	"6000bfe9bdd4d747ee4902f6ed4993cb"	627632	a26675cc39cde11fb184c85e45e0fee14f43851cf0e1c5ec77c6e34a15296f36
1026	1026	53051173991	\N	emitido	2026-02-17 14:09:56.862043	2026-02-17 14:36:48.351374	\N	2026-02-17 14:38:07.685671	\N	backblaze	laudos-qwork	laudos/lote-1026/laudo-1771339091272-j6fndo.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1026/laudo-1771339091272-j6fndo.pdf	\N	\N	\N	\N	2026-02-17 14:38:07.685671	"dc4eb8d876ae54f28b89ab3b8e04eb98"	579348	ad364fc4c83c4f45ac7fa2b2671dfdaf07ea0f93b9b8758a20d4211cc86d7c23
1031	1031	\N	\N	rascunho	2026-02-18 02:38:58.852216	\N	\N	2026-02-18 02:38:58.852216	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1032	1032	\N	\N	rascunho	2026-02-18 03:04:23.317314	\N	\N	2026-02-18 03:04:23.317314	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1033	1033	53051173991	\N	rascunho	2026-02-18 11:07:07.504048	\N	\N	2026-02-23 21:22:18.209824	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1038	1038	\N	\N	rascunho	2026-02-27 05:43:16.178477	\N	\N	2026-02-27 05:43:16.178477	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1040	1040	\N	\N	rascunho	2026-02-27 13:23:43.884143	\N	\N	2026-02-27 13:23:43.884143	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1034	1034	53051173991	\N	emitido	2026-02-23 21:28:43.051591	2026-02-23 22:13:19.920611	\N	2026-02-23 22:14:10.400096	\N	backblaze	laudos-qwork	laudos/lote-1034/laudo-1771884852195-j4l6i0.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1034/laudo-1771884852195-j4l6i0.pdf	\N	\N	\N	\N	2026-02-23 22:14:10.400096	"523c298b61e0308084b002fd695b025f"	626011	ba468bcde3fb5cddb87766c85e3ab0363b05aba3948be5f946066aa3066264e2
1035	1035	53051173991	\N	emitido	2026-02-23 23:08:34.460644	2026-02-23 23:23:42.363697	\N	2026-02-23 23:24:38.714678	\N	backblaze	laudos-qwork	laudos/lote-1035/laudo-1771889082468-7maq40.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1035/laudo-1771889082468-7maq40.pdf	\N	\N	\N	\N	2026-02-23 23:24:38.714678	"222d0b50121e4e6832a086d2a0d4ee89"	584889	4eadfb98f1db89604e2dc21ad1e83306f77a6b2e2025b470fe4aaef6cff5103b
1037	1037	53051173991	\N	emitido	2026-02-25 18:25:07.383889	2026-02-25 20:14:53.206792	\N	2026-02-25 20:15:20.994532	\N	backblaze	laudos-qwork	laudos/lote-1037/laudo-1772050534060-djstsp.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1037/laudo-1772050534060-djstsp.pdf	\N	\N	\N	\N	2026-02-25 20:15:20.994532	"7ff28cbde2dac9921e23f757dfb604a2"	521426	14e78ed8f41eca2d359f40461809613deb35f4e936cdd12629408dda3e7eb706
1042	1042	53051173991	\N	emitido	2026-03-03 14:49:52.089476	2026-03-03 14:59:45.794234	\N	2026-03-03 15:00:32.202145	\N	backblaze	laudos-qwork	laudos/lote-1042/laudo-1772550058047-72ymoa.pdf	https://s3.us-east-005.backblazeb2.com/laudos-qwork/laudos/lote-1042/laudo-1772550058047-72ymoa.pdf	\N	\N	\N	\N	2026-03-03 15:00:32.202145	"9a3297e8274197d22024935c6bfa7290"	372180	68561d88342c9072418c9be704bcf6386a852857858c9c6563d7d99a49f5efd4
1043	1043	\N	\N	rascunho	2026-03-09 02:03:14.828254	\N	\N	2026-03-09 02:03:14.828254	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1044	1044	\N	\N	rascunho	2026-03-10 22:58:55.770127	\N	\N	2026-03-10 22:58:55.770127	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: representantes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.representantes (id, tipo_pessoa, nome, email, telefone, cpf, cnpj, cpf_responsavel_pj, codigo, banco_codigo, agencia, conta, tipo_conta, titular_conta, pix_chave, pix_tipo, doc_identificacao_path, comprovante_conta_path, status, aceite_termos, aceite_termos_em, aceite_disclaimer_nv, aceite_disclaimer_nv_em, bloqueio_conflito_pf_id, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, senha_hash) FROM stdin;
2	pj	Empresa Teste PJ Ltda	rep.pj.teste@qwork.dev	11999000002	\N	12345678000195	55566677788	REP-PJ123	001	0001	98765-4	corrente	Empresa Teste PJ Ltda	12345678000195	cnpj	\N	\N	ativo	t	2026-03-02 19:42:22.413343+00	t	2026-03-02 19:42:22.413343+00	\N	2026-03-02 19:42:22.413343+00	2026-03-03 02:12:41.643965+00	\N	\N	$2a$10$C91l7kLWcD5BM7CZZgDNX.1KbblVQN4M9JqHUVAV0aOQMaNrsXBgm
1	pf	Carlos Teste PF	rep.pf.teste@qwork.dev	11999000001	11122233344	\N	\N	REP-PF123	260	0001	12345-6	corrente	Carlos Teste PF	12345678901	cpf	\N	\N	apto	t	2026-03-02 19:42:22.39237+00	t	2026-03-02 19:42:22.39237+00	\N	2026-03-02 19:42:22.39237+00	2026-03-03 03:29:08.061381+00	2026-03-03 03:29:08.061381+00	87545772920	$2a$10$LiG6EKxxi3LbFgVQOHFXvOSzBo/aYEE5fm6/P.0SIJw5YuqwcianS
\.


--
-- Data for Name: leads_representante; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leads_representante (id, representante_id, cnpj, razao_social, contato_nome, contato_email, contato_telefone, criado_em, data_expiracao, status, tipo_conversao, entidade_id, data_conversao, token_atual, token_gerado_em, token_expiracao, atualizado_em) FROM stdin;
1	1	43723331000162	Leads Tests	Roanlo	ronaldorialdo@dgssapo.com	419992415220	2026-03-02 23:10:16.814881+00	2026-05-31 23:10:16.814881+00	pendente	\N	\N	\N	\N	\N	\N	2026-03-02 23:10:16.814881+00
2	2	48395311000123	Ledas PJ	gsipoi 	sdds@fdsfds.com	88798798798	2026-03-02 23:11:20.368599+00	2026-05-31 23:11:20.368599+00	pendente	\N	\N	\N	\N	\N	\N	2026-03-02 23:11:20.368599+00
4	1	70772067000120	lea 01 pf	uiouoiuo	dffds@dsfsd.vc	4654654654	2026-03-03 02:15:28.758646+00	2026-06-01 02:15:28.758646+00	pendente	\N	\N	\N	ccd83e74899ea3ef9565835cb5941584bc2331735e5603ff56af338d27848aec	2026-03-03 02:19:32.07908+00	2026-06-01 02:15:28.758646+00	2026-03-03 02:19:32.07908+00
3	2	34304264000150	Lead PJ 01	Raqondi	sssdsd@sdfsdf.com	459112456465	2026-03-03 01:58:52.300266+00	2026-06-01 01:58:52.300266+00	convertido	verificacao_cnpj	124	2026-03-03 02:58:53.264511+00	16cb825bc803b62458bf5f94a0223b8e0eb0784ffbee4f478ad65105befade66	2026-03-03 02:20:30.452998+00	2026-06-01 01:58:52.300266+00	2026-03-03 02:58:53.264511+00
5	2	61614511000198	Tste PJ lead	raoeip	ere@sdfsdf.dfe	4578978978	2026-03-03 13:50:26.502094+00	2026-06-01 13:50:26.502094+00	convertido	codigo_representante	127	2026-03-03 14:06:52.076726+00	\N	\N	\N	2026-03-03 14:06:52.076726+00
\.


--
-- Data for Name: vinculos_comissao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vinculos_comissao (id, representante_id, entidade_id, lead_id, data_inicio, data_expiracao, status, ultimo_laudo_em, criado_em, atualizado_em, encerrado_em, encerrado_motivo) FROM stdin;
1	2	124	3	2026-03-03	2027-03-03	ativo	\N	2026-03-03 02:58:53.283324+00	2026-03-03 02:58:53.283324+00	\N	\N
2	2	127	5	2026-03-03	2027-03-03	ativo	\N	2026-03-03 14:06:52.096173+00	2026-03-03 14:06:52.096173+00	\N	\N
\.


--
-- Data for Name: comissoes_laudo; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comissoes_laudo (id, vinculo_id, representante_id, entidade_id, laudo_id, percentual_comissao, valor_laudo, valor_comissao, status, motivo_congelamento, mes_emissao, mes_pagamento, data_emissao_laudo, data_aprovacao, data_liberacao, data_pagamento, nf_rpa_enviada_em, nf_rpa_aprovada_em, nf_rpa_rejeitada_em, nf_rpa_motivo_rejeicao, comprovante_pagamento_path, sla_admin_aviso_em, auto_cancelamento_em, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios (id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, matricula, turno, escala, nivel_cargo, ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, indice_avaliacao, incluido_em, inativado_em, inativado_por, ultimo_lote_codigo, data_admissao) FROM stdin;
1	00000000000	Admin Sistema	\N	\N	admin@qwork.com	$2a$06$Z3xMbe4Kq6d2bfrWYmYWO.5FqCSwlGrHGlrih69xNj95SbKqDMqoG	admin	t	2026-02-09 19:32:10.783012	2026-02-09 19:32:10.783012	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	2026-02-09 19:32:10.783012	\N	\N	\N	\N
1040	29371145048	Entidade fem	Operacional	estagio	reewrrwerweantos@empresa.cyy	$2a$10$YuJViFEGt.rwDJPxv/mrs.6MtFIuCRpFP8qSEnFYYIvaM7Tm9223K	funcionario	f	2026-02-16 14:21:52.758386	2026-03-09 22:37:59.302547	\N	\N	\N	gestao	10076	2026-03-09 22:37:59.302547	inativada	\N	2026-02-16 14:36:28.133277	2002-02-02	6	2026-02-16 14:21:52.758386	2026-03-09 22:39:17.851569	04703084945	\N	\N
1039	97687700074	Entidade masc	Administrativo	Analista	jose53va@empresa.coy	$2a$10$HlSK5lHXRRX2jJ.6Yk3XpuRCbXDEYgqZCXshsvf64I88zNDazJGBW	funcionario	f	2026-02-16 14:21:52.758386	2026-03-09 22:38:19.167449	\N	\N	\N	operacional	10075	2026-03-09 22:38:19.167449	inativada	\N	\N	2001-01-01	0	2026-02-16 14:21:52.758386	2026-03-09 22:39:27.465146	04703084945	\N	\N
1016	17285659010	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.com	$2a$10$CCEgsiac9DHv2LCEhDp54.WmpwHI6xW.x.R97M9LhjTdznOKPP9SO	funcionario	t	2026-02-10 12:33:30.10471	2026-02-10 12:33:30.10471	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1985-04-15	0	2026-02-10 12:33:30.10471	\N	\N	\N	\N
1017	77109022005	DIMore Itali Emp02 online	Operacional	estagio	r123132erweantos@empresa.dot	$2a$10$c2WQE9ZQq9phaEeJ6ddxueJRLFsM9GVIhwuNrBAWfcnH8SfB24kje	funcionario	t	2026-02-10 12:33:30.10471	2026-02-10 12:33:30.10471	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2011-02-02	0	2026-02-10 12:33:30.10471	\N	\N	\N	\N
1020	18597536047	Jose do Emp02  online	Administrativo	Analista	jos432432233va@empresa.uio	$2a$10$VDEPOYOkl9K/d5wkFC8ufeO7p8CLgkTr3K58HepFKRZvjvmF1sU7q	funcionario	t	2026-02-11 01:04:34.424847	2026-02-11 01:04:34.424847	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-11 01:12:17.053789	1985-04-15	5	2026-02-11 01:04:34.424847	\N	\N	\N	\N
1021	65648556055	DIMore Itali Emp02 online	Operacional	estagio	2erweantos@empresa.com.br	$2a$10$FvZ702/1QtQCvTggk.A6qO7hGpmUlO/DRPtdYEt/AEgY7yzEr0rZK	funcionario	t	2026-02-11 01:04:34.424847	2026-02-11 01:04:34.424847	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-11 01:14:43.757296	2011-02-02	5	2026-02-11 01:04:34.424847	\N	\N	\N	\N
1022	85804194097	gdssd sddssd	Administrativo	Analista	jose53va@empresa.cot	$2a$10$W.7znFpnmjwrj6eLNbK/O.xLX0ATQEx9lGf6OYLh4vIPtoh2W7aMW	funcionario	t	2026-02-11 01:52:46.462014	2026-02-11 01:52:46.462014	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-11 01:57:55.987926	2011-11-11	1	2026-02-11 01:52:46.462014	\N	\N	\N	\N
1023	32911756037	vzfdf dffddgssdg	Operacional	estagio	reewr90rweantos@empresa.com.br	$2a$10$6CRHX.II2GqQTrJMVGum0OSNxCjclq9GcLxnVlFkiu5ePpqwwyt1W	funcionario	t	2026-02-11 01:52:46.462014	2026-02-11 01:52:46.462014	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-11 02:01:46.606336	2002-02-02	1	2026-02-11 01:52:46.462014	\N	\N	\N	\N
1029	89487826068	tstes 05	Administrativo	Analista	rdfs432432233va@fdsfdsa.uio	$2a$10$MGr3mbK3ijiSOmaYH1oPZuN7k2X98xPIx5sLhT4ZydbX8kZsBZ5XG	funcionario	t	2026-02-12 19:03:11.085611	2026-02-12 19:03:11.085611	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2011-11-11	0	2026-02-12 19:03:11.085611	\N	\N	\N	\N
1030	42447121008	tewtew ewewwe	Operacional	estagio	mjdfantos@eesa.cj	$2a$10$TmQ1k7O5O4HeEmMa2se8VumVMhu8NbdKaRnhzRSlYq3p2118QKIee	funcionario	t	2026-02-12 19:03:11.085611	2026-02-12 19:03:11.085611	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2011-11-11	0	2026-02-12 19:03:11.085611	\N	\N	\N	\N
1028	98142073064	ffa ssafafs	ipoiop	poiopipo	poipoipo@ji.co	$2a$10$GHlP0WN/q1Y8kqEc9kp6hO315uNVBKNH5zuzyd7znjN3gVv4jBQaa	funcionario	f	2026-02-12 19:02:41.408304	2026-02-12 19:02:41.408304	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2011-11-11	0	2026-02-12 19:02:41.408304	2026-02-12 19:55:27.422077	03178539026	\N	\N
1009	49651696036	DIMore Itali	Operacional	estagio	reewrrwerweantos@empresa.com.br	$2a$10$CLvgYyarALVTMk6EMoyz4eCikFQqsDketl.AKTz.r6w/dTmsX8Iyq	funcionario	f	2026-02-10 03:34:31.346394	2026-02-10 03:34:31.346394	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-10 16:07:57.010649	2011-02-02	4	2026-02-10 03:34:31.346394	2026-02-12 21:44:04.669115	29930511059	\N	\N
1018	19778990050	Jaiemx o1	Administrativo	Analista	jorwerwero.24@empalux.com.br	$2a$10$E9ATE6p6XbDRMRqNNBAacOt1gQgsw8GbtB4DZWs7PoJMEA4JZu2yS	funcionario	f	2026-02-11 00:59:46.425929	2026-02-11 00:59:46.425929	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2010-12-12	0	2026-02-11 00:59:46.425929	2026-02-12 21:44:14.636421	29930511059	\N	\N
1031	40473159074	Tse senha	io	ioioi	dfdf@dffd.om	$2a$10$fuM5eAHYEA1JAoNveJmO9uIep8X0SqewdKG6S6FOpjJYHvgw2Bv76	funcionario	f	2026-02-12 22:05:44.643602	2026-02-12 22:05:44.643602	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-12 23:52:18.708343	2001-01-01	7	2026-02-12 22:05:44.643602	2026-02-12 23:53:24.681971	29930511059	\N	\N
1008	36381045086	Jose do UP01	Administrativo	Analista	jose53va@empresa.com.br	$2a$10$ViMYPxHFfK9EuY0P9aTEKu8dryKnJE9kTbrlosefY8Zk1u5q.4TAa	funcionario	f	2026-02-10 03:34:31.346394	2026-02-10 03:34:31.346394	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-10 16:29:35.288036	1985-04-15	4	2026-02-10 03:34:31.346394	2026-02-12 23:53:32.296006	29930511059	\N	\N
1033	98823740002	Entidade fem	Operacional	estagio	reewrrwerweantos@empresa.coo	$2a$10$MZGKJVLcSg74m5ijLpORPORNQZeHlz2NN8htBko56ehsbR2vPyEjm	funcionario	t	2026-02-13 02:28:36.182785	2026-02-13 02:28:36.182785	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2002-02-02	0	2026-02-13 02:28:36.182785	\N	\N	\N	\N
1034	05153743004	Entidade Final	opoipo	poipoi	poipo@uiouoi.di	$2a$10$tKfPJ7ewfl06WQlr82BgweQzjLCo9/6PZJsgvV5CtpfkCh0Srpmju	funcionario	t	2026-02-13 02:29:12.970338	2026-02-13 02:29:12.970338	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-13 02:39:45.154975	2003-03-03	9	2026-02-13 02:29:12.970338	\N	\N	\N	\N
1032	62745664069	Entidade masc	Administrativo	Analista	jose53va@empresa.col	$2a$10$t0wXXT4G6HnaXF38k1CThOdv2UXsLDfnA82wHNPQIBN1IG2tpB5R2	funcionario	t	2026-02-13 02:28:36.182785	2026-02-13 02:28:36.182785	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-13 02:46:44.678623	2001-01-01	9	2026-02-13 02:28:36.182785	\N	\N	\N	\N
1035	41172398054	Clinica masc	Administrativo	Analista	jose53va@empresa.gre	$2a$10$v7f9/R5Ui7xMV8z76b9NauDgmmj8j0abBkoslByRcEUcOPn00LsW2	funcionario	t	2026-02-13 02:52:24.570994	2026-02-13 02:52:24.570994	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2001-01-01	0	2026-02-13 02:52:24.570994	\N	\N	\N	\N
1036	68889393084	Clinica fem	Operacional	estagio	reewrrwerweantos@empresa.ytr	$2a$10$l66p3b9DkmGwzXFnomNs6.drOHoI3UaepT602InJNkbPW8zPclz4.	funcionario	t	2026-02-13 02:52:24.570994	2026-02-13 02:52:24.570994	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2002-02-02	0	2026-02-13 02:52:24.570994	\N	\N	\N	\N
1037	16871758020	Clinica final	kjklj	ljlkjlkj	fdfd@sffs.om	$2a$10$1txfoeSgtbTxs8QjaEoz4O9NYLndHI0MqLenzmnLoEoW1IyqkvXD.	funcionario	f	2026-02-13 02:52:55.250929	2026-02-13 02:52:55.250929	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2003-03-03	0	2026-02-13 02:52:55.250929	2026-02-13 02:53:12.816088	58455720026	\N	\N
1015	03175612008	DIMore Itali Emp02 online	Operacional	estagio	mjdfantos@empresa.cj	$2a$10$vDj0i2zO71sV8G8o2pno6uSNanXLHgvp7I4jmXt75GaqtxfdjpyXu	funcionario	f	2026-02-10 10:29:30.334004	2026-02-10 10:29:30.334004	\N	\N	\N	gestao	\N	\N	\N	\N	2026-02-12 12:31:15.029557	1971-09-27	3	2026-02-10 10:29:30.334004	2026-02-14 12:04:13.698774	04703084945	\N	\N
1014	73922219063	Jose do Emp02  online	Administrativo	Analista	rdfs432432233va@eesa.uio	$2a$10$qVGhZxTDgKlL9hVnCvi2pe6YN3U/of5Ls1f5UlDcibIpLQmbx8h3.	funcionario	f	2026-02-10 10:29:30.334004	2026-02-10 10:29:30.334004	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-12 12:30:53.219351	1974-10-24	3	2026-02-10 10:29:30.334004	2026-02-16 14:22:02.0573	04703084945	\N	\N
1038	77093511074	teste clicnia	ssa	uouoi	uoiuio@dsds.coj	$2a$10$g7o/0.rS1Hxc0ZmikTya7OU4eXQ2rdbkysqUw1wmDf1.gp1cn10ze	funcionario	f	2026-02-13 12:50:36.270198	2026-02-13 12:50:36.270198	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-13 13:01:13.834939	2001-01-01	5	2026-02-13 12:50:36.270198	2026-02-16 14:22:09.590017	04703084945	\N	\N
1041	97150516009	João da Silva	Administrativo	Analista	joao45.silva@empresa.com.br	$2a$10$bzZa3zNRTkiFn0pJWal7ue25i3X1TZAThRzAl1w4FKBnLcthVi9gO	funcionario	f	2026-02-16 14:33:39.207958	2026-02-16 14:33:39.207958	MAT001	Diurno	5x2	operacional	\N	\N	\N	\N	\N	1985-04-15	0	2026-02-16 14:33:39.207958	2026-02-16 14:36:42.0676	70873742060	\N	\N
1044	72255548089	testestestes 1	blabla	teste	fcgdsdfgdfdgdf@gmail.com	$2a$10$wAlpHj0WXmvrIE91pp/1nuyxrUtnteOREppRgKCUwKgKiP8FT28Ma	funcionario	f	2026-02-16 14:37:45.041795	2026-02-16 14:37:45.041795	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1999-02-20	0	2026-02-16 14:37:45.041795	2026-02-16 14:39:32.171892	70873742060	\N	\N
1046	86230028069	funcionario pos avaliação	sdfsdfsdf	sdfSFSDSD	SsdfSSDFSDFJKH@GMAIL.COM	$2a$10$x5.PLtfIHsrszGcehu189.8oY8IJVWFTTI4.wnhTAhRKwZBSp0ZO.	funcionario	t	2026-02-16 15:05:08.94392	2026-02-16 15:05:08.94392	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2000-01-01	0	2026-02-16 15:05:08.94392	\N	\N	\N	\N
1047	74984014016	Tste cpf correc	uoiuoi	uoiuoiu	oiuoiu@hkjhk.com	$2a$10$qFy9R7lgXHgBVO2fUB8nl.orriTUMIircFlS2Pje7wvM.cDlz7g/u	funcionario	t	2026-02-16 15:53:08.632162	2026-02-16 15:53:08.632162	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1999-02-20	0	2026-02-16 15:53:08.632162	\N	\N	\N	\N
1042	79466202090	Maria Santos	Operacional	Coordenadora	maria45.santos@empresa.com.br	$2a$10$uWwd3Y6/Ku8L.GsnQTUpg.mjTqlfB1akdJNa.AlnflSeOOjl1v/lq	funcionario	t	2026-02-16 14:33:39.207958	2026-02-16 14:33:39.207958	MAT002	Integral	6x1	operacional	\N	\N	\N	\N	\N	1999-02-20	0	2026-02-16 14:33:39.207958	\N	\N	\N	\N
1045	96309540017	testestestestes	sefsefse	sfefse	sfesdjhjkaffg@gmail.com	$2a$10$Z71TAAwRPG7.02aRPwauFOn.DDhNBu4.Jhgkl4UPuzEPYdmXz7jtm	funcionario	f	2026-02-16 14:53:34.393186	2026-02-16 14:53:34.393186	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1999-02-20	0	2026-02-16 14:53:34.393186	2026-02-16 16:46:11.186586	70873742060	\N	\N
1048	75376021076	TEstes dfiopip	fdfd	jjlk	ljkjklkj@dffds.com	$2a$10$0YTQLU9b5diE3/VCL.KFmeEKyOSFo97dJWG6FUsLXhN3Fs7KChqlS	funcionario	t	2026-02-16 17:45:08.589271	2026-02-16 17:45:08.589271	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1999-02-20	0	2026-02-16 17:45:08.589271	\N	\N	\N	\N
1049	26064999055	Joao 02021999	uoiuoi	uoiiouoi	oiuuoiuo@dfsdfs.com	$2a$10$7qsnvfoBa89z6tC/iETs.OkBoaE35aHrKqGRSt.FgKGmW/zSFQ8J6	funcionario	t	2026-02-16 18:27:52.933335	2026-02-16 18:27:52.933335	\N	\N	\N	operacional	\N	\N	\N	\N	2026-02-16 18:38:20.790429	1999-02-02	1	2026-02-16 18:27:52.933335	\N	\N	\N	\N
1050	67758302033	Ronaldo 24101974	dsdsa	uoiuoiOUIUOIU	uiouoiuo@jiji.com	$2a$10$p9u1C3zzqMhnbIxVMfHMEe8fZ/z650lGocGOQHq.LFuOpQlZAySrK	funcionario	t	2026-02-16 19:31:57.739081	2026-02-16 19:31:57.739081	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1974-10-24	0	2026-02-16 19:31:57.739081	\N	\N	\N	\N
1056	28917134009	Clinia 03032003	sfasf	sdfsd	effs@dsds.co	$2a$10$oKsEETWk6N6Hm530viVjaenoyA.hpWh6gog3UaeoiG5u7LqujD6uq	funcionario	t	2026-02-17 16:16:53.13207	2026-02-17 16:23:21.273647	\N	\N	\N	operacional	10055	2026-02-17 16:23:23.636	concluida	\N	2026-02-17 16:23:21.273647	2003-03-03	1	2026-02-17 16:16:53.13207	\N	\N	\N	\N
1059	66844689004	reipo 04042004	fdsfd	fsfd	sdsdf@kovo.com	$2a$10$nXEMxk5ckLnuJZ2Ir141QO4pGt3.3DT8RNK.b21sNmWiblJxbYSFq	funcionario	t	2026-02-17 19:31:06.056481	2026-02-17 19:32:27.978558	\N	\N	\N	operacional	10058	2026-02-17 16:32:34.205	concluida	\N	2026-02-17 19:32:27.978558	2004-04-04	1	2026-02-17 19:31:06.056481	\N	\N	\N	\N
1052	60463729099	Entidade fem 02022002''	Operacional	estagio	reewrrwerweantos@empresa.re	$2a$10$efwbSQAfTWYWizRR2rVSsu/GyAZfTnRREBem4X3GxzUDDJKRjov.e	funcionario	t	2026-02-17 00:03:01.059106	2026-02-17 00:44:13.186804	\N	\N	\N	gestao	10049	2026-02-17 00:44:15.513	concluida	\N	2026-02-17 00:44:13.186804	2002-02-02	10	2026-02-17 00:03:01.059106	\N	\N	\N	\N
1060	88931335040	jpo 05052005	sffas	afaf	fadfa@dsffds.cd	$2a$10$wfbd36XYd44US0eLff9FoeGwfpo/KDFjhIvmKJOkdSRLGkNQwtkZ.	funcionario	t	2026-02-17 19:34:03.253818	2026-02-17 19:35:15.907672	\N	\N	\N	operacional	10061	2026-02-17 16:35:22.123	concluida	\N	2026-02-17 19:35:15.907672	2005-05-05	12	2026-02-17 19:34:03.253818	\N	\N	\N	\N
1055	22703336080	Ronlado 03032003	oopioi	opipoipo	ipoipio@iouuio.com	$2a$10$DwxEGxyy1Ir1vtoBQJ07gu9jzv.YVtoHFGVX.nY8cDQszUEJ3oawG	funcionario	t	2026-02-17 13:00:01.790576	2026-02-17 13:01:54.904018	\N	\N	\N	operacional	10054	2026-02-17 13:01:54.904018	inativada	\N	\N	2003-03-03	0	2026-02-17 13:00:01.790576	\N	\N	\N	\N
1053	38409635089	Entidade masc 01012001	Administrativo	Analista	jose53va@empa.qwe	$2a$10$XGVHRHoxyBwL8LCHkuppmeL5c7bfHyzcSW9EzkD.I4U3QpZGmQmF2	funcionario	t	2026-02-17 12:59:35.284556	2026-02-17 13:07:13.971328	\N	\N	\N	operacional	10053	2026-02-17 13:07:13.971328	inativada	\N	\N	2001-01-01	0	2026-02-17 12:59:35.284556	\N	\N	\N	\N
1054	82773181034	Entidade fem 02022002''	Operacional	estagio	reewrrwerweantos@ema.re	$2a$10$ggtwjLzz.J7PMJ.gZGToOuZjH/WXL5iPLSD6GxQJHTMeYp6YL6aSC	funcionario	t	2026-02-17 12:59:35.284556	2026-02-17 13:08:33.920096	\N	\N	\N	gestao	10052	2026-02-17 13:08:36.231	concluida	\N	2026-02-17 13:08:33.920096	2002-02-02	11	2026-02-17 12:59:35.284556	\N	\N	\N	\N
1051	03757372000	Entidade masc 01012001	Administrativo	Analista	jose53va@empresa.qwe	$2a$10$SxwMHJPZZoHMUKqP/WiYkOKs.McWJw5vj1d4/1DtbtlgsO1y4Bsj.	funcionario	t	2026-02-17 00:03:01.059106	2026-02-18 02:20:49.848543	\N	\N	\N	operacional	10062	2026-02-17 23:20:56.205	concluida	\N	2026-02-18 02:20:49.848543	2001-01-01	13	2026-02-17 00:03:01.059106	\N	\N	\N	\N
1057	91275973000	Entidade masc 01012001	Administrativo	Analista	jose53va@empa.qwq	$2a$10$PEbTaQTj7y7nzli.V8LT6O4rJ8qmit9FR.low0i1OjK4KYfP9FIA.	funcionario	t	2026-02-17 16:17:09.123499	2026-02-17 16:18:45.713926	\N	\N	\N	operacional	10057	2026-02-17 16:18:45.713926	inativada	\N	\N	2001-01-01	0	2026-02-17 16:17:09.123499	\N	\N	\N	\N
1058	59557041080	Entidade fem 02022002''	Operacional	estagio	reewrrwerweantos@ema.reg	$2a$10$5kd0VwN0oPlAYC1ru/J.dOFslqRfbUcdadWTaTS3R9oP7XmkX5EEu	funcionario	t	2026-02-17 16:17:09.123499	2026-02-17 16:21:39.699496	\N	\N	\N	gestao	10056	2026-02-17 16:21:39.699496	inativada	\N	\N	2002-02-02	0	2026-02-17 16:17:09.123499	\N	\N	\N	\N
1061	17503742003	Ale 05052005	uiouiou	ouoiu	oiuoiuio@sssf.cv	$2a$10$W3Uy3CSmhi73mRivF3USE.DZDE1e8SBtxU1mcySzZ6wAyK/POx0gO	funcionario	t	2026-02-18 02:38:51.259447	2026-02-18 02:40:19.824763	\N	\N	\N	operacional	10064	2026-02-17 23:40:26.189	concluida	\N	2026-02-18 02:40:19.824763	2005-05-05	2	2026-02-18 02:38:51.259447	\N	\N	\N	\N
1062	90119869039	Peter 06062006	iuoiuoi	uoiuoi	uoiuoi@ffsd.cou	$2a$10$2gWIwYdwZ9M4..NtIOFQMezkSBLlYppZ5pRouuR9cJLpRx1umPcEG	funcionario	t	2026-02-18 03:04:14.652312	2026-02-18 03:05:33.556727	\N	\N	\N	operacional	10065	2026-02-18 00:05:39.882	concluida	\N	2026-02-18 03:05:33.556727	2006-06-06	3	2026-02-18 03:04:14.652312	\N	\N	\N	\N
1065	31745655026	Entidade fem 02022002''	Operacional	estagio	reewrrwerweantos@ema.reu	$2a$10$yi4Q5fP0U6k4agzVpK2q8uDvtyOgZTlJtRoewKykikJkW41Y7G61i	funcionario	t	2026-02-23 20:51:55.832321	2026-02-23 20:56:59.696394	\N	\N	\N	gestao	10067	2026-02-23 20:56:59.696394	inativada	\N	\N	2002-02-02	0	2026-02-23 20:51:55.832321	\N	\N	\N	\N
1064	34232299009	Entidade masc 01012001	Administrativo	Analista	jose53va@empa.qwq	$2a$10$yw9ZtWNuyDZcZcZzHn9l2.BOi3lu9GK9NFz/I5FxJhazHAieuOszy	funcionario	t	2026-02-23 20:51:55.832321	2026-02-23 21:10:02.883383	\N	\N	\N	operacional	10068	2026-02-23 21:10:05.249	concluida	\N	2026-02-23 21:10:02.883383	2001-01-01	14	2026-02-23 20:51:55.832321	\N	\N	\N	\N
1066	66930813044	Entidade masc 01012001	Administrativo	Analista	jose53va@empa.yr	$2a$10$CwI4Q.wWXMBriX5D97zH..RbR5mC50ds/2C1pyx2tT.OndXwueyra	funcionario	t	2026-02-23 23:07:07.097429	2026-02-23 23:11:02.215988	\N	\N	\N	operacional	10070	2026-02-23 23:11:02.215988	inativada	\N	\N	2001-01-01	0	2026-02-23 23:07:07.097429	\N	\N	\N	\N
1067	35923473062	Entidade fem 02022002''	Operacional	estagio	reewrrwerweantos@emaee.fg	$2a$10$ld7KhqedXssosHWdy0QcqO5ejremZ7pRUuDjD5t6ooE.QXCZtJ6lu	funcionario	t	2026-02-23 23:07:07.097429	2026-02-23 23:15:01.867821	\N	\N	\N	gestao	10069	2026-02-23 23:15:04.326	concluida	\N	2026-02-23 23:15:01.867821	2002-02-02	1	2026-02-23 23:07:07.097429	\N	\N	\N	\N
1068	29054003073	teste 02022002	ewtew	tewtwe	twew@dfsfd.co	$2a$10$YR0y1XHhsMFJskUCQKUbf..JRq3QpnokKM6nMQT9Iix2om2bswyou	funcionario	t	2026-02-23 23:08:21.025233	2026-02-23 23:16:00.87096	\N	\N	\N	operacional	10071	2026-02-23 23:16:03.236	concluida	\N	2026-02-23 23:16:00.87096	2002-02-02	1	2026-02-23 23:08:21.025233	\N	\N	\N	\N
1069	75415228055	teste 04042004	ffds	fdffa	ffafa@dffd.com	$2a$10$frZjKznbCAcbAeXO19CJQO6QpVjVY/9T0M/9x8vWCmWUobAf5oxje	funcionario	t	2026-02-24 00:31:52.593927	2026-02-24 00:31:52.593927	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2004-04-04	0	2026-02-24 00:31:52.593927	\N	\N	\N	\N
1070	98970247009	test etstes teste	produção	operador	cotoxel298@dolofan.com	$2a$10$AEVxNlSxdtezUpanDypGWetkUkROCQDUKoa7uctI3pTrSwo1qvlMe	funcionario	t	2026-02-25 18:22:35.720269	2026-02-25 18:34:24.218014	\N	\N	\N	operacional	10074	2026-02-25 18:34:26.444	concluida	\N	2026-02-25 18:34:24.218014	1999-02-20	1	2026-02-25 18:22:35.720269	2026-02-25 18:23:44.537852	79432901009	\N	\N
1071	03800369087	rona 02022002	uiouoiu	oiuoiuoi	uoiuoiu@uoi.con	$2a$10$NlfQ6mRouueeviQycxoHzOf7e8CLoGtQKxKWGCHLa3bdU7x6mWOTi	funcionario	t	2026-02-25 22:33:00.810219	2026-02-25 22:48:55.849674	\N	\N	\N	operacional	\N	\N	\N	\N	\N	2002-02-02	0	2026-02-25 22:33:00.810219	\N	\N	\N	\N
1063	18237959000	TEst 03032003	fafa	faaf	afsasf@fdfas.com	$2a$10$naMUDznKPId6mtch3o8t.u1gVrRy5hg01RTYsWPAWqqruss0ckzSu	funcionario	t	2026-02-18 11:06:58.760787	2026-02-18 11:08:27.153951	\N	\N	\N	operacional	10066	2026-02-18 08:08:36.588	concluida	\N	2026-02-18 11:08:27.153951	2004-04-04	4	2026-02-18 11:06:58.760787	\N	\N	\N	\N
1072	76572828000	Poslotes 01012001	uuoi	oiuoi	oiuoiuo@dff.com	$2a$10$YNJNaWnkmU2diwJvixo4v.zb8THrzqyUu3iqeBTxnnp4OSQc9MRe2	funcionario	t	2026-02-27 04:10:13.319242	2026-02-27 04:10:13.319242	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2001-01-01	0	2026-02-27 04:10:13.319242	\N	\N	\N	\N
1073	78639856095	Ana Silva 15031990	Administrativo	Analista	ana.silva@empresa-teste.local	$2a$10$GRXrb51sPN5Fh4k/jmRiceQPFnb.zN/B7XkRTuhyEe8QGL6MkT4Au	funcionario	t	2026-02-27 12:32:02.988964	2026-02-27 13:01:06.374884	\N	\N	\N	operacional	10077	2026-02-27 10:01:25.154	concluida	\N	2026-02-27 13:01:06.374884	1990-03-15	16	2026-02-27 12:32:02.988964	2026-02-27 12:32:53.46363	05248635047	\N	\N
1075	39034263002	Carla Oliveira 10111992	RH	Assistente	carla.oliveira@empresa-teste.local	$2a$10$Q6VlJhXPsvSG4ZVmIhl9o.07of9AFHwozXegnLu0VgVVyEoAebw..	funcionario	t	2026-02-27 12:32:02.988964	2026-02-27 13:11:25.534164	\N	\N	\N	operacional	10079	2026-02-27 13:11:25.534164	inativada	\N	\N	1992-11-10	0	2026-02-27 12:32:02.988964	\N	\N	\N	\N
1074	94617882073	Bruno Costa 22071958	Operacional	Técnico	bruno.costa@empresa-teste.local	$2a$10$pfLR3XfHUqEudXU0x6GqGO6XsM1vn/8g60F9qrB9MyQPGXTzqSEL6	funcionario	t	2026-02-27 12:32:02.988964	2026-02-27 13:11:54.487937	\N	\N	\N	gestao	10078	2026-02-27 10:12:13.218	concluida	\N	2026-02-27 13:11:54.487937	1985-07-22	16	2026-02-27 12:32:02.988964	\N	\N	\N	\N
1076	15419161079	Diego Santos 05091988	TI	Desenvolvedor	diego.santos@empresa-teste.local	$2a$10$b5oHK.Q8C9ySs4eZkTT1cet7oi2niSpqta1oY5XIbVbVnnCFym70O	funcionario	f	2026-02-27 13:22:57.738886	2026-02-27 13:22:57.738886	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1988-09-05	0	2026-02-27 13:22:57.738886	2026-02-27 13:23:37.864634	38908580077	\N	\N
1077	99977387052	Eliana Ferreira 30011995	Financeiro	Analista	eliana.ferreira@empresa-teste.local	$2a$10$F4d.EkZetNghDtnUFmV/9uqTDW62aa1x/GebckYgjxtZKazvdkXO6	funcionario	t	2026-02-27 13:22:57.738886	2026-02-27 13:24:37.393496	\N	\N	\N	operacional	10080	2026-02-27 10:24:56.167	concluida	\N	2026-02-27 13:24:37.393496	1995-01-30	1	2026-02-27 13:22:57.738886	\N	\N	\N	\N
1079	41119471079	Pedro 01012001	uiuoiu	oiuoiuoi	oiuuoiu@sdffs.com	$2a$10$9.e4uqoO6PfRYBexfq11k.iGYFRfKjMqzp7uT2dZ6K1bAMILvxxve	funcionario	t	2026-02-27 13:23:23.839568	2026-02-27 13:27:06.024845	\N	\N	\N	gestao	10082	2026-02-27 10:27:24.799	concluida	\N	2026-02-27 13:27:06.024845	2001-01-01	1	2026-02-27 13:23:23.839568	\N	\N	\N	\N
1078	45102493060	Felipe Almeida 18061983	Operacional	Supervisor	felipe.almeida@empresa-teste.local	$2a$10$TEK018x48O8vJvns1tj7W./645T8LhVyHy24S/ri3XbJzgNjVvzeK	funcionario	t	2026-02-27 13:22:57.738886	2026-02-27 13:27:27.358696	\N	\N	\N	gestao	10081	2026-02-27 13:27:27.358696	inativada	\N	\N	1983-06-18	0	2026-02-27 13:22:57.738886	\N	\N	\N	\N
1019	34624832000	Jaiminho uoiuoiu	Operacional	Coordenadora	rolnk2l@huhuhuj.com	$2a$10$CHQpPeUI6txa79xaELUOxO1bzvpmT4rneNeG3t1dBPZzk89E/FdBu	funcionario	t	2026-02-11 00:59:46.425929	2026-02-27 15:33:12.980456	\N	\N	\N	gestao	10072	2026-02-27 12:33:31.802	concluida	\N	2026-02-27 15:33:12.980456	2001-01-01	15	2026-02-11 00:59:46.425929	\N	\N	\N	\N
1082	09777228996	TESTE FAMIL	dsfdsfsdfsdfsdf	dffgadfg	sdfsdf@gmail.com	$2a$10$0X2lSIpIM7j5TeCbmA1H5e72Lh.gfMI1Dtx77DYY39DebTcBvVyqy	funcionario	t	2026-03-03 13:21:53.366924	2026-03-03 13:21:53.366924	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1999-02-20	0	2026-03-03 13:21:53.366924	\N	\N	\N	\N
1083	92544157070	Walter Silva	TI	Coordenador	walter.silva@empresa-teste.local	$2a$10$rK2HiGN95WTOszPiij4BOeQTe8gRkWoLXk.noXMu5mpp1riMEHr9a	funcionario	t	2026-03-03 14:10:22.340406	2026-03-03 14:37:42.792604	\N	\N	\N	operacional	10084	2026-03-03 11:38:10.54	concluida	\N	2026-03-03 14:37:42.792604	1981-09-10	18	2026-03-03 14:10:22.340406	\N	\N	\N	\N
1084	83171190095	Yolanda Pereira	Operacional	Operador	yolanda.pereira@empresa-teste.local	$2a$10$lyDdC5TsenDkvJfFs.AOseqWbpBf.WEbbFdT.i2dgQ1ghSX/fqsIK	funcionario	t	2026-03-03 14:10:22.340406	2026-03-03 14:38:20.886828	\N	\N	\N	operacional	10085	2026-03-03 14:38:20.886828	inativada	\N	\N	1993-12-28	0	2026-03-03 14:10:22.340406	\N	\N	\N	\N
1085	25212642027	Felipe Almeida 18061983	Operacional	Supervisor	felipe.almeida@empresa-teste.local	$2a$10$G4NGcKCN2CDO0j8E2vZl0OGtbdfpXb6jm9crPqcP8R7vofDd78vHm	funcionario	t	2026-03-08 01:13:57.234892	2026-03-08 01:13:57.234892	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1983-06-18	0	2026-03-08 01:13:57.234892	\N	\N	\N	\N
1086	35649372004	Gabriela Lima 25121991	Administrativo	Recepcionista	gabriela.lima@empresa-teste.local	$2a$10$wu8j0F/4E4jHolEgt84FdeT43ng1X5miF86NACOmO5t.K4nVxj456	funcionario	t	2026-03-08 01:13:57.234892	2026-03-08 01:13:57.234892	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1991-12-25	0	2026-03-08 01:13:57.234892	\N	\N	\N	\N
1088	75377605004	Lucas Martins 07041994	TI	Suporte	lucas.martins@empresa-teste.local	$2a$10$nE47u92rqYAuP.feXbiiOusqpJwsyiuPwo3UbPyjE7BasRFnWqVQ.	funcionario	t	2026-03-09 02:02:01.697892	2026-03-09 20:57:19.726435	\N	\N	\N	gestao	10086	2026-03-09 20:57:19.726435	inativada	\N	\N	1994-04-07	0	2026-03-09 02:02:01.697892	\N	\N	\N	\N
1089	11110827075	Mariana Costa 28061986	Atendimento	Gerente	mariana.costa@empresa-teste.local	$2a$10$PaysZcY.wk85eRno5CLrQelrYiLvprzKP4zjPEiEYL4Mr.o8jGrga	funcionario	t	2026-03-09 02:02:01.697892	2026-03-09 20:57:36.013224	\N	\N	\N	operacional	10087	2026-03-09 20:57:36.013224	inativada	\N	\N	1986-06-28	0	2026-03-09 02:02:01.697892	\N	\N	\N	\N
1090	19275874093	Nicolas Alves 19091991	Atendimento	Farmaceutico	nicolas.alves@empresa-teste.local	$2a$10$WAqqn1MCy5bOilZboiBynOh.757U0nSWyN.AoUDUT0I/l.XIEMnY.	funcionario	t	2026-03-09 02:02:01.697892	2026-03-09 20:57:54.996159	\N	\N	\N	gestao	10088	2026-03-09 20:57:54.996159	inativada	\N	\N	1991-09-19	0	2026-03-09 02:02:01.697892	\N	\N	\N	\N
1087	32586030060	Olivia Fernandes 01121984	Atendimento	Balconista	dfsfd@dsffds.com	$2a$10$m/DRkFshsPsBqOUh6qY3auRs.HUWjGLpXkhbxtg3ZFxjaX1BTryyO	funcionario	t	2026-03-09 02:01:06.381785	2026-03-09 20:58:12.609503	\N	\N	\N	operacional	10089	2026-03-09 20:58:12.609503	inativada	\N	\N	1984-12-01	0	2026-03-09 02:01:06.381785	\N	\N	\N	\N
1091	60478456069	Yasmin Araujo 08091995	TI	Estagiário	yasmin.araujo@empresa-teste.local	$2a$10$mzvsT5yZrqVlErhPTN7lK.f/PsqqvZH.9OFFG0AMXGhF4oHW6hj6u	funcionario	t	2026-03-09 21:03:11.410881	2026-03-09 21:03:11.410881	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1995-09-08	0	2026-03-09 21:03:11.410881	\N	\N	\N	\N
1092	08427814046	Zeca Barbosa 16121983	Operacional	Operador	zeca.barbosa@empresa-teste.local	$2a$10$NzvGSBG18hzaiL8Dq49Sye2kRmeVcnHTnzlKxOCWUAT4w402ZXTsy	funcionario	t	2026-03-09 21:03:11.410881	2026-03-09 21:03:11.410881	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1983-12-16	0	2026-03-09 21:03:11.410881	\N	\N	\N	\N
1093	17129287080	Hugo Mendes 14081987	TI	Analista de Sistemas	hugo.mendes@empresa-teste.local	$2a$10$zK9geg1dIAg8xaHSPlSJU./VsG83EVK9wm2TN2IBLraLx6VKYJ89W	funcionario	t	2026-03-09 22:39:06.167757	2026-03-09 22:39:06.167757	\N	\N	\N	gestao	\N	\N	\N	\N	\N	1987-08-14	0	2026-03-09 22:39:06.167757	\N	\N	\N	\N
1094	42212215002	Isabela Rocha 03051993	Marketing	Estagiário	isabela.rocha@empresa-teste.local	$2a$10$crEmq1NYkJDPs73LAfpJBeNlZHt6Hr61AM9kzKCtnSuCo8ZkEhxqC	funcionario	t	2026-03-09 22:39:06.167757	2026-03-09 22:39:06.167757	\N	\N	\N	operacional	\N	\N	\N	\N	\N	1993-05-03	0	2026-03-09 22:39:06.167757	\N	\N	\N	\N
1095	80943363071	Edna 02022002	RH	Gestora	dffsd@saffas.com	$2a$10$OqXbSFwlZqclhIfc5dJ8D.58IEpycbl6pHNIqd4Y1sQcegjZaG1L2	funcionario	t	2026-03-10 22:58:32.934556	2026-03-10 22:58:32.934556	\N	\N	\N	gestao	\N	\N	\N	\N	\N	2002-02-02	0	2026-03-10 22:58:32.934556	\N	\N	\N	\N
\.


--
-- Data for Name: confirmacao_identidade; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.confirmacao_identidade (id, avaliacao_id, funcionario_cpf, nome_confirmado, cpf_confirmado, data_nascimento, confirmado_em, ip_address, user_agent, criado_em) FROM stdin;
1	\N	42447121008	tewtew ewewwe	42447121008	2011-11-11	2026-02-12 19:56:31.277962+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 19:56:31.277962+00
2	\N	89487826068	tstes 05	89487826068	2011-11-11	2026-02-12 20:15:43.82169+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 20:15:43.82169+00
3	\N	73922219063	Jose do Emp02  online	73922219063	1974-10-24	2026-02-12 20:19:24.369175+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 20:19:24.369175+00
4	\N	49651696036	DIMore Itali	49651696036	2011-02-02	2026-02-12 21:10:12.639543+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 21:10:12.639543+00
5	\N	19778990050	Jaiemx o1	19778990050	2010-12-12	2026-02-12 21:12:07.567404+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 21:12:07.567404+00
6	\N	40473159074	Tse senha	40473159074	2001-01-01	2026-02-12 23:46:24.325466+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-12 23:46:24.325466+00
7	\N	05153743004	Entidade Final	05153743004	2003-03-03	2026-02-13 02:31:19.39245+00	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	2026-02-13 02:31:19.39245+00
8	\N	62745664069	Entidade masc	62745664069	2001-01-01	2026-02-13 02:40:57.602825+00	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	2026-02-13 02:40:57.602825+00
9	\N	68889393084	Clinica fem	68889393084	2002-02-02	2026-02-13 02:54:51.040645+00	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	2026-02-13 02:54:51.040645+00
10	\N	68889393084	Clinica fem	68889393084	2002-02-02	2026-02-13 02:56:03.05114+00	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	2026-02-13 02:56:03.05114+00
11	\N	68889393084	Clinica fem	68889393084	2002-02-02	2026-02-13 02:57:03.165989+00	177.146.166.16	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	2026-02-13 02:57:03.165989+00
12	\N	77093511074	teste clicnia	77093511074	2001-01-01	2026-02-13 12:52:53.496009+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-13 12:52:53.496009+00
13	\N	29371145048	Entidade fem	29371145048	2002-02-02	2026-02-16 14:24:10.11943+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-16 14:24:10.11943+00
14	\N	74984014016	Tste cpf correc	74984014016	2001-01-01	2026-02-16 16:10:10.733207+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-16 16:10:10.733207+00
15	\N	26064999055	Joao 02021999	26064999055	1999-02-02	2026-02-16 18:29:24.95796+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-16 18:29:24.95796+00
16	\N	60463729099	Entidade fem 02022002''	60463729099	2002-02-02	2026-02-17 00:21:06.383926+00	177.146.166.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-17 00:21:06.383926+00
17	\N	82773181034	Entidade fem 02022002''	82773181034	2002-02-02	2026-02-17 13:01:13.390117+00	177.146.164.76	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-17 13:01:13.390117+00
18	\N	38409635089	Entidade masc 01012001	38409635089	2001-01-01	2026-02-17 13:05:30.757811+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-17 13:05:30.757811+00
19	\N	28917134009	Clinia 03032003	28917134009	2003-03-03	2026-02-17 16:18:22.502971+00	177.146.164.76	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-17 16:18:22.502971+00
20	\N	59557041080	Entidade fem 02022002''	59557041080	2002-02-02	2026-02-17 16:19:21.792261+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-17 16:19:21.792261+00
21	\N	66844689004	reipo 04042004	66844689004	2004-04-04	2026-02-17 19:31:52.447489+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-17 19:31:52.447489+00
22	\N	88931335040	jpo 05052005	88931335040	2005-05-05	2026-02-17 19:34:46.754658+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-17 19:34:46.754658+00
23	\N	03757372000	Entidade masc 01012001	03757372000	2001-01-01	2026-02-18 02:20:16.297864+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-18 02:20:16.297864+00
24	\N	17503742003	Ale 05052005	17503742003	2005-05-05	2026-02-18 02:39:45.772433+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-18 02:39:45.772433+00
25	\N	90119869039	Peter 06062006	90119869039	2006-06-06	2026-02-18 03:05:04.007052+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-18 03:05:04.007052+00
26	\N	18237959000	TEst 09091999	18237959000	1999-09-09	2026-02-18 11:07:50.79628+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-18 11:07:50.79628+00
27	\N	34232299009	Entidade masc 01012001	34232299009	2001-01-01	2026-02-23 20:59:53.163015+00	201.159.185.249	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-23 20:59:53.163015+00
28	\N	35923473062	Entidade fem 02022002''	35923473062	2002-02-02	2026-02-23 23:09:47.144018+00	201.159.185.223	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-23 23:09:47.144018+00
29	\N	29054003073	teste 02022002	29054003073	2002-02-02	2026-02-23 23:12:09.083588+00	201.159.185.223	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-23 23:12:09.083588+00
30	\N	75415228055	teste 04042004	75415228055	2004-04-04	2026-02-24 00:33:22.533334+00	201.159.185.223	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-24 00:33:22.533334+00
31	\N	98970247009	test etstes teste	98970247009	1999-02-20	2026-02-25 18:30:00.673568+00	189.112.122.137	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:30:00.673568+00
32	\N	03800369087	rona 24101974	03800369087	1974-10-24	2026-02-25 22:33:29.93891+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-25 22:33:29.93891+00
33	\N	03800369087	rona 02022002	03800369087	2002-02-02	2026-02-25 22:49:31.2319+00	177.146.164.76	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0	2026-02-25 22:49:31.2319+00
34	\N	18237959000	TEst 03032003	18237959000	2003-03-03	2026-02-26 10:24:04.190438+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-26 10:24:04.190438+00
35	\N	18237959000	TEst 03032003	18237959000	2004-04-04	2026-02-26 17:37:57.043819+00	177.173.219.246	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-26 17:37:57.043819+00
36	\N	29371145048	Entidade fem	29371145048	2002-02-02	2026-02-27 05:45:22.54697+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 05:45:22.54697+00
37	\N	78639856095	Ana Silva 15031990	78639856095	1990-03-15	2026-02-27 13:00:25.523341+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 13:00:25.523341+00
38	\N	94617882073	Bruno Costa 22071958	94617882073	1985-07-22	2026-02-27 13:11:26.375059+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 13:11:26.375059+00
39	\N	99977387052	Eliana Ferreira 30011995	99977387052	1995-01-30	2026-02-27 13:24:05.198827+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 13:24:05.198827+00
40	\N	41119471079	Pedro 01012001	41119471079	2001-01-01	2026-02-27 13:26:14.123634+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 13:26:14.123634+00
41	\N	34624832000	Jaiminho uoiuoiu	34624832000	2001-01-01	2026-02-27 15:14:23.41185+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 15:14:23.41185+00
42	\N	34624832000	Jaiminho uoiuoiu	34624832000	2001-01-01	2026-02-27 15:19:21.106521+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-02-27 15:19:21.106521+00
43	\N	92544157070	Walter Silva	92544157070	1981-09-10	2026-03-03 14:36:55.939403+00	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-03-03 14:36:55.939403+00
44	\N	75377605004	Lucas Martins 07041994	75377605004	1994-04-07	2026-03-09 02:02:59.32187+00	152.250.78.77	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-03-09 02:02:59.32187+00
45	\N	11110827075	Mariana Costa 28061986	11110827075	1986-06-28	2026-03-09 02:04:46.998434+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-03-09 02:04:46.998434+00
46	\N	32586030060	Olivia Fernandes 01121984	32586030060	1984-12-01	2026-03-09 02:11:18.099559+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0	2026-03-09 02:11:18.099559+00
47	\N	75377605004	Lucas Martins 07041994	75377605004	1994-04-07	2026-03-09 21:15:00.808536+00	152.250.78.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-09 21:15:00.808536+00
\.


--
-- Data for Name: contratos_planos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contratos_planos (id, plano_id, clinica_id, valor_personalizado_por_funcionario, inicio_vigencia, fim_vigencia, ativo, created_at, updated_at, valor_pago, tipo_pagamento, modalidade_pagamento, data_pagamento, parcelas_json, entidade_id) FROM stdin;
\.


--
-- Data for Name: emissao_queue; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.emissao_queue (id, lote_id, tentativas, ultimo_erro, proxima_execucao, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: fila_emissao; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fila_emissao (id, lote_id, tentativas, max_tentativas, proxima_tentativa, erro, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: fk_migration_audit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.fk_migration_audit (id, tabela, coluna_origem, tipo_migracao, registros_afetados, status, detalhes, erro, iniciado_em, concluido_em, criado_em) FROM stdin;
\.


--
-- Data for Name: funcionarios_clinicas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios_clinicas (id, funcionario_id, empresa_id, ativo, data_vinculo, data_desvinculo, clinica_id) FROM stdin;
1	1014	5	t	2026-02-10 10:29:30.334004	\N	104
2	1015	5	t	2026-02-10 10:29:30.334004	\N	104
3	1022	6	t	2026-02-11 01:52:46.462014	\N	107
4	1023	6	t	2026-02-11 01:52:46.462014	\N	107
5	1028	8	t	2026-02-12 19:02:42.320733	\N	109
6	1029	8	t	2026-02-12 19:03:11.085611	\N	109
7	1030	8	t	2026-02-12 19:03:11.085611	\N	109
8	1035	9	t	2026-02-13 02:52:24.570994	\N	111
9	1036	9	t	2026-02-13 02:52:24.570994	\N	111
10	1037	9	t	2026-02-13 02:52:56.066561	\N	111
11	1038	5	t	2026-02-13 12:50:37.130818	\N	104
12	1039	5	t	2026-02-16 14:21:52.758386	\N	104
13	1040	5	t	2026-02-16 14:21:52.758386	\N	104
14	1041	10	t	2026-02-16 14:33:39.207958	\N	112
15	1042	10	t	2026-02-16 14:33:39.207958	\N	112
16	1044	10	t	2026-02-16 14:37:45.859881	\N	112
17	1045	10	t	2026-02-16 14:53:35.202602	\N	112
18	1046	10	t	2026-02-16 15:05:09.770462	\N	112
19	1047	10	t	2026-02-16 15:53:09.625096	\N	112
20	1048	11	t	2026-02-16 17:45:09.441807	\N	112
21	1049	12	t	2026-02-16 18:27:53.784931	\N	113
22	1050	12	t	2026-02-16 19:31:58.673459	\N	113
23	1056	13	t	2026-02-17 16:16:53.971443	\N	115
24	1057	13	t	2026-02-17 16:17:09.123499	\N	115
25	1058	13	t	2026-02-17 16:17:09.123499	\N	115
26	1059	14	t	2026-02-17 19:31:06.18026	\N	104
27	1061	14	t	2026-02-18 02:38:51.457532	\N	104
28	1062	14	t	2026-02-18 03:04:14.824525	\N	104
29	1063	14	t	2026-02-18 11:06:59.005189	\N	104
30	1066	15	t	2026-02-23 23:07:07.097429	\N	118
31	1067	15	t	2026-02-23 23:07:07.097429	\N	118
32	1068	15	t	2026-02-23 23:08:21.88378	\N	118
33	1070	17	t	2026-02-25 18:22:36.592525	\N	120
34	1072	14	t	2026-02-27 04:10:13.427839	\N	104
35	1076	18	t	2026-02-27 13:22:57.738886	\N	123
36	1077	18	t	2026-02-27 13:22:57.738886	\N	123
37	1078	18	t	2026-02-27 13:22:57.738886	\N	123
38	1079	18	t	2026-02-27 13:23:23.914126	\N	123
39	1085	19	t	2026-03-08 01:13:57.234892	\N	128
40	1086	19	t	2026-03-08 01:13:57.234892	\N	128
41	1087	20	t	2026-03-09 02:01:07.291613	\N	129
42	1088	20	t	2026-03-09 02:02:01.697892	\N	129
43	1089	20	t	2026-03-09 02:02:01.697892	\N	129
44	1090	20	t	2026-03-09 02:02:01.697892	\N	129
45	1091	20	t	2026-03-09 21:03:11.410881	\N	129
46	1092	20	t	2026-03-09 21:03:11.410881	\N	129
47	1093	5	t	2026-03-09 22:39:06.167757	\N	104
48	1094	5	t	2026-03-09 22:39:06.167757	\N	104
49	1095	5	t	2026-03-10 22:58:33.788512	\N	104
\.


--
-- Data for Name: funcionarios_entidades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.funcionarios_entidades (id, funcionario_id, entidade_id, ativo, data_vinculo, data_desvinculo) FROM stdin;
1	1008	100	t	2026-02-10 03:34:31.346394	\N
2	1009	100	t	2026-02-10 03:34:31.346394	\N
3	1016	105	t	2026-02-10 12:33:30.10471	\N
4	1017	105	t	2026-02-10 12:33:30.10471	\N
5	1018	100	t	2026-02-11 00:59:46.425929	\N
6	1019	100	t	2026-02-11 00:59:46.425929	\N
7	1020	106	t	2026-02-11 01:04:34.424847	\N
8	1021	106	t	2026-02-11 01:04:34.424847	\N
9	1031	100	t	2026-02-12 22:05:45.799126	\N
10	1032	110	t	2026-02-13 02:28:36.182785	\N
11	1033	110	t	2026-02-13 02:28:36.182785	\N
12	1034	110	t	2026-02-13 02:29:14.005258	\N
13	1051	100	t	2026-02-17 00:03:01.059106	\N
14	1052	100	t	2026-02-17 00:03:01.059106	\N
15	1053	114	t	2026-02-17 12:59:35.284556	\N
16	1054	114	t	2026-02-17 12:59:35.284556	\N
17	1055	114	t	2026-02-17 13:00:02.853299	\N
18	1060	100	t	2026-02-17 19:34:03.356958	\N
19	1064	117	t	2026-02-23 20:51:55.832321	\N
20	1065	117	t	2026-02-23 20:51:55.832321	\N
21	1069	100	t	2026-02-24 00:31:53.661362	\N
22	1071	100	t	2026-02-25 22:33:01.882969	\N
23	1073	121	t	2026-02-27 12:32:02.988964	\N
24	1074	121	t	2026-02-27 12:32:02.988964	\N
25	1075	121	t	2026-02-27 12:32:02.988964	\N
26	1082	125	t	2026-03-03 13:21:54.4243	\N
27	1083	127	t	2026-03-03 14:10:22.340406	\N
28	1084	127	t	2026-03-03 14:10:22.340406	\N
\.


--
-- Data for Name: laudo_arquivos_remotos; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_arquivos_remotos (id, laudo_id, provider, bucket, key, url, checksum, size_bytes, tipo, criado_por, criado_em) FROM stdin;
\.


--
-- Data for Name: laudo_downloads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_downloads (id, laudo_id, arquivo_remoto_id, usuario_cpf, ip, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: laudo_generation_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.laudo_generation_jobs (id, lote_id, laudo_id, status, attempts, max_attempts, last_error, payload, created_at, updated_at, processed_at, finished_at) FROM stdin;
\.


--
-- Data for Name: logs_admin; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.logs_admin (id, admin_cpf, acao, entidade_tipo, entidade_id, detalhes, ip_origem, criado_em) FROM stdin;
\.


--
-- Data for Name: lote_id_allocator; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lote_id_allocator (last_id) FROM stdin;
1044
\.


--
-- Data for Name: mfa_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mfa_codes (id, cpf, code, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: migration_guidelines; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.migration_guidelines (id, category, guideline, example, created_at) FROM stdin;
1	RLS_POLICY	Always match policy name with table name	-- WRONG:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON funcionarios;\n\n-- CORRECT:\nDROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;	2026-02-09 20:16:44.890059
2	RLS_POLICY	Use safe_drop_policy() function in migrations	-- SAFE (validates before dropping):\nSELECT safe_drop_policy('avaliacoes_own_select', 'avaliacoes');\n\n-- This will fail if policy name does not match table:\nSELECT safe_drop_policy('avaliacoes_own_select', 'funcionarios');\n-- ERROR: Policy name does not match table	2026-02-09 20:16:44.890059
3	RLS_POLICY	Policy naming convention: <table>_<perfil>_<action>	avaliacoes_own_select    -- funcionario SELECT on avaliacoes\navaliacoes_rh_clinica    -- RH SELECT on avaliacoes\nlotes_emissor_select     -- emissor SELECT on lotes_avaliacao\nempresas_block_admin     -- RESTRICTIVE blocking admin	2026-02-09 20:16:44.890059
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes (id, tipo, prioridade, destinatario_cpf, destinatario_tipo, titulo, mensagem, dados_contexto, link_acao, botao_texto, lida, data_leitura, arquivada, contratacao_personalizada_id, criado_em, expira_em, resolvida, data_resolucao, resolvido_por_cpf, clinica_id, data_evento, tomador_tipo) FROM stdin;
1	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1005. Aguarde o link de pagamento.	{"lote_id": 1005}	\N	\N	f	\N	f	\N	2026-02-10 17:22:33.287457	\N	f	\N	\N	\N	\N	\N
2	emissao_solicitada_sucesso	media	29930511059	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1007. Aguarde o link de pagamento.	{"lote_id": 1007}	\N	\N	f	\N	f	\N	2026-02-10 19:51:00.173562	\N	f	\N	\N	\N	\N	\N
3	emissao_solicitada_sucesso	media	35051737030	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1008. Aguarde o link de pagamento.	{"lote_id": 1008}	\N	\N	f	\N	f	\N	2026-02-11 01:15:06.109694	\N	f	\N	\N	\N	\N	\N
4	emissao_solicitada_sucesso	media	64411953056	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1009. Aguarde o link de pagamento.	{"lote_id": 1009}	\N	\N	f	\N	f	\N	2026-02-11 02:02:13.099044	\N	f	\N	\N	\N	\N	\N
5	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1010. Aguarde o link de pagamento.	{"lote_id": 1010}	\N	\N	f	\N	f	\N	2026-02-12 12:32:18.367231	\N	f	\N	\N	\N	\N	\N
6	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1018. Aguarde o link de pagamento.	{"lote_id": 1018}	\N	\N	f	\N	f	\N	2026-02-17 00:23:28.222303	\N	f	\N	\N	\N	\N	\N
7	emissao_solicitada_sucesso	media	48538520008	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1026. Aguarde o link de pagamento.	{"lote_id": 1026}	\N	\N	f	\N	f	\N	2026-02-17 13:09:14.535211	\N	f	\N	\N	\N	\N	\N
8	emissao_solicitada_sucesso	media	31777317053	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1027. Aguarde o link de pagamento.	{"lote_id": 1027}	\N	\N	f	\N	f	\N	2026-02-17 16:27:58.036474	\N	f	\N	\N	\N	\N	\N
9	emissao_solicitada_sucesso	media	29930511059	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1029. Aguarde o link de pagamento.	{"lote_id": 1029}	\N	\N	f	\N	f	\N	2026-02-17 21:35:14.838208	\N	f	\N	\N	\N	\N	\N
10	emissao_solicitada_sucesso	media	29930511059	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1025. Aguarde o link de pagamento.	{"lote_id": 1025}	\N	\N	f	\N	f	\N	2026-02-17 23:59:37.428059	\N	f	\N	\N	\N	\N	\N
11	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1019. Aguarde o link de pagamento.	{"lote_id": 1019}	\N	\N	f	\N	f	\N	2026-02-18 01:27:36.591513	\N	f	\N	\N	\N	\N	\N
12	emissao_solicitada_sucesso	media	29930511059	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1030. Aguarde o link de pagamento.	{"lote_id": 1030}	\N	\N	f	\N	f	\N	2026-02-18 02:21:21.221813	\N	f	\N	\N	\N	\N	\N
13	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1031. Aguarde o link de pagamento.	{"lote_id": 1031}	\N	\N	f	\N	f	\N	2026-02-18 02:40:40.065771	\N	f	\N	\N	\N	\N	\N
14	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1032. Aguarde o link de pagamento.	{"lote_id": 1032}	\N	\N	f	\N	f	\N	2026-02-18 03:05:53.947524	\N	f	\N	\N	\N	\N	\N
15	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1033. Aguarde o link de pagamento.	{"lote_id": 1033}	\N	\N	f	\N	f	\N	2026-02-18 11:08:59.166885	\N	f	\N	\N	\N	\N	\N
16	emissao_solicitada_sucesso	media	04703084945	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1028. Aguarde o link de pagamento.	{"lote_id": 1028}	\N	\N	f	\N	f	\N	2026-02-20 00:08:49.131665	\N	f	\N	\N	\N	\N	\N
17	emissao_solicitada_sucesso	media	16911251052	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1034. Aguarde o link de pagamento.	{"lote_id": 1034}	\N	\N	f	\N	f	\N	2026-02-23 21:23:57.211307	\N	f	\N	\N	\N	\N	\N
18	emissao_solicitada_sucesso	media	99328531004	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1035. Aguarde o link de pagamento.	{"lote_id": 1035}	\N	\N	f	\N	f	\N	2026-02-23 23:16:38.343661	\N	f	\N	\N	\N	\N	\N
19	emissao_solicitada_sucesso	media	79432901009	funcionario	Solicitação de emissão enviada	Solicitação enviada para lote #1037. Aguarde o link de pagamento.	{"lote_id": 1037}	\N	\N	f	\N	f	\N	2026-02-25 18:39:25.915139	\N	f	\N	\N	\N	\N	\N
20	emissao_solicitada_sucesso	media	05248635047	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1039. Aguarde o link de pagamento.	{"lote_id": 1039}	\N	\N	f	\N	f	\N	2026-02-27 13:12:16.205921	\N	f	\N	\N	\N	\N	\N
21	emissao_solicitada_sucesso	media	91510815040	gestor	Solicitação de emissão enviada	Solicitação enviada para lote #1042. Aguarde o link de pagamento.	{"lote_id": 1042}	\N	\N	f	\N	f	\N	2026-03-03 14:38:37.116556	\N	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: notificacoes_admin; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_admin (id, tipo, mensagem, lote_id, visualizada, criado_em, titulo, contrato_id, pagamento_id, dados_contexto, lida, resolvida, data_leitura, data_resolucao, resolvido_por_cpf, observacoes_resolucao, atualizado_em, entidade_id, clinica_id) FROM stdin;
\.


--
-- Data for Name: notificacoes_traducoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notificacoes_traducoes (id, chave_traducao, idioma, conteudo, categoria, criado_em, atualizado_em) FROM stdin;
1	pre_cadastro_criado_titulo	pt_BR	Novo Pre-Cadastro: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
2	pre_cadastro_criado_mensagem	pt_BR	Um novo pre-cadastro de plano personalizado foi criado e aguarda definicao de valor. Funcionarios estimados: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
3	pre_cadastro_criado_botao	pt_BR	Definir Valor	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
4	pre_cadastro_criado_titulo	en_US	New Pre-Registration: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
5	pre_cadastro_criado_mensagem	en_US	A new personalized plan pre-registration has been created and awaits value definition. Estimated employees: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
6	pre_cadastro_criado_botao	en_US	Set Value	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
7	pre_cadastro_criado_titulo	es_ES	Nuevo Pre-Registro: {{contratante_nome}}	titulo	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
8	pre_cadastro_criado_mensagem	es_ES	Se ha creado un nuevo pre-registro de plan personalizado y espera definicion de valor. Empleados estimados: {{numero_funcionarios}}.	mensagem	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
9	pre_cadastro_criado_botao	es_ES	Definir Valor	botao	2026-02-09 20:16:02.493289	2026-02-09 20:16:02.493289
\.


--
-- Data for Name: payment_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payment_links (id, token, contrato_id, criado_por_cpf, usado, usado_em, expiracao, criado_em) FROM stdin;
\.


--
-- Data for Name: pdf_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pdf_jobs (id, recibo_id, status, attempts, max_attempts, error_message, created_at, updated_at, processed_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, resource, action, description, created_at) FROM stdin;
1	manage:rh	rh	manage	Gerenciar cadastro de usuários RH	2026-02-09 20:16:00.131613
2	manage:clinicas	clinicas	manage	Gerenciar cadastro de clínicas	2026-02-09 20:16:00.131613
3	manage:admins	admins	manage	Gerenciar cadastro de outros administradores	2026-02-09 20:16:00.131613
\.


--
-- Data for Name: policy_expression_backups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.policy_expression_backups (id, schema_name, table_name, policy_name, using_expr, with_check_expr, created_at) FROM stdin;
\.


--
-- Data for Name: questao_condicoes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.questao_condicoes (id, questao_id, questao_dependente, operador, valor_condicao, categoria, ativo, created_at) FROM stdin;
\.


--
-- Data for Name: relatorio_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.relatorio_templates (id, nome, tipo, descricao, campos_incluidos, filtros_padrao, formato_saida, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: respostas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.respostas (id, avaliacao_id, grupo, item, valor, criado_em, questao) FROM stdin;
1240	10078	1	Q1	50	2026-02-27 13:11:35.935993	1
1241	10078	1	Q2	50	2026-02-27 13:11:36.3046	2
1242	10078	1	Q3	75	2026-02-27 13:11:36.671819	3
1243	10078	1	Q9	75	2026-02-27 13:11:37.060816	9
1244	10078	2	Q13	75	2026-02-27 13:11:37.543363	13
1245	10078	2	Q17	100	2026-02-27 13:11:38.135411	17
1246	10078	2	Q18	100	2026-02-27 13:11:38.621206	18
1247	10078	2	Q19	75	2026-02-27 13:11:39.196626	19
1248	10078	3	Q20	75	2026-02-27 13:11:39.683771	20
1249	10078	3	Q21	50	2026-02-27 13:11:40.164226	21
1250	10078	3	Q23	50	2026-02-27 13:11:40.530454	23
1251	10078	3	Q25	25	2026-02-27 13:11:41.151672	25
1252	10078	3	Q26	25	2026-02-27 13:11:41.50552	26
1253	10078	3	Q28	0	2026-02-27 13:11:42.052243	28
1254	10078	4	Q31	0	2026-02-27 13:11:42.566464	31
1255	10078	4	Q32	50	2026-02-27 13:11:43.15112	32
1256	10078	4	Q33	50	2026-02-27 13:11:43.618892	33
1257	10078	4	Q34	75	2026-02-27 13:11:44.088565	34
1258	10078	5	Q35	75	2026-02-27 13:11:44.568204	35
1259	10078	5	Q38	100	2026-02-27 13:11:45.065967	38
1260	10078	5	Q41	100	2026-02-27 13:11:45.429432	41
1261	10078	6	Q43	100	2026-02-27 13:11:45.796429	43
1262	10078	6	Q45	75	2026-02-27 13:11:46.235975	45
1263	10078	7	Q48	50	2026-02-27 13:11:46.839314	48
1264	10078	7	Q52	50	2026-02-27 13:11:47.196026	52
1265	10078	7	Q55	25	2026-02-27 13:11:47.737153	55
1266	10078	8	Q56	25	2026-02-27 13:11:48.098221	56
1267	10078	8	Q57	50	2026-02-27 13:11:48.597519	57
1268	10078	8	Q58	75	2026-02-27 13:11:49.23503	58
1269	10078	9	Q59	75	2026-02-27 13:11:49.739335	59
1270	10078	9	Q61	100	2026-02-27 13:11:50.180883	61
1271	10078	9	Q62	100	2026-02-27 13:11:50.526939	62
1272	10078	9	Q64	75	2026-02-27 13:11:50.923438	64
1273	10078	10	Q65	75	2026-02-27 13:11:51.311	65
1274	10078	10	Q66	100	2026-02-27 13:11:51.933054	66
1275	10078	10	Q68	75	2026-02-27 13:11:53.224927	68
38	10005	1	Q1	50	2026-02-10 13:59:33.074922	1
39	10005	1	Q2	75	2026-02-10 13:59:37.227878	2
40	10005	1	Q3	75	2026-02-10 13:59:44.455314	3
41	10005	1	Q9	75	2026-02-10 13:59:51.147307	9
42	10005	2	Q13	75	2026-02-10 13:59:54.087948	13
43	10005	2	Q17	100	2026-02-10 13:59:57.212524	17
44	10005	2	Q18	75	2026-02-10 14:00:02.669088	18
45	10005	2	Q19	75	2026-02-10 14:00:05.918539	19
46	10005	3	Q20	25	2026-02-10 14:00:09.663329	20
47	10005	3	Q21	75	2026-02-10 14:00:14.160337	21
48	10005	3	Q23	75	2026-02-10 14:00:17.91649	23
49	10005	3	Q25	50	2026-02-10 14:00:21.06307	25
50	10005	3	Q26	100	2026-02-10 14:00:24.155451	26
51	10005	3	Q28	25	2026-02-10 14:00:27.660011	28
52	10005	4	Q31	0	2026-02-10 14:00:31.61412	31
53	10005	4	Q32	0	2026-02-10 14:00:34.448679	32
54	10005	4	Q33	25	2026-02-10 14:01:16.559797	33
55	10005	4	Q34	50	2026-02-10 14:01:21.556927	34
56	10005	5	Q35	50	2026-02-10 14:01:25.999272	35
57	10005	5	Q38	50	2026-02-10 14:01:33.075611	38
58	10005	5	Q41	50	2026-02-10 14:01:59.285944	41
59	10005	6	Q43	50	2026-02-10 14:02:03.193399	43
60	10005	6	Q45	50	2026-02-10 14:02:06.823225	45
61	10005	7	Q48	50	2026-02-10 14:02:10.006696	48
62	10005	7	Q52	50	2026-02-10 14:02:27.016982	52
63	10005	7	Q55	50	2026-02-10 14:02:30.373196	55
64	10005	8	Q56	50	2026-02-10 14:02:38.304935	56
65	10005	8	Q57	50	2026-02-10 14:02:41.710134	57
66	10005	8	Q58	50	2026-02-10 14:02:44.891071	58
67	10005	9	Q59	25	2026-02-10 14:03:01.883215	59
68	10005	9	Q61	0	2026-02-10 14:03:05.312177	61
69	10005	9	Q62	0	2026-02-10 14:03:09.984875	62
70	10005	9	Q64	0	2026-02-10 14:03:13.438805	64
71	10005	10	Q65	25	2026-02-10 14:03:30.041919	65
72	10005	10	Q66	75	2026-02-10 14:03:33.580706	66
73	10005	10	Q68	75	2026-02-10 14:03:36.651537	68
74	10005	10	Q70	50	2026-02-10 14:05:43.735929	70
76	10010	1	Q1	50	2026-02-10 15:56:20.480361	1
77	10010	1	Q2	100	2026-02-10 15:56:25.683132	2
78	10010	1	Q3	75	2026-02-10 15:56:29.595141	3
79	10010	1	Q9	75	2026-02-10 15:56:36.08997	9
81	10010	2	Q17	100	2026-02-10 15:56:49.474841	17
82	10010	2	Q18	100	2026-02-10 15:56:55.394664	18
83	10010	2	Q19	75	2026-02-10 15:57:02.504177	19
84	10010	3	Q20	75	2026-02-10 15:57:05.938749	20
85	10010	3	Q21	75	2026-02-10 15:57:12.007244	21
86	10010	3	Q23	75	2026-02-10 15:57:15.81719	23
87	10010	3	Q25	50	2026-02-10 15:57:18.800396	25
88	10010	3	Q26	25	2026-02-10 15:57:26.572553	26
89	10010	3	Q28	75	2026-02-10 15:57:31.048682	28
90	10010	4	Q31	100	2026-02-10 15:57:35.232166	31
91	10010	4	Q32	75	2026-02-10 15:57:38.973934	32
92	10010	4	Q33	50	2026-02-10 15:57:42.445803	33
93	10010	4	Q34	75	2026-02-10 15:57:45.840461	34
94	10010	5	Q35	100	2026-02-10 15:57:49.227015	35
95	10010	5	Q38	75	2026-02-10 15:57:52.620364	38
96	10010	5	Q41	50	2026-02-10 15:57:56.17581	41
97	10010	6	Q43	50	2026-02-10 15:58:01.888002	43
98	10010	6	Q45	100	2026-02-10 15:58:07.612734	45
99	10010	7	Q48	100	2026-02-10 15:58:13.113112	48
100	10010	7	Q52	75	2026-02-10 15:58:17.297903	52
101	10010	7	Q55	100	2026-02-10 15:58:21.693878	55
102	10010	8	Q56	50	2026-02-10 15:58:25.843917	56
103	10010	8	Q57	50	2026-02-10 15:58:28.934621	57
104	10010	8	Q58	50	2026-02-10 15:58:32.049878	58
105	10010	9	Q59	75	2026-02-10 15:58:36.845101	59
106	10010	9	Q61	75	2026-02-10 15:58:41.286532	61
107	10010	9	Q62	75	2026-02-10 15:58:45.032785	62
108	10010	9	Q64	75	2026-02-10 15:58:47.964875	64
109	10010	10	Q65	75	2026-02-10 15:58:51.881687	65
110	10010	10	Q66	75	2026-02-10 15:58:55.621073	66
111	10010	10	Q68	100	2026-02-10 15:59:00.204789	68
112	10010	10	Q70	75	2026-02-10 15:59:05.184533	70
80	10010	2	Q13	75	2026-02-10 16:07:53.988231	13
114	10011	1	Q1	75	2026-02-10 16:09:11.472944	1
115	10011	1	Q2	75	2026-02-10 16:09:16.79585	2
116	10011	1	Q3	75	2026-02-10 16:09:22.572503	3
117	10011	1	Q9	75	2026-02-10 16:09:26.606898	9
118	10011	2	Q13	25	2026-02-10 16:09:45.493072	13
119	10011	2	Q17	25	2026-02-10 16:09:52.340917	17
120	10011	2	Q18	25	2026-02-10 16:09:58.855393	18
121	10011	2	Q19	25	2026-02-10 16:10:02.700107	19
122	10011	3	Q20	25	2026-02-10 16:10:06.392966	20
123	10011	3	Q21	50	2026-02-10 16:10:14.51995	21
124	10011	3	Q23	25	2026-02-10 16:10:33.984992	23
125	10011	3	Q25	25	2026-02-10 16:10:39.516106	25
126	10011	3	Q26	25	2026-02-10 16:10:44.295938	26
127	10011	3	Q28	50	2026-02-10 16:11:12.603774	28
128	10011	4	Q31	50	2026-02-10 16:11:17.274968	31
129	10011	4	Q32	25	2026-02-10 16:11:39.640024	32
130	10011	4	Q33	50	2026-02-10 16:11:50.419815	33
131	10011	4	Q34	50	2026-02-10 16:11:58.774659	34
132	10011	5	Q35	50	2026-02-10 16:12:02.924736	35
133	10011	5	Q38	50	2026-02-10 16:12:09.65613	38
134	10011	5	Q41	50	2026-02-10 16:12:30.649373	41
135	10011	6	Q43	50	2026-02-10 16:12:36.494594	43
136	10011	6	Q45	50	2026-02-10 16:12:42.295584	45
137	10011	7	Q48	50	2026-02-10 16:12:50.99884	48
138	10011	7	Q52	50	2026-02-10 16:12:55.826776	52
139	10011	7	Q55	25	2026-02-10 16:13:28.25	55
140	10011	8	Q56	25	2026-02-10 16:13:33.323843	56
141	10011	8	Q57	50	2026-02-10 16:13:40.672495	57
142	10011	8	Q58	50	2026-02-10 16:14:19.185915	58
143	10011	9	Q59	50	2026-02-10 16:14:23.819227	59
144	10011	9	Q61	50	2026-02-10 16:14:30.469186	61
145	10011	9	Q62	50	2026-02-10 16:14:36.211701	62
146	10011	9	Q64	50	2026-02-10 16:14:39.813095	64
147	10011	10	Q65	50	2026-02-10 16:17:13.797576	65
148	10011	10	Q66	75	2026-02-10 16:17:17.973119	66
149	10011	10	Q68	50	2026-02-10 16:17:22.898575	68
150	10011	10	Q70	75	2026-02-10 16:29:31.825739	70
152	10006	1	Q1	50	2026-02-10 16:31:26.135309	1
153	10006	1	Q2	75	2026-02-10 16:31:31.139792	2
154	10006	1	Q3	75	2026-02-10 16:31:35.500706	3
155	10006	1	Q9	50	2026-02-10 16:31:49.121508	9
156	10006	2	Q13	75	2026-02-10 16:31:52.851357	13
157	10006	2	Q17	75	2026-02-10 16:31:58.211086	17
158	10006	2	Q18	75	2026-02-10 16:32:02.356868	18
159	10006	2	Q19	50	2026-02-10 16:33:31.93558	19
160	10006	3	Q20	50	2026-02-10 16:33:55.048006	20
161	10006	3	Q21	50	2026-02-10 16:33:59.541398	21
162	10006	3	Q23	50	2026-02-10 16:34:07.790169	23
163	10006	3	Q25	50	2026-02-10 16:34:24.206618	25
164	10006	3	Q26	50	2026-02-10 16:34:38.379734	26
165	10006	3	Q28	0	2026-02-10 16:35:10.534291	28
166	10006	4	Q31	0	2026-02-10 16:35:15.640904	31
167	10006	4	Q32	0	2026-02-10 16:35:26.159933	32
168	10006	4	Q33	0	2026-02-10 16:35:32.084246	33
169	10006	4	Q34	0	2026-02-10 16:35:41.595259	34
170	10006	5	Q35	50	2026-02-10 16:36:18.445811	35
171	10006	5	Q38	50	2026-02-10 16:36:24.837684	38
172	10006	5	Q41	25	2026-02-10 16:36:35.450928	41
173	10006	6	Q43	25	2026-02-10 16:36:40.61554	43
174	10006	6	Q45	25	2026-02-10 16:36:46.240787	45
175	10006	7	Q48	25	2026-02-10 16:37:08.30334	48
176	10006	7	Q52	25	2026-02-10 16:37:12.502367	52
177	10006	7	Q55	25	2026-02-10 16:37:19.206265	55
178	10006	8	Q56	25	2026-02-10 16:37:24.150145	56
179	10006	8	Q57	25	2026-02-10 16:37:27.638514	57
180	10006	8	Q58	25	2026-02-10 16:37:32.954094	58
181	10006	9	Q59	25	2026-02-10 16:37:36.70875	59
182	10006	9	Q61	25	2026-02-10 16:37:59.591722	61
183	10006	9	Q62	50	2026-02-10 16:38:04.084354	62
184	10006	9	Q64	0	2026-02-10 16:38:47.144493	64
185	10006	10	Q65	25	2026-02-10 16:38:51.390467	65
186	10006	10	Q66	25	2026-02-10 16:38:56.935974	66
187	10006	10	Q68	25	2026-02-10 16:39:02.965874	68
188	10006	10	Q70	25	2026-02-10 16:39:08.222252	70
189	10007	1	Q1	25	2026-02-10 16:40:31.595478	1
190	10007	1	Q2	25	2026-02-10 16:40:35.857867	2
191	10007	1	Q3	25	2026-02-10 16:41:42.066713	3
192	10007	1	Q9	50	2026-02-10 16:41:46.329433	9
193	10007	2	Q13	50	2026-02-10 16:41:57.348558	13
194	10007	2	Q17	50	2026-02-10 16:42:04.659846	17
195	10007	2	Q18	50	2026-02-10 16:42:10.604031	18
196	10007	2	Q19	50	2026-02-10 16:42:20.340466	19
197	10007	3	Q20	75	2026-02-10 16:42:31.416947	20
198	10007	3	Q21	75	2026-02-10 16:47:23.448181	21
199	10007	3	Q23	25	2026-02-10 16:47:27.388212	23
200	10007	3	Q25	50	2026-02-10 16:47:34.64335	25
201	10007	3	Q26	50	2026-02-10 16:47:46.470273	26
202	10007	3	Q28	50	2026-02-10 16:48:07.0429	28
203	10007	4	Q31	50	2026-02-10 16:48:12.209767	31
204	10007	4	Q32	50	2026-02-10 16:48:16.13863	32
205	10007	4	Q33	50	2026-02-10 16:48:20.537639	33
206	10007	4	Q34	25	2026-02-10 16:48:32.110013	34
207	10007	5	Q35	25	2026-02-10 16:49:28.695268	35
208	10007	5	Q38	50	2026-02-10 16:49:33.698846	38
209	10007	5	Q41	50	2026-02-10 16:49:37.871391	41
210	10007	6	Q43	25	2026-02-10 16:50:36.820946	43
211	10007	6	Q45	25	2026-02-10 16:50:40.871629	45
212	10007	7	Q48	25	2026-02-10 16:50:46.5294	48
213	10007	7	Q52	50	2026-02-10 16:50:50.560707	52
214	10007	7	Q55	25	2026-02-10 16:50:53.933018	55
215	10007	8	Q56	50	2026-02-10 16:51:09.003957	56
216	10007	8	Q57	50	2026-02-10 16:51:13.707233	57
217	10007	8	Q58	75	2026-02-10 16:51:17.295745	58
218	10007	9	Q59	75	2026-02-10 16:51:22.708434	59
219	10007	9	Q61	75	2026-02-10 16:52:42.894121	61
220	10007	9	Q62	75	2026-02-10 16:52:47.027134	62
221	10007	9	Q64	75	2026-02-10 16:52:53.504114	64
222	10007	10	Q65	50	2026-02-10 16:52:58.658339	65
223	10007	10	Q66	50	2026-02-10 16:53:04.632409	66
224	10007	10	Q68	75	2026-02-10 16:53:08.685925	68
225	10007	10	Q70	50	2026-02-10 16:53:12.860273	70
226	10012	1	Q1	50	2026-02-11 01:06:41.321608	1
227	10012	1	Q2	50	2026-02-11 01:06:49.446946	2
228	10012	1	Q3	100	2026-02-11 01:06:57.526775	3
229	10012	1	Q9	75	2026-02-11 01:07:01.257662	9
230	10013	1	Q1	75	2026-02-11 01:09:16.744224	1
231	10013	1	Q2	75	2026-02-11 01:09:21.795566	2
232	10013	1	Q3	50	2026-02-11 01:09:31.371567	3
233	10013	1	Q9	0	2026-02-11 01:09:36.795024	9
234	10013	2	Q13	75	2026-02-11 01:09:42.97181	13
235	10013	2	Q17	25	2026-02-11 01:09:49.208309	17
236	10013	2	Q18	100	2026-02-11 01:09:53.703465	18
237	10012	2	Q13	75	2026-02-11 01:09:55.922028	13
238	10013	2	Q19	100	2026-02-11 01:09:58.054907	19
239	10012	2	Q17	75	2026-02-11 01:10:00.717159	17
240	10013	3	Q20	75	2026-02-11 01:10:01.965989	20
241	10013	3	Q21	50	2026-02-11 01:10:06.106867	21
242	10012	2	Q18	75	2026-02-11 01:10:09.064967	18
243	10013	3	Q23	75	2026-02-11 01:10:10.65306	23
244	10013	3	Q25	75	2026-02-11 01:10:15.035311	25
245	10013	3	Q26	100	2026-02-11 01:10:19.299016	26
1276	10078	10	Q70	100	2026-02-27 13:11:54.1031	70
1277	10080	1	Q1	25	2026-02-27 13:24:14.096488	1
1278	10080	1	Q2	75	2026-02-27 13:24:14.558981	2
1279	10080	1	Q3	75	2026-02-27 13:24:14.984629	3
1280	10080	1	Q9	75	2026-02-27 13:24:15.409215	9
1281	10080	2	Q13	100	2026-02-27 13:24:16.063531	13
1282	10080	2	Q17	100	2026-02-27 13:24:16.592817	17
1283	10080	2	Q18	75	2026-02-27 13:24:17.113717	18
1284	10080	2	Q19	50	2026-02-27 13:24:17.693978	19
1285	10080	3	Q20	25	2026-02-27 13:24:18.519266	20
1286	10080	3	Q21	0	2026-02-27 13:24:19.203243	21
1287	10080	3	Q23	25	2026-02-27 13:24:19.900111	23
1288	10080	3	Q25	75	2026-02-27 13:24:20.779176	25
1289	10080	3	Q26	100	2026-02-27 13:24:21.493797	26
1290	10080	3	Q28	100	2026-02-27 13:24:22.070143	28
1291	10080	4	Q31	75	2026-02-27 13:24:22.576684	31
1292	10080	4	Q32	50	2026-02-27 13:24:23.138987	32
1293	10080	4	Q33	25	2026-02-27 13:24:23.733444	33
1294	10080	4	Q34	0	2026-02-27 13:24:24.296598	34
1295	10080	5	Q35	25	2026-02-27 13:24:24.851055	35
1296	10080	5	Q38	50	2026-02-27 13:24:25.380051	38
1297	10080	5	Q41	75	2026-02-27 13:24:25.910709	41
1298	10080	6	Q43	100	2026-02-27 13:24:26.500977	43
1299	10080	6	Q45	75	2026-02-27 13:24:27.152011	45
1300	10080	7	Q48	50	2026-02-27 13:24:27.683813	48
1301	10080	7	Q52	75	2026-02-27 13:24:28.303323	52
1302	10080	7	Q55	100	2026-02-27 13:24:28.861976	55
1303	10080	8	Q56	50	2026-02-27 13:24:29.511722	56
1304	10080	8	Q57	25	2026-02-27 13:24:30.011176	57
1305	10080	8	Q58	50	2026-02-27 13:24:30.53368	58
1306	10080	9	Q59	75	2026-02-27 13:24:31.013665	59
1307	10080	9	Q61	100	2026-02-27 13:24:31.551694	61
1308	10080	9	Q62	75	2026-02-27 13:24:32.070731	62
1309	10080	9	Q64	50	2026-02-27 13:24:32.547837	64
1310	10080	10	Q65	50	2026-02-27 13:24:33.233239	65
1311	10080	10	Q66	100	2026-02-27 13:24:34.017008	66
1312	10080	10	Q68	75	2026-02-27 13:24:35.142427	68
1313	10080	10	Q70	75	2026-02-27 13:24:36.913388	70
1317	10082	1	Q1	50	2026-02-27 13:26:40.957573	1
1318	10082	1	Q2	75	2026-02-27 13:26:41.457261	2
1319	10082	1	Q3	75	2026-02-27 13:26:41.978258	3
1320	10082	1	Q9	75	2026-02-27 13:26:42.460914	9
1321	10082	2	Q13	50	2026-02-27 13:26:43.462088	13
1322	10082	2	Q17	50	2026-02-27 13:26:43.964009	17
1323	10082	2	Q18	75	2026-02-27 13:26:44.449558	18
1324	10082	2	Q19	100	2026-02-27 13:26:45.182657	19
1325	10082	3	Q20	100	2026-02-27 13:26:45.709749	20
1326	10082	3	Q21	75	2026-02-27 13:26:46.233834	21
1327	10082	3	Q23	75	2026-02-27 13:26:46.83405	23
1328	10082	3	Q25	50	2026-02-27 13:26:47.399818	25
1329	10082	3	Q26	25	2026-02-27 13:26:48.0725	26
1330	10082	3	Q28	50	2026-02-27 13:26:48.856343	28
1331	10082	4	Q31	75	2026-02-27 13:26:49.605591	31
1332	10082	4	Q32	75	2026-02-27 13:26:50.159009	32
1333	10082	4	Q33	100	2026-02-27 13:26:50.675186	33
1334	10082	4	Q34	50	2026-02-27 13:26:51.504907	34
1335	10082	5	Q35	75	2026-02-27 13:26:52.20174	35
1336	10082	5	Q38	100	2026-02-27 13:26:52.891347	38
1337	10082	5	Q41	75	2026-02-27 13:26:53.551788	41
1338	10082	6	Q43	50	2026-02-27 13:26:54.118775	43
1339	10082	6	Q45	25	2026-02-27 13:26:54.786125	45
1340	10082	7	Q48	0	2026-02-27 13:26:55.501892	48
1341	10082	7	Q52	25	2026-02-27 13:26:56.081786	52
1342	10082	7	Q55	50	2026-02-27 13:26:56.64255	55
1343	10082	8	Q56	75	2026-02-27 13:26:57.238974	56
1344	10082	8	Q57	100	2026-02-27 13:26:57.929702	57
1345	10082	8	Q58	75	2026-02-27 13:26:58.593528	58
1346	10082	9	Q59	75	2026-02-27 13:26:59.14905	59
1347	10082	9	Q61	50	2026-02-27 13:26:59.68912	61
1348	10082	9	Q62	50	2026-02-27 13:27:00.376827	62
1349	10082	9	Q64	75	2026-02-27 13:27:00.883321	64
1350	10082	10	Q65	75	2026-02-27 13:27:01.342068	65
1351	10082	10	Q66	75	2026-02-27 13:27:02.962487	66
1352	10082	10	Q68	100	2026-02-27 13:27:03.674416	68
1353	10082	10	Q70	100	2026-02-27 13:27:05.521108	70
1369	10072	4	Q32	50	2026-02-27 15:22:46.792562	32
1375	10072	6	Q43	75	2026-02-27 15:33:05.882363	43
1381	10072	7	Q55	75	2026-02-27 15:33:07.368683	55
1388	10072	9	Q59	50	2026-02-27 15:33:09.064726	59
1392	10072	9	Q62	25	2026-02-27 15:33:10.026975	62
1406	10084	2	Q13	75	2026-03-03 14:37:27.616481	13
1411	10084	3	Q20	50	2026-03-03 14:37:28.864379	20
1412	10084	3	Q21	100	2026-03-03 14:37:29.391178	21
1413	10084	3	Q23	100	2026-03-03 14:37:29.919618	23
1421	10084	4	Q32	25	2026-03-03 14:37:32.397432	32
1429	10084	5	Q41	50	2026-03-03 14:37:34.014354	41
1430	10084	6	Q43	0	2026-03-03 14:37:34.516874	43
1431	10084	6	Q45	0	2026-03-03 14:37:35.084732	45
1432	10084	7	Q48	0	2026-03-03 14:37:35.478254	48
1433	10084	7	Q52	25	2026-03-03 14:37:35.830182	52
1438	10084	8	Q57	50	2026-03-03 14:37:36.931401	57
1439	10084	8	Q58	75	2026-03-03 14:37:37.475926	58
1441	10084	9	Q59	75	2026-03-03 14:37:37.852582	59
1443	10084	9	Q61	100	2026-03-03 14:37:38.319479	61
1445	10084	9	Q62	100	2026-03-03 14:37:38.49185	62
1447	10084	10	Q65	100	2026-03-03 14:37:38.966022	65
1448	10084	10	Q66	75	2026-03-03 14:37:40.210587	66
1449	10084	10	Q68	50	2026-03-03 14:37:40.986699	68
1450	10084	10	Q70	0	2026-03-03 14:37:42.41316	70
246	10012	2	Q19	50	2026-02-11 01:10:21.143579	19
247	10013	3	Q28	75	2026-02-11 01:10:24.04991	28
248	10013	4	Q31	75	2026-02-11 01:10:29.364754	31
249	10013	4	Q32	50	2026-02-11 01:10:34.898303	32
250	10013	4	Q33	100	2026-02-11 01:10:39.604891	33
251	10013	4	Q34	50	2026-02-11 01:10:44.693715	34
252	10013	5	Q35	25	2026-02-11 01:10:49.193571	35
253	10013	5	Q38	0	2026-02-11 01:10:55.023173	38
254	10013	5	Q41	75	2026-02-11 01:10:59.509231	41
255	10013	6	Q43	100	2026-02-11 01:11:08.041099	43
256	10013	6	Q45	50	2026-02-11 01:11:13.146588	45
257	10013	7	Q48	25	2026-02-11 01:11:17.704004	48
258	10013	7	Q52	75	2026-02-11 01:11:21.684798	52
259	10013	7	Q55	100	2026-02-11 01:11:26.283882	55
260	10012	3	Q20	75	2026-02-11 01:11:30.297468	20
261	10013	8	Q56	50	2026-02-11 01:11:31.367221	56
262	10013	8	Q57	25	2026-02-11 01:11:35.512424	57
263	10013	8	Q58	75	2026-02-11 01:11:39.474921	58
264	10012	3	Q21	75	2026-02-11 01:11:40.659154	21
265	10013	9	Q59	50	2026-02-11 01:11:43.530166	59
266	10012	3	Q23	100	2026-02-11 01:11:44.353682	23
267	10013	9	Q61	100	2026-02-11 01:11:47.521565	61
268	10012	3	Q25	75	2026-02-11 01:11:47.951812	25
269	10013	9	Q62	75	2026-02-11 01:11:51.426823	62
270	10013	9	Q64	50	2026-02-11 01:11:57.314212	64
271	10012	3	Q26	50	2026-02-11 01:12:00.12709	26
272	10013	10	Q65	25	2026-02-11 01:12:01.807143	65
273	10012	3	Q28	100	2026-02-11 01:12:05.670101	28
274	10013	10	Q66	0	2026-02-11 01:12:05.887423	66
275	10012	4	Q31	75	2026-02-11 01:12:09.62471	31
276	10013	10	Q68	75	2026-02-11 01:12:09.835745	68
277	10012	4	Q32	50	2026-02-11 01:12:13.205952	32
278	10013	10	Q70	0	2026-02-11 01:12:14.031421	70
279	10012	4	Q33	75	2026-02-11 01:12:16.451158	33
280	10012	4	Q34	100	2026-02-11 01:12:21.297367	34
281	10012	5	Q35	50	2026-02-11 01:13:16.65595	35
282	10012	5	Q38	75	2026-02-11 01:13:21.719955	38
283	10012	5	Q41	25	2026-02-11 01:13:28.626182	41
284	10012	6	Q43	50	2026-02-11 01:13:32.757964	43
285	10012	6	Q45	25	2026-02-11 01:13:37.345311	45
286	10012	7	Q48	75	2026-02-11 01:13:43.095307	48
287	10012	7	Q52	75	2026-02-11 01:13:47.220379	52
288	10012	7	Q55	25	2026-02-11 01:13:51.36264	55
289	10012	8	Q56	25	2026-02-11 01:13:55.761381	56
290	10012	8	Q57	50	2026-02-11 01:13:59.156512	57
291	10012	8	Q58	75	2026-02-11 01:14:03.169838	58
292	10012	9	Q59	75	2026-02-11 01:14:07.659842	59
293	10012	9	Q61	75	2026-02-11 01:14:11.988845	61
294	10012	9	Q62	50	2026-02-11 01:14:16.124821	62
295	10012	9	Q64	50	2026-02-11 01:14:20.467238	64
296	10012	10	Q65	50	2026-02-11 01:14:25.350214	65
297	10012	10	Q66	75	2026-02-11 01:14:30.11596	66
298	10012	10	Q68	100	2026-02-11 01:14:35.187298	68
299	10012	10	Q70	50	2026-02-11 01:14:39.82709	70
300	10014	1	Q1	50	2026-02-11 01:55:06.512359	1
301	10014	1	Q2	50	2026-02-11 01:55:11.73246	2
302	10014	1	Q3	100	2026-02-11 01:55:16.964395	3
303	10014	1	Q9	25	2026-02-11 01:55:21.275027	9
304	10014	2	Q13	50	2026-02-11 01:55:25.909054	13
305	10014	2	Q17	100	2026-02-11 01:55:30.302315	17
306	10014	2	Q18	25	2026-02-11 01:55:34.73826	18
307	10014	2	Q19	25	2026-02-11 01:55:38.931342	19
308	10014	3	Q20	75	2026-02-11 01:55:42.932187	20
309	10014	3	Q21	25	2026-02-11 01:55:46.935963	21
310	10014	3	Q23	100	2026-02-11 01:55:51.480321	23
311	10014	3	Q25	75	2026-02-11 01:55:56.006453	25
312	10014	3	Q26	25	2026-02-11 01:55:59.811832	26
313	10014	3	Q28	100	2026-02-11 01:56:04.922572	28
314	10014	4	Q31	75	2026-02-11 01:56:09.410573	31
315	10014	4	Q32	75	2026-02-11 01:56:13.587317	32
316	10014	4	Q33	50	2026-02-11 01:56:24.233713	33
317	10014	4	Q34	100	2026-02-11 01:56:27.900026	34
318	10014	5	Q35	50	2026-02-11 01:56:31.328808	35
319	10014	5	Q38	75	2026-02-11 01:56:35.642792	38
320	10014	5	Q41	100	2026-02-11 01:56:39.971553	41
321	10014	6	Q43	100	2026-02-11 01:56:44.313316	43
322	10014	6	Q45	75	2026-02-11 01:56:48.526989	45
323	10014	7	Q48	50	2026-02-11 01:56:53.121704	48
324	10014	7	Q52	50	2026-02-11 01:56:57.298732	52
325	10014	7	Q55	50	2026-02-11 01:57:01.227462	55
326	10014	8	Q56	50	2026-02-11 01:57:04.837072	56
327	10014	8	Q57	50	2026-02-11 01:57:08.371527	57
328	10014	8	Q58	50	2026-02-11 01:57:12.817349	58
329	10014	9	Q59	100	2026-02-11 01:57:16.558245	59
330	10014	9	Q61	50	2026-02-11 01:57:20.055312	61
331	10014	9	Q62	50	2026-02-11 01:57:23.922183	62
332	10014	9	Q64	100	2026-02-11 01:57:27.7918	64
333	10014	10	Q65	50	2026-02-11 01:57:31.250285	65
334	10014	10	Q66	50	2026-02-11 01:57:35.306775	66
335	10014	10	Q68	50	2026-02-11 01:57:46.550704	68
336	10014	10	Q70	75	2026-02-11 01:57:52.292204	70
337	10015	1	Q1	25	2026-02-11 01:59:01.440257	1
338	10015	1	Q2	75	2026-02-11 01:59:06.717157	2
339	10015	1	Q3	75	2026-02-11 01:59:11.000665	3
340	10015	1	Q9	25	2026-02-11 01:59:15.533047	9
341	10015	2	Q13	25	2026-02-11 01:59:20.456826	13
342	10015	2	Q17	75	2026-02-11 01:59:24.690627	17
343	10015	2	Q18	75	2026-02-11 01:59:28.79853	18
344	10015	2	Q19	75	2026-02-11 01:59:32.419383	19
345	10015	3	Q20	75	2026-02-11 01:59:36.390389	20
346	10015	3	Q21	25	2026-02-11 01:59:41.756898	21
347	10015	3	Q23	25	2026-02-11 01:59:49.876523	23
348	10015	3	Q25	75	2026-02-11 01:59:54.175429	25
349	10015	3	Q26	75	2026-02-11 01:59:59.432685	26
350	10015	3	Q28	75	2026-02-11 02:00:03.609462	28
351	10015	4	Q31	25	2026-02-11 02:00:07.55693	31
352	10015	4	Q32	75	2026-02-11 02:00:11.696528	32
353	10015	4	Q33	75	2026-02-11 02:00:15.796565	33
354	10015	4	Q34	25	2026-02-11 02:00:22.651937	34
355	10015	5	Q35	75	2026-02-11 02:00:26.738654	35
356	10015	5	Q38	75	2026-02-11 02:00:30.857899	38
357	10015	5	Q41	75	2026-02-11 02:00:35.092183	41
358	10015	6	Q43	75	2026-02-11 02:00:39.547125	43
359	10015	6	Q45	50	2026-02-11 02:00:43.115373	45
360	10015	7	Q48	100	2026-02-11 02:00:46.222117	48
361	10015	7	Q52	50	2026-02-11 02:00:49.647863	52
362	10015	7	Q55	50	2026-02-11 02:00:53.512868	55
363	10015	8	Q56	100	2026-02-11 02:00:57.1363	56
364	10015	8	Q57	50	2026-02-11 02:01:00.910268	57
365	10015	8	Q58	75	2026-02-11 02:01:05.355739	58
366	10015	9	Q59	75	2026-02-11 02:01:10.737808	59
367	10015	9	Q61	50	2026-02-11 02:01:15.193487	61
368	10015	9	Q62	75	2026-02-11 02:01:19.366199	62
369	10015	9	Q64	50	2026-02-11 02:01:24.180442	64
370	10015	10	Q65	50	2026-02-11 02:01:28.743209	65
371	10015	10	Q66	100	2026-02-11 02:01:32.859857	66
372	10015	10	Q68	75	2026-02-11 02:01:38.026951	68
373	10015	10	Q70	50	2026-02-11 02:01:42.635354	70
374	10017	1	Q1	50	2026-02-12 12:28:15.17167	1
375	10017	1	Q2	50	2026-02-12 12:28:19.755796	2
376	10016	1	Q1	75	2026-02-12 12:28:21.419223	1
377	10017	1	Q3	75	2026-02-12 12:28:24.446548	3
378	10017	1	Q9	50	2026-02-12 12:28:29.52008	9
379	10017	2	Q13	50	2026-02-12 12:28:33.734579	13
380	10016	1	Q2	75	2026-02-12 12:28:36.279463	2
381	10016	1	Q3	100	2026-02-12 12:28:40.353233	3
382	10017	2	Q17	50	2026-02-12 12:28:41.976773	17
383	10016	1	Q9	75	2026-02-12 12:28:44.367572	9
384	10016	2	Q13	75	2026-02-12 12:28:49.500989	13
385	10017	2	Q18	25	2026-02-12 12:28:50.022699	18
386	10016	2	Q17	75	2026-02-12 12:28:54.330812	17
387	10017	2	Q19	25	2026-02-12 12:28:59.208215	19
388	10016	2	Q18	75	2026-02-12 12:29:00.806959	18
389	10017	3	Q20	50	2026-02-12 12:29:03.455372	20
390	10016	2	Q19	75	2026-02-12 12:29:04.894941	19
391	10017	3	Q21	50	2026-02-12 12:29:07.42726	21
392	10016	3	Q20	75	2026-02-12 12:29:10.140945	20
393	10017	3	Q23	100	2026-02-12 12:29:10.783697	23
394	10017	3	Q25	0	2026-02-12 12:29:14.516597	25
395	10016	3	Q21	75	2026-02-12 12:29:15.859416	21
396	10017	3	Q26	75	2026-02-12 12:29:19.533347	26
397	10016	3	Q23	100	2026-02-12 12:29:19.733977	23
398	10017	3	Q28	75	2026-02-12 12:29:24.023185	28
399	10016	3	Q25	75	2026-02-12 12:29:24.123993	25
400	10017	4	Q31	50	2026-02-12 12:29:27.979006	31
401	10016	3	Q26	100	2026-02-12 12:29:28.30429	26
402	10017	4	Q32	75	2026-02-12 12:29:31.345254	32
403	10016	3	Q28	75	2026-02-12 12:29:31.869022	28
404	10017	4	Q33	50	2026-02-12 12:29:34.503837	33
405	10016	4	Q31	100	2026-02-12 12:29:34.968647	31
406	10017	4	Q34	50	2026-02-12 12:29:37.918363	34
407	10016	4	Q32	100	2026-02-12 12:29:40.189917	32
408	10017	5	Q35	100	2026-02-12 12:29:41.310598	35
409	10016	4	Q33	75	2026-02-12 12:29:43.175927	33
410	10017	5	Q38	100	2026-02-12 12:29:44.797648	38
411	10016	4	Q34	100	2026-02-12 12:29:46.945589	34
412	10017	5	Q41	100	2026-02-12 12:29:48.302159	41
413	10016	5	Q35	75	2026-02-12 12:29:50.358839	35
414	10017	6	Q43	100	2026-02-12 12:29:52.255958	43
415	10016	5	Q38	100	2026-02-12 12:29:53.757086	38
416	10017	6	Q45	50	2026-02-12 12:29:56.15629	45
417	10016	5	Q41	100	2026-02-12 12:29:58.252927	41
418	10017	7	Q48	50	2026-02-12 12:29:59.261093	48
419	10017	7	Q52	0	2026-02-12 12:30:02.495435	52
420	10016	6	Q43	75	2026-02-12 12:30:04.507952	43
421	10017	7	Q55	0	2026-02-12 12:30:05.770507	55
422	10016	6	Q45	75	2026-02-12 12:30:07.8728	45
423	10017	8	Q56	0	2026-02-12 12:30:09.38321	56
424	10016	7	Q48	100	2026-02-12 12:30:11.637822	48
425	10017	8	Q57	0	2026-02-12 12:30:12.813891	57
426	10017	8	Q58	50	2026-02-12 12:30:16.208399	58
427	10016	7	Q52	100	2026-02-12 12:30:17.675174	52
428	10016	7	Q55	100	2026-02-12 12:30:22.297451	55
429	10017	9	Q59	50	2026-02-12 12:30:24.489084	59
430	10016	8	Q56	100	2026-02-12 12:30:26.713026	56
431	10017	9	Q61	50	2026-02-12 12:30:28.097163	61
432	10016	8	Q57	100	2026-02-12 12:30:30.35419	57
433	10017	9	Q62	50	2026-02-12 12:30:31.957037	62
434	10016	8	Q58	75	2026-02-12 12:30:34.073881	58
435	10017	9	Q64	50	2026-02-12 12:30:35.50145	64
436	10016	9	Q59	100	2026-02-12 12:30:38.068874	59
437	10017	10	Q65	75	2026-02-12 12:30:39.010176	65
438	10016	9	Q61	100	2026-02-12 12:30:41.499544	61
439	10017	10	Q66	25	2026-02-12 12:30:42.504657	66
440	10016	9	Q62	75	2026-02-12 12:30:45.131045	62
441	10017	10	Q68	50	2026-02-12 12:30:46.35452	68
442	10017	10	Q70	50	2026-02-12 12:30:49.959059	70
443	10016	9	Q64	100	2026-02-12 12:30:50.032667	64
444	10016	10	Q65	75	2026-02-12 12:30:54.042834	65
445	10016	10	Q66	100	2026-02-12 12:30:58.704091	66
446	10016	10	Q68	100	2026-02-12 12:31:03.864231	68
447	10016	10	Q70	75	2026-02-12 12:31:11.529476	70
461	10027	1	Q1	25	2026-02-12 23:47:55.807987	1
462	10027	1	Q2	75	2026-02-12 23:48:00.114049	2
463	10027	1	Q3	100	2026-02-12 23:48:04.995091	3
464	10027	1	Q9	75	2026-02-12 23:48:12.895155	9
465	10027	2	Q13	75	2026-02-12 23:48:19.151447	13
466	10027	2	Q17	75	2026-02-12 23:48:23.972075	17
467	10027	2	Q18	50	2026-02-12 23:48:28.124826	18
468	10027	2	Q19	25	2026-02-12 23:48:32.196062	19
469	10027	3	Q20	25	2026-02-12 23:49:02.99343	20
470	10027	3	Q21	50	2026-02-12 23:49:20.040119	21
471	10027	3	Q23	50	2026-02-12 23:49:24.661504	23
472	10027	3	Q25	75	2026-02-12 23:49:34.427573	25
473	10027	3	Q26	75	2026-02-12 23:49:40.016587	26
474	10027	3	Q28	75	2026-02-12 23:49:45.91917	28
475	10027	4	Q31	75	2026-02-12 23:49:52.422144	31
476	10027	4	Q32	25	2026-02-12 23:49:57.370473	32
477	10027	4	Q33	75	2026-02-12 23:50:03.908138	33
478	10027	4	Q34	75	2026-02-12 23:50:09.052726	34
479	10027	5	Q35	25	2026-02-12 23:50:16.034391	35
480	10027	5	Q38	0	2026-02-12 23:50:21.203402	38
481	10027	5	Q41	25	2026-02-12 23:50:27.730186	41
482	10027	6	Q43	50	2026-02-12 23:50:31.908529	43
483	10027	6	Q45	75	2026-02-12 23:50:35.979091	45
484	10027	7	Q48	100	2026-02-12 23:50:39.319362	48
485	10027	7	Q52	75	2026-02-12 23:50:42.476745	52
486	10027	7	Q55	75	2026-02-12 23:50:48.299082	55
487	10027	8	Q56	50	2026-02-12 23:50:54.679065	56
488	10027	8	Q57	75	2026-02-12 23:50:59.332021	57
489	10027	8	Q58	100	2026-02-12 23:51:05.528975	58
490	10027	9	Q59	100	2026-02-12 23:51:15.909928	59
491	10027	9	Q61	100	2026-02-12 23:51:20.310976	61
492	10027	9	Q62	100	2026-02-12 23:51:24.587933	62
493	10027	9	Q64	75	2026-02-12 23:51:29.373576	64
494	10027	10	Q65	75	2026-02-12 23:51:37.5827	65
495	10027	10	Q66	25	2026-02-12 23:51:50.89155	66
496	10027	10	Q68	50	2026-02-12 23:51:57.415951	68
497	10027	10	Q70	75	2026-02-12 23:52:15.074872	70
498	10030	1	Q1	75	2026-02-13 02:31:50.567283	1
499	10030	1	Q2	100	2026-02-13 02:32:00.988173	2
500	10030	1	Q3	75	2026-02-13 02:32:06.668703	3
501	10030	1	Q9	100	2026-02-13 02:32:12.240455	9
502	10030	2	Q13	75	2026-02-13 02:32:16.5697	13
503	10030	2	Q17	25	2026-02-13 02:32:21.124589	17
504	10030	2	Q18	50	2026-02-13 02:32:35.854841	18
505	10030	2	Q19	25	2026-02-13 02:32:50.25589	19
506	10030	3	Q20	50	2026-02-13 02:33:24.131095	20
507	10030	3	Q21	50	2026-02-13 02:33:28.419425	21
508	10030	3	Q23	0	2026-02-13 02:33:36.771648	23
509	10030	3	Q25	50	2026-02-13 02:33:41.115023	25
510	10030	3	Q26	75	2026-02-13 02:33:47.797431	26
511	10030	3	Q28	50	2026-02-13 02:33:52.199054	28
512	10030	4	Q31	25	2026-02-13 02:34:15.328634	31
513	10030	4	Q32	50	2026-02-13 02:34:24.807072	32
514	10030	4	Q33	25	2026-02-13 02:34:33.644027	33
515	10030	4	Q34	0	2026-02-13 02:34:47.889353	34
516	10030	5	Q35	75	2026-02-13 02:35:24.900136	35
517	10030	5	Q38	25	2026-02-13 02:35:37.02973	38
518	10030	5	Q41	0	2026-02-13 02:35:55.3698	41
519	10030	6	Q43	25	2026-02-13 02:36:14.681631	43
520	10030	6	Q45	25	2026-02-13 02:36:48.438637	45
521	10030	7	Q48	50	2026-02-13 02:37:04.553262	48
522	10030	7	Q52	75	2026-02-13 02:37:10.868614	52
523	10030	7	Q55	50	2026-02-13 02:37:54.36356	55
524	10030	8	Q56	50	2026-02-13 02:38:39.945559	56
525	10030	8	Q57	75	2026-02-13 02:38:51.706391	57
526	10030	8	Q58	75	2026-02-13 02:38:56.562375	58
527	10030	9	Q59	75	2026-02-13 02:39:05.663467	59
528	10030	9	Q61	100	2026-02-13 02:39:09.735581	61
529	10030	9	Q62	75	2026-02-13 02:39:15.9864	62
530	10030	9	Q64	100	2026-02-13 02:39:20.463626	64
531	10030	10	Q65	75	2026-02-13 02:39:24.938569	65
532	10030	10	Q66	50	2026-02-13 02:39:29.599592	66
533	10030	10	Q68	100	2026-02-13 02:39:34.230071	68
534	10030	10	Q70	75	2026-02-13 02:39:41.714243	70
535	10032	1	Q1	50	2026-02-13 02:41:13.807011	1
536	10032	1	Q2	25	2026-02-13 02:41:19.170012	2
537	10032	1	Q3	50	2026-02-13 02:41:51.561634	3
538	10032	1	Q9	50	2026-02-13 02:42:07.698729	9
539	10032	2	Q13	75	2026-02-13 02:42:18.907975	13
540	10032	2	Q17	25	2026-02-13 02:42:30.951212	17
541	10032	2	Q18	25	2026-02-13 02:43:08.128311	18
542	10032	2	Q19	50	2026-02-13 02:43:24.488322	19
543	10032	3	Q20	75	2026-02-13 02:43:36.452794	20
544	10032	3	Q21	50	2026-02-13 02:43:53.613681	21
545	10032	3	Q23	25	2026-02-13 02:44:08.19307	23
546	10032	3	Q25	50	2026-02-13 02:44:18.739764	25
547	10032	3	Q26	25	2026-02-13 02:45:01.291204	26
548	10032	3	Q28	0	2026-02-13 02:45:05.416026	28
549	10032	4	Q31	25	2026-02-13 02:45:09.89003	31
550	10032	4	Q32	50	2026-02-13 02:45:13.785431	32
551	10032	4	Q33	75	2026-02-13 02:45:17.288198	33
552	10032	4	Q34	100	2026-02-13 02:45:20.375866	34
553	10032	5	Q35	50	2026-02-13 02:45:24.125779	35
554	10032	5	Q38	100	2026-02-13 02:45:27.979625	38
555	10032	5	Q41	50	2026-02-13 02:45:31.729049	41
556	10032	6	Q43	75	2026-02-13 02:45:35.518572	43
557	10032	6	Q45	100	2026-02-13 02:45:38.614461	45
558	10032	7	Q48	50	2026-02-13 02:45:42.581452	48
559	10032	7	Q52	100	2026-02-13 02:45:46.568683	52
560	10032	7	Q55	50	2026-02-13 02:45:52.103078	55
561	10032	8	Q56	100	2026-02-13 02:45:56.299457	56
562	10032	8	Q57	50	2026-02-13 02:46:00.169873	57
563	10032	8	Q58	100	2026-02-13 02:46:04.003728	58
564	10032	9	Q59	50	2026-02-13 02:46:07.884433	59
565	10032	9	Q61	100	2026-02-13 02:46:13.809276	61
566	10032	9	Q62	50	2026-02-13 02:46:17.729137	62
567	10032	9	Q64	75	2026-02-13 02:46:21.780546	64
568	10032	10	Q65	75	2026-02-13 02:46:26.013747	65
569	10032	10	Q66	75	2026-02-13 02:46:30.218972	66
570	10032	10	Q68	75	2026-02-13 02:46:34.87082	68
571	10032	10	Q70	100	2026-02-13 02:46:41.116743	70
572	10035	1	Q1	0	2026-02-13 12:53:10.448278	1
573	10035	1	Q2	25	2026-02-13 12:54:03.465438	2
574	10035	1	Q3	0	2026-02-13 12:54:09.729013	3
575	10035	1	Q9	25	2026-02-13 12:54:27.070392	9
576	10035	2	Q13	25	2026-02-13 12:54:41.582885	13
577	10035	2	Q17	25	2026-02-13 12:55:06.639839	17
578	10035	2	Q18	25	2026-02-13 12:55:28.157305	18
579	10035	2	Q19	75	2026-02-13 12:55:36.414034	19
580	10035	3	Q20	50	2026-02-13 12:55:45.439372	20
581	10035	3	Q21	50	2026-02-13 12:56:09.837367	21
582	10035	3	Q23	50	2026-02-13 12:56:18.647577	23
583	10035	3	Q25	25	2026-02-13 12:56:26.276915	25
584	10035	3	Q26	25	2026-02-13 12:56:36.777438	26
585	10035	3	Q28	25	2026-02-13 12:56:49.43236	28
586	10035	4	Q31	25	2026-02-13 12:56:56.754871	31
587	10035	4	Q32	25	2026-02-13 12:57:09.100461	32
588	10035	4	Q33	25	2026-02-13 12:57:15.866024	33
589	10035	4	Q34	25	2026-02-13 12:57:25.831967	34
590	10035	5	Q35	0	2026-02-13 12:57:31.762517	35
591	10035	5	Q38	0	2026-02-13 12:57:42.573955	38
592	10035	5	Q41	25	2026-02-13 12:58:06.016768	41
593	10035	6	Q43	25	2026-02-13 12:58:15.620365	43
594	10035	6	Q45	25	2026-02-13 12:59:42.239019	45
595	10035	7	Q48	75	2026-02-13 12:59:47.335673	48
596	10035	7	Q52	100	2026-02-13 12:59:56.06678	52
597	10035	7	Q55	25	2026-02-13 13:00:09.519549	55
598	10035	8	Q56	25	2026-02-13 13:00:16.519828	56
599	10035	8	Q57	25	2026-02-13 13:00:20.82792	57
600	10035	8	Q58	50	2026-02-13 13:00:27.349678	58
601	10035	9	Q59	100	2026-02-13 13:00:32.54328	59
602	10035	9	Q61	75	2026-02-13 13:00:36.930011	61
603	10035	9	Q62	75	2026-02-13 13:00:44.026885	62
604	10035	9	Q64	50	2026-02-13 13:00:48.743765	64
605	10035	10	Q65	100	2026-02-13 13:00:53.83738	65
606	10035	10	Q66	75	2026-02-13 13:00:58.593911	66
607	10035	10	Q68	50	2026-02-13 13:01:03.424978	68
608	10035	10	Q70	75	2026-02-13 13:01:08.660908	70
609	10038	1	Q1	50	2026-02-16 14:24:40.460429	1
610	10038	1	Q2	25	2026-02-16 14:27:26.935479	2
611	10038	1	Q3	50	2026-02-16 14:29:52.998685	3
612	10038	1	Q9	75	2026-02-16 14:29:59.106359	9
613	10038	2	Q13	75	2026-02-16 14:30:05.87611	13
614	10038	2	Q17	100	2026-02-16 14:30:10.636185	17
615	10038	2	Q18	50	2026-02-16 14:30:19.892305	18
616	10038	2	Q19	75	2026-02-16 14:31:43.54748	19
617	10038	3	Q20	50	2026-02-16 14:31:48.686253	20
618	10038	3	Q21	75	2026-02-16 14:31:53.67315	21
619	10038	3	Q23	75	2026-02-16 14:31:59.658771	23
620	10038	3	Q25	50	2026-02-16 14:32:08.507703	25
621	10038	3	Q26	75	2026-02-16 14:32:55.073296	26
622	10038	3	Q28	75	2026-02-16 14:33:01.215949	28
623	10038	4	Q31	75	2026-02-16 14:33:10.764081	31
624	10038	4	Q32	100	2026-02-16 14:33:15.818303	32
625	10038	4	Q33	50	2026-02-16 14:33:20.622199	33
626	10038	4	Q34	100	2026-02-16 14:33:26.293313	34
627	10038	5	Q35	100	2026-02-16 14:33:31.817401	35
628	10038	5	Q38	75	2026-02-16 14:33:37.18123	38
629	10038	5	Q41	50	2026-02-16 14:33:42.073305	41
630	10038	6	Q43	100	2026-02-16 14:33:46.774318	43
631	10038	6	Q45	50	2026-02-16 14:33:51.588741	45
632	10038	7	Q48	50	2026-02-16 14:34:03.972636	48
633	10038	7	Q52	25	2026-02-16 14:34:10.338105	52
634	10038	7	Q55	75	2026-02-16 14:34:15.115703	55
635	10038	8	Q56	75	2026-02-16 14:34:20.370247	56
636	10038	8	Q57	75	2026-02-16 14:34:25.597101	57
637	10038	8	Q58	25	2026-02-16 14:34:30.839912	58
638	10038	9	Q59	75	2026-02-16 14:34:35.663976	59
639	10038	9	Q61	75	2026-02-16 14:34:52.407729	61
640	10038	9	Q62	75	2026-02-16 14:35:10.389841	62
641	10038	9	Q64	75	2026-02-16 14:35:35.575092	64
642	10038	10	Q65	75	2026-02-16 14:35:41.191284	65
643	10038	10	Q66	75	2026-02-16 14:36:11.439626	66
644	10038	10	Q68	100	2026-02-16 14:36:17.814315	68
645	10038	10	Q70	75	2026-02-16 14:36:23.099551	70
646	10048	1	Q1	50	2026-02-16 18:30:22.087673	1
647	10048	1	Q2	100	2026-02-16 18:30:27.400242	2
648	10048	1	Q3	75	2026-02-16 18:30:33.53766	3
649	10048	1	Q9	50	2026-02-16 18:31:41.185598	9
650	10048	2	Q13	25	2026-02-16 18:32:06.855582	13
651	10048	2	Q17	50	2026-02-16 18:34:02.102062	17
652	10048	2	Q18	75	2026-02-16 18:34:06.464321	18
653	10048	2	Q19	75	2026-02-16 18:34:12.461886	19
654	10048	3	Q20	50	2026-02-16 18:34:29.268643	20
655	10048	3	Q21	50	2026-02-16 18:34:40.492047	21
656	10048	3	Q23	100	2026-02-16 18:34:45.830287	23
657	10048	3	Q25	25	2026-02-16 18:35:24.647342	25
658	10048	3	Q26	75	2026-02-16 18:35:30.528202	26
659	10048	3	Q28	75	2026-02-16 18:35:42.070211	28
660	10048	4	Q31	100	2026-02-16 18:35:47.113464	31
661	10048	4	Q32	75	2026-02-16 18:35:52.686601	32
662	10048	4	Q33	100	2026-02-16 18:35:57.789364	33
663	10048	4	Q34	100	2026-02-16 18:36:02.698453	34
664	10048	5	Q35	75	2026-02-16 18:36:08.436056	35
665	10048	5	Q38	75	2026-02-16 18:36:12.453394	38
666	10048	5	Q41	75	2026-02-16 18:36:20.439986	41
667	10048	6	Q43	25	2026-02-16 18:36:25.401724	43
668	10048	6	Q45	75	2026-02-16 18:36:30.736203	45
669	10048	7	Q48	75	2026-02-16 18:36:36.373492	48
670	10048	7	Q52	50	2026-02-16 18:36:40.570981	52
671	10048	7	Q55	50	2026-02-16 18:36:49.351401	55
672	10048	8	Q56	75	2026-02-16 18:37:05.302899	56
673	10048	8	Q57	25	2026-02-16 18:37:09.870523	57
674	10048	8	Q58	50	2026-02-16 18:37:14.472122	58
675	10048	9	Q59	75	2026-02-16 18:37:20.311172	59
676	10048	9	Q61	100	2026-02-16 18:37:25.086601	61
677	10048	9	Q62	50	2026-02-16 18:37:32.06259	62
678	10048	9	Q64	25	2026-02-16 18:37:36.396199	64
679	10048	10	Q65	100	2026-02-16 18:37:54.089911	65
680	10048	10	Q66	50	2026-02-16 18:38:03.359628	66
681	10048	10	Q68	75	2026-02-16 18:38:08.844913	68
682	10048	10	Q70	100	2026-02-16 18:38:15.725231	70
683	10049	1	Q1	50	2026-02-17 00:21:39.529342	1
684	10049	1	Q2	50	2026-02-17 00:21:47.000766	2
685	10049	1	Q3	25	2026-02-17 00:21:59.606336	3
686	10049	1	Q9	50	2026-02-17 00:22:05.008408	9
687	10049	2	Q13	50	2026-02-17 00:22:09.751633	13
688	10049	2	Q17	75	2026-02-17 00:22:16.708557	17
689	10049	2	Q18	75	2026-02-17 00:22:21.253392	18
690	10049	2	Q19	100	2026-02-17 00:22:26.313759	19
691	10049	3	Q20	25	2026-02-17 00:22:37.288381	20
692	10049	3	Q21	50	2026-02-17 00:22:50.146193	21
693	10049	3	Q23	50	2026-02-17 00:22:56.724152	23
694	10049	3	Q25	25	2026-02-17 00:23:04.1335	25
695	10049	3	Q26	50	2026-02-17 00:23:09.2061	26
696	10049	3	Q28	50	2026-02-17 00:23:13.491456	28
697	10049	4	Q31	25	2026-02-17 00:23:52.808989	31
698	10049	4	Q32	50	2026-02-17 00:23:56.926339	32
699	10049	4	Q33	50	2026-02-17 00:24:19.867674	33
700	10049	4	Q34	50	2026-02-17 00:25:06.095832	34
701	10049	5	Q35	50	2026-02-17 00:25:18.126086	35
702	10049	5	Q38	25	2026-02-17 00:27:48.155247	38
703	10049	5	Q41	75	2026-02-17 00:27:52.651473	41
704	10049	6	Q43	75	2026-02-17 00:27:57.969022	43
705	10049	6	Q45	50	2026-02-17 00:42:37.419094	45
706	10049	7	Q48	50	2026-02-17 00:42:55.032222	48
707	10049	7	Q52	100	2026-02-17 00:42:59.913147	52
708	10049	7	Q55	100	2026-02-17 00:43:04.629348	55
709	10049	8	Q56	100	2026-02-17 00:43:09.44986	56
710	10049	8	Q57	75	2026-02-17 00:43:14.420852	57
711	10049	8	Q58	50	2026-02-17 00:43:20.958736	58
712	10049	9	Q59	75	2026-02-17 00:43:28.120823	59
713	10049	9	Q61	75	2026-02-17 00:43:34.618883	61
714	10049	9	Q62	75	2026-02-17 00:43:42.894095	62
715	10049	9	Q64	100	2026-02-17 00:43:47.989266	64
716	10049	10	Q65	75	2026-02-17 00:43:53.369977	65
717	10049	10	Q66	0	2026-02-17 00:43:58.377005	66
718	10049	10	Q68	25	2026-02-17 00:44:03.13247	68
719	10049	10	Q70	0	2026-02-17 00:44:08.056976	70
720	10052	1	Q1	100	2026-02-17 13:01:38.978308	1
721	10052	1	Q2	50	2026-02-17 13:01:44.902513	2
722	10052	1	Q3	25	2026-02-17 13:03:23.678723	3
723	10052	1	Q9	75	2026-02-17 13:03:28.634492	9
724	10052	2	Q13	100	2026-02-17 13:03:32.669188	13
725	10052	2	Q17	75	2026-02-17 13:03:43.280623	17
726	10052	2	Q18	25	2026-02-17 13:04:02.168105	18
727	10052	2	Q19	75	2026-02-17 13:04:13.056143	19
728	10052	3	Q20	50	2026-02-17 13:04:47.410227	20
729	10052	3	Q21	75	2026-02-17 13:05:10.874107	21
730	10052	3	Q23	25	2026-02-17 13:05:27.516272	23
731	10052	3	Q25	50	2026-02-17 13:05:33.656854	25
732	10052	3	Q26	25	2026-02-17 13:05:38.657297	26
733	10052	3	Q28	0	2026-02-17 13:05:44.101376	28
734	10052	4	Q31	50	2026-02-17 13:05:48.917083	31
736	10052	4	Q32	25	2026-02-17 13:05:53.880535	32
741	10053	1	Q1	50	2026-02-17 13:06:40.454288	1
738	10052	4	Q33	50	2026-02-17 13:06:10.198787	33
740	10052	4	Q34	50	2026-02-17 13:06:35.718564	34
742	10052	5	Q35	100	2026-02-17 13:06:43.118546	35
744	10052	5	Q38	50	2026-02-17 13:06:47.584236	38
739	10053	1	Q3	100	2026-02-17 13:06:50.156742	3
747	10052	5	Q41	50	2026-02-17 13:06:58.462433	41
750	10052	6	Q45	25	2026-02-17 13:07:14.052681	45
751	10052	7	Q48	25	2026-02-17 13:07:20.058583	48
752	10052	7	Q52	50	2026-02-17 13:07:26.759951	52
753	10052	7	Q55	75	2026-02-17 13:07:31.962274	55
754	10052	8	Q56	50	2026-02-17 13:07:36.558262	56
755	10052	8	Q57	50	2026-02-17 13:07:41.303446	57
756	10052	8	Q58	25	2026-02-17 13:07:45.618703	58
757	10052	9	Q59	25	2026-02-17 13:07:50.546991	59
758	10052	9	Q61	50	2026-02-17 13:07:56.728867	61
759	10052	9	Q62	50	2026-02-17 13:08:01.784608	62
760	10052	9	Q64	100	2026-02-17 13:08:06.656247	64
761	10052	10	Q65	50	2026-02-17 13:08:12.302996	65
762	10052	10	Q66	50	2026-02-17 13:08:18.64566	66
763	10052	10	Q68	25	2026-02-17 13:08:23.731811	68
764	10052	10	Q70	50	2026-02-17 13:08:28.779309	70
1354	10072	1	Q2	100	2026-02-27 15:14:36.460888	2
1370	10072	4	Q33	75	2026-02-27 15:33:02.919755	33
1371	10072	4	Q34	100	2026-02-27 15:33:03.416235	34
1372	10072	5	Q35	75	2026-02-27 15:33:04.447581	35
1373	10072	5	Q38	75	2026-02-27 15:33:05.236277	38
1374	10072	5	Q41	75	2026-02-27 15:33:05.672999	41
1376	10072	6	Q45	75	2026-02-27 15:33:06.122975	45
1377	10072	7	Q48	75	2026-02-27 15:33:06.587759	48
1379	10072	7	Q52	75	2026-02-27 15:33:06.960258	52
1386	10072	8	Q58	50	2026-02-27 15:33:08.736278	58
1394	10072	9	Q64	25	2026-02-27 15:33:10.37575	64
1398	10072	10	Q66	100	2026-02-27 15:33:11.574338	66
1399	10072	10	Q68	100	2026-02-27 15:33:12.169205	68
1401	10072	10	Q70	100	2026-02-27 15:33:12.490012	70
1403	10084	1	Q1	50	2026-03-03 14:37:26.672705	1
1408	10084	2	Q17	75	2026-03-03 14:37:27.864734	17
1409	10084	2	Q18	50	2026-03-03 14:37:28.228092	18
1410	10084	2	Q19	50	2026-03-03 14:37:28.474394	19
1415	10084	3	Q25	75	2026-03-03 14:37:30.410744	25
1417	10084	3	Q26	75	2026-03-03 14:37:30.599337	26
1418	10084	3	Q28	25	2026-03-03 14:37:31.530047	28
1419	10084	4	Q31	25	2026-03-03 14:37:32.063189	31
1423	10084	4	Q33	25	2026-03-03 14:37:32.707684	33
1424	10084	4	Q34	25	2026-03-03 14:37:32.91906	34
1425	10084	5	Q35	50	2026-03-03 14:37:33.458361	35
1427	10084	5	Q38	50	2026-03-03 14:37:33.816283	38
1434	10084	7	Q55	25	2026-03-03 14:37:36.24071	55
1436	10084	8	Q56	50	2026-03-03 14:37:36.73982	56
1446	10084	9	Q64	100	2026-03-03 14:37:38.825485	64
1451	10086	1	Q1	0	2026-03-09 02:03:40.984949	1
1452	10086	1	Q2	50	2026-03-09 02:03:46.653446	2
1453	10086	1	Q3	75	2026-03-09 02:03:51.000893	3
1454	10086	1	Q9	75	2026-03-09 02:03:56.070603	9
1455	10086	2	Q13	50	2026-03-09 02:04:00.963017	13
1456	10086	2	Q17	25	2026-03-09 02:04:05.929314	17
1457	10086	2	Q18	25	2026-03-09 02:04:21.390464	18
1458	10086	2	Q19	50	2026-03-09 02:04:44.604783	19
1459	10086	3	Q20	0	2026-03-09 02:04:53.9318	20
1461	10087	1	Q1	25	2026-03-09 02:05:03.947304	1
1462	10086	3	Q23	75	2026-03-09 02:05:06.337736	23
1463	10087	1	Q2	100	2026-03-09 02:05:08.450269	2
1464	10086	3	Q25	50	2026-03-09 02:05:13.48697	25
1465	10086	3	Q26	25	2026-03-09 02:05:18.68964	26
1466	10086	3	Q28	0	2026-03-09 02:05:23.504989	28
1467	10086	4	Q31	75	2026-03-09 02:05:29.895021	31
1468	10086	4	Q32	75	2026-03-09 02:05:35.052501	32
1469	10087	1	Q3	25	2026-03-09 02:05:39.796901	3
1470	10087	1	Q9	25	2026-03-09 02:05:44.69572	9
1480	10087	2	Q17	50	2026-03-09 02:06:22.607397	17
1481	10086	7	Q52	100	2026-03-09 02:06:25.744062	52
1482	10086	7	Q55	50	2026-03-09 02:06:30.338454	55
1483	10086	8	Q56	50	2026-03-09 02:06:35.553643	56
1484	10087	2	Q18	50	2026-03-09 02:06:40.159545	18
1487	10086	8	Q58	25	2026-03-09 02:06:47.978645	58
1488	10086	9	Q59	100	2026-03-09 02:06:53.779182	59
1489	10086	9	Q61	50	2026-03-09 02:06:58.735781	61
1490	10086	9	Q62	75	2026-03-09 02:07:02.826047	62
1491	10086	9	Q64	75	2026-03-09 02:07:09.017599	64
1492	10087	3	Q20	50	2026-03-09 02:07:18.294579	20
1493	10087	3	Q21	50	2026-03-09 02:07:27.434752	21
1494	10087	3	Q23	100	2026-03-09 02:07:32.577945	23
1495	10087	3	Q25	50	2026-03-09 02:07:37.168846	25
1496	10087	3	Q26	50	2026-03-09 02:08:04.337917	26
1497	10087	3	Q28	75	2026-03-09 02:08:11.116244	28
1498	10087	4	Q31	75	2026-03-09 02:08:16.194486	31
1499	10087	4	Q32	75	2026-03-09 02:08:21.082706	32
1500	10087	4	Q33	100	2026-03-09 02:08:25.833425	33
1501	10087	4	Q34	75	2026-03-09 02:08:30.523588	34
1502	10087	5	Q35	75	2026-03-09 02:08:38.178745	35
1503	10087	5	Q38	75	2026-03-09 02:08:43.509246	38
1504	10087	5	Q41	50	2026-03-09 02:08:51.090016	41
1505	10087	6	Q43	75	2026-03-09 02:08:56.484243	43
1506	10087	6	Q45	100	2026-03-09 02:09:48.818841	45
1507	10087	7	Q48	75	2026-03-09 02:09:53.697466	48
1508	10087	7	Q52	100	2026-03-09 02:09:58.378748	52
1509	10087	7	Q55	75	2026-03-09 02:10:03.863408	55
1510	10087	8	Q56	50	2026-03-09 02:10:10.919146	56
1511	10087	8	Q57	50	2026-03-09 02:10:16.765991	57
1512	10087	8	Q58	25	2026-03-09 02:10:21.772805	58
1513	10087	9	Q59	75	2026-03-09 02:10:26.742808	59
1514	10087	9	Q61	75	2026-03-09 02:10:32.933553	61
1515	10087	9	Q62	75	2026-03-09 02:10:38.795356	62
1516	10087	9	Q64	100	2026-03-09 02:10:43.074134	64
1517	10089	1	Q1	75	2026-03-09 02:11:39.432993	1
1518	10089	1	Q2	75	2026-03-09 02:11:44.645007	2
1519	10089	1	Q3	75	2026-03-09 02:11:50.6392	3
1520	10089	1	Q9	75	2026-03-09 02:12:27.54562	9
1521	10089	2	Q13	100	2026-03-09 02:12:32.887399	13
743	10053	1	Q2	100	2026-02-17 13:06:45.418752	2
746	10053	1	Q9	25	2026-02-17 13:06:54.854494	9
748	10053	2	Q13	50	2026-02-17 13:07:01.106262	13
749	10052	6	Q43	75	2026-02-17 13:07:09.172775	43
765	10055	1	Q1	0	2026-02-17 16:18:42.779854	1
766	10055	1	Q2	50	2026-02-17 16:18:51.280942	2
767	10055	1	Q3	25	2026-02-17 16:18:59.057675	3
768	10055	1	Q9	0	2026-02-17 16:19:04.791424	9
769	10055	2	Q13	25	2026-02-17 16:19:15.095416	13
770	10055	2	Q17	50	2026-02-17 16:19:22.56599	17
771	10055	2	Q18	25	2026-02-17 16:19:28.03112	18
772	10055	2	Q19	50	2026-02-17 16:19:32.138378	19
773	10055	3	Q20	50	2026-02-17 16:19:39.786348	20
775	10055	3	Q21	25	2026-02-17 16:19:44.681417	21
777	10055	3	Q23	50	2026-02-17 16:20:03.14776	23
778	10055	3	Q25	25	2026-02-17 16:20:18.414836	25
779	10055	3	Q26	50	2026-02-17 16:20:24.380819	26
780	10055	3	Q28	25	2026-02-17 16:20:29.120442	28
781	10055	4	Q31	50	2026-02-17 16:20:35.103328	31
782	10055	4	Q32	50	2026-02-17 16:20:40.377863	32
783	10055	4	Q33	0	2026-02-17 16:20:46.848894	33
784	10056	1	Q1	50	2026-02-17 16:20:48.795859	1
785	10055	4	Q34	50	2026-02-17 16:20:51.963321	34
786	10056	1	Q2	50	2026-02-17 16:20:55.392709	2
787	10055	5	Q35	25	2026-02-17 16:20:56.659736	35
788	10056	1	Q3	75	2026-02-17 16:21:01.30034	3
789	10055	5	Q38	25	2026-02-17 16:21:03.026569	38
790	10056	1	Q9	100	2026-02-17 16:21:05.511653	9
791	10055	5	Q41	25	2026-02-17 16:21:10.942225	41
792	10055	6	Q43	50	2026-02-17 16:21:18.312616	43
793	10055	6	Q45	25	2026-02-17 16:21:22.720297	45
794	10055	7	Q48	50	2026-02-17 16:21:32.802027	48
795	10055	7	Q52	25	2026-02-17 16:21:37.522349	52
796	10055	7	Q55	50	2026-02-17 16:21:42.127666	55
797	10055	8	Q56	25	2026-02-17 16:21:47.500222	56
798	10055	8	Q57	25	2026-02-17 16:21:57.341936	57
799	10055	8	Q58	75	2026-02-17 16:22:01.918281	58
800	10055	9	Q59	25	2026-02-17 16:22:10.130598	59
801	10055	9	Q61	50	2026-02-17 16:22:30.322381	61
802	10055	9	Q62	50	2026-02-17 16:22:40.915672	62
803	10055	9	Q64	25	2026-02-17 16:22:49.031514	64
804	10055	10	Q65	0	2026-02-17 16:22:55.975171	65
805	10055	10	Q66	50	2026-02-17 16:23:05.304666	66
806	10055	10	Q68	25	2026-02-17 16:23:10.211565	68
807	10055	10	Q70	50	2026-02-17 16:23:16.24592	70
808	10058	1	Q1	50	2026-02-17 19:32:02.290874	1
809	10058	1	Q2	100	2026-02-17 19:32:02.919028	2
810	10058	1	Q3	75	2026-02-17 19:32:03.590421	3
811	10058	1	Q9	75	2026-02-17 19:32:04.144445	9
812	10058	2	Q13	50	2026-02-17 19:32:05.303329	13
813	10058	2	Q17	50	2026-02-17 19:32:05.85865	17
814	10058	2	Q18	50	2026-02-17 19:32:06.409324	18
815	10058	2	Q19	75	2026-02-17 19:32:07.070329	19
816	10058	3	Q20	75	2026-02-17 19:32:07.633436	20
817	10058	3	Q21	100	2026-02-17 19:32:08.286155	21
818	10058	3	Q23	100	2026-02-17 19:32:08.857483	23
819	10058	3	Q25	75	2026-02-17 19:32:09.358518	25
820	10058	3	Q26	75	2026-02-17 19:32:09.903881	26
821	10058	3	Q28	50	2026-02-17 19:32:10.574854	28
822	10058	4	Q31	25	2026-02-17 19:32:11.410978	31
823	10058	4	Q32	25	2026-02-17 19:32:12.088411	32
824	10058	4	Q33	25	2026-02-17 19:32:12.606286	33
825	10058	4	Q34	0	2026-02-17 19:32:13.342961	34
826	10058	5	Q35	25	2026-02-17 19:32:13.902653	35
827	10058	5	Q38	25	2026-02-17 19:32:14.664684	38
828	10058	5	Q41	50	2026-02-17 19:32:15.329842	41
829	10058	6	Q43	75	2026-02-17 19:32:15.980286	43
830	10058	6	Q45	100	2026-02-17 19:32:16.585462	45
831	10058	7	Q48	75	2026-02-17 19:32:17.093912	48
832	10058	7	Q52	50	2026-02-17 19:32:17.71396	52
833	10058	7	Q55	75	2026-02-17 19:32:18.30252	55
834	10058	8	Q56	100	2026-02-17 19:32:18.856376	56
835	10058	8	Q57	75	2026-02-17 19:32:19.400559	57
836	10058	8	Q58	50	2026-02-17 19:32:20.032121	58
837	10058	9	Q59	50	2026-02-17 19:32:20.703977	59
838	10058	9	Q61	75	2026-02-17 19:32:21.323329	61
839	10058	9	Q62	100	2026-02-17 19:32:21.927856	62
840	10058	9	Q64	75	2026-02-17 19:32:22.497778	64
841	10058	10	Q65	50	2026-02-17 19:32:23.135187	65
842	10058	10	Q66	100	2026-02-17 19:32:24.255849	66
843	10058	10	Q68	75	2026-02-17 19:32:25.273389	68
844	10058	10	Q70	50	2026-02-17 19:32:27.473326	70
845	10061	1	Q1	50	2026-02-17 19:34:55.090381	1
846	10061	1	Q2	75	2026-02-17 19:34:55.535592	2
847	10061	1	Q3	100	2026-02-17 19:34:56.247215	3
848	10061	1	Q9	75	2026-02-17 19:34:56.751294	9
849	10061	2	Q13	100	2026-02-17 19:34:57.263816	13
850	10061	2	Q17	75	2026-02-17 19:34:57.73371	17
851	10061	2	Q18	50	2026-02-17 19:34:58.204787	18
852	10061	2	Q19	50	2026-02-17 19:34:58.850846	19
853	10061	3	Q20	25	2026-02-17 19:34:59.297072	20
854	10061	3	Q21	25	2026-02-17 19:34:59.805621	21
855	10061	3	Q23	0	2026-02-17 19:35:00.327313	23
856	10061	3	Q25	25	2026-02-17 19:35:00.841026	25
857	10061	3	Q26	50	2026-02-17 19:35:01.455054	26
858	10061	3	Q28	75	2026-02-17 19:35:02.02767	28
859	10061	4	Q31	100	2026-02-17 19:35:02.531789	31
860	10061	4	Q32	75	2026-02-17 19:35:02.989185	32
861	10061	4	Q33	100	2026-02-17 19:35:03.480742	33
862	10061	4	Q34	75	2026-02-17 19:35:04.393835	34
863	10061	5	Q35	50	2026-02-17 19:35:04.943799	35
864	10061	5	Q38	75	2026-02-17 19:35:05.561081	38
865	10061	5	Q41	100	2026-02-17 19:35:06.225711	41
866	10061	6	Q43	75	2026-02-17 19:35:06.89895	43
867	10061	6	Q45	50	2026-02-17 19:35:07.433367	45
868	10061	7	Q48	75	2026-02-17 19:35:07.934728	48
869	10061	7	Q52	100	2026-02-17 19:35:08.470543	52
870	10061	7	Q55	75	2026-02-17 19:35:08.951222	55
871	10061	8	Q56	50	2026-02-17 19:35:09.465361	56
872	10061	8	Q57	25	2026-02-17 19:35:10.06435	57
873	10061	8	Q58	25	2026-02-17 19:35:10.6513	58
874	10061	9	Q59	50	2026-02-17 19:35:11.139783	59
875	10061	9	Q61	75	2026-02-17 19:35:11.756463	61
876	10061	9	Q62	100	2026-02-17 19:35:12.482469	62
877	10061	9	Q64	75	2026-02-17 19:35:12.897708	64
878	10061	10	Q65	100	2026-02-17 19:35:13.537083	65
879	10061	10	Q66	100	2026-02-17 19:35:14.259738	66
880	10061	10	Q68	75	2026-02-17 19:35:14.833824	68
881	10061	10	Q70	100	2026-02-17 19:35:15.440182	70
882	10062	1	Q1	50	2026-02-18 02:20:27.76396	1
883	10062	1	Q2	100	2026-02-18 02:20:28.773009	2
884	10062	1	Q3	75	2026-02-18 02:20:29.37601	3
885	10062	1	Q9	75	2026-02-18 02:20:29.836169	9
886	10062	2	Q13	75	2026-02-18 02:20:30.252724	13
887	10062	2	Q17	75	2026-02-18 02:20:30.679489	17
888	10062	2	Q18	75	2026-02-18 02:20:31.237226	18
889	10062	2	Q19	50	2026-02-18 02:20:31.933749	19
890	10062	3	Q20	50	2026-02-18 02:20:32.675146	20
891	10062	3	Q21	75	2026-02-18 02:20:33.210374	21
892	10062	3	Q23	75	2026-02-18 02:20:33.942558	23
893	10062	3	Q25	100	2026-02-18 02:20:34.587533	25
894	10062	3	Q26	100	2026-02-18 02:20:35.042569	26
895	10062	3	Q28	100	2026-02-18 02:20:35.473921	28
896	10062	4	Q31	75	2026-02-18 02:20:35.953788	31
897	10062	4	Q32	50	2026-02-18 02:20:36.499326	32
898	10062	4	Q33	25	2026-02-18 02:20:37.226198	33
899	10062	4	Q34	25	2026-02-18 02:20:37.946501	34
900	10062	5	Q35	0	2026-02-18 02:20:38.597352	35
901	10062	5	Q38	0	2026-02-18 02:20:39.126528	38
902	10062	5	Q41	25	2026-02-18 02:20:39.839437	41
903	10062	6	Q43	50	2026-02-18 02:20:40.86132	43
904	10062	6	Q45	75	2026-02-18 02:20:41.595846	45
905	10062	7	Q48	100	2026-02-18 02:20:42.401705	48
906	10062	7	Q52	100	2026-02-18 02:20:42.791825	52
907	10062	7	Q55	75	2026-02-18 02:20:43.392695	55
908	10062	8	Q56	75	2026-02-18 02:20:43.810906	56
909	10062	8	Q57	100	2026-02-18 02:20:44.331173	57
910	10062	8	Q58	75	2026-02-18 02:20:44.883498	58
911	10062	9	Q59	100	2026-02-18 02:20:45.353135	59
912	10062	9	Q61	100	2026-02-18 02:20:45.957031	61
913	10062	9	Q62	75	2026-02-18 02:20:46.570093	62
914	10062	9	Q64	75	2026-02-18 02:20:47.12531	64
915	10062	10	Q65	100	2026-02-18 02:20:47.58504	65
916	10062	10	Q66	100	2026-02-18 02:20:48.074152	66
917	10062	10	Q68	100	2026-02-18 02:20:48.513954	68
918	10062	10	Q70	75	2026-02-18 02:20:49.396485	70
919	10064	1	Q1	100	2026-02-18 02:39:57.106855	1
920	10064	1	Q2	50	2026-02-18 02:39:57.83422	2
921	10064	1	Q3	25	2026-02-18 02:39:58.540441	3
922	10064	1	Q9	50	2026-02-18 02:39:59.083466	9
923	10064	2	Q13	75	2026-02-18 02:39:59.537893	13
924	10064	2	Q17	100	2026-02-18 02:40:00.042446	17
925	10064	2	Q18	100	2026-02-18 02:40:00.517136	18
926	10064	2	Q19	100	2026-02-18 02:40:01.400981	19
927	10064	3	Q20	75	2026-02-18 02:40:01.998339	20
928	10064	3	Q21	100	2026-02-18 02:40:02.527449	21
929	10064	3	Q23	75	2026-02-18 02:40:03.019232	23
930	10064	3	Q25	100	2026-02-18 02:40:03.986956	25
931	10064	3	Q26	100	2026-02-18 02:40:04.477196	26
932	10064	3	Q28	100	2026-02-18 02:40:04.968074	28
933	10064	4	Q31	75	2026-02-18 02:40:05.429382	31
934	10064	4	Q32	100	2026-02-18 02:40:06.008926	32
935	10064	4	Q33	75	2026-02-18 02:40:06.515467	33
936	10064	4	Q34	50	2026-02-18 02:40:07.023473	34
937	10064	5	Q35	25	2026-02-18 02:40:07.530531	35
938	10064	5	Q38	0	2026-02-18 02:40:08.367095	38
939	10064	5	Q41	50	2026-02-18 02:40:09.137341	41
940	10064	6	Q43	75	2026-02-18 02:40:09.85807	43
941	10064	6	Q45	100	2026-02-18 02:40:10.630414	45
942	10064	7	Q48	100	2026-02-18 02:40:11.191096	48
943	10064	7	Q52	75	2026-02-18 02:40:11.680181	52
944	10064	7	Q55	100	2026-02-18 02:40:12.516929	55
945	10064	8	Q56	100	2026-02-18 02:40:13.205304	56
946	10064	8	Q57	75	2026-02-18 02:40:13.775422	57
947	10064	8	Q58	100	2026-02-18 02:40:14.333286	58
948	10064	9	Q59	75	2026-02-18 02:40:14.8612	59
949	10064	9	Q61	50	2026-02-18 02:40:15.377007	61
950	10064	9	Q62	100	2026-02-18 02:40:16.056949	62
951	10064	9	Q64	100	2026-02-18 02:40:16.772878	64
952	10064	10	Q65	100	2026-02-18 02:40:17.617969	65
953	10064	10	Q66	100	2026-02-18 02:40:18.266391	66
954	10064	10	Q68	100	2026-02-18 02:40:18.825728	68
955	10064	10	Q70	100	2026-02-18 02:40:19.323896	70
956	10065	1	Q1	75	2026-02-18 03:05:13.369689	1
957	10065	1	Q2	100	2026-02-18 03:05:13.925407	2
958	10065	1	Q3	75	2026-02-18 03:05:14.603109	3
959	10065	1	Q9	75	2026-02-18 03:05:15.126743	9
960	10065	2	Q13	50	2026-02-18 03:05:15.515008	13
961	10065	2	Q17	50	2026-02-18 03:05:15.948486	17
962	10065	2	Q18	75	2026-02-18 03:05:16.368	18
963	10065	2	Q19	75	2026-02-18 03:05:16.819202	19
964	10065	3	Q20	25	2026-02-18 03:05:17.46822	20
965	10065	3	Q21	25	2026-02-18 03:05:17.976063	21
966	10065	3	Q23	25	2026-02-18 03:05:18.525524	23
967	10065	3	Q25	0	2026-02-18 03:05:19.044556	25
968	10065	3	Q26	0	2026-02-18 03:05:19.577462	26
969	10065	3	Q28	25	2026-02-18 03:05:20.214826	28
970	10065	4	Q31	50	2026-02-18 03:05:20.790108	31
971	10065	4	Q32	75	2026-02-18 03:05:21.37243	32
972	10065	4	Q33	100	2026-02-18 03:05:21.994538	33
973	10065	4	Q34	100	2026-02-18 03:05:22.416307	34
974	10065	5	Q35	75	2026-02-18 03:05:22.964664	35
975	10065	5	Q38	75	2026-02-18 03:05:23.382196	38
976	10065	5	Q41	50	2026-02-18 03:05:23.931446	41
977	10065	6	Q43	50	2026-02-18 03:05:24.394184	43
978	10065	6	Q45	75	2026-02-18 03:05:24.941622	45
979	10065	7	Q48	100	2026-02-18 03:05:25.521446	48
980	10065	7	Q52	75	2026-02-18 03:05:26.104931	52
981	10065	7	Q55	75	2026-02-18 03:05:27.001015	55
982	10065	8	Q56	100	2026-02-18 03:05:27.666187	56
983	10065	8	Q57	75	2026-02-18 03:05:28.222015	57
984	10065	8	Q58	100	2026-02-18 03:05:28.749207	58
985	10065	9	Q59	75	2026-02-18 03:05:29.255107	59
986	10065	9	Q61	100	2026-02-18 03:05:29.789802	61
987	10065	9	Q62	75	2026-02-18 03:05:30.310185	62
988	10065	9	Q64	75	2026-02-18 03:05:31.023299	64
989	10065	10	Q65	100	2026-02-18 03:05:31.419839	65
990	10065	10	Q66	75	2026-02-18 03:05:31.922502	66
991	10065	10	Q68	100	2026-02-18 03:05:32.417296	68
992	10065	10	Q70	50	2026-02-18 03:05:33.127612	70
993	10066	1	Q1	50	2026-02-18 11:08:05.732778	1
994	10066	1	Q2	50	2026-02-18 11:08:06.266356	2
995	10066	1	Q3	75	2026-02-18 11:08:07.106017	3
996	10066	1	Q9	75	2026-02-18 11:08:07.645725	9
997	10066	2	Q13	100	2026-02-18 11:08:08.211264	13
998	10066	2	Q17	100	2026-02-18 11:08:08.742313	17
999	10066	2	Q18	75	2026-02-18 11:08:09.187246	18
1000	10066	2	Q19	75	2026-02-18 11:08:09.666636	19
1001	10066	3	Q20	50	2026-02-18 11:08:10.16811	20
1002	10066	3	Q21	50	2026-02-18 11:08:10.567488	21
1003	10066	3	Q23	75	2026-02-18 11:08:10.998488	23
1004	10066	3	Q25	100	2026-02-18 11:08:11.822022	25
1005	10066	3	Q26	75	2026-02-18 11:08:12.449267	26
1006	10066	3	Q28	100	2026-02-18 11:08:13.038297	28
1007	10066	4	Q31	75	2026-02-18 11:08:13.567283	31
1008	10066	4	Q32	100	2026-02-18 11:08:14.125886	32
1009	10066	4	Q33	75	2026-02-18 11:08:14.679404	33
1010	10066	4	Q34	50	2026-02-18 11:08:15.393677	34
1011	10066	5	Q35	25	2026-02-18 11:08:16.171446	35
1012	10066	5	Q38	75	2026-02-18 11:08:17.08467	38
1013	10066	5	Q41	50	2026-02-18 11:08:17.605858	41
1014	10066	6	Q43	75	2026-02-18 11:08:18.160522	43
1015	10066	6	Q45	50	2026-02-18 11:08:18.702231	45
1016	10066	7	Q48	75	2026-02-18 11:08:19.218034	48
1017	10066	7	Q52	50	2026-02-18 11:08:19.748227	52
1018	10066	7	Q55	25	2026-02-18 11:08:20.287992	55
1019	10066	8	Q56	50	2026-02-18 11:08:20.85651	56
1020	10066	8	Q57	75	2026-02-18 11:08:21.410157	57
1021	10066	8	Q58	50	2026-02-18 11:08:22.032704	58
1022	10066	9	Q59	75	2026-02-18 11:08:22.576208	59
1023	10066	9	Q61	100	2026-02-18 11:08:23.183479	61
1024	10066	9	Q62	100	2026-02-18 11:08:23.642455	62
1025	10066	9	Q64	75	2026-02-18 11:08:24.12389	64
1026	10066	10	Q65	50	2026-02-18 11:08:24.897545	65
1027	10066	10	Q66	75	2026-02-18 11:08:25.421952	66
1028	10066	10	Q68	75	2026-02-18 11:08:25.909417	68
1029	10066	10	Q70	50	2026-02-18 11:08:26.740274	70
1030	10068	1	Q1	50	2026-02-23 21:00:32.622297	1
1031	10068	1	Q2	75	2026-02-23 21:00:41.026244	2
1032	10068	1	Q3	100	2026-02-23 21:00:49.937492	3
1033	10068	1	Q9	100	2026-02-23 21:00:58.619958	9
1034	10068	2	Q13	100	2026-02-23 21:01:06.461993	13
1035	10068	2	Q17	100	2026-02-23 21:01:12.906338	17
1036	10068	2	Q18	100	2026-02-23 21:01:19.7352	18
1037	10068	2	Q19	75	2026-02-23 21:01:27.838332	19
1038	10068	3	Q20	75	2026-02-23 21:01:35.589534	20
1039	10068	3	Q21	75	2026-02-23 21:01:43.334761	21
1040	10068	3	Q23	75	2026-02-23 21:01:52.322159	23
1041	10068	3	Q25	75	2026-02-23 21:02:00.293023	25
1042	10068	3	Q26	75	2026-02-23 21:02:09.133048	26
1043	10068	3	Q28	75	2026-02-23 21:02:18.386216	28
1044	10068	4	Q31	100	2026-02-23 21:02:25.092477	31
1045	10068	4	Q32	50	2026-02-23 21:02:30.055061	32
1046	10068	4	Q33	75	2026-02-23 21:06:08.262129	33
1047	10068	4	Q34	100	2026-02-23 21:06:15.082533	34
1048	10068	5	Q35	75	2026-02-23 21:06:21.600684	35
1049	10068	5	Q38	100	2026-02-23 21:06:26.144794	38
1050	10068	5	Q41	50	2026-02-23 21:06:31.510639	41
1051	10068	6	Q43	50	2026-02-23 21:06:37.657017	43
1052	10068	6	Q45	100	2026-02-23 21:06:43.095309	45
1053	10068	7	Q48	50	2026-02-23 21:06:48.047588	48
1054	10068	7	Q52	50	2026-02-23 21:08:07.437409	52
1055	10068	7	Q55	100	2026-02-23 21:08:13.442868	55
1056	10068	8	Q56	100	2026-02-23 21:08:19.622909	56
1057	10068	8	Q57	100	2026-02-23 21:08:26.199664	57
1058	10068	8	Q58	75	2026-02-23 21:08:32.815319	58
1059	10068	9	Q59	50	2026-02-23 21:08:57.235554	59
1060	10068	9	Q61	75	2026-02-23 21:09:03.754161	61
1061	10068	9	Q62	50	2026-02-23 21:09:18.19063	62
1062	10068	9	Q64	75	2026-02-23 21:09:27.392035	64
1063	10068	10	Q65	100	2026-02-23 21:09:37.975981	65
1064	10068	10	Q66	50	2026-02-23 21:09:42.370683	66
1065	10068	10	Q68	75	2026-02-23 21:09:47.791448	68
1066	10068	10	Q70	75	2026-02-23 21:09:57.811534	70
1070	10069	1	Q1	75	2026-02-23 23:10:54.090365	1
1071	10069	1	Q2	100	2026-02-23 23:11:00.232218	2
1072	10069	1	Q3	75	2026-02-23 23:11:04.994348	3
1073	10069	1	Q9	75	2026-02-23 23:11:15.047634	9
1074	10069	2	Q13	75	2026-02-23 23:11:50.267627	13
1075	10069	2	Q17	75	2026-02-23 23:12:07.149147	17
1076	10069	2	Q18	75	2026-02-23 23:12:15.838687	18
1077	10069	2	Q19	50	2026-02-23 23:12:22.744183	19
1078	10069	3	Q20	75	2026-02-23 23:12:27.935574	20
1079	10071	1	Q1	0	2026-02-23 23:12:28.0727	1
1080	10071	1	Q2	50	2026-02-23 23:12:33.019305	2
1081	10069	3	Q21	75	2026-02-23 23:12:34.068169	21
1082	10071	1	Q3	25	2026-02-23 23:12:38.052438	3
1083	10069	3	Q23	75	2026-02-23 23:12:39.290406	23
1084	10071	1	Q9	50	2026-02-23 23:12:43.343373	9
1085	10069	3	Q25	50	2026-02-23 23:12:44.180399	25
1086	10071	2	Q13	25	2026-02-23 23:12:48.13967	13
1087	10069	3	Q26	50	2026-02-23 23:12:49.121646	26
1088	10071	2	Q17	0	2026-02-23 23:12:53.365253	17
1089	10069	3	Q28	50	2026-02-23 23:12:54.139503	28
1090	10069	4	Q31	50	2026-02-23 23:13:00.088363	31
1091	10071	2	Q18	25	2026-02-23 23:13:00.79834	18
1092	10071	2	Q19	50	2026-02-23 23:13:05.676293	19
1093	10069	4	Q32	50	2026-02-23 23:13:06.520987	32
1094	10071	3	Q20	25	2026-02-23 23:13:10.777863	20
1095	10069	4	Q33	50	2026-02-23 23:13:11.590241	33
1096	10071	3	Q21	0	2026-02-23 23:13:15.861607	21
1097	10069	4	Q34	25	2026-02-23 23:13:16.666058	34
1098	10071	3	Q23	0	2026-02-23 23:13:20.877345	23
1099	10069	5	Q35	25	2026-02-23 23:13:21.856656	35
1100	10071	3	Q25	25	2026-02-23 23:13:25.836121	25
1101	10069	5	Q38	25	2026-02-23 23:13:26.728531	38
1102	10071	3	Q26	75	2026-02-23 23:13:31.167532	26
1103	10069	5	Q41	25	2026-02-23 23:13:32.043978	41
1104	10071	3	Q28	100	2026-02-23 23:13:36.075337	28
1105	10069	6	Q43	75	2026-02-23 23:13:36.89855	43
1106	10071	4	Q31	75	2026-02-23 23:13:41.002805	31
1107	10069	6	Q45	75	2026-02-23 23:13:41.629835	45
1108	10071	4	Q32	100	2026-02-23 23:13:46.664114	32
1109	10069	7	Q48	75	2026-02-23 23:13:47.344533	48
1110	10071	4	Q33	50	2026-02-23 23:13:51.576077	33
1111	10069	7	Q52	75	2026-02-23 23:13:52.403039	52
1112	10071	4	Q34	75	2026-02-23 23:13:58.066637	34
1113	10069	7	Q55	75	2026-02-23 23:13:59.054376	55
1114	10071	5	Q35	50	2026-02-23 23:14:04.241088	35
1115	10069	8	Q56	75	2026-02-23 23:14:05.237187	56
1116	10071	5	Q38	25	2026-02-23 23:14:10.214248	38
1117	10069	8	Q57	75	2026-02-23 23:14:11.092545	57
1118	10071	5	Q41	50	2026-02-23 23:14:16.076628	41
1119	10069	8	Q58	75	2026-02-23 23:14:16.744876	58
1120	10071	6	Q43	100	2026-02-23 23:14:20.993772	43
1121	10069	9	Q59	75	2026-02-23 23:14:22.041472	59
1122	10071	6	Q45	50	2026-02-23 23:14:25.967181	45
1123	10069	9	Q61	75	2026-02-23 23:14:26.42016	61
1124	10071	7	Q48	25	2026-02-23 23:14:31.24276	48
1125	10069	9	Q62	75	2026-02-23 23:14:31.695411	62
1126	10071	7	Q52	100	2026-02-23 23:14:36.187993	52
1129	10069	10	Q65	25	2026-02-23 23:14:41.87638	65
1130	10071	8	Q56	50	2026-02-23 23:14:45.808329	56
1132	10071	8	Q57	0	2026-02-23 23:14:50.67296	57
1135	10069	10	Q70	50	2026-02-23 23:14:56.712464	70
1137	10071	9	Q61	100	2026-02-23 23:15:06.075594	61
1139	10071	9	Q64	25	2026-02-23 23:15:30.023711	64
1140	10071	10	Q65	75	2026-02-23 23:15:35.418495	65
1141	10071	10	Q66	75	2026-02-23 23:15:45.801899	66
1142	10071	10	Q68	50	2026-02-23 23:15:50.726288	68
1143	10071	10	Q70	75	2026-02-23 23:15:55.79712	70
1355	10072	1	Q1	75	2026-02-27 15:14:36.458569	1
1383	10072	8	Q56	75	2026-02-27 15:33:07.773114	56
1384	10072	8	Q57	50	2026-02-27 15:33:08.386005	57
1390	10072	9	Q61	50	2026-02-27 15:33:09.434252	61
1396	10072	10	Q65	25	2026-02-27 15:33:10.774203	65
1402	10084	1	Q2	75	2026-03-03 14:37:26.671953	2
1460	10086	3	Q21	25	2026-03-09 02:04:59.029222	21
1471	10086	4	Q33	0	2026-03-09 02:05:46.193553	33
1472	10087	2	Q13	50	2026-03-09 02:05:50.027043	13
1473	10086	4	Q34	50	2026-03-09 02:05:51.248546	34
1474	10086	5	Q35	75	2026-03-09 02:05:56.117238	35
1475	10086	5	Q38	100	2026-03-09 02:06:00.867988	38
1476	10086	5	Q41	50	2026-03-09 02:06:05.840091	41
1477	10086	6	Q43	75	2026-03-09 02:06:10.931024	43
1478	10086	6	Q45	50	2026-03-09 02:06:15.133993	45
1479	10086	7	Q48	75	2026-03-09 02:06:20.259362	48
1485	10086	8	Q57	25	2026-03-09 02:06:42.040294	57
1486	10087	2	Q19	25	2026-03-09 02:06:46.985531	19
1127	10069	9	Q64	75	2026-02-23 23:14:36.803687	64
1128	10071	7	Q55	25	2026-02-23 23:14:41.126978	55
1131	10069	10	Q66	50	2026-02-23 23:14:47.142217	66
1133	10069	10	Q68	50	2026-02-23 23:14:51.488068	68
1134	10071	8	Q58	25	2026-02-23 23:14:55.704504	58
1136	10071	9	Q59	75	2026-02-23 23:15:01.167888	59
1138	10071	9	Q62	25	2026-02-23 23:15:12.945732	62
1144	10073	1	Q1	75	2026-02-24 00:33:52.616436	1
1145	10073	1	Q2	50	2026-02-24 00:33:58.142244	2
1146	10073	1	Q3	75	2026-02-24 00:34:03.215949	3
1147	10074	1	Q1	50	2026-02-25 18:30:54.07043	1
1148	10074	1	Q2	50	2026-02-25 18:30:59.94652	2
1149	10074	1	Q3	50	2026-02-25 18:31:05.280488	3
1150	10074	1	Q9	50	2026-02-25 18:31:26.01867	9
1151	10074	2	Q13	50	2026-02-25 18:31:38.013522	13
1152	10074	2	Q17	50	2026-02-25 18:31:43.114499	17
1153	10074	2	Q18	50	2026-02-25 18:31:47.879565	18
1154	10074	2	Q19	50	2026-02-25 18:31:52.366734	19
1155	10074	3	Q20	25	2026-02-25 18:31:56.543449	20
1156	10074	3	Q21	50	2026-02-25 18:32:00.653311	21
1157	10074	3	Q23	75	2026-02-25 18:32:04.712105	23
1158	10074	3	Q25	50	2026-02-25 18:32:09.492067	25
1159	10074	3	Q26	50	2026-02-25 18:32:13.854233	26
1160	10074	3	Q28	75	2026-02-25 18:32:18.274288	28
1161	10074	4	Q31	50	2026-02-25 18:32:23.135952	31
1162	10074	4	Q32	75	2026-02-25 18:32:27.594804	32
1163	10074	4	Q33	50	2026-02-25 18:32:31.885167	33
1164	10074	4	Q34	50	2026-02-25 18:32:37.607528	34
1165	10074	5	Q35	50	2026-02-25 18:32:43.458533	35
1166	10074	5	Q38	50	2026-02-25 18:32:48.980551	38
1167	10074	5	Q41	75	2026-02-25 18:32:54.040382	41
1168	10074	6	Q43	50	2026-02-25 18:33:06.532527	43
1169	10074	6	Q45	75	2026-02-25 18:33:11.436069	45
1170	10074	7	Q48	75	2026-02-25 18:33:16.678659	48
1171	10074	7	Q52	50	2026-02-25 18:33:21.433573	52
1172	10074	7	Q55	50	2026-02-25 18:33:26.201322	55
1173	10074	8	Q56	50	2026-02-25 18:33:31.58386	56
1174	10074	8	Q57	50	2026-02-25 18:33:36.573121	57
1175	10074	8	Q58	50	2026-02-25 18:33:42.112751	58
1176	10074	9	Q59	50	2026-02-25 18:33:47.377361	59
1177	10074	9	Q61	50	2026-02-25 18:33:51.691242	61
1178	10074	9	Q62	50	2026-02-25 18:33:55.934759	62
1179	10074	9	Q64	75	2026-02-25 18:34:00.024118	64
1180	10074	10	Q65	75	2026-02-25 18:34:05.661591	65
1181	10074	10	Q66	50	2026-02-25 18:34:10.125218	66
1182	10074	10	Q68	50	2026-02-25 18:34:14.401777	68
1183	10074	10	Q70	50	2026-02-25 18:34:19.209047	70
1184	10076	1	Q1	50	2026-02-27 05:45:32.825465	1
1185	10076	1	Q2	75	2026-02-27 05:45:34.559353	2
1186	10076	1	Q3	100	2026-02-27 05:52:38.439441	3
1187	10076	1	Q9	75	2026-02-27 05:52:43.119098	9
1188	10076	2	Q13	100	2026-02-27 05:52:51.265246	13
1189	10076	2	Q17	50	2026-02-27 05:53:00.243362	17
1190	10076	2	Q18	75	2026-02-27 05:54:53.532903	18
1191	10076	2	Q19	100	2026-02-27 05:54:54.637953	19
1192	10076	3	Q20	75	2026-02-27 05:55:00.682483	20
1193	10076	3	Q21	100	2026-02-27 05:55:28.64551	21
1194	10076	3	Q23	75	2026-02-27 05:56:02.228153	23
1195	10076	3	Q25	100	2026-02-27 05:56:03.675949	25
1196	10076	3	Q26	75	2026-02-27 05:56:05.109985	26
1197	10076	3	Q28	50	2026-02-27 05:56:13.456315	28
1198	10076	4	Q31	75	2026-02-27 05:56:22.176381	31
1199	10076	4	Q32	100	2026-02-27 05:56:23.96318	32
1200	10076	4	Q33	50	2026-02-27 05:56:27.688564	33
1201	10076	4	Q34	75	2026-02-27 05:56:30.867296	34
1202	10076	5	Q35	75	2026-02-27 05:56:35.171228	35
1203	10077	1	Q1	50	2026-02-27 13:00:37.774426	1
1204	10077	1	Q2	75	2026-02-27 13:00:38.908596	2
1205	10077	1	Q3	75	2026-02-27 13:00:40.329916	3
1206	10077	1	Q9	75	2026-02-27 13:00:41.354403	9
1207	10077	2	Q13	75	2026-02-27 13:00:42.334239	13
1208	10077	2	Q17	75	2026-02-27 13:00:43.268383	17
1209	10077	2	Q18	75	2026-02-27 13:00:44.165869	18
1210	10077	2	Q19	75	2026-02-27 13:00:45.055976	19
1211	10077	3	Q20	75	2026-02-27 13:00:45.930244	20
1212	10077	3	Q21	50	2026-02-27 13:00:46.857658	21
1213	10077	3	Q23	50	2026-02-27 13:00:47.720453	23
1214	10077	3	Q25	50	2026-02-27 13:00:48.568476	25
1215	10077	3	Q26	50	2026-02-27 13:00:49.386308	26
1216	10077	3	Q28	50	2026-02-27 13:00:49.852913	28
1217	10077	4	Q31	50	2026-02-27 13:00:50.368783	31
1218	10077	4	Q32	50	2026-02-27 13:00:50.888008	32
1219	10077	4	Q33	100	2026-02-27 13:00:51.559281	33
1220	10077	4	Q34	100	2026-02-27 13:00:52.130491	34
1221	10077	5	Q35	75	2026-02-27 13:00:52.945734	35
1222	10077	5	Q38	75	2026-02-27 13:00:53.89443	38
1223	10077	5	Q41	50	2026-02-27 13:00:54.799939	41
1224	10077	6	Q43	25	2026-02-27 13:00:55.807963	43
1225	10077	6	Q45	25	2026-02-27 13:00:56.365323	45
1226	10077	7	Q48	25	2026-02-27 13:00:57.052106	48
1227	10077	7	Q52	0	2026-02-27 13:00:57.6002	52
1228	10077	7	Q55	0	2026-02-27 13:00:58.113171	55
1229	10077	8	Q56	0	2026-02-27 13:00:58.697583	56
1230	10077	8	Q57	25	2026-02-27 13:00:59.162411	57
1231	10077	8	Q58	25	2026-02-27 13:00:59.634196	58
1232	10077	9	Q59	50	2026-02-27 13:01:00.133557	59
1233	10077	9	Q61	50	2026-02-27 13:01:00.556629	61
1234	10077	9	Q62	100	2026-02-27 13:01:01.170178	62
1235	10077	9	Q64	100	2026-02-27 13:01:01.594978	64
1236	10077	10	Q65	100	2026-02-27 13:01:02.087948	65
1237	10077	10	Q66	100	2026-02-27 13:01:03.493196	66
1238	10077	10	Q68	100	2026-02-27 13:01:04.47591	68
1239	10077	10	Q70	100	2026-02-27 13:01:05.880395	70
1356	10072	1	Q3	75	2026-02-27 15:14:36.508274	3
1357	10072	1	Q9	100	2026-02-27 15:14:37.071083	9
1358	10072	2	Q13	75	2026-02-27 15:14:37.723568	13
1359	10072	2	Q17	100	2026-02-27 15:14:38.291301	17
1360	10072	2	Q18	75	2026-02-27 15:14:38.934604	18
1361	10072	2	Q19	100	2026-02-27 15:14:39.449211	19
1362	10072	3	Q20	50	2026-02-27 15:19:28.671317	20
1363	10072	3	Q21	75	2026-02-27 15:19:29.107125	21
1364	10072	3	Q23	100	2026-02-27 15:19:29.521526	23
1365	10072	3	Q25	75	2026-02-27 15:19:30.066648	25
1366	10072	3	Q26	50	2026-02-27 15:19:30.751562	26
1367	10072	3	Q28	75	2026-02-27 15:19:31.410319	28
1368	10072	4	Q31	100	2026-02-27 15:19:31.967617	31
1404	10084	1	Q3	100	2026-03-03 14:37:26.767266	3
1405	10084	1	Q9	75	2026-03-03 14:37:27.194037	9
\.


--
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.resultados (id, avaliacao_id, grupo, dominio, score, categoria, criado_em) FROM stdin;
1	10004	1	Demandas no Trabalho	68.75	alto	2026-02-10 12:39:16.476283
2	10004	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-10 12:39:16.728563
3	10004	3	Relações Sociais e Liderança	70.83	alto	2026-02-10 12:39:16.962587
4	10004	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-10 12:39:17.197026
5	10004	5	Valores Organizacionais	66.67	alto	2026-02-10 12:39:17.431558
6	10004	6	Traços de Personalidade	75.00	alto	2026-02-10 12:39:17.666156
7	10004	7	Saúde e Bem-Estar	66.67	alto	2026-02-10 12:39:17.899844
8	10004	8	Comportamentos Ofensivos	83.33	alto	2026-02-10 12:39:18.134272
9	10004	9	Comportamento de Jogo	87.50	alto	2026-02-10 12:39:18.368264
10	10004	10	Endividamento Financeiro	93.75	alto	2026-02-10 12:39:18.60169
11	10005	1	Demandas no Trabalho	68.75	alto	2026-02-10 14:03:43.243954
12	10005	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-10 14:03:43.488917
13	10005	3	Relações Sociais e Liderança	58.33	medio	2026-02-10 14:03:43.747922
14	10005	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-02-10 14:03:44.005986
15	10005	5	Valores Organizacionais	50.00	medio	2026-02-10 14:03:44.256209
16	10005	6	Traços de Personalidade	50.00	medio	2026-02-10 14:03:44.499191
17	10005	7	Saúde e Bem-Estar	50.00	medio	2026-02-10 14:03:44.74271
18	10005	8	Comportamentos Ofensivos	50.00	medio	2026-02-10 14:03:44.991605
19	10005	9	Comportamento de Jogo	6.25	baixo	2026-02-10 14:03:45.237957
20	10005	10	Endividamento Financeiro	56.25	medio	2026-02-10 14:03:45.490208
31	10010	1	Demandas no Trabalho	75.00	alto	2026-02-10 15:59:09.685745
32	10010	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-02-10 15:59:09.952456
33	10010	3	Relações Sociais e Liderança	62.50	medio	2026-02-10 15:59:10.188316
34	10010	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-10 15:59:10.424043
35	10010	5	Valores Organizacionais	75.00	alto	2026-02-10 15:59:10.659029
36	10010	6	Traços de Personalidade	75.00	alto	2026-02-10 15:59:10.895579
37	10010	7	Saúde e Bem-Estar	91.67	alto	2026-02-10 15:59:11.13178
38	10010	8	Comportamentos Ofensivos	50.00	medio	2026-02-10 15:59:11.366763
39	10010	9	Comportamento de Jogo	75.00	alto	2026-02-10 15:59:11.603479
40	10010	10	Endividamento Financeiro	81.25	alto	2026-02-10 15:59:11.837868
61	10011	1	Demandas no Trabalho	75.00	alto	2026-02-10 16:29:35.288036
62	10011	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-10 16:29:35.288036
63	10011	3	Relações Sociais e Liderança	33.33	medio	2026-02-10 16:29:35.288036
64	10011	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-10 16:29:35.288036
65	10011	5	Valores Organizacionais	50.00	medio	2026-02-10 16:29:35.288036
66	10011	6	Traços de Personalidade	50.00	medio	2026-02-10 16:29:35.288036
67	10011	7	Saúde e Bem-Estar	41.67	medio	2026-02-10 16:29:35.288036
68	10011	8	Comportamentos Ofensivos	41.67	medio	2026-02-10 16:29:35.288036
69	10011	9	Comportamento de Jogo	50.00	medio	2026-02-10 16:29:35.288036
70	10011	10	Endividamento Financeiro	62.50	medio	2026-02-10 16:29:35.288036
71	10006	1	Demandas no Trabalho	62.50	medio	2026-02-10 16:39:11.716723
72	10006	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-10 16:39:11.716723
73	10006	3	Relações Sociais e Liderança	41.67	medio	2026-02-10 16:39:11.716723
74	10006	4	Interface Trabalho-Indivíduo	0.00	baixo	2026-02-10 16:39:11.716723
75	10006	5	Valores Organizacionais	41.67	medio	2026-02-10 16:39:11.716723
76	10006	6	Traços de Personalidade	25.00	baixo	2026-02-10 16:39:11.716723
77	10006	7	Saúde e Bem-Estar	25.00	baixo	2026-02-10 16:39:11.716723
78	10006	8	Comportamentos Ofensivos	25.00	baixo	2026-02-10 16:39:11.716723
79	10006	9	Comportamento de Jogo	25.00	baixo	2026-02-10 16:39:11.716723
80	10006	10	Endividamento Financeiro	25.00	baixo	2026-02-10 16:39:11.716723
81	10007	1	Demandas no Trabalho	31.25	baixo	2026-02-10 16:53:16.783516
82	10007	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-10 16:53:16.783516
83	10007	3	Relações Sociais e Liderança	54.17	medio	2026-02-10 16:53:16.783516
84	10007	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-10 16:53:16.783516
85	10007	5	Valores Organizacionais	41.67	medio	2026-02-10 16:53:16.783516
86	10007	6	Traços de Personalidade	25.00	baixo	2026-02-10 16:53:16.783516
87	10007	7	Saúde e Bem-Estar	33.33	medio	2026-02-10 16:53:16.783516
88	10007	8	Comportamentos Ofensivos	58.33	medio	2026-02-10 16:53:16.783516
89	10007	9	Comportamento de Jogo	75.00	alto	2026-02-10 16:53:16.783516
90	10007	10	Endividamento Financeiro	56.25	medio	2026-02-10 16:53:16.783516
91	10013	1	Demandas no Trabalho	50.00	medio	2026-02-11 01:12:17.053789
92	10013	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-11 01:12:17.053789
93	10013	3	Relações Sociais e Liderança	75.00	alto	2026-02-11 01:12:17.053789
94	10013	4	Interface Trabalho-Indivíduo	68.75	alto	2026-02-11 01:12:17.053789
95	10013	5	Valores Organizacionais	33.33	medio	2026-02-11 01:12:17.053789
96	10013	6	Traços de Personalidade	75.00	alto	2026-02-11 01:12:17.053789
97	10013	7	Saúde e Bem-Estar	66.67	alto	2026-02-11 01:12:17.053789
98	10013	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:12:17.053789
99	10013	9	Comportamento de Jogo	68.75	alto	2026-02-11 01:12:17.053789
100	10013	10	Endividamento Financeiro	25.00	baixo	2026-02-11 01:12:17.053789
101	10012	1	Demandas no Trabalho	68.75	alto	2026-02-11 01:14:43.757296
102	10012	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-11 01:14:43.757296
103	10012	3	Relações Sociais e Liderança	79.17	alto	2026-02-11 01:14:43.757296
104	10012	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-11 01:14:43.757296
105	10012	5	Valores Organizacionais	50.00	medio	2026-02-11 01:14:43.757296
106	10012	6	Traços de Personalidade	37.50	medio	2026-02-11 01:14:43.757296
107	10012	7	Saúde e Bem-Estar	58.33	medio	2026-02-11 01:14:43.757296
108	10012	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:14:43.757296
109	10012	9	Comportamento de Jogo	62.50	medio	2026-02-11 01:14:43.757296
110	10012	10	Endividamento Financeiro	68.75	alto	2026-02-11 01:14:43.757296
111	10014	1	Demandas no Trabalho	56.25	medio	2026-02-11 01:57:55.987926
112	10014	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-11 01:57:55.987926
113	10014	3	Relações Sociais e Liderança	66.67	alto	2026-02-11 01:57:55.987926
114	10014	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-11 01:57:55.987926
115	10014	5	Valores Organizacionais	75.00	alto	2026-02-11 01:57:55.987926
116	10014	6	Traços de Personalidade	87.50	alto	2026-02-11 01:57:55.987926
117	10014	7	Saúde e Bem-Estar	50.00	medio	2026-02-11 01:57:55.987926
118	10014	8	Comportamentos Ofensivos	50.00	medio	2026-02-11 01:57:55.987926
119	10014	9	Comportamento de Jogo	75.00	alto	2026-02-11 01:57:55.987926
120	10014	10	Endividamento Financeiro	56.25	medio	2026-02-11 01:57:55.987926
121	10015	1	Demandas no Trabalho	50.00	medio	2026-02-11 02:01:46.606336
122	10015	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-11 02:01:46.606336
123	10015	3	Relações Sociais e Liderança	58.33	medio	2026-02-11 02:01:46.606336
124	10015	4	Interface Trabalho-Indivíduo	50.00	medio	2026-02-11 02:01:46.606336
125	10015	5	Valores Organizacionais	75.00	alto	2026-02-11 02:01:46.606336
126	10015	6	Traços de Personalidade	62.50	medio	2026-02-11 02:01:46.606336
127	10015	7	Saúde e Bem-Estar	66.67	alto	2026-02-11 02:01:46.606336
128	10015	8	Comportamentos Ofensivos	75.00	alto	2026-02-11 02:01:46.606336
129	10015	9	Comportamento de Jogo	62.50	medio	2026-02-11 02:01:46.606336
130	10015	10	Endividamento Financeiro	68.75	alto	2026-02-11 02:01:46.606336
131	10017	1	Demandas no Trabalho	56.25	medio	2026-02-12 12:30:53.219351
132	10017	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-12 12:30:53.219351
133	10017	3	Relações Sociais e Liderança	58.33	medio	2026-02-12 12:30:53.219351
134	10017	4	Interface Trabalho-Indivíduo	56.25	medio	2026-02-12 12:30:53.219351
135	10017	5	Valores Organizacionais	100.00	alto	2026-02-12 12:30:53.219351
136	10017	6	Traços de Personalidade	75.00	alto	2026-02-12 12:30:53.219351
137	10017	7	Saúde e Bem-Estar	16.67	baixo	2026-02-12 12:30:53.219351
138	10017	8	Comportamentos Ofensivos	25.00	baixo	2026-02-12 12:30:53.219351
139	10017	9	Comportamento de Jogo	50.00	medio	2026-02-12 12:30:53.219351
140	10017	10	Endividamento Financeiro	50.00	medio	2026-02-12 12:30:53.219351
141	10016	1	Demandas no Trabalho	81.25	alto	2026-02-12 12:31:15.029557
142	10016	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-12 12:31:15.029557
143	10016	3	Relações Sociais e Liderança	83.33	alto	2026-02-12 12:31:15.029557
144	10016	4	Interface Trabalho-Indivíduo	93.75	alto	2026-02-12 12:31:15.029557
145	10016	5	Valores Organizacionais	91.67	alto	2026-02-12 12:31:15.029557
146	10016	6	Traços de Personalidade	75.00	alto	2026-02-12 12:31:15.029557
147	10016	7	Saúde e Bem-Estar	100.00	alto	2026-02-12 12:31:15.029557
148	10016	8	Comportamentos Ofensivos	91.67	alto	2026-02-12 12:31:15.029557
149	10016	9	Comportamento de Jogo	93.75	alto	2026-02-12 12:31:15.029557
150	10016	10	Endividamento Financeiro	87.50	alto	2026-02-12 12:31:15.029557
151	10027	1	Demandas no Trabalho	68.75	alto	2026-02-12 23:52:18.708343
152	10027	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-02-12 23:52:18.708343
153	10027	3	Relações Sociais e Liderança	58.33	medio	2026-02-12 23:52:18.708343
154	10027	4	Interface Trabalho-Indivíduo	62.50	medio	2026-02-12 23:52:18.708343
155	10027	5	Valores Organizacionais	16.67	baixo	2026-02-12 23:52:18.708343
156	10027	6	Traços de Personalidade	62.50	medio	2026-02-12 23:52:18.708343
157	10027	7	Saúde e Bem-Estar	83.33	alto	2026-02-12 23:52:18.708343
158	10027	8	Comportamentos Ofensivos	75.00	alto	2026-02-12 23:52:18.708343
159	10027	9	Comportamento de Jogo	93.75	alto	2026-02-12 23:52:18.708343
160	10027	10	Endividamento Financeiro	56.25	medio	2026-02-12 23:52:18.708343
161	10030	1	Demandas no Trabalho	87.50	alto	2026-02-13 02:39:45.154975
162	10030	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-02-13 02:39:45.154975
163	10030	3	Relações Sociais e Liderança	45.83	medio	2026-02-13 02:39:45.154975
164	10030	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-02-13 02:39:45.154975
165	10030	5	Valores Organizacionais	33.33	medio	2026-02-13 02:39:45.154975
166	10030	6	Traços de Personalidade	25.00	baixo	2026-02-13 02:39:45.154975
167	10030	7	Saúde e Bem-Estar	58.33	medio	2026-02-13 02:39:45.154975
168	10030	8	Comportamentos Ofensivos	66.67	alto	2026-02-13 02:39:45.154975
169	10030	9	Comportamento de Jogo	87.50	alto	2026-02-13 02:39:45.154975
170	10030	10	Endividamento Financeiro	75.00	alto	2026-02-13 02:39:45.154975
171	10032	1	Demandas no Trabalho	43.75	medio	2026-02-13 02:46:44.678623
172	10032	2	Organização e Conteúdo do Trabalho	43.75	medio	2026-02-13 02:46:44.678623
173	10032	3	Relações Sociais e Liderança	37.50	medio	2026-02-13 02:46:44.678623
174	10032	4	Interface Trabalho-Indivíduo	62.50	medio	2026-02-13 02:46:44.678623
175	10032	5	Valores Organizacionais	66.67	alto	2026-02-13 02:46:44.678623
176	10032	6	Traços de Personalidade	87.50	alto	2026-02-13 02:46:44.678623
177	10032	7	Saúde e Bem-Estar	66.67	alto	2026-02-13 02:46:44.678623
178	10032	8	Comportamentos Ofensivos	83.33	alto	2026-02-13 02:46:44.678623
179	10032	9	Comportamento de Jogo	68.75	alto	2026-02-13 02:46:44.678623
180	10032	10	Endividamento Financeiro	81.25	alto	2026-02-13 02:46:44.678623
181	10035	1	Demandas no Trabalho	12.50	baixo	2026-02-13 13:01:13.834939
182	10035	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-13 13:01:13.834939
183	10035	3	Relações Sociais e Liderança	37.50	medio	2026-02-13 13:01:13.834939
184	10035	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-02-13 13:01:13.834939
185	10035	5	Valores Organizacionais	8.33	baixo	2026-02-13 13:01:13.834939
186	10035	6	Traços de Personalidade	25.00	baixo	2026-02-13 13:01:13.834939
187	10035	7	Saúde e Bem-Estar	66.67	alto	2026-02-13 13:01:13.834939
188	10035	8	Comportamentos Ofensivos	33.33	medio	2026-02-13 13:01:13.834939
189	10035	9	Comportamento de Jogo	75.00	alto	2026-02-13 13:01:13.834939
190	10035	10	Endividamento Financeiro	75.00	alto	2026-02-13 13:01:13.834939
191	10038	1	Demandas no Trabalho	50.00	medio	2026-02-16 14:36:28.133277
192	10038	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-16 14:36:28.133277
193	10038	3	Relações Sociais e Liderança	66.67	alto	2026-02-16 14:36:28.133277
194	10038	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-16 14:36:28.133277
195	10038	5	Valores Organizacionais	75.00	alto	2026-02-16 14:36:28.133277
196	10038	6	Traços de Personalidade	75.00	alto	2026-02-16 14:36:28.133277
197	10038	7	Saúde e Bem-Estar	50.00	medio	2026-02-16 14:36:28.133277
198	10038	8	Comportamentos Ofensivos	58.33	medio	2026-02-16 14:36:28.133277
199	10038	9	Comportamento de Jogo	75.00	alto	2026-02-16 14:36:28.133277
200	10038	10	Endividamento Financeiro	81.25	alto	2026-02-16 14:36:28.133277
201	10048	1	Demandas no Trabalho	68.75	alto	2026-02-16 18:38:20.790429
202	10048	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-02-16 18:38:20.790429
203	10048	3	Relações Sociais e Liderança	62.50	medio	2026-02-16 18:38:20.790429
204	10048	4	Interface Trabalho-Indivíduo	93.75	alto	2026-02-16 18:38:20.790429
205	10048	5	Valores Organizacionais	75.00	alto	2026-02-16 18:38:20.790429
206	10048	6	Traços de Personalidade	50.00	medio	2026-02-16 18:38:20.790429
207	10048	7	Saúde e Bem-Estar	58.33	medio	2026-02-16 18:38:20.790429
208	10048	8	Comportamentos Ofensivos	50.00	medio	2026-02-16 18:38:20.790429
209	10048	9	Comportamento de Jogo	62.50	medio	2026-02-16 18:38:20.790429
210	10048	10	Endividamento Financeiro	81.25	alto	2026-02-16 18:38:20.790429
211	10049	1	Demandas no Trabalho	43.75	medio	2026-02-17 00:44:13.186804
212	10049	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-17 00:44:13.186804
213	10049	3	Relações Sociais e Liderança	41.67	medio	2026-02-17 00:44:13.186804
214	10049	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-17 00:44:13.186804
215	10049	5	Valores Organizacionais	50.00	medio	2026-02-17 00:44:13.186804
216	10049	6	Traços de Personalidade	62.50	medio	2026-02-17 00:44:13.186804
217	10049	7	Saúde e Bem-Estar	83.33	alto	2026-02-17 00:44:13.186804
218	10049	8	Comportamentos Ofensivos	75.00	alto	2026-02-17 00:44:13.186804
219	10049	9	Comportamento de Jogo	81.25	alto	2026-02-17 00:44:13.186804
220	10049	10	Endividamento Financeiro	25.00	baixo	2026-02-17 00:44:13.186804
221	10052	1	Demandas no Trabalho	62.50	medio	2026-02-17 13:08:33.920096
222	10052	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-17 13:08:33.920096
223	10052	3	Relações Sociais e Liderança	37.50	medio	2026-02-17 13:08:33.920096
224	10052	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-17 13:08:33.920096
225	10052	5	Valores Organizacionais	66.67	alto	2026-02-17 13:08:33.920096
226	10052	6	Traços de Personalidade	50.00	medio	2026-02-17 13:08:33.920096
227	10052	7	Saúde e Bem-Estar	50.00	medio	2026-02-17 13:08:33.920096
228	10052	8	Comportamentos Ofensivos	41.67	medio	2026-02-17 13:08:33.920096
229	10052	9	Comportamento de Jogo	56.25	medio	2026-02-17 13:08:33.920096
230	10052	10	Endividamento Financeiro	43.75	medio	2026-02-17 13:08:33.920096
231	10055	1	Demandas no Trabalho	18.75	baixo	2026-02-17 16:23:21.273647
232	10055	2	Organização e Conteúdo do Trabalho	37.50	medio	2026-02-17 16:23:21.273647
233	10055	3	Relações Sociais e Liderança	37.50	medio	2026-02-17 16:23:21.273647
234	10055	4	Interface Trabalho-Indivíduo	37.50	medio	2026-02-17 16:23:21.273647
235	10055	5	Valores Organizacionais	25.00	baixo	2026-02-17 16:23:21.273647
236	10055	6	Traços de Personalidade	37.50	medio	2026-02-17 16:23:21.273647
237	10055	7	Saúde e Bem-Estar	41.67	medio	2026-02-17 16:23:21.273647
238	10055	8	Comportamentos Ofensivos	41.67	medio	2026-02-17 16:23:21.273647
239	10055	9	Comportamento de Jogo	37.50	medio	2026-02-17 16:23:21.273647
240	10055	10	Endividamento Financeiro	31.25	baixo	2026-02-17 16:23:21.273647
241	10058	1	Demandas no Trabalho	75.00	alto	2026-02-17 19:32:27.978558
242	10058	2	Organização e Conteúdo do Trabalho	56.25	medio	2026-02-17 19:32:27.978558
243	10058	3	Relações Sociais e Liderança	79.17	alto	2026-02-17 19:32:27.978558
244	10058	4	Interface Trabalho-Indivíduo	18.75	baixo	2026-02-17 19:32:27.978558
245	10058	5	Valores Organizacionais	33.33	medio	2026-02-17 19:32:27.978558
246	10058	6	Traços de Personalidade	87.50	alto	2026-02-17 19:32:27.978558
247	10058	7	Saúde e Bem-Estar	66.67	alto	2026-02-17 19:32:27.978558
248	10058	8	Comportamentos Ofensivos	75.00	alto	2026-02-17 19:32:27.978558
249	10058	9	Comportamento de Jogo	75.00	alto	2026-02-17 19:32:27.978558
250	10058	10	Endividamento Financeiro	68.75	alto	2026-02-17 19:32:27.978558
251	10061	1	Demandas no Trabalho	75.00	alto	2026-02-17 19:35:15.907672
252	10061	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-17 19:35:15.907672
253	10061	3	Relações Sociais e Liderança	33.33	medio	2026-02-17 19:35:15.907672
254	10061	4	Interface Trabalho-Indivíduo	87.50	alto	2026-02-17 19:35:15.907672
255	10061	5	Valores Organizacionais	75.00	alto	2026-02-17 19:35:15.907672
256	10061	6	Traços de Personalidade	62.50	medio	2026-02-17 19:35:15.907672
257	10061	7	Saúde e Bem-Estar	83.33	alto	2026-02-17 19:35:15.907672
258	10061	8	Comportamentos Ofensivos	33.33	medio	2026-02-17 19:35:15.907672
259	10061	9	Comportamento de Jogo	75.00	alto	2026-02-17 19:35:15.907672
260	10061	10	Endividamento Financeiro	93.75	alto	2026-02-17 19:35:15.907672
261	10062	1	Demandas no Trabalho	75.00	alto	2026-02-18 02:20:49.848543
262	10062	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-18 02:20:49.848543
263	10062	3	Relações Sociais e Liderança	83.33	alto	2026-02-18 02:20:49.848543
264	10062	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-18 02:20:49.848543
265	10062	5	Valores Organizacionais	8.33	baixo	2026-02-18 02:20:49.848543
266	10062	6	Traços de Personalidade	62.50	medio	2026-02-18 02:20:49.848543
267	10062	7	Saúde e Bem-Estar	91.67	alto	2026-02-18 02:20:49.848543
268	10062	8	Comportamentos Ofensivos	83.33	alto	2026-02-18 02:20:49.848543
269	10062	9	Comportamento de Jogo	87.50	alto	2026-02-18 02:20:49.848543
270	10062	10	Endividamento Financeiro	93.75	alto	2026-02-18 02:20:49.848543
271	10064	1	Demandas no Trabalho	56.25	medio	2026-02-18 02:40:19.824763
272	10064	2	Organização e Conteúdo do Trabalho	93.75	alto	2026-02-18 02:40:19.824763
273	10064	3	Relações Sociais e Liderança	91.67	alto	2026-02-18 02:40:19.824763
274	10064	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-18 02:40:19.824763
275	10064	5	Valores Organizacionais	25.00	baixo	2026-02-18 02:40:19.824763
276	10064	6	Traços de Personalidade	87.50	alto	2026-02-18 02:40:19.824763
277	10064	7	Saúde e Bem-Estar	91.67	alto	2026-02-18 02:40:19.824763
278	10064	8	Comportamentos Ofensivos	91.67	alto	2026-02-18 02:40:19.824763
279	10064	9	Comportamento de Jogo	81.25	alto	2026-02-18 02:40:19.824763
280	10064	10	Endividamento Financeiro	100.00	alto	2026-02-18 02:40:19.824763
281	10065	1	Demandas no Trabalho	81.25	alto	2026-02-18 03:05:33.556727
282	10065	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-02-18 03:05:33.556727
283	10065	3	Relações Sociais e Liderança	16.67	baixo	2026-02-18 03:05:33.556727
284	10065	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-18 03:05:33.556727
285	10065	5	Valores Organizacionais	66.67	alto	2026-02-18 03:05:33.556727
286	10065	6	Traços de Personalidade	62.50	medio	2026-02-18 03:05:33.556727
287	10065	7	Saúde e Bem-Estar	83.33	alto	2026-02-18 03:05:33.556727
288	10065	8	Comportamentos Ofensivos	91.67	alto	2026-02-18 03:05:33.556727
289	10065	9	Comportamento de Jogo	81.25	alto	2026-02-18 03:05:33.556727
290	10065	10	Endividamento Financeiro	81.25	alto	2026-02-18 03:05:33.556727
291	10066	1	Demandas no Trabalho	62.50	medio	2026-02-18 11:08:27.153951
292	10066	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-02-18 11:08:27.153951
293	10066	3	Relações Sociais e Liderança	75.00	alto	2026-02-18 11:08:27.153951
294	10066	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-18 11:08:27.153951
295	10066	5	Valores Organizacionais	50.00	medio	2026-02-18 11:08:27.153951
296	10066	6	Traços de Personalidade	62.50	medio	2026-02-18 11:08:27.153951
297	10066	7	Saúde e Bem-Estar	50.00	medio	2026-02-18 11:08:27.153951
298	10066	8	Comportamentos Ofensivos	58.33	medio	2026-02-18 11:08:27.153951
299	10066	9	Comportamento de Jogo	87.50	alto	2026-02-18 11:08:27.153951
300	10066	10	Endividamento Financeiro	62.50	medio	2026-02-18 11:08:27.153951
301	10068	1	Demandas no Trabalho	81.25	alto	2026-02-23 21:10:02.883383
302	10068	2	Organização e Conteúdo do Trabalho	93.75	alto	2026-02-23 21:10:02.883383
303	10068	3	Relações Sociais e Liderança	75.00	alto	2026-02-23 21:10:02.883383
304	10068	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-23 21:10:02.883383
305	10068	5	Valores Organizacionais	75.00	alto	2026-02-23 21:10:02.883383
306	10068	6	Traços de Personalidade	75.00	alto	2026-02-23 21:10:02.883383
307	10068	7	Saúde e Bem-Estar	66.67	alto	2026-02-23 21:10:02.883383
308	10068	8	Comportamentos Ofensivos	91.67	alto	2026-02-23 21:10:02.883383
309	10068	9	Comportamento de Jogo	62.50	medio	2026-02-23 21:10:02.883383
310	10068	10	Endividamento Financeiro	75.00	alto	2026-02-23 21:10:02.883383
311	10069	1	Demandas no Trabalho	81.25	alto	2026-02-23 23:15:01.867821
312	10069	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-23 23:15:01.867821
313	10069	3	Relações Sociais e Liderança	62.50	medio	2026-02-23 23:15:01.867821
314	10069	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-23 23:15:01.867821
315	10069	5	Valores Organizacionais	25.00	baixo	2026-02-23 23:15:01.867821
316	10069	6	Traços de Personalidade	75.00	alto	2026-02-23 23:15:01.867821
317	10069	7	Saúde e Bem-Estar	75.00	alto	2026-02-23 23:15:01.867821
318	10069	8	Comportamentos Ofensivos	75.00	alto	2026-02-23 23:15:01.867821
319	10069	9	Comportamento de Jogo	75.00	alto	2026-02-23 23:15:01.867821
320	10069	10	Endividamento Financeiro	43.75	medio	2026-02-23 23:15:01.867821
321	10071	1	Demandas no Trabalho	31.25	baixo	2026-02-23 23:16:00.87096
322	10071	2	Organização e Conteúdo do Trabalho	25.00	baixo	2026-02-23 23:16:00.87096
323	10071	3	Relações Sociais e Liderança	37.50	medio	2026-02-23 23:16:00.87096
324	10071	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-23 23:16:00.87096
325	10071	5	Valores Organizacionais	41.67	medio	2026-02-23 23:16:00.87096
326	10071	6	Traços de Personalidade	75.00	alto	2026-02-23 23:16:00.87096
327	10071	7	Saúde e Bem-Estar	50.00	medio	2026-02-23 23:16:00.87096
328	10071	8	Comportamentos Ofensivos	25.00	baixo	2026-02-23 23:16:00.87096
329	10071	9	Comportamento de Jogo	56.25	medio	2026-02-23 23:16:00.87096
330	10071	10	Endividamento Financeiro	68.75	alto	2026-02-23 23:16:00.87096
331	10074	1	Demandas no Trabalho	50.00	medio	2026-02-25 18:34:24.218014
332	10074	2	Organização e Conteúdo do Trabalho	50.00	medio	2026-02-25 18:34:24.218014
333	10074	3	Relações Sociais e Liderança	54.17	medio	2026-02-25 18:34:24.218014
334	10074	4	Interface Trabalho-Indivíduo	56.25	medio	2026-02-25 18:34:24.218014
335	10074	5	Valores Organizacionais	58.33	medio	2026-02-25 18:34:24.218014
336	10074	6	Traços de Personalidade	62.50	medio	2026-02-25 18:34:24.218014
337	10074	7	Saúde e Bem-Estar	58.33	medio	2026-02-25 18:34:24.218014
338	10074	8	Comportamentos Ofensivos	50.00	medio	2026-02-25 18:34:24.218014
339	10074	9	Comportamento de Jogo	56.25	medio	2026-02-25 18:34:24.218014
340	10074	10	Endividamento Financeiro	56.25	medio	2026-02-25 18:34:24.218014
341	10077	1	Demandas no Trabalho	68.75	alto	2026-02-27 13:01:06.374884
342	10077	2	Organização e Conteúdo do Trabalho	75.00	alto	2026-02-27 13:01:06.374884
343	10077	3	Relações Sociais e Liderança	54.17	medio	2026-02-27 13:01:06.374884
344	10077	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-27 13:01:06.374884
345	10077	5	Valores Organizacionais	66.67	alto	2026-02-27 13:01:06.374884
346	10077	6	Traços de Personalidade	25.00	baixo	2026-02-27 13:01:06.374884
347	10077	7	Saúde e Bem-Estar	8.33	baixo	2026-02-27 13:01:06.374884
348	10077	8	Comportamentos Ofensivos	25.00	baixo	2026-02-27 13:01:06.374884
349	10077	9	Comportamento de Jogo	75.00	alto	2026-02-27 13:01:06.374884
350	10077	10	Endividamento Financeiro	100.00	alto	2026-02-27 13:01:06.374884
351	10078	1	Demandas no Trabalho	62.50	medio	2026-02-27 13:11:54.487937
352	10078	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-02-27 13:11:54.487937
353	10078	3	Relações Sociais e Liderança	37.50	medio	2026-02-27 13:11:54.487937
354	10078	4	Interface Trabalho-Indivíduo	43.75	medio	2026-02-27 13:11:54.487937
355	10078	5	Valores Organizacionais	91.67	alto	2026-02-27 13:11:54.487937
356	10078	6	Traços de Personalidade	87.50	alto	2026-02-27 13:11:54.487937
357	10078	7	Saúde e Bem-Estar	41.67	medio	2026-02-27 13:11:54.487937
358	10078	8	Comportamentos Ofensivos	50.00	medio	2026-02-27 13:11:54.487937
359	10078	9	Comportamento de Jogo	87.50	alto	2026-02-27 13:11:54.487937
360	10078	10	Endividamento Financeiro	87.50	alto	2026-02-27 13:11:54.487937
361	10080	1	Demandas no Trabalho	62.50	medio	2026-02-27 13:24:37.393496
362	10080	2	Organização e Conteúdo do Trabalho	81.25	alto	2026-02-27 13:24:37.393496
363	10080	3	Relações Sociais e Liderança	54.17	medio	2026-02-27 13:24:37.393496
364	10080	4	Interface Trabalho-Indivíduo	37.50	medio	2026-02-27 13:24:37.393496
365	10080	5	Valores Organizacionais	50.00	medio	2026-02-27 13:24:37.393496
366	10080	6	Traços de Personalidade	87.50	alto	2026-02-27 13:24:37.393496
367	10080	7	Saúde e Bem-Estar	75.00	alto	2026-02-27 13:24:37.393496
368	10080	8	Comportamentos Ofensivos	41.67	medio	2026-02-27 13:24:37.393496
369	10080	9	Comportamento de Jogo	75.00	alto	2026-02-27 13:24:37.393496
370	10080	10	Endividamento Financeiro	75.00	alto	2026-02-27 13:24:37.393496
371	10082	1	Demandas no Trabalho	68.75	alto	2026-02-27 13:27:06.024845
372	10082	2	Organização e Conteúdo do Trabalho	68.75	alto	2026-02-27 13:27:06.024845
373	10082	3	Relações Sociais e Liderança	62.50	medio	2026-02-27 13:27:06.024845
374	10082	4	Interface Trabalho-Indivíduo	75.00	alto	2026-02-27 13:27:06.024845
375	10082	5	Valores Organizacionais	83.33	alto	2026-02-27 13:27:06.024845
376	10082	6	Traços de Personalidade	37.50	medio	2026-02-27 13:27:06.024845
377	10082	7	Saúde e Bem-Estar	25.00	baixo	2026-02-27 13:27:06.024845
378	10082	8	Comportamentos Ofensivos	83.33	alto	2026-02-27 13:27:06.024845
379	10082	9	Comportamento de Jogo	62.50	medio	2026-02-27 13:27:06.024845
380	10082	10	Endividamento Financeiro	87.50	alto	2026-02-27 13:27:06.024845
381	10072	1	Demandas no Trabalho	87.50	alto	2026-02-27 15:33:12.980456
382	10072	2	Organização e Conteúdo do Trabalho	87.50	alto	2026-02-27 15:33:12.980456
383	10072	3	Relações Sociais e Liderança	70.83	alto	2026-02-27 15:33:12.980456
384	10072	4	Interface Trabalho-Indivíduo	81.25	alto	2026-02-27 15:33:12.980456
385	10072	5	Valores Organizacionais	75.00	alto	2026-02-27 15:33:12.980456
386	10072	6	Traços de Personalidade	75.00	alto	2026-02-27 15:33:12.980456
387	10072	7	Saúde e Bem-Estar	75.00	alto	2026-02-27 15:33:12.980456
388	10072	8	Comportamentos Ofensivos	58.33	medio	2026-02-27 15:33:12.980456
389	10072	9	Comportamento de Jogo	37.50	medio	2026-02-27 15:33:12.980456
390	10072	10	Endividamento Financeiro	81.25	alto	2026-02-27 15:33:12.980456
391	10084	1	Demandas no Trabalho	75.00	alto	2026-03-03 14:37:42.792604
392	10084	2	Organização e Conteúdo do Trabalho	62.50	medio	2026-03-03 14:37:42.792604
393	10084	3	Relações Sociais e Liderança	70.83	alto	2026-03-03 14:37:42.792604
394	10084	4	Interface Trabalho-Indivíduo	25.00	baixo	2026-03-03 14:37:42.792604
395	10084	5	Valores Organizacionais	50.00	medio	2026-03-03 14:37:42.792604
396	10084	6	Traços de Personalidade	0.00	baixo	2026-03-03 14:37:42.792604
397	10084	7	Saúde e Bem-Estar	16.67	baixo	2026-03-03 14:37:42.792604
398	10084	8	Comportamentos Ofensivos	58.33	medio	2026-03-03 14:37:42.792604
399	10084	9	Comportamento de Jogo	93.75	alto	2026-03-03 14:37:42.792604
400	10084	10	Endividamento Financeiro	56.25	medio	2026-03-03 14:37:42.792604
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, display_name, description, hierarchy_level, active, created_at) FROM stdin;
1	admin	Administrador	Administrador do sistema	0	t	2026-02-09 20:16:27.147271
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (role_id, permission_id, granted_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.schema_migrations (version, dirty) FROM stdin;
1101	f
\.


--
-- Data for Name: session_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_logs (id, cpf, perfil, clinica_id, empresa_id, login_timestamp, logout_timestamp, ip_address, user_agent, criado_em) FROM stdin;
\.


--
-- Data for Name: templates_contrato; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.templates_contrato (id, nome, descricao, tipo_template, conteudo, ativo, padrao, versao, criado_em, criado_por_cpf, atualizado_em, atualizado_por_cpf, tags, metadata) FROM stdin;
1	Contrato Plano Personalizado - Padrao	Template padrao para contratos de plano personalizado de Medicina do Trabalho	plano_personalizado	<h1>CONTRATO DE PRESTACAO DE SERVICOS - MEDICINA DO TRABALHO</h1>\r\n<p><strong>CONTRATANTE:</strong> {{contratante_nome}} - CNPJ: {{contratante_cnpj}}</p>\r\n<p><strong>CONTRATADA:</strong> QWork Medicina Ocupacional</p>\r\n\r\n<h2>CLAUSULA PRIMEIRA - DO OBJETO</h2>\r\n<p>O presente contrato tem por objeto a prestacao de servicos de medicina do trabalho na modalidade de Plano Personalizado, abrangendo {{numero_funcionarios}} funcionarios estimados.</p>\r\n\r\n<h2>CLAUSULA SEGUNDA - DO VALOR</h2>\r\n<p>O valor mensal dos servicos e de R$ {{valor_total}} ({{valor_total_extenso}}), correspondendo a R$ {{valor_por_funcionario}} por funcionario.</p>\r\n\r\n<h2>CLAUSULA TERCEIRA - DO PRAZO</h2>\r\n<p>O presente contrato tem validade de {{prazo_meses}} meses a partir de {{data_inicio}}, podendo ser renovado mediante acordo entre as partes.</p>\r\n\r\n<h2>CLAUSULA QUARTA - DOS SERVICOS INCLUSOS</h2>\r\n<ul>\r\n  <li>Avaliacao psicossocial completa (COPSOQ III)</li>\r\n  <li>Modulo de Jogo Patologico (JZ)</li>\r\n  <li>Modulo de Endividamento Financeiro (EF)</li>\r\n  <li>Relatorios personalizados</li>\r\n  <li>Suporte tecnico dedicado</li>\r\n</ul>\r\n\r\n<p><strong>Data do Contrato:</strong> {{data_contrato}}</p>\r\n<p><strong>Assinaturas:</strong></p>\r\n<p>_______________________________<br/>CONTRATANTE</p>\r\n<p>_______________________________<br/>CONTRATADA</p>	t	t	1	2026-02-09 20:16:02.42177	SISTEMA	2026-02-09 20:16:02.42177	\N	\N	{}
\.


--
-- Data for Name: tokens_retomada_pagamento; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tokens_retomada_pagamento (id, token, contrato_id, usado, usado_em, expira_em, criado_em, entidade_id) FROM stdin;
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.webhook_logs (id, payment_id, event, payload, processed_at, ip_address, user_agent, processing_duration_ms, error_message, created_at) FROM stdin;
1	pay_7jq6wxnea8s5mdwv	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14204373", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_7jq6wxnea8s5mdwv", "fine": {"type": "FIXED", "value": 0}, "value": 43.5, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570564", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 42.15, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/7jq6wxnea8s5mdwv", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13096421", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": null, "externalReference": "pagamento_12", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-17 11:07:31"}	2026-02-17 14:08:32.779688	\N	\N	\N	\N	2026-02-17 14:08:32.779688
2	pay_7jq6wxnea8s5mdwv	PAYMENT_CONFIRMED	{"id": "pay_7jq6wxnea8s5mdwv", "fine": {"type": "FIXED", "value": 0}, "value": 43.5, "escrow": null, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570564", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 42.15, "creditCard": {"creditCardBrand": "VISA", "creditCardToken": "9b30ff7b-9eb6-46aa-907a-cf1eec77d6f0", "creditCardNumber": "3621"}, "creditDate": "2026-03-23", "invoiceUrl": "https://sandbox.asaas.com/i/7jq6wxnea8s5mdwv", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": "2026-02-17", "interestValue": null, "invoiceNumber": "13096421", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": "2026-02-17", "externalReference": "pagamento_12", "installmentNumber": null, "estimatedCreditDate": "2026-03-23", "lastInvoiceViewedDate": null, "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/2751322095424104", "lastBankSlipViewedDate": null}	2026-02-17 14:08:33.984049	\N	\N	\N	\N	2026-02-17 14:08:33.984049
4	pay_43idyefdc7zy8dvj	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14204873", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_43idyefdc7zy8dvj", "fine": {"type": "FIXED", "value": 0}, "value": 15.55, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570739", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 14.76, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/43idyefdc7zy8dvj", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13096949", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": null, "externalReference": "pagamento_13", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-17 13:23:56"}	2026-02-17 16:25:26.968517	\N	\N	\N	\N	2026-02-17 16:25:26.968517
5	pay_43idyefdc7zy8dvj	PAYMENT_CONFIRMED	{"id": "pay_43idyefdc7zy8dvj", "fine": {"type": "FIXED", "value": 0}, "value": 15.55, "escrow": null, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570739", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 14.76, "creditCard": {"creditCardBrand": "VISA", "creditCardToken": "49ed6b0a-52cc-40a9-b3ac-ec3f3dcd9d15", "creditCardNumber": "9544"}, "creditDate": "2026-03-23", "invoiceUrl": "https://sandbox.asaas.com/i/43idyefdc7zy8dvj", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": "2026-02-17", "interestValue": null, "invoiceNumber": "13096949", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": "2026-02-17", "externalReference": "pagamento_13", "installmentNumber": null, "estimatedCreditDate": "2026-03-23", "lastInvoiceViewedDate": null, "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/2138688707933953", "lastBankSlipViewedDate": null}	2026-02-17 16:25:27.495381	\N	\N	\N	\N	2026-02-17 16:25:27.495381
7	pay_8mi9jc5r2oekjjjt	PAYMENT_CHECKOUT_VIEWED	{"id": "evt_bdaf5c611b55dc82906787d5bfe1e5e2&14204889", "event": "PAYMENT_CHECKOUT_VIEWED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_8mi9jc5r2oekjjjt", "fine": {"type": "FIXED", "value": 0}, "value": 33, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570746", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 31.86, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13096965", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": null, "externalReference": "pagamento_14", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": "2026-02-17T16:28:49Z", "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-17 13:28:49"}	2026-02-17 16:29:22.794332	\N	\N	\N	\N	2026-02-17 16:29:22.794332
8	pay_8mi9jc5r2oekjjjt	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14204887", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_8mi9jc5r2oekjjjt", "fine": {"type": "FIXED", "value": 0}, "value": 33, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570746", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 31.86, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13096965", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": null, "externalReference": "pagamento_14", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-17 13:28:41"}	2026-02-17 16:29:22.79399	\N	\N	\N	\N	2026-02-17 16:29:22.79399
9	pay_8mi9jc5r2oekjjjt	PAYMENT_CONFIRMED	{"id": "pay_8mi9jc5r2oekjjjt", "fine": {"type": "FIXED", "value": 0}, "value": 33, "escrow": null, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-20", "refunds": null, "customer": "cus_000007570746", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 31.86, "creditCard": {"creditCardBrand": "VISA", "creditCardToken": "ef8e8bc6-bcec-4813-84b3-a7a014e71b37", "creditCardNumber": "9544"}, "creditDate": "2026-03-23", "invoiceUrl": "https://sandbox.asaas.com/i/8mi9jc5r2oekjjjt", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Pagamento de Avaliação - Lote", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": "2026-02-17", "interestValue": null, "invoiceNumber": "13096965", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-20", "clientPaymentDate": "2026-02-17", "externalReference": "pagamento_14", "installmentNumber": null, "estimatedCreditDate": "2026-03-23", "lastInvoiceViewedDate": "2026-02-17T16:28:49Z", "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/7754972696699239", "lastBankSlipViewedDate": null}	2026-02-17 16:29:23.369767	\N	\N	\N	\N	2026-02-17 16:29:23.369767
11	pay_yomtqoacm21jveay	PAYMENT_CONFIRMED	{"id": "pay_yomtqoacm21jveay", "value": 150, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-20", "customer": "cus_000007571986", "netValue": 146.53, "creditCard": {"creditCardBrand": "MASTERCARD", "creditCardToken": "2275ac4d-2c80-4e26-83a1-0256ea2d74f2", "creditCardNumber": "1160"}, "invoiceUrl": "https://sandbox.asaas.com/i/yomtqoacm21jveay", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Emissão de Laudo - Lote #1029", "paymentDate": null, "confirmedDate": "2026-02-17", "postalService": false, "externalReference": "lote_1029_pagamento_18"}	2026-02-17 23:55:19.201713	\N	\N	\N	\N	2026-02-17 23:55:19.201713
12	pay_tfl16khx6fvc964t	PAYMENT_CONFIRMED	{"id": "pay_tfl16khx6fvc964t", "value": 10, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572047", "netValue": 9.32, "creditCard": {"creditCardBrand": "MASTERCARD", "creditCardToken": "07a90eb4-e62d-4966-82db-38501f4740e3", "creditCardNumber": "5921"}, "invoiceUrl": "https://sandbox.asaas.com/i/tfl16khx6fvc964t", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-17", "description": "Emissão de Laudo - Lote #1025", "paymentDate": null, "confirmedDate": "2026-02-17", "postalService": false, "externalReference": "lote_1025_pagamento_20"}	2026-02-18 00:03:00.888326	\N	\N	\N	\N	2026-02-18 00:03:00.888326
13	pay_idem_test_1771373994798_4269	PAYMENT_CONFIRMED	{"test": true}	2026-02-18 00:19:48.807437	\N	\N	\N	\N	2026-02-18 00:19:48.807437
14	pay_idem2_test_1771373994921_9508	PAYMENT_RECEIVED	{"first": true}	2026-02-18 00:19:48.883625	\N	\N	\N	\N	2026-02-18 00:19:48.883625
16	pay_multi_test_1771373994961_500	PAYMENT_CONFIRMED	{}	2026-02-18 00:19:48.92368	\N	\N	\N	\N	2026-02-18 00:19:48.92368
17	pay_multi_test_1771373994961_500	PAYMENT_RECEIVED	{}	2026-02-18 00:19:48.938661	\N	\N	\N	\N	2026-02-18 00:19:48.938661
18	pay_idem_test_1771374110075_3965	PAYMENT_CONFIRMED	{"test": true}	2026-02-18 00:21:44.053091	\N	\N	\N	\N	2026-02-18 00:21:44.053091
19	pay_idem2_test_1771374110128_2471	PAYMENT_RECEIVED	{"first": true}	2026-02-18 00:21:44.084432	\N	\N	\N	\N	2026-02-18 00:21:44.084432
21	pay_multi_test_1771374110161_910	PAYMENT_CONFIRMED	{}	2026-02-18 00:21:44.116374	\N	\N	\N	\N	2026-02-18 00:21:44.116374
22	pay_multi_test_1771374110161_910	PAYMENT_RECEIVED	{}	2026-02-18 00:21:44.133769	\N	\N	\N	\N	2026-02-18 00:21:44.133769
23	pay_idem_test_1771374198220_585	PAYMENT_CONFIRMED	{"test": true}	2026-02-18 00:23:12.190991	\N	\N	\N	\N	2026-02-18 00:23:12.190991
24	pay_idem2_test_1771374198262_9813	PAYMENT_RECEIVED	{"first": true}	2026-02-18 00:23:12.220652	\N	\N	\N	\N	2026-02-18 00:23:12.220652
26	pay_multi_test_1771374198298_2159	PAYMENT_CONFIRMED	{}	2026-02-18 00:23:12.257017	\N	\N	\N	\N	2026-02-18 00:23:12.257017
27	pay_multi_test_1771374198298_2159	PAYMENT_RECEIVED	{}	2026-02-18 00:23:12.270603	\N	\N	\N	\N	2026-02-18 00:23:12.270603
28	pay_idem_test_1771374491241_5871	PAYMENT_CONFIRMED	{"test": true}	2026-02-18 00:28:05.205408	\N	\N	\N	\N	2026-02-18 00:28:05.205408
29	pay_idem2_test_1771374491294_4771	PAYMENT_RECEIVED	{"first": true}	2026-02-18 00:28:05.247533	\N	\N	\N	\N	2026-02-18 00:28:05.247533
31	pay_multi_test_1771374491333_3209	PAYMENT_CONFIRMED	{}	2026-02-18 00:28:05.28681	\N	\N	\N	\N	2026-02-18 00:28:05.28681
32	pay_multi_test_1771374491333_3209	PAYMENT_RECEIVED	{}	2026-02-18 00:28:05.300789	\N	\N	\N	\N	2026-02-18 00:28:05.300789
33	pay_8935hi8ek84pnrjc	PAYMENT_RECEIVED	{"id": "pay_8935hi8ek84pnrjc", "value": 12, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572257", "netValue": 11.01, "invoiceUrl": "https://sandbox.asaas.com/i/8935hi8ek84pnrjc", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/8935hi8ek84pnrjc", "billingType": "BOLETO", "dateCreated": "2026-02-17", "description": "Emissão de Laudo - Lote #1030", "paymentDate": "2026-02-17", "confirmedDate": "2026-02-17", "postalService": false, "externalReference": "lote_1030_pagamento_25"}	2026-02-18 02:36:02.907379	\N	\N	\N	\N	2026-02-18 02:36:02.907379
34	pay_wt5bd42yqzenv2yk	PAYMENT_RECEIVED	{"id": "pay_wt5bd42yqzenv2yk", "value": 123, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572328", "netValue": 122.01, "invoiceUrl": "https://sandbox.asaas.com/i/wt5bd42yqzenv2yk", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/wt5bd42yqzenv2yk", "billingType": "BOLETO", "dateCreated": "2026-02-18", "description": "Emissão de Laudo - Lote #1032", "paymentDate": "2026-02-18", "confirmedDate": "2026-02-18", "postalService": false, "externalReference": "lote_1032_pagamento_27"}	2026-02-18 03:20:43.449987	\N	\N	\N	\N	2026-02-18 03:20:43.449987
35	pay_otiieosmg70ll16f	PAYMENT_RECEIVED	{"id": "pay_otiieosmg70ll16f", "value": 24, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572281", "netValue": 23.01, "invoiceUrl": "https://sandbox.asaas.com/i/otiieosmg70ll16f", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/otiieosmg70ll16f", "billingType": "BOLETO", "dateCreated": "2026-02-17", "description": "Emissão de Laudo - Lote #1031", "paymentDate": "2026-02-17", "confirmedDate": "2026-02-17", "postalService": false, "externalReference": "lote_1031_pagamento_26"}	2026-02-18 03:20:50.005025	\N	\N	\N	\N	2026-02-18 03:20:50.005025
36	pay_vzzebo2hjosrrule	PAYMENT_RECEIVED	{"id": "pay_vzzebo2hjosrrule", "value": 19, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572249", "netValue": 18.01, "invoiceUrl": "https://sandbox.asaas.com/i/vzzebo2hjosrrule", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/vzzebo2hjosrrule", "billingType": "BOLETO", "dateCreated": "2026-02-17", "description": "Emissão de Laudo - Lote #1019", "paymentDate": "2026-02-17", "confirmedDate": "2026-02-17", "postalService": false, "externalReference": "lote_1019_pagamento_24"}	2026-02-18 03:27:49.263224	\N	\N	\N	\N	2026-02-18 03:27:49.263224
37	pay_r7fhqaqf2wih48u8	PAYMENT_RECEIVED	{"id": "pay_r7fhqaqf2wih48u8", "value": 18.5, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-21", "customer": "cus_000007572766", "netValue": 17.51, "invoiceUrl": "https://sandbox.asaas.com/i/r7fhqaqf2wih48u8", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/r7fhqaqf2wih48u8", "billingType": "BOLETO", "dateCreated": "2026-02-18", "description": "Emissão de Laudo - Lote #1033", "paymentDate": "2026-02-18", "confirmedDate": "2026-02-18", "postalService": false, "externalReference": "lote_1033_pagamento_28"}	2026-02-18 11:12:38.608201	\N	\N	\N	\N	2026-02-18 11:12:38.608201
38	pay_1wli49798jkwmnmu	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14290999", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_1wli49798jkwmnmu", "fine": {"type": "FIXED", "value": 0}, "value": 152, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007589649", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 148.49, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/1wli49798jkwmnmu", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1034", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13175162", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": null, "externalReference": "lote_1034_pagamento_29", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-23 18:25:45"}	2026-02-23 21:25:51.372753	\N	\N	\N	\N	2026-02-23 21:25:51.372753
39	pay_1wli49798jkwmnmu	PAYMENT_CHECKOUT_VIEWED	{"id": "evt_bdaf5c611b55dc82906787d5bfe1e5e2&14291001", "event": "PAYMENT_CHECKOUT_VIEWED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_1wli49798jkwmnmu", "fine": {"type": "FIXED", "value": 0}, "value": 152, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007589649", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 148.49, "creditCard": {"creditCardBrand": null, "creditCardNumber": null}, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/1wli49798jkwmnmu", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1034", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": null, "interestValue": null, "invoiceNumber": "13175162", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": null, "externalReference": "lote_1034_pagamento_29", "installmentNumber": null, "estimatedCreditDate": null, "lastInvoiceViewedDate": "2026-02-23T21:25:58Z", "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-23 18:25:59"}	2026-02-23 21:26:05.489257	\N	\N	\N	\N	2026-02-23 21:26:05.489257
40	pay_1wli49798jkwmnmu	PAYMENT_CONFIRMED	{"id": "evt_15e444ff9b9ab9ec29294aa1abe68025&14291013", "event": "PAYMENT_CONFIRMED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_1wli49798jkwmnmu", "fine": {"type": "FIXED", "value": 0}, "value": 152, "escrow": null, "object": "payment", "status": "CONFIRMED", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007589649", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 148.49, "creditCard": {"creditCardBrand": "MASTERCARD", "creditCardToken": "819a6480-fbf2-4826-bb88-56e452d2cb92", "creditCardNumber": "2676"}, "creditDate": "2026-03-27", "invoiceUrl": "https://sandbox.asaas.com/i/1wli49798jkwmnmu", "anticipable": false, "anticipated": false, "bankSlipUrl": null, "billingType": "CREDIT_CARD", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1034", "nossoNumero": null, "paymentDate": null, "paymentLink": null, "confirmedDate": "2026-02-23", "interestValue": null, "invoiceNumber": "13175162", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": "2026-02-23", "externalReference": "lote_1034_pagamento_29", "installmentNumber": null, "estimatedCreditDate": "2026-03-27", "lastInvoiceViewedDate": "2026-02-23T21:25:58Z", "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/9193089253258593", "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-23 18:27:35"}	2026-02-23 21:27:38.232303	\N	\N	\N	\N	2026-02-23 21:27:38.232303
42	pay_96s9n4c5krsxpdwy	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14292200", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_96s9n4c5krsxpdwy", "fine": {"type": "FIXED", "value": 0}, "value": 40, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007590024", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 39.01, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/96s9n4c5krsxpdwy", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/96s9n4c5krsxpdwy", "billingType": "BOLETO", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1035", "nossoNumero": "12007124", "paymentDate": null, "paymentLink": null, "interestValue": null, "invoiceNumber": "13176370", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": null, "externalReference": "lote_1035_pagamento_30", "installmentNumber": null, "estimatedCreditDate": null, "canBePaidAfterDueDate": true, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-23 20:17:39"}	2026-02-23 23:17:46.2013	\N	\N	\N	\N	2026-02-23 23:17:46.2013
43	pay_96s9n4c5krsxpdwy	PAYMENT_BANK_SLIP_VIEWED	{"id": "evt_454d76fe883fd17f74ebbbb453a6dd09&14292203", "event": "PAYMENT_BANK_SLIP_VIEWED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_96s9n4c5krsxpdwy", "fine": {"type": "FIXED", "value": 0}, "value": 40, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007590024", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 39.01, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/96s9n4c5krsxpdwy", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/96s9n4c5krsxpdwy", "billingType": "BOLETO", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1035", "nossoNumero": "12007124", "paymentDate": null, "paymentLink": null, "interestValue": null, "invoiceNumber": "13176370", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": null, "externalReference": "lote_1035_pagamento_30", "installmentNumber": null, "estimatedCreditDate": null, "canBePaidAfterDueDate": true, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": "2026-02-23T23:17:47Z"}, "dateCreated": "2026-02-23 20:17:48"}	2026-02-23 23:17:48.719316	\N	\N	\N	\N	2026-02-23 23:17:48.719316
44	pay_96s9n4c5krsxpdwy	PAYMENT_RECEIVED	{"id": "evt_d26e303b238e509335ac9ba210e51b0f&14292225", "event": "PAYMENT_RECEIVED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_96s9n4c5krsxpdwy", "fine": {"type": "FIXED", "value": 0}, "value": 40, "escrow": null, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-26", "refunds": null, "customer": "cus_000007590024", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 39.01, "creditDate": "2026-02-23", "invoiceUrl": "https://sandbox.asaas.com/i/96s9n4c5krsxpdwy", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/96s9n4c5krsxpdwy", "billingType": "BOLETO", "dateCreated": "2026-02-23", "description": "Emissão de Laudo - Lote #1035", "nossoNumero": "12007124", "paymentDate": "2026-02-23", "paymentLink": null, "confirmedDate": "2026-02-23", "interestValue": null, "invoiceNumber": "13176370", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-26", "clientPaymentDate": "2026-02-23", "externalReference": "lote_1035_pagamento_30", "installmentNumber": null, "estimatedCreditDate": "2026-02-23", "canBePaidAfterDueDate": true, "lastInvoiceViewedDate": null, "transactionReceiptUrl": "https://sandbox.asaas.com/comprovantes/h/UEFZTUVOVF9SRUNFSVZFRDpwYXlfOTZzOW40YzVrcnN4cGR3eQ%3D%3D", "lastBankSlipViewedDate": "2026-02-23T23:17:47Z"}, "dateCreated": "2026-02-23 20:20:48"}	2026-02-23 23:20:52.369043	\N	\N	\N	\N	2026-02-23 23:20:52.369043
46	pay_mz0zctgw526011bp	PAYMENT_CREATED	{"id": "evt_05b708f961d739ea7eba7e4db318f621&14337837", "event": "PAYMENT_CREATED", "account": {"id": "7e9c3d64-1e2b-4aa4-be42-fac44724180c", "ownerId": null}, "payment": {"id": "pay_mz0zctgw526011bp", "fine": {"type": "FIXED", "value": 0}, "value": 12.5, "escrow": null, "object": "payment", "status": "PENDING", "deleted": false, "dueDate": "2026-02-28", "refunds": null, "customer": "cus_000007602746", "discount": {"type": "FIXED", "value": 0, "limitDate": null, "dueDateLimitDays": 0}, "interest": {"type": "PERCENTAGE", "value": 0}, "netValue": 11.51, "creditDate": null, "invoiceUrl": "https://sandbox.asaas.com/i/mz0zctgw526011bp", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/mz0zctgw526011bp", "billingType": "BOLETO", "dateCreated": "2026-02-25", "description": "Emissão de Laudo - Lote #1037", "nossoNumero": "12018977", "paymentDate": null, "paymentLink": null, "interestValue": null, "invoiceNumber": "13210356", "originalValue": null, "postalService": false, "pixTransaction": null, "checkoutSession": null, "originalDueDate": "2026-02-28", "clientPaymentDate": null, "externalReference": "lote_1037_pagamento_31", "installmentNumber": null, "estimatedCreditDate": null, "canBePaidAfterDueDate": true, "lastInvoiceViewedDate": null, "transactionReceiptUrl": null, "lastBankSlipViewedDate": null}, "dateCreated": "2026-02-25 17:09:37"}	2026-02-25 20:09:43.104249	\N	\N	\N	\N	2026-02-25 20:09:43.104249
47	pay_mz0zctgw526011bp	PAYMENT_RECEIVED	{"id": "pay_mz0zctgw526011bp", "value": 12.5, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-02-28", "customer": "cus_000007602746", "netValue": 11.51, "invoiceUrl": "https://sandbox.asaas.com/i/mz0zctgw526011bp", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/mz0zctgw526011bp", "billingType": "BOLETO", "dateCreated": "2026-02-25", "description": "Emissão de Laudo - Lote #1037", "paymentDate": "2026-02-25", "confirmedDate": "2026-02-25", "postalService": false, "externalReference": "lote_1037_pagamento_31"}	2026-02-25 20:10:39.313433	\N	\N	\N	\N	2026-02-25 20:10:39.313433
49	pay_yctm1msbpw58lfgz	PAYMENT_RECEIVED	{"id": "pay_yctm1msbpw58lfgz", "value": 55, "object": "payment", "status": "RECEIVED", "deleted": false, "dueDate": "2026-03-06", "customer": "cus_000007628390", "netValue": 54.01, "invoiceUrl": "https://sandbox.asaas.com/i/yctm1msbpw58lfgz", "anticipable": false, "anticipated": false, "bankSlipUrl": "https://sandbox.asaas.com/b/pdf/yctm1msbpw58lfgz", "billingType": "BOLETO", "dateCreated": "2026-03-03", "description": "Emissão de Laudo - Lote #1042", "paymentDate": "2026-03-03", "confirmedDate": "2026-03-03", "postalService": false, "externalReference": "lote_1042_pagamento_32"}	2026-03-03 14:48:28.10705	\N	\N	\N	\N	2026-03-03 14:48:28.10705
\.


--
-- Name: _migration_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public._migration_issues_id_seq', 1, false);


--
-- Name: aceites_termos_entidade_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.aceites_termos_entidade_id_seq', 46, true);


--
-- Name: aceites_termos_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.aceites_termos_usuario_id_seq', 46, true);


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analise_estatistica_id_seq', 1, false);


--
-- Name: audit_access_denied_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_access_denied_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 790, true);


--
-- Name: auditoria_geral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_geral_id_seq', 1, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 532, true);


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_laudos_id_seq', 21, true);


--
-- Name: auditoria_recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.auditoria_recibos_id_seq', 1, false);


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 10092, true);


--
-- Name: clinica_configuracoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinica_configuracoes_id_seq', 1, false);


--
-- Name: clinicas_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clinicas_senhas_id_seq', 16, true);


--
-- Name: comissionamento_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comissionamento_auditoria_id_seq', 9, true);


--
-- Name: comissoes_laudo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comissoes_laudo_id_seq', 1, false);


--
-- Name: confirmacao_identidade_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.confirmacao_identidade_id_seq', 47, true);


--
-- Name: contratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratos_id_seq', 30, true);


--
-- Name: contratos_planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.contratos_planos_id_seq', 1, false);


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.emissao_queue_id_seq', 1, false);


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.empresas_clientes_id_seq', 20, true);


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.entidades_senhas_id_seq', 14, true);


--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fila_emissao_id_seq1', 1, false);


--
-- Name: fk_migration_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.fk_migration_audit_id_seq', 1, false);


--
-- Name: funcionarios_clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_clinicas_id_seq', 49, true);


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_entidades_id_seq', 28, true);


--
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 1095, true);


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_arquivos_remotos_id_seq', 1, false);


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_downloads_id_seq', 1, false);


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudo_generation_jobs_id_seq', 1, false);


--
-- Name: laudos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.laudos_id_seq', 5000, false);


--
-- Name: leads_representante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leads_representante_id_seq', 5, true);


--
-- Name: logs_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.logs_admin_id_seq', 1, false);


--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.lotes_avaliacao_funcionarios_id_seq', 1, false);


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.lotes_avaliacao_id_seq', 1, false);


--
-- Name: mfa_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.mfa_codes_id_seq', 1, false);


--
-- Name: migration_guidelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.migration_guidelines_id_seq', 3, true);


--
-- Name: notificacoes_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_admin_id_seq', 1, false);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 21, true);


--
-- Name: notificacoes_traducoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notificacoes_traducoes_id_seq', 9, true);


--
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 32, true);


--
-- Name: payment_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payment_links_id_seq', 1, false);


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pdf_jobs_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 3, true);


--
-- Name: planos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.planos_id_seq', 1, false);


--
-- Name: policy_expression_backups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.policy_expression_backups_id_seq', 1, false);


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.questao_condicoes_id_seq', 1, false);


--
-- Name: recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.recibos_id_seq', 1, false);


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.relatorio_templates_id_seq', 1, false);


--
-- Name: representantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.representantes_id_seq', 9, true);


--
-- Name: respostas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.respostas_id_seq', 1521, true);


--
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.resultados_id_seq', 400, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: seq_contratantes_id; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.seq_contratantes_id', 130, true);


--
-- Name: session_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.session_logs_id_seq', 1, false);


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.templates_contrato_id_seq', 1, true);


--
-- Name: tokens_retomada_pagamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tokens_retomada_pagamento_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 30, true);


--
-- Name: vinculos_comissao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vinculos_comissao_id_seq', 2, true);


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.webhook_logs_id_seq', 49, true);


--
-- PostgreSQL database dump complete
--

