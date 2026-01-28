-- Script para deletar todos os dados relacionados a lotes de avaliação
-- Ordem: deletar dependências primeiro

-- Primeiro, marcar avaliações concluídas como inativadas para permitir delete de respostas
UPDATE avaliacoes SET status = 'inativada' WHERE status = 'concluida' AND lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar respostas (antes de deletar avaliações)
DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao));

-- Deletar auditoria de laudos
DELETE FROM auditoria_laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar notificações relacionadas a lotes (se existir coluna lote_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificacoes' AND column_name = 'lote_id') THEN
        EXECUTE 'DELETE FROM notificacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao)';
    END IF;
END $$;

-- Deletar laudos
DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar avaliações
DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar lotes de avaliação
DELETE FROM lotes_avaliacao;

-- Verificar se restou algo
SELECT 'Lotes restantes:' as info, COUNT(*) FROM lotes_avaliacao
UNION ALL
SELECT 'Avaliações restantes:', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'Respostas restantes:', COUNT(*) FROM respostas
UNION ALL
SELECT 'Laudos restantes:', COUNT(*) FROM laudos;