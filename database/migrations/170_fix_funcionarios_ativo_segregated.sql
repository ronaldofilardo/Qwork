-- Migration 170: Corrigir funcionarios.ativo — restaurar flag global para funcionários com vínculos ativos
--
-- Contexto:
--   Antes desta migration, as rotas de inativação (rh/funcionarios/status, entidade/funcionarios/status)
--   gravavam `UPDATE funcionarios SET ativo = false`, tornando o status global.
--   Isso causava: ao importar um funcionário inativo em CNPJ A para CNPJ B, ele aparecia como
--   inativo no CNPJ B (f.ativo = false + fc.ativo = true = false no display).
--
--   A partir desta migration, o status por empresa é gerenciado exclusivamente via:
--     - funcionarios_clinicas.ativo  (para contexto de clínicas / RH)
--     - funcionarios_entidades.ativo (para contexto de entidades / gestor)
--
--   O campo funcionarios.ativo passa a ser reservado para bloqueio sistêmico (admin),
--   não para inativação por empresa.
--
-- Esta migration restaura funcionarios.ativo = true para todos os funcionários que:
--   1. Foram incorretamente definidos como false pelas rotas de status de empresa
--   2. Ainda possuem ao menos um vínculo ativo em funcionarios_clinicas OU funcionarios_entidades
-- ---------------------------------------------------------------------------

-- Restaurar funcionários com vínculo ativo em clínica
UPDATE funcionarios
SET ativo = true
WHERE ativo = false
  AND EXISTS (
    SELECT 1
    FROM funcionarios_clinicas fc
    WHERE fc.funcionario_id = funcionarios.id
      AND fc.ativo = true
  );

-- Restaurar funcionários com vínculo ativo em entidade
UPDATE funcionarios
SET ativo = true
WHERE ativo = false
  AND EXISTS (
    SELECT 1
    FROM funcionarios_entidades fe
    WHERE fe.funcionario_id = funcionarios.id
      AND fe.ativo = true
  );
