-- ====================================================================
-- Migration 1230: Adicionar campos de senha e primeira alteração na tabela usuarios
-- Data: 2026-05-03
-- Objetivo: Permitir que usuários RH/Gestor recém-criados (via aceite de contrato)
--           tenham senha temporária e sejam forçados a trocar na primeira vez
-- ====================================================================

BEGIN;

-- Adicionar coluna senha_hash em usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);

-- Adicionar coluna primeira_senha_alterada em usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS primeira_senha_alterada BOOLEAN DEFAULT false;

-- Criar índice para queries rápidas de primeira_senha_alterada
CREATE INDEX IF NOT EXISTS idx_usuarios_primeira_senha_alterada
ON usuarios(primeira_senha_alterada) 
WHERE primeira_senha_alterada = false;

-- Atualizar comentários
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash bcrypt da senha (apenas para RH/Gestor criados via aceite de contrato)';
COMMENT ON COLUMN usuarios.primeira_senha_alterada IS 'true = usuário já alterou sua senha; false = obrigatório trocar na primeira vez';

COMMIT;

-- Verificação
\echo ''
\echo '✓ Migration 1230: Colunas de senha adicionadas com sucesso'
\echo 'Colunas: senha_hash, primeira_senha_alterada'
