-- Migration: Update RLS policies to respect processamento_em
-- Description: Prevent updates to lotes and avaliacoes while processamento_em is set
-- Created: 2026-01-27

BEGIN;

-- Drop and recreate lotes_rh_update to prevent updates during processing
DROP POLICY IF EXISTS lotes_rh_update ON public.lotes_avaliacao;
CREATE POLICY lotes_rh_update ON public.lotes_avaliacao
  FOR UPDATE
  TO PUBLIC
  USING (
    (
      current_user_perfil() = 'rh' AND clinica_id = current_user_clinica_id()
    ) AND processamento_em IS NULL
  )
  WITH CHECK (
    (
      current_user_perfil() = 'rh' AND clinica_id = current_user_clinica_id()
    ) AND processamento_em IS NULL
  );

-- Drop and recreate avaliacoes_own_update to prevent assesment updates during lote processing
DROP POLICY IF EXISTS avaliacoes_own_update ON public.avaliacoes;
CREATE POLICY avaliacoes_own_update ON public.avaliacoes
  FOR UPDATE
  TO PUBLIC
  USING (
    funcionario_cpf = current_user_cpf() AND (
      SELECT processamento_em IS NULL FROM public.lotes_avaliacao l WHERE l.id = avaliacoes.lote_id
    )
  )
  WITH CHECK (
    funcionario_cpf = current_user_cpf() AND (
      SELECT processamento_em IS NULL FROM public.lotes_avaliacao l WHERE l.id = avaliacoes.lote_id
    )
  );

-- Ensure emissores (system) can still bypass with RLS off; no changes for system

COMMIT;
