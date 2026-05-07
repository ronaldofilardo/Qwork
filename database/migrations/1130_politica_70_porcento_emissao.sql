-- Migration 1130: Nova Política de 70% para Emissão de Laudo
--
-- REGRAS DA NOVA POLÍTICA (REVISADA):
--   - Base do threshold: total_liberadas = COUNT WHERE status NOT IN ('rascunho', 'inativada')
--   - Avaliações inativadas NÃO contam no denominador do cálculo de 70%
--   - Threshold: FLOOR(0.7 * total_liberadas)
--   - Ex: 100 liberadas → 70 concluídas mínimo para lote 'concluido'
--   - Ex: 10 liberadas, 4 inativadas → 6 ativas, FLOOR(4.2) = 4 concluídas mínimo
--
-- COBRANÇA:
--   - Billing sobre total_liberadas (não sobre concluídas)
--   - Ex: 100 liberadas + 70 concluídas → cobrar 100 * valor_por_funcionario
--
-- Arquivos afetados nesta migration:
--   1. fn_recalcular_status_lote_on_avaliacao_update (trigger)
--   2. validar_lote_pre_laudo (validação pré-emissão)
--   3. calcular_valor_total_lote (cálculo do valor de cobrança)

-- ===========================================================================
-- 1. TRIGGER FUNCTION: fn_recalcular_status_lote_on_avaliacao_update
--    Ativa automaticamente o status 'concluido' quando >=70% concluídas
-- ===========================================================================
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_liberadas INTEGER;
  v_total_inativadas INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_threshold_70 INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Determinar lote_id da avaliação alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);

  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote — só processar lotes 'ativo'
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;

  -- Contar avaliações do lote (base: liberadas = status NOT IN ('rascunho', 'inativada'))
  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('rascunho', 'inativada'))::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int
  INTO
    v_total_liberadas,
    v_total_inativadas,
    v_avaliacoes_concluidas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  -- Nova política: >=FLOOR(0.7 * liberadas) concluídas, excludindo inativadas
  v_threshold_70 := FLOOR(0.7 * v_total_liberadas::NUMERIC);

  IF v_total_liberadas > 0 AND v_avaliacoes_concluidas >= v_threshold_70 THEN
    UPDATE lotes_avaliacao
    SET
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';

    RAISE NOTICE 'Lote % marcado como concluído (política 70%%): % concluídas de % liberadas (threshold: %), % inativadas',
      v_lote_id, v_avaliacoes_concluidas, v_total_liberadas, v_threshold_70, v_total_inativadas;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS
'Recalcula status do lote quando avaliação muda.
Política 70%: lote passa para "concluido" quando avaliacoes_concluidas >= FLOOR(0.7 * total_liberadas).
total_liberadas = status NOT IN (rascunho, inativada) (EXCLUI inativadas — regra de negócio revisada).
Migration 1130: reformulou política para excludir inativadas do denominador e arredondar para baixo.';


-- ===========================================================================
-- 2. VALIDATION FUNCTION: validar_lote_pre_laudo
--    Validação pré-emissão com nova política 70%
-- ===========================================================================
CREATE OR REPLACE FUNCTION validar_lote_pre_laudo(
  p_lote_id INTEGER
)
RETURNS TABLE(
  valido BOOLEAN,
  alertas TEXT[],
  funcionarios_pendentes INTEGER,
  detalhes JSONB,
  bloqueante BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_empresa_id INTEGER;
  v_numero_lote INTEGER;
  v_lote_status TEXT;
  v_total_liberadas INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_threshold_70 INTEGER;
  v_funcionarios_pendentes INTEGER := 0;
  v_alertas TEXT[] := '{}';
  v_detalhes JSONB;
  v_bloqueante BOOLEAN := FALSE;
  v_taxa_conclusao NUMERIC;
BEGIN
  -- Buscar dados do lote
  SELECT empresa_id, numero_ordem, status
  INTO v_empresa_id, v_numero_lote, v_lote_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Contar avaliações (base: liberadas = status NOT IN ('rascunho', 'inativada'))
  SELECT
    COUNT(*) FILTER (WHERE status NOT IN ('rascunho', 'inativada'))::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_total_liberadas, v_avaliacoes_concluidas, v_avaliacoes_inativadas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;

  -- Calcular threshold 70% sobre total liberadas (excludendo inativadas)
  v_threshold_70 := FLOOR(0.7 * v_total_liberadas::NUMERIC);

  -- Taxa de conclusão (sobre liberadas)
  v_taxa_conclusao := ROUND(
    (v_avaliacoes_concluidas::NUMERIC / NULLIF(v_total_liberadas, 0)) * 100,
    2
  );

  -- Alerta informativo: muitas inativações
  IF v_avaliacoes_inativadas > 0 AND v_total_liberadas > 0 THEN
    IF v_avaliacoes_inativadas > v_total_liberadas * 0.3 THEN
      v_alertas := array_append(v_alertas,
        'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' ||
        v_avaliacoes_inativadas || ' de ' || v_total_liberadas ||
        '). Verifique se há problemas sistêmicos.');
    END IF;
  END IF;

  -- Determinar bloqueios
  IF v_total_liberadas = 0 THEN
    v_alertas := array_append(v_alertas,
      'ERRO: Lote não possui avaliações liberadas. Não é possível gerar laudo.');
    v_bloqueante := TRUE;
  ELSIF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas,
      'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');
    v_bloqueante := TRUE;
  ELSIF v_avaliacoes_concluidas < v_threshold_70 THEN
    -- Abaixo de 70% — ainda não elegível
    v_alertas := array_append(v_alertas,
      'PENDENTE: ' || v_avaliacoes_concluidas || ' de ' || v_total_liberadas ||
      ' avaliações concluídas. Necessário pelo menos ' || v_threshold_70 ||
      ' (' || ROUND((v_threshold_70::NUMERIC / NULLIF(v_total_liberadas, 0)) * 100, 0) ||
      '% de ' || v_total_liberadas || ' liberadas). Atual: ' ||
      v_taxa_conclusao || '%.');
    v_bloqueante := TRUE;
  ELSE
    -- >=70% concluídas: lote elegível (deve estar em status 'concluido' via trigger)
    IF v_lote_status != 'concluido' AND v_lote_status != 'emissao_solicitada'
       AND v_lote_status != 'emissao_em_andamento' THEN
      v_alertas := array_append(v_alertas,
        'AVISO: ' || v_avaliacoes_concluidas || '/' || v_total_liberadas ||
        ' avaliações concluídas (≥70%), mas lote ainda está em status "' ||
        v_lote_status || '". Aguarde a atualização automática do sistema.');
      v_bloqueante := TRUE;
    END IF;
  END IF;

  -- Montar detalhes JSON com nova nomenclatura
  v_detalhes := jsonb_build_object(
    'lote_id', p_lote_id,
    'numero_lote', v_numero_lote,
    'lote_status', v_lote_status,
    'total_liberadas', v_total_liberadas,
    'avaliacoes_concluidas', v_avaliacoes_concluidas,
    'avaliacoes_inativadas', v_avaliacoes_inativadas,
    'threshold_70', v_threshold_70,
    'taxa_conclusao', v_taxa_conclusao,
    'politica', '70_porcento'
  );

  RETURN QUERY SELECT
    NOT v_bloqueante AS valido,
    v_alertas AS alertas,
    v_funcionarios_pendentes,
    v_detalhes AS detalhes,
    v_bloqueante AS bloqueante;
END;
$$;

COMMENT ON FUNCTION validar_lote_pre_laudo(INTEGER) IS
'Valida se lote está pronto para emissão de laudo.
Política 70%: requer avaliacoes_concluidas >= CEIL(0.7 * total_liberadas).
Total_liberadas = COUNT WHERE status != rascunho (inclui inativadas na base).
Migration 1130: substituiu política 100% (concluidas + inativadas = total).';


-- ===========================================================================
-- 3. BILLING FUNCTION: calcular_valor_total_lote
--    Cobrança sobre total_liberadas, não sobre concluídas
-- ===========================================================================
CREATE OR REPLACE FUNCTION calcular_valor_total_lote(p_lote_id integer)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_valor_por_funcionario DECIMAL(10,2);
    v_total_liberadas INTEGER;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Billing sobre total liberadas (status != 'rascunho'), não apenas concluídas
    -- Ex: 100 liberadas + 70 concluídas → cobrar 100 * valor_por_funcionario
    SELECT
        la.valor_por_funcionario,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho')::int
    INTO v_valor_por_funcionario, v_total_liberadas
    FROM lotes_avaliacao la
    LEFT JOIN avaliacoes a ON a.lote_id = la.id
    WHERE la.id = p_lote_id
    GROUP BY la.id, la.valor_por_funcionario;

    IF v_valor_por_funcionario IS NULL THEN
        RETURN NULL;
    END IF;

    v_valor_total := v_valor_por_funcionario * v_total_liberadas;

    RETURN v_valor_total;
END;
$$;

COMMENT ON FUNCTION calcular_valor_total_lote(integer) IS
'Calcula valor total de cobrança do lote.
Cobrança é sobre total_liberadas (status != rascunho), não apenas concluídas.
Política: lote com 100 liberadas cobra 100 * valor, mesmo que só 70 concluídas.
Migration 1130: substituiu base de cálculo de concluídas para liberadas.';
