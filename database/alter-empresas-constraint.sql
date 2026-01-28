-- Alterar constraint de empresas_clientes para UNIQUE(clinica_id, cnpj)

-- Primeiro, remover a constraint UNIQUE existente em cnpj
ALTER TABLE empresas_clientes DROP CONSTRAINT empresas_clientes_cnpj_key;

-- Adicionar nova constraint UNIQUE em (clinica_id, cnpj)
ALTER TABLE empresas_clientes ADD CONSTRAINT empresas_clientes_clinica_id_cnpj_key UNIQUE (clinica_id, cnpj);

-- Verificar
SELECT conname, conkey, confkey FROM pg_constraint WHERE conrelid = 'empresas_clientes'::regclass;