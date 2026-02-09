-- Migration 607: Forcar recriacao das funcoes calcular_elegibilidade_lote
-- Data: 2026-02-08
-- Depende: 606_fix_calcular_elegibilidade_lote_func_utf8.sql
-- CRITICO: DROP e CREATE para garantir que funcao seja atualizada corretamente

BEGIN;

-- Dropar funcoes existentes (CASCADE para remover dependencias)
DROP FUNCTION IF EXISTS calcular_elegibilidade_lote(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS calcular_elegibilidade_lote_contratante(INTEGER, INTEGER) CASCADE;

-- Recriar funcao calcular_elegibilidade_lote para empresas (via clinicas)
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
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
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
  INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
  WHERE
    fc.empresa_id = p_empresa_id
    AND fc.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado
      f.indice_avaliacao = 0
      OR
      -- Indice esta atrasado MAS nao tem avaliacao concluida recente
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao foi concluida ha mais de 1 ano
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao (apenas inativadas)
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

COMMENT ON FUNCTION calcular_elegibilidade_lote(INTEGER, INTEGER) IS 
'Calcula quais funcionarios devem ser incluidos no proximo lote de avaliacao para uma empresa.
ARQUITETURA SEGREGADA: Usa funcionarios_clinicas em vez de empresa_id direto.
Versao atualizada em Migration 607 (DROP + CREATE para forcar atualizacao).';

-- Recriar funcao calcular_elegibilidade_lote_contratante (para entidades diretas)
CREATE FUNCTION calcular_elegibilidade_lote_contratante(
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
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1 THEN 
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.ultima_avaliacao_data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
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
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  WHERE
    fe.contratante_id = p_contratante_id
    AND fe.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado
      f.indice_avaliacao = 0
      OR
      -- Indice esta atrasado MAS nao tem avaliacao concluida recente
      (
        (p_numero_lote_atual - 1 - f.indice_avaliacao) >= 1
        AND (
          f.ultima_avaliacao_data_conclusao IS NULL
          OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao foi concluida ha mais de 1 ano
      (f.ultima_avaliacao_status = 'concluida' AND f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao (apenas inativadas)
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

COMMENT ON FUNCTION calcular_elegibilidade_lote_contratante(INTEGER, INTEGER) IS 
'Calcula quais funcionarios devem ser incluidos no proximo lote de avaliacao para um contratante (entidade).
ARQUITETURA SEGREGADA: Usa funcionarios_entidades em vez de contratante_id direto.
Versao atualizada em Migration 607 (DROP + CREATE para forcar atualizacao).';

-- Verificar se as funcoes foram criadas corretamente
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname IN ('calcular_elegibilidade_lote', 'calcular_elegibilidade_lote_contratante');
  
  IF v_count = 2 THEN
    RAISE NOTICE 'Funcoes calcular_elegibilidade_lote e calcular_elegibilidade_lote_contratante recriadas com sucesso';
  ELSE
    RAISE WARNING 'Apenas % funcao(oes) encontrada(s), esperado 2', v_count;
  END IF;
END $$;

COMMIT;

-- Migration 607 aplicada com sucesso
