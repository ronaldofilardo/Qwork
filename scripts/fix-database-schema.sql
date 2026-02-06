-- Correção para tabela usuarios - adicionar colunas faltantes
-- Executar sempre que necessário para garantir consistência

-- Adicionar coluna email se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email') THEN
        ALTER TABLE usuarios ADD COLUMN email text;
    END IF;
END $$;

-- Adicionar coluna senha_hash se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'senha_hash') THEN
        ALTER TABLE usuarios ADD COLUMN senha_hash text;
    END IF;
END $$;

-- Adicionar coluna atualizado_em se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'atualizado_em') THEN
        ALTER TABLE usuarios ADD COLUMN atualizado_em timestamp without time zone DEFAULT now();
    END IF;
END $$;

-- Renomear role para tipo_usuario se necessário
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'role') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario') THEN
        ALTER TABLE usuarios RENAME COLUMN role TO tipo_usuario;
    END IF;
END $$;

-- Permitir entidade_id nulo na tabela auditoria
ALTER TABLE auditoria ALTER COLUMN entidade_id DROP NOT NULL;

-- Criar view v_entidades_stats se não existir (renomeada de v_contratantes_stats)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_entidades_stats') THEN
        CREATE VIEW v_entidades_stats AS
        SELECT entidade_id as id, COUNT(*) as funcionarios_ativos
        FROM funcionarios
        WHERE ativo = true
        GROUP BY entidade_id;
    END IF;
END $$;

-- Nota: View renomeada - 'v_contratantes_stats' -> 'v_entidades_stats'