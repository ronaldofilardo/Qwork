-- Reversão do Lote 25 (006-310126)
-- Deletar laudo emitido erroneamente e voltar status para 'concluido'

BEGIN;

-- 1. Deletar o laudo ID 25
DELETE FROM laudos WHERE id = 25;

-- 2. Atualizar lote 25 para status 'concluido'
UPDATE lotes_avaliacao
SET status = 'concluido', 
    atualizado_em = NOW()
WHERE id = 25;

-- 3. Criar notificação para RH
INSERT INTO notificacoes (
    tipo, 
    titulo, 
    mensagem, 
    lote_id, 
    empresa_id,
    destinatario_tipo, 
    prioridade, 
    lida, 
    criado_em
)
VALUES (
    'lote_aguardando_solicitacao_emissao',
    'Lote Pronto para Emissão',
    'O lote 006-310126 está concluído e aguardando sua solicitação para emissão do laudo.',
    25, 
    1, 
    'rh', 
    'alta', 
    false, 
    NOW()
);

-- 4. Verificar resultado
SELECT 
    la.id, 
    la.codigo, 
    la.status, 
    COUNT(l.id) as laudos_count,
    la.atualizado_em
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.id = 25
GROUP BY la.id, la.codigo, la.status, la.atualizado_em;

COMMIT;
