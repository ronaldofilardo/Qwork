-- Migration 1228: Backfill asaas_net_value em pagamentos
-- Contexto: o campo asaas_net_value existe desde a migration 2026-02-14 mas
-- o webhook-handler gravava o netValue apenas em dados_adicionais->>'netValue'.
-- Esta migração preenche asaas_net_value para pagamentos existentes com status='pago'
-- onde o campo ainda está NULL mas existe em dados_adicionais.
-- A partir desta migration, o webhook-handler passa a gravar diretamente em asaas_net_value.

DO $$
BEGIN
  -- Backfill: copiar netValue do JSONB para a coluna dedicada
  UPDATE pagamentos
  SET asaas_net_value = (dados_adicionais->>'netValue')::numeric
  WHERE status = 'pago'
    AND asaas_net_value IS NULL
    AND dados_adicionais->>'netValue' IS NOT NULL
    AND (dados_adicionais->>'netValue')::numeric > 0;

  RAISE NOTICE 'Backfill asaas_net_value: % linhas atualizadas',
    (SELECT COUNT(*) FROM pagamentos WHERE asaas_net_value IS NOT NULL AND status = 'pago');
END;
$$;
