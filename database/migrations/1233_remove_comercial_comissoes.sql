-- Migration 1233: Remove Comissões do Perfil Comercial
-- Data: 2026-04-28
-- Objetivo: Remover completamente a funcionalidade de comissionamento do comercial.
--   O comercial não recebe mais comissões por nenhum modelo (percentual ou custo_fixo),
--   nem participa do split de pagamento Asaas.
--   Precedente: migration 1133 (remoção de vendedor).

BEGIN;

-- ====================================================================
-- 0. RECRIAR VIEWS QUE DEPENDEM DAS COLUNAS A SEREM REMOVIDAS
-- ====================================================================

-- v_solicitacoes_emissao usa r.percentual_comissao_comercial
DROP VIEW IF EXISTS v_solicitacoes_emissao;

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
    COALESCE(la.valor_por_funcionario, lr.valor_negociado, vc.valor_negociado) * count(a.id)::numeric AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status,
    l.id AS laudo_id,
    l.status AS laudo_status,
    l.hash_pdf IS NOT NULL AS laudo_tem_hash,
    l.emitido_em AS laudo_emitido_em,
    l.enviado_em AS laudo_enviado_em,
        CASE
            WHEN l.id IS NOT NULL AND (l.status::text = 'emitido'::text OR l.status::text = 'enviado'::text) THEN true
            ELSE false
        END AS laudo_ja_emitido,
        CASE
            WHEN c.id IS NOT NULL THEN 'rh'::text
            WHEN la.entidade_id IS NOT NULL THEN 'gestor'::text
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
          WHERE cl.lote_pagamento_id = la.id)) AS comissao_gerada,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE cl.lote_pagamento_id = la.id))::integer AS comissoes_geradas_count,
    (( SELECT count(*) AS count
           FROM comissoes_laudo cl
          WHERE cl.lote_pagamento_id = la.id AND cl.parcela_confirmada_em IS NOT NULL))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado,
    lr.valor_custo_fixo_snapshot,
    vc.valor_negociado AS valor_negociado_vinculo
   FROM lotes_avaliacao la
     LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
     LEFT JOIN clinicas c ON c.id = la.clinica_id
     LEFT JOIN entidades ent ON ent.id = la.entidade_id
     LEFT JOIN usuarios u ON u.cpf::bpchar = la.liberado_por
     LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status::text = 'concluida'::text
     LEFT JOIN laudos l ON l.lote_id = la.id
     LEFT JOIN vinculos_comissao vc ON (vc.status = ANY (ARRAY['ativo'::status_vinculo, 'inativo'::status_vinculo])) AND vc.data_expiracao > CURRENT_DATE AND (COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id) OR COALESCE(la.entidade_id, c.entidade_id) IS NULL AND la.clinica_id IS NOT NULL AND vc.clinica_id = la.clinica_id)
     LEFT JOIN representantes r ON r.id = vc.representante_id
     LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
  WHERE la.status_pagamento IS NOT NULL
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id, r.id, r.nome, r.tipo_pessoa, r.percentual_comissao, r.modelo_comissionamento, lr.valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

ALTER VIEW public.v_solicitacoes_emissao OWNER TO CURRENT_USER;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_solicitacoes_emissao TO dba_maintenance;

-- ====================================================================
-- 1. REMOVER COLUNAS DE COMISSÃO COMERCIAL
-- ====================================================================

-- 1a. representantes: remover percentual_comissao_comercial + constraint
ALTER TABLE representantes
  DROP CONSTRAINT IF EXISTS representantes_perc_comercial_range;
ALTER TABLE representantes
  DROP COLUMN IF EXISTS percentual_comissao_comercial;

-- 1b. leads_representante: remover percentual_comissao_comercial + constraints
ALTER TABLE leads_representante
  DROP CONSTRAINT IF EXISTS leads_perc_comercial_range;
ALTER TABLE leads_representante
  DROP CONSTRAINT IF EXISTS chk_leads_perc_total_max;
ALTER TABLE leads_representante
  DROP COLUMN IF EXISTS percentual_comissao_comercial;

-- 1c. vinculos_comissao: remover percentual_comissao_comercial + constraint
ALTER TABLE vinculos_comissao
  DROP CONSTRAINT IF EXISTS vinculos_perc_comercial_range;
ALTER TABLE vinculos_comissao
  DROP COLUMN IF EXISTS percentual_comissao_comercial;

-- 1d. comissoes_laudo: remover percentual_comissao_comercial, valor_comissao_comercial + constraints
ALTER TABLE comissoes_laudo
  DROP CONSTRAINT IF EXISTS comissoes_perc_comercial_range;
ALTER TABLE comissoes_laudo
  DROP COLUMN IF EXISTS percentual_comissao_comercial;
ALTER TABLE comissoes_laudo
  DROP COLUMN IF EXISTS valor_comissao_comercial;

-- ====================================================================
-- 2. ATUALIZAR COMENTÁRIOS
-- ====================================================================

COMMENT ON COLUMN representantes.percentual_comissao IS
  'Percentual de comissão do representante (0–40%). Não há mais parcela reservada ao comercial.';

COMMENT ON COLUMN vinculos_comissao.percentual_comissao_representante IS
  'Percentual de comissão do representante neste vínculo (propagado do lead). O comercial não recebe comissão.';

COMMENT ON COLUMN comissoes_laudo.percentual_comissao IS
  'Percentual de comissão aplicado (somente representante). O comercial não recebe comissão.';

COMMIT;
