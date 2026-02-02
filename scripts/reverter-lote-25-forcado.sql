-- Reversão FORÇADA do Lote 25 (006-310126)
-- Desabilitar temporariamente a proteção de imutabilidade

BEGIN;

-- 1. Desabilitar triggers de proteção temporariamente
ALTER TABLE laudos DISABLE TRIGGER enforce_laudo_immutability;
ALTER TABLE laudos DISABLE TRIGGER trg_prevent_laudo_lote_id_change;
ALTER TABLE laudos DISABLE TRIGGER audit_laudos;

-- Desabilitar trigger problemática que referencia campo removido
ALTER TABLE lotes_avaliacao DISABLE TRIGGER trigger_prevent_lote_mutation_during_emission;
ALTER TABLE lotes_avaliacao DISABLE TRIGGER audit_lotes_avaliacao;
ALTER TABLE lotes_avaliacao DISABLE TRIGGER prevent_lote_update_after_emission;
ALTER TABLE lotes_avaliacao DISABLE TRIGGER trg_protect_lote_after_emit;

-- 2. Deletar o laudo ID 25
DELETE FROM laudos WHERE id = 25;

-- 3. Reabilitar triggers de proteção
ALTER TABLE laudos ENABLE TRIGGER enforce_laudo_immutability;
ALTER TABLE laudos ENABLE TRIGGER trg_prevent_laudo_lote_id_change;
ALTER TABLE laudos ENABLE TRIGGER audit_laudos;
ALTER TABLE lotes_avaliacao ENABLE TRIGGER trigger_prevent_lote_mutation_during_emission;
ALTER TABLE lotes_avaliacao ENABLE TRIGGER audit_lotes_avaliacao;
ALTER TABLE lotes_avaliacao ENABLE TRIGGER prevent_lote_update_after_emission;
ALTER TABLE lotes_avaliacao ENABLE TRIGGER trg_protect_lote_after_emit;

-- 4. Atualizar lote 25 para status 'concluido'
UPDATE lotes_avaliacao
SET status = 'concluido', 
    atualizado_em = NOW()
WHERE id = 25;

-- 5. Deletar notificações antigas do lote para evitar duplicatas
DELETE FROM notificacoes 
WHERE lote_id = 25 
AND tipo IN ('lote_aguardando_solicitacao_emissao', 'laudo_enviado');

-- 6. Criar nova notificação para RH
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
    'O lote 006-310126 está concluído e aguardando sua solicitação para emissão do laudo. Clique no botão "Solicitar Emissão do Laudo".',
    25, 
    1, 
    'rh', 
    'alta', 
    false, 
    NOW()
);

-- 7. Verificar resultado final
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

-- 8. Verificar notificações
SELECT id, tipo, titulo, criado_em, lida
FROM notificacoes
WHERE lote_id = 25
ORDER BY criado_em DESC
LIMIT 3;

COMMIT;
