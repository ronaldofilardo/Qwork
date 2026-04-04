-- Migration 1141: Adicionar link_disponibilizado_em à view v_solicitacoes_emissao
-- Contexto: A coluna foi adicionada à tabela em migration 1131, mas a view
-- foi recriada pela 1130 (hotfix produção) sem incluí-la.
-- Resultado: o frontend não conseguia saber se o link já foi disponibilizado
-- ao tomador, impossibilitando o botão "Disponibilizar na conta do tomador".

-- DROP da view existente (necessário porque ALTER VIEW não pode inserir coluna no meio)
DROP VIEW IF EXISTS public.v_solicitacoes_emissao CASCADE;

CREATE VIEW v_solicitacoes_emissao AS
SELECT
  la.id AS lote_id,
  la.status_pagamento,
  la.solicitacao_emissao_em,
  la.valor_por_funcionario,
  la.link_pagamento_token,
  la.link_pagamento_enviado_em,
  la.link_disponibilizado_em,
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
  (
    SELECT COUNT(*)
    FROM comissoes_laudo cl
    WHERE cl.lote_pagamento_id = la.id
      AND cl.parcela_confirmada_em IS NOT NULL
  )::int AS comissoes_ativas_count,
  -- Valor negociado pelo representante no lead
  COALESCE(lr.valor_negociado, vc.valor_negociado) AS lead_valor_negociado
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
  lr.valor_negociado, vc.valor_negociado
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

COMMENT ON VIEW v_solicitacoes_emissao IS
  'View para admin gerenciar solicitações de emissão. '
  'link_disponibilizado_em: quando o suporte disponibilizou o link na conta do tomador. '
  'comissoes_geradas_count: total de comissões criadas para o lote. '
  'comissoes_ativas_count: comissões com parcela_confirmada_em IS NOT NULL. '
  'Migration 1141 aplicada em 2026-04-04.';

-- Verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'v_solicitacoes_emissao'
      AND column_name = 'link_disponibilizado_em'
  ) THEN
    RAISE EXCEPTION 'FALHA: link_disponibilizado_em nÃ£o aparece na view v_solicitacoes_emissao';
  END IF;
  RAISE NOTICE '✓ v_solicitacoes_emissao atualizada com link_disponibilizado_em';
END $$;
