-- Migration 1025: Adicionar coluna telefone à tabela usuarios
-- Necessário para /api/vendedor/dados (GET/PATCH)

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) DEFAULT NULL;
