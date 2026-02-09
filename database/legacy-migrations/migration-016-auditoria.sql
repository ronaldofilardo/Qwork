-- Migration 016: Sistema de Auditoria
-- Data: 2026-01-13
-- Descrição: Cria tabela de auditoria para rastrear ações críticas

-- ============================================================================
-- TABELA DE AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificação da entidade auditada
    entidade_tipo VARCHAR(50) NOT NULL, -- 'contratante', 'contrato', 'pagamento', 'recibo', etc.
    entidade_id INTEGER NOT NULL,
    
    -- Ação realizada
    acao VARCHAR(50) NOT NULL, -- 'criar', 'atualizar', 'deletar', 'aprovar', 'rejeitar', 'ativar', etc.
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    
    -- Usuário que executou
    usuario_cpf VARCHAR(11),
    usuario_perfil VARCHAR(50),
    
    -- Contexto técnico
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Dados da operação
    dados_alterados JSONB, -- Diff do que mudou
    metadados JSONB, -- Informações adicionais (ex: contrato_id, pagamento_id)
    
    -- Hash de integridade
    hash_operacao VARCHAR(64), -- SHA-256 dos dados críticos
    
    -- Timestamp
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    CONSTRAINT auditoria_entidade_tipo_check CHECK (
        entidade_tipo IN (
            'contratante', 'contrato', 'pagamento', 'recibo', 
            'plano', 'funcionario', 'usuario', 'login'
        )
    ),
    CONSTRAINT auditoria_acao_check CHECK (
        acao IN (
            'criar', 'atualizar', 'deletar', 'aprovar', 'rejeitar', 
            'ativar', 'desativar', 'aceitar_contrato', 'confirmar_pagamento',
            'gerar_recibo', 'liberar_login', 'bloquear_login', 'login_sucesso',
            'login_falha', 'logout'
        )
    )
);

-- Índices para performance
CREATE INDEX idx_auditoria_entidade ON auditoria (entidade_tipo, entidade_id);
CREATE INDEX idx_auditoria_acao ON auditoria (acao);
CREATE INDEX idx_auditoria_usuario ON auditoria (usuario_cpf);
CREATE INDEX idx_auditoria_criado_em ON auditoria (criado_em DESC);
CREATE INDEX idx_auditoria_entidade_criado ON auditoria (entidade_tipo, entidade_id, criado_em DESC);

-- Comentários
COMMENT ON TABLE auditoria IS 'Registro de auditoria para todas as ações críticas do sistema';
COMMENT ON COLUMN auditoria.hash_operacao IS 'Hash SHA-256 para verificar integridade dos dados auditados';
COMMENT ON COLUMN auditoria.dados_alterados IS 'JSON com diff das alterações realizadas';

-- ============================================================================
-- FUNÇÃO PARA GERAR HASH DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_hash_auditoria(
    p_entidade_tipo VARCHAR,
    p_entidade_id INTEGER,
    p_acao VARCHAR,
    p_dados JSONB,
    p_timestamp TIMESTAMP
) RETURNS VARCHAR AS $$
DECLARE
    v_string_concatenada TEXT;
BEGIN
    v_string_concatenada := CONCAT(
        p_entidade_tipo, '|',
        p_entidade_id, '|',
        p_acao, '|',
        COALESCE(p_dados::TEXT, ''), '|',
        p_timestamp::TEXT
    );
    
    RETURN encode(digest(v_string_concatenada, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER AUTOMÁTICO PARA AUDITORIA DE tomadores
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_contratante_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_acao VARCHAR(50);
    v_dados_alterados JSONB;
    v_metadados JSONB;
    v_hash VARCHAR(64);
BEGIN
    -- Determinar ação
    IF TG_OP = 'INSERT' THEN
        v_acao := 'criar';
        v_dados_alterados := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Detectar tipo específico de atualização
        IF OLD.status != NEW.status THEN
            CASE NEW.status
                WHEN 'aprovado' THEN v_acao := 'aprovar';
                WHEN 'rejeitado' THEN v_acao := 'rejeitar';
                ELSE v_acao := 'atualizar';
            END CASE;
        ELSIF OLD.ativa != NEW.ativa AND NEW.ativa = true THEN
            v_acao := 'ativar';
        ELSIF OLD.ativa != NEW.ativa AND NEW.ativa = false THEN
            v_acao := 'desativar';
        ELSIF OLD.pagamento_confirmado != NEW.pagamento_confirmado THEN
            v_acao := 'confirmar_pagamento';
        ELSE
            v_acao := 'atualizar';
        END IF;
        
        -- Criar diff das mudanças
        v_dados_alterados := jsonb_build_object(
            'antes', to_jsonb(OLD),
            'depois', to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_acao := 'deletar';
        v_dados_alterados := to_jsonb(OLD);
    END IF;
    
    -- Metadados adicionais
    v_metadados := jsonb_build_object(
        'tipo', COALESCE(NEW.tipo, OLD.tipo),
        'cnpj', COALESCE(NEW.cnpj, OLD.cnpj),
        'nome', COALESCE(NEW.nome, OLD.nome)
    );
    
    -- Gerar hash
    v_hash := gerar_hash_auditoria(
        'contratante',
        COALESCE(NEW.id, OLD.id),
        v_acao,
        v_dados_alterados,
        CURRENT_TIMESTAMP
    );
    
    -- Inserir na tabela de auditoria
    INSERT INTO auditoria (
        entidade_tipo,
        entidade_id,
        acao,
        status_anterior,
        status_novo,
        usuario_cpf,
        dados_alterados,
        metadados,
        hash_operacao
    ) VALUES (
        'contratante',
        COALESCE(NEW.id, OLD.id),
        v_acao,
        OLD.status::TEXT,
        NEW.status::TEXT,
        COALESCE(NEW.aprovado_por_cpf, OLD.aprovado_por_cpf),
        v_dados_alterados,
        v_metadados,
        v_hash
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
DROP TRIGGER IF EXISTS trg_audit_contratante_insert ON tomadores;
CREATE TRIGGER trg_audit_contratante_insert
    AFTER INSERT ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION audit_contratante_changes();

DROP TRIGGER IF EXISTS trg_audit_contratante_update ON tomadores;
CREATE TRIGGER trg_audit_contratante_update
    AFTER UPDATE ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION audit_contratante_changes();

DROP TRIGGER IF EXISTS trg_audit_contratante_delete ON tomadores;
CREATE TRIGGER trg_audit_contratante_delete
    AFTER DELETE ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION audit_contratante_changes();

-- ============================================================================
-- VIEWS PARA CONSULTAS COMUNS
-- ============================================================================

-- View de auditoria recente
CREATE OR REPLACE VIEW v_auditoria_recente AS
SELECT 
    a.id,
    a.entidade_tipo,
    a.entidade_id,
    a.acao,
    a.status_anterior,
    a.status_novo,
    a.usuario_cpf,
    a.criado_em,
    a.metadados->>'tipo' as tipo_entidade,
    a.metadados->>'nome' as nome_entidade
FROM auditoria a
WHERE a.criado_em >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY a.criado_em DESC;

-- View de auditoria de tomadores
CREATE OR REPLACE VIEW v_auditoria_tomadores AS
SELECT 
    a.id,
    a.entidade_id as contratante_id,
    a.acao,
    a.status_anterior,
    a.status_novo,
    a.usuario_cpf,
    a.criado_em,
    c.tipo,
    c.nome,
    c.cnpj
FROM auditoria a
LEFT JOIN tomadores c ON c.id = a.entidade_id
WHERE a.entidade_tipo = 'contratante'
ORDER BY a.criado_em DESC;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON FUNCTION gerar_hash_auditoria IS 
    'Gera hash SHA-256 para verificar integridade de registros de auditoria';

COMMENT ON FUNCTION audit_contratante_changes IS 
    'Trigger function para auditar automaticamente mudanças em tomadores';

COMMENT ON VIEW v_auditoria_recente IS 
    'View otimizada para consultar auditoria dos últimos 30 dias';
