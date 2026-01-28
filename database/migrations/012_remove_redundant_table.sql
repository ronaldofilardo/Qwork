-- MIGRATION 012: Remover tabela redundante lotes_avaliacao_funcionarios
-- Data: 2025-12-20
-- Descricao: A tabela lotes_avaliacao_funcionarios e redundante pois a relacao
--            entre lotes_avaliacao e funcionarios ja existe via lotes_avaliacao.
--            Esta migration remove a tabela e seus dados.

BEGIN;

-- 1. Verificar se a tabela existe e tem dados
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'lotes_avaliacao_funcionarios'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        SELECT COUNT(*) INTO v_count FROM lotes_avaliacao_funcionarios;
        RAISE NOTICE 'Tabela lotes_avaliacao_funcionarios existe com % registros', v_count;
    ELSE
        RAISE NOTICE 'Tabela lotes_avaliacao_funcionarios nao existe - migration ja aplicada';
        RETURN;
    END IF;
END $$;

-- 2. Criar backup dos dados antes de remover
CREATE TABLE IF NOT EXISTS lotes_avaliacao_funcionarios_backup AS
SELECT * FROM lotes_avaliacao_funcionarios;

-- 3. Adicionar comentario ao backup
COMMENT ON TABLE lotes_avaliacao_funcionarios_backup IS 'Backup da tabela lotes_avaliacao_funcionarios removida em migration 012 - ' || now();

-- 4. Verificar se ha dependencias (constraints, views, etc)
DO $$
DECLARE
    v_constraint_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Verificar constraints que referenciam a tabela
    SELECT COUNT(*) INTO v_constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'lotes_avaliacao_funcionarios'
       OR kcu.table_name = 'lotes_avaliacao_funcionarios';

    -- Verificar views que referenciam a tabela
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.view_table_usage
    WHERE table_name = 'lotes_avaliacao_funcionarios';

    IF v_constraint_count > 0 THEN
        RAISE EXCEPTION 'Existem % constraints referenciando lotes_avaliacao_funcionarios', v_constraint_count;
    END IF;

    IF v_view_count > 0 THEN
        RAISE EXCEPTION 'Existem % views referenciando lotes_avaliacao_funcionarios', v_view_count;
    END IF;

    RAISE NOTICE 'Nenhuma dependencia encontrada - seguro remover tabela';
END $$;

-- 5. Remover a tabela com CASCADE para remover dependencias
DROP TABLE IF EXISTS lotes_avaliacao_funcionarios CASCADE;

-- 6. Verificacao final
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'lotes_avaliacao_funcionarios'
    ) THEN
        RAISE EXCEPTION 'Falha ao remover tabela lotes_avaliacao_funcionarios';
    ELSE
        RAISE NOTICE 'Tabela lotes_avaliacao_funcionarios removida com sucesso';
    END IF;
END $$;

COMMIT;

-- 7. Verificacao final do backup
SELECT
    'lotes_avaliacao_funcionarios_backup' as tabela_backup,
    COUNT(*) as registros_backup
FROM lotes_avaliacao_funcionarios_backup;
