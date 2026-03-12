-- Migration: Adicionar colunas de arquivo remoto em clinicas e entidades
-- Data: 2026-03-08
-- Descrição: Complemento seguro para migração 1102 (com IF NOT EXISTS para evitar duplicação)

-- Adicionar colunas em clinicas (se não existirem)
ALTER TABLE clinicas
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_url TEXT;

-- Adicionar colunas em entidades (se não existirem)
ALTER TABLE entidades
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS cartao_cnpj_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrato_social_arquivo_remoto_url TEXT,
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_key VARCHAR(2048),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_bucket VARCHAR(255),
ADD COLUMN IF NOT EXISTS doc_identificacao_arquivo_remoto_url TEXT;
