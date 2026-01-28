-- Migracao 014: Corrigir tipo TEXT vs VARCHAR na funcao calcular_elegibilidade_lote
-- Data: 2026-01-04
-- Autor: Sistema
-- Descricao: Adicionar cast explicito ::VARCHAR na coluna motivo_inclusao para evitar erro de tipo

BEGIN;

-- Recriar funcao calcular_elegibilidade_lote com cast correto
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
    (CASE 
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliacao'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE 
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE 
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRITICA'
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Criterio 1: Funcionario novo (indice 0)
      f.indice_avaliacao = 0
      OR
      -- Criterio 2: Indice incompleto (faltou lote anterior)
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      -- Criterio 3: Mais de 1 ano sem avaliacao
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY 
    -- Ordenar por prioridade: CRITICA > ALTA > MEDIA > NORMAL
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 1
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 2
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote (INTEGER, INTEGER) IS 'Calcula quais funcionarios devem ser incluidos no proximo lote (apenas perfil funcionario) com cast explicito VARCHAR';

-- Recriar funcao calcular_elegibilidade_lote_contratante com cast correto
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
    (CASE 
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliacao'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE 
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE 
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRITICA'
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  WHERE 
    f.contratante_id = p_contratante_id
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      f.indice_avaliacao = 0
      OR
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY 
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 2
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 1
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 2
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC,
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote_contratante (INTEGER, INTEGER) IS 'Calcula funcionarios elegiveis para lote de contratante (apenas perfil funcionario) com cast explicito VARCHAR';

COMMIT;
