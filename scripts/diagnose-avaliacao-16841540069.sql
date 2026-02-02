-- Diagnóstico completo da avaliação do CPF 16841540069

-- 1. Buscar a avaliação e seu status
SELECT 
  a.id as avaliacao_id,
  a.funcionario_cpf,
  a.lote_id,
  a.status,
  a.inicio,
  a.envio,
  a.concluida_em,
  a.criado_em,
  a.atualizado_em,
  l.codigo as lote_codigo,
  l.status as lote_status,
  f.nome as funcionario_nome
FROM avaliacoes a
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE a.funcionario_cpf = '16841540069';

-- 2. Contar respostas dessa avaliação
SELECT 
  a.id as avaliacao_id,
  a.status,
  COUNT(r.id) as total_respostas,
  COUNT(DISTINCT r.grupo) as grupos_respondidos,
  MIN(r.criado_em) as primeira_resposta,
  MAX(r.criado_em) as ultima_resposta
FROM avaliacoes a
LEFT JOIN respostas r ON r.avaliacao_id = a.id
WHERE a.funcionario_cpf = '16841540069'
GROUP BY a.id, a.status;

-- 3. Verificar respostas por grupo
SELECT 
  r.grupo,
  COUNT(*) as respostas_no_grupo
FROM respostas r
JOIN avaliacoes a ON a.id = r.avaliacao_id
WHERE a.funcionario_cpf = '16841540069'
GROUP BY r.grupo
ORDER BY r.grupo;

-- 4. Verificar se há resultados calculados
SELECT 
  rs.avaliacao_id,
  rs.grupo,
  rs.dominio,
  rs.score,
  rs.categoria
FROM resultados rs
JOIN avaliacoes a ON a.id = rs.avaliacao_id
WHERE a.funcionario_cpf = '16841540069'
ORDER BY rs.grupo;

-- 5. Informações do lote
SELECT 
  l.id,
  l.codigo,
  l.status,
  l.tipo,
  COUNT(a.id) as total_avaliacoes,
  COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
  COUNT(CASE WHEN a.status = 'em_andamento' THEN 1 END) as em_andamento,
  COUNT(CASE WHEN a.status = 'iniciada' THEN 1 END) as iniciadas,
  COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as inativadas
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
WHERE l.id = (SELECT lote_id FROM avaliacoes WHERE funcionario_cpf = '16841540069' LIMIT 1)
GROUP BY l.id, l.codigo, l.status, l.tipo;
