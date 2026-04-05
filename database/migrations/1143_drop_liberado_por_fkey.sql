-- Migration 1143: Drop FK lotes_avaliacao_liberado_por_fkey
-- Data: 05/04/2026
-- Problema: FK constraint aponta para entidades_senhas(cpf), mas usuários RH
--   (funcionários, tabela 'funcionarios') também criam lotes via /api/rh/liberar-lote.
--   Resultado: FK violation code 23503 ao inserir lote com liberado_por = CPF de RH.
-- Histórico:
--   - Migration 005: criou FK → funcionarios(cpf)
--   - Migration 303: sobrescreveu FK → entidades_senhas(cpf)  ← causa do bug
-- Solução: DROP da FK inteiramente.
--   liberado_por é CHAR(11) traceable via auditoria (audit_logs + campo livre).
--   Dois tipos de usuário criam lotes (RH e Gestor Entidade) → constraint de FK
--   para uma única tabela não é viável.

BEGIN;

DO $$
BEGIN
  -- Verificar se a constraint existe antes de dropar
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name    = 'lotes_avaliacao'
      AND constraint_name = 'lotes_avaliacao_liberado_por_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE lotes_avaliacao
      DROP CONSTRAINT lotes_avaliacao_liberado_por_fkey;
    RAISE NOTICE '[1143] FK lotes_avaliacao_liberado_por_fkey removida com sucesso';
  ELSE
    RAISE NOTICE '[1143] FK lotes_avaliacao_liberado_por_fkey não encontrada — nenhuma ação necessária';
  END IF;
END $$;

-- Validação: coluna ainda existe, apenas sem FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name  = 'lotes_avaliacao'
      AND column_name = 'liberado_por'
  ) THEN
    RAISE EXCEPTION '[1143] VALIDAÇÃO FALHOU: coluna liberado_por não encontrada em lotes_avaliacao';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name    = 'lotes_avaliacao'
      AND constraint_name = 'lotes_avaliacao_liberado_por_fkey'
  ) THEN
    RAISE EXCEPTION '[1143] VALIDAÇÃO FALHOU: FK ainda existe após DROP';
  END IF;

  RAISE NOTICE '[1143] VALIDAÇÃO OK: liberado_por existe sem FK constraint';
END $$;

COMMIT;
