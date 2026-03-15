-- Migration 1104: Atualizar funcoes de elegibilidade para usar campos per-vinculo
-- Data: 2026-06-03
-- Depende: 1103_add_job_fields_to_vinculo_tables.sql
-- Contexto: Multi-CNPJ — indice_avaliacao e data_ultimo_lote agora vivem nas tabelas de vinculo
-- As funcoes de elegibilidade devem usar fc.indice_avaliacao / fe.indice_avaliacao
-- e verificar conclusao de avaliacoes apenas dos lotes DESTA empresa/entidade

BEGIN;

-- =============================================
-- 1. ATUALIZAR calcular_elegibilidade_lote (empresas via clinicas)
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
    (CASE
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN fc.indice_avaliacao = 0 THEN 'ALTA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
  -- Subquery lateral: ultima avaliacao CONCLUIDA desta empresa
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
      -- Nunca avaliado nesta empresa
      fc.indice_avaliacao = 0
      OR
      -- Indice atrasado MAS nao tem avaliacao concluida recente nesta empresa
      (
        (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao nesta empresa foi concluida ha mais de 1 ano
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao nesta empresa (apenas inativadas)
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
Migration 1104.';


-- =============================================
-- 2. ATUALIZAR calcular_elegibilidade_lote_tomador (entidades)
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
    (CASE
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN fe.indice_avaliacao = 0 THEN 'ALTA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  -- Subquery lateral: ultima avaliacao CONCLUIDA desta entidade
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
      -- Nunca avaliado nesta entidade
      fe.indice_avaliacao = 0
      OR
      -- Indice atrasado MAS nao tem avaliacao concluida recente nesta entidade
      (
        (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao nesta entidade foi concluida ha mais de 1 ano
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao nesta entidade (apenas inativadas)
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
Migration 1104.';


-- =============================================
-- 3. VERIFICACAO
-- =============================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname IN ('calcular_elegibilidade_lote', 'calcular_elegibilidade_lote_tomador');

  IF v_count = 2 THEN
    RAISE NOTICE 'Migration 1104: Funcoes de elegibilidade per-vinculo criadas com sucesso';
  ELSE
    RAISE EXCEPTION 'Migration 1104: Esperadas 2 funcoes, encontradas %', v_count;
  END IF;
END;
$$;

COMMIT;
