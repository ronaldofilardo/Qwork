DO $$
DECLARE
  r record;
  cnt int;
BEGIN
  FOR r IN
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('character varying', 'text')
  LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I::text LIKE %L', r.table_schema, r.table_name, r.column_name, '%41877277000184%') INTO cnt;
      IF cnt IS NOT NULL AND cnt > 0 THEN
        RAISE NOTICE 'FOUND: %I.%I.%I -> %', r.table_schema, r.table_name, r.column_name, cnt;
      END IF;
    EXCEPTION WHEN others THEN
      -- ignore errors on tables/columns we can't query
      CONTINUE;
    END;
  END LOOP;
END$$;
