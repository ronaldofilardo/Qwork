-- Migration 094: Obsoleta
-- Esta migration foi tornada obsoleta e NÃO deve recriar a função `fn_create_funcionario_autorizado`.

BEGIN;

DROP FUNCTION IF EXISTS fn_create_funcionario_autorizado(VARCHAR, TEXT, TEXT, TEXT, VARCHAR, BOOLEAN, INTEGER);

DO $$
BEGIN
  RAISE NOTICE 'Migration 094 é obsoleta e foi convertida para remover fn_create_funcionario_autorizado';
END$$;

COMMIT;
