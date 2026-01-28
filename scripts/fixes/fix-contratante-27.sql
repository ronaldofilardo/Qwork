-- Aceitar contrato 38
UPDATE contratos SET aceito = true WHERE id = 38;

-- Ativar contratante 27
UPDATE contratantes SET ativa = true, pagamento_confirmado = true, status = 'aprovado' WHERE id = 27;

-- Criar conta de login para responsável
INSERT INTO funcionarios (cpf, nome, email, perfil, contratante_id, funcao, senha_hash, ativo)
SELECT c.responsavel_cpf, c.responsavel_nome, c.responsavel_email, 'rh', c.id, 'Responsável', '$2a$10$VvZNvejsx8bdZiHok8biVua4I6DMy/wUGPIAYpx/NqbNdpWFREHo6', true
FROM contratantes c
WHERE c.id = 27
ON CONFLICT (cpf) DO UPDATE
SET ativo = true, perfil = 'rh', senha_hash = EXCLUDED.senha_hash, contratante_id = EXCLUDED.contratante_id;

-- Criar senha na tabela contratantes_senhas
INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash)
SELECT c.id, c.responsavel_cpf, '$2a$10$VvZNvejsx8bdZiHok8biVua4I6DMy/wUGPIAYpx/NqbNdpWFREHo6'
FROM contratantes c
WHERE c.id = 27
ON CONFLICT (contratante_id) DO UPDATE
SET cpf = EXCLUDED.cpf, senha_hash = EXCLUDED.senha_hash;

-- Verificar resultado
SELECT 
  c.id, c.nome, c.ativa, c.status, c.pagamento_confirmado,
  cr.aceito as contrato_aceito,
  f.cpf as funcionario_cpf, f.nome as funcionario_nome
FROM contratantes c
LEFT JOIN contratos cr ON cr.contratante_id = c.id AND cr.id = 38
LEFT JOIN funcionarios f ON f.contratante_id = c.id AND f.perfil = 'rh'
WHERE c.id = 27;
