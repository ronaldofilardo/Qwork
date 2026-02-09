-- ============================================================
-- SEED: Criar usuário EMISSOR em PRODUÇÃO (Neon)
-- Data: 09/02/2026
-- CPF: 53051173991
-- Nome: Emissor Teste QWork
-- Email: emissor@qwork.com.br
-- Senha: 5978rdF (ignorada no login para emissor)
-- ============================================================

BEGIN;

-- Verificar se emissor já existe
DO $$
DECLARE
  cpf_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM usuarios WHERE cpf = '53051173991') INTO cpf_exists;
  
  IF cpf_exists THEN
    -- Atualizar emissor existente
    UPDATE usuarios
    SET 
      nome = 'Emissor Teste QWork',
      email = 'emissor@qwork.com.br',
      tipo_usuario = 'emissor',
      ativo = true,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE cpf = '53051173991';
    
    RAISE NOTICE '✓ Emissor atualizado com sucesso (CPF: 53051173991)';
  ELSE
    -- Criar novo emissor
    INSERT INTO usuarios (cpf, nome, email, tipo_usuario, ativo, criado_em, atualizado_em)
    VALUES (
      '53051173991',
      'Emissor Teste QWork',
      'emissor@qwork.com.br',
      'emissor',
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE '✓ Emissor criado com sucesso (CPF: 53051173991)';
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
WHERE cpf = '53051173991';

COMMIT;

-- ============================================================
-- INSTRUÇÕES DE LOGIN
-- ============================================================
-- CPF: 53051173991
-- Senha: 5978rdF (não é validada para emissor, qualquer senha funciona)
-- URL: /emissor (depois de fazer login)
--
-- NOTA: O sistema QWork não valida senha para usuários do tipo 'admin'
-- e 'emissor'. Eles fazem login apenas com CPF válido.
-- ============================================================
