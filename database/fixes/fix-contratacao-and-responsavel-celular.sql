-- Ajustes restantes: adiciona coluna plano_id em contratacao_personalizada e responsavel_celular em tomadores
BEGIN;

ALTER TABLE IF EXISTS contratacao_personalizada
  ADD COLUMN IF NOT EXISTS plano_id INTEGER;

ALTER TABLE IF EXISTS tomadores
  ADD COLUMN IF NOT EXISTS responsavel_celular VARCHAR(32);

COMMIT;
