-- Migration: Limpar Gestores da Tabela Funcionarios
-- Data: 01/02/2026
-- Objetivo: Garantir que gestores (RH e Entidade) existam APENAS em entidades_senhas

BEGIN;

-- ============================================
-- CONTEXTO
-- ============================================

-- DECISÃO ARQUITETURAL:
-- Gestores NÃO são funcionários operacionais
-- Gestores são entidades separadas geridas via entidades_senhas
-- Esta migration remove qualquer resíduo de gestores em funcionarios

-- ============================================
-- 1. IDENTIFICAR GESTORES EM FUNCIONARIOS
-- ============================================

-- Criar tabela temporária com gestores incorretamente em funcionarios
CREATE TEMP TABLE temp_gestores_incorretos AS
SELECT 
    f.cpf,
    f.nome,
    f.email,
    f.perfil,
    f.usuario_tipo,
    f.ativo,
    f.contratante_id,
    f.clinica_id,
    f.empresa_id,
    cs.contratante_id as cs_contratante_id,
    c.nome as contratante_nome,
    c.tipo as contratante_tipo
FROM funcionarios f
LEFT JOIN entidades_senhas cs ON f.cpf = cs.cpf
LEFT JOIN contratantes c ON cs.contratante_id = c.id
WHERE f.perfil IN ('rh', 'gestor')
   OR f.usuario_tipo IN ('rh', 'gestor');

-- Log dos casos encontrados
DO $$
DECLARE
    v_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_gestores_incorretos;
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ENCONTRADOS % gestores em funcionarios', v_count;
    RAISE NOTICE '============================================';
    
    IF v_count > 0 THEN
        FOR rec IN SELECT * FROM temp_gestores_incorretos LOOP
            RAISE NOTICE 'CPF: % | Nome: % | Perfil: % | Usuario_Tipo: % | Contratante: %',
                rec.cpf, rec.nome, rec.perfil, rec.usuario_tipo, rec.contratante_nome;
        END LOOP;
    ELSE
        RAISE NOTICE 'Nenhum gestor encontrado em funcionarios (CORRETO)';
    END IF;
    RAISE NOTICE '';
END $$;

-- ============================================
-- 2. BACKUP DOS GESTORES
-- ============================================

-- Criar/atualizar tabela de backup
CREATE TABLE IF NOT EXISTS funcionarios_backup_gestores_cleanup (
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cpf CHAR(11),
    nome TEXT,
    email TEXT,
    perfil TEXT,
    usuario_tipo TEXT,
    ativo BOOLEAN,
    contratante_id INTEGER,
    clinica_id INTEGER,
    empresa_id INTEGER,
    motivo TEXT
);

INSERT INTO funcionarios_backup_gestores_cleanup 
    (cpf, nome, email, perfil, usuario_tipo, ativo, contratante_id, clinica_id, empresa_id, motivo)
SELECT 
    cpf, nome, email, perfil, usuario_tipo, ativo, contratante_id, clinica_id, empresa_id,
    'Migration 300: Limpeza arquitetural - gestores devem estar apenas em entidades_senhas'
FROM temp_gestores_incorretos;

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM funcionarios_backup_gestores_cleanup WHERE backup_date >= CURRENT_TIMESTAMP - INTERVAL '1 minute';
    RAISE NOTICE 'Backup criado: % registros em funcionarios_backup_gestores_cleanup', v_count;
END $$;

-- ============================================
-- 3. TRATAR REFERÊNCIAS EM OUTRAS TABELAS
-- ============================================

-- 3.1. Lotes liberados por gestores
-- Ação: Manter liberado_por (CPF ainda existe em entidades_senhas)
-- Não precisa alterar nada - CPF é válido para auditoria

-- 3.2. Verificar se gestores têm avaliações (NÃO deveriam)
DO $$
DECLARE
    v_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count 
    FROM avaliacoes a
    WHERE a.funcionario_cpf IN (SELECT cpf FROM temp_gestores_incorretos);
    
    IF v_count > 0 THEN
        RAISE WARNING 'ATENÇÃO: % avaliações encontradas para gestores (INCORRETO)', v_count;
        RAISE WARNING 'Gestores não devem responder avaliações - avaliações serão removidas';
        
        -- Remover avaliações de gestores (dados inválidos)
        DELETE FROM avaliacoes 
        WHERE funcionario_cpf IN (SELECT cpf FROM temp_gestores_incorretos);
        
        RAISE NOTICE 'Avaliações inválidas removidas';
    ELSE
        RAISE NOTICE 'Nenhuma avaliação respondida por gestores (CORRETO)';
    END IF;
END $$;

-- 3.3. Verificar vínculos em contratantes_funcionarios
DELETE FROM contratantes_funcionarios cf
WHERE cf.funcionario_id IN (
    SELECT f.id 
    FROM funcionarios f
    WHERE f.cpf IN (SELECT cpf FROM temp_gestores_incorretos)
);

RAISE NOTICE 'Vínculos removidos de contratantes_funcionarios';

-- ============================================
-- 4. VALIDAR EXISTÊNCIA EM entidades_senhas
-- ============================================

-- Verificar que todos os gestores existem em entidades_senhas
DO $$
DECLARE
    v_sem_senha INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO v_sem_senha
    FROM temp_gestores_incorretos t
    WHERE t.cs_contratante_id IS NULL;
    
    IF v_sem_senha > 0 THEN
        RAISE WARNING '';
        RAISE WARNING '============================================';
        RAISE WARNING 'ATENÇÃO: % gestores sem registro em entidades_senhas', v_sem_senha;
        RAISE WARNING '============================================';
        
        FOR rec IN 
            SELECT * FROM temp_gestores_incorretos 
            WHERE cs_contratante_id IS NULL
        LOOP
            RAISE WARNING 'Gestor sem senha: CPF=% | Nome=% | Perfil=%', 
                rec.cpf, rec.nome, rec.perfil;
        END LOOP;
        
        RAISE WARNING '';
        RAISE WARNING 'AÇÃO NECESSÁRIA: Criar registros em entidades_senhas para estes gestores';
        RAISE WARNING 'OU confirmar que são registros antigos/inválidos que podem ser removidos';
        RAISE WARNING '';
    ELSE
        RAISE NOTICE 'Todos os gestores têm registro em entidades_senhas (CORRETO)';
    END IF;
END $$;

-- ============================================
-- 5. REMOVER GESTORES DE FUNCIONARIOS
-- ============================================

-- Remover registros onde perfil indica gestor
DELETE FROM funcionarios 
WHERE perfil IN ('rh', 'gestor')
   OR usuario_tipo IN ('rh', 'gestor');

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '% gestores removidos de funcionarios', v_count;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
END $$;

-- ============================================
-- 6. VALIDAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    v_func_gestores INTEGER;
    v_cs_gestores INTEGER;
    v_func_total INTEGER;
BEGIN
    -- Contar gestores remanescentes em funcionarios (deve ser 0)
    SELECT COUNT(*) INTO v_func_gestores 
    FROM funcionarios 
    WHERE perfil IN ('rh', 'gestor')
       OR usuario_tipo IN ('rh', 'gestor');
    
    -- Contar gestores em entidades_senhas (deve ser > 0)
    SELECT COUNT(*) INTO v_cs_gestores
    FROM entidades_senhas cs
    JOIN contratantes c ON c.id = cs.contratante_id
    WHERE c.ativa = true;
    
    -- Total de funcionários restantes
    SELECT COUNT(*) INTO v_func_total FROM funcionarios;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VALIDAÇÃO FINAL';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Gestores em funcionarios: % (esperado: 0)', v_func_gestores;
    RAISE NOTICE 'Gestores em entidades_senhas: % (esperado: > 0)', v_cs_gestores;
    RAISE NOTICE 'Funcionários operacionais restantes: %', v_func_total;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    IF v_func_gestores > 0 THEN
        RAISE EXCEPTION 'FALHA: Ainda existem gestores em funcionarios';
    END IF;
    
    IF v_cs_gestores = 0 THEN
        RAISE WARNING 'ATENÇÃO: Nenhum gestor encontrado em entidades_senhas';
    END IF;
    
    RAISE NOTICE '✓ Limpeza concluída com sucesso';
    RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================
-- INSTRUÇÕES PÓS-MIGRAÇÃO
-- ============================================

-- 1. Verificar backup:
--    SELECT * FROM funcionarios_backup_gestores_cleanup 
--    ORDER BY backup_date DESC;

-- 2. Confirmar que não há gestores em funcionarios:
--    SELECT * FROM funcionarios 
--    WHERE perfil IN ('rh', 'gestor')
--       OR usuario_tipo IN ('rh', 'gestor');
--    -- Esperado: 0 rows

-- 3. Confirmar que gestores existem em entidades_senhas:
--    SELECT cs.cpf, c.nome, c.tipo, c.ativa
--    FROM entidades_senhas cs
--    JOIN contratantes c ON c.id = cs.contratante_id
--    ORDER BY c.tipo, c.nome;

-- 4. Testar login de gestores:
--    - Gestor RH deve autenticar via entidades_senhas
--    - Gestor Entidade deve autenticar via entidades_senhas
--    - Funcionário comum deve autenticar via funcionarios

-- 5. Se houver problemas:
--    - Restaurar de backup: funcionarios_backup_gestores_cleanup
--    - Reverter migration: BEGIN; DELETE FROM <tabela> WHERE ...; ROLLBACK;
