-- ==========================================
-- MIGRATION 008: Atualizar View vw_funcionarios_por_lote
-- Descricao: Adiciona campos de inativacao na view
-- Data: 2025-12-16
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. RECRIAR VIEW COM CAMPOS DE INATIVACAO
-- ==========================================

DROP VIEW IF EXISTS vw_funcionarios_por_lote;

CREATE VIEW vw_funcionarios_por_lote AS
SELECT
    f.cpf,
    f.nome,
    f.setor,
    f.funcao,
    f.matricula,
    f.nivel_cargo,
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

-- ==========================================
-- 2. ADICIONAR COMENTARIO
-- ==========================================

COMMENT ON VIEW vw_funcionarios_por_lote IS 'View que combina dados de funcionarios com suas avaliacoes, incluindo informacoes de inativacao';

COMMIT;