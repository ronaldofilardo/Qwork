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
-- Nota: Tabela renomeada de 'tomadores' para 'entidades' na Migration 420
DO $$
BEGIN
    -- Verificar e adicionar na tabela entidades (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'entidades_responsavel_cpf_unique'
            AND table_name = 'entidades'
        ) THEN
            ALTER TABLE entidades
            ADD CONSTRAINT entidades_responsavel_cpf_unique UNIQUE (responsavel_cpf);
            RAISE NOTICE 'Constraint entidades_responsavel_cpf_unique criada';
        END IF;
    -- Fallback para tomadores (antes da Migration 420)
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'tomadores_responsavel_cpf_unique'
            AND table_name = 'tomadores'
        ) THEN
            ALTER TABLE tomadores
            ADD CONSTRAINT tomadores_responsavel_cpf_unique UNIQUE (responsavel_cpf);
            RAISE NOTICE 'Constraint tomadores_responsavel_cpf_unique criada (será migrada na Migration 420)';
        END IF;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint responsavel_cpf_unique já existe ou não pode ser criada';
END $$;

-- ==========================================
-- 2. ÍNDICES INADEQUADOS
-- ==========================================

-- Adicionar índices compostos para performance
-- Nota: Adaptado para tabela 'entidades' (renomeada de 'tomadores' na Migration 420)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
        CREATE INDEX IF NOT EXISTS idx_entidades_tipo_status_ativa
        ON entidades (tipo, status, ativa);
        
        CREATE INDEX IF NOT EXISTS idx_entidades_status_data_cadastro
        ON entidades (status, criado_em DESC);
        
        CREATE INDEX IF NOT EXISTS idx_entidades_aprovado_em
        ON entidades (aprovado_em) WHERE aprovado_em IS NOT NULL;
        
        RAISE NOTICE 'Índices criados na tabela entidades';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores') THEN
        CREATE INDEX IF NOT EXISTS idx_tomadores_tipo_status_ativa
        ON tomadores (tipo, status, ativa);
        
        CREATE INDEX IF NOT EXISTS idx_tomadores_status_data_cadastro
        ON tomadores (status, criado_em DESC);
        
        CREATE INDEX IF NOT EXISTS idx_tomadores_aprovado_em
        ON tomadores (aprovado_em) WHERE aprovado_em IS NOT NULL;
        
        RAISE NOTICE 'Índices criados na tabela tomadores (serão migrados na Migration 420)';
    END IF;
END $$;

-- ==========================================
-- 3. FUNÇÃO entidade_pode_logar() - IMPLEMENTAR
-- ==========================================
-- Nota: Função renomeada de 'contratante_pode_logar' para 'entidade_pode_logar' na Migration 420

CREATE OR REPLACE FUNCTION public.entidade_pode_logar(p_entidade_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_pagamento_confirmado BOOLEAN;
    v_data_liberacao TIMESTAMP;
    v_status status_aprovacao_enum;
    v_ativa BOOLEAN;
    v_table_name TEXT;
BEGIN
    -- Detectar tabela correta (entidades ou tomadores)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entidades') THEN
        v_table_name := 'entidades';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tomadores') THEN
        v_table_name := 'tomadores';
    ELSE
        RAISE EXCEPTION 'Tabela entidades/tomadores não encontrada';
    END IF;

    -- Executar query na tabela correta
    EXECUTE format('
        SELECT pagamento_confirmado, data_liberacao_login, status, ativa
        FROM public.%I
        WHERE id = $1
    ', v_table_name)
    INTO v_pagamento_confirmado, v_data_liberacao, v_status, v_ativa
    USING p_entidade_id;

    -- Regra: precisa ter pagamento confirmado, data de liberação definida, status aprovado e estar ativa
    RETURN COALESCE(v_pagamento_confirmado, false)
        AND v_data_liberacao IS NOT NULL
        AND v_status = 'aprovado'
        AND COALESCE(v_ativa, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Manter função antiga para retrocompatibilidade (alias)
CREATE OR REPLACE FUNCTION public.contratante_pode_logar(p_contratante_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.entidade_pode_logar(p_contratante_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 4. TRIGGER DE ATUALIZAÇÃO GLOBAL - OTIMIZAR
-- ==========================================

-- Remover trigger antigo
DROP TRIGGER IF EXISTS trg_tomadores_updated_at ON tomadores;

-- Criar trigger otimizado (só dispara quando algo muda)
CREATE TRIGGER trg_tomadores_updated_at
    BEFORE UPDATE ON tomadores
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)  -- Só dispara se algo realmente mudou
    EXECUTE FUNCTION update_tomadores_updated_at();

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
DROP TRIGGER IF EXISTS trg_validar_transicao_status ON tomadores;
CREATE TRIGGER trg_validar_transicao_status
    BEFORE UPDATE OF status ON tomadores
    FOR EACH ROW
    EXECUTE FUNCTION validar_transicao_status_contratante();

-- ==========================================
-- 6. MELHORIAS ADICIONAIS
-- ==========================================

-- Adicionar comentários para documentação
COMMENT ON FUNCTION public.contratante_pode_logar IS 'Verifica se um contratante pode fazer login baseado em regras de negócio';
COMMENT ON INDEX idx_tomadores_tipo_status_ativa IS 'Otimiza consultas por tipo, status e atividade';
COMMENT ON INDEX idx_tomadores_status_data_cadastro IS 'Otimiza listagem de tomadores por status e data';

COMMIT;

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================