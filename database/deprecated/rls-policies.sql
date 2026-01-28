-- Políticas RLS (Row Level Security) para isolamento de dados
-- Este script deve ser executado após a criação das tabelas

-- Habilitar RLS nas tabelas
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE empresas_clientes ENABLE ROW LEVEL SECURITY;

ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;

ALTER TABLE lotes_avaliacao ENABLE ROW LEVEL SECURITY;

ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;

ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;

-- Políticas para FUNCIONARIOS
-- Funcionário só vê seus próprios dados
CREATE POLICY "funcionario_own_data" ON funcionarios FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'funcionario'
    AND cpf = current_setting ('app.current_user_cpf', true)
);

-- RH vê funcionários de sua clínica E da empresa específica (quando empresa_id é fornecido)
CREATE POLICY "rh_clinica_funcionarios" ON funcionarios
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND clinica_id::text = current_setting('app.current_user_clinica_id', true)
    );

-- Política adicional para RH: isolamento por empresa quando necessário
-- Esta política complementa a anterior para casos onde o RH deve ver apenas funcionários de uma empresa específica
CREATE POLICY "rh_empresa_funcionarios" ON funcionarios
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND clinica_id::text = current_setting('app.current_user_clinica_id', true)
        AND (
            -- Se empresa_id não for especificado na query, permitir ver todos da clínica
            current_setting('app.query_empresa_filter', true) IS NULL
            OR
            -- Se empresa_id for especificado, filtrar por empresa
            empresa_id::text = current_setting('app.query_empresa_filter', true)
        )
    );

-- Admin vê todos os funcionários
CREATE POLICY "admin_all_funcionarios" ON funcionarios FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para AVALIACOES
-- Funcionário vê suas próprias avaliações
CREATE POLICY "funcionario_own_avaliacoes" ON avaliacoes FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'funcionario'
    AND funcionario_cpf = current_setting ('app.current_user_cpf', true)
);

-- RH vê avaliações de funcionários de sua clínica
CREATE POLICY "rh_clinica_avaliacoes" ON avaliacoes
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND EXISTS (
            SELECT 1 FROM funcionarios f
            WHERE f.cpf = avaliacoes.funcionario_cpf
            AND f.clinica_id::text = current_setting('app.current_user_clinica_id', true)
        )
    );

-- Admin vê todas as avaliações
CREATE POLICY "admin_all_avaliacoes" ON avaliacoes FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para EMPRESAS_CLIENTES
-- Funcionário não vê empresas (sem política)
-- RH vê empresas de sua clínica
CREATE POLICY "rh_clinica_empresas" ON empresas_clientes
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND clinica_id::text = current_setting('app.current_user_clinica_id', true)
    );

-- Admin vê todas as empresas
CREATE POLICY "admin_all_empresas" ON empresas_clientes FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para LOTES_AVALIACAO
-- RH vê lotes de sua clínica
CREATE POLICY "rh_clinica_lotes" ON lotes_avaliacao
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND clinica_id::text = current_setting('app.current_user_clinica_id', true)
    );

-- Emissor vê apenas lotes finalizados/concluídos
CREATE POLICY "emissor_lotes_finalizados" ON lotes_avaliacao FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'emissor'
    AND status IN ('finalizado', 'concluido')
);

-- Admin vê todos os lotes
CREATE POLICY "admin_all_lotes" ON lotes_avaliacao FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para LAUDOS
-- Emissor vê todos os laudos (pode gerenciar)
CREATE POLICY "emissor_all_laudos" ON laudos FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'emissor'
);

-- Admin vê todos os laudos
CREATE POLICY "admin_all_laudos" ON laudos FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para RESPOSTAS
-- Funcionário vê suas próprias respostas
CREATE POLICY "funcionario_own_respostas" ON respostas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'funcionario'
    AND EXISTS (
        SELECT 1
        FROM avaliacoes a
        WHERE
            a.id = respostas.avaliacao_id
            AND a.funcionario_cpf = current_setting ('app.current_user_cpf', true)
    )
);

-- RH vê respostas de funcionários de sua clínica
CREATE POLICY "rh_clinica_respostas" ON respostas
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND EXISTS (
            SELECT 1 FROM avaliacoes a
            JOIN funcionarios f ON f.cpf = a.funcionario_cpf
            WHERE a.id = respostas.avaliacao_id
            AND f.clinica_id::text = current_setting('app.current_user_clinica_id', true)
        )
    );

-- Admin vê todas as respostas
CREATE POLICY "admin_all_respostas" ON respostas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para RESULTADOS
-- Funcionário vê seus próprios resultados
CREATE POLICY "funcionario_own_resultados" ON resultados FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'funcionario'
    AND EXISTS (
        SELECT 1
        FROM avaliacoes a
        WHERE
            a.id = resultados.avaliacao_id
            AND a.funcionario_cpf = current_setting ('app.current_user_cpf', true)
    )
);

-- RH vê resultados de funcionários de sua clínica
CREATE POLICY "rh_clinica_resultados" ON resultados
    FOR ALL USING (
        current_setting('app.current_user_perfil', true) = 'rh'
        AND EXISTS (
            SELECT 1 FROM avaliacoes a
            JOIN funcionarios f ON f.cpf = a.funcionario_cpf
            WHERE a.id = resultados.avaliacao_id
            AND f.clinica_id::text = current_setting('app.current_user_clinica_id', true)
        )
    );

-- Admin vê todos os resultados
CREATE POLICY "admin_all_resultados" ON resultados FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
);

-- Políticas para CLINICAS
current_setting ( 'app.current_user_perfil', true );

-- RH vê apenas sua própria clínica
CREATE POLICY "rh_own_clinica" ON clinicas FOR SELECT USING (
    current_setting('app.current_user_perfil', true) = 'rh'
    AND id::text = current_setting('app.current_user_clinica_id', true)
);

-- Admin vê todas as clínicas
CREATE POLICY "admin_all_clinicas" ON clinicas FOR ALL USING (
    current_setting (
        'app.current_user_perfil',
        true
    ) = 'admin'
);