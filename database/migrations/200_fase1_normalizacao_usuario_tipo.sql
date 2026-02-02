-- Migration 200: FASE 1 - Normalização de Dados - Criar usuario_tipo_enum
-- Data: 2026-01-29
-- Descrição: Unificar tipos de usuário com enum claro e constraint exclusiva
-- Prioridade: CRÍTICA

BEGIN;

\echo '=== MIGRATION 200: FASE 1 - NORMALIZAÇÃO DE DADOS ==='

-- Desabilitar triggers de auditoria temporariamente
ALTER TABLE funcionarios DISABLE TRIGGER ALL;

-- ==========================================
-- 1. CRIAR ENUM DE TIPOS DE USUÁRIO
-- ==========================================

\echo '1. Criando enum usuario_tipo_enum...'

DO $$ BEGIN
  CREATE TYPE usuario_tipo_enum AS ENUM (
    'funcionario_clinica',  -- Funcionário vinculado a empresa+clinica
    'funcionario_entidade', -- Funcionário vinculado diretamente à entidade
    'gestor_rh',            -- Gestor de clínica (RH)
    'gestor_entidade',      -- Gestor de entidade
    'admin',                -- Administrador da plataforma
    'emissor'               -- Emissor de laudos (independente)
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Tipo usuario_tipo_enum já existe, pulando criação';
END $$;

\echo '   ✓ Enum criado'

-- ==========================================
-- 2. ADICIONAR COLUNA usuario_tipo
-- ==========================================

\echo '2. Adicionando coluna usuario_tipo...'

ALTER TABLE funcionarios 
  ADD COLUMN IF NOT EXISTS usuario_tipo usuario_tipo_enum;

\echo '   ✓ Coluna adicionada'

-- ==========================================
-- 3. MIGRAR DADOS EXISTENTES
-- ==========================================

\echo '3. Migrando dados existentes...'

-- Mapear perfil atual para usuario_tipo
UPDATE funcionarios SET usuario_tipo = 
  CASE perfil
    WHEN 'funcionario' THEN 
      CASE 
        WHEN contratante_id IS NOT NULL AND (empresa_id IS NULL AND clinica_id IS NULL) 
          THEN 'funcionario_entidade'::usuario_tipo_enum
        ELSE 'funcionario_clinica'::usuario_tipo_enum
      END
    WHEN 'rh' THEN 'gestor_rh'::usuario_tipo_enum
    WHEN 'gestor_entidade' THEN 'gestor_entidade'::usuario_tipo_enum
    WHEN 'admin' THEN 'admin'::usuario_tipo_enum
    WHEN 'emissor' THEN 'emissor'::usuario_tipo_enum
    ELSE 'funcionario_clinica'::usuario_tipo_enum -- fallback
  END
WHERE usuario_tipo IS NULL;

\echo '   ✓ Dados migrados'

-- ==========================================
-- 4. TORNAR COLUNA OBRIGATÓRIA
-- ==========================================

\echo '4. Tornando usuario_tipo obrigatório...'

ALTER TABLE funcionarios 
  ALTER COLUMN usuario_tipo SET NOT NULL;

\echo '   ✓ Coluna obrigatória'

-- ==========================================
-- 5. REMOVER CONSTRAINTS CONFLITANTES
-- ==========================================

\echo '5. Removendo constraints conflitantes...'

ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_id_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_entity_check;

\echo '   ✓ Constraints antigas removidas'

-- ==========================================
-- 6. CRIAR CONSTRAINT UNIFICADA E CLARA
-- ==========================================

\echo '6. Criando constraint unificada...'

ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_usuario_tipo_exclusivo CHECK (
  -- Funcionário de clínica: empresa_id + clinica_id obrigatórios, contratante_id NULL
  (usuario_tipo = 'funcionario_clinica' 
   AND empresa_id IS NOT NULL 
   AND clinica_id IS NOT NULL 
   AND contratante_id IS NULL)
  OR
  -- Funcionário de entidade: contratante_id obrigatório, empresa_id e clinica_id NULL
  (usuario_tipo = 'funcionario_entidade' 
   AND contratante_id IS NOT NULL 
   AND empresa_id IS NULL 
   AND clinica_id IS NULL)
  OR
  -- Gestor RH: clinica_id obrigatório, contratante_id NULL
  (usuario_tipo = 'gestor_rh' 
   AND clinica_id IS NOT NULL 
   AND contratante_id IS NULL)
  OR
  -- Gestor entidade: contratante_id obrigatório, clinica_id NULL
  (usuario_tipo = 'gestor_entidade' 
   AND contratante_id IS NOT NULL 
   AND clinica_id IS NULL 
   AND empresa_id IS NULL)
  OR
  -- Perfis especiais sem vinculação obrigatória
  (usuario_tipo IN ('admin', 'emissor') 
   AND clinica_id IS NULL 
   AND contratante_id IS NULL 
   AND empresa_id IS NULL)
);

\echo '   ✓ Constraint unificada criada'

-- ==========================================
-- 7. ADICIONAR COMENTÁRIOS
-- ==========================================

\echo '7. Adicionando comentários...'

COMMENT ON COLUMN funcionarios.usuario_tipo IS 
'Tipo de usuário no sistema:
- funcionario_clinica: Funcionário de empresa intermediária (clinica_id + empresa_id)
- funcionario_entidade: Funcionário direto de entidade (contratante_id)
- gestor_rh: Gestor de clínica (clinica_id)
- gestor_entidade: Gestor de entidade (contratante_id)
- admin: Administrador global (sem vínculos)
- emissor: Emissor de laudos (sem vínculos)';

COMMENT ON CONSTRAINT funcionarios_usuario_tipo_exclusivo ON funcionarios IS
'Garante vínculos exclusivos por tipo de usuário:
- Funcionário clínica: DEVE ter empresa_id + clinica_id
- Funcionário entidade: DEVE ter contratante_id
- Gestor RH: DEVE ter clinica_id
- Gestor entidade: DEVE ter contratante_id
- Admin/Emissor: NÃO DEVE ter vínculos';

\echo '   ✓ Comentários adicionados'

-- ==========================================
-- 8. CRIAR ÍNDICES
-- ==========================================

\echo '8. Criando índices...'

CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo ON funcionarios(usuario_tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo_clinica ON funcionarios(usuario_tipo, clinica_id) WHERE clinica_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo_contratante ON funcionarios(usuario_tipo, contratante_id) WHERE contratante_id IS NOT NULL;

\echo '   ✓ Índices criados'

-- ==========================================
-- 9. VALIDAR MIGRAÇÃO
-- ==========================================

\echo '9. Validando migração...'

DO $$
DECLARE
  total_registros INT;
  registros_validos INT;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM funcionarios;
  
  SELECT COUNT(*) INTO registros_validos 
  FROM funcionarios 
  WHERE usuario_tipo IS NOT NULL;
  
  IF total_registros != registros_validos THEN
    RAISE EXCEPTION 'Migração incompleta: % registros sem usuario_tipo', (total_registros - registros_validos);
  END IF;
  
  RAISE NOTICE 'Validação OK: % registros migrados com sucesso', total_registros;
END $$;

\echo '   ✓ Validação concluída'

-- Reabilitar triggers de auditoria
ALTER TABLE funcionarios ENABLE TRIGGER ALL;

\echo '   ✓ Triggers reabilitados'

COMMIT;

\echo '=== MIGRATION 200: FASE 1 CONCLUÍDA COM SUCESSO ==='
\echo ''
\echo 'Próximos passos:'
\echo '  1. Aplicar migration 201 (Fase 2 - RLS)'
\echo '  2. Atualizar código backend para usar usuario_tipo'
\echo '  3. Executar testes de integração'
