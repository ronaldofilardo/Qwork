-- Migração 055: adicionar coluna nome_fantasia em clinicas
-- Data: 20/01/2026
-- Descrição: Corrige funções/triggers que esperam a coluna nome_fantasia; popula a coluna com o valor de nome

BEGIN;

ALTER TABLE IF EXISTS clinicas
  ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;

-- Popular com o valor existente de nome para compatibilidade retroativa
UPDATE clinicas SET nome_fantasia = nome WHERE nome_fantasia IS NULL;

COMMENT ON COLUMN clinicas.nome_fantasia IS 'Nome fantasia/razão exibida para pessoas jurídicas (sinônimo de nome)';

COMMIT;

SELECT '✓ Migração 055 aplicada com sucesso' AS status;
