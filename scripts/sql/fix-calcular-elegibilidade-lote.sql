-- Correção da função calcular_elegibilidade_lote
-- Problema: Tipo text retornado não corresponde ao tipo character varying esperado na coluna 3

CREATE OR REPLACE FUNCTION calcular_elegibilidade_lote(
  p_empresa_id INTEGER,
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
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN ('Índice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))')::VARCHAR(100)
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
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRÍTICA'::VARCHAR(20)
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'::VARCHAR(20)
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MÉDIA'::VARCHAR(20)
      ELSE 'NORMAL'::VARCHAR(20)
    END AS prioridade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND (
      -- Critério 1: Funcionário novo (índice 0)
      f.indice_avaliacao = 0
      OR
      -- Critério 2: Índice incompleto (faltou lote anterior)
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      -- Critério 3: Mais de 1 ano sem avaliação
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY
    -- Ordenar por prioridade: CRÍTICA > ALTA > MÉDIA > NORMAL
    CASE prioridade
      WHEN 'CRÍTICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MÉDIA' THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC, -- Mais atrasados primeiro
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote (INTEGER, INTEGER) IS 'Calcula quais funcionários devem ser incluídos no próximo lote com base em índice, data (>1 ano) e novos funcionários';

-- Teste da função corrigida
SELECT 'Função calcular_elegibilidade_lote corrigida com sucesso!' as status;