-- ====================================================================
-- MIGRAÇÃO: Mover lotes de ENTIDADE para CLÍNICA/RH > EMPRESA
-- ====================================================================
-- Data: 30 de janeiro de 2026
-- Descrição: Atualizar lotes que atualmente pertencem a entidades
--            para associá-los à clínica 21 (RLJ COMERCIAL EXPORTADORA)
--            e empresa 1 (CNPJ 53650950000128)
-- ====================================================================

\echo '=== INICIANDO MIGRAÇÃO DE LOTES ==='

-- 1. VERIFICAR ESTRUTURA ATUAL
\echo 'Verificando estrutura atual dos lotes...'

SELECT 
  'ANTES DA MIGRAÇÃO' as momento,
  COUNT(*) as total_lotes,
  COUNT(CASE WHEN contratante_id IS NOT NULL THEN 1 END) as lotes_entidade,
  COUNT(CASE WHEN clinica_id IS NOT NULL AND contratante_id IS NULL THEN 1 END) as lotes_clinica
FROM lotes_avaliacao;

-- 2. LISTAR LOTES QUE SERÃO MIGRADOS
\echo 'Lotes que serão migrados para Clínica/RH:'

SELECT 
  id, 
  codigo, 
  titulo,
  contratante_id,
  clinica_id,
  empresa_id,
  status
FROM lotes_avaliacao
WHERE contratante_id IS NOT NULL
ORDER BY id;

-- 3. CRIAR BACKUP DOS LOTES ANTES DA MIGRAÇÃO
\echo 'Criando backup dos lotes...'

CREATE TABLE IF NOT EXISTS backup_lotes_pre_migracao AS
SELECT * FROM lotes_avaliacao WHERE contratante_id IS NOT NULL;

SELECT COUNT(*) as lotes_backup FROM backup_lotes_pre_migracao;

-- ====================================================================
-- 4. MIGRAÇÃO: ATUALIZAR LOTES PARA CLÍNICA/RH
-- ====================================================================
-- Clínica ID: 21 (RLJ COMERCIAL EXPORTADORA - CNPJ 09110380000191)
-- Empresa ID: 1 (fapoupou pupoupou - CNPJ 53650950000128)
-- ====================================================================

\echo 'Executando migração dos lotes...'

BEGIN;

-- Permitir que clinica_id e empresa_id sejam NULL temporariamente
-- (caso o schema ainda tenha NOT NULL constraint)
ALTER TABLE lotes_avaliacao 
  ALTER COLUMN clinica_id DROP NOT NULL,
  ALTER COLUMN empresa_id DROP NOT NULL;

-- Atualizar todos os lotes de entidade para clínica/RH
UPDATE lotes_avaliacao
SET 
  clinica_id = 21,  -- RLJ COMERCIAL EXPORTADORA
  empresa_id = 1,   -- fapoupou pupoupou (CNPJ 53650950000128)
  atualizado_em = CURRENT_TIMESTAMP
WHERE contratante_id IS NOT NULL;

-- Agora remover contratante_id dos lotes migrados
-- (mantém a constraint de que OU é clinica OU é contratante)
UPDATE lotes_avaliacao
SET contratante_id = NULL
WHERE clinica_id = 21 AND empresa_id = 1;

COMMIT;

-- 5. VERIFICAR RESULTADO DA MIGRAÇÃO
\echo 'Verificando resultado da migração...'

SELECT 
  'DEPOIS DA MIGRAÇÃO' as momento,
  COUNT(*) as total_lotes,
  COUNT(CASE WHEN contratante_id IS NOT NULL THEN 1 END) as lotes_entidade,
  COUNT(CASE WHEN clinica_id = 21 AND empresa_id = 1 THEN 1 END) as lotes_clinica_empresa
FROM lotes_avaliacao;

-- 6. LISTAR LOTES MIGRADOS
\echo 'Lotes após migração:'

SELECT 
  id, 
  codigo, 
  titulo,
  contratante_id,
  clinica_id,
  empresa_id,
  status
FROM lotes_avaliacao
WHERE clinica_id = 21 AND empresa_id = 1
ORDER BY id;

-- 7. VERIFICAR SE HÁ AVALIAÇÕES ASSOCIADAS
\echo 'Verificando avaliações associadas aos lotes migrados...'

SELECT 
  la.codigo as lote_codigo,
  COUNT(a.id) as total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON a.lote_id = la.id
WHERE la.clinica_id = 21 AND la.empresa_id = 1
GROUP BY la.codigo
ORDER BY la.codigo;

\echo '=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ==='
\echo 'NOTA: Para reverter, execute: SELECT * FROM backup_lotes_pre_migracao;'
