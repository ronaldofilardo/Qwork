-- ====================================================================
-- MIGRAÇÃO DE GESTORES: funcionarios → usuarios
-- Data: 05/02/2026
-- Descrição: Migrar gestores de funcionarios para usuarios (fonte de verdade)
-- ====================================================================

BEGIN;

-- 1. Verificar se tabela usuarios existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        RAISE EXCEPTION 'Tabela usuarios não existe. Execute a migração 300 primeiro.';
    END IF;
END $$;

-- 2. Migrar gestores entidade de funcionarios para usuarios
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    senha_hash,
    tipo_usuario,
    contratante_id,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
)
SELECT DISTINCT ON (f.cpf)
    f.cpf,
    f.nome,
    f.email,
    f.senha_hash,
    'gestor'::usuario_tipo_enum AS tipo_usuario,
    f.contratante_id,
    NULL AS clinica_id,
    f.ativo,
    f.criado_em,
    f.atualizado_em
FROM funcionarios f
WHERE f.usuario_tipo = 'gestor'
  AND f.contratante_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.cpf = f.cpf 
        AND u.tipo_usuario = 'gestor'
  )
ORDER BY f.cpf, f.criado_em DESC
ON CONFLICT (cpf) DO UPDATE 
SET 
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    tipo_usuario = EXCLUDED.tipo_usuario,
    contratante_id = EXCLUDED.contratante_id,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- 3. Migrar gestores RH de funcionarios para usuarios
-- Nota: rh → rh (normalização)
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    senha_hash,
    tipo_usuario,
    contratante_id,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
)
SELECT DISTINCT ON (f.cpf)
    f.cpf,
    f.nome,
    f.email,
    f.senha_hash,
    'rh'::usuario_tipo_enum AS tipo_usuario,
    NULL AS contratante_id,
    f.clinica_id,
    f.ativo,
    f.criado_em,
    f.atualizado_em
FROM funcionarios f
WHERE f.usuario_tipo = 'rh'
  AND f.clinica_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.cpf = f.cpf 
        AND u.tipo_usuario = 'rh'
  )
ORDER BY f.cpf, f.criado_em DESC
ON CONFLICT (cpf) DO UPDATE 
SET 
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    tipo_usuario = EXCLUDED.tipo_usuario,
    clinica_id = EXCLUDED.clinica_id,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- 4. Criar usuarios a partir de tomadores sem gestor cadastrado
-- Para entidades sem usuario gestor, usar responsavel_cpf
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    senha_hash,
    tipo_usuario,
    contratante_id,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
)
SELECT
    c.responsavel_cpf,
    c.responsavel_nome,
    c.responsavel_email,
    cs.senha_hash,
    'gestor'::usuario_tipo_enum,
    c.id AS entidade_id,
    NULL AS clinica_id,
    c.ativa AS ativo,
    c.criado_em,
    CURRENT_TIMESTAMP
FROM entidades c
INNER JOIN entidades_senhas cs ON cs.entidade_id = c.id AND cs.cpf = c.responsavel_cpf
WHERE c.tipo = 'entidade'
  AND c.responsavel_cpf IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.entidade_id = c.id
        AND u.tipo_usuario = 'gestor'
  )
ON CONFLICT (cpf) DO UPDATE 
SET 
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    entidade_id = EXCLUDED.entidade_id,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- 5. Para clínicas sem RH, usar responsavel_cpf
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    senha_hash,
    tipo_usuario,
    contratante_id,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
)
SELECT
    c.responsavel_cpf,
    c.responsavel_nome,
    c.responsavel_email,
    cs.senha_hash,
    'rh'::usuario_tipo_enum,
    NULL AS contratante_id,
    cl.id AS clinica_id,
    c.ativa AS ativo,
    c.criado_em,
    CURRENT_TIMESTAMP
FROM entidades c
INNER JOIN entidades_senhas cs ON cs.entidade_id = c.id AND cs.cpf = c.responsavel_cpf
LEFT JOIN clinicas cl ON cl.contratante_id = c.id
WHERE c.tipo = 'clinica'
  AND c.responsavel_cpf IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u
      WHERE (u.clinica_id = cl.id OR (cl.id IS NULL AND u.contratante_id = c.id))
        AND u.tipo_usuario = 'rh'
  )
ON CONFLICT (cpf) DO UPDATE 
SET 
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    clinica_id = EXCLUDED.clinica_id,
    ativo = EXCLUDED.ativo,
    atualizado_em = CURRENT_TIMESTAMP;

-- 6. LOG de auditoria da migração
CREATE TABLE IF NOT EXISTS usuarios_migration_log (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    nome VARCHAR(200),
    tipo_origem VARCHAR(50), -- 'funcionarios' ou 'tomadores'
    tipo_usuario_novo usuario_tipo_enum,
    contratante_id INTEGER,
    clinica_id INTEGER,
    migrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);

-- Registrar migração de funcionarios
INSERT INTO usuarios_migration_log (cpf, nome, tipo_origem, tipo_usuario_novo, contratante_id, clinica_id, observacoes)
SELECT 
    u.cpf,
    u.nome,
    'funcionarios' AS tipo_origem,
    u.tipo_usuario,
    u.contratante_id,
    u.clinica_id,
    'Migrado de funcionarios com usuario_tipo gestor'
FROM usuarios u
WHERE u.tipo_usuario IN ('gestor', 'rh')
  AND EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.cpf = u.cpf 
        AND f.usuario_tipo IN ('gestor', 'rh')
  );

-- Registrar migração de tomadores
INSERT INTO usuarios_migration_log (cpf, nome, tipo_origem, tipo_usuario_novo, contratante_id, clinica_id, observacoes)
SELECT 
    u.cpf,
    u.nome,
    'tomadores' AS tipo_origem,
    u.tipo_usuario,
    u.contratante_id,
    u.clinica_id,
    'Criado a partir de tomadores.responsavel_cpf'
FROM usuarios u
INNER JOIN tomadores c ON c.responsavel_cpf = u.cpf
WHERE u.tipo_usuario IN ('gestor', 'rh')
  AND NOT EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.cpf = u.cpf 
        AND f.usuario_tipo IN ('gestor', 'rh')
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificações pós-migração
SELECT 
    'Total usuarios gestores criados' AS metrica,
    COUNT(*) AS valor
FROM usuarios
WHERE tipo_usuario IN ('gestor', 'rh');

SELECT 
    'Entidades com usuario gestor' AS metrica,
    COUNT(DISTINCT u.contratante_id) AS valor
FROM usuarios u
WHERE u.tipo_usuario = 'gestor'
  AND u.contratante_id IS NOT NULL;

SELECT 
    'Clínicas com usuario RH' AS metrica,
    COUNT(DISTINCT u.clinica_id) AS valor
FROM usuarios u
WHERE u.tipo_usuario = 'rh'
  AND u.clinica_id IS NOT NULL;

-- Listar gaps remanescentes
SELECT 
    'GAPS_REMANESCENTES_ENTIDADES' AS alerta,
    COUNT(*) AS total_entidades_sem_gestor
FROM entidades c
LEFT JOIN usuarios u ON u.entidade_id = c.id AND u.tipo_usuario = 'gestor'
WHERE c.tipo = 'entidade' AND u.id IS NULL;

SELECT 
    'GAPS_REMANESCENTES_CLINICAS' AS alerta,
    COUNT(*) AS total_clinicas_sem_rh
FROM entidades c
LEFT JOIN clinicas cl ON cl.contratante_id = c.id
LEFT JOIN usuarios u ON u.clinica_id = cl.id AND u.tipo_usuario = 'rh'
WHERE c.tipo = 'clinica' AND u.id IS NULL;
