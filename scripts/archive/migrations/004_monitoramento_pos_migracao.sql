-- ====================================================================
-- QUERIES DE MONITORAMENTO PÓS-MIGRAÇÃO
-- Data: 05/02/2026
-- Descrição: Monitorar saúde do sistema após migração de gestores
-- ====================================================================

-- 1. MONITORAMENTO: Contagem de usuários por tipo
SELECT 
    tipo_usuario,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE ativo = true) AS ativos,
    COUNT(*) FILTER (WHERE ativo = false) AS inativos
FROM usuarios
GROUP BY tipo_usuario
ORDER BY tipo_usuario;

-- 2. MONITORAMENTO: Gestores sem vínculo adequado
SELECT 
    'Gestores Entidade sem contratante_id' AS problema,
    COUNT(*) AS total
FROM usuarios
WHERE tipo_usuario = 'gestor'
  AND contratante_id IS NULL

UNION ALL

SELECT 
    'Gestores RH sem clinica_id',
    COUNT(*)
FROM usuarios
WHERE tipo_usuario = 'rh'
  AND clinica_id IS NULL;

-- 3. MONITORAMENTO: Entidades sem gestor em usuarios
SELECT 
    'Entidades sem gestor' AS categoria,
    COUNT(*) AS total,
    string_agg(c.id::text, ', ') AS ids
FROM entidades c
LEFT JOIN usuarios u ON u.entidade_id = c.id AND u.tipo_usuario = 'gestor'
WHERE c.tipo = 'entidade' 
  AND c.ativa = true
  AND u.id IS NULL

UNION ALL

SELECT 
    'Clínicas sem RH',
    COUNT(*),
    string_agg(c.id::text, ', ')
FROM entidades c
LEFT JOIN clinicas cl ON cl.contratante_id = c.id
LEFT JOIN usuarios u ON u.clinica_id = cl.id AND u.tipo_usuario = 'rh'
WHERE c.tipo = 'clinica' 
  AND c.ativa = true
  AND u.id IS NULL;

-- 4. MONITORAMENTO: Gestores duplicados (usuarios + funcionarios)
SELECT 
    u.cpf,
    u.nome AS nome_usuario,
    u.tipo_usuario,
    f.nome AS nome_funcionario,
    f.usuario_tipo AS tipo_funcionario,
    '⚠️  DUPLICADO (remover de funcionarios)' AS alerta
FROM usuarios u
INNER JOIN funcionarios f ON f.cpf = u.cpf
WHERE u.tipo_usuario IN ('gestor', 'rh')
  AND f.usuario_tipo IN ('gestor', 'rh');

-- 5. MONITORAMENTO: Últimas criações de usuarios (últimas 24h)
SELECT 
    id,
    cpf,
    nome,
    email,
    tipo_usuario,
    contratante_id,
    clinica_id,
    ativo,
    criado_em
FROM usuarios
WHERE criado_em >= NOW() - INTERVAL '24 hours'
  AND tipo_usuario IN ('gestor', 'rh')
ORDER BY criado_em DESC;

-- 6. MONITORAMENTO: Logins falhados de gestores (se tabela audit_log existir)
SELECT 
    resource_id AS cpf,
    details,
    COUNT(*) AS tentativas_falhadas,
    MAX(created_at) AS ultima_tentativa
FROM audit_log
WHERE action = 'LOGIN_FAILED'
  AND resource = 'usuarios'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY resource_id, details
HAVING COUNT(*) > 3
ORDER BY tentativas_falhadas DESC;

-- 7. MONITORAMENTO: Lotes criados por gestores (últimos 7 dias)
SELECT 
    l.id AS lote_id,
    l.status,
    l.contratante_id,
    l.clinica_id,
    u.nome AS criado_por,
    u.tipo_usuario AS tipo_gestor,
    l.criado_em
FROM lotes_avaliacao l
LEFT JOIN usuarios u ON (
    (u.contratante_id = l.contratante_id AND u.tipo_usuario = 'gestor') OR
    (u.clinica_id = l.clinica_id AND u.tipo_usuario = 'rh')
)
WHERE l.criado_em >= NOW() - INTERVAL '7 days'
ORDER BY l.criado_em DESC
LIMIT 50;

-- 8. MONITORAMENTO: Solicitações de laudo por gestores (últimos 7 dias)
SELECT 
    COUNT(*) AS total_solicitacoes,
    COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
    COUNT(*) FILTER (WHERE status = 'em_processamento') AS em_processamento,
    COUNT(*) FILTER (WHERE status = 'concluido') AS concluidos
FROM fila_emissao
WHERE data_solicitacao >= NOW() - INTERVAL '7 days';

-- 9. ALERTA: Erros críticos recentes (se existir log de erros)
-- Adaptar de acordo com sua estrutura de logs
/*
SELECT 
    level,
    message,
    timestamp,
    context
FROM application_logs
WHERE level IN ('ERROR', 'CRITICAL')
  AND message ILIKE '%usuario%' OR message ILIKE '%gestor%'
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 20;
*/

-- 10. RESUMO EXECUTIVO
SELECT 
    'Total Usuários Gestores' AS metrica,
    COUNT(*)::text AS valor
FROM usuarios
WHERE tipo_usuario IN ('gestor', 'rh')

UNION ALL

SELECT 
    'Gestores Ativos',
    COUNT(*)::text
FROM usuarios
WHERE tipo_usuario IN ('gestor', 'rh') AND ativo = true

UNION ALL

SELECT 
    'Entidades sem Gestor',
    COUNT(*)::text
FROM (
    SELECT c.id FROM entidades c
    LEFT JOIN usuarios u ON (
        (c.tipo = 'entidade' AND u.entidade_id = c.id AND u.tipo_usuario = 'gestor') OR
        (c.tipo = 'clinica' AND EXISTS (
            SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id AND u.clinica_id = cl.id AND u.tipo_usuario = 'rh'
        ))
    )
    WHERE c.ativa = true AND u.id IS NULL
) AS gaps

UNION ALL

SELECT 
    'Duplicados (usuarios + funcionarios)',
    COUNT(*)::text
FROM usuarios u
INNER JOIN funcionarios f ON f.cpf = u.cpf
WHERE u.tipo_usuario IN ('gestor', 'rh')
  AND f.usuario_tipo IN ('gestor', 'rh');
