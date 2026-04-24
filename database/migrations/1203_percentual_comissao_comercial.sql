-- Migration 1203: Adiciona percentual_comissao_comercial em representantes e leads_representante
-- Contexto: O comercial pode ter um percentual de comissão pré-configurado no perfil do
-- representante. A soma percentual_comissao (rep) + percentual_comissao_comercial (comercial)
-- deve ser no máximo 40%. O campo é gravado no lead no momento do cadastro.

BEGIN;

-- 1. Coluna em representantes
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial NUMERIC(5,2) NOT NULL DEFAULT 0
    CONSTRAINT representantes_perc_comercial_range CHECK (percentual_comissao_comercial >= 0 AND percentual_comissao_comercial <= 40);

COMMENT ON COLUMN representantes.percentual_comissao_comercial IS
  'Percentual de comissão reservado ao comercial para este representante. A soma com percentual_comissao não pode ultrapassar 40%.';

-- 2. Coluna em leads_representante
ALTER TABLE leads_representante
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial NUMERIC(5,2) NOT NULL DEFAULT 0
    CONSTRAINT leads_perc_comercial_range CHECK (percentual_comissao_comercial >= 0 AND percentual_comissao_comercial <= 40);

COMMENT ON COLUMN leads_representante.percentual_comissao_comercial IS
  'Percentual de comissão do comercial gravado no momento do cadastro do lead.';

COMMIT;
