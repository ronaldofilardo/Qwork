-- ====================================================================
-- Migration 302: Criar tabela clinicas_senhas
-- Data: 2026-02-05
-- Objetivo: Armazenar senhas de usuários RH vinculados a clínicas
-- ====================================================================

BEGIN;

-- Criar tabela clinicas_senhas espelhando entidades_senhas
CREATE TABLE IF NOT EXISTS clinicas_senhas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT clinicas_senhas_cpf_check CHECK (cpf ~ '^\d{11}$'),
    CONSTRAINT clinicas_senhas_clinica_cpf_unique UNIQUE (clinica_id, cpf)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica ON clinicas_senhas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica_id ON clinicas_senhas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_cpf ON clinicas_senhas(cpf);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_clinicas_senhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinicas_senhas_updated_at
    BEFORE UPDATE ON clinicas_senhas
    FOR EACH ROW
    EXECUTE FUNCTION update_clinicas_senhas_updated_at();

-- Criar trigger de auditoria (espelhando entidades_senhas)
CREATE OR REPLACE FUNCTION fn_audit_clinicas_senhas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE 'Nova senha criada para CPF % na clínica %', NEW.cpf, NEW.clinica_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.senha_hash != NEW.senha_hash THEN
            RAISE NOTICE 'Senha alterada para CPF % na clínica %', NEW.cpf, NEW.clinica_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        RAISE NOTICE 'Senha removida para CPF % na clínica %', OLD.cpf, OLD.clinica_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_senhas
    BEFORE INSERT OR UPDATE OR DELETE ON clinicas_senhas
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_clinicas_senhas();

-- Comentários
COMMENT ON TABLE clinicas_senhas IS 'Armazena senhas de usuários RH vinculados a clínicas';
COMMENT ON COLUMN clinicas_senhas.clinica_id IS 'Referência para a clínica';
COMMENT ON COLUMN clinicas_senhas.cpf IS 'CPF do usuário RH';
COMMENT ON COLUMN clinicas_senhas.senha_hash IS 'Hash bcrypt da senha';
COMMENT ON COLUMN clinicas_senhas.primeira_senha_alterada IS 'Indica se o usuário já alterou a senha inicial';

COMMIT;

-- Verificação
SELECT 
    'clinicas_senhas' as tabela,
    COUNT(*) as total_registros
FROM clinicas_senhas;

\echo '✓ Tabela clinicas_senhas criada com sucesso'
