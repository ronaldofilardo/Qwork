-- Migration 042: Add contratante_id to clinicas table
-- Adds foreign key relationship between clinicas and contratantes

-- Add contratante_id column to clinicas table
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

-- Add foreign key constraint
ALTER TABLE clinicas ADD CONSTRAINT fk_clinicas_contratante
  FOREIGN KEY (contratante_id) REFERENCES contratantes(id) ON DELETE CASCADE;

-- Add unique constraint to ensure one clinica per contratante
ALTER TABLE clinicas ADD CONSTRAINT unique_clinica_contratante
  UNIQUE (contratante_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clinicas_contratante_id ON clinicas(contratante_id);

-- Add comment
COMMENT ON COLUMN clinicas.contratante_id IS 'ID do contratante associado a esta clinica';