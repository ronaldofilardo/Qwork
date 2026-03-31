-- ====================================================================
-- Migration 1018: Views de compatibilidade para typo 'tomadors'
-- Data: 2026-03-14
-- ====================================================================
-- CONTEXTO:
--   O código contém o typo 'tomadors' (falta o 'e' de 'tomadores').
--   A Migration 420 renomeou a tabela: tomadores → entidades.
--   Resultado: qualquer query com 'tomadors' falha com "relação não existe".
--
-- SOLUÇÃO FASE 1 (emergencial):
--   Criar views auto-updatable para resolver o erro imediatamente,
--   sem necessidade de alterar código em runtime.
--
-- DEPRECATED: Estas views serão removidas pela Migration 1019
--   após limpeza completa do código (Fase 2 do plano).
-- ====================================================================

BEGIN;

-- View: tomadors → entidades
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'tomadors') THEN
    EXECUTE 'CREATE VIEW tomadors AS SELECT * FROM entidades';
    RAISE NOTICE '✓ View tomadors criada como alias de entidades';
  ELSE
    RAISE NOTICE '⚠ View tomadors já existe. Nada a fazer.';
  END IF;
END $$;

-- View: tomadors_funcionarios → funcionarios_entidades
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'tomadors_funcionarios') THEN
    EXECUTE 'CREATE VIEW tomadors_funcionarios AS SELECT * FROM funcionarios_entidades';
    RAISE NOTICE '✓ View tomadors_funcionarios criada como alias de funcionarios_entidades';
  ELSE
    RAISE NOTICE '⚠ View tomadors_funcionarios já existe. Nada a fazer.';
  END IF;
END $$;

COMMENT ON VIEW tomadors IS
  'Alias de compatibilidade para entidades. DEPRECATED — typo no código (falta "e" de "tomadores"). '
  'Será removido após limpeza completa do código pela Migration 1019.';

COMMENT ON VIEW tomadors_funcionarios IS
  'Alias de compatibilidade para funcionarios_entidades. DEPRECATED — typo no código. '
  'Será removido após limpeza completa do código pela Migration 1019.';

COMMIT;
