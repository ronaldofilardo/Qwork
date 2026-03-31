-- ====================================================================
-- Migration 1132: RLS Universal para Suporte, Comercial e Vendedor
-- Data: 2026-03-29
-- Objetivo: Defense-in-depth — garantir que suporte, comercial e vendedor
--   tenham políticas RLS nas tabelas de healthcare que acessam via API,
--   além das policies comerciais já existentes (1023, 1028).
--
-- Princípio: Mínimo privilégio
--   - suporte: READ em tabelas financeiras/operacionais
--   - comercial: READ em tabelas de contexto (entidades, lotes)
--   - vendedor: apenas dados próprios
-- ====================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. SUPORTE — Leitura operacional/financeira
-- ────────────────────────────────────────────────────────────────

-- 1a. Suporte pode VER lotes (para gestão financeira de emissões)
DROP POLICY IF EXISTS suporte_lotes_select ON public.lotes_avaliacao;
CREATE POLICY suporte_lotes_select
    ON public.lotes_avaliacao FOR SELECT
    USING (
        public.current_user_perfil() = 'suporte'
    );

-- 1b. Suporte pode VER laudos (para acompanhar emissões)
DROP POLICY IF EXISTS suporte_laudos_select ON public.laudos;
CREATE POLICY suporte_laudos_select
    ON public.laudos FOR SELECT
    USING (
        public.current_user_perfil() = 'suporte'
    );

-- 1c. Suporte pode VER funcionários (contexto financeiro)
DROP POLICY IF EXISTS suporte_funcionarios_select ON public.funcionarios;
CREATE POLICY suporte_funcionarios_select
    ON public.funcionarios FOR SELECT
    USING (
        public.current_user_perfil() = 'suporte'
    );

-- 1d. Suporte pode VER empresas_clientes (gestão de entidades)
DROP POLICY IF EXISTS suporte_empresas_select ON public.empresas_clientes;
CREATE POLICY suporte_empresas_select
    ON public.empresas_clientes FOR SELECT
    USING (
        public.current_user_perfil() = 'suporte'
    );

-- 1e. Suporte pode VER e EDITAR clínicas (ativar/desativar, trocar gestor)
DROP POLICY IF EXISTS suporte_clinicas_all ON public.clinicas;
CREATE POLICY suporte_clinicas_all
    ON public.clinicas FOR ALL
    USING (
        public.current_user_perfil() = 'suporte'
    )
    WITH CHECK (
        public.current_user_perfil() = 'suporte'
    );

-- ────────────────────────────────────────────────────────────────
-- 2. COMERCIAL — Leitura de contexto para gestão de representantes
-- ────────────────────────────────────────────────────────────────

-- 2a. Comercial pode VER lotes (contexto de comissões)
DROP POLICY IF EXISTS comercial_lotes_select ON public.lotes_avaliacao;
CREATE POLICY comercial_lotes_select
    ON public.lotes_avaliacao FOR SELECT
    USING (
        public.current_user_perfil() = 'comercial'
    );

-- 2b. Comercial pode VER empresas_clientes (contexto de leads)
DROP POLICY IF EXISTS comercial_empresas_select ON public.empresas_clientes;
CREATE POLICY comercial_empresas_select
    ON public.empresas_clientes FOR SELECT
    USING (
        public.current_user_perfil() = 'comercial'
    );

-- ────────────────────────────────────────────────────────────────
-- 3. VENDEDOR — Apenas dados próprios
-- ────────────────────────────────────────────────────────────────

-- 3a. Vendedor pode VER comissões dos próprios leads
DROP POLICY IF EXISTS vendedor_comissoes_laudo_own ON public.comissoes_laudo;
CREATE POLICY vendedor_comissoes_laudo_own
    ON public.comissoes_laudo FOR SELECT
    USING (
        public.current_user_perfil() = 'vendedor'
        AND vendedor_id = (
            SELECT id FROM public.usuarios
            WHERE cpf = public.current_user_cpf()
            LIMIT 1
        )
    );

-- 3b. Vendedor pode VER vínculos de comissão próprios
DROP POLICY IF EXISTS vendedor_vinculos_comissao_own ON public.vinculos_comissao;
CREATE POLICY vendedor_vinculos_comissao_own
    ON public.vinculos_comissao FOR SELECT
    USING (
        public.current_user_perfil() = 'vendedor'
        AND representante_id IN (
            SELECT representante_id FROM public.hierarquia_comercial
            WHERE vendedor_id = (
                SELECT id FROM public.usuarios
                WHERE cpf = public.current_user_cpf()
                LIMIT 1
            )
            AND ativo = true
        )
    );

-- ────────────────────────────────────────────────────────────────
-- 4. REPRESENTANTE — Adicionar na hierarquia de policies existentes
-- ────────────────────────────────────────────────────────────────

-- 4a. Representante pode VER lotes vinculados via comissões
DROP POLICY IF EXISTS representante_lotes_select ON public.lotes_avaliacao;
CREATE POLICY representante_lotes_select
    ON public.lotes_avaliacao FOR SELECT
    USING (
        public.current_user_perfil() = 'representante'
        AND id IN (
            SELECT lote_id FROM public.vinculos_comissao
            WHERE representante_id = public.current_representante_id()
        )
    );

COMMIT;
