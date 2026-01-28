-- Migration: Permitir user_cpf nulo em audit_logs para ações automáticas do sistema
-- Data: 2026-01-23
-- Descrição: Remove constraint NOT NULL de user_cpf em audit_logs
--            Permite que operações automatizadas sejam auditadas sem CPF de usuário
--            Sistema usa NULL ou '00000000000' para identificar ações automáticas

-- Remover constraint NOT NULL de user_cpf
ALTER TABLE audit_logs 
ALTER COLUMN user_cpf DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN audit_logs.user_cpf IS 'CPF do usuário que executou a ação. NULL indica ação automática do sistema.';

-- Criar índice parcial para ações do sistema (onde user_cpf é nulo)
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_actions 
ON audit_logs (created_at DESC) 
WHERE user_cpf IS NULL;

-- Adicionar constraint CHECK opcional para garantir formato válido quando presente
ALTER TABLE audit_logs 
ADD CONSTRAINT chk_audit_logs_user_cpf_format 
CHECK (user_cpf IS NULL OR LENGTH(user_cpf) = 11);

-- Verificar estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs' 
  AND column_name IN ('user_cpf', 'user_perfil')
ORDER BY ordinal_position;
