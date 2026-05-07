-- Migration 1144: FIX — Corrigir tipos VARCHAR incorretos em laudos (ZapSign + status)
-- Data: 2026-05-05
-- Problema:
--   Colunas foram criadas originalmente com VARCHAR(20) antes das migrations 1138/1143a.
--   Como ambas usam ADD COLUMN IF NOT EXISTS, colunas já existentes com tipo errado
--   não foram corrigidas.
--
--   Colunas afetadas:
--     - status               : 'aguardando_assinatura' tem 21 chars > VARCHAR(20) — migrar para VARCHAR(50)
--     - zapsign_doc_token    : UUID ZapSign (36 chars) — migrar para VARCHAR(255)
--     - zapsign_signer_token : UUID ZapSign (36 chars) — migrar para VARCHAR(255)
--     - zapsign_status       : string de status (ex: 'pending') — migrar para VARCHAR(50)
--     - zapsign_sign_url     : URL de assinatura (100+ chars) — migrar para TEXT
--
--   Sintoma: "value too long for type character varying(20)" em
--     POST /api/emissor/laudos/[loteId]/assinar
--
--   ATENÇÃO: laudos.status tem views dependentes (v_relatorio_emissoes, v_solicitacoes_emissao).
--   Elas são recriadas após o ALTER COLUMN.

-- 1. Drop views dependentes de laudos.status
DROP VIEW IF EXISTS v_relatorio_emissoes;
DROP VIEW IF EXISTS v_solicitacoes_emissao;

-- 2. Corrigir tipos das colunas
DO $$
BEGIN
  -- laudos.status: 'aguardando_assinatura' (21 chars) não cabe em VARCHAR(20)
  ALTER TABLE public.laudos ALTER COLUMN status TYPE VARCHAR(50);

  -- zapsign_doc_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laudos' AND column_name = 'zapsign_doc_token'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_doc_token TYPE VARCHAR(255);
  END IF;

  -- zapsign_signer_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laudos' AND column_name = 'zapsign_signer_token'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_signer_token TYPE VARCHAR(255);
  END IF;

  -- zapsign_status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laudos' AND column_name = 'zapsign_status'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_status TYPE VARCHAR(50);
  END IF;

  -- zapsign_sign_url: corrigir tipo se existir, ou adicionar como TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'laudos' AND column_name = 'zapsign_sign_url'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_sign_url TYPE TEXT;
  ELSE
    ALTER TABLE public.laudos ADD COLUMN zapsign_sign_url TEXT;
  END IF;
END $$;

-- 3. Recriar v_relatorio_emissoes
CREATE VIEW v_relatorio_emissoes AS
  SELECT l.id AS lote_id, l.tipo AS lote_tipo, l.status AS lote_status, l.liberado_em,
    CASE WHEN l.clinica_id IS NOT NULL THEN 'clinica'::text WHEN l.entidade_id IS NOT NULL THEN 'entidade'::text ELSE NULL::text END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome, COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome, l.empresa_id, ld.id AS laudo_id, ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em, ld.enviado_em AS laudo_enviado_em, ld.emissor_cpf,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT a.id) FILTER (WHERE a.status::text = 'concluida'::text) AS avaliacoes_concluidas
  FROM lotes_avaliacao l
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN tomadores t ON t.id = l.entidade_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
    LEFT JOIN laudos ld ON ld.lote_id = l.id
    LEFT JOIN avaliacoes a ON a.lote_id = l.id
  GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id,
           c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;

-- 4. Recriar v_solicitacoes_emissao
CREATE VIEW v_solicitacoes_emissao AS
  SELECT la.id AS lote_id, la.status_pagamento, la.solicitacao_emissao_em, la.valor_por_funcionario,
    la.link_pagamento_token, la.link_pagamento_enviado_em, la.pagamento_metodo, la.pagamento_parcelas, la.pago_em,
    e.nome AS empresa_nome, COALESCE(c.nome, e.nome, ent.nome) AS nome_tomador,
    u.nome AS solicitante_nome, u.cpf AS solicitante_cpf, count(a.id) AS num_avaliacoes_concluidas,
    COALESCE(la.valor_por_funcionario, lr.valor_negociado, vc.valor_negociado) * count(a.id)::numeric AS valor_total_calculado,
    la.criado_em AS lote_criado_em, la.liberado_em AS lote_liberado_em, la.status AS lote_status,
    l.id AS laudo_id, l.status AS laudo_status, l.hash_pdf IS NOT NULL AS laudo_tem_hash,
    l.emitido_em AS laudo_emitido_em, l.enviado_em AS laudo_enviado_em,
    CASE WHEN l.id IS NOT NULL AND (l.status::text = 'emitido'::text OR l.status::text = 'enviado'::text) THEN true ELSE false END AS laudo_ja_emitido,
    CASE WHEN c.id IS NOT NULL THEN 'rh'::text WHEN la.entidade_id IS NOT NULL THEN 'gestor'::text ELSE 'desconhecido'::text END AS tipo_solicitante,
    c.id AS clinica_id, c.nome AS clinica_nome, COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
    e.id AS empresa_id, vc.id AS vinculo_id, r.id AS representante_id, r.nome AS representante_nome,
    r.tipo_pessoa AS representante_tipo_pessoa, r.percentual_comissao AS representante_percentual_comissao, r.modelo_comissionamento,
    (EXISTS (SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id)) AS comissao_gerada,
    ((SELECT count(*) FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id))::integer AS comissoes_geradas_count,
    ((SELECT count(*) FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id AND cl.parcela_confirmada_em IS NOT NULL))::integer AS comissoes_ativas_count,
    lr.valor_negociado AS lead_valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado AS valor_negociado_vinculo
  FROM lotes_avaliacao la
    LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
    LEFT JOIN clinicas c ON c.id = la.clinica_id
    LEFT JOIN entidades ent ON ent.id = la.entidade_id
    LEFT JOIN usuarios u ON u.cpf::bpchar = la.liberado_por
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status::text = 'concluida'::text
    LEFT JOIN laudos l ON l.lote_id = la.id
    LEFT JOIN vinculos_comissao vc ON (vc.status = ANY (ARRAY['ativo'::status_vinculo, 'inativo'::status_vinculo]))
      AND vc.data_expiracao > CURRENT_DATE
      AND (COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
        OR COALESCE(la.entidade_id, c.entidade_id) IS NULL AND la.clinica_id IS NOT NULL AND vc.clinica_id = la.clinica_id)
    LEFT JOIN representantes r ON r.id = vc.representante_id
    LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
  WHERE la.status_pagamento IS NOT NULL
  GROUP BY la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome, u.nome, u.cpf,
           l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em, la.entidade_id, vc.id,
           r.id, r.nome, r.tipo_pessoa, r.percentual_comissao, r.modelo_comissionamento,
           lr.valor_negociado, lr.valor_custo_fixo_snapshot, vc.valor_negociado
  ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;
