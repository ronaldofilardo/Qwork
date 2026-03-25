-- Migration 1124: Fechamento mensal de comissões
-- Tabela de ciclos de comissão para consolidação mensal de NF/RPA

BEGIN;

-- 1. Tabela de ciclos (fechamento mensal)
CREATE TABLE IF NOT EXISTS ciclos_comissao (
  id SERIAL PRIMARY KEY,
  representante_id INTEGER NOT NULL REFERENCES representantes(id),
  vendedor_id INTEGER,                         -- NULL = ciclo do representante
  tipo_beneficiario VARCHAR(20) NOT NULL DEFAULT 'representante'
    CHECK (tipo_beneficiario IN ('representante', 'vendedor')),
  mes_referencia DATE NOT NULL,                -- Primeiro dia do mês (ex: 2026-03-01)
  valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  qtd_comissoes INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'fechado', 'nf_enviada', 'nf_aprovada', 'pago')),
  nf_path TEXT,
  nf_nome_arquivo TEXT,
  nf_enviada_em TIMESTAMP WITH TIME ZONE,
  nf_aprovada_em TIMESTAMP WITH TIME ZONE,
  nf_rejeitada_em TIMESTAMP WITH TIME ZONE,
  nf_motivo_rejeicao TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante_pagamento_path TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fechado_em TIMESTAMP WITH TIME ZONE,

  -- Um ciclo por beneficiário por mês
  CONSTRAINT uq_ciclo_beneficiario_mes UNIQUE (representante_id, vendedor_id, tipo_beneficiario, mes_referencia)
);

-- 2. Vincular comissões individuais ao ciclo (opcional: enviar NF individual OU no fechamento)
ALTER TABLE comissoes_laudo
  ADD COLUMN IF NOT EXISTS ciclo_id INTEGER REFERENCES ciclos_comissao(id);

-- 3. Índice para lookup rápido de ciclos
CREATE INDEX IF NOT EXISTS idx_ciclos_comissao_rep_mes
  ON ciclos_comissao (representante_id, mes_referencia);

CREATE INDEX IF NOT EXISTS idx_ciclos_comissao_vendedor_mes
  ON ciclos_comissao (vendedor_id, mes_referencia)
  WHERE vendedor_id IS NOT NULL;

-- 4. Comentários
COMMENT ON TABLE ciclos_comissao IS 'Fechamento mensal de comissões. Permite envio de NF/RPA consolidada por mês ou individual por comissão.';
COMMENT ON COLUMN comissoes_laudo.ciclo_id IS 'Ciclo de fechamento mensal ao qual esta comissão pertence. NULL = não consolidada ainda.';

COMMIT;
