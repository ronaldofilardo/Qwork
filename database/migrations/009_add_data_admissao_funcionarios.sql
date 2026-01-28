-- ==========================================
-- MIGRATION 009: Adicionar campo data_admissao aos funcionários
-- Descricao: Campo para registrar quando o funcionário foi admitido na empresa
-- Data: 2025-12-16
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. ADICIONAR COLUNA DATA_ADMISSAO
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'data_admissao') THEN
        ALTER TABLE funcionarios ADD COLUMN data_admissao DATE;
    END IF;
END $$;

-- ==========================================
-- 2. ADICIONAR INDICE PARA PERFORMANCE
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'funcionarios' AND indexname = 'idx_funcionarios_data_admissao') THEN
        CREATE INDEX idx_funcionarios_data_admissao ON funcionarios (data_admissao);
    END IF;
END $$;

-- ==========================================
-- 3. ADICIONAR COMENTARIO
-- ==========================================

COMMENT ON COLUMN funcionarios.data_admissao IS 'Data de admissão do funcionário na empresa';

-- ==========================================
-- 4. ATUALIZAR FUNCIONÁRIOS EXISTENTES COM DATA DE CRIAÇÃO COMO PROXY
-- ==========================================

UPDATE funcionarios
SET data_admissao = criado_em::DATE
WHERE data_admissao IS NULL AND perfil = 'funcionario';

COMMIT;