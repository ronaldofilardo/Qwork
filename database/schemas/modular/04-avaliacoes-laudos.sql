-- ============================================================================
-- 04-avaliacoes-laudos.sql
-- Avaliações, respostas, lotes, laudos, emissão, fila de emissão
-- Depends on: 01-foundation.sql, 02-identidade.sql, 03-entidades-comercial.sql
-- ============================================================================

--
-- Name: atualizar_ultima_avaliacao_funcionario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_ultima_avaliacao_funcionario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_empresa_id INTEGER;
  v_entidade_id INTEGER;
  v_lote_numero INTEGER;
BEGIN
  -- Buscar empresa_id e entidade_id do lote
  SELECT la.empresa_id, la.entidade_id, la.numero_ordem
  INTO v_empresa_id, v_entidade_id, v_lote_numero
  FROM lotes_avaliacao la
  WHERE la.id = NEW.lote_id;

  -- 1. Sempre atualizar o registro global em funcionarios (compatibilidade)
  UPDATE funcionarios
  SET 
    ultima_avaliacao_id = NEW.id,
    ultima_avaliacao_data_conclusao = COALESCE(NEW.envio, NEW.inativada_em),
    ultima_avaliacao_status = NEW.status,
    atualizado_em = NOW()
  WHERE cpf = NEW.funcionario_cpf
    AND (
      ultima_avaliacao_data_conclusao IS NULL 
      OR COALESCE(NEW.envio, NEW.inativada_em) > ultima_avaliacao_data_conclusao
      OR (COALESCE(NEW.envio, NEW.inativada_em) = ultima_avaliacao_data_conclusao AND NEW.id > ultima_avaliacao_id)
    );

  -- 2. Atualizar indice_avaliacao e data_ultimo_lote no vinculo correto
  IF v_empresa_id IS NOT NULL THEN
    -- Lote de empresa (via clinica)
    UPDATE funcionarios_clinicas fc
    SET 
      indice_avaliacao = COALESCE(v_lote_numero, fc.indice_avaliacao),
      data_ultimo_lote = COALESCE(NEW.envio, NEW.inativada_em, NOW()),
      atualizado_em = NOW()
    FROM funcionarios f
    WHERE fc.funcionario_id = f.id
      AND f.cpf = NEW.funcionario_cpf
      AND fc.empresa_id = v_empresa_id
      AND fc.ativo = true
      AND (
        fc.indice_avaliacao IS NULL
        OR fc.indice_avaliacao = 0
        OR v_lote_numero > fc.indice_avaliacao
      );
  END IF;

  IF v_entidade_id IS NOT NULL THEN
    -- Lote de entidade
    UPDATE funcionarios_entidades fe
    SET 
      indice_avaliacao = COALESCE(v_lote_numero, fe.indice_avaliacao),
      data_ultimo_lote = COALESCE(NEW.envio, NEW.inativada_em, NOW()),
      atualizado_em = NOW()
    FROM funcionarios f
    WHERE fe.funcionario_id = f.id
      AND f.cpf = NEW.funcionario_cpf
      AND fe.entidade_id = v_entidade_id
      AND fe.ativo = true
      AND (
        fe.indice_avaliacao IS NULL
        OR fe.indice_avaliacao = 0
        OR v_lote_numero > fe.indice_avaliacao
      );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_ultima_avaliacao_funcionario() OWNER TO postgres;


--
-- Name: FUNCTION atualizar_ultima_avaliacao_funcionario(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.atualizar_ultima_avaliacao_funcionario() IS 'Atualiza dados de ultima avaliacao no funcionario E no vinculo (per-empresa/entidade). Migration 1106.';



--
-- Name: audit_laudo_creation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_laudo_creation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO audit_logs (action, resource, resource_id, new_data)
  VALUES (
    'laudo_criado',
    'laudos',
    NEW.id::TEXT,
    jsonb_build_object(
      'lote_id', NEW.lote_id,
      'status', NEW.status,
      'tamanho_pdf', LENGTH(NEW.relatorio_lote)
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_laudo_creation() OWNER TO postgres;


--
-- Name: FUNCTION audit_laudo_creation(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_laudo_creation() IS 'Audita criação de laudos usando a coluna relatorio_lote para tamanho do PDF';



--
-- Name: audit_lote_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_lote_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em THEN

      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        COALESCE(current_setting('app.current_user_cpf', true), 'system'),
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
          'mudancas', jsonb_build_object(
            'status_anterior', OLD.status,
            'status_novo', NEW.status
          )
        ),
        NULLIF(current_setting('app.client_ip', true), '')::inet
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION public.audit_lote_change() OWNER TO postgres;


--
-- Name: FUNCTION audit_lote_change(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_lote_change() IS 'Trigger de auditoria para lotes - ID-only (sem codigo/titulo/emergencia)';



--
-- Name: audit_lote_status_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_lote_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_data, new_data)
    VALUES (
      'lote_status_change',
      'lotes_avaliacao',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.audit_lote_status_change() OWNER TO postgres;


--
-- Name: FUNCTION audit_lote_status_change(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.audit_lote_status_change() IS 'Funcao de auditoria de mudanca de status de lote';



--
-- Name: calcular_hash_pdf(bytea); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_hash_pdf(pdf_data bytea) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN encode(digest(pdf_data, 'sha256'), 'hex');
END;
$$;


ALTER FUNCTION public.calcular_hash_pdf(pdf_data bytea) OWNER TO postgres;


--
-- Name: FUNCTION calcular_hash_pdf(pdf_data bytea); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_hash_pdf(pdf_data bytea) IS 'Calcula hash SHA-256 de um PDF em formato BYTEA';



--
-- Name: calcular_valor_total_lote(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_valor_total_lote(p_lote_id integer) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_valor_por_funcionario DECIMAL(10,2);
    v_num_avaliacoes INTEGER;
    v_valor_total DECIMAL(10,2);
BEGIN
    -- Buscar valor por funcionário e contar avaliações concluídas
    SELECT 
        la.valor_por_funcionario,
        COUNT(a.id)
    INTO v_valor_por_funcionario, v_num_avaliacoes
    FROM lotes_avaliacao la
    LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
    WHERE la.id = p_lote_id
    GROUP BY la.id, la.valor_por_funcionario;
    
    -- Se não encontrou o lote ou não há valor definido, retornar NULL
    IF v_valor_por_funcionario IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calcular valor total
    v_valor_total := v_valor_por_funcionario * v_num_avaliacoes;
    
    RETURN v_valor_total;
END;
$$;


ALTER FUNCTION public.calcular_valor_total_lote(p_lote_id integer) OWNER TO postgres;


--
-- Name: check_laudo_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_laudo_immutability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Permitir INSERT sempre
  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  END IF;

  -- Para UPDATE, verificar se o laudo foi emitido
  IF (TG_OP = 'UPDATE' AND OLD.emitido_em IS NOT NULL) THEN
    -- Permitir atualização APENAS do hash_pdf quando está NULL ou vazio
    -- E apenas se nenhum outro campo foi alterado
    IF (OLD.hash_pdf IS NULL OR OLD.hash_pdf = '') AND
       (NEW.hash_pdf IS NOT NULL AND NEW.hash_pdf != '') AND
       -- Verificar que NENHUM outro campo mudou
       OLD.lote_id = NEW.lote_id AND
       OLD.emissor_cpf = NEW.emissor_cpf AND
       OLD.status = NEW.status AND
       OLD.observacoes = NEW.observacoes AND
       (OLD.emitido_em = NEW.emitido_em OR (OLD.emitido_em IS NULL AND NEW.emitido_em IS NULL)) AND
       (OLD.enviado_em = NEW.enviado_em OR (OLD.enviado_em IS NULL AND NEW.enviado_em IS NULL)) THEN
      -- Permitir apenas esta atualização específica
      RETURN NEW;
    END IF;

    -- Qualquer outra tentativa de modificação é bloqueada
    RAISE EXCEPTION 'Não é permitido modificar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  -- DELETE não é permitido para laudos emitidos
  IF (TG_OP = 'DELETE' AND OLD.emitido_em IS NOT NULL) THEN
    RAISE EXCEPTION 'Não é permitido deletar laudos já emitidos. Laudo ID: %', OLD.id
      USING HINT = 'Laudos emitidos são imutáveis para garantir integridade documental.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_laudo_immutability() OWNER TO postgres;


--
-- Name: FUNCTION check_laudo_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_laudo_immutability() IS 'Garante imutabilidade de laudos emitidos, exceto para backfill do hash_pdf quando NULL';



--
-- Name: check_resposta_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_resposta_immutability() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Respostas de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_resposta_immutability() OWNER TO postgres;


--
-- Name: FUNCTION check_resposta_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída';



--
-- Name: check_resultado_immutability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_resultado_immutability() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Resultados de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = NEW.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido adicionar resultados a avaliações já concluídas. Avaliação ID: %', NEW.avaliacao_id
        USING HINT = 'Finalize a avaliação antes de tentar adicionar resultados novamente.', ERRCODE = '23506';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_resultado_immutability() OWNER TO postgres;


--
-- Name: FUNCTION check_resultado_immutability(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.check_resultado_immutability() IS 'Bloqueia modificações/inserções em resultados quando avaliação está concluída';



--
-- Name: detectar_anomalia_score(numeric, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.detectar_anomalia_score(p_score numeric, p_tipo character varying, p_grupo integer) RETURNS TABLE(is_anomalous boolean, reason text, adjusted_score numeric)
    LANGUAGE plpgsql
    AS $$

BEGIN

    -- Scores fora do range válido (0-100)

    IF p_score < 0 OR p_score > 100 THEN

        RETURN QUERY SELECT true, 'Score fora do intervalo válido', GREATEST(0, LEAST(100, p_score));

        RETURN;

    END IF;

    

    -- Scores negativos em escalas positivas

    IF p_score < 0 AND p_tipo = 'positiva' THEN

        RETURN QUERY SELECT true, 'Score negativo em escala positiva', 0::DECIMAL;

        RETURN;

    END IF;

    

    -- Padrões suspeitos (todas respostas iguais)

    IF p_score IN (0, 25, 50, 75, 100) THEN

        RETURN QUERY SELECT true, 'Possível padrão de resposta uniforme', p_score;

        RETURN;

    END IF;

    

    -- Grupos específicos

    IF p_grupo = 8 AND p_score > 0 THEN

        RETURN QUERY SELECT true, 'Comportamentos ofensivos detectados', GREATEST(p_score, 25);

        RETURN;

    END IF;

    

    -- Score normal

    RETURN QUERY SELECT false, 'Score normal'::TEXT, p_score;

END;

$$;


ALTER FUNCTION public.detectar_anomalia_score(p_score numeric, p_tipo character varying, p_grupo integer) OWNER TO postgres;


--
-- Name: detectar_anomalias_indice(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) RETURNS TABLE(cpf character, nome character varying, setor character varying, indice_avaliacao integer, data_ultimo_lote timestamp without time zone, dias_desde_ultima_avaliacao integer, prioridade character varying, categoria_anomalia character varying, mensagem text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH anomalias_com_prioridade AS (
    SELECT
      anomalias.*,
      -- Atribuir peso para ordenação por prioridade (menor número = mais crítico)
      CASE anomalias.categoria_anomalia
        WHEN 'NUNCA_AVALIADO' THEN 1
        WHEN 'MUITAS_INATIVACOES' THEN 2
        WHEN 'MAIS_DE_2_ANOS_SEM_AVALIACAO' THEN 3
        WHEN 'MAIS_DE_1_ANO_SEM_AVALIACAO' THEN 4
        WHEN 'INDICE_MUITO_ATRASADO' THEN 5
        ELSE 6
      END AS peso_prioridade
    FROM (
-- Anomalia 1: Nunca avaliado (>6 meses) OU teve avaliações liberadas mas nunca concluiu nenhuma
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.indice_avaliacao,
        f.data_ultimo_lote,
        CASE
          WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
          ELSE EXTRACT(DAY FROM NOW() - f.criado_em)::INTEGER
        END AS dias_desde_ultima_avaliacao,
        'ALTA'::VARCHAR(20) AS prioridade,
        'NUNCA_AVALIADO'::VARCHAR(50) AS categoria_anomalia,
        CASE
          WHEN EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) THEN
            'Funcionário teve ' || (SELECT COUNT(*) FROM avaliacoes WHERE funcionario_cpf = f.cpf) || ' avaliações liberadas mas nunca concluiu nenhuma. Todas foram inativadas.'
          ELSE
            'Funcionário ativo há ' || ROUND(EXTRACT(DAY FROM NOW() - f.criado_em) / 30.0, 1) || ' meses sem realizar primeira avaliação.'
        END AS mensagem
      FROM funcionarios f
      WHERE
        f.empresa_id = p_empresa_id
        AND f.ativo = true
        AND (
          -- Nunca teve avaliações liberadas E foi criado há mais de 6 meses
          (f.criado_em < NOW() - INTERVAL '6 months' AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf))
          OR
          -- Teve avaliações liberadas mas nunca concluiu nenhuma
          (EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf) AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluido'))
        )

        UNION ALL

        -- Anomalia 2: Mais de 1 ano sem avaliação
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
          'ALTA'::VARCHAR(20) AS prioridade,
          'MAIS_DE_1_ANO_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida.' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '1 year'
          AND f.data_ultimo_lote >= NOW() - INTERVAL '2 years'

        UNION ALL

        -- Anomalia 3: Mais de 2 anos sem avaliação
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER AS dias_desde_ultima_avaliacao,
          'CRÍTICA'::VARCHAR(20) AS prioridade,
          'MAIS_DE_2_ANOS_SEM_AVALIACAO'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário está há ' || ROUND(EXTRACT(DAY FROM NOW() - f.data_ultimo_lote) / 365.0, 1) || ' anos sem avaliação válida. Violação crítica!' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.data_ultimo_lote IS NOT NULL
          AND f.data_ultimo_lote < NOW() - INTERVAL '2 years'

        UNION ALL

        -- Anomalia 4: Índice muito atrasado (>5 lotes)
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          CASE
            WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
            ELSE NULL
          END AS dias_desde_ultima_avaliacao,
          CASE
            WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 10 THEN 'CRÍTICA'::VARCHAR(20)
            WHEN ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) > 5 THEN 'ALTA'::VARCHAR(20)
            ELSE 'MÉDIA'::VARCHAR(20)
          END AS prioridade,
          'INDICE_MUITO_ATRASADO'::VARCHAR(50) AS categoria_anomalia,
          'Índice atual: ' || f.indice_avaliacao || ', Lote atual: ' || (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) ||
          ' (Diferença: ' || ((SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - f.indice_avaliacao) || ' lotes)' AS mensagem
        FROM funcionarios f
        WHERE
          f.empresa_id = p_empresa_id
          AND f.ativo = true
          AND f.indice_avaliacao > 0
          AND f.indice_avaliacao < (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 5

        UNION ALL

        -- Anomalia 5: Muitas inativações (>3 nos últimos lotes)
        SELECT
          f.cpf,
          f.nome,
          f.setor,
          f.indice_avaliacao,
          f.data_ultimo_lote,
          CASE
            WHEN f.data_ultimo_lote IS NOT NULL THEN EXTRACT(DAY FROM NOW() - f.data_ultimo_lote)::INTEGER
            ELSE NULL
          END AS dias_desde_ultima_avaliacao,
          'CRÍTICA'::VARCHAR(20) AS prioridade,
          'MUITAS_INATIVACOES'::VARCHAR(50) AS categoria_anomalia,
          'Funcionário tem ' || COUNT(a.id) || ' inativações nos últimos lotes. Possível padrão suspeito.' AS mensagem
        FROM funcionarios f
        JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
        JOIN lotes_avaliacao la ON a.lote_id = la.id
        WHERE
          f.empresa_id = p_empresa_id
          AND a.status = 'inativada'
          AND la.numero_ordem >= (SELECT MAX(numero_ordem) FROM lotes_avaliacao WHERE empresa_id = p_empresa_id) - 3
        GROUP BY f.cpf, f.nome, f.setor, f.indice_avaliacao, f.data_ultimo_lote
        HAVING COUNT(a.id) >= 3
    ) anomalias
  ),
  -- Selecionar apenas a anomalia mais crítica por funcionário
  anomalias_deduplicadas AS (
    SELECT DISTINCT ON (anomalias_com_prioridade.cpf)
      anomalias_com_prioridade.cpf,
      anomalias_com_prioridade.nome,
      anomalias_com_prioridade.setor,
      anomalias_com_prioridade.indice_avaliacao,
      anomalias_com_prioridade.data_ultimo_lote,
      anomalias_com_prioridade.dias_desde_ultima_avaliacao,
      anomalias_com_prioridade.prioridade,
      anomalias_com_prioridade.categoria_anomalia,
      anomalias_com_prioridade.mensagem
    FROM anomalias_com_prioridade
    ORDER BY anomalias_com_prioridade.cpf, anomalias_com_prioridade.peso_prioridade ASC -- Menor peso = mais crítico primeiro
  )
  SELECT
    ad.cpf,
    ad.nome,
    ad.setor,
    ad.indice_avaliacao,
    ad.data_ultimo_lote,
    ad.dias_desde_ultima_avaliacao,
    ad.prioridade,
    ad.categoria_anomalia,
    ad.mensagem
  FROM anomalias_deduplicadas ad
  ORDER BY
    CASE ad.prioridade
      WHEN 'CRÍTICA' THEN 1
      WHEN 'ALTA' THEN 2
      WHEN 'MÉDIA' THEN 3
      ELSE 4
    END,
    ad.dias_desde_ultima_avaliacao DESC NULLS FIRST,
    ad.nome ASC;
END;
$$;


ALTER FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) OWNER TO postgres;


--
-- Name: FUNCTION detectar_anomalias_indice(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.detectar_anomalias_indice(p_empresa_id integer) IS 'Detecta anomalias no sistema de avaliação, removendo duplicatas e priorizando anomalias mais críticas';



--
-- Name: diagnosticar_lote_emissao(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) RETURNS TABLE(campo text, valor text, status_ok boolean, mensagem text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote RECORD;
  v_avaliacoes RECORD;
BEGIN
  -- Buscar dados do lote
  SELECT * INTO v_lote FROM lotes_avaliacao WHERE id = p_lote_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'lote'::TEXT, 'NOT_FOUND'::TEXT, false, 'Lote nÃ£o encontrado'::TEXT;
    RETURN;
  END IF;

  -- Buscar estatÃ­sticas de avaliaÃ§Ãµes
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO v_avaliacoes
  FROM avaliacoes WHERE lote_id = p_lote_id;

  -- Retornar diagnÃ³stico
  RETURN QUERY SELECT 'status'::TEXT, v_lote.status::TEXT, true, 'Status do lote'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_total'::TEXT, v_avaliacoes.total::TEXT, v_avaliacoes.total > 0, 'Total de avaliaÃ§Ãµes'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_concluidas'::TEXT, v_avaliacoes.concluidas::TEXT, v_avaliacoes.concluidas > 0, 'AvaliaÃ§Ãµes concluÃ­das'::TEXT;
  RETURN QUERY SELECT 'avaliacoes_pendentes'::TEXT, v_avaliacoes.pendentes::TEXT, v_avaliacoes.pendentes = 0, 'AvaliaÃ§Ãµes pendentes'::TEXT;
  RETURN QUERY SELECT 'emitido_em'::TEXT, COALESCE(v_lote.emitido_em::TEXT, 'NULL'), v_lote.emitido_em IS NOT NULL, 'Data de emissÃ£o'::TEXT;
  RETURN QUERY SELECT 'enviado_em'::TEXT, COALESCE(v_lote.enviado_em::TEXT, 'NULL'), v_lote.enviado_em IS NOT NULL, 'Data de envio'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_agendado'::TEXT, v_lote.auto_emitir_agendado::TEXT, v_lote.auto_emitir_agendado, 'Flag de agendamento'::TEXT;
  RETURN QUERY SELECT 'auto_emitir_em'::TEXT, COALESCE(v_lote.auto_emitir_em::TEXT, 'NULL'), v_lote.auto_emitir_em IS NOT NULL, 'Data agendada'::TEXT;
  RETURN QUERY SELECT 'cancelado_auto'::TEXT, COALESCE(v_lote.cancelado_automaticamente::TEXT, 'false'), NOT COALESCE(v_lote.cancelado_automaticamente, false), 'Cancelamento automÃ¡tico'::TEXT;
  
  RETURN;
END;
$$;


ALTER FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION diagnosticar_lote_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.diagnosticar_lote_emissao(p_lote_id integer) IS 'FunÃ§Ã£o de diagnÃ³stico para depuraÃ§Ã£o de problemas de emissÃ£o';



--
-- Name: fn_buscar_solicitante_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) RETURNS TABLE(cpf character varying, nome character varying, perfil character varying, solicitado_em timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fe.solicitado_por,
        COALESCE(
            f.nome, 
            cs.nome, 
            'Usuário Desconhecido'
        ) AS nome,
        fe.tipo_solicitante,
        fe.solicitado_em
    FROM laudos l
    INNER JOIN fila_emissao fe ON l.lote_id = fe.lote_id
    LEFT JOIN funcionarios f ON fe.solicitado_por = f.cpf
    LEFT JOIN contratantes_senhas cs ON fe.solicitado_por = cs.cpf
    WHERE l.id = p_laudo_id
    AND fe.solicitado_por IS NOT NULL;
END;
$$;


ALTER FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) OWNER TO postgres;


--
-- Name: FUNCTION fn_buscar_solicitante_laudo(p_laudo_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_buscar_solicitante_laudo(p_laudo_id integer) IS 'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';



--
-- Name: fn_next_lote_id(); Type: FUNCTION; Schema: public; Owner: postgres
-- Updated: migration 1142 (05/04/2026) — NULL-guard + GREATEST() anti-collision
--

CREATE FUNCTION public.fn_next_lote_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_next          bigint;
  v_max_existing  bigint;
  v_retries       int := 0;
  v_max_retries   int := 5;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;

  LOOP
    UPDATE lote_id_allocator
       SET last_id = GREATEST(last_id + 1, v_max_existing + 1)
    RETURNING last_id INTO v_next;

    IF v_next IS NULL THEN
      IF v_retries > 0 THEN
        RAISE EXCEPTION '[fn_next_lote_id] lote_id_allocator vazia mesmo após tentativa de inicialização. '
                        'Execute: INSERT INTO lote_id_allocator (last_id) SELECT COALESCE(MAX(id),0) FROM lotes_avaliacao;';
      END IF;
      INSERT INTO lote_id_allocator (last_id)
        SELECT COALESCE(MAX(id), 0) FROM lotes_avaliacao;
      v_retries := v_retries + 1;
      CONTINUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM lotes_avaliacao WHERE id = v_next) THEN
      RETURN v_next;
    END IF;

    v_retries := v_retries + 1;
    IF v_retries >= v_max_retries THEN
      RAISE EXCEPTION '[fn_next_lote_id] Falha ao gerar ID único após % tentativas (último candidato: %)',
        v_max_retries, v_next;
    END IF;
    RAISE WARNING '[fn_next_lote_id] Colisão no ID %. Tentativa % de %', v_next, v_retries, v_max_retries;
    SELECT COALESCE(MAX(id), 0) INTO v_max_existing FROM lotes_avaliacao;
  END LOOP;
END;
$$;


ALTER FUNCTION public.fn_next_lote_id() OWNER TO postgres;


--
-- Name: fn_obter_solicitacao_emissao(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) RETURNS TABLE(lote_id integer, solicitado_por character varying, tipo_solicitante character varying, solicitado_em timestamp without time zone, tentativas integer, erro text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.lote_id,
    al.solicitado_por,
    al.tipo_solicitante,
    al.criado_em as solicitado_em,
    al.tentativas,
    al.erro
  FROM auditoria_laudos al
  WHERE al.lote_id = p_lote_id
    AND al.acao = 'solicitar_emissao'
  ORDER BY al.criado_em DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION fn_obter_solicitacao_emissao(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_obter_solicitacao_emissao(p_lote_id integer) IS 'Busca a última solicitação de emissão para um lote específico';



--
-- Name: fn_recalcular_status_lote_on_avaliacao_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliação que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se não tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- Só processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliações do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO
    v_total_avaliacoes,
    v_avaliacoes_concluidas,
    v_avaliacoes_inativadas,
    v_avaliacoes_pendentes
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se todas as avaliações (exceto as inativadas) foram concluídas:
  --   → Marcar lote como 'concluido'
  --   → NÃO agendar emissão (100% MANUAL)
  IF v_avaliacoes_pendentes = 0 
     AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes 
     AND v_avaliacoes_concluidas > 0 THEN
    
    UPDATE lotes_avaliacao
    SET 
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Evitar update desnecessário
    
    RAISE NOTICE 'Lote % marcado como concluído (MANUAL): % concluídas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() OWNER TO postgres;


--
-- Name: FUNCTION fn_recalcular_status_lote_on_avaliacao_update(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update() IS 'Recalcula status do lote quando avaliação muda.
APENAS atualiza status para "concluido" quando todas avaliações são concluídas.
NÃO agenda emissão automática - emissor deve processar MANUALMENTE.';



--
-- Name: fn_registrar_solicitacao_emissao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_registrar_solicitacao_emissao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Quando lote muda para 'emissao_solicitada', registrar na auditoria
  IF OLD.status != 'emissao_solicitada' AND NEW.status = 'emissao_solicitada' THEN
    -- Verificar se já existe registro recente (últimos 5 minutos)
    IF NOT EXISTS (
      SELECT 1 FROM auditoria_laudos
      WHERE lote_id = NEW.id
        AND acao = 'solicitar_emissao'
        AND criado_em > NOW() - INTERVAL '5 minutes'
    ) THEN
      INSERT INTO auditoria_laudos (
        lote_id,
        acao,
        status,
        criado_em
      ) VALUES (
        NEW.id,
        'solicitar_emissao',
        'pendente',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_registrar_solicitacao_emissao() OWNER TO postgres;


--
-- Name: fn_relatorio_emissoes_periodo(timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) RETURNS TABLE(solicitante_cpf character varying, solicitante_perfil character varying, total_solicitacoes bigint, total_sucessos bigint, total_erros bigint, taxa_sucesso numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fe.solicitado_por,
        fe.tipo_solicitante,
        COUNT(*) AS total_solicitacoes,
        COUNT(CASE WHEN l.status IN ('emitido', 'enviado') THEN 1 END) AS total_sucessos,
        COUNT(CASE WHEN fe.erro IS NOT NULL OR fe.tentativas >= fe.max_tentativas THEN 1 END) AS total_erros,
        ROUND(
            (COUNT(CASE WHEN l.status IN ('emitido', 'enviado') THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
            2
        ) AS taxa_sucesso
    FROM fila_emissao fe
    LEFT JOIN laudos l ON fe.lote_id = l.lote_id
    WHERE fe.solicitado_em BETWEEN p_data_inicio AND p_data_fim
    AND fe.solicitado_por IS NOT NULL
    GROUP BY fe.solicitado_por, fe.tipo_solicitante
    ORDER BY total_solicitacoes DESC;
END;
$$;


ALTER FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) OWNER TO postgres;


--
-- Name: FUNCTION fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_relatorio_emissoes_periodo(p_data_inicio timestamp without time zone, p_data_fim timestamp without time zone) IS 'Gera relatório estatístico de emissões por usuário em um período específico';



--
-- Name: fn_reservar_id_laudo_on_lote_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_reservar_id_laudo_on_lote_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Reservar o mesmo ID para o laudo (em status rascunho)
  -- Usar o emissor_cpf (liberado_por) do lote que estÃ¡ sendo criado
  INSERT INTO laudos (id, lote_id, emissor_cpf, status, criado_em, atualizado_em)
  VALUES (NEW.id, NEW.id, NEW.liberado_por, 'rascunho', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_reservar_id_laudo_on_lote_insert() OWNER TO postgres;


--
-- Name: fn_validar_laudo_emitido(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar_laudo_emitido() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Validar que hash_pdf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.hash_pdf IS NULL OR NEW.hash_pdf = '') THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem hash_pdf (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emitido_em existe quando status='emitido'
  IF NEW.status = 'emitido' AND NEW.emitido_em IS NULL THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem emitido_em (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emissor_cpf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.emissor_cpf IS NULL OR NEW.emissor_cpf = '') THEN
    RAISE EXCEPTION 'Laudo % nÃ£o pode ser marcado como emitido sem emissor_cpf (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudanÃ§a de hash_pdf se laudo jÃ¡ foi emitido (imutabilidade)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido - hash_pdf nÃ£o pode ser alterado (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudanÃ§a de emitido_em se laudo jÃ¡ foi emitido
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.emitido_em IS DISTINCT FROM NEW.emitido_em THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido - emitido_em nÃ£o pode ser alterado (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir reversÃ£o de status 'emitido' para 'rascunho' (exceto em caso de erro - permitir se hash_pdf NULL)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND NEW.status = 'rascunho' AND OLD.hash_pdf IS NOT NULL THEN
    RAISE EXCEPTION 'Laudo % jÃ¡ foi emitido e nÃ£o pode voltar para rascunho (violaÃ§Ã£o de imutabilidade)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_laudo_emitido() OWNER TO postgres;


--
-- Name: FUNCTION fn_validar_laudo_emitido(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_laudo_emitido() IS 'Valida o princÃ­pio da imutabilidade de laudos: somente permite status=emitido quando hash_pdf, emitido_em e emissor_cpf existem';



--
-- Name: fn_validar_transicao_status_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_validar_transicao_status_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  transicoes_validas TEXT[];
BEGIN
  -- Se status não mudou, permitir
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Definir transições válidas para cada status
  CASE OLD.status
    WHEN 'rascunho' THEN
      transicoes_validas := ARRAY['ativo', 'cancelado'];
    WHEN 'ativo' THEN
      transicoes_validas := ARRAY['concluido', 'cancelado'];
    WHEN 'concluido' THEN
      transicoes_validas := ARRAY['emissao_solicitada', 'cancelado'];
    WHEN 'emissao_solicitada' THEN
      transicoes_validas := ARRAY['emissao_em_andamento', 'concluido', 'cancelado'];
    WHEN 'emissao_em_andamento' THEN
      transicoes_validas := ARRAY['laudo_emitido', 'emissao_solicitada', 'cancelado'];
    WHEN 'laudo_emitido' THEN
      transicoes_validas := ARRAY['finalizado'];
    WHEN 'cancelado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote cancelado não pode ter status alterado';
    WHEN 'finalizado' THEN
      -- Estado final, não pode transitar
      RAISE EXCEPTION 'Lote finalizado não pode ter status alterado';
    ELSE
      RAISE EXCEPTION 'Status desconhecido: %', OLD.status;
  END CASE;

  -- Verificar se transição é válida
  IF NOT (NEW.status = ANY(transicoes_validas)) THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %. Transições permitidas: %',
      OLD.status, NEW.status, array_to_string(transicoes_validas, ', ');
  END IF;

  -- Atualizar timestamp
  NEW.atualizado_em := NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_validar_transicao_status_lote() OWNER TO postgres;


--
-- Name: FUNCTION fn_validar_transicao_status_lote(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_validar_transicao_status_lote() IS 'Valida transições de status do lote conforme máquina de estados. Previne transições inválidas e garante integridade.';



--
-- Name: limpar_auditoria_laudos_antiga(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.limpar_auditoria_laudos_antiga() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM auditoria_laudos
  WHERE criado_em < NOW() - INTERVAL '1 year'
    AND status NOT IN ('erro', 'cancelado'); -- Manter erros para analise

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RAISE NOTICE 'Limpeza de auditoria: % registros removidos', rows_deleted;
  
  RETURN rows_deleted;
END;
$$;


ALTER FUNCTION public.limpar_auditoria_laudos_antiga() OWNER TO postgres;


--
-- Name: FUNCTION limpar_auditoria_laudos_antiga(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.limpar_auditoria_laudos_antiga() IS 'Remove registros de auditoria com mais de 1 ano (exceto erros). Executar mensalmente via cron.';



--
-- Name: lote_pode_ser_processado(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.lote_pode_ser_processado(p_lote_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_status status_lote;
  v_tem_laudo BOOLEAN;
BEGIN
  -- Buscar status do lote
  SELECT status INTO v_status
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar se já tem laudo enviado
  SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = p_lote_id AND status = 'enviado')
  INTO v_tem_laudo;

  -- Pode processar se está concluído e não tem laudo
  RETURN v_status = 'concluido' AND NOT v_tem_laudo;
END;
$$;


ALTER FUNCTION public.lote_pode_ser_processado(p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION lote_pode_ser_processado(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.lote_pode_ser_processado(p_lote_id integer) IS 'Verifica se um lote está apto para emissão de laudo';



--
-- Name: obter_proximo_numero_ordem(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_proximo INTEGER;
BEGIN
    -- Buscar o maior nÃºmero de ordem para a empresa e incrementar
    SELECT COALESCE(MAX(numero_ordem), 0) + 1
    INTO v_proximo
    FROM lotes_avaliacao
    WHERE empresa_id = p_empresa_id;
    
    RETURN v_proximo;
END;
$$;


ALTER FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) OWNER TO postgres;


--
-- Name: FUNCTION obter_proximo_numero_ordem(p_empresa_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.obter_proximo_numero_ordem(p_empresa_id integer) IS 'Retorna o prÃ³ximo nÃºmero de ordem sequencial para um novo lote da empresa';



--
-- Name: prevent_laudo_lote_id_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_laudo_lote_id_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.lote_id != NEW.lote_id THEN
        RAISE EXCEPTION 'NÃ£o Ã© permitido alterar lote_id de um laudo jÃ¡ criado';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_laudo_lote_id_change() OWNER TO postgres;


--
-- Name: prevent_lote_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_lote_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Previne alterações no lote durante a emissão do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  -- Esta trigger agora apenas previne alterações críticas de campos principais
  
  -- Se é um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se é UPDATE, verificar se está tentando mudar campos críticos
  -- durante o processo de emissão (quando já existe laudo)
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se existe laudo emitido para este lote
    IF EXISTS (
      SELECT 1 FROM laudos 
      WHERE lote_id = OLD.id 
      AND status IN ('emitido', 'enviado')
    ) THEN
      -- Se laudo está emitido, prevenir mudanças em campos críticos
      IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
         OR OLD.setor_id IS DISTINCT FROM NEW.setor_id
         OR OLD.codigo IS DISTINCT FROM NEW.codigo THEN
        RAISE EXCEPTION 'Não é permitido alterar campos críticos de lote com laudo emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_lote_mutation_during_emission() OWNER TO postgres;


--
-- Name: FUNCTION prevent_lote_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_lote_mutation_during_emission() IS 'Previne alterações em campos críticos de lotes que já possuem laudos emitidos. Atualizada em migration 098 para remover referência ao campo processamento_em removido.';



--
-- Name: prevent_lote_status_change_after_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_lote_status_change_after_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se laudo foi emitido e tentando alterar status
    IF OLD.emitido_em IS NOT NULL AND NEW.status != OLD.status THEN
        -- Permitir apenas transição finalizado -> enviado (fluxo normal)
        IF OLD.status = 'finalizado' AND NEW.status = 'enviado' THEN
            RETURN NEW;
        END IF;
        
        RAISE EXCEPTION 
            'Não é possível alterar status do lote % após emissão do laudo. Status atual: %, tentativa: %',
            OLD.codigo, OLD.status, NEW.status
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Lotes com laudo emitido são imutáveis';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_lote_status_change_after_emission() OWNER TO postgres;


--
-- Name: FUNCTION prevent_lote_status_change_after_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_lote_status_change_after_emission() IS 'Previne mudança de status do lote após emissão do laudo';



--
-- Name: prevent_modification_after_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_modification_after_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    lote_emitido_em TIMESTAMP;
    lote_id_val INT;
BEGIN
    -- Determinar o lote_id (usar NEW para INSERT/UPDATE, OLD para DELETE)
    IF TG_OP = 'DELETE' THEN
        lote_id_val := OLD.lote_id;
    ELSE
        lote_id_val := NEW.lote_id;
    END IF;

    -- Buscar informações do lote
    SELECT emitido_em INTO lote_emitido_em
    FROM lotes_avaliacao
    WHERE id = lote_id_val;
    
    -- Se o laudo foi emitido, bloquear modificação
    IF lote_emitido_em IS NOT NULL THEN
        RAISE EXCEPTION 
            'Não é possível modificar avaliação do lote % (emitido em %). Laudo foi emitido em %.',
            lote_id_val, lote_emitido_em, lote_emitido_em
        USING 
            ERRCODE = 'integrity_constraint_violation',
            HINT = 'Laudos emitidos são imutáveis para garantir integridade';
    END IF;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.prevent_modification_after_emission() OWNER TO postgres;


--
-- Name: FUNCTION prevent_modification_after_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_after_emission() IS 'Previne modificação de avaliações após emissão do laudo (imutabilidade) - versão corrigida sem coluna codigo';



--
-- Name: prevent_modification_avaliacao_when_lote_emitted(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
  v_lote INTEGER;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
    SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote
        USING HINT = 'Avaliações pertencentes a lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() OWNER TO postgres;


--
-- Name: FUNCTION prevent_modification_avaliacao_when_lote_emitted(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() IS 'Impede UPDATE/DELETE em avaliações quando o lote já possui laudo emitido';



--
-- Name: prevent_modification_lote_when_laudo_emitted(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_modification_lote_when_laudo_emitted() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_has_laudo BOOLEAN := FALSE;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- desligar temporariamente row level security para a checagem interna
    PERFORM set_config('row_security', 'off', true);
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO v_has_laudo;
    IF v_has_laudo THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_modification_lote_when_laudo_emitted() OWNER TO postgres;


--
-- Name: FUNCTION prevent_modification_lote_when_laudo_emitted(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido para o lote';



--
-- Name: prevent_mutation_during_emission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_mutation_during_emission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  lote_status TEXT;
  lote_emitido_em TIMESTAMP;
BEGIN
  -- Previne alteraÃ§Ãµes nas avaliaÃ§Ãµes durante a emissÃ£o do laudo
  -- NOTA: Campo processamento_em foi removido em migration 097
  
  -- Se Ã© um INSERT, permitir
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Se Ã© UPDATE, verificar se estÃ¡ tentando mudar durante emissÃ£o
  IF TG_OP = 'UPDATE' THEN
    -- Buscar informaÃ§Ãµes do lote (SEM processamento_em)
    SELECT status, emitido_em
    INTO lote_status, lote_emitido_em
    FROM lotes_avaliacao 
    WHERE id = NEW.lote_id;

    -- Se o laudo jÃ¡ foi emitido, prevenir mudanÃ§as crÃ­ticas
    IF lote_emitido_em IS NOT NULL THEN
      -- Se estÃ¡ tentando mudar campos crÃ­ticos, prevenir
      IF OLD.status IS DISTINCT FROM NEW.status
         OR OLD.funcionario_cpf IS DISTINCT FROM NEW.funcionario_cpf
         OR OLD.lote_id IS DISTINCT FROM NEW.lote_id THEN
        RAISE EXCEPTION 'NÃ£o Ã© permitido alterar campos crÃ­ticos de avaliaÃ§Ã£o com laudo jÃ¡ emitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_mutation_during_emission() OWNER TO postgres;


--
-- Name: FUNCTION prevent_mutation_during_emission(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_mutation_during_emission() IS 'Previne alteraÃ§Ãµes em campos crÃ­ticos de avaliaÃ§Ãµes quando o laudo do lote jÃ¡ foi emitido. Atualizada em migration 099 para remover referÃªncia ao campo processamento_em removido.';



--
-- Name: prevent_update_finalized_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_update_finalized_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Impedir modificação de lotes em estados terminais
  IF OLD.status IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Lote com status "%" não pode ser modificado', OLD.status;
  END IF;

  -- Se já existe um laudo com status 'enviado', bloquear alterações EXCETO quando
  -- a atualização tiver como objetivo registrar o envio (laudo_enviado_em) pela
  -- primeira vez. Isto permite que o processo de envio atualize o lote com
  -- timestamps de envio/finalização sem ser impedido pelo trigger.
  IF EXISTS (
    SELECT 1 FROM laudos WHERE lote_id = OLD.id AND status = 'enviado'
  ) THEN
    -- Permitir apenas a atualização que define pela PRIMEIRA vez laudo_enviado_em
    IF NOT (NEW.laudo_enviado_em IS NOT NULL AND OLD.laudo_enviado_em IS NULL) THEN
      RAISE EXCEPTION 'Lote possui laudo enviado. Modificações bloqueadas.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_update_finalized_lote() OWNER TO postgres;


--
-- Name: FUNCTION prevent_update_finalized_lote(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.prevent_update_finalized_lote() IS 'Trigger atualizada para permitir registro de laudo_enviado_em mesmo quando já existe laudo com status=''enviado''';



--
-- Name: prevent_update_laudo_enviado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_update_laudo_enviado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status = 'enviado' THEN
    RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_update_laudo_enviado() OWNER TO postgres;


--
-- Name: refresh_vw_recibos_completos_mat(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_vw_recibos_completos_mat() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE NOTICE 'Refreshing materialized view vw_recibos_completos_mat';
  PERFORM 1; -- placeholder
  EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY vw_recibos_completos_mat';
EXCEPTION WHEN undefined_function THEN
  -- Some PostgreSQL versions / configs might not support CONCURRENTLY in certain contexts; fallback
  REFRESH MATERIALIZED VIEW vw_recibos_completos_mat;
END;
$$;


ALTER FUNCTION public.refresh_vw_recibos_completos_mat() OWNER TO postgres;


--
-- Name: FUNCTION refresh_vw_recibos_completos_mat(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.refresh_vw_recibos_completos_mat() IS 'Função helper para atualizar materialized view vw_recibos_completos_mat';



--
-- Name: set_questao_from_item(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_questao_from_item() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (NEW.questao IS NULL OR NEW.questao = 0) AND NEW.item IS NOT NULL THEN
    -- Extrair dígitos de 'item' e converter para inteiro (ex.: 'q1' -> 1, '1' -> 1)
    IF NEW.item ~ '\d' THEN
      NEW.questao := (regexp_replace(NEW.item, '\D', '', 'g'))::integer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_questao_from_item() OWNER TO postgres;


--
-- Name: trg_enforce_laudo_id_equals_lote(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_enforce_laudo_id_equals_lote() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If insert doesn't specify id or id differs, set id to lote_id
  IF NEW.id IS NULL OR NEW.id IS DISTINCT FROM NEW.lote_id THEN
    NEW.id := NEW.lote_id;
  END IF;

  -- Prevent creating a laudo when another laudo with same id exists (should be same as lote)
  IF EXISTS (SELECT 1 FROM laudos WHERE id = NEW.id) THEN
    RAISE EXCEPTION 'Laudo with id % already exists', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_enforce_laudo_id_equals_lote() OWNER TO postgres;


--
-- Name: trigger_criar_pdf_job(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_criar_pdf_job() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se recibo foi criado/atualizado e não tem PDF, enfileirar job
  IF NEW.pdf IS NULL AND NEW.ativo = true THEN
    INSERT INTO pdf_jobs (recibo_id, status, attempts)
    VALUES (NEW.id, 'pending', 0)
    ON CONFLICT (recibo_id) DO NOTHING; -- Evitar duplicatas
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_criar_pdf_job() OWNER TO postgres;


--
-- Name: update_pdf_jobs_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_pdf_jobs_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pdf_jobs_timestamp() OWNER TO postgres;


--
-- Name: upsert_laudo(integer, character, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text DEFAULT 'enviado'::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_laudo_id INTEGER;
BEGIN
    -- Como o laudo já foi criado em rascunho ao criar o lote, apenas atualizamos
    UPDATE laudos
    SET 
        emissor_cpf = p_emissor_cpf,
        observacoes = p_observacoes,
        status = p_status,
        emitido_em = NOW(),
        atualizado_em = NOW()
    WHERE id = p_lote_id
    RETURNING id INTO v_laudo_id;

    -- Se não existir (caso de lotes antigos), inserir
    IF v_laudo_id IS NULL THEN
        INSERT INTO laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, atualizado_em)
        VALUES (p_lote_id, p_lote_id, p_emissor_cpf, p_observacoes, p_status, NOW(), NOW(), NOW())
        RETURNING id INTO v_laudo_id;
    END IF;

    RETURN v_laudo_id;
END;
$$;


ALTER FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) OWNER TO postgres;


--
-- Name: FUNCTION upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.upsert_laudo(p_lote_id integer, p_emissor_cpf character, p_observacoes text, p_status text) IS 'Atualiza laudo rascunho existente (id já reservado) ou insere se não existir';



--
-- Name: validar_lote_para_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_lote_para_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM validar_lote_pre_laudo(p_lote_id);
END;
$$;


ALTER FUNCTION public.validar_lote_para_laudo(p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION validar_lote_para_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_lote_para_laudo(p_lote_id integer) IS 'Wrapper for validar_lote_pre_laudo for compatibility';



--
-- Name: validar_lote_pre_laudo(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb, bloqueante boolean)
    LANGUAGE plpgsql
    AS $$
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
        SELECT empresa_id, numero_ordem INTO v_empresa_id, v_numero_lote
        FROM lotes_avaliacao
        WHERE id = p_lote_id;

        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'concluido') AS concluidas,
          COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas
        INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas
        FROM avaliacoes
        WHERE lote_id = p_lote_id;

        SELECT COUNT(*) INTO v_funcionarios_pendentes
        FROM calcular_elegibilidade_lote(v_empresa_id, v_numero_lote) el
        WHERE NOT EXISTS (
          SELECT 1 FROM avaliacoes a 
          WHERE a.funcionario_cpf = el.funcionario_cpf 
          AND a.lote_id = p_lote_id
        );

        IF v_avaliacoes_inativadas > v_avaliacoes_concluidas * 0.3 THEN
          v_alertas := array_append(v_alertas, 'ATENÇÃO: Mais de 30% das avaliações foram inativadas (' || v_avaliacoes_inativadas || ' de ' || v_total_avaliacoes || '). Verifique se há problemas sistêmicos.');
        END IF;

        IF v_funcionarios_pendentes > 0 THEN
          v_alertas := array_append(v_alertas, 'PENDÊNCIA: ' || v_funcionarios_pendentes || ' funcionário(s) deveriam estar neste lote mas não foram incluídos. Revise a elegibilidade.');
        END IF;

        IF v_avaliacoes_concluidas = 0 THEN
          v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliação concluída neste lote. Não é possível gerar laudo.');
        END IF;

        v_detalhes := jsonb_build_object(
          'lote_id', p_lote_id,
          'numero_lote', v_numero_lote,
          'total_avaliacoes', v_total_avaliacoes,
          'avaliacoes_concluidas', v_avaliacoes_concluidas,
          'avaliacoes_inativadas', v_avaliacoes_inativadas,
          'funcionarios_pendentes', v_funcionarios_pendentes,
          'taxa_conclusao', ROUND((v_avaliacoes_concluidas::NUMERIC / NULLIF(v_total_avaliacoes, 0)) * 100, 2)
        );

        IF v_avaliacoes_concluidas = 0 OR v_funcionarios_pendentes > 0 THEN
          v_bloqueante := TRUE;
        END IF;

        RETURN QUERY SELECT 
          NOT v_bloqueante AS valido,
          v_alertas AS alertas,
          v_funcionarios_pendentes,
          v_detalhes AS detalhes,
          v_bloqueante AS bloqueante;
      END;
      $$;


ALTER FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION validar_lote_pre_laudo(p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_lote_pre_laudo(p_lote_id integer) IS 'Valida se lote está pronto para emissão de laudo. Lotes com status concluido e avaliações finalizadas são considerados válidos (Pronto). Apenas lotes em andamento verificam funcionários pendentes.';



--
-- Name: validar_status_avaliacao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_status_avaliacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Se o status esta sendo alterado para 'inativada', aceitar
  IF NEW.status = 'inativada' THEN
    RETURN NEW;
  END IF;
  
  -- Se a avaliacao JA estava inativada, nao permitir mudar para iniciada/em_andamento
  IF OLD.status = 'inativada' AND NEW.status IN ('iniciada', 'em_andamento') THEN
    RAISE EXCEPTION 'Nao e possivel reativar uma avaliacao inativada. Status atual: %, Status tentado: %', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_status_avaliacao() OWNER TO postgres;


--
-- Name: FUNCTION validar_status_avaliacao(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_status_avaliacao() IS 'Valida que avaliacoes inativadas nao podem voltar a status iniciada ou em_andamento';



--
-- Name: verificar_inativacao_consecutiva(character, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) RETURNS TABLE(permitido boolean, motivo text, total_inativacoes_consecutivas integer, ultima_inativacao_lote character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_lote_atual_ordem INTEGER;
  v_lote_anterior_ordem INTEGER;
  v_avaliacao_anterior_status VARCHAR(20);
  v_ultima_inativacao_codigo VARCHAR(20);
  v_total_consecutivas INTEGER := 0;
  v_tem_anomalia_critica BOOLEAN := false;
  v_empresa_id INTEGER;
BEGIN
  -- Buscar empresa_id do lote
  SELECT empresa_id INTO v_empresa_id
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Verificar se funcionario tem anomalias criticas
  SELECT EXISTS(
    SELECT 1 FROM (SELECT * FROM detectar_anomalias_indice(v_empresa_id)) AS anomalias
    WHERE anomalias.funcionario_cpf = p_funcionario_cpf AND anomalias.severidade = 'CRÍTICA'
  ) INTO v_tem_anomalia_critica;

  -- Buscar ordem do lote atual
  SELECT numero_ordem INTO v_lote_atual_ordem
  FROM lotes_avaliacao
  WHERE id = p_lote_id;

  -- Buscar lote anterior (ordem - 1) e contar avaliações anteriores
  SELECT la.numero_ordem, a.statusINTO v_lote_anterior_ordem, v_avaliacao_anterior_status, v_ultima_inativacao_codigo
  FROM lotes_avaliacao la
  LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.funcionario_cpf = p_funcionario_cpf
  WHERE la.empresa_id = v_empresa_id
    AND la.numero_ordem = v_lote_atual_ordem - 1
  LIMIT 1;

  -- Contar inativações anteriores (qualquer lote anterior)
  SELECT COUNT(*) INTO v_total_consecutivas
  FROM avaliacoes a
  JOIN lotes_avaliacao la ON a.lote_id = la.id
  WHERE a.funcionario_cpf = p_funcionario_cpf
    AND la.empresa_id = v_empresa_id
    AND la.numero_ordem < v_lote_atual_ordem
    AND a.status = 'inativada';

  -- Contar número de avaliações anteriores (independente de status)
  DECLARE v_total_avaliacoes_anteriores INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_avaliacoes_anteriores
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON a.lote_id = la.id
    WHERE a.funcionario_cpf = p_funcionario_cpf
      AND la.empresa_id = v_empresa_id
      AND la.numero_ordem < v_lote_atual_ordem;
  EXCEPTION WHEN OTHERS THEN
    v_total_avaliacoes_anteriores := 0;
  END;

  -- Se tem anomalia critica, permitir inativacao consecutiva
  IF v_tem_anomalia_critica THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario tem anomalias criticas detectadas. Inativacao consecutiva autorizada automaticamente. ' ||
      'Motivo: Anomalias criticas justificam flexibilizacao do processo de avaliacao.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- Se nao ha avaliacoes anteriores (funcionario recem-importado/inscrito), permitir sem sinalizar como forcada
  ELSIF v_total_avaliacoes_anteriores = 0 THEN
    RETURN QUERY SELECT
      true AS permitido,
      'PERMITIDO: Funcionario sem avaliacoes anteriores (possivel recem-importado/inscrito). Inativacao do primeiro lote e permitida.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  -- A partir da 2a inativacao (ou seja, ja existe pelo menos 1 inativacao anterior), sinalizar como restricao (pode ser forcada)
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
      'Inativação permitida. Lembre-se de registrar o motivo detalhadamente.' AS motivo,
      v_total_consecutivas AS total_inativacoes_consecutivas,
      v_ultima_inativacao_codigo AS ultima_inativacao_lote;
  END IF;
END;
$$;


ALTER FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) OWNER TO postgres;


--
-- Name: FUNCTION verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_inativacao_consecutiva(p_funcionario_cpf character, p_lote_id integer) IS 'Atualização: primeira avaliação pós importação permitida; sinalização a partir da 2ª inativação';



--
-- Name: analise_estatistica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analise_estatistica (
    id integer NOT NULL,
    avaliacao_id integer,
    grupo integer,
    score_original numeric(5,2),
    score_ajustado numeric(5,2),
    anomalia_detectada boolean DEFAULT false,
    tipo_anomalia character varying(100),
    recomendacao text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.analise_estatistica OWNER TO postgres;


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analise_estatistica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analise_estatistica_id_seq OWNER TO postgres;


--
-- Name: analise_estatistica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analise_estatistica_id_seq OWNED BY public.analise_estatistica.id;



--
-- Name: auditoria_laudos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria_laudos (
    id bigint NOT NULL,
    lote_id integer NOT NULL,
    laudo_id integer,
    emissor_cpf character varying(11),
    emissor_nome character varying(200),
    acao character varying(64) NOT NULL,
    status character varying(32) NOT NULL,
    ip_address inet,
    observacoes text,
    criado_em timestamp without time zone DEFAULT now() NOT NULL,
    solicitado_por character varying(11),
    tipo_solicitante character varying(20),
    tentativas integer DEFAULT 0,
    erro text,
    CONSTRAINT chk_solicitation_has_requester CHECK ((((acao)::text <> ALL (ARRAY[('solicitar_emissao'::character varying)::text, ('solicitacao_manual'::character varying)::text])) OR (solicitado_por IS NOT NULL))),
    CONSTRAINT chk_status_valid CHECK (((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('processando'::character varying)::text, ('emitido'::character varying)::text, ('enviado'::character varying)::text, ('erro'::character varying)::text, ('reprocessando'::character varying)::text, ('cancelado'::character varying)::text]))),
    CONSTRAINT chk_tipo_solicitante_valid CHECK (((tipo_solicitante IS NULL) OR ((tipo_solicitante)::text = ANY (ARRAY[('rh'::character varying)::text, ('gestor_entidade'::character varying)::text, ('admin'::character varying)::text, ('emissor'::character varying)::text]))))
);


ALTER TABLE public.auditoria_laudos OWNER TO postgres;


--
-- Name: TABLE auditoria_laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.auditoria_laudos IS 'Registra eventos de auditoria do fluxo de laudos (emissão, envio, reprocessamentos)';



--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_laudos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_laudos_id_seq OWNER TO postgres;


--
-- Name: auditoria_laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_laudos_id_seq OWNED BY public.auditoria_laudos.id;



--
-- Name: avaliacao_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avaliacao_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    avaliacao_id integer NOT NULL,
    lote_id integer NOT NULL,
    requested_by_user_id integer NOT NULL,
    requested_by_role character varying(50) NOT NULL,
    reason text NOT NULL,
    respostas_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.avaliacao_resets OWNER TO postgres;


--
-- Name: TABLE avaliacao_resets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.avaliacao_resets IS 'Immutable audit log of evaluation reset operations';



--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avaliacoes (
    id integer NOT NULL,
    funcionario_cpf character(11) NOT NULL,
    inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    envio timestamp without time zone,
    status character varying(20) DEFAULT 'iniciada'::character varying,
    grupo_atual integer DEFAULT 1,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lote_id integer,
    inativada_em timestamp with time zone,
    motivo_inativacao text,
    concluida_em timestamp without time zone,
    CONSTRAINT avaliacoes_status_check CHECK (((status)::text = ANY ((ARRAY['rascunho'::character varying, 'iniciada'::character varying, 'em_andamento'::character varying, 'concluida'::character varying, 'concluido'::character varying, 'inativada'::character varying])::text[])))
);


ALTER TABLE public.avaliacoes OWNER TO postgres;


--
-- Name: TABLE avaliacoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.avaliacoes IS 'Avaliações de risco psicossocial - acessível pelo funcionário (própria), RH (sua clínica) ou Gestor (sua entidade), admin NAO tem acesso operacional';



--
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avaliacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_id_seq OWNER TO postgres;


--
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;



--
-- Name: emissao_queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emissao_queue (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    tentativas integer DEFAULT 0 NOT NULL,
    ultimo_erro text,
    proxima_execucao timestamp with time zone DEFAULT now() NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.emissao_queue OWNER TO postgres;


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emissao_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emissao_queue_id_seq OWNER TO postgres;


--
-- Name: emissao_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emissao_queue_id_seq OWNED BY public.emissao_queue.id;



--
-- Name: fila_emissao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fila_emissao (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    tentativas integer DEFAULT 0,
    max_tentativas integer DEFAULT 3,
    proxima_tentativa timestamp without time zone DEFAULT now(),
    erro text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public.fila_emissao FORCE ROW LEVEL SECURITY;


ALTER TABLE public.fila_emissao OWNER TO postgres;


--
-- Name: TABLE fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.fila_emissao IS 'Fila de processamento assíncrono para emissão de laudos com retry automático';



--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fila_emissao_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fila_emissao_id_seq1 OWNER TO postgres;


--
-- Name: fila_emissao_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fila_emissao_id_seq1 OWNED BY public.fila_emissao.id;



--
-- Name: laudo_arquivos_remotos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laudo_arquivos_remotos (
    id integer NOT NULL,
    laudo_id integer NOT NULL,
    provider character varying(32) NOT NULL,
    bucket character varying(255) NOT NULL,
    key character varying(1024) NOT NULL,
    url text NOT NULL,
    checksum character varying(128),
    size_bytes bigint,
    tipo character varying(32) DEFAULT 'principal'::character varying,
    criado_por character varying(255),
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laudo_arquivos_remotos OWNER TO postgres;


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_arquivos_remotos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNER TO postgres;


--
-- Name: laudo_arquivos_remotos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_arquivos_remotos_id_seq OWNED BY public.laudo_arquivos_remotos.id;



--
-- Name: laudo_downloads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laudo_downloads (
    id integer NOT NULL,
    laudo_id integer NOT NULL,
    arquivo_remoto_id integer,
    usuario_cpf character varying(14),
    ip character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.laudo_downloads OWNER TO postgres;


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_downloads_id_seq OWNER TO postgres;


--
-- Name: laudo_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_downloads_id_seq OWNED BY public.laudo_downloads.id;



--
-- Name: laudo_generation_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laudo_generation_jobs (
    id bigint NOT NULL,
    lote_id integer NOT NULL,
    laudo_id integer,
    status character varying(20) DEFAULT 'queued'::character varying NOT NULL,
    attempts smallint DEFAULT 0 NOT NULL,
    max_attempts smallint DEFAULT 5 NOT NULL,
    last_error text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    finished_at timestamp with time zone
);


ALTER TABLE public.laudo_generation_jobs OWNER TO postgres;


--
-- Name: TABLE laudo_generation_jobs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.laudo_generation_jobs IS 'Jobs para geração de PDFs de laudos; consumidos por worker externo.';



--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudo_generation_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNER TO postgres;


--
-- Name: laudo_generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudo_generation_jobs_id_seq OWNED BY public.laudo_generation_jobs.id;



--
-- Name: laudos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.laudos (
    id integer NOT NULL,
    lote_id integer NOT NULL,
    emissor_cpf character(11),
    observacoes text,
    status character varying(20) DEFAULT 'emitido'::public.status_laudo_enum,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emitido_em timestamp without time zone,
    enviado_em timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hash_pdf character varying(64),
    job_id bigint,
    arquivo_remoto_provider character varying(32),
    arquivo_remoto_bucket character varying(255),
    arquivo_remoto_key character varying(1024),
    arquivo_remoto_url text,
    relatorio_individual bytea,
    relatorio_lote bytea,
    relatorio_setor bytea,
    hash_relatorio_individual character varying(64),
    hash_relatorio_lote character varying(64),
    hash_relatorio_setor character varying(64),
    arquivo_remoto_uploaded_at timestamp without time zone,
    arquivo_remoto_etag character varying(255),
    arquivo_remoto_size bigint,
    CONSTRAINT chk_laudos_emissor_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (emissor_cpf IS NOT NULL) AND (emissor_cpf <> ''::bpchar)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_emitido_antes_enviado CHECK (((enviado_em IS NULL) OR (emitido_em IS NULL) OR (emitido_em <= enviado_em))),
    CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (((emitido_em IS NULL) OR (emissor_cpf IS NOT NULL))),
    CONSTRAINT chk_laudos_emitido_em_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (emitido_em IS NOT NULL)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_hash_pdf_valid CHECK (((hash_pdf IS NULL) OR ((hash_pdf)::text ~ '^[a-f0-9]{64}$'::text))),
    CONSTRAINT chk_laudos_hash_when_emitido CHECK (((((status)::text = 'emitido'::text) AND (hash_pdf IS NOT NULL) AND ((hash_pdf)::text <> ''::text)) OR ((status)::text <> 'emitido'::text))),
    CONSTRAINT chk_laudos_status_valid CHECK (((status)::text = ANY (ARRAY[('emitido'::character varying)::text, ('enviado'::character varying)::text, ('rascunho'::character varying)::text]))),
    CONSTRAINT laudos_id_equals_lote_id CHECK ((id = lote_id))
);


ALTER TABLE public.laudos OWNER TO postgres;


--
-- Name: TABLE laudos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.laudos IS 'Laudos técnicos - emitidos por Emissor, visíveis por RH/Gestor, admin NAO tem acesso operacional';



--
-- Name: laudos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.laudos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laudos_id_seq OWNER TO postgres;


--
-- Name: laudos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.laudos_id_seq OWNED BY public.laudos.id;



--
-- Name: lote_id_allocator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lote_id_allocator (
    last_id bigint NOT NULL
);


ALTER TABLE public.lote_id_allocator OWNER TO postgres;


--
-- Name: lotes_avaliacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes_avaliacao (
    id integer DEFAULT public.fn_next_lote_id() NOT NULL,
    clinica_id integer,
    empresa_id integer,
    descricao text,
    tipo character varying(20) DEFAULT 'completo'::character varying,
    status character varying(20) DEFAULT 'ativo'::public.status_lote_enum,
    liberado_por character(11),
    liberado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hash_pdf character varying(64),
    numero_ordem integer DEFAULT 1 NOT NULL,
    emitido_em timestamp with time zone,
    enviado_em timestamp with time zone,
    setor_id integer,
    laudo_enviado_em timestamp without time zone,
    finalizado_em timestamp without time zone,
    entidade_id integer,
    contratante_id integer,
    status_pagamento public.status_pagamento,
    solicitacao_emissao_em timestamp with time zone,
    valor_por_funcionario numeric(10,2),
    link_pagamento_token uuid,
    link_pagamento_expira_em timestamp with time zone,
    link_pagamento_enviado_em timestamp with time zone,
    pagamento_metodo character varying(20),
    pagamento_parcelas integer,
    pago_em timestamp with time zone,
    CONSTRAINT expiracao_requer_token_check CHECK ((((link_pagamento_expira_em IS NOT NULL) AND (link_pagamento_token IS NOT NULL)) OR (link_pagamento_expira_em IS NULL))),
    CONSTRAINT lotes_avaliacao_owner_segregation_check CHECK ((((clinica_id IS NOT NULL) AND (empresa_id IS NOT NULL) AND (entidade_id IS NULL)) OR ((entidade_id IS NOT NULL) AND (clinica_id IS NULL) AND (empresa_id IS NULL)))),
    CONSTRAINT lotes_avaliacao_status_check CHECK (((status)::text = ANY (ARRAY[('rascunho'::character varying)::text, ('ativo'::character varying)::text, ('concluido'::character varying)::text, ('emissao_solicitada'::character varying)::text, ('emissao_em_andamento'::character varying)::text, ('laudo_emitido'::character varying)::text, ('cancelado'::character varying)::text, ('finalizado'::character varying)::text]))),
    CONSTRAINT lotes_avaliacao_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('completo'::character varying)::text, ('operacional'::character varying)::text, ('gestao'::character varying)::text]))),
    CONSTRAINT pagamento_completo_check CHECK ((((status_pagamento = 'pago'::public.status_pagamento) AND (pagamento_metodo IS NOT NULL) AND (pagamento_parcelas IS NOT NULL) AND (pago_em IS NOT NULL)) OR ((status_pagamento <> 'pago'::public.status_pagamento) OR (status_pagamento IS NULL)))),
    CONSTRAINT pagamento_parcelas_range_check CHECK ((((pagamento_parcelas >= 1) AND (pagamento_parcelas <= 12)) OR (pagamento_parcelas IS NULL))),
    CONSTRAINT valor_funcionario_positivo_check CHECK (((valor_por_funcionario > (0)::numeric) OR (valor_por_funcionario IS NULL)))
);


ALTER TABLE public.lotes_avaliacao OWNER TO postgres;


--
-- Name: TABLE lotes_avaliacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lotes_avaliacao IS 'Lotes de avaliaÃ§Ã£o - identificaÃ§Ã£o apenas por ID (alinhado com laudos.id)';



--
-- Name: lotes_avaliacao_funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_avaliacao_funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_funcionarios_id_seq OWNER TO postgres;


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lotes_avaliacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNER TO postgres;


--
-- Name: lotes_avaliacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lotes_avaliacao_id_seq OWNED BY public.lotes_avaliacao.id;



--
-- Name: pdf_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdf_jobs (
    id integer NOT NULL,
    recibo_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp without time zone,
    CONSTRAINT pdf_jobs_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text])))
);


ALTER TABLE public.pdf_jobs OWNER TO postgres;


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdf_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdf_jobs_id_seq OWNER TO postgres;


--
-- Name: pdf_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdf_jobs_id_seq OWNED BY public.pdf_jobs.id;



--
-- Name: questao_condicoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questao_condicoes (
    id integer NOT NULL,
    questao_id integer NOT NULL,
    questao_dependente integer,
    operador character varying(10),
    valor_condicao integer,
    categoria character varying(20) DEFAULT 'core'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.questao_condicoes OWNER TO postgres;


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questao_condicoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questao_condicoes_id_seq OWNER TO postgres;


--
-- Name: questao_condicoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questao_condicoes_id_seq OWNED BY public.questao_condicoes.id;



--
-- Name: relatorio_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relatorio_templates (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    tipo character varying(20) NOT NULL,
    descricao text,
    campos_incluidos jsonb,
    filtros_padrao jsonb,
    formato_saida character varying(20) DEFAULT 'A4'::character varying,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT relatorio_templates_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('pdf'::character varying)::text, ('excel'::character varying)::text, ('ambos'::character varying)::text])))
);


ALTER TABLE public.relatorio_templates OWNER TO postgres;


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relatorio_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relatorio_templates_id_seq OWNER TO postgres;


--
-- Name: relatorio_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.relatorio_templates_id_seq OWNED BY public.relatorio_templates.id;



--
-- Name: respostas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respostas (
    id integer NOT NULL,
    avaliacao_id integer NOT NULL,
    grupo integer NOT NULL,
    item character varying(10) NOT NULL,
    valor integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    questao integer,
    CONSTRAINT respostas_valor_check CHECK ((valor = ANY (ARRAY[0, 25, 50, 75, 100])))
);


ALTER TABLE public.respostas OWNER TO postgres;


--
-- Name: respostas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.respostas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respostas_id_seq OWNER TO postgres;


--
-- Name: respostas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.respostas_id_seq OWNED BY public.respostas.id;



--
-- Name: resultados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultados (
    id integer NOT NULL,
    avaliacao_id integer NOT NULL,
    grupo integer NOT NULL,
    dominio character varying(100) NOT NULL,
    score numeric(5,2) NOT NULL,
    categoria character varying(20),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resultados_categoria_check CHECK (((categoria)::text = ANY (ARRAY[('baixo'::character varying)::text, ('medio'::character varying)::text, ('alto'::character varying)::text])))
);


ALTER TABLE public.resultados OWNER TO postgres;


--
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resultados_id_seq OWNER TO postgres;


--
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;



--
-- Name: v_auditoria_emissoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_auditoria_emissoes AS
 SELECT la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.criado_em AS lote_criado_em,
    ec.nome AS empresa_nome,
    ec.cnpj AS empresa_cnpj,
    c.nome AS clinica_nome,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'concluida'::text) THEN a.id
            ELSE NULL::integer
        END) AS avaliacoes_concluidas,
    l.hash_pdf,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
   FROM ((((public.lotes_avaliacao la
     JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
     JOIN public.clinicas c ON ((ec.clinica_id = c.id)))
     LEFT JOIN public.avaliacoes a ON ((la.id = a.lote_id)))
     LEFT JOIN public.laudos l ON ((la.id = l.lote_id)))
  GROUP BY la.id, la.empresa_id, la.numero_ordem, la.status, la.emitido_em, la.enviado_em, la.criado_em, ec.nome, ec.cnpj, c.nome, l.hash_pdf, l.enviado_em, l.emitido_em;


ALTER VIEW public.v_auditoria_emissoes OWNER TO postgres;


--
-- Name: VIEW v_auditoria_emissoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_auditoria_emissoes IS 'View de auditoria de emissÃµes de laudos - ID-only (sem codigo/titulo/emergencia)';



--
-- Name: v_fila_emissao; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_fila_emissao AS
 SELECT id,
    lote_id,
    tentativas,
    3 AS max_tentativas,
    criado_em AS proxima_tentativa,
    erro,
    criado_em,
    criado_em AS atualizado_em,
    solicitado_por,
    tipo_solicitante,
    criado_em AS solicitado_em
   FROM public.auditoria_laudos al
  WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text])))
  ORDER BY criado_em;


ALTER VIEW public.v_fila_emissao OWNER TO postgres;


--
-- Name: VIEW v_fila_emissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_fila_emissao IS 'View de compatibilidade - mantém interface da antiga fila_emissao usando auditoria_laudos';



--
-- Name: v_relatorio_emissoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_relatorio_emissoes AS
 SELECT l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
        CASE
            WHEN (l.clinica_id IS NOT NULL) THEN 'clinica'::text
            WHEN (l.entidade_id IS NOT NULL) THEN 'entidade'::text
            ELSE NULL::text
        END AS fonte_tipo,
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    ec.nome AS empresa_nome,
    l.empresa_id,
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    count(DISTINCT a.id) AS total_avaliacoes,
    count(DISTINCT a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS avaliacoes_concluidas
   FROM (((((public.lotes_avaliacao l
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.tomadores t ON ((t.id = l.entidade_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)))
     LEFT JOIN public.laudos ld ON ((ld.lote_id = l.id)))
     LEFT JOIN public.avaliacoes a ON ((a.lote_id = l.id)))
  GROUP BY l.id, l.tipo, l.status, l.liberado_em, l.clinica_id, l.entidade_id, l.empresa_id, c.nome, t.nome, ec.nome, ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;


ALTER VIEW public.v_relatorio_emissoes OWNER TO postgres;


--
-- Name: VIEW v_relatorio_emissoes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_relatorio_emissoes IS 'Relatorio de emissoes de laudos com contexto (clinica ou entidade).
Compativel com arquitetura segregada de tomadores.';



--
-- Name: vw_auditoria_avaliacoes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_auditoria_avaliacoes AS
 SELECT a.id AS avaliacao_id,
    a.funcionario_cpf AS cpf,
    l.clinica_id,
    l.empresa_id,
    (l.id)::text AS lote,
    l.status AS lote_status,
        CASE
            WHEN ((l.status)::text = 'ativo'::text) THEN true
            ELSE false
        END AS liberado,
    a.status AS avaliacao_status,
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN true
            ELSE false
        END AS concluida,
        CASE
            WHEN ((a.status)::text = 'inativada'::text) THEN true
            ELSE false
        END AS inativada,
    ( SELECT count(*) AS count
           FROM public.audit_logs
          WHERE (((audit_logs.resource)::text = 'avaliacoes'::text) AND (audit_logs.resource_id = (a.id)::text) AND ((audit_logs.action)::text = 'UPDATE'::text) AND ((audit_logs.old_data ->> 'status'::text) <> (audit_logs.new_data ->> 'status'::text)))) AS numero_interrupcoes,
    a.inicio AS iniciada_em,
    a.envio AS concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome
   FROM (((public.avaliacoes a
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
     LEFT JOIN public.clinicas c ON ((c.id = l.clinica_id)))
     LEFT JOIN public.empresas_clientes ec ON ((ec.id = l.empresa_id)));


ALTER VIEW public.vw_auditoria_avaliacoes OWNER TO postgres;


--
-- Name: vw_empresas_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_empresas_stats AS
 SELECT ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.ativa,
    c.nome AS clinica_nome,
    count(fc.id) FILTER (WHERE (fc.ativo = true)) AS total_funcionarios,
    count(a.id) FILTER (WHERE ((a.status)::text = 'concluida'::text)) AS total_avaliacoes_concluidas,
    count(DISTINCT l.id) AS total_lotes
   FROM (((((public.empresas_clientes ec
     JOIN public.clinicas c ON ((c.id = ec.clinica_id)))
     LEFT JOIN public.funcionarios_clinicas fc ON ((fc.empresa_id = ec.id)))
     LEFT JOIN public.funcionarios f ON (((f.id = fc.funcionario_id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  GROUP BY ec.id, ec.nome, ec.cnpj, ec.clinica_id, ec.ativa, c.nome;


ALTER VIEW public.vw_empresas_stats OWNER TO postgres;


--
-- Name: VIEW vw_empresas_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_empresas_stats IS 'Estatisticas de empresas com contadores de funcionarios e avaliacoes.
Usa funcionarios_clinicas para contagem correta em arquitetura segregada.';



--
-- Name: vw_funcionarios_por_lote; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_funcionarios_por_lote AS
 SELECT f.id AS funcionario_id,
    f.cpf,
    f.nome,
    f.email,
    f.matricula,
    f.setor,
    f.funcao,
    f.turno,
    f.escala,
    f.nivel_cargo,
    f.ativo,
    COALESCE(fe.entidade_id, fc.clinica_id) AS source_id,
        CASE
            WHEN (fe.id IS NOT NULL) THEN 'entidade'::text
            WHEN (fc.id IS NOT NULL) THEN 'clinica'::text
            ELSE NULL::text
        END AS source_type,
    fc.clinica_id,
    fc.empresa_id,
    a.id AS avaliacao_id,
    a.status AS status_avaliacao,
    a.inicio AS data_inicio,
    a.envio AS data_conclusao,
    a.lote_id,
    l.status AS lote_status,
    l.tipo AS lote_tipo
   FROM ((((public.funcionarios f
     LEFT JOIN public.funcionarios_entidades fe ON (((fe.funcionario_id = f.id) AND (fe.ativo = true))))
     LEFT JOIN public.funcionarios_clinicas fc ON (((fc.funcionario_id = f.id) AND (fc.ativo = true))))
     LEFT JOIN public.avaliacoes a ON ((a.funcionario_cpf = f.cpf)))
     LEFT JOIN public.lotes_avaliacao l ON ((l.id = a.lote_id)))
  WHERE ((f.perfil)::text = 'funcionario'::text);


ALTER VIEW public.vw_funcionarios_por_lote OWNER TO postgres;


--
-- Name: VIEW vw_funcionarios_por_lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias.
Inclui source_id e source_type para identificar o contexto (entidade ou clinica).
IMPORTANTE: Funcionarios podem aparecer em ambos contextos se tiverem vinculos historicos.';



--
-- Name: analise_estatistica id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica ALTER COLUMN id SET DEFAULT nextval('public.analise_estatistica_id_seq'::regclass);



--
-- Name: auditoria_laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos ALTER COLUMN id SET DEFAULT nextval('public.auditoria_laudos_id_seq'::regclass);



--
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);



--
-- Name: emissao_queue id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue ALTER COLUMN id SET DEFAULT nextval('public.emissao_queue_id_seq'::regclass);



--
-- Name: fila_emissao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao ALTER COLUMN id SET DEFAULT nextval('public.fila_emissao_id_seq1'::regclass);



--
-- Name: laudo_arquivos_remotos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos ALTER COLUMN id SET DEFAULT nextval('public.laudo_arquivos_remotos_id_seq'::regclass);



--
-- Name: laudo_downloads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads ALTER COLUMN id SET DEFAULT nextval('public.laudo_downloads_id_seq'::regclass);



--
-- Name: laudo_generation_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.laudo_generation_jobs_id_seq'::regclass);



--
-- Name: laudos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos ALTER COLUMN id SET DEFAULT nextval('public.laudos_id_seq'::regclass);



--
-- Name: pdf_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_jobs ALTER COLUMN id SET DEFAULT nextval('public.pdf_jobs_id_seq'::regclass);



--
-- Name: questao_condicoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes ALTER COLUMN id SET DEFAULT nextval('public.questao_condicoes_id_seq'::regclass);



--
-- Name: relatorio_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relatorio_templates ALTER COLUMN id SET DEFAULT nextval('public.relatorio_templates_id_seq'::regclass);



--
-- Name: respostas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas ALTER COLUMN id SET DEFAULT nextval('public.respostas_id_seq'::regclass);



--
-- Name: resultados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados ALTER COLUMN id SET DEFAULT nextval('public.resultados_id_seq'::regclass);



--
-- Name: analise_estatistica analise_estatistica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_pkey PRIMARY KEY (id);



--
-- Name: auditoria_laudos auditoria_laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT auditoria_laudos_pkey PRIMARY KEY (id);



--
-- Name: avaliacao_resets avaliacao_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_pkey PRIMARY KEY (id);



--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);



--
-- Name: emissao_queue emissao_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_pkey PRIMARY KEY (id);



--
-- Name: fila_emissao fila_emissao_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_pkey1 PRIMARY KEY (id);



--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_pkey PRIMARY KEY (id);



--
-- Name: laudo_downloads laudo_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_pkey PRIMARY KEY (id);



--
-- Name: laudo_generation_jobs laudo_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_pkey PRIMARY KEY (id);



--
-- Name: laudos laudos_lote_emissor_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_emissor_unique UNIQUE (lote_id, emissor_cpf);



--
-- Name: laudos laudos_lote_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_unique UNIQUE (lote_id);



--
-- Name: laudos laudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_pkey PRIMARY KEY (id);



--
-- Name: lotes_avaliacao link_pagamento_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT link_pagamento_token_unique UNIQUE (link_pagamento_token);



--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_numero_ordem_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_numero_ordem_unique UNIQUE (empresa_id, numero_ordem);



--
-- Name: lotes_avaliacao lotes_avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_pkey PRIMARY KEY (id);



--
-- Name: pdf_jobs pdf_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_pkey PRIMARY KEY (id);



--
-- Name: pdf_jobs pdf_jobs_recibo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_key UNIQUE (recibo_id);



--
-- Name: questao_condicoes questao_condicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questao_condicoes
    ADD CONSTRAINT questao_condicoes_pkey PRIMARY KEY (id);



--
-- Name: relatorio_templates relatorio_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relatorio_templates
    ADD CONSTRAINT relatorio_templates_pkey PRIMARY KEY (id);



--
-- Name: respostas respostas_avaliacao_id_grupo_item_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_grupo_item_key UNIQUE (avaliacao_id, grupo, item);



--
-- Name: respostas respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_pkey PRIMARY KEY (id);



--
-- Name: resultados resultados_avaliacao_id_grupo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_grupo_key UNIQUE (avaliacao_id, grupo);



--
-- Name: resultados resultados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_pkey PRIMARY KEY (id);



--
-- Name: idx_analise_estatistica_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analise_estatistica_avaliacao ON public.analise_estatistica USING btree (avaliacao_id);



--
-- Name: idx_auditoria_laudos_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_criado ON public.auditoria_laudos USING btree (criado_em DESC);



--
-- Name: idx_auditoria_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote ON public.auditoria_laudos USING btree (lote_id);



--
-- Name: idx_auditoria_laudos_lote_acao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote_acao ON public.auditoria_laudos USING btree (lote_id, acao, criado_em DESC);



--
-- Name: idx_auditoria_laudos_lote_history; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_lote_history ON public.auditoria_laudos USING btree (lote_id, criado_em DESC) INCLUDE (acao, status, emissor_cpf, observacoes);



--
-- Name: idx_auditoria_laudos_pending_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_pending_queue ON public.auditoria_laudos USING btree (lote_id, status, acao, criado_em DESC) WHERE ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text, ('erro'::character varying)::text]));



--
-- Name: idx_auditoria_laudos_solicitado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_solicitado_por ON public.auditoria_laudos USING btree (solicitado_por);



--
-- Name: idx_auditoria_laudos_solicitante_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_laudos_solicitante_criado ON public.auditoria_laudos USING btree (emissor_cpf, criado_em DESC) WHERE ((acao)::text = 'emissao_solicitada'::text);



--
-- Name: idx_auditoria_laudos_unique_solicitation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_auditoria_laudos_unique_solicitation ON public.auditoria_laudos USING btree (lote_id, acao, solicitado_por) WHERE (((acao)::text = 'solicitar_emissao'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('reprocessando'::character varying)::text])));



--
-- Name: idx_avaliacao_resets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_created_at ON public.avaliacao_resets USING btree (created_at DESC);



--
-- Name: idx_avaliacao_resets_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_lote_id ON public.avaliacao_resets USING btree (lote_id);



--
-- Name: idx_avaliacao_resets_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacao_resets_requested_by ON public.avaliacao_resets USING btree (requested_by_user_id);



--
-- Name: idx_avaliacao_resets_unique_per_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_avaliacao_resets_unique_per_lote ON public.avaliacao_resets USING btree (avaliacao_id, lote_id);



--
-- Name: idx_avaliacoes_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario ON public.avaliacoes USING btree (funcionario_cpf);



--
-- Name: idx_avaliacoes_funcionario_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario_cpf ON public.avaliacoes USING btree (funcionario_cpf);



--
-- Name: idx_avaliacoes_funcionario_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_funcionario_status ON public.avaliacoes USING btree (funcionario_cpf, status);



--
-- Name: idx_avaliacoes_inativada_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_inativada_em ON public.avaliacoes USING btree (inativada_em) WHERE (inativada_em IS NOT NULL);



--
-- Name: idx_avaliacoes_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote ON public.avaliacoes USING btree (lote_id);



--
-- Name: idx_avaliacoes_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote_id ON public.avaliacoes USING btree (lote_id);



--
-- Name: idx_avaliacoes_lote_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_lote_status ON public.avaliacoes USING btree (lote_id, status) WHERE ((status)::text <> 'inativada'::text);



--
-- Name: idx_avaliacoes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_status ON public.avaliacoes USING btree (status);



--
-- Name: idx_emissao_queue_proxima_execucao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emissao_queue_proxima_execucao ON public.emissao_queue USING btree (proxima_execucao);



--
-- Name: idx_laudo_arquivos_remotos_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_arquivos_remotos_laudo_id ON public.laudo_arquivos_remotos USING btree (laudo_id);



--
-- Name: idx_laudo_arquivos_remotos_principal_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_laudo_arquivos_remotos_principal_unique ON public.laudo_arquivos_remotos USING btree (laudo_id) WHERE ((tipo)::text = 'principal'::text);



--
-- Name: idx_laudo_arquivos_remotos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_arquivos_remotos_tipo ON public.laudo_arquivos_remotos USING btree (laudo_id, tipo);



--
-- Name: idx_laudo_downloads_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_created_at ON public.laudo_downloads USING btree (created_at);



--
-- Name: idx_laudo_downloads_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_laudo_id ON public.laudo_downloads USING btree (laudo_id);



--
-- Name: idx_laudo_downloads_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_downloads_usuario ON public.laudo_downloads USING btree (usuario_cpf);



--
-- Name: idx_laudo_jobs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_created_at ON public.laudo_generation_jobs USING btree (created_at);



--
-- Name: idx_laudo_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudo_jobs_status ON public.laudo_generation_jobs USING btree (status);



--
-- Name: idx_laudos_arquivo_remoto_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_arquivo_remoto_key ON public.laudos USING btree (arquivo_remoto_key);



--
-- Name: idx_laudos_arquivo_remoto_sync; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_arquivo_remoto_sync ON public.laudos USING btree (arquivo_remoto_key, arquivo_remoto_uploaded_at) WHERE (arquivo_remoto_key IS NOT NULL);



--
-- Name: idx_laudos_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_criado_em ON public.laudos USING btree (criado_em DESC);



--
-- Name: idx_laudos_emissor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor ON public.laudos USING btree (emissor_cpf);



--
-- Name: idx_laudos_emissor_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor_cpf ON public.laudos USING btree (emissor_cpf);



--
-- Name: idx_laudos_emissor_cpf_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emissor_cpf_emitido ON public.laudos USING btree (emissor_cpf, emitido_em DESC);



--
-- Name: idx_laudos_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_emitido ON public.laudos USING btree (emitido_em, status) WHERE (emitido_em IS NOT NULL);



--
-- Name: idx_laudos_enviado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_enviado_em ON public.laudos USING btree (enviado_em DESC);



--
-- Name: idx_laudos_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_hash ON public.laudos USING btree (hash_pdf);



--
-- Name: idx_laudos_hash_pdf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_hash_pdf ON public.laudos USING btree (hash_pdf) WHERE (hash_pdf IS NOT NULL);



--
-- Name: idx_laudos_id_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_id_lote_id ON public.laudos USING btree (id, lote_id);



--
-- Name: idx_laudos_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_job_id ON public.laudos USING btree (job_id);



--
-- Name: idx_laudos_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote ON public.laudos USING btree (lote_id);



--
-- Name: idx_laudos_lote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote_id ON public.laudos USING btree (lote_id);



--
-- Name: idx_laudos_lote_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_lote_status ON public.laudos USING btree (lote_id, status);



--
-- Name: idx_laudos_relatorio_individual; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_individual ON public.laudos USING btree (relatorio_individual) WHERE (relatorio_individual IS NOT NULL);



--
-- Name: idx_laudos_relatorio_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_lote ON public.laudos USING btree (relatorio_lote) WHERE (relatorio_lote IS NOT NULL);



--
-- Name: idx_laudos_relatorio_setor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_relatorio_setor ON public.laudos USING btree (relatorio_setor) WHERE (relatorio_setor IS NOT NULL);



--
-- Name: idx_laudos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_laudos_status ON public.laudos USING btree (status);



--
-- Name: idx_lotes_atualizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_atualizado_em ON public.lotes_avaliacao USING btree (atualizado_em) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('finalizado'::character varying)::text]));



--
-- Name: idx_lotes_avaliacao_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_clinica_id ON public.lotes_avaliacao USING btree (clinica_id);



--
-- Name: idx_lotes_avaliacao_emitido_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_emitido_em ON public.lotes_avaliacao USING btree (id) WHERE (emitido_em IS NOT NULL);



--
-- Name: idx_lotes_avaliacao_empresa_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_empresa_id ON public.lotes_avaliacao USING btree (empresa_id);



--
-- Name: idx_lotes_avaliacao_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_entidade_id ON public.lotes_avaliacao USING btree (entidade_id);



--
-- Name: idx_lotes_avaliacao_enviado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_enviado_em ON public.lotes_avaliacao USING btree (id) WHERE (enviado_em IS NOT NULL);



--
-- Name: idx_lotes_avaliacao_expiracao_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_expiracao_pagamento ON public.lotes_avaliacao USING btree (link_pagamento_expira_em) WHERE (status_pagamento = 'aguardando_pagamento'::public.status_pagamento);



--
-- Name: idx_lotes_avaliacao_liberado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_liberado_por ON public.lotes_avaliacao USING btree (liberado_por);



--
-- Name: idx_lotes_avaliacao_solicitacao_emissao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_solicitacao_emissao ON public.lotes_avaliacao USING btree (solicitacao_emissao_em) WHERE (status_pagamento IS NOT NULL);



--
-- Name: idx_lotes_avaliacao_status_emitido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_status_emitido ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));



--
-- Name: idx_lotes_avaliacao_status_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_status_pagamento ON public.lotes_avaliacao USING btree (status_pagamento);



--
-- Name: idx_lotes_avaliacao_token_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_avaliacao_token_pagamento ON public.lotes_avaliacao USING btree (link_pagamento_token) WHERE (link_pagamento_token IS NOT NULL);



--
-- Name: idx_lotes_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica ON public.lotes_avaliacao USING btree (clinica_id);



--
-- Name: idx_lotes_clinica_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_clinica_status ON public.lotes_avaliacao USING btree (clinica_id, status);



--
-- Name: idx_lotes_emissao_em_andamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_em_andamento ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_em_andamento'::text);



--
-- Name: idx_lotes_emissao_solicitada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_solicitada ON public.lotes_avaliacao USING btree (status) WHERE ((status)::text = 'emissao_solicitada'::text);



--
-- Name: idx_lotes_emissao_solicitada_liberado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_emissao_solicitada_liberado ON public.lotes_avaliacao USING btree (liberado_em DESC) WHERE ((status)::text = 'emissao_solicitada'::text);



--
-- Name: idx_lotes_empresa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa ON public.lotes_avaliacao USING btree (empresa_id);



--
-- Name: idx_lotes_empresa_status_liberado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_empresa_status_liberado ON public.lotes_avaliacao USING btree (empresa_id, status, liberado_em DESC);



--
-- Name: idx_lotes_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_entidade_id ON public.lotes_avaliacao USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);



--
-- Name: idx_lotes_finalizado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_finalizado_em ON public.lotes_avaliacao USING btree (finalizado_em DESC);



--
-- Name: idx_lotes_laudo_enviado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_laudo_enviado ON public.lotes_avaliacao USING btree (laudo_enviado_em) WHERE (laudo_enviado_em IS NOT NULL);



--
-- Name: idx_lotes_liberado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_liberado_em ON public.lotes_avaliacao USING btree (liberado_em DESC);



--
-- Name: idx_lotes_numero_ordem; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_numero_ordem ON public.lotes_avaliacao USING btree (empresa_id, numero_ordem DESC);



--
-- Name: idx_lotes_pronto_emissao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_pronto_emissao ON public.lotes_avaliacao USING btree (status, emitido_em) WHERE (((status)::text = 'concluido'::text) AND (emitido_em IS NULL));



--
-- Name: idx_lotes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status ON public.lotes_avaliacao USING btree (status);



--
-- Name: idx_lotes_status_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lotes_status_criado ON public.lotes_avaliacao USING btree (status, criado_em DESC) WHERE ((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('concluido'::character varying)::text, ('emissao_solicitada'::character varying)::text]));



--
-- Name: idx_pdf_jobs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_jobs_created ON public.pdf_jobs USING btree (created_at);



--
-- Name: idx_pdf_jobs_recibo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_jobs_recibo ON public.pdf_jobs USING btree (recibo_id);



--
-- Name: idx_pdf_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_jobs_status ON public.pdf_jobs USING btree (status) WHERE ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text]));



--
-- Name: idx_questao_condicoes_dependente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_dependente ON public.questao_condicoes USING btree (questao_dependente);



--
-- Name: idx_questao_condicoes_questao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questao_condicoes_questao ON public.questao_condicoes USING btree (questao_id);



--
-- Name: idx_respostas_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respostas_avaliacao ON public.respostas USING btree (avaliacao_id);



--
-- Name: idx_resultados_avaliacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resultados_avaliacao ON public.resultados USING btree (avaliacao_id);



--
-- Name: idx_resultados_avaliacao_grupo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resultados_avaliacao_grupo ON public.resultados USING btree (avaliacao_id, grupo);



--
-- Name: idx_resultados_grupo_dominio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resultados_grupo_dominio ON public.resultados USING btree (grupo, dominio);



--
-- Name: avaliacoes audit_avaliacoes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_avaliacoes AFTER INSERT OR DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();



--
-- Name: laudos audit_laudos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_laudos AFTER INSERT OR DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();



--
-- Name: lotes_avaliacao audit_lotes_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_lotes_avaliacao AFTER INSERT OR DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_change();



--
-- Name: laudos enforce_laudo_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER enforce_laudo_immutability BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.check_laudo_immutability();



--
-- Name: avaliacoes prevent_avaliacao_delete_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_avaliacao_delete_after_emission BEFORE DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();



--
-- Name: avaliacoes prevent_avaliacao_update_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_avaliacao_update_after_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_after_emission();



--
-- Name: lotes_avaliacao prevent_lote_update_after_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER prevent_lote_update_after_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_status_change_after_emission();



--
-- Name: laudos trg_audit_laudo_creation; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_laudo_creation AFTER INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.audit_laudo_creation();



--
-- Name: lotes_avaliacao trg_audit_lote_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_lote_status AFTER UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.audit_lote_status_change();



--
-- Name: lotes_avaliacao trg_audit_status_pagamento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_status_pagamento AFTER UPDATE ON public.lotes_avaliacao FOR EACH ROW WHEN ((old.status_pagamento IS DISTINCT FROM new.status_pagamento)) EXECUTE FUNCTION public.audit_status_pagamento_change();



--
-- Name: laudos trg_bloquear_campos_emissor; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bloquear_campos_emissor BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_campos_sensiveis_emissor();



--
-- Name: laudos trg_enforce_laudo_id_equals_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_enforce_laudo_id_equals_lote BEFORE INSERT ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_laudo_id_equals_lote();



--
-- Name: laudos trg_immutable_laudo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_immutable_laudo BEFORE DELETE OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_update_laudo_enviado();



--
-- Name: lotes_avaliacao trg_immutable_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_immutable_lote BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_update_finalized_lote();



--
-- Name: laudo_generation_jobs trg_laudo_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_laudo_jobs_updated_at BEFORE UPDATE ON public.laudo_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();



--
-- Name: pdf_jobs trg_pdf_jobs_update_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pdf_jobs_update_timestamp BEFORE UPDATE ON public.pdf_jobs FOR EACH ROW EXECUTE FUNCTION public.update_pdf_jobs_timestamp();



--
-- Name: laudos trg_prevent_laudo_lote_id_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_prevent_laudo_lote_id_change BEFORE UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.prevent_laudo_lote_id_change();



--
-- Name: avaliacoes trg_protect_avaliacao_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_avaliacao_after_emit BEFORE DELETE OR UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();



--
-- Name: lotes_avaliacao trg_protect_lote_after_emit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_protect_lote_after_emit BEFORE DELETE OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();



--
-- Name: avaliacoes trg_recalc_lote_on_avaliacao_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update AFTER UPDATE OF status ON public.avaliacoes FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.fn_recalcular_status_lote_on_avaliacao_update();



--
-- Name: lotes_avaliacao trg_registrar_solicitacao_emissao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_registrar_solicitacao_emissao AFTER UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_solicitacao_emissao();



--
-- Name: lotes_avaliacao trg_reservar_id_laudo_on_lote_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_reservar_id_laudo_on_lote_insert AFTER INSERT ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_reservar_id_laudo_on_lote_insert();



--
-- Name: respostas trg_respostas_set_questao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_respostas_set_questao BEFORE INSERT OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.set_questao_from_item();



--
-- Name: lotes_avaliacao trg_sync_entidade_contratante; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sync_entidade_contratante BEFORE INSERT OR UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.sync_entidade_contratante_id();



--
-- Name: laudos trg_validar_laudo_emitido; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_laudo_emitido BEFORE INSERT OR UPDATE ON public.laudos FOR EACH ROW EXECUTE FUNCTION public.fn_validar_laudo_emitido();



--
-- Name: avaliacoes trg_validar_status_avaliacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_status_avaliacao BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.validar_status_avaliacao();



--
-- Name: lotes_avaliacao trg_validar_transicao_status_lote; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validar_transicao_status_lote BEFORE UPDATE OF status ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.fn_validar_transicao_status_lote();



--
-- Name: avaliacoes trigger_prevent_avaliacao_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_avaliacao_mutation_during_emission BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.prevent_mutation_during_emission();



--
-- Name: lotes_avaliacao trigger_prevent_lote_mutation_during_emission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_prevent_lote_mutation_during_emission BEFORE UPDATE ON public.lotes_avaliacao FOR EACH ROW EXECUTE FUNCTION public.prevent_lote_mutation_during_emission();



--
-- Name: respostas trigger_resposta_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resposta_immutability BEFORE DELETE OR UPDATE ON public.respostas FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();



--
-- Name: resultados trigger_resultado_immutability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_resultado_immutability BEFORE INSERT OR DELETE OR UPDATE ON public.resultados FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();



--
-- Name: analise_estatistica analise_estatistica_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analise_estatistica
    ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: avaliacao_resets avaliacao_resets_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: avaliacao_resets avaliacao_resets_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacao_resets
    ADD CONSTRAINT avaliacao_resets_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: avaliacoes avaliacoes_funcionario_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_funcionario_cpf_fkey FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE CASCADE;



--
-- Name: avaliacoes avaliacoes_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE SET NULL;



--
-- Name: emissao_queue emissao_queue_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emissao_queue
    ADD CONSTRAINT emissao_queue_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: fila_emissao fila_emissao_lote_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fila_emissao
    ADD CONSTRAINT fila_emissao_lote_id_fkey1 FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: auditoria_laudos fk_auditoria_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria_laudos
    ADD CONSTRAINT fk_auditoria_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: avaliacoes fk_avaliacoes_funcionario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT fk_avaliacoes_funcionario FOREIGN KEY (funcionario_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;



--
-- Name: laudos fk_laudos_emissor_cpf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_emissor_cpf FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf) ON DELETE RESTRICT;



--
-- Name: laudos fk_laudos_lote; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: laudos fk_laudos_lote_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT fk_laudos_lote_id FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: respostas fk_respostas_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT fk_respostas_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: resultados fk_resultados_avaliacao; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT fk_resultados_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: laudo_arquivos_remotos laudo_arquivos_remotos_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_arquivos_remotos
    ADD CONSTRAINT laudo_arquivos_remotos_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;



--
-- Name: laudo_downloads laudo_downloads_arquivo_remoto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_arquivo_remoto_id_fkey FOREIGN KEY (arquivo_remoto_id) REFERENCES public.laudo_arquivos_remotos(id) ON DELETE SET NULL;



--
-- Name: laudo_downloads laudo_downloads_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_downloads
    ADD CONSTRAINT laudo_downloads_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE CASCADE;



--
-- Name: laudo_generation_jobs laudo_generation_jobs_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudo_generation_jobs
    ADD CONSTRAINT laudo_generation_jobs_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: laudos laudos_emissor_cpf_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);



--
-- Name: laudos laudos_emissor_cpf_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_emissor_cpf_fkey1 FOREIGN KEY (emissor_cpf) REFERENCES public.funcionarios(cpf);



--
-- Name: laudos laudos_lote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.laudos
    ADD CONSTRAINT laudos_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes_avaliacao(id) ON DELETE CASCADE;



--
-- Name: lotes_avaliacao lotes_avaliacao_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas_clientes(id) ON DELETE CASCADE;



--
-- Name: lotes_avaliacao lotes_avaliacao_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes_avaliacao
    ADD CONSTRAINT lotes_avaliacao_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;



--
-- Name: pdf_jobs pdf_jobs_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdf_jobs
    ADD CONSTRAINT pdf_jobs_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;



--
-- Name: respostas respostas_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas
    ADD CONSTRAINT respostas_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: resultados resultados_avaliacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_avaliacao_id_fkey FOREIGN KEY (avaliacao_id) REFERENCES public.avaliacoes(id) ON DELETE CASCADE;



--
-- Name: avaliacao_resets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.avaliacao_resets ENABLE ROW LEVEL SECURITY;


--
-- Name: avaliacao_resets avaliacao_resets_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_delete_policy ON public.avaliacao_resets FOR DELETE USING (false);



--
-- Name: avaliacao_resets avaliacao_resets_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_insert_policy ON public.avaliacao_resets FOR INSERT WITH CHECK (((current_setting('app.is_backend'::text, true) = '1'::text) OR (current_setting('app.current_user_perfil'::text, true) = ANY (ARRAY['rh'::text, 'gestor_entidade'::text, 'admin'::text]))));



--
-- Name: avaliacao_resets avaliacao_resets_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacao_resets_update_policy ON public.avaliacao_resets FOR UPDATE USING (false);



--
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;


--
-- Name: avaliacoes avaliacoes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_block_admin ON public.avaliacoes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: avaliacoes avaliacoes_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_own_select ON public.avaliacoes FOR SELECT USING ((((funcionario_cpf)::text = public.current_user_cpf()) AND (NOT public.current_user_is_gestor())));



--
-- Name: avaliacoes avaliacoes_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY avaliacoes_rh_select ON public.avaliacoes FOR SELECT USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND (EXISTS ( SELECT 1
   FROM (public.lotes_avaliacao la
     JOIN public.empresas_clientes ec ON ((la.empresa_id = ec.id)))
  WHERE ((la.id = avaliacoes.lote_id) AND (ec.clinica_id = (NULLIF(current_setting('app.current_clinica_id'::text, true), ''::text))::integer))))));



--
-- Name: fila_emissao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.fila_emissao ENABLE ROW LEVEL SECURITY;


--
-- Name: fila_emissao fila_emissao_admin_view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_admin_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: fila_emissao fila_emissao_emissor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_update ON public.fila_emissao FOR UPDATE USING ((public.current_user_perfil() = 'emissor'::text)) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));



--
-- Name: fila_emissao fila_emissao_emissor_view; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_emissor_view ON public.fila_emissao FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));



--
-- Name: fila_emissao fila_emissao_system_bypass; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY fila_emissao_system_bypass ON public.fila_emissao USING ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text)) WITH CHECK ((COALESCE(current_setting('app.system_bypass'::text, true), 'false'::text) = 'true'::text));



--
-- Name: laudos laudos_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY laudos_block_admin ON public.laudos AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: lotes_avaliacao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lotes_avaliacao ENABLE ROW LEVEL SECURITY;


--
-- Name: lotes_avaliacao lotes_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_block_admin ON public.lotes_avaliacao AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: lotes_avaliacao lotes_funcionario_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.lote_id = lotes_avaliacao.id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));



--
-- Name: lotes_avaliacao lotes_rh_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_delete ON public.lotes_avaliacao FOR DELETE USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional()) AND (NOT (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE (a.lote_id = lotes_avaliacao.id))))));



--
-- Name: lotes_avaliacao lotes_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY lotes_rh_select ON public.lotes_avaliacao FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND public.validate_rh_clinica() AND (clinica_id = public.current_user_clinica_id_optional())));



--
-- Name: laudos policy_laudos_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY policy_laudos_admin ON public.laudos FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));



--
-- Name: lotes_avaliacao policy_lotes_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY policy_lotes_admin ON public.lotes_avaliacao FOR SELECT USING ((current_setting('app.current_role'::text, true) = 'admin'::text));



--
-- Name: lotes_avaliacao policy_lotes_emissor; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY policy_lotes_emissor ON public.lotes_avaliacao FOR SELECT USING (((current_setting('app.current_role'::text, true) = 'emissor'::text) AND ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('em_processamento'::character varying)::text, ('concluido'::character varying)::text]))));



--
-- Name: respostas; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;


--
-- Name: respostas respostas_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_block_admin ON public.respostas AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: respostas respostas_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY respostas_own_select ON public.respostas FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = respostas.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));



--
-- Name: resultados; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;


--
-- Name: resultados resultados_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_block_admin ON public.resultados AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: resultados resultados_own_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_own_select ON public.resultados FOR SELECT USING (((NOT public.current_user_is_gestor()) AND (EXISTS ( SELECT 1
   FROM public.avaliacoes a
  WHERE ((a.id = resultados.avaliacao_id) AND ((a.funcionario_cpf)::text = public.current_user_cpf()))))));



--
-- Name: resultados resultados_system_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resultados_system_insert ON public.resultados FOR INSERT WITH CHECK (true);



--
-- Name: laudos rls_emissor_insert_laudos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_emissor_insert_laudos ON public.laudos FOR INSERT WITH CHECK ((public.current_user_perfil() = 'emissor'::text));



--
-- Name: laudos rls_emissor_select_laudos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_emissor_select_laudos ON public.laudos FOR SELECT USING ((public.current_user_perfil() = 'emissor'::text));



--
-- Name: laudos rls_emissor_update_laudos; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rls_emissor_update_laudos ON public.laudos FOR UPDATE USING (((public.current_user_perfil() = 'emissor'::text) AND (((emissor_cpf)::text = public.current_user_cpf()) OR (emissor_cpf IS NULL)))) WITH CHECK ((public.current_user_perfil() = 'emissor'::text));


