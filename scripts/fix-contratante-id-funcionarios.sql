-- Fix: garantir coluna contratante_id em funcionarios e constraints (idempotente)
-- Data: 2026-02-02

BEGIN;

-- 1. Adicionar coluna se ausente
ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

-- 2. Criar foreign key se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_funcionarios_contratante' AND t.relname = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios
      ADD CONSTRAINT fk_funcionarios_contratante
      FOREIGN KEY (contratante_id) REFERENCES contratantes(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- 3. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id
  ON funcionarios(contratante_id)
  WHERE contratante_id IS NOT NULL;

-- 4. Atualizar constraint funcionarios_clinica_check para aceitar contratante_id
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR contratante_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
  ) NOT VALID;

-- 5. Backfill: popular a coluna contratante_id a partir de contratantes_funcionarios (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratantes_funcionarios') THEN
    UPDATE funcionarios f
    SET contratante_id = cf.contratante_id
    FROM contratantes_funcionarios cf
    WHERE f.id = cf.funcionario_id
      AND cf.tipo_contratante = 'entidade'
      AND f.contratante_id IS NULL;
  END IF;
END$$;

COMMIT;

-- Verificação rápida (select retornará 1 se coluna existir)
SELECT COUNT(*) AS qtd_contratante_id_populados FROM funcionarios WHERE contratante_id IS NOT NULL;
