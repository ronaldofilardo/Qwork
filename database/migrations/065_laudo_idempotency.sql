-- Migration: 065_laudo_idempotency.sql
-- Description: Add unique constraint on laudos(lote_id) to prevent duplicate laudo generation
-- Date: 2026-01-04
-- Priority: P0.4 - CRÍTICA (Prevent duplicate laudo emission)

BEGIN;

\echo '=== MIGRATION 065: Implementando idempotência na emissão de laudos ==='

-- Check if there are existing duplicate laudos
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT lote_id, COUNT(*) as cnt
        FROM laudos
        GROUP BY lote_id
        HAVING COUNT(*) > 1
    ) as duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Encontrados % lotes com laudos duplicados. Será mantido apenas o mais recente.', duplicate_count;
        
        -- Delete older duplicates, keep the most recent one
        DELETE FROM laudos
        WHERE id NOT IN (
            SELECT DISTINCT ON (lote_id) id
            FROM laudos
            ORDER BY lote_id, criado_em DESC
        );
        
        RAISE NOTICE 'Laudos duplicados removidos. Mantido apenas o mais recente por lote.';
    ELSE
        RAISE NOTICE 'Nenhum laudo duplicado encontrado.';
    END IF;
END $$;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.laudos
ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);

\echo '065.1 Constraint UNIQUE adicionada em laudos(lote_id)'

-- Add partial index for fast lookup of active laudos
CREATE INDEX IF NOT EXISTS idx_laudos_lote_status 
ON public.laudos (lote_id, status);

\echo '065.2 Índice de performance criado para laudos(lote_id, status)'

-- Create function to safely upsert laudo (idempotent)
-- Create function to safely upsert laudo (idempotent)
-- Implementation updated: ensure laudo.id == lote_id by explicitly inserting with id = p_lote_id.
CREATE OR REPLACE FUNCTION upsert_laudo(
    p_lote_id INTEGER,
    p_emissor_cpf CHAR(11),
    p_observacoes TEXT,
    p_status TEXT DEFAULT 'enviado'
) RETURNS INTEGER AS $$
DECLARE
    v_laudo_id INTEGER;
BEGIN
    -- Try to insert with explicit id equal to lote_id; if conflict on lote_id, update existing record.
    INSERT INTO laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, atualizado_em)
    VALUES (p_lote_id, p_lote_id, p_emissor_cpf, p_observacoes, p_status, NOW(), NOW(), NOW())
    ON CONFLICT (lote_id) DO UPDATE
    SET 
        observacoes = EXCLUDED.observacoes,
        status = EXCLUDED.status,
        emitido_em = NOW(),
        atualizado_em = NOW()
    RETURNING id INTO v_laudo_id;

    RETURN v_laudo_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_laudo IS 'Cria ou atualiza laudo de forma idempotente (garante id = lote_id)';

\echo '065.3 Função upsert_laudo() criada para emissão idempotente (com id = lote_id)'

-- Create trigger to prevent manual updates that could break idempotency
CREATE OR REPLACE FUNCTION prevent_laudo_lote_id_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.lote_id != NEW.lote_id THEN
        RAISE EXCEPTION 'Não é permitido alterar lote_id de um laudo já criado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_laudo_lote_id_change ON laudos;

CREATE TRIGGER trg_prevent_laudo_lote_id_change
BEFORE UPDATE ON laudos
FOR EACH ROW
EXECUTE FUNCTION prevent_laudo_lote_id_change();

\echo '065.4 Trigger de proteção contra alteração de lote_id criado'

COMMIT;

\echo '=== MIGRATION 065: Concluída com sucesso ==='
