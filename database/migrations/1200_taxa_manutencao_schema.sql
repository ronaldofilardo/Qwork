-- Migration 1200: Schema para Taxa de Manutenção R$250
-- Data: 09/04/2026
-- Descrição: Adiciona suporte a cobrança de taxa de manutenção para entidades
--            e empresas de clínicas que não emitirem laudo em 90 dias.
--
-- Regras de negócio:
--   - Entidade: prazo começa na data_aceite do contrato (aceito_em)
--   - Empresa clínica: prazo começa na data de criação (criado_em)
--   - Valor fixo: R$250,00 por entidade / por empresa de clínica
--   - Uma cobrança por ciclo (manutencao_ja_cobrada impede duplicação)
--   - Crédito ao pagar: ficará para abater no 1º laudo emitido

-- ============================================================
-- 1. Adicionar colunas em 'entidades'
-- ============================================================
ALTER TABLE entidades
  ADD COLUMN IF NOT EXISTS limite_primeira_cobranca_manutencao TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manutencao_ja_cobrada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS credito_manutencao_pendente NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- ============================================================
-- 2. Adicionar colunas em 'clinicas'
-- ============================================================
ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS credito_manutencao_pendente NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- ============================================================
-- 3. Adicionar colunas em 'empresas_clientes'
-- ============================================================
ALTER TABLE empresas_clientes
  ADD COLUMN IF NOT EXISTS limite_primeira_cobranca_manutencao TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manutencao_ja_cobrada BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 4. Coluna tipo_cobranca em 'pagamentos'
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'tipo_cobranca'
  ) THEN
    ALTER TABLE pagamentos
      ADD COLUMN tipo_cobranca VARCHAR(20) NOT NULL DEFAULT 'laudo'
        CHECK (tipo_cobranca IN ('laudo', 'manutencao'));
  END IF;
END $$;

-- Adicionar coluna empresa_id em pagamentos para rastrear empresa da clínica
ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas_clientes(id) ON DELETE SET NULL;

-- ============================================================
-- 5. Tabela de auditoria de créditos de manutenção
-- ============================================================
CREATE TABLE IF NOT EXISTS creditos_manutencao (
  id                  SERIAL PRIMARY KEY,
  entidade_id         INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  clinica_id          INTEGER REFERENCES clinicas(id)  ON DELETE CASCADE,
  empresa_id          INTEGER REFERENCES empresas_clientes(id) ON DELETE SET NULL,
  pagamento_id        INTEGER REFERENCES pagamentos(id) ON DELETE SET NULL,
  valor               NUMERIC(10,2) NOT NULL DEFAULT 250.00,
  descricao           TEXT,
  criado_em           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Quando este crédito for consumido num laudo, marcar aqui
  consumido_em        TIMESTAMP WITH TIME ZONE,
  consumido_lote_id   INTEGER REFERENCES lotes_avaliacao(id) ON DELETE SET NULL,
  CONSTRAINT creditos_manutencao_tomador_check
    CHECK (
      (entidade_id IS NOT NULL AND clinica_id IS NULL)
      OR
      (clinica_id IS NOT NULL AND entidade_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_creditos_manutencao_entidade
  ON creditos_manutencao(entidade_id) WHERE entidade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creditos_manutencao_clinica
  ON creditos_manutencao(clinica_id) WHERE clinica_id IS NOT NULL;

-- ============================================================
-- 6. Preencher retrospectivamente datas limite para registros
--    existentes que já aceitaram contrato (entidades)
--    limite = data_aceite + 90 dias
-- ============================================================
UPDATE entidades e
SET limite_primeira_cobranca_manutencao = (
  SELECT c.data_aceite + INTERVAL '90 days'
  FROM contratos c
  WHERE c.tomador_id = e.id
    AND c.aceito = true
    AND c.data_aceite IS NOT NULL
  ORDER BY c.data_aceite ASC
  LIMIT 1
)
WHERE e.limite_primeira_cobranca_manutencao IS NULL
  AND EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.tomador_id = e.id AND c.aceito = true
  );

-- ============================================================
-- 7. Preencher retrospectivamente datas limite para empresas
--    existentes (limite = criado_em + 90 dias)
-- ============================================================
UPDATE empresas_clientes
SET limite_primeira_cobranca_manutencao = criado_em + INTERVAL '90 days'
WHERE limite_primeira_cobranca_manutencao IS NULL
  AND criado_em IS NOT NULL;

-- ============================================================
-- 8. Índices para performance das queries de cobrança
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entidades_limite_manutencao
  ON entidades(limite_primeira_cobranca_manutencao)
  WHERE limite_primeira_cobranca_manutencao IS NOT NULL
    AND manutencao_ja_cobrada = FALSE;

CREATE INDEX IF NOT EXISTS idx_empresas_limite_manutencao
  ON empresas_clientes(limite_primeira_cobranca_manutencao)
  WHERE limite_primeira_cobranca_manutencao IS NOT NULL
    AND manutencao_ja_cobrada = FALSE;

CREATE INDEX IF NOT EXISTS idx_pagamentos_tipo_cobranca
  ON pagamentos(tipo_cobranca);

-- ============================================================
-- 9. Comentários de documentação
-- ============================================================
COMMENT ON COLUMN entidades.limite_primeira_cobranca_manutencao
  IS 'Data limite para emissão do 1º laudo antes de cobrar taxa de manutenção (data_aceite + 90 dias).';

COMMENT ON COLUMN entidades.manutencao_ja_cobrada
  IS 'TRUE quando a taxa de manutenção de R$250 já foi gerada para esta entidade (evita duplicação).';

COMMENT ON COLUMN entidades.credito_manutencao_pendente
  IS 'Crédito acumulado de taxas de manutenção pagas, para abater no próximo laudo.';

COMMENT ON COLUMN clinicas.credito_manutencao_pendente
  IS 'Crédito acumulado de taxas de manutenção pagas por empresas desta clínica.';

COMMENT ON COLUMN empresas_clientes.limite_primeira_cobranca_manutencao
  IS 'Data limite para emissão do 1º laudo para esta empresa (criado_em + 90 dias).';

COMMENT ON COLUMN empresas_clientes.manutencao_ja_cobrada
  IS 'TRUE quando a taxa de manutenção de R$250 já foi gerada para esta empresa (evita duplicação).';

COMMENT ON COLUMN pagamentos.tipo_cobranca
  IS 'Tipo da cobrança: laudo (emissão) ou manutencao (taxa de manutenção R$250).';

COMMENT ON COLUMN pagamentos.empresa_id
  IS 'ID da empresa_cliente quando tipo_cobranca=manutencao para clínicas.';
