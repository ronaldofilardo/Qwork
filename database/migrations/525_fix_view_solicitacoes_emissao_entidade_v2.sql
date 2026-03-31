-- ============================================================================
-- Migration 525: Corrigir v_solicitacoes_emissao para lotes de Entidade (v2)
--
-- PROBLEMA: Migration 524 recriou a view com JOIN (INNER) em empresas_clientes,
--           revertendo a correção da migration 522 (LEFT JOIN).
--           Lotes de entidade têm empresa_id = NULL e são excluídos pelo INNER JOIN.
--           Também perdeu o LEFT JOIN em entidades para resolver nome_tomador.
--
-- SOLUÇÃO: Recriar view com:
--   1. LEFT JOIN em empresas_clientes (não exclui lotes empresa_id=NULL)
--   2. LEFT JOIN em entidades (resolve nome_tomador para entidades puras)
--   3. COALESCE(c.nome, e.nome, ent.nome) para nome_tomador completo
--   4. Mantém lead_valor_negociado (adicionado na migration 524)
--   5. Mantém lógica completa de vinculos_comissao (entidade OU clinica)
--
-- Data: 2026-03-08
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
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
  -- Flag indicando se comissão já foi gerada para este lote
  EXISTS(
    SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id
  ) AS comissao_gerada,
  -- Valor negociado pelo representante no lead (migration 524)
  lr.valor_negociado AS lead_valor_negociado
FROM lotes_avaliacao la
-- LEFT JOIN: lotes de entidade têm empresa_id = NULL — não devem ser excluídos
LEFT JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
-- LEFT JOIN em entidades para resolver nome_tomador em fluxos de entidade pura
LEFT JOIN entidades ent ON ent.id = la.entidade_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
-- JOIN com vínculos: cobre fluxo gestor (entidade_id) E clínica (clinica_id)
LEFT JOIN vinculos_comissao vc
  ON vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
  AND (
    -- Fluxo gestor: la.entidade_id ou clinica.entidade_id
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL
      AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id)
    )
    OR
    -- Fluxo clínica pura: vincular por clinica_id
    (
      COALESCE(la.entidade_id, c.entidade_id) IS NULL
      AND la.clinica_id IS NOT NULL
      AND vc.clinica_id = la.clinica_id
    )
  )
LEFT JOIN representantes r ON r.id = vc.representante_id
-- JOIN com leads_representante para pegar valor_negociado (migration 524)
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
  'Suporta lotes de clínicas (empresa_id preenchido), entidades (entidade_id preenchido, empresa_id NULL) '
  'e vínculo por clinica_id (fluxo RH puro). '
  'nome_tomador resolve via COALESCE(clínica, empresa, entidade). '
  'Inclui lead_valor_negociado do representante. '
  'Corrigida em 08/03/2026 (migration 525): LEFT JOIN em empresas_clientes + entidades.';

COMMIT;
