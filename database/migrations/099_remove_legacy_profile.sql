-- Migration: Remoção de perfil legado (histórico)
-- Data: 2026-01-14
-- Objetivo: Migrar quaisquer usuários com perfil legado para 'admin', transferir permissões do role legado (se existir) e atualizar constraints para remover referências legadas

BEGIN;

-- 1) Garantir que exista a role 'admin' e transferir permissões se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles') THEN
    -- Garantir a role admin
    INSERT INTO public.roles (name, display_name, description, active)
    VALUES ('admin', 'Administrador', 'Administrador do sistema', true)
    ON CONFLICT (name) DO NOTHING;

    -- Transferir permissões do role 'master' para 'admin' (se existir)
    WITH master_role AS (
      SELECT id as master_id FROM public.roles WHERE name = 'master'
    ), admin_role AS (
      SELECT id as admin_id FROM public.roles WHERE name = 'admin'
    )
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role.admin_id, rp.permission_id
    FROM public.role_permissions rp
    JOIN master_role mr ON rp.role_id = mr.master_id
    CROSS JOIN admin_role
    ON CONFLICT DO NOTHING;

    -- Remover associações e role legado (se existir)
    DELETE FROM public.role_permissions WHERE role_id IN (SELECT id FROM public.roles WHERE name = 'master');
    DELETE FROM public.roles WHERE name = 'master';
  END IF;
END $$;

-- 5) Atualizar constraints que mencionam o perfil legado
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;

ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
    (
      perfil IN ('admin', 'rh', 'emissor', 'gestor')
    )
    OR (
      perfil = 'funcionario' AND nivel_cargo IS NOT NULL
    )
  );

ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_perfil_check CHECK (
    perfil IN ('funcionario', 'rh', 'admin', 'emissor', 'gestor')
  );

-- 6) Atualizar políticas RLS (remover referências ao perfil legado)
DROP POLICY IF EXISTS "master_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "master_all_avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "master_all_empresas" ON public.empresas_clientes;
DROP POLICY IF EXISTS "master_all_lotes" ON public.lotes_avaliacao;
DROP POLICY IF EXISTS "master_all_laudos" ON public.laudos;
DROP POLICY IF EXISTS "master_all_respostas" ON public.respostas;
DROP POLICY IF EXISTS "master_all_resultados" ON public.resultados;
DROP POLICY IF EXISTS "master_all_clinicas" ON public.clinicas;

-- Recriar políticas de admin (idempotente)
-- Admin should NOT see all funcionários; allow admin to manage only system users (RH and Emissor)
DROP POLICY IF EXISTS "admin_all_funcionarios" ON public.funcionarios;
CREATE POLICY "admin_restricted_funcionarios" ON public.funcionarios FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
    AND perfil IN ('rh', 'emissor')
);

DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
CREATE POLICY "admin_all_avaliacoes" ON public.avaliacoes FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

DROP POLICY IF EXISTS "admin_all_empresas" ON public.empresas_clientes;
CREATE POLICY "admin_all_empresas" ON public.empresas_clientes FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

DROP POLICY IF EXISTS "admin_all_lotes" ON public.lotes_avaliacao;
CREATE POLICY "admin_all_lotes" ON public.lotes_avaliacao FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

DROP POLICY IF EXISTS "admin_all_laudos" ON public.laudos;
CREATE POLICY "admin_all_laudos" ON public.laudos FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

DROP POLICY IF EXISTS "admin_all_respostas" ON public.respostas;
CREATE POLICY "admin_all_respostas" ON public.respostas FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

DROP POLICY IF EXISTS "admin_all_resultados" ON public.resultados;
CREATE POLICY "admin_all_resultados" ON public.resultados FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);

COMMIT;

-- Mensagem de execução (quando executado via psql aparece como NOTICE)
DO $$ BEGIN RAISE NOTICE 'Migration 099_remove_legacy_profile applied: users converted to admin and legacy role removed.'; END $$;