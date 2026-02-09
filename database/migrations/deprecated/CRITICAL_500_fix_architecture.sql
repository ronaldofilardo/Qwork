-- ====================================================================
-- MIGRATION 500: CORREÇÃO CRÍTICA DA ARQUITETURA
-- Data: 2026-02-06
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO: Implementar a arquitetura correta conforme especificação:
--
-- ARQUITETURA CORRETA:
-- 1. tomadores (tipo: 'clinica' ou 'entidade')
-- 2. clinicas (com clinicas_senhas separada)
-- 3. entidades (conceitual, usar tomadores com tipo='entidade')
-- 4. entidades_senhas (senhas de gestores de entidade)
-- 5. clinicas_senhas (senhas de RH de clínica)
-- 6. funcionarios SEM colunas clinica_id, empresa_id, contratante_id
-- 7. Relacionamentos via tabelas intermediárias:
--    - funcionarios_entidades (funcionário -> entidade)
--    - funcionarios_clinicas (funcionário -> empresa -> clínica)
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 500: CORREÇÃO CRÍTICA'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- PARTE 1: CRIAR TABELAS DE SENHAS SEPARADAS
-- ====================================================================

\echo ''
\echo 'PARTE 1: Criando tabelas de senhas separadas...'

-- 1.1 Criar entidades_senhas (para gestores de entidade)
CREATE TABLE IF NOT EXISTS entidades_senhas (
    id SERIAL PRIMARY KEY,
    contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT entidades_senhas_cpf_contratante_unique 
        UNIQUE (cpf, contratante_id)
);

CREATE INDEX IF NOT EXISTS idx_entidades_senhas_cpf ON entidades_senhas(cpf);
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_contratante ON entidades_senhas(contratante_id);

-- Trigger para validar que contratante é tipo 'entidade'
CREATE OR REPLACE FUNCTION validate_entidade_tipo()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tomadores WHERE id = NEW.contratante_id AND tipo = 'entidade') THEN
        RAISE EXCEPTION 'contratante_id % não é do tipo entidade', NEW.contratante_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_entidade_tipo ON entidades_senhas;
CREATE TRIGGER trg_validate_entidade_tipo
BEFORE INSERT OR UPDATE ON entidades_senhas
FOR EACH ROW EXECUTE FUNCTION validate_entidade_tipo();

\echo '✓ Tabela entidades_senhas criada'

-- 1.2 Criar clinicas_senhas (para RH de clínica)
CREATE TABLE IF NOT EXISTS clinicas_senhas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL,
    senha_hash TEXT NOT NULL,
    primeira_senha_alterada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clinicas_senhas_cpf_clinica_unique 
        UNIQUE (cpf, clinica_id)
);

CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_cpf ON clinicas_senhas(cpf);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica ON clinicas_senhas(clinica_id);

\echo '✓ Tabela clinicas_senhas criada'

-- ====================================================================
-- PARTE 2: MIGRAR DADOS DE tomadores_senhas
-- ====================================================================

\echo ''
\echo 'PARTE 2: Migrando dados de tomadores_senhas...'

-- 2.1 Migrar senhas de ENTIDADES
INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
SELECT cs.contratante_id, cs.cpf, cs.senha_hash, cs.primeira_senha_alterada, cs.criado_em, cs.atualizado_em
FROM tomadores_senhas cs
JOIN tomadores c ON c.id = cs.contratante_id
WHERE c.tipo = 'entidade'
ON CONFLICT (cpf, contratante_id) DO NOTHING;

\echo '✓ Senhas de entidades migradas'

-- 2.2 Migrar senhas de CLÍNICAS (RH)
INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em, atualizado_em)
SELECT cl.id, cs.cpf, cs.senha_hash, cs.primeira_senha_alterada, cs.criado_em, cs.atualizado_em
FROM tomadores_senhas cs
JOIN tomadores c ON c.id = cs.contratante_id
JOIN clinicas cl ON cl.contratante_id = c.id
WHERE c.tipo = 'clinica'
ON CONFLICT (cpf, clinica_id) DO NOTHING;

\echo '✓ Senhas de clínicas (RH) migradas'

-- ====================================================================
-- PARTE 3: CRIAR TABELAS DE RELACIONAMENTO
-- ====================================================================

\echo ''
\echo 'PARTE 3: Criando tabelas de relacionamento...'

-- 3.1 Tabela funcionarios_entidades
CREATE TABLE IF NOT EXISTS funcionarios_entidades (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    contratante_id INTEGER NOT NULL REFERENCES tomadores(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo TIMESTAMP,
    CONSTRAINT funcionarios_entidades_unique 
        UNIQUE (funcionario_id, contratante_id)
);

CREATE INDEX IF NOT EXISTS idx_func_entidades_funcionario ON funcionarios_entidades(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_func_entidades_contratante ON funcionarios_entidades(contratante_id);
CREATE INDEX IF NOT EXISTS idx_func_entidades_ativo ON funcionarios_entidades(ativo);

-- Trigger para validar que contratante é tipo 'entidade'
CREATE OR REPLACE FUNCTION validate_funcionario_entidade_tipo()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tomadores WHERE id = NEW.contratante_id AND tipo = 'entidade') THEN
        RAISE EXCEPTION 'contratante_id % não é do tipo entidade', NEW.contratante_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_funcionario_entidade_tipo ON funcionarios_entidades;
CREATE TRIGGER trg_validate_funcionario_entidade_tipo
BEFORE INSERT OR UPDATE ON funcionarios_entidades
FOR EACH ROW EXECUTE FUNCTION validate_funcionario_entidade_tipo();

\echo '✓ Tabela funcionarios_entidades criada'

-- 3.2 Tabela funcionarios_clinicas (através de empresa)
CREATE TABLE IF NOT EXISTS funcionarios_clinicas (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas_clientes(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo TIMESTAMP,
    CONSTRAINT funcionarios_clinicas_unique 
        UNIQUE (funcionario_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_func_clinicas_funcionario ON funcionarios_clinicas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_func_clinicas_empresa ON funcionarios_clinicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_func_clinicas_ativo ON funcionarios_clinicas(ativo);

\echo '✓ Tabela funcionarios_clinicas criada'

-- ====================================================================
-- PARTE 4: MIGRAR RELACIONAMENTOS EXISTENTES
-- ====================================================================

\echo ''
\echo 'PARTE 4: Migrando relacionamentos existentes...'

-- 4.1 Migrar funcionários de ENTIDADES
INSERT INTO funcionarios_entidades (funcionario_id, contratante_id, ativo, data_vinculo)
SELECT f.id, f.contratante_id, f.ativo, f.criado_em
FROM funcionarios f
WHERE f.contratante_id IS NOT NULL
  AND f.clinica_id IS NULL
  AND f.empresa_id IS NULL
  AND EXISTS (SELECT 1 FROM tomadores c WHERE c.id = f.contratante_id AND c.tipo = 'entidade')
ON CONFLICT (funcionario_id, contratante_id) DO NOTHING;

\echo '✓ Funcionários de entidades migrados'

-- 4.2 Migrar funcionários de CLÍNICAS
INSERT INTO funcionarios_clinicas (funcionario_id, empresa_id, ativo, data_vinculo)
SELECT f.id, f.empresa_id, f.ativo, f.criado_em
FROM funcionarios f
WHERE f.empresa_id IS NOT NULL
  AND f.clinica_id IS NOT NULL
ON CONFLICT (funcionario_id, empresa_id) DO NOTHING;

\echo '✓ Funcionários de clínicas migrados'

-- ====================================================================
-- PARTE 5: REMOVER COLUNAS INCORRETAS DE funcionarios
-- ====================================================================

\echo ''
\echo 'PARTE 5: Removendo colunas incorretas de funcionarios...'

-- 5.1 Dropar views que dependem das colunas
DROP VIEW IF EXISTS vw_funcionarios_por_lote CASCADE;
DROP VIEW IF EXISTS vw_audit_trail_por_contratante CASCADE;
DROP VIEW IF EXISTS equipe_administrativa CASCADE;
DROP VIEW IF EXISTS usuarios_resumo CASCADE;

\echo '✓ Views dependentes removidas'

-- 5.2 Dropar policies que dependem das colunas
DROP POLICY IF EXISTS resultados_rh_select ON resultados;

\echo '✓ Policies dependentes removidas'

-- 5.3 Remover constraints que dependem das colunas
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS fk_funcionarios_clinica;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS fk_funcionarios_contratante;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_id_fkey;
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_empresa_id_fkey;

-- 5.4 Remover índices
DROP INDEX IF EXISTS idx_funcionarios_clinica;
DROP INDEX IF EXISTS idx_funcionarios_clinica_id;
DROP INDEX IF EXISTS idx_funcionarios_clinica_empresa;
DROP INDEX IF EXISTS idx_funcionarios_empresa;
DROP INDEX IF EXISTS idx_funcionarios_contratante_id;

-- 5.5 Remover as colunas
ALTER TABLE funcionarios DROP COLUMN IF EXISTS clinica_id CASCADE;
ALTER TABLE funcionarios DROP COLUMN IF EXISTS empresa_id CASCADE;
ALTER TABLE funcionarios DROP COLUMN IF EXISTS contratante_id CASCADE;

\echo '✓ Colunas clinica_id, empresa_id, contratante_id removidas de funcionarios'

-- ====================================================================
-- PARTE 6: CRIAR VIEWS HELPER
-- ====================================================================

\echo ''
\echo 'PARTE 6: Criando views helper...'

-- View para facilitar consultas de funcionários com seus vínculos
CREATE OR REPLACE VIEW vw_funcionarios_completo AS
SELECT 
    f.*,
    -- Vínculo com entidade
    fe.contratante_id as entidade_id,
    fe.ativo as vinculo_entidade_ativo,
    -- Vínculo com clínica (via empresa)
    fc.empresa_id,
    ec.clinica_id,
    fc.ativo as vinculo_clinica_ativo,
    -- Tipo de vínculo
    CASE 
        WHEN fe.id IS NOT NULL THEN 'entidade'
        WHEN fc.id IS NOT NULL THEN 'clinica'
        ELSE NULL
    END as tipo_vinculo
FROM funcionarios f
LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id;

\echo '✓ Views criadas'

-- ====================================================================
-- PARTE 7: COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================================================

\echo ''
\echo 'PARTE 7: Adicionando comentários...'

COMMENT ON TABLE entidades_senhas IS 'Senhas de gestores de entidade. Separada de clinicas_senhas.';
COMMENT ON TABLE clinicas_senhas IS 'Senhas de RH (gestores de clínica). Separada de entidades_senhas.';
COMMENT ON TABLE funcionarios_entidades IS 'Relacionamento funcionário -> entidade (direto).';
COMMENT ON TABLE funcionarios_clinicas IS 'Relacionamento funcionário -> empresa -> clínica.';
COMMENT ON VIEW vw_funcionarios_completo IS 'View helper com todos os vínculos de funcionários.';

\echo '✓ Comentários adicionados'

-- ====================================================================
-- FINALIZAÇÃO
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'MIGRATION 500: CONCLUÍDA COM SUCESSO'
\echo 'Finalizando em:' :current_timestamp
\echo '========================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '1. Atualizar código para usar entidades_senhas e clinicas_senhas'
\echo '2. Atualizar queries de funcionarios para usar as novas tabelas de relacionamento'
\echo '3. Remover referências a tomadores_senhas no código'
\echo ''

COMMIT;
