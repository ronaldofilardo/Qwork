-- ====================================================================
-- Migration 400c: Estrutura Organizacional FINAL - Entidades vs Clínicas
-- Data: 2026-02-05
-- Status: SANITIZADA E OTIMIZADA
-- ====================================================================
-- 
-- OBJETIVO:
--   Estabelecer a estrutura organizacional correta e DEFINITIVA:
--   
--   📊 ENTIDADE [gestor]:
--     → Gera DIRETAMENTE: funcionários, avaliações, lotes
--     → Vínculo: contratante_id
--     → NÃO tem: clinica_id, empresa_id
--   
--   🏥 CLÍNICA [rh]:
--     → Gera: EMPRESAS (clientes)
--     → Empresa gera: funcionários, avaliações, lotes
--     → Vínculo empresa: clinica_id (NOT NULL)
--     → Vínculo funcionários: empresa_id + clinica_id
--
--   🔑 MUDANÇAS CRÍTICAS:
--     1. Remover 'gestor' → usar 'gestor'
--     2. empresas_clientes.clinica_id = NOT NULL
--     3. Constraints atualizadas (usuarios_gestor_check, funcionarios_owner_check)
--     4. View gestores atualizada
-- ====================================================================

BEGIN;

\echo ''
\echo '========================================='
\echo 'MIGRATION 400c: ESTRUTURA FINAL'
\echo '========================================='
\echo ''

-- ====================================================================
-- SEÇÃO 1: BACKUPS E VALIDAÇÕES INICIAIS
-- ====================================================================

\echo '[1/7] Criando backups de segurança...'

-- Backups com timestamp
DO $$
DECLARE
    v_suffix TEXT := to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS _backup_usuarios_%s AS SELECT * FROM usuarios', v_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS _backup_funcionarios_%s AS SELECT * FROM funcionarios', v_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS _backup_empresas_%s AS SELECT * FROM empresas_clientes', v_suffix);
    RAISE NOTICE '   ✓ Backups criados com sufixo: %', v_suffix;
END $$;

-- Validações de estado atual
DO $$
DECLARE
    v_usuarios_gestor INTEGER;
    v_empresas_sem_clinica INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_usuarios_gestor
    FROM usuarios WHERE tipo_usuario = 'gestor';
    
    SELECT COUNT(*) INTO v_empresas_sem_clinica
    FROM empresas_clientes WHERE clinica_id IS NULL;
    
    RAISE NOTICE '   Estado atual:';
    RAISE NOTICE '   - Usuários com gestor: %', v_usuarios_gestor;
    RAISE NOTICE '   - Empresas sem clinica_id: %', v_empresas_sem_clinica;
    
    IF v_empresas_sem_clinica > 0 THEN
        RAISE WARNING '   ⚠️  Empresas órfãs serão corrigidas!';
    END IF;
END $$;

\echo ''

-- ====================================================================
-- SEÇÃO 2: ATUALIZAR ENUM usuario_tipo_enum
-- ====================================================================

\echo '[2/7] Atualizando enum usuario_tipo_enum...'

-- Adicionar 'gestor' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'gestor' 
        AND enumtypid = 'usuario_tipo_enum'::regtype
    ) THEN
        ALTER TYPE usuario_tipo_enum ADD VALUE 'gestor';
        RAISE NOTICE '   ✓ Valor "gestor" adicionado ao enum';
    ELSE
        RAISE NOTICE '   ✓ Valor "gestor" já existe';
    END IF;
END $$;

-- Migrar dados: gestor → gestor
UPDATE usuarios
SET tipo_usuario = 'gestor'
WHERE tipo_usuario = 'gestor';

RAISE NOTICE '   ✓ Usuários migrados para "gestor"';

-- Remover 'gestor' do enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'gestor' 
        AND enumtypid = 'usuario_tipo_enum'::regtype
    ) AND NOT EXISTS (
        SELECT 1 FROM usuarios WHERE tipo_usuario = 'gestor'
        UNION ALL
        SELECT 1 FROM funcionarios WHERE perfil = 'gestor'
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
        
        -- Migrar colunas
        ALTER TABLE usuarios 
        ALTER COLUMN tipo_usuario TYPE usuario_tipo_enum_new 
        USING tipo_usuario::text::usuario_tipo_enum_new;
        
        -- Remover enum antigo e renomear
        DROP TYPE usuario_tipo_enum CASCADE;
        ALTER TYPE usuario_tipo_enum_new RENAME TO usuario_tipo_enum;
        
        RAISE NOTICE '   ✓ Enum limpo - "gestor" removido';
    ELSE
        RAISE NOTICE '   ℹ️  Enum mantido (ainda há referências ou já foi limpo)';
    END IF;
END $$;

\echo ''

-- ====================================================================
-- SEÇÃO 3: CORRIGIR ESTRUTURA DE EMPRESAS
-- ====================================================================

\echo '[3/7] Corrigindo vínculo empresas → clínicas...'

-- Empresas órfãs: criar clínica padrão se necessário
DO $$
DECLARE
    v_clinica_default INTEGER;
    v_orphan_count INTEGER;
    v_contratante_default INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM empresas_clientes WHERE clinica_id IS NULL;
    
    IF v_orphan_count > 0 THEN
        RAISE WARNING '   ⚠️  % empresas sem clinica_id detectadas', v_orphan_count;
        
        -- Buscar ou criar contratante padrão tipo 'clinica'
        SELECT id INTO v_contratante_default
        FROM contratantes
        WHERE tipo = 'clinica'
        AND nome ILIKE '%migração%'
        LIMIT 1;
        
        IF v_contratante_default IS NULL THEN
            INSERT INTO contratantes (
                tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
                responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
                ativa, pagamento_confirmado
            ) VALUES (
                'clinica', 
                'Clínica de Migração 400c', 
                '00000000000191',
                'migracao400c@sistema.local',
                '0000000000',
                'Sistema',
                'São Paulo',
                'SP',
                '00000000',
                'Sistema',
                '00000000191',
                'sistema@local',
                '00000000000',
                false,
                true
            ) RETURNING id INTO v_contratante_default;
            
            RAISE NOTICE '   ✓ Contratante padrão criado: ID %', v_contratante_default;
        END IF;
        
        -- Buscar ou criar clínica padrão
        SELECT id INTO v_clinica_default
        FROM clinicas
        WHERE contratante_id = v_contratante_default
        LIMIT 1;
        
        IF v_clinica_default IS NULL THEN
            INSERT INTO clinicas (
                contratante_id,
                nome,
                ativa,
                criado_em
            ) VALUES (
                v_contratante_default,
                'Clínica de Migração 400c',
                false,
                NOW()
            ) RETURNING id INTO v_clinica_default;
            
            RAISE NOTICE '   ✓ Clínica padrão criada: ID %', v_clinica_default;
        END IF;
        
        -- Atribuir empresas órfãs
        UPDATE empresas_clientes
        SET clinica_id = v_clinica_default
        WHERE clinica_id IS NULL;
        
        RAISE NOTICE '   ✓ % empresas vinculadas à clínica padrão', v_orphan_count;
    ELSE
        RAISE NOTICE '   ✓ Todas as empresas já têm clinica_id';
    END IF;
END $$;

-- Garantir clinica_id NOT NULL
ALTER TABLE empresas_clientes
ALTER COLUMN clinica_id SET NOT NULL;

RAISE NOTICE '   ✓ empresas_clientes.clinica_id agora é NOT NULL';

\echo ''

-- ====================================================================
-- SEÇÃO 4: CORRIGIR ESTRUTURA DE FUNCIONÁRIOS
-- ====================================================================

\echo '[4/7] Corrigindo vínculo funcionários...'

-- Funcionários de empresa: garantir empresa_id + clinica_id
UPDATE funcionarios f
SET clinica_id = (
    SELECT ec.clinica_id 
    FROM empresas_clientes ec 
    WHERE ec.id = f.empresa_id
)
WHERE perfil = 'funcionario'
AND empresa_id IS NOT NULL
AND clinica_id IS NULL;

RAISE NOTICE '   ✓ Funcionários de empresa corrigidos';

\echo ''

-- ====================================================================
-- SEÇÃO 5: ATUALIZAR CONSTRAINTS
-- ====================================================================

\echo '[5/7] Criando/atualizando constraints...'

-- Constraint para gestores (tabela usuarios)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_gestor;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_gestor_check;

ALTER TABLE usuarios
ADD CONSTRAINT usuarios_gestor_check CHECK (
    (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL) OR
    (tipo_usuario != 'gestor')
);

COMMENT ON CONSTRAINT usuarios_gestor_check ON usuarios IS 
'Gestor deve ter entidade_id preenchido e clinica_id NULL';

RAISE NOTICE '   ✓ Constraint usuarios_gestor_check criada';

-- Constraint para funcionários
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_owner_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_owner_check CHECK (
    -- Funcionário de entidade: apenas contratante_id
    (perfil = 'funcionario' AND contratante_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
    -- Funcionário de empresa: empresa_id + clinica_id
    (perfil = 'funcionario' AND empresa_id IS NOT NULL AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
    -- Perfis especiais (admin, emissor, rh, gestor)
    (perfil IN ('admin', 'emissor', 'rh', 'gestor'))
);

COMMENT ON CONSTRAINT funcionarios_owner_check ON funcionarios IS 
'Funcionário de entidade OU de empresa (mutuamente exclusivo). Perfis especiais sem restrição.';

RAISE NOTICE '   ✓ Constraint funcionarios_owner_check criada';

\echo ''

-- ====================================================================
-- SEÇÃO 6: ATUALIZAR VIEWS
-- ====================================================================

\echo '[6/7] Recriando views...'

-- View gestores
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

COMMENT ON VIEW gestores IS 
'Gestores do sistema: RH (clínica) e Gestor (entidade)';

RAISE NOTICE '   ✓ View gestores recriada';

\echo ''

-- ====================================================================
-- SEÇÃO 7: VALIDAÇÕES FINAIS
-- ====================================================================

\echo '[7/7] Executando validações finais...'

DO $$
DECLARE
    v_gestores_total INTEGER;
    v_gestores_rh INTEGER;
    v_gestores_entidade INTEGER;
    v_empresas_orphan INTEGER;
    v_func_invalidos INTEGER;
    v_enum_values TEXT[];
BEGIN
    -- Contar gestores
    SELECT COUNT(*) INTO v_gestores_total FROM gestores;
    SELECT COUNT(*) INTO v_gestores_rh FROM gestores WHERE usuario_tipo = 'rh';
    SELECT COUNT(*) INTO v_gestores_entidade FROM gestores WHERE usuario_tipo = 'gestor';
    
    -- Verificar empresas órfãs (deve ser 0)
    SELECT COUNT(*) INTO v_empresas_orphan
    FROM empresas_clientes WHERE clinica_id IS NULL;
    
    -- Verificar funcionários inválidos (contratante_id E clinica_id simultaneamente)
    SELECT COUNT(*) INTO v_func_invalidos
    FROM funcionarios
    WHERE contratante_id IS NOT NULL AND clinica_id IS NOT NULL;
    
    -- Verificar enum
    SELECT array_agg(enumlabel::TEXT ORDER BY enumlabel) INTO v_enum_values
    FROM pg_enum WHERE enumtypid = 'usuario_tipo_enum'::regtype;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESULTADO FINAL DA MIGRAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Gestores:';
    RAISE NOTICE '   Total: %', v_gestores_total;
    RAISE NOTICE '   - RH (clínica): %', v_gestores_rh;
    RAISE NOTICE '   - Gestor (entidade): %', v_gestores_entidade;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Integridade:';
    RAISE NOTICE '   - Empresas sem clinica_id: %', v_empresas_orphan;
    RAISE NOTICE '   - Funcionários inválidos: %', v_func_invalidos;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Enum usuario_tipo_enum:';
    RAISE NOTICE '   Valores: %', v_enum_values;
    RAISE NOTICE '';
    
    IF v_empresas_orphan > 0 THEN
        RAISE EXCEPTION 'ERRO: % empresas ainda sem clinica_id!', v_empresas_orphan;
    END IF;
    
    IF v_func_invalidos > 0 THEN
        RAISE EXCEPTION 'ERRO: % funcionários com contratante_id E clinica_id!', v_func_invalidos;
    END IF;
    
    IF 'gestor' = ANY(v_enum_values) THEN
        RAISE WARNING '⚠️  Enum ainda contém "gestor"';
    END IF;
    
    IF NOT ('gestor' = ANY(v_enum_values)) THEN
        RAISE EXCEPTION 'ERRO: Enum não contém "gestor"!';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION 400c CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

COMMIT;

\echo ''
\echo '🎯 PRÓXIMOS PASSOS:'
\echo '   1. Executar testes: npm test __tests__/integration/'
\echo '   2. Verificar aplicação: npm run dev'
\echo '   3. Validar funcionalidades de entidade e clínica'
\echo ''
