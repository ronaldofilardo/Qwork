-- Migration 201: Correção sistêmica - Gestor Entidade NUNCA deve estar em funcionarios
-- Data: 22/01/2026
-- Problema: Alguns gestores_entidade foram incorretamente cadastrados na tabela funcionarios
-- Solução: Remover registros de gestor de funcionarios (devem existir APENAS em entidades_senhas)

BEGIN;

-- PARTE 1: IDENTIFICAR TODOS OS CASOS PROBLEMÁTICOS
-- Criar tabela temporária com todos os CPFs de gestor que estão incorretamente em funcionarios
CREATE TEMP TABLE temp_gestores_incorretos AS
SELECT 
    f.cpf,
    f.nome,
    f.email,
    f.perfil,
    f.ativo,
    f.contratante_id,
    cs.contratante_id as cs_contratante_id,
    c.nome as contratante_nome,
    c.tipo as contratante_tipo
FROM funcionarios f
LEFT JOIN entidades_senhas cs ON f.cpf = cs.cpf
LEFT JOIN contratantes c ON cs.contratante_id = c.id
WHERE f.perfil = 'gestor';

-- Log dos casos encontrados
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_gestores_incorretos;
    RAISE NOTICE 'ENCONTRADOS % registros de gestor em funcionarios (incorreto)', v_count;
END $$;

-- PARTE 2: BACKUP DOS REGISTROS PROBLEMÁTICOS
CREATE TABLE IF NOT EXISTS funcionarios_backup_gestor AS TABLE funcionarios WITH NO DATA;

INSERT INTO funcionarios_backup_gestor
SELECT f.* FROM funcionarios f
WHERE f.perfil = 'gestor';

DO $$
BEGIN
  RAISE NOTICE 'Backup criado em funcionarios_backup_gestor';
END $$;

-- PARTE 3: TRATAR REFERÊNCIAS EM OUTRAS TABELAS

-- 3.1. Lotes de avaliação liberados por gestor
-- Verificar lotes onde liberado_por aponta para gestor em funcionarios
CREATE TEMP TABLE temp_lotes_gestor AS
SELECT 
    la.id as lote_idas lote_codigo,
    la.liberado_por,
    la.status,
    la.contratante_id,
    f.nome as gestor_nome
FROM lotes_avaliacao la
JOIN funcionarios f ON la.liberado_por = f.cpf
WHERE f.perfil = 'gestor';

-- Log dos lotes afetados
DO $$
DECLARE
    v_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_lotes_gestor;
    RAISE NOTICE 'ENCONTRADOS % lotes liberados por gestor', v_count;
    
    FOR rec IN SELECT * FROM temp_lotes_gestor LOOP
        RAISE NOTICE 'Lote: % (ID: %) - Liberado por: % (%)', 
            rec.lote_codigo, rec.lote_id, rec.liberado_por, rec.gestor_nome;
    END LOOP;
END $$;

-- 3.2. Decisão sobre lotes:
-- Opção A: Manter lotes mas ajustar referência (liberado_por = NULL ou manter CPF pois está em entidades_senhas)
-- Opção B: Deletar lotes problemáticos (se forem testes ou inválidos)

-- Para o caso específico do lote 001-210126 (CPF 87545772920):
-- Vamos INATIVAR o lote ao invés de deletar (preserva histórico)
UPDATE lotes_avaliacao
SET 
    status = 'cancelado',
    atualizado_em = NOW()
WHERE codigo = '001-210126' 
  AND liberado_por = '87545772920';

DO $$
BEGIN
  RAISE NOTICE 'Lote 001-210126 marcado como cancelado';
END $$;

-- Para outros lotes liberados por gestor:
-- Manter liberado_por (pois CPF existe em entidades_senhas, autenticação válida)
-- Apenas remover da tabela funcionarios

-- PARTE 4: REMOVER VÍNCULOS EM contratantes_funcionarios (se existirem)
-- A tabela contratantes_funcionarios referencia funcionarios.id via funcionario_id
DELETE FROM contratantes_funcionarios cf
USING funcionarios f
WHERE cf.funcionario_id = f.id
  AND f.cpf IN (SELECT cpf FROM temp_gestores_incorretos);

DO $$
BEGIN
  RAISE NOTICE 'Vínculos removidos de contratantes_funcionarios (por funcionario_id)';
END $$;

-- PARTE 5: REMOVER AVALIAÇÕES onde funcionario_cpf = gestor
-- (Gestores NUNCA respondem avaliações)
CREATE TEMP TABLE temp_avaliacoes_gestor AS
SELECT a.id, a.funcionario_cpf, f.nome
FROM avaliacoes a
JOIN funcionarios f ON a.funcionario_cpf = f.cpf
WHERE f.perfil = 'gestor';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM temp_avaliacoes_gestor;
    IF v_count > 0 THEN
        RAISE NOTICE 'ATENÇÃO: Encontradas % avaliações respondidas por gestor (INCORRETO)', v_count;
        -- Deletar avaliações inválidas
        DELETE FROM avaliacoes WHERE id IN (SELECT id FROM temp_avaliacoes_gestor);
        RAISE NOTICE 'Avaliações inválidas deletadas';
    ELSE
        RAISE NOTICE 'Nenhuma avaliação respondida por gestor (correto)';
    END IF;
END $$;

-- PARTE 6: REMOVER REGISTROS DE funcionarios onde perfil='gestor'
-- Antes de remover, limpar referências em lotes_avaliacao que apontam para esse CPF (liberado_por)
DO $$
DECLARE
    v_count INTEGER;
    v_replacement_cpf TEXT;
BEGIN
    -- Tentar reutilizar um emissor existente
    SELECT cpf INTO v_replacement_cpf FROM funcionarios WHERE perfil = 'emissor' AND ativo = true LIMIT 1;

    -- Se não existir emissor, criar um emissor de sistema
    IF v_replacement_cpf IS NULL THEN
        v_replacement_cpf := '00000000001';
        IF NOT EXISTS (SELECT 1 FROM funcionarios WHERE cpf = v_replacement_cpf) THEN
            INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, criado_em, atualizado_em)
            VALUES (v_replacement_cpf, 'Emissor System', 'emissor.system@local', 'system', 'emissor', true, now(), now());
            RAISE NOTICE 'Criado emissor de sistema: %', v_replacement_cpf;
        ELSE
            RAISE NOTICE 'Emissor sistema já existe: %', v_replacement_cpf;
        END IF;
    ELSE
        RAISE NOTICE 'Reutilizando emissor existente: %', v_replacement_cpf;
    END IF;

    -- Atualizar lotes para apontarem para o emissor de substituição
    UPDATE lotes_avaliacao
    SET liberado_por = v_replacement_cpf, atualizado_em = NOW()
    WHERE liberado_por IN (SELECT cpf FROM temp_gestores_incorretos);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Atualizadas % lotes para usar emissor % como liberado_por', v_count, v_replacement_cpf;
END $$;

-- Agora é seguro remover os registros de funcionarios
DELETE FROM funcionarios WHERE perfil = 'gestor';

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '% registros de gestor removidos de funcionarios', v_count;
END $$;

-- PARTE 7: VALIDAÇÃO FINAL
DO $$
DECLARE
    v_func_count INTEGER;
    v_senha_count INTEGER;
BEGIN
    -- Verificar que não há mais gestor em funcionarios
    SELECT COUNT(*) INTO v_func_count FROM funcionarios WHERE perfil = 'gestor';
    
    -- Verificar que gestores_entidade ainda existem em entidades_senhas
    SELECT COUNT(*) INTO v_senha_count 
    FROM entidades_senhas cs
    JOIN contratantes c ON c.id = cs.contratante_id
    WHERE c.tipo = 'entidade' AND c.ativa = true;
    
    RAISE NOTICE 'VALIDAÇÃO FINAL:';
    RAISE NOTICE '  - Gestores em funcionarios: % (deve ser 0)', v_func_count;
    RAISE NOTICE '  - Gestores em entidades_senhas: % (deve ser > 0)', v_senha_count;
    
    IF v_func_count > 0 THEN
        RAISE EXCEPTION 'FALHA: Ainda existem gestor em funcionarios';
    END IF;
    
    IF v_senha_count = 0 THEN
        RAISE WARNING 'ATENÇÃO: Nenhum gestor encontrado em entidades_senhas';
    END IF;
END $$;

COMMIT;

-- INSTRUÇÕES PÓS-MIGRAÇÃO:
-- 1. Verificar backup: SELECT * FROM funcionarios_backup_gestor;
-- 2. Verificar que gestor não está mais em funcionarios:
--    SELECT * FROM funcionarios WHERE perfil = 'gestor';
-- 3. Verificar que autenticação ainda funciona (via entidades_senhas):
--    SELECT cs.cpf, c.nome FROM entidades_senhas cs 
--    JOIN contratantes c ON c.id = cs.contratante_id 
--    WHERE c.tipo = 'entidade';
