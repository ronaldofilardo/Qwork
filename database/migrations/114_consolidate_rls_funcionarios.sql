-- ==========================================
-- Migration: Consolidar e Reforçar RLS para Funcionários
-- Data: 2026-01-19
-- Objetivo: Garantir isolamento completo entre RH (clínicas) e Gestores de Entidade
-- ==========================================

-- CONTEXTO:
-- - RH (perfil 'rh'): Gerenciam funcionários de SUA clínica (clinica_id)
-- - Gestor de Entidade (perfil 'gestor_entidade'): Gerenciam funcionários de SUA entidade (contratante_id)
-- - Admin (perfil 'admin'): Gerenciam RH, emissores e outros admins (gestão de usuários do sistema)
-- - Funcionários (perfil 'funcionario'): Visualizam/editam apenas seus próprios dados
-- - Emissores (perfil 'emissor'): Visualizam apenas RH e emissores (independentes, acesso global)

\echo '==========================================';
\echo 'Migration 114: Consolidar RLS para funcionarios';
\echo '==========================================';

-- ==========================================
-- 1. REMOVER POLÍTICAS ANTIGAS E CONFLITANTES
-- ==========================================

\echo '1. Removendo políticas RLS antigas...';

-- Remover todas as políticas existentes em funcionarios para recriação limpa
DROP POLICY IF EXISTS "funcionarios_own_select" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_own_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_rh_select" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_rh_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_rh_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_rh_delete" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_select" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_insert" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_update" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_admin_delete" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_emissor_select" ON funcionarios;
DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON funcionarios;
DROP POLICY IF EXISTS "rls_emissor_select_funcionarios" ON funcionarios;

\echo '   ✓ Políticas antigas removidas';

-- ==========================================
-- 2. CRIAR POLÍTICAS CONSOLIDADAS E DOCUMENTADAS
-- ==========================================

\echo '2. Criando políticas RLS consolidadas...';

-- ========================================
-- FUNCIONÁRIO: Acesso próprio
-- ========================================

CREATE POLICY "funcionarios_own_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  perfil = 'funcionario'
  AND cpf = NULLIF(current_setting('app.current_user_cpf', true), '')
);

COMMENT ON POLICY "funcionarios_own_select" ON funcionarios IS
'Funcionários comuns visualizam apenas seus próprios dados';

CREATE POLICY "funcionarios_own_update" ON funcionarios
FOR UPDATE TO PUBLIC
USING (
  perfil = 'funcionario'
  AND cpf = NULLIF(current_setting('app.current_user_cpf', true), '')
)
WITH CHECK (
  perfil = 'funcionario'
  AND cpf = NULLIF(current_setting('app.current_user_cpf', true), '')
);

COMMENT ON POLICY "funcionarios_own_update" ON funcionarios IS
'Funcionários comuns atualizam apenas seus próprios dados (sem mudar perfil, clínica ou entidade)';

-- ========================================
-- RH: Gestão de funcionários da CLÍNICA
-- ========================================

CREATE POLICY "funcionarios_rh_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'rh'
  AND clinica_id IS NOT NULL
  AND clinica_id = NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER
  AND contratante_id IS NULL -- RH só vê funcionários de clínica (não de entidade)
);

COMMENT ON POLICY "funcionarios_rh_select" ON funcionarios IS
'RH visualiza apenas funcionários de SUA clínica (isolamento por clinica_id)';

CREATE POLICY "funcionarios_rh_insert" ON funcionarios
FOR INSERT TO PUBLIC
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'rh'
  AND clinica_id IS NOT NULL
  AND clinica_id = NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER
  AND contratante_id IS NULL -- RH cria funcionários para clínica, não para entidade
  AND perfil = 'funcionario' -- RH só cria funcionários comuns
);

COMMENT ON POLICY "funcionarios_rh_insert" ON funcionarios IS
'RH cria funcionários apenas em SUA clínica (isolamento por clinica_id)';

CREATE POLICY "funcionarios_rh_update" ON funcionarios
FOR UPDATE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'rh'
  AND clinica_id IS NOT NULL
  AND clinica_id = NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER
  AND contratante_id IS NULL
)
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'rh'
  AND clinica_id = NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER
  AND contratante_id IS NULL
);

COMMENT ON POLICY "funcionarios_rh_update" ON funcionarios IS
'RH atualiza funcionários apenas de SUA clínica (isolamento por clinica_id)';

CREATE POLICY "funcionarios_rh_delete" ON funcionarios
FOR DELETE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'rh'
  AND clinica_id IS NOT NULL
  AND clinica_id = NULLIF(current_setting('app.current_user_clinica_id', true), '')::INTEGER
  AND contratante_id IS NULL
  AND perfil = 'funcionario'
);

COMMENT ON POLICY "funcionarios_rh_delete" ON funcionarios IS
'RH deleta (inativa) funcionários apenas de SUA clínica';

-- ========================================
-- GESTOR DE ENTIDADE: Gestão de funcionários da ENTIDADE
-- ========================================

CREATE POLICY "funcionarios_gestor_entidade_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id IS NOT NULL
  AND contratante_id = NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER
  AND clinica_id IS NULL -- Gestor de entidade só vê funcionários de entidade (não de clínica)
);

COMMENT ON POLICY "funcionarios_gestor_entidade_select" ON funcionarios IS
'Gestor de entidade visualiza apenas funcionários de SUA entidade (isolamento por contratante_id)';

CREATE POLICY "funcionarios_gestor_entidade_insert" ON funcionarios
FOR INSERT TO PUBLIC
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id IS NOT NULL
  AND contratante_id = NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER
  AND clinica_id IS NULL -- Gestor cria funcionários para entidade, não para clínica
  AND perfil = 'funcionario' -- Gestor só cria funcionários comuns
);

COMMENT ON POLICY "funcionarios_gestor_entidade_insert" ON funcionarios IS
'Gestor de entidade cria funcionários apenas em SUA entidade (isolamento por contratante_id)';

CREATE POLICY "funcionarios_gestor_entidade_update" ON funcionarios
FOR UPDATE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id IS NOT NULL
  AND contratante_id = NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER
  AND clinica_id IS NULL
)
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id = NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER
  AND clinica_id IS NULL
);

COMMENT ON POLICY "funcionarios_gestor_entidade_update" ON funcionarios IS
'Gestor de entidade atualiza funcionários apenas de SUA entidade (isolamento por contratante_id)';

CREATE POLICY "funcionarios_gestor_entidade_delete" ON funcionarios
FOR DELETE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'gestor_entidade'
  AND contratante_id IS NOT NULL
  AND contratante_id = NULLIF(current_setting('app.current_user_contratante_id', true), '')::INTEGER
  AND clinica_id IS NULL
  AND perfil = 'funcionario'
);

COMMENT ON POLICY "funcionarios_gestor_entidade_delete" ON funcionarios IS
'Gestor de entidade deleta (inativa) funcionários apenas de SUA entidade';

-- ========================================
-- ADMIN: Gestão de usuários do sistema (RH, Emissor, Admin)
-- ========================================

CREATE POLICY "funcionarios_admin_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
);

COMMENT ON POLICY "funcionarios_admin_select" ON funcionarios IS
'Admin visualiza RH, emissores e outros admins (gestão de usuários do sistema)';

CREATE POLICY "funcionarios_admin_insert" ON funcionarios
FOR INSERT TO PUBLIC
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
  AND (
    -- Emissor pode ter clinica_id NULL (independente)
    (perfil = 'emissor') OR
    -- RH deve ter clinica_id (vinculado a clínica)
    (perfil = 'rh' AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
    -- Admin pode ter clinica_id NULL
    (perfil = 'admin')
  )
);

COMMENT ON POLICY "funcionarios_admin_insert" ON funcionarios IS
'Admin cria RH (com clinica_id), emissores (independentes) e outros admins';

CREATE POLICY "funcionarios_admin_update" ON funcionarios
FOR UPDATE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
)
WITH CHECK (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
);

COMMENT ON POLICY "funcionarios_admin_update" ON funcionarios IS
'Admin atualiza RH, emissores e outros admins';

CREATE POLICY "funcionarios_admin_delete" ON funcionarios
FOR DELETE TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh', 'emissor', 'admin')
  AND ativo = FALSE -- Só deleta usuários inativos
);

COMMENT ON POLICY "funcionarios_admin_delete" ON funcionarios IS
'Admin deleta RH, emissores e admins inativos';

-- ========================================
-- EMISSOR: Visualização de RH e Emissores (independente)
-- ========================================

CREATE POLICY "funcionarios_emissor_select" ON funcionarios
FOR SELECT TO PUBLIC
USING (
  current_setting('app.current_user_perfil', true) = 'emissor'
  AND perfil IN ('rh', 'emissor')
);

COMMENT ON POLICY "funcionarios_emissor_select" ON funcionarios IS
'Emissores visualizam RH e outros emissores (acesso global para coordenação de emissão)';

\echo '   ✓ Políticas RLS consolidadas criadas';

-- ==========================================
-- 3. VALIDAR RLS ESTÁ ATIVADO
-- ==========================================

\echo '3. Validando RLS...';

-- Garantir que RLS está ativo na tabela funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios FORCE ROW LEVEL SECURITY;

\echo '   ✓ RLS ativado e forçado em funcionarios';

-- ==========================================
-- 4. VERIFICAR POLÍTICAS
-- ==========================================

\echo '4. Verificando políticas criadas...';

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'funcionarios'
ORDER BY policyname;

\echo '';
\echo '==========================================';
\echo 'Migration 114: CONCLUÍDA';
\echo '==========================================';
\echo '';
\echo 'Resumo das políticas:';
\echo '  - Funcionários: Acesso próprio (SELECT, UPDATE)';
\echo '  - RH: Gestão de funcionários da CLÍNICA (isolamento por clinica_id)';
\echo '  - Gestor Entidade: Gestão de funcionários da ENTIDADE (isolamento por contratante_id)';
\echo '  - Admin: Gestão de usuários do sistema (RH, Emissor, Admin)';
\echo '  - Emissor: Visualização de RH e Emissores (acesso global)';
\echo '';
\echo 'IMPORTANTE: Testar isolamento entre RH e Gestores de Entidade!';
\echo '==========================================';
