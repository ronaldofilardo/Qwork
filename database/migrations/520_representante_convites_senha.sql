-- Migration 520: Sistema de convite e criação de senha para representantes
--
-- Adiciona suporte para:
-- 1. Representante criar própria senha via link de convite
-- 2. Token de convite de uso único com expiração (7 dias)
-- 3. Bloqueio após 3 tentativas falhas
-- 4. Novos status: 'aguardando_senha' e 'expirado'
--
-- Padrão: token inline na tabela (consistente com contratos.payment_link_token)
-- Email: fake (console.log) até provedor ser escolhido

-- Adicionar novos valores ao ENUM status_representante
-- (ALTER TYPE ADD VALUE é idempotente via IF NOT EXISTS no PG 9.6+)
ALTER TYPE status_representante ADD VALUE IF NOT EXISTS 'aguardando_senha';
ALTER TYPE status_representante ADD VALUE IF NOT EXISTS 'expirado';

-- Senha criada pelo próprio representante (bcrypt rounds=12)
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS senha_repres VARCHAR(60);

-- Token de convite de uso único para criação de senha
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS convite_token VARCHAR(64) UNIQUE;

-- Data/hora de expiração do convite (7 dias após geração); NULL = sem convite ativo
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS convite_expira_em TIMESTAMP;

-- Contador de tentativas falhas com o token (bloqueio após 3)
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS convite_tentativas_falhas INT NOT NULL DEFAULT 0;

-- Timestamp de quando o convite foi usado (auditoria)
ALTER TABLE representantes
  ADD COLUMN IF NOT EXISTS convite_usado_em TIMESTAMP;

-- Comentários
COMMENT ON COLUMN representantes.senha_repres
  IS 'Senha criada pelo próprio representante via link de convite (bcrypt rounds=12)';

COMMENT ON COLUMN representantes.convite_token
  IS 'Token de uso único para criação de senha (hex-64, expira em 7 dias)';

COMMENT ON COLUMN representantes.convite_expira_em
  IS 'Expiração do token de convite; verificado on-demand (sem cron)';

COMMENT ON COLUMN representantes.convite_tentativas_falhas
  IS 'Contador de tentativas inválidas; bloqueado após 3';

COMMENT ON COLUMN representantes.convite_usado_em
  IS 'Quando o representante usou o link e criou a senha (auditoria)';

-- Índice para busca eficiente por token
CREATE INDEX IF NOT EXISTS idx_representantes_convite_token
  ON representantes (convite_token)
  WHERE convite_token IS NOT NULL;

-- Confirmar aplicação
DO $$
BEGIN
  RAISE NOTICE 'Migration 520 aplicada com sucesso: enum atualizado + colunas de convite adicionadas a representantes';
END;
$$;
