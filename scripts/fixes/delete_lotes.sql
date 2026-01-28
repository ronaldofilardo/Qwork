-- Script para deletar todos os dados relacionados a lotes de avaliação
-- Ordem: deletar dependências primeiro

-- Deletar auditoria de laudos
DELETE FROM auditoria_laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar notificações relacionadas a lotes
DELETE FROM notificacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar laudos
DELETE FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao);

-- Deletar respostas
DELETE FROM respostas WHERE avaliacao_id IN (SELECT id FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao));

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