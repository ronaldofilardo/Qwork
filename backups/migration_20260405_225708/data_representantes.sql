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
-- Data for Name: representantes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.representantes (id, tipo_pessoa, nome, email, telefone, cpf, cnpj, cpf_responsavel_pj, codigo, banco_codigo, agencia, conta, tipo_conta, titular_conta, pix_chave, pix_tipo, doc_identificacao_path, comprovante_conta_path, status, aceite_termos, aceite_termos_em, aceite_disclaimer_nv, aceite_disclaimer_nv_em, bloqueio_conflito_pf_id, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, senha_hash, senha_repres, convite_token, convite_expira_em, convite_tentativas_falhas, convite_usado_em, dados_bancarios_status, dados_bancarios_solicitado_em, dados_bancarios_confirmado_em, percentual_comissao) VALUES (2, 'pj', 'Empresa Teste PJ Ltda', 'rep.pj.teste@qwork.dev', '11999000002', NULL, '12345678000195', '55566677788', 'REP-PJ123', '001', '0001', '98765-4', 'corrente', 'Empresa Teste PJ Ltda', '12345678000195', 'cnpj', NULL, NULL, 'ativo', true, '2026-03-02 19:42:22.413343+00', true, '2026-03-02 19:42:22.413343+00', NULL, '2026-03-02 19:42:22.413343+00', '2026-03-03 02:12:41.643965+00', NULL, NULL, '$2a$10$C91l7kLWcD5BM7CZZgDNX.1KbblVQN4M9JqHUVAV0aOQMaNrsXBgm', NULL, NULL, NULL, 0, NULL, 'nao_informado', NULL, NULL, NULL);
INSERT INTO public.representantes (id, tipo_pessoa, nome, email, telefone, cpf, cnpj, cpf_responsavel_pj, codigo, banco_codigo, agencia, conta, tipo_conta, titular_conta, pix_chave, pix_tipo, doc_identificacao_path, comprovante_conta_path, status, aceite_termos, aceite_termos_em, aceite_disclaimer_nv, aceite_disclaimer_nv_em, bloqueio_conflito_pf_id, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, senha_hash, senha_repres, convite_token, convite_expira_em, convite_tentativas_falhas, convite_usado_em, dados_bancarios_status, dados_bancarios_solicitado_em, dados_bancarios_confirmado_em, percentual_comissao) VALUES (1, 'pf', 'Carlos Teste PF', 'rep.pf.teste@qwork.dev', '11999000001', '11122233344', NULL, NULL, 'REP-PF123', '260', '0001', '12345-6', 'corrente', 'Carlos Teste PF', '12345678901', 'cpf', NULL, NULL, 'apto', true, '2026-03-02 19:42:22.39237+00', true, '2026-03-02 19:42:22.39237+00', NULL, '2026-03-02 19:42:22.39237+00', '2026-03-12 19:31:52.174511+00', '2026-03-03 03:29:08.061381+00', '87545772920', '$2a$10$LiG6EKxxi3LbFgVQOHFXvOSzBo/aYEE5fm6/P.0SIJw5YuqwcianS', NULL, NULL, NULL, 0, NULL, 'pendente_confirmacao', NULL, NULL, NULL);


--
-- Name: representantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.representantes_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--

