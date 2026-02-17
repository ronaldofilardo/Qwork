-- Verificação Direta do Lote 24
-- Executar no psql ou pgAdmin

-- 1. Status atual do lote
SELECT 
    id,
    status,
    status_pagamento,
    pago_em,
    pagamento_metodo,
    valor_por_funcionario
FROM lotes_avaliacao 
WHERE id = 24;

-- 2. Histórico de webhooks processados
SELECT 
    asaas_payment_id,
    event,
    processed_at,
    payload->>'externalReference' as external_ref
FROM webhook_logs 
WHERE asaas_payment_id = 'pay_dkiqwxyrnt9jf4q3'
ORDER BY processed_at DESC
LIMIT 10;

-- 3. Registros de pagamento
SELECT 
    id,
    asaas_payment_id,
    status,
    valor,
    data_pagamento,
    criado_em
FROM pagamentos
WHERE asaas_payment_id = 'pay_dkiqwxyrnt9jf4q3';

-- 4. Verificar se o lote 24 tem pagamento associado
SELECT 
    p.id as pagamento_id,
    p.asaas_payment_id,
    p.status as status_pagamento,
    p.valor,
    l.id as lote_id,
    l.status_pagamento as lote_status_pag
FROM pagamentos p
LEFT JOIN lotes_avaliacao l ON l.id = 24
WHERE p.asaas_payment_id = 'pay_dkiqwxyrnt9jf4q3';
