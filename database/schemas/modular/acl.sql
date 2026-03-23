-- ============================================================================
-- acl.sql
-- Permissões de acesso (GRANT/REVOKE) para roles do banco de dados
-- Depends on: todos os arquivos DDL (01-05)
-- ============================================================================

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO dba_maintenance;



--
-- Name: TABLE _migration_issues; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public._migration_issues TO dba_maintenance;



--
-- Name: SEQUENCE _migration_issues_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public._migration_issues_id_seq TO dba_maintenance;



--
-- Name: TABLE analise_estatistica; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.analise_estatistica TO dba_maintenance;



--
-- Name: SEQUENCE analise_estatistica_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.analise_estatistica_id_seq TO dba_maintenance;



--
-- Name: TABLE audit_access_denied; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_access_denied TO dba_maintenance;



--
-- Name: SEQUENCE audit_access_denied_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.audit_access_denied_id_seq TO dba_maintenance;



--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_logs TO dba_maintenance;



--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.audit_logs_id_seq TO dba_maintenance;



--
-- Name: TABLE audit_stats_by_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.audit_stats_by_user TO dba_maintenance;



--
-- Name: TABLE auditoria; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria TO dba_maintenance;



--
-- Name: TABLE auditoria_geral; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_geral TO dba_maintenance;



--
-- Name: SEQUENCE auditoria_geral_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_geral_id_seq TO dba_maintenance;



--
-- Name: SEQUENCE auditoria_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_id_seq TO dba_maintenance;



--
-- Name: TABLE auditoria_laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_laudos TO dba_maintenance;



--
-- Name: SEQUENCE auditoria_laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_laudos_id_seq TO dba_maintenance;



--
-- Name: TABLE auditoria_recibos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.auditoria_recibos TO dba_maintenance;



--
-- Name: SEQUENCE auditoria_recibos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.auditoria_recibos_id_seq TO dba_maintenance;



--
-- Name: TABLE avaliacao_resets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacao_resets TO dba_maintenance;



--
-- Name: TABLE avaliacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avaliacoes TO dba_maintenance;



--
-- Name: SEQUENCE avaliacoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.avaliacoes_id_seq TO dba_maintenance;



--
-- Name: TABLE clinica_configuracoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinica_configuracoes TO dba_maintenance;



--
-- Name: SEQUENCE clinica_configuracoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.clinica_configuracoes_id_seq TO dba_maintenance;



--
-- Name: SEQUENCE seq_contratantes_id; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.seq_contratantes_id TO dba_maintenance;



--
-- Name: TABLE clinicas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas TO dba_maintenance;



--
-- Name: TABLE clinicas_empresas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas_empresas TO dba_maintenance;



--
-- Name: TABLE clinicas_senhas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.clinicas_senhas TO dba_maintenance;



--
-- Name: SEQUENCE clinicas_senhas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.clinicas_senhas_id_seq TO dba_maintenance;



--
-- Name: TABLE comissionamento_auditoria; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.comissionamento_auditoria TO dba_maintenance;



--
-- Name: SEQUENCE comissionamento_auditoria_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.comissionamento_auditoria_id_seq TO dba_maintenance;



--
-- Name: TABLE comissoes_laudo; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.comissoes_laudo TO dba_maintenance;



--
-- Name: SEQUENCE comissoes_laudo_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.comissoes_laudo_id_seq TO dba_maintenance;



--
-- Name: TABLE contratacao_personalizada; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratacao_personalizada TO dba_maintenance;



--
-- Name: SEQUENCE contratacao_personalizada_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratacao_personalizada_id_seq TO dba_maintenance;



--
-- Name: TABLE contratos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos TO dba_maintenance;



--
-- Name: SEQUENCE contratos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratos_id_seq TO dba_maintenance;



--
-- Name: TABLE contratos_planos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.contratos_planos TO dba_maintenance;



--
-- Name: SEQUENCE contratos_planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.contratos_planos_id_seq TO dba_maintenance;



--
-- Name: TABLE emissao_queue; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.emissao_queue TO dba_maintenance;



--
-- Name: SEQUENCE emissao_queue_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.emissao_queue_id_seq TO dba_maintenance;



--
-- Name: TABLE empresas_clientes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.empresas_clientes TO dba_maintenance;
GRANT SELECT ON TABLE public.empresas_clientes TO test_rh;
GRANT SELECT ON TABLE public.empresas_clientes TO test_gestor;



--
-- Name: SEQUENCE empresas_clientes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.empresas_clientes_id_seq TO dba_maintenance;



--
-- Name: TABLE entidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.entidades TO dba_maintenance;



--
-- Name: TABLE entidades_senhas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.entidades_senhas TO dba_maintenance;



--
-- Name: SEQUENCE entidades_senhas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.entidades_senhas_id_seq TO dba_maintenance;



--
-- Name: TABLE fila_emissao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fila_emissao TO dba_maintenance;



--
-- Name: SEQUENCE fila_emissao_id_seq1; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.fila_emissao_id_seq1 TO dba_maintenance;



--
-- Name: TABLE fk_migration_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fk_migration_audit TO dba_maintenance;



--
-- Name: SEQUENCE fk_migration_audit_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.fk_migration_audit_id_seq TO dba_maintenance;



--
-- Name: TABLE funcionarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO dba_maintenance;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO test_rh;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios TO test_gestor;



--
-- Name: TABLE funcionarios_clinicas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios_clinicas TO dba_maintenance;



--
-- Name: SEQUENCE funcionarios_clinicas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.funcionarios_clinicas_id_seq TO dba_maintenance;



--
-- Name: TABLE funcionarios_entidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.funcionarios_entidades TO dba_maintenance;



--
-- Name: SEQUENCE funcionarios_entidades_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.funcionarios_entidades_id_seq TO dba_maintenance;



--
-- Name: SEQUENCE funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.funcionarios_id_seq TO dba_maintenance;



--
-- Name: TABLE usuarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios TO dba_maintenance;



--
-- Name: TABLE gestores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.gestores TO dba_maintenance;



--
-- Name: TABLE hierarquia_comercial; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hierarquia_comercial TO dba_maintenance;



--
-- Name: SEQUENCE hierarquia_comercial_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.hierarquia_comercial_id_seq TO dba_maintenance;



--
-- Name: TABLE laudo_arquivos_remotos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_arquivos_remotos TO dba_maintenance;



--
-- Name: SEQUENCE laudo_arquivos_remotos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_arquivos_remotos_id_seq TO dba_maintenance;



--
-- Name: TABLE laudo_downloads; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_downloads TO dba_maintenance;



--
-- Name: SEQUENCE laudo_downloads_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_downloads_id_seq TO dba_maintenance;



--
-- Name: TABLE laudo_generation_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudo_generation_jobs TO dba_maintenance;



--
-- Name: SEQUENCE laudo_generation_jobs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudo_generation_jobs_id_seq TO dba_maintenance;



--
-- Name: TABLE laudos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.laudos TO dba_maintenance;



--
-- Name: SEQUENCE laudos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.laudos_id_seq TO dba_maintenance;



--
-- Name: TABLE leads_representante; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.leads_representante TO dba_maintenance;



--
-- Name: SEQUENCE leads_representante_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.leads_representante_id_seq TO dba_maintenance;



--
-- Name: TABLE logs_admin; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.logs_admin TO dba_maintenance;



--
-- Name: SEQUENCE logs_admin_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.logs_admin_id_seq TO dba_maintenance;



--
-- Name: TABLE lote_id_allocator; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lote_id_allocator TO dba_maintenance;



--
-- Name: TABLE lotes_avaliacao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lotes_avaliacao TO dba_maintenance;



--
-- Name: SEQUENCE lotes_avaliacao_funcionarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_funcionarios_id_seq TO dba_maintenance;



--
-- Name: SEQUENCE lotes_avaliacao_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.lotes_avaliacao_id_seq TO dba_maintenance;



--
-- Name: TABLE mfa_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mfa_codes TO dba_maintenance;



--
-- Name: SEQUENCE mfa_codes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.mfa_codes_id_seq TO dba_maintenance;



--
-- Name: TABLE migration_guidelines; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.migration_guidelines TO dba_maintenance;



--
-- Name: SEQUENCE migration_guidelines_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.migration_guidelines_id_seq TO dba_maintenance;



--
-- Name: TABLE notificacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes TO dba_maintenance;



--
-- Name: TABLE notificacoes_admin; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes_admin TO dba_maintenance;



--
-- Name: SEQUENCE notificacoes_admin_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.notificacoes_admin_id_seq TO dba_maintenance;



--
-- Name: SEQUENCE notificacoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.notificacoes_id_seq TO dba_maintenance;



--
-- Name: TABLE notificacoes_traducoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notificacoes_traducoes TO dba_maintenance;



--
-- Name: SEQUENCE notificacoes_traducoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.notificacoes_traducoes_id_seq TO dba_maintenance;



--
-- Name: TABLE pagamentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pagamentos TO dba_maintenance;



--
-- Name: SEQUENCE pagamentos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.pagamentos_id_seq TO dba_maintenance;



--
-- Name: TABLE payment_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payment_links TO dba_maintenance;



--
-- Name: SEQUENCE payment_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.payment_links_id_seq TO dba_maintenance;



--
-- Name: TABLE pdf_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pdf_jobs TO dba_maintenance;



--
-- Name: SEQUENCE pdf_jobs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.pdf_jobs_id_seq TO dba_maintenance;



--
-- Name: TABLE permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.permissions TO dba_maintenance;



--
-- Name: SEQUENCE permissions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.permissions_id_seq TO dba_maintenance;



--
-- Name: TABLE planos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.planos TO dba_maintenance;



--
-- Name: SEQUENCE planos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.planos_id_seq TO dba_maintenance;



--
-- Name: TABLE policy_expression_backups; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.policy_expression_backups TO dba_maintenance;



--
-- Name: SEQUENCE policy_expression_backups_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.policy_expression_backups_id_seq TO dba_maintenance;



--
-- Name: TABLE questao_condicoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.questao_condicoes TO dba_maintenance;



--
-- Name: SEQUENCE questao_condicoes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.questao_condicoes_id_seq TO dba_maintenance;



--
-- Name: TABLE recibos; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.recibos TO dba_maintenance;



--
-- Name: SEQUENCE recibos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.recibos_id_seq TO dba_maintenance;



--
-- Name: TABLE relatorio_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.relatorio_templates TO dba_maintenance;



--
-- Name: SEQUENCE relatorio_templates_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.relatorio_templates_id_seq TO dba_maintenance;



--
-- Name: TABLE representantes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.representantes TO dba_maintenance;



--
-- Name: SEQUENCE representantes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.representantes_id_seq TO dba_maintenance;



--
-- Name: TABLE respostas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.respostas TO dba_maintenance;



--
-- Name: SEQUENCE respostas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.respostas_id_seq TO dba_maintenance;



--
-- Name: TABLE resultados; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.resultados TO dba_maintenance;



--
-- Name: SEQUENCE resultados_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.resultados_id_seq TO dba_maintenance;



--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.role_permissions TO dba_maintenance;



--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO dba_maintenance;



--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.roles_id_seq TO dba_maintenance;



--
-- Name: TABLE session_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.session_logs TO dba_maintenance;



--
-- Name: SEQUENCE session_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.session_logs_id_seq TO dba_maintenance;



--
-- Name: TABLE templates_contrato; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.templates_contrato TO dba_maintenance;



--
-- Name: SEQUENCE templates_contrato_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.templates_contrato_id_seq TO dba_maintenance;



--
-- Name: TABLE tokens_retomada_pagamento; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tokens_retomada_pagamento TO dba_maintenance;



--
-- Name: SEQUENCE tokens_retomada_pagamento_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.tokens_retomada_pagamento_id_seq TO dba_maintenance;



--
-- Name: TABLE tomadores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tomadores TO dba_maintenance;



--
-- Name: SEQUENCE usuarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.usuarios_id_seq TO dba_maintenance;



--
-- Name: TABLE v_auditoria_emissoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_auditoria_emissoes TO dba_maintenance;



--
-- Name: TABLE v_fila_emissao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_fila_emissao TO dba_maintenance;



--
-- Name: TABLE v_relatorio_emissoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_relatorio_emissoes TO dba_maintenance;



--
-- Name: TABLE v_solicitacoes_emissao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_solicitacoes_emissao TO dba_maintenance;



--
-- Name: TABLE vinculos_comissao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vinculos_comissao TO dba_maintenance;



--
-- Name: SEQUENCE vinculos_comissao_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.vinculos_comissao_id_seq TO dba_maintenance;



--
-- Name: TABLE vw_auditoria_acessos_rh; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_acessos_rh TO dba_maintenance;



--
-- Name: TABLE vw_auditoria_avaliacoes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_auditoria_avaliacoes TO dba_maintenance;



--
-- Name: TABLE vw_empresas_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_empresas_stats TO dba_maintenance;



--
-- Name: TABLE vw_funcionarios_por_lote; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_funcionarios_por_lote TO dba_maintenance;



--
-- Name: TABLE vw_notificacoes_nao_lidas; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.vw_notificacoes_nao_lidas TO dba_maintenance;



--
-- Name: TABLE webhook_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.webhook_logs TO dba_maintenance;



--
-- Name: SEQUENCE webhook_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.webhook_logs_id_seq TO dba_maintenance;



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO dba_maintenance;



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO dba_maintenance;


--
-- PostgreSQL database dump complete
--

