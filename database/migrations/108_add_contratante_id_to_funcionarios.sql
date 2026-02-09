-- Migration 108: Adicionar coluna contratante_id em funcionarios para suportar entidades
-- Data: 2026-01-15
-- Contexto: Funcionários de entidades (gestor) devem vincular-se à contratante (tipo='entidade')
--           Funcionários de clínicas vinculam-se a empresa_id + clinica_id

BEGIN;

-- 1. Adicionar coluna contratante_id (nullable inicialmente)
ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS contratante_id INTEGER;

COMMENT ON COLUMN funcionarios.contratante_id IS
'ID da contratante (tipo=entidade) à qual o funcionário pertence. NULL para funcionários de clínicas (que usam empresa_id/clinica_id).';

-- 2. Adicionar foreign key para garantir integridade
ALTER TABLE funcionarios
  ADD CONSTRAINT fk_funcionarios_contratante
  FOREIGN KEY (contratante_id) REFERENCES tomadores(id)
  ON DELETE CASCADE;

-- 3. Criar índice para performance em queries de entidade
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id
  ON funcionarios(contratante_id)
  WHERE contratante_id IS NOT NULL;

-- 4. Atualizar constraint funcionarios_clinica_check (já existe pela migration 072, mas garantir atualização)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    clinica_id IS NOT NULL
    OR contratante_id IS NOT NULL
    OR perfil IN ('emissor', 'admin', 'gestao')
  ) NOT VALID;

COMMENT ON CONSTRAINT funcionarios_clinica_check ON funcionarios IS
'Permite funcionarios sem clinica_id quando vinculados a um contratante (entidade) ou perfis especiais.';

-- 5. Backfill: atualizar funcionários de gestores_entidade vinculados via tomadores_funcionarios
UPDATE funcionarios f
SET contratante_id = cf.contratante_id
FROM tomadores_funcionarios cf
WHERE f.id = cf.funcionario_id
  AND cf.tipo_contratante = 'entidade'
  AND f.contratante_id IS NULL;

SELECT '108.1 Coluna contratante_id adicionada com sucesso' as status;
SELECT '108.2 Foreign key e índice criados' as status;
SELECT '108.3 Constraint atualizada' as status;
SELECT '108.4 Backfill executado: ' || COUNT(*)::text || ' registros atualizados' as status
FROM funcionarios WHERE contratante_id IS NOT NULL;

COMMIT;
