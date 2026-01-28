-- ==========================================
-- MIGRATION 007a: Alterações nos ENUMs de Status
-- Parte 1 da refatoração de status e fila de emissão
-- Data: 2025-01-03
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007a: Ajustando ENUMs de status ==='

-- 1.1. Remover ENUMs antigos e criar novos simplificados
DO $$
BEGIN
    -- Dropar views que dependem das colunas status antes de alterar
    DROP VIEW IF EXISTS vw_auditoria_avaliacoes;
    DROP VIEW IF EXISTS vw_auditoria_lotes;
    DROP VIEW IF EXISTS vw_auditoria_laudos;
    DROP VIEW IF EXISTS vw_comparativo_empresas;
    DROP VIEW IF EXISTS vw_dashboard_por_empresa;
    DROP VIEW IF EXISTS vw_funcionarios_por_lote;
    DROP VIEW IF EXISTS vw_lotes_info;
    RAISE NOTICE 'Views dependentes removidas temporariamente';
    
    -- Dropar políticas RLS que dependem da coluna status
    DROP POLICY IF EXISTS lotes_emissor_select ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_funcionario_select ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_clinica ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_insert ON lotes_avaliacao;
    DROP POLICY IF EXISTS lotes_rh_update ON lotes_avaliacao;
    DROP POLICY IF EXISTS laudos_rh_clinica ON laudos;
    RAISE NOTICE 'Políticas RLS dependentes removidas temporariamente';
    
    -- Remover restrições de verificação antigas
    ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;
    ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;
    ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS avaliacoes_status_check;
    
    -- Converter status para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lotes_avaliacao' AND column_name = 'status') THEN
        ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de lotes_avaliacao convertida para TEXT';
    END IF;
    
    -- Converter status_laudo para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'laudos' AND column_name = 'status') THEN
        ALTER TABLE laudos ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de laudos convertida para TEXT';
    END IF;
    
    -- Converter status_avaliacao para TEXT temporariamente
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'avaliacoes' AND column_name = 'status') THEN
        ALTER TABLE avaliacoes ALTER COLUMN status TYPE TEXT;
        RAISE NOTICE 'Coluna status de avaliacoes convertida para TEXT';
    END IF;
    
    -- Dropar ENUMs antigos se existirem
    DROP TYPE IF EXISTS status_lote CASCADE;
    DROP TYPE IF EXISTS status_laudo CASCADE;
    DROP TYPE IF EXISTS status_avaliacao CASCADE;
    RAISE NOTICE 'tipos "status_lote", "status_laudo", "status_avaliacao" não existem, ignorando';
    RAISE NOTICE 'ENUMs antigos removidos';
END $$;

-- Criar novos ENUMs simplificados
CREATE TYPE status_lote AS ENUM ('pendente', 'em_processamento', 'concluido', 'cancelado');
COMMENT ON TYPE status_lote IS 'Status simplificado para lotes de avaliação';

CREATE TYPE status_laudo AS ENUM ('rascunho', 'emitido', 'enviado');
COMMENT ON TYPE status_laudo IS 'Status simplificado para laudos';

CREATE TYPE status_avaliacao AS ENUM ('iniciada', 'em_andamento', 'concluida', 'inativada');
COMMENT ON TYPE status_avaliacao IS 'Status simplificado para avaliações';

\echo '1.1. ENUMs atualizados com sucesso'

-- 1.2. Migrar dados para novos status
DO $$
BEGIN
    -- Atualizar lotes_avaliacao para novos status
    UPDATE lotes_avaliacao SET status = CASE 
        WHEN status = 'rascunho' THEN 'pendente'
        WHEN status = 'ativo' THEN 'pendente'
        WHEN status = 'finalizado' THEN 'concluido'
        WHEN status = 'concluido' THEN 'concluido'
        WHEN status = 'cancelado' THEN 'cancelado'
        ELSE 'pendente'
    END;
    
    -- Atualizar laudos para 'enviado' (único estado válido)
    UPDATE laudos SET status = 'enviado';
    
    -- Atualizar avaliacoes para novos status
    UPDATE avaliacoes SET status = CASE 
        WHEN status = 'iniciada' THEN 'iniciada'
        WHEN status = 'em_andamento' THEN 'em_andamento'
        WHEN status = 'concluida' THEN 'concluida'
        WHEN status = 'inativada' THEN 'inativada'
        ELSE 'iniciada'
    END;
    
    RAISE NOTICE 'Dados migrados para novos status';
END $$;

-- Aplicar novos ENUMs às colunas
-- Dropar índices que usam status antes de alterar tipo
DROP INDEX IF EXISTS idx_lotes_auto_emitir;
DROP INDEX IF EXISTS idx_lotes_status;
DROP INDEX IF EXISTS idx_lotes_clinica_status;
DROP INDEX IF EXISTS idx_laudos_status;
DROP INDEX IF EXISTS idx_avaliacoes_status;

ALTER TABLE lotes_avaliacao ALTER COLUMN status DROP DEFAULT;
ALTER TABLE lotes_avaliacao ALTER COLUMN status TYPE status_lote USING status::status_lote;
ALTER TABLE lotes_avaliacao ALTER COLUMN status SET DEFAULT 'pendente';

ALTER TABLE laudos ALTER COLUMN status DROP DEFAULT;
ALTER TABLE laudos ALTER COLUMN status TYPE status_laudo USING status::status_laudo;
ALTER TABLE laudos ALTER COLUMN status SET DEFAULT 'enviado';

ALTER TABLE avaliacoes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE avaliacoes ALTER COLUMN status TYPE status_avaliacao USING status::status_avaliacao;
ALTER TABLE avaliacoes ALTER COLUMN status SET DEFAULT 'iniciada';

-- Recriar índices após alteração de tipo
CREATE INDEX idx_lotes_auto_emitir ON lotes_avaliacao (auto_emitir_em, status) WHERE auto_emitir_em IS NOT NULL AND status = 'concluido';
CREATE INDEX idx_lotes_status ON lotes_avaliacao (status);
CREATE INDEX idx_lotes_clinica_status ON lotes_avaliacao (clinica_id, status);
CREATE INDEX idx_laudos_status ON laudos (status);
CREATE INDEX idx_avaliacoes_status ON avaliacoes (status);

\echo '1.2. Colunas atualizadas para novos ENUMs'

-- 1.3. Adicionar novas colunas em lotes_avaliacao
ALTER TABLE lotes_avaliacao
  ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencia TEXT,
  ADD COLUMN IF NOT EXISTS processamento_em TIMESTAMP;

COMMENT ON COLUMN lotes_avaliacao.modo_emergencia IS 'Indica se laudo foi emitido via modo emergência';
COMMENT ON COLUMN lotes_avaliacao.motivo_emergencia IS 'Justificativa para uso do modo emergência';
COMMENT ON COLUMN lotes_avaliacao.processamento_em IS 'Timestamp efêmero indicando que emissão está em processamento';

\echo '1.3. Novas colunas adicionadas em lotes_avaliacao'

COMMIT;

\echo '=== MIGRATION 007a: Concluída com sucesso ==='