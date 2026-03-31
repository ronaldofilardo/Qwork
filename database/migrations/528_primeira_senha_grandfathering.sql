-- Migration 528: Grandfathering de gestores existentes
-- Data: 11/03/2026
-- 
-- Propósito: Marcar todos os gestores/RH existentes como já tendo alterado a senha,
-- para que a nova feature de "forçar troca no primeiro acesso" NÃO afete usuários atuais.
-- Apenas novos gestores (criados após este deploy) terão primeira_senha_alterada = false.

-- Entidades (gestores de entidade)
UPDATE entidades_senhas
SET primeira_senha_alterada = true
WHERE primeira_senha_alterada IS DISTINCT FROM true;

-- Clínicas (gestores RH)
UPDATE clinicas_senhas
SET primeira_senha_alterada = true
WHERE primeira_senha_alterada IS DISTINCT FROM true;
