-- Migration 1201: Adicionar link_pagamento_token em pagamentos
-- Data: 09/04/2026
-- Descrição: Permite gerar link de pagamento direto para taxas de manutenção,
--            usando o mesmo mecanismo de token já existente em lotes_avaliacao.

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS link_pagamento_token     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS link_pagamento_enviado_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS link_disponibilizado_em  TIMESTAMP WITH TIME ZONE;

-- Índice único para token (lookup rápido e unicidade)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_link_token
  ON pagamentos (link_pagamento_token)
  WHERE link_pagamento_token IS NOT NULL;
