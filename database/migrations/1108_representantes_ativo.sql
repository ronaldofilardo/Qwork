-- Migration 1108: Adiciona coluna `ativo` na tabela `representantes`
-- Permite inativação/ativação de acesso independente do ciclo de vida (status)
-- Comercial pode inativar/ativar representantes sem alterar o status de negócio

BEGIN;

ALTER TABLE public.representantes
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Índice para otimizar consultas por ativo
CREATE INDEX IF NOT EXISTS idx_representantes_ativo
  ON public.representantes (ativo);

-- Índice composto: status + ativo (queries de login e listagem)
CREATE INDEX IF NOT EXISTS idx_representantes_status_ativo
  ON public.representantes (status, ativo);

COMMENT ON COLUMN public.representantes.ativo
  IS 'Controla acesso ao sistema. false = login bloqueado. Independente do status de negócio.';

COMMIT;
