-- Migration 1020: Enforce Lotes Owner Segregation
-- Data: 2026-03-17
-- Problema: queries de entidade filtravam lotes via join de funcionarios
--           em vez de filtrar por entidade_id diretamente, causando vazamento
--           de lotes de clinicas para a view de entidades.

BEGIN;

-- PARTE 1: DIAGNOSTICO
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM lotes_avaliacao
  WHERE entidade_id IS NOT NULL AND clinica_id IS NOT NULL;
  IF v_count > 0 THEN
    RAISE WARNING 'ATENCAO: % lote(s) com entidade_id E clinica_id - violacao de segregacao!', v_count;
  ELSE
    RAISE NOTICE 'OK: nenhum lote viola a segregacao entidade/clinica';
  END IF;
END $$;

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM lotes_avaliacao
  WHERE entidade_id IS NULL AND clinica_id IS NULL;
  IF v_count > 0 THEN
    RAISE WARNING 'ATENCAO: % lote(s) sem dono (entidade_id e clinica_id ambos NULL)!', v_count;
  ELSE
    RAISE NOTICE 'OK: nenhum lote orfao encontrado';
  END IF;
END $$;

-- PARTE 2: REMOVER CONSTRAINTS LEGADAS E GARANTIR A CORRETA
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_clinica_or_contratante_check' AND conrelid = 'lotes_avaliacao'::regclass) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_clinica_or_contratante_check;
    RAISE NOTICE 'Constraint legada clinica_or_contratante_check removida';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_entidade_or_clinica_empresa_check' AND conrelid = 'lotes_avaliacao'::regclass) THEN
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT lotes_avaliacao_entidade_or_clinica_empresa_check;
    RAISE NOTICE 'Constraint legada entidade_or_clinica_empresa_check removida';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_avaliacao_owner_segregation_check' AND conrelid = 'lotes_avaliacao'::regclass) THEN
    ALTER TABLE lotes_avaliacao
      ADD CONSTRAINT lotes_avaliacao_owner_segregation_check
      CHECK (
        (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND entidade_id IS NULL)
        OR
        (entidade_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
      );
    RAISE NOTICE 'OK: constraint lotes_avaliacao_owner_segregation_check criada';
  ELSE
    RAISE NOTICE 'OK: constraint lotes_avaliacao_owner_segregation_check ja existe';
  END IF;
END $$;

-- PARTE 3: INDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_entidade_id
  ON lotes_avaliacao(entidade_id) WHERE entidade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_clinica_id
  ON lotes_avaliacao(clinica_id) WHERE clinica_id IS NOT NULL;

-- PARTE 4: VALIDACAO FINAL
DO $$
DECLARE
  v_entidade INTEGER; v_clinica INTEGER; v_invalidos INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_entidade FROM lotes_avaliacao WHERE entidade_id IS NOT NULL AND clinica_id IS NULL;
  SELECT COUNT(*) INTO v_clinica  FROM lotes_avaliacao WHERE clinica_id  IS NOT NULL AND entidade_id IS NULL;
  SELECT COUNT(*) INTO v_invalidos FROM lotes_avaliacao
  WHERE (entidade_id IS NOT NULL AND clinica_id IS NOT NULL) OR (entidade_id IS NULL AND clinica_id IS NULL);
  RAISE NOTICE '=== RESULTADO MIGRATION 1020 ===';
  RAISE NOTICE 'Lotes ENTIDADE : %', v_entidade;
  RAISE NOTICE 'Lotes CLINICA  : %', v_clinica;
  RAISE NOTICE 'Lotes INVALIDOS: %', v_invalidos;
  IF v_invalidos > 0 THEN RAISE WARNING 'Existem % lotes invalidos. Inspencione manualmente.', v_invalidos;
  ELSE RAISE NOTICE 'OK: todos os lotes estao corretamente segregados'; END IF;
END $$;

COMMIT;