-- =====================================================
-- Migration 527: Aceites de Termos para Representantes (PRODUÇÃO)
-- Data: 08/03/2026
-- Descrição:
--   Corrige a anomalia da migration 526, que marcava TODOS os
--   representantes como já tendo aceito a política de privacidade,
--   incluindo novos representantes que ainda precisam passar pelo
--   fluxo de primeiro acesso.
--
--   Esta migration é SEGURA para produção:
--   - Idempotente: adiciona colunas apenas se não existirem
--   - Marca como TRUE apenas representantes criados ANTES de 08/03/2026
--     (data de implementação do fluxo de aceites no portal)
--   - Representantes criados em ou após 08/03/2026 permanecem FALSE
--     e verão o modal de aceite no próximo login
--
--   Ação direta sobre o CPF 59073257042 e demais novos representantes:
--   ficam com aceite_politica_privacidade = FALSE → modal exibido no login.
-- =====================================================

BEGIN;

-- 1. Adicionar colunas (IF NOT EXISTS — idempotente, seguro re-executar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'representantes'
      AND column_name  = 'aceite_politica_privacidade'
  ) THEN
    ALTER TABLE public.representantes
      ADD COLUMN aceite_politica_privacidade    BOOLEAN    NOT NULL DEFAULT FALSE,
      ADD COLUMN aceite_politica_privacidade_em TIMESTAMPTZ;

    COMMENT ON COLUMN public.representantes.aceite_politica_privacidade
      IS 'Representante aceitou a Política de Privacidade no primeiro acesso ao portal';
    COMMENT ON COLUMN public.representantes.aceite_politica_privacidade_em
      IS 'Data/hora em que o representante aceitou a Política de Privacidade';
  END IF;
END $$;

-- 2. Marcar como já aceitos APENAS representantes que existiam
--    antes da implementação do fluxo de aceites (08/03/2026).
--    Representantes criados nessa data ou depois deverão aceitar
--    os termos no primeiro login — o modal será exibido automaticamente.
UPDATE public.representantes
SET
  aceite_politica_privacidade    = TRUE,
  aceite_politica_privacidade_em = NOW()
WHERE aceite_politica_privacidade = FALSE
  AND criado_em < '2026-03-08'::date;

COMMIT;
