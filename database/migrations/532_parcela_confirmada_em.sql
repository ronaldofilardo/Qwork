-- ============================================================================
-- Migration 532: parcela_confirmada_em + provisionamento antecipado de comissões
--
-- OBJETIVO: Suportar o novo fluxo em que ALL as comissões de um lote parcelado
--   são criadas no primeiro webhook (retidas/provisionadas), e cada comissão
--   é individualmente ativada (retida → pendente_nf) conforme a parcela é paga.
--
-- MUDANÇAS:
--   1. ADD COLUMN comissoes_laudo.parcela_confirmada_em TIMESTAMPTZ NULL
--        NULL  = parcela futura (não paga ainda — comissão provisionada antecipadamente)
--        NOT NULL = parcela confirmada como paga via webhook; elegível para NF/RPA
--   2. INDEX parcial para queries de ativação pendente
--   3. DROP VIEW + CREATE VIEW v_solicitacoes_emissao
--        + comissoes_ativas_count:
--              COUNT das comissões com parcela_confirmada_em IS NOT NULL
--              Permite ao admin diferenciar "5 provisionadas · 2 ativas · 3 futuras"
--
-- Data: 2026-03-15
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD COLUMN parcela_confirmada_em
-- ============================================================================

ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS parcela_confirmada_em TIMESTAMPTZ NULL;

COMMENT ON COLUMN comissoes_laudo.parcela_confirmada_em IS
  'Timestamp em que a parcela correspondente foi confirmada como paga (webhook Asaas). '
  'NULL = parcela provisionada antecipadamente, ainda não paga. '
  'NOT NULL = parcela efetivamente paga; comissão elegível para transição retida → pendente_nf.';

-- ============================================================================
-- 2. INDEX para queries de ativação pendente
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comissoes_parcela_pendente
  ON comissoes_laudo(lote_pagamento_id, parcela_numero)
  WHERE parcela_confirmada_em IS NULL;

-- ============================================================================
-- 3. Recriar view v_solicitacoes_emissao com comissoes_ativas_count
-- ============================================================================

DROP VIEW IF EXISTS v_solicitacoes_emissao;

CREATE VIEW v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
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
  COUNT(a.id) AS num_avaliacoes_concluidas,
  la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
  la.criado_em AS lote_criado_em,
  la.liberado_em AS lote_liberado_em,
  la.status AS lote_status,
  -- Informações do laudo
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS laudo_tem_hash,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  CASE
    WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true
    ELSE false
  END AS laudo_ja_emitido,
  -- Tipo de solicitante
  CASE
    WHEN c.id IS NOT NULL THEN 'rh'
    WHEN la.entidade_id IS NOT NULL THEN 'gestor'
    ELSE 'desconhecido'
  END AS tipo_solicitante,
  c.id AS clinica_id,
  c.nome AS clinica_nome,
  -- entidade_id resolvido (COALESCE cobre gestores; clínicas puras ficam null)
  COALESCE(la.entidade_id, c.entidade_id) AS entidade_id,
  e.id AS empresa_id,
  -- Dados do representante vinculado
  vc.id AS vinculo_id,
  r.id AS representante_id,
  r.nome AS representante_nome,
  r.codigo AS representante_codigo,
  r.tipo_pessoa AS representante_tipo_pessoa,
  r.percentual_comissao AS representante_percentual_comissao,
  -- Flag de compatibilidade: TRUE se ao menos uma comissão foi gerada
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada,
  -- Total de comissões criadas para o lote (inclui provisionadas futuras)
  (
    SELECT COUNT(*) FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  )::int AS comissoes_geradas_count,
  -- Comissões com parcela efetivamente paga (parcela_confirmada_em IS NOT NULL)
  -- Permite diferenciar "5 provisionadas · 2 ativas · 3 aguardando parcela"
  (
    SELECT COUNT(*)
    FROM comissoes_laudo cl
    WHERE cl.lote_pagamento_id = la.id
      AND cl.parcela_confirmada_em IS NOT NULL
  )::int AS comissoes_ativas_count,
  -- Valor negociado pelo representante no lead (migration 524)
  lr.valor_negociado AS lead_valor_negociado
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN entidades ent ON ent.id = la.entidade_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
LEFT JOIN vinculos_comissao vc
  ON vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
  AND (
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL
      AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
    )
    OR
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NULL
      AND la.clinica_id IS NOT NULL
      AND vc.clinica_id = la.clinica_id
    )
  )
LEFT JOIN representantes r ON r.id = vc.representante_id
LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, ent.nome,
  u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao,
  lr.valor_negociado
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão. '
  'comissoes_geradas_count: total de comissões criadas para o lote (inclui provisionadas futuras). '
  'comissoes_ativas_count: comissões com parcela_confirmada_em IS NOT NULL (parcela efetivamente paga). '
  'Diferença = parcelas futuras provisionadas aguardando pagamento.';

COMMIT;
