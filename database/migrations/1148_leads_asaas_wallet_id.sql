-- Migration 1148: add asaas_wallet_id to representantes_cadastro_leads
ALTER TABLE public.representantes_cadastro_leads
  ADD COLUMN IF NOT EXISTS asaas_wallet_id VARCHAR(200);
