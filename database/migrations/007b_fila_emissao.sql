-- ==========================================
-- MIGRATION 007b: Tabela de Fila de Emissão
-- Parte 2 da refatoração de status e fila de emissão
-- Data: 2025-01-03
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007b: Criando tabela de fila de emissão ==='

-- 2. Criando tabela de fila de emissão
CREATE TABLE IF NOT EXISTS fila_emissao (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  tentativas INT DEFAULT 0,
  max_tentativas INT DEFAULT 3,
  proxima_tentativa TIMESTAMP DEFAULT NOW(),
  erro TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para buscar itens pendentes na fila
CREATE INDEX IF NOT EXISTS idx_fila_pendente
ON fila_emissao(proxima_tentativa)
WHERE tentativas < max_tentativas;

-- Índice para buscar por lote
CREATE INDEX IF NOT EXISTS idx_fila_lote
ON fila_emissao(lote_id);

COMMENT ON TABLE fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';
COMMENT ON COLUMN fila_emissao.tentativas IS 'Número de tentativas de processamento';
COMMENT ON COLUMN fila_emissao.max_tentativas IS 'Máximo de tentativas antes de desistir';
COMMENT ON COLUMN fila_emissao.proxima_tentativa IS 'Timestamp da próxima tentativa (com backoff exponencial)';
COMMENT ON COLUMN fila_emissao.erro IS 'Mensagem do último erro ocorrido';

\echo '2. Tabela fila_emissao criada com sucesso'

-- 6. Criando funções auxiliares para fila
-- 6.1. Função para calcular hash de PDF
DROP FUNCTION IF EXISTS calcular_hash_pdf(bytea);
CREATE OR REPLACE FUNCTION calcular_hash_pdf(pdf_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_hash_pdf IS 'Calcula hash SHA-256 de um PDF para validação de integridade';

\echo '6.1. Função calcular_hash_pdf criada'

-- 6.2. Função para verificar se lote pode ser processado
DROP FUNCTION IF EXISTS lote_pode_ser_processado(integer);
CREATE OR REPLACE FUNCTION lote_pode_ser_processado(p_lote_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_status status_lote;
  v_tem_laudo BOOLEAN;
BEGIN
  -- Buscar status do lote
  SELECT status INTO v_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar se já tem laudo enviado
  SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = p_lote_id AND status = 'enviado')
  INTO v_tem_laudo;

  -- Pode processar se está concluído e não tem laudo
  RETURN v_status = 'concluido' AND NOT v_tem_laudo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION lote_pode_ser_processado IS 'Verifica se um lote está apto para emissão de laudo';

\echo '6.2. Função lote_pode_ser_processado criada'

COMMIT;

\echo '=== MIGRATION 007b: Concluída com sucesso ==='