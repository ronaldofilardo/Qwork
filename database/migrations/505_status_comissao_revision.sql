-- ============================================================================
-- Migration 505: Revisão do status de comissão
-- 
-- Mudanças:
--   1. Renomeia 'aprovada' → 'pendente_nf' no enum status_comissao
--   2. Adiciona 'nf_em_analise' ao enum status_comissao
--   3. Remove valor 'nf_rpa_pendente' do enum motivo_congelamento
--   4. Remove colunas auto_cancelamento_em e sla_admin_aviso_em
--   5. Remove índice idx_comissoes_auto_cancelamento
--   6. Remove função executar_corte_nf_manual()
--   7. Migra dados existentes
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Adicionar novos valores ao enum status_comissao
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TYPE status_comissao ADD VALUE IF NOT EXISTS 'pendente_nf';
ALTER TYPE status_comissao ADD VALUE IF NOT EXISTS 'nf_em_analise';

COMMIT;

-- Enum changes precisam ser commitadas antes de usar os novos valores
BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Migrar dados: 'aprovada' → 'pendente_nf'
--    Comissões que tinham status 'aprovada' agora são 'pendente_nf' 
--    (aguardando NF do representante)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE comissoes_laudo
SET status = 'pendente_nf',
    atualizado_em = NOW()
WHERE status = 'aprovada';

-- Comissões com NF já enviada (nf_rpa_enviada_em IS NOT NULL) mas não liberada
-- devem ir para 'nf_em_analise'
UPDATE comissoes_laudo
SET status = 'nf_em_analise',
    atualizado_em = NOW()
WHERE status = 'pendente_nf'
  AND nf_rpa_enviada_em IS NOT NULL
  AND nf_rpa_aprovada_em IS NULL
  AND nf_rpa_rejeitada_em IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Limpar motivo_congelamento = 'nf_rpa_pendente' 
--    (não existe mais esse motivo)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE comissoes_laudo
SET motivo_congelamento = NULL
WHERE motivo_congelamento = 'nf_rpa_pendente';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Limpar colunas que serão removidas
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE comissoes_laudo
SET auto_cancelamento_em = NULL,
    sla_admin_aviso_em = NULL
WHERE auto_cancelamento_em IS NOT NULL OR sla_admin_aviso_em IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Remover índice de auto_cancelamento
-- ─────────────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_comissoes_auto_cancelamento;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Remover colunas legado
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS auto_cancelamento_em;
ALTER TABLE comissoes_laudo DROP COLUMN IF EXISTS sla_admin_aviso_em;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Remover função legado executar_corte_nf_manual
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS executar_corte_nf_manual(DATE);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Registrar auditoria da migration
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO comissionamento_auditoria (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
VALUES ('comissoes_laudo', 0, 'aprovada', 'pendente_nf', 'sistema', 
        'Migration 505: Renomeação aprovada → pendente_nf + adição nf_em_analise. Remoção de auto_cancelamento_em, sla_admin_aviso_em.');

COMMIT;
