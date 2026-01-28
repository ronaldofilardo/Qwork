-- ============================================================================
-- Script para remover emissores inválidos (IDs 21-25) do banco Neon
-- Executar no Neon Console (produção)
-- Data: 2026-01-27
-- ============================================================================

-- 1. VERIFICAR EMISSORES ATUAIS
SELECT 
  id,
  cpf, 
  nome, 
  email, 
  ativo,
  perfil,
  criado_em,
  atualizado_em
FROM funcionarios 
WHERE perfil = 'emissor'
ORDER BY id;

-- 2. VERIFICAR LAUDOS ASSOCIADOS AOS EMISSORES INVÁLIDOS
-- (Importante: não deletar se existirem laudos emitidos por eles)
SELECT 
  emissor_cpf,
  COUNT(*) as total_laudos,
  COUNT(CASE WHEN status = 'emitido' THEN 1 END) as laudos_emitidos
FROM laudos
WHERE emissor_cpf IN (
  SELECT cpf FROM funcionarios WHERE id BETWEEN 21 AND 25 AND perfil = 'emissor'
)
GROUP BY emissor_cpf;

-- 3. DELETAR EMISSORES INVÁLIDOS (IDs 21-25)
-- ATENÇÃO: Só execute se NÃO houver laudos associados!
BEGIN;

-- Primeiro, inativar para segurança
UPDATE funcionarios 
SET ativo = false, 
    atualizado_em = NOW()
WHERE id BETWEEN 21 AND 25 
  AND perfil = 'emissor';

-- Verificar novamente
SELECT id, cpf, nome, ativo 
FROM funcionarios 
WHERE perfil = 'emissor'
ORDER BY id;

-- Se tudo estiver correto, deletar
DELETE FROM funcionarios 
WHERE id BETWEEN 21 AND 25 
  AND perfil = 'emissor'
  AND ativo = false;

-- Confirmar apenas 1 emissor restante
SELECT 
  id,
  cpf, 
  nome, 
  email, 
  ativo,
  COUNT(*) OVER() as total_emissores
FROM funcionarios 
WHERE perfil = 'emissor';

COMMIT;

-- 4. VERIFICAÇÃO FINAL
-- Deve retornar apenas o emissor legítimo (CPF 53051173991)
SELECT 
  cpf, 
  nome, 
  email, 
  ativo,
  criado_em
FROM funcionarios 
WHERE perfil = 'emissor'
ORDER BY criado_em;
