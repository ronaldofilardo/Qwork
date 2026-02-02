-- Migration 304: Validação e Correção de Dados de Gestores
-- Data: 01/02/2026
-- Objetivo: Garantir integridade após refatoração de gestores

BEGIN;

-- 1. VALIDAR GESTORES: Todos em contratantes_senhas devem ter contratante_id
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM contratantes_senhas
    WHERE contratante_id IS NULL;
    
    IF v_invalid_count > 0 THEN
        RAISE WARNING 'Encontrados % gestores sem contratante_id em contratantes_senhas', v_invalid_count;
        
        -- Tentar preencher automaticamente baseado no responsavel_cpf
        UPDATE contratantes_senhas cs
        SET contratante_id = c.id
        FROM contratantes c
        WHERE cs.contratante_id IS NULL
          AND cs.cpf = c.responsavel_cpf;
        
        RAISE NOTICE 'Atualizado contratante_id para gestores órfãos';
    END IF;
END $$;

-- 2. VALIDAR LOTES: Verificar se existem lotes com liberado_por inválido
DO $$
DECLARE
    v_invalid_lotes INTEGER;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO v_invalid_lotes
    FROM lotes_avaliacao la
    LEFT JOIN contratantes_senhas cs ON la.liberado_por = cs.cpf
    WHERE cs.cpf IS NULL;
    
    IF v_invalid_lotes > 0 THEN
        RAISE WARNING 'Existem % lotes com liberado_por invalido (nao esta em contratantes_senhas)', v_invalid_lotes;
        
        -- Listar os CPFs problematicos
        RAISE NOTICE 'CPFs problematicos:';
        FOR r IN (
            SELECT DISTINCT la.liberado_por
            FROM lotes_avaliacao la
            LEFT JOIN contratantes_senhas cs ON la.liberado_por = cs.cpf
            WHERE cs.cpf IS NULL
        ) LOOP
            RAISE NOTICE '  - CPF: %', r.liberado_por;
        END LOOP;
    ELSE
        RAISE NOTICE 'OK: Todos os lotes tem liberado_por valido';
    END IF;
END $$;

-- 3. CRIAR ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_contratantes_senhas_contratante_id 
ON contratantes_senhas(contratante_id);

CREATE INDEX IF NOT EXISTS idx_lotes_avaliacao_liberado_por 
ON lotes_avaliacao(liberado_por);

-- 4. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN lotes_avaliacao.liberado_por IS 
'CPF do gestor que liberou o lote. Referencia contratantes_senhas(cpf) para gestores de entidade ou RH de clínica';

COMMENT ON CONSTRAINT lotes_avaliacao_liberado_por_fkey ON lotes_avaliacao IS 
'FK para contratantes_senhas - gestores não estão em funcionarios após refatoração';

COMMIT;

-- VALIDAÇÃO FINAL
SELECT 
    'contratantes_senhas' as tabela,
    COUNT(*) as total_gestores,
    COUNT(*) FILTER (WHERE contratante_id IS NOT NULL) as com_contratante_id,
    COUNT(*) FILTER (WHERE contratante_id IS NULL) as sem_contratante_id
FROM contratantes_senhas
UNION ALL
SELECT 
    'lotes_avaliacao' as tabela,
    COUNT(*) as total_lotes,
    COUNT(*) FILTER (WHERE liberado_por IN (SELECT cpf FROM contratantes_senhas)) as liberado_por_valido,
    COUNT(*) FILTER (WHERE liberado_por NOT IN (SELECT cpf FROM contratantes_senhas)) as liberado_por_invalido
FROM lotes_avaliacao;
