-- Migration: Adicionar coluna data_liberacao_login na tabela contratantes
-- Data: 2026-01-23
-- Descrição: Adiciona coluna para registrar quando o login foi liberado após pagamento

-- Adicionar coluna data_liberacao_login
ALTER TABLE contratantes 
ADD COLUMN IF NOT EXISTS data_liberacao_login TIMESTAMP;

-- Adicionar comentário
COMMENT ON COLUMN contratantes.data_liberacao_login 
IS 'Data em que o login foi liberado após confirmação de pagamento';

-- Criar índice para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_contratantes_data_liberacao 
ON contratantes (data_liberacao_login);

-- Popular com data de aprovação para registros existentes que já estão ativos
UPDATE contratantes 
SET data_liberacao_login = aprovado_em
WHERE ativa = TRUE 
  AND data_liberacao_login IS NULL 
  AND aprovado_em IS NOT NULL;

-- Popular com created_at para registros ativos sem aprovado_em
UPDATE contratantes 
SET data_liberacao_login = created_at
WHERE ativa = TRUE 
  AND data_liberacao_login IS NULL 
  AND aprovado_em IS NULL;

-- Verificar resultado
SELECT 
    COUNT(*) as total,
    COUNT(data_liberacao_login) as com_data_liberacao,
    COUNT(*) FILTER (WHERE ativa = TRUE AND data_liberacao_login IS NULL) as ativos_sem_data
FROM contratantes;
