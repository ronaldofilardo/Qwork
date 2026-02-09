-- ====================================================================
-- Migration 300: Reestruturação - Separação de Usuários e Funcionários
-- Data: 2026-02-04
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO:
--   Separar claramente usuários do sistema (com acesso) de funcionários
--   (pessoas avaliadas). 
--
--   TABELA usuarios: admin, emissor, gestor, rh
--   TABELA funcionarios: apenas pessoas avaliadas (sem acesso ao sistema)
--
-- IMPORTANTE: 
--   - Fazer BACKUP completo antes de executar
--   - Executar em horário de baixo tráfego
--   - Validar dados após cada fase
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 300: REESTRUTURAÇÃO USUÁRIOS'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- FASE 1: VALIDAÇÕES PRÉ-MIGRAÇÃO
-- ====================================================================

\echo ''
\echo 'FASE 1: Validações pré-migração...'

-- Verificar se enum existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum') THEN
        RAISE EXCEPTION 'ERRO: Enum usuario_tipo_enum não existe. Execute migration 200 primeiro.';
    END IF;
    
    RAISE NOTICE '✓ Enum usuario_tipo_enum existe';
END $$;

-- Verificar se coluna usuario_tipo existe na tabela funcionarios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' 
        AND column_name = 'usuario_tipo'
    ) THEN
        RAISE EXCEPTION 'ERRO: Coluna usuario_tipo não existe em funcionarios';
    END IF;
    
    RAISE NOTICE '✓ Coluna usuario_tipo existe em funcionarios';
END $$;

-- Contar registros por tipo
DO $$
DECLARE
    v_count_admin INTEGER;
    v_count_emissor INTEGER;
    v_count_gestor INTEGER;
    v_count_rh INTEGER;
    v_count_func_clinica INTEGER;
    v_count_func_entidade INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_admin 
    FROM funcionarios WHERE usuario_tipo = 'admin';
    
    SELECT COUNT(*) INTO v_count_emissor 
    FROM funcionarios WHERE usuario_tipo = 'emissor';
    
    SELECT COUNT(*) INTO v_count_gestor 
    FROM funcionarios WHERE usuario_tipo = 'gestor';
    
    SELECT COUNT(*) INTO v_count_rh 
    FROM funcionarios WHERE usuario_tipo = 'rh';
    
    SELECT COUNT(*) INTO v_count_func_clinica 
    FROM funcionarios WHERE usuario_tipo = 'funcionario_clinica';
    
    SELECT COUNT(*) INTO v_count_func_entidade 
    FROM funcionarios WHERE usuario_tipo = 'funcionario_entidade';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Contagem atual:';
    RAISE NOTICE '  - Admin: %', v_count_admin;
    RAISE NOTICE '  - Emissor: %', v_count_emissor;
    RAISE NOTICE '  - Gestor Entidade: %', v_count_gestor;
    RAISE NOTICE '  - RH (rh): %', v_count_rh;
    RAISE NOTICE '  - Funcionário Clínica: %', v_count_func_clinica;
    RAISE NOTICE '  - Funcionário Entidade: %', v_count_func_entidade;
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- FASE 2: CRIAR TABELA USUARIOS (NOVA ESTRUTURA)
-- ====================================================================

\echo ''
\echo 'FASE 2: Criando tabela usuarios...'

-- Dropar tabela antiga se existir (CUIDADO!)
DROP TABLE IF EXISTS usuarios_old CASCADE;

-- Renomear tabela antiga usuarios para usuarios_old (backup)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'usuarios') THEN
        ALTER TABLE usuarios RENAME TO usuarios_old;
        RAISE NOTICE '✓ Tabela usuarios antiga renomeada para usuarios_old';
    END IF;
END $$;

-- Criar nova tabela usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario usuario_tipo_enum NOT NULL,
    clinica_id INTEGER,
    entidade_id INTEGER,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints
    CONSTRAINT usuarios_tipo_check CHECK (
        tipo_usuario IN ('admin', 'emissor', 'gestor', 'rh')
    ),
    
    -- Admin e Emissor não têm vinculação
    CONSTRAINT usuarios_admin_emissor_check CHECK (
        (tipo_usuario IN ('admin', 'emissor') AND clinica_id IS NULL AND entidade_id IS NULL) OR
        (tipo_usuario NOT IN ('admin', 'emissor'))
    ),
    
    -- RH deve ter clinica_id e não entidade_id
    CONSTRAINT usuarios_rh_check CHECK (
        (tipo_usuario = 'rh' AND clinica_id IS NOT NULL AND entidade_id IS NULL) OR
        (tipo_usuario != 'rh')
    ),
    
    -- Gestor Entidade deve ter entidade_id e não clinica_id
    CONSTRAINT usuarios_gestor_check CHECK (
        (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL) OR
        (tipo_usuario != 'gestor')
    ),
    
    -- Foreign Keys
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE RESTRICT,
    FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE RESTRICT
);

-- Índices para performance
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_clinica_id ON usuarios(clinica_id) WHERE clinica_id IS NOT NULL;
CREATE INDEX idx_usuarios_entidade_id ON usuarios(entidade_id) WHERE entidade_id IS NOT NULL;
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);

-- Comentários
COMMENT ON TABLE usuarios IS 
'Usuários com acesso ao sistema: admin, emissor, gestor, rh.
Separados da tabela funcionarios que contém apenas pessoas avaliadas.';

COMMENT ON COLUMN usuarios.tipo_usuario IS 
'Tipo de usuário: admin (sistema), emissor (laudos), gestor (empresa), rh (clínica)';

COMMENT ON COLUMN usuarios.clinica_id IS 
'ID da clínica para usuários RH (obrigatório para tipo_usuario=rh)';

COMMENT ON COLUMN usuarios.entidade_id IS 
'ID da entidade para gestores (obrigatório para tipo_usuario=gestor)';

\echo '✓ Tabela usuarios criada com sucesso'

-- ====================================================================
-- FASE 3: MIGRAR DADOS DE FUNCIONARIOS PARA USUARIOS
-- ====================================================================

\echo ''
\echo 'FASE 3: Migrando dados para tabela usuarios...'

-- Migrar usuários do sistema (admin, emissor, gestor, rh)
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
    COALESCE(email, cpf || '@temp.com') as email, -- Garantir email não nulo
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
    v_migrated INTEGER;
    v_expected INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_migrated FROM usuarios;
    SELECT COUNT(*) INTO v_expected FROM funcionarios 
    WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');
    
    IF v_migrated = v_expected THEN
        RAISE NOTICE '✓ Migração concluída: % usuários migrados', v_migrated;
    ELSE
        RAISE WARNING '⚠ ATENÇÃO: Esperado %, migrado %', v_expected, v_migrated;
    END IF;
END $$;

-- ====================================================================
-- FASE 4: CRIAR TABELA DE AUDITORIA DA MIGRAÇÃO
-- ====================================================================

\echo ''
\echo 'FASE 4: Criando tabela de auditoria...'

CREATE TABLE IF NOT EXISTS usuarios_migracao_log (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) NOT NULL,
    nome VARCHAR(200),
    usuario_tipo_antigo VARCHAR(50),
    tipo_usuario_novo usuario_tipo_enum,
    origem VARCHAR(20), -- 'funcionarios' ou 'usuarios_old'
    migrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);

-- Registrar migração
INSERT INTO usuarios_migracao_log (cpf, nome, usuario_tipo_antigo, tipo_usuario_novo, origem)
SELECT 
    cpf, 
    nome,
    usuario_tipo::text,
    CASE 
        WHEN usuario_tipo = 'rh' THEN 'rh'::usuario_tipo_enum
        ELSE usuario_tipo
    END,
    'funcionarios'
FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

\echo '✓ Log de auditoria criado'

-- ====================================================================
-- FASE 5: LIMPAR TABELA FUNCIONARIOS (REMOVER USUÁRIOS DO SISTEMA)
-- ====================================================================

\echo ''
\echo 'FASE 5: Limpando tabela funcionarios...'

-- Criar backup antes de deletar
CREATE TABLE IF NOT EXISTS funcionarios_backup_pre_300 AS
SELECT * FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

\echo '✓ Backup criado: funcionarios_backup_pre_300'

-- Deletar usuários do sistema da tabela funcionarios
DELETE FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');

-- Verificar deleção
DO $$
DECLARE
    v_deleted INTEGER;
    v_remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_deleted FROM funcionarios_backup_pre_300;
    SELECT COUNT(*) INTO v_remaining FROM funcionarios 
    WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');
    
    IF v_remaining = 0 THEN
        RAISE NOTICE '✓ Limpeza concluída: % registros removidos', v_deleted;
    ELSE
        RAISE WARNING '⚠ ATENÇÃO: Ainda existem % usuários do sistema em funcionarios', v_remaining;
    END IF;
END $$;

-- ====================================================================
-- FASE 6: AJUSTAR ESTRUTURA DA TABELA FUNCIONARIOS
-- ====================================================================

\echo ''
\echo 'FASE 6: Ajustando estrutura de funcionarios...'

-- Remover colunas desnecessárias (senhas, perfis antigos)
DO $$
BEGIN
    -- Senha não é mais necessária (funcionários não fazem login)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' AND column_name = 'senha_hash'
    ) THEN
        ALTER TABLE funcionarios DROP COLUMN senha_hash;
        RAISE NOTICE '✓ Coluna senha_hash removida de funcionarios';
    END IF;
    
    -- Perfil antigo não é mais usado
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' AND column_name = 'perfil'
    ) THEN
        ALTER TABLE funcionarios DROP COLUMN perfil;
        RAISE NOTICE '✓ Coluna perfil removida de funcionarios';
    END IF;
END $$;

-- Atualizar constraint de usuario_tipo (agora só aceita funcionários)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_usuario_tipo_check;

ALTER TABLE funcionarios 
ADD CONSTRAINT funcionarios_usuario_tipo_check CHECK (
    usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')
);

-- Garantir que funcionários tenham vinculação (empresa ou entidade, nunca ambos)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_vinculo_check;

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_vinculo_check CHECK (
    (empresa_id IS NOT NULL AND contratante_id IS NULL) OR
    (empresa_id IS NULL AND contratante_id IS NOT NULL)
);

COMMENT ON TABLE funcionarios IS 
'Funcionários que são avaliados pelo sistema (NÃO têm acesso de login).
Inclui funcionários de empresas clientes (empresa_id) e funcionários de entidades (contratante_id).';

COMMENT ON COLUMN funcionarios.usuario_tipo IS 
'Tipo de funcionário: funcionario_clinica (empresa cliente) ou funcionario_entidade (entidade direta)';

\echo '✓ Estrutura de funcionarios ajustada'

-- ====================================================================
-- FASE 7: ATUALIZAR VIEWS SEMÂNTICAS
-- ====================================================================

\echo ''
\echo 'FASE 7: Atualizando views...'

-- Recriar view usuarios_resumo (agora com base na nova tabela usuarios)
DROP VIEW IF EXISTS usuarios_resumo CASCADE;

CREATE VIEW usuarios_resumo AS
SELECT 
    tipo_usuario,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE ativo = true) as ativos,
    COUNT(*) FILTER (WHERE ativo = false) as inativos,
    COUNT(DISTINCT clinica_id) FILTER (WHERE clinica_id IS NOT NULL) as clinicas_vinculadas,
    COUNT(DISTINCT contratante_id) FILTER (WHERE contratante_id IS NOT NULL) as tomadores_vinculados
FROM usuarios
WHERE tipo_usuario IS NOT NULL
GROUP BY tipo_usuario
ORDER BY 
    CASE tipo_usuario
        WHEN 'admin' THEN 1
        WHEN 'emissor' THEN 2
        WHEN 'rh' THEN 3
        WHEN 'gestor' THEN 4
        ELSE 5
    END;

COMMENT ON VIEW usuarios_resumo IS 
'Estatísticas resumidas por tipo de usuário do sistema';

-- Atualizar view equipe_administrativa (agora com base em usuarios)
DROP VIEW IF EXISTS equipe_administrativa CASCADE;

CREATE VIEW equipe_administrativa AS
SELECT 
    id,
    cpf,
    nome,
    email,
    tipo_usuario,
    CASE
        WHEN tipo_usuario = 'admin' THEN 'Administrador do Sistema'
        WHEN tipo_usuario = 'emissor' THEN 'Emissor de Laudos'
        ELSE 'Outro'
    END as papel_descricao,
    clinica_id,
    ativo,
    criado_em,
    atualizado_em
FROM usuarios
WHERE tipo_usuario IN ('admin', 'emissor');

COMMENT ON VIEW equipe_administrativa IS 
'View semântica para equipe administrativa da plataforma (admin e emissores)';

-- Atualizar view gestores
DROP VIEW IF EXISTS gestores CASCADE;

CREATE VIEW gestores AS
SELECT 
    id,
    cpf,
    nome,
    email,
    tipo_usuario,
    CASE
        WHEN tipo_usuario = 'rh' THEN 'Gestor RH/Clínica'
        WHEN tipo_usuario = 'gestor' THEN 'Gestor Entidade'
        ELSE 'Outro'
    END as tipo_gestor_descricao,
    clinica_id,
    contratante_id,
    ativo,
    criado_em,
    atualizado_em
FROM usuarios
WHERE tipo_usuario IN ('rh', 'gestor');

COMMENT ON VIEW gestores IS 
'View semântica para gestores do sistema (RH de clínicas e gestores de entidades)';

-- Criar view funcionarios_operacionais
DROP VIEW IF EXISTS funcionarios_operacionais CASCADE;

CREATE VIEW funcionarios_operacionais AS
SELECT 
    id,
    cpf,
    nome,
    email,
    usuario_tipo,
    CASE
        WHEN usuario_tipo = 'funcionario_clinica' THEN 'Funcionário de Empresa Cliente'
        WHEN usuario_tipo = 'funcionario_entidade' THEN 'Funcionário de Entidade'
        ELSE 'Outro'
    END as tipo_funcionario_descricao,
    empresa_id,
    contratante_id,
    clinica_id,
    setor,
    funcao,
    nivel_cargo,
    ativo,
    criado_em,
    atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade');

COMMENT ON VIEW funcionarios_operacionais IS 
'View semântica para funcionários que realizam avaliações (não têm acesso ao sistema)';

\echo '✓ Views atualizadas'

-- ====================================================================
-- FASE 8: CRIAR TRIGGERS DE AUDITORIA PARA USUARIOS
-- ====================================================================

\echo ''
\echo 'FASE 8: Criando triggers de auditoria...'

-- Trigger de atualização de timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp_usuarios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_timestamp_usuarios ON usuarios;

CREATE TRIGGER trigger_atualizar_timestamp_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_usuarios();

-- Se existir função de auditoria genérica, criar trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_func') THEN
        DROP TRIGGER IF EXISTS audit_usuarios ON usuarios;
        
        CREATE TRIGGER audit_usuarios
            AFTER INSERT OR UPDATE OR DELETE ON usuarios
            FOR EACH ROW
            EXECUTE FUNCTION audit_trigger_func();
            
        RAISE NOTICE '✓ Trigger de auditoria criado para usuarios';
    ELSE
        RAISE NOTICE 'ℹ Função audit_trigger_func não existe, trigger de auditoria não criado';
    END IF;
END $$;

\echo '✓ Triggers criados'

-- ====================================================================
-- FASE 9: VALIDAÇÕES PÓS-MIGRAÇÃO
-- ====================================================================

\echo ''
\echo 'FASE 9: Validações pós-migração...'

DO $$
DECLARE
    v_usuarios_total INTEGER;
    v_funcionarios_sistema INTEGER;
    v_funcionarios_operacionais INTEGER;
BEGIN
    -- Contar usuários na nova tabela
    SELECT COUNT(*) INTO v_usuarios_total FROM usuarios;
    
    -- Verificar se ainda existem usuários do sistema em funcionarios
    SELECT COUNT(*) INTO v_funcionarios_sistema FROM funcionarios
    WHERE usuario_tipo IN ('admin', 'emissor', 'gestor', 'rh');
    
    -- Contar funcionários operacionais
    SELECT COUNT(*) INTO v_funcionarios_operacionais FROM funcionarios
    WHERE usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade');
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESULTADO DA MIGRAÇÃO:';
    RAISE NOTICE '  ┌─────────────────────────────────────────┐';
    RAISE NOTICE '  │ Tabela usuarios: % registros          │', LPAD(v_usuarios_total::text, 5);
    RAISE NOTICE '  │ Funcionários operacionais: %          │', LPAD(v_funcionarios_operacionais::text, 5);
    RAISE NOTICE '  │ Usuários incorretos em funcionarios: %│', LPAD(v_funcionarios_sistema::text, 5);
    RAISE NOTICE '  └─────────────────────────────────────────┘';
    RAISE NOTICE '';
    
    IF v_funcionarios_sistema > 0 THEN
        RAISE WARNING '⚠ ATENÇÃO: Ainda existem usuários do sistema na tabela funcionarios!';
    ELSE
        RAISE NOTICE '✓ Migração concluída com sucesso!';
    END IF;
END $$;

-- ====================================================================
-- FASE 10: RELATÓRIO FINAL
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'RELATÓRIO FINAL DA MIGRAÇÃO'
\echo '========================================='
\echo ''
\echo 'Tabelas criadas:'
\echo '  ✓ usuarios (nova estrutura)'
\echo '  ✓ usuarios_migracao_log (auditoria)'
\echo '  ✓ funcionarios_backup_pre_300 (backup)'
\echo ''
\echo 'Views atualizadas:'
\echo '  ✓ usuarios_resumo'
\echo '  ✓ equipe_administrativa'
\echo '  ✓ gestores'
\echo '  ✓ funcionarios_operacionais (nova)'
\echo ''
\echo 'Próximos passos:'
\echo '  1. Atualizar código da aplicação'
\echo '  2. Testar autenticação e permissões'
\echo '  3. Validar queries e endpoints'
\echo '  4. Executar testes automatizados'
\echo ''
\echo '========================================='

COMMIT;

-- ====================================================================
-- ROLLBACK (SE NECESSÁRIO)
-- ====================================================================
-- 
-- Para reverter esta migration:
-- 
-- BEGIN;
-- 
-- -- Restaurar usuários em funcionarios
-- INSERT INTO funcionarios (cpf, nome, email, senha_hash, usuario_tipo, clinica_id, contratante_id, ativo, criado_em, atualizado_em)
-- SELECT cpf, nome, email, senha_hash, tipo_usuario, clinica_id, contratante_id, ativo, criado_em, atualizado_em
-- FROM usuarios;
-- 
-- -- Dropar nova tabela usuarios
-- DROP TABLE IF EXISTS usuarios CASCADE;
-- 
-- -- Restaurar tabela antiga (se existir)
-- ALTER TABLE usuarios_old RENAME TO usuarios;
-- 
-- -- Remover views criadas
-- DROP VIEW IF EXISTS funcionarios_operacionais CASCADE;
-- 
-- COMMIT;
-- 
-- ====================================================================
