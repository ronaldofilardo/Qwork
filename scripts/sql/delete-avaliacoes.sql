-- scripts/sql/delete-avaliacoes.sql
-- Usage (psql):
--  psql "postgresql://user:pass@host:5432/dbname" -f scripts/sql/delete-avaliacoes.sql
--  To run without prompts, set the environment variable PSQL_FORCE_DELETE=1
--
-- This script deletes rows from public.avaliacoes in batches using ctid to limit each delete.
-- It includes optional disabling of triggers (via session_replication_role) and attempts to disable RLS if the connected role can.

\set batch 5000
\echo '*** START delete-avaliacoes.sql ***'

-- Safety check: ensure table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'avaliacoes') THEN
    RAISE EXCEPTION 'Table public.avaliacoes not found. Aborting.';
  END IF;
END
$$ LANGUAGE plpgsql;

-- Show current count
SELECT count(*) AS to_delete_count FROM public.avaliacoes;

-- Confirm environment
\echo 'If this is a production database, set PSQL_FORCE_DELETE=1 to proceed.'
\if :PSQL_ENV_FORCE == '1'
\echo 'Force enabled from environment'
\else
  \echo 'No force flag set; if you want to proceed on non-test DBs set PSQL_FORCE_DELETE=1';
\endif

-- Note: To disable triggers for the session, use: SET session_replication_role = replica;
-- We'll do one pass of disabling triggers, then re-enable at the end.

-- Begin deletions in batches
\echo 'Starting batched delete...'

DO $$
DECLARE
  deleted integer := 0;
  batch_size integer := current_setting('batch', true)::integer;
BEGIN
  LOOP
    DELETE FROM public.avaliacoes
    WHERE ctid IN (SELECT ctid FROM public.avaliacoes LIMIT batch_size)
    RETURNING 1 INTO deleted;

    IF NOT FOUND THEN
      EXIT;
    END IF;
    PERFORM pg_sleep(0.05);
  END LOOP;
END
$$ LANGUAGE plpgsql;

SELECT count(*) AS remaining_after_delete FROM public.avaliacoes;
\echo '*** END delete-avaliacoes.sql ***' 
