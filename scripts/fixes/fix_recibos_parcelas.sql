-- Recalcula valor_parcela e detalhes_parcelas para recibos afetados
DO $$
DECLARE
  r RECORD;
  base NUMERIC;
  last_val NUMERIC;
  paid_count INT;
  new_details JSONB;
BEGIN
  FOR r IN SELECT id, pagamento_id, valor_total_anual, numero_parcelas, detalhes_parcelas, vigencia_inicio FROM recibos WHERE pagamento_id IN (48,50,53) LOOP
    IF r.numero_parcelas IS NULL OR r.numero_parcelas <= 0 THEN
      CONTINUE;
    END IF;

    base := ROUND((r.valor_total_anual::numeric / r.numero_parcelas::numeric)::numeric, 2);
    last_val := r.valor_total_anual - base * (r.numero_parcelas - 1);

    -- Contar quantas parcelas já estão marcadas como pagas no detalhes existente
    IF r.detalhes_parcelas IS NULL THEN
      paid_count := 0;
    ELSE
      SELECT COALESCE(SUM(CASE WHEN (elem->>'pago')::boolean THEN 1 ELSE 0 END), 0) INTO paid_count FROM jsonb_array_elements(r.detalhes_parcelas) AS elem;
    END IF;

    -- Construir novo array de parcelas, preservando data_pagamento e data_vencimento quando existirem
    WITH seq AS (
      SELECT generate_series(1, r.numero_parcelas) AS n
    )
    SELECT jsonb_agg(jsonb_build_object(
      'numero', s.n,
      'valor', CASE WHEN s.n = r.numero_parcelas THEN last_val ELSE base END,
      'status', CASE WHEN s.n <= paid_count THEN 'pago' ELSE 'pendente' END,
      'data_vencimento', COALESCE((SELECT (old.elem->>'data_vencimento') FROM jsonb_array_elements(r.detalhes_parcelas) WITH ORDINALITY AS old(elem, idx) WHERE old.idx = s.n), (r.vigencia_inicio + ((s.n-1) * INTERVAL '1 month'))::date::text),
      'data_pagamento', COALESCE((SELECT (old.elem->>'data_pagamento') FROM jsonb_array_elements(r.detalhes_parcelas) WITH ORDINALITY AS old(elem, idx) WHERE old.idx = s.n), CASE WHEN s.n <= paid_count THEN now()::text ELSE null END),
      'pago', CASE WHEN s.n <= paid_count THEN true ELSE false END
    )) INTO new_details FROM seq s;

    UPDATE recibos
    SET valor_parcela = ROUND(r.valor_total_anual::numeric / r.numero_parcelas::numeric, 2),
        detalhes_parcelas = new_details,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = r.id;
  END LOOP;
END;
$$; 

-- Verificação final
SELECT id, pagamento_id, valor_total_anual, numero_parcelas, valor_parcela, detalhes_parcelas FROM recibos WHERE pagamento_id IN (48,50,53) ORDER BY id;