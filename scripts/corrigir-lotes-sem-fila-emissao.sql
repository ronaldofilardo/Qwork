-- Correção: Lotes com laudo emitido MAS sem registro na fila_emissao
-- Problema: Laudos foram criados diretamente via emissão automática, pulando a fila
-- Solução: 
--   1. MANTER laudos existentes (são imutáveis após emissão - correto!)
--   2. Criar registros retroativos na fila_emissao
--   3. Marcar como processado_em para indicar que já foram emitidos

-- Data: 2026-01-30
-- Afetados: 13 lotes (IDs: 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17)

BEGIN;

-- 1. Identificar os lotes afetados
CREATE TEMP TABLE lotes_afetados AS
SELECT 
  la.id as lote_id,
  la.codigo,
  la.liberado_por,
  l.id as laudo_id_existente,
  l.criado_em as laudo_criado_em,
  l.emitido_em as laudo_emitido_em
FROM lotes_avaliacao la
LEFT JOIN fila_emissao fe ON la.id = fe.lote_id
LEFT JOIN laudos l ON la.id = l.lote_id
WHERE la.status = 'concluido' 
  AND l.id IS NOT NULL 
  AND fe.id IS NULL
ORDER BY la.id;

-- 2. Mostrar o que será corrigido
SELECT 
  lote_id,
  codigo,
  liberado_por,
  laudo_id_existente,
  laudo_criado_em,
  laudo_emitido_em
FROM lotes_afetados
ORDER BY lote_id;

-- 3. CRIAR registros retroativos na fila_emissao
-- Usar timestamps dos laudos para manter histórico correto
INSERT INTO fila_emissao (lote_id, solicitado_em, solicitado_por, prioridade, processado_em, laudo_id)
SELECT 
  lote_id,
  laudo_criado_em - INTERVAL '5 seconds', -- solicitado 5s antes da criação
  liberado_por,
  'normal',
  laudo_emitido_em, -- marcar quando foi processado
  laudo_id_existente
FROM lotes_afetados
ORDER BY lote_id;

-- 4. Verificar resultado
SELECT 
  la.id as lote_id,
  la.codigo,
  la.status,
  fe.id as fila_id,
  fe.solicitado_em,
  fe.processado_em,
  fe.solicitado_por,
  l.id as laudo_id,
  l.status as laudo_status
FROM lotes_avaliacao la
INNER JOIN fila_emissao fe ON la.id = fe.lote_id
INNER JOIN laudos l ON la.id = l.lote_id
WHERE la.id IN (SELECT lote_id FROM lotes_afetados)
ORDER BY la.id;

-- 5. Criar log de auditoria
INSERT INTO audit_logs (user_cpf, action, resource, resource_id, details, created_at)
SELECT 
  liberado_por,
  'INSERT',
  'fila_emissao',
  lote_id::text,
  'Registro criado retroativamente - lote tinha laudo mas sem fila_emissao. Correção de emissão automática que pulou a fila.',
  NOW()
FROM lotes_afetados;

-- Limpar temp table
DROP TABLE lotes_afetados;

COMMIT;

-- Resultado esperado:
-- - 13 registros criados em fila_emissao (retroativos)
-- - 13 laudos mantidos (imutáveis)
-- - Histórico corrigido: agora todos os lotes têm registro na fila
-- - Campo processado_em preenchido para indicar que já foram emitidos
