-- Migration 1221: beneficiários societários + trilha de auditoria financeira da Sociedade

CREATE TABLE IF NOT EXISTS public.beneficiarios_sociedade (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  nome_empresarial VARCHAR(200),
  documento_fiscal VARCHAR(30),
  asaas_wallet_id VARCHAR(100),
  percentual_participacao NUMERIC(5,2) NOT NULL DEFAULT 50,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.beneficiarios_sociedade IS
  'Beneficiários societários do QWork/Nexus para distribuição de resultados via split e auditoria.';

COMMENT ON COLUMN public.beneficiarios_sociedade.codigo IS
  'Código estável do beneficiário societário (ex.: ronaldo, antonio).';

CREATE TABLE IF NOT EXISTS public.auditoria_sociedade_pagamentos (
  id SERIAL PRIMARY KEY,
  pagamento_id INTEGER REFERENCES public.pagamentos(id) ON DELETE SET NULL,
  asaas_payment_id VARCHAR(80),
  tomador_id INTEGER,
  lote_id INTEGER,
  modo_operacao VARCHAR(20) NOT NULL DEFAULT 'simulacao',
  status VARCHAR(30) NOT NULL DEFAULT 'calculado',
  valor_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_impostos NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_representante NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_comercial NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_socio_ronaldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_socio_antonio NUMERIC(12,2) NOT NULL DEFAULT 0,
  detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beneficiarios_sociedade_codigo
  ON public.beneficiarios_sociedade(codigo);

CREATE INDEX IF NOT EXISTS idx_auditoria_sociedade_pagamentos_payment
  ON public.auditoria_sociedade_pagamentos(asaas_payment_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_sociedade_pagamentos_criado_em
  ON public.auditoria_sociedade_pagamentos(criado_em DESC);

INSERT INTO public.beneficiarios_sociedade (
  codigo, nome, nome_empresarial, percentual_participacao, ativo, observacoes
)
VALUES
  ('ronaldo', 'Ronaldo', 'Empresa Ronaldo', 50, TRUE, 'Beneficiário societário inicial'),
  ('antonio', 'Antonio', 'Empresa Antonio', 50, TRUE, 'Beneficiário societário inicial')
ON CONFLICT (codigo) DO NOTHING;
