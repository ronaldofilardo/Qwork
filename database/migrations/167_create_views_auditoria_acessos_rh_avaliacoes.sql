-- Migration 167: Criar views de auditoria ausentes no DEV
-- vw_auditoria_acessos_rh: acessos de gestores RH via session_logs
-- vw_auditoria_avaliacoes: auditoria de avaliações com dados de lote/clinica

CREATE OR REPLACE VIEW public.vw_auditoria_acessos_rh AS
 SELECT sl.id,
    sl.cpf,
    f.nome,
    sl.clinica_id,
    c.nome AS clinica_nome,
    sl.login_timestamp,
    sl.logout_timestamp,
    sl.session_duration,
    sl.ip_address,
    sl.user_agent
   FROM ((public.session_logs sl
     LEFT JOIN public.funcionarios f ON (f.cpf = sl.cpf::bpchar))
     LEFT JOIN public.clinicas c ON (c.id = sl.clinica_id))
  WHERE sl.perfil::text = 'rh'::text;

COMMENT ON VIEW public.vw_auditoria_acessos_rh IS 'View para auditoria de acessos de gestores RH';

-- Nota: schema DEV usa lotes_avaliacao.clinica_id/empresa_id (funcionarios não tem essas colunas)
CREATE OR REPLACE VIEW public.vw_auditoria_avaliacoes AS
 SELECT a.id AS avaliacao_id,
    a.funcionario_cpf AS cpf,
    l.clinica_id,
    l.empresa_id,
    l.id::text AS lote,
    l.status AS lote_status,
        CASE WHEN l.status::text = 'ativo'::text THEN true ELSE false END AS liberado,
    a.status AS avaliacao_status,
        CASE WHEN a.status::text = 'concluido'::text THEN true ELSE false END AS concluida,
        CASE WHEN a.status::text = 'inativada'::text THEN true ELSE false END AS inativada,
    ( SELECT count(*) FROM public.audit_logs
          WHERE audit_logs.resource::text = 'avaliacoes'::text
            AND audit_logs.resource_id = a.id::text
            AND audit_logs.action::text = 'UPDATE'::text
            AND (audit_logs.old_data ->> 'status') <> (audit_logs.new_data ->> 'status')) AS numero_interrupcoes,
    a.inicio AS iniciada_em,
    a.envio AS concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome
   FROM (((public.avaliacoes a
     LEFT JOIN public.lotes_avaliacao l ON (l.id = a.lote_id))
     LEFT JOIN public.clinicas c ON (c.id = l.clinica_id))
     LEFT JOIN public.empresas_clientes ec ON (ec.id = l.empresa_id));

COMMENT ON VIEW public.vw_auditoria_avaliacoes IS 'View agregada para auditoria de avaliacoes';
