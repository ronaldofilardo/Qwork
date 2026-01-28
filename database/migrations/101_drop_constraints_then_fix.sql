-- Migration 101: Drop old constraints, migrate legacy profile to 'admin', normalize RH/funcionario data, recreate constraints safely
-- Data: 2026-01-14

BEGIN;

-- 1) Drop problematic constraints first to avoid blocking updates
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_perfil_check;
ALTER TABLE public.funcionarios DROP CONSTRAINT IF EXISTS funcionarios_nivel_cargo_check;

-- 2) Migrate residual legacy profile -> 'admin'
UPDATE public.funcionarios SET perfil = 'admin' WHERE perfil = 'master';

-- 3) Normalize funcionario nivel_cargo
UPDATE public.funcionarios
SET nivel_cargo = 'operacional'
WHERE perfil = 'funcionario' AND nivel_cargo IS NULL;

-- 4) Ensure RH have clinica_id; create placeholder clinic if none exist
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

-- 5) Recreate new constraints aligned with the access model
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

-- 6) Ensure admin only sees RH/Emissor via RLS policy
DROP POLICY IF EXISTS "admin_all_funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "admin_restricted_funcionarios" ON public.funcionarios;
CREATE POLICY "admin_restricted_funcionarios" ON public.funcionarios FOR ALL USING (
  current_setting('app.current_user_perfil', true) = 'admin'
  AND perfil IN ('rh','emissor')
);

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Migration 101 applied: constraints dropped, data normalized, constraints recreated.'; END $$;