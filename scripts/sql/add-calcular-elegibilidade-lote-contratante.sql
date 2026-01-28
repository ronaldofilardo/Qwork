-- Cria função para calcular elegibilidade de lote por contratante (entidade)
-- Baseada em calcular_elegibilidade_lote, mas filtra por contratante_id e funcionários sem empresa_id

CREATE OR REPLACE FUNCTION calcular_elegibilidade_lote_contratante(
  p_contratante_id INTEGER,
  p_numero_lote_atual INTEGER
)
RETURNS TABLE(
  funcionario_cpf CHAR(11),
  funcionario_nome VARCHAR(100),
  motivo_inclusao VARCHAR(100),
  indice_atual INTEGER,
  data_ultimo_lote TIMESTAMP,
  dias_sem_avaliacao INTEGER,
  prioridade VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    CASE
      WHEN f.indice_avaliacao = 0 THEN 'Funcionário novo (nunca avaliado)'::VARCHAR(100)
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN ('Ã ndice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))')::VARCHAR(100)
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliação'::VARCHAR(100)
      ELSE 'Renovação regular'::VARCHAR(100)
    END AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    CASE
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'::VARCHAR(20)
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRÃ TICA'::VARCHAR(20)
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'::VARCHAR(20)
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MÉDIA'::VARCHAR(20)
      ELSE 'NORMAL'::VARCHAR(20)
    END AS prioridade
  FROM funcionarios f
  WHERE
    f.contratante_id = p_contratante_id
    AND f.empresa_id IS NULL
    AND f.ativo = true
    AND (
      f.indice_avaliacao = 0
      OR
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY
    CASE prioridade
      WHEN 'CRÃ TICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MÉDIA' THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;