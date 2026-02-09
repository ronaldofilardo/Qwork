-- ============================================================
-- SEED: Criar usuário ADMIN em PRODUÇÃO (Neon)
-- Data: 09/02/2026
-- CPF: 87545772920
-- Senha: 5978rdF (ignorada no login para admin)
-- ============================================================

BEGIN;

-- Verificar se admin já existe
DO $$
DECLARE
  cpf_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = '87545772920') INTO cpf_exists;
  
  IF cpf_exists THEN
    -- Atualizar admin existente
    UPDATE usuarios
    SET 
      nome = 'Administrador QWork',
      email = 'admin@qwork.com.br',
      tipo_usuario = 'admin',
      ativo = true,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE cpf = '87545772920';
    
    RAISE NOTICE '✓ Admin atualizado com sucesso (CPF: 87545772920)';
  ELSE
    -- Criar novo admin
    INSERT INTO usuarios (cpf, nome, email, tipo_usuario, ativo, criado_em, atualizado_em)
    VALUES (
      '87545772920',
      'Administrador QWork',
      'admin@qwork.com.br',
      'admin',
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✓ Admin criado com sucesso (CPF: 87545772920)';
  END IF;
END $$;

-- Verificar resultado
SELECT 
  cpf,
  nome,
  email,
  tipo_usuario,
  ativo,
  criado_em,
  atualizado_em
FROM usuarios 
WHERE cpf = '87545772920';

COMMIT;

-- ============================================================
-- INSTRUÇÕES DE LOGIN
-- ============================================================
-- CPF: 87545772920
-- Senha: 5978rdF (não é validada para admin, qualquer senha funciona)
-- 
-- NOTA: O sistema QWork não valida senha para usuários do tipo 'admin'
-- e 'emissor'. Eles fazem login apenas com CPF válido.
-- Se desejar adicionar autenticação por senha, consulte a documentação
-- ou abra uma issue no GitHub.
-- ============================================================
