-- Migration 091: Adicionar campos de aprovação em contratantes
-- Data: 2026-01-24

BEGIN;

ALTER TABLE contratantes
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS aprovado_por_cpf VARCHAR(11);

COMMENT ON COLUMN contratantes.aprovado_em IS 'Timestamp em que o contratante foi aprovado por um admin';
COMMENT ON COLUMN contratantes.aprovado_por_cpf IS 'CPF do admin que aprovou o contratante';

COMMIT;
