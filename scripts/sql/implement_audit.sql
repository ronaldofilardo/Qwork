-- Script para implementar auditoria automática
-- Corrige a estrutura da tabela audit_logs e adiciona triggers

-- Primeiro, vamos recriar a tabela audit_logs com a estrutura correta
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_cpf VARCHAR(11),
    user_perfil VARCHAR(20),
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    resource VARCHAR(100) NOT NULL, -- Nome da tabela
    resource_id TEXT, -- ID do registro afetado
    old_data JSONB, -- Dados anteriores (UPDATE/DELETE)
    new_data JSONB, -- Dados novos (INSERT/UPDATE)
    ip_address INET,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_audit_logs_user_cpf ON audit_logs (user_cpf);

CREATE INDEX idx_audit_logs_action ON audit_logs (action);

CREATE INDEX idx_audit_logs_resource ON audit_logs (resource);

CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_cpf_val TEXT;
    current_user_perfil_val TEXT;
    record_id TEXT;
BEGIN
    -- Obter valores do contexto da sessão
    current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
    current_user_perfil_val := NULLIF(current_setting('app.current_user_perfil', TRUE), '');

    -- Determinar o ID do registro baseado na operação
    IF TG_OP = 'DELETE' THEN
        -- Para DELETE, usar o ID da linha OLD
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := OLD.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := OLD.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := OLD.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := OLD.id::TEXT;
            WHEN 'laudos' THEN record_id := OLD.id::TEXT;
            WHEN 'respostas' THEN record_id := OLD.id::TEXT;
            WHEN 'resultados' THEN record_id := OLD.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    ELSE
        -- Para INSERT/UPDATE, usar o ID da linha NEW
        CASE TG_TABLE_NAME
            WHEN 'funcionarios' THEN record_id := NEW.cpf::TEXT;
            WHEN 'avaliacoes' THEN record_id := NEW.id::TEXT;
            WHEN 'empresas_clientes' THEN record_id := NEW.id::TEXT;
            WHEN 'lotes_avaliacao' THEN record_id := NEW.id::TEXT;
            WHEN 'laudos' THEN record_id := NEW.id::TEXT;
            WHEN 'respostas' THEN record_id := NEW.id::TEXT;
            WHEN 'resultados' THEN record_id := NEW.id::TEXT;
            ELSE record_id := 'unknown';
        END CASE;
    END IF;

    -- Registrar a operação
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'INSERT', TG_TABLE_NAME, record_id, row_to_json(NEW));

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data, new_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'UPDATE', TG_TABLE_NAME, record_id, row_to_json(OLD), row_to_json(NEW));

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, old_data)
        VALUES (current_user_cpf_val, current_user_perfil_val, 'DELETE', TG_TABLE_NAME, record_id, row_to_json(OLD));
    END IF;

    -- Retornar a linha apropriada
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para todas as tabelas auditadas
CREATE TRIGGER audit_funcionarios_trigger
    AFTER INSERT OR UPDATE OR DELETE ON funcionarios
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_avaliacoes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_empresas_clientes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON empresas_clientes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_lotes_avaliacao_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lotes_avaliacao
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_laudos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON laudos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_respostas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON respostas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_resultados_trigger
    AFTER INSERT OR UPDATE OR DELETE ON resultados
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();