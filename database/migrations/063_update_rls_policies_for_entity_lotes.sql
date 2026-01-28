-- Migration: 063_update_rls_policies_for_entity_lotes.sql
-- Description: Update RLS policies for lotes_avaliacao to support entity lots with contratante_id
-- Date: 2026-01-02

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "lotes_rh_clinica" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_rh_insert" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_rh_update" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_emissor_select" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_funcionario_select" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_entidade_select" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_entidade_insert" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "lotes_entidade_update" ON public.lotes_avaliacao;

-- Policy: RH vê lotes de sua clínica (clinic lots)
CREATE POLICY lotes_rh_clinica ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

-- Policy: RH pode inserir lotes de sua clínica
CREATE POLICY lotes_rh_insert ON public.lotes_avaliacao FOR
INSERT TO PUBLIC
WITH CHECK (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

-- Policy: RH pode atualizar lotes de sua clínica
CREATE POLICY lotes_rh_update ON public.lotes_avaliacao FOR
UPDATE TO PUBLIC USING (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
)
WITH CHECK (
    current_user_perfil() = 'rh'
    AND clinica_id = current_user_clinica_id()
);

-- Policy: Entidade vê seus próprios lotes (entity lots)
CREATE POLICY lotes_entidade_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'entidade'
    AND contratante_id = current_user_contratante_id()
);

-- Policy: Entidade pode inserir seus próprios lotes
CREATE POLICY lotes_entidade_insert ON public.lotes_avaliacao FOR
INSERT TO PUBLIC
WITH CHECK (
    current_user_perfil() = 'entidade'
    AND contratante_id = current_user_contratante_id()
);

-- Policy: Entidade pode atualizar seus próprios lotes
CREATE POLICY lotes_entidade_update ON public.lotes_avaliacao FOR
UPDATE TO PUBLIC USING (
    current_user_perfil() = 'entidade'
    AND contratante_id = current_user_contratante_id()
)
WITH CHECK (
    current_user_perfil() = 'entidade'
    AND contratante_id = current_user_contratante_id()
);

-- Policy: Emissor vê lotes liberados (status finalizado/concluido)
CREATE POLICY lotes_emissor_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'emissor'
    AND status IN ('finalizado', 'concluido')
);

-- Policy: Funcionário vê lotes onde tem avaliação
CREATE POLICY lotes_funcionario_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
    current_user_perfil() = 'funcionario'
    AND EXISTS (
        SELECT 1 FROM avaliacoes a
        WHERE a.lote_id = lotes_avaliacao.id
        AND a.funcionario_cpf = current_user_cpf()
    )
);