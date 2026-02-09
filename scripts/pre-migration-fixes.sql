-- Script de Correção Pré-Migration
-- Corrige dados problemáticos identificados pela validação
-- Data: 2026-01-29
-- ATENÇÃO: Este script modifica dados! Execute apenas após backup!

\echo '========================================='
\echo '    CORREÇÕES PRÉ-MIGRAÇÃO 200 e 201'
\echo '========================================='
\echo ''
\echo 'ATENÇÃO: Este script irá modificar dados!'
\echo 'Certifique-se de ter backup antes de continuar.'
\echo ''

-- Pausar para confirmação (em ambiente interativo)
\prompt 'Digite CONTINUAR para prosseguir: ' confirmacao

BEGIN;

\echo ''
\echo 'Iniciando transação...'
\echo ''

-- ==========================================
-- 1. RESOLVER AMBIGUIDADE DE FUNCIONÁRIOS
-- ==========================================

\echo '1. Resolvendo ambiguidade de funcionários...'
\echo '   Estratégia: Priorizar contratante_id (funcionário de entidade)'
\echo ''

-- Funcionários com contratante_id + empresa/clinica
-- → Remover empresa_id e clinica_id para tornar funcionario_entidade
UPDATE funcionarios 
SET 
  empresa_id = NULL, 
  clinica_id = NULL,
  atualizado_em = CURRENT_TIMESTAMP
WHERE perfil = 'funcionario' 
  AND contratante_id IS NOT NULL 
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

\echo '   ✓ Funcionários ambíguos corrigidos'
\echo ''

-- ==========================================
-- 2. ATRIBUIR CLÍNICA PADRÃO A ÓRFÃOS
-- ==========================================

\echo '2. Atribuindo clínica padrão a funcionários órfãos...'
\echo ''

DO $$
DECLARE
  clinica_padrao_id INT;
  total_orfaos INT;
BEGIN
  -- Buscar primeira clínica ativa
  SELECT id INTO clinica_padrao_id 
  FROM clinicas 
  WHERE ativa = true
  ORDER BY id 
  LIMIT 1;
  
  IF clinica_padrao_id IS NULL THEN
    -- Se não houver clínica ativa, buscar qualquer clínica
    SELECT id INTO clinica_padrao_id 
    FROM clinicas 
    ORDER BY id 
    LIMIT 1;
  END IF;
  
  IF clinica_padrao_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma clínica encontrada para atribuir aos funcionários órfãos!';
  END IF;
  
  -- Contar órfãos
  SELECT COUNT(*) INTO total_orfaos
  FROM funcionarios
  WHERE perfil = 'funcionario'
    AND contratante_id IS NULL 
    AND empresa_id IS NULL 
    AND clinica_id IS NULL;
  
  -- Atribuir clínica padrão
  UPDATE funcionarios
  SET 
    clinica_id = clinica_padrao_id,
    atualizado_em = CURRENT_TIMESTAMP
  WHERE perfil = 'funcionario'
    AND contratante_id IS NULL 
    AND empresa_id IS NULL 
    AND clinica_id IS NULL;
  
  RAISE NOTICE '   ✓ % funcionários órfãos atribuídos à clínica %', total_orfaos, clinica_padrao_id;
END $$;

\echo ''

-- ==========================================
-- 3. CONSOLIDAR GESTORES DE ENTIDADE
-- ==========================================

\echo '3. Consolidando gestores de entidade...'
\echo ''

DO $$
DECLARE
  total_duplicados INT;
BEGIN
  -- Contar duplicados
  SELECT COUNT(*) INTO total_duplicados
  FROM funcionarios f
  INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
  WHERE f.perfil = 'gestor';
  
  IF total_duplicados > 0 THEN
    -- Copiar senhas de entidades_senhas para funcionarios (se necessário)
    UPDATE funcionarios f
    SET 
      senha_hash = cs.senha_hash,
      atualizado_em = CURRENT_TIMESTAMP
    FROM entidades_senhas cs
    WHERE f.cpf = cs.cpf
      AND f.perfil = 'gestor'
      AND (f.senha_hash IS NULL OR f.senha_hash = '');
    
    -- Remover de entidades_senhas (dados agora estão em funcionarios)
    DELETE FROM entidades_senhas cs
    WHERE EXISTS (
      SELECT 1 FROM funcionarios f 
      WHERE f.cpf = cs.cpf 
      AND f.perfil = 'gestor'
    );
    
    RAISE NOTICE '   ✓ % gestores de entidade consolidados', total_duplicados;
  ELSE
    RAISE NOTICE '   ✓ Nenhum gestor duplicado encontrado';
  END IF;
END $$;

\echo ''

-- ==========================================
-- 4. CORRIGIR RH SEM CLINICA_ID
-- ==========================================

\echo '4. Corrigindo gestores RH sem clinica_id...'
\echo ''

DO $$
DECLARE
  clinica_padrao_id INT;
  total_rh_sem_clinica INT;
BEGIN
  -- Contar RH sem clínica
  SELECT COUNT(*) INTO total_rh_sem_clinica
  FROM funcionarios
  WHERE perfil = 'rh'
    AND clinica_id IS NULL;
  
  IF total_rh_sem_clinica > 0 THEN
    -- Buscar clínica padrão
    SELECT id INTO clinica_padrao_id 
    FROM clinicas 
    WHERE ativa = true
    ORDER BY id 
    LIMIT 1;
    
    IF clinica_padrao_id IS NULL THEN
      SELECT id INTO clinica_padrao_id FROM clinicas ORDER BY id LIMIT 1;
    END IF;
    
    IF clinica_padrao_id IS NULL THEN
      RAISE EXCEPTION 'Nenhuma clínica encontrada para atribuir aos gestores RH!';
    END IF;
    
    -- Atribuir clínica
    UPDATE funcionarios
    SET 
      clinica_id = clinica_padrao_id,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE perfil = 'rh'
      AND clinica_id IS NULL;
    
    RAISE NOTICE '   ✓ % gestores RH atribuídos à clínica %', total_rh_sem_clinica, clinica_padrao_id;
  ELSE
    RAISE NOTICE '   ✓ Todos os gestores RH têm clínica associada';
  END IF;
END $$;

\echo ''

-- ==========================================
-- 5. LIMPAR VÍNCULOS DE ADMIN/EMISSOR
-- ==========================================

\echo '5. Limpando vínculos de Admin/Emissor...'
\echo ''

UPDATE funcionarios
SET 
  clinica_id = NULL, 
  contratante_id = NULL, 
  empresa_id = NULL,
  atualizado_em = CURRENT_TIMESTAMP
WHERE perfil IN ('admin', 'emissor')
  AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL);

\echo '   ✓ Vínculos de Admin/Emissor removidos'
\echo ''

-- ==========================================
-- 6. LIMPAR TABELA tomadores_funcionarios (SE EXISTIR)
-- ==========================================

\echo '6. Verificando tabela tomadores_funcionarios...'
\echo ''

DO $$
DECLARE
  total_vinculos INT;
  tabela_existe BOOLEAN;
BEGIN
  -- Verificar se tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tomadores_funcionarios'
  ) INTO tabela_existe;
  
  IF tabela_existe THEN
    SELECT COUNT(*) INTO total_vinculos FROM tomadores_funcionarios;
    
    IF total_vinculos > 0 THEN
      TRUNCATE TABLE tomadores_funcionarios CASCADE;
      RAISE NOTICE '   ✓ % vínculos antigos removidos (serão recriados pela migration 201)', total_vinculos;
    ELSE
      RAISE NOTICE '   ✓ Tabela já estava vazia';
    END IF;
  ELSE
    RAISE NOTICE '   ✓ Tabela não existe (será criada pela migration 201)';
  END IF;
END $$;

\echo ''

-- ==========================================
-- 7. VALIDAÇÃO FINAL
-- ==========================================

\echo '7. Validando correções...'
\echo ''

DO $$
DECLARE
  total_problemas INT := 0;
  problemas_encontrados TEXT := '';
BEGIN
  -- Verificar ambíguos
  SELECT COUNT(*) INTO total_problemas
  FROM funcionarios
  WHERE perfil = 'funcionario'
    AND contratante_id IS NOT NULL 
    AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);
  
  IF total_problemas > 0 THEN
    problemas_encontrados := problemas_encontrados || format('   ✗ Ainda há %s funcionários ambíguos\n', total_problemas);
  END IF;
  
  -- Verificar órfãos
  SELECT COUNT(*) INTO total_problemas
  FROM funcionarios
  WHERE perfil = 'funcionario'
    AND contratante_id IS NULL 
    AND empresa_id IS NULL 
    AND clinica_id IS NULL;
  
  IF total_problemas > 0 THEN
    problemas_encontrados := problemas_encontrados || format('   ✗ Ainda há %s funcionários órfãos\n', total_problemas);
  END IF;
  
  -- Verificar RH sem clínica
  SELECT COUNT(*) INTO total_problemas
  FROM funcionarios
  WHERE perfil = 'rh'
    AND clinica_id IS NULL;
  
  IF total_problemas > 0 THEN
    problemas_encontrados := problemas_encontrados || format('   ✗ Ainda há %s RH sem clínica\n', total_problemas);
  END IF;
  
  IF problemas_encontrados <> '' THEN
    RAISE EXCEPTION 'Correções falharam:\n%', problemas_encontrados;
  ELSE
    RAISE NOTICE '   ✓ Todas as correções foram aplicadas com sucesso!';
  END IF;
END $$;

\echo ''

-- ==========================================
-- COMMIT
-- ==========================================

COMMIT;

\echo ''
\echo '========================================='
\echo '        CORREÇÕES CONCLUÍDAS!'
\echo '========================================='
\echo ''
\echo 'Próximos passos:'
\echo '  1. Executar novamente: psql -f scripts/pre-migration-validation.sql'
\echo '  2. Verificar que tudo está ✅ OK'
\echo '  3. Aplicar migrations: .\scripts\apply-fase-1-2-migrations.ps1'
\echo ''
\echo '========================================='
