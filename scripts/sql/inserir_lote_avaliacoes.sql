-- Primeiro statement: Inserir avaliações e resultados
WITH cpfs AS (
  SELECT row_number() OVER () AS aval_num, cpf
  FROM (
    (SELECT cpf FROM funcionarios WHERE clinica_id = 1 AND empresa_id = 1 AND setor = 'Comercial Externo' ORDER BY random() LIMIT 50)
    UNION ALL
    (SELECT cpf FROM funcionarios WHERE clinica_id = 1 AND empresa_id = 1 AND setor != 'Comercial Externo' ORDER BY random() LIMIT 50)
  ) s
),
grupos_alto AS (
  SELECT aval_num, unnest(ARRAY[9, 10] || (SELECT ARRAY_AGG(g) FROM (SELECT g FROM generate_series(1, 8) g ORDER BY random() LIMIT 3) sub)) AS grupo
  FROM generate_series(1, 100) aval_num
),
categorias AS (
  SELECT av.aval_num, gr.grupo,
         CASE WHEN gr.grupo IN (SELECT grupo FROM grupos_alto ga WHERE ga.aval_num = av.aval_num) THEN 'alto'
              ELSE CASE WHEN random() > 0.5 THEN 'medio' ELSE 'baixo' END
         END AS categoria
  FROM (SELECT aval_num FROM generate_series(1, 100) aval_num) av
  CROSS JOIN (SELECT grupo FROM generate_series(1, 10) grupo) gr
),
scores AS (
  SELECT aval_num, grupo, categoria,
         CASE categoria
           WHEN 'alto' THEN 67 + (random() * 33)::INT
           WHEN 'medio' THEN 33 + (random() * 33)::INT
           WHEN 'baixo' THEN (random() * 33)::INT
         END AS score
  FROM categorias
),
aval_ids AS (
  INSERT INTO avaliacoes (funcionario_cpf, inicio, envio, status, grupo_atual, criado_em, atualizado_em, lote_id)
  SELECT cpf, NOW(), NOW(), 'concluida', 10, NOW(), NOW(), 4
  FROM cpfs
  ORDER BY aval_num
  RETURNING id, funcionario_cpf AS cpf, (SELECT aval_num FROM cpfs WHERE cpf = funcionario_cpf) AS aval_num
)
INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria, criado_em)
SELECT aval_ids.id, s.grupo, 'exemplo', s.score, s.categoria, NOW()
FROM aval_ids
JOIN scores s ON aval_ids.aval_num = s.aval_num;

-- Segundo statement: Inserir respostas
WITH cpfs AS (
  SELECT row_number() OVER () AS aval_num, cpf
  FROM (
    (SELECT cpf FROM funcionarios WHERE clinica_id = 1 AND empresa_id = 1 AND setor = 'Comercial Externo' ORDER BY random() LIMIT 50)
    UNION ALL
    (SELECT cpf FROM funcionarios WHERE clinica_id = 1 AND empresa_id = 1 AND setor != 'Comercial Externo' ORDER BY random() LIMIT 50)
  ) s
),
grupos_alto AS (
  SELECT aval_num, unnest(ARRAY[9, 10] || (SELECT ARRAY_AGG(g) FROM (SELECT g FROM generate_series(1, 8) g ORDER BY random() LIMIT 3) sub)) AS grupo
  FROM generate_series(1, 100) aval_num
),
categorias AS (
  SELECT av.aval_num, gr.grupo,
         CASE WHEN gr.grupo IN (SELECT grupo FROM grupos_alto ga WHERE ga.aval_num = av.aval_num) THEN 'alto'
              ELSE CASE WHEN random() > 0.5 THEN 'medio' ELSE 'baixo' END
         END AS categoria
  FROM (SELECT aval_num FROM generate_series(1, 100) aval_num) av
  CROSS JOIN (SELECT grupo FROM generate_series(1, 10) grupo) gr
),
itens AS (
  SELECT 1 AS grupo, unnest(ARRAY['Q1', 'Q2', 'Q3', 'Q9']) AS item
  UNION ALL
  SELECT 2, unnest(ARRAY['Q13', 'Q17', 'Q18', 'Q19'])
  UNION ALL
  SELECT 3, unnest(ARRAY['Q20', 'Q21', 'Q23', 'Q25', 'Q26', 'Q28'])
  UNION ALL
  SELECT 4, unnest(ARRAY['Q31', 'Q32', 'Q33', 'Q34'])
  UNION ALL
  SELECT 5, unnest(ARRAY['Q35', 'Q38', 'Q41'])
  UNION ALL
  SELECT 6, unnest(ARRAY['Q43', 'Q45'])
  UNION ALL
  SELECT 7, unnest(ARRAY['Q48', 'Q52', 'Q55'])
  UNION ALL
  SELECT 8, unnest(ARRAY['Q56', 'Q57', 'Q58'])
  UNION ALL
  SELECT 9, unnest(ARRAY['Q59', 'Q61', 'Q62', 'Q64'])
  UNION ALL
  SELECT 10, unnest(ARRAY['Q65', 'Q66', 'Q68', 'Q70'])
),
respostas_data AS (
  SELECT c.aval_num, c.grupo, i.item,
         CASE c.categoria
           WHEN 'alto' THEN (ARRAY[75,100])[floor(random()*2)+1]
           WHEN 'medio' THEN (ARRAY[25,50])[floor(random()*2)+1]
           WHEN 'baixo' THEN (ARRAY[0,25])[floor(random()*2)+1]
         END AS valor
  FROM categorias c
  JOIN itens i ON c.grupo = i.grupo
),
aval_ids AS (
  SELECT id, funcionario_cpf AS cpf, row_number() OVER (ORDER BY id) AS aval_num
  FROM (
    SELECT id, funcionario_cpf
    FROM avaliacoes
    WHERE lote_id = 4 AND status = 'concluida'
    ORDER BY id DESC
    LIMIT 100
  ) sub
)
INSERT INTO respostas (avaliacao_id, grupo, item, valor, criado_em)
SELECT aval_ids.id, r.grupo, r.item, r.valor, NOW()
FROM aval_ids
JOIN respostas_data r ON aval_ids.aval_num = r.aval_num;