-- Migration: Adicionar coluna clinica_id na tabela recibos
-- Data: 2026-01-19
-- Descrição: Permite associar recibos também a clínicas (além de contratantes)

ALTER TABLE recibos 
ADD COLUMN IF NOT EXISTS clinica_id INTEGER;

-- Foreign Key
ALTER TABLE recibos
ADD CONSTRAINT fk_recibos_clinica 
FOREIGN KEY (clinica_id) REFERENCES clinicas (id) ON DELETE CASCADE;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_recibos_clinica ON recibos (clinica_id);

-- Comentário
COMMENT ON COLUMN recibos.clinica_id IS 'ID da clínica associada ao recibo (opcional, para suporte a RH/Clínica)';

-- Ajustar constraint para permitir contratante_id ou clinica_id
ALTER TABLE recibos
DROP CONSTRAINT IF EXISTS recibos_contratante_id_not_null;

ALTER TABLE recibos
ALTER COLUMN contratante_id DROP NOT NULL;

-- Adicionar constraint: pelo menos um deve estar preenchido
ALTER TABLE recibos
ADD CONSTRAINT recibos_contratante_ou_clinica_check 
CHECK (contratante_id IS NOT NULL OR clinica_id IS NOT NULL);
