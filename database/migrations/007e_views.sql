-- ==========================================
-- MIGRATION 007e: Recriação de Views e Validações
-- Parte 5 da refatoração de status e fila de emissão
-- Data: 2025-01-03
-- ==========================================

BEGIN;

\echo '=== MIGRATION 007e: Recriando views e validações ==='

-- 7. Executando validações finais
-- 7.1. Remover registros inconsistentes da fila de emissão
DELETE FROM fila_emissao
WHERE lote_id NOT IN (SELECT id FROM lotes_avaliacao);

\echo '7.1. Fila de emissão limpa'

-- 7.2. Validar integridade dos dados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar lotes com status inválido
  SELECT COUNT(*) INTO v_count
  FROM lotes_avaliacao
  WHERE status NOT IN ('pendente', 'em_processamento', 'concluido', 'cancelado');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Encontrados % lotes com status inválido', v_count;
  END IF;

  -- Verificar laudos com status inválido
  SELECT COUNT(*) INTO v_count
  FROM laudos
  WHERE status NOT IN ('rascunho', 'emitido', 'enviado');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Encontrados % laudos com status inválido', v_count;
  END IF;

  -- Verificar avaliações com status inválido
  SELECT COUNT(*) INTO v_count
  FROM avaliacoes
  WHERE status NOT IN ('iniciada', 'em_andamento', 'concluida', 'inativada');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Encontradas % avaliações com status inválido', v_count;
  END IF;

  RAISE NOTICE 'Validações de integridade concluídas com sucesso';
END $$;

\echo '7.2. Validações de integridade concluídas'

-- Recriar views removidas temporariamente
DROP VIEW IF EXISTS vw_auditoria_avaliacoes;
CREATE OR REPLACE VIEW vw_auditoria_avaliacoes AS
SELECT
    a.id as avaliacao_id,
    a.funcionario_cpf as cpf,
    f.clinica_id,
    f.empresa_id,
    l.codigo as lote,
    l.status as lote_status,
    CASE WHEN l.status = 'pendente' THEN true ELSE false END as liberado,
    a.status as avaliacao_status,
    CASE WHEN a.status = 'concluida' THEN true ELSE false END as concluida,
    CASE WHEN a.status = 'inativada' THEN true ELSE false END as inativada,
    -- Contar interrupções via audit_logs
    (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE resource = 'avaliacoes'
        AND resource_id = a.id::TEXT
        AND action = 'UPDATE'
        AND old_data->>'status' != new_data->>'status'
    ) as numero_interrupcoes,
    a.inicio as iniciada_em,
    a.envio as concluida_em,
    a.criado_em,
    a.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome
FROM avaliacoes a
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
LEFT JOIN lotes_avaliacao l ON l.id = a.lote_id
LEFT JOIN clinicas c ON c.id = f.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = f.empresa_id
ORDER BY a.criado_em DESC;

COMMENT ON VIEW vw_auditoria_avaliacoes IS 'View agregada para auditoria de avaliações com todas as informações necessárias';

DROP VIEW IF EXISTS vw_auditoria_lotes;
CREATE OR REPLACE VIEW vw_auditoria_lotes AS
SELECT
    l.id as lote_id,
    l.codigo as numero_lote,
    l.clinica_id,
    l.empresa_id,
    l.status,
    l.tipo,
    l.titulo,
    l.liberado_por as liberado_por_cpf,
    f.nome as liberado_por_nome,
    l.liberado_em,
    l.criado_em,
    l.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Contar avaliações do lote
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id) as total_avaliacoes,
    (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = l.id AND status = 'concluida') as avaliacoes_concluidas,
    -- Contar mudanças de status via audit_logs
    (
        SELECT COUNT(*)
        FROM audit_logs
        WHERE resource = 'lotes_avaliacao'
        AND resource_id = l.id::TEXT
        AND action = 'lote_status_change'
    ) as mudancas_status
FROM lotes_avaliacao l
LEFT JOIN funcionarios f ON f.cpf = l.liberado_por
LEFT JOIN clinicas c ON c.id = l.clinica_id
LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY l.criado_em DESC;

COMMENT ON VIEW vw_auditoria_lotes IS 'View agregada para auditoria de lotes com estatísticas e histórico';

DROP VIEW IF EXISTS vw_auditoria_laudos;
CREATE OR REPLACE VIEW vw_auditoria_laudos AS
SELECT
    ld.id as laudo_id,
    ld.emissor_cpf,
    f.nome as emissor_nome,
    l.clinica_id,
    l.empresa_id,
    l.id as lote_id,
    l.codigo as numero_lote,
    ld.status,
    ld.hash_pdf,
    ld.criado_em,
    ld.emitido_em,
    ld.enviado_em,
    ld.atualizado_em,
    c.nome as clinica_nome,
    ec.nome as empresa_nome,
    -- Verificar se tem PDF
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN true
        ELSE false
    END as tem_arquivo_pdf,
    -- Tamanho do PDF em KB
    CASE
        WHEN ld.arquivo_pdf IS NOT NULL THEN pg_column_size (ld.arquivo_pdf) / 1024
        ELSE 0
    END as tamanho_pdf_kb
FROM
    laudos ld
    LEFT JOIN funcionarios f ON f.cpf = ld.emissor_cpf
    LEFT JOIN lotes_avaliacao l ON l.id = ld.lote_id
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN empresas_clientes ec ON ec.id = l.empresa_id
ORDER BY ld.criado_em DESC;

COMMENT ON VIEW vw_auditoria_laudos IS 'View agregada para auditoria de laudos com informações de emissão e hash';

DROP VIEW IF EXISTS vw_comparativo_empresas;
CREATE VIEW vw_comparativo_empresas AS
 SELECT ec.clinica_id,
    ec.id AS empresa_id,
    ec.nome AS empresa_nome,
    avg(
        CASE
            WHEN (r.grupo = 1) THEN r.valor
            ELSE NULL::integer
        END) AS demandas_trabalho,
    avg(
        CASE
            WHEN (r.grupo = 2) THEN r.valor
            ELSE NULL::integer
        END) AS organizacao_conteudo,
    avg(
        CASE
            WHEN (r.grupo = 3) THEN r.valor
            ELSE NULL::integer
        END) AS relacoes_sociais,
    avg(
        CASE
            WHEN (r.grupo = 4) THEN r.valor
            ELSE NULL::integer
        END) AS lideranca,
    avg(
        CASE
            WHEN (r.grupo = 5) THEN r.valor
            ELSE NULL::integer
        END) AS valores_organizacionais,
    avg(
        CASE
            WHEN (r.grupo = 6) THEN r.valor
            ELSE NULL::integer
        END) AS saude_bem_estar,
    avg(r.valor) AS score_geral,
    count(DISTINCT f.cpf) AS funcionarios_responderam,
    count(r.valor) AS total_respostas
   FROM (((public.empresas_clientes ec
     JOIN public.funcionarios f ON ((ec.id = f.empresa_id)))
     JOIN public.avaliacoes a ON ((f.cpf = a.funcionario_cpf)))
     JOIN public.respostas r ON ((a.id = r.avaliacao_id)))
  WHERE (((a.status)::text = 'concluida'::text) AND (r.grupo <= 6))
  GROUP BY ec.clinica_id, ec.id, ec.nome
  ORDER BY ec.clinica_id, ec.nome;

DROP VIEW IF EXISTS vw_funcionarios_por_lote;
CREATE VIEW vw_funcionarios_por_lote AS
SELECT
    f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.turno,
    f.escala,
    f.empresa_id,
    f.clinica_id,
    a.id as avaliacao_id,
    a.status as status_avaliacao,
    a.envio as data_conclusao,
    a.inicio as data_inicio,
    a.inativada_em as data_inativacao,
    a.motivo_inativacao,
    a.lote_id
FROM funcionarios f
    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
WHERE
    f.perfil = 'funcionario'
    AND f.ativo = true;

COMMENT ON VIEW vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';

COMMIT;

\echo '=== MIGRATION 007e: Concluída com sucesso ==='