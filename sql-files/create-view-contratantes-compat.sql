-- ================================================================
-- CRIAR VIEW contratantes PARA COMPATIBILIDADE
-- Data: 2026-02-06T18:41:25.014Z
-- ================================================================
-- OBJETIVO: Manter compatibilidade com código legacy que usa
-- tabela "contratantes" - agora é uma VIEW que une entidades e clínicas
-- ================================================================

BEGIN;

-- Drop view antiga se existir
DROP VIEW IF EXISTS contratantes CASCADE;

-- Criar VIEW que une entidades e clínicas
CREATE OR REPLACE VIEW contratantes AS
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

COMMENT ON VIEW contratantes IS 'VIEW de compatibilidade: Une entidades e clínicas (ambas são contratantes independentes). Use tabelas específicas para novas queries.';

COMMIT;

-- ================================================================
-- VALIDAÇÃO
-- ================================================================
SELECT 
  tipo,
  COUNT(*) as total
FROM contratantes
GROUP BY tipo
ORDER BY tipo;
