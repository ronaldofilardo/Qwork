-- Migration 001: Reestruturação para suportar Clínicas e Entidades Unificadas
-- Data: 2025-12-18
-- Descrição: Cria tabela tomadores unificada e relacionamento polimórfico

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Tipo de contratante
CREATE TYPE tipo_contratante_enum AS ENUM ('clinica', 'entidade');

-- Status de aprovação para tomadores
CREATE TYPE status_aprovacao_enum AS ENUM ('pendente', 'aprovado', 'rejeitado', 'em_reanalise');

-- ============================================================================
-- TABELA tomadores (Unificada para Clínicas e Entidades)
-- ============================================================================

CREATE TABLE tomadores (
    id SERIAL PRIMARY KEY,
    tipo tipo_contratante_enum NOT NULL,

-- Dados básicos (comuns a ambos)
nome VARCHAR(200) NOT NULL,
cnpj VARCHAR(18) NOT NULL,
inscricao_estadual VARCHAR(50),
email VARCHAR(100) NOT NULL,
telefone VARCHAR(20) NOT NULL,
endereco TEXT NOT NULL,
cidade VARCHAR(100) NOT NULL,
estado VARCHAR(2) NOT NULL,
cep VARCHAR(10) NOT NULL,

-- Dados do responsável/gestor (unificados)
responsavel_nome VARCHAR(100) NOT NULL,
responsavel_cpf VARCHAR(11) NOT NULL,
responsavel_cargo VARCHAR(100),
responsavel_email VARCHAR(100) NOT NULL,
responsavel_celular VARCHAR(20) NOT NULL,

-- Anexos/Documentos (caminhos para arquivos)
cartao_cnpj_path VARCHAR(500),
contrato_social_path VARCHAR(500),
doc_identificacao_path VARCHAR(500),

-- Controle
status status_aprovacao_enum DEFAULT 'pendente',
motivo_rejeicao TEXT,
observacoes_reanalise TEXT,
ativa BOOLEAN DEFAULT true,

-- Timestamps
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
aprovado_em TIMESTAMP,
aprovado_por_cpf VARCHAR(11),

-- Constraints
CONSTRAINT tomadores_cnpj_unique UNIQUE (cnpj),
    CONSTRAINT tomadores_email_unique UNIQUE (email),
    CONSTRAINT tomadores_responsavel_cpf_check CHECK (LENGTH(responsavel_cpf) = 11),
    CONSTRAINT tomadores_estado_check CHECK (LENGTH(estado) = 2)
);

-- Índices para performance
CREATE INDEX idx_tomadores_tipo ON tomadores (tipo);

CREATE INDEX idx_tomadores_status ON tomadores (status);

CREATE INDEX idx_tomadores_cnpj ON tomadores (cnpj);

CREATE INDEX idx_tomadores_ativa ON tomadores (ativa);

CREATE INDEX idx_tomadores_tipo_ativa ON tomadores (tipo, ativa);

-- Comentários
COMMENT ON
TABLE tomadores IS 'Tabela unificada para clínicas e entidades privadas';

COMMENT ON COLUMN tomadores.tipo IS 'clinica: medicina ocupacional com empresas intermediárias | entidade: empresa privada com vínculo direto';

COMMENT ON COLUMN tomadores.status IS 'Status de aprovação para novos cadastros';

COMMENT ON COLUMN tomadores.responsavel_nome IS 'Para clínicas: gestor RH | Para entidades: responsável pelo cadastro';

-- ============================================================================
-- TABELA tomadores_FUNCIONARIOS (Relacionamento Polimórfico)
-- ============================================================================

CREATE TABLE tomadores_funcionarios (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL,
    contratante_id INTEGER NOT NULL,
    tipo_contratante tipo_contratante_enum NOT NULL,

-- Metadados do vínculo
vinculo_ativo BOOLEAN DEFAULT true,
data_inicio DATE DEFAULT CURRENT_DATE,
data_fim DATE,

-- Timestamps
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Foreign Keys
CONSTRAINT fk_tomadores_funcionarios_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios (id) ON DELETE CASCADE,
CONSTRAINT fk_tomadores_funcionarios_contratante FOREIGN KEY (contratante_id) REFERENCES tomadores (id) ON DELETE CASCADE,

-- Constraints
CONSTRAINT tomadores_funcionarios_unique 
        UNIQUE (funcionario_id, contratante_id),
    CONSTRAINT tomadores_funcionarios_datas_check 
        CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Índices para performance
CREATE INDEX idx_tomadores_funcionarios_funcionario ON tomadores_funcionarios (funcionario_id);

CREATE INDEX idx_tomadores_funcionarios_contratante ON tomadores_funcionarios (contratante_id);

CREATE INDEX idx_tomadores_funcionarios_tipo ON tomadores_funcionarios (tipo_contratante);

CREATE INDEX idx_tomadores_funcionarios_ativo ON tomadores_funcionarios (vinculo_ativo);

CREATE INDEX idx_tomadores_funcionarios_composite ON tomadores_funcionarios (
    contratante_id,
    tipo_contratante,
    vinculo_ativo
);

-- Comentários
COMMENT ON
TABLE tomadores_funcionarios IS 'Relacionamento polimórfico entre funcionários e tomadores (clínicas/entidades)';

COMMENT ON COLUMN tomadores_funcionarios.tipo_contratante IS 'Redundante mas facilita queries sem join adicional';

-- ============================================================================
-- TRIGGER PARA ATUALIZAR TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tomadores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tomadores_updated_at
    BEFORE UPDATE ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION update_tomadores_updated_at();

CREATE TRIGGER trg_tomadores_funcionarios_updated_at
    BEFORE UPDATE ON tomadores_funcionarios
    FOR EACH ROW
    EXECUTE FUNCTION update_tomadores_updated_at();

-- ============================================================================
-- FUNÇÃO AUXILIAR: Obter Contratante de um Funcionário
-- ============================================================================

CREATE OR REPLACE FUNCTION get_contratante_funcionario(p_funcionario_id INTEGER)
RETURNS TABLE (
    contratante_id INTEGER,
    contratante_nome VARCHAR,
    contratante_tipo tipo_contratante_enum,
    contratante_ativo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        c.tipo,
        c.ativa
    FROM tomadores c
    INNER JOIN tomadores_funcionarios cf ON cf.contratante_id = c.id
    WHERE cf.funcionario_id = p_funcionario_id
      AND cf.vinculo_ativo = true
      AND c.ativa = true
    ORDER BY cf.criado_em DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: tomadores com Estatísticas
-- ============================================================================

CREATE OR REPLACE VIEW v_tomadores_stats AS
SELECT
    c.id,
    c.tipo,
    c.nome,
    c.cnpj,
    c.status,
    c.ativa,
    c.responsavel_nome,
    c.responsavel_email,
    COUNT(DISTINCT cf.funcionario_id) as total_funcionarios,
    COUNT(
        DISTINCT CASE
            WHEN cf.vinculo_ativo = true THEN cf.funcionario_id
        END
    ) as funcionarios_ativos,
    c.criado_em,
    c.aprovado_em
FROM
    tomadores c
    LEFT JOIN tomadores_funcionarios cf ON cf.contratante_id = c.id
GROUP BY
    c.id,
    c.tipo,
    c.nome,
    c.cnpj,
    c.status,
    c.ativa,
    c.responsavel_nome,
    c.responsavel_email,
    c.criado_em,
    c.aprovado_em;

COMMENT ON VIEW v_tomadores_stats IS 'View com estatísticas agregadas de tomadores';

-- ============================================================================
-- MIGRAÇÃO DE DADOS EXISTENTES (se aplicável)
-- ============================================================================

-- Nota: Como o banco será zerado, esta seção é para referência futura
-- Se houver dados em 'clinicas', migrar para 'tomadores' com tipo='clinica'

/*
INSERT INTO tomadores (
tipo, nome, cnpj, inscricao_estadual, email, telefone, 
endereco, cidade, estado, cep,
responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
status, ativa, criado_em, atualizado_em
)
SELECT 
'clinica'::tipo_contratante_enum,
nome,
cnpj,
NULL, -- inscricao_estadual
email,
telefone,
endereco,
NULL, -- cidade (extrair do endereco se necessário)
NULL, -- estado
NULL, -- cep
'Gestor Migrado', -- responsavel_nome (ajustar conforme necessidade)
'00000000000', -- responsavel_cpf (placeholder)
email, -- responsavel_email
telefone, -- responsavel_celular
'aprovado'::status_aprovacao_enum,
ativa,
criado_em,
atualizado_em
FROM clinicas;
*/