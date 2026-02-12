-- =====================================================
-- Migration: Aceites de Termos e Política de Privacidade
-- Data: 12/02/2026
-- Descrição: Criação de tabelas para registrar aceites de termos 
--            por usuários (RH/Gestor) com redundância por CNPJ
--            para conformidade legal/LGPD
-- =====================================================

-- Tabela 1: Aceites por usuário (registro individual)
CREATE TABLE IF NOT EXISTS aceites_termos_usuario (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificação do usuário
  usuario_cpf VARCHAR(11) NOT NULL,
  usuario_tipo VARCHAR(50) NOT NULL,      -- 'rh' ou 'gestor'
  usuario_entidade_id INT,                -- clinica_id ou entidade_id do usuário
  
  -- Tipo de termo aceito
  termo_tipo VARCHAR(50) NOT NULL,        -- 'termos_uso' ou 'politica_privacidade'
  versao_termo INT DEFAULT 1 NOT NULL,    -- Para futuro versionamento
  
  -- Auditoria detalhada (LGPD/legal compliance)
  aceito_em TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  sessao_id TEXT,                         -- UUID ou session token
  
  -- Rastreamento de revogação (futuro)
  revogado_em TIMESTAMP,
  motivo_revogacao TEXT,
  revogado_por VARCHAR(11),               -- CPF de quem revogou
  
  -- Constraint: um CPF só aceita cada termo uma vez
  CONSTRAINT uk_aceite_usuario UNIQUE(usuario_cpf, usuario_tipo, termo_tipo)
);

-- Tabela 2: Aceites por CNPJ (redundância legal/contratante)
CREATE TABLE IF NOT EXISTS aceites_termos_entidade (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificação da entidade jurídica (contratante)
  entidade_cnpj VARCHAR(14) NOT NULL,
  entidade_tipo VARCHAR(50) NOT NULL,    -- 'clinica' ou 'entidade'
  entidade_id INT NOT NULL,              -- clinica_id ou entidade_id
  entidade_nome VARCHAR(255),
  
  -- Quem aceitou em nome da entidade?
  responsavel_cpf VARCHAR(11) NOT NULL,
  responsavel_nome VARCHAR(255),
  responsavel_tipo VARCHAR(50),          -- 'rh' ou 'gestor'
  
  -- Termo
  termo_tipo VARCHAR(50) NOT NULL,       -- 'termos_uso' ou 'politica_privacidade'
  versao_termo INT DEFAULT 1 NOT NULL,
  
  -- Quando?
  aceito_em TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  
  -- Rastreamento se responsável for removido depois
  responsavel_removido_em TIMESTAMP,
  responsavel_remover_motivo TEXT,
  
  -- Constraint: um CNPJ só aceita cada termo uma vez
  CONSTRAINT uk_aceite_entidade UNIQUE(entidade_cnpj, entidade_tipo, termo_tipo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aceites_usuario_cpf ON aceites_termos_usuario(usuario_cpf, usuario_tipo);
CREATE INDEX IF NOT EXISTS idx_aceites_usuario_data ON aceites_termos_usuario(aceito_em DESC);
CREATE INDEX IF NOT EXISTS idx_aceites_usuario_termo ON aceites_termos_usuario(termo_tipo);
CREATE INDEX IF NOT EXISTS idx_aceites_entidade_cnpj ON aceites_termos_entidade(entidade_cnpj);
CREATE INDEX IF NOT EXISTS idx_aceites_entidade_data ON aceites_termos_entidade(aceito_em DESC);
CREATE INDEX IF NOT EXISTS idx_aceites_entidade_id ON aceites_termos_entidade(entidade_id);

-- Comentários
COMMENT ON TABLE aceites_termos_usuario IS 'Registro individual de aceites de termos por CPF (auditoria legal/LGPD)';
COMMENT ON TABLE aceites_termos_entidade IS 'Registro de aceites vinculados ao CNPJ/contratante (prova legal mesmo após remoção do usuário)';

COMMENT ON COLUMN aceites_termos_usuario.usuario_cpf IS 'CPF do usuário que aceitou o termo';
COMMENT ON COLUMN aceites_termos_usuario.usuario_tipo IS 'Tipo de usuário: rh, gestor';
COMMENT ON COLUMN aceites_termos_usuario.termo_tipo IS 'Tipo de termo aceito: termos_uso, politica_privacidade';
COMMENT ON COLUMN aceites_termos_usuario.versao_termo IS 'Versão do termo aceito (para futuro controle de mudanças)';

COMMENT ON COLUMN aceites_termos_entidade.entidade_cnpj IS 'CNPJ da empresa/clínica contratante';
COMMENT ON COLUMN aceites_termos_entidade.responsavel_cpf IS 'CPF do gestor/RH que aceitou em nome da entidade';
COMMENT ON COLUMN aceites_termos_entidade.responsavel_removido_em IS 'Data de remoção do responsável (mantém histórico legal)';
