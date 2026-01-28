-- Migration 042: Adicionar campos BYTEA para armazenamento de PDF em recibos
-- Data: 2025-12-31
-- Descrição: Padronizar armazenamento de PDFs com BYTEA para integridade e verificabilidade
-- Objetivo: Salvar PDF binário, hash SHA-256, IP de emissão e caminho de backup

-- ============================================================================
-- ADICIONAR CAMPOS BYTEA E CONTROLE DE INTEGRIDADE
-- ============================================================================

-- Adicionar campo para armazenar PDF binário
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS pdf BYTEA;

-- Adicionar campo para hash SHA-256 do PDF (64 caracteres hexadecimais)
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS hash_pdf CHAR(64);

-- Adicionar campo para IP de emissão
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS ip_emissao INET;

-- Adicionar campo para CPF do emissor (14 caracteres: XXX.XXX.XXX-XX)
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS emitido_por VARCHAR(14);

-- Adicionar flag indicando se hash está incluso no PDF
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS hash_incluso BOOLEAN NOT NULL DEFAULT true;

-- Adicionar caminho de backup para cópia local do PDF
ALTER TABLE recibos ADD COLUMN IF NOT EXISTS backup_path VARCHAR(255);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para busca por hash (verificação de integridade)
CREATE INDEX IF NOT EXISTS idx_recibos_hash_pdf ON recibos (hash_pdf);

-- Índice para busca por data de emissão (já existe criado_em, usar esse)
CREATE INDEX IF NOT EXISTS idx_recibos_criado_em ON recibos (criado_em);

-- Índice para busca por emissor
CREATE INDEX IF NOT EXISTS idx_recibos_emitido_por ON recibos (emitido_por);

-- ============================================================================
-- FUNÇÃO PARA CALCULAR HASH SHA-256 DO PDF BYTEA
-- ============================================================================

-- Função para calcular hash SHA-256 de um BYTEA (PDF)
CREATE OR REPLACE FUNCTION calcular_hash_pdf(pdf_data BYTEA)
RETURNS CHAR(64)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Calcular SHA-256 do BYTEA e retornar como string hexadecimal
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$;

-- ============================================================================
-- FUNÇÃO PARA VERIFICAR INTEGRIDADE DO PDF
-- ============================================================================

-- Função para verificar se o hash armazenado corresponde ao PDF
CREATE OR REPLACE FUNCTION verificar_integridade_recibo(recibo_id INTEGER)
RETURNS TABLE(
  id INTEGER,
  hash_armazenado CHAR(64),
  hash_calculado CHAR(64),
  integro BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_pdf BYTEA;
  v_hash_armazenado CHAR(64);
  v_hash_calculado CHAR(64);
BEGIN
  -- Buscar PDF e hash armazenado
  SELECT r.pdf, r.hash_pdf
  INTO v_pdf, v_hash_armazenado
  FROM recibos r
  WHERE r.id = recibo_id;

  -- Se não encontrar, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calcular hash do PDF atual
  v_hash_calculado := calcular_hash_pdf(v_pdf);

  -- Retornar resultado da verificação
  RETURN QUERY SELECT
    recibo_id,
    v_hash_armazenado,
    v_hash_calculado,
    (v_hash_armazenado = v_hash_calculado) AS integro;
END;
$$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN recibos.pdf IS 'PDF binário do recibo (BYTEA)';
COMMENT ON COLUMN recibos.hash_pdf IS 'Hash SHA-256 do PDF binário em hexadecimal (64 caracteres)';
COMMENT ON COLUMN recibos.ip_emissao IS 'Endereço IP de onde o recibo foi emitido';
COMMENT ON COLUMN recibos.emitido_por IS 'CPF do usuário que emitiu o recibo (formato: XXX.XXX.XXX-XX)';
COMMENT ON COLUMN recibos.hash_incluso IS 'Indica se o hash foi incluído no rodapé do PDF';
COMMENT ON COLUMN recibos.backup_path IS 'Caminho relativo do arquivo PDF de backup no sistema de arquivos';

COMMENT ON FUNCTION calcular_hash_pdf(BYTEA) IS 'Calcula hash SHA-256 de um PDF em formato BYTEA';
COMMENT ON FUNCTION verificar_integridade_recibo(INTEGER) IS 'Verifica integridade do PDF comparando hash armazenado com hash recalculado';
