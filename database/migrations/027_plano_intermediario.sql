-- Migração 027: Adicionar Plano Fixo Intermediário
-- Data: 2025-12-21
-- Objetivo: Criar plano intermediário para empresas de 100-500 funcionários

-- Inserir plano intermediário
INSERT INTO planos (tipo, nome, descricao, valor_fixo_anual, limite_funcionarios, caracteristicas)
VALUES (
    'intermediario',
    'Plano Fixo Intermediário',
    'Para empresas de 100 a 500 funcionários',
    2499.00,
    500,
    jsonb_build_object(
        'minimo_funcionarios', 100,
        'limite_funcionarios', 500,
        'descricao_completa', 'Plano ideal para empresas de médio porte',
        'beneficios', jsonb_build_array(
            'Avaliações ilimitadas',
            'Relatórios avançados',
            'Suporte prioritário',
            'Gestão de lotes'
        )
    )
)
ON CONFLICT DO NOTHING;

-- Atualizar características dos planos existentes para incluir mínimo
UPDATE planos 
SET caracteristicas = jsonb_set(
    COALESCE(caracteristicas, '{}'::jsonb),
    '{minimo_funcionarios}',
    '1'::jsonb
)
WHERE tipo = 'basico' AND caracteristicas->>'minimo_funcionarios' IS NULL;

UPDATE planos 
SET caracteristicas = jsonb_set(
    COALESCE(caracteristicas, '{}'::jsonb),
    '{limite_funcionarios}',
    '99'::jsonb
)
WHERE tipo = 'basico';

UPDATE planos 
SET caracteristicas = jsonb_set(
    COALESCE(caracteristicas, '{}'::jsonb),
    '{minimo_funcionarios}',
    '100'::jsonb
)
WHERE tipo = 'premium' AND caracteristicas->>'minimo_funcionarios' IS NULL;

-- Comentários
COMMENT ON COLUMN planos.caracteristicas IS 'Características do plano em JSON: minimo_funcionarios, limite_funcionarios, beneficios, etc.';
