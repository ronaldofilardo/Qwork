-- Migration: Sistema de Notificações para Admin
-- Data: 2025-12-25
-- Descrição: Tabela para notificar admin sobre eventos críticos (falhas de pagamento, etc)

-- ============================================================================
-- TABELA NOTIFICACOES_ADMIN
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificacoes_admin (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'falha_pagamento', 'cadastro_pendente', 'contrato_expirado', etc
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    
    -- Relacionamentos opcionais
    contratante_id INTEGER,
    contrato_id INTEGER,
    pagamento_id INTEGER,
    
    -- Dados de contexto (JSON)
    dados_contexto JSONB,
    
    -- Controle
    lida BOOLEAN DEFAULT false,
    resolvida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP,
    data_resolucao TIMESTAMP,
    resolvido_por_cpf VARCHAR(11),
    observacoes_resolucao TEXT,
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_notificacoes_contratante 
        FOREIGN KEY (contratante_id) REFERENCES tomadores (id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacoes_contrato 
        FOREIGN KEY (contrato_id) REFERENCES contratos (id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacoes_pagamento 
        FOREIGN KEY (pagamento_id) REFERENCES pagamentos (id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_notificacoes_admin_tipo ON notificacoes_admin (tipo);
CREATE INDEX idx_notificacoes_admin_lida ON notificacoes_admin (lida);
CREATE INDEX idx_notificacoes_admin_resolvida ON notificacoes_admin (resolvida);
CREATE INDEX idx_notificacoes_admin_contratante ON notificacoes_admin (contratante_id);
CREATE INDEX idx_notificacoes_admin_criado ON notificacoes_admin (criado_em DESC);

-- Comentários
COMMENT ON TABLE notificacoes_admin IS 'Notificações para administradores sobre eventos críticos do sistema';
COMMENT ON COLUMN notificacoes_admin.tipo IS 'Tipo de notificação para categorização e filtros';
COMMENT ON COLUMN notificacoes_admin.dados_contexto IS 'JSON com dados adicionais relevantes para a notificação';

-- ============================================================================
-- TRIGGER: ATUALIZAR DATA DE MODIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION atualizar_notificacao_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificacoes_admin_updated
BEFORE UPDATE ON notificacoes_admin
FOR EACH ROW
EXECUTE FUNCTION atualizar_notificacao_admin_timestamp();

-- ============================================================================
-- VIEW: NOTIFICAÇÕES NÃO RESOLVIDAS
-- ============================================================================

CREATE OR REPLACE VIEW vw_notificacoes_admin_pendentes AS
SELECT 
    n.id,
    n.tipo,
    n.titulo,
    n.mensagem,
    c.nome AS contratante_nome,
    c.tipo AS contratante_tipo,
    c.email AS contratante_email,
    cont.numero_contrato,
    n.criado_em,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - n.criado_em)) AS dias_pendente,
    n.dados_contexto
FROM notificacoes_admin n
LEFT JOIN tomadores c ON n.contratante_id = c.id
LEFT JOIN contratos cont ON n.contrato_id = cont.id
WHERE n.resolvida = false 
  AND n.tipo != 'parcela_pendente'
ORDER BY n.criado_em DESC;

COMMENT ON VIEW vw_notificacoes_admin_pendentes IS 'Notificações pendentes de resolução com dados contextuais';

-- ============================================================================
-- FUNÇÃO: CRIAR LINK DE RETOMADA DE PAGAMENTO
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_token_retomada_pagamento(
    p_contratante_id INTEGER,
    p_contrato_id INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_expiracao TIMESTAMP;
BEGIN
    -- Gerar token único (hash baseado em timestamp + IDs)
    v_token := md5(
        p_contratante_id::TEXT || 
        p_contrato_id::TEXT || 
        extract(epoch from now())::TEXT ||
        random()::TEXT
    );
    
    -- Expiração: 72 horas (3 dias)
    v_expiracao := CURRENT_TIMESTAMP + INTERVAL '72 hours';
    
    -- Criar ou atualizar registro na tabela de tokens
    INSERT INTO tokens_retomada_pagamento (
        token,
        contratante_id,
        contrato_id,
        expira_em,
        usado
    ) VALUES (
        v_token,
        p_contratante_id,
        p_contrato_id,
        v_expiracao,
        false
    );
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_token_retomada_pagamento IS 'Gera token único para permitir retomada de pagamento via link';

-- ============================================================================
-- TABELA: TOKENS DE RETOMADA DE PAGAMENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS tokens_retomada_pagamento (
    id SERIAL PRIMARY KEY,
    token VARCHAR(32) UNIQUE NOT NULL,
    contratante_id INTEGER NOT NULL,
    contrato_id INTEGER NOT NULL,
    usado BOOLEAN DEFAULT false,
    usado_em TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tokens_contratante 
        FOREIGN KEY (contratante_id) REFERENCES tomadores (id) ON DELETE CASCADE,
    CONSTRAINT fk_tokens_contrato 
        FOREIGN KEY (contrato_id) REFERENCES contratos (id) ON DELETE CASCADE,
    CONSTRAINT chk_token_expiracao 
        CHECK (expira_em > criado_em)
);

-- Índices
CREATE INDEX idx_tokens_retomada_token ON tokens_retomada_pagamento (token);
CREATE INDEX idx_tokens_retomada_contratante ON tokens_retomada_pagamento (contratante_id);
CREATE INDEX idx_tokens_retomada_usado ON tokens_retomada_pagamento (usado);
CREATE INDEX idx_tokens_retomada_expiracao ON tokens_retomada_pagamento (expira_em);

-- Comentários
COMMENT ON TABLE tokens_retomada_pagamento IS 'Tokens de uso único para retomada de processo de pagamento';
COMMENT ON COLUMN tokens_retomada_pagamento.token IS 'Hash MD5 único para identificar a sessão de retomada';
COMMENT ON COLUMN tokens_retomada_pagamento.expira_em IS 'Data/hora de expiração do token (72 horas por padrão)';

-- ============================================================================
-- TABELA: LOGS DE AÇÕES ADMINISTRATIVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS logs_admin (
    id SERIAL PRIMARY KEY,
    admin_cpf VARCHAR(11) NOT NULL,
    acao VARCHAR(100) NOT NULL, -- 'gerar_link_retomada', 'aprovar_cadastro', 'rejeitar_cadastro', etc
    entidade_tipo VARCHAR(50), -- 'contratante', 'funcionario', 'empresa', etc
    entidade_id INTEGER,
    detalhes JSONB, -- Dados adicionais da ação
    ip_origem VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_logs_admin_cpf ON logs_admin (admin_cpf);
CREATE INDEX idx_logs_admin_acao ON logs_admin (acao);
CREATE INDEX idx_logs_admin_entidade ON logs_admin (entidade_tipo, entidade_id);
CREATE INDEX idx_logs_admin_criado ON logs_admin (criado_em DESC);

-- Comentários
COMMENT ON TABLE logs_admin IS 'Auditoria de ações administrativas no sistema';
COMMENT ON COLUMN logs_admin.acao IS 'Tipo de ação executada pelo administrador';
COMMENT ON COLUMN logs_admin.detalhes IS 'JSON com informações detalhadas da ação';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
