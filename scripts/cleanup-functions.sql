-- Limpar functions restantes (exceto extensions)
DO $$
DECLARE
    rec RECORD;
    func_signature text;
BEGIN
    FOR rec IN (
        SELECT 
            p.oid::regprocedure::text as full_signature,
            p.proname
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
        AND p.proname NOT IN (
            -- pgcrypto functions
            'armor', 'dearmor', 'pgp_sym_encrypt', 'pgp_sym_decrypt', 
            'pgp_pub_encrypt', 'pgp_pub_decrypt', 'pgp_key_id',
            'gen_salt', 'crypt', 
            -- uuid functions
            'gen_random_uuid', 'uuid_generate_v1', 'uuid_generate_v4',
            'uuid_generate_v1mc', 'uuid_generate_v3', 'uuid_generate_v5',
            'uuid_nil', 'uuid_ns_dns', 'uuid_ns_url', 'uuid_ns_oid', 'uuid_ns_x500'
        )
    )
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || rec.full_signature || ' CASCADE';
            RAISE NOTICE 'Dropped function: %', rec.full_signature;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop: % (error: %)', rec.full_signature, SQLERRM;
        END;
    END LOOP;
END
$$;

-- Validar
SELECT COUNT(*) as remaining_app_functions
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname NOT LIKE 'armor%'
AND proname NOT LIKE 'pgp_%'
AND proname NOT LIKE 'gen_%'
AND proname NOT LIKE 'uuid_%'
AND proname NOT IN ('crypt', 'dearmor');

SELECT 'Function cleanup completed' as status;
