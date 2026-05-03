-- Migration 102: Renomear role/policies legadas que ainda contêm 'master' (idempotente e seguro)
-- Data: 2026-01-15
-- Descrição: Renomeia políticas com prefixo `master_` para `legacy_` e renomeia a role application-level 'master' para 'legacy_master' ou mescla permissões se o role legado já existir.
-- Nota: Não altera valores de coluna `funcionarios.perfil` diretamente (a migração anterior já converteu registros); esta migration trata apenas nomes e objetos administrativos para limpeza histórica.

BEGIN;

-- 1) Renomear policies explicitamente conhecidas (só se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_funcionarios' AND c.relname = 'funcionarios')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_funcionarios' AND c.relname = 'funcionarios') THEN
    EXECUTE 'ALTER POLICY "master_all_funcionarios" ON public.funcionarios RENAME TO "legacy_all_funcionarios"';
    RAISE NOTICE 'Renamed policy master_all_funcionarios -> legacy_all_funcionarios';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_avaliacoes' AND c.relname = 'avaliacoes')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_avaliacoes' AND c.relname = 'avaliacoes') THEN
    EXECUTE 'ALTER POLICY "master_all_avaliacoes" ON public.avaliacoes RENAME TO "legacy_all_avaliacoes"';
    RAISE NOTICE 'Renamed policy master_all_avaliacoes -> legacy_all_avaliacoes';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_empresas' AND c.relname = 'empresas_clientes')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_empresas' AND c.relname = 'empresas_clientes') THEN
    EXECUTE 'ALTER POLICY "master_all_empresas" ON public.empresas_clientes RENAME TO "legacy_all_empresas"';
    RAISE NOTICE 'Renamed policy master_all_empresas -> legacy_all_empresas';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_lotes' AND c.relname = 'lotes_avaliacao')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_lotes' AND c.relname = 'lotes_avaliacao') THEN
    EXECUTE 'ALTER POLICY "master_all_lotes" ON public.lotes_avaliacao RENAME TO "legacy_all_lotes"';
    RAISE NOTICE 'Renamed policy master_all_lotes -> legacy_all_lotes';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_laudos' AND c.relname = 'laudos')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_laudos' AND c.relname = 'laudos') THEN
    EXECUTE 'ALTER POLICY "master_all_laudos" ON public.laudos RENAME TO "legacy_all_laudos"';
    RAISE NOTICE 'Renamed policy master_all_laudos -> legacy_all_laudos';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_respostas' AND c.relname = 'respostas')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_respostas' AND c.relname = 'respostas') THEN
    EXECUTE 'ALTER POLICY "master_all_respostas" ON public.respostas RENAME TO "legacy_all_respostas"';
    RAISE NOTICE 'Renamed policy master_all_respostas -> legacy_all_respostas';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_resultados' AND c.relname = 'resultados')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_resultados' AND c.relname = 'resultados') THEN
    EXECUTE 'ALTER POLICY "master_all_resultados" ON public.resultados RENAME TO "legacy_all_resultados"';
    RAISE NOTICE 'Renamed policy master_all_resultados -> legacy_all_resultados';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'master_all_clinicas' AND c.relname = 'clinicas')
    AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE p.polname = 'legacy_all_clinicas' AND c.relname = 'clinicas') THEN
    EXECUTE 'ALTER POLICY "master_all_clinicas" ON public.clinicas RENAME TO "legacy_all_clinicas"';
    RAISE NOTICE 'Renamed policy master_all_clinicas -> legacy_all_clinicas';
  END IF;
END $$;

-- 2) Renomear role 'master' na tabela application-level public.roles de forma segura:
DO $$
DECLARE
  master_id INT;
  legacy_id INT;
BEGIN
  SELECT id INTO master_id FROM public.roles WHERE name = 'master';
  IF master_id IS NULL THEN
    RAISE NOTICE 'No application role named "master" found - skipping role rename.';
  ELSE
    SELECT id INTO legacy_id FROM public.roles WHERE name = 'legacy_master';
    IF legacy_id IS NOT NULL THEN
      -- Mesclar permissões: mover permissões do master para legacy_master (sem duplicação)
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT legacy_id, rp.permission_id
      FROM public.role_permissions rp
      WHERE rp.role_id = master_id
      ON CONFLICT DO NOTHING;

      -- Remover entradas antigas associadas ao master e remover o role master
      DELETE FROM public.role_permissions WHERE role_id = master_id;
      DELETE FROM public.roles WHERE id = master_id;

      RAISE NOTICE 'Merged permissions of existing master role into legacy_master and removed master row.';
    ELSE
      -- Renomear o role para legacy_master e marcar display_name como legado
      UPDATE public.roles
      SET name = 'legacy_master', display_name = COALESCE(display_name, name) || ' (legado)'
      WHERE id = master_id;
      RAISE NOTICE 'Renamed application role master -> legacy_master';
    END IF;
  END IF;
END $$;

-- 3) Atualizar função que fazia check para admin_or_master: remover a verificação legada de 'master'
-- (idempotente: substitui o conteúdo atual)

CREATE OR REPLACE FUNCTION public.is_admin_or_master()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    -- Após migração, apenas 'admin' confere privilégio total. Esta função mantém compatibilidade histórica
    RETURN current_user_perfil() = 'admin';
END;
$$;

COMMENT ON FUNCTION public.is_admin_or_master() IS 'Verifica se o usuário atual tem perfil admin (compatibilidade histórica: perfil legado tratado separadamente)';

-- 4) Detectar políticas cuja expressão ainda mencione texto 'master' para revisão manual (não altera automaticamente)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT n.nspname AS schema, c.relname AS table_name, p.polname AS policy_name, pg_get_expr(p.polqual, p.polrelid) AS expr
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE pg_get_expr(p.polqual, p.polrelid) LIKE '%master%'
  LOOP
    RAISE WARNING 'Policy expression contains "master": %.% -> %; expression: %', rec.schema, rec.table_name, rec.policy_name, rec.expr;
  END LOOP;
END $$;

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 102_rename_legacy_role applied: policies/roles renamed where present; please review any WARNING messages for policy expressions referencing "master".'; END $$;
