-- Migration 010: Ajustar notificacoes para usar destinatario_cpf
-- A migration 023 criou com destinatario_id mas precisamos de destinatario_cpf

-- 1. Adicionar coluna destinatario_cpf
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS destinatario_cpf TEXT;

-- 2. Adicionar colunas adicionais que faltam
ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS resolvida BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS data_resolucao TIMESTAMP;

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS resolvido_por_cpf VARCHAR(11);

-- 3. Atualizar constraint
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacao_destinatario_valido;
ALTER TABLE notificacoes ADD CONSTRAINT notificacao_destinatario_valido 
  CHECK (LENGTH(destinatario_cpf) > 0);

-- 4. Atualizar constraint de tipo destinatario
ALTER TABLE notificacoes DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;
ALTER TABLE notificacoes ADD CONSTRAINT notificacoes_destinatario_tipo_check 
  CHECK (destinatario_tipo IN ('admin', 'gestor', 'funcionario', 'contratante', 'clinica'));

-- 5. Criar índice para destinatario_cpf
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario_cpf 
ON notificacoes(destinatario_cpf);

-- 6. Comentários
COMMENT ON COLUMN notificacoes.destinatario_cpf IS 'CPF do destinatário da notificação';
COMMENT ON COLUMN notificacoes.resolvida IS 'Indica se a notificação foi resolvida (ação tomada), diferente de apenas lida';
COMMENT ON COLUMN notificacoes.data_resolucao IS 'Data/hora em que a notificação foi marcada como resolvida';
COMMENT ON COLUMN notificacoes.resolvido_por_cpf IS 'CPF do usuário que resolveu a notificação';

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Migration 010 executada: notificacoes ajustada para usar destinatario_cpf e campos adicionais';
END $$;
