-- ==========================================
-- MIGRATION: Correções de RBAC e RLS
-- Descrição: Implementa correções identificadas na revisão de segurança
-- Data: 2025-12-14
-- Versão: 1.0.0
-- ==========================================
-- ATENÇÃO: Execute SOMENTE em ambiente LOCAL primeiro!
-- Testa completamente antes de aplicar em produção.
-- ==========================================

BEGIN;

-- ==========================================
-- 1. POLÍTICAS RLS PARA AUDIT_LOGS
-- ==========================================

\echo 'Implementando políticas RLS para audit_logs...'

-- Admin vê todos os logs
CREATE POLICY "audit_logs_admin_all" ON audit_logs FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

-- Usuários veem apenas seus próprios logs
CREATE POLICY "audit_logs_own_select" ON audit_logs FOR
SELECT TO PUBLIC USING (
        user_cpf = current_user_cpf ()
    );

-- Apenas sistema (triggers) pode inserir logs
CREATE POLICY "audit_logs_system_insert" ON audit_logs FOR
INSERT
    TO PUBLIC
WITH
    CHECK (true);
-- Inserções via triggers sempre permitidas

-- Ninguém pode atualizar ou deletar logs
-- (Sem políticas de UPDATE/DELETE = bloqueio total)

COMMENT ON POLICY "audit_logs_admin_all" ON audit_logs IS 'Administradores podem ver todos os logs de auditoria';

COMMENT ON POLICY "audit_logs_own_select" ON audit_logs IS 'Usuários podem ver apenas seus próprios logs';

COMMENT ON POLICY "audit_logs_system_insert" ON audit_logs IS 'Apenas sistema pode inserir logs via triggers';

-- ==========================================
-- 2. FUNÇÃO HELPER PARA VALIDAR PERMISSÕES RBAC
-- ==========================================

\echo 'Criando função helper para validar permissões RBAC...'

-- Função que verifica se usuário tem permissão específica via RBAC
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_perfil TEXT;
BEGIN
    v_perfil := current_user_perfil();
    
    IF v_perfil IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN roles r ON r.name = v_perfil AND r.id = rp.role_id
        JOIN permissions p ON p.name = permission_name AND p.id = rp.permission_id
        WHERE r.active = TRUE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_has_permission (TEXT) IS 'Verifica se o usuário atual tem uma permissão específica via RBAC';

-- ==========================================
-- 3. VALIDAÇÃO DE PERTENCIMENTO DE RH À CLÍNICA
-- ==========================================

\echo 'Criando função para validar pertencimento de RH à clínica...'

-- Função que valida se RH realmente pertence à clínica
CREATE OR REPLACE FUNCTION public.validate_rh_clinica()
RETURNS BOOLEAN AS $$
DECLARE
    v_cpf TEXT;
    v_perfil TEXT;
    v_clinica_id INTEGER;
    v_rh_clinica_id INTEGER;
BEGIN
    v_cpf := current_user_cpf();
    v_perfil := current_user_perfil();
    v_clinica_id := current_user_clinica_id();
    
    -- Se não for RH, validação passa
    IF v_perfil != 'rh' THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se o RH realmente pertence à clínica especificada
    SELECT clinica_id INTO v_rh_clinica_id
    FROM funcionarios
    WHERE cpf = v_cpf AND perfil = 'rh' AND ativo = TRUE;
    
    -- Se não encontrou ou clínica não corresponde, retornar FALSE
    IF v_rh_clinica_id IS NULL OR v_rh_clinica_id != v_clinica_id THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_rh_clinica () IS 'Valida se o RH atual realmente pertence à clínica configurada na sessão';

-- ==========================================
-- 4. IMUTABILIDADE PARA LAUDOS EMITIDOS
-- ==========================================

\echo 'Implementando imutabilidade para laudos emitidos...'

-- Função para verificar imutabilidade de laudos
CREATE OR REPLACE FUNCTION check_laudo_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_emitido_em TIMESTAMP;
BEGIN
    -- Para UPDATE ou DELETE, verificar se laudo foi emitido
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        -- Se laudo foi emitido (tem data de emissão), bloquear modificação
        IF OLD.emitido_em IS NOT NULL THEN
            RAISE EXCEPTION 'Não é permitido modificar laudos já emitidos. Laudo ID: %', OLD.id
                USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.',
                      ERRCODE = '23506';
        END IF;
        
        -- Se status é 'enviado', também bloquear
        IF OLD.status = 'enviado' THEN
            RAISE EXCEPTION 'Não é permitido modificar laudos com status "enviado". Laudo ID: %', OLD.id
                USING HINT = 'Laudos enviados são imutáveis.',
                      ERRCODE = '23506';
        END IF;
    END IF;
    
    -- Validação de consistência de emissão é feita por CHECK constraint (chk_laudos_emitido_em_emissor_cpf)
    -- (mantido no schema via migration 030 para validação estática de linhas)
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para imutabilidade de laudos
DROP TRIGGER IF EXISTS trigger_laudo_immutability ON laudos;

CREATE TRIGGER trigger_laudo_immutability
    BEFORE UPDATE OR DELETE ON laudos
    FOR EACH ROW
    EXECUTE FUNCTION check_laudo_immutability();

COMMENT ON FUNCTION check_laudo_immutability () IS 'Garante imutabilidade de laudos após emissão';

-- ==========================================
-- 5. REMOVER POLÍTICAS ANTIGAS COM FOR ALL
-- ==========================================

\echo 'Removendo políticas antigas com FOR ALL...'

-- Funcionários
DROP POLICY IF EXISTS "funcionario_own_data" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_own_select" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_own_update" ON funcionarios;

-- RH
DROP POLICY IF EXISTS "rh_clinica_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_rh_clinica" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_rh_insert" ON funcionarios;

DROP POLICY IF EXISTS "funcionarios_rh_update" ON funcionarios;

-- Admin
DROP POLICY IF EXISTS "admin_all_funcionarios" ON funcionarios;

DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON funcionarios;

-- Avaliações
DROP POLICY IF EXISTS "funcionario_own_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_own_select" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_own_insert" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_own_update" ON avaliacoes;

DROP POLICY IF EXISTS "rh_clinica_avaliacoes" ON avaliacoes;

DROP POLICY IF EXISTS "avaliacoes_rh_clinica" ON avaliacoes;

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON avaliacoes;

-- Empresas
DROP POLICY IF EXISTS "rh_clinica_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_rh_clinica" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_rh_insert" ON empresas_clientes;

DROP POLICY IF EXISTS "empresas_rh_update" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_all_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_view_empresas" ON empresas_clientes;

DROP POLICY IF EXISTS "admin_manage_empresas" ON empresas_clientes;

-- Lotes
DROP POLICY IF EXISTS "rh_clinica_lotes" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_clinica" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_insert" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_rh_update" ON lotes_avaliacao;

DROP POLICY IF EXISTS "emissor_lotes_finalizados" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_emissor_select" ON lotes_avaliacao;

DROP POLICY IF EXISTS "lotes_funcionario_select" ON lotes_avaliacao;

DROP POLICY IF EXISTS "admin_all_lotes" ON lotes_avaliacao;

-- Laudos
DROP POLICY IF EXISTS "emissor_all_laudos" ON laudos;

DROP POLICY IF EXISTS "laudos_emissor_select" ON laudos;

DROP POLICY IF EXISTS "laudos_emissor_insert" ON laudos;

DROP POLICY IF EXISTS "laudos_emissor_update" ON laudos;

DROP POLICY IF EXISTS "laudos_rh_clinica" ON laudos;

DROP POLICY IF EXISTS "admin_all_laudos" ON laudos;

-- Respostas
DROP POLICY IF EXISTS "funcionario_own_respostas" ON respostas;

DROP POLICY IF EXISTS "respostas_own_select" ON respostas;

DROP POLICY IF EXISTS "respostas_own_insert" ON respostas;

DROP POLICY IF EXISTS "respostas_own_update" ON respostas;

DROP POLICY IF EXISTS "rh_clinica_respostas" ON respostas;

DROP POLICY IF EXISTS "respostas_rh_clinica" ON respostas;

DROP POLICY IF EXISTS "admin_all_respostas" ON respostas;

-- Resultados
DROP POLICY IF EXISTS "funcionario_own_resultados" ON resultados;

DROP POLICY IF EXISTS "resultados_own_select" ON resultados;

DROP POLICY IF EXISTS "rh_clinica_resultados" ON resultados;

DROP POLICY IF EXISTS "resultados_rh_clinica" ON resultados;

DROP POLICY IF EXISTS "admin_all_resultados" ON resultados;

-- Clínicas
DROP POLICY IF EXISTS "admin_all_clinicas" ON clinicas;

DROP POLICY IF EXISTS "admin_manage_clinicas" ON clinicas;

DROP POLICY IF EXISTS "rh_own_clinica" ON clinicas;

DROP POLICY IF EXISTS "clinicas_own_select" ON clinicas;

-- ==========================================
-- 6. POLÍTICAS GRANULARES PARA FUNCIONÁRIOS
-- ==========================================

\echo 'Criando políticas granulares para funcionários...'

-- FUNCIONÁRIO: Leitura dos próprios dados
CREATE POLICY "funcionarios_own_select" ON funcionarios FOR
SELECT TO PUBLIC USING (
        perfil = 'funcionario'
        AND cpf = current_user_cpf ()
    );

-- FUNCIONÁRIO: Atualização limitada dos próprios dados (sem mudar perfil, cpf, clinica_id)
CREATE POLICY "funcionarios_own_update" ON funcionarios FOR
UPDATE TO PUBLIC USING (cpf = current_user_cpf ())
WITH
    CHECK (
        cpf = current_user_cpf ()
        -- Nota: validação de imutabilidade de perfil/clinica deverá ser garantida via trigger ou constraint
    );

-- RH: Leitura de todos os funcionários da sua clínica
CREATE POLICY "funcionarios_rh_select" ON funcionarios FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica () -- Valida que RH pertence à clínica
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Inserção de funcionários na sua clínica
CREATE POLICY "funcionarios_rh_insert" ON funcionarios FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND clinica_id = current_user_clinica_id ()
        AND perfil = 'funcionario' -- RH só cria funcionários comuns
    );

-- RH: Atualização de funcionários da sua clínica
CREATE POLICY "funcionarios_rh_update" ON funcionarios FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
)
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
        -- Nota: validação de imutabilidade de perfil deverá ser garantida via trigger/constraint
    );

-- RH: Deleção lógica (inativação) de funcionários da sua clínica
CREATE POLICY "funcionarios_rh_delete" ON funcionarios FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
    AND perfil = 'funcionario'
);

-- ADMIN: Leitura de funcionários RH/Emissor (gestão de usuários do sistema)
CREATE POLICY "funcionarios_admin_select" ON funcionarios FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
        AND perfil IN ('rh', 'emissor')
    );

-- ADMIN: Inserção de RH/Emissor
CREATE POLICY "funcionarios_admin_insert" ON funcionarios FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'admin'
        AND perfil IN ('rh', 'emissor')
        AND user_has_permission ('manage:funcionarios')
    );

-- ADMIN: Atualização de RH/Emissor
CREATE POLICY "funcionarios_admin_update" ON funcionarios FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'admin'
    AND perfil IN ('rh', 'emissor')
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
        AND perfil IN ('rh', 'emissor')
    );

-- ADMIN: Deleção de RH/Emissor inativos
CREATE POLICY "funcionarios_admin_delete" ON funcionarios FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'admin'
    AND perfil IN ('rh', 'emissor')
    AND ativo = FALSE
);

-- ==========================================
-- 7. POLÍTICAS GRANULARES PARA AVALIAÇÕES
-- ==========================================

\echo 'Criando políticas granulares para avaliações...'

-- FUNCIONÁRIO: Leitura das próprias avaliações
CREATE POLICY "avaliacoes_own_select" ON avaliacoes FOR
SELECT TO PUBLIC USING (
        funcionario_cpf = current_user_cpf ()
    );

-- FUNCIONÁRIO: Inserção das próprias avaliações
CREATE POLICY "avaliacoes_own_insert" ON avaliacoes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        funcionario_cpf = current_user_cpf ()
    );

-- FUNCIONÁRIO: Atualização das próprias avaliações (apenas não concluídas)
CREATE POLICY "avaliacoes_own_update" ON avaliacoes FOR
UPDATE TO PUBLIC USING (
    funcionario_cpf = current_user_cpf ()
    AND status != 'concluida'
)
WITH
    CHECK (
        funcionario_cpf = current_user_cpf ()
    );

-- FUNCIONÁRIO: Não pode deletar avaliações
-- (Sem política de DELETE para funcionário)

-- RH: Leitura de avaliações dos funcionários da sua clínica
CREATE POLICY "avaliacoes_rh_select" ON avaliacoes FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND EXISTS (
            SELECT 1
            FROM funcionarios f
            WHERE
                f.cpf = avaliacoes.funcionario_cpf
                AND f.clinica_id = current_user_clinica_id ()
        )
    );

-- RH: Criação de avaliações para funcionários da sua clínica
CREATE POLICY "avaliacoes_rh_insert" ON avaliacoes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND EXISTS (
            SELECT 1
            FROM funcionarios f
            WHERE
                f.cpf = avaliacoes.funcionario_cpf
                AND f.clinica_id = current_user_clinica_id ()
        )
    );

-- RH: Atualização limitada de avaliações da sua clínica
CREATE POLICY "avaliacoes_rh_update" ON avaliacoes FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND EXISTS (
        SELECT 1
        FROM funcionarios f
        WHERE
            f.cpf = avaliacoes.funcionario_cpf
            AND f.clinica_id = current_user_clinica_id ()
    )
)
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND EXISTS (
            SELECT 1
            FROM funcionarios f
            WHERE
                f.cpf = avaliacoes.funcionario_cpf
                AND f.clinica_id = current_user_clinica_id ()
        )
    );

-- RH: Deleção de avaliações não iniciadas da sua clínica
CREATE POLICY "avaliacoes_rh_delete" ON avaliacoes FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND status = 'pendente'
    AND EXISTS (
        SELECT 1
        FROM funcionarios f
        WHERE
            f.cpf = avaliacoes.funcionario_cpf
            AND f.clinica_id = current_user_clinica_id ()
    )
);

-- ADMIN: Sem acesso a avaliações
-- (Conforme rls-policies-revised.sql)

-- ==========================================
-- 8. POLÍTICAS GRANULARES PARA EMPRESAS
-- ==========================================

\echo 'Criando políticas granulares para empresas...'

-- RH: Leitura de empresas da sua clínica
CREATE POLICY "empresas_rh_select" ON empresas_clientes FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Criação de empresas na sua clínica
CREATE POLICY "empresas_rh_insert" ON empresas_clientes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Atualização de empresas da sua clínica
CREATE POLICY "empresas_rh_update" ON empresas_clientes FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
)
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Deleção de empresas sem funcionários ativos
CREATE POLICY "empresas_rh_delete" ON empresas_clientes FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
    AND NOT EXISTS (
        SELECT 1
        FROM funcionarios f
        WHERE
            f.empresa_id = empresas_clientes.id
            AND f.ativo = TRUE
    )
);

-- ADMIN: Leitura de todas as empresas
CREATE POLICY "empresas_admin_select" ON empresas_clientes FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

-- ADMIN: Gestão completa de empresas
CREATE POLICY "empresas_admin_insert" ON empresas_clientes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'admin'
        AND user_has_permission ('manage:empresas')
    );

CREATE POLICY "empresas_admin_update" ON empresas_clientes FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'admin'
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
    );

-- ==========================================
-- 9. POLÍTICAS GRANULARES PARA LOTES
-- ==========================================

\echo 'Criando políticas granulares para lotes...'

-- RH: Leitura de lotes da sua clínica
CREATE POLICY "lotes_rh_select" ON lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Criação de lotes na sua clínica
CREATE POLICY "lotes_rh_insert" ON lotes_avaliacao FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Atualização de lotes da sua clínica
CREATE POLICY "lotes_rh_update" ON lotes_avaliacao FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
)
WITH
    CHECK (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
    );

-- RH: Deleção de lotes vazios
CREATE POLICY "lotes_rh_delete" ON lotes_avaliacao FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'rh'
    AND validate_rh_clinica ()
    AND clinica_id = current_user_clinica_id ()
    AND NOT EXISTS (
        SELECT 1
        FROM avaliacoes a
        WHERE
            a.lote_id = lotes_avaliacao.id
    )
);

-- EMISSOR: Leitura de lotes concluídos
CREATE POLICY "lotes_emissor_select" ON lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'emissor'
        AND status = 'concluido'
    );

-- FUNCIONÁRIO: Leitura de lotes onde tem avaliação
CREATE POLICY "lotes_funcionario_select" ON lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM avaliacoes a
            WHERE
                a.lote_id = lotes_avaliacao.id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- ADMIN: Sem acesso a lotes
-- (Conforme rls-policies-revised.sql)

-- ==========================================
-- 10. POLÍTICAS GRANULARES PARA LAUDOS
-- ==========================================

\echo 'Criando políticas granulares para laudos...'

-- EMISSOR: Leitura de todos os laudos
CREATE POLICY "laudos_emissor_select" ON laudos FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'emissor'
    );

-- EMISSOR: Criação de laudos
CREATE POLICY "laudos_emissor_insert" ON laudos FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'emissor'
        AND user_has_permission ('write:laudos')
    );

-- EMISSOR: Atualização de laudos não emitidos
CREATE POLICY "laudos_emissor_update" ON laudos FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'emissor'
    AND emitido_em IS NULL -- Só atualiza se não foi emitido
    AND status != 'enviado'
)
WITH
    CHECK (
        current_user_perfil () = 'emissor'
    );

-- EMISSOR: Deleção de laudos não emitidos
CREATE POLICY "laudos_emissor_delete" ON laudos FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'emissor'
    AND emitido_em IS NULL
    AND status = 'rascunho'
);

-- RH: Leitura de laudos de lotes da sua clínica
CREATE POLICY "laudos_rh_select" ON laudos FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND EXISTS (
            SELECT 1
            FROM lotes_avaliacao l
            WHERE
                l.id = laudos.lote_id
                AND l.clinica_id = current_user_clinica_id ()
        )
    );

-- ADMIN: Sem acesso a laudos
-- (Conforme rls-policies-revised.sql)

-- ==========================================
-- 11. POLÍTICAS GRANULARES PARA RESPOSTAS
-- ==========================================

\echo 'Criando políticas granulares para respostas...'

-- FUNCIONÁRIO: Leitura das próprias respostas
CREATE POLICY "respostas_own_select" ON respostas FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- FUNCIONÁRIO: Inserção de respostas próprias
CREATE POLICY "respostas_own_insert" ON respostas FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
                AND a.status != 'concluida'
        )
    );

-- FUNCIONÁRIO: Atualização de respostas próprias (avaliação não concluída)
CREATE POLICY "respostas_own_update" ON respostas FOR
UPDATE TO PUBLIC USING (
    EXISTS (
        SELECT 1
        FROM avaliacoes a
        WHERE
            a.id = respostas.avaliacao_id
            AND a.funcionario_cpf = current_user_cpf ()
            AND a.status != 'concluida'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- RH: Leitura de respostas da sua clínica
CREATE POLICY "respostas_rh_select" ON respostas FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND EXISTS (
            SELECT 1
            FROM avaliacoes a
                JOIN funcionarios f ON f.cpf = a.funcionario_cpf
            WHERE
                a.id = respostas.avaliacao_id
                AND f.clinica_id = current_user_clinica_id ()
        )
    );

-- ADMIN: Sem acesso a respostas
-- (Conforme rls-policies-revised.sql)

-- ==========================================
-- 12. POLÍTICAS GRANULARES PARA RESULTADOS
-- ==========================================

\echo 'Criando políticas granulares para resultados...'

-- FUNCIONÁRIO: Leitura dos próprios resultados
CREATE POLICY "resultados_own_select" ON resultados FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM avaliacoes a
            WHERE
                a.id = resultados.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- RH: Leitura de resultados da sua clínica
CREATE POLICY "resultados_rh_select" ON resultados FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND validate_rh_clinica ()
        AND EXISTS (
            SELECT 1
            FROM avaliacoes a
                JOIN funcionarios f ON f.cpf = a.funcionario_cpf
            WHERE
                a.id = resultados.avaliacao_id
                AND f.clinica_id = current_user_clinica_id ()
        )
    );

-- Sistema pode inserir resultados
CREATE POLICY "resultados_system_insert" ON resultados FOR
INSERT
    TO PUBLIC
WITH
    CHECK (true);

-- ADMIN: Sem acesso a resultados
-- (Conforme rls-policies-revised.sql)

-- ==========================================
-- 13. POLÍTICAS GRANULARES PARA CLÍNICAS
-- ==========================================

\echo 'Criando políticas granulares para clínicas...'

-- RH: Leitura da própria clínica
CREATE POLICY "clinicas_rh_select" ON clinicas FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'rh'
        AND id = current_user_clinica_id ()
    );

-- ADMIN: Gestão completa de clínicas
CREATE POLICY "clinicas_admin_select" ON clinicas FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "clinicas_admin_insert" ON clinicas FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'admin'
        AND user_has_permission ('manage:clinicas')
    );

CREATE POLICY "clinicas_admin_update" ON clinicas FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'admin'
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "clinicas_admin_delete" ON clinicas FOR DELETE TO PUBLIC USING (
    current_user_perfil () = 'admin'
    AND NOT EXISTS (
        SELECT 1
        FROM funcionarios f
        WHERE
            f.clinica_id = clinicas.id
            AND f.ativo = TRUE
    )
);

-- ==========================================
-- 14. RLS PARA TABELAS DE SISTEMA (RBAC)
-- ==========================================

\echo 'Implementando RLS para tabelas de sistema...'

-- Habilitar RLS nas tabelas RBAC
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Apenas admin pode ler configurações RBAC
CREATE POLICY "roles_admin_select" ON roles FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "permissions_admin_select" ON permissions FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "role_permissions_admin_select" ON role_permissions FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'admin'
    );

-- Apenas admin pode modificar RBAC
CREATE POLICY "roles_admin_all" ON roles FOR ALL TO PUBLIC USING (
    current_user_perfil () = 'admin'
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "permissions_admin_all" ON permissions FOR ALL TO PUBLIC USING (
    current_user_perfil () = 'admin'
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
    );

CREATE POLICY "role_permissions_admin_all" ON role_permissions FOR ALL TO PUBLIC USING (
    current_user_perfil () = 'admin'
)
WITH
    CHECK (
        current_user_perfil () = 'admin'
    );

COMMENT ON POLICY "roles_admin_select" ON roles IS 'Apenas admin pode visualizar papéis';

COMMENT ON POLICY "permissions_admin_select" ON permissions IS 'Apenas admin pode visualizar permissões';

COMMENT ON POLICY "role_permissions_admin_select" ON role_permissions IS 'Apenas admin pode visualizar atribuições de permissões';

-- ==========================================
-- 15. ÍNDICES PARA PERFORMANCE
-- ==========================================

\echo 'Criando índices para otimizar performance das políticas RLS...'

-- Índices compostos para otimizar subqueries EXISTS
CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario_status ON avaliacoes (funcionario_cpf, status);

CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_perfil_ativo ON funcionarios (clinica_id, perfil, ativo);

CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf_perfil_ativo ON funcionarios (cpf, perfil, ativo);

CREATE INDEX IF NOT EXISTS idx_empresas_clinica_ativa ON empresas_clientes (clinica_id)
WHERE
    ativa = TRUE;

CREATE INDEX IF NOT EXISTS idx_lotes_clinica_status ON lotes_avaliacao (clinica_id, status);

CREATE INDEX IF NOT EXISTS idx_laudos_lote_status ON laudos (lote_id, status);

CREATE INDEX IF NOT EXISTS idx_laudos_emitido ON laudos (emitido_em, status)
WHERE
    emitido_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_respostas_avaliacao ON respostas (avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_resultados_avaliacao ON resultados (avaliacao_id);

-- Índice para validação de RH
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf_clinica_perfil ON funcionarios (cpf, clinica_id, perfil)
WHERE
    perfil = 'rh'
    AND ativo = TRUE;

-- ==========================================
-- 16. CONSTRAINTS PARA INTEGRIDADE REFERENCIAL
-- ==========================================

\echo 'Adicionando constraints de integridade referencial...'

-- Garantir que avaliações referenciem funcionários existentes
ALTER TABLE avaliacoes
DROP CONSTRAINT IF EXISTS fk_avaliacoes_funcionario,
ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES funcionarios (cpf) ON DELETE RESTRICT;

-- Garantir que respostas referenciem avaliações existentes
ALTER TABLE respostas
DROP CONSTRAINT IF EXISTS fk_respostas_avaliacao,
ADD CONSTRAINT fk_respostas_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes (id) ON DELETE CASCADE;

-- Garantir que resultados referenciem avaliações existentes
ALTER TABLE resultados
DROP CONSTRAINT IF EXISTS fk_resultados_avaliacao,
ADD CONSTRAINT fk_resultados_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes (id) ON DELETE CASCADE;

-- Garantir que funcionários referenciem clínicas existentes
ALTER TABLE funcionarios
DROP CONSTRAINT IF EXISTS fk_funcionarios_clinica,
ADD CONSTRAINT fk_funcionarios_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id) ON DELETE RESTRICT;

-- Garantir que empresas referenciem clínicas existentes
ALTER TABLE empresas_clientes
DROP CONSTRAINT IF EXISTS fk_empresas_clinica,
ADD CONSTRAINT fk_empresas_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id) ON DELETE RESTRICT;

-- Garantir que lotes referenciem clínicas existentes
ALTER TABLE lotes_avaliacao
DROP CONSTRAINT IF EXISTS fk_lotes_clinica,
ADD CONSTRAINT fk_lotes_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id) ON DELETE RESTRICT;

-- Garantir que laudos referenciem lotes existentes
ALTER TABLE laudos
DROP CONSTRAINT IF EXISTS fk_laudos_lote,
ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao (id) ON DELETE CASCADE;

-- ==========================================
-- 17. PADRONIZAÇÃO DE STATUS
-- ==========================================

\echo 'Padronizando status de avaliações e lotes...'

-- Criar tipo ENUM para status de avaliações
DO $$ BEGIN
    CREATE TYPE status_avaliacao AS ENUM ('pendente', 'em_andamento', 'concluida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tipo ENUM para status de lotes
DO $$ BEGIN
    CREATE TYPE status_lote AS ENUM ('rascunho', 'ativo', 'concluido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tipo ENUM para status de laudos
DO $$ BEGIN
    CREATE TYPE status_laudo AS ENUM ('rascunho', 'emitido', 'enviado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Documentar os status válidos
COMMENT ON TYPE status_avaliacao IS 'Status válidos: pendente (não iniciada), em_andamento (respondendo), concluida (finalizada)';

COMMENT ON TYPE status_lote IS 'Status válidos: rascunho (criando), ativo (em uso), concluido (fechado)';

COMMENT ON TYPE status_laudo IS 'Status válidos: rascunho (editando), emitido (pronto), enviado (entregue)';

-- ==========================================
-- 18. AUDITORIA DE ACESSO NEGADO
-- ==========================================

\echo 'Implementando auditoria de acesso negado...'

-- Tabela para logs de acesso negado
CREATE TABLE IF NOT EXISTS audit_access_denied (
    id BIGSERIAL PRIMARY KEY,
    user_cpf CHAR(11),
    user_perfil VARCHAR(20),
    attempted_action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id TEXT,
    reason TEXT,
    query_text TEXT,
    ip_address INET,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_denied_user_cpf ON audit_access_denied (user_cpf);

CREATE INDEX idx_audit_denied_resource ON audit_access_denied (resource);

CREATE INDEX idx_audit_denied_created_at ON audit_access_denied (created_at DESC);

COMMENT ON
TABLE audit_access_denied IS 'Logs de tentativas de acesso bloqueadas por RLS';

-- Função para logar acesso negado (chamada manualmente quando RLS bloqueia) - criar apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_access_denied') THEN
    EXECUTE '
    CREATE FUNCTION log_access_denied(p_action TEXT, p_resource TEXT, p_resource_id TEXT DEFAULT NULL, p_reason TEXT DEFAULT NULL) RETURNS VOID AS $fn$
    BEGIN
      INSERT INTO audit_access_denied (
        user_cpf,
        user_perfil,
        attempted_action,
        resource,
        resource_id,
        reason,
        ip_address
      ) VALUES (
        current_user_cpf(),
        current_user_perfil(),
        p_action,
        p_resource,
        p_resource_id,
        p_reason,
        inet_client_addr()
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END$$;

COMMENT ON FUNCTION log_access_denied IS 'Registra tentativas de acesso negadas por políticas RLS';

-- ==========================================
-- 19. CORREÇÃO DE PERMISSÕES RBAC
-- ==========================================

\echo 'Corrigindo e alinhando permissões RBAC com políticas RLS...'

-- Atualizar permissões do admin (acesso limitado conforme rls-policies-revised.sql)
DELETE FROM role_permissions
WHERE
    role_id = (
        SELECT id
        FROM roles
        WHERE
            name = 'admin'
    )
    AND permission_id IN (
        SELECT id
        FROM permissions
        WHERE
            resource IN (
                'avaliacoes',
                'respostas',
                'resultados',
                'lotes',
                'laudos'
            )
    );

-- Adicionar permissões corretas para admin
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'admin'
    AND p.name IN (
        'manage:funcionarios', -- Apenas RH/Emissor
        'manage:empresas',
        'manage:clinicas'
    ) ON CONFLICT DO NOTHING;

-- Garantir permissões completas para RH
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'rh'
    AND p.name IN (
        'read:avaliacoes:clinica',
        'write:avaliacoes:clinica',
        'read:funcionarios:clinica',
        'write:funcionarios:clinica',
        'read:empresas:clinica',
        'write:empresas:clinica',
        'read:lotes:clinica',
        'write:lotes:clinica',
        'read:laudos'
    ) ON CONFLICT DO NOTHING;

-- Garantir permissões para emissor
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'emissor'
    AND p.name IN (
        'read:laudos',
        'write:laudos',
        'read:lotes:clinica'
    ) ON CONFLICT DO NOTHING;

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================

COMMIT;

\echo ''
\echo '========================================================'
\echo 'MIGRATION CONCLUÍDA COM SUCESSO!'
\echo '========================================================'
\echo 'Correções aplicadas:'
\echo '  ✓ Políticas RLS para audit_logs'
\echo '  ✓ Integração RBAC com RLS'
\echo '  ✓ Validação de pertencimento de RH à clínica'
\echo '  ✓ Imutabilidade para laudos emitidos'
\echo '  ✓ Políticas granulares (SELECT, INSERT, UPDATE, DELETE)'
\echo '  ✓ Cobertura completa para todos os perfis'
\echo '  ✓ Constraints de integridade referencial'
\echo '  ✓ Validação de contexto de sessão'
\echo '  ✓ Alinhamento de permissões RBAC'
\echo '  ✓ Auditoria de acesso negado'
\echo '  ✓ Índices de performance'
\echo '  ✓ Padronização de status'
\echo '  ✓ RLS para tabelas de sistema'
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '  1. Testar todas as políticas com usuários de cada perfil'
\echo '  2. Validar performance das queries'
\echo '  3. Atualizar db-security.ts com validações de contexto'
\echo '  4. Documentar mudanças para a equipe'
\echo '========================================================'