-- ====================================================================
-- Migration 1005: Corrigir FK laudos.emissor_cpf para referenciar usuarios
-- Data: 2026-02-10
-- Objetivo: Emissores estão na tabela usuarios, não funcionarios
-- ====================================================================

BEGIN;

-- Remover constraint antiga que aponta para funcionarios
ALTER TABLE laudos 
DROP CONSTRAINT IF EXISTS fk_laudos_emissor_cpf;

-- Criar nova constraint apontando para usuarios
ALTER TABLE laudos
ADD CONSTRAINT fk_laudos_emissor_cpf 
FOREIGN KEY (emissor_cpf) 
REFERENCES usuarios(cpf) 
ON DELETE RESTRICT;

-- Adicionar comentário
COMMENT ON CONSTRAINT fk_laudos_emissor_cpf ON laudos IS 
'Garante que emissor existe na tabela usuarios. RESTRICT previne deleção de emissor com laudos.';

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN;
-- ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_emissor_cpf;
-- ALTER TABLE laudos ADD CONSTRAINT fk_laudos_emissor_cpf FOREIGN KEY (emissor_cpf) REFERENCES funcionarios(cpf) ON DELETE RESTRICT;
-- COMMIT;
