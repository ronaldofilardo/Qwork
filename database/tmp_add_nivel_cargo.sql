BEGIN;

ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS nivel_cargo public.nivel_cargo_enum;

CREATE INDEX IF NOT EXISTS idx_funcionarios_nivel_cargo ON funcionarios (nivel_cargo);

UPDATE funcionarios SET nivel_cargo = 'operacional' WHERE nivel_cargo IS NULL AND perfil IN ('funcionario','rh');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'funcionarios_nivel_cargo_check' AND table_name = 'funcionarios'
  ) THEN
    ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_nivel_cargo_check CHECK (
      (perfil IN ('admin','emissor') AND nivel_cargo IS NULL) OR
      (perfil IN ('funcionario','rh') AND nivel_cargo IN ('operacional','gestao'))
    );
  END IF;
END;
$$;

COMMIT;