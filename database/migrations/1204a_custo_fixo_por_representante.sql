-- Migration 1204: Custo fixo por representante + snapshot em leads
-- Data: 2026-04-13
-- Descrição: Adiciona modelo custo_fixo (valor QWork negociado por tipo de cliente)
--            aos representantes e snapshot ao lead no momento do cadastro.
--            Também torna vinculos_comissao.representante_id nullable para suportar
--            clientes onboardados sem representante (atribuição retroativa via Comercial).

BEGIN;

-- ─── representantes: campos de custo fixo por tipo de cliente ────────────────

ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS valor_custo_fixo_entidade NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_custo_fixo_clinica  NUMERIC(10,2) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rep_custo_fixo_entidade_pos' AND conrelid = 'representantes'::regclass
  ) THEN
    ALTER TABLE representantes
      ADD CONSTRAINT rep_custo_fixo_entidade_pos
        CHECK (valor_custo_fixo_entidade IS NULL OR valor_custo_fixo_entidade > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rep_custo_fixo_clinica_pos' AND conrelid = 'representantes'::regclass
  ) THEN
    ALTER TABLE representantes
      ADD CONSTRAINT rep_custo_fixo_clinica_pos
        CHECK (valor_custo_fixo_clinica IS NULL OR valor_custo_fixo_clinica > 0);
  END IF;
END $$;

COMMENT ON COLUMN representantes.valor_custo_fixo_entidade
  IS 'Valor fixo retido pela QWork por avaliação no modelo custo_fixo (tipo entidade). Quando NULL, usa CUSTO_POR_AVALIACAO.entidade = 12.';

COMMENT ON COLUMN representantes.valor_custo_fixo_clinica
  IS 'Valor fixo retido pela QWork por avaliação no modelo custo_fixo (tipo clínica). Quando NULL, usa CUSTO_POR_AVALIACAO.clinica = 5.';

-- ─── leads_representante: snapshot do custo_fixo no momento do cadastro ─────

ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS valor_custo_fixo_snapshot NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN leads_representante.valor_custo_fixo_snapshot
  IS 'Snapshot do valor_custo_fixo do representante no momento do cadastro do lead (modelo custo_fixo). NULL = modelo percentual.';

-- ─── vinculos_comissao: tornar representante_id nullable ────────────────────
-- Necessário para clientes onboardados sem representante (atribuição retroativa)

ALTER TABLE vinculos_comissao
  ALTER COLUMN representante_id DROP NOT NULL;

COMMENT ON COLUMN vinculos_comissao.representante_id
  IS 'FK para representantes. NULL quando o cliente foi cadastrado sem representante vinculado. O Comercial pode atribuir retroativamente.';

COMMIT;
