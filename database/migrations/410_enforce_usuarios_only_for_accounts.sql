-- ====================================================================
-- Migration 410: Enforce - Contas do sistema APENAS em 'usuarios'
-- Data: 2026-02-05
-- Prioridade: CRÍTICA
-- ====================================================================
-- OBJETIVO:
--   Garantir que admin, emissor, gestor e rh sejam cadastrados
--   APENAS na tabela 'usuarios' e JAMAIS em 'funcionarios'.
--
--   AÇÕES:
--   1. Adicionar CHECK constraint na tabela funcionarios
--   2. Criar trigger para rejeitar inserções/updates com mensagem clara
--   3. Garantir que migration 400 já moveu gestores existentes
--
-- IMPORTANTE:
--   - Banco está sem admin e sem contratantes (sem backup necessário)
--   - Esta migration é idempotente (pode ser executada múltiplas vezes)
-- ====================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 410: ENFORCE USUARIOS ONLY'
\echo 'Iniciando em:' :current_timestamp
\echo '========================================='

-- ====================================================================
-- PARTE 1: ADICIONAR CHECK CONSTRAINT
-- ====================================================================

\echo ''
\echo 'PARTE 1: Adicionando CHECK constraint em funcionarios...'

-- Dropar constraint se já existir (idempotência)
ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS no_account_roles_in_funcionarios;

-- Adicionar constraint que proíbe roles de contas do sistema
ALTER TABLE funcionarios
  ADD CONSTRAINT no_account_roles_in_funcionarios 
  CHECK (usuario_tipo NOT IN ('admin', 'emissor', 'gestor', 'rh'));

\echo '✓ CHECK constraint adicionada: no_account_roles_in_funcionarios'

-- ====================================================================
-- PARTE 2: CRIAR TRIGGER PARA MENSAGEM AMIGÁVEL
-- ====================================================================

\echo ''
\echo 'PARTE 2: Criando trigger para rejeitar roles proibidos...'

-- Dropar função e trigger se já existirem (idempotência)
DROP TRIGGER IF EXISTS trg_reject_prohibited_roles ON funcionarios;
DROP FUNCTION IF EXISTS trg_reject_prohibited_roles_func() CASCADE;

-- Criar função do trigger
CREATE FUNCTION trg_reject_prohibited_roles_func()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.usuario_tipo = ANY(ARRAY['admin'::usuario_tipo_enum, 'emissor'::usuario_tipo_enum, 'gestor'::usuario_tipo_enum, 'rh'::usuario_tipo_enum]) THEN
    RAISE EXCEPTION 'ERRO: Contas do sistema (admin/emissor/gestor/rh) devem ser cadastradas na tabela "usuarios", não em "funcionarios". Use a tabela usuarios para criar contas com acesso ao sistema.'
      USING HINT = 'A tabela funcionarios é apenas para funcionários avaliados (sem acesso ao sistema).';
  END IF;
  
  -- Compatibilidade com perfil legacy (se alguém tentar usar perfil também)
  IF NEW.perfil IS NOT NULL AND NEW.perfil = ANY(ARRAY['admin', 'emissor', 'gestor', 'rh']) THEN
    RAISE EXCEPTION 'ERRO: Perfis de contas (admin/emissor/gestor/rh) não permitidos em funcionarios. Use a tabela usuarios.'
      USING HINT = 'Migration 400 já removeu gestores de funcionarios. Novos registros devem ser criados em usuarios.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trg_reject_prohibited_roles
  BEFORE INSERT OR UPDATE ON funcionarios
  FOR EACH ROW 
  EXECUTE FUNCTION trg_reject_prohibited_roles_func();

\echo '✓ Trigger criado: trg_reject_prohibited_roles'

-- ====================================================================
-- PARTE 3: VALIDAÇÃO
-- ====================================================================

\echo ''
\echo 'PARTE 3: Validando constraint e trigger...'

-- Verificar constraint
DO $$
DECLARE
  v_constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_constraint_count
  FROM information_schema.table_constraints
  WHERE table_name = 'funcionarios'
    AND constraint_name = 'no_account_roles_in_funcionarios';
  
  IF v_constraint_count = 0 THEN
    RAISE EXCEPTION 'ERRO: Constraint no_account_roles_in_funcionarios não foi criada';
  END IF;
  
  RAISE NOTICE '✓ Constraint no_account_roles_in_funcionarios validada';
END $$;

-- Verificar trigger
DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'funcionarios'
    AND trigger_name = 'trg_reject_prohibited_roles';
  
  IF v_trigger_count = 0 THEN
    RAISE EXCEPTION 'ERRO: Trigger trg_reject_prohibited_roles não foi criado';
  END IF;
  
  RAISE NOTICE '✓ Trigger trg_reject_prohibited_roles validado';
END $$;

-- ====================================================================
-- PARTE 4: COMENTÁRIOS E DOCUMENTAÇÃO
-- ====================================================================

\echo ''
\echo 'PARTE 4: Adicionando comentários...'

COMMENT ON CONSTRAINT no_account_roles_in_funcionarios ON funcionarios IS
'Impede que contas do sistema (admin, emissor, gestor, rh) sejam cadastradas em funcionarios.
Essas contas devem ser criadas APENAS na tabela usuarios.
Adicionado em Migration 410 (2026-02-05).';

COMMENT ON FUNCTION trg_reject_prohibited_roles_func() IS
'Trigger function que rejeita inserções/updates de roles proibidos em funcionarios.
Fornece mensagem de erro clara direcionando para a tabela usuarios.
Adicionado em Migration 410 (2026-02-05).';

\echo '✓ Comentários adicionados'

-- ====================================================================
-- FINALIZAÇÃO
-- ====================================================================

\echo ''
\echo '========================================='
\echo 'MIGRATION 410: CONCLUÍDA COM SUCESSO'
\echo 'Finalizando em:' :current_timestamp
\echo '========================================='
\echo ''
\echo 'RESUMO:'
\echo '  ✓ CHECK constraint adicionada em funcionarios'
\echo '  ✓ Trigger de validação criado'
\echo '  ✓ Documentação adicionada'
\echo ''
\echo 'RESULTADO: A partir de agora, qualquer tentativa de criar'
\echo 'admin/emissor/gestor/rh em funcionarios será rejeitada.'
\echo 'Essas contas devem ser criadas APENAS em usuarios.'
\echo ''

COMMIT;
