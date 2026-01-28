-- ================================================================
-- SCRIPT DE REMOÇÃO DE PERFIL LEGADO E IMPLEMENTAÇÃO DE AUDIT LOGS
-- ================================================================
-- Data: 12/12/2025
-- Descrição: Remove perfil legado (migração histórica) e adiciona sistema de auditoria
-- ATENÇÃO: Execute este script em horário de baixo movimento
-- ================================================================

BEGIN;

-- ================================================================
-- ETAPA 1: REMOVER POLÍTICAS RLS LEGADAS
-- ================================================================

-- Remover todas as políticas que mencionam o perfil legado (nomes de policy permanecem inalterados)
DROP POLICY IF EXISTS "master_all_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "master_all_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "master_all_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "master_all_lotes" ON lotes_avaliacao;

DROP POLICY IF EXISTS "master_all_laudos" ON laudos;

DROP POLICY IF EXISTS "master_all_respostas" ON respostas;

DROP POLICY IF EXISTS "master_all_resultados" ON resultados;

DROP POLICY IF EXISTS "master_all_clinicas" ON clinicas;

-- Atualizar políticas que incluem master nas condições
DROP POLICY IF EXISTS "admin_all_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "admin_all_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_all_lotes" ON lotes_avaliacao;

DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;

DROP POLICY IF EXISTS "admin_all_respostas" ON respostas;

DROP POLICY IF EXISTS "admin_all_resultados" ON resultados;

-- Recriar políticas sem master
CREATE POLICY "admin_all_funcionarios" ON funcionarios FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_avaliacoes" ON avaliacoes FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_empresas" ON empresas_clientes FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_lotes" ON lotes_avaliacao FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_laudos" ON laudos FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_respostas" ON respostas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

CREATE POLICY "admin_all_resultados" ON resultados FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);

-- ================================================================
-- ETAPA 2: INATIVAR USUÁRIOS LEGADOS
-- ================================================================

-- Inativar todos os usuários com perfil legado (consulta/atualização histórica)
UPDATE funcionarios SET ativo = false WHERE perfil = 'master';

-- ================================================================
-- ETAPA 3: REMOVER CONSTRAINTS LEGADAS
-- ================================================================

-- Verificar se existe constraint de clinica_id relacionada ao perfil legado (ajuste histórico)

ALTER TABLE funcionarios
DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;

-- Recriar constraint sem master
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_clinica_check CHECK (
    (
        perfil IN (
            'rh',
            'funcionario',
            'emissor'
        )
        AND clinica_id IS NOT NULL
    )
    OR (
        perfil = 'admin'
        AND clinica_id IS NULL
    )
);

-- ================================================================
-- ETAPA 4: CRIAR TABELA DE AUDIT LOGS
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL,
    operacao VARCHAR(10) NOT NULL CHECK (
        operacao IN ('INSERT', 'UPDATE', 'DELETE')
    ),
    registro_id VARCHAR(100),
    usuario_cpf VARCHAR(11) NOT NULL,
    usuario_perfil VARCHAR(20) NOT NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_cpf) REFERENCES funcionarios (cpf)
);

-- Índices para performance
CREATE INDEX idx_audit_logs_tabela ON audit_logs (tabela);

CREATE INDEX idx_audit_logs_usuario ON audit_logs (usuario_cpf);

CREATE INDEX idx_audit_logs_criado_em ON audit_logs (criado_em DESC);

CREATE INDEX idx_audit_logs_operacao ON audit_logs (operacao);

COMMENT ON
TABLE audit_logs IS 'Registro de auditoria de todas as operações críticas no sistema';

COMMENT ON COLUMN audit_logs.tabela IS 'Nome da tabela afetada';

COMMENT ON COLUMN audit_logs.operacao IS 'Tipo de operação: INSERT, UPDATE ou DELETE';

COMMENT ON COLUMN audit_logs.registro_id IS 'ID do registro afetado (convertido para string)';

COMMENT ON COLUMN audit_logs.dados_anteriores IS 'Estado anterior do registro (UPDATE/DELETE)';

COMMENT ON COLUMN audit_logs.dados_novos IS 'Estado novo do registro (INSERT/UPDATE)';

-- ================================================================
-- ETAPA 5: CRIAR TRIGGER FUNCTIONS PARA AUDIT
-- ================================================================

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_usuario_cpf VARCHAR(11);
    v_usuario_perfil VARCHAR(20);
    v_registro_id VARCHAR(100);
BEGIN
    -- Obter dados do usuário da sessão
    BEGIN
        v_usuario_cpf := current_setting('app.current_user_cpf', true);
        v_usuario_perfil := current_setting('app.current_user_perfil', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_cpf := 'SYSTEM';
        v_usuario_perfil := 'SYSTEM';
    END;

    -- Determinar ID do registro
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id::TEXT;
    ELSE
        v_registro_id := NEW.id::TEXT;
    END IF;

    -- Inserir log de auditoria
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(NEW)::JSONB);
        
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, 
                row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (tabela, operacao, registro_id, usuario_cpf, usuario_perfil, dados_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, v_registro_id, v_usuario_cpf, v_usuario_perfil, row_to_json(OLD)::JSONB);
    END IF;

    -- Retornar apropriadamente
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- ETAPA 6: CRIAR TRIGGERS PARA TABELAS CRÍTICAS
-- ================================================================

-- Auditoria de funcionários (criação, atualização, inativação)
DROP TRIGGER IF EXISTS audit_funcionarios ON funcionarios;

CREATE TRIGGER audit_funcionarios
    AFTER INSERT OR UPDATE OR DELETE ON funcionarios
    FOR EACH ROW
    WHEN (
        -- Auditar apenas mudanças de perfil, status ou senha
        (TG_OP = 'UPDATE' AND (
            OLD.perfil IS DISTINCT FROM NEW.perfil OR
            OLD.ativo IS DISTINCT FROM NEW.ativo OR
            OLD.senha_hash IS DISTINCT FROM NEW.senha_hash
        )) OR
        TG_OP IN ('INSERT', 'DELETE')
    )
    EXECUTE FUNCTION audit_trigger_function();

-- Auditoria de empresas
DROP TRIGGER IF EXISTS audit_empresas ON empresas_clientes;

CREATE TRIGGER audit_empresas
    AFTER INSERT OR UPDATE OR DELETE ON empresas_clientes
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Auditoria de clínicas
DROP TRIGGER IF EXISTS audit_clinicas ON clinicas;

CREATE TRIGGER audit_clinicas
    AFTER INSERT OR UPDATE OR DELETE ON clinicas
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- Auditoria de lotes de avaliação
DROP TRIGGER IF EXISTS audit_lotes ON lotes_avaliacao;

CREATE TRIGGER audit_lotes
    AFTER INSERT OR UPDATE OR DELETE ON lotes_avaliacao
    FOR EACH ROW
    WHEN (
        -- Auditar liberação e finalizações
        (TG_OP = 'UPDATE' AND (
            OLD.liberado IS DISTINCT FROM NEW.liberado OR
            OLD.status IS DISTINCT FROM NEW.status
        )) OR
        TG_OP IN ('INSERT', 'DELETE')
    )
    EXECUTE FUNCTION audit_trigger_function();

-- Auditoria de laudos
DROP TRIGGER IF EXISTS audit_laudos ON laudos;

CREATE TRIGGER audit_laudos
    AFTER INSERT OR UPDATE OR DELETE ON laudos
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ================================================================
-- ETAPA 7: CRIAR VIEW DE AUDIT LOGS LEGÍVEL
-- ================================================================

CREATE OR REPLACE VIEW v_audit_logs_readable AS
SELECT
    al.id,
    al.tabela,
    al.operacao,
    al.registro_id,
    f.nome as usuario_nome,
    al.usuario_cpf,
    al.usuario_perfil,
    al.criado_em,
    al.dados_anteriores,
    al.dados_novos,
    -- Resumo de mudanças para UPDATE
    CASE
        WHEN al.operacao = 'UPDATE' THEN jsonb_pretty (
            jsonb_object_agg (
                key,
                jsonb_build_object (
                    'anterior',
                    al.dados_anteriores -> key,
                    'novo',
                    al.dados_novos -> key
                )
            ) FILTER (
                WHERE
                    al.dados_anteriores -> key IS DISTINCT
                FROM al.dados_novos -> key
            )
        )
        ELSE NULL
    END as mudancas_resumo
FROM audit_logs al
    LEFT JOIN funcionarios f ON al.usuario_cpf = f.cpf;

COMMENT ON VIEW v_audit_logs_readable IS 'View formatada de logs de auditoria com nomes de usuários';

-- ================================================================
-- ETAPA 8: CRIAR ÍNDICES DE PERFORMANCE PARA RLS
-- ================================================================

-- Índices compostos para otimizar queries RLS
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_perfil ON funcionarios (clinica_id, perfil)
WHERE
    ativo = true;

CREATE INDEX IF NOT EXISTS idx_empresas_clinica ON empresas_clientes (clinica_id)
WHERE
    ativo = true;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario ON avaliacoes (funcionario_cpf, status);

CREATE INDEX IF NOT EXISTS idx_lotes_clinica_status ON lotes_avaliacao (clinica_id, status);

-- ================================================================
-- FINALIZAÇÃO
-- ================================================================

COMMIT;

-- Mensagem de sucesso
DO $$ BEGIN RAISE NOTICE '========================================';

RAISE NOTICE 'Migração concluída com sucesso!';

RAISE NOTICE '========================================';

RAISE NOTICE '✓ Perfil legado removido';

RAISE NOTICE '✓ Políticas RLS atualizadas';

RAISE NOTICE '✓ Tabela audit_logs criada';

RAISE NOTICE '✓ Triggers de auditoria implementados';

RAISE NOTICE '✓ Índices de performance criados';

RAISE NOTICE '========================================';

END $$;