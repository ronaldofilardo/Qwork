-- ====================================================================
-- Migration 999: Reset sequência usuarios_id_seq
-- Data: 2026-02-10
-- Problema: Sequência desatualizada causando erro "duplicate key"
-- Solução: Resetar sequência para MAX(id) + 1
-- ====================================================================

BEGIN;

-- Resetar sequência usuarios_id_seq para o próximo ID disponível
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);

-- Verificar resultado
SELECT 
    'usuarios_id_seq' AS sequencia,
    last_value AS proximo_id,
    (SELECT MAX(id) FROM usuarios) AS max_id_tabela
FROM usuarios_id_seq;

COMMIT;

-- Mensagem de sucesso
SELECT '✓ Migration 999 aplicada - Sequência usuarios_id_seq resetada' AS status;
