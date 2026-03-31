-- =============================================================================
-- Migration 521: Status de dados bancários dos representantes
-- Adiciona rastreamento do ciclo de confirmação de dados bancários
-- =============================================================================

BEGIN;

-- Adicionar coluna de status dos dados bancários
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS dados_bancarios_status VARCHAR(20)
    NOT NULL DEFAULT 'nao_informado'
    CHECK (dados_bancarios_status IN (
      'nao_informado',
      'pendente_confirmacao',
      'confirmado',
      'rejeitado'
    ));

-- Timestamps de rastreamento
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS dados_bancarios_solicitado_em TIMESTAMPTZ;

ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS dados_bancarios_confirmado_em TIMESTAMPTZ;

-- Índice para filtros admin (ex.: listar quem ainda não confirmou)
CREATE INDEX IF NOT EXISTS idx_representantes_dados_bancarios_status
  ON representantes (dados_bancarios_status);

-- Retroativo: se o representante já tem dados bancários preenchidos
-- e está apto, marca como pendente_confirmacao para que confirme
UPDATE representantes
SET dados_bancarios_status = 'pendente_confirmacao'
WHERE status = 'apto'
  AND dados_bancarios_status = 'nao_informado'
  AND (
    banco_codigo IS NOT NULL
    OR pix_chave IS NOT NULL
  );

COMMIT;
