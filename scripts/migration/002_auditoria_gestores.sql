-- ====================================================================
-- AUDITORIA E INVENTÁRIO - GESTORES
-- Data: 05/02/2026
-- Descrição: Queries para identificar gestores e gaps na migração
-- ====================================================================

-- Validações de esquema: garantir colunas esperadas na tabela `usuarios`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Coluna "tipo_usuario" não encontrada em tabela "usuarios". Execute migration 300 (database/migrations/300_reestruturacao_usuarios_funcionarios.sql) e repita a auditoria.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'contratante_id'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Coluna "contratante_id" não encontrada em tabela "usuarios". Execute migration 300 e repita a auditoria.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'clinica_id'
  ) THEN
    RAISE NOTICE 'ATENÇÃO: Coluna "clinica_id" não encontrada em tabela "usuarios". Execute migration 300 e repita a auditoria.';
  END IF;
END $$;

-- Abortar se coluna crítica ausente para evitar erros subsequentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
  ) THEN
    RAISE EXCEPTION 'ABORT: Coluna "tipo_usuario" ausente em tabela "usuarios". Execute database/migrations/300_reestruturacao_usuarios_funcionarios.sql e repita a auditoria.';
  END IF;
END $$;


-- 1. Verificar se tabela usuarios existe
SELECT 
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'usuarios'
    ) AS tabela_usuarios_existe;

-- 2. Contagem geral
SELECT 
    'funcionarios com usuario_tipo gestor' AS categoria,
    COUNT(*) AS total
FROM funcionarios 
WHERE usuario_tipo IN ('gestor', 'rh');

SELECT 
    'usuarios com tipo gestor' AS categoria,
    COUNT(*) AS total
FROM usuarios 
WHERE tipo_usuario IN ('gestor', 'rh');

-- 3. GESTORES ENTIDADE: contratantes sem usuario vinculado
SELECT 
    c.id AS contratante_id,
    c.tipo,
    c.nome AS contratante_nome,
    c.cnpj,
    c.responsavel_cpf,
    c.responsavel_nome,
    c.responsavel_email,
    c.ativa,
    CASE 
        WHEN u.id IS NULL THEN 'SEM_USUARIO'
        ELSE 'COM_USUARIO'
    END AS status_usuario
FROM entidades c
LEFT JOIN usuarios u ON (
    u.entidade_id = c.id 
    AND u.tipo_usuario = 'gestor'
    AND u.ativo = true
)
WHERE c.tipo = 'entidade'
ORDER BY c.ativa DESC, c.id;

-- 4. GESTORES RH (CLÍNICAS): entidades sem usuario vinculado
SELECT 
    c.id AS contratante_id,
    c.tipo,
    c.nome AS contratante_nome,
    c.cnpj,
    c.responsavel_cpf,
    c.responsavel_nome,
    c.responsavel_email,
    c.ativa,
    CASE 
        WHEN u.id IS NULL THEN 'SEM_USUARIO'
        ELSE 'COM_USUARIO'
    END AS status_usuario
FROM entidades c
LEFT JOIN usuarios u ON (
    u.clinica_id = c.id 
    AND u.tipo_usuario = 'rh'
    AND u.ativo = true
)
WHERE c.tipo = 'clinica'
ORDER BY c.ativa DESC, c.id;

-- 5. GESTORES APENAS EM FUNCIONARIOS (sem correspondente em usuarios)
SELECT 
    f.id AS funcionario_id,
    f.cpf,
    f.nome,
    f.email,
    f.usuario_tipo,
    f.perfil,
    f.contratante_id,
    f.clinica_id,
    f.ativo,
    c.tipo AS contratante_tipo,
    c.nome AS contratante_nome,
    CASE 
        WHEN u.id IS NULL THEN 'NAO_MIGRADO'
        ELSE 'MIGRADO'
    END AS status_migracao
FROM funcionarios f
LEFT JOIN entidades c ON c.id = f.contratante_id
LEFT JOIN usuarios u ON (
    u.cpf = f.cpf 
    AND u.tipo_usuario IN ('gestor', 'rh')
)
WHERE f.usuario_tipo IN ('gestor', 'rh')
ORDER BY status_migracao, f.ativo DESC, f.id;

-- 6. DUPLICADOS: CPFs que existem tanto em funcionarios (gestor) quanto em usuarios
SELECT 
    f.cpf,
    f.nome AS nome_funcionario,
    f.usuario_tipo AS tipo_funcionario,
    f.ativo AS ativo_funcionario,
    u.nome AS nome_usuario,
    u.tipo_usuario AS tipo_usuario,
    u.ativo AS ativo_usuario,
    'DUPLICADO' AS alerta
FROM funcionarios f
INNER JOIN usuarios u ON u.cpf = f.cpf
WHERE f.usuario_tipo IN ('gestor', 'rh')
ORDER BY f.cpf;

-- 7. RESUMO CONSOLIDADO
SELECT 
    'Total Entidades' AS metrica,
    COUNT(*) AS valor
FROM entidades WHERE tipo = 'entidade'
UNION ALL
SELECT 
    'Entidades COM gestor em usuarios',
    COUNT(DISTINCT c.id)
FROM entidades c
INNER JOIN usuarios u ON u.entidade_id = c.id AND u.tipo_usuario = 'gestor'
WHERE c.tipo = 'entidade'
UNION ALL
SELECT 
    'Entidades SEM gestor em usuarios',
    COUNT(DISTINCT c.id)
FROM entidades c
LEFT JOIN usuarios u ON u.entidade_id = c.id AND u.tipo_usuario = 'gestor'
WHERE c.tipo = 'entidade' AND u.id IS NULL
UNION ALL
SELECT 
    'Total Clínicas',
    COUNT(*)
FROM entidades WHERE tipo = 'clinica'
UNION ALL
SELECT 
    'Clínicas COM RH em usuarios',
    COUNT(DISTINCT c.id)
FROM entidades c
INNER JOIN usuarios u ON u.clinica_id = c.id AND u.tipo_usuario = 'rh'
WHERE c.tipo = 'clinica'
UNION ALL
SELECT 
    'Clínicas SEM RH em usuarios',
    COUNT(DISTINCT c.id)
FROM entidades c
LEFT JOIN usuarios u ON u.clinica_id = c.id AND u.tipo_usuario = 'rh'
WHERE c.tipo = 'clinica' AND u.id IS NULL;

-- 8. EXPORTAR PARA CSV (executar individualmente se necessário)
-- \copy (SELECT c.id, c.tipo, c.nome, c.cnpj, c.responsavel_cpf, c.responsavel_nome, c.responsavel_email FROM entidades c LEFT JOIN usuarios u ON (u.entidade_id = c.id AND u.tipo_usuario = 'gestor') WHERE c.tipo = 'entidade' AND u.id IS NULL) TO 'entidades_sem_usuario.csv' WITH CSV HEADER;
-- \copy (SELECT c.id, c.tipo, c.nome, c.cnpj, c.responsavel_cpf, c.responsavel_nome, c.responsavel_email FROM entidades c LEFT JOIN usuarios u ON (u.clinica_id = c.id AND u.tipo_usuario = 'rh') WHERE c.tipo = 'clinica' AND u.id IS NULL) TO 'clinicas_sem_usuario.csv' WITH CSV HEADER;
