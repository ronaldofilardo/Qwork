-- Script para reverter Lote 13 - 006-310126
-- Deletar laudo emitido erroneamente e voltar lote para estado 'concluido'
-- para permitir ao RH solicitar emissão manual

BEGIN;

-- 1. Buscar informações do lote
SELECT 
    id,
    codigo,
    status,
    empresa_id,
    clinica_id
FROM lotes_avaliacao 
WHERE codigo = '006-310126';

-- 2. Buscar laudo(s) associado(s) ao lote
SELECT 
    l.id as laudo_id,
    l.status as laudo_status,
    l.emitido_em,
    l.enviado_em,
    l.emissor_cpf,
    la.id as lote_id,
    la.codigo as lote_codigo
FROM laudos l
JOIN lotes_avaliacao la ON l.lote_id = la.id
WHERE la.codigo = '006-310126';

-- 3. Deletar o laudo (se existir)
-- CUIDADO: Isso irá deletar permanentemente o laudo
DELETE FROM laudos 
WHERE lote_id IN (
    SELECT id FROM lotes_avaliacao WHERE codigo = '006-310126'
);

-- 4. Atualizar status do lote para 'concluido'
UPDATE lotes_avaliacao
SET 
    status = 'concluido',
    atualizado_em = NOW()
WHERE codigo = '006-310126';

-- 5. Criar notificação para RH informando que lote está pronto para solicitar emissão
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
SELECT 
    'lote_aguardando_solicitacao_emissao',
    'Lote Concluído e Pronto para Emissão',
    'O lote ' || codigo || ' está concluído e aguardando solicitação de emissão do laudo. Acesse o sistema para solicitar a emissão ao emissor.',
    id,
    empresa_id,
    'rh',
    'media',
    false,
    NOW()
FROM lotes_avaliacao
WHERE codigo = '006-310126'
AND NOT EXISTS (
    SELECT 1 FROM notificacoes n 
    WHERE n.lote_id = lotes_avaliacao.id 
    AND n.tipo = 'lote_aguardando_solicitacao_emissao'
    AND n.lida = false
);

-- 6. Verificar resultado final
SELECT 
    la.id,
    la.codigo,
    la.status,
    COUNT(l.id) as laudos_count
FROM lotes_avaliacao la
LEFT JOIN laudos l ON l.lote_id = la.id
WHERE la.codigo = '006-310126'
GROUP BY la.id, la.codigo, la.status;

-- Se tudo estiver correto, execute: COMMIT;
-- Se houver problemas, execute: ROLLBACK;

ROLLBACK; -- Remova esta linha e execute COMMIT; após verificar os resultados
