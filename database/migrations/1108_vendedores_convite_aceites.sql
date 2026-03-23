-- Migration 1108: Colunas de convite, primeira senha e aceites para vendedores
-- Habilita o fluxo de 1º acesso: convite por token → criar senha → trocar senha → aceite de termos

BEGIN;

-- Colunas de convite (token de uso único, 7 dias de validade)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS convite_token              VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS convite_expira_em          TIMESTAMP,
  ADD COLUMN IF NOT EXISTS convite_tentativas_falhas  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS convite_usado_em           TIMESTAMP;

-- Flag de primeira senha alterada
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS primeira_senha_alterada    BOOLEAN NOT NULL DEFAULT FALSE;

-- Colunas de aceite de termos (mesmo padrão de representantes)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS aceite_termos                  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aceite_termos_em               TIMESTAMP,
  ADD COLUMN IF NOT EXISTS aceite_politica_privacidade    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aceite_politica_privacidade_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS aceite_disclaimer_nv           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aceite_disclaimer_nv_em        TIMESTAMP;

-- Índice para busca eficiente por token de convite
CREATE INDEX IF NOT EXISTS idx_vendedores_perfil_convite_token
  ON public.vendedores_perfil (convite_token)
  WHERE convite_token IS NOT NULL;

COMMENT ON COLUMN public.vendedores_perfil.convite_token
  IS 'Token de uso único para criação de senha (hex-64, expira em 7 dias)';
COMMENT ON COLUMN public.vendedores_perfil.primeira_senha_alterada
  IS 'Flag: vendedor trocou a senha provisória no primeiro acesso';
COMMENT ON COLUMN public.vendedores_perfil.aceite_termos
  IS 'Vendedor aceitou Termos de Uso';
COMMENT ON COLUMN public.vendedores_perfil.aceite_politica_privacidade
  IS 'Vendedor aceitou Política de Privacidade';
COMMENT ON COLUMN public.vendedores_perfil.aceite_disclaimer_nv
  IS 'Vendedor aceitou Contrato de Representação NÃO-CLT';

COMMIT;
