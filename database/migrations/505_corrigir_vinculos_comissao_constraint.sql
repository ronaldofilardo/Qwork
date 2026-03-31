-- ============================================================================
-- MIGRATION 505: Corrigir unicidade em vinculos_comissao
-- Descrição: A migração 504 criou índices UNIQUE parciais. PostgreSQL não 
--            suporta ON CONFLICT com índices parciais — só com constraints.
--            Não é possível converter em constraint.
--            Solução: Remover ON CONFLICT do código e tratar duplicatas normalmente.
--            O índice já garante a integridade; basta ignorar o erro.
-- Data: 2026-03-08
-- ============================================================================

BEGIN;

-- Não há alterações de schema necessárias.
-- A migração 504 já criou os índices corretos.
-- O problema é no código (ON CONFLICT) — será corrigido em comissionamento.ts

-- Para garantir que os índices existem (safety check):
CREATE UNIQUE INDEX IF NOT EXISTS vinculo_unico_entidade
  ON public.vinculos_comissao (representante_id, entidade_id)
  WHERE entidade_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vinculo_unico_clinica
  ON public.vinculos_comissao (representante_id, clinica_id)
  WHERE clinica_id IS NOT NULL;

COMMIT;
