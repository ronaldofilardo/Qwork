-- Diagnóstico e correção da avaliação #51 do CPF 16841540069

-- 1. Verificar estado atual
SELECT 
  'Estado atual da avaliação 51' as info,
  a.id,
  a.funcionario_cpf,
  a.lote_id,
  a.status,
  a.inicio,
  a.envio,
  l.codigo as lote_codigo,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = 51) as respostas
FROM avaliacoes a
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE a.id = 51;

-- 2. Verificar todas as avaliações deste CPF no lote 16
SELECT 
  'Todas avaliações do CPF no lote' as info,
  a.id,
  a.lote_id,
  a.status,
  a.inicio,
  a.envio,
  (SELECT COUNT(*) FROM respostas WHERE avaliacao_id = a.id) as respostas
FROM avaliacoes a
WHERE a.funcionario_cpf = '16841540069'
  AND a.lote_id = 16
ORDER BY a.id;

-- 3. Verificar se há respostas vinculadas à avaliação errada
SELECT 
  'Respostas por avaliação do CPF' as info,
  r.avaliacao_id,
  a.status,
  a.lote_id,
  l.codigo,
  COUNT(r.id) as total_respostas,
  MIN(r.criado_em) as primeira_resposta,
  MAX(r.criado_em) as ultima_resposta
FROM respostas r
JOIN avaliacoes a ON a.id = r.avaliacao_id
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE a.funcionario_cpf = '16841540069'
GROUP BY r.avaliacao_id, a.status, a.lote_id, l.codigo
ORDER BY r.avaliacao_id;

-- 4. Se a avaliação #51 deveria estar concluída, verificar resultados
SELECT 
  'Resultados calculados para avaliação 51' as info,
  rs.avaliacao_id,
  COUNT(*) as total_grupos_calculados
FROM resultados rs
WHERE rs.avaliacao_id = 51
GROUP BY rs.avaliacao_id;

-- 5. Verificar status do lote 16
SELECT 
  'Status do lote 16' as info,
  l.id,
  l.codigo,
  l.status,
  COUNT(a.id) as total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
  COUNT(CASE WHEN a.status = 'iniciada' THEN 1 END) as iniciadas,
  COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as em_andamento,
  COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
WHERE l.id = 16
GROUP BY l.id, l.codigo, l.status;
