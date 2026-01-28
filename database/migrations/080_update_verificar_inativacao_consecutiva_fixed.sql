-- MIGRATION 080 (FIXED): Atualizar função verificar_inativacao_consecutiva (ASCII-only)
-- Esta versao evita caracteres especiais que podem causar erros de encoding ao aplicar via psql

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
  -- Buscar empresa_id e contratante_id do lote (suporte a empresas e entidades)
  SELECT empresa_id, contratante_id INTO v_empresa_id, v_contratante_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRITICA'
    ) INTO v_tem_anomalia_critica;
  ELSE
    -- Para contratantes ainda nao aplicamos detecção de anomalias; não bloquear por anomalia
    v_tem_anomalia_critica := false;
  END IF;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e contar avaliacoes anteriores
  SELECT la.numero_ordem, a.status, la.codigo
  INTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativacoes anteriores (qualquer lote anterior), respeitando contexto (empresa ou contratante)
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

  -- Contar numero de avaliacoes anteriores (independente de status), respeitando contexto
  SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.numero_ordem < v_lote_atual_ordem
    AND (
      (v_contratante_id IS NOT NULL AND la.contratante_id = v_contratante_id)
      OR (v_contratante_id IS NULL AND la.empresa_id = v_empresa_id)
    );

  -- Se tem anomalia critica, permitir inativacao consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nao ha avaliacoes anteriores (funcionario recem-importado/inscrito), permitir sem sinalizar como forcada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores. Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2a inativacao (ja existe pelo menos 1 inativacao anterior), sinalizar como restricao
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. A partir da segunda inativacao o sistema exige justificativa detalhada.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT
      true AS permitido,
      'Inativacao permitida. Registre o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_inativacao_consecutiva (CHAR(11), INTEGER) IS 'Atualizacao: primeira avaliacao apos importacao permitida; sinalizacao a partir da 2a inativacao';