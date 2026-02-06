-- ============================================================================
-- FIX: Correção de Migrações Faltantes Pós-Reset do Banco
-- Data: 2026-01-22
-- Descrição: Aplica as migrações críticas que faltam após reset do banco
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADICIONAR COLUNA hash_pdf em lotes_avaliacao
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'hash_pdf'
    ) THEN
        ALTER TABLE lotes_avaliacao ADD COLUMN hash_pdf VARCHAR(64);
        COMMENT ON COLUMN lotes_avaliacao.hash_pdf IS 'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';
        RAISE NOTICE 'Coluna hash_pdf adicionada em lotes_avaliacao';
    ELSE
        RAISE NOTICE 'Coluna hash_pdf já existe em lotes_avaliacao';
    END IF;
END $$;

-- ============================================================================
-- 2. ADICIONAR COLUNA hash_pdf em laudos (se não existir)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'laudos' 
        AND column_name = 'hash_pdf'
    ) THEN
        ALTER TABLE laudos ADD COLUMN hash_pdf VARCHAR(64);
        COMMENT ON COLUMN laudos.hash_pdf IS 'Hash SHA-256 do PDF do laudo gerado, usado para integridade e auditoria';
        RAISE NOTICE 'Coluna hash_pdf adicionada em laudos';
    ELSE
        RAISE NOTICE 'Coluna hash_pdf já existe em laudos';
    END IF;
END $$;

-- ============================================================================
-- 2.5 ADICIONAR COLUNA pagamento_confirmado em contratantes
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' 
        AND column_name = 'pagamento_confirmado'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN pagamento_confirmado BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN contratantes.pagamento_confirmado IS 'Flag que indica se o pagamento foi confirmado para o contratante';
        -- Garantir valor padrão para registros existentes
        UPDATE contratantes SET pagamento_confirmado = FALSE WHERE pagamento_confirmado IS NULL;
        RAISE NOTICE 'Coluna pagamento_confirmado adicionada em contratantes';
    ELSE
        RAISE NOTICE 'Coluna pagamento_confirmado já existe em contratantes';
    END IF;
END $$;

-- ============================================================================
-- 2.6 ADICIONAR COLUNA numero_funcionarios_estimado em contratantes
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' 
        AND column_name = 'numero_funcionarios_estimado'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN numero_funcionarios_estimado INTEGER;
        COMMENT ON COLUMN contratantes.numero_funcionarios_estimado IS 'Número estimado de funcionários para o contratante';
        RAISE NOTICE 'Coluna numero_funcionarios_estimado adicionada em contratantes';
    ELSE
        RAISE NOTICE 'Coluna numero_funcionarios_estimado já existe em contratantes';
    END IF;
END $$;

-- ============================================================================
-- 2.7 ADICIONAR VALOR 'aguardando_pagamento' AO ENUM status_aprovacao_enum
-- ============================================================================
DO $$
BEGIN
    -- Verificar se o valor já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'status_aprovacao_enum'
        AND e.enumlabel = 'aguardando_pagamento'
    ) THEN
        -- Adicionar o novo valor ao enum
        ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_pagamento';
        RAISE NOTICE 'Valor aguardando_pagamento adicionado ao enum status_aprovacao_enum';
    ELSE
        RAISE NOTICE 'Valor aguardando_pagamento já existe no enum status_aprovacao_enum';
    END IF;
END $$;

-- ============================================================================
-- 2.8 ADICIONAR COLUNA plano_id em contratantes
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' 
        AND column_name = 'plano_id'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN plano_id INTEGER REFERENCES planos(id);
        COMMENT ON COLUMN contratantes.plano_id IS 'ID do plano associado ao contratante';
        RAISE NOTICE 'Coluna plano_id adicionada em contratantes';
    ELSE
        RAISE NOTICE 'Coluna plano_id já existe em contratantes';
    END IF;
END $$;

-- ============================================================================
-- 3. CRIAR TABELA entidades_senhas
-- ============================================================================
CREATE TABLE IF NOT EXISTS entidades_senhas (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_entidades_senhas_contratante 
        FOREIGN KEY (contratante_id) 
        REFERENCES contratantes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT entidades_senhas_cpf_check 
        CHECK (cpf ~ '^\d{11}$')
);

CREATE INDEX IF NOT EXISTS idx_entidades_senhas_cpf 
ON entidades_senhas(cpf);

CREATE INDEX IF NOT EXISTS idx_entidades_senhas_contratante 
ON entidades_senhas(contratante_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_entidades_senhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entidades_senhas_updated_at ON entidades_senhas;
CREATE TRIGGER trg_entidades_senhas_updated_at
    BEFORE UPDATE ON entidades_senhas
    FOR EACH ROW
    EXECUTE FUNCTION update_entidades_senhas_updated_at();

COMMENT ON TABLE entidades_senhas IS 'Senhas hash para gestores de entidades fazerem login';
COMMENT ON COLUMN entidades_senhas.cpf IS 'CPF do responsavel_cpf em contratantes - usado para login';
COMMENT ON COLUMN entidades_senhas.primeira_senha_alterada IS 'Flag para forçar alteração de senha no primeiro acesso';

-- ============================================================================
-- 4. CRIAR ENUM tipo_plano
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_plano') THEN
        CREATE TYPE tipo_plano AS ENUM ('personalizado', 'fixo');
        RAISE NOTICE 'Enum tipo_plano criado';
    ELSE
        RAISE NOTICE 'Enum tipo_plano já existe';
    END IF;
END $$;

-- ============================================================================
-- 5. CRIAR TABELA planos
-- ============================================================================
CREATE TABLE IF NOT EXISTS planos (
    id SERIAL PRIMARY KEY,
    tipo tipo_plano NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_por_funcionario DECIMAL(10,2), -- Para personalizado
    preco DECIMAL(10,2), -- Para fixo
    limite_funcionarios INTEGER, -- Para fixo
    caracteristicas TEXT, -- Características do plano
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna caracteristicas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planos' 
        AND column_name = 'caracteristicas'
    ) THEN
        ALTER TABLE planos ADD COLUMN caracteristicas TEXT;
        COMMENT ON COLUMN planos.caracteristicas IS 'Características e benefícios do plano';
        RAISE NOTICE 'Coluna caracteristicas adicionada em planos';
    ELSE
        RAISE NOTICE 'Coluna caracteristicas já existe em planos';
    END IF;
END $$;

-- Inserir planos padrão (apenas se não existirem)
INSERT INTO planos (tipo, nome, descricao, preco, limite_funcionarios)
SELECT 'fixo', 'Plano Fixo Básico', 'Até 50 funcionários', 1224.00, 50
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Plano Fixo Básico');

INSERT INTO planos (tipo, nome, descricao, preco, limite_funcionarios)
SELECT 'fixo', 'Plano Fixo Premium', 'Até 200 funcionários', 3999.99, 200
WHERE NOT EXISTS (SELECT 1 FROM planos WHERE nome = 'Plano Fixo Premium');

-- ============================================================================
-- 6. CRIAR TABELA contratos_planos
-- ============================================================================
CREATE TABLE IF NOT EXISTS contratos_planos (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER REFERENCES planos(id),
    clinica_id INTEGER REFERENCES clinicas(id),
    contratante_id INTEGER REFERENCES contratantes(id),
    tipo_contratante VARCHAR(20) NOT NULL CHECK (tipo_contratante IN ('clinica', 'entidade')),
    
    -- Para plano personalizado
    valor_personalizado_por_funcionario DECIMAL(10,2),
    
    -- Controle de vigência
    inicio_vigencia DATE NOT NULL,
    fim_vigencia DATE,
    ativo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT contratos_planos_clinica_or_contratante 
        CHECK (
            (clinica_id IS NOT NULL AND contratante_id IS NULL) OR 
            (clinica_id IS NULL AND contratante_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_contratos_planos_clinica ON contratos_planos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_contratos_planos_contratante ON contratos_planos(contratante_id);

-- ============================================================================
-- 7.5 CRIAR TABELA auditoria
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    entidade_tipo VARCHAR(50) NOT NULL,
    entidade_id INTEGER NOT NULL,
    acao VARCHAR(50) NOT NULL,
    status_anterior VARCHAR(100),
    status_novo VARCHAR(100),
    usuario_cpf VARCHAR(11),
    usuario_perfil VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    dados_alterados JSONB,
    metadados JSONB,
    hash_operacao VARCHAR(64) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade_tipo, entidade_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_cpf);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria(criado_em);

COMMENT ON TABLE auditoria IS 'Tabela de auditoria para registrar todas as ações do sistema';
COMMENT ON COLUMN auditoria.hash_operacao IS 'Hash SHA-256 para verificação de integridade da operação';

-- ============================================================================
-- 8. CRIAR TABELA mfa_codes
-- ============================================================================
CREATE TABLE IF NOT EXISTS mfa_codes (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_funcionarios 
        FOREIGN KEY (cpf) 
        REFERENCES funcionarios(cpf) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mfa_cpf_active 
ON mfa_codes(cpf, used, expires_at) WHERE used = false;

COMMENT ON TABLE mfa_codes IS 'Códigos de autenticação multifator (MFA) para funcionários';

-- ============================================================================
-- 8. VERIFICAR E CORRIGIR DADOS BÁSICOS
-- ============================================================================

-- Garantir que existe pelo menos um contratante tipo 'entidade' para testes
DO $$
BEGIN
    -- Verificar se existe algum contratante tipo 'entidade' com id = 1
    IF NOT EXISTS (SELECT 1 FROM contratantes WHERE id = 1 AND tipo = 'entidade') THEN
        -- Se não existe, criar um contratante de teste
        INSERT INTO contratantes (
            id, 
            tipo, 
            nome, 
            cnpj, 
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep,
            responsavel_nome, 
            responsavel_cpf, 
            responsavel_email,
            responsavel_celular,
            ativa
        )
        VALUES (
            1,
            'entidade',
            'Entidade Teste Sistema',
            '00000000000100',
            'contato@entidadeteste.com',
            '1100000000',
            'Rua Teste, 123',
            'São Paulo',
            'SP',
            '01000000',
            'Administrador Sistema',
            '00000000000',
            'admin@qwork.com',
            '11999999999',
            true
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Resetar sequence se necessário
        PERFORM setval('contratantes_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM contratantes));
        
        RAISE NOTICE 'Contratante tipo entidade criado para testes';
    ELSE
        RAISE NOTICE 'Contratante entidade já existe';
    END IF;
END $$;

-- Criar senha para o contratante entidade se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM entidades_senhas WHERE cpf = '00000000000') THEN
        -- Senha: 123456 (hash bcrypt)
        INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash, primeira_senha_alterada)
        SELECT 
            id, 
            responsavel_cpf, 
            '$2b$10$7GqKvJx9YH1NXZmJz4Qz7.7mVJ0hR5jKxW8qN8P9vZ7nU5xJ0xQ1W',
            false
        FROM contratantes 
        WHERE tipo = 'entidade' 
        AND responsavel_cpf = '00000000000';
        
        RAISE NOTICE 'Senha criada para contratante entidade';
    ELSE
        RAISE NOTICE 'Senha para contratante entidade já existe';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RELATÓRIO DE CORREÇÕES APLICADAS';
    RAISE NOTICE '============================================================================';
    
    -- Verificar lotes_avaliacao.hash_pdf
    SELECT COUNT(*) INTO v_count 
    FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' AND column_name = 'hash_pdf';
    RAISE NOTICE '✓ lotes_avaliacao.hash_pdf: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    -- Verificar laudos.hash_pdf
    SELECT COUNT(*) INTO v_count 
    FROM information_schema.columns 
    WHERE table_name = 'laudos' AND column_name = 'hash_pdf';
    RAISE NOTICE '✓ laudos.hash_pdf: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    -- Verificar tabelas
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'entidades_senhas';
    RAISE NOTICE '✓ Tabela entidades_senhas: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'planos';
    RAISE NOTICE '✓ Tabela planos: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'contratos_planos';
    RAISE NOTICE '✓ Tabela contratos_planos: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_name = 'mfa_codes';
    RAISE NOTICE '✓ Tabela mfa_codes: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'FALTA' END;
    
    -- Verificar dados
    SELECT COUNT(*) INTO v_count FROM planos;
    RAISE NOTICE '✓ Planos cadastrados: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM contratantes WHERE tipo = 'entidade';
    RAISE NOTICE '✓ Contratantes tipo entidade: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM entidades_senhas;
    RAISE NOTICE '✓ Senhas de contratantes: %', v_count;
    
    RAISE NOTICE '============================================================================';
END $$;
