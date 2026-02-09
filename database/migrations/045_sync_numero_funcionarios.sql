-- Migration 045: Adicionar trigger para sincronizar dados entre tabelas
-- Data: 26/12/2025
-- Descricao: Sincroniza automaticamente numero_funcionarios entre tomadores e contratacao_personalizada

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contratacao_personalizada') THEN

        -- Funcao para sincronizar numero_funcionarios
        CREATE OR REPLACE FUNCTION sync_numero_funcionarios_contratacao()
        RETURNS TRIGGER AS $func$
        BEGIN
            -- Quando contratacao_personalizada e atualizada, sincronizar com tomadores
            IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
                UPDATE tomadores
                SET numero_funcionarios_estimado = NEW.numero_funcionarios_estimado
                WHERE id = NEW.contratante_id
                AND (numero_funcionarios_estimado IS NULL
                     OR numero_funcionarios_estimado != NEW.numero_funcionarios_estimado);
            END IF;

            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Criar trigger se nao existir
        DROP TRIGGER IF EXISTS trg_sync_numero_funcionarios ON contratacao_personalizada;

        CREATE TRIGGER trg_sync_numero_funcionarios
        AFTER INSERT OR UPDATE OF numero_funcionarios_estimado
        ON contratacao_personalizada
        FOR EACH ROW
        EXECUTE FUNCTION sync_numero_funcionarios_contratacao();

        RAISE NOTICE 'Migration 045: Trigger de sincronizacao criado';
    ELSE
        RAISE NOTICE 'Migration 045: Tabela contratacao_personalizada nao existe';
    END IF;
END $$;
