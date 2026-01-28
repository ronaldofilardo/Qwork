-- ================================================================
-- MIGRAÇÃO 015: ESTENDER TABELA notificacoes (título, mensagem, clinica, destinatário)
-- ================================================================

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS clinica_id INTEGER,
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS mensagem TEXT,
ADD COLUMN IF NOT EXISTS data_evento TIMESTAMP,
ADD COLUMN IF NOT EXISTS destinatario_cpf VARCHAR(11);

-- Índices para consultas por clinica e tipo
CREATE INDEX IF NOT EXISTS idx_notificacoes_clinica_id ON notificacoes (clinica_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON notificacoes (destinatario_cpf);

COMMENT ON COLUMN notificacoes.titulo IS 'Título resumido da notificação';

COMMENT ON COLUMN notificacoes.mensagem IS 'Mensagem detalhada da notificação';

COMMENT ON COLUMN notificacoes.destinatario_cpf IS 'CPF do destinatário quando aplicável';

SELECT 'Migração 015 aplicada com sucesso!' as status;