-- Migration: 1208
-- Date: 2026-04-14
-- Description: Consolida campos da view v_solicitacoes_emissao.
--   - Restaura modelo_comissionamento e valor_custo_fixo_snapshot (removidos por regressão da 1207)
--   - Mantém valor_negociado_vinculo adicionado pela 1207
--   - Esta migration substitui definitivamente 1205 + 1207

BEGIN;

DROP VIEW IF EXISTS public.v_solicitacoes_emissao;

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
    (la.valor_por_funcionario * (count(a.id))::numeric) AS valor_total_calculado,
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
    r.codigo AS representante_codigo,
    r.tipo_pessoa AS representante_tipo_pessoa,
    r.percentual_comissao AS representante_percentual_comissao,
    r.modelo_comissionamento,
    (EXISTS ( SELECT 1
           FROM public.comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id))) AS comissao_gerada,
    (( SELECT count(*) AS count
           FROM public.comissoes_laudo cl
          WHERE (cl.lote_pagamento_id = la.id)))::integer AS comissoes_geradas_count,
    (( SELECT count(*) AS count
           FROM public.comissoes_laudo cl
          WHERE ((cl.lote_pagamento_id = la.id) AND (cl.parcela_confirmada_em IS NOT NULL))))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado,
    lr.valor_custo_fixo_snapshot,
    vc.valor_negociado AS valor_negociado_vinculo
   FROM (((((((((public.lotes_avaliacao la
     LEFT JOIN public.empresas_clientes e ON ((e.id = la.empresa_id)))
     LEFT JOIN public.clinicas c ON ((c.id = la.clinica_id)))
     LEFT JOIN public.entidades ent ON ((ent.id = la.entidade_id)))
     LEFT JOIN public.usuarios u ON (((u.cpf)::bpchar = la.liberado_por)))
     LEFT JOIN public.avaliacoes a ON (((a.lote_id = la.id) AND ((a.status)::text = 'concluida'::text))))
     LEFT JOIN public.laudos l ON ((l.lote_id = la.id)))
     LEFT JOIN public.vinculos_comissao vc ON (((vc.status = ANY (ARRAY['ativo'::public.status_vinculo, 'inativo'::public.status_vinculo])) AND (vc.data_expiracao > CURRENT_DATE) AND (((COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL) AND (vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id))) OR ((COALESCE(la.entidade_id, c.entidade_id) IS NULL) AND (la.clinica_id IS NOT NULL) AND (vc.clinica_id = la.clinica_id))))))
     LEFT JOIN public.representantes r ON ((r.id = vc.representante_id)))
     LEFT JOIN public.leads_representante lr ON ((lr.id = vc.lead_id)))
  WHERE (la.status_pagamento IS NOT NULL)
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf,
           l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id,
           vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao,
           r.modelo_comissionamento, lr.valor_negociado, lr.valor_custo_fixo_snapshot,
           vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

ALTER VIEW public.v_solicitacoes_emissao OWNER TO postgres;

COMMENT ON VIEW public.v_solicitacoes_emissao IS
  'View consolidada (1208) para admin/suporte gerenciar solicitações de emissão.'
  ' Campos: modelo_comissionamento, valor_custo_fixo_snapshot (da 1205),'
  ' valor_negociado_vinculo (da 1207). Substituição definitiva de 1205+1207.';

COMMIT;
