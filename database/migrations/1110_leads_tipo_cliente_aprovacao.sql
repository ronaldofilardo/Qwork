-- Migration 1110: Adicionar tipo_cliente e campos de aprovação comercial em leads_representante
-- Permite diferenciar leads de Entidade vs Clínica e controlar aprovação.

DO $$
BEGIN
  -- tipo_cliente (entidade ou clinica)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_representante' AND column_name = 'tipo_cliente'
  ) THEN
    ALTER TABLE public.leads_representante
      ADD COLUMN tipo_cliente TEXT NOT NULL DEFAULT 'entidade'
      CHECK (tipo_cliente IN ('entidade', 'clinica'));
  END IF;

  -- Flag: lead requer aprovação do comercial
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_representante' AND column_name = 'requer_aprovacao_comercial'
  ) THEN
    ALTER TABLE public.leads_representante
      ADD COLUMN requer_aprovacao_comercial BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Quem aprovou (cpf ou nome do usuario comercial)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_representante' AND column_name = 'aprovado_por'
  ) THEN
    ALTER TABLE public.leads_representante
      ADD COLUMN aprovado_por TEXT DEFAULT NULL;
  END IF;

  -- Observação da aprovação/rejeição
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_representante' AND column_name = 'aprovacao_obs'
  ) THEN
    ALTER TABLE public.leads_representante
      ADD COLUMN aprovacao_obs TEXT DEFAULT NULL;
  END IF;

  -- Data da aprovação/rejeição
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads_representante' AND column_name = 'aprovacao_em'
  ) THEN
    ALTER TABLE public.leads_representante
      ADD COLUMN aprovacao_em TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;
