-- Migration 1029: Expande CHECK constraint de notificacoes para incluir perfis 'comercial' e 'suporte'
-- e adiciona valor ao enum tipo_notificacao para cadastros de representante via landing page.
--
-- Necessário para: app/api/public/representantes/cadastro/route.ts notificar usuários comercial
-- quando um novo lead de representante chegar via landing page.

-- Expandir constraint de destinatario_tipo
ALTER TABLE public.notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_destinatario_tipo_check;

ALTER TABLE public.notificacoes
  ADD CONSTRAINT notificacoes_destinatario_tipo_check
  CHECK (destinatario_tipo IN (
    'admin',
    'gestor',
    'funcionario',
    'contratante',
    'clinica',
    'comercial',
    'suporte'
  ));

-- Adicionar tipo de notificação para novo cadastro via landing page
DO $$
BEGIN
  ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'novo_cadastro_representante';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END
$$;
