-- Migration: 1149 — Criar tabela importacao_templates (segregada por usuário/tenant)
-- Data: 2026-04-15
-- Descrição:
--   Templates de importação em massa migram de localStorage (client-side, sem isolamento)
--   para o banco de dados, com isolamento completo por:
--     - clinica_id  (fluxo RH)      ou
--     - entidade_id (fluxo Entidade)
--     - criado_por_cpf (nível de usuário — cada CPF vê apenas seus próprios templates)
--   Um template pertence EXCLUSIVAMENTE a uma clínica OU a uma entidade (nunca ambos).
-- Idempotente: pode ser executado múltiplas vezes.
-- =============================================================================

BEGIN;

-- =============================================================================
-- Criar tabela
-- =============================================================================

CREATE TABLE IF NOT EXISTS importacao_templates (
    id               SERIAL PRIMARY KEY,
    nome             VARCHAR(255) NOT NULL,
    clinica_id       INTEGER REFERENCES clinicas(id)  ON DELETE CASCADE,
    entidade_id      INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
    criado_por_cpf   VARCHAR(11)  NOT NULL,
    mapeamentos      JSONB        NOT NULL,
    nivel_cargo_map  JSONB,
    criado_em        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Garante que o template pertence a exatamente um tenant
    CONSTRAINT chk_importacao_template_tenant CHECK (
        (clinica_id IS NOT NULL AND entidade_id IS NULL)
        OR
        (clinica_id IS NULL    AND entidade_id IS NOT NULL)
    )
);

-- =============================================================================
-- Índices de performance (busca por tenant + usuário)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_importacao_templates_clinica_cpf
    ON importacao_templates(clinica_id, criado_por_cpf)
    WHERE clinica_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_importacao_templates_entidade_cpf
    ON importacao_templates(entidade_id, criado_por_cpf)
    WHERE entidade_id IS NOT NULL;

-- =============================================================================
-- Comentários descritivos
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_description d
        JOIN pg_class c ON c.oid = d.objoid
        WHERE c.relname = 'importacao_templates' AND d.objsubid = 0
    ) THEN
        COMMENT ON TABLE importacao_templates IS
            'Templates de mapeamento de colunas para importação em massa. '
            'Cada template é privado do usuário (criado_por_cpf) dentro do tenant '
            '(clinica_id XOR entidade_id).';
    END IF;
END $$;

COMMIT;

SELECT 'migration 1149: tabela importacao_templates criada com sucesso' AS status;
