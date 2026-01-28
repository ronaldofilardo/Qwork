-- ================================================================
-- MIGRAÇÃO 003: ESTRUTURA COMPLETA DE AUDITORIA
-- ================================================================
-- Adiciona campos extras em clínicas, cria tabela session_logs e views de auditoria

-- ================================================================
-- PARTE 1: ADICIONAR CAMPOS EM CLÍNICAS
-- ================================================================

-- Adicionar campos para dados mais completos nos laudos
ALTER TABLE clinicas
ADD COLUMN IF NOT EXISTS razao_social VARCHAR(200),
ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_clinicas_cnpj ON clinicas (cnpj);

CREATE INDEX IF NOT EXISTS idx_clinicas_ativa ON clinicas (ativa);

-- Comentários explicativos
COMMENT ON COLUMN clinicas.razao_social IS 'Razão social da clínica (diferente do nome fantasia)';

COMMENT ON COLUMN clinicas.inscricao_estadual IS 'Inscrição estadual da clínica';

COMMENT ON COLUMN clinicas.cidade IS 'Cidade onde a clínica está localizada';

COMMENT ON COLUMN clinicas.estado IS 'Sigla do estado (UF) onde a clínica está localizada';

-- ================================================================
-- PARTE 2: CRIAR TABELA DE LOGS DE SESSÃO
-- ================================================================

CREATE TABLE IF NOT EXISTS session_logs (
    id BIGSERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    clinica_id INTEGER,
    empresa_id INTEGER,
    login_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_timestamp TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    session_duration INTERVAL GENERATED ALWAYS AS (
        logout_timestamp - login_timestamp
    ) STORED,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance de consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_session_logs_cpf ON session_logs (cpf);

CREATE INDEX IF NOT EXISTS idx_session_logs_perfil ON session_logs (perfil);

CREATE INDEX IF NOT EXISTS idx_session_logs_clinica ON session_logs (clinica_id);

CREATE INDEX IF NOT EXISTS idx_session_logs_empresa ON session_logs (empresa_id);

CREATE INDEX IF NOT EXISTS idx_session_logs_login ON session_logs (login_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_session_logs_logout ON session_logs (logout_timestamp DESC);

-- Comentários explicativos
COMMENT ON
TABLE session_logs IS 'Registra todos os acessos (login/logout) de usuários do sistema para auditoria';

COMMENT ON COLUMN session_logs.cpf IS 'CPF do usuário que fez login';

COMMENT ON COLUMN session_logs.perfil IS 'Perfil do usuário no momento do login (funcionario, rh, emissor, admin)';

COMMENT ON COLUMN session_logs.clinica_id IS 'ID da clínica associada ao usuário (para RH e emissores)';

COMMENT ON COLUMN session_logs.empresa_id IS 'ID da empresa associada ao funcionário';

COMMENT ON COLUMN session_logs.session_duration IS 'Duração calculada da sessão (logout - login)';

-- ================================================================
-- PARTE 3: ADICIONAR CAMPOS DE RASTREAMENTO EM FUNCIONÁRIOS
-- ================================================================

-- Adicionar campos para auditoria de inclusão/inativação
ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS incluido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS inativado_em TIMESTAMP,
ADD COLUMN IF NOT EXISTS inativado_por VARCHAR(11);

-- Atualizar registros existentes
UPDATE funcionarios
SET
    incluido_em = criado_em
WHERE
    incluido_em IS NULL;

UPDATE funcionarios
SET
    inativado_em = atualizado_em
WHERE
    ativo = false
    AND inativado_em IS NULL;

-- Comentários explicativos
COMMENT ON COLUMN funcionarios.incluido_em IS 'Data e hora em que o funcionário foi incluído no sistema';

COMMENT ON COLUMN funcionarios.inativado_em IS 'Data e hora em que o funcionário foi inativado';

COMMENT ON COLUMN funcionarios.inativado_por IS 'CPF do usuário que inativou o funcionário';

-- ================================================================
-- PARTE 4: ADICIONAR HASH EM LAUDOS (SE NÃO EXISTIR)
-- ================================================================

ALTER TABLE laudos ADD COLUMN IF NOT EXISTS hash_pdf VARCHAR(64);

-- Índice para busca por hash
CREATE INDEX IF NOT EXISTS idx_laudos_hash ON laudos (hash_pdf);

COMMENT ON COLUMN laudos.hash_pdf IS 'Hash SHA-256 do arquivo PDF do laudo para verificação de integridade';

-- ================================================================
-- PARTE 5: CRIAR VIEW DE AUDITORIA DE AVALIAÇÕES
-- ================================================================

CREATE OR REPLACE VIEW vw_auditoria_avaliacoes AS
SELECT 
    a.id as avaliacao_id,
    a.funcionario_cpf as cpf,
    f.clinica_id,
    f.empresa_id,
    l.codigo as lote,
    l.status as lote_status,
    CASE WHEN l.status = 'ativo' THEN true ELSE false END as liberado,
    a.status as avaliacao_status,
    CASE WHEN a.status = 'concluida' THEN true ELSE false END as concluida,
    CASE WHEN a.status = 'inativada' THEN true ELSE false END as inativada,
    -- Contar interrupções via audit_logs
    (
        SELECT COUNT(*) 
        FROM audit_logs 
        WHERE resource = 'avaliacoes' 
        AND resource_id = a.id::TEXT 
        AND action = 'UPDATE'
        AND old_data->>'status' != new_data->>'status'
    ) as numero_interrupcoes,
    a.inicio as iniciada_em,
    a.envio as concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome
FROM avaliacoes a
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
LEFT JOIN clinicas c ON c.id = f.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = f.empresa_id
ORDER BY a.criado_em DESC;

COMMENT ON VIEW vw_auditoria_avaliacoes IS 'View agregada para auditoria de avaliações com todas as informações necessárias';

-- ================================================================
-- PARTE 6: CRIAR VIEW DE AUDITORIA DE LOTES
-- ================================================================

CREATE OR REPLACE VIEW vw_auditoria_lotes AS
SELECT 
    l.id as lote_id,
    l.codigo as numero_lote,
    l.clinica_id,
    l.empresa_id,
    l.status,
    l.tipo,
    l.titulo,
    l.liberado_por as liberado_por_cpf,
    f.nome as liberado_por_nome,
    l.liberado_em,
    l.criado_em,
    l.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Contar avaliações do lote
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id) as total_avaliacoes,
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id AND status = 'concluida') as avaliacoes_concluidas,
    -- Contar mudanças de status via audit_logs
    (
        SELECT COUNT(*) 
        FROM audit_logs 
        WHERE resource = 'lotes_avaliacao' 
        AND resource_id = l.id::TEXT 
        AND action = 'UPDATE'
        AND old_data->>'status' != new_data->>'status'
    ) as mudancas_status
FROM lotes_avaliacao l
LEFT JOIN funcionarios f ON f.cpf = l.liberado_por
LEFT JOIN clinicas c ON c.id = l.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY l.criado_em DESC;

COMMENT ON VIEW vw_auditoria_lotes IS 'View agregada para auditoria de lotes com estatísticas e histórico';

-- ================================================================
-- PARTE 7: CRIAR VIEW DE AUDITORIA DE LAUDOS
-- ================================================================

CREATE OR REPLACE VIEW vw_auditoria_laudos AS
SELECT
    ld.id as laudo_id,
    ld.emissor_cpf,
    f.nome as emissor_nome,
    l.clinica_id,
    l.empresa_id,
    l.id as lote_id,
    l.codigo as numero_lote,
    ld.status,
    ld.hash_pdf,
    ld.criado_em,
    ld.emitido_em,
    ld.enviado_em,
    ld.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Verificar se tem PDF
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN true
        ELSE false
    END as tem_arquivo_pdf,
    -- Tamanho do PDF em KB
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN pg_column_size (ld.arquivo_pdf) / 1024
        ELSE 0
    END as tamanho_pdf_kb
FROM
    laudos ld
    LEFT JOIN funcionarios f ON f.cpf = ld.emissor_cpf
    LEFT JOIN lotes_avaliacao l ON l.id = ld.lote_id
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY ld.criado_em DESC;

COMMENT ON VIEW vw_auditoria_laudos IS 'View agregada para auditoria de laudos com informações de emissão e hash';

-- ================================================================
-- PARTE 8: CRIAR VIEW DE AUDITORIA DE ACESSOS RH
-- ================================================================

CREATE OR REPLACE VIEW vw_auditoria_acessos_rh AS
SELECT
    sl.id,
    sl.cpf,
    f.nome,
    sl.clinica_id,
    c.nome as clinica_nome,
    sl.login_timestamp,
    sl.logout_timestamp,
    sl.session_duration,
    sl.ip_address,
    sl.user_agent
FROM
    session_logs sl
    LEFT JOIN funcionarios f ON f.cpf = sl.cpf
    LEFT JOIN clinicas c ON c.id = sl.clinica_id
WHERE
    sl.perfil = 'rh'
ORDER BY sl.login_timestamp DESC;

COMMENT ON VIEW vw_auditoria_acessos_rh IS 'View para auditoria de acessos de gestores RH';

-- ================================================================
-- PARTE 9: CRIAR VIEW DE AUDITORIA DE ACESSOS FUNCIONÁRIOS
-- ================================================================

CREATE OR REPLACE VIEW vw_auditoria_acessos_funcionarios AS
SELECT
    sl.id,
    sl.cpf as cpf_anonimizado,
    sl.clinica_id,
    c.nome as clinica_nome,
    sl.empresa_id,
    ec.nome as empresa_nome,
    f.incluido_em as inclusao,
    f.inativado_em as inativacao,
    sl.login_timestamp,
    sl.logout_timestamp,
    sl.session_duration,
    sl.ip_address
FROM
    session_logs sl
    LEFT JOIN funcionarios f ON f.cpf = sl.cpf
    LEFT JOIN clinicas c ON c.id = sl.clinica_id
    LEFT JOIN empresas_clientes ec ON ec.id = sl.empresa_id
WHERE
    sl.perfil = 'funcionario'
ORDER BY sl.login_timestamp DESC;

COMMENT ON VIEW vw_auditoria_acessos_funcionarios IS 'View para auditoria de acessos de funcionários com CPF anonimizado';

-- ================================================================
-- PARTE 10: CRIAR TRIGGER PARA REGISTRAR INATIVAÇÃO DE FUNCIONÁRIOS
-- ================================================================

CREATE OR REPLACE FUNCTION registrar_inativacao_funcionario()
RETURNS TRIGGER AS $$
DECLARE
    current_user_cpf_val TEXT;
BEGIN
    -- Se mudou de ativo para inativo
    IF OLD.ativo = true AND NEW.ativo = false THEN
        -- Obter CPF do usuário atual da sessão
        current_user_cpf_val := NULLIF(current_setting('app.current_user_cpf', TRUE), '');
        
        NEW.inativado_em := CURRENT_TIMESTAMP;
        NEW.inativado_por := current_user_cpf_val;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrar_inativacao ON funcionarios;

CREATE TRIGGER trigger_registrar_inativacao
    BEFORE UPDATE ON funcionarios
    FOR EACH ROW
    WHEN (OLD.ativo IS DISTINCT FROM NEW.ativo)
    EXECUTE FUNCTION registrar_inativacao_funcionario();

COMMENT ON FUNCTION registrar_inativacao_funcionario () IS 'Registra automaticamente data e responsável pela inativação de funcionários';

-- ================================================================
-- FIM DA MIGRAÇÃO
-- ================================================================

-- Verificação final
SELECT 'Migração 003 aplicada com sucesso!' as status;