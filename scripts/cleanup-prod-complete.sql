-- Script de Limpeza Completa do PROD
-- Data: 2026-02-09
-- Proposito: Limpar completamente o banco PROD para sincronizacao total com DEV
-- AVISO: Este script APAGA TUDO. Executar apenas com backup validado!

-- Passo 1: Dropar todas as views (cascade)
DO $$
DECLARE
    v text;
BEGIN
    FOR v IN (
        SELECT table_name FROM information_schema.views 
        WHERE table_schema = 'public'
    )
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(v) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', v;
    END LOOP;
END
$$;

-- Passo 2: Dropar todas as tabelas (cascade)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
    )
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(t) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', t;
    END LOOP;
END
$$;

-- Passo 3: Dropar todas as sequences
DO $$
DECLARE
    s text;
BEGIN
    FOR s IN (
        SELECT sequence_name FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    )
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(s) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', s;
    END LOOP;
END
$$;

-- Passo 4: Dropar todas as functions (procedures)
DO $$
DECLARE
    f text;
BEGIN
    FOR f IN (
        SELECT proname || '(' || pg_get_function_identity_arguments(oid) || ')' as fname
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
    )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || f || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', f;
    END LOOP;
END
$$;

-- Passo 5: Dropar tipos customizados (enums, etc)
DO $$
DECLARE
    typ text;
BEGIN
    FOR typ IN (
        SELECT typname FROM pg_type 
        WHERE typnamespace = 'public'::regnamespace 
        AND typtype = 'e'  -- enums
    )
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(typ) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', typ;
    END LOOP;
END
$$;

-- Validação: Verificar que tudo foi removido
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_count,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views_count,
    (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public') as sequences_count,
    (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace) as functions_count,
    (SELECT COUNT(*) FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') as types_count;

SELECT 'PROD Database completely cleaned. Ready for migration.' as status;
