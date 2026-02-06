-- Migration 092: Obsoleta
-- Esta migration foi tornada obsoleta pelo plano de remoção de gestores em 'funcionarios'.
-- A função `fn_create_funcionario_autorizado` não deve ser criada nem utilizada.

BEGIN;

-- Garantir que a função não exista (será criada em migrações antigas somente por compatibilidade histórica)
DROP FUNCTION IF EXISTS fn_create_funcionario_autorizado(VARCHAR, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN, INTEGER);

-- Registrar aviso para deploys manuais
DO $$
BEGIN
  RAISE NOTICE 'Migration 092 é obsoleta: fn_create_funcionario_autorizado removida por policy de segregação de gestores (usar criação em usuarios)';
END$$;

COMMIT;

COMMIT;
