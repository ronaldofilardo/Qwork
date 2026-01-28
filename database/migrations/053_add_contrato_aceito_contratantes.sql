-- Migration 053: Re-adicionar coluna contrato_aceito em contratantes
-- Data: 2025-12-27

ALTER TABLE contratantes
  ADD COLUMN IF NOT EXISTS contrato_aceito BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_contratantes_contrato_aceito ON contratantes (contrato_aceito);

COMMENT ON COLUMN contratantes.contrato_aceito IS 'Indica se o contratante aceitou o contrato/política (usado para fluxo de pagamento e notificações)';

DO $$
BEGIN
  RAISE NOTICE 'Migration 053 executada: coluna contrato_aceito adicionada em contratantes (se não existia)';
END $$;
