-- Criar tabela de relacionamento entre clínicas e empresas
-- Esta tabela controla quais empresas cada clínica de medicina ocupacional atende

CREATE TABLE IF NOT EXISTS clinicas_empresas (
    clinica_id INTEGER REFERENCES funcionarios (id) ON DELETE CASCADE,
    empresa_id INTEGER REFERENCES empresas_clientes (id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (clinica_id, empresa_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clinicas_empresas_clinica ON clinicas_empresas (clinica_id);

CREATE INDEX IF NOT EXISTS idx_clinicas_empresas_empresa ON clinicas_empresas (empresa_id);

-- Adicionar coluna clinica_id na tabela empresas_clientes se não existir
-- Isso permite saber qual clínica "dona" de cada empresa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'empresas_clientes'
                 AND column_name = 'clinica_id') THEN
    ALTER TABLE empresas_clientes ADD COLUMN clinica_id INTEGER REFERENCES funcionarios(id);

CREATE INDEX idx_empresas_clientes_clinica ON empresas_clientes (clinica_id);

END IF;

END $$;

-- Inserir dados de exemplo (ajuste conforme necessário)
-- Assumindo que existe uma clínica RH com cpf '11111111111' e uma empresa com id 1
INSERT INTO
    clinicas_empresas (clinica_id, empresa_id)
SELECT f.id, ec.id
FROM
    funcionarios f
    CROSS JOIN empresas_clientes ec
WHERE
    f.cpf = '11111111111' -- CPF do RH
    AND ec.id = 1 -- ID da empresa
    AND NOT EXISTS (
        SELECT 1
        FROM clinicas_empresas ce
        WHERE
            ce.clinica_id = f.id
            AND ce.empresa_id = ec.id
    );

-- Atualizar empresas_clientes com clinica_id
UPDATE empresas_clientes
SET
    clinica_id = (
        SELECT f.id
        FROM funcionarios f
        WHERE
            f.cpf = '11111111111'
    )
WHERE
    clinica_id IS NULL;

COMMENT ON
TABLE clinicas_empresas IS 'Relacionamento entre clínicas de medicina ocupacional e empresas clientes que elas atendem';

COMMENT ON COLUMN clinicas_empresas.clinica_id IS 'ID do funcionário RH que representa a clínica';

COMMENT ON COLUMN clinicas_empresas.empresa_id IS 'ID da empresa cliente atendida pela clínica';