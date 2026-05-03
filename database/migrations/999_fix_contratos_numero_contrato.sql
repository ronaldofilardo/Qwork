-- Migration: Corrigir uso de numero_contrato na tabela contratos
-- Data: 2025-12-30
-- Descrição: Atualizar view que usa numero_contrato para usar id

-- Primeiro, garantir que a tabela notificacoes_admin tenha as colunas necessárias
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS titulo VARCHAR(200);
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS contratante_id INTEGER;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS contrato_id INTEGER;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS pagamento_id INTEGER;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS dados_contexto JSONB;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT false;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS resolvida BOOLEAN DEFAULT false;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS data_leitura TIMESTAMP;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS data_resolucao TIMESTAMP;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS resolvido_por_cpf VARCHAR(11);
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS observacoes_resolucao TEXT;
ALTER TABLE notificacoes_admin ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar foreign keys se não existirem
ALTER TABLE notificacoes_admin ADD CONSTRAINT fk_notificacoes_contratante
    FOREIGN KEY (contratante_id) REFERENCES contratantes (id) ON DELETE CASCADE;
ALTER TABLE notificacoes_admin ADD CONSTRAINT fk_notificacoes_contrato
    FOREIGN KEY (contrato_id) REFERENCES contratos (id) ON DELETE CASCADE;
ALTER TABLE notificacoes_admin ADD CONSTRAINT fk_notificacoes_pagamento
    FOREIGN KEY (pagamento_id) REFERENCES pagamentos (id) ON DELETE CASCADE;

-- Atualizar registros existentes: definir titulo como tipo se vazio
UPDATE notificacoes_admin SET titulo = tipo WHERE titulo IS NULL;

-- Tornar titulo NOT NULL
ALTER TABLE notificacoes_admin ALTER COLUMN titulo SET NOT NULL;

-- Recriar view vw_notificacoes_admin_pendentes usando id como numero_contrato
CREATE OR REPLACE VIEW vw_notificacoes_admin_pendentes AS
SELECT
    n.id,
    n.tipo,
    n.titulo,
    n.mensagem,
    c.nome AS contratante_nome,
    c.tipo AS contratante_tipo,
    c.email AS contratante_email,
    cont.id as numero_contrato,
    n.criado_em,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - n.criado_em)) AS dias_pendente,
    n.dados_contexto
FROM notificacoes_admin n
LEFT JOIN contratantes c ON n.contratante_id = c.id
LEFT JOIN contratos cont ON n.contrato_id = cont.id
WHERE n.resolvida = false
ORDER BY n.criado_em DESC;

COMMENT ON VIEW vw_notificacoes_admin_pendentes IS 'Notificações pendentes de resolução com dados contextuais';