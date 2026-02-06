-- Aplicar Migration 200 no Neon (com triggers desabilitados)
-- Data: 2026-01-29

BEGIN;

\echo '=== Aplicando Migration 200 no Neon (Produção)'

-- Desabilitar APENAS triggers de auditoria (não os de sistema)
ALTER TABLE funcionarios DISABLE TRIGGER audit_funcionarios;

-- 1. Criar enum
DO $$ BEGIN
  CREATE TYPE usuario_tipo_enum AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade', 
    'rh',
    'gestor',
    'admin',
    'emissor'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Tipo usuario_tipo_enum já existe';
END $$;

-- 2. Adicionar coluna
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS usuario_tipo usuario_tipo_enum;

-- 3. Migrar dados
UPDATE funcionarios
SET usuario_tipo = CASE perfil
  WHEN 'funcionario' THEN 
    CASE 
      WHEN contratante_id IS NOT NULL AND (empresa_id IS NULL AND clinica_id IS NULL)
        THEN 'funcionario_entidade'::usuario_tipo_enum
      ELSE 'funcionario_clinica'::usuario_tipo_enum
    END
  WHEN 'rh' THEN 'rh'::usuario_tipo_enum
  WHEN 'gestor' THEN 'gestor'::usuario_tipo_enum
  WHEN 'admin' THEN 'admin'::usuario_tipo_enum
  WHEN 'emissor' THEN 'emissor'::usuario_tipo_enum
  ELSE 'funcionario_clinica'::usuario_tipo_enum
END
WHERE usuario_tipo IS NULL;

-- 4. Tornar obrigatório
ALTER TABLE funcionarios ALTER COLUMN usuario_tipo SET NOT NULL;

\echo '✓ Coluna usuario_tipo criada e migrada'

-- 5. Criar índice
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo ON funcionarios(usuario_tipo);

\echo '✓ Índice criado'

-- Reabilitar triggers de auditoria
ALTER TABLE funcionarios ENABLE TRIGGER audit_funcionarios;

\echo '✓ Triggers reabilitados'

COMMIT;

\echo '=== Migration 200 aplicada com sucesso no Neon'
