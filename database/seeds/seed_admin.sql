-- Seed: garante existência do admin do sistema

-- Habilitar extensão pgcrypto se não existir (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Tenta inserir em `usuarios` (nova estrutura). Se colunas necessárias não existirem, faz fallback para `funcionarios`.
DO $$
BEGIN
  -- Set session variables so audit triggers can run without failing
  PERFORM set_config('app.current_user_cpf', '00000000000', true);
  PERFORM set_config('app.current_user_perfil', 'admin', true);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario') THEN

      INSERT INTO usuarios (cpf, nome, email, tipo_usuario, senha_hash, ativo, criado_em, atualizado_em)
      VALUES (
        '00000000000',
        'Admin',
        'admin@qwork.com',
        'admin',
        crypt('5978rdf', gen_salt('bf')),
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (cpf) DO UPDATE
      SET nome = EXCLUDED.nome,
          email = EXCLUDED.email,
          tipo_usuario = EXCLUDED.tipo_usuario,
          senha_hash = EXCLUDED.senha_hash,
          ativo = EXCLUDED.ativo,
          atualizado_em = CURRENT_TIMESTAMP;

      RAISE NOTICE 'Seed: admin inserted/updated into usuarios';

    ELSE
      -- Fallback: inserir em funcionarios caso a estrutura de usuarios não seja compatível
      INSERT INTO funcionarios (cpf, nome, perfil, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
      VALUES (
        '00000000000',
        'Admin',
        'admin',
        'admin',
        crypt('5978rdf', gen_salt('bf')),
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (cpf) DO UPDATE
      SET nome = EXCLUDED.nome,
          perfil = EXCLUDED.perfil,
          usuario_tipo = EXCLUDED.usuario_tipo,
          senha_hash = EXCLUDED.senha_hash,
          ativo = EXCLUDED.ativo,
          atualizado_em = CURRENT_TIMESTAMP;

      RAISE NOTICE 'Seed: admin inserted/updated into funcionarios (fallback)';
    END IF;
  ELSE
    -- Se tabela usuarios não existir, faz fallback para funcionarios
    INSERT INTO funcionarios (cpf, nome, perfil, usuario_tipo, senha_hash, ativo, criado_em, atualizado_em)
    VALUES (
      '00000000000',
      'Admin',
      'admin',
      'admin',
      crypt('5978rdf', gen_salt('bf')),
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (cpf) DO UPDATE
    SET nome = EXCLUDED.nome,
        perfil = EXCLUDED.perfil,
        usuario_tipo = EXCLUDED.usuario_tipo,
        senha_hash = EXCLUDED.senha_hash,
        ativo = EXCLUDED.ativo,
        atualizado_em = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Seed: usuarios table not found — admin inserted into funcionarios';
  END IF;
END
$$;

COMMIT;
