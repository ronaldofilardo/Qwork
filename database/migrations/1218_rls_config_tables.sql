-- Migration 1218: Habilitar RLS em tabelas de configuração
-- Tabelas afetadas: clinica_configuracoes, templates_contrato, relatorio_templates, questao_condicoes

-- ============================================================================
-- 1. clinica_configuracoes — acesso restrito à própria clínica ou admin/suporte
-- ============================================================================
ALTER TABLE IF EXISTS public.clinica_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinica_configuracoes FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clinica_config_select') THEN
    EXECUTE 'CREATE POLICY clinica_config_select ON public.clinica_configuracoes
      FOR SELECT USING (
        clinica_id::text = current_setting(''app.current_user_clinica_id'', true)
        OR current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'', ''emissor'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clinica_config_modify') THEN
    EXECUTE 'CREATE POLICY clinica_config_modify ON public.clinica_configuracoes
      FOR ALL USING (
        clinica_id::text = current_setting(''app.current_user_clinica_id'', true)
        OR current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      ) WITH CHECK (
        clinica_id::text = current_setting(''app.current_user_clinica_id'', true)
        OR current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

-- ============================================================================
-- 2. templates_contrato — leitura: todos autenticados; escrita: admin/suporte
-- ============================================================================
ALTER TABLE IF EXISTS public.templates_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates_contrato FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_contrato_select') THEN
    EXECUTE 'CREATE POLICY templates_contrato_select ON public.templates_contrato
      FOR SELECT USING (
        current_setting(''app.current_perfil'', true) IS NOT NULL
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_contrato_modify') THEN
    EXECUTE 'CREATE POLICY templates_contrato_modify ON public.templates_contrato
      FOR ALL USING (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      ) WITH CHECK (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

-- ============================================================================
-- 3. relatorio_templates — leitura: emissor/admin/suporte; escrita: admin/suporte
-- ============================================================================
ALTER TABLE IF EXISTS public.relatorio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.relatorio_templates FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relatorio_templates_select') THEN
    EXECUTE 'CREATE POLICY relatorio_templates_select ON public.relatorio_templates
      FOR SELECT USING (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'', ''emissor'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'relatorio_templates_modify') THEN
    EXECUTE 'CREATE POLICY relatorio_templates_modify ON public.relatorio_templates
      FOR ALL USING (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      ) WITH CHECK (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

-- ============================================================================
-- 4. questao_condicoes — leitura: todos autenticados; escrita: admin/suporte
-- ============================================================================
ALTER TABLE IF EXISTS public.questao_condicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questao_condicoes FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questao_condicoes_select') THEN
    EXECUTE 'CREATE POLICY questao_condicoes_select ON public.questao_condicoes
      FOR SELECT USING (
        current_setting(''app.current_perfil'', true) IS NOT NULL
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'questao_condicoes_modify') THEN
    EXECUTE 'CREATE POLICY questao_condicoes_modify ON public.questao_condicoes
      FOR ALL USING (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      ) WITH CHECK (
        current_setting(''app.current_perfil'', true) IN (''admin'', ''suporte'')
        OR current_setting(''app.is_backend'', true) = ''1''
      )';
  END IF;
END $$;
