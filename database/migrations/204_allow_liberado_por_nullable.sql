-- Migration 204: Permitir liberado_por NULL
-- Data: 22/01/2026

BEGIN;

-- O campo liberado_por antes era NOT NULL, o que impede gestores externos (não-funcionários)
-- de liberarem lotes. Tornamos a coluna nullable para permitir liberadores externos.
ALTER TABLE lotes_avaliacao
ALTER COLUMN liberado_por DROP NOT NULL;

COMMIT;