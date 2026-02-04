-- Script: insert-laudo-hashes-001-002.sql
-- Purpose: Inject provided SHA-256 hashes into laudos.hash_pdf for two lotes (safe, idempotent)
-- Usage (PowerShell / CMD):
-- psql -U postgres -d nr-bps_db -h localhost -f scripts/fixes/insert-laudo-hashes-001-002.sql
-- or (psql interactive): \i scripts/fixes/insert-laudo-hashes-001-002.sql

BEGIN;

-- Update laudo for lote ID 2 (was code 002-070126)
UPDATE laudos
SET hash_pdf = 'E929FED9FB3B05CA7A2A774190521ECBAD80C566D50B0DA24BFDE8A608AC38F4'
WHERE lote_id = 2
AND (hash_pdf IS NULL OR hash_pdf <> 'E929FED9FB3B05CA7A2A774190521ECBAD80C566D50B0DA24BFDE8A608AC38F4');

-- Update laudo for lote ID 1 (was code 001-070126)
UPDATE laudos
SET hash_pdf = 'CCF0EF2ACB403E14801366373373439A6C217DD3EC49BFB5B80AECED1FA9C6A6'
WHERE lote_id = 1
AND (hash_pdf IS NULL OR hash_pdf <> 'CCF0EF2ACB403E14801366373373439A6C217DD3EC49BFB5B80AECED1FA9C6A6');

-- Return rows to verify
SELECT l.id, l.lote_id, l.hash_pdf
FROM laudos l
WHERE l.lote_id IN (1, 2);

COMMIT;
