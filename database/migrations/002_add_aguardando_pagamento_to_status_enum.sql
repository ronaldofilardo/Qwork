-- Migration: Adicionar 'aguardando_pagamento' ao enum status_aprovacao_enum
-- Data: 2026-01-15
-- Descrição: Corrige discrepância entre TypeScript e banco de dados
--            Adiciona o valor 'aguardando_pagamento' necessário para o fluxo
--            cadastro → simulador de pagamento

-- Verificar se o valor já existe (para idempotência)
DO $$
BEGIN
    -- Tentar adicionar o valor ao enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'aguardando_pagamento' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_aprovacao_enum')
    ) THEN
        -- Adicionar o novo valor ao final do enum
        ALTER TYPE status_aprovacao_enum ADD VALUE 'aguardando_pagamento';
        RAISE NOTICE 'Valor aguardando_pagamento adicionado com sucesso';
    ELSE
        RAISE NOTICE 'Valor aguardando_pagamento já existe no enum';
    END IF;
END $$;

-- Verificar o resultado
SELECT enumlabel, enumsortorder
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'status_aprovacao_enum'
ORDER BY e.enumsortorder;
