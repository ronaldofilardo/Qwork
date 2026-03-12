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
  COALESCE(c.nome, e.nome) AS nome_tomador,
  u.nome AS solicitante_nome,
  u.cpf AS solicitante_cpf,
  COUNT(a.id) AS num_avaliacoes_concluidas,
  la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
  la.criado_em AS lote_criado_em,
  la.liberado_em AS lote_liberado_em,
  la.status AS lote_status,
  l.id AS laudo_id,
  l.status AS laudo_status,
  l.hash_pdf IS NOT NULL AS laudo_tem_hash,
  l.emitido_em AS laudo_emitido_em,
  l.enviado_em AS laudo_enviado_em,
  CASE WHEN l.id IS NOT NULL AND (l.status = 'emitido' OR l.status = 'enviado') THEN true ELSE false END AS laudo_ja_emitido,
  CASE WHEN c.id IS NOT NULL THEN 'rh' WHEN la.entidade_id IS NOT NULL THEN 'gestor' ELSE 'desconhecido' END AS tipo_solicitante,
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
  EXISTS(SELECT 1 FROM comissoes_laudo cl WHERE cl.lote_pagamento_id = la.id) AS comissao_gerada
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
LEFT JOIN laudos l ON l.lote_id = la.id
LEFT JOIN vinculos_comissao vc
  ON vc.status IN ('ativo', 'inativo')
  AND vc.data_expiracao > CURRENT_DATE
  AND (
    (COALESCE(la.entidade_id, c.entidade_id) IS NOT NULL AND vc.entidade_id = COALESCE(la.entidade_id, c.entidade_id))
    OR
    (COALESCE(la.entidade_id, c.entidade_id) IS NULL AND la.clinica_id IS NOT NULL AND vc.clinica_id = la.clinica_id)
  )
LEFT JOIN representantes r ON r.id = vc.representante_id
WHERE la.status_pagamento IS NOT NULL
GROUP BY
  la.id, e.nome, e.id, c.nome, c.id, c.entidade_id, u.nome, u.cpf,
  l.id, l.status, l.hash_pdf, l.emitido_em, l.enviado_em,
  la.entidade_id, la.clinica_id,
  vc.id, r.id, r.nome, r.codigo, r.tipo_pessoa, r.percentual_comissao
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;
