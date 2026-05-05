-- Migration 1237: Adicionar suporte a numero_ordem por entidade
-- Problemas corrigidos:
--   1. Cria funcao obter_proximo_numero_ordem_entidade(p_entidade_id) que retorna
--      o proximo numero de ordem POR ENTIDADE (antes o codigo usava MAX global com empresa_id IS NULL).
--   2. Adiciona constraint UNIQUE (entidade_id, numero_ordem) em lotes_avaliacao
--      para prevenir duplicatas e garantir integridade referencial dos lotes de entidades.

-- =============================================
-- 1. Funcao obter_proximo_numero_ordem_entidade
-- =============================================
CREATE OR REPLACE FUNCTION obter_proximo_numero_ordem_entidade(p_entidade_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_proximo INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_ordem), 0) + 1
  INTO v_proximo
  FROM lotes_avaliacao
  WHERE entidade_id = p_entidade_id;

  RETURN v_proximo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_proximo_numero_ordem_entidade(INTEGER) IS
'Retorna o proximo numero_ordem para lotes de uma entidade especifica.
Analogia de obter_proximo_numero_ordem para o fluxo empresa/clinica.
Migration 1237.';

-- =============================================
-- 2. Constraint UNIQUE (entidade_id, numero_ordem)
-- =============================================
-- Adicionar apenas se nao existir (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lotes_avaliacao_entidade_numero_ordem_unique'
  ) THEN
    ALTER TABLE lotes_avaliacao
      ADD CONSTRAINT lotes_avaliacao_entidade_numero_ordem_unique
      UNIQUE (entidade_id, numero_ordem);
  END IF;
END;
$$;
