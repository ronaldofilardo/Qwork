-- Migration 160: Remove 'codigo' e padroniza em 'id'
-- Data: 2026-02-03
-- Objetivo: Simplificar identificação de lotes usando apenas ID (lote.id === laudo.id)
-- 
-- RACIONAL:
-- - Campo 'codigo' é redundante (gera overhead com gerar_codigo_lote())
-- - lotes_avaliacao.id já é único, sequencial e usado internamente
-- - Storage/Backblaze usa lote_id (não codigo)
-- - RLS/RBAC usam id (não codigo)
-- - Formato 'Lote #123' é mais simples que 'Lote 001-030226'

BEGIN;

-- 1. Remover coluna denormalizada ultimo_lote_codigo de funcionarios
-- (será substituída por ultimo_lote_id se necessário em migration futura)
ALTER TABLE funcionarios DROP COLUMN IF EXISTS ultimo_lote_codigo;

-- 2. Remover função gerar_codigo_lote (não será mais necessária)
DROP FUNCTION IF EXISTS gerar_codigo_lote();

-- 3. Dropar TODAS as views que dependem de lotes_avaliacao.codigo
DROP VIEW IF EXISTS vw_auditoria_avaliacoes CASCADE;
DROP VIEW IF EXISTS vw_auditoria_lotes CASCADE;
DROP VIEW IF EXISTS vw_funcionarios_ultima_avaliacao CASCADE;
DROP VIEW IF EXISTS vw_lotes_detalhados CASCADE;
-- Views adicionais que podem referenciar lote.codigo
DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE;
DROP VIEW IF EXISTS v_relatorio_emissoes_usuario CASCADE;

-- 4. Remover coluna codigo de lotes_avaliacao
-- IMPORTANTE: Fazer backup antes se necessário
ALTER TABLE lotes_avaliacao DROP COLUMN IF EXISTS codigo;

-- 5. Recriar apenas views essenciais SEM codigo

-- View: vw_lotes_detalhados (sem numero_lote)
CREATE OR REPLACE VIEW vw_lotes_detalhados AS
SELECT
    la.id as lote_id,
    la.titulo as lote_titulo,
    la.status as lote_status,
    la.tipo as lote_tipo,
    la.liberado_em,
    la.liberado_por,
    c.nome as clinica_nome,
    e.nome as empresa_nome,
    COUNT(DISTINCT a.id) as total_avaliacoes,
    COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as avaliacoes_concluidas,
    COUNT(DISTINCT CASE WHEN a.status = 'inativada' THEN a.id END) as avaliacoes_inativadas,
    l.id as laudo_id,
    l.status as laudo_status
FROM lotes_avaliacao la
LEFT JOIN clinicas c ON la.clinica_id = c.id
LEFT JOIN empresas_clientes e ON la.empresa_id = e.id
LEFT JOIN avaliacoes a ON la.id = a.lote_id
LEFT JOIN laudos l ON la.id = l.id
GROUP BY la.id, la.titulo, la.status, la.tipo, la.liberado_em, la.liberado_por, c.nome, e.nome, l.id, l.status;

-- View: vw_auditoria_lotes (sem numero_lote/codigo)
CREATE OR REPLACE VIEW vw_auditoria_lotes AS
SELECT 
    l.id AS lote_id,
    l.clinica_id,
    l.empresa_id,
    l.status,
    l.tipo,
    l.titulo,
    l.liberado_por AS liberado_por_cpf,
    f.nome AS liberado_por_nome,
    l.liberado_em,
    l.criado_em,
    l.atualizado_em,
    c.nome AS clinica_nome,
    ec.nome AS empresa_nome,
    ( SELECT count(*) FROM avaliacoes WHERE avaliacoes.lote_id = l.id ) AS total_avaliacoes,
    ( SELECT count(*) FROM avaliacoes WHERE avaliacoes.lote_id = l.id AND avaliacoes.status = 'concluida' ) AS avaliacoes_concluidas,
    ( SELECT count(*) FROM audit_logs 
      WHERE audit_logs.resource = 'lotes_avaliacao' 
        AND audit_logs.resource_id = l.id::text 
        AND audit_logs.action = 'UPDATE' 
        AND (audit_logs.old_data ->> 'status') <> (audit_logs.new_data ->> 'status')
    ) AS mudancas_status
FROM lotes_avaliacao l
LEFT JOIN funcionarios f ON f.cpf = l.liberado_por
LEFT JOIN clinicas c ON c.id = l.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY l.criado_em DESC;

-- 5. Comentários de documentação
COMMENT ON TABLE lotes_avaliacao IS 'Lotes de avaliação - identificados apenas por ID (lote.id === laudo.id)';
COMMENT ON COLUMN lotes_avaliacao.id IS 'Identificador único do lote (igual ao ID do laudo correspondente)';

-- 6. Verificação final
DO $$
DECLARE
    v_codigo_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_column_count INTEGER;
BEGIN
    -- Verificar se coluna codigo foi removida
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lotes_avaliacao' AND column_name = 'codigo'
    ) INTO v_codigo_exists;

    -- Verificar se função foi removida
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'gerar_codigo_lote'
    ) INTO v_function_exists;

    -- Contar colunas de lotes_avaliacao
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_name = 'lotes_avaliacao';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION 160: VERIFICAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Coluna codigo removida: %', NOT v_codigo_exists;
    RAISE NOTICE 'Função gerar_codigo_lote removida: %', NOT v_function_exists;
    RAISE NOTICE 'Total de colunas em lotes_avaliacao: %', v_column_count;
    RAISE NOTICE '========================================';

    IF v_codigo_exists THEN
        RAISE EXCEPTION 'ERRO: Coluna codigo ainda existe em lotes_avaliacao';
    END IF;

    IF v_function_exists THEN
        RAISE EXCEPTION 'ERRO: Função gerar_codigo_lote ainda existe';
    END IF;

    RAISE NOTICE 'Migration 160 concluída com sucesso!';
    RAISE NOTICE 'Sistema agora usa apenas lote.id para identificação';
    RAISE NOTICE 'Formato de display recomendado: Lote #ID';
END $$;

COMMIT;
