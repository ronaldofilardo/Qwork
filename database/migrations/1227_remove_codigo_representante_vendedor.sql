-- Migration 1227: Remover campo `codigo` de representantes e vendedores_perfil
--
-- Contexto: o sistema usava tanto `id` (PK integer) quanto `codigo` (varchar)
-- como identificadores públicos, gerando confusão (ex.: representante id=35
-- com codigo="115" era confundido entre backoffice/UX).
--
-- Decisão: remover `codigo` completamente, padronizando o `id` interno como
-- único identificador público de representantes e vendedores.
--
-- Operações (ordem):
-- 1. DROP VIEW v_solicitacoes_emissao (depende de r.codigo)
-- 2. DROP TRIGGER trg_representante_codigo em representantes
-- 3. DROP FUNCTION trg_gerar_codigo_representante()
-- 4. DROP FUNCTION gerar_codigo_representante()
-- 5. DROP SEQUENCE seq_representante_codigo
-- 6. DROP SEQUENCE seq_vendedor_codigo
-- 7. ALTER TABLE representantes DROP COLUMN codigo (CASCADE remove índice unique)
-- 8. ALTER TABLE vendedores_perfil DROP COLUMN codigo (CASCADE remove índice unique)
-- 9. Recriar v_solicitacoes_emissao sem r.codigo / representante_codigo
--
-- Nota: o enum tipo_conversao_lead mantém o valor 'codigo_representante'
-- por compatibilidade histórica (há registros em leads_representante.tipo_conversao
-- com esse valor). O semântico passa a ser "vínculo pelo identificador público
-- do representante (id)".

BEGIN;

-- 1) Dropar a view que referencia r.codigo
DROP VIEW IF EXISTS public.v_solicitacoes_emissao;

-- 2) Dropar trigger em representantes
DROP TRIGGER IF EXISTS trg_representante_codigo ON public.representantes;

-- 3) Dropar função da trigger
DROP FUNCTION IF EXISTS public.trg_gerar_codigo_representante();

-- 4) Dropar função geradora de código
DROP FUNCTION IF EXISTS public.gerar_codigo_representante();

-- 5/6) Dropar sequências (antes das colunas para evitar dependência circular caso
-- alguma coluna tenha default nextval; neste caso a coluna foi populada por
-- trigger/INSERT explícito, não via DEFAULT, então DROP direto é seguro).
DROP SEQUENCE IF EXISTS public.seq_representante_codigo;
DROP SEQUENCE IF EXISTS public.seq_vendedor_codigo;

-- 7) Remover coluna codigo de representantes
--    CASCADE remove o unique constraint/índice idx_representantes_codigo
ALTER TABLE public.representantes DROP COLUMN IF EXISTS codigo CASCADE;

-- 8) Remover coluna codigo de vendedores_perfil
ALTER TABLE public.vendedores_perfil DROP COLUMN IF EXISTS codigo CASCADE;

-- 9) Recriar v_solicitacoes_emissao sem r.codigo
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
    r.percentual_comissao_comercial AS representante_percentual_comissao_comercial,
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
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf, l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id, r.id, r.nome, r.tipo_pessoa, r.percentual_comissao, r.percentual_comissao_comercial, r.modelo_comissionamento, lr.valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW public.v_solicitacoes_emissao IS 'View para admin gerenciar solicitações de emissão. Migration 1227: removido representante_codigo (coluna codigo eliminada — usar representante_id).';

COMMIT;
