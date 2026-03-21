-- ====================================================================
-- Migration 1023: Hierarquia Comercial
-- Data: 2026-03-20
-- Objetivo: Tabela de vínculo Vendedor ↔ Representante gerenciada pelo Comercial.
--   - Um vendedor pode ser vinculado a um ou mais representantes
--   - Um comercial cria e gerencia esses vínculos
--   - Vendedor vê apenas dados dos representantes vinculados a ele
-- ====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.hierarquia_comercial (
    id                  SERIAL PRIMARY KEY,
    vendedor_id         INTEGER NOT NULL
                            REFERENCES public.usuarios(id) ON DELETE CASCADE,
    representante_id    INTEGER
                            REFERENCES public.representantes(id) ON DELETE SET NULL,
    comercial_id        INTEGER
                            REFERENCES public.usuarios(id) ON DELETE SET NULL,
    ativo               BOOLEAN NOT NULL DEFAULT true,
    percentual_override DECIMAL(5,2), -- Override do percentual padrão do representante (opcional)
    obs                 TEXT,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT hierarquia_comercial_vendedor_rep_unico
        UNIQUE (vendedor_id, representante_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hierarquia_comercial_vendedor_id
    ON public.hierarquia_comercial (vendedor_id)
    WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_hierarquia_comercial_representante_id
    ON public.hierarquia_comercial (representante_id)
    WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_hierarquia_comercial_comercial_id
    ON public.hierarquia_comercial (comercial_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.set_hierarquia_comercial_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hierarquia_comercial_updated_at ON public.hierarquia_comercial;
CREATE TRIGGER trg_hierarquia_comercial_updated_at
    BEFORE UPDATE ON public.hierarquia_comercial
    FOR EACH ROW EXECUTE FUNCTION public.set_hierarquia_comercial_updated_at();

COMMIT;

-- ====================================================================
-- RLS Policies para hierarquia_comercial
-- ====================================================================

ALTER TABLE public.hierarquia_comercial ENABLE ROW LEVEL SECURITY;

-- Admin e comercial: acesso total
DROP POLICY IF EXISTS hc_admin_comercial_all ON public.hierarquia_comercial;
CREATE POLICY hc_admin_comercial_all
    ON public.hierarquia_comercial FOR ALL
    USING (
        public.current_user_perfil() IN ('admin', 'comercial')
    )
    WITH CHECK (
        public.current_user_perfil() IN ('admin', 'comercial')
    );

-- Suporte: somente leitura
DROP POLICY IF EXISTS hc_suporte_select ON public.hierarquia_comercial;
CREATE POLICY hc_suporte_select
    ON public.hierarquia_comercial FOR SELECT
    USING (
        public.current_user_perfil() = 'suporte'
    );

-- Vendedor: somente vê os próprios vínculos
DROP POLICY IF EXISTS hc_vendedor_own ON public.hierarquia_comercial;
CREATE POLICY hc_vendedor_own
    ON public.hierarquia_comercial FOR SELECT
    USING (
        public.current_user_perfil() = 'vendedor'
        AND vendedor_id = (
            SELECT id FROM public.usuarios
            WHERE cpf = public.current_user_cpf()
            LIMIT 1
        )
    );
