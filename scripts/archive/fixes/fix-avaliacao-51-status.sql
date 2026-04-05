-- Corrigir status da avaliação #51 que tem 37 respostas mas está como 'iniciada'

BEGIN;

-- Configurar contexto de sessão para auditoria
SET LOCAL app.current_user_cpf = '16841540069';
SET LOCAL app.current_user_perfil = 'funcionario';

-- 1. Verificar estado antes da correção
SELECT 
  'ANTES DA CORREÇÃO' as momento,
  a.id,
  a.status,
  a.envio,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = 51) as respostas,
  (SELECT COUNT(*) FROM resultados WHERE avaliacao_id = 51) as resultados
FROM avaliacoes a
WHERE a.id = 51;

-- 2. Atualizar status para 'concluida' e definir data de conclusão
UPDATE avaliacoes
SET status = 'concluida',
    envio = COALESCE(envio, (SELECT MAX(criado_em) FROM respostas WHERE avaliacao_id = 51), NOW()),
    atualizado_em = NOW()
WHERE id = 51 
  AND status != 'concluida';

-- 3. Verificar se há resultados calculados
SELECT 
  'Verificar resultados calculados' as info,
  COUNT(*) as total_grupos
FROM resultados
WHERE avaliacao_id = 51;

-- 4. Se não há resultados, precisamos calculá-los (isso deveria ter sido feito na finalização)
-- Essa é uma operação que normalmente é feita pela API, mas podemos verificar se está faltando

-- 5. Verificar estado após correção
SELECT 
  'APÓS CORREÇÃO' as momento,
  a.id,
  a.status,
  a.envio,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = 51) as respostas,
  (SELECT COUNT(*) FROM resultados WHERE avaliacao_id = 51) as resultados
FROM avaliacoes a
WHERE a.id = 51;

-- 6. Forçar recálculo do status do lote
SELECT 
  'Recalcular status do lote' as info,
  l.id as lote_id,
  l.status as status_atual
FROM lotes_avaliacao l
WHERE l.id = (SELECT lote_id FROM avaliacoes WHERE id = 51);

COMMIT;

-- Informações adicionais para verificação
SELECT 
  'Status do lote 16 após correção' as info,
  l.id,
  l.codigo,
  l.status,
  COUNT(a.id) as total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
  COUNT(CASE WHEN a.status != 'concluida' AND a.status != 'inativada' THEN 1 END) as pendentes,
  COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
WHERE l.id = 16
GROUP BY l.id, l.codigo, l.status;
