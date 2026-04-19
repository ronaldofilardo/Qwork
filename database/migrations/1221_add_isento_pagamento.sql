-- Migration 1221: Adicionar coluna isento_pagamento em clinicas e entidades
-- Propósito: permitir isenção total de cobranças para parceiros de negócio
-- Data: 2025

-- Adicionar coluna em clinicas
ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS isento_pagamento BOOLEAN NOT NULL DEFAULT false;

-- Adicionar coluna em entidades
ALTER TABLE entidades
  ADD COLUMN IF NOT EXISTS isento_pagamento BOOLEAN NOT NULL DEFAULT false;

-- Marcar parceiro inicial como isento (CNPJ 00249085000146, id=132)
UPDATE clinicas SET isento_pagamento = true WHERE id = 132;
