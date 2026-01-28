-- ==========================================
-- MIGRAÇÃO 028: CORREÇÕES DE BANCO DE DADOS - NÍVEL ALTO
-- Data: 2025-12-22
-- Descrição: Correções críticas de constraints, índices e validações
-- ==========================================

BEGIN;

-- ==========================================
-- 1. CONSTRAINTS INCOMPLETAS
-- ==========================================

-- Adicionar constraint de unicidade em responsavel_cpf
DO $$
BEGIN
    -- Verificar se já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'contratantes_responsavel_cpf_unique'
        AND table_name = 'contratantes'
    ) THEN
        ALTER TABLE contratantes
        ADD CONSTRAINT contratantes_responsavel_cpf_unique UNIQUE (responsavel_cpf);
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint responsavel_cpf_unique já existe ou não pode ser criada';
END $$;

-- ==========================================
-- 2. ÍNDICES INADEQUADOS
-- ==========================================

-- Adicionar índices compostos para performance
CREATE INDEX IF NOT EXISTS idx_contratantes_tipo_status_ativa
ON contratantes (tipo, status, ativa);

CREATE INDEX IF NOT EXISTS idx_contratantes_status_data_cadastro
ON contratantes (status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_contratantes_aprovado_em
ON contratantes (aprovado_em) WHERE aprovado_em IS NOT NULL;

-- ==========================================
-- 3. FUNÇÃO contratante_pode_logar() - IMPLEMENTAR
-- ==========================================

CREATE OR REPLACE FUNCTION public.contratante_pode_logar(p_contratante_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_pagamento_confirmado BOOLEAN;
    v_data_liberacao TIMESTAMP;
    v_status status_aprovacao_enum;
    v_ativa BOOLEAN;
BEGIN
    SELECT pagamento_confirmado, data_liberacao_login, status, ativa
    INTO v_pagamento_confirmado, v_data_liberacao, v_status, v_ativa
    FROM public.contratantes
    WHERE id = p_contratante_id;

    -- Regra: precisa ter pagamento confirmado, data de liberação definida, status aprovado e estar ativa
    RETURN COALESCE(v_pagamento_confirmado, false)
        AND v_data_liberacao IS NOT NULL
        AND v_status = 'aprovado'
        AND COALESCE(v_ativa, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 4. TRIGGER DE ATUALIZAÇÃO GLOBAL - OTIMIZAR
-- ==========================================

-- Remover trigger antigo
DROP TRIGGER IF EXISTS trg_contratantes_updated_at ON contratantes;

-- Criar trigger otimizado (só dispara quando algo muda)
CREATE TRIGGER trg_contratantes_updated_at
    BEFORE UPDATE ON contratantes
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)  -- Só dispara se algo realmente mudou
    EXECUTE FUNCTION update_contratantes_updated_at();

-- ==========================================
-- 5. VALIDAÇÃO DE TRANSIÇÃO DE ESTADOS
-- ==========================================

-- Função para validar transições de status
CREATE OR REPLACE FUNCTION validar_transicao_status_contratante()
RETURNS TRIGGER AS $$
BEGIN
    -- Impedir transições inválidas
    IF OLD.status = 'rejeitado' AND NEW.status != 'rejeitado' THEN
        RAISE EXCEPTION 'Contratante rejeitado não pode ter status alterado';
    END IF;

    IF OLD.status = 'aprovado' AND NEW.status NOT IN ('aprovado', 'cancelado') THEN
        RAISE EXCEPTION 'Contratante aprovado só pode ser cancelado';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação de transição
DROP TRIGGER IF EXISTS trg_validar_transicao_status ON contratantes;
CREATE TRIGGER trg_validar_transicao_status
    BEFORE UPDATE OF status ON contratantes
    FOR EACH ROW
    EXECUTE FUNCTION validar_transicao_status_contratante();

-- ==========================================
-- 6. MELHORIAS ADICIONAIS
-- ==========================================

-- Adicionar comentários para documentação
COMMENT ON FUNCTION public.contratante_pode_logar IS 'Verifica se um contratante pode fazer login baseado em regras de negócio';
COMMENT ON INDEX idx_contratantes_tipo_status_ativa IS 'Otimiza consultas por tipo, status e atividade';
COMMENT ON INDEX idx_contratantes_status_data_cadastro IS 'Otimiza listagem de contratantes por status e data';

COMMIT;

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================