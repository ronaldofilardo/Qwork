-- Migration 018: Padronização de Status - concluida → concluido
-- Data: 2026-02-04
-- Descrição: Padroniza todos os status de 'concluida' (feminino) para 'concluido' (masculino)
--            para consistência entre avaliações, lotes e laudos.

-- IMPORTANTE: Esta migration NÃO altera dados, apenas prepara o sistema para a padronização.
-- A conversão de dados será feita em uma migration separada após validação.

BEGIN;

-- =====================================================
-- 1. BACKUP DE SEGURANÇA (Views para rollback)
-- =====================================================

-- Criar view temporária para auditoria de mudanças
CREATE OR REPLACE VIEW vw_migration_018_audit AS
SELECT 
    'avaliacoes' as tabela,
    COUNT(*) FILTER (WHERE status = 'concluida') as count_concluida,
    COUNT(*) FILTER (WHERE status = 'concluido') as count_concluido,
    COUNT(*) as total
FROM avaliacoes
UNION ALL
SELECT 
    'lotes_avaliacao' as tabela,
    COUNT(*) FILTER (WHERE status = 'concluida') as count_concluida,
    COUNT(*) FILTER (WHERE status = 'concluido') as count_concluido,
    COUNT(*) as total
FROM lotes_avaliacao;

-- =====================================================
-- 2. ATUALIZAR CONSTRAINTS (Permitir ambos temporariamente)
-- =====================================================

-- Avaliações: Adicionar 'concluido' mantendo 'concluida' temporariamente
ALTER TABLE avaliacoes 
DROP CONSTRAINT IF EXISTS avaliacoes_status_check;

ALTER TABLE avaliacoes 
ADD CONSTRAINT avaliacoes_status_check 
CHECK (status IN (
    'rascunho',
    'iniciada', 
    'em_andamento', 
    'concluida',    -- LEGADO: será removido em migration futura
    'concluido',    -- NOVO: padrão
    'inativada'
));

-- =====================================================
-- 3. CRIAR FUNÇÃO DE NORMALIZAÇÃO
-- =====================================================

-- Função para normalizar status legado
CREATE OR REPLACE FUNCTION normalizar_status_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Converter 'concluida' para 'concluido' automaticamente
    IF NEW.status = 'concluida' THEN
        NEW.status := 'concluido';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para normalização automática em INSERT/UPDATE
DROP TRIGGER IF EXISTS trigger_normalizar_status_avaliacao ON avaliacoes;
CREATE TRIGGER trigger_normalizar_status_avaliacao
    BEFORE INSERT OR UPDATE OF status ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION normalizar_status_avaliacao();

-- =====================================================
-- 4. DOCUMENTAÇÃO E METADADOS
-- =====================================================

COMMENT ON CONSTRAINT avaliacoes_status_check ON avaliacoes IS 
'Status válidos para avaliação. ATENÇÃO: concluida é LEGADO, usar concluido.';

COMMENT ON FUNCTION normalizar_status_avaliacao() IS 
'Normaliza automaticamente status legado concluida → concluido';

-- =====================================================
-- 5. LOG DE EXECUÇÃO
-- =====================================================

INSERT INTO audit_logs (
    user_id,
    resource_type,
    resource_id,
    action,
    descricao,
    ip_address,
    user_agent,
    criado_em
) VALUES (
    NULL,
    'system',
    'migration-018',
    'MIGRATION',
    'Migration 018: Preparação para padronização de status concluida → concluido',
    '127.0.0.1',
    'PostgreSQL Migration',
    NOW()
);

COMMIT;

-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- =====================================================

-- Mostrar estatísticas atuais
SELECT 
    'Status atual das avaliações:' as info,
    status,
    COUNT(*) as total
FROM avaliacoes 
GROUP BY status
ORDER BY status;

-- Verificar constraint atualizado
SELECT 
    'Constraint avaliacoes_status_check atualizado:' as info,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'avaliacoes_status_check';
