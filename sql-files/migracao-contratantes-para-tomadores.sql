-- ================================================================
-- MIGRAÇÃO: Atualizar Terminologia "Contratantes" para "Tomadores"
-- Data: 2026-02-06
-- Descrição: Migração para arquitetura segregada entidade/clínica
-- ================================================================
-- OBJETIVO:
-- 1. Remover tabela contratantes_snapshots (não mais necessária)
-- 2. Renomear tabela contratantes para tomadores_legacy (manter por compatibilidade FK)
-- 3. Criar view tomadores que une entidades e clinicas
-- 4. Manter tabelas entidades e clinicas como estruturas primárias
-- ================================================================

BEGIN;

-- ================================================================
-- 1. REMOVER TABELA CONTRATANTES_SNAPSHOTS
-- ================================================================
-- Esta tabela era usada para histórico de cadastros, mas não é mais necessária
-- pois o banco foi limpo e não há dados legados

DROP TABLE IF EXISTS contratantes_snapshots CASCADE;

-- ================================================================
-- 2. RENOMEAR TABELA CONTRATANTES PARA TOMADORES_LEGACY
-- ================================================================
-- A tabela contratantes é mantida como tomadores_legacy para compatibilidade
-- com foreign keys existentes. Gradualmente será substituída por entidades/clinicas

-- Renomear tabela
ALTER TABLE IF EXISTS contratantes RENAME TO tomadores_legacy;

-- Renomear sequence
ALTER SEQUENCE IF EXISTS contratantes_id_seq RENAME TO tomadores_legacy_id_seq;

-- Renomear constraints (primary key)
ALTER TABLE IF EXISTS tomadores_legacy RENAME CONSTRAINT contratantes_pkey1 TO tomadores_legacy_pkey;

-- Adicionar comentário explicativo
COMMENT ON TABLE tomadores_legacy IS 'LEGACY: Tabela antiga de contratantes. Use as tabelas "entidades" ou "clinicas" para novos cadastros. Esta tabela é mantida apenas para compatibilidade com dados existentes.';

-- ================================================================
-- 3. CRIAR VIEW TOMADORES
-- ================================================================
-- A view une entidades e clínicas para uso no dashboard admin
-- "Tomadores" refere-se aos clientes do QWork (entidades ou clínicas)

-- 3. CRIAR VIEW TOMADORES
-- ================================================================
-- A view une entidades e clínicas para uso no dashboard admin
-- "Tomadores" refere-se aos clientes do QWork (entidades ou clínicas)

-- Remover view antiga se existir
DROP VIEW IF EXISTS tomadores CASCADE;

-- Criar view "tomadores" (une entidades e clínicas)
CREATE OR REPLACE VIEW tomadores AS
SELECT 
  id,
  'entidade' as tipo,
  nome,
  cnpj,
  inscricao_estadual,
  email,
  telefone,
  endereco,
  cidade,
  estado,
  cep,
  responsavel_nome,
  responsavel_cpf,
  responsavel_cargo,
  responsavel_email,
  responsavel_celular,
  cartao_cnpj_path,
  contrato_social_path,
  doc_identificacao_path,
  status,
  motivo_rejeicao,
  observacoes_reanalise,
  ativa,
  criado_em,
  atualizado_em,
  aprovado_em,
  aprovado_por_cpf,
  pagamento_confirmado,
  numero_funcionarios_estimado,
  plano_id
FROM entidades
UNION ALL
SELECT 
  id,
  'clinica' as tipo,
  nome,
  cnpj::varchar as cnpj,
  inscricao_estadual,
  email::varchar as email,
  telefone::varchar as telefone,
  endereco,
  cidade::varchar as cidade,
  estado::varchar as estado,
  NULL as cep,
  NULL as responsavel_nome,
  NULL as responsavel_cpf,
  NULL as responsavel_cargo,
  NULL as responsavel_email,
  NULL as responsavel_celular,
  NULL as cartao_cnpj_path,
  NULL as contrato_social_path,
  NULL as doc_identificacao_path,
  NULL::status_aprovacao_enum as status,
  NULL as motivo_rejeicao,
  NULL as observacoes_reanalise,
  ativa,
  criado_em,
  atualizado_em,
  NULL as aprovado_em,
  NULL as aprovado_por_cpf,
  NULL as pagamento_confirmado,
  NULL as numero_funcionarios_estimado,
  NULL as plano_id
FROM clinicas;

COMMENT ON VIEW tomadores IS 'VIEW administrativa: Une entidades e clínicas. Tomadores são os clientes do QWork (podem ser entidades ou clínicas). Use esta view no dashboard admin para listar todos os tomadores do sistema.';

COMMIT;

-- ================================================================
-- VALIDAÇÃO
-- ================================================================
SELECT 
  'tomadores' as view_name,
  tipo,
  COUNT(*) as total
FROM tomadores
GROUP BY tipo
ORDER BY tipo;

SELECT 
  'tomadores_legacy' as table_name,
  tipo,
  COUNT(*) as total
FROM tomadores_legacy
GROUP BY tipo
ORDER BY tipo;

-- ================================================================
-- NOTAS IMPORTANTES:
-- ================================================================
-- • A tabela contratantes_snapshots foi removida
-- • A tabela contratantes foi renomeada para tomadores_legacy
-- • A view tomadores foi criada unindo entidades e clinicas
-- • As tabelas base (entidades e clinicas) permanecem inalteradas
-- • Use entidade_id ou clinica_id nas APIs, não contratante_id
-- • A view tomadores deve ser usada APENAS no dashboard admin
-- • A tabela tomadores_legacy será removida em migração futura
-- ================================================================

