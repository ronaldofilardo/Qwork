-- Migration: 064_fix_entidade_perfil_rls.sql
-- Description: Fix RLS policies to accept both 'entidade' and 'gestor' perfil
-- Date: 2026-01-04
-- Priority: P0.2 - CRÍTICA

BEGIN;

\echo '=== MIGRATION 064: Corrigindo perfil gestor em RLS ==='

-- Drop existing policies that use wrong perfil check
DROP POLICY IF EXISTS lotes_entidade_select ON public.lotes_avaliacao;
DROP POLICY IF EXISTS lotes_entidade_insert ON public.lotes_avaliacao;
DROP POLICY IF EXISTS lotes_entidade_update ON public.lotes_avaliacao;

-- Policy: Entidade vê seus próprios lotes (entity lots)
-- Aceita ambos 'entidade' e 'gestor' para compatibilidade
CREATE POLICY lotes_entidade_select ON public.lotes_avaliacao FOR
SELECT TO PUBLIC USING (
    current_user_perfil() IN ('entidade', 'gestor')
    AND contratante_id = current_user_contratante_id()
);

-- Policy: Entidade pode inserir seus próprios lotes
CREATE POLICY lotes_entidade_insert ON public.lotes_avaliacao FOR
INSERT TO PUBLIC
WITH CHECK (
    current_user_perfil() IN ('entidade', 'gestor')
    AND contratante_id = current_user_contratante_id()
);

-- Policy: Entidade pode atualizar seus próprios lotes
CREATE POLICY lotes_entidade_update ON public.lotes_avaliacao FOR
UPDATE TO PUBLIC USING (
    current_user_perfil() IN ('entidade', 'gestor')
    AND contratante_id = current_user_contratante_id()
)
WITH CHECK (
    current_user_perfil() IN ('entidade', 'gestor')
    AND contratante_id = current_user_contratante_id()
);

\echo '064.1 Políticas RLS de lotes_avaliacao atualizadas para aceitar gestor'

-- Update laudos policies if they exist
DROP POLICY IF EXISTS laudos_entidade_select ON public.laudos;

-- Policy: Entidade pode ver laudos dos seus lotes
CREATE POLICY laudos_entidade_select ON public.laudos FOR
SELECT TO PUBLIC USING (
    current_user_perfil() IN ('entidade', 'gestor')
    AND EXISTS (
        SELECT 1 FROM lotes_avaliacao
        WHERE lotes_avaliacao.id = laudos.lote_id
        AND lotes_avaliacao.contratante_id = current_user_contratante_id()
    )
);

\echo '064.2 Política RLS de laudos atualizada para aceitar gestor'

-- Add comment explaining the dual perfil support
COMMENT ON POLICY lotes_entidade_select ON public.lotes_avaliacao IS 
'Permite acesso de gestores de entidade (perfil gestor ou entidade) aos lotes da sua entidade';

COMMIT;

\echo '=== MIGRATION 064: Concluída com sucesso ==='
