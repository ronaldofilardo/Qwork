-- ============================================================================
-- Migration 523: Adicionar valor_negociado à tabela leads_representante
-- Data: 08/03/2026
-- Descrição: O representante informa o valor negociado com a entidade/clínica
--            no momento da criação do lead. Esse valor é usado como sugestão
--            na tela de cobrança do admin.
-- ============================================================================

BEGIN;

-- 1. Adicionar coluna com DEFAULT 0 para não quebrar rows existentes
ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS valor_negociado NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 2. Remover o default para que novos inserts sejam obrigados a informar
ALTER TABLE leads_representante
  ALTER COLUMN valor_negociado DROP DEFAULT;

-- 3. Constraint: valor deve ser >= 0
ALTER TABLE leads_representante
  ADD CONSTRAINT lead_valor_negociado_positivo CHECK (valor_negociado >= 0);

COMMENT ON COLUMN leads_representante.valor_negociado IS
  'Valor negociado pelo representante com a empresa no momento da indicação. Obrigatório para novos leads.';

-- Verificação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads_representante'
      AND column_name = 'valor_negociado'
  ) THEN
    RAISE EXCEPTION 'FALHA: coluna valor_negociado não encontrada em leads_representante';
  END IF;
  RAISE NOTICE 'OK: Migration 523 aplicada — coluna valor_negociado criada em leads_representante';
END;
$$;

COMMIT;
