-- Migration: 600b_fix_funcionarios_clinicas_add_clinica_id.sql
-- Descrição: CORRIGE estrutura de funcionarios_clinicas - adiciona coluna clinica_id FALTANTE
-- Data: 2026-02-08
-- CRÍTICO: A tabela foi criada SEM a coluna clinica_id, violando a arquitetura segregada

-- =============================================================================
-- VALIDAÇÃO PRÉ-CORREÇÃO
-- =============================================================================

DO $$
DECLARE
    v_has_clinica_id BOOLEAN;
    v_total_registros INTEGER;
BEGIN
    -- Verificar se coluna clinica_id já existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios_clinicas' 
          AND column_name = 'clinica_id'
    ) INTO v_has_clinica_id;
    
    SELECT COUNT(*) INTO v_total_registros FROM funcionarios_clinicas;
    
    RAISE NOTICE '=== PRÉ-CORREÇÃO: ANÁLISE ===';
    RAISE NOTICE 'Total de registros em funcionarios_clinicas: %', v_total_registros;
    RAISE NOTICE 'Coluna clinica_id existe: %', v_has_clinica_id;
    
    IF v_has_clinica_id THEN
        RAISE NOTICE 'Coluna clinica_id já existe - nada a fazer';
    ELSE
        RAISE NOTICE 'CRÍTICO: Coluna clinica_id NÃO existe - será adicionada';
    END IF;
END $$;

-- =============================================================================
-- PASSO 1: Adicionar coluna clinica_id
-- =============================================================================

DO $$
DECLARE
    v_has_clinica_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios_clinicas' 
          AND column_name = 'clinica_id'
    ) INTO v_has_clinica_id;
    
    IF NOT v_has_clinica_id THEN
        -- Adicionar coluna temporariamente como NULLABLE
        ALTER TABLE funcionarios_clinicas 
            ADD COLUMN clinica_id INTEGER;
        
        RAISE NOTICE 'Coluna clinica_id adicionada (temporariamente NULL)';
    END IF;
END $$;

-- =============================================================================
-- PASSO 2: Popular clinica_id baseado em empresa_id
-- =============================================================================

-- Atualizar clinica_id com base na relação: empresa_id -> empresas_clientes.clinica_id
UPDATE funcionarios_clinicas fc
SET clinica_id = ec.clinica_id
FROM empresas_clientes ec
WHERE fc.empresa_id = ec.id
  AND fc.clinica_id IS NULL;

-- Log resultado
DO $$
DECLARE
    v_updated INTEGER;
    v_registros_sem_clinica INTEGER;
BEGIN
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    SELECT COUNT(*) INTO v_registros_sem_clinica
    FROM funcionarios_clinicas
    WHERE clinica_id IS NULL;
    
    RAISE NOTICE 'Registros atualizados com clinica_id: %', v_updated;
    RAISE NOTICE 'Registros ainda sem clinica_id: %', v_registros_sem_clinica;
    
    IF v_registros_sem_clinica > 0 THEN
        RAISE WARNING 'ATENÇÃO: % registros não puderam ser atualizados - empresas não têm clinica_id', v_registros_sem_clinica;
    END IF;
END $$;

-- =============================================================================
-- PASSO 3: Tornar clinica_id NOT NULL e adicionar FK
-- =============================================================================

-- Verificar se todos registros têm clinica_id antes de tornar NOT NULL
DO $$
DECLARE
    v_nulls INTEGER;
    v_orfaos RECORD;
BEGIN
    SELECT COUNT(*) INTO v_nulls
    FROM funcionarios_clinicas
    WHERE clinica_id IS NULL;
    
    IF v_nulls > 0 THEN
        RAISE WARNING 'Encontrados % registros sem clinica_id:', v_nulls;
        
        -- Detalhar registros problemáticos
        FOR v_orfaos IN (
            SELECT 
                fc.id,
                fc.funcionario_id,
                fc.empresa_id,
                f.nome AS funcionario_nome,
                ec.nome AS empresa_nome
            FROM funcionarios_clinicas fc
            LEFT JOIN funcionarios f ON f.id = fc.funcionario_id
            LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id
            WHERE fc.clinica_id IS NULL
            LIMIT 10
        )
        LOOP
            RAISE WARNING 'ID=% | Funcionário=% | Empresa=% | empresa_id=%',
                v_orfaos.id,
                v_orfaos.funcionario_nome,
                COALESCE(v_orfaos.empresa_nome, 'EMPRESA NÃO ENCONTRADA'),
                v_orfaos.empresa_id;
        END LOOP;
        
        RAISE EXCEPTION 'Impossível tornar clinica_id NOT NULL - existem % registros órfãos', v_nulls;
    END IF;
END $$;

-- Tornar NOT NULL
ALTER TABLE funcionarios_clinicas 
    ALTER COLUMN clinica_id SET NOT NULL;

RAISE NOTICE 'Coluna clinica_id agora é NOT NULL';

-- =============================================================================
-- PASSO 4: Adicionar Foreign Key para clinicas
-- =============================================================================

DO $$
BEGIN
    -- Verificar se FK já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_funcionarios_clinicas_clinica'
    ) THEN
        ALTER TABLE funcionarios_clinicas
            ADD CONSTRAINT fk_funcionarios_clinicas_clinica 
            FOREIGN KEY (clinica_id) 
            REFERENCES clinicas(id) 
            ON DELETE CASCADE;
        
        RAISE NOTICE 'FK fk_funcionarios_clinicas_clinica criada';
    ELSE
        RAISE NOTICE 'FK fk_funcionarios_clinicas_clinica já existe';
    END IF;
END $$;

-- =============================================================================
-- PASSO 5: Adicionar índices para clinica_id
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_func_clinicas_clinica 
    ON funcionarios_clinicas(clinica_id);

CREATE INDEX IF NOT EXISTS idx_func_clinicas_clinica_ativo 
    ON funcionarios_clinicas(clinica_id, ativo) 
    WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_func_clinicas_clinica_empresa_ativo 
    ON funcionarios_clinicas(clinica_id, empresa_id, ativo) 
    WHERE ativo = true;

RAISE NOTICE 'Índices criados para clinica_id';

-- =============================================================================
-- PASSO 6: Adicionar comentário explicativo
-- =============================================================================

COMMENT ON COLUMN funcionarios_clinicas.clinica_id IS 
'ID da clínica de medicina ocupacional que gerencia este funcionário (NOT NULL - obrigatório).
Esta coluna é essencial para a arquitetura segregada: identifica qual clínica tem acesso ao funcionário.';

-- =============================================================================
-- PASSO 7: Atualizar constraint UNIQUE para incluir clinica_id
-- =============================================================================

-- Dropar constraint antiga (funcionario_id, empresa_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'funcionarios_clinicas_unique'
    ) THEN
        ALTER TABLE funcionarios_clinicas 
            DROP CONSTRAINT funcionarios_clinicas_unique;
        RAISE NOTICE 'Constraint UNIQUE antiga removida';
    END IF;
END $$;

-- Criar nova constraint: um funcionário pode estar em múltiplas empresas,
-- mas não repetido na mesma empresa
CREATE UNIQUE INDEX IF NOT EXISTS funcionarios_clinicas_unique_func_empresa
    ON funcionarios_clinicas(funcionario_id, empresa_id);

RAISE NOTICE 'Nova constraint UNIQUE criada: (funcionario_id, empresa_id)';

-- =============================================================================
-- VALIDAÇÃO PÓS-CORREÇÃO
-- =============================================================================

DO $$
DECLARE
    v_total_registros INTEGER;
    v_registros_com_clinica INTEGER;
    v_clinicas_distintas INTEGER;
    v_empresas_distintas INTEGER;
    v_stats RECORD;
BEGIN
    SELECT COUNT(*) INTO v_total_registros FROM funcionarios_clinicas;
    SELECT COUNT(*) INTO v_registros_com_clinica FROM funcionarios_clinicas WHERE clinica_id IS NOT NULL;
    SELECT COUNT(DISTINCT clinica_id) INTO v_clinicas_distintas FROM funcionarios_clinicas WHERE ativo = true;
    SELECT COUNT(DISTINCT empresa_id) INTO v_empresas_distintas FROM funcionarios_clinicas WHERE ativo = true;
    
    RAISE NOTICE '=== PÓS-CORREÇÃO: VALIDAÇÃO ===';
    RAISE NOTICE 'Total de registros: %', v_total_registros;
    RAISE NOTICE 'Registros com clinica_id: %', v_registros_com_clinica;
    RAISE NOTICE 'Clínicas distintas (ativos): %', v_clinicas_distintas;
    RAISE NOTICE 'Empresas distintas (ativos): %', v_empresas_distintas;
    
    IF v_total_registros != v_registros_com_clinica THEN
        RAISE EXCEPTION 'ERRO: Nem todos os registros têm clinica_id';
    END IF;
    
    -- Verificar integridade: clinica_id das empresas bate com o da tabela
    DECLARE
        v_inconsistencias INTEGER;
    BEGIN
        SELECT COUNT(*) INTO v_inconsistencias
        FROM funcionarios_clinicas fc
        JOIN empresas_clientes ec ON ec.id = fc.empresa_id
        WHERE fc.clinica_id != ec.clinica_id;
        
        IF v_inconsistencias > 0 THEN
            RAISE EXCEPTION 'ERRO: % registros têm clinica_id inconsistente com a empresa', v_inconsistencias;
        END IF;
        
        RAISE NOTICE 'Integridade validada: clinica_id consistente com empresas';
    END;
    
    -- Estatísticas por clínica
    RAISE NOTICE '=== FUNCIONÁRIOS POR CLÍNICA (TOP 5) ===';
    FOR v_stats IN (
        SELECT 
            c.nome AS clinica_nome,
            COUNT(fc.id) AS total_funcionarios,
            COUNT(fc.id) FILTER (WHERE fc.ativo = true) AS funcionarios_ativos,
            COUNT(DISTINCT fc.empresa_id) AS empresas_distintas
        FROM clinicas c
        LEFT JOIN funcionarios_clinicas fc ON fc.clinica_id = c.id
        GROUP BY c.id, c.nome
        ORDER BY total_funcionarios DESC
        LIMIT 5
    )
    LOOP
        RAISE NOTICE 'Clínica: % | Funcionários: % (ativos: %) | Empresas: %',
            v_stats.clinica_nome,
            v_stats.total_funcionarios,
            v_stats.funcionarios_ativos,
            v_stats.empresas_distintas;
    END LOOP;
    
    RAISE NOTICE 'Migration 600b: Coluna clinica_id adicionada e populada com sucesso';
END $$;
