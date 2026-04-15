-- ============================================================================
-- 03-entidades-comercial.sql
-- Entidades, empresas, contratos, representantes, comissionamento
-- Depends on: 01-foundation.sql, 02-identidade.sql
-- ============================================================================


--
-- Name: atualizar_timestamp_configuracoes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_timestamp_configuracoes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em = NOW();
  NEW.atualizado_por_cpf = COALESCE(NULLIF(current_setting('app.current_user_cpf', TRUE), ''), NEW.atualizado_por_cpf);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_timestamp_configuracoes() OWNER TO postgres;


--
-- Name: calcular_elegibilidade_lote(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    (CASE
      WHEN fc.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - fc.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN ult_aval.data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    fc.indice_avaliacao AS indice_atual,
    fc.data_ultimo_lote,
    CASE
      WHEN ult_aval.data_conclusao IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - ult_aval.data_conclusao)::INTEGER
      WHEN fc.data_ultimo_lote IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - fc.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN fc.indice_avaliacao = 0 THEN 'ALTA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
  -- Subquery lateral: ultima avaliacao CONCLUIDA desta empresa
  LEFT JOIN LATERAL (
    SELECT a.envio AS data_conclusao
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE a.funcionario_cpf = f.cpf
      AND la.empresa_id = p_empresa_id
      AND a.status = 'concluida'
      AND a.envio IS NOT NULL
    ORDER BY a.envio DESC
    LIMIT 1
  ) ult_aval ON true
  WHERE
    fc.empresa_id = p_empresa_id
    AND fc.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado nesta empresa
      fc.indice_avaliacao = 0
      OR
      -- Indice atrasado MAS nao tem avaliacao concluida recente nesta empresa
      (
        (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao nesta empresa foi concluida ha mais de 1 ano
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao nesta empresa (apenas inativadas)
      (ult_aval.data_conclusao IS NULL AND fc.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 2 THEN 1
      WHEN fc.indice_avaliacao = 0 THEN 2
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - fc.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    fc.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) OWNER TO postgres;


--
-- Name: FUNCTION calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote(p_empresa_id integer, p_numero_lote_atual integer) IS 'Calcula elegibilidade per-vinculo para empresas.
Multi-CNPJ: Usa fc.indice_avaliacao e verifica avaliacoes concluidas apenas dos lotes DESTA empresa.
Migration 1104.';



--
-- Name: calcular_elegibilidade_lote_tomador(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) RETURNS TABLE(funcionario_cpf character, funcionario_nome character varying, motivo_inclusao character varying, indice_atual integer, data_ultimo_lote timestamp without time zone, dias_sem_avaliacao integer, prioridade character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.cpf AS funcionario_cpf,
    f.nome AS funcionario_nome,
    (CASE
      WHEN fe.indice_avaliacao = 0 THEN 'Funcionario novo (nunca avaliado)'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN
        'Indice atrasado (faltou ' || (p_numero_lote_atual - 1 - fe.indice_avaliacao)::TEXT || ' lote(s))'
      WHEN ult_aval.data_conclusao IS NULL THEN 'Nunca completou avaliacao'
      WHEN ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN
        'Mais de 1 ano sem avaliacao concluida'
      ELSE 'Renovacao regular'
    END)::VARCHAR(100) AS motivo_inclusao,
    fe.indice_avaliacao AS indice_atual,
    fe.data_ultimo_lote,
    CASE
      WHEN ult_aval.data_conclusao IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - ult_aval.data_conclusao)::INTEGER
      WHEN fe.data_ultimo_lote IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - fe.data_ultimo_lote)::INTEGER
      ELSE NULL
    END AS dias_sem_avaliacao,
    (CASE
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 2 THEN 'CRITICA'
      WHEN fe.indice_avaliacao = 0 THEN 'ALTA'
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 'ALTA'
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN 'MEDIA'
      ELSE 'NORMAL'
    END)::VARCHAR(20) AS prioridade
  FROM funcionarios f
  INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
  -- Subquery lateral: ultima avaliacao CONCLUIDA desta entidade
  LEFT JOIN LATERAL (
    SELECT a.envio AS data_conclusao
    FROM avaliacoes a
    JOIN lotes_avaliacao la ON la.id = a.lote_id
    WHERE a.funcionario_cpf = f.cpf
      AND la.entidade_id = p_tomador_id
      AND a.status = 'concluida'
      AND a.envio IS NOT NULL
    ORDER BY a.envio DESC
    LIMIT 1
  ) ult_aval ON true
  WHERE
    fe.entidade_id = p_tomador_id
    AND fe.ativo = true
    AND f.ativo = true
    AND f.perfil = 'funcionario'
    AND (
      -- Nunca avaliado nesta entidade
      fe.indice_avaliacao = 0
      OR
      -- Indice atrasado MAS nao tem avaliacao concluida recente nesta entidade
      (
        (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1
        AND (
          ult_aval.data_conclusao IS NULL
          OR ult_aval.data_conclusao < NOW() - INTERVAL '1 year'
        )
      )
      OR
      -- Ultima avaliacao nesta entidade foi concluida ha mais de 1 ano
      (ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year')
      OR
      -- Nunca completou nenhuma avaliacao nesta entidade (apenas inativadas)
      (ult_aval.data_conclusao IS NULL AND fe.indice_avaliacao > 0)
    )
  ORDER BY
    CASE
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 2 THEN 1
      WHEN fe.indice_avaliacao = 0 THEN 2
      WHEN ult_aval.data_conclusao IS NOT NULL AND ult_aval.data_conclusao < NOW() - INTERVAL '1 year' THEN 3
      WHEN (p_numero_lote_atual - 1 - fe.indice_avaliacao) >= 1 THEN 4
      ELSE 5
    END,
    fe.indice_avaliacao ASC,
    f.nome ASC;
END;
$$;


ALTER FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) OWNER TO postgres;


--
-- Name: FUNCTION calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_elegibilidade_lote_tomador(p_tomador_id integer, p_numero_lote_atual integer) IS 'Calcula elegibilidade per-vinculo para entidades (tomadores).
Multi-CNPJ: Usa fe.indice_avaliacao e verifica avaliacoes concluidas apenas dos lotes DESTA entidade.
Migration 1104.';



--
-- Name: calcular_vigencia_fim(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_vigencia_fim(data_inicio date) RETURNS date
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Vigência de 364 dias a partir da data de início
    RETURN data_inicio + INTERVAL '364 days';
END;
$$;


ALTER FUNCTION public.calcular_vigencia_fim(data_inicio date) OWNER TO postgres;


--
-- Name: FUNCTION calcular_vigencia_fim(data_inicio date); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calcular_vigencia_fim(data_inicio date) IS 'Calcula data fim da vigência (data início + 364 dias)';



--
-- Name: criar_usuario_responsavel_apos_aprovacao(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.criar_usuario_responsavel_apos_aprovacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cpf VARCHAR(11);
    v_nome VARCHAR(200);
    v_senha_padrao VARCHAR(6);
    v_senha_hash TEXT;
    v_tipo_usuario VARCHAR(50);
    v_clinica_id INTEGER;
    v_entidade_id INTEGER;
    v_usuario_existe BOOLEAN;
    v_senha_existe BOOLEAN;
    v_tabela_origem TEXT;
BEGIN
    -- Apenas processar quando status muda para 'aprovado'
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN

        v_cpf := NEW.responsavel_cpf;
        v_nome := NEW.responsavel_nome;

        -- Gerar senha padrao (6 ultimos digitos do CNPJ)
        v_senha_padrao := RIGHT(REPLACE(NEW.cnpj, '-', ''), 6);
        v_senha_hash := crypt(v_senha_padrao, gen_salt('bf'));

        -- Determinar tabela de origem atravÃ©s do TG_TABLE_NAME
        v_tabela_origem := TG_TABLE_NAME;

        -- Determinar tipo de usuario e IDs baseado na tabela de origem
        IF v_tabela_origem = 'clinicas' THEN
            v_tipo_usuario := 'rh';
            
            -- âœ… CORREÃ‡ÃƒO: Usar NEW.id diretamente ao invÃ©s de buscar por CNPJ
            -- Quando o trigger Ã© executado na tabela clinicas, NEW.id jÃ¡ Ã© o clinica_id correto
            v_clinica_id := NEW.id;
            v_entidade_id := NULL;
            
            RAISE NOTICE '[TRIGGER] Criando usuÃ¡rio RH para clinica_id=% (CPF=%)', v_clinica_id, v_cpf;

        ELSIF v_tabela_origem = 'entidades' THEN
            v_tipo_usuario := 'gestor';
            v_clinica_id := NULL;
            
            -- Para entidades, NEW.id jÃ¡ Ã© o entidade_id correto
            v_entidade_id := NEW.id;
            
            RAISE NOTICE '[TRIGGER] Criando usuÃ¡rio Gestor para entidade_id=% (CPF=%)', v_entidade_id, v_cpf;
            
        ELSE
            -- Fallback para compatibilidade com NEW.tipo (caso tabela tenha campo tipo)
            IF NEW.tipo = 'clinica' THEN
                v_tipo_usuario := 'rh';
                v_clinica_id := NEW.id;  -- Usar NEW.id diretamente
                v_entidade_id := NULL;
            ELSE
                v_tipo_usuario := 'gestor';
                v_clinica_id := NULL;
                v_entidade_id := NEW.id;
            END IF;
        END IF;

        -- Verificar se usuario ja existe
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = v_cpf) INTO v_usuario_existe;

        -- Criar usuario se nao existir
        IF NOT v_usuario_existe THEN
            INSERT INTO usuarios (cpf, nome, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
            VALUES (v_cpf, v_nome, v_tipo_usuario, v_clinica_id, v_entidade_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

            RAISE NOTICE '[TRIGGER] Usuario % criado com tipo_usuario=% clinica_id=% entidade_id=%', 
                         v_cpf, v_tipo_usuario, v_clinica_id, v_entidade_id;
        ELSE
            RAISE NOTICE '[TRIGGER] Usuario % jÃ¡ existe, pulando criaÃ§Ã£o', v_cpf;
        END IF;

        -- Criar senha na tabela apropriada
        IF v_tabela_origem = 'clinicas' OR (v_tabela_origem != 'entidades' AND NEW.tipo = 'clinica') THEN
            SELECT EXISTS(SELECT 1 FROM clinicas_senhas WHERE cpf = v_cpf) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, primeira_senha_alterada, criado_em)
                VALUES (v_clinica_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em clinicas_senhas para RH % (clinica_id=%)', v_cpf, v_clinica_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha jÃ¡ existe em clinicas_senhas para CPF %', v_cpf;
            END IF;
        ELSE
            SELECT EXISTS(SELECT 1 FROM entidades_senhas WHERE cpf = v_cpf AND entidade_id = v_entidade_id) INTO v_senha_existe;

            IF NOT v_senha_existe THEN
                INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, primeira_senha_alterada, created_at, criado_em)
                VALUES (v_entidade_id, v_cpf, v_senha_hash, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

                RAISE NOTICE '[TRIGGER] Senha criada em entidades_senhas para gestor % (entidade_id=%)', v_cpf, v_entidade_id;
            ELSE
                RAISE NOTICE '[TRIGGER] Senha jÃ¡ existe em entidades_senhas para CPF % e entidade_id=%', v_cpf, v_entidade_id;
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.criar_usuario_responsavel_apos_aprovacao() OWNER TO postgres;


--
-- Name: FUNCTION criar_usuario_responsavel_apos_aprovacao(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.criar_usuario_responsavel_apos_aprovacao() IS 'Trigger function que cria automaticamente usuario RH ou Gestor quando entidade/clinica Ã© aprovada.
CORREÃ‡ÃƒO (2026-02-08): Usa NEW.id diretamente ao invÃ©s de buscar por CNPJ, evitando atribuiÃ§Ã£o de ID incorreto.';



--
-- Name: executar_corte_nf_manual(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.executar_corte_nf_manual(p_mes_referencia date) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  -- Congela comissões aprovadas sem NF enviada para o mês de pagamento informado
  UPDATE public.comissoes_laudo
  SET    status                = 'congelada_aguardando_admin',
         motivo_congelamento   = 'nf_rpa_pendente',
         auto_cancelamento_em  = NOW() + INTERVAL '30 days'
  WHERE  status = 'aprovada'
    AND  nf_rpa_enviada_em IS NULL
    AND  mes_pagamento = p_mes_referencia;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


ALTER FUNCTION public.executar_corte_nf_manual(p_mes_referencia date) OWNER TO postgres;


--
-- Name: FUNCTION executar_corte_nf_manual(p_mes_referencia date); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.executar_corte_nf_manual(p_mes_referencia date) IS 'Executada manualmente pelo admin após dia 5 do mês. Congela comissões aprovadas que não receberam NF/RPA no prazo. O parâmetro p_mes_referencia é o primeiro dia do mês de pagamento (ex: 2026-04-01).';



--
-- Name: garantir_template_padrao_unico(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.garantir_template_padrao_unico() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.padrao = TRUE THEN
    UPDATE templates_contrato
    SET padrao = FALSE
    WHERE tipo_template = NEW.tipo_template
      AND id != NEW.id
      AND padrao = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.garantir_template_padrao_unico() OWNER TO postgres;


--
-- Name: gerar_codigo_representante(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_codigo_representante() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  _chars  TEXT    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code   TEXT    := '';
  _i      INT;
  _exists BOOLEAN := TRUE;
BEGIN
  WHILE _exists LOOP
    _code := '';
    FOR _i IN 1..8 LOOP
      _code := _code || SUBSTR(_chars, CEIL(RANDOM() * LENGTH(_chars))::INT, 1);
    END LOOP;
    -- Formata como XXXX-XXXX para legibilidade
    _code := SUBSTR(_code, 1, 4) || '-' || SUBSTR(_code, 5, 4);
    SELECT EXISTS(SELECT 1 FROM public.representantes WHERE codigo = _code) INTO _exists;
  END LOOP;
  RETURN _code;
END;
$$;


ALTER FUNCTION public.gerar_codigo_representante() OWNER TO postgres;


--
-- Name: FUNCTION gerar_codigo_representante(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_codigo_representante() IS 'Gera código único alfanumérico no formato XXXX-XXXX para identificação do representante';



--
-- Name: gerar_dados_relatorio(integer, integer, integer, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer DEFAULT 1, p_empresa_id integer DEFAULT NULL::integer, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date) RETURNS TABLE(secao character varying, tipo_dados character varying, dados jsonb, metadados jsonb)
    LANGUAGE plpgsql
    AS $$

DECLARE

    template_config RECORD;

BEGIN

    -- Buscar configuração do template

    SELECT * INTO template_config FROM relatorio_templates WHERE id = p_template_id;

    

    -- Seção: Resumo Executivo

    RETURN QUERY

    SELECT 

        'resumo_executivo'::VARCHAR as secao,

        'estatisticas_gerais'::VARCHAR as tipo_dados,

        jsonb_build_object(

            'total_funcionarios', COUNT(DISTINCT f.cpf),

            'total_avaliacoes', COUNT(a.id),

            'avaliacoes_concluidas', COUNT(CASE WHEN a.status = 'concluida' THEN 1 END),

            'taxa_conclusao', ROUND((COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2)

        ) as dados,

        jsonb_build_object(

            'periodo', COALESCE(p_data_inicio::TEXT, '2024-01-01') || ' a ' || COALESCE(p_data_fim::TEXT, CURRENT_DATE::TEXT),

            'clinica_id', p_clinica_id,

            'empresa_filtro', CASE WHEN p_empresa_id IS NOT NULL THEN 'específica' ELSE 'todas' END

        ) as metadados

    FROM funcionarios f

    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf

    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id 

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND (p_data_inicio IS NULL OR a.created_at >= p_data_inicio)

        AND (p_data_fim IS NULL OR a.created_at <= p_data_fim);

    

    -- Seção: Análise por Domínios

    RETURN QUERY

    SELECT 

        'analise_dominios'::VARCHAR as secao,

        'scores_por_grupo'::VARCHAR as tipo_dados,

        jsonb_agg(

            jsonb_build_object(

                'grupo', grupo_num,

                'dominio', dominio_nome,

                'score_medio', score_medio,

                'categoria', categoria,

                'total_respostas', total_respostas

            )

        ) as dados,

        jsonb_build_object(

            'metodologia', 'COPSOQ-III',

            'escala', '0-100',

            'interpretacao', 'alto=75+, medio=50-74, baixo=0-49'

        ) as metadados

    FROM (

        SELECT 

            r.grupo as grupo_num,

            CASE r.grupo

                WHEN 1 THEN 'Demandas no Trabalho'

                WHEN 2 THEN 'Organização e Conteúdo'

                WHEN 3 THEN 'Relações Sociais'

                WHEN 4 THEN 'Liderança'

                WHEN 5 THEN 'Valores Organizacionais'

                WHEN 6 THEN 'Saúde e Bem-estar'

                WHEN 7 THEN 'Comportamentos Ofensivos'

                WHEN 8 THEN 'Jogos de Apostas'

                WHEN 9 THEN 'Endividamento'

                ELSE 'Outros'

            END as dominio_nome,

            ROUND(AVG(r.valor), 2) as score_medio,

            CASE 

                WHEN AVG(r.valor) >= 75 THEN 'Alto'

                WHEN AVG(r.valor) >= 50 THEN 'Médio'

                ELSE 'Baixo'

            END as categoria,

            COUNT(r.valor) as total_respostas

        FROM respostas r

        JOIN avaliacoes a ON r.avaliacao_id = a.id

        JOIN funcionarios f ON a.funcionario_cpf = f.cpf

        LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

        WHERE f.clinica_id = p_clinica_id 

            AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

            AND a.status = 'concluida'

        GROUP BY r.grupo

        ORDER BY r.grupo

    ) dados_grupos;

    

    -- Seção: Alertas e Recomendações

    RETURN QUERY

    SELECT 

        'alertas_recomendacoes'::VARCHAR as secao,

        'analise_critica'::VARCHAR as tipo_dados,

        jsonb_build_object(

            'alertas_criticos', ARRAY[

                'Comportamentos ofensivos detectados em ' || COUNT(CASE WHEN r.grupo = 8 AND r.valor > 0 THEN 1 END) || ' respostas',

                'Alto risco de Jogos de Apostas em ' || COUNT(CASE WHEN r.grupo = 9 AND r.valor > 50 THEN 1 END) || ' casos',

                'Problemas de endividamento em ' || COUNT(CASE WHEN r.grupo = 10 AND r.valor > 75 THEN 1 END) || ' funcionários'

            ],

            'recomendacoes_prioritarias', ARRAY[

                'Implementar programa de prevenção ao assédio e violência',

                'Oferecer orientação financeira e sobre jogos responsáveis',

                'Revisar carga de trabalho e organização das demandas',

                'Fortalecer canais de comunicação e feedback'

            ]

        ) as dados,

        jsonb_build_object(

            'base_analise', 'Respostas com pontuação de risco',

            'criterios', 'Grupos 8,9,10 com scores > limites críticos',

            'urgencia', 'Alta para comportamentos ofensivos'

        ) as metadados

    FROM respostas r

    JOIN avaliacoes a ON r.avaliacao_id = a.id

    JOIN funcionarios f ON a.funcionario_cpf = f.cpf

    LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id 

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND a.status = 'concluida'

        AND r.grupo IN (8, 9, 10);

        

END;

$$;


ALTER FUNCTION public.gerar_dados_relatorio(p_clinica_id integer, p_template_id integer, p_empresa_id integer, p_data_inicio date, p_data_fim date) OWNER TO postgres;


--
-- Name: gerar_token_lead(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gerar_token_lead() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  _token  TEXT;
  _exists BOOLEAN := TRUE;
BEGIN
  WHILE _exists LOOP
    -- 32 bytes = 64 hex chars
    SELECT encode(gen_random_bytes(32), 'hex') INTO _token;
    SELECT EXISTS(
      SELECT 1 FROM public.leads_representante WHERE token_atual = _token
    ) INTO _exists;
  END LOOP;
  RETURN _token;
END;
$$;


ALTER FUNCTION public.gerar_token_lead() OWNER TO postgres;


--
-- Name: FUNCTION gerar_token_lead(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.gerar_token_lead() IS 'Gera token único de 64 chars para o link de convite de um lead';



--
-- Name: get_resultados_por_empresa(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer DEFAULT NULL::integer) RETURNS TABLE(empresa_id integer, empresa_nome character varying, grupo integer, dominio character varying, media_score numeric, categoria character varying, total_respostas bigint)
    LANGUAGE plpgsql
    AS $$

BEGIN

    RETURN QUERY

    SELECT 

        ec.id as empresa_id,

        ec.nome as empresa_nome,

        r.grupo,

        CASE r.grupo

            WHEN 1 THEN 'Demandas no Trabalho'

            WHEN 2 THEN 'Organização e Conteúdo'

            WHEN 3 THEN 'Relações Sociais'

            WHEN 4 THEN 'Liderança'

            WHEN 5 THEN 'Valores Organizacionais'

            WHEN 6 THEN 'Saúde e Bem-estar'

            WHEN 7 THEN 'Comportamentos Ofensivos'

            WHEN 8 THEN 'Jogos de Apostas'

            WHEN 9 THEN 'Endividamento'

            ELSE 'Outros'

        END as dominio,

        AVG(r.valor) as media_score,

        CASE 

            WHEN AVG(r.valor) >= 75 THEN 'alto'

            WHEN AVG(r.valor) >= 50 THEN 'medio'

            ELSE 'baixo'

        END as categoria,

        COUNT(r.valor) as total_respostas

    FROM respostas r

    JOIN avaliacoes a ON r.avaliacao_id = a.id

    JOIN funcionarios f ON a.funcionario_cpf = f.cpf

    JOIN empresas_clientes ec ON f.empresa_id = ec.id

    WHERE f.clinica_id = p_clinica_id

        AND (p_empresa_id IS NULL OR ec.id = p_empresa_id)

        AND a.status = 'concluida'

    GROUP BY ec.id, ec.nome, r.grupo

    ORDER BY ec.nome, r.grupo;

END;

$$;


ALTER FUNCTION public.get_resultados_por_empresa(p_clinica_id integer, p_empresa_id integer) OWNER TO postgres;


--
-- Name: job_auto_cancelar_comissoes_congeladas(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.job_auto_cancelar_comissoes_congeladas() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.comissoes_laudo
  SET    status = 'cancelada',
         atualizado_em = NOW()
  WHERE  status = 'congelada_aguardando_admin'
    AND  auto_cancelamento_em IS NOT NULL
    AND  auto_cancelamento_em <= NOW();

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


ALTER FUNCTION public.job_auto_cancelar_comissoes_congeladas() OWNER TO postgres;


--
-- Name: FUNCTION job_auto_cancelar_comissoes_congeladas(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.job_auto_cancelar_comissoes_congeladas() IS 'Cancel automático de comissões congeladas sem decisão Admin em 30 dias. Executado pelo cron diário.';



--
-- Name: job_encerrar_vinculos_expirados(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.job_encerrar_vinculos_expirados() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.vinculos_comissao
  SET    status        = 'encerrado',
         encerrado_em  = NOW(),
         encerrado_motivo = 'Vínculo de 1 ano expirou sem renovação'
  WHERE  status IN ('ativo', 'inativo', 'suspenso')
    AND  data_expiracao <= CURRENT_DATE;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


ALTER FUNCTION public.job_encerrar_vinculos_expirados() OWNER TO postgres;


--
-- Name: FUNCTION job_encerrar_vinculos_expirados(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.job_encerrar_vinculos_expirados() IS 'Encerra vínculos com data_expiracao <= CURRENT_DATE. Executado pelo cron diário à meia-noite.';



--
-- Name: job_expirar_leads_vencidos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.job_expirar_leads_vencidos() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.leads_representante
  SET    status = 'expirado'
  WHERE  status = 'pendente'
    AND  data_expiracao <= NOW();

  GET DIAGNOSTICS _count = ROW_COUNT;

  IF _count > 0 THEN
    INSERT INTO public.comissionamento_auditoria
      (tabela, registro_id, status_anterior, status_novo, triggador, motivo)
    SELECT 'leads_representante', id, 'pendente', 'expirado', 'job', '90 dias sem conversão'
    FROM   public.leads_representante
    WHERE  status = 'expirado'
      AND  atualizado_em >= NOW() - INTERVAL '5 minutes';
  END IF;

  RETURN _count;
END;
$$;


ALTER FUNCTION public.job_expirar_leads_vencidos() OWNER TO postgres;


--
-- Name: FUNCTION job_expirar_leads_vencidos(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.job_expirar_leads_vencidos() IS 'Expira leads com data_expiracao <= NOW(). Executado pelo cron diário.';



--
-- Name: job_marcar_vinculos_inativos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.job_marcar_vinculos_inativos() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.vinculos_comissao
  SET    status = 'inativo'
  WHERE  status = 'ativo'
    AND  (ultimo_laudo_em IS NULL OR ultimo_laudo_em <= NOW() - INTERVAL '90 days')
    AND  data_expiracao > CURRENT_DATE;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


ALTER FUNCTION public.job_marcar_vinculos_inativos() OWNER TO postgres;


--
-- Name: FUNCTION job_marcar_vinculos_inativos(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.job_marcar_vinculos_inativos() IS 'Marca como inativo vínculos sem laudo por 90+ dias. Executado pelo cron diário.';



--
-- Name: liberar_comissoes_retidas(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.liberar_comissoes_retidas(p_representante_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.comissoes_laudo
  SET    status           = 'aprovada',
         data_aprovacao   = NOW()
  WHERE  representante_id = p_representante_id
    AND  status = 'retida';

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;


ALTER FUNCTION public.liberar_comissoes_retidas(p_representante_id integer) OWNER TO postgres;


--
-- Name: FUNCTION liberar_comissoes_retidas(p_representante_id integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.liberar_comissoes_retidas(p_representante_id integer) IS 'Chamada quando representante vira apto. Transita todas comissões retidas para aprovada.';



--
-- Name: obter_config_clinica(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.obter_config_clinica(p_clinica_id integer, p_chave text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_valor JSONB;
BEGIN
  SELECT campos_customizados->p_chave INTO v_valor
  FROM clinica_configuracoes
  WHERE clinica_id = p_clinica_id;
  
  RETURN COALESCE(v_valor, '{}'::JSONB);
END;
$$;


ALTER FUNCTION public.obter_config_clinica(p_clinica_id integer, p_chave text) OWNER TO postgres;


--
-- Name: registrar_auditoria_comissionamento(character varying, integer, character varying, character varying, character varying, text, jsonb, character); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_auditoria_comissionamento(p_tabela character varying, p_registro_id integer, p_status_ant character varying, p_status_novo character varying, p_triggador character varying, p_motivo text DEFAULT NULL::text, p_dados_extras jsonb DEFAULT NULL::jsonb, p_cpf character DEFAULT NULL::bpchar) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.comissionamento_auditoria (
    tabela, registro_id, status_anterior, status_novo,
    triggador, motivo, dados_extras, criado_por_cpf
  ) VALUES (
    p_tabela, p_registro_id, p_status_ant, p_status_novo,
    p_triggador, p_motivo, p_dados_extras,
    COALESCE(p_cpf, NULLIF(current_setting('app.current_user_cpf', TRUE), ''))
  );
END;
$$;


ALTER FUNCTION public.registrar_auditoria_comissionamento(p_tabela character varying, p_registro_id integer, p_status_ant character varying, p_status_novo character varying, p_triggador character varying, p_motivo text, p_dados_extras jsonb, p_cpf character) OWNER TO postgres;


--
-- Name: set_atualizado_em_comissionamento(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_atualizado_em_comissionamento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.atualizado_em := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_atualizado_em_comissionamento() OWNER TO postgres;


--
-- Name: set_hierarquia_comercial_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_hierarquia_comercial_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_hierarquia_comercial_updated_at() OWNER TO postgres;


--
-- Name: sync_entidade_contratante_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_entidade_contratante_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- APENAS para lotes de entidade (não clínica)
  IF NEW.clinica_id IS NULL THEN
    -- Se entidade_id foi definido, copiar para contratante_id (legado)
    IF NEW.entidade_id IS NOT NULL AND NEW.contratante_id IS NULL THEN
      NEW.contratante_id := NEW.entidade_id;
    END IF;
    
    -- Se contratante_id foi definido (código legado), copiar para entidade_id
    IF NEW.contratante_id IS NOT NULL AND NEW.entidade_id IS NULL THEN
      NEW.entidade_id := NEW.contratante_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_entidade_contratante_id() OWNER TO postgres;




--
-- Name: trg_auditar_comissao_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_auditar_comissao_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'comissoes_laudo', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'sistema',
      'Mudança de status comissão'
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_auditar_comissao_status() OWNER TO postgres;


--
-- Name: trg_auditar_representante_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_auditar_representante_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'representantes', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'admin_action',
      'Mudança de status representante'
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_auditar_representante_status() OWNER TO postgres;


--
-- Name: trg_auditar_vinculo_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_auditar_vinculo_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.registrar_auditoria_comissionamento(
      'vinculos_comissao', NEW.id,
      OLD.status::TEXT, NEW.status::TEXT,
      'sistema',
      'Mudança de status vínculo'
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_auditar_vinculo_status() OWNER TO postgres;


--
-- Name: trg_gerar_codigo_representante(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_gerar_codigo_representante() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := public.gerar_codigo_representante();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_gerar_codigo_representante() OWNER TO postgres;


--
-- Name: update_funcionarios_entidades_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_funcionarios_entidades_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_funcionarios_entidades_timestamp() OWNER TO postgres;


--
-- Name: validar_parcelas_json(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_parcelas_json() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Se há parcelas_json, validar estrutura
    IF NEW.parcelas_json IS NOT NULL THEN
        -- Verificar se é um array
        IF jsonb_typeof(NEW.parcelas_json) != 'array' THEN
            RAISE EXCEPTION 'parcelas_json deve ser um array';
        END IF;
        
        -- Se parcelado, deve ter parcelas
        IF NEW.modalidade_pagamento = 'parcelado' AND jsonb_array_length(NEW.parcelas_json) < 2 THEN
            RAISE EXCEPTION 'Pagamento parcelado deve ter pelo menos 2 parcelas';
        END IF;
        
        -- Validar que numero_parcelas coincide com tamanho do array
        IF NEW.numero_parcelas IS NOT NULL AND NEW.numero_parcelas != jsonb_array_length(NEW.parcelas_json) THEN
            RAISE EXCEPTION 'numero_parcelas deve coincidir com quantidade de parcelas em parcelas_json';
        END IF;
    END IF;
    
    -- Se modalidade é parcelado, deve ter parcelas_json
    IF NEW.modalidade_pagamento = 'parcelado' AND NEW.parcelas_json IS NULL THEN
        RAISE EXCEPTION 'Pagamento parcelado deve conter detalhes das parcelas em parcelas_json';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_parcelas_json() OWNER TO postgres;


--
-- Name: validate_funcionario_entidade_tipo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_funcionario_entidade_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validar que entidade_id existe e Ã© do tipo 'entidade'
    IF NOT EXISTS (
        SELECT 1 FROM entidades 
        WHERE id = NEW.entidade_id AND tipo = 'entidade'
    ) THEN
        RAISE EXCEPTION 'entidade_id % nÃ£o Ã© do tipo entidade ou nÃ£o existe', NEW.entidade_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_funcionario_entidade_tipo() OWNER TO postgres;


--
-- Name: verificar_lead_ativo_por_cnpj(character); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_lead_ativo_por_cnpj(p_cnpj character) RETURNS TABLE(lead_id integer, representante_id integer, data_expiracao timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.representante_id, l.data_expiracao
  FROM   public.leads_representante l
  WHERE  l.cnpj    = p_cnpj
    AND  l.status  = 'pendente'
    AND  l.data_expiracao > NOW()
  LIMIT 1;
END;
$$;


ALTER FUNCTION public.verificar_lead_ativo_por_cnpj(p_cnpj character) OWNER TO postgres;


--
-- Name: FUNCTION verificar_lead_ativo_por_cnpj(p_cnpj character); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.verificar_lead_ativo_por_cnpj(p_cnpj character) IS 'Verifica se há lead ativo para um CNPJ. Retorna representante_id se existir. NUNCA expõe o nome do representante — apenas o ID interno.';


SET default_tablespace = '';

SET default_table_access_method = heap;


--
-- Name: comissionamento_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comissionamento_auditoria (
    id bigint NOT NULL,
    tabela character varying(50) NOT NULL,
    registro_id integer NOT NULL,
    status_anterior character varying(60),
    status_novo character varying(60) NOT NULL,
    triggador character varying(30) NOT NULL,
    motivo text,
    dados_extras jsonb,
    criado_por_cpf character(11),
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comissionamento_auditoria OWNER TO postgres;


--
-- Name: TABLE comissionamento_auditoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.comissionamento_auditoria IS 'Log imutável de todas as transições de status no módulo de comissionamento';



--
-- Name: comissionamento_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comissionamento_auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comissionamento_auditoria_id_seq OWNER TO postgres;


--
-- Name: comissionamento_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comissionamento_auditoria_id_seq OWNED BY public.comissionamento_auditoria.id;



--
-- Name: comissoes_laudo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comissoes_laudo (
    id integer NOT NULL,
    vinculo_id integer NOT NULL,
    representante_id integer NOT NULL,
    entidade_id integer NOT NULL,
    laudo_id integer NOT NULL,
    percentual_comissao numeric(5,2) DEFAULT 40.00 NOT NULL,
    valor_laudo numeric(10,2) NOT NULL,
    valor_comissao numeric(10,2) NOT NULL,
    status public.status_comissao DEFAULT 'retida'::public.status_comissao NOT NULL,
    motivo_congelamento public.motivo_congelamento,
    mes_emissao date NOT NULL,
    mes_pagamento date,
    data_emissao_laudo timestamp with time zone NOT NULL,
    data_aprovacao timestamp with time zone,
    data_liberacao timestamp with time zone,
    data_pagamento timestamp with time zone,
    nf_rpa_enviada_em timestamp with time zone,
    nf_rpa_aprovada_em timestamp with time zone,
    nf_rpa_rejeitada_em timestamp with time zone,
    nf_rpa_motivo_rejeicao text,
    comprovante_pagamento_path text,
    sla_admin_aviso_em timestamp with time zone,
    auto_cancelamento_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    parcela_numero integer DEFAULT 1 NOT NULL,
    total_parcelas integer DEFAULT 1 NOT NULL,
    percentual_custas_plataforma numeric(5,2) DEFAULT 25.00 NOT NULL,
    valor_comissionavel numeric(10,2) DEFAULT 0 NOT NULL,
    nf_path text,
    nf_nome_arquivo text,
    lote_pagamento_id integer,
    parcela_confirmada_em timestamp with time zone,
    CONSTRAINT chk_parcela_numero_valido CHECK (((parcela_numero >= 1) AND (parcela_numero <= total_parcelas))),
    CONSTRAINT chk_total_parcelas_valido CHECK (((total_parcelas >= 1) AND (total_parcelas <= 12)))
);


ALTER TABLE public.comissoes_laudo OWNER TO postgres;


--
-- Name: TABLE comissoes_laudo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.comissoes_laudo IS 'Comissão gerada para um representante a cada laudo emitido e pago. Status: retida→aprovada→congelada→liberada→paga ou cancelada.';



--
-- Name: comissoes_laudo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comissoes_laudo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comissoes_laudo_id_seq OWNER TO postgres;


--
-- Name: comissoes_laudo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comissoes_laudo_id_seq OWNED BY public.comissoes_laudo.id;





--
-- Name: contratos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    numero_funcionarios integer,
    valor_total numeric(12,2),
    status public.status_aprovacao_enum DEFAULT 'pendente'::public.status_aprovacao_enum NOT NULL,
    aceito boolean DEFAULT false NOT NULL,
    pagamento_confirmado boolean DEFAULT false NOT NULL,
    conteudo text,
    criado_em timestamp without time zone DEFAULT now(),
    atualizado_em timestamp without time zone,
    aceito_em timestamp without time zone,
    ip_aceite character varying(64),
    data_aceite timestamp without time zone,
    hash_contrato character varying(128),
    conteudo_gerado text,
    data_pagamento timestamp without time zone,
    criado_por_cpf character varying(11),
    entidade_id integer,
    tomador_id integer,
    tipo_tomador character varying(50) DEFAULT 'entidade'::character varying
);


ALTER TABLE public.contratos OWNER TO postgres;


--
-- Name: TABLE contratos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contratos IS 'Contratos gerados para contratantes. Fluxo simplificado sem tabelas intermediárias.';



--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contratos_id_seq OWNER TO postgres;


--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;





--
-- Name: empresas_clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresas_clientes (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    cnpj character varying(18) NOT NULL,
    email character varying(100),
    telefone character varying(20),
    endereco text,
    cidade character varying(50),
    estado character varying(2),
    cep character varying(10),
    ativa boolean DEFAULT true,
    clinica_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    representante_nome text,
    representante_fone character varying(30),
    representante_email character varying(100),
    responsavel_email text,
    cartao_cnpj_path character varying,
    contrato_social_path character varying,
    doc_identificacao_path character varying,
    cartao_cnpj_arquivo_remoto_provider character varying(50),
    cartao_cnpj_arquivo_remoto_bucket character varying(255),
    cartao_cnpj_arquivo_remoto_key character varying(2048),
    cartao_cnpj_arquivo_remoto_url text,
    contrato_social_arquivo_remoto_provider character varying(50),
    contrato_social_arquivo_remoto_bucket character varying(255),
    contrato_social_arquivo_remoto_key character varying(2048),
    contrato_social_arquivo_remoto_url text,
    doc_identificacao_arquivo_remoto_provider character varying(50),
    doc_identificacao_arquivo_remoto_bucket character varying(255),
    doc_identificacao_arquivo_remoto_key character varying(2048),
    doc_identificacao_arquivo_remoto_url text
);


ALTER TABLE public.empresas_clientes OWNER TO postgres;


--
-- Name: TABLE empresas_clientes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.empresas_clientes IS 'View vw_comparativo_empresas removida (usava empresa_id direta)';



--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empresas_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empresas_clientes_id_seq OWNER TO postgres;


--
-- Name: empresas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empresas_clientes_id_seq OWNED BY public.empresas_clientes.id;



--
-- Name: entidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidades (
    id integer DEFAULT nextval('public.seq_contratantes_id'::regclass) NOT NULL,
    nome character varying(200) NOT NULL,
    cnpj character varying(18) NOT NULL,
    inscricao_estadual character varying(50),
    email character varying(100) NOT NULL,
    telefone character varying(20) NOT NULL,
    endereco text NOT NULL,
    cidade character varying(100) NOT NULL,
    estado character varying(2) NOT NULL,
    cep character varying(10) NOT NULL,
    responsavel_nome character varying(100) NOT NULL,
    responsavel_cpf character varying(11) NOT NULL,
    responsavel_cargo character varying(100),
    responsavel_email character varying(100) NOT NULL,
    responsavel_celular character varying(20) NOT NULL,
    cartao_cnpj_path character varying(500),
    contrato_social_path character varying(500),
    doc_identificacao_path character varying(500),
    status public.status_aprovacao_enum DEFAULT 'pendente'::public.status_aprovacao_enum,
    motivo_rejeicao text,
    observacoes_reanalise text,
    ativa boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    aprovado_em timestamp without time zone,
    aprovado_por_cpf character varying(11),
    pagamento_confirmado boolean DEFAULT false,
    numero_funcionarios_estimado integer,
    data_primeiro_pagamento timestamp without time zone,
    data_liberacao_login timestamp without time zone,
    contrato_aceito boolean DEFAULT false,
    tipo character varying(50) DEFAULT 'entidade'::character varying,
    cartao_cnpj_arquivo_remoto_provider character varying(50),
    cartao_cnpj_arquivo_remoto_bucket character varying(255),
    cartao_cnpj_arquivo_remoto_key character varying(2048),
    cartao_cnpj_arquivo_remoto_url text,
    contrato_social_arquivo_remoto_provider character varying(50),
    contrato_social_arquivo_remoto_bucket character varying(255),
    contrato_social_arquivo_remoto_key character varying(2048),
    contrato_social_arquivo_remoto_url text,
    doc_identificacao_arquivo_remoto_provider character varying(50),
    doc_identificacao_arquivo_remoto_bucket character varying(255),
    doc_identificacao_arquivo_remoto_key character varying(2048),
    doc_identificacao_arquivo_remoto_url text
);


ALTER TABLE public.entidades OWNER TO postgres;


--
-- Name: TABLE entidades; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.entidades IS 'Entidades contratantes do sistema (empresas que contratam avaliações).
    Renomeada de "contratantes" em Migration 420 (2026-02-05).';



--
-- Name: entidades_senhas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidades_senhas (
    id integer NOT NULL,
    entidade_id integer NOT NULL,
    cpf character varying(11) NOT NULL,
    senha_hash text NOT NULL,
    primeira_senha_alterada boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp with time zone
);


ALTER TABLE public.entidades_senhas OWNER TO postgres;


--
-- Name: TABLE entidades_senhas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.entidades_senhas IS 'Tabela de senhas de gestores de entidades';



--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entidades_senhas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entidades_senhas_id_seq OWNER TO postgres;


--
-- Name: entidades_senhas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entidades_senhas_id_seq OWNED BY public.entidades_senhas.id;



--
-- Name: funcionarios_entidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionarios_entidades (
    id integer NOT NULL,
    funcionario_id integer NOT NULL,
    entidade_id integer NOT NULL,
    ativo boolean DEFAULT true,
    data_vinculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_desvinculo timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    setor character varying(100),
    funcao character varying(100),
    matricula character varying(20),
    nivel_cargo character varying(50),
    turno character varying(50),
    escala character varying(50),
    indice_avaliacao integer DEFAULT 0 NOT NULL,
    data_ultimo_lote timestamp without time zone
);


ALTER TABLE public.funcionarios_entidades OWNER TO postgres;


--
-- Name: TABLE funcionarios_entidades; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.funcionarios_entidades IS 'Relacionamento M:N entre funcionÃ¡rios e entidades (tomadores tipo=entidade). Permite histÃ³rico de vÃ­nculos.';



--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funcionarios_entidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funcionarios_entidades_id_seq OWNER TO postgres;


--
-- Name: funcionarios_entidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funcionarios_entidades_id_seq OWNED BY public.funcionarios_entidades.id;



--
-- Name: hierarquia_comercial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hierarquia_comercial (
    id integer NOT NULL,
    vendedor_id integer NOT NULL,
    representante_id integer,
    ativo boolean DEFAULT true NOT NULL,
    percentual_override numeric(5,2),
    obs text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hierarquia_comercial OWNER TO postgres;


--
-- Name: hierarquia_comercial_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hierarquia_comercial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hierarquia_comercial_id_seq OWNER TO postgres;


--
-- Name: hierarquia_comercial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hierarquia_comercial_id_seq OWNED BY public.hierarquia_comercial.id;



--
-- Name: leads_representante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads_representante (
    id integer NOT NULL,
    representante_id integer NOT NULL,
    cnpj character(14) NOT NULL,
    razao_social character varying(200),
    contato_nome character varying(150),
    contato_email character varying(150),
    contato_telefone character varying(20),
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    data_expiracao timestamp with time zone DEFAULT (now() + '90 days'::interval) NOT NULL,
    status public.status_lead DEFAULT 'pendente'::public.status_lead NOT NULL,
    tipo_conversao public.tipo_conversao_lead,
    entidade_id integer,
    data_conversao timestamp with time zone,
    token_atual character varying(64),
    token_gerado_em timestamp with time zone,
    token_expiracao timestamp with time zone,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    valor_negociado numeric(12,2) DEFAULT 0 NOT NULL,
    vendedor_id integer,
    origem text DEFAULT 'representante'::text NOT NULL,
    CONSTRAINT lead_cnpj_valido CHECK ((cnpj ~ '^\d{14}$'::text)),
    CONSTRAINT leads_representante_origem_check CHECK ((origem = ANY (ARRAY['representante'::text, 'vendedor'::text, 'landing_page'::text])))
);


ALTER TABLE public.leads_representante OWNER TO postgres;


--
-- Name: TABLE leads_representante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leads_representante IS 'Leads de indicação criados pelo representante. Um CNPJ só pode ter um lead ativo por vez. Após 90 dias sem conversão, o lead expira e o CNPJ fica livre para nova indicação.';



--
-- Name: leads_representante_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_representante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_representante_id_seq OWNER TO postgres;


--
-- Name: leads_representante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_representante_id_seq OWNED BY public.leads_representante.id;





--
-- Name: representantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.representantes (
    id integer NOT NULL,
    tipo_pessoa public.tipo_pessoa_representante DEFAULT 'pf'::public.tipo_pessoa_representante NOT NULL,
    nome character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    telefone character varying(20) NOT NULL,
    cpf character(11),
    cnpj character(14),
    cpf_responsavel_pj character(11),
    codigo character varying(12) NOT NULL,
    banco_codigo character varying(5),
    agencia character varying(10),
    conta character varying(20),
    tipo_conta character varying(20),
    titular_conta character varying(150),
    pix_chave character varying(150),
    pix_tipo character varying(20),
    doc_identificacao_path text,
    comprovante_conta_path text,
    status public.status_representante DEFAULT 'ativo'::public.status_representante NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    aceite_termos boolean DEFAULT false NOT NULL,
    aceite_termos_em timestamp with time zone,
    aceite_disclaimer_nv boolean DEFAULT false NOT NULL,
    aceite_disclaimer_nv_em timestamp with time zone,
    bloqueio_conflito_pf_id integer,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    aprovado_em timestamp with time zone,
    aprovado_por_cpf character(11),
    percentual_comissao numeric(5,2) DEFAULT NULL::numeric,
    senha_hash character varying(60),
    CONSTRAINT representante_cnpj_valido CHECK (((cnpj ~ '^\d{14}$'::text) OR (cnpj IS NULL))),
    CONSTRAINT representante_cpf_responsavel_valido CHECK (((cpf_responsavel_pj ~ '^\d{11}$'::text) OR (cpf_responsavel_pj IS NULL))),
    CONSTRAINT representante_cpf_valido CHECK (((cpf ~ '^\d{11}$'::text) OR (cpf IS NULL))),
    CONSTRAINT representante_pf_tem_cpf CHECK (((tipo_pessoa = 'pj'::public.tipo_pessoa_representante) OR (cpf IS NOT NULL))),
    CONSTRAINT representante_pj_tem_cnpj CHECK (((tipo_pessoa = 'pf'::public.tipo_pessoa_representante) OR (cnpj IS NOT NULL))),
    CONSTRAINT representante_pj_tem_cpf_responsavel CHECK (((tipo_pessoa = 'pf'::public.tipo_pessoa_representante) OR (cpf_responsavel_pj IS NOT NULL)))
);


ALTER TABLE public.representantes OWNER TO postgres;


--
-- Name: TABLE representantes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.representantes IS 'Representantes comerciais independentes que indicam clínicas/entidades ao QWork';



--
-- Name: representantes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.representantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.representantes_id_seq OWNER TO postgres;


--
-- Name: representantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.representantes_id_seq OWNED BY public.representantes.id;



--
-- Name: templates_contrato; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates_contrato (
    id integer NOT NULL,
    nome text NOT NULL,
    descricao text,
    tipo_template text NOT NULL,
    conteudo text NOT NULL,
    ativo boolean DEFAULT true,
    padrao boolean DEFAULT false,
    versao integer DEFAULT 1,
    criado_em timestamp without time zone DEFAULT now(),
    criado_por_cpf text,
    atualizado_em timestamp without time zone DEFAULT now(),
    atualizado_por_cpf text,
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT templates_contrato_tipo_template_check CHECK ((tipo_template = ANY (ARRAY['plano_fixo'::text, 'padrao'::text])))
);


ALTER TABLE public.templates_contrato OWNER TO postgres;


--
-- Name: TABLE templates_contrato; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.templates_contrato IS 'Templates editaveis para geracao de contratos';



--
-- Name: templates_contrato_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.templates_contrato_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templates_contrato_id_seq OWNER TO postgres;


--
-- Name: templates_contrato_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.templates_contrato_id_seq OWNED BY public.templates_contrato.id;



--
-- Name: tomadores; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.tomadores AS
 SELECT entidades.id,
    entidades.nome,
    entidades.cnpj,
    'entidade'::character varying(20) AS tipo,
    entidades.email,
    entidades.responsavel_nome,
    entidades.responsavel_cpf,
    entidades.responsavel_email,
    entidades.responsavel_celular,
    entidades.ativa,
    entidades.pagamento_confirmado,
    entidades.status,
    entidades.numero_funcionarios_estimado,
    entidades.criado_em,
    entidades.atualizado_em
   FROM public.entidades
  WHERE (entidades.id IS NOT NULL)
UNION ALL
 SELECT clinicas.id,
    clinicas.nome,
    clinicas.cnpj,
    'clinica'::character varying(20) AS tipo,
    clinicas.email,
    clinicas.responsavel_nome,
    clinicas.responsavel_cpf,
    clinicas.responsavel_email,
    clinicas.responsavel_celular,
    clinicas.ativa,
    clinicas.pagamento_confirmado,
    clinicas.status,
    clinicas.numero_funcionarios_estimado,
    clinicas.criado_em,
    clinicas.atualizado_em
   FROM public.clinicas
  WHERE (clinicas.id IS NOT NULL);


ALTER VIEW public.tomadores OWNER TO postgres;


--
-- Name: vinculos_comissao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vinculos_comissao (
    id integer NOT NULL,
    representante_id integer NOT NULL,
    entidade_id integer NOT NULL,
    lead_id integer,
    data_inicio date NOT NULL,
    data_expiracao date NOT NULL,
    status public.status_vinculo DEFAULT 'ativo'::public.status_vinculo NOT NULL,
    ultimo_laudo_em timestamp with time zone,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    encerrado_em timestamp with time zone,
    encerrado_motivo text,
    valor_negociado numeric(12,2) DEFAULT NULL::numeric,
    clinica_id integer,
    CONSTRAINT vinculo_datas_validas CHECK ((data_expiracao > data_inicio)),
    CONSTRAINT vinculo_valor_negociado_positivo CHECK (((valor_negociado IS NULL) OR (valor_negociado >= (0)::numeric)))
);


ALTER TABLE public.vinculos_comissao OWNER TO postgres;


--
-- Name: TABLE vinculos_comissao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.vinculos_comissao IS 'Vínculo entre representante e entidade/clínica que gera direito a comissão. Dura 1 ano da data de cadastro do cliente; renovável manualmente.';



--
-- Name: vinculos_comissao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vinculos_comissao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vinculos_comissao_id_seq OWNER TO postgres;


--
-- Name: vinculos_comissao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vinculos_comissao_id_seq OWNED BY public.vinculos_comissao.id;



--
-- Name: comissionamento_auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissionamento_auditoria ALTER COLUMN id SET DEFAULT nextval('public.comissionamento_auditoria_id_seq'::regclass);



--
-- Name: comissoes_laudo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo ALTER COLUMN id SET DEFAULT nextval('public.comissoes_laudo_id_seq'::regclass);





--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);





--
-- Name: empresas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes ALTER COLUMN id SET DEFAULT nextval('public.empresas_clientes_id_seq'::regclass);



--
-- Name: entidades_senhas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas ALTER COLUMN id SET DEFAULT nextval('public.entidades_senhas_id_seq'::regclass);



--
-- Name: funcionarios_entidades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_entidades ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_entidades_id_seq'::regclass);



--
-- Name: hierarquia_comercial id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hierarquia_comercial ALTER COLUMN id SET DEFAULT nextval('public.hierarquia_comercial_id_seq'::regclass);



--
-- Name: leads_representante id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante ALTER COLUMN id SET DEFAULT nextval('public.leads_representante_id_seq'::regclass);





--
-- Name: representantes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes ALTER COLUMN id SET DEFAULT nextval('public.representantes_id_seq'::regclass);



--
-- Name: templates_contrato id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato ALTER COLUMN id SET DEFAULT nextval('public.templates_contrato_id_seq'::regclass);



--
-- Name: vinculos_comissao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao ALTER COLUMN id SET DEFAULT nextval('public.vinculos_comissao_id_seq'::regclass);



--
-- Name: comissionamento_auditoria comissionamento_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissionamento_auditoria
    ADD CONSTRAINT comissionamento_auditoria_pkey PRIMARY KEY (id);



--
-- Name: comissoes_laudo comissoes_laudo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_pkey PRIMARY KEY (id);





--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);





--
-- Name: empresas_clientes empresas_clientes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_cnpj_key UNIQUE (cnpj);



--
-- Name: empresas_clientes empresas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas_clientes
    ADD CONSTRAINT empresas_clientes_pkey PRIMARY KEY (id);



--
-- Name: entidades entidades_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_cnpj_key UNIQUE (cnpj);



--
-- Name: entidades entidades_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_email_key UNIQUE (email);



--
-- Name: entidades entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT entidades_pkey PRIMARY KEY (id);



--
-- Name: entidades_senhas entidades_senhas_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_cpf_key UNIQUE (cpf);



--
-- Name: entidades_senhas entidades_senhas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT entidades_senhas_pkey PRIMARY KEY (id);



--
-- Name: funcionarios_entidades funcionarios_entidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_pkey PRIMARY KEY (id);



--
-- Name: funcionarios_entidades funcionarios_entidades_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_unique UNIQUE (funcionario_id, entidade_id);



--
-- Name: hierarquia_comercial hierarquia_comercial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hierarquia_comercial
    ADD CONSTRAINT hierarquia_comercial_pkey PRIMARY KEY (id);



--
-- Name: hierarquia_comercial hierarquia_comercial_vendedor_rep_unico; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hierarquia_comercial
    ADD CONSTRAINT hierarquia_comercial_vendedor_rep_unico UNIQUE (vendedor_id, representante_id);



--
-- Name: leads_representante leads_representante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante
    ADD CONSTRAINT leads_representante_pkey PRIMARY KEY (id);



--
-- Name: leads_representante leads_representante_token_atual_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante
    ADD CONSTRAINT leads_representante_token_atual_key UNIQUE (token_atual);





--
-- Name: representantes representantes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_cnpj_key UNIQUE (cnpj);



--
-- Name: representantes representantes_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_codigo_key UNIQUE (codigo);



--
-- Name: representantes representantes_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_cpf_key UNIQUE (cpf);



--
-- Name: representantes representantes_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_email_key UNIQUE (email);



--
-- Name: representantes representantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_pkey PRIMARY KEY (id);



--
-- Name: templates_contrato templates_contrato_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_nome_key UNIQUE (nome);



--
-- Name: templates_contrato templates_contrato_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates_contrato
    ADD CONSTRAINT templates_contrato_pkey PRIMARY KEY (id);



--
-- Name: vinculos_comissao vinculo_unico_ativo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculo_unico_ativo UNIQUE (representante_id, entidade_id);



--
-- Name: vinculos_comissao vinculos_comissao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculos_comissao_pkey PRIMARY KEY (id);



--
-- Name: entidades_senhas_entidade_cpf_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX entidades_senhas_entidade_cpf_unique ON public.entidades_senhas USING btree (entidade_id, cpf);



--
-- Name: idx_comissionamento_auditoria_criado_em; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissionamento_auditoria_criado_em ON public.comissionamento_auditoria USING btree (criado_em DESC);



--
-- Name: idx_comissionamento_auditoria_tabela_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissionamento_auditoria_tabela_id ON public.comissionamento_auditoria USING btree (tabela, registro_id);



--
-- Name: idx_comissoes_auto_cancelamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_auto_cancelamento ON public.comissoes_laudo USING btree (auto_cancelamento_em) WHERE (status = 'congelada_aguardando_admin'::public.status_comissao);



--
-- Name: idx_comissoes_laudo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_laudo_id ON public.comissoes_laudo USING btree (laudo_id);



--
-- Name: idx_comissoes_lote_rep_unico; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_comissoes_lote_rep_unico ON public.comissoes_laudo USING btree (lote_pagamento_id, representante_id) WHERE (lote_pagamento_id IS NOT NULL);



--
-- Name: idx_comissoes_mes_pagamento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_mes_pagamento ON public.comissoes_laudo USING btree (mes_pagamento);



--
-- Name: idx_comissoes_parcela_pendente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_parcela_pendente ON public.comissoes_laudo USING btree (lote_pagamento_id, parcela_numero) WHERE (parcela_confirmada_em IS NULL);



--
-- Name: idx_comissoes_representante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_representante_id ON public.comissoes_laudo USING btree (representante_id);



--
-- Name: idx_comissoes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_status ON public.comissoes_laudo USING btree (status);



--
-- Name: idx_comissoes_vinculo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comissoes_vinculo_id ON public.comissoes_laudo USING btree (vinculo_id);







--
-- Name: idx_contratos_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_entidade_id ON public.contratos USING btree (entidade_id);





--
-- Name: idx_contratos_numero_funcionarios; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_numero_funcionarios ON public.contratos USING btree (numero_funcionarios);





--
-- Name: idx_contratos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_status ON public.contratos USING btree (status);





--
-- Name: idx_contratos_tipo_tomador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_tipo_tomador ON public.contratos USING btree (tipo_tomador);



--
-- Name: idx_contratos_tomador_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contratos_tomador_id ON public.contratos USING btree (tomador_id);



--
-- Name: idx_empresas_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_ativa ON public.empresas_clientes USING btree (ativa);



--
-- Name: idx_empresas_clientes_clinica_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clientes_clinica_id ON public.empresas_clientes USING btree (clinica_id);



--
-- Name: idx_empresas_clinica; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clinica ON public.empresas_clientes USING btree (clinica_id);



--
-- Name: idx_empresas_clinica_ativa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_clinica_ativa ON public.empresas_clientes USING btree (clinica_id) WHERE (ativa = true);



--
-- Name: idx_empresas_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empresas_cnpj ON public.empresas_clientes USING btree (cnpj);



--
-- Name: idx_entidades_senhas_entidade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidades_senhas_entidade ON public.entidades_senhas USING btree (entidade_id);



--
-- Name: idx_entidades_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entidades_tipo ON public.entidades USING btree (tipo);



--
-- Name: idx_func_entidades_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_entidades_ativo ON public.funcionarios_entidades USING btree (ativo);



--
-- Name: idx_func_entidades_entidade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_entidades_entidade ON public.funcionarios_entidades USING btree (entidade_id);



--
-- Name: idx_func_entidades_entidade_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_entidades_entidade_ativo ON public.funcionarios_entidades USING btree (entidade_id, ativo) WHERE (ativo = true);



--
-- Name: idx_func_entidades_funcionario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_entidades_funcionario ON public.funcionarios_entidades USING btree (funcionario_id);



--
-- Name: idx_func_entidades_nivel_cargo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_func_entidades_nivel_cargo ON public.funcionarios_entidades USING btree (nivel_cargo);



--
-- Name: idx_hierarquia_comercial_representante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hierarquia_comercial_representante_id ON public.hierarquia_comercial USING btree (representante_id) WHERE (ativo = true);



--
-- Name: idx_hierarquia_comercial_vendedor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hierarquia_comercial_vendedor_id ON public.hierarquia_comercial USING btree (vendedor_id) WHERE (ativo = true);



--
-- Name: idx_leads_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_cnpj ON public.leads_representante USING btree (cnpj);



--
-- Name: idx_leads_data_expiracao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_data_expiracao ON public.leads_representante USING btree (data_expiracao);



--
-- Name: idx_leads_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_entidade_id ON public.leads_representante USING btree (entidade_id) WHERE (entidade_id IS NOT NULL);



--
-- Name: idx_leads_representante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_representante_id ON public.leads_representante USING btree (representante_id);



--
-- Name: idx_leads_representante_vendedor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_representante_vendedor_id ON public.leads_representante USING btree (vendedor_id) WHERE (vendedor_id IS NOT NULL);



--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_status ON public.leads_representante USING btree (status);



--
-- Name: idx_representantes_cnpj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_representantes_cnpj ON public.representantes USING btree (cnpj) WHERE (cnpj IS NOT NULL);



--
-- Name: idx_representantes_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_representantes_codigo ON public.representantes USING btree (codigo);



--
-- Name: idx_representantes_cpf; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_representantes_cpf ON public.representantes USING btree (cpf) WHERE (cpf IS NOT NULL);



--
-- Name: idx_representantes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_representantes_status ON public.representantes USING btree (status);



--
-- Name: idx_templates_contrato_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_ativo ON public.templates_contrato USING btree (ativo) WHERE (ativo = true);



--
-- Name: idx_templates_contrato_padrao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_padrao ON public.templates_contrato USING btree (tipo_template, padrao) WHERE (padrao = true);



--
-- Name: idx_templates_contrato_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_contrato_tipo ON public.templates_contrato USING btree (tipo_template);



--
-- Name: idx_vinculos_data_expiracao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vinculos_data_expiracao ON public.vinculos_comissao USING btree (data_expiracao);



--
-- Name: idx_vinculos_entidade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vinculos_entidade_id ON public.vinculos_comissao USING btree (entidade_id);



--
-- Name: idx_vinculos_representante_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vinculos_representante_id ON public.vinculos_comissao USING btree (representante_id);



--
-- Name: idx_vinculos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vinculos_status ON public.vinculos_comissao USING btree (status);



--
-- Name: leads_cnpj_ativo_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX leads_cnpj_ativo_unique ON public.leads_representante USING btree (cnpj) WHERE (status = 'pendente'::public.status_lead);



--
-- Name: empresas_clientes audit_empresas_clientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER audit_empresas_clientes AFTER INSERT OR DELETE OR UPDATE ON public.empresas_clientes FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();



--
-- Name: comissoes_laudo trg_comissao_status_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_comissao_status_audit AFTER UPDATE ON public.comissoes_laudo FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_comissao_status();



--
-- Name: comissoes_laudo trg_comissoes_atualizado_em; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_comissoes_atualizado_em BEFORE UPDATE ON public.comissoes_laudo FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();



--
-- Name: entidades trg_criar_usuario_apos_aprovacao; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_criar_usuario_apos_aprovacao AFTER UPDATE ON public.entidades FOR EACH ROW EXECUTE FUNCTION public.criar_usuario_responsavel_apos_aprovacao();



--
-- Name: hierarquia_comercial trg_hierarquia_comercial_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_hierarquia_comercial_updated_at BEFORE UPDATE ON public.hierarquia_comercial FOR EACH ROW EXECUTE FUNCTION public.set_hierarquia_comercial_updated_at();



--
-- Name: leads_representante trg_leads_atualizado_em; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_leads_atualizado_em BEFORE UPDATE ON public.leads_representante FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();



--
-- Name: representantes trg_representante_codigo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_representante_codigo BEFORE INSERT ON public.representantes FOR EACH ROW EXECUTE FUNCTION public.trg_gerar_codigo_representante();



--
-- Name: representantes trg_representante_status_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_representante_status_audit AFTER UPDATE ON public.representantes FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_representante_status();



--
-- Name: representantes trg_representantes_atualizado_em; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_representantes_atualizado_em BEFORE UPDATE ON public.representantes FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();





--
-- Name: funcionarios_entidades trg_validate_funcionario_entidade_tipo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_validate_funcionario_entidade_tipo BEFORE INSERT OR UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.validate_funcionario_entidade_tipo();



--
-- Name: vinculos_comissao trg_vinculo_status_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vinculo_status_audit AFTER UPDATE ON public.vinculos_comissao FOR EACH ROW EXECUTE FUNCTION public.trg_auditar_vinculo_status();



--
-- Name: vinculos_comissao trg_vinculos_atualizado_em; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_vinculos_atualizado_em BEFORE UPDATE ON public.vinculos_comissao FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em_comissionamento();



--
-- Name: templates_contrato trigger_garantir_template_padrao_unico; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_garantir_template_padrao_unico BEFORE INSERT OR UPDATE ON public.templates_contrato FOR EACH ROW WHEN ((new.padrao = true)) EXECUTE FUNCTION public.garantir_template_padrao_unico();



--
-- Name: funcionarios_entidades trigger_update_funcionarios_entidades_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_funcionarios_entidades_timestamp BEFORE UPDATE ON public.funcionarios_entidades FOR EACH ROW EXECUTE FUNCTION public.update_funcionarios_entidades_timestamp();



--
-- Name: comissoes_laudo comissoes_laudo_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE RESTRICT;



--
-- Name: comissoes_laudo comissoes_laudo_laudo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_laudo_id_fkey FOREIGN KEY (laudo_id) REFERENCES public.laudos(id) ON DELETE RESTRICT;



--
-- Name: comissoes_laudo comissoes_laudo_lote_pagamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_lote_pagamento_id_fkey FOREIGN KEY (lote_pagamento_id) REFERENCES public.lotes_avaliacao(id);



--
-- Name: comissoes_laudo comissoes_laudo_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id) ON DELETE RESTRICT;



--
-- Name: comissoes_laudo comissoes_laudo_vinculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes_laudo
    ADD CONSTRAINT comissoes_laudo_vinculo_id_fkey FOREIGN KEY (vinculo_id) REFERENCES public.vinculos_comissao(id) ON DELETE RESTRICT;





--
-- Name: entidades_senhas fk_entidades_senhas_entidade; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades_senhas
    ADD CONSTRAINT fk_entidades_senhas_entidade FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;



--
-- Name: funcionarios_entidades funcionarios_entidades_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios_entidades
    ADD CONSTRAINT funcionarios_entidades_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;



--
-- Name: hierarquia_comercial hierarquia_comercial_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hierarquia_comercial
    ADD CONSTRAINT hierarquia_comercial_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id) ON DELETE SET NULL;



--
-- Name: hierarquia_comercial hierarquia_comercial_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hierarquia_comercial
    ADD CONSTRAINT hierarquia_comercial_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;



--
-- Name: leads_representante leads_representante_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante
    ADD CONSTRAINT leads_representante_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE SET NULL;



--
-- Name: leads_representante leads_representante_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante
    ADD CONSTRAINT leads_representante_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id) ON DELETE RESTRICT;



--
-- Name: leads_representante leads_representante_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads_representante
    ADD CONSTRAINT leads_representante_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;



--
-- Name: representantes representantes_bloqueio_conflito_pf_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.representantes
    ADD CONSTRAINT representantes_bloqueio_conflito_pf_id_fkey FOREIGN KEY (bloqueio_conflito_pf_id) REFERENCES public.representantes(id);



--
-- Name: vinculos_comissao vinculos_comissao_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculos_comissao_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id) ON DELETE RESTRICT;



--
-- Name: vinculos_comissao vinculos_comissao_entidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculos_comissao_entidade_id_fkey FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE RESTRICT;



--
-- Name: vinculos_comissao vinculos_comissao_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculos_comissao_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads_representante(id) ON DELETE SET NULL;



--
-- Name: vinculos_comissao vinculos_comissao_representante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vinculos_comissao
    ADD CONSTRAINT vinculos_comissao_representante_id_fkey FOREIGN KEY (representante_id) REFERENCES public.representantes(id) ON DELETE RESTRICT;



--
-- Name: comissionamento_auditoria auditoria_admin_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY auditoria_admin_only ON public.comissionamento_auditoria FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: comissionamento_auditoria; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.comissionamento_auditoria ENABLE ROW LEVEL SECURITY;


--
-- Name: comissoes_laudo; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.comissoes_laudo ENABLE ROW LEVEL SECURITY;


--
-- Name: comissoes_laudo comissoes_rep_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY comissoes_rep_own ON public.comissoes_laudo USING (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text, 'suporte'::text])))) WITH CHECK (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text, 'suporte'::text]))));



--
-- Name: empresas_clientes empresas_admin_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_admin_delete ON public.empresas_clientes FOR DELETE USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: empresas_clientes empresas_admin_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_admin_insert ON public.empresas_clientes FOR INSERT WITH CHECK ((public.current_user_perfil() = 'admin'::text));



--
-- Name: empresas_clientes empresas_admin_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_admin_select ON public.empresas_clientes FOR SELECT USING ((public.current_user_perfil() = 'admin'::text));



--
-- Name: empresas_clientes empresas_admin_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_admin_update ON public.empresas_clientes FOR UPDATE USING ((public.current_user_perfil() = 'admin'::text)) WITH CHECK ((public.current_user_perfil() = 'admin'::text));



--
-- Name: empresas_clientes empresas_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_block_admin ON public.empresas_clientes AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: empresas_clientes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.empresas_clientes ENABLE ROW LEVEL SECURITY;


--
-- Name: empresas_clientes empresas_rh_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY empresas_rh_select ON public.empresas_clientes FOR SELECT USING (((public.current_user_perfil() = 'rh'::text) AND (clinica_id = public.current_user_clinica_id())));



--
-- Name: entidades; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;


--
-- Name: funcionarios_entidades; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.funcionarios_entidades ENABLE ROW LEVEL SECURITY;


--
-- Name: funcionarios_entidades funcionarios_entidades_block_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_entidades_block_admin ON public.funcionarios_entidades AS RESTRICTIVE USING ((public.current_user_perfil() <> 'admin'::text));



--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_entidades_gestor_delete ON public.funcionarios_entidades FOR DELETE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));



--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_entidades_gestor_insert ON public.funcionarios_entidades FOR INSERT WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));



--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_entidades_gestor_select ON public.funcionarios_entidades FOR SELECT USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));



--
-- Name: funcionarios_entidades funcionarios_entidades_gestor_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY funcionarios_entidades_gestor_update ON public.funcionarios_entidades FOR UPDATE USING (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id()))) WITH CHECK (((public.current_user_perfil() = 'gestor'::text) AND (entidade_id = public.current_user_entidade_id())));



--
-- Name: hierarquia_comercial hc_admin_comercial_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY hc_admin_comercial_all ON public.hierarquia_comercial USING ((public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text]))) WITH CHECK ((public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text])));



--
-- Name: hierarquia_comercial hc_suporte_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY hc_suporte_select ON public.hierarquia_comercial FOR SELECT USING ((public.current_user_perfil() = 'suporte'::text));



--
-- Name: hierarquia_comercial hc_vendedor_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY hc_vendedor_own ON public.hierarquia_comercial FOR SELECT USING (((public.current_user_perfil() = 'vendedor'::text) AND (vendedor_id = ( SELECT usuarios.id
   FROM public.usuarios
  WHERE ((usuarios.cpf)::text = public.current_user_cpf())
 LIMIT 1))));



--
-- Name: hierarquia_comercial; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hierarquia_comercial ENABLE ROW LEVEL SECURITY;


--
-- Name: leads_representante leads_rep_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY leads_rep_own ON public.leads_representante USING (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text])))) WITH CHECK (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text]))));



--
-- Name: leads_representante; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.leads_representante ENABLE ROW LEVEL SECURITY;


--
-- Name: representantes rep_insert_public; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rep_insert_public ON public.representantes FOR INSERT WITH CHECK (true);



--
-- Name: representantes rep_sees_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rep_sees_own ON public.representantes FOR SELECT USING (((id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text, 'suporte'::text]))));



--
-- Name: representantes rep_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rep_update_own ON public.representantes FOR UPDATE USING (((id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text])))) WITH CHECK (((id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text]))));



--
-- Name: representantes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.representantes ENABLE ROW LEVEL SECURITY;


--
-- Name: empresas_clientes rh_empresas_proprias; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY rh_empresas_proprias ON public.empresas_clientes USING (((current_setting('app.current_user_perfil'::text, true) = 'rh'::text) AND ((clinica_id)::text = current_setting('app.current_user_clinica_id'::text, true))));



--
-- Name: vinculos_comissao; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.vinculos_comissao ENABLE ROW LEVEL SECURITY;


--
-- Name: vinculos_comissao vinculos_rep_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY vinculos_rep_own ON public.vinculos_comissao USING (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text, 'suporte'::text])))) WITH CHECK (((representante_id = public.current_representante_id()) OR (public.current_user_perfil() = ANY (ARRAY['admin'::text, 'comercial'::text]))));


