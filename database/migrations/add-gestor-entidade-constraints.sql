-- Migration: Adicionar suporte para perfil 'gestor_entidade' nas constraints da tabela funcionarios
-- Data: 2025-01-13
-- Motivo: Permitir criação automática de contas de login para gestores de entidades contratantes
--         após confirmação de pagamento

-- Adicionar 'gestor_entidade' ao enum de perfil
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_perfil_check 
  CHECK (perfil IN ('funcionario', 'rh', 'admin', 'emissor', 'gestor_entidade'));

-- Permitir perfil 'gestor_entidade' sem clinica_id/empresa_id
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_check 
  CHECK (
    clinica_id IS NOT NULL 
    OR empresa_id IS NOT NULL 
    OR perfil IN ('emissor', 'gestor_entidade')
  );

-- Permitir nivel_cargo quando perfil='gestor_entidade'
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_nivel_cargo_check 
  CHECK (
    (perfil IN ('admin', 'emissor') AND nivel_cargo IS NULL) 
    OR (perfil IN ('funcionario', 'rh', 'gestor_entidade') AND nivel_cargo IN ('operacional', 'gestao'))
  );
