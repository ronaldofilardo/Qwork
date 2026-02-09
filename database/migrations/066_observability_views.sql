-- Migration: 066_observability_views.sql
-- Description: Create views for metrics and monitoring (clinica + entidade aggregated)
-- Date: 2026-01-04
-- Priority: P2.1 - MÉDIA (Observability & Alerting)

BEGIN;

\echo '=== MIGRATION 066: Criando views de observability e métricas ==='

-- View: Resumo de lotes por contratante (clínica ou entidade)
CREATE OR REPLACE VIEW vw_lotes_por_contratante AS
SELECT
    COALESCE(la.clinica_id, NULL) as clinica_id,
    COALESCE(la.contratante_id, NULL) as contratante_id,
    CASE 
        WHEN la.clinica_id IS NOT NULL THEN 'clinica'
        WHEN la.contratante_id IS NOT NULL THEN 'entidade'
        ELSE 'desconhecido'
    END as tipo_contratante,
    COALESCE(c.nome, cont.nome, 'N/A') as nome_contratante,
    la.status,
    COUNT(*) as total_lotes,
    COUNT(CASE WHEN la.auto_emitir_agendado = true THEN 1 END) as lotes_agendados,
    COUNT(CASE WHEN la.auto_emitir_em <= NOW() AND la.status = 'concluido' THEN 1 END) as lotes_atrasados,
    AVG(EXTRACT(EPOCH FROM (NOW() - la.liberado_em)) / 86400) as idade_media_dias
FROM lotes_avaliacao la
LEFT JOIN clinicas c ON la.clinica_id = c.id
LEFT JOIN tomadores cont ON la.contratante_id = cont.id
WHERE la.status != 'cancelado'
GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, la.status;

COMMENT ON VIEW vw_lotes_por_contratante IS 
'Métricas agregadas de lotes por contratante (clínica ou entidade), incluindo lotes atrasados e agendados';

\echo '066.1 View vw_lotes_por_contratante criada'

-- View: Alertas de lotes stuck (sem progresso por mais de 48h)
CREATE OR REPLACE VIEW vw_alertas_lotes_stuck AS
SELECT
    la.id as lote_id,
    
    la.status,
    COALESCE(ec.nome, cont.nome) as empresa_nome,
    COALESCE(c.nome, cont.nome) as clinica_nome,
    CASE 
        WHEN la.clinica_id IS NOT NULL THEN 'clinica'
        WHEN la.contratante_id IS NOT NULL THEN 'entidade'
        ELSE 'desconhecido'
    END as tipo_contratante,
    la.liberado_em,
    la.atualizado_em,
    EXTRACT(EPOCH FROM (NOW() - la.atualizado_em)) / 3600 as horas_sem_atualizacao,
    COUNT(a.id) as total_avaliacoes,
    COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
    la.auto_emitir_em,
    la.auto_emitir_agendado
FROM lotes_avaliacao la
LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
LEFT JOIN clinicas c ON ec.clinica_id = c.id
LEFT JOIN tomadores cont ON la.contratante_id = cont.id
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.status IN ('ativo', 'concluido', 'finalizado')
  AND la.atualizado_em < NOW() - INTERVAL '48 hours'
GROUP BY la.id,  la.status, ec.nome, cont.nome, c.nome, la.liberado_em, la.atualizado_em, la.auto_emitir_em, la.auto_emitir_agendado, la.clinica_id, la.contratante_id;

COMMENT ON VIEW vw_alertas_lotes_stuck IS 
'Lotes sem atualização há mais de 48h, indicando possível problema no fluxo';

\echo '066.2 View vw_alertas_lotes_stuck criada'

-- View: Métricas de emissão de laudos (velocidade e taxa de sucesso)
CREATE OR REPLACE VIEW vw_metricas_emissao_laudos AS
SELECT
    COALESCE(la.clinica_id, la.contratante_id) as contratante_ref_id,
    CASE 
        WHEN la.clinica_id IS NOT NULL THEN 'clinica'
        WHEN la.contratante_id IS NOT NULL THEN 'entidade'
        ELSE 'desconhecido'
    END as tipo_contratante,
    COALESCE(c.nome, cont.nome) as nome_contratante,
    DATE_TRUNC('day', l.criado_em) as data_emissao,
    COUNT(*) as laudos_emitidos,
    COUNT(CASE WHEN l.status = 'enviado' THEN 1 END) as laudos_enviados,
    AVG(EXTRACT(EPOCH FROM (l.emitido_em - la.liberado_em)) / 3600) as tempo_medio_emissao_horas,
    MIN(EXTRACT(EPOCH FROM (l.emitido_em - la.liberado_em)) / 3600) as tempo_minimo_horas,
    MAX(EXTRACT(EPOCH FROM (l.emitido_em - la.liberado_em)) / 3600) as tempo_maximo_horas
FROM laudos l
JOIN lotes_avaliacao la ON l.lote_id = la.id
LEFT JOIN clinicas c ON la.clinica_id = c.id
LEFT JOIN tomadores cont ON la.contratante_id = cont.id
WHERE l.criado_em >= NOW() - INTERVAL '30 days'
GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, DATE_TRUNC('day', l.criado_em)
ORDER BY data_emissao DESC;

COMMENT ON VIEW vw_metricas_emissao_laudos IS 
'Métricas de velocidade de emissão de laudos nos últimos 30 dias (clínica + entidade)';

\echo '066.3 View vw_metricas_emissao_laudos criada'

-- View: Health check simplificado (todos os tipos de contratante)
CREATE OR REPLACE VIEW vw_health_check_tomadores AS
SELECT
    COALESCE(la.clinica_id, la.contratante_id) as contratante_ref_id,
    CASE 
        WHEN la.clinica_id IS NOT NULL THEN 'clinica'
        WHEN la.contratante_id IS NOT NULL THEN 'entidade'
        ELSE 'desconhecido'
    END as tipo_contratante,
    COALESCE(c.nome, cont.nome) as nome_contratante,
    COUNT(DISTINCT la.id) as total_lotes_ativos,
    COUNT(DISTINCT CASE WHEN la.status = 'concluido' THEN la.id END) as lotes_concluidos_pendentes,
    COUNT(DISTINCT CASE WHEN la.auto_emitir_em <= NOW() AND la.status = 'concluido' THEN la.id END) as lotes_atrasados_critico,
    COALESCE(c.ativa, cont.ativa, false) as contratante_ativo,
    MAX(la.atualizado_em) as ultima_atividade
FROM lotes_avaliacao la
LEFT JOIN clinicas c ON la.clinica_id = c.id
LEFT JOIN tomadores cont ON la.contratante_id = cont.id
WHERE la.status != 'cancelado'
GROUP BY la.clinica_id, la.contratante_id, c.nome, cont.nome, c.ativa, cont.ativa;

COMMENT ON VIEW vw_health_check_tomadores IS 
'Health check rápido de todos os tomadores (clínicas e entidades) com lotes ativos';

\echo '066.4 View vw_health_check_tomadores criada'

-- Create indexes to improve view performance
CREATE INDEX IF NOT EXISTS idx_lotes_atualizado_em 
ON lotes_avaliacao (atualizado_em) 
WHERE status IN ('ativo', 'concluido', 'finalizado');

CREATE INDEX IF NOT EXISTS idx_lotes_tipo_contratante 
ON lotes_avaliacao (clinica_id, contratante_id, status);

CREATE INDEX IF NOT EXISTS idx_laudos_criado_em 
ON laudos (criado_em DESC);

\echo '066.5 Índices de performance criados'

COMMIT;

\echo '=== MIGRATION 066: Concluída com sucesso ==='
