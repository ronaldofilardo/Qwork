-- Script de Correção Sistêmica: Avaliações com 37 respostas não marcadas como concluídas
-- Problema: Avaliações que têm todas as 37 respostas mas status != 'concluida'
-- Causa: Funcionários responderam todas mas não clicaram em "Finalizar" ou bug no processo
-- Impacto: Lotes não mostram botão "Solicitar emissão" e funcionários não veem comprovante

-- ====================================================================================
-- PASSO 1: IDENTIFICAR AVALIAÇÕES PROBLEMÁTICAS
-- ====================================================================================

-- Avaliações com 37+ respostas únicas (grupo, item) mas status != 'concluida'
SELECT 
    a.id,
    a.lote_id,
    a.funcionario_cpf,
    a.status,
    a.inicio,
    a.envio,
    COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicasas lote_codigo,
    la.tipo as lote_tipo,
    la.status as lote_status
FROM avaliacoes a
JOIN lotes_avaliacao la ON la.id = a.lote_id
LEFT JOIN respostas_avaliacao r ON r.avaliacao_id = a.id
WHERE a.status != 'concluida'
  AND a.status != 'inativada'
GROUP BY a.id, a.lote_id, a.funcionario_cpf, a.status, a.inicio, a.envio,  la.tipo, la.status
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
ORDER BY a.id;

-- ====================================================================================
-- PASSO 2: CORRIGIR AVALIAÇÕES COM 37+ RESPOSTAS
-- ====================================================================================

-- Atualizar avaliações para status 'concluida' quando tiverem 37+ respostas únicas
UPDATE avaliacoes a
SET 
    status = 'concluida',
    envio = COALESCE(envio, NOW()),
    atualizado_em = NOW()
WHERE a.id IN (
    SELECT av.id 
    FROM avaliacoes av
    LEFT JOIN respostas_avaliacao r ON r.avaliacao_id = av.id
    WHERE av.status != 'concluida'
      AND av.status != 'inativada'
    GROUP BY av.id
    HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37
)
RETURNING id, lote_id, funcionario_cpf, status, envio;

-- ====================================================================================
-- PASSO 3: RECALCULAR STATUS DOS LOTES AFETADOS
-- ====================================================================================

-- Identificar lotes que devem estar 'concluido' mas não estão
WITH lotes_para_atualizar AS (
    SELECT 
        la.id,
        
        la.status as status_atual,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
    FROM lotes_avaliacao la
    LEFT JOIN avaliacoes a ON a.lote_id = la.id
    WHERE la.status IN ('ativo', 'em_andamento')
    GROUP BY la.id,  la.status
    HAVING COUNT(a.id) > 0 
       AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
)
SELECT * FROM lotes_para_atualizar;

-- Atualizar lotes para status 'concluido' quando todas as avaliações estão concluídas
UPDATE lotes_avaliacao la
SET 
    status = 'concluido',
    atualizado_em = NOW()
WHERE la.id IN (
    SELECT lote_id
    FROM (
        SELECT 
            la2.id as lote_id,
            COUNT(a.id) as total_avaliacoes,
            COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
        FROM lotes_avaliacao la2
        LEFT JOIN avaliacoes a ON a.lote_id = la2.id
        WHERE la2.status IN ('ativo', 'em_andamento')
        GROUP BY la2.id
        HAVING COUNT(a.id) > 0 
           AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)
    ) subq
)
RETURNING id, codigo, status, tipo;

-- ====================================================================================
-- PASSO 4: CRIAR NOTIFICAÇÕES PARA LOTES CONCLUÍDOS
-- ====================================================================================

-- Criar notificações para RH sobre lotes recém-concluídos
INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_cpf,
    destinatario_tipo,
    titulo,
    mensagem,
    lote_id,
    criado_em
)
SELECT 
    'lote_concluido' as tipo,
    'media' as prioridade,
    la.rh_cpf as destinatario_cpf,
    'rh' as destinatario_tipo,
    'Lote de Avaliações Concluído' as titulo,
    'O lote ' || la.codigo || ' foi concluído com ' || 
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = la.id AND status = 'concluida') || 
    ' avaliações finalizadas. Você pode solicitar a emissão do laudo.' as mensagem,
    la.id as lote_id,
    NOW() as criado_em
FROM lotes_avaliacao la
WHERE la.status = 'concluido'
  AND la.tipo = 'clinica'
  AND la.rh_cpf IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM notificacoes n 
      WHERE n.lote_id = la.id 
        AND n.tipo = 'lote_concluido'
        AND n.destinatario_cpf = la.rh_cpf
  );

-- Criar notificações para Gestor Entidade sobre lotes recém-concluídos
INSERT INTO notificacoes (
    tipo,
    prioridade,
    destinatario_cpf,
    destinatario_tipo,
    titulo,
    mensagem,
    lote_id,
    criado_em
)
SELECT 
    'lote_concluido' as tipo,
    'media' as prioridade,
    u.cpf as destinatario_cpf,
    'gestor' as destinatario_tipo,
    'Lote de Avaliações Concluído' as titulo,
    'O lote ' || la.codigo || ' foi concluído com ' || 
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = la.id AND status = 'concluida') || 
    ' avaliações finalizadas. Você pode solicitar a emissão do laudo.' as mensagem,
    la.id as lote_id,
    NOW() as criado_em
FROM lotes_avaliacao la
JOIN usuarios u ON u.contratante_id = la.contratante_id AND u.perfil = 'gestor'
WHERE la.status = 'concluido'
  AND la.tipo = 'entidade'
  AND la.contratante_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM notificacoes n 
      WHERE n.lote_id = la.id 
        AND n.tipo = 'lote_concluido'
        AND n.destinatario_cpf = u.cpf
  );

-- ====================================================================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ====================================================================================

-- Verificar se ainda há avaliações com 37+ respostas não marcadas como concluídas
SELECT 
    COUNT(*) as avaliacoes_problematicas,
    STRING_AGG(a.id::text, ', ') as ids
FROM avaliacoes a
LEFT JOIN respostas_avaliacao r ON r.avaliacao_id = a.id
WHERE a.status != 'concluida'
  AND a.status != 'inativada'
GROUP BY a.id
HAVING COUNT(DISTINCT (r.grupo, r.item)) >= 37;

-- Verificar lotes que deveriam estar concluídos
SELECT 
    la.id,
    
    la.status,
    la.tipo,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.status != 'concluido'
GROUP BY la.id
HAVING COUNT(a.id) > 0 AND COUNT(a.id) = COUNT(CASE WHEN a.status = 'concluida' THEN 1 END);

-- Verificar se as notificações foram criadas
SELECT 
    n.id,
    n.tipo,
    n.destinatario_cpf,
    n.destinatario_tipo,
    n.tituloas lote_codigo,
    n.criado_em
FROM notificacoes n
JOIN lotes_avaliacao la ON la.id = n.lote_id
WHERE n.tipo = 'lote_concluido'
ORDER BY n.criado_em DESC
LIMIT 20;
