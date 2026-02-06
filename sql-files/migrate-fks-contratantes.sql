-- ================================================
-- ETAPA 1.1: Migração de FKs contratantes→entidades
-- Data: 2026-02-06T18:27:42.038Z
-- ================================================

BEGIN;

-- Drop FK: contratantes_senhas.contratante_id → contratantes.id
ALTER TABLE contratantes_senhas DROP CONSTRAINT IF EXISTS fk_contratantes_senhas_contratante;

-- Drop FK: contratantes_senhas.entidade_id → contratantes.id
ALTER TABLE contratantes_senhas DROP CONSTRAINT IF EXISTS fk_contratantes_senhas_contratante;

-- Drop FK: entidades_senhas.contratante_id → contratantes.id
ALTER TABLE entidades_senhas DROP CONSTRAINT IF EXISTS fk_contratantes_senhas_contratante;

-- Drop FK: entidades_senhas.entidade_id → contratantes.id
ALTER TABLE entidades_senhas DROP CONSTRAINT IF EXISTS fk_contratantes_senhas_contratante;

-- Remover coluna obsoleta contratante_id
ALTER TABLE contratantes_senhas DROP COLUMN IF EXISTS contratante_id;

-- Recriar FK: contratantes_senhas.entidade_id → entidades.id
ALTER TABLE contratantes_senhas 
  ADD CONSTRAINT fk_contratantes_senhas_entidade_id 
  FOREIGN KEY (entidade_id) 
  REFERENCES entidades(id) 
  ON DELETE CASCADE;

-- Remover coluna obsoleta contratante_id
ALTER TABLE entidades_senhas DROP COLUMN IF EXISTS contratante_id;

-- Recriar FK: entidades_senhas.entidade_id → entidades.id
ALTER TABLE entidades_senhas 
  ADD CONSTRAINT fk_entidades_senhas_entidade_id 
  FOREIGN KEY (entidade_id) 
  REFERENCES entidades(id) 
  ON DELETE CASCADE;

COMMIT;

-- ================================================
-- Validação: Verificar FKs após migração
-- ================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('entidade_id', 'contratante_id')
  AND tc.table_name IN ('contratantes_senhas', 'contratantes_senhas', 'entidades_senhas', 'entidades_senhas')
ORDER BY tc.table_name;
