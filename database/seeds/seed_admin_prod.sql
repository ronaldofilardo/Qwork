-- Seed: Admin para producao Neon
-- CPF: 00000000000
-- USAGE: SET vars.admin_password = '<senha>'; antes de executar este script

-- Habilitar extensao pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Validar que a variavel de senha foi definida antes de executar
DO $$
DECLARE
  v_password text;
BEGIN
  BEGIN
    v_password := current_setting('vars.admin_password');
  EXCEPTION WHEN OTHERS THEN
    v_password := NULL;
  END;

  IF v_password IS NULL OR v_password = '' THEN
    RAISE EXCEPTION 'vars.admin_password nao definida. Execute: SET vars.admin_password = ''<senha>'' antes de rodar este seed.';
  END IF;

  PERFORM set_config('app.current_user_cpf', '00000000000', true);
  PERFORM set_config('app.current_user_perfil', 'admin', true);

  INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
  VALUES (
    '00000000000',
    'Admin Sistema',
    'admin@qwork.com',
    'admin',
    crypt(current_setting('vars.admin_password'), gen_salt('bf')),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (cpf) DO UPDATE
  SET nome         = EXCLUDED.nome,
      email        = EXCLUDED.email,
      tipo_usuario = EXCLUDED.tipo_usuario,
      senha_hash   = EXCLUDED.senha_hash,
      ativo        = EXCLUDED.ativo,
      atualizado_em = CURRENT_TIMESTAMP;
END $$;

COMMIT;
