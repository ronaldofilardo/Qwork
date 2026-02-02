-- Tabelas para sistema de planos e notificações financeiras
-- Fase 2: Criação de estrutura de banco de dados

-- Tabela de MFA (Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS mfa_codes (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_funcionarios FOREIGN KEY (cpf) REFERENCES funcionarios(cpf) ON DELETE CASCADE
);

CREATE INDEX idx_mfa_cpf_active ON mfa_codes(cpf, used, expires_at) WHERE used = false;

-- Tipos de planos
CREATE TYPE tipo_plano AS ENUM ('personalizado', 'fixo');

-- Tabela de planos (catálogo)
CREATE TABLE IF NOT EXISTS planos (
    id SERIAL PRIMARY KEY,
    tipo tipo_plano NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_por_funcionario DECIMAL(10,2), -- Para personalizado, será NULL
    preco DECIMAL(10,2), -- Para fixo
    limite_funcionarios INTEGER, -- Para fixo
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir planos padrão
INSERT INTO planos (tipo, nome, descricao, preco, limite_funcionarios)
VALUES 
    ('fixo', 'Plano Fixo Básico', 'Até 50 funcionários', 1224.00, 50),
    ('fixo', 'Plano Fixo Premium', 'Até 200 funcionários', 3999.99, 200)
ON CONFLICT DO NOTHING;

-- Tabela de contratos de planos (associação entidade/clínica com plano)
CREATE TABLE IF NOT EXISTS contratos_planos (
    id SERIAL PRIMARY KEY,
    plano_id INTEGER REFERENCES planos(id),
    clinica_id INTEGER REFERENCES clinicas(id),
    contratante_id INTEGER REFERENCES contratantes(id),
    tipo_contratante VARCHAR(20) NOT NULL CHECK (tipo_contratante IN ('clinica', 'entidade')),
    
    -- Para plano personalizado
    valor_personalizado_por_funcionario DECIMAL(10,2),
    
    -- Vigência do contrato
    data_contratacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_vigencia DATE NOT NULL, -- data_contratacao + 364 dias
    
    -- Estimativa e controle
    numero_funcionarios_estimado INTEGER NOT NULL,
    numero_funcionarios_atual INTEGER DEFAULT 0,
    
    -- Parcelamento
    forma_pagamento VARCHAR(20) DEFAULT 'anual' CHECK (forma_pagamento IN ('anual', 'mensal')),
    numero_parcelas INTEGER DEFAULT 1 CHECK (numero_parcelas BETWEEN 1 AND 12),
    
    -- Status
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'vencido', 'cancelado', 'renovacao_pendente')),
    bloqueado BOOLEAN DEFAULT FALSE, -- Bloqueia alterações durante vigência
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_tipo_contratante CHECK (
        (tipo_contratante = 'clinica' AND clinica_id IS NOT NULL AND contratante_id IS NULL) OR
        (tipo_contratante = 'entidade' AND contratante_id IS NOT NULL AND clinica_id IS NULL)
    )
);

-- Índices para performance
CREATE INDEX idx_contratos_clinica ON contratos_planos(clinica_id);
CREATE INDEX idx_contratos_contratante ON contratos_planos(contratante_id);
CREATE INDEX idx_contratos_vigencia ON contratos_planos(data_fim_vigencia, status);

-- Tabela de histórico de contratos (snapshots para auditoria)
CREATE TABLE IF NOT EXISTS historico_contratos_planos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos_planos(id),
    plano_id INTEGER,
    valor_snapshot DECIMAL(10,2),
    numero_funcionarios_snapshot INTEGER,
    data_snapshot TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(100),
    alterado_por VARCHAR(11) -- CPF do admin
);

-- Tabela de notificações financeiras
CREATE TABLE IF NOT EXISTS notificacoes_financeiras (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos_planos(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('limite_excedido', 'renovacao_proxima', 'pagamento_vencido', 'alerta_geral')),
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lida_em TIMESTAMP
);

CREATE INDEX idx_notificacoes_contrato ON notificacoes_financeiras(contrato_id, lida);
CREATE INDEX idx_notificacoes_tipo ON notificacoes_financeiras(tipo, lida);

-- Tabela de auditoria de planos
CREATE TABLE IF NOT EXISTS auditoria_planos (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER REFERENCES contratos_planos(id),
    plano_id INTEGER REFERENCES planos(id),
    acao VARCHAR(50) NOT NULL CHECK (acao IN ('criacao', 'alteracao_tentada', 'alteracao_sucesso', 'renovacao', 'cancelamento')),
    dados_anteriores JSONB,
    dados_novos JSONB,
    motivo TEXT,
    usuario_cpf VARCHAR(11) NOT NULL,
    ip_origem VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_contrato ON auditoria_planos(contrato_id, created_at);
CREATE INDEX idx_auditoria_usuario ON auditoria_planos(usuario_cpf, created_at);

-- View materializada para agregações de funcionários por contrato
CREATE MATERIALIZED VIEW IF NOT EXISTS view_funcionarios_por_contrato AS
SELECT 
    cp.id AS contrato_id,
    cp.clinica_id,
    cp.contratante_id,
    cp.tipo_contratante,
    COUNT(DISTINCT f.cpf) AS total_funcionarios_ativos,
    cp.numero_funcionarios_estimado,
    cp.limite_funcionarios,
    CASE 
        WHEN p.limite_funcionarios IS NOT NULL AND COUNT(DISTINCT f.cpf) > p.limite_funcionarios 
        THEN TRUE 
        ELSE FALSE 
    END AS limite_excedido
FROM contratos_planos cp
LEFT JOIN planos p ON cp.plano_id = p.id
LEFT JOIN funcionarios f ON (
    (cp.tipo_contratante = 'clinica' AND f.clinica_id = cp.clinica_id AND f.status = 'ativo')
    OR 
    (cp.tipo_contratante = 'entidade' AND f.contratante_id = cp.contratante_id AND f.status = 'ativo')
)
WHERE cp.status = 'ativo'
GROUP BY cp.id, cp.clinica_id, cp.contratante_id, cp.tipo_contratante, 
         cp.numero_funcionarios_estimado, cp.limite_funcionarios, p.limite_funcionarios;

CREATE UNIQUE INDEX idx_view_funcionarios_contrato ON view_funcionarios_por_contrato(contrato_id);

-- Função para atualizar view materializada
CREATE OR REPLACE FUNCTION refresh_funcionarios_por_contrato()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY view_funcionarios_por_contrato;
END;
$$ LANGUAGE plpgsql;

-- Trigger para bloquear alterações em contratos durante vigência
CREATE OR REPLACE FUNCTION bloquear_alteracao_contrato_vigente()
RETURNS TRIGGER AS $$
BEGIN
    -- Permitir alterações apenas em status e numero_funcionarios_atual
    IF OLD.bloqueado = TRUE AND OLD.data_fim_vigencia > CURRENT_DATE THEN
        IF (OLD.plano_id IS DISTINCT FROM NEW.plano_id) OR
           (OLD.valor_personalizado_por_funcionario IS DISTINCT FROM NEW.valor_personalizado_por_funcionario) THEN
            RAISE EXCEPTION 'Não é permitido alterar plano ou valores durante a vigência do contrato (364 dias). Vigência até: %', OLD.data_fim_vigencia;
        END IF;
    END IF;
    
    -- Atualizar timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bloquear_alteracao_contrato
BEFORE UPDATE ON contratos_planos
FOR EACH ROW
EXECUTE FUNCTION bloquear_alteracao_contrato_vigente();

-- Trigger para validar limites de funcionários
CREATE OR REPLACE FUNCTION validar_limite_funcionarios()
RETURNS TRIGGER AS $$
DECLARE
    v_contrato RECORD;
    v_plano RECORD;
    v_total_ativos INTEGER;
BEGIN
    -- Buscar contratos ativos relacionados ao funcionário
    FOR v_contrato IN 
        SELECT cp.*, p.limite_funcionarios
        FROM contratos_planos cp
        JOIN planos p ON cp.plano_id = p.id
        WHERE cp.status = 'ativo'
          AND ((cp.tipo_contratante = 'clinica' AND cp.clinica_id = NEW.clinica_id)
               OR (cp.tipo_contratante = 'entidade' AND cp.contratante_id = NEW.contratante_id))
          AND p.limite_funcionarios IS NOT NULL
    LOOP
        -- Contar funcionários ativos
        SELECT COUNT(*) INTO v_total_ativos
        FROM funcionarios f
        WHERE f.status = 'ativo'
          AND ((v_contrato.tipo_contratante = 'clinica' AND f.clinica_id = v_contrato.clinica_id)
               OR (v_contrato.tipo_contratante = 'entidade' AND f.contratante_id = v_contrato.contratante_id));
        
        -- Se exceder limite, criar notificação
        IF v_total_ativos > v_contrato.limite_funcionarios THEN
            INSERT INTO notificacoes_financeiras (contrato_id, tipo, titulo, mensagem, prioridade)
            VALUES (
                v_contrato.id,
                'limite_excedido',
                'Limite de funcionários excedido',
                format('O plano atual suporta até %s funcionários, mas há %s ativos. Considere upgrade do plano.', 
                       v_contrato.limite_funcionarios, v_total_ativos),
                'alta'
            );
        END IF;
        
        -- Atualizar contador atual
        UPDATE contratos_planos 
        SET numero_funcionarios_atual = v_total_ativos 
        WHERE id = v_contrato.id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limite_funcionarios
AFTER INSERT OR UPDATE ON funcionarios
FOR EACH ROW
WHEN (NEW.status = 'ativo')
EXECUTE FUNCTION validar_limite_funcionarios();

-- Trigger para criar snapshot em histórico
CREATE OR REPLACE FUNCTION criar_snapshot_contrato()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO historico_contratos_planos (
            contrato_id, 
            plano_id, 
            valor_snapshot,
            numero_funcionarios_snapshot,
            motivo
        ) VALUES (
            OLD.id,
            OLD.plano_id,
            COALESCE(OLD.valor_personalizado_por_funcionario, 
                     (SELECT valor_fixo_anual FROM planos WHERE id = OLD.plano_id)),
            OLD.numero_funcionarios_atual,
            'Alteração de contrato'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_snapshot_contrato
BEFORE UPDATE ON contratos_planos
FOR EACH ROW
EXECUTE FUNCTION criar_snapshot_contrato();

-- Função para verificar contratos próximos de renovação (job mensal)
CREATE OR REPLACE FUNCTION notificar_renovacoes_proximas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_contrato RECORD;
BEGIN
    FOR v_contrato IN 
        SELECT * FROM contratos_planos 
        WHERE status = 'ativo' 
          AND data_fim_vigencia BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    LOOP
        INSERT INTO notificacoes_financeiras (contrato_id, tipo, titulo, mensagem, prioridade)
        VALUES (
            v_contrato.id,
            'renovacao_proxima',
            'Renovação de contrato próxima',
            format('O contrato vence em %s. Prepare-se para renovação ou upgrade.', v_contrato.data_fim_vigencia),
            'normal'
        )
        ON CONFLICT DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular custo mensal de um contrato
CREATE OR REPLACE FUNCTION calcular_custo_contrato(p_contrato_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    v_contrato RECORD;
    v_plano RECORD;
    v_custo DECIMAL;
BEGIN
    SELECT * INTO v_contrato FROM contratos_planos WHERE id = p_contrato_id;
    SELECT * INTO v_plano FROM planos WHERE id = v_contrato.plano_id;
    
    IF v_plano.tipo = 'personalizado' THEN
        -- Custo = valor por funcionário × funcionários ativos
        v_custo := v_contrato.valor_personalizado_por_funcionario * v_contrato.numero_funcionarios_atual;
    ELSE
        -- Custo fixo dividido pelas parcelas
        v_custo := v_plano.valor_fixo_anual / v_contrato.numero_parcelas;
    END IF;
    
    RETURN v_custo;
END;
$$ LANGUAGE plpgsql;
