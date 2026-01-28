-- Migração 056: criar tabela usuarios mínima para compatibilidade com triggers/serviços
-- Data: 20/01/2026
-- Descrição: Cria tabela 'usuarios' com colunas necessárias para notificações e insere um admin de dev

BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Criar um admin de desenvolvimento caso não exista
INSERT INTO usuarios (cpf, nome, role, ativo)
SELECT '00000000000', 'Admin Dev', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE cpf = '00000000000');

COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema (mínima para compatibilidade em DEV)';

COMMIT;

SELECT '✓ Migração 056 aplicada com sucesso' AS status;
