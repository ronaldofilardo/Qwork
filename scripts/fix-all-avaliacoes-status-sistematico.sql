-- Script Sistêmico: Corrigir TODAS avaliações concluídas mas com status 'iniciada'
-- Problema: Avaliações com 37 respostas (questionário completo) mas status='iniciada'
-- Causa: Bug na API de finalização que não atualiza o status corretamente
-- Data: 30/01/2026

BEGIN;

-- Configurar variáveis de sessão para auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- 1. IDENTIFICAR todas as avaliações com o problema
CREATE TEMP TABLE avaliacoes_para_corrigir AS
SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status as status_atual,
    a.inicio,
    a.envio,
    COUNT(r.id) as total_respostas,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicas
FROM avaliacoes a
JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.status IN ('iniciada', 'em_andamento')
GROUP BY a.id, a.funcionario_cpf, a.lote_id, a.status, a.inicio, a.envio
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;  -- 37 respostas únicas = questionário completo

-- 2. EXIBIR avaliações que serão corrigidas
SELECT 
    apc.id,
    apc.funcionario_cpf,
    f.nome as funcionario_nome,
    apc.lote_idas lote_codigo,
    apc.status_atual,
    apc.total_respostas,
    apc.respostas_unicas,
    CASE 
        WHEN la.empresa_id IS NOT NULL THEN 'Clínica/RH'
        WHEN la.contratante_id IS NOT NULL THEN 'Entidade'
        ELSE 'Desconhecido'
    END as tipo_lote
FROM avaliacoes_para_corrigir apc
JOIN funcionarios f ON f.cpf = apc.funcionario_cpf
JOIN lotes_avaliacao la ON la.id = apc.lote_id
ORDER BY apc.id;

-- 3. CORRIGIR todas as avaliações identificadas
UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(a.envio, NOW())
FROM avaliacoes_para_corrigir apc
WHERE a.id = apc.id;

-- 4. RELATÓRIO de correções realizadas
SELECT 
    'Total de avaliações corrigidas: ' || COUNT(*) as resultado
FROM avaliacoes_para_corrigir;

-- 5. VERIFICAR resultado final
SELECT 
    apc.id,
    apc.funcionario_cpf,
    f.nome as funcionario_nome,
    a.status as novo_status,
    a.envio as data_envio,
    apc.total_respostasas lote_codigo
FROM avaliacoes_para_corrigir apc
JOIN avaliacoes a ON a.id = apc.id
JOIN funcionarios f ON f.cpf = apc.funcionario_cpf
JOIN lotes_avaliacao la ON la.id = apc.lote_id
ORDER BY apc.id;

-- 6. IMPACTO nos lotes
SELECT 
    la.id as lote_id,
    
    la.titulo,
    la.status as lote_status,
    CASE 
        WHEN la.empresa_id IS NOT NULL THEN 'Clínica/RH'
        WHEN la.contratante_id IS NOT NULL THEN 'Entidade'
        ELSE 'Desconhecido'
    END as tipo_lote,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    COUNT(CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN 1 END) as pendentes
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.id IN (SELECT DISTINCT lote_id FROM avaliacoes_para_corrigir)
GROUP BY la.id,  la.titulo, la.status, la.empresa_id, la.contratante_id
ORDER BY la.id;

COMMIT;

-- 7. Limpeza
DROP TABLE IF EXISTS avaliacoes_para_corrigir;
