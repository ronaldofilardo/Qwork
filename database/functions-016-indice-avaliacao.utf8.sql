-- FUNCTIONS 016: Funcoes de Negocio para Sistema de Indice de Avaliacao
-- Implementa logica centralizada para elegibilidade, validacoes e anomalias

-- ==========================================
-- 1. FUNÃ‡ÃƒO: CALCULAR ELEGIBILIDADE PARA LOTE
-- ==========================================

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
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - f.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'Mais de 1 ano sem avaliacao'
      ELSE 'RenovaÃ§Ã£o regular'
    END AS motivo_inclusao,
    f.indice_avaliacao AS indice_atual,
    f.data_ultimo_lote,
    CASE 
      WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    CASE 
      WHEN f.indice_avaliacao = 0 THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 2 THEN 'CRITICA'
      WHEN f.data_ultimo_lote < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN f.indice_avaliacao < p_numero_lote_atual - 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END AS prioridade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND (
      -- CritÃ©rio 1: FuncionÃ¡rio novo (Ã­ndice 0)
      f.indice_avaliacao = 0
      OR
      -- CritÃ©rio 2: Ãndice incompleto (faltou lote anterior)
      f.indice_avaliacao < p_numero_lote_atual - 1
      OR
      -- CritÃ©rio 3: Mais de 1 ano sem avaliaÃ§Ã£o
      (f.data_ultimo_lote IS NULL OR f.data_ultimo_lote < NOW() - INTERVAL '1 year')
    )
  ORDER BY 
    -- Ordenar por prioridade: CRITICA > ALTA > MEDIA > NORMAL
    CASE prioridade
      WHEN 'CRITICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MEDIA' THEN 3
      ELSE 4
    END,
    f.indice_avaliacao ASC, -- Mais atrasados primeiro
    f.nome ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_elegibilidade_lote (INTEGER, INTEGER) IS 'Calcula quais funcionÃ¡rios devem ser incluÃ­dos no prÃ³ximo lote com base em Ã­ndice, data (>1 ano) e novos funcionÃ¡rios';

-- ==========================================
-- 2. FUNÃ‡ÃƒO: VERIFICAR INATIVAÃ‡ÃƒO CONSECUTIVA
-- ==========================================

-- Remover versÃµes antigas com assinaturas diferentes antes de recriar
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

  -- Verificar se funcionÃ¡rio tem anomalias crÃ­ticas (aplica apenas para empresas por enquanto)
  IF v_contratante_id IS NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
      WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRITICA'
    ) INTO v_tem_anomalia_critica;
  ELSE
    -- Para contratantes ainda nÃ£o aplicamos detecÃ§Ã£o de anomalias; nÃ£o bloquear por anomalia
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

  -- Contar inativaÃ§Ãµes anteriores (qualquer lote anterior no contexto)
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

  -- Contar nÃºmero de avaliaÃ§Ãµes anteriores (independente de status) no contexto
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
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. ' ||
      'Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nÃ£o hÃ¡ avaliaÃ§Ãµes anteriores (funcionÃ¡rio recÃ©m-importado/inscrito), permitir sem sinalizar como forÃ§ada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT 
      true AS permitido,
      'PERMITIDO: FuncionÃ¡rio sem avaliaÃ§Ãµes anteriores (possivelmente recÃ©m-importado/inscrito). InativaÃ§Ã£o do primeiro lote Ã© permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2Âª inativaÃ§Ã£o (ou seja, jÃ¡ existe pelo menos 1 inativaÃ§Ã£o anterior), sinalizar como restriÃ§Ã£o (pode ser forÃ§ada)
  ELSIF v_total_consecutivas >= 1 THEN
    RETURN QUERY SELECT 
      false AS permitido,
      'ATENCAO: Este funcionario ja tem ' || v_total_consecutivas || ' inativacao(oes) anteriores. ' ||
      'A partir da segunda inativacao, o sistema exige justificativa detalhada e registro de auditoria (inativacao forcada).' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  ELSE
    RETURN QUERY SELECT 
      true AS permitido,
      'InativaÃ§Ã£o permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_inativacao_consecutiva (CHAR(11), INTEGER) IS 'Verifica se funcionÃ¡rio pode ter avaliaÃ§Ã£o inativada (impede 2Âª consecutiva)';

-- ==========================================
-- 3. FUNÃ‡ÃƒO: DETECTAR ANOMALIAS NO ÃNDICE
-- ==========================================

-- Remover versoes antigas antes de recriar com nova assinatura
DROP FUNCTION IF EXISTS detectar_anomalias_indice(integer) CASCADE;

CREATE OR REPLACE FUNCTION detectar_anomalias_indice(
  p_empresa_id INTEGER
)
RETURNS TABLE(
  funcionario_cpf CHAR(11),
  funcionario_nome VARCHAR(100),
  tipo_anomalia VARCHAR(50),
  detalhes TEXT,
  severidade VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  
  -- Anomalia 1: Mais de 3 inativaÃ§Ãµes consecutivas (padrÃ£o suspeito)
  SELECT 
    f.cpf,
    f.nome,
    'INATIVAÃ‡Ã•ES CONSECUTIVAS' AS tipo_anomalia,
    'FuncionÃ¡rio tem ' || COUNT(a.id) || ' inativaÃ§Ãµes consecutivas nos Ãºltimos lotes. ' ||
    'PossÃ­vel padrÃ£o de desistÃªncia ou problemas sistÃªmicos.' AS detalhes,
    'CRITICA' AS severidade
  FROM funcionarios f
  JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE 
    f.empresa_id = p_empresa_id
    AND a.status = 'inativada'
    AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
  GROUP BY f.cpf, f.nome
  HAVING COUNT(a.id) >= 3
  
  UNION ALL
  
  -- Anomalia 2: Ãndice muito atrasado (>5 lotes de diferenÃ§a)
  SELECT 
    f.cpf,
    f.nome,
    'ÃNDICE ATRASADO' AS tipo_anomalia,
    'FuncionÃ¡rio tem Ã­ndice ' || f.indice_avaliacao || ' mas o lote atual Ã© ' || 
    (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) || '. ' ||
    'DiferenÃ§a de ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) || ' lotes.' AS detalhes,
    CASE 
      WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10 THEN 'CRÃTICA'
      WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5 THEN 'ALTA'
      ELSE 'MÃ‰DIA'
    END AS severidade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao > 0
    AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5
  
  UNION ALL
  
  -- Anomalia 3: Mais de 2 anos sem avaliaÃ§Ã£o (violaÃ§Ã£o crÃ­tica)
  SELECT 
    f.cpf,
    f.nome,
    'PRAZO EXCEDIDO' AS tipo_anomalia,
'Funcionario esta ha ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliacao valida. ' ||
    'Violacao critica da obrigatoriedade de renovacao anual.' AS detalhes,
    'CRITICA' AS severidade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.data_ultimo_lote IS NOT NULL
    AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'
  
  UNION ALL
  
  -- Anomalia 4: FuncionÃ¡rio ativo com Ã­ndice 0 por muito tempo (>6 meses)
  SELECT 
    f.cpf,
    f.nome,
    'NUNCA AVALIADO' AS tipo_anomalia,
    'Funcionario esta ha ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliacao. ' ||
    'Pode indicar erro no processo de liberacao de lotes.' AS detalhes,
    'ALTA' AS severidade
  FROM funcionarios f
  WHERE 
    f.empresa_id = p_empresa_id
    AND f.ativo = true
    AND f.indice_avaliacao = 0
    AND f.criado_em < NOW() - INTERVAL '6 months'
  
  ORDER BY 
    CASE 
      WHEN severidade = 'CRÃTICA' THEN 1
      WHEN severidade = 'ALTA' THEN 2
      WHEN severidade = 'MÃ‰DIA' THEN 3
      ELSE 4
    END,
    funcionario_nome;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detectar_anomalias_indice (INTEGER) IS 'Detecta padroes suspeitos no historico de avaliacoes (>3 faltas, indice atrasado, >2 anos sem avaliacao)';

-- ==========================================
-- 4. FUNÃ‡ÃƒO: CHECK PRÃ‰-LAUDO (Validar Ãndice Completo)
-- ==========================================

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
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_funcionarios_pendentes INTEGER;
  v_alertas TEXT[] := '{}';
  v_detalhes JSONB;
  v_bloqueante BOOLEAN := FALSE;
BEGIN
  -- Buscar dados do lote
  SELECT empresa_id, numero_ordem INTO v_empresa_id, v_numero_lote
  FROM lotes_avaliacao
  WHERE id = p_lote_id;
  
  -- Contar avaliaÃ§Ãµes do lote
  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas
  INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas
  FROM avaliacoes
  WHERE lote_id = p_lote_id;
  
  -- Verificar funcionÃ¡rios que deveriam estar no lote mas nÃ£o estÃ£o
  SELECT COUNT(*) INTO v_funcionarios_pendentes
  FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
  WHERE NOT EXISTS (
    SELECT 1 FROM avaliacoes a 
    WHERE a.funcionario_cpf = el.funcionario_cpf 
    AND a.lote_id = p_lote_id
  );
  
  -- Gerar alertas
  IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
    v_alertas := array_append(v_alertas, 'ATENÃ‡ÃƒO: Mais de 30% das avaliaÃ§Ãµes foram inativadas (' || v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || '). Verifique se hÃ¡ problemas sistÃªmicos.');
  END IF;
  
  IF v_funcionarios_pendentes > 0 THEN
    v_alertas := array_append(v_alertas, 'PENDÃŠNCIA: ' || v_funcionarios_pendentes || ' funcionÃ¡rio(s) deveriam estar neste lote mas nÃ£o foram incluÃ­dos. Revise a elegibilidade.');
  END IF;
  
  IF v_avaliacoes_concluidas = 0 THEN
    v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliaÃ§Ã£o concluÃ­da neste lote. NÃ£o Ã© possÃ­vel gerar laudo.');
  END IF;
  
  -- Montar detalhes JSON
  v_detalhes := jsonb_build_object(
    'lote_id', p_lote_id,
    'numero_lote', v_numero_lote,
    'total_avaliacoes', v_total_avaliacoes,
    'avaliacoes_concluidas', v_avaliacoes_concluidas,
    'avaliacoes_inativadas', v_avaliacoes_inativadas,
    'funcionarios_pendentes', v_funcionarios_pendentes,
    'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_total_avaliacoes, 0)) * 100, 2)
  );
  
  -- Determinar se hÃ¡ bloqueios severos (erro definitivo)
  IF v_avaliacoes_concluidas = 0 OR v_funcionarios_pendentes > 0 THEN
    v_bloqueante := TRUE;
  END IF;

  -- Retornar resultado (bloqueante = errors que impedem emissÃ£o)
  RETURN QUERY SELECT 
    NOT v_bloqueante AS valido,
    v_alertas AS alertas,
    v_funcionarios_pendentes,
    v_detalhes AS detalhes,
    v_bloqueante AS bloqueante;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_lote_pre_laudo (INTEGER) IS 'Valida se lote estÃ¡ pronto para laudo (Ã­ndice completo); retorna alertas e mÃ©tricas (anomalias reportadas como alertas, NÃƒO bloqueantes)';

-- ==========================================
-- 5. VERIFICAÃ‡Ã•ES E TESTES
-- ==========================================

-- Verificar se funÃ§Ãµes foram criadas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname IN (
      'calcular_elegibilidade_lote',
      'verificar_inativacao_consecutiva',
      'detectar_anomalias_indice',
      'validar_lote_pre_laudo',
      'obter_proximo_numero_ordem'
    );

    IF v_count < 4 THEN
        RAISE EXCEPTION 'Erro: Nem todas as funÃ§Ãµes foram criadas (esperado: 5, encontrado: %)', v_count;
    END IF;

    RAISE NOTICE 'FUNCTIONS 016 CONCLUÃDAS COM SUCESSO!';
    RAISE NOTICE 'FunÃ§Ãµes criadas: calcular_elegibilidade_lote, verificar_inativacao_consecutiva, detectar_anomalias_indice, validar_lote_pre_laudo, obter_proximo_numero_ordem';
END $$;