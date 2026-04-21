-- ============================================================================
-- MIGRATION 1215: Sincronizar vinculos_comissao com estado real do banco
-- Descrição: Garante que entidade_id é nullable, adiciona clinica_id,
--            check constraint vinculo_entidade_ou_clinica, colunas de split
--            e índices parciais de unicidade — idempotente (IF NOT EXISTS / IF EXISTS).
--            Esta migration tornou-se necessária porque o schema blueprint estava
--            desatualizado em relação às migrations 504/505/1121/1125.
-- Data: 2026-04-20
-- ============================================================================

BEGIN;

-- 1. entidade_id: remover NOT NULL se ainda houver
ALTER TABLE public.vinculos_comissao
  ALTER COLUMN entidade_id DROP NOT NULL;

-- 2. clinica_id: adicionar se não existir
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS clinica_id INTEGER
    REFERENCES public.clinicas(id) ON DELETE RESTRICT;

-- 3. Check: exatamente um dos dois deve ser não-nulo
ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS vinculo_entidade_ou_clinica;

ALTER TABLE public.vinculos_comissao
  ADD CONSTRAINT vinculo_entidade_ou_clinica CHECK (
    (entidade_id IS NOT NULL AND clinica_id IS NULL)
    OR
    (entidade_id IS NULL AND clinica_id IS NOT NULL)
  );

-- 4. Colunas de split de comissão (migration 1121/1125 — idempotente)
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_representante NUMERIC(5,2);

ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial NUMERIC(5,2)
    NOT NULL DEFAULT 0;

ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS num_vidas_estimado INTEGER;

-- 5. Constraints de range (idempotentes)
ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_num_vidas_positivo;
ALTER TABLE public.vinculos_comissao
  ADD CONSTRAINT chk_vinculos_num_vidas_positivo
    CHECK (num_vidas_estimado IS NULL OR num_vidas_estimado > 0);

ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_perc_rep_range;
ALTER TABLE public.vinculos_comissao
  ADD CONSTRAINT chk_vinculos_perc_rep_range
    CHECK (percentual_comissao_representante >= 0 AND percentual_comissao_representante <= 100);

ALTER TABLE public.vinculos_comissao
  DROP CONSTRAINT IF EXISTS vinculos_perc_comercial_range;
ALTER TABLE public.vinculos_comissao
  ADD CONSTRAINT vinculos_perc_comercial_range
    CHECK (percentual_comissao_comercial >= 0 AND percentual_comissao_comercial <= 40);

-- 6. Índices parciais de unicidade (migration 504/505 — idempotentes)
CREATE UNIQUE INDEX IF NOT EXISTS vinculo_unico_entidade
  ON public.vinculos_comissao (representante_id, entidade_id)
  WHERE entidade_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vinculo_unico_clinica
  ON public.vinculos_comissao (representante_id, clinica_id)
  WHERE clinica_id IS NOT NULL;

-- 7. valor_negociado em vinculos_comissao (migration 1130 — idempotente)
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS valor_negociado NUMERIC(12,2) DEFAULT NULL;

-- Verificação final
DO $$
DECLARE
  col_count INT;
  constraint_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'vinculos_comissao'
    AND column_name IN ('clinica_id', 'percentual_comissao_representante', 'num_vidas_estimado');

  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'vinculos_comissao'
    AND constraint_name = 'vinculo_entidade_ou_clinica';

  IF col_count < 3 THEN
    RAISE EXCEPTION 'FALHA: colunas esperadas não encontradas em vinculos_comissao (encontrado %)', col_count;
  END IF;

  IF constraint_count < 1 THEN
    RAISE EXCEPTION 'FALHA: constraint vinculo_entidade_ou_clinica não encontrada';
  END IF;

  RAISE NOTICE '[1215] vinculos_comissao sincronizado com sucesso';
  RAISE NOTICE '  - entidade_id: nullable ✓';
  RAISE NOTICE '  - clinica_id: ✓';
  RAISE NOTICE '  - vinculo_entidade_ou_clinica: ✓';
  RAISE NOTICE '  - colunas de split: ✓';
END $$;

COMMIT;
