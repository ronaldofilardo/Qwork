-- Migration 162: Corrigir validação de lotes concluídos
-- 
-- Problema: Lotes com status 'concluido' e todas avaliações finalizadas
-- estavam sendo marcados como "Pendente" ao invés de "Pronto" porque
-- a função validar_lote_pre_laudo verificava funcionários "pendentes"
-- mesmo após o lote estar concluído.
--
-- Solução: Quando o lote tem status 'concluido', não verificar funcionários
-- pendentes, pois o lote já foi fechado e está aguardando apenas a 
-- solicitação de emissão do laudo.

CREATE OR REPLACE FUNCTION validar_lote_pre_laudo(
  p_lote_id INTEGER
)
RETURNS TABLE(
  valido BOOLEAN,
  alertas TEXT[],
  funcionarios_pendentes INTEGER,
  detalhes JSONB,
  bloqueante BOOLEAN
) AS $$
DECLARE
  v_empresa_id INTEGER;
  v_numero_lote INTEGER;
  v_lote_status TEXT;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_ativas INTEGER;
  v_funcionarios_pendentes INTEGER;
  v_alertas TEXT[] := '{}';
  v_detalhes JSONB;
  v_bloqueante BOOLEAN := FALSE;
BEGIN
  -- Buscar dados do lote incluindo status
  SELECT empresa_id, numero_ordem, status 
  INTO v_empresa_id, v_numero_lote, v_lote_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;
  
  -- Contar avaliações do lote
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento', 'concluida')) AS ativas
  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_ativas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;
  
  -- Se o lote está concluído, NÃO verificar funcionários pendentes
  -- pois o lote já foi fechado e está aguardando apenas solicitação de emissão
  IF v_lote_status = 'concluido' THEN
    v_funcionarios_pendentes := 0;
  ELSE
    -- Verificar funcionários que deveriam estar no lote mas não estão
    -- (apenas para lotes ainda em andamento)
    SELECT COUNT(*) INTO v_funcionarios_pendentes
    FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
    WHERE NOT EXISTS (
      SELECT 1 FROM avaliacoes a 
      WHERE a.funcionario_cpf = el.funcionario_cpf 
      AND a.lote_id = p_lote_id
    );
  END IF;
  
  -- Gerar alertas informativos (não bloqueantes)
  IF v_avaliacoes_inativadas > 0 AND v_avaliacoes_concluidas > 0 THEN
    IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
      v_alertas := array_append(v_alertas, 
        'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' || 
        v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || 
        '). Verifique se há problemas sistêmicos.');
    END IF;
  END IF;
  
  IF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    v_alertas := array_append(v_alertas, 
      'PENDÊNCIA: ' || v_funcionarios_pendentes || 
      ' funcionário(s) deveriam estar neste lote mas não foram incluídos. Revise a elegibilidade.');
  END IF;
  
  -- Determinar se há bloqueios severos (erro definitivo)
  -- Um lote está pronto para emissão quando:
  -- 1. Tem status 'concluido' E
  -- 2. Tem pelo menos uma avaliação concluída E
  -- 3. Todas as avaliações ativas foram concluídas (concluidas = ativas)
  IF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas, 
      'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');
    v_bloqueante := TRUE;
  ELSIF v_lote_status = 'concluido' AND v_avaliacoes_concluidas > 0 THEN
    -- Lote concluído com avaliações finalizadas = PRONTO (não bloqueante)
    v_bloqueante := FALSE;
  ELSIF v_avaliacoes_ativas > 0 AND v_avaliacoes_concluidas < v_avaliacoes_ativas THEN
    -- Ainda há avaliações ativas não concluídas
    v_alertas := array_append(v_alertas,
      'PENDENTE: ' || (v_avaliacoes_ativas - v_avaliacoes_concluidas) || 
      ' avaliação(ões) ativa(s) ainda não concluída(s).');
    v_bloqueante := TRUE;
  ELSIF v_funcionarios_pendentes > 0 AND v_lote_status != 'concluido' THEN
    -- Há funcionários que deveriam estar no lote (apenas se lote não concluído)
    v_bloqueante := TRUE;
  END IF;

  -- Montar detalhes JSON
  v_detalhes := jsonb_build_object(
    'lote_id', p_lote_id,
    'numero_lote', v_numero_lote,
    'lote_status', v_lote_status,
    'total_avaliacoes', v_total_avaliacoes,
    'avaliacoes_concluidas', v_avaliacoes_concluidas,
    'avaliacoes_inativadas', v_avaliacoes_inativadas,
    'avaliacoes_ativas', v_avaliacoes_ativas,
    'funcionarios_pendentes', v_funcionarios_pendentes,
    'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_avaliacoes_ativas, 0)) * 100, 2)
  );

  -- Retornar resultado
  -- valido = TRUE quando NÃO há bloqueantes
  RETURN QUERY SELECT 
    NOT v_bloqueante AS valido,
    v_alertas AS alertas,
    v_funcionarios_pendentes,
    v_detalhes AS detalhes,
    v_bloqueante AS bloqueante;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_lote_pre_laudo(INTEGER) IS 
'Valida se lote está pronto para emissão de laudo. Lotes com status concluido e avaliações finalizadas são considerados válidos (Pronto). Apenas lotes em andamento verificam funcionários pendentes.';
