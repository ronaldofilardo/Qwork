-- Add hash_contrato column to contratos table
-- This column stores the hash of the contract content for integrity verification

ALTER TABLE contratos ADD COLUMN hash_contrato VARCHAR(128);

-- Add index for performance
CREATE INDEX idx_contratos_hash_contrato ON contratos (hash_contrato);

-- Add comment
COMMENT ON COLUMN contratos.hash_contrato IS 'Hash SHA-256 do conteúdo do contrato para verificação de integridade';