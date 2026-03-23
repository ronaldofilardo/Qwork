-- Migration 1109: Grandfathering — representantes e vendedores existentes não precisam trocar senha
-- Marca primeira_senha_alterada = TRUE para registros anteriores a esta data
-- Também marca aceites como TRUE para vendedores existentes (evitar modal retroativo)

BEGIN;

-- 1. Representantes: quem já usou o convite (convite_usado_em IS NOT NULL) está grandfathered
UPDATE public.representantes_senhas
SET primeira_senha_alterada = TRUE
WHERE primeira_senha_alterada = FALSE
  AND criado_em < '2026-03-22 00:00:00';

-- 2. Vendedores existentes: marcar primeira_senha_alterada e aceites como TRUE
UPDATE public.vendedores_perfil
SET primeira_senha_alterada    = TRUE,
    aceite_termos              = TRUE,
    aceite_termos_em           = CURRENT_TIMESTAMP,
    aceite_politica_privacidade    = TRUE,
    aceite_politica_privacidade_em = CURRENT_TIMESTAMP,
    aceite_disclaimer_nv           = TRUE,
    aceite_disclaimer_nv_em        = CURRENT_TIMESTAMP
WHERE criado_em < '2026-03-22 00:00:00';

COMMIT;
