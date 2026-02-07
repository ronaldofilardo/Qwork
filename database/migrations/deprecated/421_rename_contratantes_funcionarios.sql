-- Migration 421: Rename contratantes_funcionarios to entidades_funcionarios
-- Purpose: Rename vinculation table aligning with Migration 420 (contratantes → entidades)
-- Created: 2025-01-31

DO $$
BEGIN
  RAISE NOTICE 'Starting Migration 421: Rename contratantes_funcionarios to entidades_funcionarios...';

  -- 1. Rename table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratantes_funcionarios') THEN
    ALTER TABLE IF EXISTS contratantes_funcionarios RENAME TO entidades_funcionarios;
    RAISE NOTICE 'Renamed table: contratantes_funcionarios → entidades_funcionarios';
  ELSE
    RAISE NOTICE 'Table contratantes_funcionarios does not exist (already renamed or never created)';
  END IF;

  -- 2. Rename column contratante_id to entidade_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entidades_funcionarios' 
    AND column_name = 'contratante_id'
  ) THEN
    ALTER TABLE entidades_funcionarios RENAME COLUMN contratante_id TO entidade_id;
    RAISE NOTICE 'Renamed column: contratante_id → entidade_id';
  ELSE
    RAISE NOTICE 'Column contratante_id does not exist in entidades_funcionarios';
  END IF;

  -- 3. Rename column tipo_contratante to tipo_entidade
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'entidades_funcionarios' 
    AND column_name = 'tipo_contratante'
  ) THEN
    ALTER TABLE entidades_funcionarios RENAME COLUMN tipo_contratante TO tipo_entidade;
    RAISE NOTICE 'Renamed column: tipo_contratante → tipo_entidade';
  ELSE
    RAISE NOTICE 'Column tipo_contratante does not exist in entidades_funcionarios';
  END IF;

  -- 4. Rename foreign key constraint (if exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entidades_funcionarios' 
    AND constraint_name = 'contratantes_funcionarios_contratante_id_fkey'
  ) THEN
    ALTER TABLE entidades_funcionarios 
    RENAME CONSTRAINT contratantes_funcionarios_contratante_id_fkey 
    TO entidades_funcionarios_entidade_id_fkey;
    RAISE NOTICE 'Renamed FK constraint: contratantes_funcionarios_contratante_id_fkey → entidades_funcionarios_entidade_id_fkey';
  END IF;

  -- 5. Rename funcionario_id FK constraint (if exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entidades_funcionarios' 
    AND constraint_name = 'contratantes_funcionarios_funcionario_id_fkey'
  ) THEN
    ALTER TABLE entidades_funcionarios 
    RENAME CONSTRAINT contratantes_funcionarios_funcionario_id_fkey 
    TO entidades_funcionarios_funcionario_id_fkey;
    RAISE NOTICE 'Renamed FK constraint: contratantes_funcionarios_funcionario_id_fkey → entidades_funcionarios_funcionario_id_fkey';
  END IF;

  -- 6. Rename primary key constraint (if exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'entidades_funcionarios' 
    AND constraint_name = 'contratantes_funcionarios_pkey'
  ) THEN
    ALTER TABLE entidades_funcionarios 
    RENAME CONSTRAINT contratantes_funcionarios_pkey 
    TO entidades_funcionarios_pkey;
    RAISE NOTICE 'Renamed PK constraint: contratantes_funcionarios_pkey → entidades_funcionarios_pkey';
  END IF;

  -- 7. Rename indexes (common patterns)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'entidades_funcionarios' 
    AND indexname = 'idx_contratantes_funcionarios_funcionario_id'
  ) THEN
    ALTER INDEX idx_contratantes_funcionarios_funcionario_id 
    RENAME TO idx_entidades_funcionarios_funcionario_id;
    RAISE NOTICE 'Renamed index: idx_contratantes_funcionarios_funcionario_id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'entidades_funcionarios' 
    AND indexname = 'idx_contratantes_funcionarios_contratante_id'
  ) THEN
    ALTER INDEX idx_contratantes_funcionarios_contratante_id 
    RENAME TO idx_entidades_funcionarios_entidade_id;
    RAISE NOTICE 'Renamed index: idx_contratantes_funcionarios_contratante_id';
  END IF;

  -- 8. Update function sync_contratantes_funcionarios (if exists)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_contratantes_funcionarios') THEN
    DROP FUNCTION IF EXISTS sync_contratantes_funcionarios() CASCADE;
    
    CREATE OR REPLACE FUNCTION sync_entidades_funcionarios()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.entidade_id IS NOT NULL THEN
          INSERT INTO entidades_funcionarios (funcionario_id, entidade_id, tipo_entidade, vinculo_ativo)
          VALUES (NEW.id, NEW.entidade_id, 'entidade', true)
          ON CONFLICT (funcionario_id, entidade_id) DO NOTHING;
        END IF;
      ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.entidade_id IS NOT NULL AND NEW.entidade_id != OLD.entidade_id THEN
          INSERT INTO entidades_funcionarios (funcionario_id, entidade_id, tipo_entidade, vinculo_ativo)
          VALUES (NEW.id, NEW.entidade_id, 'entidade', true)
          ON CONFLICT (funcionario_id, entidade_id) DO NOTHING;
        END IF;
        
        UPDATE entidades_funcionarios
        SET vinculo_ativo = (NEW.status = 'ativo')
        WHERE funcionario_id = NEW.id AND entidade_id = NEW.entidade_id;
      END IF;
      
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    RAISE NOTICE 'Recreated function: sync_entidades_funcionarios';
  END IF;

  -- 9. Update trigger (if exists)
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_sync_contratantes_funcionarios'
  ) THEN
    DROP TRIGGER IF EXISTS trg_sync_contratantes_funcionarios ON funcionarios;
    
    CREATE TRIGGER trg_sync_entidades_funcionarios
    AFTER INSERT OR UPDATE ON funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION sync_entidades_funcionarios();
    
    RAISE NOTICE 'Recreated trigger: trg_sync_entidades_funcionarios';
  END IF;

  RAISE NOTICE 'Migration 421 completed successfully!';
END $$;
