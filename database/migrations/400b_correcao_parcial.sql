-- ====================================================================
-- Migration 400b: Correção Parcial - Completar Migração 400
-- Data: 2026-02-05
-- Status: Correção para migração 400 que falhou parcialmente
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 400b: CORREÇÃO PARCIAL'
\echo 'Completando migração 400...'
\echo '========================================='

-- Verificar estado atual
DO $$
DECLARE
    v_enum_values TEXT[];
    v_has_gestor BOOLEAN := FALSE;
    v_has_gestor BOOLEAN := FALSE;
    v_has_usuarios_gestor_check BOOLEAN := FALSE;
    v_has_funcionarios_owner_check BOOLEAN := FALSE;
BEGIN
    -- Verificar enum
    SELECT array_agg(enumlabel::TEXT) INTO v_enum_values
    FROM pg_enum
    WHERE enumtypid = 'usuario_tipo_enum'::regtype;

    v_has_gestor := 'gestor' = ANY(v_enum_values);
    v_has_gestor := 'gestor' = ANY(v_enum_values);

    RAISE NOTICE 'Valores no enum usuario_tipo_enum: %', v_enum_values;
    RAISE NOTICE 'Tem gestor: %', v_has_gestor;
    RAISE NOTICE 'Tem gestor: %', v_has_gestor;

    -- Verificar constraints
    SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_gestor_check') INTO v_has_usuarios_gestor_check;
    SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_owner_check') INTO v_has_funcionarios_owner_check;

    RAISE NOTICE 'Tem usuarios_gestor_check: %', v_has_usuarios_gestor_check;
    RAISE NOTICE 'Tem funcionarios_owner_check: %', v_has_funcionarios_owner_check;
END $$;

-- Aplicar correções necessárias
DO $$
DECLARE
    v_has_usuarios_gestor_check BOOLEAN;
    v_has_funcionarios_owner_check BOOLEAN;
BEGIN
    -- Verificar se constraints existem
    SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_gestor_check') INTO v_has_usuarios_gestor_check;
    SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_owner_check') INTO v_has_funcionarios_owner_check;

    -- Criar usuarios_gestor_check se não existir
    IF NOT v_has_usuarios_gestor_check THEN
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_gestor;
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_gestor_check;

        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_gestor_check CHECK (
            (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL) OR
            (tipo_usuario != 'gestor')
        );

        RAISE NOTICE '✓ Constraint usuarios_gestor_check criada';
    ELSE
        RAISE NOTICE '✓ Constraint usuarios_gestor_check já existe';
    END IF;

    -- Atualizar funcionarios_owner_check se necessário
    IF v_has_funcionarios_owner_check THEN
        -- Verificar se a constraint está correta
        ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;

        ALTER TABLE funcionarios
        ADD CONSTRAINT funcionarios_owner_check CHECK (
            -- Funcionário de entidade: apenas contratante_id
            (perfil = 'funcionario_entidade' AND contratante_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
            -- Funcionário de empresa: empresa_id + clinica_id
            (perfil = 'funcionario_clinica' AND empresa_id IS NOT NULL AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
            -- Perfis especiais (admin, emissor, rh)
            (perfil NOT IN ('funcionario_entidade', 'funcionario_clinica'))
        );

        RAISE NOTICE '✓ Constraint funcionarios_owner_check atualizada';
    END IF;
END $$;

-- Garantir que empresas_clientes.clinica_id seja NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'empresas_clientes'
        AND column_name = 'clinica_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Verificar se há empresas sem clinica_id
        IF EXISTS (SELECT 1 FROM empresas_clientes WHERE clinica_id IS NULL) THEN
            RAISE EXCEPTION 'Não é possível tornar clinica_id NOT NULL: existem empresas sem clinica_id';
        END IF;

        ALTER TABLE empresas_clientes ALTER COLUMN clinica_id SET NOT NULL;
        RAISE NOTICE '✓ empresas_clientes.clinica_id definido como NOT NULL';
    ELSE
        RAISE NOTICE '✓ empresas_clientes.clinica_id já é NOT NULL';
    END IF;
END $$;

-- Recriar view gestores se necessário
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

-- Validações finais
DO $$
DECLARE
    v_count_gestores INTEGER;
    v_count_rh INTEGER;
    v_count_gestor INTEGER;
    v_count_empresas_orphan INTEGER;
BEGIN
    -- Contar gestores
    SELECT COUNT(*) INTO v_count_gestores FROM gestores;
    SELECT COUNT(*) INTO v_count_rh FROM gestores WHERE usuario_tipo = 'rh';
    SELECT COUNT(*) INTO v_count_gestor FROM gestores WHERE usuario_tipo = 'gestor';

    RAISE NOTICE '';
    RAISE NOTICE '📊 RESULTADO FINAL APÓS CORREÇÃO:';
    RAISE NOTICE '  Total de gestores: %', v_count_gestores;
    RAISE NOTICE '  - RH (clínica): %', v_count_rh;
    RAISE NOTICE '  - Gestor (entidade): %', v_count_gestor;

    -- Verificar empresas órfãs
    SELECT COUNT(*) INTO v_count_empresas_orphan
    FROM empresas_clientes
    WHERE clinica_id IS NULL;

    IF v_count_empresas_orphan > 0 THEN
        RAISE WARNING 'ATENÇÃO: % empresas ainda sem clinica_id!', v_count_empresas_orphan;
    ELSE
        RAISE NOTICE '  ✓ Todas as empresas têm clinica_id';
    END IF;

    RAISE NOTICE '';
END $$;

COMMIT;

\echo ''
\echo '========================================='
\echo 'MIGRATION 400b CONCLUÍDA!'
\echo 'Migração 400 agora está completa.'
\echo '========================================='
