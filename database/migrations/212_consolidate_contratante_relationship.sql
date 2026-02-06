-- Migration 212: Consolidate Contratante Relationship
-- Created: 2026-01-29
-- Purpose: Remove contratantes_funcionarios table, use funcionarios.contratante_id

BEGIN;

-- ========================================
-- PART 1: Data validation and backfill
-- ========================================

-- Check for inconsistencies before migration
DO $$
DECLARE
  v_missing INTEGER;
  v_conflicts INTEGER;
BEGIN
  -- Count funcionarios in contratantes_funcionarios but missing contratante_id
  SELECT COUNT(*) INTO v_missing
  FROM contratantes_funcionarios cf
  LEFT JOIN funcionarios f ON f.id = cf.funcionario_id
  WHERE f.contratante_id IS NULL;
  
  IF v_missing > 0 THEN
    RAISE NOTICE 'Found % funcionarios without contratante_id, backfilling...', v_missing;
    
    -- Backfill missing contratante_id
    UPDATE funcionarios f
    SET contratante_id = cf.contratante_id
    FROM contratantes_funcionarios cf
    WHERE f.id = cf.funcionario_id
      AND f.contratante_id IS NULL;
    
    RAISE NOTICE 'Backfilled % funcionarios', v_missing;
  END IF;
  
  -- Check for conflicts (different contratante_id in both tables)
  SELECT COUNT(*) INTO v_conflicts
  FROM funcionarios f
  JOIN contratantes_funcionarios cf ON f.id = cf.funcionario_id
  WHERE f.contratante_id IS NOT NULL
    AND f.contratante_id != cf.contratante_id;
  
  IF v_conflicts > 0 THEN
    -- Log conflicts for manual review
    INSERT INTO audit_logs (
      user_cpf,
      user_perfil,
      action,
      resource,
      details
    )
    SELECT
      'MIGRATION_212',
      'system',
      'DATA_CONFLICT',
      'funcionarios',
      'Funcionario ID: ' || f.id || 
      ', contratante_id in funcionarios: ' || f.contratante_id ||
      ', contratante_id in contratantes_funcionarios: ' || cf.contratante_id
    FROM funcionarios f
    JOIN contratantes_funcionarios cf ON f.id = cf.funcionario_id
    WHERE f.contratante_id IS NOT NULL
      AND f.contratante_id != cf.contratante_id;
    
    RAISE EXCEPTION 'CONFLICT: % funcionarios have different contratante_id in both tables. Check audit_logs.', v_conflicts;
  END IF;
  
  RAISE NOTICE 'Data validation passed: no conflicts found';
END $$;

-- ========================================
-- PART 2: Drop contratantes_funcionarios table
-- ========================================

-- Drop foreign key constraints first
ALTER TABLE contratantes_funcionarios 
  DROP CONSTRAINT IF EXISTS fk_contratantes_funcionarios_contratante CASCADE;

ALTER TABLE contratantes_funcionarios 
  DROP CONSTRAINT IF EXISTS fk_contratantes_funcionarios_funcionario CASCADE;

-- Drop the table
DROP TABLE IF EXISTS contratantes_funcionarios CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Dropped table contratantes_funcionarios';
END $$;

-- ========================================
-- PART 3: Fix data before applying constraint
-- ========================================

-- Validate data structure
DO $$
DECLARE
  v_rh_without_contratante INTEGER;
  v_gestor_without_contratante INTEGER;
  v_funcionario_no_entity INTEGER;
BEGIN
  -- Count rh without contratante_id
  SELECT COUNT(*) INTO v_rh_without_contratante
  FROM funcionarios
  WHERE perfil = 'rh' AND contratante_id IS NULL;
  
  -- Count gestor without contratante_id
  SELECT COUNT(*) INTO v_gestor_without_contratante
  FROM funcionarios
  WHERE perfil = 'gestor' AND contratante_id IS NULL;
  
  -- Count funcionarios without any entity
  SELECT COUNT(*) INTO v_funcionario_no_entity
  FROM funcionarios
  WHERE perfil = 'funcionario' 
    AND clinica_id IS NULL 
    AND contratante_id IS NULL;
  
  IF v_rh_without_contratante > 0 OR v_gestor_without_contratante > 0 OR v_funcionario_no_entity > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA VALIDATION WARNINGS';
    RAISE NOTICE '========================================';
    IF v_rh_without_contratante > 0 THEN
      RAISE NOTICE 'RH without contratante_id: % (should have contratante)', v_rh_without_contratante;
    END IF;
    IF v_gestor_without_contratante > 0 THEN
      RAISE NOTICE 'gestor without contratante_id: % (should have contratante)', v_gestor_without_contratante;
    END IF;
    IF v_funcionario_no_entity > 0 THEN
      RAISE NOTICE 'funcionario without entity: % (should have clinica_id OR contratante_id)', v_funcionario_no_entity;
    END IF;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE 'Data validation passed: all entities assigned correctly';
  END IF;
END $$;

-- ========================================
-- PART 4: Update funcionarios constraints
-- ========================================

-- Drop old constraint
ALTER TABLE funcionarios
  DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Add new comprehensive constraint
ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_entity_check
  CHECK (
    -- rh: must have contratante_id (manages clinica/entidade), may have clinica_id (specific clinica)
    (perfil = 'rh' 
     AND contratante_id IS NOT NULL)
    OR
    -- gestor: must have contratante_id (manages entidade), no clinica_id
    (perfil = 'gestor' 
     AND contratante_id IS NOT NULL 
     AND clinica_id IS NULL)
    OR
    -- funcionario: must have clinica_id (empresa of clinica) OR contratante_id (direct employee of entidade)
    (perfil = 'funcionario' 
     AND (
       (clinica_id IS NOT NULL AND contratante_id IS NULL)
       OR (clinica_id IS NULL AND contratante_id IS NOT NULL)
     ))
    OR
    -- emissor/admin: no entity required
    (perfil IN ('emissor', 'admin') 
     AND clinica_id IS NULL 
     AND contratante_id IS NULL)
  ) NOT VALID;

-- Validate constraint (may fail if data is inconsistent)
ALTER TABLE funcionarios VALIDATE CONSTRAINT funcionarios_entity_check;

COMMENT ON CONSTRAINT funcionarios_entity_check ON funcionarios IS
  'Ensures funcionarios belong to correct entity based on perfil:
   - rh: contratante_id required (may also have clinica_id for specific clinica)
   - gestor: contratante_id required, no clinica_id
   - funcionario: clinica_id (empresa of clinica) XOR contratante_id (employee of entidade)
   - emissor/admin: no entity';

-- ========================================
-- PART 5: Update indexes
-- ========================================

-- Index for contratante lookups (rh, gestor, funcionario of entidade)
CREATE INDEX IF NOT EXISTS idx_funcionarios_contratante_id 
  ON funcionarios(contratante_id) 
  WHERE contratante_id IS NOT NULL;

-- Index for clinica lookups (funcionario of empresa)
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_id
  ON funcionarios(clinica_id)
  WHERE clinica_id IS NOT NULL;

-- Index for perfil + entity queries
CREATE INDEX IF NOT EXISTS idx_funcionarios_perfil_entities 
  ON funcionarios(perfil, clinica_id, contratante_id);

-- ========================================
-- PART 6: VALIDATION
-- ========================================

DO $$
DECLARE
  v_total INTEGER;
  v_clinica INTEGER;
  v_contratante INTEGER;
  v_none INTEGER;
BEGIN
  -- Count funcionarios by entity type
  SELECT
    COUNT(*) FILTER (WHERE clinica_id IS NOT NULL),
    COUNT(*) FILTER (WHERE contratante_id IS NOT NULL),
    COUNT(*) FILTER (WHERE clinica_id IS NULL AND contratante_id IS NULL),
    COUNT(*)
  INTO v_clinica, v_contratante, v_none, v_total
  FROM funcionarios;
  
  -- Validate table doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contratantes_funcionarios'
  ) THEN
    RAISE EXCEPTION 'FAILED: contratantes_funcionarios table still exists';
  END IF;
  
  -- Validate constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'funcionarios_entity_check'
      AND table_name = 'funcionarios'
  ) THEN
    RAISE EXCEPTION 'FAILED: funcionarios_entity_check constraint not created';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 212 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table contratantes_funcionarios: DROPPED';
  RAISE NOTICE 'Single source of truth: funcionarios.contratante_id';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Funcionarios by entity:';
  RAISE NOTICE '  - With clinica_id (funcionario of empresa): %', v_clinica;
  RAISE NOTICE '  - With contratante_id (rh/gestor/funcionario of entidade): %', v_contratante;
  RAISE NOTICE '  - Without entity (emissor/admin): %', v_none;
  RAISE NOTICE '  - Total: %', v_total;
  RAISE NOTICE '========================================';
END $$;

COMMIT;
