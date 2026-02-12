-- =====================================================
-- SCRIPT DE MIGRAÇÃO PARA PRODUÇÃO
-- Criar tabelas de aceites de termos
-- =====================================================
-- Banco: neondb (Produção)
-- Data: 12/02/2026
-- Executar em uma transação para poder reverter em caso de erro
-- =====================================================

BEGIN;

-- =====================================================
-- VERIFICAÇÃO PRÉVIA
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'aceites_termos_usuario'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Tabela aceites_termos_usuario já existe. Abortando...';
    RAISE EXCEPTION 'Tabela já existe';
  END IF;
  
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'aceites_termos_entidade'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Tabela aceites_termos_entidade já existe. Abortando...';
    RAISE EXCEPTION 'Tabela já existe';
  END IF;
END $$;

-- =====================================================
-- TABELA 1: Aceites por usuário (registro individual)
-- =====================================================
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
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  sessao_id TEXT,                         -- UUID ou session token
  
  -- Rastreamento de revogação (futuro)
  revogado_em TIMESTAMP WITH TIME ZONE,
  motivo_revogacao TEXT,
  revogado_por VARCHAR(11),               -- CPF de quem revogou
  
  -- Constraint: um CPF só aceita cada termo uma vez
  CONSTRAINT uk_aceite_usuario UNIQUE(usuario_cpf, usuario_tipo, termo_tipo)
);

-- =====================================================
-- TABELA 2: Aceites por CNPJ (redundância legal/contratante)
-- =====================================================
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
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  
  -- Rastreamento se responsável for removido depois
  responsavel_removido_em TIMESTAMP WITH TIME ZONE,
  responsavel_remover_motivo TEXT,
  
  -- Constraint: um CNPJ só aceita cada termo uma vez
  CONSTRAINT uk_aceite_entidade UNIQUE(entidade_cnpj, entidade_tipo, termo_tipo)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_aceites_usuario_cpf ON aceites_termos_usuario(usuario_cpf, usuario_tipo);
CREATE INDEX idx_aceites_usuario_data ON aceites_termos_usuario(aceito_em DESC);
CREATE INDEX idx_aceites_usuario_termo ON aceites_termos_usuario(termo_tipo);
CREATE INDEX idx_aceites_usuario_entidade ON aceites_termos_usuario(usuario_entidade_id);

CREATE INDEX idx_aceites_entidade_cnpj ON aceites_termos_entidade(entidade_cnpj);
CREATE INDEX idx_aceites_entidade_data ON aceites_termos_entidade(aceito_em DESC);
CREATE INDEX idx_aceites_entidade_id ON aceites_termos_entidade(entidade_id);
CREATE INDEX idx_aceites_entidade_responsavel ON aceites_termos_entidade(responsavel_cpf);

-- =====================================================
-- COMENTÁRIOS (DOCUMENTAÇÃO)
-- =====================================================

COMMENT ON TABLE aceites_termos_usuario IS 
  'Registro individual de aceites de termos por CPF (auditoria legal/LGPD). Cada usuário (RH/Gestor) registra sua aceitação de termos de uso e política de privacidade.';

COMMENT ON TABLE aceites_termos_entidade IS 
  'Registro de aceites vinculados ao CNPJ/contratante (prova legal mesmo após remoção do usuário). Garante que há evidência de aceite mesmo se o responsável for removido do sistema.';

COMMENT ON COLUMN aceites_termos_usuario.usuario_cpf IS 'CPF do usuário que aceitou o termo';
COMMENT ON COLUMN aceites_termos_usuario.usuario_tipo IS 'Tipo de usuário: rh, gestor';
COMMENT ON COLUMN aceites_termos_usuario.usuario_entidade_id IS 'ID da clínica (RH) ou entidade (Gestor)';
COMMENT ON COLUMN aceites_termos_usuario.termo_tipo IS 'Tipo de termo aceito: termos_uso, politica_privacidade';
COMMENT ON COLUMN aceites_termos_usuario.versao_termo IS 'Versão do termo aceito (para futuro controle de mudanças)';
COMMENT ON COLUMN aceites_termos_usuario.ip_address IS 'IP de origem quando o aceite foi registrado';
COMMENT ON COLUMN aceites_termos_usuario.user_agent IS 'Navegador/cliente usado para aceitar o termo';
COMMENT ON COLUMN aceites_termos_usuario.sessao_id IS 'ID da sessão (para rastreabilidade)';

COMMENT ON COLUMN aceites_termos_entidade.entidade_cnpj IS 'CNPJ da empresa/clínica contratante';
COMMENT ON COLUMN aceites_termos_entidade.entidade_tipo IS 'Tipo de entidade: clinica ou entidade (empresa)';
COMMENT ON COLUMN aceites_termos_entidade.responsavel_cpf IS 'CPF do gestor/RH que aceitou em nome da entidade';
COMMENT ON COLUMN aceites_termos_entidade.responsavel_removido_em IS 'Data de remoção do responsável (mantém histórico legal)';

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  -- Verifica se a tabela aceites_termos_usuario foi criada
  SELECT COUNT(*) INTO v_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'aceites_termos_usuario';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Erro: Tabela aceites_termos_usuario não foi criada';
  END IF;
  
  -- Verifica se a tabela aceites_termos_entidade foi criada
  SELECT COUNT(*) INTO v_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'aceites_termos_entidade';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Erro: Tabela aceites_termos_entidade não foi criada';
  END IF;
  
  RAISE NOTICE '✓ Validação concluída com sucesso';
  RAISE NOTICE '✓ Tabela aceites_termos_usuario criada';
  RAISE NOTICE '✓ Tabela aceites_termos_entidade criada';
  RAISE NOTICE '✓ Índices criados para performance';
END $$;

-- =====================================================
-- COMMIT
-- =====================================================

COMMIT;

-- =====================================================
-- VERIFICAÇÃO PÓS-COMMIT
-- =====================================================

\echo ''
\echo '╔══════════════════════════════════════════════════════╗'
\echo '║  MIGRAÇÃO CONCLUÍDA COM SUCESSO!                     ║'
\echo '╚══════════════════════════════════════════════════════╝'
\echo ''

SELECT 
  tablename as tabela,
  (SELECT COUNT(*) FROM aceites_termos_usuario) as registros
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('aceites_termos_usuario', 'aceites_termos_entidade');

\echo ''
\echo 'Índices criados:'
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('aceites_termos_usuario', 'aceites_termos_entidade')
ORDER BY tablename, indexname;

\echo ''
\echo '╔══════════════════════════════════════════════════════╗'
\echo '║  PRÓXIMOS PASSOS:                                    ║'
\echo '║  1. O sistema agora aceita termos normalmente       ║'
\echo '║  2. Usuários RH/Gestor já podem aceitar termos      ║'
\echo '║  3. Monitorar logs da aplicação                      ║'
\echo '╚══════════════════════════════════════════════════════╝'
\echo ''
