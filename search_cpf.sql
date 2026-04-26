DO $$ 
DECLARE 
    t record;
    c record;
    found_count int;
    search_cpf text := '83905249022';
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        FOR c IN (SELECT column_name FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public' AND (data_type LIKE 'char%' OR data_type = 'text')) LOOP
            BEGIN
                EXECUTE format('SELECT count(*) FROM %I WHERE %I = %L', t.table_name, c.column_name, search_cpf) INTO found_count;
                IF found_count > 0 THEN
                    RAISE NOTICE 'Table: %, Column: %, Occurrences: %', t.table_name, c.column_name, found_count;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Skip columns that might fail for some reason (e.g. permission or cast)
                CONTINUE;
            END;
        END LOOP;
    END LOOP;
END $$;
