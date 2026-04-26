-- Migration 1225: Remove coluna percentual_comissao_vendedor (legado pós-migration-1133)
-- A coluna foi tornada dead-code após migration 1133 que removeu a lógica de comissão
-- de vendedor. Removida aqui para limpar o schema.
-- NOTA: IF EXISTS garante idempotência caso já removida.

ALTER TABLE public.leads_representante
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

ALTER TABLE public.vinculos_comissao
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;
