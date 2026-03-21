-- ====================================================================
-- Migration 1024: Vendedor ID em leads_representante
-- Data: 2026-03-20
-- Objetivo: Permitir que leads sejam originados por vendedores além de
--           representantes, vinculando o lead ao vendedor que indicou.
-- ====================================================================

BEGIN;

-- Adicionar coluna vendedor_id (nullable FK para usuarios)
ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS vendedor_id INTEGER
    REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- Adicionar coluna origem para diferenciar o canal de cadastro
ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'representante'
    CHECK (origem IN ('representante', 'vendedor', 'landing_page'));

-- Índice para queries por vendedor
CREATE INDEX IF NOT EXISTS idx_leads_representante_vendedor_id
  ON public.leads_representante (vendedor_id)
  WHERE vendedor_id IS NOT NULL;

COMMIT;
