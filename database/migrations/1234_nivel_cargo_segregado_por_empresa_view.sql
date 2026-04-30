-- ============================================================================
-- Migration 1234: Segregar nivel_cargo por empresa na view vw_funcionarios_por_lote
-- ============================================================================
-- Problema: View usava f.nivel_cargo (global) sem filtro por empresa
-- Solução: Usar COALESCE(fc.nivel_cargo, f.nivel_cargo) para segregação por empresa
--
-- Impacto:
-- - gerarDadosGeraisEmpresa() em laudo-calculos.ts agora conta nível de cargo por vínculo
-- - Previne 'bleeding' de nível entre empresas que compartilham CPF
-- - Fallback para f.nivel_cargo quando vinculo não tem nível definido
-- ============================================================================

-- Drop dependencies before modifying the view
DROP VIEW IF EXISTS public.vw_funcionarios_por_lote CASCADE;

-- Recreate view with COALESCE(fc.nivel_cargo, f.nivel_cargo) for per-empresa segregation
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
    COALESCE(fc.nivel_cargo, f.nivel_cargo) AS nivel_cargo,
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

COMMENT ON VIEW public.vw_funcionarios_por_lote IS 'View que lista funcionarios com avaliacoes e lotes, usando tabelas intermediarias. Nível de cargo é segregado por empresa (vínculo) para prevenir bleeding entre CNPJs.';
