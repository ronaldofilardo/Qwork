-- CORREÇÃO DA FUNÇÃO detectar_anomalias_indice
-- Resolve ambiguidade da coluna 'severidade' no ORDER BY

DROP FUNCTION IF EXISTS detectar_anomalias_indice (INTEGER);

CREATE OR REPLACE FUNCTION detectar_anomalias_indice(
  p_empresa_id INTEGER
)
RETURNS TABLE(
  funcionario_cpf CHAR(11),
  funcionario_nome VARCHAR(100),
  tipo_anomalia TEXT,
  detalhes TEXT,
  severidade TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH anomalias AS (

  -- Anomalia 1: 3+ inativações consecutivas nos últimos lotes
  SELECT
    f.cpf,
    f.nome,
    'INATIVAÇÕES CONSECUTIVAS'::TEXT AS tipo_anomalia,
    'Funcionário tem ' || COUNT(a.id) || ' inativações consecutivas nos últimos lotes. ' ||
    'Possível padrão de desistência ou problemas sistêmicos.' AS detalhes,
    'CRÍTICA'::TEXT AS severidade
  FROM funcionarios f
  JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE
    f.empresa_id = p_empresa_id
    AND a.status = 'inativada'
    AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
  GROUP BY f.cpf, f.nome
  HAVING COUNT(a.id) >= 3

  UNION ALL

  -- Anomalia 2: Índice muito atrasado (>5 lotes de diferença)
  SELECT
    f.cpf,
    f.nome,
    'ÍNDICE ATRASADO'::TEXT AS tipo_anomalia,
    'Funcionário tem índice ' || f.indice_avaliacao || ' mas o lote atual é ' || (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) || '. ' ||
    'Diferença de ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) || ' lotes.' AS detalhes,
    CASE
      WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10 THEN 'CRÍTICA'
      WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5 THEN 'ALTA'
      ELSE 'MÉDIA'
    END AS severidade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao > 0
    AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5

  UNION ALL

  -- Anomalia 3: Mais de 2 anos sem avaliação (violação crítica)
  SELECT
    f.cpf,
    f.nome,
    'PRAZO EXCEDIDO'::TEXT AS tipo_anomalia,
    'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida. ' ||
    'Violação crítica da obrigatoriedade de renovação anual.' AS detalhes,
    'CRÍTICA'::TEXT AS severidade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.data_ultimo_lote IS NOT NULL
    AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'

  UNION ALL

  -- Anomalia 4: Funcionário ativo com índice 0 por muito tempo (>6 meses)
  SELECT
    f.cpf,
    f.nome,
    'NUNCA AVALIADO'::TEXT AS tipo_anomalia,
    'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliação. ' ||
    'Pode indicar erro no processo de liberação de lotes.' AS detalhes,
    'ALTA'::TEXT AS severidade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao = 0
    AND f.criado_em < NOW() - INTERVAL '6 months'
  )
  SELECT * FROM anomalias
  ORDER BY
    CASE
      WHEN anomalias.severidade = 'CRÍTICA' THEN 1
      WHEN anomalias.severidade = 'ALTA' THEN 2
      WHEN anomalias.severidade = 'MÉDIA' THEN 3
      ELSE 4
    END,
    anomalias.nome;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detectar_anomalias_indice (INTEGER) IS 'Detecta padrões suspeitos no histórico de avaliações (>3 faltas, índice atrasado, >2 anos sem avaliação)';