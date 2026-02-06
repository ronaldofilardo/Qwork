-- ====================================================================
-- RECREATE DROPPED VIEWS
-- Data: 2026-02-06
-- ====================================================================
-- Recriar views que foram dropadas durante a migração 500
-- Agora usando a nova estrutura com funcionarios_entidades e funcionarios_clinicas
-- ====================================================================

BEGIN;

\echo 'Recriando views com nova estrutura...'

-- 1. equipe_administrativa (gestores + emissores)
CREATE OR REPLACE VIEW equipe_administrativa AS
SELECT 
    'gestor' as tipo,
    es.cpf,
    c.nome as organizacao,
    c.id as organizacao_id,
    'entidade' as tipo_organizacao
FROM entidades_senhas es
JOIN contratantes c ON c.id = es.contratante_id
WHERE c.tipo = 'entidade' AND c.ativa = true
UNION ALL
SELECT 
    'rh_clinica' as tipo,
    cs.cpf,
    cl.nome as organizacao,
    cl.id as organizacao_id,
    'clinica' as tipo_organizacao
FROM clinicas_senhas cs
JOIN clinicas cl ON cl.id = cs.clinica_id
WHERE cl.ativa = true;

COMMENT ON VIEW equipe_administrativa IS 'Equipe administrativa: gestores de entidade e RH de clínicas';

-- 2. usuarios_resumo
CREATE OR REPLACE VIEW usuarios_resumo AS
SELECT 
    f.cpf,
    f.nome,
    f.perfil,
    f.usuario_tipo,
    f.ativo,
    fe.contratante_id as entidade_id,
    fc.empresa_id,
    ec.clinica_id
FROM funcionarios f
LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id;

COMMENT ON VIEW usuarios_resumo IS 'Resumo de usuários com seus vínculos organizacionais';

-- 3. vw_comparativo_empresas
CREATE OR REPLACE VIEW vw_comparativo_empresas AS
SELECT 
    ec.id,
    ec.clinica_id,
    ec.nome as nome_empresa,
    cl.nome as nome_clinica,
    COUNT(DISTINCT fc.funcionario_id) as total_funcionarios
FROM empresas_clientes ec
JOIN clinicas cl ON cl.id = ec.clinica_id
LEFT JOIN funcionarios_clinicas fc ON fc.empresa_id = ec.id AND fc.ativo = true
GROUP BY ec.id, ec.clinica_id, ec.nome, cl.nome;

COMMENT ON VIEW vw_comparativo_empresas IS 'Comparativo de empresas com total de funcionários';

-- 4. funcionarios_operacionais
CREATE OR REPLACE VIEW funcionarios_operacionais AS
SELECT 
    f.*,
    fe.contratante_id as entidade_id,
    fc.empresa_id,
    ec.clinica_id
FROM funcionarios f
LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id
WHERE f.perfil = 'funcionario' AND f.ativo = true;

COMMENT ON VIEW funcionarios_operacionais IS 'Funcionários operacionais com vínculos ativos';

-- 5. gestores
CREATE OR REPLACE VIEW gestores AS
SELECT 
    'entidade' as tipo_gestor,
    es.cpf,
    c.nome as nome_organizacao,
    c.id as organizacao_id
FROM entidades_senhas es
JOIN contratantes c ON c.id = es.contratante_id
WHERE c.tipo = 'entidade' AND c.ativa = true
UNION ALL
SELECT 
    'clinica' as tipo_gestor,
    cs.cpf,
    cl.nome as nome_organizacao,
    cl.id as organizacao_id
FROM clinicas_senhas cs
JOIN clinicas cl ON cl.id = cs.clinica_id
WHERE cl.ativa = true;

COMMENT ON VIEW gestores IS 'Todos os gestores (entidade e clínica/RH)';

-- 6. v_contratantes_stats (estatísticas por contratante)
CREATE OR REPLACE VIEW v_contratantes_stats AS
SELECT 
    c.id as contratante_id,
    c.nome,
    c.tipo,
    COUNT(DISTINCT CASE WHEN c.tipo = 'entidade' THEN fe.funcionario_id END) as total_funcionarios_entidade,
    COUNT(DISTINCT CASE WHEN c.tipo = 'clinica' THEN fc.funcionario_id END) as total_funcionarios_clinica
FROM contratantes c
LEFT JOIN funcionarios_entidades fe ON fe.contratante_id = c.id AND fe.ativo = true
LEFT JOIN clinicas cl ON cl.contratante_id = c.id
LEFT JOIN empresas_clientes ec ON ec.clinica_id = cl.id
LEFT JOIN funcionarios_clinicas fc ON fc.empresa_id = ec.id AND fc.ativo = true
GROUP BY c.id, c.nome, c.tipo;

COMMENT ON VIEW v_contratantes_stats IS 'Estatísticas de contratantes';

\echo '✓ Views recriadas com sucesso'

COMMIT;
