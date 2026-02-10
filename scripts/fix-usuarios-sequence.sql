-- Script para resetar sequência usuarios_id_seq em PRODUÇÃO
-- Executar em psql conectado ao Neon
\set ON_ERROR_STOP on

-- Verificar estado atual
SELECT 
    'ANTES' AS momento,
    last_value AS proximo_id,
    (SELECT MAX(id) FROM usuarios) AS max_id_tabela,
    (SELECT COUNT(*) FROM usuarios) AS total_usuarios
FROM usuarios_id_seq;

-- Resetar sequência
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);

-- Verificar resultado após reset
SELECT 
    'DEPOIS' AS momento,
    last_value AS proximo_id,
    (SELECT MAX(id) FROM usuarios) AS max_id_tabela,
    (SELECT COUNT(*) FROM usuarios) AS total_usuarios
FROM usuarios_id_seq;

\echo '✓ Sequência usuarios_id_seq resetada com sucesso'
