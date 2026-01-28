-- =====================================================
-- QUERIES DE DIAGNÓSTICO - EMPRESAS CLIENTES
-- Verificação de integridade, duplicatas e auditoria
-- =====================================================

-- =====================================================
-- 1. VERIFICAÇÃO DE DUPLICATAS DE CNPJ
-- =====================================================

-- 1.1. Encontrar CNPJs duplicados na mesma clínica (VIOLAÇÃO!)
SELECT 
    clinica_id,
    cnpj,
    COUNT(*) as quantidade,
    STRING_AGG(nome, ' | ') as nomes_empresas,
    STRING_AGG(id::text, ', ') as ids
FROM empresas_clientes
GROUP BY clinica_id, cnpj
HAVING COUNT(*) > 1
ORDER BY quantidade DESC, clinica_id;

-- 1.2. Encontrar CNPJs com formatação diferente (antes da normalização)
SELECT 
    clinica_id,
    cnpj,
    LENGTH(cnpj) as tamanho,
    cnpj ~ '^\d{14}$' as apenas_digitos,
    nome
FROM empresas_clientes
WHERE cnpj !~ '^\d{14}$' -- CNPJ não está normalizado (14 dígitos)
ORDER BY clinica_id, cnpj;

-- 1.3. Encontrar CNPJs com tamanho inválido
SELECT 
    id,
    clinica_id,
    nome,
    cnpj,
    LENGTH(cnpj) as tamanho
FROM empresas_clientes
WHERE LENGTH(cnpj) != 14
ORDER BY clinica_id;


-- =====================================================
-- 2. VERIFICAÇÃO DE AUDITORIA
-- =====================================================

-- 2.1. Operações sem contexto de usuário (user_cpf vazio)
SELECT 
    al.id,
    al.table_name,
    al.operation,
    al.record_id,
    al.user_cpf,
    al.user_perfil,
    al.created_at,
    ec.nome as empresa_nome
FROM audit_logs al
LEFT JOIN empresas_clientes ec ON al.record_id = ec.id::text
WHERE al.table_name = 'empresas_clientes'
  AND (al.user_cpf IS NULL OR al.user_cpf = '')
ORDER BY al.created_at DESC
LIMIT 50;

-- 2.2. Empresas criadas/modificadas recentemente COM auditoria
SELECT 
    ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.criado_em,
    al.operation,
    al.user_cpf,
    al.user_perfil,
    al.created_at as auditoria_em
FROM empresas_clientes ec
LEFT JOIN audit_logs al ON al.record_id = ec.id::text 
    AND al.table_name = 'empresas_clientes'
WHERE ec.criado_em >= NOW() - INTERVAL '7 days'
ORDER BY ec.criado_em DESC;

-- 2.3. Contagem de operações auditadas vs não auditadas
SELECT 
    'Com auditoria' as tipo,
    COUNT(DISTINCT ec.id) as quantidade
FROM empresas_clientes ec
INNER JOIN audit_logs al ON al.record_id = ec.id::text
    AND al.table_name = 'empresas_clientes'
    AND al.user_cpf IS NOT NULL
UNION ALL
SELECT 
    'Sem auditoria' as tipo,
    COUNT(DISTINCT ec.id) as quantidade
FROM empresas_clientes ec
LEFT JOIN audit_logs al ON al.record_id = ec.id::text
    AND al.table_name = 'empresas_clientes'
    AND al.user_cpf IS NOT NULL
WHERE al.id IS NULL;

-- 2.4. Histórico completo de auditoria de uma empresa específica
-- SUBSTITUIR {empresa_id} pelo ID desejado
SELECT 
    al.id,
    al.operation,
    al.user_cpf,
    al.user_perfil,
    al.created_at,
    al.old_data::jsonb ->> 'nome' as nome_anterior,
    al.new_data::jsonb ->> 'nome' as nome_novo,
    al.old_data::jsonb ->> 'ativa' as ativa_anterior,
    al.new_data::jsonb ->> 'ativa' as ativa_novo
FROM audit_logs al
WHERE al.table_name = 'empresas_clientes'
  AND al.record_id = '{empresa_id}'
ORDER BY al.created_at DESC;


-- =====================================================
-- 3. VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
-- =====================================================

-- 3.1. Empresas com clinica_id inválido (FK órfã)
SELECT 
    ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id
FROM empresas_clientes ec
LEFT JOIN clinicas c ON ec.clinica_id = c.id
WHERE c.id IS NULL;

-- 3.2. Funcionários de empresas inativas (possível inconsistência)
SELECT 
    f.cpf,
    f.nome as funcionario_nome,
    f.empresa_id,
    ec.nome as empresa_nome,
    ec.ativa as empresa_ativa,
    f.ativo as funcionario_ativo
FROM funcionarios f
INNER JOIN empresas_clientes ec ON f.empresa_id = ec.id
WHERE ec.ativa = false
  AND f.ativo = true
  AND f.perfil = 'funcionario'
ORDER BY ec.nome, f.nome;


-- =====================================================
-- 4. ESTATÍSTICAS GERAIS
-- =====================================================

-- 4.1. Resumo por clínica
SELECT 
    c.id as clinica_id,
    c.nome as clinica_nome,
    COUNT(ec.id) as total_empresas,
    COUNT(CASE WHEN ec.ativa THEN 1 END) as empresas_ativas,
    COUNT(CASE WHEN NOT ec.ativa THEN 1 END) as empresas_inativas
FROM clinicas c
LEFT JOIN empresas_clientes ec ON ec.clinica_id = c.id
GROUP BY c.id, c.nome
ORDER BY total_empresas DESC;

-- 4.2. Empresas com mais funcionários
SELECT 
    ec.id,
    ec.nome as empresa_nome,
    ec.cnpj,
    ec.ativa,
    COUNT(f.cpf) as total_funcionarios,
    COUNT(CASE WHEN f.ativo THEN 1 END) as funcionarios_ativos
FROM empresas_clientes ec
LEFT JOIN funcionarios f ON f.empresa_id = ec.id
GROUP BY ec.id, ec.nome, ec.cnpj, ec.ativa
HAVING COUNT(f.cpf) > 0
ORDER BY total_funcionarios DESC
LIMIT 20;

-- 4.3. Empresas sem funcionários cadastrados
SELECT 
    ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.criado_em,
    ec.ativa
FROM empresas_clientes ec
LEFT JOIN funcionarios f ON f.empresa_id = ec.id
WHERE f.cpf IS NULL
ORDER BY ec.criado_em DESC;


-- =====================================================
-- 5. QUERIES DE CORREÇÃO (USAR COM CUIDADO!)
-- =====================================================

-- 5.1. Remover duplicatas de CNPJ na mesma clínica (mantém a mais antiga)
-- ATENÇÃO: COMENTADO POR SEGURANÇA
/*
DELETE FROM empresas_clientes
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY clinica_id, cnpj 
                ORDER BY criado_em ASC
            ) as rn
        FROM empresas_clientes
    ) sub
    WHERE rn > 1
);
*/

-- 5.2. Normalizar CNPJs existentes (remover formatação)
-- ATENÇÃO: COMENTADO POR SEGURANÇA
/*
UPDATE empresas_clientes
SET cnpj = REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g')
WHERE cnpj !~ '^\d{14}$';
*/


-- =====================================================
-- 6. QUERIES DE MONITORAMENTO (EXECUTAR PERIODICAMENTE)
-- =====================================================

-- 6.1. Operações recentes (últimas 24h)
SELECT 
    al.operation,
    COUNT(*) as quantidade,
    COUNT(DISTINCT al.user_cpf) as usuarios_distintos,
    MAX(al.created_at) as ultima_operacao
FROM audit_logs al
WHERE al.table_name = 'empresas_clientes'
  AND al.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY al.operation
ORDER BY quantidade DESC;

-- 6.2. Taxa de auditoria (% de registros com auditoria)
SELECT 
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN al.id IS NOT NULL THEN ec.id END) / 
        NULLIF(COUNT(DISTINCT ec.id), 0),
        2
    ) as percentual_auditado,
    COUNT(DISTINCT ec.id) as total_empresas,
    COUNT(DISTINCT CASE WHEN al.id IS NOT NULL THEN ec.id END) as empresas_auditadas
FROM empresas_clientes ec
LEFT JOIN audit_logs al ON al.record_id = ec.id::text
    AND al.table_name = 'empresas_clientes';

-- 6.3. Alertas de integridade
SELECT 
    'Duplicatas de CNPJ' as alerta,
    COUNT(*) as quantidade,
    'HIGH' as severidade
FROM (
    SELECT clinica_id, cnpj
    FROM empresas_clientes
    GROUP BY clinica_id, cnpj
    HAVING COUNT(*) > 1
) duplicatas
UNION ALL
SELECT 
    'CNPJs não normalizados' as alerta,
    COUNT(*) as quantidade,
    'MEDIUM' as severidade
FROM empresas_clientes
WHERE cnpj !~ '^\d{14}$'
UNION ALL
SELECT 
    'Registros sem auditoria' as alerta,
    COUNT(*) as quantidade,
    'MEDIUM' as severidade
FROM empresas_clientes ec
LEFT JOIN audit_logs al ON al.record_id = ec.id::text
    AND al.table_name = 'empresas_clientes'
WHERE al.id IS NULL;
