-- Migration 1133: Confirmação de Identificação nas Avaliações
-- Adiciona campo para registrar que o funcionário confirmou sua identidade
-- antes de responder o questionário de avaliação de risco psicossocial.
--
-- Usado pela auditoria admin (aba "Aceites") para exibir o status de
-- confirmação de cada funcionário.

BEGIN;

ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS identificacao_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identificacao_confirmada_em TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN public.avaliacoes.identificacao_confirmada IS
  'Flag: funcionário confirmou ser o titular da avaliação antes de responder';

COMMENT ON COLUMN public.avaliacoes.identificacao_confirmada_em IS
  'Timestamp em que a confirmação de identificação foi registrada';

CREATE INDEX IF NOT EXISTS idx_avaliacoes_identificacao_confirmada
  ON public.avaliacoes (funcionario_cpf)
  WHERE identificacao_confirmada = TRUE;

COMMIT;
