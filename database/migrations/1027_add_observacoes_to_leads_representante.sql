-- Migration 1027: Adiciona coluna observacoes em leads_representante
-- Contexto: coluna ausente na tabela mas referenciada pelo código POST /api/vendedor/leads

ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT NULL;
