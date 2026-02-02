-- Script de Correção para Banco NEON com Audit Triggers
-- Usa transação para permitir SET LOCAL

BEGIN;

-- Configurar contexto de usuário para os triggers de auditoria
-- Usar CPF fictício válido para operações de sistema
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- ====================================================================================
-- CORREÇÃO DIRETA: Avaliação #85
-- ====================================================================================

\echo '=== CORRIGINDO AVALIAÇÃO #85 ESPECIFICAMENTE ==='

-- Verificar status atual
SELECT 
    a.id,
    a.lote_id,
    a.funcionario_cpf,
    a.status,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicas,
    la.codigo as lote_codigo,
    la.status as lote_status
FROM avaliacoes a
JOIN lotes_avaliacao la ON la.id = a.lote_id
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.id = 85
GROUP BY a.id, a.lote_id, a.funcionario_cpf, a.status, la.codigo, la.status;

-- Atualizar avaliação #85 para concluída
UPDATE avaliacoes
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW()),
    atualizado_em = NOW()
WHERE id = 85
  AND status != 'concluida'
RETURNING id, lote_id, funcionario_cpf, status, envio;

-- ====================================================================================
-- CORREÇÃO DO LOTE 25 (código 006-310126)
-- ====================================================================================

\echo ''
\echo '=== VERIFICANDO STATUS DO LOTE 25 (006-310126) ==='

SELECT 
    la.id,
    la.codigo,
    la.status as status_atual,
    la.tipo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
    COUNT(CASE WHEN a.status = 'iniciada' THEN 1 END) as iniciadas,
    COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as em_andamento,
    COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.id = 25
GROUP BY la.id, la.codigo, la.status, la.tipo;

-- Atualizar lote para 'concluido' se todas as avaliações ativas estiverem concluídas
\echo ''
\echo '=== ATUALIZANDO LOTE 25 PARA CONCLUÍDO (se aplicável) ==='

UPDATE lotes_avaliacao la
SET 
    status = 'concluido',
    atualizado_em = NOW()
WHERE la.id = 25
  AND la.status IN ('ativo', 'em_andamento', 'rascunho')
  AND EXISTS (
    SELECT 1
    FROM avaliacoes a
    WHERE a.lote_id = la.id
      AND a.status NOT IN ('inativada')
    HAVING COUNT(*) > 0
      AND COUNT(*) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
  )
RETURNING id, codigo, status, tipo;

-- ====================================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================================

\echo ''
\echo '=== VERIFICAÇÃO FINAL: Status da Avaliação #85 ==='

SELECT 
    id,
    funcionario_cpf,
    status,
    envio,
    lote_id
FROM avaliacoes
WHERE id = 85;

\echo ''
\echo '=== VERIFICAÇÃO FINAL: Status do Lote 25 ==='

SELECT 
    id,
    codigo,
    status,
    tipo,
    liberado_em,
    atualizado_em
FROM lotes_avaliacao
WHERE id = 25;

\echo ''
\echo '=== VERIFICAÇÃO: Todas as avaliações do Lote 25 ==='

SELECT 
    a.id,
    a.funcionario_cpf,
    a.status,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.lote_id = 25
GROUP BY a.id, a.funcionario_cpf, a.status, a.envio
ORDER BY a.id;

\echo ''
\echo '=== CORREÇÃO ESPECÍFICA CONCLUÍDA! ==='

COMMIT;
