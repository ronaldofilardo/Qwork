-- ETAPA 14: Relatórios PDF e Excel
-- Sistema completo de geração de relatórios com análises estatísticas

-- 1. Criar tabela para armazenar templates de relatórios
CREATE TABLE IF NOT EXISTS relatorio_templates (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) CHECK (
        tipo IN ('pdf', 'excel', 'ambos')
    ) NOT NULL,
    descricao TEXT,
    campos_incluidos JSONB, -- Campos a serem incluídos no relatório
    filtros_padrao JSONB, -- Filtros padrão aplicados
    formato_saida VARCHAR(20) DEFAULT 'A4',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir templates padrão de relatórios
INSERT INTO
    relatorio_templates (
        nome,
        tipo,
        descricao,
        campos_incluidos,
        filtros_padrao
    )
VALUES (
        'Relatório Executivo COPSOQ-III',
        'pdf',
        'Relatório executivo com principais indicadores',
        '{"grupos": [1,2,3,4,5,6], "graficos": ["barras", "pizza"], "estatisticas": true, "recomendacoes": true}',
        '{"periodo": "ultimo_mes", "status": ["concluido"]}'
    ),
    (
        'Análise Detalhada por Empresa',
        'excel',
        'Planilha com dados detalhados por empresa cliente',
        '{"todos_dados": true, "pivot_tables": true, "graficos_excel": true}',
        '{"incluir_empresas": "todas", "nivel_detalhe": "completo"}'
    ),
    (
        'Dashboard Gerencial',
        'ambos',
        'Relatório completo para gestores de RH',
        '{"resumo_executivo": true, "comparativos": true, "tendencias": true, "alertas": true}',
        '{"visao": "gerencial", "confidencialidade": "alta"}'
    ),
    (
        'Relatório Comportamental',
        'pdf',
        'Foco em questões comportamentais (jogos, violência, endividamento)',
        '{"grupos": [8,9,10], "alertas_criticos": true, "recomendacoes_especializadas": true}',
        '{"apenas_respostas_positivas": true, "nivel_alerta": "alto"}'
    );

-- 3. Criar função para gerar dados do relatório
CREATE OR REPLACE FUNCTION gerar_dados_relatorio(
    p_clinica_id INTEGER,
    p_template_id INTEGER DEFAULT 1,
    p_empresa_id INTEGER DEFAULT NULL,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
) RETURNS TABLE(
    secao VARCHAR,
    tipo_dados VARCHAR,
    dados JSONB,
    metadados JSONB
) AS $$
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
            'avaliacoes_concluidas', COUNT(CASE WHEN a.status = 'concluido' THEN 1 END),
            'taxa_conclusao', ROUND((COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2),
            'funcionarios_operacionais', COUNT(DISTINCT CASE WHEN f.nivel_cargo = 'operacional' THEN f.cpf END),
            'funcionarios_gestao', COUNT(DISTINCT CASE WHEN f.nivel_cargo = 'gestao' THEN f.cpf END)
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
                WHEN 2 THEN 'Organização e Conteúdo do Trabalho'
                WHEN 3 THEN 'Relações Sociais e Liderança'
                WHEN 4 THEN 'Interface Trabalho-Indivíduo'
                WHEN 5 THEN 'Valores Organizacionais'
                WHEN 6 THEN 'Traços de Personalidade'
                WHEN 7 THEN 'Saúde e Bem-Estar'
                WHEN 8 THEN 'Comportamentos Ofensivos'
                WHEN 9 THEN 'Comportamento de Jogo'
                WHEN 10 THEN 'Endividamento Financeiro'
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
            AND a.status = 'concluido'
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
        AND a.status = 'concluido'
        AND r.grupo IN (8, 9, 10);
        
END;
$$ LANGUAGE plpgsql;

-- 4. Criar view para dados de exportação Excel
CREATE OR REPLACE VIEW vw_export_excel AS
SELECT 
    f.cpf,
    f.nome as funcionario_nome,
    f.setor,
    f.funcao,
    f.nivel_cargo,
    f.turno,
    f.escala,
    ec.nome as empresa,
    a.id as avaliacao_id,
    a.status as avaliacao_status,
    a.created_at::DATE as data_avaliacao,
    r.grupo,
    r.item,
    r.valor as resposta_valor,
    CASE r.grupo
        WHEN 1 THEN 'Demandas no Trabalho'
        WHEN 2 THEN 'Organização e Conteúdo do Trabalho'
        WHEN 3 THEN 'Relações Sociais e Liderança'
        WHEN 4 THEN 'Interface Trabalho-Indivíduo'
        WHEN 5 THEN 'Valores Organizacionais'
        WHEN 6 THEN 'Traços de Personalidade'
        WHEN 7 THEN 'Saúde e Bem-Estar'
        WHEN 8 THEN 'Comportamentos Ofensivos'
        WHEN 9 THEN 'Comportamento de Jogo'
        WHEN 10 THEN 'Endividamento Financeiro'
        ELSE 'Outros'
    END as dominio_nome
FROM funcionarios f
LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
LEFT JOIN respostas r ON a.id = r.avaliacao_id
WHERE f.perfil = 'funcionario'
ORDER BY f.nome, a.created_at, r.grupo, r.item;

-- 5. Verificar sistema de relatórios
SELECT '=== TEMPLATES DE RELATÓRIOS ===' as titulo;

SELECT id, nome, tipo, descricao
FROM relatorio_templates
ORDER BY id;

SELECT '=== EXEMPLO DE DADOS PARA RELATÓRIO ===' as titulo;

SELECT
    secao,
    tipo_dados,
    dados,
    metadados
FROM gerar_dados_relatorio (1, 1, NULL, NULL, NULL)
LIMIT 3;

SELECT '=== DADOS PARA EXPORTAÇÃO EXCEL ===' as titulo;

SELECT
    COUNT(*) as total_registros,
    COUNT(DISTINCT funcionario_nome) as funcionarios,
    COUNT(DISTINCT empresa) as empresas
FROM vw_export_excel
WHERE
    cpf IN ('87545772900', '87545772901');

SELECT '✅ ETAPA 14 CONCLUÍDA - RELATÓRIOS PDF/EXCEL IMPLEMENTADOS!' as resultado;

SELECT '🎉 PLANO DE IMPLEMENTAÇÃO INCREMENTAL 100% CONCLUÍDO!' as final_status;
