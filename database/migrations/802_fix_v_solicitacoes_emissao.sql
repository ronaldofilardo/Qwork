-- Migration 802: Corrige view v_solicitacoes_emissao para usar entidades/clinicas
-- Data: 2026-02-09
-- Descrição: Substitui referências para empresas_clientes (removida) por entidades/clinicas

-- Remove a view anterior
DROP VIEW IF EXISTS v_solicitacoes_emissao;

-- Recria a view com as tabelas corretas
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
    COALESCE(e.nome, c.nome) AS empresa_nome,
    COALESCE(e.nome, c.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    COUNT(a.id) AS num_avaliacoes_concluidas,
    la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status
FROM lotes_avaliacao la
LEFT JOIN entidades e ON e.id = la.entidade_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
WHERE la.status_pagamento IS NOT NULL
GROUP BY 
    la.id, e.nome, c.nome, u.nome, u.cpf
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

-- Comentário da view
COMMENT ON VIEW v_solicitacoes_emissao IS 'View consolidada de solicitações de emissão de laudos com informações de pagamento. Usa entidades/clinicas (gestores/RH) ao invés das antigas tabelas empresas_clientes/tomadors.';
