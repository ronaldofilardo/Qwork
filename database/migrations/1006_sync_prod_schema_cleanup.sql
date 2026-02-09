-- Migration 1006: Sync Prod Schema - Remover Duplicatas e Corrigir Constraints
-- Data: 2026-02-04
-- Problema: Produção tem triggers duplicados e constraints desatualizadas

BEGIN;

-- =====================================================
-- 1. REMOVER TRIGGERS DUPLICADOS
-- =====================================================

-- 1.1. Remover duplicatas de trg_recalc_lote_on_avaliacao_change
DO $$
DECLARE
    trigger_count INT;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_name = 'trg_recalc_lote_on_avaliacao_change'
        AND event_object_table = 'avaliacoes';
    
    IF trigger_count > 1 THEN
        -- Dropar todas as versões
        DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_change ON avaliacoes CASCADE;
        
        -- Recriar uma única versão correta
        CREATE TRIGGER trg_recalc_lote_on_avaliacao_change
            AFTER INSERT OR UPDATE OR DELETE ON avaliacoes
            FOR EACH ROW
            EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();
            
        RAISE NOTICE '✅ Trigger trg_recalc_lote_on_avaliacao_change deduplicated (tinha % instâncias)', trigger_count;
    END IF;
END $$;

-- 1.2. Remover duplicatas de tr_tomadores_sync_status_ativa
DROP TRIGGER IF EXISTS tr_tomadores_sync_status_ativa ON tomadores CASCADE;

-- 1.3. Remover trigger de atualizar_ultima_avaliacao (não existe em dev)
DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON avaliacoes CASCADE;

-- 1.4. Remover trigger sync_personalizado_status (não existe em dev)
DROP TRIGGER IF EXISTS trg_sync_personalizado_status ON contratacao_personalizada CASCADE;

-- =====================================================
-- 2. CORRIGIR CONSTRAINT DE STATUS EM lotes_avaliacao
-- =====================================================

-- Produção tem status antigo: 'ativo', 'cancelado', 'finalizado', 'concluido'
-- Desenvolvimento tem status novo: 'rascunho', 'ativo', 'concluido', 'emissao_solicitada', 'emissao_em_andamento', 'laudo_emitido', 'cancelado', 'finalizado'

ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS lotes_avaliacao_status_check;

ALTER TABLE lotes_avaliacao ADD CONSTRAINT lotes_avaliacao_status_check 
    CHECK (status::text = ANY (ARRAY[
        'rascunho'::character varying,
        'ativo'::character varying,
        'concluido'::character varying,
        'emissao_solicitada'::character varying,
        'emissao_em_andamento'::character varying,
        'laudo_emitido'::character varying,
        'cancelado'::character varying,
        'finalizado'::character varying,
        'em_andamento'::character varying,  -- Adicionar status intermediário
        'liberado'::character varying       -- Status quando liberado mas não concluído
    ]::text[]));

COMMENT ON CONSTRAINT lotes_avaliacao_status_check ON lotes_avaliacao IS 
    'Status válidos para lote de avaliação - sincronizado com desenvolvimento';

-- =====================================================
-- 3. ADICIONAR COLUNAS FALTANTES
-- =====================================================

-- 3.1. Adicionar modo_emergencia e motivo_emergencia em lotes_avaliacao (estão em dev)
ALTER TABLE lotes_avaliacao 
    ADD COLUMN IF NOT EXISTS modo_emergencia BOOLEAN DEFAULT false;

ALTER TABLE lotes_avaliacao 
    ADD COLUMN IF NOT EXISTS motivo_emergencia TEXT;

COMMENT ON COLUMN lotes_avaliacao.modo_emergencia IS 
    'Indica se o lote foi processado em modo emergência';

COMMENT ON COLUMN lotes_avaliacao.motivo_emergencia IS 
    'Motivo da ativação do modo emergência';

-- 3.2. Adicionar colunas de arquivo remoto em laudos (estão em dev)
ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS job_id BIGINT;

ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS arquivo_remoto_provider VARCHAR(255);

ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS arquivo_remoto_bucket VARCHAR(255);

ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS arquivo_remoto_key TEXT;

ALTER TABLE laudos 
    ADD COLUMN IF NOT EXISTS arquivo_remoto_url TEXT;

COMMENT ON COLUMN laudos.job_id IS 
    'ID do job de geração do laudo (referência para rastreamento)';

COMMENT ON COLUMN laudos.arquivo_remoto_provider IS 
    'Provider de armazenamento remoto (s3, backblaze, etc)';

COMMENT ON COLUMN laudos.arquivo_remoto_bucket IS 
    'Bucket/container onde o arquivo está armazenado';

COMMENT ON COLUMN laudos.arquivo_remoto_key IS 
    'Chave/caminho do arquivo no armazenamento remoto';

COMMENT ON COLUMN laudos.arquivo_remoto_url IS 
    'URL completa para acesso ao arquivo remoto';

-- 3.3. Adicionar ultimo_lote_codigo em funcionarios (está em dev)
ALTER TABLE funcionarios 
    ADD COLUMN IF NOT EXISTS ultimo_lote_codigo VARCHAR(255);

COMMENT ON COLUMN funcionarios.ultimo_lote_codigo IS 
    'Código do último lote em que o funcionário participou (desnormalizado para performance)';

-- 3.4. Adicionar contratante_id em empresas_clientes (está em dev, mas NULL permitido)
ALTER TABLE empresas_clientes 
    ADD COLUMN IF NOT EXISTS contratante_id INTEGER REFERENCES tomadores(id);

COMMENT ON COLUMN empresas_clientes.contratante_id IS 
    'ID do contratante (para empresas que pertencem a uma entidade contratante)';

-- =====================================================
-- 4. AJUSTAR COLUNAS EXISTENTES
-- =====================================================

-- 4.1. Permitir NULL em empresas_clientes.clinica_id (dev permite, prod exige NOT NULL)
ALTER TABLE empresas_clientes 
    ALTER COLUMN clinica_id DROP NOT NULL;

COMMENT ON COLUMN empresas_clientes.clinica_id IS 
    'ID da clínica (NULL se empresa pertence a entidade contratante)';

-- 4.2. Alterar default de lotes_avaliacao.id para usar fn_next_lote_id() (como em dev)
-- Verificar se a função existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_next_lote_id') THEN
        ALTER TABLE lotes_avaliacao 
            ALTER COLUMN id SET DEFAULT fn_next_lote_id();
        RAISE NOTICE '✅ Default de lotes_avaliacao.id alterado para fn_next_lote_id()';
    ELSE
        RAISE NOTICE '⚠️ Função fn_next_lote_id() não existe, mantendo default atual';
    END IF;
END $$;

-- =====================================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para melhorar performance de queries comuns
CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_status 
    ON lotes_avaliacao(status) WHERE status != 'cancelado';

CREATE INDEX IF NOT EXISTS idx_avaliacoes_lote_status 
    ON avaliacoes(lote_id, status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id 
    ON audit_logs(resource, resource_id) WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auditoria_laudos_lote_acao 
    ON auditoria_laudos(lote_id, acao) WHERE acao = 'solicitar_emissao';

-- =====================================================
-- 6. VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    v_lotes_count INT;
    v_avaliacoes_count INT;
    v_laudos_count INT;
BEGIN
    SELECT COUNT(*) INTO v_lotes_count FROM lotes_avaliacao;
    SELECT COUNT(*) INTO v_avaliacoes_count FROM avaliacoes;
    SELECT COUNT(*) INTO v_laudos_count FROM laudos;
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE ' MIGRATION 1006 - RESUMO';
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ Triggers duplicados removidos';
    RAISE NOTICE '✅ Constraint de status atualizada';
    RAISE NOTICE '✅ Colunas faltantes adicionadas';
    RAISE NOTICE '✅ Ajustes de schema aplicados';
    RAISE NOTICE '✅ Índices de performance criados';
    RAISE NOTICE '';
    RAISE NOTICE 'Contadores:';
    RAISE NOTICE '  - Lotes: %', v_lotes_count;
    RAISE NOTICE '  - Avaliações: %', v_avaliacoes_count;
    RAISE NOTICE '  - Laudos: %', v_laudos_count;
    RAISE NOTICE '====================================================';
END $$;

COMMIT;
