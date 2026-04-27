-- Patch: enum values presentes em neondb_staging mas ausentes em neondb_v2
-- Gerado após auditoria de diff STAGING vs PROD
-- Data: 2026-04-28
-- Nota: ALTER TYPE ADD VALUE IF NOT EXISTS é seguro (PostgreSQL 9.3+)
-- Nota: status_avaliacao|concluido (STAGING) vs |concluida (PROD) — grafia diferente,
--       codebase usa 'concluida', portanto NÃO adicionar 'concluido' ao PROD.

-- 1. perfil_usuario_enum: adicionar 'gestor' se ausente
ALTER TYPE public.perfil_usuario_enum ADD VALUE IF NOT EXISTS 'gestor';

-- 2. status_comissao: adicionar 'pendente_consolidacao'
ALTER TYPE public.status_comissao ADD VALUE IF NOT EXISTS 'pendente_consolidacao';

-- 3. status_laudo_enum: adicionar 'aguardando_assinatura' e 'pdf_gerado' (ZapSign)
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'aguardando_assinatura';
ALTER TYPE public.status_laudo_enum ADD VALUE IF NOT EXISTS 'pdf_gerado';

-- 4. status_lead: adicionar 'aprovado' e 'rejeitado'
ALTER TYPE public.status_lead ADD VALUE IF NOT EXISTS 'aprovado';
ALTER TYPE public.status_lead ADD VALUE IF NOT EXISTS 'rejeitado';

-- 5. status_representante: adicionar 'aprovacao_comercial'
ALTER TYPE public.status_representante ADD VALUE IF NOT EXISTS 'aprovacao_comercial';
