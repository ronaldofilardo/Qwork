-- Migration 013: Remover estado 'rascunho' dos enums de status
-- Data: 2026-01-15
-- Objetivo: Simplificar máquina de estados para emissão imediata
-- BREAKING CHANGE: Remove estado 'rascunho' de lotes e laudos

-- =====================================================
-- PARTE 1: MIGRAR DADOS EXISTENTES
-- =====================================================

-- Migrar lotes em 'rascunho' para 'ativo'
UPDATE lotes_avaliacao
SET status = 'ativo'
WHERE status = 'rascunho';

-- Migrar laudos em 'rascunho' para 'emitido'
-- (Emissão imediata: laudos não permanecem em rascunho)
UPDATE laudos
SET status = 'emitido', emitido_em = COALESCE(emitido_em, criado_em, NOW())
WHERE status = 'rascunho';

-- =====================================================
-- PARTE 2: REMOVER 'rascunho' DOS ENUMS
-- =====================================================

-- Remover valor 'rascunho' do enum status_lote_enum
ALTER TYPE status_lote_enum RENAME TO status_lote_enum_old;

CREATE TYPE status_lote_enum AS ENUM (
  'ativo',
  'cancelado',
  'finalizado',
  'concluido'
);

-- Atualizar coluna para usar novo enum
ALTER TABLE lotes_avaliacao 
  ALTER COLUMN status TYPE status_lote_enum 
  USING status::text::status_lote_enum;

-- Remover enum antigo
DROP TYPE status_lote_enum_old;

-- Atualizar comentário
COMMENT ON TYPE status_lote_enum IS 'Status de lotes: ativo (em uso), cancelado (cancelado antes de finalizar), finalizado (todas avaliações concluídas), concluido (sinônimo de finalizado)';

-- Remover valor 'rascunho' do enum status_laudo_enum
ALTER TYPE status_laudo_enum RENAME TO status_laudo_enum_old;

CREATE TYPE status_laudo_enum AS ENUM (
  'emitido',
  'enviado'
);

-- Atualizar coluna para usar novo enum
ALTER TABLE laudos
  ALTER COLUMN status TYPE status_laudo_enum
  USING status::text::status_laudo_enum;

-- Remover enum antigo
DROP TYPE status_laudo_enum_old;

-- Atualizar comentário
COMMENT ON TYPE status_laudo_enum IS 'Status de laudos: emitido (gerado automaticamente), enviado (enviado ao cliente)';

-- =====================================================
-- PARTE 3: ATUALIZAR CONSTRAINTS
-- =====================================================

-- Atualizar constraint de check em lotes_avaliacao (se existir como varchar)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name = 'status' 
    AND data_type = 'character varying'
  ) THEN
    -- Se ainda usa varchar, atualizar constraint
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;
    ALTER TABLE lotes_avaliacao ADD CONSTRAINT lotes_avaliacao_status_check
      CHECK (status IN ('ativo', 'cancelado', 'finalizado', 'concluido'));
  END IF;
END $$;

-- Atualizar constraint de check em laudos (se existir como varchar)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'laudos' 
    AND column_name = 'status' 
    AND data_type = 'character varying'
  ) THEN
    -- Se ainda usa varchar, atualizar constraint
    ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;
    ALTER TABLE laudos ADD CONSTRAINT laudos_status_check
      CHECK (status IN ('emitido', 'enviado'));
  END IF;
END $$;

-- =====================================================
-- PARTE 4: ATUALIZAR DEFAULTS
-- =====================================================

-- Atualizar default de status em lotes_avaliacao para 'ativo'
ALTER TABLE lotes_avaliacao 
  ALTER COLUMN status SET DEFAULT 'ativo'::status_lote_enum;

-- Atualizar default de status em laudos para 'emitido'
ALTER TABLE laudos
  ALTER COLUMN status SET DEFAULT 'emitido'::status_laudo_enum;

-- =====================================================
-- PARTE 5: VALIDAÇÃO E AUDITORIA
-- =====================================================

-- Verificar que não existem mais registros com 'rascunho'
DO $$
DECLARE
  lotes_rascunho INTEGER;
  laudos_rascunho INTEGER;
BEGIN
  -- Contar lotes com rascunho (não deveria existir mais)
  SELECT COUNT(*) INTO lotes_rascunho
  FROM lotes_avaliacao
  WHERE status::text = 'rascunho';

  -- Contar laudos com rascunho (não deveria existir mais)
  SELECT COUNT(*) INTO laudos_rascunho
  FROM laudos
  WHERE status::text = 'rascunho';

  IF lotes_rascunho > 0 OR laudos_rascunho > 0 THEN
    RAISE WARNING 'ATENÇÃO: Ainda existem % lotes e % laudos com status rascunho!', lotes_rascunho, laudos_rascunho;
  ELSE
    RAISE NOTICE 'SUCESSO: Nenhum registro com status rascunho encontrado.';
  END IF;
END $$;

-- Registrar migração no log de auditoria (se tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_log') THEN
    INSERT INTO migration_log (version, description, executed_at)
    VALUES (13, 'Remover estado rascunho de lotes e laudos', NOW());
  END IF;
END $$;

-- =====================================================
-- ROLLBACK (APENAS PARA REFERÊNCIA - NÃO EXECUTAR)
-- =====================================================

-- ATENÇÃO: Este rollback não restaura dados migrados
-- É apenas para referência em caso de necessidade de reverter o schema

/*
-- Recriar enums com 'rascunho'
ALTER TYPE status_lote_enum RENAME TO status_lote_enum_new;
CREATE TYPE status_lote_enum AS ENUM ('ativo', 'cancelado', 'finalizado', 'concluido', 'rascunho');
ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE status_lote_enum USING status::text::status_lote_enum;
DROP TYPE status_lote_enum_new;

ALTER TYPE status_laudo_enum RENAME TO status_laudo_enum_new;
CREATE TYPE status_laudo_enum AS ENUM ('rascunho', 'emitido', 'enviado');
ALTER TABLE laudos ALTER COLUMN status TYPE status_laudo_enum USING status::text::status_laudo_enum;
DROP TYPE status_laudo_enum_new;

-- Restaurar defaults
ALTER TABLE lotes_avaliacao ALTER COLUMN status SET DEFAULT 'rascunho'::status_lote_enum;
ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'rascunho'::status_laudo_enum;
*/
