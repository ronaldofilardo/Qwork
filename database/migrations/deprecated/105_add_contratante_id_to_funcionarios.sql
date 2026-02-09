-- Migration 105: Adicionar coluna contratante_id em funcionarios
-- Data: 2026-01-23
-- Descrição: Necessária para isolar funcionários de entidades (entidade -> contratante_id)

BEGIN;

ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id
  ON funcionarios(contratante_id);

-- Adicionar foreign key opcional
ALTER TABLE funcionarios
  DROP CONSTRAINT IF EXISTS fk_funcionarios_contratante;

ALTER TABLE funcionarios
  ADD CONSTRAINT fk_funcionarios_contratante
  FOREIGN KEY (contratante_id)
  REFERENCES tomadores(id)
  ON DELETE SET NULL;

COMMIT;