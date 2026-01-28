-- Migration 073: Fix eligibility to consider only completed evaluations
-- Date: 2026-01-05
-- Issue: Employees with recently completed evaluations were being included
--        in new batches because:
--        1. Trigger was updating ultima_avaliacao_data_conclusao even for inactivated evals
--        2. Eligibility function was using data_ultimo_lote instead of ultima_avaliacao_data_conclusao
--        3. Did not verify if last evaluation was completed or inactivated

BEGIN;

-- 1. Fix trigger to NOT update ultima_avaliacao_data_conclusao when status = 'inactivated'
CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_codigo VARCHAR(20);
  v_motivo_inativacao TEXT;
BEGIN
  -- Get batch code
  SELECT l.codigo INTO v_lote_codigo
  FROM lotes_avaliacao l
  WHERE l.id = NEW.lote_id;

  -- Get inactivation reason (if applicable)
  IF NEW.status = 'inativada' THEN
    v_motivo_inativacao := NEW.motivo_inativacao;
  ELSE
    v_motivo_inativacao := NULL;
  END IF;

  -- Update employee only if this evaluation is more recent
  -- IMPORTANT: ultima_avaliacao_data_conclusao is only updated for COMPLETED evaluations
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultimo_lote_codigo = v_lote_codigo,
    ultima_avaliacao_data_conclusao = CASE 
      WHEN NEW.status = 'concluida' THEN NEW.envio
      ELSE ultima_avaliacao_data_conclusao  -- Keep previous value if not completed
    END,
    ultima_avaliacao_status = NEW.status,
    ultimo_motivo_inativacao = v_motivo_inativacao,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix eligibility function for contractors
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
      -- Index is delayed (difference >= 1)
      (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
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

-- 3. Fix eligibility function for companies (same issue)
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
      -- Index is delayed (difference >= 1)
      (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
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

SELECT '073.1 Trigger atualizar_ultima_avaliacao_funcionario fixed' as status;
SELECT '073.2 Function calcular_elegibilidade_lote_contratante fixed' as status;
SELECT '073.3 Function calcular_elegibilidade_lote fixed' as status;

COMMIT;
