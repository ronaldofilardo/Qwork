-- Migration 081: Adicionar colunas faltantes no test DB
-- Data: 2026-01-24
-- Descrição: Adiciona colunas que faltam no test DB para compatibilidade com testes de integração

BEGIN;

-- 1. Adicionar responsavel_nome em empresas_clientes (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas_clientes' 
        AND column_name = 'responsavel_nome'
    ) THEN
        ALTER TABLE empresas_clientes ADD COLUMN responsavel_nome TEXT;
        COMMENT ON COLUMN empresas_clientes.responsavel_nome IS 'Nome do responsável pela empresa';
        RAISE NOTICE 'Coluna responsavel_nome adicionada em empresas_clientes';
    ELSE
        RAISE NOTICE 'Coluna responsavel_nome já existe em empresas_clientes';
    END IF;
END $$;

-- 2. Adicionar inscricao_estadual em tomadores (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'inscricao_estadual'
    ) THEN
        ALTER TABLE tomadores ADD COLUMN inscricao_estadual VARCHAR(20);
        COMMENT ON COLUMN tomadores.inscricao_estadual IS 'Inscrição estadual do contratante';
        RAISE NOTICE 'Coluna inscricao_estadual adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna inscricao_estadual já existe em tomadores';
    END IF;
END $$;

-- 3. Adicionar plano_tipo em tomadores (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'plano_tipo'
    ) THEN
        ALTER TABLE tomadores ADD COLUMN plano_tipo TEXT;
        COMMENT ON COLUMN tomadores.plano_tipo IS 'Tipo do plano do contratante';
        RAISE NOTICE 'Coluna plano_tipo adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna plano_tipo já existe em tomadores';
    END IF;
END $$;

-- 4. Adicionar cartao_cnpj_path em tomadores (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'cartao_cnpj_path'
    ) THEN
        ALTER TABLE tomadores ADD COLUMN cartao_cnpj_path TEXT;
        COMMENT ON COLUMN tomadores.cartao_cnpj_path IS 'Caminho do arquivo do cartão CNPJ';
        RAISE NOTICE 'Coluna cartao_cnpj_path adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna cartao_cnpj_path já existe em tomadores';
    END IF;
END $$;

-- 5. Adicionar contrato_social_path em tomadores (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'contrato_social_path'
    ) THEN
        ALTER TABLE tomadores ADD COLUMN contrato_social_path TEXT;
        COMMENT ON COLUMN tomadores.contrato_social_path IS 'Caminho do arquivo do contrato social';
        RAISE NOTICE 'Coluna contrato_social_path adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna contrato_social_path já existe em tomadores';
    END IF;
END $$;

-- 6. Adicionar doc_identificacao_path em tomadores (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tomadores' 
        AND column_name = 'doc_identificacao_path'
    ) THEN
        ALTER TABLE tomadores ADD COLUMN doc_identificacao_path TEXT;
        COMMENT ON COLUMN tomadores.doc_identificacao_path IS 'Caminho do documento de identificação';
        RAISE NOTICE 'Coluna doc_identificacao_path adicionada em tomadores';
    ELSE
        RAISE NOTICE 'Coluna doc_identificacao_path já existe em tomadores';
    END IF;
END $$;

COMMIT;
