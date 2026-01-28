-- Migration 087: Converter contratantes.status e ajustar políticas dependentes
-- Data: 2026-01-24

BEGIN;

-- 1. Drop policy that references status to allow type change
DROP POLICY IF EXISTS contratantes_responsavel_update ON contratantes;

-- 2. Ensure safe values
UPDATE contratantes SET status = 'pendente' WHERE status NOT IN (
  SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_aprovacao_enum'
);

-- 3. Alter type
ALTER TABLE contratantes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE contratantes ALTER COLUMN status TYPE status_aprovacao_enum USING status::status_aprovacao_enum;
ALTER TABLE contratantes ALTER COLUMN status SET DEFAULT 'pendente';

-- 4. Recreate policy using enum constants (explicit casts)
CREATE POLICY contratantes_responsavel_update ON contratantes
    FOR UPDATE TO PUBLIC
    USING (
        responsavel_cpf = current_user_cpf()
        AND status IN ('pendente'::status_aprovacao_enum, 'em_reanalise'::status_aprovacao_enum, 'aguardando_pagamento'::status_aprovacao_enum)
    );

COMMIT;
