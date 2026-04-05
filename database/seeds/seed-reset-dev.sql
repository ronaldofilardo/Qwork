-- Seed: Reset DEV + Seed de Usuários Base
-- Data: 2026-04-05
-- Ambiente: nr-bps_db (localhost DEV)
--
-- O QUE FAZ:
--   1. Apaga TODOS os dados de negócio (estrutura preservada)
--   2. Insere 3 usuários base:
--        Admin     CPF 00000000000  senha 0000
--        Suporte   CPF 11111111111  senha 1111
--        Comercial CPF 22222222222  senha 2222
--
-- TABELAS PRESERVADAS (dados de sistema/referência):
--   _migration_issues, fk_migration_audit, migration_guidelines,
--   policy_expression_backups, permissions, roles, role_permissions,
--   questao_condicoes, relatorio_templates, templates_contrato

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PARTE 1: TRUNCATE — apaga todos os dados de negócio em cascata
-- =============================================================================

-- CASCADE resolve automaticamente a ordem das FK constraints
TRUNCATE TABLE
  -- Financeiro / Notificações
  auditoria_recibos,
  webhook_logs,
  notificacoes,
  notificacoes_admin,
  notificacoes_traducoes,
  recibos,
  pagamentos,
  tokens_retomada_pagamento,
  logs_admin,

  -- Avaliações / Laudos
  comissoes_laudo,
  laudo_downloads,
  laudo_arquivos_remotos,
  laudo_generation_jobs,
  pdf_jobs,
  emissao_queue,
  fila_emissao,
  auditoria_laudos,
  avaliacao_resets,
  analise_estatistica,
  resultados,
  respostas,
  laudos,
  avaliacoes,
  lotes_avaliacao,
  lote_id_allocator,

  -- Comercial / Entidades
  comissionamento_auditoria,
  vinculos_comissao,
  leads_representante,
  hierarquia_comercial,
  contratos,
  entidades_senhas,
  funcionarios_entidades,

  -- Auditoria / Sessão
  audit_access_denied,
  audit_logs,
  auditoria,
  auditoria_geral,
  session_logs,
  mfa_codes,

  -- Identidade / Clínicas
  funcionarios_clinicas,
  clinicas_empresas,
  clinicas_senhas,
  clinica_configuracoes,
  funcionarios,
  empresas_clientes,

  -- Raízes de negócio
  usuarios,
  entidades,
  representantes,
  clinicas

CASCADE;

-- =============================================================================
-- PARTE 2: SEED — insere usuários base de DEV
-- =============================================================================

BEGIN;

-- Contexto de sessão (exigido por triggers de auditoria)
SET LOCAL app.current_user_cpf    = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Admin  (CPF 00000000000 / senha 0000)
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin',
  'admin@qwork.local',
  'admin'::usuario_tipo_enum,
  crypt('0000', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome          = EXCLUDED.nome,
    email         = EXCLUDED.email,
    tipo_usuario  = EXCLUDED.tipo_usuario,
    senha_hash    = EXCLUDED.senha_hash,
    ativo         = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Suporte  (CPF 11111111111 / senha 1111)
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '11111111111',
  'Suporte',
  'suporte@qwork.local',
  'suporte'::usuario_tipo_enum,
  crypt('1111', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome          = EXCLUDED.nome,
    email         = EXCLUDED.email,
    tipo_usuario  = EXCLUDED.tipo_usuario,
    senha_hash    = EXCLUDED.senha_hash,
    ativo         = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- Comercial  (CPF 22222222222 / senha 2222)
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
VALUES (
  '22222222222',
  'Comercial',
  'comercial@qwork.local',
  'comercial'::usuario_tipo_enum,
  crypt('2222', gen_salt('bf')),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE
SET nome          = EXCLUDED.nome,
    email         = EXCLUDED.email,
    tipo_usuario  = EXCLUDED.tipo_usuario,
    senha_hash    = EXCLUDED.senha_hash,
    ativo         = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

COMMIT;

-- =============================================================================
-- Verificação
-- =============================================================================
SELECT id, cpf, nome, tipo_usuario, ativo FROM usuarios ORDER BY id;
