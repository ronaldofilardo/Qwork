-- Script para corrigir status da avaliação #48
-- CPF: 32556158018
-- Problema: 37 respostas mas status='iniciada', deveria ser 'concluida'
-- Data: 30/01/2026

BEGIN;

-- Configurar variáveis de sessão para auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Verificar estado atual
SELECT 
    a.id,
    a.funcionario_cpf,
    a.status,
    a.inicio,
    a.envio,
    a.lote_id,
    COUNT(r.id) as total_respostas,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.id = 48
GROUP BY a.id, a.funcionario_cpf, a.status, a.inicio, a.envio, a.lote_id;

-- Corrigir status da avaliação #48
UPDATE avaliacoes
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW())
WHERE id = 48
  AND status = 'iniciada';

-- Verificar resultado da correção
SELECT 
    a.id,
    a.funcionario_cpf,
    a.status,
    a.inicio,
    a.envio,
    a.lote_id,
    COUNT(r.id) as total_respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.id = 48
GROUP BY a.id, a.funcionario_cpf, a.status, a.inicio, a.envio, a.lote_id;

-- Verificar impacto no lote
SELECT 
    la.id as lote_id,
    la.codigo,
    la.titulo,
    la.status as lote_status,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    COUNT(CASE WHEN a.status = 'iniciada' THEN 1 END) as iniciadas,
    COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as em_andamento
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.id = (SELECT lote_id FROM avaliacoes WHERE id = 48)
GROUP BY la.id, la.codigo, la.titulo, la.status;

COMMIT;
