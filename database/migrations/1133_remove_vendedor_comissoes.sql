-- Migration 1133: Remove Comissionamento de Vendedor
-- Data: 2026-04-12
-- Objetivo: Remover completamente a funcionalidade de comissionamento de vendedor.
--   1. Deletar dados históricos (comissoes_laudo, ciclos_comissao tipo vendedor)
--   2. Remover colunas de comissão de vendedor das tabelas afetadas
--   3. Remover RLS policies específicas de vendedor
--   4. Recriar índice único sem tipo_beneficiario

BEGIN;

-- ====================================================================
-- 1. REMOVER DADOS HISTÓRICOS DE VENDEDOR
-- ====================================================================

-- 1a. Deletar entradas de auditoria de ciclos de vendedor
DELETE FROM comissionamento_auditoria
WHERE tabela = 'ciclos_comissao'
  AND registro_id IN (
    SELECT id FROM ciclos_comissao WHERE tipo_beneficiario = 'vendedor'
  );

-- 1b. Deletar auditoria de comissoes_laudo de vendedor
DELETE FROM comissionamento_auditoria
WHERE tabela = 'comissoes_laudo'
  AND registro_id IN (
    SELECT id FROM comissoes_laudo WHERE tipo_beneficiario = 'vendedor'
  );

-- 1c. Deletar ciclos de vendedor
DELETE FROM ciclos_comissao WHERE tipo_beneficiario = 'vendedor';

-- 1d. Deletar comissões de vendedor
DELETE FROM comissoes_laudo WHERE tipo_beneficiario = 'vendedor';

-- ====================================================================
-- 2. REMOVER COLUNAS DE COMISSÃO DE VENDEDOR
-- ====================================================================

-- 2a. comissoes_laudo: remover tipo_beneficiario e vendedor_id
-- Primeiro remover o índice que usa tipo_beneficiario
DROP INDEX IF EXISTS idx_comissoes_laudo_lote_parcela_beneficiario;

-- Recriar índice único sem tipo_beneficiario (1 comissão por lote+parcela)
CREATE UNIQUE INDEX IF NOT EXISTS idx_comissoes_laudo_lote_parcela
  ON comissoes_laudo (lote_pagamento_id, parcela_numero)
  WHERE lote_pagamento_id IS NOT NULL;

-- Remover coluna vendedor_id de comissoes_laudo
ALTER TABLE comissoes_laudo
  DROP COLUMN IF EXISTS vendedor_id;

-- Remover coluna tipo_beneficiario de comissoes_laudo
ALTER TABLE comissoes_laudo
  DROP COLUMN IF EXISTS tipo_beneficiario;

-- 2b. vinculos_comissao: remover percentual_comissao_vendedor e suas constraints
ALTER TABLE vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_comissao_total_max;
ALTER TABLE vinculos_comissao
  DROP CONSTRAINT IF EXISTS chk_vinculos_perc_vend_range;
ALTER TABLE vinculos_comissao
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

-- 2c. leads_representante: remover percentual_comissao_vendedor e suas constraints
ALTER TABLE leads_representante
  DROP CONSTRAINT IF EXISTS chk_leads_comissao_total_max;
ALTER TABLE leads_representante
  DROP CONSTRAINT IF EXISTS chk_leads_perc_vend_range;
ALTER TABLE leads_representante
  DROP COLUMN IF EXISTS percentual_comissao_vendedor;

-- 2d. ciclos_comissao: remover tipo_beneficiario e vendedor_id
-- Garantir que não há mais dados de vendedor antes de dropar
ALTER TABLE ciclos_comissao
  DROP COLUMN IF EXISTS vendedor_id;
ALTER TABLE ciclos_comissao
  DROP COLUMN IF EXISTS tipo_beneficiario;

-- ====================================================================
-- 3. REMOVER RLS POLICIES DE VENDEDOR (criadas em migration 1132)
-- ====================================================================

DROP POLICY IF EXISTS vendedor_comissoes_laudo_own ON public.comissoes_laudo;
DROP POLICY IF EXISTS vendedor_vinculos_comissao_own ON public.vinculos_comissao;

-- ====================================================================
-- 4. COMENTÁRIOS DE ATUALIZAÇÃO
-- ====================================================================

COMMENT ON COLUMN leads_representante.percentual_comissao IS 'Percentual de comissão do representante para este lead (0-40%). Alias de percentual_comissao_representante.';
COMMENT ON COLUMN vinculos_comissao.percentual_comissao_representante IS 'Percentual de comissão do representante neste vínculo (propagado do lead).';
COMMENT ON COLUMN comissoes_laudo.percentual_comissao IS 'Percentual de comissão aplicado (apenas representante).';

COMMIT;
