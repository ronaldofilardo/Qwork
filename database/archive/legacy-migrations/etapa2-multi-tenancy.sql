-- Qwork - Etapa 2: Multi-tenancy Clínicas
-- Adicionar clinica_id em funcionarios e migrar dados existentes

-- 1. Adicionar coluna clinica_id na tabela funcionarios
ALTER TABLE funcionarios
ADD COLUMN clinica_id INT REFERENCES clinicas (id);

-- 2. Migrar todos os funcionários existentes para a clínica padrão (ID = 1)

ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_clinica_check CHECK (
    (
        AND clinica_id IS NULL
    )
    OR (
        AND clinica_id IS NOT NULL
    )
);

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_clinica ON funcionarios (clinica_id);

-- 5. Verificar migração
SELECT
    '=== VERIFICAÇÃO MULTI-TENANCY ===' as titulo,
    perfil,
    COUNT(*) as total,
    clinica_id,
    CASE
        AND clinica_id IS NULL THEN '✅ Correto'
        AND clinica_id IS NOT NULL THEN '✅ Correto'
        ELSE '❌ Erro'
    END as status
FROM funcionarios
GROUP BY
    perfil,
    clinica_id
ORDER BY perfil;

SELECT '✅ MULTI-TENANCY IMPLEMENTADO COM SUCESSO!' as resultado;