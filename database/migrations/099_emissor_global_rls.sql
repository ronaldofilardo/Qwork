-- 099_emissor_global_rls.sql
-- Tornar explícito: emissor é um usuário GLOBAL (sem vínculo a clinica/empresa)
-- Ajustes RLS mínimos e seguros para permitir funcionalidades de emissão

-- 1) Permitir que emissores leiam lotes_avaliacao (visibilidade necessária para emitir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rls_emissor_select_lotes' AND tablename = 'lotes_avaliacao'
  ) THEN
    CREATE POLICY rls_emissor_select_lotes ON public.lotes_avaliacao
      FOR SELECT
      USING (current_user_perfil() = 'emissor');
  END IF;
END$$;

-- 2) Permitir que emissores criem/atualizem e leiam laudos (podem emitir laudos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rls_emissor_crud_laudos' AND tablename = 'laudos'
  ) THEN
    CREATE POLICY rls_emissor_crud_laudos ON public.laudos
      FOR ALL
      USING (current_user_perfil() = 'emissor')
      WITH CHECK (current_user_perfil() = 'emissor');
  END IF;
END$$;

-- 3) Permitir que emissores listem emissores na tabela funcionarios (UI precisa mostrar emissores)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'rls_emissor_select_funcionarios' AND tablename = 'funcionarios'
  ) THEN
    CREATE POLICY rls_emissor_select_funcionarios ON public.funcionarios
      FOR SELECT
      USING (current_user_perfil() = 'emissor' OR current_user_perfil() IN ('admin','rh'));
  END IF;
END$$;

COMMENT ON POLICY rls_emissor_select_lotes ON public.lotes_avaliacao IS 'Permite que o perfil emissor veja lotes para emissão (emissor é global)';
COMMENT ON POLICY rls_emissor_crud_laudos ON public.laudos IS 'Permite que o perfil emissor crie/atualize/laudos; emissor é usuário global';
COMMENT ON POLICY rls_emissor_select_funcionarios ON public.funcionarios IS 'Permite que emissores listem emissores (visibilidade global para UI)';

-- Observação: esta migration adiciona políticas permissivas e explícitas para o papel emissor.
-- Se desejar regras mais restritivas (ex.: limitar a laudos atribuídos ao próprio emissor), adapte WITH CHECK/USING conforme políticas de negócio.