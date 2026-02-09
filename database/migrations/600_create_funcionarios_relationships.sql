-- Migration: 600_create_funcionarios_relationships.sql
-- Descrição: Cria tabelas intermediárias M:N para relacionamentos de funcionários
-- Data: 2026-02-08
-- Objetivo: Implementar arquitetura segregada de tomadores corretamente

-- =============================================================================
-- TABELA: funcionarios_entidades
-- Relacionamento M:N entre funcionários e entidades (tomadores tipo='entidade')
-- =============================================================================

CREATE TABLE IF NOT EXISTS funcionarios_entidades (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL,
    entidade_id INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    data_vinculo TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_desvinculo TIMESTAMP WITHOUT TIME ZONE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_funcionarios_entidades_funcionario 
        FOREIGN KEY (funcionario_id) 
        REFERENCES funcionarios(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_funcionarios_entidades_entidade 
        FOREIGN KEY (entidade_id) 
        REFERENCES tomadores(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT funcionarios_entidades_unique 
        UNIQUE (funcionario_id, entidade_id),
    
    CONSTRAINT funcionarios_entidades_desvinculo_check 
        CHECK (data_desvinculo IS NULL OR data_desvinculo >= data_vinculo)
);

-- Comentários
COMMENT ON TABLE funcionarios_entidades IS 
'Relacionamento M:N entre funcionários e entidades (tomadores tipo=entidade). Permite histórico de vínculos.';

COMMENT ON COLUMN funcionarios_entidades.funcionario_id IS 
'ID do funcionário (pessoa física avaliada)';

COMMENT ON COLUMN funcionarios_entidades.entidade_id IS 
'ID da entidade (tomador tipo=entidade) - empresa que administra seus próprios funcionários com um gestor';

COMMENT ON COLUMN funcionarios_entidades.ativo IS 
'TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)';

COMMENT ON COLUMN funcionarios_entidades.data_vinculo IS 
'Data em que o funcionário foi vinculado à entidade';

COMMENT ON COLUMN funcionarios_entidades.data_desvinculo IS 
'Data em que o vínculo foi encerrado (NULL = vínculo ativo)';

-- Índices para performance
CREATE INDEX idx_func_entidades_funcionario 
    ON funcionarios_entidades(funcionario_id);

CREATE INDEX idx_func_entidades_entidade 
    ON funcionarios_entidades(entidade_id);

CREATE INDEX idx_func_entidades_ativo 
    ON funcionarios_entidades(ativo) 
    WHERE ativo = true;

CREATE INDEX idx_func_entidades_entidade_ativo 
    ON funcionarios_entidades(entidade_id, ativo) 
    WHERE ativo = true;

-- =============================================================================
-- TABELA: funcionarios_clinicas
-- Relacionamento M:N entre funcionários e empresas clientes (via clínicas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS funcionarios_clinicas (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL,
    clinica_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    data_vinculo TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_desvinculo TIMESTAMP WITHOUT TIME ZONE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Keys
    CONSTRAINT fk_funcionarios_clinicas_funcionario 
        FOREIGN KEY (funcionario_id) 
        REFERENCES funcionarios(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_funcionarios_clinicas_clinica 
        FOREIGN KEY (clinica_id) 
        REFERENCES clinicas(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_funcionarios_clinicas_empresa 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas_clientes(id) 
        ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT funcionarios_clinicas_unique 
        UNIQUE (funcionario_id, empresa_id),
    
    CONSTRAINT funcionarios_clinicas_desvinculo_check 
        CHECK (data_desvinculo IS NULL OR data_desvinculo >= data_vinculo)
);

-- Comentários
COMMENT ON TABLE funcionarios_clinicas IS 
'Relacionamento M:N entre funcionários e empresas clientes (via clínicas de medicina ocupacional). Permite histórico de vínculos.';

COMMENT ON COLUMN funcionarios_clinicas.funcionario_id IS 
'ID do funcionário (pessoa física avaliada)';

COMMENT ON COLUMN funcionarios_clinicas.clinica_id IS 
'ID da clínica de medicina ocupacional que gerencia este funcionário';

COMMENT ON COLUMN funcionarios_clinicas.empresa_id IS 
'ID da empresa cliente (atendida pela clínica) à qual o funcionário pertence';

COMMENT ON COLUMN funcionarios_clinicas.ativo IS 
'TRUE = vínculo ativo | FALSE = vínculo encerrado (mantém histórico sem deletar)';

COMMENT ON COLUMN funcionarios_clinicas.data_vinculo IS 
'Data em que o funcionário foi vinculado à empresa (via clínica)';

COMMENT ON COLUMN funcionarios_clinicas.data_desvinculo IS 
'Data em que o vínculo foi encerrado (NULL = vínculo ativo)';

-- Índices para performance
CREATE INDEX idx_func_clinicas_funcionario 
    ON funcionarios_clinicas(funcionario_id);

CREATE INDEX idx_func_clinicas_clinica 
    ON funcionarios_clinicas(clinica_id);

CREATE INDEX idx_func_clinicas_empresa 
    ON funcionarios_clinicas(empresa_id);

CREATE INDEX idx_func_clinicas_ativo 
    ON funcionarios_clinicas(ativo) 
    WHERE ativo = true;

CREATE INDEX idx_func_clinicas_clinica_ativo 
    ON funcionarios_clinicas(clinica_id, ativo) 
    WHERE ativo = true;

CREATE INDEX idx_func_clinicas_empresa_ativo 
    ON funcionarios_clinicas(empresa_id, ativo) 
    WHERE ativo = true;

CREATE INDEX idx_func_clinicas_clinica_empresa_ativo 
    ON funcionarios_clinicas(clinica_id, empresa_id, ativo) 
    WHERE ativo = true;

-- =============================================================================
-- TRIGGERS para atualizar timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_funcionarios_entidades_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_funcionarios_entidades_timestamp
    BEFORE UPDATE ON funcionarios_entidades
    FOR EACH ROW
    EXECUTE FUNCTION update_funcionarios_entidades_timestamp();

CREATE OR REPLACE FUNCTION update_funcionarios_clinicas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_funcionarios_clinicas_timestamp
    BEFORE UPDATE ON funcionarios_clinicas
    FOR EACH ROW
    EXECUTE FUNCTION update_funcionarios_clinicas_timestamp();

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

DO $$
BEGIN
    -- Verificar se as tabelas foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'funcionarios_entidades') THEN
        RAISE EXCEPTION 'Tabela funcionarios_entidades não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'funcionarios_clinicas') THEN
        RAISE EXCEPTION 'Tabela funcionarios_clinicas não foi criada';
    END IF;
    
    RAISE NOTICE 'Migration 600: Tabelas intermediárias criadas com sucesso';
END $$;
