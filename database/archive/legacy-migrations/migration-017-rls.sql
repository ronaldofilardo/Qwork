-- Migration 017: Row Level Security (RLS)
-- Data: 2026-01-13
-- Descrição: Implementa RLS para isolamento de dados por clínica/entidade

-- ============================================================================
-- HABILITAR RLS NAS TABELAS SENSÍVEIS
-- ============================================================================

ALTER TABLE tomadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_clientes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA tomadores
-- ============================================================================

-- SELECT: Admin vê tudo, gestores veem apenas seu contratante
DROP POLICY IF EXISTS tomadores_select_policy ON tomadores;
CREATE POLICY tomadores_select_policy ON tomadores FOR SELECT USING (
    -- Admin vê tudo
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- Gestor vê apenas seu contratante
    (id::text = current_setting('app.current_contratante_id', true))
);

-- UPDATE: Admin atualiza tudo, gestores atualizam apenas seu contratante
DROP POLICY IF EXISTS tomadores_update_policy ON tomadores;
CREATE POLICY tomadores_update_policy ON tomadores FOR UPDATE USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (id::text = current_setting('app.current_contratante_id', true))
);

-- DELETE: Apenas admin
DROP POLICY IF EXISTS tomadores_delete_policy ON tomadores;
CREATE POLICY tomadores_delete_policy ON tomadores FOR DELETE USING (
    current_setting('app.current_perfil', true) = 'admin'
);

-- ============================================================================
-- POLÍTICAS PARA FUNCIONÁRIOS
-- ============================================================================

-- SELECT: Isolamento por clínica/contratante
DROP POLICY IF EXISTS funcionarios_select_policy ON funcionarios;
CREATE POLICY funcionarios_select_policy ON funcionarios FOR SELECT USING (
    -- Admin vê tudo
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- RH vê funcionários da sua clínica
    (clinica_id::text = current_setting('app.current_clinica_id', true))
    OR
    -- Gestor de entidade vê funcionários vinculados ao contratante
    EXISTS (
        SELECT 1 FROM tomadores_funcionarios cf
        WHERE cf.funcionario_id = funcionarios.id
        AND cf.contratante_id::text = current_setting('app.current_contratante_id', true)
        AND cf.vinculo_ativo = true
    )
    OR
    -- Funcionário vê apenas seus próprios dados
    (cpf = current_setting('app.current_cpf', true))
);

-- UPDATE: Mesmas regras do SELECT
DROP POLICY IF EXISTS funcionarios_update_policy ON funcionarios;
CREATE POLICY funcionarios_update_policy ON funcionarios FOR UPDATE USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
    OR
    EXISTS (
        SELECT 1 FROM tomadores_funcionarios cf
        WHERE cf.funcionario_id = funcionarios.id
        AND cf.contratante_id::text = current_setting('app.current_contratante_id', true)
        AND cf.vinculo_ativo = true
    )
);

-- ============================================================================
-- POLÍTICAS PARA AVALIAÇÕES
-- ============================================================================

DROP POLICY IF EXISTS avaliacoes_select_policy ON avaliacoes;
CREATE POLICY avaliacoes_select_policy ON avaliacoes FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- Verifica se o funcionário pertence à clínica/contratante
    EXISTS (
        SELECT 1 FROM funcionarios f
        WHERE f.cpf = avaliacoes.funcionario_cpf
        AND (
            f.clinica_id::text = current_setting('app.current_clinica_id', true)
            OR
            EXISTS (
                SELECT 1 FROM tomadores_funcionarios cf
                WHERE cf.funcionario_id = f.id
                AND cf.contratante_id::text = current_setting('app.current_contratante_id', true)
                AND cf.vinculo_ativo = true
            )
        )
    )
    OR
    -- Funcionário vê apenas suas avaliações
    (funcionario_cpf = current_setting('app.current_cpf', true))
);

-- ============================================================================
-- POLÍTICAS PARA RESULTADOS
-- ============================================================================

DROP POLICY IF EXISTS resultados_select_policy ON resultados;
CREATE POLICY resultados_select_policy ON resultados FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    EXISTS (
        SELECT 1 FROM avaliacoes a
        JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        WHERE a.id = resultados.avaliacao_id
        AND (
            f.clinica_id::text = current_setting('app.current_clinica_id', true)
            OR
            EXISTS (
                SELECT 1 FROM tomadores_funcionarios cf
                WHERE cf.funcionario_id = f.id
                AND cf.contratante_id::text = current_setting('app.current_contratante_id', true)
            )
            OR
            f.cpf = current_setting('app.current_cpf', true)
        )
    )
);

-- ============================================================================
-- POLÍTICAS PARA LAUDOS
-- ============================================================================

CREATE POLICY laudos_select_policy ON laudos FOR SELECT USING (
    (current_setting('app.current_perfil', true) IN ('admin', 'emissor'))
    OR
    -- Verifica se o laudo pertence a um lote cuja clinica_id corresponde ao contexto
    EXISTS (
        SELECT 1 FROM lotes_avaliacao la
        WHERE la.id = laudos.lote_id
        AND la.clinica_id::text = current_setting('app.current_clinica_id', true)
    )
);

-- ============================================================================
-- POLÍTICAS PARA PAGAMENTOS
-- ============================================================================

DROP POLICY IF EXISTS pagamentos_select_policy ON pagamentos;
CREATE POLICY pagamentos_select_policy ON pagamentos FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (contratante_id::text = current_setting('app.current_contratante_id', true))
);

DROP POLICY IF EXISTS pagamentos_insert_policy ON pagamentos;
CREATE POLICY pagamentos_insert_policy ON pagamentos FOR INSERT WITH CHECK (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (contratante_id::text = current_setting('app.current_contratante_id', true))
);

-- ============================================================================
-- POLÍTICAS PARA RECIBOS
-- ============================================================================

DROP POLICY IF EXISTS recibos_select_policy ON recibos;
CREATE POLICY recibos_select_policy ON recibos FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (contratante_id::text = current_setting('app.current_contratante_id', true))
);

-- ============================================================================
-- POLÍTICAS PARA CONTRATOS
-- ============================================================================

DROP POLICY IF EXISTS contratos_select_policy ON contratos;
CREATE POLICY contratos_select_policy ON contratos FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (contratante_id::text = current_setting('app.current_contratante_id', true))
);

DROP POLICY IF EXISTS contratos_update_policy ON contratos;
CREATE POLICY contratos_update_policy ON contratos FOR UPDATE USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (contratante_id::text = current_setting('app.current_contratante_id', true))
);

-- ============================================================================
-- POLÍTICAS PARA EMPRESAS_CLIENTES
-- ============================================================================

DROP POLICY IF EXISTS empresas_clientes_select_policy ON empresas_clientes;
CREATE POLICY empresas_clientes_select_policy ON empresas_clientes FOR SELECT USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
);

DROP POLICY IF EXISTS empresas_clientes_insert_policy ON empresas_clientes;
CREATE POLICY empresas_clientes_insert_policy ON empresas_clientes FOR INSERT WITH CHECK (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
);

DROP POLICY IF EXISTS empresas_clientes_update_policy ON empresas_clientes;
CREATE POLICY empresas_clientes_update_policy ON empresas_clientes FOR UPDATE USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
);

DROP POLICY IF EXISTS empresas_clientes_delete_policy ON empresas_clientes;
CREATE POLICY empresas_clientes_delete_policy ON empresas_clientes FOR DELETE USING (
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    (clinica_id::text = current_setting('app.current_clinica_id', true))
);

-- ============================================================================
-- FUNÇÃO HELPER PARA DEFINIR CONTEXTO RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_rls_context(
    p_perfil VARCHAR DEFAULT NULL,
    p_cpf VARCHAR DEFAULT NULL,
    p_clinica_id INTEGER DEFAULT NULL,
    p_contratante_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    IF p_perfil IS NOT NULL THEN
        PERFORM set_config('app.current_perfil', p_perfil, true);
    END IF;
    
    IF p_cpf IS NOT NULL THEN
        PERFORM set_config('app.current_cpf', p_cpf, true);
    END IF;
    
    IF p_clinica_id IS NOT NULL THEN
        PERFORM set_config('app.current_clinica_id', p_clinica_id::text, true);
    END IF;
    
    IF p_contratante_id IS NOT NULL THEN
        PERFORM set_config('app.current_contratante_id', p_contratante_id::text, true);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY tomadores_select_policy ON tomadores IS
    'RLS: Admin vê tudo, gestores veem apenas seu contratante';

COMMENT ON POLICY funcionarios_select_policy ON funcionarios IS
    'RLS: Isola funcionários por clínica/contratante, usuário vê apenas seus dados';

COMMENT ON POLICY avaliacoes_select_policy ON avaliacoes IS
    'RLS: Isola avaliações baseado no vínculo do funcionário';

COMMENT ON POLICY laudos_select_policy ON laudos IS
    'RLS: Admin e emissores veem tudo, clínicas/entidades veem apenas seus laudos';

COMMENT ON FUNCTION set_rls_context IS
    'Helper para definir variáveis de contexto RLS em uma transação';

-- ============================================================================
-- PERMISSÕES PARA ADMIN BYPASS (OPCIONAL)
-- ============================================================================

-- Para permitir que admins executem queries sem RLS, crie um role específico:
-- CREATE ROLE admin_bypass BYPASSRLS;
-- GRANT admin_bypass TO postgres;
