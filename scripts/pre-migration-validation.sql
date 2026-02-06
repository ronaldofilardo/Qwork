-- Script de Validação Pré-Migration
-- Executa verificações para identificar dados problemáticos
-- Data: 2026-01-29

\echo '========================================='
\echo '    VALIDAÇÃO PRÉ-MIGRAÇÃO 200 e 201'
\echo '========================================='
\echo ''

-- ==========================================
-- 1. FUNCIONÁRIOS COM VÍNCULOS AMBÍGUOS
-- ==========================================

\echo '1. Funcionários com vínculos ambíguos (contratante_id + empresa/clinica)...'
\echo ''

SELECT 
  cpf, 
  nome, 
  perfil,
  contratante_id, 
  empresa_id, 
  clinica_id,
  'AMBIGUO: tem contratante_id E (empresa/clinica)' as problema
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL 
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

\echo ''
\echo 'Total de funcionários ambíguos:'
SELECT COUNT(*) as total_ambiguos
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL 
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL);

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 2. FUNCIONÁRIOS SEM VÍNCULO
-- ==========================================

\echo '2. Funcionários sem nenhum vínculo (órfãos)...'
\echo ''

SELECT 
  cpf, 
  nome, 
  perfil,
  'SEM VINCULO: precisa de empresa_id+clinica_id OU contratante_id' as problema
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL 
  AND empresa_id IS NULL 
  AND clinica_id IS NULL;

\echo ''
\echo 'Total de funcionários órfãos:'
SELECT COUNT(*) as total_orfaos
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL 
  AND empresa_id IS NULL 
  AND clinica_id IS NULL;

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 3. GESTORES DE ENTIDADE DUPLICADOS
-- ==========================================

\echo '3. Gestores de entidade duplicados (funcionarios + entidades_senhas)...'
\echo ''

SELECT 
  f.cpf,
  f.nome,
  f.perfil,
  f.contratante_id as func_contratante_id,
  cs.contratante_id as senha_contratante_id,
  CASE 
    WHEN f.contratante_id = cs.contratante_id THEN 'MESMO CONTRATANTE'
    ELSE 'CONTRATANTES DIFERENTES - PROBLEMA!'
  END as status
FROM funcionarios f
INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor';

\echo ''
\echo 'Total de gestores duplicados:'
SELECT COUNT(*) as total_duplicados
FROM funcionarios f
INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor';

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 4. GESTORES RH SEM CLINICA_ID
-- ==========================================

\echo '4. Gestores RH sem clinica_id...'
\echo ''

SELECT 
  cpf, 
  nome, 
  perfil,
  clinica_id,
  'RH SEM CLINICA_ID - PROBLEMA!' as problema
FROM funcionarios
WHERE perfil = 'rh'
  AND clinica_id IS NULL;

\echo ''
\echo 'Total de RH sem clínica:'
SELECT COUNT(*) as total_rh_sem_clinica
FROM funcionarios
WHERE perfil = 'rh'
  AND clinica_id IS NULL;

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 5. ADMIN/EMISSOR COM VÍNCULOS
-- ==========================================

\echo '5. Admin/Emissor com vínculos (devem ser NULL)...'
\echo ''

SELECT 
  cpf, 
  nome, 
  perfil,
  clinica_id,
  contratante_id,
  empresa_id,
  'ADMIN/EMISSOR COM VINCULOS - PROBLEMA!' as problema
FROM funcionarios
WHERE perfil IN ('admin', 'emissor')
  AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL);

\echo ''
\echo 'Total de admin/emissor com vínculos:'
SELECT COUNT(*) as total_admin_com_vinculos
FROM funcionarios
WHERE perfil IN ('admin', 'emissor')
  AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL);

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 6. ESTADO DA TABELA contratantes_funcionarios (SE EXISTIR)
-- ==========================================

\echo '6. Estado da tabela contratantes_funcionarios...'
\echo ''

DO $$
DECLARE
  tabela_existe BOOLEAN;
  total_vinculos INT;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contratantes_funcionarios'
  ) INTO tabela_existe;
  
  IF tabela_existe THEN
    SELECT COUNT(*) INTO total_vinculos FROM contratantes_funcionarios;
    RAISE NOTICE 'Total de vínculos existentes: %', total_vinculos;
    
    IF total_vinculos > 0 THEN
      RAISE NOTICE 'Verificando duplicatas...';
      PERFORM funcionario_id, contratante_id, COUNT(*)
      FROM contratantes_funcionarios
      GROUP BY funcionario_id, contratante_id
      HAVING COUNT(*) > 1;
    END IF;
  ELSE
    RAISE NOTICE 'Tabela não existe (será criada pela migration 201)';
  END IF;
END $$;

\echo ''
\echo '==========================================\n'

-- ==========================================
-- 7. RESUMO GERAL
-- ==========================================

\echo '========================================='
\echo '           RESUMO DA VALIDAÇÃO'
\echo '========================================='
\echo ''

SELECT 
  'Funcionários ambíguos' as categoria,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NOT NULL 
  AND (empresa_id IS NOT NULL OR clinica_id IS NOT NULL)

UNION ALL

SELECT 
  'Funcionários órfãos' as categoria,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '🟡 MÉDIO' ELSE '✅ OK' END as status
FROM funcionarios
WHERE perfil = 'funcionario'
  AND contratante_id IS NULL 
  AND empresa_id IS NULL 
  AND clinica_id IS NULL

UNION ALL

SELECT 
  'Gestores duplicados' as categoria,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM funcionarios f
INNER JOIN entidades_senhas cs ON cs.cpf = f.cpf
WHERE f.perfil = 'gestor'

UNION ALL

SELECT 
  'RH sem clínica' as categoria,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '🟡 MÉDIO' ELSE '✅ OK' END as status
FROM funcionarios
WHERE perfil = 'rh'
  AND clinica_id IS NULL

UNION ALL

SELECT 
  'Admin/Emissor com vínculos' as categoria,
  COUNT(*) as total,
  CASE WHEN COUNT(*) > 0 THEN '🟡 MÉDIO' ELSE '✅ OK' END as status
FROM funcionarios
WHERE perfil IN ('admin', 'emissor')
  AND (clinica_id IS NOT NULL OR contratante_id IS NOT NULL OR empresa_id IS NOT NULL)

ORDER BY 
  CASE status 
    WHEN '🔴 CRÍTICO' THEN 1 
    WHEN '🟡 MÉDIO' THEN 2 
    ELSE 3 
  END;

\echo ''
\echo '========================================='
\echo ''
\echo 'PRÓXIMOS PASSOS:'
\echo '  - Se houver itens 🔴 CRÍTICO ou 🟡 MÉDIO, executar pre-migration-fixes.sql'
\echo '  - Após correção, executar novamente este script para validar'
\echo '  - Quando tudo estiver ✅ OK, aplicar migrations 200 e 201'
\echo ''
\echo '========================================='
