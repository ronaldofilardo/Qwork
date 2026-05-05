-- Migration 1144: FIX — Corrigir tipos VARCHAR incorretos em colunas ZapSign
-- Data: 2026-05-05
-- Problema:
--   Colunas zapsign_* foram criadas originalmente com VARCHAR(20) antes da
--   migration 1138. Como 1138 e 1143a usam ADD COLUMN IF NOT EXISTS, colunas
--   já existentes com tipo errado não foram corrigidas.
--
--   Colunas afetadas:
--     - zapsign_doc_token    : UUID ZapSign (36 chars) — migrar para VARCHAR(255)
--     - zapsign_signer_token : UUID ZapSign (36 chars) — migrar para VARCHAR(255)
--     - zapsign_status       : string de status (ex: 'pending') — migrar para VARCHAR(50)
--     - zapsign_sign_url     : URL de assinatura (100+ chars) — migrar para TEXT
--
--   Sintoma: "value too long for type character varying(20)" em
--     POST /api/emissor/laudos/[loteId]/assinar

DO $$
BEGIN
  -- zapsign_doc_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'laudos'
      AND column_name  = 'zapsign_doc_token'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_doc_token TYPE VARCHAR(255);
  END IF;

  -- zapsign_signer_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'laudos'
      AND column_name  = 'zapsign_signer_token'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_signer_token TYPE VARCHAR(255);
  END IF;

  -- zapsign_status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'laudos'
      AND column_name  = 'zapsign_status'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_status TYPE VARCHAR(50);
  END IF;

  -- zapsign_sign_url: corrigir tipo se existir com VARCHAR(20), ou adicionar como TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'laudos'
      AND column_name  = 'zapsign_sign_url'
  ) THEN
    ALTER TABLE public.laudos ALTER COLUMN zapsign_sign_url TYPE TEXT;
  ELSE
    ALTER TABLE public.laudos ADD COLUMN zapsign_sign_url TEXT;
  END IF;
END $$;
