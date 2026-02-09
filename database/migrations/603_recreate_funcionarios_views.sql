-- Migration: 603_recreate_funcionarios_views.sql
-- Descricao: Recria views usando tabelas intermediarias (funcionarios_entidades e funcionarios_clinicas)
-- Data: 2026-02-08
-- Depende: 600_create_funcionarios_relationships.sql, 602_fix_empresas_clientes.sql

-- =============================================================================
-- DROP views antigas que dependem das FKs diretas
-- =============================================================================

DROP VIEW IF EXISTS vw_funcionarios_por_lote CASCADE;
DROP VIEW IF EXISTS vw_analise_grupos_negativos CASCADE;
DROP VIEW IF EXISTS vw_empresas_stats CASCADE;
DROP VIEW IF EXISTS v_relatorio_emissoes CASCADE;

RAISE NOTICE 'Views antigas removidas';

-- =============================================================================
-- VIEW: vw_funcionarios_por_lote
-- Lista funcionarios com suas avaliacoes e lotes, incluindo contexto (entidade/clinica)
-- =============================================================================

CREATE OR REPLACE VIEW vw_funcionarios_por_lote AS
SELECT
    f.id AS funcionario_id,
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
    
    -- Contexto: entidade ou clinica
    COALESCE(fe.entidade_id, fc.clinica_id) AS source_id,
    CASE
        WHEN fe.id IS NOT NULL THEN 'entidade'::text
        WHEN fc.id IS NOT NULL THEN 'clinica'::text
        ELSE NULL::text
    END as source_type,
    
    -- Dados especificos de clinica
    fc.clinica_id,
    fc.empresa_id,
    
    -- Dados da avaliacao
    a.id as avaliacao_id,
    a.status as status_avaliacao,
    a.inicio as data_inicio,
    a.envio as data_conclusao,
    
    -- Dados do lote
    a.lote_id,
    l.status as lote_status,
    l.tipo as lote_tipo

FROM funcionarios f
LEFT JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id AND fe.ativo = true
LEFT JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id AND fc.ativo = true
LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE f.perfil = 'funcionario';

COMMENT ON VIEW vw_funcionarios_por_lote IS 
'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias.
Inclui source_id e source_type para identificar o contexto (entidade ou clinica).
IMPORTANTE: Funcionarios podem aparecer em ambos contextos se tiverem vinculos historicos.';

-- =============================================================================
-- VIEW: vw_empresas_stats
-- Estatisticas de empresas com contadores de funcionarios
-- =============================================================================

CREATE OR REPLACE VIEW vw_empresas_stats AS
SELECT
    ec.id,
    ec.nome,
    ec.cnpj,
    ec.clinica_id,
    ec.ativa,
    c.nome AS clinica_nome,
    
    -- Contadores via tabela intermediaria
    COUNT(fc.id) FILTER (WHERE fc.ativo = true) AS total_funcionarios,
    COUNT(a.id) FILTER (WHERE a.status = 'concluida') AS total_avaliacoes_concluidas,
    COUNT(DISTINCT l.id) AS total_lotes
    
FROM empresas_clientes ec
INNER JOIN clinicas c ON c.id = ec.clinica_id
LEFT JOIN funcionarios_clinicas fc ON fc.empresa_id = ec.id
LEFT JOIN funcionarios f ON f.id = fc.funcionario_id AND fc.ativo = true
LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
GROUP BY ec.id, ec.nome, ec.cnpj, ec.clinica_id, ec.ativa, c.nome;

COMMENT ON VIEW vw_empresas_stats IS 
'Estatisticas de empresas com contadores de funcionarios e avaliacoes.
Usa funcionarios_clinicas para contagem correta em arquitetura segregada.';

-- =============================================================================
-- VIEW: v_relatorio_emissoes
-- Relatorio de emissoes de laudos
-- =============================================================================

CREATE OR REPLACE VIEW v_relatorio_emissoes AS
SELECT
    l.id AS lote_id,
    l.tipo AS lote_tipo,
    l.status AS lote_status,
    l.liberado_em,
    
    -- Contexto: clinica ou entidade
    CASE
        WHEN l.clinica_id IS NOT NULL THEN 'clinica'::text
        WHEN l.entidade_id IS NOT NULL THEN 'entidade'::text
        ELSE NULL::text
    END as fonte_tipo,
    
    COALESCE(c.nome, t.nome) AS fonte_nome,
    COALESCE(l.clinica_id, l.entidade_id) AS fonte_id,
    
    -- Empresa (apenas para clinicas)
    ec.nome AS empresa_nome,
    l.empresa_id,
    
    -- Dados do laudo
    ld.id AS laudo_id,
    ld.status AS laudo_status,
    ld.emitido_em AS laudo_emitido_em,
    ld.enviado_em AS laudo_enviado_em,
    ld.emissor_cpf,
    
    -- Contadores de avaliacoes via JOIN com funcionarios_clinicas ou funcionarios_entidades
    COUNT(DISTINCT a.id) AS total_avaliacoes,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') AS avaliacoes_concluidas

FROM lotes_avaliacao l
LEFT JOIN clinicas c ON c.id = l.clinica_id
LEFT JOIN tomadores t ON t.id = l.entidade_id
LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
LEFT JOIN laudos ld ON ld.lote_id = l.id
LEFT JOIN avaliacoes a ON a.lote_id = l.id
GROUP BY 
    l.id, l.tipo, l.status, l.liberado_em,
    l.clinica_id, l.entidade_id, l.empresa_id,
    c.nome, t.nome, ec.nome,
    ld.id, ld.status, ld.emitido_em, ld.enviado_em, ld.emissor_cpf;

COMMENT ON VIEW v_relatorio_emissoes IS 
'Relatorio de emissoes de laudos com contexto (clinica ou entidade).
Compativel com arquitetura segregada de tomadores.';

-- =============================================================================
-- VALIDACAO FINAL
-- =============================================================================

DO $$
BEGIN
    -- Verificar se as views foram criadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.views 
                   WHERE table_schema = 'public' 
                   AND table_name = 'vw_funcionarios_por_lote') THEN
        RAISE EXCEPTION 'View vw_funcionarios_por_lote nao foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.views 
                   WHERE table_schema = 'public' 
                   AND table_name = 'vw_empresas_stats') THEN
        RAISE EXCEPTION 'View vw_empresas_stats nao foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.views 
                   WHERE table_schema = 'public' 
                   AND table_name = 'v_relatorio_emissoes') THEN
        RAISE EXCEPTION 'View v_relatorio_emissoes nao foi criada';
    END IF;
    
    RAISE NOTICE 'Migration 603: Views recriadas com sucesso usando tabelas intermediarias';
END $$;
