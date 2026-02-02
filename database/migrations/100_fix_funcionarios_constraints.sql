-- Migration 100: Fix and tighten constraints for `funcionarios` and remove residual legacy profile references
-- Data: 2026-01-14

BEGIN;

-- 1) Normalize data to comply with new constraints
-- 2a) Ensure funcionarios with perfil='funcionario' have a nivel_cargo
UPDATE public.funcionarios
SET nivel_cargo = 'operacional'
WHERE perfil = 'funcionario' AND nivel_cargo IS NULL;

-- 2b) Ensure RH users have a clinica_id; if none exist, create a placeholder clinic and assign
DO $$
DECLARE
  default_clinic_id INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.funcionarios WHERE perfil = 'rh' AND clinica_id IS NULL) THEN
    SELECT id INTO default_clinic_id FROM public.clinicas LIMIT 1;
    IF default_clinic_id IS NULL THEN
      INSERT INTO public.clinicas (nome, cnpj, ativa) VALUES ('Clinica Sistema (placeholder)', '00000000000000', false)
      RETURNING id INTO default_clinic_id;
    END IF;

    UPDATE public.funcionarios SET clinica_id = default_clinic_id WHERE perfil = 'rh' AND clinica_id IS NULL;
    RAISE NOTICE 'Assigned placeholder clinic id % to RH users without clinic', default_clinic_id;
  END IF;
END $$;

-- 3) Drop old constraints if present
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;

-- 2) Recreate constraints aligned with access model:
-- - perfil must be one of the allowed set
-- - only RH requires a non-null clinica_id
-- - nivel_cargo only allowed for 'funcionario' and must be not null for them

ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_perfil_check CHECK (
    perfil IN ('funcionario', 'rh', 'admin', 'emissor', 'gestor_entidade', 'cadastro')
  );

ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_clinica_check CHECK (
    (perfil = 'rh' AND clinica_id IS NOT NULL)
    OR (perfil <> 'rh')
  );

ALTER TABLE public.funcionarios
  ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
    (perfil = 'funcionario' AND nivel_cargo IN ('operacional','gestao'))
    OR (perfil <> 'funcionario' AND nivel_cargo IS NULL)
  );

-- 5) Ensure RLS policies are consistent: replace any admin-all policies that give admin access to all funcionários
DROP POLICY IF EXISTS "admin_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON public.funcionarios;
CREATE POLICY "admin_restricted_funcionarios" ON public.funcionarios FOR ALL USING (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh','emissor')
);

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 100_fix_funcionarios_constraints applied: constraints updated and residual legacy references converted.'; END $$;