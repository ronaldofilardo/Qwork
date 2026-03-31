-- ============================================================================
-- MIGRATION 505: Suporte a clínicas em comissoes_laudo
-- Descrição: Torna entidade_id e laudo_id opcionais; adiciona clinica_id para
--            lotes de clínica (RH-flow) onde não existe entidade espelho.
-- Data: 2026-03-03
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADICIONAR clinica_id NULLABLE
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS clinica_id INTEGER REFERENCES public.clinicas(id)
  ON DELETE RESTRICT;

COMMENT ON COLUMN public.comissoes_laudo.clinica_id IS
  'FK para clinicas: preenchido quando o tomador é uma clínica RH-flow sem entidade espelho. '
  'Mutuamente exclusivo com entidade_id.';

-- ============================================================================
-- 2. TORNAR entidade_id OPCIONAL
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ALTER COLUMN entidade_id DROP NOT NULL;

-- ============================================================================
-- 3. TORNAR laudo_id OPCIONAL
--    Comissão pode ser gerada antes do laudo ser emitido
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ALTER COLUMN laudo_id DROP NOT NULL;

-- ============================================================================
-- 4. CHECK: entidade_id OU clinica_id obrigatório
-- ============================================================================

ALTER TABLE public.comissoes_laudo
  ADD CONSTRAINT comissao_entidade_ou_clinica
    CHECK (
      (entidade_id IS NOT NULL AND clinica_id IS NULL)
      OR
      (entidade_id IS NULL AND clinica_id IS NOT NULL)
    );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'comissoes_laudo'
      AND column_name  = 'clinica_id'
  ) THEN
    RAISE EXCEPTION 'FALHA: clinica_id não encontrada em comissoes_laudo';
  END IF;

  IF (
    SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'comissoes_laudo'
      AND column_name  = 'entidade_id'
  ) = 'NO' THEN
    RAISE EXCEPTION 'FALHA: entidade_id ainda é NOT NULL em comissoes_laudo';
  END IF;

  RAISE NOTICE 'OK: Migration 505 aplicada com sucesso';
END;
$$;

COMMIT;
