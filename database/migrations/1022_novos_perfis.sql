-- ====================================================================
-- Migration 1022: Novos perfis — suporte, comercial, vendedor
-- Data: 2026-03-19
-- Objetivo: Adicionar 3 novos perfis ao sistema para redistribuição
--           de funções do admin existente.
--   - suporte: gestão financeira (cobrança, pagamentos, comissões-pagamento)
--   - comercial: gestão de representantes, leads, comissões-aprovação
--   - vendedor: vendas diretas, métricas pessoais
-- ====================================================================

-- 1. Expandir ENUM perfil_usuario_enum
-- NOTA: ALTER TYPE ... ADD VALUE não pode rodar dentro de transação multi-statement
-- em versões anteriores ao PostgreSQL 12. Se necessário, executar cada ADD VALUE
-- em statement separado.
ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'suporte';
ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'comercial';
ALTER TYPE perfil_usuario_enum ADD VALUE IF NOT EXISTS 'vendedor';

-- 2. Expandir ENUM usuario_tipo_enum (usado em usuarios.tipo_usuario)
-- Verificar se existe antes de adicionar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_tipo_enum') THEN
        BEGIN
            ALTER TYPE usuario_tipo_enum ADD VALUE IF NOT EXISTS 'suporte';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE usuario_tipo_enum ADD VALUE IF NOT EXISTS 'comercial';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE usuario_tipo_enum ADD VALUE IF NOT EXISTS 'vendedor';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 3. Atualizar CHECK constraint em usuarios para aceitar novos tipos
-- Drop e re-create (CHECK constraints não podem ser alteradas in-place)
BEGIN;

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check;

ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK (
    -- Admin e Emissor: sem vínculos
    (tipo_usuario IN ('admin', 'emissor') AND clinica_id IS NULL AND entidade_id IS NULL)
    OR
    -- RH: deve ter clinica_id, não tem entidade_id
    (tipo_usuario = 'rh' AND clinica_id IS NOT NULL AND entidade_id IS NULL)
    OR
    -- Gestor Entidade: deve ter entidade_id, não tem clinica_id
    (tipo_usuario = 'gestor' AND entidade_id IS NOT NULL AND clinica_id IS NULL)
    OR
    -- Suporte: sem vínculos operacionais (gestão financeira da plataforma)
    (tipo_usuario = 'suporte' AND clinica_id IS NULL AND entidade_id IS NULL)
    OR
    -- Comercial: sem vínculos operacionais (gestão de representantes/leads)
    (tipo_usuario = 'comercial' AND clinica_id IS NULL AND entidade_id IS NULL)
    OR
    -- Vendedor: sem vínculos operacionais (vendas diretas)
    (tipo_usuario = 'vendedor' AND clinica_id IS NULL AND entidade_id IS NULL)
);

COMMIT;

-- 4. Atualizar RLS policies para incluir novos perfis onde apropriado
-- As policies originais verificam current_user_perfil() = 'admin'
-- Precisamos incluir 'comercial' para representantes/leads/vinculos
-- e 'suporte' + 'comercial' para comissoes

BEGIN;

-- 4a. representantes: admin + comercial podem ver/editar
DROP POLICY IF EXISTS rep_sees_own ON public.representantes;
CREATE POLICY rep_sees_own
  ON public.representantes FOR SELECT
  USING (
    id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
  );

DROP POLICY IF EXISTS rep_update_own ON public.representantes;
CREATE POLICY rep_update_own
  ON public.representantes FOR UPDATE
  USING (
    id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial')
  )
  WITH CHECK (
    id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial')
  );

-- 4b. leads_representante: admin + comercial
DROP POLICY IF EXISTS leads_rep_own ON public.leads_representante;
CREATE POLICY leads_rep_own
  ON public.leads_representante FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial')
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial')
  );

-- 4c. vinculos_comissao: admin + comercial
DROP POLICY IF EXISTS vinculos_rep_own ON public.vinculos_comissao;
CREATE POLICY vinculos_rep_own
  ON public.vinculos_comissao FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial')
  );

-- 4d. comissoes_laudo: admin + comercial + suporte
DROP POLICY IF EXISTS comissoes_rep_own ON public.comissoes_laudo;
CREATE POLICY comissoes_rep_own
  ON public.comissoes_laudo FOR ALL
  USING (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
  )
  WITH CHECK (
    representante_id = public.current_representante_id()
    OR public.current_user_perfil() IN ('admin', 'comercial', 'suporte')
  );

-- 4e. comissionamento_auditoria: admin only (manter)
-- Não precisa alterar — admin exclusivo para auditorias

COMMIT;
