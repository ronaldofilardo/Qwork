-- Migração 016 simplificada: Adicionar apenas ultima_avaliacao_id
-- Versão simplificada sem campos que dependem de colunas inexistentes

BEGIN;

-- Adicionar apenas a coluna principal
ALTER TABLE funcionarios 
  ADD COLUMN IF NOT EXISTS ultima_avaliacao_id INTEGER;

-- Adicionar índice
CREATE INDEX IF NOT EXISTS idx_funcionarios_ultima_avaliacao 
  ON funcionarios(ultima_avaliacao_id) 
  WHERE ultima_avaliacao_id IS NOT NULL;

-- Adicionar foreign key
ALTER TABLE funcionarios 
  DROP CONSTRAINT IF EXISTS fk_funcionarios_ultima_avaliacao;

ALTER TABLE funcionarios 
  ADD CONSTRAINT fk_funcionarios_ultima_avaliacao 
  FOREIGN KEY (ultima_avaliacao_id) 
  REFERENCES avaliacoes(id) 
  ON DELETE SET NULL;

COMMIT;
