-- MIGRATION 014: Adicionar FK explicita em analise_estatistica.avaliacao_id
-- Data: 2025-12-20
-- Descricao: A tabela analise_estatistica deve ter FK explicita para avaliacoes(id)
--            para evitar dados orfaos e garantir integridade referencial.

BEGIN;

-- 1. Verificar se a constraint ja existe
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'analise_estatistica_avaliacao_id_fkey'
        AND table_name = 'analise_estatistica'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
        RAISE NOTICE 'FK constraint analise_estatistica_avaliacao_id_fkey ja existe - pulando criacao';
        RETURN;
    END IF;
END $$;

-- 2. Verificar dados orfaos existentes
DO $$
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM analise_estatistica ae
    WHERE ae.avaliacao_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = ae.avaliacao_id);

    IF v_orphan_count > 0 THEN
        RAISE WARNING 'Encontrados % registros orfaos em analise_estatistica', v_orphan_count;

        -- Criar backup dos registros orfaos
        CREATE TABLE IF NOT EXISTS analise_estatistica_orphans_backup AS
        SELECT ae.*
        FROM analise_estatistica ae
        WHERE ae.avaliacao_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = ae.avaliacao_id);

        RAISE NOTICE 'Backup de registros orfaos criado: analise_estatistica_orphans_backup';

        -- Remover registros orfaos
        DELETE FROM analise_estatistica
        WHERE avaliacao_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = avaliacao_id);

        RAISE NOTICE '% registros orfaos removidos', v_orphan_count;
    ELSE
        RAISE NOTICE 'Nenhum registro orfao encontrado';
    END IF;
END $$;

-- 3. Adicionar FK constraint
ALTER TABLE analise_estatistica
ADD CONSTRAINT analise_estatistica_avaliacao_id_fkey
FOREIGN KEY (avaliacao_id)
REFERENCES avaliacoes(id)
ON DELETE CASCADE;

-- 4. Criar indice para performance
CREATE INDEX IF NOT EXISTS idx_analise_estatistica_avaliacao
ON analise_estatistica(avaliacao_id);

-- 5. Verificar constraint criada
DO $$
DECLARE
    v_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'analise_estatistica_avaliacao_id_fkey'
        AND table_name = 'analise_estatistica'
    ) INTO v_constraint_exists;

    IF v_constraint_exists THEN
        RAISE NOTICE 'FK constraint criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao criar FK constraint';
    END IF;
END $$;

COMMIT;

-- 6. Estatisticas finais
SELECT
    COUNT(*) as total_analises,
    COUNT(DISTINCT avaliacao_id) as avaliacoes_analisadas,
    COUNT(CASE WHEN anomalia_detectada THEN 1 END) as com_anomalia
FROM analise_estatistica;