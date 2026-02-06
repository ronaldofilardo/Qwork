-- Migration 306: Corrigir enum usuario_tipo_enum - remover duplicatas
-- Data: 05/02/2026
-- Problema: O enum tem valores incorretos/duplicados
-- Correções:
-- - 'rh' → remover (duplicado de 'rh')
-- - 'gestor' → 'gestor' (padronizar nome)

-- PASSO 1: Dropar views dependentes temporariamente
DROP VIEW IF EXISTS gestores CASCADE;
DROP VIEW IF EXISTS funcionarios_operacionais CASCADE;
DROP VIEW IF EXISTS equipe_administrativa CASCADE;
DROP VIEW IF EXISTS usuarios_resumo CASCADE;

-- PASSO 2: Verificar registros antes da alteração
DO $$
DECLARE
    count_rh INTEGER;
    count_gestor INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_rh
    FROM usuarios
    WHERE tipo_usuario = 'rh';

    SELECT COUNT(*) INTO count_gestor
    FROM usuarios
    WHERE tipo_usuario = 'gestor';

    RAISE NOTICE 'Registros com rh: %', count_rh;
    RAISE NOTICE 'Registros com gestor: %', count_gestor;
END $$;

-- PASSO 3: Criar novo enum com valores corretos
CREATE TYPE usuario_tipo_enum_new AS ENUM (
    'funcionario_clinica',
    'funcionario_entidade',
    'gestor',  -- Novo: padronizado
    'rh',     -- Mantém apenas 'rh'
    'admin',
    'emissor'
);

-- PASSO 4: Atualizar tabelas para usar o novo enum
-- Usuarios
ALTER TABLE usuarios ALTER COLUMN tipo_usuario TYPE usuario_tipo_enum_new USING
    CASE tipo_usuario::text
        WHEN 'gestor' THEN 'gestor'::usuario_tipo_enum_new
        WHEN 'rh' THEN 'rh'::usuario_tipo_enum_new
        ELSE tipo_usuario::text::usuario_tipo_enum_new
    END;

-- Funcionarios (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'usuario_tipo') THEN
        EXECUTE 'ALTER TABLE funcionarios ALTER COLUMN usuario_tipo TYPE usuario_tipo_enum_new USING usuario_tipo::text::usuario_tipo_enum_new';
    END IF;
END $$;

-- Outras tabelas que podem usar o enum
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios_backup_gestores_final_400' AND column_name = 'usuario_tipo') THEN
        EXECUTE 'ALTER TABLE funcionarios_backup_gestores_final_400 ALTER COLUMN usuario_tipo TYPE usuario_tipo_enum_new USING usuario_tipo::text::usuario_tipo_enum_new';
    END IF;
END $$;

-- PASSO 5: Substituir o enum antigo pelo novo
DROP TYPE usuario_tipo_enum CASCADE;
ALTER TYPE usuario_tipo_enum_new RENAME TO usuario_tipo_enum;

-- PASSO 6: Recriar views (serão recriadas em migrations futuras se necessário)
-- Por ora, mantemos sem as views para evitar conflitos