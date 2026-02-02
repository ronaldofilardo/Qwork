-- Migration: Remover status 'liberada' (não utilizado)
-- Data: 2026-01-31
-- Descrição: Remove o status 'liberada' do sistema pois:
--            1. O constraint avaliacoes_status_check NÃO permite 'liberada'
--            2. As APIs criam avaliações diretamente com status 'iniciada'
--            3. Mantém apenas: iniciada, em_andamento, concluida, inativada

BEGIN;

-- Verificar se existem avaliações com status 'liberada' (não deveria haver)
DO $$
DECLARE
    count_liberada INTEGER;
BEGIN
    -- Se existir enum status_avaliacao com 'liberada', verificar uso
    IF EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'status_avaliacao' AND e.enumlabel = 'liberada'
    ) THEN
        -- Verificar se há avaliações com esse status
        SELECT COUNT(*) INTO count_liberada
        FROM avaliacoes
        WHERE status::text = 'liberada';
        
        IF count_liberada > 0 THEN
            RAISE EXCEPTION 'Existem % avaliações com status ''liberada''. Migre-as antes de executar.', count_liberada;
        END IF;
        
        RAISE NOTICE 'Status ''liberada'' não está em uso. Prosseguindo com remoção...';
    ELSE
        RAISE NOTICE 'Status ''liberada'' não existe no enum. Nada a fazer.';
    END IF;
END$$;

-- Nota: Não é possível remover valores de um ENUM no PostgreSQL sem recriar o tipo
-- Se necessário remover 'liberada' do enum, use a seguinte estratégia:
-- 1. Criar novo enum sem 'liberada'
-- 2. Converter coluna para o novo enum
-- 3. Dropar enum antigo
-- 
-- Como 'liberada' não está sendo usado (constraint já impede), 
-- deixamos a limpeza do enum para uma manutenção futura se necessário.

-- Atualizar comentário do tipo para refletir status válidos
COMMENT ON TYPE status_avaliacao IS 'Status de avaliações: iniciada (criada/não iniciada), em_andamento (respondendo), concluida (finalizada), inativada (cancelada). Nota: liberada é obsoleto.';

COMMIT;

-- ==========================================
-- NOTAS IMPORTANTES
-- ==========================================
-- 1. O constraint avaliacoes_status_check permite apenas: 'iniciada', 'em_andamento', 'concluida', 'inativada'
-- 2. 'liberada' foi removido de todas as queries e lógica de aplicação
-- 3. Esta migration documenta a mudança sem quebrar compatibilidade
