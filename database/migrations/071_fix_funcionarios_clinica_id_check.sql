-- ==========================================
-- MIGRATION: Corrigir Constraint funcionarios_clinica_id_check
-- Descrição: Incluir perfil 'gestao' nos perfis permitidos a ter clinica_id NULL
-- Data: 2026-01-04
-- Versão: 1.0.0
-- ==========================================

BEGIN;

\echo '============================================'
\echo 'MIGRATION: Corrigir Constraint funcionarios_clinica_id_check'
\echo '============================================'

-- ==========================================
-- 1. REMOVER CONSTRAINT ATUAL
-- ==========================================

\echo '1. Removendo constraint atual...'

ALTER TABLE funcionarios
DROP CONSTRAINT IF EXISTS funcionarios_clinica_id_check;

\echo '   ✓ Constraint removido'

-- ==========================================
-- 2. ADICIONAR CONSTRAINT CORRIGIDO
-- ==========================================

\echo '2. Adicionando constraint corrigido...'

-- Emissores, admins e gestores de entidade podem ter clinica_id NULL.
-- Funcionários vinculados a uma entidade (contratante_id) também podem ter clinica_id NULL.
-- Somente funcionários/RH sem vínculo (contratante_id) devem exigir clinica_id preenchido.
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_clinica_id_check
CHECK (
  (perfil IN ('emissor', 'admin', 'gestao') OR clinica_id IS NOT NULL OR contratante_id IS NOT NULL)
);

\echo '   ✓ Constraint corrigido adicionado'

-- ==========================================
-- 3. ATUALIZAR COMENTÁRIO
-- ==========================================

\echo '3. Atualizando comentário...'

COMMENT ON CONSTRAINT funcionarios_clinica_id_check ON funcionarios IS
'Emissores (acesso global), admins (gestão) e gestores de entidade (vinculados a entidades) podem ter clinica_id NULL. Funcionários e RH devem ter clinica_id preenchido.';

\echo '   ✓ Comentário atualizado'

-- ==========================================
-- 4. VALIDAÇÃO
-- ==========================================

\echo ''
\echo '============================================'
\echo 'VALIDAÇÃO'
\echo '============================================'

-- Verificar se alteração foi aplicada
\echo 'Verificando estrutura da constraint...'
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'funcionarios_clinica_id_check'
  AND conrelid = 'funcionarios'::regclass;

\echo ''
\echo '============================================'
\echo '✓ MIGRATION COMPLETA'
\echo '============================================'
\echo 'Perfil gestao agora pode ter clinica_id NULL'
\echo '============================================'

COMMIT;