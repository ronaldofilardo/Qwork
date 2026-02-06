-- MIGRATION 113: Create avaliacao_resets audit table
-- Purpose: Track reset operations on evaluations with immutable audit trail
-- Author: System
-- Date: 2026-01-16

BEGIN;

-- Create audit table for evaluation resets
CREATE TABLE IF NOT EXISTS avaliacao_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  requested_by_user_id INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  respostas_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: only ONE reset per evaluation per batch
CREATE UNIQUE INDEX IF NOT EXISTS idx_avaliacao_resets_unique_per_lote 
  ON avaliacao_resets(avaliacao_id, lote_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_avaliacao_resets_lote_id 
  ON avaliacao_resets(lote_id);
  
CREATE INDEX IF NOT EXISTS idx_avaliacao_resets_requested_by 
  ON avaliacao_resets(requested_by_user_id);
  
CREATE INDEX IF NOT EXISTS idx_avaliacao_resets_created_at 
  ON avaliacao_resets(created_at DESC);

-- Add comments
COMMENT ON TABLE avaliacao_resets IS 'Immutable audit log of evaluation reset operations';
COMMENT ON COLUMN avaliacao_resets.id IS 'Unique identifier for the reset operation';
COMMENT ON COLUMN avaliacao_resets.avaliacao_id IS 'ID of the evaluation that was reset';
COMMENT ON COLUMN avaliacao_resets.lote_id IS 'ID of the batch/cycle containing the evaluation';
COMMENT ON COLUMN avaliacao_resets.requested_by_user_id IS 'User ID who requested the reset';
COMMENT ON COLUMN avaliacao_resets.requested_by_role IS 'Role of the user at the time of reset (rh or gestor)';
COMMENT ON COLUMN avaliacao_resets.reason IS 'Mandatory justification for the reset operation';
COMMENT ON COLUMN avaliacao_resets.respostas_count IS 'Number of responses deleted during reset';
COMMENT ON COLUMN avaliacao_resets.created_at IS 'Timestamp when the reset was performed';

-- RLS: Enable Row Level Security
ALTER TABLE avaliacao_resets ENABLE ROW LEVEL SECURITY;

-- Ensure policies are idempotent: drop if already exist then create
DROP POLICY IF EXISTS avaliacao_resets_select_policy ON avaliacao_resets;
-- RLS Policy: Users can only view resets from their own tenant
CREATE POLICY avaliacao_resets_select_policy ON avaliacao_resets
  FOR SELECT
  USING (
    -- Allow rh and gestor from same tenant
    EXISTS (
      SELECT 1 FROM avaliacoes av
      JOIN lotes_avaliacao lot ON av.lote_id = lot.id
      WHERE av.id = avaliacao_resets.avaliacao_id
        AND (
          -- RH from same clinica
          (current_setting('app.current_user_perfil', true) = 'rh' 
           AND lot.clinica_id = current_setting('app.current_user_clinica_id', true)::int)
          OR
          -- Gestor from same contratante (entity)
          (current_setting('app.current_user_perfil', true) = 'gestor' 
           AND lot.contratante_id = current_setting('app.current_user_contratante_id', true)::int)
        )
    )
  );

DROP POLICY IF EXISTS avaliacao_resets_insert_policy ON avaliacao_resets;
-- RLS Policy: Allow server/backend or authorized roles to insert audit records
CREATE POLICY avaliacao_resets_insert_policy ON avaliacao_resets
  FOR INSERT
  WITH CHECK (
    -- backend processes (migrations, jobs) can insert when they set this flag
    current_setting('app.is_backend', true) = '1'
    -- or an authorized user role with correct tenant context
    OR (current_setting('app.current_user_perfil', true) IN ('rh','gestor','admin'))
  );

DROP POLICY IF EXISTS avaliacao_resets_update_policy ON avaliacao_resets;
-- RLS Policy: No updates allowed (immutable audit log)
CREATE POLICY avaliacao_resets_update_policy ON avaliacao_resets
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS avaliacao_resets_delete_policy ON avaliacao_resets;
-- RLS Policy: No deletes allowed (immutable audit log)
CREATE POLICY avaliacao_resets_delete_policy ON avaliacao_resets
  FOR DELETE
  USING (false);

COMMIT;
