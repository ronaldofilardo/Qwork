-- Qwork - Tabela de Logs de Exclusão de Clínicas/Entidades
-- Registra todas as tentativas de exclusão (sucesso e falha)

CREATE TABLE IF NOT EXISTS logs_exclusao_clinicas (
    id SERIAL PRIMARY KEY,
    
    -- Dados da entidade excluída
    clinica_id INTEGER,
    clinica_nome VARCHAR(100),
    clinica_cnpj CHAR(14),
    tipo_entidade VARCHAR(20) CHECK (tipo_entidade IN ('clinica', 'entidade')),
    
    -- Dados do admin que executou
    admin_cpf CHAR(11) NOT NULL,
    admin_nome VARCHAR(100) NOT NULL,
    
    -- Status da operação
    status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'falha', 'negado')),
    motivo_falha TEXT, -- Senha incorreta, falta de permissão, etc
    
    -- Informações sobre o que foi excluído
    total_gestores INTEGER DEFAULT 0,
    total_empresas INTEGER DEFAULT 0,
    total_funcionarios INTEGER DEFAULT 0,
    total_avaliacoes INTEGER DEFAULT 0,
    
    -- Metadados
    ip_origem VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_exclusao_clinica_id ON logs_exclusao_clinicas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_logs_exclusao_admin_cpf ON logs_exclusao_clinicas(admin_cpf);
CREATE INDEX IF NOT EXISTS idx_logs_exclusao_status ON logs_exclusao_clinicas(status);
CREATE INDEX IF NOT EXISTS idx_logs_exclusao_criado_em ON logs_exclusao_clinicas(criado_em DESC);

-- Comentários
COMMENT ON TABLE logs_exclusao_clinicas IS 'Registra tentativas de exclusão de clínicas e entidades para auditoria';
COMMENT ON COLUMN logs_exclusao_clinicas.status IS 'sucesso: excluído com sucesso | falha: erro técnico | negado: senha incorreta';
COMMENT ON COLUMN logs_exclusao_clinicas.motivo_falha IS 'Detalhe do erro quando status != sucesso';

-- Função para registrar log de exclusão
CREATE OR REPLACE FUNCTION registrar_log_exclusao_clinica(
    p_clinica_id INTEGER,
    p_clinica_nome VARCHAR,
    p_clinica_cnpj CHAR,
    p_tipo_entidade VARCHAR,
    p_admin_cpf CHAR,
    p_admin_nome VARCHAR,
    p_status VARCHAR,
    p_motivo_falha TEXT DEFAULT NULL,
    p_total_gestores INTEGER DEFAULT 0,
    p_total_empresas INTEGER DEFAULT 0,
    p_total_funcionarios INTEGER DEFAULT 0,
    p_total_avaliacoes INTEGER DEFAULT 0,
    p_ip_origem VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_log_id INTEGER;
BEGIN
    INSERT INTO logs_exclusao_clinicas (
        clinica_id,
        clinica_nome,
        clinica_cnpj,
        tipo_entidade,
        admin_cpf,
        admin_nome,
        status,
        motivo_falha,
        total_gestores,
        total_empresas,
        total_funcionarios,
        total_avaliacoes,
        ip_origem,
        user_agent
    ) VALUES (
        p_clinica_id,
        p_clinica_nome,
        p_clinica_cnpj,
        p_tipo_entidade,
        p_admin_cpf,
        p_admin_nome,
        p_status,
        p_motivo_falha,
        p_total_gestores,
        p_total_empresas,
        p_total_funcionarios,
        p_total_avaliacoes,
        p_ip_origem,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- View para consultas rápidas de auditoria
CREATE OR REPLACE VIEW vw_auditoria_exclusoes AS
SELECT 
    l.id,
    l.clinica_id,
    l.clinica_nome,
    l.tipo_entidade,
    l.admin_cpf,
    l.admin_nome,
    l.status,
    l.motivo_falha,
    l.total_gestores + l.total_empresas + l.total_funcionarios + l.total_avaliacoes as total_registros_afetados,
    l.criado_em,
    TO_CHAR(l.criado_em, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM logs_exclusao_clinicas l
ORDER BY l.criado_em DESC;

COMMENT ON VIEW vw_auditoria_exclusoes IS 'View simplificada para consultas de auditoria de exclusões';
