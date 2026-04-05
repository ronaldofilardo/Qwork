-- Migração essencial 300: Apenas criar tabela usuarios e migrar dados
-- Parte crítica para resolver login de gestores

BEGIN;

-- Criar enum se não existir
DO $$ BEGIN
    CREATE TYPE usuario_tipo_enum AS ENUM ('admin', 'emissor', 'rh', 'gestor', 'funcionario_clinica', 'funcionario_entidade');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Renomear tabela antiga se existir
ALTER TABLE IF EXISTS usuarios RENAME TO usuarios_old;

-- Criar nova tabela usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf TEXT NOT NULL UNIQUE,
    nome TEXT,
    email TEXT,
    senha_hash TEXT,
    tipo_usuario usuario_tipo_enum NOT NULL,
    clinica_id INTEGER REFERENCES clinicas(id),
    entidade_id INTEGER REFERENCES entidades(id),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT now(),
    atualizado_em TIMESTAMP DEFAULT now(),

    -- Constraints
    CONSTRAINT usuarios_tipo_check CHECK (
        (tipo_usuario = 'rh' AND clinica_id IS NOT NULL AND entidade_id IS NULL) OR
        (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL) OR
        (tipo_usuario IN ('admin', 'emissor') AND clinica_id IS NULL AND entidade_id IS NULL)
    )
);

-- Criar índices
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_clinica_id ON usuarios(clinica_id);
CREATE INDEX idx_usuarios_entidade_id ON usuarios(entidade_id);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Migrar dados dos usuários do sistema
INSERT INTO usuarios (
    cpf,
    nome,
    email,
    senha_hash,
    tipo_usuario,
    clinica_id,
    entidade_id,
    ativo,
    criado_em,
    atualizado_em
)
SELECT
    cpf,
    nome,
    COALESCE(email, cpf || '@temp.com') as email,
    senha_hash,
    CASE
        WHEN usuario_tipo = 'rh' THEN 'rh'::usuario_tipo_enum
        ELSE usuario_tipo
    END as tipo_usuario,
    CASE
        WHEN usuario_tipo = 'rh' THEN clinica_id
        ELSE NULL
    END as clinica_id,
    CASE
        WHEN usuario_tipo = 'gestor' THEN contratante_id
        ELSE NULL
    END as entidade_id,
    ativo,
    criado_em,
    atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh')
ON CONFLICT (cpf) DO NOTHING;

-- Verificar migração
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM usuarios;
    RAISE NOTICE '✓ Usuários migrados: %', v_count;
END $$;

COMMIT;

-- Verificação final
SELECT
    tipo_usuario,
    COUNT(*) as quantidade,
    COUNT(clinica_id) as com_clinica,
    COUNT(entidade_id) as com_entidade
FROM usuarios
GROUP BY tipo_usuario
ORDER BY tipo_usuario;