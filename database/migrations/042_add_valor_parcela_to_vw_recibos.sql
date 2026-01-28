-- Migration: 042_add_valor_parcela_to_vw_recibos
-- Adds computed column `valor_parcela` to vw_recibos_completos

DROP VIEW IF EXISTS vw_recibos_completos CASCADE;

CREATE VIEW vw_recibos_completos AS
SELECT 
    r.id,
    r.numero_recibo,
    r.vigencia_inicio,
    r.vigencia_fim,
    r.numero_funcionarios_cobertos,
    r.valor_total_anual,
    r.valor_por_funcionario,
    r.forma_pagamento,
    r.numero_parcelas,
    -- Computed valor_parcela: prefer explicit r.valor_parcela, otherwise divide total by parcelas
    COALESCE(r.valor_parcela,
             CASE WHEN r.numero_parcelas IS NOT NULL AND r.numero_parcelas > 0
                  THEN ROUND((r.valor_total_anual::numeric / r.numero_parcelas::numeric)::numeric, 2)
                  ELSE r.valor_total_anual
             END) AS valor_parcela,
    r.descricao_pagamento,
    r.criado_em,
    -- Dados do contrato
    c.id AS contrato_id,
    c.conteudo_gerado AS contrato_conteudo,
    c.data_aceite AS contrato_data_aceite,
    -- Dados do contratante
    ct.nome AS contratante_nome,
    ct.cnpj AS contratante_cnpj,
    ct.email AS contratante_email,
    ct.tipo AS contratante_tipo,
    -- Dados do plano
    p.nome AS plano_nome,
    p.tipo AS plano_tipo,
    -- Dados do pagamento
    pg.metodo AS pagamento_metodo,
    pg.data_pagamento,
    pg.status AS pagamento_status
FROM recibos r
INNER JOIN contratos c ON r.contrato_id = c.id
INNER JOIN contratantes ct ON r.contratante_id = ct.id
INNER JOIN pagamentos pg ON r.pagamento_id = pg.id
INNER JOIN planos p ON c.plano_id = p.id
WHERE r.ativo = true
ORDER BY r.criado_em DESC;

COMMENT ON VIEW vw_recibos_completos IS 'View com informações completas de recibos incluindo dados de contrato, contratante, plano, pagamento e valor_parcela calculado quando necessário';
