DROP FUNCTION IF EXISTS detectar_anomalias_indice(integer) CASCADE;

CREATE OR REPLACE FUNCTION detectar_anomalias_indice(
  p_empresa_id INTEGER
)
RETURNS TABLE(
  cpf CHAR(11),
  nome VARCHAR(100),
  categoria_anomalia VARCHAR(50),
  mensagem TEXT,
  prioridade VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY

  -- Anomalia 1: Muitas inativacoes consecutivas (padrão suspeito)
  SELECT 
    f.cpf,
    f.nome,
    'MUITAS_INATIVACOES'::VARCHAR(50) AS categoria_anomalia,
    'Funcionario tem ' || COUNT(a.id) || ' inativacoes consecutivas nos ultimos lotes. Possivel padrao de desistencia ou problemas sistemicos.'::TEXT AS mensagem,
    'CRITICA'::VARCHAR(20) AS prioridade
  FROM funcionarios f
  JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE 
    f.empresa_id = p_empresa_id
    AND a.status = 'inativada'
    AND la.numero_ordem >= (SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
  GROUP BY f.cpf, f.nome
  HAVING COUNT(a.id) >= 3

  UNION ALL

  -- Anomalia 2: Indice muito atrasado (>5 lotes de diferenca)
  SELECT 
    f.cpf,
    f.nome,
    'INDICE_MUITO_ATRASADO'::VARCHAR(50) AS categoria_anomalia,
    'Funcionario tem indice ' || f.indice_avaliacao || ' mas o lote atual e ' || 
    (SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) || '. Diferenca de ' || (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao)) || ' lotes.'::TEXT AS mensagem,
    CASE 
      WHEN (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10) THEN 'CRITICA'::VARCHAR(20)
      WHEN (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5) THEN 'ALTA'::VARCHAR(20)
      ELSE 'MEDIA'::VARCHAR(20)
    END AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao > 0
    AND f.indice_avaliacao < (SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5;
END;
$$ LANGUAGE plpgsql;
