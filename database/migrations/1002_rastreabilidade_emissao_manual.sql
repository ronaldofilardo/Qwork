-- ============================================================================
-- Migration 1002: Rastreabilidade de Emissão Manual de Laudos
-- Data: 2026-01-30
-- Descrição: Adiciona campos para registrar quem solicitou emissões manuais
-- ============================================================================
-- 
-- OBJETIVO: Garantir auditoria completa e rastreabilidade de solicitações
-- IMPACTO: Todas as solicitações manuais terão solicitante registrado
-- COMPLIANCE: LGPD, auditoria, não-repúdio
-- ============================================================================

BEGIN;

\echo '============================================='
\echo 'MIGRATION 1002: RASTREABILIDADE DE EMISSÕES'
\echo '============================================='

-- ============================================================================
-- 1. ADICIONAR CAMPOS DE RASTREABILIDADE EM FILA_EMISSAO
-- ============================================================================
\echo '1. Adicionando campos de rastreabilidade em fila_emissao...'

-- Campo: CPF do solicitante (RH ou gestor_entidade)
ALTER TABLE fila_emissao
ADD COLUMN IF NOT EXISTS solicitado_por VARCHAR(11);

COMMENT ON COLUMN fila_emissao.solicitado_por IS 
'CPF do RH ou gestor_entidade que solicitou a emissão manual do laudo';

-- Campo: Timestamp da solicitação
ALTER TABLE fila_emissao
ADD COLUMN IF NOT EXISTS solicitado_em TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN fila_emissao.solicitado_em IS 
'Timestamp exato da solicitação manual de emissão';

-- Campo: Tipo de solicitante (rh, gestor_entidade, admin)
ALTER TABLE fila_emissao
ADD COLUMN IF NOT EXISTS tipo_solicitante VARCHAR(20);

COMMENT ON COLUMN fila_emissao.tipo_solicitante IS 
'Perfil do usuário que solicitou: rh, gestor_entidade ou admin';

\echo '   ✓ Campos adicionados com sucesso'

-- ============================================================================
-- 2. CRIAR CONSTRAINT DE VALIDAÇÃO
-- ============================================================================
\echo '2. Criando constraint de validação...'

-- Constraint: tipo_solicitante deve ser um valor válido
ALTER TABLE fila_emissao
ADD CONSTRAINT fila_emissao_tipo_solicitante_check
CHECK (tipo_solicitante IN ('rh', 'gestor_entidade', 'admin') OR tipo_solicitante IS NULL);

-- Constraint: se solicitado_por existe, tipo_solicitante deve existir também
ALTER TABLE fila_emissao
ADD CONSTRAINT chk_fila_emissao_solicitante
CHECK (
    solicitado_por IS NULL OR 
    (solicitado_por IS NOT NULL AND tipo_solicitante IS NOT NULL)
);

\echo '   ✓ Constraints criadas'

-- ============================================================================
-- 3. CRIAR ÍNDICES PARA CONSULTAS DE AUDITORIA
-- ============================================================================
\echo '3. Criando índices de auditoria...'

-- Índice: Buscar solicitações por CPF
CREATE INDEX IF NOT EXISTS idx_fila_emissao_solicitado_por 
ON fila_emissao(solicitado_por);

-- Índice: Buscar solicitações por data (ordem decrescente para relatórios)
CREATE INDEX IF NOT EXISTS idx_fila_emissao_solicitado_em 
ON fila_emissao(solicitado_em DESC);

-- Índice: Buscar solicitações por tipo de solicitante
CREATE INDEX IF NOT EXISTS idx_fila_emissao_tipo_solicitante 
ON fila_emissao(tipo_solicitante);

-- Índice composto: Buscar por solicitante + data
CREATE INDEX IF NOT EXISTS idx_fila_emissao_solicitante_data 
ON fila_emissao(solicitado_por, solicitado_em DESC)
WHERE solicitado_por IS NOT NULL;

\echo '   ✓ Índices criados'

-- ============================================================================
-- 4. CRIAR VIEW DE AUDITORIA COMPLETA
-- ============================================================================
\echo '4. Criando view de auditoria completa...'

CREATE OR REPLACE VIEW v_auditoria_emissoes AS
SELECT 
    l.id AS laudo_id,
    l.lote_id,
    
    la.contratante_id,
    la.empresa_id,
    
    -- Solicitante (da fila_emissao)
    fe.solicitado_por AS solicitante_cpf,
    fe.tipo_solicitante AS solicitante_perfil,
    fe.solicitado_em AS solicitado_em,
    
    -- Emissor (de laudos)
    l.emissor_cpf,
    l.emitido_em,
    
    -- Status
    l.status AS laudo_status,
    la.status AS lote_status,
    
    -- Hash (imutabilidade)
    l.hash_pdf,
    
    -- Auditoria
    al.acao AS ultima_acao,
    al.criado_em AS auditoria_em
    
FROM laudos l
INNER JOIN lotes_avaliacao la ON l.lote_id = la.id
LEFT JOIN fila_emissao fe ON l.lote_id = fe.lote_id
LEFT JOIN LATERAL (
    SELECT acao, criado_em
    FROM auditoria_laudos
    WHERE lote_id = l.lote_id
    ORDER BY criado_em DESC
    LIMIT 1
) al ON true
ORDER BY l.emitido_em DESC NULLS LAST;

COMMENT ON VIEW v_auditoria_emissoes IS 
'View consolidada para auditoria: liga solicitante → emissor → laudo com rastreabilidade completa';

\echo '   ✓ View v_auditoria_emissoes criada'

-- ============================================================================
-- 5. CRIAR VIEW DE RELATÓRIO POR USUÁRIO
-- ============================================================================
\echo '5. Criando view de relatório por usuário...'

CREATE OR REPLACE VIEW v_relatorio_emissoes_usuario AS
SELECT 
    fe.solicitado_por AS cpf,
    fe.tipo_solicitante AS perfil,
    COUNT(*) AS total_solicitacoes,
    COUNT(CASE WHEN l.status = 'emitido' THEN 1 END) AS emissoes_sucesso,
    COUNT(CASE WHEN l.status = 'enviado' THEN 1 END) AS emissoes_enviadas,
    COUNT(CASE WHEN fe.erro IS NOT NULL THEN 1 END) AS emissoes_erro,
    COUNT(CASE WHEN l.id IS NULL AND fe.tentativas >= fe.max_tentativas THEN 1 END) AS emissoes_falhou,
    MIN(fe.solicitado_em) AS primeira_solicitacao,
    MAX(fe.solicitado_em) AS ultima_solicitacao,
    
    -- Estatísticas de tempo médio
    AVG(EXTRACT(EPOCH FROM (l.emitido_em - fe.solicitado_em))) AS tempo_medio_emissao_segundos
    
FROM fila_emissao fe
LEFT JOIN laudos l ON fe.lote_id = l.lote_id
WHERE fe.solicitado_por IS NOT NULL
GROUP BY fe.solicitado_por, fe.tipo_solicitante
ORDER BY total_solicitacoes DESC;

COMMENT ON VIEW v_relatorio_emissoes_usuario IS 
'Relatório estatístico de emissões por usuário (RH ou gestor_entidade) para auditoria e compliance';

\echo '   ✓ View v_relatorio_emissoes_usuario criada'

-- ============================================================================
-- 6. CRIAR FUNÇÃO DE BUSCA DE SOLICITANTE
-- ============================================================================
\echo '6. Criando função de busca de solicitante...'

CREATE OR REPLACE FUNCTION fn_buscar_solicitante_laudo(p_laudo_id INTEGER)
RETURNS TABLE (
    cpf VARCHAR(11),
    nome VARCHAR(200),
    perfil VARCHAR(20),
    solicitado_em TIMESTAMP
) AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_buscar_solicitante_laudo(INTEGER) IS 
'Retorna informações do solicitante (CPF, nome, perfil, data) de um laudo específico';

\echo '   ✓ Função fn_buscar_solicitante_laudo criada'

-- ============================================================================
-- 7. CRIAR FUNÇÃO DE RELATÓRIO DE PERÍODO
-- ============================================================================
\echo '7. Criando função de relatório de período...'

CREATE OR REPLACE FUNCTION fn_relatorio_emissoes_periodo(
    p_data_inicio TIMESTAMP,
    p_data_fim TIMESTAMP
)
RETURNS TABLE (
    solicitante_cpf VARCHAR(11),
    solicitante_perfil VARCHAR(20),
    total_solicitacoes BIGINT,
    total_sucessos BIGINT,
    total_erros BIGINT,
    taxa_sucesso NUMERIC(5,2)
) AS $$
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_relatorio_emissoes_periodo(TIMESTAMP, TIMESTAMP) IS 
'Gera relatório estatístico de emissões por usuário em um período específico';

\echo '   ✓ Função fn_relatorio_emissoes_periodo criada'

-- ============================================================================
-- 8. VALIDAÇÃO FINAL
-- ============================================================================
\echo '8. Validando estrutura criada...'

-- Verificar colunas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'fila_emissao'
    AND column_name IN ('solicitado_por', 'solicitado_em', 'tipo_solicitante');
    
    IF v_count != 3 THEN
        RAISE EXCEPTION 'Erro: Colunas de rastreabilidade não foram criadas corretamente';
    END IF;
    
    RAISE NOTICE '   ✓ Validação: 3 colunas criadas';
END $$;

-- Verificar índices
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE tablename = 'fila_emissao'
    AND indexname IN (
        'idx_fila_emissao_solicitado_por',
        'idx_fila_emissao_solicitado_em',
        'idx_fila_emissao_tipo_solicitante',
        'idx_fila_emissao_solicitante_data'
    );
    
    IF v_count < 3 THEN
        RAISE EXCEPTION 'Erro: Índices de rastreabilidade não foram criados corretamente (esperado: 4, encontrado: %)', v_count;
    END IF;
    
    RAISE NOTICE '   ✓ Validação: % índices criados', v_count;
END $$;

-- Verificar views
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_views
    WHERE viewname IN ('v_auditoria_emissoes', 'v_relatorio_emissoes_usuario');
    
    IF v_count != 2 THEN
        RAISE EXCEPTION 'Erro: Views de auditoria não foram criadas corretamente';
    END IF;
    
    RAISE NOTICE '   ✓ Validação: 2 views criadas';
END $$;

-- Verificar funções
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc
    WHERE proname IN ('fn_buscar_solicitante_laudo', 'fn_relatorio_emissoes_periodo');
    
    IF v_count != 2 THEN
        RAISE EXCEPTION 'Erro: Funções de auditoria não foram criadas corretamente';
    END IF;
    
    RAISE NOTICE '   ✓ Validação: 2 funções criadas';
END $$;

\echo ''
\echo '============================================='
\echo '✓ MIGRATION 1002 CONCLUÍDA COM SUCESSO'
\echo '============================================='
\echo ''
\echo 'Alterações realizadas:'
\echo '  • 3 colunas adicionadas em fila_emissao'
\echo '  • 2 constraints de validação criadas'
\echo '  • 4 índices de auditoria criados'
\echo '  • 2 views de relatório criadas'
\echo '  • 2 funções de consulta criadas'
\echo ''
\echo 'Próximos passos:'
\echo '  1. Atualizar API para registrar solicitado_por'
\echo '  2. Adicionar registro em auditoria_laudos'
\echo '  3. Executar testes de rastreabilidade'
\echo '  4. Validar compliance LGPD'
\echo ''

COMMIT;
