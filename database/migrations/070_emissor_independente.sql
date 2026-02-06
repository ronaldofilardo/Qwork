-- ==========================================
-- MIGRATION: Emissor Independente
-- Descrição: Permite emissores sem vínculo a clínica (clinica_id NULL)
-- Data: 2026-01-02
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo '============================================'
\echo 'MIGRATION: Emissor Independente'
\echo '============================================'

-- ==========================================
-- 1. CORRIGIR DADOS INCONSISTENTES
-- ==========================================

\echo '1. Verificando e corrigindo dados inconsistentes...'

-- Verificar quantos registros precisam de correção
SELECT COUNT(*) as registros_inconsistentes
FROM funcionarios 
WHERE clinica_id IS NULL 
  AND perfil NOT IN ('admin', 'emissor')
  AND perfil IS NOT NULL;

\echo '   Corrigindo funcionários, RH e gestores_entidade sem clinica_id...'

-- Para evitar alterar funcionários vinculados a entidades, CORRIGIMOS APENAS registros órfãos:
-- 1. Se funcionário NÃO tiver contratante_id nem clinica_id, atribuimos uma clínica padrão (ex.: 1)
-- 2. Não tocar em funcionários que já pertencem a uma entidade (contratante_id IS NOT NULL)

UPDATE funcionarios f
SET clinica_id = 1 -- Valor padrão (ajuste manual se necessário)
WHERE f.clinica_id IS NULL
  AND f.contratante_id IS NULL
  AND f.perfil NOT IN ('admin', 'emissor');

\echo '   ✓ Dados corrigidos'

-- ==========================================
-- 2. ALTERAR TABELA FUNCIONARIOS
-- ==========================================

\echo '2. Tornando clinica_id nullable para emissores...'

-- Remover constraint NOT NULL de clinica_id (se existir)
ALTER TABLE funcionarios ALTER COLUMN clinica_id DROP NOT NULL;

\echo '   ✓ clinica_id agora pode ser NULL'

-- ==========================================
-- 3. ADICIONAR CONSTRAINT CHECK
-- ==========================================

\echo '3. Adicionando constraint para validar clinica_id NULL...'

-- Emissores e admins podem ter clinica_id NULL. Funcionários vinculados a uma entidade (contratante_id) também podem ter clinica_id NULL.
-- Somente funcionários/RH sem vínculo (contratante_id) devem exigir clinica_id preenchido.
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_clinica_id_check
CHECK (
  (perfil IN ('emissor', 'admin') OR clinica_id IS NOT NULL OR contratante_id IS NOT NULL)
);

\echo '   ✓ Constraint adicionada: emissor/admin/gestor podem ter clinica_id NULL'

-- ==========================================
-- 4. ATUALIZAR POLÍTICAS RLS
-- ==========================================

\echo '4. Atualizando políticas RLS para emissores independentes...'

-- Remover política antiga de SELECT para emissores (se existir)
DROP POLICY IF EXISTS "funcionarios_emissor_select" ON funcionarios;

-- Nova política: Emissores veem apenas RH e outros emissores
-- Emissores independentes (clinica_id NULL) têm acesso global
CREATE POLICY "funcionarios_emissor_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_user_perfil() = 'emissor'
  AND perfil IN ('rh', 'emissor')
);

\echo '   ✓ Política RLS atualizada para emissores'

-- Remover política antiga de SELECT para admins (se existir)
DROP POLICY IF EXISTS "funcionarios_admin_select" ON funcionarios;

-- Atualizar política de ADMIN para incluir emissores independentes
CREATE POLICY "funcionarios_admin_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_user_perfil() = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
);

\echo '   ✓ Política RLS atualizada para admins'

-- Remover política antiga de INSERT para admins (se existir)
DROP POLICY IF EXISTS "funcionarios_admin_insert" ON funcionarios;

-- Política de inserção: Admin pode criar RH e Emissores (com ou sem clinica_id)
CREATE POLICY "funcionarios_admin_insert" ON funcionarios
FOR INSERT TO PUBLIC
WITH CHECK (
  current_user_perfil() = 'admin'
  AND perfil IN ('rh', 'emissor')
  AND (
    -- Emissor pode ter clinica_id NULL
    (perfil = 'emissor') OR
    -- RH deve ter clinica_id
    (perfil = 'rh' AND clinica_id IS NOT NULL)
  )
);

\echo '   ✓ Política RLS de INSERT atualizada'

-- Remover política antiga de UPDATE para admins (se existir)
DROP POLICY IF EXISTS "funcionarios_admin_update" ON funcionarios;

-- Política de atualização: Admin pode atualizar RH e Emissores
CREATE POLICY "funcionarios_admin_update" ON funcionarios
FOR UPDATE TO PUBLIC
USING (
  current_user_perfil() = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
)
WITH CHECK (
  current_user_perfil() = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
);

\echo '   ✓ Política RLS de UPDATE atualizada'

-- ==========================================
-- 5. COMENTÁRIOS
-- ==========================================

\echo '5. Adicionando comentários...'

COMMENT ON CONSTRAINT funcionarios_clinica_id_check ON funcionarios IS 
'Emissores (acesso global), admins (gestão) e gestores de entidade (vinculados a entidades) podem ter clinica_id NULL. Funcionários e RH devem ter clinica_id preenchido.';

COMMENT ON POLICY "funcionarios_emissor_select" ON funcionarios IS 
'Emissores visualizam RH e outros emissores de qualquer clínica';

COMMENT ON POLICY "funcionarios_admin_select" ON funcionarios IS 
'Admins visualizam RH, emissores e outros admins (gestão de usuários do sistema)';

COMMENT ON POLICY "funcionarios_admin_insert" ON funcionarios IS 
'Admins podem criar RH (com clinica_id) e emissores (com ou sem clinica_id)';

COMMENT ON POLICY "funcionarios_admin_update" ON funcionarios IS 
'Admins podem atualizar RH, emissores e admins';

\echo '   ✓ Comentários adicionados'

-- ==========================================
-- 6. VALIDAÇÃO
-- ==========================================

\echo ''
\echo '============================================'
\echo 'VALIDAÇÃO'
\echo '============================================'

-- Verificar se alteração foi aplicada
\echo 'Verificando estrutura da tabela funcionarios...'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'funcionarios'
  AND column_name = 'clinica_id';

-- Verificar políticas RLS
\echo ''
\echo 'Verificando políticas RLS em funcionarios...'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'funcionarios'
  AND policyname LIKE '%emissor%' OR policyname LIKE '%admin%'
ORDER BY policyname;

\echo ''
\echo '============================================'
\echo '✓ MIGRATION COMPLETA'
\echo '============================================'
\echo 'Emissores agora podem ser criados sem clinica_id'
\echo 'Use a rota POST /api/admin/emissores/create'
\echo '============================================'

COMMIT;
