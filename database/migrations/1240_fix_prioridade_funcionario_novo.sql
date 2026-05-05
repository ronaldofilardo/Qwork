-- Migration 1240: Corrigir prioridade CRITICA incorreta para funcionarios novos
-- Problema:
--   Na expressao CASE para o campo `prioridade` em calcular_elegibilidade_lote e
--   calcular_elegibilidade_lote_tomador, a condicao CRITICA ((lote-1-indice) >= 2)
--   era avaliada ANTES de (indice = 0 -> ALTA).
--   Resultado: funcionario novo (indice=0) em lote 3+ recebia (3-1-0)=2 >= 2 -> CRITICA
--   ao inves de ALTA. O ORDER BY nao e afetado (ordena corretamente por posicao ordinal).

-- =============================================
-- 1. CORRIGIR calcular_elegibilidade_lote (empresas via clinicas)
-- =============================================
DROP FUNCTION IF EXISTS calcular_elegibilidade_lote(INTEGER, INTEGER) CASCADE;

CREATE FUNCTION calcular_elegibilidade_lote(
  p_empresa_id INTEGER,
  p_numero_lote_atual INTEGER
)
RETURNS TABLE(
  funcionario_cpf CHARACTER(11),
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
    (CASE
      WHEN fc.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - fc.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN ult_aval.data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    fc.indice_avaliacao AS indice_atual,
    fc.data_ultimo_lote,
    CASE
      WHEN ult_aval.data_conclusao IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - ult_aval.data_conclusao)::INTEGER
      WHEN fc.data_ultimo_lote IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - fc.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    -- FIX: indice=0 (funcionario novo) avaliado ANTES de >=2 (atrasado CRITICA)
    -- Antes: (>=2 THEN CRITICA) era o primeiro WHEN, pegando indice=0 em lotes 3+
    (CASE
      WHEN fc.indice_avaliacao = 0 THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
  LEFT JOIN LATERAL (
    SELECT a.envio AS data_conclusao
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE a.funcionario_cpf = f.cpf
      AND la.empresa_id = p_empresa_id
      AND a.status = 'concluida'
      AND a.envio IS NOT NULL
    ORDER BY a.envio DESC
    LIMIT 1
  ) ult_aval ON true
  WHERE
    fc.empresa_id = p_empresa_id
    AND fc.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      fc.indice_avaliacao = 0
      OR
      (
        (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      (ult_aval.data_conclusao IS NULL AND fc.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 2 THEN 1
      WHEN fc.indice_avaliacao = 0 THEN 2
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    fc.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote(INTEGER, INTEGER) IS
'Calcula elegibilidade per-vinculo para empresas.
Multi-CNPJ: Usa fc.indice_avaliacao e verifica avaliacoes concluidas apenas dos lotes DESTA empresa.
Migration 1240: fix prioridade — funcionario novo (indice=0) sempre ALTA, nunca CRITICA.';


-- =============================================
-- 2. CORRIGIR calcular_elegibilidade_lote_tomador (entidades)
-- =============================================
DROP FUNCTION IF EXISTS calcular_elegibilidade_lote_tomador(INTEGER, INTEGER) CASCADE;

CREATE FUNCTION calcular_elegibilidade_lote_tomador(
  p_tomador_id INTEGER,
  p_numero_lote_atual INTEGER
)
RETURNS TABLE(
  funcionario_cpf CHARACTER(11),
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
    (CASE
      WHEN fe.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - fe.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN ult_aval.data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    fe.indice_avaliacao AS indice_atual,
    fe.data_ultimo_lote,
    CASE
      WHEN ult_aval.data_conclusao IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - ult_aval.data_conclusao)::INTEGER
      WHEN fe.data_ultimo_lote IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - fe.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    -- FIX: indice=0 (funcionario novo) avaliado ANTES de >=2 (atrasado CRITICA)
    (CASE
      WHEN fe.indice_avaliacao = 0 THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  LEFT JOIN LATERAL (
    SELECT a.envio AS data_conclusao
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE a.funcionario_cpf = f.cpf
      AND la.entidade_id = p_tomador_id
      AND a.status = 'concluida'
      AND a.envio IS NOT NULL
    ORDER BY a.envio DESC
    LIMIT 1
  ) ult_aval ON true
  WHERE
    fe.entidade_id = p_tomador_id
    AND fe.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      fe.indice_avaliacao = 0
      OR
      (
        (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      (ult_aval.data_conclusao IS NULL AND fe.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 2 THEN 1
      WHEN fe.indice_avaliacao = 0 THEN 2
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    fe.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote_tomador(INTEGER, INTEGER) IS
'Calcula elegibilidade per-vinculo para entidades (tomadores).
Multi-CNPJ: Usa fe.indice_avaliacao e verifica avaliacoes concluidas apenas dos lotes DESTA entidade.
Migration 1240: fix prioridade — funcionario novo (indice=0) sempre ALTA, nunca CRITICA.';
