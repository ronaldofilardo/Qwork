-- ==========================================
-- MIGRATION 131: Adicionar colunas emitido_em e enviado_em
-- ==========================================
-- Data: 2026-02-03
-- Descrição: Adiciona colunas para rastreamento de emissão e envio
--            de laudos na tabela lotes_avaliacao
--
-- Colunas adicionadas:
--   - emitido_em: Data/hora em que o laudo foi emitido (PDF gerado + hash)
--   - enviado_em: Data/hora em que o laudo foi enviado para RH/Entidade
--   - hash_pdf: Hash SHA-256 do PDF para integridade
--   - modo_emergencia: Flag para modo emergência
--   - motivo_emergencia: Texto descritivo do motivo da emergência
-- ==========================================

BEGIN;

\echo '=== MIGRATION 131: Adicionando colunas de emissão/envio ==='

-- ==========================================
-- 1. ADICIONAR COLUNAS NA TABELA lotes_avaliacao
-- ==========================================

\echo '1. Adicionando colunas...'

-- Adicionar emitido_em
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'emitido_em'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN emitido_em TIMESTAMPTZ;
        
        RAISE NOTICE '   ✓ Coluna emitido_em adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna emitido_em já existe';
    END IF;
END $$;

-- Adicionar enviado_em
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'enviado_em'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN enviado_em TIMESTAMPTZ;
        
        RAISE NOTICE '   ✓ Coluna enviado_em adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna enviado_em já existe';
    END IF;
END $$;

-- Adicionar hash_pdf (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'hash_pdf'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN hash_pdf VARCHAR(64);
        
        RAISE NOTICE '   ✓ Coluna hash_pdf adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna hash_pdf já existe';
    END IF;
END $$;

-- Adicionar modo_emergencia
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'modo_emergencia'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN modo_emergencia BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '   ✓ Coluna modo_emergencia adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna modo_emergencia já existe';
    END IF;
END $$;

-- Adicionar motivo_emergencia
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'motivo_emergencia'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN motivo_emergencia TEXT;
        
        RAISE NOTICE '   ✓ Coluna motivo_emergencia adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna motivo_emergencia já existe';
    END IF;
END $$;

-- Adicionar setor_id (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'setor_id'
    ) THEN
        ALTER TABLE lotes_avaliacao 
        ADD COLUMN setor_id INTEGER REFERENCES setores(id);
        
        RAISE NOTICE '   ✓ Coluna setor_id adicionada';
    ELSE
        RAISE NOTICE '   ○ Coluna setor_id já existe';
    END IF;
END $$;

\echo '   Colunas adicionadas'

-- ==========================================
-- 2. CRIAR ÍNDICES
-- ==========================================

\echo '2. Criando índices...'

-- Índice para lotes emitidos
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_emitido_em 
ON lotes_avaliacao(id) 
WHERE emitido_em IS NOT NULL;

-- Índice para lotes prontos para emissão (status concluido + não emitido)
CREATE INDEX IF NOT EXISTS idx_lotes_pronto_emissao 
ON lotes_avaliacao(status, emitido_em) 
WHERE status = 'concluido' AND emitido_em IS NULL;

-- Índice para lotes enviados
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_enviado_em 
ON lotes_avaliacao(id) 
WHERE enviado_em IS NOT NULL;

\echo '   Índices criados'

-- ==========================================
-- 3. ADICIONAR COMENTÁRIOS
-- ==========================================

\echo '3. Adicionando comentários...'

COMMENT ON COLUMN lotes_avaliacao.emitido_em IS 
'Data/hora em que o laudo foi emitido (PDF gerado + hash calculado)';

COMMENT ON COLUMN lotes_avaliacao.enviado_em IS 
'Data/hora em que o laudo foi marcado como enviado para RH/Entidade';

COMMENT ON COLUMN lotes_avaliacao.hash_pdf IS 
'Hash SHA-256 do PDF do lote de avaliações, usado para integridade e auditoria';

COMMENT ON COLUMN lotes_avaliacao.modo_emergencia IS 
'Flag que indica se o lote está em modo emergência (permite reprocessamento)';

COMMENT ON COLUMN lotes_avaliacao.motivo_emergencia IS 
'Descrição do motivo pelo qual o lote entrou em modo emergência';

COMMENT ON COLUMN lotes_avaliacao.setor_id IS 
'Setor da empresa ao qual o lote pertence (opcional)';

\echo '   Comentários adicionados'

-- ==========================================
-- 4. MIGRAR DADOS EXISTENTES (se aplicável)
-- ==========================================

\echo '4. Migrando dados existentes...'

-- Se existir a tabela laudos com dados, sincronizar emitido_em
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'laudos') THEN
        -- Atualizar emitido_em baseado na tabela laudos
        UPDATE lotes_avaliacao la
        SET emitido_em = l.emitido_em
        FROM laudos l
        WHERE la.id = l.lote_id
          AND l.emitido_em IS NOT NULL
          AND la.emitido_em IS NULL;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '   ✓ Migrados % registros de emitido_em da tabela laudos', v_count;
        
        -- Atualizar enviado_em se status do laudo for 'enviado'
        UPDATE lotes_avaliacao la
        SET enviado_em = l.atualizado_em
        FROM laudos l
        WHERE la.id = l.lote_id
          AND l.status = 'enviado'
          AND la.enviado_em IS NULL;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        RAISE NOTICE '   ✓ Migrados % registros de enviado_em da tabela laudos', v_count;
    ELSE
        RAISE NOTICE '   ○ Tabela laudos não existe; pulando migração de dados';
    END IF;
END $$;

\echo '   Migração de dados concluída'

-- ==========================================
-- 5. VALIDAÇÃO
-- ==========================================

\echo '5. Validando adição de colunas...'

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar se as colunas foram criadas
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns 
    WHERE table_name = 'lotes_avaliacao' 
    AND column_name IN ('emitido_em', 'enviado_em', 'hash_pdf', 'modo_emergencia', 'motivo_emergencia');
    
    IF v_count < 5 THEN
        RAISE EXCEPTION 'FALHA: Apenas % de 5 colunas esperadas foram criadas', v_count;
    ELSE
        RAISE NOTICE '   ✓ Todas as 5 colunas foram criadas com sucesso';
    END IF;
    
    -- Verificar índices
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes 
    WHERE tablename = 'lotes_avaliacao' 
    AND indexname IN ('idx_lotes_avaliacao_emitido_em', 'idx_lotes_pronto_emissao', 'idx_lotes_avaliacao_enviado_em');
    
    IF v_count < 3 THEN
        RAISE WARNING 'AVISO: Apenas % de 3 índices esperados foram criados', v_count;
    ELSE
        RAISE NOTICE '   ✓ Todos os 3 índices foram criados';
    END IF;
END $$;

COMMIT;

\echo '=== MIGRATION 131: Concluída com sucesso ==='
\echo ''
\echo '✅ Colunas adicionadas:'
\echo '   - emitido_em (TIMESTAMPTZ)'
\echo '   - enviado_em (TIMESTAMPTZ)'
\echo '   - hash_pdf (VARCHAR(64))'
\echo '   - modo_emergencia (BOOLEAN)'
\echo '   - motivo_emergencia (TEXT)'
\echo '   - setor_id (INTEGER)'
\echo ''
\echo '✅ Índices criados para otimização de queries'
\echo '✅ Dados migrados da tabela laudos (se existente)'
\echo ''
