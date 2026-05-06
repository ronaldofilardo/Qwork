-- Migration 1241: Fix laudos.status column size from VARCHAR(20) to VARCHAR(25)
-- Issue: Status 'aguardando_assinatura' = 21 chars exceeds VARCHAR(20)
-- New statuses for ZapSign workflow: pdf_gerado (11), aguardando_assinatura (21), assinado_processando (20)
-- Migration Date: 2026-05-06

-- Drop ALL views that depend on laudos or its related tables (CASCADE)
DROP VIEW IF EXISTS public.v_solicitacoes_emissao CASCADE;
DROP VIEW IF EXISTS public.vw_funcionarios_por_lote CASCADE;
DROP VIEW IF EXISTS public.vw_empresas_stats CASCADE;
DROP VIEW IF EXISTS public.vw_auditoria_avaliacoes CASCADE;
DROP VIEW IF EXISTS public.v_relatorio_emissoes CASCADE;
DROP VIEW IF EXISTS public.v_auditoria_emissoes CASCADE;
DROP VIEW IF EXISTS public.v_fila_emissao CASCADE;

-- Alter column type from VARCHAR(20) to VARCHAR(25)
ALTER TABLE public.laudos 
  ALTER COLUMN status TYPE character varying(25);

-- Recreate v_auditoria_emissoes
CREATE VIEW public.v_auditoria_emissoes AS
 SELECT la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.criado_em AS lote_criado_em,
    ec.nome AS empresa_nome,
    ec.cnpj AS empresa_cnpj,
    c.nome AS clinica_nome,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    l.hash_pdf,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
   FROM ((((public.lotes_avaliacao la
     JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.lote_id)))
  GROUP BY la.id, la.empresa_id, la.numero_ordem, la.status, la.emitido_em, la.enviado_em, la.criado_em, ec.nome, ec.cnpj, c.nome, l.hash_pdf, l.enviado_em, l.emitido_em;

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View de auditoria de emissões de laudos - ID-only (sem codigo/titulo/emergencia)';

-- Recreate v_fila_emissao
CREATE VIEW public.v_fila_emissao AS
 SELECT id,
    lote_id,
    tentativas,
    3 AS max_tentativas,
    criado_em AS proxima_tentativa,
    erro,
    criado_em,
    criado_em AS atualizado_em,
    solicitado_por,
    tipo_solicitante,
    criado_em AS solicitado_em
   FROM public.auditoria_laudos al
  WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text])))
  ORDER BY criado_em;

COMMENT ON VIEW public.v_fila_emissao IS 'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';

-- Recreate v_relatorio_emissoes
CREATE VIEW public.v_relatorio_emissoes AS
 SELECT l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
        CASE
            WHEN (l.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (l.entidade_id IS NOT NULL) THEN 'entidade'::text
            ELSE NULL::text
        END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome,
    l.empresa_id,
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS avaliacoes_concluidas
   FROM (((((public.lotes_avaliacao l
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.tomadores t ON ((t.id = l.entidade_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
     LEFT JOIN public.laudos ld ON ((ld.lote_id = l.id)))
     LEFT JOIN public.avaliacoes a ON ((a.lote_id = l.id)))
  GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id, c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;

COMMENT ON VIEW public.v_relatorio_emissoes IS 'Relatorio de emissoes de laudos com contexto (clinica ou entidade). Compativel com arquitetura segregada de tomadores.';

-- Recreate vw_auditoria_avaliacoes
CREATE VIEW public.vw_auditoria_avaliacoes AS
 SELECT a.id AS avaliacao_id,
    a.funcionario_cpf AS cpf,
    l.clinica_id,
    l.empresa_id,
    (l.id)::text AS lote,
    l.status AS lote_status,
        CASE
            WHEN ((l.status)::text = 'ativo'::text) THEN true
            ELSE false
        END AS liberado,
    a.status AS avaliacao_status,
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN true
            ELSE false
        END AS concluida,
        CASE
            WHEN ((a.status)::text = 'inativada'::text) THEN true
            ELSE false
        END AS inativada,
    ( SELECT count(*) AS count
           FROM public.audit_logs
          WHERE (((audit_logs.resource)::text = 'avaliacoes'::text) AND (audit_logs.resource_id = (a.id)::text) AND ((audit_logs.action)::text = 'UPDATE'::text) AND ((audit_logs.old_data ->> 'status'::text) <> (audit_logs.new_data ->> 'status'::text)))) AS numero_interrupcoes,
    a.inicio AS iniciada_em,
    a.envio AS concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome
   FROM (((public.avaliacoes a
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)));

-- Recreate vw_empresas_stats
CREATE VIEW public.vw_empresas_stats AS
 SELECT ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.ativa,
    c.nome AS clinica_nome,
    count(fc.id) FILTER (WHERE (fc.ativo = true)) AS total_funcionarios,
    count(a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS total_avaliacoes_concluidas,
    count(DISTINCT l.id) AS total_lotes
   FROM (((((public.empresas_clientes ec
     JOIN public.clinicas c ON ((c.id = ec.clinica_id)))
     LEFT JOIN public.funcionarios_clinicas fc ON ((fc.empresa_id = ec.id)))
     LEFT JOIN public.funcionarios f ON (((f.id = fc.funcionario_id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  GROUP BY ec.id, ec.nome, ec.cnpj, ec.clinica_id, ec.ativa, c.nome;

COMMENT ON VIEW public.vw_empresas_stats IS 'Estatisticas de empresas com contadores de funcionarios e avaliacoes. Usa funcionarios_clinicas para contagem correta em arquitetura segregada.';

-- Recreate vw_funcionarios_por_lote
CREATE VIEW public.vw_funcionarios_por_lote AS
 SELECT f.id AS funcionario_id,
    f.cpf,
    f.nome,
    f.email,
    f.matricula,
    f.setor,
    f.funcao,
    f.turno,
    f.escala,
    COALESCE(fc.nivel_cargo, f.nivel_cargo) AS nivel_cargo,
    f.ativo,
    COALESCE(fe.entidade_id, fc.clinica_id) AS source_id,
        CASE
            WHEN (fe.id IS NOT NULL) THEN 'entidade'::text
            WHEN (fc.id IS NOT NULL) THEN 'clinica'::text
            ELSE NULL::text
        END AS source_type,
    fc.clinica_id,
    fc.empresa_id,
    a.id AS avaliacao_id,
    a.status AS status_avaliacao,
    a.inicio AS data_inicio,
    a.envio AS data_conclusao,
    a.lote_id,
    l.status AS lote_status,
    l.tipo AS lote_tipo
   FROM ((((public.funcionarios f
     LEFT JOIN public.funcionarios_entidades fe ON (((fe.funcionario_id = f.id) AND (fe.ativo = true))))
     LEFT JOIN public.funcionarios_clinicas fc ON (((fc.funcionario_id = f.id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  WHERE ((f.perfil)::text = 'funcionario'::text);

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias. Inclui source_id e source_type para identificar o contexto (entidade ou clinica). IMPORTANTE: Funcionarios podem aparecer em ambos contextos se tiverem vinculos historicos.';

-- Recreate v_solicitacoes_emissao
CREATE VIEW public.v_solicitacoes_emissao AS
 SELECT la.id AS lote_id,
    la.status_pagamento,
    la.solicitacao_emissao_em,
    la.valor_por_funcionario,
    la.link_pagamento_token,
    la.link_pagamento_enviado_em,
    la.pagamento_metodo,
    la.pagamento_parcelas,
    la.pago_em,
    e.nome AS empresa_nome,
    COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    count(a.id) AS num_avaliacoes_concluidas,
    (COALESCE(la.valor_por_funcionario, lr.valor_negociado, vc.valor_negociado) * (count(a.id))::numeric) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status,
    l.id AS laudo_id,
    l.status AS laudo_status,
    (l.hash_pdf IS NOT NULL) AS laudo_tem_hash,
    l.emitido_em AS laudo_emitido_em,
    l.enviado_em AS laudo_enviado_em,
    CASE
        WHEN ((l.id IS NOT NULL) AND (((l.status)::text = 'emitido'::text) OR ((l.status)::text = 'enviado'::text))) THEN true
        ELSE false
    END AS laudo_ja_emitido,
    CASE
        WHEN (c.id IS NOT NULL) THEN 'rh'::text
        WHEN (la.entidade_id IS NOT NULL) THEN 'gestor'::text
        ELSE 'desconhecido'::text
    END AS tipo_solicitante,
    c.id AS clinica_id,
    c.nome AS clinica_nome,
    COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
    e.id AS empresa_id,
    vc.id AS vinculo_id,
    r.id AS representante_id,
    r.nome AS representante_nome,
    r.tipo_pessoa AS representante_tipo_pessoa,
    r.percentual_comissao AS representante_percentual_comissao,
    r.modelo_comissionamento,
    (EXISTS ( SELECT 1
           FROM comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id))) AS comissao_gerada,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id)))::integer AS comissoes_geradas_count,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE ((cl.lote_pagamento_id = la.id) AND (cl.parcela_confirmada_em IS NOT NULL))))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado,
    lr.valor_custo_fixo_snapshot,
    vc.valor_negociado AS valor_negociado_vinculo
   FROM (((((((((lotes_avaliacao la
     LEFT JOIN empresas_clientes e ON ((e.id = la.empresa_id)))
     LEFT JOIN clinicas c ON ((c.id = la.clinica_id)))
     LEFT JOIN entidades ent ON ((ent.id = la.entidade_id)))
     LEFT JOIN usuarios u ON (((u.cpf)::bpchar = la.liberado_por)))
     LEFT JOIN avaliacoes a ON (((a.lote_id = la.id) AND ((a.status)::text = 'concluida'::text))))
     LEFT JOIN laudos l ON ((l.lote_id = la.id)))
     LEFT JOIN vinculos_comissao vc ON (((vc.status = ANY (ARRAY['ativo'::status_vinculo, 'inativo'::status_vinculo])) AND (vc.data_expiracao > CURRENT_DATE) AND (((COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL) AND (vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id))) OR ((COALESCE(la.entidade_id, c.entidade_id) IS NULL) AND (la.clinica_id IS NOT NULL) AND (vc.clinica_id = la.clinica_id))))))
     LEFT JOIN representantes r ON ((r.id = vc.representante_id)))
     LEFT JOIN leads_representante lr ON ((lr.id = vc.lead_id)))
  WHERE (la.status_pagamento IS NOT NULL)
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id, r.id, r.nome, r.tipo_pessoa, r.percentual_comissao, r.modelo_comissionamento, lr.valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW public.v_solicitacoes_emissao IS 'View de solicitações de emissão com status de laudo. Agregação de lotes, avaliacoes, laudos e comissoes.';
