-- Migration 1224: Remove colunas NF do sistema de comissões
-- As colunas de NF/RPA foram removidas do fluxo de comissões (sistema NF legado).
-- O doc_nf_path de vendedores (onboarding) NÃO é afetado por esta migration.
-- NOTA: Se as colunas já foram removidas em ambiente anterior, os IF EXISTS garantem segurança.

ALTER TABLE public.comissoes_laudo
  DROP COLUMN IF EXISTS nf_path,
  DROP COLUMN IF EXISTS nf_nome_arquivo,
  DROP COLUMN IF EXISTS nf_rpa_enviada_em,
  DROP COLUMN IF EXISTS nf_rpa_aprovada_em,
  DROP COLUMN IF EXISTS nf_rpa_rejeitada_em,
  DROP COLUMN IF EXISTS nf_rpa_motivo_rejeicao;
