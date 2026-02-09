-- Migration 401: Adicionar rastreamento de tipo_tomador em contratos
-- Data: 2026-02-07
-- Descrição: Adiciona coluna para identificar se tomador é entidade ou clinica
-- Isso permite buscar na tabela correta ao aceitar contrato

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS tipo_tomador VARCHAR(50) DEFAULT 'entidade';

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contratos_tipo_tomador ON contratos(tipo_tomador);

-- Adicionar comentário explicativo
COMMENT ON COLUMN contratos.tipo_tomador IS 'Tipo do tomador: entidade ou clinica - usado para buscar na tabela correta';

-- Opcional: Popular dados existentes (se houver contratos antigos)
-- Detectar tipo baseado em qual tabela contém o tomador_id
-- UPDATE contratos SET tipo_tomador = 'clinica' 
-- WHERE tomador_id IN (SELECT id FROM clinicas);

SELECT '✓ Migration 401 aplicada - Coluna tipo_tomador adicionada a contratos' AS status;
