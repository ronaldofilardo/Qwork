-- Migration 074: Fix eligibility - delayed index must respect recent completions
-- Date: 2026-01-05
-- Issue: Employees with delayed index BUT recent completed evaluation (< 1 year)
--        were being included in new batches, violating 12-month business rule
-- Root cause: Index delay check (OR condition) was NOT verifying completion date

BEGIN;

-- Fix eligibility function for contractors (entities)
CREATE OR REPLACE FUNCTION calcular_elegibilidade_lote_contratante(
  p_contratante_id INTEGER,
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
      WHEN f.indice_avaliacao = 0 THEN 'New employee (never evaluated)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Delayed index (missed ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' batch(es))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Never completed evaluation'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Over 1 year without completed evaluation'
      ELSE 'Regular renewal'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.ultima_avaliacao_data_conclusao IS NOT NULL AND f.ultima_avaliacao_status = 'concluida' 
        THEN EXTRACT(DAY FROM NOW() - f.ultima_avaliacao_data_conclusao)::INTEGER
      WHEN f.data_ultimo_lote IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE
    f.contratante_id = p_contratante_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Never evaluated
      f.indice_avaliacao = 0
      OR
      -- Index is delayed BUT no recent completed evaluation
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Last evaluation was completed over 1 year ago
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Never completed any evaluation (only inactivated)
      (f.ultima_avaliacao_data_conclusao IS NULL AND f.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 1
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

-- Fix eligibility function for companies (same logic)
CREATE OR REPLACE FUNCTION calcular_elegibilidade_lote(
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
      WHEN f.indice_avaliacao = 0 THEN 'New employee (never evaluated)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Delayed index (missed ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' batch(es))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Never completed evaluation'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Over 1 year without completed evaluation'
      ELSE 'Regular renewal'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE
      WHEN f.ultima_avaliacao_data_conclusao IS NOT NULL AND f.ultima_avaliacao_status = 'concluida' 
        THEN EXTRACT(DAY FROM NOW() - f.ultima_avaliacao_data_conclusao)::INTEGER
      WHEN f.data_ultimo_lote IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Never evaluated
      f.indice_avaliacao = 0
      OR
      -- Index is delayed BUT no recent completed evaluation
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Last evaluation was completed over 1 year ago
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Never completed any evaluation (only inactivated)
      (f.ultima_avaliacao_data_conclusao IS NULL AND f.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 2 THEN 1
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

SELECT '074.1 Function calcular_elegibilidade_lote_contratante fixed (delayed index + recent completion)' as status;
SELECT '074.2 Function calcular_elegibilidade_lote fixed (delayed index + recent completion)' as status;

COMMIT;
