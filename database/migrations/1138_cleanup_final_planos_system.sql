-- Migration 1138: Limpeza final do sistema de planos
-- Data: 2026-04-02
-- Descrição: Remove quaisquer artefatos remanescentes do sistema de planos/contratação personalizada
-- IDEMPOTENTE: Pode ser executada múltiplas vezes com segurança

BEGIN;

-- ============================================================================
-- 0. DROP VIEWS dependentes de colunas a remover (recriadas no passo 7)
-- ============================================================================
DROP VIEW IF EXISTS v_relatorio_emissoes;
DROP VIEW IF EXISTS tomadores;
DROP VIEW IF EXISTS tomadors;

-- ============================================================================
-- 1. DROP TABLES (IF EXISTS) - tabelas do sistema de planos removido
-- ============================================================================
DROP TABLE IF EXISTS contratacao_personalizada CASCADE;
DROP TABLE IF EXISTS contratos_planos CASCADE;
DROP TABLE IF EXISTS auditoria_planos CASCADE;
DROP TABLE IF EXISTS historico_contratos_planos CASCADE;
DROP TABLE IF EXISTS payment_links CASCADE;
DROP TABLE IF EXISTS planos CASCADE;

-- ============================================================================
-- 2. DROP COLUMNS (IF EXISTS) - colunas legacy em tabelas mantidas
-- ============================================================================
ALTER TABLE entidades DROP COLUMN IF EXISTS plano_id;
ALTER TABLE entidades DROP COLUMN IF EXISTS plano_tipo;
ALTER TABLE entidades DROP COLUMN IF EXISTS pagamento_confirmado;
ALTER TABLE entidades DROP COLUMN IF EXISTS data_liberacao_login;
ALTER TABLE entidades DROP COLUMN IF EXISTS contrato_aceito;

ALTER TABLE clinicas DROP COLUMN IF EXISTS pagamento_confirmado;

ALTER TABLE contratos DROP COLUMN IF EXISTS plano_id;

-- ============================================================================
-- 3. DROP TYPES (IF EXISTS) - enums legacy
-- ============================================================================
DROP TYPE IF EXISTS tipo_plano CASCADE;
DROP TYPE IF EXISTS tipo_plano_enum CASCADE;

-- ============================================================================
-- 4. DROP VIEWS adicionais que referenciam tabelas/colunas removidas
-- ============================================================================
DROP VIEW IF EXISTS vw_recibos_completos;

-- ============================================================================
-- 5. DROP INDEXES legacy
-- ============================================================================
DROP INDEX IF EXISTS idx_contratos_plano_id;
DROP INDEX IF EXISTS idx_entidades_plano_id;
DROP INDEX IF EXISTS idx_contratos_planos_contrato_id;
DROP INDEX IF EXISTS idx_contratos_planos_plano_id;
DROP INDEX IF EXISTS idx_payment_links_token;
DROP INDEX IF EXISTS idx_payment_links_contrato_id;
DROP INDEX IF EXISTS idx_contratacao_personalizada_entidade_id;
DROP INDEX IF EXISTS idx_entidades_data_liberacao_login;

-- ============================================================================
-- 6. Limpar constraint de templates_contrato (remover 'plano_fixo')
-- ============================================================================

-- Migrar valores legacy para 'padrao' antes de aplicar a constraint
UPDATE templates_contrato
SET tipo_template = 'padrao'
WHERE tipo_template NOT IN ('padrao', 'lote');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'templates_contrato_tipo_template_check'
    AND table_name = 'templates_contrato'
  ) THEN
    ALTER TABLE templates_contrato DROP CONSTRAINT templates_contrato_tipo_template_check;
    ALTER TABLE templates_contrato ADD CONSTRAINT templates_contrato_tipo_template_check 
      CHECK (tipo_template = ANY (ARRAY['padrao'::text, 'lote'::text]));
  END IF;
END $$;

-- ============================================================================
-- 7. RECRIAR view tomadores sem pagamento_confirmado
--    (union de entidades + clinicas, usada em v_relatorio_emissoes)
-- ============================================================================
CREATE OR REPLACE VIEW tomadores AS
  SELECT
    entidades.id,
    entidades.nome,
    entidades.cnpj,
    'entidade'::character varying(20) AS tipo,
    entidades.email,
    entidades.responsavel_nome,
    entidades.responsavel_cpf,
    entidades.responsavel_email,
    entidades.responsavel_celular,
    entidades.ativa,
    entidades.status,
    entidades.numero_funcionarios_estimado,
    entidades.criado_em,
    entidades.atualizado_em
  FROM entidades
  WHERE entidades.id IS NOT NULL
UNION ALL
  SELECT
    clinicas.id,
    clinicas.nome,
    clinicas.cnpj,
    'clinica'::character varying(20) AS tipo,
    clinicas.email,
    clinicas.responsavel_nome,
    clinicas.responsavel_cpf,
    clinicas.responsavel_email,
    clinicas.responsavel_celular,
    clinicas.ativa,
    clinicas.status,
    clinicas.numero_funcionarios_estimado,
    clinicas.criado_em,
    clinicas.atualizado_em
  FROM clinicas
  WHERE clinicas.id IS NOT NULL;

-- ============================================================================
-- 8. RECRIAR v_relatorio_emissoes (depende de tomadores)
-- ============================================================================
CREATE OR REPLACE VIEW v_relatorio_emissoes AS
  SELECT
    l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
    CASE
      WHEN l.clinica_id IS NOT NULL THEN 'clinica'::text
      WHEN l.entidade_id IS NOT NULL THEN 'entidade'::text
      ELSE NULL::text
    END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome,
    l.empresa_id,
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    COUNT(DISTINCT a.id) AS total_avaliacoes,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status::text = 'concluida'::text) AS avaliacoes_concluidas
  FROM lotes_avaliacao l
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN tomadores t ON t.id = l.entidade_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
    LEFT JOIN laudos ld ON ld.lote_id = l.id
    LEFT JOIN avaliacoes a ON a.lote_id = l.id
  GROUP BY
    l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id,
    l.empresa_id, c.nome, t.nome, ec.nome,
    ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;

COMMIT;
