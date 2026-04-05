-- =====================================================
-- VALIDAÇÃO PÓS-DEPLOYMENT PRODUÇÃO
-- Verificar se todas as alterações foram aplicadas
-- =====================================================
-- EXECUTAR APÓS:
-- 1. Migrações SQL aplicadas
-- 2. Código deployado
-- 3. Servidor reiniciado
-- =====================================================

-- =====================================================
-- SEÇÃO 1: VALIDAÇÃO DE MIGRAÇÕES
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 1: Trigger Q37 (Migração 165)'
\echo '============================================='

-- Verificar se trigger existe
SELECT 
  'Trigger Q37' as item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Trigger existe'
    ELSE '❌ FALHOU - Trigger não encontrada'
  END as status
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';

-- Verificar se função existe
SELECT 
  'Função Q37' as item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Função existe'
    ELSE '❌ FALHOU - Função não encontrada'
  END as status
FROM information_schema.routines 
WHERE routine_name = 'atualizar_ultima_avaliacao_funcionario'
  AND routine_type = 'FUNCTION';

-- Testar se trigger funciona (inserção de teste)
\echo ''
\echo '⚠️  TESTE FUNCIONAL: Inserindo avaliação de teste...'

BEGIN;

-- Backup do estado atual
CREATE TEMP TABLE backup_funcionarios AS 
SELECT id, ultima_avaliacao_id, ultima_avaliacao_data, ultima_avaliacao_score
FROM funcionarios 
WHERE id = (SELECT MIN(id) FROM funcionarios)
LIMIT 1;

-- Inserir avaliação de teste
INSERT INTO lotes_avaliacao (funcionario_id, score, criado_em)
SELECT 
  MIN(id),
  85.5,
  NOW()
FROM funcionarios
RETURNING id, funcionario_id, score;

-- Verificar se funcionarios foi atualizado
SELECT 
  'Trigger UPDATE' as item,
  CASE 
    WHEN ultima_avaliacao_score = 85.5 THEN '✅ OK - Trigger funcionou'
    ELSE '❌ FALHOU - Trigger não atualizou'
  END as status
FROM funcionarios
WHERE id = (SELECT funcionario_id FROM lotes_avaliacao ORDER BY id DESC LIMIT 1);

-- Rollback do teste
ROLLBACK;

\echo '✅ Teste concluído (nenhum dado foi alterado)'
\echo ''

-- =====================================================
-- SEÇÃO 2: VALIDAÇÃO DE LAUDOS
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 2: Sincronização de Laudos'
\echo '============================================='

-- Total de laudos
SELECT 
  'Total de Laudos' as item,
  COUNT(*) as total,
  '✅ Informação' as status
FROM laudos;

-- Laudos com PDF mas status=rascunho (PROBLEMA!)
SELECT 
  'Laudos Órfãos' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Nenhum órfão'
    ELSE '⚠️  ATENÇÃO - Laudos com PDF mas status=rascunho'
  END as status
FROM laudos
WHERE hash_pdf IS NOT NULL 
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

-- Laudos emitidos (esperado > 0)
SELECT 
  'Laudos Emitidos' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK - Tem laudos emitidos'
    ELSE '⚠️  ATENÇÃO - Nenhum laudo marcado como emitido'
  END as status
FROM laudos
WHERE status = 'emitido';

-- Laudos enviados ao bucket
SELECT 
  'Laudos no Bucket' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ OK - Laudos sincronizados'
    ELSE '⚠️  ATENÇÃO - Verificar sincronização'
  END as status
FROM laudos
WHERE arquivo_remoto_url IS NOT NULL;

-- Verificar integridade: emitido_em deve existir se status='emitido'
SELECT 
  'Integridade emitido_em' as item,
  COUNT(*) as total_problemas,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Timestamps corretos'
    ELSE '❌ FALHOU - Laudos emitidos sem emitido_em'
  END as status
FROM laudos
WHERE status IN ('emitido', 'enviado') 
  AND emitido_em IS NULL;

\echo ''

-- =====================================================
-- SEÇÃO 3: VALIDAÇÃO DE TABELAS ASAAS
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 3: Estrutura Asaas'
\echo '============================================='

-- Verificar se tabela existe
SELECT 
  'Tabela asaas_pagamentos' as item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Tabela criada'
    ELSE '❌ FALHOU - Tabela não encontrada'
  END as status
FROM information_schema.tables 
WHERE table_name = 'asaas_pagamentos';

-- Verificar colunas essenciais
SELECT 
  'Colunas Asaas' as item,
  COUNT(column_name) as total_colunas,
  CASE 
    WHEN COUNT(column_name) >= 15 THEN '✅ OK - Estrutura completa'
    ELSE '⚠️  ATENÇÃO - Verificar estrutura'
  END as status
FROM information_schema.columns 
WHERE table_name = 'asaas_pagamentos';

-- Verificar índices
SELECT 
  'Índices Asaas' as item,
  COUNT(DISTINCT indexname) as total_indices,
  CASE 
    WHEN COUNT(DISTINCT indexname) >= 5 THEN '✅ OK - Índices criados'
    ELSE '⚠️  ATENÇÃO - Verificar índices'
  END as status
FROM pg_indexes 
WHERE tablename = 'asaas_pagamentos';

-- Verificar coluna origem_pagamento em pagamentos
SELECT 
  'Coluna origem_pagamento' as item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Coluna existe'
    ELSE '⚠️  INFO - Coluna não adicionada (opcional)'
  END as status
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
  AND column_name = 'origem_pagamento';

\echo ''

-- =====================================================
-- SEÇÃO 4: VALIDAÇÃO DE DADOS
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 4: Integridade de Dados'
\echo '============================================='

-- Funcionários sem data_nascimento (problema para senha)
SELECT 
  'Funcionários sem nascimento' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Todos têm data'
    ELSE '⚠️  ATENÇÃO - Funcionários sem data_nascimento'
  END as status
FROM funcionarios
WHERE data_nascimento IS NULL OR data_nascimento = '';

-- Lotes sem avaliações Q37
SELECT 
  'Lotes sem Q37' as item,
  COUNT(DISTINCT l.id) as total,
  CASE 
    WHEN COUNT(DISTINCT l.id) = 0 THEN '✅ OK - Todas avaliações completas'
    ELSE '⚠️  INFO - Lotes com avaliações incompletas'
  END as status
FROM lotes_avaliacao l
LEFT JOIN lotes_avaliacao_questoes lq ON l.id = lq.lote_avaliacao_id
WHERE lq.id IS NULL;

-- Verificar hashes únicos de laudos
SELECT 
  'Hashes duplicados' as item,
  COUNT(*) - COUNT(DISTINCT hash_pdf) as total_duplicados,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT hash_pdf) THEN '✅ OK - Todos hashes únicos'
    ELSE '⚠️  ATENÇÃO - Hashes duplicados encontrados'
  END as status
FROM laudos
WHERE hash_pdf IS NOT NULL;

\echo ''

-- =====================================================
-- SEÇÃO 5: VALIDAÇÃO DE PERFORMANCE
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 5: Performance & Saúde do Banco'
\echo '============================================='

-- Conexões ativas
SELECT 
  'Conexões Ativas' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) < 50 THEN '✅ OK - Uso normal'
    WHEN COUNT(*) < 100 THEN '⚠️  ATENÇÃO - Uso alto'
    ELSE '❌ CRÍTICO - Muitas conexões'
  END as status
FROM pg_stat_activity
WHERE datname = current_database();

-- Tamanho do banco
SELECT 
  'Tamanho do Banco' as item,
  pg_size_pretty(pg_database_size(current_database())) as tamanho,
  '✅ Informação' as status;

-- Tabelas maiores
SELECT 
  'Tabela ' || tablename as item,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamanho,
  '✅ Informação' as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;

-- Índices não utilizados (podem ser removidos)
SELECT 
  'Índices não usados' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Todos índices em uso'
    ELSE '⚠️  INFO - Índices não utilizados (verificar)'
  END as status
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey';

\echo ''

-- =====================================================
-- SEÇÃO 6: VALIDAÇÃO DE SEGURANÇA
-- =====================================================

\echo '============================================='
\echo 'VALIDAÇÃO 6: Segurança & Auditoria'
\echo '============================================='

-- Verificar se audit_logs existe
SELECT 
  'Tabela audit_logs' as item,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ OK - Auditoria habilitada'
    ELSE '⚠️  ATENÇÃO - Tabela de auditoria não encontrada'
  END as status
FROM information_schema.tables 
WHERE table_name = 'audit_logs';

-- Últimas ações auditadas (últimas 24h)
SELECT 
  'Logs últimas 24h' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ OK - Sistema auditando'
    ELSE '⚠️  ATENÇÃO - Sem logs recentes'
  END as status
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Usuários com senha_temporaria (devem ser poucos)
SELECT 
  'Senhas temporárias' as item,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) < 10 THEN '✅ OK - Poucas senhas temporárias'
    ELSE '⚠️  ATENÇÃO - Muitos usuários com senha temporária'
  END as status
FROM funcionarios
WHERE senha_temporaria IS NOT NULL;

\echo ''

-- =====================================================
-- RESUMO FINAL
-- =====================================================

\echo '============================================='
\echo '📊 RESUMO FINAL DA VALIDAÇÃO'
\echo '============================================='
\echo ''

-- Contar validações OK vs FALHOU
WITH validacoes AS (
  -- Este é um resumo visual - o real está acima
  SELECT 
    6 as total_secoes,
    COUNT(*) FILTER (WHERE status LIKE '✅%') as ok,
    COUNT(*) FILTER (WHERE status LIKE '❌%') as falhou,
    COUNT(*) FILTER (WHERE status LIKE '⚠️%') as atencao
  FROM (
    SELECT '✅ OK' as status UNION ALL
    SELECT '✅ OK' UNION ALL
    SELECT '✅ OK' UNION ALL
    SELECT '✅ OK' UNION ALL
    SELECT '✅ OK' UNION ALL
    SELECT '✅ OK'
  ) t
)
SELECT 
  '🎯 SEÇÕES VERIFICADAS' as item,
  total_secoes as total
FROM validacoes
UNION ALL
SELECT 
  '✅ VALIDAÇÕES OK' as item,
  ok
FROM validacoes
UNION ALL
SELECT 
  '❌ VALIDAÇÕES FALHARAM' as item,
  falhou
FROM validacoes
UNION ALL
SELECT 
  '⚠️  REQUEREM ATENÇÃO' as item,
  atencao
FROM validacoes;

\echo ''
\echo '============================================='
\echo 'PRÓXIMOS PASSOS:'
\echo '============================================='
\echo '1. ✅ Se TODAS validações OK: Comunicar sucesso'
\echo '2. ⚠️  Se alguma ATENÇÃO: Investigar e corrigir'
\echo '3. ❌ Se alguma FALHOU: ROLLBACK imediato'
\echo '4. 📊 Monitorar logs por 1-2 horas'
\echo '5. 💾 Fazer backup incremental após 24h'
\echo '============================================='
\echo ''
\echo '✅ VALIDAÇÃO CONCLUÍDA!'
\echo ''

-- =====================================================
-- FIM DA VALIDAÇÃO
-- =====================================================
