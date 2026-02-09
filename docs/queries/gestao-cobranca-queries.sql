-- ============================================
-- QUERIES PARA GESTÃO DE COBRANÇA
-- Área: Financeiro > Cobrança (Admin)
-- ============================================

-- 1. Listar todos os pagamentos com status das parcelas
-- Útil para dashboard de cobrança
SELECT 
    p.id as pagamento_id,
    c.id as contratante_id,
    c.nome as contratante_nome,
    c.cnpj,
    pl.nome as plano_nome,
    p.valor as valor_total,
    p.numero_parcelas,
    p.numero_funcionarios,
    p.valor_por_funcionario,
    p.metodo as metodo_pagamento,
    p.status as status_pagamento,
    p.data_pagamento,
    p.detalhes_parcelas,
    ct.status as status_contrato,
    r.vigencia_inicio,
    r.vigencia_fim
FROM pagamentos p
INNER JOIN tomadores c ON c.id = p.contratante_id
INNER JOIN contratos ct ON ct.id = p.contrato_id
INNER JOIN planos pl ON pl.id = ct.plano_id
LEFT JOIN recibos r ON r.pagamento_id = p.id
WHERE p.numero_parcelas > 1 -- Apenas parcelados
ORDER BY p.data_pagamento DESC;

-- 2. Expandir parcelas individuais (usando jsonb_array_elements)
-- Mostra cada parcela separadamente com seu status
SELECT 
    p.id as pagamento_id,
    c.nome as contratante_nome,
    c.cnpj,
    p.valor as valor_total,
    parcela->>'numero' as parcela_numero,
    (parcela->>'valor')::numeric as parcela_valor,
    parcela->>'data_vencimento' as data_vencimento,
    parcela->>'status' as parcela_status
FROM pagamentos p
INNER JOIN tomadores c ON c.id = p.contratante_id
CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
WHERE p.detalhes_parcelas IS NOT NULL
ORDER BY c.nome, (parcela->>'numero')::int;

-- 3. Parcelas vencidas (para alertas e cobrança)
SELECT 
    p.id as pagamento_id,
    c.id as contratante_id,
    c.nome as contratante_nome,
    c.email,
    c.telefone,
    parcela->>'numero' as parcela_numero,
    (parcela->>'valor')::numeric as parcela_valor,
    (parcela->>'data_vencimento')::date as data_vencimento,
    CURRENT_DATE - (parcela->>'data_vencimento')::date as dias_atraso,
    parcela->>'status' as status_parcela
FROM pagamentos p
INNER JOIN tomadores c ON c.id = p.contratante_id
CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
WHERE p.detalhes_parcelas IS NOT NULL
  AND parcela->>'status' = 'pendente'
  AND (parcela->>'data_vencimento')::date < CURRENT_DATE
ORDER BY (parcela->>'data_vencimento')::date ASC;

-- 4. Próximos vencimentos (próximos 30 dias)
SELECT 
    p.id as pagamento_id,
    c.nome as contratante_nome,
    c.email,
    parcela->>'numero' as parcela_numero,
    (parcela->>'valor')::numeric as parcela_valor,
    (parcela->>'data_vencimento')::date as data_vencimento,
    (parcela->>'data_vencimento')::date - CURRENT_DATE as dias_ate_vencimento
FROM pagamentos p
INNER JOIN tomadores c ON c.id = p.contratante_id
CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
WHERE p.detalhes_parcelas IS NOT NULL
  AND parcela->>'status' = 'pendente'
  AND (parcela->>'data_vencimento')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY (parcela->>'data_vencimento')::date ASC;

-- 5. Resumo financeiro por contratante
SELECT 
    c.id,
    c.nome,
    c.cnpj,
    COUNT(DISTINCT p.id) as total_contratos,
    SUM(p.valor) as valor_total_contratado,
    SUM(p.numero_funcionarios) as total_funcionarios,
    pl.nome as plano_nome,
    COUNT(DISTINCT CASE WHEN parcela->>'status' = 'pago' THEN parcela->>'numero' END) as parcelas_pagas,
    COUNT(DISTINCT CASE WHEN parcela->>'status' = 'pendente' THEN parcela->>'numero' END) as parcelas_pendentes,
    SUM(CASE WHEN parcela->>'status' = 'pago' THEN (parcela->>'valor')::numeric ELSE 0 END) as valor_pago,
    SUM(CASE WHEN parcela->>'status' = 'pendente' THEN (parcela->>'valor')::numeric ELSE 0 END) as valor_pendente
FROM tomadores c
INNER JOIN pagamentos p ON p.contratante_id = c.id
INNER JOIN contratos ct ON ct.id = p.contrato_id
INNER JOIN planos pl ON pl.id = ct.plano_id
LEFT JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela ON true
WHERE c.ativa = true
GROUP BY c.id, c.nome, c.cnpj, pl.nome
ORDER BY valor_pendente DESC;

-- 6. Atualizar status de uma parcela específica (exemplo de UPDATE)
-- Usar quando o pagamento for confirmado
/*
UPDATE pagamentos
SET detalhes_parcelas = jsonb_set(
    detalhes_parcelas,
    '{0,status}', -- Índice da parcela (0-based)
    '"pago"'::jsonb,
    false
)
WHERE id = <pagamento_id>;
*/

-- 7. Exemplo de query para atualizar status de parcela pelo número
-- Mais robusto: procura a parcela pelo número
/*
UPDATE pagamentos p
SET detalhes_parcelas = (
    SELECT jsonb_agg(
        CASE 
            WHEN elem->>'numero' = '<numero_parcela>' 
            THEN jsonb_set(elem, '{status}', '"pago"'::jsonb)
            ELSE elem
        END
    )
    FROM jsonb_array_elements(p.detalhes_parcelas) as elem
)
WHERE p.id = <pagamento_id>;
*/

-- 8. Dashboard: métricas gerais de cobrança
SELECT 
    COUNT(DISTINCT p.id) as total_pagamentos_parcelados,
    SUM(p.valor) as valor_total_contratado,
    SUM(CASE WHEN parcela->>'status' = 'pago' THEN (parcela->>'valor')::numeric ELSE 0 END) as valor_recebido,
    SUM(CASE WHEN parcela->>'status' = 'pendente' THEN (parcela->>'valor')::numeric ELSE 0 END) as valor_a_receber,
    COUNT(CASE WHEN parcela->>'status' = 'pendente' 
               AND (parcela->>'data_vencimento')::date < CURRENT_DATE 
          THEN 1 END) as parcelas_vencidas,
    COUNT(CASE WHEN parcela->>'status' = 'pendente' THEN 1 END) as parcelas_pendentes,
    COUNT(CASE WHEN parcela->>'status' = 'pago' THEN 1 END) as parcelas_pagas
FROM pagamentos p
LEFT JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela ON true
WHERE p.numero_parcelas > 1;

-- 9. Histórico de pagamentos de um contratante específico
SELECT 
    p.id as pagamento_id,
    p.data_pagamento,
    p.valor as valor_total,
    p.metodo,
    p.numero_parcelas,
    p.numero_funcionarios,
    p.valor_por_funcionario,
    pl.nome as plano,
    ct.status as status_contrato,
    r.vigencia_inicio,
    r.vigencia_fim,
    r.numero_recibo
FROM pagamentos p
INNER JOIN contratos ct ON ct.id = p.contrato_id
INNER JOIN planos pl ON pl.id = ct.plano_id
LEFT JOIN recibos r ON r.pagamento_id = p.id
WHERE p.contratante_id = <contratante_id>
ORDER BY p.data_pagamento DESC;

-- 10. Exemplo de cálculo de inadimplência
SELECT 
    c.id,
    c.nome,
    c.email,
    c.telefone,
    COUNT(*) as total_parcelas_vencidas,
    SUM((parcela->>'valor')::numeric) as valor_total_vencido,
    MIN((parcela->>'data_vencimento')::date) as primeira_parcela_vencida,
    MAX(CURRENT_DATE - (parcela->>'data_vencimento')::date) as dias_maior_atraso
FROM tomadores c
INNER JOIN pagamentos p ON p.contratante_id = c.id
CROSS JOIN LATERAL jsonb_array_elements(p.detalhes_parcelas) as parcela
WHERE parcela->>'status' = 'pendente'
  AND (parcela->>'data_vencimento')::date < CURRENT_DATE
GROUP BY c.id, c.nome, c.email, c.telefone
HAVING COUNT(*) > 0
ORDER BY dias_maior_atraso DESC, valor_total_vencido DESC;

-- ============================================
-- NOTAS PARA IMPLEMENTAÇÃO FUTURA
-- ============================================

/*
Para a interface de Gestão de Cobrança no Admin, considerar:

1. Dashboard com cards:
   - Total a receber
   - Valor vencido
   - Parcelas pendentes (próximos 30 dias)
   - Taxa de inadimplência

2. Tabela de parcelas:
   - Filtros: Status, data vencimento, contratante
   - Ações: Marcar como pago, enviar lembrete, baixar boleto
   - Indicadores visuais: vencido (vermelho), próximo (amarelo), pago (verde)

3. Notificações automáticas:
   - 7 dias antes do vencimento
   - No dia do vencimento
   - 3, 7, 15 dias após vencimento

4. Relatórios:
   - Fluxo de caixa projetado
   - Histórico de pagamentos
   - Análise de inadimplência por período
*/
