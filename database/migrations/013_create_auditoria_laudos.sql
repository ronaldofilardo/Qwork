-- ================================================================
-- MIGRAÇÃO 013: CRIAÇÃO DA TABELA auditoria_laudos
-- ================================================================
-- Esta migration cria a tabela mínima necessária para registrar eventos
-- de auditoria relacionados à emissão e envio de laudos.

CREATE TABLE IF NOT EXISTS auditoria_laudos (
    id BIGSERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL,
    laudo_id INTEGER,
    emissor_cpf VARCHAR(11),
    emissor_nome VARCHAR(200),
    acao VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    ip_address INET,
    observacoes TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_lote ON auditoria_laudos (lote_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_criado ON auditoria_laudos (criado_em DESC);

COMMENT ON
TABLE auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';

COMMENT ON COLUMN auditoria_laudos.acao IS 'Ação executada (ex: emissao_automatica, envio_automatico, reprocessamento_manual, erro ...)';

COMMENT ON COLUMN auditoria_laudos.status IS 'Status associado ao evento (emitido, enviado, erro, pendente)';

SELECT 'Migração 013 aplicada com sucesso!' as status;