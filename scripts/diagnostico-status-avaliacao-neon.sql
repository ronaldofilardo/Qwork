-- Script de Diagnóstico: Status de Avaliação
-- Banco: Neon Production
-- Data: 04/02/2026
-- Problema: Dashboard da entidade não atualiza status da avaliação #17 do lote 21

-- ==========================================
-- 1. VERIFICAR STATUS DA AVALIAÇÃO #17
-- ==========================================
\echo '=== 1. STATUS DA AVALIAÇÃO #17 ==='
SELECT 
    a.id,
    a.funcionario_cpf,
    a.lote_id,
    a.status,
    a.inicio,
    a.envio as data_conclusao,
    a.inativada_em,
    a.motivo_inativacao,
    a.criado_em,
    a.atualizado_em,
    f.nome as funcionario_nome
FROM avaliacoes a
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE a.id = 17;

-- ==========================================
-- 2. VERIFICAR TODAS AVALIAÇÕES DO LOTE 21
-- ==========================================
\echo ''
\echo '=== 2. TODAS AVALIAÇÕES DO LOTE 21 ==='
SELECT 
    a.id,
    a.funcionario_cpf,
    a.status,
    a.envio as data_conclusao,
    a.inativada_em,
    f.nome as funcionario_nome
FROM avaliacoes a
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE a.lote_id = 21
ORDER BY a.id;

-- ==========================================
-- 3. VERIFICAR VIEW vw_funcionarios_por_lote
-- ==========================================
\echo ''
\echo '=== 3. VIEW vw_funcionarios_por_lote PARA LOTE 21 ==='
SELECT 
    cpf,
    nome,
    avaliacao_id,
    status_avaliacao,
    data_conclusao,
    data_inicio,
    data_inativacao,
    motivo_inativacao
FROM vw_funcionarios_por_lote
WHERE lote_id = 21;

-- ==========================================
-- 4. VERIFICAR SE VIEW EXISTE E ESTÁ ATUALIZADA
-- ==========================================
\echo ''
\echo '=== 4. DEFINIÇÃO DA VIEW vw_funcionarios_por_lote ==='
SELECT pg_get_viewdef('vw_funcionarios_por_lote'::regclass, true) as view_definition;

-- ==========================================
-- 5. VERIFICAR STATUS DO LOTE 21
-- ==========================================
\echo ''
\echo '=== 5. STATUS DO LOTE 21 ==='
SELECT 
    id,
    status,
    tipo,
    criado_em,
    liberado_em,
    emitido_em,
    contratante_id
FROM lotes_avaliacao
WHERE id = 21;

-- ==========================================
-- 6. VERIFICAR FILA DE EMISSÃO
-- ==========================================
\echo ''
\echo '=== 6. FILA DE EMISSÃO PARA LOTE 21 ==='
SELECT 
    id,
    lote_id,
    solicitado_em,
    solicitado_por,
    processado_em,
    erro
FROM v_fila_emissao
WHERE lote_id = 21;

-- ==========================================
-- 7. VERIFICAR TRIGGER prevent_mutation_during_emission
-- ==========================================
\echo ''
\echo '=== 7. FUNÇÃO prevent_mutation_during_emission ==='
SELECT pg_get_functiondef('prevent_mutation_during_emission'::regproc);

-- ==========================================
-- 8. VERIFICAR SE MIGRATION 099 FOI APLICADA
-- ==========================================
\echo ''
\echo '=== 8. VERIFICAR EXISTÊNCIA DE COLUNA processamento_em ==='
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao' 
AND column_name = 'processamento_em';

-- ==========================================
-- 9. ESTATÍSTICAS DO LOTE (COMO API CALCULA)
-- ==========================================
\echo ''
\echo '=== 9. ESTATÍSTICAS DO LOTE 21 (SIMULANDO API) ==='
SELECT
    COUNT(DISTINCT f.id) as total_funcionarios,
    COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN f.id END) as funcionarios_concluidos,
    COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN f.id END) as funcionarios_pendentes,
    COUNT(DISTINCT CASE WHEN a.status = 'inativada' THEN f.id END) as funcionarios_inativados
FROM avaliacoes a
JOIN funcionarios f ON a.funcionario_cpf = f.cpf
WHERE a.lote_id = 21 AND f.contratante_id = 2;

-- ==========================================
-- 10. VERIFICAR ÚLTIMAS ATUALIZAÇÕES NA AVALIAÇÃO #17
-- ==========================================
\echo ''
\echo '=== 10. AUDIT LOG DA AVALIAÇÃO #17 (se existir) ==='
-- Ajustar query conforme estrutura da tabela de auditoria
SELECT 
    id,
    resource,
    resource_id,
    operacao,
    executado_em,
    executado_por,
    detalhes
FROM auditoria
WHERE resource = 'avaliacoes' 
AND resource_id::text = '17'
ORDER BY executado_em DESC
LIMIT 10;
