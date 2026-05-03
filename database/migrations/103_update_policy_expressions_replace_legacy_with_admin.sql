-- Migration 103: Atualizar expressões de policies que mencionam literal 'master' -> 'admin' (idempotente e com backup)
-- Data: 2026-01-15
-- Descrição: Para policies cujo corpo contenha o literal 'master' em strings, cria backup e substitui o literal por 'admin'.
-- Aviso: Substitui apenas ocorrências do literal 'master' dentro de strings (ex.: 'master', 'master'::text) para minimizar impacto.

BEGIN;

-- 1) Cria tabela de backup das expressions (idempotente)
CREATE TABLE IF NOT EXISTS public.policy_expression_backups (
  id SERIAL PRIMARY KEY,
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  using_expr TEXT,
  with_check_expr TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Loop em todas policies que contenham literal 'master' nas expressões
DO $$
DECLARE
  rec RECORD;
  v_using TEXT;
  v_with_check TEXT;
  v_new_using TEXT;
  v_new_with_check TEXT;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, p.polname AS policy_name,
           pg_get_expr(p.polqual, p.polrelid) AS using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE (pg_get_expr(p.polqual, p.polrelid) IS NOT NULL AND pg_get_expr(p.polqual, p.polrelid) LIKE '%master%')
       OR (pg_get_expr(p.polwithcheck, p.polrelid) IS NOT NULL AND pg_get_expr(p.polwithcheck, p.polrelid) LIKE '%master%')
  LOOP
    v_using := rec.using_expr;
    v_with_check := rec.with_check_expr;

    -- Insert backup
    INSERT INTO public.policy_expression_backups (schema_name, table_name, policy_name, using_expr, with_check_expr)
    VALUES (rec.schema_name, rec.table_name, rec.policy_name, v_using, v_with_check);

    -- Prepare replacements: replace literal 'master' occurrences in strings
    -- Replace patterns: 'master'  and 'master'::text and 'master'::character varying
    IF v_using IS NOT NULL THEN
      v_new_using := replace(v_using, '''master''::character varying', '''admin''::character varying');
      v_new_using := replace(v_new_using, '''master''::text', '''admin''::text');
      v_new_using := replace(v_new_using, '''master''', '''admin''');
    ELSE
      v_new_using := NULL;
    END IF;

    IF v_with_check IS NOT NULL THEN
      v_new_with_check := replace(v_with_check, '''master''::character varying', '''admin''::character varying');
      v_new_with_check := replace(v_new_with_check, '''master''::text', '''admin''::text');
      v_new_with_check := replace(v_new_with_check, '''master''', '''admin''');
    ELSE
      v_new_with_check := NULL;
    END IF;

    -- Apply alterations only if changed
    IF v_new_using IS NOT NULL AND v_new_using <> v_using THEN
      EXECUTE format('ALTER POLICY "%s" ON %I.%I USING (%s)', rec.policy_name, rec.schema_name, rec.table_name, v_new_using);
      RAISE NOTICE 'Policy % on %.% USING expression updated.', rec.policy_name, rec.schema_name, rec.table_name;
    END IF;

    IF v_new_with_check IS NOT NULL AND v_new_with_check <> v_with_check THEN
      EXECUTE format('ALTER POLICY "%s" ON %I.%I WITH CHECK (%s)', rec.policy_name, rec.schema_name, rec.table_name, v_new_with_check);
      RAISE NOTICE 'Policy % on %.% WITH CHECK expression updated.', rec.policy_name, rec.schema_name, rec.table_name;
    END IF;

  END LOOP;
END $$;

-- 3) Emitir aviso final para revisão
DO $$ BEGIN RAISE NOTICE 'Migration 103_update_policy_expressions applied: policies with ''master'' updated to ''admin'' where safe; backups in policy_expression_backups.'; END $$;

COMMIT;
