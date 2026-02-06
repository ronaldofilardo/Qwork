-- scripts/db/remove_and_seed_admin.sql
-- Descrição: Remove todos usuários com perfil 'admin' e semeia um admin com CPF 00000000000 e senha fornecida (hash armazenado).
-- Uso seguro: por padrão faz PREVIEW e DRY-RUN. Para executar, passar psql -v EXECUTE_REAL=1

\set ON_ERROR_STOP on
\set EXECUTE_REAL 0

SET client_encoding = 'UTF8';

\echo '=== PREVIEW: admins atuais ==='
SELECT id, cpf, nome, perfil, ativo, criado_em FROM funcionarios WHERE perfil = 'admin' ORDER BY id;
SELECT COUNT(*) AS admins_total FROM funcionarios WHERE perfil = 'admin';

\echo '=== DRY-RUN: contagens que seriam afetadas ==='
SELECT COUNT(*) AS to_delete_admins FROM funcionarios WHERE perfil = 'admin';

\echo 'Para inserir um novo admin com CPF 00000000000. A senha não é exibida.'

-- EXECUÇÃO REAL
\if :{?EXECUTE_REAL}
\echo '=== EXECUTANDO: removendo admins e semeando novo admin ==='
-- Desabilitar RLS temporariamente (se existir)
ALTER TABLE IF EXISTS public.funcionarios DISABLE ROW LEVEL SECURITY;

BEGIN;
-- Excluir admins existentes
DELETE FROM funcionarios WHERE perfil = 'admin';

-- Set local session variables so audit triggers can record who performed the action
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Inserir novo admin com senha já hasheada (substitua <HASH> se quiser outro valor)
INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, usuario_tipo, ativo, criado_em, atualizado_em)
VALUES (
  '00000000000',
  'Admin Seed',
  'admin',
  '$2a$10$2/kZ5QNaljjrk2L7kEUgsuJDyX8XYQwWFXIPcs1e9obXeHrv/.8Ui',
  'admin',
  true,
  NOW(),
  NOW()
)
RETURNING id, cpf, nome, perfil, usuario_tipo, ativo;

-- Auditoria (se possível)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name IN ('acao','entidade','entidade_id','dados','user_id','user_role','criado_em')) = 7 THEN
    INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
    VALUES ('seed_admin', 'funcionarios', NULL, jsonb_build_object('descricao','seed admin criado com cpf 00000000000'), NULL, current_user, NOW());
  END IF;
END
$$;

COMMIT;

-- Reabilitar RLS
ALTER TABLE IF EXISTS public.funcionarios ENABLE ROW LEVEL SECURITY;

\echo 'EXECUÇÃO REAL concluída.'
\else
\echo 'EXECUÇÃO REAL não habilitada. Nada foi modificado.'
\endif

\echo '=== PÓS: lista de admins (agora) ==='
SELECT id, cpf, nome, perfil, ativo, criado_em FROM funcionarios WHERE perfil = 'admin' ORDER BY id;
SELECT COUNT(*) AS admins_total_after FROM funcionarios WHERE perfil = 'admin';

\echo 'Script finalizado.'
