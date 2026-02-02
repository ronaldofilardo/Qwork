-- Script para diagnosticar e corrigir problema de sequência da tabela lotes_avaliacao
-- Data: 2026-02-01

-- 1. Verificar se a sequência existe
SELECT 
    schemaname, 
    sequencename, 
    last_value, 
    is_called 
FROM pg_sequences 
WHERE sequencename = 'lotes_avaliacao_id_seq';

-- 2. Verificar se o DEFAULT está configurado corretamente
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'lotes_avaliacao' AND column_name = 'id';

-- 3. Verificar o maior ID atual na tabela
SELECT MAX(id) as max_id FROM lotes_avaliacao;

-- 4. Sincronizar a sequência com o maior ID da tabela
-- (executar apenas se necessário)
SELECT setval('lotes_avaliacao_id_seq', COALESCE((SELECT MAX(id) FROM lotes_avaliacao), 1), true);

-- 5. Verificar se a sequência está sincronizada agora
SELECT 
    currval('lotes_avaliacao_id_seq') as current_value,
    (SELECT MAX(id) FROM lotes_avaliacao) as max_id_in_table;

-- 6. Testar se o DEFAULT funciona
-- (comentar para executar separadamente se desejar testar)
-- SELECT nextval('lotes_avaliacao_id_seq');
