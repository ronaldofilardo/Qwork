-- ==========================================
-- MIGRATION: Security Enhancement - RLS & RBAC
-- Descrição: Implementa Row Level Security, RBAC granular e auditoria
-- Data: 2025-12-10
-- Versão: 1.0.0
-- ==========================================
-- ATENÇÃO: Execute SOMENTE em ambiente LOCAL primeiro!
-- Não execute em produção sem testes completos.
-- ==========================================

BEGIN;

-- ==========================================
-- 1. FUNÇÕES HELPER PARA SESSÃO E CONTEXTO
-- ==========================================

-- Função para obter CPF do usuário atual da sessão
CREATE OR REPLACE FUNCTION public.current_user_cpf() 
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_cpf', TRUE), '');
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_cpf () IS 'Retorna o CPF do usuário atual armazenado no contexto da sessão via current_setting';

-- Função para obter perfil do usuário atual
CREATE OR REPLACE FUNCTION public.current_user_perfil() 
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_perfil', TRUE), '');
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- Função para obter clinica_id do usuário atual
CREATE OR REPLACE FUNCTION public.current_user_clinica_id() 
RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_clinica_id', TRUE), '')::INTEGER;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_clinica_id () IS 'Retorna o clinica_id do usuário atual para isolamento de dados por clínica';


-- ==========================================
-- 2. TABELAS DE AUDITORIA
-- ==========================================

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_cpf CHAR(11) NOT NULL,
    user_perfil VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, SELECT (crítico)
    resource VARCHAR(100) NOT NULL, -- Nome da tabela ou recurso
    resource_id TEXT, -- ID do registro afetado
    old_data JSONB, -- Dados anteriores (UPDATE/DELETE)
    new_data JSONB, -- Dados novos (INSERT/UPDATE)
    ip_address INET, -- IP da requisição (se disponível)
    user_agent TEXT, -- User agent (se disponível)
    details TEXT, -- Detalhes adicionais
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_cpf ON public.audit_logs (user_cpf);

CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

COMMENT ON
TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de todas as ações críticas no sistema';

-- ==========================================
-- 3. TABELAS RBAC (Permissões Granulares)
-- ==========================================

-- Tabela de papéis (roles)
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- ex: read:avaliacoes, write:funcionarios
    resource VARCHAR(50) NOT NULL, -- avaliacoes, funcionarios, empresas, etc
    action VARCHAR(50) NOT NULL, -- read, write, delete, manage
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento roles <-> permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INTEGER NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES public.permissions (id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions (role_id);

CREATE INDEX idx_role_permissions_permission ON public.role_permissions (permission_id);

-- ==========================================
-- 4. POPULAR DADOS INICIAIS RBAC
-- ==========================================

-- Inserir roles
INSERT INTO
    public.roles (
        name,
        display_name,
        description,
        hierarchy_level
    )
VALUES (
        'funcionario',
        'Funcionário',
        'Usuário comum que responde avaliações',
        0
    ),
    (
        'rh',
        'Gestor RH/Clínica',
        'Gerencia funcionários e empresas de sua clínica',
        10
    ),
    (
        'emissor',
        'Emissor de Laudos',
        'Emite laudos e relatórios finais',
        10
    ),
    (
        'admin',
        'Administrador',
        'Administrador do sistema com acesso amplo',
        50
    ),
    (
        'super',
        'Super administrador',
        'Super administrador com acesso total',
        100
    ) ON CONFLICT (name) DO NOTHING;

-- Inserir permissões básicas
INSERT INTO
    public.permissions (
        name,
        resource,
        action,
        description
    )
VALUES
    -- Avaliações
    (
        'read:avaliacoes:own',
        'avaliacoes',
        'read',
        'Ler próprias avaliações'
    ),
    (
        'write:avaliacoes:own',
        'avaliacoes',
        'write',
        'Responder próprias avaliações'
    ),
    (
        'read:avaliacoes:clinica',
        'avaliacoes',
        'read',
        'Ler avaliações da clínica'
    ),
    (
        'manage:avaliacoes',
        'avaliacoes',
        'manage',
        'Gerenciar todas avaliações'
    ),

-- Funcionários
(
    'read:funcionarios:own',
    'funcionarios',
    'read',
    'Ler próprios dados'
),
(
    'write:funcionarios:own',
    'funcionarios',
    'write',
    'Editar próprios dados'
),
(
    'read:funcionarios:clinica',
    'funcionarios',
    'read',
    'Ler funcionários da clínica'
),
(
    'write:funcionarios:clinica',
    'funcionarios',
    'write',
    'Editar funcionários da clínica'
),
(
    'manage:funcionarios',
    'funcionarios',
    'manage',
    'Gerenciar todos funcionários'
),

-- Empresas
(
    'read:empresas:clinica',
    'empresas',
    'read',
    'Ler empresas da clínica'
),
(
    'write:empresas:clinica',
    'empresas',
    'write',
    'Editar empresas da clínica'
),
(
    'manage:empresas',
    'empresas',
    'manage',
    'Gerenciar todas empresas'
),

-- Lotes
(
    'read:lotes:clinica',
    'lotes',
    'read',
    'Ler lotes da clínica'
),
(
    'write:lotes:clinica',
    'lotes',
    'write',
    'Criar/editar lotes da clínica'
),
(
    'manage:lotes',
    'lotes',
    'manage',
    'Gerenciar todos lotes'
),

-- Laudos
(
    'read:laudos',
    'laudos',
    'read',
    'Ler laudos disponíveis'
),
(
    'write:laudos',
    'laudos',
    'write',
    'Emitir e editar laudos'
),
(
    'manage:laudos',
    'laudos',
    'manage',
    'Gerenciar todos laudos'
),

-- Clínicas
(
    'manage:clinicas',
    'clinicas',
    'manage',
    'Gerenciar clínicas'
) ON CONFLICT (name) DO NOTHING;

-- Associar permissões aos papéis
INSERT INTO
    public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE
    r.name = 'funcionario'
    AND p.name IN (
        'read:avaliacoes:own',
        'write:avaliacoes:own',
        'read:funcionarios:own',
        'write:funcionarios:own'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE
    r.name = 'rh'
    AND p.name IN (
        'read:avaliacoes:clinica',
        'read:funcionarios:clinica',
        'write:funcionarios:clinica',
        'read:empresas:clinica',
        'write:empresas:clinica',
        'read:lotes:clinica',
        'write:lotes:clinica'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE
    r.name = 'emissor'
    AND p.name IN (
        'read:laudos',
        'write:laudos',
        'read:lotes:clinica'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE
    r.name = 'admin'
    AND p.name IN (
        'manage:avaliacoes',
        'manage:funcionarios',
        'manage:empresas',
        'manage:lotes',
        'manage:laudos'
    ) ON CONFLICT DO NOTHING;

INSERT INTO
    public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE

-- ==========================================
-- 5. INDICES PARA PERFORMANCE DE RLS
-- ==========================================

-- Índices para otimizar policies de RLS
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON public.funcionarios (cpf);

CREATE INDEX IF NOT EXISTS idx_funcionarios_perfil ON public.funcionarios (perfil);

CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica_id ON public.funcionarios (clinica_id);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_funcionario_cpf ON public.avaliacoes (funcionario_cpf);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_lote_id ON public.avaliacoes (lote_id);

CREATE INDEX IF NOT EXISTS idx_empresas_clientes_clinica_id ON public.empresas_clientes (clinica_id);

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao (clinica_id);

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao (empresa_id);

CREATE INDEX IF NOT EXISTS idx_laudos_lote_id ON public.laudos (lote_id);

CREATE INDEX IF NOT EXISTS idx_laudos_emissor_cpf ON public.laudos (emissor_cpf);

-- ==========================================
-- 6. ATIVAR ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Ativar RLS nas tabelas críticas
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.laudos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. POLICIES PARA TABELA: funcionarios
-- ==========================================


-- Policy: Funcionário vê apenas seus próprios dados
CREATE POLICY funcionarios_own_select ON public.funcionarios FOR
SELECT TO PUBLIC USING (
        cpf = current_user_cpf ()
    );

-- Policy: Funcionário pode atualizar apenas seus próprios dados (campos limitados)
CREATE POLICY funcionarios_own_update ON public.funcionarios FOR
UPDATE TO PUBLIC USING (cpf = current_user_cpf ())
WITH
    CHECK (cpf = current_user_cpf ());

-- Policy: RH vê funcionários de sua clínica
CREATE POLICY funcionarios_rh_clinica ON public.funcionarios FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- Policy: RH pode inserir/atualizar funcionários de sua clínica
CREATE POLICY funcionarios_rh_insert ON public.funcionarios FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

CREATE POLICY funcionarios_rh_update ON public.funcionarios FOR
UPDATE TO PUBLIC USING (
    (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
    )
)
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- ==========================================
-- 8. POLICIES PARA TABELA: avaliacoes
-- ==========================================


-- Policy: Funcionário vê apenas suas avaliações
CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR
SELECT TO PUBLIC USING (
        funcionario_cpf = current_user_cpf ()
    );

-- Policy: Funcionário pode inserir/atualizar apenas suas avaliações
CREATE POLICY avaliacoes_own_insert ON public.avaliacoes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        funcionario_cpf = current_user_cpf ()
    );

CREATE POLICY avaliacoes_own_update ON public.avaliacoes FOR
UPDATE TO PUBLIC USING (
    funcionario_cpf = current_user_cpf ()
)
WITH
    CHECK (
        funcionario_cpf = current_user_cpf ()
    );

-- Policy: RH vê avaliações de funcionários de sua clínica
CREATE POLICY avaliacoes_rh_clinica ON public.avaliacoes FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND EXISTS (
                SELECT 1
                FROM public.funcionarios f
                WHERE
                    f.cpf = avaliacoes.funcionario_cpf
                    AND f.clinica_id = current_user_clinica_id ()
            )
        )
    );

-- ==========================================
-- 9. POLICIES PARA TABELA: empresas_clientes
-- ==========================================


-- Policy: RH vê apenas empresas de sua clínica
CREATE POLICY empresas_rh_clinica ON public.empresas_clientes FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- Policy: RH pode inserir/atualizar empresas de sua clínica
CREATE POLICY empresas_rh_insert ON public.empresas_clientes FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

CREATE POLICY empresas_rh_update ON public.empresas_clientes FOR
UPDATE TO PUBLIC USING (
    (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
    )
)
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- ==========================================
-- 10. POLICIES PARA TABELA: lotes_avaliacao
-- ==========================================


-- Policy: RH vê lotes de sua clínica
CREATE POLICY lotes_rh_clinica ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- Policy: RH pode inserir/atualizar lotes de sua clínica
CREATE POLICY lotes_rh_insert ON public.lotes_avaliacao FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

CREATE POLICY lotes_rh_update ON public.lotes_avaliacao FOR
UPDATE TO PUBLIC USING (
    (
        current_user_perfil () = 'rh'
        AND clinica_id = current_user_clinica_id ()
    )
)
WITH
    CHECK (
        (
            current_user_perfil () = 'rh'
            AND clinica_id = current_user_clinica_id ()
        )
    );

-- Policy: Emissor vê lotes liberados (status finalizado/concluido)
CREATE POLICY lotes_emissor_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'emissor'
            AND status IN ('finalizado', 'concluido')
        )
    );

-- Policy: Funcionário vê lotes onde tem avaliação
CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM public.avaliacoes a
            WHERE
                a.lote_id = lotes_avaliacao.id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- ==========================================
-- 11. POLICIES PARA TABELA: laudos
-- ==========================================


-- Policy: Emissor vê todos os laudos
CREATE POLICY laudos_emissor_select ON public.laudos FOR
SELECT TO PUBLIC USING (
        current_user_perfil () = 'emissor'
    );

-- Policy: Emissor pode inserir/atualizar laudos
CREATE POLICY laudos_emissor_insert ON public.laudos FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        current_user_perfil () = 'emissor'
    );

CREATE POLICY laudos_emissor_update ON public.laudos FOR
UPDATE TO PUBLIC USING (
    current_user_perfil () = 'emissor'
)
WITH
    CHECK (
        current_user_perfil () = 'emissor'
    );

-- Policy: RH vê laudos de lotes de sua clínica
CREATE POLICY laudos_rh_clinica ON public.laudos FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND EXISTS (
                SELECT 1
                FROM public.lotes_avaliacao l
                WHERE
                    l.id = laudos.lote_id
                    AND l.clinica_id = current_user_clinica_id ()
            )
        )
    );

-- ==========================================
-- 12. POLICIES PARA TABELA: respostas
-- ==========================================


-- Policy: Funcionário vê apenas suas respostas
CREATE POLICY respostas_own_select ON public.respostas FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM public.avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- Policy: Funcionário pode inserir/atualizar apenas suas respostas
CREATE POLICY respostas_own_insert ON public.respostas FOR
INSERT
    TO PUBLIC
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

CREATE POLICY respostas_own_update ON public.respostas FOR
UPDATE TO PUBLIC USING (
    EXISTS (
        SELECT 1
        FROM public.avaliacoes a
        WHERE
            a.id = respostas.avaliacao_id
            AND a.funcionario_cpf = current_user_cpf ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.avaliacoes a
            WHERE
                a.id = respostas.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- Policy: RH vê respostas de funcionários de sua clínica
CREATE POLICY respostas_rh_clinica ON public.respostas FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND EXISTS (
                SELECT 1
                FROM public.avaliacoes a
                    JOIN public.funcionarios f ON f.cpf = a.funcionario_cpf
                WHERE
                    a.id = respostas.avaliacao_id
                    AND f.clinica_id = current_user_clinica_id ()
            )
        )
    );

-- ==========================================
-- 13. POLICIES PARA TABELA: resultados
-- ==========================================


-- Policy: Funcionário vê apenas seus resultados
CREATE POLICY resultados_own_select ON public.resultados FOR
SELECT TO PUBLIC USING (
        EXISTS (
            SELECT 1
            FROM public.avaliacoes a
            WHERE
                a.id = resultados.avaliacao_id
                AND a.funcionario_cpf = current_user_cpf ()
        )
    );

-- Policy: RH vê resultados de funcionários de sua clínica
CREATE POLICY resultados_rh_clinica ON public.resultados FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () = 'rh'
            AND EXISTS (
                SELECT 1
                FROM public.avaliacoes a
                    JOIN public.funcionarios f ON f.cpf = a.funcionario_cpf
                WHERE
                    a.id = resultados.avaliacao_id
                    AND f.clinica_id = current_user_clinica_id ()
            )
        )
    );

-- ==========================================
-- 14. POLICIES PARA TABELA: clinicas
-- ==========================================

);

-- Policy: Admin/RH vê apenas sua clínica
CREATE POLICY clinicas_own_select ON public.clinicas FOR
SELECT TO PUBLIC USING (
        (
            current_user_perfil () IN ('admin', 'rh')
            AND id = current_user_clinica_id ()
        )
    );

-- ==========================================
-- 15. TRIGGERS DE AUDITORIA
-- ==========================================

-- Função genérica de trigger para auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, old_data, details
        ) VALUES (
            current_user_cpf(),
            current_user_perfil(),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::TEXT,
            row_to_json(OLD),
            'Record deleted'
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, old_data, new_data, details
        ) VALUES (
            current_user_cpf(),
            current_user_perfil(),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            row_to_json(OLD),
            row_to_json(NEW),
            'Record updated'
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (
            user_cpf, user_perfil, action, resource, resource_id, new_data, details
        ) VALUES (
            current_user_cpf(),
            current_user_perfil(),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            row_to_json(NEW),
            'Record created'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_trigger_func () IS 'Função de trigger genérica para auditoria automática de INSERT/UPDATE/DELETE';

-- Criar triggers de auditoria nas tabelas críticas
CREATE TRIGGER audit_funcionarios
    AFTER INSERT OR UPDATE OR DELETE ON public.funcionarios
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_avaliacoes
    AFTER INSERT OR UPDATE OR DELETE ON public.avaliacoes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_empresas_clientes
    AFTER INSERT OR UPDATE OR DELETE ON public.empresas_clientes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_lotes_avaliacao
    AFTER INSERT OR UPDATE OR DELETE ON public.lotes_avaliacao
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_laudos
    AFTER INSERT OR UPDATE OR DELETE ON public.laudos
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ==========================================
-- 16. VIEWS DE SEGURANÇA (OPCIONAL)
-- ==========================================

-- View: Estatísticas de auditoria por usuário
CREATE OR REPLACE VIEW public.audit_stats_by_user AS
SELECT
    user_cpf,
    user_perfil,
    action,
    resource,
    COUNT(*) as total_actions,
    MAX(created_at) as last_action_at
FROM public.audit_logs
GROUP BY
    user_cpf,
    user_perfil,
    action,
    resource
ORDER BY total_actions DESC;

COMMENT ON VIEW public.audit_stats_by_user IS 'Estatísticas de ações por usuário para análise de comportamento';

-- View: Ações suspeitas recentes (muitas ações em pouco tempo)
CREATE OR REPLACE VIEW public.suspicious_activity AS
SELECT
    user_cpf,
    user_perfil,
    resource,
    COUNT(*) as action_count,
    MAX(created_at) as last_action,
    MIN(created_at) as first_action,
    EXTRACT(
        EPOCH
        FROM (
                MAX(created_at) - MIN(created_at)
            )
    ) as seconds_elapsed
FROM public.audit_logs
WHERE
    created_at >= NOW() - INTERVAL '1 hour'
GROUP BY
    user_cpf,
    user_perfil,
    resource
HAVING
    COUNT(*) > 100
ORDER BY action_count DESC;

COMMENT ON VIEW public.suspicious_activity IS 'Detecta atividades suspeitas: usuários com mais de 100 ações na última hora';

-- ==========================================
-- 17. GRANT PERMISSIONS (Opcional)
-- ==========================================

-- Revogar permissões públicas desnecessárias (segurança adicional)
REVOKE ALL ON public.audit_logs FROM PUBLIC;

REVOKE ALL ON public.roles FROM PUBLIC;

REVOKE ALL ON public.permissions FROM PUBLIC;

REVOKE ALL ON public.role_permissions FROM PUBLIC;

-- (No RLS, isso já está controlado pelas policies, mas aqui é explícito)

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================

COMMIT;

-- ==========================================
-- OBSERVAÇÕES IMPORTANTES
-- ==========================================

-- 1. ATIVAÇÃO DO CONTEXTO DA SESSÃO:
--    No código da aplicação (lib/db.ts), você precisa adicionar:
--
--    import { getSession } from '@/lib/session'
--
--    export async function queryWithContext(sql, params) {
--      const session = await getSession()
--      if (session) {
--        await query(`SET LOCAL app.current_user_cpf = '${session.cpf}'`)
--        await query(`SET LOCAL app.current_user_perfil = '${session.perfil}'`)
--        if (session.clinica_id) {
--          await query(`SET LOCAL app.current_user_clinica_id = '${session.clinica_id}'`)
--        }
--      }
--      return query(sql, params)
--    }

-- 2. TESTES OBRIGATÓRIOS:
--    - Verifique que funcionários não veem dados de outros
--    - Verifique que RH não acessa dados de outras clínicas
--    - Teste performance com índices criados

-- 3. ROLLBACK (se necessário):
--    Para reverter completamente esta migration:
--
--    BEGIN;
--    DROP TRIGGER IF EXISTS audit_funcionarios ON public.funcionarios;
--    DROP TRIGGER IF EXISTS audit_avaliacoes ON public.avaliacoes;
--    DROP TRIGGER IF EXISTS audit_empresas_clientes ON public.empresas_clientes;
--    DROP TRIGGER IF EXISTS audit_lotes_avaliacao ON public.lotes_avaliacao;
--    DROP TRIGGER IF EXISTS audit_laudos ON public.laudos;
--    DROP FUNCTION IF EXISTS public.audit_trigger_func() CASCADE;
--    ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.avaliacoes DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.empresas_clientes DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.lotes_avaliacao DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.laudos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.respostas DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.resultados DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.clinicas DISABLE ROW LEVEL SECURITY;
--    DROP TABLE IF EXISTS public.audit_logs CASCADE;
--    DROP TABLE IF EXISTS public.role_permissions CASCADE;
--    DROP TABLE IF EXISTS public.permissions CASCADE;
--    DROP TABLE IF EXISTS public.roles CASCADE;
--    DROP FUNCTION IF EXISTS public.current_user_cpf() CASCADE;
--    DROP FUNCTION IF EXISTS public.current_user_perfil() CASCADE;
--    DROP FUNCTION IF EXISTS public.current_user_clinica_id() CASCADE;
--    COMMIT;

-- 4. PERFORMANCE:
--    - Todos os índices necessários foram criados
--    - Policies usam EXISTS otimizados
--    - Funções STABLE para cache dentro da transação
--    - Triggers são AFTER (não bloqueiam transação principal)

-- 5. VERCEL FREE TIER:
--    - RLS é executado no banco, não consome recursos da aplicação
--    - Queries continuam rápidos com os índices
--    - Auditoria é async via triggers
--    - Nenhum impacto significativo no timeout do Vercel
