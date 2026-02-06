-- ====================================================================
-- Migration 400: Correção Estrutural - Entidades vs Clínicas
-- Data: 2026-02-05
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO:
--   Corrigir a estrutura do sistema para refletir a organização correta:
--   
--   ENTIDADE [gestor]:
--     → Gera DIRETAMENTE funcionários, avaliações e lotes
--     → NÃO passa por clínica ou empresa intermediária
--   
--   CLÍNICA [rh]:
--     → Gerencia EMPRESAS (clientes)
--     → Cada EMPRESA tem funcionários, avaliações e lotes
--     → Tabela empresas vinculada a clinica (NÃO a entidade)
--
--   MUDANÇAS:
--     1. Remover COMPLETAMENTE 'gestor' → usar apenas 'gestor'
--     2. Garantir empresas_clientes.clinica_id (sempre vinculado a clínica)
--     3. Funcionários de entidade: entidade_id (sem clinica_id/empresa_id)
--     4. Funcionários de empresa: empresa_id + clinica_id
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 400: CORREÇÃO ESTRUTURAL'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- FASE 1: BACKUP E VALIDAÇÕES
-- ====================================================================

\echo ''
\echo 'FASE 1: Criando backups...'

-- Backup tabelas principais
CREATE TABLE IF NOT EXISTS _backup_usuarios_m400 AS SELECT * FROM usuarios;
CREATE TABLE IF NOT EXISTS _backup_funcionarios_m400 AS SELECT * FROM funcionarios;
CREATE TABLE IF NOT EXISTS _backup_empresas_m400 AS SELECT * FROM empresas_clientes;

\echo '✓ Backups criados'

-- Validações
DO $$
DECLARE
    v_count_gestor INTEGER;
    v_count_empresas_sem_clinica INTEGER;
    v_count_func_entidade INTEGER;
BEGIN
    -- Contar usuários com gestor
    SELECT COUNT(*) INTO v_count_gestor
    FROM usuarios
    WHERE tipo_usuario = 'gestor';
    
    RAISE NOTICE 'Usuários com gestor: %', v_count_gestor;
    
    -- Contar empresas sem clinica_id
    SELECT COUNT(*) INTO v_count_empresas_sem_clinica
    FROM empresas_clientes
    WHERE clinica_id IS NULL;
    
    RAISE NOTICE 'Empresas sem clinica_id: %', v_count_empresas_sem_clinica;
    
    IF v_count_empresas_sem_clinica > 0 THEN
        RAISE WARNING 'ATENÇÃO: % empresas sem clinica_id serão corrigidas', v_count_empresas_sem_clinica;
    END IF;
    
    -- Contar funcionários de entidade
    SELECT COUNT(*) INTO v_count_func_entidade
    FROM funcionarios
    WHERE usuario_tipo = 'funcionario_entidade';
    
    RAISE NOTICE 'Funcionários de entidade: %', v_count_func_entidade;
END $$;

-- ====================================================================
-- FASE 2: ATUALIZAR TIPO DE USUÁRIO (gestor → gestor)
-- ====================================================================

\echo ''
\echo 'FASE 2: Atualizando tipo_usuario gestor → gestor...'

-- Atualizar enum se necessário
DO $$
BEGIN
    -- Verificar se 'gestor' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'gestor' 
        AND enumtypid = 'usuario_tipo_enum'::regtype
    ) THEN
        ALTER TYPE usuario_tipo_enum ADD VALUE 'gestor';
        RAISE NOTICE '✓ Valor "gestor" adicionado ao enum';
    ELSE
        RAISE NOTICE '✓ Valor "gestor" já existe no enum';
    END IF;
END $$;

-- Atualizar registros usuarios: gestor → gestor
UPDATE usuarios
SET tipo_usuario = 'gestor'
WHERE tipo_usuario = 'gestor';

\echo '✓ Usuários atualizados'

-- Remover gestor do enum (se possível)
-- NOTA: Isso só funciona se não houver mais referências
DO $$
BEGIN
    -- Verificar se ainda existe alguma referência
    IF NOT EXISTS (
        SELECT 1 FROM usuarios WHERE tipo_usuario = 'gestor'
        UNION ALL
        SELECT 1 FROM funcionarios WHERE usuario_tipo = 'gestor'
    ) THEN
        -- Criar novo enum sem gestor
        CREATE TYPE usuario_tipo_enum_new AS ENUM (
            'admin',
            'emissor',
            'rh',
            'gestor',
            'funcionario_clinica',
            'funcionario_entidade'
        );
        
        -- Atualizar colunas
        ALTER TABLE usuarios ALTER COLUMN tipo_usuario TYPE usuario_tipo_enum_new USING tipo_usuario::text::usuario_tipo_enum_new;
        ALTER TABLE funcionarios ALTER COLUMN usuario_tipo TYPE usuario_tipo_enum_new USING usuario_tipo::text::usuario_tipo_enum_new;
        
        -- Remover enum antigo
        DROP TYPE usuario_tipo_enum;
        
        -- Renomear novo enum
        ALTER TYPE usuario_tipo_enum_new RENAME TO usuario_tipo_enum;
        
        RAISE NOTICE '✓ Enum atualizado - gestor removido';
    ELSE
        RAISE WARNING 'Ainda existem referências a gestor - enum não modificado';
    END IF;
END $$;

-- ====================================================================
-- FASE 3: CORRIGIR ESTRUTURA DE FUNCIONÁRIOS
-- ====================================================================

\echo ''
\echo 'FASE 3: Corrigindo estrutura de funcionários...'

-- Garantir que funcionários de entidade tenham entidade_id
-- e NÃO tenham clinica_id/empresa_id
UPDATE funcionarios
SET 
    entidade_id = (
        SELECT entidade_id 
        FROM usuarios 
        WHERE usuarios.cpf = funcionarios.cpf 
        AND usuarios.tipo_usuario = 'gestor'
        LIMIT 1
    ),
    clinica_id = NULL,
    empresa_id = NULL
WHERE usuario_tipo = 'funcionario_entidade'
AND entidade_id IS NULL;

\echo '✓ Funcionários de entidade corrigidos'

-- Garantir que funcionários de empresa tenham empresa_id E clinica_id
UPDATE funcionarios f
SET clinica_id = (
    SELECT ec.clinica_id 
    FROM empresas_clientes ec 
    WHERE ec.id = f.empresa_id
)
WHERE usuario_tipo = 'funcionario_clinica'
AND empresa_id IS NOT NULL
AND clinica_id IS NULL;

\echo '✓ Funcionários de empresa corrigidos'

-- ====================================================================
-- FASE 4: CORRIGIR ESTRUTURA DE EMPRESAS
-- ====================================================================

\echo ''
\echo 'FASE 4: Corrigindo estrutura de empresas...'

-- EMPRESAS devem SEMPRE estar vinculadas a CLÍNICA
-- Se alguma empresa não tiver clinica_id, tentar corrigir

-- Caso 1: Empresas com funcionários - pegar clinica_id dos funcionários
UPDATE empresas_clientes ec
SET clinica_id = (
    SELECT DISTINCT f.clinica_id
    FROM funcionarios f
    WHERE f.empresa_id = ec.id
    AND f.clinica_id IS NOT NULL
    LIMIT 1
)
WHERE clinica_id IS NULL
AND EXISTS (
    SELECT 1 FROM funcionarios f
    WHERE f.empresa_id = ec.id
    AND f.clinica_id IS NOT NULL
);

-- Caso 2: Empresas sem funcionários - criar clínica padrão se necessário
DO $$
DECLARE
    v_clinica_default INTEGER;
    v_count_orphan INTEGER;
BEGIN
    -- Verificar empresas órfãs
    SELECT COUNT(*) INTO v_count_orphan
    FROM empresas_clientes
    WHERE clinica_id IS NULL;
    
    IF v_count_orphan > 0 THEN
        RAISE WARNING 'ATENÇÃO: % empresas sem clinica_id!', v_count_orphan;
        
        -- Criar clínica padrão se não existir
        SELECT id INTO v_clinica_default
        FROM clinicas
        WHERE razao_social ILIKE '%migração%'
        OR razao_social ILIKE '%default%'
        LIMIT 1;
        
        IF v_clinica_default IS NULL THEN
            INSERT INTO clinicas (
                cnpj, 
                razao_social, 
                tipo,
                ativa
            ) VALUES (
                '00000000000000',
                'Clínica de Migração (Temporário)',
                'clinica',
                false
            ) RETURNING id INTO v_clinica_default;
            
            RAISE NOTICE '✓ Clínica padrão criada: ID %', v_clinica_default;
        END IF;
        
        -- Atribuir empresas órfãs à clínica padrão
        UPDATE empresas_clientes
        SET clinica_id = v_clinica_default
        WHERE clinica_id IS NULL;
        
        RAISE NOTICE '✓ % empresas vinculadas à clínica padrão', v_count_orphan;
    ELSE
        RAISE NOTICE '✓ Todas as empresas têm clinica_id';
    END IF;
END $$;

-- ====================================================================
-- FASE 5: ATUALIZAR CONSTRAINTS
-- ====================================================================

\echo ''
\echo 'FASE 5: Atualizando constraints...'

-- Garantir que empresas SEMPRE tenham clinica_id
ALTER TABLE empresas_clientes
    ALTER COLUMN clinica_id SET NOT NULL;

\echo '✓ empresas_clientes.clinica_id agora é NOT NULL'

-- Atualizar constraint de usuarios para usar 'gestor' ao invés de 'gestor'
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_gestor;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_gestor_check;

ALTER TABLE usuarios
ADD CONSTRAINT usuarios_gestor_check CHECK (
    (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL) OR
    (tipo_usuario != 'gestor')
);

\echo '✓ Constraint usuarios_gestor_check criada'

-- Atualizar constraint de funcionários
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_owner_check CHECK (
    -- Funcionário de entidade: apenas entidade_id
    (usuario_tipo = 'funcionario_entidade' AND entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
    -- Funcionário de empresa: empresa_id + clinica_id
    (usuario_tipo = 'funcionario_clinica' AND empresa_id IS NOT NULL AND clinica_id IS NOT NULL AND entidade_id IS NULL) OR
    -- Perfis especiais (admin, emissor, rh)
    (usuario_tipo NOT IN ('funcionario_entidade', 'funcionario_clinica'))
);

\echo '✓ Constraint funcionarios_owner_check criada'

-- ====================================================================
-- FASE 6: ATUALIZAR VIEWS E FUNÇÕES
-- ====================================================================

\echo ''
\echo 'FASE 6: Atualizando views e funções...'

-- Recriar view gestores
DROP VIEW IF EXISTS gestores CASCADE;

CREATE OR REPLACE VIEW gestores AS
SELECT
    cpf,
    nome,
    email,
    tipo_usuario as usuario_tipo,
    CASE
        WHEN tipo_usuario = 'rh' THEN 'RH (Clínica)'
        WHEN tipo_usuario = 'gestor' THEN 'Gestor de Entidade'
        ELSE 'Outro'
    END as tipo_gestor_descricao,
    clinica_id,
    entidade_id,
    ativo,
    criado_em,
    atualizado_em
FROM usuarios
WHERE tipo_usuario IN ('rh', 'gestor');

COMMENT ON VIEW gestores IS 'View de gestores do sistema (RH e Gestor de Entidade)';

\echo '✓ View gestores recriada'

-- ====================================================================
-- FASE 7: VALIDAÇÕES FINAIS
-- ====================================================================

\echo ''
\echo 'FASE 7: Validações finais...'

DO $$
DECLARE
    v_count_gestores INTEGER;
    v_count_rh INTEGER;
    v_count_gestor INTEGER;
    v_count_empresas_orphan INTEGER;
    v_count_func_entidade INTEGER;
BEGIN
    -- Contar gestores
    SELECT COUNT(*) INTO v_count_gestores FROM gestores;
    SELECT COUNT(*) INTO v_count_rh FROM gestores WHERE usuario_tipo = 'rh';
    SELECT COUNT(*) INTO v_count_gestor FROM gestores WHERE usuario_tipo = 'gestor';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESULTADO FINAL:';
    RAISE NOTICE '  Total de gestores: %', v_count_gestores;
    RAISE NOTICE '  - RH (clínica): %', v_count_rh;
    RAISE NOTICE '  - Gestor (entidade): %', v_count_gestor;
    
    -- Verificar empresas órfãs
    SELECT COUNT(*) INTO v_count_empresas_orphan
    FROM empresas_clientes
    WHERE clinica_id IS NULL;
    
    IF v_count_empresas_orphan > 0 THEN
        RAISE EXCEPTION 'ERRO: % empresas ainda sem clinica_id!', v_count_empresas_orphan;
    ELSE
        RAISE NOTICE '  ✓ Todas as empresas têm clinica_id';
    END IF;
    
    -- Verificar funcionários de entidade
    SELECT COUNT(*) INTO v_count_func_entidade
    FROM funcionarios
    WHERE usuario_tipo = 'funcionario_entidade';
    
    RAISE NOTICE '  Funcionários de entidade: %', v_count_func_entidade;
    RAISE NOTICE '';
END $$;

COMMIT;

\echo ''
\echo '========================================='
\echo 'MIGRATION 400 CONCLUÍDA COM SUCESSO!'
\echo 'Concluída em:' :current_timestamp
\echo '========================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Atualizar código TypeScript (tipos, enums, constantes)'
\echo '2. Atualizar helpers e funções de validação'
\echo '3. Atualizar documentação'
\echo '4. Executar testes'
\echo ''
