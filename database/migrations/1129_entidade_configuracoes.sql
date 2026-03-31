-- Migration 1129: Tabela entidade_configuracoes
-- Espelho de clinica_configuracoes para entidades diretas
-- Permite branding personalizado (logo, cores) por entidade

CREATE TABLE IF NOT EXISTS public.entidade_configuracoes (
    id SERIAL PRIMARY KEY,
    entidade_id INTEGER NOT NULL UNIQUE REFERENCES public.entidades(id) ON DELETE CASCADE,
    logo_url TEXT,
    cor_primaria TEXT,
    cor_secundaria TEXT,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    atualizado_por_cpf TEXT
);

-- Índice para lookup rápido por entidade
CREATE INDEX IF NOT EXISTS idx_entidade_configuracoes_entidade_id
    ON public.entidade_configuracoes(entidade_id);

COMMENT ON TABLE public.entidade_configuracoes IS 'Configurações de branding (logo, cores) por entidade';
COMMENT ON COLUMN public.entidade_configuracoes.logo_url IS 'Logo em base64 data URI (data:image/...;base64,...) — max 256KB decoded';
