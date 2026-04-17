-- Migration 1213: Adiciona asaas_wallet_id na tabela usuarios
-- Contexto: Admin e Comercial precisam de wallet Asaas para receber split
--   das comissões de cada laudo pago via Asaas.
-- Data: 2026-04-16

BEGIN;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS asaas_wallet_id VARCHAR(100);

COMMENT ON COLUMN public.usuarios.asaas_wallet_id IS
  'ID da wallet Asaas do usuário para recebimento de splits de comissão (admin, comercial).';

COMMIT;
