-- Adicionar coluna para armazenar o hash SHA-256 do PDF do laudo
ALTER TABLE laudos ADD COLUMN hash_pdf VARCHAR(64);

-- Adicionar comentário explicativo
COMMENT ON COLUMN laudos.hash_pdf IS 'Hash SHA-256 do PDF do laudo gerado, usado para integridade e auditoria';