-- Migration 015: Adicionar Constraints de Integridade para Contratantes
-- Data: 2026-01-13
-- Descrição: Adiciona CHECK constraints para garantir integridade do fluxo de contratação

-- ============================================================================
-- ADICIONAR CAMPOS NECESSÁRIOS (se não existirem)
-- ============================================================================

-- Campo para armazenar plano_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' AND column_name = 'plano_id'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN plano_id INTEGER;
        ALTER TABLE contratantes ADD CONSTRAINT fk_contratantes_plano 
            FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Campo para confirmar pagamento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' AND column_name = 'pagamento_confirmado'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN pagamento_confirmado BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

-- Campo para data de liberação de login
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratantes' AND column_name = 'data_liberacao_login'
    ) THEN
        ALTER TABLE contratantes ADD COLUMN data_liberacao_login TIMESTAMP;
    END IF;
END $$;

-- ============================================================================
-- CHECK CONSTRAINTS PARA INTEGRIDADE
-- ============================================================================

-- Constraint: Conta só pode estar ativa se pagamento foi confirmado
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_contratantes_ativa_pagamento;
ALTER TABLE contratantes ADD CONSTRAINT chk_contratantes_ativa_pagamento
    CHECK (ativa = false OR (ativa = true AND pagamento_confirmado = true));

-- Constraint: Se aprovado, deve ter data e CPF de aprovação
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_contratantes_aprovacao_completa;
ALTER TABLE contratantes ADD CONSTRAINT chk_contratantes_aprovacao_completa
    CHECK (
        status != 'aprovado' OR 
        (status = 'aprovado' AND aprovado_em IS NOT NULL AND aprovado_por_cpf IS NOT NULL)
    );

-- Constraint: Se ativa, deve ter data de liberação de login
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_contratantes_ativa_liberacao;
ALTER TABLE contratantes ADD CONSTRAINT chk_contratantes_ativa_liberacao
    CHECK (
        ativa = false OR 
        (ativa = true AND data_liberacao_login IS NOT NULL)
    );

-- Constraint: Se pagamento confirmado, deve ter plano_id
ALTER TABLE contratantes DROP CONSTRAINT IF EXISTS chk_contratantes_pagamento_plano;
ALTER TABLE contratantes ADD CONSTRAINT chk_contratantes_pagamento_plano
    CHECK (
        pagamento_confirmado = false OR 
        (pagamento_confirmado = true AND plano_id IS NOT NULL)
    );

-- ============================================================================
-- ÍNDICES ADICIONAIS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contratantes_pagamento_confirmado 
    ON contratantes (pagamento_confirmado);

CREATE INDEX IF NOT EXISTS idx_contratantes_plano_id 
    ON contratantes (plano_id);

CREATE INDEX IF NOT EXISTS idx_contratantes_status_pagamento 
    ON contratantes (status, pagamento_confirmado);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN contratantes.pagamento_confirmado IS 
    'Indica se o pagamento foi confirmado. Obrigatório true para ativar a conta';

COMMENT ON COLUMN contratantes.plano_id IS 
    'Referência ao plano contratado. Obrigatório quando pagamento_confirmado = true';

COMMENT ON COLUMN contratantes.data_liberacao_login IS 
    'Data e hora em que o login foi liberado após conclusão do fluxo de contratação';

-- ============================================================================
-- FUNÇÃO PARA VALIDAR TRANSIÇÕES DE ESTADO
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_contratante_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que status aprovado requer pagamento confirmado
    IF NEW.status = 'aprovado' AND NEW.pagamento_confirmado = false THEN
        RAISE EXCEPTION 'Não é possível aprovar contratante sem confirmação de pagamento';
    END IF;

    -- Validar que ativar conta requer status aprovado
    IF NEW.ativa = true AND NEW.status != 'aprovado' THEN
        RAISE EXCEPTION 'Não é possível ativar conta com status diferente de "aprovado"';
    END IF;

    -- Registrar data de liberação quando ativar
    IF NEW.ativa = true AND OLD.ativa = false AND NEW.data_liberacao_login IS NULL THEN
        NEW.data_liberacao_login = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_validate_contratante_state ON contratantes;
CREATE TRIGGER trg_validate_contratante_state
    BEFORE UPDATE ON contratantes
    FOR EACH ROW
    EXECUTE FUNCTION validate_contratante_state_transition();

-- ============================================================================
-- ATUALIZAR REGISTROS EXISTENTES (MIGRAÇÃO DE DADOS)
-- ============================================================================

-- Marcar como pagamento não confirmado onde ativa = false
UPDATE contratantes 
SET pagamento_confirmado = false 
WHERE pagamento_confirmado IS NULL AND ativa = false;

-- Para registros já ativos (legado), assumir pagamento confirmado
UPDATE contratantes 
SET 
    pagamento_confirmado = true,
    data_liberacao_login = COALESCE(aprovado_em, criado_em)
WHERE ativa = true AND pagamento_confirmado = false;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON CONSTRAINT chk_contratantes_ativa_pagamento ON contratantes IS
    'Garante que contas só podem ser ativadas após confirmação de pagamento';

COMMENT ON CONSTRAINT chk_contratantes_aprovacao_completa ON contratantes IS
    'Garante que aprovação inclui data e CPF do aprovador';

COMMENT ON FUNCTION validate_contratante_state_transition() IS
    'Valida transições de estado durante atualizações de contratantes';
