-- MIGRATION 011: Corrigir FK clinicas_empresas para referenciar clinicas.id
-- Data: 2025-12-20
-- Descricao: A tabela clinicas_empresas deve vincular clinicas.id com empresas_clientes.id,
--            nao funcionarios.id. Esta migration corrige a integridade referencial.

BEGIN;

-- 1. Verificar se existe dados na tabela clinicas_empresas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM clinicas_empresas;
    RAISE NOTICE 'Registros encontrados em clinicas_empresas: %', v_count;
END $$;

-- 2. Criar tabela temporaria para backup dos dados
CREATE TEMP TABLE clinicas_empresas_backup AS
SELECT * FROM clinicas_empresas;

-- 3. Dropar a constraint FK incorreta
ALTER TABLE clinicas_empresas
DROP CONSTRAINT IF EXISTS clinicas_empresas_clinica_id_fkey;

-- 4. Dropar indice existente
DROP INDEX IF EXISTS idx_clinicas_empresas_clinica;

-- 5. Limpar dados invalidos (clinica_id que nao existe em clinicas)
DELETE FROM clinicas_empresas
WHERE clinica_id NOT IN (SELECT id FROM clinicas);

-- 6. Adicionar nova constraint FK correta
ALTER TABLE clinicas_empresas
ADD CONSTRAINT clinicas_empresas_clinica_id_fkey
FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;

-- 7. Recriar indice
CREATE INDEX idx_clinicas_empresas_clinica ON clinicas_empresas(clinica_id);

-- 8. Atualizar comentario da coluna
COMMENT ON COLUMN clinicas_empresas.clinica_id IS 'ID da clinica de medicina ocupacional';

-- 9. Verificacao final de integridade apos migration
DO $$
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM clinicas_empresas ce
    WHERE NOT EXISTS (SELECT 1 FROM clinicas c WHERE c.id = ce.clinica_id)
       OR NOT EXISTS (SELECT 1 FROM empresas_clientes ec WHERE ec.id = ce.empresa_id);

    IF v_orphan_count > 0 THEN
        RAISE EXCEPTION 'Integridade violada: % registros orfaos encontrados', v_orphan_count;
    END IF;

    RAISE NOTICE 'Integridade verificada com sucesso';
END $$;

COMMIT;

-- 10. Verificacao final
SELECT
    'clinicas_empresas' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT clinica_id) as clinicas_distintas,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM clinicas_empresas;