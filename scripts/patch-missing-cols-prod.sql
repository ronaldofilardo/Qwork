-- Patch: colunas presentes em neondb_staging mas ausentes em neondb_v2
-- Gerado após auditoria de diff STAGING vs PROD
-- Data: 2026-04-28

-- 1. comissoes_laudo: 6 colunas de split Asaas + comissão comercial
ALTER TABLE public.comissoes_laudo
  ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asaas_payment_id character varying,
  ADD COLUMN IF NOT EXISTS asaas_split_confirmado_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS asaas_split_executado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_comissao_comercial numeric NOT NULL DEFAULT 0;

-- 2. leads_representante: 1 coluna de aprovação
ALTER TABLE public.leads_representante
  ADD COLUMN IF NOT EXISTS requer_aprovacao_suporte boolean NOT NULL DEFAULT false;

-- 3. vinculos_comissao: 1 coluna de percentual comercial
ALTER TABLE public.vinculos_comissao
  ADD COLUMN IF NOT EXISTS percentual_comissao_comercial numeric NOT NULL DEFAULT 0;

-- 4. vendedores_perfil: 1 coluna de documento NF
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS doc_nf_path text;

-- Verificação final
SELECT 'comissoes_laudo.arquivado' AS col, COUNT(*) AS found FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='arquivado'
UNION ALL SELECT 'comissoes_laudo.asaas_payment_id', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='asaas_payment_id'
UNION ALL SELECT 'comissoes_laudo.asaas_split_confirmado_em', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='asaas_split_confirmado_em'
UNION ALL SELECT 'comissoes_laudo.asaas_split_executado', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='asaas_split_executado'
UNION ALL SELECT 'comissoes_laudo.percentual_comissao_comercial', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='percentual_comissao_comercial'
UNION ALL SELECT 'comissoes_laudo.valor_comissao_comercial', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='comissoes_laudo' AND column_name='valor_comissao_comercial'
UNION ALL SELECT 'leads_representante.requer_aprovacao_suporte', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='leads_representante' AND column_name='requer_aprovacao_suporte'
UNION ALL SELECT 'vinculos_comissao.percentual_comissao_comercial', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='vinculos_comissao' AND column_name='percentual_comissao_comercial'
UNION ALL SELECT 'vendedores_perfil.doc_nf_path', COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='vendedores_perfil' AND column_name='doc_nf_path';
