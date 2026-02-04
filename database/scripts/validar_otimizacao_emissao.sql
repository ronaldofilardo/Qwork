-- Script de Teste e Validação da Otimização de Emissão de Laudos
-- Execute este script para validar todas as otimizações implementadas

-- =========================================================================
-- PARTE 1: VALIDAÇÃO DE ESTRUTURA
-- =========================================================================

\echo '\n=========================================='
\echo '📋 VALIDAÇÃO DE ÍNDICES'
\echo '=========================================='

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'auditoria_laudos'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

\echo '\n=========================================='
\echo '🔒 VALIDAÇÃO DE CONSTRAINTS'
\echo '=========================================='

SELECT 
  conname AS constraint_name,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'auditoria_laudos'::regclass
  AND contype IN ('c', 'u')
ORDER BY conname;

-- =========================================================================
-- PARTE 2: TESTE DE DEDUPLICAÇÃO
-- =========================================================================

\echo '\n=========================================='
\echo '🧪 TESTE DE DEDUPLICAÇÃO'
\echo '=========================================='

-- Limpar dados de teste anteriores
DELETE FROM auditoria_laudos 
WHERE lote_id = 999 
  AND acao = 'solicitar_emissao';

-- Teste 1: Primeira solicitação (deve inserir)
\echo '\n📝 Teste 1: Primeira solicitação (INSERT esperado)'

WITH existing AS (
  SELECT id, tentativas
  FROM auditoria_laudos
  WHERE lote_id = 999
    AND acao = 'solicitar_emissao'
    AND solicitado_por = '00000000000'
    AND status IN ('pendente', 'reprocessando')
  FOR UPDATE SKIP LOCKED
  LIMIT 1
),
updated AS (
  UPDATE auditoria_laudos
  SET tentativas = tentativas + 1,
      criado_em = NOW()
  WHERE id = (SELECT id FROM existing)
  RETURNING id, tentativas, TRUE as is_update
),
inserted AS (
  INSERT INTO auditoria_laudos (
    lote_id,
    acao,
    status,
    solicitado_por,
    tipo_solicitante,
    criado_em
  )
  SELECT 999, 'solicitar_emissao', 'pendente', '00000000000', 'rh', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id, tentativas, FALSE as is_update
)
SELECT 
  id,
  tentativas,
  is_update,
  CASE 
    WHEN is_update THEN '❌ ERRO: Não deveria atualizar'
    ELSE '✅ OK: Inseriu novo registro'
  END as resultado
FROM updated
UNION ALL
SELECT id, tentativas, is_update,
  CASE 
    WHEN is_update THEN '❌ ERRO: Não deveria atualizar'
    ELSE '✅ OK: Inseriu novo registro'
  END
FROM inserted;

-- Teste 2: Segunda solicitação (deve atualizar)
\echo '\n📝 Teste 2: Solicitação duplicada (UPDATE esperado)'

WITH existing AS (
  SELECT id, tentativas
  FROM auditoria_laudos
  WHERE lote_id = 999
    AND acao = 'solicitar_emissao'
    AND solicitado_por = '00000000000'
    AND status IN ('pendente', 'reprocessando')
  FOR UPDATE SKIP LOCKED
  LIMIT 1
),
updated AS (
  UPDATE auditoria_laudos
  SET tentativas = tentativas + 1,
      criado_em = NOW()
  WHERE id = (SELECT id FROM existing)
  RETURNING id, tentativas, TRUE as is_update
),
inserted AS (
  INSERT INTO auditoria_laudos (
    lote_id,
    acao,
    status,
    solicitado_por,
    tipo_solicitante,
    criado_em
  )
  SELECT 999, 'solicitar_emissao', 'pendente', '00000000000', 'rh', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id, tentativas, FALSE as is_update
)
SELECT 
  id,
  tentativas,
  is_update,
  CASE 
    WHEN is_update AND tentativas = 1 THEN '✅ OK: Atualizou com tentativa=1'
    WHEN is_update THEN '❓ AVISO: Atualizou mas tentativas=' || tentativas
    ELSE '❌ ERRO: Não deveria inserir'
  END as resultado
FROM updated
UNION ALL
SELECT id, tentativas, is_update,
  CASE 
    WHEN is_update THEN '✅ OK: Atualizou'
    ELSE '❌ ERRO: Não deveria inserir'
  END
FROM inserted;

-- Teste 3: Terceira solicitação (deve atualizar novamente)
\echo '\n📝 Teste 3: Segunda duplicação (UPDATE esperado, tentativas=2)'

WITH existing AS (
  SELECT id, tentativas
  FROM auditoria_laudos
  WHERE lote_id = 999
    AND acao = 'solicitar_emissao'
    AND solicitado_por = '00000000000'
    AND status IN ('pendente', 'reprocessando')
  FOR UPDATE SKIP LOCKED
  LIMIT 1
),
updated AS (
  UPDATE auditoria_laudos
  SET tentativas = tentativas + 1,
      criado_em = NOW()
  WHERE id = (SELECT id FROM existing)
  RETURNING id, tentativas, TRUE as is_update
),
inserted AS (
  INSERT INTO auditoria_laudos (
    lote_id,
    acao,
    status,
    solicitado_por,
    tipo_solicitante,
    criado_em
  )
  SELECT 999, 'solicitar_emissao', 'pendente', '00000000000', 'rh', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id, tentativas, FALSE as is_update
)
SELECT 
  id,
  tentativas,
  is_update,
  CASE 
    WHEN is_update AND tentativas = 2 THEN '✅ OK: Atualizou com tentativa=2'
    WHEN is_update THEN '❓ AVISO: Atualizou mas tentativas=' || tentativas
    ELSE '❌ ERRO: Não deveria inserir'
  END as resultado
FROM updated
UNION ALL
SELECT id, tentativas, is_update,
  CASE 
    WHEN is_update THEN '✅ OK'
    ELSE '❌ ERRO: Não deveria inserir'
  END
FROM inserted;

-- Teste 4: Solicitação de outro usuário (deve inserir novo)
\echo '\n📝 Teste 4: Solicitação de outro usuário (INSERT esperado)'

WITH existing AS (
  SELECT id, tentativas
  FROM auditoria_laudos
  WHERE lote_id = 999
    AND acao = 'solicitar_emissao'
    AND solicitado_por = '11111111111'
    AND status IN ('pendente', 'reprocessando')
  FOR UPDATE SKIP LOCKED
  LIMIT 1
),
updated AS (
  UPDATE auditoria_laudos
  SET tentativas = tentativas + 1,
      criado_em = NOW()
  WHERE id = (SELECT id FROM existing)
  RETURNING id, tentativas, TRUE as is_update
),
inserted AS (
  INSERT INTO auditoria_laudos (
    lote_id,
    acao,
    status,
    solicitado_por,
    tipo_solicitante,
    criado_em
  )
  SELECT 999, 'solicitar_emissao', 'pendente', '11111111111', 'gestor_entidade', NOW()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id, tentativas, FALSE as is_update
)
SELECT 
  id,
  tentativas,
  is_update,
  CASE 
    WHEN NOT is_update THEN '✅ OK: Inseriu novo registro para outro usuário'
    ELSE '❌ ERRO: Não deveria atualizar'
  END as resultado
FROM updated
UNION ALL
SELECT id, tentativas, is_update,
  CASE 
    WHEN NOT is_update THEN '✅ OK: Inseriu novo registro'
    ELSE '❌ ERRO: Não deveria atualizar'
  END
FROM inserted;

-- Verificação final
\echo '\n📊 Estado final da tabela de teste:'

SELECT 
  id,
  lote_id,
  acao,
  status,
  solicitado_por,
  tipo_solicitante,
  tentativas,
  criado_em
FROM auditoria_laudos
WHERE lote_id = 999
ORDER BY id;

-- Limpeza
DELETE FROM auditoria_laudos WHERE lote_id = 999;

-- =========================================================================
-- PARTE 3: TESTE DE CONSTRAINTS
-- =========================================================================

\echo '\n=========================================='
\echo '🔒 TESTE DE CONSTRAINTS'
\echo '=========================================='

-- Teste 3.1: Constraint de solicitante (deve falhar)
\echo '\n📝 Teste 3.1: Constraint de solicitante (DEVE FALHAR)'

INSERT INTO auditoria_laudos (
  lote_id,
  acao,
  status,
  solicitado_por,
  tipo_solicitante
)
VALUES (999, 'solicitar_emissao', 'pendente', NULL, 'rh');

-- Se não falhou, tem problema!
\echo '❌ ERRO: Constraint não está funcionando!'

-- Nota: O script acima deve falhar com:
-- ERROR: new row for relation "auditoria_laudos" violates check constraint "chk_solicitation_has_requester"

-- =========================================================================
-- PARTE 4: ANÁLISE DE PERFORMANCE
-- =========================================================================

\echo '\n=========================================='
\echo '⚡ ANÁLISE DE PERFORMANCE'
\echo '=========================================='

-- Análise de uso de índices
\echo '\n📊 Estatísticas de uso de índices:'

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as "Scans",
  idx_tup_read as "Tuplas Lidas",
  idx_tup_fetch as "Tuplas Buscadas",
  pg_size_pretty(pg_relation_size(indexrelid)) as "Tamanho"
FROM pg_stat_user_indexes
WHERE tablename = 'auditoria_laudos'
ORDER BY idx_scan DESC;

-- Tamanho total da tabela
\echo '\n💾 Tamanho da tabela:'

SELECT 
  pg_size_pretty(pg_total_relation_size('auditoria_laudos')) as "Tamanho Total",
  pg_size_pretty(pg_relation_size('auditoria_laudos')) as "Tamanho Dados",
  pg_size_pretty(pg_total_relation_size('auditoria_laudos') - pg_relation_size('auditoria_laudos')) as "Tamanho Índices";

-- =========================================================================
-- RESULTADO ESPERADO
-- =========================================================================

\echo '\n=========================================='
\echo '✅ RESUMO DOS TESTES'
\echo '=========================================='
\echo ''
\echo 'Testes esperados:'
\echo '  ✅ 8 índices criados (3 parciais, 1 com INCLUDE)'
\echo '  ✅ 3 constraints CHECK funcionando'
\echo '  ✅ Deduplicação funciona corretamente'
\echo '  ✅ INSERT na primeira solicitação'
\echo '  ✅ UPDATE em solicitações duplicadas'
\echo '  ✅ Contador de tentativas incrementado'
\echo '  ✅ Solicitações de usuários diferentes permitidas'
\echo '  ✅ Constraint bloqueia solicitação sem solicitante'
\echo ''
\echo 'Se todos os testes passaram, a otimização está completa! 🎉'
\echo '=========================================='
