-- Seed: Dados de demonstração para usuario_tipo
-- Data: 31/01/2026

BEGIN;

\echo '=== SEED: INSERINDO USUÁRIOS DE DEMONSTRAÇÃO ==='

-- Desabilitar triggers temporariamente
ALTER TABLE funcionarios DISABLE TRIGGER ALL;

-- 1. Admin do sistema
INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, ativo)
VALUES ('00000000000', 'Admin Sistema', 'admin@qwork.com', '$2a$10$NNUkJ.nfWUrrDlUtqFypKeurSQBavEjD.7GumEzEh8WaLCD8Rf9Ie', 'admin', 'admin', true)
ON CONFLICT (cpf) DO UPDATE
SET senha_hash = EXCLUDED.senha_hash, 
    perfil = 'admin',
    usuario_tipo = 'admin',
    ativo = true,
    atualizado_em = NOW();

\echo '   ✓ Admin criado (CPF: 00000000000, Senha: 5978rdf)'

-- Reabilitar triggers
ALTER TABLE funcionarios ENABLE TRIGGER ALL;

COMMIT;

\echo '=== SEED CONCLUÍDO ==='
\echo ''
\echo 'Usuário criado:'
\echo '  CPF: 00000000000'
\echo '  Senha: 5978rdf'
\echo '  Perfil: admin'
\echo '  Tipo: admin'
\echo ''
\echo 'Login: http://localhost:3000/login'
