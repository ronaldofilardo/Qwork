-- Trigger para manter clinica_id dos funcionários sincronizado com a empresa

-- Função para atualizar clinica_id dos funcionários quando clinica_id da empresa muda
CREATE OR REPLACE FUNCTION sync_funcionario_clinica()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar clinica_id dos funcionários desta empresa
    UPDATE funcionarios
    SET clinica_id = NEW.clinica_id
    WHERE empresa_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela empresas_clientes
DROP TRIGGER IF EXISTS trigger_sync_funcionario_clinica ON empresas_clientes;

CREATE TRIGGER trigger_sync_funcionario_clinica
    AFTER UPDATE OF clinica_id ON empresas_clientes
    FOR EACH ROW
    EXECUTE FUNCTION sync_funcionario_clinica();

-- Também, para novos funcionários, garantir que clinica_id seja setado
-- Mas isso deve ser feito no código de inserção

-- Verificar se há inconsistências atuais e corrigir
UPDATE funcionarios
SET
    clinica_id = ec.clinica_id
FROM empresas_clientes ec
WHERE
    funcionarios.empresa_id = ec.id
    AND funcionarios.clinica_id IS DISTINCT
FROM ec.clinica_id;