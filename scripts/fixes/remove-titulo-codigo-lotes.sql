-- Remover colunas titulo e codigo da tabela lotes_avaliacao
-- Motivo: Sistema agora usa apenas ID do lote (que é igual ao ID do laudo)
-- O numero_ordem é mantido para rastreabilidade sequencial
-- A descricao é mantida para contexto adicional

-- Verificar se as colunas existem antes de remover
DO $$
BEGIN
    -- Remover coluna titulo se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'titulo'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN titulo;
        RAISE NOTICE 'Coluna titulo removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna titulo já não existe';
    END IF;

    -- Remover coluna codigo se existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lotes_avaliacao' 
        AND column_name = 'codigo'
    ) THEN
        ALTER TABLE lotes_avaliacao DROP COLUMN codigo;
        RAISE NOTICE 'Coluna codigo removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna codigo já não existe';
    END IF;
END $$;

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lotes_avaliacao' 
ORDER BY ordinal_position;
