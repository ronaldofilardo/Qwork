-- Migration 089: Recriar política pagamentos_responsavel_select usando enum
-- Data: 2026-01-24

BEGIN;

DROP POLICY IF EXISTS pagamentos_responsavel_select ON pagamentos;
CREATE POLICY pagamentos_responsavel_select ON pagamentos
    FOR SELECT TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM contratantes c
            WHERE c.id = pagamentos.contratante_id
            AND c.responsavel_cpf = current_user_cpf()
            AND c.status = 'aprovado'::status_aprovacao_enum
        )
    );

COMMIT;
