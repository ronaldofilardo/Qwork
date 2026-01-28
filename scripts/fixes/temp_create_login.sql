-- ATENÇÃO: Este script está OBSOLETO e usa contratante_id incorretamente para perfil RH
-- RH pertence a CLÍNICA (clinica_id), não a contratante diretamente
-- Para criar gestor de ENTIDADE (gestor_entidade), usar contratante_id com tipo='entidade'
-- Para criar gestor de CLÍNICA (rh), usar clinica_id (sem contratante_id)
-- 
-- USAR: scripts/createGestorAccount.cjs (implementa lógica correta)

-- Exemplo CORRETO para entidade:
-- INSERT INTO funcionarios (cpf, nome, email, perfil, contratante_id, empresa_id, clinica_id, funcao, senha_hash, ativo, nivel_cargo)
-- VALUES (...cpf..., ...nome..., ...email..., 'gestor_entidade', ...contratante_id..., NULL, NULL, 'Gestor', ...hash..., true, 'gestao');

-- Exemplo CORRETO para clínica:
-- INSERT INTO funcionarios (cpf, nome, email, perfil, clinica_id, contratante_id, empresa_id, funcao, senha_hash, ativo, nivel_cargo)
-- VALUES (...cpf..., ...nome..., ...email..., 'rh', ...clinica_id..., NULL, NULL, 'Gestor RH', ...hash..., true, 'gestao');

