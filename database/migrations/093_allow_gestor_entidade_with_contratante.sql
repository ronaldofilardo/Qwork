-- Allow creating funcionarios with perfil = 'gestor' when contratante_id is provided
BEGIN;

ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_gestor_in_funcionarios;

ALTER TABLE funcionarios
  ADD CONSTRAINT no_gestor_in_funcionarios CHECK (
    perfil <> 'gestor' OR contratante_id IS NOT NULL
  );

COMMIT;
