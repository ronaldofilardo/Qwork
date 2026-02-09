-- Migration 1003: Garantir contratante_id em funcionarios (idempotente)
-- Data: 2026-02-02

BEGIN;

-- Adiciona coluna contratante_id caso ainda falte
ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

-- Garante a FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_funcionarios_contratante' AND t.relname = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios
      ADD CONSTRAINT fk_funcionarios_contratante
      FOREIGN KEY (contratante_id) REFERENCES tomadores(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Índice
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id
  ON funcionarios(contratante_id)
  WHERE contratante_id IS NOT NULL;

-- Atualiza constraint para aceitar contratante_id
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR contratante_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
  ) NOT VALID;

-- Backfill (se houver dados em tomadores_funcionarios)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores_funcionarios') THEN
    UPDATE funcionarios f
    SET contratante_id = cf.contratante_id
    FROM tomadores_funcionarios cf
    WHERE f.id = cf.funcionario_id
      AND cf.tipo_contratante = 'entidade'
      AND f.contratante_id IS NULL;
  END IF;
END$$;

COMMIT;
