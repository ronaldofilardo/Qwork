-- FUNCTIONS 016: Funcoes de Negocio para Sistema de Indice de Avaliacao
-- Inclui: detectar_anomalias_indice, verificar_inativacao_consecutiva

-- =====================================================
-- FUNCAO: DETECTAR ANOMALIAS NO INDICE (empresa)
-- =====================================================

-- Remover versoes antigas antes de recriar com nova assinatura
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
    'MUITAS_INATIVACOES' AS categoria_anomalia,
    'Funcionario tem ' || COUNT(a.id) || ' inativacoes consecutivas nos ultimos lotes. Possivel padrao de desistencia ou problemas sistemicos.' AS mensagem,
    'CRÃ TICA' AS prioridade
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
    'INDICE_MUITO_ATRASADO' AS categoria_anomalia,
    'Funcionario tem indice ' || f.indice_avaliacao || ' mas o lote atual e ' || 
    (SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) || '. Diferenca de ' || (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao)) || ' lotes.' AS mensagem,
    CASE 
      WHEN (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10) THEN 'CRÃ TICA'
      WHEN (((SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5) THEN 'ALTA'
      ELSE 'MÉDIA'
    END AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao > 0
    AND f.indice_avaliacao < (SELECT COALESCE(MAX(numero_ordem),0) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCAO: VERIFICAR INATIVACAO CONSECUTIVA (empresa/contratante)
-- =====================================================

-- Remover versões antigas com assinaturas diferentes antes de recriar
DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva(character, integer) CASCADE;
DROP FUNCTION IF EXISTS verificar_inativacao_consecutiva(char(11), integer) CASCADE;

CREATE OR REPLACE FUNCTION verificar_inativacao_consecutiva(
  p_funcionario_cpf CHAR(11),
  p_lote_id INTEGER
)
RETURNS TABLE(
  permitido BOOLEAN,
  motivo TEXT,
  total_inativacoes_consecutivas INTEGER,
  ultima_inativacao_lote VARCHAR(20)
) AS $$
DECLARE
  v_lote_atual_ordem INTEGER;
  v_lote_anterior_ordem INTEGER;
  v_avaliacao_anterior_status VARCHAR(20);
  v_ultima_inativacao_codigo VARCHAR(20);
  v_total_consecutivas INTEGER := 0;
  v_tem_anomalia_critica BOOLEAN := false;
  v_empresa_id INTEGER;
  v_contratante_id INTEGER;
  v_total_avaliacoes_anteriores INTEGER := 0;
BEGIN
  -- Buscar empresa_id e contratante_id do lote
  SELECT empresa_id, contratante_id INTO v_empresa_id, v_contratante_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE (anomalias.cpf = p_funcionario_cpf) AND (anomalias.prioridade = 'CRÃ TICA' OR anomalias.prioridade = 'CRITICA')
    ) INTO v_tem_anomalia_critica;
  ELSE
    v_tem_anomalia_critica := false;
  END IF;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e status da avaliacao correspondente (se existir) no mesmo contexto
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.numero_ordem = v_lote_atual_ordem - 1
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    )
  LIMIT 1;

  -- Contar inativacoes anteriores (qualquer lote anterior no contexto)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada'
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Contar numero de avaliacoes anteriores (independente de status) no contexto
  SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  IF v_total_avaliacoes_anteriores IS NULL THEN
    v_total_avaliacoes_anteriores := 0;
  END IF;

  -- Regra de negocio:
  -- 1) Se tem anomalia critica (aplicavel a empresas), permitir inativacao (flexibilizacao).
  -- 2) Se nao ha avaliacoes anteriores (funcionario recem-inserido/inscrito), permitir sem sinalizar como forcada.
  -- 3) Se já existe pelo menos 1 inativacao anterior (v_total_consecutivas >=1), sinalizar/bloquear (pode ser forcada por perfil autorizado).

  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT 
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT 
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores (possivelmente recem-inserido/inscrito). Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT 
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT 
      true AS permitido,
      'Inativacao permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_inativacao_consecutiva (CHAR(11), INTEGER) IS 'Verifica se funcionario pode ter avaliacao inativada - permite 1a inativacao para recem-inseridos; sinaliza a partir da 2a inativacao';
