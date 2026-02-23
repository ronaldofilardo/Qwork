-- Migration: Adicionar colunas de arquivo remoto em tabelas de cadastro
-- Data: 2026-02-23
-- Descrição: Permite persistir informações de upload para Backblaze
--   em arquivos de cadastro (entidades, clinicas, empresas_clientes)

-- Adicionar colunas em entidades
ALTER TABLE entidades
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_url TEXT;

-- Adicionar colunas em clinicas
ALTER TABLE clinicas
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_url TEXT;

-- Adicionar colunas em empresas_clientes
ALTER TABLE empresas_clientes
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN entidades.cartao_cnpj_arquivo_remoto_provider IS 'Provider de armazenamento remoto do arquivo (e.g. "backblaze")';
COMMENT ON COLUMN entidades.cartao_cnpj_arquivo_remoto_bucket IS 'Bucket/container no provider remoto';
COMMENT ON COLUMN entidades.cartao_cnpj_arquivo_remoto_key IS 'Chave/caminho do arquivo no provider remoto';
COMMENT ON COLUMN entidades.cartao_cnpj_arquivo_remoto_url IS 'URL pública do arquivo no provider remoto';
