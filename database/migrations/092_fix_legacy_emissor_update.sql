-- Migration: Fix existing laudos that have emissor_cpf = '00000000000'
-- Date: 2026-01-29

-- This migration will:
-- 1) Verify there is a single active emissor to use as replacement
-- 2) Temporarily disable the laudo immutability trigger, update affected laudos, add audit logs, and re-enable trigger

BEGIN;

-- 1) Determine replacement emissor
DO $$
DECLARE
  v_count integer;
  v_cpf text;
BEGIN
  SELECT COUNT(*) INTO v_count FROM funcionarios WHERE perfil = 'emissor' AND ativo = true;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Aborting: no active emissor found to update legacy laudos';
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION 'Aborting: multiple active emissores found; manual resolution required';
  END IF;

  SELECT cpf INTO v_cpf FROM funcionarios WHERE perfil = 'emissor' AND ativo = true LIMIT 1;

  RAISE NOTICE 'Replacement emissor determined: %', v_cpf;

  -- 2) Disable immutability trigger temporarily
  EXECUTE 'ALTER TABLE laudos DISABLE TRIGGER trigger_laudo_immutability';

  -- 3) Update laudos where emissor is placeholder
  PERFORM 1;
  UPDATE laudos
  SET emissor_cpf = v_cpf, atualizado_em = NOW()
  WHERE emissor_cpf = '00000000000';

  -- 4) Insert audit logs for transparency
  INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_role, criado_em)
  SELECT 'fix_legacy_emissor', 'laudos', id, json_build_object('old_emissor','00000000000','new_emissor', v_cpf, 'note', 'automated_migration_fix'), 'system', NOW()
  FROM laudos
  WHERE emissor_cpf = v_cpf AND atualizado_em >= (NOW() - INTERVAL '5 minutes');

  -- 5) Re-enable trigger
  EXECUTE 'ALTER TABLE laudos ENABLE TRIGGER trigger_laudo_immutability';
END;
$$ LANGUAGE plpgsql;

COMMIT;