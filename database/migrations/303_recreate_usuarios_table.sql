-- ====================================================================
-- Migration 303: Recriar tabela usuarios com nova finalidade
-- Data: 2026-02-05
-- Objetivo: Tabela usuarios armazena apenas contas de sistema:
--   - Admin (seed)
--   - Emissor (modal admin)
--   - Gestor (cadastro, senha nos 6 últimos dígitos CNPJ)
--   - RH (cadastro, senha nos 6 últimos dígitos CNPJ)
-- ====================================================================

BEGIN;

-- Dropar tabela usuarios antiga e suas dependências
DROP TABLE IF EXISTS usuarios CASCADE;

-- Criar nova tabela usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    tipo_usuario usuario_tipo_enum NOT NULL,
    clinica_id INTEGER REFERENCES clinicas(id),
    entidade_id INTEGER REFERENCES entidades(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT usuarios_cpf_check CHECK (cpf ~ '^\d{11}$'),
    
    -- Regras de integridade por tipo de usuário
    CONSTRAINT usuarios_tipo_check CHECK (
        -- Admin e Emissor: sem vínculos
        (tipo_usuario IN ('admin', 'emissor') AND clinica_id IS NULL AND entidade_id IS NULL)
        OR
        -- RH: deve ter clinica_id, não tem entidade_id
        (tipo_usuario = 'rh' AND clinica_id IS NOT NULL AND entidade_id IS NULL)
        OR
        -- Gestor Entidade: deve ter entidade_id, não tem clinica_id
        (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL)
    )
);

-- Criar índices
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_clinica_id ON usuarios(clinica_id) WHERE clinica_id IS NOT NULL;
CREATE INDEX idx_usuarios_entidade_id ON usuarios(entidade_id) WHERE entidade_id IS NOT NULL;
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_tipo_ativo ON usuarios(tipo_usuario, ativo);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION update_usuarios_updated_at();

-- Comentários
COMMENT ON TABLE usuarios IS 'Usuários do sistema com acesso (admin, emissor, gestor, rh). Senhas em entidades_senhas/clinicas_senhas.';
COMMENT ON COLUMN usuarios.cpf IS 'CPF único do usuário';
COMMENT ON COLUMN usuarios.tipo_usuario IS 'Tipo: admin, emissor, rh, gestor';
COMMENT ON COLUMN usuarios.clinica_id IS 'Para RH: vínculo com clínica (senha em clinicas_senhas)';
COMMENT ON COLUMN usuarios.entidade_id IS 'Para Gestor: vínculo com entidade (senha em entidades_senhas)';

COMMIT;

-- Verificação
\echo ''
\echo '✓ Tabela usuarios recriada com sucesso'
\echo 'Estrutura: admin, emissor, gestor, rh'
\echo 'Senhas: entidades_senhas (gestor) e clinicas_senhas (rh)'
