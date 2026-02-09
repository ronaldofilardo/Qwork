-- Migration: 601_migrate_funcionarios_data.sql
-- Descrição: Migra dados existentes de funcionarios para tabelas intermediárias
-- Data: 2026-02-08
-- Depende: 600_create_funcionarios_relationships.sql

-- =============================================================================
-- VALIDAÇÃO PRÉ-MIGRAÇÃO
-- =============================================================================

DO $$
DECLARE
    v_total_funcionarios INTEGER;
    v_func_com_contratante INTEGER;
    v_func_com_clinica INTEGER;
    v_func_com_empresa INTEGER;
    v_func_sem_vinculo INTEGER;
BEGIN
    -- Contar totais
    SELECT COUNT(*) INTO v_total_funcionarios 
    FROM funcionarios 
    WHERE perfil = 'funcionario';
    
    SELECT COUNT(*) INTO v_func_com_contratante 
    FROM funcionarios 
    WHERE perfil = 'funcionario' 
      AND contratante_id IS NOT NULL 
      AND clinica_id IS NULL 
      AND empresa_id IS NULL;
    
    SELECT COUNT(*) INTO v_func_com_clinica 
    FROM funcionarios 
    WHERE perfil = 'funcionario' 
      AND clinica_id IS NOT NULL 
      AND empresa_id IS NOT NULL;
    
    SELECT COUNT(*) INTO v_func_sem_vinculo 
    FROM funcionarios 
    WHERE perfil = 'funcionario' 
      AND contratante_id IS NULL 
      AND clinica_id IS NULL 
      AND empresa_id IS NULL;
    
    -- Log
    RAISE NOTICE '=== PRÉ-MIGRAÇÃO: ANÁLISE DE DADOS ===';
    RAISE NOTICE 'Total de funcionários: %', v_total_funcionarios;
    RAISE NOTICE 'Funcionários com contratante_id (entidades): %', v_func_com_contratante;
    RAISE NOTICE 'Funcionários com clinica_id+empresa_id: %', v_func_com_clinica;
    RAISE NOTICE 'Funcionários sem vínculo: %', v_func_sem_vinculo;
    
    IF v_func_sem_vinculo > 0 THEN
        RAISE WARNING 'Existem % funcionários sem vínculo definido - verificar dados', v_func_sem_vinculo;
    END IF;
END $$;

-- =============================================================================
-- MIGRAÇÃO 1: Funcionários de ENTIDADES
-- =============================================================================

INSERT INTO funcionarios_entidades (
    funcionario_id,
    entidade_id,
    ativo,
    data_vinculo,
    criado_em,
    atualizado_em
)
SELECT 
    f.id AS funcionario_id,
    f.contratante_id AS entidade_id,
    f.ativo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS data_vinculo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS criado_em,
    COALESCE(f.atualizado_em, CURRENT_TIMESTAMP) AS atualizado_em
FROM funcionarios f
WHERE f.perfil = 'funcionario'
  AND f.contratante_id IS NOT NULL
  AND f.clinica_id IS NULL
  AND f.empresa_id IS NULL
  AND EXISTS (
      SELECT 1 FROM tomadores t 
      WHERE t.id = f.contratante_id 
        AND t.tipo = 'entidade'
  )
ON CONFLICT (funcionario_id, entidade_id) DO NOTHING;

-- Log resultado
DO $$
DECLARE
    v_inserted INTEGER;
BEGIN
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    RAISE NOTICE 'Migrados % funcionários para funcionarios_entidades', v_inserted;
END $$;

-- =============================================================================
-- MIGRAÇÃO 2: Funcionários de CLÍNICAS
-- =============================================================================

INSERT INTO funcionarios_clinicas (
    funcionario_id,
    clinica_id,
    empresa_id,
    ativo,
    data_vinculo,
    criado_em,
    atualizado_em
)
SELECT 
    f.id AS funcionario_id,
    f.clinica_id,
    f.empresa_id,
    f.ativo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS data_vinculo,
    COALESCE(f.criado_em, CURRENT_TIMESTAMP) AS criado_em,
    COALESCE(f.atualizado_em, CURRENT_TIMESTAMP) AS atualizado_em
FROM funcionarios f
WHERE f.perfil = 'funcionario'
  AND f.clinica_id IS NOT NULL
  AND f.empresa_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM clinicas c 
      WHERE c.id = f.clinica_id
  )
  AND EXISTS (
      SELECT 1 FROM empresas_clientes ec 
      WHERE ec.id = f.empresa_id
        AND ec.clinica_id = f.clinica_id
  )
ON CONFLICT (funcionario_id, empresa_id) DO NOTHING;

-- Log resultado
DO $$
DECLARE
    v_inserted INTEGER;
BEGIN
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    RAISE NOTICE 'Migrados % funcionários para funcionarios_clinicas', v_inserted;
END $$;

-- =============================================================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- =============================================================================

DO $$
DECLARE
    v_total_funcionarios INTEGER;
    v_func_entidades INTEGER;
    v_func_clinicas INTEGER;
    v_func_sem_relacionamento INTEGER;
    v_funcionarios_orfaos RECORD;
BEGIN
    -- Contar totais
    SELECT COUNT(*) INTO v_total_funcionarios 
    FROM funcionarios 
    WHERE perfil = 'funcionario';
    
    SELECT COUNT(DISTINCT funcionario_id) INTO v_func_entidades 
    FROM funcionarios_entidades 
    WHERE ativo = true;
    
    SELECT COUNT(DISTINCT funcionario_id) INTO v_func_clinicas 
    FROM funcionarios_clinicas 
    WHERE ativo = true;
    
    -- Verificar funcionários órfãos (sem relacionamento)
    SELECT COUNT(*) INTO v_func_sem_relacionamento
    FROM funcionarios f
    WHERE f.perfil = 'funcionario'
      AND f.id NOT IN (
          SELECT funcionario_id FROM funcionarios_entidades WHERE ativo = true
          UNION
          SELECT funcionario_id FROM funcionarios_clinicas WHERE ativo = true
      );
    
    -- Log
    RAISE NOTICE '=== PÓS-MIGRAÇÃO: VALIDAÇÃO ===';
    RAISE NOTICE 'Total de funcionários: %', v_total_funcionarios;
    RAISE NOTICE 'Funcionários em entidades: %', v_func_entidades;
    RAISE NOTICE 'Funcionários em clínicas: %', v_func_clinicas;
    RAISE NOTICE 'Funcionários sem relacionamento: %', v_func_sem_relacionamento;
    
    -- Verificar se há problemas
    IF v_func_sem_relacionamento > 0 THEN
        RAISE WARNING 'ATENÇÃO: % funcionários não foram migrados para as tabelas intermediárias', v_func_sem_relacionamento;
        
        -- Detalhar os órfãos
        FOR v_funcionarios_orfaos IN (
            SELECT 
                f.id,
                f.cpf,
                f.nome,
                f.contratante_id,
                f.clinica_id,
                f.empresa_id,
                f.perfil
            FROM funcionarios f
            WHERE f.perfil = 'funcionario'
              AND f.id NOT IN (
                  SELECT funcionario_id FROM funcionarios_entidades WHERE ativo = true
                  UNION
                  SELECT funcionario_id FROM funcionarios_clinicas WHERE ativo = true
              )
            LIMIT 10
        )
        LOOP
            RAISE WARNING 'Funcionário órfão: ID=%, CPF=%, Nome=%, contratante_id=%, clinica_id=%, empresa_id=%',
                v_funcionarios_orfaos.id,
                v_funcionarios_orfaos.cpf,
                v_funcionarios_orfaos.nome,
                v_funcionarios_orfaos.contratante_id,
                v_funcionarios_orfaos.clinica_id,
                v_funcionarios_orfaos.empresa_id;
        END LOOP;
    ELSE
        RAISE NOTICE 'Sucesso: Todos os funcionários foram migrados corretamente';
    END IF;
    
    -- Verificar se as contagens batem
    IF (v_func_entidades + v_func_clinicas) != v_total_funcionarios THEN
        IF v_func_sem_relacionamento = 0 THEN
            -- Se não há órfãos mas as contagens não batem, pode haver funcionários em ambas tabelas
            RAISE NOTICE 'Nota: Alguns funcionários podem estar em ambas as tabelas (histórico)';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
-- =============================================================================

DO $$
DECLARE
    v_fk_violations INTEGER;
BEGIN
    -- Verificar se todas as FKs em funcionarios_entidades são válidas
    SELECT COUNT(*) INTO v_fk_violations
    FROM funcionarios_entidades fe
    WHERE NOT EXISTS (SELECT 1 FROM tomadores t WHERE t.id = fe.entidade_id AND t.tipo = 'entidade');
    
    IF v_fk_violations > 0 THEN
        RAISE EXCEPTION 'Integridade violada: % registros em funcionarios_entidades apontam para tomadores inválidos', v_fk_violations;
    END IF;
    
    -- Verificar se todas as FKs em funcionarios_clinicas são válidas
    SELECT COUNT(*) INTO v_fk_violations
    FROM funcionarios_clinicas fc
    WHERE NOT EXISTS (
        SELECT 1 FROM empresas_clientes ec 
        WHERE ec.id = fc.empresa_id 
          AND ec.clinica_id = fc.clinica_id
    );
    
    IF v_fk_violations > 0 THEN
        RAISE EXCEPTION 'Integridade violada: % registros em funcionarios_clinicas têm empresa_id incompatível com clinica_id', v_fk_violations;
    END IF;
    
    RAISE NOTICE 'Integridade referencial validada com sucesso';
END $$;

-- =============================================================================
-- ESTATÍSTICAS FINAIS
-- =============================================================================

DO $$
DECLARE
    v_stats RECORD;
BEGIN
    RAISE NOTICE '=== ESTATÍSTICAS FINAIS ===';
    
    -- Por entidade
    FOR v_stats IN (
        SELECT 
            t.nome AS entidade_nome,
            COUNT(fe.id) AS total_funcionarios,
            COUNT(fe.id) FILTER (WHERE fe.ativo = true) AS funcionarios_ativos
        FROM tomadores t
        LEFT JOIN funcionarios_entidades fe ON fe.entidade_id = t.id
        WHERE t.tipo = 'entidade'
        GROUP BY t.id, t.nome
        ORDER BY total_funcionarios DESC
        LIMIT 5
    )
    LOOP
        RAISE NOTICE 'Entidade: % | Funcionários: % (ativos: %)',
            v_stats.entidade_nome,
            v_stats.total_funcionarios,
            v_stats.funcionarios_ativos;
    END LOOP;
    
    -- Por clínica
    FOR v_stats IN (
        SELECT 
            c.nome AS clinica_nome,
            COUNT(fc.id) AS total_funcionarios,
            COUNT(fc.id) FILTER (WHERE fc.ativo = true) AS funcionarios_ativos
        FROM clinicas c
        LEFT JOIN funcionarios_clinicas fc ON fc.clinica_id = c.id
        GROUP BY c.id, c.nome
        ORDER BY total_funcionarios DESC
        LIMIT 5
    )
    LOOP
        RAISE NOTICE 'Clínica: % | Funcionários: % (ativos: %)',
            v_stats.clinica_nome,
            v_stats.total_funcionarios,
            v_stats.funcionarios_ativos;
    END LOOP;
END $$;

RAISE NOTICE 'Migration 601: Migração de dados concluída com sucesso';
