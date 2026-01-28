-- Aplicar correções para pagamentos dos contratantes 55,56,57
-- Idempotente: atualiza registros existentes e insere recibo se ausente
BEGIN;

-- 1) Atualiza pagamento contratante 57 (id 53) -> personalizado 150x R$12 = R$1800 em 5x R$360
UPDATE pagamentos
SET valor_por_funcionario = 12.00,
    numero_funcionarios = 150,
    valor = 12.00 * 150,
    numero_parcelas = 5,
    detalhes_parcelas = $$[
      {"pago": true, "valor": 360.00, "numero": 1, "status": "pago", "data_pagamento": "2025-12-31T12:50:11.000Z", "data_vencimento": "2025-12-31"},
      {"pago": false, "valor": 360.00, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-01-31"},
      {"pago": false, "valor": 360.00, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-02-28"},
      {"pago": false, "valor": 360.00, "numero": 4, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-03-31"},
      {"pago": false, "valor": 360.00, "numero": 5, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-04-30"}
    ]$$,
    status = 'pago',
    data_pagamento = '2025-12-31 12:50:11.35805',
    data_confirmacao = '2025-12-31 12:50:11.35805'
WHERE id = 53;

-- 2) Atualiza pagamento contratante 55 (id 48) -> personalizado 1200x R$7 = R$8400 à vista
UPDATE pagamentos
SET valor_por_funcionario = 7.00,
    numero_funcionarios = 1200,
    valor = 7.00 * 1200,
    numero_parcelas = 1,
    detalhes_parcelas = $$[
      {"pago": true, "valor": 8400.00, "numero": 1, "status": "pago", "data_pagamento": "2025-12-27T09:39:22.548Z", "data_vencimento": "2025-12-27"}
    ]$$,
    status = 'pago',
    data_pagamento = '2025-12-27 09:39:22.492173',
    data_confirmacao = '2025-12-27 09:39:22.492173'
WHERE id = 48;

-- 3) Atualiza pagamento contratante 56 (id 50) -> fixo 15x R$20 = R$300 em 3x R$100
UPDATE pagamentos
SET valor_por_funcionario = 20.00,
    numero_funcionarios = 15,
    valor = 20.00 * 15,
    numero_parcelas = 3,
    detalhes_parcelas = $$[
      {"pago": true, "valor": 100.00, "numero": 1, "status": "pago", "data_pagamento": "2025-12-27T12:58:11.216Z", "data_vencimento": "2025-12-27"},
      {"pago": false, "valor": 100.00, "numero": 2, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-01-27"},
      {"pago": false, "valor": 100.00, "numero": 3, "status": "pendente", "data_pagamento": null, "data_vencimento": "2026-02-27"}
    ]$$,
    status = 'pago',
    data_pagamento = '2025-12-27 09:58:11.2028',
    data_confirmacao = '2025-12-27 09:58:11.2028'
WHERE id = 50;

-- 4) Atualiza recibos já existentes para refletir os valores corrigidos
UPDATE recibos
SET valor_total_anual = p.valor,
    valor_por_funcionario = p.valor_por_funcionario,
    numero_funcionarios_cobertos = p.numero_funcionarios,
    numero_parcelas = p.numero_parcelas,
    valor_parcela = (CASE WHEN p.numero_parcelas > 0 THEN (p.valor / p.numero_parcelas) ELSE p.valor END),
    detalhes_parcelas = p.detalhes_parcelas
FROM pagamentos p
WHERE recibos.pagamento_id = p.id
  AND p.id IN (48,50);

-- 5) Inserir recibo para pagamento 53 se não existir
INSERT INTO recibos (
  contrato_id, pagamento_id, contratante_id, vigencia_inicio, vigencia_fim,
  numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario,
  numero_parcelas, valor_parcela, detalhes_parcelas, forma_pagamento, ativo, criado_em, atualizado_em
)
SELECT
  NULL as contrato_id, p.id, p.contratante_id, (p.data_pagamento::date) as vigencia_inicio, ((p.data_pagamento::date) + INTERVAL '364 days')::date as vigencia_fim,
  p.numero_funcionarios, p.valor, p.valor_por_funcionario,
  p.numero_parcelas, (CASE WHEN p.numero_parcelas > 0 THEN (p.valor / p.numero_parcelas) ELSE p.valor END), p.detalhes_parcelas,
  'boleto' as forma_pagamento, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM pagamentos p
WHERE p.id = 53
  AND NOT EXISTS (SELECT 1 FROM recibos r WHERE r.pagamento_id = p.id);

COMMIT;

-- Exibir verificação
SELECT p.id, p.contratante_id, p.valor, p.numero_parcelas, p.numero_funcionarios, p.valor_por_funcionario, p.status, p.data_pagamento FROM pagamentos p WHERE p.id IN (48,50,53) ORDER BY p.id;
SELECT r.id, r.pagamento_id, r.contratante_id, r.valor_total_anual, r.valor_por_funcionario, r.numero_funcionarios_cobertos, r.numero_parcelas, r.valor_parcela FROM recibos r WHERE r.pagamento_id IN (48,50,53) ORDER BY r.id;