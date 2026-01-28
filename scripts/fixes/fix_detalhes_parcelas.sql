-- Corrige detalhes_parcelas para pagamentos parcelados
-- Recalcula baseado no valor total dividido pelo numero_parcelas

BEGIN;

-- Para pagamentos com numero_parcelas > 1, recalcular detalhes_parcelas
UPDATE pagamentos
SET detalhes_parcelas = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'numero', n,
      'valor', CASE WHEN n = numero_parcelas THEN valor - ((numero_parcelas - 1) * (valor / numero_parcelas)) ELSE (valor / numero_parcelas) END,
      'status', CASE WHEN n = 1 THEN 'pago' ELSE 'pendente' END,
      'data_vencimento', (CURRENT_DATE + INTERVAL '1 month' * (n - 1))::date,
      'data_pagamento', CASE WHEN n = 1 THEN CURRENT_TIMESTAMP ELSE null END,
      'pago', CASE WHEN n = 1 THEN true ELSE false END
    )
  )
  FROM generate_series(1, numero_parcelas) AS n
)
WHERE numero_parcelas > 1 AND status = 'pago';

COMMIT;

-- Verificar
SELECT id, contratante_id, valor, numero_parcelas, detalhes_parcelas FROM pagamentos WHERE contratante_id IN (55,56,57) ORDER BY id;