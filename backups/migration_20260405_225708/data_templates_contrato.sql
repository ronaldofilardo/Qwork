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
-- Data for Name: templates_contrato; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.templates_contrato (id, nome, descricao, tipo_template, conteudo, ativo, padrao, versao, criado_em, criado_por_cpf, atualizado_em, atualizado_por_cpf, tags, metadata) VALUES (1, 'Contrato Plano Personalizado - Padrao', 'Template padrao para contratos de plano personalizado de Medicina do Trabalho', 'plano_personalizado', '<h1>CONTRATO DE PRESTACAO DE SERVICOS - MEDICINA DO TRABALHO</h1>
<p><strong>CONTRATANTE:</strong> {{contratante_nome}} - CNPJ: {{contratante_cnpj}}</p>
<p><strong>CONTRATADA:</strong> QWork Medicina Ocupacional</p>

<h2>CLAUSULA PRIMEIRA - DO OBJETO</h2>
<p>O presente contrato tem por objeto a prestacao de servicos de medicina do trabalho na modalidade de Plano Personalizado, abrangendo {{numero_funcionarios}} funcionarios estimados.</p>

<h2>CLAUSULA SEGUNDA - DO VALOR</h2>
<p>O valor mensal dos servicos e de R$ {{valor_total}} ({{valor_total_extenso}}), correspondendo a R$ {{valor_por_funcionario}} por funcionario.</p>

<h2>CLAUSULA TERCEIRA - DO PRAZO</h2>
<p>O presente contrato tem validade de {{prazo_meses}} meses a partir de {{data_inicio}}, podendo ser renovado mediante acordo entre as partes.</p>

<h2>CLAUSULA QUARTA - DOS SERVICOS INCLUSOS</h2>
<ul>
  <li>Avaliacao psicossocial completa (COPSOQ III)</li>
  <li>Modulo de Jogo Patologico (JZ)</li>
  <li>Modulo de Endividamento Financeiro (EF)</li>
  <li>Relatorios personalizados</li>
  <li>Suporte tecnico dedicado</li>
</ul>

<p><strong>Data do Contrato:</strong> {{data_contrato}}</p>
<p><strong>Assinaturas:</strong></p>
<p>_______________________________<br/>CONTRATANTE</p>
<p>_______________________________<br/>CONTRATADA</p>', true, true, 1, '2026-02-09 20:16:02.42177', 'SISTEMA', '2026-02-09 20:16:02.42177', NULL, NULL, '{}');


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.templates_contrato_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

