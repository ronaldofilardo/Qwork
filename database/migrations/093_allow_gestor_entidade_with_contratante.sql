-- Allow creating funcionarios with perfil = 'gestor_entidade' when contratante_id is provided
BEGIN;

ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_gestor_entidade_in_funcionarios;

ALTER TABLE funcionarios
  ADD CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (
    perfil <> 'gestor_entidade' OR contratante_id IS NOT NULL
  );

COMMIT;
