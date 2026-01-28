-- ==========================================
-- MIGRATION 011: Adicionar colunas para emissão automática de laudos
-- Descricao: Adiciona auto_emitir_em e auto_emitir_agendado na tabela lotes_avaliacao
-- Data: 2025-12-16
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR COLUNAS PARA EMISSÃO AUTOMÁTICA
-- ==========================================

ALTER TABLE lotes_avaliacao
ADD COLUMN IF NOT EXISTS auto_emitir_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_emitir_agendado BOOLEAN DEFAULT false;

-- ==========================================
-- 2. CRIAR TABELA notificacoes_admin
-- ==========================================

CREATE TABLE IF NOT EXISTS notificacoes_admin (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    lote_id INTEGER REFERENCES lotes_avaliacao (id) ON DELETE CASCADE,
    visualizada BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ÍNDICE PARA PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_lotes_auto_emitir_em ON lotes_avaliacao (auto_emitir_em);

CREATE INDEX IF NOT EXISTS idx_notificacoes_admin_tipo ON notificacoes_admin (tipo);

CREATE INDEX IF NOT EXISTS idx_notificacoes_admin_criado_em ON notificacoes_admin (criado_em);

-- ==========================================
-- 4. COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN lotes_avaliacao.auto_emitir_em IS 'Data/hora programada para emissão automática do laudo (4h após conclusão)';

COMMENT ON COLUMN lotes_avaliacao.auto_emitir_agendado IS 'Flag indicando se a emissão automática foi agendada';

COMMENT ON
TABLE notificacoes_admin IS 'Notificações críticas para administradores do sistema';

COMMIT;