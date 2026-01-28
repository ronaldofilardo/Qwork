-- ==========================================
-- MIGRATION 011: Corrigir View vw_funcionarios_por_lote
-- Descricao: Remove colunas inexistentes (nivel_cargo, data_admissao)
-- Data: 2026-01-04
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. RECRIAR VIEW SEM COLUNAS INEXISTENTES
-- ==========================================

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
    a.lote_id
FROM funcionarios f
    LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
WHERE
    f.perfil = 'funcionario'
    AND f.ativo = true;

-- ==========================================
-- 2. ATUALIZAR COMENTARIO
-- ==========================================

COMMENT ON VIEW vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes';

COMMIT;
