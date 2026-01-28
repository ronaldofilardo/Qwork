-- Ajusta a constraint funcionarios_clinica_check para permitir empresa_id em vez de clinica_id
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS funcionarios_clinica_check;
ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_clinica_check CHECK (
  (clinica_id IS NOT NULL) OR (empresa_id IS NOT NULL) OR ((perfil)::text = 'emissor')
);