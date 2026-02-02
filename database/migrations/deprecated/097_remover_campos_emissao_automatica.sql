-- =====================================================
-- MIGRAÇÃO 097: REMOVER CAMPOS DE EMISSÃO AUTOMÁTICA
-- Data: 31/01/2026
-- =====================================================
-- 
-- ⚠️ LIMPEZA FINAL: Remover TODOS os resquícios de emissão automática
-- 
-- Campos obsoletos em lotes_avaliacao:
-- - auto_emitir_em: Timestamp de quando laudo seria emitido automaticamente
-- - auto_emitir_agendado: Flag indicando se emissão foi agendada
-- - processamento_em: Timestamp de processamento automático
-- 
-- ❌ ESSES CAMPOS NÃO SÃO MAIS USADOS
-- ✅ EMISSÃO É 100% MANUAL AGORA
-- 
-- =====================================================

BEGIN;

-- 1. REMOVER POLICIES QUE DEPENDEM DE processamento_em
DROP POLICY IF EXISTS lotes_rh_update ON lotes_avaliacao;
DROP POLICY IF EXISTS avaliacoes_own_update ON avaliacoes;

-- 2. REMOVER COLUNAS OBSOLETAS
DO $$
BEGIN
    -- Remover coluna auto_emitir_em se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_em'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS auto_emitir_em CASCADE;
        RAISE NOTICE 'Coluna auto_emitir_em removida';
    END IF;

    -- Remover coluna auto_emitir_agendado se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'auto_emitir_agendado'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS auto_emitir_agendado CASCADE;
        RAISE NOTICE 'Coluna auto_emitir_agendado removida';
    END IF;

    -- Remover coluna processamento_em se existir (CASCADE para remover policies)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'processamento_em'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS processamento_em CASCADE;
        RAISE NOTICE 'Coluna processamento_em removida (com CASCADE)';
    END IF;
END$$;

-- 3. RECRIAR POLICIES SEM REFERÊNCIA A processamento_em
-- Policy para RH atualizar seus próprios lotes
CREATE POLICY lotes_rh_update ON lotes_avaliacao
    FOR UPDATE
    TO PUBLIC
    USING (
        current_user_perfil() = 'rh' 
        AND clinica_id = current_user_clinica_id()
        AND status NOT IN ('finalizado', 'cancelado')
    );

-- Policy para avaliacoes (simplificada, sem referência a processamento_em)
CREATE POLICY avaliacoes_own_update ON avaliacoes
    FOR UPDATE
    TO PUBLIC
    USING (
        funcionario_cpf = current_user_cpf()
        OR current_user_perfil() IN ('admin', 'rh', 'emissor')
    );

-- Registrar auditoria da remoção (usando CPF válido para sistema)
INSERT INTO audit_logs (
    user_cpf, 
    user_perfil, 
    action, 
    resource, 
    resource_id, 
    details
) VALUES (
    '00000000000',
    'system',
    'schema_cleanup',
    'lotes_avaliacao',
    '0',
    'Removidos campos obsoletos de emissão automática: auto_emitir_em, auto_emitir_agendado, processamento_em'
);

COMMIT;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
--
-- Após esta migração, lotes_avaliacao terá apenas:
-- - status: 'ativo', 'concluido', 'cancelado', 'finalizado' (após emissão manual)
-- - emitido_em: Timestamp de quando emissor MANUALMENTE emitiu o laudo
-- - liberado_em, liberado_por: Controle de quem liberou o lote
--
-- NÃO HÁ MAIS:
-- - Campos relacionados a agendamento automático
-- - Timestamps de processamento automático
-- - Flags de emissão pendente
--
-- =====================================================
