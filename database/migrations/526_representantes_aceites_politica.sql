-- =====================================================
-- Migration 526: Aceites de Termos para Representantes
-- Data: 08/03/2026
-- Descrição:
--   Adiciona coluna aceite_politica_privacidade (e _em) na tabela
--   representantes para controlar o aceite da Política de Privacidade
--   no fluxo de primeiro acesso ao portal.
--
--   NOTA: aceite_termos e aceite_disclaimer_nv já existem (migration 500).
--   Esta migration adiciona apenas o campo que faltava para a PdP.
--
--   Representantes existentes (todos de teste) são marcados como
--   já aceitos para não exibirem o modal retroativamente.
-- =====================================================

BEGIN;

-- 1. Adicionar coluna aceite_politica_privacidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'representantes'
      AND column_name  = 'aceite_politica_privacidade'
  ) THEN
    ALTER TABLE public.representantes
      ADD COLUMN aceite_politica_privacidade    BOOLEAN    NOT NULL DEFAULT FALSE,
      ADD COLUMN aceite_politica_privacidade_em TIMESTAMPTZ;

    COMMENT ON COLUMN public.representantes.aceite_politica_privacidade
      IS 'Representante aceitou a Política de Privacidade no primeiro acesso ao portal';
    COMMENT ON COLUMN public.representantes.aceite_politica_privacidade_em
      IS 'Data/hora em que o representante aceitou a Política de Privacidade';
  END IF;
END $$;

-- 2. Marcar representantes existentes como já tendo aceito
--    (são registros de teste — não precisam ser submetidos ao fluxo de primeiro acesso)
UPDATE public.representantes
SET
  aceite_politica_privacidade    = TRUE,
  aceite_politica_privacidade_em = NOW()
WHERE aceite_politica_privacidade = FALSE;

COMMIT;
