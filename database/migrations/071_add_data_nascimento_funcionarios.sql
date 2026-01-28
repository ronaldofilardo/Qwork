-- Migration: Add data_nascimento to funcionarios
-- Adds a DATE column to store employee birth dates

ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Optional: add comment for clarity
COMMENT ON COLUMN funcionarios.data_nascimento IS 'Data de nascimento do funcionário (YYYY-MM-DD)';
